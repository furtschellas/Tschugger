/* ---- push message to everybody (or selected roles / departments), sent right away: permission «push.send».
   The message is stored encrypted in broadcasts/{id}; the Cloudflare Worker starts the sending run at once ---- */
const BC={roles:null,sel:{roles:[],depts:[]},mode:"all",busy:false,msg:"",ok:false};
function bcButton(){
  let b=document.getElementById("bcBtn");const mc=document.getElementById("myCalBtn");if(!mc)return;
  if(!b){b=document.createElement("button");b.id="bcBtn";b.className="refresh";b.type="button";
    b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="15.5" rx="2"/><path d="m3.5 8 8.5 6.5 8.5-6.5"/></svg>';
    mc.parentNode.insertBefore(b,mc.nextSibling);b.addEventListener("click",()=>{S.tab="bcast";S.srcOpen=false;window.scrollTo(0,0);render()})}
  b.setAttribute("aria-label",L("Push-Nachricht senden"));b.title=L("Push-Nachricht senden");b.hidden=!(ME&&can("push.send")&&window.PUSHEN!==false);
}
setInterval(()=>{try{bcButton()}catch(_){}},20000);
function bcDepts(){return [...new Set((S.crew||[]).map(g=>g.dept).filter(Boolean))]}
async function bcLoadRoles(){if(BC.roles)return;BC.roles=[];try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"roles"));BC.roles=q.docs.filter(d=>d.id!=="admin").map(d=>({id:d.id,name:String(d.data().name||d.id)})).sort((a,b)=>a.name.localeCompare(b.name,LANG))}catch(_){}render()}
/* SMS: opens the phone's SMS app with the numbers of the recipients (crew list / app profiles) and the text */
function bcSms(pl){
  const nums=bcSmsNums(pl);
  if(!nums.length){showMsg(L("Keine Telefonnummern für diese Empfänger gefunden."),6000);return}
  const body=encodeURIComponent(pl.title+"\n"+pl.body);
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  location.href=ios?"sms:/open?addresses="+nums.join(",")+"&body="+body:"sms:"+nums.join(",")+"?body="+body;
  showMsg(L("SMS-App geöffnet mit {n} Nummern.").replace("{n}",nums.length),6000);
}
function bcSmsNums(pl){return bcRecips(pl).map(x=>x.ph).filter(x=>x.length>=6)}
/* e-mail: opens the mail app with all chosen recipients in BCC */
function bcMail(pl){const ems=[...new Set(bcRecips(Object.assign({},pl,{withMail:true})).map(x=>x.email).filter(e=>/@/.test(e)))];
  if(!ems.length){showMsg(L("Keine E-Mail-Adressen für diese Empfänger gefunden."),6000);return}
  location.href="mailto:?bcc="+encodeURIComponent(ems.join(","))+"&subject="+encodeURIComponent(pl.title)+"&body="+encodeURIComponent(pl.body);showMsg(L("Mail-App geöffnet mit {n} Adressen.").replace("{n}",ems.length),6000)}
