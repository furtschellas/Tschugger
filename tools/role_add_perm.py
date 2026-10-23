"""One-time action: the new right «Alle Fahrten als erledigt» (rides.alldone) for every role (also Admin) that has «Fahrten Manager»
(rides.manage) – they had the button before. Counts only in the log."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
done = other = bad = 0
for rid, f, ut in list(fsadmin.list_docs("roles")):
    perms = f.get("perms") if isinstance(f.get("perms"), list) else []
    if "rides.manage" not in perms or "rides.alldone" in perms: other += 1; continue
    if fsadmin.patch_doc("roles/" + rid, {"perms": perms + ["rides.alldone"]}, ut): done += 1
    else: bad += 1
print("::notice::Alle Fahrten als erledigt: %d Rollen ergänzt, %d unverändert, %d Fehler" % (done, other, bad))
if bad: sys.exit(1)
