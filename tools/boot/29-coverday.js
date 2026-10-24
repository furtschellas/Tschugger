/* ---------- Coverday Management (App-Verwaltung → «Coverday», permission «Coverday verwalten»): whole shooting days swapped, moved
   or moved on by one shooting day (weather) – for all units or the 2nd unit only. The changes are stored encrypted in coverday/state
   and laid over the Drehplan in the app. A newer Drehplan has priority: the changes then wait for a decision («zu prüfen»),
   with a proposal per change (already in the new Drehplan → remove; different → apply again or remove) ---------- */
window.CDOPS=window.CDOPS||[];let CDSUB=null;const CD={form:{op:"swap",u:"all",a:"",b:"",push:true},busy:false,msg:""};
const cdCan=()=>{try{return isOwner()||isAdmin()||can("coverday.manage")}catch(_){return false}};
/* fields that stay with the date (sun, order) – everything else is the content of the day and moves */
const CDKEEP=new Set(["date","id","sr","ss","order"]);
const cdDD=d=>String(d||"").split("-").reverse().slice(0,2).join(".")+".";
const cdSched=()=>{let m="";for(const s of arr(S.meta&&S.meta.sources))if(s&&s.kind==="schedule"&&String(s.modified||"")>m)m=String(s.modified||"");return m?Date.parse(m)||0:0};
/* a change made before the newest Drehplan was read: the Drehplan has priority, the change waits for a decision */
/* the scenes of the days of a change in the Drehplan as read (to see later whether a new Drehplan changed exactly these days) */
const cdRaw=(op,days)=>{const d=dt=>days.find(x=>x.date===dt);return op.op==="shift"?{l:cdShootDates(days,op.u,op.a).map(dt=>dt+"="+cdScenes(d(dt),op.u)).join("|")}:{a:cdScenes(d(op.a),op.u),b:cdScenes(d(op.b),op.u)}};
/* a newer Drehplan has priority – but only when it changed the days of this change; otherwise the change stays active */
const cdReview=op=>{const t=cdSched();if(!(t&&t>(+op.at||0)))return false;if(!S.days0)return true;const now=cdRaw(op,S.days0),r=op.raw;
  /* changes from before (without «raw»): the scenes saved with the change */
  if(!r){const sn=op.snap;if(!sn||!sn.a)return true;const d=dt=>S.days0.find(x=>x.date===dt);return op.op==="shift"?cdScenes(d(op.a),op.u)!==sn.a:(cdScenes(d(op.a),op.u)!==sn.a||cdScenes(d(op.b),op.u)!==(sn.b||""))}
  return op.op==="shift"?now.l!==r.l:(now.a!==r.a||now.b!==r.b)};
