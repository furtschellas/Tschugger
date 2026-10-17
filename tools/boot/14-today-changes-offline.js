/* =====================================================================
   HEUTE · ÄNDERUNGEN · OFFLINE · PROTOKOLL
   ===================================================================== */
const pad2x=n=>String(n).padStart(2,"0");
const dmy=iso=>{const dt=new Date(iso+"T12:00:00");return WDL(dt).slice(0,2)+", "+pad2x(dt.getDate())+"."+pad2x(dt.getMonth()+1)+"."};
const scKey=x=>String(x||"").toLowerCase().replace(/\s+/g,"");
const unitItems=d=>[["1",arr(d.items)],["2",arr((d.unit2||{}).items)],["3",arr((d.unit3||{}).items)]];

/* ---------- 2) changes since the last visit on this device ---------- */
/* a snapshot of the schedule (scenes with date, unit, time, place) and the callsheet times is kept on the device;
   when new data arrives, the differences are listed for 3 days and the scenes are marked in the schedule */
function chgSnap(){
  const t=todayISO(),sc={},dp={};
  for(const d of S.days||[]){if(!d.date||d.date<t)continue;
    for(const [u,its] of unitItems(d))its.forEach(it=>{if(!it.sc)return;let k=u+"|"+scKey(it.sc),n=2;while(sc[k])k=u+"|"+scKey(it.sc)+"#"+(n++);
      sc[k]={date:d.date,u,sc:String(it.sc),t:String(it.t||""),loc:String(it.loc||""),set:String(it.set||"")}})}
  for(const x of S.dispos||[]){if(!x||!x.date||x.date<t)continue;dp[x.date]={call:String(x.crewCall||x.generalCall||""),wrap:String(x.wrap||""),v:String(x.version||"")}}
  return {sc,dp,at:Date.now()};
}
function chgLoad(){try{return JSON.parse(localStorage.getItem("chg:v1")||"[]")||[]}catch(_){return []}}
function chgSave(l){try{localStorage.setItem("chg:v1",JSON.stringify(l.slice(0,120)))}catch(_){}}
function chgDetect(){
  if(!(S.days||[]).length)return;
  const now=chgSnap();let old=null;try{old=JSON.parse(localStorage.getItem("snap:v1")||"null")}catch(_){}
  try{localStorage.setItem("snap:v1",JSON.stringify(now))}catch(_){}
  if(!old||!old.sc)return;
  const t=todayISO(),out=[],at=Date.now();
  const add=(o)=>out.push(Object.assign({id:Math.random().toString(36).slice(2,9),at},o));
  for(const k in now.sc){const a=old.sc[k],b=now.sc[k];
    if(!a){add({date:b.date,u:b.u,sc:b.sc,kind:"new",txt:L("Neu im Drehplan")+(b.t?" · "+b.t:"")});continue}
    if(a.date!==b.date){add({date:b.date,u:b.u,sc:b.sc,kind:"move",txt:L("verschoben")+": "+dmy(a.date)+" → "+dmy(b.date)+(b.t?" · "+b.t:"")});continue}
    if(a.t!==b.t&&(a.t||b.t))add({date:b.date,u:b.u,sc:b.sc,kind:"time",txt:L("Zeit")+": "+(a.t||"–")+" → "+(b.t||"–")});
    if(a.loc!==b.loc)add({date:b.date,u:b.u,sc:b.sc,kind:"loc",txt:L("Ort")+": "+(b.loc||"–")});
  }
  for(const k in old.sc){const a=old.sc[k];if(!now.sc[k]&&a.date>=t&&!Object.values(now.sc).some(b=>b.u===a.u&&scKey(b.sc)===scKey(a.sc)))add({date:a.date,u:a.u,sc:a.sc,kind:"gone",txt:L("nicht mehr im Drehplan")})}
  for(const dte in now.dp){const a=(old.dp||{})[dte],b=now.dp[dte];
    if(!a){add({date:dte,kind:"cs",txt:L("Neues Callsheet")+(b.call?" · Crew Call "+b.call:"")});continue}
    if(a.call!==b.call&&(a.call||b.call))add({date:dte,kind:"cs",txt:"Crew Call: "+(a.call||"–")+" → "+(b.call||"–")});
    else if(a.v!==b.v&&b.v)add({date:dte,kind:"cs",txt:L("Callsheet aktualisiert")+" ("+b.v+")"});
  }
  if(!out.length)return;
  const keep=chgLoad().filter(c=>at-c.at<3*864e5&&c.date>=t);
  /* newest wins for the same scene and kind */
  const merged=out.concat(keep.filter(c=>!out.some(o=>o.kind===c.kind&&o.sc===c.sc&&o.u===c.u&&o.date===c.date)));
  chgSave(merged);
  try{if(document.visibilityState==="visible"&&vok("plan"))showMsg(L("Drehplan geändert")+": "+out.length+" "+L(out.length===1?"Änderung":"Änderungen")+" – "+L("siehe «Heute»"),6000)}catch(_){}
}
function chgList(){const t=todayISO(),now=Date.now(),seen=+(localStorage.getItem("chgseen:v1")||0);return chgLoad().filter(c=>now-c.at<3*864e5&&c.date>=t).map(c=>Object.assign({},c,{unread:c.at>seen})).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:String(a.sc||"").localeCompare(String(b.sc||""),undefined,{numeric:true}))}
/* used by the schedule (itemHTML): mark a changed scene */
window.chgFor=(date,u,sc)=>{const k=scKey(sc);const l=chgList().filter(c=>c.date===date&&(c.u||"1")===(u||"1")&&scKey(c.sc)===k);return l.length?l.map(c=>c.txt).join(" · "):""};
document.addEventListener("click",e=>{if(!e.target.closest("[data-chgseen]"))return;try{localStorage.setItem("chgseen:v1",String(Date.now()))}catch(_){}render()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-chgpush]");if(!b||!can("push.send"))return;
  const l=chgList();const body=l.slice(0,8).map(c=>dmy(c.date)+(c.sc?" · "+L("Szene")+" "+c.sc:"")+": "+c.txt).join("\n").slice(0,300);
  try{sessionStorage.setItem("bcpre",JSON.stringify({t:L("Änderungen im Drehplan"),b:body}))}catch(_){}
  S.tab="bcast";store("tab","bcast");render();scrollTo(0,0);
  setTimeout(()=>{let pr=null;try{pr=JSON.parse(sessionStorage.getItem("bcpre")||"null");sessionStorage.removeItem("bcpre")}catch(_){}
    const f=document.querySelector("#view form");if(!f||!pr)return;const ti=f.querySelector("input[name=bt]"),bo=f.querySelector("textarea[name=bb]");
    if(ti){ti.value=pr.t;ti.dataset.dirty="1"}if(bo){bo.value=pr.b;bo.dataset.dirty="1"}},60)});

