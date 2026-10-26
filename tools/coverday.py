"""Coverday on the server: the same changes as tools/boot/29-coverday.js lays over the Drehplan in the app
(cdActive, cdTransform, cdRenumber, cdChrono, cdDispos), so the late-push and the scene sheet see the days and callsheets
exactly as the crew sees them. Pure functions (no network) except read_ops(); kept 1:1 with the JS – tests compare both."""
import datetime, math, re

KEEP = {"date", "id", "sr", "ss", "order"}   # fields that stay with the date (CDKEEP)


def truthy(v):   # JavaScript truthiness (an empty object or list is true there)
    return not (v is None or v is False or v == "" or (isinstance(v, (int, float)) and not isinstance(v, bool) and (v == 0 or v != v)))


def arr(v): return v if isinstance(v, list) else []
def norm(s): return re.sub(r"\s+", "", str(s).lower())
def dd(d): return ".".join(str(d or "").split("-")[::-1][:2]) + "."
def js_str(v): return "" if not truthy(v) else str(v)   # String(x||"")


def scenes(d, u):
    if not d: return ""
    its = arr((d.get("unit2") or {}).get("items")) if u == "2" else arr(d.get("items"))
    return ",".join(norm(i["sc"]) for i in its if isinstance(i, dict) and truthy(i.get("sc")))


def shoot_dates(days, u, frm):
    def ok(d):
        if u == "2": return any(isinstance(i, dict) and truthy(i.get("sc")) for i in arr((d.get("unit2") or {}).get("items")))
        return d.get("kind") == "shoot"
    return sorted(d["date"] for d in days if str(d.get("date") or "") >= str(frm) and ok(d))


def next_slot(after):   # after the last shooting day, not on a weekend
    x = datetime.date.fromisoformat(after)
    while True:
        x += datetime.timedelta(days=1)
        if x.weekday() < 5: return x.isoformat()


def sched_ms(meta):   # the newest Drehplan read (cdSched)
    m = ""
    for s in arr((meta or {}).get("sources")):
        if isinstance(s, dict) and s.get("kind") == "schedule" and str(s.get("modified") or "") > m: m = str(s.get("modified") or "")
    if not m: return 0
    try: return int(datetime.datetime.fromisoformat(m.replace("Z", "+00:00")).timestamp() * 1000)
    except Exception: return 0


def num(v):
    try: return float(v) if truthy(v) else 0
    except Exception: return 0


def raw_of(op, days):
    d = lambda dt: next((x for x in days if x.get("date") == dt), None)
    if op.get("op") == "shift": return {"l": "|".join(dt + "=" + scenes(d(dt), op.get("u")) for dt in shoot_dates(days, op.get("u"), op.get("a")))}
    return {"a": scenes(d(op.get("a")), op.get("u")), "b": scenes(d(op.get("b")), op.get("u"))}


def review(op, days0, meta):
    """a newer Drehplan changed the days of this change: it waits for a decision in the app (not applied)"""
    t = sched_ms(meta)
    if not (t and t > num(op.get("at"))): return False
    if days0 is None: return True
    d = lambda dt: next((x for x in days0 if x.get("date") == dt), None)
    r = op.get("raw")
    if not truthy(r):
        sn = op.get("snap")
        if not truthy(sn) or not truthy(sn.get("a")): return True
        if op.get("op") == "shift": return scenes(d(op.get("a")), op.get("u")) != sn.get("a")
        return scenes(d(op.get("a")), op.get("u")) != sn.get("a") or scenes(d(op.get("b")), op.get("u")) != (sn.get("b") or "")
    now = raw_of(op, days0)
    if op.get("op") == "shift": return now["l"] != r.get("l")
    return now["a"] != r.get("a") or now["b"] != r.get("b")


def active(ops, days0, meta):
    out = [o for o in arr(ops) if isinstance(o, dict) and o.get("st") != "off" and not review(o, days0, meta)]
    return sorted(out, key=lambda o: num(o.get("at")))


def cd_no(d):
    v = d.get("short") if truthy(d.get("short")) else d.get("label") if truthy(d.get("label")) else ""
    m = re.search(r"\d+", str(v))
    return int(m.group(0)) if m else None


def set_no(s, n): return re.sub(r"\d+", lambda m: str(n).rjust(len(m.group(0)), "0"), str(s), count=1)


def renumber(days):
    win = [d for d in days if d.get("kind") == "shoot" and cd_no(d) is not None]
    nos = sorted(cd_no(d) for d in win)
    for i, d in enumerate(win):
        if cd_no(d) == nos[i]: continue
        if d.get("short0") is None: d["short0"] = d.get("short") if truthy(d.get("short")) else d.get("label") if truthy(d.get("label")) else ""
        if truthy(d.get("short")): d["short"] = set_no(d["short"], nos[i])
        if truthy(d.get("label")): d["label"] = set_no(d["label"], nos[i])


def chrono_ok(days):
    last = -1
    for d in days:
        if d.get("kind") != "shoot": continue
        n = cd_no(d)
        if n is None: continue
        if n < last: return False
        last = n
    return True


def chrono(days0):
    if chrono_ok(days0): return days0
    days = [dict(d) for d in days0]; renumber(days); return days


