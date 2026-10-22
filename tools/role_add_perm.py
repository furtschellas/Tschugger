"""One-time action: the roles «Crew HOD» and «Poweruser» (and roles/admin when it exists) get the report permissions
«Reports: Production report / DIT / Sound» (rep.production-report, rep.dit, rep.sound); then the new role «Crew 1AD»
(id crew1ad) is made with the permissions of «Crew HOD» (Coverday management follows with its own permission). Counts only in the log."""
import re, sys, unicodedata
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

PERMS = ["rep.production-report", "rep.dit", "rep.sound"]
fold = lambda t: "".join(c for c in unicodedata.normalize("NFD", str(t or "")) if not unicodedata.combining(c)).lower()
if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
done = had = bad = other = 0
for rid, f, ut in list(fsadmin.list_docs("roles")):
    nm = fold(f.get("name") or rid)
    if not (rid == "admin" or re.search(r"\bhod\b", nm) or re.search(r"power\s*user", nm)): other += 1; continue
    perms = f.get("perms") if isinstance(f.get("perms"), list) else []
    new = [p for p in PERMS if p not in perms]
    if not new: had += 1; continue
    if fsadmin.patch_doc("roles/" + rid, {"perms": perms + new}, ut): done += 1
    else: bad += 1
print("• Rollen ergänzt: %d · hatten es schon: %d · andere Rollen: %d · Fehler: %d" % (done, had, other, bad))
print("::notice::Reports-Rechte: %d Rollen ergänzt, %d hatten sie, %d andere, %d Fehler" % (done, had, other, bad))
# Crew 1AD: a copy of «Crew HOD» (only when it does not exist yet)
roles = {rid: f for rid, f, _ in fsadmin.list_docs("roles")}
hod = next((f for rid, f in roles.items() if re.search(r"\bhod\b", fold(f.get("name") or rid))), None)
if "crew1ad" in roles: print("::notice::Rolle Crew 1AD: schon vorhanden")
elif not hod: print("::notice::Rolle Crew 1AD: keine Rolle Crew HOD gefunden"); bad += 1
else:
    perms = list(hod.get("perms") or [])
    ok = fsadmin.patch_doc("roles/crew1ad", {"name": "Crew 1AD", "perms": perms})
    print("::notice::Rolle Crew 1AD: %s (%d Rechte)" % ("angelegt" if ok else "Fehler", len(perms)))
    if not ok: bad += 1
if bad: sys.exit(1)
