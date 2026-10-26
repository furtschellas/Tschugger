import {a2hsDo,isIOS,isStandalone,showA2hs} from "../a2hs.js";
import {$,applyStatic,dlgBtn,esc,fullName,getTheme,L,LANG,mkDialog,S,saveBtn,setLANG,setTheme,WDS} from "../base/10-core.js";
import {VIEWS,myTabOrder,tabOrder,tabsOn,vok} from "../base/14-render.js";
import {render} from "../base/15-script-tab.js";
import {store} from "../base/16-interaction.js";
import {showMsg} from "../base/20-data-start.js";
import {fmtD} from "./01-config.js";
import {APPLANGS,FB,ME,MEMBER,MYROLE,can,canAdm,clean,crewPerson,dietSel,fb,intolBoxes,isAdmin,isOwner,langSel,lc,normDiet,readBoxes,setME,setMEMBER,setMYPERMS} from "./03-core-firebase.js";
import {checkRequests,clearLocal,errText,sendMailSafe,showGate} from "./05-membership-signin.js";
import {PREFOK,savePrefsSoon} from "./06-prefs-docs.js";
import {pushSec} from "./07-push.js";
import {TOUR,a2stCheck,chatSec,tourInfo,tourStart} from "./08-chat-tour.js";
import {WELCOME_OPEN,crewNames,maybeWelcome,setWELCOME_OPEN} from "./10-menus-welcome-presence.js";
import {ADM,confirmSafe,writeOwnBday} from "./12a-admin-core.js";
import {offAuto} from "./14-today-changes-offline.js";
import {todayCfg,todayOn,tShow} from "./16-today-view.js";
import {SIMUSER} from "./22-simulate.js";
import {fsGet} from "./23-mobile.js";
/* ---- account sheet: own password, own email, sign out; admin entry ---- */
export function acctButton(on){
  let b=document.getElementById("acctBtn");
  if(!b){b=document.createElement("button");b.id="acctBtn";b.className="refresh";b.type="button";
    b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>';
    const r=$("#refresh");r.parentNode.insertBefore(b,r);b.addEventListener("click",showAcct)}
  b.setAttribute("aria-label",L("Mein Konto"));b.title=L("Mein Konto");b.hidden=!on;try{if(window.repButton)repButton()}catch(_){}
  /* gear (admins): App-Verwaltung, between account and refresh */
  let g=document.getElementById("admBtn");
  if(!g){g=document.createElement("button");g.id="admBtn";g.className="refresh";g.type="button";
    g.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span class="reqdot" aria-hidden="true"></span>';
    const r=$("#refresh");r.parentNode.insertBefore(g,r);g.addEventListener("click",()=>{S.tab="admin";S.srcOpen=false;window.scrollTo(0,0);render()})}
  g.setAttribute("aria-label",L("App-Verwaltung"));g.title=L("App-Verwaltung");g.hidden=!(on&&canAdm());
  {const r=$("#refresh");if(r)r.classList.toggle("admhide",!!(on&&(isOwner()||can("settings"))))} /* admins find «Aktualisieren» in App-Verwaltung → Einstellungen */
  if(on&&can("users.requests"))checkRequests();
}
const isPwUser=()=>!!(ME&&(ME.providerData||[]).some(p=>p.providerId==='password'));
export let ONBOARD=false;
/* phone + contact e-mail (required); prefilled from the crew list / sign-in address */
export function contactFields(m,pre){const cp=(typeof crewPerson==="function"&&ME&&crewPerson(lc(ME.email)))||{};pre=pre||"";
  return '<label>'+L("Telefon")+'<input type="tel" name="'+pre+'ph" autocomplete="tel" inputmode="tel" required placeholder="+41 79 123 45 67" value="'+esc((m&&m.phone)||(!pre&&cp.phone)||"")+'"></label>'+
    '<label>'+L("E-Mail")+'<input type="email" name="'+pre+'ce" autocomplete="email" required value="'+esc((m&&m.contactEmail)||(!pre&&ME&&ME.email)||(m&&m.email)||"")+'"></label>';}
/* function (job): from the crew list when listed there, otherwise the person enters it in the profile (members.func) */
function funcField(){const cp=(typeof crewPerson==="function"&&ME&&crewPerson(lc(ME.email)))||{};
  if(cp.role)return '<div class="pname pfunc"><span>'+L("Funktion")+'</span><b>'+esc(cp.role)+'</b></div>';
  return '<label>'+L("Funktion")+'<input type="text" name="fu" maxlength="80" autocomplete="organization-title" placeholder="'+esc(L("z. B. Kamera-Assistenz"))+'" value="'+esc((MEMBER&&MEMBER.func)||"")+'"></label>'}
