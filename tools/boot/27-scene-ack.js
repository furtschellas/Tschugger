import {ariaTip,esc,I18N,isoAdd,L,LANG,mkDialog,mName,msHM,norm,pad2,S,saveBlob,saveBtn,saveErr,todayISO,TX} from "../base/10-core.js";
import {UNAME,dayMs} from "../base/11-schedule-prep.js";
import {hm} from "../base/12-mycal.js";
import {fold,render} from "../base/15-script-tab.js";
import {store} from "../base/16-interaction.js";
import {schedIndex} from "../base/17-scene-reader.js";
import {arr,showMsg} from "../base/20-data-start.js";
import {ME,MEMBER,can,dbWrite,fb,isAdmin} from "./03-core-firebase.js";
import {savePrefsSoon} from "./06-prefs-docs.js";
import {TST_RUN,logHead,savedPop,tstIco} from "./17-audit-misc.js";
/* ---------- scenes of the shooting day «quittiert» in the Drehplan: open → running (tap) → done (tap); sceneack/{date-scene}, no names.
   Everybody sees the state live; tapping only with the permission «Szenen quittieren». «Jetzt» follows: the running scene, else the next open one after the last done ---------- */
window.SCACK=window.SCACK||{};export let SCSUB=null;
/* the times of the quittances (begin–end, running since) only with the permission «Quittierungszeiten sehen» */
window.scTimesOk=()=>typeof canPerm==="function"&&canPerm("scenes.times");
const scHM=msHM;
/* running time: 7′, 1h05 */
const scDur=ms=>{const m=Math.max(0,Math.floor(ms/60000));return m<60?m+"′":Math.floor(m/60)+"h"+pad2(m%60)};
/* the counters of running scenes count on without drawing the page again */
setInterval(()=>document.querySelectorAll("[data-scrun]").forEach(el=>{el.textContent=scDur(Date.now()-(+el.dataset.scrun))}),20e3);
/* one id per scene and day for Drehplan and callsheet alike: «186 pt1A», «186pt1A», «Sc. 186 PT1A», «DJ 186pt1a» → 186pt1a; «21 CONT» = 21 */
/* 2nd/3rd Unit: every entry has its own id – the key ends in «_u2» («lunch_u2», «90_u2» → …-lunchu2, …-90u2), so the same scene number in both units
   is quittiert apart (before, a 2nd-unit scene that the 1st Unit also shoots showed the 1st Unit's tick and could not be started) */
export function scAckId(date,sc){sc=String(sc??"");const m=sc.match(/_u([23])$/);if(m)sc=sc.slice(0,-3);
  return String(date||"").replace(/-/g,"")+"-"+fold(sc).replace(/[^a-z0-9]/g,"").replace(/^(dj|d|j|sc|sz|seq|scene|szene)(?=\d)/,"").replace(/(cont|continued|forts|fortsetzung)$/,"").slice(0,m?21:24)+(m?"u"+m[1]:"")}
/* the key of an entry in a unit: the 1st Unit as it is, the 2nd/3rd with «_u2» / «_u3» (lunch, wrap, setups had it already) */
export const scK=(sc,u)=>{u=String(u||"1");sc=String(sc??"");return u!=="1"&&sc&&!/_u[23]$/.test(sc)?sc+"_u"+u:sc};
window.scK=scK;
const scUOf=k=>(String(k||"").match(/_u([23])$/)||[])[1]||"1";
/* the entry of a key – a 2nd/3rd-unit scene quittiert before the own ids (id without unit, u "2") is still found */
function scGet(date,sc){const x=window.SCACK[scAckId(date,sc)];if(x)return /_u[23]$/.test(String(sc||""))||String(x.u||"1")==="1"||/^(lunch|wrap|setup\d*)$/.test(String(sc||""))?x:null;   /* an older 2nd-unit entry is not the 1st Unit's */const m=String(sc||"").match(/^(.*)_u([23])$/);if(!m||/^(lunch|wrap|setup\d*)$/.test(m[1]))return null;
  const o=window.SCACK[scAckId(date,m[1])];return o&&String(o.u||"1")===m[2]?o:null}
window.scGet=scGet;
window.scAckId=scAckId;
/* lunch and wrap rows of the schedule / shooting order are quittiert too: their key «lunch» / «wrap», else "" */
window.scEvKey=t=>{t=String(t||"");return /\b(lunch|mittag|pranzo|d[ée]jeuner)\b/i.test(t)?"lunch":/\b(wrap|drehschluss)\b/i.test(t)?"wrap":""};
/* setup rows are quittiert like lunch and wrap: the first «setup», the further ones «setup2», «setup3» … */
const scIsSetup=t=>/^\s*set[\s-]?up\b/i.test(String(t||""));
/* the keys of all rows of a day (Drehplan items or callsheet rows): lunch, wrap, setup, setup2 … ; scenes "" */
window.scRowKeys=(rows,txt)=>{let n=0;return (rows||[]).map(r=>{if(!r||r.sc)return"";const t=txt(r);if(scIsSetup(t)){n++;return n>1?"setup"+n:"setup"}return scEvKey(t)})};
/* lunch, wrap and setups of the 2nd/3rd unit have their own entries («lunch_u2»): scBase gives the plain key */
window.scBase=k=>String(k||"").replace(/_u[23]$/,"");
/* the name of a quittiert entry: Lunch, Wrap, Setup 2, else «Szene 186» */
window.scLabel=k=>{k=scBase(k);const m=k.match(/^setup(\d*)$/);return k==="lunch"?"Lunch":k==="wrap"?"Wrap":m?("Setup"+(m[1]?" "+m[1]:"")):L("Szene")+" "+k};
/* state of a scene: 0 open, 1 running, 2 done */
window.scState=(date,sc)=>{if(!scOnU(scUOf(sc)))return 0;const x=scGet(date,sc);return x?(x.s===1?1:2):0};
/* any scene of that day quittiert (then «jetzt» follows the quittances instead of the clock) */
/* draw again but keep what is open (callsheet parts, scene details, locations) and the scroll position */
export function scRender(){const v=document.getElementById("view");if(!v){render();return}
  const secs=[...v.querySelectorAll("details[id]")].filter(d=>d.open).map(d=>d.id),scs=[...v.querySelectorAll("li[data-sc]")].filter(li=>{const d=li.querySelector("details.csscd");return d&&d.open}).map(li=>li.dataset.sc),
    all=[...v.querySelectorAll("details[id]")].filter(d=>d.dataset.all).map(d=>[d.id,d.dataset.all]),y=scrollY;
  render();
  for(const id of secs){const d=document.getElementById(id);if(d)d.open=true}for(const [id,a] of all){const d=document.getElementById(id);if(d)d.dataset.all=a}
  for(const sc of scs){const li=v.querySelector('li[data-sc="'+CSS.escape(sc)+'"]');const d=li&&li.querySelector("details.csscd");if(d)d.open=true}
  scrollTo(0,y)}
