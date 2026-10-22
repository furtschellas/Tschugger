"""Szenen-Protokoll → Google Sheet (Einstellungen → Einstellungen → «Szenen-Protokoll in Google Sheets»).

Runs in the push workflow (every 10 minutes). Reads the quittances (sceneack, service account) and the Drehplan
(data.enc.json, crew key) and writes one tab per unit with the same columns as the export of the app
(Drehtag, Datum, Unit, Eintrag, Status, I/E, Set, Seiten, Plan, Plan-Dauer, Beginn, Ende, Dauer, Beschreibung).
The rows are built like sceneLogSec/unitRows/scInfo in tools/boot/27-scene-ack.js – keep both in step.

Quota: per run one aggregation (count + sum of «at») of sceneack and one read of config/private; the whole
collection is only read when something changed (or the Drehplan / the link changed). Public log: only counts and codes."""
import base64, datetime, hashlib, json, os, re, sys, time, unicodedata
from zoneinfo import ZoneInfo

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fsadmin  # noqa: E402

TZ = ZoneInfo("Europe/Zurich")
STATE = os.path.join(ROOT, "sheet.json")   # signature of the last write (actions cache)
SCOPE = "https://www.googleapis.com/auth/spreadsheets"
UNAME = {"1": "1st", "2": "2nd", "3": "3rd"}
HEAD = ["Aktion", "Drehtag", "Datum", "Unit", "S", "I/E", "Seiten", "Set", "Plan Zeit", "PD", "Start", "Ende", "Dauer", "Diff.", "Beschreibung"]   # like the PDF of the app


def log(*a): print("•", *a, flush=True)
STAGE = ["start"]
def note(msg): print("::notice title=Szenen-Sheet::" + msg, flush=True)   # readable in the run summary (codes and counts only)


# ---------- the same helpers as the app ----------
def fold(t): return "".join(c for c in unicodedata.normalize("NFD", str(t or "")) if not unicodedata.combining(c)).lower()
def norm(s): return re.sub(r"\s+", "", str(s).lower())
def pad2(n): return ("0" + str(n))[-2:]
def hm(t):
    m = re.search(r"(\d{1,2}):(\d{2})", str(t or ""))
    return pad2(int(m.group(1))) + ":" + m.group(2) if m else ""
def ack_id(date, sc):
    s = re.sub(r"[^a-z0-9]", "", fold(sc))
    s = re.sub(r"^(dj|d|j|sc|sz|seq|scene|szene)(?=\d)", "", s)
    s = re.sub(r"(cont|continued|forts|fortsetzung)$", "", s)
    return str(date or "").replace("-", "") + "-" + s[:24]
def ev_key(t):
    t = str(t or "")
    if re.search(r"\b(lunch|mittag|pranzo|d[ée]jeuner)\b", t, re.I): return "lunch"
    if re.search(r"\b(wrap|drehschluss)\b", t, re.I): return "wrap"
    return ""
def is_setup(t): return bool(re.match(r"^\s*set[\s-]?up\b", str(t or ""), re.I))
def row_keys(rows):
    n, out = 0, []
    for r in rows or []:
        if not isinstance(r, dict) or r.get("sc"): out.append(""); continue
        t = str(r.get("n") or "")
        if is_setup(t): n += 1; out.append("setup" + str(n) if n > 1 else "setup")
        else: out.append(ev_key(t))
    return out
def base(k): return re.sub(r"_u[23]$", "", str(k or ""))
def label(k):
    k = base(k); m = re.match(r"^setup(\d*)$", k)
    return "Lunch" if k == "lunch" else "Wrap" if k == "wrap" else ("Setup" + (" " + m.group(1) if m.group(1) else "")) if m else "Szene " + k
