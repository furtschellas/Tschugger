"""One-time action: the right «Cast manuell quittieren» (cast.manual) for the roles AL/AD, Crew 1AD, Poweruser and the admin role.
Counts only in the log."""
import re, sys, unicodedata
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

fold = lambda t: "".join(c for c in unicodedata.normalize("NFD", str(t or "")) if not unicodedata.combining(c)).lower()
if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
done = had = other = bad = 0
for rid, f, ut in list(fsadmin.list_docs("roles")):
    nm = fold(f.get("name") or rid) + " " + rid.lower()
    if not (rid == "admin" or re.search(r"\bal\s*/\s*ad\b|\bal\b.*\bad\b", nm) or "1ad" in nm.replace(" ", "") or re.search(r"power\s*user", nm)): other += 1; continue
    perms = f.get("perms") if isinstance(f.get("perms"), list) else []
    if "cast.manual" in perms: had += 1; continue
    if fsadmin.patch_doc("roles/" + rid, {"perms": perms + ["cast.manual"]}, ut): done += 1
    else: bad += 1
print("::notice::Cast manuell quittieren: %d Rollen ergänzt, %d hatten es, %d andere, %d Fehler" % (done, had, other, bad))
if bad: sys.exit(1)
