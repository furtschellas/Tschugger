import {isIOS} from "../a2hs.js";
import {L,LANG,S,ddmm,esc,todayISO} from "../base/10-core.js";
import {dayPlaces,zurichUTC} from "../base/11-schedule-prep.js";
import {WDL,hm,myEvents,myIdentity,openMyCal} from "../base/12-mycal.js";
import {vok} from "../base/14-render.js";
import {render} from "../base/15-script-tab.js";
import {store} from "../base/16-interaction.js";
import {arr,showMsg} from "../base/20-data-start.js";
import {fmtDT} from "./01-config.js";
import {can,fb,isAdmin,isOwner,lc,ME,MYROLE,ownEnc,withTimeout,wkPost,wkUrl} from "./03-core-firebase.js";
import {SECS} from "./12a-admin-core.js";
import {scriptChg,tShow,todayOn} from "./16-today-view.js";
import {showScriptNews} from "./20-script-news.js";
/* ---- push notifications for upcoming events: settings in «Mein Konto» (on by default, lead time, which kinds of events),
   every event can be switched off on its own; each device stores its upcoming reminders encrypted in push/{uid}_{device},
   a GitHub run (started every 10 minutes by the Cloudflare Worker) sends the due ones ---- */
const VAPID_PUB="BEP6-lmT3gVm_ZL1R3qiyBzrntxU6dkKtCEbqanP4KjR9xFTTJNtg8Jm1lxWTs7Z2790ZdoNeV4HtNd1jQEjGeo";
/* rides (pickup, driving): their own lead time, also short ones */
const PUSH_LEADS_RIDE=[[5,"5 Min. vorher"],[10,"10 Min. vorher"],[15,"15 Min. vorher"],[30,"30 Min. vorher"],[60,"1 Std. vorher"],[120,"2 Std. vorher"]];
export const PUSH_LEADS=[[15,"15 Min. vorher"],[30,"30 Min. vorher"],[60,"1 Std. vorher"],[120,"2 Std. vorher"],[180,"3 Std. vorher"],[1440,"1 Tag vorher"]];
export const PUSH_TYPES=[["my","Meine Termine","mycal"],["shoot","Alle Drehtage","plan"],["prep","Alle Prep-Termine","prep"]];
export function pushCfg(){let c=null;try{c=JSON.parse(localStorage.getItem("push")||"null")}catch(_){}c=c&&typeof c==="object"?c:{};
  const nd=c.on===false?false:true;  /* reminders were switched off: change pushes start off too */
  return {hint:c.hint||0,news:Object.assign({plan:nd,cs:nd,prep:nd,script:nd,wrap:nd,late:nd},c.news||{}),on:c.on!==false,lead:PUSH_LEADS.some(x=>x[0]===c.lead)?c.lead:60,leadRide:PUSH_LEADS_RIDE.some(x=>x[0]===c.leadRide)?c.leadRide:(PUSH_LEADS.some(x=>x[0]===c.lead)?c.lead:60),types:Object.assign({my:true,shoot:false,prep:false},c.types||{}),off:c.off&&typeof c.off==="object"&&!Array.isArray(c.off)?c.off:{}}}
