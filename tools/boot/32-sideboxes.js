/* ---------- side boxes (wide desktop screens, from 1400 px): topics left and right of the page, chosen per person in «Mein Konto → App» ----------
   Topics drawn here (Jetzt, Mein Tag, Kacheln, Drehfolge, Fahrten, nächster Drehtag, Wetter) use the styles of the page (.sbview: the build gives
   every «#view» rule to «.sbview» too). Topics that are whole pages (Smartphone-Vorschau, User, Access, App-Einstellungen) are the app itself in a
   frame: fully usable, looking the same – each frame is a second copy of the app (its own live data), so only chosen ones are loaded.
   Setting: localStorage «sbx» = «now.mine|phone» (left|right, the order of the topics), kept with the other notices of the profile (prefs x). */
import {dayItems,esc,isoDM,L,S,todayISO,unitKey} from "../base/10-core.js";
import {csHm,csMe,csMyRides,csRideReal,csTile} from "../base/13a-callsheet.js";
import {csMine,csTilesHTML} from "../base/13d-cs-mine.js";
import {VIEWS,tabsOn,vok} from "../base/14-render.js";
import {onRendered,render} from "../base/15-script-tab.js";
import {arr} from "../base/20-data-start.js";
import {ME,can,fb,isAdmin} from "./03-core-firebase.js";
import {seenMs} from "./10-menus-welcome-presence.js";
import {savePrefsSoon} from "./06-prefs-docs.js";
import {ADM,ensureAdm} from "./12a-admin-core.js";
import {wxTile} from "./15-weather.js";
import {nowCardHTML,todayDay,unitTilesHTML} from "./16-today-view.js";

/* [key, title, frame page (whole app in a frame) or "", may this person see it] */
/* frame pages: «t:tab» a page of the app, «a:sub» a part of the App-Verwaltung, «…:selector» only that part of the page; always the phone view (390 px, scaled) */
const SBT=[["now","Jetzt"],["mine","Mein Tag"],["tiles","Kacheln des Tages"],["order","Drehfolge heute"],["rides","Meine Fahrten"],["next","Nächster Drehtag"],["wx","Wetter"],
  ["phone","Smartphone-Vorschau","phone"],
  ["today","Today","t:today"],["plan","Drehplan","t:plan"],["dispo","Callsheet","t:dispo"],["loc","Locations","t:loc"],["crew","Crewliste","t:crew"],["script","Drehbuch","t:script"],["info","Info","t:info"],
  ["my","Meine Termine","t:my"],["bcast","Nachrichten","t:bcast"],["reports","Reports","t:reports"],["acct","Mein Konto","t:acct"],
  ["set","App-Einstellungen","a:set"],["users","Alle Benutzer","a:users"],["active","Gerade aktiv"],["sim","Ansicht simulieren"],["roles","Rollen","a:roles:.admins:not(.pacc)"],["access","Wer hat welchen Zugriff?","a:roles:.pacc"]];
const sbCan=k=>{try{const t=SBT.find(x=>x[0]===k),pg=t&&t[2]||"";
    if(/^a:(users)/.test(pg))return isAdmin()||can("users.view")||can("users.edit")||can("users.invite");if(/^a:roles/.test(pg))return isAdmin()||can("roles.view")||can("roles.edit")||can("roles.assign");if(pg==="a:set")return isAdmin()||can("settings");
    if(k==="now")return !!(window.nowSee&&window.nowSee());if(k==="my")return vok("mycal");if(k==="bcast")return can("push.send");if(k==="reports")return typeof VIEWS==="undefined"||!!VIEWS.reports;if(k==="acct")return true;
    if(k==="active")return isAdmin()||can("users.view")||can("users.edit");
    if(k==="sim")return isAdmin();
    if(pg.startsWith("t:")){const tb=pg.slice(2);return (typeof tabsOn!=="function"||tabsOn().includes(tb))&&vok(tb==="dispo"?"dispo":tb)}}catch(_){return false}return true};