const cdActive=()=>arr(window.CDOPS).filter(o=>o&&o.st!=="off"&&!cdReview(o)).sort((a,b)=>(+a.at||0)-(+b.at||0));
const cdContent=d=>{const o={};for(const k in d)if(!CDKEEP.has(k))o[k]=d[k];return o};
const cdScenes=(d,u)=>d?arr(u==="2"?(d.unit2||{}).items:d.items).filter(i=>i&&i.sc).map(i=>norm(i.sc)).join(","):"";
const cdShootDates=(days,u,from)=>days.filter(d=>d.date>=from&&(u==="2"?arr((d.unit2||{}).items).some(i=>i&&i.sc):d.kind==="shoot")).map(d=>d.date).sort();
/* the next date for «Nachrücken»: after the last shooting day, not on a weekend */
function cdNextSlot(after){const x=new Date(after+"T12:00:00");do{x.setDate(x.getDate()+1)}while(x.getDay()===0||x.getDay()===6);return x.toISOString().slice(0,10)}
/* the Drehplan with the changes laid over it (the original stays in S.days0) */
function cdTransform(days0){const ops=cdActive();if(!ops.length)return cdChrono(days0);
  const days=days0.map(d=>Object.assign({},d,d.kind==="shoot"?{cdSrc:d.date}:{})),get=dt=>{let d=days.find(x=>x.date===dt);if(!d){d={date:dt,id:dt,kind:"off",label:"Day Off"};days.push(d)}return d};
  const note=(d,t)=>{d.notes=[t].concat(arr(d.notes));for(const l of ["en","fr","it"])if(d["notes_"+l])d["notes_"+l]=[t].concat(arr(d["notes_"+l]))};
  const empty=d=>{for(const k of Object.keys(d))if(!CDKEEP.has(k))delete d[k];d.kind="off";d.label="Cover"};
  for(const op of ops){try{
    if(op.op==="swap"){const a=get(op.a),b=get(op.b);
      if(op.u==="2"){const t=a.unit2;if(b.unit2)a.unit2=b.unit2;else delete a.unit2;if(t)b.unit2=t;else delete b.unit2}
      else{const ca=cdContent(a),cb=cdContent(b);empty(a);empty(b);Object.assign(a,cb);Object.assign(b,ca)}
      note(a,"⇄ "+L("Coverday: getauscht mit")+" "+cdDD(op.b));note(b,"⇄ "+L("Coverday: getauscht mit")+" "+cdDD(op.a))}
    else if(op.op==="move"){const a=get(op.a),b=get(op.b);
      if(op.u==="2"){if(a.unit2){b.unit2=a.unit2;delete a.unit2}}else{const ca=cdContent(a);empty(b);Object.assign(b,ca);empty(a)}
      note(b,"→ "+L("Coverday: verschoben vom")+" "+cdDD(op.a));note(a,"→ "+L("Coverday: verschoben auf")+" "+cdDD(op.b))}
    else if(op.op==="shift"){const sl=cdShootDates(days,op.u,op.a);if(!sl.length)continue;sl.push(cdNextSlot(sl[sl.length-1]));
      const cs=sl.slice(0,-1).map(dt=>op.u==="2"?(get(dt).unit2):cdContent(get(dt)));
      for(let i=sl.length-1;i>=1;i--){const d=get(sl[i]);if(op.u==="2"){if(cs[i-1])d.unit2=cs[i-1]}else{empty(d);Object.assign(d,cs[i-1])}note(d,"↷ "+L("Coverday: nachgerückt vom")+" "+cdDD(sl[i-1]))}
      const f=get(sl[0]);if(op.u==="2")delete f.unit2;else empty(f);note(f,"↷ "+L("Coverday: Drehtag nachgerückt"))}
  }catch(err){console.warn("coverday",err)}}
  days.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  try{cdRenumber(days)}catch(err){console.warn("coverday",err)}
  return days}
/* the shooting day numbers follow the date again (D03 before D04): only between the first and the last date of the changes,
   so the numbers outside stay exactly as in the Drehplan */
const cdNo=d=>{const m=String(d.short||d.label||"").match(/\d+/);return m?+m[0]:null};
const cdSetNo=(s,n)=>String(s).replace(/\d+/,m=>String(n).padStart(m.length,"0"));
/* all shooting days numbered in the order of their dates (the numbers of the Drehplan, sorted): D01, D02, D03 … */
const cdChronoOk=days=>{let l=-1;for(const d of days){if(d.kind!=="shoot")continue;const n=cdNo(d);if(n==null)continue;if(n<l)return false;l=n}return true};
function cdRenumber(days){const win=days.filter(d=>d.kind==="shoot"&&cdNo(d)!=null),nos=win.map(cdNo).sort((a,b)=>a-b);
  win.forEach((d,i)=>{if(cdNo(d)===nos[i])return;if(d.short0==null)d.short0=d.short||d.label||"";if(d.short)d.short=cdSetNo(d.short,nos[i]);if(d.label)d.label=cdSetNo(d.label,nos[i])})}
function cdChrono(days0){if(cdChronoOk(days0))return days0;const days=days0.map(d=>Object.assign({},d));cdRenumber(days);return days}
window.cdApplyAll=()=>{if(!S.days0)return;S.days=cdTransform(S.days0);
  /* callsheets of changed days go with their scenes: to the day that now has (most of) these scenes – also a new callsheet that already
     shows the change stays that way; the number in the title follows the shooting day; no matching day: «Callsheet folgt» */
  if(S.dispos0)S.dispos=cdDispos(S.dispos0,S.days);
  try{MEMO.clear()}catch(_){}};
