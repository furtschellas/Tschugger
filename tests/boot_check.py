"""Startet die gebaute index.html ohne Netz und meldet jeden JavaScript-Fehler beim Laden (z. B. Syntaxfehler).
Ein solcher Fehler hält die ganze App an – dann wird nichts veröffentlicht."""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        await pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith("file:") else r.abort())
        await pg.goto((ROOT / "index.html").as_uri()); await pg.wait_for_timeout(2500)
        ok = await pg.evaluate("typeof render==='function'&&typeof VIEWS==='object'")
        # every part in its own script: a broken part must not stop the others
        n = await pg.evaluate("document.querySelectorAll('script').length")
        if n < 15: errs.append("App-Teile nicht getrennt (nur %d Skripte)" % n)
        sv = await pg.evaluate("(document.getElementById('spv')||{}).innerHTML||''")
        if "MrK" not in sv or "App " not in sv or "<br>©" not in sv: errs.append("Startbildschirm ohne Version/©: " + sv[:80])
        await pg.wait_for_timeout(8600)   # the start screen never stays: at the latest after 8 s it is gone
        ok = ok and await pg.evaluate("!document.getElementById('splash')")
        await b.close()
    if errs or not ok:
        print("✗ App startet nicht:", errs or "render/VIEWS fehlen"); return 1
    print("✓ App startet ohne Fehler"); return 0

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
