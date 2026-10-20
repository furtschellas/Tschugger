/* ---------- rides of the callsheet changed in the app (permission «Fahrten Manager»): times, route, vehicle, driver, passengers
   rideedit/{id of the original ride} = {c (encrypted with the crew key – names), d (date), at}; the Dropbox stays untouched,
   the change applies to exactly this ride of the callsheet (a new callsheet with another ride replaces it) ---------- */
window.RIDEEDIT=window.RIDEEDIT||{};window.REDVER=0;let REDSUB=null;
async function rideEditLoad(){if(REDSUB||typeof ME==="undefined"||!ME)return;
  try{const {F,db}=await fb();const key=await getDataKey();
    REDSUB=F.onSnapshot(F.query(F.collection(db,"rideedit"),F.where("d",">=",todayISO())),async q=>{const m={};for(const d of q.docs){try{m[d.id]=await ownDec(key,d.data().c)}catch(_){}}
      if(JSON.stringify(m)===JSON.stringify(window.RIDEEDIT))return;window.RIDEEDIT=m;window.REDVER++;try{MEMO.clear()}catch(_){}render();try{pushSyncSoon()}catch(_){}},()=>{REDSUB=null})}catch(_){}}
setTimeout(rideEditLoad,4500);
/* the changes on the rides of every callsheet (the originals stay in _o_transport / _o_crewTransport) */
const RED_KEYS=["t1","t2","from","to","vehicle","driver","passengers","people"];
window.rideEditApply=()=>{for(const dp of (typeof S!=="undefined"&&S.dispos)||[]){const c=dp&&dp.cs;if(!c||c._rev===window.REDVER)continue;
  for(const k of ["transport","crewTransport"]){const orig=c["_o_"+k]||c[k];if(!Array.isArray(orig))continue;c["_o_"+k]=orig;
    c[k]=orig.map(r=>{const id=rideId(dp.date,Object.assign({},r,{_rid:""}));const e=window.RIDEEDIT[id];if(!e)return Object.assign({},r,{_rid:id});
      const x=Object.assign({},r,{_rid:id,_orig:r});for(const f of RED_KEYS)if(e[f]!=null)x[f]=e[f];return x})}
  c._rev=window.REDVER}};
