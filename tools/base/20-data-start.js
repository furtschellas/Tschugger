/* ---------- data ---------- */
const arr=x=>Array.isArray(x)?x:[];
function cleanDay(d){
  const o=Object.assign({},d);o.items=arr(o.items).filter(x=>x&&typeof x==="object");o.notes=arr(o.notes).filter(x=>typeof x==="string");for(const l of ["fr","en"])if(o["notes_"+l]!==undefined)o["notes_"+l]=arr(o["notes_"+l]).filter(x=>typeof x==="string");
  for(const k of ["unit2","unit3"]){if(o[k]&&typeof o[k]==="object")o[k]=Object.assign({},o[k],{items:arr(o[k].items).filter(x=>x&&typeof x==="object"),notes:arr(o[k].notes)});else delete o[k];}
  return o;
}
const CLEAN={
  days:list=>list.filter(d=>d&&typeof d.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)).map(cleanDay).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0),
  crew:list=>list.map(c=>Object.assign({},c,{people:arr(c.people)})),
  locs:list=>list.map(l=>Object.assign({},l,{sets:arr(l.sets).map(x=>Object.assign({},x,{scenes:arr(x.scenes).map(String)}))})),
  places:list=>list.map(c=>Object.assign({},c,{items:arr(c.items)})),
  dispos:list=>list.filter(x=>x&&typeof x.date==="string"),
  prepro:list=>list.filter(d=>d&&typeof d.date==="string").map(d=>Object.assign({},d,{items:arr(d.items).filter(x=>x&&typeof x==="object"),notes:arr(d.notes).filter(x=>typeof x==="string")})).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:String(a.t||"").localeCompare(String(b.t||""))),
};
const rows=snap=>snap.docs.map(d=>Object.assign({id:d.id},d.data()));
const SOURCES=[["days","days","date"],["crew","crew","order"],["locations","locs","order"],["places","places","order"],["dispos","dispos","date"],["prepro","prepro","date"]];
function setData(key,list){S[key]=(CLEAN[key]||(x=>x))(list);MEMO.clear();saveCache()}
/* last data kept in this browser so the app opens instantly; the live database replaces it a moment later */
const CACHE_KEY="crewcache:v1";let cacheT=null;
function saveCache(){clearTimeout(cacheT);cacheT=setTimeout(()=>{try{localStorage.setItem(CACHE_KEY,JSON.stringify({meta:S.meta,days:S.days,crew:S.crew,locs:S.locs,places:S.places,dispos:S.dispos,prepro:S.prepro}))}catch(_){}},1500)}
function loadCache(){try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");if(!c||!Array.isArray(c.days))return false;S.meta=c.meta||null;for(const k of ["days","crew","locs","places","dispos","prepro"])S[k]=(CLEAN[k]||(x=>x))(arr(c[k]));MEMO.clear();return true}catch(_){return false}}
/* several snapshots arrive together on start: draw once per frame */
let RQ=0;function scheduleRender(){if(RQ)return;RQ=1;const go=()=>{if(!RQ)return;RQ=0;render()};requestAnimationFrame(go);setTimeout(go,120)}
async function reloadAll(db){
  const [mt,...lists]=await Promise.all([db.doc("meta/info").get(),...SOURCES.map(([col,,ord])=>db.collection(col).orderBy(ord).get())]);
  if(mt.exists)S.meta=mt.data();
  SOURCES.forEach(([,key],i)=>setData(key,rows(lists[i])));
  MEMO.clear();render();
}
function showMsg(text,ms){const m=$("#refmsg");m.hidden=false;m.textContent=text;if(ms)setTimeout(()=>{m.hidden=true},ms)}

applyStatic();
loadCache();
render();

(async()=>{
  const db=await claude.use("db");
  if(!db){S.loaded=true;$("#stand").textContent=L("Datenbank nicht erreichbar. Bitte mit einem Claude-Konto anmelden.");render();return}
  DB=db;
  let pending=SOURCES.length+1;const first={};
  const arrived=k=>{if(!first[k]){first[k]=1;if(--pending<=0)S.loaded=true}scheduleRender()};
  const fail=k=>err=>{console.error(k,err);S.loaded=true;showMsg(L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen."));scheduleRender()};
  SOURCES.forEach(([col,key,ord])=>db.collection(col).orderBy(ord).onSnapshot(sn=>{setData(key,rows(sn));arrived(col)},fail(col)));
  db.doc("meta/info").onSnapshot(sn=>{
    S.meta=sn.exists?sn.data():null;saveCache();
    if(REF.busy&&S.meta&&((S.meta.checkedAt||"")+"|"+(S.meta.updatedAt||""))!==REF.since){
      REF.busy=false;const b=$("#refresh");b.disabled=false;b.classList.remove("spin");
      showMsg((S.meta.updatedAt&&S.meta.checkedAt&&S.meta.updatedAt<S.meta.checkedAt)?L("Geprüft: keine neuen Dateien in der Dropbox."):L("Aktualisiert."),4000);
    }
    arrived("meta");
  },fail("meta"));

  /* refresh button: owner triggers the Dropbox check, everyone else reloads the latest stored data */
  const [u,m]=await Promise.all([claude.use("user"),claude.use("mcp")]);
  let own=false;try{own=u?await u.isOwner():false}catch(_){}
  const b=$("#refresh");b.hidden=false;
  if(!own||!m){
    b.addEventListener("click",async()=>{
      if(b.classList.contains("spin"))return;b.classList.add("spin");
      try{await reloadAll(db);const c=lastCheck(S.meta);showMsg(L("Neueste Daten geladen.")+(c?" "+L("Dropbox zuletzt geprüft")+" "+fmtStamp(c)+".":""),5000)}
      catch(err){console.error(err);showMsg(L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen."),5000)}
      setTimeout(()=>b.classList.remove("spin"),400);
    });
    return;
  }
  b.addEventListener("click",async()=>{
    if(REF.busy)return;REF.busy=true;REF.since=S.meta?(S.meta.checkedAt||"")+"|"+(S.meta.updatedAt||""):"";b.disabled=true;b.classList.add("spin");
    showMsg(L("Dropbox wird geprüft. Das dauert 1–3 Minuten, die App aktualisiert sich danach von selbst."));
    try{await m.callTool("Claude Code Remote","fire_trigger",{trigger_id:TRIGGER,text:"Manuell aus der App ausgelöst."},{cache:false})}
    catch(e){REF.busy=false;b.disabled=false;b.classList.remove("spin");showMsg((e&&(e.code==="permission_denied"||e.code==="not_granted"))?L("Zugriff nicht erlaubt. Bitte die Berechtigung der App erlauben und erneut tippen."):L("Aktualisierung konnte nicht gestartet werden")+" ("+((e&&(e.message||e.code))||"Fehler")+").");return}
    setTimeout(()=>{if(REF.busy){REF.busy=false;b.disabled=false;b.classList.remove("spin");showMsg(L("Die Aktualisierung braucht länger als üblich. Die App übernimmt die Daten automatisch, sobald sie fertig ist."))}},5*60*1000);
  });
})();
