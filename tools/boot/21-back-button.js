import {L,S,SBXF} from "../base/10-core.js";
import {onRendered,render} from "../base/15-script-tab.js";
import {store} from "../base/16-interaction.js";
import {closeScene} from "../base/17-scene-reader.js";
import {closeSearch} from "../base/19-search.js";
import {showMsg} from "../base/20-data-start.js";
import {ONBOARD} from "./11-account.js";
/* =====================================================================
   ZURÜCK-KNOPF DES TELEFONS: schliesst zuerst ein offenes Fenster (Pop-up, Szene, Suche, Galerie),
   sonst geht er zur vorherigen Seite der App (z. B. Drehbuch → Drehplan). Erst auf der ersten Seite verlässt er die App.
   ===================================================================== */
const NAV={last:null,pop:false,skip:0,open:0,depth:0};
/* windows that the back button may close (the welcome, the tour and the start screen are left alone) */
export function navDialogs(){const l=[];
  document.querySelectorAll("body > .a2hs").forEach(d=>{if(!d.hidden&&d.isConnected&&!["welcome","gate","splash"].includes(d.id)&&!(d.id==="acct"&&typeof ONBOARD!=="undefined"&&ONBOARD)&&getComputedStyle(d).display!=="none")l.push(d)});
  const g=document.getElementById("blkgal");if(g&&!l.includes(g))l.push(g);
  const sc=document.getElementById("scn");if(sc&&!sc.hidden)l.push(sc);
  const se=document.getElementById("search");if(se&&!se.hidden)l.push(se);
  return l}
function navClose(d){if(!d)return;if(d.id==="scn"&&typeof closeScene==="function")closeScene();else if(d.id==="search"&&typeof closeSearch==="function")closeSearch();
  else{const x=d.querySelector("[data-bcvx],[data-rcok],[data-rtx],.xclose,[data-scrn='ok'],[data-a2unok]");if(x&&x.closest("#"+(d.id||"_"))===d&&!x.closest("form"))x.click();if(d.isConnected)d.remove()}}
/* a new page of the app gets its own step back */
onRendered(()=>{if(SBXF)return;try{
    if(NAV.last===null){history.replaceState({t:S.tab,base:1},"");history.pushState({t:S.tab},"");NAV.last=S.tab}
    else if(S.tab!==NAV.last){if(!NAV.pop){history.pushState({t:S.tab},"");NAV.depth++}NAV.last=S.tab}}catch(_){}NAV.pop=false;navBtn()});
/* a window that opens gets a step back too; closed with its own button, that step is taken away again */
new MutationObserver(()=>{if(SBXF)return;const n=navDialogs().length;
  if(n>NAV.open){for(let i=NAV.open;i<n;i++)try{history.pushState({t:S.tab,d:1},"")}catch(_){}}
  else if(n<NAV.open&&!NAV.closing){const k=NAV.open-n;for(let i=0;i<k;i++){NAV.skip++;try{history.back()}catch(_){NAV.skip--}}}
  NAV.open=n;navBtn()}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});
window.addEventListener("popstate",e=>{
  if(NAV.skip>0){NAV.skip--;return}
  const ds=navDialogs();
  if(ds.length){NAV.closing=true;navClose(ds[ds.length-1]);NAV.open=navDialogs().length;setTimeout(()=>{NAV.closing=false},0);return}
  /* back on the first page: a hint – only a second «back» within 2.5 s leaves the app */
  if(e.state&&e.state.base){if(typeof showMsg==="function")showMsg(L("Zum Verlassen der App nochmals zurück drücken."),2500);clearTimeout(NAV.exitT);
    NAV.exitT=setTimeout(()=>{try{if(history.state&&history.state.base)history.pushState({t:S.tab},"")}catch(_){}},2500);return}
  const t=e.state&&e.state.t;if(NAV.depth>0)NAV.depth--;if(t&&t!==S.tab){NAV.pop=true;S.tab=t;try{store("tab",t)}catch(_){}window.scrollTo(0,0);render()}});
/* the back button top left: the same step back as the phone's button (disabled on the first page without an open window) */
function navBtn(){const b=document.getElementById("navback");if(b)b.disabled=!(NAV.depth>0||navDialogs().length)}
document.addEventListener("click",e=>{if(!e.target.closest("#navback"))return;e.preventDefault();if(NAV.depth>0||navDialogs().length)try{history.back()}catch(_){}});