export const SBWIDE=1300;
const INFRAME=(()=>{try{return window.self!==window.top}catch(_){return true}})();
const FRAMEPG=(()=>{try{return new URLSearchParams(location.search).get("sbx")||""}catch(_){return ""}})();
/* the setting: two lists of topic keys */
export function sbxGet(){let v="";try{v=localStorage.getItem("sbx")||""}catch(_){}if(!v)v="now.tiles.mine|order.rides.next";const [a,b]=v.split("|");const ok=k=>SBT.some(t=>t[0]===k);
  return {l:String(a||"").split(".").filter(ok),r:String(b||"").split(".").filter(ok)}}
function sbxSet(x){try{localStorage.setItem("sbx",x.l.join(".")+"|"+x.r.join("."))}catch(_){}savePrefsSoon()}

/* ---------- inside a frame of a side box: the chosen page only (no head, no navigation) ---------- */
if(INFRAME&&FRAMEPG&&FRAMEPG!=="phone"){document.documentElement.classList.add("sbxf");
  /* the page of the topic; set again a moment later (the start may open its own page); with a part only: everything else of the page hidden */
  const t=SBT.find(x=>x[0]===FRAMEPG),pg=(t&&t[2])||"",[kind,sub,...rest]=pg.split(":"),only=rest.join(":");let n=0;
  let w=0;const go=()=>{if(!ME){if(++w<120)setTimeout(go,500);return}if(kind==="a"){ADM.sub=sub;S.tab="admin"}else if(kind==="t")S.tab=sub;render();if(++n<3)setTimeout(go,1500)};setTimeout(go,300);
  if(only)onRendered(()=>{try{const el=document.querySelector("#view "+only);if(!el)return;for(let a=el;a&&a.id!=="view";a=a.parentElement)for(const sib of a.parentElement.children)if(sib!==a)sib.style.display="none"}catch(_){}})}

/* ---------- the topics drawn here ---------- */
/* the head of a topic: its title and «−» (takes it out of this box) */
const head=(k,t)=>'<h3 class="sbh" title="'+esc(L("Zum Verschieben ziehen"))+'"><span>'+esc(L(t))+'</span><button type="button" class="sbdel" data-sbdel="'+k+'" aria-label="'+esc(L("Entfernen")+": "+L(t))+'" title="'+esc(L("Entfernen"))+'">−</button></h3>';
/* a topic without content now (no callsheet yet …): only its head, so it can still be taken out */
const sec=(k,t,h)=>'<section class="sbsec'+(h?'':' sbempty')+'">'+head(k,t)+(h||'<p class="sbnone">'+esc(L("Zurzeit nichts"))+'</p>')+'</section>';
const dayNow=()=>{try{return todayDay()}catch(_){return null}};
const dpOf=d=>d?arr(S.dispos).find(x=>x&&x.date===d.date&&x.cs)||null:null;
/* «Gerade aktiv»: drawn here from the «last seen» marks (no second copy of the app in a frame); read again at most every 90 s */
const ACT={at:0,list:null,err:"",busy:false};
async function actLoad(){if(ACT.busy)return;ACT.busy=true;
  try{const {F,db}=await fb(),since=new Date(Date.now()-4*60e3);
    const s=await F.getDocs(F.query(F.collection(db,"members"),F.where("lastSeen",">=",since)));
    ACT.list=s.docs.map(d=>d.data()).filter(m=>m&&m.active===true&&Date.now()-seenMs(m)<4*60e3)
      .map(m=>({n:String(m.name||[m.firstName,m.lastName].filter(Boolean).join(" ")||m.email||"?"),d:/^app-/.test(m.app||"")?"App":/desktop/.test(m.app||"")?"Web · Computer":"Web · Handy",t:seenMs(m)}))
      .sort((a,b)=>a.n.localeCompare(b.n));ACT.err=""}
  catch(err){ACT.err=String(err&&err.code||"x")}finally{ACT.at=Date.now();ACT.busy=false;soon()}}
