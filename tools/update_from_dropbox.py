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

_missing = [k for k in ("CREW_KEY", "ANTHROPIC_API_KEY", "DROPBOX_APP_KEY", "DROPBOX_REFRESH_TOKEN") if not os.environ.get(k, "").strip()]
if _missing and __name__ == "__main__":
    print("• Noch nicht eingerichtet – fehlende Secrets:", ", ".join(_missing))
    status("setup", "Noch nicht eingerichtet", missing=_missing); sys.exit(0)
KEY = base64.b64decode(os.environ["CREW_KEY"].strip())
ROOT = (os.environ.get("DROPBOX_ROOT") or "ns:14935064499").rstrip("/")
ROOT3D = (os.environ.get("DROPBOX_ROOT_3D") or "ns:13132709057").rstrip("/")
ROOTAUF = (os.environ.get("DROPBOX_ROOT_AUF") or "ns:15240921299").rstrip("/")
ROOTRECCE = (os.environ.get("DROPBOX_ROOT_RECCE") or "ns:13058967505/RECCE").rstrip("/")   # recce photos (in «TSCHUGGER - 3D Locations»)
PIC_DEADLINE = time.time() + 10 * 60   # new previews only for 10 minutes per run; the rest follows in the next runs
PIC_BUDGET = [int(os.environ.get("PIC_BUDGET") or 250)]   # and at most this many new preview files per run (keeps each push small)   # shared folder «AUFLÖSUNG» (in «TSCHUGGER - 3D Locations»)   # shared folder «3D» (weekly prep schedule, floorplans)
MODEL = os.environ.get("CLAUDE_MODEL") or "claude-sonnet-5-5"
FORCE = os.environ.get("FORCE", "").lower() in ("ja", "yes", "true", "1")
EVENT = os.environ.get("GITHUB_EVENT_NAME", "")
NOW = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
DEFAULT_SHEET = "https://docs.google.com/spreadsheets/d/1-90uPfHztMs7i0u_zW473Jd0CUHdC7nlxZrzfgBqqJg/edit?gid=1204350231"

def log(*a): print("•", *a, flush=True)

# ---------- encryption (same format as tools/publish.py) ----------
def dec_file(p):
    try:
        e = json.load(open(p))
        pt = AESGCM(KEY).decrypt(base64.b64decode(e["iv"]), base64.b64decode(e["ct"]), None)
        return json.loads(pt)
    except FileNotFoundError:
        return None

def enc_file(p, obj):
    pt = json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    stamp = hashlib.sha256(KEY + pt).hexdigest()[:16]
    try:
        if json.load(open(p)).get("stamp") == stamp: return False
    except Exception: pass
    iv = secrets.token_bytes(12)
    json.dump({"v": 2, "stamp": stamp, "iv": base64.b64encode(iv).decode(),
               "ct": base64.b64encode(AESGCM(KEY).encrypt(iv, pt, None)).decode(), "builtAt": NOW}, open(p, "w"))
    return True

# ---------- Dropbox (read-only) ----------
class Dbx:
    def __init__(self):
        d = {"grant_type": "refresh_token", "refresh_token": os.environ["DROPBOX_REFRESH_TOKEN"].strip(),
             "client_id": os.environ["DROPBOX_APP_KEY"].strip()}
        if os.environ.get("DROPBOX_APP_SECRET"): d["client_secret"] = os.environ["DROPBOX_APP_SECRET"].strip()
        r = requests.post("https://api.dropboxapi.com/oauth2/token", data=d, timeout=30)
        if r.status_code != 200: sys.exit("Dropbox-Anmeldung fehlgeschlagen (HTTP %s)" % r.status_code)
        self.h = {"Authorization": "Bearer " + r.json()["access_token"]}

    def list_all(self):
        out = []
        r = requests.post("https://api.dropboxapi.com/2/files/list_folder", headers=self.h, timeout=60,
                          json={"path": ROOT, "recursive": True, "include_non_downloadable_files": False})
        if r.status_code != 200: sys.exit("Dropbox-Ordner nicht lesbar (HTTP %s)" % r.status_code)
        j = r.json(); out += j["entries"]
        while j.get("has_more"):
            j = requests.post("https://api.dropboxapi.com/2/files/list_folder/continue", headers=self.h, timeout=60,
                              json={"cursor": j["cursor"]}).json(); out += j["entries"]
        files = []
        for e in out:
            if e.get(".tag") != "file": continue
            p = e["path_display"].lstrip("/")
            p = re.sub(r"^TSCHUGGER Tigerblood - DISTRO/", "", p)
            files.append({"name": p, "id": e["id"], "modified": e.get("server_modified") or e.get("client_modified"), "size": e.get("size", 0)})
        return files

    def list_path(self, path, recursive=False):
        """children of a folder (files and folders, with path_lower); [] if the folder cannot be read"""
        r = requests.post("https://api.dropboxapi.com/2/files/list_folder", headers=self.h, timeout=60, json={"path": path, "recursive": recursive})
        if r.status_code != 200: return []
        j = r.json(); out = j["entries"]
        while j.get("has_more"):
            j = requests.post("https://api.dropboxapi.com/2/files/list_folder/continue", headers=self.h, timeout=60, json={"cursor": j["cursor"]}).json(); out += j["entries"]
        return [{"name": e["name"], "tag": e[".tag"], "id": e.get("id"), "modified": e.get("server_modified") or e.get("client_modified"), "path": e.get("path_display") or "",
                 "size": e.get("size", 0), "hash": e.get("content_hash") or ""} for e in out]

    def download(self, fid):
        r = requests.post("https://content.dropboxapi.com/2/files/download", timeout=180,
                          headers=dict(self.h, **{"Dropbox-API-Arg": json.dumps({"path": fid})}))
        r.raise_for_status(); return r.content

