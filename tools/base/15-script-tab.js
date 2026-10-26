import {$,L,LANG,LOC,S,TX,WD,ddmm,esc,markTerms,memo,norm,pvApply,svClasses,svToggles,todayISO,ufButtons} from "./10-core.js";
import {onlyU,unitLists,unitsOn} from "./11-schedule-prep.js";
import {addrForItem,srcHTML} from "./13-crew-views.js";
import {ALLTABS,VIEWS,tabsOn,vok} from "./14-render.js";
import {saveView,scallLabel,store} from "./16-interaction.js";
import {SCRIPT,closeScene,factsHTML,schedIndex,scriptData,spTitle,spTod} from "./17-scene-reader.js";
import {blkRow} from "./18-blocking.js";
import {SHINT,actorRoles,dayKeys,modeChips,normQ,planRoles,roleBadges,roleOverview,rolesFor} from "./19-search.js";
import {arr} from "./20-data-start.js";
import {ME,can,canAdm} from "../boot/03-core-firebase.js";
/* ---------- script tab: every scene of the screenplay, tap opens the reader ---------- */
let SCRIPTERR=false;
/* accent- and case-insensitive text for searching */
export const fold=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
/* one searchable text per scene: number, heading, script text and everything the schedule knows (set, description in all languages, cast names, address) */
function scriptIndex(sched){
  return memo("scidx:"+(SCRIPT?SCRIPT.length:0),()=>{const cast=(S.meta&&S.meta.cast)||{};
    return SCRIPT.map(x=>{const parts=[x.sc,x.head,x.text];
      for(const h of (sched[norm(x.sc)]||[])){const it=h.it;parts.push(it.set,it.loc,it.d,it.d_de,it.d_fr,it.d_it,h.d.short,h.d.label,(it.cast||[]).map(c=>cast[c]||"").join(" "));try{parts.push(addrForItem(it))}catch(_){}}
      return fold(parts.filter(Boolean).join(" \n "));});
  });
}
/* short excerpt around the first hit in the script text, hits highlighted */
function snippet(text,terms){
  const t=String(text||""),f=fold(t);let pos=-1,len=0;
  for(const q of terms){const i=f.indexOf(q);if(i>=0&&(pos<0||i<pos)){pos=i;len=q.length}}
  if(pos<0)return"";
  const a=Math.max(0,pos-50),b=Math.min(t.length,pos+len+80);
  const out=markTerms(t.slice(a,b).replace(/\s+/g," "),terms,2);
  return '<span class="sclsn">'+(a>0?'… ':'')+out+(b<t.length?' …':'')+'</span>';
}
export function renderScript(){
  if(!SCRIPT){
    /* one waiting at a time (before, every drawing while it loaded added another redraw at the end) */
    if(!SCRIPTERR&&!renderScript.wait){renderScript.wait=1;scriptData().then(l=>{renderScript.wait=0;if(!l.length)SCRIPTERR=true;if(S.tab==="script")render()},()=>{renderScript.wait=0;SCRIPTERR=true;if(S.tab==="script")render()})}
    return '<h3 class="dh">'+esc(L("Drehbuch"))+'</h3><div class="empty">'+(SCRIPTERR?esc(L("Drehbuch konnte nicht geladen werden."))+' <button class="copy" data-scretry>'+esc(L("Aktualisieren"))+'</button>':esc(L("Lade"))+' '+esc(L("Drehbuch"))+' …')+'</div>';
  }
  let last="";try{last=localStorage.getItem("lastsc")||""}catch(_){}
  const lx=last&&SCRIPT.find(x=>x.sc===last);
  return '<div class="svwrap '+svClasses()+'"><h3 class="dh">'+esc(L("Drehbuch"))+'</h3>'+(lx?'<button class="lastsc" data-scene="'+esc(lx.sc)+'"><span>'+esc(L("Zuletzt gelesen"))+'</span><b>'+esc(lx.sc)+' · '+spTitle(lx)+'</b><i aria-hidden="true">›</i></button>':'')+
    '<div class="svb svtab">'+ufButtons()+'<span class="svfill"></span>'+svToggles()+'</div>'+
    searchBox("sq",S.sq,L("Szene, Motiv, Rolle, Text …"))+modeChips(S.sqm,"data-sqm")+'<div id="scres">'+scriptResults()+'</div></div>';
}
/* search field with a search button; Enter / the keyboard's search key run the search right away */
export function searchBox(id,val,ph){
  return '<form class="sbox" role="search" data-sform="'+id+'"><input id="'+id+'" class="search" type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="'+esc(ph)+'" value="'+esc(val||"")+'">'+
    '<button type="submit" class="sbtn" aria-label="'+esc(L("Suchen"))+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/></svg></button></form>';
}
function scriptMatch(x,i,mode,terms,idx,sched){
  const hits=sched[norm(x.sc)]||[];
  if(mode==="sc")return terms.every(t=>fold(x.sc).replace(/\s+/g,"").startsWith(t));
  if(mode==="text")return terms.every(t=>fold(x.text||"").includes(t));
  if(mode==="loc"){const f=fold([x.head].concat(hits.map(h=>{let a="";try{a=addrForItem(h.it)}catch(_){}return [h.it.set,h.it.loc,a].join(" ")})).join(" "));return terms.every(t=>f.includes(t))}
  if(mode==="day"){if(!hits.length)return false;const f=hits.map(h=>dayKeys(h.d)).join(" ").split(/\s+/);return terms.every(t=>f.some(w=>w===t||(t.length>2&&w.startsWith(t))))}
  /* roles: the scenes where the role is cast in the Drehplan (not a text search in the script) */
  if(mode==="role"||mode==="person"){const ids=mode==="role"?rolesFor(terms).map(r=>r.id):actorRoles(terms);if(!ids.length)return false;const P=planRoles(x.sc);return ids.some(id=>P.has(id))}
  return terms.every(t=>idx[i].includes(t)||fold(x.sc)===t);
}
/* a ready-made choice under the search field (like the roles): scenes, shooting days, actors, locations */
function pickOverview(mode,sched){
  const row=(q,n,c)=>'<button type="button" class="rolerow" data-sqpick="'+esc(q)+'"><span class="rn">'+n+'</span>'+(c?'<span class="rc">'+c+'</span>':'')+'</button>';
  if(mode==="sc"&&SCRIPT)return '<div class="scpick">'+SCRIPT.map(x=>'<button type="button" class="scpk'+((sched[norm(x.sc)]||[]).length?'':' np')+'" data-sqpick="'+esc(x.sc)+'">'+esc(x.sc)+'</button>').join("")+'</div>';
  if(mode==="day"){const ds=S.days.filter(d=>d.kind==="shoot");if(!ds.length)return "";
    return '<div class="rolegrid">'+ds.map(d=>{const n=unitLists(d).reduce((a,[,its])=>a+its.filter(i=>i.sc).length,0),dt=new Date(d.date+"T12:00:00");
      return row(String(d.short||d.label),'<i>'+esc(d.short||d.label)+'</i>'+esc(WD[dt.getDay()]+" "+ddmm(dt)),n+' '+esc(L(n===1?"Szene":"Szenen")))}).join("")+'</div>'}
  if(mode==="person"){const m=new Map();for(const dp of S.dispos)for(const c of arr(dp&&dp.cast)){const a=String(c.actor||"").trim();if(a&&!m.has(a))m.set(a,String(c.role||""))}
    if(!m.size)return "";return '<div class="rolegrid">'+[...m].sort((a,b)=>a[0].localeCompare(b[0],LANG)).map(([a,r])=>row(a,esc(a),esc(r))).join("")+'</div>'}
  if(mode==="loc"){const m=new Map();for(const k in sched)for(const h of sched[k]){const t=String(h.it.set||"").trim();if(!t)continue;if(!m.has(t))m.set(t,new Set());m.get(t).add(k)}
    if(!m.size)return "";return '<div class="rolegrid">'+[...m].sort((a,b)=>a[0].localeCompare(b[0],LANG)).map(([t,ks])=>row(t,esc(t),ks.size+' '+esc(L(ks.size===1?"Szene":"Szenen")))).join("")+'</div>'}
  return ""}
