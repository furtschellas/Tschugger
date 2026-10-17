#!/usr/bin/env python3
"""Bildschirmfotos aller Seiten (Handy/Desktop, dunkel/hell) für einen Vorher-nachher-Vergleich bei Umbauten am Design.

  python3 tests/shots.py OUTDIR            Fotos machen
  python3 tests/shots.py --diff A B        zwei Ordner vergleichen (Anzahl abweichender Pixel je Bild)
Die Fotos enthalten Crew-Daten: nur lokal verwenden, nie ins Repository legen.
"""
import asyncio, json, os, subprocess, sys, time, pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import smoke  # noqa: E402

PAGES = ["today", "plan", "dispo", "loc", "crew", "script", "info", "my", "acct:pro", "acct:note", "acct:app", "admin:users", "admin:roles", "admin:set", "admin:log", "bcast"]


async def shoot(out):
    from playwright.async_api import async_playwright
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    port = smoke.free_port()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(smoke.ROOT)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            for width in (390, 1280):
                for theme in ("dark", "light"):
                    b, pg, errs = await smoke.session(p, port, "owner", width=width)
                    E = pg.evaluate
                    # fixed clock-independent state: no animations, fixed theme
                    await E("document.documentElement.dataset.theme='%s';try{setTheme('%s')}catch(_){}" % (theme, theme))
                    await pg.add_style_tag(content="*{transition:none!important;animation:none!important;caret-color:transparent!important}")
                    for page in PAGES:
                        tab, _, sub = page.partition(":")
                        js = "S.tab='%s';" % tab
                        if tab == "acct" and sub: js += "ACSUB='%s';" % sub
                        if tab == "admin" and sub: js += "ADM.sub='%s';" % sub
                        await E(js + "render();window.scrollTo(0,0)"); await pg.wait_for_timeout(700)
                        await pg.screenshot(path=str(out / f"{width}-{theme}-{page.replace(':', '_')}.png"), full_page=True)
                    await b.close()
    finally:
        srv.terminate()


def diff(a, b):
    from PIL import Image, ImageChops
    a, b = pathlib.Path(a), pathlib.Path(b); total = 0
    for f in sorted(a.glob("*.png")):
        g = b / f.name
        if not g.exists(): print("fehlt:", f.name); total += 1; continue
        x, y = Image.open(f).convert("RGB"), Image.open(g).convert("RGB")
        if x.size != y.size: print(f"{f.name}: andere Grösse {x.size} → {y.size}"); total += 1; continue
        n = sum(1 for px in ImageChops.difference(x, y).getdata() if max(px) > 24)
        if n: print(f"{f.name}: {n} Pixel anders"); total += 1
    print("gleich" if not total else f"{total} Bilder mit Unterschieden")


if __name__ == "__main__":
    if sys.argv[1] == "--diff": diff(sys.argv[2], sys.argv[3])
    else:
        smoke.KEY = smoke.crew_key(); asyncio.run(shoot(sys.argv[1]))
