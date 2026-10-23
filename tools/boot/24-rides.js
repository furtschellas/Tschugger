/* ---------- rides of the callsheet: confirmed («quittiert») by AL, AD or production (permission «Fahrten quittieren»);
   the confirmation is shared (rideack/{id}, no names), a confirmed ride disappears from «Meine Termine» one hour after arrival ---------- */
window.RIDEACK=window.RIDEACK||{};let RIDEAT=0,RIDEBUSY=false;
async function rideAckLoad(force){if(RIDEBUSY||typeof ME==="undefined"||!ME||(!force&&Date.now()-RIDEAT<120e3))return;RIDEBUSY=true;RIDEAT=Date.now();
  try{const {F,db}=await fb();/* from the first callsheet of the last 60 days on (not only today): ticks of past shooting days must not disappear on reload */
    const t=todayISO(),lim=new Date(Date.now()-60*864e5).toISOString().slice(0,10);let from=t;for(const dp of (S.dispos||[]))if(dp&&dp.date&&dp.date<from&&dp.date>=lim)from=dp.date;
    const s=await F.getDocs(F.query(F.collection(db,"rideack"),F.where("d",">=",from)));const m={};s.forEach(x=>{m[x.id]=x.data()});
    const ch=JSON.stringify(m)!==JSON.stringify(window.RIDEACK);window.RIDEACK=m;if(ch&&(S.tab==="my"||S.tab==="today"||S.tab==="dispo"))render()}catch(_){}RIDEBUSY=false}
/* state of a ride: 0 open, 1 started (one check), 2 done (two checks); old entries without s count as done */
window.rideState=id=>{if(window.RIDEACKON===false)return 0;const x=window.RIDEACK[id];return x?(x.s===1?1:2):0};
/* when the ride was set to its state (ms) */
window.rideAt=id=>{const x=window.RIDEACK[id];return x&&+x.at||0};
const RIDE_ICO={1:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  2:'<svg viewBox="0 0 24 24" width="20" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12.5l4.5 4.5L16.5 7.5"/><path d="M11 16l1 1L21.5 7.5"/></svg>',
  car:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16V12l2-5h10l2 5v4"/><path d="M4 16h16v2H4z"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/><path d="M5 12h14"/><path class="rmove" d="M1 9h2M0.5 12h2"/></svg>'};
RIDE_ICO.here='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>';
window.RIDE_ICO=RIDE_ICO;
/* a ride in three steps: 1 driver on site · 2 on the way (car) · 3 done. Stored as rideack/{id} (s 1 = on site or on the way, s 2 = done)
   and, while on the way, rideack/v{id} (s 1) – so the old state (0/1/2, rideState) still means open / running / done everywhere */
window.rideStep=id=>{const s=window.rideState(id);if(!s)return 0;if(s===2)return 3;const v=window.RIDEACK["v"+id];return v?2:1};
const RIDESTEP=()=>[L("Fahrt offen"),L("Fahrer vor Ort"),L("Fahrzeug unterwegs"),L("Fahrt abgeschlossen")];
window.rideStepTip=n=>RIDESTEP()[n];
window.rideStepIco=n=>n===1?RIDE_ICO.here:n===2?RIDE_ICO.car:n===3?RIDE_ICO[1]:"";
window.rideStepCls=n=>n===1?"rs1 rsh":n===2?"rs1":n===3?"rs2":"rs0";
window.rideSet=async(id,date,n)=>{const {F,db}=await fb();const put=async(k,s)=>{const ref=F.doc(db,"rideack",k);if(!s){if(window.RIDEACK[k]){await F.deleteDoc(ref);delete window.RIDEACK[k]}}else{const v={d:date,at:Date.now(),s};await F.setDoc(ref,v);window.RIDEACK[k]=v}};
  await put(id,n===3?2:n?1:0);await put("v"+id,n===2?1:0)};
/* the status as a round icon: open = empty circle, accepted / running = driving car, done = check (same as in the callsheet) */
window.rideIco=st=>st===1?RIDE_ICO.car:st===2?RIDE_ICO[1]:"";   /* old two-step look (open / running / done) */
window.rideAckBtn=e=>{if(!e||!e.ride||!e.rid||e.noack||window.RIDEACKON===false)return"";   /* switched off in App-Verwaltung → Einstellungen */
  const n=rideStep(e.rid),st=rideState(e.rid),can=e.drv||(typeof canPerm==="function"&&(canPerm("rides.confirm")||canPerm("rides.manage")));
  const tip=[L("Fahrt offen – antippen = Fahrer vor Ort"),L("Fahrer vor Ort – antippen = Fahrzeug fährt los"),L("Fahrzeug unterwegs – antippen = Fahrt abgeschlossen"),L("Fahrt abgeschlossen – antippen = zurücksetzen")][n];
  if(!can)return n?'<span class="ridek rk'+st+(n===1?' rkh':'')+'" title="'+esc(rideStepTip(n))+'">'+rideStepIco(n)+'</span>':"";
  return '<button type="button" class="rideack rk'+st+(n===1?' rkh':'')+'" data-rideack="'+esc(e.rid)+'" data-rided="'+esc(e.date)+'"'+(e.drv?' data-rdrv="1"':'')+' aria-label="'+esc(tip)+'" title="'+esc(tip)+'">'+rideStepIco(n)+'</button>'};
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rideack]");if(!b)return;e.preventDefault();if(!canPerm("rides.confirm")&&!canPerm("rides.manage")&&!b.dataset.rdrv)return;   /* the driver confirms own rides */
  const id=b.dataset.rideack,nx=(rideStep(id)+1)%4;b.disabled=true;   /* open → driver on site → on the way → done → open */
  try{await rideSet(id,b.dataset.rided,nx);try{MEMO.clear()}catch(_){}render()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}});
