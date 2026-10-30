import {ariaTip,dlgBtn,esc,L,LANG,mName,saveBtn} from "../base/10-core.js";
import {fold,render} from "../base/15-script-tab.js";
import {arr,showMsg} from "../base/20-data-start.js";
import {ADMINS} from "./01-config.js";
import {ADMIN_DEFAULT,ME,MYPERMS,MYROLE,PERMS,VIEWPERMS,can,crewPerson,fb,isAdmin,isOwner,lc,permKnown,permLbl,readBoxes} from "./03-core-firebase.js";
import {ADM,SECS,admErr,admIndex,admLoad,confirmSafe} from "./12a-admin-core.js";
import {canRole,roleGivable,roleLocked,rolePermsOf} from "./12c-admin-users.js";
import {auditSum} from "./17-audit-misc.js";
/* the name of a person of the App-Verwaltung by e-mail: member, invitation, crew list – one routine */
const admNameOf=e=>{const m=ADM.mem.find(x=>x.email===e),i=ADM.inv.find(x=>x.id===e),cp=(typeof crewPerson==="function"&&crewPerson(e))||{};return (m&&(mName(m)))||(i&&i.name)||cp.name||e};
/* ---------- App-Verwaltung (Rollen und Rechte) – part of the former 12-admin.js; loaded only when the App-Verwaltung is opened (admin.js) ---------- */
const permBoxes=sel=>'<div class="perms">'+[...new Set(PERMS.map(x=>x[2]))].map(g=>'<div class="pgrp"><h5>'+esc(L(g))+'</h5>'+PERMS.filter(x=>x[2]===g).map(([k,t])=>{const lock=(!isAdmin()&&!MYPERMS.includes(k))||(k==="settings"&&!isOwner()); /* role editors can only give permissions they have themselves */
    return '<label class="ck'+(lock?' plock':'')+'"><input type="checkbox" name="rp" value="'+k+'"'+((sel||[]).includes(k)?' checked':'')+(lock?' disabled':'')+'> '+esc(permLbl(k,t))+'</label>'}).join("")+'</div>').join("")+'</div>';
