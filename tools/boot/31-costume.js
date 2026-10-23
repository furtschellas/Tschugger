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
   P/UP   tap 1 = driver on site (pink box, minutes waiting counting up) · tap 2 = on the way (car, planned driving time counting down) · tap 3 = open again
          – the same three steps as the ride in «Fahrten».
          Done (car gone) once Call is tapped, Kostüm or Maske starts or the ride is done.
   Call   one tap = arrived, active (the pickup ride counts as done) – done while Kostüm or Maske runs; active again between them (the actor waits);
          done once both are done.
   Kostüm / Maske starting finishes a Kostüm / Maske of the same actor that is still running.
   Kostüm / Maske   open → running (the duration counts down) → done.
   Base   running once Kostüm and Maske are done (minutes waiting for the pickup counting up) · tap = done: the ride Base → set counts as accepted, a car behind Base.
   On set one tap = done: the ride Base → set counts as done, the car is gone; every step is done, the cast number is pink.
   The rides run in parallel: what is ticked in «Fahrten» shows here, and what is ticked here shows in «Fahrten».
   The order of the rules: On set done → every step done · Base done → P/UP, Call, Kostüm, Maske done ·
   Call done or Kostüm/Maske started → P/UP done (Kostüm/Maske started: Call too).
   Rights: Kostüm «Kostüm quittieren» (wardrobe.ack), Maske «Maske quittieren» (makeup.ack), Call / Base / On set either of them or
   «Cast manuell quittieren» (cast.manual: also Base and On set before Kostüm and Maske are done); P/UP «Fahrten quittieren» or cast.manual.
   Everybody who sees the callsheet sees the states. ---------- */
const cqCanRide=()=>{try{return canPerm("rides.confirm")||canPerm("rides.manage")}catch(_){return false}};
const cqMan=()=>{try{return typeof canPerm==="function"&&canPerm("cast.manual")}catch(_){return false}};
const cqCan=k=>k==="u"?cqCanRide()||cqMan():k==="w"||k==="m"?cmCan(k):cmCan(k)||cqMan();
const CQTIP3=()=>[L("Offen – antippen = läuft"),L("Läuft – antippen = erledigt"),L("Erledigt – antippen = zurücksetzen")];
const CQCAR='<svg class="cqcar" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-5l2-5h11l3 5h2v5h-2"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5M5 12h14"/></svg>';
const cqSpan=(st,t,tip,x)=>'<span class="cql cq'+st+(x?" "+x:"")+' cqro" title="'+esc(tip)+'">'+esc(t)+'</span>';
/* a tap button; o = {nx: next state, lk: ride id, ls: ride state after the tap (0 = open again)} */
const cqBtn=(st,k,id,date,t,tip,o)=>{o=o||{};return '<button type="button" class="cql cq'+st+'" data-cqk="'+k+'" data-cqid="'+esc(id)+'" data-cqd="'+esc(date)+'"'+
  (o.nx!=null?' data-cqnx="'+o.nx+'"':'')+(o.lk&&o.ls!=null?' data-cqlk="'+esc(o.lk)+'" data-cqls="'+o.ls+'"':'')+' title="'+esc(tip)+'" aria-label="'+esc(t+" – "+tip)+'">'+esc(t)+'</button>'};
const cqDone=(t,tip)=>cqSpan(2,t,tip);
/* Kostüm / Maske in the callsheet: open → running → done */
window.cqLink=(kind,id,date,t)=>{const st=cmSt(id),wm=' data-cqwm="'+esc(id)+'"';   /* cqwm: found again when the next Kostüm / Maske starts */
  if(!cqCan(kind))return cqSpan(st,t,[L("Offen"),L("Läuft"),L("Erledigt")][st]).replace('<span ','<span'+wm+' ');return cqBtn(st,kind,id,date,t,CQTIP3()[st]).replace('<button ','<button'+wm+' ')};
