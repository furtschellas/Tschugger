/* TSCHUGGER Crew-App – Cloudflare Worker
 *
 * 0. /broadcast: verschickt eine «Push-Nachricht an alle» sofort (Web Push direkt aus dem Worker);
 *    /notify: startet zusätzlich den Versand bei GitHub (Reserve).
 * 1. Chat-Assistent: die App schickt Frage + die Daten, die die angemeldete Person sehen darf, hierher;
 *    der Worker prüft die Firebase-Anmeldung und fragt Claude. Der API-Schlüssel bleibt hier geheim.
 * 2. Zeitplan (Cron Trigger «*\/10 * * * *»): startet bei GitHub alle 10 Minuten die Push-Nachrichten
 *    und alle 30 Minuten die Dropbox-Aktualisierung – GitHubs eigener Zeitplan ist oft stundenlang verspätet.
 *
 * Variablen/Secrets im Worker (Settings → Variables and Secrets):
 *   ANTHROPIC_API_KEY  (Secret)  Claude-API-Schlüssel
 *   GH_TOKEN           (Secret)  GitHub «fine-grained token», nur Repository Tschugger, Recht «Actions: Read and write»
 *   CREW_KEY           (Secret)  Crew-Schlüssel (derselbe wie bei GitHub) – für sofortige Push-Nachrichten
 *   CLAUDE_MODEL       (optional) Standard: claude-haiku-5-5
 */
const PROJECT = "tschugger-83692";
const REPO = "furtschellas/Tschugger";
const ORIGINS = ["https://furtschellas.github.io", "http://localhost:8765"];
const API_KEY = "AIzaSyBrHUJumAArmHv92qhZEbUFXSWrwvZaKjQ";
const SITE = "https://furtschellas.github.io/Tschugger/";
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let JWKS = null, JWKS_AT = 0;
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));

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
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(sig), new TextEncoder().encode(h + "." + p));
  if (!ok) throw new Error("bad signature");
  return pay;
}