/* load when «Meine Termine» or Today is shown (at most every 2 minutes) */
document.addEventListener("click",e=>{if(e.target.closest('[data-tab="my"],[data-tab="today"],[data-tab="dispo"],[data-tomy]'))setTimeout(()=>rideAckLoad(false),50)});
setTimeout(()=>rideAckLoad(true),4000);setInterval(()=>{if(S.tab==="my"||S.tab==="today"||S.tab==="dispo")rideAckLoad(false)},120e3);
document.addEventListener("click",e=>{if(!e.target.closest("[data-ridedone]"))return;e.preventDefault();window.SHOWDONE=!window.SHOWDONE;render()});
/* the callsheet greys a ride 20 minutes after it was done: draw again when one crosses that time */
{let OLDN=-1;setInterval(()=>{if(S.tab!=="dispo")return;const n=Object.values(window.RIDEACK||{}).filter(x=>x&&x.s!==1&&Date.now()-(+x.at||0)>20*60e3).length;let nk=null;try{const C=typeof CSCUR!=="undefined"&&CSCUR.c;if(C&&window.CSNOWK!=null){const l=csNowLoc(C,CSCUR.date,csLocs(C));nk=l?l.no+'|'+l.name:''}}catch(_){}
  /* also when the place of the shooting changes («jetzt hier») */
  /* also when the scene being shot changes («Jetzt» in my day) */
  let ns=null;try{if(window.CSNOWSC!=null&&typeof csNowScene==="function"){const r=csNowScene();ns=r?(r.ev||String(r.sc)):""}}catch(_){}
  if((OLDN>=0&&n!==OLDN)||(nk!=null&&nk!==window.CSNOWK)||(ns!=null&&ns!==window.CSNOWSC))render();OLDN=n},60e3)}

/* links inside clickable callsheet headers (L-codes, addresses): open the link without toggling or triggering the surrounding element */
document.addEventListener("click",e=>{const a=e.target&&e.target.closest&&e.target.closest("a[data-nobub]");if(a)e.stopPropagation()},true);

/* done rides (tick): the card in one line (route and status), tap opens vehicle, driver and passengers; the choice stays while the page is redrawn */
window.RIDEOPEN=window.RIDEOPEN||new Set();
document.addEventListener("click",e=>{const c=e.target.closest&&e.target.closest("#view .cs-card");if(!c||!c.querySelector(".ridest.rs2")||e.target.closest("a,button,input,select"))return;
  const id=(c.querySelector("[data-rideack]")||{}).dataset;const k=id&&id.rideack;const on=!c.classList.contains("csopen");c.classList.toggle("csopen",on);if(k){if(on)RIDEOPEN.add(k);else RIDEOPEN.delete(k)}});
csAfter(()=>{if(!RIDEOPEN.size)return;document.querySelectorAll("#view .cs-card [data-rideack]").forEach(b=>{if(RIDEOPEN.has(b.dataset.rideack))b.closest(".cs-card").classList.add("csopen")})});
