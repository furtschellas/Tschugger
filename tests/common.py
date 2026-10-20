"""Gemeinsam für alle Testteile: check() schreibt ✓/✗ und merkt sich nur den Namen der Prüfung (nie Details –
die können Crew-Daten enthalten). Mit TESTS_OUT=<datei> schreibt done() die Resultate für das Log in der App."""
import json, os, time

RESULTS, FAILS = [], []
GROUP = ""   # theme of the checks that follow (shown as a sub-part in the app)


def _numbers_only(x):
    """True when the detail holds only numbers, yes/no and keys – then it can be shown publicly"""
    if isinstance(x, bool) or x is None or isinstance(x, (int, float)): return True
    if isinstance(x, dict): return all(isinstance(k, str) and len(k) < 30 and _numbers_only(v) for k, v in x.items())
    if isinstance(x, (list, tuple)): return all(_numbers_only(v) for v in x)
    return False


def check(name, ok, info="", public=False):
    """public=True: the detail of a failed check contains no crew data (only numbers/flags) and is kept in the results"""
    r = {"n": name, "ok": bool(ok)}
    if GROUP: r["g"] = GROUP
    if not ok and info not in ("", None) and not ("lief durch" in name or public) and _numbers_only(info):
        r["e"] = json.dumps(info, ensure_ascii=False)[:160]   # only numbers/yes-no: never crew data
    elif not ok and info and ("lief durch" in name or public):   # a part that crashed: the reason (without addresses or numbers) helps to fix it
        import re as _re
        r["e"] = _re.sub(r"[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d ]{6,}", "…", str(info))[:160]
    RESULTS.append(r)
    # the public log only gets the name (and the cleaned detail above) – never raw details, they can contain crew data
    print(("✓ " if ok else "✗ ") + name + ("" if ok or "e" not in r else "  – " + r["e"]), flush=True)
    if not ok:
        FAILS.append(name)
        if len(FAILS) <= 8: print("::error title=Test::" + name.replace("\n", " ")[:200] + ("" if "e" not in r else " – " + r["e"].replace("\n", " ")), flush=True)
    return bool(ok)


def warn(name, info=""):
    """not an error (the documents themselves differ): shown with ⚠ in the log, never blocks publishing; info = numbers only"""
    r = {"n": name, "ok": True, "w": 1}
    if GROUP: r["g"] = GROUP
    if info not in ("", None): r["e"] = str(info)[:160]
    RESULTS.append(r)
    print("⚠ " + name + ("" if "e" not in r else "  – " + r["e"]), flush=True)
    print("::warning title=Abgleich::" + name.replace("\n", " ")[:200] + ("" if "e" not in r else " – " + r["e"]), flush=True)
    return True


def done(suite):
    print(f"\n{suite}: {'ALLES OK' if not FAILS else str(len(FAILS)) + ' FEHLER'}", flush=True)
    out = os.environ.get("TESTS_OUT")
    if out:
        json.dump({"suite": suite, "at": int(time.time() * 1000), "ok": not FAILS, "n": len(RESULTS), "fail": len(FAILS), "checks": RESULTS},
                  open(out, "w"), ensure_ascii=False)
    return 1 if FAILS else 0