function nameFields(){
  const cn=crewNames();
  if(cn)return '<div class="pname"><span>'+L("Vorname")+'</span><b>'+esc(cn.firstName)+'</b><span>'+L("Nachname")+'</span><b>'+esc(cn.lastName||"–")+'</b></div><p class="ghint">'+L("Aus der Crewliste übernommen.")+'</p>';
  return '<label>'+L("Vorname")+'<input type="text" name="fn" autocomplete="given-name" required value="'+esc((MEMBER&&MEMBER.firstName)||"")+'"></label><label>'+L("Nachname")+'<input type="text" name="ln" autocomplete="family-name" required value="'+esc((MEMBER&&MEMBER.lastName)||"")+'"></label>';
}
export const GENDERS=[["m","Männlich"],["w","Weiblich"],["d","Divers"]];
export const genderSel=(n,v,req)=>'<select name="'+n+'"'+(req?' required':'')+'><option value="">–</option>'+GENDERS.map(([k,t])=>'<option value="'+k+'"'+(v===k?' selected':'')+'>'+L(t)+'</option>').join("")+'</select>';
function profileForm(onb){
  return '<form data-af="pf" novalidate>'+nameFields()+funcField()+contactFields(MEMBER)+'<label>'+L("Sprache der App")+langSel("lg",(MEMBER&&MEMBER.lang)||LANG)+'</label><label>'+L("Geburtsdatum (optional)")+'<input type="date" name="bd" autocomplete="bday" value="'+esc((MEMBER&&MEMBER.birthday)||"")+'"></label><label>'+L("Geschlecht")+genderSel("gd",(MEMBER&&MEMBER.gender)||"",true)+'</label><fieldset class="efood"><legend>'+L("Essen")+'</legend><label>'+L("Ernährung")+dietSel("dt",(MEMBER&&MEMBER.diet)?normDiet(MEMBER).diet:"",true)+'</label><label class="full">'+L("Verträglichkeiten")+'</label>'+intolBoxes("pint",normDiet(MEMBER).intol)+'<label class="full">'+L("Weitere Allergien (optional)")+'<input type="text" name="al" maxlength="200" value="'+esc((MEMBER&&MEMBER.allergies)||"")+'"></label><p class="ghint">'+L("Nur für die Produktion sichtbar.")+'</p></fieldset>'+
    /* «Mein Drehtag» on Today: also here in the profile (same setting as Mein Konto › App) */
    (typeof todayOn==="function"&&todayOn()&&todayCfg("mine")!=="no"?'<label class="ck"><input type="checkbox" data-todaypart="mine"'+(tShow("mine")?' checked':'')+'> '+L("«Mein Drehtag» auf Today anzeigen")+'</label>':'')+
    ''+saveBtn()+'<p class="amsg" role="alert"></p></form>';
}
function acctInnerAll(){
  return '<div class="myhead"><h2 class="pgt">'+L("Mein Konto")+'</h2><button type="button" class="pillbtn" data-ac="signout">'+L("Abmelden")+'</button></div><p class="acwho">'+L("Angemeldet als")+' <b>'+esc(ME.email)+'</b>'+' · '+L("Rolle")+': <b>'+esc(isOwner()?L("Owner"):isAdmin()?L("Admin"):MYROLE?(MYROLE==="crew"?"Crew":MYROLE):L("keine"))+'</b>'+(()=>{let w=(MEMBER&&MEMBER.welcomeAck)||"";if(!w)try{w=(localStorage.getItem("welcomeAck")||"").split("|")[0]}catch(_){}return w?' · '+L("Willkommen bestätigt")+' '+esc(fmtD(w)):''})()+'</p>'+
    (MEMBER||isAdmin()?'<section class="psec"><h4>'+L("Profil")+'</h4>'+profileForm(false)+'</section>':'')+
    (ME&&window.PUSHEN!==false?pushSec():'')+'<section class="psec"><h4>'+L("App-Icon und App installieren")+'</h4>'+(()=>{a2stCheck();const st=window.A2ST&&window.A2ST.v;
      /* installed: only «App deinstallieren» (instructions – a web app cannot remove itself); not installed: only «Als App installieren» */
      const un='<button type="button" class="pillbtn" data-ac="a2un">'+L("App deinstallieren")+'</button> ';
      if(st==="standalone")return '<p class="ghint pok">✓ '+L("Du nutzt die App bereits als installierte App.")+'</p>'+un;
      if(st==="installed")return '<p class="ghint pok">✓ '+L("Die App ist auf diesem Gerät installiert.")+'</p>'+un;
      return '<p class="ghint">'+(st==="missing"?'<b>'+L("Die App ist auf diesem Gerät nicht installiert.")+'</b> ':!st?L("Prüfe, ob die App installiert ist …")+' ':'')+L("Installiere die Crew-App auf dem Startbildschirm oder Desktop – dann öffnet sie sich wie eine normale App.")+'</p><button type="button" class="pillbtn" data-ac="a2hs">'+L("Als App installieren")+'</button> '})()+'<button type="button" class="pillbtn" data-ac="a2hs" data-more="1">+ '+L("Weiteres Icon erstellen")+'</button>'+'</section>'+iconSec()+(window.scWaSec?window.scWaSec():'')+'<section class="psec"><h4>'+L("Offline-Daten")+'</h4><label class="ck"><input type="checkbox" data-offauto'+(offAuto()?' checked':'')+'> '+L("Offline-Daten immer automatisch laden")+'</label><p class="ghint">'+L("Blocking-PDFs und Floorplans aller Drehtage werden auf diesem Gerät gespeichert (keine Fotos). Ausgeschaltet nur auf Knopfdruck in «Today».")+'</p><button type="button" class="pillbtn" data-offprep>'+L("Jetzt für offline laden")+'</button></section>'+'<section class="psec"><h4>'+L("Startseite «Today»")+'</h4><label class="ck"><input type="checkbox" data-todayon'+(todayOn()?' checked':'')+'> '+L("«Today» anzeigen und die App dort öffnen")+'</label><p class="ghint">'+L("Ausgeschaltet öffnet die App mit dem Drehplan.")+'</p>'+(window.todayPartsHTML?window.todayPartsHTML():'')+'</section>'+(window.TOUREN?'<section class="psec"><h4>'+L("Einführungstour")+'</h4><p class="ghint">'+esc(tourInfo(MEMBER)||L("Tour offen"))+(MEMBER&&MEMBER.tourAt?' · '+esc(fmtD(MEMBER.tourAt)):'')+'</p><button type="button" class="pillbtn" data-ac="tour">'+L("Tour starten")+'</button></section>':'')+(typeof chatSec==="function"?chatSec():'')+'<section class="psec"><h4>'+L("Sprache")+'</h4><div class="thm lngset" role="group" aria-label="'+esc(L("Sprache"))+'">'+(typeof APPLANGS!=="undefined"?APPLANGS:["de","fr","it","en"]).map(l=>'<button type="button" data-lang="'+l+'" aria-pressed="'+(LANG===l)+'">'+({de:"Deutsch",fr:"Français",it:"Italiano",en:"English",hi:"हिन्दी"}[l]||l.toUpperCase())+'</button>').join("")+'</div></section>'+'<section class="psec"><h4>'+L("Darstellung")+'</h4><div class="thm" role="group" aria-label="'+L("Darstellung")+'"><button type="button" data-ac="theme" data-thset="dark" aria-pressed="'+(getTheme()==="dark")+'">☾ '+L("Dunkel")+'</button><button type="button" data-ac="theme" data-thset="light" aria-pressed="'+(getTheme()==="light")+'">☀ '+L("Hell")+'</button></div><div class="thm fsz" role="group" aria-label="'+L("Schriftgrösse")+'"><button type="button" data-fsset="n" aria-pressed="'+((typeof fsGet==="function"?fsGet():"n")!=="l")+'"><span style="font-size:13px">Aa</span> '+L("Normal")+'</button><button type="button" data-fsset="l" aria-pressed="'+((typeof fsGet==="function"?fsGet():"n")==="l")+'"><span style="font-size:17px">Aa</span> '+L("Gross")+'</button></div></section>'+
    (isPwUser()?'':'<p class="ghint">'+L("Du bist mit Google angemeldet. Passwort und Adresse verwaltest du in deinem Google-Konto.")+'</p>')+(!isPwUser()?'':'<details><summary>'+L("Passwort ändern")+'</summary><form data-af="pw"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neues Passwort")+'<input type="password" name="pw" autocomplete="new-password" minlength="8" required></label><label>'+L("Passwort wiederholen")+'<input type="password" name="pw2" autocomplete="new-password" minlength="8" required></label>'+saveBtn()+'<p class="amsg" role="alert"></p><button type="button" class="glink" data-ac="pwreset">'+L("Passwort vergessen?")+'</button></form></details>'+
    '<details><summary>'+L("E-Mail-Adresse ändern")+'</summary><form data-af="em"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neue E-Mail-Adresse")+'<input type="email" name="em" autocomplete="email" required></label>'+saveBtn()+'<p class="amsg" role="alert"></p></form></details>')+
    '<details><summary>'+L("Auf allen Geräten abmelden")+'</summary><p class="ghint">'+esc(L("Zum Beispiel wenn ein Handy verloren ging: jede Anmeldung bis jetzt endet, auch diese. Danach meldest du dich neu an."))+'</p><button type="button" class="pillbtn" data-ac="signall">'+esc(L("Auf allen Geräten abmelden"))+'</button></details>'+
    navOrderSec()+(typeof window.sbxSec==="function"?window.sbxSec():"")+aboutHTML();
}
/* Mein Konto → App: my own order of the navigation below (▲ ▼), back to the order of the App-Verwaltung */
const NAVT={today:"Today",plan:"Schedule",dispo:"Callsheet",loc:"Locations",crew:"Crew",script:"Script",info:"Info"};
function navOrderSec(){if(window.MYNAV===false)return"";let t=[];try{t=tabsOn()}catch(_){}if(t.length<2)return"";const own=!!myTabOrder();
  return '<section class="psec"><h4>'+L("Navigation")+'</h4><p class="ghint">'+L("Reihenfolge der Bereiche unten in der App (auf diesem Gerät). Mit ▲ ▼ verschieben.")+'</p><div class="tbord">'+
    t.map((k,i)=>'<div class="tbrow"><span>'+esc(L(NAVT[k]||k))+'</span><span class="tbmv"><button type="button" data-mynav="'+k+'|up"'+(i?'':' disabled')+' aria-label="'+esc(L("Nach oben"))+'">▲</button><button type="button" data-mynav="'+k+'|down"'+(i<t.length-1?'':' disabled')+' aria-label="'+esc(L("Nach unten"))+'">▼</button></span></div>').join("")+'</div>'+
    (own?'<div class="arb"><button type="button" class="pillbtn" data-mynavreset>'+L("Auf Standard zurücksetzen")+'</button></div>':'')+'</section>'}
document.addEventListener("click",e=>{const r=e.target.closest&&e.target.closest("[data-mynavreset]");if(r){try{localStorage.removeItem("mytaborder")}catch(_){}render();return}
  const b=e.target.closest&&e.target.closest("[data-mynav]");if(!b)return;e.preventDefault();const [k,d]=b.dataset.mynav.split("|");
  const vis=tabsOn(),i=vis.indexOf(k),j=d==="up"?i-1:i+1;if(i<0||j<0||j>=vis.length)return;[vis[i],vis[j]]=[vis[j],vis[i]];
  const all=tabOrder(),rest=all.filter(x=>!vis.includes(x));try{localStorage.setItem("mytaborder",JSON.stringify(vis.concat(rest)))}catch(_){}render()});
/* «Mein Konto» in groups like the app management: Profil (with password/e-mail) · Essen · Benachrichtigungen · App */
const ACSUBS=[["pro","Profil"],["food","Essen"],["app","App"],["note","Push"]];   /* App before Push */
export let ACSUB="pro";try{ACSUB=localStorage.getItem("acsub")||"pro"}catch(_){}
function acctInner(){
  const raw=acctInnerAll();const box=document.createElement("div");box.innerHTML=raw;
  const grp={};ACSUBS.forEach(([k])=>grp[k]=[]);
  const head=[];
  const tit=el=>{const h=el.querySelector(":scope>h4");return h?h.textContent.trim():""};
  const map=new Map([[L("Sprache"),"app"],[L("Profil"),"pro"],[L("Startseite «Today»"),"app"],[L("Offline-Daten"),"app"],[L("App-Icon und App installieren"),"app"],[L("Einführungstour"),"app"],[L("Darstellung"),"app"],[L("Assistent"),"app"]]);
  [...box.children].forEach(el=>{
    if(el.classList.contains("myhead")||el.classList.contains("acwho")){head.push(el.outerHTML);return}
    if(el.matches("section.psec")){const g=el.classList.contains("pushsec")?"note":(map.get(tit(el))||"app");grp[g].push(el.outerHTML);return}
    grp.pro.push(el.outerHTML)});  /* password / e-mail change belong to the profile */
  /* «Essen» is the food part of the same profile form (one form, so saving keeps working): shown alone in its own group */
  const prof=box.querySelector('section.psec form[data-af="pf"]');
  if(prof){const sec=prof.closest("section.psec");const i=grp.pro.indexOf(sec.outerHTML);
    const pro=sec.cloneNode(true);pro.classList.add("no-food");if(i>=0)grp.pro[i]=pro.outerHTML;
    const food=sec.cloneNode(true);food.classList.add("only-food");const h=food.querySelector(":scope>h4");if(h)h.textContent=L("Essen");grp.food.push(food.outerHTML)}
  /* order inside «App»: Darstellung first, App-Icon last */
  {const rank=h=>h.includes('<h4>'+L("Darstellung")+'</h4>')?0:h.includes('<h4>'+L("Sprache")+'</h4>')?0.5:h.includes('<h4>'+L("Einführungstour")+'</h4>')?0.6:h.includes('<h4>'+L("App-Icon und App installieren")+'</h4>')?2:h.includes('<h4>'+L("App-Symbol erneuern")+'</h4>')?2.1:1;grp.app=grp.app.map((h,i)=>[rank(h),i,h]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x[2])}
  const subs=ACSUBS.filter(([k])=>grp[k].length);if(!subs.some(([k])=>k===ACSUB))ACSUB=subs.length?subs[0][0]:"pro";
  const nav='<nav class="asub acsub n'+subs.length+'" role="tablist">'+subs.map(([k,t])=>'<button type="button" role="tab" data-acsub="'+k+'" aria-selected="'+(ACSUB===k)+'">'+esc(L(t))+'</button>').join("")+'</nav>';
  /* who is signed in: always shown, above the groups */
  return head.filter(h=>/myhead/.test(h)).join("")+nav+head.filter(h=>/acwho/.test(h)).join("")+grp[ACSUB].join("");
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-acsub]");if(!b)return;ACSUB=b.dataset.acsub;try{localStorage.setItem("acsub",ACSUB)}catch(_){}render();scrollTo(0,0)});
/* «Mein Konto» is its own page; only the first-start profile (onboarding) stays a dialog */
VIEWS.acct=function(){if(ME)setTimeout(()=>{const v=document.getElementById("view");if(v&&S.tab==="acct")markNeed(v)},0);return ME?'<section class="mypage acpage">'+acctInner()+'</section>':'<div class="empty">'+L("Kein Zugang")+'</div>'};
let ACCTWIRED=false;setTimeout(()=>wireAcctPage(),0);
function wireAcctPage(){if(ACCTWIRED)return;ACCTWIRED=true;
  document.addEventListener("click",e=>{if(e.target.closest(".acpage"))onAcctClick(e)});
  document.addEventListener("submit",e=>{if(e.target.closest(".acpage"))onAcctSubmit(e)})}
/* required profile fields that are still empty get a pink outline right away; it disappears as soon as they are filled in */
function markNeed(root){const f=root.querySelector('form[data-af="pf"]');if(!f)return;
  const upd=()=>f.querySelectorAll("input[required],select[required]").forEach(el=>el.classList.toggle("need",!String(el.value||"").trim()));
  upd();if(!f.dataset.need){f.dataset.need="1";f.addEventListener("input",upd);f.addEventListener("change",upd)}}
export function showAcct(needProfile){
  ONBOARD=needProfile===true&&!!MEMBER;
  if(ONBOARD){
    let s=document.getElementById("acct");
    if(!s){s=mkDialog("acct");document.body.appendChild(s);
      s.addEventListener("click",onAcctClick);s.addEventListener("submit",onAcctSubmit)}
    s.innerHTML='<div class="a2box acbox"><h3>'+L("Willkommen!")+'</h3><p>'+L("Bitte fülle vor dem ersten Start dein Profil aus.")+'</p><p class="ghint">'+esc(ME.email)+'</p>'+profileForm(true)+'<div class="a2b"><button class="lnk" data-ac="signout">'+L("Abmelden")+'</button></div></div>';s.hidden=false;markNeed(s);return}
  ACSUB="pro";   /* «Mein Konto» always opens on the profile */
  wireAcctPage();S.tab="acct";S.srcOpen=false;window.scrollTo(0,0);render();
}
async function onAcctClick(e){
  const s=document.getElementById("acct")||{};if(e.target===s){if(!ONBOARD)s.hidden=true;return}
  const b=e.target.closest("[data-ac]");if(!b)return;
  if(b.dataset.ac==="close")s.hidden=true;
  else if(b.dataset.ac==="theme")setTheme(b.dataset.thset);
  else if(b.dataset.ac==="tour")tourStart(true);   /* first the choice: short or detailed tour */
  else if(b.dataset.ac==="a2hs"&&typeof a2hsDo==="function"){a2hsDo(!!b.dataset.more).then(done=>{if(!done)showA2hs(true)})}
  else if(b.dataset.ac==="a2un")a2Uninstall();
  else if(b.dataset.ac==="pwreset"){const msg=b.closest("form").querySelector(".amsg");msg.className="amsg";msg.textContent="";b.disabled=true;
    try{const {A,auth}=await fb();await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),auth.currentUser.email);msg.classList.add("ok");msg.textContent=L("Link zum Zurücksetzen gesendet an")+" "+auth.currentUser.email+". "+L("Schau auch im Spam-Ordner nach.")}
    catch(err){console.error(err);msg.textContent=errText(err)}b.disabled=false}
  else if(b.dataset.ac==="admin"){s.hidden=true;S.tab="admin";window.scrollTo(0,0);render()}
  else if(b.dataset.ac==="signout"){b.disabled=true;s.hidden=true;await window.acctSignOut()}
  /* every device of this person (also this one): signed in before now = signed out (rules) */
  else if(b.dataset.ac==="signall"){if(!confirmSafe(L("Auf allen Geräten abmelden – auch auf diesem? Danach meldest du dich neu an.")))return;b.disabled=true;
    try{const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),{rev:F.serverTimestamp()});s.hidden=true;await window.acctSignOut(true)}catch(err){b.disabled=false;showMsg(errText(err),5000)}}
}
async function onAcctSubmit(e){
  e.preventDefault();const f=e.target,msg=f.querySelector(".amsg"),btn=f.querySelector("button[type=submit]")||f.querySelector("button");msg.className="amsg";msg.textContent="";
  /* own check of the required fields with a clear message (the browser's own hint is easy to miss on phones) */
  if(f.dataset.af==="pf"){const miss=[];f.querySelectorAll(".miss").forEach(x=>x.classList.remove("miss"));
    f.querySelectorAll("input[required],select[required]").forEach(el=>{const v=String(el.value||"").trim();const bad=!v||(el.type==="email"&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))||(el.type==="tel"&&v.replace(/\D/g,"").length<6);
      if(bad){el.classList.add("miss");const lb=el.closest("label");miss.push(lb?lb.childNodes[0].textContent.trim():el.name)}});
    if(miss.length){msg.textContent=L("Bitte ausfüllen:")+" "+miss.join(", ");const first=f.querySelector(".miss");if(first){first.scrollIntoView({block:"center"});try{first.focus()}catch(_){}}return}}
  btn.disabled=true;
  try{
    const {A,auth,F,db}=await fb();const u=auth.currentUser;
    if(f.dataset.af==="pf"){
      const cn=crewNames();
      let PARTIAL=false;
      const upd={firstName:cn?cn.firstName:clean(f.fn.value),lastName:cn?cn.lastName:clean(f.ln.value),lang:f.lg.value,birthday:f.bd.value||"",gender:f.gd?f.gd.value:"",diet:f.dt.value,intol:readBoxes(f,"pint"),allergies:String(f.al.value||"").trim().slice(0,200)};if(f.fu)upd.func=String(f.fu.value||"").trim().slice(0,80);
      upd.name=fullName(upd);
      const ct={phone:String(f.ph.value||"").trim().slice(0,40),contactEmail:lc(String(f.ce.value||"").trim()).slice(0,120)};   /* in contacts/{uid}, not in members */
      const ref=F.doc(db,"members",u.uid);
      const wr=()=>MEMBER?F.updateDoc(ref,upd):F.setDoc(ref,Object.assign({active:true,email:lc(u.email),joinedAt:F.serverTimestamp()},upd));
      try{await wr()}catch(err){if(!/permission/.test(err&&err.code||""))throw err;await u.reload().catch(()=>{});await u.getIdToken(true);
        try{await wr()}catch(e2){if(!/permission/.test(e2&&e2.code||"")||!("gender" in upd))throw e2;delete upd.gender;delete upd.func;await wr();PARTIAL=true}} /* until the Firestore rules allow «gender», save the rest */
      /* phone and e-mail: in contacts (members only as long as the rules do not know contacts yet) */
      try{await F.setDoc(F.doc(db,"contacts",u.uid),ct);if(MEMBER&&("phone" in MEMBER||"contactEmail" in MEMBER))F.updateDoc(ref,{phone:F.deleteField(),contactEmail:F.deleteField()}).catch(()=>{})}
      catch(err){if(!/permission/.test(err&&err.code||""))throw err;PARTIAL=true}   /* never into members (catering and birthdays read those) */
      setMEMBER(Object.assign({},MEMBER||{active:true,email:lc(u.email)},upd,ct));
      writeOwnBday(upd.name,upd.birthday);
      if(isAdmin())ADM.loaded=false;
      if(upd.lang!==LANG&&WDS[upd.lang]){setLANG(upd.lang);store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
      if(PARTIAL){try{localStorage.setItem("profPartial:"+u.uid,String(Date.now()))}catch(_){}console.warn("profile: gender/phone/e-mail not saved – Firestore rules not published yet");showMsg(L("Profil gespeichert. Geschlecht, Telefon und E-Mail konnten noch nicht gespeichert werden – die Produktion muss die neuen App-Regeln aktivieren."),9000)}
      if(ONBOARD){ONBOARD=false;document.getElementById("acct").hidden=true;setTimeout(maybeWelcome,300);if(!PARTIAL)showMsg(L("Profil gespeichert."),3000);btn.disabled=false;return}
      msg.classList.add("ok");msg.textContent=L("Profil gespeichert.");btn.disabled=false;return;
    }
    await A.reauthenticateWithCredential(u,A.EmailAuthProvider.credential(u.email,f.cur.value)).catch(err=>{throw /invalid-credential|wrong-password/.test(err.code||"")?{code:"x",message:L("Aktuelles Passwort falsch.")}:err});
    if(f.dataset.af==="pw"){
      if(f.pw.value.length<8)throw {code:"weak-password"};
      if(f.pw.value!==f.pw2.value)throw {code:"x",message:L("Die Passwörter stimmen nicht überein.")};
      await A.updatePassword(u,f.pw.value);msg.classList.add("ok");msg.textContent=L("Passwort geändert.");f.reset();
    }else{
      /* role and admin rights belong to the address: with a new address they are gone until the production gives them again */
      if((isAdmin()||MYROLE)&&lc(f.em.value.trim())!==lc(u.email)){let ok=true;try{ok=window.confirm(L("Deine Rolle und Rechte gehören zur bisherigen E-Mail-Adresse. Nach der Änderung muss die Produktion sie dir neu geben. Trotzdem ändern?"))}catch(_){}if(!ok){btn.disabled=false;return}}
      await A.verifyBeforeUpdateEmail(u,f.em.value.trim(),{url:location.origin+location.pathname});msg.classList.add("ok");msg.textContent=L("Bestätigungslink an die neue Adresse gesendet. Die Änderung gilt, sobald du ihn antippst.");f.reset();
    }
  }catch(err){console.error(err);msg.textContent=(err&&err.code==="x"?err.message:(/email-already-in-use/.test(err.code||"")?L("Diese Adresse wird schon verwendet."):errText(err)))+(err&&err.code&&err.code!=="x"?" ["+err.code+"]":"")}
  btn.disabled=false;
}

