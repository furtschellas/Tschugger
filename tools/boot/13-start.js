import {$,L,MEMO,S,applyStatic} from "../base/10-core.js";
import {fmtStamp,lastCheck,render} from "../base/15-script-tab.js";
import {setSCRIPT} from "../base/17-scene-reader.js";
import {loadCache,showMsg} from "../base/20-data-start.js";
import {POLL_MS} from "./01-config.js";
import {FB,FBP,ME,SBXFRAME,applyLangs,fb,loadLangs,setME,setMYPERMS} from "./03-core-firebase.js";
import {isOffline,load,loadErr} from "./04-data.js";
import {AUTHMODE,checkMember,clearLocal,errText,hideGate,showGate} from "./05-membership-signin.js";
import {START,afterSignIn,setWELCOME_OPEN} from "./10-menus-welcome-presence.js";
import {acctButton} from "./11-account.js";
/* ---------- new app version: reload once when the published version differs ---------- */
const APP_VER="__APP_VER__";
async function checkVersion(){
  try{const r=await fetch("version.txt?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const v=(await r.text()).trim();
    if(!v||v===APP_VER)return;
    let done="";try{done=sessionStorage.getItem("reloadedFor")||""}catch(_){}
    if(done===v)return;
    /* no reload while the app is being used (it would cost the loading time): the new version is loaded the next time the app goes
       to the background – opened again, it shows the same page (and place) with the new version; at the start (first seconds) at once */
    if(document.visibilityState==="visible"&&performance.now()>4000){NEWVER=v;return}
    /* someone is typing (a form, a chat or a note): later, at the next check – not now and not «never» */
    const f=document.activeElement;if(f&&(/^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)||f.isContentEditable))return;
    try{sessionStorage.setItem("reloadedFor",v)}catch(_){}
    location.reload();
  }catch(_){}
}
let NEWVER="";
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkVersion();
  else if(NEWVER){let done="";try{done=sessionStorage.getItem("reloadedFor")||""}catch(_){}if(done!==NEWVER){try{sessionStorage.setItem("reloadedFor",NEWVER);localStorage.setItem("lastVis",String(Date.now()))}catch(_){}setTimeout(()=>location.reload(),50)}}});
