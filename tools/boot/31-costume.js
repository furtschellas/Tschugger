/* ---------- Kostüm & Maske from the callsheet (cast table, columns Kostüm / Maske, e.g. «Marina 07:55 - 08:10 15’; Anna 08:10 - 08:30»):
   every entry is an appointment in «Meine Termine» (with push reminder) for the person of Kostüm / Maske named in the column head and for
   the actor; with the right «Kostüm/Maske quittieren» (cm.ack) it is ticked off in the callsheet or in Meine Termine – then it is green.
   The tick is stored like the rides (rideack/{id}, id = check sum, no names) ---------- */
const CMK={w:"Kostüm",m:"Maske"};
/* the entries of one cell: who (full name from the call list when the first name matches), start, end, minutes */
function cmParse(v,c){const out=[];for(const seg of String(v==null?"":v).split(/\s*;\s*/)){
    const m=seg.match(/^\s*(?:([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.' -]*?)\s+)?(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);if(!m)continue;
    let who="";if(m[1]){const fn=fold(m[1].trim().split(/\s+/)[0]);who=arr(c&&c.calls).map(r=>String(r.name||"")).find(n=>fold(n).split(/\s+/)[0]===fn)||m[1].trim()}
    out.push({who,t:String(m[2]).padStart(2,"0")+":"+m[3],end:String(m[4]).padStart(2,"0")+":"+m[5]})}return out}
/* id of one entry: day, Kostüm/Maske, role of the cast row, start (no names in the id) */
const cmId=(date,k,r,t)=>{const s=[date,k,String(r&&(r.no||r.role)||"").trim(),t].join("|").toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "m"+(h>>>0).toString(36)};
/* state of a cast entry: 0 open, 1 active (running now), 2 done */
const cmSt=id=>{const x=window.RIDEACK&&window.RIDEACK[id];return x?(x.s===1?1:2):0};
const cmDone=id=>cmSt(id)===2;window.cmSt=cmSt;
const cmCan=()=>{try{return typeof canPerm==="function"&&canPerm("cm.ack")}catch(_){return false}};
window.cmDone=cmDone;window.cmId=cmId;window.cmParse=cmParse;
/* the button / mark of one entry (callsheet and Meine Termine) */
window.cmBtn=(id,date,label)=>{const ok=cmDone(id),tip=ok?L("Erledigt – antippen = zurücksetzen"):L("Offen – antippen = erledigt");
  if(!cmCan())return ok?'<span class="cmk cmok" title="'+esc(L("Erledigt"))+'">'+(window.RIDE_ICO?RIDE_ICO[1]:"✓")+'</span>':"";
  return '<button type="button" class="cmk'+(ok?' cmok':'')+'" data-cmack="'+esc(id)+'" data-cmd="'+esc(date)+'" aria-label="'+esc((label?label+" – ":"")+tip)+'" title="'+esc(tip)+'">'+(ok&&window.RIDE_ICO?RIDE_ICO[1]:'<span class="cmc"></span>')+'</button>'};
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-cmack]");if(!b)return;e.preventDefault();e.stopPropagation();if(!cmCan())return;
  const id=b.dataset.cmack,done=cmDone(id);b.disabled=true;
  try{const {F,db}=await fb();const ref=F.doc(db,"rideack",id);
    if(done){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const v={d:b.dataset.cmd,at:Date.now(),s:2};await F.setDoc(ref,v);window.RIDEACK[id]=v}
    try{MEMO.clear()}catch(_){}render()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}},true);
/* my appointments: as Kostüm / Maske (named in the column head) and as actor */
window.cmEvents=(me,t)=>{const out=[];let cm=null;try{cm=typeof csMe==="function"?csMe():null}catch(_){}if(!cm)return out;
  for(const dp of arr(S.dispos)){if(!dp||!dp.cs||dp.date<t)continue;const c=dp.cs,d=arr(S.days).find(x=>x.date===dp.date)||{};
    let where="",map="";try{const ls=typeof csLocs==="function"?csLocs(c):[];const b=ls.find(l=>arr(l.kinds).some(k=>/^W \/ H \/ M/.test(k)))||ls.find(l=>arr(l.kinds).includes("Base"));if(b){where=b.name||"";map=b.map||""}}catch(_){}
    for(const r of arr(c.cast))for(const k of ["w","m"]){const v=k==="w"?r.wardrobe:r.makeup;
      for(const p of cmParse(v,c)){const mine=p.who&&cm.hit(p.who),actor=r.actor&&cm.hit(r.actor);if(!mine&&!actor)continue;
        const id=cmId(dp.date,k,r,p.t);
        out.push({date:dp.date,t:p.t,end:p.end,n:L(CMK[k])+": "+(mine?[r.role,r.actor&&"("+r.actor+")"].filter(Boolean).join(" "):[r.role,p.who&&L("bei")+" "+p.who].filter(Boolean).join(" · ")),
          where,map,src:"Callsheet",go:d.id||dp.date,cm:id})}}}
  return out};
/* ---------- Cast quittieren (callsheet, cast table): P/UP, Call, Kostüm and Maske – the time itself is the tick: underlined = open,
   pink with white time = running (ride accepted), not underlined = done (green). Tap: open → running → done → open.
   Call / Kostüm / Maske with «Cast quittieren» (cm.ack); P/UP is not tapped here – it shows the state of the ride (Fahrten quittieren) ---------- */
const cqCanRide=()=>{try{return canPerm("rides.confirm")||canPerm("rides.manage")}catch(_){return false}};
window.cqLink=(kind,id,date,t)=>{const st=kind==="p"?(window.rideState?rideState(id):0):cmSt(id),can=kind==="p"?false:cmCan();   /* P/UP follows the ride quittance only (no tap here) */
  const cls="cql cq"+st,tip=kind==="c"?(st?L("Angekommen – antippen = zurücksetzen"):L("Offen – antippen = angekommen")):kind==="p"?[L("Fahrt offen – antippen = annehmen"),L("Fahrt läuft – antippen = ausgeführt"),L("Fahrt ausgeführt – antippen = zurücksetzen")][st]:[L("Offen – antippen = läuft"),L("Läuft – antippen = erledigt"),L("Erledigt – antippen = zurücksetzen")][st];
  if(!can)return '<span class="'+cls+' cqro" title="'+esc([L("Offen"),L("Läuft"),L("Erledigt")][st])+'">'+esc(t)+'</span>';
  return '<button type="button" class="'+cls+'" data-cqk="'+kind+'" data-cqid="'+esc(id)+'" data-cqd="'+esc(date)+'" title="'+esc(tip)+'" aria-label="'+esc(t+" – "+tip)+'">'+esc(t)+'</button>'};
/* P/UP: the ride of the callsheet that picks up the actor (passenger), at the pickup time if there are several */
/* the ride of the callsheet that picks up the actor (passenger), at the pickup time if there are several */
function cqRide(c,r){if(!r||!r.actor||!c||!c._date)return null;const k=fold(String(r.actor)).replace(/[^a-z ]/g,"").trim();if(!k)return null;
  const has=v=>fold(String(v||"")).includes(k)||k.split(" ").filter(w=>w.length>2).every(w=>fold(String(v||"")).includes(w));
  const rs=arr(c.transport).filter(x=>has(x.passengers)).concat(arr(c.crewTransport).filter(x=>has(x.people)));if(!rs.length)return null;
  const t=hm(r.pickup);return rs.find(x=>hm(x.t1)===t)||rs[0]}
/* the actor has arrived when Kostüm or Maske started or finished one of his times: then P/UP and Call count as done */
function cqArrived(c,r){if(!c||!c._date||!r)return false;for(const k of ["w","m"])for(const p of cmParse(k==="w"?r.wardrobe:r.makeup,c))if(cmSt(cmId(c._date,k,r,p.t))>0)return true;return false}
const cqDone=(t,tip)=>'<span class="cql cq2 cqro" title="'+esc(tip)+'">'+esc(t)+'</span>';
window.cqPickup=(c,r)=>{if(!hm(r&&r.pickup)||typeof rideId!=="function")return null;const ride=cqRide(c,r);if(!ride)return cqArrived(c,r)?{h:cqDone(String(r.pickup),L("Angekommen (Kostüm/Maske)"))}:null;
  const id=rideId(c._date,ride);if(cqArrived(c,r)&&!(window.rideState&&rideState(id)===2))return {h:cqDone(String(r.pickup),L("Angekommen (Kostüm/Maske)"))};
  return {h:window.cqLink("p",id,c._date,String(r.pickup))}};
/* Call: with a ride the arrival follows the ride (done when the ride is done); without a ride it is ticked here (open → arrived) */
window.cqCall=(c,r)=>{const t=hm(r&&r.call);if(!t||!c._date)return null;if(cqArrived(c,r))return {h:cqDone(String(r.call),L("Angekommen (Kostüm/Maske)"))};const ride=typeof rideId==="function"?cqRide(c,r):null;
  if(ride){const st=window.rideState&&rideState(rideId(c._date,ride))===2?2:0;return {h:'<span class="cql cq'+st+' cqro" title="'+esc(st?L("Angekommen (Fahrt ausgeführt)"):L("Folgt der Fahrt"))+'">'+esc(String(r.call))+'</span>'}}
  return {h:window.cqLink("c",cmId(c._date,"c",r,t),c._date,String(r.call))}};
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-cqk]");if(!b)return;e.preventDefault();e.stopPropagation();
  const k=b.dataset.cqk,id=b.dataset.cqid;if(k==="p"?!cqCanRide():!cmCan())return;b.disabled=true;
  try{const {F,db}=await fb();const ref=F.doc(db,"rideack",id);const st=k==="p"?(window.rideState?rideState(id):0):cmSt(id),cur=b.dataset.cqcur!=null?+b.dataset.cqcur:st,nx=k==="c"?(st?0:2):k==="b"?(st===2?0:2):(cur+1)%3;   /* Kostüm/Maske: open → running (pink) → done; Call: open → arrived */
    if(!nx){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const v={d:b.dataset.cqd,at:Date.now(),s:nx};await F.setDoc(ref,v);window.RIDEACK[id]=v}
    try{MEMO.clear()}catch(_){}render()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}},true);
