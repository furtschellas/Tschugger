"""One-time action: the right «Cast quittieren» (cm.ack) is split: every role with it gets «Kostüm quittieren» (wardrobe.ack) and
«Maske quittieren» (makeup.ack) instead; roles with «Quittierungen sehen» get «Cast-Quittierungen sehen». Counts only in the log."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
done = other = bad = 0
for rid, f, ut in list(fsadmin.list_docs("roles")):
    perms = f.get("perms") if isinstance(f.get("perms"), list) else []
    new = [p for p in perms if p != "cm.ack"] + ([p for p in ("wardrobe.ack", "makeup.ack") if p not in perms] if "cm.ack" in perms else [])
    if "scenes.see" in perms and "cast.see" not in new: new.append("cast.see")   # who sees the scene quittances sees the cast ones
    if new == perms: other += 1; continue
    if fsadmin.patch_doc("roles/" + rid, {"perms": new}, ut): done += 1
    else: bad += 1
print("::notice::Cast-Rechte: %d Rollen angepasst, %d unverändert, %d Fehler" % (done, other, bad))
if bad: sys.exit(1)