const ago=t=>{const m=Math.round((Date.now()-t)/60e3);return m<1?L("gerade eben"):L("vor {n} Min.").replace("{n}",m)};
const TOP={
  /* «Ansicht simulieren»: the quick picker of the App-Verwaltung (roles and people) – the view as that role or person opens in the page itself */
  sim:()=>{if(!ADM.loaded){try{ensureAdm()}catch(_){}setTimeout(soon,1500);return '<p class="sbnone">'+esc(L("Wird geladen …"))+'</p>'}
    const h=typeof window.simPicker==="function"?window.simPicker():"";return h||'<p class="sbnone">'+esc(L("Ansicht als"))+' …</p>'},
  active:()=>{if(Date.now()-ACT.at>90e3)setTimeout(actLoad,0);if(!ACT.list)return ACT.err?'<p class="sbnone">'+esc(L("Zurzeit nicht lesbar"))+'</p>':"";
    if(!ACT.list.length)return '<p class="sbnone">'+esc(L("Gerade ist niemand aktiv."))+'</p>';
    return '<div class="sbact"><div class="sbacn">'+ACT.list.length+' '+esc(L("online"))+'</div>'+ACT.list.map(p=>'<div class="sbap"><span class="sbdot" aria-hidden="true"></span><b>'+esc(p.n)+'</b><small>'+esc(p.d)+' · '+esc(ago(p.t))+'</small></div>').join("")+'</div>'},
  now:()=>{const h=nowCardHTML(typeof csShootDay==="function"?csShootDay():todayISO(),"",undefined,true);   /* the night after midnight too; only while shooting (as Today) */return h?'<div class="sbnow">'+h+'</div>':""},
  mine:()=>{const d=dayNow(),dp=dpOf(d);if(!dp)return"";let me=null;try{me=csMe()}catch(_){}const mn=me?csMine(dp.cs,me):[];return mn.length?'<div class="tcard tmine">'+mn.join("")+'</div>':""},
  tiles:()=>{const d=dayNow(),dp=dpOf(d);if(!dp)return"";let me=null;try{me=csMe()}catch(_){}return '<div class="tcs">'+unitTilesHTML(dp,d,me)+'</div>'},   /* the same tiles as Today */
  order:()=>{const d=dayNow();if(!d||d.kind!=="shoot")return"";const st=(sc,u)=>typeof scState==="function"?scState(d.date,unitKey(sc,u)):0;   /* the state of the unit of the row (2nd Unit: «90_u2») */
    const list=(its,u)=>arr(its).filter(i=>i&&(i.sc||i.n)).map(i=>'<div class="sbo'+(i.sc&&st(i.sc,u)===2?' done':i.sc&&st(i.sc,u)===1?' run':'')+'"><i>'+esc(i.t||"")+'</i>'+(i.sc?'<b>'+esc(String(i.sc))+'</b> <span>'+esc(i.set||"")+'</span>':'<span class="sbev">'+esc(i.n||"")+'</span>')+'</div>').join("");
    const u2=dayItems(d,"2");return (u2.length?'<div class="tuh u1">1st Unit</div>':'')+list(d.items,"1")+(u2.length?'<div class="tuh u2">2nd Unit</div>'+list(u2,"2"):'')},
  rides:()=>{const d=dayNow(),dp=dpOf(d);if(!dp)return"";let me=null;try{me=csMe()}catch(_){}if(!me)return"";
    const rs=csMyRides(dp.cs,me).filter(csRideReal).sort((a,b)=>(csHm(a.t1)||"99").localeCompare(csHm(b.t1)||"99"));
    return rs.map(r=>'<div class="sbr"><b>'+esc(csHm(r.t1)||r.t1||"")+'</b> '+esc(r.from||"")+' → '+esc(r.to||"")+(r.t2?' <small>'+esc(r.t2)+'</small>':'')+'<small class="sbrv">'+esc([r.vehicle,r.driver].filter(Boolean).join(" · "))+'</small></div>').join("")},
  next:()=>{const d=dayNow(),t=todayISO();const nd=arr(S.days).find(x=>x&&x.kind==="shoot"&&x.date>(d&&d.date>t?d.date:t));if(!nd)return"";
    const u20=nd.unit2&&nd.unit2.hours?String(nd.unit2.hours):"";const fi=arr(nd.items).find(i=>i&&i.sc);
    let mu=null;try{const ndp=arr(S.dispos).find(x=>x&&x.date===nd.date&&x.cs);if(ndp)mu=window.csMyUnits(ndp.cs,csMe())}catch(_){}
    const u2=u20&&(!mu||mu.includes("2"))?u20:"",h1=!u20||!mu||mu.includes("1");
    return '<div class="sbnx"><b>'+esc(nd.short||nd.label||"")+'</b> '+esc(isoDM(nd.date))+'</div>'+(nd.hours&&h1?'<div class="sbnx">'+esc(L("Drehzeit"))+(u20?' 1st Unit':'')+': '+esc(nd.hours)+'</div>':'')+(u2?'<div class="sbnx">'+esc(L("Drehzeit"))+' 2nd Unit: '+esc(u2)+'</div>':'')+(fi?'<div class="sbnx">'+esc(L("Erste Szene"))+': <b>'+esc(String(fi.sc))+'</b> '+esc(fi.set||"")+'</div>':'')},
  wx:()=>{const d=dayNow();if(!d)return"";let h="";try{h=wxTile(d)}catch(_){}return h?'<div class="ttiles">'+h+'</div>':""}
};

