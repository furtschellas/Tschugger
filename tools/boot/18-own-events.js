/* ---------- eigene Termine: in «Meine Termine» mit + anlegen, an alle, Rollen, Abteilungen oder einzelne Personen ----------
   events/{id} = {c (verschlüsselt mit dem Crew-Schlüssel), at, by (uid)}; Inhalt: title, date, t, end, where, note,
   roles|null, depts|null, people|null ([{name,k,email}]), byEmail, byName. Alle null = an alle.
   Anlegen: Recht «Eigene Termine erstellen» (events.add); ändern/löschen: wer ihn angelegt hat, und Admins.
   Ein- und ausschalten: App-Verwaltung → App → Termine (config/app.ownEvents). */
const OWN={list:null,busy:false,at:0,roles:null};
const ownOn=()=>window.OWNEV!==false;
async function ownDec(key,c){const raw=Uint8Array.from(atob(c),ch=>ch.charCodeAt(0));return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},key,raw.slice(12))))}
async function ownEnc(o){const key=await getDataKey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(o))));
  const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);let bin="";for(let i=0;i<all.length;i+=8192)bin+=String.fromCharCode.apply(null,all.subarray(i,i+8192));return btoa(bin)}
async function ownLoad(force){
  if(!ME||!ownOn()||OWN.busy||(!force&&OWN.list&&Date.now()-OWN.at<300e3))return;OWN.busy=true;
  try{const {F,db}=await fb();const key=await getDataKey();const q=await F.getDocs(F.collection(db,"events"));const out=[];
    for(const d of q.docs){try{const x=d.data();out.push(Object.assign(await ownDec(key,x.c),{id:d.id,byUid:x.by,gc:x.gc||""}))}catch(_){}}
    OWN.list=out;OWN.at=Date.now();try{localStorage.setItem("ownev:v1",JSON.stringify(out))}catch(_){}}
  catch(err){console.warn("events",err&&err.code||err);if(!OWN.list)try{OWN.list=JSON.parse(localStorage.getItem("ownev:v1")||"[]")}catch(_){OWN.list=[]}}
  OWN.busy=false;try{pushSyncSoon()}catch(_){}render()}
/* is this event for the person «me» (identity from the crew list)? */
function ownFor(ev,me){
  const em=lc(me.email),self=ME&&em&&em===lc(ME.email);
  if(self&&ev.byEmail&&lc(ev.byEmail)===em)return true;   /* who made it always sees it */
  if(!ev.roles&&!ev.depts&&!ev.people)return true;
  if((ev.people||[]).some(p=>(p.email&&em&&lc(p.email)===em)||(p.k&&p.k===me.k)))return true;
  const dep=fold(me.src||"");if(dep&&(ev.depts||[]).some(d=>fold(d)===dep))return true;
  if(self&&ev.roles){const r=isOwner()?"owner":isAdmin()?"admin":(MYROLE||"");if(ev.roles.includes(r))return true}
  return false}
window.ownEvents=function(me){
  if(!ownOn()||!me)return [];if(!OWN.list){ownLoad();try{OWN.list=JSON.parse(localStorage.getItem("ownev:v1")||"null")}catch(_){}if(!OWN.list)return []}
  const t=todayISO();
  return OWN.list.filter(ev=>ev.date>=t&&ownFor(ev,me)).map(ev=>({date:ev.date,t:ev.t||"",end:ev.end||"",n:ev.title,where:ev.where||"",map:"",note:ev.note||"",
    src:(ev.gc?L("Google Kalender"):L("Eigener Termin"))+(ev.byName?" · "+ev.byName:""),go:"",own:ev.id,byEmail:ev.byEmail}))};
