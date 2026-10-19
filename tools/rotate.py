#!/usr/bin/env python3
"""Schlüssel wechseln (GitHub Action «Schlüssel», von Hand gestartet). Braucht das Dienstkonto (Secret FIREBASE_SA).

  python tools/rotate.py vapid   neuer Push-Schlüssel (VAPID) in Firestore secret/vapid. Die Geräte melden sich beim
                                 nächsten Öffnen der App selbst mit dem neuen Schlüssel an (sobald der Worker ihn meldet);
                                 bis dahin verschicken Worker und GitHub mit dem alten Schlüssel weiter.
  python tools/rotate.py crew    neuer Crew-Schlüssel: alle verschlüsselten Dateien, Bilder (blk/ oder R2), Push-Geräte und
                                 Nachrichten werden neu verschlüsselt, dann wird secret/key ersetzt. Wer entfernt wurde und
                                 den alten Schlüssel kopiert hat, kann neue Stände nicht mehr lesen. Der alte Schlüssel bleibt
                                 nur für das Dienstkonto in secret/keyprev (für den Notfall).

Im öffentlichen Protokoll stehen nur Zahlen, nie Schlüssel.
"""
import base64, glob, hashlib, json, os, secrets, sys, time

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fsadmin  # noqa: E402


log = fsadmin.log


def vapid():
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    k = ec.generate_private_key(ec.SECP256R1())
    pem = k.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode()
    pub = k.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    pub = base64.urlsafe_b64encode(pub).rstrip(b"=").decode()
    old = fsadmin.get_doc("secret/vapid")
    if old and old.get("priv"): fsadmin.patch_doc("secret/vapidprev", {"priv": old["priv"], "pub": old.get("pub", ""), "at": int(time.time())})
    if not fsadmin.patch_doc("secret/vapid", {"priv": pem, "pub": pub, "at": int(time.time())}): sys.exit("secret/vapid nicht geschrieben")
    log("Neuer Push-Schlüssel gespeichert (öffentlicher Teil):", pub)


def reenc(old, new, raw):
    """re-encrypt with the new key; already done (readable with the new key: an interrupted earlier run) → None"""
    try: pt = AESGCM(old).decrypt(raw[:12], raw[12:], None)
    except Exception:
        AESGCM(new).decrypt(raw[:12], raw[12:], None)   # raises if neither key fits
        return None
    iv = secrets.token_bytes(12)
    return iv + AESGCM(new).encrypt(iv, pt, None)


def refile(p, old, new):
    """re-encrypt one .enc.json file; old = key or list of keys (current, previous: a run that stopped after the key change);
    False = already done (interrupted earlier run); raises if no key fits"""
    e = json.load(open(p))
    if "iv" not in e or "ct" not in e: return False
    iv0, ct0 = base64.b64decode(e["iv"]), base64.b64decode(e["ct"])
    pt = None
    for k in (old if isinstance(old, list) else [old]):
        try: pt = AESGCM(k).decrypt(iv0, ct0, None); break
        except Exception: pass
    if pt is None:
        AESGCM(new).decrypt(iv0, ct0, None); return False
    iv = secrets.token_bytes(12)
    e["iv"] = base64.b64encode(iv).decode(); e["ct"] = base64.b64encode(AESGCM(new).encrypt(iv, pt, None)).decode()
    if "stamp" in e: e["stamp"] = hashlib.sha256(new + pt).hexdigest()[:16]
    json.dump(e, open(p, "w")); return True


