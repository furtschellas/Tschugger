import {esc,fullName,L,LANG,MEMO,S} from "../base/10-core.js";
import {toast} from "../base/11-schedule-prep.js";
import {vok} from "../base/14-render.js";
import {render} from "../base/15-script-tab.js";
import {arr} from "../base/20-data-start.js";
import {ADMINPERMS,ADMIN_DEFAULT,ME,MEMBER,MYPERMS,MYROLE,PERMS,SIMROLE,isAdmin,isOwner,lc,permKnown,setADMINPERMS,setMEMBER,setMYPERMS,setMYROLE,setSIMROLE} from "./03-core-firebase.js";
import {bcButton} from "./09-broadcast.js";
import {acctButton} from "./11-account.js";
import {ADM,ensureAdm} from "./12a-admin-core.js";
/* global roleOf, rolesSorted */   // from the App-Verwaltung (admin.js, loaded on demand)
/* ---------- view the app as another person (owner and admins): App-Verwaltung → Benutzer → Profil → «Ansicht als …» ----------
   Only the view changes (rights of the person's role, «Meine Termine», own events, department); nothing is saved while simulating.
   A pink bar on top shows whose view it is and ends the simulation. Owners can only be simulated by owners. */
export let SIMUSER=null;
window.simEmail=()=>SIMUSER?SIMUSER.email:((typeof ME!=="undefined"&&ME&&ME.email)||"");
window.simOn=()=>!!SIMUSER;
function simCan(em){if(!isAdmin()||SIMROLE||!em)return false;const r=roleOf(em);return lc(em)!==lc(ME&&ME.email||"")&&(r!=="owner"||isOwner())&&(r!=="admin"||isOwner())}
function simBar(){let b=document.getElementById("simbar");
  if(!SIMUSER){if(b)b.remove();document.body.classList.remove("simming");return}
  if(!b){b=document.createElement("div");b.id="simbar";b.setAttribute("role","status");document.body.appendChild(b)}
  document.body.classList.add("simming");
  b.innerHTML='<span>'+esc(L("Ansicht als"))+' <b>'+esc(SIMUSER.name)+'</b> · '+esc(SIMUSER.rname)+' · '+esc(L("nur ansehen"))+'</span><button type="button" data-simend>'+esc(L("Beenden"))+'</button>'}
function simRefreshChrome(){try{acctButton(true);if(typeof bcButton==="function")bcButton();const mb=document.getElementById("myCalBtn");if(mb)mb.hidden=!vok("mycal")}catch(_){}}
/* the simulation stays when the page is reloaded (this tab only: closing the tab or «Beenden» ends it) */
const simKeep=v=>{try{if(v)sessionStorage.setItem("sim",JSON.stringify(v));else sessionStorage.removeItem("sim")}catch(_){}};
function simStart(em,re){em=lc(em);if(!simCan(em))return;
  const r=roleOf(em),ro=r==="admin"?{id:"admin",name:L("Admin"),perms:(ADM.adminPerms||ADMIN_DEFAULT).slice()}:r==="owner"?{id:"owner",name:L("Owner"),perms:PERMS.map(x=>x[0])}:((ADM.roles||[]).find(x=>x.id===r)||{id:"",name:L("Keine Rolle"),perms:[]});
  const mem=(ADM.mem||[]).find(x=>lc(x.email||"")===em)||null,inv=(ADM.inv||[]).find(x=>x.id===em)||{};
  const name=(mem&&fullName(mem))||inv.name||em;
  SIMUSER={email:em,name,rname:ro.name||ro.id||L("Keine Rolle"),keep:{p:MYPERMS.slice(),r:MYROLE,rn:window.MYROLENAME||"",ap:ADMINPERMS.slice(),mem:typeof MEMBER!=="undefined"?MEMBER:null,tab:S.tab,sub:ADM.sub}};
  if(r==="owner")setSIMROLE(null);else{setSIMROLE({adm:r==="admin",user:em});setMYPERMS(r==="admin"?[]:arr(ro.perms).filter(p=>permKnown(p)));setMYROLE(r==="admin"?"":ro.id);if(r==="admin")setADMINPERMS(ro.perms)}window.MYROLENAME=r==="admin"||r==="owner"?"":ro.name||"";
  /* the simulated person's own data: profile (name), callsheet «my day», my appointments – never the admin's */
  try{setMEMBER(mem||{name:inv.name||"",email:em})}catch(_){}try{MEMO.clear()}catch(_){}
  simKeep({e:em,tab:(re&&re.back)||SIMUSER.keep.tab});if(re)SIMUSER.keep.tab=re.back||SIMUSER.keep.tab;
  if(!re)S.tab="today";simRefreshChrome();simBar();render();if(!re)scrollTo(0,0)}
/* sign-out: the simulation ends without giving back the rights of before (they belong to the person who signed out) */
window.simReset=()=>{simKeep(null);if(!SIMUSER&&!SIMROLE)return;SIMUSER=null;setSIMROLE(null);try{MEMO.clear()}catch(_){}const b=document.getElementById("simbar");if(b)b.remove();document.body.classList.remove("simming")};
function simEnd(){if(!SIMUSER)return;simKeep(null);const k=SIMUSER.keep;SIMUSER=null;try{MEMO.clear()}catch(_){}setSIMROLE(null);setMYPERMS(k.p);setMYROLE(k.r);window.MYROLENAME=k.rn||"";setADMINPERMS(k.ap);try{setMEMBER(k.mem)}catch(_){}
  S.tab=k.tab||"admin";ADM.sub=k.sub;simRefreshChrome();simBar();render()}