/* ---------- Web Push (RFC 8291 aes128gcm + VAPID) straight from the worker ---------- */
const enc = new TextEncoder();
const u8cat = (...a) => { const n = a.reduce((x, y) => x + y.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
const b64uenc = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64dec = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function crewKey(env) { return crypto.subtle.importKey("raw", b64dec(String(env.CREW_KEY || "").trim().replace(/^["']|["']$/g, "")), "AES-GCM", false, ["decrypt"]); }
async function crewDec(env, c) { const raw = b64dec(c); const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, await crewKey(env), raw.slice(12)); return JSON.parse(new TextDecoder().decode(pt)); }
let VAPID = null;
async function vapid(env) {
  if (VAPID) return VAPID;
  const e = await (await fetch(SITE + "tools/vapid.enc.json", { cf: { cacheTtl: 300 } })).json();
  const pem = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64dec(e.iv) }, await crewKey(env), b64dec(e.ct)));
  const der = b64dec(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
  const priv = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const jwk = await crypto.subtle.exportKey("jwk", priv);
  const pub = u8cat(new Uint8Array([4]), b64u(jwk.x), b64u(jwk.y));
  VAPID = { priv, pub: b64uenc(pub) };
  return VAPID;
}
async function vapidAuth(env, endpoint) {
  const v = await vapid(env), aud = new URL(endpoint).origin;
  const h = b64uenc(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const p = b64uenc(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:furtschellas@gmail.com" })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, v.priv, enc.encode(h + "." + p));
  return "vapid t=" + h + "." + p + "." + b64uenc(sig) + ", k=" + v.pub;
}
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
  const rs = new Uint8Array([0, 0, 16, 0]);
  return u8cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
async function sendPush(env, sub, data) {
  const body = await encryptPush(sub, JSON.stringify(data));
  const r = await fetch(sub.endpoint, { method: "POST", headers: { Authorization: await vapidAuth(env, sub.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "high" }, body });
  return r.status;
}
async function listDocs(col) {
  const out = []; let tok = "";
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${col}?pageSize=300&key=${API_KEY}` + (tok ? "&pageToken=" + encodeURIComponent(tok) : ""));
    const j = await r.json();
    for (const d of j.documents || []) out.push({ id: d.name.split("/").pop(), f: d.fields || {} });
    if (!(tok = j.nextPageToken)) break;
  }
  return out;
}
/* test from «Mein Konto»: a real push to all devices of the signed-in person */
async function selftest(req, env, origin) {
  let user; try { user = await verifyToken((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "")); } catch (e) { return json({ error: "Nicht angemeldet." }, 401, origin); }
  if (!env.CREW_KEY) return json({ error: "CREW_KEY fehlt im Worker." }, 500, origin);
  const b = await req.json().catch(() => ({}));
  const devs = (await listDocs("push")).filter(d => d.id.startsWith(user.sub + "_"));
  let n = 0; const st = [];
  for (const dv of devs) {
    const pc = dv.f.c && dv.f.c.stringValue; if (!pc) continue;
    let p; try { p = await crewDec(env, pc); } catch (_) { st.push("decrypt"); continue; }
    if (!p.sub) continue;
    try { const s = await sendPush(env, p.sub, { title: String(b.title || "TSCHUGGER"), body: String(b.body || "Test"), url: "./", tag: "selftest" }); st.push(s); if (s >= 200 && s < 300) n++; } catch (e) { st.push(String(e).slice(0, 80)); }
  }
  return json({ ok: true, devices: devs.length, n, st }, 200, origin);
}
async function broadcast(req, env, origin) {
  try { await verifyToken((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "")); } catch (e) { return json({ error: "Nicht angemeldet." }, 401, origin); }
  if (!env.CREW_KEY) return json({ error: "CREW_KEY fehlt im Worker." }, 500, origin);
  const { id } = await req.json().catch(() => ({}));
  if (!/^[A-Za-z0-9]{6,40}$/.test(String(id || ""))) return json({ error: "id" }, 400, origin);
  /* only messages that a person with the permission «push.send» just stored (Firestore rules) and that are fresh */
  const d = await (await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/broadcasts/${id}?key=${API_KEY}`)).json();
  const c = d && d.fields && d.fields.c && d.fields.c.stringValue;
  if (!c) return json({ error: "Nachricht nicht gefunden." }, 404, origin);
  if (d.fields.sent && d.fields.sent.booleanValue) return json({ error: "Schon gesendet." }, 409, origin);
  const b = await crewDec(env, c);
  if (!(Date.now() - (b.at || 0) < 10 * 60e3)) return json({ error: "Zu alt." }, 410, origin);
  let n = 0, fail = 0;
  const devs = await listDocs("push");
  await Promise.all(devs.map(async dv => {
    const pc = dv.f.c && dv.f.c.stringValue; if (!pc) return;
    let p; try { p = await crewDec(env, pc); } catch (_) { return; }
    if (!p.sub || p.on === false) return;
    const who = p.who || {};
    if (b.roles || b.depts) { const ok = (b.roles || []).includes(who.role || "") || (!!who.dept && (b.depts || []).includes(who.dept)); if (!ok) return; }
    try { const st = await sendPush(env, p.sub, { title: b.title || "", body: b.body || "", url: "./", tag: "b" + id }); if (st >= 200 && st < 300) n++; else fail++; } catch (_) { fail++; }
  }));
  return json({ ok: true, n, fail }, 200, origin);
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
  let user;
  try { user = await verifyToken((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "")); }
  catch (e) { return json({ error: "Nicht angemeldet." }, 401, origin); }
  const b = await req.json().catch(() => ({}));
  const q = String(b.q || "").slice(0, 2000).trim();
  if (!q) return json({ error: "Leere Frage." }, 400, origin);
  const ctx = String(b.ctx || "").slice(0, 120000);
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
    "Heute ist " + String(b.today || "") + ". Angemeldet: " + String(b.who || user.email || "") + ".",
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

async function dispatch(env, wf) {
  if (!env.GH_TOKEN) return "no GH_TOKEN";
  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${wf}/dispatches`, {
    method: "POST",
    headers: { Authorization: "Bearer " + env.GH_TOKEN, Accept: "application/vnd.github+json", "User-Agent": "tschugger-worker", "X-GitHub-Api-Version": "2022-11-28" },
    body: JSON.stringify({ ref: "main" }),
  });
  return wf + " " + r.status;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname.replace(/\/+$/, "") === "/chat") return chat(req, env, origin);
    if (req.method === "POST" && url.pathname.replace(/\/+$/, "") === "/broadcast") return broadcast(req, env, origin);
    if (req.method === "POST" && url.pathname.replace(/\/+$/, "") === "/selftest") return selftest(req, env, origin);
    if (req.method === "POST" && url.pathname.replace(/\/+$/, "") === "/notify") {
      try { await verifyToken((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "")); } catch (e) { return json({ error: "Nicht angemeldet." }, 401, origin); }
      const r = await dispatch(env, "push.yml");
      return json({ ok: / 204$/.test(r), r }, / 204$/.test(r) ? 200 : 502, origin);
    }
    if (req.method === "GET" && url.pathname === "/") return json({ ok: true, chat: !!env.ANTHROPIC_API_KEY, cron: !!env.GH_TOKEN, push: !!env.CREW_KEY }, 200, origin);
    return json({ error: "not found" }, 404, origin);
  },
  async scheduled(ev, env, ctx) {
    const m = new Date(ev.scheduledTime).getUTCMinutes();
    const jobs = [dispatch(env, "push.yml")];
    if (m % 30 < 10) jobs.push(dispatch(env, "dropbox-update.yml"));
    ctx.waitUntil(Promise.all(jobs).then(r => console.log(r.join(", "))));
  },
};
