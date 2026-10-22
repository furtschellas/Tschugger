/* ---------- data ---------- */
const arr=x=>Array.isArray(x)?x:[];
function cleanDay(d){
  const o=Object.assign({},d);o.items=arr(o.items).filter(x=>x&&typeof x==="object");o.notes=arr(o.notes).filter(x=>typeof x==="string");for(const l of ["fr","en"])if(o["notes_"+l]!==undefined)o["notes_"+l]=arr(o["notes_"+l]).filter(x=>typeof x==="string");
  for(const k of ["unit2","unit3"]){if(o[k]&&typeof o[k]==="object")o[k]=Object.assign({},o[k],{items:arr(o[k].items).filter(x=>x&&typeof x==="object"),notes:arr(o[k].notes)});else delete o[k];}
  return o;
}
const CLEAN={
  days:list=>list.filter(d=>d&&typeof d.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)).map(cleanDay).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0),
  crew:list=>list.map(c=>Object.assign({},c,{people:arr(c.people).filter(p=>p&&typeof p==="object").map(p=>p.phone!=null&&typeof p.phone!=="string"?Object.assign({},p,{phone:String(p.phone)}):p)})),
  locs:list=>list.map(l=>Object.assign({},l,{sets:arr(l.sets).map(x=>Object.assign({},x,{scenes:arr(x.scenes).map(String)}))})),
  places:list=>list.map(c=>Object.assign({},c,{items:arr(c.items)})),
  /* callsheets come from a language model: lists always lists, phone numbers always text (else the whole view breaks) */
  dispos:list=>list.filter(x=>x&&typeof x.date==="string").map(x=>Object.assign({},x,{scenes:arr(x.scenes).filter(o=>o&&typeof o==="object").map(sc=>Object.assign({},sc,{cast:arr(sc.cast)})),
    locations:arr(x.locations).filter(o=>o&&typeof o==="object"),
    contacts:arr(x.contacts).filter(o=>o&&typeof o==="object").map(c=>Object.assign({},c,{phone:c.phone==null?"":String(c.phone)})),
    calls:arr(x.calls).filter(o=>o&&typeof o==="object"),meals:arr(x.meals).filter(o=>o&&typeof o==="object"),cast:arr(x.cast).filter(o=>o&&typeof o==="object").map(c=>Object.assign({},c,{phone:c.phone==null?"":String(c.phone)})),
    hospital:x.hospital&&typeof x.hospital==="object"?Object.assign({},x.hospital,{phone:x.hospital.phone==null?"":String(x.hospital.phone)}):x.hospital})),
  prepro:list=>list.filter(d=>d&&typeof d.date==="string").map(d=>Object.assign({},d,{items:arr(d.items).filter(x=>x&&typeof x==="object"),notes:arr(d.notes).filter(x=>typeof x==="string")})).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:String(a.t||"").localeCompare(String(b.t||""))),
};
/* last data kept in this browser so the app opens instantly; the live database replaces it a moment later */
const CACHE_KEY="crewcache:v1";let cacheT=null;
function saveCache(){clearTimeout(cacheT);cacheT=setTimeout(()=>{try{localStorage.setItem(CACHE_KEY,JSON.stringify({meta:S.meta,days:S.days0||S.days,crew:S.crew,locs:S.locs,places:S.places,dispos:S.dispos0||S.dispos,prepro:S.prepro,gmap:S.gmap||null}))}catch(_){}},1500)}
function loadCache(){try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");if(!c||!Array.isArray(c.days))return false;S.meta=c.meta||null;S.gmap=c.gmap||null;for(const k of ["days","crew","locs","places","dispos","prepro"])S[k]=(CLEAN[k]||(x=>x))(arr(c[k]));S.days0=S.days;S.dispos0=S.dispos;if(typeof window.cdApplyAll==="function")window.cdApplyAll();MEMO.clear();return true}catch(_){return false}}
/* several snapshots arrive together on start: draw once per frame */
let RQ=0;function scheduleRender(){if(RQ)return;RQ=1;const go=()=>{if(!RQ)return;RQ=0;render()};requestAnimationFrame(go);setTimeout(go,120)}
let MSGT=null;function showMsg(text,ms){const m=$("#refmsg");m.hidden=false;m.textContent=text;clearTimeout(MSGT);MSGT=ms?setTimeout(()=>{m.hidden=true},ms):null} /* a newer message is not hidden by the timer of an older one */

applyStatic();
loadCache();
render();