/* ---------- the two boxes ---------- */
let BOX={};
function frame(k,pg){const f=document.createElement("div");f.className="sbframe"+(pg==="phone"?" sbphone":"");
  const i=document.createElement("iframe");i.src=location.pathname+"?sbx="+encodeURIComponent(k);i.title=k;i.loading="lazy";f.appendChild(i);
  if(pg==="phone")i.addEventListener("load",()=>setTimeout(()=>phPost(true),1200));return f}
/* ---------- the phone preview: «wie die Hauptseite» (the same page as the page in the middle) and «Ansicht als …» (a role or a person, only in the phone) ---------- */
const PHK="sbxph";
const phGet=()=>{try{return Object.assign({follow:true,sim:""},JSON.parse(localStorage.getItem(PHK)||"{}"))}catch(_){return {follow:true,sim:""}}};
const phSet=v=>{try{localStorage.setItem(PHK,JSON.stringify(v))}catch(_){}};
function phPost(all){const v=phGet();for(const i of document.querySelectorAll("aside.sbbox .sbphone iframe"))try{
    const m={sbx:"phone"};if(v.follow)Object.assign(m,{tab:S.tab,day:S.day||null,sub:(S.tab==="admin"&&ADM.sub)||""});if(all)m.sim=v.sim||"";i.contentWindow.postMessage(m,location.origin)}catch(_){}}
/* the controls above the phone: «wie Hauptseite» and the picker of roles and people (the same list as «Ansicht simulieren») */
function phBar(){const v=phGet();let pick="";try{if(isAdmin()){if(!ADM.loaded)ensureAdm();pick=typeof window.simPicker==="function"?window.simPicker().replace("data-simpick","data-sbphsim"):""}}catch(_){}
  if(pick&&v.sim)pick=pick.replace('<option value="'+esc(v.sim)+'">','<option value="'+esc(v.sim)+'" selected>');
  return '<div class="sbphc"><label class="ck"><input type="checkbox" data-sbphf'+(v.follow?' checked':'')+'> '+esc(L("wie Hauptseite"))+'</label>'+(pick?pick.replace('<option value="">','<option value="">'+esc(L("eigene Ansicht"))+'</option><option value="" disabled>'):'')+'</div>'}
