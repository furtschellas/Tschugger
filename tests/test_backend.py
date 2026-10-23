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
# known bug patterns (duplicate keys, unreachable code, look-behind regex that stops older iPhones …) – tests/eslint.json
_esl = _sh.which("eslint")
if _esl and _sp.run([_esl, "--version"], capture_output=True, text=True).stdout.strip().startswith("v8."):   # the CI installs eslint@8 (config format of tests/eslint.json)
    _r = _sp.run([_esl, "--no-eslintrc", "-c", str(_T.parent / "tests" / "eslint.json"), "--format", "unix"] + [str(f) for f in sorted(list((_T / "base").glob("*.js")) + list((_T / "boot").glob("*.js")))], capture_output=True, text=True)
    check("App-Teile: keine bekannten Fehlermuster (ESLint)", _r.returncode == 0, [l.split("/")[-1][:160] for l in _r.stdout.splitlines() if l.strip()][:8])
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
# App-Verwaltung «Push-Nachrichten anbieten» off: nothing goes out (also new messages to everybody), whatever the devices say
fs.d["broadcasts/bOff"] = {"c": enc({"title": "X", "body": "Y", "roles": None, "at": int(time.time() * 1000) - 120000, "push": True})}
fs.d["config/app"] = {"pushEnabled": False}; calls.clear(); P.main()
check("Push-Versand: in der App-Verwaltung ausgeschaltet – an niemanden etwas verschickt", calls == [] and not fs.d["broadcasts/bOff"].get("fin"), calls)
fs.d.pop("config/app", None); fs.d.pop("broadcasts/bOff", None)
# Coverday: reminders of a device computed before a change (applied, applied again or cancelled) are held back on the days of that change only
fs.d["coverday/state"] = {"c": enc({"ops": [{"op": "swap", "a": "2031-03-02", "b": "2031-03-03", "st": "on", "at": 5000},
                                             {"op": "move", "a": "2031-03-09", "b": "2031-03-10", "st": "off", "at": 1000, "off": 4000},
                                             {"op": "move", "a": "2031-03-12", "b": "2031-03-13", "st": "off", "at": 500, "off": 900}]}), "at": 5000}
cdv = P.coverday(KEY)
ts = lambda d, h=10: int(datetime.datetime(*map(int, d.split("-")), h, 0, tzinfo=datetime.timezone(datetime.timedelta(hours=1))).timestamp() * 1000)
st = [P.cd_stale({"start": ts(d)}, {"cd": v}, cdv) for d, v in (("2031-03-02", 0), ("2031-03-03", 4999), ("2031-03-04", 0), ("2031-03-02", 5000), ("2031-03-09", 3000), ("2031-03-10", 4500), ("2031-03-12", 3000))]
check("Push-Versand: Coverday – Erinnerungen eines Geräts ohne die neueste Änderung (auch Aufheben) an deren Tagen zurückgehalten, sonst normal", (cdv[0], st) == (5000, [True, True, False, False, True, False, False]), (cdv, st))
fs.d["coverday/state"] = {"c": enc({"ops": [{"op": "shift", "a": "2031-03-05", "st": "on", "at": 7000}]}), "at": 7000}
cdv = P.coverday(KEY)
check("Push-Versand: Coverday Nachrücken – alle Tage ab dem Datum", [P.cd_stale({"start": ts(d)}, {}, cdv) for d in ("2031-03-04", "2031-03-05", "2031-03-20")] == [False, True, True])
fs.d.pop("coverday/state", None)
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
                                     'items.push({name: "#1-Tannen", gid: "33"});items.push({name: "#7", gid: "44", hidden: true});</script>')
_g = U.requests.get; U.requests.get = lambda *a, **k: _R()
try: _t = U.sheet_tabs("https://docs.google.com/spreadsheets/d/abc/edit")
finally: U.requests.get = _g
check("2nd Unit: alle Blätter bekannt, ausgeblendete markiert", [n for _, n in _t] == ["#5-Salgesch", "#1-Tannen", "#7"] and U.SHEET_HIDDEN == ["#1-Tannen", "#7"], (_t, U.SHEET_HIDDEN))
import io as _io, openpyxl as _ox  # noqa: E402
_wb = _ox.Workbook(); _a = _wb.active; _a.title = "#5-Salgesch"; _a.sheet_properties.tabColor = "FF0000"
_b = _wb.create_sheet("#6 Tannen"); _b.sheet_properties.tabColor = "34A853"; _b.sheet_state = "hidden"
_c = _wb.create_sheet("#7 alt"); _c.sheet_properties.tabColor = "00FF00"
_wb.create_sheet("#8 ohne Farbe")
_bio = _io.BytesIO(); _wb.save(_bio)
_col = U.sheet_colors(raw=_bio.getvalue())
check("2nd Unit: grüne Blätter erkannt, auch ausgeblendete; rote und ungefärbte nicht",
      {k: (v["green"], v["hidden"]) for k, v in _col.items()} == {"#5-Salgesch": (False, False), "#6 Tannen": (True, True), "#7 alt": (True, False), "#8 ohne Farbe": (False, False)}, _col)
