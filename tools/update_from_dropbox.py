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

    def download(self, fid):
        r = requests.post("https://content.dropboxapi.com/2/files/download", timeout=180,
                          headers=dict(self.h, **{"Dropbox-API-Arg": json.dumps({"path": fid})}))
        r.raise_for_status(); return r.content

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