/* Base: when Kostüm and Maske are both done, the base time is the running step (pink); tap = done (green) – before that plain text */
function cqAllDone(c,r){let n=0;for(const k of ["w","m"])for(const p of cmParse(k==="w"?r.wardrobe:r.makeup,c)){n++;if(cmSt(cmId(c._date,k,r,p.t))!==2)return false}return n>0}
window.cqBase=(c,r)=>{const t=hm(r&&r.base);if(!t||!c||!c._date||!cqAllDone(c,r))return null;const id=cmId(c._date,"b",r,t);
  {const o=hm(r.onset)?cqOnsetInfo(c,r):null;if(o&&(o.st>0||o.rs===2))return {h:'<span class="cql cq2 cqro" title="'+esc(L("Erledigt"))+'">'+esc(String(r.base))+'</span>'}}   /* On set started: Base done */
  const st=cmSt(id)===2?2:1;
  if(!cmCan())return {h:'<span class="cql cq'+st+' cqro" title="'+esc(st===2?L("Erledigt"):L("Läuft"))+'">'+esc(String(r.base))+'</span>'};
  const tip=st===2?L("Erledigt – antippen = zurücksetzen"):L("Läuft – antippen = erledigt");
  return {h:'<button type="button" class="cql cq'+st+'" data-cqk="b" data-cqid="'+esc(id)+'" data-cqd="'+esc(c._date)+'" title="'+esc(tip)+'" aria-label="'+esc(r.base+" – "+tip)+'">'+esc(String(r.base))+'</button>'}};
