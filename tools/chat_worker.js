/* TSCHUGGER Crew-App – Cloudflare Worker
 *
 * /chat       Chat-Assistent: Frage + die Daten, die die Person sehen darf → Claude. Der API-Schlüssel bleibt hier.
 * /broadcast  «Push-Nachricht an alle» sofort verschicken (Web Push direkt aus dem Worker).
 * /selftest   Test-Push an die eigenen Geräte.
 * /notify     startet den Push-Versand bei GitHub (Reserve).
 * /blk/…      verschlüsselte Blocking-Bilder aus Cloudflare R2 (Binding BLK), wenn eingerichtet.
 * GET /       Zustand (was eingerichtet ist) und der öffentliche Push-Schlüssel.
 * Zeitplan (Cron Trigger «*\/10 * * * *»): startet bei GitHub alle 10 Minuten den Push-Versand und alle 30 Minuten
 *             die Dropbox-Aktualisierung – GitHubs eigener Zeitplan ist oft stundenlang verspätet.
 *
 * Alle Aufrufe ausser GET / und /blk prüfen die Firebase-Anmeldung UND ob die Person freigeschaltetes Crew-Mitglied
 * oder Admin ist (die Firestore-Regeln von secret/key entscheiden). Pro Person gibt es Obergrenzen.
 *
 * Variablen/Secrets im Worker (Settings → Variables and Secrets):
 *   ANTHROPIC_API_KEY  (Secret)  Claude-API-Schlüssel
 *   GH_TOKEN           (Secret)  GitHub «fine-grained token», nur Repository Tschugger, Recht «Actions: Read and write»
 *   FIREBASE_SA        (Secret)  Dienstkonto-Schlüssel (JSON) – Crew-Schlüssel und Push-Schlüssel kommen dann aus Firestore,
 *                                Geräte ohne App werden gelöscht, die Push-Sammlungen müssen nicht öffentlich lesbar sein
 *   CREW_KEY           (Secret)  Crew-Schlüssel – nur nötig ohne FIREBASE_SA
 *   VAPID_PRIVATE      (Secret, optional) Push-Schlüssel (PEM) – nur ohne FIREBASE_SA
 *   CLAUDE_MODEL       (optional) Standard: claude-haiku-5-5
 *   PUSH_LIMIT         (optional) Geräte pro Sofort-Versand (Standard 25; Workers Free erlaubt 50 Anfragen pro Aufruf)
 *   CHAT_PER_HOUR      (optional) Fragen pro Person und Stunde (Standard 30)
 * Bindings (optional):
 *   BLK                R2-Bucket mit den Bildern (blk/…)
 *   CHAT_RL            Rate-Limiting-Binding (zusätzlich zur eingebauten Grenze)
 */
const PROJECT = "tschugger-83692";
const REPO = "furtschellas/Tschugger";
const ORIGINS = ["https://furtschellas.github.io", "http://localhost:8765"];
const API_KEY = "AIzaSyBrHUJumAArmHv92qhZEbUFXSWrwvZaKjQ";
const SITE = "https://furtschellas.github.io/Tschugger/";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const VERSION = "2026-10-17b";

