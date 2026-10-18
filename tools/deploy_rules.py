"""Transfers firestore.rules to Firebase (only called by the workflow after the rule tests in the emulator passed).

Uses the service account in the GitHub secret FIREBASE_SA. If the rules in Firebase are already the same, nothing
happens. Prints only short German status lines – never keys or data.
"""
import base64, json, os, sys, time
from pathlib import Path

import requests

PROJECT = "tschugger-83692"
API = f"https://firebaserules.googleapis.com/v1/projects/{PROJECT}"
RELEASE = f"projects/{PROJECT}/releases/cloud.firestore"


def _b64u(b): return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def token(acc):
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    now = int(time.time())
    h = _b64u(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
    p = _b64u(json.dumps({"iss": acc["client_email"], "scope": "https://www.googleapis.com/auth/cloud-platform",
                          "aud": "https://oauth2.googleapis.com/token", "iat": now, "exp": now + 3600}).encode())
    key = serialization.load_pem_private_key(acc["private_key"].encode(), None)
    sig = _b64u(key.sign((h + "." + p).encode(), padding.PKCS1v15(), hashes.SHA256()))
    r = requests.post("https://oauth2.googleapis.com/token", timeout=30,
                      data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": h + "." + p + "." + sig})
    if r.status_code != 200:
        sys.exit("::error::Anmeldung mit FIREBASE_SA fehlgeschlagen (%d)" % r.status_code)
    return r.json()["access_token"]


def fail(what, r):
    msg = ""
    try: msg = r.json().get("error", {}).get("message", "")[:300]
    except Exception: pass
    hint = ""
    if r.status_code in (401, 403):
        hint = (" – dem Dienstkonto fehlt das Recht: Google Cloud Console → IAM → beim Konto aus FIREBASE_SA die Rolle "
                "«Firebase Rules Admin» hinzufügen")
    sys.exit("::error::%s fehlgeschlagen (%d)%s %s" % (what, r.status_code, hint, msg))


def main():
    raw = os.environ.get("FIREBASE_SA", "").strip()
    if not raw:
        print("Nicht eingerichtet: Secret FIREBASE_SA fehlt – Regeln bitte von Hand in Firebase einsetzen."); return
    try: acc = json.loads(raw)
    except Exception: acc = json.loads(base64.b64decode(raw))
    src = Path(__file__).resolve().parent.parent.joinpath("firestore.rules").read_text(encoding="utf-8")
    H = {"Authorization": "Bearer " + token(acc)}

    # rules that are live now – nothing to do when they are the same
    r = requests.get(f"https://firebaserules.googleapis.com/v1/{RELEASE}", headers=H, timeout=30)
    if r.status_code != 200 and r.status_code != 404: fail("Aktuelle Regeln lesen", r)
    cur = r.json().get("rulesetName") if r.status_code == 200 else None
    if cur:
        g = requests.get(f"https://firebaserules.googleapis.com/v1/{cur}", headers=H, timeout=30)
        if g.status_code == 200:
            files = g.json().get("source", {}).get("files", [])
            if files and files[0].get("content", "").strip() == src.strip():
                print("Firestore-Regeln sind bereits aktuell – nichts zu tun."); return

    # new ruleset (Firebase checks the syntax here), then switch Firestore to it
    c = requests.post(f"{API}/rulesets", headers=H, timeout=60,
                      json={"source": {"files": [{"name": "firestore.rules", "content": src}]}})
    if c.status_code != 200: fail("Regeln hochladen", c)
    name = c.json()["name"]
    body = {"release": {"name": RELEASE, "rulesetName": name}}
    u = requests.patch(f"https://firebaserules.googleapis.com/v1/{RELEASE}", headers=H, timeout=30, json=body)
    if u.status_code == 404:
        u = requests.post(f"{API}/releases", headers=H, timeout=30, json=body["release"])
    if u.status_code != 200: fail("Regeln aktivieren", u)
    print("Firestore-Regeln übertragen und aktiv (%d Zeilen)." % len(src.splitlines()))


if __name__ == "__main__":
    main()
