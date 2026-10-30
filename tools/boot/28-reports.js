import {L,S,esc,safeUrl} from "../base/10-core.js";
import {VIEWS} from "../base/14-render.js";
import {fold,render} from "../base/15-script-tab.js";
import {openGallery} from "../base/18-blocking.js";
import {arr,showMsg} from "../base/20-data-start.js";
import {ME,MYPERMS,PERMS,can,isAdmin,isOwner} from "./03-core-firebase.js";
import {logHead,tstIco} from "./17-audit-misc.js";
import {SCLOG} from "./27-scene-ack.js";
/* ---------- Einstellungen → Logs → «Reports»: the PDFs of the Dropbox folder «3D/20_Reports» (production, DIT, sound …), one group per sub folder.
   Every report: the gallery (pages as pictures, like the floorplans), the file in the Dropbox and the PDF. Who sees a group: the permission
   «Reports: <folder>» (one per sub folder, in the roles under «Reports»); admins and the owner see all ---------- */
const repSlug=g=>fold(String(g||"")).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"allgemein";
/* a sound report filed in another folder (e.g. DIT) belongs to «Sound» */
const repList=()=>arr(S.meta&&S.meta.reports).filter(r=>r&&typeof r==="object"&&r.n).map(r=>/sound/i.test(r.n)&&!/sound/i.test(r.g||"")&&repFolders().some(f=>/^sound$/i.test(f))?Object.assign({},r,{g:repFolders().find(f=>/^sound$/i.test(f))}):r);
/* all report folders, also empty ones (from the updater), plus the folders of the reports */
const repFolders=()=>arr(S.meta&&S.meta.repFolders).map(String).filter(Boolean);
/* one permission per sub folder: added to the list of permissions as soon as the folder is known */
window.repPermsSync=()=>{for(const g of [...new Set(repList().map(r=>String(r.g||"")).concat(repFolders()))]){const k="rep."+repSlug(g);if(!PERMS.some(x=>x[0]===k))PERMS.push([k,g?repTitle(g):"Allgemein","Reports"])}};
window.canRep=g=>{try{return isOwner()||isAdmin()||can("rep."+repSlug(g))}catch(_){return false}};
window.canRepAny=()=>{try{return isOwner()||isAdmin()||MYPERMS.some(p=>/^rep\./.test(p))}catch(_){return false}};
const REPLOG={};
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&/^rep-/.test(d.dataset.lsec||""))REPLOG[d.dataset.lsec.slice(4)]=d.open},true);
const REP_GAL='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8.5 8.5"/></svg>';
const REP_DBX='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 3.5l5 3.2-5 3.2-5-3.2zM17 3.5l5 3.2-5 3.2-5-3.2zM2 13.1l5-3.2 5 3.2-5 3.2zM12 13.1l5-3.2 5 3.2-5 3.2zM7 17.4l5-3.2 5 3.2-5 3.2z"/></svg>';
const REP_PDF='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 16.5v-4h1.6a1.3 1.3 0 0 1 0 2.6H9.5"/><path d="M14 12.5v4"/></svg>';
const repIco=(attr,ic,t)=>tstIco(attr,ic,t);   /* the round icon buttons of the log and the reports: one routine (17-audit-misc) */
/* the shooting day of a report: «SD01_…» → DT 1, else the date in the name (261020, 2026_10_20, 20.10.2026), else the day it was saved */
function repDay(r){const n=String(r.n||""),shd=(S.days||[]).filter(d=>d.kind==="shoot"&&arr(d.items).some(i=>i.sc)).map(d=>d.date).sort();
  let m=n.match(/(?:^|[^a-z])(?:sd|dt|day|tag)[\s_-]*0*(\d{1,3})(?![0-9])/i);if(m&&shd[+m[1]-1])return {dt:+m[1],date:shd[+m[1]-1]};
  let date="";if((m=n.match(/(20\d\d)[._-]?(\d\d)[._-]?(\d\d)/)))date=m[1]+"-"+m[2]+"-"+m[3];else if((m=n.match(/(?:^|[^0-9])(\d\d)(\d\d)(\d\d)(?![0-9])/))&&+m[2]>=1&&+m[2]<=12)date="20"+m[1]+"-"+m[2]+"-"+m[3];
  else if((m=n.match(/(\d\d)\.(\d\d)\.(20\d\d)/)))date=m[3]+"-"+m[2]+"-"+m[1];if(!date)date=String(r.d||"");const k=shd.indexOf(date);return {dt:k>=0?k+1:0,date}}