/* roles in order: «Hierarchie» (most permissions first) or alphabetical – the sort button in «Rollen» switches, kept on this device */
let ROLESORT="h";try{ROLESORT=localStorage.getItem("rolesort")==="a"?"a":"h"}catch(_){}
export function rolesSorted(){const nm=r=>String(r.name||r.id||"");return (ADM.roles||[]).slice().sort((a,b)=>ROLESORT==="a"?nm(a).localeCompare(nm(b),LANG):(arr(b.perms).length-arr(a.perms).length)||nm(a).localeCompare(nm(b),LANG))}
window.rolesSorted=rolesSorted;
document.addEventListener("click",e=>{if(!e.target.closest||!e.target.closest("[data-rolesort]"))return;ROLESORT=ROLESORT==="a"?"h":"a";try{localStorage.setItem("rolesort",ROLESORT)}catch(_){}render()});
export function rolesSec(){
  const cnt=id=>id==="admin"?ADM.adm.length:Object.keys(ADM.ur||{}).filter(e=>ADM.ur[e]===id&&!ADM.adm.includes(e)).length;
  const roles=rolesSorted();
  const pplLbl=id=>cnt(id)+' '+L(cnt(id)===1?"Person":"Personen");
  /* who has this role: folded list, a person added right here (select) or taken out (×) */
  
  const everyone=[...new Set(ADM.mem.map(m=>m.email).concat(ADM.inv.map(i=>i.id)))].filter(e=>e&&!ADMINS.includes(e));
  const ppl=id=>(id==="admin"?ADM.adm.slice():Object.keys(ADM.ur||{}).filter(e=>ADM.ur[e]===id&&!ADM.adm.includes(e))).sort((a,b)=>admNameOf(a).localeCompare(admNameOf(b),LANG));
  const pplSec=id=>{const l=ppl(id),can_=canRoleAssign()&&(id==="admin"?isAdmin():roleGivable((ADM.roles||[]).find(x=>x.id===id))),cand=can_?everyone.filter(e=>!l.includes(e)&&canRole(e)).sort((a,b)=>admNameOf(a).localeCompare(admNameOf(b),LANG)):[];
    return '<details class="arppl" data-sec="rppl-'+esc(id)+'"'+(SECS["rppl-"+id]?' open':'')+'><summary>'+esc(L("Personen"))+' ('+l.length+')</summary>'+
      (l.length?'<ul class="paccl">'+l.map(e=>'<li><span>'+esc(admNameOf(e))+'</span>'+(can_&&canRole(e)?'<button type="button" class="lnk arpx" data-rpout="'+esc(e)+'" '+ariaTip(L("Aus der Rolle nehmen"))+'>×</button>':'')+'</li>').join("")+'</ul>':'<p class="ghint">'+L("Niemand")+'</p>')+
      (cand.length?'<label class="arl arpadd">'+L("Person hinzufügen")+'<select data-rpadd="'+esc(id)+'"><option value="">'+esc(L("Person wählen …"))+'</option>'+cand.map(e=>'<option value="'+esc(e)+'">'+esc(admNameOf(e))+(admNameOf(e)!==e?' · '+esc(e):'')+'</option>').join("")+'</select></label>':'')+'</details>'};
  /* WhatsApp beim Quittieren for this role, per unit: per kind «wie die Person» (her own setting) / aus / fragen / direkt, and a recipient (number or group link) */
  const waBox=id=>{const K=window.SCWA_KINDS||[];if(!K.length||id==="admin")return"";const w=((ADM.roles||[]).find(x=>x.id===id)||{}).wa||{},us=window.UNIT2!==false?["1","2"]:["1"];
    const sel=(u,k,i)=>{const c=String(((w[u]||{}).m||"")[i]||"p");return '<select name="wam'+u+'_'+k+'" aria-label="'+esc(L(K[i][1])+" · "+u+(u==="1"?"st":"nd")+" Unit")+'">'+[["p","Wie die Person"],["n","Aus"],["f","Fragen"],["a","Direkt"]].map(([v,t])=>'<option value="'+v+'"'+(c===v?' selected':'')+'>'+esc(L(t))+'</option>').join("")+'</select>'};
    return '<details class="arwa"><summary>'+esc(L("WhatsApp beim Quittieren"))+'</summary><p class="ghint">'+esc(L("Für alle mit dieser Rolle, pro Unit. «Wie die Person»: es gilt die eigene Einstellung in Mein Konto."))+'</p>'+
      '<div class="arwag" style="--wcols:'+us.length+'"><span></span>'+us.map(u=>'<b>'+(u==="1"?"1st":"2nd")+' Unit</b>').join("")+
      K.map(([k,t],i)=>'<span>'+esc(L(t))+'</span>'+us.map(u=>sel(u,k,i)).join("")).join("")+
      '<span>'+esc(L("Empfänger"))+'</span>'+us.map(u=>'<input name="wan'+u+'" maxlength="80" autocomplete="off" spellcheck="false" value="'+esc((w[u]||{}).n||"")+'" placeholder="'+esc(L("Nummer oder Gruppenlink"))+'" aria-label="'+esc(L("Empfänger")+" · "+(u==="1"?"1st":"2nd")+" Unit")+'">').join("")+'</div></details>'};
  const row=(id,name,perms,fixedName)=>{const open=ADM.redit===id;
    return '<div class="arole'+(open?' open':'')+'"><div class="arh"><div class="arn"><b>'+esc(name)+(id==="crew"?' <span class="ust role">'+L("Standard")+'</span>':'')+'</b><small>'+(id==="crew"?L("Wird neuen Benutzer:innen automatisch zugewiesen.")+' ':id==="gast"?L("Wird allen ohne Rolle automatisch zugewiesen.")+' ':'')+(perms.length?perms.length+' '+L(perms.length===1?"Berechtigung":"Berechtigungen"):L("Keine Berechtigungen"))+' · '+pplLbl(id)+'</small></div>'+(canRoleEdit()&&!roleLocked(id)&&(isAdmin()||id!==MYROLE)?'<button type="button" class="pillbtn" data-redit="'+esc(id)+'">'+L(open?"Schliessen":"Bearbeiten")+'</button>':'')+'</div>'+pplSec(id)+
      (open?'<form class="arolef" data-role="'+esc(id)+'">'+(fixedName?'<input type="hidden" name="rn" value="'+esc(name)+'">':'<label class="arl">'+L("Name der Rolle")+'<input name="rn" maxlength="40" required value="'+esc(name)+'"></label>')+permBoxes(perms)+waBox(id)+
        '<p class="amsg" role="alert"></p><div class="arb">'+saveBtn()+''+(id==="crew"?'':id==="admin"?'<button type="button" class="lnk" data-rreset>'+L("Standard wiederherstellen")+'</button>':canRoleAssign()?'<button type="button" class="lnk" data-rdel="'+esc(id)+'">'+L("Rolle löschen")+'</button>':'')+'</div></form>':'')+'</div>'};
  return '<div class="admins"><h3 class="rolesh">'+L("Rollen")+'<button type="button" class="rsort" data-rolesort '+ariaTip(L(ROLESORT==="a"?"Sortiert: alphabetisch – tippen für Hierarchie (meiste Berechtigungen zuerst)":"Sortiert: Hierarchie (meiste Berechtigungen zuerst) – tippen für alphabetisch"))+'>'+(ROLESORT==="a"?'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l3-10 3 10M5 15h4"/><path d="M14 8h6l-6 10h6"/></svg>':'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h11M4 18h6"/></svg>')+'<span>'+esc(L(ROLESORT==="a"?"A–Z":"Hierarchie"))+'</span></button></h3><p class="ahint">'+L("Eine Rolle bündelt Berechtigungen. Zuweisen kannst du sie in der Benutzerverwaltung bei der Person unter «Rolle». Ohne Rolle sieht eine Person alle Drehdaten, die Crewliste, das Drehbuch und das Blocking, aber keine Verwaltung. Mit Rolle sieht sie nur die Bereiche, die die Rolle erlaubt.")+'</p>'+(window.simPicker?window.simPicker():"")+
    '<div class="arole fixed"><div class="arh"><div class="arn"><b>'+L("Owner")+'</b><small>'+L("Alles, auch Rollen, Admins, Sperren und Backup")+'</small></div></div></div>'+
    row("admin",L("Admin"),ADM.adminPerms||ADMIN_DEFAULT,true)+
    roles.map(ro=>row(ro.id,ro.name||ro.id,arr(ro.perms),false)).join("")+
    (ADM.redit==="new"?'<form class="arolef new" data-role=""><h4>'+L("Neue Rolle")+'</h4><label class="arl">'+L("Name der Rolle")+'<input name="rn" maxlength="40" required placeholder="'+esc(L("Name der Rolle, z. B. Catering"))+'"></label>'+permBoxes(VIEWPERMS)+'<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Rolle erstellen")+'</button>'+dlgBtn("lnk",'data-redit="new"',"Abbrechen")+'</div></form>':
      (canRoleEdit()?'<button type="button" class="abtn" data-redit="new">+ '+L("Neue Rolle")+'</button>':''))+'</div>'+permAccessSec();
}
/* who has which permission: every option can be opened and lists the people (owners, admins, roles; people without a role where allowed) */
function permAccessSec(){
  
  const everyone=[...new Set(ADM.mem.map(m=>m.email).concat(ADM.inv.map(i=>i.id)).concat(ADMINS))].filter(Boolean);
  const rp=id=>{const r=(ADM.roles||[]).find(x=>x.id===id);return r?arr(r.perms):[]};const aperm=ADM.adminPerms||ADMIN_DEFAULT;
  const noRoleOK=k=>({"view.phone":"phone","view.email":"email","view.mycal":"mycal"})[k];
  const who=k=>everyone.map(e=>{if(ADMINS.includes(e))return [e,L("Owner")];if(ADM.adm.includes(e))return aperm.includes(k)?[e,L("Admin")]:null;const id=ADM.ur[e];
      if(id)return rp(id).includes(k)?[e,((ADM.roles||[]).find(x=>x.id===id)||{}).name||id]:null;const pk=noRoleOK(k);return pk&&window.PUBV&&window.PUBV[pk]?[e,L("Keine Rolle")]:null}).filter(Boolean)
    .sort((a,b)=>admNameOf(a[0]).localeCompare(admNameOf(b[0]),LANG));
  const allOpen=PERMS.every(([k])=>SECS["pacc-"+k]);
  return '<div class="admins pacc"><h3>'+L("Wer hat welchen Zugriff?")+'</h3><p class="ahint">'+L("Tippe auf eine Berechtigung, um zu sehen, wer sie hat – und über welche Rolle.")+'</p>'+
    '<div class="ubar">'+paccAllBtn(allOpen)+'</div>'+
    [...new Set(PERMS.map(x=>x[2]))].map(g=>'<div class="pgrp paccgrp"><h5 class="paccg">'+esc(L(g))+'</h5>'+PERMS.filter(x=>x[2]===g).map(([k,t])=>{const w=who(k);
      /* roles first – switch the permission on or off for a role right here; the people below, to open */
      const rl=[['owner',L("Owner"),true,false]].concat([['admin',L("Admin"),aperm.includes(k),isOwner()&&k!=="settings"]])
        .concat(rolesSorted().map(r=>[r.id,r.name||r.id,arr(r.perms).includes(k),canRoleEdit()&&!roleLocked(r.id)&&(k!=="settings"||isOwner())&&(isAdmin()||(r.id!==MYROLE&&MYPERMS.includes(k)))]));
      const nr=noRoleOK(k);if(nr)rl.push(['',L("Keine Rolle"),!!(window.PUBV&&window.PUBV[nr]),false]);
      const edit=ADM.paccEdit===k,canEd=rl.some(x=>x[3]);
      return '<details class="paccd" data-sec="pacc-'+k+'"'+(SECS["pacc-"+k]||edit?' open':'')+'><summary><span>'+esc(permLbl(k,t))+'</span>'+(canEd?'<button type="button" class="paccpen'+(edit?' on':'')+'" data-paccedit="'+k+'" '+ariaTip(L("Rollen ändern"))+'><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>':'')+'<b class="pacn">'+w.length+'</b></summary>'+
        (edit&&can("settings")?'<label class="arl paccname">'+esc(L("Name der Option"))+'<input data-paccname="'+k+'" maxlength="60" value="'+esc(permLbl(k,t))+'" placeholder="'+esc(L(t))+'"></label>':'')+
        (edit?'<div class="paccr">'+rl.map(([id,n,on,ed])=>'<label class="ck paccrole'+(ed?'':' plock')+'"><input type="checkbox" data-pacc="'+esc(id)+'" data-perm="'+k+'"'+(on?' checked':'')+(ed?'':' disabled')+'> '+esc(n)+'</label>').join("")+'</div>'
          :'<div class="paccr">'+(rl.filter(x=>x[2]).map(x=>'<span class="ust role">'+esc(x[1])+'</span>').join("")||'<span class="ghint">'+esc(L("Keine Rolle"))+'</span>')+'</div>')+
        '<details class="paccp" data-sec="paccp-'+k+'"'+(SECS["paccp-"+k]?' open':'')+'><summary>'+esc(L("Personen"))+' ('+w.length+')</summary>'+
        (w.length?'<ul class="paccl">'+w.map(([e,r])=>'<li><span>'+esc(admNameOf(e))+'</span><span class="ust role">'+esc(r)+'</span></li>').join("")+'</ul>':'<p class="ghint">'+L("Niemand")+'</p>')+'</details></details>'}).join("")+'</div>').join("")+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-paccedit]");if(!b)return;e.preventDefault();e.stopPropagation();const k=b.dataset.paccedit;ADM.paccEdit=ADM.paccEdit===k?"":k;if(ADM.paccEdit)SECS["pacc-"+k]=true;render()},true);
