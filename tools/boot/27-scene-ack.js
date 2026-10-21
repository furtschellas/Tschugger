/* ---------- scenes of the shooting day «quittiert» in the Drehplan: open → running (tap) → done (tap); sceneack/{date-scene}, no names.
   Everybody sees the state live; tapping only with the permission «Szenen quittieren». «Jetzt» follows: the running scene, else the next open one after the last done ---------- */
window.SCACK=window.SCACK||{};let SCSUB=null;
const scHM=ms=>{if(!ms)return"";const d=new Date(+ms);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
/* running time: 7′, 1h05 */
const scDur=ms=>{const m=Math.max(0,Math.floor(ms/60000));return m<60?m+"′":Math.floor(m/60)+"h"+String(m%60).padStart(2,"0")};
/* the counters of running scenes count on without drawing the page again */
setInterval(()=>document.querySelectorAll("[data-scrun]").forEach(el=>{el.textContent=scDur(Date.now()-(+el.dataset.scrun))}),20e3);
/* one id per scene and day for Drehplan and callsheet alike: «186 pt1A», «186pt1A», «Sc. 186 PT1A», «DJ 186pt1a» → 186pt1a; «21 CONT» = 21 */
function scAckId(date,sc){return String(date||"").replace(/-/g,"")+"-"+fold(String(sc||"")).replace(/[^a-z0-9]/g,"").replace(/^(dj|d|j|sc|sz|seq|scene|szene)(?=\d)/,"").replace(/(cont|continued|forts|fortsetzung)$/,"").slice(0,24)}
window.scAckId=scAckId;
/* state of a scene: 0 open, 1 running, 2 done */
window.scState=(date,sc)=>{const x=window.SCACK[scAckId(date,sc)];return x?(x.s===1?1:2):0};
/* any scene of that day quittiert (then «jetzt» follows the quittances instead of the clock) */
window.scHas=date=>{const p=String(date||"").replace(/-/g,"")+"-";return Object.keys(window.SCACK).some(k=>k.startsWith(p))};
const SC_ICO={1:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h16v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 10l-.4-2.3a1.5 1.5 0 0 1 1.2-1.7l12.8-2.3a1.5 1.5 0 0 1 1.7 1.2L19.6 7"/><path d="M8.5 5.3l2.2 3.4M13.5 4.4l2.2 3.4"/></svg>',
  2:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'};
/* the round status button of a scene (visible for all, a button only with the permission) */
window.scAckBtn=(date,sc,u)=>{if(!date||!sc)return"";u=String(u||"1");const st=scState(date,sc),can=typeof canPerm==="function"&&canPerm("scenes.ack");
  const tip=[L("Szene offen – antippen = Szene beginnt"),L("Szene läuft – antippen = abgeschlossen"),L("Szene abgeschlossen – antippen = ändern")][st];
  const lab=[L("Szene offen"),L("Szene läuft"),L("Szene abgeschlossen")][st];
  /* left of the icon: begin–end, while running begin and a counter how long it runs */
  const x=window.SCACK[scAckId(date,sc)]||{},b0=+x.b||+x.at||0,tm=st===2?scHM(b0)+(x.e?"–"+scHM(x.e):""):st===1?scHM(b0)+' · <span data-scrun="'+b0+'">'+scDur(Date.now()-b0)+'</span>':"";
  const lab0=tm?'<span class="scackt">'+tm+'</span>':'';
  return '<span class="scackw">'+lab0+(can?'<button type="button" class="scack sk'+st+'" data-scack="'+esc(date)+'|'+esc(String(sc))+'|'+esc(u)+'" aria-label="'+esc(tip)+'" title="'+esc(tip)+'">'+(SC_ICO[st]||"")+'</button>'
    :'<span class="scack sk'+st+'" role="img" aria-label="'+esc(lab)+'" title="'+esc(lab)+'">'+(SC_ICO[st]||"")+'</span>')+'</span>'};
/* live for everybody: the quittances from yesterday on */
async function scAckSub(){if(SCSUB||typeof ME==="undefined"||!ME)return;try{const {F,db}=await fb();const y=new Date(Date.now()-864e5),p=n=>String(n).padStart(2,"0"),from=y.getFullYear()+"-"+p(y.getMonth()+1)+"-"+p(y.getDate());
  SCSUB=F.onSnapshot(F.query(F.collection(db,"sceneack"),F.where("d",">=",from)),q=>{const m={};(q.docs||[]).forEach(d=>{m[d.id]=d.data()});if(JSON.stringify(m)!==JSON.stringify(window.SCACK)){window.SCACK=m;render()}},()=>{SCSUB=null})}catch(_){SCSUB=null}}
setTimeout(scAckSub,3000);setInterval(()=>{if(!SCSUB)scAckSub()},60e3);
/* the scene running in a unit on that day (other than this one): its scene number, else "" */
function scRunning(date,u,except){for(const [id,x] of Object.entries(window.SCACK))if(x&&x.d===date&&x.s===1&&String(x.u||"1")===String(u||"1")&&id!==except)return x.sc||id.split("-").slice(1).join("-");return""}
const scMs=(date,t)=>{const m=String(t||"").match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;const d=new Date(date+"T00:00:00");d.setHours(+m[1],+m[2],0,0);return d.getTime()};
async function scWrite(date,sc,u,v){const {F,db}=await fb();const id=scAckId(date,sc),ref=F.doc(db,"sceneack",id);
  if(!v){await F.deleteDoc(ref);delete window.SCACK[id]}else{v=Object.assign({d:date,at:Date.now(),u:String(u||"1"),sc:String(sc).slice(0,24)},v);for(const k of ["b","e"])if(v[k]==null)delete v[k];await F.setDoc(ref,v);window.SCACK[id]=v}render()}
/* tap: open → running (only when no other scene runs in this unit) → done; a done scene opens the popup to change state and times */
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("button[data-scack]");if(!b)return;e.preventDefault();e.stopPropagation();if(typeof canPerm!=="function"||!canPerm("scenes.ack"))return;
  const [date,sc,u]=b.dataset.scack.split("|");const id=scAckId(date,sc),st=scState(date,sc),x=window.SCACK[id]||{};
  if(st===2){scAckDialog(date,sc,u);return}
  if(st===0){const run=scRunning(date,u,id);if(run){showMsg(L("Szene {s} läuft noch – zuerst abschliessen.").replace("{s}",run),4000);return}}
  b.disabled=true;
  try{await scWrite(date,sc,u,st===0?{s:1,b:Date.now()}:{s:2,b:x.b||x.at||Date.now(),e:Date.now()})}
  catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:/permission/.test((err&&err.code)||"")?L("Keine Berechtigung."):L("Speichern nicht möglich."),4000)}},true);
