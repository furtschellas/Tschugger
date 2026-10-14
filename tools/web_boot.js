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

/* ---------- home screen: offer to add the app after signing in (only when opened in the browser) ---------- */
Object.assign(I18N,{
 "Zum Startbildschirm hinzufügen?":{fr:"Ajouter à l’écran d’accueil ?",en:"Add to home screen?"},
 "Dann öffnest du die Crew-App wie eine normale App, ohne Link.":{fr:"Tu ouvriras l’app de l’équipe comme une app normale, sans lien.",en:"Then you open the crew app like a normal app, no link needed."},
 "Ja, hinzufügen":{fr:"Oui, ajouter",en:"Yes, add it"},
 "Später":{fr:"Plus tard",en:"Later"},
 "Ist schon drauf":{fr:"C’est déjà fait",en:"Already there"},
 "So geht's auf dem iPhone:":{fr:"Sur iPhone :",en:"On iPhone:"},
 "1. Unten auf Teilen tippen":{fr:"1. Touche Partager en bas",en:"1. Tap Share at the bottom"},
 "2. «Zum Home-Bildschirm» wählen":{fr:"2. Choisis « Sur l’écran d’accueil »",en:"2. Choose “Add to Home Screen”"},
 "3. Oben rechts «Hinzufügen» tippen":{fr:"3. Touche « Ajouter » en haut à droite",en:"3. Tap “Add” top right"},
 "So geht's:":{fr:"Comment faire :",en:"How to:"},
 "1. Browser-Menü ⋮ öffnen":{fr:"1. Ouvre le menu ⋮ du navigateur",en:"1. Open the browser menu ⋮"},
 "2. «Zum Startbildschirm hinzufügen» oder «App installieren» wählen":{fr:"2. Choisis « Ajouter à l’écran d’accueil » ou « Installer l’app »",en:"2. Choose “Add to Home screen” or “Install app”"},
 "Fertig":{fr:"OK",en:"Done"}
});
const A2HS_KEY="a2hs:v1";let DEFERRED=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();DEFERRED=e});
window.addEventListener("appinstalled",()=>{try{localStorage.setItem(A2HS_KEY,"done")}catch(_){}hideA2hs()});
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
const isStandalone=()=>(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isMobile=()=>isIOS()||/android/i.test(navigator.userAgent);
function a2hsState(){try{return localStorage.getItem(A2HS_KEY)||""}catch(_){return ""}}
function a2hsSet(v){try{localStorage.setItem(A2HS_KEY,v)}catch(_){}}
function hideA2hs(){const s=document.getElementById("a2hs");if(s)s.hidden=true}
/* ask after sign-in; after "Später" ask again at the earliest in 3 days; never after "Ist schon drauf" / installed */
function maybeOfferA2hs(afterLogin){
  if(isStandalone()||!isMobile())return;
  const st=a2hsState();if(st==="done")return;
  if(!afterLogin&&st&&Date.now()-(+st||0)<3*864e5)return;
  setTimeout(()=>showA2hs(),afterLogin?400:1500);
}
function showA2hs(steps){
  let s=document.getElementById("a2hs");
  if(!s){s=document.createElement("div");s.id="a2hs";s.className="a2hs";s.setAttribute("role","dialog");s.setAttribute("aria-modal","true");document.body.appendChild(s);
    s.addEventListener("click",async e=>{
      const b=e.target.closest("[data-a2]");if(!b){if(e.target===s){a2hsSet(String(Date.now()));hideA2hs()}return}
      const a=b.dataset.a2;
      if(a==="yes"){
        if(DEFERRED){const p=DEFERRED;DEFERRED=null;p.prompt();try{const r=await p.userChoice;a2hsSet(r&&r.outcome==="accepted"?"done":String(Date.now()))}catch(_){}hideA2hs()}
        else showA2hs(true);
      }else if(a==="later"){a2hsSet(String(Date.now()));hideA2hs()}
      else if(a==="done"){a2hsSet("done");hideA2hs()}
      else if(a==="ok"){a2hsSet(String(Date.now()));hideA2hs()}
    });
  }
  const share='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>';
  const body=steps
    ?(isIOS()
      ?'<p class="a2t">'+L("So geht's auf dem iPhone:")+'</p><ol class="a2steps"><li>'+L("1. Unten auf Teilen tippen").replace(/^1\. /,"")+' '+share+'</li><li>'+L("2. «Zum Home-Bildschirm» wählen").replace(/^2\. /,"")+'</li><li>'+L("3. Oben rechts «Hinzufügen» tippen").replace(/^3\. /,"")+'</li></ol><div class="a2b"><button class="pri" data-a2="ok">'+L("Fertig")+'</button></div>'
      :'<p class="a2t">'+L("So geht's:")+'</p><ol class="a2steps"><li>'+L("1. Browser-Menü ⋮ öffnen").replace(/^1\. /,"")+'</li><li>'+L("2. «Zum Startbildschirm hinzufügen» oder «App installieren» wählen").replace(/^2\. /,"")+'</li></ol><div class="a2b"><button class="pri" data-a2="ok">'+L("Fertig")+'</button></div>')
    :'<p>'+L("Dann öffnest du die Crew-App wie eine normale App, ohne Link.")+'</p><div class="a2b"><button class="pri" data-a2="yes">'+L("Ja, hinzufügen")+'</button><button data-a2="later">'+L("Später")+'</button><button class="lnk" data-a2="done">'+L("Ist schon drauf")+'</button></div>';
  s.innerHTML='<div class="a2box"><img src="icon-192.png" alt="" width="56" height="56"><h3>'+L("Zum Startbildschirm hinzufügen?")+'</h3>'+body+'</div>';
  s.hidden=false;
}
/* hook: first successful sign-in on this device, and later browser visits */
(function(){
  const orig=load;
  load=async function(force){const r=await orig(force);if(r&&window.__justSignedIn){window.__justSignedIn=false;maybeOfferA2hs(true)}return r};
  document.addEventListener("submit",e=>{if(e.target.closest("#gate"))window.__justSignedIn=true},true);
  window.addEventListener("load",()=>{if(getPw())maybeOfferA2hs(false)});
})();
