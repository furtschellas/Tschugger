#!/usr/bin/env python3
"""Sicherheit: das öffentliche Repository verrät nichts, die Seite ist gegen eingeschleusten Code geschützt,
Verschlüsselung, Service Worker, Worker und GitHub-Abläufe sind dicht. (Die Firestore-Regeln prüft rules.test.mjs.)

  python3 tests/security.py
"""
import asyncio, base64, json, os, re, secrets, subprocess, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from common import check, done  # noqa: E402


def tracked():
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True).stdout.split()
    return [ROOT / f for f in out if not f.startswith("blk/")]


TEXT = (".html", ".js", ".mjs", ".py", ".json", ".md", ".yml", ".css", ".rules", ".txt", ".webmanifest", ".svg")
files = [f for f in tracked() if f.suffix in TEXT and f.exists()]
src = {f: f.read_text(errors="ignore") for f in files}

# ---------- 1) nothing secret in the public repository ----------
SECRET = [(r"-----BEGIN (RSA |EC )?PRIVATE KEY-----", "privater Schlüssel"), (r"\bghp_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}", "GitHub-Token"),
          (r"\bsk-ant-[A-Za-z0-9\-_]{20,}", "Anthropic-Schlüssel"), (r'"private_key_id"\s*:', "Firebase-Dienstkonto"),
          (r"\bsl\.[A-Za-z0-9\-_]{100,}", "Dropbox-Token"), (r"(?i)refresh_token\s*[=:]\s*['\"][A-Za-z0-9\-_]{30,}", "Refresh-Token")]
hits = [(f.name, what) for f, s in src.items() for pat, what in SECRET if re.search(pat, s) and f.name != "security.py"]
check("Repository: keine Schlüssel, Tokens oder Dienstkonten", not hits, hits[:5])

# the GitHub runs (Dropbox update, push, key change …) must at least compile – a syntax error stops the data update
import py_compile
bad = []
for f in sorted((ROOT / "tools").glob("*.py")):
    try: py_compile.compile(str(f), doraise=True)
    except py_compile.PyCompileError as e: bad.append(f.name + ": " + str(e).splitlines()[-1][:120])
check("Abläufe (tools/*.py): alle Python-Dateien ohne Syntaxfehler", not bad, bad[:5])

emails = set()
for f, s in src.items():
    if f.name in ("security.py",) or "/tests/" in str(f) or f.suffix in (".svg",): continue
    for m in re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", s):
        if not re.search(r"(furtschellas@gmail\.com|noreply|example|test\.ch|users\.noreply\.github\.com|gserviceaccount\.com|anthropic\.com|@\d|\.(png|jpg|svg|js|css)$)", m): emails.add(m)
check("Repository: keine E-Mail-Adressen der Crew im Klartext", not emails, sorted(emails)[:5])

for name in ("data.enc.json", "script.enc.json", "contacts.enc.json", "media.enc.json", "tools/places_extra.enc.json", "tools/spec.enc.json", "tools/vapid.enc.json"):
    p = ROOT / name
    if not p.exists(): continue
    try: e = json.loads(p.read_text()); ok = set(e) >= {"iv", "ct"} and len(base64.b64decode(e["ct"])) > 16
    except Exception: ok = False
    check(f"Verschlüsselt im Repository: {name}", ok)

tj = json.loads((ROOT / "tests.json").read_text()) if (ROOT / "tests.json").exists() else {}
blob = json.dumps(tj, ensure_ascii=False)
check("Testresultate (öffentlich): nur Namen der Prüfungen, keine Adressen oder Nummern",
      not re.search(r"@[a-z0-9-]+\.[a-z]{2,}|\+41\s?\d{2}\s?\d{3}", blob))

# names from the crew list (decrypted with the key) must not appear in plain text – except the app contact in the welcome texts
try:
    import smoke as _sm
    _k = base64.b64decode(_sm.crew_key())
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM as _A
    _e = json.loads((ROOT / "data.enc.json").read_text())
    _d = json.loads(_A(_k).decrypt(base64.b64decode(_e["iv"]), base64.b64decode(_e["ct"]), None))
    names = {p["name"] for g in _d.get("crew", []) for p in g.get("people", []) if len(str(p.get("name", ""))) > 6}
    leak = set()
    for f, s in src.items():
        if f.name == "tests.json": continue
        for n in names:
            for m in re.finditer(re.escape(n), s):
                ctx = s[max(0, m.start() - 250):m.end() + 250]
                if not re.search(r"kontaktieren|contacter|contattare|contact|संपर्क|Fehler|erreur|errore|mistake|wrong|गलती", ctx): leak.add((f.name, n[:3] + "…"))
    check(f"Repository: keine Namen aus der Crewliste im Klartext ({len(names)} geprüft)", not leak, sorted(leak)[:5])
