import {isIOS,isStandalone} from "../a2hs.js";
import {$,applyStatic,dlgBtn,esc,fullName,L,LANG,MEMO,mkDialog,S,setLANG} from "../base/10-core.js";
import {render} from "../base/15-script-tab.js";
import {store} from "../base/16-interaction.js";
import {setSCRIPT} from "../base/17-scene-reader.js";
import {CACHE_KEY,showMsg} from "../base/20-data-start.js";
import {ADMINS,fmtT} from "./01-config.js";
import {ADMINPERMS,ADMIN_DEFAULT,COADMIN,FB,INTOL,ME,MEMBER,MYPERMS,MYROLE,PENDING_KEY,PERMS,applyLangs,can,clean,fb,isAdmin,isOwner,lc,meOk,permKnown,permLbl,setADMINPERMS,setCOADMIN,setDATAKEY,setLASTSTAMP,setMEMBER,setMYPERMS,setMYROLE,splitName,withTimeout} from "./03-core-firebase.js";
import {AREAKEYS,isOffline} from "./04-data.js";
import {PREFKEYS,PREFT,PREFX,mailto,savePrefs,setPREFOK,setPREFT} from "./06-prefs-docs.js";
import {CHAT} from "./08-chat-tour.js";
import {MENUSUB,afterSignIn,setMENUSUB,setSTART} from "./10-menus-welcome-presence.js";
import {ADM} from "./12a-admin-core.js";
import {OWN,OWNSUB,setOWNSUB} from "./18-own-events.js";
import {ACKSUB,setACKFROM,setACKSUB} from "./24-flow.js";
import {REDSUB,setREDSUB} from "./25-ride-edit.js";
import {SCSUB,setSCSUB} from "./27-scene-ack.js";
import {CDSUBS,setCDSUBS} from "./29-coverday.js";
/* ---- membership: invited addresses join once (members/{uid}); blocked = active:false ---- */
/* the result is kept on this device: an offline start keeps the role (otherwise crew lost the shooting schedule without network) */
const memKey=()=>"mc:v1:"+(ME&&ME.uid);
function memSave(){try{localStorage.setItem(memKey(),JSON.stringify({r:MYROLE,rn:window.MYROLENAME||"",p:MYPERMS,a:COADMIN,ap:ADMINPERMS,o:ADMINS.includes(lc(ME.email)),m:MEMBER}))}catch(_){}}
function memRestore(){try{const c=JSON.parse(localStorage.getItem(memKey())||"null");if(!c)return false;setMYROLE(c.r||"");window.MYROLENAME=c.rn||"";setMYPERMS(Array.isArray(c.p)?c.p:[]);setCOADMIN(!!c.a);if(Array.isArray(c.ap))setADMINPERMS(c.ap);if(c.m)setMEMBER(c.m);if(c.o&&!ADMINS.includes(lc(ME.email)))ADMINS.push(lc(ME.email));return true}catch(_){return false}}
export async function checkMember(){
  if(navigator.onLine===false){memRestore();throw Object.assign(new Error("offline"),{code:"unavailable"})}
  let prev=null;try{prev=JSON.parse(localStorage.getItem(memKey())||"null")}catch(_){}
  const u=ME,was=String(MYPERMS)+"|"+MYROLE+"|"+isAdmin();
  try{const st=await checkMember0();if(st==="ok"&&ME===u){roleChanged(prev);memSave()}
    /* other rights: the area keys are read again (a key refused before may be allowed now, and the other way round) */
    if(was!==String(MYPERMS)+"|"+MYROLE+"|"+isAdmin())for(const k in AREAKEYS)delete AREAKEYS[k];
    return st}
  catch(err){if(isOffline(err))memRestore();throw err}
}
/* a read refused by the rules means «not given»; any other error (network, timeout) stops the check – the caller keeps the last known rights instead of starting with none */
const notPerm=e=>{if(!/permission/i.test((e&&e.code||"")+" "+(e&&e.message||"")))throw e};
async function checkMember0(){
  const {F,db}=await fb();const u=ME;
  if(!isOwner()&&meOk()){try{if((await F.getDoc(F.doc(db,"owners",lc(u.email)))).exists()&&!ADMINS.includes(lc(u.email)))ADMINS.push(lc(u.email))}catch(e){notPerm(e)}}
  if(!isOwner()&&meOk()){try{setCOADMIN((await F.getDoc(F.doc(db,"admins",lc(u.email)))).exists())}catch(e){setCOADMIN(false);notPerm(e)}}
  setMYPERMS([]);setMYROLE("");window.MYROLENAME="";setADMINPERMS(ADMIN_DEFAULT.slice());
  if(COADMIN){try{const ad=await F.getDoc(F.doc(db,"roles","admin"));if(ad.exists())setADMINPERMS((ad.data().perms||[]).filter(p=>permKnown(p)))}catch(_){}}
  if(!isAdmin()){try{const ur=await F.getDoc(F.doc(db,"userroles",lc(u.email)));if(ur.exists()){setMYROLE(String(ur.data().role||""));const rd=MYROLE?await F.getDoc(F.doc(db,"roles",MYROLE)):null;if(rd&&rd.exists())window.MYROLENAME=String(rd.data().name||""),setMYPERMS((rd.data().perms||[]).filter(p=>permKnown(p)))}}catch(e){notPerm(e)}
  }
  const ref=F.doc(db,"members",u.uid);let s=await withTimeout(F.getDoc(ref),20000,"member");
  if(!s.exists()){
    let inv=null;try{inv=await F.getDoc(F.doc(db,"invites",lc(u.email)))}catch(_){}
    if(!inv||!inv.exists()){if(isAdmin()){setMEMBER(null);return "ok"}return "none"}
    let pf={};try{const x=JSON.parse(localStorage.getItem(PENDING_KEY)||"null");if(x&&x.email===lc(u.email))pf=x}catch(_){}
    const doc={active:true,email:lc(u.email),name:fullName(pf)||inv.data().name||"",joinedAt:F.serverTimestamp()};
    for(const k of ["firstName","lastName","lang","birthday","gender","diet","allergies"])if(pf[k])doc[k]=pf[k];
    if(Array.isArray(pf.intol)&&pf.intol.length)doc.intol=pf.intol.filter(k=>INTOL.some(x=>x[0]===k));
    if(!doc.firstName&&!doc.lastName){const sp=splitName(inv.data().name);if(sp.firstName){doc.firstName=clean(sp.firstName);if(sp.lastName)doc.lastName=clean(sp.lastName)}}
    await F.setDoc(ref,doc);try{localStorage.removeItem(PENDING_KEY)}catch(_){}
    s=await F.getDoc(ref);
  }
  const m=s.data();if(m.active!==true)return ADMINS.includes(lc(u.email))?"ok":"blocked";   /* blocked: also admins (the rules refuse them too); only the fixed owner stays */
  /* «Auf allen Geräten abmelden»: a sign-in from before that moment is ended here (the rules refuse it anyway) */
  if(m.rev&&typeof m.rev.toMillis==="function"){try{const t=await u.getIdTokenResult();if(Date.parse(t.authTime)<=m.rev.toMillis()){if(window.acctSignOut)await window.acctSignOut(true);return "revoked"}}catch(_){}}
  if(m.email!==lc(u.email))F.updateDoc(ref,{email:lc(u.email)}).catch(()=>{});
  setMEMBER(m);return "ok";
}
export function clearLocal(){try{if(typeof OWNSUB!=="undefined"&&OWNSUB){OWNSUB();setOWNSUB(null)}if(typeof MENUSUB!=="undefined"&&MENUSUB){MENUSUB();setMENUSUB(null)}}catch(_){}try{if(typeof CDSUBS!=="undefined"&&CDSUBS){CDSUBS();setCDSUBS(null)}window.CDOPS=[];window.CDAT=0}catch(_){}try{if(typeof SCSUB!=="undefined"&&SCSUB){SCSUB();setSCSUB(null)}}catch(_){}try{if(typeof REDSUB!=="undefined"&&REDSUB){if(typeof REDSUB==="function")REDSUB();setREDSUB(null)}}catch(_){}try{if(window.cmaStop)window.cmaStop()}catch(_){}try{if(typeof ACKSUB!=="undefined"&&ACKSUB){if(typeof ACKSUB==="function")ACKSUB();setACKSUB(null);setACKFROM("");window.RIDEACK={}}}catch(_){}try{if(typeof OWN!=="undefined")OWN.list=null;window.MENUS={};for(const k of ["ownev:v1","menus","snap:v1","chg:v1"])localStorage.removeItem(k)}catch(_){}try{sessionStorage.removeItem("chatmsgs");if(typeof CHAT!=="undefined")CHAT.msgs=[];if(window.caches)caches.delete("crew-vc").catch(()=>{})}catch(_){}try{for(const k of Object.keys(localStorage))if(k.startsWith("mc:v1:"))localStorage.removeItem(k);localStorage.removeItem("dk:v1");localStorage.removeItem("ak:script");localStorage.removeItem("ak:contacts");if(typeof AREAKEYS!=="undefined")for(const k in AREAKEYS)delete AREAKEYS[k];localStorage.removeItem(CACHE_KEY);localStorage.removeItem("dstamp:v1");localStorage.removeItem("scriptcache");localStorage.removeItem("scriptenc")}catch(_){}
  /* the settings and seen notices of the person signing out stay off this device: on a shared set laptop the next person got the welcome note skipped
     and a newer «prefsLocalAt» made the device overwrite the next person's settings online (the colour theme stays: it belongs to the device) */
  try{if(typeof PREFKEYS!=="undefined"){clearTimeout(PREFT);setPREFT(null);setPREFOK(false);for(const k of PREFKEYS.concat(PREFX))if(k!=="theme")localStorage.removeItem(k)}for(const k of ["prefsLocalAt","testAck"])localStorage.removeItem(k)}catch(_){}try{if(window.simReset)window.simReset()}catch(_){}try{if(window.startNotesReset)window.startNotesReset()}catch(_){}
  /* the Firebase offline copy (also secret/key) is deleted at the next start; crew-only links and the local reminder marks go now */
  try{localStorage.setItem("fsclear","1");for(const k of Object.keys(localStorage))if(k.startsWith("pushlocal:"))localStorage.removeItem(k);localStorage.removeItem("appmap");window.PRIVOK=false}catch(_){}
  S.days=[];S.days0=null;S.dispos0=null;S.crew=[];S.locs=[];S.places=[];S.dispos=[];S.prepro=[];S.meta=null;S.loaded=false;MEMO.clear();setDATAKEY(null);setMEMBER(null);setLASTSTAMP(null);setSCRIPT(null);setCOADMIN(false);ADM.loaded=false;ADM.mem=[];ADM.inv=[];ADM.adm=[]}
