#!/usr/bin/env python3
"""Push-Nachrichten verschicken (GitHub Action, vom Cloudflare Worker alle 10 Minuten gestartet).

Jedes Gerät mit Push legt unter push/{uid}_{gerät} seine kommenden Erinnerungen ab, verschlüsselt mit dem
Crew-Schlüssel. Dieses Skript schickt fällige Erinnerungen und die «Nachrichten an alle», die der Worker nicht
selbst fertig verschicken konnte. Verschickte Erinnerungen stehen in sent.json (Actions-Cache), damit nichts
doppelt kommt.

Mit dem Dienstkonto (Secret FIREBASE_SA, siehe tools/fsadmin.py):
  * liest es die Push-Sammlungen ohne öffentlichen Zugriff,
  * löscht es Geräte, auf denen die App entfernt wurde (Antwort 404/410),
  * markiert es Nachrichten an alle als erledigt (fin), so dass nichts doppelt kommt,
  * nimmt es den Crew-Schlüssel und den Push-Schlüssel (VAPID) aus Firestore.
Das Repository ist öffentlich: im Protokoll stehen nur Zahlen, keine Titel, Namen oder Geräte.
"""
import base64, json, os, re, sys, time

from pywebpush import webpush, WebPushException

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fsadmin  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
SENT = os.environ.get("PUSH_SENT", "sent.json")
EARLY = 6 * 60          # bis zu 6 Minuten zu früh ist in Ordnung (Läufe alle 10 Minuten)
LATE = 45 * 60          # verspätete Läufe: bis 45 Minuten nach dem Zeitpunkt noch schicken, aber nie nach Beginn
NOW = time.time()
CLAIM = "mailto:furtschellas@gmail.com"


_PREV = []
def dec(key, c):
    """a device or message still written with the key before the last key change (an app that was open during the change): read with that one"""
    try: return fsadmin.dec_json(key, c)
    except Exception:
        if not _PREV:
            try: k = (fsadmin.get_doc("secret/keyprev") or {}).get("k"); _PREV.append(base64.b64decode(k) if k else b"")
            except Exception: _PREV.append(b"")
        if _PREV[0]: return fsadmin.dec_json(_PREV[0], c)
        raise


# ---------- Coverday: reminders of a device that does not know the newest changes yet ----------
# The device computes its reminders from the Drehplan with the Coverday changes (app). When a change was saved after the device
# last sent its reminders («cd» older than coverday/state «at»), its reminders on the changed days may show the wrong day:
# they are not sent (the device sends correct ones as soon as the app is opened).
def coverday(key):
    """(version «at», changes as [(time of the last change of it – applied, applied again or cancelled), dates, first date of a «Nachrücken»])"""
    try:
        f = fsadmin.get_doc("coverday/state") or {}
        if not f.get("c"): return 0, []
        ops = (dec(key, f["c"]) or {}).get("ops") or []
    except Exception as e:
        _note("Coverday nicht lesbar", e); return 0, []
    out = []
    for o in ops:
        if not isinstance(o, dict): continue
        t = max(int(o.get("at") or 0), int(o.get("off") or 0))
        out.append((t, {str(o[k]) for k in ("a", "b") if o.get(k)}, o.get("a") if o.get("op") == "shift" else None))
    return int(f.get("at") or 0), out


def cd_stale(item, p, cd):
    """True: reminder of a device that computed it before a Coverday change (applied, applied again or cancelled) on a day of that
    change – it may show the wrong day; not sent (the device sends correct ones as soon as the app is opened)"""
    at, ops = cd
    dev = int(p.get("cd") or 0)
    if not at or dev >= at: return False
    st = (item.get("start") or item.get("at") or 0) / 1000
    try:
        from zoneinfo import ZoneInfo
        import datetime as _dt
        day = _dt.datetime.fromtimestamp(st, ZoneInfo(fsadmin.tz_at(st * 1000))).strftime("%Y-%m-%d")   # the day in the time zone of the shooting block
    except Exception:
        day = time.strftime("%Y-%m-%d", time.gmtime(st))
    return any(t > dev and (day in ds or (sh and day >= sh)) for t, ds, sh in ops)


