#!/usr/bin/env python3
"""Funktionstests der App im Browser: tun die Knöpfe das Richtige? Suche, Drehplan, Meine Termine, Mein Konto,
Nachricht an alle, vCard, offline, verborgene Daten je Rolle und alle Sprachen. Gleiche Testumgebung wie smoke.py
(nachgebautes Firebase, echte verschlüsselte Daten, nichts verlässt den Rechner).

  python3 tests/func.py
"""
import asyncio, json, re, subprocess, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import smoke  # noqa: E402
from common import check, done  # noqa: E402

LANGS = ["de", "fr", "it", "en", "hi"]


async def search(pg, mode, q):
    E = pg.evaluate
    await E("S.gm=%s;openSearch();$('#gq').value=%s;renderSearch()" % (json.dumps(mode), json.dumps(q)))
    await pg.wait_for_timeout(200)
    return await E("[...document.querySelectorAll('#gres [data-sr]')].map(b=>b.innerText.replace(/\\s+/g,' '))")


async def owner_tests(p, port):
    b, pg, errs = await smoke.session(p, port, "owner")
    E = pg.evaluate
    pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))

    # ---------- search ----------
    sd = await E("""(()=>{const d=S.days.find(d=>d.kind==='shoot'&&(d.items||[]).some(i=>i.sc));const it=d.items.find(i=>i.sc);
                   return {day:d.id,label:d.label,sc:String(it.sc),loc:(S.locs.find(l=>l.title)||{}).title||''}})()""")
    hits = await search(pg, "sc", sd["sc"])
    check("Suche Szene: Treffer mit der Szenen-Nummer", any(sd["sc"] in h for h in hits), hits[:3])
    await E("document.querySelector('#gres [data-sr]').click()"); await pg.wait_for_timeout(300)
    st = await E("({tab:S.tab,day:S.day,open:!$('#search').hidden})")
    check("Suche Szene: Tippen öffnet den Drehtag im Drehplan", st["tab"] == "plan" and not st["open"] and st["day"], st)
    hits = await search(pg, "day", sd["label"])
    check("Suche Drehtag: Tag wird gefunden", any(sd["label"] in h for h in hits), hits[:3])
    await E("document.querySelector('#gres [data-sr]').click()"); await pg.wait_for_timeout(300)
    check("Suche Drehtag: Tippen öffnet genau diesen Tag", await E("S.tab==='plan'&&S.day===%s" % json.dumps(sd["day"])))
    if sd["loc"]:
        hits = await search(pg, "loc", sd["loc"])
        check("Suche Motiv: Location wird gefunden", any(sd["loc"].lower() in h.lower() for h in hits), hits[:3])
        await E("document.querySelector('#gres [data-sr]').click()"); await pg.wait_for_timeout(400)
        check("Suche Motiv: Tippen öffnet die Location-Karte", await E("S.tab==='loc'&&!!document.querySelector('#view .scd.open')"))
    hits = await search(pg, "all", "zzqxjv")
    check("Suche: Unsinn ergibt «Nichts gefunden»", not hits and "zzqxjv" in await E("$('#gres').innerText"))
    await E("closeSearch()")

    # ---------- shooting schedule ----------
    await E("S.tab='plan';S.day=%s;render()" % json.dumps(sd["day"])); await pg.wait_for_timeout(300)
    chips = await E("[...document.querySelectorAll('#view [data-day]')].map(x=>x.dataset.day)")
    other = next((c for c in chips if c != sd["day"] and not c.startswith("prep:")), None)
    if other:
        await E("document.querySelector('#view [data-day=\"%s\"]').click()" % other); await pg.wait_for_timeout(250)
        check("Drehplan: Tag wechseln per Tages-Chip", await E("S.day") == other)
        await E("document.querySelector('#view [data-day=\"%s\"]').click()" % sd["day"]); await pg.wait_for_timeout(250)
    scn_plan = await E("(()=>{const b=[...document.querySelectorAll('#view [data-scene]')].find(x=>x.offsetParent);return b?b.dataset.scene:''})()")
    await E("S.tab='loc';render()"); await pg.wait_for_timeout(300)   # cards that open and close: Locations
    k = await E("(document.querySelector('#view [data-sckey]')||{}).dataset?.sckey||''")
    if k:
        await pg.click('#view [data-sckey="%s"]' % k); await pg.wait_for_timeout(150)
        a1 = await E("document.querySelector('#view [data-sckey=\"%s\"]').closest('.scd').classList.contains('open')" % k)
        await pg.click('#view [data-sckey="%s"]' % k); await pg.wait_for_timeout(150)
        a2 = await E("document.querySelector('#view [data-sckey=\"%s\"]').closest('.scd').classList.contains('open')" % k)
        check("Locations: Karte auf- und zuklappen", a1 != a2, [a1, a2])
    if await E("!!document.getElementById('scall')"):
        await E("document.getElementById('scall').click()"); await pg.wait_for_timeout(150)
        check("Locations: «alle aufklappen» öffnet alle Karten", await E("[...document.querySelectorAll('#view [data-sckey]')].every(b=>b.getAttribute('aria-expanded')==='true')"))
    await E("S.tab='plan';S.day=%s;render()" % json.dumps(sd["day"])); await pg.wait_for_timeout(300)
    scn = scn_plan
    check("Drehplan: Script-Knopf vorhanden", bool(scn))
    if scn:
        await E("[...document.querySelectorAll('#view [data-scene]')].find(x=>x.offsetParent).click()")
        await pg.wait_for_timeout(2500)
        txt = await E("(()=>{const s=document.querySelector('.scrn');return s&&!s.hidden?s.innerText:''})()")
        check("Drehplan: Script-Knopf öffnet das Drehbuch bei dieser Szene", bool(txt) and scn.split("/")[0].strip().lower() in txt.lower() and "nicht geladen" not in txt, (scn, txt[:80]))
        await E("const x=document.querySelector('[data-scnclose]');if(x)x.click()")

    # ---------- my appointments ----------
    r = await E("""(()=>{const me={name:'Stefan Künzler',email:'',k:nmk('Stefan Künzler')};const pp=[];
                  return [iAmIn(['Stefan Künzler (online tbc)'],me,pp),iAmIn(['STEFAN KÜNZLER tba'],me,pp),iAmIn(['Stefan Muster'],me,pp)]})()""")
    check("Meine Termine: Name mit Zusatz «(online tbc)» oder «tba» wird erkannt", r[:2] == [True, True], r)
    check("Meine Termine: anderer Name wird nicht erkannt", r[2] is False, r)
    bell = await E("""(()=>{const c=pushCfg();c.on=true;c.types.my=true;pushSave(c);const d=new Date(Date.now()+864e5).toISOString().slice(0,10);
                      const h=window.pushBell({date:d,t:'08:00',n:'Testtermin'});if(!h)return null;const w=document.createElement('div');w.id='bt';w.innerHTML=h;document.body.appendChild(w);return w.firstChild.dataset.pushev})()""")
    if bell is None:
        check("Meine Termine: Glocke vorhanden", await E("!pushOK()"), "Push wird hier nicht unterstützt")
    else:
        await E("document.querySelector('#bt [data-pushev]').click()"); await pg.wait_for_timeout(150)
        check("Meine Termine: Glocke schaltet den Termin aus", await E("!!pushCfg().off[%s]" % json.dumps(bell)))
        await E("document.getElementById('bt')&&document.getElementById('bt').remove()")

    # ---------- my account: saved and still there after reloading ----------
    await E("S.tab='acct';ACSUB='pro';render()"); await pg.wait_for_timeout(500)
    if await E("!!document.querySelector('form[data-af=\"pf\"]')"):
        await E("""(()=>{const f=document.querySelector('form[data-af="pf"]');f.ph.value='+41 79 123 45 67';const o=[...f.dt.options].map(o=>o.value).find(v=>v&&v!==f.dt.value);if(o)f.dt.value=o;window.__dt=f.dt.value;
                   f.querySelectorAll('input[required],select[required]').forEach(el=>{if(!String(el.value||'').trim())el.value=el.type==='email'?'a@b.ch':el.tagName==='SELECT'?([...el.options].map(o=>o.value).find(Boolean)||''):'Test'})})()""")
        await E("document.querySelector('form[data-af=\"pf\"] button[type=submit]').click()"); await pg.wait_for_timeout(800)
        msg = await E("(document.querySelector('form[data-af=\"pf\"] .amsg')||{}).textContent||''")
        check("Mein Konto: Profil speichern", "gespeichert" in msg.lower(), msg)
    await E("S.tab='acct';ACSUB='app';render()"); await pg.wait_for_timeout(300)
    await E("(()=>{const c=pushCfg();c.news.plan=false;c.news.cs=true;pushSave(c)})()")
    dt = await E("window.__dt||''")
    await pg.reload(); await pg.wait_for_timeout(3500)
    await E("document.querySelectorAll('.a2hs,#tour').forEach(x=>x.remove());if(window.TOUR)TOUR.el=null")
    after = await E("({ph:(MEMBER||{}).phone,dt:(MEMBER||{}).diet,news:pushCfg().news})")
    check("Mein Konto: Profil nach dem Neuladen noch da", after["ph"] == "+41 79 123 45 67" and (not dt or after["dt"] == dt), after)
    check("Mein Konto: Push-Schalter nach dem Neuladen noch da", after["news"].get("plan") is False and after["news"].get("cs") is True, after["news"])

    # ---------- message to everybody ----------
    await E("BC.mode='sel';BC.sel={roles:['crew'],depts:[]};S.tab='bcast';render()"); await pg.wait_for_timeout(800)
    await E("""(()=>{const f=document.querySelector('form[data-bc]');f.bt.value='Testtitel';f.bb.value='Testtext';f.bp.checked=true;if(f.bw)f.bw.checked=false;if(f.bs)f.bs.checked=false;if(f.be)f.be.checked=false})()""")
    n0 = await E("Object.keys(window.__db).filter(k=>k.startsWith('broadcasts/')).length")
    await E("document.querySelector('form[data-bc] button[type=submit]').click()"); await pg.wait_for_timeout(1500)
    bc = await E("""(async()=>{const ks=Object.keys(window.__db).filter(k=>k.startsWith('broadcasts/'));const d=window.__db[ks[ks.length-1]];const key=await getDataKey();
                   const raw=Uint8Array.from(atob(d.c),c=>c.charCodeAt(0));return {n:ks.length,plain:JSON.stringify(d).includes('Testtitel'),
                   b:JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12)},key,raw.slice(12))))}})()""")
    check("Nachricht an alle: gespeichert und verschlüsselt (Titel nicht lesbar)", bc["n"] == n0 + 1 and not bc["plain"], bc["n"])
    check("Nachricht an alle: nur an die gewählte Rolle", bc["b"].get("roles") == ["crew"] and bc["b"].get("title") == "Testtitel", bc["b"].get("roles"))
    await pg.wait_for_timeout(800)
    await E("BC.hist=null;render()"); await pg.wait_for_timeout(1200)
    n1 = await E("Object.keys(window.__db).filter(k=>k.startsWith('broadcasts/')).length")
    if await E("!!document.querySelector('[data-bcre]')"):
        await E("document.querySelector('[data-bcre]').click()"); await pg.wait_for_timeout(1500)
        check("Nachricht an alle: «Erneut senden» legt eine neue Nachricht an", await E("Object.keys(window.__db).filter(k=>k.startsWith('broadcasts/')).length") == n1 + 1)

    # ---------- own appointments ----------
    await E("S.tab='my';render()"); await pg.wait_for_timeout(800)
    check("Eigene Termine: Knopf «+ Termin» neben dem Titel", await E("!!document.querySelector('#view .myhead [data-oeadd]')"))
    await E("document.querySelector('#view [data-oeadd]').click()"); await pg.wait_for_timeout(800)
    await pg.fill("#oedlg [name=ti]", "Testprobe Funktion"); await pg.fill("#oedlg [name=t1]", "09:00")
    await pg.check("#oedlg input[name=oem][value=sel]"); await pg.check('#oedlg [data-oek="roles"][value="crew"]')
    await pg.click("#oedlg button[type=submit]"); await pg.wait_for_timeout(1500)
    ev = await E("""(async()=>{const ks=Object.keys(window.__db).filter(k=>k.startsWith('events/'));if(!ks.length)return null;const d=window.__db[ks[0]];const key=await getDataKey();
                   const raw=Uint8Array.from(atob(d.c),c=>c.charCodeAt(0));return {plain:JSON.stringify(d).includes('Testprobe'),by:d.by===ME.uid,
                   b:JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12)},key,raw.slice(12))))}})()""")
    check("Eigene Termine: gespeichert, verschlüsselt, mit Empfängern", bool(ev) and not ev["plain"] and ev["by"] and ev["b"].get("roles") == ["crew"], ev and ev.get("b", {}).get("roles"))
    check("Eigene Termine: erscheint in «Meine Termine» mit Stift", "Testprobe Funktion" in await E("document.getElementById('view').innerText") and await E("!!document.querySelector('#view [data-oeed]')"))
    d = await E("""(()=>{const me={name:'X',email:'',k:'x',src:''};const n0=myEvents(me).length,o=window.ownEvents;
                  window.ownEvents=()=>[{date:'2099-01-01',t:'09:00',n:'Probe Kostüm',src:'a'},{date:'2099-01-01',t:'9:00',n:'Probe Kostüm!',src:'b'},{date:'2099-01-01',t:'10:00',n:'Probe Kostüm',src:'c'}];
                  const n=myEvents(me).length-n0;window.ownEvents=o;return n})()""")
    check("Eigene Termine: doppelte Termine nur einmal", d == 2, d)

    # ---------- vCard ----------
    await E("S.tab='crew';S.q='';render()"); await pg.wait_for_timeout(500)
    who = await E("(()=>{const b=[...document.querySelectorAll('#view [data-vc]')].find(x=>x.offsetParent);if(!b)return null;const [gi,pi]=b.dataset.vc.split(':').map(Number);const p=S.crew[gi].people[pi];return {name:p.name,phone:!!p.phone}})()")
    if who:
        async with pg.expect_download(timeout=5000) as dl:
            await pg.locator("#view [data-vc]:visible").first.click()
        v = open(await (await dl.value).path(), encoding="utf-8").read()
        check("vCard: Datei mit Name und Telefon", v.startswith("BEGIN:VCARD") and "FN:" + who["name"].replace(",", "\\,") in v and ("TEL" in v) == who["phone"] and v.rstrip().endswith("END:VCARD"))
    await b.close()
    return errs


