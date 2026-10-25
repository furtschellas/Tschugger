import {L,S,esc,safeUrl,saveErr,todayISO} from "./10-core.js";
import {rideId} from "./12-mycal.js";
import {CSI,csA,csAfter,csHm,csOn,csRows} from "./13a-callsheet.js";
import {CSCUR,csHM,csShootDay} from "./13b-cs-now.js";

import {fold,render} from "./15-script-tab.js";
import {showMsg} from "./20-data-start.js";
import {fb} from "../boot/03-core-firebase.js";
import {confirmSafe} from "../boot/12a-admin-core.js";
import {savedPop} from "../boot/17-audit-misc.js";
/* ---------- Callsheet (6/6): after drawing – search and «Nur meins», preview, cast view, map, cast now ---------- */
/* jump bar: open the part and go there */
csOn("click",e=>{const b=e.target.closest("[data-csj]");if(!b)return;const all=({trans:["trans","ctrans"]}[b.dataset.csj]||[b.dataset.csj]).map(k=>document.getElementById("cs-"+k)).filter(Boolean);const el=all[0]||document.getElementById("cs-travel");if(!el)return;/* only the chosen part open: the other open parts close (the production information stays) */
  document.querySelectorAll("#view details.cssec[open]").forEach(d=>{if(!all.includes(d)&&!d.classList.contains("csinfo"))d.open=false});
  all.forEach(d=>{if(d.tagName==="DETAILS")d.open=true});if(el.tagName==="DETAILS")el.open=true;el.scrollIntoView({block:"start",behavior:"smooth"})});
/* search in the callsheet and «Nur meins»: only matching rows, cards and lines; parts with a search hit open */
export let CSMINE=false;try{CSMINE=localStorage.getItem("csmine:v1")==="1"}catch(_){}
const CSITEMS=".csorder>li,.cs-card,.cs-tbl tbody tr,.cscall-r,.csdep,.csloc,.cskey>div,.cslist,.csinfo p,.cstrv,.csdrv-r";
function csMineTest(){const me=CSCUR.me,c=CSCUR.c;if(!me||!c)return null;
  /* my scenes as cast: my number in the cast column of the shooting order */
  const no=(csA(c.cast).find(r=>me.hit(r.actor))||{}).no,sc=new Set();
  if(no)for(const r of csRows(c))if(r.sc&&String(r.cast||"").split(/[^0-9a-z]+/i).includes(String(no).trim()))sc.add(String(r.sc));
  return it=>it.classList.contains("mine")||(it.matches(".csorder>li")?sc.has(it.dataset.sc||""):me.hit(it.textContent))}
function csFilter(v){v=v||document.querySelector("#view .csview");if(!v)return;const jb=v.previousElementSibling,inp=(jb&&jb.querySelector("#csq"))||document.getElementById("csq");
  const q=fold(String(inp&&inp.value||"").trim()),mt=CSMINE?csMineTest():null;v.classList.toggle("csmineon",!!mt);
  /* special characters and spellings do not matter (as in the app search) */
  const sq=x=>fold(x).replace(/ß/g,"ss").replace(/ae/g,"a").replace(/oe/g,"o").replace(/ue/g,"u").replace(/[^a-z0-9]/g,""),qs=sq(q),hit=t=>fold(t).includes(q)||(qs.length>1&&sq(t).includes(qs));
  /* locations and production information stay with «Nur meins» */
  v.querySelectorAll(CSITEMS).forEach(it=>{it.hidden=(!!q&&!hit(it.textContent))||(!!mt&&!it.matches(".csloc,.csinfo p")&&!mt(it))});
  v.querySelectorAll("details.cssec").forEach(d=>{const its=[...d.querySelectorAll(CSITEMS)];if(!q&&!mt){d.hidden=false;return}
    const vis=its.some(it=>!it.hidden);if(q){const ok=vis||hit(d.querySelector("summary").textContent);d.hidden=!ok;if(ok)d.open=true}else d.hidden=its.length>0&&!vis});
  v.querySelectorAll(".cscall").forEach(g=>{g.hidden=(!!q||!!mt)&&![...g.querySelectorAll(".cscall-r")].some(r=>!r.hidden)})}
/* the search text stays when the page is drawn again (the minute redraw, a tick …) */
window.CSQV="";window.CSQD="";
/* one pass after each drawing: search and «Nur meins» together (before, both filtered the page one after the other); another day (also via Today
   or a push) starts without the old search */