/* recipients with phone number: exactly the persons chosen in the message (all, or roles / departments) */
function bcRecips(pl){
  const roleOfE=e=>{e=lc(e||"");if(ADMINS.includes(e))return "owner";if((ADM.adm||[]).includes(e))return "admin";return (ADM.ur||{})[e]||""};
  const out=[];for(const g of S.crew||[])for(const p of arr(g.people)){const ph=String(p.phone||"").split(/[\/,;]/)[0].replace(/[^\d+]/g,"");if(ph.length<6&&!(pl.withMail&&p.email))continue;
    if(pl.roles||pl.depts){const ok=(pl.depts||[]).includes(g.dept)||(p.email&&(pl.roles||[]).includes(roleOfE(p.email)));if(!ok)continue}if(!out.some(x=>x.ph===ph))out.push({ph,name:p.name||ph,dept:g.dept||"",email:lc(p.email||"")})}
  return out;
}
/* WhatsApp: WhatsApp has no way to send to many people at once from a web page – one tap per person opens the chat with the text ready */
function bcWaHTML(){const w=BC.waList;if(!w)return "";w.list=w.list.filter(x=>x.ph&&x.ph.length>=6);const t=encodeURIComponent(w.text);
  return '<div class="bcwa"><div class="bchh"><h3 class="cath3">WhatsApp</h3><button type="button" class="pillbtn" data-wax>'+L("Fertig")+'</button></div><a class="pillbtn wabtn wagrp" href="https://wa.me/?text='+t+'" target="_blank" rel="noopener">'+L("In eine WhatsApp-Gruppe teilen")+'</a><p class="ghint">'+L("Am schnellsten: in eure Crew-Gruppe teilen. Oder einzeln – bei jeder Person auf WhatsApp tippen, der Text ist schon eingefügt.")+'</p>'+
    (w.list.length?'<ul class="walist">'+w.list.map(x=>'<li><span><b>'+esc(x.name)+'</b><small>'+esc(HIT(x.dept))+'</small></span><a class="pillbtn wabtn" href="https://wa.me/'+esc(x.ph.replace(/^\+/,""))+'?text='+t+'" target="_blank" rel="noopener" data-wad>WhatsApp</a></li>').join("")+'</ul>':'<p class="ghint">'+L("Keine Telefonnummern für diese Empfänger gefunden.")+'</p>')+'</div>'}
document.addEventListener("click",e=>{const a=e.target.closest("[data-wad]");if(a){a.classList.add("done");a.textContent="✓ WhatsApp";return}if(e.target.closest("[data-wax]")){BC.waList=null;render()}});
/* send right away through the Cloudflare Worker; without it the next run picks the message up */
async function bcDeliver(id){
  const {F,db,auth}=await fb();
  if(window.CHATURL){try{const tok=await auth.currentUser.getIdToken();
    const r=await fetch(window.CHATURL.replace(/\/+$/,"")+"/broadcast",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok},body:JSON.stringify({id})});const j=await r.json().catch(()=>({}));
    if(r.ok){if(!j.claimed)try{await F.updateDoc(F.doc(db,"broadcasts",id),{sent:true,n:j.n||0})}catch(_){}
      return L("Gesendet an {n} Geräte.").replace("{n}",j.n||0)+(j.rest||j.fail?" "+L("Die übrigen folgen in wenigen Minuten."):"")}
    if(r.status===403||r.status===409)return L("Nicht gesendet:")+" "+(j.error||r.status);
    await fetch(window.CHATURL.replace(/\/+$/,"")+"/notify",{method:"POST",headers:{Authorization:"Bearer "+tok}}).catch(()=>{});return L("Gesendet – die Nachricht kommt in etwa einer Minute an.")}catch(_){}}
  return L("Gespeichert – die Nachricht geht mit dem nächsten Lauf (spätestens in 15 Minuten) raus.");
}
/* history: every message with date, time, recipients and sender; can be sent again */
async function bcLoadHist(){BC.hist=[];BC.dev=null;try{const {F,db}=await fb();let q;try{q=await F.getDocs(F.query(F.collection(db,"broadcasts"),F.orderBy("at","desc"),F.limit(100)))}catch(_){q=await F.getDocs(F.collection(db,"broadcasts"))}const key=await getDataKey();
  const out=[];for(const d of q.docs){try{const raw=Uint8Array.from(atob(d.data().c),ch=>ch.charCodeAt(0));const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},key,raw.slice(12));out.push(Object.assign({id:d.id,sent:d.data().sent,n:d.data().n,done:d.data().done||null},JSON.parse(new TextDecoder().decode(pt))))}catch(_){}}
  BC.hist=out.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,100)}catch(err){console.warn("bc hist",err&&err.code||err);BC.histErr=String((err&&err.code)||err)}render()}
/* who got it: «done» holds the devices; admins may read the device list (push/…) and see whose device it is */
async function bcLoadDev(){if(BC.dev||!isAdmin())return;BC.dev={};try{const {F,db}=await fb();const key=await getDataKey();const q=await F.getDocs(F.collection(db,"push"));
  for(const d of q.docs){try{const raw=Uint8Array.from(atob(d.data().c),ch=>ch.charCodeAt(0));const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},key,raw.slice(12));const w=(JSON.parse(new TextDecoder().decode(pt)).who)||{};BC.dev[d.id]=lc(w.email)}catch(_){}}}catch(err){console.warn("bc dev",err&&err.code||err)}render()}
