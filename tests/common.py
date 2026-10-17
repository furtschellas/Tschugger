"""Gemeinsam für alle Testteile: check() schreibt ✓/✗ und merkt sich nur den Namen der Prüfung (nie Details –
die können Crew-Daten enthalten). Mit TESTS_OUT=<datei> schreibt done() die Resultate für das Log in der App."""
import json, os, time

RESULTS, FAILS = [], []


def check(name, ok, info=""):
    RESULTS.append({"n": name, "ok": bool(ok)})
    print(("✓ " if ok else "✗ ") + name + ("" if ok or not info else "  – " + str(info)[:160]), flush=True)
    if not ok: FAILS.append(name)
    return bool(ok)


def done(suite):
    print(f"\n{suite}: {'ALLES OK' if not FAILS else str(len(FAILS)) + ' FEHLER'}", flush=True)
    out = os.environ.get("TESTS_OUT")
    if out:
        json.dump({"suite": suite, "at": int(time.time() * 1000), "ok": not FAILS, "n": len(RESULTS), "fail": len(FAILS), "checks": RESULTS},
                  open(out, "w"), ensure_ascii=False)
    return 1 if FAILS else 0
