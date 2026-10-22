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
