#!/usr/bin/env python3
"""Verspätung des Casts → Push an die Rollen mit dem Recht «Verspätung des Casts» (cast.late).

Läuft im Push-Workflow (alle 10 Minuten) vor push_send.py. Liegt eine Cast-Zeile des heutigen Callsheets mehr als 5 Minuten hinter
dem ersten noch nicht erledigten Schritt (Call · Ende Kostüm / Maske · Base · On set), wird eine automatische «Nachricht an alle»
(Art «late») an diese Rollen angelegt; push_send.py schickt sie an alle Geräte, die «Verspätung des Casts» im Profil nicht
ausgeschaltet haben. Pro Drehtag, Cast-Zeile und Schritt höchstens einmal (feste Dokument-ID).

Gleiche Regeln wie window.cqLate / cqModel in tools/boot/24-flow.js – beide zusammen ändern (tests/test_backend.py prüft das Python-Gegenstück).
Firebase-Kontingent: pro Lauf eine Zählung der heutigen Quittierungen (1 Lesezugriff); gelesen werden sie nur, wenn sich etwas
geändert hat (late.json, Actions-Cache). Öffentliches Protokoll: nur Zahlen."""
import datetime, hashlib, json, os, re, sys, time, unicodedata
from zoneinfo import ZoneInfo

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fsadmin  # noqa: E402
import coverday  # noqa: E402

STATE = os.path.join(ROOT, "late.json")
LATE_MIN = 5
STEP = {"c": ("Call", "Call", "Call", "Call", "कॉल"), "w": ("Kostüm", "Costume", "Costume", "Wardrobe", "कॉस्ट्यूम"),
        "m": ("Maske", "Maquillage", "Trucco", "Make-up", "मेकअप"), "b": ("Base", "Base", "Base", "Base", "बेस"), "o": ("On set", "On set", "On set", "On set", "ऑन सेट")}
LANGS = ("de", "fr", "it", "en", "hi")
TITLE = {"de": "Verspätung", "fr": "Retard", "it": "Ritardo", "en": "Delay", "hi": "देरी"}


# ---------- the same helpers as the app (24-flow.js, 12-mycal.js) ----------
def jshash(s):
    """the check sum of the app: h = h*33 + char code (UTF-16), 32 bit, base 36"""
    h = 5381
    for ch in s:
        o = ord(ch)
        units = [o] if o < 0x10000 else [0xD800 + ((o - 0x10000) >> 10), 0xDC00 + ((o - 0x10000) & 0x3FF)]
        for u in units: h = ((h << 5) + h + u) & 0xFFFFFFFF
    n, out = h, ""
    while True:
        n, r = divmod(n, 36); out = "0123456789abcdefghijklmnopqrstuvwxyz"[r] + out
        if not n: break
    return out


def fold(t): return "".join(c for c in unicodedata.normalize("NFD", str(t or "")) if not unicodedata.combining(c)).lower()
def pad2(n): return ("0" + str(n))[-2:]
def hm(t):
    m = re.search(r"(\d{1,2}):(\d{2})", str(t or ""))
    return pad2(int(m.group(1))) + ":" + m.group(2) if m else ""
def cq_hm(v): return hm(re.sub(r"(^|[^\d])(\d{1,2})\.(\d{2})(?!\d)", r"\1\2:\3", str("" if v is None else v), count=1))
def cm_id(date, k, r, t):
    t = cq_hm(t) or t
    u2 = "u2:" if (r or {}).get("u") == "2" else ""   # a row of the 2nd Unit: its own ids (like cmId in 24-flow.js)
    return "m" + jshash("|".join([date, k, u2 + str((r or {}).get("no") or (r or {}).get("role") or "").strip(), t]).lower())
def ride_id(date, x):
    return "r" + jshash("|".join([date, hm(x.get("t1")), hm(x.get("t2")), str(x.get("from") or "").strip(), str(x.get("to") or "").strip(), str(x.get("vehicle") or "").strip()]).lower())
