import {L,esc,mkDialog} from "../base/10-core.js";
import {ME} from "./03-core-firebase.js";
import {docGet,maintOn} from "./06-prefs-docs.js";
import {WELCOME_OPEN} from "./10-menus-welcome-presence.js";
import {ONBOARD} from "./11-account.js";
/* ---- maintenance note: at every start of the app (once per opening, after the welcome note), closed with «OK».
   Text: App-Verwaltung → Dokumente → «Wartungshinweis» (per language), switched on and off there (for everybody) ---- */
let MAINT_DONE=false;
function maybeMaint(){if(MAINT_DONE||!ME||navigator.webdriver||!(window.maintOn&&maintOn())||(typeof WELCOME_OPEN!=="undefined"&&WELCOME_OPEN)||(typeof ONBOARD!=="undefined"&&ONBOARD)||document.querySelector(".a2hs:not([hidden]),.tour-card"))return;
  const T=docGet("maint",{});if(!String(T.body||"").trim())return;MAINT_DONE=true;const d=mkDialog("maint");
  d.innerHTML='<div class="a2box wlbox" role="alertdialog" aria-labelledby="mtt"><h3 id="mtt">'+esc(T.subject||L("Wartungsarbeiten"))+'</h3>'+String(T.body).split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(x=>'<p class="wlwarn">'+esc(x)+'</p>').join("")+'<div class="a2b"><button type="button" class="pri" data-mtok>OK</button></div></div>';
  d.addEventListener("click",e=>{if(e.target.closest("[data-mtok]"))d.remove()});document.body.appendChild(d)}
setInterval(()=>{try{maybeMaint()}catch(_){}},1500);
