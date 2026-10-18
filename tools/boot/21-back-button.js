/* =====================================================================
   ZURÜCK-KNOPF DES TELEFONS: schliesst zuerst ein offenes Fenster (Pop-up, Szene, Suche, Galerie),
   sonst geht er zur vorherigen Seite der App (z. B. Drehbuch → Drehplan). Erst auf der ersten Seite verlässt er die App.
   ===================================================================== */
const NAV={last:null,pop:false,skip:0,open:0};
/* windows that the back button may close (the welcome, the tour and the start screen are left alone) */
function navDialogs(){const l=[];
  document.querySelectorAll("body > .a2hs").forEach(d=>{if(!d.hidden&&d.isConnected&&!["welcome","gate","splash"].includes(d.id)&&!(d.id==="acct"&&typeof ONBOARD!=="undefined"&&ONBOARD)&&getComputedStyle(d).display!=="none")l.push(d)});
  const g=document.getElementById("blkgal");if(g&&!l.includes(g))l.push(g);
  const sc=document.getElementById("scn");if(sc&&!sc.hidden)l.push(sc);
  const se=document.getElementById("search");if(se&&!se.hidden)l.push(se);
  return l}
function navClose(d){if(!d)return;if(d.id==="scn"&&typeof closeScene==="function")closeScene();else if(d.id==="search"&&typeof closeSearch==="function")closeSearch();
  else{const x=d.querySelector("[data-bcvx],[data-rcok],[data-rtx],.xclose,[data-scrn='ok'],[data-a2unok]");if(x&&x.closest("#"+(d.id||"_"))===d&&!x.closest("form"))x.click();if(d.isConnected)d.remove()}}
/* a new page of the app gets its own step back */
{const _r=render;render=function(){const x=_r.apply(this,arguments);try{
    if(NAV.last===null){history.replaceState({t:S.tab,base:1},"");history.pushState({t:S.tab},"");NAV.last=S.tab}
    else if(S.tab!==NAV.last){if(!NAV.pop)history.pushState({t:S.tab},"");NAV.last=S.tab}}catch(_){}NAV.pop=false;return x}}
/* a window that opens gets a step back too; closed with its own button, that step is taken away again */
new MutationObserver(()=>{const n=navDialogs().length;
  if(n>NAV.open){for(let i=NAV.open;i<n;i++)try{history.pushState({t:S.tab,d:1},"")}catch(_){}}
  else if(n<NAV.open&&!NAV.closing){const k=NAV.open-n;for(let i=0;i<k;i++){NAV.skip++;try{history.back()}catch(_){NAV.skip--}}}
  NAV.open=n}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});
window.addEventListener("popstate",e=>{
  if(NAV.skip>0){NAV.skip--;return}
  const ds=navDialogs();
  if(ds.length){NAV.closing=true;navClose(ds[ds.length-1]);NAV.open=navDialogs().length;setTimeout(()=>{NAV.closing=false},0);return}
  /* back on the first page: a hint – only a second «back» within 2.5 s leaves the app */
  if(e.state&&e.state.base){if(typeof showMsg==="function")showMsg(L("Zum Verlassen der App nochmals zurück drücken."),2500);clearTimeout(NAV.exitT);
    NAV.exitT=setTimeout(()=>{try{if(history.state&&history.state.base)history.pushState({t:S.tab},"")}catch(_){}},2500);return}
  const t=e.state&&e.state.t;if(t&&t!==S.tab){NAV.pop=true;S.tab=t;try{store("tab",t)}catch(_){}window.scrollTo(0,0);render()}});
