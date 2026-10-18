#!/usr/bin/env python3
"""Hintergrund-Abläufe ohne Netz und ohne Browser: Dropbox-Aktualisierung (Änderungen erkennen, Prep-Zusammenbau,
Info-Adressen), automatische Push-Nachrichten, Push-Versand und Alarm. Firestore und der Push-Dienst sind nachgebaut.

  python3 tests/test_backend.py
"""
import base64, datetime, json, os, secrets, sys, tempfile, pathlib, time

HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(ROOT / "tools"))
import common  # noqa: E402
from common import check, done  # noqa: E402

# never the real Firestore: no service account, a throw-away crew key
os.environ.pop("FIREBASE_SA", None)
KEY_B64 = base64.b64encode(secrets.token_bytes(32)).decode()
os.environ["CREW_KEY"] = KEY_B64
KEY = base64.b64decode(KEY_B64)
TMP = pathlib.Path(tempfile.mkdtemp())

from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # noqa: E402
import fsadmin  # noqa: E402


def enc(o):
    iv = secrets.token_bytes(12)
    return base64.b64encode(iv + AESGCM(KEY).encrypt(iv, json.dumps(o).encode(), None)).decode()


def dec(c):
    raw = base64.b64decode(c)
    return json.loads(AESGCM(KEY).decrypt(raw[:12], raw[12:], None))


class FakeFS:
    """just enough of tools/fsadmin.py: documents in a dict"""
    def __init__(self): self.d = {}; self.n = 0
    def install(self, with_sa=True):
        fsadmin.sa = lambda: {"fake": True} if with_sa else None
        fsadmin.crew_key_b64 = lambda: KEY_B64
        fsadmin.get_doc = lambda p: self.d.get(p)
        fsadmin.list_docs = lambda col: [(k.split("/", 1)[1], dict(v), "t") for k, v in list(self.d.items()) if k.split("/")[0] == col]
        fsadmin.query_since = lambda col, field, iso: fsadmin.list_docs(col)
        def patch(p, f, update_time=None): self.d.setdefault(p, {}).update(f); return True
        fsadmin.patch_doc = patch
        def create(col, f, raw=None): self.n += 1; self.d[f"{col}/x{self.n}"] = dict(f); return f"x{self.n}"
        fsadmin.create_doc = create
        def delete(p): self.d.pop(p, None); return True
        fsadmin.delete_doc = delete
        return self
    def col(self, c): return {k.split("/", 1)[1]: v for k, v in self.d.items() if k.split("/")[0] == c}


# ====================================================================== Dropbox-Aktualisierung
common.GROUP = 'Dropbox-Aktualisierung'
import update_from_dropbox as U  # noqa: E402
import shutil as _sh, subprocess as _sp  # noqa: E402
if _sh.which("node"):   # a syntax error in one part stops the whole app: check every part on its own (names the file)
    _T = pathlib.Path(__file__).resolve().parent.parent / "tools"
    _bad = [f.name for f in sorted(list((_T / "boot").glob("*.js")) + list((_T / "base").glob("*.js"))) if _sp.run(["node", "--check", str(f)], capture_output=True).returncode]
    check("App-Teile (tools/base, tools/boot) ohne Syntaxfehler", not _bad, _bad)
_sf = lambda n, m="2026-10-01": {"name": n, "modified": m}
_fs = [_sf("01_Script/261017_Tschugger_Tigerblood_v13 CLEAN.pdf"), _sf("01_Script/261017_Tschugger_Tigerblood_v13.pdf"), _sf("01_Script/Tschugger Script Changelog v13 261017.pdf"),
       _sf("01_Script/250901_Tschugger_Tigerblood_v12 CLEAN.pdf"), _sf("01_Script/English translation v12/Tschugger_v12 EN.pdf"), _sf("01_Script/Tschugger_v14 SPP.pdf")]