function bcPerson(em){if(!em)return "";for(const g of (S.crew||[]))for(const p of (g.people||[]))if(p.name&&lc(p.email)===em)return p.name;
  const m=(typeof ADM!=="undefined"&&ADM.mem||[]).find(x=>lc(x.email)===em);const n=m&&([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name);return n||em}
function bcRcptHTML(b){if(!isAdmin()||b.push===false)return "";
  if(!b.done||!b.done.length)return '<div class="bcr">'+esc(L("Empfänger nicht erfasst (vor dem 17.10.2026 gesendet oder noch unterwegs)."))+'</div>';
  if(!BC.dev){bcLoadDev();return '<div class="bcr">'+esc(L("Lade …"))+'</div>'}
  const names=new Map();let unk=0;for(const did of b.done){const em=BC.dev[did];if(!em){unk++;continue}const n=bcPerson(em);names.set(n,(names.get(n)||0)+1)}
  const list=[...names.keys()].sort((a,c)=>a.localeCompare(c,"de"));
  return '<details class="bcr"><summary>'+esc(L("Empfänger"))+' ('+list.length+(unk?' + '+unk+' '+L("ohne Zuordnung"):'')+')</summary><div class="bcrl">'+list.map(n=>'<span>'+esc(n)+(names.get(n)>1?' <small>×'+names.get(n)+'</small>':'')+'</span>').join("")+
    (unk?'<span class="muted">'+esc(L("{n} Geräte inzwischen abgemeldet").replace("{n}",unk))+'</span>':'')+'</div></details>'}
const bcWho=b=>b.roles||b.depts?[].concat((b.roles||[]).map(r=>r==="owner"?L("Owner"):r==="admin"?L("Admin"):r===""?L("Keine Rolle"):((BC.roles||[]).find(x=>x.id===r)||{}).name||r),(b.depts||[]).map(HIT)).join(", "):L("Alle");
function bcHistHTML(){
  if(!BC.hist){bcLoadHist();return '<p class="ghint">'+L("Lade …")+'</p>'}
  if(!BC.hist.length)return '<p class="ghint">'+L("Noch keine Push-Nachrichten gesendet.")+'</p>';
  return '<div class="bchist">'+BC.hist.map(b=>{const dt=new Date(b.at||0);
    return '<div class="bch"><div class="bchd"><span class="bct">'+esc(dt.toLocaleDateString(LOC[LANG]||"de-CH",{day:"2-digit",month:"2-digit",year:"numeric"}))+' · '+esc(dt.toLocaleTimeString(LOC[LANG]||"de-CH",{hour:"2-digit",minute:"2-digit"}))+'</span>'+(b.n!=null?'<span class="ust role">'+esc(L("{n} Geräte").replace("{n}",b.n))+'</span>':'')+'</div>'+
      '<b class="bctt">'+esc(b.title||"")+'</b><p class="bcb">'+esc(b.body||"")+'</p>'+
      '<div class="bcm"><span>'+esc(L("An"))+': '+esc(bcWho(b))+'</span>'+(b.ch?'<span>'+esc(["push","wa","sms","mail"].filter(k=>b.ch[k]).map(k=>({push:"Push",wa:"WhatsApp",sms:"SMS",mail:L("E-Mail")})[k]).join(" · "))+'</span>':'')+'<span>'+esc(L("Von"))+': '+esc(b.by||"")+'</span></div>'+bcRcptHTML(b)+
      '<div class="arb"><button type="button" class="pillbtn" data-bcre="'+esc(b.id)+'">↻ '+L("Erneut senden")+'</button></div></div>'}).join("")+'</div>';
}
document.addEventListener("click",async e=>{if(!e.target.closest("[data-bcclr]")||!isAdmin())return;if(!confirmSafe(L("Den ganzen Verlauf der Push-Nachrichten löschen?")))return;
  try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"broadcasts"));for(const d of q.docs)await F.deleteDoc(F.doc(db,"broadcasts",d.id));BC.hist=[];showMsg(L("Verlauf geleert."),3000);render()}
  catch(err){showMsg(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err),8000)}});
