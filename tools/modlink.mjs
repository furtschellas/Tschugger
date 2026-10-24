// The app's parts are real ES modules (tools/base/*.js, tools/boot/*.js, tools/a2hs.js: import / export).
// This linker puts them together for the browser – in the order of the files, as before (no reordering by a bundler,
// so nothing starts before what it needs). It checks every import against the exports of the named file and that no
// two parts declare the same name (they share one scope).
//
//   node tools/modlink.mjs < spec.json   → the script on stdout
//   spec: {mode: "bundle"|"classic"|"split" (classic, one text per module as JSON), label, modules: [{name, path, code}], external: [{path, code}], bridge: [names], deny: [names]}
//
// bundle: one function scope (the app's names are no longer globals); each top-level statement that does something runs
//         in its own try/catch – an error stops only that step, the rest of the app starts (like the separate scripts before);
//         «bridge»: names that tests, the start screen and the App-Verwaltung (admin.js) use from outside → window getters/setters
// classic: only import/export taken out (tools/app.html, the stand-alone app)
import {parse} from "./vendor/acorn.mjs";
import path from "node:path";

const read = async () => { let s = ""; for await (const c of process.stdin) s += c; return JSON.parse(s); };
const P = code => parse(code, {ecmaVersion: "latest", sourceType: "module", ranges: true, allowHashBang: false});
const norm = p => path.posix.normalize(p.replace(/\\/g, "/"));

function info(mod) {
  const ast = P(mod.code), exp = new Set(), decl = new Map(), imp = [];
  const names = s => s.type === "VariableDeclaration" ? s.declarations.flatMap(d => pat(d.id)) : s.id ? [s.id.name] : [];
  const pat = n => n.type === "Identifier" ? [n.name] : n.type === "ObjectPattern" ? n.properties.flatMap(p => pat(p.value || p.argument))
    : n.type === "ArrayPattern" ? n.elements.filter(Boolean).flatMap(pat) : n.type === "RestElement" ? pat(n.argument) : n.type === "AssignmentPattern" ? pat(n.left) : [];
  const kind = s => s.type === "VariableDeclaration" ? s.kind : s.type === "FunctionDeclaration" ? "function" : "class";
  for (const s of ast.body) {
    if (s.type === "ImportDeclaration") imp.push(s);
    else if (s.type === "ExportNamedDeclaration") {
      if (!s.declaration) throw new Error(mod.name + ": «export {…}» wird nicht unterstützt – «export» direkt vor die Deklaration");
      for (const n of names(s.declaration)) { exp.add(n); decl.set(n, kind(s.declaration)); }
    } else if (s.type === "ExportDefaultDeclaration" || s.type === "ExportAllDeclaration") throw new Error(mod.name + ": nur benannte Exporte");
    else if (["VariableDeclaration", "FunctionDeclaration", "ClassDeclaration"].includes(s.type)) for (const n of names(s)) decl.set(n, kind(s));
  }
  return {ast, exp, decl, imp};
}

// an initializer that can throw while the app starts (a call, new, member access … outside of functions)
function risky(n) {
  if (!n || typeof n !== "object") return false;
  if (["FunctionExpression", "ArrowFunctionExpression", "ClassExpression"].includes(n.type)) return false;
  if (["CallExpression", "NewExpression", "MemberExpression", "TaggedTemplateExpression", "AwaitExpression", "ChainExpression"].includes(n.type)) return true;
  for (const k in n) { if (k === "range") continue; const v = n[k];
    if (Array.isArray(v)) { if (v.some(risky)) return true; } else if (v && typeof v.type === "string" && risky(v)) return true; }
  return false;
}

