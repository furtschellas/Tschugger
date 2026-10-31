import {clockHM,esc,isoAdd,L,localISO,mapUrl,prodTZ,S,safeUrl,todayISO,unitKey} from "./10-core.js";
import {CSI,csA,csAck,csHm,csKeys,csL,csRows,csS} from "./13a-callsheet.js";
import {csBadgeIn,csKindCode,csLocHref,csLocs,csPlaceA,csSetGeo} from "./13c-cs-places.js";
import {fold} from "./15-script-tab.js";
/* ---------- Callsheet (2/6): «now» – the running row and scene, the place now, nearby places (Zurich time) ---------- */
const csIsWrap=r=>!!r&&!r.sc&&/\b(wrap|drehschluss)\b/i.test(String(r.text||r.syn||""));
/* «now» as hh:mm in Zurich (the shooting time – also on a phone set to another time zone) */
const CSZHMS={};   /* the clock of the shoot: in the time zone of the running block (Swiss time without blocks) */
function cszhm(tz){if(!(tz in CSZHMS)){try{CSZHMS[tz]=new Intl.DateTimeFormat("de-CH",{timeZone:tz,hour:"2-digit",minute:"2-digit",hourCycle:"h23"})}catch(_){CSZHMS[tz]=null}}return CSZHMS[tz]}
export function csHM(d){d=d||new Date();const f=cszhm(prodTZ());if(f)try{const x=f.format(d);if(/^\d\d:\d\d$/.test(x))return x}catch(_){}return clockHM(d)}
/* ---------- times of a shooting day: one routine for the night after midnight ----------
   minutes of each row since 00:00 of the shooting day; after a jump back past midnight (23:30 → 00:15) the rows count on (24:15 = 1455).
   null: a row without a time */
export const csMin=t=>{const h=csHm(t);return h?+h.slice(0,2)*60+ +h.slice(3):null};
export function csRowMins(rows){let prev=null,late=false;return csA(rows).map(r=>{const m=csMin(r&&r.t);if(m==null)return null;if(prev!=null&&m<prev&&prev>=720)late=true;prev=m;return late?m+1440:m})}
/* the shooting day running now: after midnight a night shoot of yesterday stays «today» until its wrap (at the latest 06:00) –
   before, everything about «now» (running row, place, cast frame) disappeared at midnight */
export function csShootDay(){const t=todayISO();if(csHM()>="06:00"||typeof isoAdd!=="function")return t;const y=isoAdd(t,-1),dp=(S.dispos||[]).find(z=>z&&z.date===y);if(!dp||!dp.cs)return t;
  /* a night of the 1st or the 2nd Unit (rows past midnight or a wrap earlier than the crew call): yesterday until its wrap –
     the wrap quittiert ends it, an open wrap (shooting longer than planned) keeps it, else the planned wrap time */
  const night=c=>{if(!c)return null;const late=csRowMins(csRows(c)).some(m=>m!=null&&m>=1440),tm=c.times||{},w=csHm(tm.wrap||""),cc=csHm(tm.crewCall||"");return late||(w&&cc&&w<cc)?{w:w&&cc&&w<cc?w:""}:null};
  let c2=null;try{c2=dp.cs.u2&&typeof window.cqU2==="function"?window.cqU2(Object.assign({},dp.cs,{_date:y})):null}catch(_){}
  for(const [u,c] of [["1",dp.cs],["2",c2]]){const n=night(c);if(!n)continue;
    const st=typeof scState==="function"&&csAck(y,u)?scState(y,unitKey("wrap",u)):-1;
    if(st===2)continue;if(st>=0)return y;if(!n.w||csHM()<n.w)return y}
  return t}
window.csShootDay=csShootDay;
/* «now» for a day: on the night after a shooting day the hours go on (00:30 → 24:30), so they compare with the rows after midnight */
const csNowMin=date=>{const m=csMin(csHM());return date!==todayISO()&&m<720?m+1440:m};   /* minutes, 00:30 of the next day = 1470 */
/* the scene being shot now (callsheet of today, after the start of its row, before the wrap): its row, or null; lunch or a setup running: that row with ev = its key */
export function csNowScene(x){const sd=csShootDay();x=x||(S.dispos||[]).find(y=>y&&y.date===sd);const c=x&&x.cs;if(!c||x.date!==sd)return null;const rows=csRows(c),un=String(c._u||"1");let i=csNowIdx(rows,x.date,un);   /* the 2nd Unit alone (csU2Dispo): its own entries */
  if(i>=0&&!rows[i].sc){const k=csKeys(rows)[i];   /* setup, lunch or wrap is the step now (running or next) – a setup also by the clock (building up before the first scene) */
    const ek=k?unitKey(k,un):k;if(k&&(csAck(x.date,un)||/^setup\d*$/.test(k)))return Object.assign({},rows[i],{ev:ek,lunch:k==="lunch"&&scState(x.date,ek)===1})}
  for(;i>=0;i--){const r=rows[i];if(r.sc)return r;if(csIsWrap(r))return null}return null}