csAfter(()=>{const d=typeof CSCUR!=="undefined"&&CSCUR.date||"";if(d&&d!==window.CSQD){if(window.CSQD&&window.CSQV){window.CSQV="";const q=document.getElementById("csq");if(q)q.value=""}window.CSQD=d}
  if(window.CSQV||CSMINE)try{document.querySelectorAll("#view .csview").forEach(x=>csFilter(x))}catch(_){}});document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-dday]"))window.CSQV=""},true);   /* another day: a new search */
document.addEventListener("input",e=>{if(e.target&&e.target.id==="csq"){window.CSQV=String(e.target.value||"");const jb=e.target.closest(".csjump"),nx=jb&&jb.nextElementSibling;csFilter(nx&&nx.classList.contains("csview")?nx:null)}});
csOn("click",e=>{const b=e.target.closest&&e.target.closest("[data-csmine],[data-cspdf]");if(!b)return;
  if(b.dataset.cspdf!=null){window.open(b.dataset.cspdf,"_blank","noopener");return}
  CSMINE=!CSMINE;try{localStorage.setItem("csmine:v1",CSMINE?"1":"0")}catch(_){}
  document.querySelectorAll("#view [data-csmine]").forEach(x=>x.setAttribute("aria-pressed",CSMINE?"true":"false"));document.querySelectorAll("#view .csview").forEach(v=>csFilter(v))});

/* open or close all locations */
/* search field opens from the magnifier */
csOn("click",e=>{const b=e.target.closest("[data-csqb]");if(!b)return;const q=document.getElementById("csq");if(!q)return;q.hidden=!q.hidden;b.setAttribute("aria-pressed",String(!q.hidden));if(!q.hidden)q.focus();else if(q.value){q.value="";q.dispatchEvent(new Event("input",{bubbles:true}))}});
/* cast: cards or table (remembered on this device) */
/* cast: always tiles when opened; «Als Tabelle» only until it is closed again */
let CSCASTT=false;export function csCastMode(){return CSCASTT}
function csApplyCast(){for(const d of document.querySelectorAll("#cs-cast,#cs-u2cast"))csApplyCast1(d)}
function csApplyCast1(d){const t=csCastMode();d.classList.toggle("cs-astbl",t);const b=d.querySelector("[data-cstview]");
  if(b)b.innerHTML=(t?CSI.cards:CSI.table)+'<span>'+esc(L(t?"Als Kacheln":"Als Tabelle"))+'</span>'}
csOn("click",e=>{if(!e.target.closest("[data-cstview]"))return;CSCASTT=!CSCASTT;csApplyCast()});
csOn("toggle",e=>{const d=e.target;if(d&&(d.id==="cs-cast"||d.id==="cs-u2cast")&&d.open&&CSCASTT){CSCASTT=false;csApplyCast()}},true);
csOn("click",e=>{const sm=e.target.closest("#cs-order>summary,#cs-orderu2>summary");if(!sm||e.target.closest("a,button"))return;const d=sm.parentElement;e.preventDefault();
  /* opens in two steps: minimum (folded) → middle (the rows, scenes folded) → all (every scene open) → folded again */
  const sc=[...d.querySelectorAll("details.csscd")],all=sc.length&&sc.every(x=>x.open);
  if(!d.open){d.open=true;sc.forEach(x=>x.open=false);d.dataset.all="0"}else if(sc.length&&!all){sc.forEach(x=>x.open=true);d.dataset.all="1"}else{sc.forEach(x=>x.open=false);d.dataset.all="0";d.open=false}});
csOn("click",e=>{const sm=e.target.closest("#cs-loc>summary,#cs-u2loc>summary");if(!sm||e.target.closest("a"))return;e.preventDefault();const d=sm.parentElement;d.open=true;
  const ls=[...d.querySelectorAll("details.csloc")],all=ls.length&&ls.every(x=>x.open);ls.forEach(x=>x.open=!all);d.dataset.all=all?"0":"1"});