def vapid_keys(key):
    """[aktueller, alter] privater VAPID-Schlüssel (PEM). Aktuell: Firestore secret/vapid (Dienstkonto) oder Secret
    VAPID_PRIVATE; alt: die verschlüsselte Datei im Repository (für Geräte, die noch nicht umgestellt sind)."""
    out = []
    try:
        for path in ("secret/vapid", "secret/vapidprev"):   # current and previous key (devices not yet moved)
            d = fsadmin.get_doc(path) if fsadmin.sa() else None
            if d and d.get("priv"): out.append(d["priv"])
    except Exception as e:
        print("• VAPID aus Firestore nicht lesbar:", type(e).__name__)
    if os.environ.get("VAPID_PRIVATE", "").strip(): out.append(os.environ["VAPID_PRIVATE"].strip())
    try:
        e = json.load(open(os.path.join(HERE, "vapid.enc.json")))
        out.append(fsadmin.dec_ivct(key, e).decode())
    except Exception:
        pass
    return list(dict.fromkeys(_vkey(k) for k in out if k))


def _vkey(k):
    """the library reads only base64 keys (DER or raw), not PEM text: PEM → base64url DER"""
    k = k.strip()
    if "BEGIN" not in k: return k
    try:
        from cryptography.hazmat.primitives import serialization
        d = serialization.load_pem_private_key(k.encode(), None).private_bytes(serialization.Encoding.DER, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
        return base64.urlsafe_b64encode(d).decode().rstrip("=")
    except Exception: return k


ERRC = {}   # error codes of this run (only codes in the public log)
def send(sub, data, pems, ttl):
    """returns «ok», «gone» (device removed the app) or «err»; tries the next VAPID key if the push service rejects a key or a key cannot be read"""
    last = ""
    for pem in pems:
        try:
            webpush(subscription_info=sub, data=data, vapid_private_key=pem, vapid_claims={"sub": CLAIM}, headers={"Urgency": "high"}, ttl=ttl, timeout=15)
            return "ok"
        except WebPushException as e:
            code = getattr(e.response, "status_code", None)
            if code in (404, 410): return "gone"
            if code in (401, 403): last = "HTTP" + str(code); continue   # key does not match this subscription: try the next one
            print("• Push-Fehler HTTP", code); ERRC[str(code)] = ERRC.get(str(code), 0) + 1
            return "err"
        except Exception as e:   # e.g. a key that cannot be read (ValueError): try the next one
            last = type(e).__name__ + ":" + re.sub(r"[^A-Za-z .:_-]", "", str(e))[:60]   # the message of the library (no data of the person)
    ERRC[last or "Schlüssel"] = ERRC.get(last or "Schlüssel", 0) + 1   # no key worked
    return "err"


def _note(what, e):
    """error note for the run summary: only the error type and line, never data"""
    import traceback
    tb = traceback.extract_tb(e.__traceback__)
    where = ", ".join(f"{os.path.basename(t.filename)}:{t.lineno}" for t in tb[-3:])
    print(f"::warning::{what}: {type(e).__name__} ({where})")


DEVS = os.environ.get("PUSH_DEVS", "devices.json")
DEVGONE = set()


def push_devices():
    """the registered devices: all of them at most once an hour (Firebase quota); in between only the ones changed since the last
    run (query on «at», which the app sets on every change) – kept in devices.json (contents stay encrypted with the crew key)"""
    now = time.time()
    try: c = json.load(open(DEVS))
    except Exception: c = None
    docs = None
    kh = __import__("hashlib").sha256(KEYB[0]).hexdigest()[:8] if KEYB else ""
    # after a key change (other crew key) everything is read anew: the cached entries are still encrypted with the old key
    if c and now - c.get("full", 0) < 3600 and c.get("docs") is not None and c.get("kh", "") == kh:
        try:
            since = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(c.get("at", now) - 120))
            docs = dict((d["id"], d["f"]) for d in c["docs"])
            n = 0
            for did, f, _ in fsadmin.query_since("push", "at", since): docs[did] = f; n += 1
            c["at"] = now
            print("• Geräte aus dem Zwischenspeicher (%d), %d geändert" % (len(docs), n))
        except Exception as e:
            print("• Geräte-Zwischenspeicher nicht nutzbar:", type(e).__name__); docs = None
    if docs is None:
        docs = {did: f for did, f, _ in fsadmin.list_docs("push")}
        c = {"full": now, "at": now, "kh": kh}
        print("• Alle Geräte gelesen (%d)" % len(docs))
    out = [(k, v, None) for k, v in docs.items()]
    try:
        c["docs"] = [{"id": k, "f": v} for k, v in docs.items() if k not in DEVGONE]
        PEND_DEVS[:] = [c]
    except Exception: pass
    return out