const ownMay=()=>ME&&ownOn()&&can("events.add");
window.ownEvAddBtn=()=>ownMay()?'<button type="button" class="pillbtn oeadd" data-oeadd aria-label="'+esc(L("Termin hinzufügen"))+'" title="'+esc(L("Termin hinzufügen"))+'">+ '+esc(L("Termin"))+'</button>':'';
window.ownEvEditBtn=e=>e&&e.own&&ME&&(isAdmin()||(e.byEmail&&lc(e.byEmail)===lc(ME.email)))?'<button type="button" class="calbtn oeed" data-oeed="'+esc(e.own)+'" aria-label="'+esc(L("Termin bearbeiten"))+'" title="'+esc(L("Termin bearbeiten"))+'"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>':'';

/* ---------- dialog: new / edit ---------- */
async function ownRoles(){if(OWN.roles)return OWN.roles;OWN.roles=[];try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"roles"));OWN.roles=q.docs.filter(d=>d.id!=="admin").map(d=>({id:d.id,name:String(d.data().name||d.id)})).sort((a,b)=>a.name.localeCompare(b.name,LANG))}catch(_){}return OWN.roles}
function ownPeople(){const seen=new Set();return mailPeople().filter(p=>p.name&&!seen.has(p.k)&&seen.add(p.k)).map(p=>({name:p.name,k:p.k,email:lc(p.email||"")})).sort((a,b)=>a.name.localeCompare(b.name,LANG))}
async function ownDialog(id,pre){
  const ev=id?(OWN.list||[]).find(x=>x.id===id):(pre?{title:pre.title,date:pre.date,t:pre.t,end:pre.end,where:pre.where,note:pre.note,gcNew:pre.uid}:null);if(id&&!ev)return;const isNew=!ev||!ev.id;
  const roles=[{id:"owner",name:L("Owner")},{id:"admin",name:L("Admin")}].concat(await ownRoles()).concat([{id:"",name:L("Keine Rolle")}]);
  const depts=[...new Set((S.crew||[]).map(g=>g.dept).filter(Boolean))],ppl=ownPeople();
  const st={sel:!!(ev&&(ev.roles||ev.depts||ev.people)),roles:(ev&&ev.roles)||[],depts:(ev&&ev.depts)||[],people:((ev&&ev.people)||[]).slice()};
  const d=document.createElement("div");d.id="oedlg";d.className="a2hs";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  const ck=(k,v,t)=>'<label class="ck"><input type="checkbox" data-oek="'+k+'" value="'+esc(v)+'"'+(st[k].includes(v)?' checked':'')+'> '+esc(t)+'</label>';
  const pchips=()=>st.people.map((p,i)=>'<span class="oechip">'+esc(p.name)+'<button type="button" data-oerm="'+i+'" aria-label="'+esc(L("Entfernen"))+'">×</button></span>').join("");
  const selBox=()=>'<p class="ahint"><b>'+L("Rollen")+'</b></p><div class="bcchk">'+roles.map(r=>ck("roles",r.id,r.name)).join("")+'</div>'+
    '<p class="ahint"><b>'+L("Abteilungen")+'</b></p><div class="bcchk">'+depts.map(x=>ck("depts",x,HIT(x))).join("")+'</div>'+
    '<p class="ahint"><b>'+L("Personen")+'</b></p><div class="oepl">'+pchips()+'</div><input type="search" list="oenames" data-oeadp autocomplete="off" placeholder="'+esc(L("Name tippen …"))+'"><datalist id="oenames">'+ppl.map(p=>'<option value="'+esc(p.name)+'"></option>').join("")+'</datalist>'+
    '<p class="ghint">'+L("Wer zu einer gewählten Rolle, Abteilung ODER Person gehört, sieht den Termin.")+'</p>';
  d.innerHTML='<div class="a2box oebox"><h3>'+esc(L(!isNew?"Termin bearbeiten":pre?"Termin aus Google Kalender übernehmen":"Termin hinzufügen"))+'</h3><form data-oeform novalidate>'+
    '<label>'+L("Titel")+'<input name="ti" maxlength="80" required value="'+esc(ev?ev.title:"")+'"></label>'+
    '<div class="oerow"><label>'+L("Datum")+'<input type="date" name="da" required value="'+esc(ev?ev.date:todayISO())+'"></label><label>'+L("Von")+'<input type="time" name="t1" value="'+esc(ev?ev.t:"")+'"></label><label>'+L("Bis")+'<input type="time" name="t2" value="'+esc(ev?ev.end:"")+'"></label></div>'+
    '<label>'+L("Ort")+'<input name="wh" maxlength="160" value="'+esc(ev?ev.where:"")+'"></label>'+
    '<label>'+L("Notiz")+'<textarea name="no" rows="2" maxlength="300">'+esc(ev?ev.note:"")+'</textarea></label>'+
    '<fieldset class="efood"><legend>'+L("Wer sieht den Termin?")+'</legend><label class="ck"><input type="radio" name="oem" value="all"'+(st.sel?'':' checked')+'> '+L("Alle")+'</label><label class="ck"><input type="radio" name="oem" value="sel"'+(st.sel?' checked':'')+'> '+L("Auswahl nach Rolle, Abteilung oder Person")+'</label><div class="oesel"'+(st.sel?'':' hidden')+'>'+selBox()+'</div></fieldset>'+
    '<p class="amsg" role="status"></p><div class="a2b">'+(!isNew?'<button type="button" class="lnk oedel" data-oedel>'+L("Löschen")+'</button>':'')+'<button type="button" class="lnk" data-oex>'+L("Abbrechen")+'</button><button type="submit" class="pri">'+L("Speichern")+'</button></div></form></div>';
  const redrawPeople=()=>{const pl=d.querySelector(".oepl");if(pl)pl.innerHTML=pchips()};
  d.addEventListener("change",e=>{const t=e.target;
    if(t.name==="oem"){st.sel=t.value==="sel";d.querySelector(".oesel").hidden=!st.sel}
    else if(t.dataset.oek){const k=t.dataset.oek;st[k]=st[k].filter(x=>x!==t.value);if(t.checked)st[k].push(t.value)}
    else if(t.matches("[data-oeadp]")){const p=ppl.find(x=>x.name===t.value.trim());if(p&&!st.people.some(x=>x.k===p.k)){st.people.push(p);redrawPeople()}t.value=""}});
  d.addEventListener("input",e=>{const t=e.target;if(t.matches("[data-oeadp]")){const p=ppl.find(x=>x.name===t.value.trim());if(p&&!st.people.some(x=>x.k===p.k)){st.people.push(p);redrawPeople();t.value=""}}});
  d.addEventListener("click",async e=>{
    const rm=e.target.closest("[data-oerm]");if(rm){st.people.splice(+rm.dataset.oerm,1);redrawPeople();return}
    if(e.target.closest("[data-oex]")){d.remove();return}
    if(e.target.closest("[data-oedel]")){if(!confirmSafe(L("Diesen Termin löschen?")))return;try{const {F,db}=await fb();await F.deleteDoc(F.doc(db,"events",ev.id));d.remove();showMsg(L("Termin gelöscht."),3000);ownLoad(true)}catch(err){d.querySelector(".amsg").textContent=L("Fehler:")+" "+(err.message||err)}}});
  d.addEventListener("submit",async e=>{e.preventDefault();const f=e.target,msg=d.querySelector(".amsg");msg.className="amsg";
    const title=String(f.ti.value||"").trim(),date=f.da.value;
    if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date)){msg.textContent=L("Bitte Titel und Datum eingeben.");return}
    if(st.sel&&!st.roles.length&&!st.depts.length&&!st.people.length){msg.textContent=L("Bitte mindestens eine Rolle, Abteilung oder Person wählen.");return}
    const me=typeof myIdentity==="function"?myIdentity():null;
    const o={title,date,t:f.t1.value||"",end:f.t2.value||"",where:String(f.wh.value||"").trim(),note:String(f.no.value||"").trim(),
      roles:st.sel&&st.roles.length?st.roles:null,depts:st.sel&&st.depts.length?st.depts:null,people:st.sel&&st.people.length?st.people:null,
      byEmail:!isNew?ev.byEmail:lc(ME.email),byName:!isNew?ev.byName:((me&&me.name)||ME.email),upd:Date.now()};
    f.querySelector("button[type=submit]").disabled=true;
    try{const {F,db}=await fb();const c=await ownEnc(o);
      if(!isNew)await F.updateDoc(F.doc(db,"events",ev.id),{c});else await F.addDoc(F.collection(db,"events"),Object.assign({c,at:F.serverTimestamp(),by:ME.uid},ev&&ev.gcNew?{gc:ev.gcNew}:{}));
      d.remove();showMsg(L("Termin gespeichert."),3000);ownLoad(true)}
    catch(err){f.querySelector("button[type=submit]").disabled=false;msg.textContent=/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err)}});
  document.body.appendChild(d);try{d.querySelector("[name=ti]").focus()}catch(_){}
}
document.addEventListener("click",e=>{if(e.target.closest("[data-oeadd]")){e.preventDefault();if(ownMay())ownDialog(null)}
  const b=e.target.closest("[data-oeed]");if(b){e.preventDefault();e.stopPropagation();ownDialog(b.dataset.oeed)}},true);
