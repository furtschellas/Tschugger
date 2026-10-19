"""Startet die gebaute index.html ohne Netz und meldet jeden JavaScript-Fehler beim Laden (z. B. Syntaxfehler).
Ein solcher Fehler hält die ganze App an – dann wird nichts veröffentlicht."""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


async def spv_text(pg):
    """text below the logo while the start screen is there (read as soon as it exists)"""
    for _ in range(40):
        try:
            h = await pg.evaluate("(()=>{const t=document.getElementById('spv');return t?t.innerHTML:(window.__SPV||null)})()")
            if h is not None:
                await pg.wait_for_timeout(150)
                return await pg.evaluate("(document.getElementById('spv')||{}).innerHTML||window.__SPV||''")
        except Exception:
            pass
        await pg.wait_for_timeout(50)
    return ""


async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        await pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith("file:") else r.abort())
        # the test sets «last seen» before the page's own scripts run (a reload itself counts as «seen just now»)
        await pg.add_init_script("try{const v=sessionStorage.getItem('bcLV');if(v)localStorage.setItem('lastVis',v)}catch(e){}")
        sp = "(()=>{const t=document.getElementById('spv');if(!t)return {h:'',vis:0};const r=t.getBoundingClientRect(),c=getComputedStyle(t);const sp=document.getElementById('splash');return {h:t.innerHTML,vis:!sp||!sp.classList.contains('vis')||(r.height>10&&c.visibility!=='hidden'&&+c.opacity>0)?1:0}})()"
        await pg.goto((ROOT / "index.html").as_uri()); await pg.wait_for_timeout(300)
        first = await pg.evaluate(sp)
        if not first["vis"]: errs.append("Startbildschirm: Versionen nicht sichtbar")
        if "MrK" not in first["h"] or "App " not in first["h"] or "<br>Copyright <b>MrK</b> 2026" not in first["h"]: errs.append("Startbildschirm ohne Version/Copyright: " + first["h"][:80])
        await pg.wait_for_timeout(2200)
        ok = await pg.evaluate("typeof render==='function'&&typeof VIEWS==='object'")
        # every part in its own script: a broken part must not stop the others
        n = await pg.evaluate("document.querySelectorAll('script').length")
        if n < 15: errs.append("App-Teile nicht getrennt (nur %d Skripte)" % n)
        # reopened after more than 30 minutes (the phone had closed the app – technically a reload): logo with versions
        # the old page must not write «seen just now» while it unloads (on a phone there is no old page after a restart)
        await pg.evaluate("sessionStorage.setItem('bcLV',String(Date.now()-40*60e3));Storage.prototype.setItem=function(){}")
        await pg.reload(wait_until="commit")
        if "MrK" not in await spv_text(pg): errs.append("Startbildschirm nach langer Pause ohne Versionen")
        # reloaded while using the app: only the logo
        await pg.evaluate("sessionStorage.setItem('bcLV',String(Date.now()));Storage.prototype.setItem=function(){}")
        await pg.reload(wait_until="commit")
        if "MrK" in await spv_text(pg): errs.append("Startbildschirm beim Neuladen mit Text")
        if not await pg.evaluate("(()=>{const s=document.getElementById('splash');return !!s&&getComputedStyle(s).display!=='none'})()"): errs.append("Neuladen: Logo mit Ladestatus fehlt")
        await pg.wait_for_timeout(8600)   # the start screen never stays: at the latest after 8 s it is gone
        ok = ok and await pg.evaluate("!document.getElementById('splash')")
        await b.close()
    if errs or not ok:
        print("✗ App startet nicht:", errs or "render/VIEWS fehlen"); return 1
    print("✓ App startet ohne Fehler"); return 0

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