csOn("click",e=>{const b=e.target.closest("[data-cssc]");if(!b)return;e.preventDefault();e.stopPropagation();const sc=b.dataset.cssc;
  const od=document.getElementById("cs-order");if(!od)return;od.open=true;const li=[...od.querySelectorAll("li[data-sc]")].find(l=>l.dataset.sc===sc);if(!li)return;
  const d=li.querySelector("details.csscd");if(d)d.open=true;li.scrollIntoView({block:"center",behavior:"smooth"});li.classList.add("csflash");setTimeout(()=>li.classList.remove("csflash"),1600)},true);

/* the interactive map (Leaflet, loaded only when the map is opened; tiles from OpenStreetMap) */
/* maps of earlier drawings are removed (each redraw made a new one; the old ones stayed in memory with their resize handlers and tiles) */
const CSMAPS=[];csAfter(()=>{for(let i=CSMAPS.length-1;i>=0;i--){const m=CSMAPS[i];let gone=true;try{gone=!m.getContainer().isConnected}catch(_){}if(gone){try{m.remove()}catch(_){}CSMAPS.splice(i,1)}}});
let CSLF=null;function csLeaflet(){if(window.L&&window.L.map)return Promise.resolve(window.L);if(CSLF)return CSLF;
  CSLF=new Promise((ok,no)=>{if(!document.querySelector('link[href="leaflet.css"]')){const c=document.createElement("link");c.rel="stylesheet";c.href="leaflet.css";document.head.appendChild(c)}   /* once, also after a failed try */
    const s=document.createElement("script");s.src="leaflet.js";s.onload=()=>ok(window.L);s.onerror=()=>{CSLF=null;no(new Error("leaflet"))};document.head.appendChild(s)});return CSLF}
function csMapInit(box){if(!box||box.__map)return;let pts=[];try{pts=JSON.parse(box.dataset.csmap||"[]")}catch(_){}if(!pts.length)return;
  return csLeaflet().then(LF=>{if(box.__map||!box.isConnected)return;const m=LF.map(box,{scrollWheelZoom:false,tap:true});box.__map=m;CSMAPS.push(m);
    /* map or satellite (switch bottom left) */
    const osm=LF.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(m);
    const sat=LF.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"Esri, Maxar, Earthstar Geographics"});
    LF.control.layers({[L("Karte")]:osm,[L("Satellit")]:sat},null,{position:"bottomleft"}).addTo(m);
    const b=[];box.__mk=[];for(const p of pts){const lab=p.h||esc(p.c);   /* only the code on the map, the scenes with their times in the popup */
      const mk=LF.marker(p.p,{icon:LF.divIcon({className:"csmk"+(p.h?" csmkb":"")+(p.m?" min":"")+(p.r?" rough":""),html:'<span'+(p.k?'':' class="csmk0"')+' style="--k:'+(p.k||0)+'">'+lab+"</span>",iconSize:null}),zIndexOffset:p.m?0:1000}).addTo(m);
      mk.bindPopup("<b>"+esc(p.c)+"</b> "+esc(p.n)+(p.st&&p.st.length?'<div class="csmpst">'+p.st.map(x=>'<div><span class="csmpsc">'+esc(x[0])+'</span> '+esc(x[1])+'</div>').join("")+'</div>':(p.s?"<br>"+esc(L("Szenen"))+": "+esc(p.s):""))+(p.r?"<br><i>"+esc(L(p.r===2?"Position ungefähr beim Set":"Position ungefähr"))+"</i>":"")+(p.u?'<br><a href="'+esc(safeUrl(p.u))+'" target="_blank" rel="noopener noreferrer">Google Maps</a>':""));box.__mk.push(mk);b.push(p.p)}
    /* the shared Google map: small round points, lines and areas in their colour; name, text and «Google Maps» in the popup (not used for the zoom) */
    let gm=[];try{gm=JSON.parse(box.dataset.csgm||"[]")}catch(_){}
    for(const f of gm){const col=f.c||"#8a8f98",pop="<b>"+esc(f.n||"")+"</b>"+(f.l?' <small>'+esc(f.l)+'</small>':"")+(f.d?'<div class="csgmd">'+esc(f.d).replace(/\n/g,"<br>")+'</div>':"")+'<br><a href="https://www.google.com/maps/search/?api=1&query='+(+f.x[0][0])+','+(+f.x[0][1])+'" target="_blank" rel="noopener noreferrer">Google Maps</a>';
      const o=f.g==="l"?LF.polyline(f.x,{color:col,weight:3,opacity:.85}):f.g==="a"?LF.polygon(f.x,{color:col,weight:2,fillOpacity:.15}):LF.circleMarker(f.x[0],{radius:6,color:"#fff",weight:1.5,fillColor:col,fillOpacity:.95});
      o.bindPopup(pop).addTo(m);if(f.g==="p"&&f.n)o.bindTooltip(esc(f.n),{direction:"top",offset:[0,-6]})}
    box.__b=b;csMapFit(box)}).catch(()=>{box.innerHTML='<p class="ghint">'+esc(L("Karte nicht verfügbar (offline?)."))+'</p>'})}