/* ---- sign-in screen ---- */
export let AUTHMODE="login";
export const errText=e=>{const c=(e&&e.code)||"";
  if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c))return L("E-Mail oder Passwort falsch.");
  if(/email-already-in-use/.test(c))return L("Für diese Adresse gibt es schon ein Konto. Bitte anmelden.");
  if(/invalid-email/.test(c))return L("Ungültige E-Mail-Adresse.");
  if(/weak-password/.test(c))return L("Mindestens 8 Zeichen.");
  if(/too-many-requests/.test(c))return L("Zu viele Versuche. Bitte kurz warten.");
  if(/requires-recent-login/.test(c))return L("Aktuelles Passwort falsch.");
  if(/network/.test(c))return L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen.");
  return (e&&e.message)||String(e)};
function gateEl(){
  let g=document.getElementById("gate");
  if(!g){g=document.createElement("div");g.id="gate";g.className="gate";document.body.appendChild(g);
    /* an unexpected error in a sign-in step: shown in the form instead of a silent dead button */
    const safe=f=>e=>{f(e).catch(err=>{console.error(err);try{gateMsg(errText(err),true)}catch(_){}})};
    g.addEventListener("submit",safe(onGateSubmit));
    g.addEventListener("click",safe(onGateClick));}
  return g;
}
/* Google sign-in only for a Gmail address: shown below the e-mail field as soon as it holds …@gmail.com / …@googlemail.com */
const isGmail=v=>/@(gmail|googlemail)\.com\s*$/i.test(String(v||""));
function ggUpd(){const w=document.querySelector("[data-gglw]"),i=document.getElementById("gem");if(w)w.hidden=!(i&&isGmail(i.value))}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="gem")ggUpd()});
function GBTN(){if(window.GOOGLEON===false||(isIOS()&&isStandalone()))return '';return '<div data-gglw hidden><div class="gor"><span>'+L("oder")+'</span></div><button type="button" class="gbtn ggoogle" data-gact="google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'+L("Mit Google anmelden")+'</button></div>'}
export function showGate(mode,msg,isErr){
  AUTHMODE=mode||AUTHMODE;const g=gateEl();
  const em=ME?esc(ME.email):(g.querySelector("#gem")?esc(g.querySelector("#gem").value):"");
  const head=(n=>{const i=n.indexOf(" ");return '<h2>'+(i>0?esc(n.slice(0,i))+' <span>'+esc(n.slice(i+1))+'</span>':esc(n))+'</h2>'})(window.PROJNAME?projName():"Tschugger Tigerblood");
  const langs='<div class="lang glang"><button type="button" data-glang="de">DE</button><button type="button" data-glang="fr">FR</button><button type="button" data-glang="it">IT</button><button type="button" data-glang="en">EN</button><button type="button" data-glang="hi">HI</button></div>';
  const note=msg?'<p class="'+(isErr?'gerr':'gok')+'" role="alert">'+esc(msg)+'</p>':'<p class="gerr" role="alert"></p>';
  let f="";
  if(AUTHMODE==="login")f='<form class="gbox" data-f="login">'+head+'<p class="ghint">'+L("Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die auf der Crewliste steht – diese ist bereits freigeschaltet.")+'</p>'+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><label for="gpw">'+L("Passwort")+'</label><input id="gpw" type="password" autocomplete="current-password" required>'+'<button type="submit">'+L("Anmelden")+'</button>'+GBTN()+note+'<button type="button" class="glink" data-gmode="reset">'+L("Passwort vergessen?")+'</button><button type="button" class="glink" data-gmode="register">'+L("Erstes Mal hier? Konto erstellen")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="register")f='<form class="gbox" data-f="register">'+head+'<p class="ghint">'+L("Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die auf der Crewliste steht – diese ist bereits freigeschaltet.")+'</p>'+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><label for="gpw">'+L("Passwort")+'</label><input id="gpw" type="password" autocomplete="new-password" minlength="8" required><label for="gpw2">'+L("Passwort wiederholen")+'</label><input id="gpw2" type="password" autocomplete="new-password" minlength="8" required>'+'<p class="ghint">'+L("Mindestens 8 Zeichen.")+'</p><button type="submit">'+L("Konto erstellen")+'</button>'+GBTN()+note+'<button type="button" class="glink" data-gmode="login">'+L("Schon ein Konto? Anmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="newpw")f='<form class="gbox" data-f="newpw">'+head+'<p class="gtitle">'+L("Bitte lege jetzt dein eigenes Passwort fest.")+'</p><p class="ghint">'+L("Du hast dich mit einem Startpasswort angemeldet. Es gilt nur einmal.")+'</p><p class="ghint"><b>'+em+'</b></p><label for="gpw">'+L("Neues Passwort (mind. 8 Zeichen)")+'</label><input id="gpw" type="password" autocomplete="new-password" minlength="8" required><label for="gpw2">'+L("Neues Passwort wiederholen")+'</label><input id="gpw2" type="password" autocomplete="new-password" minlength="8" required><button type="submit">'+L("Passwort speichern")+'</button>'+note+'<button type="button" class="glink" data-gact="signout">'+L("Abmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="reset")f='<form class="gbox" data-f="reset">'+head+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><button type="submit">'+L("Link zum Zurücksetzen senden")+'</button>'+note+'<button type="button" class="glink" data-gmode="login">'+L("Zurück")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="verify")f='<form class="gbox" data-f="verify">'+head+'<p class="gtitle">'+L("Bitte bestätige zuerst deine E-Mail-Adresse.")+'</p><p class="ghint">'+L("Wir haben dir eine Mail mit einem Bestätigungslink geschickt. Tippe auf den Link und komm dann hierher zurück.")+'</p><p class="ghint"><b>'+em+'</b></p>'+vmStatus()+'<p class="ghint gtip">'+L("Absender: noreply@tschugger-83692.firebaseapp.com – bitte auch im Spam- bzw. Junk-Ordner nachsehen und die Mail als «Kein Spam» markieren.")+'</p><button type="submit">'+L("Ich habe bestätigt")+'</button>'+note+'<button type="button" class="glink" data-gact="resend">'+L("Mail nochmals senden")+'</button>'+(GBTN()?'<p class="ghint">'+L("Gmail-Adresse? Dann geht es ohne Bestätigungs-Mail:")+'</p>'+GBTN():'')+'<button type="button" class="glink" data-gact="signout">'+L("Abmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="denied"||AUTHMODE==="blocked")f='<div class="gbox">'+head+'<p class="gtitle">'+L("Kein Zugang")+'</p><p class="ghint">'+(AUTHMODE==="blocked"?L("Dein Zugang wurde gesperrt. Bitte melde dich bei der Produktion."):L("Diese E-Mail-Adresse ist nicht für die Crew-App freigeschaltet."))+'</p><p class="ghint"><b>'+em+'</b></p>'+(AUTHMODE==="blocked"?'':'<p class="ghint gtip">'+L("Bitte melde dich ab und wieder an – mit der E-Mail-Adresse, die auf der Crewliste steht. Diese ist bereits freigeschaltet. Bei Google: das Google-Konto mit dieser Adresse wählen. Stimmt die Adresse auf der Crewliste nicht, melde dich bei der Produktion.")+'</p>'+reqBox())+'<button type="button" class="gbtn" data-gact="signout">'+L("Abmelden und mit Crewliste-Adresse anmelden")+'</button><button type="button" class="glink" data-gact="retry">'+L("Aktualisieren")+'</button>'+langs+'</div>';
  else if(AUTHMODE==="wait")f='<div class="gbox">'+head+'<p class="ghint">'+L("Bitte warten …")+'</p></div>';
  verifyPoll(AUTHMODE==="verify");
  /* drawn again (e.g. settings arrived): what was typed and whether the password is shown stay */
  const keepV={};g.querySelectorAll("input[id]").forEach(i=>{if(i.value)keepV[i.id]=[i.value,i.type]});
  g.innerHTML=f;for(const id in keepV){const i=g.querySelector("#"+CSS.escape(id));if(i&&!i.value){i.value=keepV[id][0]}}ggUpd();applyLangs();g.querySelectorAll("[data-glang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.glang===LANG));
  g.hidden=false;document.body.style.overflow="hidden";
  const first=g.querySelector("input:not([value]),input[value='']")||g.querySelector("#gpw");if(first&&AUTHMODE!=="wait")setTimeout(()=>first.focus(),50);
}
let VERIFYT=null;
function verifyPoll(on){clearInterval(VERIFYT);VERIFYT=null;if(!on)return;
  VERIFYT=setInterval(async()=>{try{const {auth}=await fb();const u=auth.currentUser;if(!u){verifyPoll(false);return}
    await u.reload();if(auth.currentUser.emailVerified){verifyPoll(false);await auth.currentUser.getIdToken(true);afterSignIn(auth.currentUser);return}
    if((VERIFYN=(VERIFYN||0)+1)%3===0&&await startExists(u)){verifyPoll(false);afterSignIn(auth.currentUser)}}catch(_){}},5000)}
let VERIFYN=0;
async function startExists(u){try{const {F,db}=await fb();return (await F.getDoc(F.doc(db,"starts",lc(u.email)))).exists()}catch(_){return false}}
export function hideGate(){verifyPoll(false);const g=document.getElementById("gate");if(g){g.hidden=true;g.innerHTML=""}document.body.style.overflow=""}
function gateMsg(t,isErr){const p=document.querySelector("#gate .gerr,#gate .gok");if(p){p.className=isErr?"gerr":"gok";p.textContent=t}}
async function onGateSubmit(e){
  e.preventDefault();const f=e.target;const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;gateMsg("",true);
  try{
    const {A,auth}=await fb();const em=f.querySelector("#gem")?f.querySelector("#gem").value.trim():"";const pw=f.querySelector("#gpw")?f.querySelector("#gpw").value:"";
    if(f.dataset.f==="login"){window.__justSignedIn=true;if(window.resetViewState)window.resetViewState();await A.signInWithEmailAndPassword(auth,em,pw)}
    else if(f.dataset.f==="register"){
      if(pw.length<8)throw {code:"weak-password"};
      if(pw!==f.querySelector("#gpw2").value){gateMsg(L("Die Passwörter stimmen nicht überein."),true);if(btn)btn.disabled=false;return}
      window.__justSignedIn=true;if(window.resetViewState)window.resetViewState();const c=await A.createUserWithEmailAndPassword(auth,em,pw);
      await sendVerify(c.user)
    }
    else if(f.dataset.f==="reset"){try{await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),em)}catch(err){if(!/user-not-found/.test(err.code||""))throw err}gateMsg(L("Wenn es für diese Adresse ein Konto gibt, kommt gleich eine Mail zum Zurücksetzen."),false)}
    else if(f.dataset.f==="newpw"){
      if(pw.length<8)throw {code:"weak-password"};
      if(pw!==f.querySelector("#gpw2").value){gateMsg(L("Die Passwörter stimmen nicht überein."),true);if(btn)btn.disabled=false;return}
      const {F,db}=await fb();await A.updatePassword(auth.currentUser,pw);
      await F.updateDoc(F.doc(db,"starts",lc(auth.currentUser.email)),{mustChange:false});setSTART({mustChange:false});
      showMsg(L("Passwort gespeichert."),3000);await afterSignIn(auth.currentUser)}
    else if(f.dataset.f==="verify"){await ME.reload();if(auth.currentUser.emailVerified){await ME.getIdToken(true);await afterSignIn(auth.currentUser)}else if(await startExists(auth.currentUser))await afterSignIn(auth.currentUser);else gateMsg(L("Noch nicht bestätigt. Schau auch im Spam-Ordner nach."),true)}
  }catch(err){console.error(err);gateMsg(errText(err),true)}
  if(btn)btn.disabled=false;
}
/* ---- access request: someone not on the list asks the main admin for access ---- */
let REQ={sent:false,err:""};
function reqBox(){
  if(REQ.sent)return '<p class="gok">'+L("Anfrage gesendet. Du bekommst Zugang, sobald die Produktion sie freigibt – du erhältst dann eine E-Mail, oder tippe hier auf «Aktualisieren».")+'</p>';
  return '<details class="greq"><summary>'+L("Zugang bei der Produktion anfragen")+'</summary>'+
    '<label for="rqn">'+L("Vor- und Nachname")+'</label><input id="rqn" maxlength="80" autocomplete="name">'+
    '<label for="rqf">'+L("Funktion / Department")+'</label><input id="rqf" maxlength="80">'+
    '<label for="rqt">'+L("Nachricht (optional)")+'</label><textarea id="rqt" maxlength="280" rows="2"></textarea>'+
    '<button type="button" class="gbtn" data-gact="request">'+L("Anfrage senden")+'</button>'+(REQ.err?'<p class="gerr">'+esc(REQ.err)+'</p>':'')+'</details>';
}
/* after approval: Firebase sends the person an e-mail with a one-tap sign-in link (needs "E-Mail-Link" sign-in enabled in Firebase);
   if that is not possible, a prepared e-mail opens in the admin's mail app */
