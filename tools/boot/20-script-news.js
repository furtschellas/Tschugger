import {L,S,dlgBtn,esc,localISO,mkDialog} from "../base/10-core.js";
import {vok} from "../base/14-render.js";
import {render} from "../base/15-script-tab.js";
import {store} from "../base/16-interaction.js";
import {arr} from "../base/20-data-start.js";
import {ME} from "./03-core-firebase.js";
import {savePrefsSoon} from "./06-prefs-docs.js";
import {TOUR} from "./08-chat-tour.js";
import {WELCOME_OPEN} from "./10-menus-welcome-presence.js";
import {ONBOARD} from "./11-account.js";
import {dmy} from "./14-today-changes-offline.js";
import {clogHTML} from "./16-today-view.js";
/* =====================================================================
   NEUE DREHBUCH-VERSION: einmalige Nachricht (nur mit «Drehbuch sehen»), mit Szenen und dem ganzen Changelog zum Aufklappen
   ===================================================================== */
const scrNewsKey=sx=>(sx.v||"")+"|"+(sx.at||"");
function scrNewsDue(){const sx=S.meta&&S.meta.scriptChange;if(!ME||!sx||!sx.at||!vok("script"))return null;
  const at=Date.parse(sx.at);if(!at||Date.now()-at>14*864e5)return null;   /* older than two weeks: no longer news */
  let seen="";try{seen=localStorage.getItem("scrv")||""}catch(_){}return seen===scrNewsKey(sx)?null:sx}
function scrNewsBusy(){return (typeof ONBOARD!=="undefined"&&ONBOARD)||(typeof WELCOME_OPEN!=="undefined"&&WELCOME_OPEN)||(typeof TOUR!=="undefined"&&TOUR.el)||
  ["news","rolechg","pushhint","scrnews","welcome","gate","twelcome","csbeta","iconhint","tour"].some(id=>{const e=document.getElementById(id);return e&&!e.hidden&&e.offsetParent!==null})}
export function showScriptNews(sx){
  store("scrv",scrNewsKey(sx));if(typeof savePrefsSoon==="function")savePrefsSoon();
  const sc=arr(sx.scenes),dt=new Date(Date.parse(sx.at));
  const d=mkDialog("scrnews");
  d.innerHTML='<div class="a2box wlbox scrbox"><span class="wlbeta">'+esc(L("Neu"))+'</span><h3>'+esc(L("Neue Drehbuch-Version"))+' '+esc(sx.v||"")+'</h3>'+
    '<p>'+esc(L("Seit {d} ist das Drehbuch {v} in der App.").replace("{d}",dmy(localISO(dt))).replace("{v}",sx.v||""))+(sx.prev&&sx.prev!==sx.v?' '+esc(L("Vorher")+": "+sx.prev+"."):'')+'</p>'+
    (sc.length?'<p class="scrsc"><b>'+esc(L(sc.length===1?"Geänderte Szene":"Geänderte Szenen"))+':</b> '+sc.map(x=>'<button type="button" class="lnk" data-scene="'+esc(x)+'">'+esc(x)+'</button>').join(", ")+'</p>':'')+
    (sx.log?'<details class="scrlog"><summary>'+esc(L("Ganzes Changelog"))+'</summary>'+clogHTML(sx.log)+'</details>':'')+
    '<div class="a2b"><button type="button" data-scrn="open">'+esc(L("Drehbuch öffnen"))+'</button>'+dlgBtn("pri",'data-scrn="ok"',"OK")+'</div></div>';
  d.addEventListener("click",e=>{const b=e.target.closest("[data-scrn]");if(e.target.closest("[data-scene]")){d.remove();return}if(!b)return;d.remove();
    if(b.dataset.scrn==="open"){S.tab="script";try{store("tab","script")}catch(_){}window.scrollTo(0,0);render()}});
  document.body.appendChild(d)}
window.maybeScriptNews=function(){if(window.__scrNewsOff)return;const sx=scrNewsDue();if(sx&&!scrNewsBusy())showScriptNews(sx)};
setInterval(()=>{try{window.maybeScriptNews()}catch(_){}},4000);
