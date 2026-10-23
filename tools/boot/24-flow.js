/* ========== Ablauf: Fahrten und Cast auf einer Ebene ==========
   One store for every tick (rideack/{id}, id = check sum, no names: {d date, at ms, s 1 running / 2 done}), one way to write it,
   one tap handler – used by the rides (callsheet, Meine Termine, Fahrten Manager), the cast table and Kostüm / Maske in Meine Termine.
     1. store      FLOW (=window.RIDEACK), flowSt, flowAt, flowPut, live loading
     2. rights
     3. rides      three steps: 1 driver on site · 2 on the way (car) · 3 done
     4. cast       Kostüm / Maske entries, the rules of a cast row
     5. Meine Termine (Kostüm / Maske)
     6. taps, counters, redraw
   The cast rules (callsheet, cast table – the time itself is the tick; open = pink, underlined only where I can tick it ·
   running = pink box, white time · done = white):
   P/UP   tap 1 = driver on site (pink box, minutes waiting counting up) · tap 2 = on the way (car, planned driving time counting down) · tap 3 = open
          again – the same three steps as the ride in «Fahrten». Done (car gone) once Call is tapped, Kostüm or Maske starts or the ride is done.
   Call   one tap = arrived, active (the pickup ride counts as done) – done while Kostüm or Maske runs; active again between them (the actor
          waits); done once both are done.
   Kostüm / Maske   open → running (the duration counts down) → done; starting one finishes the other one of the same actor that still runs.
   Base   tapped while Kostüm / Maske still run: both done · running once Kostüm and Maske are done (minutes waiting for the pickup counting up) · tap = done: the ride Base → set is on the way,
          a car behind Base.
   On set one tap = done: the ride Base → set is done, the car is gone; every step is done, the cast number is pink.
   The rides run in parallel: what is ticked in «Fahrten» shows here, and what is ticked here shows in «Fahrten».
   Order: On set done → every step done · Base done → P/UP, Call, Kostüm, Maske done · Call done or Kostüm/Maske started → P/UP done.
   Rights: Kostüm «Kostüm quittieren» (wardrobe.ack), Maske «Maske quittieren» (makeup.ack), Call / Base / On set either of them or
   «Cast manuell quittieren» (cast.manual: also Base and On set before Kostüm and Maske are done); P/UP «Fahrten quittieren» or cast.manual.
   Everybody who sees the callsheet sees the states. */

/* ---------- 1. store ---------- */
window.RIDEACK=window.RIDEACK||{};
/* state of a tick: 0 open, 1 running, 2 done (old entries without s count as done) · when it was set (ms) */
const flowSt=id=>{const x=window.RIDEACK[id];return x?(x.s===1?1:2):0};
const flowAt=id=>{const x=window.RIDEACK[id];return x&&+x.at||0};
/* draw again and keep the open parts (sections, scenes) – scRender (27-scene-ack) does that, render alone closes them */
const flowRedraw=()=>(typeof scRender==="function"?scRender:render)();
/* write one tick (0 = open again: deleted – always, also when this device does not know it yet: another device may have set it);
   own writes are remembered for a moment so that a reload started before them does not undo them on the screen */
const FLOWMINE=new Map();
async function flowPut(id,date,s,n){if(!id)return;const {F,db}=await fb();const ref=F.doc(db,"rideack",id);
  if(!s){await F.deleteDoc(ref);delete window.RIDEACK[id];FLOWMINE.set(id,{t:Date.now(),v:null})}
  else{const v={d:date,at:Date.now(),s};if(n!=null)v.n=n;   /* n: how many of a group of extras are there */await F.setDoc(ref,v);window.RIDEACK[id]=v;FLOWMINE.set(id,{t:Date.now(),v})}}
/* the ticks live: a subscription on rideack (what someone taps shows on every device within a second) – from the first callsheet of the
   last 60 days on (ticks of past shooting days must not disappear); renewed when that day changes; without live updates (tests, old
   browser) every 2 minutes as before – there own taps win for a moment over an answer that was already on its way (live, Firestore
   shows own writes itself; keeping them would hide a newer tap of another device: found by tests/flow_multi.mjs). */
let RIDEAT=0,RIDEBUSY=false,ACKSUB=null,ACKFROM="";
const ackFrom=()=>{const t=todayISO(),lim=new Date(Date.now()-60*864e5).toISOString().slice(0,10);let from=t;for(const dp of (S.dispos||[]))if(dp&&dp.date&&dp.date<from&&dp.date>=lim)from=dp.date;return from};
function ackApply(m,t0,live){if(!live)for(const [id,w] of FLOWMINE){if(w.t>=t0-2000){if(w.v)m[id]=w.v;else delete m[id]}else FLOWMINE.delete(id)}
  const ch=JSON.stringify(m)!==JSON.stringify(window.RIDEACK);window.RIDEACK=m;if(ch&&(S.tab==="my"||S.tab==="today"||S.tab==="dispo"))flowRedraw()}
