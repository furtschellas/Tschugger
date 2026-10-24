import {HIT,L,LANG,MEMO,S,TX,TXA,WD,ariaTip,blockTag,ddmm,driveMin,esc,fmtDate,isoAdd,itemHTML,pad2,pickDay,pvButtons,safeUrl,todayISO} from "./10-core.js";
import {UNAME,UNITBAR,dayNav,dayPlaces,findPerson,groupPeople,hasSelU,hasU,mailPeople,makeICS,nextUnitDay,nmk,onlyU,planDays,ppItems,ppNames,ppParts,ppWhere,setPPPEOPLE,zurichUTC} from "./11-schedule-prep.js";
import {addrForItem,emptyHTML} from "./13-crew-views.js";
import {csMe} from "./13a-callsheet.js";
import {csLocs,csPlace} from "./13c-cs-places.js";
import {csShort} from "./13d-cs-mine.js";
import {perm,vok} from "./14-render.js";
import {fold,render} from "./15-script-tab.js";
import {store} from "./16-interaction.js";
import {arr} from "./20-data-start.js";
import {ME,MEMBER} from "../boot/03-core-firebase.js";
import {ADM,ensureAdm} from "../boot/12a-admin-core.js";
/* ---------- «Meine Termine»: every event of all documents (shooting schedule, callsheets, weekly schedule, transport) the signed-in person takes part in ---------- */
const NOSET=/^(postprod|verleih|buchhalt|autor|casting)/i;
const myAdmin=()=>{try{return typeof window.canPerm!=="function"||window.canPerm("mycal.all")}catch(_){return false}};
/* admins can look at the appointments of another person (Meine Termine → «Termine für»); that choice also fills Today and «Mein Drehtag»:
   a bar says so, with the way back to the own data */
export function myPickBar(){let pick="";try{if(window.PICKON&&myAdmin()&&!(window.simOn&&window.simOn()))pick=(window.MYPICK||"")||""}catch(_){}if(!pick)return "";
  let own="";try{if(typeof MEMBER!=="undefined"&&MEMBER)own=[MEMBER.firstName,MEMBER.lastName].filter(Boolean).join(" ")||MEMBER.name||""}catch(_){}
  if(own&&fold(own)===fold(pick))return "";
  return '<div class="mypickbar" role="status">'+esc(L("Du siehst die Daten von"))+' <b>'+esc(pick)+'</b> '+esc(L("(gewählt in Meine Termine)."))+' <button type="button" class="pillbtn" data-mypickoff>'+esc(L("Zu meinen Daten"))+'</button></div>'}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-mypickoff]")){e.preventDefault();window.MYPICK="";try{MEMO.clear()}catch(_){}render()}});
export function myIdentity(){
  const people=mailPeople();let nm="",em="";
  try{em=String(window.simEmail?window.simEmail():(typeof ME!=="undefined"&&ME&&ME.email)||"").toLowerCase()}catch(_){}
  try{if(typeof MEMBER!=="undefined"&&MEMBER)nm=[MEMBER.firstName,MEMBER.lastName].filter(Boolean).join(" ")||MEMBER.name||""}catch(_){}
  let pick="";try{if(window.PICKON&&myAdmin()&&!(window.simOn&&window.simOn()))pick=(window.MYPICK||"")||""}catch(_){} /* simulating: always the simulated person, never my own pick */
  let p=null;
  if(pick)p=people.find(x=>x.name===pick)||{name:pick,k:nmk(pick)};
  if(!p&&em)p=people.find(x=>x.email===em&&x.src!=="user");
  if(!p&&nm)p=findPerson(nm,people.filter(x=>x.src!=="user"))||findPerson(nm,people);
  if(!p&&(nm||em))p={name:nm||em,email:em,k:nmk(nm||em)};
  if(p){const c=people.find(x=>x.k===p.k&&x.src&&x.src!=="user");if(c)p=Object.assign({},c,{email:p.email||c.email})}
  return p;
}
function iAmIn(names,me,people){
  for(const raw of names){const n=raw.replace(/\([^)]*\)/g," ").replace(/\b(tbc|tba|tbd)\b/ig,"").replace(/\s+/g," ").trim();if(!n)continue; /* «Anna Muster (online tbc)» → Anna Muster */
    const g=groupPeople(n,people);if(g){if(g.list.some(x=>(me.email&&x.email===me.email)||x.k===me.k))return true;continue}
    const f=findPerson(n,[me]);if(f)return true}
  return false;
}
export function hm(t){const m=String(t||"").match(/(\d{1,2}):(\d{2})/);return m?pad2(+m[1])+":"+m[2]:""}
/* a ride of a callsheet: the same id for everyone (date, times, places, vehicle – no names) */
export function rideId(date,r){if(r&&r._rid)return r._rid;const s=[date,hm(r.t1),hm(r.t2),String(r.from||"").trim(),String(r.to||"").trim(),String(r.vehicle||"").trim()].join("|").toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "r"+(h>>>0).toString(36)}
/* map link of a ride's start or destination, from the callsheet: a link in the text of the ride, else the place of the callsheet with that
   name, code (L1, Set 1, Base, P1 …) or kind (Base, Lunch …) – its map link, else its address; else Motivliste, location list (Infos) and the internal
   Google map; links only from these sources (no free Google search by name – a wrong place is worse than none) */