export function pushSave(c){const t=todayISO();for(const k in c.off)if(c.off[k]<t)delete c.off[k];store("push",JSON.stringify(c));pushSyncSoon()}
export const pushOK=()=>window.PUSHEN!==false&&"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
export const pushStandalone=()=>{try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(_){return false}};
function pushDev(){let d="";try{d=localStorage.getItem("pushdev")||""}catch(_){}if(!/^[a-z0-9]{10}$/.test(d)){d=Array.from(crypto.getRandomValues(new Uint8Array(10)),x=>"abcdefghijklmnopqrstuvwxyz0123456789"[x%36]).join("");try{localStorage.setItem("pushdev",d)}catch(_){}}return d}
const pushId=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)};
const hmOf=hm;   /* same as hm() in 12-mycal.js */
/* all events the device would remind of, by kind; each with a stable id */
function pushEvents(c){
  c=c||pushCfg();const out=[],seen=new Set(),t=todayISO(),add=(kind,e)=>{const id=pushId(e.date+"|"+hmOf(e.t)+"|"+(e.n||""));if(seen.has(id))return;seen.add(id);out.push(Object.assign({id,kind},e))};
  try{if(c.types.my&&vok("mycal")&&typeof myIdentity==="function"){const me=myIdentity();if(me)myEvents(me).forEach(e=>add("my",{date:e.date,t:hmOf(e.t),n:e.n,where:e.where||"",ride:!!e.ride,go:e.ride&&e.toMap?String(e.toMap):""}))}}catch(err){console.warn("push my",err)}
  try{if(c.types.shoot&&vok("plan"))for(const d of S.days){if(d.kind!=="shoot"||d.date<t)continue;const dp=S.dispos.find(x=>x&&x.date===d.date)||{};
    add("shoot",{date:d.date,t:hmOf(dp.crewCall)||hmOf(dp.generalCall),n:(d.short||d.label||"")+" · "+L("Drehtag"),where:(typeof dayPlaces==="function"?dayPlaces(d).join(", "):"")})}}catch(err){console.warn("push shoot",err)}
  try{if(c.types.prep&&vok("prep"))for(const d of S.prepro){if(d.date<t)continue;for(const i of arr(d.items).concat(arr(d.parallel))){if(!i||!i.n||/^(rest|ruhetag|frei|off|day off)$/i.test(String(i.n).trim()))continue;add("prep",{date:d.date,t:hmOf(i.t),n:i.n,where:i.where||""})}}}catch(err){console.warn("push prep",err)}
  return out.sort((a,b)=>(a.date+(a.t||"08:00")).localeCompare(b.date+(b.t||"08:00")));
}
/* start time of an event (events without a time: 08:00) and when to remind */
const pushStart=e=>{try{if(typeof zurichUTC==="function")return zurichUTC(e.date,e.t||"08:00").getTime()}catch(_){}return new Date(e.date+"T"+(e.t||"08:00")+":00").getTime()};   /* Swiss time, also on a phone set to another time zone */
function pushItems(c){c=c||pushCfg();const now=Date.now(),lim=now+15*864e5;
  return pushEvents(c).filter(e=>!c.off[e.id]).map(e=>{const st=pushStart(e),at=st-(e.ride?c.leadRide:c.lead)*60e3;
    const dt=new Date(e.date+"T12:00:00"),day=WDL(dt)+" "+ddmm(dt);   /* the date of the event, not of the phone's time zone */
    return {id:e.id,at,start:st,title:e.n||L("Termin"),body:[day+(e.t?" "+e.t:""),e.where].filter(Boolean).join(" · "),
      /* a ride: the tap opens the route to its destination in Google Maps (only https links) */
      url:e.go&&/^https:\/\/[^\s"'<>]+$/.test(e.go)?e.go.slice(0,400):"./#my"}}).filter(x=>x.start>now&&x.start<lim).slice(0,80)}
let PUSHT=null,PUSHBUSY=false,PUSHDIRTY=false;
export function pushSyncSoon(){clearTimeout(PUSHT);PUSHT=setTimeout(()=>{try{pushLocalSchedule()}catch(_){}pushSync().catch(err=>console.warn("push",err&&err.code||err))},2500)}
async function pushReg(){return navigator.serviceWorker.getRegistration?((await navigator.serviceWorker.getRegistration())||(await navigator.serviceWorker.ready)):navigator.serviceWorker.ready}
const u8=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");s+="===".slice((s.length+3)%4);return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
/* public push key: the one the Cloudflare Worker reports (after a key change), else the built-in one */
let VAPIDQ=null;
function vapidPub(){let k="";try{k=localStorage.getItem("vapidpub")||""}catch(_){}return /^B[A-Za-z0-9_-]{80,}$/.test(k)?k:VAPID_PUB}
async function vapidRefresh(){if(!window.CHATURL)return vapidPub();if(!VAPIDQ)VAPIDQ=fetch(wkUrl("/"),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&/^B[A-Za-z0-9_-]{80,}$/.test(j.vapidPub||""))try{localStorage.setItem("vapidpub",j.vapidPub)}catch(_){}return vapidPub()}).catch(()=>vapidPub());return VAPIDQ}
const b64uOf=buf=>{const b=new Uint8Array(buf||[]);let s="";for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
async function pushSub(create){const reg=await pushReg();let sub=await reg.pushManager.getSubscription();const k=await withTimeout(vapidRefresh(),4000,"vapid").catch(()=>vapidPub());
  /* subscribed with an older key: subscribe again with the current one */
  if(sub&&sub.options&&sub.options.applicationServerKey&&b64uOf(sub.options.applicationServerKey)!==k){try{await sub.unsubscribe()}catch(_){}sub=null;create=true;try{localStorage.removeItem("pushlast")}catch(_){}}
  if(!sub&&create)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(k)});if(sub)sub.__k=k;return sub}
async function pushSync(){
  if(PUSHBUSY){PUSHDIRTY=true;return}   /* a change during a sync: one more sync right after it (it was lost) */
  if(!ME||!ME.uid||!pushOK()||(window.simOn&&window.simOn()))return;PUSHBUSY=true;   /* never while viewing as another person */
  try{const c=pushCfg(),{F,db}=await fb(),ref=F.doc(db,"push",ME.uid+"_"+pushDev());let last="";try{last=localStorage.getItem("pushlast")||""}catch(_){}
    if(!(c.on||newsAny(c))||Notification.permission!=="granted"){if(last){await F.deleteDoc(ref).catch(()=>{});try{localStorage.removeItem("pushlast")}catch(_){}}return}
    const sub=await pushSub(true);if(!sub)return;
    let dept="";try{const me=typeof myIdentity==="function"&&myIdentity();dept=me&&me.src||""}catch(_){}
    const pl={on:true,sub:sub.toJSON(),k:sub.__k||vapidPub(),lang:LANG,items:c.on?pushItems(c):[],cd:+window.CDAT||0,news:newsFor(c),who:{email:lc(ME.email),role:isOwner()?"owner":isAdmin()?"admin":(MYROLE||""),dept}};const js=JSON.stringify(pl),h=pushId(js)+"|"+Math.floor(Date.now()/216e5);
    if(h===last)return;
    const enc=await ownEnc(pl);
    await F.setDoc(ref,{c:enc,at:F.serverTimestamp()});try{localStorage.setItem("pushlast",h)}catch(_){}
  }finally{PUSHBUSY=false;if(PUSHDIRTY){PUSHDIRTY=false;setTimeout(()=>pushSync(),300)}}
}
export async function pushEnable(){
  if(!pushOK())return;const p=await Notification.requestPermission();
  if(p!=="granted"){showMsg(L("Push-Nachrichten wurden im Browser nicht erlaubt."),6000);render();return}
  try{await withTimeout(pushSub(true),10000,"push")}catch(err){console.error(err);showMsg(L("Fehler:")+" "+(err.message||err),6000)}
  const c=pushCfg();c.on=true;try{localStorage.removeItem("pushlast")}catch(_){}pushSave(c);render();
}
async function pushTest(){
  const msg=t=>showMsg(t,7000);
  try{if(Notification.permission!=="granted"){msg(L("Push-Nachrichten sind auf diesem Gerät noch nicht erlaubt."));return}
    try{localStorage.removeItem("pushlast")}catch(_){}await pushSync();
    if(window.CHATURL){const r=await wkPost("/selftest",{title:L("Test-Nachricht"),body:L("So sehen Erinnerungen an deine Termine aus.")});
      const j=await r.json().catch(()=>({}));
      if(r.ok&&j.n>0){msg(L("Test über den Server an {n} Gerät(e) gesendet.").replace("{n}",j.n));return}
      msg(L("Server-Test fehlgeschlagen:")+" "+(j.error||(j.devices===0?L("dieses Gerät ist noch nicht registriert"):JSON.stringify(j.st||r.status))));return}
    const reg=await pushReg();await reg.showNotification(L("Test-Nachricht"),{body:L("So sehen Erinnerungen an deine Termine aus."),icon:"clap-192.png",badge:"badge-96.png",tag:"test"});
    msg(L("Nur lokal getestet – für echte Push-Nachrichten muss die Produktion den Cloudflare Worker einrichten."))}
  catch(err){msg(L("Fehler:")+" "+(err.message||err))}}
/* while the app is open (or in the background), reminders also come from the device itself – a backup when the server is late */
let LOCALT=[];
/* signing out: this device gets no more reminders of this person (server entry, timers on the device, settings) */
window.pushSignOut=async function(){
  try{LOCALT.forEach(clearTimeout);LOCALT=[];clearTimeout(PUSHT)}catch(_){}
  try{if(ME&&ME.uid){const {F,db}=await fb();await withTimeout(F.deleteDoc(F.doc(db,"push",ME.uid+"_"+pushDev())),5000,"push").catch(()=>{})}}catch(_){}
  try{for(const k of Object.keys(localStorage))if(k==="push"||k==="pushlast"||k.startsWith("pushlocal:"))localStorage.removeItem(k)}catch(_){}
  /* the browser subscription goes too: without network the push document stays, but the sender then gets «gone» and removes it */
  try{const reg=navigator.serviceWorker&&await withTimeout(navigator.serviceWorker.getRegistration(),3000,"sw");const sub=reg&&reg.pushManager&&await reg.pushManager.getSubscription();if(sub)await withTimeout(sub.unsubscribe(),3000,"unsub")}catch(_){}
};
function pushLocalSchedule(){LOCALT.forEach(clearTimeout);LOCALT=[];const c=pushCfg();if(!c.on||!pushOK()||Notification.permission!=="granted")return;
  const now=Date.now();for(const it of pushItems(c)){const d=it.at-now;if(d<-5*60e3||d>6*3600e3)continue;
    LOCALT.push(setTimeout(async()=>{const k="pushlocal:"+it.id+"|"+it.at;try{if(localStorage.getItem(k))return;localStorage.setItem(k,"1")}catch(_){}
      try{const reg=await pushReg();const open=await reg.getNotifications({tag:it.id});if(open&&open.length)return;await reg.showNotification(it.title,{body:it.body,tag:it.id,icon:"clap-192.png",badge:"badge-96.png",data:{url:"./#my"}})}catch(_){}},Math.max(0,d)))}}
/* status for the production (Einstellungen): server, registered devices, last runs */
const PST={busy:false,d:null};
async function pushStatusLoad(){if(PST.busy)return;PST.busy=true;const d={};
  try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"push"));d.devices=q.docs.length;d.mine=ME?q.docs.filter(x=>x.id.startsWith(ME.uid+"_")).length:0}catch(err){d.devErr=String((err&&err.code)||err)}
  if(window.CHATURL){try{const r=await fetch(wkUrl("/"));d.worker=r.ok?await r.json():{error:r.status}}catch(err){d.worker={error:String(err.message||err)}}}
  try{const r=await fetch("https://api.github.com/repos/furtschellas/Tschugger/actions/workflows/push.yml/runs?per_page=12");const j=await r.json();const xs=j.workflow_runs||[];const x=xs[0];
    if(x)d.run={at:x.created_at,ok:x.conclusion,ev:x.event};d.runs=xs.map(y=>({at:Date.parse(y.created_at),ev:y.event}))}catch(_){}
  PST.d=d;PST.busy=false;render()}