const repFmt=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||"")?d.split("-").reverse().join("."):"";
/* every sub folder its own box in «Logs» (only with its permission); below: all reports in the gallery, by shooting day or by department */
/* the name of a folder as a sub topic: Produktion, Sound, DIT – other folders keep their name */
const repTitle=g=>({"production report":"Produktion","production reports":"Produktion","produktion":"Produktion","sound":"Sound","dit":"DIT","cutter report":"Edit","cutter reports":"Edit","cutter":"Edit"})[fold(String(g||"")).trim()]||String(g||"")||L("Allgemein");
const REPORDER=["produktion","sound","dit"];
window.repGroups=()=>[...new Set(repList().map(r=>String(r.g||"")).concat(repFolders()))].filter(g=>canRep(g)).sort((a,b)=>{const ia=REPORDER.indexOf(fold(repTitle(a))),ib=REPORDER.indexOf(fold(repTitle(b)));return (ia<0?9:ia)-(ib<0?9:ib)||a.localeCompare(b)});
/* only: one folder (its box) or "*" (all reports in the gallery); without: everything (Logs) */
window.reportsSec=only=>{const all=repList();if((!all.length&&!repFolders().length)||!canRepAny())return"";
  let groups=repGroups();if(!groups.length)return"";if(only&&only!=="*")groups=groups.filter(g=>g===only);
  const row=(r,i)=>{const dy=repDay(r);return '<li class="repr"><div class="reph"><b>'+esc(r.n)+'</b><span class="repd">'+(dy.dt?'DT '+dy.dt+' · ':'')+esc(repFmt(dy.date))+'</span></div><div class="arb tstbtns repb">'+
    (arr(r.f).length&&typeof window.blkImg==="function"?repIco('data-repg="'+i+'"',REP_GAL,L("Ansehen")):'')+
    (r.u?repIco('data-repu="'+i+'"',REP_DBX,L("In Dropbox öffnen")):'')+
    (r.pdf&&typeof window.blkImg==="function"?repIco('data-reppdf="'+i+'"',REP_PDF,"PDF"):'')+'</div></li>'};
  const boxes=groups.map(g=>{const rs=all.map((r,i)=>[r,i]).filter(([r])=>String(r.g||"")===g).sort((a,b)=>String(repDay(b[0]).date).localeCompare(String(repDay(a[0]).date))||String(a[0].n).localeCompare(String(b[0].n)));
    const k=repSlug(g);
    return '<details class="tstsec repsec" data-lsec="rep-'+esc(k)+'"'+(REPLOG[k]||only?' open':'')+'><summary class="lsum">'+(typeof logHead==="function"?logHead(esc(L("Reports"))+' · '+esc(repTitle(g)),'<span class="tsth">'+rs.length+'</span>',""):esc(g))+'</summary>'+
      '<div class="admins">'+(rs.length?'<ul class="audlist">'+rs.map(([r,i])=>row(r,i)).join("")+'</ul>':'<p class="ghint">'+esc(L("Noch keine Reports in diesem Ordner."))+'</p>')+
      (rs.some(([r])=>arr(r.f).length)&&typeof window.blkImg==="function"?'<div class="arb tstbtns repb repall">'+repIco('data-repall="g|'+esc(k)+'"',REP_GAL,L("Alle in der Galerie"))+'</div>':'')+'</div></details>'}).join("");
  /* all reports at once: the order to choose (shooting day or department) */
  const vis=all.filter(r=>repGroups().includes(String(r.g||""))&&arr(r.f).length);
  const allBox=vis.length>1&&typeof window.blkImg==="function"?'<details class="tstsec repsec" data-lsec="rep-all"'+(REPLOG.all||only==="*"?' open':'')+'><summary class="lsum">'+(typeof logHead==="function"?logHead(esc(L("Alle Reports")),'<span class="tsth">'+vis.length+'</span>',""):esc(L("Alle Reports")))+'</summary>'+
    '<div class="admins"><p class="ahint">'+esc(L("Alle Reports in der Galerie, sortiert:"))+'</p><div class="arb repmodes">'+
    [["day","Nach Drehtag"],["dept","Nach Department"],["new","Neueste zuerst"]].map(([m,t])=>'<button type="button" class="pillbtn" data-repall="'+m+'">'+esc(L(t))+'</button>').join("")+'</div></div></details>':'';
  /* subtopic «Alle»: every report as a list, sorted (Drehtag / Department / Neueste), headings per group, and the gallery in the same order */
  if(only==="*"){const lst=repSort(all.map((r,i)=>[r,i]).filter(([r])=>repGroups().includes(String(r.g||""))),REPALL);
    const hk=([r])=>REPALL==="dept"?repTitle(r.g):REPALL==="day"?(()=>{const dy=repDay(r);return (dy.dt?"DT "+dy.dt+" · ":"")+repFmt(dy.date)})():"";
    let last=null,lis="";for(const x of lst){const h=hk(x);if(h&&h!==last){lis+='<li class="reph2">'+esc(h)+'</li>';last=h}lis+=row(x[0],x[1])}
    return '<details class="tstsec repsec" data-lsec="rep-all" open><summary class="lsum">'+(typeof logHead==="function"?logHead(esc(L("Alle Reports")),'<span class="tsth">'+lst.length+'</span>',""):esc(L("Alle Reports")))+'</summary>'+
      '<div class="admins"><div class="arb repmodes" role="group" aria-label="'+esc(L("Sortieren"))+'">'+[["day","Nach Drehtag"],["dept","Nach Department"],["new","Neueste zuerst"]].map(([m,t])=>'<button type="button" class="pillbtn'+(REPALL===m?' on':'')+'" data-repsort="'+m+'" aria-pressed="'+(REPALL===m)+'">'+esc(L(t))+'</button>').join("")+
      (vis.length&&typeof window.blkImg==="function"?repIco('data-repall="'+REPALL+'"',REP_GAL,L("Alle in der Galerie")):'')+'</div>'+
      (lst.length?'<ul class="audlist">'+lis+'</ul>':'<p class="ghint">'+esc(L("Noch keine Einträge."))+'</p>')+'</div></details>'}
  return only==="*"?allBox:only?boxes:boxes+allBox};