/* the rides of the callsheet for the actor (passenger): the pickup (at the pickup time if there are several) and the one from the Base */
const cqWho=r=>{const k=fold(String(r&&r.actor||"")).replace(/[^a-z ]/g,"").trim();return v=>!!k&&(fold(String(v||"")).includes(k)||k.split(" ").filter(w=>w.length>2).every(w=>fold(String(v||"")).includes(w)))};
const cqRides=(c,r)=>{if(!r||!r.actor||!c)return [];const has=cqWho(r);return arr(c.transport).filter(x=>has(x.passengers)).concat(arr(c.crewTransport).filter(x=>has(x.people)))};
function cqRide(c,r){const rs=cqRides(c,r).filter(x=>!/base/i.test(String(x.from||"")));if(!rs.length)return null;const t=hm(r.pickup);return rs.find(x=>hm(x.t1)===t)||rs[0]}
const cqBaseRide=(c,r)=>cqRides(c,r).find(x=>/base/i.test(String(x.from||"")))||null;
/* everything one row needs, read once */
function cqModel(c,r){const d=c._date,st=(k,t)=>hm(t)?cmSt(cmId(d,k,r,hm(t))):0,rst=id=>id&&window.rideStep?rideStep(id):0;   /* ride steps 0 open · 1 on site · 2 on the way · 3 done */let n=0,all=true,arrived=false,running=false,wmAt=0;
  for(const k of ["w","m"])for(const p of cmParse(k==="w"?r.wardrobe:r.makeup,c)){n++;const id=cmId(d,k,r,p.t),s=cmSt(id);if(s>0)arrived=true;if(s===1)running=true;if(s!==2)all=false;else wmAt=Math.max(wmAt,+((window.RIDEACK[id]||{}).at)||0)}
  const ok=typeof rideId==="function",ride=ok?cqRide(c,r):null,rid=ride?rideId(d,ride):"",rs=rst(rid),br=ok?cqBaseRide(c,r):null,bid=br?rideId(d,br):"",bs=rst(bid);
  const onDone=!!hm(r.onset)&&(st("o",r.onset)>0||st("xo",r.onset)>0||bs===3),baseDone=st("b",r.base)===2||st("xb",r.base)===2;
  const at=id=>+((window.RIDEACK[id]||{}).at)||0;
  return {d,st,wmDone:n>0&&all,wmAt,arrived,running,ride,rid,rs,bid,bs,pu:rid?rs:st("u",r.pickup),puAt:rid?at(rid):at(cmId(d,"u",r,hm(r.pickup))),puVAt:rid?at("v"+rid):0,onDone,baseDone,
    callAct:st("c",r.call)>0||st("xc",r.call)>0||rs===3,puDone:st("xp",r.pickup)===2}}
const CQF={p:"pickup",c:"call",b:"base",o:"onset"};
/* P/UP: the planned driving time of the pickup ride behind the time – driver on site: the minutes; on the way: counting down from the start */
/* minutes behind a time: counting up (waiting since …) or down (planned driving time of the pickup ride, from the start) */
const cqUp=(at,tip)=>at?' <span class="mkd cqcd" data-cqat="'+at+'" data-cqup="1" title="'+esc(tip)+'">'+Math.max(0,Math.floor((Date.now()-at)/60000))+'′</span>':"";
function cqDrive(m,cur){if(cur===1)return cqUp(m.puAt,L("Fahrer wartet seit"));if(cur!==2||!m.ride)return"";
  const a=hm(m.ride.t1),b=hm(m.ride.t2);if(!a||!b||!m.puVAt)return"";const toM=x=>+x.slice(0,2)*60+ +x.slice(3);let min=toM(b)-toM(a);if(min<=0)min+=1440;if(min>600)return"";
  return ' <span class="mkd cqcd" data-cqat="'+m.puVAt+'" data-cqmin="'+min+'" title="'+esc(L("Restzeit"))+'">'+cqLeft(m.puVAt,min)+'′</span>'}
const CQRULE={
  /* P/UP: with a ride its three steps (also ticked in «Fahrten»), without a ride stored here */
  p(m,r,t){if(m.onDone||m.baseDone||m.callAct||m.arrived||m.puDone)return cqDone(t,L("Erledigt"));
    const cur=Math.min(2,m.pu),car=(cur===2?CQCAR:"")+cqDrive(m,cur),tips=[L("Offen – antippen = Fahrer vor Ort"),L("Fahrer vor Ort – antippen = Fahrzeug fährt los"),L("Fahrzeug unterwegs – antippen = zurücksetzen")];
    if(!cqCan("u"))return cqSpan(cur?1:0,t,tips[cur])+car;const nx=(cur+1)%3;
    return cqBtn(cur?1:0,"u",m.rid?"":cmId(m.d,"u",r,hm(t)),m.d,t,tips[cur],{nx,lk:m.rid,ls:nx})+car},
  /* Call: one tap = arrived (active, pink box) – the pickup ride is done (back: on the way again); done once Kostüm or Maske starts */
  c(m,r,t){if(m.onDone||m.baseDone||m.wmDone)return cqDone(t,L("Erledigt"));if(m.running)return cqDone(t,L("Kostüm/Maske läuft"));
    const cur=m.callAct||m.arrived?1:0;   /* between Kostüm and Maske (none running, not both done): Call active again – the actor waits */
    if(m.arrived)return cqSpan(1,t,L("Wartet auf Kostüm/Maske"));const tip=cur?L("Angekommen – antippen = zurücksetzen"):L("Offen – antippen = angekommen");
    if(!cqCan("c"))return cqSpan(cur,t,tip);return cqBtn(cur,"c",cmId(m.d,"c",r,hm(t)),m.d,t,tip,{nx:cur?0:1,lk:m.rid,ls:cur?2:3})},
  /* Base: done → the ride Base → set is on the way (car behind Base) */
  b(m,r,t){if(m.onDone)return cqDone(t,L("Erledigt"));if(!m.wmDone&&!m.baseDone&&!cqMan())return null;
    const cur=m.baseDone?2:m.wmDone?1:0,car=(m.baseDone&&m.bid?CQCAR:"")+(cur===1?cqUp(m.wmAt,L("Wartet auf die Abholung seit")):""),tip=cur===2?L("Erledigt – antippen = zurücksetzen"):L("Läuft – antippen = erledigt");
    if(!cqCan("b"))return cqSpan(cur,t,tip)+car;
    return cqBtn(cur,"b",cmId(m.d,"b",r,hm(t)),m.d,t,tip,{nx:cur===2?0:2,lk:m.bid,ls:cur===2?0:2})+car},
  /* On set: one tap = done – the ride Base → set is done, every step is done */
  o(m,r,t){const cur=m.onDone?2:0,open=m.onDone||m.wmDone||m.baseDone||cqMan();
    if(!open)return m.bs===1||m.bs===2?'<span class="cql cqf cqro" title="'+esc(L("Fahrt zum Set angenommen"))+'">'+esc(t)+'</span>':null;
    const tip=cur?L("Erledigt – antippen = zurücksetzen"):L("Offen – antippen = erledigt");if(!cqCan("o"))return cqSpan(cur,t,tip);
    return cqBtn(cur,"o",cmId(m.d,"o",r,hm(t)),m.d,t,tip,{nx:cur?0:2,lk:m.bid,ls:cur?(m.baseDone?2:0):3})}};