check("2nd Unit: Grün- und Orangetöne zählen, Rot/Gelb/Blau/Weiss nicht",
      [U._is_green(c) for c in ("FF34A853", "00FF00", "B7E1CD", "0B8043", "FF9900", "E69138", "F6B26B", "FCE5CD", "FF0000", "FFFF00", "4285F4", "FFFFFF", "999999")]
      == [True] * 8 + [False] * 5, [U._is_green(c) for c in ("FCE5CD",)])

# scene details from the schedule PDF text (also split scene numbers «186 / pt1A», FX/XX names in the head, Loc under Special)
_st = """Day #1 - SR: 7:55 SS: 18:37 - Tue 20/10/2026
12:00: Shoot B-Cam only:

186
pt1A

3/8 pgs E/Ev VALAIS - TANNEN FOREST 1, 2

12:00
0h45m

Bax + Pirmin crossing thick bushes.
Loc: Tannenwald Kieswerk Muster E

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
_pb = U.parse_breakdown(_st.replace("Day #10", "Tschugger Sched - Sched 261018 - Schedule AB - page # 7\n\n\f\fDay #10"))
check("Szenen-Details: Abteilungen je Szene aus dem Drehplan gelesen",
      _pb.get(1, {}).get("186pt1a", {}).get("c") == [["Crew", ["Armourer/SFX"]], ["Props", ["Branch (dummy soft)", "Weapons police in holster"]], ["Notes", ["shoot on other part", "no drone"]], ["Story Date", ["02.11.2032"]]]
      and _pb.get(10, {}).get("184e", {}).get("h") == {"FX": "Double BJ (in water), Stunt Double Pirmin", "XX": "6xPolice Officer Valais"}
      and _pb[10]["184e"]["c"] == [["Crew", ["Lifeguard"]], ["Special", ["Cam Boat or Platform"]], ["Loc", ["Warmup Tent"]], ["Stunt", ["Stone (soft dummy, from stunt)"]], ["Props", ["Postcard with QR-code"]]], _pb)
_pb2 = U.parse_breakdown("Day #8 - SR\n22:00\nTschugger Sched - Sched 261018 - page # 8\n\n\f27 4/8 pgs I/N VALAIS - POLICE STATION - OPEN SPACE\nOFFICE\n\n1, 10\n\n19:15\n1h\n\nPeter interrogating Bax.\nLoc: Salgesch\n\nProps: Flight Tickets, Handcuffs, Story Date: 20.10.2032\n")
check("Szenen-Details: Szene direkt nach einem Seitenumbruch (27 auf D8) wird gefunden", (_pb2.get(8, {}).get("27") or {}).get("c") == [["Props", ["Flight Tickets", "Handcuffs"]], ["Story Date", ["20.10.2032"]]], _pb2)
check("Szenen-Details: «Special: Elec: …» bleibt wie im PDF zusammen", (U.parse_breakdown("Day #1\n186 pt2 1 2/8 pgs E/Ev X 1\n17:30\n\nParty.\nLoc: Tannen\n\nCrew: Drone, Special: Elec: enhance beamer light, Set Dec: Film projection\n").get(1, {}).get("186pt2") or {}).get("c") == [["Crew", ["Drone"]], ["Special: Elec", ["enhance beamer light"]], ["Set Dec", ["Film projection"]]])

# data check App ↔ Dropbox: scene numbers of the schedule belong to the script scene (parts, slideshow pictures)
import verify_data as V  # noqa: E402
check("Daten prüfen: Szenennummern normalisiert", [V.sc_key(x) for x in ("186pt1A", "25 SL2", "012")] == ["186pt1a", "25sl2", "12"])

# key change: nightly check notices removed people; the Firestore entries (Termine, Kalender) are re-encrypted too
import rotate as RT  # noqa: E402
_store = {"secret/keymeta": {"uids": ["a", "b"], "at": int(time.time())}}
_mem = ["a"]
_o = (fsadmin.list_docs, fsadmin.get_doc, fsadmin.patch_doc)
fsadmin.list_docs = lambda col: [(u, {"active": True}, "") for u in _mem] + [("blocked", {"active": False}, "")] if col == "members" else []
fsadmin.get_doc = lambda p: _store.get(p)
fsadmin.patch_doc = lambda p, f, update_time=None: (_store.setdefault(p, {}).update(f), True)[1]
_go = os.environ.pop("GITHUB_OUTPUT", None)
_out = pathlib.Path(tempfile.mkdtemp()) / "o"; os.environ["GITHUB_OUTPUT"] = str(_out)
RT.due(); _d1 = _out.read_text()
_mem = ["a", "b", "c"]; _store["secret/keymeta"] = {"uids": ["a", "b"], "at": int(time.time())}; RT.due()
check("Schlüsselwechsel: nach dem Entfernen einer Person nötig, sonst nicht (neue Personen werden gemerkt)",
      _d1.strip() == "due=true" and _out.read_text().strip().endswith("due=false") and _store["secret/keymeta"]["uids"] == ["m:a", "m:b", "m:c"], (_d1, _store))
_store["secret/keymeta"] = {"uids": ["m:a", "m:b", "m:c"], "at": int(time.time()) - 31 * 86400}; RT.due()
check("Schlüsselwechsel: planmässig nach 30 Tagen, auch ohne entfernte Person", _out.read_text().strip().endswith("due=true"), public=True)
fsadmin.list_docs, fsadmin.get_doc, fsadmin.patch_doc = _o
os.environ.pop("GITHUB_OUTPUT", None)
if _go: os.environ["GITHUB_OUTPUT"] = _go
_rs = (ROOT_T := pathlib.Path(__file__).resolve().parent.parent / "tools" / "rotate.py").read_text()
check("Schlüsselwechsel: Termine, Google-Kalender und Galerie-Bilderliste werden neu verschlüsselt",
      '"events"' in _rs and '"gcal/feed"' in _rs and '"media.enc.json"' in _rs)

# own key for phone numbers / e-mail addresses: split from the crew list and merged back the same way
_crew = [{"id": "c00", "people": [{"name": "A", "role": "x", "phone": "+41 1", "email": "a@test.ch", "hotel": "H"}, {"name": "B"}]}]
_pub, _cts = U.split_contacts(_crew)
check("Kontakte: Telefon/E-Mail nicht in den allgemeinen Daten, Rest bleibt",
      _pub[0]["people"][0] == {"name": "A", "role": "x", "hotel": "H"} and _cts == [[0, 0, "A", {"phone": "+41 1", "email": "a@test.ch"}]] and _crew[0]["people"][0]["phone"] == "+41 1", (_pub, _cts))
U.merge_contacts(_pub, _cts + [[0, 1, "falsch", {"phone": "9"}]])
check("Kontakte: wieder zusammengeführt, nur bei gleichem Namen", _pub[0]["people"][0].get("phone") == "+41 1" and "phone" not in _pub[0]["people"][1])
_k1, _k2, _k3 = secrets.token_bytes(32), secrets.token_bytes(32), secrets.token_bytes(32)
_tf = pathlib.Path(tempfile.mkdtemp()) / "x.enc.json"
U.enc_file(_tf, {"a": 1}, _k1)
check("Schlüsselwechsel: Datei mit früherem Schlüssel (abgebrochener Lauf) wird trotzdem neu verschlüsselt",
      RT.refile(_tf, [_k2, _k1], _k3) and json.loads(AESGCM(_k3).decrypt(base64.b64decode(json.loads(_tf.read_text())["iv"]), base64.b64decode(json.loads(_tf.read_text())["ct"]), None)) == {"a": 1} and RT.refile(_tf, [_k2], _k3) is False)

check("Sides: Datum im US-Format mit Wochentag richtig gelesen (Tuesday 10.06. = 6. Oktober)",
      [U.sides_date(x) for x in ("x_DT2_Tuesday, 10.06.2026.pdf", "x_DT 4_Sunday, 25.10.2026.pdf", "x_Montag, 05.10.2026.pdf")] == ["2026-10-06", "2026-10-25", "2026-10-05"])

# a scene of the 1st unit (B-Cam) also with the 2nd unit (wish of the production): added once, also after several runs
_days = [{"kind": "shoot", "short": "D1", "items": [{"sc": "186pt1A", "t": "08:00"}, {"sc": "5"}]}]
U.u2_also_add(_days); U.u2_also_strip(_days); U.u2_also_add(_days); U.u2_also_add(_days)
check("2nd Unit: Szene 186pt1A an Tag 1 zusätzlich (1st Unit bleibt, nur einmal)",
      [i["sc"] for i in _days[0]["unit2"]["items"]] == ["186pt1A"] and len(_days[0]["items"]) == 2 and _days[0]["unit2"]["src"] == "also", _days)
_days2 = [{"kind": "shoot", "short": "D1", "items": [{"sc": "186pt1A", "t": "08:00"}]}]
_sh = {"g1": {"no": 1, "u2": {"hours": "07:00-17:00", "items": [{"t": "07:00", "n": "Rigging"}, {"sc": "186 pt1A", "t": "09:30", "set": "Party"}, {"sc": "99", "t": "12:00"}]}}}
_keep = U.U2_DAY_ALSO; U.U2_DAY_ALSO = []
U.u2_also_add(_days2, _sh)
U.U2_DAY_ALSO = _keep
_days3 = [{"kind": "shoot", "short": "D1", "items": [{"sc": "186pt1A", "t": "08:00"}]}]
U.u2_also_add(_days3, _sh); U.u2_also_strip(_days3); U.u2_also_add(_days3, _sh)
check("2nd Unit Ausnahme Tag 1: ganzes Sheet (auch andere Szenen), nur einmal", [i.get("sc") for i in _days3[0]["unit2"]["items"]] == [None, "186 pt1A", "99"], _days3)
check("2nd Unit: 186pt1A mit der genauen Planung aus dem Sheet (Setups ja, andere Szenen nein)",
      [(i.get("sc"), i.get("t")) for i in _days2[0]["unit2"]["items"]] == [(None, "07:00"), ("186 pt1A", "09:30")] and _days2[0]["unit2"].get("hours") == "07:00-17:00"
      and _days2[0]["items"][0]["t"] == "08:00", _days2)
U.fix_units(_days, ud={"unit2": {5}, "unit3": set()})
check("2nd Unit: zusätzliche Szene wandert nicht doppelt zur 1st Unit", len(_days[0]["items"]) == 2, _days)
_sh4 = {"g1": {"no": 1, "u2": {"items": [{"sc": "186pt1A", "t": "09:00"}, {"n": "A-1 Totale", "t": "09:10"}, {"n": "B-2 Nah", "t": "09:30"}, {"n": "Lunch"}]}}}
_d4 = [{"kind": "shoot", "short": "D1", "items": [{"sc": "186pt1A"}]}]
U.u2_also_add(_d4, _sh4)
check("Kamera: 186pt1A in der 1st Unit «B-Cam», in der 2nd Unit mit Setups", _d4[0]["items"][0].get("cam") == "B-Cam · 1st Unit" and _d4[0]["unit2"]["items"][0].get("cam") == "2nd Unit · Setups A-1 · B-2", _d4)

_fs = [{"name": "02_Schedule/Tschugger Sched 261018 Colomns CH.pdf", "modified": "2026-10-19T09:55:46Z"},
       {"name": "02_Schedule/Tschugger Sched 261018 CH.pdf", "modified": "2026-10-18T14:23:25Z"},
       {"name": "02_Schedule/Tschugger Sched 261018 Oneline CH.pdf", "modified": "2026-10-18T14:23:25Z"}]
check("Drehplan: der normale «… CH.pdf» vor anderen Layouts derselben Version («Colomns», «Oneline»)", U.pick_schedule(_fs)["name"].endswith("261018 CH.pdf"))

# key change running (secret/keynext of the last hour): the update writes nothing; an old leftover does not block it
_og = fsadmin.get_doc; _os = fsadmin.sa
fsadmin.sa = lambda: True
fsadmin.get_doc = lambda p: {"k": "x", "at": int(time.time())} if p == "secret/keynext" else None
_r1 = U.rotating()
fsadmin.get_doc = lambda p: {"k": "x", "at": int(time.time()) - 7200} if p == "secret/keynext" else None
_r2 = U.rotating()
fsadmin.get_doc, fsadmin.sa = _og, _os
check("Schlüsselwechsel läuft: Aktualisierung pausiert (alter Rest nach 1 Std. blockiert nicht)", _r1 is True and _r2 is False, (_r1, _r2))

# Google calendar: an empty or cut answer deletes no imported events
import gcal_sync as _G  # noqa: E402
_src = open(ROOT / "tools" / "gcal_sync.py", encoding="utf-8").read() if "ROOT" in dir() else pathlib.Path(__file__).resolve().parent.parent.joinpath("tools", "gcal_sync.py").read_text(encoding="utf-8")
check("Google Kalender: Schutz gegen Löschen bei leerer/abgeschnittener Antwort", "Löschungen ausgelassen" in _src and "len(items) < on * 0.5" in _src)

# push devices: after a key change the cache is read anew (entries are encrypted with the old key)
import push_send as _P  # noqa: E402
_pd = pathlib.Path(tempfile.mkdtemp()) / "devices.json"
json.dump({"full": time.time(), "at": time.time(), "kh": "alt", "docs": [{"id": "d1", "f": {"c": "x"}}]}, open(_pd, "w"))
_odevs, _olist, _oq = _P.DEVS, fsadmin.list_docs, fsadmin.query_since
_P.DEVS = str(_pd); _calls = []
fsadmin.list_docs = lambda col: (_calls.append("full"), [("d2", {"c": "y"}, "")])[1]
fsadmin.query_since = lambda *a: (_calls.append("since"), [])[1]
_P.KEYB[:] = [b"neuer-schluessel"]
_devs = _P.push_devices()
_P.DEVS, fsadmin.list_docs, fsadmin.query_since = _odevs, _olist, _oq
check("Push: nach Schlüsselwechsel alle Geräte neu gelesen", _calls == ["full"] and [d[0] for d in _devs] == ["d2"], (_calls, _devs))

_cf = [{"name": n, "modified": ""} for n in ("00_Callsheets/DT1/TBO_Dispo_DT01_20261020.pdf", "00_Callsheets/DT1/TSCHUGGER_Floorplans_DT1_20.10.2026.pdf", "00_Callsheets/DT1/RA_Tschugger_Tigerblood_Bild186_2026-10-20.pdf",
       "00_Callsheets/DT1/TSCHUGGER_Sides_DT1_Tuesday, 20.10.2026_Sc2.pdf", "00_Callsheets/SIDES/TSCHUGGER_DT3_Saturday, 24.10.2026.pdf", "06_Callsheets/DT2/Callsheet_DT2.pdf",
       "00_Callsheets/DT2/Capture.png", "00_Callsheets/_Archiv/old.pdf")]
_nm = lambda l: sorted(f["name"].split("/")[-1] for f in l)
check("Callsheets: Ordner 00_/06_, Sides und Gefährdungsbeurteilungen getrennt",
      _nm(U.pick_dispos(_cf)) == ["Callsheet_DT2.pdf", "TBO_Dispo_DT01_20261020.pdf"]
      and _nm(U.pick_sides(_cf)) == ["TSCHUGGER_DT3_Saturday, 24.10.2026.pdf", "TSCHUGGER_Sides_DT1_Tuesday, 20.10.2026_Sc2.pdf"]
      and _nm(U.pick_ra(_cf)) == ["RA_Tschugger_Tigerblood_Bild186_2026-10-20.pdf"], (_nm(U.pick_dispos(_cf)), _nm(U.pick_sides(_cf)), _nm(U.pick_ra(_cf))))

_d = U.cs_to_dispo({"label": "Drehtag 1", "times": {"crewCall": "08:00", "rts": "09:15", "wrap": "19:00"}, "sunrise": "07:55", "sunset": "18:37",
                    "calls": [{"dept": "Camera", "role": "DOP", "name": "F", "t": "08:10"}], "cast": [{"no": "1", "role": "BAX", "actor": "D", "wardrobe": "07:40"}],
                    "order": {"rows": [{"t": "09:00", "sc": "2", "ie": "I/Ev", "set": "CHAPEL"}, {"t": "12:15", "text": "Lunch"}]}}, "2026-10-20", {"name": "00_Callsheets/DT1/TBO_Dispo_DT01_20261020.pdf"})
check("Callsheet: App-Felder aus der Struktur (Zeiten, Calls, Cast, Szenen, Link)", _d["crewCall"] == "08:00" and _d["shootCall"] == "09:15" and _d["calls"][0]["dept"] == "Camera"
      and _d["cast"][0]["costume"] == "07:40" and [x["sc"] for x in _d["scenes"]] == ["2"] and _d["date"] == "2026-10-20" and "TBO_Dispo" in _d["link"] and "cs" in _d, _d)

# ====================================================================== Google Sheet (Szenen-Protokoll)
common.GROUP = 'Szenen-Sheet'
import scene_sheet as SS  # noqa: E402
_days = [{"date": "2031-03-02", "kind": "shoot", "short": "D1", "items": [{"sc": "1", "t": "08:00"}, {"n": "Lunch", "t": "12:00"}, {"sc": "2", "t": "13:00"}, {"n": "Wrap", "t": "18:00"}]},
         {"date": "2031-03-03", "kind": "shoot", "short": "D2", "items": [{"sc": "7", "t": "09:00"}, {"n": "Wrap", "t": "17:00"}]},
         {"date": "2031-03-04", "kind": "shoot", "short": "D3", "items": [{"sc": "9", "t": "07:30"}, {"n": "Wrap", "t": "16:00"}]}]
_cs = [{"date": "2031-03-02", "shootCall": "08:00", "scenes": [{"sc": "1"}, {"sc": "2"}]}, {"date": "2031-03-03", "shootCall": "09:00", "scenes": [{"sc": "7"}]}]
_ms = lambda d, h: int(datetime.datetime.fromisoformat(d + "T%02d:00" % h).replace(tzinfo=SS.TZ).timestamp() * 1000)
# Coverday: day 2 (scene 7) was shot on 2.3., day 1 on 3.3.
_acks = [{"d": "2031-03-02", "u": "1", "sc": "7", "id": "x-7", "s": 2, "b": _ms("2031-03-02", 9), "e": _ms("2031-03-02", 10)},
         {"d": "2031-03-03", "u": "1", "sc": "1", "id": "y-1", "s": 2, "b": _ms("2031-03-03", 8), "e": _ms("2031-03-03", 9)}]
_rows = SS.build(_acks, {"days": _days, "dispos": _cs})["1"]
_r7 = next(r for r in _rows if r[0] == "Szene 7"); _r1 = next(r for r in _rows if r[0] == "Szene 1")
_ds = {r[2]: (r[1], r[8]) for r in _rows if r[0] == "Drehstart"}
check("Google Sheet: Plan-Spalten nach Szenen-Nummer (Coverday getauscht) – Planzeit vom Drehplan-Tag der Szene, Drehstart vom passenden Callsheet",
      (_r7[8], _r1[8], _ds.get("02.03.2031"), _ds.get("03.03.2031")) == ("09:00", "08:00", ("DT 1", "09:00"), ("DT 2", "08:00")), (_r7[:10], _r1[:10], _ds))
_rows0 = SS.build([dict(_acks[0], sc="1", id="x-1")], {"days": _days, "dispos": _cs})["1"]
check("Google Sheet: ohne Coverday unverändert (eigener Tag, eigenes Callsheet)", next(r for r in _rows0 if r[0] == "Szene 1")[8] == "08:00" and next(r for r in _rows0 if r[0] == "Drehstart")[1] == "DT 1")

# ====================================================================== Cast quittieren (Regeln, erfundene Daten)
common.GROUP = 'Cast quittieren'
try:
    _cr = [json.loads(x) for x in _sp.run(["node", str(pathlib.Path(__file__).resolve().parent / "cast_rules.mjs")], capture_output=True, text=True, timeout=60).stdout.splitlines() if x.strip()]
except Exception as _e:  # noqa: BLE001
    _cr = []
check("Cast quittieren: Regeln laufen", len(_cr) >= 55, len(_cr))
for _x in _cr:
    check("Cast quittieren: " + _x["n"], _x["ok"], (_x["got"], _x["want"]))

common.GROUP = 'Ablauf mit zwei Geräten'
try:
    _fm = [json.loads(x) for x in _sp.run(["node", str(pathlib.Path(__file__).resolve().parent / "flow_multi.mjs")], capture_output=True, text=True, timeout=60).stdout.splitlines() if x.strip()]
except Exception:  # noqa: BLE001
    _fm = []
check("Ablauf mit zwei Geräten: Test läuft", len(_fm) >= 8, len(_fm))
for _x in _fm:
    check(_x["n"], _x["ok"], (_x["got"], _x["want"]))

sys.exit(done("Hintergrund"))
