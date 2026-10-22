"""One-time action: roles whose id contains «cater» get the new right «Lunch-Menüs eingeben» (menus.edit) – the menus no longer
depend on the name of the role. Counts only in the log."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
done = had = bad = 0
for rid, f, ut in list(fsadmin.list_docs("roles")):
    if "cater" not in rid.lower(): continue
    perms = f.get("perms") if isinstance(f.get("perms"), list) else []
    if "menus.edit" in perms: had += 1; continue
    if fsadmin.patch_doc("roles/" + rid, {"perms": perms + ["menus.edit"]}, ut): done += 1
    else: bad += 1
print("::notice::Lunch-Menüs-Recht: %d Rollen ergänzt, %d hatten es, %d Fehler" % (done, had, bad))
if bad: sys.exit(1)