/* popup of a quittiert scene: state, begin and end time; «offen» takes the quittance away */
function scAckDialog(date,sc,u){const id=scAckId(date,sc),x=window.SCACK[id]||{},st=scState(date,sc);
  const d=mkDialog("scackdlg",null,{replace:true});let cur=st;
  d.innerHTML='<div class="a2box scbox"><h3>'+esc(L("Szene"))+' '+esc(sc)+'</h3><p class="ghint">'+esc(date.split("-").reverse().join("."))+(u&&u!=="1"?' · '+esc((window.UNAME&&UNAME[u])||u)+' Unit':'')+'</p>'+
    '<div class="redst scst" role="group" aria-label="'+esc(L("Status"))+'">'+[[0,"Szene offen"],[1,"Szene läuft"],[2,"Szene abgeschlossen"]].map(([v,t])=>'<button type="button" class="scack sk'+v+'" data-scst="'+v+'" aria-pressed="'+(st===v)+'" title="'+esc(L(t))+'" aria-label="'+esc(L(t))+'">'+(SC_ICO[v]||"")+'</button>').join("")+'</div>'+
    '<form data-scform novalidate><div class="redrow"><label>'+esc(L("Beginn"))+'<input type="time" name="b" value="'+esc(scHM(x.b||x.at))+'"></label><label>'+esc(L("Ende"))+'<input type="time" name="e" value="'+esc(scHM(x.e))+'"></label></div>'+
    '<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+esc(L("Speichern"))+'</button><button type="button" class="lnk" data-scx>'+esc(L("Abbrechen"))+'</button></div></form></div>';
  const msg=d.querySelector(".amsg"),f=d.querySelector("form");
  d.addEventListener("click",ev=>{const t=ev.target.closest("[data-scst]");if(t){cur=+t.dataset.scst;d.querySelectorAll("[data-scst]").forEach(z=>z.setAttribute("aria-pressed",String(+z.dataset.scst===cur)));f.e.disabled=cur!==2;f.b.disabled=cur===0;return}
    if(ev.target===d||ev.target.closest("[data-scx]"))d.remove()});
  f.e.disabled=cur!==2;f.b.disabled=cur===0;
  f.addEventListener("submit",async ev=>{ev.preventDefault();const bm=scMs(date,f.b.value),em=scMs(date,f.e.value);
    if(cur===1){const run=scRunning(date,u,id);if(run){msg.textContent=L("Szene {s} läuft noch – zuerst abschliessen.").replace("{s}",run);return}}
    if(cur===2&&bm&&em&&em<bm){msg.textContent=L("Das Ende liegt vor dem Beginn.");return}
    f.querySelector("button[type=submit]").disabled=true;
    try{await scWrite(date,sc,u,cur===0?null:{s:cur,b:bm||x.b||Date.now(),e:cur===2?(em||x.e||Date.now()):null});d.remove();if(typeof savedPop==="function")savedPop(true)}
    catch(err){f.querySelector("button[type=submit]").disabled=false;msg.textContent=/permission/.test((err&&err.code)||"")?L("Keine Berechtigung."):L("Speichern nicht möglich.")}});
  document.body.appendChild(d)}