document.addEventListener("click",async e=>{const bt=e.target.closest("[data-bcre]");if(!bt||!can("push.send")||BC.busy)return;const b=(BC.hist||[]).find(x=>x.id===bt.dataset.bcre);if(!b)return;
  if(!confirmSafe(L("Push-Nachricht jetzt senden an:")+" "+bcWho(b)+"?"))return;BC.busy=true;bt.disabled=true;
  try{const pl={title:b.title,body:b.body,roles:b.roles||null,depts:b.depts||null,by:ME.email,at:Date.now(),re:b.id};
    const key=await getDataKey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(pl))));
    const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);let bin="";for(let i=0;i<all.length;i+=8192)bin+=String.fromCharCode.apply(null,all.subarray(i,i+8192));
    const {F,db}=await fb();const ref=await F.addDoc(F.collection(db,"broadcasts"),{c:btoa(bin),at:F.serverTimestamp()});showMsg(await bcDeliver(ref.id),5000);BC.hist=null}
  catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}BC.busy=false;render()});
VIEWS.bcast=function(){
  if(!ME||!can("push.send"))return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(!BC.roles)bcLoadRoles();
  const roles=[{id:"owner",name:L("Owner")},{id:"admin",name:L("Admin")}].concat(BC.roles||[]).concat([{id:"",name:L("Keine Rolle")}]);
  const ck=(k,v,t)=>'<label class="ck"><input type="checkbox" data-bcsel="'+k+'" value="'+esc(v)+'"'+(BC.sel[k].includes(v)?' checked':'')+'> '+esc(t)+'</label>';
  return '<section class="mypage bcpage"><h2 class="pgt">'+L("Push-Nachricht senden")+'</h2><p class="ghint">'+L("Geht sofort als Push-Nachricht an alle, die Push-Nachrichten eingeschaltet haben.")+'</p>'+
    '<form class="bcform" data-bc novalidate><label>'+L("Titel")+'<input name="bt" maxlength="60" required placeholder="'+esc(L("z. B. Drehplan geändert"))+'"></label>'+
    '<label>'+L("Nachricht")+'<textarea name="bb" rows="4" maxlength="300" required placeholder="'+esc(L("Kurz und klar, max. 300 Zeichen"))+'"></textarea></label>'+
    '<fieldset class="efood"><legend>'+L("Empfänger")+'</legend><label class="ck"><input type="radio" name="bm" value="all"'+(BC.mode==="all"?' checked':'')+'> '+L("Alle")+'</label><label class="ck"><input type="radio" name="bm" value="sel"'+(BC.mode==="sel"?' checked':'')+'> '+L("Auswahl nach Rolle und/oder Abteilung")+'</label>'+
      (BC.mode==="sel"?'<p class="ahint"><b>'+L("Rollen")+'</b></p><div class="bcchk">'+roles.map(r=>ck("roles",r.id,r.name)).join("")+'</div><p class="ahint"><b>'+L("Abteilungen")+'</b></p><div class="bcchk">'+bcDepts().map(d=>ck("depts",d,HIT(d))).join("")+'</div><p class="ghint">'+L("Wer zu einer gewählten Rolle ODER Abteilung gehört, bekommt die Nachricht.")+'</p>':'')+'</fieldset>'+
    '<fieldset class="efood bcch"><legend>'+L("Senden als")+'</legend><div class="bcchk">'+
      [["bp","push","Push"],["bw","wa","WhatsApp"],["bs","sms","SMS"],["be","mail","E-Mail"]].map(([n,k,t])=>'<label class="ck"><input type="checkbox" name="'+n+'"'+((BC.ch||{push:true})[k]?' checked':'')+'> '+esc(L(t))+'</label>').join("")+
      '</div><p class="ghint">'+L("Push geht sofort an alle mit eingeschalteten Push-Nachrichten. WhatsApp, SMS und E-Mail öffnen die jeweilige App auf deinem Gerät – nur an die oben gewählten Empfänger.")+'</p></fieldset>'+
    '<div class="arb"><button type="submit"'+(BC.busy?' disabled':'')+'>'+L("Jetzt senden")+'</button></div><p class="amsg'+(BC.ok?' ok':'')+'" role="status">'+esc(BC.msg)+'</p></form>'+
    bcWaHTML()+'<div class="bchh"><h3 class="cath3">'+L("Verlauf")+'</h3>'+(isAdmin()&&BC.hist&&BC.hist.length?'<button type="button" class="pillbtn bcclr" data-bcclr>'+L("Verlauf leeren")+'</button>':'')+'</div>'+bcHistHTML()+'</section>';
};
document.addEventListener("change",e=>{const t=e.target;if(t.matches("[data-bc] input[name=bm]")){BC.mode=t.value;const f=t.form;const keep={bt:f.bt.value,bb:f.bb.value};render();const g=document.querySelector("[data-bc]");if(g){g.bt.value=keep.bt;g.bb.value=keep.bb}}
  else if(t.matches("[data-bcsel]")){const k=t.dataset.bcsel;BC.sel[k]=BC.sel[k].filter(x=>x!==t.value);if(t.checked)BC.sel[k].push(t.value)}});