/* u: only that unit; without: any unit that is quittiert (each unit can be switched off on its own) */
window.scHas=(date,u)=>{const p=String(date||"").replace(/-/g,"")+"-";return Object.entries(window.SCACK).some(([k,x])=>{if(!k.startsWith(p))return false;const xu=String(x&&x.u||"1");return (!u||xu===String(u))&&scOnU(xu)})};
const SC_ICO={1:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="13" height="10" rx="2"/><path d="M15.5 10.5l5.5-3v9l-5.5-3z"/><circle cx="6.5" cy="10.5" r="1"/></svg>',
  2:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  /* wrap done: two ticks (the shooting day is finished) */
  wrap:'<svg viewBox="0 0 24 24" width="20" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12.5l4.5 4.5L16.5 7.5"/><path d="M11 16l1 1L21.5 7.5"/></svg>',
  /* lunch running: knife and fork */
  lunch:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3.5v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-6M9 3.5v17"/><path d="M17 20.5v-17c-2 1.2-3 3.6-3 7v2h3"/></svg>'};
/* running: a film camera; done: a tick; wrap: two ticks; lunch running: knife and fork */
/* the round status button of a scene (visible for all, a button only with the permission) */
/* switched on per unit (2nd Unit: SCACKON2) */
const scOnU=u=>String(u||"1")==="2"?window.SCACKON2!==false:window.SCACKON!==false;   /* each unit on its own (before, the 2nd Unit was off whenever the 1st was) */
const scParU=u=>String(u||"1")==="2"?(window.SCPAR2===undefined?!!window.SCPAR:!!window.SCPAR2):!!window.SCPAR;
window.scOnU=scOnU;
window.scAckBtn=(date,sc,u)=>{if(!date||!sc||!scOnU(u))return"";   /* switched off in App-Verwaltung → Einstellungen */
  u=String(u||"1");sc=scK(sc,u);const st=scState(date,sc),can=typeof canPerm==="function"&&canPerm("scenes.ack");
  /* the state symbol only with «Quittierungen sehen» (or the right to quittieren) */
  if(!can&&!(typeof canPerm==="function"&&canPerm("scenes.see")))return"";
  const tip=[L("Szene offen – antippen = Szene beginnt"),L("Szene läuft – antippen = abgeschlossen"),L("Szene abgeschlossen – antippen = ändern")][st];
  const lab=[L("Szene offen"),L("Szene läuft"),L("Szene abgeschlossen")][st];
  /* left of the icon: begin–end, while running begin and a counter how long it runs */
  const x=scGet(date,sc)||{},b0=+x.b||+x.at||0,tm=st===2?scHM(b0)+(x.e?"–"+scHM(x.e):""):st===1?scHM(b0)+' · <span data-scrun="'+b0+'">'+scDur(Date.now()-b0)+'</span>':"";
  /* sctp = Drehplan, sctc = Callsheet: App-Verwaltung can hide the times there on phones and on computers (classes on <html>) */
  const lab0=tm&&scTimesOk()?'<span class="scackt '+(S.tab==="dispo"?"sctc":"sctp")+'">'+tm+'</span>':'';
  const ico=st===1&&scBase(sc)==="lunch"?SC_ICO.lunch:st===2&&scBase(sc)==="wrap"?SC_ICO.wrap:(SC_ICO[st]||"");
  return '<span class="scackw">'+lab0+(can?'<button type="button" class="scack sk'+st+'" data-scack="'+esc(date)+'|'+esc(String(sc))+'|'+esc(u)+'" aria-label="'+esc(tip)+'" title="'+esc(tip)+'">'+ico+'</button>'
    :'<span class="scack sk'+st+'" role="img" data-scnoperm="1" aria-label="'+esc(lab)+'" title="'+esc(lab)+'">'+ico+'</span>')+'</span>'};
/* the quittances of the last two days are kept on the device: «Jetzt» shows at once on opening (from this copy), the live state
   follows within seconds (no names in them, only dates, scene numbers, states and times) */
const SCKEEP="scack:v1";
try{const c=JSON.parse(localStorage.getItem(SCKEEP)||"null");if(c&&c.m&&Date.now()-(+c.at||0)<12*3600e3&&!Object.keys(window.SCACK).length){window.SCACK=c.m;window.SCACKCACHE=true}}catch(_){}
function scKeep(m){try{const lim=isoAdd(todayISO(),-1);const k={};for(const [id,x] of Object.entries(m))if(x&&x.d>=lim)k[id]=x;localStorage.setItem(SCKEEP,JSON.stringify({at:Date.now(),m:k}))}catch(_){}}
/* live for everybody: all quittances (also past shooting days keep their ticks in the Drehplan and callsheet) */
async function scAckSub(){if(SCSUB||typeof ME==="undefined"||!ME)return;try{const {F,db}=await fb();
  SCSUB=F.onSnapshot(F.collection(db,"sceneack"),q=>{const first=!window.SCACKLOADED;window.SCACKLOADED=true;window.SCACKLIVE=true;   /* LIVE: a real answer of the server (the automatic writes wait for it) */
    if(first)setTimeout(scRender,0);const m={};(q.docs||[]).forEach(d=>{m[d.id]=d.data()});scKeep(m);if(JSON.stringify(m)!==JSON.stringify(window.SCACK)){window.SCACK=m;scRender();setTimeout(scLunchAuto,500)}},err=>{SCSUB=null;SCERR++;console.warn("sceneack",err&&err.code||err);window.SCACKLOADED=true})}catch(_){SCSUB=null;SCERR++;window.SCACKLOADED=true}}
let SCTRY=0,SCERR=0;setTimeout(scAckSub,1500);setInterval(()=>{if(SCSUB)return;if(window.SCACKLOADED&&Date.now()-SCTRY<(SCERR<12?5e3:60e3))return;SCTRY=Date.now();scAckSub()},5e3);   /* as soon as signed in; after an error (e.g. right after sign-in, before the membership is known) again every 5 s for a minute, then every minute */
/* lunch ends by itself: its begin (manual quittance) + the planned lunch of that unit – each unit has its own lunch row in the Drehplan
   (the duration of the row, else until the next row; 60 min when the Drehplan has none) */
function scLunchMin(date,u){try{const day=(S.days||[]).find(d=>d.date===date&&d.kind==="shoot");if(!day)return 60;
    const its=arr(u==="2"?(day.unit2||{}).items:u==="3"?(day.unit3||{}).items:day.items),i=its.findIndex(x=>!x.sc&&window.scEvKey(x.n)==="lunch");if(i<0)return 60;
    const it=its[i],m=String(it.dur||"").trim().match(/^(\d+)\s*[h:]\s*(\d{1,2})|^(\d+)\s*['′’m]/);if(m){const v=m[3]?+m[3]:(+m[1])*60+(+m[2]);if(v>0)return v}
    const t0=scMs(date,hm(it.t));if(t0)for(let j=i+1;j<its.length;j++){const t1=scMs(date,hm(its[j].t));if(t1>t0)return Math.round((t1-t0)/60000)}}catch(_){}
  return 60}
const scLunchEnd=x=>(+x.b||+x.at||0)+scLunchMin(x.d,String(x.u||"1"))*60000;
/* every open app with the right «Szenen quittieren» closes a lunch whose time is up – with the planned end, not the moment of writing */
let SCLBUSY=false;
async function scLunchAuto(){if(SCLBUSY||/[?&]sbx=/.test(location.search)||!window.SCACKLIVE||typeof canPerm!=="function"||!canPerm("scenes.ack")||(window.simOn&&window.simOn()))return;   /* only on the live state – never on an old copy of the device */SCLBUSY=true;
  try{const now=Date.now();for(const [id,x] of Object.entries(window.SCACK)){const k=x&&(scKeyOf(id,x));
      if(!x||x.s!==1||scBase(k)!=="lunch"||!(+x.b||+x.at))continue;const e=scLunchEnd(x);if(now<e)continue;
      try{await scWrite(x.d,k,x.u,{s:2,b:+x.b||+x.at,e})}catch(_){}}}
  finally{SCLBUSY=false}}
setInterval(scLunchAuto,30e3);
/* ---------- automatic quittances of the Drehplan (App-Verwaltung → Einstellungen → Quittieren): SCENEAUTO {s, l, w: {on, min}} ----------
   a the setup before the first scene begins at the time of the callsheet (else of the Drehplan) – on unless switched off ·
   s scenes and later setups begin · l lunch begins (its end as before after the lunch duration) · w wrap – once the time of the Drehplan plus the
   Zugabe has passed. The scene running in that unit is finished then (one scene runs at a time). Times: planned time + Zugabe.
   Only the latest due row of a unit and only when nothing after it is quittiert yet (rows skipped in reality stay open); only today and
   yesterday (night shoots), only times of the last 12 h; every device with «Szenen quittieren». Set back by hand: marker rideack/z… (s 1,
   like the cast in 24-flow.js) – the automatic leaves that row alone. */
const SCA_KINDS=[["a","Setup vor Drehbeginn"],["s","Szenen und Setup"],["l","Lunch Beginn"],["w","Drehschluss"]];
/* the settings of the unit (2nd Unit: SCENEAUTO2, 3rd as the 1st); without a unit: on in one of them */
const scaA=u=>u==="2"?window.SCENEAUTO2||window.SCENEAUTO:window.SCENEAUTO;
const scaOn=(k,u)=>{if(u===undefined)return scaOn(k,"1")||scaOn(k,"2");const A=scaA(u);return !!(A&&A[k]&&A[k].on)};
const scaMark=(date,sc)=>{const s=date+"|"+scAckId(date,sc);let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "zs"+(h>>>0).toString(36)};
const scaZ=(date,sc)=>!!(window.RIDEACK||{})[scaMark(date,sc)];
async function scaKeep(date,sc){if(!SCA_KINDS.some(([k])=>scaOn(k))||scaZ(date,sc))return;const id=scaMark(date,sc),v={d:date,at:Date.now(),s:1};
  try{await dbWrite("set","rideack/"+id,v);if(window.RIDEACK)window.RIDEACK[id]=v}catch(_){}}
/* the rows of a unit that can be quittiert: key (scene number or lunch / wrap / setup…, «_u2» in the 2nd unit), kind, planned time (ms) */
function scaRows(day,u){const its=arr(u==="2"?(day.unit2||{}).items:u==="3"?(day.unit3||{}).items:day.items),ks=scRowKeys(its,x=>x.n);let ref=0,scene=false;
  /* the time of a setup in the callsheet (its shooting order), else the one of the Drehplan */
  let cr=[],ck=[];try{const dp=u==="1"&&arr(S.dispos).find(x=>x&&x.date===day.date&&x.cs);if(dp){cr=arr((dp.cs.order||{}).rows);ck=scRowKeys(cr,r=>r.text||r.syn)}}catch(_){}
  return its.map((x,i)=>{const k=x.sc?String(x.sc):ks[i];if(!k||(()=>{try{return window.deGone&&window.deGone(x)}catch(_){return false}})())return null;const b=scBase(k),setup=/^setup\d*$/.test(b),first=setup&&!scene;if(x.sc)scene=true;
    const kind=b==="lunch"?"l":b==="wrap"?"w":first?"a":"s";let h=hm(x.t);if(first){const j=ck.indexOf(b);if(j>=0&&hm(cr[j].t))h=hm(cr[j].t)}if(!h)return null;
    const t=dayMs(day.date,h,ref);if(!t)return null;if(!ref)ref=t;
    return {k:scK(k,u),kind,t}}).filter(Boolean)}
let SCABUSY=false;
async function scAuto(){if(SCABUSY||/[?&]sbx=/.test(location.search)||!window.SCACKLIVE||!window.RIDEACKLOADED||typeof canPerm!=="function"||!canPerm("scenes.ack")||(window.simOn&&window.simOn())||!SCA_KINDS.some(([k])=>scaOn(k)))return;SCABUSY=true;
  try{const now=Date.now(),t=todayISO(),days=[t,isoAdd(t,-1)];
    for(const day of arr(S.days)){if(!day||day.kind!=="shoot"||!days.includes(day.date))continue;
      for(const u of ["1","2","3"]){if(!scOnU(u))continue;const rows=scaRows(day,u);let j=-1;
        const A=scaA(u);rows.forEach((r,i)=>{if(!scaOn(r.kind,u))return;const due=r.t+(+A[r.kind].min||0)*60e3;if(due<=now&&now-due<12*3600e3)j=i});
        if(j<0)continue;const r=rows[j],T=r.t+(+A[r.kind].min||0)*60e3;
        if(rows.slice(j).some(x=>scState(day.date,x.k)>0)||scaZ(day.date,r.k))continue;   /* already quittiert (or later ones) / set back by hand */
        /* quittiert by hand in this unit since this row was due (another scene started, one finished …): the hand wins – the automatic
           never undoes a tap (before, a scene started by hand was finished again within 30 s and the planned one started) */
        if(Object.values(window.SCACK).some(x=>x&&x.d===day.date&&String(x.u||"1")===u&&(+x.at||0)>=T))continue;
        /* everything still running in this unit is finished (also scenes running in parallel) */
        for(const run of scRunAll(day.date,u,scAckId(day.date,r.k))){const x=scGet(day.date,run)||{},b=+x.b||+x.at||T;await scWrite(day.date,run,u,{s:2,b,e:Math.max(T,b+60e3)},true)}
        await scWrite(day.date,r.k,u,r.kind==="w"?{s:2,b:T,e:T}:{s:1,b:T},true)}}}
  catch(err){if(!(err&&err.code==="simulation"))console.warn("scene auto",err&&err.code||err)}
  finally{SCABUSY=false}}
setInterval(scAuto,30e3);window.scAutoRun=scAuto;   /* tests */
/* the key of a quittance: its «sc» field – for old entries without it the part of the id after the date */
const scKeyOf=(id,x)=>scK((x&&x.sc)||id.split("-").slice(1).join("-"),x&&x.u);   /* an older 2nd-unit entry: its key with «_u2» */
/* all entries running in a unit on that day (other than this one): their keys */
function scRunAll(date,u,except){const out=[];for(const [id,x] of Object.entries(window.SCACK))if(x&&x.d===date&&x.s===1&&String(x.u||"1")===String(u||"1")&&id!==except)out.push(scKeyOf(id,x));return out}
/* the scene running in a unit on that day (other than this one): its scene number, else "" */
function scRunning(date,u,except){for(const [id,x] of Object.entries(window.SCACK))if(x&&x.d===date&&x.s===1&&String(x.u||"1")===String(u||"1")&&id!==except)return scKeyOf(id,x);return""}
/* a time typed for a scene: on the shooting day – or the next calendar day when it lies more than 12 h before the reference
   (night shoot: 00:40 after 23:30 belongs to the next day; DST-safe through the calendar date) */
const scMsNear=(date,t,ref)=>{const v=scMs(date,t);if(!v||!ref)return v;if(ref-v>12*3600e3){const n=scMs(isoAdd(date,1),t);return n||v}return v};
const scMs=(date,t)=>{const m=String(t||"").match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;
  const d=new Date(date+"T00:00:00");d.setHours(+m[1],+m[2],0,0);return d.getTime()};
async function scWrite(date,sc,u,v,auto){sc=scK(sc,u);const id=scAckId(date,sc),old=scGet(date,sc),undo=()=>{if(old)window.SCACK[id]=old;else delete window.SCACK[id];scRender()};
  /* an older entry of this 2nd-unit scene (id without unit): replaced by the own id */
  const lid=old&&!window.SCACK[id]?Object.keys(window.SCACK).find(k=>window.SCACK[k]===old):null;
  if(lid){try{await dbWrite("delete","sceneack/"+lid,null,{undo:()=>{window.SCACK[lid]=old}})}catch(_){}delete window.SCACK[lid];if(typeof SCLOG!=="undefined"&&SCLOG.list){const i=SCLOG.list.findIndex(x=>x.id===lid);if(i>=0)SCLOG.list.splice(i,1)}}
  if(!auto&&old&&(!v||v.s<(old.s===1?1:2)))await scaKeep(date,sc);   /* set back by hand: the automatic leaves it alone */
  /* through the data layer: offline the scene state shows at once and is sent later */
  if(!v){await dbWrite("delete","sceneack/"+id,null,{undo});delete window.SCACK[id]}else{v=Object.assign({d:date,at:Date.now(),u:String(u||"1"),sc:String(sc).slice(0,24)},v);for(const k of ["b","e"])if(v[k]==null)delete v[k];await dbWrite("set","sceneack/"+id,v,{undo});window.SCACK[id]=v}if(typeof SCLOG!=="undefined"&&SCLOG.list){const i=SCLOG.list.findIndex(x=>x.id===id);if(i>=0)SCLOG.list.splice(i,1);if(v)SCLOG.list.push(Object.assign({id},v))}scRender()}
/* tap: open → running (only when no other scene runs in this unit) → done; a done scene opens the popup to change state and times */
function scParAsk(date,sc,u,run,b){const d=mkDialog("scpar",null,{replace:true});
  d.innerHTML='<div class="a2box"><h3>'+esc(scLabel(run)+" "+L("läuft noch"))+'</h3><p>'+esc(L("Was soll mit {s} geschehen?").replace("{s}",scLabel(sc)))+'</p>'+
    '<div class="a2b scparb"><button type="button" class="pri" data-scpar="par">'+esc(L("Parallel laufen lassen"))+'</button>'+
    '<button type="button" data-scpar="finish">'+esc(L("{r} abschliessen, {s} starten").replace("{r}",scLabel(run)).replace("{s}",scLabel(sc)))+'</button>'+
    '<button type="button" class="lnk" data-scpar="no">'+esc(L("Abbrechen"))+'</button></div></div>';
  d.addEventListener("click",e=>{const x=e.target.closest("[data-scpar]");if(!x&&e.target!==d)return;const v=x?x.dataset.scpar:"no";d.remove();if(v==="no")return;
    /* the same tap again with the answer – also WhatsApp «direkt» opens in this tap */
    scTap(b,date,sc,u,v)});   /* directly – the button may have been redrawn meanwhile */
  document.body.appendChild(d)}
/* the symbol without the right to quittieren: tapping it says why nothing happens (before: silent) */
document.addEventListener("click",e=>{const s=e.target.closest&&e.target.closest("[data-scnoperm]");if(!s)return;e.preventDefault();e.stopPropagation();
  showMsg(L("Zum Quittieren fehlt dir das Recht «Szenen quittieren».")+(typeof MYROLE!=="undefined"&&window.MYROLENAME?" ("+L("Rolle")+": "+window.MYROLENAME+")":""),5000)},true);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button[data-scack]");if(!b)return;e.preventDefault();e.stopPropagation();if(typeof canPerm!=="function"||!canPerm("scenes.ack")){showMsg(L("Zum Quittieren fehlt dir das Recht «Szenen quittieren»."),5000);return}
  const [date,sc,u]=b.dataset.scack.split("|");
  /* never silent: an error while quittieren shows (before, the tap seemed to do nothing) */
  scDiag(date,sc,u,"tap v="+(window.APPVER||"")+" st="+scState(date,scK(sc,u))+" on="+scOnU(u)+" ack="+canPerm("scenes.ack")+" par="+scParU(u)+" run="+scRunAll(date,u,"").join(","));
  Promise.resolve().then(()=>scTap(b,date,sc,u,"")).catch(err=>{scDiag(date,sc,u,"error "+String(err&&(err.code||err.message)||err).slice(0,120));try{b.disabled=false}catch(_){}console.warn("scene ack",err);showMsg(L("Fehler:")+" "+String(err&&(err.code||err.message)||err).slice(0,120),6000)})},true);
const scIsEv=k=>/^(lunch|wrap|setup\d*)$/.test(scBase(k));
/* diagnosis of a tap (until the quittance works again everywhere): each step into the protocol, codes only (no names) */
async function scDiag(date,sc,u,step){try{if(!ME||!ME.email)return;const {F,db}=await fb();await F.addDoc(F.collection(db,"audit"),{by:String(ME.email).toLowerCase(),at:F.serverTimestamp(),op:"error",col:"sceneack",id:String(date+"|"+sc+"|"+u).slice(0,120),sum:("diag "+step).slice(0,280)})}catch(_){}}
window.scDiag=scDiag;
/* one tap on the round button of an entry (choice: the answer of the parallel question – «par» or «finish» – when it was asked) */
async function scTap(b,date,sc,u,choice){sc=scK(sc,u);const id=scAckId(date,sc),st=scState(date,sc),x=scGet(date,sc)||{},bs=scBase(sc),now0=Date.now();
  if(st===2){scAckDialog(date,sc,u);return}
  if(st===0){const runs=scRunAll(date,u,id),fin=k=>{const rx=scGet(date,k)||{},rb=+rx.b||+rx.at||now0;
      return scWrite(date,k,u,{s:2,b:rb,e:scBase(k)==="lunch"?Math.max(rb,Math.min(scLunchEnd(rx),now0)):Math.max(rb,now0)}).catch(()=>{})};
    /* lunch and setups still running end when the next entry starts (lunch at the latest at its planned end) – not awaited: WhatsApp «direkt»
       must open in this tap */
    for(const k of runs)if(/^(lunch|setup\d*)$/.test(scBase(k)))fin(k);
    const scs=runs.filter(k=>!scIsEv(k));
    /* lunch starts: the scenes running end (no question – nobody shoots through lunch); wrap: everything ends further down */
    if(bs==="lunch")for(const k of scs)fin(k);
    /* another scene runs: ask – both in parallel (both show in «Jetzt»), or finish the running one and start this one; «Szenen parallel» on: no question */
    else if(!scIsEv(sc)&&scs.length&&!scParU(u)&&!choice){scParAsk(date,sc,u,scs[0],b);return}
    else if(!scIsEv(sc)&&choice==="finish")for(const k of scs)fin(k);
    /* the first scene of the day starts and the setup before it was never quittiert (nor set back by hand): the setup is done now (from its planned time) */
    const first=!scIsEv(sc)&&!Object.entries(window.SCACK).some(([rid,rx])=>rx&&rx.d===date&&String(rx.u||"1")===String(u||"1")&&!scIsEv(scKeyOf(rid,rx)));
    if(first)try{const day=arr(S.days).find(d=>d&&d.date===date&&d.kind==="shoot");
      for(const r of day?scaRows(day,String(u||"1")):[])if(r.kind==="a"&&scState(date,r.k)===0&&!scaZ(date,r.k))scWrite(date,r.k,u,{s:2,b:Math.min(r.t,now0),e:now0},true).catch(()=>{})}catch(_){}}
  /* the new state: wrap is done at once, an open entry runs, a running one is done */
  const v=st===0&&bs==="wrap"?{s:2,b:now0,e:now0}:st===0?{s:1,b:now0}:{s:2,b:x.b||x.at||now0,e:now0};
  /* WhatsApp per kind of quittance (Mein Konto → App): «direkt» opens WhatsApp right in this tap (a phone allows it only here, not after saving) */
  const wk=scWaKind(date,sc,u,v),wm=scWaMode(wk,u),isWrap=st===0&&bs==="wrap";
  b.disabled=true;
  /* the quittance is sent BEFORE WhatsApp opens: the phone may put the app to sleep at once (before, the scene was then never saved) */
  const wp=isWrap?null:scWrite(date,sc,u,v);if(wp)wp.catch(()=>{});
  if(wm==="a")scWaOpen(scShareText(date,sc,u,wk==="d"?Object.assign({start:1},v):v),wk,u);
  if(isWrap)for(const k of scRunAll(date,u,id)){const rx=scGet(date,k)||{};try{await scWrite(date,k,u,{s:2,b:rx.b||rx.at||now0,e:scBase(k)==="lunch"?Math.max(+rx.b||+rx.at||now0,Math.min(scLunchEnd(rx),now0)):now0})}catch(_){}}
  scDiag(date,sc,u,"write s="+v.s+" wa="+wm);
  try{await (wp||scWrite(date,sc,u,v));scDiag(date,sc,u,"saved");if(wm!=="f")showMsg(scLabel(sc)+" "+(v.s===1?L("läuft"):L("abgeschlossen"))+(u!=="1"?" · "+u+(u==="2"?"nd":"rd")+" Unit":""),1800);scBar(date,sc,u,v,wm==="f"?(wk==="d"?Object.assign({start:1},v):v):null,wk)}   /* a short confirmation: the tap was saved */   /* after every quittance: change the time right away; WhatsApp «Fragen» as a button there */
  catch(err){b.disabled=false;scDiag(date,sc,u,"fail "+String(err&&(err.code||err.message)||err).slice(0,120));showMsg(err&&err.code==="simulation"?err.message:saveErr(err),4000)}}
/* after a scene (lunch, wrap) was finished: offer a short info message by WhatsApp (the person chooses the chat there); «nicht mehr fragen» on this device */
function scShareText(date,sc,u,v){const un=u&&u!=="1"?" · "+((typeof UNAME!=="undefined"&&UNAME[u])||u)+" Unit":"",dd=" ("+date.split("-").reverse().slice(0,2).join(".")+"."+un+")";
  if(v.start)return L("Drehstart")+" "+scHM(v.b)+" – "+scLabel(sc)+dd;
  if(scBase(sc)==="wrap")return "Wrap "+scHM(v.e||v.b)+" – "+L("Drehtag abgeschlossen")+dd;
  if(scBase(sc)==="lunch")return v.s===1?"Lunch "+L("ab")+" "+scHM(v.b)+dd:L("Lunch vorbei, es geht weiter")+" "+scHM(v.e)+dd;
  return v.s===1?scLabel(sc)+" "+L("läuft seit")+" "+scHM(v.b)+dd:scLabel(sc)+" "+L("abgeschlossen")+" "+scHM(v.b)+"–"+scHM(v.e)+" ("+scDur((v.e||0)-(v.b||0))+")"+dd}
/* ---------- WhatsApp per kind of quittance: Drehstart (first scene of the day), Szene Beginn, Szene Abschluss, Lunch Beginn, Lunch Ende, Drehschluss.
   Per person (Mein Konto → App, synced with the account): «n» aus, «f» fragen (after saving), «a» WhatsApp direkt öffnen; recipient: choose in WhatsApp or a fixed number */
const SCWA_KINDS=[["d","Drehstart","erste Szene des Tages","f"],["b","Szene Beginn","","n"],["e","Szene Abschluss","","f"],["l","Lunch Beginn","","n"],["m","Lunch Ende","","f"],["w","Drehschluss","Wrap","f"],["p","Prognose","im «Jetzt»","f"],["t","Drehtag vor Ort geändert","","f"]];
function scWaModes(){let s="";try{s=localStorage.getItem("scwa")||"";if(!s&&localStorage.getItem("scwa:no")==="1")s="nnnnnn"}catch(_){}   /* «nicht mehr fragen» of before: all off */
  return Object.fromEntries(SCWA_KINDS.map(([k,,,d0],i)=>[k,/^[nfa]$/.test(s[i]||"")?s[i]:d0]))}
/* the role can set WhatsApp per unit (App-Verwaltung → Access → Rolle: wa {"1": {m, n}, "2": {m, n}} – m one letter per kind n/f/a, «p» = as the person set it);
   without a setting of the role: the person's own (Mein Konto → App) */
const scWaRole=u=>{const w=window.MYROLEWA;return w&&typeof w==="object"?w[String(u||"1")==="2"?"2":"1"]||null:null};
const scWaMode=(k,u)=>{if(!k)return "n";const r=scWaRole(u),i=SCWA_KINDS.findIndex(x=>x[0]===k),c=r&&typeof r.m==="string"?r.m[i]:"";return /^[nfa]$/.test(c||"")?c:scWaModes()[k]};window.scWaMode=scWaMode;window.SCWA_KINDS=SCWA_KINDS;
function scWaKind(date,sc,u,v){const bs=scBase(sc);if(bs==="wrap")return "w";if(bs==="lunch")return v.s===1?"l":"m";
  if(v.s===2)return "e";
  const first=!/^(setup\d*)$/.test(bs)&&!Object.entries(window.SCACK).some(([rid,rx])=>rx&&rx.d===date&&String(rx.u||"1")===String(u||"1")&&!/^(lunch|wrap|setup\d*)$/.test(scBase(scKeyOf(rid,rx))));
  return first&&scWaMode("d",u)!=="n"?"d":"b"}
/* recipient: per kind (scwt<kind>) a number or a WhatsApp group (its invite link), else the general number (scwan), else choose in WhatsApp.
   A group cannot be opened with the text in it (WhatsApp does not allow that): the text is copied, the group opens, paste and send */
const scWaGet=k=>{try{return localStorage.getItem(k)||""}catch(_){return ""}};
function scWaParse(v){v=String(v||"").trim();const g=v.match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{10,40})/);if(g)return "g:"+g[1];if(/^g:[A-Za-z0-9]{10,40}$/.test(v))return v;
  const n=v.replace(/[^\d+]/g,"").replace(/^\+/,"").replace(/^00/,"");return n.length>=8?n:""}