/* the row running now: with quittances the running one, else the next open step (scene, setup, lunch, wrap) after the last done one (wrap quittiert: none);
   without quittances by the clock: the last row that has started (after the wrap: none) */
export function csNowIdx(rows,date,u){if(date!==csShootDay())return -1;rows=csA(rows);u=String(u||"1");
  /* the 2nd Unit: its own lunch, wrap and setups («lunch_u2») */
  if(csAck(date,u)){const RK=csKeys(rows),key=(r,i)=>r.sc?unitKey(r.sc,u):(RK[i]?unitKey(RK[i],u):"");
    const st=rows.map((r,i)=>key(r,i)?scState(date,key(r,i)):-1);if(st.some((v,i)=>v===2&&key(rows[i],i)===(u!=="1"?"wrap_u"+u:"wrap")))return -1;
    const run=st.indexOf(1);if(run>=0)return run;
    /* nothing running: the next step only during the shooting day (from 1 h before its first row) – at night, before the start, nothing
       (a quittance made the evening before, e.g. a test, must not show a scene) */
    {const M=csRowMins(rows),i0=M.findIndex(v=>v!=null);if(i0<0)return -1;
     if(csNowMin(date)<M[i0]-(RK[i0]&&/^setup/.test(RK[i0])?0:60))return -1}   /* the setup (crew call) is the start itself */
    for(let i=st.lastIndexOf(2)+1;i<st.length;i++)if(st[i]===0)return i;return -1}   /* the next step: a scene, setup, lunch or the wrap */
  /* quittieren switched on but nothing quittiert yet in this unit: not shooting yet – no «Jetzt» (before, the clock showed a scene before the start) */
  if(typeof window.scOnU==="function"&&window.scOnU(u))return -1;
  /* times after midnight (night shoot: 23:00 … 00:30) count as 24:00 … 24:30 – not «now» in the evening, but after midnight */
  const now=csNowMin(date);let k=-1;csRowMins(rows).forEach((m,i)=>{if(m!=null&&m<=now)k=i});
  return k>=0&&csIsWrap(rows[k])?-1:k}
/* the parts of «Jetzt» (callsheet «Mein Tag» and Today): lunch/setup with its name, else scene number, its place (L-code) and I/E · set */
export function csNowBits(ns,c,date){if(ns.ev)return {ev:(ns.lunch?CSI.lunch+' ':'')+'<b>'+esc(scLabel(ns.ev))+'</b>'};let lo=null;try{lo=csSceneLoc(csLocs(c),ns)}catch(_){}
  return {sc:esc(String(ns.sc)),place:lo?' '+csPlaceA('L'+String(lo.no).trim(),csLocHref(lo,c,date),lo.name||""):'',set:esc([ns.ie,ns.set].filter(Boolean).join(" · "))}}
window.csNowBits=csNowBits;
/* which set a scene is shot on: by the scenes listed at the location, else by the set name */
export function csSceneLoc(locs,r){const n=x=>fold(String(x||"")).replace(/[^a-z0-9]/g,"");const sc=n(r.sc);const ls=csA(locs).filter(l=>!l.kinds&&l.no);
  /* «186 PT1B/C/PT2» → 186pt1b, 186pt1c, 186pt2 */
  const list=l=>{const out=[];for(const part of csS(l.scenes).split(/[,;+&]/).map(p=>fold(String(p).replace(/^\s*(seq|sc|szene|scene|sz)\.?\s*/i,"")).replace(/[^a-z0-9\/]/g,""))){let prev="";for(const t of part.split("/")){if(!t)continue;let v=t;
      if(prev&&/^[a-z]$/.test(t))v=prev.slice(0,-1)+t;else if(prev&&/^(pt|sl)\d/.test(t))v=(prev.match(/^\d+/)||[""])[0]+t;else if(prev&&/^\d+[a-z]?$/.test(t)&&/pt\d/.test(prev)&&t.length<=2)v=prev.replace(/\d+[a-z]?$/,"")+t;
      out.push(v);prev=v}}return out};
  /* else by the set name: the whole name in either direction, else its first word (at least 4 letters) */
  const st=n(r.set),w=s=>(fold(String(s||"")).match(/[a-z0-9]{4,}/)||[""])[0];
  const names=l=>(l._m||[l]).map(m=>m.name).filter(Boolean);
  return (sc&&ls.find(l=>list(l).includes(sc)))||(st&&ls.find(l=>names(l).some(nm=>st.includes(n(nm))||n(nm).includes(st))))||(st&&ls.find(l=>names(l).some(nm=>w(nm)&&w(nm)===w(r.set))))||null}