export function pushStatusSec(){
  if(!PST.d){pushStatusLoad();return '<p class="ghint">'+L("Lade …")+'</p>'}
  const d=PST.d,w=d.worker,ok=t=>'<li class="ok">✓ '+t+'</li>',bad=t=>'<li class="bad">✗ '+t+'</li>';
  const when=t=>{try{return fmtDT(t)}catch(_){return t}};
  let h='<ul class="pstat">';
  h+=!window.CHATURL?bad(L("Cloudflare Worker nicht eingetragen – Push-Nachrichten gehen nur, wenn GitHub den Versand startet (oft stundenlang verspätet)."))
    :w&&w.ok?ok(L("Worker erreichbar"))+(w.push?ok(L("Sofort-Versand bereit (CREW_KEY gesetzt)")):bad(L("CREW_KEY fehlt im Worker – kein Sofort-Versand.")))+(w.cron?ok(L("Zeitplan aktiv (GH_TOKEN gesetzt)")):bad(L("GH_TOKEN fehlt im Worker – Erinnerungen werden nicht pünktlich verschickt.")))
    :bad(L("Worker nicht erreichbar:")+" "+esc(JSON.stringify((w&&w.error)||"")));
  h+=d.devErr?(isAdmin()?bad(L("Geräte nicht lesbar.")+" ("+esc(d.devErr)+")"):""):(d.devices?ok(L("{n} Geräte für Push angemeldet").replace("{n}",d.devices)):bad(L("Noch kein Gerät für Push angemeldet.")));
  if(!d.devErr)h+=d.mine?ok(L("Dieses Gerät ist angemeldet")):bad(L("Dieses Gerät ist nicht angemeldet – unter «Mein Konto» Push einschalten."));
  h+=d.run?(d.run.ok==="success"?ok(L("Letzter Versand-Lauf bei GitHub:")+" "+esc(when(d.run.at))):bad(L("Letzter Versand-Lauf bei GitHub fehlgeschlagen:")+" "+esc(when(d.run.at)))):bad(L("GitHub hat den Versand noch nie gestartet."));
  if(d.runs){const hr=d.runs.filter(x=>Date.now()-x.at<3600e3),wk=hr.filter(x=>x.ev==="workflow_dispatch").length;
    h+=wk>=4?ok(L("Worker startet den Versand regelmässig ({n}× in der letzten Stunde).").replace("{n}",wk))
      :bad(L("Der Worker-Zeitplan startet den Versand nicht ({n}× in der letzten Stunde, erwartet 6×). In Cloudflare: Worker → Settings → Triggers → Cron «*/10 * * * *» und das Secret GH_TOKEN prüfen.").replace("{n}",wk))}
  if(w&&w.ok){h+=w.sa?ok(L("Dienstkonto eingerichtet (FIREBASE_SA)")):bad(L("Dienstkonto fehlt im Worker (FIREBASE_SA) – Test und Sofort-Versand funktionieren nicht."));
    h+=w.v?ok(L("Worker-Version")+" "+esc(w.v)):bad(L("Alte Worker-Version – bitte den neuen Code aus tools/chat_worker.js einsetzen."))}
  return h+'</ul><div class="arb"><button type="button" class="pillbtn" data-pstat>↻ '+L("Neu prüfen")+'</button></div>';
}
document.addEventListener("click",e=>{if(e.target.closest("[data-pstat]")){PST.d=null;render()}});