const scWaTarget=(k,u)=>{const r=scWaRole(u);return scWaParse(r&&r.n)||scWaParse(k&&scWaGet("scwt"+k))||scWaParse(scWaGet("scwan"))};
const scWaUrl=(txt,k,u)=>{const t=scWaTarget(k,u);return /^g:/.test(t)?"https://chat.whatsapp.com/"+t.slice(2):"https://wa.me/"+t+"?text="+encodeURIComponent(txt)};
const scWaIsGroup=(k,u)=>/^g:/.test(scWaTarget(k,u));
window.scWaOpen=(txt,k,u)=>scWaOpen(txt,k,u);
function scWaOpen(txt,k,u){try{if(scWaIsGroup(k,u)){try{navigator.clipboard.writeText(txt)}catch(_){}showMsg(L("Text kopiert – in der WhatsApp-Gruppe einfügen und senden."),6000)}window.open(scWaUrl(txt,k,u),"_blank","noopener")}catch(_){}}
function scWaSec(){if(typeof canPerm!=="function"||!(canPerm("scenes.ack")||canPerm("now.forecast")||canPerm("day.edit")))return "";const m=scWaModes(),n=(()=>{try{return localStorage.getItem("scwan")||""}catch(_){return ""}})();
  return '<section class="psec"><h4>'+esc(L("WhatsApp beim Quittieren"))+'</h4><p class="ghint">'+esc(L("Nach dem Quittieren einer Szene eine kurze Info per WhatsApp – pro Art einstellbar. «Fragen»: nach dem Speichern erscheint ein Knopf. «Direkt»: WhatsApp öffnet sich sofort mit dem fertigen Text; senden tippst du selbst."))+'</p>'+
    '<div class="scwag">'+SCWA_KINDS.map(([k,t,sub])=>'<div class="scwar"><span>'+esc(L(t))+(sub?' <small class="ghint">'+esc(L(sub))+'</small>':'')+'</span><select data-scwam="'+k+'" aria-label="'+esc(L(t))+'">'+[["n","Aus"],["f","Fragen"],["a","Direkt"]].map(([v,x])=>'<option value="'+v+'"'+(m[k]===v?' selected':'')+'>'+esc(L(x))+'</option>').join("")+'</select></div>'+'<input class="scwan scwt" data-scwt="'+k+'" maxlength="80" autocomplete="off" spellcheck="false" value="'+esc(scWaGet("scwt"+k))+'" placeholder="'+esc(L("Empfänger: Nummer oder Gruppenlink (leer = wie unten)"))+'" aria-label="'+esc(L(t)+" – "+L("Empfänger"))+'"'+(m[k]==="n"?' hidden':'')+'>').join("")+'</div>'+
    '<p class="ghint"><b>'+esc(L("Empfänger"))+'</b> – '+esc(L("Pro Art oder hier für alle: eine Nummer (öffnet diesen Chat mit dem Text) oder der Einladungslink einer WhatsApp-Gruppe (WhatsApp → Gruppe → Einladen per Link). Bei einer Gruppe wird der Text kopiert und die Gruppe geöffnet – einfügen und senden. Leer: du wählst den Chat jedes Mal in WhatsApp."))+'</p>'+
    '<input class="scwan" data-scwan maxlength="80" autocomplete="off" spellcheck="false" value="'+esc(n)+'" placeholder="'+esc(L("Nummer oder Gruppenlink, z. B. +41 79 123 45 67"))+'" aria-label="'+esc(L("Empfänger"))+'"></section>'}
