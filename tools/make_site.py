"""Build index.html for GitHub Pages from the Claude app source (tools/app.html).
The data layer at the end of the app (Claude database) is swapped for an encrypted data file."""
import pathlib,re
T=pathlib.Path(__file__).resolve().parent;R=T.parent
src=(T/"app.html").read_text()
i=src.index("\napplyStatic();\nloadCache();\nrender();\n");j=src.rindex("</script>")
boot=(T/"web_boot.js").read_text()
body=src[:i]+"\n"+boot+"\n"+src[j:]
body=body.replace("</style>",(T/"web_style.css").read_text()+"\n</style>\n</head>\n<body>",1)
assert "claude.use" not in body.split("<script>",2)[-1].split("/* ---------- web boot")[1]
out=(T/"web_head.html").read_text()+body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n',"")+"\n</body>\n</html>\n"
(R/"index.html").write_text(out)
print("index.html",len(out))