document.addEventListener("change",e=>{const c=e.target.closest&&e.target.closest("[data-sbphf]");if(c){const v=phGet();v.follow=c.checked;phSet(v);phPost(false);return}
  const sl=e.target.closest&&e.target.closest("[data-sbphsim]");if(sl){const v=phGet();v.sim=sl.value||"";phSet(v);phPost(true)}});
if(!INFRAME)onRendered(()=>{if(phGet().follow)phPost(false)});
/* inside the phone frame: follow the page, simulate a role or a person (only in this frame – the page itself stays as it is) */
if(INFRAME&&FRAMEPG==="phone"){let simV=null;
  const simGo=async v=>{if(v===simV)return;simV=v;try{if(typeof simEnd==="function")simEnd()}catch(_){}if(!v)return;
    try{if(window.loadAdminUI)await window.loadAdminUI()}catch(_){}for(let n=0;n<40&&!ADM.loaded;n++){try{ensureAdm()}catch(_){}await new Promise(r=>setTimeout(r,250))}
    try{if(v.startsWith("role:"))simStartRole(v.slice(5),{back:S.tab});else simStart(v,{back:S.tab})}catch(err){console.warn("phone sim",err)}};
  addEventListener("message",e=>{if(e.origin!==location.origin||!e.data||e.data.sbx!=="phone")return;const d=e.data;
    if(d.sim!==undefined)simGo(d.sim);
    if(d.tab&&(d.tab!==S.tab||(d.day&&d.day!==S.day))){S.tab=d.tab;if(d.day!==undefined&&d.day!==null)S.day=d.day;if(d.tab==="admin"&&d.sub)ADM.sub=d.sub;render()}})}
/* always the phone view: every frame 390 px wide, scaled to the box; the phone 844 px high, a page 70 % of the window */
/* several topics in one box: the frames share its height (each at least 260 px), so all of them are seen at once */
function fit(){try{if(typeof csFitTiles==="function")requestAnimationFrame(csFitTiles)}catch(_){}   /* the tiles in the boxes: font fitted to the box */

  /* each box in the free space beside the page (measured, not assumed): never over the page, never past the edge of the window */
  const wr=(document.querySelector(".wrap")||document.getElementById("view")||document.body).getBoundingClientRect(),G=16;
  for(const a of document.querySelectorAll("aside.sbbox")){if(a.hidden)continue;const side=a.id==="sbl"?"l":"r";
    const free=Math.floor(side==="l"?wr.left-2*G:window.innerWidth-wr.right-2*G);
    if(a.classList.contains("sbempty")){a.style.width="";continue}
    if(free<160){a.style.visibility="hidden";continue}a.style.visibility="";
    a.style.width=free+"px";if(side==="l"){a.style.left=G+"px";a.style.right=""}else{a.style.right=G+"px";a.style.left=""}
    const v=a.querySelector(".sbview");if(!v)continue;v.style.zoom="";
    /* narrow box: everything a little smaller (the parts are made for about 280 px) */
    const zw=Math.min(1,free/280);if(zw<1)v.style.zoom=zw;
    const fr=[...a.querySelectorAll(".sbframe")],H=a.clientHeight;
    /* the frames share the height that the other parts leave free (each at least 150 px) */
    for(const f of fr){f.style.height="0px"}
    const other=v.scrollHeight*zw,n=fr.length,per=n?Math.max(150,Math.floor((H-other-6)/n/zw)):0;
    for(const f of fr){const i=f.querySelector("iframe");if(!i)continue;const ph=f.classList.contains("sbphone");
      const w0=Math.max(120,((f.parentElement&&f.parentElement.clientWidth)||free/zw)-(ph?14:2));let s=Math.min(1.6,w0/390);
      if(ph&&844*s+14>per)s=(per-14)/844;
      const vis=ph?Math.round(844*s)+14:per;f.style.width=ph?Math.round(390*s)+14+"px":"";i.style.transform="scale("+s+")";i.style.height=Math.round((vis-(ph?14:0))/s)+"px";f.style.height=vis+"px"}   /* the phone: its frame (2 × 7 px) around the whole screen – the menu at the bottom stays visible */
    /* still too high (many parts): everything smaller until it fits – nothing hidden, no scrolling inside the box */
    const need=v.scrollHeight*zw;if(need>H){const z=Math.max(.5,zw*(H-8)/need);v.style.zoom=z;if(a.scrollHeight>H+1)v.style.zoom=Math.max(.5,z*(H-8)/a.scrollHeight)}}}
