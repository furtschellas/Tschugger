"""Build index.html for GitHub Pages from the Claude app source (tools/app.html).
The data layer at the end of the app (Claude database) is swapped for an encrypted data file."""
import pathlib,re,hashlib
T=pathlib.Path(__file__).resolve().parent;R=T.parent
# the app itself lives in parts (tools/base: head, styles, markup, script parts in order); tools/app.html is put together from them
BASE=[p for p in sorted((T/"base").glob("*")) if p.suffix in (".html",".js")]
if BASE:(T/"app.html").write_text("".join(p.read_text() for p in BASE))
src=(T/"app.html").read_text()
START="\napplyStatic();\nloadCache();\nrender();\n"
assert src.count(START)==1, "app.html: Startblock «applyStatic(); loadCache(); render();» nicht genau einmal gefunden"
assert src.count("</style>")>=1 and "</script>" in src, "app.html: </style> oder </script> fehlt"
i=src.index(START);j=src.rindex("</script>")
parts=sorted((T/"boot").glob("*.js"))
assert parts, "tools/boot/*.js fehlt"
# every part runs in a script of its own: an error in one part stops only that part, the rest of the app keeps working
# (each part is valid JavaScript on its own – the syntax test checks that; global names are shared between the scripts)
mods=[("a2hs.js",(T/"a2hs.js").read_text())]+[(p.name,p.read_text()) for p in parts]
# speed: the translations (tools/boot/02-i18n.js, ~300 KB for all languages) go to i18n/<lang>.json – a device loads only its own language
# (German is the text of the code itself: nothing to load); without node the file stays in the page as before
def _i18n_split(code):
  import json as _j,subprocess as _sp,shutil as _sh
  node=_sh.which("node")
  if not node: return None
  js="const I18N={};"+code+"\n;const o={};for(const l of ['fr','it','en','hi']){const t={};for(const k in I18N){const v=I18N[k]||{},x={};if(v[l])x[l]=v[l];if(l!=='en'&&v.en)x.en=v.en;if(Object.keys(x).length)t[k]=x}o[l]=t}process.stdout.write(JSON.stringify({o,LANGS}))"
  try:
    r=_sp.run([node,"-"],input=js.encode(),capture_output=True,timeout=60)   # the script on stdin (too long for the command line)
    if r.returncode!=0 or not r.stdout: return None
    d=_j.loads(r.stdout.decode())
  except Exception: return None
  out=R/"i18n";out.mkdir(exist_ok=True)
  for l,t in d["o"].items():(out/(l+".json")).write_text(_j.dumps(t,ensure_ascii=False,separators=(",",":"),sort_keys=True))
  ver=hashlib.sha1(_j.dumps(d["o"],sort_keys=True).encode()).hexdigest()[:10]
  return ("const LANGS="+_j.dumps(d["LANGS"],ensure_ascii=False)+";\n"
    "/* translations: only the chosen language (i18n/<lang>.json, kept on the device); German is the text of the code itself */\n"
    "const I18NV=\""+ver+"\";window.I18NHAVE=new Set([\"de\"]);\n"
    "function i18nMerge(o){for(const k in o)I18N[k]=Object.assign(I18N[k]||{},o[k])}\n"
    "function i18nLoad(l,cb){if(!l||I18NHAVE.has(l)){if(cb)cb();return}\n"
    "  try{const c=JSON.parse(localStorage.getItem(\"i18n:\"+l)||\"null\");if(c&&c.v===I18NV){i18nMerge(c.t);I18NHAVE.add(l);if(cb)cb();return}}catch(_){}\n"
    "  fetch(\"i18n/\"+l+\".json?v=\"+I18NV).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(t=>{i18nMerge(t);I18NHAVE.add(l);try{localStorage.setItem(\"i18n:\"+l,JSON.stringify({v:I18NV,t}))}catch(_){}if(cb)cb()}).catch(err=>{console.warn(\"i18n\",l,err&&err.message||err);if(cb)cb()})}\n"
    "window.i18nLoad=i18nLoad;i18nLoad(LANG==='hi'?'hi':LANG);\n"
    "/* a new language: load it, then show the page again in it */\n"
    "{const a=applyStatic;applyStatic=function(){if(!I18NHAVE.has(LANG))i18nLoad(LANG,()=>{a();try{render()}catch(_){}});return a.apply(this,arguments)}}\n")
