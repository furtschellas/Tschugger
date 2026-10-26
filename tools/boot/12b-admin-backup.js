import {esc,L,LANG,pad2,S,saveBlob} from "../base/10-core.js";
import {fmtStamp,render} from "../base/15-script-tab.js";
import {ROOT_OWNERS} from "./01-config.js";
import {ME,fb,isOwner,lc} from "./03-core-firebase.js";
import {errText} from "./05-membership-signin.js";
import {ADM,confirmSafe} from "./12a-admin-core.js";
/* ---------- App-Verwaltung (Backup und Aktualisierung) – part of the former 12-admin.js; loaded only when the App-Verwaltung is opened (admin.js) ---------- */
/* ---- backup (main admin only): users, invites, admins, settings, birthdays as one JSON file ---- */
const BK={busy:false,msg:"",ok:false};
export function bkSec(){
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
  /* roles and who has which role belong in the backup too (before, after a restore nobody had a role) */
  const [members,invites,admins,bdays,cfg,roles,userroles,owners,contacts]=await Promise.all([col("members"),col("invites"),col("admins"),col("bdays").catch(()=>[]),F.getDoc(F.doc(db,"config","app")),col("roles").catch(()=>[]),col("userroles").catch(()=>[]),col("owners").catch(()=>[]),col("contacts").catch(()=>[])]);
  /* dates of Firestore as {__ts}: walked BEFORE JSON (a Timestamp turns itself into {seconds,nanoseconds} in JSON.stringify, so the old
     replacer never saw it – a restored «rev» then locked the person out) */
  const plain=v=>v&&typeof v==="object"?(typeof v.toDate==="function"?{__ts:v.toDate().toISOString()}:Array.isArray(v)?v.map(plain):Object.fromEntries(Object.entries(v).map(([k,x])=>[k,plain(x)]))):v;
  /* the links (map, motive list, assistant, scene sheet, Google map) and the Google calendar link belong in the backup too */
  let prv=null,gcal=null;try{const x=await F.getDoc(F.doc(db,"config","private"));if(x.exists())prv=x.data()}catch(_){}try{const x=await F.getDoc(F.doc(db,"secret","gcal"));if(x.exists())gcal=x.data()}catch(_){}
  return plain({app:"tschugger-crew",version:1,createdAt:new Date().toISOString(),by:ME&&ME.email,config:cfg.exists()?cfg.data():null,configPrivate:prv,gcal,members,invites,admins,bdays,roles,userroles,owners,contacts});
}
async function bkDownload(){
  const data=await bkCollect();const t=new Date();
  const name="tschugger-backup-"+t.getFullYear()+"-"+pad2(t.getMonth()+1)+"-"+pad2(t.getDate())+"-"+pad2(t.getHours())+pad2(t.getMinutes())+".json";
  saveBlob(new Blob([JSON.stringify(data,null,1)],{type:"application/json"}),name);
  try{localStorage.setItem("bk:last",t.toISOString())}catch(_){}
  return L("Backup gespeichert")+": "+data.members.length+" "+L("Benutzer:innen")+", "+data.invites.length+" "+L("Einladungen")+".";
}
async function bkRestore(file){
  if(file.size>5e6)throw new Error(L("Datei ist zu gross."));
  let d;try{d=JSON.parse(await file.text())}catch(_){throw new Error(L("Datei ist kein gültiges Backup."))}
  if(!d||d.app!=="tschugger-crew"||!Array.isArray(d.members)||!Array.isArray(d.invites))throw new Error(L("Datei ist kein gültiges Backup."));
  if(!confirmSafe(L("Backup vom {d} wiederherstellen? Vorhandene Einträge werden ergänzt oder überschrieben.").replace("{d}",fmtStamp(d.createdAt||""))))return "";
  const {F,db}=await fb();
  /* dates back to Firestore dates – also from older backup files ({seconds,nanoseconds}) */
  const ts=x=>x&&typeof x==="object"&&(typeof x.__ts==="string"?new Date(x.__ts):(typeof x.seconds==="number"&&typeof x.nanoseconds==="number"&&Object.keys(x).length===2)?new Date(x.seconds*1000+Math.round(x.nanoseconds/1e6)):null);
  const back=v=>JSON.parse(JSON.stringify(v),(k,x)=>{const t=ts(x);return t&&F.Timestamp&&F.Timestamp.fromDate?F.Timestamp.fromDate(t):x});
  /* what was taken away since the backup stays taken away: a blocked person stays blocked («active»), «Auf allen Geräten abmelden» stays («rev»);
     people, admins and owners removed since then come back only when wished */
  const now={};for(const n of ["members","admins","owners","invites","userroles"]){try{now[n]=new Set((await F.getDocs(F.collection(db,n))).docs.map(x=>x.id))}catch(_){now[n]=new Set()}}
  const gone=[["members",d.members],["admins",d.admins],["owners",d.owners],["invites",d.invites],["userroles",d.userroles]].reduce((a,[n,l])=>a+(Array.isArray(l)?l.filter(r=>r&&!now[n].has(String(r.id))).length:0),0);
  const back2=gone&&confirmSafe(L("{n} Personen oder Rechte aus dem Backup gibt es heute nicht mehr (seither entfernt). Auch diese zurückholen?").replace("{n}",gone));
  const own=lc(ME&&ME.email),ok=/^[^/]{1,200}$/;const ops=[];
  if(d.config&&typeof d.config==="object")ops.push(["config","app",d.config]);
  if(d.configPrivate&&typeof d.configPrivate==="object")ops.push(["config","private",d.configPrivate]);
  if(d.gcal&&typeof d.gcal==="object")ops.push(["secret","gcal",d.gcal]);
  /* entries the rules never allow are left out (own invitation and own role, the main owner's entries) */
  const root=ROOT_OWNERS.includes(own);
  for(const [n,list] of [["roles",d.roles],["admins",d.admins],["invites",d.invites],["members",d.members],["bdays",d.bdays],["userroles",d.userroles],["owners",d.owners],["contacts",d.contacts]])
    for(const r of (Array.isArray(list)?list:[]))if(r&&ok.test(String(r.id))&&r.data&&typeof r.data==="object"&&!(n==="members"&&(lc(r.data.email)===own||(!root&&ROOT_OWNERS.includes(lc(r.data.email)))))&&!((n==="invites"||n==="userroles"||n==="admins"||n==="owners")&&(lc(r.id)===own||ROOT_OWNERS.includes(lc(r.id))))){const id=String(r.id);let v=r.data;
      if(now[n]&&!now[n].has(id)&&!back2)continue;
      if(n==="members"&&now.members.has(id)){v=Object.assign({},v);delete v.active;delete v.rev}
      ops.push([n,id,v])}
  /* phone/e-mail (contacts) only of people who are there after the restore, and only after them (the rules need the person) */
  const mem=new Set([...now.members,...ops.filter(o=>o[0]==="members").map(o=>o[1])]);
  const ct=ops.filter(o=>o[0]==="contacts"&&mem.has(o[1])),rest=ops.filter(o=>o[0]!=="contacts");
  let done=0,fail=0;
  for(const list of [rest,ct])for(let i=0;i<list.length;i+=300){const part=list.slice(i,i+300),batch=F.writeBatch(db);part.forEach(([n,id,v])=>batch.set(F.doc(db,n,id),back(v),{merge:true}));
    /* a refused entry made the whole batch of 300 fail: then each entry on its own */
    try{await batch.commit();done+=part.length}catch(err){console.warn("restore batch",err&&err.code||err);
      for(const [n,id,v] of part){try{await F.setDoc(F.doc(db,n,id),back(v),{merge:true});done++}catch(_){fail++}}}}
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
export function upSec(){
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
