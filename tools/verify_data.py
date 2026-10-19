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