setInterval(()=>{if(document.visibilityState==="visible"&&ME&&ownOn())ownLoad()},300e3);

/* ---------- Google Kalender: Termine auswählen, die in die App kommen (gcal/feed, vom GitHub-Lauf alle 10 Minuten gelesen) ---------- */
const GC={feed:null,busy:false,url:null};
async function gcLoad(force){if(GC.busy||(!force&&GC.feed))return;GC.busy=true;
  try{const {F,db}=await fb();const d=await F.getDoc(F.doc(db,"gcal","feed"));const x=d.exists()?d.data():{};
    GC.feed={at:x.at||0,chk:x.chk||0,err:x.err||"",items:x.c?await ownDec(await getDataKey(),x.c):[]}}
  catch(err){GC.feed={items:[],err:String(err&&err.code||err)}}GC.busy=false;render()}
window.gcalBtn=()=>ownMay()&&window.GCALON?'<button type="button" class="pillbtn oegc" data-oegc aria-label="'+esc(L("Google Kalender"))+'" title="'+esc(L("Google Kalender"))+'">'+esc(L("Google Kalender"))+'</button>':'';
async function gcDialog(){
  await gcLoad(true);await ownLoad(true);
  const taken=new Map((OWN.list||[]).filter(x=>x.gc).map(x=>[x.gc,x]));const t=todayISO();
  const items=(GC.feed.items||[]).filter(x=>x.date>=t);
  const d=document.createElement("div");d.id="gcdlg";d.className="a2hs";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  let last="";const rows=items.map((x,i)=>{const dt=new Date(x.date+"T12:00:00");const hd=x.date!==last?'<h4 class="mcd">'+WDL(dt)+' '+pad2(dt.getDate())+'.'+pad2(dt.getMonth()+1)+'.</h4>':'';last=x.date;const tk=taken.get(x.uid);
    return hd+'<div class="gcrow'+(tk?' on':'')+'"><span class="gct">'+esc(x.t||L("ganztags"))+(x.end?'–'+esc(x.end):'')+'</span><span class="gcn"><b>'+esc(x.title||"–")+'</b>'+(x.where?'<br><small>'+esc(x.where)+'</small>':'')+(tk?'<br><small class="gcw">✓ '+esc(L("in der App"))+'</small>':'')+'</span>'+
      (tk?'<button type="button" class="pillbtn" data-gced="'+esc(tk.id)+'">'+esc(L("Bearbeiten"))+'</button>':'<button type="button" class="pillbtn" data-gcadd="'+i+'">'+esc(L("Übernehmen"))+'</button>')+'</div>'}).join("");
  d.innerHTML='<div class="a2box gcbox"><h3>'+esc(L("Google Kalender"))+'</h3><p class="ghint">'+esc(L("Wähle, welche Termine in die App kommen und wer sie sieht. Änderungen im Google Kalender (Zeit, Titel, Ort) werden automatisch nachgeführt; dort gelöschte Termine verschwinden aus der App."))+'</p>'+
    (GC.feed.err?'<p class="ghint">⚠ '+esc(GC.feed.err)+'</p>':'')+(items.length?'<div class="gclist">'+rows+'</div>':'<p class="ghint">'+esc(L("Keine kommenden Termine im Google Kalender."))+'</p>')+
    '<p class="ghint">'+esc(L("Stand"))+': '+(GC.feed.chk||GC.feed.at?esc(new Date(Math.max(GC.feed.chk||0,GC.feed.at||0)).toLocaleString(LOC[LANG]||"de-CH",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})):'–')+'</p><div class="a2b"><button type="button" class="pri" data-gcx>'+esc(L("Schliessen"))+'</button></div></div>';
  d.addEventListener("click",e=>{if(e.target.closest("[data-gcx]")){d.remove();return}
    const a=e.target.closest("[data-gcadd]");if(a){d.remove();ownDialog(null,items[+a.dataset.gcadd]);return}
    const b=e.target.closest("[data-gced]");if(b){d.remove();ownDialog(b.dataset.gced)}});
  document.body.appendChild(d)}