def crew():
    old_b64 = fsadmin.crew_key_b64()
    if not old_b64: sys.exit("Kein bisheriger Schlüssel")
    old = base64.b64decode(old_b64)
    # the new key is saved FIRST (secret/keynext, only the service account reads it): if the run stops halfway,
    # the next run continues with the same key – nothing that was already re-encrypted is lost
    nx = (fsadmin.get_doc("secret/keynext") or {}).get("k")
    new = base64.b64decode(nx) if nx else secrets.token_bytes(32); new_b64 = base64.b64encode(new).decode()
    if not nx and not fsadmin.patch_doc("secret/keynext", {"k": new_b64, "at": int(time.time())}):
        sys.exit("secret/keynext nicht geschrieben – nichts geändert")
    # 1. encrypted JSON files in the repository
    n = 0
    cprev = (fsadmin.get_doc("secret/keyprev") or {}).get("k")
    colds = [old] + ([base64.b64decode(cprev)] if cprev else [])
    for p in [os.path.join(ROOT, f) for f in ("data.enc.json", "script.enc.json", "media.enc.json", "contacts.enc.json")] + glob.glob(os.path.join(HERE, "*.enc.json")):
        try: n += 1 if refile(p, colds, new) else 0
        except Exception: pass   # not a crew-key file (e.g. Drehbuch/Kontakte with their own key: below)
    # own keys per area (Drehbuch, Telefon/E-Mail): new keys too, saved first in secret/keynext<area> (resumable)
    anew = {}
    for area, fn in (("script", "script.enc.json"), ("contacts", "contacts.enc.json")):
        ao = fsadmin.area_key_b64(area, create=False)
        if not ao: continue
        nxa = (fsadmin.get_doc("secret/keynext" + area) or {}).get("k")
        if not nxa:
            nxa = base64.b64encode(secrets.token_bytes(32)).decode()
            if not fsadmin.patch_doc("secret/keynext" + area, {"k": nxa, "at": int(time.time())}): sys.exit("secret/keynext" + area + " nicht geschrieben")
        prev = (fsadmin.get_doc("secret/keyprev" + area) or {}).get("k")
        olds = [base64.b64decode(ao)] + ([base64.b64decode(prev)] if prev else [])
        try: n += 1 if refile(os.path.join(ROOT, fn), olds, base64.b64decode(nxa)) else 0
        except FileNotFoundError: pass
        except Exception:   # file not (yet) with this key: keep the key, nothing breaks
            log("Bereich", area, "übersprungen (Datei passt nicht zum Bereichsschlüssel)"); continue
        anew[area] = nxa
    log("Dateien neu verschlüsselt:", n)
    try:   # the app polls stamp.json: new stamp, so devices load the newly encrypted data
        st = json.load(open(os.path.join(ROOT, "stamp.json"))); st["s"] = json.load(open(os.path.join(ROOT, "data.enc.json"))).get("stamp", "")
        json.dump(st, open(os.path.join(ROOT, "stamp.json"), "w"))
    except Exception: pass
    # 2. pictures: Cloudflare R2 or blk/ in the repository
    acct, kid, sec = (os.environ.get(k, "").strip() for k in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"))
    if acct and kid and sec:
        import boto3
        from concurrent.futures import ThreadPoolExecutor
        bucket = os.environ.get("R2_BUCKET", "").strip() or "tschugger-blk"
        s3 = boto3.client("s3", endpoint_url="https://%s.r2.cloudflarestorage.com" % acct, aws_access_key_id=kid, aws_secret_access_key=sec, region_name="auto")
        keys = [o["Key"] for pg in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket, Prefix="blk/") for o in pg.get("Contents", [])]
        def one(k):
            raw = s3.get_object(Bucket=bucket, Key=k)["Body"].read()
            try: raw = reenc(old, new, raw)
            except Exception: return
            if raw is None: return
            s3.put_object(Bucket=bucket, Key=k, Body=raw, ContentType="application/octet-stream", CacheControl="public, max-age=31536000, immutable")
        with ThreadPoolExecutor(16) as ex: list(ex.map(one, keys))
        log("Bilder in R2 neu verschlüsselt:", len(keys))
    else:
        files = glob.glob(os.path.join(ROOT, "blk", "*.bin"))
        bad = 0
        for p in files:
            raw = open(p, "rb").read()   # read first: opening for writing would empty the file
            try: out = reenc(old, new, raw)
            except Exception: bad += 1; continue
            if out is None: continue
            open(p, "wb").write(out)
        log("Bilder in blk/ neu verschlüsselt:", len(files) - bad, "· nicht lesbar:", bad, "(ohne R2 wächst das Repository dadurch einmal um ihre Grösse)")
    # 3. push devices and messages in Firestore
    m = 0
    def redo(path, c):
        if not c: return 0
        try: r = reenc(old, new, base64.b64decode(c))
        except Exception: return 0
        if r is None: return 0
        return 1 if fsadmin.patch_doc(path, {"c": base64.b64encode(r).decode()}) else 0
    # push devices, messages and own events (Termine); gcal/feed = imported Google calendar
    for col in ("push", "broadcasts", "events"):
        for did, f, _ in fsadmin.list_docs(col): m += redo(col + "/" + did, f.get("c"))
    m += redo("gcal/feed", (fsadmin.get_doc("gcal/feed") or {}).get("c"))
    log("Firestore-Einträge neu verschlüsselt (Push, Nachrichten, Termine, Kalender):", m)
    # 4. the key itself (last); the old one stays for the service account only
    for area, k in anew.items():
        if k == fsadmin.area_key_b64(area, create=False): continue
        fsadmin.patch_doc("secret/keyprev" + area, {"k": fsadmin.area_key_b64(area, create=False), "at": int(time.time())})
        if not fsadmin.patch_doc("secret/key" + area, {"k": k, "at": int(time.time())}): sys.exit("secret/key" + area + " nicht geschrieben – Dateien NICHT veröffentlichen")
        try: fsadmin.delete_doc("secret/keynext" + area)
        except Exception: pass
    fsadmin.patch_doc("secret/keyprev", {"k": old_b64, "at": int(time.time())})
    if not fsadmin.patch_doc("secret/key", {"k": new_b64}): sys.exit("secret/key nicht geschrieben – Dateien NICHT veröffentlichen")
    try: fsadmin.delete_doc("secret/keynext")
    except Exception: pass
    try: fsadmin.patch_doc("secret/keymeta", {"uids": sorted(members()), "at": int(time.time())})
    except Exception: pass
    log("Neuer Crew-Schlüssel ist aktiv. Das GitHub-Secret CREW_KEY und das Worker-Secret CREW_KEY werden nicht mehr gebraucht (Dienstkonto).")