def transform(days0, ops, meta):
    """the Drehplan with the active Coverday changes laid over it (the original list stays as it is)"""
    ops = active(ops, days0, meta)
    if not ops: return chrono(days0)
    days = [dict(d, cdSrc=d["date"]) if d.get("kind") == "shoot" else dict(d) for d in days0]
    def get(dt):
        d = next((x for x in days if x.get("date") == dt), None)
        if d is None: d = {"date": dt, "id": dt, "kind": "off", "label": "Day Off"}; days.append(d)
        return d
    def note(d, t):
        d["notes"] = [t] + arr(d.get("notes"))
        for l in ("en", "fr", "it"):
            if truthy(d.get("notes_" + l)): d["notes_" + l] = [t] + arr(d["notes_" + l])
    def empty(d):
        for k in list(d):
            if k not in KEEP: del d[k]
        d["kind"] = "off"; d["label"] = "Cover"
    content = lambda d: {k: v for k, v in d.items() if k not in KEEP}
    for op in ops:
        try:
            u = op.get("u")
            if op.get("op") == "swap":
                a, b = get(op.get("a")), get(op.get("b"))
                if u == "2":
                    t = a.get("unit2")
                    if truthy(b.get("unit2")): a["unit2"] = b["unit2"]
                    else: a.pop("unit2", None)
                    if truthy(t): b["unit2"] = t
                    else: b.pop("unit2", None)
                else:
                    ca, cb = content(a), content(b); empty(a); empty(b); a.update(cb); b.update(ca)
                note(a, "⇄ Coverday: getauscht mit " + dd(op.get("b"))); note(b, "⇄ Coverday: getauscht mit " + dd(op.get("a")))
            elif op.get("op") == "move":
                a, b = get(op.get("a")), get(op.get("b"))
                if u == "2":
                    if truthy(a.get("unit2")): b["unit2"] = a["unit2"]; del a["unit2"]
                else:
                    ca = content(a); empty(b); b.update(ca); empty(a)
                note(b, "→ Coverday: verschoben vom " + dd(op.get("a"))); note(a, "→ Coverday: verschoben auf " + dd(op.get("b")))
            elif op.get("op") == "shift":
                sl = shoot_dates(days, u, op.get("a"))
                if not sl: continue
                sl.append(next_slot(sl[-1]))
                cs = [get(dt).get("unit2") if u == "2" else content(get(dt)) for dt in sl[:-1]]
                for i in range(len(sl) - 1, 0, -1):
                    d = get(sl[i])
                    if u == "2":
                        if truthy(cs[i - 1]): d["unit2"] = cs[i - 1]
                    else: empty(d); d.update(cs[i - 1])
                    note(d, "↷ Coverday: nachgerückt vom " + dd(sl[i - 1]))
                f = get(sl[0])
                if u == "2": f.pop("unit2", None)
                else: empty(f)
                note(f, "↷ Coverday: Drehtag nachgerückt")
        except Exception:
            pass   # one odd change never stops the others (console.warn in the app)
    days.sort(key=lambda d: str(d.get("date") or ""))
    try: renumber(days)
    except Exception: pass
    return days


def key(x): return re.sub(r"pt.*$", "", norm(js_str(x)))


def day_keys(d):
    d = d or {}
    its = arr(d.get("items")) + arr((d.get("unit2") or {}).get("items") if truthy(d.get("unit2")) else None) + arr((d.get("unit3") or {}).get("items") if truthy(d.get("unit3")) else None)
    return {key(i["sc"]) for i in its if isinstance(i, dict) and truthy(i.get("sc"))}


def dispos(dispos0, days):
    """every callsheet on the day of the Drehplan (with the Coverday changes) that has its scenes (cdDispos); a moved one gets cdFrom"""
    sh = [d for d in days if d.get("kind") == "shoot"]
    dk = {d.get("date"): day_keys(d) for d in sh}
    ks_of = lambda x: [k for k in (key(r.get("sc") if isinstance(r, dict) else None) for r in arr(x.get("scenes"))) if k]
    def sc(ks, dt):
        s = dk.get(dt)
        return len([k for k in ks if k in s]) if s is not None else 0
    keep, move = [], []
    for x in dispos0:
        ks = ks_of(x)
        if not ks: keep.append(x); continue
        own = sc(ks, x.get("date")); half = math.ceil(len(ks) / 2)
        better = own < half and any(d.get("date") != x.get("date") and sc(ks, d.get("date")) > own and sc(ks, d.get("date")) >= half for d in sh)
        (move if better else keep).append(x)
    if not move: return dispos0
    taken = {x.get("date") for x in keep}; out = list(keep)
    for x in move:
        ks = ks_of(x); best = None; bs = 0
        for d in sh:
            if d.get("date") in taken: continue
            v = sc(ks, d.get("date"))
            if v > bs: best, bs = d, v
        if best is None or bs < math.ceil(len(ks) / 2): taken.add(x.get("date")); out.append(x); continue
        taken.add(best.get("date")); out.append(dict(x, date=best.get("date"), cdFrom=x.get("date")))
    no = {}
    for d in sh: no[d.get("date")] = cd_no(d)
    def lab(x):
        n = no.get(x.get("date")); l = x.get("label")
        if n is None or not truthy(l) or not re.search(r"\d", str(l)): return x
        if int(re.search(r"\d+", str(l)).group(0)) == n: return x
        return dict(x, label=set_no(l, n))
    return sorted((lab(x) for x in out), key=lambda x: str(x.get("date") or ""))


def apply(data, ops):
    """data (days, dispos, meta) as the crew sees it in the app: days and callsheets after the Coverday"""
    days0 = [d for d in arr(data.get("days")) if isinstance(d, dict)]
    days = transform(days0, ops, data.get("meta"))
    ds0 = [x for x in arr(data.get("dispos")) if isinstance(x, dict)]
    return dict(data, days=days, dispos=dispos(ds0, days))


def read_ops(key_):
    """the changes from coverday/state (encrypted with the crew key) and their version «at»; raises when not readable"""
    import fsadmin
    f = fsadmin.get_doc("coverday/state") or {}
    if not f.get("c"): return [], str(f.get("at") or "")
    return arr((fsadmin.dec_json(key_, f["c"]) or {}).get("ops")), str(f.get("at") or "")