mods=[(n,(_i18n_split(c) or c) if n=="02-i18n.js" else c) for n,c in mods]
# speed: the App-Verwaltung (backup, users, roles – only for admins) goes to admin.js, loaded when it is opened (12a-admin-core: loadAdminUI)
LAZY=("12b-admin-backup.js","12c-admin-users.js","12d-admin-roles.js")
_lz=[(n,c) for n,c in mods if n in LAZY]
if len(_lz)==len(LAZY):
  _adm="".join("/* "+n+" */\n"+c+"\n;\n" for n,c in _lz)
  _av=hashlib.sha1(_adm.encode()).hexdigest()[:10]
  (R/"admin.js").write_text(_adm)
  mods=[(n,c.replace("__ADMINJS_VER__",_av)) for n,c in mods if n not in LAZY]
boot="\n</script>\n"+"".join("<script>/* "+n+" */\n"+c+"\n</script>\n" for n,c in mods)+"<script>window.__APPOK=1</script>\n"
body=src[:i]+boot+src[j+len("</script>"):]
body=body.replace("</style>",(T/"web_style.css").read_text()+"\n</style>\n</head>\n<body>\n"+(T/"splash.html").read_text(),1)   # start screen first
assert "claude.use" not in body.split("<script>",2)[-1].split("/* ---------- web boot")[1]
out=(T/"web_head.html").read_text()+body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n',"")+"\n</body>\n</html>\n"
# optional: minify inline scripts/styles with esbuild (whitespace + syntax only, global names stay intact)
import shutil,subprocess,os
ESB=os.environ.get("ESBUILD") or shutil.which("esbuild") or next((p for p in ["/home/claude/.tools/node_modules/.bin/esbuild",str(pathlib.Path.home()/".tools/node_modules/.bin/esbuild")] if os.path.exists(p)),"")
def _mini(code,loader):
  try:
    args=[ESB,"--loader="+loader,"--log-level=error"]+(["--minify"] if loader=="css" else ["--minify-whitespace","--minify-syntax","--target=es2019","--charset=utf8"])
    r=subprocess.run(args,input=code.encode(),capture_output=True,timeout=60)
    return r.stdout.decode() if r.returncode==0 and r.stdout else code
  except Exception:return code
if ESB and os.path.exists(ESB):
  out=re.sub(r"(<script>)([\s\S]*?)(</script>)",lambda m:m.group(1)+_mini(m.group(2),"js").strip()+m.group(3),out)
  out=re.sub(r"(<style>)([\s\S]*?)(</style>)",lambda m:m.group(1)+_mini(m.group(2),"css").strip()+m.group(3),out)
  if (R/"admin.js").exists():(R/"admin.js").write_text(_mini((R/"admin.js").read_text(),"js").strip()+"\n")   # the App-Verwaltung loaded on demand: minified like the page
ver=hashlib.sha1(out.encode()).hexdigest()[:10]
out=out.replace("__APP_VER__",ver)
_wv=re.search(r'const VERSION = "([^"]+)"',(T/"chat_worker.js").read_text())
out=out.replace("__WORKER_VER__",_wv.group(1) if _wv else "")   # the app warns admins when the worker in Cloudflare is older
# security: only the app's own inline scripts may run – each by its SHA-256 (an injected <script> has no matching hash and is blocked);
# 'unsafe-inline' stays only for very old browsers (a browser that knows hashes ignores it)
import base64 as _b64
_hs=sorted({"'sha256-"+_b64.b64encode(hashlib.sha256(m.group(1).encode("utf-8")).digest()).decode()+"'" for m in re.finditer(r"<script>([\s\S]*?)</script>",out)})
_csp=re.search(r'<meta http-equiv="Content-Security-Policy" content="([^"]*)">',out)
if _csp and _hs:
  _new=_csp.group(1).replace("script-src 'self' 'unsafe-inline'","script-src 'self' 'unsafe-inline' "+" ".join(_hs),1)
  out=out[:_csp.start(1)]+_new+out[_csp.end(1):]
(R/"index.html").write_text(out);(R/"version.txt").write_text(ver+"\n")
print("index.html",len(out))