def members():
    """everybody who can get the crew key: active members (m:uid) plus admins and owners (a:email) –
    blocking somebody (active=false) or removing an admin also counts as «gone»"""
    out = {"m:" + did for did, f, _ in fsadmin.list_docs("members") if f.get("active") is True}
    for col in ("admins", "owners"): out |= {"a:" + did for did, _, _ in fsadmin.list_docs(col)}
    return out


def due():
    """nightly check: was somebody removed since the last key change? then the old key must not open new data any more.
    secret/keymeta.uids = people with access at the last key change (+ everybody added since); only the service account reads it"""
    cur = members(); meta = fsadmin.get_doc("secret/keymeta") or {}
    known = {x if ":" in x else "m:" + x for x in meta.get("uids") or []}   # older entries: plain member uids
    gone = known - cur if meta else set()
    if not gone: fsadmin.patch_doc("secret/keymeta", {"uids": sorted(known | cur), "at": int(meta.get("at") or time.time())})
    print("::notice::Schlüsselwechsel: %s" % ("%d Person(en) entfernt oder gesperrt seit dem letzten Wechsel – neuer Crew-Schlüssel wird erstellt" % len(gone) if gone else "nicht nötig"))
    o = os.environ.get("GITHUB_OUTPUT")
    if o: open(o, "a").write("due=%s\n" % ("true" if gone else "false"))


if __name__ == "__main__":
    if not fsadmin.sa(): sys.exit("FIREBASE_SA fehlt – zuerst das Dienstkonto als GitHub-Secret eintragen")
    what = (sys.argv[1:] or [""])[0]
    if what == "vapid": vapid()
    elif what == "crew": crew()
    elif what == "due": due()
    else: sys.exit("vapid, crew oder due")
