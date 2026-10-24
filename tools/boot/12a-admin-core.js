/* ---------- App-Verwaltung (Kern: Daten, Crew-Liste, Catering, Geburtstage, Bilder) – part of the former 12-admin.js; loaded with the app ---------- */
/* ---- admin: invitations and members (German only; visible to admins) ---- */
/* error text of the App-Verwaltung: without permission a hint to publish the Firestore rules, else the error itself */
/* the buttons follow the rules now – a refusal means this change is not allowed for this person (not «rules missing», which misled before) */
const admErr=err=>/permission/.test((err&&err.code)||"")?L("Keine Berechtigung für diese Änderung."):L("Fehler:")+" "+(err.message||err);
const ADM={inv:[],mem:[],adm:[],q:"",loaded:false,busy:false,open:new Set()};
async function admLoad(){
  const {F,db}=await fb();
  const none=()=>({docs:[]}),opt=(ok,pr)=>ok?pr:pr.catch(none);
  const [i,m,a,ro,ur]=await Promise.all([opt(isAdmin(),F.getDocs(F.collection(db,"invites"))),opt(isAdmin(),F.getDocs(F.collection(db,"members"))),F.getDocs(F.collection(db,"admins")).catch(none),F.getDocs(F.collection(db,"roles")).catch(none),F.getDocs(F.collection(db,"userroles")).then(x=>{ADM.urOk=true;return x}).catch(()=>{ADM.urOk=false;return none()})]);
  try{const ow=await F.getDocs(F.collection(db,"owners"));ADM.own=ow.docs.map(d=>d.id);for(const e of ADM.own)if(!ADMINS.includes(e))ADMINS.push(e);for(let k=ADMINS.length-1;k>=0;k--)if(!ROOT_OWNERS.includes(ADMINS[k])&&!ADM.own.includes(ADMINS[k])&&!(ME&&lc(ME.email)===ADMINS[k]))ADMINS.splice(k,1)}catch(_){ADM.own=ADM.own||[]}
  ADM.roles=ro.docs.filter(d=>d.id!=="admin").map(d=>Object.assign({id:d.id},d.data()));
  if(isOwner()&&!ADM.roles.some(x=>x.id==="crew")){const cp=VIEWPERMS.filter(p=>p!=="view.mycal");try{await F.setDoc(F.doc(db,"roles","crew"),{name:"Crew",perms:cp,at:F.serverTimestamp()});ADM.roles.push({id:"crew",name:"Crew",perms:cp})}catch(err){console.warn("crew role",err&&err.code||err)}}{const ad=ro.docs.find(d=>d.id==="admin");ADM.adminPerms=ad?(ad.data().perms||[]):ADMIN_DEFAULT.slice()}ADM.ur={};ur.docs.forEach(d=>{ADM.ur[d.id]=String((d.data()||{}).role||"")});
  if(can("users.requests")){try{const r=await F.getDocs(F.collection(db,"requests"));ADM.req=r.docs.map(d=>Object.assign({id:d.id},d.data()));ADM.reqErr=""}catch(err){ADM.req=[];ADM.reqErr=(err&&err.code)||String(err)}}else{ADM.req=[];ADM.reqErr=""}
  {const b=document.getElementById("admBtn");if(b){b.classList.toggle("hasreq",ADM.req.length>0);b.dataset.n=ADM.req.length||""}}
  ADM.adm=a.docs.map(d=>d.id);ADM.inv=i.docs.map(d=>Object.assign({id:d.id},d.data()));ADM.mem=m.docs.map(d=>Object.assign({uid:d.id},d.data()));ADM.at=Date.now();admIndex();ADM.loaded=true;render();syncBdays();
}
function crewEmails(){const out=[],seen=new Set();for(const g of S.crew)for(const p of (g.people||[])){const e=lc(p.email);if(!e||!/@/.test(e)||seen.has(e))continue;seen.add(e);out.push({email:e,name:p.name||"",role:p.role||""})}return out}
/* collapsible admin sections in the crew tab; open by default, state remembered per section */
const SECS={};try{for(const k of ["cater","bcal","set-up","set-langs","set-areas","set-misc","set-push","set-src","set-bk"])SECS[k]=localStorage.getItem("sec:"+k)!=="0";SECS.appset=localStorage.getItem("sec:appset")==="1";SECS.catmore=localStorage.getItem("sec:catmore")==="1";SECS.catcard=localStorage.getItem("sec:catcard")==="1";SECS.upsec=localStorage.getItem("sec:upsec")==="1"}catch(_){SECS.cater=SECS.bcal=true}
const secOpen=(k,title,body)=>'<details class="asec '+k+'" data-sec="'+k+'"'+(SECS[k]!==false?' open':'')+'><summary>'+esc(title)+'</summary><div class="asb">'+body+'</div></details>';
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.dataset||!d.dataset.sec)return;SECS[d.dataset.sec]=d.open;if(/^(set-blocks|blk-|blkp-)/.test(d.dataset.sec))return;   /* Drehblöcke: always closed when the page is opened again (not remembered) */try{localStorage.setItem("sec:"+d.dataset.sec,d.open?"1":"0")}catch(_){}},true);
/* departments that are not fed on set: left out of the catering count */
const NO_CATER=/^(catering|postprod|verleih)/i;
function crewDeptOf(m){
  const e=lc(m.email),k=nkey([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name);
  const x=aix();return (e&&x.dept.get("e:"+e))||(k&&x.dept.get("n:"+k))||"";
}
/* catering: the crew list shows a short summary at the top and bundles the details in one collapsible block;
   the Catering page (tab instead of Script for people with the catering permission) shows everything at a glance */
let CATM=null;
function caterData(){
  if(CATM&&Date.now()-CATM.t<800&&CATM.n===ADM.mem.length&&CATM.l===LANG)return CATM.v;
  const v=caterData0();CATM={t:Date.now(),n:ADM.mem.length,l:LANG,v};return v}
function caterData0(){
  const act=ADM.mem.filter(m=>m.active===true&&!NO_CATER.test(crewDeptOf(m))).map(normDiet);
  const nm=m=>[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||(crewPerson(m.email)||{}).name||m.email;
  const alg=m=>String(m.allergies||"").trim();
  const special=act.filter(m=>(m.diet&&m.diet!=="none")||m.intol.length||alg(m));
  const groups=DIETS.filter(d=>d[0]!=="none").map(d=>[L(d[1]),special.filter(m=>m.diet===d[0])]).concat(INTOL.map(i=>[L(i[1]),special.filter(m=>m.intol.includes(i[0]))])).filter(g=>g[1].length);
  const allergy=special.filter(alg);
  return {act,special,groups,allergy,nm,alg};
}
function caterSummary(c){
  return '<p class="catsum"><b>'+c.act.length+'</b> '+esc(L("Personen"))+' · <b>'+(c.act.length-c.special.length)+'</b> '+esc(L("ohne Sonderwünsche"))+' · <b>'+c.special.length+'</b> '+esc(L("mit Sonderwünschen"))+'</p>'+
    (c.groups.length||c.allergy.length||c.act.length?'<div class="catchips">'+(c.act.length-c.special.length?'<span class="catchip reg"><b>'+(c.act.length-c.special.length)+'</b> '+esc(L("Regulär"))+'</span>':'')+c.groups.map(([t,l])=>'<span class="catchip"><b>'+l.length+'</b> '+esc(t)+'</span>').join("")+(c.allergy.length?'<span class="catchip warn"><b>'+c.allergy.length+'</b> '+esc(L("Weitere Allergien"))+'</span>':'')+'</div>':'');
}
function caterOverview(c){
  const dep=m=>crewDeptOf(m)||"–";const regl=c.act.filter(m=>!c.special.includes(m));
  let h='<div class="catgrid">'+(regl.length?'<div class="catcard reg"><h4><b>'+regl.length+'</b> '+esc(L("Regulär"))+'</h4><div class="catn">'+regl.map(m=>esc(c.nm(m))).sort((a,b)=>a.localeCompare(b,LANG)).join("<br>")+'</div></div>':'')+c.groups.map(([t,l])=>'<div class="catcard"><h4><b>'+l.length+'</b> '+esc(t)+'</h4><div class="catn">'+l.map(m=>esc(c.nm(m))).sort((a,b)=>a.localeCompare(b,LANG)).join("<br>")+'</div></div>').join("")+
    (c.allergy.length?'<div class="catcard warn"><h4><b>'+c.allergy.length+'</b> '+esc(L("Weitere Allergien"))+'</h4><div class="catn">'+c.allergy.map(m=>'<b>'+esc(c.nm(m))+'</b>: '+esc(c.alg(m))).join("<br>")+'</div></div>':'')+'</div>';
  if(c.special.length)h+='<h3 class="cath3">'+esc(L("Alle Sonderwünsche"))+'</h3><div class="cattbl">'+c.special.slice().sort((a,b)=>c.nm(a).localeCompare(c.nm(b),LANG)).map(m=>'<div class="catrow"><div><b>'+esc(c.nm(m))+'</b><span class="catdep">'+esc(HIT(dep(m)))+'</span></div><div>'+esc(dietText(m))+'</div></div>').join("")+'</div>';
  return h;
}
function cateringHTML(){
  const c=caterData();if(!c.act.length)return"";
  const reg=c.act.length-c.special.length;
  const chips=(reg?'<span class="catchip reg"><b>'+reg+'</b> '+esc(L("Regulär"))+'</span>':'')+c.groups.map(([t,l])=>'<span class="catchip"><b>'+l.length+'</b> '+esc(t)+'</span>').join("")+(c.allergy.length?'<span class="catchip warn"><b>'+c.allergy.length+'</b> '+esc(L("Weitere Allergien"))+'</span>':'');
  return '<details class="catbox" data-sec="catcard"'+(SECS.catcard===true?' open':'')+'><summary><div class="cathd"><span class="catic" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9"/></svg></span><div class="catt"><b>Catering</b><span>'+c.act.length+' '+esc(L("Personen"))+' · '+c.special.length+' '+esc(L("mit Sonderwünschen"))+'</span></div>'+(canMenu()||can("crew.food")?(()=>{const t=esc(L(canMenu()?"Mittagsmenüs eingeben":"Catering-Seite öffnen"));return '<button type="button" class="cico catmenu" data-catpage aria-label="'+t+'" title="'+t+'">'+(canMenu()?'🍽':'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>')+'</button>'})():'')+'<span class="catchev" aria-hidden="true"></span></div>'+
    (chips?'<div class="catchips">'+chips+'</div>':'')+'</summary><div class="catbody">'+(canMenu()||can("crew.food")?'':'')+(c.special.length?caterOverview(c):'<p class="ghint">'+esc(L("Keine Sonderwünsche."))+'</p>')+'</div></details>';
}
document.addEventListener("click",e=>{if(e.target.closest("[data-catpage]")){e.preventDefault();S.tab="cater";S.srcOpen=false;window.scrollTo(0,0);render()}});
VIEWS.cater=function(){
  if(!ME||!(can("crew.food")||canMenu()))return '<div class="empty">'+L("Kein Zugang")+'</div>';
  let h='<section class="mypage catpage"><h2 class="pgt">Catering</h2>';
  if(canMenu())h+='<details class="catbox catmenus" data-sec="catmenus"'+(SECS.catmenus===false?'':' open')+'><summary><div class="cathd"><span class="catic" aria-hidden="true">🍽</span><div class="catt"><b>'+L("Menüs")+'</b><span>'+L("Pro Drehtag und Unit")+'</span></div><span class="catchev" aria-hidden="true"></span></div></summary><div class="catbody">'+menuSec()+'</div></details>';
  if(can("crew.food")){ensureAdm();if(!ADM.loaded)h+='<p class="ghint">'+(ADM.err?esc(L("Daten der Benutzer:innen nicht lesbar"))+' ('+esc(ADM.err)+')':L("Lade …"))+'</p>';
    else{const c=caterData();h+='<h3 class="cath3">'+L("Essenswünsche")+'</h3><p class="ghint">'+esc(L("Alle aktiven Benutzer:innen der App, die am Set verpflegt werden."))+'</p>'+caterSummary(c)+caterOverview(c)}}
  return h+'</section>';
};
window.caterTab=()=>!!(ME&&(can("crew.food")||canMenu()));

/* new users get the role «Crew» automatically (an invitation creates userroles/{email} = crew) */
async function assignCrew(em){em=lc(em);if(!em||ADMINS.includes(em)||(ADM.adm||[]).includes(em)||(ADM.ur||{})[em])return;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"userroles",em),{role:"crew",at:F.serverTimestamp()});ADM.ur=ADM.ur||{};ADM.ur[em]="crew"}catch(err){console.warn("crew role",err&&err.code||err);
    /* without a role the person sees no shooting plan: say so instead of failing silently */
    showMsg(L("Rolle «Crew» konnte nicht vergeben werden – bitte unter Rollen zuweisen.")+" ("+em+")",7000)}}