export async function notifyApproved(em,q){
  const url=location.origin+location.pathname+"?approved=1&em="+encodeURIComponent(em);
  try{
    const {A,auth}=await fb();if(typeof A.sendSignInLinkToEmail!=="function")throw new Error("no email link");
    const keep=auth.languageCode;auth.languageCode=LANG;
    try{await A.sendSignInLinkToEmail(auth,em,{url,handleCodeInApp:true})}finally{auth.languageCode=keep||LANG}
    showMsg(L("E-Mail mit Anmelde-Link gesendet an")+" "+em,6000);return true;
  }catch(err){
    console.warn("mail link",err&&err.code||err);
    location.href=mailto(em,"approved",{vorname:String((q&&q.name)||"").split(/\s+/)[0],name:(q&&q.name)||""});
    return false;
  }
}
/* check again every 5 minutes and when the app comes back to the foreground */
setInterval(()=>{if(ME&&can("users.requests")&&document.visibilityState==="visible")checkRequests()},300000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&ME&&can("users.requests"))checkRequests()});
export async function checkRequests(){
  try{const {F,db}=await fb();let n=0;   /* only the number: one read instead of all requests (Firebase quota) */
    if(typeof F.getCountFromServer==="function"){try{n=(await F.getCountFromServer(F.collection(db,"requests"))).data().count||0}catch(_){const r=await F.getDocs(F.collection(db,"requests"));n=r.size||r.docs.length}}
    else{const r=await F.getDocs(F.collection(db,"requests"));n=r.size||r.docs.length}
    const b=document.getElementById("admBtn");if(b){b.classList.toggle("hasreq",n>0);b.dataset.n=n||"";b.setAttribute("aria-label",L("App-Verwaltung")+(n?" · "+n+" "+L(n===1?"offene Zugangsanfrage – siehe App-Verwaltung.":"offene Zugangsanfragen – siehe App-Verwaltung."):""))}
    if(n&&!checkRequests.told){checkRequests.told=true;showMsg(n+" "+L(n===1?"offene Zugangsanfrage – siehe App-Verwaltung.":"offene Zugangsanfragen – siehe App-Verwaltung."),7000)}}catch(_){}
}
async function sendRequest(){
  const n=String(($("#rqn")||{}).value||"").trim(),f=String(($("#rqf")||{}).value||"").trim(),t=String(($("#rqt")||{}).value||"").trim();
  if(n.length<3){REQ.err=L("Bitte Vor- und Nachname angeben.");showGate(AUTHMODE);return}
  try{const {F,db,auth}=await fb();const em=lc(auth.currentUser&&auth.currentUser.email);if(!em)throw new Error("not signed in");
    await F.setDoc(F.doc(db,"requests",em),{name:n.slice(0,80),role:f.slice(0,80),note:t.slice(0,280),at:F.serverTimestamp()});
    REQ={sent:true,err:""}}catch(err){console.error(err);REQ.err=errText(err)}
  showGate(AUTHMODE);
}
/* Firebase mails (confirmation, password reset): in the app language; if the return link to this site is not
   allowed in Firebase (authorised domains), send the mail without return link instead of failing silently */