# ---------- extra blocking pictures: PDF pages and the AUFLÖSUNG folder ----------
BPDFE = {}
IMG_RE = re.compile(r"\.(jpe?g|png|heic|webp)$", re.I)

def _key(e, extra=""):
    return hashlib.sha1((str(e.get("id")) + "|" + str(e.get("modified")) + extra).encode()).hexdigest()[:20]

def _enc_write(fn, data):
    iv = secrets.token_bytes(12)
    open(fn, "wb").write(iv + AESGCM(KEY).encrypt(iv, data, None))

def small_jpeg(data):
    """photo previews: at most 1024 px, JPEG quality 70 (PDF pages are not touched); unchanged if that is not smaller"""
    try:
        import io
        from PIL import Image
        im = Image.open(io.BytesIO(data)).convert("RGB"); im.thumbnail((1024, 1024))
        o = io.BytesIO(); im.save(o, "JPEG", quality=70, optimize=True, progressive=True)
        return o.getvalue() if len(o.getvalue()) < len(data) * 0.92 else data
    except Exception:
        return data

def _thumb(dbx, e, fn):
    """encrypted preview picture of a Dropbox photo (made once, kept in blk/)"""
    if os.path.exists(fn): return True
    if time.time() > PIC_DEADLINE or PIC_BUDGET[0] <= 0: return False
    PIC_BUDGET[0] -= 1
    try:
        r = requests.post("https://content.dropboxapi.com/2/files/get_thumbnail_v2", timeout=120, headers=dict(dbx.h, **{"Dropbox-API-Arg": json.dumps(
            {"resource": {".tag": "path", "path": e["id"]}, "format": "jpeg", "size": "w960h640", "mode": "fitone_bestfit"})}))
        r.raise_for_status(); _enc_write(fn, small_jpeg(r.content)); return True
    except Exception as ex:
        log("Vorschau fehlt:", e["name"], str(ex)[:80]); return False

def _pdf_pages(dbx, e, cache):
    """every page of a PDF as an encrypted JPEG (blk/<key>p<i>.bin); the page count is kept in meta.pdfPages"""
    key = _key(e, "|pdf")
    n = cache.get(key)
    if n is not None and all(os.path.exists("blk/%sp%d.bin" % (key, i)) for i in range(n)):
        return key, ["blk/%sp%d.bin" % (key, i) for i in range(n)]
    if time.time() > PIC_DEADLINE or PIC_BUDGET[0] <= 0: return key, []
    PIC_BUDGET[0] -= 4
    try:
        with tempfile.TemporaryDirectory() as td:
            src = os.path.join(td, "in.pdf"); open(src, "wb").write(dbx.download(e["id"]))
            subprocess.run(["pdftoppm", "-jpeg", "-jpegopt", "quality=78", "-scale-to", "1280", "-l", "16", src, os.path.join(td, "p")], check=True, timeout=300)
            pages = sorted(f for f in os.listdir(td) if f.startswith("p") and f.endswith(".jpg"))
            out = []
            for i, f in enumerate(pages):
                fn = "blk/%sp%d.bin" % (key, i); _enc_write(fn, open(os.path.join(td, f), "rb").read()); out.append(fn)
        cache[key] = len(out)
        return key, out
    except Exception as ex:
        log("PDF-Seiten nicht erzeugt:", e["name"], str(ex)[:120]); return key, []