def nmk(t): return re.sub(r"[^a-z]+", " ", fold(t)).strip()
def near1(a, b):
    """one letter off (wrong, missing, extra or two swapped) – like near1 in 11-schedule-prep.js"""
    if a == b: return True
    if abs(len(a) - len(b)) > 1: return False
    i = 0
    while i < len(a) and i < len(b) and a[i] == b[i]: i += 1
    return a[i + 1:] == b[i + 1:] or a[i + 1:] == b[i:] or a[i:] == b[i + 1:] or (i + 1 < len(a) and i + 1 < len(b) and a[i] == b[i + 1] and a[i + 1] == b[i] and a[i + 2:] == b[i + 2:])
def name_hit(name):
    """like nameHit in 11-schedule-prep.js: the whole name, or first and last name – each only at the start of a word;
    one of the two exact, the other one letter off (same first letter, at least 3 letters)"""
    k = nmk(name); parts = [w for w in k.split(" ") if len(w) > 1]
    if not k: return None
    ws = lambda n, w: (" " + w) in (" " + n)
    ex = lambda t, p: t.startswith(p)
    fz = lambda t, p: len(p) >= 3 and len(t) >= 3 and t[0] == p[0] and near1(t, p) and (len(p) >= 4 or len(t) != len(p))
    def hit(t):
        n = nmk(t)
        if not n: return False
        if ws(n, k): return True
        if len(parts) < 2: return False
        f, l = parts[0], parts[-1]
        if ws(n, f) and ws(n, l): return True
        w = n.split(" ")
        return any((ex(w[i], f) and fz(w[i + 1], l)) or (fz(w[i], f) and ex(w[i + 1], l)) for i in range(len(w) - 1))   # side by side only
    return hit
def cm_parse(v):
    out = []
    for seg in re.split(r"\s*;\s*", str("" if v is None else v)):
        m = re.match(r"^\s*(?:([^\W\d_][\w.'’ -]*?)\s+)?(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})", seg)
        if m: out.append({"t": pad2(m.group(2)) + ":" + m.group(3), "end": pad2(m.group(4)) + ":" + m.group(5)})
    return out


# the unit of a ride on a day with a 2nd Unit – like csRideUnit in 13g-cs-unit2.js: «1», «2» or "" (both / not sure)
RX2 = re.compile(r"\b(2nd|2n?d|b)[\s-]*unit\b|\bunit[\s-]*(2|b)\b", re.I)
RX1 = re.compile(r"\b(1st|1n?d|a)[\s-]*unit\b|\bunit[\s-]*(1|a)\b", re.I)
def unit_people(c):
    if "_up" in c: return c["_up"]
    m = {}
    def add(n, u):
        n = str(n or "").strip()
        if len(n) >= 3: m.setdefault(n, set()).add(u)
    u2 = c.get("u2") if isinstance(c.get("u2"), dict) else {}
    for r in c.get("cast") or []:
        if isinstance(r, dict) and r.get("u") != "2": add(r.get("actor"), "1")
    for r in u2.get("cast") or []:
        if isinstance(r, dict): add(r.get("actor"), "2")
    for r in c.get("calls") or []:
        if not isinstance(r, dict): continue
        if str(r.get("t") or "").strip(): add(r.get("name"), "1")
        if str(r.get("t2") or "").strip(): add(r.get("name"), "2")
    # the infos by department: a person named in the column «1st UNIT» / «2nd UNIT» (also extra staff from the lists) – like csUnitPeople
    names = [str(r.get("name") or "") for r in c.get("calls") or [] if isinstance(r, dict)]
    for l in c.get("lists") or []:
        if isinstance(l, dict): names += re.split(r"\s*[,;]\s*", ",".join(l["names"]) if isinstance(l.get("names"), list) else str(l.get("names") or ""))
    names = list(dict.fromkeys(n.strip() for n in names if len(n.strip()) >= 5 and re.search(r"\s", n.strip())))
    for d in c.get("depts") or []:
        if not isinstance(d, dict): continue
        t1, t2 = str(d.get("text") or ""), str(d.get("text2") or "")
        if not t1.strip() and not t2.strip(): continue
        for n in names:
            h = name_hit(n)
            if h and t1 and h(t1): add(n, "1")
            if h and t2 and h(t2): add(n, "2")
    c["_up"] = [(name_hit(n), next(iter(us))) for n, us in m.items() if len(us) == 1 and name_hit(n)]
    return c["_up"]