/* who may use the side boxes: Owner, Admins and the roles with «Seitenmenüs nutzen» (App-Verwaltung → Access) */
const sbUse=()=>{try{return isAdmin()||can("sidebox.use")}catch(_){return false}};
function draw(){if(INFRAME)return;const wide=window.innerWidth>=SBWIDE&&!!ME&&sbUse();const x=sbxGet();
  for(const side of ["l","r"]){const keys=wide?x[side].filter(sbCan):[];let a=document.getElementById("sb"+side);
    if(!wide){if(a)a.hidden=true;continue}
    if(!a){a=document.createElement("aside");a.id="sb"+side;a.className="sbbox";a.innerHTML='<div class="sbview"><div class="today"></div><div class="sbadd"></div></div>';document.body.appendChild(a)}
    a.hidden=false;a.classList.toggle("sbempty",!keys.length);const root=a.querySelector(".today");
    /* one part per topic (kept: a frame is never loaded twice), in the chosen order */
    for(const el of [...root.children])if(!keys.includes(el.dataset.sbt))el.remove();
    keys.forEach((k,i)=>{const t=SBT.find(y=>y[0]===k);let el=root.querySelector(':scope>[data-sbt="'+k+'"]');
      if(!el){el=document.createElement("div");el.dataset.sbt=k;if(t[2]){el.innerHTML='<section class="sbsec">'+head(k,t[1])+'</section>';el.firstChild.appendChild(frame(k,t[2]))}}
      /* the phone: its controls above it (kept while a choice is open) */
      if(k==="phone"){let c=el.querySelector(".sbphcw");if(!c){c=document.createElement("div");c.className="sbphcw";const fr=el.querySelector(".sbframe");fr.parentNode.insertBefore(c,fr)}
        if(!c.contains(document.activeElement)){const h=phBar();if(c.__h!==h){c.__h=h;c.innerHTML=h}}}
      if(root.children[i]!==el)root.insertBefore(el,root.children[i]||null);
      if(!t[2]){let h="";try{h=sec(k,t[1],TOP[k]())}catch(err){h=sec(k,t[1],"")}if(el.__h!==h){el.__h=h;el.innerHTML=h}}});
    /* below: «+» – a pull-down with the topics not shown yet (in neither box) */
    {const used=x.l.concat(x.r),free=SBT.filter(t=>sbCan(t[0])&&!used.includes(t[0])),ad=a.querySelector(".sbadd"),open=ad.dataset.open==="1";
      const h=free.length?'<button type="button" class="sbplus" data-sbplus="'+side+'" aria-expanded="'+open+'" aria-label="'+esc(L("Thema hinzufügen"))+'" title="'+esc(L("Thema hinzufügen"))+'">+</button>'+
        (open?'<select data-sbaddsel="'+side+'" aria-label="'+esc(L("Thema hinzufügen"))+'"><option value="">'+esc(L("Thema wählen …"))+'</option>'+free.map(t=>'<option value="'+t[0]+'">'+esc(L(t[1]))+'</option>').join("")+'</select>':''):'';
      if(ad.__h!==h){ad.__h=h;ad.innerHTML=h;const sl=ad.querySelector("select");if(sl)sl.focus()}}
    BOX[side]=a}
  document.documentElement.classList.toggle("sbx-l",!!(document.getElementById("sbl")&&!document.getElementById("sbl").hidden));
  document.documentElement.classList.toggle("sbx-r",!!(document.getElementById("sbr")&&!document.getElementById("sbr").hidden));fit()}
