/* ---------- view the app as another person (owner and admins): App-Verwaltung → Benutzer → Profil → «Ansicht als …» ----------
   Only the view changes (rights of the person's role, «Meine Termine», own events, department); nothing is saved while simulating.
   A pink bar on top shows whose view it is and ends the simulation. Owners can only be simulated by owners. */
let SIMUSER=null;
window.simEmail=()=>SIMUSER?SIMUSER.email:((typeof ME!=="undefined"&&ME&&ME.email)||"");
window.simOn=()=>!!SIMUSER;
function simCan(em){if(!isAdmin()||SIMROLE||!em)return false;const r=roleOf(em);return lc(em)!==lc(ME&&ME.email||"")&&(r!=="owner"||isOwner())&&(r!=="admin"||isOwner())}
function simBar(){let b=document.getElementById("simbar");
  if(!SIMUSER){if(b)b.remove();document.body.classList.remove("simming");return}
  if(!b){b=document.createElement("div");b.id="simbar";b.setAttribute("role","status");document.body.appendChild(b)}
  document.body.classList.add("simming");
  b.innerHTML='<span>'+esc(L("Ansicht als"))+' <b>'+esc(SIMUSER.name)+'</b> · '+esc(SIMUSER.rname)+' · '+esc(L("nur ansehen"))+'</span><button type="button" data-simend>'+esc(L("Beenden"))+'</button>'}
function simRefreshChrome(){try{acctButton(true);if(typeof bcButton==="function")bcButton();const mb=document.getElementById("myCalBtn");if(mb)mb.hidden=!vok("mycal")}catch(_){}}
function simStart(em){em=lc(em);if(!simCan(em))return;
  const r=roleOf(em),ro=r==="admin"?{id:"admin",name:L("Admin"),perms:(ADM.adminPerms||ADMIN_DEFAULT).slice()}:r==="owner"?{id:"owner",name:L("Owner"),perms:PERMS.map(x=>x[0])}:((ADM.roles||[]).find(x=>x.id===r)||{id:"",name:L("Keine Rolle"),perms:[]});
  const mem=(ADM.mem||[]).find(x=>lc(x.email||"")===em)||null,inv=(ADM.inv||[]).find(x=>x.id===em)||{};
  const name=(mem&&[mem.firstName,mem.lastName].filter(Boolean).join(" "))||inv.name||em;
  SIMUSER={email:em,name,rname:ro.name||ro.id||L("Keine Rolle"),keep:{p:MYPERMS.slice(),r:MYROLE,ap:ADMINPERMS.slice(),mem:typeof MEMBER!=="undefined"?MEMBER:null,tab:S.tab,sub:ADM.sub}};
  if(r==="owner")SIMROLE=null;else{SIMROLE={adm:r==="admin",user:em};MYPERMS=r==="admin"?[]:arr(ro.perms).filter(p=>permKnown(p));MYROLE=r==="admin"?"":ro.id;if(r==="admin")ADMINPERMS=ro.perms}
  /* the simulated person's own data: profile (name), callsheet «my day», my appointments – never the admin's */
  try{MEMBER=mem||{name:inv.name||"",email:em}}catch(_){}try{MEMO.clear()}catch(_){}
  S.tab="today";simRefreshChrome();simBar();render();scrollTo(0,0)}
function simEnd(){if(!SIMUSER)return;const k=SIMUSER.keep;SIMUSER=null;try{MEMO.clear()}catch(_){}SIMROLE=null;MYPERMS=k.p;MYROLE=k.r;ADMINPERMS=k.ap;try{MEMBER=k.mem}catch(_){}
  S.tab=k.tab||"admin";ADM.sub=k.sub;simRefreshChrome();simBar();render()}
/* a role without a specific person: «role:<id>» ("" = no role, "admin") – shows exactly what everybody with that role sees */
function simRoleCan(id){return isAdmin()&&!SIMROLE&&!SIMUSER&&(id!=="admin"||isOwner())}
function simStartRole(id){if(!simRoleCan(id))return;
  const ro=id==="admin"?{id:"admin",name:L("Admin"),perms:(ADM.adminPerms||ADMIN_DEFAULT).slice()}:id?((ADM.roles||[]).find(x=>x.id===id)||null):{id:"",name:L("Keine Rolle"),perms:[]};
  if(!ro)return;
  SIMUSER={email:"",name:L("Rolle")+" «"+(ro.name||ro.id||L("Keine Rolle"))+"»",rname:L("ohne Person"),keep:{p:MYPERMS.slice(),r:MYROLE,ap:ADMINPERMS.slice(),mem:typeof MEMBER!=="undefined"?MEMBER:null,tab:S.tab,sub:ADM.sub}};
  SIMROLE={adm:id==="admin",user:""};MYPERMS=id==="admin"?[]:arr(ro.perms).filter(p=>permKnown(p));MYROLE=id==="admin"?"":ro.id;if(id==="admin")ADMINPERMS=ro.perms;
  try{MEMBER=null}catch(_){}
  S.tab="today";simRefreshChrome();simBar();render();scrollTo(0,0)}
/* quick picker «Ansicht als …» (roles and people) for the admin pages */
window.simPicker=()=>{if(!isAdmin()||SIMROLE||SIMUSER)return "";
  const roles=[["role:",L("Keine Rolle")]].concat(isOwner()?[["role:admin",L("Admin")]]:[],(window.rolesSorted?rolesSorted():(ADM.roles||[])).map(r=>["role:"+r.id,r.name||r.id]));
  const ppl=[];const seen=new Set();for(const m of (ADM.mem||[])){const em=lc(m.email||"");if(!em||seen.has(em)||!simCan(em))continue;seen.add(em);ppl.push([em,[m.firstName,m.lastName].filter(Boolean).join(" ")||em])}
  ppl.sort((a,b)=>a[1].localeCompare(b[1],LANG));
  return '<div class="simpick"><label>'+esc(L("Ansicht simulieren"))+' <select data-simpick><option value="">'+esc(L("Rolle oder Person wählen …"))+'</option><optgroup label="'+esc(L("Rollen"))+'">'+roles.map(([v,n])=>'<option value="'+esc(v)+'">'+esc(n)+'</option>').join("")+'</optgroup>'+
    (ppl.length?'<optgroup label="'+esc(L("Personen"))+'">'+ppl.map(([v,n])=>'<option value="'+esc(v)+'">'+esc(n)+'</option>').join("")+'</optgroup>':'')+'</select></label></div>'};
document.addEventListener("change",e=>{const s=e.target.closest("[data-simpick]");if(!s||!s.value)return;const v=s.value;s.value="";if(v.startsWith("role:"))simStartRole(v.slice(5));else simStart(v)});
window.simBtn=em=>simCan(em)?'<button type="button" class="pillbtn simbtn" data-simstart="'+esc(em)+'">'+esc(L("Ansicht als diese Person"))+'</button>':'';
document.addEventListener("click",e=>{const s=e.target.closest("[data-simstart]");if(s){e.preventDefault();simStart(s.dataset.simstart);return}if(e.target.closest("[data-simend]"))simEnd()});
/* nothing is saved while simulating */
document.addEventListener("submit",e=>{if(!SIMUSER)return;e.preventDefault();e.stopImmediatePropagation();toast(L("Nur Ansicht – in der Simulation wird nichts gespeichert."),2500)},true);