/* «App deinstallieren»: how to remove the installed app on this device (the browser does not let a web app remove itself) */
/* sign out on this device (also after «Auf allen Geräten abmelden»): straight to the sign-in screen */
window.acctSignOut=async quiet=>{S.tab="plan";store("tab","plan");
  try{const {A,auth}=await fb();if(window.pushSignOut)await window.pushSignOut();await A.signOut(auth)}catch(err){console.error(err)}try{localStorage.setItem("fsclear","1");localStorage.removeItem("wasin")}catch(_){}
  setME(null);setMYPERMS([]);{const w=document.getElementById("welcome");if(w)w.remove();setWELCOME_OPEN(false);if(TOUR.el){TOUR.el.remove();TOUR.el=null}}acctButton(false);clearLocal();if(window.resetViewState)window.resetViewState();render();showGate("login");
  if(quiet)showMsg(L("Auf allen Geräten abgemeldet – bitte neu anmelden."),6000)};
function a2Uninstall(){let d=document.getElementById("a2un");if(d)d.remove();
  const ua=navigator.userAgent,ios=typeof isIOS==="function"&&isIOS(),and=/android/i.test(ua),mac=/macintosh/i.test(ua)&&!ios,edge=/edg\//i.test(ua),saf=/safari/i.test(ua)&&!/chrome|chromium|edg\//i.test(ua);
  const st=ios?["Halte das App-Icon auf dem Home-Bildschirm gedrückt.","Tippe auf «App entfernen».","Wähle «Vom Home-Bildschirm entfernen»."]:
    and?["Halte das App-Icon auf dem Startbildschirm gedrückt.","Tippe auf «Deinstallieren» (oder «App-Info» → «Deinstallieren»)."]:
    mac&&saf?["Öffne im Finder den Ordner «Programme» (bzw. «~/Programme»).","Ziehe «Tschugger Tigerblood» in den Papierkorb."]:
    ["Öffne die installierte App.","Klicke oben rechts auf das Menü (⋮ bzw. …).",edge?"Wähle «Deinstallieren».":"Wähle «Tschugger Tigerblood deinstallieren»."];
  d=mkDialog("a2un");
  d.innerHTML='<div class="a2box"><h3>'+esc(L("App deinstallieren"))+'</h3><ol class="a2ol">'+st.map(x=>'<li>'+esc(L(x))+'</li>').join("")+'</ol>'+
    '<p class="ghint">'+esc(L("Dein Konto und deine Einstellungen bleiben erhalten – du kannst die App jederzeit im Browser öffnen oder wieder installieren."))+'</p><div class="a2b">'+dlgBtn("pri",'data-a2unok',"OK")+'</div></div>';
  d.addEventListener("click",e=>{if(e.target===d||e.target.closest("[data-a2unok]")){d.remove();try{localStorage.removeItem("a2hs:v1")}catch(_){}window.A2ST=null;render()}});
  document.body.appendChild(d)}