check("Drehbuch: neueste Version, CLEAN bevorzugt", (U.pick_script(_fs) or {}).get("name", "").endswith("v13 CLEAN.pdf"))
check("Drehbuch: immer CLEAN – neue Version ohne CLEAN wird nicht genommen", (U.pick_script(_fs + [_sf("01_Script/261101_Tschugger_Tigerblood_v14.pdf")]) or {}).get("name", "").endswith("v13 CLEAN.pdf"))
check("Drehbuch: sobald die CLEAN-Fassung da ist, wird sie genommen", (U.pick_script(_fs + [_sf("01_Script/261101_Tschugger_Tigerblood_v14.pdf"), _sf("01_Script/261101_Tschugger_Tigerblood_v14 CLEAN.pdf")]) or {}).get("name", "").endswith("v14 CLEAN.pdf"))
check("Drehbuch: ohne CLEAN-Fassung nichts gewählt (bisheriges bleibt)", U.pick_script([_sf("01_Script/x_v13.pdf")]) is None)
check("Drehbuch: höhere Nummer gewinnt auch zweistellig (v9 < v10)", (U.pick_script([_sf("01_Script/x_v9 CLEAN.pdf"), _sf("01_Script/x_v10 CLEAN.pdf")]) or {}).get("name", "").endswith("v10 CLEAN.pdf"))
check("Drehbuch: Changelog, Übersetzung und SPP nie gewählt", U.pick_script([_fs[2], _fs[4], _fs[5]]) is None)

TODAY = datetime.date.today().isoformat()
D = lambda n: (datetime.date.today() + datetime.timedelta(days=n)).isoformat()
day = lambda date, items, **k: dict({"date": date, "items": items}, **k)

a = day(D(1), [{"t": "07:00", "sc": "12", "n": "Polizeistation", "loc": "Salgesch", "n_fr": "Poste"}])
b = day(D(1), [{"t": "07:00", "sc": "12", "n": "POLIZEISTATION.", "loc": " salgesch ", "n_fr": "autre"}])
c = day(D(1), [{"t": "07:30", "sc": "12", "n": "Polizeistation", "loc": "Salgesch"}])
check("Drehplan: andere Schreibweise und Übersetzung zählen nicht als Änderung", U.day_sig(a) == U.day_sig(b))
check("Drehplan: geänderte Zeit ist eine Änderung", U.day_sig(a) != U.day_sig(c))
check("Drehplan: geänderte Szene ist eine Änderung", U.day_sig(a) != U.day_sig(day(D(1), [{"t": "07:00", "sc": "13", "n": "Polizeistation", "loc": "Salgesch"}])))
old = [day(D(-2), [{"t": "1"}]), day(D(1), [{"t": "07:00"}]), day(D(2), [{"t": "08:00"}]), day(D(3), [{"t": "09:00"}], older="x"), {"id": "TBA", "items": []}]
new = [day(D(-2), [{"t": "2"}]), day(D(1), [{"t": "07:00"}]), day(D(3), [{"t": "10:00"}], older="x"), day(D(4), [{"t": "06:00"}])]
check("Geänderte Tage: nur ab heute, neue und entfernte, ohne «ältere» und ohne TBA", U.changed_days(old, new, TODAY) == [D(2), D(4)], U.changed_days(old, new, TODAY))

cs1 = {"date": D(1), "call": "Crew Call 06:30", "scenes": [{"sc": "12"}], "note": "Bitte pünktlich", "note_fr": "x"}
cs2 = {"date": D(1), "call": "Crew-Call um 06:30", "scenes": [{"sc": "12"}], "note": "Pünktlich sein", "note_fr": "y"}
cs3 = {"date": D(1), "call": "Crew Call 07:00", "scenes": [{"sc": "12"}]}
cs4 = {"date": D(1), "call": "Crew Call 06:30", "scenes": [{"sc": "14"}]}
check("Callsheet: anderer Wortlaut ohne neue Zeiten ist keine Änderung", U.cs_sig(cs1) == U.cs_sig(cs2))
check("Callsheet: neue Zeit ist eine Änderung", U.cs_sig(cs1) != U.cs_sig(cs3))
check("Callsheet: neue Szene ist eine Änderung", U.cs_sig(cs1) != U.cs_sig(cs4))