def is_ev(k): k = base(k); return k in ("lunch", "wrap") or bool(re.match(r"^setup\d*$", k))
def items(day, u):
    if u == "2": x = (day.get("unit2") or {}).get("items")
    elif u == "3": x = (day.get("unit3") or {}).get("items")
    else: x = day.get("items")
    return [i for i in (x if isinstance(x, list) else []) if isinstance(i, dict)]
def clock(msv): return datetime.datetime.fromtimestamp(msv / 1000, TZ).strftime("%H:%M") if msv else ""
def num(v):
    try: return int(v or 0)
    except Exception:
        try: return int(float(v))
        except Exception: return 0


def unit_rows(d, u, l, day, cs):
    """one unit of one day – like unitRows in 27-scene-ack.js"""
    its = items(day, u); ks = row_keys(its)
    def ms(hhmm):
        v = re.match(r"^(\d{1,2}):(\d{2})$", str(hhmm or ""))
        if not v: return 0
        x = datetime.datetime.fromisoformat(d).replace(hour=int(v.group(1)), minute=int(v.group(2)), tzinfo=TZ)
        return int(x.timestamp() * 1000)
    def p_ix(k):
        b = base(k)
        if b in ks: return ks.index(b)
        for i, x in enumerate(its):
            if x.get("sc") and ack_id(d, x["sc"]) == ack_id(d, b): return i
        return -1
    def p_dur(i):
        if i < 0: return 0
        it = its[i]; m = re.match(r"^(\d+)\s*[h:]\s*(\d{1,2})|^(\d+)\s*['′m]", str(it.get("dur") or "").strip())
        if m: return int(m.group(3)) if m.group(3) else int(m.group(1)) * 60 + int(m.group(2))
        t0 = ms(hm(it.get("t")))
        if not t0: return 0
        for j in range(i + 1, len(its)):
            t1 = ms(hm(its[j].get("t")))
            if t1 > t0: return round((t1 - t0) / 60000)
        return 0
    def pl(k): i = p_ix(k); return (hm(its[i].get("t")) or "") if i >= 0 else ""
    def pd(k): return p_dur(p_ix(k))
    key = lambda x: x.get("sc") or "-".join(x["id"].split("-")[1:])
    p0 = lambda x: num(x.get("b")) or num(x.get("at"))
    setup = next((i for i in its if not i.get("sc") and is_setup(i.get("n"))), None)
    first_sc = next((i for i in its if i.get("sc")), None)
    uk = lambda k: k if u == "1" else k + "_u" + u
    get = lambda k: next((x for x in l if base(key(x)) == k), None)
    scs = [x for x in l if base(key(x)) not in ("lunch", "wrap", "setup")]
    real = [x for x in scs if not is_ev(key(x))]
    st0 = [p0(x) for x in real if p0(x)]; start = min(st0) if st0 else 0
    lu, wr = get("lunch"), get("wrap")
    pl_setup = hm(setup.get("t")) if setup else ""
    pl_start = (hm(cs.get("shootCall") or "") if u == "1" else "") or (hm(first_sc.get("t")) if first_sc else "")
    wr_e = (num(wr.get("e")) or p0(wr)) if wr else 0
    su = get("setup"); ent = []
    def add(x, name, st, plan, b, e, k="", drehstart=False, pdm=0):
        ent.append((x, {"name": name, "st": st, "plan": plan, "pdm": pdm or 0, "b": b or 0, "e": e or 0, "k": k, "drehstart": drehstart}))
    if su: add(p0(su), "Setup", 1 if su.get("s") == 1 else 2, pl_setup, p0(su), 0 if su.get("s") == 1 else num(su.get("e")), uk("setup"), pdm=pd("setup"))
    else: add(ms(pl_setup) or 1, "Setup", 2 if start else 0, pl_setup, ms(pl_setup), start, uk("setup"), pdm=pd("setup"))
    pw, ps = ms(pl("wrap")), ms(pl_start)
    add(start or ps or 2, "Drehstart", (2 if wr_e else 1) if start else 0, pl_start, start, wr_e, "", True, max(0, round((pw - ps) / 60000)) if pw and ps else 0)
    add(p0(lu) if lu else (ms(pl("lunch")) or 8e15), "Lunch", (1 if lu.get("s") == 1 else 2) if lu else 0, pl("lunch"), p0(lu) if lu else 0,
        num(lu.get("e")) if lu and lu.get("s") != 1 else 0, uk("lunch"), pdm=pd("lunch"))
    for x in scs:
        k = key(x); add(p0(x), label(k), 1 if x.get("s") == 1 else 2, pl(k), p0(x), 0 if x.get("s") == 1 else num(x.get("e")), k, pdm=pd(k))
    add(wr_e or ms(pl("wrap")) or 9e15, "Wrap", 2 if wr else 0, pl("wrap"), start if wr_e else 0, wr_e, uk("wrap"))
    ent.sort(key=lambda e: e[0])
    return [e[1] for e in ent]