let REPALL="day";try{REPALL=localStorage.getItem("repall")||"day"}catch(_){}
/* order of [report, index] pairs: by shooting day (oldest first), by department, or newest first */
function repSort(l,m){const dk=x=>repDay(x[0]).date||"",gk=x=>String(x[0].g||"").toLowerCase(),nk=x=>String(x[0].n);
  return l.slice().sort(m==="dept"?(a,b)=>gk(a).localeCompare(gk(b))||dk(a).localeCompare(dk(b))||nk(a).localeCompare(nk(b)):m==="new"?(a,b)=>dk(b).localeCompare(dk(a))||gk(a).localeCompare(gk(b))||nk(a).localeCompare(nk(b)):(a,b)=>dk(a).localeCompare(dk(b))||gk(a).localeCompare(gk(b))||nk(a).localeCompare(nk(b)))}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-repsort]");if(!b)return;e.preventDefault();e.stopPropagation();REPALL=b.dataset.repsort;try{localStorage.setItem("repall",REPALL)}catch(_){}render()},true);
/* the gallery with many reports: every page, the caption says shooting day, department and report */
function repGallery(list,title){const media=[];for(const r of list){const dy=repDay(r),cap=[(dy.dt?"DT "+dy.dt:repFmt(dy.date)),r.g,r.n].filter(Boolean).join(" · ");
    arr(r.f).forEach((p,k)=>media.push({n:cap+(r.f.length>1?" · "+(k+1)+"/"+r.f.length:""),t:"img",f:p,u:r.u}))}
  if(media.length&&typeof openGallery==="function")openGallery({name:"rep:"+title,title,sc:[],url:"",media})}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-repall]");if(!b)return;e.preventDefault();e.stopPropagation();
  const m=b.dataset.repall,all=repList().filter(r=>canRep(r.g)&&arr(r.f).length);let list=all.slice(),title=L("Alle Reports");
  const dk=r=>repDay(r).date||"",gk=r=>String(r.g||"").toLowerCase();
  if(m.startsWith("g|")){const k=m.slice(2);list=all.filter(r=>repSlug(r.g)===k).sort((a,b)=>dk(b).localeCompare(dk(a))||String(a.n).localeCompare(String(b.n)));title=L("Reports")+" · "+repTitle((list[0]||{}).g||"")}
  else if(m==="day"){list.sort((a,b)=>dk(a).localeCompare(dk(b))||gk(a).localeCompare(gk(b))||String(a.n).localeCompare(String(b.n)));title+=" · "+L("Nach Drehtag")}
  else if(m==="dept"){list.sort((a,b)=>gk(a).localeCompare(gk(b))||dk(a).localeCompare(dk(b))||String(a.n).localeCompare(String(b.n)));title+=" · "+L("Nach Department")}
  else{list.sort((a,b)=>dk(b).localeCompare(dk(a))||gk(a).localeCompare(gk(b)));title+=" · "+L("Neueste zuerst")}
  repGallery(list,title)},true);
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-repg],[data-repu],[data-reppdf]");if(!t)return;e.preventDefault();e.stopPropagation();
  const id=t.dataset.repg||t.dataset.repu||t.dataset.reppdf,r=repList()[+id];if(!r||!canRep(r.g))return;
  if(t.dataset.repu!=null){window.open(safeUrl(r.u),"_blank","noopener");return}
  if(t.dataset.repg!=null){if(typeof openGallery==="function")openGallery({name:"rep:"+r.n,title:(r.g?repTitle(r.g)+" · ":"")+r.n,sc:[],url:r.u,media:arr(r.f).map((p,k)=>({n:r.n+(r.f.length>1?" · "+(k+1)+"/"+r.f.length:""),t:"img",f:p,u:r.u}))});return}
  /* PDF: decrypted and shown in the app's own PDF viewer (28a-pdfview) – no Dropbox, the same on every device */
  window.blkImg(r.pdf).then(u=>window.pdfView(u,(r.g?repTitle(r.g)+" · ":"")+r.n,r.n+".pdf")).catch(()=>showMsg(L("PDF nicht verfügbar (offline?)."),4000))},true);