/* ---------- 3) offline on set: data key, today's + tomorrow's blocking pictures and the script stay on the device ---------- */
const OFF={busy:false};
function offState(){try{return JSON.parse(localStorage.getItem("offline:v1")||"null")}catch(_){return null}}
/* today (or the next working day) and the day after it */
function offDays(){const d=todayDay();if(!d)return [];const ds=(S.days||[]).filter(x=>x.date&&x.date>=d.date).map(x=>x.date);return [...new Set(ds)].slice(0,2)}
/* offline: no photos – only the blocking PDF pages and the floorplans, for all shooting days */
const offAuto=()=>{try{return localStorage.getItem("offline")!=="0"}catch(_){return true}};
async function offlinePrep(force){
  if(OFF.busy||!ME||navigator.onLine===false||!S.meta||!(vok("blocking")||vok("plan")))return;
  if(!force&&!offAuto())return; /* switched off in the profile: only on request */
  const st=offState(),files=new Set();
  for(const b of arr(S.meta.blocking))for(const m of (typeof bmed==="function"?bmed(b):arr(b.media)))if(m&&m.g==="pdf"&&m.f)files.add(m.f);
  for(const f of arr(S.meta.floorplans))for(const p of arr(f.pg))files.add(p);
  const list=[...files].sort(),sig=list.length+"|"+(list[0]||"")+"|"+(list[list.length-1]||"")+"|"+(S.meta.blkBase||"");
  if(!force&&st&&st.v===2&&st.sig===sig&&Date.now()-st.at<12*3600e3)return;
  OFF.busy=true;if(force)render();
  let n=0,fail=0;
  try{
    await getDataKey().catch(()=>{});
    for(let i=0;i<list.length;i+=6)await Promise.all(list.slice(i,i+6).map(f=>fetch(blkUrl(f),{cache:"force-cache"}).then(r=>{if(r.ok)n++;else fail++}).catch(()=>{fail++})));
    try{if(window.loadScriptData)await window.loadScriptData()}catch(_){}
    try{localStorage.setItem("offline:v1",JSON.stringify({v:2,at:Date.now(),sig,n,fail,fp:arr(S.meta.floorplans).filter(f=>arr(f.pg).length).length}))}catch(_){}
  }finally{OFF.busy=false}
  if(force){showMsg(L("Offline bereit")+": "+n+" "+L("Seiten"),4000);render()}
}
document.addEventListener("click",e=>{if(e.target.closest("[data-offprep]"))offlinePrep(true)});
/* route: from the crew hotel or from where I am right now */
document.addEventListener("click",e=>{const b=e.target.closest("[data-route]");if(!b)return;let r={};try{r=JSON.parse(b.dataset.route)}catch(_){return}
  let o=document.getElementById("routepop");if(o)o.remove();o=document.createElement("div");o.id="routepop";o.className="a2hs";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
  o.innerHTML='<div class="a2box rtbox"><button type="button" class="xclose" data-rtx aria-label="'+esc(L("Schliessen"))+'">×</button><h3>'+esc(L("Route in Google Maps"))+'</h3><p class="ghint">'+esc(L("Ziel"))+': '+esc(r.to||"")+'</p>'+
    '<div class="rtopts"><a class="pillbtn rtpill" href="'+esc(r.h)+'" target="_blank" rel="noopener noreferrer" data-rtx><b>'+esc(L("Vom Hotel"))+'</b>'+(r.from?'<small>'+esc(r.from)+'</small>':'')+'</a>'+
    '<a class="pillbtn rtpill" href="'+esc(r.c)+'" target="_blank" rel="noopener noreferrer" data-rtx><b>'+esc(L("Vom aktuellen Standort"))+'</b></a></div></div>';
  document.body.appendChild(o);o.addEventListener("click",ev=>{if(ev.target===o||ev.target.closest("[data-rtx]"))setTimeout(()=>o.remove(),50)})});
document.addEventListener("change",e=>{const c=e.target.closest("[data-offauto]");if(!c)return;store("offline",c.checked?"1":"0");if(c.checked)offlinePrep(false);render()});
document.addEventListener("click",e=>{if(!e.target.closest("[data-tomy]"))return;if(typeof openMyCal==="function")openMyCal();else{S.tab="my";render();scrollTo(0,0)}});
window.addEventListener("online",()=>{if(S.tab==="today")render()});window.addEventListener("offline",()=>{if(S.tab==="today")render()});

