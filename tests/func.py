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
import common  # noqa: E402
from common import check, done  # noqa: E402

LANGS = ["de", "fr", "it", "en", "hi"]


async def search(pg, mode, q):
    E = pg.evaluate
    await E("S.gm=%s;openSearch();$('#gq').value=%s;renderSearch()" % (json.dumps(mode), json.dumps(q)))
    await pg.wait_for_timeout(200)
    return await E("[...document.querySelectorAll('#gres [data-sr]')].map(b=>b.innerText.replace(/\\s+/g,' '))")


async def run_part(name, part, pg):
    """one part of the owner tests: an error stops only this part; the page is put back to a known state for the next one"""
    common.GROUP = name
    try:
        await part()
        check(f"{name}: Teil lief durch", True)
    except Exception as e:
        check(f"{name}: Teil lief durch", False, str(e).split("\n")[0][:150])
    try:
        await pg.evaluate("document.querySelectorAll('.a2hs,#tour,#routepop,#bcview,#scrnews').forEach(x=>x.remove());S.tab='today';render()")
    except Exception:
        pass
    common.GROUP = ""


async def owner_tests(p, port):
    b, pg, errs = await smoke.session(p, port, "owner")
    E = pg.evaluate
    pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))

    # the scene used by search and schedule
    sd = await E("""(()=>{const d=S.days.find(d=>d.kind==='shoot'&&(d.items||[]).some(i=>i.sc));const it=d.items.find(i=>i.sc);
                   return {day:d.id,label:d.label,sc:String(it.sc),loc:(S.locs.find(l=>l.title)||{}).title||''}})()""")

    async def _p0():   # Suche
        # ---------- search ----------
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


    async def _p1():   # Drehplan
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


    async def _p2():   # Meine Termine und Konto
        # ---------- my appointments ----------
        r = await E("""(()=>{const me={name:'Anna Muster',email:'',k:nmk('Anna Muster')};const pp=[];
                      return [iAmIn(['Anna Muster (online tbc)'],me,pp),iAmIn(['ANNA MUSTER tba'],me,pp),iAmIn(['Otto Beispiel'],me,pp)]})()""")
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


    async def _p3():   # Push an alle
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


    async def _p4():   # Eigene Termine und Google Kalender
        # ---------- own appointments ----------
        await E("S.tab='my';render()"); await pg.wait_for_timeout(800)
        check("Eigene Termine: Knopf «+ Termin» neben dem Titel", await E("!!document.querySelector('#view .myhead [data-oeadd]')"))
        await E("document.querySelector('#view [data-oeadd]').click()"); await pg.wait_for_timeout(800)
        await pg.fill("#oedlg [name=ti]", "Testprobe Funktion"); await pg.fill("#oedlg [name=t1]", "09:00")
        await E("document.querySelector('#oedlg [name=da]').value=new Date(Date.now()+864e5).toISOString().slice(0,10)")   # tomorrow: today 09:00 is gone from «Meine Termine» after 14:00
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

        # dialog: the appointments already added below «Speichern», tap = change it
        await E("document.querySelector('#view [data-oeadd]').click()"); await pg.wait_for_timeout(800)
        li = await E("(()=>{const l=document.querySelector('#oedlg .oelist');return l?{n:l.querySelectorAll('[data-oego]').length,t:l.innerText,after:!!(document.querySelector('#oedlg form').compareDocumentPosition(l)&4)}:null})()")
        check("Termin hinzufügen: unter «Speichern» die hinzugefügten Termine mit Empfängern", bool(li) and li["n"] >= 1 and "Testprobe Funktion" in li["t"] and "Crew" in li["t"] and li["after"], li)
        await E("document.querySelector('#oedlg [data-oego]').click()"); await pg.wait_for_timeout(800)
        check("Termin hinzufügen: Tippen auf einen Termin öffnet ihn zum Ändern", await E("(document.querySelector('#oedlg [name=ti]')||{}).value") == "Testprobe Funktion")
        await E("document.getElementById('oedlg').remove()")

        # edit and delete with the pencil, long note with line breaks
        await E("document.querySelector('#view [data-oeed]').click()"); await pg.wait_for_timeout(800)
        check("Eigene Termine: Stift öffnet den Termin zum Bearbeiten", await E("(document.querySelector('#oedlg [name=ti]')||{}).value") == "Testprobe Funktion")
        long_note = "Zeile eins\n" + "x" * 1900
        await pg.fill("#oedlg [name=ti]", "Testprobe geändert"); await pg.fill("#oedlg [name=no]", long_note)
        await pg.click("#oedlg button[type=submit]"); await pg.wait_for_timeout(1500)
        txt = await E("document.getElementById('view').innerText")
        check("Eigene Termine: Änderung gespeichert", "Testprobe geändert" in txt and "Testprobe Funktion" not in txt)
        check("Eigene Termine: lange Notiz (2000 Zeichen) mit Zeilenumbruch", await E("(()=>{const n=[...document.querySelectorAll('#view .mci .ppx')].find(x=>x.textContent.startsWith('Zeile eins'));return !!n&&n.textContent.length>1900&&getComputedStyle(n).whiteSpace==='pre-line'})()"))

        # in the shooting schedule and the prep schedule of that day
        sh = await E("""(async()=>{const sd=S.days.find(d=>d.kind==='shoot'&&d.date>=todayISO());const pp=(S.prepro||[]).find(d=>d.date>=todayISO()&&d.off!==true&&(d.items||[]).some(i=>!/^(rest|ruhetag|frei|off|day off)$/i.test(String(i.n||'').trim()))&&!S.days.some(x=>x.kind==='shoot'&&x.date===d.date));
            const mk=async o=>{const {F,db}=await fb();await F.addDoc(F.collection(db,'events'),{c:await ownEnc(Object.assign({byEmail:lc(ME.email),byName:'Owner',roles:null,depts:null,people:null},o)),at:1,by:ME.uid})};
            if(sd)await mk({title:'Plantermin',date:sd.date,t:'07:15'});if(pp)await mk({title:'Preptermin',date:pp.date,t:'14:00'});await ownLoad(true);return {sd:sd&&sd.id,pp:pp&&pp.date}})()""")
        if sh["sd"]:
            await E("S.tab='plan';S.day=%s;render()" % json.dumps(sh["sd"])); await pg.wait_for_timeout(400)
            check("Eigene Termine: im Drehplan am Tag («Weitere Termine»)", "Plantermin" in await E("(document.querySelector('#view .oeday')||{}).innerText||''"))
        if sh["pp"]:
            await E("S.tab='plan';S.day='prep:%s';render()" % sh["pp"]); await pg.wait_for_timeout(400)
            check("Eigene Termine: in der Prep-Planung am Tag", "Preptermin" in await E("(document.querySelector('#view .oeday')||{}).innerText||''"))

        # a rest day (prep: only «Rest») with an own appointment can be opened and shows it
        rd = await E("""(async()=>{const r=(S.prepro||[]).find(d=>d.date>=todayISO()&&(d.items||[]).length&&d.items.every(i=>/^(rest|ruhetag|frei|off|day off)$/i.test(String(i.n||'').trim())));if(!r)return null;
            const {F,db}=await fb();await F.addDoc(F.collection(db,'events'),{c:await ownEnc({title:'Fondue essen',date:r.date,t:'19:00',byEmail:lc(ME.email),byName:'Owner',roles:null,depts:null,people:null}),at:1,by:ME.uid});await ownLoad(true);
            S.tab='plan';S.day='prep:'+r.date;render();const c=document.querySelector('#view [data-day="prep:'+r.date+'"]');return {date:r.date,chip:!!c&&!c.disabled,shown:((document.querySelector('#view .oeday')||{}).innerText||'').includes('Fondue essen')}})()""")
        if rd:
            check("Prep: Ruhetag mit eigenem Termin lässt sich öffnen und zeigt ihn", rd["chip"] and rd["shown"], rd)

        # Google Calendar: list from gcal/feed, take one over → event with gc, recipients chosen
        await E("""(async()=>{const d=new Date(Date.now()+2*864e5).toISOString().slice(0,10);window.__db['gcal/feed']={c:await ownEnc([{uid:'g1',title:'Kalendertermin',date:d,t:'10:00',end:'11:00',where:'Sion',note:''}]),at:Date.now()};
                    window.GCALON=true;S.tab='my';render()})()"""); await pg.wait_for_timeout(600)
        check("Google Kalender: Knopf in «Meine Termine»", await E("!!document.querySelector('#view [data-oegc]')"))
        await E("document.querySelector('#view [data-oegc]').click()"); await pg.wait_for_timeout(1500)
        check("Google Kalender: Termine zur Auswahl", "Kalendertermin" in await E("(document.getElementById('gcdlg')||{}).innerText||''"))
        await E("document.querySelector('#gcdlg [data-gcadd]').click()"); await pg.wait_for_timeout(800)
        check("Google Kalender: «Übernehmen» füllt den Termin vor", await E("(document.querySelector('#oedlg [name=ti]')||{}).value") == "Kalendertermin")
        await pg.check("#oedlg input[name=oem][value=sel]"); await pg.check('#oedlg [data-oek="roles"][value="crew"]')
        await pg.click("#oedlg button[type=submit]"); await pg.wait_for_timeout(1500)
        gc = await E("Object.values(window.__db).filter(v=>v&&v.gc==='g1').length")
        check("Google Kalender: übernommener Termin mit Kalender-ID gespeichert", gc == 1, gc)
        await E("document.querySelector('#view [data-oegc]').click()"); await pg.wait_for_timeout(1500)
        check("Google Kalender: übernommener Termin als «in der App» markiert", await E("!!document.querySelector('#gcdlg .gcrow.on [data-gced]')"))
        await E("const g=document.getElementById('gcdlg');if(g)g.remove()")

        # delete
        await E("S.tab='my';render()"); await pg.wait_for_timeout(400)
        await E("[...document.querySelectorAll('#view .mci')].find(m=>m.innerText.includes('Testprobe geändert')).querySelector('[data-oeed]').click()"); await pg.wait_for_timeout(800)
        await E("document.querySelector('#oedlg [data-oedel]').click()"); await pg.wait_for_timeout(1500)
        check("Eigene Termine: löschen", "Testprobe geändert" not in await E("document.getElementById('view').innerText"))

        # switched off in App-Verwaltung → no button, no appointments
        await E("window.OWNEV=false;render()"); await pg.wait_for_timeout(300)
        off = await E("({btn:!!document.querySelector('#view [data-oeadd]'),ev:document.getElementById('view').innerText.includes('Kalendertermin')})")
        check("Eigene Termine: ausgeschaltet → kein Knopf und keine eigenen Termine", not off["btn"] and not off["ev"], off)
        await E("window.OWNEV=true;render()")

        # recipients: person and department
        vis = await E("""(()=>{const me={name:'Anna Muster',email:'anna@x.ch',k:nmk('Anna Muster'),src:'Kamera'};
            return [ownFor({people:[{k:nmk('Anna Muster')}]},me),ownFor({people:[{email:'anna@x.ch'}]},me),ownFor({depts:['Kamera']},me),ownFor({depts:['Ton']},me),ownFor({people:[{k:'otto'}],depts:['Licht']},me)]})()""")
        check("Eigene Termine: Empfänger nach Person (Name oder E-Mail) und Abteilung", vis == [True, True, True, False, False], vis)


    async def _p5():   # Drehbuch-Version und Today
        # new script version: header (after the schedule version), Today (3 days, unread, opens the script), push setting
        await E("S.meta.scriptVersion='v13';S.meta.scriptChange={at:new Date().toISOString(),v:'v13',prev:'v12',scenes:['5','6','184CA'],log:'Sc5 deleted: Football\\nSc6 changed: Sweets\\nSc184CA added: Woman with dog'};localStorage.setItem('chgseen:v1','0');renderHeader();S.tab='today';render()"); await pg.wait_for_timeout(300)
        check("Kopf: Drehbuch-Version nach der Sched-Version", "Drehbuch v13" in await E("document.getElementById('stand').innerText"))
        check("Handy: Zeile über dem Titel («Dreh Wallis …») wieder sichtbar", await E("document.getElementById('sub').getBoundingClientRect().height>0"))
        td = await E("(()=>{const l=document.querySelector('#view .tchg [data-tscript]');return {t:l?l.textContent:'',dot:(document.querySelector('#view .tchg .chgdot')||{}).textContent||''}})()")
        check("Today: neue Drehbuch-Version unter «Änderungen» (mit vorheriger Version, als neu markiert)", "v13" in td["t"] and "v12" in td["t"] and "neu" in td["dot"], td)
        cg = await E("(()=>{const c=document.querySelector('#view .tchg');const d=c&&c.querySelector('details.tscrlog');return {sc:c?[...c.querySelectorAll('.tscrsc [data-scene]')].map(b=>b.dataset.scene):[],det:!!d,open:d?d.open:null,txt:d?d.textContent:'',rows:d?[...d.querySelectorAll('.clog li')].map(x=>x.querySelector('.clsc').textContent+'|'+((x.querySelector('.clk')||{}).className||'')):[]}})()")
        check("Today: Szenen aus dem Changelog bei der Drehbuch-Änderung (antippbar)", cg["sc"] == ["5", "6", "184CA"], cg)
        check("Today: ganzes Changelog zum Auf- und Zuklappen (zu Beginn zu)", cg["det"] and cg["open"] is False and "Woman with dog" in cg["txt"], cg)
        check("Changelog formatiert: eine Zeile pro Szene, Art markiert (gestrichen, geändert, neu)", cg["rows"] == ["Sc5|clk del", "Sc6|clk chg", "Sc184CA|clk add"], cg["rows"])
        dh = await E("(()=>{const h=document.querySelector('#view .tchg .chglist li.cdh');const i=document.querySelector('#view .tchg .chglist li.chgi');return {d:h?h.textContent:'',full:i?Math.round(i.getBoundingClientRect().width/i.parentElement.getBoundingClientRect().width*100):0}})()")
        check("Today-Änderungen: Datum als eigene Zeile «Sa, 17.10.», Änderung darunter über die ganze Breite", re.match(r"^\w{2}, \d\d\.\d\d\.$", dh["d"]) is not None and dh["full"] >= 95, dh)
        # one welcome message per new script version (with scenes and the changelog to open)
        await E("window.__scrNewsOff=false;document.querySelectorAll('#scrnews').forEach(x=>x.remove());localStorage.removeItem('scrv');maybeScriptNews()"); await pg.wait_for_timeout(300)
        sn = await E("(()=>{const d=document.getElementById('scrnews');return d?{t:d.innerText,sc:d.querySelectorAll('[data-scene]').length,log:!!d.querySelector('details.scrlog .clog'),open:d.querySelector('details.scrlog').open}:null})()")
        check("Neue Drehbuch-Version: Nachricht mit Version, Szenen und Changelog (zugeklappt)", bool(sn) and "v13" in sn["t"] and sn["sc"] >= 3 and sn["log"] and sn["open"] is False, sn)
        await E("const b=document.querySelector('#scrnews [data-scrn=\"ok\"]');if(b)b.click()"); await E("maybeScriptNews()"); await pg.wait_for_timeout(300)
        check("Neue Drehbuch-Version: Nachricht nur einmal", not await E("!!document.getElementById('scrnews')"))
        await E("S.meta.scriptChange={at:new Date().toISOString(),v:'v14',prev:'v13',scenes:['9']};maybeScriptNews()"); await pg.wait_for_timeout(300)
        check("Neue Drehbuch-Version: bei der nächsten Version wieder", await E("!!document.getElementById('scrnews')&&document.getElementById('scrnews').innerText.includes('v14')"))
        await E("document.querySelectorAll('#scrnews').forEach(x=>x.remove());S.meta.scriptChange={at:new Date().toISOString(),v:'v13',prev:'v12',scenes:['5','6','184CA'],log:'Sc5 deleted: Football'};localStorage.setItem('scrv','v13|'+S.meta.scriptChange.at);window.__scrNewsOff=true")
        hh = await E("""(()=>{const i=document.querySelector('#view .tchg .chglist li.chgi'),h=document.querySelector('#view .tchg .chglist li.cdh'),c=document.querySelector('#view .tchg');if(!i)return {w:innerWidth};const cs=getComputedStyle(i),cc=getComputedStyle(c);
          return {w:innerWidth,pad:parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom),fs:parseFloat(cs.fontSize),lh:parseFloat(cs.lineHeight),cdh:h?h.getBoundingClientRect().height:0,card:parseFloat(cc.paddingTop)}})()""")
        check("Handy: Änderungen kompakt (wenig Abstand, kleine Schrift, enge Zeilen, Datumszeile niedrig)", hh["w"] > 600 or (hh.get("pad", 99) <= 8 and hh.get("fs", 99) <= 13 and hh.get("lh", 99) <= 18 and hh.get("cdh", 99) <= 24 and hh.get("card", 99) <= 10), hh)
        await E("document.querySelector('#view [data-tscript]').click()"); await pg.wait_for_timeout(300)
        check("Today: Tippen auf die Drehbuch-Änderung öffnet das Drehbuch", await E("S.tab") == "script")
        await E("S.meta.scriptChange.at=new Date(Date.now()-4*864e5).toISOString();S.tab='today';render()"); await pg.wait_for_timeout(200)
        check("Today: Drehbuch-Änderung nach 3 Tagen nicht mehr angezeigt", not await E("!!document.querySelector('#view [data-tscript]')"))
        check("Push-Link «#go=script» wird erkannt", await E("(()=>{S.meta.scriptChange.at=new Date().toISOString();S.tab='plan';return pushGo('./#go=script:2026-10-17')})()")); await pg.wait_for_timeout(900)
        pj = await E("({tab:S.tab,chg:!!document.querySelector('#view .tchg [data-tscript]'),hl:!!document.querySelector('#view .tchg.tjump'),dlg:!!document.getElementById('scrnews')})")
        check("Push-Link «#go=script»: springt zur Änderungsanzeige in Today", pj["tab"] == "today" and pj["chg"] and pj["hl"], pj)
        await E("localStorage.setItem('today','1|chg');document.querySelectorAll('#scrnews').forEach(x=>x.remove());pushGo('./#go=script:2026-10-17')"); await pg.wait_for_timeout(900)
        check("Push-Link «#go=script» ohne Änderungsanzeige in Today: Nachricht zur Drehbuch-Version", await E("!!document.getElementById('scrnews')"))
        await E("document.querySelectorAll('#scrnews').forEach(x=>x.remove());localStorage.setItem('today','1');S.meta.scriptChange.at=new Date(Date.now()-4*864e5).toISOString()")
        await E("S.tab='acct';ACSUB='note';render()"); await pg.wait_for_timeout(300)
        check("Mein Konto → Push: Schalter «Neue Drehbuch-Versionen»", await E("!!document.querySelector('[data-pushnews=\"script\"]')"))
        await E("const c=pushCfg();c.news.script=false;pushSave(c)")
        check("Push: Drehbuch-Meldung abbestellbar (geht so ans Gerät)", await E("newsFor(pushCfg()).script===false&&newsFor(Object.assign(pushCfg(),{news:{script:true}})).script===true"))
        await E("const c=pushCfg();c.news.script=true;pushSave(c)")

        # route choice (Today → Anfahrt): two option rows, the hotel with its name below the title
        await E("""(()=>{const b=document.createElement('button');b.dataset.route=JSON.stringify({h:'https://www.google.com/maps/dir/?api=1&origin=Hotel',c:'https://www.google.com/maps/dir/?api=1',from:'Hotel Moxy Sion',to:'Sion'});document.body.appendChild(b);b.click();b.remove()})()""")
        await pg.wait_for_timeout(200)
        rp = await E("""(()=>{const o=[...document.querySelectorAll('#routepop .rtpill')];const r=o.map(a=>{const t=a.querySelector('b').getBoundingClientRect(),s=a.querySelector('small');return {t:a.textContent,gap:s?Math.round(s.getBoundingClientRect().top-t.bottom):0,h:Math.round(a.getBoundingClientRect().height)}});document.querySelectorAll('#routepop').forEach(x=>x.remove());return r})()""")
        check("Anfahrt: zwei runde Knöpfe, Hotelname direkt unter «Vom Hotel», gleich hoch", len(rp) == 2 and "Hotel Moxy Sion" in rp[0]["t"] and abs(rp[0]["gap"]) <= 8 and abs(rp[0]["h"] - rp[1]["h"]) <= 2, rp)
        check("Mein Konto → App: Titel «App-Icon und App installieren»", "App-Icon und App installieren" in await E("(()=>{S.tab='acct';ACSUB='app';render();return document.getElementById('view').innerText})()"))

        # Today → first location: the address opens the choice «Vom Hotel» / «Vom aktuellen Standort»
        fl = await E("(()=>{S.tab='today';render();const b=document.querySelector('#view .tloc [data-route]');if(!b)return null;b.click();const n=document.querySelectorAll('#routepop .rtpill').length;document.querySelectorAll('#routepop').forEach(x=>x.remove());return n})()")
        check("Today: Adresse der ersten Location öffnet die Auswahl (Hotel / Standort)", fl in (None, 2), fl, public=True)


    async def _p6():   # App allgemein (Knöpfe, Stabilität, App-Icon, Today-Teile)
        # every button that shows only a symbol has a tooltip with its function (all pages, header, dialogs)
        nt = await E("""(async()=>{const bad=new Set();const scan=()=>document.querySelectorAll('button,a[role="button"]').forEach(b=>{if(b.offsetParent===null)return;if((b.textContent||'').replace(/[\\s›‹×+↻✓✗⚠·]/g,'').length)return;if(!b.title)bad.add((b.className||b.id||b.tagName)+'');});
          for(const t of tabsOn().concat(['acct','admin','my'])){S.tab=t;render();await new Promise(r=>setTimeout(r,60));scan()}for(const k of ['users','roles','docs','set','log']){S.tab='admin';ADM.sub=k;render();await new Promise(r=>setTimeout(r,60));scan()}S.tab='today';render();return [...bad].slice(0,12)})()""")
        check("Alle Symbol-Knöpfe zeigen beim Darüberfahren ihre Funktion", nt == [], nt, public=True)

        # stability: errors are reported without data (once), the worker version is checked, unchanged data is not loaded again
        er = await E("""(async()=>{ERRN=0;ERRSENT.clear();localStorage.removeItem('errsent:v1');__ERRS.push({m:'boom at x@y.ch +41 79 123 45 67',f:'12-admin.js',l:7,t:Date.now()});
          await errReport();const a=Object.values(window.__db).filter(d=>d&&d.op==='error');const one=a.length;__ERRS.push({m:'boom at x@y.ch +41 79 123 45 67',f:'12-admin.js',l:7});await errReport();
          const s=(a[0]||{}).sum||'';return {one,again:Object.values(window.__db).filter(d=>d&&d.op==='error').length,clean:!/@|\\d{3} \\d{2}/.test(s),file:s.includes('12-admin.js')}})()""")
        check("Stabilität: Fehler werden ohne Daten einmal an die Owner gemeldet (Log)", er == {"one": 1, "again": 1, "clean": True, "file": True}, er, public=True)
        ww = await E("(()=>{WK.v='2000-01-01';WK.at=Date.now();S.tab='admin';ADM.sub='log';render();const w=!!document.querySelector('#view .wkwarn');WK.v=window.WORKERVER;render();const n=!document.querySelector('#view .wkwarn');return {warn:w,ok:n}})()")
        check("Stabilität: veralteter Worker wird in Log/Tests gemeldet, aktueller nicht", ww == {"warn": True, "ok": True}, ww, public=True)
        sk = await E("""(async()=>{const st=LASTSTAMP;let enc=0;const oF=fetchEnc,oS=fetchStamp;fetchEnc=async()=>{enc++;return oF()};fetchStamp=async()=>({s:'x1'});LASTSTAMP='x1';window.CACHEOK=true;
          const r=await loadOnce(false);fetchEnc=oF;fetchStamp=oS;LASTSTAMP=st;return {r,enc}})()""")
        check("Performance: unveränderte Daten werden nicht nochmals geladen und entschlüsselt", sk == {"r": True, "enc": 0}, sk, public=True)
        check("Stabilität: Rückfall auf die letzte funktionierende Version vorbereitet (Wächter, App-Version)", await E("typeof window.__ERRS==='object'&&!!window.APPVER&&window.APPVER.length>=8&&!!window.__APPOK"))

        # scene PDFs (Auflösung): one button per PDF, opening its pages right in the app; the script reader shows the floorplan too
        pd = await E("""(()=>{const keep=S.meta.blocking,kb=S.meta.bm,kf=S.meta.floorplans;
          const b={name:'TEST 167',sc:['167'],url:'https://www.dropbox.com/x',media:[{g:'pdf',t:'img',n:'Scene_167 · 1/2',f:'blk/aa',u:'u'},{g:'pdf',t:'img',n:'Scene_167 · 2/2',f:'blk/ab',u:'u'},{g:'pdf',t:'img',n:'Scene_167B · 1/1',f:'blk/ac',u:'u'}],pdfs:[{l:'167',u:'https://www.dropbox.com/p1'},{l:'99',u:'https://www.dropbox.com/p2'}]};
          S.meta.blocking=[b];const btn=pdfBtns(b);const n=btn.length,inApp=btn.filter(x=>x.includes('data-blkpdf')).length;
          const w=document.createElement('div');w.innerHTML=btn.join('');document.body.appendChild(w);w.querySelector('[data-blkpdf]').click();
          const g=document.getElementById('blkgal');const t=g?g.querySelector('h3').textContent:'';document.querySelectorAll('#blkgal').forEach(x=>x.remove());w.remove();
          S.meta.blocking=keep;S.meta.bm=kb;return {n,inApp,t}})()""")
        check("Auflösung: ein Knopf je PDF, öffnet die Seiten direkt in der App", pd["n"] == 3 and pd["inApp"] == 2 and "167" in pd["t"] and "2" in pd["t"], pd, public=True)
        fpx = await E("""(()=>{const d=S.days.find(d=>arr(d.items).some(i=>i.sc&&i.set));if(!d)return null;const it=arr(d.items).find(i=>i.sc&&i.set);const kf=S.meta.floorplans;
          S.meta.floorplans=[{name:'Testplan',file:'tp.pdf',url:'https://www.dropbox.com/tp',rule:{set:[it.set]}}];const h=blkRow(it.sc);S.meta.floorplans=kf;return h.includes('Testplan')})()""")
        check("Drehbuch-Szene: Knopf für den Floorplan der Location", fpx in (None, True), fpx, public=True)

        ab = await E("(()=>{S.tab='acct';ACSUB='app';render();const a=document.querySelector('#view .psec.about');return a?a.innerText:''})()")
        check("Mein Konto → App: «Über die App» mit App-Version und © MrK 2026", "MrK 2026" in ab and "App " in ab)
        # phone back button: closes an open window first, then goes back to the previous page (not out of the app)
        bk = await E("""(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));S.tab='today';render();await w(100);S.tab='plan';render();await w(100);S.tab='script';render();await w(100);
          const b=document.createElement('button');b.dataset.route=JSON.stringify({h:'https://x',c:'https://y',from:'Hotel',to:'Sion'});document.body.appendChild(b);b.click();b.remove();await w(150);
          const pop=!!document.getElementById('routepop');history.back();await w(300);const closed=!document.getElementById('routepop'),tab1=S.tab;
          history.back();await w(300);return {pop,closed,tab1,tab2:S.tab}})()""")
        check("Zurück-Knopf: schliesst zuerst das Fenster, dann zurück zur vorherigen Seite (Drehbuch → Drehplan)", bk == {"pop": True, "closed": True, "tab1": "script", "tab2": "plan"}, bk, public=True)
        # back button top left in the app: the same step back
        nb = await E("""(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const b=document.getElementById('navback');if(!b)return null;
          S.tab='loc';render();await w(150);const en=!b.disabled;b.click();await w(350);return {ok:true,en,tab:S.tab,top:b.getBoundingClientRect().left<80}})()""")
        check("Zurück-Knopf oben links: ein Schritt zurück (Locations → Drehplan)", nb == {"ok": True, "en": True, "tab": "plan", "top": True}, nb, public=True)
        ex = await E("""(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));let n=0;while(!(history.state&&history.state.base)&&n++<60){history.back();await w(120)}
          const base=!!(history.state&&history.state.base);const msg=(document.getElementById('refmsg')||{}).textContent||'';await w(2800);return {base,hint:/zurück/i.test(msg),guard:!(history.state&&history.state.base)}})()""")
        check("Zurück-Knopf auf der ersten Seite: Hinweis, erst zweimal zurück verlässt die App", ex["base"] and ex["hint"] and ex["guard"], ex, public=True)
        # script search with a long role badge: the scene title stays on one line (not one letter per line)
        sl = await E("""(()=>{const b=document.createElement('div');b.id='view2';b.style.width='380px';b.innerHTML='<ul class=sclist><li class=scard><button class=scli><span class=sclin>2</span><span class=sclih>INT. KAPELLE - EVENING</span><span class=sctag>ABEND</span><span class=rbadges><span class="rbadge warn"><b>Bax</b> ⚠ spricht im Drehbuch, fehlt im Drehplan</span></span></button></li></ul>';
          document.getElementById('view').appendChild(b);const h=b.querySelector('.sclih').getBoundingClientRect(),r=b.querySelector('.rbadges').getBoundingClientRect(),t=b.querySelector('.sclih');const lh=parseFloat(getComputedStyle(t).lineHeight)||20;b.remove();return {lines:Math.round(h.height/lh),below:r.top>=h.bottom-1}})()""")
        check("Drehbuch-Suche: Szenentitel lesbar, Rollen-Hinweise auf eigener Zeile", sl["lines"] <= 2 and sl["below"], sl, public=True)
        # App-Icon: not installed → only «Als App installieren»; installed → only «App deinstallieren» (with the steps for this device)
        ai = await E("""(()=>{const r={};for(const v of ['missing','installed','standalone']){window.A2ST={v,at:Date.now(),busy:false};S.tab='acct';ACSUB='app';render();
          r[v]={inst:!!document.querySelector('#view [data-ac="a2hs"]:not([data-more])'),un:!!document.querySelector('#view [data-ac="a2un"]')}}return r})()""")
        check("App-Icon: nicht installiert nur «Als App installieren», installiert nur «App deinstallieren»", ai["missing"] == {"inst": True, "un": False} and ai["installed"] == {"inst": False, "un": True} and ai["standalone"] == {"inst": False, "un": True}, ai)
        await E("document.querySelector('#view [data-ac=\"a2un\"]').click()"); await pg.wait_for_timeout(200)
        check("App deinstallieren: Anleitung mit Schritten für dieses Gerät", await E("document.querySelectorAll('#a2un .a2ol li').length") >= 2)
        await E("document.querySelector('#a2un [data-a2unok]').click()"); await pg.wait_for_timeout(200)
        check("App deinstallieren: Dialog schliesst, Status wird neu geprüft", await E("!document.getElementById('a2un')"))

        # changes: newest on top; read ones disappear 2 days after «Als gelesen markieren»
        co = await E("""(()=>{const t=todayISO(),n=Date.now();localStorage.setItem('chg:v1',JSON.stringify([{date:t,at:n-3600e3,sc:'1',txt:'alt'},{date:t,at:n-600e3,sc:'2',txt:'neu'}]));localStorage.setItem('chgseen:v1','0');
          const a=chgList().map(c=>c.txt);localStorage.setItem('chg:v1',JSON.stringify([{date:t,at:n-2.5*864e5,sc:'3',txt:'gelesen'}]));localStorage.setItem('chgseen:v1',String(n-2.1*864e5));const b=chgList().length;
          localStorage.setItem('chgseen:v1',String(n-864e5));const c=chgList().length;localStorage.removeItem('chg:v1');localStorage.setItem('chgseen:v1','0');return {order:a,gone:b,kept:c}})()""")
        check("Änderungen: neueste zuoberst, gelesene nach 2 Tagen entfernt", co == {"order": ["neu", "alt"], "gone": 0, "kept": 1}, co, public=True)

        # Today: the person chooses the parts in Mein Konto → App
        await E("localStorage.setItem('today','1');S.tab='acct';ACSUB='app';render()"); await pg.wait_for_timeout(300)
        tp = await E("[...document.querySelectorAll('#view [data-todaypart]')].map(x=>x.dataset.todaypart)")
        check("Mein Konto → App: Teile von «Today» wählbar", {"my", "time", "menu", "scs", "chg", "off", "wx", "drive", "loc"} <= set(tp), tp)
        check("Handy: jede Today-Option auf einer Zeile", await E("[...document.querySelectorAll('#view [data-todaypart]')].every(x=>x.closest('label').getBoundingClientRect().height<34)"))
        await E("for(const k of ['scs','off','chg']){const c=document.querySelector('#view [data-todaypart=\"'+k+'\"]');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))}"); await pg.wait_for_timeout(200)
        await E("S.tab='today';render()"); await pg.wait_for_timeout(300)
        th = await E("({scs:!!document.querySelector('#view .tscs'),off:!!document.querySelector('#view .toff'),chg:!!document.querySelector('#view .tchg'),v:localStorage.getItem('today'),on:todayOn()})")
        check("Today: abgewählte Teile ausgeblendet, Today bleibt eingeschaltet", not th["scs"] and not th["off"] and not th["chg"] and th["on"] and th["v"].startswith("1|"), th)
        await E("S.tab='acct';ACSUB='app';render();const c=document.querySelector('#view [data-todayon]');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))"); await pg.wait_for_timeout(200)
        await E("S.tab='acct';ACSUB='app';render();const c=document.querySelector('#view [data-todayon]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))"); await pg.wait_for_timeout(200)
        check("Today aus- und wieder einschalten: die Auswahl der Teile bleibt", await E("todayHidden().has('scs')&&todayOn()"))
        # start page: a start (or coming back after a long pause) opens Today; with Today off the Drehplan at today / the next day
        sp = await E("""(()=>{const keep=localStorage.getItem('today'),tab=S.tab,day=S.day;const r={};
          S.tab='loc';S.day='x';goStart();r.on=S.tab;localStorage.setItem('today','0|'+(keep||'').replace(/^[01]\\|?/,''));S.tab='loc';S.day='x';goStart();r.off=S.tab;
          const l=S.days.filter(d=>d.kind!=='off'&&d.kind!=='travel'),nx=l.find(d=>d.date>=todayISO())||l[l.length-1];r.day=!l.length||S.day===nx.id||String(S.day||'').startsWith('prep:');
          if(keep==null)localStorage.removeItem('today');else localStorage.setItem('today',keep);S.tab=tab;S.day=day;render();return r})()""")
        check("Start: Today, ohne Today Drehplan beim aktuellen Tag", sp == {"on": "today", "off": "plan", "day": True}, sp, public=True)
        await E("localStorage.setItem('today','1');S.tab='today';render()")

        # first push prompt: also offers changes to schedule, callsheet and prep
        await E("localStorage.removeItem('pushask:'+ME.uid);window.pushOK=()=>true;try{Object.defineProperty(Notification,'permission',{get:()=>'default',configurable:true})}catch(_){};WELCOME_OPEN=false;ONBOARD=false;TOUR.el=null;maybePushHint()")
        await pg.wait_for_timeout(400)
        check("Push-Abfrage: Drehplan-, Callsheet-, Prep- und Drehbuch-Änderungen wählbar", await E("[...document.querySelectorAll('#pushhint [data-phnews]')].map(x=>x.dataset.phnews).join()") == "plan,cs,prep,script")
        check("Push-Abfrage: Text nennt Drehbuch-Versionen", "Drehbuch" in await E("(document.getElementById('pushhint')||{}).innerText||''"))
        await E("const h=document.getElementById('pushhint');if(h)h.remove()")

        # phone: long addresses get «str.»
        await E("S.tab='loc';render()"); await pg.wait_for_timeout(300)
        ab = await E("""(()=>{const v=document.getElementById('view');const s=document.createElement('span');s.className='addr';s.style.cssText='display:inline';s.textContent='Restaurant Sonnenhof, Unterdorfstrasse 12, Bahnweg 4, 3998 Musterdorf Wallis Schweiz';v.prepend(s);fitAddr(v);const t=s.textContent;s.remove();return t})()""")
        check("Handy: lange Adressen «…strasse» → «…str.»", "Unterdorfstr. 12" in ab and "strasse" not in ab, ab)


    async def _p7():   # App-Verwaltung (Access, Tour, Dokumente, Log/Tests)
        # Access: roles per permission on top, pencil switches them right there, people to open
        await E("S.tab='admin';ADM.sub='roles';render()"); await pg.wait_for_timeout(1500)
        ac = await E("(()=>{const d=document.querySelector('#view details[data-sec=\"pacc-view.plan\"]');return d?{roles:d.querySelectorAll('.paccr .ust').length,people:!!d.querySelector('details.paccp'),pen:!!d.querySelector('[data-paccedit]')}:null})()")
        check("Access: Rollen zuoberst, Personen zum Aufklappen, Stift", bool(ac) and ac["roles"] >= 2 and ac["people"] and ac["pen"], ac)
        await E("document.querySelector('[data-paccedit=\"view.plan\"]').click()"); await pg.wait_for_timeout(300)
        b0 = await E("window.__db['roles/catering'].perms.includes('view.plan')")
        await E("document.querySelector('[data-pacc=\"catering\"][data-perm=\"view.plan\"]').click()"); await pg.wait_for_timeout(800)
        check("Access: Recht für eine Rolle direkt umschalten", await E("window.__db['roles/catering'].perms.includes('view.plan')") == (not b0))
        await E("document.querySelector('[data-pacc=\"catering\"][data-perm=\"view.plan\"]').click()"); await pg.wait_for_timeout(800)

        # tour made for the person: intro with the role, own appointments only with the permission
        await E("tourStart(false)"); await pg.wait_for_timeout(2000)
        tt = await E("({t:TOUR.steps.map(s=>s.t),intro:tourIntro()})")
        check("Tour: beginnt mit «Deine Tour» und nennt die Rolle", tt["t"][:1] == ["Deine Tour"] and "Owner" in tt["intro"], tt["intro"])
        check("Tour (Owner): zeigt «Termin hinzufügen» und «Push-Nachricht senden»", "Termin hinzufügen" in tt["t"] and "Push-Nachricht senden" in tt["t"], tt["t"])
        check("Tour (Owner): Einstellungen und jeder Teil der App-Verwaltung kurz erklärt", all(x in tt["t"] for x in ("Profil", "App-Einstellungen", "App-Verwaltung", "User", "Access", "Docs", "Log/Tests")), tt["t"])
        await E("if(TOUR.el)TOUR.el.remove();TOUR.el=null;document.querySelectorAll('#tour').forEach(x=>x.remove())")

        # documents compared (App-Verwaltung → Log)
        await E("S.tab='admin';ADM.sub='log';render()"); await pg.wait_for_timeout(800)
        await E("document.querySelector('[data-dckrun]').click()"); await pg.wait_for_timeout(6000)
        await E("S.tab='admin';ADM.sub='log';render()"); await pg.wait_for_timeout(400)
        dk = await E("({n:(DCK.res||[]).length,areas:[...new Set((DCK.res||[]).map(x=>x.area))],self:(DCK.res||[]).some(x=>x.area==='Selbsttest der App'&&x.lvl==='ok')})")
        check("Dokumente prüfen: Vergleich läuft und meldet Ergebnisse je Bereich", dk["n"] >= 4 and "Drehplan ↔ Drehbuch" in dk["areas"] and dk["self"], dk)
        sy = await E("""(()=>{const keep=[S.days,S.locs];S.locs=JSON.parse(JSON.stringify(S.locs));S.locs.forEach(l=>(l.sets||[]).forEach(st=>st.scenes=[]));return 1})()""")
        await E("dckRun()"); await pg.wait_for_timeout(5000)
        sd2 = await E(r"""(async()=>{const sl=await scriptData();const ok=i=>i.sc&&/^\d+[A-Z]?$/.test(i.sc)&&/^I\/(?!E)/.test(i.ie||'');
            const d=S.days.find(d=>d.kind==='shoot'&&(d.items||[]).some(ok));if(!d)return null;const it=d.items.find(ok);
            const x=sl.find(y=>String(y.sc).toUpperCase()===String(it.sc).toUpperCase());if(!x)return null;
            const keep=x.head;x.head='EXT. TESTORT - NACHT';await dckRun();x.head=keep;return (DCK.res||[]).some(r=>r.lvl==='warn'&&r.text.includes('Innen/Aussen')&&r.text.includes(it.sc+' ('))})()""")
        if sd2 is not None:
            check("Dokumente prüfen: Drehplan ↔ Drehbuch erkennt Innen/Aussen-Widerspruch", sd2)
        # the other way round: a scene that is only in the script is reported; one marked as omitted is not
        rv = await E(r"""(async()=>{const sl=await scriptData();if(!sl.length)return null;const keep=sl.slice();sl.unshift({sc:'9997',head:'INT. TESTORT - TAG',text:'x'},{sc:'9998',head:'OMITTED',text:''});
            await dckRun();sl.length=0;keep.forEach(x=>sl.push(x));const r=(DCK.res||[]).filter(x=>x.area==='Drehbuch ↔ Drehplan');await dckRun();
            return {hit:r.some(x=>x.lvl==='warn'&&x.text.includes('9997')),omit:!r.some(x=>x.text.includes('9998'))}})()""")
        if rv is not None:
            check("Dokumente prüfen: Szenen im Drehbuch, die im Drehplan fehlen", rv == {"hit": True, "omit": True}, rv, public=True)
        check("Dokumente prüfen: erkennt Szenen ohne Location als Unstimmigkeit", await E("(DCK.res||[]).some(x=>x.lvl==='warn'&&x.area==='Drehplan ↔ Locations')"))
        oc = await E("(()=>{DCK.res=[{lvl:'info',area:'A',text:'x'},{lvl:'warn',area:'B',text:'y'},{lvl:'ok',area:'C',text:'z'}];S.tab='admin';ADM.sub='log';render();const c=x=>{const e=document.querySelector(x);return e?getComputedStyle(e).color:''};return {note:c('#view details.tstsu.note>summary'),hint:c('#view .lsum .tsth .dckn'),bad:c('#view details.tstsu.bad>summary')}})()")
        check("Dokumente prüfen: Hinweise orange, Unstimmigkeiten rot", oc["note"] == "rgb(240, 138, 36)" and oc["hint"] == "rgb(240, 138, 36)" and oc["bad"] == "rgb(214, 69, 93)", oc, public=True)

        # App-Verwaltung → Log: results of the automatic tests, one part per suite
        await E("S.tab='today';render()"); await pg.wait_for_timeout(100)
        await E("""TST.d={at:Date.now(),sha:'abc1234',ok:false,n:3,fail:1,suites:[{name:'App',ok:true,n:2,fail:0,checks:[{n:'a',ok:true},{n:'b',ok:true}]},{name:'Firestore-Regeln',ok:false,n:1,fail:1,checks:[{n:'c',ok:false}]}]};S.tab='admin';ADM.sub='log';render()""")
        await pg.wait_for_timeout(500)
        lg = await E("(()=>{const b=document.querySelector('#view details[data-lsec=\"tst\"]');return {su:b.querySelectorAll('.tstsu').length,bad:b.querySelectorAll('.tstsu.bad[open]').length,open:b.open}})()")
        check("Log: Testresultate je Teil, alles zugeklappt bis man es öffnet", lg == {"su": 2, "bad": 0, "open": False}, lg, public=True)
        await E("window.CHATURL=window.CHATURL||'https://worker.test';render()"); await pg.wait_for_timeout(300)
        # opening Log/Tests starts the tests again; while a test runs, its open/close button shows the progress as a ring
        await E("RTS.at=0;S.tab='today';render()"); await pg.wait_for_timeout(100); await E("S.tab='admin';ADM.sub='log';render()"); await pg.wait_for_timeout(2500)
        check("Log/Tests öffnen startet «Berechtigungen testen» und «Dokumente prüfen» neu", await E("Date.now()-RTS.at<10000&&Date.now()-DCK.at<10000&&S.tab==='admin'&&ADM.sub==='log'"))
        await E("new Promise(r=>{const t=setInterval(()=>{if(!RTS.busy&&!DCK.busy){clearInterval(t);r()}},50);setTimeout(()=>{clearInterval(t);r()},8000)})")   # background tests finished
        await E("RTS.at=0;window.__rtp=[];const o=render;window.__rtw=setInterval(()=>{if(RTS.busy)__rtp.push(!!document.querySelector('#view details[data-lsec=\"rt\"] .tstall.prog'))},40);document.querySelector('[data-asub=\"log\"]')&&document.querySelector('[data-asub=\"log\"]').click()"); await pg.wait_for_timeout(3000)
        rp2 = await E("(()=>{clearInterval(__rtw);return {again:Date.now()-RTS.at<8000,ring:__rtp.some(Boolean),tab:S.tab+'/'+ADM.sub}})()")
        check("Erneuter Tipp auf «Log» startet die Tests wieder, Berechtigungstest mit Fortschrittsring", rp2["again"] and rp2["ring"] and rp2["tab"] == "admin/log", rp2, public=True)
        check("Log/Tests: Menüs bleiben nach dem automatischen Test zugeklappt", await E("[...document.querySelectorAll('#view details[data-lsec]')].every(d=>!d.open)"))
        rg = await E("(()=>{RTS.busy=true;render();const a=!!document.querySelector('#view details[data-lsec=\"rt\"] .tstall.prog');RTS.busy=false;GH.run={status:'in_progress',created_at:new Date().toISOString()};GH.jobs=[{name:'test',steps:[{name:'Werkzeuge',status:'completed'},{name:'Funktionen',status:'in_progress'},{name:'Sicherheit',status:'queued'},{name:'x',status:'queued'}]}];render();const b=document.querySelector('#view details[data-lsec=\"tst\"] .tstall.prog');const t=document.querySelector('#view details[data-lsec=\"tst\"] summary').textContent;GH.run=null;GH.jobs=[];render();return {rt:a,ring:!!b,p:b?b.style.getPropertyValue('--p'):'',t}})()")
        check("Fortschritt als Ring im Auf-/Zuklapp-Knopf (läuft: Prozent und aktueller Schritt)", rg["rt"] and rg["ring"] and rg["p"].strip() == "25" and "Funktionen" in rg["t"], rg)
        await E("new Promise(r=>{const t=setInterval(()=>{if(!RTS.busy&&!DCK.busy){clearInterval(t);r()}},50);setTimeout(()=>{clearInterval(t);r()},8000)})")   # background tests finished
        gs = await E("""(async()=>{window.__ts=0;const o=tstStart;tstStart=function(){__ts++};const w=ms=>new Promise(r=>setTimeout(r,ms));
          S.tab='today';render();await w(50);S.tab='admin';ADM.sub='log';render();await w(1200);const a=__ts;
          const d=document.querySelector('#view details[data-lsec="tst"]');d.open=true;await w(400);const b=__ts;render();await w(400);const c=__ts;tstStart=o;return {log:a,open:b,redraw:c}})()""")
        check("Automatische Tests starten nie von selbst (nicht bei Log, Aufklappen oder Neuzeichnen) – nur mit dem Start-Knopf", gs == {"log": 0, "open": 0, "redraw": 0}, gs, public=True)
        await E("new Promise(r=>{const t=setInterval(()=>{if(!RTS.busy&&!DCK.busy){clearInterval(t);r()}},50);setTimeout(()=>{clearInterval(t);r()},8000)})")   # background tests finished
        await E("document.querySelectorAll('#view details').forEach(d=>d.open=false)")
        # roles tested one after the other with their rights (nothing is changed)
        await E("document.querySelector('#view [data-rtrun]').click()"); await pg.wait_for_timeout(5000)
        rt = await E("(RTS.res||[]).map(x=>({n:x.name,i:x.issues.length,t:x.tabs.length,why:x.issues.join(' | ').slice(0,120)}))")
        check("Berechtigungen testen: jede Stufe geprüft, ohne Probleme", len(rt) >= 4 and all(x["i"] == 0 for x in rt), rt)
        for x in rt:
            check(f"Berechtigungen testen: {x['n']} – Seiten, Telefon/E-Mail und Kopf-Symbole stimmen", x["i"] == 0, x, public=True)
        check("Berechtigungen testen: danach wieder eigene Rechte (Owner)", await E("isOwner()&&!SIMROLE&&tabsOn().includes('plan')"))
        await E("document.querySelector('#view [data-tstall]').click()"); await pg.wait_for_timeout(200)
        al = await E("(()=>{const b=document.querySelector('#view [data-tstall]').closest('.tstsec');return {box:b.open,sub:[...b.querySelectorAll('details')].some(d=>d.open)}})()")
        check("Log: Auf-/Zuklapp-Knopf öffnet das Menü, Unterthemen bleiben zu (nur von Hand)", al == {"box": True, "sub": False}, al, public=True)
        ra = await E("(()=>{const bx=[...document.querySelectorAll('#view details.tstsec')];return {n:bx.length,ok:bx.every(d=>{const sm=d.querySelector(':scope>summary');const b=sm&&sm.querySelector(':scope>[data-tstall]');if(!b)return false;const r=b.getBoundingClientRect(),q=sm.getBoundingClientRect();return sm.lastElementChild===b&&q.right-r.right<40&&r.top-q.top<14})}})()")
        check("Log: jedes Menü auf- und zuklappbar, Knopf oben rechts", ra["n"] >= 4 and ra["ok"], ra)
        l2 = await E("(()=>{const sm=document.querySelector('#view details.tstsec>summary.lsum');const t=sm.querySelector('.lsh b'),st=sm.querySelector('.lss'),tm=sm.querySelector('.lst');return {w:innerWidth,second:!!st&&st.getBoundingClientRect().top>=t.getBoundingClientRect().bottom-1,third:!!tm&&tm.getBoundingClientRect().top>=st.getBoundingClientRect().bottom-1}})()")
        check("Handy: Testresultat auf der zweiten, Datum/Zeit auf einer eigenen Zeile", l2["w"] > 600 or (l2["second"] and l2["third"]), l2)
        tg = await E("""(()=>{document.querySelectorAll('#view details.tstsec').forEach(d=>d.open=false);const au=document.querySelector('#view details.audd');au.querySelector(':scope>summary [data-tstall]').click();
          const others=[...document.querySelectorAll('#view details.tstsec')].filter(d=>d!==au).some(d=>d.open);const open=au.open&&![...au.querySelectorAll('details')].some(d=>d.open);return {open,others}})()""")
        await pg.wait_for_timeout(150); await E("render()"); await pg.wait_for_timeout(200)
        tg["keep"] = await E("!!(document.querySelector('#view details.audd')||{}).open")
        check("Log: Knopf im Menü klappt nur dieses Menü auf (Unterthemen zu), bleibt nach Neuaufbau offen", tg["open"] and not tg["others"] and tg["keep"], tg, public=True)
        await E("document.querySelector('#view details.audd [data-tstall]').click()"); await pg.wait_for_timeout(150)
        check("Log: zweiter Klick klappt alle Unterthemen auf", await E("(()=>{const a=document.querySelector('#view details.audd');return a.open&&[...a.querySelectorAll('details')].every(d=>d.open)})()"))
        await E("document.querySelector('#view details.audd [data-tstall]').click()"); await pg.wait_for_timeout(150)
        check("Log: dritter Klick schliesst das ganze Menü", await E("(()=>{const a=document.querySelector('#view details.audd');return !a.open&&![...a.querySelectorAll('details')].some(d=>d.open)})()"))
        lk = await E("(()=>{const b=[...document.querySelectorAll('#view .lsum .tstall, #view .tstbtns button')];return {n:b.length,same:b.every(x=>x.classList.contains('lbtn')&&Math.round(x.getBoundingClientRect().width)===34&&!!x.title),centred:b.every(x=>{const r=x.getBoundingClientRect(),g=x.querySelector('svg').getBoundingClientRect();return Math.abs(g.left+g.width/2-r.left-r.width/2)<=1&&Math.abs(g.top+g.height/2-r.top-r.height/2)<=1})}})()")
        check("Log: alle Symbol-Knöpfe gleich gestaltet (rund, 34 px, Symbol in der Mitte, mit Tooltip)", lk["n"] >= 6 and lk["same"] and lk["centred"], lk, public=True)
        # every box like «Automatische Tests»: last result (with time) in the title, parts to open, start button below
        lb = await E("""(()=>{const r={};for(const [k,sel] of [['tst','details[data-lsec="tst"]'],['rt','details[data-lsec="rt"]'],['dck','details[data-lsec="dck"]'],['aud','details[data-lsec="aud"]']]){const d=document.querySelector('#view '+sel);if(!d){r[k]=null;continue}
          const sm=d.querySelector(':scope>summary').textContent;r[k]={time:/\\d\\d\\.\\d\\d\\.? \\d\\d:\\d\\d/.test(sm),su:d.querySelectorAll('details.tstsu').length,run:!!d.querySelector('.tstbtns button')}}return r})()""")
        check("Log: jedes Menü wie «Automatische Tests» (Zeit im Titel, Unterteile, Knopf unten)", all(lb[k] and lb[k]["time"] and lb[k]["su"] > 0 for k in ("tst", "rt", "dck", "aud")) and lb["rt"]["run"] and lb["dck"]["run"], lb)
        check("Log: «Berechtigungen testen» heisst so (nicht «Rollen testen» – keine Verwechslung mit dem Cast)", await E("(()=>{const t=document.getElementById('view').innerText;return t.includes('Berechtigungen testen')&&!t.includes('Rollen testen')})()"))
        await E("document.querySelectorAll('#view details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(200)
        await E("S.tab='today';render()"); await pg.wait_for_timeout(200); await E("S.tab='admin';ADM.sub='log';render()"); await pg.wait_for_timeout(300)
        check("Log: nach erneutem Öffnen alles zugeklappt (nichts gemerkt)", await E("[...document.querySelectorAll('#view details')].every(d=>!d.open)"))
        await E("(()=>{const d=document.querySelector('#view details[data-lsec=\"tst\"]');d.open=true;const s=d.querySelector('details.tstsu');s.open=true})()"); await pg.wait_for_timeout(150); await E("render()"); await pg.wait_for_timeout(200)
        ko = await E("({sub:!!document.querySelector('#view details[data-lsec=\"tst\"] details.tstsu[open]'),box:!!(document.querySelector('#view details[data-lsec=\"tst\"]')||{}).open,su:JSON.stringify(TST.su).slice(0,80),tab:S.tab+'/'+ADM.sub})")
        check("Log: geöffnete Unterteile bleiben offen, solange man auf der Seite bleibt", ko["sub"], ko, public=True)
        pf = await E("""(()=>{const keep={};for(const k of PREFKEYS){keep[k]=localStorage.getItem(k);localStorage.setItem(k,'x')}localStorage.setItem('rc','abc');
          let n=0;const p={};for(const k of PREFKEYS){const v=localStorage.getItem(k);if(v!==null)p[k]=v}const v=localStorage.getItem('rc');if(v!==null&&Object.keys(p).length<14)p.rc=v;n=Object.keys(p).length+2;
          for(const k of PREFKEYS){if(keep[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,keep[k])}localStorage.removeItem('rc');return n})()""")
        check("Einstellungen: auch mit allen Werten höchstens 16 Felder (Regel)", pf <= 16, pf)
        src = await E("savePrefs.toString()")
        check("Einstellungen: «Nachricht gesehen» wird nur gespeichert, wenn Platz ist", "length<14" in src)
        check("Log: Knopf «Tests jetzt starten» (Kreis-Pfeile) für Admins", await E("!!document.querySelector('#view [data-tstrun] svg')"))
        await E("TST.d=null")


    async def _p8():   # Push-Seite und vCard
        # push page: who has push on a device, collapsible and closed by default (before the history)
        await E("""(async()=>{window.__db['push/uX_abcdefghij']={c:await ownEnc({sub:{endpoint:'x'},on:true,who:{email:'crew@test.ch'}}),at:1};window.__db['push/uY_abcdefghij']={c:await ownEnc({sub:null,on:false,who:{email:'cater@test.ch'}}),at:1};BC.hist=null;BC.dev=null;BC.devOpen=false;S.tab='bcast';render()})()""")
        await pg.wait_for_timeout(1500)
        pd = await E("(()=>{const d=document.querySelector('#view details.bcdev');const h=document.querySelector('#view .bchh');return d?{open:d.open,before:!!(h&&(d.compareDocumentPosition(h)&4)),txt:d.innerText}:null})()")
        check("Push: «Push aktiviert» vor dem Verlauf, zugeklappt", bool(pd) and not pd["open"] and pd["before"], pd)
        check("Push: nur Personen mit eingeschaltetem Push", bool(pd) and "1 Person" in pd["txt"], pd and pd["txt"][:80])

        # ---------- vCard ----------
        await E("S.tab='crew';S.q='';render()"); await pg.wait_for_timeout(500)
        who = await E("(()=>{const b=[...document.querySelectorAll('#view [data-vc]')].find(x=>x.offsetParent);if(!b)return null;const [gi,pi]=b.dataset.vc.split(':').map(Number);const p=S.crew[gi].people[pi];return {name:p.name,phone:!!p.phone}})()")
        if who:
            async with pg.expect_download(timeout=5000) as dl:
                await pg.locator("#view [data-vc]:visible").first.click()
            v = open(await (await dl.value).path(), encoding="utf-8").read()
            check("vCard: Datei mit Name und Telefon", v.startswith("BEGIN:VCARD") and "FN:" + who["name"].replace(",", "\\,") in v and ("TEL" in v) == who["phone"] and v.rstrip().endswith("END:VCARD"))

    for name, part in [('Suche', _p0), ('Drehplan', _p1), ('Meine Termine und Konto', _p2), ('Push an alle', _p3), ('Eigene Termine und Google Kalender', _p4), ('Drehbuch-Version und Today', _p5), ('App allgemein (Knöpfe, Stabilität, App-Icon, Today-Teile)', _p6), ('App-Verwaltung (Access, Tour, Dokumente, Log/Tests)', _p7), ('Push-Seite und vCard', _p8)]:
        await run_part(name, part, pg)
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
    for who in ("crew", "catering", "power", "norole"):
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
        adm_ok = await E("isAdmin()||['users.view','users.edit','users.invite','users.requests','roles.assign','roles.edit','settings','audit.view','roles.view','data.check'].some(p=>can(p))")
        check(f"{who}: App-Verwaltung nur mit Verwaltungsrecht", adm["btn"] == adm_ok, adm)
        ic = await E("({cal:getComputedStyle(document.getElementById('myCalBtn')).display!=='none',mail:!!document.getElementById('bcBtn')&&getComputedStyle(document.getElementById('bcBtn')).display!=='none',mycal:vok('mycal'),push:can('push.send')})")
        check(f"{who}: Kopf-Symbole nur mit Berechtigung sichtbar (Kalender, Couvert)", ic["cal"] == ic["mycal"] and ic["mail"] == ic["push"], ic)
        await E("S.tab='my';render()"); await pg.wait_for_timeout(200)
        check(f"{who}: kein «Kein Zugang» – ohne Recht zurück zur Startseite", "Kein Zugang" not in await E("document.getElementById('view').innerText"))
        await E("tourStart(false)"); await pg.wait_for_timeout(1500)
        tt = await E("TOUR.steps.map(s=>s.t)")
        await E("if(TOUR.el)TOUR.el.remove();TOUR.el=null;document.querySelectorAll('#tour').forEach(x=>x.remove())")
        dc = await E("(()=>{ACSUB='app';S.tab='acct';render();const a=!!document.querySelector('#view .dcksec');S.tab='admin';ADM.sub='test';render();const t=document.querySelector('#view .dcktab .dcksec');ADM.sub='log';render();return {acct:a,test:!!t&&t.tagName!=='DETAILS'&&!!t.querySelector('[data-dckrun]'),gear:!document.getElementById('admBtn').hidden}})()")
        want = await E("!isAdmin()&&can('data.check')")
        check(f"{who}: «Dokumente prüfen» im Zahnrad unter «Test» nur mit Recht, nicht mehr in Mein Konto", not dc["acct"] and dc["test"] == want and (dc["gear"] or not want), dc)
        sr = await E("(()=>{S.meta.scriptChange={at:new Date().toISOString(),v:'v99',prev:'v98'};localStorage.removeItem('scrv');const due=!!scrNewsDue();delete S.meta.scriptChange;return {due,may:vok('script')}})()")
        check(f"{who}: Nachricht zur neuen Drehbuch-Version nur mit «Drehbuch sehen»", sr["due"] == sr["may"], sr)
        if want:
            tb = await E("(()=>{S.tab='admin';ADM.sub='test';render();const subs=[...document.querySelectorAll('#view .asub [data-asub]')].map(b=>b.dataset.asub);ADM.sub='log';render();const lg=!!document.querySelector('#view .dcksec');S.tab='today';render();return {subs,lg,audit:can('audit.view')}})()")
            check(f"{who}: Reiter «Test» nur mit «Dokumente prüfen», kein Doppel im Log", "test" in tb["subs"] and not tb["lg"] and ("log" in tb["subs"]) == tb["audit"], tb)
            check(f"{who}: in der Tour «Dokumente prüfen» unter dem Zahnrad", "Dokumente prüfen" in tt and "App-Verwaltung" in tt, tt)
        else:
            check(f"{who}: kein Reiter «Test» ohne Recht", not await E("(()=>{S.tab='admin';render();const t=!!document.querySelector('#view [data-asub=\"test\"]');S.tab='today';render();return t})()"))
        if who == "power":
            await E("ADM.loaded=false;S.tab='admin';ADM.sub='users';render()"); await pg.wait_for_timeout(2500)
            await E("render()"); await pg.wait_for_timeout(300)
            ab = await E("(()=>{const r=[...document.querySelectorAll('#view .ucard,#view .urow,#view [data-uem]')].find(x=>/admin Test/.test(x.innerText));return r?r.innerText.slice(0,80):document.getElementById('view').innerText.includes('admin Test')?'row?':''})()")
            check("Power-User: Admins erscheinen als «Admin», nicht als «Keine Rolle»", "Admin" in ab and "Keine Rolle" not in ab, ab)
        if who == "crew":
            await E("MYPERMS.push('roles.view');try{acctButton(true)}catch(_){};S.tab='admin';ADM.sub='roles';ADM.loaded=false;render()"); await pg.wait_for_timeout(1500)
            rv = await E("({tab:!!document.querySelector('[data-asub=\"roles\"]')||ADM.sub==='roles',view:!!document.querySelector('#view .pacc'),edit:document.querySelectorAll('#view [data-redit],#view [data-paccedit]').length,gear:!document.getElementById('admBtn').hidden})")
            check("Rollen sehen: Access sichtbar, aber nichts änderbar", rv["view"] and rv["edit"] == 0 and rv["gear"], rv)
            await E("MYPERMS.splice(MYPERMS.indexOf('roles.view'),1);try{acctButton(true)}catch(_){};S.tab='today';render()")
        if who == "catering":
            # role changed (here: catering gets «Push senden»): message with what is new, offered once
            await E("(()=>{const k=memKey();const c=JSON.parse(localStorage.getItem(k)||'{}');c.p=(c.p||[]).filter(p=>p!=='view.dispo');localStorage.setItem(k,JSON.stringify(c))})()")
            await E("checkMember().catch(()=>{})"); await pg.wait_for_timeout(3500)
            rc = await E("(()=>{const d=document.getElementById('rolechg');return d?d.innerText:''})()")
            check("Rolle geändert: Nachricht mit den neuen Rechten", "Callsheet sehen" in rc and "Catering" in rc, rc[:120])
            check("Rolle geändert: keine Tour angeboten", not await E("!!document.querySelector('#rolechg [data-rctour]')") and "Tour" not in rc, rc[:120])
            await E("const r=document.getElementById('rolechg');if(r)r.remove()")
            await E("(()=>{const k=memKey();const c=JSON.parse(localStorage.getItem(k)||'{}');c.p=(c.p||[]).filter(p=>p!=='view.dispo');localStorage.setItem(k,JSON.stringify(c))})()")
            await E("checkMember().catch(()=>{})"); await pg.wait_for_timeout(3500)
            check("Rolle geändert: Nachricht nur einmal (auch wenn ein anderes Gerät noch den alten Stand hat)", not await E("!!document.getElementById('rolechg')"))
            await E("const r=document.getElementById('rolechg');if(r)r.remove()")
            await E("checkMember().catch(()=>{})"); await pg.wait_for_timeout(3500)
            check("Rolle geändert: ohne Änderung keine Nachricht", not await E("!!document.getElementById('rolechg')"))
            await E("(()=>{localStorage.removeItem('rc');const k=memKey();const c=JSON.parse(localStorage.getItem(k)||'{}');c.p=(c.p||[]).concat(['users.edit']);localStorage.setItem(k,JSON.stringify(c))})()")
            await E("checkMember().catch(()=>{})"); await pg.wait_for_timeout(3500)
            rr = await E("(()=>{const d=document.getElementById('rolechg');return d?d.innerText:''})()")
            check("Rolle geändert: weggefallene Rechte werden genannt («Nicht mehr»)", "Nicht mehr" in rr and "Benutzer ändern" in rr, rr[:160])
            await E("const r=document.getElementById('rolechg');if(r)r.remove()")
        check(f"{who}: Tour ohne Schritte für fehlende Rechte", "Termin hinzufügen" not in tt and ("App-Verwaltung" in tt) == (who == "power") and ("Schedule" in tt) == (who != "norole") and ("Lunch-Menüs" in tt) == (who == "catering"), tt)
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
                common.GROUP = "" if name == "Funktionen" else name
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
