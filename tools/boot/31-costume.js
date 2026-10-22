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
const cmDone=id=>!!(window.RIDEACK&&window.RIDEACK[id]);
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
/* ---------- Cast quittieren (callsheet, cast table): P/UP, Call, Kostüm and Maske – the time itself is the tick: at the start of the day
   pink and underlined; tap = done (green, white). P/UP is the ride of the actor: accepted = pink with white time, done = green.
   Call / Kostüm / Maske with «Cast quittieren» (cm.ack), P/UP with «Fahrten quittieren» / «Fahrten Manager» ---------- */
const cqCanRide=()=>{try{return canPerm("rides.confirm")||canPerm("rides.manage")}catch(_){return false}};
window.cqLink=(kind,id,date,t)=>{const st=kind==="p"?(window.rideState?rideState(id):0):(cmDone(id)?2:0),can=kind==="p"?cqCanRide():cmCan();
  const cls="cql cq"+st,tip=kind==="p"?[L("Fahrt offen – antippen = annehmen"),L("Fahrt läuft – antippen = ausgeführt"),L("Fahrt ausgeführt – antippen = zurücksetzen")][st]:(st?L("Erledigt – antippen = zurücksetzen"):L("Offen – antippen = erledigt"));
  if(!can)return '<span class="'+cls+' cqro" title="'+esc(st?L("Erledigt"):L("Offen"))+'">'+esc(t)+'</span>';
  return '<button type="button" class="'+cls+'" data-cqk="'+kind+'" data-cqid="'+esc(id)+'" data-cqd="'+esc(date)+'" title="'+esc(tip)+'" aria-label="'+esc(t+" – "+tip)+'">'+esc(t)+'</button>'};
/* P/UP: the ride of the callsheet that picks up the actor (passenger), at the pickup time if there are several */
window.cqPickup=(c,r)=>{const t=hm(r&&r.pickup);if(!t||!r.actor||!c._date||typeof rideId!=="function")return null;const k=fold(String(r.actor)).replace(/[^a-z ]/g,"").trim();if(!k)return null;
  const has=v=>fold(String(v||"")).includes(k)||k.split(" ").filter(w=>w.length>2).every(w=>fold(String(v||"")).includes(w));
  const rs=arr(c.transport).filter(x=>has(x.passengers)).concat(arr(c.crewTransport).filter(x=>has(x.people)));if(!rs.length)return null;
  const ride=rs.find(x=>hm(x.t1)===t)||rs[0];return {h:window.cqLink("p",rideId(c._date,ride),c._date,String(r.pickup))}};
window.cqCall=(c,r)=>{const t=hm(r&&r.call);if(!t||!c._date)return null;return {h:window.cqLink("c",cmId(c._date,"c",r,t),c._date,String(r.call))}};
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-cqk]");if(!b)return;e.preventDefault();e.stopPropagation();
  const k=b.dataset.cqk,id=b.dataset.cqid;if(k==="p"?!cqCanRide():!cmCan())return;b.disabled=true;
  try{const {F,db}=await fb();const ref=F.doc(db,"rideack",id);const st=k==="p"?(window.rideState?rideState(id):0):(cmDone(id)?2:0),nx=k==="p"?(st+1)%3:(st?0:2);
    if(!nx){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const v={d:b.dataset.cqd,at:Date.now(),s:nx};await F.setDoc(ref,v);window.RIDEACK[id]=v}
    try{MEMO.clear()}catch(_){}render()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}},true);