document.addEventListener("click",e=>{if(e.target.closest("[data-oegc]")){e.preventDefault();if(ownMay())gcDialog()}},true);
/* App-Verwaltung → App → Termine: secret iCal address (Google Kalender → Einstellungen → «Privatadresse im iCal-Format») */
async function gcUrlLoad(){if(GC.url!==null)return;GC.url="";try{const {F,db}=await fb();const d=await F.getDoc(F.doc(db,"secret","gcal"));GC.url=d.exists()?String(d.data().url||""):""}catch(_){GC.url=""}render()}
window.gcalSetSec=function(){if(!can("settings"))return "";gcUrlLoad();if(!GC.feed&&window.GCALON)gcLoad();
  const st=GC.feed&&(GC.feed.at||GC.feed.chk)?L("Zuletzt gelesen")+': '+new Date(Math.max(GC.feed.chk||0,GC.feed.at||0)).toLocaleString(LOC[LANG]||"de-CH",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})+' · '+(GC.feed.items||[]).length+' '+L("Termine")+(GC.feed.err?' · ⚠ '+GC.feed.err:''):'';
  return '<p class="ahint"><b>'+L("Google Kalender")+'</b> – '+L("Geheime Adresse im iCal-Format einfügen (Google Kalender → Einstellungen des Kalenders → «Privatadresse im iCal-Format»). Die Termine werden alle 10 Minuten gelesen; in «Meine Termine» wählst du, welche in die App kommen.")+'</p>'+
    '<input form="setform" class="amap" type="url" name="gcal" inputmode="url" autocomplete="off" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" value="'+esc(GC.url||"")+'">'+(st?'<p class="ghint">'+esc(st)+'</p>':'')}
document.addEventListener("submit",async e=>{const f=e.target;if(!f||f.id!=="setform"||!can("settings"))return;const el=f.elements["gcal"];if(!el)return;
  const v=String(el.value||"").trim().replace(/^webcal:\/\//,"https://");if(v===(GC.url||""))return;
  if(v&&!/^https:\/\/\S+\.ics(\?\S*)?$/i.test(v)&&!/^https:\/\/calendar\.google\.com\//.test(v)){showMsg(L("Bitte die iCal-Adresse des Kalenders (endet auf .ics) eingeben."),5000);return}
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"secret","gcal"),{url:v});await F.setDoc(F.doc(db,"config","app"),{gcal:!!v},{merge:true});GC.url=v;window.GCALON=!!v;GC.feed=null}
  catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}},true);
