import {L,MEMO,S,TX,dlgBtn,esc,mkDialog,saveBtn,saveErr,todayISO} from "../base/10-core.js";
import {hm,rideId} from "../base/12-mycal.js";
import {csAfter,csRoute} from "../base/13a-callsheet.js";
import {csLocs} from "../base/13c-cs-places.js";
import {render} from "../base/15-script-tab.js";
import {showMsg} from "../base/20-data-start.js";
import {ME,fb,ownDec,ownEnc} from "./03-core-firebase.js";
import {getDataKey} from "./04-data.js";
import {pushSyncSoon} from "./07-push.js";
import {cqCanRide} from "./24-flow.js";
import {scRender} from "./27-scene-ack.js";
/* ---------- rides of the callsheet changed in the app (permission «Fahrten Manager»): times, route, vehicle, driver, passengers
   rideedit/{id of the original ride} = {c (encrypted with the crew key – names), d (date), at}; the Dropbox stays untouched,
   the change applies to exactly this ride of the callsheet (a new callsheet with another ride replaces it) ---------- */
window.RIDEEDIT=window.RIDEEDIT||{};window.REDVER=0;export let REDSUB=null;
/* the subscription is marked at once (two quick calls made two subscriptions); a slower older snapshot does not overwrite a newer one;
   like the ticks: from the first callsheet of the last 60 days on (changed rides of past days stayed hidden) */
let REDSEQ=0,REDFROM="";
/* from which date on: the first callsheet of the last 60 days (computed again when the callsheets arrive after the start) */
const redFrom=()=>{const t=todayISO(),lim=new Date(Date.now()-60*864e5).toISOString().slice(0,10);let from=t;for(const dp of (S.dispos||[]))if(dp&&dp.date&&dp.date<from&&dp.date>=lim)from=dp.date;return from};
async function rideEditLoad(){if(REDSUB||typeof ME==="undefined"||!ME)return;REDSUB="…";
  try{const {F,db}=await fb();
    const from=redFrom();REDFROM=from;
    REDSUB=F.onSnapshot(F.query(F.collection(db,"rideedit"),F.where("d",">=",from)),async q=>{const my=++REDSEQ,m={};let key=null;try{key=await getDataKey()}catch(_){}for(const d of q.docs){try{m[d.id]=await ownDec(key,d.data().c)}catch(_){}}
      if(my!==REDSEQ||JSON.stringify(m)===JSON.stringify(window.RIDEEDIT))return;window.RIDEEDIT=m;window.REDVER++;try{MEMO.clear()}catch(_){}(typeof scRender==="function"?scRender:render)();try{pushSyncSoon()}catch(_){}},()=>{REDSUB=null})}catch(_){REDSUB=null}}
setTimeout(rideEditLoad,4500);setInterval(()=>{if(typeof REDSUB==="function"&&REDFROM&&redFrom()!==REDFROM){try{REDSUB()}catch(_){}REDSUB=null}if(!REDSUB)rideEditLoad()},30e3);   /* also after a late sign-in or a lost connection */
/* the changes on the rides of every callsheet (the originals stay in _o_transport / _o_crewTransport) */
const RED_KEYS=["t1","t2","from","to","vehicle","driver","passengers","people"];
window.rideEditApply=()=>{for(const dp of (typeof S!=="undefined"&&S.dispos)||[]){const c=dp&&dp.cs;if(c&&dp.date)c._date=dp.date;   /* the day of the callsheet (travel of other days) */
  if(!c||c._rev===window.REDVER)continue;
  for(const k of ["transport","crewTransport"]){const orig=c["_o_"+k]||c[k];if(!Array.isArray(orig))continue;c["_o_"+k]=orig;
    /* the id of a ride stays the same when Coverday moves its callsheet to another day (original date): every device ticks the same ride */
    c[k]=orig.map(r=>{const id=rideId(dp.cdFrom||dp.date,Object.assign({},r,{_rid:""}));const e=window.RIDEEDIT[id];if(!e)return Object.assign({},r,{_rid:id});
      const x=Object.assign({},r,{_rid:id,_orig:r});for(const f of RED_KEYS)if(e[f]!=null)x[f]=e[f];return x})}
  c._rev=window.REDVER}};