/* the app is installed but opened in the browser: point to the installed app once per session
   (a web page cannot switch to the installed app itself; links and push messages open it where the browser supports it) */
setTimeout(async()=>{try{if(typeof isStandalone==="function"&&isStandalone())return;if(sessionStorage.getItem("instHint"))return;
  if(typeof window.a2hsCheck!=="function"||await window.a2hsCheck()!=="installed")return;sessionStorage.setItem("instHint","1");
  if(typeof showMsg==="function")showMsg(L("Die App ist auf diesem Gerät installiert – öffne sie am besten über das App-Icon."),7000)}catch(_){}},4000);
/* «Über die App» (Mein Konto → App): the same versions as on the start screen and the copyright */
function aboutHTML(){const m=S.meta||{};
  return '<section class="psec about"><h4>'+L("Über die App")+'</h4><p class="abv">'+(m.scheduleVersion?esc(m.scheduleVersion)+'<br>':'')+(m.scriptVersion&&vok("script")?esc(L("Drehbuch"))+' '+esc(m.scriptVersion)+'<br>':'')+'App '+esc(window.APPVER||"")+'<br>© <b class="mrk">MrK</b> 2026</p></section>'}

/* ---------- «App-Symbol erneuern»: phones keep the icon of the day the app was added (the first «TT» logo until 16.10.) ----------
   Mein Konto → App: the steps for this device and the switch «Hinweis beim Öffnen zeigen» (iconhint: ""/"on" = show once, "seen", "off"; synced in prefs) */
