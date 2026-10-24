#!/usr/bin/env python3
"""Automatische Push-Nachrichten bei Änderungen (läuft in der Dropbox-Aktualisierung NACH dem Veröffentlichen).

Liest pending_push.json (vom Updater geschrieben), legt pro Art eine «Nachricht an alle» in Firestore an
(verschlüsselt mit dem Crew-Schlüssel, wie die von Hand gesendeten) und nur an die Rollen, die den Bereich sehen
dürfen. Den Versand macht danach tools/push_send.py; dort kann jede Person die Arten einzeln abbestellen
(Mein Konto → Push). Braucht das Dienstkonto (FIREBASE_SA). Im öffentlichen Protokoll stehen nur Zahlen.
"""
import base64, datetime, json, os, sys, time


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
    has_file = os.path.exists(p)
    # what could not be sent last time waits in Firestore (encrypted) – the file itself is gone after the run
    if not has_file and not fsadmin.sa(): return 0
    if not has_file:
        try:
            if not (fsadmin.get_doc("pending/push") or {}).get("c"): return 0
        except Exception: return 0
    if not fsadmin.sa():
        log("Kein Dienstkonto (FIREBASE_SA) – keine automatischen Push-Nachrichten"); return 0
    kb = fsadmin.crew_key_b64()
    if not kb:   # key not readable: the file stays for the next run (no message encrypted with a wrong key)
        log("Crew-Schlüssel nicht lesbar – Push-Nachrichten beim nächsten Lauf"); return 0
    key = base64.b64decode(kb)
    pend = json.load(open(p)) if has_file else {"news": [], "days": []}
    try:   # merged with what is still waiting
        old = (fsadmin.get_doc("pending/push") or {}).get("c")
        if old:
            o = fsadmin.dec_json(key, old)
            pend["news"] = (o.get("news") or []) + (pend.get("news") or [])
            have = {d.get("date") for d in pend.get("days") or []}
            pend["days"] = (pend.get("days") or []) + [d for d in o.get("days") or [] if d.get("date") not in have]
    except Exception as e: log("Ausstehende Push-Nachrichten nicht lesbar:", type(e).__name__)
    labels = {d["date"]: d.get("label") or "" for d in pend.get("days") or [] if d.get("date")}
    roles = {}
    try:
        for rid, f, _ in fsadmin.list_docs("roles"):
            roles[rid] = f.get("perms") or []
    except Exception as e:   # roles not readable now: everything waits in Firestore for the next run
        log("Rollen nicht lesbar:", type(e).__name__)
        try: fsadmin.patch_doc("pending/push", {"c": fsadmin.enc_json(key, pend), "at": int(time.time())})
        except Exception: pass
        if has_file: os.remove(p)
        return 0
    # merge: one message per kind (several callsheets in one run → one message)
    groups = {}
    for n in pend.get("news") or []:
        k = "csu" if n["kind"] == "cs" and n.get("upd") else n["kind"]
        g = groups.setdefault(k, {"kind": n["kind"], "dates": set(), "version": n.get("version", "")})
        g["dates"].update(n.get("dates") or [])
    if "cs" in groups and "csu" in groups:   # new and updated together: one message «Neues Callsheet»
        groups["cs"]["dates"] |= groups.pop("csu")["dates"]
    made = 0; failed = set()
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
        else: failed.add(k)
    if has_file: os.remove(p)
    if not failed:
        try: fsadmin.delete_doc("pending/push")
        except Exception: pass
    else:   # only what could not be created waits for the next run, in Firestore (what was sent is not sent twice)
        ck = lambda n: "csu" if n["kind"] == "cs" and n.get("upd") and "csu" in groups else n["kind"]
        pend["news"] = [n for n in pend.get("news") or [] if ck(n) in failed]
        try: fsadmin.patch_doc("pending/push", {"c": fsadmin.enc_json(key, pend), "at": int(time.time())})
        except Exception as e: log("Ausstehende Push-Nachrichten nicht gespeichert:", type(e).__name__)
    log("Automatische Push-Nachrichten angelegt:", made)
    print("::notice::Push bei Änderungen: %d von %d Nachrichten angelegt (%s)" % (made, len(groups), ", ".join(sorted(groups)) or "–"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