/* initials of a name (user list, callsheet) */
const initials=n=>String(n||"?").split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("")||"?";
/* Crew tab: admins see food preferences next to each person (matched by e-mail) */
/* Crew tab (admins only): toggles for food preferences and birthdays */
/* food + birthdays are on by default for admins; the choice is remembered (v2 keys reset older "off" states) */
const ADMV={food:true,bday:true,acct:true};try{for(const k in ADMV){const v=localStorage.getItem("admv2:"+k);if(v!==null)ADMV[k]=v==="1"}}catch(_){}
const ensureAdm=()=>{if(!ADM.loaded&&!ADM.busy&&!ADM.loading&&!ADM.err){ADM.loading=true;admLoad().then(()=>{ADM.err=""}).catch(err=>{console.error(err);ADM.err=String((err&&(err.code||err.message))||err);render()}).finally(()=>{ADM.loading=false})}};
/* crew entry -> member: same e-mail, otherwise same first + last name */
const nkey=nmk;   /* same as the name key of the PREP lists */
/* lookup tables built once per admin load instead of searching all members for every crew row */
const AIX={byEmail:new Map(),byName:new Map(),dept:new Map(),mem:null,crew:null};
const aix=()=>{if(AIX.mem!==ADM.mem||AIX.crew!==S.crew)admIndex();return AIX};
function admIndex(){
  AIX.mem=ADM.mem;AIX.crew=S.crew;AIX.byEmail=new Map();AIX.byName=new Map();AIX.dept=new Map();
  for(const m of ADM.mem){if(m.email)AIX.byEmail.set(m.email,m);for(const k of [nkey([m.firstName,m.lastName].filter(Boolean).join(" ")),nkey(m.name)])if(k&&!AIX.byName.has(k))AIX.byName.set(k,m)}
  for(const g of S.crew)for(const p of (g.people||[])){const e=lc(p.email),k=nkey(p.name);if(e&&!AIX.dept.has("e:"+e))AIX.dept.set("e:"+e,g.dept||"");if(k&&!AIX.dept.has("n:"+k))AIX.dept.set("n:"+k,g.dept||"")}
}
function memberFor(p){
  const x=aix(),e=lc(p.email);return (e&&x.byEmail.get(e))||x.byName.get(nkey(p.name))||null;
}
const bdShort=iso=>{const m=/^\d{4}-(\d\d)-(\d\d)$/.exec(iso||"");return m?m[2]+"."+m[1]+".":""};
function bdayEntries(){
  const name=m=>[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||(crewPerson(m.email)||{}).name||m.email;
  if(isAdmin()&&ADM.loaded)return ADM.mem.filter(m=>m.active===true&&/^\d{4}-\d\d-\d\d$/.test(m.birthday||"")).map(m=>({name:name(m),md:m.birthday.slice(5)}));
  /* without admin rights (e.g. «Geburtstage sehen» only) the list comes from «bdays» – it was never loaded on this path and always showed «Keine Geburtstage» */
  if(!PUBB.loaded&&ME)loadPubBdays();
  return PUBB.list;
}
function bdayHTML(){
  const ds=S.days.map(d=>d.date).filter(Boolean).sort();if(!ds.length)return"";
  /* full dates within the shoot (also over New Year: November to February) */
  const y0=+ds[0].slice(0,4),y1=+ds[ds.length-1].slice(0,4),first=ds[0],last=ds[ds.length-1];
  const hits=[];for(const x of bdayEntries()){if(!/^\d\d-\d\d$/.test(x.md||""))continue;for(let yy=y0;yy<=y1;yy++){const iso=yy+"-"+x.md;if(iso>=first&&iso<=last)hits.push(Object.assign({},x,{iso}))}}
  hits.sort((a,b)=>a.iso<b.iso?-1:a.iso>b.iso?1:String(a.name).localeCompare(String(b.name)));
  return secOpen("bcal",L("Geburtstage während des Drehs")+(hits.length?" · "+hits.length:""),(hits.length?hits.map(x=>{const d=new Date(x.iso+"T12:00:00");return '<div class="bl"><span>'+esc(WD[d.getDay()]+" "+ddmm(d))+'</span><b>'+esc(x.name)+'</b></div>'}).join(""):'<p class="ghint">'+esc(L("Keine Geburtstage während des Drehs."))+'</p>'));
}
/* birthday list for everyone (when the main admin allows it): bdays/{uid} = {name, md "MM-DD"}; no year, no other data */
const PUBB={list:[],loaded:false,loading:false};
async function loadPubBdays(){
  if(PUBB.loading)return;PUBB.loading=true;
  try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"bdays"));PUBB.list=q.docs.map(d=>d.data()).filter(x=>x&&x.md);PUBB.loaded=true;render()}
  catch(err){console.warn("bdays",err);PUBB.loaded=true;setTimeout(()=>{PUBB.loaded=false},60000)}
  PUBB.loading=false;
}
async function writeOwnBday(name,birthday){
  try{const {F,db}=await fb();const ref=F.doc(db,"bdays",ME.uid);
    if(/^\d{4}-\d\d-\d\d$/.test(birthday||""))await F.setDoc(ref,{name:name||"",md:birthday.slice(5)});else await F.deleteDoc(ref).catch(()=>{});
    PUBB.loaded=false;
  }catch(err){console.warn("bday write",err)}
}
/* main admin: keep bdays/ in line with active members (also fills it for people who registered earlier) */
let BSYNC=0;
async function syncBdays(force){
  if(!isOwner()||!ADM.loaded||(!force&&Date.now()-BSYNC<10*60*1000))return;BSYNC=Date.now();
  try{const {F,db}=await fb();const cur=await F.getDocs(F.collection(db,"bdays"));const have={};cur.docs.forEach(d=>have[d.id]=d.data());
    const name=m=>[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||(crewPerson(m.email)||{}).name||"";
    const want={};ADM.mem.forEach(m=>{if(m.active===true&&/^\d{4}-\d\d-\d\d$/.test(m.birthday||""))want[m.uid]={name:name(m),md:m.birthday.slice(5)}});
    const ops=[];for(const id in want)if(!have[id]||have[id].name!==want[id].name||have[id].md!==want[id].md)ops.push(["set",id,want[id]]);
    for(const id in have)if(!want[id])ops.push(["del",id]);
    for(let i=0;i<ops.length;i+=400){const b=F.writeBatch(db);ops.slice(i,i+400).forEach(o=>o[0]==="set"?b.set(F.doc(db,"bdays",o[1]),o[2]):b.delete(F.doc(db,"bdays",o[1])));await b.commit()}
  }catch(err){console.warn("bday sync",err)}
}
const ICO={acct:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6 1.6 0 3 .5 4.1 1.3M15.5 17.5l2 2 4-4.5"/>',bcal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13.5c-.7-.7-.7-1.6 0-2.3.7.7.7 1.6 0 2.3zM12 14v3"/>',food:'<path d="M7 2v8M4 2v5a3 3 0 0 0 6 0V2M7 10v12M17 2c-2 1.5-3 4-3 7h3v13"/>',bday:'<path d="M4 21h16M5 21v-8h14v8M12 13V9M12 6.5c-1-1-1-2.5 0-3.5 1 1 1 2.5 0 3.5zM5 16c2.3 1.5 4.7 1.5 7 0s4.7-1.5 7 0"/>'};
const togBtn=(k,t)=>'<button type="button" class="foodtog ico" data-admv="'+k+'" aria-pressed="'+ADMV[k]+'" '+ariaTip(L(t))+'><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ICO[k]+'</svg></button>';
const AV=k=>!!ADMV[k]&&can(k==="food"?"crew.food":k==="bday"?"crew.bday":"users.view");
window.crewHead=function(){
  if(!(can("crew.food")||can("crew.bday")||can("crew.vcf")||can("users.edit"))){if(!window.BDAYPUB||!ME)return"";if(!PUBB.loaded)loadPubBdays();return PUBB.loaded?bdayHTML():""}
  ensureAdm();
  return '<div class="admv">'+(can("crew.food")?togBtn("food","Essen"):"")+(ADM.err?'<span class="admerr">'+L("Daten der Benutzer:innen nicht lesbar")+' ('+esc(ADM.err)+') – '+L("Firestore-Regeln prüfen.")+'</span>':'')+(can("crew.bday")?togBtn("bday","Geburtstage"):"")+(isOwner()||can("users.edit")?togBtn("acct","Kontoinfos"):"")+(!can("crew.vcf")?"":'<button type="button" class="foodtog ico vcall" data-vcall '+ariaTip(L("Alle Kontakte als VCF"))+'><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="7" r="3"/><path d="M2.5 17c0-3 2.5-5 5.5-5 1.3 0 2.5.4 3.4 1M15 3v10M11.5 9.5 15 13l3.5-3.5M11 20h9"/></svg><b>VCF</b></button>')+'</div>'+(ADM.loaded?(AV("bday")?bdayHTML():"")+(AV("food")?cateringHTML():""):"");
};
document.addEventListener("click",e=>{if(!e.target.closest("[data-vcall]")||!can("crew.vcf"))return;const {text,n}=allVCards();if(!n)return;saveVcf(text,"TSCHUGGER Tigerblood Crew");showMsg(n+" "+L("Kontakte als VCF gespeichert."),4000)});
document.addEventListener("click",e=>{const b=e.target.closest("[data-admv]");if(!b)return;const k=b.dataset.admv;ADMV[k]=!ADMV[k];ADM.err="";if(ADMV[k]&&!ADM.loading&&Date.now()-(ADM.at||0)>60000)ADM.loaded=false;try{localStorage.setItem("admv2:"+k,ADMV[k]?"1":"0")}catch(_){}render()});
/* main admin: invite a crew member as app user straight from the crew list (shown with «Kontostatus») */
document.addEventListener("click",async e=>{const b=e.target.closest("[data-cinv]");if(!b||!isOwner())return;e.preventDefault();e.stopPropagation();
  const em=lc(b.dataset.cinv);b.disabled=true;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"invites",em),{name:String(b.dataset.nm||"").slice(0,80),role:String(b.dataset.rl||"").slice(0,80),addedAt:F.serverTimestamp()});await assignCrew(em);
    if(!ADM.inv.some(i=>i.id===em))ADM.inv.push({id:em,name:b.dataset.nm||""});admIndex();render();
    showMsg((b.dataset.nm||em)+" "+L("ist jetzt als Benutzer:in freigeschaltet und kann ein Konto erstellen."),4000)}
  catch(err){b.disabled=false;showMsg(L("Fehler:")+" "+(err.message||err),6000)}},true);