/* address of a location: from the app's location list (by its scenes), else a note with a postcode («Föhrenweg 160, 3999 Testdorf») */
/* codes L1, L2, Base …: always a link to the place (its map link, else its address in Google Maps); c/date of the callsheet being drawn */
export let CSCUR={c:null,date:""};
/* hints of a place («To set …», «WC …»): lines in the open location */
export const CSHN_RE=/^(to set|zum set|nach set|wc\b)/i;
/* a text that looks like an address («3930 Visp», «Kantonsstrasse 12») */
export const csIsAdr=t=>/\d{4}\s+\p{L}/u.test(String(t||""))||/^\p{L}[\p{L}.\s-]*\s\d+[a-z]?(\s|$|-)/u.test(String(t||""));
/* the place where the shooting is now (callsheet of today, from the start of the first scene until wrap) */
export function csNowLoc(c,date,ls,now){if(!now&&csAck(date)){const r=csNowScene({date,cs:c});return r?csSceneLoc(ls,r):null}const live=!now;now=now||new Date();
  /* the night after the shooting day counts on (minutes past 24:00); rows after midnight too – before, a wrap at 00:30 ended the place at 23:45 */
  const night=live?date===csShootDay()&&date!==localISO(now):false;if(date!==localISO(now)&&!night)return null;
  const cur=csMin(csHM(now))+(night?1440:0),rows=csRows(c),M=csRowMins(rows);let hit=null,started=false;
  for(let i=0;i<rows.length;i++){const r=rows[i],t=M[i];if(t==null)continue;if(t>cur)break;if(r.sc){started=true;hit=csSceneLoc(ls,r)||hit}else if(csIsWrap(r))return null}
  return started?hit:null}
/* side places (Base, W/H/M, Lunch, Parking, DIT …) with the set they are nearest to and the distance (positions of the updater in c.geo) */
export function csNear(c,ls,date){const geo=c.geo||{},out=new Map(),sets=[];
  for(const l of ls)if(!l.kinds){const g=csSetGeo(c,l)[1];if(g)sets.push([l,g])}
  if(!sets.length)return out;const km=(a,b)=>{const R=6371,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,h=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
  const add=(code,name,u,g,H)=>{if(!Array.isArray(g))return;let best=null;for(const [l,sg] of sets){const d=km(sg,g);if(!best||d<best[1])best=[l,d]}
    if(!best||best[1]>15)return;if(!out.has(best[0]))out.set(best[0],[]);const L0=out.get(best[0]);if(!L0.some(x=>x.code===code&&x.u===u))L0.push({code,name,u,d:best[1],h:H})};
  for(const l of ls){if(l.kinds){const code=l.kinds.map(csKindCode).join("·");add(code,l.name||"",l.map||csLocHref(l,c,date),geo[l.map],csBadgeIn(l))}
    /* items of a set are already in its own part; those of a side place (e.g. its parking) count */
    if(l.kinds)for(const i of csA(l.items))if(i.map)add(String(i.label||"").trim()||"P",[i.label,i.text].filter(Boolean).join(" · "),i.map,geo[i.map])}
  for(const a of out.values())a.sort((x,y)=>x.d-y.d);return out}
const csDist=d=>d<0.05?L("vor Ort"):d<1?Math.round(d*1000/10)*10+" m":(Math.round(d*10)/10).toFixed(1).replace(/\.0$/,"")+" km";
export function csNearHTML(a){return a&&a.length?'<div class="csnear">'+a.map(p=>'<a class="csnearc" href="'+esc(mapUrl(p.u||""))+'" target="_blank" rel="noopener noreferrer" title="'+esc(csL(p.name))+'">'+(p.h?'<span class="csplace csbadge csbase">'+p.h+'</span>':'<span class="csplace">'+(/park/i.test(p.code)?CSI.park:'')+esc(csL(p.code))+'</span>')+'<small>'+esc(csDist(p.d))+'</small></a>').join("")+'</div>':''}
export function setCSCUR(v){return CSCUR=v}   /* other parts change CSCUR only through this */