/* On set: the ride of the actor from the Base to the set – accepted: pink frame around the time; ride done: On set pink (running), tap = done (green) */
/* On set: id and the ride of the actor from the Base to the set */
function cqOnsetInfo(c,r){const id=cmId(c._date,"o",r,hm(r.onset));let ride=null;if(r.actor&&typeof rideId==="function"){const k=fold(String(r.actor)).replace(/[^a-z ]/g,"").trim();
    const has=v=>!!k&&(fold(String(v||"")).includes(k)||k.split(" ").filter(w=>w.length>2).every(w=>fold(String(v||"")).includes(w)));
    ride=arr(c.transport).filter(x=>has(x.passengers)&&/base/i.test(String(x.from||""))).concat(arr(c.crewTransport).filter(x=>has(x.people)&&/base/i.test(String(x.from||""))))[0]||null}
  return {id,st:cmSt(id),rs:ride&&window.rideState?rideState(rideId(c._date,ride)):0}}
/* On set: open (underlined) once Kostüm and Maske are done → tap = running (pink, Base then counts as done) → tap = done (white);
   the ride Base → set accepted: pink frame; ride done: On set running (pink) */
window.cqOnset=(c,r)=>{if(!hm(r&&r.onset)||!c||!c._date)return null;const {id,st,rs}=cqOnsetInfo(c,r),all=cqAllDone(c,r),t=String(r.onset);
  const cur=st===2?2:(st===1||rs===2)?1:(all?0:-1);
  if(cur<0)return rs===1?{h:'<span class="cql cqf cqro" title="'+esc(L("Fahrt zum Set angenommen"))+'">'+esc(t)+'</span>'}:null;
  const tip=[L("Offen – antippen = läuft"),L("Läuft – antippen = erledigt"),L("Erledigt – antippen = zurücksetzen")][cur];
  if(!cmCan())return {h:'<span class="cql cq'+cur+' cqro" title="'+esc(tip)+'">'+esc(t)+'</span>'};
  return {h:'<button type="button" class="cql cq'+cur+'" data-cqk="o" data-cqcur="'+cur+'" data-cqid="'+esc(id)+'" data-cqd="'+esc(c._date)+'" title="'+esc(tip)+'" aria-label="'+esc(t+" – "+tip)+'">'+esc(t)+'</button>'}};
