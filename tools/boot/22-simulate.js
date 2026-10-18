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
  if(r==="owner")SIMROLE=null;else{SIMROLE={adm:r==="admin",user:em};MYPERMS=r==="admin"?[]:arr(ro.perms).filter(p=>PERMS.some(x=>x[0]===p));MYROLE=r==="admin"?"":ro.id;if(r==="admin")ADMINPERMS=ro.perms}
  try{if(mem)MEMBER=mem}catch(_){}
  S.tab="today";simRefreshChrome();simBar();render();scrollTo(0,0)}
function simEnd(){if(!SIMUSER)return;const k=SIMUSER.keep;SIMUSER=null;SIMROLE=null;MYPERMS=k.p;MYROLE=k.r;ADMINPERMS=k.ap;try{MEMBER=k.mem}catch(_){}
  S.tab=k.tab||"admin";ADM.sub=k.sub;simRefreshChrome();simBar();render()}
window.simBtn=em=>simCan(em)?'<button type="button" class="pillbtn simbtn" data-simstart="'+esc(em)+'">'+esc(L("Ansicht als diese Person"))+'</button>':'';
document.addEventListener("click",e=>{const s=e.target.closest("[data-simstart]");if(s){e.preventDefault();simStart(s.dataset.simstart);return}if(e.target.closest("[data-simend]"))simEnd()});
/* nothing is saved while simulating */
document.addEventListener("submit",e=>{if(!SIMUSER)return;e.preventDefault();e.stopImmediatePropagation();toast(L("Nur Ansicht – in der Simulation wird nichts gespeichert."),2500)},true);
