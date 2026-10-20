#!/usr/bin/env python3
"""Abgleich App-Daten ↔ Dropbox (von Hand über «Daten prüfen» gestartet).

Vergleicht die veröffentlichten, verschlüsselten App-Daten mit dem aktuellen Stand in der Dropbox:
Dokumente (neueste Version in der App?), Szenen (Drehplan ↔ Drehbuch, Szenen-Details), Rollen (Besetzungsliste ↔
Drehplan) und Bilder (Blocking-Ordner ↔ Galerie in der App, Teile richtig zugeordnet, Bilddateien vorhanden).

Der Report enthält nur Zahlen, Szenen- und Rollennummern – keine Namen, Adressen oder Dateinamen –,
weil die Lauf-Übersicht des öffentlichen Repositorys für alle sichtbar ist.
"""
import os, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import update_from_dropbox as U  # noqa: E402

OUT = []
BAD = []


def h(t): OUT.append("\n### " + t + "\n")
def ok(t): OUT.append("- ✅ " + t)
def bad(t): OUT.append("- ❌ " + t); BAD.append(t)
def info(t): OUT.append("- ℹ️ " + t)


def sc_key(s): return re.sub(r"\s+", "", str(s or "")).lower().lstrip("0")


def day_items(d):
    for u, its in (("1", d.get("items") or []), ("2", (d.get("unit2") or {}).get("items") or [] if isinstance(d.get("unit2"), dict) else []),
                   ("3", (d.get("unit3") or {}).get("items") or [] if isinstance(d.get("unit3"), dict) else [])):
        for it in its: yield u, it


