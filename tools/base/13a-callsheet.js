import {esc,hmAny,L,LANG,mapUrl,S,safeUrl} from "./10-core.js";
import {nameHit} from "./11-schedule-prep.js";
import {myIdentity,rideId,rideMap} from "./12-mycal.js";
import {CSCUR,csSceneLoc} from "./13b-cs-now.js";
import {csDWords} from "./13d-cs-mine.js";
import {vok} from "./14-render.js";
import {fold} from "./15-script-tab.js";
import {arr} from "./20-data-start.js";
/* ---------- Callsheet (1/6): basics – event helpers, icons, text with phone/links, tables, rides cell, «me» on the callsheet ---------- */
/* ---------- Callsheet as the production writes it (TBO_Dispo_…pdf): same order as the document ----------
   x.cs = the whole callsheet read in structure by tools/update_from_dropbox.py (CS_SCHEMA). At the top «Mein Tag»:
   my call, my rides and the information of my department. Phone numbers only with the right «Telefon sehen». */
/* one listener per event type for the whole callsheet (instead of one per button); every handler checks its own target, errors stay in their handler */
const CSON={};export function csOn(t,fn,cap){const k=t+(cap?"!":"");if(!CSON[k]){CSON[k]=[];document.addEventListener(t,e=>{for(const f of CSON[k])try{f(e)}catch(err){console.error(err)}},!!cap)}CSON[k].push(fn)}
/* after each drawing of the page: the steps that work on the drawn callsheet («Nur meins», cast time, done rides, back to an edited ride …) in one place */
const CSAFTER=[];export function csAfter(fn){CSAFTER.push(fn)}
{const v=document.getElementById("view");if(v)new MutationObserver(()=>requestAnimationFrame(()=>{for(const f of CSAFTER)try{f()}catch(err){console.error(err)}})).observe(v,{childList:true})}
window.csAfter=csAfter;
/* outline icons in the style of the app (no emoji) */
const csI=d=>'<svg class="csi" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
export const CSI={phone:csI('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  radio:csI('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8l8-4"/><circle cx="9" cy="14" r="2"/><path d="M14 13h3M14 16h3"/>'),
  warn:csI('<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'),
  doc:csI('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6"/>'),
  lock:csI('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  pin:csI('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'),
  film:csI('<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9h17M8 5l-2 4M13 5l-2 4M18 5l-2 4"/>'),
  cast:csI('<path d="M12 3.5l2.5 5.2 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z"/>'),
  car:csI('<path d="M5 16V12l2-5h10l2 5v4"/><path d="M4 16h16v2H4z"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/><path d="M5 12h14"/>'),
  calls:csI('<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 7a7 7 0 0 1 0 10"/>'),
  dept:csI('<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>'),
  search:csI('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
  table:csI('<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 10h17M3.5 14.5h17M9.5 5v14"/>'),
  walk:csI('<circle cx="13" cy="4.5" r="1.6"/><path d="M10 21l2.5-6.5L15 17v4M12.5 14.5l-1-5 3.5 1.5 2.5 2.5M11.5 9.5L8 11l-1 3"/>'),
  me:csI('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>'),
  set:csI('<path d="M4 10h16v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 10l-.4-2.3a1.5 1.5 0 0 1 1.2-1.7l12.8-2.3a1.5 1.5 0 0 1 1.7 1.2L19.6 7"/><path d="M8.5 5.3l2.2 3.4M13.5 4.4l2.2 3.4"/>'),
  base:csI('<path d="M3.5 11.5L12 4.5l8.5 7"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5V14h4v5.5"/>'),
  whm:csI('<path d="M10 6.5a2 2 0 1 1 2 2v1.6"/><path d="M12 10.1l-8 5.6a1 1 0 0 0 .6 1.8h14.8a1 1 0 0 0 .6-1.8z"/>'),
  lunch:csI('<path d="M7 3.5v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-6M9 3.5v17"/><path d="M17 20.5v-17c-2 1.2-3 3.6-3 7v2h3"/>'),
  dinner:csI('<path d="M3.5 13h17a8.5 8.5 0 0 1-17 0z"/><path d="M14.5 3.5a3.2 3.2 0 1 0 4 4 2.6 2.6 0 0 1-4-4z"/>'),
  prod:csI('<rect x="5" y="3.5" width="14" height="17" rx="1.2"/><path d="M8.5 7.5h2M13.5 7.5h2M8.5 11h2M13.5 11h2M10.5 20.5v-4.5h3v4.5"/>'),
  dit:csI('<rect x="3.5" y="4.5" width="17" height="11.5" rx="1.5"/><path d="M8.5 20h7M12 16v4M7 12.5l2.5-3 2 2 2.5-3.5 3 4.5"/>'),
  whmc:csI('<path d="M7 5.5a1.6 1.6 0 1 1 1.6 1.6v1.3"/><path d="M8.6 8.4L2.5 12.8a.8.8 0 0 0 .5 1.4h11.2a.8.8 0 0 0 .5-1.4z"/><path d="M18.2 13.5l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z"/>'),
  whme:csI('<path d="M7 5.5a1.6 1.6 0 1 1 1.6 1.6v1.3"/><path d="M8.6 8.4L2.5 12.8a.8.8 0 0 0 .5 1.4h11.2a.8.8 0 0 0 .5-1.4z"/><circle cx="16.5" cy="15" r="1.6"/><circle cx="20.5" cy="15.6" r="1.3"/><path d="M13.8 21c.3-2 1.4-3.1 2.7-3.1s2.4 1.1 2.7 3.1M19.3 18.4c.9-.3 2.1.1 2.6 2.4"/>'),
  fp:csI('<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M3.5 11h7M14 3.5v5h6.5M10.5 11v4M10.5 18.5v2M14 13v7.5"/>'),
  park:csI('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 16.5v-9h3a2.6 2.6 0 0 1 0 5.2h-3"/>'),
  cards:csI('<rect x="4" y="4.5" width="16" height="6" rx="1.5"/><rect x="4" y="13.5" width="16" height="6" rx="1.5"/>')};
window.CSI=CSI;
/* open/close symbol of the app (two chevrons in a round frame, as in Log/Tests) */
export const CSEXP='<span class="csexp" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg></span>';
export const CSEXPSM=CSEXP.replace('class="csexp"','class="csexp sm"');   /* the small one (scenes, locations) */
export const CSPH=/(\+?\d[\d ()\/.-]{7,}\d)/g;
const csIsTel=x=>/^(\+|0)/.test(x)&&x.replace(/\D/g,"").length>=9&&!/\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/.test(x)   /* not a date («03.11.2026 - 05.11.2026») */
  &&!/^\d{1,2}[.:]\d{2}(\s*[-–\/]\s*\d{1,2}[.:]\d{2})+$/.test(x.trim());   /* nor times («06.30 - 07.15 / 07.45» was hidden behind a lock as a phone number) */
/* text with phone numbers: callable with the right, else left out */
export function csTx(s){s=String(s==null?"":s);if(!s)return"";const ok=vok("phone");let out="",p=0;
  for(const m of s.matchAll(CSPH)){if(!csIsTel(m[1]))continue;out+=esc(s.slice(p,m.index));out+=ok?'<a href="tel:'+esc(m[1].replace(/[^\d+]/g,""))+'">'+esc(m[1])+'</a>':'<span class="cshid" title="'+esc(L("Nur mit dem Recht «Telefon sehen»"))+'">'+CSI.lock+'</span>';p=m.index+m[0].length}
  /* a link ends before a closing bracket, a full stop or comma at its end and before an escaped quote */
  return (out+esc(s.slice(p))).replace(/https?:\/\/[^\s<]+/g,m=>{const t=m.match(/(?:&quot;|&#39;|[).,;:!?'"])+$/),u=t?m.slice(0,-t[0].length):m;return '<a href="'+esc(safeUrl(u.replace(/&amp;/g,"&")))+'" target="_blank" rel="noopener noreferrer">'+u+'</a>'+(t?t[0]:"")}).replace(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">(https?:\/\/(?:maps\.app\.goo\.gl|[^"<]*google\.[a-z.]+\/maps)[^<]*)<\/a>/g,(m0,h)=>csMap(h.replace(/&amp;/g,"&")))}
/* an address or place with a map link: the text itself is the link (instead of the round map button) */
export function csAdr(txt,map,fallback){const U=/(https?:\/\/[^\s<]+)/g;const s0=String(txt||"");const urls=s0.match(U)||[];const isMap=u=>/maps\.app\.goo\.gl|google\.[a-z.]+\/maps|goo\.gl\/maps/.test(u);
  const u=map||urls.find(isMap)||"";const t=s0.replace(U,m=>isMap(m)?"":m).replace(/\s{2,}/g," ").replace(/[\s,:;–-]+$/,"").trim();if(!u)return csTx(s0);
  return '<a class="csadl" href="'+esc(mapUrl(u))+'" target="_blank" rel="noopener noreferrer"><span>'+csNoA(csTx(t||fallback||L("Karte")))+'</span></a>'}
/* text inside a link: its own links removed (a link in a link breaks the page), the hidden phone numbers stay hidden */
const csNoA=h=>String(h).replace(/<a\b[^>]*>/g,"").replace(/<\/a>/g,"");
/* map: a round button with a pin (like the other round buttons of the app) */
export const csMap=u=>u?'<a class="csmap" href="'+esc(mapUrl(u))+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(L("Karte"))+'" title="'+esc(L("Karte"))+'">'+CSI.pin+'</a>':'';
/* translated text (locations, production information) in the language of the app; the original when none */
let CSTR=null;export const csL=t=>{const s2=String(t==null?"":t);return (CSTR&&CSTR[LANG]&&CSTR[LANG][s2])||s2};
/* a small tile (key and value) of the callsheet head */
export const csTile=(k,v,big)=>v?'<div class="dt'+(big?' big':'')+'"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>':'';
export const csA=v=>Array.isArray(v)?(v.some(x=>x==null)?v.filter(x=>x!=null):v):(v==null||v===""?[]:[v]);   /* a «null» in a list of the callsheet no longer breaks the view */
/* a time of the callsheet: «07:50» or «07.50» (some callsheets write dots – hm() alone read only colons, so «Jetzt», the short line and pickups missed them) */
export const csHm=t=>hmAny(t);   /* «19.30» as «19:30» (one helper for the whole app: 10-core hmAny) */
export const csRoute=(f,t1,to,t2)=>[[t1,f].filter(Boolean).join(" "),[t2,to].filter(Boolean).join(" ")].filter(Boolean).join(" → ");
export const csS=v=>Array.isArray(v)?v.join(", "):String(v==null?"":v);
/* a part of the callsheet: open or folded */
/* rides on the desktop: as a table (default) or as tiles, remembered on this device per part */
function csTv(){try{return JSON.parse(localStorage.getItem("cstv:v1")||"{}")||{}}catch(_){return {}}}
export const csTvCls=k=>csTv()[k]==="cards"?"":"cs-tblmode";
export const csTvBtn=k=>{const tbl=csTv()[k]!=="cards";return '<button type="button" class="lnk cstview cstv" data-cstv="'+k+'" title="'+esc(L(tbl?"Als Kacheln":"Als Tabelle"))+'">'+(tbl?CSI.cards:CSI.table)+'<span>'+esc(L(tbl?"Als Kacheln":"Als Tabelle"))+'</span></button>'};
csOn("click",e=>{const b=e.target.closest("[data-cstv]");if(!b)return;e.preventDefault();const k=b.dataset.cstv,m=csTv();m[k]=m[k]==="cards"?"table":"cards";try{localStorage.setItem("cstv:v1",JSON.stringify(m))}catch(_){}
  /* the same kind of list in both units (cs-trans, cs-transu2 …): all of them switch, each with its own button */
  for(const d of document.querySelectorAll('[id="cs-'+k+'"],[id="cs-'+k+'u2"]')){d.classList.toggle("cs-tblmode",m[k]!=="cards");const bb=d.querySelector('[data-cstv="'+k+'"]');if(bb)bb.outerHTML=csTvBtn(k)}});
export function csSec(title,body,open,cls,id,sumx){if(!body)return"";return '<details class="dsec cssec'+(cls?" "+cls:"")+'"'+(id?' id="cs-'+id+'"':'')+(open?' open':'')+'><summary><h3 class="dh">'+(Array.isArray(title)?'<span class="lg">'+esc(title[0])+'</span><span class="sh">'+esc(title[1])+'</span>':esc(title))+'</h3>'+(sumx||'')+CSEXP+'</summary>'+body+'</details>'}
/* a table of the callsheet: on the computer a table, on the phone one card per row (title = first columns, the rest as «label value») */
/* «07:40 - 07:55 15'» → «07:40 · 15′» (start and duration, no end time) */
/* the minutes behind: with ' / ’ / ′, or a short number not followed by a word («07:30 - 08:00 3 Busse» is no duration) */
export function csDurT(v){return String(v==null?"":v).replace(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})(?:\s*(\d{1,3})\s*['’′]|\s+(\d{1,3})(?![\d:.]|\s*\p{L}))?/gu,(m0,a,h2,m2,d1,d2)=>{let mn=d1||d2;if(!mn){const p=a.split(/[:.]/);let x=(+h2*60+ +m2)-(+p[0]*60+ +p[1]);if(x<0)x+=1440;mn=String(x)}return a+" · "+mn+"′"})}
/* wardrobe / make-up: only start time and duration, behind it the initials of who does it («Marina 07:55 - 08:10 15’» → «07:55 · 15′ MA»), no comments */
export function csMk(v,c,kind,row){const out=[];for(const seg of String(v==null?"":v).split(/\s*;\s*/)){
    const m=seg.match(/^\s*(?:(\p{L}[\p{L}.'’ -]*?)\s+)?(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})(?:\s*(\d+)\s*['’′]?)?/u);if(!m)continue;   /* names with any letters («Łucja», «D’Amico») */
    let ini="";if(m[1]){const fn=fold(m[1].trim().split(/\s+/)[0]);const full=csA(c&&c.calls).map(r=>String(r.name||"")).find(n=>fold(n).split(/\s+/)[0]===fn)||m[1];
      const w=String(full).trim().split(/\s+/).filter(x=>/^\p{L}/u.test(x));ini=w.length?(w.length>1?w[0][0]+w[w.length-1][0]:w[0].slice(0,2)).toUpperCase():""}
    const tx=csDurT(m[2]+" - "+m[3]+":"+m[4]+(m[5]?" "+m[5]+"’":"")),pr=tx.split(" · ");
    /* the same time twice (two make-up artists at once): once, with both initials */
    const o=out.find(x=>x.t===pr[0]&&x.d===(pr[1]||""));if(o){if(ini&&!o.i.includes(ini))o.i.push(ini)}else out.push({t:pr[0],d:pr[1]||"",i:ini?[ini]:[]})}
  if(!out.length)return"";
  /* time, duration and initials (duration and initials in pink) */
  /* Kostüm / Maske ticked off: green, with the tick button (right «Kostüm/Maske quittieren») */
  const dt=c&&c._date,ck=x=>kind&&dt&&window.cmId?window.cmId(dt,kind,row,x.t):"";
  const rowDone=kind&&dt&&window.cqRowDone&&window.cqRowDone(c,row);   /* On set done: Kostüm and Maske done too */
  return {h:out.map(x=>{const id=ck(x);return '<span class="mkw">'+(rowDone?'<span class="cql cq2 cqro">'+esc(x.t)+'</span>':id&&window.cqLink?window.cqLink(kind,id,dt,x.t):'<span class="mkt">'+esc(x.t)+'</span>')+(x.d?(()=>{const run=!rowDone&&id&&window.cmSt&&window.cmSt(id)===1&&window.cqCd?window.cqCd(id,x.d):"";return run||' <span class="mkd">'+esc(x.d)+'</span>'})():'')+(x.i.length?' <span class="mki">'+esc(x.i.join("+"))+'</span>':'')+'</span>'}).join(" / ")}}
/* a cell: text (phone numbers, links) or ready HTML {h} */
const csCell=c=>c&&typeof c==="object"&&"h" in c?c.h:csTx(c);
const csCellTx=c=>c&&typeof c==="object"&&"h" in c?c.h.replace(/<[^>]+>/g,""):String(c||"");
/* a ride with its state (quittiert): driving car = running, two checks = done */
/* name to a driver's phone number: other callsheets' driver lines, else the crew list */
export function csDriverByPhone(ph){const k=String(ph||"").replace(/\D/g,"").slice(-9);if(k.length<9)return"";
  for(const d of arr(S.dispos)){const t=String(d&&d.cs&&d.cs.drivers||"");for(const x of t.split(/\s*[|\n;]\s*/)){const m=x.match(CSPH);if(m&&m[0].replace(/\D/g,"").slice(-9)===k){const n=x.replace(m[0],"").replace(/o\.\s*p\.\s*D.*$/i,"").trim();if(n)return n}}}
  for(const g of arr(S.crew))for(const p of arr(g.people))if(String(p.phone||"").replace(/\D/g,"").slice(-9)===k)return p.name||"";return ""}
/* a ride «07:40 Hotel → 07:55 Base»: the destination opens in Google Maps (its own map link from the callsheet, else its address / name) */
export function csRouteH(date,r){const t=csRoute(r.from,r.t1,r.to,r.t2);let rt=esc(t);try{const to=String(r.to||"").replace(/https?:\/\/\S+/g,"").trim(),dp=arr(S.dispos).find(x=>x&&x.date===date),u=to&&typeof rideMap==="function"?rideMap(r.to,dp,true):"",su=u?safeUrl(u):"";
    if(su&&su!=="#"){const a=[r.t1,String(r.from||"").replace(/https?:\/\/\S+/g,"").trim()].filter(Boolean).join(" "),b=[r.t2,to].filter(Boolean).join(" ");
      rt=(a?esc(a)+" → ":"")+'<a class="rideto" href="'+esc(su)+'" target="_blank" rel="noopener" data-nobub title="'+esc(L("Route in Google Maps"))+'">'+esc(b)+'</a>'}}catch(_){}
  return rt}
export function csRideCell(date,r){let st=0,id="";try{id=typeof rideId==="function"?rideId(date,r):"";st=id&&window.rideState?rideState(id):0}catch(_){}
  const I=window.RIDE_ICO||{},mgr0=typeof canPerm==="function"&&canPerm("rides.manage");
  /* clickable only for the Fahrten Manager (popup) and for the driver of this ride (accept / done) */
  let drv=false;try{const me=CSCUR.me!==undefined?CSCUR.me:(typeof csMe==="function"?csMe():null);drv=!!(me&&r.driver&&me.hit(r.driver))}catch(_){}
  const can=id&&(mgr0||drv);
  const n=window.rideStep&&id?rideStep(id):st===2?3:st;   /* three steps: driver on site, on the way, done */
  const cls='ridest '+(window.rideStepCls?rideStepCls(n):'rs'+st)+(st===2&&window.rideAt&&Date.now()-rideAt(id)>20*60e3?' rsold':'');
  const tip=n===0?L("Fahrt noch nicht angenommen"):window.rideStepTip?rideStepTip(n):st===1?L("Fahrt läuft"):L("Fahrt ausgeführt");
  const ico=window.rideStepIco?rideStepIco(n):st===1?I.car||"":st===2?I[1]||"":"";
  /* AL, AD and production change the state right here: open → running → done → open */
  const mgr=mgr0;
  const el=can?'<button type="button" class="'+cls+' rideack-cs'+(mgr?' rmgr':'')+'" data-rideack="'+esc(id)+'" data-rided="'+esc(date)+'"'+(drv?' data-rdrv="1"':'')+' title="'+esc(tip+" – "+L(mgr?"Fahrt ändern":"antippen zum Ändern"))+'" aria-label="'+esc(tip+" – "+L(mgr?"Fahrt ändern":"antippen zum Ändern"))+'">'+ico+(mgr?'<span class="rmgri" aria-hidden="true"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1L19 8l-3-3L5 16z"/></svg></span>':'')+'</button>'
    :'<span class="'+cls+'" title="'+esc(tip)+'">'+ico+'</span>';
  /* changed in the app (Fahrten Manager): marked, the original as tooltip */
  const o=r._orig,chg=o?' <span class="rchg" title="'+esc(L("Original")+": "+[csRoute(o.from,o.t1,o.to,o.t2),o.vehicle,o.driver,o.passengers||o.people].filter(Boolean).join(" · "))+'">'+esc(L("geändert"))+'</span>':'';
  const rt=csRouteH(date,r);
  return {h:el+' '+rt+chg}}
export function csTable(head,rows,tc,keep){rows=rows.map(r=>r.map(c=>c&&typeof c==="object"?c:csDurT(c)));rows=rows.filter(r=>r.some(c=>csCellTx(c).trim()));if(!rows.length)return"";tc=tc||2;
  const tbl='<div class="tblw cs-tbl"><table class="dtbl"><thead><tr>'+head.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+csCell(c)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
  const cards='<div class="cs-cards">'+rows.map(r=>{const tt=r.slice(0,tc).map(c=>c&&typeof c==="object"&&c.h?c:csCellTx(c).trim());
    const kv=r.slice(tc).map((c,i)=>[head[i+tc]||"",c]).filter(([,v])=>keep||csCellTx(v).trim());   /* keep: every field in its place (cast cards: two per line) */
    /* from → to pairs read as one line */
    return '<div class="cs-card"><div class="cs-ct">'+tt.map((x,i)=>{const v=x&&typeof x==="object"?x.h:csTx(x);return !x?'':i?'<span class="c'+i+'">'+v+'</span>':'<b>'+v+'</b>'}).join(" ")+'</div>'+kv.map(([k,v])=>'<div class="cs-kv">'+(k?'<span class="k">'+esc(k)+'</span>':'')+'<span class="v">'+csCell(v)+'</span></div>').join("")+'</div>'}).join("")+'</div>';
  return tbl+cards}
/* who am I on this callsheet: name and department (crew list / app profile) */
export function csMe(){let me=null;try{me=myIdentity()}catch(_){}if(!me||!me.name)return null;
  const dep=fold(me.src||"").split(/[\s/]/)[0];
  return {name:me.name,dep,hit:nameHit(me.name)}}
/* «jetzt» on the shooting day, in one place: the rows of the shooting order, their quittance keys (setup, lunch, wrap …), the wrap row */
/* me on this callsheet: my call, my rides (passenger or driver, crew transport), do I drive, the words of my department */
export const csMyCall=(c,me)=>me?csA(c.calls).find(r=>me.hit(r.name)):undefined;
/* my rides: always all of the day – with two units the lists of the callsheet are split (c._rides keeps all of them) */
/* a real ride: from or to a place – not the vehicle lines «Moxy, s. transport list» of the crew transport */
export const csRideReal=r=>!!r&&!!String(r.from||r.to||"").trim()&&!/\b(s\.|see|siehe)\s*transport\s*list/i.test([r.from,r.to].join(" "));
export const csMyRides=(c,me)=>{const a=c._rides||c;return csA(a.transport).filter(r=>csRideReal(r)&&(me.hit(r.passengers)||me.hit(r.driver))).concat(csA(a.crewTransport).filter(r=>csRideReal(r)&&me.hit(r.people)))};
export const csIDrive=(c,me)=>!!me&&csA(c.transport).some(r=>me.hit(r.driver));
export const csMyWords=(c,me,withRole)=>{const call=csMyCall(c,me);return new Set([...csDWords(call&&call.dept),...(withRole?csDWords(call&&call.role):[]),...csDWords(me&&me.dep)])};
export const csRows=c=>csA(((c||{}).order||{}).rows);
export const csKeys=rows=>typeof scRowKeys==="function"?scRowKeys(csA(rows),r=>r.text||r.syn):[];
export const csAck=(date,u)=>typeof scHas==="function"&&scHas(date,u);
/* the scenes of the shooting order shot at one location */
export const csLocRows=(c,l)=>csRows(c).filter(r=>r.sc&&csSceneLoc([l],r)===l);
export function setCSTR(v){return CSTR=v}   /* other parts change CSTR only through this */