/* find a ride by its id */
function rideFind(id){for(const dp of S.dispos||[]){const c=dp&&dp.cs;if(!c)continue;for(const k of ["transport","crewTransport"])for(const r of (c[k]||[]))if(r&&r._rid===id)return {dp,c,k,r}}return null}
/* the popup: status (with «Fahrten quittieren»), times, route, vehicle, driver, passengers */
function rideEditDialog(id){rideEditApply();const f=rideFind(id);if(!f)return;const {dp,c,k,r}=f,o=r._orig||r,crew=k==="crewTransport",st=window.rideState?rideState(id):0,canAck=cqCanRide();
  const drivers=[...new Set(String(c.drivers||"").split(/\s*[|\n;]\s*/).map(x=>x.replace(/\+?\d[\d ()\/.-]{7,}\d/g,"").replace(/o\.\s*p\.\s*D.*$/i,"").trim()).filter(Boolean).concat((c.transport||[]).map(x=>x.driver).filter(Boolean)))];
  const crewNames=[...new Set([].concat(...(S.crew||[]).map(g=>(g.people||[]).map(p=>p.name))).filter(Boolean))];
  const inp=(n,lab,v,type,extra)=>'<label>'+esc(L(lab))+'<input name="'+n+'"'+(type?' type="'+type+'"':'')+' value="'+esc(v||"")+'"'+(extra||"")+'></label>';
  /* pull-down with the choices of the day; «Andere …» opens a free field */
  const OTHER="__other",noUrl=x=>String(x||"").replace(/https?:\/\/\S+/g,"").trim();const uniq=l=>[...new Set(l.map(noUrl).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de"));
  const sel=(n,lab,v,opts)=>{v=noUrl(v);   /* the choices are without map links – so is the value (else nothing was selected and saving emptied the field) */const o=uniq(opts.concat(v?[v]:[]));
    return '<label>'+esc(L(lab))+'<select name="'+n+'" data-redsel>'+'<option value=""></option>'+o.map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join("")+'<option value="'+OTHER+'">'+esc(L("Andere …"))+'</option></select><input name="'+n+'_x" hidden placeholder="'+esc(L(lab))+'"></label>'};
  const rides=[].concat(c.transport||[],c.crewTransport||[]);
  const places=rides.map(x=>x.from).concat(rides.map(x=>x.to),typeof csLocs==="function"?csLocs(c).map(l=>l.kinds?l.name:("L"+String(l.no||"").trim()+" · "+(l.name||""))):[],["Base","Hotel","Moxy","Holiday Inn"]);
  const vehicles=rides.map(x=>x.vehicle);
  /* driver: the drivers of the day, then everybody of the Aufnahmeleitung (crew list) */
  const alNames=uniq([].concat(...(S.crew||[]).filter(g=>/aufnahmeleitung|location|\bAL\b|produktion.*leitung/i.test(String(g.dept||""))).map(g=>(g.people||[]).map(p=>p.name))));
  const selDrv=v=>{v=String(v||"").trim();const d1=uniq(drivers.concat(v&&!alNames.includes(v)?[v]:[])),d2=alNames.filter(n=>!d1.includes(n));
    const opt=x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>';
    return '<label>'+esc(L("Fahrer:in"))+'<select name="driver" data-redsel><option value=""></option>'+(d1.length?'<optgroup label="'+esc(L("Fahrer des Tages"))+'">'+d1.map(opt).join("")+'</optgroup>':'')+
      (d2.length?'<optgroup label="'+esc(L("Aufnahmeleitung"))+'">'+d2.map(opt).join("")+'</optgroup>':'')+'<option value="'+OTHER+'">'+esc(L("Andere …"))+'</option></select><input name="driver_x" hidden placeholder="'+esc(L("Fahrer:in"))+'"></label>'};
  const d=mkDialog("rededlg",null,{replace:true});
  d.innerHTML='<div class="a2box redbox"><h3>'+esc(L("Fahrt ändern"))+'</h3><p class="ghint">'+esc(dp.date.split("-").reverse().join(".")+" · "+csRoute(o.from,o.t1,o.to,o.t2))+'</p>'+
    (canAck?'<div class="redst" role="group" aria-label="'+esc(L("Status"))+'">'+[0,1,2,3].map(v=>'<button type="button" class="ridest '+rideStepCls(v)+'" data-redst="'+v+'" aria-pressed="'+(rideStep(id)===v)+'" title="'+esc(rideStepTip(v))+'" aria-label="'+esc(rideStepTip(v))+'">'+(rideStepIco(v)||'')+'</button>').join("")+'</div>':'')+
    '<form data-redform novalidate><div class="redrow">'+inp("t1","Abfahrt",hm(r.t1),"time")+sel("from","Von",r.from,places)+'</div>'+
    '<div class="redrow">'+inp("t2","Ankunft",hm(r.t2),"time")+sel("to","Nach",r.to,places)+'</div>'+sel("vehicle","Fahrzeug",r.vehicle,vehicles)+
    (crew?'':selDrv(r.driver))+
    /* passengers as chips (× removes), add from the crew list by department or a free name */
    '<fieldset class="redpaxf"><legend>'+esc(L("Mitfahrende"))+'</legend><div class="redpax"></div><input type="hidden" name="pax">'+
    '<div class="redaddr"><select data-redadd aria-label="'+esc(L("Person hinzufügen"))+'"><option value="">+ '+esc(L("Person hinzufügen"))+'</option>'+
      (S.crew||[]).filter(g=>(g.people||[]).some(p=>p.name)).map(g=>'<optgroup label="'+esc(TX(g,"dept")||g.dept||"")+'">'+(g.people||[]).filter(p=>p.name).map(p=>'<option>'+esc(p.name)+'</option>').join("")+'</optgroup>').join("")+
      '<option value="'+OTHER+'">'+esc(L("Andere …"))+'</option></select>'+
    '<input data-redfree hidden placeholder="'+esc(L("Name"))+'"><button type="button" class="lnk" data-redfreeok hidden>'+esc(L("Hinzufügen"))+'</button></div></fieldset>'+

    '<p class="amsg" role="status"></p><div class="a2b">'+(r._orig?'<button type="button" class="lnk" data-redreset>'+esc(L("Original wiederherstellen"))+'</button>':'')+dlgBtn("lnk",'data-redx',"Abbrechen")+''+saveBtn("","",null,"pri")+'</div></form></div>';
  const msg=d.querySelector(".amsg");
  let pax=String((crew?r.people:r.passengers)||"").split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean);
  const drawPax=()=>{d.querySelector(".redpax").innerHTML=pax.length?pax.map((n,i)=>'<span class="redchip">'+esc(n)+'<button type="button" data-redrm="'+i+'" aria-label="'+esc(L("Entfernen")+" "+n)+'">×</button></span>').join(""):'<span class="ghint">'+esc(L("Niemand"))+'</span>';d.querySelector("[name=pax]").value=pax.join(", ")};
  const addPax=n=>{n=String(n||"").trim();if(n&&!pax.some(x=>x.toLowerCase()===n.toLowerCase())){pax.push(n);drawPax()}};
  drawPax();
  d.addEventListener("change",e=>{const t=e.target;if(t.matches("[data-redsel]")){const x=t.parentNode.querySelector("input[name='"+t.name+"_x']");if(x){x.hidden=t.value!==OTHER;if(!x.hidden)x.focus()}return}
    if(t.matches("[data-redadd]")&&t.value){const free=t.value===OTHER;d.querySelector("[data-redfree]").hidden=!free;d.querySelector("[data-redfreeok]").hidden=!free;if(free)d.querySelector("[data-redfree]").focus();else addPax(t.value);t.value=""}});
  d.addEventListener("click",async e=>{
    if(e.target===d||e.target.closest("[data-redx]")){d.remove();return}
    const rm=e.target.closest("[data-redrm]");if(rm){pax.splice(+rm.dataset.redrm,1);drawPax();return}
    if(e.target.closest("[data-redfreeok]")){const f=d.querySelector("[data-redfree]");addPax(f.value);f.value="";f.hidden=true;e.target.hidden=true;return}
    const sb=e.target.closest("[data-redst]");if(sb){const v=+sb.dataset.redst;try{await rideSet(id,dp.date,v);
        d.querySelectorAll("[data-redst]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.redst===v)));render()}catch(err){msg.textContent=L("Speichern nicht möglich.")}return}
    if(e.target.closest("[data-redreset]")){try{const {F,db}=await fb();await F.deleteDoc(F.doc(db,"rideedit",id));d.remove();showMsg(L("Original wiederhergestellt."),2500)}catch(err){msg.textContent=L("Speichern nicht möglich.")}}});
  d.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches("[data-redfree]")){e.preventDefault();d.querySelector("[data-redfreeok]").click()}});
  const readForm=fm=>{const val=n=>{const f0=fm.elements[n];if(!f0)return"";const v=String(f0.value||"").trim();if(v===OTHER){const x=fm.elements[n+"_x"];return x?String(x.value||"").trim():""}return v};
    const now={t1:val("t1"),t2:val("t2"),from:val("from"),to:val("to"),vehicle:val("vehicle")};if(!crew)now.driver=val("driver");now[crew?"people":"passengers"]=val("pax").split(/\s*,\s*/).filter(Boolean).join(", ");return now};
  d.addEventListener("submit",async e=>{e.preventDefault();const fm=e.target;const mine=readForm(fm);
    /* two managers: only the fields changed in this window are taken, the others come from the newest saved change (before, saving an
       older window undid the change another manager had saved in between) */
    const live=window.RIDEEDIT[id]||{},init=d.__init||{},now={};
    for(const f in mine)now[f]=mine[f]!==init[f]?mine[f]:(live[f]!=null?String(live[f]):(o[f]==null?"":String(o[f]).trim()));
    /* only what differs from the callsheet is stored */
    const ch={};for(const f in now){const a=String(o[f]==null?"":o[f]).trim(),b=now[f];if((f==="t1"||f==="t2")?hm(a)!==hm(b):a!==b&&noUrl(a)!==b)ch[f]=b}   /* a place with its map link in the callsheet counts as unchanged */
    fm.querySelector("button[type=submit]").disabled=true;
    try{const {F,db}=await fb();const ref=F.doc(db,"rideedit",id);
      if(!Object.keys(ch).length)await F.deleteDoc(ref);else await F.setDoc(ref,{c:await ownEnc(ch),d:dp.date,at:Date.now()});
      d.remove();showMsg(L("Fahrt gespeichert."),2500)}
    catch(err){fm.querySelector("button[type=submit]").disabled=false;msg.textContent=saveErr(err)}});
  document.body.appendChild(d);try{const fm=d.querySelector("form");if(fm)d.__init=readForm(fm)}catch(_){}const f0=d.querySelector("input[name=t1]");if(f0)f0.focus()}
/* the circle of a ride in the callsheet: with «Fahrten Manager» it opens the popup (before the quick switch of «Fahrten quittieren») */
document.addEventListener("click",e=>{const b=e.target.closest(".rideack-cs[data-rideack]");if(!b||!canPerm("rides.manage"))return;e.preventDefault();e.stopImmediatePropagation();window.REDBACK={id:b.dataset.rideack,until:Date.now()+15e3};rideEditDialog(b.dataset.rideack)},true);
/* after the popup (saved, reset or closed): back to the ride in «Transport with driver» – its part open, the ride in view, also after the new drawing */
function rideBack(){const r=window.REDBACK;if(!r||Date.now()>r.until||document.querySelector(".redbox"))return false;
  const el=[...document.querySelectorAll('#view [data-rideack="'+r.id+'"]')].map(b=>{let d=b.closest("details");while(d){d.open=true;d=d.parentElement&&d.parentElement.closest("details")}return b}).find(b=>b.offsetParent);
  if(!el)return false;const row=el.closest("tr,.cs-card")||el;row.scrollIntoView({block:"center"});row.classList.add("redflash");setTimeout(()=>row.classList.remove("redflash"),1600);return true}
/* popup closed: back to the ride now, and once more after the new drawing that follows a save (within 4 s) */
new MutationObserver(m=>{if(window.REDBACK&&m.some(x=>[...x.removedNodes].some(n=>n.nodeType===1&&(n.matches(".redbox")||n.querySelector(".redbox"))))){window.REDBACK.until=Date.now()+4000;requestAnimationFrame(rideBack)}}).observe(document.body,{childList:true});
csAfter(()=>{if(window.REDBACK&&!document.querySelector(".redbox")&&Date.now()<=window.REDBACK.until)rideBack()});
export function setREDSUB(v){return REDSUB=v}   /* other parts change REDSUB only through this */