def _nrm(t):
    """compare text without case, accents, spaces and typographic quotes"""
    import unicodedata
    t = unicodedata.normalize("NFD", str(t or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[\s'’′`.,:;()\-–/|]+", "", t)


def check_callsheets(data, dbx, files):
    """every value the app shows from a callsheet must be found in the text of the PDF (only counts and field names in the report)"""
    byname = {f["name"]: f for f in files}
    n_cs = 0
    for d in data.get("dispos") or []:
        cs = d.get("cs")
        if not isinstance(cs, dict): continue
        f = byname.get(d.get("file") or "")
        if not f: bad("Callsheet %s: PDF in der Dropbox nicht gefunden" % d.get("date")); continue
        n_cs += 1
        raw = dbx.download(f["id"]); txt = U.pdf_text(raw, False) + "\n" + U.pdf_text(raw, True)
        T = _nrm(txt)
        times = set(m.group(0).replace(".", ":").zfill(5) for m in re.finditer(r"\b\d{1,2}[:.]\d{2}\b", txt))
        miss = {}
        def need(part, field, i, v, kind="text"):
            v = str(v or "").strip()
            if not v or v.lower() in ("self", "o.p.d", "o.p.d.", "-", "–", "tba"): return
            if kind == "time":
                for m in re.finditer(r"\b\d{1,2}[:.]\d{2}\b", v):
                    if m.group(0).replace(".", ":").zfill(5) not in times: miss.setdefault(part, []).append("%s #%d" % (field, i + 1))
                return
            v2 = re.sub(r"https?://\S+", "", v)
            words = [w for w in re.split(r"[,;&+]| und | and ", v2) if _nrm(w)]
            for w in words:
                if _nrm(w) not in T: miss.setdefault(part, []).append("%s #%d" % (field, i + 1)); break
        t = cs.get("times") or {}
        for k in ("crewCall", "rehearsal", "rts", "lunch", "wrap"): need("Zeiten", k, 0, t.get(k), "time")
        for i, l in enumerate(cs.get("locations") or []):
            need("Locations", "Name", i, l.get("name"))
            if l.get("map") and l["map"] not in txt: miss.setdefault("Locations", []).append("Karte #%d" % (i + 1))
            for it in l.get("items") or []:
                if it.get("map") and it["map"] not in txt: miss.setdefault("Locations", []).append("Karte Zeile #%d" % (i + 1))
        for i, r in enumerate((cs.get("order") or {}).get("rows") or []):
            need("Drehfolge", "Zeit", i, r.get("t"), "time")
            if r.get("sc"): need("Drehfolge", "Szene", i, r.get("sc"))
        mk_heads = {_nrm(m.group(1)) for m in re.finditer(r"(?:make\s*up|wardrobe|kost\w*|maske)\s*-\s*([A-Za-zÀ-ÿ]+)", txt, re.I)}
        for i, r in enumerate(cs.get("cast") or []):
            need("Cast", "Darsteller", i, r.get("actor")); need("Cast", "Rolle", i, r.get("role"))
            for k in ("pickup", "call", "onset", "wardrobe", "makeup"): need("Cast", k, i, r.get(k), "time")
            for k in ("wardrobe", "makeup"):
                for seg in str(r.get(k) or "").split(";"):
                    m = re.match(r"\s*([A-Za-zÀ-ÿ]+)\s+\d", seg)
                    if m and _nrm(m.group(1)) not in mk_heads: miss.setdefault("Cast", []).append("%s-Person #%d" % (k, i + 1))
        for i, r in enumerate(cs.get("extras") or []):
            need("Komparsen", "Rolle", i, r.get("part")); need("Komparsen", "Call", i, r.get("call"), "time")
        for i, r in enumerate(cs.get("transport") or []):
            need("Transport", "Fahrer", i, r.get("driver")); need("Transport", "Von", i, r.get("from")); need("Transport", "Nach", i, r.get("to"))
            need("Transport", "Zeit ab", i, r.get("t1"), "time"); need("Transport", "Zeit an", i, r.get("t2"), "time")
            need("Transport", "Mitfahrende", i, r.get("passengers"))
        for i, r in enumerate(cs.get("crewTransport") or []):
            need("Transport Crew", "Fahrzeug", i, r.get("vehicle")); need("Transport Crew", "Zeit ab", i, r.get("t1"), "time"); need("Transport Crew", "Zeit an", i, r.get("t2"), "time")
        for i, r in enumerate(cs.get("travel") or []):
            need("Anreise", "Name", i, r.get("name")); need("Anreise", "Zeit ab", i, r.get("t1"), "time"); need("Anreise", "Zeit an", i, r.get("t2"), "time")
        for i, r in enumerate(cs.get("calls") or []):
            need("Calls", "Name", i, r.get("name")); need("Calls", "Zeit", i, r.get("t"), "time"); need("Calls", "Funktion", i, r.get("role"))
        for i, r in enumerate(cs.get("depts") or []): need("Abteilungen", "Abteilung", i, r.get("dept"))
        if cs.get("contact"): need("Kontakt", "Name", 0, (cs.get("contact") or {}).get("name"))
        parts = ("Zeiten", "Locations", "Drehfolge", "Cast", "Komparsen", "Transport", "Transport Crew", "Anreise", "Calls", "Abteilungen", "Kontakt")
        cnt = {"Locations": len(cs.get("locations") or []), "Drehfolge": len((cs.get("order") or {}).get("rows") or []), "Cast": len(cs.get("cast") or []),
               "Transport": len(cs.get("transport") or []), "Calls": len(cs.get("calls") or [])}
        for p in parts:
            if p in miss: bad("Callsheet %s · %s: %d Wert(e) nicht im PDF – %s" % (d.get("date"), p, len(miss[p]), ", ".join(sorted(set(miss[p]))[:12])))
        urls = [u for l in cs.get("locations") or [] for u in [l.get("map")] + [i.get("map") for i in l.get("items") or []] if u]
        if urls: (ok if all(u in (cs.get("geo") or {}) for u in urls) else info)("Callsheet %s: Karte – %d von %d Orten mit Position" % (d.get("date"), sum(1 for u in set(urls) if u in (cs.get("geo") or {})), len(set(urls))))
        gp = [v for v in (cs.get("geo") or {}).values() if isinstance(v, list) and len(v) == 2]
        if len(gp) > 1:
            import math
            dk = lambda a, b: 6371 * 2 * math.asin(math.sqrt(math.sin(math.radians(b[0] - a[0]) / 2) ** 2 + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0])) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2))
            mx = max(dk(a, b) for a in gp for b in gp)
            (ok if mx <= 30 else bad)("Callsheet %s: Karte – Orte liegen höchstens %.1f km auseinander" % (d.get("date"), mx))
        if not miss: ok("Callsheet %s: alle Werte im PDF gefunden (%s)" % (d.get("date"), ", ".join("%s %d" % kv for kv in cnt.items())))
        # the totals line of the callsheet against the rows
        m = re.search(r"CAST:\s*(\d+)", txt)
        if m: info("Callsheet %s: Cast laut Totalzeile %s, Zeilen in der App %d" % (d.get("date"), m.group(1), len(cs.get("cast") or [])))
    if not n_cs: info("Kein Callsheet mit Struktur in der App")