def info(r, days, sched):
    """I/E, set, pages and description – like scInfo (setup and Drehstart: the I/E of the scene that follows)"""
    k = base(r["k"]); E = {"ie": "", "set": "", "pg": "", "desc": ""}
    if re.match(r"^setup\d*$", k) or r["drehstart"]:
        its = items(days.get(r["d"]) or {}, r["u"]); i = 0
        if not r["drehstart"]:
            ks = row_keys(its); i = ks.index(k) if k in ks else 0
        nx = next((x for x in its[i:] if x.get("sc")), None)
        E["ie"] = (nx or {}).get("ie") or ""; return E
    if not k or k in ("lunch", "wrap"): return E
    lst = sched.get(norm(k)) or []
    o = next((y for y in lst if y[0] == r["d"] and y[1] == r["u"]), None) or next((y for y in lst if y[0] == r["d"]), None)
    it = o[2] if o else {}
    return {"ie": it.get("ie") or "", "set": it.get("set") or "", "pg": it.get("pg") or "", "desc": it.get("d_de") or it.get("d") or ""}


def sc_key(sc): return re.sub(r"pt.*$", "", re.sub(r"[^a-z0-9]", "", fold(sc)))
def match_day(d, l, days, dispos):
    """the plan day and the callsheet whose scenes fit the quittierten scenes of date d best (own date when it fits as well)"""
    ks = {sc_key(x.get("sc") or "") for x in l if x.get("sc")} - {""}
    if not ks: return days.get(d), dispos.get(d)
    def score_day(day): return len(ks & {sc_key(i.get("sc")) for u in ("1", "2", "3") for i in items(day, u) if i.get("sc")})
    def score_cs(c): return len(ks & {sc_key(r.get("sc")) for r in (c.get("scenes") or []) if isinstance(r, dict) and r.get("sc")})
    def best(cands, own, sc):
        b, bs = own, sc(own) if own else 0
        for c in cands:
            v = sc(c)
            if v > bs: b, bs = c, v
        return b if bs else own
    return best(days.values(), days.get(d), score_day), best(dispos.values(), dispos.get(d), score_cs)


