"""Build index.html for GitHub Pages from the Claude app source (tools/app.html).
The data layer at the end of the app (Claude database) is swapped for an encrypted data file."""
import pathlib,re,hashlib
T=pathlib.Path(__file__).resolve().parent;R=T.parent
src=(T/"app.html").read_text()
i=src.index("\napplyStatic();\nloadCache();\nrender();\n");j=src.rindex("</script>")
boot=(T/"a2hs.js").read_text()+"\n"+(T/"web_boot.js").read_text()
body=src[:i]+"\n"+boot+"\n"+src[j:]
body=body.replace("</style>",(T/"web_style.css").read_text()+"\n</style>\n</head>\n<body>",1)
assert "claude.use" not in body.split("<script>",2)[-1].split("/* ---------- web boot")[1]
out=(T/"web_head.html").read_text()+body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n',"")+"\n</body>\n</html>\n"
# optional: minify inline scripts/styles with esbuild (whitespace + syntax only, global names stay intact)
import shutil,subprocess,os
ESB=os.environ.get("ESBUILD") or shutil.which("esbuild") or next((p for p in ["/home/claude/.tools/node_modules/.bin/esbuild",str(pathlib.Path.home()/".tools/node_modules/.bin/esbuild")] if os.path.exists(p)),"")
def _mini(code,loader):
  try:
    args=[ESB,"--loader="+loader,"--log-level=error"]+(["--minify"] if loader=="css" else ["--minify-whitespace","--minify-syntax","--target=es2019"])
    r=subprocess.run(args,input=code.encode(),capture_output=True,timeout=60)
    return r.stdout.decode() if r.returncode==0 and r.stdout else code
  except Exception:return code
if ESB and os.path.exists(ESB):
  out=re.sub(r"(<script>)([\s\S]*?)(</script>)",lambda m:m.group(1)+_mini(m.group(2),"js").strip()+m.group(3),out)
  out=re.sub(r"(<style>)([\s\S]*?)(</style>)",lambda m:m.group(1)+_mini(m.group(2),"css").strip()+m.group(3),out)
ver=hashlib.sha1(out.encode()).hexdigest()[:10]
out=out.replace("__APP_VER__",ver)
(R/"index.html").write_text(out);(R/"version.txt").write_text(ver+"\n")
print("index.html",len(out))