/* all places of the day at one glance (also the small parking points); again after opening or enlarging (the size changed) */
function csMapFit(box){const m=box&&box.__map,b=box&&box.__b;if(!m||!b||!b.length)return;m.invalidateSize();
  if(b.length>1)m.fitBounds(b,{paddingTopLeft:[40,60],paddingBottomRight:[40,30],maxZoom:16});else m.setView(b[0],15)}
csOn("toggle",e=>{const d=e.target;if(d&&d.id==="cs-karte"&&d.open){const box=d.querySelector("[data-csmap]");if(box&&box.__map)setTimeout(()=>csMapFit(box),60);else csMapInit(box)}},true);
/* a location in the list below the map: show it on its own */
csOn("click",e=>{const b=e.target.closest("[data-csmapgo]");if(!b)return;const box=b.closest(".csmapw").querySelector("[data-csmap]");if(!box)return;
  const go=()=>{const m=box.__map,mk=box.__mk&&box.__mk[+b.dataset.csmapgo];if(!m||!mk)return;m.setView(mk.getLatLng(),17);mk.openPopup()};
  if(box.__map)go();else{const p=csMapInit(box);if(p&&p.then)p.then(()=>setTimeout(go,60)).catch(()=>{});else setTimeout(go,900)}});   /* after the map library has loaded (slow phones: more than 0.9 s) */
/* enlarge / shrink the map */
csOn("click",e=>{const b=e.target.closest("[data-csmapbig]");if(!b)return;e.preventDefault();const w=b.closest(".csmapw");w.classList.toggle("big");
  const box=w.querySelector("[data-csmap]");setTimeout(()=>csMapFit(box),80)});

/* cast: role and actor columns on/off (remembered on this device; both shown at first) */
export function csCols(){try{return new Set(String(localStorage.getItem("cscols:v1")||"").split(",").filter(Boolean))}catch(_){return new Set()}}
csOn("click",e=>{const b=e.target.closest("[data-cscol]");if(!b)return;e.preventDefault();const k=b.dataset.cscol,h=csCols();if(h.has(k))h.delete(k);else h.add(k);
  try{localStorage.setItem("cscols:v1",[...h].join(","))}catch(_){}for(const d of document.querySelectorAll("#cs-cast,#cs-u2cast"))d.classList.toggle("hide-"+k,h.has(k));b.setAttribute("aria-pressed",String(!h.has(k)))});

/* cast of today: a pink frame around the time that is running now (P/UP, call, costume, make-up, base, on set) – in the table and in the cards */
function csCastNow(){for(const sec of document.querySelectorAll("#cs-cast,#cs-u2cast"))csCastNow1(sec)}
function csCastNow1(sec){sec.querySelectorAll(".csnowt").forEach(e=>e.classList.remove("csnowt"));
  if(!CSCUR||!CSCUR.date||typeof todayISO!=="function"||CSCUR.date!==csShootDay())return;const tm=(CSCUR.c&&CSCUR.c.times)||{},w0=csHm(tm.wrap||"");
  /* the night after the shooting day: hours go on past 24:00 (a wrap after midnight, earlier than the crew call, too) */
  const night=CSCUR.date!==todayISO(),cc=csHm(tm.crewCall||""),n24=t=>t?String(24+ +t.slice(0,2))+t.slice(2):t,w=w0&&cc&&w0<cc?n24(w0):w0;
  const now=night?n24(csHM()):csHM();if(w&&now>w)return;   /* a wrap after midnight (earlier than the crew call) is tomorrow */if(typeof scState==="function"&&scState(CSCUR.date,"wrap")===2)return;   /* after the wrap: no frame */
  const span=el=>{const t=String(el.textContent||"").replace(/(\d{1,2})[.:](\d{2})/g,"$1:$2"),ms=(t.match(/(?:^|\D)\d{1,2}:\d{2}(?!\d)/g)||[]).map(x=>x.replace(/^\D/,""));if(!ms.length)return null;   /* no look-behind: older iPhones (iOS < 16.4) can not read it – the whole app would not start */const A=x=>night&&x&&cc&&x<cc?n24(x):x,a=A(csHm(ms[0])),b=/[-–]/.test(t)&&ms.length>1?A(csHm(ms[ms.length-1])):"";return {a,b}};
  const mark=cells=>{let best=null;for(const el of cells){const s=span(el);if(!s||!s.a||s.a>now)continue;if(s.b&&s.a<=now&&now<s.b){best=el;break}if(!best||s.a>=span(best).a)best=el}if(best)best.classList.add("csnowt")};
  sec.querySelectorAll(".cs-tbl tbody tr").forEach(tr=>mark([...tr.children].slice(3)));
  sec.querySelectorAll(".cs-card").forEach(cd=>mark([...cd.querySelectorAll(".cs-kv")]))}