function cqField(f,c,r){if(!c||!c._date||!r)return null;const v=r[CQF[f]];if(!hm(v))return null;let h=null;try{h=CQRULE[f](cqModel(c,r),r,String(v))}catch(_){}if(h&&f==="o")h=h.replace('class="cql ','class="cql cqon ');return h?{h}:null}   /* cqon: On set stays coloured when the row is done */
window.cqPickup=(c,r)=>cqField("p",c,r);window.cqCall=(c,r)=>cqField("c",c,r);window.cqBase=(c,r)=>cqField("b",c,r);window.cqOnset=(c,r)=>cqField("o",c,r);
/* Kostüm / Maske in the callsheet (csMk): done once Base or On set is done */
window.cqRowDone=(c,r)=>{if(!c||!c._date||!r)return false;const m=cqModel(c,r);return m.onDone||m.baseDone};
/* every step done (On set done): the cast number is pink */
window.cqAll=(c,r)=>{if(!c||!c._date||!r)return false;return cqModel(c,r).onDone};
/* tap: own state (data-cqnx, else open → running → done), and the linked ride in parallel (data-cqlk = ride, data-cqls = its step) */
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-cqk]");if(!b)return;e.preventDefault();e.stopPropagation();
  const k=b.dataset.cqk,id=b.dataset.cqid;if(!cqCan(k))return;b.disabled=true;
  const put=async(F,db,id,s)=>{const ref=F.doc(db,"rideack",id);if(!s){await F.deleteDoc(ref);delete window.RIDEACK[id]}else{const v={d:b.dataset.cqd,at:Date.now(),s};await F.setDoc(ref,v);window.RIDEACK[id]=v}};
  try{const {F,db}=await fb();const nx=b.dataset.cqnx!=null?+b.dataset.cqnx:(cmSt(id)+1)%3;if(id)await put(F,db,id,nx);
    /* Kostüm or Maske starts: a Kostüm / Maske of the same actor still running is done now */
    if((k==="w"||k==="m")&&nx===1){const row=b.closest("tr,.cs-card");if(row)for(const o of row.querySelectorAll(".cq1[data-cqwm]")){const oid=o.dataset.cqwm;if(oid&&oid!==id&&cmSt(oid)===1)await put(F,db,oid,2)}}
    if(b.dataset.cqlk&&b.dataset.cqls!=null&&window.rideSet)await rideSet(b.dataset.cqlk,b.dataset.cqd,+b.dataset.cqls);   /* the ride in «Fahrten» in parallel */
    try{MEMO.clear()}catch(_){}cqKeep()}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}},true);
/* Kostüm / Maske running: the duration counts down in minutes from the moment it was started (back to open = original duration again) */
const cqLeft=(at,min)=>Math.max(0,Math.ceil(min-(Date.now()-at)/60000));
window.cqCd=(id,d)=>{const x=window.RIDEACK&&window.RIDEACK[id],m=String(d||"").match(/(\d+)/);if(!x||!+x.at||!m)return"";const min=+m[1];
  return ' <span class="mkd cqcd" data-cqat="'+(+x.at)+'" data-cqmin="'+min+'" title="'+esc(L("Restzeit"))+'">'+cqLeft(+x.at,min)+'′</span>'};
setInterval(()=>{for(const s of document.querySelectorAll(".cqcd[data-cqat]")){const v=(s.dataset.cqup?Math.max(0,Math.floor((Date.now()-s.dataset.cqat)/60000)):cqLeft(+s.dataset.cqat,+s.dataset.cqmin))+"′";if(s.textContent!==v)s.textContent=v}},20000);
