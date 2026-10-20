"""Hourly update of the crew website straight from the production Dropbox (runs in GitHub Actions).

Reads the Dropbox READ-ONLY (only list_folder / download), reads the location sheet, lets Claude turn new or changed
PDFs into the app's data structure, encrypts everything with CREW_KEY and writes data.enc.json / script.enc.json.
Nothing is ever written to Dropbox. The repository is public, so this script never prints file names or content,
only counts and step results.

Environment (GitHub secrets): CREW_KEY, ANTHROPIC_API_KEY, DROPBOX_APP_KEY, DROPBOX_REFRESH_TOKEN,
optional DROPBOX_APP_SECRET, DROPBOX_ROOT (default ns:14935064499), CLAUDE_MODEL, FORCE ("ja" = read everything again).
"""
import os, sys, re, json, base64, hashlib, secrets, datetime, subprocess, tempfile, pathlib, time, html.parser
import requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

R = pathlib.Path(__file__).resolve().parent.parent

def status(state, msg, **extra):
    """status.json (public, no crew data): lets the app show whether the GitHub update runs. Rewritten only when the
    state changes or the last entry is older than 6 h, so an idle hour does not create a commit of its own."""
    p = R / "status.json"; now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
    try: old = json.loads(p.read_text())
    except Exception: old = {}
    new = {"state": state, "msg": msg, **extra}
    same = all(old.get(k) == v for k, v in new.items())
    try: age = (now - datetime.datetime.fromisoformat(old.get("at", "").replace("Z", "+00:00"))).total_seconds()
    except Exception: age = 1e9
    if same and age < 6 * 3600: return
    new["at"] = now.isoformat().replace("+00:00", "Z")
    p.write_text(json.dumps(new, ensure_ascii=False, indent=1) + "\n")

sys.path.insert(0, str(R / "tools"))
import fsadmin  # noqa: E402  (service account: the crew key comes from Firestore secret/key, so a key change needs no secret update)
_missing = [k for k in ("ANTHROPIC_API_KEY", "DROPBOX_APP_KEY", "DROPBOX_REFRESH_TOKEN") if not os.environ.get(k, "").strip()]
if not (os.environ.get("CREW_KEY", "").strip() or os.environ.get("FIREBASE_SA", "").strip()): _missing.insert(0, "CREW_KEY")
if _missing and __name__ == "__main__":
    print("• Noch nicht eingerichtet – fehlende Secrets:", ", ".join(_missing))
    status("setup", "Noch nicht eingerichtet", missing=_missing); sys.exit(0)
KEY = base64.b64decode(fsadmin.crew_key_b64() or os.environ.get("CREW_KEY", "").strip())
ROOT = (os.environ.get("DROPBOX_ROOT") or "ns:14935064499").rstrip("/")
ROOT3D = (os.environ.get("DROPBOX_ROOT_3D") or "ns:13132709057").rstrip("/")
ROOTAUF = (os.environ.get("DROPBOX_ROOT_AUF") or "ns:15240921299").rstrip("/")
ROOTRECCE = (os.environ.get("DROPBOX_ROOT_RECCE") or "ns:13058967505/RECCE").rstrip("/")   # recce photos (in «TSCHUGGER - 3D Locations»)
PIC_DEADLINE = time.time() + 10 * 60   # new previews only for 10 minutes per run; the rest follows in the next runs
PIC_BUDGET = [int(os.environ.get("PIC_BUDGET") or 250)]   # and at most this many new preview files per run (keeps each push small)   # shared folder «AUFLÖSUNG» (in «TSCHUGGER - 3D Locations»)   # shared folder «3D» (weekly prep schedule, floorplans)
MODEL = os.environ.get("CLAUDE_MODEL") or "claude-sonnet-5-5"
FORCE = os.environ.get("FORCE", "").lower() in ("ja", "yes", "true", "1")
EVENT = os.environ.get("GITHUB_EVENT_NAME", "")
TRIGGER = os.environ.get("TRIGGER", "")   # «cron» when the Cloudflare Worker started the run on its schedule
NOW = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

log = fsadmin.log

def write_stamp():
    """stamp.json (public, tiny): the app polls this instead of the whole data file. s = stamp of data.enc.json,
    c = last check of the Dropbox. Rewritten when the data changed, after a manual run, or when c is older than 2 h."""
    p = R / "stamp.json"
    try: s = json.load(open(R / "data.enc.json")).get("stamp", "")
    except Exception: s = ""
    try: old = json.load(open(p))
    except Exception: old = {}
    try: age = (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(old.get("c", "").replace("Z", "+00:00"))).total_seconds()
    except Exception: age = 1e9
    manual = EVENT == "workflow_dispatch" and TRIGGER != "cron"
    if old.get("s") == s and age < 2 * 3600 and not manual: return
    p.write_text(json.dumps({"s": s, "c": NOW}) + "\n")
def _h(x): return "#" + hashlib.sha1(str(x).encode()).hexdigest()[:6]   # short anonymous tag instead of a file name (public log)

# ---------- encryption (same format as tools/publish.py) ----------
def dec_file(p, key=None):
    try:
        e = json.load(open(p))
        pt = AESGCM(key or KEY).decrypt(base64.b64decode(e["iv"]), base64.b64decode(e["ct"]), None)
        return json.loads(pt)
    except FileNotFoundError:
        return None

def enc_file(p, obj, key=None):
    key = key or KEY
    pt = json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    stamp = hashlib.sha256(key + pt).hexdigest()[:16]
    try:
        if json.load(open(p)).get("stamp") == stamp: return False
    except Exception: pass
    iv = secrets.token_bytes(12)
    json.dump({"v": 2, "stamp": stamp, "iv": base64.b64encode(iv).decode(),
               "ct": base64.b64encode(AESGCM(key).encrypt(iv, pt, None)).decode(), "builtAt": NOW}, open(p, "w"))
    return True

# ---------- own keys per area (Drehbuch, Telefon/E-Mail): only people with that right get the key ----------
_AK = {}
def area_key(area):
    if area not in _AK:
        try: k = fsadmin.area_key_b64(area)
        except Exception as e: k = ""; log("Bereichsschlüssel", area, "nicht lesbar:", type(e).__name__)
        _AK[area] = base64.b64decode(k) if k else None
    return _AK[area]

def dec_area(p, area):
    """file of an area; before the first change it was still encrypted with the crew key"""
    k = area_key(area)
    if k:
        try: return dec_file(p, k)
        except Exception: pass
    try: return dec_file(p)
    except Exception: return None

CONTACT_RE = re.compile(r"^(phone|e?mail|tel|mobil|natel)", re.I)

def split_contacts(crew):
    """crew list without phone numbers / e-mail addresses + the contacts on their own: [[group, person, name, {field: value}]]"""
    out, cts = [], []
    for gi, g in enumerate(crew or []):
        g2 = dict(g); ppl = []
        for pi, pp in enumerate(g.get("people") or []):
            if isinstance(pp, dict):
                c = {k: v for k, v in pp.items() if CONTACT_RE.search(k) and v}
                if c: cts.append([gi, pi, pp.get("name") or "", c])
                pp = {k: v for k, v in pp.items() if not CONTACT_RE.search(k)}
            ppl.append(pp)
        if "people" in g: g2["people"] = ppl
        out.append(g2)
    return out, cts

def merge_contacts(crew, cts):
    for gi, pi, name, c in cts or []:
        try:
            pp = crew[gi]["people"][pi]
            if (pp.get("name") or "") == name: pp.update(c)
        except (IndexError, KeyError, TypeError): pass

# ---------- Dropbox (read-only) ----------
class Dbx:
    def __init__(self):
        d = {"grant_type": "refresh_token", "refresh_token": os.environ["DROPBOX_REFRESH_TOKEN"].strip(),
             "client_id": os.environ["DROPBOX_APP_KEY"].strip()}
        if os.environ.get("DROPBOX_APP_SECRET"): d["client_secret"] = os.environ["DROPBOX_APP_SECRET"].strip()
        r = requests.post("https://api.dropboxapi.com/oauth2/token", data=d, timeout=30)
        if r.status_code != 200: sys.exit("Dropbox-Anmeldung fehlgeschlagen (HTTP %s)" % r.status_code)
        self.h = {"Authorization": "Bearer " + r.json()["access_token"]}

    def api(self, ep, body):
        """Dropbox API call with retries on rate limits and server errors; any other error raises"""
        for i in range(4):
            try:
                r = requests.post("https://api.dropboxapi.com/2/" + ep, headers=self.h, timeout=60, json=body)
            except requests.RequestException as ex:
                if i == 3: raise RuntimeError("Dropbox nicht erreichbar: " + type(ex).__name__)
                time.sleep(5 * (i + 1)); continue
            if r.status_code == 200: return r.json()
            if r.status_code in (429, 500, 502, 503, 504) and i < 3:
                time.sleep(int(r.headers.get("Retry-After") or 5 * (i + 1))); continue
            raise RuntimeError("Dropbox HTTP %s (%s)" % (r.status_code, ep))

    def _list(self, path, recursive, nd=True):
        j = self.api("files/list_folder", {"path": path, "recursive": recursive, "include_non_downloadable_files": nd})
        out = list(j["entries"])
        while j.get("has_more"):
            j = self.api("files/list_folder/continue", {"cursor": j["cursor"]}); out += j["entries"]
        return out

    def list_all(self):
        try: out = self._list(ROOT, True, False)
        except Exception as ex: sys.exit("Dropbox-Ordner nicht lesbar (%s)" % str(ex)[:80])
        files = []
        for e in out:
            if e.get(".tag") != "file": continue
            p = e["path_display"].lstrip("/")
            p = re.sub(r"^TSCHUGGER Tigerblood - DISTRO/", "", p)
            files.append({"name": p, "id": e["id"], "modified": e.get("server_modified") or e.get("client_modified"), "size": e.get("size", 0)})
        return files

    def list_path(self, path, recursive=False):
        """children of a folder (files and folders); raises if the folder cannot be read – an empty list always means empty"""
        out = self._list(path, recursive)
        return [{"name": e["name"], "tag": e[".tag"], "id": e.get("id"), "modified": e.get("server_modified") or e.get("client_modified"), "path": e.get("path_display") or "",
                 "size": e.get("size", 0), "hash": e.get("content_hash") or ""} for e in out]

    def download(self, fid):
        r = requests.post("https://content.dropboxapi.com/2/files/download", timeout=180,
                          headers=dict(self.h, **{"Dropbox-API-Arg": json.dumps({"path": fid})}))
        r.raise_for_status(); return r.content