f = lambda n, m="2026-10-10T08:00:00Z": {"name": n, "modified": m}
plans = sorted([f("Weekly Schedule stand_15.10.pdf"), f("Daily Schedule stand_16.10.pdf"), f("Weekly Schedule stand_15.10-1.pdf"), f("Weekly Schedule stand_09.10.pdf")], key=U.prep_stand, reverse=True)
check("Prep: neustes Dokument zuerst (Datum, dann Kopie-Nummer)", [p["name"] for p in plans] == ["Daily Schedule stand_16.10.pdf", "Weekly Schedule stand_15.10-1.pdf", "Weekly Schedule stand_15.10.pdf", "Weekly Schedule stand_09.10.pdf"], [p["name"] for p in plans])
check("Prep: Daily-Schedule-Name wird erkannt", bool(U.PREP_PLAN_RE.search("TSCHUGGER Daily Schedule stand_16.10.pdf")))
cache = {"Daily Schedule stand_16.10.pdf": {"days": [day("2026-10-16", [{"n": "daily"}])]},
         "Weekly Schedule stand_15.10-1.pdf": {"days": [day("2026-10-15", [{"n": "weekly"}]), day("2026-10-16", [{"n": "weekly"}]), day("2026-10-17", [{"n": "weekly"}])]}}
days, used = U.compose_prep(plans, cache)
by = {d["date"]: d["items"][0]["n"] for d in days}
check("Prep: pro Tag gilt das neuste Dokument, die übrigen Tage bleiben", by == {"2026-10-16": "daily", "2026-10-15": "weekly", "2026-10-17": "weekly"}, by)
check("Prep: beide Dokumente als Quelle vermerkt", used == ["Daily Schedule stand_16.10.pdf", "Weekly Schedule stand_15.10-1.pdf"], used)

U.dec_file = lambda p: {"address": {"Coop": "Coopstrasse 1", "Coop Pronto": "Prontoweg 2", "Spital": "Spitalstrasse 9"},
                        "phone": {"Spital": "027 000 00 00"}, "hidePhone": ["Bistrot des Copains"],
                        "add": {"Hotels": [{"name": "Holiday Inn Express", "address": "Bahnhof 1"}]}}
data = {"places": [{"cat": "Shops", "items": [{"name": "Coop Pronto (Tankstelle)"}, {"name": "Coop"}, {"name": "Coop Sierre", "address": "PDF-Adresse"}]},
                   {"cat": "Restaurants", "items": [{"name": "Bistrot des Copains", "phone": "079"}]},
                   {"cat": "Hotels", "items": [{"name": "Holiday Inn Express"}]}, {"cat": "Notfall", "items": [{"name": "Spital"}]}]}
U.apply_place_fixes(data)
it = {i["name"]: i for c in data["places"] for i in c["items"]}
check("Info: «Coop Pronto» bekommt die eigene Adresse, nicht die von Coop", it["Coop Pronto (Tankstelle)"].get("address") == "Prontoweg 2", it["Coop Pronto (Tankstelle)"])
check("Info: Adresse aus dem PDF wird nie überschrieben", it["Coop Sierre"].get("address") == "PDF-Adresse")
check("Info: fehlende Telefonnummer ergänzt, ausgeblendete entfernt", it["Spital"].get("phone") and "phone" not in it["Bistrot des Copains"])
check("Info: Casthotel nicht doppelt", sum(1 for c in data["places"] for i in c["items"] if i["name"] == "Holiday Inn Express") == 1)

