#!/usr/bin/env python3
"""Fasst die Resultate der Testteile (je eine JSON-Datei von tests/common.py bzw. rules.test.mjs) zu tests.json zusammen –
die Datei, die App-Verwaltung → Log anzeigt. Fehlt ein Teil (abgebrochen), zählt er als fehlgeschlagen.
  python3 tests/merge_results.py OUT name=datei …"""
import json, os, sys, time

out, parts = sys.argv[1], [a.split("=", 1) for a in sys.argv[2:]]
suites = []
for name, f in parts:
    try: d = json.load(open(f))
    except Exception: d = {"ok": False, "crash": True, "n": 0, "fail": 0, "checks": []}
    d["suite"] = name; suites.append(d)
res = {"at": int(time.time() * 1000), "sha": os.environ.get("GITHUB_SHA", "")[:7], "ok": all(s.get("ok") for s in suites),
       "crash": any(s.get("crash") for s in suites), "n": sum(s.get("n", 0) for s in suites), "fail": sum(s.get("fail", 0) for s in suites),
       "suites": [{"name": s["suite"], "ok": bool(s.get("ok")), "crash": bool(s.get("crash")), "n": s.get("n", 0), "fail": s.get("fail", 0), "checks": s.get("checks", [])} for s in suites]}
res["checks"] = [c for s in res["suites"] for c in s["checks"]]
json.dump(res, open(out, "w"), ensure_ascii=False)
print(f"{res['n']} Prüfungen, {res['fail']} fehlgeschlagen" + (" (ein Teil abgebrochen)" if res["crash"] else ""))