let SBQ=0;const soon=()=>{if(SBQ)return;SBQ=setTimeout(()=>{SBQ=0;try{draw()}catch(err){console.warn("sidebox",err)}},250)};
if(!INFRAME){onRendered(soon);addEventListener("resize",()=>{soon();fit()});setInterval(soon,30e3)}

/* ---------- «Mein Konto → App»: Seitenbox links / rechts – topics ticked, order with ▲ ▼ ---------- */
export function sbxSec(){if(INFRAME||!sbUse())return"";const x=sbxGet(),avail=SBT.filter(t=>sbCan(t[0]));
  const side=(s,title)=>{const on=x[s],rest=avail.filter(t=>!on.includes(t[0]));
    const row=(t,i,isOn)=>'<div class="tbrow"><label class="ck"><input type="checkbox" data-sbx="'+s+'|'+t[0]+'"'+(isOn?' checked':'')+'> '+esc(L(t[1]))+'</label>'+
      (isOn?'<span class="tbmv"><button type="button" data-sbxmv="'+s+'|'+t[0]+'|up"'+(i?'':' disabled')+' aria-label="'+esc(L("Nach oben"))+'">▲</button><button type="button" data-sbxmv="'+s+'|'+t[0]+'|down"'+(i<on.length-1?'':' disabled')+' aria-label="'+esc(L("Nach unten"))+'">▼</button></span>':'')+'</div>';
    return '<section class="psec sbxsec"><h4>'+esc(L(title))+'</h4><p class="ghint">'+esc(L("Nur auf breiten Bildschirmen (ab 1300 Pixel), neben der Seite. Themen ankreuzen, Reihenfolge mit ▲ ▼ oder in der Seitenbox am Titel ziehen. Ein Thema steht auf einer Seite."))+'</p><div class="tbord">'+
      on.map(k=>avail.find(t=>t[0]===k)).filter(Boolean).map((t,i)=>row(t,i,true)).join("")+rest.map(t=>row(t,0,false)).join("")+'</div></section>'};
  return side("l","Seitenbox links")+side("r","Seitenbox rechts")}
document.addEventListener("change",e=>{const c=e.target.closest&&e.target.closest("[data-sbx]");if(!c)return;const [s,k]=c.dataset.sbx.split("|"),o=s==="l"?"r":"l",x=sbxGet();
  x[s]=x[s].filter(y=>y!==k);x[o]=x[o].filter(y=>y!==k);if(c.checked)x[s].push(k);sbxSet(x);render()});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-sbxmv]");if(!b)return;e.preventDefault();const [s,k,d]=b.dataset.sbxmv.split("|"),x=sbxGet(),l=x[s],i=l.indexOf(k),j=d==="up"?i-1:i+1;
  if(i<0||j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];sbxSet(x);render()});
window.sbxSec=sbxSec;
/* in the boxes: «+» opens the pull-down, choosing adds the topic at the end of that box; «−» takes a topic out */
document.addEventListener("click",e=>{const p=e.target.closest&&e.target.closest("[data-sbplus]");if(p){const ad=p.closest(".sbadd");ad.dataset.open=ad.dataset.open==="1"?"0":"1";draw();return}
  const d=e.target.closest&&e.target.closest("[data-sbdel]");if(d){const k=d.dataset.sbdel,x=sbxGet();x.l=x.l.filter(y=>y!==k);x.r=x.r.filter(y=>y!==k);sbxSet(x);draw();if(S.tab==="acct")render()}});
document.addEventListener("change",e=>{const sl=e.target.closest&&e.target.closest("[data-sbaddsel]");if(!sl||!sl.value)return;const s=sl.dataset.sbaddsel,k=sl.value,x=sbxGet();
  x.l=x.l.filter(y=>y!==k);x.r=x.r.filter(y=>y!==k);x[s].push(k);sbxSet(x);const ad=sl.closest(".sbadd");if(ad)ad.dataset.open="0";draw();if(S.tab==="acct")render()});
