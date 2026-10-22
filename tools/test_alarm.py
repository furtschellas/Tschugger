#!/usr/bin/env python3
"""Alarm, wenn die automatischen Tests fehlschlagen (die App wird dann NICHT veröffentlicht):
Push-Nachricht nur an die Owner (verschlüsselt mit dem Crew-Schlüssel, wie alle Nachrichten). Die E-Mail an den Owner
kommt über ein GitHub-Issue (GitHub schickt sie). Im öffentlichen Protokoll stehen nur Namen von Prüfungen, keine Daten.
Aufruf: test_alarm.py <tests.json> <link zum Lauf>
"""
import base64, json, os, sys, time


HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fsadmin  # noqa: E402

TXT = {"de": ("Tests fehlgeschlagen – nicht veröffentlicht", "{n} Prüfung(en) fehlgeschlagen, die laufende App bleibt unverändert. {f}"),
       "fr": ("Tests échoués – rien publié", "{n} contrôle(s) échoué(s), l’app en ligne reste inchangée. {f}"),
       "it": ("Test falliti – nulla pubblicato", "{n} controllo/i fallito/i, l’app online resta invariata. {f}"),
       "en": ("Tests failed – not published", "{n} check(s) failed, the live app stays unchanged. {f}")}


def failed(path):
    try: d = json.load(open(path))
    except Exception: return ["Testlauf abgebrochen"]
    out = []
    for su in d.get("suites") or []:
        if su.get("crash"): out.append((su.get("name") or "") + ": abgebrochen")
        out += [c.get("n", "") for c in su.get("checks") or [] if not c.get("ok")]
    return out or ["Testlauf abgebrochen"]


def message(path):
    f = failed(path)
    short = "; ".join(f[:3])[:150] + (" …" if len(f) > 3 else "")
    return len(f), short, f


def main():
    path, url = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "")
    n, short, _ = message(path)
    if not fsadmin.sa():
        print("• Kein Dienstkonto – keine Push-Nachricht"); return 0
    key = base64.b64decode(fsadmin.crew_key_b64())
    i18n = {l: {"title": t, "body": b.format(n=n, f=short)} for l, (t, b) in TXT.items()}
    b = {"title": i18n["de"]["title"], "body": i18n["de"]["body"], "i18n": i18n, "roles": ["owner"], "push": True,
         "kind": "alarm", "by": "Automatisch", "at": int(time.time() * 1000), "ch": {"push": True}, "url": url or "./"}
    ok = fsadmin.new_broadcast(key, b)
    print("• Alarm an Owner:", "angelegt" if ok else "nicht angelegt", "·", n, "Fehler")
    return 0


if __name__ == "__main__":
    sys.exit(main())
