#!/usr/bin/env python3
"""Kurzer Test der Crew-App vor dem Veröffentlichen (lokal und in GitHub Actions).

Startet die gebaute index.html mit einer nachgebauten Firebase (tests/fake) und echten, verschlüsselten Daten,
meldet sich mit sechs Rollen an und prüft die wichtigsten Seiten und Bedienelemente.
Ausgabe: nur ✓/✗ und Zahlen – nie Inhalte der Crew-Daten (das Protokoll ist öffentlich).

Schlüssel: Umgebungsvariable CREW_KEY, sonst über das Dienstkonto (FIREBASE_SA), sonst ~/.crewkey.
Aufruf: python3 tests/smoke.py   (Exit 1, wenn etwas fehlschlägt)
"""
import asyncio, json, os, subprocess, sys, time, pathlib, socket
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAKE = ROOT / "tests" / "fake"
sys.path.insert(0, str(ROOT / "tools"))


def crew_key():
    k = ""
    if os.environ.get("FIREBASE_SA"):   # the key in Firestore is the valid one (also after a key change)
        try:
            import fsadmin; k = fsadmin.crew_key_b64()
        except Exception: k = ""
    k = k or os.environ.get("CREW_KEY", "").strip()
    if not k:
        p = pathlib.Path.home() / ".crewkey"
        if p.exists(): k = p.read_text().strip()
    if not k: sys.exit("Kein Crew-Schlüssel (CREW_KEY / FIREBASE_SA)")
    return k


def area_keys():
    """keys of the areas (Drehbuch, Telefon/E-Mail) from Firestore – empty before they exist (files then use the crew key)"""
    out = {}
    if os.environ.get("FIREBASE_SA"):
        try:
            import fsadmin
            for a in fsadmin.AREAS:
                k = fsadmin.area_key_b64(a, create=False)
                if k: out["secret/key" + a] = {"k": k}
        except Exception: pass
    return out


AK = {}
PEOPLE = {"owner": "furtschellas@gmail.com", "admin": "admin@test.ch", "crew": "crew@test.ch",
          "catering": "cater@test.ch", "power": "power@test.ch", "norole": "nor@test.ch"}

