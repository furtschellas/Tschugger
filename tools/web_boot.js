/* ---------- web boot (GitHub Pages): encrypted data file instead of Claude database ---------- */
I18N["Crew-Passwort"]={fr:"Mot de passe de l’équipe",en:"Crew password"};
I18N["Öffnen"]={fr:"Ouvrir",en:"Open"};
I18N["Passwort falsch."]={fr:"Mot de passe incorrect.",en:"Wrong password."};
I18N["Das Passwort steht in der Mail der Produktion."]={fr:"Le mot de passe figure dans l’e-mail de la production.",en:"The password is in the production's email."};
I18N["Abmelden"]={fr:"Se déconnecter",en:"Sign out"};
const PW_KEY="crewpw:v1",DATA_URL="data.enc.json",POLL_MS=3*60*1000;
let KEYC=null,LASTSTAMP=null;
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function deriveKey(pw,salt,iter){
  const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt:b64(salt),iterations:iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
}
async function fetchEnc(){
  const r=await fetch(DATA_URL+"?t="+Date.now(),{cache:"no-store"});
  if(!r.ok)throw new Error("HTTP "+r.status);
  return r.json();
}
async function decryptWith(pw,enc){
  const ck=enc.salt+"|"+enc.iter;
  if(!KEYC||KEYC.pw!==pw||KEYC.ck!==ck)KEYC={pw,ck,key:await deriveKey(pw,enc.salt,enc.iter)};
  const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(enc.iv)},KEYC.key,b64(enc.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
function applyData(d){
  S.meta=d.meta||null;
  for(const [k,src] of [["days","days"],["crew","crew"],["locs","locations"],["places","places"],["dispos","dispos"]])S[k]=(CLEAN[k]||(x=>x))(arr(d[src]));
  MEMO.clear();saveCache();S.loaded=true;
}
function getPw(){try{return localStorage.getItem(PW_KEY)||""}catch(_){return ""}}
function setPw(v){try{v?localStorage.setItem(PW_KEY,v):localStorage.removeItem(PW_KEY)}catch(_){}}
async function load(force){
  const pw=getPw();if(!pw){showGate();return false}
  const enc=await fetchEnc();
  if(!force&&enc.stamp&&enc.stamp===LASTSTAMP&&S.loaded)return true;
  let d;try{d=await decryptWith(pw,enc)}catch(_){setPw("");KEYC=null;showGate(L("Passwort falsch."));return false}
  LASTSTAMP=enc.stamp||null;applyData(d);scheduleRender();return true;
}
function showGate(err){
  let g=document.getElementById("gate");
  if(!g){
    g=document.createElement("div");g.id="gate";g.className="gate";
    g.innerHTML='<form class="gbox"><h2>Tschugger <span>Tigerblood</span></h2><label for="gpw"></label><input id="gpw" type="password" autocomplete="current-password" required><button type="submit"></button><p class="gerr" role="alert"></p><p class="ghint"></p><div class="lang glang"><button type="button" data-glang="de">DE</button><button type="button" data-glang="fr">FR</button><button type="button" data-glang="en">EN</button></div></form>';
    document.body.appendChild(g);
    g.querySelector("form").addEventListener("submit",async e=>{
      e.preventDefault();const v=g.querySelector("#gpw").value.trim();if(!v)return;
      const btn=g.querySelector("button[type=submit]");btn.disabled=true;g.querySelector(".gerr").textContent="";
      setPw(v);
      try{if(await load(true)){g.hidden=true;document.body.style.overflow=""}}
      catch(err){console.error(err);setPw("");g.querySelector(".gerr").textContent=L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen.")}
      btn.disabled=false;
    });
    g.addEventListener("click",e=>{const b=e.target.closest("[data-glang]");if(!b)return;LANG=b.dataset.glang;store("lang",LANG);applyStatic();gateText();render()});
  }
  gateText();g.querySelector(".gerr").textContent=err||"";g.hidden=false;document.body.style.overflow="hidden";
  setTimeout(()=>{const i=g.querySelector("#gpw");if(i)i.focus()},50);
}
function gateText(){
  const g=document.getElementById("gate");if(!g)return;
  g.querySelector("label").textContent=L("Crew-Passwort");g.querySelector("button[type=submit]").textContent=L("Öffnen");
  g.querySelector(".ghint").textContent=L("Das Passwort steht in der Mail der Produktion.");
  g.querySelectorAll("[data-glang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.glang===LANG));
}

applyStatic();
loadCache();
render();
(async()=>{
  const b=$("#refresh");b.hidden=false;
  b.addEventListener("click",async()=>{
    if(b.classList.contains("spin"))return;b.classList.add("spin");
    try{if(await load(true)){const c=lastCheck(S.meta);showMsg(L("Neueste Daten geladen.")+(c?" "+L("Dropbox zuletzt geprüft")+" "+fmtStamp(c)+".":""),5000)}}
    catch(err){console.error(err);showMsg(L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen."),5000)}
    setTimeout(()=>b.classList.remove("spin"),400);
  });
  try{await load(false)}catch(err){console.error(err);S.loaded=true;if(!S.days.length)showMsg(L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen."));render()}
  /* stay current: check for a new data file every few minutes and whenever the app comes back to the foreground */
  setInterval(()=>{if(document.visibilityState==="visible")load(false).catch(()=>{})},POLL_MS);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")load(false).catch(()=>{})});
})();
