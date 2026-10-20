/* ---------- phone comfort: font size, offline bar with data time, sticky offsets, swipe between days ---------- */
/* font size «Normal» / «Gross» (Mein Konto › App › Darstellung): stored on this device, scales the page content */
function fsGet(){try{return localStorage.getItem("fsize:v1")||"n"}catch(_){return "n"}}
function fsApply(){document.documentElement.classList.toggle("fs-l",fsGet()==="l")}
fsApply();
document.addEventListener("click",e=>{const b=e.target.closest("[data-fsset]");if(!b)return;try{localStorage.setItem("fsize:v1",b.dataset.fsset)}catch(_){}fsApply();
  b.parentElement.querySelectorAll("[data-fsset]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)))});
/* offline: a small bar above the tabs on every page, with the time the data was last confirmed current */
function offTime(){let t=0;try{t=+localStorage.getItem("dtime:v1")||0}catch(_){}if(!t)return"";const d=new Date(t),p=n=>String(n).padStart(2,"0");
  return p(d.getDate())+"."+p(d.getMonth()+1)+". "+p(d.getHours())+":"+p(d.getMinutes())}
function offBar(){let b=document.getElementById("offbar");const off=navigator.onLine===false;
  if(!off){if(b)b.remove();return}
  const nav=document.querySelector("nav.tabs");if(!b){b=document.createElement("div");b.id="offbar";b.setAttribute("role","status")}
  const t=offTime();b.textContent=t?L("Offline – Stand von")+" "+t:L("offline");
  if(nav){if(b.parentElement!==nav)nav.appendChild(b)}else if(b.parentElement!==document.body)document.body.appendChild(b)}
addEventListener("online",offBar);addEventListener("offline",offBar);setTimeout(offBar,1500);setInterval(offBar,60000);
/* sticky: the day bar stays on top, the callsheet bar right below it – measure the day bar's height */
let STK="";function stickyH(){const w=document.querySelector("#view .stripwrap"),j=document.querySelector("#view .csjump");
  const h=w?Math.round(w.getBoundingClientRect().height):0,jh=j?Math.round(j.getBoundingClientRect().height):0,k=h+"|"+jh;if(k===STK)return;STK=k;   /* only when a height changed */
  document.documentElement.style.setProperty("--striph",h+"px");document.documentElement.style.setProperty("--csjh",jh+"px")}
try{new MutationObserver(()=>requestAnimationFrame(stickyH)).observe(document.getElementById("view")||document.body,{childList:true,subtree:true})}catch(_){}
/* the day bar changes its height (font, units, rotation): measure again */
try{const ro=new ResizeObserver(()=>stickyH());const watch=()=>{const w=document.querySelector("#view .stripwrap");if(w&&!w.__ro){w.__ro=1;ro.observe(w)}};new MutationObserver(watch).observe(document.getElementById("view")||document.body,{childList:true,subtree:true});watch()}catch(_){}
addEventListener("resize",stickyH);setTimeout(stickyH,800);
{let rq=0;addEventListener("scroll",()=>{if(rq)return;rq=requestAnimationFrame(()=>{rq=0;stickyH()})},{passive:true})}
/* swipe left/right over the page = next/previous day (pages with the day bar); not inside things that scroll sideways */
{let sx=0,sy=0,st=0,ok=false;
 const scrollsX=el=>{for(let n=el;n&&n!==document.body;n=n.parentElement){if(n.matches&&n.matches(".stripwrap,.csjb,.tblw,input,textarea,select,[data-noswipe],.galstage,.mapbox"))return true;const cs=getComputedStyle(n);if(/(auto|scroll)/.test(cs.overflowX)&&n.scrollWidth>n.clientWidth+2)return true}return false};
 document.addEventListener("touchstart",e=>{ok=false;if(e.touches.length!==1)return;const v=document.getElementById("view");if(!v||!v.contains(e.target)||!v.querySelector(".stripwrap .strip"))return;
   if(scrollsX(e.target)||document.querySelector(".a2box,#tour,dialog[open]"))return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now();ok=true},{passive:true});
 document.addEventListener("touchend",e=>{if(!ok)return;ok=false;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
   if(Date.now()-st>700||Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*0.6)return;
   const ch=[...document.querySelectorAll("#view .stripwrap .strip .chip")].filter(c=>!c.disabled);const i=ch.findIndex(c=>c.getAttribute("aria-selected")==="true");if(i<0)return;
   const n=ch[i+(dx<0?1:-1)];if(!n)return;n.click();n.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"});
   const v=document.getElementById("view");if(v){v.classList.remove("swl","swr");void v.offsetWidth;v.classList.add(dx<0?"swl":"swr");setTimeout(()=>v.classList.remove("swl","swr"),260)}},{passive:true})}
/* time tiles: shrink the font of a tile row until it fits on one line (texts are never cut); below 55 % a second row instead */
function csFitTiles(){if(innerWidth<480)return;document.querySelectorAll("#view .dtiles.cstiles").forEach(r=>{if(!r.offsetParent)return;
  r.classList.remove("cswrap");let f=1;r.style.setProperty("--csf","1");
  for(let i=0;i<6;i++){const need=r.scrollWidth,have=r.clientWidth;if(need<=have+1)break;f=Math.max(.55,f*have/need*.98);r.style.setProperty("--csf",f.toFixed(3));if(f<=.55)break}
  if(r.scrollWidth>r.clientWidth+1){r.style.setProperty("--csf",".7");r.classList.add("cswrap")}})}
{let q=0;const go=()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;csFitTiles()})};
 addEventListener("resize",go);
 const v=document.getElementById("view");if(v)new MutationObserver(go).observe(v,{childList:true,subtree:true});
 document.addEventListener("toggle",go,true);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go)}