SEED = r"""
try{localStorage.setItem("welcomeAck","2026-01-01T00:00:00Z|1");localStorage.setItem("a2hs:v1","done");localStorage.setItem("nv","%(nv)s");
  if(!sessionStorage.getItem("tourtest")){const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return /^tourDone:/.test(k)?"done|2026-01-01T00:00:00Z":g.call(this,k)}}}catch(_){}
window.__db=JSON.parse(sessionStorage.getItem("fakedb")||"null")||Object.assign({"secret/key":{k:%(key)s}},%(ak)s);
window.__users=JSON.parse(sessionStorage.getItem("fakeusers")||"null")||{"furtschellas@gmail.com":{uid:"owner1",email:"furtschellas@gmail.com",pw:"geheim123",verified:true}};
addEventListener("pagehide",()=>{sessionStorage.setItem("fakeusers",JSON.stringify(window.__users));sessionStorage.setItem("fakedb",JSON.stringify(window.__db))});
(function(){if(sessionStorage.getItem('seed'))return;sessionStorage.setItem('seed','1');
const P=%(people)s;const VP=["view.plan","view.prep","view.dispo","view.loc","view.csmap","view.info","view.script","view.blocking","view.crew","view.phone","view.email","view.mycal","scenes.times","scenes.see"];
window.__db['roles/crew']={name:'Crew',perms:VP};
window.__db['roles/catering']={name:'Catering',perms:["view.plan","view.dispo","view.loc","view.info","view.crew","crew.food","view.mycal","menus.edit"]};
window.__db['roles/power']={name:'Power',perms:VP.concat(["users.view","users.edit","roles.assign","roles.edit","push.send","audit.view","crew.bday","data.check"])};
window.__db['admins/'+P.admin]={addedAt:'x'};
let i=0;for(const k in P){const e=P[k];if(k==='owner')continue;i++;const uid='u_'+k;
  window.__users[e]={uid,email:e,pw:'geheim123',verified:true};
  window.__db['members/'+uid]={active:true,email:e,firstName:k,lastName:'Test',diet:'none',intol:[],phone:'+41 79 000 00 0'+i,contactEmail:e,lang:'de',welcomeAck:'2026-01-01T00:00:00Z',welcomeVer:1,tour:'skip'};
  window.__db['invites/'+e]={name:k};
  if(k==='crew'||k==='catering'||k==='power')window.__db['userroles/'+e]={role:k};}
})();
window.__deny=(path,op,d)=>{const e=(()=>{try{return JSON.parse(sessionStorage.getItem("fakeuser")||"null")}catch(_){return null}})();const em=e&&(e.email||e);const u=em&&window.__users[em];
  if(!u)return !/^(config)/.test(path);
  const owner=em==="furtschellas@gmail.com",admin=owner||!!window.__db["admins/"+em];const ur=window.__db["userroles/"+em],rp=ur&&window.__db["roles/"+ur.role]?window.__db["roles/"+ur.role].perms:[];
  const can=p=>owner||(admin&&p!=="settings")||rp.includes(p);const mem=!!(window.__db["members/"+u.uid]&&window.__db["members/"+u.uid].active);
  const [col,id]=path.split("/");
  if(col==="secret"&&id==="keyscript")return !((mem||admin)&&can("view.script"));
  if(col==="secret"&&id==="keycontacts"){const c=window.__db["config/app"]||{};return !((mem||admin)&&(can("view.phone")||can("view.email")||(mem&&!ur&&(c.phonePublic===true||c.emailPublic===true))))}
  if(col==="secret")return !(mem||admin);
  if(col==="members"&&op==="list")return !(can("users.view")||can("users.edit")||can("crew.food")||can("crew.bday"));
  if(col==="userroles"&&op==="list")return !(admin||can("roles.assign")||can("roles.edit"));
  if(col==="push"&&op==="list")return !admin;
  if(col==="broadcasts"&&op==="list")return !(admin||can("push.send"));
  if(col==="broadcasts"&&op==="write")return !can("push.send");
  if(col==="audit"&&op==="list")return !(admin||can("audit.view"));
  if(col==="config"&&op==="write")return !can("settings");
  if((col==="admins"||col==="owners")&&op==="list")return !(admin||can("users.view")||can("users.edit")||can("roles.assign")||can("roles.edit")||can("roles.view"));
  return false};
"""

from common import check, FAILS, RESULTS, done  # noqa: E402  (same output for every test part)


def wait_port(port, t=15):
    """the test server needs a moment, longer on a slow machine"""
    end = time.time() + t
    while time.time() < end:
        try: socket.create_connection(("127.0.0.1", port), 0.5).close(); return
        except OSError: time.sleep(0.2)


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


async def session(p, port, who, width=390, extra=""):
    b = await p.chromium.launch()
    ctx = await b.new_context(viewport={"width": width, "height": 860}, service_workers="block")
    nv = ""
    try: nv = (ROOT / "tools" / "boot" / "08-chat-tour.js").read_text().split('NEWS_VER="')[1].split('"')[0]
    except Exception: pass
    await ctx.add_init_script(SEED % {"key": json.dumps(KEY), "ak": json.dumps(AK), "people": json.dumps(PEOPLE), "nv": nv})
    if extra: await ctx.add_init_script(extra)
    await ctx.add_init_script("try{localStorage.setItem('lang','de')}catch(_){}")
    await ctx.add_init_script("window.__scrNewsOff=true")   # the message on a new script version is tested on its own (func.py)
    # nothing leaves the machine: weather, fonts, GitHub, worker
    await ctx.route(lambda u: not (u.startswith("http://127.0.0.1:%d" % port) or "/firebasejs/" in u), lambda r: r.abort())
    for name, f in [("firebase-app.js", "app.js"), ("firebase-auth.js", "auth.js"), ("firebase-firestore.js", "fs.js")]:
        body = (FAKE / f).read_text()
        await ctx.route("**/firebasejs/**/" + name, lambda r, q=None, body=body: r.fulfill(status=200, content_type="text/javascript", body=body))
    pg = await ctx.new_page(); pg.set_default_timeout(15000)
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    # errors the app catches itself but logs (e.g. a part calling a function of a part not loaded yet) count too
    pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" and ("ReferenceError" in m.text or "is not defined" in m.text or "is not a function" in m.text) else None)
    await pg.goto("http://127.0.0.1:%d/" % port, wait_until="domcontentloaded"); await pg.wait_for_selector("#gem", state="visible"); await pg.wait_for_timeout(300)
    await pg.fill("#gem", PEOPLE[who]); await pg.fill("#gpw", "geheim123"); await pg.click("#gate button[type=submit]")
    await pg.wait_for_timeout(2800)
    await pg.evaluate("document.querySelectorAll('.a2hs,#tour').forEach(x=>x.remove());if(window.TOUR)TOUR.el=null")
    return b, pg, errs