except SystemExit:
    pass

# ---------- 2) encryption ----------
from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # noqa: E402
k = secrets.token_bytes(32); iv = secrets.token_bytes(12); ct = AESGCM(k).encrypt(iv, b'{"crew":"x"}', None)
def fails(fn):
    try: fn(); return False
    except Exception: return True
check("Verschlüsselung: falscher Schlüssel kann nicht lesen", fails(lambda: AESGCM(secrets.token_bytes(32)).decrypt(iv, ct, None)))
check("Verschlüsselung: veränderte Daten werden erkannt", fails(lambda: AESGCM(k).decrypt(iv, ct[:-1] + bytes([ct[-1] ^ 1]), None)))

# ---------- 3) the page itself ----------
html = (ROOT / "index.html").read_text()
csp = (re.search(r'Content-Security-Policy" content="([^"]+)"', html) or [None, ""])[1]
check("Seite: Content-Security-Policy vorhanden", bool(csp))
check("Seite: kein eval im Skript erlaubt ('unsafe-eval')", "unsafe-eval" not in csp)
check("Seite: keine Plugins/Objekte, Basis-Adresse fest (object-src 'none', base-uri 'self')", "object-src 'none'" in csp and "base-uri 'self'" in csp)
check("Seite: Formulare nur an die eigene Seite (form-action 'self')", "form-action 'self'" in csp)
blank = [m.group(0)[:80] for f, s in src.items() if f.suffix in (".js", ".html") and f.name != "index.html"
         for m in re.finditer(r"<a\b[^<>]*?target=\\?\"_blank\\?\"[^<>]*", s) if "noopener" not in m.group(0)]
check("Links in neuem Fenster immer mit rel=noopener", not blank, blank[:3])
check("Keine gefährlichen Funktionen (eval, new Function, document.write)",
      not [f.name for f, s in src.items() if f.suffix == ".js" and re.search(r"\beval\(|new Function\(|document\.write\(", s)])

sw = (ROOT / "sw.js").read_text()
check("Service Worker: Crew-Datei und Anmeldung werden nie zwischengespeichert",
      "data\\.enc\\.json$/.test(u.pathname))return" in sw and "firebasejs" in sw and "identitytoolkit" not in sw.replace("//", ""))