const cdKey=x=>norm(String(x||"")).replace(/pt.*$/,"");
const cdDayKeys=d=>new Set([].concat(arr(d&&d.items),arr(d&&d.unit2&&d.unit2.items),arr(d&&d.unit3&&d.unit3.items)).filter(i=>i&&i.sc).map(i=>cdKey(i.sc)));
function cdDispos(dispos0,days){
  /* every callsheet belongs to the day of the Drehplan (with the Coverday changes) that has its scenes: it stays on its date when that day
     has them (at least as many as any other day), else it goes to the day with most of them (at least half) – also after «Aufheben» */
  const sh=days.filter(d=>d.kind==="shoot"),dk=new Map(sh.map(d=>[d.date,cdDayKeys(d)]));
  const ksOf=x=>arr(x.scenes).map(r=>cdKey(r&&r.sc)).filter(Boolean),sc=(ks,dt)=>{const s=dk.get(dt);return s?ks.filter(k=>s.has(k)).length:0};
  const keep=[],move=[];
  for(const x of dispos0){const ks=ksOf(x);if(!ks.length){keep.push(x);continue}const own=sc(ks,x.date);
    const better=sh.some(d=>d.date!==x.date&&sc(ks,d.date)>own&&sc(ks,d.date)>=Math.ceil(ks.length/2));(better?move:keep).push(x)}
  if(!move.length)return dispos0;
  const taken=new Set(keep.map(x=>x.date)),out=keep.slice();
  for(const x of move){const ks=ksOf(x);let best=null,bs=0;for(const d of sh){if(taken.has(d.date))continue;const v=sc(ks,d.date);if(v>bs){best=d;bs=v}}
    if(!best||bs<Math.ceil(ks.length/2))continue;taken.add(best.date);out.push(Object.assign({},x,{date:best.date,cdFrom:x.date}))}
  /* the number in the title of every callsheet like the shooting day it belongs to now */
  const no=new Map(days.filter(d=>d.kind==="shoot").map(d=>[d.date,cdNo(d)]));
  return out.map(x=>{const n=no.get(x.date);return n!=null&&x.label&&/\d/.test(x.label)&&String(x.label).match(/\d+/)[0]!=String(n)&&+String(x.label).match(/\d+/)[0]!==n?Object.assign({},x,{label:cdSetNo(x.label,n)}):x}).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0)}
/* the date whose documents (Sides, Gefährdungsbeurteilung, Setfloorpläne) belong to a day now: they go with the callsheet,
   without a callsheet with the content of the day; null = the documents of this day went elsewhere */
window.cdDocDate=date=>{if(!S.days0)return date;const ds=arr(S.dispos),x=ds.find(c=>c.date===date);if(x)return x.cdFrom||date;
  if(ds.some(c=>c.cdFrom===date))return null;const d=arr(S.days).find(y=>y.date===date);if(d&&d.cdSrc)return d.cdSrc;
  return arr(S.days).some(y=>y.cdSrc===date&&y.date!==date)?null:date};
/* check: every callsheet on a day whose scenes it has (dates where it does not fit, e.g. «24.10.») */
function cdCsCheck(){const out=[];for(const x of arr(S.dispos)){const ks=arr(x.scenes).map(r=>cdKey(r&&r.sc)).filter(Boolean);if(!ks.length)continue;
  const d=arr(S.days).find(y=>y.date===x.date),dk=cdDayKeys(d);if(ks.filter(k=>dk.has(k)).length<Math.ceil(ks.length/2))out.push(cdDD(x.date))}return out}
window.cdCsCheck=cdCsCheck;
/* the changes: one encrypted document (coverday/state), live for the crew */
let CDSUBS=null;
async function cdSub(){if(CDSUBS||!ME)return;try{const {F,db}=await fb();CDSUBS=F.onSnapshot(F.doc(db,"coverday","state"),async snap=>{let ops=[];
    try{if(snap.exists()&&snap.data().c)ops=arr((await ownDec(await getDataKey(),snap.data().c)).ops)}catch(_){CDSUBS&&CDSUBS();CDSUBS=null;CDFAIL=Date.now();return}
    const at=snap.exists()&&+snap.data().at||0;if(at!==window.CDAT){window.CDAT=at;try{pushSyncSoon()}catch(_){}}
    if(JSON.stringify(ops)===JSON.stringify(window.CDOPS))return;window.CDOPS=ops;cdApplyAll();render();try{pushSyncSoon()}catch(_){}},()=>{CDSUBS=null;CDFAIL=Date.now()})}catch(_){CDSUBS=null;CDFAIL=Date.now()}}
/* (re)subscribe: only for members; after an error at most every 5 minutes (no request every 4 s that costs reads) */
let CDFAIL=0;setInterval(()=>{try{if(ME&&!CDSUBS&&((typeof MEMBER!=="undefined"&&MEMBER)||isAdmin())&&Date.now()-CDFAIL>3e5)cdSub()}catch(_){}},4000);
/* «at» of coverday/state = version of the changes; the device sends it with its reminders (push), so the server knows whether they already
   follow the changes */