/* a role without a specific person: «role:<id>» ("" = no role, "admin") – shows exactly what everybody with that role sees */
function simRoleCan(id){return isAdmin()&&!SIMROLE&&!SIMUSER&&(id!=="admin"||isOwner())}
function simStartRole(id,re){if(!simRoleCan(id))return;
  const ro=id==="admin"?{id:"admin",name:L("Admin"),perms:(ADM.adminPerms||ADMIN_DEFAULT).slice()}:id?((ADM.roles||[]).find(x=>x.id===id)||null):{id:"",name:L("Keine Rolle"),perms:[]};
  if(!ro)return;
  SIMUSER={email:"",name:L("Rolle")+" «"+(ro.name||ro.id||L("Keine Rolle"))+"»",rname:L("ohne Person"),keep:{p:MYPERMS.slice(),r:MYROLE,rn:window.MYROLENAME||"",ap:ADMINPERMS.slice(),mem:typeof MEMBER!=="undefined"?MEMBER:null,tab:S.tab,sub:ADM.sub}};
  setSIMROLE({adm:id==="admin",user:""});setMYPERMS(id==="admin"?[]:arr(ro.perms).filter(p=>permKnown(p)));setMYROLE(id==="admin"?"":ro.id);if(id==="admin")setADMINPERMS(ro.perms);window.MYROLENAME=id==="admin"?"":ro.name||"";
  try{setMEMBER(null)}catch(_){}
  simKeep({r:id,tab:(re&&re.back)||SIMUSER.keep.tab});if(re)SIMUSER.keep.tab=re.back||SIMUSER.keep.tab;
  if(!re)S.tab="today";simRefreshChrome();simBar();render();if(!re)scrollTo(0,0)}
/* after a reload: start the same simulation again once the user list is loaded (the page that was open stays) */
{let tries=0;const iv=setInterval(()=>{let v=null;try{v=JSON.parse(sessionStorage.getItem("sim")||"null")}catch(_){}
  if(!v||SIMUSER||++tries>120){clearInterval(iv);return}
  if(typeof ME==="undefined"||!ME||!isAdmin())return;if(typeof roleOf!=="function"){if(window.loadAdminUI)window.loadAdminUI().catch(()=>{});return}if(!ADM.loaded){if(typeof ensureAdm==="function")ensureAdm();return}
  clearInterval(iv);const re={back:v.tab||"admin"};if(v.e)simStart(v.e,re);else if(typeof v.r==="string")simStartRole(v.r,re);if(!SIMUSER)simKeep(null)},500)}
/* quick picker «Ansicht als …» (roles and people) for the admin pages */
window.simPicker=()=>{if(!isAdmin()||SIMROLE||SIMUSER)return "";
  const roles=[["role:",L("Keine Rolle")]].concat(isOwner()?[["role:admin",L("Admin")]]:[],(window.rolesSorted?rolesSorted():(ADM.roles||[])).map(r=>["role:"+r.id,r.name||r.id]));
  const ppl=[];const seen=new Set();for(const m of (ADM.mem||[])){const em=lc(m.email||"");if(!em||seen.has(em)||!simCan(em))continue;seen.add(em);ppl.push([em,fullName(m)||em])}
  /* invited people without an account yet too (before, only people with an account could be picked here) */
  /* in their own group «Noch ohne Konto» (the remark after each name broke the lines of the phone's list) */
  const inv=[];for(const i of (ADM.inv||[])){const em=lc(i.id||"");if(!em||seen.has(em)||!simCan(em))continue;seen.add(em);inv.push([em,i.name||em])}inv.sort((a,b)=>a[1].localeCompare(b[1],LANG));
  ppl.sort((a,b)=>a[1].localeCompare(b[1],LANG));
  return '<div class="simpick"><label>'+esc(L("Ansicht simulieren"))+' <select data-simpick><option value="">'+esc(L("Rolle oder Person wählen …"))+'</option><optgroup label="'+esc(L("Rollen"))+'">'+roles.map(([v,n])=>'<option value="'+esc(v)+'">'+esc(n)+'</option>').join("")+'</optgroup>'+
    (ppl.length?'<optgroup label="'+esc(L("Personen"))+'">'+ppl.map(([v,n])=>'<option value="'+esc(v)+'">'+esc(n)+'</option>').join("")+'</optgroup>':'')+
    (inv.length?'<optgroup label="'+esc(L("Noch ohne Konto"))+'">'+inv.map(([v,n])=>'<option value="'+esc(v)+'">'+esc(n)+'</option>').join("")+'</optgroup>':'')+'</select></label></div>'};
document.addEventListener("change",e=>{const s=e.target.closest("[data-simpick]");if(!s||!s.value)return;const v=s.value;s.value="";if(v.startsWith("role:"))simStartRole(v.slice(5));else simStart(v)});
window.simBtn=em=>simCan(em)?'<button type="button" class="pillbtn simbtn" data-simstart="'+esc(em)+'">'+esc(L("Ansicht als diese Person"))+'</button>':'';
document.addEventListener("click",e=>{const s=e.target.closest("[data-simstart]");if(s){e.preventDefault();simStart(s.dataset.simstart);return}if(e.target.closest("[data-simend]"))simEnd()});
/* nothing is saved while simulating */
document.addEventListener("submit",e=>{if(!SIMUSER)return;e.preventDefault();e.stopImmediatePropagation();toast(L("Nur Ansicht – in der Simulation wird nichts gespeichert."),2500)},true);