async function rideAckLoad(force){if(typeof ME==="undefined"||!ME)return;const from=ackFrom();if(ACKSUB&&ACKFROM===from)return;
  try{const {F,db}=await fb();const q=F.query(F.collection(db,"rideack"),F.where("d",">=",from));
    if(typeof F.onSnapshot==="function"){if(ACKSUB&&ACKFROM===from)return;if(typeof ACKSUB==="function")ACKSUB();ACKFROM=from;ACKSUB="…";
      ACKSUB=F.onSnapshot(q,snap=>{const t0=Date.now(),m={};(snap.docs||[]).forEach(x=>{m[x.id]=x.data()});ackApply(m,t0,true)},err=>{console.warn("rideack",err&&err.code||err);ACKSUB=null;ACKFROM=""});return}
    if(RIDEBUSY||(!force&&Date.now()-RIDEAT<120e3))return;RIDEBUSY=true;RIDEAT=Date.now();const t0=Date.now();
    const snap=await F.getDocs(q);const m={};snap.forEach(x=>{m[x.id]=x.data()});ackApply(m,t0)}catch(err){if(ACKSUB==="…")ACKSUB=null}RIDEBUSY=false}
/* after a tick: draw again without moving the page (the open parts and the scroll position stay) */
/* … and the tapped row (cast tile, table row, appointment) stays exactly where it was on the screen, even when parts above it grow or shrink */
const CQROW="#view .cs-card,#view tr,#view .mci";
function cqKeep(b){try{MEMO.clear()}catch(_){}const y=window.scrollY;let i=-1,top=0;
  try{const row=b&&b.isConnected&&b.closest(CQROW);if(row){i=[...document.querySelectorAll(CQROW)].indexOf(row);top=row.getBoundingClientRect().top}}catch(_){}
  flowRedraw();window.scrollTo(0,y);
  const fix=()=>{if(i<0)return window.scrollTo(0,y);const r=document.querySelectorAll(CQROW)[i];if(r){const d=r.getBoundingClientRect().top-top;if(Math.abs(d)>.5)window.scrollBy(0,d)}};
  fix();requestAnimationFrame(fix)}

/* ---------- 2. rights ---------- */
const flowCan=p=>{try{return typeof canPerm==="function"&&canPerm(p)}catch(_){return false}};
const cqCanRide=()=>flowCan("rides.confirm")||flowCan("rides.manage");
const cqMan=()=>flowCan("cast.manual");
/* Kostüm «Kostüm quittieren», Maske «Maske quittieren»; Call, Base and On set with either of them */
const cmCan=k=>k==="w"?flowCan("wardrobe.ack"):k==="m"?flowCan("makeup.ack"):flowCan("wardrobe.ack")||flowCan("makeup.ack");
/* who may tap in the cast table: u = P/UP, w/m = Kostüm/Maske, c/b/o = Call/Base/On set */
const cqCan=k=>k==="xo"?flowCan("extras.ack"):k==="u"?cqCanRide()||cqMan():k==="w"||k==="m"?cmCan(k):cmCan(k)||cqMan();

