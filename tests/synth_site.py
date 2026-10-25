#!/usr/bin/env python3
"""A test copy of the app with INVENTED data (no crew data): for before/after picture comparisons of the design
(tests/shots.py --synth). Builds a folder with the built app (index.html …) and data.enc.json encrypted with a throw-away key.

  python3 tests/synth_site.py OUTDIR   → prints the key (base64)
Dates are relative to today, so «today», callsheet and Meine Termine always have something to show.
"""
import base64, datetime, json, os, pathlib, secrets, shutil, sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {"data.enc.json", "media.enc.json", "contacts.enc.json", "script.enc.json", "tests", "tools", ".git", ".github", "blk", "tests.json"}


def iso(d): return d.isoformat()


def data(today=None):
    t = today or datetime.date.today()
    day = lambda n: t + datetime.timedelta(days=n)
    sets = [("1", "HOTEL LOBBY", "Bahnhofstrasse 1, 3930 Visp"), ("2", "POLIZEIPOSTEN", "Kantonsstrasse 12, 3930 Visp"), ("3", "SEEUFER", "Seeweg 4, 3999 Testdorf")]
    def items(n):
        out = [{"n": "Setup", "t": "07:00"}]
        for i in range(4):
            sc = str(10 * n + i + 1)
            out.append({"sc": sc, "t": "%02d:%02d" % (8 + i, 0), "dur": "45'", "ie": "I" if i % 2 else "E", "set": sets[i % 3][1], "pg": "1 2/8", "d": "Szene %s: Beispieltext" % sc,
                        "loc": sets[i % 3][2], "cast": ["1", "2"]})
            if i == 1: out.append({"n": "Lunch", "t": "12:00"})
        out.append({"n": "Wrap", "t": "18:00"})
        return out
    days = [{"date": iso(day(-1)), "id": "d0", "kind": "shoot", "label": "Day #1", "short": "D01", "hours": "07:00–18:00", "sr": "07:50", "ss": "18:20", "items": items(1)},
            {"date": iso(day(0)), "id": "d1", "kind": "shoot", "label": "Day #2", "short": "D02", "hours": "07:00–18:00", "sr": "07:51", "ss": "18:18", "items": items(2),
             "unit2": {"items": [{"sc": "90", "t": "09:00", "set": "STRASSE", "ie": "E"}, {"sc": "11", "t": "10:30"}], "hours": "09:00–12:00"}},
            {"date": iso(day(1)), "id": "o1", "kind": "off", "label": "Day Off"},
            {"date": iso(day(2)), "id": "d2", "kind": "shoot", "label": "Day #3", "short": "D03", "hours": "07:00–18:00", "sr": "07:53", "ss": "18:15", "items": items(3)},
            {"date": iso(day(3)), "id": "d3", "kind": "shoot", "label": "Day #4", "short": "D04", "hours": "07:00–18:00", "sr": "07:54", "ss": "18:13", "items": items(4)}]
    def cs(n, d):
        return {"date": iso(d), "label": "Drehtag %d" % n, "file": "CS%d.pdf" % n, "crewCall": "07:00", "shootCall": "08:00", "wrap": "18:00", "sr": "07:50", "ss": "18:20",
                "scenes": [{"sc": str(10 * n + i + 1)} for i in range(4)],
                "cs": {"times": {"crewCall": "07:00", "rehearsal": "07:45", "rts": "08:00", "lunch": "12:00", "wrap": "18:00"}, "weather": "sonnig", "temp": "14°",
                       "contact": {"role": "1st AD", "name": "Alex Beispiel", "phone": "+41 79 000 00 01"},
                       "locations": [{"no": s[0], "name": s[1], "map": "https://maps.example/" + s[0], "scenes": str(10 * n + int(s[0])),
                                      "items": [{"label": "Base", "text": "Base Turnhalle, Schulweg 2, 3930 Visp", "map": "https://maps.example/base"},
                                                {"label": "Tech Parking", "text": "Parkplatz Süd, 3930 Visp", "map": "https://maps.example/tech"}] if s[0] == "1" else []} for s in sets],
                       "calls": [{"dept": "Regie", "role": "1st AD", "name": "Alex Beispiel", "t": "06:45"}, {"dept": "Kamera", "role": "DoP", "name": "Kim Muster", "t": "07:00"},
                                 {"dept": "Maske", "role": "Make-up", "name": "Mara Test", "t": "06:30"}, {"dept": "Kostüm", "role": "Kostüm", "name": "Anna Probe", "t": "06:30"},
                                 {"dept": "Transport", "role": "Fahrer", "name": "Fritz Fahrer", "t": "06:00"}],
                       "cast": [{"no": "1", "role": "BEN", "actor": "Max Muster", "pickup": "06:40", "call": "07:00", "wardrobe": "Anna 07:05 - 07:20 15’", "makeup": "Mara 07:20 - 07:45 25’", "base": "07:45", "onset": "08:00"},
                                {"no": "2", "role": "LIA", "actor": "Eva Probe", "pickup": "", "call": "07:30", "wardrobe": "Anna 07:35 - 07:50 15’", "makeup": "Mara 07:50 - 08:10 20’", "base": "08:10", "onset": "08:30"}],
                       "transport": [{"vehicle": "Van 1", "driver": "Fritz Fahrer", "passengers": "Max Muster", "from": "Hotel", "t1": "06:40", "to": "Base", "t2": "06:55"},
                                     {"vehicle": "Van 1", "driver": "Fritz Fahrer", "passengers": "Max Muster", "from": "Base", "t1": "07:50", "to": "Set 1", "t2": "07:58"}],
                       "crewTransport": [{"vehicle": "Bus", "people": "Kim Muster", "from": "Hotel", "t1": "06:30", "to": "Tech Parking", "t2": "06:50"}],
                       "travel": [{"how": "Zug", "name": "Eva Probe", "from": "Zürich", "t1": "05:30", "to": "Visp", "t2": "07:10", "date": iso(d)},
                                  {"how": "Auto", "name": "Max Muster", "from": "Visp", "t1": "19:00", "to": "Bern", "t2": "21:00", "date": iso(d + datetime.timedelta(days=1))}],
                       "order": {"title": "SHOOTING ORDER", "rows": [{"t": "07:00", "text": "Setup"}] + [{"t": "%02d:00" % (8 + i), "sc": str(10 * n + i + 1), "ie": "I", "set": sets[i % 3][1], "syn": "Beispiel", "cast": "1"} for i in range(4)] + [{"t": "12:00", "text": "Lunch Break - 1h"}, {"t": "18:00", "text": "Wrap"}]},
                       "info": ["Bitte pünktlich sein.", "Parkplätze beschränkt."], "depts": [{"dept": "Kamera", "text": "Kran ab 10:00"}], "radio": "Kanal 1 Regie, Kanal 2 Produktion",
                       "extras": [{"count": "5", "part": "Passanten", "call": "08:00", "wardrobe": "08:10", "makeup": "08:20", "onset": "09:00"}],
                       "vehicles": [{"name": "Polizeiauto", "via": "Requisite", "call": "08:00", "rts": "08:30"}]}}
    dispos = [cs(1, day(-1)), cs(2, day(0)), cs(3, day(2))]
    # the callsheet of today also with a 2nd Unit (read apart, «u2»): shown below the 1st Unit, its order from the 2nd-unit sheet (day «unit2»)
    c2 = dispos[1]["cs"]
    c2["u2"] = {"crewCall": "06:45", "contact": {"role": "Set AL", "name": "Sam Zweit", "phone": "+41 79 000 00 09"}, "ad": "Robin Zweit",
                "times": {"rts": "07:30", "lunch": "11:45", "wrap": "16:45"},
                "locations": [{"no": "B.1", "name": "STRASSE", "scenes": "90", "map": "https://maps.example/b1", "items": [{"label": "Tech Parking 2", "text": "Dorfplatz, 3930 Visp"}]}],
                "order": {"title": "2ND UNIT SHOOTING ORDER", "rows": [{"t": "09:00", "sc": "90", "ie": "E", "set": "STRASSE"}]},
                "cast": [{"no": "1", "role": "BEN", "actor": "Max Muster", "pickup": "06:30", "call": "06:45", "onset": "07:30"}]}
    c2["calls"].append({"dept": "Kamera", "role": "B-Cam", "name": "Tom Zweit", "t2": "06:45"})
    c2["depts"].append({"dept": "Grip", "text": "Kran", "text2": "Car Rig ab 06:30"})
    c2["transport"] = c2["transport"] + [{"vehicle": "Van 2", "driver": "Fritz Fahrer", "passengers": "Tom Zweit", "from": "Hotel", "t1": "06:00", "to": "Location 2nd UNIT", "t2": "06:20"},
                                         {"vehicle": "Van 3", "driver": "Fritz Fahrer", "passengers": "Tom Zweit, Robin Zweit", "from": "Hotel", "t1": "06:05", "to": "Treffpunkt Dorf", "t2": "06:25"}]
    crew = [{"dept": "Regie", "people": [{"name": "Alex Beispiel", "role": "1st AD", "phone": "+41 79 000 00 01", "email": "alex@example.ch"}]},
            {"dept": "Kamera", "people": [{"name": "Kim Muster", "role": "DoP", "phone": "+41 79 000 00 02", "email": "kim@example.ch"}]},
            {"dept": "Maske", "people": [{"name": "Mara Test", "role": "Make-up", "phone": "+41 79 000 00 03"}]},
            {"dept": "Kostüm", "people": [{"name": "Anna Probe", "role": "Kostüm", "phone": "+41 79 000 00 04"}]},
            {"dept": "Cast", "people": [{"name": "Max Muster", "role": "BEN"}, {"name": "Eva Probe", "role": "LIA"}]}]
    locs = [{"venue": s[1].title(), "address": s[2], "map": "https://maps.example/" + s[0], "sets": [{"name": s[1], "scenes": [str(10 * k + int(s[0])) for k in range(1, 5)]}]} for s in sets]
    places = [{"cat": "Spital", "items": [{"name": "Spital Visp", "address": "Pflanzettastrasse 8, 3930 Visp", "phone": "+41 27 000 00 00"}]}]
    meta = {"sources": [{"kind": "schedule", "name": "Drehplan.pdf", "modified": iso(day(-10)) + "T08:00:00Z"}], "reports": [], "repFolders": ["DIT", "Sound", "Production report"],
            "sides": [], "ra": [], "setfp": []}
    return {"meta": meta, "days": days, "dispos": dispos, "crew": crew, "locations": locs, "places": places, "prepro": []}


def enc_file(p, obj, key):
    pt = json.dumps(obj, ensure_ascii=False).encode(); iv = secrets.token_bytes(12)
    json.dump({"v": 2, "stamp": secrets.token_hex(8), "iv": base64.b64encode(iv).decode(), "ct": base64.b64encode(AESGCM(key).encrypt(iv, pt, None)).decode()}, open(p, "w"))


def build(out, today=None, key_b64=None):
    out = pathlib.Path(out)
    if out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True)
    for f in ROOT.iterdir():
        if f.name in SKIP or f.name.startswith("."): continue
        (shutil.copytree if f.is_dir() else shutil.copy2)(f, out / f.name)
    key_b64 = key_b64 or base64.b64encode(b"synthetic-test-key-0123456789abc"[:32]).decode()   # fixed: same pictures every run
    key = base64.b64decode(key_b64)
    enc_file(out / "data.enc.json", data(today), key)
    enc_file(out / "media.enc.json", {"bm": []}, key)
    return key_b64


if __name__ == "__main__":
    print(build(sys.argv[1]))
