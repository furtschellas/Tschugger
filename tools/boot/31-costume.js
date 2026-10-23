/* ---------- Kostüm & Maske from the callsheet (cast table, columns Kostüm / Maske, e.g. «Marina 07:55 - 08:10 15’; Anna 08:10 - 08:30»):
   every entry is an appointment in «Meine Termine» (with push reminder) for the person of Kostüm / Maske named in the column head and for
   the actor; with the right «Kostüm quittieren» (wardrobe.ack) / «Maske quittieren» (makeup.ack) it is ticked off in the callsheet or in Meine Termine – then it is green.
   The tick is stored like the rides (rideack/{id}, id = check sum, no names) ---------- */
const CMK={w:"Kostüm",m:"Maske"};
/* after a tick: draw again without moving the page (the open parts and the scroll position stay) */
function cqKeep(){const y=window.scrollY;render();window.scrollTo(0,y);requestAnimationFrame(()=>window.scrollTo(0,y))}
/* the entries of one cell: who (full name from the call list when the first name matches), start, end, minutes */
function cmParse(v,c){const out=[];for(const seg of String(v==null?"":v).split(/\s*;\s*/)){
    const m=seg.match(/^\s*(?:([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.' -]*?)\s+)?(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);if(!m)continue;
    let who="";if(m[1]){const fn=fold(m[1].trim().split(/\s+/)[0]);who=arr(c&&c.calls).map(r=>String(r.name||"")).find(n=>fold(n).split(/\s+/)[0]===fn)||m[1].trim()}
    out.push({who,t:pad2(m[2])+":"+m[3],end:pad2(m[4])+":"+m[5]})}return out}
/* id of one entry: day, Kostüm/Maske, role of the cast row, start (no names in the id) */
const cmId=(date,k,r,t)=>{const s=[date,k,String(r&&(r.no||r.role)||"").trim(),t].join("|").toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "m"+(h>>>0).toString(36)};
/* state of a cast entry: 0 open, 1 active (running now), 2 done */
const cmSt=id=>{const x=window.RIDEACK&&window.RIDEACK[id];return x?(x.s===1?1:2):0};
const cmDone=id=>cmSt(id)===2;window.cmSt=cmSt;
/* rights: Kostüm times «Kostüm quittieren» (wardrobe.ack), Maske times «Maske quittieren» (makeup.ack); Call, Base and On set with either of them */
const cmCan=k=>{try{if(typeof canPerm!=="function")return false;return k==="w"?canPerm("wardrobe.ack"):k==="m"?canPerm("makeup.ack"):(canPerm("wardrobe.ack")||canPerm("makeup.ack"))}catch(_){return false}};
window.cmDone=cmDone;window.cmId=cmId;window.cmParse=cmParse;
/* the button / mark of one entry (callsheet and Meine Termine) */
window.cmBtn=(id,date,label,k)=>{const ok=cmDone(id),tip=ok?L("Erledigt – antippen = zurücksetzen"):L("Offen – antippen = erledigt");
  if(!cmCan(k))return ok?'<span class="cmk cmok" title="'+esc(L("Erledigt"))+'">'+(window.RIDE_ICO?RIDE_ICO[1]:"✓")+'</span>':"";
  return '<button type="button" class="cmk'+(ok?' cmok':'')+'" data-cmack="'+esc(id)+'" data-cmd="'+esc(date)+'" data-cmk="'+esc(k||"")+'" aria-label="'+esc((label?label+" – ":"")+tip)+'" title="'+esc(tip)+'">'+(ok&&window.RIDE_ICO?RIDE_ICO[1]:'<span class="cmc"></span>')+'</button>'};
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-cmack]");if(!b)return;e.preventDefault();e.stopPropagation();if(!cmCan(b.dataset.cmk))return;
  const id=b.dataset.cmack,done=cmDone(id);b.disabled=true;
  try{const {F,db}=await fb();const ref=F.doc(db,"rideack",id);
    if(done){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const v={d:b.dataset.cmd,at:Date.now(),s:2};await F.setDoc(ref,v);window.RIDEACK[id]=v}
    try{MEMO.clear()}catch(_){}cqKeep()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}},true);
/* my appointments: as Kostüm / Maske (named in the column head) and as actor */
window.cmEvents=(me,t)=>{const out=[];let cm=null;try{cm=typeof csMe==="function"?csMe():null}catch(_){}if(!cm)return out;
  for(const dp of arr(S.dispos)){if(!dp||!dp.cs||dp.date<t)continue;const c=dp.cs,d=arr(S.days).find(x=>x.date===dp.date)||{};
    let where="",map="";try{const ls=typeof csLocs==="function"?csLocs(c):[];const b=ls.find(l=>arr(l.kinds).some(k=>/^W \/ H \/ M/.test(k)))||ls.find(l=>arr(l.kinds).includes("Base"));if(b){where=b.name||"";map=b.map||""}}catch(_){}
    for(const r of arr(c.cast))for(const k of ["w","m"]){const v=k==="w"?r.wardrobe:r.makeup;
      for(const p of cmParse(v,c)){const mine=p.who&&cm.hit(p.who),actor=r.actor&&cm.hit(r.actor);if(!mine&&!actor)continue;
        const id=cmId(dp.date,k,r,p.t);
        out.push({date:dp.date,t:p.t,end:p.end,n:L(CMK[k])+": "+(mine?[r.role,r.actor&&"("+r.actor+")"].filter(Boolean).join(" "):[r.role,p.who&&L("bei")+" "+p.who].filter(Boolean).join(" · ")),
          where,map,src:"Callsheet",go:d.id||dp.date,cm:id,cmk:k})}}}
  return out};
/* ---------- Cast quittieren (callsheet, cast table): the time itself is the tick.
   open = pink (underlined only where I can tick it) · running = pink box, white time · done = white.
   Rights: Kostüm «Kostüm quittieren» (wardrobe.ack), Maske «Maske quittieren» (makeup.ack), Call / Base / On set either of them;
   P/UP is not tapped here – it follows the ride (Fahrten quittieren). «Cast manuell quittieren» (cast.manual): every time by hand.
   «Cast-Quittierungen sehen» (cast.see): without it (and without a right to tick) only the plain times.
   The rules of a row, in order:
   1. On set started (tapped, by hand or the ride Base → set done) → P/UP, Call, Kostüm, Maske and Base done
   2. Base done (tapped or by hand) → P/UP, Call, Kostüm and Maske done; On set open
   3. Call done → P/UP done
   4. a hand tick (cast.manual) wins over the automatic state
   5. automatic: Kostüm or Maske started → P/UP and Call done; P/UP and Call follow the ride; both Kostüm and Maske done → Base running;
      On set open once Kostüm and Maske (or Base) are done, running when the ride Base → set is done, pink frame when that ride is accepted ---------- */
const cqCanRide=()=>{try{return canPerm("rides.confirm")||canPerm("rides.manage")}catch(_){return false}};
const cqMan=()=>{try{return typeof canPerm==="function"&&canPerm("cast.manual")}catch(_){return false}};
window.cqSee=()=>{try{return typeof canPerm==="function"&&(canPerm("cast.see")||canPerm("wardrobe.ack")||canPerm("makeup.ack")||canPerm("cast.manual")||canPerm("rides.confirm")||canPerm("rides.manage"))}catch(_){return false}};
const CQTIP3=()=>[L("Offen – antippen = läuft"),L("Läuft – antippen = erledigt"),L("Erledigt – antippen = zurücksetzen")];
const cqSpan=(st,t,tip,x)=>'<span class="cql cq'+st+(x?" "+x:"")+' cqro" title="'+esc(tip)+'">'+esc(t)+'</span>';
const cqBtn=(st,k,id,date,t,tip,cur,pre)=>'<button type="button" class="cql cq'+st+'" data-cqk="'+k+'"'+(cur!=null?' data-cqcur="'+cur+'"':'')+' data-cqid="'+esc(id)+'" data-cqd="'+esc(date)+'" title="'+esc((pre||"")+tip)+'" aria-label="'+esc(t+" – "+tip)+'">'+esc(t)+'</button>';
const cqDone=(t,tip)=>cqSpan(2,t,tip);
/* one time as tick (Kostüm/Maske in the callsheet, P/UP, Call) */
window.cqLink=(kind,id,date,t)=>{const st=kind==="p"?(window.rideState?rideState(id):0):cmSt(id),can=kind==="p"?false:cmCan(kind);
  if(!can)return cqSpan(st,t,[L("Offen"),L("Läuft"),L("Erledigt")][st]);
  const tip=kind==="c"?(st?L("Angekommen – antippen = zurücksetzen"):L("Offen – antippen = angekommen")):CQTIP3()[st];
  return cqBtn(st,kind,id,date,t,tip)};
/* the ride of the callsheet that picks up the actor (passenger), at the pickup time if there are several */
const cqWho=r=>{const k=fold(String(r&&r.actor||"")).replace(/[^a-z ]/g,"").trim();return v=>!!k&&(fold(String(v||"")).includes(k)||k.split(" ").filter(w=>w.length>2).every(w=>fold(String(v||"")).includes(w)))};
function cqRide(c,r){if(!r||!r.actor||!c||!c._date)return null;const has=cqWho(r);
  const rs=arr(c.transport).filter(x=>has(x.passengers)).concat(arr(c.crewTransport).filter(x=>has(x.people)));if(!rs.length)return null;
  const t=hm(r.pickup);return rs.find(x=>hm(x.t1)===t)||rs[0]}
/* On set: id and the ride of the actor from the Base to the set */
function cqOnsetInfo(c,r){const id=cmId(c._date,"o",r,hm(r.onset));let ride=null;if(r.actor&&typeof rideId==="function"){const has=cqWho(r);
    ride=arr(c.transport).filter(x=>has(x.passengers)&&/base/i.test(String(x.from||""))).concat(arr(c.crewTransport).filter(x=>has(x.people)&&/base/i.test(String(x.from||""))))[0]||null}
  return {id,st:cmSt(id),rs:ride&&window.rideState?rideState(rideId(c._date,ride)):0}}
/* everything one row needs, read once */
function cqModel(c,r){const d=c._date,st=(k,t)=>hm(t)?cmSt(cmId(d,k,r,hm(t))):0;let n=0,all=true,arrived=false;
  for(const k of ["w","m"])for(const p of cmParse(k==="w"?r.wardrobe:r.makeup,c)){n++;const s=cmSt(cmId(d,k,r,p.t));if(s>0)arrived=true;if(s!==2)all=false}
  const ride=typeof rideId==="function"?cqRide(c,r):null,rid=ride?rideId(d,ride):"",rs=ride&&window.rideState?rideState(rid):0;
  const on=hm(r.onset)?cqOnsetInfo(c,r):{id:"",st:0,rs:0};
  const onStarted=!!hm(r.onset)&&(on.st>0||st("xo",r.onset)>0||on.rs===2),baseDone=st("b",r.base)===2||st("xb",r.base)===2;
  return {d,st,wmDone:n>0&&all,arrived,ride,rid,rs,on,onStarted,baseDone,callDone:st("c",r.call)===2||st("xc",r.call)===2}}
/* rule 5: the automatic state of one time (html or null = plain time) */
const CQAUTO={
  p(m,r,t){if(typeof rideId!=="function")return null;const arr_=L("Angekommen (Kostüm/Maske)");
    if(!m.ride)return m.arrived?cqDone(t,arr_):null;if(m.arrived&&m.rs!==2)return cqDone(t,arr_);return window.cqLink("p",m.rid,m.d,t)},
  c(m,r,t){if(m.arrived)return cqDone(t,L("Angekommen (Kostüm/Maske)"));
    if(m.ride){const s=m.rs===2?2:0;return cqSpan(s,t,s?L("Angekommen (Fahrt ausgeführt)"):L("Folgt der Fahrt"))}
    return window.cqLink("c",cmId(m.d,"c",r,hm(t)),m.d,t)},
  b(m,r,t){if(!m.wmDone&&m.st("b",t)!==2)return null;   /* a stored Base tick stays visible */
    if(hm(r.onset)&&(m.on.st>0||m.on.rs===2))return cqDone(t,L("Erledigt"));
    const s=m.st("b",t)===2?2:1;if(!cmCan("b"))return cqSpan(s,t,s===2?L("Erledigt"):L("Läuft"));
    return cqBtn(s,"b",cmId(m.d,"b",r,hm(t)),m.d,t,s===2?L("Erledigt – antippen = zurücksetzen"):L("Läuft – antippen = erledigt"))},
  o(m,r,t){const {id,st,rs}=m.on,cur=st===2?2:(st===1||rs===2)?1:(m.wmDone||m.baseDone)?0:-1;
    if(cur<0)return rs===1?'<span class="cql cqf cqro" title="'+esc(L("Fahrt zum Set angenommen"))+'">'+esc(t)+'</span>':null;
    const tip=CQTIP3()[cur];if(!cmCan("o"))return cqSpan(cur,t,tip);return cqBtn(cur,"o",id,m.d,t,tip,cur)}};
/* rule 4: a hand tick (id kind «x…», stored on its own) wins; with the right every time is a button */
function cqManual(f,m,r,t,h){const id=cmId(m.d,"x"+f,r,hm(t)),st=cmSt(id),man=cqMan();
  if(!st&&(!man||(h&&!/cqro/.test(h))))return h;
  const cur=st||(h?+((h.match(/\bcq([012])\b/)||[])[1]||0):0),tip=CQTIP3()[cur];
  return man?cqBtn(cur,"x",id,m.d,t,tip,cur,L("Von Hand")+" · "):cqSpan(cur,t,tip)}
const CQF={p:"pickup",c:"call",b:"base",o:"onset"};
function cqField(f,c,r){if(!c||!c._date||!r||!window.cqSee())return null;const v=r[CQF[f]];if(!hm(v))return null;const t=String(v),m=cqModel(c,r);
  if(f!=="o"&&(f==="b"?m.onStarted:m.onStarted||m.baseDone))return {h:cqDone(t,L("Erledigt")+" ("+(m.onStarted?"On set":"Base")+")")};   /* rules 1, 2 */
  if(f==="p"&&m.callDone)return {h:cqDone(t,L("Erledigt")+" (Call)")};   /* rule 3 */
  let h=null;try{h=CQAUTO[f](m,r,t)}catch(_){}h=cqManual(f,m,r,t,h);return h?{h}:null}
window.cqPickup=(c,r)=>cqField("p",c,r);window.cqCall=(c,r)=>cqField("c",c,r);window.cqBase=(c,r)=>cqField("b",c,r);window.cqOnset=(c,r)=>cqField("o",c,r);
/* rules 1 and 2 for Kostüm / Maske in the callsheet (csMk) */
window.cqRowDone=(c,r)=>{if(!c||!c._date||!r)return false;const m=cqModel(c,r);return m.onStarted||m.baseDone};
/* tap: Kostüm/Maske/On set/by hand open → running → done → open; Call open ↔ arrived; Base running ↔ done */
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-cqk]");if(!b)return;e.preventDefault();e.stopPropagation();
  const k=b.dataset.cqk,id=b.dataset.cqid;if(k==="x"?!cqMan():k==="p"?!cqCanRide():!cmCan(k))return;b.disabled=true;
  try{const {F,db}=await fb();const ref=F.doc(db,"rideack",id);const st=k==="p"?(window.rideState?rideState(id):0):cmSt(id),cur=b.dataset.cqcur!=null?+b.dataset.cqcur:st,nx=k==="c"?(st?0:2):k==="b"?(st===2?0:2):(cur+1)%3;
    if(!nx){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const v={d:b.dataset.cqd,at:Date.now(),s:nx};await F.setDoc(ref,v);window.RIDEACK[id]=v}
    try{MEMO.clear()}catch(_){}cqKeep()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}},true);
/* Kostüm / Maske running: the duration counts down in minutes from the moment it was started (back to open = original duration again) */
const cqLeft=(at,min)=>Math.max(0,Math.ceil(min-(Date.now()-at)/60000));
window.cqCd=(id,d)=>{const x=window.RIDEACK&&window.RIDEACK[id],m=String(d||"").match(/(\d+)/);if(!x||!+x.at||!m)return"";const min=+m[1];
  return ' <span class="mkd cqcd" data-cqat="'+(+x.at)+'" data-cqmin="'+min+'" title="'+esc(L("Restzeit"))+'">'+cqLeft(+x.at,min)+'′</span>'};
setInterval(()=>{for(const s of document.querySelectorAll(".cqcd[data-cqat]")){const v=cqLeft(+s.dataset.cqat,+s.dataset.cqmin)+"′";if(s.textContent!==v)s.textContent=v}},20000);