window.scWaSec=scWaSec;
const scWaSave=()=>{try{localStorage.setItem("prefsLocalAt",String(Date.now()))}catch(_){}if(typeof savePrefsSoon==="function")savePrefsSoon()};
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-scwam]");if(s){const m=scWaModes();m[s.dataset.scwam]=s.value;store("scwa",SCWA_KINDS.map(([k])=>m[k]).join(""));try{localStorage.removeItem("scwa:no")}catch(_){}scWaSave();const t=document.querySelector('[data-scwt="'+s.dataset.scwam+'"]');if(t)t.hidden=s.value==="n";return}
  const n=e.target.closest&&e.target.closest("[data-scwan]");if(n&&!n.dataset.scwt){store("scwan",n.value.trim().slice(0,60));scWaSave();return}
  const w=e.target.closest&&e.target.closest("[data-scwt]");if(w){const v=w.value.trim(),p=scWaParse(v);store("scwt"+w.dataset.scwt,v?(p||v).slice(0,60):"");if(v&&!p)showMsg(L("Weder Nummer noch Gruppenlink erkannt."),4000);scWaSave()}});
/* bar at the bottom after every quittance (a few seconds): what was saved with its time, «Zeit ändern» (state, begin, end) and – with «Fragen» – WhatsApp */
let SCBART=null;
function scBar(date,sc,u,v,wa,wk){let b=document.getElementById("scbar");if(b)b.remove();clearTimeout(SCBART);
  b=document.createElement("div");b.id="scbar";b.className="scbar";b.setAttribute("role","status");
  const what=v.s===2?(scBase(sc)==="wrap"?L("Drehschluss")+" "+scHM(v.e||v.b):scLabel(sc)+" "+L("abgeschlossen")+" "+scHM(v.e)):scLabel(sc)+" "+(scBase(sc)==="lunch"?L("ab"):L("läuft seit"))+" "+scHM(v.b);
  b.innerHTML='<span class="scbt">'+esc(what)+'</span><button type="button" class="pillbtn" data-scbared>'+esc(L("Zeit ändern"))+'</button>'+(wa?'<button type="button" class="pillbtn scwa" data-scbarwa>WhatsApp</button>':'')+
    '<button type="button" class="scbx" data-scbarx '+ariaTip(L("Schliessen"))+'>×</button>';
  const close=()=>{clearTimeout(SCBART);b.remove()};
  b.addEventListener("click",e=>{if(e.target.closest("[data-scbared]")){close();scAckDialog(date,sc,u);return}if(e.target.closest("[data-scbarwa]")){scWaOpen(scShareText(date,sc,u,wa),wk,u);setTimeout(close,50);return}if(e.target.closest("[data-scbarx]"))close()});
  document.body.appendChild(b);SCBART=setTimeout(close,wa?12000:8000)}
