#!/usr/bin/env python3
"""Push-Nachrichten für «Meine Termine» verschicken.

Jedes Gerät, auf dem Push eingeschaltet ist, legt in Firestore unter push/{uid}_{gerät} seine kommenden
Erinnerungen ab – verschlüsselt mit dem Crew-Schlüssel (CREW_KEY), wie die Crew-Daten auf der Webseite.
Dieses Skript liest die Einträge (nur lesend), entschlüsselt sie und schickt fällige Erinnerungen als
Web-Push. Bereits verschickte Erinnerungen stehen in sent.json (wird zwischen den Läufen im Actions-Cache
aufbewahrt), damit nichts doppelt kommt.
"""
import base64, json, os, sys, time

import requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pywebpush import webpush, WebPushException

PROJECT = "tschugger-83692"
API_KEY = "AIzaSyBrHUJumAArmHv92qhZEbUFXSWrwvZaKjQ"
KEY = base64.b64decode(os.environ["CREW_KEY"].strip().strip('"\''))
HERE = os.path.dirname(os.path.abspath(__file__))
SENT = os.environ.get("PUSH_SENT", "sent.json")
EARLY = 6 * 60          # bis zu 6 Minuten zu früh ist in Ordnung (Läufe alle 10 Minuten)
LATE = 90 * 60          # verspätete Läufe: bis 90 Minuten nach dem Zeitpunkt noch schicken, aber nie nach Beginn
NOW = time.time()


def dec(iv, ct):
    return AESGCM(KEY).decrypt(base64.b64decode(iv), base64.b64decode(ct), None)


def vapid_pem():
    e = json.load(open(os.path.join(HERE, "vapid.enc.json")))
    return dec(e["iv"], e["ct"]).decode()


def docs(col="push"):
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents/" + col
    tok = None
    while True:
        r = requests.get(url, params={"pageSize": 300, "key": API_KEY, **({"pageToken": tok} if tok else {})}, timeout=30)
        r.raise_for_status()
        j = r.json()
        for d in j.get("documents", []):
            f = d.get("fields", {})
            if col == "broadcasts" and (f.get("sent", {}) or {}).get("booleanValue"):
                continue  # already sent right away by the Cloudflare Worker
            yield d["name"].rsplit("/", 1)[1], (f.get("c", {}) or {}).get("stringValue", "")
        tok = j.get("nextPageToken")
        if not tok:
            break


def main():
    try:
        sent = json.load(open(SENT))
    except Exception:
        sent = {}
    sent = {k: v for k, v in sent.items() if v > NOW - 3 * 86400}
    pem = vapid_pem()
    n_dev = n_sent = 0
    # messages to everybody / selected roles and departments (broadcasts), at most 24 h old
    bcs = []
    try:
        for bid, c in docs("broadcasts"):
            try:
                raw = base64.b64decode(c); b = json.loads(AESGCM(KEY).decrypt(raw[:12], raw[12:], None))
                if b.get("at", 0) / 1000 > NOW - 86400: bcs.append((bid, b))
            except Exception as e:
                print("Nachricht nicht lesbar:", bid, e)
    except Exception as e:
        print("Nachrichten nicht lesbar:", e)
    for did, c in docs():
        if not c:
            continue
        try:
            raw = base64.b64decode(c)
            p = json.loads(AESGCM(KEY).decrypt(raw[:12], raw[12:], None))
        except Exception as e:
            print("nicht lesbar:", did, e)
            continue
        n_dev += 1
        sub = p.get("sub")
        if not sub or not p.get("on", True):
            continue
        who = p.get("who") or {}
        for bid, b in bcs:
            key = did + "|b|" + bid
            if key in sent: continue
            roles, depts = b.get("roles"), b.get("depts")
            if roles is not None or depts is not None:
                ok = (who.get("role", "") in (roles or [])) or (bool(who.get("dept")) and who.get("dept") in (depts or []))
                if not ok: continue
            data = json.dumps({"title": b.get("title", ""), "body": b.get("body", ""), "url": "./", "tag": "b" + bid}, ensure_ascii=False)
            try:
                webpush(subscription_info=sub, data=data, vapid_private_key=pem, vapid_claims={"sub": "mailto:furtschellas@gmail.com"}, ttl=86400)
                n_sent += 1; print("Nachricht gesendet:", did, b.get("title"))
            except Exception as e:
                print("Push-Fehler", did, str(e)[:200])
            sent[key] = NOW
        for it in p.get("items", []):
            at = it.get("at", 0) / 1000
            start = it.get("start", it.get("at", 0)) / 1000
            key = did + "|" + str(it.get("id")) + "|" + str(int(at))
            if key in sent or at > NOW + EARLY or at < NOW - LATE or start < NOW - 60:
                continue
            data = json.dumps({"title": it.get("title", ""), "body": it.get("body", ""), "url": it.get("url", "./#my"), "tag": str(it.get("id", ""))}, ensure_ascii=False)
            try:
                webpush(subscription_info=sub, data=data, vapid_private_key=pem,
                        vapid_claims={"sub": "mailto:furtschellas@gmail.com"}, ttl=3600)
                n_sent += 1
                print("gesendet:", did, it.get("title"))
            except WebPushException as e:
                code = getattr(e.response, "status_code", None)
                print("Push-Fehler", did, code, str(e)[:200])
                if code in (404, 410):
                    break  # Gerät hat Push abgemeldet – die App räumt den Eintrag beim nächsten Start auf
            except Exception as e:
                print("Push-Fehler", did, str(e)[:200])
            sent[key] = NOW
    json.dump(sent, open(SENT, "w"))
    print(f"{n_dev} Geräte, {n_sent} Nachrichten verschickt")


if __name__ == "__main__":
    sys.exit(main())