# shared building blocks (same meaning everywhere); any OTHER class name used in two modules is a collision risk
SHARED = set("""lgl cqon cqall cqcar cql cq0 cq1 cq2 cqro cqf mkd mkt cqcd sml err wlwarn wlbox acsub tbord tbrow tbmv audh audt audw audb audlist tstsec tsth redst redrow lsum lsh lss lst tstsu tstl tstbtns ghint pillbtn a2hs a2box ck ahint amsg lnk a2b empty arb pgt chk role mypage admins ok psec off pri refresh efood
xclose gbtn lang glink hasreq smodes pok pushsec amap wlbox sec wlbeta cath3 catchip reg catchips myhead asub n acbox warn cico
em search src dh on ico spin ttile fact v ust bcchk calbtn mcd uh tstsec tsth""".split())

def class_collisions():
    """class names that two different modules (tools/boot/*.js, app.html) use – except the shared building blocks"""
    import re, collections
    use = collections.defaultdict(set)
    for f in sorted((ROOT / "tools" / "boot").glob("*.js")) + [ROOT / "tools" / "app.html", ROOT / "tools" / "a2hs.js"]:
        s = f.read_text()
        for m in re.finditer(r"""class(?:Name)?\s*=\s*\\?["']([^"'<>]{1,200})["']""", s):
            for c in re.findall(r"[a-zA-Z][\w-]*", m.group(1)): use[c].add(f.stem)
    return {c: sorted(v) for c, v in use.items() if len(v) > 1 and c not in SHARED}


# phone test: a page wider than the screen (sideways scrolling) – only a warning, never blocks publishing
OVERFLOW = """(()=>{if(document.documentElement.scrollWidth<=innerWidth+1)return '';
  /* the widest element that sticks out: only tag and class names (no crew data) */
  const out=[...document.querySelectorAll('#view *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&!e.closest('.strip,.csjb,.tblw')});
  const top=out.filter(e=>!out.includes(e.parentElement)).slice(0,2);return top.map(e=>e.tagName.toLowerCase()+'.'+String(e.getAttribute('class')||'').trim().split(/\\s+/).slice(0,2).join('.')).join(' ')||'?'})()"""
OVER = {}


async def phone_widths(p, port):
    """all pages of the owner at Android width (360) and iPhone width (390), every day bar page also on a shooting day"""
    for w in (360, 390):
        b, pg, errs = await session(p, port, "owner", width=w)
        E = pg.evaluate
        for t in await E("tabsOn()"):
            await E(f"S.tab='{t}';render()"); await pg.wait_for_timeout(250)
            o = await E(OVERFLOW)
            if o: OVER.setdefault(t, set()).add(f"{w} {o}")
        for t in ("plan", "dispo"):
            await E(f"(()=>{{const d=(S.days||[]).find(d=>d.kind==='shoot');if(!d)return;S.tab='{t}';S.day=d.id;S.dday=d.date;render()}})()"); await pg.wait_for_timeout(300)
            o = await E(OVERFLOW)
            if o: OVER.setdefault(t + " (Drehtag)", set()).add(f"{w} {o}")
        await b.close()
    msg = ", ".join(f"{k} ({'; '.join(sorted(v))})" for k, v in sorted(OVER.items()))
    print("✓ Handy-Test 360/390 px: " + ("kein seitliches Scrollen" if not msg else "Warnung – seitliches Scrollen auf " + msg), flush=True)
    if msg and os.environ.get("GITHUB_ACTIONS"):
        print(f"::warning title=Handy-Test::Seitliches Scrollen auf {msg}", flush=True)