async function cdSave(ops){const {F,db}=await fb();const c=await ownEnc({ops}),at=Date.now();await F.setDoc(F.doc(db,"coverday","state"),{c,at});window.CDAT=at;window.CDOPS=ops;cdApplyAll();render();try{pushSyncSoon()}catch(_){}}
/* proposal for a change that waits because of a newer Drehplan */
function cdProposal(op){const raw=S.days0||[],d=dt=>raw.find(x=>x.date===dt),sn=op.snap||{};
  if(!d(op.a)||(op.op!=="shift"&&!d(op.b)&&op.op==="swap"))return ["gone",L("Ein Tag dieser Änderung gibt es im neuen Drehplan nicht mehr – aufheben.")];
  let inPlan=false;
  if(op.op==="swap")inPlan=!!sn.a&&cdScenes(d(op.b),op.u)===sn.a&&cdScenes(d(op.a),op.u)===sn.b;
  else if(op.op==="move")inPlan=!!sn.a&&cdScenes(d(op.b),op.u)===sn.a&&!cdScenes(d(op.a),op.u);
  else if(op.op==="shift"){const sl=cdShootDates(raw,op.u,op.a);inPlan=!!sn.a&&cdScenes(d(sl[0]),op.u)!==sn.a&&raw.some(x=>x.date>op.a&&cdScenes(x,op.u)===sn.a)}
  return inPlan?["same",L("Im neuen Drehplan schon so enthalten – Änderung aufheben.")]:["diff",L("Der neue Drehplan weicht ab – Änderung wieder anwenden oder aufheben.")]}
const CDN={swap:"Tauschen",move:"Verschieben",shift:"Nachrücken"};
const cdOpText=op=>L(CDN[op.op]||op.op)+" · "+(op.u==="2"?"2nd Unit":L("ganzer Drehtag"))+" · "+(op.op==="shift"?L("ab")+" "+cdDD(op.a):cdDD(op.a)+(op.op==="swap"?" ⇄ ":" → ")+cdDD(op.b));
/* which days may be changed: today or later, nothing quittiert yet */
const cdFree=dt=>dt>=todayISO()&&!(typeof scHas==="function"&&scHas(dt));
function cdPreview(f){const raw=S.days||S.days0||[],d=dt=>raw.find(x=>x.date===dt);const u=f.u,sc=dt=>cdScenes(d(dt),u)||"–";
  if(!f.a)return {ok:false,t:L("Bitte einen Drehtag wählen.")};if(!cdFree(f.a))return {ok:false,t:L("Vergangene oder schon quittierte Tage lassen sich nicht ändern.")};
  if(f.op!=="shift"){if(!f.b)return {ok:false,t:L("Bitte das zweite Datum wählen.")};if(f.b===f.a)return {ok:false,t:L("Bitte zwei verschiedene Tage wählen.")};if(!cdFree(f.b))return {ok:false,t:L("Vergangene oder schon quittierte Tage lassen sich nicht ändern.")}}
  if(f.op==="move"&&(cdScenes(d(f.b),u)||(u!=="2"&&cdScenes(d(f.b),"2"))))return   /* whole day: a 2nd unit on the target day would be deleted */ {ok:false,t:L("Am Zieltag wird schon gedreht – bitte «Tauschen» wählen.")};
  if(f.op==="swap")return {ok:true,t:cdDD(f.a)+" ("+sc(f.a)+") ⇄ "+cdDD(f.b)+" ("+sc(f.b)+")"};
  if(f.op==="move")return {ok:true,t:cdDD(f.a)+" ("+sc(f.a)+") → "+cdDD(f.b)};
  const sl=cdShootDates(raw,u,f.a);if(!sl.length)return {ok:false,t:L("Ab diesem Tag gibt es keine Drehtage.")};sl.push(cdNextSlot(sl[sl.length-1]));
  return {ok:true,t:sl.slice(0,-1).map((dt,i)=>cdDD(dt)+" → "+cdDD(sl[i+1])).join(" · ")}}