def _norm_sc(x):
    x = re.sub(r"^0+(?=\d)", "", str(x).strip()).lower().replace(" ", "")
    return re.sub(r"(?<=\d)([a-z]{1,2})$", lambda m: m.group(1).upper(), x)   # 184c → 184C, 107pt1 stays

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
            m = re.fullmatch(r"(\d{1,3})((?:pt\d)|[A-Za-z]{0,2})", p, re.I)
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
            fn = "blk/" + _key(e) + ".bin"
            if not _thumb(dbx, e, fn): continue
            WANT.add(fn); n += 1
            it = {"n": e["name"], "t": "img", "f": fn, "u": _web(folder, e["name"]), "g": "recce", "l": label}
            for sc in hit: add(sc, "recce", it)
    log("Recce-Bilder zugeordnet:", n)

WANT = set()

def add_more_blocking(dbx, blk, meta, want_files, days=(), locs=()):
    changed = False
    prev = {x.get("name"): x for x in meta.get("blocking") or []}
    WANT.clear()
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
            u = folder.replace("&dl=0", "&preview=" + requests.utils.quote(e["name"].replace(" ", "+"), safe="+") + "&dl=0") if "/Scene_" in folder else (folder or _web(os.path.dirname(e["path"]), e["name"]))
            for it in pdf_items(e, re.sub(r"\.pdf$", "", e["name"], flags=re.I), u):
                for sc in b.get("sc") or []: add(_norm_sc(sc), "pdf", it)

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
            m = re.match(r"(?i)scene[\s_]*([0-9]{1,3}[A-Za-z]{0,2}(?:\s*pt\s*\d)?)", e["name"])
            if m and e["name"].lower().endswith(".pdf"):
                for it in pdf_items(e, re.sub(r"\.pdf$", "", e["name"], flags=re.I), _web(os.path.dirname(e["path"]), e["name"])): add(_norm_sc(m.group(1)), "pdf", it)
            continue
        top = parts[0]; scs = tops.setdefault(top, scenes_in_name(top))
        sub = parts[1] if len(parts) > 2 else ""
        msub = re.fullmatch(r"(?i)x?scene[\s_]*([0-9]{1,3}[A-Za-z]{0,2}(?:\s*pt\s*\d)?)", sub.strip()) if sub else None
        mfile = re.match(r"(?i)x?scene[\s_]*([0-9]{1,3}[A-Za-z]{0,2}(?:\s*pt\s*\d)?)", e["name"])
        if e["name"].lower().endswith(".pdf"):
            m = msub or mfile
            if not m: continue
            sc = _norm_sc(m.group(1))
            for it in pdf_items(e, re.sub(r"\.pdf$", "", e["name"], flags=re.I), _web(os.path.dirname(e["path"]), e["name"])): add(sc, "pdf", it)
        elif IMG_RE.search(e["name"]):
            fn = "blk/" + _key(e) + ".bin"
            if not _thumb(dbx, e, fn): continue
            want_files.add(fn)
            it = {"n": e["name"], "t": "img", "f": fn, "u": _web(os.path.dirname(e["path"]), e["name"])}
            if msub:
                add(_norm_sc(msub.group(1)), "s", dict(it, g="s"))
            else:
                for sc in scs: add(sc, "loc", dict(it, g="loc", l=re.sub(r"^\d+\w?\s+", "", sub or top)))
    # (c) RECCE: «RECCE/zRECCE 202609 Wallis/20260917 Wallis/05 Sion POLIZEISTATION EXT/…» – matched to the scenes shot there
    #     (same town or place name as the scene's location, plus a word of the set; scouted alternatives elsewhere stay out)
    try:
        add_recce(dbx, days, add)
    except Exception as ex:
        log("Recce nicht gelesen:", str(ex)[:160])
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
    def base(sc): return re.sub(r"(pt|sl)\w*$", "", _norm_sc(sc).lower())
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
def pick_schedule(files):
    c = [f for f in files if low(f).startswith("02_schedule/ch/") and "_archiv" not in low(f) and low(f).endswith(".pdf")]
    def key(f):
        n = f["name"].rsplit("/", 1)[-1]
        d = re.search(r"(\d{6})", n); v = re.search(r"v(\d+)", n, re.I)
        var = 2 if "oneline" in n.lower() else (1 if re.search(r"\bch\b", n.lower()) else 0)
        return (d.group(1) if d else "", int(v.group(1)) if v else 0, var, f["modified"] or "")
    return max(c, key=key) if c else None