# ====================================================================== automatische Push-Nachrichten
common.GROUP = 'automatische Push-Nachrichten'
import notify_changes as N  # noqa: E402
N.ROOT = str(TMP)
fs = FakeFS().install()
fs.d["roles/crew"] = {"perms": ["view.plan", "view.dispo"]}; fs.d["roles/catering"] = {"perms": ["view.dispo"]}; fs.d["roles/admin"] = {"perms": []}
dates = [D(i) for i in range(1, 9)]
(TMP / "pending_push.json").write_text(json.dumps({"news": [{"kind": "plan", "dates": dates, "version": "V7"}, {"kind": "cs", "dates": [D(1)]},
                                                             {"kind": "cs", "dates": [D(2)], "upd": True}], "days": [{"date": D(1), "label": "DT 5"}]}))
N.main()
msgs = [dec(v["c"]) for v in fs.col("broadcasts").values()]
plan = next((m for m in msgs if m["kind"] == "plan"), {}); cs = [m for m in msgs if m["kind"] == "cs"]
check("Auto-Push: eine Nachricht pro Art (neue und geänderte Callsheets zusammen)", len(msgs) == 2 and len(cs) == 1, [m.get("kind") for m in msgs])
check("Auto-Push Drehplan: nur Owner, Admin und Rollen mit Drehplan – nicht ohne Rolle", sorted(plan.get("roles") or []) == ["admin", "crew", "owner"], plan.get("roles"))
check("Auto-Push Callsheet: auch an Personen ohne Rolle", "" in (cs[0]["roles"] if cs else []) and "catering" in (cs[0]["roles"] if cs else []))
check("Auto-Push: höchstens 6 Tage, Version und Drehtag im Text", plan.get("body", "").startswith("V7 · DT 5 · ") and plan["body"].count(",") == 5, plan.get("body"))
check("Auto-Push: in allen 4 Sprachen, Tippen öffnet den Tag", set(plan.get("i18n") or {}) == {"de", "fr", "it", "en"} and plan.get("url") == "./#go=plan:" + D(1))
check("Auto-Push: Auftragsdatei danach weg (nichts doppelt)", not (TMP / "pending_push.json").exists())
(TMP / "pending_push.json").write_text(json.dumps({"news": [{"kind": "script", "dates": [D(0)], "version": "v13"}], "days": []}))
fs.d["roles/crew"] = {"perms": ["view.plan", "view.script"]}
n0 = len(fs.col("broadcasts")); N.main()
sm = [dec(v["c"]) for v in fs.col("broadcasts").values() if dec(v["c"]).get("kind") == "script"]
s0 = sm[0] if sm else {}
check("Auto-Push Drehbuch: Nachricht «Neue Drehbuch-Version» mit Version", s0.get("title") == "Neue Drehbuch-Version" and "v13" in s0.get("body", ""), s0.get("body"))
check("Auto-Push Drehbuch: nur Rollen mit «Drehbuch sehen», nicht ohne Rolle", sorted(s0.get("roles") or []) == ["admin", "crew", "owner"], s0.get("roles"))
check("Auto-Push Drehbuch: alle Sprachen, Tippen öffnet das Drehbuch", set(s0.get("i18n") or {}) == {"de", "fr", "it", "en"} and (s0.get("url") or "").startswith("./#go=script:"))
check("Drehbuch-Version aus dem Dateinamen", U.script_version("01_Script/261017_Tschugger_Tigerblood_v13 CLEAN.pdf") == "v13" and U.script_version("x.pdf") == "")
_cl = U.changelog_parse("CHANGELOG v13\n\nSc5 deleted: Kids (Sc5pt4)\nSc6 SL changed: Sc6 SL4\nSc184CA added: Woman with dog\nSc5 again\n\n\n\nArnold B, +41 78 000 00 00, a@b.ch\n")
check("Changelog: Szenen in Reihenfolge, ohne Doppel (auch 184CA)", _cl["scenes"] == ["5", "6", "184CA"], _cl["scenes"])
check("Changelog: keine Telefonnummern oder E-Mail-Adressen im Text", "+41" not in _cl["log"] and "@" not in _cl["log"] and "Woman with dog" in _cl["log"])
check("Changelog: passend zur Drehbuch-Version gewählt", (U.pick_changelog(_fs, "v13") or {}).get("name", "").endswith("Changelog v13 261017.pdf") and U.pick_changelog(_fs, "v12") is None)