setTimeout(checkVersion,1500);
/* ---------- safety net: errors never leave a blank screen ---------- */
window.addEventListener("unhandledrejection",e=>{console.warn("unhandled",e.reason)});
window.addEventListener("error",e=>{console.warn("error",e.message);try{if(!document.getElementById("view").innerHTML.trim())render()}catch(_){}});
/* ---------- start ---------- */
applyStatic();
window.CACHEOK=loadCache();
render();
/* back within 20 minutes: also the same place on the page (the copy on the device is shown, current data follows in the background) */
if(window.__VSY&&window.CACHEOK)requestAnimationFrame(()=>{try{window.scrollTo(0,window.__VSY)}catch(_){}});
(async()=>{
  const b=$("#refresh");b.hidden=false;
  b.addEventListener("click",async()=>{
    if(b.classList.contains("spin"))return;b.classList.add("spin");
    try{setSCRIPT(null);MEMO.clear();
      if(await load(true)){const c=lastCheck(S.meta);render();showMsg(L("Neueste Daten geladen.")+(c?" "+L("Dropbox zuletzt geprüft")+" "+fmtStamp(c)+".":"")+(window.AUTOUPD!==false?" "+L("Die Daten werden jede Stunde automatisch aus der Dropbox geladen."):""),7000)}
      else showMsg(L("Bitte zuerst anmelden."),5000)}
    catch(err){console.error(err);showMsg(isOffline(err)&&S.days.length?L("Offline – du siehst den zuletzt geladenen Stand."):loadErr(err),6000)}
    setTimeout(()=>b.classList.remove("spin"),400);
  });
  applyLangs();
  if(!S.loaded&&!S.days.length)showGate("wait");
  loadLangs();
  try{
    const {A,auth}=await fb();
    await A.setPersistence(auth,A.browserLocalPersistence).catch(()=>{});
    A.getRedirectResult(auth).catch(err=>{console.error(err);showGate("login",errText(err),true)});
    if(typeof A.isSignInWithEmailLink==="function"&&A.isSignInWithEmailLink(auth,location.href)){
      const q=new URLSearchParams(location.search);let em=q.get("em")||"";try{em=em||localStorage.getItem("emailForSignIn")||""}catch(_){}
      if(!em)em=(prompt(L("Bitte bestätige deine E-Mail-Adresse:"))||"").trim();
      if(em){window.__justSignedIn=true;if(window.resetViewState)window.resetViewState();A.signInWithEmailLink(auth,em,location.href).then(()=>history.replaceState(history.state,"",location.pathname)).catch(err=>{console.error(err);showGate("login",errText(err),true)})}
    }
    /* someone who was signed in on this device: a first empty auth state right after the start (slow storage on some phones)
       is not taken as «signed out» – wait a few seconds for the stored sign-in before showing the login */
    const T0=Date.now();let waitedIn=false;
    A.onAuthStateChanged(auth,u=>{
      if(u){try{localStorage.setItem("wasin","1")}catch(_){}}
      if(!u&&!waitedIn&&Date.now()-T0<8000){let was=false;try{was=localStorage.getItem("wasin")==="1"}catch(_){}
        if(was){waitedIn=true;if(!S.days.length)showGate("wait");setTimeout(()=>{if(!auth.currentUser){try{if(!SBXFRAME)localStorage.removeItem("wasin")}catch(_){}signedOut()}},6000);return}}
      if(!u){signedOut();return}
      afterSignIn(u);
    });
  }catch(err){console.error(err);if(!S.days.length)showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true);else{hideGate();showMsg(L("Offline – du siehst den zuletzt geladenen Stand."),6000)}}
  /* back online after starting without connection: start sign-in again */
  /* back online: after an offline start (or the sign-in screen shown for lack of network) the whole start again – settings, check, data */
  window.addEventListener("online",()=>{if(!FB&&!FBP)location.reload();else if(ME){const g=document.getElementById("gate");if(window.__OFFSTART||(g&&!g.hidden)){window.__OFFSTART=false;afterSignIn(ME)}else tick()}});
  let lastTick=0;
  const tick=async(e)=>{
    if(document.visibilityState!=="visible"||!ME||!(ME.emailVerified||START))return;
    /* back to the app: at most every 3 minutes (switching apps all day used up the free Firebase quota) */
    if(e&&e.type==="visibilitychange"&&Date.now()-lastTick<180e3)return;lastTick=Date.now();
    /* «Ansicht als …»: the check would put back the admin's own rights in the middle of the simulation – only the data */
    if((typeof SIMUSER!=="undefined"&&SIMUSER)||(typeof SIMROLE!=="undefined"&&SIMROLE)){load(false).catch(()=>{});return}
    try{const st=await checkMember();if(st==="stale"||(SBXFRAME&&st!=="ok"))return;if(st!=="ok"){clearLocal();render();showGate(st==="blocked"?"blocked":st==="revoked"?"login":"denied");return}}catch(_){return}
    load(false).catch(()=>{});
  };
  setInterval(tick,POLL_MS);
  document.addEventListener("visibilitychange",tick);
})();

/* Hindi (हिन्दी): texts of the app; missing ones fall back to English. Main topics and titles are translated only in Hindi */
/* signed out (also: no stored sign-in any more at the start, e.g. account blocked or deleted): everything of the person leaves this device */
function signedOut(){
  /* a side-box frame: the page itself decides about signing out – the frame only waits for the sign-in of the page (never clears the device) */
  if(SBXFRAME){setME(null);if(!signedOut.w){signedOut.w=setTimeout(()=>{signedOut.w=0;location.reload()},15000)}return}
  /* the session ended from outside (password changed elsewhere, revoked): its push reminders leave this device too */
  if(ME&&window.pushSignOut)try{Promise.resolve(window.pushSignOut()).catch(()=>{})}catch(_){}
  setME(null);setMYPERMS([]);{const w=document.getElementById("welcome");if(w)w.remove();setWELCOME_OPEN(false)}acctButton(false);clearLocal();if(window.resetViewState)window.resetViewState();if(S.tab==="admin"||S.tab==="acct")S.tab="plan";render();
  /* the sign-in screen may already be open (person switched to «create account» while Firebase was starting): keep it and what was typed */
  const g=document.getElementById("gate");if(g&&!g.hidden&&["login","register","reset"].includes(AUTHMODE)&&g.querySelector("form"))return;
  showGate("login")}
