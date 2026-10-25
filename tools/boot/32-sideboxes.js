/* ---------- side boxes (wide desktop screens, from 1400 px): topics left and right of the page, chosen per person in «Mein Konto → App» ----------
   Topics drawn here (Jetzt, Mein Tag, Kacheln, Drehfolge, Fahrten, nächster Drehtag, Wetter) use the styles of the page (.sbview: the build gives
   every «#view» rule to «.sbview» too). Topics that are whole pages (Smartphone-Vorschau, User, Access, App-Einstellungen) are the app itself in a
   frame: fully usable, looking the same – each frame is a second copy of the app (its own live data), so only chosen ones are loaded.
   Setting: localStorage «sbx» = «now.mine|phone» (left|right, the order of the topics), kept with the other notices of the profile (prefs x). */
import {L,S,esc,todayISO} from "../base/10-core.js";
import {csHm,csMe,csMyRides,csRideReal,csTile} from "../base/13a-callsheet.js";
import {csMine,csTilesHTML} from "../base/13d-cs-mine.js";
import {VIEWS,tabsOn,vok} from "../base/14-render.js";
import {onRendered,render} from "../base/15-script-tab.js";
import {arr} from "../base/20-data-start.js";
import {ME,can,isAdmin} from "./03-core-firebase.js";
import {savePrefsSoon} from "./06-prefs-docs.js";
import {ADM} from "./12a-admin-core.js";
import {wxTile} from "./15-weather.js";
import {nowCardHTML,todayDay} from "./16-today-view.js";

/* [key, title, frame page (whole app in a frame) or "", may this person see it] */
/* frame pages: «t:tab» a page of the app, «a:sub» a part of the App-Verwaltung, «…:selector» only that part of the page; always the phone view (390 px, scaled) */
const SBT=[["now","Jetzt"],["mine","Mein Tag"],["tiles","Kacheln des Tages"],["order","Drehfolge heute"],["rides","Meine Fahrten"],["next","Nächster Drehtag"],["wx","Wetter"],
  ["phone","Smartphone-Vorschau","phone"],
  ["today","Today","t:today"],["plan","Drehplan","t:plan"],["dispo","Callsheet","t:dispo"],["loc","Locations","t:loc"],["crew","Crewliste","t:crew"],["script","Drehbuch","t:script"],["info","Info","t:info"],
  ["my","Meine Termine","t:my"],["bcast","Nachrichten","t:bcast"],["reports","Reports","t:reports"],["acct","Mein Konto","t:acct"],
  ["set","App-Einstellungen","a:set"],["users","Alle Benutzer","a:users"],["active","Gerade aktiv","a:users:.uact"],["roles","Rollen","a:roles:.admins:not(.pacc)"],["access","Wer hat welchen Zugriff?","a:roles:.pacc"]];
const sbCan=k=>{try{const t=SBT.find(x=>x[0]===k),pg=t&&t[2]||"";
    if(/^a:(users)/.test(pg))return isAdmin()||can("users.view")||can("users.edit")||can("users.invite");if(/^a:roles/.test(pg))return isAdmin()||can("roles.view")||can("roles.edit")||can("roles.assign");if(pg==="a:set")return isAdmin()||can("settings");
    if(k==="my")return vok("mycal");if(k==="bcast")return can("push.send");if(k==="reports")return typeof VIEWS==="undefined"||!!VIEWS.reports;if(k==="acct")return true;
    if(pg.startsWith("t:")){const tb=pg.slice(2);return (typeof tabsOn!=="function"||tabsOn().includes(tb))&&vok(tb==="dispo"?"dispo":tb)}}catch(_){return false}return true};
export const SBWIDE=1400;
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
  const go=()=>{if(!ME){setTimeout(go,500);return}if(kind==="a"){ADM.sub=sub;S.tab="admin"}else if(kind==="t")S.tab=sub;render();if(++n<3)setTimeout(go,1500)};setTimeout(go,300);
  if(only)onRendered(()=>{try{const el=document.querySelector("#view "+only);if(!el)return;for(let a=el;a&&a.id!=="view";a=a.parentElement)for(const sib of a.parentElement.children)if(sib!==a)sib.style.display="none"}catch(_){}})}