def ride_unit(c, r):
    if not isinstance(c.get("u2"), dict) or not isinstance(r, dict): return ""
    if r.get("u") in ("1", "2"): return r["u"]
    tx = " ".join(str(r.get(k) or "") for k in ("from", "to"))
    p2, p1 = bool(RX2.search(tx)), bool(RX1.search(tx))
    if p1 and p2: return ""
    if p2: return "2"
    if p1: return "1"
    who = str(r.get("passengers") or r.get("people") or "")
    if not who.strip(): return ""
    # 2. the pickup of a cast row: the ride of that actor at its P/UP time belongs to the unit of that row
    t1 = cq_hm(r.get("t1")); us = set()
    if t1:
        u2c = (c.get("u2") or {}).get("cast") or []
        for lst, u in (([x for x in c.get("cast") or [] if isinstance(x, dict) and x.get("u") != "2"], "1"), ([x for x in u2c if isinstance(x, dict)], "2")):
            for x in lst:
                h = name_hit(x.get("actor")) if x.get("actor") else None
                if h and cq_hm(x.get("pickup")) == t1 and h(who): us.add(u)
    if len(us) == 1: return next(iter(us))
    # 3. long before the crew call of the later unit (90 min), the earlier unit has started: the earlier unit
    u2 = c.get("u2") or {}
    c1, c2 = cq_hm((c.get("times") or {}).get("crewCall")), cq_hm(u2.get("crewCall") or (u2.get("times") or {}).get("crewCall"))
    mm = lambda v: int(v[:2]) * 60 + int(v[3:])
    if c1 and c2 and t1 and c1 != c2:
        e, l, eu = (c2, c1, "2") if mm(c2) < mm(c1) else (c1, c2, "1")
        if mm(e) - 120 <= mm(t1) < mm(l) - 90: return eu
    a = b = 0
    for hit, u in unit_people(c):
        if hit(who):
            if u == "1": a += 1
            else: b += 1
    return "2" if b and not a else "1" if a and not b else ""


class Model:
    def __init__(self, acks, c, r):
        self.a, self.c, self.r, self.d = acks, c, r, c["_date"]
    def st(self, i):
        x = self.a.get(i)
        return 0 if not x else (1 if x.get("s") == 1 else 2)
    def ride_step(self, i):
        s = self.st(i)
        return 0 if not s else 3 if s == 2 else (2 if self.a.get("v" + i) else 1)
    def rides(self):
        has = name_hit(self.r.get("actor"))
        if not has: return []
        u = "2" if self.r.get("u") == "2" else "1"
        ok = lambda x: (lambda v: not v or v == u)(ride_unit(self.c, x))   # its unit or both – like cqRides in 24-flow.js
        return [x for x in (self.c.get("transport") or []) if isinstance(x, dict) and has(x.get("passengers")) and ok(x)] + \
               [x for x in (self.c.get("crewTransport") or []) if isinstance(x, dict) and has(x.get("people")) and ok(x)]


