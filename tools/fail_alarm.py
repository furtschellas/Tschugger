#!/usr/bin/env python3
"""Alarm bei fehlgeschlagener Dropbox-Aktualisierung (läuft nur, wenn der Lauf fehlgeschlagen ist).

Zählt die Fehlläufe hintereinander in status.json (fails). Ab dem zweiten bekommen Owner und Admins eine
Push-Nachricht mit dem Grund – höchstens alle 6 Stunden, und nur wenn in der App-Verwaltung → App «Alarm …»
eingeschaltet ist (config/app.failAlarm, Standard: ein). Ein erfolgreicher Lauf setzt den Zähler zurück.
Braucht das Dienstkonto (FIREBASE_SA). Im öffentlichen Protokoll stehen nur Zahlen.
"""
import datetime, json, os, sys


HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fsadmin  # noqa: E402

TXT = {"de": ("Dropbox-Aktualisierung fehlgeschlagen", "{n}× hintereinander. Grund: {m}"),
       "fr": ("Échec de la mise à jour Dropbox", "{n}× de suite. Raison : {m}"),
       "it": ("Aggiornamento Dropbox non riuscito", "{n}× di seguito. Motivo: {m}"),
       "en": ("Dropbox update failed", "{n}× in a row. Reason: {m}")}


def main():
    p = os.path.join(ROOT, "status.json")
    try: st = json.load(open(p))
    except Exception: st = {}
    now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
    if st.get("state") != "error":   # the script itself did not get to record the error (e.g. setup step failed)
        st.update(state="error", msg="Lauf abgebrochen (siehe GitHub Actions)")
    st["fails"] = int(st.get("fails") or 0) + 1
    st["at"] = now.isoformat().replace("+00:00", "Z")
    send = st["fails"] >= 2
    try: last = datetime.datetime.fromisoformat(str(st.get("alarmAt", "")).replace("Z", "+00:00"))
    except Exception: last = None
    if last and (now - last).total_seconds() < 6 * 3600: send = False
    try: _alarm(st, send)
    except Exception as e:   # Firebase not reachable (e.g. quota): the status below is still saved
        print("• Alarm nicht angelegt:", type(e).__name__)
    json.dump(st, open(p, "w"), ensure_ascii=False, indent=1); open(p, "a").write("\n")
    print("• Fehlläufe hintereinander:", st["fails"])


def _alarm(st, send):
    if send and fsadmin.sa():
        cfg = fsadmin.get_doc("config/app") or {}
        if cfg.get("failAlarm") is not False:
            key = fsadmin.crew_key()
            msg = str(st.get("msg") or "")[:120]
            i18n = {l: {"title": t, "body": b.format(n=st["fails"], m=msg)} for l, (t, b) in TXT.items()}
            if fsadmin.alarm_broadcast(key, i18n, ["owner", "admin"], "https://github.com/furtschellas/Tschugger/actions/workflows/dropbox-update.yml"):
                st["alarmAt"] = st["at"]; print("• Alarm an Owner und Admins angelegt"); open(os.path.join(ROOT, ".alarm_sent"), "w").write("1")
        else:
            print("• Alarm in den App-Einstellungen ausgeschaltet")


if __name__ == "__main__":
    sys.exit(main())