PEND_DEVS = []
KEYB = []   # the crew key of this run (to notice a key change)


def save_devices():
    try:
        if PEND_DEVS:
            c = PEND_DEVS[0]; c["docs"] = [d for d in c.get("docs") or [] if d["id"] not in DEVGONE]
            json.dump(c, open(DEVS, "w"), default=str)
    except Exception: pass


def main():
    import signal
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(1))   # job timeout: still save sent.json (finally below)
    kb64 = fsadmin.crew_key_b64()
    if not kb64:
        print("::error::Kein Crew-Schlüssel"); return 1
    key = base64.b64decode(kb64); KEYB[:] = [key]
    try:
        sent = json.load(open(SENT))
    except Exception:
        sent = {}
    sent = {k: v for k, v in sent.items() if v > NOW - 3 * 86400}
    pems = vapid_keys(key)
    if not pems:
        print("::error::Kein VAPID-Schlüssel"); return 1
    # App-Verwaltung → App «Push-Nachrichten anbieten» off: nothing is sent to anybody, whatever the profiles say
    try: app = fsadmin.get_doc("config/app") or {}
    except Exception: app = {}
    if app.get("pushEnabled") is False:
        print("::notice::Push in der App-Verwaltung ausgeschaltet – nichts verschickt"); return 0
    sa = bool(fsadmin.sa())
    n_dev = n_sent = n_gone = n_late = n_err = n_cd = 0
    cd = coverday(key)

    # messages to everybody / selected roles and departments, at most 24 h old, not yet finished by the worker
    bcs = []
    try:
        since = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(NOW - 86400))
        for bid, f, ut in fsadmin.query_since("broadcasts", "at", since):   # only the last 24 h (older ones are never sent)
            if f.get("fin") or (f.get("sent") and not sa and not f.get("done")): continue
            try:
                b = dec(key, f.get("c") or "")
            except Exception:
                continue
            age = NOW - b.get("at", 0) / 1000
            if age > 86400 or b.get("push", True) is False: continue
            if f.get("sent") and "n" not in f and age < 180: continue   # the worker is sending it right now
            if not f.get("sent") and age < 60 and not b.get("kind"): continue   # just written: the worker sends it
            if not f.get("sent") and sa and not fsadmin.patch_doc("broadcasts/" + bid, {"sent": True}, update_time=ut): continue   # somebody else took it
            b["_n"] = f.get("n") or 0
            bcs.append((bid, b, set(f.get("done") or []), ut))
    except Exception as e:
        print("• Nachrichten nicht lesbar:", type(e).__name__)

    # the role of each device's person from the database, not from the device itself (a device could claim any role) – uid → role
    rmap = None; rerr = False
    if sa and any(b.get("roles") for _, b, _, _ in bcs):
        try:
            own = {d for d, _, _ in fsadmin.list_docs("owners")} | {"furtschellas@gmail.com"}; adm = {d for d, _, _ in fsadmin.list_docs("admins")}
            ur = {d.lower(): str(f.get("role") or "") for d, f, _ in fsadmin.list_docs("userroles")}
            rmap = {}
            for uid, f, _ in fsadmin.list_docs("members"):
                em = str(f.get("email") or "").lower()
                if f.get("active") is True: rmap[uid] = "owner" if em in own else "admin" if em in adm else ur.get(em, "")
            if not rmap: rmap = None   # nothing readable: the device's own entry as before
        except Exception as e:
            print("::warning::Rollen für Push nicht lesbar: " + type(e).__name__); rmap = None; rerr = True
    got = {}   # message → devices that received it now (saved in «done»: the history shows who got it)
    bad = set()   # messages with failed devices: not finished, tried again next run
    try:
        for did, f, _ in push_devices():
          try:
            c = f.get("c")
            if not c: continue
            try:
                p = dec(key, c)
            except Exception:
                continue
            n_dev += 1
            sub = p.get("sub")
            if not sub or not p.get("on", True): continue
            who = p.get("who") or {}
            gone = False
            for bid, b, done, _ in bcs:
                k = did + "|b|" + bid
                if k in sent or did in done: continue
                roles, depts = b.get("roles"), b.get("depts")
                if roles is not None or depts is not None:
                    # roles could not be read (error): not sent now (the device's own entry could claim any role) – next run
                    if rerr: bad.add(bid); continue
                    role = rmap.get(did.rsplit("_", 1)[0]) if rmap is not None else who.get("role", "")
                    if rmap is not None and role is None: continue   # no (active) member any more
                    if not ((role or "") in (roles or []) or (bool(who.get("dept")) and who.get("dept") in (depts or []))): continue
                if b.get("kind") and (p.get("news") or {}).get(b["kind"], True) is False: continue   # automatic message the person turned off
                tx = (b.get("i18n") or {}).get(p.get("lang") or "de") or b
                r = send(sub, json.dumps({"title": tx.get("title", ""), "body": tx.get("body", ""), "url": b.get("url") or "./", "tag": "b" + bid, "icon": "change" if b.get("kind") else "push"}, ensure_ascii=False), pems, 86400)
                if r == "gone": gone = True; break
                if r == "ok": n_sent += 1; sent[k] = NOW; got.setdefault(bid, []).append(did)
                else: n_err += 1; bad.add(bid)   # not marked: tried again in the next run
            for it in ([] if gone else p.get("items", [])):
                at = (it.get("at") or 0) / 1000
                start = (it.get("start") or it.get("at") or 0) / 1000
                k = did + "|" + str(it.get("id")) + "|" + str(int(at))
                if k in sent or at > NOW + EARLY or start < NOW - 60: continue
                if cd_stale(it, p, cd): n_cd += 1; continue   # Coverday: the device does not know the newest change yet
                if at < NOW - LATE:
                    n_late += 1; sent[k] = NOW; continue
                r = send(sub, json.dumps({"title": it.get("title", ""), "body": it.get("body", ""), "url": it.get("url", "./#my"), "tag": str(it.get("id", "")), "icon": "termin"}, ensure_ascii=False), pems, 3600)
                if r == "gone": gone = True; break
                if r == "ok": n_sent += 1; sent[k] = NOW
                else: n_err += 1
            if gone:
                n_gone += 1
                if sa: fsadmin.delete_doc("push/" + did)   # the device removed the app or turned push off in the browser
                DEVGONE.add(did)
          except Exception as e:   # one faulty device or entry must not stop the others
            n_err += 1; _note("Gerät übersprungen", e)
        for bid, b, done, ut in bcs:
            if not sa: continue
            upd = {} if bid in bad else {"fin": True}   # with failures: again next run
            if got.get(bid):
                upd["done"] = sorted(done | set(got[bid]))[:1000]; upd["n"] = int(b.get("_n") or 0) + len(got[bid])
            if upd: fsadmin.patch_doc("broadcasts/" + bid, upd)
    finally:   # always remember what was sent, also after an error or timeout – nothing is sent twice
        json.dump(sent, open(SENT, "w"))
        save_devices()
    print(f"• {n_dev} Geräte · {n_sent} verschickt · {n_err} Fehler (nächster Lauf) · {n_late} zu spät verworfen · {n_gone} abgemeldet · {n_cd} wegen Coverday zurückgehalten"
          + ("" if sa else " · ohne Dienstkonto (FIREBASE_SA fehlt)"))
    if bcs:   # visible in the run overview (only numbers): which message reached how many devices
        print("::notice::Push: %d Nachricht(en) · %d Geräte · %d verschickt · %d Fehler · %d abgemeldet · Arten: %s"
              % (len(bcs), n_dev, n_sent, n_err, n_gone, ", ".join(sorted({b.get("kind") or "von Hand" for _, b, _, _ in bcs}))))
    if ERRC: print("::notice::Push-Fehlercodes: " + ", ".join(f"{k}×{v}" for k, v in sorted(ERRC.items())))


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:
        import traceback
        tb = traceback.extract_tb(e.__traceback__)
        st = getattr(getattr(e, "response", None), "status_code", None)
        msg = ""
        try: msg = (e.response.json().get("error") or {}).get("status", "")[:60]
        except Exception: pass
        if st == 429:   # free Firebase quota used up for today: no failure (no e-mail every 10 minutes), next run tries again
            print("::warning::Firebase-Tageskontingent aufgebraucht – Push wartet bis zur Rücksetzung (ca. 09:00), dann geht es von selbst weiter")
            sys.exit(0)
        print("::error::Push-Versand abgebrochen: " + type(e).__name__ + (f" HTTP {st} {msg}" if st else "") + " (" + ", ".join(f"{os.path.basename(t.filename)}:{t.lineno}" for t in tb[-4:]) + ")")
        sys.exit(1)