# ---------- where the encrypted pictures live: blk/ in the repository, or Cloudflare R2 when R2_* secrets are set ----------
class BlkStore:
    """R2 mode: files made in this run are written to blk/ locally and uploaded at the end (sync); the repository no
    longer keeps blk/ (the workflow removes it from git). Without R2 everything stays as before (blk/ in the repository)."""
    def __init__(self):
        self.r2 = None; self.keys = set(); self.gone = []
        acct, kid, sec = (os.environ.get(k, "").strip() for k in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"))
        if acct and kid and sec:
            import boto3
            self.bucket = os.environ.get("R2_BUCKET", "").strip() or "tschugger-blk"
            self.r2 = boto3.client("s3", endpoint_url="https://%s.r2.cloudflarestorage.com" % acct, aws_access_key_id=kid,
                                   aws_secret_access_key=sec, region_name="auto")
            for pg in self.r2.get_paginator("list_objects_v2").paginate(Bucket=self.bucket, Prefix="blk/"):
                for o in pg.get("Contents", []): self.keys.add(o["Key"])
            log("Bilder-Speicher: R2,", len(self.keys), "Dateien"); print("::notice::Bilder-Speicher: Cloudflare R2 (%d Dateien im Bucket)" % len(self.keys))
        else:
            miss = [k for k in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY") if not os.environ.get(k, "").strip()]
            print("::notice::Bilder-Speicher: Repository (für R2 fehlt: %s)" % ", ".join(miss))
    def have(self, fn): return fn in self.keys or os.path.exists(fn)
    def files(self):
        loc = {"blk/" + f for f in os.listdir("blk") if f.endswith(".bin")} if os.path.isdir("blk") else set()
        return loc | self.keys
    def remove(self, fn):
        if os.path.exists(fn): os.remove(fn)
        if fn in self.keys: self.gone.append(fn); self.keys.discard(fn)
    def sync(self):
        """R2: upload what is only local, delete what is no longer used"""
        if not self.r2: return
        from concurrent.futures import ThreadPoolExecutor
        up = [fn for fn in self.files() if fn not in self.keys and os.path.exists(fn)]
        def put(fn):
            self.r2.upload_file(fn, self.bucket, fn, ExtraArgs={"ContentType": "application/octet-stream", "CacheControl": "public, max-age=31536000, immutable"})
        with ThreadPoolExecutor(16) as ex: list(ex.map(put, up))
        self.keys.update(up)
        for i in range(0, len(self.gone), 1000):
            self.r2.delete_objects(Bucket=self.bucket, Delete={"Objects": [{"Key": k} for k in self.gone[i:i + 1000]], "Quiet": True})
        log("R2: hochgeladen", len(up), "· gelöscht", len(self.gone)); self.gone = []

BLKS = None
def blk_have(fn): return BLKS.have(fn) if BLKS else os.path.exists(fn)

# ---------- extra blocking pictures: PDF pages and the AUFLÖSUNG folder ----------
BPDFE = {}
IMG_RE = re.compile(r"\.(jpe?g|png|heic|webp)$", re.I)

def _key(e, extra=""):
    return hashlib.sha1((str(e.get("id")) + "|" + str(e.get("modified")) + extra).encode()).hexdigest()[:20]

def _enc_write(fn, data):
    iv = secrets.token_bytes(12)
    open(fn, "wb").write(iv + AESGCM(KEY).encrypt(iv, data, None))

def small_jpeg(data):
    """photo previews: at most 2048 px, JPEG quality 82 (PDF pages are not touched); unchanged if that is not smaller"""
    try:
        import io
        from PIL import Image
        im = Image.open(io.BytesIO(data)).convert("RGB"); im.thumbnail((2048, 2048))
        o = io.BytesIO(); im.save(o, "JPEG", quality=82, optimize=True, progressive=True)
        return o.getvalue() if len(o.getvalue()) < len(data) * 0.92 else data
    except Exception:
        return data

def _thumb(dbx, e, fn):
    """encrypted preview picture of a Dropbox photo (made once, kept in blk/)"""
    if blk_have(fn): return True
    if time.time() > PIC_DEADLINE or PIC_BUDGET[0] <= 0: return False
    PIC_BUDGET[0] -= 1
    try:
        r = requests.post("https://content.dropboxapi.com/2/files/get_thumbnail_v2", timeout=120, headers=dict(dbx.h, **{"Dropbox-API-Arg": json.dumps(
            {"resource": {".tag": "path", "path": e["id"]}, "format": "jpeg", "size": "w2048h1536", "mode": "fitone_bestfit"})}))
        r.raise_for_status(); _enc_write(fn, small_jpeg(r.content)); return True
    except Exception as ex:
        log("Vorschau fehlt:", _h(e["name"]), type(ex).__name__); return False

def _pdf_pages(dbx, e, cache):
    """every page of a PDF as an encrypted JPEG (blk/<key>p<i>.bin); the page count is kept in meta.pdfPages"""
    key = _key(e, "|pdfhd")   # «hd»: pages in full resolution (the earlier 1280 px pages were too blurry for floorplans)
    n = cache.get(key)
    if n is not None and all(blk_have("blk/%sp%d.bin" % (key, i)) for i in range(n)):
        return key, ["blk/%sp%d.bin" % (key, i) for i in range(n)]
    if time.time() > PIC_DEADLINE or PIC_BUDGET[0] <= 0: return key, []
    PIC_BUDGET[0] -= 4
    try:
        with tempfile.TemporaryDirectory() as td:
            src = os.path.join(td, "in.pdf"); open(src, "wb").write(dbx.download(e["id"]))
            subprocess.run(["pdftoppm", "-jpeg", "-jpegopt", "quality=88", "-scale-to", "2400", "-l", "40", src, os.path.join(td, "p")], check=True, timeout=300)
            pages = sorted(f for f in os.listdir(td) if f.startswith("p") and f.endswith(".jpg"))
            out = []
            for i, f in enumerate(pages):
                fn = "blk/%sp%d.bin" % (key, i); _enc_write(fn, open(os.path.join(td, f), "rb").read()); out.append(fn)
        cache[key] = len(out)
        return key, out
    except Exception as ex:
        log("PDF-Seiten nicht erzeugt:", _h(e["name"]), type(ex).__name__); return key, []

def _norm_sc(x):
    x = re.sub(r"^0+(?=\d)", "", str(x).strip()).lower().replace(" ", "")
    return re.sub(r"(?<=\d)([a-z]{1,2})$", lambda m: m.group(1).upper(), x)   # 184c → 184C, 107pt1 stays

SC_RE = r"0*(\d{1,3})(?:\s*((?:pt|sl)\s*\d*)(?![A-Za-z])|([A-Za-z]{1,2})(?![A-Za-z0-9]))?"

def scene_key(s, need_word=True):
    """scene number at the start of a folder or file name: «Scene 186 pt1 A_B_C» → 186pt1, «Scene_25sl2» → 25sl2,
    «Scene 184C.pdf» → 184C, «Scene 012 v2.pdf» → 12 (never «186PT» or «25SL» without the part number)"""
    m = re.match(r"(?i)\s*x?scene[\s_]*" + SC_RE if need_word else r"(?i)\s*" + SC_RE, str(s or ""))
    if not m: return None
    return _norm_sc(m.group(1) + re.sub(r"\s+", "", m.group(2) or m.group(3) or ""))

def is_part(k):
    return bool(re.search(r"(?i)\d(pt|sl)", str(k or "")))

def blk_top(e):
    """blocking entry → (scene folder «Scene_186», sub folders below it, part key of the first sub folder like «186pt1» or None)"""
    pp = e["path"].split("/")
    j = next((i for i, x in enumerate(pp[:-1]) if x.lower().startswith("scene_")), None)
    if j is None: return None, [], None
    subs = pp[j + 1:-1]
    k = scene_key(subs[0]) if subs else None
    return pp[j], subs, (k if is_part(k) else None)

def scenes_in_name(name):
    """scene numbers in a location folder name: «06 LAKE PoliceCar 010_14_16_184C_D_E CH» → 10, 14, 16, 184c, 184d, 184e"""
    out = []
    for w in name.split()[1:]:
        w = re.sub(r"[^\w]", "", w)
        parts = [p for p in w.split("_") if p]
        if not parts: continue
        got, prev = [], None
        for p in parts:
            p = re.sub(r"(?i)(?<=\d)(pp|optional)$", "", p)
            m = re.fullmatch(r"(\d{1,3})((?:pt|sl)\d*|[A-Za-z]{0,2})", p, re.I)
            if m:
                prev = m.group(1); got.append(_norm_sc(m.group(1) + (m.group(2) or "")))
            elif prev and re.fullmatch(r"[A-Za-z]", p):
                got.append(_norm_sc(prev + p))
            else:
                got = None; break
        if got: out += got
    return list(dict.fromkeys(out))

def _web(path, name=None):
    """Dropbox web link (works for everybody who has the folder in their Dropbox)"""
    q = requests.utils.quote
    if name: return "https://www.dropbox.com/home" + q(path) + "?preview=" + q(name)
    return "https://www.dropbox.com/home" + q(path)

SYN = {"polizeistation": "police station", "polizei": "police", "weinkeller": "wine cellar", "keller": "cellar", "denkmal": "monument",
       "strasse": "road street", "see": "lake", "etang": "lake", "brucke": "bridge", "brücke": "bridge", "haus": "house", "aunts": "aunt",
       "kirche": "church chapel", "kapelle": "chapel", "wald": "forest", "spital": "hospital", "schule": "school"}
STOP = {"de", "du", "des", "la", "le", "les", "l", "und", "and", "the", "ext", "int", "rte", "route", "av", "avenue", "rue", "str", "div", "option",
        "opt", "tbc", "tba", "valais", "wallis", "of", "s", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "scene", "scenes"}

def _words(t, syn=True):
    import unicodedata
    t = unicodedata.normalize("NFKD", str(t or "")).encode("ascii", "ignore").decode().lower()
    w = [x for x in re.split(r"[^a-z0-9]+", t) if x and x not in STOP and not x.isdigit()]
    out = set()
    for x in w:
        out.add(x)
        if not syn: continue
        for k, v in SYN.items():
            if k in x: out.update(v.split())
        if x.endswith("s") and len(x) > 4: out.add(x[:-1])
    return out

def add_recce(dbx, days, add):
    allr = dbx.list_path(ROOTRECCE, True)
    if not allr: log("Recce: Ordner nicht lesbar oder leer"); return
    import unicodedata
    for e in allr: e["path"] = unicodedata.normalize("NFC", e["path"])
    # photo folders = folders that directly hold pictures; their name (and the parent's, for «BlockingFotos») describes the place
    pics = {}
    for e in allr:
        if e["tag"] == "file" and IMG_RE.search(e["name"]):
            pics.setdefault(e["path"].rsplit("/", 1)[0], []).append(e)
    # scenes with town, place words (without any town names) and set words
    scenes = {}; rows = []
    for d in days:
        for its in [d.get("items") or []] + ([d.get("parallel")] if isinstance(d.get("parallel"), list) else []) + [(d.get(u) if isinstance(d.get(u), dict) else {}).get("items") or [] for u in ("unit2", "unit3")]:
            for it in its:
                sc = it.get("sc")
                if not sc or not it.get("loc") or str(it.get("loc")).upper().startswith("TBA"): continue
                loc = str(it["loc"]); town = _words(loc.split()[0], False) if loc.split() else set()
                rows.append((_norm_sc(sc), town, (_words(loc, False) - town, _words(loc) - town), _words(it.get("set"))))
    towns = set().union(*[r[1] for r in rows]) if rows else set()
    for sc, town, place, setw in rows:
        scenes.setdefault(sc, []).append((town, (place[0] - towns, place[1] - towns), setw))
    n = 0
    for folder, files in sorted(pics.items(), key=lambda x: x[0], reverse=True):   # newest recce first
        parts = folder.split("/")
        name = parts[-1]
        if re.fullmatch(r"(?i)blocking\s*fotos?|fotos?|photos?|pics?|bilder", name.strip()) and len(parts) > 1: name = parts[-2] + " " + name
        nm = re.sub(r"^\d+\s+", "", name)
        fw = _words(nm); fraw = _words(nm, False)
        datem = re.search(r"(20\d{6})", folder)
        label = nm + (" · " + datem.group(1)[6:8] + "." + datem.group(1)[4:6] + "." if datem else "")
        hit = []
        for sc, rows in scenes.items():
            for town, place, setw in rows:
                if any(len(x) >= 5 for x in place[0] & fraw) or any(len(x) >= 7 for x in place[1] & fw) or (town & fraw and (setw & fw)):
                    hit.append(sc); break
        if not hit: continue
        for e in sorted(files, key=lambda e: e["name"].lower())[:40]:
            fn = "blk/" + _key(e, "|hd") + ".bin"
            if not _thumb(dbx, e, fn): continue
            WANT.add(fn); n += 1
            it = {"n": e["name"], "t": "img", "f": fn, "u": _web(folder, e["name"]), "g": "recce", "l": label}
            for sc in hit: add(sc, "recce", it)
    log("Recce-Bilder zugeordnet:", n)

WANT = set()
NEWS = []      # changes for the automatic push messages (written to pending_push.json, sent after publishing)

def _nz(v): return re.sub(r"[^a-z0-9:]", "", str(v or "").lower())

def day_sig(d):
    """what matters in a day for «changed»: times, scenes, titles, places – normalised (case, spaces, punctuation), so a
    slightly different wording of the same PDF does not count as a change; translations and notes are left out"""
    its = lambda L: [[_nz(i.get(k)) for k in ("t", "end", "sc", "n", "loc", "where")] for i in (L or []) if isinstance(i, dict)]
    u = lambda k: its((d.get(k) or {}).get("items")) if isinstance(d.get(k), dict) else []
    return json.dumps([d.get("kind"), its(d.get("items")), its(d.get("parallel") if isinstance(d.get("parallel"), list) else []), u("unit2"), u("unit3")], ensure_ascii=False, sort_keys=True)

def changed_days(old, new, today):
    """dates from today on that are new, removed or different"""
    iso = lambda d: isinstance(d, dict) and not d.get("older") and re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(d.get("date") or d.get("id") or ""))
    o = {str(d.get("date") or d.get("id")): day_sig(d) for d in old or [] if iso(d)}
    n = {str(d.get("date") or d.get("id")): day_sig(d) for d in new or [] if iso(d)}
    return sorted(k for k in set(o) | set(n) if k >= today and o.get(k) != n.get(k))

def cs_sig(d):
    """callsheet: only times (HH:MM) and scene numbers count – a re-read with other wording is no change"""
    out = []
    def walk(x, path=""):
        if isinstance(x, dict):
            for k in sorted(x):
                if k.startswith("_") or re.search(r"_(fr|it|en|hi)$", k) or k in ("id", "file", "link"): continue
                walk(x[k], path + "/" + k)
        elif isinstance(x, list):
            for i, y in enumerate(x): walk(y, path + "/" + str(i))
        elif isinstance(x, str):
            t = re.findall(r"\b\d{1,2}[:.]\d{2}\b", x)
            if t or re.search(r"/(sc|scene|scenes)(/|$)", path): out.append((path, t or _nz(x)))
    walk(d); return json.dumps(out)
PARTIAL = []   # parts that could not be read in this run: then no picture is deleted (they would only come back later)

def add_more_blocking(dbx, blk, meta, want_files, days=(), locs=(), fpe=()):
    changed = False
    prev = {x.get("name"): x for x in meta.get("blocking") or []}
    # WANT is NOT cleared here: it already holds the pages of the schedule PDF, the callsheets and the Sides (registered earlier
    # in this run) – clearing it made the clean-up below delete exactly those pictures in every run
    cache = dict(meta.get("pdfPages") or {})
    used = set()
    extra = {}  # scene → {"s": [...], "pdf": [...], "loc": [...]} (media items)
    seen_pdf = {}  # (name, size) → already shown

    def add(sc, g, item):
        lst = extra.setdefault(sc, {"s": [], "pdf": [], "loc": [], "recce": []})[g]
        if not any(x["f"] == item["f"] for x in lst): lst.append(item)

    def pdf_items(e, label, u):
        k = (e["name"].lower(), e.get("size"))
        if k in seen_pdf: return seen_pdf[k]
        key, files = _pdf_pages(dbx, e, cache); used.add(key)
        items = [{"n": label + " · " + str(i + 1) + "/" + str(len(files)), "t": "img", "f": f, "u": u, "g": "pdf"} for i, f in enumerate(files)]
        want_files.update(files); seen_pdf[k] = items
        return items

    # (a) pages of the PDFs in the blocking scene folders
    for b in blk:
        folder = b.get("url") or ""
        for e in sorted(BPDFE.get(b["name"], []), key=lambda e: e["name"].lower()):
            _, subs, part = blk_top(e)
            u = folder.replace("&dl=0", "&preview=" + requests.utils.quote(e["name"].replace(" ", "+"), safe="+") + "&dl=0") if "/Scene_" in folder and not subs else _web(os.path.dirname(e["path"]), e["name"])
            part = part or (lambda k: k if is_part(k) else None)(scene_key(e["name"]))
            for it in pdf_items(e, re.sub(r"\.pdf$", "", e["name"], flags=re.I), u):
                if part: add(part, "pdf", dict(it, p=part))   # a part PDF only for its part
                else:
                    for sc in b.get("sc") or []: add(_norm_sc(sc), "pdf", it)

    # (a2) floorplans: every page as a picture (blk/…p<i>.bin), so they open in the app and offline
    for fp, e in fpe:
        if not e: continue
        if e["name"].lower().endswith(".pdf"):
            key, files = _pdf_pages(dbx, e, cache); used.add(key)
        else:
            fn = "blk/" + _key(e, "|fphd") + "p0.bin"; files = [fn] if _thumb(dbx, e, fn) else []
        if files:
            want_files.update(files)
            if fp.get("pg") != files: fp["pg"] = files; changed = True

    # (b) AUFLÖSUNG
    allf = dbx.list_path(ROOTAUF, True)
    if not allf: log("Auflösung: Ordner nicht lesbar oder leer")
    files = [e for e in allf if e["tag"] == "file"]
    tops = {}
    import unicodedata
    for e in allf: e["path"] = unicodedata.normalize("NFC", e["path"])
    shortest = min((e["path"] for e in allf), key=lambda x: x.count("/"), default="/")
    base = shortest.rsplit("/", 1)[0]   # the AUFLÖSUNG folder as this account sees it
    for e in allf:
        e["rel"] = e["path"][len(base):].lstrip("/") if e["path"].startswith(base + "/") else e["path"].lstrip("/")
    for e in files:
        parts = e["rel"].split("/")
        if len(parts) < 2:                   # loose file in the root: only scene PDFs («Scene 047.pdf»)
            k = scene_key(e["name"])
            if k and e["name"].lower().endswith(".pdf"):
                for it in pdf_items(e, re.sub(r"\.pdf$", "", e["name"], flags=re.I), _web(os.path.dirname(e["path"]), e["name"])): add(k, "pdf", it)
            continue
        top = parts[0]; scs = tops.setdefault(top, scenes_in_name(top))
        sub = parts[1] if len(parts) > 2 else ""
        msub = scene_key(sub) if sub else None        # «Scene 186 pt1 A_B_C» → 186pt1
        mfile = scene_key(e["name"])
        if e["name"].lower().endswith(".pdf"):
            sc = msub or mfile
            if not sc: continue
            for it in pdf_items(e, re.sub(r"\.pdf$", "", e["name"], flags=re.I), _web(os.path.dirname(e["path"]), e["name"])): add(sc, "pdf", it)
        elif IMG_RE.search(e["name"]):
            fn = "blk/" + _key(e) + ".bin"
            if not _thumb(dbx, e, fn): continue
            want_files.add(fn)
            it = {"n": e["name"], "t": "img", "f": fn, "u": _web(os.path.dirname(e["path"]), e["name"])}
            if msub:
                add(msub, "s", dict(it, g="s"))
            else:
                for sc in scs: add(sc, "loc", dict(it, g="loc", l=re.sub(r"^\d+\w?\s+", "", sub or top)))
    # (c) RECCE: «RECCE/zRECCE 202609 Wallis/20260917 Wallis/05 Sion POLIZEISTATION EXT/…» – matched to the scenes shot there
    #     (same town or place name as the scene's location, plus a word of the set; scouted alternatives elsewhere stay out)
    try:
        add_recce(dbx, days, add)
    except Exception as ex:
        log("Recce nicht gelesen:", str(ex)[:160]); PARTIAL.append("recce")
    # attach: to the blocking entry of the scene, or a new entry «AUF <scene>»
    by = {}
    for b in blk:
        for sc in b.get("sc") or []: by.setdefault(_norm_sc(sc), b)
    locdir = {}
    for top, scs in tops.items():
        for sc in scs: locdir.setdefault(sc, _web(base + "/" + top))
    for sc in sorted(extra):
        b = by.get(sc)
        if not b:
            b = prev.get("AUF " + sc) or {"name": "AUF " + sc, "sc": [sc], "media": []}
            b["url"] = locdir.get(sc) or _web(base)
            blk.append(b); by[sc] = b
    for b in blk:
        own = [m for m in (b.get("media") or []) if not m.get("g")]
        ex = {"s": [], "pdf": [], "loc": [], "recce": []}
        for sc in b.get("sc") or []:
            for g in ex:
                for it in extra.get(_norm_sc(sc), {}).get(g, []):
                    if not any(x["f"] == it["f"] for x in ex[g]) and not any(x["f"] == it["f"] for x in own): ex[g].append(it)
        b["_new"], b["_rec"] = own + ex["s"] + ex["pdf"] + ex["loc"][:30], ex["recce"][:30]
    # recce pictures only for scenes without any blocking / shot breakdown / set pictures (also not for «5 pt3» when «5» has some) – never mixed
    has = set()
    for b in blk:
        if b["_new"]:
            for sc in b.get("sc") or []: has.add(_norm_sc(sc).lower())
    def base(sc): return re.sub(r"pt\w*$", "", _norm_sc(sc).lower())   # «5 pt3» belongs to scene 5; «25 SL2» (slideshow) not to scene 25
    for b in blk:
        new = b.pop("_new"); rec = b.pop("_rec")
        if not new and not any(_norm_sc(sc).lower() in has or base(sc) in has for sc in b.get("sc") or []): new = rec
        if new != (b.get("media") or []): b["media"] = new; changed = True
    want_files.update(WANT)
    cache = {k: v for k, v in cache.items() if k in used}
    if cache != (meta.get("pdfPages") or {}): meta["pdfPages"] = cache; changed = True
    log("Blocking-Bilder: Recce", len({x["f"] for v in extra.values() for x in v.get("recce", [])}), "·", "PDF-Seiten", sum(len(v["pdf"]) for v in extra.values()), "· Szenenfotos", sum(len(v["s"]) for v in extra.values()), "· Motiv-Bilder", len({x["f"] for v in extra.values() for x in v["loc"]}))
    return changed

# ---------- choosing the newest files (same rules as the Claude task) ----------
def low(f): return f["name"].lower()
SCHED_NEW = []   # the main schedule was read again in this run

def unit_days(txt):
    """shooting days of the schedule PDF text that have their own «2nd unit: …» / «3rd unit: …» section → {"unit2": {3, 5}, "unit3": set()}"""
    out = {"unit2": set(), "unit3": set()}; no = None; seen = False
    for line in (txt or "").splitlines():
        m = re.match(r"\s*Day\s*#\s*(\d+)\b", line)
        if m: no = int(m.group(1)); seen = True; continue
        if re.match(r"\s*Day Off\b", line): no = None; continue
        if no is not None:
            if re.match(r"(?i)\s*2nd\s+unit\s*:", line): out["unit2"].add(no)
            if re.match(r"(?i)\s*3rd\s+unit\s*:", line): out["unit3"].add(no)
    return out if seen else None

UD = {}   # unit_days() of the current schedule PDF

# ---------- scene details from the schedule PDF (Crew, Stunt, Props, Vehicles, SFX, VFX, Mup/Hair, Costume, Notes …) ----------
BD_LABELS = ["Crew", "Special", "Loc", "Elec", "Grip", "Prod", "Stunt", "Set Dec", "Set dressing", "Props", "Vehicles", "SFX", "VFX",
             "PreProd Footage", "Mup/Hair", "Costume", "Sound", "Animals", "Notes", "Story Date"]
_BD_LAB = "|".join(re.escape(x).replace(r"\ ", r"\s+") for x in sorted(BD_LABELS, key=len, reverse=True))
_BD_HEAD = re.compile(r"^[ \t]*(?P<sc>\d{1,3}[A-Z]{0,2})(?:\s{0,6}(?P<pt>(?:pt|SL)[ \t]*\d*[A-Z]?)(?![a-z]))?\s{1,8}(?:(?:\d+[ \t]+)?\d/\d[ \t]+|\d+[ \t]+)?pgs\b", re.M)

def _bd_split(v, sep=","):
    out, cur, depth = [], "", 0
    if sep != ",": return [x.strip(" ,") for x in v.split(sep) if x.strip(" ,")]
    for ch in v:
        depth += (ch == "(") - (ch == ")")
        if ch == "," and depth <= 0: out.append(cur); cur = ""
        else: cur += ch
    out.append(cur)
    return [x.strip(" ,") for x in out if x.strip(" ,")]

def _bd_join(t):
    t = re.sub(r"(?<=[A-Za-z])-\n(?=[A-Za-z])", "-", t)
    return re.sub(r"\s+", " ", t).strip()

def parse_breakdown(txt):
    """schedule PDF text → {day number: {scene key «186pt1a»: {"h": {"FX": "...", "XX": "..."}, "c": [[label, [values]], ...]}}}"""
    t = re.sub(r"(?m)^Tschugger Sched - .*page # \d+[ \t]*$", "", (txt or "").replace("\f", "\n"))   # page footers out, page breaks (\f) as new lines
    days = [(m.start(), int(m.group(1))) for m in re.finditer(r"(?m)^\s*Day\s*#\s*(\d+)\b", t)]
    if not days: return {}
    heads = list(_BD_HEAD.finditer(t))
    stops = sorted([m.start() for m in re.finditer(r"(?m)^\s*(?:\d{1,2}:\d{2}:\s|Day\s*#|Day Off\b|2nd unit:|3rd unit:)", t)] + [h.start() for h in heads] + [len(t)])
    out = {}
    for h in heads:
        no = next((n for p, n in reversed(days) if p < h.start()), None)
        if no is None: continue
        end = next(x for x in stops if x > h.start())
        seg = t[h.end():end]
        key = re.sub(r"\s+", "", (h.group("sc") + (h.group("pt") or ""))).lower().lstrip("0")
        tm = re.search(r"(?m)^\s*\d{1,2}:\d{2}\s*$", seg)
        head = _bd_join(t[h.end():h.end() + (tm.start() if tm else 0)])
        hd = {}
        fx = re.search(r"\bFX:\s*(.*?)(?=\s/\s*\d*\s*XX:|$)", head)
        xx = re.search(r"\bXX:\s*(.*)$", head)
        if fx: hd["FX"] = fx.group(1).strip(" /")
        if xx: hd["XX"] = xx.group(1).strip(" /")
        body = _bd_join(seg[tm.end():] if tm else seg)
        first = re.search(r"(?:^|\s)(?!Loc:)(%s):\s" % _BD_LAB, body)
        cats = []
        if first:
            blk = body[first.start():].strip()
            parts = re.split(r"(?:^|,\s+|(?<=:\s)|\s+(?=(?:%s):\s))(%s):\s+" % (_BD_LAB, _BD_LAB), blk)   # also «Special: Elec: …»
            pre = ""
            for i in range(1, len(parts) - 1, 2):
                lab = re.sub(r"\s+", " ", parts[i]); val = parts[i + 1].strip(" ,")
                if not val:   # «Special: Loc: Road block» stays together as in the PDF
                    pre = lab + ": " if lab == "Special" else ""; continue
                lab, pre = pre + lab, ""
                vals = [val] if lab == "Story Date" else _bd_split(val, " / " if lab == "Notes" else ",")
                for c in cats:
                    if c[0] == lab: c[1] += vals; break
                else: cats.append([lab, vals])
        if cats or hd:
            out.setdefault(no, {})[key] = {"h": hd, "c": cats}
    return out

def fix_units(days, txt=None, ud=None):
    """a 2nd/3rd unit only where the schedule has a «2nd unit:» section (a B-Cam of the 1st unit is no 2nd unit)"""
    ud = ud or unit_days(txt)
    if not ud or not ud["unit2"]: return False   # nothing recognised: better leave everything as it is
    ch = False
    for d in days:
        if d.get("kind") != "shoot": continue
        m = re.search(r"(\d+)", str(d.get("short") or d.get("label") or ""))
        no = int(m.group(1)) if m else None
        for u in ("unit2", "unit3"):
            if d.get(u) and no is not None and no not in ud[u]:
                if isinstance(d[u], dict) and d[u].get("src") not in ("2nd", "also"):   # read from the schedule: the rows go back to the day
                    its = d.setdefault("items", [])
                    for it in d[u].get("items") or []:   # by time, between the rows of the day
                        t = str(it.get("t") or "")
                        at = next((i for i, x in enumerate(its) if t and str(x.get("t") or "") > t), len(its))
                        its.insert(at, it)
                d.pop(u, None); ch = True
                log("Drehplan: Tag %d hat keine %s – Einträge zur 1st Unit" % (no, u))
    return ch

# scenes that are also shown with the 2nd unit although the schedule has them only with the 1st unit (B-Cam):
# (shooting day number, scene) – wished by the production
U2_ALSO = [(1, "186pt1A")]
# days whose whole 2nd-unit sheet is shown although the schedule has no «2nd unit:» section that day (exception wished by the production)
U2_DAY_ALSO = [1]

def u2_also_strip(days):
    """remove what u2_also_add added in an earlier run (added again at the end of every run)"""
    for d in days or []:
        u2 = d.get("unit2")
        if not isinstance(u2, dict): continue
        if u2.get("src") == "also": d.pop("unit2", None); continue
        if any(it.get("also") for it in u2.get("items") or []): u2["items"] = [it for it in u2["items"] if not it.get("also")]

def u2_also_add(days, sheets=None):
    """the 2nd unit of that day: the detailed planning from the 2nd-unit sheet (setups, times, notes of the scene; other scenes
    of the sheet are left out); without a sheet the row of the 1st unit is copied"""
    def cam2(items):   # 2nd unit: the camera setups of the sheet (rows like «A-1», «B-2» after a scene) shown with the scene
        cur = None
        for i in items:
            if i.get("sc"): cur = i; cur["cam"] = "2nd Unit"; continue
            m = re.match(r"\s*([A-Z]{1,2}\s?-?\s?\d+[a-z]?)\b", str(i.get("n") or ""))
            if cur is not None and m:
                cur["cam"] = (cur["cam"] + " · " if cur["cam"] != "2nd Unit" else "2nd Unit · Setups ") + m.group(1).replace(" ", "")
        return items
    for no, sc in U2_ALSO:   # the row of the 1st unit: second camera of the 1st unit
        for d in days or []:
            if d.get("kind") != "shoot": continue
            m = re.search(r"(\d+)", str(d.get("short") or d.get("label") or ""))
            if not m or int(m.group(1)) != no: continue
            for i in d.get("items") or []:
                if _norm_sc(i.get("sc") or "") == _norm_sc(sc) and not i.get("cam"): i["cam"] = "B-Cam · 1st Unit"
    for no in U2_DAY_ALSO:   # the whole sheet of the day
        d = next((x for x in days or [] if x.get("kind") == "shoot" and re.search(r"(\d+)", str(x.get("short") or x.get("label") or "")) and int(re.search(r"(\d+)", str(x.get("short") or x.get("label") or "")).group(1)) == no), None)
        shs = [v.get("u2") for v in (sheets or {}).values() if isinstance(v, dict) and v.get("no") == no and isinstance(v.get("u2"), dict)]
        if not d or not shs or isinstance(d.get("unit2"), dict): continue
        u2 = {k: v for k, v in shs[0].items() if k not in ("items", "src")}
        u2.update({"src": "also", "items": cam2([dict(i, also=True) for sh in shs for i in sh.get("items") or []])})
        d["unit2"] = u2
        print("::notice::2nd Unit Ausnahme: Tag %d mit dem ganzen 2nd-Unit-Sheet (%d Einträge)" % (no, len(u2["items"])))
    for no, sc in U2_ALSO:
        d = next((x for x in days or [] if x.get("kind") == "shoot" and re.search(r"(\d+)", str(x.get("short") or x.get("label") or "")) and int(re.search(r"(\d+)", str(x.get("short") or x.get("label") or "")).group(1)) == no), None)
        if not d: continue
        it = next((i for i in d.get("items") or [] if _norm_sc(i.get("sc") or "") == _norm_sc(sc)), None)
        sh = next((v.get("u2") for v in (sheets or {}).values() if isinstance(v, dict) and v.get("no") == no and isinstance(v.get("u2"), dict)
                   and any(_norm_sc(i.get("sc") or "") == _norm_sc(sc) for i in v["u2"].get("items") or [])), None)
        if not it and not sh: continue
        u2 = d.get("unit2") if isinstance(d.get("unit2"), dict) else None
        if u2 and any(_norm_sc(i.get("sc") or "") == _norm_sc(sc) for i in u2.get("items") or []): continue
        if sh:
            items = cam2([dict(i, also=True) for i in sh.get("items") or [] if not i.get("sc") or _norm_sc(i.get("sc")) == _norm_sc(sc)])
            src = "Planung aus dem 2nd-Unit-Sheet"
        else:
            items = [dict(it, also=True)]; src = "Zeile der 1st Unit"
        if u2 is None:
            u2 = d["unit2"] = {"src": "also", "items": []}
            for k in ("hours", "notes", "notes_i18n"):
                if sh and sh.get(k): u2[k] = sh[k]
        u2.setdefault("items", []).extend(items)
        log("2nd Unit: Szene", sc, "zusätzlich an Tag", no); print("::notice::2nd Unit zusätzlich: Szene %s an Tag %d – %s, %d Einträge (auch bei der 1st Unit)" % (sc, no, src, len(items)))

def pick_schedule(files):
    # the Swiss schedule: in 02_Schedule or a subfolder (formerly 02_Schedule/CH) – not the archive and not India
    c = [f for f in files if low(f).startswith("02_schedule/") and "_archiv" not in low(f) and "india" not in low(f) and low(f).endswith(".pdf")]
    def key(f):
        n = f["name"].rsplit("/", 1)[-1]
        d = re.search(r"(\d{6})", n); v = re.search(r"v(\d+)", n, re.I)
        # the plain full schedule «Tschugger Sched 261018 CH.pdf» first; other layouts of the same version («… Colomns CH»,
        # «… Oneline CH») only when it is missing – their text is laid out differently (scene details, units not readable)
        low_n = n.lower()
        var = 3 if re.search(r"sched\s+\d{6}(\s*v\d+)?\s+ch\.pdf$", low_n) else 0 if "oneline" in low_n else 1 if re.search(r"colomn|column|spalte", low_n) else (2 if re.search(r"\bch\b", low_n) else 1)
        return (d.group(1) if d else "", int(v.group(1)) if v else 0, var, f["modified"] or "")
    return max(c, key=key) if c else None

def script_version(name):
    """«…_v13 CLEAN.pdf» → «v13» (shown in the header after the schedule version)"""
    m = re.search(r"(?:^|[ _-])v(\d+)(?:[ _.-]|$)", name.rsplit("/", 1)[-1].lower())
    return "v" + m.group(1) if m else ""

def pick_changelog(files, version):
    """the changelog that belongs to the script version in the app («Tschugger Script Changelog v13 261017.pdf»)"""
    c = [f for f in files if low(f).startswith("01_script/") and "changelog" in low(f).rsplit("/", 1)[-1] and low(f).endswith(".pdf")
         and version and script_version(f["name"]) == version]
    return max(c, key=lambda f: f["modified"] or "") if c else None

def changelog_parse(txt):
    """scenes named in the changelog (in order) and the text itself – without contact lines (phone numbers, e-mail addresses)"""
    lines = [x.rstrip() for x in txt.replace("\r", "").split("\n")]
    lines = [x for x in lines if not re.search(r"[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d ]{8,}", x)]
    t = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
    sc = []
    for m in re.finditer(r"\bSc\s?(\d+[A-Z]{0,3})\b", t):
        if m.group(1) not in sc: sc.append(m.group(1))
    return {"scenes": sc[:200], "log": t[:8000]}

def pdf_text(raw, layout=True):
    with tempfile.TemporaryDirectory() as td:
        p = pathlib.Path(td) / "c.pdf"; p.write_bytes(raw)
        return subprocess.run(["pdftotext", *(["-layout"] if layout is True else ["-raw"] if layout == "raw" else []), str(p), "-"], capture_output=True, timeout=120).stdout.decode("utf-8", "replace")

def pick_script(files):
    """always the newest CLEAN version (without revision marks): highest «vNN» in the file name; a version without CLEAN is never
    used (it is usually uploaded a few minutes before the CLEAN one); never translations, changelogs, SPP or landscape versions"""
    def ver(f):
        n = low(f).rsplit("/", 1)[-1]
        if not n.endswith(".pdf") or "clean" not in n or re.search(r"spp|querformat|queerformat|changelog|translation|[ _-]en[ _.]", n): return None
        m = re.search(r"(?:^|[ _-])v(\d+)(?:[ _.-]|$)", n)
        return int(m.group(1)) if m else None
    c = [f for f in files if low(f).startswith("01_script/") and "english translation" not in low(f) and ver(f) is not None]
    return max(c, key=lambda f: (ver(f), f["modified"] or "")) if c else None

def pick_crew(files):
    c = [f for f in files if low(f).startswith("03_crewlist/") and "_archiv" not in low(f) and "crewliste" in low(f) and low(f).endswith(".pdf")]
    return max(c, key=lambda f: f["modified"] or "") if c else None

def pick_info(files):
    c = [f for f in files if "/" not in f["name"] and "good_to_know" in low(f) and low(f).endswith(".pdf")]
    return max(c, key=lambda f: f["modified"] or "") if c else None

# the callsheet folder («06_Callsheets», since 19.10. «00_Callsheets»): the number in front does not matter
def _cs(f): return bool(re.match(r"\d{1,2}_callsheets/", low(f))) and "_archiv" not in low(f) and low(f).endswith(".pdf")
def _base(f): return low(f).rsplit("/", 1)[-1]
def _is_sides(f): return "/sides/" in low(f) or re.search(r"(^|[_ -])sides([_ -]|$)", _base(f)) is not None
def _is_ra(f): return re.match(r"ra[_ -]", _base(f)) is not None or re.search(r"gef(ä|ae)hrdungsbeurteilung|risk.?assessment", _base(f)) is not None

def _is_fp(f): return re.search(r"floorplan|grundriss|lageplan|access.?map", _base(f)) is not None

def pick_dispos(files):
    """callsheets («TBO_Dispo_DT01_20261020.pdf», «…Callsheet…») – not the Sides, floorplans or risk assessments of a day folder"""
    return [f for f in files if _cs(f) and not _is_sides(f) and not _is_ra(f) and not _is_fp(f)
            and re.search(r"dispo|call.?sheet|tagesdispo", _base(f))]

def pick_sides(files):
    return [f for f in files if _cs(f) and _is_sides(f) and not _is_ra(f)]

# structure of a callsheet as the production writes it (TBO_Dispo_DT01_20261020.pdf) – the app shows it in this order
CS_A = (
    '{"date": Drehtag YYYY-MM-DD, "label": z. B. "Drehtag 1", "day": "1/34", "office": Produktionsbüro (eine Zeile), '
    '"key": [{"role": "Director"|"DoP"|"1st AD"|"Producer"|"Line Producer"|"Production Manager"|"Production coordinator"|"Harassment Reporting int."|"Harassment Reporting ext.", "name": …, "phone": …}], '
    '"times": {"crewCall", "rehearsal", "rts", "lunch", "wrap"}, "weather", "temp", "sunrise", "sunset", "script", "schedule", '
    '"contact": {"role", "name", "phone"} (CONTACT on Set), "hospital": {"name", "address", "phone"} (nur falls im Dokument), '
    '"lists": [{"title": "Paper"|"Extra Crew"|"Cast"|"Cast Prev."…, "names": Text}], '
    '"locations": [{"no": "1"|"ER"…, "name": "CHAPEL", "scenes": "186pt1A", "map": Karten-Link des Sets, "notes": [Text], '
    '"items": [{"label": "Tech Parking"|"Private Cars Crew"|"Base"|"W / H / M"|"WC"|"DIT/Prod"…, "text": Text, "map": Link}]}], '
    '"info": [Absätze von PRODUCTION INFORMATION], '
    '"order": {"title": Kopfzeile von SHOOTING ORDER, "extras", "pages", "screen", "rows": [Zeile für Zeile in Reihenfolge: '
    'Szene = {"t": Beginn, "dur": Dauer, "dir": "DJ"|"D"…, "sc": Szene, "pgs", "time": Screen-Zeit, "ie": "I/Ev", "set": Motiv, "syn": Synopsis, '
    '"cast": Rollennummern, "extras": Komparsen/Fahrzeuge, "notes": Notes}; sonst = {"t": Zeit, "text": z. B. «Shoot A+B-Cam @ Loc1», «Lunch Break - 1h», «Move B-Cam …»}]}, '
    '"cast": [{"no", "role", "actor", "scenes": [Szenen mit x], "pickup", "call", "wardrobe", "makeup", "base", "onset"}] (CAST @ BASE; '
    'bei "wardrobe" und "makeup" jede belegte Spalte als «Name Zeit Dauer», Name = Personenname aus dem Spaltenkopf (Kopf «Make Up - Marina» → «Marina 07:55 - 08:10 15’»), '
    'mehrere Spalten mit "; " getrennt, ohne Kommentare wie «auch dabei»; ohne Namen im Kopf nur «Zeit Dauer»), '
    '"extras": [{"count", "part", "scenes", "call", "wardrobe", "makeup", "onset"}], '
    '"vehicles": [{"name", "scenes", "via", "call", "rts"}]}'
)
CS_B = (
    '{"drivers": Kopfzeile TRANSPORT with DRIVER, '
    '"transport": [{"vehicle", "driver", "passengers", "from", "t1", "to", "t2"}] (jede Fahrt eine Zeile; Fahrzeug und Fahrer wiederholen), '
    '"travel": [{"how", "name", "from", "t1", "to", "t2", "note"}] (TRAVEL CAST), '
    '"depts": [{"dept": Abteilung, "text": Text}] (INDIVIDUAL INFORMATION BY DEPARTEMENT und die Abteilungszeilen nach PREVISION, z. B. Drone, Grip, Sound, Light, Costume, Make-Up/Hair, Armourer/SFX, Stunt), '
    '"crewTransport": [{"vehicle", "people", "from", "t1", "to", "t2"}] (TRANSPORT CREW), '
    '"prevision": {"title": Kopfzeile PREVISION, "rows": wie bei SHOOTING ORDER: Szene = {"t","dur","dir","sc","pgs","time","ie","set","syn","cast","extras","notes"}, sonst {"t","text"}}, '
    '"calls": [{"dept": Abteilung, "role", "name", "t": Zeit oder Text wie «i.e.d.»}] (CALLS ON SET, beide Spalten), '
    '"total": TOTAL-Zeile, "notes": [Notes], "radio": Funkkanäle, '
    '"sections": [{"title", "rows": [[Zelle, …], …]}] (nur was sonst nirgends passt)}'
)
CS_RULES = ("Antworte mit genau diesem JSON-Objekt, kompakt (ohne Einrückung), in der Reihenfolge und Sprache des Dokuments: "
            "nicht übersetzen, keine Übersetzungsfelder, nichts erfinden, nichts weglassen, Zeiten und Namen genau wie im Dokument, leere Felder weglassen. ")

def cs_texts(cs):
    """texts of the callsheet that are translated: production information, location notes and the labels/texts of their items"""
    out = [str(x) for x in cs.get("info") or [] if x]
    for l in cs.get("locations") or []:
        if not isinstance(l, dict): continue
        out += [str(x) for x in l.get("notes") or [] if x]
        for i in l.get("items") or []:
            if isinstance(i, dict): out += [str(i.get(k)) for k in ("label", "text") if i.get(k)]
    return list(dict.fromkeys(out))

CH_BOX = (45.7, 48.0, 5.8, 10.7)   # Switzerland (and a little around): a position outside is wrong


def in_ch(p): return bool(p) and CH_BOX[0] <= p[0] <= CH_BOX[1] and CH_BOX[2] <= p[1] <= CH_BOX[3]


def dist_km(a, b):
    import math
    return 6371 * 2 * math.asin(math.sqrt(math.sin(math.radians(b[0] - a[0]) / 2) ** 2 + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0])) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2))