async def main():
    from playwright.async_api import async_playwright
    col = class_collisions()
    check("Keine Klassennamen, die zwei Bereiche unterschiedlich verwenden", not col, col)
    port = free_port()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(ROOT)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    wait_port(port)
    try:
        async with async_playwright() as p:
            # ---------- every role: signed in, every page renders, no script errors ----------
            for who in PEOPLE:
                b, pg, errs = await session(p, port, who)
                E = pg.evaluate
                check(f"{who}: angemeldet", await E("!!ME"))
                tabs = await E("tabsOn()")
                bad = []
                for t in tabs:
                    await E(f"S.tab='{t}';render()"); await pg.wait_for_timeout(250)
                    if "konnte nicht angezeigt" in await E("document.getElementById('view').innerText"): bad.append(t)
                    o = await E(OVERFLOW)
                    if o: OVER.setdefault(t, set()).add("390 " + o)
                check(f"{who}: alle Seiten ({len(tabs)}) ohne Anzeigefehler", not bad, bad)
                if who == "norole":
                    check("ohne Rolle: kein Drehplan", "plan" not in tabs, tabs)
                    n = await E("(()=>{try{return searchAll('2').filter(r=>r.kind==='sc'||r.k==='sc').length}catch(_){return 0}})()")
                    check("ohne Rolle: Suche zeigt keine Szenen", n == 0, n)
                if who == "owner":
                    # Today
                    await E("S.tab='today';render()"); await pg.wait_for_timeout(600)
                    check("Today: Seite mit Karten", await E("document.querySelectorAll('#view .today .tcard').length") >= 1)
                    tl = await E("[...document.querySelectorAll('#view .today .ttiles>*')].map(t=>{const r=t.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width)]})")
                    cols = len({x[0] for x in tl}); rws = len({x[1] for x in tl})
                    check("Today auf dem Handy: Kacheln kompakt wie im Callsheet (mind. 3 pro Zeile)", len(tl) < 3 or cols >= 3, tl)
                    rows = await E("[...document.querySelectorAll('#view .tsclist li')].map(l=>Math.round(l.getBoundingClientRect().height))")
                    check("Today: Szenen je eine Zeile", all(h <= 30 for h in rows), rows[:5])
                    # push history: admins see who got the message (devices in «done» → person)
                    await E("""(async()=>{const key=await getDataKey();const en=async o=>{const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(o))));const a=new Uint8Array(12+ct.length);a.set(iv);a.set(ct,12);return btoa(String.fromCharCode(...a))};
                      window.__db['push/devA']={c:await en({who:{email:'crew@test.ch'}})};window.__db['push/devB']={c:await en({who:{email:'catering@test.ch'}})};
                      window.__db['broadcasts/bT']={c:await en({title:'Test',body:'x',at:Date.now(),push:true}),n:3,done:['devA','devB','devGone']};
                      BC.hist=null;S.tab='bcast';render()})()""")
                    await pg.wait_for_timeout(1500)
                    rc = await E("(()=>{const d=document.querySelector('#view details.bcr');if(!d)return '';d.open=true;return d.textContent})()")
                    check("Push-Verlauf: Empfänger sichtbar", "(2 + 1" in rc and "abgemeldet" in rc, rc[:120])
                    # day chips: label and date always the same distance
                    await E("S.tab='plan';render()"); await pg.wait_for_timeout(500)
                    gaps = await E("[...document.querySelectorAll('.chip')].slice(0,8).map(c=>{const l=c.querySelector('.lb'),d=c.querySelector('.dd');return l&&d?Math.round(d.getBoundingClientRect().top-l.getBoundingClientRect().bottom):0})")
                    check("Tages-Chips: Kürzel und Datum überall gleich", len(set(gaps)) <= 1, gaps)
                    # header icons keep their size (not shrunk), main menu short on the phone
                    check("Kopf-Symbole nicht verkleinert", await E("!document.querySelector('header .hbtns').style.getPropertyValue('--bs')"))
                    lab = await E("[...document.querySelectorAll('nav.tabs button[data-tab]')].filter(b=>!b.hidden).map(b=>{const l=b.querySelector('.lbl');return getComputedStyle(l).fontSize==='0px'?getComputedStyle(l,'::after').content.replace(/\"/g,''):l.textContent})")
                    check("Hauptmenü auf dem Handy kurz (Sched, Call, Loc)", "Sched" in lab and "Loc" in lab, lab)
                    one = await E("(()=>{const n=document.querySelector('nav.tabs .in');const v=n.style.getPropertyValue('--ntabs');n.style.removeProperty('--ntabs');const t=new Set([...n.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>Math.round(b.getBoundingClientRect().top)));if(v)n.style.setProperty('--ntabs',v);return t.size})()")
                    check("Hauptmenü schon beim Laden einzeilig (vor dem Zählen der Bereiche)", one == 1, one)
                    # search modes in one row, short labels
                    await pg.click("#searchBtn"); await pg.wait_for_timeout(400)
                    one = await E("(()=>{const r=document.querySelector('.gsearch .smodes');if(!r)return false;const k=[...r.children];return k[k.length-1].offsetTop===k[0].offsetTop})()")
                    check("Suchauswahl auf einer Zeile", one)
                    await E("closeSearch&&closeSearch()") if await E("typeof closeSearch==='function'") else None
                    # admin area in one row
                    await E("S.tab='admin';ADM.sub='users';render()"); await pg.wait_for_timeout(600)
                    rowsA = await E("(()=>{const a=document.querySelector('.asub');if(!a)return 0;return new Set([...a.querySelectorAll('button')].map(b=>Math.round(b.getBoundingClientRect().top))).size})()")
                    check("App-Verwaltung: Bereiche auf einer Zeile", rowsA == 1, rowsA)
                    # push settings
                    await E("S.tab='acct';ACSUB='note';render()"); await pg.wait_for_timeout(400)
                    check("Mein Konto → Push: Schalter «Bei Änderungen» inkl. Drehbuch", await E("document.querySelectorAll('[data-pushnews]').length===PUSH_NEWS.filter(x=>vok(x[2])).length&&(!vok('script')||!!document.querySelector('[data-pushnews=\"script\"]'))"))
                    # deep links from push messages
                    await E("pushGo('#go=dispo:2026-10-21')"); await pg.wait_for_timeout(700)
                    check("Push-Link öffnet das Callsheet", await E("S.tab+' '+S.dday") == "dispo 2026-10-21")
                    # tour
                    await E("tourStart(false)"); await pg.wait_for_timeout(600)
                    n = await E("TOUR.steps.length")
                    w = await E("Math.round(document.querySelector('#tour .tour-card').getBoundingClientRect().width)")
                    check("Tour startet", n >= 20, n)
                    check("Tour-Fenster unverändert breit", w >= 250, w)
                    await E("tourEnd&&tourEnd('skip',true)") if await E("typeof tourEnd==='function'") else None
                check(f"{who}: keine Skriptfehler", not errs, errs[:2])
                await b.close()
            # ---------- phone: no sideways scrolling (warning only) ----------
            try: await phone_widths(p, port)
            except Exception as e: print("::warning title=Handy-Test::nicht gelaufen – " + type(e).__name__, flush=True)
            # ---------- desktop: long menu names ----------
            b, pg, errs = await session(p, port, "owner", width=1280)
            lab = await pg.evaluate("[...document.querySelectorAll('nav.tabs button[data-tab]')].filter(b=>!b.hidden).map(b=>b.querySelector('.lbl').textContent)")
            short = await pg.evaluate("document.querySelector('nav.tabs').classList.contains('short')")
            check("Desktop: Hauptmenü lang (Schedule, Callsheet, Location)", "Schedule" in lab and not short, lab)
            await b.close()
            # ---------- returning user: «Neu in der Crew-App» once ----------
            b, pg, errs = await session(p, port, "crew", extra="try{if(!sessionStorage.getItem('nvx')){sessionStorage.setItem('nvx','1');localStorage.removeItem('nv')}}catch(_){}")
            await pg.evaluate("localStorage.removeItem('nv');window.pushHintDue=()=>false;window.a2hsDue=()=>false;document.querySelectorAll('.a2hs').forEach(x=>x.remove());WELCOME_OPEN=false;ONBOARD=false;TOUR.el=null;TOUR.pending=false;maybeTour()"); await pg.wait_for_timeout(1200)
            check("Neu-Nachricht erscheint einmal", await pg.evaluate("!!document.getElementById('news')"))
            if await pg.evaluate("!!document.querySelector('[data-nwok]')"): await pg.click("[data-nwok]")
            await pg.wait_for_timeout(300)
            check("Neu-Nachricht danach weg", await pg.evaluate("!newsDue()"))
            await b.close()
    finally:
        srv.terminate()
    return done("App")


if __name__ == "__main__":
    KEY = crew_key(); AK = area_keys()
    sys.exit(asyncio.run(main()))