def pick_script(files):
    c = [f for f in files if low(f).startswith("01_script/") and "english translation" not in low(f)
         and re.search(r"_v\d+ clean\.pdf$", low(f)) and not re.search(r"spp|querformat|queerformat|changelog|[ _-]en[ _.]", low(f).rsplit("/", 1)[-1])]
    return max(c, key=lambda f: (int(re.search(r"_v(\d+) clean", low(f)).group(1)), f["modified"] or "")) if c else None

def pick_crew(files):
    c = [f for f in files if low(f).startswith("03_crewlist/") and "_archiv" not in low(f) and "crewliste" in low(f) and low(f).endswith(".pdf")]
    return max(c, key=lambda f: f["modified"] or "") if c else None

def pick_info(files):
    c = [f for f in files if "/" not in f["name"] and "good_to_know" in low(f) and low(f).endswith(".pdf")]
    return max(c, key=lambda f: f["modified"] or "") if c else None

def pick_dispos(files):
    return [f for f in files if low(f).startswith("06_callsheets/") and "_archiv" not in low(f) and low(f).endswith(".pdf")]

# ---------- Claude ----------
SPEC = None
def spec():
    global SPEC
    if SPEC is None:
        SPEC = dec_file(R / "tools" / "spec.enc.json")["spec"]
    return SPEC

def claude(parts, task, max_tokens=32000):
    """parts: list of content blocks; returns parsed JSON from the answer."""
    body = {"model": MODEL, "max_tokens": max_tokens, "stream": True,
            "system": "Du wandelst Produktionsunterlagen eines Filmdrehs in JSON-Daten für eine Crew-App um. Antworte ausschliesslich mit einem einzigen JSON-Wert, ohne Erklärungen und ohne Markdown.\n\n" + spec(),
            "messages": [{"role": "user", "content": parts + [{"type": "text", "text": task}]}]}
    h = {"x-api-key": os.environ["ANTHROPIC_API_KEY"].strip(), "anthropic-version": "2023-06-01", "content-type": "application/json"}
    for attempt in range(3):
        try:
            text = []
            with requests.post("https://api.anthropic.com/v1/messages", headers=h, json=body, stream=True, timeout=(30, 600)) as r:
                if r.status_code != 200:
                    raise RuntimeError("Claude-API HTTP %s: %s" % (r.status_code, r.text[:200]))
                for line in r.iter_lines(decode_unicode=True):
                    if not line or not line.startswith("data:"): continue
                    ev = json.loads(line[5:])
                    if ev.get("type") == "content_block_delta" and ev["delta"].get("type") == "text_delta": text.append(ev["delta"]["text"])
                    if ev.get("type") == "error": raise RuntimeError("Claude-API Fehler: %s" % ev.get("error"))
            t = "".join(text).strip()
            t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
            v = json.loads(t)
            # accept {"crew": [...]} style wrappers where a plain array was asked for
            if isinstance(v, dict) and "Array" in task and len(v) == 1 and isinstance(next(iter(v.values())), list): v = next(iter(v.values()))
            return v
        except Exception as e:
            log("Claude-Versuch", attempt + 1, "fehlgeschlagen:", str(e)[:160])
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

# ---------- main ----------
def norm_sc(x): return re.sub(r"\s+", " ", str(x or "")).strip().lower()


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
        geo[addr] = None; log("Adresse nicht gefunden:", addr)
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


