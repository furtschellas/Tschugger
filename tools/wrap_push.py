#!/usr/bin/env python3
"""Drehschluss-Push: ein Dankeschön an die Crew, sobald jemand den Drehschluss (Wrap) quittiert hat.

Läuft im Push-Workflow (alle 10 Minuten) vor push_send.py: legt eine automatische «Nachricht an alle» (Art «wrap») an,
push_send.py verschickt sie an alle Geräte, die «Nachricht bei Drehschluss» im Profil nicht ausgeschaltet haben.

* nur ein Quittieren der letzten 3 Stunden, frühestens 3 Minuten danach (ein Versehen kann noch rückgängig gemacht werden),
* pro Drehtag und Unit höchstens einmal (feste Dokument-ID wrap-JJJJMMTT-unit),
* mit dem Hinweis, ob es am nächsten Tag weitergeht (Drehplan aus data.enc.json); hat Coverday diesen Tag geändert, ein neutraler Hinweis.
Öffentliches Protokoll: nur Zahlen."""
import datetime, json, os, re, sys, time
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fsadmin  # noqa: E402

WINDOW = 3 * 3600 * 1000   # quittances of the last 3 h
GRACE = 3 * 60 * 1000      # 3 minutes to undo a mistake
UNAME = {"2": "2nd", "3": "3rd"}

# per language: title, thanks, and how it goes on – «go»/«free» the next day, «go0»/«free0» when the wrap was after midnight
# (the next day is already today), «ask» when the Drehplan does not say it reliably
TXT = {
    "de": dict(title="Drehschluss", thanks="Danke für den tollen Drehtag!", go="Morgen geht es weiter – schau ins Callsheet.", free="Morgen ist drehfrei – geniesst es!",
               go0="Heute geht es weiter – schau ins Callsheet.", free0="Heute ist drehfrei – geniesst es!", ask="Wie es weitergeht, steht im Callsheet."),
    "fr": dict(title="Fin de tournage", thanks="Merci pour cette super journée de tournage !", go="Demain, on continue – consultez la feuille de service.", free="Demain, pas de tournage – profitez-en !",
               go0="Aujourd'hui, on continue – consultez la feuille de service.", free0="Aujourd'hui, pas de tournage – profitez-en !", ask="La suite est dans la feuille de service."),
    "it": dict(title="Fine riprese", thanks="Grazie per la splendida giornata di riprese!", go="Domani si continua – guardate l'ordine del giorno.", free="Domani niente riprese – godetevela!",
               go0="Oggi si continua – guardate l'ordine del giorno.", free0="Oggi niente riprese – godetevela!", ask="Come si prosegue lo trovate nell'ordine del giorno."),
    "en": dict(title="Wrap", thanks="Thanks for a great shooting day!", go="Tomorrow we keep going – check the call sheet.", free="Tomorrow is a day off – enjoy it!",
               go0="Today we keep going – check the call sheet.", free0="Today is a day off – enjoy it!", ask="Check the call sheet for what's next."),
    "hi": dict(title="शूटिंग समाप्त", thanks="शानदार शूटिंग दिन के लिए धन्यवाद!", go="कल शूटिंग जारी है – कॉल शीट देखें।", free="कल शूटिंग नहीं है – आराम करें!",
               go0="आज शूटिंग जारी है – कॉल शीट देखें।", free0="आज शूटिंग नहीं है – आराम करें!", ask="आगे क्या है, कॉल शीट में देखें।"),
}


def base(sc): return re.sub(r"_u[23]$", "", str(sc or ""))   # like scBase in 27-scene-ack.js


def items(day, u):   # like items() in scene_sheet.py
    x = (day.get("unit" + u) or {}).get("items") if u in ("2", "3") else day.get("items")
    return [i for i in (x if isinstance(x, list) else []) if isinstance(i, dict)]


def next_day(d):
    return (datetime.date.fromisoformat(d) + datetime.timedelta(days=1)).isoformat()


cd_touched = fsadmin.cd_touched   # shared with late_push.py


def outlook(d, u, days, key, now_ms):
    """how it goes on after the wrap of day d in unit u: «go», «free» or «ask» (+ «0» when the next day is already today)"""
    nd = next_day(d)
    if not any(str(x.get("date") or "") >= nd for x in days) or cd_touched(key, nd): return "ask"   # Drehplan ends here / Coverday changed it
    nx = next((x for x in days if x.get("date") == nd), None) or {}
    if nx.get("kind") == "shoot" and (u == "1" or items(nx, u)): k = "go"   # 2nd/3rd Unit: only with own scenes that day
    elif u != "1": return "ask"   # 2nd/3rd Unit not shooting: the crew may still work in the 1st Unit
    else: k = "free"
    today = datetime.datetime.fromtimestamp(now_ms / 1000, ZoneInfo(fsadmin.tz_for(d, days))).date().isoformat()
    return k + ("0" if today >= nd else "")   # wrap after midnight


def message(d, u, days, key, now_ms):
    """(i18n, url) of the message for the wrap of day d (YYYY-MM-DD) in unit u"""
    k = outlook(d, u, days, key, now_ms)
    un = " " + UNAME[u] + " Unit" if u in UNAME else ""
    i18n = {l: {"title": t["title"] + un + " 🎬", "body": t["thanks"] + " " + t[k]} for l, t in TXT.items()}
    return i18n, "./#go=dispo:" + next_day(d) if k.startswith("go") else "./"


def main():
    if not fsadmin.sa(): print("• Drehschluss-Push: kein Dienstkonto"); return
    now = int(time.time() * 1000)
    acks = [f for _, f, _ in fsadmin.query_since_ms("sceneack", "at", now - WINDOW)]
    due = set()
    for f in acks:
        if base(f.get("sc")) != "wrap" or f.get("s") != 2 or not re.match(r"^\d{4}-\d{2}-\d{2}$", str(f.get("d") or "")): continue
        at, t = int(f.get("at") or 0), int(f.get("e") or f.get("b") or 0)
        if now - at < GRACE or now - t > WINDOW: continue   # just quittiert (maybe a mistake) / a wrap entered afterwards
        due.add((f["d"], str(f.get("u") or "1")))
    if not due: print(f"• Drehschluss-Push: {len(acks)} neue Quittierungen, kein Drehschluss fällig"); return
    key = fsadmin.crew_key()
    try: days = [x for x in json.loads(fsadmin.dec_ivct(key, json.load(open(os.path.join(ROOT, "data.enc.json"))))).get("days") or [] if isinstance(x, dict)]
    except Exception as e:
        print("• Drehplan nicht lesbar:", type(e).__name__); days = []
    n = 0
    for d, u in sorted(due):
        i18n, url = message(d, u, days, key, now)
        b = {"title": i18n["de"]["title"], "body": i18n["de"]["body"], "i18n": i18n, "push": True, "kind": "wrap",
             "by": "Automatisch", "at": now, "ch": {"push": True}, "url": url}
        if fsadmin.new_broadcast(key, b, doc_id="wrap-" + d.replace("-", "") + "-" + u): n += 1
    print(f"• Drehschluss-Push: {len(due)} Drehschluss, {n} neue Nachricht(en)")
    if n: print(f"::notice::Drehschluss-Push: {n} Nachricht(en) angelegt")


if __name__ == "__main__":
    try: main()
    except Exception as e:   # never stops the push run
        print("::warning::Drehschluss-Push: " + type(e).__name__ + " " + str(getattr(getattr(e, "response", None), "status_code", "") or ""))