/* «Wer hat welchen Zugriff?»: one round button opens or closes all permissions (like the user list) */
const paccAllBtn=open=>'<button type="button" class="cico uall" data-paccall '+ariaTip(L(open?"Alle zuklappen":"Alle aufklappen"))+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+(open?'<path d="m7 11 5-5 5 5M7 18l5-5 5 5"/>':'<path d="m7 6 5 5 5-5M7 13l5 5 5-5"/>')+'</svg></button>';
document.addEventListener("click",e=>{const b=e.target.closest("[data-paccall]");if(!b)return;e.preventDefault();
  const ds=[...document.querySelectorAll(".pacc details.paccd")],open=ds.some(d=>!d.open);ds.forEach(d=>{d.open=open});b.outerHTML=paccAllBtn(open)});
/* «Wer hat welchen Zugriff?»: a permission switched on/off for a role directly (same rules as «Bearbeiten»: no self-promotion) */
document.addEventListener("change",async e=>{const c=e.target.closest("input[data-pacc]");if(!c)return;const id=c.dataset.pacc,k=c.dataset.perm,on=c.checked;
  if(!id||id==="owner"||roleLocked(id)||(k==="settings"&&!isOwner())||(id!=="admin"&&!canRoleEdit())||(!isAdmin()&&(id===MYROLE||!MYPERMS.includes(k)))){c.checked=!on;render();return}
  const ro=id==="admin"?{name:"Admin",perms:(ADM.adminPerms||ADMIN_DEFAULT).slice()}:Object.assign({},(ADM.roles||[]).find(x=>x.id===id)||{});if(id!=="admin"&&!ro.name&&!ro.perms){c.checked=!on;render();return}
  const before=arr(ro.perms).slice(),perms=[...new Set(on?before.concat([k]):before.filter(p=>p!==k))].filter(p=>permKnown(p)||before.includes(p));
  const apply=ps=>{if(id==="admin")ADM.adminPerms=ps;else{const r=(ADM.roles||[]).find(x=>x.id===id);if(r)r.perms=ps}};
  apply(perms);render();
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"roles",id),Object.assign({name:ro.name||id,perms,at:F.serverTimestamp()},ro.wa&&id!=="admin"?{wa:ro.wa}:{}));showMsg(L("Rolle gespeichert."),2000)}
  catch(err){apply(before);c.checked=!on;render();showMsg(admErr(err),6000)}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-redit]");if(b&&canRoleEdit()&&!roleLocked(b.dataset.redit)){ADM.redit=ADM.redit===b.dataset.redit?"":b.dataset.redit;render();return}
  if(e.target.closest("[data-rreset]")&&isOwner()){const f=e.target.closest("form");f.querySelectorAll('input[name=rp]').forEach(x=>{x.checked=ADMIN_DEFAULT.includes(x.value)})}});
