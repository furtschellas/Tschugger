/* ---------- new app version: reload once when the published version differs ---------- */
const APP_VER="__APP_VER__";
async function checkVersion(){
  try{const r=await fetch("version.txt?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const v=(await r.text()).trim();
    if(!v||v===APP_VER)return;
    let done="";try{done=sessionStorage.getItem("reloadedFor")||""}catch(_){}
    if(done===v)return;try{sessionStorage.setItem("reloadedFor",v)}catch(_){}
    if(document.querySelector("#acct:not([hidden]) form input:focus,#gate:not([hidden]) input:focus"))return;
    location.reload();
  }catch(_){}
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkVersion()});
setTimeout(checkVersion,1500);
/* ---------- safety net: errors never leave a blank screen ---------- */
window.addEventListener("unhandledrejection",e=>{console.warn("unhandled",e.reason)});
window.addEventListener("error",e=>{console.warn("error",e.message);try{if(!document.getElementById("view").innerHTML.trim())render()}catch(_){}});
/* ---------- start ---------- */
applyStatic();
window.CACHEOK=loadCache();
render();
(async()=>{
  const b=$("#refresh");b.hidden=false;
  b.addEventListener("click",async()=>{
    if(b.classList.contains("spin"))return;b.classList.add("spin");
    try{SCRIPT=null;MEMO.clear();
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
    A.onAuthStateChanged(auth,u=>{
      if(!u){ME=null;MYPERMS=[];{const w=document.getElementById("welcome");if(w)w.remove();WELCOME_OPEN=false}acctButton(false);clearLocal();if(window.resetViewState)window.resetViewState();if(S.tab==="admin"||S.tab==="acct")S.tab="plan";render();
        /* the sign-in screen may already be open (person switched to «create account» while Firebase was starting): keep it and what was typed */
        const g=document.getElementById("gate");if(g&&!g.hidden&&["login","register","reset"].includes(AUTHMODE)&&g.querySelector("form"))return;
        showGate("login");return}
      afterSignIn(u);
    });
  }catch(err){console.error(err);if(!S.days.length)showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true);else{hideGate();showMsg(L("Offline – du siehst den zuletzt geladenen Stand."),6000)}}
  /* back online after starting without connection: start sign-in again */
  window.addEventListener("online",()=>{if(!FB&&!FBP)location.reload();else if(ME)tick()});
  const tick=async()=>{
    if(document.visibilityState!=="visible"||!ME||!(ME.emailVerified||START))return;
    try{const st=await checkMember();if(st!=="ok"){clearLocal();render();showGate(st==="blocked"?"blocked":"denied");return}}catch(_){return}
    load(false).catch(()=>{});
  };
  setInterval(tick,POLL_MS);
  document.addEventListener("visibilitychange",tick);
})();

/* Hindi (हिन्दी): texts of the app; missing ones fall back to English. Main topics and titles are translated only in Hindi */
