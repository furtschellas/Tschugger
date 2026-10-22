"""One-time action: empties the list «Änderungen» in Today for everybody (config/app → chgClearAt = now). Only a time in the log."""
import sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import fsadmin  # noqa: E402

if not fsadmin.sa(): print("• kein Dienstkonto (FIREBASE_SA)"); sys.exit(1)
ok = fsadmin.patch_doc("config/app", {"chgClearAt": int(time.time() * 1000)})
print("::notice::Änderungsliste für alle geleert: %s" % ("ja" if ok else "Fehler"))
if not ok: sys.exit(1)
