/* ---------- rides of the callsheet: confirmed («quittiert») by AL, AD or production (permission «Fahrten quittieren»);
   the confirmation is shared (rideack/{id}, no names), a confirmed ride disappears from «Meine Termine» one hour after arrival ---------- */
window.RIDEACK=window.RIDEACK||{};let RIDEAT=0,RIDEBUSY=false;
async function rideAckLoad(force){if(RIDEBUSY||typeof ME==="undefined"||!ME||(!force&&Date.now()-RIDEAT<120e3))return;RIDEBUSY=true;RIDEAT=Date.now();
  try{const {F,db}=await fb();const s=await F.getDocs(F.query(F.collection(db,"rideack"),F.where("d",">=",todayISO())));const m={};s.forEach(x=>{m[x.id]=x.data()});
    const ch=JSON.stringify(m)!==JSON.stringify(window.RIDEACK);window.RIDEACK=m;if(ch&&(S.tab==="my"||S.tab==="today"))render()}catch(_){}RIDEBUSY=false}
window.rideAckBtn=e=>{if(!e||!e.ride||!e.rid)return"";const ok=!!window.RIDEACK[e.rid],can=typeof canPerm==="function"&&canPerm("rides.confirm");
  if(!can)return ok?'<span class="rideok" title="'+esc(L("Fahrt quittiert"))+'">✓ '+esc(L("quittiert"))+'</span>':"";
  return '<button type="button" class="pillbtn rideack'+(ok?' on':'')+'" data-rideack="'+esc(e.rid)+'" data-rided="'+esc(e.date)+'" aria-pressed="'+ok+'">'+(ok?'✓ '+esc(L("quittiert")):esc(L("Quittieren")))+'</button>'};
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rideack]");if(!b)return;e.preventDefault();if(!canPerm("rides.confirm"))return;
  const id=b.dataset.rideack,on=!!window.RIDEACK[id];b.disabled=true;
  try{const {F,db}=await fb();const ref=F.doc(db,"rideack",id);
    if(on){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const v={d:b.dataset.rided,at:Date.now()};await F.setDoc(ref,v);window.RIDEACK[id]=v}
    render()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}});
/* load when «Meine Termine» or Today is shown (at most every 2 minutes) */
document.addEventListener("click",e=>{if(e.target.closest('[data-tab="my"],[data-tab="today"],[data-tomy]'))setTimeout(()=>rideAckLoad(false),50)});
setTimeout(()=>rideAckLoad(true),4000);setInterval(()=>{if(S.tab==="my"||S.tab==="today")rideAckLoad(false)},300e3);
