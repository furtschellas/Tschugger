"""Firestore access with a Firebase service account (GitHub secret FIREBASE_SA = the JSON key file).

A service account is not bound by the Firestore rules, so the push collections no longer have to be readable by
everybody: the GitHub Actions read them with this account, delete devices that removed the app, and mark
messages as sent. Without FIREBASE_SA everything falls back to the old public read (and nothing is deleted).
"""
import base64, json, os, secrets, time

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# reads (and the token) are tried again on a short network or server hiccup (not on 429 = daily quota used up: no point);
# writes are not repeated automatically (a create could happen twice)
_RS = requests.Session()
_RS.mount("https://", HTTPAdapter(max_retries=Retry(total=3, connect=3, read=2, backoff_factor=1.5, status_forcelist=(500, 502, 503, 504),
                                                    allowed_methods=frozenset(["GET", "POST"]), raise_on_status=False)))

PROJECT = "tschugger-83692"
API_KEY = "AIzaSyBrHUJumAArmHv92qhZEbUFXSWrwvZaKjQ"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
_TOK = [None, 0]


def sa():
    raw = os.environ.get("FIREBASE_SA", "").strip()
    if not raw: return None
    try: return json.loads(raw)
    except Exception:
        return json.loads(base64.b64decode(raw))


def _b64u(b): return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def sa_token(scope):
    """OAuth access token of the service account for one scope (no cache); None without FIREBASE_SA"""
    acc = sa()
    if not acc: return None
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    now = int(time.time())
    h = _b64u(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
    p = _b64u(json.dumps({"iss": acc["client_email"], "scope": scope,
                          "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3600}).encode())
    key = serialization.load_pem_private_key(acc["private_key"].encode(), None)
    sig = _b64u(key.sign((h + "." + p).encode(), padding.PKCS1v15(), hashes.SHA256()))
    r = _RS.post("https://oauth2.googleapis.com/token", timeout=30,
                      data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": h + "." + p + "." + sig})
    r.raise_for_status()
    return r.json()["access_token"]


def token():
    """OAuth access token for Firestore (cached ~50 min); None without FIREBASE_SA"""
    if _TOK[0] and time.time() < _TOK[1]: return _TOK[0]
    t = sa_token("https://www.googleapis.com/auth/datastore")
    if t: _TOK[0], _TOK[1] = t, time.time() + 3000
    return t


# ---- encryption with the crew key (AES-GCM, base64: iv + ciphertext) – the same format as in the app ----
def enc_json(key, o):
    import secrets
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    iv = secrets.token_bytes(12)
    return base64.b64encode(iv + AESGCM(key).encrypt(iv, json.dumps(o, ensure_ascii=False).encode(), None)).decode()


def dec_json(key, c):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    raw = base64.b64decode(c)
    return json.loads(AESGCM(key).decrypt(raw[:12], raw[12:], None))


def new_broadcast(key, b):
    """automatic «message to everybody»: encrypted, with the server time as «at» (only the last 24 h are sent)"""
    import datetime
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    return create_doc("broadcasts", {"c": enc_json(key, b)}, raw={"at": {"timestampValue": ts}})


def log(*a): print("•", *a, flush=True)


def _auth():
    t = token()
    return ({"Authorization": "Bearer " + t}, {}) if t else ({}, {"key": API_KEY})


def val(v):
    """Firestore REST value → Python"""
    if not isinstance(v, dict): return v
    for k, x in v.items():
        if k == "stringValue" or k == "booleanValue" or k == "timestampValue": return x
        if k == "integerValue": return int(x)
        if k == "doubleValue": return float(x)
        if k == "nullValue": return None
        if k == "arrayValue": return [val(y) for y in x.get("values", [])]
        if k == "mapValue": return {a: val(b) for a, b in x.get("fields", {}).items()}
    return None


def enc(v):
    if isinstance(v, bool): return {"booleanValue": v}
    if isinstance(v, int): return {"integerValue": str(v)}
    if isinstance(v, float): return {"doubleValue": v}
    if v is None: return {"nullValue": None}
    if isinstance(v, list): return {"arrayValue": {"values": [enc(x) for x in v]}}
    if isinstance(v, dict): return {"mapValue": {"fields": {a: enc(b) for a, b in v.items()}}}
    return {"stringValue": str(v)}


def list_docs(col):
    """yields (id, fields as Python dict, updateTime)"""
    h, q = _auth(); tok = None
    while True:
        r = _RS.get(BASE + "/" + col, headers=h, params={"pageSize": 300, **q, **({"pageToken": tok} if tok else {})}, timeout=30)
        r.raise_for_status(); j = r.json()
        for d in j.get("documents", []):
            yield d["name"].rsplit("/", 1)[1], {k: val(v) for k, v in (d.get("fields") or {}).items()}, d.get("updateTime")
        tok = j.get("nextPageToken")
        if not tok: break


def query_since(col, field, iso):
    """yields (id, fields, updateTime) of the documents whose timestamp field is >= iso – reads only those documents
    (listing the whole collection every 10 minutes used up the free Firebase quota)"""
    h, q = _auth()
    body = {"structuredQuery": {"from": [{"collectionId": col}],
                                "where": {"fieldFilter": {"field": {"fieldPath": field}, "op": "GREATER_THAN_OR_EQUAL", "value": {"timestampValue": iso}}}}}
    r = _RS.post(BASE + ":runQuery", headers=h, params=q, json=body, timeout=30)
    r.raise_for_status()
    for x in r.json():
        d = x.get("document")
        if d: yield d["name"].rsplit("/", 1)[1], {k: val(v) for k, v in (d.get("fields") or {}).items()}, d.get("updateTime")


def get_doc(path):
    h, q = _auth()
    r = _RS.get(BASE + "/" + path, headers=h, params=q, timeout=30)
    if r.status_code == 404: return None
    r.raise_for_status()
    return {k: val(v) for k, v in (r.json().get("fields") or {}).items()}


def patch_doc(path, fields, update_time=None):
    """update only the given fields (needs FIREBASE_SA); with update_time: only if nobody changed the document since"""
    h, _ = _auth()
    if not h: return False
    params = [("updateMask.fieldPaths", k) for k in fields]
    if update_time: params.append(("currentDocument.updateTime", update_time))
    r = requests.patch(BASE + "/" + path, headers=h, params=params, json={"fields": {k: enc(v) for k, v in fields.items()}}, timeout=30)
    return r.status_code == 200


def create_doc(col, fields, raw=None):
    """new document with a random id (needs FIREBASE_SA); raw: already encoded Firestore values (e.g. timestamps)"""
    h, _ = _auth()
    if not h: return None
    body = {"fields": {**{k: enc(v) for k, v in fields.items()}, **(raw or {})}}
    r = requests.post(BASE + "/" + col, headers=h, json=body, timeout=30)
    return r.json().get("name", "").rsplit("/", 1)[-1] if r.status_code == 200 else None


def delete_doc(path):
    h, _ = _auth()
    if not h: return False
    return requests.delete(BASE + "/" + path, headers=h, timeout=30).status_code in (200, 404)


AREAS = ("script", "contacts")   # own keys: Drehbuch (only «Drehbuch sehen»), Telefon/E-Mail der Crewliste (only «Telefon/E-Mail sehen»)


def area_key_b64(area, create=True):
    """key of one area (secret/key<area>; the Firestore rules give it only to people with that right); created on first use"""
    if area not in AREAS: raise ValueError(area)
    if not sa(): return ""
    d = get_doc("secret/key" + area) or {}
    k = str(d.get("k") or "").strip()
    if k or not create: return k
    k = base64.b64encode(secrets.token_bytes(32)).decode()
    return k if patch_doc("secret/key" + area, {"k": k, "at": int(time.time())}) else ""


def crew_key_b64():
    """the crew key: from Firestore secret/key (service account) – so a key change needs no secret update – else CREW_KEY"""
    if sa():
        try:
            d = get_doc("secret/key")
            k = str((d or {}).get("k") or "").strip().strip('"\'')
            if k: return k
        except Exception as e:
            print("• Schlüssel aus Firestore nicht lesbar:", type(e).__name__)
        # with the service account the key in Firestore is the only right one: the old secret CREW_KEY is out of date after any key change
        # (messages encrypted with it could not be read by anybody) – no key here; the caller stops
        return ""
    return os.environ.get("CREW_KEY", "").strip().strip('"\'')


# ---------- shooting blocks (App-Verwaltung → Drehblöcke, config/app «blocks»): each block has its own time zone ----------
TZ0 = "Europe/Zurich"
_BLOCKS = [None]


def blocks():
    """the shooting blocks (read once per run); [] without blocks or when config/app cannot be read"""
    if _BLOCKS[0] is None:
        try:
            if not sa(): raise RuntimeError("no service account")   # tests and local runs: Swiss time
            b = (get_doc("config/app") or {}).get("blocks")
            _BLOCKS[0] = [x for x in b if isinstance(x, dict) and x.get("id")] if isinstance(b, list) else []
        except Exception: _BLOCKS[0] = []
    return _BLOCKS[0]


def tz_for(date, days=None):
    """time zone of the block of a date (YYYY-MM-DD): a day of the schedule with "blk" first, then the dates of the blocks; Swiss time otherwise"""
    bl = blocks()
    if not bl or not date: return TZ0
    for d in days or []:
        if isinstance(d, dict) and d.get("date") == date and d.get("blk"):
            for b in bl:
                if b["id"] == d["blk"]: return b.get("tz") or TZ0
    for b in bl:
        if (not b.get("from") or date >= b["from"]) and (not b.get("to") or date <= b["to"]): return b.get("tz") or TZ0
    return TZ0


def tz_at(ms, days=None):
    """time zone in force at a moment (ms): the block of the Swiss date"""
    import datetime, zoneinfo
    return tz_for(datetime.datetime.fromtimestamp(ms / 1000, zoneinfo.ZoneInfo(TZ0)).date().isoformat(), days)