/* bell in «Meine Termine» rows */
window.pushBell=function(e){const c=pushCfg();if(!c.on||!c.types.my||!pushOK())return "";const id=pushId(e.date+"|"+hmOf(e.t)+"|"+(e.n||""));const off=!!c.off[id];
  return '<button type="button" class="pbell'+(off?' off':'')+'" data-pushev="'+id+'" data-pushdate="'+esc(e.date)+'" aria-pressed="'+(!off)+'" aria-label="'+esc(L(off?"Push-Nachricht einschalten":"Push-Nachricht ausschalten"))+'" title="'+esc(L(off?"Push-Nachricht aus":"Push-Nachricht an"))+'"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'+(off?'<path d="M3 3l18 18"/>':'')+'</svg></button>'};
/* push on changes (sent automatically after the Dropbox update): only what the person may see, each can be turned off */
export const PUSH_NEWS=[["plan","Änderungen am Drehplan","plan"],["cs","Neue und geänderte Callsheets","dispo"],["prep","Änderungen der Prep-Planung","prep"],["script","Neue Drehbuch-Versionen","script"],["wrap","Nachricht bei Drehschluss","plan"],["late","Verspätung des Casts","dispo"]];
function newsFor(c){const o={};for(const [k,,v] of PUSH_NEWS)o[k]=!!c.news[k]&&vok(v);return o}
function newsAny(c){return PUSH_NEWS.some(([k,,v])=>c.news[k]&&vok(v))}
export function pushSec(){
  const c=pushCfg();let dev="";
  if(!pushOK())dev='<p class="ghint">'+L(isIOS()&&!pushStandalone()?"Auf dem iPhone/iPad: zuerst die App über «Teilen → Zum Home-Bildschirm» hinzufügen und von dort öffnen – dann kannst du Push-Nachrichten einschalten.":"Dieser Browser unterstützt keine Push-Nachrichten.")+'</p>';
  else if(Notification.permission==="denied")dev='<p class="ghint">'+L("Push-Nachrichten sind in den Einstellungen dieses Browsers blockiert. Erlaube sie dort für diese Seite.")+'</p>';
  else if(Notification.permission!=="granted")dev='<div class="arb"><button type="button" data-pushon>'+L("Auf diesem Gerät einschalten")+'</button></div>';
  else dev='<p class="ghint pok">✓ '+L("Auf diesem Gerät aktiv")+' <button type="button" class="pillbtn" data-pushtest>'+L("Test-Nachricht")+'</button></p>';
  const types=PUSH_TYPES.filter(x=>vok(x[2]));
  const ev=c.on?pushEvents(c).filter(e=>pushStart(e)>Date.now()).slice(0,40):[];
  /* Drehschluss (thanks to the crew, how it goes on) and Verspätung (only with the right «Verspätung des Casts») are no changes: own headings */
  const lateOk=()=>{try{return typeof can==="function"&&can("cast.late")}catch(_){return false}};
  const nw=PUSH_NEWS.filter(x=>vok(x[2])&&x[0]!=="wrap"&&x[0]!=="late"),wr=PUSH_NEWS.filter(x=>vok(x[2])&&x[0]==="wrap"),lt=PUSH_NEWS.filter(x=>x[0]==="late"&&vok(x[2])&&lateOk());
  const nck=([k,t])=>'<label class="ck"><input type="checkbox" data-pushnews="'+k+'"'+(c.news[k]?' checked':'')+'> '+L(t)+'</label>';
  return '<section class="psec pushsec"><h4>'+L("Push-Nachrichten")+'</h4>'+
    (nw.length?'<p class="ahint"><b>'+L("Bei Änderungen benachrichtigen")+'</b></p>'+nw.map(nck).join(""):'')+
    (wr.length?'<p class="ahint"><b>'+L("Drehschluss")+'</b></p>'+wr.map(nck).join("")+'<p class="ghint">'+L("Ein Dankeschön an die Crew, sobald der Drehschluss quittiert ist – mit dem Hinweis, ob es am nächsten Tag weitergeht.")+'</p>':'')+
    (lt.length?'<p class="ahint"><b>'+L("Verspätung")+'</b></p>'+lt.map(nck).join("")+'<p class="ghint">'+L("Liegt jemand vom Cast mehr als 5 Minuten hinter dem Callsheet (Call, Kostüm, Maske, Base, On set), kommt eine Nachricht mit Cast-Nummer, Rolle und Minuten.")+'</p>':'')+
    (!c.on&&newsAny(c)?dev:'')+
    '<p class="ahint"><b>'+L("Erinnerungen")+'</b></p>'+
    '<label class="ck"><input type="checkbox" data-pushmaster'+(c.on?' checked':'')+'> '+L("Erinnerungen an kommende Termine erhalten")+'</label>'+
    /* which appointments: right below «Erinnerungen», also before reminders are switched on */
    '<p class="ahint"><b>'+L("Für welche Termine?")+'</b></p>'+types.map(([k,t])=>'<label class="ck"><input type="checkbox" data-pushtype="'+k+'"'+(c.types[k]?' checked':'')+'> '+L(t)+'</label>').join("")+
    (c.on?dev+'<label>'+L("Erinnern")+'<select data-pushlead>'+PUSH_LEADS.map(([v,t])=>'<option value="'+v+'"'+(v===c.lead?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>'+
      '<label>'+L("Erinnern an Fahrten")+'<select data-pushleadride>'+PUSH_LEADS_RIDE.map(([v,t])=>'<option value="'+v+'"'+(v===c.leadRide?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>'+
      '<details class="pushlist" data-sec="pushlist"'+(SECS.pushlist?' open':'')+'><summary>'+L("Kommende Termine")+' ('+ev.filter(e=>!c.off[e.id]).length+'/'+ev.length+')</summary>'+
      (ev.length?ev.map(e=>{const dt=new Date(e.date+"T12:00:00");return '<label class="ck pev"><input type="checkbox" data-pushev2="'+e.id+'" data-pushdate="'+esc(e.date)+'"'+(c.off[e.id]?'':' checked')+'> <span><b>'+WDL(dt)+' '+ddmm(dt)+(e.t?' '+esc(e.t):'')+'</b> '+esc(e.n||"")+'</span></label>'}).join(""):'<p class="ghint">'+L("Keine kommenden Termine gefunden.")+'</p>')+
      '<p class="ahint">'+L("Hier oder mit der Glocke in «Meine Termine» schaltest du einzelne Termine aus.")+'</p></details>':'')+
    '</section>';
}
function pushToggleEv(id,date,on){const c=pushCfg();if(on)delete c.off[id];else c.off[id]=date||todayISO();pushSave(c)}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-pushev]");if(b){e.preventDefault();e.stopPropagation();pushToggleEv(b.dataset.pushev,b.dataset.pushdate,b.classList.contains("off"));render();return}
  if(e.target.closest("[data-pushon]")){pushEnable();return}
  if(e.target.closest("[data-pushtest]")){pushTest();return}},true);
document.addEventListener("change",e=>{const t=e.target;
  if(t.matches("[data-pushmaster]")){const c=pushCfg();c.on=t.checked;pushSave(c);if(t.checked&&pushOK()&&Notification.permission==="default")pushEnable();else render()}
  else if(t.matches("[data-pushnews]")){const c=pushCfg();c.news[t.dataset.pushnews]=t.checked;pushSave(c);if(t.checked&&pushOK()&&Notification.permission==="default")pushEnable();else render()}
  else if(t.matches("[data-pushlead]")){const c=pushCfg();c.lead=+t.value;pushSave(c)}
  else if(t.matches("[data-pushleadride]")){const c=pushCfg();c.leadRide=+t.value;pushSave(c)}
  else if(t.matches("[data-pushtype]")){const c=pushCfg();c.types[t.dataset.pushtype]=t.checked;pushSave(c);render()}
  else if(t.matches("[data-pushev2]")){pushToggleEv(t.dataset.pushev2,t.dataset.pushdate,t.checked);const s=t.closest("details").querySelector("summary");if(s){const c=pushCfg(),ev=pushEvents(c).filter(x=>pushStart(x)>Date.now()).slice(0,40);s.textContent=L("Kommende Termine")+" ("+ev.filter(x=>!c.off[x.id]).length+"/"+ev.length+")"}}});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")pushSyncSoon()});
/* opened from a notification: go to «Meine Termine» */
function pushGo(h){const m=String(h||"").match(/#go=(plan|dispo|prep|script):(\d{4}-\d{2}-\d{2})/);if(!m)return false;
  try{history.replaceState(history.state,"",location.pathname+location.search)}catch(_){}
  /* new script version: jump to the changes in Today (or, if Today does not show them, the message with the changelog) */
  if(m[1]==="script"){let n=0;const go=()=>{const sx=S.meta&&S.meta.scriptChange;if(!sx&&n++<15){setTimeout(go,400);return}
      const inToday=typeof todayOn==="function"&&todayOn()&&(typeof tShow!=="function"||tShow("chg"))&&typeof scriptChg==="function"&&!!scriptChg();
      if(inToday){S.tab="today";try{store("tab","today")}catch(_){}render();const c=document.querySelector("#view .tchg");if(c){c.classList.add("tjump");c.scrollIntoView({block:"start",behavior:"smooth"});setTimeout(()=>c.classList.remove("tjump"),2500)}}
      else if(sx&&vok("script")&&typeof showScriptNews==="function"){document.querySelectorAll("#scrnews").forEach(x=>x.remove());showScriptNews(sx)}
      else{S.tab=vok("script")?"script":"today";render()}};
    setTimeout(go,400);return true}
  let n=0;const go=()=>{ /* wait for the data (up to 6 s), so a new shooting day is found */
    const has=(S.days||[]).some(d=>d.id===m[2]||d.date===m[2]);if(m[1]==="plan"&&!has&&n++<15){setTimeout(go,400);return}
    S.want=null;S.srcOpen=false;if(m[1]==="dispo"){S.tab="dispo";S.dday=m[2]}else{S.tab="plan";S.day=m[1]==="prep"||!has?"prep:"+m[2]:m[2]}
    try{store("tab",S.tab)}catch(_){}window.scrollTo(0,0);render()};
  setTimeout(go,400);return true}
pushGo(location.hash);
if(location.hash==="#my"){try{history.replaceState(null,"",location.pathname+location.search)}catch(_){}setTimeout(()=>{if(typeof openMyCal==="function")openMyCal()},400)}
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{const o=e.data&&e.data.open;if(!o)return;if(pushGo(o))return;if((o==="my"||/#my/.test(o))&&typeof openMyCal==="function")openMyCal()});
/* push while the app is open: also as a pop-up inside the app */
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{const p=e.data&&e.data.push;if(!p)return;
  const o=document.createElement("div");o.className="pushpop";o.setAttribute("role","alertdialog");
  o.innerHTML='<div class="pphd"><span class="ppic" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></span><b>'+esc(p.title||"TSCHUGGER")+'</b><button type="button" class="pushx" aria-label="'+esc(L("Schliessen"))+'">×</button></div>'+(p.body?'<p>'+esc(p.body)+'</p>':'');
  o.addEventListener("click",ev=>{if(!ev.target.closest(".pushx")){if(/^https:\/\//.test(p.url||""))window.open(p.url,"_blank","noopener");else if(/#my/.test(p.url||"")&&typeof openMyCal==="function")openMyCal()}o.classList.add("out");setTimeout(()=>o.remove(),250)});
  document.body.appendChild(o);try{navigator.vibrate&&navigator.vibrate([150,80,150])}catch(_){}});