# ====================================================================== Push-Versand
common.GROUP = 'Push-Versand'
import push_send as P  # noqa: E402
P.SENT = str(TMP / "sent.json"); P.vapid_keys = lambda key: ["pem"]
P.DEVS = str(TMP / "nodir" / "devices.json")   # the device cache is tested on its own below (here: always all devices)
fs = FakeFS().install()
dev = lambda role, **k: {"c": enc(dict({"sub": {"endpoint": "https://push/" + role}, "on": True, "lang": "fr", "who": {"role": role, "email": role + "@t"}}, **k))}
fs.d["push/dCrew"] = dev("crew"); fs.d["push/dCat"] = dev("catering"); fs.d["push/dOff"] = dev("crew", news={"plan": False})
fs.d["push/dGone"] = dev("crew"); fs.d["push/dErr"] = dev("admin")
now = int(time.time() * 1000)
fs.d["broadcasts/b1"] = {"c": enc({"title": "T", "body": "B", "i18n": {"fr": {"title": "TF", "body": "BF"}}, "roles": ["owner", "admin", "crew"], "kind": "plan", "at": now - 120000, "push": True})}
calls = []
res = {"crew": "ok", "admin": "err"}
def fake_send2(sub, data, pems, ttl):
    ep = sub["endpoint"]; calls.append((ep, json.loads(data)))
    return res.get(ep.rsplit("/", 1)[1], "ok")
P.send = fake_send2
# the «gone» device: its own endpoint answers 410
fs.d["push/dGone"] = {"c": enc({"sub": {"endpoint": "https://push/gone"}, "on": True, "who": {"role": "crew"}})}; res["gone"] = "gone"
P.main()
eps = [e for e, _ in calls]
b1 = fs.d["broadcasts/b1"]
check("Push-Versand: nur an Rollen der Nachricht (Catering bekommt den Drehplan nicht)", "https://push/catering" not in eps and "https://push/crew" in eps, eps)
check("Push-Versand: abbestellte Art wird nicht geschickt", eps.count("https://push/crew") == 1, eps)
check("Push-Versand: Text in der Sprache des Geräts", any(d["title"] == "TF" for e, d in calls if e == "https://push/crew"))
check("Push-Versand: Bild je nach Thema (Änderung → Pfeile)", all(d.get("icon") == "change" for e, d in calls if d.get("tag", "").startswith("b")))
check("Push-Versand: Empfänger werden gespeichert", "dCrew" in (b1.get("done") or []) and "dOff" not in (b1.get("done") or []), b1.get("done"))
check("Push-Versand: mit Fehler nicht erledigt (nächster Lauf versucht es nochmals)", not b1.get("fin"))
check("Push-Versand: abgemeldetes Gerät wird gelöscht", "push/dGone" not in fs.d)
calls.clear(); res["admin"] = "ok"; P.main()
eps = [e for e, _ in calls]; b1 = fs.d["broadcasts/b1"]
check("Push-Versand: zweiter Lauf schickt nur noch an das fehlgeschlagene Gerät", eps == ["https://push/admin"], eps)
check("Push-Versand: danach erledigt", b1.get("fin") is True and "dErr" in b1.get("done"))

# registered devices: all of them at most once an hour, in between only the changed ones (fewer Firebase reads)
_dp = TMP / "devs.json"; P.DEVS = str(_dp)
_calls = {"list": 0, "q": 0}
_ol, _oq = P.fsadmin.list_docs, P.fsadmin.query_since
def _fl(col): _calls["list"] += 1; return iter([("a", {"c": "A"}, None), ("b", {"c": "B"}, None)])
def _fq(col, field, iso): _calls["q"] += 1; return iter([("b", {"c": "B2"}, None)])
P.fsadmin.list_docs, P.fsadmin.query_since = _fl, _fq
try:
    if _dp.exists(): _dp.unlink()
    P.PEND_DEVS.clear(); d1 = dict((k, v) for k, v, _ in P.push_devices()); P.save_devices()
    P.PEND_DEVS.clear(); d2 = dict((k, v) for k, v, _ in P.push_devices()); P.save_devices()
    c = json.loads(_dp.read_text()); c["full"] -= 4000; _dp.write_text(json.dumps(c))
    P.PEND_DEVS.clear(); P.push_devices()
