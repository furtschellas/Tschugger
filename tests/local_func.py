#!/usr/bin/env python3
"""Lokaler Testlauf der Funktionstests (tests/func.py, Teil «Funktionen») mit erfundenen Daten – ohne Crew-Schlüssel.

In GitHub laufen die Funktionstests mit den echten (verschlüsselten) Daten. Lokal gibt es diese nicht: tests/synth_site.py baut eine
Seite mit erfundenen Daten. Einige Prüfungen brauchen Daten, die es dort nicht gibt (Drehbuch, Reports-Ordner, echte Tagesnamen …) –
sie stehen unten in SYNTH_GAPS und werden als «nur mit echten Daten» gemeldet, nicht als Fehler. Alles andere, was fehlschlägt, ist ein
echter Fehler (Exit-Code 1).

    python tests/local_func.py
"""
import asyncio, pathlib, subprocess, sys, tempfile

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import common, smoke, synth_site, func  # noqa: E402

# checks that need the real data (not in the invented site) – and the follow-ups of a part that is repeated after such a check
SYNTH_GAPS = (
    "Suche Drehtag", "Suche: Teil lief durch", "Drehplan: Teil lief durch", "Drehbuch-Suche", "Drehbuch-Fenster", "Drehbuch: Szenen-Details",
    "Reports: ein Recht", "Szenen-Protokoll: pro Unit", "App-Verwaltung (Access, Tour, Dokumente, Log/Tests): Teil lief durch",
    # repeated parts (a part with a failed check runs once more at the end): their second run starts from a used page
    "Stabilität: Fehler werden ohne Daten einmal", "Zurück-Knopf",
)


def main():
    site = pathlib.Path(tempfile.mkdtemp()) / "site"
    smoke.KEY = synth_site.build(site, None); smoke.AK = {}; smoke.ROOT = site

    async def run():
        from playwright.async_api import async_playwright
        port = smoke.free_port()
        srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(site)],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        smoke.wait_port(port)
        try:
            async with async_playwright() as p:
                await func.owner_tests(p, port)
        finally:
            srv.terminate()
    asyncio.run(run())
    bad = [r for r in common.RESULTS if not r.get("ok")] if hasattr(common, "RESULTS") else []
    real = [r for r in bad if not any(str(r.get("n", "")).startswith(g) for g in SYNTH_GAPS)]
    gaps = len(bad) - len(real)
    print(f"\nLokal: {len(bad)} fehlgeschlagen – davon {gaps} nur mit echten Daten prüfbar, {len(real)} echte Fehler")
    for r in real: print("  ✗ " + str(r.get("n")))
    return 1 if real else 0


if __name__ == "__main__":
    sys.exit(main())