/* confirmation mail: status survives gate re-renders; sent automatically when an unconfirmed account
   signs in and no mail went out in the last 10 minutes (accounts from before had never received one) */
const VM={at:0,err:"",busy:false};
function vmKey(u){return "vm:"+(u&&u.uid||"")}
function vmStatus(){
  if(VM.busy)return '<p class="gok">'+L("Mail wird gesendet …")+'</p>';
  if(VM.err)return '<p class="gerr">'+L("Bestätigungs-Mail konnte nicht gesendet werden:")+' '+esc(VM.err)+'</p>';
  if(VM.at)return '<p class="gok">'+L("Mail gesendet um")+' '+fmtT(VM.at)+'.</p>';
  return '';
}
async function sendVerify(u,manual){
  if(!u||VM.busy)return;VM.busy=true;VM.err="";if(AUTHMODE==="verify")showGate("verify");
  try{const {A}=await fb();await sendMailSafe(A.sendEmailVerification,u);VM.at=Date.now();try{localStorage.setItem(vmKey(u),String(VM.at))}catch(_){}}
  catch(err){console.error("verify mail",err);VM.err=/too-many/.test(err&&err.code||"")?L("Zu viele Versuche – bitte in ein paar Minuten nochmals."):errText(err)}
  finally{VM.busy=false;if(AUTHMODE==="verify")showGate("verify")}
}
export function autoVerify(u){
  let last=0;try{last=+localStorage.getItem(vmKey(u))||0}catch(_){}
  if(!VM.at&&last)VM.at=last;
  if(Date.now()-Math.max(last,VM.at)>600000)sendVerify(u);
}
export async function sendMailSafe(fn,target){
  const {auth}=await fb();auth.languageCode=LANG;
  try{return await fn(target,{url:location.origin+location.pathname})}
  catch(err){if(/continue-uri|unauthorized-domain|invalid-dynamic-link|missing-continue/.test(err&&err.code||""))return await fn(target);throw err}
}
async function onGateClick(e){
  const lb=e.target.closest("[data-glang]");if(lb){setLANG(lb.dataset.glang);store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;showGate(AUTHMODE);render();return}
  const m=e.target.closest("[data-gmode]");if(m){showGate(m.dataset.gmode);return}
  const a=e.target.closest("[data-gact]");if(!a)return;
  const {A,auth}=await fb();
  if(a.dataset.gact==="signout"){REQ={sent:false,err:""};if(window.pushSignOut)await window.pushSignOut();await A.signOut(auth);try{localStorage.setItem("fsclear","1");localStorage.removeItem("wasin")}catch(_){}}
  else if(a.dataset.gact==="resend"){a.disabled=true;await sendVerify(auth.currentUser,true);a.disabled=false}
  else if(a.dataset.gact==="retry"){if(auth.currentUser)afterSignIn(auth.currentUser)}
  else if(a.dataset.gact==="request"){a.disabled=true;await sendRequest()}
  else if(a.dataset.gact==="google"){
    const prov=new A.GoogleAuthProvider();prov.setCustomParameters({prompt:"select_account"});window.__justSignedIn=true;
    if(window.resetViewState)window.resetViewState();
    try{if(isStandalone())await A.signInWithRedirect(auth,prov);else await A.signInWithPopup(auth,prov)}
    catch(err){const c=err.code||"";
      if(/popup-blocked|operation-not-supported|web-storage/.test(c)){try{await A.signInWithRedirect(auth,prov)}catch(e2){gateMsg(errText(e2),true)}}
      else if(/popup-closed|cancelled-popup/.test(c))gateMsg(L("Google-Anmeldung abgebrochen."),true);
      else gateMsg(errText(err),true)}
  }
}