finally:
    P.fsadmin.list_docs, P.fsadmin.query_since = _ol, _oq
check("Push-Versand: Geräte stündlich ganz gelesen, dazwischen nur geänderte", d1 == {"a": {"c": "A"}, "b": {"c": "B"}} and d2 == {"a": {"c": "A"}, "b": {"c": "B2"}} and _calls == {"list": 2, "q": 1}, (d1, d2, _calls))

# ====================================================================== Google Kalender
common.GROUP = 'Google Kalender'
import gcal_sync as G  # noqa: E402
dd = lambda n: (datetime.date.today() + datetime.timedelta(days=n)).strftime("%Y%m%d")
ics = "\r\n".join(["BEGIN:VCALENDAR", "VERSION:2.0",
    "BEGIN:VEVENT", "UID:a1", f"DTSTART;TZID=Europe/Zurich:{dd(1)}T090000", f"DTEND;TZID=Europe/Zurich:{dd(1)}T103000", "SUMMARY:Kostümprobe", "LOCATION:Sion", "END:VEVENT",
    "BEGIN:VEVENT", "UID:a2", f"DTSTART;VALUE=DATE:{dd(2)}", "SUMMARY:Ganztag", "END:VEVENT",
    "BEGIN:VEVENT", "UID:a3", f"DTSTART:{dd(3)}T080000Z", f"DTEND:{dd(3)}T090000Z", "RRULE:FREQ=DAILY;COUNT=2", "SUMMARY:Serie", "END:VEVENT",
    "BEGIN:VEVENT", "UID:old", f"DTSTART:{dd(-3)}T080000Z", "SUMMARY:alt", "END:VEVENT", "END:VCALENDAR"]).encode()
it = G.parse(ics)
check("Google Kalender: Zeit in Schweizer Zeit, ganztags ohne Zeit, Vergangenes weg", [(x["title"], x["t"], x["end"]) for x in it[:2]] == [("Kostümprobe", "09:00", "10:30"), ("Ganztag", "", "")] and all(x["title"] != "alt" for x in it), it[:2])
check("Google Kalender: Serientermin einzeln, mit eigener ID pro Tag", [x["uid"] for x in it if x["title"] == "Serie"] == ["a3|" + D(3), "a3|" + D(4)])
evs = [("e1", {"gc": "a1", "c": G.enc(KEY, {"title": "alt", "date": D(1), "t": "08:00", "roles": ["crew"]})}),
       ("e2", {"gc": "weg", "c": G.enc(KEY, {"date": D(1)})}), ("e3", {"c": enc({"title": "eigener"})})]
u, dl = G.sync(KEY, it, evs)
n1 = G.dec(KEY, u["e1"]) if "e1" in u else {}
check("Google Kalender: geänderte Zeit und Titel werden nachgeführt, Empfänger bleiben", n1.get("t") == "09:00" and n1.get("title") == "Kostümprobe" and n1.get("roles") == ["crew"], n1)
check("Google Kalender: im Kalender gelöscht → aus der App entfernt; eigene Termine unberührt", dl == ["e2"] and "e3" not in u, (dl, list(u)))

# ====================================================================== Alarm
common.GROUP = 'Alarm'
import fail_alarm as A  # noqa: E402
A.ROOT = str(TMP)
def alarm_run(cfg=None, st=None):
    fs = FakeFS().install()
    if cfg is not None: fs.d["config/app"] = cfg
    if st is not None: (TMP / "status.json").write_text(json.dumps(st))
    A.main(); return fs, json.loads((TMP / "status.json").read_text())