/* ---------- 3. rides ---------- */
/* state of a ride (0 open, 1 started, 2 done) – off when switched off in App-Verwaltung → Einstellungen */
window.rideState=id=>window.RIDEACKON===false?0:flowSt(id);
window.rideAt=flowAt;
const RIDE_ICO={1:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  2:'<svg viewBox="0 0 24 24" width="20" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12.5l4.5 4.5L16.5 7.5"/><path d="M11 16l1 1L21.5 7.5"/></svg>',
  car:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16V12l2-5h10l2 5v4"/><path d="M4 16h16v2H4z"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/><path d="M5 12h14"/><path class="rmove" d="M1 9h2M0.5 12h2"/></svg>',
  here:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>'};
window.RIDE_ICO=RIDE_ICO;
/* the three steps: stored as rideack/{id} (s 1 = on site or on the way, s 2 = done) and, while on the way, rideack/v{id} (s 1) –
   so the old state (0/1/2, rideState) still means open / running / done everywhere */
window.rideStep=id=>{const s=window.rideState(id);if(!s)return 0;if(s===2)return 3;return window.RIDEACK["v"+id]?2:1};
window.rideStepTip=n=>[L("Fahrt offen"),L("Fahrer vor Ort"),L("Fahrzeug unterwegs"),L("Fahrt abgeschlossen")][n];
window.rideStepIco=n=>n===1?RIDE_ICO.here:n===2?RIDE_ICO.car:n===3?RIDE_ICO[1]:"";
window.rideStepCls=n=>n===1?"rs1 rsh":n===2?"rs1":n===3?"rs2":"rs0";
window.rideSet=async(id,date,n)=>{await flowPut(id,date,n===3?2:n?1:0);await flowPut("v"+id,date,n===2?1:0)};
/* the button in Meine Termine (the driver confirms own rides) */
window.rideAckBtn=e=>{if(!e||!e.ride||!e.rid||e.noack||window.RIDEACKON===false)return"";
  const n=rideStep(e.rid),st=rideState(e.rid),can=e.drv||cqCanRide();
  const tip=[L("Fahrt offen – antippen = Fahrer vor Ort"),L("Fahrer vor Ort – antippen = Fahrzeug fährt los"),L("Fahrzeug unterwegs – antippen = Fahrt abgeschlossen"),L("Fahrt abgeschlossen – antippen = zurücksetzen")][n];
  if(!can)return n?'<span class="ridek rk'+st+(n===1?' rkh':'')+'" title="'+esc(rideStepTip(n))+'">'+rideStepIco(n)+'</span>':"";
  return '<button type="button" class="rideack rk'+st+(n===1?' rkh':'')+'" data-rideack="'+esc(e.rid)+'" data-rided="'+esc(e.date)+'"'+(e.drv?' data-rdrv="1"':'')+' aria-label="'+esc(tip)+'" title="'+esc(tip)+'">'+rideStepIco(n)+'</button>'};

/* ---------- 4. cast ---------- */
const CMK={w:"Kostüm",m:"Maske"};
/* the entries of one Kostüm / Maske cell («Marina 07:55 - 08:10 15’; Anna 08:10 - 08:30»): who (full name from the call list when the
   first name matches), start, end */
function cmParse(v,c){const out=[];for(const seg of String(v==null?"":v).split(/\s*;\s*/)){
    const m=seg.match(/^\s*(?:([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.' -]*?)\s+)?(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);if(!m)continue;
    let who="";if(m[1]){const fn=fold(m[1].trim().split(/\s+/)[0]);
      /* the person from the column head («Make Up - Marina»): the call with that first name – of Maske / Kostüm first when two people share it */
      const hits=arr(c&&c.calls).filter(r=>fold(String(r.name||"")).split(/\s+/)[0]===fn),dep=hits.find(r=>/make|mask|hair|haar|\bmu\b|kost|costum|wardrob|garder/.test(fold(String(r.role||"")+" "+String(r.dept||""))));
      who=String((dep||hits[0]||{}).name||"")||m[1].trim()}
    out.push({who,t:pad2(m[2])+":"+m[3],end:pad2(m[4])+":"+m[5]})}return out}
/* id of one cast tick: day, kind (w m u c b o), role of the cast row, time (no names in the id) */
/* a time from the callsheet: «07:50» or «07.50» (some callsheets write dots) */
const cqHm=v=>hm(String(v==null?"":v).replace(/(^|[^\d])(\d{1,2})\.(\d{2})(?!\d)/,"$1$2:$3"));
const cmId=(date,k,r,t)=>{t=cqHm(t)||t;const s=[date,k,String(r&&(r.no||r.role)||"").trim(),t].join("|").toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "m"+(h>>>0).toString(36)};
const cmSt=flowSt,cmDone=id=>flowSt(id)===2;
window.cmSt=cmSt;window.cmDone=cmDone;window.cmId=cmId;window.cmParse=cmParse;
/* texts of the three states */
const CQST=()=>[L("Offen"),L("Läuft"),L("Erledigt")];
const CQTIP3=()=>[L("Offen – antippen = läuft"),L("Läuft – antippen = erledigt"),L("Erledigt – antippen = zurücksetzen")];
const CQCAR='<svg class="cqcar" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-5l2-5h11l3 5h2v5h-2"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5M5 12h14"/></svg>';
/* a time that can not be tapped (x: extra classes) */
const cqSpan=(st,t,tip,x)=>'<span class="cql cq'+st+(x?" "+x:"")+' cqro" title="'+esc(tip)+'">'+esc(t)+'</span>';
/* a time to tap; o = {nx: next state (-1 = none), lk: ride id, ls: ride step after the tap, x: extra classes, a: extra attributes} */
const cqBtn=(st,k,id,date,t,tip,o)=>{o=o||{};return '<button type="button"'+(o.a||"")+' class="cql cq'+st+(o.x?" "+o.x:"")+'" data-cqk="'+k+'" data-cqid="'+esc(id)+'" data-cqd="'+esc(date)+'"'+
  (o.nx!=null?' data-cqnx="'+o.nx+'"':'')+(o.lk&&o.ls!=null?' data-cqlk="'+esc(o.lk)+'" data-cqls="'+o.ls+'"':'')+' title="'+esc(tip)+'" aria-label="'+esc(t+" – "+tip)+'">'+esc(t)+'</button>'};
const cqDone=(t,tip,x)=>cqSpan(2,t,tip,x);
/* Kostüm / Maske in the callsheet: open → running → done (data-cqwm: found again when the next Kostüm / Maske starts) */
window.cqLink=(kind,id,date,t)=>{const st=cmSt(id),wm=' data-cqwm="'+esc(id)+'"';
  return cqCan(kind)?cqBtn(st,kind,id,date,t,CQTIP3()[st],{a:wm}):cqSpan(st,t,CQST()[st]).replace('<span ','<span'+wm+' ')};
/* the rides of the callsheet for the actor (passenger): the pickup (at the pickup time if there are several) and the one from the Base */
const cqWho=r=>{const k=fold(String(r&&r.actor||"")).replace(/[^a-z ]/g,"").trim();return v=>!!k&&(fold(String(v||"")).includes(k)||k.split(" ").filter(w=>w.length>2).every(w=>fold(String(v||"")).includes(w)))};
const cqRides=(c,r)=>{if(!r||!r.actor||!c)return [];const has=cqWho(r);return arr(c.transport).filter(x=>has(x.passengers)).concat(arr(c.crewTransport).filter(x=>has(x.people)))};
const cqFromBase=x=>/base/i.test(String(x.from||""));
function cqRide(c,r){const rs=cqRides(c,r).filter(x=>!cqFromBase(x));if(!rs.length)return null;const t=cqHm(r.pickup);return rs.find(x=>cqHm(x.t1)===t)||rs[0]}
const cqBaseRide=(c,r)=>cqRides(c,r).find(cqFromBase)||null;
/* On set: its key is the planned time – or «set» when the callsheet has a word there instead of a time («on set») */
const cqOk=r=>cqHm(r&&r.onset)||(String(r&&r.onset||"").trim()?"set":"");
/* everything one row needs (ride steps 0 open · 1 on site · 2 on the way · 3 done) – read once per drawing:
   the same row is asked up to eight times (P/UP, Call, Base, On set, Kostüm, Maske, head numbers …) */
let CQMEMO=new WeakMap(),CQMEMOT=0;
function cqModel(c,r){const ack=window.RIDEACK,hit=CQMEMO.get(r);if(hit&&hit.c===c&&hit.d===c._date&&hit.ack===ack&&hit.on===window.RIDEACKON)return hit.m;
  if(!CQMEMOT)CQMEMOT=setTimeout(()=>{CQMEMO=new WeakMap();CQMEMOT=0},0);   /* the next drawing reads the ticks again */
  const d=c._date,st=(k,t)=>cqHm(t)?cmSt(cmId(d,k,r,cqHm(t))):0,rst=id=>id?rideStep(id):0,wmIds=[];let n=0,all=true,arrived=false,running=false,wmAt=0;
  for(const k of ["w","m"])for(const p of cmParse(k==="w"?r.wardrobe:r.makeup,c)){n++;const id=cmId(d,k,r,p.t),s=cmSt(id);wmIds.push(id);if(s>0)arrived=true;if(s===1)running=true;if(s!==2)all=false;else wmAt=Math.max(wmAt,flowAt(id))}
  const ok=typeof rideId==="function",ride=ok?cqRide(c,r):null,rid=ride?rideId(d,ride):"",rs=rst(rid),br=ok?cqBaseRide(c,r):null,bid=br?rideId(d,br):"",bs=rst(bid),oid=cmId(d,"o",r,cqOk(r));
  const m={d,st,wmIds,wmDone:n>0&&all,wmAt,arrived,running,ride,rid,rs,bid,bs,oid,pu:rid?rs:st("u",r.pickup),puAt:rid?flowAt(rid):flowAt(cmId(d,"u",r,cqHm(r.pickup))),puVAt:rid?flowAt("v"+rid):0,
    onDone:!!cqOk(r)&&(cmSt(oid)>0||bs===3),baseDone:st("b",r.base)===2,callAct:st("c",r.call)>0||rs===3};
  CQMEMO.set(r,{c,d,ack,on:window.RIDEACKON,m});return m}
/* minutes behind a time: counting up (waiting since …) or down (from the start of a planned duration) */
const cqLeft=(at,min)=>Math.max(0,Math.ceil(min-(Date.now()-at)/60000));
const cqDown=(at,min,tip)=>' <span class="mkd cqcd" data-cqat="'+at+'" data-cqmin="'+min+'" title="'+esc(tip)+'">'+cqLeft(at,min)+'′</span>';
const cqUp=(at,tip)=>at?' <span class="mkd cqcd" data-cqat="'+at+'" data-cqup="1" title="'+esc(tip)+'">'+Math.max(0,Math.floor((Date.now()-at)/60000))+'′</span>':"";
const cqClock=at=>{try{return new Date(at).toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Zurich"})}catch(_){return ""}};
const cqMin=x=>+x.slice(0,2)*60+ +x.slice(3);
/* P/UP: driver on site – minutes waiting; on the way – the planned driving time of the pickup ride counting down */
function cqDrive(m,cur){if(cur===1)return cqUp(m.puAt,L("Fahrer wartet seit"));if(cur!==2||!m.ride)return"";
  const a=cqHm(m.ride.t1),b=cqHm(m.ride.t2);if(!a||!b||!m.puVAt)return"";let min=cqMin(b)-cqMin(a);if(min<=0)min+=1440;if(min>600)return"";
  return cqDown(m.puVAt,min,L("Restzeit"))}
/* the rules of the four times (x: extra class of the field – cqpu: no tile frame for P/UP, cqon: On set stays coloured when the row is done) */
const CQRULE={
  /* P/UP: with a ride its three steps (also ticked in «Fahrten»), without a ride stored here */
  p(m,r,t,x){if(m.onDone||m.baseDone||m.callAct||m.arrived)return cqDone(t,L("Erledigt"),x);
    const cur=Math.min(2,m.pu),car=cqDrive(m,cur)+(cur===2?CQCAR:""),tips=[L("Offen – antippen = Fahrer vor Ort"),L("Fahrer vor Ort – antippen = Fahrzeug fährt los"),L("Fahrzeug unterwegs – antippen = zurücksetzen")];
    if(!cqCan("u"))return cqSpan(cur?1:0,t,tips[cur],x)+car;const nx=(cur+1)%3;
    return cqBtn(cur?1:0,"u",m.rid?"":cmId(m.d,"u",r,cqHm(t)),m.d,t,tips[cur],{nx,lk:m.rid,ls:nx,x})+car},
  /* Call: one tap = arrived (active) – the pickup ride is done (back: on the way again) */
  c(m,r,t){if(m.onDone||m.baseDone||m.wmDone)return cqDone(t,L("Erledigt"));if(m.running)return cqDone(t,L("Kostüm/Maske läuft"));
    if(m.arrived)return cqSpan(1,t,L("Wartet auf Kostüm/Maske"));   /* between Kostüm and Maske: Call active again – the actor waits */
    const cur=m.callAct?1:0,tip=cur?L("Angekommen – antippen = zurücksetzen"):L("Offen – antippen = angekommen");
    return cqCan("c")?cqBtn(cur,"c",cmId(m.d,"c",r,cqHm(t)),m.d,t,tip,{nx:cur?0:1,lk:m.rid,ls:cur?2:3}):cqSpan(cur,t,tip)},
  /* Base: done → the ride Base → set is on the way (car behind Base) */
  b(m,r,t){if(m.onDone)return cqDone(t,L("Erledigt"));
    if(!m.wmDone&&!m.baseDone){
      /* Kostüm / Maske started but not both done: tap Base = both done, the cast waits at the Base (Base active) */
      if(m.arrived){const tip=L("Antippen = Kostüm und Maske abschliessen, Cast wartet an der Base");return cqCan("b")?cqBtn(0,"b","",m.d,t,tip,{nx:-1,a:' data-wmfin="'+esc(m.wmIds.join(","))+'"'}):cqSpan(0,t,tip)}
      if(!cqMan())return null}
    const cur=m.baseDone?2:m.wmDone?1:0,car=(cur===1?cqUp(m.wmAt,L("Wartet auf die Abholung seit")):"")+(m.baseDone&&m.bid?CQCAR:""),tip=cur===2?L("Erledigt – antippen = zurücksetzen"):L("Läuft – antippen = erledigt");
    return (cqCan("b")?cqBtn(cur,"b",cmId(m.d,"b",r,cqHm(t)),m.d,t,tip,{nx:cur===2?0:2,lk:m.bid,ls:cur===2?0:2}):cqSpan(cur,t,tip))+car},
  /* On set: one tap = done – the ride Base → set is done, every step is done; done shows the time of the tick (or of the ride) */
  o(m,r,t,x){const cur=m.onDone?2:0,open=m.onDone||m.wmDone||m.baseDone||cqMan();
    if(cur){const at=flowAt(m.oid)||(m.bs===3?flowAt(m.bid):0);if(at)t=cqClock(at)||t}
    if(!open)return m.bs===1||m.bs===2?cqSpan(0,t,L("Fahrt zum Set angenommen"),x+" cqf").replace(" cq0 "," "):null;
    const tip=cur?L("Erledigt – antippen = zurücksetzen")+" · "+L("geplant")+" "+r.onset:L("Offen – antippen = erledigt");
    return cqCan("o")?cqBtn(cur,"o",m.oid,m.d,t,tip,{nx:cur?0:2,lk:m.bid,ls:cur?(m.baseDone?2:0):3,x}):cqSpan(cur,t,tip,x)}};
const CQF={p:"pickup",c:"call",b:"base",o:"onset"},CQX={p:"cqpu",o:"cqon"};
const cqRowOk=(c,r)=>!!(c&&c._date&&r);
function cqField(f,c,r){if(!cqRowOk(c,r))return null;const v=r[CQF[f]];if(f==="o"?!cqOk(r):!cqHm(v))return null;
  let h=null;try{h=CQRULE[f](cqModel(c,r),r,String(v),CQX[f])}catch(_){}return h?{h}:null}
window.cqPickup=(c,r)=>cqField("p",c,r);window.cqCall=(c,r)=>cqField("c",c,r);window.cqBase=(c,r)=>cqField("b",c,r);window.cqOnset=(c,r)=>cqField("o",c,r);
/* Kostüm / Maske in the callsheet (csMk): done once Base or On set is done */
window.cqRowDone=(c,r)=>{if(!cqRowOk(c,r))return false;const m=cqModel(c,r);return m.onDone||m.baseDone};
/* how far a cast row is: 3 On set · 2 waiting at the Base for the pickup (Base active) · 1 called (Call or later) · 0 not called yet */
window.cqStage=(c,r)=>{if(!cqRowOk(c,r))return 0;const m=cqModel(c,r);return m.onDone?3:m.wmDone&&!m.baseDone&&cqHm(r.base)?2:m.callAct||m.arrived||m.baseDone||m.wmDone?1:0};
/* for the cast chips of the shooting order and the schedule (display only):
   0 nothing yet · 1 P/UP (driver on site / on the way) · 2 Call, Kostüm or Maske ticked or running · 3 Base done or On set */
window.cqLook=(c,r)=>{if(!cqRowOk(c,r))return 0;const m=cqModel(c,r);return m.onDone||m.baseDone?3:m.callAct||m.arrived||m.wmDone?2:m.pu>0?1:0};
/* every step done (On set done): the cast number is pink */
window.cqAll=(c,r)=>cqRowOk(c,r)&&cqModel(c,r).onDone;
/* Kostüm / Maske running: the duration counts down from the start (back to open = the original duration again) */
window.cqCd=(id,d)=>{const at=flowAt(id),m=String(d||"").match(/(\d+)/);return at&&m&&window.RIDEACK[id]?cqDown(at,+m[1],L("Restzeit")):""};

/* ---------- 4b. extras (Komparsen): per group – Call with how many are there («3/5»), Kostüm / Maske like the cast, On set ---------- */
/* Call and On set: «Komparsen quittieren»; Kostüm / Maske: «Kostüm / Maske quittieren». Stored like the cast (rideack, live on every device) */
const xqCan=()=>flowCan("extras.ack");
const xqN=r=>{const n=parseInt(String(r&&r.count||"").trim(),10);return n>1&&n<1000?n:0};   /* 0 = no count: Call is a simple tick */
const xqId=(c,f,r,t)=>cmId(c._date,"x"+f,{no:"x|"+String(r.part||"").trim()+"|"+String(r.count||"").trim()},t);
function xqModel(c,r){const t={c:cqHm(r.call),w:cqHm(r.wardrobe),m:cqHm(r.makeup),o:cqHm(r.onset)||(String(r.onset||"").trim()?"set":"")},id={};
  for(const f in t)if(t[f])id[f]=xqId(c,f,r,t[f]);return {t,id,on:!!id.o&&flowSt(id.o)===2}}
/* the group is On set: the row greys, the On set time stays (like the cast) */
window.xqAll=(c,r)=>cqRowOk(c,r)&&xqModel(c,r).on;
window.xqField=(f,c,r)=>{if(!cqRowOk(c,r))return null;const m=xqModel(c,r),t=m.t[f],id=m.id[f];if(!t)return null;
  const d=c._date,st=flowSt(id),src={c:r.call,w:r.wardrobe,m:r.makeup,o:r.onset}[f],tx=t==="set"?String(src).trim():t;
  if(f==="w"||f==="m")return {h:cqLink(f,id,d,tx)};
  if(f==="c"){const N=xqN(r),n=st===1?Math.min(N,+(window.RIDEACK[id]||{}).n||0):0,lab=st===1&&N?tx+" · "+n+"/"+N:tx;
    const tip=st===2?L("Alle da"):st===1?L("{n} von {N} da").replace("{n}",n).replace("{N}",N):L("Offen");
    if(!xqCan())return {h:cqSpan(st,lab,tip)};
    return {h:'<button type="button" class="cql cq'+st+'" data-xqc="'+esc(id)+'" data-xqd="'+esc(d)+'" data-xqn="'+N+'" title="'+esc(tip+" – "+L("antippen zum Ändern"))+'" aria-label="'+esc(lab+" – "+tip)+'">'+esc(lab)+'</button>'}}
  const on=st===2,at=on?flowAt(id):0,lab=at?cqClock(at)||tx:tx,tip=on?L("Erledigt – antippen = zurücksetzen")+" · "+L("geplant")+" "+src:L("Offen – antippen = erledigt");
  return {h:xqCan()?cqBtn(on?2:0,"xo",id,d,lab,tip,{nx:on?0:2,x:"cqon"}):cqSpan(on?2:0,lab,tip,"cqon")}};
/* Call of a group: «Wie viele sind da?» – 1 … N-1, «Alle N», back to open; without a count one tap = all there (again = open) */
async function xqPick(b){const id=b.dataset.xqc,d=b.dataset.xqd,N=+b.dataset.xqn||0,st=flowSt(id);
  if(!N){await flowPut(id,d,st?0:2);cqKeep(b);return}
  const cur=st===2?N:st===1?(+(window.RIDEACK[id]||{}).n||0):0;
  const btn=(k,t)=>'<button type="button" class="pillbtn'+(k===cur?' on':'')+'" data-xqv="'+k+'">'+esc(t)+'</button>';
  const dl=mkDialog("xqpick",'<div class="a2box xqbox"><h3>'+esc(L("Wie viele sind da?"))+'</h3><div class="xqn">'+Array.from({length:N-1},(_,i)=>btn(i+1,String(i+1))).join("")+btn(N,L("Alle")+" "+N)+'</div>'+
    '<div class="a2b">'+(st?'<button type="button" class="lnk" data-xqv="0">'+esc(L("Zurücksetzen"))+'</button>':'')+'<button type="button" class="lnk" data-xqv="-1">'+esc(L("Abbrechen"))+'</button></div></div>',{replace:true});
  dl.addEventListener("click",async e=>{const x=e.target.closest("[data-xqv]");if(!x&&e.target!==dl)return;const v=x?+x.dataset.xqv:-1;dl.remove();if(v<0||v===cur)return;
    try{await flowPut(id,d,v>=N?2:v?1:0,v>0&&v<N?v:null);cqKeep(b)}catch(err){showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}});
  document.body.appendChild(dl);const f=dl.querySelector(".on,[data-xqv]");if(f)f.focus()}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-xqc]");if(!b)return;e.preventDefault();e.stopPropagation();if(!xqCan())return;
  xqPick(b).catch(err=>showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000))},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const d=document.getElementById("xqpick");if(d){e.preventDefault();d.remove()}}});
/* ---------- 5. Meine Termine: Kostüm / Maske as appointments (for the person named in the column head and for the actor) ---------- */
window.cmEvents=(me,t)=>{const out=[];let cm=null;try{cm=typeof csMe==="function"?csMe():null}catch(_){}if(!cm)return out;
  for(const dp of arr(S.dispos)){if(!dp||!dp.cs||dp.date<t)continue;const c=dp.cs,d=arr(S.days).find(x=>x.date===dp.date)||{};
    let where="",map="";try{const ls=typeof csLocs==="function"?csLocs(c):[];const b=ls.find(l=>arr(l.kinds).some(k=>/^W \/ H \/ M/.test(k)))||ls.find(l=>arr(l.kinds).includes("Base"));if(b){where=b.name||"";map=b.map||""}}catch(_){}
    for(const r of arr(c.cast))for(const k of ["w","m"]){const v=k==="w"?r.wardrobe:r.makeup;
      for(const p of cmParse(v,c)){const mine=p.who&&cm.hit(p.who),actor=r.actor&&cm.hit(r.actor);if(!mine&&!actor)continue;
        const oth=["w","m"].flatMap(k2=>cmParse(k2==="w"?r.wardrobe:r.makeup,c).map(q=>cmId(dp.date,k2,r,q.t)));   /* the other Kostüm / Maske of this actor */
        out.push({cmo:oth,date:dp.date,t:p.t,end:p.end,n:L(CMK[k])+": "+(mine?[r.role,r.actor&&"("+r.actor+")"].filter(Boolean).join(" "):[r.role,p.who&&L("bei")+" "+p.who].filter(Boolean).join(" · ")),
          where,map,src:"Callsheet",go:d.id||dp.date,cm:cmId(dp.date,k,r,p.t),cmk:k})}}}
  return out};
/* the mark of one entry: the same three steps as in the callsheet – open → running (pink) → done (check) → open */
window.cmBtn=(id,date,label,k,oth)=>{const st=cmSt(id),cls="cmk"+(st===2?" cmok":st===1?" cmrun":""),ico=st===2?RIDE_ICO[1]:'<span class="cmc"></span>';
  if(!cmCan(k))return st?'<span class="'+cls+'" title="'+esc([L("Offen"),L("Läuft"),L("Erledigt")][st])+'">'+ico+'</span>':"";
  const tip=CQTIP3()[st];
  return '<button type="button" class="'+cls+'" data-cmack="'+esc(id)+'" data-cmd="'+esc(date)+'" data-cmk="'+esc(k||"")+'"'+(oth&&oth.length?' data-cmoth="'+esc(oth.join(","))+'"':'')+' aria-label="'+esc((label?label+" – ":"")+tip)+'" title="'+esc(tip)+'">'+ico+'</button>'};

/* ---------- 6. taps (one handler for rides, cast and Meine Termine), counters, redraw ---------- */
async function flowTap(b){
  if(b.dataset.rideack!=null){const id=b.dataset.rideack;if(!cqCanRide()&&!b.dataset.rdrv)return;   /* the driver confirms own rides */
    await rideSet(id,b.dataset.rided,(rideStep(id)+1)%4);return}   /* open → driver on site → on the way → done → open */
  if(b.dataset.cmack!=null){if(!cmCan(b.dataset.cmk))return;const id=b.dataset.cmack,nx=(cmSt(id)+1)%3;await flowPut(id,b.dataset.cmd,nx);
    if(nx===1)for(const o of String(b.dataset.cmoth||"").split(",")){if(o&&o!==id&&cmSt(o)===1)await flowPut(o,b.dataset.cmd,2)}   /* the other one still running is done now */
    return}
  const k=b.dataset.cqk,id=b.dataset.cqid,date=b.dataset.cqd;if(!cqCan(k))return;
  const nx=b.dataset.cqnx!=null?+b.dataset.cqnx:(cmSt(id)+1)%3;if(nx>=0)await flowPut(id,date,nx);
  for(const o of String(b.dataset.wmfin||"").split(","))if(o&&cmSt(o)!==2)await flowPut(o,date,2);   /* Base tapped early: Kostüm and Maske done */
  /* Kostüm or Maske starts: a Kostüm / Maske of the same actor still running is done now */
  if((k==="w"||k==="m")&&nx===1){const row=b.closest("tr,.cs-card");if(row)for(const o of row.querySelectorAll(".cq1[data-cqwm]")){const oid=o.dataset.cqwm;if(oid&&oid!==id&&cmSt(oid)===1)await flowPut(oid,date,2)}}
  if(b.dataset.cqlk&&b.dataset.cqls!=null)await rideSet(b.dataset.cqlk,date,+b.dataset.cqls)}   /* the ride in «Fahrten» in parallel */
const flowClick=async(e,sel,stop)=>{const b=e.target.closest&&e.target.closest(sel);if(!b)return;e.preventDefault();if(stop)e.stopPropagation();b.disabled=true;
  try{await flowTap(b);cqKeep(b)}catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:L("Speichern nicht möglich."),4000)}};