document.addEventListener("submit",async e=>{const f=e.target.closest("form.arolef");if(!f)return;e.preventDefault();if(!canRoleEdit()||(f.dataset.role&&roleLocked(f.dataset.role)))return;
  const name=String(f.rn.value||"").trim().slice(0,40),perms=readBoxes(f,"rp").filter(p=>permKnown(p)&&(isAdmin()||MYPERMS.includes(p))&&(p!=="settings"||isOwner()));if(!name)return;
  /* rights of this role the editor does not have himself (shown greyed out) stay as they are – they were silently removed before */
  if(!isAdmin()&&f.dataset.role){const cur=((ADM.roles||[]).find(x=>x.id===f.dataset.role)||{}).perms||[];for(const p of cur)if(!MYPERMS.includes(p)&&!perms.includes(p))perms.push(p)}
  /* rights not shown right now (e.g. the report rights before the reports are loaded) stay – saving removed them before */
  if(f.dataset.role){const cur=f.dataset.role==="admin"?(ADM.adminPerms||[]):rolePermsOf(f.dataset.role);for(const p of cur)if(!PERMS.some(x=>x[0]===p)&&!perms.includes(p))perms.push(p)}
  let id=f.dataset.role;if(!id){id=fold(name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"rolle";if((ADM.roles||[]).some(x=>x.id===id)||["admin","owner"].includes(id))id+="-"+Date.now().toString(36).slice(-4)}   /* a new role «Admin» must not overwrite the rights of the admins */
  /* WhatsApp per unit (only what differs from «Wie die Person» is stored) */
  let wa=null;{const K=window.SCWA_KINDS||[],o={};for(const u of ["1","2"]){if(!f.elements["wan"+u]&&!f.elements["wam"+u+"_"+((K[0]||[])[0])])continue;const m=K.map(([k])=>{const e=f.elements["wam"+u+"_"+k];return e&&/^[pnfa]$/.test(e.value)?e.value:"p"}).join(""),n=String((f.elements["wan"+u]||{}).value||"").trim().slice(0,80);if(/[nfa]/.test(m)||n)o[u]={m,n}}
    {const cur=((ADM.roles||[]).find(x=>x.id===f.dataset.role)||{}).wa||{};if(!f.elements["wan2"]&&cur["2"])o["2"]=cur["2"]}   /* the 2nd Unit switched off in the app: its setting stays */
    if(Object.keys(o).length)wa=o}
  if(!f.querySelector(".arwa")){const cur=((ADM.roles||[]).find(x=>x.id===f.dataset.role)||{}).wa;if(cur)wa=cur}   /* a form without the part (new role, admin): nothing lost */
  const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"roles",id),Object.assign({name,perms,at:F.serverTimestamp()},wa&&id!=="admin"?{wa}:{}));ADM.redit="";/* collapse right away (the reload below takes a moment) */if(id==="admin")ADM.adminPerms=perms;else{const r=(ADM.roles||[]).find(x=>x.id===id);if(r){r.name=name;r.perms=perms;if(wa)r.wa=wa;else delete r.wa}else(ADM.roles||(ADM.roles=[])).push(Object.assign({id,name,perms},wa?{wa}:{}))}document.activeElement&&document.activeElement.blur&&document.activeElement.blur();render();showMsg(L("Rolle gespeichert."),2500);admLoad().catch(err=>console.warn("roles reload",err&&err.code||err))}
  catch(err){if(btn)btn.disabled=false;console.error(err);{const m=f.querySelector(".amsg");if(m){m.className="amsg";m.textContent=admErr(err)}}showMsg(admErr(err),9000)}});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rdel]");if(!b||!canRoleEdit()||!canRoleAssign()||roleLocked(b.dataset.rdel))return;const id=b.dataset.rdel,ro=(ADM.roles||[]).find(x=>x.id===id)||{};
  if(!confirmSafe(L("Rolle «{r}» löschen? Personen mit dieser Rolle verlieren ihre Berechtigungen.").replace("{r}",ro.name||id)))return;
  /* all in one step: before, a refused person in the middle left some people without role and the role still there */
  try{const {F,db}=await fb();const bt=F.writeBatch(db);for(const em of Object.keys(ADM.ur||{}))if(ADM.ur[em]===id)bt.delete(F.doc(db,"userroles",em));bt.delete(F.doc(db,"roles",id));await bt.commit();
    /* a batch is not in the change log by itself: one entry for the role */
    F.addDoc(F.collection(db,"audit"),{by:lc(ME.email),at:F.serverTimestamp(),op:"delete",col:"roles",id:String(id).slice(0,120),sum:auditSum("roles",null,"delete")}).catch(()=>{});showMsg(L("Rolle gelöscht."),2500);await admLoad()}
  catch(err){showMsg(admErr(err),6000)}});