def late(acks, c, r, now_ms, days=None):
    """minutes a cast row is behind the callsheet (more than 5), else 0 – like window.cqLate"""
    M = Model(acks, c, r); d = M.d
    st = lambda k, t: M.st(cm_id(d, k, r, cq_hm(t))) if cq_hm(t) else 0
    rides = M.rides(); frm_base = lambda x: re.search("base", str(x.get("from") or ""), re.I)
    pu = [x for x in rides if not frm_base(x)]; t_pu = cq_hm(r.get("pickup"))
    ride = next((x for x in pu if cq_hm(x.get("t1")) == t_pu), pu[0] if pu else None)
    br = next((x for x in rides if frm_base(x)), None)
    rd = c.get("_rfrom") or d   # ride ids keep the date of the callsheet as read (cdFrom after a Coverday move, like rideEditApply in 25-ride-edit.js)
    rs = M.ride_step(ride_id(rd, ride)) if ride else 0; bs = M.ride_step(ride_id(rd, br)) if br else 0
    ok = cq_hm(r.get("onset")) or ("set" if str(r.get("onset") or "").strip() else "")
    wm, arrived, alldone, n = [], False, True, 0
    for k in ("w", "m"):
        for p in cm_parse(r.get("wardrobe") if k == "w" else r.get("makeup")):
            n += 1; s = M.st(cm_id(d, k, r, p["t"]))
            if s > 0: arrived = True
            if s != 2: alldone = False; wm.append(p["end"])
    on_done = bool(ok) and (M.st(cm_id(d, "o", r, ok)) > 0 or bs == 3)
    if on_done: return 0
    base_done = st("b", r.get("base")) == 2; wm_done = n > 0 and alldone
    call_act = st("c", r.get("call")) > 0 or rs == 3
    tz = ZoneInfo(fsadmin.tz_for(d, days))
    def wall(h, plus=0):   # «24:30» = 00:30 of the next day (as zurichUTC in the app)
        hh, mm = (int(x) for x in h.split(":")[:2])
        w = datetime.datetime.fromisoformat(d) + datetime.timedelta(days=plus, hours=hh, minutes=mm)
        return int(w.replace(tzinfo=tz).timestamp() * 1000)
    def at(t, ref=0):
        h = cq_hm(t)
        if not h: return 0
        v = wall(h)
        if ref and ref - v > 12 * 3600e3: v = wall(h, 1)
        return v
    ref = at(r.get("pickup")) or at(r.get("call")) or at(r.get("base"))
    due = []
    if not call_act and not arrived and not wm_done and not base_done: due.append(("c", at(r.get("call"), ref)))
    if not base_done:
        for k in ("w", "m"):
            for p in cm_parse(r.get("wardrobe") if k == "w" else r.get("makeup")):
                if M.st(cm_id(d, k, r, p["t"])) != 2: due.append((k, at(p["end"], ref)))
        due.append(("b", at(r.get("base"), ref)))
    due.append(("o", at(r.get("onset"), ref)))
    due = sorted([x for x in due if x[1]], key=lambda x: x[1])
    if not due: return 0
    k, t = due[0]; m = (now_ms - t) // 60000
    return (int(m), k) if m > LATE_MIN else 0


# ---------- Firestore ----------
def today_sig(date):
    """count of today's ticks + the sum of their times (one read): unchanged → the copy of the last run"""
    h, q = fsadmin._auth()
    r = requests.post(fsadmin.BASE + ":runAggregationQuery", headers=h, params=q, timeout=30, json={"structuredAggregationQuery": {
        "structuredQuery": {"from": [{"collectionId": "rideack"}], "where": {"fieldFilter": {"field": {"fieldPath": "d"}, "op": "EQUAL", "value": {"stringValue": date}}}},
        "aggregations": [{"alias": "n", "count": {}}, {"alias": "s", "sum": {"field": {"fieldPath": "at"}}}]}})
    r.raise_for_status()
    for x in r.json():
        a = (x.get("result") or {}).get("aggregateFields")
        if a: return str(fsadmin.val(a.get("n"))) + ":" + str(fsadmin.val(a.get("s")))
    return ""


def today_acks(date):
    h, q = fsadmin._auth()
    r = requests.post(fsadmin.BASE + ":runQuery", headers=h, params=q, timeout=30, json={"structuredQuery": {
        "from": [{"collectionId": "rideack"}], "where": {"fieldFilter": {"field": {"fieldPath": "d"}, "op": "EQUAL", "value": {"stringValue": date}}}}})
    r.raise_for_status()
    out = {}
    for x in r.json():
        d = x.get("document")
        if d: out[d["name"].rsplit("/", 1)[1]] = {k: fsadmin.val(v) for k, v in (d.get("fields") or {}).items()}
    return out


def message(r, k, m):
    no = str(r.get("no") or "").strip() or "?"; role = str(r.get("role") or "").strip()
    un = " · 2nd Unit" if r.get("u") == "2" else ""
    i18n = {l: {"title": TITLE[l] + " " + no + (" " + role if role else "") + un, "body": STEP[k][i] + " +" + str(m) + "′"} for i, l in enumerate(LANGS)}
    return i18n


