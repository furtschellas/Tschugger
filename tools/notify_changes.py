#!/usr/bin/env python3
"""Automatische Push-Nachrichten bei Änderungen (läuft in der Dropbox-Aktualisierung NACH dem Veröffentlichen).

Liest pending_push.json (vom Updater geschrieben), legt pro Art eine «Nachricht an alle» in Firestore an
(verschlüsselt mit dem Crew-Schlüssel, wie die von Hand gesendeten) und nur an die Rollen, die den Bereich sehen
dürfen. Den Versand macht danach tools/push_send.py; dort kann jede Person die Arten einzeln abbestellen
(Mein Konto → Push). Braucht das Dienstkonto (FIREBASE_SA). Im öffentlichen Protokoll stehen nur Zahlen.
"""
import base64, datetime, json, os, secrets, sys, time

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fsadmin  # noqa: E402

WD = {"de": ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], "fr": ["lu", "ma", "me", "je", "ve", "sa", "di"],
      "it": ["lu", "ma", "me", "gi", "ve", "sa", "do"], "en": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
TXT = {
    "plan": {"de": "Drehplan geändert", "fr": "Plan de tournage modifié", "it": "Piano di riprese modificato", "en": "Shooting schedule changed"},
    "cs": {"de": "Neues Callsheet", "fr": "Nouvelle feuille de service", "it": "Nuovo foglio di chiamata", "en": "New callsheet"},
    "csu": {"de": "Callsheet aktualisiert", "fr": "Feuille de service mise à jour", "it": "Foglio di chiamata aggiornato", "en": "Callsheet updated"},
    "script": {"de": "Neue Drehbuch-Version", "fr": "Nouvelle version du scénario", "it": "Nuova versione della sceneggiatura", "en": "New script version"},
    "prep": {"de": "Prep-Planung geändert", "fr": "Planning de préparation modifié", "it": "Pianificazione prep modificata", "en": "Prep schedule changed"},
}
# which role may see what (like the app: no role sees callsheets and prep, but not the shooting schedule)
VIEW = {"plan": "view.plan", "cs": "view.dispo", "prep": "view.prep", "script": "view.script"}
NOROLE = {"plan": False, "cs": True, "prep": True, "script": False}
GO = {"plan": "plan", "cs": "dispo", "prep": "prep", "script": "script"}
SCRIPTBODY = {"de": "Drehbuch {v} ist in der App", "fr": "Le scénario {v} est dans l’app", "it": "La sceneggiatura {v} è nell’app", "en": "Script {v} is in the app"}


log = fsadmin.log


def fmt(date, lang, labels):
    d = datetime.date.fromisoformat(date)
    s = WD[lang][d.weekday()] + " " + d.strftime("%d.%m.")
    lb = labels.get(date) or ""
    return (lb + " · " + s) if lb else s


def main():
    p = os.path.join(ROOT, "pending_push.json")
    if not os.path.exists(p): return 0
    if not fsadmin.sa():
        log("Kein Dienstkonto (FIREBASE_SA) – keine automatischen Push-Nachrichten"); return 0
    key = base64.b64decode(fsadmin.crew_key_b64())
    pend = json.load(open(p))
    labels = {d["date"]: d.get("label") or "" for d in pend.get("days") or [] if d.get("date")}
    roles = {}
    for rid, f, _ in fsadmin.list_docs("roles"):
        roles[rid] = f.get("perms") or []
    # merge: one message per kind (several callsheets in one run → one message)
    groups = {}
    for n in pend.get("news") or []:
        k = "csu" if n["kind"] == "cs" and n.get("upd") else n["kind"]
        g = groups.setdefault(k, {"kind": n["kind"], "dates": set(), "version": n.get("version", "")})
        g["dates"].update(n.get("dates") or [])
    if "cs" in groups and "csu" in groups:   # new and updated together: one message «Neues Callsheet»
        groups["cs"]["dates"] |= groups.pop("csu")["dates"]
    made = 0
    for k, g in groups.items():
        kind = g["kind"]; dates = sorted(g["dates"])[:6]
        if not dates: continue
        perm = VIEW[kind]
        rl = ["owner", "admin"] + [r for r, perms in roles.items() if perm in perms and r != "admin"] + ([""] if NOROLE[kind] else [])
        i18n = {}
        for lang in ("de", "fr", "it", "en"):
            body = SCRIPTBODY[lang].replace("{v}", g.get("version") or "").replace("  ", " ") if kind == "script" else \
                ", ".join(fmt(d, lang, labels if kind != "prep" else {}) for d in dates)
            if kind == "plan" and g.get("version"): body = g["version"] + " · " + body
            i18n[lang] = {"title": TXT[k][lang], "body": body[:180]}
        at = int(time.time() * 1000)
        b = {"title": i18n["de"]["title"], "body": i18n["de"]["body"], "i18n": i18n, "roles": rl, "push": True, "kind": kind,
             "by": "Automatisch", "at": at, "ch": {"push": True}, "url": "./#go=" + GO[kind] + ":" + dates[0]}
        if fsadmin.new_broadcast(key, b): made += 1
    os.remove(p)
    log("Automatische Push-Nachrichten angelegt:", made)
    return 0


if __name__ == "__main__":
    sys.exit(main())
