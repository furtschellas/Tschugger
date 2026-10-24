import {$,L,LANG,S,ariaTip,blockList,dlgBtn,esc,mkDialog,msHM,pad2,saveBtn,telNum} from "../base/10-core.js";
import {srcHTML} from "../base/13-crew-views.js";
import {VIEWS,tabOrder0} from "../base/14-render.js";
import {render} from "../base/15-script-tab.js";
import {arr,showMsg} from "../base/20-data-start.js";
import {ADMINS,FB_CONFIG,ROOT_OWNERS,fmtD} from "./01-config.js";
import {LANGS} from "./02-i18n.js";
import {ADMIN_DEFAULT,APPLANGS,ME,MYPERMS,can,canAdm,crewPerson,dietSel,dietText,fb,intolBoxes,isAdmin,isOwner,langSel,lc,loadLangs,normDiet,readBoxes} from "./03-core-firebase.js";
import {errText,notifyApproved,sendMailSafe} from "./05-membership-signin.js";
import {docsSec,mailto} from "./06-prefs-docs.js";
import {pushStatusSec} from "./07-push.js";
import {chatSetSec,tourInfo} from "./08-chat-tour.js";
import {isOnline,seenMs,seenText} from "./10-menus-welcome-presence.js";
import {GENDERS,contactFields,genderSel} from "./11-account.js";
import {ADM,SECS,admErr,admIndex,admLoad,assignCrew,confirmSafe,crewEmails,initials,syncBdays} from "./12a-admin-core.js";
import {bkSec,upSec} from "./12b-admin-backup.js";
import {rolesSec,rolesSorted} from "./12d-admin-roles.js";
import {auditSec,testsSec} from "./17-audit-misc.js";
/* ---------- App-Verwaltung (Benutzer:innen und Seite) – part of the former 12-admin.js; loaded only when the App-Verwaltung is opened (admin.js) ---------- */
/* owner only: account with a one-time start password, created in a second Firebase instance so the owner stays signed in */
function genPw(){const c="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789",r=new Uint32Array(12);crypto.getRandomValues(r);
  const x=[...r].map(v=>c[v%c.length]).join("");return x.slice(0,4)+"-"+x.slice(4,8)+"-"+x.slice(8)}