window.scBar=scBar;
function scShareAsk(date,sc,u,v,force){
  const txt=scShareText(date,sc,u,v),d=mkDialog("scwadlg",null,{replace:true});
  d.innerHTML='<div class="a2box scbox"><h3>'+esc(L("Info per WhatsApp senden?"))+'</h3><p class="scwat">'+esc(txt)+'</p>'+
    '<div class="arb"><button type="button" class="scwa" data-scwago>WhatsApp</button><button type="button" class="lnk" data-scwax>'+esc(L("Nein"))+'</button></div>'+
    '<p class="ghint scwano">'+esc(L("Einstellen pro Art: Mein Konto → App → WhatsApp beim Quittieren."))+'</p></div>';
  d.addEventListener("click",e=>{if(e.target.closest("[data-scwago]"))scWaOpen(txt,scWaKind(date,sc,u,v),u);if(e.target===d||e.target.closest("[data-scwax]")||e.target.closest("[data-scwago]"))setTimeout(()=>d.remove(),50)});
  document.body.appendChild(d)}
/* popup of a quittiert scene: state, begin and end time; «offen» takes the quittance away */
function scAckDialog(date,sc,u){sc=scK(sc,u);const id=scAckId(date,sc),x=scGet(date,sc)||{},st=scState(date,sc);
  const d=mkDialog("scackdlg",null,{replace:true});let cur=st;
  d.innerHTML='<div class="a2box scbox"><h3>'+esc(scLabel(sc))+'</h3><p class="ghint">'+esc(date.split("-").reverse().join("."))+(u&&u!=="1"?' · '+esc((typeof UNAME!=="undefined"&&UNAME[u])||u)+' Unit':'')+'</p>'+
    '<div class="redst scst" role="group" aria-label="'+esc(L("Status"))+'">'+(scBase(sc)==="wrap"?[[0,"offen"],[2,"Drehschluss"]]:[[0,"offen"],[1,scBase(sc)==="lunch"?"Lunch läuft":"läuft"],[2,"abgeschlossen"]]).map(([v,t])=>'<button type="button" class="scstb" data-scst="'+v+'" aria-pressed="'+(st===v)+'"><span class="scack sk'+v+'">'+((v===1&&scBase(sc)==="lunch"?SC_ICO.lunch:v===2&&scBase(sc)==="wrap"?SC_ICO.wrap:SC_ICO[v])||"")+'</span><span class="scstl">'+esc(L(t))+'</span></button>').join("")+'</div>'+
    '<form data-scform novalidate><div class="redrow"><label>'+esc(L("Beginn"))+'<input type="time" name="b" value="'+esc(scHM(x.b||x.at))+'"></label><label>'+esc(L("Ende"))+'<input type="time" name="e" value="'+esc(scHM(x.e))+'"></label></div>'+
    '<p class="amsg" role="alert"></p><div class="arb">'+saveBtn()+saveBtn("data-scwasub",L("Speichern")+" + WhatsApp",'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z"/><path d="M9 10.5c.3 1.6 1.9 3.3 3.6 3.8"/></svg>',"scwab")+'<button type="button" class="lnk" data-scx>'+esc(L("Abbrechen"))+'</button></div>'+(st?'<button type="button" class="lnk scdel" data-scdel>'+esc(L("Quittierung löschen"))+'</button>':'')+'</form></div>';
  const msg=d.querySelector(".amsg"),f=d.querySelector("form");
  d.addEventListener("click",ev=>{const t=ev.target.closest("[data-scst]");if(t){cur=+t.dataset.scst;d.querySelectorAll("[data-scst]").forEach(z=>z.setAttribute("aria-pressed",String(+z.dataset.scst===cur)));f.e.disabled=cur!==2;f.b.disabled=cur===0;return}
    if(ev.target.closest("[data-scdel]")){const bt=ev.target.closest("[data-scdel]");bt.disabled=true;scWrite(date,sc,u,null).then(()=>{d.remove();if(typeof savedPop==="function")savedPop(true)}).catch(err=>{bt.disabled=false;msg.textContent=saveErr(err)});return}
    if(ev.target===d||ev.target.closest("[data-scx]"))d.remove()});
  f.e.disabled=cur!==2;f.b.disabled=cur===0;
  f.addEventListener("submit",async ev=>{ev.preventDefault();if(ev.submitter&&ev.submitter.dataset.scwasub)f.dataset.wa="1";else delete f.dataset.wa;/* reference for a time after midnight: the entry itself, else midday of its day (not «now»: a day in the past would move to the next day) */
    const ref=+x.b||+x.at||scMs(date,"12:00")||Date.now(),bm=scMsNear(date,f.b.value,ref),em=scMsNear(date,f.e.value,bm||ref);
    if(cur===1&&!scParU(u)){const run=scRunning(date,u,id);if(run&&!/^(lunch|setup\d*)$/.test(scBase(run))&&!(typeof confirmSafe==="function"?confirmSafe:window.confirm.bind(window))(L("{s} läuft noch. Parallel laufen lassen?").replace("{s}",scLabel(run)))){msg.textContent=L("{s} läuft noch – zuerst abschliessen.").replace("{s}",scLabel(run));return}}
    if(cur===2&&bm&&em&&em<bm){msg.textContent=L("Das Ende liegt vor dem Beginn.");return}
    /* a day in the past without an end time: «now» would make it days long */
    if(cur===2&&!em&&!x.e&&date<todayISO()&&typeof isoAdd==="function"&&date<isoAdd(todayISO(),-1)){msg.textContent=L("Bitte das Ende eingeben.");return}
    f.querySelectorAll("button[type=submit]").forEach(b=>b.disabled=true);
    try{const nv=cur===0?null:{s:cur,b:bm||x.b||Date.now(),e:cur===2?(em||x.e||Date.now()):null};await scWrite(date,sc,u,nv);d.remove();if(nv&&f.dataset.wa)scShareAsk(date,sc,u,nv,true);else if(typeof savedPop==="function")savedPop(true)}
    catch(err){f.querySelectorAll("button[type=submit]").forEach(b=>b.disabled=false);msg.textContent=saveErr(err)}});
  document.body.appendChild(d)}
