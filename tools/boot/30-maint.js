import {L,esc,mkDialog} from "../base/10-core.js";
import {ME} from "./03-core-firebase.js";
import {PREFOK,docGet,maintOn,maintOnce,savePrefs} from "./06-prefs-docs.js";
import {store} from "../base/16-interaction.js";
import {WELCOME_OPEN} from "./10-menus-welcome-presence.js";
import {ONBOARD} from "./11-account.js";
/* ---- maintenance note: at every start of the app (once per opening, after the welcome note), closed with «OK».
   Text: App-Verwaltung → Dokumente → «Wartungshinweis» (per language), switched on and off there (for everybody) ---- */
let MAINT_DONE=false;
function maybeMaint(){if(window.__MAINTRESET){window.__MAINTRESET=false;MAINT_DONE=false}if(MAINT_DONE||!ME||navigator.webdriver||!(window.maintOn&&maintOn())||(typeof WELCOME_OPEN!=="undefined"&&WELCOME_OPEN)||(typeof ONBOARD!=="undefined"&&ONBOARD)||document.querySelector(".a2hs:not([hidden]),.tour-card"))return;
  const T=docGet("maint",{});if(!String(T.body||"").trim())return;
  /* «nur einmal pro Person»: the text (title + body) as a short mark – seen = not again, a new text = once more */
  const mk=(s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return (h>>>0).toString(36)})(String(T.subject||"")+"|"+String(T.body||"")),once=maintOnce();
  /* «nur einmal»: only once the person's settings are loaded – else «seen» would be saved over their settings on all devices */
  if(once&&!PREFOK)return;
  if(once){let seen="";try{seen=localStorage.getItem("maintseen")||""}catch(_){}if(seen===mk){MAINT_DONE=true;return}}
  MAINT_DONE=true;const d=mkDialog("maint");
  d.innerHTML='<div class="a2box wlbox" role="alertdialog" aria-labelledby="mtt"><h3 id="mtt">'+esc(T.subject||L("Wartungsarbeiten"))+'</h3>'+String(T.body).split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(x=>'<p class="wlwarn">'+esc(x)+'</p>').join("")+'<div class="a2b"><button type="button" class="pri" data-mtok>OK</button></div></div>';
  d.addEventListener("click",e=>{if(e.target.closest("[data-mtok]")){d.remove();if(once){store("maintseen",mk);try{savePrefs()}catch(_){}}}});document.body.appendChild(d)}
setInterval(()=>{try{maybeMaint()}catch(_){}},1500);