async function createStartAccount(em,nm){
  em=lc(em);const {AP,A,F,db}=await fb();const pw=genPw();
  /* an earlier entry (e.g. «ohne Bestätigungs-Mail» freigeschaltet) is put back if the account exists already – it was deleted and locked the person out */
  let prev=null;try{const d=await F.getDoc(F.doc(db,"starts",em));if(d.exists())prev=d.data()}catch(_){}
  await F.setDoc(F.doc(db,"starts",em),{mustChange:true,at:F.serverTimestamp()});
  if(!ADM.inv.some(i=>i.id===em))await F.setDoc(F.doc(db,"invites",em),{name:String(nm||"").slice(0,80),role:"",addedAt:F.serverTimestamp()});await assignCrew(em);
  const a2=AP.initializeApp(FB_CONFIG,"start"+Date.now());
  try{const au=typeof A.initializeAuth==="function"&&A.inMemoryPersistence?A.initializeAuth(a2,{persistence:A.inMemoryPersistence}):A.getAuth(a2);
    await A.createUserWithEmailAndPassword(au,em,pw);try{await A.signOut(au)}catch(_){}}
  catch(err){try{if(prev)await F.setDoc(F.doc(db,"starts",em),prev);else await F.deleteDoc(F.doc(db,"starts",em))}catch(_){}throw err}
  finally{try{AP.deleteApp&&await AP.deleteApp(a2)}catch(_){}}
  return pw;
}
function showStartPw(em,nm,pw){
  let d=mkDialog("pwbox",null,{replace:true});
  const app=location.origin+location.pathname;
  const body=L("Hallo")+" "+String(nm||"").split(/\s+/)[0]+",\n\n"+L("dein Konto für die Crew-App von TSCHUGGER Tigerblood ist bereit:")+"\n"+app+"\n\n"+L("E-Mail")+": "+em+"\n"+L("Startpasswort")+": "+pw+"\n\n"+L("Beim ersten Anmelden legst du ein eigenes Passwort fest.")+"\n\n"+L("Bis bald am Set!");
  d.innerHTML='<div class="a2box acbox"><h3>'+L("Startpasswort")+'</h3><p>'+esc(nm||em)+'<br><small>'+esc(em)+'</small></p><p class="pwshow">'+esc(pw)+'</p><p class="ahint">'+L("Gilt nur für die erste Anmeldung. Danach muss die Person ein eigenes Passwort festlegen. Das Startpasswort wird nirgends gespeichert – jetzt weitergeben.")+'</p>'+
    '<div class="a2b"><button type="button" data-pw="copy">'+L("Kopieren")+'</button><a class="lnk" href="'+esc(mailto(em,"startpw",{vorname:String(nm||"").split(/\s+/)[0],name:nm||"",passwort:pw}))+'">'+L("Per Mail schicken")+'</a>'+dlgBtn("lnk",'data-pw="close"',"Schliessen")+'</div></div>';
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-pw]");if(e.target===d||(b&&b.dataset.pw==="close")){d.remove();return}
    if(b&&b.dataset.pw==="copy"){try{await navigator.clipboard.writeText(pw);showMsg(L("Kopiert"),2000)}catch(_){showMsg(pw,8000)}}});
  document.body.appendChild(d);
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-pwshow]");if(!b||!isOwner()||!ADM.pw)return;const em=b.dataset.pwshow;const m=ADM.mem.find(x=>x.email===em),i=ADM.inv.find(x=>x.id===em);showStartPw(em,(m&&m.name)||(i&&i.name)||"",ADM.pw[em])});
/* admins: see and change a user's details (registered: profile incl. food; invited: name, role) */
function userInfo(r){
  const m=r.m;if(!m||!(isAdmin()||can("users.view")))return"";
  const g=(GENDERS.find(x=>x[0]===m.gender)||[])[1];const row=(k,v)=>v?'<div class="udl"><span>'+esc(L(k))+'</span><b>'+v+'</b></div>':'';
  return row("Telefon",m.phone?'<a href="tel:'+esc(telNum(m.phone))+'">'+esc(m.phone)+'</a>':"")+
    row("Kontakt-E-Mail",m.contactEmail&&m.contactEmail!==m.email?'<a href="mailto:'+esc(m.contactEmail)+'">'+esc(m.contactEmail)+'</a>':"")+
    row("Geburtsdatum",m.birthday?esc(m.birthday.split("-").reverse().join(".")):"")+row("Geschlecht",g?esc(L(g)):"")+row("Essen",esc(dietText(m)))+
    row("Willkommen",esc(m.welcomeAck?L("bestätigt")+" "+fmtD(m.welcomeAck):L("noch nicht bestätigt")))+
    row("Willkommen Test-User",m.testAck?esc(L("bestätigt")+" "+fmtD(m.testAck)):"");
}
/* «Auf allen Geräten abmelden» for a person (lost phone …): every sign-in until now ends (rules: rev = server time) */
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-signall]");if(!b||!can("users.edit"))return;e.preventDefault();e.stopPropagation();
  if(!confirmSafe(L("{n} auf allen Geräten abmelden? Die Person muss sich danach neu anmelden.").replace("{n}",b.dataset.nm||"")))return;b.disabled=true;
  try{const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",b.dataset.signall),{rev:F.serverTimestamp()});showMsg(L("Auf allen Geräten abgemeldet."),4000)}catch(err){b.disabled=false;showMsg(admErr(err),6000)}},true);
/* role picker (owner): Benutzer:in, Admin or one of the custom roles */
/* the same limits as the rules: without admin rights nobody whose current role has rights one lacks (no demoting a «bigger» person) */
export const rolePermsOf=id=>id==="admin"?(ADM.adminPerms||ADMIN_DEFAULT):arr(((ADM.roles||[]).find(x=>x.id===id)||{}).perms);
const roleMine=id=>!id||id==="crew"&&!(ADM.roles||[]).some(x=>x.id===id)||rolePermsOf(id).every(p=>MYPERMS.includes(p));
export const canRole=e=>!!e&&!ROOT_OWNERS.includes(e)&&!(ME&&lc(ME.email)===e)&&(isOwner()||(isAdmin()&&!ADMINS.includes(e))||(can("roles.assign")&&!ADMINS.includes(e)&&!ADM.adm.includes(e)&&roleMine((ADM.ur||{})[e])));
/* the Admin role and roles holding «Einstellungen» are changed by the owner only (rules: an admin could otherwise give himself «Einstellungen») */
export const roleLocked=id=>!isOwner()&&(id==="admin"||(isAdmin()&&rolePermsOf(id).includes("settings")));
export const roleOf=e=>{if(ADMINS.includes(e))return "owner";if(ADM.adm.includes(e))return "admin";const id=ADM.ur[e];return id&&ADM.roles.some(x=>x.id===id)?id:""};
const roleName=id=>id==="admin"?L("Admin"):((ADM.roles.find(x=>x.id===id)||{}).name||"");
const roleSel=r=>'<label class="rolesel">'+L("Rolle")+' <select data-urole="'+esc(r.email)+'"><option value="">'+L("Keine Rolle (eingeschränkt)")+'</option>'+(isOwner()?'<option value="owner"'+(roleOf(r.email)==="owner"?' selected':'')+'>'+L("Owner")+'</option>':'')+(isAdmin()?'<option value="admin"'+(roleOf(r.email)==="admin"?' selected':'')+'>'+L("Admin")+'</option>':'')+rolesSorted().map(x=>{const mine=roleOf(r.email)===x.id,ok=(isAdmin()||(x.perms||[]).every(p=>MYPERMS.includes(p)))&&(isOwner()||!(x.perms||[]).includes("settings"));/* only roles with one's own rights can be given */return ok||mine?'<option value="'+esc(x.id)+'"'+(mine?' selected':'')+(ok?'':' disabled')+'>'+esc(x.name||x.id)+'</option>':''}).join("")+'</select></label>';
/* Drehblöcke: which blocks this person sees – automatic (crew list) or set by hand */
function blkFields(m){const bl=blockList();if(!bl.length)return "";const man=Array.isArray(m.blk),on=new Set(man?m.blk:[]);
  return '<fieldset class="eblk"><legend>'+L("Drehblöcke")+'</legend><label class="ck"><input type="checkbox" name="bauto"'+(man?'':' checked')+'> '+esc(L("Automatisch (aus der Crewliste)"))+'</label>'+
    '<div class="chk eblks"'+(man?'':' hidden')+'>'+bl.map(b=>'<label class="ck"><input type="checkbox" name="eblk" value="'+esc(b.id)+'"'+(on.has(b.id)?' checked':'')+'> '+esc(b.name||b.id)+(b.country?' · '+esc(b.country):'')+'</label>').join("")+'</div>'+
    '<p class="ghint">'+esc(L("Ohne «Automatisch» sieht die Person nur die angekreuzten Blöcke (Drehtage und Callsheets). Mit «Einstellungen» sieht man immer alle."))+'</p></fieldset>'}
document.addEventListener("change",e=>{const c=e.target.closest&&e.target.closest('input[name="bauto"]');if(!c)return;const f=c.closest("fieldset");const box=f&&f.querySelector(".eblks");if(box)box.hidden=c.checked});
export function editForm(r,withRole){
  const m=r.m,i=ADM.inv.find(x=>x.id===r.email)||{},v=x=>esc(x||"");
  return (window.simBtn?window.simBtn(r.email):'')+(withRole&&canRole(r.email)?'<div class="aerole">'+roleSel(r)+'</div>':'')+'<form class="aedit" data-adm="save" data-em="'+esc(r.email)+'">'+
    (m?'<label>'+L("Vorname")+'<input name="fn" maxlength="60" value="'+v(m.firstName)+'"></label><label>'+L("Nachname")+'<input name="ln" maxlength="60" value="'+v(m.lastName)+'"></label>'+
       '<label>'+L("Funktion")+'<input name="rl" maxlength="80" value="'+v(i.role||r.role||(m&&m.func))+'"></label>'+
       '<label>'+L("Sprache der App")+langSel("lg",m.lang||"de")+'</label><label>'+L("Geburtsdatum (optional)")+'<input type="date" name="bd" value="'+v(m.birthday)+'"></label><label>'+L("Geschlecht (optional)")+genderSel("gd",m.gender||"")+'</label>'+contactFields(m,"e")+
       '<fieldset class="efood"><legend>'+L("Essen")+'</legend><label>'+L("Ernährung")+dietSel("edt",normDiet(m).diet)+'</label><label>'+L("Verträglichkeiten")+'</label>'+intolBoxes("eint",normDiet(m).intol)+'<label>'+L("Weitere Allergien (optional)")+'<input name="eal" maxlength="200" value="'+v(m.allergies)+'"></label></fieldset>'+blkFields(m)
     :'<label>'+L("Name")+'<input name="nm" maxlength="80" value="'+v(i.name||r.name)+'"></label><label>'+L("Funktion")+'<input name="rl" maxlength="80" value="'+v(i.role||r.role)+'"></label>')+
    '<p class="ahint">'+L("Die E-Mail-Adresse kann nicht geändert werden – dafür die Person entfernen und mit der neuen Adresse einladen.")+'</p>'+
    (m&&m.uid&&can("users.edit")&&!(ME&&m.uid===ME.uid)?'<p><button type="button" class="pillbtn" data-signall="'+esc(m.uid)+'" data-nm="'+esc([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||r.email)+'">'+esc(L("Auf allen Geräten abmelden"))+'</button></p>':'')+
    ''+saveBtn()+'</form>';
}
function reqSec(){
  const r=(ADM.req||[]).slice().sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id),LANG));
  return '<div class="admins areq" id="areq"><h3>'+L("Anfragen von Benutzer:innen")+' <span class="ust '+(r.length?'adm':'')+'">'+r.length+'</span></h3>'+
    (ADM.reqErr?'<p class="admerr">'+L("Anfragen nicht lesbar")+' ('+esc(ADM.reqErr)+') – '+L("Firestore-Regeln prüfen.")+'</p>':
     r.length?'<p class="ahint">'+L("Diese Personen sind nicht auf der Liste und bitten um Zugang. «Freischalten» lädt sie ein; sie tippen danach auf «Aktualisieren».")+'</p>':'<p class="ahint">'+L("Keine offenen Anfragen.")+'</p>')+
    r.map(q=>'<div class="arow"><span><b>'+esc(q.name||"")+'</b> · '+esc(q.id)+(q.role?'<br><small>'+esc(q.role)+'</small>':'')+(q.note?'<br><small>«'+esc(q.note)+'»</small>':'')+'</span>'+
      (can("users.requests")?'<button data-adm="reqok" data-em="'+esc(q.id)+'">'+L("Freischalten")+'</button><button data-adm="reqno" data-em="'+esc(q.id)+'">'+L("Ablehnen")+'</button>':'')+'</div>').join("")+'</div>';
}
/* user list: one compact card per person, filter chips with counts, actions folded away */
function userList(rows,vis,o){
  const F=[["all","Alle"],["online","Online"],["act","Aktiv"],["inv","Eingeladen"],["off","Gesperrt"],["adm","Mit Rolle"],["app","App installiert"],["web","Ohne App"]];
  const chips='<div class="ufil" role="group">'+F.filter(([k])=>k==="all"||ADM.cnt[k]).map(([k,t])=>'<button type="button" data-auf="'+k+'" aria-pressed="'+(ADM.uf===k)+'">'+L(t)+' <span>'+ADM.cnt[k]+'</span></button>').join("")+'</div>';
  const card=r=>{
    const own=o.own,isOwn=ADMINS.includes(r.email),cp=crewPerson(r.email)||{},open=ADM.edit===r.email||ADM.open.has(r.email),nm=r.name||cp.name||"";
    const badge=o.isAdm(r.email)?'<span class="ust adm">'+L(isOwn?"Owner":"Admin")+'</span>':(o.roleOf(r.email)?'<span class="ust role">'+esc(o.roleName(o.roleOf(r.email)))+'</span>':'<span class="ust norole">'+esc(L("Keine Rolle"))+'</span>');
    const acts=[
      o.cEd&&(own||!isOwn)?'<button class="cico'+(ADM.edit===r.email?' on':'')+'" data-adm="edit" data-em="'+esc(r.email)+'" '+ariaTip(L(ADM.edit===r.email?"Schliessen":"Bearbeiten"))+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(ADM.edit===r.email?'<path d="M18 6 6 18M6 6l12 12"/>':'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')+'</svg></button>':'',
      own&&r.m?'<button data-adm="pwreset" data-em="'+esc(r.email)+'">'+L("Passwort-Link senden")+'</button>':'',
      own&&!r.m&&!isOwn?'<button data-adm="nomail" data-em="'+esc(r.email)+'">'+L("Ohne Bestätigungs-Mail freischalten")+'</button>':'',
      own&&!r.m&&!isOwn?'<button data-adm="startpw" data-em="'+esc(r.email)+'" data-nm="'+esc(r.name||"")+'">'+L("Startpasswort erzeugen")+'</button>':'',
      !r.m&&o.cInv?'<a class="abtnl" href="'+o.mail(r)+'">✉ '+L("Einladungsmail")+'</a>':'',
      !r.m&&o.cInv?'<button type="button" class="abtnl" data-cwa="'+esc(r.email)+'" data-nm="'+esc(r.name||(crewPerson(r.email)||{}).name||"")+'" data-ph="'+esc((crewPerson(r.email)||{}).phone||"")+'">💬 '+L("Per WhatsApp einladen")+'</button>':'',
      own&&r.m&&!isOwn?(r.m.active===true?'<button class="warn" data-adm="block" data-uid="'+esc(r.m.uid)+'">'+L("Sperren")+'</button>':'<button data-adm="unblock" data-uid="'+esc(r.m.uid)+'">'+L("Entsperren")+'</button>'):'',
      isOwn?'':own&&r.m?'<button class="warn" data-adm="remove" data-uid="'+esc(r.m.uid)+'" data-em="'+esc(r.email)+'">'+L("Entfernen")+'</button>':(r.inv&&!r.m&&o.cInv?'<button class="warn" data-adm="uninvite" data-em="'+esc(r.email)+'">'+L("Einladung löschen")+'</button>':'')
    ].filter(Boolean);
    const hasActs=true;
    /* details (function, contact, language, last online, tour, profile) only in the opened card */
    const det='<div class="udet">'+(cp.role||(r.m&&r.m.func)?'<div class="udl"><span>'+L("Funktion")+'</span><b>'+esc(cp.role||r.m.func)+'</b></div>':'')+
      '<div class="udl"><span>'+L("E-Mail")+'</span><a class="em" href="mailto:'+esc(r.email)+'">'+esc(r.email)+'</a></div>'+
      (r.m&&r.m.lang?'<div class="udl"><span>'+L("Sprache")+'</span><b>'+esc(r.m.lang.toUpperCase())+'</b></div>':'')+
      (r.m&&r.m?'<div class="udl"><span>'+L("Einführungstour")+'</span><b>'+esc(tourInfo(r.m))+'</b></div>':'')+userInfo(r)+'</div>';
    return '<div class="ucard'+(r.m&&r.m.active!==true?' blocked':'')+(open?' open':'')+'">'+
      '<div class="uhd"><span class="uav'+(r.m&&isOnline(r.m)?' on':'')+'" aria-hidden="true">'+esc(initials(nm||r.email))+'</span><div class="umain"><div class="unm"><b>'+esc(nm||r.email)+'</b></div><div class="ubadges">'+o.st(r)+badge+'</div>'+
      (()=>{const ph=(r.m&&r.m.phone)||cp.phone||"",ce=(r.m&&r.m.contactEmail)||r.email;const ak=String(r.m&&r.m.app||""),dv={ios:"iPhone",android:"Android",desktop:"Computer"}[ak.split("-")[1]]||"";
          const DV={ios:"iPhone",android:"Android",desktop:"Computer"},devs=Object.values((r.m&&r.m.devs)||{}).map(x=>String(x).split("|")).filter(x=>Date.now()-(+x[1]||0)<30*864e5);
          const devTxt=devs.length?devs.length+" "+L(devs.length===1?"Gerät":"Geräte"):"",devTip=devs.map(x=>(x[0].startsWith("app-")?"App":"Browser")+" · "+(DV[x[0].split("-")[1]]||"")).join(", ");
          const bits=[r.m&&seenText(r.m)?'<span class="useen'+(isOnline(r.m)?' on':'')+'">'+esc(seenText(r.m))+'</span>':'',ak?'<span class="uapp'+(ak.startsWith("app-")?' on':'')+'" title="'+esc(L("zuletzt genutzt"))+'">'+esc((ak.startsWith("app-")?L("App installiert"):L("im Browser"))+(dv?" · "+dv:""))+'</span>':'',devTxt?'<span class="udev" title="'+esc(devTip)+'">'+esc(devTxt)+'</span>':''].filter(Boolean);
          /* phone and e-mail on a line of their own */
          const con=[ph?'<a href="tel:'+esc(telNum(ph))+'">'+esc(ph)+'</a>':'',ce?'<a href="mailto:'+esc(ce)+'">'+esc(ce)+'</a>':''].filter(Boolean);
          return (bits.length?'<div class="usub">'+bits.join(' · ')+'</div>':'')+(con.length?'<div class="usub ucon">'+con.join(' · ')+'</div>':'')})()+'</div>'+
      (hasActs?'<button type="button" class="umore" data-uact="'+esc(r.email)+'" aria-expanded="'+open+'" '+ariaTip(L("Aktionen"))+'><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>':'')+'</div>'+
      (own&&ADM.pw&&ADM.pw[r.email]?'<div class="pwrow">'+L("Startpasswort")+': <b class="pwshow2">'+esc(ADM.pw[r.email])+'</b> <button type="button" data-pwshow="'+esc(r.email)+'">'+L("Anzeigen")+'</button></div>':'')+
      (open?'<div class="ubody">'+det+(o.cEd&&ADM.edit===r.email?editForm(r,true):'')+(acts.length?'<div class="aacts">'+acts.join("")+'</div>':'')+'</div>':'')+
    '</div>'};
  const SORTS=[["first","Vorname"],["name","Nachname"],["dept","Abteilung"],["status","Status"],["role","Rolle"],["new","Neueste zuerst"],["seen","Zuletzt online"],["email","E-Mail"]];
  const sortSel='<label class="usort">'+L("Sortieren")+' <select data-usort>'+SORTS.map(([k,t])=>'<option value="'+k+'"'+((ADM.sort||"first")===k?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>';
  const onl=rows.filter(r=>r.m&&isOnline(r.m)).map(r=>r.name||(crewPerson(r.email)||{}).name||r.email);
  return '<div class="admins ulist"><h3>'+L("Alle Benutzenden")+' <span class="ust">'+rows.length+'</span></h3>'+

    '<input class="search" id="aq" type="search" placeholder="'+esc(L("Name, E-Mail oder Funktion suchen"))+'" value="'+esc(ADM.q)+'">'+'<div class="ubar">'+chips+sortSel+'<button type="button" class="cico uall" data-uall '+ariaTip(L(vis.length&&vis.every(r=>ADM.open.has(r.email))?"Alle zuklappen":"Alle aufklappen"))+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+(vis.length&&vis.every(r=>ADM.open.has(r.email))?'<path d="m7 11 5-5 5 5M7 18l5-5 5 5"/>':'<path d="m7 6 5 5 5-5M7 13l5 5 5-5"/>')+'</svg></button></div>'+
    (vis.length?'<div class="ucards">'+vis.map(card).join("")+'</div>':'<p class="ahint">'+L("Keine Treffer.")+'</p>')+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-auf]");if(b){ADM.uf=b.dataset.auf;render();return}
  const t=e.target.closest("[data-uact]");if(t){const em=t.dataset.uact;const was=ADM.open.has(em)||ADM.edit===em;if(was){ADM.open.delete(em);if(ADM.edit===em)ADM.edit=""}else ADM.open.add(em);ADM.act=em;render();return}
  const all=e.target.closest("[data-uall]");if(all){const ems=[...document.querySelectorAll(".ucards [data-uact]")].map(x=>x.dataset.uact);const anyClosed=ems.some(x=>!ADM.open.has(x));ADM.open=new Set(anyClosed?ems:[]);if(!anyClosed)ADM.edit="";render()}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-dorefresh]");if(!b)return;const r=$("#refresh");if(r)r.click()});
try{ADM.sort=localStorage.getItem("usort")||"first"}catch(_){ADM.sort="first"}
document.addEventListener("change",e=>{const sl=e.target.closest("select[data-usort]");if(!sl)return;ADM.sort=sl.value;try{localStorage.setItem("usort",ADM.sort)}catch(_){}render()});
try{ADM.sub=localStorage.getItem("admsub")||"users"}catch(_){ADM.sub="users"}
document.addEventListener("click",e=>{const b=e.target.closest("[data-asub]");if(!b)return;if(b.dataset.asub==="set")for(const k of Object.keys(SECS))if(/^(set-blocks|blk-|blkp-)/.test(k))SECS[k]=false;ADM.sub=b.dataset.asub;try{localStorage.setItem("admsub",ADM.sub)}catch(_){}window.scrollTo(0,0);render()});
VIEWS.admin=function(){
  if(!canAdm())return '<div class="empty">'+L("Für die App-Verwaltung fehlt die Berechtigung.")+'</div>';
  if(ADM.loaded&&!ADM.busy&&!ADM.loading&&Date.now()-(ADM.at||0)>300000){ADM.loading=true;admLoad().catch(()=>{}).finally(()=>{ADM.loading=false})}
  /* after a failed load the next try waits a minute (before: again on every render – many reads and messages, Firebase quota) */
  if(!ADM.loaded){const wait=Date.now()-(ADM.failAt||0)<60e3;if(!ADM.loading&&!wait){ADM.loading=true;admLoad().then(()=>{ADM.failAt=0}).catch(err=>{console.error(err);ADM.failAt=Date.now();showMsg(L("Liste der Benutzer:innen konnte nicht geladen werden:")+" "+(err.message||err),6000);render()}).finally(()=>{ADM.loading=false})}
    return '<div class="empty">'+L(wait&&!ADM.loading?"Liste der Benutzer:innen konnte nicht geladen werden:":"Lade Benutzer:innen …")+'</div>'}
  const memBy={};ADM.mem.forEach(m=>memBy[m.email]=m);
  const invBy={};ADM.inv.forEach(i=>invBy[i.id]=i);
  const rows=[];const seen=new Set();
  /* display name: crew list first, otherwise the first/last name the person entered */
  const nm=m=>{if(!m)return"";const cp=crewPerson(m.email);return (cp&&cp.name)||[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||""};
  for(const i of ADM.inv){const m=memBy[i.id];rows.push({email:i.id,name:nm(m)||i.name||"",inv:true,m});seen.add(i.id)}
  for(const m of ADM.mem)if(!seen.has(m.email))rows.push({email:m.email,name:nm(m),inv:false,m});
  /* sortable: name, first name, status, role, newest, department (crew list), e-mail */
  {const nmOf=r=>r.name||(crewPerson(r.email)||{}).name||r.email,last=r=>{const w=String(nmOf(r)).trim().split(/\s+/);return w.length>1?w[w.length-1]:w[0]};
   const stOf=r=>r.m?(r.m.active===true?0:2):1,rk=r=>ADMINS.includes(r.email)?0:ADM.adm.includes(r.email)?1:ADM.ur[r.email]?2:3;
   const ts=r=>{const j=r.m&&r.m.joinedAt;return j?(j.seconds?j.seconds*1000:Date.parse(j)||0):0};
   const dep=r=>{for(const g of S.crew)for(const p of arr(g.people))if(lc(p.email)===r.email)return g.dept||"";return "~"};
   const by={name:(a,b)=>String(last(a)).localeCompare(last(b),LANG)||String(nmOf(a)).localeCompare(nmOf(b),LANG),first:(a,b)=>String(nmOf(a)).localeCompare(nmOf(b),LANG),status:(a,b)=>stOf(a)-stOf(b),role:(a,b)=>rk(a)-rk(b),new:(a,b)=>ts(b)-ts(a),seen:(a,b)=>seenMs(b.m)-seenMs(a.m),dept:(a,b)=>dep(a).localeCompare(dep(b),LANG),email:(a,b)=>a.email.localeCompare(b.email)};
   const f=by[ADM.sort]||by.first;rows.sort((a,b)=>f(a,b)||by.first(a,b))}
  const q=lc(ADM.q);const UF={online:r=>!!r.m&&isOnline(r.m),all:()=>true,act:r=>r.m&&r.m.active===true,inv:r=>!r.m,off:r=>r.m&&r.m.active!==true,adm:r=>ADMINS.includes(r.email)||ADM.adm.includes(r.email)||!!ADM.ur[r.email],app:r=>String(r.m&&r.m.app||"").startsWith("app-"),web:r=>!!r.m&&r.m.active===true&&!String(r.m.app||"").startsWith("app-")};
  if(!UF[ADM.uf])ADM.uf="all";
  const vis=rows.filter(r=>(!q||(r.email+" "+r.name+" "+((crewPerson(r.email)||{}).role||"")).toLowerCase().includes(q))&&UF[ADM.uf](r));
  ADM.cnt=Object.fromEntries(Object.keys(UF).map(k=>[k,rows.filter(UF[k]).length]));
  const newCrew=crewEmails().filter(c=>!invBy[c.email]&&!memBy[c.email]);
  const st=r=>r.m?(r.m.active===true?'<span class="ust ok">'+(LANG==="de"?"aktiv":L("aktiv_1"))+'</span>':'<span class="ust off">'+L("gesperrt")+'</span>'):'<span class="ust wait">'+L("eingeladen")+'</span>';
  const site=location.origin+location.pathname;
  const mail=r=>mailto(r.email,"invite",{vorname:String(r.name||(crewPerson(r.email)||{}).name||"").split(/\s+/)[0],name:r.name||""});
  const own=isOwner();const isAdm=e=>ADMINS.includes(e)||ADM.adm.includes(e);
  const admSec=own?'<div class="admins"><h3>'+L("Administrator:innen")+'</h3><p class="ahint">'+L("Administrator:innen können Leute einladen und sehen in der Crew Essen und Geburtstage. Sperren und Entfernen kannst nur du. Admins und andere Rollen weist du unten bei der Person unter «Rolle» zu.")+'</p>'+
    '<div class="arow"><span>'+esc(ADMINS[0])+'</span><span class="ust ok">'+L("Owner")+'</span></div>'+
    ADM.adm.map(e=>[e,((rows.find(r=>r.email===e)||{}).name)||(crewPerson(e)||{}).name||""]).sort((a,b)=>(a[1]||a[0]).localeCompare(b[1]||b[0],LANG)).map(([e,n])=>'<div class="arow"><span>'+esc(n||e)+'</span><button data-adm="rmadmin" data-em="'+esc(e)+'">'+L("Entfernen")+'</button></div>').join("")+
    '</div>':'';
  const srcInner=()=>{const x=typeof srcHTML==="function"?srcHTML():"";return x?x.replace(/^<details[^>]*><summary>[\s\S]*?<\/summary>/,'<div class="src srcin">').replace(/<\/details>$/,'</div>'):'<p class="ghint">–</p>'};
  /* Einstellungen: one form (id setform) whose fields sit in collapsible groups – all open by default */
  const sv='<div class="arb">'+saveBtn('form="setform"')+'</div>';
  const grp=(k,t,body)=>'<details class="admins asetd setgrp alangs" data-sec="set-'+k+'"'+((k==="blocks"?SECS["set-"+k]===true:SECS["set-"+k]!==false)?' open':'')+'><summary>'+L(t)+'</summary>'+(k==="up"?'<button type="button" class="uprf" data-dorefresh '+ariaTip(L("Daten jetzt aktualisieren"))+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg></button>':'')+body+'</details>';
  /* Szenen-Protokoll → Google Sheet: the link (config/private), whom to share it with, the last state of the workflow */
  /* the shared Google map (link «Karte») in the callsheet map: on/off, its colours, which layers */
  const gmapSet=()=>{const G=window.GMAPSET||{},ls=(S.gmap&&Array.isArray(S.gmap.l))?S.gmap.l:[],off=new Set(G.off||[]);
    return '<p class="ahint"><b>'+L("Google-Karte im Callsheet")+'</b> – '+L("Punkte, Linien und Flächen der Google-Karte (Link «Karte» unten) in der Callsheet-Karte, nur in der Nähe der Orte des Tages. Punkte, die schon auf der Karte sind, erscheinen nicht doppelt. Die Google-Karte muss mit «Jeder mit dem Link» geteilt sein; übernommen wird sie bei der stündlichen Aktualisierung.")+'</p><div class="chk">'+
      '<label class="ck"><input form="setform" type="checkbox" name="gmo"'+(G.on?' checked':'')+'> '+L("Punkte der Google-Karte in der Callsheet-Karte anzeigen")+'</label>'+
      '<label class="ck"><input form="setform" type="checkbox" name="gmc"'+(G.color!==false?' checked':'')+'> '+L("Farben der Google-Karte übernehmen")+'</label></div>'+
      (ls.length?'<p class="ahint"><b>'+L("Ebenen")+'</b></p><div class="chk">'+ls.map(n=>'<label class="ck"><input form="setform" type="checkbox" name="gml" value="'+esc(n)+'"'+(off.has(n)?'':' checked')+'> '+esc(n)+'</label>').join("")+'</div>':
        '<p class="ghint">'+L("Die Ebenen erscheinen hier nach der nächsten Aktualisierung.")+'</p>')};
  const sheetSet=()=>{const st=window.SHEETST||{},sa=window.SHEETSA||"",E={access:"Kein Zugriff – Sheet mit der Adresse oben als Bearbeiter teilen.",api:"Google Sheets API ist nicht eingeschaltet.",notfound:"Sheet nicht gefunden – Link prüfen."};
    return '<p class="ahint"><b>'+L("Szenen-Protokoll in Google Sheets")+'</b> – '+L("Link zum Google Sheet, in dem das Szenen-Protokoll alle 10 Minuten nachgeführt wird (pro Unit ein Tabellenblatt). Leer = aus.")+'</p>'+
      '<input form="setform" class="amap" type="url" name="ssheet" inputmode="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="'+esc(window.SCENESHEET||"")+'">'+
      '<p class="ghint">'+L("Das Sheet mit dieser Adresse als Bearbeiter teilen:")+' '+(sa?'<b class="sheetsa">'+esc(sa)+'</b>':esc(L("Die Adresse erscheint nach dem nächsten Abgleich (bis 10 Minuten).")))+'<br><a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=tschugger-83692" target="_blank" rel="noopener noreferrer">'+L("Einmalig die Google Sheets API im Firebase-Projekt einschalten")+'</a></p>'+
      (window.SCENESHEET&&st.at?'<p class="ghint">'+(st.ok?esc(L("Zuletzt nachgeführt:"))+' '+esc((z=>pad2(z.getDate())+"."+pad2(z.getMonth()+1)+". "+msHM(st.at))(new Date(st.at)))+(st.n!=null?' · '+st.n+' '+esc(L("Zeilen")):''):esc(L("Fehler:"))+' '+esc(L(E[st.err]||"Unbekannter Fehler"))+(st.code?' ('+esc(st.code)+')':''))+'</p>':'')};
  /* all options of the quittances in one box: on/off, the Google Sheet of the scene log, the times */
  const QQ='<p class="ahint"><b>'+L("Quittieren")+'</b> – '+L("Szenen (auch Setup, Lunch und Wrap) und Fahrten im Drehplan und im Callsheet quittieren. Ausgeschaltet: keine Knöpfe, «Jetzt» folgt der Uhrzeit.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="sa"'+(window.SCACKON!==false?' checked':'')+'> '+L("Szenen quittieren")+'</label><label class="ck"><input form="setform" type="checkbox" name="ra"'+(window.RIDEACKON!==false?' checked':'')+'> '+L("Fahrten quittieren")+'</label></div>';
  const setSec=can("settings")?'<form id="setform" class="alangs" data-adm="langs" novalidate></form>'+
    grp("up","Aktualisieren",(own?upSec():'')+'<p class="ahint"><b>Dropbox</b> – '+L("Eingeschaltet werden Drehplan, Drehbuch, Crewliste, Callsheets und Motivliste jede Stunde automatisch neu geladen (nur gelesen).")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="au"'+(window.AUTOUPD!==false?' checked':'')+'> '+L("Daten aus der Dropbox automatisch laden")+'</label><label class="ck"><input form="setform" type="checkbox" name="fa"'+(window.FAILALARM!==false?' checked':'')+'> '+L("Alarm an Owner und Admins, wenn die Aktualisierung zweimal hintereinander fehlschlägt (Push-Nachricht)")+'</label></div>'+'<p class="ahint"><b>'+L("Motivliste")+'</b> – '+L("Link zum Google Sheet mit den Motiven (Spalten SCRIPT NAME, ADRESSE, SCENES, LINK; «Jeder mit dem Link darf ansehen»). Wird bei der nächsten stündlichen Aktualisierung übernommen. Leer = bisherige Liste.")+'</p><input form="setform" class="amap" type="url" name="sheet" inputmode="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="'+esc(window.LOCSHEET||"")+'">'+sv)+
    grp("prod","Produktion",'<p class="ahint"><b>'+L("Projektname")+'</b> – '+L("Name in der Kopfzeile, auf der Anmeldeseite und in den Exporten. Leer = TSCHUGGER Tigerblood.")+'</p><input form="setform" class="amap" type="text" name="pjn" maxlength="60" placeholder="TSCHUGGER Tigerblood" value="'+esc(window.PROJNAME||"")+'">'+
      '<p class="ahint"><b>'+L("Produktionsfirma")+'</b> – '+L("Name und Adresse, z. B. oben rechts im Szenen-Protokoll (PDF).")+'</p><input form="setform" class="amap" type="text" name="pco" maxlength="80" placeholder="'+esc(L("Name der Produktionsfirma"))+'" value="'+esc(window.PRODCO||"")+'">'+
      '<textarea form="setform" class="amap" name="pad" rows="3" maxlength="300" placeholder="'+esc(L("Adresse"))+'">'+esc(window.PRODADDR||"")+'</textarea>'+sv)+
    grp("blocks","Drehblöcke",window.blocksSec?window.blocksSec():"")+
    grp("events","Termine",'<p class="ahint"><b>'+L("Eigene Termine")+'</b> – '+L("Wer das Recht «Eigene Termine erstellen» hat, kann in «Meine Termine» mit + Termine anlegen und wählen, wer sie sieht (alle, Rollen, Abteilungen oder Personen).")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="oe"'+(window.OWNEV!==false?' checked':'')+'> '+L("Eigene Termine erlauben")+'</label></div>'+(typeof gcalSetSec==="function"?gcalSetSec():'')+sv)+
    grp("langs","Sprachen",'<p class="ahint"><b>'+L("Sprachen")+'</b> – '+L("Nur diese Sprachen stehen in der App zur Auswahl. Mindestens eine.")+'</p><div class="chk">'+LANGS.map(([k,t])=>'<label class="ck"><input form="setform" type="checkbox" name="al" value="'+k+'"'+(APPLANGS.includes(k)?' checked':'')+'> '+t+'</label>').join("")+'</div>'+sv)+
    grp("areas","Bereiche",'<p class="ahint"><b>'+L("Bereiche")+'</b> – '+L("Nur die gewählten Bereiche erscheinen unten in der App. Mindestens einer.")+' '+L("Reihenfolge mit ▲ ▼ ändern.")+'</p><div class="tbord">'+tabOrder0().map(k=>[k,{today:"Today",plan:"Schedule",dispo:"Callsheet",loc:"Locations",crew:"Crew",script:"Script",info:"Info"}[k]]).map(([k,t])=>'<div class="tbrow"><label class="ck"><input form="setform" type="checkbox" name="tb" value="'+k+'"'+(!Array.isArray(window.TABSON)||window.TABSON.includes(k)||(k==="today"&&!window.TABSON.includes("-today"))?' checked':'')+'> '+t+'</label><span class="tbmv"><button type="button" data-tmv="up" aria-label="'+esc(L("Nach oben"))+'">▲</button><button type="button" data-tmv="down" aria-label="'+esc(L("Nach unten"))+'">▼</button></span></div>').join("")+'</div>'+'<div class="chk"><label class="ck"><input form="setform" type="checkbox" name="mn"'+(window.MYNAV!==false?' checked':'')+'> '+L("Jede Person darf die Reihenfolge in «Mein Konto» selber anpassen")+'</label></div>'+'<p class="ahint"><b>Units</b> – '+L("Ausgeschaltete Units verschwinden aus Schedule, Callsheet und Locations. Ist nur die 1st Unit aktiv, entfallen die Unit-Knöpfe.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="u2"'+(window.UNIT2!==false?' checked':'')+'> '+L("2nd Unit anzeigen")+'</label><label class="ck"><input form="setform" type="checkbox" name="u3"'+(window.UNIT3===true?' checked':'')+'> '+L("3rd Unit anzeigen")+'</label></div>'+'<p class="ahint"><b>'+L("Drehbuch")+'</b> – '+L("Eingeschaltet erscheint bei jeder Szene der Knopf «Script», der die Szene im Drehbuch öffnet.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="so"'+(window.SCRIPTON!==false?' checked':'')+'> '+L("Drehbuch anzeigen")+'</label></div>'+sv)+
    grp("misc","Einstellungen",'<p class="ahint"><b>'+L("Karte im Callsheet")+'</b> – '+L("Die Karte mit allen Orten des Tages (Locations, Base, Parking) im Callsheet.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="cm"'+(window.CSMAPON!==false?' checked':'')+'> '+L("Karte im Callsheet anzeigen")+'</label></div>'+gmapSet()+

      '<p class="ahint"><b>'+L("Geburtstage")+'</b> – '+L("Eingeschaltet sehen alle Benutzer:innen in der Crew die Geburtstagsliste der Drehzeit (nur Tag und Monat, ohne Jahrgang).")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="bp"'+(window.BDAYPUB===true?' checked':'')+'> '+L("Geburtstagsliste allen anzeigen")+'</label></div>'+
    '<p class="ahint"><b>'+L("Anmeldung")+'</b> – '+L("Ausgeschaltet verschwindet «Mit Google anmelden» auf der Anmeldeseite. Wer schon mit Google angemeldet ist, bleibt angemeldet.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="go"'+(window.GOOGLEON!==false?' checked':'')+'> '+L("Mit Google anmelden anbieten")+'</label></div>'+
    '<p class="ahint"><b>App Check</b> – '+L("Firebase nimmt dann nur Anfragen dieser App an (Schutz vor Missbrauch der Datenbank von aussen). Site-Key (reCAPTCHA v3) aus der Firebase-Konsole eintragen – wirksam ab dem nächsten Start; erzwungen wird es erst in der Firebase-Konsole. Leer = aus.")+'</p><input form="setform" name="ack" maxlength="80" autocomplete="off" spellcheck="false" value="'+esc(window.APPCHECKKEY||"")+'" placeholder="6L…">'+
    '<p class="ahint"><b>'+L("Benutzer:innen ohne Rolle")+'</b> – '+L("Personen ohne Rolle sehen weder Drehplan, Drehbuch noch Blocking. Hier kannst du ihnen zusätzlich freigeben:")+'</p><div class="chk">'+
      [["pp","phone","Telefonnummern"],["pe","email","E-Mail-Adressen"],["pm","mycal","Meine Termine"]].map(([n,k,t])=>'<label class="ck"><input form="setform" type="checkbox" name="'+n+'"'+(window.PUBV[k]!==false?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>'+'<p class="ahint"><b>'+L("Karte")+'</b> – '+L("Link zur Karte für den Knopf «Map» in Locations (z. B. Google My Maps). Leer = Standardkarte.")+'</p><input form="setform" class="amap" type="url" name="map" inputmode="url" placeholder="https://www.google.com/maps/d/…" value="'+esc(window.MAPURL||"")+'">'+(typeof chatSetSec==="function"?chatSetSec():'')+sv)+
    grp("acktimes","Quittieren",QQ+'<p class="ahint"><b>'+L("Quittierungszeiten")+'</b> – '+L("Beginn und Ende der quittierten Szenen neben dem Quittierungs-Knopf. Sichtbar nur mit dem Recht «Quittierungszeiten sehen».")+'</p><div class="chk">'+
      [["tpm","pm","Drehplan – Handy"],["tpd","pd","Drehplan – Computer"],["tcm","cm","Callsheet – Handy"],["tcd","cd","Callsheet – Computer"]].map(([n,k,t])=>'<label class="ck"><input form="setform" type="checkbox" name="'+n+'"'+((window.ACKT||{})[k]!==false?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>'+sheetSet()+sv)+
    grp("push","Push-Nachrichten",pushStatusSec())+grp("src","Quellen",srcInner())+(own?grp("bk","Backup",bkSec()):''):(own?grp("up","Aktualisieren",upSec())+grp("src","Quellen",srcInner())+grp("bk","Backup",bkSec()):'');
  const SUBS=[];if(can("users.view")||can("users.invite")||can("users.requests")||can("users.edit"))SUBS.push(["users","Benutzerverwaltung"]);if(canRoleEdit()||canRoleAssign()||can("roles.view"))SUBS.push(["roles","Access"]);if(can("settings"))SUBS.push(["docs","Dokumente"]);if(isAdmin()||can("coverday.manage"))SUBS.push(["cover","Coverday"]);if(can("settings"))SUBS.push(["set","App"]);if(isAdmin()||can("audit.view"))SUBS.push(["log",isAdmin()||can("audit.view")?"Log/Tests":"Log"]);if(!isAdmin()&&can("data.check"))SUBS.push(["test","Test"]);
  if(!SUBS.length)return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(!SUBS.some(x=>x[0]===ADM.sub))ADM.sub=SUBS[0][0];
  const subNav=SUBS.length>1?'<nav class="asub n'+SUBS.length+'" role="tablist">'+SUBS.map(([k,t])=>{const sh={users:"User",roles:"Access",docs:"Docs",set:"App",log:"Log",test:"Test",cover:"Cover"}[k]||t;if(k==="users")t="User";
    return '<button type="button" role="tab" data-asub="'+k+'" aria-selected="'+(ADM.sub===k)+'"><span class="lgl">'+esc(L(t))+'</span><span class="sml">'+esc(LANG==="de"?sh:L(sh))+'</span></button>'}).join("")+'</nav>':'';
  let h='<section class="adm"><h2 class="dh">'+L("App-Verwaltung")+'</h2>'+subNav;
  if(ADM.sub==="set")return h+setSec+'</section>';
  if(ADM.sub==="cover")return h+(window.coverdaySec?window.coverdaySec():"")+'</section>';
  if(ADM.sub==="docs")return h+docsSec()+'</section>';
  if(ADM.sub==="roles")return h+rolesSec()+'</section>';
  if(ADM.sub==="log")return h+(isAdmin()||can("audit.view")?(window.workerWarnHTML?window.workerWarnHTML():"")+testsSec()+(window.roleTestSec?window.roleTestSec():"")+(isAdmin()&&window.dataCheckSec?window.dataCheckSec():"")+auditSec():"")+'</section>';   /* the scene log at the top */
  if(ADM.sub==="test")return h+'<div class="dcktab">'+(window.dataCheckSec?window.dataCheckSec(true):"")+'</div></section>';
  if(ADM.sub==="bk")return h+bkSec()+'</section>';
  const cInv=can("users.invite"),cView=can("users.view")||can("users.edit"),cEd=can("users.edit");
  /* order: requests, who is online right now, the people, inviting, admins at the end */
  const onl=rows.filter(r=>r.m&&isOnline(r.m));
  const actSec=!cView?'':'<div class="admins uact"><h3><span class="odot" aria-hidden="true"></span>'+L("Gerade aktiv")+' <span class="ust">'+onl.length+'</span></h3>'+(onl.length?'<div class="uactl">'+onl.map(r=>{const nm=r.name||(crewPerson(r.email)||{}).name||r.email;return '<span class="uactp"><span class="uav on" aria-hidden="true">'+esc(initials(nm))+'</span>'+esc(nm)+'</span>'}).join("")+'</div>':'<p class="ghint">'+L("Gerade ist niemand aktiv.")+'</p>')+'</div>';
  h+=(can("users.requests")?reqSec():'')+actSec+(!cView?'':userList(rows,vis,{own,cInv,cEd,isAdm,roleOf,roleName,roleSel,st,mail}))+(!cInv?'':
    '<div class="admins"><h3>'+L("Benutzer:innen einladen")+'</h3><p class="ahint">'+L("Nur eingeladene Adressen können ein Konto erstellen (E-Mail/Passwort oder Google). Gesperrte oder entfernte Personen kommen sofort nicht mehr in die App. Passwort und E-Mail-Adresse verwaltet jede Person selbst.")+'</p>'+
    '<form class="aform" data-adm="add"><input name="em" type="email" placeholder="'+esc(L("E-Mail-Adresse"))+'" required><input name="nm" type="text" placeholder="'+esc(L("Name (optional)"))+'"><button type="submit">'+L("Einladen")+'</button></form>'+
    (newCrew.length?'<button class="abtn" data-adm="crew">'+esc(L("Alle {n} Adressen aus der Crewliste einladen").replace("{n}",newCrew.length))+'</button>':'')+'</div>')+admSec+'</section>';
  return h;
};
document.addEventListener("input",e=>{if(e.target.id==="aq"){ADM.q=e.target.value;const p=e.target.selectionStart;render();const i=$("#aq");if(i){i.focus();i.setSelectionRange(p,p)}}});
document.addEventListener("submit",async e=>{
  const sf=e.target.closest('[data-adm="save"]');if(sf){e.preventDefault();if(!can("users.edit"))return;
    const em=sf.dataset.em,g=n=>{const x=sf.querySelector('[name="'+n+'"]');return x?String(x.value||"").trim():null};
    const m=ADM.mem.find(x=>x.email===em),inv=ADM.inv.find(x=>x.id===em),btn=sf.querySelector("button");if(btn)btn.disabled=true;
    try{const {F,db}=await fb();
      if(m){const fn=g("fn"),ln=g("ln"),d={firstName:fn,lastName:ln,name:[fn,ln].filter(Boolean).join(" ")||m.name||"",lang:g("lg")||m.lang||"de",birthday:g("bd")||"",gender:g("gd")||"",phone:(g("eph")||"").slice(0,40),contactEmail:lc(g("ece")||"").slice(0,120),diet:g("edt")||"none",intol:readBoxes(sf,"eint"),allergies:(g("eal")||"").slice(0,200)};
        /* «Funktion» belongs to the member (the card shows m.func) – before, it was only written to the invitation and never appeared */
        if(g("rl")!==null)d.func=g("rl").slice(0,80);
        {const ba=sf.querySelector('input[name="bauto"]');if(ba)d.blk=ba.checked?F.deleteField():readBoxes(sf,"eblk").slice(0,20)}   /* Drehblöcke: automatic or by hand */
        await F.updateDoc(F.doc(db,"members",m.uid),d)}
      if(inv||!m){const d={name:(m?[g("fn"),g("ln")].filter(Boolean).join(" "):g("nm"))||"",role:g("rl")||""};
        /* role «Crew» only for a NEW invitation – a deliberate «Keine Rolle» stays when the profile is edited later */
        if(inv)await F.updateDoc(F.doc(db,"invites",em),d);else{await F.setDoc(F.doc(db,"invites",em),Object.assign(d,{addedAt:F.serverTimestamp()}));await assignCrew(em)}}
      ADM.edit="";ADM.cedit="";showMsg(L("Gespeichert."),3000);await admLoad();render()}
    catch(err){console.error(err);if(btn)btn.disabled=false;showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const fl=e.target.closest('[data-adm="langs"]');
  if(fl){e.preventDefault();if(!can("settings"))return;const l=[...[...fl.elements].filter(x=>x.name==='al'&&x.checked)].map(x=>x.value);
    if(!l.length){showMsg(L("Bitte mindestens eine Sprache wählen."),4000);return}
    const tb=[...[...fl.elements].filter(x=>x.name==='tb'&&x.checked)].map(x=>x.value),tord=[...[...fl.elements].filter(x=>x.name==='tb')].map(x=>x.value);if(!tb.includes("today"))tb.push("-today"); /* «Today» is on unless switched off here */
    if(!tb.filter(x=>x[0]!=="-").length){showMsg(L("Bitte mindestens einen Bereich wählen."),4000);return}
    try{const {F,db}=await fb();const u2=!!fl.elements['u2'].checked,u3=!!fl.elements['u3'].checked,bp=!!fl.elements['bp'].checked,so=!!fl.elements['so'].checked,au=!!fl.elements['au'].checked;const mu=String(fl.elements['map'].value||"").trim();
    if(mu&&!/^https:\/\/\S+$/.test(mu)){showMsg(L("Bitte einen Link mit https:// eingeben."),4000);return}
    const cu=String((fl.elements['chat']||{}).value||"").trim();if(cu&&!/^https:\/\/\S+$/.test(cu)){showMsg(L("Bitte einen Link mit https:// eingeben."),4000);return}
    const sh=String(fl.elements['sheet'].value||"").trim(),ss=String((fl.elements['ssheet']||{}).value||"").trim();
    const gls=[...fl.elements].filter(x=>x.name==='gml'),gmv={on:!!(fl.elements['gmo']||{}).checked,color:!!(fl.elements['gmc']||{checked:true}).checked,off:gls.length?gls.filter(x=>!x.checked).map(x=>x.value):((window.GMAPSET||{}).off||[])};
    if(ss&&!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(ss)){showMsg(L("Bitte einen Google-Sheets-Link eingeben."),4000);return}
    if(sh&&!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(sh)){showMsg(L("Bitte einen Google-Sheets-Link eingeben."),4000);return}
    /* links only for the crew – only written when they were really loaded (else empty fields would delete them for everyone) */
    if(!window.PRIVOK){await loadLangs();render();showMsg(L(window.PRIVOK?"Links neu geladen – bitte prüfen und nochmals speichern.":"Links konnten nicht geladen werden – bitte später nochmals speichern."),6000);return}
    await F.setDoc(F.doc(db,"config","private"),{mapUrl:mu,locSheet:sh,chatUrl:cu,sceneSheet:ss,gmap:gmv},{merge:true});window.GMAPSET=gmv;window.SCENESHEET=ss;
    await F.setDoc(F.doc(db,"config","app"),{langs:l,unit2:u2,unit3:u3,mapUrl:F.deleteField(),bdayPublic:bp,phonePublic:!!(fl.elements['pp']||{}).checked,emailPublic:!!(fl.elements['pe']||{}).checked,mycalPublic:!!(fl.elements['pm']||{}).checked,googleLogin:!!(fl.elements['go']||{}).checked,appCheckKey:String((fl.elements['ack']||{}).value||"").trim().replace(/[^\w-]/g,"").slice(0,80),locSheet:F.deleteField(),script:so,tabs:tb,tabOrder:tord,autoUpdate:au,failAlarm:!!(fl.elements['fa']||{}).checked,ownEvents:!!(fl.elements['oe']||{}).checked,csMap:!!(fl.elements['cm']||{}).checked,sceneAck:!!(fl.elements['sa']||{}).checked,myNav:!!(fl.elements['mn']||{checked:true}).checked,projName:String((fl.elements['pjn']||{}).value||"").trim().slice(0,60),prodCo:String((fl.elements['pco']||{}).value||"").trim().slice(0,80),prodAddr:String((fl.elements['pad']||{}).value||"").trim().slice(0,300),ackTimes:{pm:!!(fl.elements['tpm']||{checked:true}).checked,pd:!!(fl.elements['tpd']||{checked:true}).checked,cm:!!(fl.elements['tcm']||{checked:true}).checked,cd:!!(fl.elements['tcd']||{checked:true}).checked},rideAck:!!(fl.elements['ra']||{}).checked,chatUrl:F.deleteField(),chatEnabled:!!(fl.elements['ca']||{}).checked,pushEnabled:!!(fl.elements['pn']||{}).checked,tourEnabled:!!(fl.elements['to']||{}).checked,a2again:!!(fl.elements['ia']||{}).checked},{merge:true});
    /* the saved settings are read back like on every start (one place for all of them – before, some only took effect after a reload) */
    await loadLangs();if(bp)syncBdays(true);render();showMsg(L("Einstellungen gespeichert."),3000)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const f=e.target.closest('[data-adm="add"]');if(!f)return;e.preventDefault();
  const em=lc(String(f.em.value||"").trim()),nm=String(f.nm.value||"").trim().slice(0,80);
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){showMsg(L("Bitte eine gültige E-Mail-Adresse eingeben."),4000);try{f.em.focus()}catch(_){}return}
  const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;
  /* leave the input first – otherwise the page does not refresh while the cursor is still in the field */
  try{document.activeElement&&document.activeElement.blur&&document.activeElement.blur()}catch(_){}
  try{const {F,db}=await fb();
    if(ADM.mem.some(m=>m.email===em)){showMsg(em+" "+L("hat bereits ein Konto."),4000);if(btn)btn.disabled=false;return}
    await F.setDoc(F.doc(db,"invites",em),Object.assign(nm?{name:nm}:{},{addedAt:F.serverTimestamp()}),{merge:true});await assignCrew(em);
    if(!ADM.inv.some(i=>i.id===em))ADM.inv.push({id:em,name:nm});f.reset();admIndex();render();
    showMsg(em+" "+L("eingeladen.")+" "+L("Schick jetzt die Einladungs-Mail (✉ bei der Person)."),6000);admLoad().catch(()=>{})}
  catch(err){console.error(err);showMsg(admErr(err),8000)}
  if(btn)btn.disabled=false;
});
document.addEventListener("click",async e=>{
  const b=e.target.closest("button[data-adm]");if(!b||ADM.busy)return;ADM.busy=true;
  try{
    const {F,db}=await fb();const a=b.dataset.adm;
    if(a==="edit"){ADM.edit=ADM.edit===b.dataset.em?"":b.dataset.em;ADM.busy=false;render();return}
    /* passwords can only be set by the person: send Firebase's reset link, which lets them choose a new one */
    if(a==="startpw"){ADM.busy=false;if(!isOwner())return;const em=b.dataset.em;
      if(!confirmSafe(L("Für {e} ein Konto mit Startpasswort anlegen? Beim ersten Anmelden muss die Person ein eigenes Passwort festlegen.").replace("{e}",em)))return;
      b.disabled=true;try{const pw=await createStartAccount(em,b.dataset.nm||"");ADM.pw=ADM.pw||{};ADM.pw[em]=pw;showStartPw(em,b.dataset.nm||"",pw);await admLoad()}
      catch(err){b.disabled=false;const c=err&&err.code||"";showMsg(/email-already-in-use/.test(c)?em+" "+L("hat schon ein Konto – dafür «Passwort-Link senden» verwenden."):/permission/.test(c)?L("Keine Berechtigung – bitte die neuen Firestore-Regeln in Firebase veröffentlichen."):L("Fehler:")+" "+errText(err),9000)}
      return}
    if(a==="nomail"){ADM.busy=false;if(!isOwner())return;const em=lc(b.dataset.em);
      if(!confirmSafe(L("{e} ohne Bestätigungs-Mail freischalten? Nur machen, wenn die Adresse sicher dieser Person gehört.").replace("{e}",em)))return;
      await F.setDoc(F.doc(db,"starts",em),{mustChange:false,at:F.serverTimestamp()});
      if(!ADM.inv.some(i=>i.id===em))await F.setDoc(F.doc(db,"invites",em),{name:"",role:"",addedAt:F.serverTimestamp()});await assignCrew(em);
      showMsg(em+" "+L("ist freigeschaltet. Die Person meldet sich einfach an – oder tippt auf «Ich habe bestätigt»."),7000);await admLoad();return}
    if(a==="pwreset"){ADM.busy=false;if(!isOwner())return;const em=b.dataset.em;
      if(!confirmSafe(L("{e} einen Link schicken, mit dem die Person ein neues Passwort festlegt?").replace("{e}",em)))return;
      const {A,auth}=await fb();await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),em);
      showMsg(L("Link für ein neues Passwort gesendet an")+" "+em+". "+L("Schau auch im Spam-Ordner nach."),6000);return}
    if(a==="reqok"||a==="reqno"){const em=b.dataset.em,q=(ADM.req||[]).find(x=>x.id===em)||{};
      /* with «Anfragen freischalten» only, an invitation that exists already can not be changed (rules) – it is valid as it is, so go on */
      if(a==="reqok"){try{await F.setDoc(F.doc(db,"invites",em),{name:String(q.name||"").slice(0,80),role:String(q.role||"").slice(0,80),addedAt:F.serverTimestamp()})}
        catch(err){if(!/permission/.test(err&&err.code||"")||can("users.invite")||can("users.edit"))throw err}await assignCrew(em);await notifyApproved(em,q)}
      await F.deleteDoc(F.doc(db,"requests",em));ADM.req=(ADM.req||[]).filter(x=>x.id!==em);
      showMsg(a==="reqok"?L("Freigeschaltet:")+" "+(q.name||em):L("Anfrage abgelehnt."),4000);ADM.busy=false;await admLoad();return}
    if(a==="crew"){const list=crewEmails().filter(c=>!ADM.inv.some(i=>i.id===c.email)&&!ADM.mem.some(m=>m.email===c.email));
      if(confirmSafe(L("{n} Adressen aus der Crewliste einladen?").replace("{n}",list.length))){
        for(let i=0;i<list.length;i+=200){const batch=F.writeBatch(db);list.slice(i,i+200).forEach(c=>{batch.set(F.doc(db,"invites",c.email),{name:String(c.name||"").slice(0,120),role:String(c.role||"").slice(0,80),addedAt:F.serverTimestamp()});
          /* a role only where surely none exists yet (without the right to read the roles the list is empty and the batch – up to 200 invitations – failed) */
          if(ADM.urOk&&!ADM.ur[c.email]&&!ADM.adm.includes(c.email)&&!ADMINS.includes(c.email))batch.set(F.doc(db,"userroles",c.email),{role:"crew",at:F.serverTimestamp()})});await batch.commit()}
        showMsg(L("{n} Adressen eingeladen.").replace("{n}",list.length),4000)}}
    else if((a==="block"||a==="remove"||a==="uninvite")&&ADMINS.includes(b.dataset.em||(ADM.mem.find(m=>m.uid===b.dataset.uid)||{}).email)){showMsg(L("Der Owner kann nicht gesperrt oder entfernt werden."),4000)}
    else if(a==="block"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:false});showMsg(L("Gesperrt."),3000)}
    else if(a==="unblock"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:true});showMsg(L("Entsperrt."),3000)}
    else if(a==="remove"){if(confirmSafe(L("{e} entfernen? Die Person kommt danach nicht mehr in die App.").replace("{e}",b.dataset.em))){await F.deleteDoc(F.doc(db,"invites",b.dataset.em)).catch(()=>{});await F.deleteDoc(F.doc(db,"userroles",lc(b.dataset.em))).catch(()=>{});await F.deleteDoc(F.doc(db,"members",b.dataset.uid));showMsg(L("Entfernt."),3000)}}
    else if(a==="mkadmin"&&isAdmin()&&!ADMINS.includes(b.dataset.em)){await F.setDoc(F.doc(db,"admins",b.dataset.em),{addedAt:F.serverTimestamp()});showMsg(b.dataset.em+" "+L("ist jetzt Admin."),3000)}
    else if(a==="rmadmin"&&isAdmin()&&!ADMINS.includes(b.dataset.em)){if(confirmSafe(L("{e} die Admin-Rechte entziehen?").replace("{e}",b.dataset.em))){await F.deleteDoc(F.doc(db,"admins",b.dataset.em));showMsg(L("Admin-Rechte entzogen."),3000)}}
    else if(a==="uninvite"){await F.deleteDoc(F.doc(db,"invites",b.dataset.em));showMsg(L("Einladung gelöscht."),3000)}
    await admLoad();
  }catch(err){console.error(err);showMsg(L("Fehler:")+" "+(err.message||err),6000)}
  ADM.busy=false;
});