window.scAckDialog=scAckDialog;
/* Einstellungen → Log: the scene log (begin, end and duration of every quittiert scene, by day) */
export const SCLOG={list:null,busy:false,open:false};
/* every new visit of «Log» shows it closed again (like the other boxes) */
window.scLogReset=()=>{SCLOG.open=false};
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.lsec==="sclog")SCLOG.open=d.open},true);
async function scLogLoad(){SCLOG.busy=true;try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"sceneack"));SCLOG.list=(q.docs||[]).map(d=>Object.assign({id:d.id},d.data()))}catch(_){SCLOG.list=[]}SCLOG.at=Date.now();SCLOG.busy=false;render()}
/* who sees it: admins and the permission «Szenen-Protokoll sehen» */
window.canSceneLog=()=>typeof isAdmin==="function"&&(isAdmin()||(typeof can==="function"&&can("scenes.log")));
window.sceneLogSec=()=>{if(!canSceneLog())return"";if(!SCLOG.list){if(!SCLOG.busy)scLogLoad();return""}
  const dur=ms=>{const m=Math.max(0,Math.round(ms/60000));return m<60?m+"′":Math.floor(m/60)+"h"+pad2(m%60)};
  const p0=x=>+x.b||+x.at||0,key=x=>x.sc||x.id.split("-").slice(1).join("-"),isEv=k=>{k=scBase(k);return k==="lunch"||k==="wrap"||/^setup\d*$/.test(k)};
  /* the days: every day with quittances and today when it is a shooting day; the newest first */
  const t=todayISO(),days=new Set(SCLOG.list.map(x=>x.d).filter(Boolean));if((S.days||[]).some(d=>d.date===t&&d.kind==="shoot"))days.add(t);
  /* one entry: name, state, planned time; begin, end and duration always (– when not known; running: the counter) */
  /* with «Szenen quittieren»: a pencil per entry opens the same popup as in the Drehplan (state, begin, end, delete) */
  const ED=typeof canPerm==="function"&&canPerm("scenes.ack")&&window.SCACKON!==false,PEN='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
  const row=(name,st,plan,b,e,run,ed,pdm)=>'<li class="scl'+(st===0?' sclo':'')+'"><div class="audh"><b>'+name+'</b>'+(ED&&ed?'<button type="button" class="scled" data-scled="'+esc(ed.join("|"))+'" title="'+esc(L("Ändern"))+'" aria-label="'+esc(L("Ändern"))+'">'+PEN+'</button>':'')+(plan||pdm?' <span class="audt">'+esc(L("Plan"))+' '+esc(plan||'–')+(pdm?' · '+esc(dur(pdm*60000)):'')+'</span>':'')+'<span class="audw">'+(st===2?'✓':'')+'</span></div>'+
    '<div class="audb sclt"><span>'+esc(L("Beginn"))+' <b>'+(b?esc(scHM(b)):'–')+'</b></span><span>'+esc(L("Ende"))+' <b>'+(e?esc(scHM(e)):'–')+'</b></span><span>'+esc(L("Dauer"))+' <b>'+(b&&e?esc(dur(e-b)):b&&run?'<span data-scrun="'+b+'">'+esc(dur(Date.now()-b))+'</span>':'–')+'</b></span></div></li>';
  /* one unit of one day: fixed rows setup (planned begin until the first scene), Drehstart (until the wrap), lunch, wrap – plus the further setups and the scenes, by time */
  const unitRows=(d,u,l,day,cs)=>{const its=arr(u==="2"?(day.unit2||{}).items:u==="3"?(day.unit3||{}).items:day.items);
    const tx=i=>String(i.n||""),ks=scRowKeys(its,tx);
    /* the plan of an entry in the Drehplan: its time and its planned duration (the duration of the row, else until the next row) */
    const pIx=k=>{const b=scBase(k);let i=ks.indexOf(b);if(i<0)i=its.findIndex(x=>x.sc&&scAckId(d,x.sc)===scAckId(d,b));return i};
    const pDur=i=>{if(i<0)return 0;const it=its[i],m=String(it.dur||"").trim().match(/^(\d+)\s*[h:]\s*(\d{1,2})|^(\d+)\s*['′m]/);if(m)return m[3]?+m[3]:(+m[1])*60+(+m[2]);
      const t0=ms(hm(it.t));if(!t0)return 0;for(let j=i+1;j<its.length;j++){const t1=ms(hm(its[j].t));if(t1>t0)return Math.round((t1-t0)/60000)}return 0};
    const pl=k=>{const i=pIx(k);return i>=0?hm(its[i].t)||"":""},pd=k=>pDur(pIx(k));
    const setup=its.find(i=>!i.sc&&/^\s*set[\s-]?up\b/i.test(tx(i))),firstSc=its.find(i=>i.sc);
    const uk=k=>u==="1"?k:k+"_u"+u,get=k=>l.find(x=>scBase(key(x))===k),scs=l.filter(x=>!["lunch","wrap","setup"].includes(scBase(key(x))));
    const real=scs.filter(x=>!isEv(key(x))),start=real.length?Math.min(...real.map(p0).filter(Boolean)):0,lu=get("lunch"),wr=get("wrap");
    const ms=hhmm=>{const v=String(hhmm||"").match(/^(\d{1,2}):(\d{2})$/);if(!v)return 0;const x=new Date(d+"T00:00:00");x.setHours(+v[1],+v[2],0,0);return x.getTime()};
    const plSetup=setup?hm(setup.t)||"":"",plStart=(u==="1"?hm(cs.shootCall||""):"")||(firstSc?hm(firstSc.t)||"":"");
    const wrE=wr?(+wr.e||p0(wr)):0,su=get("setup"),fs=real.slice().sort((a,b)=>p0(a)-p0(b))[0],ent=[],add=(x,name,st,plan,b,e,run,ed,pdm)=>ent.push([x,row(name,st,plan,b,e,run,ed,pdm),{name,st,plan,pdm:pdm||0,b,e,k:ed&&name!==esc(L("Drehstart"))?ed[1]:"",drehstart:name===esc(L("Drehstart"))}]);
    /* setup: its own quittance, else planned begin until the first scene */
    if(su)add(p0(su),"Setup",su.s===1?1:2,plSetup,p0(su),su.s===1?0:+su.e||0,su.s===1&&d===t,[d,uk("setup"),u],pd("setup"));else add(ms(plSetup)||1,"Setup",start?2:0,plSetup,ms(plSetup),start,false,[d,uk("setup"),u],pd("setup"));
    /* Drehstart = begin of the first scene: the pencil opens that scene */
    add(start||ms(plStart)||2,esc(L("Drehstart")),start?(wrE?2:1):0,plStart,start,wrE,!!start&&!wrE&&d===t,fs?[d,key(fs),u]:null,ms(pl("wrap"))&&ms(plStart)?Math.max(0,Math.round((ms(pl("wrap"))-ms(plStart))/60000)):0);
    add(lu?p0(lu):ms(pl("lunch"))||8e15,"Lunch",lu?(lu.s===1?1:2):0,pl("lunch"),lu?p0(lu):0,lu&&lu.s!==1?+lu.e||0:0,!!lu&&lu.s===1,[d,uk("lunch"),u],pd("lunch"));
    for(const x of scs){const k=key(x);add(p0(x),esc(scLabel(k)),x.s===1?1:2,pl(k),p0(x),x.s===1?0:+x.e||0,x.s===1&&d===t,[d,k,u],pd(k))}
    add(wrE||ms(pl("wrap"))||9e15,"Wrap",wr?2:0,pl("wrap"),wrE?start:0,wrE,false,[d,uk("wrap"),u]);
    ent.sort((a,b)=>a[0]-b[0]);return {html:'<ul class="audlist">'+ent.map(e=>e[1]).join("")+'</ul>',n:real.length,start,wrE,rows:ent.map(e=>e[2])}};
  /* shooting day number (DT 1 …): the shooting days with scenes in order */
  const SHD=(S.days||[]).filter(y=>y.kind==="shoot"&&arr(y.items).some(i=>i.sc)).map(y=>y.date).sort();
  /* several units on a day: one part per unit (1st Unit, 2nd Unit …) */
  const EXP=[];SCLOG.exp=EXP;
  /* one daily log per unit: the 1st unit always, the 2nd/3rd unit when they shoot that day or have quittances */
  const html=[...days].sort().reverse().map(d=>{const l=SCLOG.list.filter(x=>x.d===d),day=(S.days||[]).find(y=>y.date===d)||{},cs=((S.dispos||[]).find(y=>y&&y.date===d)||{});
    const hasU=u=>arr((u==="2"?day.unit2:day.unit3)||{}).length||arr(((u==="2"?day.unit2:day.unit3)||{}).items).some(i=>i.sc);
    const us=[...new Set(["1"].concat(l.map(x=>String(x.u||"1")),["2","3"].filter(hasU)))].sort(),dn=SHD.indexOf(d);
    return us.map(u=>{const p=unitRows(d,u,l.filter(x=>String(x.u||"1")===u),day,cs);for(const r of p.rows)EXP.push(Object.assign({dt:dn>=0?"DT "+(dn+1):"",d,u},r));
      return '<details class="tstsu"><summary>'+(dn>=0?'<b>DT '+(dn+1)+'</b> · ':'')+esc(String(d).split("-").reverse().join("."))+' · <b class="sclun">'+esc(((typeof UNAME!=="undefined"&&UNAME[u])||u)+' Unit')+'</b> · '+p.n+' '+esc(L("Szenen"))+(p.start&&p.wrE?' · '+esc(L("Drehzeit"))+' '+esc(dur(p.wrE-p.start)):'')+'</summary>'+p.html+
        '<div class="arb tstbtns sclbtns scld1">'+scIco('data-sclx="pdf|'+d+'|'+u+'"',SCX_PDF,"PDF")+scIco('data-sclx="csv|'+d+'|'+u+'"',SCX_CSV,L("Tabelle")+" (Excel)")+scShBtn()+'</div></details>'}).join("")}).join("");
  return '<details class="tstsec scld" data-lsec="sclog"'+(SCLOG.open?' open':'')+'><summary class="lsum">'+(typeof logHead==="function"?logHead(esc(L("Szenen-Protokoll")),'<span class="tsth">'+SCLOG.list.filter(x=>!isEv(key(x))).length+' '+esc(L("Szenen"))+'</span>',(()=>{const m=Math.max(0,...SCLOG.list.map(x=>+x.at||0))||SCLOG.at||Date.now();const z=new Date(m);return esc(pad2(z.getDate())+"."+pad2(z.getMonth()+1)+". "+scHM(m))})()):esc(L("Szenen-Protokoll")))+'</summary>'+
    '<div class="admins"><p class="ahint">'+esc(L("Beginn, Ende und Dauer jeder quittierten Szene (Drehplan und Callsheet), dazu Setup, Drehstart, Lunch und Wrap."))+'</p>'+
    (html||'<p class="ghint">'+esc(L("Noch keine Einträge."))+'</p>')+
    '<div class="arb tstbtns sclbtns">'+scIco("data-sclre",typeof TST_RUN!=="undefined"?TST_RUN:"↻",L("Neu laden"))+'</div>'+(html?[...new Set(EXP.map(r=>String(r.u)))].sort().map(u=>'<div class="sclbtns sclall"><span class="scll"><b>'+esc(((typeof UNAME!=="undefined"&&UNAME[u])||u)+' Unit')+'</b> · '+esc(L("alle Tage"))+'</span>'+scIco('data-sclx="pdf||'+u+'"',SCX_PDF,"PDF · "+L("alle Tage"))+scIco('data-sclx="csv||'+u+'"',SCX_CSV,L("Tabelle")+" (Excel) · "+L("alle Tage"))+scShBtn()+'</div>').join("")+(new Set(EXP.map(r=>String(r.u))).size>1?'<div class="sclbtns sclall"><span class="scll"><b>'+esc(L("Alle Units"))+'</b> · '+esc(L("alle Tage"))+'</span>'+scIco('data-sclx="pdf||"',SCX_PDF,"PDF · "+L("Alle Units"))+scIco('data-sclx="csv||"',SCX_CSV,L("Tabelle")+" (Excel) · "+L("Alle Units"))+scShBtn()+'</div>':''):'')+'</div></details>'};   /* the export always per unit */
/* round buttons with a symbol (like the other Log menus); the name as tooltip */
const SCX_PDF='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 16.5v-4h1.6a1.3 1.3 0 0 1 0 2.6H9.5"/><path d="M14 12.5v4"/></svg>';
const SCX_CSV='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 10h17M3.5 14.5h17M9.5 5v14M15 5v14"/></svg>';
/* Google Sheets: a sheet with a green-ish grid and an arrow out */
const SCX_SHEET='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M8.6 3.5h6.8l6.1 10.6-3.4 5.9H5.9l-3.4-5.9z"/><path d="M8.6 3.5l6.1 10.6h6.8M15.4 3.5L9.3 14.1 5.9 20M2.5 14.1h12.2"/></svg>';
/* next to every download: open the Google Sheet (when one is set in the App-Verwaltung) */
const scShBtn=()=>/^https:\/\/docs\.google\.com\/spreadsheets\//.test(window.SCENESHEET||"")?scIco("data-sclsh",SCX_SHEET,L("Szenen-Protokoll in Google Sheets öffnen")):"";
const scIco=(attr,ic,t)=>typeof tstIco==="function"?tstIco(attr,ic,t):'<button type="button" class="pillbtn" '+attr+'>'+esc(t)+'</button>';
/* export of the scene log: as a table (CSV for Excel, Numbers, Google Sheets) or as PDF (print view → «Als PDF sichern»); oldest day first */
/* one table per day – and per unit when the export holds all units */
const scDK=uu=>r=>r.dt+" · "+r.date+(uu?"":" · "+r.unit);
/* Drehstart and Wrap: no duration in the exports (they are points in time) */
const scNoDur=r=>!!r.drehstart||scBase(r.k||"")==="wrap";
function scExpRows(d,u){const un=s=>{const x=document.createElement("textarea");x.innerHTML=String(s||"");return x.value};
  return (SCLOG.exp||[]).filter(r=>(!d||r.d===d)&&(!u||String(r.u)===u)).sort((a,b)=>a.d.localeCompare(b.d)).map(r=>Object.assign({dt:r.dt,date:r.d.split("-").reverse().join("."),unit:((typeof UNAME!=="undefined"&&UNAME[r.u])||r.u)+" Unit",name:un(r.name),
    st:r.st,inv:!!r.drehstart||/^(lunch|wrap)$/.test(scBase(r.k||"")),state:r.st===2?"✓":"",plan:r.plan||"",pmin:r.pdm&&!scNoDur(r)?String(r.pdm):"",b:r.b?scHM(r.b):"",e:r.e?scHM(r.e):"",min:r.b&&r.e&&!scNoDur(r)?String(Math.round((r.e-r.b)/60000)):"",diff:r.b&&r.e&&r.pdm&&!scNoDur(r)?String(Math.round((r.e-r.b)/60000)-r.pdm):""},scInfo(r)))}
/* more about a scene for the export: I/E, set, pages, cast and the description from the Drehplan of that day (and unit) */
function scInfo(r){const k=scBase(r.k||""),E={ie:"",set:"",pg:"",cast:"",desc:""};
  /* setup and Drehstart: the I/E of the scene that follows (setup: the next scene after its row, Drehstart: the first scene of the day) */
  if(/^setup\d*$/.test(k)||r.drehstart){const day=(S.days||[]).find(y=>y.date===r.d)||{},its=arr(r.u==="2"?(day.unit2||{}).items:r.u==="3"?(day.unit3||{}).items:day.items);
    let i=0;if(!r.drehstart){i=scRowKeys(its,x=>String(x.n||"")).indexOf(k);if(i<0)i=0}const nx=its.slice(i).find(x=>x.sc);return Object.assign(E,{ie:nx&&nx.ie||""})}
  if(!k||/^(lunch|wrap)$/.test(k)||typeof schedIndex!=="function")return E;
  let o=null;try{const l=schedIndex()[norm(k)]||[];o=l.find(y=>y.d&&y.d.date===r.d&&String(y.u||"1")===String(r.u||"1"))||l.find(y=>y.d&&y.d.date===r.d)||null}catch(_){}
  const it=(o&&o.it)||{},cm=(S.meta&&S.meta.cast)||{};
  return {ie:it.ie||"",set:it.set||"",pg:it.pg||"",cast:arr(it.cast).map(i=>cm[i]?i+" "+cm[i]:i).join(", "),desc:typeof TX==="function"?TX(it,"d")||"":(it.d||"")}}
/* Excel file (.xlsx) with a filter on every column and the first line fixed: a small zip (stored, no compression) written here – no library needed.
   Texts stay texts («1 1/8» is no date), durations are numbers */
const SCZ_CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function scZip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  const u16=v=>[v&255,(v>>>8)&255],u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  for(const [name,txt] of files){const d=enc.encode(txt),n=enc.encode(name);let c=0xFFFFFFFF;for(const b of d)c=SCZ_CRC[(c^b)&255]^(c>>>8);c=(c^0xFFFFFFFF)>>>0;
    const h=[...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0)];
    parts.push(new Uint8Array(h),n,d);cen.push([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)],n);off+=h.length+n.length+d.length}
  let cl=0;const cp=[];for(let i=0;i<cen.length;i+=2){const a=new Uint8Array(cen[i]);cp.push(a,cen[i+1]);cl+=a.length+cen[i+1].length}
  const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cl),...u32(off),...u16(0)]);
  return new Blob([...parts,...cp,end],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
function scXlsx(head,data,name,title,stand){const x=v=>String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,"");
  const col=i=>{let s="";i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
  const NUM=new Set([9,12,13]);   /* Plan-Dauer, Dauer, Diff. */
  const TIME=new Set([8,10,11]),CEN=4;   /* Plan, Start, Ende: real times (hh:mm); column E (S) centred */
  /* styles: 0 normal, 1 bold, 2 time, 3 centred – +4 the same with a thick line below (between the shooting days); no other lines */
  const cell=(v,r,c,h,thick)=>{const ref=col(c)+r,tk=thick?4:0;if(v===""||v==null)return thick?'<c r="'+ref+'" s="'+tk+'"/>':"";
    if(!h&&TIME.has(c)){const m=String(v).match(/^(\d{1,2}):(\d{2})$/);if(m)return '<c r="'+ref+'" s="'+(2+tk)+'"><v>'+((+m[1]*60+ +m[2])/1440)+'</v></c>'}
    if(!h&&NUM.has(c)&&/^-?\d+$/.test(String(v)))return '<c r="'+ref+'"'+(tk?' s="'+tk+'"':'')+'><v>'+v+'</v></c>';
    const st=(h||c===0?1:c===CEN?3:0)+tk;return '<c r="'+ref+'" t="inlineStr"'+(st?' s="'+st+'"':'')+'><is><t xml:space="preserve">'+x(v)+'</t></is></c>'};
  const R0=title?1:0,rows=[head].concat(data),FC=head.indexOf("Set")>=0?head.indexOf("Set"):head.length-1,last=col(FC)+(rows.length+R0),
    W=head.map((_,i)=>i===0?24:Math.min(70,Math.max(5,...rows.map(r=>String(r[i]==null?"":r[i]).length))+3));   /* column A fixed; the others as wide as their longest entry (+ room for the filter arrow) */
  /* thick line between the shooting days: below the last row of a day (date in column C changes) */
  const wrap=ri=>ri>0&&ri<rows.length-1&&String(rows[ri][2]||"")!==String(rows[ri+1][2]||"");
  const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="1"><pane ySplit="'+(1+R0)+'" topLeftCell="A'+(2+R0)+'" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+
    head.map((_,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(W[i]||12)+'" customWidth="1"/>').join("")+'</cols><sheetData>'+(title?'<row r="1">'+cell(title,1,0,true)+(stand?cell(stand,1,head.length-1,true):'')+'</row>':'')+
    rows.map((r,ri)=>'<row r="'+(ri+1+R0)+'">'+(wrap(ri)?head.map((_,ci)=>cell(r[ci],ri+1+R0,ci,false,true)):r.map((v,ci)=>cell(v,ri+1+R0,ci,ri===0))).join("")+'</row>').join("")+'</sheetData><autoFilter ref="A'+(1+R0)+':'+last+'"/>'+(title?'<mergeCells count="1"><mergeCell ref="A1:'+col(FC)+'1"/></mergeCells>':'')+'</worksheet>';
  const files=[["[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ["_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ["xl/workbook.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+x(L("Szenen-Protokoll").slice(0,31))+'" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">\''+x(L("Szenen-Protokoll").slice(0,31))+'\'!$A$'+(1+R0)+':$'+col(FC)+'$'+(rows.length+R0)+'</definedName></definedNames></workbook>'],
    ["xl/_rels/workbook.xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ["xl/styles.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="2"><border/><border><left/><right/><top/><bottom style="thick"><color rgb="FF000000"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="8"><xf/><xf fontId="1" applyFont="1"/><xf numFmtId="164" applyNumberFormat="1"/><xf applyAlignment="1"><alignment horizontal="center"/></xf><xf borderId="1" applyBorder="1"/><xf fontId="1" borderId="1" applyFont="1" applyBorder="1"/><xf numFmtId="164" borderId="1" applyNumberFormat="1" applyBorder="1"/><xf borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf></cellXfs></styleSheet>'],
    ["xl/worksheets/sheet1.xml",sheet]];
  saveBlob(scZip(files),name)}
const SCX_HEAD=()=>[L("Aktion"),"DT",L("Datum"),"Unit","S","I/E",L("Seiten"),"Set",L("Plan"),"PD",L("Start"),L("Ende"),L("Dauer"),L("Diff."),L("Beschreibung")];   /* no cast in the scene log */
document.addEventListener("click",e=>{const g=e.target.closest&&e.target.closest("[data-sclsh]");if(g){e.preventDefault();const u=window.SCENESHEET||"";if(/^https:\/\/docs\.google\.com\/spreadsheets\//.test(u))window.open(u,"_blank","noopener");return}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-sclx]");if(!b)return;e.preventDefault();const [k,dd,uu]=b.dataset.sclx.split("|"),rows=scExpRows(dd,uu),z0=new Date(),UN0=uu?((typeof UNAME!=="undefined"&&UNAME[uu])||uu)+" Unit":[...new Set(rows.map(r=>r.unit))].join(" + "),
    /* file name like the title (project · scene log · unit, the day when it is one day) with the time of the export, American date */
    stamp=[UN0.replace(/\s*\+\s*/g,"+").replace(/\s+/g,"-"),dd?dd.split("-").slice(1).concat(dd.split("-")[0]).join("-"):"",pad2(z0.getMonth()+1)+"-"+pad2(z0.getDate())+"-"+z0.getFullYear()+"_"+pad2(z0.getHours())+"-"+pad2(z0.getMinutes())].filter(Boolean).join("_"),
    TITLE=projName()+" · "+L("Szenen-Protokoll")+(UN0?" · "+UN0:"")+(dd?" · "+dd.split("-").reverse().join("."):"");
  const cells=r=>[r.name,r.dt,r.date,r.unit,r.state,r.ie,r.pg,r.set,r.plan,r.pmin,r.b,r.e,r.min,r.diff,r.desc];
  if(k==="csv"){const data=rows.map(cells);scXlsx(SCX_HEAD(),data,projFile()+"_Szenen-Protokoll_"+stamp+".xlsx",TITLE,L("Stand")+" "+pad2(z0.getDate())+"."+pad2(z0.getMonth()+1)+"."+z0.getFullYear()+" "+pad2(z0.getHours())+":"+pad2(z0.getMinutes()));return}
  const UN=uu?((typeof UNAME!=="undefined"&&UNAME[uu])||uu)+" Unit":[...new Set(rows.map(r=>r.unit))].join(" + "),HD=[L("Eintrag"),L("Status"),"I/E · "+L("Seiten"),"Set · "+L("Beschreibung")],HD2=[L("Zeit"),L("Dauer")+" (min)",L("Beginn"),L("Ende"),L("Dauer")+" (min)",L("Diff.")+" (min)"],days=[...new Set(rows.map(scDK(uu)))];
  /* the same columns on every day: fixed widths (entry, state, I/E, set, pages, plan, planned duration, begin, end, duration); the description in a second line below */
  const COLS='<colgroup>'+[14,6,8,29,7,8,7,7,7,7].map(w=>'<col style="width:'+w+'%">').join("")+'</colgroup>';
  const doc='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(projName())+' · '+esc(L("Szenen-Protokoll"))+' '+esc(UN)+' '+esc(stamp)+'</title><style>body{font:11px/1.35 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#111}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:0 0 6px;break-after:avoid}.day{break-inside:avoid;page-break-inside:avoid;margin:0 0 14px}table{table-layout:fixed}table{border-collapse:collapse;width:100%;break-inside:auto}th,td{border-bottom:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f2f2f2;vertical-align:bottom}th.scg{text-align:left;border-left:1px solid #ccc}td.n{font-variant-numeric:tabular-nums;white-space:nowrap}tbody.o td{color:#888}tbody.e{break-inside:avoid}tr.scl1 td{border-bottom:0;padding-bottom:1px}tr.scl2 td{padding-top:0}td.scred{color:#c81e1e;font-weight:700}td.scxd{font-size:10.5px;color:#333;min-width:40mm}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>'+esc(projName())+' · '+esc(L("Szenen-Protokoll"))+(UN?' · '+esc(UN):'')+'</h1>'+
    days.map(k=>'<div class="day"><h2>'+esc(k.replace(/^ · /,""))+'</h2><table>'+COLS+'<thead><tr>'+HD.map(h=>'<th rowspan="2">'+esc(h)+'</th>').join("")+'<th colspan="2" class="scg">'+esc(L("Plan"))+'</th><th colspan="4" class="scg">'+esc(L("Dreh"))+'</th></tr><tr>'+HD2.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead>'+
      rows.filter(r=>scDK(uu)(r)===k).map(r=>{const c=[r.name,r.state,r.ie,r.set,r.plan,r.pmin,r.b,r.e,r.min,(+r.diff>0?"+":"")+r.diff],sc=!!(r.desc||r.pg);return '<tbody class="e'+(r.st?'':' o')+'"><tr'+(sc?' class="scl1"':'')+'>'+c.map((v,i)=>'<td'+(i>=4?' class="n'+(i===9&&+r.diff>0?' scred':'')+'"':'')+'>'+esc(v)+'</td>').join("")+'</tr>'+(sc?'<tr class="scl2"><td></td><td></td><td class="n">'+esc(r.pg||"")+'</td><td colspan="7" class="scxd">'+esc(r.desc||"")+'</td></tr>':'')+'</tbody>'}).join("")+'</table></div>').join("")+'</body></html>';
  /* a real PDF (jsPDF, loaded only when needed) that opens directly in the PDF reader; without it the print view below */
  let pw=null;try{pw=window.open("","_blank")}catch(_){}   /* the window is opened during the tap (else the browser blocks it) and gets the PDF when it is ready */
  scPdf(rows,days,UN,stamp,pw,uu).catch(err=>{console.error(err);try{if(pw)pw.close()}catch(_){}scPrint(doc)});return});
/* load a script of the app once (same origin, allowed by the page) */
const scLoad=src=>new Promise((ok,no)=>{if(document.querySelector('script[data-src="'+src+'"]'))return ok();const x=document.createElement("script");x.src=src;x.dataset.src=src;x.onload=()=>ok();x.onerror=()=>no(new Error(src));document.head.appendChild(x)});
async function scPdf(rows,days,UN,stamp,pw,uu){
  if(!(window.jspdf&&window.jspdf.jsPDF)){await scLoad("jspdf.js");await scLoad("jspdf.autotable.js")}
  const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  /* the built-in font knows only Latin letters: Hindi labels in English, signs that it lacks replaced */
  const T=k=>LANG==="hi"?(((I18N[k]||{}).en)||k):L(k),C=v=>String(v==null?"":v).replace(/[′’]/g,"'").replace(/[^\x20-\x7E\xA0-\xFF–—…€]/g,"");
  doc.setFontSize(15);doc.text(C(projName()+" · "+T("Szenen-Protokoll")+(UN?" · "+UN:"")),12,14);
  /* right of the title: the production company in capitals (and its address below, small) – App-Verwaltung → Produktion */
  {const co=String(window.PRODCO||"").trim(),ad=String(window.PRODADDR||"").trim();if(co){doc.setFontSize(11);doc.setFont(undefined,"bold");doc.text(C(co.toUpperCase()),285,12,{align:"right"});doc.setFont(undefined,"normal")}
   if(ad){doc.setFontSize(7.5);doc.setTextColor(90);doc.text(C(ad.replace(/\s*\n\s*/g,", ")),285,co?16:12,{align:"right"});doc.setTextColor(0)}}
  /* two header rows: «Plan» over time and duration, «Dreh» over begin, end and duration */
  const g=t=>({content:C(t),colSpan:t===T("Plan")?2:4,styles:{halign:"center"}}),r2=t=>({content:C(t),rowSpan:2,styles:{valign:"bottom"}});
  /* column lines always through; thicker after «Set / Beschreibung» and after «Plan» */
  const TH=.8,lw=(i,t,b)=>({top:t,bottom:b,left:i===4||i===6?TH:.2,right:i===3||i===5?TH:.2});
  const hc=(t,i,x)=>Object.assign({content:t,styles:Object.assign({lineWidth:lw(i,.2,.2)},x&&x.styles)},x&&x.o);
  const head=[[hc(C(T("Aktion")),0,{o:{rowSpan:2},styles:{valign:"top"}}),hc("S",1,{o:{rowSpan:2},styles:{valign:"top",halign:"center"}}),hc("I/E\n"+C(T("Seiten")),2,{o:{rowSpan:2},styles:{valign:"top"}}),hc("Set\n"+C(T("Beschreibung")),3,{o:{rowSpan:2},styles:{valign:"top"}}),
    Object.assign(hc(C(T("Plan")),4,{o:{colSpan:2},styles:{halign:"left"}}),{}),hc(C(T("Dreh")),6,{o:{colSpan:4},styles:{halign:"left"}})],
    [T("Zeit"),T("Dauer"),T("Start"),T("Ende"),T("Dauer"),T("Diff.")].map((t,j)=>hc(C(t),j+4,{styles:{halign:"left"}}))];
  head[0][4].styles.lineWidth.right=TH;
  const W=[38,9,22,127,13,13,13,13,13,13];
  /* the description in one line: shortened with … when it is too long */
  const fit1=t=>{if(!t)return t;doc.setFontSize(8);const w=W[3]-3;if(doc.getTextWidth(t)<=w)return t;let a=t;while(a.length>1&&doc.getTextWidth(a+"…")>w)a=a.slice(0,-1);return a.replace(/\s+\S*$/,"").replace(/[\s,.;:–-]+$/,"")+"…"};   /* all time columns the same width */let y=20;
  for(const k of days){const rs=rows.filter(r=>scDK(uu)(r)===k),body=[];
    /* Drehstart, Lunch and Wrap inverted (white on black); no line between the two lines of one entry, only between entries */
    for(const r of rs){const sc=!!(r.desc||r.pg),o=r.inv?{fillColor:25,textColor:r.st?255:175,lineColor:90}:r.st?{}:{textColor:140};
      /* difference: more time than planned in red */
      const df=r.diff===""?"":(+r.diff>0?"+":"")+r.diff,red=+r.diff>0?{textColor:r.inv?[255,110,110]:[200,30,30],fontStyle:"bold"}:{};
      body.push([r.name,r.st===2?"":"",r.ie,r.set,r.plan,r.pmin,r.b,r.e,r.min,df].map((v,i)=>({content:C(v),styles:Object.assign({fontStyle:i===0?"bold":"normal",fontSize:i===0?9.5:8.5,lineWidth:lw(i,.2,sc?0:.2)},sc?{cellPadding:{top:1,bottom:0,left:1.4,right:1.4}}:{},o,i===9?red:{}),_done:i===1&&r.st===2})));
      if(sc)body.push(["","",C(r.pg),fit1(C(r.desc)),"","","","","",""].map((v,i)=>({content:v,styles:Object.assign({lineWidth:lw(i,0,.2),cellPadding:{top:0,bottom:1,left:1.4,right:1.4}},o,i===3?Object.assign({fontSize:8},r.inv?{}:{textColor:r.st?70:140}):{})})))}
    /* a day that does not fit on the rest of the page starts on a new one */
    /* several days: every day on a page of its own */if(y>30){doc.addPage();y=14}
    doc.setFontSize(11);doc.text(C(k.replace(/^ · /,"")),12,y+5);
    doc.autoTable({startY:y+8,head,body,margin:{left:12,right:12,bottom:14},theme:"grid",tableWidth:"wrap",columnStyles:Object.fromEntries(W.map((w,i)=>[i,{cellWidth:w}])),
      styles:{fontSize:8.5,cellPadding:{top:1,bottom:1,left:1.4,right:1.4},lineColor:150,lineWidth:.2,overflow:"linebreak"},headStyles:{fillColor:[242,242,242],textColor:20,fontStyle:"bold",fontSize:8,cellPadding:{top:.6,bottom:.6,left:1.4,right:1.4},minCellHeight:0},rowPageBreak:"avoid",
      didDrawCell:h=>{if(h.section==="body"&&h.cell.raw&&h.cell.raw._done){const c=h.cell,x=c.x+c.width/2-2,yy=c.y+c.height/2;doc.setDrawColor(40,150,90);doc.setLineWidth(.6);doc.line(x,yy,x+1.4,yy+1.4);doc.line(x+1.4,yy+1.4,x+4,yy-1.6)}}});
    y=doc.lastAutoTable.finalY+6}
  /* footer on every page: who exported it (left), page x of y (middle), date and time of the export (right) */
  {const n=doc.getNumberOfPages(),z=new Date(),who=(()=>{/* the signed-in user who makes the export (not the person chosen in «Meine Termine») */try{if(typeof MEMBER!=="undefined"&&MEMBER){const n=mName(MEMBER);if(n)return n}}catch(_){}try{if(typeof ME!=="undefined"&&ME)return ME.displayName||ME.email||""}catch(_){}return ""})(),when=pad2(z.getDate())+"."+pad2(z.getMonth()+1)+"."+z.getFullYear()+" "+pad2(z.getHours())+":"+pad2(z.getMinutes());
   for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(90);doc.text(C(who),12,203);doc.text(i+"/"+n,148.5,203,{align:"center"});doc.text(C(when),285,203,{align:"right"})}doc.setTextColor(0)}
  const blob=doc.output("blob"),url=URL.createObjectURL(blob),name=projFile()+"_Szenen-Protokoll_"+stamp+".pdf";
  /* open in the PDF reader of the device; where a new window is not possible, as a download */
  if(pw&&!pw.closed)pw.location.href=url;else saveBlob(blob,name)
  setTimeout(()=>URL.revokeObjectURL(url),300000)}
/* the print view in a new window (a page of its own from a blob), its print dialog offers «Als PDF sichern» */
function scPrint(doc){
  const url=URL.createObjectURL(new Blob([doc],{type:"text/html;charset=utf-8"})),w=window.open(url,"_blank");
  if(w){const go=()=>{try{w.focus();w.print()}catch(_){}};try{w.addEventListener("load",()=>setTimeout(go,200))}catch(_){setTimeout(go,800)}setTimeout(()=>URL.revokeObjectURL(url),120000);return}
  /* pop-ups blocked: print from a hidden frame */
  const f=document.createElement("iframe");f.style.cssText="position:fixed;width:0;height:0;border:0;right:0;bottom:0";f.addEventListener("load",()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(_){}setTimeout(()=>{f.remove();URL.revokeObjectURL(url)},60000)});f.src=url;document.body.appendChild(f)}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-sclre]")){SCLOG.list=null;render()}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-scled]");if(!b)return;e.preventDefault();e.stopPropagation();const [d,k,u]=b.dataset.scled.split("|");scAckDialog(d,k,u||"1")},true);
export function setSCSUB(v){return SCSUB=v}   /* other parts change SCSUB only through this */