/* ---------- the topics drawn here ---------- */
/* the head of a topic: its title and «−» (takes it out of this box) */
const head=(k,t)=>'<h3 class="sbh"><span>'+esc(L(t))+'</span><button type="button" class="sbdel" data-sbdel="'+k+'" aria-label="'+esc(L("Entfernen")+": "+L(t))+'" title="'+esc(L("Entfernen"))+'">−</button></h3>';
/* a topic without content now (no callsheet yet …): only its head, so it can still be taken out */
const sec=(k,t,h)=>'<section class="sbsec'+(h?'':' sbempty')+'">'+head(k,t)+(h||'<p class="sbnone">'+esc(L("Zurzeit nichts"))+'</p>')+'</section>';
const dayNow=()=>{try{return todayDay()}catch(_){return null}};
const dpOf=d=>d?arr(S.dispos).find(x=>x&&x.date===d.date&&x.cs)||null:null;
const TOP={
  now:()=>{const h=nowCardHTML(todayISO());return h?'<div class="sbnow">'+h+'</div>':""},
  mine:()=>{const d=dayNow(),dp=dpOf(d);if(!dp)return"";let me=null;try{me=csMe()}catch(_){}const mn=me?csMine(dp.cs,me):[];return mn.length?'<div class="tcard tmine">'+mn.join("")+'</div>':""},
  tiles:()=>{const d=dayNow(),dp=dpOf(d);if(!dp)return"";let me=null;try{me=csMe()}catch(_){}let h=csTilesHTML(dp,d,dp.cs,me).replace(' id="cs-zeiten"','');
    try{const c2=dp.cs.u2&&window.cqU2?window.cqU2(Object.assign({},dp.cs,{_date:d.date})):null,tm=(c2&&c2.times)||{};
      if(c2&&(tm.crewCall||tm.rts||tm.lunch||tm.wrap)){const t2='<div class="tuh">2nd Unit</div><div class="dtiles cstiles">'+csTile("Crew Call",tm.crewCall,true)+csTile("RTS",tm.rts)+csTile("Lunch",tm.lunch)+csTile("Wrap",tm.wrap)+'</div>';
        const mu=window.csMyUnits(dp.cs,me);h=mu&&mu.length===1?(mu[0]==="2"?t2:h):'<div class="tuh">1st Unit</div>'+h+t2}}catch(_){}
    return '<div class="tcs">'+h+'</div>'},
  order:()=>{const d=dayNow();if(!d||d.kind!=="shoot")return"";const st=sc=>typeof scState==="function"?scState(d.date,String(sc)):0;
    const list=(its)=>arr(its).filter(i=>i&&(i.sc||i.n)).map(i=>'<div class="sbo'+(i.sc&&st(i.sc)===2?' done':i.sc&&st(i.sc)===1?' run':'')+'"><i>'+esc(i.t||"")+'</i>'+(i.sc?'<b>'+esc(String(i.sc))+'</b> <span>'+esc(i.set||"")+'</span>':'<span class="sbev">'+esc(i.n||"")+'</span>')+'</div>').join("");
    const u2=arr(d.unit2&&d.unit2.items);return (u2.length?'<div class="tuh">1st Unit</div>':'')+list(d.items)+(u2.length?'<div class="tuh">2nd Unit</div>'+list(u2):'')},
  rides:()=>{const d=dayNow(),dp=dpOf(d);if(!dp)return"";let me=null;try{me=csMe()}catch(_){}if(!me)return"";
    const rs=csMyRides(dp.cs,me).filter(csRideReal).sort((a,b)=>(csHm(a.t1)||"99").localeCompare(csHm(b.t1)||"99"));
    return rs.map(r=>'<div class="sbr"><b>'+esc(csHm(r.t1)||r.t1||"")+'</b> '+esc(r.from||"")+' → '+esc(r.to||"")+(r.t2?' <small>'+esc(r.t2)+'</small>':'')+'<small class="sbrv">'+esc([r.vehicle,r.driver].filter(Boolean).join(" · "))+'</small></div>').join("")},
  next:()=>{const d=dayNow(),t=todayISO();const nd=arr(S.days).find(x=>x&&x.kind==="shoot"&&x.date>(d&&d.date>t?d.date:t));if(!nd)return"";
    const u20=nd.unit2&&nd.unit2.hours?String(nd.unit2.hours):"";const fi=arr(nd.items).find(i=>i&&i.sc);
    let mu=null;try{const ndp=arr(S.dispos).find(x=>x&&x.date===nd.date&&x.cs);if(ndp)mu=window.csMyUnits(ndp.cs,csMe())}catch(_){}
    const u2=u20&&(!mu||mu.includes("2"))?u20:"",h1=!u20||!mu||mu.includes("1");
    return '<div class="sbnx"><b>'+esc(nd.short||nd.label||"")+'</b> '+esc(nd.date.split("-").reverse().slice(0,2).join("."))+'</div>'+(nd.hours&&h1?'<div class="sbnx">'+esc(L("Drehzeit"))+(u20?' 1st Unit':'')+': '+esc(nd.hours)+'</div>':'')+(u2?'<div class="sbnx">'+esc(L("Drehzeit"))+' 2nd Unit: '+esc(u2)+'</div>':'')+(fi?'<div class="sbnx">'+esc(L("Erste Szene"))+': <b>'+esc(String(fi.sc))+'</b> '+esc(fi.set||"")+'</div>':'')},
  wx:()=>{const d=dayNow();if(!d)return"";let h="";try{h=wxTile(d)}catch(_){}return h?'<div class="ttiles">'+h+'</div>':""}
};

/* ---------- the two boxes ---------- */
let BOX={};
function frame(k,pg){const f=document.createElement("div");f.className="sbframe"+(pg==="phone"?" sbphone":"");
  const i=document.createElement("iframe");i.src=location.pathname+"?sbx="+encodeURIComponent(k);i.title=k;i.loading="lazy";f.appendChild(i);return f}
/* always the phone view: every frame 390 px wide, scaled to the box; the phone 844 px high, a page 70 % of the window */
function fit(){for(const f of document.querySelectorAll(".sbbox .sbframe")){const w=f.clientWidth||320,s=Math.min(1,w/390),i=f.querySelector("iframe");if(!i)continue;
  const vis=f.classList.contains("sbphone")?Math.round(844*s):Math.round(window.innerHeight*0.7);i.style.transform="scale("+s+")";i.style.height=Math.round(vis/s)+"px";f.style.height=vis+"px"}}
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
    return '<section class="psec sbxsec"><h4>'+esc(L(title))+'</h4><p class="ghint">'+esc(L("Nur auf breiten Bildschirmen (ab 1400 Pixel), neben der Seite. Themen ankreuzen, Reihenfolge mit ▲ ▼. Ein Thema steht auf einer Seite."))+'</p><div class="tbord">'+
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
