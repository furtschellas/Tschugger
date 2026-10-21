"""One-time action: shooting days 1 and 2 get their scene quittances from the shooting schedule (Drehplan).

Every scene, lunch, wrap and further setup of the 1st unit becomes «abgeschlossen» with the planned times:
begin = its time in the Drehplan, end = the time of the next row (wrap: begin = end). Quittances that already
exist stay as they are (the document is only created when it is missing). The log shows counts only.
Run: Actions → «Szenen-Quittierung übernehmen» (needs FIREBASE_SA and CREW_KEY).
"""
import base64, json, os, re, sys, time, unicodedata
from datetime import datetime
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

R = Path(__file__).resolve().parent.parent


def fold(s):
    return "".join(c for c in unicodedata.normalize("NFD", str(s)) if unicodedata.category(c) != "Mn").lower()


def ack_id(date, sc):
    """same id as scAckId in the app (27-scene-ack.js)"""
    k = re.sub(r"[^a-z0-9]", "", fold(sc))
    k = re.sub(r"^(dj|d|j|sc|sz|seq|scene|szene)(?=\d)", "", k)
    k = re.sub(r"(cont|continued|forts|fortsetzung)$", "", k)
    return date.replace("-", "") + "-" + k[:24]


def ev_key(t):
    t = str(t or "")
    if re.search(r"\b(lunch|mittag|pranzo|d[ée]jeuner)\b", t, re.I): return "lunch"
    if re.search(r"\b(wrap|drehschluss)\b", t, re.I): return "wrap"
    return ""


def row_keys(items):
    """like scRowKeys: scenes their number, lunch/wrap, further setups setup2 …, the first setup and other rows ''"""
    n, out = 0, []
    for i in items:
        if i.get("sc"): out.append(str(i["sc"])); continue
        t = str(i.get("n") or "")
        if re.match(r"^\s*set[\s-]?up\b", t, re.I):
            n += 1; out.append("setup%d" % n if n > 1 else ""); continue
        out.append(ev_key(t))
    return out


def ms(date, hm):
    m = re.match(r"^\s*(\d{1,2})[:.](\d{2})", str(hm or ""))
    if not m: return None
    return int(datetime.strptime(date, "%Y-%m-%d").replace(hour=int(m[1]), minute=int(m[2])).timestamp() * 1000)


def docs_for(day):
    date, its = day["date"], [i for i in (day.get("items") or []) if isinstance(i, dict)]
    keys, now, out = row_keys(its), int(time.time() * 1000), {}
    for idx, (it, k) in enumerate(zip(its, keys)):
        if not k: continue
        b = ms(date, it.get("t"))
        if b is None: continue
        e = b
        if k != "wrap":
            for nx in its[idx + 1:]:
                x = ms(date, nx.get("t"))
                if x is not None and x > b: e = x; break
        out[ack_id(date, k)] = {"d": date, "at": now, "s": 2, "u": "1", "sc": str(k)[:24], "b": b, "e": e}
    return out


def main():
    dry = "--dry" in sys.argv
    if dry:   # local check with decrypted day files: python tools/scene_import.py --dry <folder with JJJJ-MM-TT.json>
        days = [json.load(open(p)) for p in sorted(Path(sys.argv[-1]).glob("*.json"))]
    else:
        key = base64.b64decode(fsadmin.crew_key_b64())
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        e = json.load(open(R / "data.enc.json"))
        days = json.loads(AESGCM(key).decrypt(base64.b64decode(e["iv"]), base64.b64decode(e["ct"]), None)).get("days") or []
    shoot = sorted([d for d in days if d.get("kind") == "shoot" and any(i.get("sc") for i in d.get("items") or [])], key=lambda d: d["date"])[:2]
    h, _ = ({}, None) if dry else fsadmin._auth()
    if not dry and not h: print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
    made = kept = bad = 0
    for n, day in enumerate(shoot, 1):
        docs = docs_for(day)
        for i, (did, v) in enumerate(docs.items()):
            if dry:
                print(day["date"], did, v["sc"], time.strftime("%H:%M", time.localtime(v["b"] / 1000)), time.strftime("%H:%M", time.localtime(v["e"] / 1000)))
                continue
            r = requests.patch(fsadmin.BASE + "/sceneack/" + did, headers=h, params=[("currentDocument.exists", "false")],
                               json={"fields": {k: fsadmin.enc(x) for k, x in v.items()}}, timeout=30)
            if r.status_code == 200: made += 1
            elif r.status_code in (400, 409, 412) and ("exist" in r.text.lower() or "precondition" in r.text.lower()): kept += 1
            else: bad += 1
        print("• Drehtag %d: %d Einträge aus dem Drehplan" % (n, len(docs)))
    print("• neu quittiert: %d · schon vorhanden (unverändert): %d · Fehler: %d" % (made, kept, bad))
    if bad: sys.exit(1)


if __name__ == "__main__":
    main()
