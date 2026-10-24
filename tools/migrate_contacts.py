"""Phone and contact e-mail of the profiles move from members/{uid} to contacts/{uid}.

members can be read with «Catering» or «Geburtstage» rights; contacts only with the rights to see or edit the people.
The app moves the own entry at sign-in; this moves everybody else's (service account). Runs after every Dropbox update,
does nothing once all are moved. Logs only counts (public repository)."""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fsadmin  # noqa: E402


def main():
    if not fsadmin.sa(): return 0
    moved = failed = 0
    for uid, f, ut in fsadmin.list_docs("members"):
        if "phone" not in f and "contactEmail" not in f: continue
        old = fsadmin.get_doc("contacts/" + uid) or {}
        v = {"phone": str(old.get("phone") or f.get("phone") or ""), "contactEmail": str(old.get("contactEmail") or f.get("contactEmail") or "")}
        # contacts first; members only when nobody changed it meanwhile (else next run)
        if fsadmin.patch_doc("contacts/" + uid, v) and fsadmin.delete_fields("members/" + uid, ["phone", "contactEmail"], ut): moved += 1
        else: failed += 1
    if moved or failed: print("• Kontaktdaten verschoben: %d, später nochmals: %d" % (moved, failed), flush=True)
    return 0


if __name__ == "__main__":
    try: sys.exit(main())
    except Exception as e:
        print("• Kontaktdaten nicht verschoben:", type(e).__name__); sys.exit(0)
