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
from common import check, done, warn  # noqa: E402

LANGS = ["de", "fr", "it", "en", "hi"]


async def search(pg, mode, q):
    E = pg.evaluate
    await E("S.gm=%s;openSearch();$('#gq').value=%s;renderSearch()" % (json.dumps(mode), json.dumps(q)))
    await pg.wait_for_timeout(200)
    return await E("[...document.querySelectorAll('#gres [data-sr]')].map(b=>b.innerText.replace(/\\s+/g,' '))")


RETRY_PARTS = []   # parts that failed: run once more at the end of the owner tests


async def run_part(name, part, pg, last=False):
    """one part of the owner tests: an error stops only this part; the page is put back to a known state for the next one.
    A part with a failed check is put aside and run once more at the end (last=True: the second try – its result counts)"""
    i = common.mark()
    common.GROUP = name
    try:
        await part()
        check(f"{name}: Teil lief durch", True)
    except Exception as e:
        check(f"{name}: Teil lief durch", False, str(e).split("\n")[0][:150])
    try:
        await pg.evaluate("document.querySelectorAll('.a2hs,#tour,#routepop,#bcview,#scrnews,#xqpick,#pdfv').forEach(x=>x.remove());S.tab='today';render()")
    except Exception:
        pass
    common.GROUP = ""
    if not last and common.failed_since(i):
        common.drop_since(i); RETRY_PARTS.append((name, part)); print("… " + name + ": fehlgeschlagen – wird am Schluss nochmals ausgeführt", flush=True)
    elif last and not common.failed_since(i):
        common.second_try_ok(name)