async def offline_test(p, port):
    b, pg, errs = await smoke.session(p, port, "crew", extra="if(sessionStorage.getItem('offl')){Object.defineProperty(Navigator.prototype,'onLine',{get:()=>false})}")
    E = pg.evaluate
    days = await E("S.days.length")
    await E("sessionStorage.setItem('offl','1')")
    await pg.route("**/data.enc.json*", lambda r: r.abort()); await pg.route("**/script.enc.json*", lambda r: r.abort())
    await pg.reload(); await pg.wait_for_timeout(4500)
    await E("document.querySelectorAll('.a2hs,#tour').forEach(x=>x.remove());if(window.TOUR)TOUR.el=null")
    st = await E("({on:navigator.onLine,days:(S.days||[]).length,me:!!ME})")
    check("Offline: zuletzt geladene Daten bleiben sichtbar", not st["on"] and st["days"] == days and days > 0, st)
    await E("S.tab='plan';S.day=(S.days.find(d=>d.kind==='shoot')||{}).id;render()"); await pg.wait_for_timeout(300)
    check("Offline: Drehplan zeigt Szenen", await E("(()=>{const d=S.days.find(d=>d.id===S.day)||{};const sc=((d.items||[]).find(i=>i.sc)||{}).sc;return !!sc&&document.getElementById('view').innerText.includes(String(sc).split(/[ ,\\/]/)[0])})()"))
    await E("S.tab='today';render()"); await pg.wait_for_timeout(300)
    check("Offline: Hinweis «offline» auf Today", "offline" in (await E("document.getElementById('view').innerText")).lower())
    await b.close()