window.scAckDialog=scAckDialog;
/* Einstellungen → Log: the scene log (begin, end and duration of every quittiert scene, by day) */
const SCLOG={list:null,busy:false};
async function scLogLoad(){SCLOG.busy=true;try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"sceneack"));SCLOG.list=(q.docs||[]).map(d=>Object.assign({id:d.id},d.data()))}catch(_){SCLOG.list=[]}SCLOG.busy=false;render()}
window.sceneLogSec=()=>{if(!SCLOG.list){if(!SCLOG.busy)scLogLoad();return""}
  const g=new Map();for(const x of SCLOG.list.slice().sort((a,b)=>(b.d||"").localeCompare(a.d||"")||(+a.b||+a.at||0)-(+b.b||+b.at||0))){if(!g.has(x.d))g.set(x.d,[]);g.get(x.d).push(x)}
  const dur=(b,e)=>{if(!b||!e)return"";const m=Math.round((e-b)/60000);return m<60?m+"′":Math.floor(m/60)+"h"+String(m%60).padStart(2,"0")};
  return '<details class="tstsec scld" data-lsec="sclog"><summary class="lsum">'+(typeof logHead==="function"?logHead(esc(L("Szenen-Protokoll")),'<span class="tsth">'+SCLOG.list.length+' '+esc(L("Szenen"))+'</span>',""):esc(L("Szenen-Protokoll")))+'</summary>'+
    '<div class="admins"><p class="ahint">'+esc(L("Beginn und Ende jeder quittierten Szene (Drehplan und Callsheet)."))+'</p>'+
    ([...g].map(([d,l])=>'<details class="tstsu"><summary>'+esc(String(d||"").split("-").reverse().join("."))+' · '+l.length+' '+esc(L("Szenen"))+'</summary><ul class="audlist">'+
      l.map(x=>'<li><div class="audh"><b>'+esc(L("Szene"))+' '+esc(x.sc||x.id.split("-").slice(1).join("-"))+'</b>'+(x.u&&x.u!=="1"?' <span class="audt">'+esc((window.UNAME&&UNAME[x.u])||x.u)+' Unit</span>':'')+'<span class="audw">'+esc(x.s===1?L("läuft"):L("abgeschlossen"))+'</span></div><div class="audb">'+esc(scHM(x.b||x.at))+(x.e?' – '+esc(scHM(x.e))+' · '+esc(dur(x.b||x.at,x.e)):'')+'</div></li>').join("")+'</ul></details>').join("")||'<p class="ghint">'+esc(L("Noch keine Einträge."))+'</p>')+
    '<button type="button" class="pillbtn" data-sclre>'+esc(L("Neu laden"))+'</button></div></details>'};
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-sclre]")){SCLOG.list=null;render()}});