/* the role of this person was changed: a short welcome with what is new (and what is gone), once */
function roleChanged(prev){if(!prev||!ME||isOwner())return;   /* the owner keeps all rights: never a message */
  if(!("r" in prev)&&!prev.a)return;   /* nothing known from before (first sign-in on this device): no message */
  const was=prev.a?"admin":(prev.r||""),now=COADMIN?"admin":(MYROLE||"");
  const pp=new Set(prev.a?(prev.ap||[]):(prev.p||[])),np=new Set(now==="admin"?ADMINPERMS:now==="owner"?PERMS.map(x=>x[0]):MYPERMS);
  const add=[...np].filter(k=>!pp.has(k)),rem=[...pp].filter(k=>!np.has(k));if(was===now)return;   /* only when the role itself changed (new rights of the same role: no message) */
  /* only once per change, also across devices: the shown state is kept with the synced settings */
  let h=0;for(const ch of now+":"+[...np].sort().join(","))h=(h*31+ch.charCodeAt(0))|0;const sig=(h>>>0).toString(36);
  let seen="";try{seen=localStorage.getItem("rc")||""}catch(_){}if(seen===sig)return;
  store("rc",sig);savePrefs();setTimeout(()=>showRoleChange(now,add,rem),2500)}
function showRoleChange(role,add,rem){if(document.getElementById("rolechg"))return;
  const lbl=k=>{const x=PERMS.find(p=>p[0]===k);return x?permLbl(k,x[1]):k};
  const rn=role==="owner"?L("Owner"):role==="admin"?L("Admin"):role?((typeof OWN!=="undefined"&&(OWN.roles||[]).find(r=>r.id===role))||{}).name||role.charAt(0).toUpperCase()+role.slice(1):L("Keine Rolle");
  const d=mkDialog("rolechg");
  d.innerHTML='<div class="a2box wlbox"><h3>'+esc(L("Deine Rechte wurden geändert"))+'</h3><p>'+esc(L("Deine Rolle"))+': <b>'+esc(rn)+'</b></p>'+
    (add.length?'<p><b>'+esc(L("Neu für dich"))+':</b> '+esc(add.map(lbl).join(", "))+'</p>':'')+(rem.length?'<p><b>'+esc(L("Nicht mehr"))+':</b> '+esc(rem.map(lbl).join(", "))+'</p>':'')+
    '<div class="a2b">'+dlgBtn("pri",'data-rcok',"OK")+'</div></div>';
  d.addEventListener("click",e=>{if(e.target.closest("[data-rcok]"))d.remove()});
  document.body.appendChild(d);try{render()}catch(_){}}