/* invitation mail to an invited crew member, from the admin's own mail program (arrives more reliably than system mail) */
document.addEventListener("click",e=>{const b=e.target.closest("[data-cmail]");if(!b||!isAdmin())return;e.preventDefault();e.stopPropagation();
  const em=b.dataset.cmail;location.href=mailto(em,"invite",{vorname:(b.dataset.nm||"").split(/\s+/)[0],name:b.dataset.nm||""})},true);
/* blocking gallery: encrypted preview images (blk/*.bin = 12-byte IV + AES-GCM), decrypted with the crew key */
const BLKIMG=new Map();
/* where the pictures live: Cloudflare R2 behind the worker (meta.blkBase) or GitHub Pages (blk/ next to the app) */
window.blkUrl=f=>{const b=S.meta&&S.meta.blkBase;return b&&/^https:\/\//.test(b)&&/^blk\//.test(f)?b+f:f};
window.blkImg=function(f){
  if(!BLKIMG.has(f))BLKIMG.set(f,(async()=>{const key=await getDataKey(),u=blkUrl(f);
    const get=async c=>{const r=await fetch(u,{cache:c});if(!r.ok)throw new Error("HTTP "+r.status);return new Uint8Array(await r.arrayBuffer())};
    const dec=buf=>crypto.subtle.decrypt({name:"AES-GCM",iv:buf.slice(0,12)},key,buf.slice(12));
    let pt;try{pt=await dec(await get("force-cache"))}
    catch(err){ /* an old copy from before a key change: drop it and load it again */
      if(/^HTTP/.test(err.message||""))throw err;
      try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.open(k).then(c=>c.delete(u))))}catch(_){}
      pt=await dec(await get("reload"))}
    const bl=new Blob([pt],{type:/\.mp4\.bin$/.test(f)?"video/mp4":/\.pdf\.bin$/.test(f)?"application/pdf":"image/jpeg"}),ou=URL.createObjectURL(bl);BLKURL.set(f,ou);if(bl.type==="application/pdf")BLKBLOB.set(ou,bl);   /* the PDF viewer reads the file itself (fetch of blob: is not allowed) */blkTrim();return ou})().catch(err=>{BLKIMG.delete(f);throw err}));
  return BLKIMG.get(f);
};
/* decrypted pictures/videos stay in memory only up to a limit: the oldest ones not shown on the page are freed
   (browsing many blocking videos on a phone otherwise filled the memory until the tab was closed) */