window.coverdaySec=()=>{if(!cdCan())return"";const f=CD.form,raw=S.days||S.days0||[];
  const opts=(sel,list)=>list.map(dt=>{const d=raw.find(x=>x.date===dt);return '<option value="'+dt+'"'+(sel===dt?' selected':'')+'>'+esc(WDL(new Date(dt+"T12:00:00"))+" "+cdDD(dt)+(d&&d.short?" · "+d.short:d&&d.kind==="off"?" · "+L("frei"):""))+'</option>'}).join("");
  const days=raw.filter(d=>cdFree(d.date)&&(f.u==="2"?arr((d.unit2||{}).items).some(i=>i.sc):d.kind==="shoot")).map(d=>d.date);
  const t=todayISO(),last=raw.length?raw[raw.length-1].date:t,targets=[];{const x=new Date(t+"T12:00:00");const end=new Date(last+"T12:00:00");end.setDate(end.getDate()+21);while(x<=end){const dt=x.toISOString().slice(0,10);if(cdFree(dt))targets.push(dt);x.setDate(x.getDate()+1)}}
  const pv=cdPreview(f);
  const list=arr(window.CDOPS).filter(o=>o&&o.st!=="off").sort((a,b)=>(+b.at||0)-(+a.at||0)).map(o=>{const rv=cdReview(o),p=rv?cdProposal(o):null;
    /* the new Drehplan already has this change: it is no longer laid over the Drehplan, only listed («via Drehplan geändert») */
    if(rv&&p[0]==="same")return '<li class="cdop cddone"><div><b>'+esc(cdOpText(o))+'</b><div class="ghint">✓ '+esc(L("via Drehplan geändert"))+' · '+esc(new Date(+o.at||0).toLocaleString())+'</div></div></li>';
    return '<li class="cdop'+(rv?' cdrv':'')+'"><div><b>'+esc(cdOpText(o))+'</b><div class="ghint">'+(rv?'⚠ '+esc(L("Neuer Drehplan – zu prüfen:"))+' '+esc(p[1]):esc(L("aktiv"))+' · '+esc(new Date(+o.at||0).toLocaleString()))+'</div></div><div class="arb">'+
      (rv&&p[0]==="diff"?'<button type="button" class="pillbtn" data-cdre="'+esc(o.id)+'">'+esc(L("Wieder anwenden"))+'</button>':'')+'<button type="button" class="pillbtn" data-cdoff="'+esc(o.id)+'">'+esc(L("Aufheben"))+'</button></div></li>'}).join("");
  return '<div class="admins cdsec"><h3>'+esc(L("Coverday"))+'</h3><p class="ahint">'+esc(L("Ganze Drehtage tauschen, verschieben oder nachrücken lassen – zum Beispiel bei schlechtem Wetter. Gilt sofort für alle in der App, bis ein neuer Drehplan kommt: dann schlägt die App pro Änderung den nächsten Schritt vor."))+' '+esc(L("Die Drehtage bleiben nach Datum durchnummeriert, und jedes Callsheet wandert mit seinen Szenen zum neuen Datum."))+'</p>'+
    '<form class="cdform" data-cdform novalidate><label>'+esc(L("Art"))+'<select data-cdf="op">'+Object.entries(CDN).map(([k,v])=>'<option value="'+k+'"'+(f.op===k?' selected':'')+'>'+esc(L(v))+'</option>').join("")+'</select></label>'+
    '<label>Unit<select data-cdf="u"><option value="all"'+(f.u!=="2"?' selected':'')+'>'+esc(L("ganzer Drehtag"))+'</option><option value="2"'+(f.u==="2"?' selected':'')+'>2nd Unit</option></select></label>'+
    '<label>'+esc(f.op==="shift"?L("Ab Drehtag"):L("Drehtag"))+'<select data-cdf="a"><option value="">–</option>'+opts(f.a,days)+'</select></label>'+
    (f.op==="shift"?'':'<label>'+esc(f.op==="swap"?L("Tauschen mit"):L("Neues Datum"))+'<select data-cdf="b"><option value="">–</option>'+opts(f.b,f.op==="swap"?days:targets)+'</select></label>')+
    (typeof can==="function"&&can("push.send")?'<label class="ck"><input type="checkbox" data-cdf="push"'+(f.push?' checked':'')+'> '+esc(L("Push-Nachricht «Drehplan geändert» an alle"))+'</label>':'')+
    '<p class="cdpv'+(pv.ok?'':' bad')+'">'+esc(pv.t)+'</p><div class="arb">'+saveBtn('data-cdsave'+(pv.ok&&!CD.busy?'':' disabled'),L("Übernehmen"))+'</div>'+(CD.msg?'<p class="amsg">'+esc(CD.msg)+'</p>':'')+'</form>'+
    '<details class="cdprot" data-sec="cdprot"'+(SECS.cdprot!==false?' open':'')+'><summary><h4>'+esc(L("Protokoll"))+' · '+arr(window.CDOPS).filter(o=>o&&o.st!=="off").length+'</h4></summary>'+(list?'<ul class="cdlist">'+list+'</ul>':'<p class="ghint">'+esc(L("Keine."))+'</p>')+'</details></div>'};