/* ---------- order by dragging the title of a topic (mouse, pen or finger): up or down in its box, or over into the other box.
   A line shows where it lands; on letting go the new order is kept like the order from «Mein Konto → App». Escape stops. ---------- */
let SBDR=null;
const sbDropAt=(x,y)=>{   /* the box under the pointer (or the nearer one) and the place in it: before the topic whose middle is below the pointer */
  const bs=["l","r"].map(s=>document.getElementById("sb"+s)).filter(a=>a&&!a.hidden&&a.style.visibility!=="hidden");if(!bs.length)return null;
  const a=bs.find(b=>{const r=b.getBoundingClientRect();return x>=r.left&&x<=r.right})||bs.reduce((p,b)=>{const r=b.getBoundingClientRect(),d=Math.min(Math.abs(x-r.left),Math.abs(x-r.right));return !p||d<p.d?{a:b,d}:p},null).a;
  const its=[...a.querySelectorAll(".today>[data-sbt]")].filter(el=>!SBDR||el!==SBDR.el);let i=its.findIndex(el=>{const r=el.getBoundingClientRect();return y<r.top+r.height/2});if(i<0)i=its.length;
  const ar=a.getBoundingClientRect(),ref=its[i],prev=its[i-1];const ly=ref?ref.getBoundingClientRect().top-3:prev?prev.getBoundingClientRect().bottom+3:ar.top+8;
  return {side:a.id==="sbl"?"l":"r",i,keys:its.map(el=>el.dataset.sbt),ly,lx:ar.left,lw:ar.width}};
function sbDragEnd(ok){const d=SBDR;SBDR=null;if(!d)return;document.documentElement.classList.remove("sbdragging");d.el.classList.remove("sbdrag");if(d.line)d.line.remove();
  try{d.h.releasePointerCapture(d.pid)}catch(_){}
  if(!ok||!d.moved||!d.at)return;const x=sbxGet(),k=d.el.dataset.sbt;
  /* the order as it stands now (visible topics) with the moved one at its new place; topics not shown (no right) stay where they were, at the end */
  const visible=d.at.keys.slice();visible.splice(d.at.i,0,k);const o=d.at.side==="l"?"r":"l";
  const hiddenRest=x[d.at.side].filter(y=>y!==k&&!visible.includes(y));x[d.at.side]=visible.concat(hiddenRest);x[o]=x[o].filter(y=>y!==k);
  sbxSet(x);draw();if(S.tab==="acct")render()}
document.addEventListener("pointerdown",e=>{if(INFRAME||e.button>0)return;const h=e.target.closest&&e.target.closest("aside.sbbox h3.sbh");if(!h||e.target.closest("button,select,input,a"))return;
  const el=h.closest(".today>[data-sbt]");if(!el)return;SBDR={el,h,pid:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,at:null,line:null};try{h.setPointerCapture(e.pointerId)}catch(_){}});
document.addEventListener("pointermove",e=>{const d=SBDR;if(!d||e.pointerId!==d.pid)return;
  if(!d.moved){if(Math.abs(e.clientX-d.x0)+Math.abs(e.clientY-d.y0)<6)return;d.moved=true;d.el.classList.add("sbdrag");document.documentElement.classList.add("sbdragging");   /* the frames do not catch the pointer while dragging */
    d.line=document.createElement("div");d.line.className="sbdrop";document.body.appendChild(d.line)}
  e.preventDefault();d.at=sbDropAt(e.clientX,e.clientY);if(d.at)Object.assign(d.line.style,{top:Math.round(d.at.ly)+"px",left:Math.round(d.at.lx+8)+"px",width:Math.round(d.at.lw-16)+"px"})});
document.addEventListener("pointerup",e=>{if(SBDR&&e.pointerId===SBDR.pid)sbDragEnd(true)});
document.addEventListener("pointercancel",e=>{if(SBDR&&e.pointerId===SBDR.pid)sbDragEnd(false)});
document.addEventListener("keydown",e=>{if(SBDR&&e.key==="Escape")sbDragEnd(false)});