export function scriptResults(){
  const sched=schedIndex(),mode=S.sqm||"all";
  const terms=(mode==="day"?normQ(S.sq||""):fold(S.sq||"")).split(/\s+/).filter(Boolean);
  if(!terms.length&&mode!=="all")return (mode==="role"?roleOverview(true,"data-sqpick"):pickOverview(mode,sched))+'<p class="shint">'+esc(L(mode==="person"?"Name der Schauspielerin oder des Schauspielers eingeben (aus den Callsheets).":mode==="text"?"Wörter aus dem Drehbuchtext eingeben.":SHINT[mode]))+'</p>';
  const uo=unitsOn(),sel=uo.filter(u=>S.uf[u]),allU=terms.length||!sel.length||sel.length===uo.length; /* a search always looks through all units */
  const hitsOf=x=>(sched[norm(x.sc)]||[]).filter(h=>allU||sel.includes(h.u));
  const idx=scriptIndex(sched);
  const rows=SCRIPT.filter((x,i)=>(allU||hitsOf(x).length)&&(!terms.length||scriptMatch(x,i,mode,terms,idx,sched)));
  const rIds=mode==="role"?rolesFor(terms).map(r=>r.id):mode==="person"?actorRoles(terms):[];
  /* own button with a tick: show / hide the comparison with the script for each role («✓ Drehplan und Drehbuch») */
  let rbOn=true;try{rbOn=localStorage.getItem("rbadges")!=="0"}catch(_){}
  const cnt='<p class="sccount">'+rows.length+' '+esc(L(rows.length===1?"Szene":"Szenen"))+(rIds.length?' <button type="button" class="pillbtn rbtog" data-rbtog aria-pressed="'+rbOn+'">'+(rbOn?'✓ ':'')+esc(L("Abgleich mit Drehbuch"))+'</button>':'')+'</p>';
  if(!rows.length)return cnt+'<div class="empty">'+esc(L("Nichts gefunden für"))+' «'+esc(S.sq)+'»</div>';
  return cnt+'<ul class="sclist">'+rows.map(x=>{   /* always all scenes */
    const hits=hitsOf(x);
    return '<li class="scard"><button class="scli" data-scene="'+esc(x.sc)+'"><span class="sclin">'+esc(x.sc)+'</span><span class="sclih">'+spTitle(x)+'</span>'+spTod(x)+
      (hits.length?'':'<span class="sclid"><i>'+esc(L("nicht geplant"))+'</i></span>')+(rIds.length&&rbOn?roleBadges(x.sc,rIds):'')+(terms.length&&!rIds.length?(snippet(x.text,terms)||'<span class="sclsn">'+esc(L("Treffer im Drehplan (Motiv, Cast oder Beschreibung)"))+'</span>'):'')+'</button>'+(hits.length?factsHTML(hits):blkRow(x.sc))+'</li>';
  }).join("")+'</ul>';
}
export function fmtStamp(iso){try{return new Date(iso).toLocaleString(LOC[LANG],{day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"})}catch(_){return ""}}
export function lastCheck(m){return m?[m.checkedAt,m.updatedAt].filter(Boolean).sort().pop()||null:null}
function subT(m){
  const t=TX(m,"subtitle");if(LANG==="de"||t!==m.subtitle)return t;
  return t.replace(/^Dreh\s+(?:im\s+)?Wallis/i,({fr:"Tournage en Valais",it:"Riprese in Vallese"})[LANG]||"Shooting in Valais").replace(/^Dreh\b/i,({fr:"Tournage",it:"Riprese"})[LANG]||"Shoot");
}
function renderHeader(){
  const m=S.meta;
  if(m){
    const c=lastCheck(m);
    /* after the schedule version: the script version (only for people who see the script) */
    const sv=m.scriptVersion&&vok("script")?' <span class="scv">· '+esc(L("Drehbuch"))+' '+esc(m.scriptVersion)+'</span>':'';
    $("#stand").innerHTML='<b>'+esc(m.scheduleVersion||"–")+'</b>'+sv+(c?' <span class="chk">· '+L('geprüft')+' '+esc(fmtStamp(c))+'</span>':'');
    /* year short (2026 → 26); phone: two lines without the dot */
    if(m.subtitle)$("#sub").innerHTML=subT(m).replace(/\b20(\d\d)\b/g,"$1").split(" · ").map((x,i)=>'<span class="subp">'+(i?'<span class="subsep">· </span>':'')+esc(x)+"</span>").join(" ");
  }else if(S.loaded){$("#stand").textContent=L("Noch keine Daten eingespielt.")}
}
/* the main admin can switch the 2nd unit off (website: window.UNIT2=false); then only the 1st unit is shown and the unit buttons disappear */
/* shrink the round buttons of a toolbar evenly until the row fits on one line */
export function fitRows(root){
  (root||document).querySelectorAll(".svb,.dtitle,.lvb,.admv").forEach(r=>{
    r.style.removeProperty("--circ");
    if(!r.offsetParent||r.scrollWidth<=r.clientWidth+1)return;
    const c=parseFloat(getComputedStyle(r).getPropertyValue("--circ"))||30;
    const n=r.querySelectorAll(".pvbtn,.thmb,.uf,.pub button,.foodtog.ico").length||1;
    let v=Math.max(20,Math.floor(c-(r.scrollWidth-r.clientWidth)/n)-0);r.style.setProperty("--circ",v+"px");
    while(v>20&&r.scrollWidth>r.clientWidth+1){v-=1;r.style.setProperty("--circ",v+"px")}
  });
  /* text-button rows (search modes, sub-tabs, header icons, scene buttons): shrink evenly when the row is too narrow */
  (root||document).querySelectorAll(".smodes,.asub,.hbtns,.myhead,.mcpick,.fpls").forEach(r=>{
    r.style.removeProperty("--bs");
    if(!r.offsetParent)return;
    const kids=r.children,hb=r.classList.contains("hbtns"),over=()=>r.scrollWidth>r.clientWidth+(hb?10:1)||(!r.classList.contains("hbtns")&&[...kids].some(c=>c.scrollWidth>c.clientWidth+1&&c.tagName==="BUTTON"))||(r.classList.contains("smodes")&&kids.length>1&&kids[kids.length-1].offsetTop>kids[0].offsetTop+2);
    let b=1;while(b>0.72&&over()){b=Math.round((b-0.04)*100)/100;r.style.setProperty("--bs",b)}
  });
}
window.addEventListener("resize",()=>{clearTimeout(window.__fitT);window.__fitT=setTimeout(()=>{fitRows();fitRows(document.querySelector("header")||document);const sc=document.getElementById("scn");if(sc)fitRows(sc)},120)});
document.addEventListener("focusout",e=>{if(!S.rpend||!e.target.closest||!e.target.closest("#view form"))return;
  setTimeout(()=>{const ae=document.activeElement;if(S.rpend&&!(ae&&/^(INPUT|TEXTAREA)$/.test(ae.tagName)&&ae.closest("#view form")))render()},150)});
function fitNav(){const n=document.querySelector("nav.tabs");if(!n)return;n.classList.remove("short");
  if([...n.querySelectorAll("button:not([hidden]) .lbl")].some(l=>l.scrollWidth>l.clientWidth+1))n.classList.add("short")}
/* Handy: Adressen, die umbrechen, kürzen «…strasse» zu «…str.» (nur der sichtbare Text, der Link bleibt) */
export function fitAddr(root){if(!root||innerWidth>600)return;
  const lines=el=>{const cs=getComputedStyle(el);if(cs.display==="inline")return el.getClientRects().length;const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.3;return Math.round(el.getBoundingClientRect().height/lh)};
  root.querySelectorAll('.addr,a[target="_blank"]').forEach(el=>{if(!/strasse/i.test(el.textContent)||lines(el)<2)return;
    el.childNodes.forEach(n=>{if(n.nodeType===3)n.nodeValue=n.nodeValue.replace(/(\p{L})strasse\b/giu,"$1str.").replace(/\bStrasse\b/g,"Str.").replace(/\bstrasse\b/g,"str.")})})}
window.addEventListener("resize",()=>{clearTimeout(window.__fnT);window.__fnT=setTimeout(()=>{fitNav();try{fitAddr(document.getElementById("view"))}catch(_){}},120)});
/* ---------- targeted redraw: the new page is compared with the one on the screen and only what changed is touched (scroll position,
   focus, running maps and pictures stay; much less work after a tap). Same result as replacing everything: attributes, texts and form values
   follow the new page exactly – except the field someone is typing in. Fallback: replace everything (error, or localStorage «morph»=0) ---------- */
const MORPHOFF=(()=>{try{return localStorage.getItem("morph")==="0"}catch(_){return false}})();
function viewMorph(v,html){
  if(MORPHOFF){v.innerHTML=html;return}
  const t=document.createElement("template");t.innerHTML=html;const nw=t.content;
  const same=(a,b)=>a.nodeType===b.nodeType&&(a.nodeType!==1||(a.tagName===b.tagName&&(a.id||"")===(b.id||"")&&(a.getAttribute("data-k")||"")===(b.getAttribute("data-k")||"")));
  /* which section a <details> is (another section in the same place – other day, other page – takes the state of the new page) */
  const dkey=el=>{let sm=null;for(const c of el.children)if(c.tagName==="SUMMARY"){sm=c;break}return (el.id||"")+"|"+(el.getAttribute("data-k")||"")+"|"+(el.getAttribute("data-sec")||"")+"|"+(sm?sm.textContent.slice(0,80):"")};
  const kept=el=>el.nodeType===1&&(el.__map||el.classList.contains("leaflet-container"));   /* a running map: kept as long as its points are the same */
  function node(a,b){
    if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return a}
    if(kept(a)){if(a.getAttribute("data-csmap")!==b.getAttribute("data-csmap")){a.replaceWith(b);return b}return a}
    const tg=a.tagName,act=a===document.activeElement,dt=tg==="DETAILS";
    for(const at of [...a.attributes])if(!b.hasAttribute(at.name)&&!(dt&&at.name==="open"))a.removeAttribute(at.name);
    for(const at of [...b.attributes])if(a.getAttribute(at.name)!==at.value&&!(dt&&at.name==="open"))a.setAttribute(at.name,at.value);
    if(tg==="TEXTAREA"){if(!act&&a.value!==b.value)a.value=b.value;return a}
    kids(a,b);
    if(tg==="INPUT"&&!act){const v0=b.getAttribute("value");if(a.type==="checkbox"||a.type==="radio")a.checked=b.hasAttribute("checked");else if(a.type!=="file"&&a.value!==(v0==null?"":v0))a.value=v0==null?"":v0}
    if(tg==="SELECT"&&!act){const i=[...b.options].findIndex(o=>o.hasAttribute("selected"));a.selectedIndex=i>=0?i:(a.options.length?0:-1)}
    /* a section opened or closed by hand stays so on a new drawing; only a change of the page itself (open in the new HTML, not in the last) applies */
    if(dt){const want=b.hasAttribute("open"),k=dkey(b);if(a.__op===undefined||a.__op!==want||a.__ok!==k)a.open=want;a.__op=want;a.__ok=k}
    return a}
  function kids(a,b){let ac=a.firstChild,bc=b.firstChild;
    while(bc){const nb=bc.nextSibling;
      if(ac&&same(ac,bc)){node(ac,bc);ac=ac.nextSibling}
      else{let m=null;if(bc.nodeType===1&&bc.id){for(let x=ac&&ac.nextSibling;x;x=x.nextSibling)if(x.nodeType===1&&x.id===bc.id){m=x;break}}
        if(m&&same(m,bc)){a.insertBefore(m,ac);node(m,bc)}else a.insertBefore(bc,ac)}
      bc=nb}
    while(ac){const n=ac.nextSibling;a.removeChild(ac);ac=n}}
  try{kids(v,nw)}catch(err){console.warn("morph",err);v.innerHTML=html;return}
  for(const d of v.querySelectorAll("details"))if(d.__op===undefined){d.__op=d.open;d.__ok=dkey(d)}   /* new sections: as drawn */
  /* the page itself may be unchanged at the top: tell the watchers of #view (filters, «jetzt», jump bar …) that it was drawn */
  const c=document.createComment("");v.appendChild(c);v.removeChild(c)}
window.viewMorph=viewMorph;
/* other parts hook into every drawing with onRender(fn) (before) / onRendered(fn) (after) – instead of replacing render */
const RENDER_PRE=[],RENDER_POST=[];export function onRender(fn){RENDER_PRE.push(fn)}export function onRendered(fn){RENDER_POST.push(fn)}
export function render(){window.__mctx=null;   /* a drawing that stopped half-way must not leave the context of its day for the next */
  for(const f of RENDER_PRE)try{f()}catch(err){console.warn("render hook",err)}const x=renderCore();for(const f of RENDER_POST)try{f()}catch(err){console.warn("render hook",err)}return x}
function renderCore(){try{if(window.rideEditApply)rideEditApply()}catch(_){}
  {const ae=document.activeElement;if(ae&&/^(INPUT|TEXTAREA)$/.test(ae.tagName)&&!/^(checkbox|radio|search)$/.test(ae.type)&&ae.closest("#view form")){S.rpend=true;return}} /* never wipe a form someone is typing in – catch up when the field is left */
  S.rpend=false;
  /* a page without access (e.g. the last page of an account whose rights were changed): back to the start page instead of «Kein Zugang» */
  try{if(typeof ME!=="undefined"&&ME&&((S.tab==="my"&&!vok("mycal"))||(S.tab==="bcast"&&!(can("push.send")&&window.PUSHEN!==false))||(S.tab==="admin"&&typeof canAdm==="function"&&!canAdm()))){S.tab=(typeof tabsOn==="function"&&tabsOn()[0])||"plan";try{store("tab",S.tab)}catch(_){}}}catch(_){}
  /* «Today» comes with the website part that loads a moment later: until then show nothing instead of flashing the schedule */
  if(S.tab==="today"&&!VIEWS.today&&!S.todayGone){const v0=$("#view");if(v0&&!v0.dataset.wait){v0.dataset.wait="1";v0.innerHTML='<div class="empty"></div>'}document.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab==="today"));
    if(!S.todayWaitT)S.todayWaitT=setTimeout(()=>{if(!VIEWS.today){S.todayGone=true;render()}},6000);return}
  {const v0=$("#view");if(v0&&v0.dataset.wait)delete v0.dataset.wait}
  /* a page that is not available yet (e.g. before sign-in) is remembered and opened as soon as it is */
  const tOn=tabsOn();if(S.want&&Date.now()-S.wantAt>30000)S.want=null;if(S.want&&VIEWS[S.want]&&(!ALLTABS.includes(S.want)||tOn.includes(S.want))){S.tab=S.want;S.want=null}
  if(!VIEWS[S.tab]||(ALLTABS.includes(S.tab)&&!tOn.includes(S.tab))){if(!S.want&&!S.wantAt){S.want=S.tab;S.wantAt=Date.now()}S.tab=tOn[0]}
  const nb=document.querySelectorAll("nav.tabs button[data-tab]");nb.forEach(b=>{b.hidden=!tOn.includes(b.dataset.tab);b.style.order=String(tOn.indexOf(b.dataset.tab))});
  const nin=document.querySelector("nav.tabs .in");if(nin)nin.style.setProperty("--ntabs",tOn.length);
  const uo=unitsOn();document.body.classList.toggle("no-u2",uo.length<2);const noScr=window.SCRIPTON===false||!vok("script");document.body.classList.toggle("no-script",noScr);if(noScr){const sc=document.getElementById("scn");if(sc&&!sc.hidden)closeScene()}
  for(const u of ["2","3"])if(!uo.includes(u)){if(S.pu[u])S.pu=Object.assign({},S.pu,{[u]:false});if(S.uf[u])S.uf=Object.assign({},S.uf,{[u]:false})}
  if(!uo.some(u=>S.pu[u]))S.pu=Object.assign({},S.pu,{"1":true});
  if(uo.length<2&&!S.uf["1"])S.uf=Object.assign({},S.uf,{"1":true});
  document.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===S.tab));
  const v=$("#view");
  const focusQ=document.activeElement&&document.activeElement.id==="q";
  let html;
  try{html=VIEWS[S.tab]()+(S.tab==="admin"?"":srcHTML())}
  catch(err){console.error(err);html='<div class="empty">'+esc(L("Diese Ansicht konnte nicht angezeigt werden."))+'<br><small>'+esc(err&&err.message||err)+'</small></div>'}
  /* keep what someone has typed or ticked in an open form when the page re-renders (data refresh, list reload) */
  const fkey=f=>[f.className,f.dataset.role,f.dataset.af,f.dataset.adm,f.dataset.em].map(x=>x||"").join("|");
  const keep={};v.querySelectorAll("form").forEach(f=>{const vals=[];f.querySelectorAll("input,select,textarea").forEach(el=>{if(el.type==="file"||el.type==="hidden"||el.type==="submit")return;vals.push([el.name,el.value,el.type==="checkbox"||el.type==="radio"?el.checked:null,el.dataset.dirty==="1"])});keep[fkey(f)]=vals});
  viewMorph(v,html);
  v.querySelectorAll("form").forEach(f=>{const vals=keep[fkey(f)];if(!vals)return;const els=[...f.querySelectorAll("input,select,textarea")].filter(el=>!(el.type==="file"||el.type==="hidden"||el.type==="submit"));
    vals.forEach((x,i)=>{const el=els[i];if(!el||el.name!==x[0]||!x[3])return;if(x[2]!==null)el.checked=x[2];else el.value=x[1];el.dataset.dirty="1"})});
  if(focusQ){const q=$("#q");if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}
  scallLabel();
  {const sel=v.querySelector('.chip[aria-selected="true"]'),st=v.querySelector(".strip.in"),tdy=todayISO();
    const first=st&&([...st.querySelectorAll(".chip[data-dt]")].find(c=>c.dataset.dt>=tdy&&(!onlyU()||c.classList.contains("u2day")))||[...st.querySelectorAll(".chip[data-dt]")].find(c=>c.dataset.dt>=tdy));
    if(st&&sel&&onlyU()&&sel.classList.contains("u2day"))st.scrollLeft=Math.max(0,sel.offsetLeft-st.offsetLeft-2);   /* only 2nd unit: its day at the very left */
    else if(st&&first&&!(sel&&sel.dataset.dt&&sel.dataset.dt<tdy)){st.scrollLeft=Math.max(0,first.offsetLeft-st.offsetLeft-2);
      if(sel&&sel.offsetLeft+sel.offsetWidth>st.scrollLeft+st.clientWidth+st.offsetLeft)sel.scrollIntoView({block:"nearest",inline:"end"})}
    else if(sel)sel.scrollIntoView({block:"nearest",inline:"center"})}
  try{renderHeader()}catch(err){console.error(err)}
  try{fitNav()}catch(_){}
  try{fitRows(document.querySelector("header.top"))}catch(_){}
  {const mb=document.getElementById("myCalBtn");if(mb)mb.hidden=!vok("mycal")}
  for(const [id,t] of [["myCalBtn","my"],["bcBtn","bcast"],["repBtn","reports"],["acctBtn","acct"],["admBtn","admin"]]){const hb=document.getElementById(id);if(hb){hb.classList.toggle("on",S.tab===t);hb.setAttribute("aria-current",S.tab===t?"page":"false")}}
  try{pvApply();fitRows(v)}catch(_){}
  try{fitAddr(v)}catch(_){}
  saveView();
}

export function setSCRIPTERR(v){return SCRIPTERR=v}   /* other parts change SCRIPTERR only through this */