def main():
    if not fsadmin.sa(): print("• Verspätung: kein Dienstkonto"); return
    key = fsadmin.crew_key()
    data = json.loads(fsadmin.dec_ivct(key, json.load(open(os.path.join(ROOT, "data.enc.json")))))
    days = [x for x in data.get("days") or [] if isinstance(x, dict)]
    today = datetime.datetime.now(ZoneInfo(fsadmin.TZ0)).date().isoformat()
    today = datetime.datetime.now(ZoneInfo(fsadmin.tz_for(today, days))).date().isoformat()   # the date in the time zone of the block
    try:   # diagnosis (codes only): quittieren per unit on/off, today's scene quittances per unit
        cf = fsadmin.get_doc("config/app") or {}
        h, q = fsadmin._auth()
        rr = requests.post(fsadmin.BASE + ":runQuery", headers=h, params=q, timeout=30, json={"structuredQuery": {
            "from": [{"collectionId": "sceneack"}], "where": {"fieldFilter": {"field": {"fieldPath": "d"}, "op": "EQUAL", "value": {"stringValue": today}}}}})
        sa = [{k: fsadmin.val(v) for k, v in (x["document"].get("fields") or {}).items()} for x in rr.json() if x.get("document")]
        u2 = [x for x in sa if str(x.get("u") or "1") == "2"]
        print("::notice title=Quittieren::Szenen quittieren 1st %s · 2nd %s · heute Einträge 1st %d · 2nd %d (davon mit eigener ID %d)" % (
            "aus" if cf.get("sceneAck") is False else "an", "aus" if cf.get("sceneAck2") is False else ("an" if cf.get("sceneAck2") is True else "wie 1st"),
            len(sa) - len(u2), len(u2), sum(1 for x in u2 if str(x.get("sc") or "").endswith("_u2"))))
        # the protocol of the app today: how many changes per kind (sceneack), errors by their type only
        t0 = datetime.datetime.fromisoformat(today).replace(tzinfo=ZoneInfo(fsadmin.TZ0)).astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        ra = requests.post(fsadmin.BASE + ":runQuery", headers=h, params=q, timeout=30, json={"structuredQuery": {
            "from": [{"collectionId": "audit"}], "where": {"fieldFilter": {"field": {"fieldPath": "at"}, "op": "GREATER_THAN_OR_EQUAL", "value": {"timestampValue": t0}}}}})
        au = [{k: fsadmin.val(v) for k, v in (x["document"].get("fields") or {}).items()} for x in ra.json() if x.get("document")]
        cnt = {}
        for x in au:
            k = "%s/%s" % (x.get("col"), x.get("op")); cnt[k] = cnt.get(k, 0) + 1
        dg = [x for x in au if x.get("op") == "error" and x.get("col") == "sceneack"]
        dg.sort(key=lambda x: str(x.get("at") or ""))
        if dg: print("::notice title=Quittieren Ablauf::%s" % " | ".join("%s %s" % (str(x.get("id") or "").replace("2026-", ""), re.sub(r"[^\w=.,:| -]", "", str(x.get("sum") or ""))[:110]) for x in dg[-14:]))
        errs = {}
        for x in au:
            if x.get("op") == "error":
                k = re.sub(r"[^A-Za-z]", "", str(x.get("sum") or "").split(":")[0])[:24] or "?"; errs[k] = errs.get(k, 0) + 1
        ms0 = int(datetime.datetime.fromisoformat(today).replace(tzinfo=ZoneInfo(fsadmin.TZ0)).timestamp() * 1000)
        rs = requests.post(fsadmin.BASE + ":runQuery", headers=h, params=q, timeout=30, json={"structuredQuery": {
            "from": [{"collectionId": "sceneack"}], "where": {"fieldFilter": {"field": {"fieldPath": "at"}, "op": "GREATER_THAN_OR_EQUAL", "value": {"integerValue": str(ms0)}}}}})
        jj = rs.json()
        if not isinstance(jj, list): print("::notice title=Quittierungen seit heute 00:00::Abfrage HTTP %s" % rs.status_code); jj = []
        sx = [{k: fsadmin.val(v) for k, v in (x["document"].get("fields") or {}).items()} for x in jj if isinstance(x, dict) and x.get("document")]
        print("::notice title=Quittierungen seit heute 00:00::%d · %s" % (len(sx), "; ".join("%s u%s s%s %s" % (x.get("d"), x.get("u"), x.get("s"), x.get("sc")) for x in sx[:12])))
        print("::notice title=Protokoll heute::%s · Fehler: %s" % (", ".join("%s %d" % kv for kv in sorted(cnt.items())) or "nichts", ", ".join("%s %d" % kv for kv in sorted(errs.items())) or "keine"))
    except Exception as e: print("::notice title=Diagnose::Fehler %s" % type(e).__name__)
    try:   # Coverday: the days and callsheets as the crew sees them in the app (a callsheet may belong to another day now)
        ops, _ = coverday.read_ops(key); data = coverday.apply(data, ops)
        days = [x for x in data.get("days") or [] if isinstance(x, dict)]
    except Exception as e:
        print("• Verspätung: Coverday nicht lesbar (" + type(e).__name__ + ")")
        if fsadmin.cd_touched(key, today): print("• Verspätung: Coverday-Änderung an diesem Tag – keine automatische Meldung"); return
    dp = next((x for x in data.get("dispos") or [] if isinstance(x, dict) and x.get("date") == today), None)
    c = dict((dp or {}).get("cs") or {}, _date=today, _rfrom=(dp or {}).get("cdFrom") or today)
    cast = [r for r in c.get("cast") or [] if isinstance(r, dict)]
    u2 = c.get("u2") if isinstance(c.get("u2"), dict) else {}
    cast += [dict(r, u="2") for r in u2.get("cast") or [] if isinstance(r, dict)]   # the 2nd Unit (read apart): marked for its own ids
    if not cast: print("• Verspätung: heute kein Cast im Callsheet"); return
    now = int(time.time() * 1000)
    try: old = json.load(open(STATE))
    except Exception: old = {}
    sig = today_sig(today)
    if old.get("date") == today and old.get("sig") == sig and isinstance(old.get("acks"), dict): acks = old["acks"]; read = False
    else: acks = today_acks(today); read = True
    json.dump({"date": today, "sig": sig, "acks": acks}, open(STATE, "w"))
    roles = ["owner", "admin"] + sorted(rid for rid, f, _ in fsadmin.list_docs("roles") if "cast.late" in (f.get("perms") or []) and rid != "admin")
    n = made = 0
    for r in cast:
        try: x = late(acks, c, r, now, days)
        except Exception as e: print("late: Zeile übersprungen", type(e).__name__); continue   # one odd row never stops the others
        if not x: continue
        n += 1; m, k = x
        if m > 180: continue   # a whole day behind: the row was simply not quittiert, no alarm
        b = {"title": "", "body": "", "i18n": message(r, k, m), "roles": roles, "push": True, "kind": "late", "by": "Automatisch",
             "at": now, "ch": {"push": True}, "url": "./#go=dispo:" + today}
        b["title"], b["body"] = b["i18n"]["de"]["title"], b["i18n"]["de"]["body"]
        did = "late-" + today.replace("-", "") + "-" + hashlib.sha256((("u2:" if r.get("u") == "2" else "") + str(r.get("no") or r.get("role") or "") + "|" + k).encode()).hexdigest()[:10]
        if fsadmin.new_broadcast(key, b, doc_id=did): made += 1
    print(f"• Verspätung: {len(cast)} Cast-Zeilen, {n} verspätet, {made} neue Nachricht(en)" + (" · Quittierungen gelesen" if read else ""))
    if made: print(f"::notice::Verspätung: {made} Nachricht(en) angelegt")


if __name__ == "__main__":
    try: main()
    except Exception as e:   # never stops the push run
        print("::warning::Verspätung: " + type(e).__name__ + " " + str(getattr(getattr(e, "response", None), "status_code", "") or ""))