async def hidden_data(p, port):
    """C11: what a role may not see is really not there – also not in the search or the vCard"""
    phones = None
    for who in ("crew", "catering", "norole"):
        b, pg, errs = await smoke.session(p, port, who)
        E = pg.evaluate
        perms = await E("({phone:vok('phone'),email:vok('email'),crew:vok('crew'),food:can('crew.food'),bday:can('crew.bday'),adm:isAdmin()})")
        if phones is None:
            phones = await E("S.crew.flatMap(g=>(g.people||[]).map(p=>String(p.phone||'').replace(/\\D/g,'')).filter(x=>x.length>=8)).slice(0,30)")
        texts = []
        for t in await E("tabsOn()"):
            await E(f"S.tab='{t}';render()"); await pg.wait_for_timeout(200)
            texts.append(await E("document.getElementById('view').innerText+' '+[...document.querySelectorAll('#view a[href^=\"tel:\"],#view a[href^=\"mailto:\"]')].map(a=>a.href).join(' ')"))
        await E("S.gm='all';openSearch();$('#gq').value='a';renderSearch()"); await pg.wait_for_timeout(200)
        texts.append(await E("$('#gres').innerText")); await E("closeSearch()")
        toks = {re.sub(r"\D", "", t)[-9:] for t in re.findall(r"\+?\d[\d .\-/]{7,}\d", " ".join(texts))}
        shown = [x for x in phones if x[-9:] in toks]
        if not perms["phone"]:
            check(f"{who}: keine Telefonnummern (Seiten und Suche)", not shown and "tel:" not in " ".join(texts), len(shown))
            vc = await E("typeof allVCards==='function'&&S.crew.length?vCardText(S.crew[0].people[0],S.crew[0]):''")
            check(f"{who}: vCard ohne Telefon", "TEL" not in vc)
        else:
            check(f"{who}: Telefonnummern sichtbar (Recht vorhanden)", bool(shown) or not phones)
        if not perms["email"]:
            check(f"{who}: keine E-Mail-Adressen der Crew", "mailto:" not in " ".join(texts))
        vis = await E("(()=>{const me={name:'Z',email:ME.email,k:'z',src:''};return [ownFor({roles:['crew']},me),ownFor({roles:null,depts:null,people:null},me),ownFor({people:[{k:'nobody'}]},me)]})()")
        check(f"{who}: eigener Termin nur für gewählte Rolle sichtbar", vis == [who == "crew", True, False], vis)
        await E("S.tab='crew';render()"); await pg.wait_for_timeout(300)
        adm = await E("({food:!!document.querySelector('#view [data-admv=\"food\"],#view .efood-tog'),bday:!!document.querySelector('#view [data-admv=\"bday\"]'),btn:!!(document.getElementById('admBtn')&&!document.getElementById('admBtn').hidden)})")
        check(f"{who}: Catering-Zahlen nur mit Recht", adm["food"] == perms["food"], adm)
        check(f"{who}: App-Verwaltung nur für Admins", adm["btn"] == perms["adm"], adm)
        await b.close()


