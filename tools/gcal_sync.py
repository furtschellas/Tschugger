#!/usr/bin/env python3
"""Google Kalender → App (läuft im Push-Workflow alle 10 Minuten).

Die geheime iCal-Adresse des Kalenders steht in Firestore secret/gcal (nur Owner/Admins mit «Einstellungen» sehen
und ändern sie, App-Verwaltung → App → Termine). Dieses Skript
  * liest die Termine der nächsten 120 Tage (auch Serientermine) und legt sie verschlüsselt in gcal/feed ab –
    daraus wählt man in der App unter «Meine Termine → Google Kalender» aus, welche übernommen werden und wer sie sieht;
  * gleicht übernommene Termine (events/* mit gc = Termin-ID) mit dem Kalender ab: geänderte Zeit, Titel oder Ort
    werden nachgeführt (die gewählten Empfänger bleiben), im Kalender gelöschte Termine verschwinden aus der App.
Braucht das Dienstkonto (FIREBASE_SA). Das Repository ist öffentlich: im Protokoll stehen nur Zahlen.
"""
import base64, datetime, json, os, secrets, sys, time, zoneinfo

import requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fsadmin  # noqa: E402

DAYS = 120
TZ = "Europe/Zurich"


def log(*a): print("•", *a, flush=True)


def enc(key, o):
    iv = secrets.token_bytes(12)
    return base64.b64encode(iv + AESGCM(key).encrypt(iv, json.dumps(o, ensure_ascii=False).encode(), None)).decode()


def dec(key, c):
    raw = base64.b64decode(c)
    return json.loads(AESGCM(key).decrypt(raw[:12], raw[12:], None))


def parse(ics, today=None):
    """ICS text → [{uid, title, date, t, end, where, note}] for today … today+DAYS (Swiss time; recurring events expanded)"""
    import icalendar, recurring_ical_events, zoneinfo
    tz = zoneinfo.ZoneInfo(TZ)
    today = today or datetime.datetime.now(tz).date()
    cal = icalendar.Calendar.from_ical(ics)
    out = []
    series = {str(v.get("UID") or "")[:280] for v in cal.walk("VEVENT") if v.get("RRULE") or v.get("RDATE") or v.get("RECURRENCE-ID")}
    for ev in recurring_ical_events.of(cal).between(today, today + datetime.timedelta(days=DAYS)):
        s, e = ev.get("DTSTART"), ev.get("DTEND")
        s = s.dt if s else None; e = e.dt if e else None
        if s is None: continue
        if isinstance(s, datetime.datetime):
            s = (s if s.tzinfo else s.replace(tzinfo=tz)).astimezone(tz)
            e = (e if (e is None or e.tzinfo) else e.replace(tzinfo=tz)); e = e.astimezone(tz) if e else None
            date, t = s.date().isoformat(), s.strftime("%H:%M")
            end = e.strftime("%H:%M") if e and e.date() == s.date() else ""
        else:   # all-day
            date, t, end = s.isoformat(), "", ""
        if date < today.isoformat(): continue
        uid = str(ev.get("UID") or "")[:280]
        rec = uid in series
        out.append({"rec": rec, "uid": uid, "title": str(ev.get("SUMMARY") or "")[:150], "date": date, "t": t, "end": end,
                    "where": str(ev.get("LOCATION") or "")[:200], "note": str(ev.get("DESCRIPTION") or "")[:2000]})
    n = {}
    for x in out: n[x["uid"]] = n.get(x["uid"], 0) + 1
    for x in out:   # recurring events: always one entry per day («uid|date», also when only one date of the series is in range);
        # a single event keeps its uid (so a moved date is followed)
        if x.pop("rec") or n[x["uid"]] > 1: x["uid"] += "|" + x["date"]
    return sorted(out, key=lambda x: (x["date"], x["t"]))


def sync(key, items, events):
    """events: [(id, fields)] from Firestore; returns (updates {id: new c}, deletes [id]) for events imported from the calendar"""
    by = {x["uid"]: x for x in items}
    today = datetime.datetime.now(zoneinfo.ZoneInfo(TZ)).date().isoformat()   # Swiss date (the runner runs in UTC)
    upd, dele = {}, []
    gcnew = sync.gcnew = {}
    for eid, f in events:
        gc = f.get("gc")
        if not gc: continue
        try: o = dec(key, f.get("c") or "")
        except Exception: continue
        x = by.get(gc)
        if not x and "|" not in gc and by.get(gc + "|" + o.get("date", "")):   # imported before the series rule: same date
            x = by[gc + "|" + o.get("date", "")]; gcnew[eid] = x["uid"]
        if not x:
            if o.get("date", "") >= today: dele.append(eid)   # deleted (or moved out of range) in the calendar
            continue
        n = dict(o)
        for k in ("title", "date", "t", "end", "where"):
            if not o.get("fix_" + k): n[k] = x[k]
        if n != o: n["upd"] = int(time.time() * 1000); upd[eid] = enc(key, n)
    return upd, dele


def main():
    if not fsadmin.sa():
        log("Kein Dienstkonto – Google Kalender übersprungen"); return 0
    cfg = fsadmin.get_doc("secret/gcal") or {}
    url = str(cfg.get("url") or "").strip()
    if not url: return 0
    if url.lower().startswith("webcal://"): url = "https://" + url[9:]   # iCloud gives webcal:// addresses
    if not url.startswith("https://"):
        log("Kalender-Adresse ungültig"); return 0
    key = base64.b64decode(fsadmin.crew_key_b64())
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        items = parse(r.content)
    except Exception as e:
        log("Google Kalender nicht lesbar:", type(e).__name__)
        fsadmin.patch_doc("gcal/feed", {"err": type(e).__name__, "errAt": int(time.time() * 1000)}); return 0
    old = fsadmin.get_doc("gcal/feed") or {}
    c = enc(key, items)
    sig = __import__("hashlib").sha1(json.dumps(items, sort_keys=True).encode()).hexdigest()[:16]
    now = int(time.time() * 1000)
    # the imported events are only compared when the calendar changed, at midnight (date) or at the latest every 6 hours –
    # reading all events every half hour used up the free Firebase quota
    full = old.get("sig") != sig or now - int(old.get("synced") or 0) > 6 * 3600e3 or time.strftime("%H") == "22"
    if old.get("sig") != sig:
        fsadmin.patch_doc("gcal/feed", {"c": c, "sig": sig, "n": len(items), "at": now, "err": "", **({"synced": now} if full else {})})
    else:
        fsadmin.patch_doc("gcal/feed", {"chk": now, "err": "", **({"synced": now} if full else {})})
    if not full:
        log(f"Google Kalender: {len(items)} Termine · unverändert"); return 0
    upd, dele = sync(key, items, [(i, f) for i, f, _ in fsadmin.list_docs("events")])
    for i, g in sync.gcnew.items(): fsadmin.patch_doc("events/" + i, {"gc": g})
    for i, cc in upd.items(): fsadmin.patch_doc("events/" + i, {"c": cc})
    for i in dele: fsadmin.delete_doc("events/" + i)
    log(f"Google Kalender: {len(items)} Termine · {len(upd)} nachgeführt · {len(dele)} entfernt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