csAfter(csCastNow);
setInterval(()=>{if(typeof S!=="undefined"&&S.tab==="dispo")csCastNow()},60e3);

/* «Alle Fahrten als erledigt»: every ride with driver of that day gets the tick (one batch) */
csOn("click",async e=>{const b=e.target.closest("[data-rideall]");if(!b||typeof canPerm!=="function"||!canPerm("rides.alldone"))return;e.preventDefault();const date=b.dataset.rideall;
  const x=(S.dispos||[]).find(y=>y&&y.date===date),u=b.dataset.rideu||"";let rs=csA(x&&x.cs&&x.cs.transport);
  if(u&&x&&x.cs&&typeof window.csRidesFor==="function")rs=window.csRidesFor(x.cs,u).transport;   /* the callsheet of one unit: only its rides (and those of both) */if(!rs.length)return;
  if(!confirmSafe(L("Alle {n} Fahrten vom {d} als erledigt markieren?").replace("{n}",rs.length).replace("{d}",date.split("-").reverse().join("."))))return;
  b.disabled=true;try{const {F,db}=await fb();const bt=F.writeBatch(db);const now=Date.now();const ids=[...new Set(rs.map(r=>rideId(date,r)).filter(Boolean))];
    for(const id of ids){bt.set(F.doc(db,"rideack",id),{d:date,at:now,s:2});bt.delete(F.doc(db,"rideack","v"+id))}   /* «on the way» ends too */
    await bt.commit();window.RIDEACK=window.RIDEACK||{};for(const id of ids){window.RIDEACK[id]={d:date,at:now,s:2};delete window.RIDEACK["v"+id]}
    if(typeof savedPop==="function")savedPop(true);(typeof scRender==="function"?scRender:render)()}   /* only the rows: the open parts stay open */
  catch(err){b.disabled=false;showMsg(saveErr(err),5000)}});

/* Drehfolge im Callsheet: a tap on a scene opens it in three steps (closed → open → with all details → closed) */
document.addEventListener("click",e=>{const sm=e.target.closest&&e.target.closest("details.csscd>summary");if(!sm||e.target.closest("a,button,input,[data-scack]"))return;
  const d=sm.parentNode,x=d.querySelector(":scope>details.cs3");if(!d.open||!x)return;e.preventDefault();if(!x.open)x.open=true;else{x.open=false;d.open=false}},true);

/* callsheet jump bar: its background follows the page background behind it (position on the screen → --cjx/--cjy, on the page → --cjp) */
(()=>{let q=0;const fit=()=>{q=0;for(const el of document.querySelectorAll("#view .csjump,#view .stripwrap,#view .stripwrap .strip")){const r=el.getBoundingClientRect(),b=document.body.getBoundingClientRect();
    el.style.setProperty("--cjx",(-r.left)+"px");el.style.setProperty("--cjy",(-r.top)+"px");el.style.setProperty("--cjp",(b.top-r.top)+"px")}};
  const soon=()=>{if(!q)q=requestAnimationFrame(fit)};addEventListener("scroll",soon,{passive:true});addEventListener("resize",soon);
  new MutationObserver(soon).observe(document.getElementById("view")||document.body,{childList:true})})();   /* the page itself, not every change in the document (each forced a layout) */