async def owner_tests(p, port):
    b, pg, errs = await smoke.session(p, port, "owner")
    E = pg.evaluate
    pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
    # start screen: the loading status ends by itself as soon as the current data is shown (not only after 20 s)
    await pg.wait_for_timeout(2500)
    sp = await E("(()=>{const s=document.getElementById('splash');return s?(document.getElementById('splog')||{}).textContent||'da':''})()")
    check("Startbildschirm: verschwindet, sobald alles geladen ist (alle Schritte ✓)", sp == "", sp, public=True)

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
        chips = await E("[...document.querySelectorAll('#view [data-day]:not([disabled])')].map(x=>x.dataset.day)")
        other = next((c for c in chips if c != sd["day"] and not c.startswith("prep:")), None)
        if other:
            await E("document.querySelector('#view [data-day=\"%s\"]').click()" % other); await pg.wait_for_timeout(250)
            check("Drehplan: Tag wechseln per Tages-Chip", await E("S.day") == other)
            await E("document.querySelector('#view [data-day=\"%s\"]').click()" % sd["day"]); await pg.wait_for_timeout(250)
        scn_plan = await E("(()=>{const b=[...document.querySelectorAll('#view .scbtn[data-scene]')].find(x=>x.offsetParent);return b?b.dataset.scene:''})()")
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
            await E("[...document.querySelectorAll('#view .scbtn[data-scene]')].find(x=>x.offsetParent).click()")
            await pg.wait_for_timeout(2500)
            txt = await E("(()=>{const s=document.querySelector('.scrn');return s&&!s.hidden?s.innerText:''})()")
            check("Drehplan: Script-Knopf öffnet das Drehbuch als Pop-up bei dieser Szene", bool(txt) and scn.split("/")[0].strip().lower() in txt.lower() and "nicht geladen" not in txt, (scn, txt[:80]))
            await E("const x=document.querySelector('[data-scnclose]');if(x)x.click()")
        # the callsheet: the same pop-up from a scene of the shooting order
        cd = await E("(()=>{const d=(S.dispos||[]).find(x=>x.cs&&x.cs.order&&(x.cs.order.rows||[]).some(r=>r.sc));return d?d.date:''})()")
        if cd:
            await E("S.tab='dispo';S.dday=%s;render()" % json.dumps(cd)); await pg.wait_for_timeout(400)
            sc2 = await E("""(()=>{[...document.querySelectorAll('#view details')].filter(x=>x.querySelector('.csorder')).forEach(x=>x.open=true);
                const r=document.querySelector('#view .csorder li.csfold details.csscd');if(!r)return '';r.open=true;const b=r.querySelector('.scbtn[data-scene]');if(!b)return '-';b.click();return b.dataset.scene})()""")
            check("Callsheet: Script-Knopf in der Drehfolge", bool(sc2) and sc2 != "-", sc2)
            if sc2 and sc2 != "-":
                await pg.wait_for_timeout(2500)
                txt = await E("(()=>{const s=document.querySelector('.scrn');return s&&!s.hidden?s.innerText:''})()")
                check("Callsheet: Script-Knopf öffnet das Drehbuch als Pop-up", bool(txt) and "nicht geladen" not in txt and "nicht gefunden" not in txt, (sc2, txt[:80]))
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
            gs = await E("""(async()=>{if(typeof gastSync!=='function'||typeof ADM==='undefined'||!window.__db)return null;const k=JSON.stringify({ur:ADM.ur,ok:ADM.urOk,r:ADM.roles,m:ADM.mem,i:ADM.inv,a:ADM.adm});
              ADM.urOk=true;ADM.roles=(ADM.roles||[]).concat([{id:'gast',name:'Gast',perms:[]}]);ADM.mem=[{uid:'g1',email:'gast1@test.ch'},{uid:'g2',email:'hatrolle@test.ch'}];ADM.inv=[{id:'gast2@test.ch'},{id:'adm@test.ch'}];ADM.adm=['adm@test.ch'];ADM.ur={'hatrolle@test.ch':'crew'};
              await gastSync();const r={g1:(__db['userroles/gast1@test.ch']||{}).role,g2:(__db['userroles/gast2@test.ch']||{}).role,keep:!__db['userroles/hatrolle@test.ch'],adm:!__db['userroles/adm@test.ch']};
              const o=JSON.parse(k);Object.assign(ADM,{ur:o.ur,urOk:o.ok,roles:o.r,mem:o.m,inv:o.i,adm:o.a});return r})()""")
            check("Ohne Rolle wird «Gast» (angemeldet und eingeladen), vorhandene Rollen und Admins bleiben",
                  gs is None or gs == {"g1": "gast", "g2": "gast", "keep": True, "adm": True}, gs)
            ctd = await E("""(()=>{const u=ME&&ME.uid;if(!u||!window.__db)return null;const c=__db['contacts/'+u]||{},m=__db['members/'+u]||{};return {c:c.phone||'',m:'phone' in m||'contactEmail' in m,me:(MEMBER||{}).phone||''}})()""")
            check("Mein Konto: Telefon in contacts gespeichert (nicht mehr in members, das Catering mitliest)",
                  ctd is None or (ctd["c"] == "+41 79 123 45 67" and not ctd["m"] and ctd["me"] == "+41 79 123 45 67"), ctd)
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
        pre = await E("(window.__ERRS||[]).map(e=>String(e.f||'').replace(/^.*\\//,'')+':'+(e.l||0)+':'+String(e.m||'').replace(/[^A-Za-z ]/g,'').slice(0,40))")
        # only the reports of errReport count (col «app»): diagnosis entries of the quittance (col «sceneack») are written by earlier steps
        er = await E("""(async()=>{const app=()=>Object.values(window.__db).filter(d=>d&&d.op==='error'&&d.col==='app');const n0=app().length;ERRN=0;ERRSENT.clear();localStorage.removeItem('errsent:v1');__ERRS.push({m:'boom at x@y.ch +41 79 123 45 67',f:'12-admin.js',l:7,t:Date.now()});
          await errReport();const a=app().slice(n0);const one=a.length;__ERRS.push({m:'boom at x@y.ch +41 79 123 45 67',f:'12-admin.js',l:7});await errReport();
          const other=Object.values(window.__db).filter(d=>d&&d.op==='error'&&d.col!=='app').map(d=>String(d.col||'?')+':'+String(d.sum||'').split(' ').slice(0,2).join(' ').replace(/[^a-z ]/gi,'')).slice(0,4);
          const s=(a[0]||{}).sum||'';return {one,again:app().length-n0,clean:!/@|\\d{3} \\d{2}/.test(s),file:s.includes('12-admin.js'),other}})()""")
        check("Stabilität: Fehler werden ohne Daten einmal an die Owner gemeldet (Log)", {k: er[k] for k in ("one", "again", "clean", "file")} == {"one": 1, "again": 1, "clean": True, "file": True}, dict(er, pre=pre[:3]), public=True)
        if er.get("other"): print("::notice::Diagnose-Einträge vor dem Stabilitätstest: " + ", ".join(er["other"]))
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
        cu = await E("""(()=>{const w=document.createElement('div');w.innerHTML=chgUnitsHTML([{date:'2026-10-26',sc:'5 pt2',u:'2',txt:'x',unread:true},{date:'2026-10-26',sc:'157',txt:'y'},{date:'2026-10-27',sc:'107 pt1',u:'1',txt:'z'}]);
          const d=[...w.querySelectorAll('details[data-chgu]')];return d.map(x=>x.dataset.chgu+':'+(x.open?'auf':'zu')+':'+x.querySelectorAll('.chgi').length).join(' ')})()""")
        check("Today/Änderungen: 1st Unit (offen) und 2nd Unit (zu) getrennt aufklappbar", cu == "1:auf:2 2:zu:1", cu, public=True)
        ct = await E("""(()=>{const o=chgLoad(),pv=Object.assign({},S.pv);const sh=S.days.filter(x=>x.kind==='shoot'&&arr(x.items).some(i=>i.sc));const d=sh.find(x=>x.date>=todayISO())||sh[sh.length-1];if(!d)return null;const it=arr(d.items).find(i=>i.sc);
          chgSave([{id:'t1',at:Date.now(),date:d.date,u:'1',sc:it.sc,txt:'Test'}]);const keep=S.meta.bd;
          S.meta.bd={[d.date+'|'+bdKey(it.sc)]:{h:{FX:'Double BJ'},c:[['Crew',['Lifeguard']],['Props',['Knife','Stone (soft, dummy)']],['Mup/Hair',['Mike dying']],['Notes',['a','b']]]}};
          S.tab='plan';S.day=d.id;render();const v=document.querySelector('#view');const vis=e=>!!e&&getComputedStyle(e).display!=='none';
          const keys=[...v.querySelectorAll('.pvb [data-pv]')].map(b=>b.dataset.pv).join(',');
          const bt=v.querySelector('.sc .bdt'),txt=bt&&bt.textContent,u=!!(bt&&bt.querySelector('u')),sep=bt?getComputedStyle(bt.querySelectorAll('.bdi')[1],'::before').content:'';
          const nx=bt&&bt.nextElementSibling,last=!!bt&&(!nx||nx.classList.contains('loc')||nx.classList.contains('fpls'));
          const chg=()=>vis(v.querySelector('.chgtxt'));const c1=chg();
          v.querySelector('[data-pv="g"]').click();const c0=chg();v.querySelector('[data-pv="inf"]').click();const d0=vis(v.querySelector('.sc .bdt'));
          S.pv=pv;store('pv',JSON.stringify(pv));pvApply();chgSave(o);S.meta.bd=keep;render();return {keys,txt,u,sep,last,c1,c0,d0}})()""")
        check("Drehplan: Szenen-Details als Fliesstext über der Adresse (« // »), runder Info-Knopf und Änderungen-Knopf",
              ct in (None, {"keys": "i,d,c,inf,a,b,g", "txt": "FX: Double BJCrew: LifeguardProps: Knife, Stone (soft, dummy)Mup/Hair: Mike dyingNotes: a / b", "u": True, "sep": '" // "', "last": True, "c1": True, "c0": False, "d0": False}), ct, public=True)
        pko = await E("""(async()=>{if(typeof scriptData==='function')await scriptData().catch(()=>{});if(!window.SCRIPT&&typeof SCRIPT==='undefined')return null;S.tab='script';S.sq='';const r={};
          for(const m of ['sc','day','loc','person','all']){S.sqm=m;render();r[m]=document.querySelectorAll('#view [data-sqpick]').length>0}
          S.sqm='all';render();r.more=!document.querySelector('#view [data-sqmore]');return r})()""")
        check("Drehbuch-Suche: Vorauswahl für Szene, Tag, Motiv (Person wenn Callsheets da), nicht bei Alle; immer alle Szenen", pko in (None, {"sc": True, "day": True, "loc": True, "person": pko and pko.get("person"), "all": False, "more": True}), pko, public=True)
        scr = await E("""(async()=>{const d=S.days.find(x=>x.kind==='shoot'&&arr(x.items).some(i=>i.sc));if(!d||typeof openScene!=='function')return null;const it=arr(d.items).find(i=>i.sc);const keep=S.meta.bd,sv=Object.assign({},S.sv);
          S.meta.bd={[d.date+'|'+bdKey(it.sc)]:{h:{},c:[['Props',['Knife']]]}};S.sv.inf=false;await openScene(it.sc);await new Promise(r=>setTimeout(r,400));
          const box=document.getElementById('scn');if(!box)return 'kein Fenster';const vis=e=>!!e&&getComputedStyle(e).display!=='none';const a=vis(box.querySelector('.spf1 .bdt'));
          const b=box.querySelector('[data-sv="inf"]');if(b)b.click();const on=vis(document.getElementById('scn').querySelector('.spf1 .bdt'));
          const c=document.querySelector('#scn [data-scnclose]');if(c)c.click();S.sv=sv;store('sv',JSON.stringify(sv));S.meta.bd=keep;render();return {a,btn:!!b,on}})()""")
        check("Drehbuch-Fenster: Info-Knopf zeigt die Szenen-Details", scr in (None, {"a": False, "btn": True, "on": True}), scr, public=True)
        nw = await E("""(async()=>{const d=S.days.find(x=>x.kind==='shoot'&&arr(x.items).some(i=>i.sc));if(!d)return null;const it=arr(d.items).find(i=>i.sc);const sv=Object.assign({},S.sv),keep=S.meta.bd,kb=S.meta.blocking,bm=S.meta.bm;
          const r={};
          /* extras (XX) go with the cast button */
          S.meta.bd={[d.date+'|'+bdKey(it.sc)]:{h:{XX:'6xPolice'},c:[]}};S.tab='plan';S.day=d.id;render();const vis=e=>!!e&&getComputedStyle(e).display!=='none';
          const x=document.querySelector('#view .sc .bdx');r.xx=vis(x);document.querySelector('#view [data-pv="c"]').click();r.xxOff=!vis(document.querySelector('#view .sc .bdx'));document.querySelector('#view [data-pv="c"]').click();
          /* English scene titles with the flag button (script list) */
          if(typeof spTitle==='function'&&typeof SCRIPT!=='undefined'&&SCRIPT){const sx=SCRIPT.find(y=>spHeadEn(y));if(sx){S.sv.e=false;S.tab='script';S.sq=String(sx.sc);S.sqm='sc';render();const t=document.querySelector('#view .sct.en');
            r.de=vis(t&&t.querySelector('.hde'))&&!vis(t&&t.querySelector('.hen'));document.querySelector('#view .svtab [data-sv="e"]').click();const t2=document.querySelector('#view .sct.en');r.en=vis(t2&&t2.querySelector('.hen'))&&!vis(t2&&t2.querySelector('.hde'))}}
          /* the search starts again with «Alle» when the script tab is opened */
          S.sqm='role';goTab('script');r.alle=S.sqm==='all'&&!S.sq;
          /* gallery: no slideshow; PDF pages fill the screen */
          S.meta.bm=[];S.meta.blocking=[{name:'T',sc:['1'],url:'https://www.dropbox.com/x',media:[{t:'img',n:'a',f:'blk/a',u:'u'},{g:'pdf',t:'img',n:'P · 1/1',f:'blk/p',u:'u'}]}];
          if(typeof openGallery==='function'){openGallery(S.meta.blocking[0]);r.noshow=!document.querySelector('#blkgal [data-gshow]');document.querySelectorAll('#blkgal').forEach(z=>z.remove());
            openGallery(S.meta.blocking[0],0,'P');r.pdf=!!document.querySelector('#blkgal.galpdf');document.querySelectorAll('#blkgal').forEach(z=>z.remove())}
          S.sv=sv;store('sv',JSON.stringify(sv));S.meta.bd=keep;S.meta.blocking=kb;S.meta.bm=bm;S.sq='';S.sqm='all';S.tab='plan';render();return r})()""")
        check("Neu: Extras mit Cast-Knopf, englische Titel mit EN-Knopf, Suche startet bei «Alle», Galerie ohne Diashow, PDF bildschirmfüllend",
              nw is None or (nw.get("xx") and nw.get("xxOff") and nw.get("alle") and nw.get("noshow") and nw.get("pdf") and nw.get("de", True) and nw.get("en", True)), nw, public=True)
        acp = await E("""(()=>{if(typeof showAcct!=='function'||!ME)return null;ACSUB='app';showAcct();const r=ACSUB==='pro';S.tab='today';render();return r})()""")
        check("Mein Konto öffnet immer im Profil", acp in (None, True), acp, public=True)
        med = await E("""(()=>{if(typeof window.loadMedia!=='function')return 'fehlt';const keep=S.meta;const bm=[{f:'blk/x'}];
          S.meta=Object.assign({},keep,{bm,bmh:'h1',bmLoaded:'h1'});const d={days:S.days,crew:S.crew,locations:S.locs,places:S.places,dispos:S.dispos,meta:Object.assign({},keep,{bmh:'h1'})};delete d.meta.bm;
          applyData(d);const same=S.meta.bm===bm;S.meta=keep;MEMO.clear();render();return same})()""")
        check("Start: Bilderliste der Galerien als eigene Datei, gleiche Liste bleibt ohne Nachladen", med in (None, True), med, public=True)
        gal = await E("""(()=>{if(typeof window.blkImg!=='function')return null;const keep=S.meta.blocking,kb=S.meta.bm;S.meta.bm=[];
          S.meta.blocking=[{name:'Scene_186',sc:['186'],url:'https://www.dropbox.com/x',media:[{t:'img',n:'allg',f:'blk/a',u:'u'},{t:'img',n:'teil1',f:'blk/b',u:'u',p:'186pt1'},{t:'img',n:'party',f:'blk/c',u:'u',p:'186pt2'}]}];
          const w=document.createElement('div');w.innerHTML=fpLinks([],blkFor('186pt1A'));document.body.appendChild(w);const a=w.querySelector('[data-blkg]');if(a)a.click();
          const g=document.getElementById('blkgal');const txt=g?g.textContent:'';const r={open:!!g,party:txt.includes('party')||(!!g&&(g.innerHTML.includes('blk/c')||g.innerHTML.includes('party'))),teil:txt.includes('teil1')||(g&&g.innerHTML.includes('blk/b'))};
          document.querySelectorAll('#blkgal').forEach(x=>x.remove());w.remove();S.meta.blocking=keep;S.meta.bm=kb;return r})()""")
        check("Galerie: Szene 186pt1A zeigt keine Bilder von 186pt2", gal in (None, {"open": True, "party": False, "teil": gal and gal.get("teil")}), gal, public=True)
        two = await E("""(()=>{if(typeof window.blkImg!=='function')return null;const keep=S.meta.blocking,kb=S.meta.bm;S.meta.bm=[];
          S.meta.blocking=[{name:'Scene_77',sc:['77'],url:'https://www.dropbox.com/home/A/Scene_77',media:[{t:'img',n:'a',f:'blk/a',u:'u'}]},{name:'AUF 77',sc:['77'],url:'https://www.dropbox.com/home/B/AUF_77',media:[{t:'img',n:'b',f:'blk/b',u:'u'},{t:'img',n:'c',f:'blk/c',u:'u'}]}];
          const w=document.createElement('div');w.innerHTML=fpLinks([],blkFor('77'));document.body.appendChild(w);const n=w.querySelectorAll('[data-blkg],[data-blkgs]').length;
          const a=w.querySelector('[data-blkgs]');if(a)a.click();const p=document.getElementById('fldpick');const ch=p?p.querySelectorAll('[data-gi]').length:0;const txt=p?p.textContent:'';
          if(p){p.querySelector('[data-gi="1"]').click()}const g=document.getElementById('blkgal');const open=!!g;
          document.querySelectorAll('#blkgal,#fldpick').forEach(x=>x.remove());w.remove();S.meta.blocking=keep;S.meta.bm=kb;return {n,ch,path:txt.includes('AUF_77'),open}})()""")
        check("Galerie: zwei Bilderordner → ein Kamera-Knopf, Auswahl mit Ordnerpfad", two in (None, {"n": 1, "ch": 2, "path": True, "open": True}), two, public=True)
        # ---------- fixes from the code review (19.10.) ----------
        fx = await E("""(async()=>{const r={};
          /* contacts of the crew list: merged by position + name, values as text */
          const cr=[{people:[{name:'A'},{name:'B'}]}];r.merge=contactsMerge(cr,[[0,0,'A',{phone:4179}],[0,1,'X',{phone:'1'}]])===1&&cr[0].people[0].phone==='4179'&&!cr[0].people[1].phone;
          /* search highlighting: escaped once, overlapping terms in one mark */
          r.mark=markTerms("l'ami mark",['ma','ar'],1)==="l&#39;ami <mark>mar</mark>k";
          /* prep lists: names are people, not departments («Anton» ≠ Ton, «Allegra» ≠ alle) */
          r.grp=groupPeople('Anton Meier',[])===null&&groupPeople('Allegra',[])===null&&!!groupPeople('Ton',mailPeople())===(S.crew.some(g=>/^ton/.test(fold(g.dept||''))))&&!!groupPeople('alle',[]);
          r.find=findPerson('Sabine',[{name:'',email:'x@y.ch',k:''}])===null;
          /* night shoot: end after midnight is the next day */
          const ics=makeICS('2026-10-20',{t:'20:00',end:'03:00',n:'Nacht'});const ds=(ics.match(/DTSTART:(\\d+T\\d+)/)||[])[1],de=(ics.match(/DTEND:(\\d+T\\d+)/)||[])[1];r.night=!!ds&&!!de&&de>ds;
          /* callsheet data from the language model: odd values do not break the view */
          const cd=CLEAN.dispos([{date:'2026-10-20',contacts:[{name:'X',phone:4179}],calls:[null,{dept:'Cam',t:'9:00'}],meals:'x'}])[0];r.clean=cd.contacts[0].phone==='4179'&&cd.calls.length===1&&Array.isArray(cd.meals);
          /* today = the date in Switzerland */
          r.zh=localISO(Date.UTC(2026,9,19,22,30))==='2026-10-20';
          /* simulation: nothing is written, not even through buttons */
          const keep=SIMUSER;SIMUSER={email:'x'};let blocked=false;try{const {F,db}=await fb();await F.setDoc(F.doc(db,'prefs','simtest'),{a:1})}catch(e){blocked=e.code==='simulation'}SIMUSER=keep;r.sim=blocked&&!window.__db['prefs/simtest'];
          /* weather: a failed try waits an hour (no endless reload without reception) */
          const wk=Object.keys(WX)[0];r.wx=!wk||!WX[wk].err||Date.now()-WX[wk].at<3600e3;
          /* messages: a newer one is not hidden by the timer of an older one */
          showMsg('alt',50);showMsg('neu',0);await new Promise(x=>setTimeout(x,120));r.msg=!$('#refmsg').hidden&&$('#refmsg').textContent==='neu';$('#refmsg').hidden=true;
          return r})()""")
        for k, n in (("merge", "Kontakte: Telefon/E-Mail aus der eigenen Datei richtig zugeordnet"), ("mark", "Suche: Hervorhebung zerstört die Anzeige nicht"),
                     ("grp", "Prep: Namen wie «Anton» oder «Allegra» sind Personen, keine Abteilung"), ("find", "Prep: Einträge ohne Namen passen zu keinem Vornamen"),
                     ("night", "Nachtdreh: Ende nach Mitternacht am nächsten Tag (Kalender)"), ("clean", "Callsheet: ungewohnte Daten brechen die Ansicht nicht"),
                     ("zh", "Heute: Datum nach Schweizer Zeit"), ("sim", "Simulation: es wird nichts gespeichert, auch nicht über Knöpfe"),
                     ("wx", "Wetter: nach einem Fehler erst nach einer Stunde neu"), ("msg", "Meldungen: neuere Meldung bleibt stehen")):
            check(n, bool(fx.get(k)), fx, public=True)
        tz = await E("""(()=>{const d=todayDay();if(!d||d.kind!=='shoot')return null;
          /* a day with a callsheet shows the callsheet tiles (Crew Call … Wrap) instead */
          if((S.dispos||[]).some(x=>x&&x.date===d.date&&x.cs)){S.tab='today';render();return !!document.querySelector('.today .tcs .cstiles .dt.big')}const keep={h:d.hours,u:d.unit2};d.hours='07:00–19:00';d.unit2={src:'also',hours:'08:00–18:00',items:[]};
          S.tab='today';MEMO.clear();render();const t=[...document.querySelectorAll('.today .ttile')].map(x=>x.textContent);d.hours=keep.h;if(keep.u===undefined)delete d.unit2;else d.unit2=keep.u;MEMO.clear();render();
          return t.some(x=>x.includes('07:00–19:00')&&x.includes('1st Unit'))&&t.some(x=>x.includes('08:00–18:00')&&x.includes('2nd Unit'))})()""")
        check("Today: Kachel Drehzeit (1st/2nd Unit), mit Callsheet die Callsheet-Kacheln", tz in (None, True), tz, public=True)
        ra = await E("""(()=>{const d=S.days.find(x=>x.kind==='shoot');if(!d)return null;const keep=S.meta.ra,kp=MYPERMS.slice();S.meta.ra=[{date:d.date,name:'Szene 186',url:'https://www.dropbox.com/x'}];
          const h1=raHTML(d.date);const sim=SIMROLE,kr=MYROLE;SIMROLE={adm:false};MYROLE='testrolle';MYPERMS=['view.dispo'];const h2=raHTML(d.date);SIMROLE=sim;MYROLE=kr;MYPERMS=kp;S.meta.ra=keep;
          const w=document.createElement('div');w.innerHTML=h1;const det=w.querySelector('details.rasec');return {zu:!!det&&!det.open,txt:!!det&&det.textContent.includes('Szene 186'),ohne:h2===''}})()""")
        check("Callsheet: Gefährdungsbeurteilung aufklappbar, zugeklappt, nur mit Recht", ra in (None, {"zu": True, "txt": True, "ohne": True}), ra, public=True)
        cs = await E("""(()=>{const d=S.days.find(x=>x.kind==='shoot'&&arr(x.items).some(i=>i.sc));if(!d||typeof renderCS!=='function')return null;
          const x={date:d.date,label:'T',cs:{times:{crewCall:'08:00',wrap:'19:00'},contact:{name:'A',phone:'+41 79 000 00 00'},locations:[{no:'1',name:'CHAPEL',map:'https://maps.app.goo.gl/x'}],
            order:{rows:[{t:'09:00',sc:'2',ie:'I/Ev',set:'CHAPEL',syn:'S'},{t:'12:15',text:'Lunch Break'}]},cast:[{no:'1',role:'BAX',actor:'X'}],calls:[{dept:'Camera',name:'Y',t:'08:10'}]}};
          const w=document.createElement('div');w.innerHTML=renderCS(x,d);const open=[...w.querySelectorAll('details.cssec')].map(e=>[e.querySelector('.dh').textContent,e.open]);
          const sim=SIMROLE,kr=MYROLE,kp=MYPERMS.slice();SIMROLE={adm:false};MYROLE='t';MYPERMS=['view.dispo'];const w2=document.createElement('div');w2.innerHTML=renderCS(x,d);SIMROLE=sim;MYROLE=kr;MYPERMS=kp;
          return {tiles:w.textContent.includes('08:00')&&w.textContent.includes('19:00'),order:!!w.querySelector('.csorder details.csscd'),
            locOpen:open.some(([t,o])=>/Location/i.test(t)&&o),castClosed:open.some(([t,o])=>t==='Cast'&&!o),tel:!!w.querySelector('a[href^="tel:"]'),noTel:!w2.querySelector('a[href^="tel:"]')&&!w2.textContent.includes('000 00 00')}})()""")
        check("Callsheet wie das Dokument: Zeiten, Drehfolge, Locations-Liste sichtbar, Cast zu, Telefon nur mit Recht",
              cs in (None, {"tiles": True, "order": True, "locOpen": True, "castClosed": True, "tel": True, "noTel": True}), cs, public=True)
        # locations L1, L2 …; map popup: every scene with start and end; set floorplans; 2nd unit camera data; Test-User welcome
        nx = await E("""(()=>{if(typeof renderCS!=='function')return null;const x={date:'2026-10-20',cs:{geo:{'https://a':[46.3,7.6],'https://b':[46.31,7.65]},
            locations:[{no:'1',name:'CHAPEL',map:'https://a'},{no:'2',name:'FOREST',map:'https://b'}],
            order:{rows:[{t:'08:30',sc:'186pt1A',set:'CHAPEL'},{t:'10:45',sc:'2',set:'CHAPEL'},{t:'12:15',text:'Lunch'},{t:'13:15',sc:'12',set:'FOREST'},{t:'16:00',sc:'9999',set:'FOREST',notes:'Drohne ab 09:00'},{t:'18:00',text:'Wrap'}]}}};
          const w=document.createElement('div');w.innerHTML=renderCS(x,{date:'2026-10-20'});const m=w.querySelector('[data-csmap]');const pts=m?JSON.parse(m.dataset.csmap):[];
          const dts=[...w.querySelectorAll('.csorder details.scdet')];
          return {det:dts.length>0&&dts.every(d=>!d.open&&d.classList.contains('cs3'))&&dts.some(d=>d.textContent.includes('Drohne'))&&!w.querySelector('.csnote')&&!w.querySelector('.csorder dl.csdet'),codes:[...w.querySelectorAll('.csloc-c')].map(e=>e.textContent),st:(pts.find(p=>p.c==='L1')||{}).st||[],st2:(pts.find(p=>p.c==='L2')||{}).st||[]}})()""")
        check("Callsheet: Locations heissen L1, L2 …", nx is None or nx["codes"][:2] == ["L1", "L2"], nx)
        tv = await E("""(()=>{if(typeof renderCS!=='function')return null;const x={date:'2030-05-06',cs:{total:'TOTAL: 9 || CREW: 4 CAST: 1 EXTRAS: 0 ZUSATZ: 0',key:[{role:'Director',name:'A'}],cast:[{no:'1',role:'BAX',actor:'X'},{no:'2',role:'PIRMIN',actor:'Y'}],
            travel:[{how:'Zug',name:'Anna Muster',from:'Bern',to:'Sierre',date:'2030-05-06'},{how:'Multivan',name:'Ben Test',from:'Hotel',to:'Zurich',date:'2030-05-07'}],order:{rows:[]}}};
          const w=document.createElement('div');w.innerHTML=renderCS(x,{date:x.date});const tr=[...w.querySelectorAll('.cstrv')];
          return {hint:!!w.querySelector('#cs-team .cscount .cshint'),order:tr.map(e=>e.classList.contains('trvother')),date:!!w.querySelector('.cstrv.trvother .trvd')}})()""")
        check("Callsheet: Cast gezählt mit Hinweis auf abweichende Totalzeile; Anreise eines anderen Tages separat mit Datum", tv in (None, {"hint": True, "order": [False, True], "date": True}), tv)
        al = await E("""(()=>{if(typeof renderCS!=='function')return null;const x={date:'2030-05-06',cs:{geo:{'loc:1':[46.31,7.57],'https://g/b':[46.312,7.571]},geoSrc:{'loc:1':'addr','https://g/b':'link'},
            locations:[{no:'1',name:'OFFICE',items:[{label:'W / H / M',text:'Cast + Lunch: Base Church, Dorfplatz 5',map:'https://g/b'},{label:'Tech Parking',text:'',map:'https://g/b'}]},{no:'2',name:'OPEN SPACE'}],order:{rows:[]}}};
          const w=document.createElement('div');w.innerHTML=renderCS(x,{date:x.date});const m=w.querySelector('[data-csmap]');const pts=m?JSON.parse(m.dataset.csmap):[];
          return {codes:pts.filter(p=>!p.m).map(p=>p.c).filter(c=>/^L/.test(c)).sort(),l2rough:(pts.find(p=>p.c==='L2')||{}).r===2,park:pts.some(p=>p.m)}})()""")
        check("Callsheet-Karte: jede Location L1, L2 … erscheint (ohne Kartenlink über die Adresse, sonst ungefähr)", al in (None, {"codes": ["L1", "L2"], "l2rough": True, "park": True}), al)
        mo = await E("""(()=>{if(typeof renderCS!=='function')return null;const k=window.CSMAPON;const x={date:'2030-05-06',cs:{geo:{'https://g/a':[46.3,7.6]},locations:[{no:'1',name:'A',map:'https://g/a'}],order:{rows:[]}}};
          window.CSMAPON=false;const off=renderCS(x,{date:x.date}).includes('cs-karte');window.CSMAPON=true;const on=renderCS(x,{date:x.date}).includes('cs-karte');window.CSMAPON=k;return {off,on}})()""")
        gm = await E("""(()=>{if(typeof csGmFeat!=='function')return null;const k=S.gmap;
          S.gmap={l:['A','B'],f:[{l:'A',n:'Base',g:'p',x:[[46.3,7.6]],c:'#ff0000'},{l:'A',n:'Gleich',g:'p',x:[[46.3002,7.6001]]},{l:'A',n:'Nah',g:'p',x:[[46.31,7.61]],c:'#00ff00'},{l:'A',n:'Nah',g:'p',x:[[46.31,7.61]]},{l:'A',n:'Weit',g:'p',x:[[47.3,8.6]]},{l:'B',n:'Ebene B',g:'p',x:[[46.305,7.605]]},{l:'A',n:'Weg',g:'l',x:[[46.3,7.6],[46.4,7.7]]}]};
          const pts=[{p:[46.3,7.6],c:'Base',n:'Base'}];const a=csGmFeat(pts,{on:true,color:true,off:['B']}).map(f=>f.n),b=csGmFeat(pts,{on:true,color:false,off:[]});S.gmap=k;
          return {a,b:b.map(f=>f.n),col:b.every(f=>!f.c)}})()""")
        check("Callsheet-Karte: Google-Karte ohne doppelte Punkte, nur in der Nähe, Ebenen und Farben wählbar", gm in (None, {"a": ["Nah", "Weg"], "b": ["Nah", "Ebene B", "Weg"], "col": True}), gm, public=True)
        rpt = await E("""(()=>{if(typeof reportsSec!=='function'||typeof repDay!=='function')return null;const k={m:S.meta&&S.meta.reports,c1:window.canRep,c2:window.canRepAny};S.meta=S.meta||{};window.canRep=()=>true;window.canRepAny=()=>true;
          S.meta.reports=[{g:'DIT',n:'SD01_261020_Clips Report',d:'2026-10-21',f:['blk/a.bin'],pdf:'blk/a.pdf.bin',u:'https://x'},{g:'Production report',n:'TSCH3D_production_report_1_2026_10_20',d:'2026-10-22',f:['blk/b.bin'],pdf:'',u:'https://x'}];repPermsSync();
          const perms=PERMS.filter(x=>x[2]==='Reports').map(x=>x[0]).sort();const days=S.meta.reports.map(r=>repDay(r).date);
          const all=reportsSec(),boxes=(all.match(/data-lsec="rep-/g)||[]).length,titles=repGroups().map(repTitle);
          S.meta.reports=k.m;window.canRep=k.c1;window.canRepAny=k.c2;return {perms,days,boxes,titles}})()""")
        check("Reports: ein Recht und eine Box pro Unterordner, Drehtag aus dem Dateinamen, Unterthemen Produktion/DIT", (rpt is None or ({"rep.dit", "rep.production-report", "scenes.log"} <= set(rpt["perms"]) and rpt["days"] == ["2026-10-20", "2026-10-20"] and rpt["boxes"] >= 3 and rpt["titles"][:1] == ["Produktion"] and "DIT" in rpt["titles"])), rpt, public=True)
        cdt = await E("""(()=>{if(typeof cdTransform!=='function')return null;const k={o:window.CDOPS,m:S.meta,d0:S.days0,d:S.days,p0:S.dispos0,p:S.dispos};
  const D=[{date:'2031-03-02',kind:'shoot',label:'Day #1',short:'D1',sr:'07:00',items:[{sc:'1'}],unit2:{items:[{sc:'90'}]}},{date:'2031-03-03',kind:'shoot',label:'Day #2',short:'D2',sr:'07:01',items:[{sc:'2'}]},
    {date:'2031-03-04',kind:'off',label:'Day Off'},{date:'2031-03-05',kind:'shoot',label:'Day #3',short:'D3',items:[{sc:'3'}]},{date:'2031-03-06',kind:'shoot',label:'Day #4',short:'D4',items:[{sc:'4'}]}];
  S.meta={sources:[{kind:'schedule',modified:'2031-01-01T00:00:00Z'}]};const t=Date.parse('2031-02-01');const sc=(days,dt,u)=>cdScenes(days.find(x=>x.date===dt),u);
  window.CDOPS=[{id:'a',op:'swap',u:'all',a:'2031-03-02',b:'2031-03-03',at:t,st:'on',snap:{a:'1',b:'2'}}];let r=cdTransform(D);const swap=[sc(r,'2031-03-02'),sc(r,'2031-03-03'),r.find(x=>x.date==='2031-03-02').sr,r.find(x=>x.date==='2031-03-02').short,r.find(x=>x.date==='2031-03-03').short,r.find(x=>x.date==='2031-03-02').label];
  window.CDOPS=[{id:'b',op:'move',u:'all',a:'2031-03-03',b:'2031-03-04',at:t,st:'on',snap:{a:'2',b:''}}];r=cdTransform(D);const move=[sc(r,'2031-03-03'),sc(r,'2031-03-04'),r.find(x=>x.date==='2031-03-04').kind];
  window.CDOPS=[{id:'c',op:'shift',u:'all',a:'2031-03-03',at:t,st:'on',snap:{a:'2'}}];r=cdTransform(D);const shift=['2031-03-03','2031-03-05','2031-03-06','2031-03-07'].map(d=>sc(r,d)+'/'+(r.find(x=>x.date===d).short||''));
  window.CDOPS=[{id:'d',op:'move',u:'2',a:'2031-03-02',b:'2031-03-03',at:t,st:'on',snap:{a:'90',b:''}}];r=cdTransform(D);const u2=[sc(r,'2031-03-02','2'),sc(r,'2031-03-03','2'),sc(r,'2031-03-02')];
  window.CDOPS=[{id:'a',op:'swap',u:'all',a:'2031-03-02',b:'2031-03-03',at:t,st:'on',snap:{a:'1',b:'2'}}];S.days0=D;S.dispos0=[{date:'2031-03-02',file:'c1.pdf',label:'Day 1',scenes:[{sc:'1'}]},{date:'2031-03-03',file:'c2.pdf',label:'Day 2',scenes:[{sc:'2'}]}];cdApplyAll();
  const csm=S.dispos.map(x=>x.date.slice(8)+':'+x.file+':'+x.label).join(' ');
  /* newer Drehplan: the change waits, the proposal says whether it is already in */
  S.meta={sources:[{kind:'schedule',modified:'2031-02-05T00:00:00Z'}]};window.CDOPS=[{id:'a',op:'swap',u:'all',a:'2031-03-02',b:'2031-03-03',at:t,st:'on',snap:{a:'1',b:'2'}}];
  S.days0=D;const keep=!cdReview(window.CDOPS[0]);S.days0=[Object.assign({},D[0],{items:[{sc:'2'}]}),Object.assign({},D[1],{items:[{sc:'1'}]})];const rv=cdReview(window.CDOPS[0]),same=cdTransform(D)===D;const prop=cdProposal(window.CDOPS[0])[0];
  window.CDOPS=k.o;S.meta=k.m;S.days0=k.d0;S.days=k.d;S.dispos0=k.p0;S.dispos=k.p;return {swap,move,shift,u2,csm,keep,rv,same,prop}})()""")
        check("Coverday: Tauschen, Verschieben, Nachrücken (auch nur 2nd Unit), Drehtag-Nummern folgen wieder dem Datum, Callsheets wandern mit ihren Szenen; ein neuerer Drehplan hat Vorrang, wenn er diese Tage ändert (mit Vorschlag)", cdt in (None, {"swap": ["2", "1", "07:00", "D1", "D2", "Day #1"], "move": ["", "2", "shoot"], "shift": ["/", "2/D2", "3/D3", "4/D4"], "u2": ["", "90", "1"], "csm": "02:c2.pdf:Day 1 03:c1.pdf:Day 2", "keep": True, "rv": True, "same": True, "prop": "same"}), cdt, public=True)
        cdm = await E("""(async()=>{if(typeof cdSave!=='function'||typeof ownEnc!=='function')return null;const k={o:window.CDOPS,d:window.__db['coverday/state']};
          window.__db['coverday/state']={c:await ownEnc({ops:[{id:'x1',op:'swap',u:'all',a:'2031-01-01',b:'2031-01-02',st:'on'},{id:'x0',op:'swap',u:'all',a:'2031-01-03',b:'2031-01-04',st:'off',raw:{l:['big']}}]}),at:1};
          window.CDOPS=[];await cdSave(l=>l.push({id:'y1',op:'swap',u:'all',a:'2031-02-01',b:'2031-02-02',st:'on'}));const ids=window.CDOPS.map(o=>o.id).join(','),raw=!!(window.CDOPS.find(o=>o.id==='x0')||{}).raw;
          if(k.d)window.__db['coverday/state']=k.d;else delete window.__db['coverday/state'];window.CDOPS=k.o;cdApplyAll();render();return {ids,raw}})()""")
        check("Coverday: Speichern auf dem neuesten Stand (keine Änderung eines anderen Geräts verloren), aufgehobene ohne Tageskopie", cdm in (None, {"ids": "x1,x0,y1", "raw": False}), cdm, public=True)
        check("App-Einstellungen: Karte im Callsheet ein- und ausschaltbar", mo in (None, {"off": False, "on": True}), mo)
        check("Callsheet-Drehfolge: Szene in drei Schritten, alle Details (Breakdown/Notizen) erst im dritten Schritt", nx is None or nx["det"], nx)
        dup = await E("""(()=>{if(typeof renderCS!=='function'||typeof bdKey!=='function')return null;const keep=S.meta;const k='2026-10-20|'+bdKey('186pt1A');S.meta=Object.assign({},keep,{bd:Object.assign({},(keep||{}).bd,{[k]:{h:{},c:[['Notes',['Drohne ab 09:00']]]}})});
          const x={date:'2026-10-20',cs:{locations:[{no:'1',name:'CHAPEL'}],order:{rows:[{t:'08:30',sc:'186pt1A',set:'CHAPEL',notes:'Drohne ab 09:00'}]}}};const w=document.createElement('div');w.innerHTML=renderCS(x,{date:'2026-10-20'});S.meta=keep;
          return (w.querySelector('.csorder').textContent.match(/Drohne/g)||[]).length})()""")
        check("Callsheet-Drehfolge: Szenendetails nur einmal (Breakdown und Callsheet-Notizen nicht doppelt)", dup in (None, 1), dup)
        check("Callsheet-Karte: Pop-up zeigt jede Szene mit Anfangs- und Schlusszeit", nx is None or (nx["st"] == [["186pt1A", "08:30–10:45"], ["2", "10:45–12:15"]] and nx["st2"] == [["12", "13:15–16:00"], ["9999", "16:00–18:00"]]), nx)
        sf = await E("""(()=>{if(typeof setfpHTML!=='function'||!vok('setfp'))return null;const keep=S.meta;S.meta=Object.assign({},keep,{setfp:[{date:'2026-10-20',name:'Floorplans',k:'fp',url:'https://www.dropbox.com/preview/x.pdf'},{date:'2026-10-20',name:'Motif See',k:'motif',url:'https://www.dropbox.com/preview/y.pdf',pdf:'blk/abc.pdf.bin'}]});
          const h=setfpHTML('2026-10-20'),h0=setfpHTML('2026-10-21');S.meta=keep;return {sec:h.includes('id="cs-att"'),link:h.includes('x.pdf')&&h.includes('data-attpdf="blk/abc.pdf.bin"'),none:h0==='',perm:PERMS.some(p=>p[0]==='view.setfp')}})()""")
        check("Callsheet: Anhänge des Tages (Motivpläne im PDF-Viewer, Floorpläne), Berechtigung «Setfloorpläne sehen» in der Rollenverwaltung", sf in (None, {"sec": True, "link": True, "none": True, "perm": True}), sf)
        cx = await E("""(()=>{const h=itemHTML({sc:'5',t:'09:00',cam:'2nd Unit · Setups A-1',camx:['09:10 A-1 Wide']});const w=document.createElement('div');w.className='pv-no-d';w.innerHTML='<ol class="tl">'+h+'</ol>';document.body.appendChild(w);
          const c=w.querySelector('.camx');const r={camx:!!c&&c.textContent.includes('A-1 Wide'),meta:(w.querySelector('.cam')||{}).textContent||'',hidden:!!c&&getComputedStyle(c).display==='none'};w.remove();return r})()""")
        check("2nd Unit: Kameradaten unter dem Cast, mit «Szenendetails» ausblendbar", cx == {"camx": True, "meta": "2nd Unit", "hidden": True}, cx)
        tw = await E("""(()=>{if(typeof DOCDEF!=='object'||!DOCDEF.testwelcome)return 'no doc';const d=docGet('testwelcome',{vorname:'Anna'},'de'),f=docGet('testwelcome',{vorname:'Anna'},'fr');
          return {sub:!!d.subject,name:d.body.includes('Anna'),orig:/Originaldokument/.test(d.body),fr:f.body.includes('BETA')&&f.body!==d.body,ver:/^\\d+$/.test(twVer())}})()""")
        check("Willkommen Test-User: Standardtext in den Dokumenten (DE, FR), Platzhalter {vorname}", tw == {"sub": True, "name": True, "orig": True, "fr": True, "ver": True}, tw)
        wa = await E("""(()=>{if(typeof waInvite!=='function')return 'none';const u=waInvite('anna@example.org','Anna Muster','079 000 00 00'),u2=waInvite('anna@example.org','Anna','');
          const t=decodeURIComponent(u.split('text=')[1]||'');return {num:u.startsWith('https://wa.me/41790000000?text='),nonum:u2.startsWith('https://wa.me/?text='),mail:t.includes('anna@example.org'),name:t.includes('Anna'),app:t.includes(location.origin)}})()""")
        check("Einladung per WhatsApp: Text aus den Dokumenten, Nummer im internationalen Format", wa == {"num": True, "nonum": True, "mail": True, "name": True, "app": True}, wa)
        bw = await E("""(()=>{if(typeof csLocs!=='function')return null;const c={locations:[
            {no:'1',name:'CHAPEL',map:'https://g/a',items:[{label:'TECH PARKING',text:'10’ on foot',map:'https://g/b'},{label:'W / H / M',text:'Cast + Lunch: Restaurant Waldrand, Föhrenweg 160, 3999 Testdorf',map:'https://g/h'},{label:'',text:'To set 1: 4’ with car'},{label:'WC',text:'on base'},{label:'DIT/Prod',text:'',map:'https://g/h'}]},
            {no:'2',name:'FOREST',map:'https://g/d',items:[{label:'Private Cars Cast/ Extras',text:'Restaurant Waldrand (Base)',map:'https://g/h'}]}]};
          const ls=csLocs(c),k=ls.filter(l=>l.kinds);return {n:k.length,kinds:k[0]&&k[0].kinds.join('|'),name:k[0]&&k[0].name,notes:k[0]&&k[0].notes.length,set1:ls[0].items.length}})()""")
        check("Callsheet: Base, W/H/M, Lunch und Prod am selben Ort als eine Location, Anfahrt/WC dort", bw in (None, {"n": 1, "kinds": "Base|W / H / M Cast|Lunch|Prod|DIT", "name": "Restaurant Waldrand", "notes": 3, "set1": 1}), bw)
        dit = await E("""(()=>{if(typeof csLocs!=='function')return null;const c={locations:[{no:'1',name:'OFFICE',items:[{label:'W / H / M',text:'Cast + Lunch: Base Church, Dorfplatz 5 - 3998 Musterdorf',map:'https://g/b'}]},
            {no:'2',name:'OPEN SPACE',items:[{label:'DIT',text:'Turnhallenweg 4 - 3998 Musterdorf',map:'https://g/s'}]}]};
          const c2={locations:[{no:'1',name:'CHAPEL',items:[{label:'W / H / M',text:'Cast + Lunch: Restaurant Waldrand, Föhrenweg 160',map:'https://g/h'},{label:'DIT/Prod',text:'',map:'https://g/h'}]}]};
          const a=csLocs(c).filter(l=>l.kinds).map(l=>l.kinds.join('|')),b=csLocs(c2).filter(l=>l.kinds).map(l=>l.kinds.join('|'));return {other:a,same:b}})()""")
        check("Callsheet: DIT an anderem Ort = eigene Location, am selben Ort zusammen mit Base/Lunch", dit in (None, {"other": ["Base|W / H / M Cast|Lunch", "DIT"], "same": ["W / H / M Cast|Lunch|Prod|DIT"]}), dit)
        dit2 = await E("""(()=>{if(typeof csLocs!=='function')return null;const c={locations:[{no:'1',name:'OFFICE',map:'https://g/o',items:[{label:'DIT',text:'Room 1st floor',map:'https://g/o'}]}]};
          const ls=csLocs(c);return {own:ls.filter(l=>l.kinds).length,inset:(ls[0].items||[]).some(i=>i.label==='DIT')}})()""")
        check("Callsheet: DIT am Ort eines Sets steht beim Set, nicht als eigene Location", dit2 in (None, {"own": 0, "inset": True}), dit2)
        fb = await E("""(()=>{if(typeof csTilesHTML!=='function')return null;const me={name:'Anna Muster',hit:t=>/anna muster/i.test(String(t||''))};
          const c={times:{crewCall:'08:15'},calls:[{dept:'AD',name:'Anna Muster',t:'-'}],locations:[{no:'1',name:'OFFICE',map:'https://g/o',items:[{label:'W / H / M',text:'Cast + Lunch: Base Church, Dorfplatz 5 - 3998 Musterdorf',map:'https://g/b'}]}]};
          const w=document.createElement('div');w.innerHTML=csTilesHTML({date:'2030-05-06'},{date:'2030-05-06'},c,me);const d=w.querySelector('.csdrv');return d?d.querySelector('.k').textContent:''})()""")
        check("Callsheet-Kacheln: ohne sicheren Call-Ort «Anfahrt Base» zur Base des Tages", fb is None or (isinstance(fb, str) and fb.endswith(" Base")), fb)
        rx = await E("""(()=>{if(typeof myEvents!=='function'||typeof csMe!=='function')return null;const keep={d:S.dispos,cm:window.csMe};const t='2030-05-06';
          S.dispos=[{date:t,cs:{drivers:'Max Fahrer +41 76 000 00 01',transport:[{t1:'07:30',t2:'08:00',from:'Holiday Inn',to:'Base Church',vehicle:'Multivan 2',driver:'Max Fahrer',passengers:'Anna Muster, Lena Test'}]}}];
          window.csMe=()=>({name:'Anna Muster',hit:x=>/anna muster/i.test(String(x||''))});let ev=[];try{ev=myEvents({name:'Anna Muster',email:'',k:nmk('Anna Muster')}).filter(e=>e.ride)}catch(_){}
          S.dispos=keep.d;window.csMe=keep.cm;const e=ev[0]||{};return {driver:String(e.driver||'').startsWith('Max Fahrer'),pax:e.pax||''}})()""")
        check("Meine Termine: Fahrt mit Fahrer:in (und Telefon) und den anderen Mitfahrenden", rx in (None, {"driver": True, "pax": "Lena Test"}), rx)
        rs = await E("""(()=>{if(typeof csRideCell!=='function'||!window.rideState)return null;const keep=window.rideState;const r={t1:'07:30',t2:'08:00',from:'A',to:'B'};const out=[];
          const ka=window.rideAt,kp=window.canPerm;window.canPerm=()=>false;for(const st of [0,1,2]){window.rideState=()=>st;window.rideAt=()=>Date.now()-60e3;const c=csRideCell('2030-05-06',r);const h=typeof c==='string'?c:c.h;out.push(st?(h.includes('ridest rs'+st)&&h.includes('<svg')&&!h.includes('rsold')):(h.includes('ridest rs0')&&!h.includes('<svg')))}
          window.rideState=()=>2;window.rideAt=()=>Date.now()-25*60e3;const c2=csRideCell('2030-05-06',r);out.push((typeof c2==='string'?c2:c2.h).includes('rsold'));window.rideState=keep;window.rideAt=ka;window.canPerm=kp;return out})()""")
        check("Callsheet: Fahrt offen = leerer Kreis, läuft = Auto im Kreis, ausgeführt = Häkchen im Kreis, 20 Min. danach grau", rs in (None, [True, True, True, True]), rs)
        rb = await E("""(()=>{if(typeof csRideCell!=='function')return null;const kp=window.canPerm,ks=window.rideState,km=window.csMe;const r={t1:'07:30',t2:'08:00',from:'A',to:'B',driver:'Max Fahrer'};const kcm=CSCUR.me;CSCUR.me=undefined;window.rideState=()=>0;
          window.csMe=()=>({name:'X',hit:t=>false});window.canPerm=p=>p==='rides.manage';const mg=csRideCell('2030-05-06',r).h;window.canPerm=p=>p==='rides.confirm';const cf=csRideCell('2030-05-06',r).h;
          window.canPerm=()=>false;const no=csRideCell('2030-05-06',r).h;window.csMe=()=>({name:'Max Fahrer',hit:t=>/max fahrer/i.test(String(t||''))});const dr=csRideCell('2030-05-06',r).h;
          window.canPerm=kp;window.rideState=ks;window.csMe=km;CSCUR.me=kcm;return {mgr:/<button[^>]*data-rideack=/.test(mg)&&/rmgr/.test(mg),confirmOnly:!/<button/.test(cf),other:!/<button/.test(no),driver:/<button[^>]*data-rdrv="1"/.test(dr)}})()""")
        check("Callsheet: Kreis antippbar nur für Fahrten Manager (Pop-up) und die Fahrerin / den Fahrer (bestätigen)", rb in (None, {"mgr": True, "confirmOnly": True, "other": True, "driver": True}), rb)
        hm = await E("""(()=>{if(typeof csMapQ!=='function')return null;return {q:csMapQ('Bahnhof 1, Sion')==='https://www.google.com/maps/search/?api=1&query=Bahnhof%201%2C%20Sion',e:csMapQ('  ')==='',noinl:!document.querySelector('#view [onclick]')}})()""")
        check("Callsheet: Karten-Suchlink aus einer Hilfsfunktion, keine Inline-Klick-Handler", hm in (None, {"q": True, "e": True, "noinl": True}), hm)
        hn = await E("""(()=>{if(typeof csNowLoc!=='function')return null;const cc={locations:[{no:'1',name:'A',notes:['To set 1: 4 min walk','WC: Base']}]};const kl=S.locs;S.locs=[];const v=document.createElement('div');v.innerHTML=renderCS({date:'2030-05-06',cs:cc},{date:'2030-05-06'});S.locs=kl;const d=v.querySelector('details.csloc');
          const c={locations:[{no:'1',name:'A',scenes:'1'},{no:'2',name:'B',scenes:'2'}],order:{rows:[{t:'08:30',sc:'1'},{t:'12:00',text:'Lunch'},{t:'13:00',sc:'2'},{t:'18:00',text:'Wrap'}]}};const ls=csLocs(c);
          const at=(h,m)=>{const l=csNowLoc(c,'2030-05-06',ls,zurichUTC('2030-05-06',pad2(h)+':'+pad2(m)));return l?l.name:''};   /* the shooting time is Zurich time */
          return {icons:!d.querySelector('summary [data-cshn]'),texts:d.querySelectorAll(':scope>.cshnl').length===2,now:[at(8,0),at(9,0),at(12,30),at(14,0),at(18,30)].join(',')==',A,A,B,'}})()""")
        check("Callsheet: Hinweise (To set, WC) nur im aufgeklappten Teil, aktuelle Location «jetzt hier»", hn in (None, {"icons": True, "texts": True, "now": True}), hn)
        nm = await E("""(()=>{if(typeof csNear!=='function'||typeof csFilter!=='function')return null;
          const c={locations:[{no:'1',name:'Kapelle',scenes:'1',map:'u1'},{no:'2',name:'Wald',scenes:'2',map:'u2'},{kinds:['Base'],name:'Base',map:'u3'}],geo:{u1:[46.31,7.63],u2:[46.40,7.80],u3:[46.312,7.632]},
            order:{rows:[{t:'08:00',sc:'1',set:'Kapelle',cast:'1'},{t:'10:00',sc:'2',set:'Wald',cast:'2'},{t:'12:00',sc:'3',set:'WALD EXT',cast:'1'}]},cast:[{no:'1',actor:'Max Muster',role:'X'},{no:'2',actor:'Eva Test',role:'Y'}],calls:[{dept:'Licht',t:'07:00',name:'Max Muster'},{dept:'Licht',t:'07:00',name:'Eva Test'}]};
          const ls=csLocs(c),nr=csNear(c,ls,'');const n1=nr.get(ls.find(l=>l.no==='1'))||[];
          const keep=window.myIdentity,km=CSMINE;window.myIdentity=()=>({name:'Max Muster',src:'Licht'});
          const v=document.createElement('div');v.id='nmtest';v.innerHTML=renderCS({date:'2030-05-06',cs:c,link:'https://www.dropbox.com/preview/x.pdf'},{date:'2030-05-06'});document.body.appendChild(v);
          const cv=v.querySelector('.csview');const L3=[...cv.querySelectorAll('.csorder>li[data-sc]')].map(li=>(li.querySelector('.csplace')||{}).textContent||'');
          CSMINE=true;csFilter(cv);const sc=[...cv.querySelectorAll('.csorder>li[data-sc]')].filter(li=>!li.hidden).map(li=>li.dataset.sc).join(',');const calls=[...cv.querySelectorAll('.cscall-r')].filter(r=>!r.hidden).length;
          CSMINE=false;csFilter(cv);const all=[...cv.querySelectorAll('.cscall-r')].filter(r=>!r.hidden).length;const pdf=!!v.querySelector('[data-cspdf]'),btn=!!v.querySelector('[data-csmine]');
          v.remove();window.myIdentity=keep;CSMINE=km;
          return {near:n1.length===1&&n1[0].code==='Base'&&n1[0].d<1,loc3:L3.join(',')==='L1,L2,L2',mine:sc==='1,3'&&calls===1&&all===2,pdf,btn}})()""")
        check("Callsheet: Nebenorte mit Distanz beim Set, «Nur meins», PDF-Knopf, L-Code bei jeder Szene", nm in (None, {"near": True, "loc3": True, "mine": True, "pdf": True, "btn": True}), nm)
        w2 = await E("""(()=>{if(typeof csLocGroups!=='function'||typeof csRadioHTML!=='function')return null;
          const c={locations:[{no:'1',name:"OFFICE",scenes:'12',items:[{label:'Location',text:'Bahnweg 40 - 3998 Musterdorf',map:'mL'},{label:'Private Cars @ Base Church',text:'Dorfplatz 5 - 3998 Musterdorf',map:'mB'},{label:'W / H / M Cast + Lunch',text:'Base Church, Dorfplatz 5 - 3998 Musterdorf',map:'mB'}]},
            {no:'2',name:'OPEN SPACE W / H / M Extras: Turnhallenweg 4 - 3998 Musterdorf',scenes:'22',map:'mS',items:[{label:'DIT',text:'Turnhallenweg 4 - 3998 Musterdorf, Room 1st floor',map:'mS'}]}]};
          const ls=csLocs(c),k=ls.filter(l=>l.kinds).map(l=>l.kinds.map(csKindCode).join('|')),g=csLocGroups(c,ls,'');const r=csRadioHTML('Radio channel 1: AD / AL 2: Chat 3: Light');
          return {kinds:k.join(','),base:(ls.find(l=>l.kinds&&l.kinds.includes('Base'))||{}).name,set2:(ls.find(l=>l.no==='2')||{}).name,merged:g.filter(l=>!l.kinds).length===1&&g.find(l=>l._codes)._codes.join(',')==='L1,L2'&&(csOrderRows([{t:'09:00',sc:'12',set:'OFFICE'},{t:'10:00',sc:'22',set:'OPEN SPACE'}],'',ls).match(/>L[12]</g)||[]).join(',')==='>L1<,>L2<',radio:(r.match(/csrch/g)||[]).length}})()""")
        check("Callsheet: W/H/M für Cast und Extras getrennt, Sets (L-Codes) an derselben Adresse als eine Location, Szenen mit dem L-Code ihres Sets, Funkkanäle als Chips", w2 in (None, {"kinds": "Base|WHM Cast|Lunch,WHM Extras|DIT", "base": "Base Church", "set2": "OPEN SPACE", "merged": True, "radio": 3}), w2)
        w3 = await E("""(()=>{if(typeof csLocGroups!=='function')return null;
          const c={locations:[{no:'1',name:'XQZ OFFICE',scenes:'9991',map:'mL',items:[]},{no:'2',name:'XQZ SPACE',scenes:'9992',map:'mS',items:[{label:'W / H / M Extras',text:'Turnhallenweg 4 - 3998 Musterdorf',map:'mS'}]}]};
          const kl=S.locs;S.locs=[];/* without the app's location list (its addresses would decide) */const ls=csLocs(c),g=csLocGroups(c,ls,'');const m=g.find(l=>l._m);const h=renderCS({date:'2030-05-06',cs:c},{date:'2030-05-06'});S.locs=kl;
          return {set2map:(ls.find(l=>l.no==='2')||{}).map||'',merged:!!m&&m._m.length===2,title:/csmset[^]*L1[^]*XQZ OFFICE[^]*L2[^]*XQZ SPACE/.test(h)}})()""")
        check("Callsheet: Kartenlink eines Nebenorts gilt nicht für das Set; Sets gebündelt, Titel je L-Code mit Setbezeichnung", w3 in (None, {"set2map": "", "merged": True, "title": True}), w3)
        sq = await E("""(()=>{if(typeof csSceneLoc!=='function')return null;const c={locations:[{no:'1',name:'CHAPEL',scenes:''},{no:'2',name:'TANNEN FOREST (BUSHES)',scenes:'Seq. 186pt1A'},{no:'ER',name:'TANNEN FOREST (PARTY)',scenes:'Seq.186 pt1B/C/pt2'},{no:'4',name:"REGINA’S OFFICE"}]};const ls=csLocs(c);
          return ['2|ITALY - ISLAND - CHAPEL','186 pt1A|VALAIS - TANNEN FOREST','186 pt1B|VALAIS - TANNEN FOREST','186 pt2|VALAIS - TANNEN FOREST',"12|VALAIS - POLICE STATION - REGINA'S OFFICE"].map(t=>{const [sc,set]=t.split('|');const l=csSceneLoc(ls,{sc,set});return l?'L'+l.no:'-'}).join(',')})()""")
        check("Callsheet-Drehfolge: L-Code bei jeder Szene («Seq. 186 pt1B/C/pt2», anderer Apostroph)", sq in (None, "L1,L2,L3,L3,L4"), sq)
        sa = await E("""(()=>{if(typeof scAckBtn!=='function'||typeof csNowIdx!=='function')return null;const t=todayISO(),keep=window.SCACK,kp=window.canPerm;const rows=[{t:'00:01',sc:'1'},{t:'00:02',sc:'2'},{t:'00:03',text:'Lunch'},{t:'00:04',sc:'3'}];
          window.SCACK={};const a=csNowIdx(rows,t);window.SCACK={[scAckId(t,'1')]:{d:t,s:2,at:1}};const b=csNowIdx(rows,t);window.SCACK[scAckId(t,'2')]={d:t,s:1,at:1};const c=csNowIdx(rows,t);
          window.SCACK[scAckId(t,'2')].s=2;window.SCACK[scAckId(t,'3')]={d:t,s:2,at:1};const d=csNowIdx(rows,t);
          window.canPerm=p=>p==='scenes.see';const v=scAckBtn(t,'1');window.canPerm=p=>p==='scenes.ack';const w=scAckBtn(t,'3');window.SCACK=keep;window.canPerm=kp;
          return {a,b,c,d,view:/<span class="scack sk2"/.test(v)&&!/<button/.test(v),btn:/<button[^>]*data-scack=/.test(w),id:scAckId('2026-10-21','186 pt1A'),same:scAckId('2026-10-21','DJ 21 CONT')===scAckId('2026-10-21','21')}})()""")
        check("Drehplan und Callsheet: Szenen quittieren gemeinsam (offen → läuft → erledigt), «jetzt» folgt der Quittierung, Knopf nur mit Berechtigung", sa in (None, {"a": sa and sa["a"], "b": 1, "c": 1, "d": -1, "view": True, "btn": True, "id": "20261021-186pt1a", "same": True}), sa, public=True)
        # lunch ends by itself: begin + the planned lunch of that unit (Drehplan row, else 60 min); a scene started during lunch ends it
        la = await E("""(async()=>{if(typeof scLunchAuto!=='function')return null;const d=S.days.find(x=>x.kind==='shoot');if(!d)return null;
          const keep=JSON.stringify(window.SCACK),kp=window.canPerm;window.canPerm=()=>true;const id=scAckId(d.date,'lunch'),b=Date.now()-6*3600e3;
          window.SCACK={[id]:{d:d.date,s:1,b,u:'1',sc:'lunch'}};await scLunchAuto();const x=window.SCACK[id]||{};
          const r={s:x.s,dur:x.e?Math.round((x.e-b)/60000):-1,min:scLunchMin(d.date,'1')};
          window.SCACK={[id]:{d:d.date,s:1,b:Date.now(),u:'1',sc:'lunch'}};await scLunchAuto();r.early=(window.SCACK[id]||{}).s;
          window.SCACK=JSON.parse(keep);window.canPerm=kp;return r})()""")
        check("Lunch endet automatisch: Beginn + geplante Lunch-Dauer der Unit, nicht vorher",
              la is None or (la["s"] == 2 and la["dur"] == la["min"] and la["min"] > 0 and la["early"] == 1), la, public=True)
        re_ = await E("""(()=>{if(typeof rideEditApply!=='function')return null;const keep={d:S.dispos,e:window.RIDEEDIT,v:window.REDVER,cp:window.canPerm};const t='2030-05-06';
          const r0={t1:'07:30',t2:'08:00',from:'Hotel',to:'Base',vehicle:'Van 1',driver:'Max Fahrer',passengers:'Anna Muster'};S.dispos=[{date:t,cs:{transport:[r0]}}];
          const id=rideId(t,r0);window.RIDEEDIT={[id]:{t1:'07:45',passengers:'Anna Muster, Lena Test'}};window.REDVER=(window.REDVER||0)+1;rideEditApply();const r=S.dispos[0].cs.transport[0];
          const cell=csRideCell(t,r).h;window.canPerm=p=>p==='rides.manage';document.body.insertAdjacentHTML('beforeend','<div id="redtest">'+csRideCell(t,r).h+'</div>');document.querySelector('#redtest [data-rideack]').click();
          const dl=document.getElementById('rededlg');const out={t1:r.t1,pax:r.passengers,same:rideId(t,r)===id,mark:cell.includes('rchg'),dlg:!!dl&&dl.querySelector('[name=t1]').value==='07:45'};
          if(dl)dl.remove();document.getElementById('redtest').remove();S.dispos=keep.d;window.RIDEEDIT=keep.e;window.REDVER=keep.v+1;window.canPerm=keep.cp;return out})()""")
        check("Fahrten Manager: Änderung gilt im Callsheet (markiert), Pop-up zum Ändern", re_ in (None, {"t1": "07:45", "pax": "Anna Muster, Lena Test", "same": True, "mark": True, "dlg": True}), re_)
        pn = await E("""(()=>{if(typeof permLbl!=='function')return null;const k=window.PERMNAMES;window.PERMNAMES={'view.plan':'Plan ansehen'};const a=permLbl('view.plan','Drehplan sehen'),b=permLbl('view.prep','Prep sehen');
          window.PERMNAMES={'view.plan':''};const c=permLbl('view.plan','Drehplan sehen');window.PERMNAMES=k;return [a,b===__L('Prep sehen'),c===__L('Drehplan sehen')]})()""")
        check("Rollen: Name einer Option änderbar (leer = Standardname)", pn in (None, ["Plan ansehen", True, True]), pn)
        await E("""(()=>{if(typeof pdfView!=='function')return;const b=atob('JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCAzMDAgNDAwXS9Db250ZW50cyA0IDAgUi9SZXNvdXJjZXM8PD4+Pj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDI3Pj5zdHJlYW0KMCAwIDEgcmcgMjAgMjAgMjAwIDMwMCByZSBmCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTQgMDAwMDAgbiAKMDAwMDAwMDEwNSAwMDAwMCBuIAowMDAwMDAwMTk5IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA1L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMjczCiUlRU9G');window.pdfView(new Blob([Uint8Array.from(b,c=>c.charCodeAt(0))],{type:'application/pdf'}),'Test','t.pdf')})()""")
        await pg.wait_for_timeout(2500)
        pv = await E("""(()=>{if(typeof pdfView!=='function')return null;const c=document.querySelector('#pdfv canvas');let ok=false;try{const d=c.getContext('2d').getImageData(c.width/3,c.height/2,1,1).data;ok=d[2]>200&&d[0]<60}catch(e){}
          const x=document.querySelector('#pdfv [data-pdfx]');if(x)x.click();return {page:ok,closed:!document.getElementById('pdfv')}})()""")
        check("Reports: PDF öffnet im eigenen PDF-Viewer (Seite gezeichnet, schliessbar)", pv in (None, {"page": True, "closed": True}), pv)
        # --- scene quittance: setup/lunch/wrap keys, own entries per unit, labels, WhatsApp texts without symbols ---
        sk = await E("""(()=>{if(typeof scRowKeys!=='function'||typeof scShareText!=='function')return null;const keys=scRowKeys([{n:'Setup'},{sc:'1'},{n:'Lunch'},{n:'Set up B'},{n:'Wrap'}],x=>x.n).join(',');
          const lab=[scLabel('setup'),scLabel('setup2'),scLabel('lunch_u2'),scBase('wrap_u3')].join(',');const t=new Date('2030-05-06T09:00').getTime(),dd='2030-05-06';
          const tx=[scShareText(dd,'12','1',{s:2,b:t,e:t+3600e3}),scShareText(dd,'12','1',{s:1,b:t,start:1}),scShareText(dd,'lunch','1',{s:2,b:t,e:t+1800e3}),scShareText(dd,'wrap_u2','2',{s:2,b:t,e:t})];
          return {keys,lab,noIcon:tx.every(x=>!/[\\u2600-\\u27BF\\uD83C-\\uDBFF]/.test(x)),times:/09:00.10:00/.test(tx[0])&&/09:00/.test(tx[1])&&/09:30/.test(tx[2]),unit:/Unit/.test(tx[3])}})()""")
        check("Quittieren: Setup, Lunch, Wrap und weitere Setups mit eigenem Schlüssel, 2nd/3rd Unit getrennt, WhatsApp-Text ohne Symbole", sk in (None, {"keys": "setup,,lunch,setup2,wrap", "lab": "Setup,Setup 2,Lunch,wrap", "noIcon": True, "times": True, "unit": True}), sk, public=True)
        sw = await E("""(()=>{if(typeof scAckBtn!=='function'||typeof rideAckBtn!=='function')return null;const k={s:window.SCACKON,r:window.RIDEACKON,a:window.SCACK,cp:window.canPerm};const t=todayISO();
          window.canPerm=()=>true;window.SCACK={[scAckId(t,'1')]:{d:t,s:2,at:1}};const on=scAckBtn(t,'1')!==''&&scHas(t);window.SCACKON=false;const off=scAckBtn(t,'1')===''&&!scHas(t)&&scState(t,'1')===0;
          window.RIDEACKON=false;const roff=rideAckBtn({ride:1,rid:'abcd1234'})==='';window.SCACKON=k.s;window.RIDEACKON=k.r;window.SCACK=k.a;window.canPerm=k.cp;return {on,off,roff}})()""")
        st = await E("""(()=>{if(typeof scAckBtn!=='function'||typeof scTimesOk!=='function')return null;const k={a:window.SCACK,cp:window.canPerm,on:window.SCACKON};const d='2030-05-06',t=new Date(d+'T09:00').getTime();
          window.SCACKON=true;window.SCACK={[scAckId(d,'12')]:{s:2,b:t,e:t+3600e3}};window.canPerm=p=>p==='scenes.times'||p==='scenes.see';const on=scAckBtn(d,'12','1').includes('scackt');window.canPerm=p=>p==='scenes.see';const off=!scAckBtn(d,'12','1').includes('scackt')&&scAckBtn(d,'12','1').includes('scack');window.canPerm=()=>false;const none=scAckBtn(d,'12','1')==='';
          window.SCACK=k.a;window.canPerm=k.cp;window.SCACKON=k.on;return {on,off,none}})()""")
        check("Rollen: Quittierungszeiten nur mit «Quittierungszeiten sehen», das Symbol nur mit «Quittierungen sehen»", st in (None, {"on": True, "off": True, "none": True}), st)
        check("Einstellungen: Szenen und Fahrten quittieren lassen sich ausschalten (keine Knöpfe, «jetzt» nach der Uhr)", sw in (None, {"on": True, "off": True, "roff": True}), sw)
        sl = await E("""(()=>{if(typeof sceneLogSec!=='function'||typeof scExpRows!=='function')return null;const k={l:SCLOG.list,e:SCLOG.exp,c:window.canSceneLog,cp:window.canPerm};const d='2030-05-06',t=h=>new Date(d+'T'+h).getTime();
          SCLOG.list=[{id:'20300506-12',d,s:2,u:'1',sc:'12',b:t('09:00'),e:t('10:00')},{id:'20300506-lunch',d,s:2,u:'1',sc:'lunch',b:t('12:00'),e:t('13:00')},{id:'20300506-55',d,s:1,u:'2',sc:'55',b:t('09:30')},{id:'20300506-wrapu2',d,s:2,u:'2',sc:'wrap_u2',b:t('18:00'),e:t('18:00')}];
          window.canSceneLog=()=>true;window.canPerm=p=>p==='scenes.ack';const kd=S.days;S.days=[];const h=sceneLogSec();S.days=kd;   /* without the days: today (a shooting day) is not counted along */const box=document.createElement('div');box.innerHTML=h;const days=box.querySelectorAll('details.tstsu').length;
          const fixed=[...box.querySelectorAll('details.tstsu')].every(x=>['Setup','Lunch','Wrap'].every(n=>x.innerText.includes(n)));const pens=box.querySelectorAll('[data-scled]').length;
          const per=!!box.querySelector('[data-sclx="pdf||1"]')&&!!box.querySelector('[data-sclx="csv||2"]')&&!!box.querySelector('[data-sclx="pdf|'+d+'|2"]')&&!box.querySelector('[data-sclx="pdf"]');
          const r2=scExpRows(d,'2');const only2=r2.length>0&&r2.every(r=>/2/.test(r.unit));const dur=(scExpRows(d,'1').find(r=>/12/.test(r.name))||{}).min;
          window.canPerm=()=>false;const nopen=(()=>{const kd2=S.days;S.days=[];const b=document.createElement('div');b.innerHTML=sceneLogSec();S.days=kd2;return b.querySelectorAll('[data-scled]').length})();
          SCLOG.list=k.l;SCLOG.exp=k.e;window.canSceneLog=k.c;window.canPerm=k.cp;return {days,fixed,pens:pens>0,nopen,per,only2,dur}})()""")
        check("Szenen-Protokoll: pro Unit ein Tagesprotokoll mit Setup/Drehstart/Lunch/Wrap, Stift nur mit Recht, Export pro Tag und Unit", sl in (None, {"days": 2, "fixed": True, "pens": True, "nopen": 0, "per": True, "only2": True, "dur": "60"}, {"days": 3, "fixed": True, "pens": True, "nopen": 0, "per": True, "only2": True, "dur": "60"}), sl, public=True)
        # 2nd Unit: the same scene number in both units is quittiert apart (own id «…u2»); older 2nd-unit entries (id without unit) still count
        u2a = await E("""(()=>{if(typeof scK!=='function'||typeof scGet!=='function')return null;const k=window.SCACK,t='2030-05-06';
          window.SCACK={[scAckId(t,'21')]:{d:t,s:2,u:'1',sc:'21',at:1},[scAckId(t,'55')]:{d:t,s:1,u:'2',sc:'55',at:2}};
          const r={id:scAckId(t,scK('21','2')),sep:scState(t,'21')===2&&scState(t,scK('21','2'))===0,legacy:scState(t,'55_u2')===1&&scState(t,'55')===0,ev:scAckId(t,'lunch_u2'),cont:scAckId(t,scK('21 CONT','2'))};
          window.SCACK=k;return r})()""")
        check("2nd Unit: eigene Quittierung pro Szene (gleiche Szenen-Nummer wie die 1st Unit), ältere Einträge zählen weiter", u2a in (None, {"id": "20300506-21u2", "sep": True, "legacy": True, "ev": "20300506-lunchu2", "cont": "20300506-21u2"}), u2a, public=True)
        # 2nd Unit: viele Basen («Base 1» … «Base 6», je ein Link) als eine Base mit ihren Nummern, nicht sechs Kästen «BASE»
        bz = await E("""(()=>{if(typeof csLocs!=='function')return null;const it=(l,t,m)=>({label:l,text:t,map:m});
          const ls=csLocs({locations:[{no:'2.1',name:'ROAD',map:'https://maps.app.goo.gl/A',items:[it('Base 1','Meeting point','https://maps.app.goo.gl/A'),it('Parking','Base 4-5','https://maps.app.goo.gl/B4'),
            it('Lunch','Restaurant X, Dorf 3, 1922 Salvan','https://maps.app.goo.gl/L'),it('Base 2','','https://maps.app.goo.gl/B2'),it('Base 3','','https://maps.app.goo.gl/B3'),it('Base 4','','https://maps.app.goo.gl/B4'),it('Base 5','','https://maps.app.goo.gl/B5')]}]});
          const b=ls.filter(l=>l.kinds&&l.kinds.includes('Base'));return {bases:b.length,nos:b[0]&&b[0]._bases?b[0]._bases.map(x=>x.n).join(','):'',lunch:ls.some(l=>l.kinds&&l.kinds.includes('Lunch'))}})()""")
        check("Callsheet: viele Basen als eine Base mit Nummern (je ein Link), Lunch bleibt eigener Ort", bz in (None, {"bases": 1, "nos": "1,2,3,4,5", "lunch": True}), bz, public=True)
        # Szenen automatisch quittieren: von Hand quittiert (nach der fälligen Zeit) gewinnt – die Automatik startet die geplante Szene dann nicht
        sa_ = await E("""(async()=>{if(typeof window.scAutoRun!=='function')return null;const t=todayISO(),day=(S.days||[]).find(d=>d.date===t&&d.kind==='shoot');if(!day)return null;
          const K={a:window.SCENEAUTO,k:window.SCACK,it:day.items,l:window.SCACKLIVE,r:window.RIDEACKLOADED,u2:day.unit2};const hm=ms=>csHM(new Date(ms));   /* the clock of the shoot (Zurich), not the one of the test browser */
          const now=Date.now();if(hm(now)<'01:15')return null;   /* just after midnight: no times in the past today */
          day.items=[{sc:'901',t:hm(now-60*60e3)},{sc:'902',t:hm(now-30*60e3)}];delete day.unit2;window.SCENEAUTO={a:{on:false},s:{on:true,min:0},l:{on:false},w:{on:false}};window.SCACKLIVE=true;window.RIDEACKLOADED=true;
          const run=async a=>{window.SCACK={[scAckId(t,'901')]:{d:t,s:1,u:'1',sc:'901',b:a,at:a}};await window.scAutoRun();return scState(t,'902')};
          const hand=await run(now-10*60e3),behind=await run(now-40*60e3),auto=await run(dayMs(t,hm(now-60*60e3)));
          window.SCENEAUTO=K.a;window.SCACK=K.k;day.items=K.it;if(K.u2)day.unit2=K.u2;window.SCACKLIVE=K.l;window.RIDEACKLOADED=K.r;return {hand,behind,auto}})()""")
        check("Szenen automatisch: eine von Hand gestartete Szene bleibt bis zum Abschluss (auch hinter dem Plan), ohne Eingriff startet die geplante", sa_ in (None, {"hand": 0, "behind": 0, "auto": 1}), sa_, public=True)
        # Fahrten 2nd Unit (wie late_push.ride_unit): Abholung am Morgen bei der 2nd Unit, auch für Leute beider Units
        ru = await E("""(()=>{if(typeof window.csRideUnit!=='function')return null;const c={times:{crewCall:'09:30'},cast:[{no:'1',actor:'Max Muster',pickup:'15:45'},{no:'8',actor:'Eva Probe',pickup:'08:40'}],
          calls:[{name:'Tom Ton',t:'06:45'}],u2:{crewCall:'06:45',cast:[{no:'1',actor:'Max Muster',pickup:'06:00'},{no:'2',actor:'Kai Zwei',pickup:'06:05'}]}};
          return [{passengers:'Max Muster, Tom Ton',from:'Moxy',t1:'06:00',to:'Holiday Inn'},{passengers:'Kai Zwei, Max Muster',from:'Holiday Inn',t1:'06:05',to:'Studio 13'},
            {passengers:'Eva Probe',from:'Holiday Inn',t1:'08:40',to:'BASE CHURCH'},{passengers:'Max Muster, Kai Zwei',from:'Location 2nd UNIT',t1:'after Sc. 4A',to:'BASE CHURCH'}].map(r=>window.csRideUnit(c,r)).join(',')})()""")
        check("Fahrten 2nd Unit: Abholung am Morgen bei der 2nd Unit (gleich wie der Server)", ru in (None, "2,2,1,2"), ru, public=True)
        nw_ = await E("(()=>{if(typeof window.nowSee!=='function')return null;const k=window.MYPERMS;return {owner:window.nowSee(),perm:PERMS.some(p=>p[0]==='now.see')}})()")
        check("«Jetzt» sehen: eigenes Recht in den Rollen, Admins sehen es immer", nw_ in (None, {"owner": True, "perm": True}), nw_, public=True)
        # a tick set by hand in an unsaved form stays when the page is drawn again (role form: «the ticks jump around»)
        tk_ = await E("""(async()=>{const v=document.getElementById('view');if(!v||typeof viewMorph!=='function')return null;
          const h='<form class="tkt"><label><input type="checkbox" name="rp" value="a"> A</label><label><input type="checkbox" name="rp" value="b" checked> B</label></form>';
          viewMorph(v,h);const [a,b]=[...v.querySelectorAll('.tkt input')];a.checked=true;b.checked=false;viewMorph(v,h);const kept=a.checked&&!b.checked;
          viewMorph(v,h.replace('value="a">','value="a" checked>'));const saved=a.checked;viewMorph(v,h.replace(' checked>','>'));const page=!b.checked&&!a.checked;render();return {kept,saved,page}})()""")
        check("Formular: von Hand gesetzte Haken bleiben beim Neuzeichnen, gespeicherte Änderungen der Seite gelten", tk_ in (None, {"kept": True, "saved": True, "page": True}), tk_, public=True)
        uu_ = await E("""(()=>{if(typeof window.csRideUnit!=='function')return null;const c={u2:{crewCall:'06:45'},calls:[{name:'Tom Ton',t:'',t2:'06:45'},{name:'Lia Licht',t:'09:15'}],lists:[{title:'Extra Crew',names:'Oli Strom, Ida Grip'}],
          depts:[{dept:'Light',text:'Lia Licht 09:15',text2:'Extra Electrician: Oli Strom call 06:45@meeting point'}]};
          return [{passengers:'Oli Strom',from:'Moxy',t1:'06:15',to:'Loc 1'},{passengers:'Tom Ton',from:'Moxy',t1:'06:10',to:'Loc'},{passengers:'Lia Licht',from:'Moxy',t1:'08:50',to:'Tech'}].map(r=>window.csRideUnit(c,r)).join(',')})()""")
        check("Unit der Personen: Calls-Spalte und Abteilungs-Spalte 2nd UNIT (gleich wie der Server)", uu_ in (None, "2,2,1"), uu_, public=True)
        # places without their own link that say where they are (DT7: «2nd AD & DIT: Loge Thelma @ Tech Parking 1.1», «Lobby Room @ Moxy»)
        rf_ = await E("""(()=>{if(typeof csLocs!=='function')return null;const it=(l,t,m)=>({label:l,text:t,map:m||''});
          const ls=csLocs({locations:[{no:'1.1',name:'UNDER BRIDGE',map:'https://maps.app.goo.gl/BR',items:[it('LOC.','Pont de l Uto - 1958 Sion','https://maps.app.goo.gl/BR'),it('TECH & CREW PARKING','','https://maps.app.goo.gl/TP'),
            it('W/H/M Cast','BASE MOXY','https://maps.app.goo.gl/MX'),it('W/H/M Extras','Lobby Room @ Moxy'),it('LUNCH','TENNIS CLUB','https://maps.app.goo.gl/TC'),it('2nd AD & DIT','Loge Thelma @ Tech Parking 1.1')]},
            {no:'1.2',name:'POLICE STATION',map:'https://maps.app.goo.gl/PS',items:[it('LOC','Avenue du Grand-Champsec 22 - 1958 Sion','https://maps.app.goo.gl/PS')]}]});
          const dit=ls.find(l=>l.kinds&&l.kinds.includes('DIT'))||null,dItem=ls.flatMap(l=>csA(l.items)).find(i=>/dit/i.test(i.label||''));
          const ex=ls.find(l=>l.kinds&&l.kinds.some(k=>/Extras/.test(k)));
          return {dit:(dit&&dit.map)||(dItem&&dItem.map)||'',ex:ex?ex.map:'',boxes:ls.filter(l=>l.kinds).map(l=>l.no).join('|')}})()""")
        check("Locations: DIT, 2nd AD und Komparsen «@ Tech Parking 1.1 / @ Moxy» bekommen den Kartenlink dieses Orts und stehen beim selben Ort (eine Box pro Ort)", rf_ in (None, {"dit": "https://maps.app.goo.gl/TP", "ex": "https://maps.app.goo.gl/MX", "boxes": "Base · W / H / M Cast · W / H / M Extras|Lunch"}), rf_, public=True)
        # map links open the GPS position the updater found (exact ones only); without a position the link of the callsheet stays
        mu_ = await E("""(()=>{if(typeof mapUrl!=='function')return null;const k=S.dispos;try{S.dispos=[{date:'2099-01-01',cs:{geo:{'https://maps.app.goo.gl/A':[46.2271,7.3586],'https://maps.app.goo.gl/R':[46.1,7.1]},geoSrc:{'https://maps.app.goo.gl/A':'link','https://maps.app.goo.gl/R':'rough'}}}];
          return [mapUrl('https://maps.app.goo.gl/A'),mapUrl('https://maps.app.goo.gl/R'),mapUrl('https://maps.app.goo.gl/X'),mapUrl('javascript:alert(1)')].join(' ')}finally{S.dispos=k}})()""")
        check("Kartenlinks: genaue Position als GPS-Koordinaten, sonst der Link des Callsheets", mu_ in (None, "https://www.google.com/maps/search/?api=1&query=46.227100%2C7.358600 https://maps.app.goo.gl/R https://maps.app.goo.gl/X #"), mu_, public=True)
        # the setup is a step of its own in the shooting order (1st and 2nd Unit): crew call → first scene, not twice
        su_ = await E("""(()=>{if(typeof csSetupFirst!=='function')return null;const r=a=>a.map(x=>(x.t||'')+'='+(x.sc||x.text)).join(',');
          return [r(csSetupFirst([{t:'11:30',sc:'6'},{t:'15:45',text:'Lunch'}],'10:45','2026-10-29')),r(csSetupFirst([{t:'09:30',text:'Setup - 0h30m'},{t:'10:00',sc:'19A'}],'09:30','2026-10-29')),
            r(csSetupFirst([{t:'07:00',sc:'1'}],'06:00','2026-10-20')),r(csSetupFirst([{t:'07:00',sc:'1'}],'07:00','2026-11-02'))].join(' | ')})()""")
        check("Drehfolge: Setup als eigener Schritt (Crew Call bis erste Szene), 1st und 2nd Unit gleich", su_ in (None, "10:45=Setup - 0h45m,11:30=6,15:45=Lunch | 09:30=Setup - 0h30m,10:00=19A | 07:00=1 | 07:00=1"), su_, public=True)
        # diagnosis (public log, counts only): the location links of today's callsheet – with GPS position, with address, without link, DIT
        try:
            lk_ = await E("""(()=>{if(typeof csLocs!=='function'||typeof mapGeo!=='function')return null;const t=todayISO(),x=(S.dispos||[]).find(y=>y&&y.date===t&&y.cs);if(!x)return null;
              const out=[];for(const [u,c] of [['1',x.cs],['2',x.cs.u2&&window.cqU2?window.cqU2(Object.assign({},x.cs,{_date:t})):null]]){if(!c)continue;const ls=csLocs(c);let n=0,gps=0,adr=0,no=0,dit='-';
                for(const l of ls){for(const it of [l].concat(csA(l.items))){if(!it)continue;n++;if(!it.map){if(it!==l)no++;continue}if(mapGeo(it.map))gps++;if(c.geoAdr&&c.geoAdr[it.map])adr++}
                  if((l.kinds||[]).includes('DIT')||(l._kx||[]).includes('DIT'))dit=(l.map||csA(l.items).some(i=>/dit/i.test(i.label||'')&&i.map))?'Link':'ohne'}
                out.push(u+'U: Orte '+n+' · GPS '+gps+' · Adresse '+adr+' · ohne Link '+no+' · DIT '+dit)}return out.join(' | ')})()""")
            if lk_: print("::notice::Location-Links heute: " + lk_)
            lu_ = await E("""(()=>{if(typeof csLunchPlace!=='function')return null;const t=todayISO(),x=(S.dispos||[]).find(y=>y&&y.date===t&&y.cs);if(!x)return null;
              const a=csLunchPlace(x.cs),x2=window.csU2Dispo?window.csU2Dispo(x,(S.days||[]).find(d=>d.date===t)):null,b=x2?csLunchPlace(x2.cs):null;
              return '1st '+(a?(a.map?'Link':'Name'):'keine')+' · 2nd '+(x2?(b?(b.map?'Link':'Name'):'keine'):'–')+(a&&b?' · '+((a.map||a.name)===(b.map||b.name)?'gleich':'verschieden'):'')})()""")
            if lu_: print("::notice::Lunch-Ort heute: " + lu_)
        except Exception: pass
        # the setup added by the app has its own key «setup0»: the setups of the Drehplan keep their numbers (setup, setup2 …)
        sk_ = await E("""(()=>{if(typeof csSetupFirst!=='function'||typeof scRowKeys!=='function')return null;return scRowKeys(csSetupFirst([{t:'11:30',sc:'6'},{t:'15:00',text:'Setup - 0h30m'},{t:'16:00',text:'Lunch'}],'10:45','2026-10-29'),r=>r.text||r.syn).join(',')})()""")
        check("Drehfolge: Setup der App hat den Key setup0, die Setups des Drehplans behalten ihre Nummern", sk_ in (None, "setup0,,setup,lunch"), sk_, public=True)
        # times of a night shoot: one routine – after midnight the rows count on past 24:00
        nm_ = await E("(()=>typeof csRowMins==='function'?csRowMins([{t:'22:00'},{text:'x'},{t:'23:30'},{t:'00:15'},{t:'01.40'}]).join(','):null)()")
        check("Nachtdreh: Zeiten nach Mitternacht zählen weiter (eine Routine)", nm_ in (None, "1320,,1410,1455,1540"), nm_, public=True)
        # WhatsApp «direkt» when quittieren: opening it must not end in an endless loop (window.scWaOpen replaced itself – every such tap failed)
        wa_ = await E("(()=>{if(typeof window.scWaOpen!=='function')return null;const o=window.open,c=HTMLAnchorElement.prototype.click;let n=0,h='';window.open=()=>{n++;return null};HTMLAnchorElement.prototype.click=function(){n++;h=this.href};try{window.scWaOpen('Test','w','2');return n===1&&/^https:\\/\\/wa\\.me\\//.test(h)?1:'n='+n}catch(e){return String(e&&e.message||e).slice(0,40)}finally{window.open=o;HTMLAnchorElement.prototype.click=c}})()")
        check("Quittieren mit WhatsApp «direkt»: öffnet WhatsApp ohne Endlosschleife", wa_ in (None, 1), wa_, public=True)
        # the Lunch tile links to the lunch place of the Locations; the 2nd Unit without its own lunch place: the one of the 1st Unit
        lt_ = await E("""(()=>{if(typeof csLunchPlace!=='function')return null;const L1={locations:[{no:'1',name:'SET',map:'https://m/1',items:[{label:'LUNCH',text:'TENNIS CLUB',map:'https://m/TC'}]}]};const c2={locations:[{no:'1',name:'U2',map:'https://m/2'}],_orig:L1};
          const t=csTilesHTML({date:'2026-10-29'},null,Object.assign({times:{lunch:'12:00'}},c2),null);return [(csLunchPlace(L1)||{}).map,(csLunchPlace(c2)||{}).map,/class="dt cslunch" href="https:\/\/m\/TC"/.test(t)].join(' ')})()""")
        check("Kachel Lunch: Link zum Lunch-Ort der Locations (2nd Unit: der der 1st Unit, wenn sie keinen eigenen hat)", lt_ in (None, "https://m/TC https://m/TC true"), lt_, public=True)
        # places at the same street address are one place (DT8: «Extras @base» and «PROD & DIT @base» both at Schulhausplatz 4) – a parking with its own link stays
        sh_ = await E("""(()=>{if(typeof csLocs!=='function')return null;const it=(l,t,m)=>({label:l,text:t,map:m||''});const r=csLocs({locations:[{no:'1.1',name:'VILLA',items:[it('LOC','Bahnhofstrasse 40, 3970 Salgesch'),it('CREW PARKING','Kirchplatz 5, 3970 Salgesch','https://m/CP'),it('BASE KIRCHE','W / H / M Cast / LUNCH, Kirchplatz 5 - 3970 Salgesch','https://m/BK'),it('Extras @base','Schulhausplatz 4 3970 Salgesch Groundfloor'),it('PROD & DIT @base','Schulhausplatz 4 3970 Salgesch - 1st floor')]}]});
          return r.filter(l=>l.kinds).map(l=>l.name+'='+l.kinds.join('/')).join(' | ')})()""")
        check("Locations: Orte an derselben Adresse sind ein Ort (Base Schulhausplatz mit Komparsen, Prod und DIT)", sh_ in (None, "BASE KIRCHE=Base/W / H / M Cast/Lunch | Base Schulhausplatz 4=Base/W / H / M Extras/Prod/DIT"), sh_, public=True)
        # Coverday on the server (tools/coverday.py) lays the same changes over the Drehplan and moves the same callsheets as the app
        cdp = await E("""(()=>{if(typeof window.cdDaysT!=='function'||typeof window.cdDisposT!=='function'||!S.days0)return null;const d0=S.days0,s=d0.filter(d=>d.kind==='shoot').map(d=>d.date);if(s.length<4)return null;
          const u2=d0.filter(d=>d.unit2&&(d.unit2.items||[]).some(i=>i&&i.sc)).map(d=>d.date),last=d0.map(d=>d.date).sort().slice(-1)[0],free=isoAdd(last,3),T=Date.now();
          const sets=[[{op:'swap',u:'all',a:s[0],b:s[2],at:T}],[{op:'move',u:'all',a:s[1],b:free,at:T}],[{op:'shift',u:'all',a:s[1],at:T}],
            [{op:'swap',u:'all',a:s[0],b:s[3],at:T},{op:'shift',u:'all',a:s[2],at:T+1}],[{op:'swap',u:'all',a:s[0],b:s[1],at:T,st:'off'}],[{op:'swap',u:'all',a:s[0],b:s[1],at:1,raw:{a:'x',b:'y'}}]];
          if(u2.length>1)sets.push([{op:'swap',u:'2',a:u2[0],b:u2[1],at:T}],[{op:'shift',u:'2',a:u2[0],at:T}],[{op:'move',u:'2',a:u2[0],b:s.find(x=>!u2.includes(x))||free,at:T}]);
          const P=(days,ds)=>({days:days.map(d=>[d.date,d.kind||'',d.label||'',d.short||'',d.cdSrc||'',(d.items||[]).filter(i=>i&&i.sc).map(i=>String(i.sc)),((d.unit2||{}).items||[]).filter(i=>i&&i.sc).map(i=>String(i.sc))]),ds:ds.map(x=>[x.date,x.cdFrom||'',x.label||''])});
          const k=window.CDOPS,out=sets.map(ops=>{window.CDOPS=ops;const days=window.cdDaysT(d0);return P(days,window.cdDisposT(S.dispos0||[],days))});window.CDOPS=k;
          return {sets,out,days:d0,dispos:S.dispos0||[],meta:S.meta||null}})()""")
        if cdp:
            sys.path.insert(0, str(HERE.parent / "tools")); import coverday  # noqa: E402
            def _cdP(x): return {"days": [[d.get("date"), d.get("kind") or "", d.get("label") or "", d.get("short") or "", d.get("cdSrc") or "", [str(i["sc"]) for i in (d.get("items") or []) if isinstance(i, dict) and coverday.truthy(i.get("sc"))], [str(i["sc"]) for i in ((d.get("unit2") or {}).get("items") or []) if isinstance(i, dict) and coverday.truthy(i.get("sc"))]] for d in x["days"]], "ds": [[c.get("date"), c.get("cdFrom") or "", c.get("label") or ""] for c in x["dispos"]]}
            bad = [i for i, ops in enumerate(cdp["sets"]) if _cdP(coverday.apply({"days": cdp["days"], "dispos": cdp["dispos"], "meta": cdp["meta"]}, ops)) != cdp["out"][i]]
            check("Coverday: Server (Verspätungs-Push, Szenen-Sheet) tauscht, verschiebt und rückt nach wie die App, Callsheets wandern gleich mit", not bad, f"{len(bad)} von {len(cdp['sets'])} Fällen verschieden {bad}", public=True)
        # the Google-Sheets copy of the scene log (tools/scene_sheet.py) builds the same rows as the export of the app
        sp = await E("""(()=>{if(typeof sceneLogSec!=='function'||typeof scExpRows!=='function')return null;const day=(S.days||[]).find(d=>d.kind==='shoot'&&(d.items||[]).filter(i=>i.sc).length>1);if(!day)return null;
          const k={l:SCLOG.list,e:SCLOG.exp,c:window.canSceneLog,g:LANG},d=day.date,t=h=>new Date(d+'T'+h).getTime(),sc=day.items.filter(i=>i.sc);
          const acks=[{id:scAckId(d,sc[0].sc),d,s:2,u:'1',sc:scAckId(d,sc[0].sc).split('-')[1],b:t('09:05'),e:t('10:10'),at:1},{id:scAckId(d,sc[1].sc),d,s:1,u:'1',sc:scAckId(d,sc[1].sc).split('-')[1],b:t('10:30'),at:2},
            {id:d.replace(/-/g,'')+'-lunch',d,s:2,u:'1',sc:'lunch',b:t('12:30'),e:t('13:15'),at:3},{id:d.replace(/-/g,'')+'-lunch_u2',d,s:2,u:'2',sc:'lunch_u2',b:t('12:00'),e:t('12:40'),at:4}];
          const u2s=((day.unit2||{}).items||[]).find(i=>i&&i.sc);if(u2s&&window.scK)acks.push({id:scAckId(d,scK(u2s.sc,'2')),d,s:2,u:'2',sc:scK(u2s.sc,'2'),b:t('09:10'),e:t('09:50'),at:5});   /* a 2nd-unit scene with its own id */
          LANG='de';window.canSceneLog=()=>true;SCLOG.list=acks;sceneLogSec();const rows=['1','2','3'].map(u=>scExpRows('',u).map(r=>[r.name,r.dt,r.date,r.unit,r.state,r.ie,r.pg,r.set,r.plan,r.pmin,r.b,r.e,r.min,r.diff,r.desc]));
          SCLOG.list=k.l;SCLOG.exp=k.e;window.canSceneLog=k.c;LANG=k.g;return {today:todayISO(),acks,rows,days:S.days,dispos:S.dispos,tz:Intl.DateTimeFormat().resolvedOptions().timeZone}})()""")
        if sp:
            sys.path.insert(0, str(HERE.parent / "tools")); import scene_sheet  # noqa: E402
            from zoneinfo import ZoneInfo; scene_sheet.TZ = ZoneInfo(sp["tz"])
            # the same «today» as the app (Zurich): around midnight the test browser's time zone is already / still another day
            import types as _ty
            class _DT(scene_sheet.datetime.datetime):
                @classmethod
                def now(cls, tz=None): return scene_sheet.datetime.datetime.fromisoformat(sp["today"] + "T12:00:00").replace(tzinfo=tz)
            _real = scene_sheet.datetime; scene_sheet.datetime = _ty.SimpleNamespace(datetime=_DT, timedelta=_real.timedelta, date=_real.date)
            try: py = scene_sheet.build(sp["acks"], {"days": sp["days"], "dispos": sp["dispos"]})
            finally: scene_sheet.datetime = _real
            diff = sum(1 for i, u in enumerate("123") for x, y in zip(sp["rows"][i], py.get(u, [])) if [str(v) for v in x] != [str(v) for v in y]) + sum(abs(len(sp["rows"][i]) - len(py.get(u, []))) for i, u in enumerate("123"))
            check("Szenen-Protokoll: Google-Sheets-Abgleich baut dieselben Zeilen wie der Export der App", diff == 0, f"{diff} Zeilen verschieden", public=True)
        vp = await E("""(()=>{if(typeof tabsOn!=='function')return null;const k={s:SIMROLE,r:MYROLE,p:MYPERMS.slice()};SIMROLE={adm:false};MYROLE='t';
          MYPERMS=['view.plan','view.dispo'];const a={loc:vok('loc'),info:vok('info'),tabs:tabsOn().filter(x=>x==='loc'||x==='info').length};
          MYPERMS=['view.plan','view.dispo','view.loc','view.info'];const b={loc:vok('loc'),info:vok('info')};SIMROLE=k.s;MYROLE=k.r;MYPERMS=k.p;
          return {without:!a.loc&&!a.info&&a.tabs===0,with:b.loc&&b.info,perms:['view.loc','view.info','scenes.ack','scenes.log'].every(p=>PERMS.some(x=>x[0]===p))}})()""")
        check("Rollen: «Locations sehen» und «Infos sehen» steuern die Bereiche; neue Rechte in der Rollenauswahl", vp in (None, {"without": True, "with": True, "perms": True}), vp, public=True)
        br = await E("""(()=>{if(typeof csLocs!=='function')return null;const c={locations:[{no:'1',name:'LAKE - SHORE',scenes:'62',map:'https://maps.app.goo.gl/AAA',items:[{label:'TECH PARKING',text:'Etang du Test, Route du Test - 1000 Testdorf',map:'https://maps.app.goo.gl/AAA'},
          {label:'BASE LAKE',text:'W / H / M Cast / Extras / Lunch, Route du Test 20 - 1000 Testdorf',map:'https://maps.app.goo.gl/BBB'},{label:'Greenroom Cast@base',text:'Loge Muster'},{label:'WC',text:'2x on set / 2x@base'},{label:'Prod +DIT',text:'Room at base'}]}]};
          const ls=csLocs(c),b=ls.filter(l=>l.kinds&&l.kinds.includes('Base'));return {bases:b.length,name:b[0]&&b[0].name,rooms:b[0]?b[0].notes.filter(n=>/Greenroom|Prod \+ DIT|WC/.test(n)).length:0,sets:ls.filter(l=>!l.kinds).length}})()""")
        check("Callsheet-Locations: eine Base mit Räumen (Greenroom, Prod + DIT, WC @base), keine eigenen Orte dafür", br in (None, {"bases": 1, "name": "BASE LAKE", "rooms": 3, "sets": 1}), br, public=True)
        # WhatsApp per kind of scene quittance (Mein Konto → App): defaults, old «nicht mehr fragen», kind of a tap, fixed number, the settings
        wa = await E("""(()=>{if(typeof scWaModes!=='function')return null;const K=['scwa','scwan','scwa:no','scwtl'],keep=K.map(k=>localStorage.getItem(k)),cp=window.canPerm,ack=window.SCACK;K.forEach(k=>localStorage.removeItem(k));
          const def=Object.values(scWaModes()).join('');localStorage.setItem('scwa:no','1');const old=Object.values(scWaModes()).join('');localStorage.removeItem('scwa:no');localStorage.setItem('scwa','fffaaa');
          window.SCACK={};const t=new Date('2030-05-06T09:00').getTime();const kinds=[scWaKind('2030-05-06','12','1',{s:1,b:t}),scWaKind('2030-05-06','12','1',{s:2,b:t,e:t}),scWaKind('2030-05-06','lunch','1',{s:1,b:t}),scWaKind('2030-05-06','lunch','1',{s:2,b:t,e:t}),scWaKind('2030-05-06','wrap','1',{s:2,b:t,e:t})].join('');
          window.SCACK={'20300506-11':{d:'2030-05-06',s:2,u:'1',sc:'11'}};const later=scWaKind('2030-05-06','12','1',{s:1,b:t});
          localStorage.setItem('scwan','+41 79 123 45 67');const url=scWaUrl('x');localStorage.setItem('scwtl','https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv');const grp=scWaUrl('x','l')==='https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv'&&scWaIsGroup('l')&&!scWaIsGroup('e')&&scWaUrl('x','e').startsWith('https://wa.me/41791234567?text=');localStorage.removeItem('scwtl');
          scShareAsk('2030-05-06','12','1',{s:2,b:t,e:t+60e3});const d=document.getElementById('scwadlg');const href=d&&d.querySelector('[data-scwago]')?'https://wa.me/41791234567?text=':'';if(d)d.remove();
          window.canPerm=()=>true;const box=document.createElement('div');box.innerHTML=scWaSec();const sel=box.querySelectorAll('select[data-scwam]').length,num=!!box.querySelector('[data-scwan]')&&box.querySelectorAll('[data-scwt]').length===8;
          window.canPerm=cp;window.SCACK=ack;K.forEach((k,i)=>keep[i]==null?localStorage.removeItem(k):localStorage.setItem(k,keep[i]));
          return {def,old,kinds,later,url:url==='https://wa.me/41791234567?text=x'&&grp,href:href.startsWith('https://wa.me/41791234567?text='),sel,num}})()""")
        check("WhatsApp beim Quittieren: pro Art einstellbar (Drehstart, Beginn, Abschluss, Lunch, Drehschluss, Prognose, Drehtag geändert), feste Nummer, Einstellung im Konto", wa in (None, {"def": "fnfnffff", "old": "nnnnnnff", "kinds": "delmw", "later": "b", "url": True, "href": True, "sel": 8, "num": True}), wa, public=True)
        bar = await E("""(()=>{if(typeof scBar!=='function')return null;const t=new Date('2030-05-06T09:00').getTime();scBar('2030-05-06','12','1',{s:1,b:t},null);const b=document.getElementById('scbar');
          const r={bar:!!b,ed:!!(b&&b.querySelector('[data-scbared]')),wa0:!!(b&&b.querySelector('[data-scbarwa]'))};scBar('2030-05-06','12','1',{s:2,b:t,e:t+60e3},{s:2,b:t,e:t+60e3});r.wa=!!document.querySelector('#scbar [data-scbarwa]');r.one=document.querySelectorAll('#scbar').length===1;
          document.querySelector('#scbar [data-scbared]').click();const d=document.getElementById('scackdlg');r.dlg=!!d;r.gone=!document.getElementById('scbar');if(d)d.remove();return r})()""")
        check("Szene quittiert: Leiste mit «Zeit ändern» (öffnet Status/Beginn/Ende), WhatsApp nur bei «Fragen»", bar in (None, {"bar": True, "ed": True, "wa0": False, "wa": True, "one": True, "dlg": True, "gone": True}), bar, public=True)
        px = await E("""(()=>{if(typeof rideEditDialog!=='function')return null;const keep={d:S.dispos,c:S.crew,cp:window.canPerm,v:window.REDVER};const t='2030-05-06';S.crew=[{dept:'Cast',people:[{name:'Anna Muster'},{name:'Ida Test'}]}];
          const r0={t1:'07:30',t2:'08:00',from:'A',to:'B',vehicle:'Van',driver:'Max',passengers:'Anna Muster, Lena Test'};S.dispos=[{date:t,cs:{transport:[r0]}}];window.REDVER=(window.REDVER||0)+1;rideEditApply();window.canPerm=()=>true;
          rideEditDialog(rideId(t,S.dispos[0].cs.transport[0]));const d=document.getElementById('rededlg');const sl=d.querySelector('[data-redadd]');sl.value='Ida Test';sl.dispatchEvent(new Event('change',{bubbles:true}));
          d.querySelector('[data-redrm="0"]').click();const v=d.querySelector('[name=pax]').value,chips=d.querySelectorAll('.redchip').length;d.remove();S.dispos=keep.d;S.crew=keep.c;window.canPerm=keep.cp;window.REDVER=keep.v+1;return {v,chips}})()""")
        check("Fahrt ändern: Mitfahrende als Chips, hinzufügen aus der Crewliste, × entfernt", px in (None, {"v": "Lena Test, Ida Test", "chips": 2}), px)
        pw = await E("""(async()=>{if(typeof pwEyes!=='function')return null;const f=document.createElement('div');f.innerHTML='<input type="password" value="x1">';document.body.appendChild(f);pwEyes(f);
          const b=f.querySelector('.pweye');if(!b){f.remove();return 'no eye'}b.click();const t1=f.querySelector('input').type;b.click();const t2=f.querySelector('input').type;f.remove();return [t1,t2]})()""")
        check("Passwortfelder: Auge rechts zeigt und verbirgt das Passwort", pw in (None, ["text", "password"]), pw)
        dn = await E("""(()=>{if(typeof renderCS!=='function')return null;const keep=S.dispos;S.dispos=[{date:'2030-05-05',cs:{drivers:'Vera Fahrerin +41 76 000 11 22 | Max Muster +41 76 000 33 44'}}];
          const x={date:'2030-05-06',cs:{drivers:'| +41 76 000 11 22 | Max Muster +41 76 000 33 44 o.p.D = on personal Decision',transport:[{t1:'07:00',from:'A',to:'B',driver:'Max Muster'}]}};
          const w=document.createElement('div');w.innerHTML=renderCS(x,{date:x.date});S.dispos=keep;const t=(w.querySelector('.csdrvl')||{}).textContent||'';return {name:t.includes('Vera Fahrerin'),legend:!/personal decision/i.test(t)}})()""")
        check("Callsheet: Fahrer ohne Namen im Dokument werden über die Nummer ergänzt, «o.p.D = …» nicht als Name", dn in (None, {"name": True, "legend": True}), dn)
        aw = await E("""(()=>{if(typeof csDayAfterWrap!=='function')return null;const t='2030-05-06',n='2030-05-07',pick=[{date:t},{date:n}];
          const by={[t]:{cs:{times:{crewCall:'08:00',wrap:'19:00'}}},[n]:{cs:{}}},by2={[t]:by[t]},late={[t]:{cs:{times:{crewCall:'14:00',wrap:'01:30'}}},[n]:{cs:{}}},z=(h)=>zurichUTC(t,h).getTime();
          return [csDayAfterWrap(t,pick,by,z('19:30')),csDayAfterWrap(t,pick,by,z('20:01')),csDayAfterWrap(t,pick,by2,z('22:00')),csDayAfterWrap(t,pick,late,z('23:00'))]})()""")
        check("Callsheet: eine Stunde nach Drehschluss der Folgetag (nur wenn sein Callsheet da ist; Drehschluss nach Mitternacht)", aw in (None, [None, "2030-05-07", None, None]), aw)
        ft = await E("""(()=>{if(typeof csFitTiles!=='function')return null;const v=document.getElementById('view');const keep=v.innerHTML;const W=Math.min(760,innerWidth-20);
          v.innerHTML='<div style="width:'+W+'px"><div class="dtiles cstiles"><div class="dt big"><div class="k">Crew Call</div><div class="v">08:00</div></div><div class="dt"><div class="k">Rehearsal</div><div class="v">09:00</div></div><div class="dt"><div class="k">RTS</div><div class="v">09:15</div></div><div class="dt"><div class="k">Lunch</div><div class="v">12:15</div></div><div class="dt"><div class="k">Wrap</div><div class="v">19:00</div></div><div class="dt cssunt"><div class="k">Sonne</div><div class="v">07:55<span class="sd">–</span><br>18:37</div></div><button class="dt csdrv"><div class="k">Anfahrt</div><div class="v">Holiday Inn Express ›</div></button></div></div>';
          csFitTiles();const t=v.querySelector('.cstiles');const ds=[...t.children];const r={wide:innerWidth>=480&&W>=700,rows:new Set(ds.map(d=>Math.round(d.getBoundingClientRect().top))).size,cut:ds.some(d=>d.scrollWidth>d.clientWidth+1)};v.innerHTML=keep;return r})()""")
        check("Zeit-Kacheln: ganze Texte, auf breiten Bildschirmen eine Zeile", ft is None or (not ft["cut"] and (ft["rows"] == 1 or not ft["wide"])), ft)
        # ---------- callsheet ↔ other documents (schedule, cast list, crew list): differences are shown, they never block ----------
        xd = await E(r"""(()=>{const out=[];const N=x=>String(x||"").replace(/\s+/g,"").toLowerCase().replace(/^0+/,"");
          for(const dp of (S.dispos||[])){const c=dp&&dp.cs;if(!c)continue;const d=(S.days||[]).find(x=>x.date===dp.date);if(!d)continue;
            const its=[].concat(arr(d.items),arr((d.unit2||{}).items),arr((d.unit3||{}).items)).filter(Boolean);
            const scP=new Set(its.filter(i=>i.sc).map(i=>N(i.sc))),scC=new Set(arr((c.order||{}).rows).filter(r=>r.sc).map(r=>N(r.sc)));
            const castP=new Set(its.flatMap(i=>arr(i.cast)).map(x=>String(x).trim()).filter(x=>/^\d+$/.test(x))),castC=new Set(arr(c.cast).map(r=>String(r.no||"").trim()).filter(x=>/^\d+$/.test(x)));
            const people=[];for(const g of arr(S.crew))for(const p of arr(g.people))if(p&&p.name)people.push({name:p.name,k:nmk(p.name)});
            const calls=arr(c.calls).filter(r=>r.name&&!/,/.test(r.name)),unk=calls.filter(r=>!findPerson(r.name,people)).length;
            const sun=c.sunrise&&d.sr?(hm(c.sunrise)===hm(d.sr)&&hm(c.sunset)===hm(d.ss)):null;
            const exC=parseInt((String((c.order||{}).title||"").match(/Extras:\s*(\d+)/i)||[])[1],10),exP=parseInt(d.extras,10);
            out.push({date:dp.date,sc:[scC.size,[...scC].filter(x=>!scP.has(x)).length,[...scP].filter(x=>!scC.has(x)).length],
              cast:[castC.size,[...castC].filter(x=>!castP.has(x)).length,[...castP].filter(x=>!castC.has(x)).length],calls:[calls.length,unk],sun,ex:[isNaN(exC)?null:exC,isNaN(exP)?null:exP]})}
          return out})()""")
        g0 = common.GROUP; common.GROUP = "Abgleich Callsheet"
        for r in xd or []:
            dt = r["date"]
            a = r["sc"]
            (check if not (a[1] or a[2]) else warn)(("Callsheet %s ↔ Drehplan: Szenen " % dt) + ("gleich (%d)" % a[0] if not (a[1] or a[2]) else "verschieden"), *([True] if not (a[1] or a[2]) else ["%d nur im Callsheet, %d nur im Drehplan" % (a[1], a[2])]))
            a = r["cast"]
            (check if not (a[1] or a[2]) else warn)(("Callsheet %s ↔ Drehplan: Rollen " % dt) + ("gleich (%d)" % a[0] if not (a[1] or a[2]) else "verschieden"), *([True] if not (a[1] or a[2]) else ["%d nur im Callsheet, %d nur in den Szenen des Drehplans" % (a[1], a[2])]))
            a = r["calls"]
            (check if not a[1] else warn)(("Callsheet %s ↔ Crewliste: Calls " % dt) + ("alle in der Crewliste (%d)" % a[0] if not a[1] else "nicht alle in der Crewliste"), *([True] if not a[1] else ["%d von %d Namen nicht gefunden" % (a[1], a[0])]))
            if r["sun"] is not None:
                (check if r["sun"] else warn)("Callsheet %s ↔ Drehplan: Sonnenzeiten %s" % (dt, "gleich" if r["sun"] else "verschieden"), *([True] if r["sun"] else [""]))
            e = r["ex"]
            if e[0] is not None and e[1] is not None:
                (check if e[0] == e[1] else warn)("Callsheet %s ↔ Drehplan: Komparsen %s" % (dt, "gleich (%d)" % e[0] if e[0] == e[1] else "verschieden"), *([True] if e[0] == e[1] else ["Callsheet %d, Drehplan %d" % (e[0], e[1])]))
        common.GROUP = g0
        cpl = await E("""(()=>{if(typeof csCallPlace!=='function')return null;const c={locations:[{no:'1',name:'CHAPEL',items:[{label:'Base',text:'Restaurant Waldrand, Föhr'}]}],
          transport:[{from:'Holiday Inn',t1:'09:30',to:'Base',t2:'09:55',vehicle:'PW',driver:'Max Muster',passengers:'Anna Beispiel'}]};
          const me=n=>({hit:t=>String(t||'').includes(n)});const call={t:'09:30'};
          const d=csCallPlace(c,me('Max Muster'),call),p=csCallPlace(c,me('Anna Beispiel'),call);return {driver:/holiday/i.test(d.name),passenger:/base|waldrand/i.test(p.name)}})()""")
        check("Callsheet: Call-Ort für Fahrer = Abfahrtsort, für Mitfahrende = Ziel", cpl in (None, {"driver": True, "passenger": True}), cpl, public=True)
        ctv = await E("""(()=>{if(typeof renderCS!=='function')return null;const d=S.days.find(x=>x.kind==='shoot');if(!d)return null;localStorage.removeItem('cscast:v1');
          const x={date:d.date,cs:{cast:[{no:'1',role:'BAX',actor:'X'}]}};const w=document.createElement('div');w.id='view';const old=document.getElementById('view');old.id='view0';document.body.appendChild(w);w.innerHTML=renderCS(x,d);
          const a=w.querySelector('#cs-cast').classList.contains('cs-astbl');w.querySelector('[data-cstview]').click();const b=w.querySelector('#cs-cast').classList.contains('cs-astbl');if(b)w.querySelector('[data-cstview]').click();
          const ic=w.querySelectorAll('.csjb button svg').length>0&&w.querySelectorAll('.cssec>summary .csexp').length>0;w.remove();old.id='view';localStorage.removeItem('cscast:v1');return !a&&b&&ic})()""")
        check("Callsheet: Cast als Karten oder Tabelle, Symbol-Leiste, Auf-/Zuklapp-Symbol", ctv in (None, True), ctv, public=True)
        cj = await E("""(()=>{const d=S.days.find(x=>x.kind==='shoot'&&arr(x.items).some(i=>i.sc));if(!d||typeof renderCS!=='function')return null;
          const x={date:d.date,cs:{times:{crewCall:'08:00'},order:{rows:[{t:'09:00',sc:'2',set:'A'}]},cast:[{no:'1',role:'BAX',actor:'X'}],calls:[{dept:'Camera',name:'Filip Z',t:'08:10'},{dept:'Sound',name:'Pat S',t:'08:00'}]}};
          const w=document.createElement('div');w.innerHTML=renderCS(x,d);document.body.appendChild(w);const jb=[...w.querySelectorAll('[data-csj]')].map(b=>b.dataset.csj);
          const q=w.querySelector('#csq');q.value='filip';q.dispatchEvent(new Event('input',{bubbles:true}));const vis=[...w.querySelectorAll('.cscall-r')].filter(r=>!r.hidden).map(r=>r.textContent);
          const castHidden=w.querySelector('#cs-cast').hidden;w.remove();return {jb:jb.join(','),vis:vis.length===1&&vis[0].includes('Filip'),castHidden}})()""")
        check("Callsheet: Sprungleiste und Suche (nur Treffer sichtbar)", cj in (None, {"jb": "order,cast,calls", "vis": True, "castHidden": True}, {"jb": "order,cast,calls,att", "vis": True, "castHidden": True}), cj, public=True)
        # app settings: links that were not loaded are never written (else empty fields deleted them for everyone)
        pv = await E("""(async()=>{const keep=window.PRIVOK;window.PRIVOK=false;const before=JSON.stringify(window.__db['config/private']||null);
          const ll=loadLangs;loadLangs=async()=>{};S.tab='admin';ADM.sub='set';render();await new Promise(x=>setTimeout(x,300));
          const f=document.querySelector('[data-adm="langs"]');if(!f){loadLangs=ll;window.PRIVOK=keep;return null}
          f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));await new Promise(x=>setTimeout(x,500));
          const after=JSON.stringify(window.__db['config/private']||null);loadLangs=ll;window.PRIVOK=keep;S.tab='today';render();return before===after})()""")
        check("Einstellungen: nicht geladene Links werden nie überschrieben", pv in (None, True), pv, public=True)
        # sign-out: the reminders of this person stop on this device
        so = await E("""(async()=>{if(typeof window.pushSignOut!=='function')return 'fehlt';localStorage.setItem('push','{"on":true}');localStorage.setItem('pushlocal:x|1','1');
          const id='push/'+ME.uid+'_'+pushDev();window.__db[id]={c:'x',at:1};const keep=JSON.parse(JSON.stringify({p:localStorage.getItem('push')}));
          await window.pushSignOut();const r=!window.__db[id]&&!localStorage.getItem('push')&&!localStorage.getItem('pushlocal:x|1');localStorage.setItem('push',keep.p);return r})()""")
        check("Abmelden: Erinnerungen dieser Person auf dem Gerät gestoppt", so is True, so, public=True)
        sct = await E("""(async()=>{const d=S.days.find(x=>x.kind==='shoot'&&arr(x.items).some(i=>i.sc));if(!d)return null;const it=arr(d.items).find(i=>i.sc);const keep=S.meta.bd,sv=Object.assign({},S.sv);
          S.meta.bd={[d.date+'|'+bdKey(it.sc)]:{h:{},c:[['Props',['Knife']]]}};S.tab='script';S.sq=String(it.sc);S.sqm='sc';render();await new Promise(r=>setTimeout(r,300));render();
          const v=document.querySelector('#view');const vis=e=>!!e&&getComputedStyle(e).display!=='none';const b=v.querySelector('.spf1 .bdt');const a=vis(b);
          const before=!!b&&!!b.nextElementSibling&&b.nextElementSibling.classList.contains('spfa')||!!b&&!v.querySelector('.spf1 .spfa');
          const btn=v.querySelector('.svtab [data-sv="inf"]');if(btn)btn.click();const off=!vis(v.querySelector('.spf1 .bdt'));const btn2=document.querySelector('#view .svtab [data-sv="inf"]');if(btn2)btn2.click();const on=vis(document.querySelector('#view .spf1 .bdt'));
          S.sv=sv;store('sv',JSON.stringify(sv));S.meta.bd=keep;S.sq='';render();return {a,before,btn:!!btn,off,on}})()""")
        check("Drehbuch: Szenen-Details über der Adresse, Info-Knopf blendet sie aus und ein", sct in (None, {"a": True, "before": True, "btn": True, "off": True, "on": True}), sct, public=True)
        sim = await E("""(async()=>{if(typeof admLoad==='function'&&!ADM.loaded)await admLoad();const em=Object.keys(ADM.ur||{}).find(e=>ADM.ur[e]&&ADM.ur[e]!=='admin'&&!ADMINS.includes(e)&&lc(e)!==lc(ME.email));
          if(!em)return null;const btn=simBtn(em).includes('data-simstart');simStart(em);const r={btn,adm:isAdmin(),bar:!!document.getElementById('simbar'),tab:S.tab,who:simEmail()===em,perms:MYPERMS.length===arr((ADM.roles.find(x=>x.id===ADM.ur[em])||{}).perms).length};
          const f=document.createElement('form');document.body.appendChild(f);let saved=true;f.addEventListener('submit',()=>{saved=true});saved=false;f.dispatchEvent(new Event('submit',{cancelable:true}));f.remove();r.blocked=!saved;
          simEnd();r.back=isOwner()&&!document.getElementById('simbar')&&simEmail()===ME.email;return r})()""")
        check("Benutzer: Ansicht als andere Person (Rechte der Rolle, Balken, nichts speichern, zurück)", sim in (None, {"btn": True, "adm": False, "bar": True, "tab": "today", "who": True, "perms": True, "blocked": True, "back": True}), sim, public=True)
        simr = await E("""(async()=>{if(typeof admLoad==='function'&&!ADM.loaded)await admLoad();const ro=(ADM.roles||[])[0];if(!ro)return null;
          S.tab='admin';ADM.sub='roles';render();const pick=document.querySelector('#view [data-simpick]');const opt=!!pick&&!!pick.querySelector('option[value="role:'+ro.id+'"]')&&!!pick.querySelector('option[value="role:"]');
          pick.value='role:'+ro.id;pick.dispatchEvent(new Event('change',{bubbles:true}));
          const r={opt,adm:isAdmin(),bar:(document.getElementById('simbar')||{}).textContent.includes(ro.name||ro.id),perms:MYPERMS.length===arr(ro.perms).filter(p=>PERMS.some(x=>x[0]===p)).length,role:MYROLE===ro.id};
          simEnd();simStartRole('');r.none=MYROLE===''&&MYPERMS.length===0&&!isAdmin();simEnd();r.back=isOwner()&&!document.getElementById('simbar');return r})()""")
        check("Verwaltung: Ansicht als Rolle (ohne Person) und «Keine Rolle» simulieren", simr in (None, {"opt": True, "adm": False, "bar": True, "perms": True, "role": True, "none": True, "back": True}), simr, public=True)
        # blocking per scene: parts get their own part + the general pictures, never another part; slideshow scenes «25 SL2» never scene 25
        bf = await E("""(()=>{const keep=S.meta.blocking,kb=S.meta.bm;S.meta.bm=[];
          S.meta.blocking=[{name:'Scene_186',sc:['186'],media:[{f:'a'},{f:'b',p:'186pt1'},{f:'c',p:'186pt2'}],pdfs:[{l:'186 pt1'},{l:'186 pt2'}]},
            {name:'Scene_025',sc:['25'],media:[{f:'d'}]},{name:'AUF 25SL',sc:['25SL'],media:[{f:'e'}]},{name:'AUF 186pt1',sc:['186pt1'],media:[{f:'i',g:'s'}]},{name:'Scene_005 CAR',sc:['5'],media:[{f:'g'}]}];
          const f=s=>blkFor(s).map(b=>bmed(b).map(m=>m.f).join('')+'/'+arr(b.pdfs).map(p=>p.l).join('|')).join(' ');
          const r={p1:f('186pt1A'),p2:f('186 pt2'),all:f('186'),sl:f('25 SL2'),s25:f('25'),pt:f('5 pt13'),no:f('186A')};S.meta.blocking=keep;S.meta.bm=kb;return r})()""")
        check("Blocking: Szenenteile (186pt1A) ohne Bilder anderer Teile, Slideshow (25 SL2) ohne Szene 25", bf == {"p1": "ab/186 pt1 i/", "p2": "ac/186 pt2", "all": "abc/186 pt1|186 pt2", "sl": "e/", "s25": "d/", "pt": "g/", "no": ""}, bf, public=True)
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
        # only the 2nd unit chosen: all days stay in the strip, days without it are grey; unit buttons sit in the fixed strip
        o2 = await E("""(()=>{const ku=S.pu;S.tab='plan';S.pu={"1":true,"2":true};render();const n1=document.querySelectorAll('#view .strip .chip').length;
          S.pu={"2":true};render();const n2=document.querySelectorAll('#view .strip .chip').length,grey=document.querySelectorAll('#view .strip .chip.nou').length+document.querySelectorAll('#view .strip .chip.u2day').length,
          ub=!!document.querySelector('#view .stripwrap > .pub [data-pu]');S.pu=ku;render();return {same:n1===n2,grey:grey>0,ub}})()""")
        # script search by role: the scenes where the role is cast in the Drehplan; the comparison can be switched off
        rs = await E("""(async()=>{try{await scriptData()}catch(_){}if(!SCRIPT||!SCRIPT.length)return null;const R=roleList();if(!R.length)return null;
          const r=R.find(x=>Object.keys(schedIndex()).some(k=>planRoles(k).has(x.id)));if(!r)return null;
          const keep=[S.tab,S.sq,S.sqm];S.tab='script';S.sqm='role';S.sq=r.name;render();
          const scs=[...document.querySelectorAll('#view .scli')].map(b=>b.dataset.scene);const allPlanned=scs.length>0&&scs.every(sc=>planRoles(sc).has(r.id));
          const tog=!!document.querySelector('#view [data-rbtog]');document.querySelector('#view [data-rbtog]').click();await new Promise(r=>setTimeout(r,100));
          const hidden=!document.querySelector('#view .rbadges');document.querySelector('#view [data-rbtog]').click();
          [S.tab,S.sq,S.sqm]=keep;render();return {allPlanned,tog,hidden}})()""")
        if rs is not None:
            check("Drehbuch-Suche nach Rolle: nur Szenen laut Drehplan, Abgleich ein-/ausblendbar", rs == {"allPlanned": True, "tog": True, "hidden": True}, rs, public=True)
        check("Nur 2nd Unit: alle Tage bleiben, andere Drehtage grau, Unit-Knöpfe in der fixen Kalenderzeile", o2 == {"same": True, "grey": True, "ub": True}, o2, public=True)
        check("Zurück-Knopf oben links: ein Schritt zurück (Locations → Drehplan)", nb == {"ok": True, "en": True, "tab": "plan", "top": True}, nb, public=True)
        # gallery (floorplan, Auflösung, Sides): pinch zooms the picture and never turns the page; a one-finger swipe does
        zt = await E(r"""(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
  openGallery({name:"ztest",title:"Z",sc:[],url:"https://x",media:[{n:"a",t:"img",f:"blk/x1.bin"},{n:"b",t:"img",f:"blk/x2.bin"},{n:"c",t:"img",f:"blk/x3.bin"}]},0);await w(100);
  const d=document.getElementById("blkgal"),img=()=>d.querySelector(".galstage img");if(!img())return {err:"noimg"};
  const T=(id,x,y)=>new Touch({identifier:id,target:img(),clientX:x,clientY:y});
  const ev=(type,touches,changed)=>img().dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches,targetTouches:touches,changedTouches:changed}));
  /* pinch: first finger, then second, spread apart, release one by one (fingers also drift sideways a lot) */
  let a=T(0,150,300);ev("touchstart",[a],[a]);let b=T(1,250,300);ev("touchstart",[a,b],[b]);
  for(let k=1;k<=5;k++){a=T(0,150-30*k,300);b=T(1,250+30*k+40*k,300);ev("touchmove",[a,b],[a,b])}
  ev("touchend",[b],[a]);ev("touchend",[],[b]);await w(50);
  const afterPinch=d.dataset.i,zoomed=/scale/.test(img().style.transform||"");
  /* double tap = back to normal size */
  let c=T(2,200,300);ev("touchstart",[c],[c]);ev("touchend",[],[c]);await w(80);c=T(3,200,300);ev("touchstart",[c],[c]);ev("touchend",[],[c]);await w(50);
  const reset=!/scale/.test(img().style.transform||"");
  /* one-finger swipe to the left = next picture */
  await w(350);let s=T(4,300,300);ev("touchstart",[s],[s]);s=T(4,120,305);ev("touchmove",[s],[s]);ev("touchend",[],[s]);await w(50);
  const afterSwipe=d.dataset.i;d.remove();return {afterPinch,zoomed,reset,afterSwipe}})()""")
        check("Galerie: Zoomen mit zwei Fingern blättert nie weiter, Doppeltipp zurück, Wischen blättert", zt == {"afterPinch": "0", "zoomed": True, "reset": True, "afterSwipe": "1"}, zt, public=True)
        # user list: who uses the installed app; App-Verwaltung option «keep asking to install»
        ua = await E("""(()=>{const k=appKind();window.A2AGAIN=true;const st=localStorage.getItem('a2hs:v1');localStorage.setItem('a2hs:v1','asked:'+(Date.now()-4*864e5));const again=a2hsDue();
          localStorage.setItem('a2hs:v1','asked:'+Date.now());const notyet=!a2hsDue();window.A2AGAIN=false;localStorage.setItem('a2hs:v1','asked:1000000000000');const off=!a2hsDue();
          if(st==null)localStorage.removeItem('a2hs:v1');else localStorage.setItem('a2hs:v1',st);return {kind:/^(app|web)-(ios|android|desktop)$/.test(k),again,notyet,off}})()""")
        check("App installiert: Gerät erkannt, Aufforderung alle 3 Tage nur wenn eingeschaltet", ua == {"kind": True, "again": True, "notyet": True, "off": True}, ua, public=True)
        # 2nd unit planning: only scenes; a note naming a scene is shown at that scene, others not
        u2 = await E("""(()=>{const d=S.days.find(x=>x.kind==='shoot');if(!d)return null;const keep=d.unit2,ku=S.pu;S.pu={"1":true,"2":true,"3":true};
          d.unit2={src:'2nd',items:[{t:'07:00',n:'Rig Polizeiauto'},{t:'08:00',sc:'185',set:'ROAD'},{t:'09:00',sc:'5pt13',set:'ROAD1'}],notes:['Ton für Sc185: 1 Person','Grip: 2 Personen','Szene 5 pt13: Rollator']};
          S.tab='plan';S.day=d.id;render();const v=document.getElementById('view').innerText;const r={rig:v.includes('Rig Polizeiauto'),grip:v.includes('Grip: 2'),
          ton:[...document.querySelectorAll('#view .xn')].map(x=>x.textContent)};if(keep)d.unit2=keep;else delete d.unit2;S.pu=ku;render();return r})()""")
        if u2 is not None:
            check("2nd Unit: alle Zeilen (auch Rigging), Hinweise nur bei der genannten Szene", u2 == {"rig": True, "grip": False, "ton": ["Ton für Sc185: 1 Person", "Szene 5 pt13: Rollator"]}, u2, public=True)
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
        # coverday: a callsheet is never left out, and one that fits its own date stays there
        cdk = await E("""(()=>{if(typeof cdDispos!=='function')return null;const dy=(d,sc)=>({date:d,kind:'shoot',items:sc.map(x=>({sc:x}))}),cs=(d,sc,f)=>({date:d,file:f,scenes:sc.map(x=>({sc:x}))});
          const days=[dy('2031-01-01',['1','2']),dy('2031-01-02',['3','4'])];
          const a=cdDispos([cs('2031-01-01',['3','4'],'neu.pdf'),cs('2031-01-02',['3','4'],'alt.pdf')],days).map(x=>x.file).sort().join(',');
          const b=cdDispos([cs('2031-01-01',['1','2','3','4'],'mix.pdf')],days).map(x=>x.date).join(',');
          return {a,b}})()""")
        check("Coverday: kein Callsheet geht verloren, eines mit passendem Datum bleibt dort", cdk is None or cdk == {"a": "alt.pdf,neu.pdf", "b": "2031-01-01"}, cdk)
        # a callsheet is shown even when the Drehplan has that day as free or not at all (changed plan)
        cso = await E("""(()=>{if(typeof renderDispo!=='function')return null;const kd=S.dispos,kdd=S.dday,ks=S.days;const off=(S.days.find(d=>d.kind==='off')||{}).date;
          const cs={date:'2099-01-02',cs:{times:{crewCall:'07:00'},locations:[],order:{rows:[]}}};S.dispos=kd.concat([cs].concat(off?[{date:off,cs:{times:{crewCall:'06:30'},locations:[],order:{rows:[]}}}]:[]));
          S.dday='2099-01-02';const a=renderDispo();S.dday=off||'2099-01-02';const b=renderDispo();S.dispos=kd;S.dday=kdd;
          return {nav:a.includes('data-dday="2099-01-02"'),shown:a.includes('07:00'),off:!off||b.includes('06:30')}})()""")
        check("Callsheet erscheint auch, wenn der Drehplan den Tag frei hat oder nicht kennt", cso is None or cso == {"nav": True, "shown": True, "off": True}, cso)
        # App-Verwaltung → Today: «aus» = offered but off until switched on, «nicht angeboten» = not in the list and never shown
        tc = await E("""(()=>{if(typeof tShow!=='function')return null;const kc=window.TODAYCFG,kv=localStorage.getItem('today');window.TODAYCFG={wx:'off',menu:'no'};localStorage.setItem('today','1');
          S.tab='acct';ACSUB='app';render();const ks=[...document.querySelectorAll('#view [data-todaypart]')].map(x=>x.dataset.todaypart);const r={wx0:tShow('wx'),menu:tShow('menu'),list:!ks.includes('menu')&&ks.includes('wx'),scs:tShow('scs')};
          const c=document.querySelector('#view [data-todaypart="wx"]');if(c){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))}r.wx1=tShow('wx');
          window.TODAYCFG=kc;if(kv==null)localStorage.removeItem('today');else localStorage.setItem('today',kv);return r})()""")
        check("App-Verwaltung → Today: «aus» erst nach Einschalten sichtbar, «nicht angeboten» nirgends",
              tc is None or tc == {"wx0": False, "menu": False, "list": True, "scs": True, "wx1": True}, tc)
        # start page: a start (or coming back after a long pause) opens Today; with Today off the Drehplan at today / the next day
        sp = await E("""(()=>{const keep=localStorage.getItem('today'),tab=S.tab,day=S.day;const r={};
          S.tab='loc';S.day='x';goStart();r.on=S.tab;localStorage.setItem('today','0|'+(keep||'').replace(/^[01]\\|?/,''));S.tab='loc';S.day='x';goStart();r.off=S.tab;
          const l=S.days.filter(d=>d.kind!=='off'&&d.kind!=='travel'),nx=l.find(d=>d.date>=todayISO())||l[l.length-1],nx2=l.find(d=>d.date>todayISO());/* one hour after the wrap of today: the next day */r.day=!l.length||S.day===nx.id||(!!nx2&&S.day===nx2.id)||String(S.day||'').startsWith('prep:');
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


        # Drehblöcke: the running block decides the time zone («heute», clock) and which main topics are shown; App-Verwaltung → App → Drehblöcke
        bk = await E("""(()=>{const keep=window.BLOCKS,t=dateIn(Date.now(),'Europe/Zurich');
          window.BLOCKS=[{id:'b1',name:'Block 1',tz:'Europe/Zurich',from:'2000-01-01',to:'2000-02-01',topics:{}},{id:'b2',name:'Indien',tz:'Pacific/Kiritimati',from:t,to:'',topics:{crew:'off',loc:'2999-01-01',plan:t}}];
          const k=dateIn(Date.now(),'Pacific/Kiritimati'),r={tz:prodTZ()==='Pacific/Kiritimati',today:todayISO()===k,tag:blockTag(t).includes('Indien'),
            allOwner:['crew','loc','plan'].every(x=>tabsOn().includes(x))};
          window.BLOCKS=keep;return r})()""")
        check("Drehblöcke: Zeitzone und «heute» des laufenden Blocks, Blockname im Drehplan, mit «Einstellungen» alle Themen", all(bk.values()), bk, public=True)
        await E("S.tab='admin';ADM.sub='set';render()"); await pg.wait_for_timeout(800)
        check("Drehblöcke: Abschnitt in App-Verwaltung → App", await E("!!document.querySelector('#view [data-sec=\"set-blocks\"] [data-blkadd]')"))
        bpl = await E("""(()=>{if(typeof blkPeople!=='function'||!ADM.loaded)return null;const keep=window.BLOCKS;window.BLOCKS=[{id:'b1',name:'A',tz:'Europe/Zurich'},{id:'b2',name:'B',tz:'Europe/Zurich'}];
          const box=document.createElement('div');box.innerHTML=blkPeople(window.BLOCKS[1]);window.BLOCKS=keep;return {list:box.querySelectorAll('[data-blkp^="b2|"]').length>0,search:!!box.querySelector('[data-blkq]')}})()""")
        check("Drehblöcke: pro Block Personen zuteilen (Liste mit Suche)", bpl in (None, {"list": True, "search": True}), bpl, public=True)
        # 2nd Unit im Callsheet von heute (echte Daten): eine Szene der 2nd Unit antippen → läuft, nochmals → abgeschlossen (nur Zahlen und Codes im Protokoll)
        await E("S.pu={'1':true,'2':true,'3':false};S.uf={'1':true,'2':true,'3':false};pushGo('./#go=dispo:'+todayISO())"); await pg.wait_for_timeout(1500)
        u2c = await E("""(()=>{const bs=[...document.querySelectorAll('#view button[data-scack]')];const u2=bs.filter(b=>b.dataset.scack.endsWith('|2'));
          const sc=u2.filter(b=>!/\|(lunch|wrap|setup\d*)(_u\d)?\|/.test(b.dataset.scack)&&b.classList.contains('sk0'));
          return {all:bs.length,u2:u2.length,open:sc.length,key:sc.length?sc[0].dataset.scack:'',has:!!(S.dispos||[]).find(x=>x&&x.date===todayISO()&&x.cs&&x.cs.u2)}})()""")
        if u2c and u2c.get("key"):
            k = json.dumps(u2c["key"])
            async def _tap():
                await E("(()=>{const b=[...document.querySelectorAll('#view button[data-scack]')].find(b=>b.dataset.scack===%s);if(b){b.scrollIntoView();b.click()}})()" % k); await pg.wait_for_timeout(1500)
                if await E("!!document.querySelector('.scparb')"):
                    await E("document.querySelector('.scparb [data-scpar=par]').click()"); await pg.wait_for_timeout(1500)
                return await E("(()=>{const [d,sc,u]=%s.split('|');return scState(d,scK(sc,u))})()" % k)
            s1 = await _tap(); s2 = await _tap()
            u2c.update(s1=s1, s2=s2)
        u2c.pop("key", None)
        check("2nd Unit: im Callsheet eine Szene antippen → läuft, nochmals → abgeschlossen", not u2c or not u2c.get("has") or (u2c.get("u2", 0) > 0 and (u2c.get("open", 0) == 0 or (u2c.get("s1") == 1 and u2c.get("s2") == 2))), u2c, public=True)

    async def _p7():   # App-Verwaltung (Access, Tour, Dokumente, Log/Tests)
        # Access: roles per permission on top, pencil switches them right there, people to open
        await E("ADM.paccEdit='';S.tab='admin';ADM.sub='roles';render()"); await pg.wait_for_timeout(1500)   # a first try that stopped half-way may have left the pencil on
        ac = await E("(()=>{const d=document.querySelector('#view details[data-sec=\"pacc-view.plan\"]');return d?{roles:d.querySelectorAll('.paccr .ust').length,people:!!d.querySelector('details.paccp'),pen:!!d.querySelector('[data-paccedit]'),lab:d.querySelectorAll('.paccrole').length,gh:d.querySelectorAll('.paccr .ghint').length,pr:d.querySelectorAll('.paccr').length,ed:!!ADM.paccEdit,gen:(()=>{const t=document.createElement('template');t.innerHTML=VIEWS.admin();const g=t.content.querySelector('details[data-sec=\"pacc-view.plan\"]');return g?g.querySelectorAll('.paccr .ust').length:-1})(),nd:document.querySelectorAll('#view details[data-sec=\"pacc-view.plan\"]').length,nr:Object.keys(window.__db||{}).filter(k=>k.startsWith('roles/')).length}:null})()")
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
        cc = await E("""(async()=>{const keep=S.dispos,r0=DCK.res,at=DCK.at;const p=(S.crew[0]&&S.crew[0].people||[])[0];
          S.dispos=[{date:'2030-05-06',label:'DT99',cs:{calls:[{dept:'Extras Crew',role:'Extra Driver',name:'Zora Unbekannt'},{dept:'Kamera',role:'DoP',name:p?p.name:'x'}],crewTransport:[{vehicle:'Van',people:'Quirin Fremdling'}],transport:[{driver:'TBA'}]}}];
          await dckRun(true);const l=(DCK.res||[]).filter(x=>x.area==='Callsheets ↔ Crewliste'&&x.lvl==='warn').map(x=>x.text);S.dispos=keep;DCK.res=r0;DCK.at=at;render();
          return {zora:l.some(t=>t.startsWith('Zora Unbekannt – Extra Driver')),quirin:l.some(t=>t.startsWith('Quirin Fremdling')),known:!l.some(t=>p&&t.startsWith(p.name)),tba:!l.some(t=>/TBA/.test(t))}})()""")
        check("Dokumente prüfen: Personen auf Callsheets, die nicht in der Crewliste stehen", cc == {"zora": True, "quirin": True, "known": True, "tba": True}, cc, public=True)
        jn = await E("""(()=>{const t=todayISO();if(typeof nowCardHTML!=='function'||!(S.dispos||[]).some(x=>x&&x.date===t&&x.cs))return null;const want=!!nowCardHTML(t);const k=[S.tab,S.dday];S.tab='dispo';S.dday=t;render();
          const v=document.getElementById('view'),n=v.querySelector('.tcard.csnowc'),tl=v.querySelector('.cstiles');const r={same:!!n===want,above:!n||!!(tl&&(n.compareDocumentPosition(tl)&Node.DOCUMENT_POSITION_FOLLOWING))};S.tab=k[0];S.dday=k[1];render();return r})()""")
        check("Callsheet von heute: «Jetzt» wie in Today, oberhalb der Kacheln", jn in (None, {"same": True, "above": True}), jn, public=True)
        # «Mein Tag» for a person on the callsheet (first actor, 1st and 2nd Unit): every callsheet still drawn (no «konnte nicht angezeigt werden»)
        bad = await E("""(()=>{const keep=[window.PICKON,window.MYPICK],out=[];try{for(const d of (S.dispos||[]).filter(x=>x&&x.cs)){
            const ns=[...(d.cs.cast||[]),...(d.cs.calls||[]).map(r=>({actor:r&&r.name})).slice(0,1),...((d.cs.u2&&d.cs.u2.cast)||[])].map(r=>r&&r.actor).filter(Boolean).slice(0,3);
            for(const n of ns){window.PICKON=true;window.MYPICK=n;S.tab='dispo';S.dday=d.date;render();
              if(/konnte nicht angezeigt werden/.test(document.querySelector('#view').innerText))out.push(d.date)}}}
            finally{window.PICKON=keep[0];window.MYPICK=keep[1];render()}return out.join(',')})()""")
        check("Callsheet: «Mein Tag» als Person auf dem Callsheet wird angezeigt", not bad, bad)
        # only the 2nd Unit chosen: its callsheet alone (no part «2nd Unit» below, no error); only the 1st: no 2nd part
        u2v = await E("""(()=>{const keep=S.pu,out=[];try{for(const d of (S.dispos||[]).filter(x=>x&&x.cs)){S.tab='dispo';S.dday=d.date;
            S.pu={'1':false,'2':true,'3':false};render();const v=document.querySelector('#view');if(/konnte nicht angezeigt werden/.test(v.innerText)||v.querySelector('.csu2'))out.push('2:'+d.date);
            S.pu={'1':true,'2':false,'3':false};render();if(/konnte nicht angezeigt werden/.test(v.innerText)||v.querySelector('.csu2'))out.push('1:'+d.date)}}
            finally{S.pu=keep;render()}return out.join(',')})()""")
        check("Callsheet: Unit-Knöpfe – nur 2nd zeigt die 2nd Unit allein, nur 1st ohne 2nd-Teil", not u2v, u2v)
        # rides of a day with two units: each unit its own («2nd UNIT» in the place, or people only in one unit); the same ride never in only the wrong one
        rv = await E("""(()=>{if(typeof csRidesFor!=='function')return 'fehlt';const out=[];for(const d of (S.dispos||[]).filter(x=>x&&x.cs&&x.cs.u2)){const c=d.cs;
            const a=csRidesFor(c,'1').transport,b=csRidesFor(c,'2').transport;for(const r of (c.transport||[])){if(!a.includes(r)&&!b.includes(r))out.push('weg:'+d.date);
              const tx=[r.from,r.to].join(' ');if(/2nd\\s*unit/i.test(tx)&&a.includes(r))out.push('2nd bei 1st:'+d.date);if(/1st\\s*unit/i.test(tx)&&b.includes(r))out.push('1st bei 2nd:'+d.date)}}
            return out.join(',')})()""")
        check("Callsheet: Fahrten pro Unit (keine verloren, «2nd UNIT» nur bei der 2nd)", not rv, rv)
        # «Mein Tag» shows all own rides of the day, also those of the other unit (someone in both units, e.g. a director who also plays)
        mr = await E("""(()=>{const keep=[window.PICKON,window.MYPICK,S.pu],out=[];try{for(const d of (S.dispos||[]).filter(x=>x&&x.cs&&x.cs.u2)){const c=d.cs;
            const both=(c.cast||[]).map(r=>r.actor).filter(n=>n&&((c.u2.cast||[]).some(y=>y.actor===n)));for(const n of both.slice(0,2)){const h=nameHit(n);
              const mine=(c.transport||[]).filter(r=>h(r.passengers)).length;if(!mine)continue;window.PICKON=true;window.MYPICK=n;S.pu={'1':true,'2':false,'3':false};S.tab='dispo';S.dday=d.date;render();
              const shown=document.querySelectorAll('#view .csme .csme-r').length;if(!shown)out.push(d.date)}}}finally{window.PICKON=keep[0];window.MYPICK=keep[1];S.pu=keep[2];render()}return out.join(',')})()""")
        check("Callsheet: «Mein Tag» mit den eigenen Fahrten beider Units", not mr, mr)
        sy = await E("""(()=>{const keep=[S.days,S.locs];S.locs=JSON.parse(JSON.stringify(S.locs));S.locs.forEach(l=>(l.sets||[]).forEach(st=>st.scenes=[]));return 1})()""")
        await E("dckRun()"); await pg.wait_for_timeout(5000)
        sd2 = await E(r"""(async()=>{const sl=await scriptData();const ok=i=>i.sc&&/^\d+[A-Z]?$/.test(i.sc)&&/^I\/(?!E)/.test(i.ie||'');
            const d=S.days.find(d=>d.kind==='shoot'&&(d.items||[]).some(ok));if(!d)return null;const it=d.items.find(ok);
            const x=sl.find(y=>String(y.sc).toUpperCase()===String(it.sc).toUpperCase());if(!x)return null;
            const keep=x.head;x.head='EXT. TESTORT - NACHT';await dckRun();x.head=keep;return (DCK.res||[]).some(r=>r.lvl==='warn'&&r.text.includes('Innen/Aussen')&&r.text.includes(it.sc+' ('))})()""")
        if sd2 is not None:
            check("Dokumente prüfen: Drehplan ↔ Drehbuch erkennt Innen/Aussen-Widerspruch", sd2)
        # the other way round: a scene that is only in the script is reported; one marked as omitted is not
        rv = await E(r"""(async()=>{const sl=await scriptData();if(!sl.length)return null;const keep=sl.slice();sl.unshift({sc:'9997',head:'INT. TESTORT - TAG',text:'x'},{sc:'9998',head:'OMITTED',text:''},{sc:'9996',head:'EXT. INDIA - MUMBAI STREET - DAY',text:'x'});
            await dckRun();sl.length=0;keep.forEach(x=>sl.push(x));const r=(DCK.res||[]).filter(x=>x.area==='Drehbuch ↔ Drehplan');await dckRun();
            return {hit:r.some(x=>x.lvl==='warn'&&x.text.includes('9997')),omit:!r.some(x=>x.text.includes('9998'))&&!r.some(x=>x.text.includes('9996'))}})()""")
        if rv is not None:
            check("Dokumente prüfen: Szenen im Drehbuch, die im Drehplan fehlen (ohne gestrichene und Indien-Szenen)", rv == {"hit": True, "omit": True}, rv, public=True)
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
        rg = await E("(()=>{RTS.busy=true;render();const a=!!document.querySelector('#view details[data-lsec=\"rt\"] .tstall.prog');RTS.busy=false;GH.run={status:'in_progress',created_at:new Date().toISOString()};GH.jobs=[{name:'test',steps:[{name:'Werkzeuge',status:'completed'},{name:'Funktionen',status:'in_progress'},{name:'Sicherheit',status:'queued'},{name:'x',status:'queued'}]}];render();const b=document.querySelector('#view details[data-lsec=\"tst\"] .tstall.prog');const t=document.querySelector('#view details[data-lsec=\"tst\"] summary').textContent;const pv=b?b.style.getPropertyValue('--p'):'';GH.run=null;GH.jobs=[];render();return {rt:a,ring:!!b,p:pv,t}})()")
        rgi = {"rt": rg["rt"], "ring": rg["ring"], "p25": rg["p"].strip() == "25", "step": "Funktionen" in rg["t"]}
        check("Fortschritt als Ring im Auf-/Zuklapp-Knopf (läuft: Prozent und aktueller Schritt)", rgi["rt"] and rgi["ring"] and rgi["p25"] and rgi["step"], rgi, public=True)
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
        pf = await E("PREFKEYS.length+2")
        check("Einstellungen: auch mit allen Werten höchstens 16 Felder (Regel: Einstellungen + lt + x)", pf <= 16, pf)
        src = await E("savePrefs.toString()")
        check("Einstellungen: gesehene Hinweise in einem Feld «x» (gehen nicht mehr verloren), gespeichert erst nach dem Laden", "p.x=" in src and "PREFOK" in src and "serverTimestamp" not in src)
        px = await E("JSON.stringify([prefX({x:JSON.stringify({csb:'a'})}).csb,prefX({rc:'b'}).rc])")
        check("Einstellungen: Hinweise aus «x» und aus älteren Einzelfeldern gelesen", px == '["a","b"]', px)
        wa = await E("waNum('079 123 45 67')+'|'+bcWaHTML.toString().includes('waNum(')")
        check("Broadcast: WhatsApp-Link mit internationaler Nummer (079 → 4179)", wa == "41791234567|true", wa)
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
    # the parts that failed: once more, now their result counts
    again = RETRY_PARTS[:]; RETRY_PARTS.clear()
    for name, part in again:
        await pg.wait_for_timeout(1500)
        await run_part(name, part, pg, last=True)
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
    await E("offBar&&offBar()"); await pg.wait_for_timeout(100)
    check("Offline: Leiste «Offline – Stand von …» auf jeder Seite", await E("(()=>{S.tab='plan';render();offBar();const b=document.getElementById('offbar');return !!b&&/offline/i.test(b.textContent)&&/\\d\\d:\\d\\d/.test(b.textContent)})()"))
    fs = await E("(()=>{localStorage.setItem('fsize:v1','l');fsApply();const a=document.documentElement.classList.contains('fs-l');localStorage.setItem('fsize:v1','n');fsApply();return a&&!document.documentElement.classList.contains('fs-l')})()")
    check("Schriftgrösse Normal/Gross umschaltbar", fs)
    await b.close()


async def signout_test(p, port):
    """Abmelden: nichts von der Person bleibt auf dem Gerät (Daten, Schlüssel, Simulation, Start-Hinweise; Firebase-Kopie beim nächsten Start)"""
    b, pg, errs = await smoke.session(p, port, "owner")
    E = pg.evaluate
    try:
        before = await E("!!localStorage.getItem('crewcache:v1')&&!!localStorage.getItem('dk:v1')")
        await E("sessionStorage.setItem('sim','{}');document.body.appendChild(Object.assign(document.createElement('div'),{id:'csbeta'}))")
        await E("acctSignOut()"); await pg.wait_for_timeout(2500)
        r = await E("({cache:!localStorage.getItem('crewcache:v1'),key:!localStorage.getItem('dk:v1'),fs:localStorage.getItem('fsclear')==='1',sim:!sessionStorage.getItem('sim'),note:!document.getElementById('csbeta'),gate:!document.getElementById('gate').hidden,days:S.days.length===0})")
        check("Abmelden: Daten, Schlüssel, Simulation und Hinweise weg, Firebase-Kopie wird gelöscht", before and all(r.values()), dict(r, before=before), public=True)
    finally:
        await b.close()
    return errs


async def hidden_data(p, port):
    """C11: what a role may not see is really not there – also not in the search or the vCard"""
    phones = None
    for who in ("crew", "catering", "power", "norole"):
        b, pg, errs = await smoke.session(p, port, who)
        E = pg.evaluate
        perms = await E("({phone:vok('phone'),email:vok('email'),crew:vok('crew'),food:can('crew.food'),bday:can('crew.bday'),adm:isAdmin()})")
        if who == "crew":   # Drehblöcke: a topic switched off (or released only later) for the running block is gone; released from today: there
            bt = await E("""(()=>{const keep=window.BLOCKS,t=dateIn(Date.now(),'Europe/Zurich'),had=tabsOn();
              window.BLOCKS=[{id:'b2',name:'Indien',tz:'Europe/Zurich',from:t,to:'',topics:{info:'off',plan:'2999-01-01',dispo:t}}];
              const on=tabsOn(),r={info:!on.includes('info'),plan:!on.includes('plan')||!had.includes('plan'),dispo:on.includes('dispo')===had.includes('dispo')};
              window.BLOCKS=keep;return r})()""")
            check("Drehblöcke: Themen je Block aus, ab Datum oder an (Rolle ohne «Einstellungen»)", all(bt.values()), bt, public=True)
            bp = await E("""(()=>{const keep=window.BLOCKS,km=MEMBER,sd=S.days.filter(d=>d.kind==='shoot');if(sd.length<2)return null;const d1=sd[0].date,d2=sd[sd.length-1].date,n0=S.days.length;
              window.BLOCKS=[{id:'b1',name:'A',tz:'Europe/Zurich',from:'',to:d1},{id:'b2',name:'B',tz:'Europe/Zurich',from:d2,to:''}];
              setMEMBER(Object.assign({},MEMBER,{blk:['b1']}));const a=!S.days.some(d=>d.date>=d2)&&S.days.some(d=>d.date===d1)&&!S.dispos.some(c=>c&&c.date>=d2);
              setMEMBER(Object.assign({},MEMBER,{blk:undefined}));const b=S.days.length===n0;window.BLOCKS=keep;setMEMBER(km);cdApplyAll();return {hand:a,auto:b,back:S.days.length===n0}})()""")
            check("Drehblöcke pro Person: von Hand nur die gewählten Blöcke (Drehtage, Callsheets), automatisch alle", bp in (None, {"hand": True, "auto": True, "back": True}), bp, public=True)
        if phones is None:
            phones = await E("S.crew.flatMap(g=>(g.people||[]).map(p=>String(p.phone||'').replace(/\\D/g,'')).filter(x=>x.length>=8)).slice(0,30)")
        texts = []; links = []
        for t in await E("tabsOn()"):
            await E(f"S.tab='{t}';render()"); await pg.wait_for_timeout(200)
            # the hospital (emergency number) is shown to everyone; «Hotel:» in a text is no phone link – only real tel: links count
            r = await E("(()=>{const v=document.getElementById('view'),hs=[...v.querySelectorAll('a.hosp')].map(a=>a.innerText);let t=v.innerText;for(const x of hs)t=t.split(x).join(' ');return {t,l:[...v.querySelectorAll('a[href^=\"tel:\"]:not(.hosp)')].map(a=>a.getAttribute('href'))}})()")
            texts.append(r["t"]); links += [t + ":" + x for x in r["l"]]
        await E("S.gm='all';openSearch();$('#gq').value='a';renderSearch()"); await pg.wait_for_timeout(200)
        texts.append(await E("$('#gres').innerText")); await E("closeSearch()")
        toks = {re.sub(r"\D", "", t)[-9:] for t in re.findall(r"\+?\d[\d .\-/]{7,}\d", " ".join(texts))}
        shown = [x for x in phones if x[-9:] in toks]
        if not perms["phone"]:
            check(f"{who}: keine Telefonnummern (Seiten und Suche)", not shown and not links, (len(shown), [x.split(":")[0] for x in links][:5]))
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
            # same role, other rights: no message (only a change of the role is announced)
            await E("(()=>{const k=memKey();const c=JSON.parse(localStorage.getItem(k)||'{}');c.p=(c.p||[]).filter(p=>p!=='view.dispo');localStorage.setItem(k,JSON.stringify(c))})()")
            await E("checkMember().catch(()=>{})"); await pg.wait_for_timeout(3500)
            check("Rechte geändert, Rolle gleich: keine Nachricht", not await E("!!document.getElementById('rolechg')"))
            await E("(()=>{localStorage.removeItem('rc');const k=memKey();const c=JSON.parse(localStorage.getItem(k)||'{}');c.r='crew';c.p=(c.p||[]).filter(p=>p!=='view.dispo');localStorage.setItem(k,JSON.stringify(c))})()")
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
            await E("(()=>{localStorage.removeItem('rc');const k=memKey();const c=JSON.parse(localStorage.getItem(k)||'{}');c.r='crew';c.p=(c.p||[]).concat(['users.edit']);localStorage.setItem(k,JSON.stringify(c))})()")
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
        if lang != "de": await E(f"new Promise(r=>window.i18nLoad?i18nLoad('{lang}',r):r())")
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
    # the translations come per language from i18n/<lang>.json: all of them loaded for this check
    await E("Promise.all(['fr','it','en','hi'].map(l=>new Promise(r=>{if(window.i18nLoad)i18nLoad(l,r);else r()})))")
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
            async def unit(name, fn):
                common.GROUP = "" if name == "Funktionen" else name
                try:
                    errs = await fn(p, port)
                    if name == "Funktionen": check("Funktionstests ohne Skriptfehler", not errs, (errs or [])[:3])
                except Exception as e:
                    check(f"{name}: Test lief durch", False, f"{type(e).__name__}: {str(e)[:150]}")
            later = []
            for name, fn in (("Funktionen", owner_tests), ("Offline", offline_test), ("Berechtigungen", hidden_data), ("Sprachen", languages), ("Abmelden", signout_test)):
                i = common.mark(); await unit(name, fn)
                # the short tests (offline, rights, languages): failed → put aside, once more at the end (the owner tests repeat their parts themselves)
                if name != "Funktionen" and common.failed_since(i):
                    common.drop_since(i); later.append((name, fn)); print("… " + name + ": fehlgeschlagen – wird am Schluss nochmals ausgeführt", flush=True)
            for name, fn in later:
                i = common.mark(); await unit(name, fn)
                if not common.failed_since(i): common.second_try_ok(name)
    finally:
        srv.terminate()
    return done("Funktionen")


if __name__ == "__main__":
    smoke.KEY = smoke.crew_key(); smoke.AK = smoke.area_keys()
    sys.exit(asyncio.run(main()))