/* cast and Meine Termine first (capture); rides after the Fahrten Manager pop-up (25-ride-edit) had its chance */
document.addEventListener("click",e=>flowClick(e,"[data-cqk],[data-cmack]",true),true);
document.addEventListener("click",e=>flowClick(e,"[data-rideack]",false));
/* minutes counting up / down (every 20 s) */
setInterval(()=>{for(const s of document.querySelectorAll(".cqcd[data-cqat]")){const v=(s.dataset.cqup?Math.max(0,Math.floor((Date.now()-s.dataset.cqat)/60000)):cqLeft(+s.dataset.cqat,+s.dataset.cqmin))+"′";if(s.textContent!==v)s.textContent=v}},20000);
/* load when «Meine Termine», Today or the callsheet is shown (at most every 2 minutes) */
document.addEventListener("click",e=>{if(e.target.closest('[data-tab="my"],[data-tab="today"],[data-tab="dispo"],[data-tomy]'))setTimeout(()=>rideAckLoad(false),50)});
setTimeout(()=>rideAckLoad(true),4000);setInterval(()=>{if(ACKSUB||S.tab==="my"||S.tab==="today"||S.tab==="dispo")rideAckLoad(false)},30e3);   /* live: only checks the start day / a lost subscription */
document.addEventListener("click",e=>{if(!e.target.closest("[data-ridedone]"))return;e.preventDefault();window.SHOWDONE=!window.SHOWDONE;render()});
/* the callsheet greys a ride 20 minutes after it was done – and follows «jetzt hier» and «Jetzt» in my day: draw again when one changes */
{let OLDN=-1;setInterval(()=>{if(S.tab!=="dispo")return;const n=Object.values(window.RIDEACK||{}).filter(x=>x&&x.s!==1&&Date.now()-(+x.at||0)>20*60e3).length;let nk=null;try{const C=typeof CSCUR!=="undefined"&&CSCUR.c;if(C&&window.CSNOWK!=null){const l=csNowLoc(C,CSCUR.date,csLocs(C));nk=l?l.no+'|'+l.name:''}}catch(_){}
  /* «Jetzt» of the day that is shown (not of today – else a callsheet of another day was redrawn every minute) */
  let ns=null;try{if(window.CSNOWSC!=null&&typeof csNowScene==="function"&&typeof CSCUR!=="undefined"){const dx=(S.dispos||[]).find(y=>y&&y.date===CSCUR.date),r=dx?csNowScene(dx):null;ns=r?(r.ev||String(r.sc)):""}}catch(_){}
  if((OLDN>=0&&n!==OLDN)||(nk!=null&&nk!==window.CSNOWK)||(ns!=null&&ns!==window.CSNOWSC))flowRedraw();OLDN=n},60e3)}