document.addEventListener("change",e=>{const t=e.target.closest&&e.target.closest("[data-cdf]");if(!t)return;const k=t.dataset.cdf;CD.form[k]=t.type==="checkbox"?t.checked:t.value;if(k==="op"||k==="u"){CD.form.a="";CD.form.b=""}CD.msg="";render()});
/* question before «Aufheben» / «Wieder anwenden»: with the choice to tell everybody by push (only with the right and push switched on) */
function cdAsk(q,what,okT,offerPush){return new Promise(res=>{const canP=offerPush&&can("push.send")&&window.PUSHEN!==false,d=mkDialog("cdask");
  d.innerHTML='<div class="a2box"><h3>Coverday</h3><p>'+esc(q)+'</p><p><b>'+esc(what)+'</b></p>'+(canP?'<label class="ck"><input type="checkbox" data-cdaskp checked> '+esc(L("Push «Drehplan geändert» an alle senden"))+'</label>':'')+
    '<div class="a2b"><button type="button" class="pri" data-cdaskok>'+esc(okT)+'</button><button type="button" data-cdaskno>'+esc(L("Abbrechen"))+'</button></div></div>';
  const end=v=>{d.remove();res(v)};d.addEventListener("click",e=>{if(e.target.closest("[data-cdaskok]")){const c=d.querySelector("[data-cdaskp]");end({ok:true,push:!!(c&&c.checked)})}else if(e.target.closest("[data-cdaskno]")||e.target===d)end({ok:false})});
  document.body.appendChild(d)})}
/* push «Drehplan geändert» to everybody (also when a change is cancelled or applied again, so nobody keeps the old state) */
async function cdPush(body,date){if(!can("push.send")||window.PUSHEN===false)return false;try{const enc=await ownEnc({title:L("Drehplan geändert"),body,roles:null,depts:null,by:ME.email,at:Date.now(),kind:"plan",url:"./#go=plan:"+date});
  const {F,db}=await fb();const ref=await F.addDoc(F.collection(db,"broadcasts"),{c:enc,at:F.serverTimestamp()});if(typeof bcDeliver==="function")await bcDeliver(ref.id);return true}catch(_){return false}}
/* check after a change was applied or cancelled: the days show what they should, every callsheet on the day with its scenes,
   the reminders of this device are sent again (the server holds back old reminders of other devices on these days until they are updated) */
function cdVerify(op,on){const bad=[],d=dt=>arr(S.days).find(x=>x.date===dt),d0=dt=>arr(S.days0).find(x=>x.date===dt),sc=(x,u)=>cdScenes(x,u);
  const others=cdActive().filter(o=>o.id!==op.id&&(o.a===op.a||o.b===op.a||o.a===op.b||o.b===op.b||o.op==="shift"||op.op==="shift"));
  if(!others.length){
    if(on&&op.op==="swap"){if(sc(d(op.a),op.u)!==(op.snap&&op.snap.b||"")||sc(d(op.b),op.u)!==(op.snap&&op.snap.a||""))bad.push(L("Drehplan")+" "+cdDD(op.a)+" ⇄ "+cdDD(op.b))}
    else if(on&&op.op==="move"){if(sc(d(op.b),op.u)!==(op.snap&&op.snap.a||"")||sc(d(op.a),op.u))bad.push(L("Drehplan")+" "+cdDD(op.a)+" → "+cdDD(op.b))}
    else if(on&&op.op==="shift"){if(sc(d(op.a),op.u))bad.push(L("Drehplan")+" "+cdDD(op.a))}
    else if(!on){for(const dt of [op.a,op.b].filter(Boolean))if(sc(d(dt),op.u)!==sc(d0(dt),op.u))bad.push(L("Drehplan")+" "+cdDD(dt))}}
  for(const x of cdCsCheck())bad.push("Callsheet "+x);
  /* numbering in date order */
  {let l=-1;for(const x of arr(S.days)){if(x.kind!=="shoot")continue;const n=cdNo(x);if(n==null)continue;if(n<l){bad.push(L("Nummerierung")+" "+cdDD(x.date));break}l=n}}
  try{pushSyncSoon()}catch(_){}
  return bad}