def main():
    cfg = {}
    try:
        f = requests.get("https://firestore.googleapis.com/v1/projects/tschugger-83692/databases/(default)/documents/config/app", timeout=20).json().get("fields", {})
        cfg = {k: list(v.values())[0] for k, v in f.items()}
    except Exception: log("App-Einstellungen nicht lesbar – Standard wird verwendet")
    if cfg.get("autoUpdate") is False and EVENT == "schedule":
        log("Automatische Aktualisierung ist in den App-Einstellungen ausgeschaltet."); status("off", "In den App-Einstellungen ausgeschaltet"); return

    data = dec_file(R / "data.enc.json") or {}
    scr = (dec_file(R / "script.enc.json") or {}).get("script", [])
    meta = data.get("meta") or {}
    base = lambda n: (n or "").rsplit("/", 1)[-1]
    old = {(s.get("kind"), base(s.get("name"))): s.get("modified") for s in meta.get("sources", [])}
    oldkind = {}
    for s in meta.get("sources", []): oldkind.setdefault(s.get("kind"), s)
    changed = False; sources = []

    dbx = Dbx(); files = dbx.list_all(); log("Dropbox gelesen:", len(files), "Dateien")

    def is_new(kind, f): return FORCE or old.get((kind, base(f["name"]))) != f["modified"]

    # schedule
    f = pick_schedule(files)
    if f:
        sources.append({"kind": "schedule", "name": f["name"], "modified": f["modified"]})
        if is_new("schedule", f):
            log("Drehplan: neu, wird ausgelesen")
            res = claude([pdf_block(dbx.download(f["id"]))],
                "Erzeuge aus diesem Drehplan ein JSON-Objekt {\"scheduleVersion\": \"Sched …\" (aus dem Dateinamen: %s), \"subtitle\": \"Dreh Wallis · TT.MM.–TT.MM.JJJJ\", \"cast\": {Rollennummer: Rollenname}, \"days\": [ein Objekt pro Kalendertag gemäss Collection \"days\", jeweils mit Feld \"id\" = Datum]}. Alle Übersetzungsfelder gemäss Abschnitt ÜBERSETZUNGEN. Bisherige Übersetzungen zum Wiederverwenden (gleicher Text = gleiche Übersetzung): %s"
                % (f["name"].rsplit("/", 1)[-1], json.dumps(strip_ids(data.get("days"))[:40], ensure_ascii=False)[:60000]), 64000)
            days = res.get("days") or []
            if len(days) >= max(3, len(data.get("days") or []) // 2):
                for i, d in enumerate(sorted(days, key=lambda d: d.get("date", ""))): d["order"] = i; d["id"] = d.get("date") or d.get("id")
                data["days"] = days; meta["scheduleVersion"] = res.get("scheduleVersion") or meta.get("scheduleVersion")
                if res.get("cast"): meta["cast"] = {str(k): v for k, v in res["cast"].items()}
                if res.get("subtitle"): meta["subtitle"] = res["subtitle"]
                changed = True; log("Drehplan:", len(days), "Tage")
            else:
                log("Drehplan: Ergebnis unvollständig – bisherige Daten bleiben"); sources[-1] = oldkind.get("schedule") or sources[-1]

    # crew
    f = pick_crew(files)
    if f:
        sources.append({"kind": "crew", "name": f["name"], "modified": f["modified"]})
        if is_new("crew", f):
            log("Crewliste: neu, wird ausgelesen")
            res = claude([pdf_block(dbx.download(f["id"]))],
                "Erzeuge aus dieser Crewliste ein JSON-Array gemäss Collection \"crew\" (ein Objekt pro Department, mit Feld \"id\" = \"c00\", \"c01\" …), mit den Übersetzungsfeldern. Bisherige Übersetzungen zum Wiederverwenden: %s"
                % json.dumps(strip_ids(data.get("crew")), ensure_ascii=False)[:40000], 32000)
            if isinstance(res, list) and len(res) >= max(2, len(data.get("crew") or []) // 2):
                for i, d in enumerate(res): d["order"] = i; d["id"] = "c%02d" % i
                data["crew"] = res; changed = True; log("Crewliste:", len(res), "Departments")
            else:
                log("Crewliste: Ergebnis unvollständig – bisherige Daten bleiben"); sources[-1] = oldkind.get("crew") or sources[-1]

    # good-to-know
    f = pick_info(files)
    if f:
        sources.append({"kind": "info", "name": f["name"], "modified": f["modified"]})
        if is_new("info", f):
            log("Infos: neu, werden ausgelesen")
            res = claude([pdf_block(dbx.download(f["id"]))], "Erzeuge aus diesem Dokument ein JSON-Array gemäss Collection \"places\" (Feld \"id\" = \"p00\", \"p01\" …), mit den Übersetzungsfeldern.", 16000)
            if isinstance(res, list) and res:
                for i, d in enumerate(res): d["order"] = i; d["id"] = "p%02d" % i
                data["places"] = res; changed = True; log("Infos:", len(res), "Kategorien")

    # callsheets: every new or changed file, newest per shooting day wins
    dispos = {d.get("date") or d.get("id"): d for d in (data.get("dispos") or [])}
    for f in sorted(pick_dispos(files), key=lambda f: f["modified"] or ""):
        sources.append({"kind": "dispo", "name": f["name"], "modified": f["modified"]})
        if not is_new("dispo", f): continue
        log("Callsheet: neu, wird ausgelesen")
        try:
            d = claude([pdf_block(dbx.download(f["id"]))],
                "Erzeuge aus dieser Tagesdispo ein JSON-Objekt gemäss Collection \"dispos\" (Feld \"date\" = Drehtag YYYY-MM-DD), mit den Übersetzungsfeldern. file = \"%s\", link = \"https://www.dropbox.com/preview/TSCHUGGER%%20Tigerblood%%20-%%20DISTRO/%s\"."
                % (f["name"], requests.utils.quote(f["name"])), 16000)
            if isinstance(d, dict) and re.match(r"^\d{4}-\d{2}-\d{2}$", d.get("date", "")):
                prev = dispos.get(d["date"])
                if not prev or (prev.get("_mod") or "") <= (f["modified"] or ""):
                    d["id"] = d["date"]; d["_mod"] = f["modified"]; dispos[d["date"]] = d; changed = True
        except Exception as e: log("Callsheet nicht lesbar:", str(e)[:120])
    if dispos: data["dispos"] = sorted(dispos.values(), key=lambda d: d.get("date", ""))

    # screenplay
    f = pick_script(files)
    if f:
        sources.append({"kind": "script", "name": f["name"], "modified": f["modified"]})
        if is_new("script", f):
            log("Drehbuch: neu, wird eingelesen")
            sc = script_from_pdf(dbx.download(f["id"]))
            if len(sc) >= max(20, int(len(scr) * 0.7)):
                scr = sc; changed = True; log("Drehbuch:", len(sc), "Szenen")
            else:
                log("Drehbuch: zu wenige Szenen erkannt (%d) – bisheriges bleibt" % len(sc)); sources[-1] = oldkind.get("script") or sources[-1]

    # weekly prep / rehearsal schedule (shared folder «3D» → 11_Planning Prep Rehearsals): newest PDF, outside «z OLD»
    try:
        pf = [e for e in dbx.list_path(ROOT3D + "/11_Planning Prep Rehearsals") if e["tag"] == "file" and e["name"].lower().endswith(".pdf")]
    except Exception: pf = []
    if pf:
        f = max(pf, key=lambda e: e["modified"] or "")
        name = "3D/11_Planning Prep Rehearsals/" + f["name"]
        sources.append({"kind": "prep", "name": name, "modified": f["modified"]})
        if FORCE or old.get(("prep", base(name))) != f["modified"]:
            log("Prep-Wochenplanung: neu, wird ausgelesen")
            ex = {"days": (data.get("prepro") or [])[:2], "meta": {k: v for k, v in (meta.get("prepro") or {}).items() if k in ("title", "range", "issued", "distribution", "note")}}
            try:
                res = claude([pdf_block(dbx.download(f["id"]))],
                    "Erzeuge aus dieser Wochenplanung (Weekly Schedule, Vorbereitung & Proben) ein JSON-Objekt {\"days\": [...], \"meta\": {...}} genau in der Struktur dieses Beispiels: %s\n"
                    "Regeln: ein Eintrag pro Kalendertag (id = date = YYYY-MM-DD; der Wochentag im PDF ist massgebend, falsche Datumsangaben korrigieren und in meta.note auf Deutsch erwähnen, mit note_fr, note_it, note_en). "
                    "items: {t \"HH:MM\" oder \"TBA\"/\"All Day\"/\"N.A\", end, n (Titel wie im PDF, nicht übersetzen), crew, cast (Namen kommagetrennt wie im PDF), where (Ort mit Adresse), map (Link aus dem PDF), hl true für farbig hervorgehobene Zeilen}. "
                    "VERBUNDENE ZELLEN beachten: gilt ein Ort für mehrere Zeilen, bei jeder dieser Zeilen eintragen. Parallele Termine in parallel[], Transporte in transport {cast, castMap, crew, crewMap, rows:[{driver, name, from, fromMap, at, to, toMap, arr}]}. "
                    "meta: {source: \"%s\", title, range, issued (Ausgabedatum/Zeit im PDF), distribution (Verteiler), note…}." % (json.dumps(ex, ensure_ascii=False)[:20000], f["name"]), 32000)
                days = res.get("days") if isinstance(res, dict) else None
                if isinstance(days, list) and days:
                    for d in days: d["id"] = d.get("date") or d.get("id")
                    data["prepro"] = sorted(days, key=lambda d: d.get("date", ""))
                    pm = res.get("meta") or {}; pm["source"] = f["name"]; meta["prepro"] = pm
                    changed = True; log("Prep-Wochenplanung:", len(days), "Tage")
                else:
                    log("Prep-Wochenplanung: Ergebnis unvollständig – bisherige bleibt"); sources[-1] = oldkind.get("prep") or sources[-1]
            except Exception as e:
                log("Prep-Wochenplanung nicht lesbar:", str(e)[:120]); sources[-1] = oldkind.get("prep") or sources[-1]

    # floorplans (PDF) and blocking photo folders (shared folder «3D» → 0_BlockingFloorplans)
    try:
        fl = [e for e in dbx.list_path(ROOT3D + "/0_BlockingFloorplans/floorplans locations") if e["tag"] == "file" and re.search(r"\.(pdf|png|jpe?g)$", e["name"], re.I)]
        allb = dbx.list_path(ROOT3D + "/0_BlockingFloorplans", True)
        bl = [e for e in allb if e["tag"] == "folder" and e["name"].lower().startswith("scene_") and e["path"].count("/") <= 3]
        bpdf = {}  # scene folder name → PDFs directly inside it
        bpdfe = {}  # the same as Dropbox entries
        for e in allb:
            pp = e["path"].split("/")
            if e["tag"] == "file" and e["name"].lower().endswith(".pdf") and len(pp) >= 2 and pp[-2].lower().startswith("scene_"): bpdf.setdefault(pp[-2], []).append(e["name"]); bpdfe.setdefault(pp[-2], []).append(e)
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
            if e["name"] in kb: blk.append(kb[e["name"]]); continue
            sc = [re.sub(r"^0+", "", p) for p in e["name"][6:].replace(" CAR", "").split("_") if p]
            blk.append({"name": e["name"], "sc": sc, "url": bdir})
        def plabel(n): return re.sub(r"(?<![0-9A-Za-z])0+(?=\d)", "", re.sub(r"(?i)^scene[\s_]*", "", n[:-4]))
        # blocking photos and videos: encrypted preview images in blk/ (binary: 12-byte IV + AES-GCM), shown in the app's gallery
        bmed = {}
        for e in allb:
            pp = e["path"].split("/")
            if e["tag"] == "file" and len(pp) >= 2 and pp[-2].lower().startswith("scene_") and re.search(r"\.(jpe?g|png|heic|mov|mp4|m4v)$", e["name"], re.I):
                bmed.setdefault(pp[-2], []).append(e)
        os.makedirs("blk", exist_ok=True)
        want_files = set()
        for b in blk:
            items = []
            folder = b.get("url") or bdir
            for e in sorted(bmed.get(b["name"], []), key=lambda e: e["name"].lower()):
                key = hashlib.sha1((str(e.get("id")) + "|" + str(e.get("modified"))).encode()).hexdigest()[:20]
                fn = "blk/" + key + ".bin"; want_files.add(fn)
                if not os.path.exists(fn):
                    try:
                        r = requests.post("https://content.dropboxapi.com/2/files/get_thumbnail_v2", timeout=120, headers=dict(dbx.h, **{"Dropbox-API-Arg": json.dumps({"resource": {".tag": "path", "path": e["id"]}, "format": "jpeg", "size": "w960h640", "mode": "fitone_bestfit"})}))
                        r.raise_for_status()
                        iv = secrets.token_bytes(12)
                        open(fn, "wb").write(iv + AESGCM(KEY).encrypt(iv, small_jpeg(r.content), None)); changed = True
                    except Exception as ex:
                        log("Vorschau fehlt:", e["name"], str(ex)[:80]); want_files.discard(fn); continue
                vid = bool(re.search(r"\.(mov|mp4|m4v)$", e["name"], re.I))
                vf = None
                if vid:  # playable copy: 720p H.264 MP4, encrypted like the previews
                    vf = "blk/" + key + ".mp4.bin"; want_files.add(vf)
                    if not os.path.exists(vf):
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
                                                "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", dst], check=True, timeout=900)
                                data = open(dst, "rb").read()
                            if len(data) > 45e6: raise RuntimeError("zu gross")
                            iv = secrets.token_bytes(12)
                            open(vf, "wb").write(iv + AESGCM(KEY).encrypt(iv, data, None)); changed = True
                        except Exception as ex:
                            log("Film nicht umgewandelt:", e["name"], str(ex)[:120]); want_files.discard(vf); vf = None
                items.append({"n": e["name"], "t": "vid" if vid else "img", "f": fn, **({"v": vf} if vf else {}),
                              "u": folder.replace("&dl=0", "&preview=" + requests.utils.quote(e["name"].replace(" ", "+"), safe="+") + "&dl=0") if "/Scene_" in folder else folder})
            if items != [m for m in (b.get("media") or []) if not m.get("g")]:
                b["media"] = items + [m for m in (b.get("media") or []) if m.get("g")]; changed = True
        # ---- more pictures behind the camera button ----
        # (a) every page of the blocking PDFs as a picture (most scenes only have the PDF)
        # (b) the shot breakdown folder «AUFLÖSUNG»: per location folder «NN NAME 012_021_034 CH» the scene folders «Scene 027»
        #     (photos + PDFs) and the 3D/location pictures of that set, shown for every scene in the folder name
        BPDFE.clear(); BPDFE.update(bpdfe)
        try:
            changed = add_more_blocking(dbx, blk, meta, want_files, data.get("days") or [], data.get("locations") or []) or changed
        except Exception as ex:
            log("Auflösung/Seiten nicht gelesen:", str(ex)[:160])
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
        for bf in os.listdir("blk"):
            if "blk/" + bf not in want_files and bf.endswith(".bin"):
                os.remove("blk/" + bf); changed = True
        for b in blk:  # every scene PDF as its own button (preview inside the shared scene folder)
            names = sorted(bpdf.get(b["name"], []))
            if not names: continue
            old_pdfs = b.get("pdfs") or []
            folder = b.get("url") or bdir
            pdfs = [{"l": plabel(n), "u": folder.replace("&dl=0", "&preview=" + requests.utils.quote(n.replace(" ", "+"), safe="+") + "&dl=0") if "/Scene_" in folder else folder} for n in names]
            if pdfs != old_pdfs: b["pdfs"] = pdfs; changed = True
        if [x.get("file") for x in fps] != [x.get("file") for x in meta.get("floorplans") or []] or [x.get("name") for x in blk] != [x.get("name") for x in meta.get("blocking") or []]:
            meta["floorplans"], meta["blocking"] = fps, blk; changed = True; log("Floorplans:", len(fps), "· Blocking:", len(blk))

    # location list (Google Sheet chosen by the main admin)
    sheet = cfg.get("locSheet") or DEFAULT_SHEET
    try:
        txt = read_sheet(sheet)
    except Exception: txt = None
    if txt:
        h = hashlib.sha256(txt.encode()).hexdigest()[:16]
        if FORCE or h != meta.get("locHash"):
            log("Motivliste: geändert, wird ausgelesen")
            res = claude([{"type": "text", "text": "MOTIVLISTE (Tabelle, Zellen mit | getrennt, Links in <…>):\n" + txt}],
                "Erzeuge daraus ein JSON-Array gemäss Collection \"locations\" (Feld \"id\" = \"l00\", \"l01\" …). Bestehende Einträge (für fehlende Maps-Links übernehmen): %s"
                % json.dumps(strip_ids(data.get("locations")), ensure_ascii=False)[:40000], 32000)
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

    meta["sources"] = sources; meta["checkedAt"] = NOW
    if changed: meta["updatedAt"] = NOW
    data["meta"] = meta
    for k in ("days", "crew", "locations", "places", "dispos"): data.setdefault(k, [])
    if not data["days"] or not data["crew"]: sys.exit("Keine Drehtage oder Crew – nichts veröffentlicht")
    try: add_drive_times(data)
    except Exception as e: log("Anfahrt nicht berechnet:", type(e).__name__)
    w1 = enc_file(R / "data.enc.json", data)
    w2 = enc_file(R / "script.enc.json", {"script": [{k: d[k] for k in ("sc", "head", "text") if k in d} for d in scr]}) if scr else False
    log("Daten:", "geändert" if changed else "unverändert", "· Datei:", "neu geschrieben" if (w1 or w2) else "gleich")
    status("ok", "Läuft", updatedAt=meta.get("updatedAt") or "", version=meta.get("scheduleVersion") or "")

if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        if e.code not in (None, 0): status("error", str(e.code)[:160])
        raise
    except Exception as e:
        # only the error type and a short text – never file contents (public repository)
        status("error", (type(e).__name__ + ": " + str(e))[:160]); raise