def main():
    data = U.dec_file(U.R / "data.enc.json") or {}
    scr = (U.dec_area(U.R / "script.enc.json", "script") or {}).get("script", [])
    meta = data.get("meta") or {}
    cts = (U.dec_area(U.R / "contacts.enc.json", "contacts") or {}).get("c") if (U.R / "contacts.enc.json").exists() else None
    if "bm" not in meta: meta["bm"] = (U.dec_file(U.R / "media.enc.json") or {}).get("bm") or []
    days = [d for d in data.get("days") or [] if d.get("kind") == "shoot"]
    dbx = U.Dbx(); files = dbx.list_all()
    base = lambda n: (n or "").rsplit("/", 1)[-1]
    src = {}
    for s in meta.get("sources") or []: src.setdefault(s.get("kind"), []).append(s)

    # ---------------- documents ----------------
    h("Dokumente – neueste Version aus der Dropbox in der App?")
    for kind, pick, label in (("schedule", U.pick_schedule, "Drehplan"), ("script", U.pick_script, "Drehbuch"), ("crew", U.pick_crew, "Crewliste")):
        f = pick(files)
        if not f: info(label + ": in der Dropbox nicht gefunden"); continue
        have = [s for s in src.get(kind) or [] if base(s.get("name")) == base(f["name"]) and s.get("modified") == f["modified"]]
        (ok if have else bad)("%s: %s (Stand Dropbox %s)" % (label, "aktuell" if have else "NICHT die neueste Version", (f["modified"] or "")[:16].replace("T", " ")))
    try:
        dp = U.pick_dispos(files); n_dp = len(dp) if isinstance(dp, (list, tuple)) else (1 if dp else 0)
        n_app = len(data.get("dispos") or [])
        (ok if n_app >= min(n_dp, 1) else bad)("Callsheets: %d in der App, %d Kandidaten in der Dropbox" % (n_app, n_dp))
    except Exception as e: info("Callsheets: nicht geprüft (%s)" % type(e).__name__)
    info("Quellen in der App: " + ", ".join("%s %d" % (k, len(v)) for k, v in sorted(src.items())))

    # ---------------- callsheet ↔ PDF ----------------
    h("Callsheet – jeder Wert in der App steht so im PDF?")
    try: check_callsheets(data, dbx, files)
    except Exception as e: bad("Callsheet-Prüfung abgebrochen (%s)" % type(e).__name__)

    # ---------------- scenes ----------------
    h("Szenen – Drehplan ↔ Drehbuch und Szenen-Details")
    plan = {}
    for d in days:
        for u, it in day_items(d):
            if it.get("sc"): plan.setdefault(sc_key(it["sc"]), set()).add(str(d.get("short") or d["date"]))
    script = {sc_key(x.get("sc")) for x in scr if x.get("sc")}
    def in_script(k):   # «186pt1a» belongs to script scene «186», «25sl2» to «25sl» or «25»
        if k in script: return True
        b = re.sub(r"(pt\d+[a-z]?|[a-z])$", "", k)
        return b in script or re.sub(r"\d+$", "", k) in script or re.sub(r"sl\d*$", "sl", k) in script or re.sub(r"sl\d*$", "", k) in script
    miss_scr = sorted(k for k in plan if not in_script(k))
    info("%d Szenen im Drehplan (CH), %d Szenen im Drehbuch" % (len(plan), len(script)))
    (ok if not miss_scr else bad)("Szenen im Drehplan ohne Szene im Drehbuch: " + (", ".join(miss_scr) if miss_scr else "keine"))
    bd = meta.get("bd") or {}
    have_k = {k.split("|", 1)[1] for k in bd}
    no_bd = sorted({"%s %s" % (dd, k) for k, dds in plan.items() for dd in dds if k not in have_k})
    (ok if not no_bd else bad)("Szenen ohne Szenen-Details: " + (", ".join(no_bd) if no_bd else "keine (%d mit Details)" % len(bd)))
    dup = sorted(k for k in plan if len(plan[k]) > 1)
    info("Szenen an mehreren Drehtagen (Teile/2nd Unit): " + (", ".join("%s (%s)" % (k, "/".join(sorted(plan[k]))) for k in dup) or "keine"))

    # ---------------- roles ----------------
    h("Rollen – Besetzungsliste ↔ Drehplan")
    cast = {str(k) for k in (meta.get("cast") or {})}
    used = {}
    for d in days:
        for u, it in day_items(d):
            for c in it.get("cast") or []: used.setdefault(str(c), 0); used[str(c)] += 1
    unk = sorted((c for c in used if c not in cast), key=lambda x: (len(x), x))
    unused = sorted((c for c in cast if c not in used), key=lambda x: (len(x), x))
    info("%d Rollen in der Besetzungsliste, %d im Drehplan besetzt" % (len(cast), len(used)))
    (ok if not unk else bad)("Rollennummern im Drehplan ohne Eintrag in der Besetzungsliste: " + (", ".join(unk) if unk else "keine"))
    info("Rollen ohne Szene im Drehplan (CH): " + (", ".join(unused) or "keine"))

    # ---------------- pictures ----------------
    h("Bilder – Blocking-Ordner in der Dropbox ↔ Galerie in der App")
    try:
        allb = dbx.list_path(U.ROOT3D + "/0_BlockingFloorplans", True)
    except Exception as e:
        bad("Blocking-Ordner nicht lesbar (%s)" % type(e).__name__); allb = []
    bm = meta.get("bm") or []
    blk = {b.get("name"): b for b in meta.get("blocking") or []}
    med = lambda b: [bm[i] for i in b.get("mi") or [] if 0 <= i < len(bm)] if "mi" in b else (b.get("media") or [])
    folders = {}
    for e in allb:
        if e["tag"] != "file": continue
        top, subs, part = U.blk_top(e)
        if not top: continue
        f = folders.setdefault(top, {"img": 0, "pdf": 0, "part": {}})
        if re.search(r"\.(jpe?g|png|heic|mov|mp4|m4v)$", e["name"], re.I):
            f["img"] += 1
            if part: f["part"][part] = f["part"].get(part, 0) + 1
        elif e["name"].lower().endswith(".pdf"): f["pdf"] += 1
    n_ok = 0
    for i, (top, f) in enumerate(sorted(folders.items())):
        no = "Ordner %d (Szene %s)" % (i + 1, ",".join(str(x) for x in (blk.get(top) or {}).get("sc") or []) or "?")
        b = blk.get(top)
        if not b: bad(no + ": fehlt in der App"); continue
        m = med(b)
        own = [x for x in m if not x.get("g")]
        parts = {}
        for x in own:
            if x.get("p"): parts[x["p"]] = parts.get(x["p"], 0) + 1
        pdf_btn = len(b.get("pdfs") or [])
        probs = []
        if len(own) < f["img"]: probs.append("Fotos/Filme %d von %d in der App" % (len(own), f["img"]))
        if parts != f["part"]: probs.append("Teile %s statt %s" % (parts, f["part"]))
        if pdf_btn < f["pdf"]: probs.append("PDF-Knöpfe %d von %d" % (pdf_btn, f["pdf"]))
        if probs: bad(no + ": " + "; ".join(probs))
        else: n_ok += 1
    ok("%d von %d Blocking-Ordnern stimmen genau (Fotos, Filme, PDFs, Teile)" % (n_ok, len(folders)))
    # every picture the app refers to is really stored
    try:
        store = U.BlkStore(); have = set(store.files())
        refs = {x.get("f") for x in bm if x.get("f")} | {x.get("v") for x in bm if x.get("v")}
        for fp in meta.get("floorplans") or []: refs |= set(fp.get("pg") or [])
        missing = [r for r in refs if r not in have]
        (ok if not missing else bad)("Bilddateien: %d von %d vorhanden%s" % (len(refs) - len(missing), len(refs), "" if not missing else " – %d fehlen" % len(missing)))
        # pages of the schedule PDF, the callsheets and the Sides (shown in the app as pictures)
        sp = meta.get("schedPdf") or {}
        pages = {"Drehplan": list(sp.get("pg") or []) + ([sp["pdf"]] if sp.get("pdf") else []),
                 "Callsheets": [f for d in data.get("dispos") or [] for f in d.get("pg") or []],
                 "Sides": [f for x in meta.get("sides") or [] for f in x.get("pg") or []]}
        for lab, fl in pages.items():
            miss = [f for f in fl if f not in have]
            (ok if not miss else bad)("%s-Seiten: %d von %d Bildern vorhanden%s" % (lab, len(fl) - len(miss), len(fl), "" if not miss else " – %d fehlen" % len(miss)))
    except Exception as e: info("Bildspeicher nicht geprüft (%s)" % type(e).__name__)
    # pictures through the Cloudflare worker (R2): reachable and readable with the crew key?
    base = (os.environ.get("BLK_BASE") or meta.get("blkBase") or "").strip()
    if base:
        try:
            import requests
            if not base.endswith("/"): base += "/"
            st = requests.get(base, timeout=20).json()
            (ok if st.get("blk") else bad)("Worker: Bilder-Bucket verbunden (Binding BLK)" if st.get("blk") else "Worker: Binding BLK fehlt")
            f0 = next((x.get("f") for x in bm if str(x.get("f") or "").startswith("blk/")), None)
            if f0:
                r = requests.get(base + f0, headers={"Origin": "https://furtschellas.github.io"}, timeout=30)
                okd = False
                if r.status_code == 200:
                    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
                    try: AESGCM(U.KEY).decrypt(r.content[:12], r.content[12:], None); okd = True
                    except Exception: okd = False
                (ok if okd else bad)("Bild über den Worker: %s" % ("geladen und entschlüsselt" if okd else "HTTP %d%s" % (r.status_code, "" if r.status_code != 200 else ", nicht entschlüsselbar")))
        except Exception as e: bad("Worker nicht erreichbar (%s)" % type(e).__name__)
    else: info("Bilder über GitHub Pages (BLK_BASE nicht gesetzt)")
    fpl = meta.get("floorplans") or []
    info("Floorplans: %d in der App, davon %d mit Seiten für die App" % (len(fpl), sum(1 for x in fpl if x.get("pg"))))

    # ---------------- privacy ----------------
    h("Datenschutz – nichts Vertrauliches öffentlich")
    try:
        import requests
        pub = requests.get(U.fsadmin.BASE + "/config/app", params={"key": U.fsadmin.API_KEY}, timeout=20).json().get("fields", {})
        leak = [k for k in ("locSheet", "mapUrl", "chatUrl") if k in pub]
        (ok if not leak else bad)("Öffentliche Einstellungen ohne Links: " + ("ja" if not leak else "NEIN, offen: " + ", ".join(leak)))
        r = requests.get(U.fsadmin.BASE + "/config/private", params={"key": U.fsadmin.API_KEY}, timeout=20)
        (ok if r.status_code in (401, 403) else bad)("Links ohne Anmeldung gesperrt (HTTP %d)" % r.status_code)
        priv = U.fsadmin.get_doc("config/private") or {}
        info("Links für die Crew gesetzt: " + (", ".join(k for k in ("locSheet", "mapUrl", "chatUrl") if priv.get(k)) or "keine"))
    except Exception as e: info("Einstellungen nicht geprüft (%s)" % type(e).__name__)
    lc = meta.get("locCfg") or {}
    (ok if lc.get("addr") else bad)("Orte-Einstellungen verschlüsselt in den Daten: %d Adressen, %d Gruppen" % (len(lc.get("addr") or {}), len(lc.get("bundles") or []) + len(lc.get("titles") or [])))
    leak = sum(1 for g in data.get("crew") or [] for pp in g.get("people") or [] if isinstance(pp, dict) and any(U.CONTACT_RE.search(k) for k in pp))
    (ok if cts is not None and not leak else bad)("Telefon/E-Mail der Crewliste mit eigenem Schlüssel: %s" % ("%d Kontakte, keine in den allgemeinen Daten" % len(cts) if cts is not None and not leak else "%d noch in den allgemeinen Daten" % leak))
    pubcode = (U.R / "index.html").read_text(encoding="utf-8", errors="ignore").lower()
    hits = [w for w in {re.sub(r",.*", "", v).lower() for v in (lc.get("addr") or {}).values()} if len(w) > 6 and w in pubcode]
    (ok if not hits else bad)("Adressen im öffentlichen App-Code: " + ("keine" if not hits else "%d gefunden" % len(hits)))

    head = "## Abgleich App ↔ Dropbox: " + ("alles in Ordnung ✅" if not BAD else "%d Abweichung(en) ❌" % len(BAD))
    text = head + "\n" + "\n".join(OUT) + "\n"
    p = os.environ.get("GITHUB_STEP_SUMMARY")
    if p: open(p, "a", encoding="utf-8").write(text)
    # one line per section in the run overview (at most 10 are shown)
    sec, cur = [], None
    for line in OUT:
        if line.startswith("\n### "): cur = [line.strip("\n# ")]; sec.append(cur)
        elif cur is not None: cur.append(line[2:])
    for c in sec: print("::notice::" + c[0] + " → " + " | ".join(c[1:])[:3500])
    print("::notice::" + head.lstrip("# "))
    return 0


if __name__ == "__main__":
    sys.exit(main())