def build(acks, data):
    """{unit: [rows]} – the oldest day first, like the export of the app"""
    days = {d.get("date"): d for d in data.get("days") or [] if isinstance(d, dict) and d.get("date")}
    dispos = {}
    for c in data.get("dispos") or []:
        if isinstance(c, dict) and isinstance(c.get("date"), str): dispos.setdefault(c["date"], c)
    sched = {}
    for d in days.values():
        for u in ("1", "2", "3"):
            for it in items(d, u):
                if it.get("sc"): sched.setdefault(norm(it["sc"]), []).append((d["date"], u, it))
    shd = sorted(d["date"] for d in days.values() if d.get("kind") == "shoot" and any(i.get("sc") for i in items(d, "1")))
    today = datetime.datetime.now(TZ).date().isoformat()
    ds = {x.get("d") for x in acks if x.get("d")}
    # Coverday: a day shot on another date than in the Drehplan – the plan columns come from the plan day and the callsheet
    # with these scenes (matched by scene number); the date it left counts no longer as a shooting day
    used = {}
    for d in ds:
        pd_, pc_ = match_day(d, [x for x in acks if x.get("d") == d], days, dispos)
        used[d] = (pd_, pc_)
    gone = {pd_["date"] for d, (pd_, _) in used.items() if pd_ and pd_.get("date") != d} - ds
    shd = sorted((set(shd) | {d for d, (pd_, _) in used.items() if pd_ and pd_.get("date") != d}) - {g for g in gone if g >= min(ds or [today])})
    if (days.get(today) or {}).get("kind") == "shoot": ds.add(today)
    out = {}
    for d in sorted(ds):
        l = [x for x in acks if x.get("d") == d]; day = (used.get(d) or (None,))[0] or days.get(d) or {}; cs = (used.get(d) or (None, None))[1] or dispos.get(d) or {}
        has_u = lambda u: any(i.get("sc") for i in items(day, u))
        us = sorted(set(["1"] + [str(x.get("u") or "1") for x in l] + [u for u in ("2", "3") if has_u(u)]))
        dt = "DT " + str(shd.index(d) + 1) if d in shd else ""
        for u in us:
            for r in unit_rows(d, u, [x for x in l if str(x.get("u") or "1") == u], day, cs):
                r.update(d=d, u=u); i = info(r, days, sched)
                nd = r["drehstart"] or base(r["k"]) == "wrap"   # Drehstart and Wrap: points in time, no duration
                out.setdefault(u, []).append([r["name"], dt, ".".join(reversed(d.split("-"))), UNAME.get(u, u) + " Unit", "✓" if r["st"] == 2 else "",
                                              i["ie"], i["pg"], i["set"], r["plan"] or "", (r["pdm"] or "") if not nd else "", clock(r["b"]), clock(r["e"]),
                                              round((r["e"] - r["b"]) / 60000) if r["b"] and r["e"] and not nd else "",
                                              round((r["e"] - r["b"]) / 60000) - r["pdm"] if r["b"] and r["e"] and r["pdm"] and not nd else "", i["desc"]])
    return out


# ---------- Firestore: change check with one aggregation (count + sum of «at») ----------
def ack_signature():
    """count of the quittances + the newest «at»: two small queries (≈2 reads) instead of reading all of them"""
    h, q = fsadmin._auth()
    r = requests.post(fsadmin.BASE + ":runAggregationQuery", headers=h, params=q, timeout=30,
                      json={"structuredAggregationQuery": {"structuredQuery": {"from": [{"collectionId": "sceneack"}]}, "aggregations": [{"alias": "n", "count": {}}]}})
    r.raise_for_status()
    n = ""
    for x in r.json():
        a = (x.get("result") or {}).get("aggregateFields")
        if a: n = str(fsadmin.val(a.get("n")))
    r = requests.post(fsadmin.BASE + ":runQuery", headers=h, params=q, timeout=30,
                      json={"structuredQuery": {"from": [{"collectionId": "sceneack"}], "orderBy": [{"field": {"fieldPath": "at"}, "direction": "DESCENDING"}], "limit": 1}})
    r.raise_for_status()
    at = ""
    for x in r.json():
        d = x.get("document")
        if d: at = str(fsadmin.val((d.get("fields") or {}).get("at"))) + "@" + str(d.get("updateTime"))
    return n + ":" + at


# ---------- Google Sheets ----------
def sheet_id(url):
    m = re.search(r"/spreadsheets/d/([\w-]+)", url or "")
    return m.group(1) if m else ""


class SheetError(Exception):
    def __init__(self, code): super().__init__(code); self.code = code