let JWKS = null, JWKS_AT = 0;
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const enc = new TextEncoder();
const u8cat = (...a) => { const n = a.reduce((x, y) => x + y.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
const b64uenc = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64dec = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const bearer = req => (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");

async function verifyToken(tok) {
  const [h, p, sig] = String(tok || "").split(".");
  if (!sig) throw new Error("no token");
  const head = JSON.parse(new TextDecoder().decode(b64u(h)));
  const pay = JSON.parse(new TextDecoder().decode(b64u(p)));
  const now = Date.now() / 1000;
  if (pay.aud !== PROJECT || pay.iss !== "https://securetoken.google.com/" + PROJECT || !(pay.exp > now) || !(pay.iat < now + 300) || !pay.sub) throw new Error("bad token");
  if (!JWKS || Date.now() - JWKS_AT > 3600e3) { JWKS = (await (await fetch(JWKS_URL)).json()).keys; JWKS_AT = Date.now(); }
  const jwk = JWKS.find(k => k.kid === head.kid);
  if (!jwk || head.alg !== "RS256") throw new Error("unknown key");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(sig), enc.encode(h + "." + p));
  if (!ok) throw new Error("bad signature");
  return pay;
}

/* ---------- membership: only active crew members and admins (rules of secret/key: isAdmin() || isMember()) ---------- */
const MEMBERS = new Map();   // uid → time of the last positive check (per worker instance)
async function requireMember(req) {
  const tok = bearer(req);
  const user = await verifyToken(tok);
  const t = MEMBERS.get(user.sub);
  if (t && Date.now() - t < 10 * 60e3) return { user, tok };
  const r = await fetch(FS + "/secret/key", { headers: { Authorization: "Bearer " + tok } });
  if (r.status !== 200) { MEMBERS.delete(user.sub); throw Object.assign(new Error("not a member"), { status: 403 }); }
  MEMBERS.set(user.sub, Date.now());
  if (MEMBERS.size > 2000) MEMBERS.clear();
  return { user, tok };
}
async function guard(req, origin) {
  try { return await requireMember(req); }
  catch (e) { return { err: e.status === 403 ? json({ error: "Kein Zugang (nicht freigeschaltet)." }, 403, origin) : json({ error: "Nicht angemeldet." }, 401, origin) }; }
}

/* ---------- limits per person (per worker instance; plus the optional Rate-Limiting binding CHAT_RL) ---------- */
const HITS = new Map();
function allow(kind, uid, max, windowMs) {
  const k = kind + ":" + uid, now = Date.now();
  const a = (HITS.get(k) || []).filter(t => now - t < windowMs);
  if (a.length >= max) { HITS.set(k, a); return false; }
  a.push(now); HITS.set(k, a);
  if (HITS.size > 5000) HITS.clear();
  return true;
}

/* ---------- service account (FIREBASE_SA): access token for Firestore, not bound by the rules ---------- */
let SATOK = null, SATOK_AT = 0;
function saJson(env) {
  const raw = String(env.FIREBASE_SA || "").trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { try { return JSON.parse(atob(raw)); } catch (__) { return null; } }
}
async function saToken(env) {
  const sa = saJson(env);
  if (!sa) return null;
  if (SATOK && Date.now() - SATOK_AT < 50 * 60e3) return SATOK;
  const der = b64dec(sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const h = b64uenc(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const p = b64uenc(enc.encode(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })));
  const sig = b64uenc(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(h + "." + p)));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + h + "." + p + "." + sig });
  if (!r.ok) throw new Error("service account token " + r.status);
  SATOK = (await r.json()).access_token; SATOK_AT = Date.now();
  return SATOK;
}
/* Firestore REST: as the service account when there is one, else public (API key) – or with a given user token */
async function fsReq(env, path, opt = {}, userTok) {
  const t = userTok || await saToken(env).catch(() => null);
  const url = FS + "/" + path + (t ? "" : (path.includes("?") ? "&" : "?") + "key=" + API_KEY);
  return fetch(url, { ...opt, headers: { ...(opt.headers || {}), ...(t ? { Authorization: "Bearer " + t } : {}), "Content-Type": "application/json" } });
}
const fv = v => v == null ? null : ("stringValue" in v ? v.stringValue : "booleanValue" in v ? v.booleanValue : "integerValue" in v ? +v.integerValue
  : "arrayValue" in v ? (v.arrayValue.values || []).map(fv) : "timestampValue" in v ? v.timestampValue : null);