async def languages(p, port):
    """D: every language, every page – no script errors, no German left where a translation is missing"""
    b, pg, errs = await smoke.session(p, port, "owner")
    E = pg.evaluate
    bad = []
    for lang in LANGS:
        await E(f"LANG='{lang}';applyStatic();render()"); await pg.wait_for_timeout(200)
        for t in await E("tabsOn()"):
            await E(f"S.tab='{t}';render()"); await pg.wait_for_timeout(150)
            if "konnte nicht angezeigt" in await E("document.getElementById('view').innerText"): bad.append(f"{lang}:{t}")
    check("Alle 5 Sprachen: alle Seiten ohne Anzeigefehler", not bad, bad)
    check("Alle 5 Sprachen: keine Skriptfehler", not errs, errs[:3])
    keys = set()   # every L("…") in the code must have fr, it, en (hi falls back to en)
    for f in [smoke.ROOT / "tools" / "app.html"] + sorted((smoke.ROOT / "tools" / "boot").glob("*.js")):
        for m in re.finditer(r'\bL\("((?:[^"\\]|\\.)+)"\)', f.read_text()):
            try: keys.add(json.loads('"' + m.group(1) + '"'))
            except Exception: pass
    missing = await E("ks=>{const o={};for(const l of ['fr','it','en']){const m=ks.filter(k=>!(I18N[k]&&I18N[k][l]));if(m.length)o[l]=m}return o}", sorted(keys))
    if missing: print("  fehlende Übersetzungen:", json.dumps(missing, ensure_ascii=False)[:3000])
    check(f"Alle Sprachen: alle {len(keys)} Texte übersetzt (FR, IT, EN)", not missing, {k: len(v) for k, v in missing.items()})
    await E("LANG='de';applyStatic();render()")
    await b.close()


async def main():
    from playwright.async_api import async_playwright
    port = smoke.free_port()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(smoke.ROOT)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    smoke.wait_port(port)
    try:
        async with async_playwright() as p:
            for name, fn in (("Funktionen", owner_tests), ("Offline", offline_test), ("Berechtigungen", hidden_data), ("Sprachen", languages)):
                try:
                    errs = await fn(p, port)
                    if name == "Funktionen": check("Funktionstests ohne Skriptfehler", not errs, (errs or [])[:3])
                except Exception as e:
                    check(f"{name}: Test lief durch", False, f"{type(e).__name__}: {str(e)[:150]}")
    finally:
        srv.terminate()
    return done("Funktionen")


if __name__ == "__main__":
    smoke.KEY = smoke.crew_key()
    sys.exit(asyncio.run(main()))
