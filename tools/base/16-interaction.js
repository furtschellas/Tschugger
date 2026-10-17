/* ---------- interaction (one delegated click handler) ---------- */
function setOpen(btn,open){
  const k=btn.dataset.sckey;S.openSc[k]=open;btn.setAttribute("aria-expanded",open);
  const c=btn.closest(".scd");if(!c)return;c.classList.toggle("open",open);const body=c.querySelector(".scb");if(body)body.hidden=!open;
  if(open)try{fitAddr(c)}catch(_){}
}
function scallLabel(){const b=document.getElementById("scall");if(!b)return;const ks=[...document.querySelectorAll("[data-sckey]")].map(x=>x.dataset.sckey);const all=ks.length>0&&ks.every(k=>S.openSc[k]);b.setAttribute("aria-expanded",all);b.classList.toggle("on",all)}
/* tapping the tab you are already on jumps back to today; switching tabs keeps the last chosen day */
function goTab(tab){S.want=null;const again=S.tab===tab;S.tab=tab;S.srcOpen=false;if(again&&tab==="plan")S.day=null;if(again&&tab==="dispo")S.dday=null;store("tab",tab);window.scrollTo(0,0)}
/* last chosen day (Schedule, Callsheet), page and open scenes are remembered; after 2 hours without use or a new sign-in it starts at today again */
const VS_TTL=2*3600*1000;let VS_AT=Date.now();
try{const v=JSON.parse(localStorage.getItem("viewstate")||"null");if(v&&Date.now()-(+v.at||0)<VS_TTL){if(v.day)S.day=v.day;if(v.dday)S.dday=v.dday;if(v.openSc&&typeof v.openSc==="object")S.openSc=v.openSc;if(v.tab)S.tab=v.tab;VS_AT=+v.at}}catch(_){}
document.addEventListener("pointerdown",()=>{VS_AT=Date.now()},true);document.addEventListener("keydown",()=>{VS_AT=Date.now()},true);
function saveView(){try{localStorage.setItem("viewstate",JSON.stringify({at:VS_AT,tab:S.tab,day:S.day,dday:S.dday,openSc:S.openSc}))}catch(_){}}
window.resetViewState=()=>{try{localStorage.removeItem("viewstate")}catch(_){}S.day=null;S.dday=null;S.openSc={}};
window.addEventListener("pagehide",saveView);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")saveView();else if(Date.now()-VS_AT>VS_TTL){S.day=null;S.dday=null;VS_AT=Date.now();render()}});
function store(k,v){try{localStorage.setItem(k,v)}catch(_){}}