def sheets_call(tok, method, path, **kw):
    r = requests.request(method, "https://sheets.googleapis.com/v4/spreadsheets/" + path, headers={"Authorization": "Bearer " + tok}, timeout=60, **kw)
    if r.status_code == 403:
        msg = ""
        try: msg = r.json().get("error", {}).get("message", "")
        except Exception: pass
        raise SheetError("api" if ("has not been used" in msg or "disabled" in msg or "SERVICE_DISABLED" in r.text) else "access")
    if r.status_code == 404: raise SheetError("notfound")
    if r.status_code >= 400: raise SheetError("http" + str(r.status_code))
    return r.json() if r.text else {}


def write_sheet(sid, out, proj=""):
    STAGE[0] = "token"
    tok = fsadmin.sa_token(SCOPE)
    STAGE[0] = "sheet"
    meta = sheets_call(tok, "GET", sid, params={"fields": "sheets(properties(sheetId,title))"})
    have = {s["properties"]["title"]: s["properties"]["sheetId"] for s in meta.get("sheets") or []}
    tabs = {UNAME.get(u, u) + " Unit": rows for u, rows in sorted(out.items())} or {"1st Unit": []}
    new = [t for t in tabs if t not in have]
    if new:
        sheets_call(tok, "POST", sid + ":batchUpdate", json={"requests": [{"addSheet": {"properties": {"title": t, "gridProperties": {"frozenRowCount": 1}}}} for t in new]})
    stamp = "Stand " + datetime.datetime.now(TZ).strftime("%d.%m.%Y %H:%M")
    for t, rows in tabs.items():
        rng = "'" + t.replace("'", "''") + "'"
        sheets_call(tok, "POST", sid + "/values/" + requests.utils.quote(rng + "!A:Z", safe="") + ":clear", json={})
        # RAW: pages like «1 1/8» and times stay text (no date), durations stay numbers
        sheets_call(tok, "PUT", sid + "/values/" + requests.utils.quote(rng + "!A1", safe=""), params={"valueInputOption": "RAW"},
                    json={"values": [[(proj or "TSCHUGGER Tigerblood") + " · Szenen-Protokoll · " + t, "", "", "", "", "", "", "", stamp]] + [HEAD] + rows})   # like the title of the PDF
    # a filter on every column and the column widths fitting the content
    meta = sheets_call(tok, "GET", sid, params={"fields": "sheets(properties(sheetId,title))"})
    ids = {x["properties"]["title"]: x["properties"]["sheetId"] for x in meta.get("sheets") or []}
    req = []
    for t, rows in tabs.items():
        g = ids.get(t)
        if g is None: continue
        # filter only up to «Set» (not on the times and the description); title and headings fixed; title, headings and «Aktion» bold
        req.append({"setBasicFilter": {"filter": {"range": {"sheetId": g, "startRowIndex": 1, "endRowIndex": len(rows) + 2, "startColumnIndex": 0, "endColumnIndex": HEAD.index("Set") + 1}}}})
        req.append({"updateSheetProperties": {"properties": {"sheetId": g, "gridProperties": {"frozenRowCount": 2}}, "fields": "gridProperties.frozenRowCount"}})
        req.append({"repeatCell": {"range": {"sheetId": g, "startRowIndex": 0, "endRowIndex": 2}, "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}}, "fields": "userEnteredFormat.textFormat.bold"}})
        req.append({"repeatCell": {"range": {"sheetId": g, "startRowIndex": 2, "endRowIndex": len(rows) + 2, "startColumnIndex": 0, "endColumnIndex": 1}, "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}}, "fields": "userEnteredFormat.textFormat.bold"}})
        # the title over the columns up to «Set» (so it does not make the first column wide)
        req.append({"unmergeCells": {"range": {"sheetId": g, "startRowIndex": 0, "endRowIndex": 1, "startColumnIndex": 0, "endColumnIndex": len(HEAD)}}})
        req.append({"mergeCells": {"range": {"sheetId": g, "startRowIndex": 0, "endRowIndex": 1, "startColumnIndex": 0, "endColumnIndex": HEAD.index("Set") + 1}, "mergeType": "MERGE_ALL"}})
        req.append({"autoResizeDimensions": {"dimensions": {"sheetId": g, "dimension": "COLUMNS", "startIndex": 0, "endIndex": len(HEAD) + 1}}})
    if req:
        try: sheets_call(tok, "POST", sid + ":batchUpdate", json={"requests": req})
        except SheetError as e: log("Szenen-Sheet: Filter/Breiten nicht gesetzt", e.code)
    return sum(len(r) for r in tabs.values()), len(tabs)


def status(**f):
    """state for the settings page (config/private, crew only): when, how many rows, an error code"""
    try: fsadmin.patch_doc("config/private", {"sceneSheetSt": {"at": int(time.time() * 1000), **f}})
    except Exception: pass


def main():
    if not fsadmin.sa(): log("Szenen-Sheet: kein Service-Konto"); return
    pv = fsadmin.get_doc("config/private") or {}
    url = str(pv.get("sceneSheet") or "").strip(); sid = sheet_id(url)
    sa_mail = fsadmin.sa().get("client_email", "")
    if sa_mail and pv.get("sheetSa") != sa_mail: fsadmin.patch_doc("config/private", {"sheetSa": sa_mail})
    if not sid: note("kein Sheet eingetragen" if not url else "Link ist kein Google-Sheets-Link"); return
    try: stamp = json.load(open(os.path.join(ROOT, "data.enc.json"))).get("stamp", "")
    except Exception: stamp = ""
    STAGE[0] = "signatur"
    try: asig = ack_signature()
    except Exception as e:   # the aggregation is only a saving: without it the whole collection is read
        note("Signatur nicht lesbar (" + type(e).__name__ + " " + str(getattr(getattr(e, "response", None), "status_code", "")) + ") – lese alle Quittierungen"); asig = str(time.time() // 1800)
    sig = hashlib.sha256(("v4|" + asig + "|" + stamp + "|" + sid + "|" + datetime.datetime.now(TZ).date().isoformat()).encode()).hexdigest()[:16]
    try: old = json.load(open(STATE))
    except Exception: old = {}
    if old.get("sig") == sig and (old.get("ok") or time.time() - old.get("t", 0) < 1800):   # after an error: again after 30 min (or when something changed)
        log("Szenen-Sheet: unverändert" if old.get("ok") else "Szenen-Sheet: letzter Fehler " + str(old.get("err"))); json.dump(old, open(STATE, "w")); return
    STAGE[0] = "daten"
    key = base64.b64decode(fsadmin.crew_key_b64())
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    e = json.load(open(os.path.join(ROOT, "data.enc.json")))
    data = json.loads(AESGCM(key).decrypt(base64.b64decode(e["iv"]), base64.b64decode(e["ct"]), None))
    acks = [dict(f, id=i) for i, f, _ in fsadmin.list_docs("sceneack")]
    STAGE[0] = "aufbau"
    out = build(acks, data)
    STAGE[0] = "sheet"
    try:
        n, t = write_sheet(sid, out, str((fsadmin.get_doc("config/app") or {}).get("projName") or "").strip())
        note(f"{n} Zeilen in {t} Tabellenblättern geschrieben")
        status(ok=True, n=n); json.dump({"sig": sig, "ok": True, "t": time.time()}, open(STATE, "w"))
    except SheetError as err:
        note("Fehler " + err.code)
        if old.get("err") != err.code: status(ok=False, err=err.code)
        json.dump({"sig": sig, "ok": False, "err": err.code, "t": time.time()}, open(STATE, "w"))


if __name__ == "__main__":
    try: main()
    except Exception as e:
        code = type(e).__name__ + (" " + str(getattr(getattr(e, "response", None), "status_code", "")) if getattr(e, "response", None) is not None else "")
        note("Fehler " + code.strip() + " bei " + STAGE[0])
        status(ok=False, err="intern", code=code.strip()[:40]); sys.exit(0)
