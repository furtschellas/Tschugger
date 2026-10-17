#!/usr/bin/env python3
"""Hintergrund-Abläufe ohne Netz und ohne Browser: Dropbox-Aktualisierung (Änderungen erkennen, Prep-Zusammenbau,
Info-Adressen), automatische Push-Nachrichten, Push-Versand und Alarm. Firestore und der Push-Dienst sind nachgebaut.

  python3 tests/test_backend.py
"""
import base64, datetime, json, os, secrets, sys, tempfile, pathlib, time

HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(ROOT / "tools"))
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
        def patch(p, f, update_time=None): self.d.setdefault(p, {}).update(f); return True
        fsadmin.patch_doc = patch
        def create(col, f, raw=None): self.n += 1; self.d[f"{col}/x{self.n}"] = dict(f); return f"x{self.n}"
        fsadmin.create_doc = create
        def delete(p): self.d.pop(p, None); return True
        fsadmin.delete_doc = delete
        return self
    def col(self, c): return {k.split("/", 1)[1]: v for k, v in self.d.items() if k.split("/")[0] == c}


# ====================================================================== Dropbox-Aktualisierung
import update_from_dropbox as U  # noqa: E402

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

# ====================================================================== Push-Versand
import push_send as P  # noqa: E402
P.SENT = str(TMP / "sent.json"); P.vapid_keys = lambda key: ["pem"]
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
check("Push-Versand: Empfänger werden gespeichert", "dCrew" in (b1.get("done") or []) and "dOff" not in (b1.get("done") or []), b1.get("done"))
check("Push-Versand: mit Fehler nicht erledigt (nächster Lauf versucht es nochmals)", not b1.get("fin"))
check("Push-Versand: abgemeldetes Gerät wird gelöscht", "push/dGone" not in fs.d)
calls.clear(); res["admin"] = "ok"; P.main()
eps = [e for e, _ in calls]; b1 = fs.d["broadcasts/b1"]
check("Push-Versand: zweiter Lauf schickt nur noch an das fehlgeschlagene Gerät", eps == ["https://push/admin"], eps)
check("Push-Versand: danach erledigt", b1.get("fin") is True and "dErr" in b1.get("done"))

# ====================================================================== Alarm
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

sys.exit(done("Hintergrund"))