/* find a ride by its id */
function rideFind(id){for(const dp of S.dispos||[]){const c=dp&&dp.cs;if(!c)continue;for(const k of ["transport","crewTransport"])for(const r of (c[k]||[]))if(r&&r._rid===id)return {dp,c,k,r}}return null}
/* the popup: status (with «Fahrten quittieren»), times, route, vehicle, driver, passengers */
function rideEditDialog(id){rideEditApply();const f=rideFind(id);if(!f)return;const {dp,c,k,r}=f,o=r._orig||r,crew=k==="crewTransport",st=window.rideState?rideState(id):0,canAck=canPerm("rides.confirm")||canPerm("rides.manage");
  const drivers=[...new Set(String(c.drivers||"").split(/\s*[|\n;]\s*/).map(x=>x.replace(/\+?\d[\d ()\/.-]{7,}\d/g,"").replace(/o\.\s*p\.\s*D.*$/i,"").trim()).filter(Boolean).concat((c.transport||[]).map(x=>x.driver).filter(Boolean)))];
  const crewNames=[...new Set([].concat(...(S.crew||[]).map(g=>(g.people||[]).map(p=>p.name))).filter(Boolean))];
  const inp=(n,lab,v,type,extra)=>'<label>'+esc(L(lab))+'<input name="'+n+'"'+(type?' type="'+type+'"':'')+' value="'+esc(v||"")+'"'+(extra||"")+'></label>';
  const d=mkDialog("rededlg",null,{replace:true});
  d.innerHTML='<div class="a2box redbox"><h3>'+esc(L("Fahrt ändern"))+'</h3><p class="ghint">'+esc(dp.date.split("-").reverse().join(".")+" · "+csRoute(o.from,o.t1,o.to,o.t2))+'</p>'+
    (canAck?'<div class="redst" role="group">'+[[1,"Fahrt angenommen / läuft"],[2,"Fahrt ausgeführt"],[0,"Offen"]].map(([v,t])=>'<button type="button" data-redst="'+v+'" aria-pressed="'+(st===v)+'">'+esc(L(t))+'</button>').join("")+'</div>':'')+
    '<form data-redform novalidate><div class="redrow">'+inp("t1","Abfahrt",hm(r.t1),"time")+inp("t2","Ankunft",hm(r.t2),"time")+'</div>'+
    '<div class="redrow">'+inp("from","Von",r.from)+inp("to","Nach",r.to)+'</div>'+inp("vehicle","Fahrzeug",r.vehicle)+
    (crew?'':inp("driver","Fahrer:in",r.driver,"",' list="reddrv"')+'<datalist id="reddrv">'+drivers.map(n=>'<option value="'+esc(n)+'">').join("")+'</datalist>')+
    '<label>'+esc(L("Mitfahrende"))+'<textarea name="pax" rows="3">'+esc(crew?r.people:r.passengers)+'</textarea></label>'+
    '<label class="redadd">'+esc(L("Person hinzufügen"))+'<input data-redadd list="redppl" placeholder="'+esc(L("Name aus der Crewliste"))+'"></label><datalist id="redppl">'+crewNames.map(n=>'<option value="'+esc(n)+'">').join("")+'</datalist>'+
    '<p class="amsg" role="status"></p><div class="a2b">'+(r._orig?'<button type="button" class="lnk" data-redreset>'+esc(L("Original wiederherstellen"))+'</button>':'')+dlgBtn("lnk",'data-redx',"Abbrechen")+'<button type="submit" class="pri">'+esc(L("Speichern"))+'</button></div></form></div>';
  const msg=d.querySelector(".amsg");
  d.addEventListener("change",e=>{const t=e.target;if(t.matches("[data-redadd]")&&t.value.trim()){const ta=d.querySelector("[name=pax]");const l=ta.value.split(/\s*,\s*/).filter(Boolean);if(!l.includes(t.value.trim()))l.push(t.value.trim());ta.value=l.join(", ");t.value=""}});
  d.addEventListener("click",async e=>{
    if(e.target===d||e.target.closest("[data-redx]")){d.remove();return}
    const sb=e.target.closest("[data-redst]");if(sb){const v=+sb.dataset.redst;try{const {F,db}=await fb();const ref=F.doc(db,"rideack",id);
        if(!v){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const x={d:dp.date,at:Date.now(),s:v};await F.setDoc(ref,x);window.RIDEACK[id]=x}
        d.querySelectorAll("[data-redst]").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.redst===v)));render()}catch(err){msg.textContent=L("Speichern nicht möglich.")}return}
    if(e.target.closest("[data-redreset]")){try{const {F,db}=await fb();await F.deleteDoc(F.doc(db,"rideedit",id));d.remove();showMsg(L("Original wiederhergestellt."),2500)}catch(err){msg.textContent=L("Speichern nicht möglich.")}}});
  d.addEventListener("submit",async e=>{e.preventDefault();const fm=e.target;const val=n=>fm[n]?String(fm[n].value||"").trim():"";
    const now={t1:val("t1"),t2:val("t2"),from:val("from"),to:val("to"),vehicle:val("vehicle")};if(!crew)now.driver=val("driver");now[crew?"people":"passengers"]=val("pax").split(/\s*,\s*/).filter(Boolean).join(", ");
    /* only what differs from the callsheet is stored */
    const ch={};for(const f in now){const a=String(o[f]==null?"":o[f]).trim(),b=now[f];if((f==="t1"||f==="t2")?hm(a)!==hm(b):a!==b)ch[f]=b}
    fm.querySelector("button[type=submit]").disabled=true;
    try{const {F,db}=await fb();const ref=F.doc(db,"rideedit",id);
      if(!Object.keys(ch).length)await F.deleteDoc(ref);else await F.setDoc(ref,{c:await ownEnc(ch),d:dp.date,at:Date.now()});
      d.remove();showMsg(L("Fahrt gespeichert."),2500)}
    catch(err){fm.querySelector("button[type=submit]").disabled=false;msg.textContent=/permission/.test((err&&err.code)||"")?L("Keine Berechtigung."):L("Speichern nicht möglich.")}});
  document.body.appendChild(d);const f0=d.querySelector("input[name=t1]");if(f0)f0.focus()}
/* the circle of a ride in the callsheet: with «Fahrten Manager» it opens the popup (before the quick switch of «Fahrten quittieren») */
document.addEventListener("click",e=>{const b=e.target.closest(".rideack-cs[data-rideack]");if(!b||!canPerm("rides.manage"))return;e.preventDefault();e.stopImmediatePropagation();rideEditDialog(b.dataset.rideack)},true);