const fenc = v => typeof v === "boolean" ? { booleanValue: v } : typeof v === "number" ? { integerValue: String(v) } : Array.isArray(v) ? { arrayValue: { values: v.map(fenc) } } : { stringValue: String(v) };
async function fsPatch(env, path, fields, userTok, updateTime) {
  const q = Object.keys(fields).map(k => "updateMask.fieldPaths=" + encodeURIComponent(k)).join("&") + (updateTime ? "&currentDocument.updateTime=" + encodeURIComponent(updateTime) : "");
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fenc(v)])) };
  return fsReq(env, path + "?" + q, { method: "PATCH", body: JSON.stringify(body) }, userTok);
}
async function listDocs(env, col) {
  const out = []; let tok = "";
  for (let i = 0; i < 10; i++) {
    const r = await fsReq(env, col + "?pageSize=300" + (tok ? "&pageToken=" + encodeURIComponent(tok) : ""));
    if (!r.ok) throw new Error(col + " " + r.status);
    const j = await r.json();
    for (const d of j.documents || []) out.push({ id: d.name.split("/").pop(), f: d.fields || {} });
    if (!(tok = j.nextPageToken)) break;
  }
  return out;
}

/* ---------- crew key and push key ---------- */
let CK = null, CK_AT = 0;
async function crewKeyRaw(env) {
  if (CK && Date.now() - CK_AT < 10 * 60e3) return CK;
  let k = "";
  if (saJson(env)) {
    try { const r = await fsReq(env, "secret/key"); if (r.ok) k = String(fv(((await r.json()).fields || {}).k) || ""); } catch (_) {}
  }
  k = (k || String(env.CREW_KEY || "")).trim().replace(/^["'“”«]+|["'“”»]+$/g, "");
  if (!k) throw new Error("CREW_KEY fehlt im Worker.");
  CK = k; CK_AT = Date.now(); return k;
}
async function crewKey(env) { return crypto.subtle.importKey("raw", b64dec(await crewKeyRaw(env)), "AES-GCM", false, ["decrypt"]); }
async function crewDec(env, c) { const raw = b64dec(c); const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, await crewKey(env), raw.slice(12)); return JSON.parse(new TextDecoder().decode(pt)); }

let VAPIDS = null, VAPIDS_AT = 0;
async function vapidFromPem(pem) {
  const der = b64dec(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
  const priv = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const jwk = await crypto.subtle.exportKey("jwk", priv);
  return { priv, pub: b64uenc(u8cat(new Uint8Array([4]), b64u(jwk.x), b64u(jwk.y))) };
}
/* [current, older]: Firestore secret/vapid (service account) or VAPID_PRIVATE, then the old encrypted file (devices not yet moved) */
async function vapids(env) {
  if (VAPIDS && Date.now() - VAPIDS_AT < 10 * 60e3) return VAPIDS;
  const pems = [];
  if (saJson(env)) for (const path of ["secret/vapid", "secret/vapidprev"]) { try { const r = await fsReq(env, path); if (r.ok) { const p = fv(((await r.json()).fields || {}).priv); if (p) pems.push(p); } } catch (_) {} }
  if (env.VAPID_PRIVATE) pems.push(String(env.VAPID_PRIVATE));
  try {
    const e = await (await fetch(SITE + "tools/vapid.enc.json", { cf: { cacheTtl: 300 } })).json();
    pems.push(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64dec(e.iv) }, await crewKey(env), b64dec(e.ct))));
  } catch (_) {}
  const out = [];
  for (const p of [...new Set(pems)]) { try { out.push(await vapidFromPem(p)); } catch (_) {} }
  if (!out.length) throw new Error("Kein Push-Schlüssel.");
  VAPIDS = out; VAPIDS_AT = Date.now(); return out;
}
async function vapidAuth(v, endpoint) {
  const aud = new URL(endpoint).origin;
  const h = b64uenc(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const p = b64uenc(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:furtschellas@gmail.com" })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, v.priv, enc.encode(h + "." + p));
  return "vapid t=" + h + "." + p + "." + b64uenc(sig) + ", k=" + v.pub;
}

/* ---------- Web Push (RFC 8291 aes128gcm + VAPID) ---------- */
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
}
async function encryptPush(sub, payload) {
  const ua = b64u(sub.keys.p256dh), auth = b64u(sub.keys.auth);
  const as = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, as.privateKey, 256));
  const ikm = await hkdf(auth, shared, u8cat(enc.encode("WebPush: info\0"), ua, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, u8cat(enc.encode(payload), new Uint8Array([2]))));
  return u8cat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPub.length]), asPub, ct);
}
/* one fetch per device; the key is the one the device subscribed with (sub.k), else the current one */
async function sendPush(env, sub, data, k) {
  const vs = await vapids(env);
  const v = vs.find(x => x.pub === k) || vs[0];
  const body = await encryptPush(sub, JSON.stringify(data));
  const r = await fetch(sub.endpoint, { method: "POST", headers: { Authorization: await vapidAuth(v, sub.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "high" }, body });
  return r.status;
}

/* test from «Mein Konto»: a real push to all devices of the signed-in person */
async function selftest(req, env, origin) {
  const g = await guard(req, origin); if (g.err) return g.err;
  if (!allow("self", g.user.sub, 5, 10 * 60e3)) return json({ error: "Zu viele Tests – bitte in ein paar Minuten nochmals." }, 429, origin);
  const b = await req.json().catch(() => ({}));
  const devs = (await listDocs(env, "push")).filter(d => d.id.startsWith(g.user.sub + "_"));
  let n = 0; const st = [];
  for (const dv of devs) {
    const pc = fv(dv.f.c); if (!pc) continue;
    let p; try { p = await crewDec(env, pc); } catch (_) { st.push("decrypt"); continue; }
    if (!p.sub) continue;
    try { const s = await sendPush(env, p.sub, { title: String(b.title || "TSCHUGGER").slice(0, 120), body: String(b.body || "Test").slice(0, 300), url: "./", tag: "selftest" }, p.k); st.push(s); if (s >= 200 && s < 300) n++; } catch (e) { st.push(String(e).slice(0, 80)); }
  }
  return json({ ok: true, devices: devs.length, n, st }, 200, origin);
}

/* message to everybody: claimed once (sent=true, only if nobody touched the document since – needs «push.send» by the rules),
   then sent to at most PUSH_LIMIT devices; the GitHub run sends the rest (it skips the devices in «done») */
async function broadcast(req, env, origin, ctx) {
  const g = await guard(req, origin); if (g.err) return g.err;
  if (!allow("bc", g.user.sub, 10, 10 * 60e3)) return json({ error: "Zu viele Nachrichten – bitte kurz warten." }, 429, origin);
  const { id } = await req.json().catch(() => ({}));
  if (!/^[A-Za-z0-9]{6,40}$/.test(String(id || ""))) return json({ error: "id" }, 400, origin);
  const dr = await fsReq(env, "broadcasts/" + id, {}, g.tok);
  if (dr.status === 404) return json({ error: "Nachricht nicht gefunden." }, 404, origin);
  if (!dr.ok) return json({ error: "Kein Zugriff." }, 403, origin);
  const d = await dr.json(), f = d.fields || {};
  const c = fv(f.c);
  if (!c) return json({ error: "Nachricht nicht gefunden." }, 404, origin);
  if (fv(f.sent)) return json({ error: "Schon gesendet." }, 409, origin);
  const b = await crewDec(env, c);
  if (!(Date.now() - (b.at || 0) < 10 * 60e3)) return json({ error: "Zu alt." }, 410, origin);
  let devs;
  try { devs = await listDocs(env, "push"); } catch (e) { return json({ error: "Geräte nicht lesbar (FIREBASE_SA im Worker?) – die Nachricht geht mit dem nächsten Lauf raus." }, 503, origin); }
  const claim = await fsPatch(env, "broadcasts/" + id, { sent: true }, g.tok, d.updateTime);
  if (!claim.ok) return json({ error: claim.status === 403 ? "Keine Berechtigung «Push senden»." : "Schon gesendet." }, claim.status === 403 ? 403 : 409, origin);
  if (b.push === false) { await fsPatch(env, "broadcasts/" + id, { n: 0, fin: true }, g.tok); return json({ ok: true, n: 0, claimed: true }, 200, origin); }
  const lim = Math.max(1, +env.PUSH_LIMIT || 25);
  let n = 0, fail = 0, tried = 0, more = false;
  const done = [], gone = [];
  const todo = [];
  for (const dv of devs) {
    const pc = fv(dv.f.c); if (!pc) continue;
    let p; try { p = await crewDec(env, pc); } catch (_) { continue; }
    if (!p.sub || p.on === false) continue;
    const who = p.who || {};
    if (b.roles || b.depts) { const ok = (b.roles || []).includes(who.role || "") || (!!who.dept && (b.depts || []).includes(who.dept)); if (!ok) continue; }
    todo.push([dv.id, p]);
  }
  for (let i = 0; i < todo.length; i += 10) {   // in small groups (subrequest limit), at most PUSH_LIMIT devices
    if (tried >= lim) { more = true; break; }
    const part = todo.slice(i, Math.min(i + 10, i + lim - tried)); tried += part.length;
    await Promise.all(part.map(async ([did, p]) => {
      try {
        const st = await sendPush(env, p.sub, { title: b.title || "", body: b.body || "", url: /^\.\/#bc=/.test(b.url || "") ? b.url : "./", tag: "b" + id, icon: "push" }, p.k);
        if (st >= 200 && st < 300) { n++; done.push(did); } else if (st === 404 || st === 410) { gone.push(did); done.push(did); } else fail++;
      } catch (_) { fail++; }
    }));
  }
  const fin = !more && !fail;
  await fsPatch(env, "broadcasts/" + id, { n, done, fin }, g.tok);
  const later = [];
  if (!fin) later.push(dispatch(env, "push.yml"));   // the rest (and failed devices) by the GitHub run
  if (gone.length && saJson(env)) later.push(...gone.map(did => fsReq(env, "push/" + did, { method: "DELETE" }).catch(() => {})));
  if (later.length) ctx.waitUntil(Promise.all(later));
  return json({ ok: true, n, fail, rest: todo.length - tried, claimed: true }, 200, origin);
}

const cors = origin => ({
  "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});
const json = (o, status, origin) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) } });

const LANGN = { de: "Deutsch (Schweiz, ohne ß)", fr: "français", it: "italiano", en: "English", hi: "हिन्दी (Hindi)" };

async function chat(req, env, origin) {
  const g = await guard(req, origin); if (g.err) return g.err;
  const per = Math.max(1, +env.CHAT_PER_HOUR || 30);
  if (!allow("chat", g.user.sub, per, 3600e3) || !allow("chatd", g.user.sub, per * 4, 86400e3)) return json({ error: "Zu viele Fragen – bitte später nochmals." }, 429, origin);
  if (env.CHAT_RL) { try { const { success } = await env.CHAT_RL.limit({ key: g.user.sub }); if (!success) return json({ error: "Zu viele Fragen – bitte später nochmals." }, 429, origin); } catch (_) {} }
  const b = await req.json().catch(() => ({}));
  const q = String(b.q || "").slice(0, 2000).trim();
  if (!q) return json({ error: "Leere Frage." }, 400, origin);
  const ctx = String(b.ctx || "").slice(0, 60000);
  const hist = (Array.isArray(b.hist) ? b.hist : []).slice(-10)
    .filter(m => m && (m.r === "u" || m.r === "a") && m.t)
    .map(m => ({ role: m.r === "u" ? "user" : "assistant", content: String(m.t).slice(0, 4000) }));
  while (hist.length && hist[0].role !== "user") hist.shift();
  const lang = LANGN[b.lang] || LANGN.de;
  const system = [
    "Du bist der Assistent der Crew-App der TV-Serie «TSCHUGGER Tigerblood» (Drehplan, Callsheets, Crewliste, Locations, Drehbuch, Prep, Meine Termine).",
    "Antworte kurz, freundlich und konkret in dieser Sprache: " + lang + ". Strassennamen, Location-Namen, Szenen und Namen nicht übersetzen.",
    "Beantworte Fragen NUR mit den Daten unten und dem Wissen über die App. Wenn etwas nicht in den Daten steht, sag das ehrlich und nenne, wo in der App man nachschauen kann. Erfinde nie Zeiten, Adressen, Telefonnummern oder Personen.",
    "Die App ist eine BETA-Version; verbindlich sind die offiziellen Unterlagen der Produktion. Bei Fehlern in der App: Stefan Künzler kontaktieren.",
    "Heute ist " + String(b.today || "").slice(0, 40) + ". Angemeldet: " + String(b.who || g.user.email || "").slice(0, 120) + ".",
    "Formatiere schlicht: kurze Absätze oder Aufzählungen mit «- », keine Tabellen.",
    "--- DATEN AUS DER APP (nur was diese Person sehen darf) ---",
    ctx,
  ].join("\n");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: env.CLAUDE_MODEL || "claude-haiku-5-5", max_tokens: 900, system, messages: [...hist, { role: "user", content: q }] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: "Claude: " + ((j.error && j.error.message) || r.status) }, 502, origin);
  const a = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
  return json({ a }, 200, origin);
}

