/* TSCHUGGER Crew-App – Cloudflare Worker
 *
 * 1. Chat-Assistent: die App schickt Frage + die Daten, die die angemeldete Person sehen darf, hierher;
 *    der Worker prüft die Firebase-Anmeldung und fragt Claude. Der API-Schlüssel bleibt hier geheim.
 * 2. Zeitplan (Cron Trigger «*\/10 * * * *»): startet bei GitHub alle 10 Minuten die Push-Nachrichten
 *    und alle 30 Minuten die Dropbox-Aktualisierung – GitHubs eigener Zeitplan ist oft stundenlang verspätet.
 *
 * Variablen/Secrets im Worker (Settings → Variables and Secrets):
 *   ANTHROPIC_API_KEY  (Secret)  Claude-API-Schlüssel
 *   GH_TOKEN           (Secret)  GitHub «fine-grained token», nur Repository Tschugger, Recht «Actions: Read and write»
 *   CLAUDE_MODEL       (optional) Standard: claude-haiku-5-5
 */
const PROJECT = "tschugger-83692";
const REPO = "furtschellas/Tschugger";
const ORIGINS = ["https://furtschellas.github.io", "http://localhost:8765"];
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

const cors = origin => ({
  "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    if (req.method === "GET" && url.pathname === "/") return json({ ok: true, chat: !!env.ANTHROPIC_API_KEY, cron: !!env.GH_TOKEN }, 200, origin);
    return json({ error: "not found" }, 404, origin);
  },
  async scheduled(ev, env, ctx) {
    const m = new Date(ev.scheduledTime).getUTCMinutes();
    const jobs = [dispatch(env, "push.yml")];
    if (m % 30 < 10) jobs.push(dispatch(env, "dropbox-update.yml"));
    ctx.waitUntil(Promise.all(jobs).then(r => console.log(r.join(", "))));
  },
};