export function rideMap(v,dp,always){const raw=String(v||""),u=(raw.match(/https?:\/\/\S+/)||[])[0];if(u)return u;const txt=raw.replace(/https?:\/\/\S+/g,"").trim(),n=fold(txt);if(!n)return "";
  const words=new Set(n.split(/[^a-z0-9]+/).filter(Boolean)),isA=t=>/\d{4}\s+\p{L}/u.test(String(t||""));
  const ls=typeof csLocs==="function"&&dp&&dp.cs?csLocs(dp.cs):arr(dp&&dp.locations);
  const code=l=>{try{return typeof csShort==="function"?fold(csShort(l)):""}catch(_){return ""}};
  const num=(n.match(/\b(?:set|loc\.?|location|l)\s*(\d+[a-z]?)\b/)||[])[1];
  const hit=l=>{const m=fold(String(l&&l.name||""));if(m&&(m===n||m.includes(n)||n.includes(m)))return true;const c=code(l);if(c&&words.has(c))return true;
    if(num&&String(l.no||"").trim().toLowerCase()===num)return true;return arr(l.kinds).some(k=>words.has(fold(k).split(" ")[0]))};
  const l=ls.find(hit);
  if(l){if(/^https:\/\//.test(String(l.map||"")))return l.map;const ad=[l.name].concat(arr(l.notes)).find(isA);if(ad)return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(ad)}
  /* lines of the sets («Tech Parking» …) and the location list, with the names as on the callsheet */
  try{const p=typeof csPlace==="function"&&dp&&dp.cs?csPlace(dp.cs,txt):null;if(p&&p.map)return p.map;if(p&&p.addr)return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p.addr)}catch(_){}
  /* then only the production's own sources (no free Google search): Motivliste, location list / Infos, the internal Google map (My Maps) */
  const same=x=>{const k=fold(String(x||"")).trim();return k.length>2&&(k===n||k.includes(n)||n.includes(k))};
  const q=a=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(a);
  for(const x of arr(S.locs))if(x&&(same(x.name)||same(x.venue))){if(/^https:\/\//.test(String(x.map||"")))return x.map;const ad=[x.venue,x.address].filter(Boolean).join(", ");if(isA(ad))return q(ad)}
  for(const g of arr(S.places))for(const x of arr(g&&g.items))if(x&&same(x.name)){if(/^https:\/\//.test(String(x.map||"")))return x.map;if(x.address)return q(x.name+", "+x.address)}
  try{for(const f of arr(S.gmap&&S.gmap.f))if(f&&same(f.n)&&Array.isArray(f.x)&&Array.isArray(f.x[0])&&isFinite(f.x[0][0])&&isFinite(f.x[0][1]))return q(f.x[0][0]+","+f.x[0][1])}catch(_){}
  /* an address written in the callsheet itself */
  return isA(txt)?q(txt):""}
export function myEvents(me){try{if(window.rideEditApply)rideEditApply()}catch(_){}
  const out=[],people=mailPeople(),t=todayISO();
  for(const d of (vok("prep")?S.prepro:[])){if(d.date<t)continue;
    for(const [grp,list] of [["i",d.items],["p",arr(d.parallel)]])list.forEach((i,k)=>{if(/^(rest|ruhetag|frei|off|day off)$/i.test(String(i.n||"").trim()))return;if(iAmIn(ppNames(i.crew).concat(ppNames(i.cast)),me,people))out.push({date:d.date,t:hm(i.t)||i.t||"",end:hm(i.end),n:i.n,where:i.where,map:i.map,src:"Weekly Schedule",go:shootOn(d.date)?d.date:"prep:"+d.date,cal:d.date+"|"+grp+"|"+k})});
    const tr=d.transport;if(tr)arr(tr.rows).forEach(r=>{if(iAmIn(ppNames(r.name),me,people))out.push({date:d.date,t:hm(r.at)||r.at||"",n:"Transport → "+(r.to||""),where:r.from,map:r.fromMap,src:"Transport",go:shootOn(d.date)?d.date:"prep:"+d.date,driver:r.driver})})}
  /* shooting days only from the callsheets: the day counts when its callsheet calls my department, lists me by name, or (general crew call) I work on set */
  for(const dp of S.dispos){if(!dp||dp.date<t)continue;const d=S.days.find(x=>x.date===dp.date)||{};
    const myDep=fold(me.src||"").split(/[\s/]/)[0];
    const call=myDep?arr(dp.calls).find(z=>fold(z.dept||"").includes(myDep)):null;
    const named=arr(dp.contacts).concat(arr(dp.cast).map(c=>({name:c.actor}))).some(c=>c&&c.name&&findPerson(c.name,[me]));
    const onSet=me.src&&!NOSET.test(fold(me.src));
    if(!call&&!named&&!onSet)continue;
    const st=hm(call&&call.t)||hm(dp.crewCall)||hm(dp.generalCall)||"",en=hm(dp.wrap);
    const loc=arr(dp.locations).map(l=>l.name||l.address).filter(Boolean).join(", ")||(d.kind?dayPlaces(d).join(", "):"");
    out.push({date:dp.date,t:st,end:en,n:(d.short||dp.label||d.label||"")+" · "+L("Drehtag")+(call&&call.dept?" ("+call.dept+")":""),where:loc,map:(arr(dp.locations)[0]||{}).map||"",src:"Callsheet"+(dp.version?" "+dp.version:""),go:d.id||dp.date})}
  /* my rides from the callsheets (driver, passenger, crew transport, travel) */
  try{const cm=typeof csMe==="function"?csMe():null;if(cm)for(const dp of S.dispos){if(!dp||dp.date<t||!dp.cs)continue;const c=dp.cs,d=S.days.find(x=>x.date===dp.date)||{};
    const rides=[...arr(c.transport).filter(r=>cm.hit(r.driver)||cm.hit(r.passengers)).map(r=>({r,drv:cm.hit(r.driver)})),...arr(c.crewTransport).filter(r=>cm.hit(r.people)).map(r=>({r,crew:true})),...arr(c.travel).filter(r=>cm.hit(r.name)).map(r=>({r,how:r.how}))];
    for(const {r,drv,how,crew} of rides){const st=hm(r.t1);if(!st&&!hm(r.t2))continue;const clean=v=>String(v||"").replace(/https?:\/\/\S+/g,"").trim();
      /* a confirmed ride disappears one hour after its arrival */
      const rid=rideId(dp.date,r);if(window.rideState&&rideState(rid)===2){const end=hm(r.t2)||st;if(end&&Date.now()>zurichUTC(dp.date,end).getTime()+3600e3){window.RIDEHID=(window.RIDEHID||0)+1;if(!window.SHOWDONE)continue}}
      /* more about the ride: who drives (with the phone from the callsheet's driver line), who rides along, notes */
      const dn=drv?"":clean(r.driver),dph=dn&&vok("phone")?((String(c.drivers||"").split(/\s*[|\n;]\s*/).find(x=>fold(x).includes(fold(dn.split(" ")[0])))||"").match(/\+?\d[\d ]{7,}\d/)||[""])[0]:"";
      const pax=clean(r.passengers||r.people||"").split(/\s*,\s*/).filter(x=>x&&!cm.hit(x)).join(", ");   /* the others in the car */
      out.push({date:(how&&r.date)||dp.date,t:st,end:hm(r.t2),n:(drv?L("Fahrer"):how||L("Fahrt"))+": "+[clean(r.from),clean(r.to)].filter(Boolean).join(" → ")+(r.vehicle?" ("+r.vehicle+")":""),where:clean(r.from),map:rideMap(r.from,dp),to:clean(r.to),toMap:rideMap(r.to,dp,true),src:"Callsheet",go:d.id||dp.date,ride:true,rid,noack:!!crew||!!how,drv:!!drv,
        driver:dn?dn+(dph?" "+dph:""):"",pax:pax&&!(how&&!r.passengers&&!r.people)?pax:"",note:clean(r.note||"")})}}}catch(_){}
  /* Kostüm & Maske from the callsheets (tools/boot/24-flow.js) */
  try{if(window.cmEvents)out.push(...window.cmEvents(me,t))}catch(_){}
  /* extras for the role «Komparsen» (tools/boot/24-flow.js) */
  try{if(window.xqEvents)out.push(...window.xqEvents(t))}catch(_){}
  /* own and Google Calendar events (tools/boot/18-own-events.js); the same appointment twice (same day, same start, same title) is shown once */
  try{if(window.ownEvents){const tn=x=>fold(x||"").replace(/[^a-z0-9]+/g," ").trim(),same=(a,b)=>a.date===b.date&&(hm(a.t)||"")===(hm(b.t)||"")&&(()=>{const x=tn(a.n),y=tn(b.n);return x===y||(x.length>=4&&y.length>=4&&(x.includes(y)||y.includes(x)))})();
    for(const e of window.ownEvents(me))if(!out.some(o=>same(o,e)))out.push(e)}}catch(_){}
  const tk=e=>/^\d\d:\d\d$/.test(e.t)?e.t:"00:00";
  return out.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:tk(a).localeCompare(tk(b)));
}
function shootOn(date){return S.days.some(d=>d.date===date&&d.kind==="shoot")}
function myIcs(list){
  const ev=list.map(e=>makeICS(e.date,{t:e.t,end:e.end,n:e.n,where:e.where,map:e.map,desc:[e.driver&&L("Fahrer:in")+": "+e.driver,e.pax&&L("Mitfahrende")+": "+e.pax,e.note].filter(Boolean).join(" · ")}).split("BEGIN:VEVENT")[1].split("END:VEVENT")[0]);
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Tschugger Crew//Meine Termine//DE","CALSCALE:GREGORIAN","METHOD:PUBLISH"].join("\r\n")+"\r\n"+ev.map(v=>"BEGIN:VEVENT"+v+"END:VEVENT").join("\r\n")+"\r\nEND:VCALENDAR\r\n";
}
function saveIcs(ics,name){try{const blob=new Blob([ics],{type:"text/calendar;charset=utf-8"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)}catch(_){location.href="data:text/calendar;charset=utf-8,"+encodeURIComponent(ics)}}
export let MYEV=[],MCNAMES=[];
/* «Meine Termine»: only upcoming events, events that started at most 5 hours ago and events still running (end time);
   events without a time stay visible for their whole day */
export function evRecent(e){const ok=x=>/^\d\d:\d\d$/.test(x||"");if(!ok(e.t)&&!ok(e.end))return e.date>=todayISO();
  const ms=x=>zurichUTC(e.date,x).getTime(),now=Date.now();
  let end=ok(e.end)?ms(e.end):0;if(end&&ok(e.t)&&end<=ms(e.t))end=zurichUTC(isoAdd(e.date,1),e.end).getTime(); /* night shoot: end after midnight (next calendar day, also over the change of time) */
  return (ok(e.t)&&ms(e.t)>=now-5*3600e3)||(end&&end>=now)}
/* the person chosen in «Termine für» counts only while Meine Termine is drawn – Today, the callsheet, push and the assistant are always me */
export function renderMy(){window.PICKON=true;try{return renderMy0()}finally{window.PICKON=false}}
function renderMy0(){
  if(!vok("mycal"))return '<div class="empty">'+esc(L("Kein Zugang"))+'</div>';
  const me=myIdentity();const people=mailPeople().filter(x=>x.src&&x.src!=="user");
  const names=[...new Set(people.map(p=>p.name))].sort((a,c)=>a.localeCompare(c,LANG));
  MCNAMES=names;
  const sel=!myAdmin()?'<p class="mcsel">'+esc(L("Termine für"))+' <b>'+esc(me?me.name:"–")+'</b></p>':'<div class="mcpick"><label class="mcsel">'+esc(L("Termine für"))+' <input type="search" list="mcnames" data-mcme autocomplete="off" placeholder="'+esc(L("Name tippen …"))+'" value="'+esc(me?me.name:"")+'"></label><datalist id="mcnames">'+names.map(n=>'<option value="'+esc(n)+'"></option>').join("")+'</datalist><button type="button" class="pillbtn mcself" data-mcself '+ariaTip(L("Meine eigenen Termine"))+'><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/></svg></button></div>';
  window.RIDEHID=0;MYEV=me?myEvents(me).filter(e=>evRecent(e)||(window.SHOWDONE&&e.ride&&e.date>=todayISO())):[];
  let h='<section class="mypage"><div class="myhead"><h2 class="pgt">'+esc(L("Meine Termine"))+'</h2>'+'<span class="oebtns">'+(window.gcalBtn?window.gcalBtn():'')+(window.ownEvAddBtn?window.ownEvAddBtn():'')+'</span>'+'</div><div class="myrow">'+sel+(me&&MYEV.length?'<button type="button" class="pillbtn" data-mcall>'+esc(L("Alle in den Kalender"))+' ('+MYEV.length+')</button>':'')+'</div>';
  if(!me)h+='<p class="ghint">'+esc(L(myAdmin()?"Bitte oben deinen Namen wählen.":"Dein Name wurde in der Crewliste nicht gefunden."))+'</p>';
  else{
    if(me.src||me.role)h+='<p class="ghint">'+esc([me.role,me.src].filter(Boolean).join(" · "))+'</p>';
    if(!MYEV.length)h+='<p class="ghint">'+esc(L("Keine kommenden Termine gefunden."))+'</p>';
    /* executed rides are hidden one hour after arrival – here they can be shown again */
    if(window.RIDEHID||window.SHOWDONE)h+='<button type="button" class="lnk ridedone" data-ridedone>'+esc(window.SHOWDONE?L("Erledigte Fahrten ausblenden"):L("Erledigte Fahrten anzeigen")+" ("+window.RIDEHID+")")+'</button>';
    let last="";
    MYEV.forEach((e,i)=>{if(e.date!==last){const dt=new Date(e.date+"T12:00:00");h+='<h4 class="mcd">'+WDL(dt)+' '+ddmm(dt)+'</h4>';last=e.date}
      h+='<div class="mci'+(e.dim?' mcdim':'')+'"><div class="ppt">'+esc(e.t||"")+(e.end?'<br>'+esc(e.end):'')+'</div><div class="ppb"><button type="button" class="mcn" data-mcgo="'+esc(e.go||"")+'">'+esc(e.n||"")+'</button>'+(e.where?ppWhere(e.where,e.map):'')+(e.to?'<div class="ppl rto">'+esc(L("Ziel"))+': '+(e.toMap?'<a href="'+esc(safeUrl(e.toMap))+'" target="_blank" rel="noopener">'+esc(e.to)+'</a>':esc(e.to))+'</div>':'')+(e.driver?'<div class="ppx">'+esc(L("Fahrer:in"))+': '+telLinks(e.driver)+'</div>':'')+(e.pax?'<div class="ppx">'+esc(L("Mitfahrende"))+': '+esc(e.pax)+'</div>':'')+(e.note?'<div class="ppx">'+esc(e.note)+'</div>':'')+(e.xqh?'<div class="ppx xqm">'+e.xqh+'</div>':'')+(e.cmah?'<div class="ppx cma">'+e.cmah+'</div>':'')+'<div class="mcs">'+esc(e.src)+'</div></div>'+(window.ownEvEditBtn?window.ownEvEditBtn(e):'')+(window.pushBell?window.pushBell(e):'')+(()=>{/* a ride: its confirmation on the right instead of «in den Kalender» (the calendar stays when there is nothing to confirm) */
        if(e.cm&&window.cmBtn){const cb=window.cmBtn(e.cm,e.date,e.n,e.cmk,e.cmo);if(cb)return cb}
        const ack=window.rideAckBtn?window.rideAckBtn(e):'';if(ack)return ack;
        return '<button type="button" class="calbtn" data-mcics="'+i+'" aria-label="'+esc(L("In den Kalender"))+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg></button>'})()+'</div>'})}
  return h+'</section>';
}
export function openMyCal(){S.tab="my";S.srcOpen=false;window.scrollTo(0,0);render()}
export function myClick(e){
  const g=e.target.closest("[data-mcgo]");if(g&&g.dataset.mcgo){S.tab="plan";S.day=g.dataset.mcgo;store("tab","plan");render();window.scrollTo(0,0);return true}
  const c=e.target.closest("[data-mcics]");if(c){const ev=MYEV[+c.dataset.mcics];saveIcs(myIcs([ev]),(ev.date+"_"+ev.n).replace(/[^\w\-. ]+/g,"").replace(/\s+/g,"_").slice(0,60)+".ics");return true}
  if(e.target.closest("[data-mcall]")){saveIcs(myIcs(MYEV),"Tschugger_Meine_Termine.ics");return true}
  return false;
}
export function addToCalendar(key){
  const [date,grp,k]=key.split("|");const d=S.prepro.find(x=>x.date===date);if(!d)return;
  const i=(grp==="p"?arr(d.parallel):d.items)[+k];if(!i)return;
  const ics=makeICS(date,i),name=(date+" "+(i.n||"Prep")).replace(/[^\w\-. ]+/g,"").trim().replace(/\s+/g,"_").slice(0,60)+".ics";
  try{const blob=new Blob([ics],{type:"text/calendar;charset=utf-8"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)}
  catch(_){location.href="data:text/calendar;charset=utf-8,"+encodeURIComponent(ics)}
}
function renderPrePro(one,embedded){setPPPEOPLE(null);
  /* admins: also use the app's user database (people not on the crew list); loads once, then re-renders */
  try{if(typeof window.canPerm==="function"&&perm("contacts.extra")&&typeof ADM!=="undefined"&&!ADM.loaded&&typeof ensureAdm==="function")ensureAdm()}catch(_){}
  const first=S.days.find(d=>d.kind==="shoot"),pm=(S.meta&&S.meta.prepro)||{};
  const ppoBtn='<span class="pvb"><button class="pvbtn" data-ppo aria-pressed="'+!!S.ppo+'" '+ariaTip(L("Teilnehmende ein-/ausblenden"))+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.8.2 5 2 5 4.9"/></svg></button></span>';
  let h=embedded?'<section class="wkemb"><div class="dtitle"><h3 class="wkh">'+HIT('Weekly Schedule')+'</h3>'+ppoBtn+'</div>':'<div class="dayhead"><div><div class="dtitle"><h2>'+HIT('Prep')+'</h2>'+ppoBtn+'</div></div></div>';
  if(S.prepro.length){
    for(const d of (one?[one]:S.prepro)){const dt=new Date(d.date+"T12:00:00");
      h+='<section class="ppday">'+(embedded?'':'<h3 class="ppd">'+WDL(dt)+' '+ddmm(dt)+(d.label?' · '+esc(TX(d,"label")):'')+'</h3>')+
        (d.older?'<p class="ghint ppold">'+esc(L("Aus einer älteren Version der Wochenplanung"))+': '+esc(String(d.older).replace(/\.pdf$/i,""))+'</p>':'')+
        (TXA(d,"notes").length?'<div class="notes">'+TXA(d,"notes").map(n=>'<div class="note">'+esc(n)+'</div>').join("")+'</div>':'')+ppItems(d.items,d.date,'i');
      if(arr(d.parallel).length)h+='<h4 class="pph">'+L("Parallel")+'</h4>'+ppItems(arr(d.parallel),d.date,'p');
      const tr=d.transport;
      if(tr&&arr(tr.rows).length){h+='<h4 class="pph">'+L("Transport")+'</h4><div class="pphot">'+(tr.cast?'<div><b>Cast:</b> '+ppWhere(tr.cast,tr.castMap)+'</div>':'')+(tr.crew?'<div><b>Crew:</b> '+ppWhere(tr.crew,tr.crewMap)+'</div>':'')+'</div><div class="pplist">'+
        arr(tr.rows).map(r=>'<div class="ppi tr"><div class="ppt">'+esc(r.at||"")+(r.arr?'<br><span class="ppa">→ '+esc(r.arr)+'</span>':'')+'</div><div class="ppb"><div class="ppn">→ '+(r.toMap?'<a href="'+esc(safeUrl(r.toMap))+'" target="_blank" rel="noopener">'+esc(r.to||"")+'</a>':esc(r.to||""))+'</div>'+ppParts({crew:r.name})+'<div class="ppw">'+L("ab")+' '+(r.fromMap?'<a href="'+esc(safeUrl(r.fromMap))+'" target="_blank" rel="noopener">'+esc(r.from||"")+'</a>':esc(r.from||""))+'</div>'+(r.driver?'<div class="ppx">'+L("Fahrer:in")+': '+telLinks(r.driver)+'</div>':'')+'</div></div>').join("")+'</div>'}
      h+='</section>'}
    if(embedded){if(pm.source)h+='<p class="ppsrc">'+L("Quelle")+': '+esc(Array.isArray(pm.sources)&&pm.sources.length>1?pm.sources.join(" · "):pm.source)+(pm.issued?' · '+L("Stand")+' '+esc(pm.issued):'')+'</p>';return h+'</section>'}
    if(pm.distribution)h+='<details class="ppdist"><summary>'+L("Verteiler")+'</summary><p>'+esc(pm.distribution)+'</p></details>';
    if(pm.note)h+='<p class="ppsrc">'+esc(TX(pm,"note"))+'</p>';
    if(pm.source)h+='<p class="ppsrc">'+L("Quelle")+': '+esc(Array.isArray(pm.sources)&&pm.sources.length>1?pm.sources.join(" · "):pm.source)+(pm.issued?' · '+L("Stand")+' '+esc(pm.issued):'')+'</p>';
  }else{
    h+='<div class="empty">'+L("Die Wochenplanung für Vorbereitung und Proben folgt, sobald sie in der Dropbox der Produktion verfügbar ist.")+'</div>';
    for(const d of S.days.filter(d=>first&&d.date<first.date&&d.kind!=="shoot")){const dt=new Date(d.date+"T12:00:00");h+='<div class="offday"><b>'+WD[dt.getDay()]+' '+ddmm(dt)+' · '+esc(d.label||"")+'</b>'+esc(TX(d,"info"))+'</div>'}
  }
  return h;
}
export const WDL=dt=>({de:["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"],fr:["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"],it:["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"],en:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],hi:["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"]}[LANG]||[])[dt.getDay()]||WD[dt.getDay()];
export function telLinks(t){return esc(t).replace(/(\+?\d[\d ]{7,}\d)/g,m=>'<a href="tel:'+m.replace(/\s/g,"")+'">'+m+'</a>')}
/* the facts of a shooting day (time, drive, weather, length, pages, sun, extras, PDF): schedule and callsheet without callsheet */
export function planPdfBtn(d){
  const sp=S.meta&&S.meta.schedPdf,dno=(String(d.short0||d.short||d.label||"").match(/\d+/)||[])[0],spi=sp&&sp.day&&dno!==undefined?sp.day[String(+dno)]:undefined;
  const spBtn=sp&&arr(sp.pg).length&&typeof window.blkImg==="function"?'<button type="button" class="fact factp" data-schedpdf="'+(spi===undefined?0:spi)+'" '+ariaTip(L("Drehplan als PDF (Originalseite dieses Drehtags)"))+'><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg><span class="v">PDF</span></button>':'';
  return spBtn}
export function planFactsHTML(d,spBtn){
    const f=[[L("Dreh"),d.hours],[L("Länge"),d.length],[L("Seiten"),d.pages],[L("Sonne"),d.sr&&d.ss?d.sr+"–"+d.ss:(d.sr||d.ss)]];
    if(d.extras)f.push(["Extras",d.extras]);
    /* drive from the crew hotel: +3 min buffer (over 20 min: +15 %); the route itself only when opened; shown next to the shooting time */
    /* the drive to the first set: tap → route from the hotel or from where you are (like in «Today») */
    const dv=d.drive&&d.drive.min?(()=>{const fi=arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc));let dest=d.drive.to||"";try{if(fi){const a=addrForItem(fi);if(a&&!/^tba$/i.test(a))dest=a}}catch(_){}
      const from=d.drive.from||"Hotel",url="https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+encodeURIComponent(from)+"&destination="+encodeURIComponent(dest),
        here="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination="+encodeURIComponent(dest);
      return '<button type="button" class="fact factr" data-route="'+esc(JSON.stringify({h:url,c:here,from,to:dest}))+'" title="'+esc(L("Route in Google Maps"))+'"><span class="k">'+L("Anfahrt")+'</span><span class="v">'+esc(driveMin(d.drive.min)+"′"+(d.drive.km?"\u2009·\u2009"+Math.round(d.drive.km)+"\u2009km":""))+' ›</span></button>'})():'';
    /* the drive to the set sits right next to the shooting time */
    const fx=f.filter(x=>x[1]).map(x=>'<div class="fact"><div class="k">'+x[0]+'</div><div class="v">'+esc(x[1])+'</div></div>');
    if(dv)fx.splice(d.hours?1:0,0,dv);
    /* weather (website): compact chip after the drive, tap → report */
    try{const wf=window.wxFact?window.wxFact(d):"";if(wf)fx.splice(d.hours?(dv?2:1):0,0,wf)}catch(_){}
    if(spBtn)fx.push(spBtn);   /* direct link to the schedule PDF, after «Sonne» */
    return '<div class="facts">'+fx.join("")+'</div>';
}
export function renderPlan(){
  if(!S.days.length)return emptyHTML("Planung");
  const PD=planDays();
  const t=todayISO();
  if(onlyU()&&!String(S.day||"").startsWith("prep:")){const cd=S.days.find(x=>x.id===S.day);if(!cd||!hasSelU(cd)){const nd=nextUnitDay();if(nd)S.day=nd.id}}   /* a PREP day stays open */
  /* one PREP button per prep day from today on; past prep days disappear */
  /* weekly-schedule days that fall on a shooting day get no PREP button; they appear below that day's schedule */
  const shootDates=new Set(S.days.filter(d=>d.kind==="shoot").map(d=>d.date));
  const PP=vok("prep")?S.prepro.filter(d=>d.date>=t&&!shootDates.has(d.date)):[];
  /* prep days without any programme (only "Rest") are shown as OFF and cannot be selected */
  /* a rest day with an own appointment (e.g. a dinner) can still be opened, so the appointment is visible */
  const ppOwn=d=>{try{return !!(window.ownDayHTML&&window.ownDayHTML(d.date))}catch(_){return false}};
  const ppRest=d=>d.off===true||!d.items.length||d.items.every(i=>/^(rest|ruhetag|frei|off|day off)$/i.test(String(i.n||"").trim()));
  const ppOff=d=>ppRest(d)&&!ppOwn(d);
  const PPA=PP.filter(d=>!ppOff(d));
  const ppSel=String(S.day||"").startsWith("prep:")&&PPA.some(d=>"prep:"+d.date===S.day);
  if(!ppSel){
    const shootOk=S.day&&PD.some(d=>d.id===S.day);
    if(!shootOk){S.day=null;pickDay(PD);const nx=S.days.find(d=>d.id===S.day);if(PPA.length&&(!nx||PPA[0].date<nx.date))S.day="prep:"+PPA[0].date}
  }
  const ppDay=String(S.day||"").startsWith("prep:")?PPA.find(d=>"prep:"+d.date===S.day):null;
  const ppChips=PP.map(d=>{const dt=new Date(d.date+"T12:00:00"),off=ppOff(d),rest=ppRest(d),sd=S.days.find(x=>x.date===d.date);
    /* a day from the shooting schedule (travel / off) keeps its label and colour; the weekly schedule fills in its content */
    if(sd){const k=sd.kind==="travel"?"travp":"free";return '<button data-dt="'+esc(d.date)+'" class="chip off '+k+(d.date===t?" isnow":"")+'" role="tab" data-day="prep:'+esc(d.date)+'" aria-selected="'+(ppDay===d)+'"'+(off?' disabled aria-disabled="true"':'')+'><div class="lb">'+(sd.kind==="travel"?'<span class="lbl">TRAVEL</span><span class="lbs">TRA</span>':"OFF")+'<span class="wds">/'+WD[dt.getDay()].toUpperCase()+'</span><span class="wdl">'+esc(WDL(dt))+'</span></div><div class="dd">'+pad2(dt.getDate())+'.'+pad2(dt.getMonth()+1)+'</div></button>'}
    return '<button data-dt="'+esc(d.date)+'" class="chip pre'+(rest?" off free":"")+(d.date===t?" isnow":"")+'" role="tab" data-day="prep:'+esc(d.date)+'" aria-selected="'+(ppDay===d)+'"'+(off?' disabled aria-disabled="true"':'')+'><div class="lb">'+(rest?'OFF':'<span class="lbl">PREP</span><span class="lbs">PRE</span>')+'<span class="wds">/'+WD[dt.getDay()].toUpperCase()+'</span><span class="wdl">'+esc(WDL(dt))+'</span></div><div class="dd">'+pad2(dt.getDate())+'.'+pad2(dt.getMonth()+1)+'</div></button>'}).join("");
  /* a non-shooting day that is also a prep day appears only once (as PREP) */
  const ppDates=new Set(PP.map(d=>d.date));
  let h=dayNav(PD.filter(d=>d.kind==="shoot"||!ppDates.has(d.date)),d=>d.id===S.day,"data-day","id",null,ppChips);
  if(ppDay){let o='';try{if(window.ownDayHTML)o=window.ownDayHTML(ppDay.date)}catch(_){}return h+renderPrePro(ppDay)+o}
  if(!PD.length)return h+'<div class="empty">'+L('Bitte mindestens eine Unit wählen.')+'</div>';
  const d=S.days.find(x=>x.id===S.day)||PD[0];if(!d)return h+'<div class="empty">'+L('Noch keine Drehtage.')+'</div>';
  /* round button: the original schedule PDF, opened at the page of this shooting day */
  const spBtn=planPdfBtn(d);
  h+='<div class="dayhead"><div><div class="dtitle"><h2>'+esc(d.label)+'</h2>'+(d.kind==="shoot"?pvButtons('',UNITBAR):'')+'</div><div class="date drow"><span>'+fmtDate(d.date)+(d.date===t?' · '+L('heute'):'')+blockTag(d.date)+'</span>'+(d.kind==="shoot"?'':UNITBAR)+'</div></div>';
  if(d.kind==="shoot")h+=planFactsHTML(d,spBtn);
  if(TXA(d,"notes").length)h+='<div class="notes">'+TXA(d,"notes").map(n=>'<div class="note">'+esc(n)+'</div>').join("")+'</div>';
  h+='</div>';
  try{if(window.ownDayHTML)h+=window.ownDayHTML(d.date)}catch(_){} /* own and Google Calendar appointments of this day */
  if(d.kind!=="shoot"){
    h+='<div class="offday"><b>'+(d.kind==="travel"?L("Reisetag"):L("Drehfrei"))+'</b>'+esc(TX(d,"info"))+'</div>';
    return h;
  }
  const sel=["1","2","3"].filter(u=>S.pu[u]);
  if(!sel.length)return h+'<div class="empty">'+L('Bitte mindestens eine Unit wählen.')+'</div>';
  const shown=sel.filter(u=>u==="1"||hasU(d,u));
  const heads=shown.length>1;
  for(const u of sel){
    window.__mctx={date:d.date,u:u};
    if(u==="1"){if(heads)h+='<h3 class="uh">1st Unit</h3>';h+='<ol class="tl">'+(d.items||[]).map(itemHTML).join("")+'</ol>';continue}
    if(hasU(d,u)){
      let x=d["unit"+u];
      /* 2nd unit planning: all rows (scenes, rigging, setup, move …); a note that names a scene («Ton für Sc185») is shown at
         that scene, notes without a scene not */
      if(x.src==="2nd"){const its=x.items.filter(i=>i).map(i=>Object.assign({},i,{xn:[]}));
        const key=sc=>String(sc).toLowerCase().replace(/\s+/g,"").replace(/^0+/,"");
        const refs=n=>{const out=new Set(),t=String(n).toLowerCase().replace(/(\d)\s+(pt|sl)/g,"$1$2");for(const m of t.matchAll(/(?:sc(?:ene|ène|ena)?\.?\s*|szene\s*|#)0*(\d+(?:(?:pt|sl)\d+|[a-z]\b)?)/g))out.add(m[1]);return out};
        for(const n of TXA(x,"notes")){const r=refs(n);if(!r.size)continue;for(const i of its){if(!i.sc)continue;const k=key(i.sc),b=k.replace(/pt\d+[a-z]?$/,"")/* «5pt3» also hears notes on 5, «25sl2» (slideshow) not those on 25 */;if(r.has(k)||r.has(b))i.xn.push(n)}}
        x=Object.assign({},x,{items:its,notes:[],notes_fr:[],notes_en:[],notes_it:[],notes_hi:[]})}
      /* camera setups of the 2nd unit (rows «A-1 …», «B-2 …» after a scene) go into that scene, under the cast */
      {const out=[];let cur=null;for(const i of x.items||[]){if(!i)continue;if(i.sc){cur=Object.assign({},i,{camx:[]});out.push(cur);continue}
        const n=String(TX(i,"n")||i.n||"");if(cur&&/^\s*[A-Z]{1,2}\s?-?\s?\d+[a-z]?\b/.test(n)){cur.camx.push((i.t?i.t+" ":"")+n.trim());continue}cur=null;out.push(i)}
       if(out.some(i=>i.camx&&i.camx.length))x=Object.assign({},x,{items:out})}
      if(heads)h+='<h3 class="uh u'+u+'">'+UNAME[u]+' Unit</h3>';
      h+='<div class="unitfacts">'+[x.hours,x.length,x.pages&&x.pages+" pgs",x.extras&&x.extras+" Extras"].filter(Boolean).map(esc).join(" · ")+
        (x.src==="2nd"?' <span class="u2src">'+esc(L("genaue Reihenfolge laut 2nd-Unit-Planung"))+'</span>':'')+'</div>';
      if(TXA(x,"notes").length)h+='<div class="notes" style="margin-top:8px">'+TXA(x,"notes").map(n=>'<div class="note">'+esc(n)+'</div>').join("")+'</div>';
      h+='<ol class="tl">'+x.items.map(itemHTML).join("")+'</ol>';
    }else if(!shown.length)h+='<div class="empty">'+L('Keine '+UNAME[u]+' Unit an diesem Tag.')+'</div>';
  }
  window.__mctx=null;   /* the day of the rows only while they are drawn (else cast chips elsewhere showed the state of this day) */
  const wk=vok("prep")&&S.prepro.find(x=>x.date===d.date);if(wk)h+=renderPrePro(wk,true);
  return h;
}