const ICONSTEPS=()=>typeof isIOS==="function"&&isIOS()?["Halte das App-Icon auf dem Home-Bildschirm gedrückt → «App entfernen» → «Vom Home-Bildschirm entfernen».","Öffne die App in Safari → Teilen → «Zum Home-Bildschirm».","Deine Anmeldung und deine Einstellungen bleiben erhalten."]:
  ["Android und Computer übernehmen das neue Logo von selbst (manchmal erst nach ein paar Tagen).","Sofort: die App deinstallieren und über «Als App installieren» neu installieren."];
const iconHint=()=>{try{return localStorage.getItem("iconhint")||""}catch(_){return ""}};
function iconSec(){const on=iconHint()!=="off";
  return '<section class="psec"><h4>'+L("App-Symbol erneuern")+'</h4><p class="ghint">'+esc(L("Siehst du auf dem Home-Bildschirm oder in Push-Nachrichten noch das alte Logo (TT)? Das Handy hat das Symbol beim Hinzufügen gespeichert. So kommt das neue Logo:"))+'</p>'+
    '<ol class="a2ol">'+ICONSTEPS().map(x=>'<li>'+esc(L(x))+'</li>').join("")+'</ol>'+
    '<label class="ck"><input type="checkbox" data-iconhint'+(on?' checked':'')+'> '+esc(L("Hinweis beim Öffnen zeigen (iPhone, einmal)"))+'</label></section>'}