def map_pos(u):
    """position of a map link, only from map addresses (never from other numbers of a page):
    «!3d…!4d…» = the place itself (best), «q=lat,lon» = a pin, «@lat,lon» = only the centre of the view (rough).
    maps.app.goo.gl often answers with a page that forwards by script: the Google-Maps address in it is used.
    A link that only names a place («q=Restaurant Waldrand, Susten») gives that text back for the address search."""
    from urllib.parse import unquote, urlparse, parse_qs
    inner = []
    pats = ((r"!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)", "p"), (r"[?&](?:q|ll|query|destination|center)=(-?\d{1,2}\.\d+)(?:,|%2C)\+?(-?\d{1,3}\.\d+)", "q"), (r"@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)", "c"))
    def look(urls):
        for p, q in pats:
            for x in urls:
                m = re.search(p, x)
                if m:
                    pos = [round(float(m.group(1)), 6), round(float(m.group(2)), 6)]
                    if in_ch(pos): return {"p": pos, "q": q}
        return None
    try:
        r = requests.get(u, allow_redirects=True, timeout=20, headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36", "Accept-Language": "de-CH,de"})
        urls = [h.url for h in r.history] + [r.url] + [h.headers.get("Location", "") for h in r.history]
        urls = urls + [unquote(x) for x in urls]
        res = look(urls)
        if not res:   # the forwarding page: only real Google-Maps addresses in it
            body = (r.text or "")[:600000].replace("\\u003d", "=").replace("\\u0026", "&").replace("\\/", "/")
            inner = re.findall(r"https?://(?:www\.)?(?:google\.[a-z.]+/maps|maps\.google\.[a-z.]+)[^\s\"'<>\\]+", body)
            inner = inner + [unquote(x) for x in inner]
            res = look(inner)
            urls += inner
        if res: return res
        pu = urlparse(r.url); segs = [x for x in pu.path.split("/")[1:4] if x in ("maps", "place", "dir", "search", "sorry", "url", "index", "preview", "embed")]
        diag = urlparse(u).netloc + " → " + pu.netloc + "/" + "/".join(segs) + ("?" + ",".join(sorted(parse_qs(pu.query).keys()))[:60] if pu.query else "") + ("" if not inner else " +%d Maps-Links" % len(inner)) + " · HTTP %d · %d Weiterleitungen" % (r.status_code, len(r.history))
        for x in urls:   # a named place instead of coordinates
            try:
                qs = parse_qs(urlparse(x).query); t = (qs.get("q") or qs.get("query") or [""])[0]
                if not t:
                    m = re.search(r"/maps/(?:place|search)/([^/@?]+)", x); t = unquote(m.group(1)).replace("+", " ") if m else ""
                if t and not re.fullmatch(r"[-\d.,\s]+", t): return {"p": None, "q": "", "name": t[:160], "diag": diag, "t": int(time.time())}
            except Exception: pass
        return {"p": None, "q": "", "diag": diag, "t": int(time.time())}
    except Exception as e: log("Kartenlink nicht auflösbar:", type(e).__name__); return None


def geocode_any(addr, cache):
    """address → (position, exact): the whole address, then without the name in front, then street + PLZ + place, at last only PLZ + place (rough)"""
    if not addr: return None, False
    a = re.sub(r"\s+", " ", str(addr)).strip(" ,;")
    parts = [x.strip() for x in a.split(",") if x.strip()]
    tries = [a]
    if len(parts) > 2: tries.append(", ".join(parts[1:]))
    m = re.search(r"([A-Za-zÀ-ÿ.\- ]+?\s*\d+[a-z]?)\s*,?\s*(\d{4})\s+([A-Za-zÀ-ÿ\- ]+)", a)
    if m: tries.append("%s, %s %s" % (m.group(1).strip(), m.group(2), m.group(3).strip()))
    for t in dict.fromkeys(tries):
        p = geocode(t, cache)
        if p and in_ch(p): return p, True
    m = re.search(r"\b(\d{4})\s+([A-Za-zÀ-ÿ\-]+(?:\s[A-Za-zÀ-ÿ\-]+)?)", a)
    if m:
        p = geocode("%s %s" % (m.group(1), m.group(2)), cache)
        if p and in_ch(p): return p, False
    return None, False


ADDR_RE = re.compile(r"([A-Za-zÀ-ÿ.\-]+(?:[ \-][A-Za-zÀ-ÿ.\-]+)*\s+\d+[a-z]?\s*,\s*(?:\d{4}\s+)?[A-Za-zÀ-ÿ\-]+(?:\s[A-Za-zÀ-ÿ\-]+)?|\b\d{4}\s+[A-Za-zÀ-ÿ\-]+)")


def geocode(addr, cache):
    """address → position (OpenStreetMap Nominatim, Switzerland only), cached"""
    if not addr: return None
    if addr in cache: return cache[addr]
    try:
        time.sleep(1.1)
        r = requests.get("https://nominatim.openstreetmap.org/search", params={"q": addr, "format": "json", "limit": 1, "countrycodes": "ch"},
                         headers={"User-Agent": "TschuggerCrewApp/1.0 (furtschellas@gmail.com)"}, timeout=20)
        j = r.json() if r.ok else []
        cache[addr] = [round(float(j[0]["lat"]), 6), round(float(j[0]["lon"]), 6)] if j else None
    except Exception: return None
    return cache[addr]


def cs_scene_list(txt):
    """«186 PT1B/C/PT2» → 186pt1b, 186pt1c, 186pt2 (as in the app)"""
    out = []
    for part in re.split(r"[,;+&]", re.sub(r"\s+", "", str(txt or "")).lower()):
        prev = ""
        for t in part.split("/"):
            if not t: continue
            v = t
            if prev and re.fullmatch(r"[a-z]", t): v = prev[:-1] + t
            elif prev and re.match(r"(pt|sl)\d", t): v = (re.match(r"\d+", prev) or [""])[0] + t if re.match(r"\d+", prev) else t
            out.append(v); prev = v
    return out


def cs_to_dispo(cs, date, f):
    """the fields the rest of the app uses (Today, Meine Termine, push) taken from the structure «cs»"""
    t = cs.get("times") or {}
    d = {"date": date, "label": cs.pop("label", "") or "", "file": f["name"],
         "link": "https://www.dropbox.com/preview/TSCHUGGER%20Tigerblood%20-%20DISTRO/" + requests.utils.quote(f["name"]),
         "crewCall": t.get("crewCall") or "", "shootCall": t.get("rts") or "", "wrap": t.get("wrap") or "",
         "sr": cs.get("sunrise") or "", "ss": cs.get("sunset") or "", "weather": " · ".join(x for x in (cs.get("weather"), cs.get("temp")) if x),
         "calls": [{"dept": c.get("dept") or "", "t": c.get("t") or "", "note": " ".join(x for x in (c.get("role"), c.get("name")) if x)} for c in cs.get("calls") or [] if isinstance(c, dict)],
         "cast": [{"no": c.get("no") or "", "role": c.get("role") or "", "actor": c.get("actor") or "", "pickup": c.get("pickup") or "",
                   "makeup": c.get("makeup") or "", "costume": c.get("wardrobe") or "", "onset": c.get("onset") or ""} for c in cs.get("cast") or [] if isinstance(c, dict)],
         "locations": [{"name": l.get("name") or "", "map": l.get("map") or ""} for l in cs.get("locations") or [] if isinstance(l, dict)],
         "scenes": [{"sc": r.get("sc"), "ie": r.get("ie") or "", "set": r.get("set") or "", "pg": r.get("pgs") or "", "d": r.get("syn") or ""}
                    for r in (cs.get("order") or {}).get("rows") or [] if isinstance(r, dict) and r.get("sc")],
         "cs": cs}
    if isinstance(cs.get("hospital"), dict) and cs["hospital"].get("name"): d["hospital"] = cs["hospital"]
    return {k: v for k, v in d.items() if v not in ("", [], None)}

def pick_ra(files):
    """risk assessments (Gefährdungsbeurteilung) in the callsheet folders, e.g. «DT1/RA_Tschugger_Tigerblood_Bild186_2026-10-20.pdf»"""
    return [f for f in files if _cs(f) and _is_ra(f)]

def sides_date(name):
    """«…_DT 4_Sunday, 25.10.2026.pdf» / «…_DT2_Tuesday, 10.21.2026.pdf» (also US order) → 2026-10-25; none → """""
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", name)
    if not m: return ""
    a, b, y = int(m.group(1)), int(m.group(2)), m.group(3)
    d, mo = (b, a) if a <= 12 < b else (a, b)
    if a <= 12 and b <= 12 and a != b:   # both orders possible (10.06.): the weekday in the name decides
        wd = next((i for i, w in enumerate(("mon", "tue", "wed", "thu", "fri", "sat", "sun")) if re.search(r"(?<![a-z])" + w, name.lower())), None)
        if wd is None:
            wd = next((i for i, w in enumerate(("montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag", "sonntag")) if w in name.lower()), None)
        if wd is not None:
            for dd, mm in ((a, b), (b, a)):
                try:
                    if datetime.date(int(y), mm, dd).weekday() == wd: d, mo = dd, mm; break
                except ValueError: pass
    return "%s-%02d-%02d" % (y, mo, d) if 1 <= mo <= 12 and 1 <= d <= 31 else ""

# ---------- Claude ----------
SPEC = None
def spec():
    global SPEC
    if SPEC is None:
        SPEC = dec_file(R / "tools" / "spec.enc.json")["spec"]
    return SPEC

class Truncated(RuntimeError): pass

def claude(parts, task, max_tokens=32000):
    """parts: list of content blocks; returns parsed JSON from the answer."""
    body = {"model": MODEL, "max_tokens": max_tokens, "stream": True,
            "system": "Du wandelst Produktionsunterlagen eines Filmdrehs in JSON-Daten für eine Crew-App um. Antworte ausschliesslich mit einem einzigen JSON-Wert, ohne Erklärungen und ohne Markdown.\n\n" + spec(),
            "messages": [{"role": "user", "content": parts + [{"type": "text", "text": task}]}]}
    h = {"x-api-key": os.environ["ANTHROPIC_API_KEY"].strip(), "anthropic-version": "2023-06-01", "content-type": "application/json"}
    for attempt in range(3):
        try:
            text = []; stop = ""
            with requests.post("https://api.anthropic.com/v1/messages", headers=h, json=body, stream=True, timeout=(30, 600)) as r:
                if r.status_code != 200:
                    raise RuntimeError("Claude-API HTTP %s: %s" % (r.status_code, r.text[:200]))
                for line in r.iter_lines(decode_unicode=True):
                    if not line or not line.startswith("data:"): continue
                    ev = json.loads(line[5:])
                    if ev.get("type") == "content_block_delta" and ev["delta"].get("type") == "text_delta": text.append(ev["delta"]["text"])
                    if ev.get("type") == "error": raise RuntimeError("Claude-API Fehler: %s" % ev.get("error"))
                    if ev.get("type") == "message_delta" and (ev.get("delta") or {}).get("stop_reason") == "max_tokens": stop = "max_tokens"
            if stop == "max_tokens": raise Truncated("Antwort abgeschnitten (zu lang)")
            t = "".join(text).strip()
            t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
            v = json.loads(t)
            # accept {"crew": [...]} style wrappers where a plain array was asked for
            if isinstance(v, dict) and "Array" in task and len(v) == 1 and isinstance(next(iter(v.values())), list): v = next(iter(v.values()))
            return v
        except Truncated: raise
        except Exception as e:
            log("Claude-Versuch", attempt + 1, "fehlgeschlagen:", type(e).__name__, getattr(getattr(e, "response", None), "status_code", ""))
            time.sleep(10 * (attempt + 1))
    raise RuntimeError("Claude-API: keine gültige Antwort")

def pdf_block(raw): return {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": base64.b64encode(raw).decode()}}

def strip_ids(lst): return [{k: v for k, v in d.items() if k not in ("id", "version")} for d in (lst or [])]

# ---------- screenplay: deterministic parser (text is never translated or rewritten) ----------
SLUG = re.compile(r"^(INT|EXT|I/E|E/I|INT\./EXT|EXT\./INT|SLOW|DIA|FLASH|MONTAGE)", re.I)
def parse_script(text):
    L = text.replace("\r", "").replace("\f", "\n").split("\n"); out = []; cur = None; seen = set()
    def flush():
        if cur:
            t = re.sub(r"\n{3,}", "\n\n", "\n".join(cur["lines"]).strip("\n"))
            out.append({"sc": cur["sc"], "head": cur["head"], "text": t})
    for l in L:
        s = l.strip()
        if re.match(r"^TSCHUGGER TIGERBLOOD - v\d+.*CLEAN VERSION$", s) or s == "(CONTINUED)" or re.match(r"^CONTINUED:\s*\S+(\s+\S+)?$", s): continue
        head = n = None
        m = re.match(r"^(.*?)\s*(\d[\w.]*)\s+\2\s*$", s)          # "INT. KAPELLE - EVENING2 2"
        m2 = re.match(r"^(\d[\w.]*)\s+(.+?)\s+\1$", s)            # "2 INT. KAPELLE - EVENING 2"
        if m2 and SLUG.match(m2.group(2)): n, head = m2.group(1), m2.group(2)
        elif m and len(m.group(1)) > 3: n, head = m.group(2), m.group(1)
        if n:
            if n not in seen:
                seen.add(n); flush(); cur = {"sc": n, "head": head.strip(), "lines": []}; continue
            l = head.strip()   # page-break marker of the running scene: keep the text
        if cur is not None: cur["lines"].append(l.rstrip())
    flush()
    for i, d in enumerate(out): d["order"] = i
    return out

def script_from_pdf(raw):
    best = []
    with tempfile.TemporaryDirectory() as td:
        p = pathlib.Path(td) / "s.pdf"; p.write_bytes(raw)
        for mode in ([], ["-raw"], ["-layout"]):
            try:
                txt = subprocess.run(["pdftotext", *mode, str(p), "-"], capture_output=True, timeout=120).stdout.decode("utf-8", "replace")
            except Exception: continue
            if mode == ["-layout"]: txt = "\n".join(re.sub(r"\s{2,}", " ", x) for x in txt.split("\n"))
            sc = parse_script(txt)
            if len(sc) > len(best): best = sc
    return best

# ---------- location sheet (read-only) ----------
class TableText(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.rows = []; self.row = None; self.cell = None; self.links = []
    def handle_starttag(self, t, a):
        a = dict(a)
        if t == "tr": self.row = []
        elif t in ("td", "th") and self.row is not None: self.cell = []
        elif t == "a" and self.cell is not None and a.get("href"):
            u = a["href"]; m = re.search(r"[?&]q=([^&]+)", u)
            if "google.com/url" in u and m: u = requests.utils.unquote(m.group(1))
            self.cell.append(" <" + u + "> ")
        elif t == "br" and self.cell is not None: self.cell.append(" / ")
    def handle_endtag(self, t):
        if t in ("td", "th") and self.row is not None and self.cell is not None: self.row.append("".join(self.cell).strip()); self.cell = None
        elif t == "tr" and self.row is not None:
            if any(self.row): self.rows.append(self.row)
            self.row = None
    def handle_data(self, d):
        if self.cell is not None: self.cell.append(d)

def read_sheet(url):
    m = re.search(r"/spreadsheets/d/([\w-]+)", url); gid = re.search(r"gid=(\d+)", url)
    if not m: return None
    u = "https://docs.google.com/spreadsheets/d/%s/htmlview%s" % (m.group(1), ("?gid=" + gid.group(1)) if gid else "")
    r = requests.get(u, timeout=60)
    if r.status_code != 200: return None
    p = TableText(); p.feed(r.text)
    rows = [" | ".join(c for c in row) for row in p.rows if sum(1 for c in row if c.strip()) >= 2]
    return "\n".join(rows)

def sheet_csv(url, gid):
    """one tab of a public Google Sheet as text (cells with | separated), via the CSV export"""
    import csv, io
    m = re.search(r"/spreadsheets/d/([\w-]+)", url)
    if not m: return ""
    r = requests.get("https://docs.google.com/spreadsheets/d/%s/export?format=csv&gid=%s" % (m.group(1), gid), timeout=60)
    if r.status_code != 200: print("::warning::Tabelle: Export HTTP %d" % r.status_code); return ""
    r.encoding = "utf-8"
    rows = [" | ".join(c.strip() for c in row) for row in csv.reader(io.StringIO(r.text)) if sum(1 for c in row if c.strip()) >= 2]
    return "\n".join(rows)

GREEN = []   # the 2nd unit tabs were chosen by their green colour
U2SUM = []   # parts of the one 2nd unit line in the run overview
SHEET_HIDDEN = []   # names of the hidden sheets of the last sheet_tabs() call

def _is_green(rgb):
    """tab colours that count for the 2nd unit planning: green (hue 75–170°) and orange (hue 18–48°), clearly coloured
    («FF34A853» green, «FF9900» orange → True; red, yellow, blue, grey → False)"""
    import colorsys
    h = re.sub(r"[^0-9A-Fa-f]", "", str(rgb or ""))[-6:]
    if len(h) != 6: return False
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hu, li, sa = colorsys.rgb_to_hls(r, g, b)
    return (75 <= hu * 360 <= 170 or 18 <= hu * 360 <= 48) and sa >= 0.25 and 0.12 <= li <= 0.92

def sheet_colors(url=None, raw=None):
    """{tab name: {"hidden": bool, "green": bool}} of a public Google Sheet (from the xlsx export: tab colour and visibility)"""
    import io, zipfile, html as _html
    if raw is None:
        m = re.search(r"/spreadsheets/d/([\w-]+)", url or "")
        if not m: return {}
        r = requests.get("https://docs.google.com/spreadsheets/d/%s/export?format=xlsx" % m.group(1), timeout=120)
        if r.status_code != 200: print("::warning::Tabelle: xlsx-Export HTTP %d" % r.status_code); return {}
        raw = r.content
    z = zipfile.ZipFile(io.BytesIO(raw))
    wb = z.read("xl/workbook.xml").decode("utf-8", "replace")
    rels = z.read("xl/_rels/workbook.xml.rels").decode("utf-8", "replace")
    tgt = {a: b for a, b in re.findall(r'<Relationship[^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"', rels)}
    tgt.update({a: b for b, a in re.findall(r'<Relationship[^>]*?Target="([^"]+)"[^>]*?Id="([^"]+)"', rels)})
    theme = {}
    try:   # theme colours (accent1…6 etc.), if the tab colour is given as theme
        th = z.read("xl/theme/theme1.xml").decode("utf-8", "replace")
        sch = re.search(r"<a:clrScheme.*?</a:clrScheme>", th, re.S).group(0)
        for i, (tag, val) in enumerate(re.findall(r"<a:(dk1|lt1|dk2|lt2|accent\d|hlink|folHlink)>.*?(?:srgbClr val|lastClr)=\"([0-9A-Fa-f]{6})\"", sch, re.S)):
            theme[{0: 1, 1: 0, 2: 3, 3: 2}.get(i, i)] = val   # Excel counts lt1, dk1, lt2, dk2, accent1… (the file lists dk1 first)
    except Exception: pass
    out = {}
    for tag in re.findall(r"<sheet\b[^>]*/?>", wb):
        name = _html.unescape((re.search(r'name="([^"]*)"', tag) or [None, ""])[1])
        hidden = bool(re.search(r'state="(hidden|veryHidden)"', tag))
        rid = (re.search(r'r:id="([^"]+)"', tag) or [None, ""])[1]
        path = tgt.get(rid, "")
        path = "xl/" + path.lstrip("/").replace("xl/", "", 1) if path else ""
        green = False
        try:
            x = z.read(path).decode("utf-8", "replace")[:4000]
            tc = re.search(r"<tabColor\b([^>]*)/?>", x)
            if tc:
                rgb = re.search(r'rgb="([0-9A-Fa-f]{6,8})"', tc.group(1))
                thm = re.search(r'theme="(\d+)"', tc.group(1))
                green = _is_green(rgb.group(1) if rgb else theme.get(int(thm.group(1))) if thm else "")
        except Exception: pass
        out[name] = {"hidden": hidden, "green": green}
    return out

def sheet_tabs(url):
    """[(gid, tab name)] of a public Google Sheet (from its html view)"""
    m = re.search(r"/spreadsheets/d/([\w-]+)", url)
    if not m: return []
    r = requests.get("https://docs.google.com/spreadsheets/d/%s/htmlview" % m.group(1), timeout=60)
    if r.status_code != 200: return []
    import html as _html
    clean = lambda n: _html.unescape(re.sub(r"<[^>]+>", "", n)).replace('\\"', '"').strip()
    tabs = re.findall(r'id="sheet-button-(\d+)".*?<a[^>]*>(.*?)</a>', r.text, re.S)
    # every sheet of the script list; hidden sheets have no tab button (or are marked hidden) → ignored
    items = re.findall(r'\{[^{}]*?name:\s*"((?:[^"\\]|\\.)+)"[^{}]*?gid:\s*"?(\d+)[^{}]*\}', r.text)
    hid = {g for n, g in items if re.search(r'(?i)hidden\s*:\s*true', next((m.group(0) for m in re.finditer(r'\{[^{}]*?gid:\s*"?' + g + r'\b[^{}]*\}', r.text)), ""))}
    have = {g for g, _ in tabs}
    if not tabs: tabs = [(g, n) for n, g in items]   # no tab bar in the html (very old layout): all sheets of the list
    SHEET_HIDDEN[:] = [clean(n) for n, g in items if g not in have or g in hid]
    seen = {g for g, _ in tabs}
    return [(g, clean(n)) for g, n in tabs] + [(g, clean(n)) for n, g in items if g not in seen and not seen.add(g)]

# ---------- main ----------
PREP_PLAN_RE = re.compile(r"(?i)weekly|wochen|daily|tages")
def prep_stand(e):
    """«… stand_15.10-1.pdf» → (10, 15, 1): the date and copy number in the name, then the upload time"""
    m = re.search(r"(\d{1,2})\.(\d{1,2})(?:\.\d{2,4})?(?:-(\d+))?\.pdf$", e["name"], re.I)
    return ((int(m.group(2)), int(m.group(1)), int(m.group(3) or 0)) if m else (0, 0, 0), e["modified"] or "")

def compose_prep(plans, cache):
    """plans newest first; each day is taken from the newest document that has it → (days, documents used)"""
    days, have, used = [], set(), []
    for e in plans:
        c = cache.get(e["name"])
        if not c: continue
        add = [dict(d, src=e["name"]) for d in c.get("days") or [] if d.get("date") and d["date"] not in have]
        if add: used.append(e["name"])
        days += add; have.update(d["date"] for d in add)
    return days, used

def norm_sc(x): return re.sub(r"\s+", " ", str(x or "")).strip().lower()


def apply_place_fixes(data):
    """Info page: addresses missing in the «Good to know» PDF, extra entries (e.g. the cast hotel) and hidden phone numbers –
    kept in tools/places_extra.enc.json (encrypted: the repository is public). Only fills gaps, never overrides the PDF."""
    fx = dec_file(R / "tools" / "places_extra.enc.json")
    if not fx: return
    nz = lambda t: re.sub(r"[^a-z0-9]", "", re.sub(r"\(.*?\)", "", str(t or "").lower()))
    def match(name, table):
        n = nz(name)   # exact name first, else the longest matching beginning («Coop Pronto» before «Coop»)
        hits = sorted(((n == nz(k), len(nz(k)), v) for k, v in table.items() if nz(k) and (n == nz(k) or n.startswith(nz(k)))), reverse=True)
        return hits[0][2] if hits else None
    hide = {nz(x) for x in fx.get("hidePhone") or []}
    for cat in data.get("places") or []:
        for it in cat.get("items") or []:
            a = match(it.get("name"), fx.get("address") or {})
            if a and not it.get("address"): it["address"] = a
            ph = match(it.get("name"), fx.get("phone") or {})
            if ph and not it.get("phone"): it["phone"] = ph
            if nz(it.get("name")) in hide or any(nz(it.get("name")).startswith(h) for h in hide): it.pop("phone", None)
        for add in (fx.get("add") or {}).get(cat.get("cat"), []):
            if not any(nz(add.get("name")) == nz(it.get("name")) for it in cat.get("items") or []):
                cat.setdefault("items", []).append(dict(add))


def add_drive_times(data):
    """Anfahrt Crew-Hotel → erstes Motiv je Drehtag (Auto). Geocoding: OpenStreetMap/Nominatim, Route: OSRM.
    Ergebnisse werden in data.meta.geo/route gemerkt, damit nur neue Adressen abgefragt werden."""
    meta = data.setdefault("meta", {})
    geo, route = meta.setdefault("geo", {}), meta.setdefault("route", {})
    hotel = None
    for p in data.get("places") or []:
        if str(p.get("cat", "")).lower().startswith("hotel"):
            for it in p.get("items") or []:
                if it.get("address"): hotel = it; break
        if hotel: break
    if not hotel: log("Anfahrt: kein Crew-Hotel in den Infos"); return
    scene_loc = {}
    for l in data.get("locations") or []:
        for st in l.get("sets") or []:
            for sc in st.get("scenes") or []: scene_loc.setdefault(norm_sc(sc), l)
    H = {"User-Agent": "TschuggerCrewApp/1.0 (furtschellas@gmail.com)"}
    def gc(addr, name=""):
        if geo.get(addr): return geo[addr]
        parts = [x.strip() for x in addr.split(",") if x.strip()]
        cands = [addr] + [", ".join(parts[i:]) for i in range(1, len(parts) - 1)] + ([name + ", " + parts[-1]] if name and parts else [])
        for q in cands:
            try:
                time.sleep(1.1)
                r = requests.get("https://nominatim.openstreetmap.org/search", params={"q": q, "format": "json", "limit": 1, "countrycodes": "ch"}, headers=H, timeout=20)
                j = r.json() if r.ok else []
            except Exception as e:
                log("Geocoding fehlgeschlagen:", type(e).__name__); return None
            if j:
                geo[addr] = [float(j[0]["lat"]), float(j[0]["lon"])]; return geo[addr]
        geo[addr] = None; log("Adresse nicht gefunden:", _h(addr))
        return None
    def rt(a, b):
        k = a + "|" + b
        if route.get(k): return route[k]
        ga, gb = gc(a, hotel.get("name", "")), gc(b)
        if not ga or not gb: return None
        try:
            r = requests.get("https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f" % (ga[1], ga[0], gb[1], gb[0]), params={"overview": "false"}, headers=H, timeout=20)
            j = r.json()
            if j.get("routes"):
                x = j["routes"][0]; route[k] = {"min": int(round(x["duration"] / 60)), "km": round(x["distance"] / 1000, 1)}
        except Exception as e:
            log("Route fehlgeschlagen:", type(e).__name__); return None
        return route.get(k)
    n = 0
    for d in data.get("days") or []:
        if d.get("kind") != "shoot": continue
        loc = None; lname = ""
        for it in d.get("items") or []:
            if it.get("sc"):
                loc = scene_loc.get(norm_sc(it["sc"])) or scene_loc.get(norm_sc(str(it["sc"]).split()[0]))
                if loc: lname = it.get("loc") or ""; break
        if not loc or not loc.get("address"): d.pop("drive", None); continue
        r = rt(hotel["address"], loc["address"])
        if r: d["drive"] = {"from": hotel.get("name", "Hotel"), "to": lname or loc.get("name", ""), "min": r["min"], "km": r["km"]}; n += 1
    log("Anfahrt Hotel → erstes Motiv:", n, "Drehtage")


def rotating():
    """a key change is running (secret/keynext written in the last hour): this run writes nothing – it would encrypt with the old key"""
    if not fsadmin.sa(): return False
    try:
        nx = fsadmin.get_doc("secret/keynext") or {}
        return bool(nx.get("k")) and time.time() - int(nx.get("at") or 0) < 3600
    except Exception: return False

def main():
    WANT.clear()
    if rotating():
        log("Schlüsselwechsel läuft – diese Aktualisierung wird übersprungen"); print("::notice::Schlüsselwechsel läuft – Aktualisierung übersprungen"); return
    cfg = {}
    try:
        if fsadmin.sa():
            cfg = dict(fsadmin.get_doc("config/app") or {}); cfg.update({k: v for k, v in (fsadmin.get_doc("config/private") or {}).items() if v})
        else:
            f = requests.get("https://firestore.googleapis.com/v1/projects/tschugger-83692/databases/(default)/documents/config/app", timeout=20).json().get("fields", {})
            cfg = {k: list(v.values())[0] for k, v in f.items()}
    except Exception: log("App-Einstellungen nicht lesbar – Standard wird verwendet")
    if cfg.get("autoUpdate") is False and (EVENT == "schedule" or TRIGGER == "cron"):
        log("Automatische Aktualisierung ist in den App-Einstellungen ausgeschaltet."); status("off", "In den App-Einstellungen ausgeschaltet"); return

    data = dec_file(R / "data.enc.json") or {}
    if "bm" not in (data.get("meta") or {}) and (R / "media.enc.json").exists():   # picture list from its own file
        data.setdefault("meta", {})["bm"] = (dec_file(R / "media.enc.json") or {}).get("bm") or []
    scr = (dec_area(R / "script.enc.json", "script") or {}).get("script", [])
    if (R / "contacts.enc.json").exists(): merge_contacts(data.get("crew") or [], (dec_area(R / "contacts.enc.json", "contacts") or {}).get("c"))
    u2_also_strip(data.get("days"))
    meta = data.get("meta") or {}
    base = lambda n: (n or "").rsplit("/", 1)[-1]
    old = {(s.get("kind"), base(s.get("name"))): s.get("modified") for s in meta.get("sources", [])}
    oldkind = {}
    for s in meta.get("sources", []): oldkind.setdefault(s.get("kind"), s)
    changed = False; sources = []

    global BLKS
    BLKS = BlkStore()
    if BLKS.r2 and os.environ.get("BLK_BASE", "").strip(): meta["blkBase"] = os.environ["BLK_BASE"].strip().rstrip("/") + "/"
    else: meta.pop("blkBase", None)
    import zoneinfo
    TODAY = datetime.datetime.now(zoneinfo.ZoneInfo("Europe/Zurich")).date().isoformat()
    dbx = Dbx(); files = dbx.list_all(); log("Dropbox gelesen:", len(files), "Dateien")

    def is_new(kind, f): return FORCE or old.get((kind, base(f["name"]))) != f["modified"]
    olds = {(s.get("kind"), base(s.get("name"))): s for s in meta.get("sources", [])}
    fails = dict(meta.get("fails") or {}); seen = set()   # «kind|file|modified» → failed attempts (at most 3 per file version)
    def fkey(kind, f): return kind + ("2" if kind == "dispo" else "") + "|" + base(f["name"]) + "|" + str(f["modified"])   # dispo2: new reading (structure «cs»), fresh tries
    def keep_old(kind, f):
        """the file could not be used: keep the previous entry in the sources, so the file is tried again in the next run"""
        sources[-1] = olds.get((kind, base(f["name"]))) if kind in ("dispo", "prep") else oldkind.get(kind)
    def may_try(kind, f):
        k = fkey(kind, f); seen.add(k)
        if FORCE or fails.get(k, 0) < 3: return True
        keep_old(kind, f); log(kind, "übersprungen nach 3 Fehlversuchen", _h(f["name"])); print("::warning::%s übersprungen nach 3 Fehlversuchen" % kind); return False
    def failed(kind, f, why):
        k = fkey(kind, f); seen.add(k); fails[k] = fails.get(k, 0) + 1
        keep_old(kind, f); log(kind, "nicht übernommen (Versuch %d/3):" % fails[k], str(why)[:120])
        print("::warning::%s nicht übernommen (Versuch %d/3): %s" % (kind, fails[k], why if isinstance(why, str) else type(why).__name__))

    # schedule
    f = pick_schedule(files)
    # once: the 2nd unit of the main schedule was overwritten by the sheet before it was kept → read the schedule again (no push)
    need_main = any(isinstance(d.get("unit2"), dict) and d["unit2"].get("src") == "2nd" for d in data.get("days") or []) and not meta.get("unit2Main")
    if f:
        sources.append({"kind": "schedule", "name": f["name"], "modified": f["modified"]})
        raw_sched = None
        try:   # which days have their own 2nd/3rd unit (checked every run, without AI)
            raw_sched = dbx.download(f["id"]); stxt = pdf_text(raw_sched, False); UD.update(unit_days(stxt) or {})
            try:   # scene details (Crew, Stunt, Props, Vehicles, SFX, VFX, Mup/Hair, Costume, Notes …) per date and scene
                # the PDF text comes out differently depending on the mode: read it in all three and take, per day, the richest result
                want = {}
                for d in data.get("days") or []:
                    m = re.search(r"(\d+)", str(d.get("short") or d.get("label") or "")) if d.get("kind") == "shoot" else None
                    if m: want[int(m.group(1))] = {re.sub(r"\s+", "", str(it.get("sc") or "")).lower().lstrip("0") for its in [d.get("items") or []] + [(d.get(u) or {}).get("items") or [] for u in ("unit2", "unit3") if isinstance(d.get(u), dict)] for it in its if it.get("sc")}
                cands = []
                for mode in (False, "raw", True):
                    try: cands.append(parse_breakdown(stxt if mode is False else pdf_text(raw_sched, mode)))
                    except Exception: pass
                pb = {}
                for no in set().union(*[set(c) for c in cands]) if cands else []:
                    best = max(cands, key=lambda c: (len(set(c.get(no, {})) & want.get(no, set())), -cands.index(c)))   # most scenes of the day; same → plain text before raw before layout
                    pb[no] = dict(best.get(no, {}))
                    for c in cands:   # scenes the best reading missed, from the others
                        for k, v in (c.get(no) or {}).items(): pb[no].setdefault(k, v)
                    if want.get(no): pb[no] = {k: v for k, v in pb[no].items() if k in want[no]}   # only scenes the day really has (no misread numbers)
                bd = {}
                for d in data.get("days") or []:
                    m = re.search(r"(\d+)", str(d.get("short") or d.get("label") or "")) if d.get("kind") == "shoot" else None
                    for k, v in (pb.get(int(m.group(1))) or {}).items() if m else []: bd[d["date"] + "|" + k] = v
                if bd and bd != (meta.get("bd") or {}): meta["bd"] = bd; changed = True
                # missing: a scene of the app without details from the PDF (on its day or, as fallback in the app, on another day)
                have = {k.split("|", 1)[1] for k in bd}
                miss = []
                for d in data.get("days") or []:
                    if d.get("kind") != "shoot": continue
                    for its in [d.get("items") or []] + [(d.get(u) or {}).get("items") or [] for u in ("unit2", "unit3") if isinstance(d.get(u), dict)]:
                        for it in its:
                            k = re.sub(r"\s+", "", str(it.get("sc") or "")).lower().lstrip("0")
                            if k and d["date"] + "|" + k not in bd and k not in have: miss.append("%s %s" % (d.get("short") or d["date"], it.get("sc")))
                # check: every «Topic:» of a scene in the PDF text must have landed in exactly one scene (lines of the day plan «12:00: …» are no scenes)
                tt = _bd_join(re.sub(r"(?m)^\s*\d{1,2}:\d{2}:.*$", "", re.sub(r"(?m)^Tschugger Sched - .*page # \d+[ \t]*$", "", stxt.replace("\f", "\n"))))
                diff = []
                for lab in BD_LABELS:
                    if lab == "Loc": continue   # «Loc:» also starts the location line of every scene
                    n_txt = len(re.findall(r"(?:^|[\s,])%s:\s" % re.escape(lab).replace(r"\ ", r"\s+"), tt))
                    n_bd = sum(1 for day in pb.values() for v in day.values() for c in v.get("c") or [] if c[0] == lab or c[0].startswith(lab + ": ") or c[0].endswith(": " + lab))
                    if n_txt != n_bd: diff.append("%s %d/%d" % (lab, n_bd, n_txt))
                print("::notice::Szenen-Details: %d Szenen an %d Drehtagen%s%s" % (len(bd), len({k.split("|")[0] for k in bd}),
                      (" · FEHLEN: " + ", ".join(miss[:40])) if miss else "", (" · KONTROLLE (übernommen/im PDF): " + ", ".join(diff)) if diff else ""))
            except Exception as e: print("::notice::Szenen-Details nicht gelesen: " + type(e).__name__)
            if UD and fix_units(data.get("days") or [], None, UD): changed = True
        except Exception as e: log("Drehplan-Text nicht gelesen:", type(e).__name__)
        if (is_new("schedule", f) or need_main) and may_try("schedule", f):
          log("Drehplan: neu, wird ausgelesen")
          try:
            raw_sched = raw_sched or dbx.download(f["id"])
            res = claude([pdf_block(raw_sched)],
                "WICHTIG: \"unit2\" nur für Tage, an denen der Drehplan eine eigene Zeile «2nd unit: …» hat. «B-Cam», «A+B-Cam», «Shoot B-Cam only» oder «Move B-Cam» sind eine zweite Kamera der 1st Unit und gehören zu den normalen items des Tages, nie in unit2. "
                "Erzeuge aus diesem Drehplan ein JSON-Objekt {\"scheduleVersion\": \"Sched …\" (aus dem Dateinamen: %s), \"subtitle\": \"Dreh Wallis · TT.MM.–TT.MM.JJJJ\", \"cast\": {Rollennummer: Rollenname}, \"days\": [ein Objekt pro Kalendertag gemäss Collection \"days\", jeweils mit Feld \"id\" = Datum]}. Alle Übersetzungsfelder gemäss Abschnitt ÜBERSETZUNGEN. Bisherige Übersetzungen zum Wiederverwenden (gleicher Text = gleiche Übersetzung): %s"
                % (f["name"].rsplit("/", 1)[-1], json.dumps(strip_ids(data.get("days"))[:40], ensure_ascii=False)[:60000]), 64000)
            days = (res.get("days") if isinstance(res, dict) else None) or []
            fix_units(days, None, UD)
            if len(days) >= max(3, len(data.get("days") or []) // 2):
                SCHED_NEW.append(1)
                for i, d in enumerate(sorted(days, key=lambda d: d.get("date", ""))): d["order"] = i; d["id"] = d.get("date") or d.get("id")
                ch = changed_days(data.get("days"), days, TODAY) if data.get("days") else []
                data["days"] = days; meta["scheduleVersion"] = res.get("scheduleVersion") or meta.get("scheduleVersion")
                if ch and not need_main: NEWS.append({"kind": "plan", "dates": ch, "version": meta.get("scheduleVersion") or ""})
                if res.get("cast"): meta["cast"] = {str(k): v for k, v in res["cast"].items()}
                if res.get("subtitle"): meta["subtitle"] = res["subtitle"]
                changed = True; log("Drehplan:", len(days), "Tage")
            else:
                failed("schedule", f, "Ergebnis unvollständig – bisherige Daten bleiben")
          except Exception as e: failed("schedule", f, e)

    # 2nd unit: the detailed shooting order (Google Sheet, linked in the Dropbox as «…2nd_Unit…SHOOTING_ORDER….web»)
    # replaces the 2nd unit part of each shooting day in the Drehplan; one sheet tab per day («#5-Salgesch»; «ALT» tabs ignored)
    try:
        lk = sorted([f for f in files if f["name"].lower().endswith(".web") and re.search(r"(?i)2nd.?unit", f["name"])], key=lambda f: f["modified"] or "")
        url = ""
        if lk:
            m = re.search(rb"https://[^\s\"'<>]+", dbx.download(lk[-1]["id"])); url = m.group(0).decode() if m else ""
        cache = dict(meta.get("unit2Sheet") or {})
        if not url: print("::notice::2nd Unit: kein Link in der Dropbox gefunden (%d .web-Dateien)" % sum(1 for f in files if f["name"].lower().endswith(".web")))
        if url and "docs.google.com/spreadsheets" in url:
            shoot = [d for d in data.get("days") or [] if d.get("kind") == "shoot"]
            # the 2nd unit as in the main schedule (kept, because the days below get the detailed order from the sheet)
            def dayno(d):
                m = re.search(r"(\d+)", str(d.get("short") or d.get("label") or "")); return int(m.group(1)) if m else None
            mainU2 = {} if SCHED_NEW else dict(meta.get("unit2Main") or {})   # after a new schedule only what it says
            for d in shoot:
                if isinstance(d.get("unit2"), dict) and d["unit2"].get("src") != "2nd": mainU2[d["date"]] = d["unit2"]
            mainU2 = {k: v for k, v in mainU2.items() if any(d["date"] == k and (not UD.get("unit2") or dayno(d) in UD["unit2"]) for d in shoot)}
            def scs(u):
                return {re.sub(r"\s+", "", str(i.get("sc") or "")).lower() for i in (u or {}).get("items") or [] if i.get("sc")}
            newc = {}
            # only GREEN and ORANGE tabs count (also hidden ones); without readable colours: the shown tabs, as before
            tabs = sheet_tabs(url); byday = {}; GREEN.clear()
            try: cols = sheet_colors(url)
            except Exception as e: cols = {}; print("::notice::2nd Unit: Blattfarben nicht lesbar (%s)" % type(e).__name__)
            def dn(n):
                m = re.match(r"\s*#\s*(\d+)", n); return m.group(1) if m else "–"
            if cols:   # strictly: green tabs only, all others ignored (no green tab → the 2nd unit of the main schedule)
                skip = [n for _, n in tabs if not (cols.get(n) or {}).get("green")]
                tabs = [(g, n) for g, n in tabs if (cols.get(n) or {}).get("green")]; GREEN[:] = [1]
                U2SUM.append("%d grüne/orange Blätter (davon %d ausgeblendet; Tag %s), %d andere ignoriert (Tag %s)"
                      % (len(tabs), sum(1 for _, n in tabs if (cols.get(n) or {}).get("hidden")), ",".join(sorted({dn(n) for _, n in tabs}, key=lambda x: (len(x), x))) or "–",
                         len(skip), ",".join(sorted({dn(n) for n in skip}, key=lambda x: (len(x), x))) or "–"))
            else:   # colours not readable: nothing changes, the last good result stays
                print("::warning::2nd Unit: Blattfarben nicht lesbar – bisherige 2nd-Unit-Planung bleibt")
                raise RuntimeError("Blattfarben")
            for gid, name in tabs:   # several tabs of one day (e.g. «#11-Lake-Hospital» and «#11-AuntsHouse») are read together
                m = re.match(r"\s*#\s*(\d+)\b", name)
                if m and (GREEN or not re.search(r"(?i)\balt\b|\bold\b", name)): byday.setdefault(int(m.group(1)), []).append((gid, name))
            for no, v in sorted(byday.items()):
                gid, name = "+".join(g for g, _ in v), " + ".join(n for _, n in v)
                day = next((d for d in shoot if dayno(d) == no), None)
                if not day: continue
                txt = "\n\n".join("BLATT %s:\n%s" % (n, sheet_csv(url, g) or read_sheet(url.split("#")[0].split("?")[0] + "?gid=" + g) or "") for g, n in v)
                if len(txt) < 40: log("2nd Unit Tag %d: Blatt leer (%d Zeichen)" % (no, len(txt))); continue
                h = hashlib.sha256(txt.encode()).hexdigest()[:16]
                old2 = cache.get(gid) or {}
                if old2.get("h") == h and old2.get("u2") and not FORCE: newc[gid] = old2; continue
                if not may_try("unit2", {"name": "2nd-unit-" + name, "modified": h}): log("2nd Unit Tag %d: übersprungen" % no); continue
                try:
                    u2 = claude([{"type": "text", "text": "2ND-UNIT SHOOTING ORDER «%s» (Tabelle, Zellen mit | getrennt):\n%s" % (name, txt[:60000])}],
                        "Erzeuge aus dieser genauen Drehreihenfolge der 2nd Unit für Drehtag %d (%s) ein JSON-Objekt für das Feld \"unit2\" eines Tages gemäss Collection \"days\": "
                        "Arbeitszeit, und \"items\" in der Reihenfolge der Tabelle mit Uhrzeit, Szene, Innen/Aussen und Tageszeit, Seiten, Motiv/Adresse, Cast/Komparsen und Bemerkungen "
                        "(Setups wie A-1/B-2, Rigging, Umbau, Move, Lunch und Wrap als Einträge ohne Szene). Fahrzeuge, Blocker, Grip, Ton und weitere Logistik als \"notes\". "
                        "Alle Übersetzungsfelder gemäss Abschnitt ÜBERSETZUNGEN. Bisheriger 2nd-Unit-Teil dieses Tages aus dem Drehplan (Cast-Nummern und Schreibweisen übernehmen): %s"
                        % (no, day.get("date"), json.dumps(day.get("unit2") or {}, ensure_ascii=False)[:20000]), 32000)
                    if isinstance(u2, dict) and isinstance(u2.get("items"), list) and u2["items"]:
                        u2["src"] = "2nd"; newc[gid] = {"h": h, "no": no, "u2": u2}; log("2nd Unit: Blatt", no, "gelesen,", len(u2["items"]), "Einträge")
                    else: failed("unit2", {"name": "2nd-unit-" + name, "modified": h}, "leer")
                except Exception as e:
                    log("2nd Unit Tag %d: %s" % (no, type(e).__name__)); failed("unit2", {"name": "2nd-unit-" + name, "modified": h}, e)
            U2SUM.append("%d Blätter, Tage %s in der Tabelle, %d gelesen · laut Drehplan an Tag %s"
                  % (len(tabs), ",".join(str(k) for k in sorted(byday)), len(newc), ",".join(str(k) for k in sorted(UD.get("unit2") or [])) or "?"))
            cache = newc
            # the date comes from the main schedule: each sheet goes to the day whose 2nd unit has the same scenes
            # (the tab number only when no scene matches); date, hours, pages and extras stay as in the main schedule
            used = set()
            for c in cache.values():
                want = scs(c["u2"]); best, bn = None, 0
                for d in shoot:
                    n = len(want & scs(mainU2.get(d["date"])))
                    if n > bn: best, bn = d, n
                # without a 2nd unit in the main schedule the day gets none (the tab number alone is not enough)
                day = best or next((d for d in shoot if dayno(d) == c["no"] and d["date"] in mainU2), None)
                if not day: continue
                mu = mainU2.get(day["date"]) or {}
                u2 = dict(c["u2"])
                for k in ("notes", "notes_en", "notes_fr", "notes_it"): u2.pop(k, None)   # the notes of the sheet are not used
                for k in ("hours", "length", "pages", "extras"):
                    if mu.get(k): u2[k] = mu[k]
                    else: u2.pop(k, None)
                used.add(day["date"])
                if day.get("unit2") != u2: day["unit2"] = u2; changed = True
            for d in shoot:   # a sheet that is gone or hidden now: back to the 2nd unit of the main schedule
                if isinstance(d.get("unit2"), dict) and d["unit2"].get("src") == "2nd" and d["date"] not in used and d["date"] in mainU2:
                    d["unit2"] = mainU2[d["date"]]; changed = True
            for d in shoot:   # a 2nd unit from the sheet on a day without a 2nd unit in the main schedule: remove
                if isinstance(d.get("unit2"), dict) and d["unit2"].get("src") == "2nd" and d["date"] not in mainU2:
                    d.pop("unit2", None); changed = True; log("2nd Unit: Tag", dayno(d), "hat laut Drehplan keine 2nd Unit – entfernt")
            if mainU2 != (meta.get("unit2Main") or {}): meta["unit2Main"] = mainU2; changed = True
            U2SUM.append("in der App an Tag " + (",".join(str(dayno(d)) for d in shoot if d.get("unit2")) or "keinem"))
            print("::notice::2nd Unit: " + " · ".join(U2SUM))
            sources.append({"kind": "unit2", "name": "Google Sheet «2nd Unit Shooting Order»", "link": url, "modified": NOW})
        if cache != (meta.get("unit2Sheet") or {}): meta["unit2Sheet"] = cache; changed = True
    except Exception as e: print("::warning::2nd-Unit-Planung nicht gelesen: " + type(e).__name__)

    # the original schedule PDF: every page as a picture, and on which page each shooting day starts («Day #5 …»)
    try:
        sf = pick_schedule(files)
        if sf:
            spg = dict(meta.get("schedPages") or {})
            k, pg = _pdf_pages(dbx, sf, spg); WANT.update(pg)
            # the PDF itself (encrypted with the app): the button opens the real PDF at the page of the day
            pfn = "blk/%s.pdf.bin" % k
            if not blk_have(pfn): _enc_write(pfn, dbx.download(sf["id"]))
            WANT.add(pfn)
            sp_old = meta.get("schedPdf") or {}
            if pg and sp_old.get("pdf") != pfn and sp_old.get("key") == k: sp_old = dict(sp_old, pdf=pfn); meta["schedPdf"] = sp_old; changed = True
            if pg and (sp_old.get("key") != k or sp_old.get("pg") != pg):
                day = {}
                with tempfile.TemporaryDirectory() as td:
                    src = os.path.join(td, "s.pdf"); open(src, "wb").write(dbx.download(sf["id"]))
                    for i in range(len(pg)):
                        t = subprocess.run(["pdftotext", "-layout", "-f", str(i + 1), "-l", str(i + 1), src, "-"], capture_output=True, text=True, timeout=60).stdout
                        for m in re.finditer(r"(?im)^\s*Day\s*#\s*(\d+)\b", t): day.setdefault(m.group(1), i)
                meta["schedPdf"] = {"key": k, "pg": pg, "pdf": pfn, "day": day, "name": sf["name"].split("/")[-1],
                                    "url": "https://www.dropbox.com/preview/TSCHUGGER%20Tigerblood%20-%20DISTRO/" + requests.utils.quote(sf["name"])}
                changed = True
            if {k: spg[k]} != (meta.get("schedPages") or {}) and k in spg: meta["schedPages"] = {k: spg[k]}; changed = True
            print("::notice::Drehplan-PDF: %d Seiten, %d Drehtage gefunden" % (len(pg), len((meta.get("schedPdf") or {}).get("day") or {})))
    except Exception as e: print("::warning::Drehplan-PDF-Seiten nicht erzeugt: " + type(e).__name__)

    # crew
    f = pick_crew(files)
    if f:
        sources.append({"kind": "crew", "name": f["name"], "modified": f["modified"]})
        if is_new("crew", f) and may_try("crew", f):
          log("Crewliste: neu, wird ausgelesen")
          try:
            res = claude([pdf_block(dbx.download(f["id"]))],
                "Erzeuge aus dieser Crewliste ein JSON-Array gemäss Collection \"crew\" (ein Objekt pro Department, mit Feld \"id\" = \"c00\", \"c01\" …), mit den Übersetzungsfeldern. Bisherige Übersetzungen zum Wiederverwenden: %s"
                % json.dumps(strip_ids(data.get("crew")), ensure_ascii=False)[:40000], 32000)
            if isinstance(res, list) and len(res) >= max(2, len(data.get("crew") or []) // 2):
                for i, d in enumerate(res): d["order"] = i; d["id"] = "c%02d" % i
                data["crew"] = res; changed = True; log("Crewliste:", len(res), "Departments")
            else:
                failed("crew", f, "Ergebnis unvollständig – bisherige Daten bleiben")
          except Exception as e: failed("crew", f, e)

    # good-to-know
    f = pick_info(files)
    if f:
        sources.append({"kind": "info", "name": f["name"], "modified": f["modified"]})
        if is_new("info", f) and may_try("info", f):
          log("Infos: neu, werden ausgelesen")
          try:
            res = claude([pdf_block(dbx.download(f["id"]))], "Erzeuge aus diesem Dokument ein JSON-Array gemäss Collection \"places\" (Feld \"id\" = \"p00\", \"p01\" …), mit den Übersetzungsfeldern.", 16000)
            if isinstance(res, list) and res:
                for i, d in enumerate(res): d["order"] = i; d["id"] = "p%02d" % i
                data["places"] = res; changed = True; log("Infos:", len(res), "Kategorien")
            else: failed("info", f, "Ergebnis leer")
          except Exception as e: failed("info", f, e)

    # callsheets: every new or changed file, newest per shooting day wins
    dispos = {d.get("date") or d.get("id"): d for d in (data.get("dispos") or []) if "/sides/" not in str(d.get("file") or "").lower()}
    notcs = {f["name"] for f in files if _cs(f) and (_is_sides(f) or _is_ra(f) or _is_fp(f) or not re.search(r"dispo|call.?sheet|tagesdispo", _base(f)))}
    dispos = {k: v for k, v in dispos.items() if str(v.get("file") or "") not in notcs and "_sides_" not in str(v.get("file") or "").lower()}
    if len(dispos) != len(data.get("dispos") or []): changed = True   # Sides were read as callsheets before: removed
    for f in sorted(pick_dispos(files), key=lambda f: f["modified"] or ""):
        sources.append({"kind": "dispo", "name": f["name"], "modified": f["modified"]})
        have = any(v.get("file") == f["name"] and isinstance(v.get("cs"), dict) and "tr" in v["cs"] and (v["cs"].get("v") or 0) >= 2 for v in dispos.values())   # read before the full structure / translation: again
        if (not is_new("dispo", f) and have) or not may_try("dispo", f): continue
        log("Callsheet: neu, wird ausgelesen")
        try:
            # the callsheet in two parts (one answer was too long): A = head … vehicles, B = transport … calls
            blk = pdf_block(dbx.download(f["id"]))
            a = claude([blk], CS_RULES + "Teil 1 des Callsheets (Tagesdispo): " + CS_A, 32000)
            b = claude([blk], CS_RULES + "Teil 2 des Callsheets (Tagesdispo): " + CS_B, 32000)
            cs = dict(a if isinstance(a, dict) else {}); cs.update(b if isinstance(b, dict) else {})
            cs["v"] = 2   # version 2: wardrobe/make-up with the person of the column
            md = re.search(r"(20\d\d)(\d\d)(\d\d)", f["name"])
            date = str(cs.pop("date", "") or "") or (md and "%s-%s-%s" % md.groups()) or ""
            # locations and production information in the languages of the app (names, places and streets stay as they are)
            try:
                src = [x for x in cs_texts(cs) if x]
                if src:
                    tr = claude([{"type": "text", "text": json.dumps(src, ensure_ascii=False)}],
                        "Übersetze jeden Text dieser JSON-Liste nach de, fr, it, en und hi. Namen, Orte, Strassen, Motiv- und Szenentitel, Zeiten und Links unverändert lassen. "
                        "Antworte kompakt mit {\"de\": [...], \"fr\": [...], \"it\": [...], \"en\": [...], \"hi\": [...]} – gleiche Anzahl und Reihenfolge wie die Liste.", 32000)
                    if isinstance(tr, dict):
                        cs["tr"] = {lg: {o: t for o, t in zip(src, tr.get(lg) or []) if isinstance(t, str) and t and t != o} for lg in ("de", "fr", "it", "en", "hi")}
            except Exception as e: log("Callsheet-Übersetzung:", type(e).__name__)
            d = cs_to_dispo(cs, date, f)
            if isinstance(d, dict) and re.match(r"^\d{4}-\d{2}-\d{2}$", d.get("date", "")):
                prev = dispos.get(d["date"])
                if not prev or (prev.get("_mod") or "") <= (f["modified"] or ""):
                    d["id"] = d["date"]; d["_mod"] = f["modified"]; dispos[d["date"]] = d; changed = True
                    cs = d.get("cs") if isinstance(d.get("cs"), dict) else {}
                    n = lambda k: len(cs.get(k) or []) if isinstance(cs.get(k), list) else 0
                    print("::notice::Callsheet %s eingelesen: Locations %d · Drehfolge %d · Cast %d · Komparsen %d · Transport %d · Abteilungen %d · Calls %d · Vorschau %d"
                          % (d["date"], n("locations"), len((cs.get("order") or {}).get("rows") or []), n("cast"), n("extras"), n("transport"), n("depts"), n("calls"), len((cs.get("prevision") or {}).get("rows") or [])))
                    if d["date"] >= TODAY and (not prev or cs_sig(prev) != cs_sig(d)): NEWS.append({"kind": "cs", "dates": [d["date"]], "upd": bool(prev)})
            else: failed("dispo", f, "kein Drehtag erkannt")
        except Exception as e: failed("dispo", f, e)
    # positions of the callsheet's map links for the map in the app – checked: inside Switzerland, close to the address of the
    # location (Motivliste or the address on the callsheet), not far from the other places of the day; otherwise the address
    mg = meta.setdefault("mapGeo5", {}); [meta.pop(k, None) for k in ("mapGeo", "mapGeo2", "mapGeo3", "mapGeo4")]; gcache = meta.setdefault("geo", {}); stat = {"link": 0, "addr": 0, "rough": 0, "near": 0, "none": 0}
    scene_addr, set_addr = {}, {}
    lcaddr = (meta.get("locCfg") or {}).get("addr") or {}
    day_items = {}
    for dd in data.get("days") or []:
        its = list(dd.get("items") or [])
        for u in ("unit2", "unit3"):
            if isinstance(dd.get(u), dict): its += dd[u].get("items") or []
        day_items[dd.get("date")] = [i for i in its if isinstance(i, dict)]
    for l2 in data.get("locations") or []:
        ad = ", ".join(x for x in (l2.get("venue"), l2.get("address")) if x) if l2.get("address") else ""
        for st in l2.get("sets") or []:
            for sc in st.get("scenes") or []: scene_addr.setdefault(re.sub(r"\s+", "", str(sc)).lower().lstrip("0"), ad)
            for nm in (st.get("name"), st.get("set")):
                if nm and ad: set_addr.setdefault(re.sub(r"[^a-z0-9]", "", str(nm).lower()), ad)
    for d in dispos.values():
        cs = d.get("cs") if isinstance(d.get("cs"), dict) else None
        if not cs: continue
        cand = []   # (url, address)
        parent = {}   # url of a point of a set → url of the set (a parking without position is shown roughly at its set)
        labs = {}   # url → short label for the diagnosis (S1, S2 … or the kind of item like «Tech Parking»)
        for li, l in enumerate(cs.get("locations") or []):
            if not isinstance(l, dict): continue
            if l.get("map"): labs.setdefault(l["map"], "S%d" % (li + 1))
            for i in l.get("items") or []:
                if isinstance(i, dict) and i.get("map"): labs.setdefault(i["map"], "S%d·%s" % (li + 1, re.sub(r"[^A-Za-z/ ]", "", str(i.get("label") or "Punkt"))[:18].strip()))
            # the Motivliste: a set with one of the scenes (also only the number: «186» for «186pt1A»), else a set with the same name
            keys = [x.lstrip("0") for x in cs_scene_list(l.get("scenes"))]
            keys += [re.sub(r"(pt|sl)\d+[a-z]?$", "", k) for k in keys] + [re.sub(r"[a-z]$", "", k) for k in keys]
            ad = ""
            for it in day_items.get(d.get("date"), []):   # the schedule of the day: the place of these scenes → its address (place settings of the app)
                k = re.sub(r"\s+", "", str(it.get("sc") or "")).lower().lstrip("0")
                if k and (k in keys or re.sub(r"(pt|sl)\d+[a-z]?$", "", k) in keys) and it.get("loc"):
                    ad = lcaddr.get(re.sub(r"\s+", "", str(it["loc"]).lower()), "")
                    if ad: break
            ad = ad or next((scene_addr[k] for k in keys if scene_addr.get(k)), "") or set_addr.get(re.sub(r"[^a-z0-9]", "", str(l.get("name") or "").lower()), "")
            if not ad:   # an address in the notes of the location on the callsheet
                for nt in l.get("notes") or []:
                    m = ADDR_RE.search(str(nt))
                    if m: ad = m.group(1).strip(); break
            if l.get("map"): parent[l["map"]] = l["map"]
            if l.get("map"): cand.append((l["map"], ad))
            for i in l.get("items") or []:
                if isinstance(i, dict) and i.get("map"):
                    m = ADDR_RE.search(str(i.get("text") or ""))
                    cand.append((i["map"], m.group(1).strip() if m else ""))
                    if l.get("map"): parent[i["map"]] = l["map"]
        g, src, pos = {}, {}, {}
        for u, ad in cand:
            if u not in mg or mg[u] is None or (not (mg[u] or {}).get("p") and ("diag" not in (mg[u] or {}) or time.time() - int((mg[u] or {}).get("t") or 0) > 6 * 3600)): mg[u] = map_pos(u)
            lp = (mg.get(u) or {}).get("p"); q = (mg.get(u) or {}).get("q")
            nm = (mg.get(u) or {}).get("name") or ""
            ap, exact = geocode_any(ad, gcache) if ad else (geocode_any(nm, gcache) if nm else (None, False))
            if lp and ap and exact and dist_km(lp, ap) > 2: pos[u] = (ap, "addr")          # link and address disagree: the address wins
            elif lp: pos[u] = (lp, "link" if q in ("p", "q") else "rough")
            elif ap: pos[u] = (ap, "addr" if exact else "rough")
        for u, ad in cand:   # 3: a point of a set without any position: roughly at its set (marked in the app)
            if u not in pos and parent.get(u) in pos and parent[u] != u: pos[u] = (pos[parent[u]][0], "near")
        rep = []
        for u, ad in cand:
            if u in pos: g[u] = pos[u][0]; src[u] = pos[u][1]; stat[pos[u][1]] += 1
            else: stat["none"] += 1
            v = mg.get(u) or {}
            rep.append("%s: %s" % (labs.get(u, "?"), ("✓ " + {"link": "Link", "addr": "Adresse", "rough": "ungefähr", "near": "beim Set"}[pos[u][1]]) if u in pos else
                       "✗ Link ohne Position (%s)%s" % ((v.get("diag") or "?").split(" · ")[0], ", keine Adresse" if not ad else ", Adresse nicht gefunden")))
        print("::notice::Karte %s: %s" % (d.get("date"), " | ".join(rep)[:900]))
        if g != (cs.get("geo") or {}) or src != (cs.get("geoSrc") or {}): cs["geo"] = g; cs["geoSrc"] = src; changed = True
    diags = {}
    for v in mg.values():
        if isinstance(v, dict) and not v.get("p"): k = (v.get("diag") or "?") + (" · Ortsname" if v.get("name") else ""); diags[k] = diags.get(k, 0) + 1
    print("::notice::Karte-Diagnose: Orte-Einstellungen %d Adressen, Motivliste %d Szenen mit Adresse · ohne Position: %s" % (len(lcaddr), sum(1 for v in scene_addr.values() if v), "; ".join("%s ×%d" % kv for kv in diags.items()) or "keine"))
    if any(stat.values()): print("::notice::Karte: %d Orte aus dem Kartenlink, %d über die Adresse korrigiert/ergänzt, %d nur ungefähr, %d beim Set, %d ohne Position" % (stat["link"], stat["addr"], stat["rough"], stat["near"], stat["none"]))
    # the original pages of every callsheet and the Sides (script pages of the day) as pictures in the app (also offline)
    spc = dict(meta.get("sidesPages") or {}); used = set()
    try:
        byfile = {f["name"]: f for f in pick_dispos(files)}
        for d in dispos.values():
            f = byfile.get(d.get("file") or "")
            if not f: continue
            k, pg = _pdf_pages(dbx, f, spc); used.add(k); WANT.update(pg)
            if pg and d.get("pg") != pg: d["pg"] = pg; changed = True
        sides = []
        shoot = {}
        for d in data.get("days") or []:
            m = re.search(r"(\d+)", str(d.get("short") or d.get("label") or ""))
            if d.get("kind") == "shoot" and m: shoot[int(m.group(1))] = d.get("date")
        for f in sorted(pick_sides(files), key=lambda f: f["name"]):
            k, pg = _pdf_pages(dbx, f, spc); used.add(k); WANT.update(pg)
            # no pages yet (picture budget of this run used up, e.g. after a folder was renamed): the button opens the PDF anyway
            nm = f["name"].split("/")[-1]
            m = re.search(r"(?i)DT\s*#?\s*(\d+)", nm) or re.search(r"(?i)/DT\s*(\d+)/", f["name"])   # the day folder (DT1/…) counts too
            date = sides_date(nm) or (shoot.get(int(m.group(1))) if m else "") or ""
            title = re.sub(r"(?i)^tschugger_|\.pdf$", "", nm).replace("_", " ").strip()
            sides.append({"date": date, "name": title[:80], "pg": pg, "url": "https://www.dropbox.com/preview/TSCHUGGER%20Tigerblood%20-%20DISTRO/" + requests.utils.quote(f["name"])})
        if sides != (meta.get("sides") or []): meta["sides"] = sides; changed = True
        ras = []   # risk assessments: one button each in the callsheet (only with the right «Gefährdungsbeurteilung sehen»)
        for f in sorted(pick_ra(files), key=lambda f: f["name"]):
            nm = f["name"].split("/")[-1]
            md = re.search(r"(\d{4}-\d{2}-\d{2})", nm); m = re.search(r"(?i)DT\s*#?\s*(\d+)", f["name"])
            date = (md.group(1) if md else "") or sides_date(nm) or (shoot.get(int(m.group(1))) if m else "") or ""
            mb = re.search(r"(?i)bild\s*_?(\w+?)(?:_|\.pdf|$)", nm)
            title = ("Szene " + mb.group(1)) if mb else re.sub(r"(?i)^ra_|\.pdf$", "", nm).replace("_", " ").strip()
            ras.append({"date": date, "name": title[:80], "url": "https://www.dropbox.com/preview/TSCHUGGER%20Tigerblood%20-%20DISTRO/" + requests.utils.quote(f["name"])})
        if ras != (meta.get("ra") or []): meta["ra"] = ras; changed = True
        spc = {k: v for k, v in spc.items() if k in used}
        if spc != (meta.get("sidesPages") or {}): meta["sidesPages"] = spc; changed = True
        print("::notice::Callsheets: %d · Sides: %d (%d mit Seitenbildern) · Gefährdungsbeurteilungen: %d · Callsheet-Seiten: %d" % (len(dispos), len(sides), sum(1 for x in sides if x.get("pg")), len(ras), sum(1 for d in dispos.values() if d.get("pg"))))
    except Exception as e: print("::warning::Sides/Callsheet-Seiten nicht erzeugt: " + type(e).__name__)
    if dispos or data.get("dispos"): data["dispos"] = sorted(dispos.values(), key=lambda d: d.get("date", ""))

    # screenplay
    f = pick_script(files)
    if f:
        sources.append({"kind": "script", "name": f["name"], "modified": f["modified"]})
        if not meta.get("scriptVersion") or not is_new("script", f): meta["scriptVersion"] = script_version(f["name"])
        if is_new("script", f) and may_try("script", f):
          log("Drehbuch: neu, wird eingelesen")
          try:
            sc = script_from_pdf(dbx.download(f["id"]))
            if len(sc) >= max(20, int(len(scr) * 0.7)):
                had = bool(scr); scr = sc; changed = True; log("Drehbuch:", len(sc), "Szenen")
                sv = script_version(f["name"]); pv = meta.get("scriptVersion") or ""
                if had and not FORCE:   # a new version (or a new revision of the same one): Today and push
                    old = meta.get("scriptChange") or {}
                    meta["scriptChange"] = {"at": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"), "v": sv, "prev": pv,
                                            **({k: old[k] for k in ("scenes", "log") if k in old} if old.get("v") == sv else {})}
                    NEWS.append({"kind": "script", "dates": [TODAY], "version": sv})
                meta["scriptVersion"] = sv
            else:
                failed("script", f, "zu wenige Szenen erkannt (%d) – bisheriges bleibt" % len(sc))
          except Exception as e: failed("script", f, e)

    # changelog of the script version: scenes and text for «Änderungen» in Today (no push of its own)
    cl = pick_changelog(files, meta.get("scriptVersion"))
    if cl:
        sources.append({"kind": "changelog", "name": cl["name"], "modified": cl["modified"]})
        if is_new("changelog", cl) and may_try("changelog", cl):
            try:
                info = changelog_parse(pdf_text(dbx.download(cl["id"])))
                sx = dict(meta.get("scriptChange") or {}); sv = meta.get("scriptVersion") or ""
                if sx.get("v") != sv:   # the script was already read (or read without a changelog): the change counts from the changelog
                    n = int(sv[1:]) if sv[1:].isdigit() else 0
                    sx = {"at": cl["modified"] or datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"), "v": sv, "prev": ("v%d" % (n - 1)) if n > 1 else ""}
                sx.update(info); meta["scriptChange"] = sx; changed = True
                log("Changelog:", len(info["scenes"]), "Szenen")
            except Exception as e: failed("changelog", cl, e)

    # prep / rehearsal planning (shared folder «3D» → 11_Planning Prep Rehearsals): every «Weekly Schedule» and «Daily Schedule»
    # is read on its own (only new or changed files go to Claude); per day the document with the newest «stand» wins,
    # so a Daily Schedule replaces those days of the Weekly Schedule and the rest of the week stays.
    try:
        pf = [e for e in dbx.list_path(ROOT3D + "/11_Planning Prep Rehearsals") if e["tag"] == "file" and e["name"].lower().endswith(".pdf")]
    except Exception as ex:
        pf = []; log("Prep-Ordner nicht lesbar:", str(ex)[:80])
    PLAN_RE = PREP_PLAN_RE; stand = prep_stand
    plans = sorted([e for e in pf if PLAN_RE.search(e["name"])], key=stand, reverse=True)[:4]   # newest first
    if pf and not plans: plans = sorted(pf, key=stand, reverse=True)[:1]
    if plans:
        import zoneinfo
        today = datetime.datetime.now(zoneinfo.ZoneInfo("Europe/Zurich")).date().isoformat()
        keep_from = (datetime.date.fromisoformat(today) - datetime.timedelta(days=7)).isoformat()
        cache = {k: v for k, v in (meta.get("prepFiles") or {}).items() if any(k == e["name"] for e in plans)}
        ex = {"days": (data.get("prepro") or [])[:2], "meta": {k: v for k, v in (meta.get("prepro") or {}).items() if k in ("title", "range", "issued", "distribution", "note")}}
        for e in plans:
            name = "3D/11_Planning Prep Rehearsals/" + e["name"]
            sources.append({"kind": "prep", "name": name, "modified": e["modified"]})
            c = cache.get(e["name"])
            if c and c.get("m") == e["modified"] and not FORCE: continue
            fi = {"name": name, "modified": e["modified"]}
            if not may_try("prep", fi): continue
            log("Prep-Planung: neu, wird ausgelesen", _h(e["name"]))
            try:
                res = claude([pdf_block(dbx.download(e["id"]))],
                    "Erzeuge aus dieser Planung (Weekly oder Daily Schedule, Vorbereitung & Proben) ein JSON-Objekt {\"days\": [...], \"meta\": {...}} genau in der Struktur dieses Beispiels: %s\n"
                    "Regeln: ein Eintrag pro Kalendertag (id = date = YYYY-MM-DD; der Wochentag im PDF ist massgebend, falsche Datumsangaben korrigieren und in meta.note auf Deutsch erwähnen, mit note_fr, note_it, note_en). "
                    "items: {t \"HH:MM\" oder \"TBA\"/\"All Day\"/\"N.A\", end, n (Titel wie im PDF, nicht übersetzen), crew, cast (Namen kommagetrennt wie im PDF), where (Ort mit Adresse), map (Link aus dem PDF), hl true für farbig hervorgehobene Zeilen}. "
                    "VERBUNDENE ZELLEN beachten: gilt ein Ort für mehrere Zeilen, bei jeder dieser Zeilen eintragen. Parallele Termine in parallel[], Transporte in transport {cast, castMap, crew, crewMap, rows:[{driver, name, from, fromMap, at, to, toMap, arr}]}. "
                    "meta: {source: \"%s\", title, range, issued (Ausgabedatum/Zeit im PDF), distribution (Verteiler), note…}." % (json.dumps(ex, ensure_ascii=False)[:20000], e["name"]), 32000)
                days = res.get("days") if isinstance(res, dict) else None
                if isinstance(days, list) and days:
                    for d in days: d["id"] = d.get("date") or d.get("id")
                    pm = res.get("meta") or {}; pm["source"] = e["name"]
                    cache[e["name"]] = {"m": e["modified"], "days": [d for d in days if str(d.get("date") or "") >= keep_from], "meta": pm}
                    changed = True; log("Prep-Planung:", len(days), "Tage")
                else:
                    failed("prep", fi, "Ergebnis unvollständig – bisherige bleibt")
            except Exception as ex2:
                failed("prep", fi, ex2)
        days, used = compose_prep(plans, cache); have = {d["date"] for d in days}
        if days:
            # days from today on that no current document has any more come from the previous state, marked with their source
            for d in data.get("prepro") or []:
                if d.get("date") and d["date"] >= today and d["date"] not in have:
                    days.append(dict(d, older=d.get("older") or d.get("src") or (meta.get("prepro") or {}).get("source") or "")); have.add(d["date"])
            if today not in have and meta.get("prepMiss") != today:   # still nothing for today: look in the older plans of the folder «z OLD» (once a day)
                meta["prepMiss"] = today
                try:
                    olds = [x for x in dbx.list_path(ROOT3D + "/11_Planning Prep Rehearsals/z OLD") if x["tag"] == "file" and x["name"].lower().endswith(".pdf") and PLAN_RE.search(x["name"])]
                    for oe in sorted(olds, key=stand, reverse=True)[:2]:
                        r2 = claude([pdf_block(dbx.download(oe["id"]))],
                            "Gib aus dieser Planung NUR den Tag %s als JSON-Objekt {\"days\": [...]} zurück, in derselben Struktur wie: %s (leere Liste, wenn der Tag fehlt; der Wochentag im PDF ist massgebend)." % (today, json.dumps({"days": days[:1]}, ensure_ascii=False)[:8000]), 8000)
                        od = [x for x in (r2.get("days") if isinstance(r2, dict) else None) or [] if x.get("date") == today]
                        if od:
                            od[0]["id"] = today; od[0]["older"] = oe["name"]; days.append(od[0]); have.add(today)
                            log("Prep-Planung: heutiger Tag aus älterer Version", _h(oe["name"])); break
                except Exception as ex3:
                    log("Ältere Planung nicht lesbar:", str(ex3)[:120])
            newp = sorted(days, key=lambda d: d.get("date", ""))
            pm = dict((cache.get(used[0]) or {}).get("meta") or {}) if used else dict(meta.get("prepro") or {})
            if len(used) > 1: pm["sources"] = used
            chp = changed_days(data.get("prepro"), newp, TODAY) if data.get("prepro") else []
            if chp: NEWS.append({"kind": "prep", "dates": chp})
            if newp != (data.get("prepro") or []) or pm != (meta.get("prepro") or {}):
                data["prepro"] = newp; meta["prepro"] = pm; changed = True
                log("Prep-Planung:", len(newp), "Tage aus", len(used), "Dokumenten")
        if cache != (meta.get("prepFiles") or {}): meta["prepFiles"] = cache; changed = True

    # floorplans (PDF) and blocking photo folders (shared folder «3D» → 0_BlockingFloorplans)
    try:
        fl = [e for e in dbx.list_path(ROOT3D + "/0_BlockingFloorplans/floorplans locations") if e["tag"] == "file" and re.search(r"\.(pdf|png|jpe?g)$", e["name"], re.I)]
        allb = dbx.list_path(ROOT3D + "/0_BlockingFloorplans", True)
        bl = [e for e in allb if e["tag"] == "folder" and e["name"].lower().startswith("scene_") and e["path"].count("/") <= 3]
        bpdf = {}  # scene folder name → PDFs inside it (also in part folders «Scene_186/Scene 186 pt1 A_B_C/»)
        bpdfe = {}  # the same as Dropbox entries
        for e in allb:
            top = blk_top(e)[0] if e["tag"] == "file" else None
            if top and e["name"].lower().endswith(".pdf"): bpdf.setdefault(top, []).append(e); bpdfe.setdefault(top, []).append(e)
    except Exception: fl = bl = []; bpdf = {}; bpdfe = {}
    if fl or bl:
        known = {x.get("file"): x for x in meta.get("floorplans") or []}
        _bm = meta.get("bm") or []
        for x in meta.get("blocking") or []:   # pictures are stored once in meta.bm; expand them while working
            if "mi" in x and "media" not in x: x["media"] = [_bm[i] for i in x.pop("mi") if 0 <= i < len(_bm)]
        kb = {x.get("name"): x for x in meta.get("blocking") or []}
        fpdir = meta.get("fpFolderUrl") or ""; bdir = meta.get("blkFolderUrl") or ""
        TOWNS = ("salgesch", "martigny", "sion", "chalais", "saxon", "salvan", "vernayaz", "collombey", "leytron", "saint-maurice")
        fps = []
        for e in sorted(fl, key=lambda e: e["name"].lower()):
            if e["name"] in known: fps.append(known[e["name"]]); continue
            stem = re.sub(r"\.[^.]+$", "", e["name"]); words = [w.lower() for w in re.split(r"[\s_]+", stem) if w]
            fps.append({"name": stem.title(), "file": e["name"], "url": fpdir, "kind": "pdf" if e["name"].lower().endswith(".pdf") else "img",
                        "rule": {"set": [w for w in words if w not in TOWNS], "loc": [w for w in words if w in TOWNS]}})
        blk = []
        for e in sorted(bl, key=lambda e: e["name"]):
            sc = [_norm_sc(p) for p in e["name"][6:].replace(" CAR", "").split("_") if p]
            if e["name"] in kb: kb[e["name"]]["sc"] = sc; blk.append(kb[e["name"]]); continue
            blk.append({"name": e["name"], "sc": sc, "url": bdir})
        def plabel(n): return re.sub(r"(?<![0-9A-Za-z])0+(?=\d)", "", re.sub(r"(?i)^scene[\s_]*", "", n[:-4]))
        # blocking photos and videos: encrypted preview images in blk/ (binary: 12-byte IV + AES-GCM), shown in the app's gallery
        bmed = {}
        for e in allb:
            top = blk_top(e)[0] if e["tag"] == "file" else None
            if top and re.search(r"\.(jpe?g|png|heic|mov|mp4|m4v)$", e["name"], re.I):
                bmed.setdefault(top, []).append(e)
        os.makedirs("blk", exist_ok=True)
        want_files = set()
        for b in blk:
            items = []
            folder = b.get("url") or bdir
            for e in sorted(bmed.get(b["name"], []), key=lambda e: e["name"].lower()):
                key = hashlib.sha1((str(e.get("id")) + "|" + str(e.get("modified")) + "|hd").encode()).hexdigest()[:20]
                fn = "blk/" + key + ".bin"; want_files.add(fn)
                if not blk_have(fn):
                    if time.time() > PIC_DEADLINE or PIC_BUDGET[0] <= 0: want_files.discard(fn); continue   # follows in the next run
                    PIC_BUDGET[0] -= 1
                    try:
                        r = requests.post("https://content.dropboxapi.com/2/files/get_thumbnail_v2", timeout=120, headers=dict(dbx.h, **{"Dropbox-API-Arg": json.dumps({"resource": {".tag": "path", "path": e["id"]}, "format": "jpeg", "size": "w2048h1536", "mode": "fitone_bestfit"})}))
                        r.raise_for_status()
                        iv = secrets.token_bytes(12)
                        open(fn, "wb").write(iv + AESGCM(KEY).encrypt(iv, small_jpeg(r.content), None)); changed = True
                    except Exception as ex:
                        log("Vorschau fehlt:", _h(e["name"]), type(ex).__name__); want_files.discard(fn); continue
                vid = bool(re.search(r"\.(mov|mp4|m4v)$", e["name"], re.I))
                vf = None
                if vid:  # playable copy: 720p H.264 MP4, encrypted like the previews
                    vf = "blk/" + key + ".mp4.bin"; want_files.add(vf)
                    left = PIC_DEADLINE - time.time()
                    if not blk_have(vf) and (left < 120 or PIC_BUDGET[0] < 10): want_files.discard(vf); vf = None   # films: only with enough time left
                    elif not blk_have(vf):
                        PIC_BUDGET[0] -= 10
                        try:
                            import shutil
                            ff = shutil.which("ffmpeg")
                            if not ff:
                                try:
                                    import imageio_ffmpeg; ff = imageio_ffmpeg.get_ffmpeg_exe()
                                except Exception: ff = None
                            if not ff: raise RuntimeError("ffmpeg fehlt")
                            with tempfile.TemporaryDirectory() as td:
                                src = os.path.join(td, "in" + os.path.splitext(e["name"])[1].lower()); dst = os.path.join(td, "out.mp4")
                                open(src, "wb").write(dbx.download(e["id"]))
                                subprocess.run([ff, "-y", "-loglevel", "error", "-i", src, "-vf", "scale=-2:'min(720,ih)'", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
                                                "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", dst], check=True, timeout=max(60, min(900, int(left))))
                                vbytes = open(dst, "rb").read()
                            if len(vbytes) > 45e6: raise RuntimeError("zu gross")
                            iv = secrets.token_bytes(12)
                            open(vf, "wb").write(iv + AESGCM(KEY).encrypt(iv, vbytes, None)); changed = True
                        except Exception as ex:
                            log("Film nicht umgewandelt:", _h(e["name"]), str(ex)[:60]); want_files.discard(vf); vf = None
                _, subs, part = blk_top(e)
                items.append({"n": e["name"], "t": "vid" if vid else "img", "f": fn, **({"v": vf} if vf else {}), **({"p": part} if part else {}),
                              "u": _web(os.path.dirname(e["path"]), e["name"]) if subs else folder.replace("&dl=0", "&preview=" + requests.utils.quote(e["name"].replace(" ", "+"), safe="+") + "&dl=0") if "/Scene_" in folder else folder})
            if items != [m for m in (b.get("media") or []) if not m.get("g")]:
                b["media"] = items + [m for m in (b.get("media") or []) if m.get("g")]; changed = True
        # ---- more pictures behind the camera button ----
        # (a) every page of the blocking PDFs as a picture (most scenes only have the PDF)
        # (b) the shot breakdown folder «AUFLÖSUNG»: per location folder «NN NAME 012_021_034 CH» the scene folders «Scene 027»
        #     (photos + PDFs) and the 3D/location pictures of that set, shown for every scene in the folder name
        BPDFE.clear(); BPDFE.update(bpdfe)
        try:
            changed = add_more_blocking(dbx, blk, meta, want_files, data.get("days") or [], data.get("locations") or [], [(x, next((e for e in fl if e["name"] == x.get("file")), None)) for x in fps]) or changed
        except Exception as ex:
            log("Auflösung/Seiten nicht gelesen:", str(ex)[:160]); PARTIAL.append("auf")
        # store every picture once (meta.bm) and let the scenes refer to it by number – keeps the data file small
        bm, idx = [], {}
        for b in blk:
            mi = []
            for m in b.pop("media", None) or []:
                k = json.dumps(m, sort_keys=True, ensure_ascii=False)
                if k not in idx: idx[k] = len(bm); bm.append(m)
                mi.append(idx[k])
            b["mi"] = mi
        if bm != (meta.get("bm") or []): changed = True
        meta["bm"] = bm
        if PARTIAL:   # something could not be read: delete nothing now (the pictures would only be made again later)
            log("Aufräumen ausgelassen – nicht alles lesbar:", ", ".join(PARTIAL))
        else:
            gone = [fn for fn in BLKS.files() if fn not in want_files]
            if len(gone) > max(200, len(want_files)):   # safety net: never wipe most of the pictures in one run
                log("Aufräumen ausgelassen – zu viele Dateien wären gelöscht worden:", len(gone))
            else:
                for fn in gone: BLKS.remove(fn); changed = True
        for b in blk:  # every scene PDF as its own button (preview inside the shared scene folder)
            ents = sorted(bpdf.get(b["name"], []), key=lambda e: e["name"].lower())
            if not ents: continue
            old_pdfs = b.get("pdfs") or []
            folder = b.get("url") or bdir
            pdfs = [{"l": plabel(e["name"]), "u": _web(os.path.dirname(e["path"]), e["name"]) if blk_top(e)[1] else folder.replace("&dl=0", "&preview=" + requests.utils.quote(e["name"].replace(" ", "+"), safe="+") + "&dl=0") if "/Scene_" in folder else folder} for e in ents]
            if pdfs != old_pdfs: b["pdfs"] = pdfs; changed = True
        if [x.get("file") for x in fps] != [x.get("file") for x in meta.get("floorplans") or []] or [x.get("name") for x in blk] != [x.get("name") for x in meta.get("blocking") or []]:
            meta["floorplans"], meta["blocking"] = fps, blk; changed = True; log("Floorplans:", len(fps), "· Blocking:", len(blk))

    # location list (Google Sheet chosen by the main admin)
    # Motivliste: the link set in the app, else a Google-Sheets link in the Dropbox («….web» with Motiv/Location in the name)
    sheet = cfg.get("locSheet") or ""
    if not sheet:
        try:
            lk = sorted([f for f in files if f["name"].lower().endswith(".web") and re.search(r"(?i)motiv|location", f["name"].split("/")[-1])
                         and not re.search(r"(?i)2nd.?unit|shooting.?order", f["name"])], key=lambda f: f["modified"] or "")
            if lk:
                m = re.search(rb"https://docs\.google\.com/spreadsheets/[^\s\"'<>]+", dbx.download(lk[-1]["id"]))
                if m: sheet = m.group(0).decode()
        except Exception as e: log("Motivliste-Link aus der Dropbox nicht gelesen:", type(e).__name__)
    try:
        txt = read_sheet(sheet)
    except Exception: txt = None
    if txt:
        h = hashlib.sha256(txt.encode()).hexdigest()[:16]
        if FORCE or h != meta.get("locHash"):
            log("Motivliste: geändert, wird ausgelesen")
            try: res = claude([{"type": "text", "text": "MOTIVLISTE (Tabelle, Zellen mit | getrennt, Links in <…>):\n" + txt}],
                "Erzeuge daraus ein JSON-Array gemäss Collection \"locations\" (Feld \"id\" = \"l00\", \"l01\" …). Bestehende Einträge (für fehlende Maps-Links übernehmen): %s"
                % json.dumps(strip_ids(data.get("locations")), ensure_ascii=False)[:40000], 32000)
            except Exception as e: res = None; log("Motivliste nicht übernommen:", type(e).__name__)
            oldn = len(data.get("locations") or [])
            if isinstance(res, list) and (len(res) >= int(oldn * 0.8) or sheet != (oldkind.get("locations") or {}).get("link")):
                for i, d in enumerate(res): d["order"] = i; d["id"] = "l%02d" % i
                data["locations"] = res; meta["locHash"] = h; changed = True; log("Motivliste:", len(res), "Motive")
                sources.append({"kind": "locations", "name": "Google Sheet «Motivliste»", "link": sheet, "modified": NOW})
            else:
                log("Motivliste: deutlich weniger Zeilen – bisherige bleiben")
                if oldkind.get("locations"): sources.append(oldkind["locations"])
        elif oldkind.get("locations"): sources.append(oldkind["locations"])
    elif oldkind.get("locations"):
        log("Motivliste nicht lesbar – bisherige bleibt"); sources.append(oldkind["locations"])

    # web links («.web» shortcuts in the Dropbox, e.g. the 2nd unit shooting order as Google Sheet): shown in the app
    try:
        wl, have = [], {x.get("file"): x for x in (meta.get("webLinks") or [])}
        for f in files:
            if not f["name"].lower().endswith(".web") or f.get("size", 0) > 4096: continue
            o = have.get(f["name"])
            if o and o.get("m") == f["modified"]: wl.append(o); continue
            m = re.search(rb"https://[^\s\"'<>]+", dbx.download(f["id"]))
            if not m: continue
            nm = re.sub(r"(?i)\.web$", "", f["name"].split("/")[-1])
            wl.append({"file": f["name"], "m": f["modified"], "url": m.group(0).decode()[:500], "name": nm[:120],
                       "kind": "2nd" if re.search(r"(?i)2nd.?unit", nm) else ""})
        if wl != (meta.get("webLinks") or []): meta["webLinks"] = wl; changed = True; log("Web-Links:", len(wl))
    except Exception as e: log("Web-Links nicht gelesen:", type(e).__name__)

    meta["sources"] = [x for x in sources if x]; meta.pop("checkedAt", None)   # «last checked» lives in stamp.json (otherwise the data file changes every run)
    fails = {k: v for k, v in fails.items() if k in seen}
    if fails: meta["fails"] = fails
    else: meta.pop("fails", None)
    if changed: meta["updatedAt"] = NOW
    data["meta"] = meta
    for k in ("days", "crew", "locations", "places", "dispos"): data.setdefault(k, [])
    if not data["days"] or not data["crew"]: sys.exit("Keine Drehtage oder Crew – nichts veröffentlicht")
    try: u2_also_add(data["days"], meta.get("unit2Sheet"))
    except Exception as e: log("2nd Unit zusätzlich nicht ergänzt:", type(e).__name__)
    try: apply_place_fixes(data)
    except Exception as e: log("Info-Ergänzungen nicht angewendet:", type(e).__name__)
    try: add_drive_times(data)
    except Exception as e: log("Anfahrt nicht berechnet:", type(e).__name__)
    if BLKS: BLKS.sync()   # R2: pictures first, so the new data never points to a picture that is not there yet
    if rotating():   # a key change started while this run was reading: discard everything (old-key files must not be published)
        try: subprocess.run(["git", "checkout", "--", "."], cwd=R, check=False); subprocess.run(["git", "clean", "-fdq", "blk"], cwd=R, check=False)
        except Exception: pass
        log("Schlüsselwechsel hat begonnen – nichts veröffentlicht"); print("::notice::Schlüsselwechsel begonnen – nichts veröffentlicht"); return
    # the picture list of the galleries (large) is a file of its own: the app starts with data.enc.json and loads it afterwards
    bm = meta.pop("bm", None)
    if bm is not None:
        meta["bmh"] = hashlib.sha256(json.dumps(bm, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]
        enc_file(R / "media.enc.json", {"bm": bm})
    # phone numbers and e-mail addresses of the crew list and the screenplay with their own keys (only with that right)
    ck, sk = area_key("contacts"), area_key("script")
    if ck:
        crew_pub, cts = split_contacts(data["crew"])
        enc_file(R / "contacts.enc.json", {"c": cts}, ck)
        w1 = enc_file(R / "data.enc.json", {**data, "crew": crew_pub})
    else:
        log("Kein Schlüssel für Telefon/E-Mail – Kontakte bleiben in den Crew-Daten"); w1 = enc_file(R / "data.enc.json", data)
    w2 = enc_file(R / "script.enc.json", {"script": [{k: d[k] for k in ("sc", "head", "text") if k in d} for d in scr]}, sk) if scr else False
    log("Daten:", "geändert" if changed else "unverändert", "· Datei:", "neu geschrieben" if (w1 or w2) else "gleich")
    write_stamp()
    if NEWS and FORCE: log("Alles neu eingelesen – keine Push-Nachrichten bei Änderungen")
    if NEWS and not FORCE:   # sent by tools/notify_changes.py after the data is published
        (R / "pending_push.json").write_text(json.dumps({"news": NEWS, "days": [{"date": d.get("date"), "label": d.get("short") or d.get("label") or ""} for d in data.get("days") or []]}, ensure_ascii=False))
        log("Push bei Änderungen vorgemerkt:", ", ".join(n["kind"] for n in NEWS))
    status("ok", "Läuft", updatedAt=meta.get("updatedAt") or "", version=meta.get("scheduleVersion") or "")

if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        if e.code not in (None, 0): status("error", str(e.code)[:160])
        raise
    except Exception as e:
        # only the error type and a short text – never file contents (public repository)
        # error text can quote file names or contents: only the type and where in our code it happened
        import traceback
        fr = [f for f in traceback.extract_tb(e.__traceback__) if "/tools/" in f.filename.replace("\\", "/")]
        where = (" (%s:%d)" % (os.path.basename(fr[-1].filename), fr[-1].lineno)) if fr else ""
        status("error", (type(e).__name__ + where)[:160]); raise
