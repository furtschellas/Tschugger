"""One-time action: the new role «Crew Kamera» (id crewkamera) is made with the same permissions as «Crew HOD»
(only when it does not exist yet). Counts only in the log."""
import re, sys, unicodedata
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

fold = lambda t: "".join(c for c in unicodedata.normalize("NFD", str(t or "")) if not unicodedata.combining(c)).lower()
if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
roles = {rid: f for rid, f, _ in fsadmin.list_docs("roles")}
hod = [f for rid, f in roles.items() if re.search(r"\bhod\b", fold(f.get("name") or rid))]
if "crewkamera" in roles: print("::notice::Rolle Crew Kamera: schon vorhanden"); sys.exit(0)
if len(hod) != 1: print("::error::Rolle Crew Kamera: %d Rollen «HOD» gefunden (erwartet 1)" % len(hod)); sys.exit(1)
perms = list(hod[0].get("perms") or [])
ok = fsadmin.patch_doc("roles/crewkamera", {"name": "Crew Kamera", "perms": perms})
print("::notice::Rolle Crew Kamera: %s (%d Rechte wie Crew HOD)" % ("angelegt" if ok else "Fehler", len(perms)))
if not ok: sys.exit(1)
