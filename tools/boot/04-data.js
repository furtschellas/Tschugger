import {L,MEMO,S} from "../base/10-core.js";
import {CLEAN,arr,saveCache,scheduleRender} from "../base/20-data-start.js";
import {DATA_URL} from "./01-config.js";
import {DATAKEY,LASTSTAMP,MEMBER,b64,fb,isAdmin,setDATAKEY,setLASTSTAMP,withTimeout} from "./03-core-firebase.js";
import {pushSyncSoon} from "./07-push.js";
import {chgDetect,offlinePrep} from "./14-today-changes-offline.js";
/* ---- data: fetch encrypted file, decrypt with the key from Firestore ---- */
/* the encrypted data file is requested right at start, in parallel with the sign-in check; the first load uses that answer */
let PREENC=null;try{if(navigator.onLine!==false&&!LASTSTAMP)PREENC=fetch(DATA_URL+"?t="+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null)}catch(_){}
async function fetchEnc(){if(PREENC){const p=PREENC;PREENC=null;const j=await p;if(j&&j.ct)return j}const ac=typeof AbortController==="function"?new AbortController():null;const tm=setTimeout(()=>ac&&ac.abort(),25000);let r;try{r=await fetch(DATA_URL+"?t="+Date.now(),{cache:"no-store",signal:ac?ac.signal:undefined})}catch(err){throw Object.assign(new Error("network: "+(err&&err.name||err)),{code:"unavailable"})}finally{clearTimeout(tm)}if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
export async function getDataKey(){
  if(DATAKEY)return DATAKEY;
  /* the key is also kept on this device (only for signed-in crew), so blocking pictures open offline on set */
  let kv="";
  try{const {F,db}=await fb();const s=await withTimeout(F.getDoc(F.doc(db,"secret","key")),navigator.onLine===false?3000:20000,"key");
    if(!s.exists())throw new Error("no key");
    kv=String(s.data().k||"").trim().replace(/^["'“”«]+|["'“”»]+$/g,"");try{localStorage.setItem("dk:v1",kv)}catch(_){}}
  catch(err){
    /* refused by the rules (blocked, removed): the key kept on this device must not open new data any more */
    if(/permission/i.test((err&&err.code||"")+" "+(err&&err.message||""))){try{localStorage.removeItem("dk:v1")}catch(_){}throw err}
    try{kv=localStorage.getItem("dk:v1")||""}catch(_){}if(!kv)throw err}
  setDATAKEY(await crypto.subtle.importKey("raw",b64(kv),{name:"AES-GCM"},false,["encrypt","decrypt"]));
  return DATAKEY;
}
/* own keys per area (Drehbuch, Telefon/E-Mail): Firebase gives them only to people with that right; null = no right */
export const AREAKEYS={};
async function getAreaKey(area){
  if(area in AREAKEYS)return AREAKEYS[area];
  let kv="";
  try{const {F,db}=await fb();const s=await withTimeout(F.getDoc(F.doc(db,"secret","key"+area)),navigator.onLine===false?3000:20000,"key");
    if(!s.exists()){AREAKEYS[area]=undefined;return undefined} /* not yet introduced: the file still uses the crew key */
    kv=String(s.data().k||"").trim();try{localStorage.setItem("ak:"+area,kv)}catch(_){}}
  catch(err){if(/permission/i.test((err&&err.code||"")+" "+(err&&err.message||""))){try{localStorage.removeItem("ak:"+area)}catch(_){}AREAKEYS[area]=null;return null}
    try{kv=localStorage.getItem("ak:"+area)||""}catch(_){}if(!kv)throw err}   /* network error without a kept key: not «no right» (the data on the device stays) */
  AREAKEYS[area]=await crypto.subtle.importKey("raw",b64(kv),{name:"AES-GCM"},false,["decrypt"]);
  return AREAKEYS[area];
}
/* decrypt a file of an area: its own key, else (before the change) the crew key */
async function decArea(enc,area){
  const ak=await getAreaKey(area);if(ak===null)throw Object.assign(new Error("no access"),{code:"permission-denied"});
  const iv=b64(enc.iv),ct=b64(enc.ct);
  if(ak)try{return await crypto.subtle.decrypt({name:"AES-GCM",iv},ak,ct)}catch(_){
    /* the area key was changed meanwhile: read it once more */
    delete AREAKEYS[area];try{localStorage.removeItem("ak:"+area)}catch(_){}
    try{const k2=await getAreaKey(area);if(k2)return await crypto.subtle.decrypt({name:"AES-GCM",iv},k2,ct)}catch(_){}}
  return crypto.subtle.decrypt({name:"AES-GCM",iv},await getDataKey(),ct);
}
/* phone numbers and e-mail addresses of the crew list: own file, loaded after the data (only with that right) */
let CTP=null;
function contactsMerge(crew,list){let n=0;for(const [gi,pi,name,c] of (list||[])){const g=crew[gi],p=g&&g.people&&g.people[pi];if(p&&(p.name||"")===name&&c&&typeof c==="object"){for(const k in c)if(c[k]!=null)p[k]=String(c[k]);n++}}return n}
window.loadContacts=function(){if(CTP)return CTP;CTP=(async()=>{try{
    if(!MEMBER&&!isAdmin())return false;
    const r=await fetch("contacts.enc.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return false; /* not yet there: contacts are in the data */
    const pt=await decArea(await r.json(),"contacts");
    const list=JSON.parse(new TextDecoder().decode(pt)).c||[];
    if(contactsMerge(S.crew||[],list)){MEMO.clear();saveCache();scheduleRender()}
    return true}catch(err){
      if(/no access/.test(err&&err.message||"")){ /* no right (any more): no contacts on this device */
        let n=0;for(const g of (S.crew||[]))for(const p of (g.people||[]))for(const k of Object.keys(p))if(/^(phone|e?mail|tel|mobil|natel)/i.test(k)){delete p[k];n++}
        if(n){MEMO.clear();saveCache();scheduleRender()}}
      else console.warn("contacts",err&&err.message||err);return false}finally{CTP=null}})();return CTP};
/* the picture list of the galleries comes from its own file (media.enc.json), loaded in the background after the start */
let MEDIAP=null;
window.loadMedia=function(){if(MEDIAP)return MEDIAP;MEDIAP=(async()=>{try{
    const r=await fetch("media.enc.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);
    const enc=await r.json();const key=await getDataKey();const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(enc.iv)},key,b64(enc.ct));
    const bm=(JSON.parse(new TextDecoder().decode(pt)).bm)||[];
    if(S.meta){S.meta.bm=bm;S.meta.bmLoaded=S.meta.bmh||"";MEMO.clear();saveCache();scheduleRender();try{setTimeout(()=>offlinePrep(false),2000)}catch(_){}}
    return true}catch(err){console.warn("media",err&&err.message||err);return false}finally{MEDIAP=null}})();return MEDIAP};
function applyData(d){
  const prev=S.meta;S.meta=d.meta||null;
  /* the new data has no picture list: keep the one on this device when it is still the same, else fetch it in the background */
  if(S.meta&&!Array.isArray(S.meta.bm)){if(prev&&Array.isArray(prev.bm)&&prev.bmLoaded&&prev.bmLoaded===S.meta.bmh){S.meta.bm=prev.bm;S.meta.bmLoaded=prev.bmLoaded}else setTimeout(()=>window.loadMedia(),300)}
  const prevCrew=S.crew||[];
  for(const [k,src] of [["days","days"],["crew","crew"],["locs","locations"],["places","places"],["dispos","dispos"],["prepro","prepro"]])S[k]=(CLEAN[k]||(x=>x))(arr(d[src]));
  /* the shared Google map (points, lines, areas with layer and colour) for the callsheet map */
  S.gmap=d.gmap&&typeof d.gmap==="object"&&Array.isArray(d.gmap.f)?d.gmap:null;
  if(typeof window.repPermsSync==="function")window.repPermsSync();
  /* Coverday: the Drehplan as read (S.days0) and with the changes of the Coverday management laid over it (S.days) */
  S.days0=S.days;S.dispos0=S.dispos;if(typeof window.cdApplyAll==="function")window.cdApplyAll();   /* one permission per report folder */
  /* keep the contacts already on this device until the contacts file is read again (no flicker) */
  try{const ct=[];prevCrew.forEach((g,gi)=>(g.people||[]).forEach((p,pi)=>{const c={};for(const k in p)if(/^(phone|e?mail|tel|mobil|natel)/i.test(k)&&p[k])c[k]=p[k];if(Object.keys(c).length)ct.push([gi,pi,p.name||"",c])}));
    const hasOwn=S.crew.some(g=>(g.people||[]).some(p=>p.phone||p.email));if(!hasOwn){contactsMerge(S.crew,ct);setTimeout(()=>window.loadContacts(),200)}}catch(_){}
  MEMO.clear();saveCache();S.loaded=true;
  try{chgDetect()}catch(err){console.warn("changes",err)}
  try{setTimeout(()=>offlinePrep(false),4000)}catch(_){}
}
/* screenplay: separate encrypted file, fetched only when a scene is opened */
window.loadScriptData=async function(){
  try{
    if(!MEMBER&&!isAdmin())throw new Error("not signed in"); /* e.g. offline start: cached copy below */
    const ac=typeof AbortController==="function"?new AbortController():null;const tm=setTimeout(()=>ac&&ac.abort(),30000);
    let r;try{r=await fetch("script.enc.json?t="+Date.now(),{cache:"no-store",signal:ac?ac.signal:undefined})}finally{clearTimeout(tm)}
    if(!r.ok)throw new Error("HTTP "+r.status);
    const pt=await decArea(await r.json(),"script");
    const list=(JSON.parse(new TextDecoder().decode(pt)).script)||[];
    if(list.length)try{localStorage.setItem("scriptcache",JSON.stringify(list))}catch(_){}
    return list;
  }catch(err){ /* offline or slow network: use the last copy loaded on this device – not without the right */
    if(/no access/.test(err&&err.message||"")){try{localStorage.removeItem("scriptcache")}catch(_){}throw err}
    let c=null;try{c=JSON.parse(localStorage.getItem("scriptcache")||"null")}catch(_){}
    if(Array.isArray(c)&&c.length)return c;
    throw err;
  }
};
let LOADP=null;
export function load(force){
  if(LOADP)return LOADP;
  LOADP=loadOnce(force).finally(()=>{LOADP=null});
  return LOADP;
}
/* stamp.json (a few bytes): stamp of the data file and the last Dropbox check – the 0.8 MB data file is only loaded when it changed */
let CHECKED="";
async function fetchStamp(){try{const r=await withTimeout(fetch("stamp.json?t="+Date.now(),{cache:"no-store"}),8000,"stamp");if(!r.ok)return null;const j=await r.json();
  if(j&&j.c){CHECKED=j.c;if(S.meta)S.meta.checkedAt=j.c}return j&&j.s?j:null}catch(_){return null}}
async function loadOnce(force){
  if(!MEMBER&&!isAdmin())return false;
  if(!force&&LASTSTAMP&&(S.loaded||window.CACHEOK)){const st=await fetchStamp();if(st&&st.s===LASTSTAMP){try{localStorage.setItem("dtime:v1",String(Date.now()))}catch(_){}if(!S.loaded){S.loaded=true;scheduleRender()}return true}}
  const enc=await fetchEnc();
  if(!force&&enc.stamp&&enc.stamp===LASTSTAMP&&S.loaded)return true;
  /* new data: the key is asked for again (after a monthly key change the app must not go on writing reminders and own entries with the old one);
     the data not opening with the key in hand: once more with a freshly read key */
  if(enc.stamp&&enc.stamp!==LASTSTAMP&&LASTSTAMP)setDATAKEY(null);
  const dec=k=>crypto.subtle.decrypt({name:"AES-GCM",iv:b64(enc.iv)},k,b64(enc.ct));
  let pt;try{pt=await dec(await getDataKey())}catch(err){let old="";try{old=localStorage.getItem("dk:v1")||"";localStorage.removeItem("dk:v1")}catch(_){}setDATAKEY(null);
    /* a fresh key could not be read (offline, quota): the old one stays on the device (the offline files still need it) */
    try{pt=await dec(await getDataKey())}catch(e2){try{if(old&&!localStorage.getItem("dk:v1"))localStorage.setItem("dk:v1",old)}catch(_){}throw e2}}
  const data=JSON.parse(new TextDecoder().decode(pt));
  if(!data||!Array.isArray(data.days))throw new Error("data format");
  setLASTSTAMP(enc.stamp||null);window.__DSTAMP=LASTSTAMP;try{localStorage.setItem("dtime:v1",String(Date.now()))}catch(_){}   /* the stamp is kept only together with the data (saveCache) */applyData(data);if(CHECKED&&S.meta)S.meta.checkedAt=CHECKED;fetchStamp();scheduleRender();if(typeof pushSyncSoon==="function")pushSyncSoon();return true;
}
export function loadErr(err){
  const c=(err&&(err.code||err.name))||"",m=(err&&err.message)||String(err);
  let why;
  if(/permission/.test(c)||/permission/i.test(m))why="Kein Zugriff auf den Schlüssel (Firebase-Regeln prüfen)";
  else if(m==="no key")why="Schlüssel fehlt in Firebase (Sammlung secret, Dokument key, Feld k)";
  else if(c==="OperationError"||/decrypt|InvalidAccessError|DataError/i.test(c+m))why="Schlüssel passt nicht zu den Daten (Wert von secret/key prüfen)";
  else if(/^HTTP/.test(m))why="Datendatei nicht gefunden ("+m+")";
  else why=m;
  return L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen.")+" ["+why+"]";
}
export const isOffline=err=>!navigator.onLine||/unavailable|network|offline|failed to fetch|load failed/i.test(((err&&err.code)||"")+" "+((err&&err.message)||""));