function transform(mod, I, bundle) {
  const src = mod.code; let out = "", at = 0;
  const wrap = t => bundle ? "try{" + t + "\n}catch(e){__E(e," + JSON.stringify(mod.name) + ")}" : t;
  for (const s0 of I.ast.body) {
    out += src.slice(at, s0.range[0]); at = s0.range[1];
    if (s0.type === "ImportDeclaration") continue;
    const s = s0.type === "ExportNamedDeclaration" ? s0.declaration : s0;
    const t = src.slice(s.range[0], s.range[1]);
    if (s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") { out += t; continue; }
    if (s.type === "EmptyStatement") continue;
    if (s.type === "VariableDeclaration") {
      if (!bundle || !s.declarations.some(d => risky(d.init)) || s.declarations.some(d => d.id.type !== "Identifier")) { out += t; continue; }
      // «const X = f()» → «let X; try{ X = f() }catch…»: an error here no longer stops the whole app
      const kw = s.kind === "var" ? "var" : "let", heads = [], inits = [];
      for (const d of s.declarations) {
        const n = d.id.name;
        if (d.init && risky(d.init)) { heads.push(n); inits.push(n + "=" + src.slice(d.init.range[0], d.init.range[1])); }
        else heads.push(d.init ? n + "=" + src.slice(d.init.range[0], d.init.range[1]) : n);
      }
      out += kw + " " + heads.join(",") + ";" + inits.map(x => wrap(x + ";")).join("");
      continue;
    }
    out += wrap(t);
  }
  return out + src.slice(at);
}

const spec = await read();
const mods = spec.modules.map(m => ({...m, path: norm(m.path || m.name)}));
const ext = (spec.external || []).map(m => ({...m, path: norm(m.path)}));
const all = new Map();
for (const m of mods.concat(ext)) all.set(m.path, {m, I: info(m)});
const errs = [], owner = new Map();
for (const m of mods) {
  const {I} = all.get(m.path);
  for (const n of I.decl.keys()) { if (owner.has(n)) errs.push(`«${n}» in ${owner.get(n)} und ${m.name} – Namen müssen eindeutig sein`); else owner.set(n, m.name); }
  for (const d of I.imp) {
    const to = norm(path.posix.join(path.posix.dirname(m.path), d.source.value)), t = all.get(to);
    if (!t) { errs.push(`${m.name}: Import aus unbekannter Datei ${d.source.value}`); continue; }
    for (const sp of d.specifiers) {
      if (sp.type !== "ImportSpecifier") { errs.push(`${m.name}: nur «import {…} from» erlaubt`); continue; }
      if (!t.I.exp.has(sp.imported.name)) errs.push(`${m.name}: «${sp.imported.name}» wird von ${d.source.value} nicht exportiert`);
      if (sp.local.name !== sp.imported.name) errs.push(`${m.name}: Umbenennen beim Import (as) wird nicht unterstützt`);
    }
  }
}
if (errs.length) { console.error("Module: " + errs.length + " Fehler\n" + errs.slice(0, 40).join("\n")); process.exitCode = 2; throw new Error("Module: Fehler"); }

let body = spec.mode === "split" ? JSON.stringify(mods.map(m => transform(m, all.get(m.path).I, false))) : mods.map(m => "/* " + m.name + " */\n" + transform(m, all.get(m.path).I, spec.mode === "bundle")).join("\n");
if (spec.mode === "bundle") {
  const kinds = new Map(); for (const m of mods) for (const [n, k] of all.get(m.path).I.decl) kinds.set(n, k);
  const deny = new Set(spec.deny || []);
  const br = [...new Set(spec.bridge || [])].filter(n => kinds.has(n) && !deny.has(n)).sort();
  // name: [getter, setter (not for const), 1 = function (may replace a configurable browser function, like a global function did)]
  const items = br.map(n => JSON.stringify(n) + ":[()=>" + n + (kinds.get(n) === "const" ? "" : ",v=>" + n + "=v") + (kinds.get(n) === "function" ? ",1" : "") + "]");
  const bridge = items.length ? "__BR({" + items.join(",") + "});\n" : "";
  // a name kept off window (deny) that this bundle imports from outside: through its alias (e.g. L → window.__L)
  const alias = spec.alias || {}, extNames = new Set();
  for (const m of mods) for (const d of all.get(m.path).I.imp) { const to = norm(path.posix.join(path.posix.dirname(m.path), d.source.value)); if (!mods.some(x => x.path === to)) for (const sp of d.specifiers) extNames.add(sp.local.name); }
  const pre = [...extNames].filter(n => alias[n]).map(n => "var " + n + "=window." + alias[n] + ";").join("");
  body = "(function(){\n" + pre +
    "var __E=function(e,f){try{console.error(e);(window.__ERRS||[]).push({m:String(e&&e.message||e).slice(0,200),f:String(f).slice(0,40),l:0,t:Date.now(),c:window.__errCtx?String(window.__errCtx()):\"\"})}catch(_){}};\n" +
    "var __BR=function(o){for(var n in o){var a=o[n],d=Object.getOwnPropertyDescriptor(window,n);if(d&&!(a[2]&&d.configurable))continue;if(!d&&n in window&&!a[2])continue;\n" +
    "  try{Object.defineProperty(window,n,{get:a[0],set:a[1]||function(){},configurable:true,enumerable:false})}catch(_){}}};\n" +
    bridge + body + "\n})();";
}
process.stdout.write(body);
