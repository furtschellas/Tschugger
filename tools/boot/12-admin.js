/* ---- admin: invitations and members (German only; visible to admins) ---- */
/* error text of the App-Verwaltung: without permission a hint to publish the Firestore rules, else the error itself */
const admErr=err=>/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err);
const ADM={inv:[],mem:[],adm:[],q:"",loaded:false,busy:false,open:new Set()};
async function admLoad(){
  const {F,db}=await fb();
  const none=()=>({docs:[]}),opt=(ok,pr)=>ok?pr:pr.catch(none);
  const [i,m,a,ro,ur]=await Promise.all([opt(isAdmin(),F.getDocs(F.collection(db,"invites"))),opt(isAdmin(),F.getDocs(F.collection(db,"members"))),F.getDocs(F.collection(db,"admins")).catch(none),F.getDocs(F.collection(db,"roles")).catch(none),F.getDocs(F.collection(db,"userroles")).catch(none)]);
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
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.dataset||!d.dataset.sec)return;SECS[d.dataset.sec]=d.open;try{localStorage.setItem("sec:"+d.dataset.sec,d.open?"1":"0")}catch(_){}},true);
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
/* ---- backup (main admin only): users, invites, admins, settings, birthdays as one JSON file ---- */
const BK={busy:false,msg:"",ok:false};
function bkSec(){
  let last="";try{last=localStorage.getItem("bk:last")||""}catch(_){}
  return '<div class="bk">'+
    '<p class="ahint">'+L("Sichert Benutzer:innen, Einladungen, Administrator:innen, Einstellungen der App und Geburtstage als Datei. Die Drehdaten selbst kommen aus der Dropbox und brauchen kein Backup.")+'</p>'+
    (last?'<p class="ahint">'+L("Letztes Backup auf diesem Gerät")+': '+esc(fmtStamp(last))+'</p>':'')+
    '<div class="bkb"><button type="button" class="abtn" data-bk="dl"'+(BK.busy?' disabled':'')+'>'+L("Backup herunterladen")+'</button>'+
    '<label class="abtn bkup">'+L("Backup wiederherstellen")+'<input type="file" accept="application/json,.json" data-bk="up" hidden></label></div>'+
    '<p class="ahint">'+L("Beim Wiederherstellen werden die Einträge aus der Datei ergänzt oder überschrieben. Nichts wird gelöscht.")+'</p>'+
    (BK.msg?'<p class="amsg'+(BK.ok?' ok':'')+'" role="status">'+esc(BK.msg)+'</p>':'')+'</div>';
}
async function bkCollect(){
  const {F,db}=await fb();
  const col=async n=>{const q=await F.getDocs(F.collection(db,n));return q.docs.map(d=>({id:d.id,data:d.data()}))};
  const [members,invites,admins,bdays,cfg]=await Promise.all([col("members"),col("invites"),col("admins"),col("bdays").catch(()=>[]),F.getDoc(F.doc(db,"config","app"))]);
  const plain=v=>JSON.parse(JSON.stringify(v,(k,x)=>x&&typeof x==="object"&&typeof x.toDate==="function"?{__ts:x.toDate().toISOString()}:x));
  return plain({app:"tschugger-crew",version:1,createdAt:new Date().toISOString(),by:ME&&ME.email,config:cfg.exists()?cfg.data():null,members,invites,admins,bdays});
}
async function bkDownload(){
  const data=await bkCollect();const t=new Date();
  const name="tschugger-backup-"+t.getFullYear()+"-"+pad2(t.getMonth()+1)+"-"+pad2(t.getDate())+"-"+pad2(t.getHours())+pad2(t.getMinutes())+".json";
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download=name;a.rel="noopener";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  try{localStorage.setItem("bk:last",t.toISOString())}catch(_){}
  return L("Backup gespeichert")+": "+data.members.length+" "+L("Benutzer:innen")+", "+data.invites.length+" "+L("Einladungen")+".";
}
async function bkRestore(file){
  if(file.size>5e6)throw new Error(L("Datei ist zu gross."));
  let d;try{d=JSON.parse(await file.text())}catch(_){throw new Error(L("Datei ist kein gültiges Backup."))}
  if(!d||d.app!=="tschugger-crew"||!Array.isArray(d.members)||!Array.isArray(d.invites))throw new Error(L("Datei ist kein gültiges Backup."));
  if(!confirmSafe(L("Backup vom {d} wiederherstellen? Vorhandene Einträge werden ergänzt oder überschrieben.").replace("{d}",fmtStamp(d.createdAt||""))))return "";
  const {F,db}=await fb();const back=v=>JSON.parse(JSON.stringify(v),(k,x)=>x&&typeof x==="object"&&typeof x.__ts==="string"?F.Timestamp&&F.Timestamp.fromDate?F.Timestamp.fromDate(new Date(x.__ts)):x.__ts:x);
  const own=lc(ME&&ME.email),ok=/^[^/]{1,200}$/;const ops=[];
  if(d.config&&typeof d.config==="object")ops.push(["config","app",d.config]);
  for(const [n,list] of [["admins",d.admins],["invites",d.invites],["members",d.members],["bdays",d.bdays]])
    for(const r of (Array.isArray(list)?list:[]))if(r&&ok.test(String(r.id))&&r.data&&typeof r.data==="object"&&!(n==="members"&&lc(r.data.email)===own))ops.push([n,String(r.id),r.data]);
  let done=0,fail=0;
  for(let i=0;i<ops.length;i+=300){const batch=F.writeBatch(db);ops.slice(i,i+300).forEach(([n,id,v])=>batch.set(F.doc(db,n,id),back(v),{merge:true}));
    try{await batch.commit();done+=Math.min(300,ops.length-i)}catch(err){console.error(err);fail+=Math.min(300,ops.length-i)}}
  ADM.loaded=false;
  return L("Wiederhergestellt")+": "+done+(fail?" · "+L("fehlgeschlagen")+": "+fail:"");
}
document.addEventListener("click",async e=>{const b=e.target.closest('[data-bk="dl"]');if(!b||BK.busy||!isOwner())return;
  BK.busy=true;BK.msg="";render();try{BK.msg=await bkDownload();BK.ok=true}catch(err){console.error(err);BK.msg=errText(err);BK.ok=false}BK.busy=false;render()});
document.addEventListener("change",async e=>{const i=e.target.closest('[data-bk="up"]');if(!i||BK.busy||!isOwner())return;const f=i.files&&i.files[0];i.value="";if(!f)return;
  BK.busy=true;BK.msg="";render();try{const m=await bkRestore(f);if(m){BK.msg=m;BK.ok=!/fehlgeschlagen|échoué|non riuscit|failed/i.test(m)}}catch(err){console.error(err);BK.msg=err.message||String(err);BK.ok=false}BK.busy=false;render()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-tmv]");if(!b)return;e.preventDefault();const r=b.closest(".tbrow"),p=r&&r.parentNode;if(!p)return;
  if(b.dataset.tmv==="up"&&r.previousElementSibling)p.insertBefore(r,r.previousElementSibling);
  else if(b.dataset.tmv==="down"&&r.nextElementSibling)p.insertBefore(r.nextElementSibling,r);
  b.focus()});
/* status of the hourly GitHub update (Dropbox → website), read from status.json in the repository */
const UPST={d:null,at:0,busy:false};
function upLoad(){if(UPST.busy||Date.now()-UPST.at<120000)return;UPST.busy=true;
  fetch("status.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null).then(d=>{UPST.d=d||{state:"none"};UPST.at=Date.now();UPST.busy=false;if(S.tab==="admin")render()})}
function upSec(){
  upLoad();const d=UPST.d;const GH="https://github.com/furtschellas/Tschugger";
  const when=t=>{try{return new Date(t).toLocaleString(LANG==="en"?"en-GB":LANG+"-CH",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}catch(_){return t||""}};
  let st;if(!d)st='<p class="ahint">'+L("Lade …")+'</p>';
  else if(d.state==="ok")st='<p class="upst ok">● '+L("Läuft")+' – '+L("zuletzt geprüft")+' '+esc(when(d.at))+(d.updatedAt?' · '+L("Daten vom")+' '+esc(when(d.updatedAt)):'')+(d.version?' · '+esc(d.version):'')+'</p>';
  else if(d.state==="off")st='<p class="upst warn">● '+L("In den App-Einstellungen ausgeschaltet")+'</p>';
  else if(d.state==="error")st='<p class="upst err">● '+L("Fehler beim letzten Lauf")+' ('+esc(when(d.at))+'): '+esc(d.msg||"")+'</p>';
  else st='<p class="upst warn">● '+L("Noch nicht eingerichtet")+(d.missing&&d.missing.length?' – '+L("es fehlen")+': '+d.missing.map(m=>'<code>'+esc(m)+'</code>').join(", "):'')+'</p>';
  const ok=d&&d.state==="ok";
  return '<div class="upsec"><p class="ahint"><b>'+L("Automatische Aktualisierung (Dropbox → Webseite)")+'</b></p>'+st+
    '<p class="ahint">'+L("GitHub liest die Dropbox zweimal pro Stunde (nur lesend), wandelt neue Drehpläne, Crewlisten, Dispos und das Drehbuch um und veröffentlicht sie verschlüsselt auf der Webseite – ohne dass ein Computer laufen muss.")+'</p>'+
    (ok?'':'<ol class="upsteps"><li>'+L("Dropbox-Zugang (nur lesend) erzeugen:")+' <a href="dropbox-setup.html" target="_blank" rel="noopener">dropbox-setup.html</a> → <code>DROPBOX_APP_KEY</code>, <code>DROPBOX_REFRESH_TOKEN</code></li>'+
      '<li>'+L("Claude-API-Schlüssel erstellen:")+' <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a> → <code>ANTHROPIC_API_KEY</code></li>'+
      '<li><code>CREW_KEY</code> – '+L("den Schlüssel der Crew-Daten bekommst du von Claude im Chat.")+'</li>'+
      '<li>'+L("Alle vier in GitHub eintragen:")+' <a href="'+GH+'/settings/secrets/actions" target="_blank" rel="noopener">Settings → Secrets → Actions</a></li>'+
      '<li>'+L("Ersten Lauf starten:")+' <a href="'+GH+'/actions/workflows/dropbox-update.yml" target="_blank" rel="noopener">Actions → «Run workflow»</a></li></ol>')+
    '<p class="ahint"><a href="'+GH+'/actions/workflows/dropbox-update.yml" target="_blank" rel="noopener">'+L("Läufe auf GitHub ansehen")+'</a></p></div>';
}
/* owner only: account with a one-time start password, created in a second Firebase instance so the owner stays signed in */
function genPw(){const c="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789",r=new Uint32Array(12);crypto.getRandomValues(r);
  const x=[...r].map(v=>c[v%c.length]).join("");return x.slice(0,4)+"-"+x.slice(4,8)+"-"+x.slice(8)}
async function createStartAccount(em,nm){
  em=lc(em);const {AP,A,F,db}=await fb();const pw=genPw();
  await F.setDoc(F.doc(db,"starts",em),{mustChange:true,at:F.serverTimestamp()});
  if(!ADM.inv.some(i=>i.id===em))await F.setDoc(F.doc(db,"invites",em),{name:String(nm||"").slice(0,80),role:"",addedAt:F.serverTimestamp()});await assignCrew(em);
  const a2=AP.initializeApp(FB_CONFIG,"start"+Date.now());
  try{const au=typeof A.initializeAuth==="function"&&A.inMemoryPersistence?A.initializeAuth(a2,{persistence:A.inMemoryPersistence}):A.getAuth(a2);
    await A.createUserWithEmailAndPassword(au,em,pw);try{await A.signOut(au)}catch(_){}}
  catch(err){try{await F.deleteDoc(F.doc(db,"starts",em))}catch(_){}throw err}
  finally{try{AP.deleteApp&&await AP.deleteApp(a2)}catch(_){}}
  return pw;
}
function showStartPw(em,nm,pw){
  let d=mkDialog("pwbox",null,{replace:true});
  const app=location.origin+location.pathname;
  const body=L("Hallo")+" "+String(nm||"").split(/\s+/)[0]+",\n\n"+L("dein Konto für die Crew-App von TSCHUGGER Tigerblood ist bereit:")+"\n"+app+"\n\n"+L("E-Mail")+": "+em+"\n"+L("Startpasswort")+": "+pw+"\n\n"+L("Beim ersten Anmelden legst du ein eigenes Passwort fest.")+"\n\n"+L("Bis bald am Set!");
  d.innerHTML='<div class="a2box acbox"><h3>'+L("Startpasswort")+'</h3><p>'+esc(nm||em)+'<br><small>'+esc(em)+'</small></p><p class="pwshow">'+esc(pw)+'</p><p class="ahint">'+L("Gilt nur für die erste Anmeldung. Danach muss die Person ein eigenes Passwort festlegen. Das Startpasswort wird nirgends gespeichert – jetzt weitergeben.")+'</p>'+
    '<div class="a2b"><button type="button" data-pw="copy">'+L("Kopieren")+'</button><a class="lnk" href="'+esc(mailto(em,"startpw",{vorname:String(nm||"").split(/\s+/)[0],name:nm||"",passwort:pw}))+'">'+L("Per Mail schicken")+'</a>'+dlgBtn("lnk",'data-pw="close"',"Schliessen")+'</div></div>';
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-pw]");if(e.target===d||(b&&b.dataset.pw==="close")){d.remove();return}
    if(b&&b.dataset.pw==="copy"){try{await navigator.clipboard.writeText(pw);showMsg(L("Kopiert"),2000)}catch(_){showMsg(pw,8000)}}});
  document.body.appendChild(d);
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-pwshow]");if(!b||!isOwner()||!ADM.pw)return;const em=b.dataset.pwshow;const m=ADM.mem.find(x=>x.email===em),i=ADM.inv.find(x=>x.id===em);showStartPw(em,(m&&m.name)||(i&&i.name)||"",ADM.pw[em])});
/* admins: see and change a user's details (registered: profile incl. food; invited: name, role) */
function userInfo(r){
  const m=r.m;if(!m||!(isAdmin()||can("users.view")))return"";
  const g=(GENDERS.find(x=>x[0]===m.gender)||[])[1];const row=(k,v)=>v?'<div class="udl"><span>'+esc(L(k))+'</span><b>'+v+'</b></div>':'';
  return row("Telefon",m.phone?'<a href="tel:'+esc(telNum(m.phone))+'">'+esc(m.phone)+'</a>':"")+
    row("Kontakt-E-Mail",m.contactEmail&&m.contactEmail!==m.email?'<a href="mailto:'+esc(m.contactEmail)+'">'+esc(m.contactEmail)+'</a>':"")+
    row("Geburtsdatum",m.birthday?esc(m.birthday.split("-").reverse().join(".")):"")+row("Geschlecht",g?esc(L(g)):"")+row("Essen",esc(dietText(m)))+
    row("Willkommen",esc(m.welcomeAck?L("bestätigt")+" "+fmtD(m.welcomeAck):L("noch nicht bestätigt")))+
    row("Willkommen Test-User",m.testAck?esc(L("bestätigt")+" "+fmtD(m.testAck)):"");
}

