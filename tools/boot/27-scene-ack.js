/* ---------- scenes of the shooting day «quittiert» in the Drehplan: open → running (tap) → done (tap); sceneack/{date-scene}, no names.
   Everybody sees the state live; tapping only with the permission «Szenen quittieren». «Jetzt» follows: the running scene, else the next open one after the last done ---------- */
window.SCACK=window.SCACK||{};let SCSUB=null;
function scAckId(date,sc){return String(date||"").replace(/-/g,"")+"-"+fold(String(sc||"")).replace(/[^a-z0-9]/g,"").slice(0,24)}
window.scAckId=scAckId;
/* state of a scene: 0 open, 1 running, 2 done */
window.scState=(date,sc)=>{const x=window.SCACK[scAckId(date,sc)];return x?(x.s===1?1:2):0};
/* any scene of that day quittiert (then «jetzt» follows the quittances instead of the clock) */
window.scHas=date=>{const p=String(date||"").replace(/-/g,"")+"-";return Object.keys(window.SCACK).some(k=>k.startsWith(p))};
const SC_ICO={1:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h16v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 10l-.4-2.3a1.5 1.5 0 0 1 1.2-1.7l12.8-2.3a1.5 1.5 0 0 1 1.7 1.2L19.6 7"/><path d="M8.5 5.3l2.2 3.4M13.5 4.4l2.2 3.4"/></svg>',
  2:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'};
/* the round status button of a scene (visible for all, a button only with the permission) */
window.scAckBtn=(date,sc)=>{if(!date||!sc)return"";const st=scState(date,sc),can=typeof canPerm==="function"&&canPerm("scenes.ack");
  const tip=[L("Szene offen – antippen = Szene beginnt"),L("Szene läuft – antippen = abgeschlossen"),L("Szene abgeschlossen – antippen = zurücksetzen")][st];
  const lab=[L("Szene offen"),L("Szene läuft"),L("Szene abgeschlossen")][st];
  return can?'<button type="button" class="scack sk'+st+'" data-scack="'+esc(date)+'|'+esc(String(sc))+'" aria-label="'+esc(tip)+'" title="'+esc(tip)+'">'+(SC_ICO[st]||"")+'</button>'
    :'<span class="scack sk'+st+'" role="img" aria-label="'+esc(lab)+'" title="'+esc(lab)+'">'+(SC_ICO[st]||"")+'</span>'};
/* live for everybody: the quittances from yesterday on */
async function scAckSub(){if(SCSUB||typeof ME==="undefined"||!ME)return;try{const {F,db}=await fb();const y=new Date(Date.now()-864e5),p=n=>String(n).padStart(2,"0"),from=y.getFullYear()+"-"+p(y.getMonth()+1)+"-"+p(y.getDate());
  SCSUB=F.onSnapshot(F.query(F.collection(db,"sceneack"),F.where("d",">=",from)),q=>{const m={};q.forEach(d=>{m[d.id]=d.data()});if(JSON.stringify(m)!==JSON.stringify(window.SCACK)){window.SCACK=m;render()}},()=>{SCSUB=null})}catch(_){SCSUB=null}}
setTimeout(scAckSub,3000);setInterval(()=>{if(!SCSUB)scAckSub()},60e3);
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("button[data-scack]");if(!b)return;e.preventDefault();e.stopPropagation();if(typeof canPerm!=="function"||!canPerm("scenes.ack"))return;
  const [date,sc]=b.dataset.scack.split("|");const id=scAckId(date,sc),st=scState(date,sc),nx=(st+1)%3;
  if(!nx&&!confirmSafe(L("Szene {s} wieder auf «offen» setzen?").replace("{s}",sc)))return;b.disabled=true;
  try{const {F,db}=await fb();const ref=F.doc(db,"sceneack",id);
    if(!nx){await F.deleteDoc(ref);delete window.SCACK[id]}else{const v={d:date,at:Date.now(),s:nx};await F.setDoc(ref,v);window.SCACK[id]=v}
    render()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:/permission/.test((err&&err.code)||"")?L("Keine Berechtigung."):L("Speichern nicht möglich."),4000)}},true);