fs, st = alarm_run(st={"state": "ok"})
check("Alarm: erster Fehllauf – noch kein Alarm", not fs.col("broadcasts") and st["fails"] == 1)
fs, st = alarm_run()
al = [dec(v["c"]) for v in fs.col("broadcasts").values()]
check("Alarm: zweiter Fehllauf – Push an Owner und Admins", len(al) == 1 and al[0]["roles"] == ["owner", "admin"] and al[0]["kind"] == "alarm", al)
fs, st = alarm_run()
check("Alarm: höchstens alle 6 Stunden", not fs.col("broadcasts") and st["fails"] == 3)
fs, st = alarm_run(cfg={"failAlarm": False}, st={"state": "error", "fails": 4})
check("Alarm: in den App-Einstellungen ausgeschaltet – kein Alarm", not fs.col("broadcasts"))

# blocking: scene numbers in folder and file names (parts and slideshow pictures keep their number)
check("Blocking: «Scene 186 pt1 A_B_C» → 186pt1, «Scene_25sl2» → 25sl2, «Scene 012 v2» → 12", [U.scene_key(x) for x in ("Scene 186 pt1 A_B_C", "Scene_25sl2", "Scene 012 v2.pdf", "Scene 184C.pdf")] == ["186pt1", "25sl2", "12", "184C"])
check("Blocking: Bilder im Teil-Ordner gehören zu diesem Teil", U.blk_top({"path": "/3D/0_BlockingFloorplans/Scene_186/Scene 186 pt2/a.jpeg"}) == ("Scene_186", ["Scene 186 pt2"], "186pt2"))
check("Auflösung: Ordnername mit Slideshow-Szenen wird gelesen", U.scenes_in_name("09 OFFICE 25sl2_021 CH") == ["25sl2", "21"], U.scenes_in_name("09 OFFICE 25sl2_021 CH"))
# 2nd unit only where the schedule has a «2nd unit:» part (a B-Cam of the 1st unit is none)
_txt = "Day #1 - SR: 7:55 - Tue 20/10/2026\n12:00: Shoot B-Cam only:\n186 pt1A\nDay #2 - SR\n2nd unit: 06:45–17:00\nDay Off - SR\n"
check("2nd Unit: Tage mit eigener «2nd unit:»-Zeile erkannt", U.unit_days(_txt) == {"unit2": {2}, "unit3": set()}, U.unit_days(_txt))
_d = [{"kind": "shoot", "short": "D1", "items": [{"t": "09:00", "sc": "2"}, {"t": "14:30", "sc": "186pt1B"}], "unit2": {"items": [{"t": "12:00", "sc": "186pt1A"}]}},
      {"kind": "shoot", "short": "D2", "items": [], "unit2": {"items": [{"t": "07:00", "sc": "5"}]}},
      {"kind": "shoot", "short": "D3", "items": [], "unit2": {"src": "2nd", "items": [{"t": "07:00", "sc": "9"}]}}]
U.fix_units(_d, _txt)
check("2nd Unit: B-Cam-Zeilen wieder in der 1st Unit (nach Zeit eingereiht), echte 2nd Unit bleibt",
      "unit2" not in _d[0] and [i["sc"] for i in _d[0]["items"]] == ["2", "186pt1A", "186pt1B"] and "unit2" in _d[1] and "unit2" not in _d[2] and _d[2]["items"] == [], _d)

# 2nd unit sheet: tab list (shown and hidden) and the tab colours from the xlsx export – only GREEN tabs count
class _R: status_code = 200; text = ('<li id="sheet-button-11"><a>#5-Salgesch</a></li><script>items.push({name: "#5-Salgesch", gid: "11"});'
                                     'items.push({name: "#1-Pfyn", gid: "33"});items.push({name: "#7", gid: "44", hidden: true});</script>')