/* new users get the role «Crew» automatically (an invitation creates userroles/{email} = crew) */
async function assignCrew(em){em=lc(em);if(!em||ADMINS.includes(em)||(ADM.adm||[]).includes(em)||(ADM.ur||{})[em])return;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"userroles",em),{role:"crew",at:F.serverTimestamp()});ADM.ur=ADM.ur||{};ADM.ur[em]="crew"}catch(err){console.warn("crew role",err&&err.code||err)}}
/* role picker (owner): Benutzer:in, Admin or one of the custom roles */
const canRole=e=>!!e&&!ROOT_OWNERS.includes(e)&&!(ME&&lc(ME.email)===e)&&(isOwner()||(isAdmin()&&!ADMINS.includes(e))||(can("roles.assign")&&!ADMINS.includes(e)&&!ADM.adm.includes(e)));
const roleOf=e=>{if(ADMINS.includes(e))return "owner";if(ADM.adm.includes(e))return "admin";const id=ADM.ur[e];return id&&ADM.roles.some(x=>x.id===id)?id:""};
const roleName=id=>id==="admin"?L("Admin"):((ADM.roles.find(x=>x.id===id)||{}).name||"");
const roleSel=r=>'<label class="rolesel">'+L("Rolle")+' <select data-urole="'+esc(r.email)+'"><option value="">'+L("Keine Rolle (eingeschränkt)")+'</option>'+(isOwner()?'<option value="owner"'+(roleOf(r.email)==="owner"?' selected':'')+'>'+L("Owner")+'</option>':'')+(isAdmin()?'<option value="admin"'+(roleOf(r.email)==="admin"?' selected':'')+'>'+L("Admin")+'</option>':'')+ADM.roles.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),LANG)).map(x=>{const mine=roleOf(r.email)===x.id,ok=isAdmin()||(x.perms||[]).every(p=>MYPERMS.includes(p));/* only roles with one's own rights can be given */return ok||mine?'<option value="'+esc(x.id)+'"'+(mine?' selected':'')+(ok?'':' disabled')+'>'+esc(x.name||x.id)+'</option>':''}).join("")+'</select></label>';
function editForm(r,withRole){
  const m=r.m,i=ADM.inv.find(x=>x.id===r.email)||{},v=x=>esc(x||"");
  return (window.simBtn?window.simBtn(r.email):'')+(withRole&&canRole(r.email)?'<div class="aerole">'+roleSel(r)+'</div>':'')+'<form class="aedit" data-adm="save" data-em="'+esc(r.email)+'">'+
    (m?'<label>'+L("Vorname")+'<input name="fn" maxlength="60" value="'+v(m.firstName)+'"></label><label>'+L("Nachname")+'<input name="ln" maxlength="60" value="'+v(m.lastName)+'"></label>'+
       '<label>'+L("Funktion")+'<input name="rl" maxlength="80" value="'+v(i.role||r.role||(m&&m.func))+'"></label>'+
       '<label>'+L("Sprache der App")+langSel("lg",m.lang||"de")+'</label><label>'+L("Geburtsdatum (optional)")+'<input type="date" name="bd" value="'+v(m.birthday)+'"></label><label>'+L("Geschlecht (optional)")+genderSel("gd",m.gender||"")+'</label>'+contactFields(m,"e")+
       '<fieldset class="efood"><legend>'+L("Essen")+'</legend><label>'+L("Ernährung")+dietSel("edt",normDiet(m).diet)+'</label><label>'+L("Verträglichkeiten")+'</label>'+intolBoxes("eint",normDiet(m).intol)+'<label>'+L("Weitere Allergien (optional)")+'<input name="eal" maxlength="200" value="'+v(m.allergies)+'"></label></fieldset>'
     :'<label>'+L("Name")+'<input name="nm" maxlength="80" value="'+v(i.name||r.name)+'"></label><label>'+L("Funktion")+'<input name="rl" maxlength="80" value="'+v(i.role||r.role)+'"></label>')+
    '<p class="ahint">'+L("Die E-Mail-Adresse kann nicht geändert werden – dafür die Person entfernen und mit der neuen Adresse einladen.")+'</p>'+
    '<button type="submit">'+L("Speichern")+'</button></form>';
}
function reqSec(){
  const r=(ADM.req||[]).slice().sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id),LANG));
  return '<div class="admins areq" id="areq"><h3>'+L("Anfragen von Benutzer:innen")+' <span class="ust '+(r.length?'adm':'')+'">'+r.length+'</span></h3>'+
    (ADM.reqErr?'<p class="admerr">'+L("Anfragen nicht lesbar")+' ('+esc(ADM.reqErr)+') – '+L("Firestore-Regeln prüfen.")+'</p>':
     r.length?'<p class="ahint">'+L("Diese Personen sind nicht auf der Liste und bitten um Zugang. «Freischalten» lädt sie ein; sie tippen danach auf «Aktualisieren».")+'</p>':'<p class="ahint">'+L("Keine offenen Anfragen.")+'</p>')+
    r.map(q=>'<div class="arow"><span><b>'+esc(q.name||"")+'</b> · '+esc(q.id)+(q.role?'<br><small>'+esc(q.role)+'</small>':'')+(q.note?'<br><small>«'+esc(q.note)+'»</small>':'')+'</span>'+
      (can("users.requests")?'<button data-adm="reqok" data-em="'+esc(q.id)+'">'+L("Freischalten")+'</button><button data-adm="reqno" data-em="'+esc(q.id)+'">'+L("Ablehnen")+'</button>':'')+'</div>').join("")+'</div>';
}
const permBoxes=sel=>'<div class="perms">'+[...new Set(PERMS.map(x=>x[2]))].map(g=>'<div class="pgrp"><h5>'+esc(L(g))+'</h5>'+PERMS.filter(x=>x[2]===g).map(([k,t])=>{const lock=!isAdmin()&&!MYPERMS.includes(k); /* role editors can only give permissions they have themselves */
    return '<label class="ck'+(lock?' plock':'')+'"><input type="checkbox" name="rp" value="'+k+'"'+((sel||[]).includes(k)?' checked':'')+(lock?' disabled':'')+'> '+L(t)+'</label>'}).join("")+'</div>').join("")+'</div>';
