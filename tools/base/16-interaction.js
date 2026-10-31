import {S,SBXF} from "./10-core.js";
import {fitAddr,render} from "./15-script-tab.js";
import {navDialogs} from "../boot/21-back-button.js";
/* ---------- interaction (one delegated click handler) ---------- */
export function setOpen(btn,open){
  const k=btn.dataset.sckey;S.openSc[k]=open;btn.setAttribute("aria-expanded",open);
  const c=btn.closest(".scd");if(!c)return;c.classList.toggle("open",open);const body=c.querySelector(".scb");if(body)body.hidden=!open;
  if(open)try{fitAddr(c)}catch(_){}
}
export function scallLabel(){const b=document.getElementById("scall");if(!b)return;const ks=[...document.querySelectorAll("[data-sckey]")].map(x=>x.dataset.sckey);const all=ks.length>0&&ks.every(k=>S.openSc[k]);b.setAttribute("aria-expanded",all);b.classList.toggle("on",all)}
/* tapping the tab you are already on jumps back to today; switching tabs keeps the last chosen day */
export function goTab(tab){S.want=null;const again=S.tab===tab,from=S.tab;S.tab=tab;S.srcOpen=false;if(again&&tab==="plan")S.day=null;
  /* Drehplan ↔ Callsheet: the same day on both sides; otherwise the callsheet opens at the current day */
  if(tab==="dispo"&&!again){const pd=from==="plan"&&S.days.find(d=>d.id===S.day);S.dday=pd?pd.date:null}else if(tab==="dispo")S.dday=null;
  if(tab==="plan"&&from==="dispo"&&S.dday){const d=S.days.find(x=>x.date===S.dday&&x.kind!=="off");if(d)S.day=d.id}if(tab==="script"){S.sqm="all";S.sq=""}   /* the script search always starts again with «Alle» */
store("tab",tab);window.scrollTo(0,0)}
/* last chosen day (Schedule, Callsheet), page and open scenes are kept on a reload; a new start, or coming back after
   at least 10 minutes in the background, opens the start page (Today, or the Drehplan at today) */
const VS_TTL=2*3600*1000;let VS_AT=Date.now();
try{const v=JSON.parse(localStorage.getItem("viewstate")||"null");if(v&&window.__REL&&!location.hash&&Date.now()-(+v.at||0)<VS_TTL){if(v.day)S.day=v.day;if(v.dday)S.dday=v.dday;if(v.openSc&&typeof v.openSc==="object")S.openSc=v.openSc;if(v.tab)S.tab=v.tab;VS_AT=+v.at;if(window.__FRESH&&+v.y>0)window.__VSY=+v.y}}catch(_){}
document.addEventListener("pointerdown",()=>{VS_AT=Date.now()},true);document.addEventListener("keydown",()=>{VS_AT=Date.now()},true);
export function saveView(){if(SBXF)return;try{localStorage.setItem("viewstate",JSON.stringify({at:VS_AT,tab:S.tab,day:S.day,dday:S.dday,openSc:S.openSc,y:Math.round(window.scrollY||0)}))}catch(_){}}
window.resetViewState=()=>{try{localStorage.removeItem("viewstate")}catch(_){}S.day=null;S.dday=null;S.openSc={}};
window.addEventListener("pagehide",saveView);const RESUME=30*60e3;   /* back after more than 30 minutes: start page; shorter: the same page */let HID_AT=0;
window.goStart=()=>{S.want=null;S.srcOpen=false;S.tab=startTab();S.day=null;S.dday=null;S.openSc={};VS_AT=Date.now();store("tab",S.tab);window.scrollTo(0,0);render()};
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){saveView();HID_AT=Date.now()}else{if(HID_AT&&Date.now()-HID_AT>=RESUME&&!(typeof navDialogs==="function"&&navDialogs().length))goStart();HID_AT=0}});
/* other parts listen to stored settings with onStore(fn) (e.g. the settings synced to the account) – instead of replacing store */
const STORE_HOOKS=[];export function onStore(fn){STORE_HOOKS.push(fn)}
export function store(k,v){if(SBXF)return;try{localStorage.setItem(k,v)}catch(_){}for(const f of STORE_HOOKS)try{f(k,v)}catch(_){}}

/* Today «Mein Tag» → the callsheet of that day */
document.addEventListener("click",e=>{const b=e.target.closest("[data-tocs]");if(!b)return;goTab("dispo");S.dday=b.dataset.tocs;render()});
