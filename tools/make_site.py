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
ver=hashlib.sha1(out.encode()).hexdigest()[:10]
out=out.replace("__APP_VER__",ver)
_wv=re.search(r'const VERSION = "([^"]+)"',(T/"chat_worker.js").read_text())
out=out.replace("__WORKER_VER__",_wv.group(1) if _wv else "")   # the app warns admins when the worker in Cloudflare is older
(R/"index.html").write_text(out);(R/"version.txt").write_text(ver+"\n")
print("index.html",len(out))