function rolesSec(){
  const cnt=id=>id==="admin"?ADM.adm.length:Object.keys(ADM.ur||{}).filter(e=>ADM.ur[e]===id&&!ADM.adm.includes(e)).length;
  const roles=(ADM.roles||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),LANG));
  const pplLbl=id=>cnt(id)+' '+L(cnt(id)===1?"Person":"Personen");
  /* who has this role: folded list, a person added right here (select) or taken out (×) */
  const nameOf=e=>{const m=ADM.mem.find(x=>x.email===e),i=ADM.inv.find(x=>x.id===e),cp=(typeof crewPerson==="function"&&crewPerson(e))||{};return (m&&([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name))||(i&&i.name)||cp.name||e};
  const everyone=[...new Set(ADM.mem.map(m=>m.email).concat(ADM.inv.map(i=>i.id)))].filter(e=>e&&!ADMINS.includes(e));
  const ppl=id=>(id==="admin"?ADM.adm.slice():Object.keys(ADM.ur||{}).filter(e=>ADM.ur[e]===id&&!ADM.adm.includes(e))).sort((a,b)=>nameOf(a).localeCompare(nameOf(b),LANG));
  const pplSec=id=>{const l=ppl(id),can_=canRoleAssign()&&(id!=="admin"||isAdmin()),cand=can_?everyone.filter(e=>!l.includes(e)&&canRole(e)).sort((a,b)=>nameOf(a).localeCompare(nameOf(b),LANG)):[];
    return '<details class="arppl" data-sec="rppl-'+esc(id)+'"'+(SECS["rppl-"+id]?' open':'')+'><summary>'+esc(L("Personen"))+' ('+l.length+')</summary>'+
      (l.length?'<ul class="paccl">'+l.map(e=>'<li><span>'+esc(nameOf(e))+'</span>'+(can_&&canRole(e)?'<button type="button" class="lnk arpx" data-rpout="'+esc(e)+'" '+ariaTip(L("Aus der Rolle nehmen"))+'>×</button>':'')+'</li>').join("")+'</ul>':'<p class="ghint">'+L("Niemand")+'</p>')+
      (cand.length?'<label class="arl arpadd">'+L("Person hinzufügen")+'<select data-rpadd="'+esc(id)+'"><option value="">'+esc(L("Person wählen …"))+'</option>'+cand.map(e=>'<option value="'+esc(e)+'">'+esc(nameOf(e))+(nameOf(e)!==e?' · '+esc(e):'')+'</option>').join("")+'</select></label>':'')+'</details>'};
  const row=(id,name,perms,fixedName)=>{const open=ADM.redit===id;
    return '<div class="arole'+(open?' open':'')+'"><div class="arh"><div class="arn"><b>'+esc(name)+(id==="crew"?' <span class="ust role">'+L("Standard")+'</span>':'')+'</b><small>'+(id==="crew"?L("Wird neuen Benutzer:innen automatisch zugewiesen.")+' ':'')+(perms.length?perms.length+' '+L(perms.length===1?"Berechtigung":"Berechtigungen"):L("Keine Berechtigungen"))+' · '+pplLbl(id)+'</small></div>'+(canRoleEdit()&&(id!=="admin"||isAdmin())&&(isAdmin()||id!==MYROLE)?'<button type="button" class="pillbtn" data-redit="'+esc(id)+'">'+L(open?"Schliessen":"Bearbeiten")+'</button>':'')+'</div>'+pplSec(id)+
      (open?'<form class="arolef" data-role="'+esc(id)+'">'+(fixedName?'<input type="hidden" name="rn" value="'+esc(name)+'">':'<label class="arl">'+L("Name der Rolle")+'<input name="rn" maxlength="40" required value="'+esc(name)+'"></label>')+permBoxes(perms)+
        '<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Speichern")+'</button>'+(id==="crew"?'':id==="admin"?'<button type="button" class="lnk" data-rreset>'+L("Standard wiederherstellen")+'</button>':'<button type="button" class="lnk" data-rdel="'+esc(id)+'">'+L("Rolle löschen")+'</button>')+'</div></form>':'')+'</div>'};
  return '<div class="admins"><h3>'+L("Rollen")+'</h3><p class="ahint">'+L("Eine Rolle bündelt Berechtigungen. Zuweisen kannst du sie in der Benutzerverwaltung bei der Person unter «Rolle». Ohne Rolle sieht eine Person alle Drehdaten, die Crewliste, das Drehbuch und das Blocking, aber keine Verwaltung. Mit Rolle sieht sie nur die Bereiche, die die Rolle erlaubt.")+'</p>'+(window.simPicker?window.simPicker():"")+
    '<div class="arole fixed"><div class="arh"><div class="arn"><b>'+L("Owner")+'</b><small>'+L("Alles, auch Rollen, Admins, Sperren und Backup")+'</small></div></div></div>'+
    row("admin",L("Admin"),ADM.adminPerms||ADMIN_DEFAULT,true)+
    roles.map(ro=>row(ro.id,ro.name||ro.id,arr(ro.perms),false)).join("")+
    (ADM.redit==="new"?'<form class="arolef new" data-role=""><h4>'+L("Neue Rolle")+'</h4><label class="arl">'+L("Name der Rolle")+'<input name="rn" maxlength="40" required placeholder="'+esc(L("Name der Rolle, z. B. Catering"))+'"></label>'+permBoxes(VIEWPERMS)+'<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Rolle erstellen")+'</button>'+dlgBtn("lnk",'data-redit="new"',"Abbrechen")+'</div></form>':
      (canRoleEdit()?'<button type="button" class="abtn" data-redit="new">+ '+L("Neue Rolle")+'</button>':''))+'</div>'+permAccessSec();
}
/* who has which permission: every option can be opened and lists the people (owners, admins, roles; people without a role where allowed) */
function permAccessSec(){
  const nameOf=e=>{const m=ADM.mem.find(x=>x.email===e),i=ADM.inv.find(x=>x.id===e),cp=(typeof crewPerson==="function"&&crewPerson(e))||{};return (m&&([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name))||(i&&i.name)||cp.name||e};
  const everyone=[...new Set(ADM.mem.map(m=>m.email).concat(ADM.inv.map(i=>i.id)).concat(ADMINS))].filter(Boolean);
  const rp=id=>{const r=(ADM.roles||[]).find(x=>x.id===id);return r?arr(r.perms):[]};const aperm=ADM.adminPerms||ADMIN_DEFAULT;
  const noRoleOK=k=>({"view.phone":"phone","view.email":"email","view.mycal":"mycal"})[k];
  const who=k=>everyone.map(e=>{if(ADMINS.includes(e))return [e,L("Owner")];if(ADM.adm.includes(e))return aperm.includes(k)?[e,L("Admin")]:null;const id=ADM.ur[e];
      if(id)return rp(id).includes(k)?[e,((ADM.roles||[]).find(x=>x.id===id)||{}).name||id]:null;const pk=noRoleOK(k);return pk&&window.PUBV&&window.PUBV[pk]?[e,L("Keine Rolle")]:null}).filter(Boolean)
    .sort((a,b)=>nameOf(a[0]).localeCompare(nameOf(b[0]),LANG));
  return '<div class="admins pacc"><h3>'+L("Wer hat welchen Zugriff?")+'</h3><p class="ahint">'+L("Tippe auf eine Berechtigung, um zu sehen, wer sie hat – und über welche Rolle.")+'</p>'+
    [...new Set(PERMS.map(x=>x[2]))].map(g=>'<h5 class="paccg">'+esc(L(g))+'</h5>'+PERMS.filter(x=>x[2]===g).map(([k,t])=>{const w=who(k);
      /* roles first – switch the permission on or off for a role right here; the people below, to open */
      const rl=[['owner',L("Owner"),true,false]].concat([['admin',L("Admin"),aperm.includes(k),isAdmin()&&k!=="settings"]])
        .concat((ADM.roles||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),LANG)).map(r=>[r.id,r.name||r.id,arr(r.perms).includes(k),canRoleEdit()&&(isAdmin()||(r.id!==MYROLE&&MYPERMS.includes(k)))]));
      const nr=noRoleOK(k);if(nr)rl.push(['',L("Keine Rolle"),!!(window.PUBV&&window.PUBV[nr]),false]);
      const edit=ADM.paccEdit===k,canEd=rl.some(x=>x[3]);
      return '<details class="paccd" data-sec="pacc-'+k+'"'+(SECS["pacc-"+k]||edit?' open':'')+'><summary><span>'+esc(L(t))+'</span>'+(canEd?'<button type="button" class="paccpen'+(edit?' on':'')+'" data-paccedit="'+k+'" '+ariaTip(L("Rollen ändern"))+'><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>':'')+'<b class="pacn">'+w.length+'</b></summary>'+
        (edit?'<div class="paccr">'+rl.map(([id,n,on,ed])=>'<label class="ck paccrole'+(ed?'':' plock')+'"><input type="checkbox" data-pacc="'+esc(id)+'" data-perm="'+k+'"'+(on?' checked':'')+(ed?'':' disabled')+'> '+esc(n)+'</label>').join("")+'</div>'
          :'<div class="paccr">'+(rl.filter(x=>x[2]).map(x=>'<span class="ust role">'+esc(x[1])+'</span>').join("")||'<span class="ghint">'+esc(L("Keine Rolle"))+'</span>')+'</div>')+
        '<details class="paccp" data-sec="paccp-'+k+'"'+(SECS["paccp-"+k]?' open':'')+'><summary>'+esc(L("Personen"))+' ('+w.length+')</summary>'+
        (w.length?'<ul class="paccl">'+w.map(([e,r])=>'<li><span>'+esc(nameOf(e))+'</span><span class="ust role">'+esc(r)+'</span></li>').join("")+'</ul>':'<p class="ghint">'+L("Niemand")+'</p>')+'</details></details>'}).join("")).join("")+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-paccedit]");if(!b)return;e.preventDefault();e.stopPropagation();const k=b.dataset.paccedit;ADM.paccEdit=ADM.paccEdit===k?"":k;if(ADM.paccEdit)SECS["pacc-"+k]=true;render()},true);
/* «Wer hat welchen Zugriff?»: a permission switched on/off for a role directly (same rules as «Bearbeiten»: no self-promotion) */
document.addEventListener("change",async e=>{const c=e.target.closest("input[data-pacc]");if(!c)return;const id=c.dataset.pacc,k=c.dataset.perm,on=c.checked;
  if(!id||id==="owner"||(id==="admin"&&!isAdmin())||(id!=="admin"&&!canRoleEdit())||(!isAdmin()&&(id===MYROLE||!MYPERMS.includes(k)))){render();return}
  const ro=id==="admin"?{name:"Admin",perms:(ADM.adminPerms||ADMIN_DEFAULT).slice()}:Object.assign({},(ADM.roles||[]).find(x=>x.id===id)||{});if(id!=="admin"&&!ro.name&&!ro.perms){render();return}
  const before=arr(ro.perms).slice(),perms=[...new Set(on?before.concat([k]):before.filter(p=>p!==k))].filter(p=>PERMS.some(x=>x[0]===p));
  const apply=ps=>{if(id==="admin")ADM.adminPerms=ps;else{const r=(ADM.roles||[]).find(x=>x.id===id);if(r)r.perms=ps}};
  apply(perms);render();
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"roles",id),{name:ro.name||id,perms,at:F.serverTimestamp()});showMsg(L("Rolle gespeichert."),2000)}
  catch(err){apply(before);render();showMsg(admErr(err),6000)}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-redit]");if(b&&canRoleEdit()&&(b.dataset.redit!=="admin"||isAdmin())){ADM.redit=ADM.redit===b.dataset.redit?"":b.dataset.redit;render();return}
  if(e.target.closest("[data-rreset]")&&canRoleEdit()){const f=e.target.closest("form");f.querySelectorAll('input[name=rp]').forEach(x=>{x.checked=ADMIN_DEFAULT.includes(x.value)})}});