async function dispatch(env, wf, inputs) {
  if (!env.GH_TOKEN) return wf + " no GH_TOKEN";
  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${wf}/dispatches`, {
    method: "POST",
    headers: { Authorization: "Bearer " + env.GH_TOKEN, Accept: "application/vnd.github+json", "User-Agent": "tschugger-worker", "X-GitHub-Api-Version": "2022-11-28" },
    body: JSON.stringify(inputs ? { ref: "main", inputs } : { ref: "main" }),
  });
  return wf + " " + r.status;
}

/* encrypted pictures from R2 (they are encrypted with the crew key, like on GitHub Pages before) */
async function blk(req, env, url, ctx, origin) {
  if (!env.BLK) return new Response("no storage", { status: 404, headers: cors(origin) });
  const key = url.pathname.replace(/^\/+/, "");
  if (!/^blk\/[0-9a-f]{20}(p\d+|\.mp4)?\.bin$/.test(key)) return new Response("bad name", { status: 400, headers: cors(origin) });
  const cache = caches.default, ck = new Request(url.origin + "/" + key);
  let res = await cache.match(ck);
  if (!res) {
    const o = await env.BLK.get(key);
    if (!o) return new Response("not found", { status: 404, headers: cors(origin) });
    res = new Response(o.body, { headers: { "Content-Type": "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable", ETag: o.httpEtag } });
    ctx.waitUntil(cache.put(ck, res.clone()));
  }
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(cors(origin))) out.headers.set(k, v);
  return out;
}

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(req.url), path = url.pathname.replace(/\/+$/, "");
    try {
      if (req.method === "GET" && path.startsWith("/blk/")) return await blk(req, env, url, ctx, origin);
      if (req.method === "POST" && path === "/chat") return await chat(req, env, origin);
      if (req.method === "POST" && path === "/broadcast") return await broadcast(req, env, origin, ctx);
      if (req.method === "POST" && path === "/selftest") return await selftest(req, env, origin);
      if (req.method === "POST" && path === "/notify") {
        const g = await guard(req, origin); if (g.err) return g.err;
        if (!allow("notify", g.user.sub, 3, 10 * 60e3)) return json({ error: "Zu oft." }, 429, origin);
        const r = await dispatch(env, "push.yml");
        return json({ ok: / 204$/.test(r), r }, / 204$/.test(r) ? 200 : 502, origin);
      }
      if (req.method === "GET" && path === "") {
        let vapidPub = "";
        try { vapidPub = (await vapids(env))[0].pub; } catch (_) {}
        return json({ ok: true, v: VERSION, chat: !!env.ANTHROPIC_API_KEY, cron: !!env.GH_TOKEN, push: !!(env.CREW_KEY || saJson(env)), sa: !!saJson(env), blk: !!env.BLK, vapidPub }, 200, origin);
      }
      return json({ error: "not found" }, 404, origin);
    } catch (e) {
      return json({ error: String((e && e.message) || e).slice(0, 160) }, 500, origin);
    }
  },
  async scheduled(ev, env, ctx) {
    const m = new Date(ev.scheduledTime).getUTCMinutes();
    const jobs = [dispatch(env, "push.yml")];
    if (m % 30 < 10) jobs.push(dispatch(env, "dropbox-update.yml", { trigger: "cron" }));
    ctx.waitUntil(Promise.all(jobs).then(r => console.log(r.join(", "))));
  },
};