try{window.repPermsSync()}catch(_){}

/* ---------- own topic «Reports» (button in the head between the message envelope and «Mein Konto»):
   sub topics Szenen (scene log), Produktion, Sound, DIT (one per report folder), Alle – navigation like «Mein Konto» ---------- */
let REPSUB="";try{REPSUB=localStorage.getItem("repsub")||""}catch(_){}
/* order: Produktion, Szenen, then the other folders (Sound, DIT …), Alle */
const repSubs=()=>{const out=[],gs=repGroups(),isP=g=>fold(repTitle(g))==="produktion";
  for(const g of gs.filter(isP))out.push(["g:"+g,repTitle(g)]);
  if(typeof canSceneLog==="function"&&canSceneLog())out.push(["scenes","Szenen"]);
  for(const g of gs.filter(g=>!isP(g)))out.push(["g:"+g,repTitle(g)]);
  if(repList().filter(r=>repGroups().includes(String(r.g||""))&&arr(r.f).length).length>1)out.push(["all","Alle"]);return out};
window.repOn=()=>!!ME&&repSubs().length>0;
window.repButton=()=>{let b=document.getElementById("repBtn");const a=document.getElementById("acctBtn");if(!a)return;
  if(!b){b=document.createElement("button");b.id="repBtn";b.className="refresh";b.type="button";
    b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 17v-3M12 17v-6M15 17v-4"/></svg>';
    a.parentNode.insertBefore(b,a);b.addEventListener("click",()=>{S.tab="reports";S.srcOpen=false;window.scrollTo(0,0);render()})}
  b.setAttribute("aria-label",L("Reports"));b.title=L("Reports");let on=false;try{on=repOn()}catch(_){}b.hidden=!on;
  if(!on&&S.tab==="reports"){S.tab="today";render()}};
setInterval(()=>{try{repButton()}catch(_){}},5000);
VIEWS.reports=function(){const subs=repSubs();if(!ME||!subs.length)return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(!subs.some(([k])=>k===REPSUB))REPSUB=subs[0][0];
  const nav='<nav class="asub acsub n'+subs.length+'" role="tablist">'+subs.map(([k,t])=>'<button type="button" role="tab" data-repsub="'+esc(k)+'" aria-selected="'+(REPSUB===k)+'">'+(t==="Produktion"?'<span class="lgl">'+esc(L(t))+'</span><span class="sml">Prod</span>':esc(L(t)))+'</button>').join("")+'</nav>';
  let body="";if(REPSUB==="scenes"){SCLOG.open=true;body=typeof sceneLogSec==="function"?sceneLogSec():""}
  else if(REPSUB==="all")body=reportsSec("*");else body=reportsSec(REPSUB.slice(2));
  /* in the topic «Reports» every box is always open: no folding (summary and expand button without function) */
  body=String(body||"").replace(/<details (class=.tstsec)/g,"<details open $1");
  return '<section class="mypage reppage"><div class="myhead"><h2 class="pgt">'+esc(L("Reports"))+'</h2></div>'+nav+(body||'<p class="ghint">'+esc(L("Noch keine Einträge."))+'</p>')+'</section>'};
window.repSetSub=k=>{if(REPSUB===k)return false;REPSUB=k;return true};window.repSubGet=()=>REPSUB;
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-repsub]");if(!b)return;REPSUB=b.dataset.repsub;try{localStorage.setItem("repsub",REPSUB)}catch(_){}render();scrollTo(0,0)});
document.addEventListener("click",e=>{const sm=e.target.closest&&e.target.closest(".reppage details.tstsec>summary");if(!sm)return;
  if(e.target.closest("a,button:not(.tstall),input,select,label"))return;e.preventDefault()},true);