document.addEventListener("submit",async e=>{const f=e.target.closest("form[data-bc]");if(!f)return;e.preventDefault();if(!can("push.send")||BC.busy)return;
  const title=String(f.bt.value||"").trim().slice(0,60),body=String(f.bb.value||"").trim().slice(0,300);const msg=f.querySelector(".amsg");
  if(!title||!body){msg.className="amsg";msg.textContent=L("Bitte Titel und Nachricht eingeben.");return}
  BC.ch={push:!!(f.bp&&f.bp.checked),wa:!!(f.bw&&f.bw.checked),sms:!!(f.bs&&f.bs.checked),mail:!!(f.be&&f.be.checked)};BC.sms=BC.ch.sms;BC.wa=BC.ch.wa;
  if(!BC.ch.push&&!BC.ch.wa&&!BC.ch.sms&&!BC.ch.mail){msg.className="amsg";msg.textContent=L("Bitte mindestens einen Weg wählen.");return}const sel=BC.mode==="sel";if(sel&&!BC.sel.roles.length&&!BC.sel.depts.length){msg.className="amsg";msg.textContent=L("Bitte mindestens eine Rolle oder Abteilung wählen.");return}
  const who=sel?[BC.sel.roles.map(r=>r==="owner"?L("Owner"):r==="admin"?L("Admin"):r===""?L("Keine Rolle"):((BC.roles||[]).find(x=>x.id===r)||{}).name||r).concat(BC.sel.depts).join(", ")]:[L("alle")];
  if(!confirmSafe(L("Push-Nachricht jetzt senden an:")+" "+who.join(", ")+"?"))return;
  BC.busy=true;f.querySelector("button[type=submit]").disabled=true;
  try{const pl={title,body,roles:sel?BC.sel.roles:null,depts:sel?BC.sel.depts:null,by:ME.email,at:Date.now(),ch:BC.ch,push:BC.ch.push};
    const key=await getDataKey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(pl))));
    const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);let bin="";for(let i=0;i<all.length;i+=8192)bin+=String.fromCharCode.apply(null,all.subarray(i,i+8192));
    const {F,db,auth}=await fb();const ref=await F.addDoc(F.collection(db,"broadcasts"),{c:btoa(bin),at:F.serverTimestamp()});
    const r=BC.ch.push?await bcDeliver(ref.id):L("Gespeichert.");if(BC.ch.mail)bcMail(pl);if(BC.sms)setTimeout(()=>bcSms(pl),BC.ch.mail?1500:0);BC.waList=BC.wa?{text:pl.title+"\n"+pl.body,list:bcRecips(pl)}:null;BC.ok=true;BC.msg=r;BC.sel={roles:[],depts:[]};BC.mode="all";BC.ch={push:true};f.reset();BC.hist=null}
  catch(err){console.error(err);BC.ok=false;BC.msg=/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err)}
  BC.busy=false;render()});
