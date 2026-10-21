"""One-time action: every role (also roles/admin when it exists) gets the new permission «view.loc» (Locations sehen).
Run: Actions → «Rollen: Recht ergänzen» (needs FIREBASE_SA). The log shows counts only."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

PERM = "view.loc"
if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
done = had = bad = 0
for rid, f, ut in list(fsadmin.list_docs("roles")):
    perms = f.get("perms") if isinstance(f.get("perms"), list) else []
    if PERM in perms: had += 1; continue
    if fsadmin.patch_doc("roles/" + rid, {"perms": perms + [PERM]}, ut): done += 1
    else: bad += 1
print("• Rollen ergänzt: %d · hatten es schon: %d · Fehler: %d" % (done, had, bad))
if bad: sys.exit(1)