# ---------- 3b) no AI gets the data publicly ----------
rb = (ROOT / "robots.txt").read_text() if (ROOT / "robots.txt").exists() else ""
check("KI: robots.txt sperrt Suchmaschinen und KI-Crawler (GPTBot, ClaudeBot, Google-Extended, CCBot …)",
      all(b in rb for b in ("GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "PerplexityBot")) and re.search(r"User-agent: \*\s*\nDisallow: /", rb))
check("KI: Seite verbietet Indexieren, Archivieren und KI-Nutzung (meta robots)", re.search(r'name="robots" content="[^"]*noindex[^"]*noarchive[^"]*noai', html))
ai_hosts = r"api\.openai\.com|generativelanguage\.googleapis\.com|api\.mistral\.ai|api\.cohere|huggingface\.co|api\.perplexity|api\.groq|deepseek|api\.x\.ai"
check("KI: keine anderen KI-Dienste im Code", not [f.name for f, s in src.items() if f.name != "security.py" and re.search(ai_hosts, s)])
anth = {f.name for f, s in src.items() if "api.anthropic.com" in s and f.name != "security.py"}
check("KI: nur die Dropbox-Aktualisierung und der Worker sprechen mit Claude (API, nicht öffentlich)", anth <= {"update_from_dropbox.py", "chat_worker.js"}, sorted(anth))
check("KI: die App selbst schickt nichts an eine KI (nur über den eigenen Worker)", not [f.name for f, s in src.items() if f.parent.name == "boot" and "anthropic.com/v1" in s] and "anthropic.com/v1" not in (ROOT / "tools" / "app.html").read_text())
check("KI: keine Ablage von Dateien bei der KI (Files API) – Daten werden nur gelesen, nicht gespeichert",
      not re.search(r"/v1/files|anthropic-beta[^\n]*files", src.get(ROOT / "tools" / "update_from_dropbox.py", "") + src.get(ROOT / "tools" / "chat_worker.js", "")))
check("Dropbox: nur gelesen (keine Schreib-, Verschiebe- oder Freigabe-Aufrufe)",
      not re.search(r"/2/files/(upload|delete|move|copy|create_folder)|/2/sharing/(create|add)", src.get(ROOT / "tools" / "update_from_dropbox.py", "")))

# ---------- 4) worker and GitHub ----------
wk = (ROOT / "tools" / "chat_worker.js").read_text()
check("Worker: nur von der eigenen Website aufrufbar (CORS)", 'const ORIGINS = ["https://furtschellas.github.io"' in wk and "ORIGINS.includes(origin)" in wk)
check("Worker: jeder Aufruf prüft Anmeldung und Mitgliedschaft", wk.count("await guard(req") >= 3)
check("Worker: Obergrenzen gegen Missbrauch", "allow(" in wk and "429" in wk)
wf = {f.name: f.read_text() for f in (ROOT / ".github" / "workflows").glob("*.yml")}
check("GitHub: jeder Ablauf legt seine Rechte fest", all(re.search(r"(?m)^permissions:", s) for s in wf.values()), [n for n, s in wf.items() if not re.search(r"(?m)^permissions:", s)])
check("GitHub: keine Abläufe für fremde Pull-Requests (pull_request_target)", not [n for n, s in wf.items() if "pull_request_target" in s])
check("GitHub: Geheimnisse nie im Protokoll ausgegeben", not [n for n, s in wf.items() if re.search(r"echo[^\n]*\$\{\{\s*secrets\.", s)])


# ---------- 5) injected code in the data does not run (XSS) ----------
async def xss():
    import smoke
    smoke.KEY = smoke.crew_key()
    from playwright.async_api import async_playwright
    port = smoke.free_port()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    smoke.wait_port(port)
    try:
        async with async_playwright() as p:
            b, pg, errs = await smoke.session(p, port, "owner")
            E = pg.evaluate
            bad = '<img src=x onerror="window.__xss=1">\'"><svg onload="window.__xss=2">'
            await E("""bad=>{window.__xss=0;const g=(S.crew||[])[0];if(g&&g.people&&g.people[0]){g.people[0].name=bad;g.people[0].role=bad;g.people[0].email='a@b.ch\"><img src=x onerror=window.__xss=3>';g.people[0].phone=bad}
                    const d=S.days.find(d=>d.kind==='shoot');if(d&&d.items&&d.items[0]){d.items[0].set=bad;d.items[0].d=bad;d.items[0].n=bad}
                    (S.locs||[]).slice(0,2).forEach(l=>{l.title=bad;l.address=bad;l.map='javascript:window.__xss=4'});(S.places||[]).slice(0,1).forEach(c=>(c.items||[]).slice(0,1).forEach(i=>{i.name=bad;i.address=bad}));MEMO.clear()}""", bad)
            for t in await E("tabsOn()"):
                await E(f"S.tab='{t}';render()"); await pg.wait_for_timeout(250)
            await E("S.gm='all';openSearch();$('#gq').value='img';renderSearch()"); await pg.wait_for_timeout(300)
            await E("closeSearch()")
            await E("""(async()=>{const {F,db}=await fb();await F.addDoc(F.collection(db,'events'),{c:await ownEnc({title:'<img src=x onerror=window.__xss=5>',date:todayISO(),t:'09:00',where:'<svg onload=window.__xss=6>',note:'<script>window.__xss=7</script>',byEmail:lc(ME.email),byName:'<b>x</b>',roles:null,depts:null,people:null}),at:1,by:ME.uid});await ownLoad(true);S.tab='my';render()})()""")
            await pg.wait_for_timeout(1000)
            r = await E("({x:window.__xss,on:document.querySelectorAll('[onerror],[onload]').length,js:[...document.querySelectorAll('a[href]')].filter(a=>/^javascript:/i.test(a.getAttribute('href'))).length})")
            check("Eingeschleuster Code in Crew-, Drehplan-, Orts- und Termindaten läuft nicht (XSS)", r["x"] == 0 and r["on"] == 0, r)
            check("Links mit «javascript:» werden nicht übernommen", r["js"] == 0, r)
            su = await E("[safeUrl('javascript:alert(1)'),safeUrl('data:text/html,x'),safeUrl('https://ok.ch/a')]")
            check("Sichere Links: nur http(s)", su == ["#", "#", "https://ok.ch/a"], su)
            ec = await E("esc('<a href=\"x\" onclick=\\'y\\'>&</a>')")
            check("Text wird immer maskiert (< > \" ' &)", "<" not in ec and '"' not in ec and "'" not in ec, ec)
            await b.close()
    finally:
        srv.terminate()

try:
    asyncio.run(xss())
except SystemExit:
    check("XSS-Test: Crew-Schlüssel vorhanden", False, "kein Schlüssel")
except Exception as e:
    check("XSS-Test lief durch", False, f"{type(e).__name__}: {str(e)[:150]}")

sys.exit(done("Sicherheit"))