_g = U.requests.get; U.requests.get = lambda *a, **k: _R()
try: _t = U.sheet_tabs("https://docs.google.com/spreadsheets/d/abc/edit")
finally: U.requests.get = _g
check("2nd Unit: alle Blätter bekannt, ausgeblendete markiert", [n for _, n in _t] == ["#5-Salgesch", "#1-Pfyn", "#7"] and U.SHEET_HIDDEN == ["#1-Pfyn", "#7"], (_t, U.SHEET_HIDDEN))
import io as _io, openpyxl as _ox  # noqa: E402
_wb = _ox.Workbook(); _a = _wb.active; _a.title = "#5-Salgesch"; _a.sheet_properties.tabColor = "FF0000"
_b = _wb.create_sheet("#6 Pfyn"); _b.sheet_properties.tabColor = "34A853"; _b.sheet_state = "hidden"
_c = _wb.create_sheet("#7 alt"); _c.sheet_properties.tabColor = "00FF00"
_wb.create_sheet("#8 ohne Farbe")
_bio = _io.BytesIO(); _wb.save(_bio)
_col = U.sheet_colors(raw=_bio.getvalue())
check("2nd Unit: grüne Blätter erkannt, auch ausgeblendete; rote und ungefärbte nicht",
      {k: (v["green"], v["hidden"]) for k, v in _col.items()} == {"#5-Salgesch": (False, False), "#6 Pfyn": (True, True), "#7 alt": (True, False), "#8 ohne Farbe": (False, False)}, _col)
check("2nd Unit: Grün- und Orangetöne zählen, Rot/Gelb/Blau/Weiss nicht",
      [U._is_green(c) for c in ("FF34A853", "00FF00", "B7E1CD", "0B8043", "FF9900", "E69138", "F6B26B", "FCE5CD", "FF0000", "FFFF00", "4285F4", "FFFFFF", "999999")]
      == [True] * 8 + [False] * 5, [U._is_green(c) for c in ("FCE5CD",)])

# scene details from the schedule PDF text (also split scene numbers «186 / pt1A», FX/XX names in the head, Loc under Special)
_st = """Day #1 - SR: 7:55 SS: 18:37 - Tue 20/10/2026
12:00: Shoot B-Cam only:

186
pt1A

3/8 pgs E/Ev VALAIS - PFYN FOREST 1, 2

12:00
0h45m

Bax + Pirmin crossing thick bushes.
Loc: Pfynwald Kieswerk Volken E

Crew: Armourer/SFX, Props: Branch (dummy soft),
Weapons police in holster, Notes: shoot on other part / no drone, Story Date:
02.11.2032

Day #10 - SR 7:11 SS: 17:18
184E 1 1/8 pgs E/N VALAIS - LAKE - SHORE 1, 2 / FX: Double BJ (in water), Stunt
Double Pirmin / 6 XX: 6xPolice Officer
Valais

20:15
1h45m

Fight. Loc: Collombey-Murat

Crew: Lifeguard, Special:
Cam Boat or Platform, Loc: Warmup Tent, Stunt: Stone (soft dummy, from stunt), Props: Postcard with QR-
code
"""
_pb = U.parse_breakdown(_st)
check("Szenen-Details: Abteilungen je Szene aus dem Drehplan gelesen",
      _pb.get(1, {}).get("186pt1a", {}).get("c") == [["Crew", ["Armourer/SFX"]], ["Props", ["Branch (dummy soft)", "Weapons police in holster"]], ["Notes", ["shoot on other part", "no drone"]], ["Story Date", ["02.11.2032"]]]
      and _pb.get(10, {}).get("184e", {}).get("h") == {"FX": "Double BJ (in water), Stunt Double Pirmin", "XX": "6xPolice Officer Valais"}
      and _pb[10]["184e"]["c"] == [["Crew", ["Lifeguard"]], ["Special", ["Cam Boat or Platform"]], ["Loc", ["Warmup Tent"]], ["Stunt", ["Stone (soft dummy, from stunt)"]], ["Props", ["Postcard with QR-code"]]], _pb)

sys.exit(done("Hintergrund"))
