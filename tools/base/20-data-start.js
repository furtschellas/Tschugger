import {$,MEMO,S,applyStatic} from "./10-core.js";
import {render} from "./15-script-tab.js";
/* ---------- data ---------- */
export const arr=x=>Array.isArray(x)?x:[];
/* lists of objects only (a «null» from the language model made a whole page fail); the cast of a scene always a list («1, 4» → ["1","4"]) */
const objs=x=>arr(x).filter(o=>o&&typeof o==="object");
const castList=c=>Array.isArray(c)?c.map(String):c==null||c===""?[]:String(c).split(/[,;\s]+/).filter(Boolean);
const cleanItem=i=>i.cast===undefined||Array.isArray(i.cast)?i:Object.assign({},i,{cast:castList(i.cast)});
function cleanDay(d){
  const o=Object.assign({},d);o.items=objs(o.items).map(cleanItem);o.notes=arr(o.notes).filter(x=>typeof x==="string");for(const l of ["fr","en"])if(o["notes_"+l]!==undefined)o["notes_"+l]=arr(o["notes_"+l]).filter(x=>typeof x==="string");
  for(const k of ["unit2","unit3"]){if(o[k]&&typeof o[k]==="object")o[k]=Object.assign({},o[k],{items:objs(o[k].items).map(cleanItem),notes:arr(o[k].notes)});else delete o[k];}
  return o;
}
export const CLEAN={
  days:list=>list.filter(d=>d&&typeof d.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)).map(cleanDay).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0),
  crew:list=>objs(list).map(c=>Object.assign({},c,{people:arr(c.people).filter(p=>p&&typeof p==="object").map(p=>p.phone!=null&&typeof p.phone!=="string"?Object.assign({},p,{phone:String(p.phone)}):p)})),
  locs:list=>objs(list).map(l=>Object.assign({},l,{sets:objs(l.sets).map(x=>Object.assign({},x,{scenes:arr(x.scenes).map(String)}))})),
  places:list=>objs(list).map(c=>Object.assign({},c,{items:objs(c.items)})),
  /* callsheets come from a language model: lists always lists, phone numbers always text (else the whole view breaks) */
  dispos:list=>list.filter(x=>x&&typeof x.date==="string").map(x=>Object.assign({},x,{scenes:arr(x.scenes).filter(o=>o&&typeof o==="object").map(sc=>Object.assign({},sc,{cast:arr(sc.cast)})),
    locations:arr(x.locations).filter(o=>o&&typeof o==="object"),
    contacts:arr(x.contacts).filter(o=>o&&typeof o==="object").map(c=>Object.assign({},c,{phone:c.phone==null?"":String(c.phone)})),
    calls:arr(x.calls).filter(o=>o&&typeof o==="object"),meals:arr(x.meals).filter(o=>o&&typeof o==="object"),cast:arr(x.cast).filter(o=>o&&typeof o==="object").map(c=>Object.assign({},c,{phone:c.phone==null?"":String(c.phone)})),
    hospital:x.hospital&&typeof x.hospital==="object"?Object.assign({},x.hospital,{phone:x.hospital.phone==null?"":String(x.hospital.phone)}):x.hospital})),
  prepro:list=>list.filter(d=>d&&typeof d.date==="string").map(d=>Object.assign({},d,{items:objs(d.items),parallel:objs(d.parallel),notes:arr(d.notes).filter(x=>typeof x==="string"),
    transport:d.transport&&typeof d.transport==="object"?Object.assign({},d.transport,{rows:objs(d.transport.rows)}):d.transport})).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:String(a.t||"").localeCompare(String(b.t||""))),
};
/* last data kept in this browser so the app opens instantly; the live database replaces it a moment later */
export const CACHE_KEY="crewcache:v1";let cacheT=null,CACHEGEN=0;
/* sign-out (clearLocal): a save still waiting must never write the data back afterwards */
export function cancelCache(){clearTimeout(cacheT);cacheT=null;CACHEGEN++}
window.cancelCache=cancelCache;window.cacheGen=()=>CACHEGEN;
export function saveCache(){clearTimeout(cacheT);const g=CACHEGEN;cacheT=setTimeout(()=>{if(g!==CACHEGEN)return;try{localStorage.setItem(CACHE_KEY,JSON.stringify({meta:S.meta,days:S.days0||S.days,crew:S.crew,locs:S.locs,places:S.places,dispos:S.dispos0||S.dispos,prepro:S.prepro,gmap:S.gmap||null}));
    /* the stamp of the data only when the data itself was saved – else the next start would take old data for current */
    if(window.__DSTAMP)localStorage.setItem("dstamp:v1",window.__DSTAMP)}catch(_){try{localStorage.removeItem("dstamp:v1")}catch(_){}}},1500)}
export function loadCache(){try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");if(!c||!Array.isArray(c.days))return false;S.meta=c.meta||null;S.gmap=c.gmap||null;for(const k of ["days","crew","locs","places","dispos","prepro"])S[k]=(CLEAN[k]||(x=>x))(arr(c[k]));S.days0=S.days;S.dispos0=S.dispos;if(typeof window.cdApplyAll==="function")window.cdApplyAll();MEMO.clear();return true}catch(_){return false}}
/* several snapshots arrive together on start: draw once per frame */
let RQ=0;export function scheduleRender(){if(RQ)return;RQ=1;const go=()=>{if(!RQ)return;RQ=0;render()};requestAnimationFrame(go);setTimeout(go,120)}
let MSGT=null;export function showMsg(text,ms){const m=$("#refmsg");m.hidden=false;m.textContent=text;clearTimeout(MSGT);MSGT=ms?setTimeout(()=>{m.hidden=true},ms):null} /* a newer message is not hidden by the timer of an older one */

applyStatic();
loadCache();
render();