document.addEventListener("submit",async e=>{const f=e.target.closest("form.arolef");if(!f)return;e.preventDefault();if(!canRoleEdit()||(f.dataset.role==="admin"&&!isAdmin()))return;
  const name=String(f.rn.value||"").trim().slice(0,40),perms=readBoxes(f,"rp").filter(p=>PERMS.some(x=>x[0]===p)&&(isAdmin()||MYPERMS.includes(p)));if(!name)return;
  /* rights of this role the editor does not have himself (shown greyed out) stay as they are – they were silently removed before */
  if(!isAdmin()&&f.dataset.role){const cur=((ADM.roles||[]).find(x=>x.id===f.dataset.role)||{}).perms||[];for(const p of cur)if(!MYPERMS.includes(p)&&!perms.includes(p))perms.push(p)}
  let id=f.dataset.role;if(!id){id=fold(name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"rolle";if((ADM.roles||[]).some(x=>x.id===id))id+="-"+Date.now().toString(36).slice(-4)}
  const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"roles",id),{name,perms,at:F.serverTimestamp()});ADM.redit="";showMsg(L("Rolle gespeichert."),2500);document.activeElement&&document.activeElement.blur&&document.activeElement.blur();await admLoad()}
  catch(err){if(btn)btn.disabled=false;console.error(err);{const m=f.querySelector(".amsg");if(m){m.className="amsg";m.textContent=admErr(err)}}showMsg(admErr(err),9000)}});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rdel]");if(!b||!canRoleEdit())return;const id=b.dataset.rdel,ro=(ADM.roles||[]).find(x=>x.id===id)||{};
  if(!confirmSafe(L("Rolle «{r}» löschen? Personen mit dieser Rolle verlieren ihre Berechtigungen.").replace("{r}",ro.name||id)))return;
  try{const {F,db}=await fb();for(const em of Object.keys(ADM.ur||{}))if(ADM.ur[em]===id)await F.deleteDoc(F.doc(db,"userroles",em));await F.deleteDoc(F.doc(db,"roles",id));showMsg(L("Rolle gelöscht."),2500);await admLoad()}
  catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}});
document.addEventListener("change",async e=>{const sl=e.target.closest("select[data-urole]");if(!sl||!canRoleAssign())return;e.stopPropagation();await setUserRole(sl.dataset.urole,sl.value,sl)},true);
/* give a person a role (owner, admin, a role or none): from the user list and from the role management */
async function setUserRole(em,v,sl){if(!canRoleAssign()||!canRole(em)||(v==="owner"&&!isOwner())||(v==="admin"&&!isAdmin())){render();return}
  /* applied right away in the list (no full reload); written in the background, undone on error. Owners are managed by owners only */
  const prev={ur:ADM.ur[em],adm:ADM.adm.includes(em),own:ADMINS.includes(em)};
  const setLocal=(own,adm,ur)=>{const k=ADMINS.indexOf(em);if(own&&k<0)ADMINS.push(em);if(!own&&k>=0)ADMINS.splice(k,1);ADM.own=(ADM.own||[]).filter(x=>x!==em);if(own)ADM.own.push(em);ADM.adm=ADM.adm.filter(x=>x!==em);if(adm)ADM.adm.push(em);if(ur)ADM.ur[em]=ur;else delete ADM.ur[em]};
  setLocal(v==="owner",v==="admin",v&&v!=="owner"&&v!=="admin"?v:"");
  try{sl&&sl.blur()}catch(_){}admIndex&&admIndex();render();
  try{const {F,db}=await fb();
    if(v==="owner")await F.setDoc(F.doc(db,"owners",em),{addedAt:F.serverTimestamp()});
    else if(prev.own)await F.deleteDoc(F.doc(db,"owners",em));
    if(v==="admin"){if(!prev.adm)await F.setDoc(F.doc(db,"admins",em),{addedAt:F.serverTimestamp()})}else if(prev.adm)await F.deleteDoc(F.doc(db,"admins",em));
    if(v&&v!=="owner"&&v!=="admin")await F.setDoc(F.doc(db,"userroles",em),{role:v,at:F.serverTimestamp()});else if(prev.ur)await F.deleteDoc(F.doc(db,"userroles",em));
    showMsg(L("Rolle gespeichert."),2500)}
  catch(err){console.error(err);setLocal(prev.own,prev.adm,prev.ur);render();
    showMsg(admErr(err),9000)}}
