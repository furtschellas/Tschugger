/* ---------- rides of the callsheet: confirmed («quittiert») by AL, AD or production (permission «Fahrten quittieren»);
   the confirmation is shared (rideack/{id}, no names), a confirmed ride disappears from «Meine Termine» one hour after arrival ---------- */
window.RIDEACK=window.RIDEACK||{};let RIDEAT=0,RIDEBUSY=false;
async function rideAckLoad(force){if(RIDEBUSY||typeof ME==="undefined"||!ME||(!force&&Date.now()-RIDEAT<120e3))return;RIDEBUSY=true;RIDEAT=Date.now();
  try{const {F,db}=await fb();const s=await F.getDocs(F.query(F.collection(db,"rideack"),F.where("d",">=",todayISO())));const m={};s.forEach(x=>{m[x.id]=x.data()});
    const ch=JSON.stringify(m)!==JSON.stringify(window.RIDEACK);window.RIDEACK=m;if(ch&&(S.tab==="my"||S.tab==="today"||S.tab==="dispo"))render()}catch(_){}RIDEBUSY=false}
/* state of a ride: 0 open, 1 started (one check), 2 done (two checks); old entries without s count as done */
window.rideState=id=>{const x=window.RIDEACK[id];return x?(x.s===1?1:2):0};
/* when the ride was set to its state (ms) */
window.rideAt=id=>{const x=window.RIDEACK[id];return x&&+x.at||0};
const RIDE_ICO={1:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  2:'<svg viewBox="0 0 24 24" width="20" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12.5l4.5 4.5L16.5 7.5"/><path d="M11 16l1 1L21.5 7.5"/></svg>',
  car:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16V12l2-5h10l2 5v4"/><path d="M4 16h16v2H4z"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/><path d="M5 12h14"/><path class="rmove" d="M1 9h2M0.5 12h2"/></svg>'};
window.RIDE_ICO=RIDE_ICO;
window.rideAckBtn=e=>{if(!e||!e.ride||!e.rid||e.noack)return"";   /* crew transport and travel: no confirmation */const st=rideState(e.rid),can=e.drv||(typeof canPerm==="function"&&(canPerm("rides.confirm")||canPerm("rides.manage")));
  const tip=[L("Fahrt quittieren: einmal = Fahrt beginnt"),L("Fahrt beginnt – nochmals = ausgeführt"),L("Fahrt ausgeführt – nochmals = zurücksetzen")][st];
  if(!can)return st?'<span class="ridek rk'+st+'" title="'+esc(st===1?L("Fahrt beginnt"):L("Fahrt ausgeführt"))+'">'+RIDE_ICO[st]+'</span>':"";
  return '<button type="button" class="rideack rk'+st+'" data-rideack="'+esc(e.rid)+'" data-rided="'+esc(e.date)+'"'+(e.drv?' data-rdrv="1"':'')+' aria-label="'+esc(tip)+'" title="'+esc(tip)+'">'+(st?RIDE_ICO[st]:RIDE_ICO[1])+'</button>'};
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rideack]");if(!b)return;e.preventDefault();if(!canPerm("rides.confirm")&&!canPerm("rides.manage")&&!b.dataset.rdrv)return;   /* the driver confirms own rides */
  const id=b.dataset.rideack,st=rideState(id),nx=(st+1)%3;b.disabled=true;
  try{const {F,db}=await fb();const ref=F.doc(db,"rideack",id);
    if(!nx){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const v={d:b.dataset.rided,at:Date.now(),s:nx};await F.setDoc(ref,v);window.RIDEACK[id]=v}
    render()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}});
/* load when «Meine Termine» or Today is shown (at most every 2 minutes) */
document.addEventListener("click",e=>{if(e.target.closest('[data-tab="my"],[data-tab="today"],[data-tab="dispo"],[data-tomy]'))setTimeout(()=>rideAckLoad(false),50)});
setTimeout(()=>rideAckLoad(true),4000);setInterval(()=>{if(S.tab==="my"||S.tab==="today"||S.tab==="dispo")rideAckLoad(false)},120e3);
document.addEventListener("click",e=>{if(!e.target.closest("[data-ridedone]"))return;e.preventDefault();window.SHOWDONE=!window.SHOWDONE;render()});
/* the callsheet greys a ride 20 minutes after it was done: draw again when one crosses that time */
{let OLDN=-1;setInterval(()=>{if(S.tab!=="dispo")return;const n=Object.values(window.RIDEACK||{}).filter(x=>x&&x.s!==1&&Date.now()-(+x.at||0)>20*60e3).length;if(OLDN>=0&&n!==OLDN)render();OLDN=n},60e3)}
