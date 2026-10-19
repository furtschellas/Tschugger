/* ---------- interaction (one delegated click handler) ---------- */
function setOpen(btn,open){
  const k=btn.dataset.sckey;S.openSc[k]=open;btn.setAttribute("aria-expanded",open);
  const c=btn.closest(".scd");if(!c)return;c.classList.toggle("open",open);const body=c.querySelector(".scb");if(body)body.hidden=!open;
  if(open)try{fitAddr(c)}catch(_){}
}
function scallLabel(){const b=document.getElementById("scall");if(!b)return;const ks=[...document.querySelectorAll("[data-sckey]")].map(x=>x.dataset.sckey);const all=ks.length>0&&ks.every(k=>S.openSc[k]);b.setAttribute("aria-expanded",all);b.classList.toggle("on",all)}
/* tapping the tab you are already on jumps back to today; switching tabs keeps the last chosen day */
function goTab(tab){S.want=null;const again=S.tab===tab;S.tab=tab;S.srcOpen=false;if(again&&tab==="plan")S.day=null;if(again&&tab==="dispo")S.dday=null;if(tab==="script"){S.sqm="all";S.sq="";S.sqn=0}   /* the script search always starts again with «Alle» */
store("tab",tab);window.scrollTo(0,0)}
/* last chosen day (Schedule, Callsheet), page and open scenes are kept on a reload; a new start, or coming back after
   at least 10 minutes in the background, opens the start page (Today, or the Drehplan at today) */
const VS_TTL=2*3600*1000;let VS_AT=Date.now();
try{const v=JSON.parse(localStorage.getItem("viewstate")||"null");if(v&&window.__REL&&!location.hash&&Date.now()-(+v.at||0)<VS_TTL){if(v.day)S.day=v.day;if(v.dday)S.dday=v.dday;if(v.openSc&&typeof v.openSc==="object")S.openSc=v.openSc;if(v.tab)S.tab=v.tab;VS_AT=+v.at}}catch(_){}
document.addEventListener("pointerdown",()=>{VS_AT=Date.now()},true);document.addEventListener("keydown",()=>{VS_AT=Date.now()},true);
function saveView(){try{localStorage.setItem("viewstate",JSON.stringify({at:VS_AT,tab:S.tab,day:S.day,dday:S.dday,openSc:S.openSc}))}catch(_){}}
window.resetViewState=()=>{try{localStorage.removeItem("viewstate")}catch(_){}S.day=null;S.dday=null;S.openSc={}};
window.addEventListener("pagehide",saveView);const RESUME=30*60e3;   /* back after more than 30 minutes: start page; shorter: the same page */let HID_AT=0;
window.goStart=()=>{S.want=null;S.srcOpen=false;S.tab=startTab();S.day=null;S.dday=null;S.openSc={};VS_AT=Date.now();store("tab",S.tab);window.scrollTo(0,0);render()};
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){saveView();HID_AT=Date.now()}else{if(HID_AT&&Date.now()-HID_AT>=RESUME&&!(typeof navDialogs==="function"&&navDialogs().length))goStart();HID_AT=0}});
function store(k,v){try{localStorage.setItem(k,v)}catch(_){}}

/* Today «Mein Tag» → the callsheet of that day */
document.addEventListener("click",e=>{const b=e.target.closest("[data-tocs]");if(!b)return;S.dday=b.dataset.tocs;goTab("dispo")});