/* links inside clickable callsheet headers (L-codes, addresses): open the link without toggling or triggering the surrounding element */
document.addEventListener("click",e=>{const a=e.target&&e.target.closest&&e.target.closest("a[data-nobub]");if(a)e.stopPropagation()},true);
/* cast tiles (phone): a tile whose cast is On set is folded to one line – a tap opens it again; the choice stays while the page is redrawn */
window.CASTOPEN=window.CASTOPEN||new Set();
const castKey=c=>{const t=c.querySelector(".cs-ct"),sec=c.closest("[id]");return (typeof CSCUR!=="undefined"&&CSCUR.date||"")+"|"+(sec?sec.id:"")+"|"+(t?t.textContent.trim():"")};
document.addEventListener("click",e=>{const c=e.target.closest&&e.target.closest(":is(#cs-cast,#cs-extras) .cs-card");if(!c||!c.querySelector(".cqall")||e.target.closest("a,button,input,select"))return;
  const k=castKey(c),on=!c.classList.contains("csopen");c.classList.toggle("csopen",on);if(on)CASTOPEN.add(k);else CASTOPEN.delete(k)});
csAfter(()=>{if(!CASTOPEN.size)return;document.querySelectorAll(":is(#cs-cast,#cs-extras) .cs-card").forEach(c=>{if(c.querySelector(".cqall")&&CASTOPEN.has(castKey(c)))c.classList.add("csopen")})});
