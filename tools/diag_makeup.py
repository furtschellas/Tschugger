"""einmalig: warum erscheinen Maske-Termine nicht in «Meine Termine»? Nur Zahlen ins öffentliche Protokoll, keine Namen."""
import base64, json, os, re, sys, unicodedata, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import fsadmin
KEY = base64.b64decode(fsadmin.crew_key_b64())
e = json.load(open(pathlib.Path(__file__).parent.parent / "data.enc.json"))
data = json.loads(AESGCM(KEY).decrypt(base64.b64decode(e["iv"]), base64.b64decode(e["ct"]), None))
fold = lambda t: unicodedata.normalize("NFD", str(t or "")).encode("ascii", "ignore").decode().lower()
RX = re.compile(r"^\s*(?:([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.' -]*?)\s+)?(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})")
crew = [p for g in data.get("crew") or [] for p in (g.get("people") or [])]
crewfn = {fold(p.get("name", "")).split(" ")[0] for p in crew if p.get("name")}
for dp in sorted(data.get("dispos") or [], key=lambda d: d.get("date") or "")[-12:]:
    cs = dp.get("cs") or {}
    calls = cs.get("calls") or []
    callfn = {fold(r.get("name", "")).split(" ")[0] for r in calls if r.get("name")}
    mu_calls = sum(1 for r in calls if re.search(r"make|maske|mask|\bmu\b|hair|haar", fold(str(r.get("role", "")) + " " + str(r.get("dept", "")))))
    out = []
    for k in ("wardrobe", "makeup"):
        cells = [str(r.get(k) or "") for r in cs.get("cast") or [] if str(r.get(k) or "").strip()]
        segs = [s for c in cells for s in re.split(r"\s*;\s*", c) if s.strip()]
        m = [RX.match(s) for s in segs]
        rng = sum(1 for x in m if x); named = [x.group(1) for x in m if x and x.group(1)]
        incalls = sum(1 for n in named if fold(n.strip()).split(" ")[0] in callfn)
        increw = sum(1 for n in named if fold(n.strip()).split(" ")[0] in crewfn)
        single = sum(1 for s, x in zip(segs, m) if not x and re.search(r"\d{1,2}[:.]\d{2}", s))
        shapes = sorted({re.sub(r"[A-Za-zÀ-ÿ]+", "W", re.sub(r"\d", "9", s))[:30] for s in segs})[:4]
        out.append("%s: Zellen %d, Teile %d, Zeitspanne %d, mit Name %d, Name in Calls %d, in Crewliste %d, nur eine Zeit %d, Formen %s"
                   % ("Kostüm" if k == "wardrobe" else "Maske", len(cells), len(segs), rng, len(named), incalls, increw, single, shapes))
    print("::notice::%s · Calls %d (davon Maske/Make-up %d) · %s" % (dp.get("date"), len(calls), mu_calls, " | ".join(out)))