document.addEventListener("change",e=>{const c=e.target.closest&&e.target.closest("[data-iconhint]");if(!c)return;store("iconhint",c.checked?"on":"off");if(typeof savePrefsSoon==="function"){try{localStorage.setItem("prefsLocalAt",String(Date.now()))}catch(_){}savePrefsSoon()}});
/* once on an iPhone that opens the installed app (only there the old icon can stay), after the other start notes */
{let shown=false;const iv=setInterval(()=>{if(shown){clearInterval(iv);return}
  if(typeof ME==="undefined"||!ME||typeof PREFOK==="undefined"||!PREFOK)return;
  if(!(typeof isIOS==="function"&&isIOS()&&typeof isStandalone==="function"&&isStandalone())||iconHint()==="seen"||iconHint()==="off"){clearInterval(iv);return}
  if(document.querySelector(".a2hs,#welcome,#twelcome,#csbeta,#tour")||(typeof WELCOME_OPEN!=="undefined"&&WELCOME_OPEN)||(typeof SIMUSER!=="undefined"&&SIMUSER))return;
  shown=true;clearInterval(iv);const d=mkDialog("iconhint");
  d.innerHTML='<div class="a2box"><h3>'+esc(L("Neues App-Logo"))+'</h3><p>'+esc(L("Siehst du auf dem Home-Bildschirm oder in Push-Nachrichten noch das alte Logo (TT)? Das Handy hat das Symbol beim Hinzufügen gespeichert. So kommt das neue Logo:"))+'</p><ol class="a2ol">'+ICONSTEPS().map(x=>'<li>'+esc(L(x))+'</li>').join("")+'</ol>'+
    '<p class="ghint">'+esc(L("Diesen Hinweis kannst du unter Mein Konto → App wieder einschalten."))+'</p><div class="a2b">'+dlgBtn("pri",'data-ihok',"Verstanden")+'</div></div>';
  d.addEventListener("click",e=>{if(e.target===d||e.target.closest("[data-ihok]")){d.remove();store("iconhint","seen");try{localStorage.setItem("prefsLocalAt",String(Date.now()))}catch(_){}if(typeof savePrefsSoon==="function")savePrefsSoon()}});
  document.body.appendChild(d)},3000)}
export function setACSUB(v){return ACSUB=v}   /* other parts change ACSUB only through this */