const BLKURL=new Map(),BLKBLOB=new Map();window.blkBlob=u=>BLKBLOB.get(u)||null;
function blkTrim(){if(BLKURL.size<=60)return;for(const [f,u] of BLKURL){if(BLKURL.size<=40)break;
  let used=false;try{used=!!document.querySelector('[src="'+u+'"]')||!!document.querySelector('[href="'+u+'"]')}catch(_){}
  if(used)continue;try{URL.revokeObjectURL(u)}catch(_){}BLKBLOB.delete(u);BLKURL.delete(f);BLKIMG.delete(f)}}
/* crew list: phone / e-mail from the app profile when the crew list has none (people allowed to see contacts outside the crew list) */
window.crewFill=function(p){
  if(!ME||!(can("contacts.extra")||can("users.view")))return null;
  if(!ADM.loaded){ensureAdm();return null}
  const m=memberFor(p);if(!m)return null;
  return {phone:String(m.phone||"").trim(),email:String(m.contactEmail||m.email||"").trim()};
};
const CICO={wa:'<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/><path d="M9 9.5c.4 1.9 2.6 4.1 4.5 4.5l1.2-1.2 2 1-.6 1.6c-3.4.4-7.8-4-7.4-7.4l1.6-.6 1 2z"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',add:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"/><path d="M19 8v6M16 11h6"/>'};
const cico=(k,label,attrs,extra)=>'<button type="button" class="cico'+(extra||"")+'" '+attrs+' '+ariaTip(label)+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+CICO[k]+'</svg></button>';
window.crewExtra=function(p){
  /* «Kontoinfos» (owner and everyone allowed to change user data): account status, edit user data, role */
  const ACC=ADMV.acct&&(isOwner()||can("users.edit"));
  if(!p||!(can("crew.food")||can("crew.bday")||can("users.edit")))return"";
  if(!ADM.loaded){ensureAdm();return ADM.err||!(AV("food")||AV("bday")||ACC)?"":'<div class="pinfo"><span class="na">…</span></div>'}
  const m=memberFor(p),ch=[],na=t=>'<span class="na">'+esc(t)+'</span>';
  /* admins edit the person's user data right here (same form as in App-Verwaltung) */
  const ue=m?m.email:lc(p.email),uinv=ue&&ADM.inv.some(i=>i.id===ue),canEd=ACC&&can("users.edit")&&(m||uinv)&&(isOwner()||!ADMINS.includes(ue));
  const edBtn=canEd?cico(ADM.cedit===ue?"close":"edit",L(ADM.cedit===ue?"Schliessen":"Benutzerdaten bearbeiten"),'data-ced="'+esc(ue)+'" aria-expanded="'+(ADM.cedit===ue)+'"',ADM.cedit===ue?" on":""):"";
  const edForm=canEd&&ADM.cedit===ue?(typeof editForm==="function"?editForm({email:ue,m,name:p.name,role:p.role},true):(window.loadAdminUI&&window.loadAdminUI().catch(()=>{}),'<p class="ghint">'+esc(L("Lade …"))+'</p>')):"";   /* the form is in admin.js */
  if(!(AV("food")||AV("bday")||ACC))return "";
  if(ACC){
    if(!m){const e=lc(p.email),inv=e&&ADM.inv.some(i=>i.id===e);ch.push(na(L(inv?"Eingeladen, noch kein Konto":"Noch kein Konto")));
      if(inv&&isAdmin())ch.push(cico("mail",L("Einladungs-Mail schicken"),'data-cmail="'+esc(e)+'" data-nm="'+esc(p.name||"")+'"'),cico("wa",L("Per WhatsApp einladen"),'data-cwa="'+esc(e)+'" data-nm="'+esc(p.name||"")+'" data-ph="'+esc(p.phone||"")+'"'));
      if(!inv&&isOwner()&&e&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))ch.push(cico("add",L("Als Benutzer:in einladen"),'data-cinv="'+esc(e)+'" data-nm="'+esc(p.name||"")+'" data-rl="'+esc(p.role||"")+'"'))}
    else ch.push(m.active===true?'<span class="ok">'+esc(L("Konto aktiv"))+'</span>':'<span class="off">'+esc(L("Gesperrt"))+'</span>');
    const ems=[lc(p.email),m&&m.email].filter(Boolean);
    if(ems.some(e=>ADMINS.includes(e)))ch.push('<span class="adm">'+esc(L("Owner"))+'</span>');
    else if(ems.some(e=>ADM.adm.includes(e)))ch.push('<span class="adm">'+esc(L("Admin"))+'</span>');
  }
  if(m&&AV("bday")){const b=bdShort(m.birthday);ch.push(b?'<span class="bday">'+esc(L("Geburtstag"))+' '+esc(b)+'</span>':(ACC?na(L("Geburtstag")+": –"):""))}
  if(m&&AV("food")){const t=dietText(m);ch.push(t?'<span class="diet">'+esc(t)+'</span>':(m.diet?"":(ACC?na(L("Essen")+": "+L("keine Angaben")):"")))}
  if(edBtn)ch.push(edBtn);
  const h=ch.filter(Boolean).join("");return (h?'<div class="pinfo">'+h+'</div>':"")+edForm;
};
document.addEventListener("click",e=>{const b=e.target.closest("[data-ced]");if(!b||!can("users.edit"))return;e.preventDefault();e.stopPropagation();ADM.cedit=ADM.cedit===b.dataset.ced?"":b.dataset.ced;render()},true);


function confirmSafe(t){try{return window.confirm(t)}catch(_){return true}}

/* ---------- the App-Verwaltung (users, roles, settings, backup) is loaded only when it is opened (admin.js): a faster start for everybody else.
   Without a separate file (local build) the parts are in the page and this does nothing ---------- */
let ADMUI=null;
window.loadAdminUI=()=>{if(typeof editForm==="function")return Promise.resolve();if(ADMUI)return ADMUI;
  ADMUI=new Promise((ok,no)=>{const sc=document.createElement("script");sc.src="admin.js?v=__ADMINJS_VER__";sc.onload=()=>{ok();try{render()}catch(_){}};sc.onerror=()=>{ADMUI=null;no(new Error("admin.js"))};document.head.appendChild(sc)});return ADMUI};
if(typeof VIEWS.admin!=="function")VIEWS.admin=()=>{window.loadAdminUI().catch(()=>showMsg(L("App-Verwaltung konnte nicht geladen werden (offline?)."),5000));return '<div class="empty">'+esc(L("Lade …"))+'</div>'};