document.addEventListener("change",async e=>{const sl=e.target.closest("select[data-urole]");if(!sl||!canRoleAssign())return;e.stopPropagation();await setUserRole(sl.dataset.urole,sl.value,sl)},true);
/* give a person a role (owner, admin, a role or none): from the user list and from the role management */
async function setUserRole(em,v,sl){if(!canRoleAssign()||!canRole(em)||(v==="owner"&&!isOwner())||(v==="admin"&&!isAdmin())){render();return}
  /* applied right away in the list (no full reload); written in the background, undone on error. Owners are managed by owners only */
  const prev={ur:ADM.ur[em],adm:ADM.adm.includes(em),own:ADMINS.includes(em)};
  /* an owner or admin loses those rights: only after a question (one tap in a list must not take them away) */
  if((prev.own&&v!=="owner")||(prev.adm&&v!=="admin")){if(!confirmSafe(L("{e} verliert damit die Rechte als {r}. Fortfahren?").replace("{e}",em).replace("{r}",prev.own?L("Owner"):L("Admin")))){render();return}}
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

/* role management: a person into a role (select) or out of it (× → no role) */
document.addEventListener("change",async e=>{const sl=e.target.closest("select[data-rpadd]");if(!sl||!sl.value)return;e.stopPropagation();const id=sl.dataset.rpadd;SECS["rppl-"+id]=true;await setUserRole(sl.value,id,sl)},true);
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rpout]");if(!b)return;e.preventDefault();const em=b.dataset.rpout;
  if(!confirmSafe(L("{n} aus der Rolle nehmen?").replace("{n}",b.closest("li").querySelector("span").textContent)))return;await setUserRole(em,"",null)});

/* «Wer hat welchen Zugriff?» → Stift: the name of the option (empty = the standard name) */
document.addEventListener("change",async e=>{const i=e.target.closest&&e.target.closest("input[data-paccname]");if(!i||!can("settings"))return;const k=i.dataset.paccname,x=PERMS.find(p=>p[0]===k);if(!x)return;
  let v=String(i.value||"").trim().slice(0,60);if(v===L(x[1]))v="";
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"config","app"),{permNames:{[k]:v}},{merge:true});window.PERMNAMES=Object.assign({},window.PERMNAMES,{[k]:v});try{localStorage.setItem("apppermnames",JSON.stringify(window.PERMNAMES))}catch(_){}
    showMsg(L("Gespeichert."),2000);render()}catch(err){showMsg(admErr(err),6000)}});