/* user list: one compact card per person, filter chips with counts, actions folded away */
const initials=n=>String(n||"?").split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("")||"?";
function userList(rows,vis,o){
  const F=[["all","Alle"],["online","Online"],["act","Aktiv"],["inv","Eingeladen"],["off","Gesperrt"],["adm","Mit Rolle"],["app","App installiert"],["web","Ohne App"]];
  const chips='<div class="ufil" role="group">'+F.filter(([k])=>k==="all"||ADM.cnt[k]).map(([k,t])=>'<button type="button" data-auf="'+k+'" aria-pressed="'+(ADM.uf===k)+'">'+L(t)+' <span>'+ADM.cnt[k]+'</span></button>').join("")+'</div>';
  const card=r=>{
    const own=o.own,isOwn=ADMINS.includes(r.email),cp=crewPerson(r.email)||{},open=ADM.edit===r.email||ADM.open.has(r.email),nm=r.name||cp.name||"";
    const badge=o.isAdm(r.email)?'<span class="ust adm">'+L(isOwn?"Owner":"Admin")+'</span>':(o.roleOf(r.email)?'<span class="ust role">'+esc(o.roleName(o.roleOf(r.email)))+'</span>':'<span class="ust norole">'+esc(L("Keine Rolle"))+'</span>');
    const acts=[
      o.cEd&&(own||!isOwn)?'<button class="cico'+(ADM.edit===r.email?' on':'')+'" data-adm="edit" data-em="'+esc(r.email)+'" '+ariaTip(L(ADM.edit===r.email?"Schliessen":"Bearbeiten"))+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(ADM.edit===r.email?'<path d="M18 6 6 18M6 6l12 12"/>':'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')+'</svg></button>':'',
      own&&r.m?'<button data-adm="pwreset" data-em="'+esc(r.email)+'">'+L("Passwort-Link senden")+'</button>':'',
      own&&!r.m&&!isOwn?'<button data-adm="nomail" data-em="'+esc(r.email)+'">'+L("Ohne Bestätigungs-Mail freischalten")+'</button>':'',
      own&&!r.m&&!isOwn?'<button data-adm="startpw" data-em="'+esc(r.email)+'" data-nm="'+esc(r.name||"")+'">'+L("Startpasswort erzeugen")+'</button>':'',
      !r.m&&o.cInv?'<a class="abtnl" href="'+o.mail(r)+'">✉ '+L("Einladungsmail")+'</a>':'',
      !r.m&&o.cInv?'<button type="button" class="abtnl" data-cwa="'+esc(r.email)+'" data-nm="'+esc(r.name||(crewPerson(r.email)||{}).name||"")+'" data-ph="'+esc((crewPerson(r.email)||{}).phone||"")+'">💬 '+L("Per WhatsApp einladen")+'</button>':'',
      own&&r.m&&!isOwn?(r.m.active===true?'<button class="warn" data-adm="block" data-uid="'+esc(r.m.uid)+'">'+L("Sperren")+'</button>':'<button data-adm="unblock" data-uid="'+esc(r.m.uid)+'">'+L("Entsperren")+'</button>'):'',
      isOwn?'':own&&r.m?'<button class="warn" data-adm="remove" data-uid="'+esc(r.m.uid)+'" data-em="'+esc(r.email)+'">'+L("Entfernen")+'</button>':(r.inv&&!r.m&&o.cInv?'<button class="warn" data-adm="uninvite" data-em="'+esc(r.email)+'">'+L("Einladung löschen")+'</button>':'')
    ].filter(Boolean);
    const hasActs=true;
    /* details (function, contact, language, last online, tour, profile) only in the opened card */
    const det='<div class="udet">'+(cp.role||(r.m&&r.m.func)?'<div class="udl"><span>'+L("Funktion")+'</span><b>'+esc(cp.role||r.m.func)+'</b></div>':'')+
      '<div class="udl"><span>'+L("E-Mail")+'</span><a class="em" href="mailto:'+esc(r.email)+'">'+esc(r.email)+'</a></div>'+
      (r.m&&r.m.lang?'<div class="udl"><span>'+L("Sprache")+'</span><b>'+esc(r.m.lang.toUpperCase())+'</b></div>':'')+
      (r.m&&r.m?'<div class="udl"><span>'+L("Einführungstour")+'</span><b>'+esc(tourInfo(r.m))+'</b></div>':'')+userInfo(r)+'</div>';
    return '<div class="ucard'+(r.m&&r.m.active!==true?' blocked':'')+(open?' open':'')+'">'+
      '<div class="uhd"><span class="uav'+(r.m&&isOnline(r.m)?' on':'')+'" aria-hidden="true">'+esc(initials(nm||r.email))+'</span><div class="umain"><div class="unm"><b>'+esc(nm||r.email)+'</b></div><div class="ubadges">'+o.st(r)+badge+'</div>'+
      (()=>{const ph=(r.m&&r.m.phone)||cp.phone||"",ce=(r.m&&r.m.contactEmail)||r.email;const ak=String(r.m&&r.m.app||""),dv={ios:"iPhone",android:"Android",desktop:"Computer"}[ak.split("-")[1]]||"";
          const DV={ios:"iPhone",android:"Android",desktop:"Computer"},devs=Object.values((r.m&&r.m.devs)||{}).map(x=>String(x).split("|")).filter(x=>Date.now()-(+x[1]||0)<30*864e5);
          const devTxt=devs.length?devs.length+" "+L(devs.length===1?"Gerät":"Geräte"):"",devTip=devs.map(x=>(x[0].startsWith("app-")?"App":"Browser")+" · "+(DV[x[0].split("-")[1]]||"")).join(", ");
          const bits=[r.m&&seenText(r.m)?'<span class="useen'+(isOnline(r.m)?' on':'')+'">'+esc(seenText(r.m))+'</span>':'',ak?'<span class="uapp'+(ak.startsWith("app-")?' on':'')+'" title="'+esc(L("zuletzt genutzt"))+'">'+esc((ak.startsWith("app-")?L("App installiert"):L("im Browser"))+(dv?" · "+dv:""))+'</span>':'',devTxt?'<span class="udev" title="'+esc(devTip)+'">'+esc(devTxt)+'</span>':''].filter(Boolean);
          /* phone and e-mail on a line of their own */
          const con=[ph?'<a href="tel:'+esc(telNum(ph))+'">'+esc(ph)+'</a>':'',ce?'<a href="mailto:'+esc(ce)+'">'+esc(ce)+'</a>':''].filter(Boolean);
          return (bits.length?'<div class="usub">'+bits.join(' · ')+'</div>':'')+(con.length?'<div class="usub ucon">'+con.join(' · ')+'</div>':'')})()+'</div>'+
      (hasActs?'<button type="button" class="umore" data-uact="'+esc(r.email)+'" aria-expanded="'+open+'" '+ariaTip(L("Aktionen"))+'><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>':'')+'</div>'+
      (own&&ADM.pw&&ADM.pw[r.email]?'<div class="pwrow">'+L("Startpasswort")+': <b class="pwshow2">'+esc(ADM.pw[r.email])+'</b> <button type="button" data-pwshow="'+esc(r.email)+'">'+L("Anzeigen")+'</button></div>':'')+
      (open?'<div class="ubody">'+det+(o.cEd&&ADM.edit===r.email?editForm(r,true):'')+(acts.length?'<div class="aacts">'+acts.join("")+'</div>':'')+'</div>':'')+
    '</div>'};
  const SORTS=[["first","Vorname"],["name","Nachname"],["dept","Abteilung"],["status","Status"],["role","Rolle"],["new","Neueste zuerst"],["seen","Zuletzt online"],["email","E-Mail"]];
  const sortSel='<label class="usort">'+L("Sortieren")+' <select data-usort>'+SORTS.map(([k,t])=>'<option value="'+k+'"'+((ADM.sort||"first")===k?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>';
  const onl=rows.filter(r=>r.m&&isOnline(r.m)).map(r=>r.name||(crewPerson(r.email)||{}).name||r.email);
  return '<div class="admins ulist"><h3>'+L("Alle Benutzenden")+' <span class="ust">'+rows.length+'</span></h3>'+

    '<input class="search" id="aq" type="search" placeholder="'+esc(L("Name, E-Mail oder Funktion suchen"))+'" value="'+esc(ADM.q)+'">'+'<div class="ubar">'+chips+sortSel+'<button type="button" class="cico uall" data-uall '+ariaTip(L(vis.length&&vis.every(r=>ADM.open.has(r.email))?"Alle zuklappen":"Alle aufklappen"))+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+(vis.length&&vis.every(r=>ADM.open.has(r.email))?'<path d="m7 11 5-5 5 5M7 18l5-5 5 5"/>':'<path d="m7 6 5 5 5-5M7 13l5 5 5-5"/>')+'</svg></button></div>'+
    (vis.length?'<div class="ucards">'+vis.map(card).join("")+'</div>':'<p class="ahint">'+L("Keine Treffer.")+'</p>')+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-auf]");if(b){ADM.uf=b.dataset.auf;render();return}
  const t=e.target.closest("[data-uact]");if(t){const em=t.dataset.uact;const was=ADM.open.has(em)||ADM.edit===em;if(was){ADM.open.delete(em);if(ADM.edit===em)ADM.edit=""}else ADM.open.add(em);ADM.act=em;render();return}
  const all=e.target.closest("[data-uall]");if(all){const ems=[...document.querySelectorAll(".ucards [data-uact]")].map(x=>x.dataset.uact);const anyClosed=ems.some(x=>!ADM.open.has(x));ADM.open=new Set(anyClosed?ems:[]);if(!anyClosed)ADM.edit="";render()}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-dorefresh]");if(!b)return;const r=$("#refresh");if(r)r.click()});
try{ADM.sort=localStorage.getItem("usort")||"first"}catch(_){ADM.sort="first"}
document.addEventListener("change",e=>{const sl=e.target.closest("select[data-usort]");if(!sl)return;ADM.sort=sl.value;try{localStorage.setItem("usort",ADM.sort)}catch(_){}render()});
try{ADM.sub=localStorage.getItem("admsub")||"users"}catch(_){ADM.sub="users"}
document.addEventListener("click",e=>{const b=e.target.closest("[data-asub]");if(!b)return;ADM.sub=b.dataset.asub;try{localStorage.setItem("admsub",ADM.sub)}catch(_){}window.scrollTo(0,0);render()});
VIEWS.admin=function(){
  if(!canAdm())return '<div class="empty">'+L("Für die App-Verwaltung fehlt die Berechtigung.")+'</div>';
  if(ADM.loaded&&!ADM.busy&&!ADM.loading&&Date.now()-(ADM.at||0)>300000){ADM.loading=true;admLoad().catch(()=>{}).finally(()=>{ADM.loading=false})}
  if(!ADM.loaded){if(!ADM.loading){ADM.loading=true;admLoad().catch(err=>{console.error(err);showMsg(L("Liste der Benutzer:innen konnte nicht geladen werden:")+" "+(err.message||err),6000)}).finally(()=>{ADM.loading=false})}return '<div class="empty">'+L("Lade Benutzer:innen …")+'</div>'}
  const memBy={};ADM.mem.forEach(m=>memBy[m.email]=m);
  const invBy={};ADM.inv.forEach(i=>invBy[i.id]=i);
  const rows=[];const seen=new Set();
  /* display name: crew list first, otherwise the first/last name the person entered */
  const nm=m=>{if(!m)return"";const cp=crewPerson(m.email);return (cp&&cp.name)||[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||""};
  for(const i of ADM.inv){const m=memBy[i.id];rows.push({email:i.id,name:nm(m)||i.name||"",inv:true,m});seen.add(i.id)}
  for(const m of ADM.mem)if(!seen.has(m.email))rows.push({email:m.email,name:nm(m),inv:false,m});
  /* sortable: name, first name, status, role, newest, department (crew list), e-mail */
  {const nmOf=r=>r.name||(crewPerson(r.email)||{}).name||r.email,last=r=>{const w=String(nmOf(r)).trim().split(/\s+/);return w.length>1?w[w.length-1]:w[0]};
   const stOf=r=>r.m?(r.m.active===true?0:2):1,rk=r=>ADMINS.includes(r.email)?0:ADM.adm.includes(r.email)?1:ADM.ur[r.email]?2:3;
   const ts=r=>{const j=r.m&&r.m.joinedAt;return j?(j.seconds?j.seconds*1000:Date.parse(j)||0):0};
   const dep=r=>{for(const g of S.crew)for(const p of arr(g.people))if(lc(p.email)===r.email)return g.dept||"";return "~"};
   const by={name:(a,b)=>String(last(a)).localeCompare(last(b),LANG)||String(nmOf(a)).localeCompare(nmOf(b),LANG),first:(a,b)=>String(nmOf(a)).localeCompare(nmOf(b),LANG),status:(a,b)=>stOf(a)-stOf(b),role:(a,b)=>rk(a)-rk(b),new:(a,b)=>ts(b)-ts(a),seen:(a,b)=>seenMs(b.m)-seenMs(a.m),dept:(a,b)=>dep(a).localeCompare(dep(b),LANG),email:(a,b)=>a.email.localeCompare(b.email)};
   const f=by[ADM.sort]||by.first;rows.sort((a,b)=>f(a,b)||by.first(a,b))}
  const q=lc(ADM.q);const UF={online:r=>!!r.m&&isOnline(r.m),all:()=>true,act:r=>r.m&&r.m.active===true,inv:r=>!r.m,off:r=>r.m&&r.m.active!==true,adm:r=>ADMINS.includes(r.email)||ADM.adm.includes(r.email)||!!ADM.ur[r.email],app:r=>String(r.m&&r.m.app||"").startsWith("app-"),web:r=>!!r.m&&r.m.active===true&&!String(r.m.app||"").startsWith("app-")};
  if(!UF[ADM.uf])ADM.uf="all";
  const vis=rows.filter(r=>(!q||(r.email+" "+r.name+" "+((crewPerson(r.email)||{}).role||"")).toLowerCase().includes(q))&&UF[ADM.uf](r));
  ADM.cnt=Object.fromEntries(Object.keys(UF).map(k=>[k,rows.filter(UF[k]).length]));
  const newCrew=crewEmails().filter(c=>!invBy[c.email]&&!memBy[c.email]);
  const st=r=>r.m?(r.m.active===true?'<span class="ust ok">'+(LANG==="de"?"aktiv":L("aktiv_1"))+'</span>':'<span class="ust off">'+L("gesperrt")+'</span>'):'<span class="ust wait">'+L("eingeladen")+'</span>';
  const site=location.origin+location.pathname;
  const mail=r=>mailto(r.email,"invite",{vorname:String(r.name||(crewPerson(r.email)||{}).name||"").split(/\s+/)[0],name:r.name||""});
  const own=isOwner();const isAdm=e=>ADMINS.includes(e)||ADM.adm.includes(e);
  const admSec=own?'<div class="admins"><h3>'+L("Administrator:innen")+'</h3><p class="ahint">'+L("Administrator:innen können Leute einladen und sehen in der Crew Essen und Geburtstage. Sperren und Entfernen kannst nur du. Admins und andere Rollen weist du unten bei der Person unter «Rolle» zu.")+'</p>'+
    '<div class="arow"><span>'+esc(ADMINS[0])+'</span><span class="ust ok">'+L("Owner")+'</span></div>'+
    ADM.adm.map(e=>[e,((rows.find(r=>r.email===e)||{}).name)||(crewPerson(e)||{}).name||""]).sort((a,b)=>(a[1]||a[0]).localeCompare(b[1]||b[0],LANG)).map(([e,n])=>'<div class="arow"><span>'+esc(n||e)+'</span><button data-adm="rmadmin" data-em="'+esc(e)+'">'+L("Entfernen")+'</button></div>').join("")+
    '</div>':'';
  const srcInner=()=>{const x=typeof srcHTML==="function"?srcHTML():"";return x?x.replace(/^<details[^>]*><summary>[\s\S]*?<\/summary>/,'<div class="src srcin">').replace(/<\/details>$/,'</div>'):'<p class="ghint">–</p>'};
  /* Einstellungen: one form (id setform) whose fields sit in collapsible groups – all open by default */
  const sv='<div class="arb"><button type="submit" form="setform">'+L("Speichern")+'</button></div>';
  const grp=(k,t,body)=>'<details class="admins asetd setgrp alangs" data-sec="set-'+k+'"'+(SECS["set-"+k]!==false?' open':'')+'><summary>'+L(t)+'</summary>'+(k==="up"?'<button type="button" class="uprf" data-dorefresh '+ariaTip(L("Daten jetzt aktualisieren"))+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg></button>':'')+body+'</details>';
  /* Szenen-Protokoll → Google Sheet: the link (config/private), whom to share it with, the last state of the workflow */
  /* the shared Google map (link «Karte») in the callsheet map: on/off, its colours, which layers */
  const gmapSet=()=>{const G=window.GMAPSET||{},ls=(S.gmap&&Array.isArray(S.gmap.l))?S.gmap.l:[],off=new Set(G.off||[]);
    return '<p class="ahint"><b>'+L("Google-Karte im Callsheet")+'</b> – '+L("Punkte, Linien und Flächen der Google-Karte (Link «Karte» unten) in der Callsheet-Karte, nur in der Nähe der Orte des Tages. Punkte, die schon auf der Karte sind, erscheinen nicht doppelt. Die Google-Karte muss mit «Jeder mit dem Link» geteilt sein; übernommen wird sie bei der stündlichen Aktualisierung.")+'</p><div class="chk">'+
      '<label class="ck"><input form="setform" type="checkbox" name="gmo"'+(G.on?' checked':'')+'> '+L("Punkte der Google-Karte in der Callsheet-Karte anzeigen")+'</label>'+
      '<label class="ck"><input form="setform" type="checkbox" name="gmc"'+(G.color!==false?' checked':'')+'> '+L("Farben der Google-Karte übernehmen")+'</label></div>'+
      (ls.length?'<p class="ahint"><b>'+L("Ebenen")+'</b></p><div class="chk">'+ls.map(n=>'<label class="ck"><input form="setform" type="checkbox" name="gml" value="'+esc(n)+'"'+(off.has(n)?'':' checked')+'> '+esc(n)+'</label>').join("")+'</div>':
        '<p class="ghint">'+L("Die Ebenen erscheinen hier nach der nächsten Aktualisierung.")+'</p>')};
  const sheetSet=()=>{const st=window.SHEETST||{},sa=window.SHEETSA||"",E={access:"Kein Zugriff – Sheet mit der Adresse oben als Bearbeiter teilen.",api:"Google Sheets API ist nicht eingeschaltet.",notfound:"Sheet nicht gefunden – Link prüfen."};
    return '<p class="ahint"><b>'+L("Szenen-Protokoll in Google Sheets")+'</b> – '+L("Link zum Google Sheet, in dem das Szenen-Protokoll alle 10 Minuten nachgeführt wird (pro Unit ein Tabellenblatt). Leer = aus.")+'</p>'+
      '<input form="setform" class="amap" type="url" name="ssheet" inputmode="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="'+esc(window.SCENESHEET||"")+'">'+
      '<p class="ghint">'+L("Das Sheet mit dieser Adresse als Bearbeiter teilen:")+' '+(sa?'<b class="sheetsa">'+esc(sa)+'</b>':esc(L("Die Adresse erscheint nach dem nächsten Abgleich (bis 10 Minuten).")))+'<br><a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=tschugger-83692" target="_blank" rel="noopener noreferrer">'+L("Einmalig die Google Sheets API im Firebase-Projekt einschalten")+'</a></p>'+
      (window.SCENESHEET&&st.at?'<p class="ghint">'+(st.ok?esc(L("Zuletzt nachgeführt:"))+' '+esc((z=>pad2(z.getDate())+"."+pad2(z.getMonth()+1)+". "+msHM(st.at))(new Date(st.at)))+(st.n!=null?' · '+st.n+' '+esc(L("Zeilen")):''):esc(L("Fehler:"))+' '+esc(L(E[st.err]||"Unbekannter Fehler")))+'</p>':'')};
  /* all options of the quittances in one box: on/off, the Google Sheet of the scene log, the times */
  const QQ='<p class="ahint"><b>'+L("Quittieren")+'</b> – '+L("Szenen (auch Setup, Lunch und Wrap) und Fahrten im Drehplan und im Callsheet quittieren. Ausgeschaltet: keine Knöpfe, «Jetzt» folgt der Uhrzeit.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="sa"'+(window.SCACKON!==false?' checked':'')+'> '+L("Szenen quittieren")+'</label><label class="ck"><input form="setform" type="checkbox" name="ra"'+(window.RIDEACKON!==false?' checked':'')+'> '+L("Fahrten quittieren")+'</label></div>'+sheetSet();
  const setSec=can("settings")?'<form id="setform" class="alangs" data-adm="langs" novalidate></form>'+
    grp("up","Aktualisieren",(own?upSec():'')+'<p class="ahint"><b>Dropbox</b> – '+L("Eingeschaltet werden Drehplan, Drehbuch, Crewliste, Callsheets und Motivliste jede Stunde automatisch neu geladen (nur gelesen).")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="au"'+(window.AUTOUPD!==false?' checked':'')+'> '+L("Daten aus der Dropbox automatisch laden")+'</label><label class="ck"><input form="setform" type="checkbox" name="fa"'+(window.FAILALARM!==false?' checked':'')+'> '+L("Alarm an Owner und Admins, wenn die Aktualisierung zweimal hintereinander fehlschlägt (Push-Nachricht)")+'</label></div>'+'<p class="ahint"><b>'+L("Motivliste")+'</b> – '+L("Link zum Google Sheet mit den Motiven (Spalten SCRIPT NAME, ADRESSE, SCENES, LINK; «Jeder mit dem Link darf ansehen»). Wird bei der nächsten stündlichen Aktualisierung übernommen. Leer = bisherige Liste.")+'</p><input form="setform" class="amap" type="url" name="sheet" inputmode="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="'+esc(window.LOCSHEET||"")+'">'+sv)+
    grp("prod","Produktion",'<p class="ahint"><b>'+L("Projektname")+'</b> – '+L("Name in der Kopfzeile, auf der Anmeldeseite und in den Exporten. Leer = TSCHUGGER Tigerblood.")+'</p><input form="setform" class="amap" type="text" name="pjn" maxlength="60" placeholder="TSCHUGGER Tigerblood" value="'+esc(window.PROJNAME||"")+'">'+
      '<p class="ahint"><b>'+L("Produktionsfirma")+'</b> – '+L("Name und Adresse, z. B. oben rechts im Szenen-Protokoll (PDF).")+'</p><input form="setform" class="amap" type="text" name="pco" maxlength="80" placeholder="'+esc(L("Name der Produktionsfirma"))+'" value="'+esc(window.PRODCO||"")+'">'+
      '<textarea form="setform" class="amap" name="pad" rows="3" maxlength="300" placeholder="'+esc(L("Adresse"))+'">'+esc(window.PRODADDR||"")+'</textarea>'+sv)+
    grp("events","Termine",'<p class="ahint"><b>'+L("Eigene Termine")+'</b> – '+L("Wer das Recht «Eigene Termine erstellen» hat, kann in «Meine Termine» mit + Termine anlegen und wählen, wer sie sieht (alle, Rollen, Abteilungen oder Personen).")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="oe"'+(window.OWNEV!==false?' checked':'')+'> '+L("Eigene Termine erlauben")+'</label></div>'+(typeof gcalSetSec==="function"?gcalSetSec():'')+sv)+
    grp("langs","Sprachen",'<p class="ahint"><b>'+L("Sprachen")+'</b> – '+L("Nur diese Sprachen stehen in der App zur Auswahl. Mindestens eine.")+'</p><div class="chk">'+LANGS.map(([k,t])=>'<label class="ck"><input form="setform" type="checkbox" name="al" value="'+k+'"'+(APPLANGS.includes(k)?' checked':'')+'> '+t+'</label>').join("")+'</div>'+sv)+
    grp("areas","Bereiche",'<p class="ahint"><b>'+L("Bereiche")+'</b> – '+L("Nur die gewählten Bereiche erscheinen unten in der App. Mindestens einer.")+' '+L("Reihenfolge mit ▲ ▼ ändern.")+'</p><div class="tbord">'+tabOrder0().map(k=>[k,{today:"Today",plan:"Schedule",dispo:"Callsheet",loc:"Locations",crew:"Crew",script:"Script",info:"Info"}[k]]).map(([k,t])=>'<div class="tbrow"><label class="ck"><input form="setform" type="checkbox" name="tb" value="'+k+'"'+(!Array.isArray(window.TABSON)||window.TABSON.includes(k)||(k==="today"&&!window.TABSON.includes("-today"))?' checked':'')+'> '+t+'</label><span class="tbmv"><button type="button" data-tmv="up" aria-label="'+esc(L("Nach oben"))+'">▲</button><button type="button" data-tmv="down" aria-label="'+esc(L("Nach unten"))+'">▼</button></span></div>').join("")+'</div>'+'<div class="chk"><label class="ck"><input form="setform" type="checkbox" name="mn"'+(window.MYNAV!==false?' checked':'')+'> '+L("Jede Person darf die Reihenfolge in «Mein Konto» selber anpassen")+'</label></div>'+'<p class="ahint"><b>Units</b> – '+L("Ausgeschaltete Units verschwinden aus Schedule, Callsheet und Locations. Ist nur die 1st Unit aktiv, entfallen die Unit-Knöpfe.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="u2"'+(window.UNIT2!==false?' checked':'')+'> '+L("2nd Unit anzeigen")+'</label><label class="ck"><input form="setform" type="checkbox" name="u3"'+(window.UNIT3===true?' checked':'')+'> '+L("3rd Unit anzeigen")+'</label></div>'+'<p class="ahint"><b>'+L("Drehbuch")+'</b> – '+L("Eingeschaltet erscheint bei jeder Szene der Knopf «Script», der die Szene im Drehbuch öffnet.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="so"'+(window.SCRIPTON!==false?' checked':'')+'> '+L("Drehbuch anzeigen")+'</label></div>'+sv)+
    grp("misc","Einstellungen",'<p class="ahint"><b>'+L("Karte im Callsheet")+'</b> – '+L("Die Karte mit allen Orten des Tages (Locations, Base, Parking) im Callsheet.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="cm"'+(window.CSMAPON!==false?' checked':'')+'> '+L("Karte im Callsheet anzeigen")+'</label></div>'+gmapSet()+

      '<p class="ahint"><b>'+L("Geburtstage")+'</b> – '+L("Eingeschaltet sehen alle Benutzer:innen in der Crew die Geburtstagsliste der Drehzeit (nur Tag und Monat, ohne Jahrgang).")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="bp"'+(window.BDAYPUB===true?' checked':'')+'> '+L("Geburtstagsliste allen anzeigen")+'</label></div>'+
    '<p class="ahint"><b>'+L("Anmeldung")+'</b> – '+L("Ausgeschaltet verschwindet «Mit Google anmelden» auf der Anmeldeseite. Wer schon mit Google angemeldet ist, bleibt angemeldet.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="go"'+(window.GOOGLEON!==false?' checked':'')+'> '+L("Mit Google anmelden anbieten")+'</label></div>'+
    '<p class="ahint"><b>'+L("Benutzer:innen ohne Rolle")+'</b> – '+L("Personen ohne Rolle sehen weder Drehplan, Drehbuch noch Blocking. Hier kannst du ihnen zusätzlich freigeben:")+'</p><div class="chk">'+
      [["pp","phone","Telefonnummern"],["pe","email","E-Mail-Adressen"],["pm","mycal","Meine Termine"]].map(([n,k,t])=>'<label class="ck"><input form="setform" type="checkbox" name="'+n+'"'+(window.PUBV[k]!==false?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>'+'<p class="ahint"><b>'+L("Karte")+'</b> – '+L("Link zur Karte für den Knopf «Map» in Locations (z. B. Google My Maps). Leer = Standardkarte.")+'</p><input form="setform" class="amap" type="url" name="map" inputmode="url" placeholder="https://www.google.com/maps/d/…" value="'+esc(window.MAPURL||"")+'">'+(typeof chatSetSec==="function"?chatSetSec():'')+sv)+
    grp("acktimes","Quittieren",QQ+'<p class="ahint"><b>'+L("Quittierungszeiten")+'</b> – '+L("Beginn und Ende der quittierten Szenen neben dem Quittierungs-Knopf. Sichtbar nur mit dem Recht «Quittierungszeiten sehen».")+'</p><div class="chk">'+
      [["tpm","pm","Drehplan – Handy"],["tpd","pd","Drehplan – Computer"],["tcm","cm","Callsheet – Handy"],["tcd","cd","Callsheet – Computer"]].map(([n,k,t])=>'<label class="ck"><input form="setform" type="checkbox" name="'+n+'"'+((window.ACKT||{})[k]!==false?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>'+sv)+
    grp("push","Push-Nachrichten",pushStatusSec())+grp("src","Quellen",srcInner())+(own?grp("bk","Backup",bkSec()):''):(own?grp("up","Aktualisieren",upSec())+grp("src","Quellen",srcInner())+grp("bk","Backup",bkSec()):'');
  const SUBS=[];if(can("users.view")||can("users.invite")||can("users.requests")||can("users.edit"))SUBS.push(["users","Benutzerverwaltung"]);if(canRoleEdit()||canRoleAssign()||can("roles.view"))SUBS.push(["roles","Access"]);if(can("settings"))SUBS.push(["docs","Dokumente"],["set","App"]);if(isAdmin()||can("audit.view")||can("scenes.log"))SUBS.push(["log",isAdmin()||can("audit.view")?"Log/Tests":"Log"]);if(!isAdmin()&&can("data.check"))SUBS.push(["test","Test"]);
  if(!SUBS.length)return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(!SUBS.some(x=>x[0]===ADM.sub))ADM.sub=SUBS[0][0];
  const subNav=SUBS.length>1?'<nav class="asub n'+SUBS.length+'" role="tablist">'+SUBS.map(([k,t])=>{const sh={users:"User",roles:"Access",docs:"Docs",set:"App",log:"Log",test:"Test"}[k]||t;if(k==="users")t="User";
    return '<button type="button" role="tab" data-asub="'+k+'" aria-selected="'+(ADM.sub===k)+'"><span class="lgl">'+esc(L(t))+'</span><span class="sml">'+esc(LANG==="de"?sh:L(sh))+'</span></button>'}).join("")+'</nav>':'';
  let h='<section class="adm"><h2 class="dh">'+L("App-Verwaltung")+'</h2>'+subNav;
  if(ADM.sub==="set")return h+setSec+'</section>';
  if(ADM.sub==="docs")return h+docsSec()+'</section>';
  if(ADM.sub==="roles")return h+rolesSec()+'</section>';
  if(ADM.sub==="log")return h+(window.sceneLogSec?window.sceneLogSec():"")+(isAdmin()||can("audit.view")?(window.workerWarnHTML?window.workerWarnHTML():"")+testsSec()+(window.roleTestSec?window.roleTestSec():"")+(isAdmin()&&window.dataCheckSec?window.dataCheckSec():"")+auditSec():"")+'</section>';   /* the scene log at the top */
  if(ADM.sub==="test")return h+'<div class="dcktab">'+(window.dataCheckSec?window.dataCheckSec(true):"")+'</div></section>';
  if(ADM.sub==="bk")return h+bkSec()+'</section>';
  const cInv=can("users.invite"),cView=can("users.view")||can("users.edit"),cEd=can("users.edit");
  /* order: requests, who is online right now, the people, inviting, admins at the end */
  const onl=rows.filter(r=>r.m&&isOnline(r.m));
  const actSec=!cView?'':'<div class="admins uact"><h3><span class="odot" aria-hidden="true"></span>'+L("Gerade aktiv")+' <span class="ust">'+onl.length+'</span></h3>'+(onl.length?'<div class="uactl">'+onl.map(r=>{const nm=r.name||(crewPerson(r.email)||{}).name||r.email;return '<span class="uactp"><span class="uav on" aria-hidden="true">'+esc(initials(nm))+'</span>'+esc(nm)+'</span>'}).join("")+'</div>':'<p class="ghint">'+L("Gerade ist niemand aktiv.")+'</p>')+'</div>';
  h+=(can("users.requests")?reqSec():'')+actSec+(!cView?'':userList(rows,vis,{own,cInv,cEd,isAdm,roleOf,roleName,roleSel,st,mail}))+(!cInv?'':
    '<div class="admins"><h3>'+L("Benutzer:innen einladen")+'</h3><p class="ahint">'+L("Nur eingeladene Adressen können ein Konto erstellen (E-Mail/Passwort oder Google). Gesperrte oder entfernte Personen kommen sofort nicht mehr in die App. Passwort und E-Mail-Adresse verwaltet jede Person selbst.")+'</p>'+
    '<form class="aform" data-adm="add"><input name="em" type="email" placeholder="'+esc(L("E-Mail-Adresse"))+'" required><input name="nm" type="text" placeholder="'+esc(L("Name (optional)"))+'"><button type="submit">'+L("Einladen")+'</button></form>'+
    (newCrew.length?'<button class="abtn" data-adm="crew">'+esc(L("Alle {n} Adressen aus der Crewliste einladen").replace("{n}",newCrew.length))+'</button>':'')+'</div>')+admSec+'</section>';
  return h;
};
document.addEventListener("input",e=>{if(e.target.id==="aq"){ADM.q=e.target.value;const p=e.target.selectionStart;render();const i=$("#aq");if(i){i.focus();i.setSelectionRange(p,p)}}});
document.addEventListener("submit",async e=>{
  const sf=e.target.closest('[data-adm="save"]');if(sf){e.preventDefault();if(!can("users.edit"))return;
    const em=sf.dataset.em,g=n=>{const x=sf.querySelector('[name="'+n+'"]');return x?String(x.value||"").trim():null};
    const m=ADM.mem.find(x=>x.email===em),inv=ADM.inv.find(x=>x.id===em),btn=sf.querySelector("button");if(btn)btn.disabled=true;
    try{const {F,db}=await fb();
      if(m){const fn=g("fn"),ln=g("ln"),d={firstName:fn,lastName:ln,name:[fn,ln].filter(Boolean).join(" ")||m.name||"",lang:g("lg")||m.lang||"de",birthday:g("bd")||"",gender:g("gd")||"",phone:(g("eph")||"").slice(0,40),contactEmail:lc(g("ece")||"").slice(0,120),diet:g("edt")||"none",intol:readBoxes(sf,"eint"),allergies:(g("eal")||"").slice(0,200)};
        await F.updateDoc(F.doc(db,"members",m.uid),d)}
      if(inv||!m){const d={name:(m?[g("fn"),g("ln")].filter(Boolean).join(" "):g("nm"))||"",role:g("rl")||""};
        /* role «Crew» only for a NEW invitation – a deliberate «Keine Rolle» stays when the profile is edited later */
        if(inv)await F.updateDoc(F.doc(db,"invites",em),d);else{await F.setDoc(F.doc(db,"invites",em),Object.assign(d,{addedAt:F.serverTimestamp()}));await assignCrew(em)}}
      else if(g("rl"))await F.setDoc(F.doc(db,"invites",em),{name:[g("fn"),g("ln")].filter(Boolean).join(" "),role:g("rl"),addedAt:F.serverTimestamp()});
      ADM.edit="";ADM.cedit="";showMsg(L("Gespeichert."),3000);await admLoad();render()}
    catch(err){console.error(err);if(btn)btn.disabled=false;showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const fl=e.target.closest('[data-adm="langs"]');
  if(fl){e.preventDefault();if(!can("settings"))return;const l=[...[...fl.elements].filter(x=>x.name==='al'&&x.checked)].map(x=>x.value);
    if(!l.length){showMsg(L("Bitte mindestens eine Sprache wählen."),4000);return}
    const tb=[...[...fl.elements].filter(x=>x.name==='tb'&&x.checked)].map(x=>x.value),tord=[...[...fl.elements].filter(x=>x.name==='tb')].map(x=>x.value);if(!tb.includes("today"))tb.push("-today"); /* «Today» is on unless switched off here */
    if(!tb.filter(x=>x[0]!=="-").length){showMsg(L("Bitte mindestens einen Bereich wählen."),4000);return}
    try{const {F,db}=await fb();const u2=!!fl.elements['u2'].checked,u3=!!fl.elements['u3'].checked,bp=!!fl.elements['bp'].checked,so=!!fl.elements['so'].checked,au=!!fl.elements['au'].checked;const mu=String(fl.elements['map'].value||"").trim();
    if(mu&&!/^https:\/\/\S+$/.test(mu)){showMsg(L("Bitte einen Link mit https:// eingeben."),4000);return}
    const cu=String((fl.elements['chat']||{}).value||"").trim();if(cu&&!/^https:\/\/\S+$/.test(cu)){showMsg(L("Bitte einen Link mit https:// eingeben."),4000);return}
    const sh=String(fl.elements['sheet'].value||"").trim(),ss=String((fl.elements['ssheet']||{}).value||"").trim();
    const gls=[...fl.elements].filter(x=>x.name==='gml'),gmv={on:!!(fl.elements['gmo']||{}).checked,color:!!(fl.elements['gmc']||{checked:true}).checked,off:gls.length?gls.filter(x=>!x.checked).map(x=>x.value):((window.GMAPSET||{}).off||[])};
    if(ss&&!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(ss)){showMsg(L("Bitte einen Google-Sheets-Link eingeben."),4000);return}
    if(sh&&!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(sh)){showMsg(L("Bitte einen Google-Sheets-Link eingeben."),4000);return}
    /* links only for the crew – only written when they were really loaded (else empty fields would delete them for everyone) */
    if(!window.PRIVOK){await loadLangs();render();showMsg(L(window.PRIVOK?"Links neu geladen – bitte prüfen und nochmals speichern.":"Links konnten nicht geladen werden – bitte später nochmals speichern."),6000);return}
    await F.setDoc(F.doc(db,"config","private"),{mapUrl:mu,locSheet:sh,chatUrl:cu,sceneSheet:ss,gmap:gmv},{merge:true});window.GMAPSET=gmv;window.SCENESHEET=ss;
    await F.setDoc(F.doc(db,"config","app"),{langs:l,unit2:u2,unit3:u3,mapUrl:F.deleteField(),bdayPublic:bp,phonePublic:!!(fl.elements['pp']||{}).checked,emailPublic:!!(fl.elements['pe']||{}).checked,mycalPublic:!!(fl.elements['pm']||{}).checked,googleLogin:!!(fl.elements['go']||{}).checked,locSheet:F.deleteField(),script:so,tabs:tb,tabOrder:tord,autoUpdate:au,failAlarm:!!(fl.elements['fa']||{}).checked,ownEvents:!!(fl.elements['oe']||{}).checked,csMap:!!(fl.elements['cm']||{}).checked,sceneAck:!!(fl.elements['sa']||{}).checked,myNav:!!(fl.elements['mn']||{checked:true}).checked,projName:String((fl.elements['pjn']||{}).value||"").trim().slice(0,60),prodCo:String((fl.elements['pco']||{}).value||"").trim().slice(0,80),prodAddr:String((fl.elements['pad']||{}).value||"").trim().slice(0,300),ackTimes:{pm:!!(fl.elements['tpm']||{checked:true}).checked,pd:!!(fl.elements['tpd']||{checked:true}).checked,cm:!!(fl.elements['tcm']||{checked:true}).checked,cd:!!(fl.elements['tcd']||{checked:true}).checked},rideAck:!!(fl.elements['ra']||{}).checked,chatUrl:F.deleteField(),chatEnabled:!!(fl.elements['ca']||{}).checked,pushEnabled:!!(fl.elements['pn']||{}).checked,tourEnabled:!!(fl.elements['to']||{}).checked,a2again:!!(fl.elements['ia']||{}).checked},{merge:true});window.A2AGAIN=!!(fl.elements['ia']||{}).checked;window.MYNAV=!!(fl.elements['mn']||{checked:true}).checked;window.PROJNAME=String((fl.elements['pjn']||{}).value||"").trim().slice(0,60);window.PRODCO=String((fl.elements['pco']||{}).value||"").trim().slice(0,80);window.PRODADDR=String((fl.elements['pad']||{}).value||"").trim().slice(0,300);try{localStorage.setItem("appproj",JSON.stringify([PROJNAME,PRODCO,PRODADDR]))}catch(_){}projApply();window.ACKT={pm:!!(fl.elements['tpm']||{checked:true}).checked,pd:!!(fl.elements['tpd']||{checked:true}).checked,cm:!!(fl.elements['tcm']||{checked:true}).checked,cd:!!(fl.elements['tcd']||{checked:true}).checked};for(const k in ACKT)document.documentElement.classList.toggle("nosct"+k,!ACKT[k]);window.CHATEN=!!(fl.elements['ca']||{}).checked;window.PUSHEN=!!(fl.elements['pn']||{}).checked;try{localStorage.setItem("apppushon",window.PUSHEN?"1":"0")}catch(_){}window.TOUREN=!!(fl.elements['to']||{}).checked;window.OWNEV=!!(fl.elements['oe']||{}).checked;window.CSMAPON=!!(fl.elements['cm']||{}).checked;try{localStorage.setItem("appchaton",window.CHATEN?"1":"0");localStorage.setItem("apptouron",window.TOUREN?"1":"0")}catch(_){}window.CHATURL=cu;try{localStorage.setItem("appchat",cu)}catch(_){}window.TABORDER=tord;try{localStorage.setItem("apptaborder",JSON.stringify(tord))}catch(_){}window.AUTOUPD=au;try{localStorage.setItem("appauto",au?"1":"0")}catch(_){}window.TABSON=tb;try{localStorage.setItem("apptabs",JSON.stringify(tb))}catch(_){}window.SCRIPTON=so;try{localStorage.setItem("appscript",so?"1":"0")}catch(_){}window.LOCSHEET=sh;APPLANGS=l;window.UNIT2=u2;window.UNIT3=u3;window.BDAYPUB=bp;if(bp)syncBdays(true);try{localStorage.setItem("appbdaypub",bp?"1":"0")}catch(_){}window.MAPURL=mu;try{localStorage.setItem("applangs",JSON.stringify(l));localStorage.setItem("appunit2",u2?"1":"0");localStorage.setItem("appunit3",u3?"1":"0");localStorage.setItem("appmap",mu)}catch(_){}applyLangs();render();showMsg(L("Einstellungen gespeichert."),3000)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const f=e.target.closest('[data-adm="add"]');if(!f)return;e.preventDefault();
  const em=lc(String(f.em.value||"").trim()),nm=String(f.nm.value||"").trim().slice(0,80);
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){showMsg(L("Bitte eine gültige E-Mail-Adresse eingeben."),4000);try{f.em.focus()}catch(_){}return}
  const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;
  /* leave the input first – otherwise the page does not refresh while the cursor is still in the field */
  try{document.activeElement&&document.activeElement.blur&&document.activeElement.blur()}catch(_){}
  try{const {F,db}=await fb();
    if(ADM.mem.some(m=>m.email===em)){showMsg(em+" "+L("hat bereits ein Konto."),4000);if(btn)btn.disabled=false;return}
    await F.setDoc(F.doc(db,"invites",em),Object.assign(nm?{name:nm}:{},{addedAt:F.serverTimestamp()}),{merge:true});await assignCrew(em);
    if(!ADM.inv.some(i=>i.id===em))ADM.inv.push({id:em,name:nm});f.reset();admIndex();render();
    showMsg(em+" "+L("eingeladen.")+" "+L("Schick jetzt die Einladungs-Mail (✉ bei der Person)."),6000);admLoad().catch(()=>{})}
  catch(err){console.error(err);showMsg(admErr(err),8000)}
  if(btn)btn.disabled=false;
});
document.addEventListener("click",async e=>{
  const b=e.target.closest("button[data-adm]");if(!b||ADM.busy)return;ADM.busy=true;
  try{
    const {F,db}=await fb();const a=b.dataset.adm;
    if(a==="edit"){ADM.edit=ADM.edit===b.dataset.em?"":b.dataset.em;ADM.busy=false;render();return}
    /* passwords can only be set by the person: send Firebase's reset link, which lets them choose a new one */
    if(a==="startpw"){ADM.busy=false;if(!isOwner())return;const em=b.dataset.em;
      if(!confirmSafe(L("Für {e} ein Konto mit Startpasswort anlegen? Beim ersten Anmelden muss die Person ein eigenes Passwort festlegen.").replace("{e}",em)))return;
      b.disabled=true;try{const pw=await createStartAccount(em,b.dataset.nm||"");ADM.pw=ADM.pw||{};ADM.pw[em]=pw;showStartPw(em,b.dataset.nm||"",pw);await admLoad()}
      catch(err){b.disabled=false;const c=err&&err.code||"";showMsg(/email-already-in-use/.test(c)?em+" "+L("hat schon ein Konto – dafür «Passwort-Link senden» verwenden."):/permission/.test(c)?L("Keine Berechtigung – bitte die neuen Firestore-Regeln in Firebase veröffentlichen."):L("Fehler:")+" "+errText(err),9000)}
      return}
    if(a==="nomail"){ADM.busy=false;if(!isOwner())return;const em=lc(b.dataset.em);
      if(!confirmSafe(L("{e} ohne Bestätigungs-Mail freischalten? Nur machen, wenn die Adresse sicher dieser Person gehört.").replace("{e}",em)))return;
      await F.setDoc(F.doc(db,"starts",em),{mustChange:false,at:F.serverTimestamp()});
      if(!ADM.inv.some(i=>i.id===em))await F.setDoc(F.doc(db,"invites",em),{name:"",role:"",addedAt:F.serverTimestamp()});await assignCrew(em);
      showMsg(em+" "+L("ist freigeschaltet. Die Person meldet sich einfach an – oder tippt auf «Ich habe bestätigt»."),7000);await admLoad();return}
    if(a==="pwreset"){ADM.busy=false;if(!isOwner())return;const em=b.dataset.em;
      if(!confirmSafe(L("{e} einen Link schicken, mit dem die Person ein neues Passwort festlegt?").replace("{e}",em)))return;
      const {A,auth}=await fb();await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),em);
      showMsg(L("Link für ein neues Passwort gesendet an")+" "+em+". "+L("Schau auch im Spam-Ordner nach."),6000);return}
    if(a==="reqok"||a==="reqno"){const em=b.dataset.em,q=(ADM.req||[]).find(x=>x.id===em)||{};
      if(a==="reqok"){await F.setDoc(F.doc(db,"invites",em),{name:String(q.name||"").slice(0,80),role:String(q.role||"").slice(0,80),addedAt:F.serverTimestamp()});await assignCrew(em);await notifyApproved(em,q)}
      await F.deleteDoc(F.doc(db,"requests",em));ADM.req=(ADM.req||[]).filter(x=>x.id!==em);
      showMsg(a==="reqok"?L("Freigeschaltet:")+" "+(q.name||em):L("Anfrage abgelehnt."),4000);ADM.busy=false;await admLoad();return}
    if(a==="crew"){const list=crewEmails().filter(c=>!ADM.inv.some(i=>i.id===c.email)&&!ADM.mem.some(m=>m.email===c.email));
      if(confirmSafe(L("{n} Adressen aus der Crewliste einladen?").replace("{n}",list.length))){
        for(let i=0;i<list.length;i+=200){const batch=F.writeBatch(db);list.slice(i,i+200).forEach(c=>{batch.set(F.doc(db,"invites",c.email),{name:c.name,role:c.role,addedAt:F.serverTimestamp()});if(!ADM.ur[c.email]&&!ADM.adm.includes(c.email)&&!ADMINS.includes(c.email))batch.set(F.doc(db,"userroles",c.email),{role:"crew",at:F.serverTimestamp()})});await batch.commit()}
        showMsg(L("{n} Adressen eingeladen.").replace("{n}",list.length),4000)}}
    else if((a==="block"||a==="remove"||a==="uninvite")&&ADMINS.includes(b.dataset.em||(ADM.mem.find(m=>m.uid===b.dataset.uid)||{}).email)){showMsg(L("Der Owner kann nicht gesperrt oder entfernt werden."),4000)}
    else if(a==="block"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:false});showMsg(L("Gesperrt."),3000)}
    else if(a==="unblock"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:true});showMsg(L("Entsperrt."),3000)}
    else if(a==="remove"){if(confirmSafe(L("{e} entfernen? Die Person kommt danach nicht mehr in die App.").replace("{e}",b.dataset.em))){await F.deleteDoc(F.doc(db,"invites",b.dataset.em)).catch(()=>{});await F.deleteDoc(F.doc(db,"userroles",lc(b.dataset.em))).catch(()=>{});await F.deleteDoc(F.doc(db,"members",b.dataset.uid));showMsg(L("Entfernt."),3000)}}
    else if(a==="mkadmin"&&isAdmin()&&!ADMINS.includes(b.dataset.em)){await F.setDoc(F.doc(db,"admins",b.dataset.em),{addedAt:F.serverTimestamp()});showMsg(b.dataset.em+" "+L("ist jetzt Admin."),3000)}
    else if(a==="rmadmin"&&isAdmin()&&!ADMINS.includes(b.dataset.em)){if(confirmSafe(L("{e} die Admin-Rechte entziehen?").replace("{e}",b.dataset.em))){await F.deleteDoc(F.doc(db,"admins",b.dataset.em));showMsg(L("Admin-Rechte entzogen."),3000)}}
    else if(a==="uninvite"){await F.deleteDoc(F.doc(db,"invites",b.dataset.em));showMsg(L("Einladung gelöscht."),3000)}
    await admLoad();
  }catch(err){console.error(err);showMsg(L("Fehler:")+" "+(err.message||err),6000)}
  ADM.busy=false;
});
/* Crew tab: admins see food preferences next to each person (matched by e-mail) */
/* Crew tab (admins only): toggles for food preferences and birthdays */
/* food + birthdays are on by default for admins; the choice is remembered (v2 keys reset older "off" states) */
const ADMV={food:true,bday:true,acct:true};try{for(const k in ADMV){const v=localStorage.getItem("admv2:"+k);if(v!==null)ADMV[k]=v==="1"}}catch(_){}
const ensureAdm=()=>{if(!ADM.loaded&&!ADM.busy&&!ADM.loading&&!ADM.err){ADM.loading=true;admLoad().then(()=>{ADM.err=""}).catch(err=>{console.error(err);ADM.err=String((err&&(err.code||err.message))||err);render()}).finally(()=>{ADM.loading=false})}};
/* crew entry -> member: same e-mail, otherwise same first + last name */
const nkey=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z]+/g," ").trim();
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
    const ou=URL.createObjectURL(new Blob([pt],{type:/\.mp4\.bin$/.test(f)?"video/mp4":/\.pdf\.bin$/.test(f)?"application/pdf":"image/jpeg"}));BLKURL.set(f,ou);blkTrim();return ou})().catch(err=>{BLKIMG.delete(f);throw err}));
  return BLKIMG.get(f);
};
/* decrypted pictures/videos stay in memory only up to a limit: the oldest ones not shown on the page are freed
   (browsing many blocking videos on a phone otherwise filled the memory until the tab was closed) */
const BLKURL=new Map();
function blkTrim(){if(BLKURL.size<=60)return;for(const [f,u] of BLKURL){if(BLKURL.size<=40)break;
  let used=false;try{used=!!document.querySelector('[src="'+u+'"]')||!!document.querySelector('[href="'+u+'"]')}catch(_){}
  if(used)continue;try{URL.revokeObjectURL(u)}catch(_){}BLKURL.delete(f);BLKIMG.delete(f)}}
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
  const edForm=canEd&&ADM.cedit===ue?editForm({email:ue,m,name:p.name,role:p.role},true):"";
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


/* role management: a person into a role (select) or out of it (× → no role) */
document.addEventListener("change",async e=>{const sl=e.target.closest("select[data-rpadd]");if(!sl||!sl.value)return;e.stopPropagation();const id=sl.dataset.rpadd;SECS["rppl-"+id]=true;await setUserRole(sl.value,id,sl)},true);
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rpout]");if(!b)return;e.preventDefault();const em=b.dataset.rpout;
  if(!confirmSafe(L("{n} aus der Rolle nehmen?").replace("{n}",b.closest("li").querySelector("span").textContent)))return;await setUserRole(em,"",null)});