const cdReport=(t,bad,pushed)=>showMsg(t+" "+(bad.length?"⚠ "+L("Bitte prüfen:")+" "+bad.join(", "):"✓ "+L("Geprüft: Drehplan, Callsheets, Nummerierung und Erinnerungen stimmen."))+(pushed?" "+L("Push «Drehplan geändert» verschickt."):""),bad.length?9000:5000);
document.addEventListener("click",async e=>{const s=e.target.closest&&e.target.closest("[data-cdsave],[data-cdoff],[data-cdre]");if(!s||!cdCan()||CD.busy)return;e.preventDefault();
  let ask=null;
  if(s.dataset.cdoff!=null){const o=arr(window.CDOPS).find(x=>x.id===s.dataset.cdoff);if(!o)return;ask=await cdAsk(L("Coverday-Änderung wirklich aufheben? Der Drehplan gilt dann wieder für alle."),cdOpText(o),L("Aufheben"),!cdReview(o));if(!ask.ok)return}
  if(s.dataset.cdre!=null){const o=arr(window.CDOPS).find(x=>x.id===s.dataset.cdre);if(!o)return;ask=await cdAsk(L("Coverday-Änderung wieder anwenden? Sie gilt sofort für alle."),cdOpText(o),L("Wieder anwenden"),true);if(!ask.ok)return}
  if(s.dataset.cdsave!=null){const pv0=cdPreview(CD.form);if(!pv0.ok||!confirmSafe(L("Coverday-Änderung wirklich übernehmen? Sie gilt sofort für alle.")+"\n\n"+pv0.t))return}
  const ops=arr(window.CDOPS).map(x=>Object.assign({},x));CD.busy=true;
  try{if(s.dataset.cdoff!=null){const o=ops.find(x=>x.id===s.dataset.cdoff);if(!o)return;const wasOn=!cdReview(o);o.st="off";o.off=Date.now();await cdSave(ops);
      const pushed=wasOn&&ask&&ask.push?await cdPush(L("Coverday aufgehoben:")+" "+cdOpText(o)+" – "+L("es gilt wieder der Drehplan."),o.a):false;
      cdReport(L("Änderung aufgehoben."),cdVerify(o,false),pushed)}
    else if(s.dataset.cdre!=null){const o=ops.find(x=>x.id===s.dataset.cdre);if(!o)return;o.at=Date.now();o.raw=cdRaw(o,S.days0||[]);await cdSave(ops);
      const pushed=ask&&ask.push?await cdPush(cdOpText(o),o.op==="move"?o.b:o.a):false;cdReport(L("Änderung wieder angewendet."),cdVerify(o,true),pushed)}
    else{const f=CD.form,pv=cdPreview(f);if(!pv.ok)return;const raw=S.days||S.days0,d=dt=>raw.find(x=>x.date===dt);
      const snap=f.op==="shift"?{a:cdScenes(d(f.a),f.u)}:{a:cdScenes(d(f.a),f.u),b:cdScenes(d(f.b),f.u)};
      const op={id:Math.random().toString(36).slice(2,10),op:f.op,u:f.u==="2"?"2":"all",a:f.a,b:f.op==="shift"?"":f.b,at:Date.now(),by:ME&&ME.email||"",snap,st:"on",push:!!(f.push&&can("push.send"))};op.raw=cdRaw(op,S.days0||raw);
      ops.push(op);await cdSave(ops);CD.form={op:f.op,u:f.u,a:"",b:"",push:f.push};CD.msg=L("Übernommen:")+" "+pv.t;
      const pushed=op.push?await cdPush(cdOpText(op),f.op==="move"?f.b:f.a):false;cdReport(L("Übernommen:")+" "+pv.t+".",cdVerify(op,true),pushed)}}
  catch(err){CD.msg=(typeof saveErr==="function"?saveErr(err):L("Fehler:")+" "+(err.message||err))}
  finally{CD.busy=false;render()}},true);
document.addEventListener("submit",e=>{if(e.target.closest&&e.target.closest("[data-cdform]"))e.preventDefault()},true);
function setCDSUBS(v){return CDSUBS=v}   /* other parts change CDSUBS only through this */
