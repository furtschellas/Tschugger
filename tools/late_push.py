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
    return "m" + jshash("|".join([date, k, str((r or {}).get("no") or (r or {}).get("role") or "").strip(), t]).lower())
def ride_id(date, x):
    return "r" + jshash("|".join([date, hm(x.get("t1")), hm(x.get("t2")), str(x.get("from") or "").strip(), str(x.get("to") or "").strip(), str(x.get("vehicle") or "").strip()]).lower())
def nmk(t): return re.sub(r"[^a-z]+", " ", fold(t)).strip()
def name_hit(name):
    """like nameHit in 11-schedule-prep.js: the whole name, or first and last name – each only at the start of a word"""
    k = nmk(name); parts = [w for w in k.split(" ") if len(w) > 1]
    if not k: return None
    ws = lambda n, w: (" " + w) in (" " + n)
    def hit(t):
        n = nmk(t)
        if not n: return False
        if ws(n, k): return True
        return len(parts) > 1 and ws(n, parts[0]) and ws(n, parts[-1])
    return hit
def cm_parse(v):
    out = []
    for seg in re.split(r"\s*;\s*", str("" if v is None else v)):
        m = re.match(r"^\s*(?:([^\W\d_][\w.'’ -]*?)\s+)?(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})", seg)
        if m: out.append({"t": pad2(m.group(2)) + ":" + m.group(3), "end": pad2(m.group(4)) + ":" + m.group(5)})
    return out


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
        return [x for x in (self.c.get("transport") or []) if isinstance(x, dict) and has(x.get("passengers"))] + \
               [x for x in (self.c.get("crewTransport") or []) if isinstance(x, dict) and has(x.get("people"))]


def late(acks, c, r, now_ms, days=None):
    """minutes a cast row is behind the callsheet (more than 5), else 0 – like window.cqLate"""
    M = Model(acks, c, r); d = M.d
    st = lambda k, t: M.st(cm_id(d, k, r, cq_hm(t))) if cq_hm(t) else 0
    rides = M.rides(); frm_base = lambda x: re.search("base", str(x.get("from") or ""), re.I)
    pu = [x for x in rides if not frm_base(x)]; t_pu = cq_hm(r.get("pickup"))
    ride = next((x for x in pu if cq_hm(x.get("t1")) == t_pu), pu[0] if pu else None)
    br = next((x for x in rides if frm_base(x)), None)
    rs = M.ride_step(ride_id(d, ride)) if ride else 0; bs = M.ride_step(ride_id(d, br)) if br else 0
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
    def at(t, ref=0):
        h = cq_hm(t)
        if not h: return 0
        v = int(datetime.datetime.fromisoformat(d + "T" + h).replace(tzinfo=tz).timestamp() * 1000)
        if ref and ref - v > 12 * 3600e3:
            v = int((datetime.datetime.fromisoformat(d + "T" + h) + datetime.timedelta(days=1)).replace(tzinfo=tz).timestamp() * 1000)
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
    i18n = {l: {"title": TITLE[l] + " " + no + (" " + role if role else ""), "body": STEP[k][i] + " +" + str(m) + "′"} for i, l in enumerate(LANGS)}
    return i18n


def main():
    if not fsadmin.sa(): print("• Verspätung: kein Dienstkonto"); return
    key = fsadmin.crew_key()
    data = json.loads(fsadmin.dec_ivct(key, json.load(open(os.path.join(ROOT, "data.enc.json")))))
    days = [x for x in data.get("days") or [] if isinstance(x, dict)]
    today = datetime.datetime.now(ZoneInfo(fsadmin.TZ0)).date().isoformat()
    today = datetime.datetime.now(ZoneInfo(fsadmin.tz_for(today, days))).date().isoformat()   # the date in the time zone of the block
    dp = next((x for x in data.get("dispos") or [] if isinstance(x, dict) and x.get("date") == today), None)
    c = dict((dp or {}).get("cs") or {}, _date=today)
    cast = [r for r in c.get("cast") or [] if isinstance(r, dict)]
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
        x = late(acks, c, r, now, days)
        if not x: continue
        n += 1; m, k = x
        if m > 180: continue   # a whole day behind: the row was simply not quittiert, no alarm
        b = {"title": "", "body": "", "i18n": message(r, k, m), "roles": roles, "push": True, "kind": "late", "by": "Automatisch",
             "at": now, "ch": {"push": True}, "url": "./#go=dispo:" + today}
        b["title"], b["body"] = b["i18n"]["de"]["title"], b["i18n"]["de"]["body"]
        did = "late-" + today.replace("-", "") + "-" + hashlib.sha256((str(r.get("no") or r.get("role") or "") + "|" + k).encode()).hexdigest()[:10]
        if fsadmin.new_broadcast(key, b, doc_id=did): made += 1
    print(f"• Verspätung: {len(cast)} Cast-Zeilen, {n} verspätet, {made} neue Nachricht(en)" + (" · Quittierungen gelesen" if read else ""))
    if made: print(f"::notice::Verspätung: {made} Nachricht(en) angelegt")


if __name__ == "__main__":
    try: main()
    except Exception as e:   # never stops the push run
        print("::warning::Verspätung: " + type(e).__name__ + " " + str(getattr(getattr(e, "response", None), "status_code", "") or ""))
