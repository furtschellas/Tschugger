"""One-time action: the right «Cast quittieren» (cm.ack) is split: every role with it gets «Kostüm quittieren» (wardrobe.ack) and
«Maske quittieren» (makeup.ack) instead. Counts only in the log."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
done = other = bad = 0
for rid, f, ut in list(fsadmin.list_docs("roles")):
    perms = f.get("perms") if isinstance(f.get("perms"), list) else []
    if "cm.ack" not in perms: other += 1; continue
    new = [p for p in perms if p != "cm.ack"] + [p for p in ("wardrobe.ack", "makeup.ack") if p not in perms]
    if fsadmin.patch_doc("roles/" + rid, {"perms": new}, ut): done += 1
    else: bad += 1
print("::notice::Cast quittieren aufgeteilt: %d Rollen umgestellt, %d ohne, %d Fehler" % (done, other, bad))
if bad: sys.exit(1)
