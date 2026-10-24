import {$,L,LANG,MEMO,S,SPT,applyStatic,esc,getTheme,lvClasses,mkDialog,pvApply,safeUrl,setLANG,setSPT,setTheme,spTheme,svApply,svButtons,svClasses,todayISO} from "./10-core.js";
import {nextUnitDay,onlyU,ppContact,ppMail} from "./11-schedule-prep.js";
import {MCNAMES,addToCalendar,myClick} from "./12-mycal.js";
import {addrForItem,groupLocs,locResults,saveVCard,sceneTexts,ufOn} from "./13-crew-views.js";
import {vok} from "./14-render.js";
import {fitRows,fold,render,scriptResults,setSCRIPTERR} from "./15-script-tab.js";
import {goTab,scallLabel,setOpen,store} from "./16-interaction.js";
import {BLKREG,blkFor,bmed,findScene,fpFor,fpLinks,pdfBtns,pdfDocs,pdfLbl,sceneFacts,sceneSheet,scriptData,scriptHTML,spTitle,spTod} from "./17-scene-reader.js";
import {renderSearch} from "./19-search.js";
import {arr} from "./20-data-start.js";
/* ---------- blocking gallery: photos and video stills of a scene folder in a pop-up ---------- */
/* floorplans: the pages are stored as pictures with the app – they open in the gallery (also offline) */
document.addEventListener("click",e=>{const a=e.target.closest("[data-fpg]");if(!a||typeof window.blkImg!=="function")return;const f=arr(S.meta&&S.meta.floorplans).find(x=>(x.file||x.name)===a.dataset.fpg);if(!f||!arr(f.pg).length)return;
  e.preventDefault();e.stopPropagation();openGallery({name:"fp:"+f.name,title:"Floorplan · "+f.name,sc:[],url:f.url,media:arr(f.pg).map((p,i)=>({n:f.name+(f.pg.length>1?" · "+(i+1)+"/"+f.pg.length:""),t:"img",f:p,u:f.url}))})},true);
document.addEventListener("click",e=>{const a=e.target.closest("[data-blkg]");if(!a||typeof window.blkImg!=="function")return;const b=BLKREG.get(a.dataset.blkg)||arr(S.meta&&S.meta.blocking).find(x=>x.name===a.dataset.blkg);if(!b||!bmed(b).length)return;e.preventDefault();e.stopPropagation();openGallery(b)},true);
document.addEventListener("click",e=>{const a=e.target.closest("[data-blkpdf]");if(!a||typeof window.blkImg!=="function")return;const b=arr(S.meta&&S.meta.blocking).find(x=>x.name===a.dataset.blkpdf);if(!b)return;e.preventDefault();e.stopPropagation();openGallery(b,0,a.dataset.pdfn)},true);
document.addEventListener("click",e=>{const a=e.target.closest("[data-schedpdf]");if(!a||typeof window.blkImg!=="function")return;const sp=S.meta&&S.meta.schedPdf;if(!sp)return;e.preventDefault();
  /* the real PDF, opened at the page of this shooting day */
  if(sp.pdf){const pgn=(+a.dataset.schedpdf||0)+1,w=window.open("","_blank");
    window.blkImg(sp.pdf).then(u=>{const url=u+"#page="+pgn;if(w&&!w.closed)w.location.href=url;else location.href=url}).catch(()=>{const su=safeUrl(sp.url);if(w&&!w.closed)w.location.href=su;else window.open(su,"_blank","noopener")});return}
  openGallery({name:"sched",title:L("Drehplan")+" · "+String(sp.name||"").replace(/\.pdf$/i,""),sc:[],url:sp.url,media:arr(sp.pg).map((p,i)=>({n:L("Seite")+" "+(i+1)+"/"+sp.pg.length,t:"img",f:p,u:sp.url}))},+a.dataset.schedpdf||0)});
/* several Dropbox folders for one scene: one button, then the choice */
document.addEventListener("click",e=>{const a=e.target.closest("[data-folders]");if(!a)return;e.preventDefault();let l=[];try{l=JSON.parse(a.dataset.folders)}catch(_){return}
  const o=mkDialog("fldpick",'<div class="a2box"><h3>'+esc(L("Welchen Ordner öffnen?"))+'</h3><div class="fldl">'+l.map(f=>'<a class="pillbtn" href="'+esc(safeUrl(f.u))+'" target="_blank" rel="noopener noreferrer">'+esc(f.n)+'</a>').join("")+'</div></div>',{replace:true});
  o.addEventListener("click",ev=>{if(ev.target===o||ev.target.closest(".fldl a"))setTimeout(()=>o.remove(),0)});document.body.appendChild(o)});
/* several picture folders for one scene: one camera button, then the choice (folder path and number of pictures) */
document.addEventListener("click",e=>{const a=e.target.closest("[data-blkgs]");if(!a||typeof window.blkImg!=="function")return;e.preventDefault();e.stopPropagation();let l=[];try{l=JSON.parse(a.dataset.blkgs)}catch(_){return}
  const o=mkDialog("fldpick",'<div class="a2box"><h3>'+esc(L("Welche Bilder anzeigen?"))+'</h3><div class="fldl">'+l.map((f,i)=>'<button type="button" class="pillbtn fldg" data-gi="'+i+'"><b>'+esc(f.p||f.n)+'</b> · '+f.c+' '+esc(L("Bilder"))+'</button>').join("")+'</div></div>',{replace:true});
  o.addEventListener("click",ev=>{const g=ev.target.closest("[data-gi]");if(g){const f=l[+g.dataset.gi],b=f&&BLKREG.get(f.k);setTimeout(()=>o.remove(),0);if(b)openGallery(b);return}if(ev.target===o)setTimeout(()=>o.remove(),0)});document.body.appendChild(o)},true);
export function openGallery(b,start,pdf){
  let d=mkDialog("blkgal",null,{replace:true});if(pdf)d.classList.add("galpdf");   /* PDF pages: the whole screen, narrow margins */
  const all=pdf?bmed(b).filter(m=>m.g==="pdf"&&String(m.n).split(" · ")[0]===pdf):bmed(b),title=pdf?L("Auflösung")+" "+pdfLbl(pdf):(b.title||(L("Blocking")+" · "+L("Szene")+" "+arr(b.sc).join(" / ")));
  /* view options: size (small / large / list), filter (all / photos / videos); size is remembered */
  let gv="m",gf="all";try{gv=localStorage.getItem("galview")||"m"}catch(_){}
  let media=all;const setF=()=>{media=all.filter(m=>gf==="all"||(gf==="vid")===(m.t==="vid"))};
  /* groups: own blocking photos, scene photos from the shot breakdown, pages of the blocking PDFs, pictures of the set (3D / location) */
  const GLBL={"":"Blocking","s":"Auflösung","pdf":"Blocking-PDF","loc":"Motiv & 3D","recce":"Recce"};const multiG=new Set(all.map(m=>m.g||"")).size>1;
  const hasVid=all.some(m=>m.t==="vid"),hasImg=all.some(m=>m.t!=="vid");
  const seg=(attr,cur,opts)=>'<span class="galseg">'+opts.map(([k,t,ic])=>'<button type="button" '+attr+'="'+k+'" aria-pressed="'+(cur===k)+'" title="'+esc(L(t))+'">'+(ic||esc(L(t)))+'</button>').join("")+'</span>';
  const bar=()=>'<div class="galbar">'+seg("data-gv",gv,[["s","Klein",'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="5"/><rect x="10" y="3" width="5" height="5"/><rect x="17" y="3" width="4" height="5"/><rect x="3" y="10" width="5" height="5"/><rect x="10" y="10" width="5" height="5"/><rect x="17" y="10" width="4" height="5"/><rect x="3" y="17" width="5" height="4"/><rect x="10" y="17" width="5" height="4"/></svg>'],["m","Mittel",'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>'],["l","Gross",'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="1"/></svg>'],["list","Liste",'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="6" height="5"/><path d="M12 6h9M12 15h9"/><rect x="3" y="13" width="6" height="5"/></svg>']])+
    (hasVid&&hasImg?seg("data-gfl",gf,[["all","Alle"],["img","Fotos"],["vid","Videos"]]):'')+'</div>';
  const grid=()=>'<div class="a2box galbox"><h3>'+esc(title)+' <small>'+media.length+'</small></h3>'+bar()+(!pdf&&(arr(b.pdfs).length||pdfDocs(b).size)?'<div class="fpls">'+pdfBtns(b).join("")+'</div>':'')+
    '<div class="galgrid g'+gv+'">'+media.map((m,i)=>(multiG&&(i===0||(media[i-1].g||"")!==(m.g||""))?'<div class="galgh">'+esc(L(GLBL[m.g||""]))+' <small>'+media.filter(x=>(x.g||"")===(m.g||"")).length+'</small></div>':'')+'<button type="button" class="galth'+(m.t==="vid"?' vid':'')+'" data-gi="'+i+'" aria-label="'+esc(m.n)+'"><img alt="" data-gf="'+esc(m.f)+'">'+(m.t==="vid"?'<span class="galplay" aria-hidden="true">▶</span>':'')+(gv==="list"?'<span class="galname">'+esc(m.n)+'</span>':'')+'</button>').join("")+'</div>'+
    '<div class="a2b"><a class="pillbtn" href="'+esc(safeUrl(b.url))+'" target="_blank" rel="noopener noreferrer">'+esc(L("Ordner in Dropbox öffnen"))+'</a></div></div>';
  const view=i=>{const m=media[i];return '<div class="a2box galbox galview"><h3>'+esc(title)+' <small>'+(i+1)+' / '+media.length+'</small></h3>'+
    '<div class="galstage"><button type="button" class="galnav prev" data-gnav="'+((i-1+media.length)%media.length)+'" aria-label="'+esc(L("Zurück"))+'">‹</button>'+(m.v?'<video controls playsinline preload="metadata" data-gvid="'+esc(m.v)+'" data-gpost="'+esc(m.f)+'"></video><span class="galload">'+esc(L("Film wird geladen …"))+'</span>':'<img alt="'+esc(m.n)+'" data-gf="'+esc(m.f)+'">')+'<button type="button" class="galnav next" data-gnav="'+((i+1)%media.length)+'" aria-label="'+esc(L("Nächstes Bild"))+'">›</button></div>'+
    '<p class="galcap">'+(m.g?'<span class="galcg">'+esc(L(GLBL[m.g]))+(m.l?' · '+esc(m.l):'')+'</span> ':'')+esc(m.n)+'</p><div class="a2b">'+(m.t==="vid"?'<a class="pillbtn" href="'+esc(safeUrl(m.u))+'" target="_blank" rel="noopener noreferrer">'+esc(L(m.v?"Original in Dropbox":"Video in Dropbox abspielen"))+'</a>':'<a class="pillbtn" href="'+esc(safeUrl(m.u))+'" target="_blank" rel="noopener noreferrer">'+esc(L("Original in Dropbox"))+'</a>')+'<button type="button" class="lnk" data-gback>'+esc(L("Alle Bilder"))+'</button></div></div>'};
  const fill=()=>{d.querySelectorAll("img[data-gf]").forEach(img=>{window.blkImg(img.dataset.gf).then(u=>{img.src=u}).catch(()=>{img.closest("button,div").classList.add("galerr")})});
    d.querySelectorAll("video[data-gvid]").forEach(v=>{window.blkImg(v.dataset.gpost).then(u=>{if(!v.src)v.poster=u}).catch(()=>{});
      window.blkImg(v.dataset.gvid).then(u=>{v.src=u;const l=v.parentNode.querySelector(".galload");if(l)l.remove()}).catch(()=>{const l=v.parentNode.querySelector(".galload");if(l)l.textContent=L("Film konnte nicht geladen werden.")})})};
  const show=i=>{if(i!==undefined&&!(i>=0&&i<media.length))i=undefined;   /* no such picture (empty list, page past the end): the overview instead of an empty window */
    d.innerHTML=i===undefined?grid():view(i);d.dataset.i=i===undefined?"":String(i);fill()};
  d.addEventListener("click",e=>{if(e.target===d){d.remove();return}
    const v=e.target.closest("[data-gv]");if(v){gv=v.dataset.gv;try{localStorage.setItem("galview",gv)}catch(_){}show();return}
    const fl=e.target.closest("[data-gfl]");if(fl){gf=fl.dataset.gfl;setF();show();return}
    const t=e.target.closest("[data-gi]");if(t){show(+t.dataset.gi);return}const n=e.target.closest("[data-gnav]");if(n){show(+n.dataset.gnav);return}if(e.target.closest("[data-gback]"))show()});
  d.addEventListener("keydown",e=>{if(d.dataset.i==="")return;const i=+d.dataset.i;if(e.key==="ArrowRight")show((i+1)%media.length);if(e.key==="ArrowLeft")show((i-1+media.length)%media.length)});
  /* zoom inside the picture (iPhone, Android): two fingers zoom, one finger moves the zoomed picture, double tap zooms in / back.
     Swipe = next / previous picture – only at normal size. The page itself is never zoomed (fixed pop-ups get stuck on the iPhone). */
  const Z={s:1,x:0,y:0,p0:null,s0:1,c0:null,last:null,tap:0,moved:false,maxT:0,t0:0,y0:0};
  const zimg=()=>d.querySelector(".galstage img");
  const zset=()=>{const im=zimg();if(!im)return;if(Z.s<=1.02){Z.s=1;Z.x=0;Z.y=0}
    const r=im.getBoundingClientRect(),w=r.width/((im._zs)||1),h=r.height/((im._zs)||1),mx=Math.max(0,(w*Z.s-w)/2),my=Math.max(0,(h*Z.s-h)/2);
    Z.x=Math.min(mx,Math.max(-mx,Z.x));Z.y=Math.min(my,Math.max(-my,Z.y));im._zs=Z.s;im.style.transform=Z.s===1?"":"translate("+Z.x+"px,"+Z.y+"px) scale("+Z.s+")";d.classList.toggle("zoomed",Z.s>1)};
  const zreset=()=>{Z.s=1;Z.x=0;Z.y=0;const im=zimg();if(im){im._zs=1;im.style.transform=""}d.classList.remove("zoomed")};
  const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  let tx=null;
  d.addEventListener("touchstart",e=>{if(d.dataset.i==="")return;
    /* a gesture starts with the first finger; every further finger marks it as zoom – never a swipe */
    if(e.touches.length===1){Z.maxT=1;Z.t0=Date.now();Z.y0=e.touches[0].clientY}else Z.maxT=Math.max(Z.maxT,e.touches.length);
    if(!e.target.closest(".galstage"))return;Z.moved=false;
    if(e.touches.length===2){Z.p0=dist(e.touches);Z.s0=Z.s;tx=null;e.preventDefault();return}
    Z.last={x:e.touches[0].clientX,y:e.touches[0].clientY};tx=Z.s===1?e.touches[0].clientX:null},{passive:false});
  d.addEventListener("touchmove",e=>{if(d.dataset.i===""||!e.target.closest(".galstage"))return;
    if(e.touches.length===2&&Z.p0){e.preventDefault();Z.moved=true;Z.s=Math.min(5,Math.max(1,Z.s0*dist(e.touches)/Z.p0));zset();return}
    if(e.touches.length===1&&Z.s>1&&Z.last){e.preventDefault();Z.moved=true;const t=e.touches[0];Z.x+=t.clientX-Z.last.x;Z.y+=t.clientY-Z.last.y;Z.last={x:t.clientX,y:t.clientY};zset()}},{passive:false});
  d.addEventListener("touchend",e=>{if(d.dataset.i==="")return;if(e.touches.length<2)Z.p0=null;if(e.touches.length)return;
    const t=e.changedTouches[0];
    if(!Z.moved&&e.target.closest(".galstage img")){const now=Date.now();if(now-Z.tap<300){Z.tap=0;e.preventDefault();if(Z.s>1)zreset();else{Z.s=2.5;zset()}return}Z.tap=now}
    /* swipe only: one finger the whole time, normal size, page not zoomed, clearly sideways and quick */
    const pz=!!(window.visualViewport&&visualViewport.scale>1.05);
    if(tx===null||Z.s>1||Z.maxT!==1||pz)return;const dx=t.clientX-tx,dy=t.clientY-Z.y0;tx=null;if(Math.abs(dx)<60||Math.abs(dx)<2*Math.abs(dy)||Date.now()-Z.t0>700)return;const i=+d.dataset.i;show(dx<0?(i+1)%media.length:(i-1+media.length)%media.length)});
  /* a new picture always starts at normal size */
  new MutationObserver(()=>{if(!zimg()||zimg()._zs===undefined)zreset()}).observe(d,{childList:true});
  document.body.appendChild(d);show(start);d.tabIndex=-1;d.focus();
}
/* blocking of a script scene that is not (yet) in the schedule */
/* the scene in the shooting schedule (for the floorplan of its location) */
function scItem(sc){const k=String(sc||"").toLowerCase().replace(/\s+/g,"");if(!k)return null;for(const d of S.days||[])for(const it of arr(d.items).concat(arr((d.unit2||{}).items),arr((d.unit3||{}).items)))if(String(it.sc||"").toLowerCase().replace(/\s+/g,"")===k)return it;return null}
export function blkRow(sc){const it=scItem(sc);const h=fpLinks(it?fpFor(it.set,(it.loc||"")+" "+(it.loc?addrForItem(it):"")):[],blkFor(sc));return h?'<div class="spblk">'+h+'</div>':''}
function spPage(x,ctx,list,reqSc){const f=sceneFacts(reqSc||x.sc,x,list);return '<div class="sp-scene">'+(f||blkRow(x.sc))+'<article lang="de" class="sp-page'+(ctx?' sp-ctx':'')+'">'+(ctx?'<p class="sp-ctxl">'+esc(L(ctx))+'</p>':'')+'<h3 class="sp-head"><span class="spn">'+esc(x.sc)+'</span><span class="sps">'+spTitle(x)+'</span><span class="spr">'+spTod(x)+'</span></h3>'+scriptHTML(x.text)+'</article></div>'}
function spMore(dir,list,j){
  const y=list[j];if(!y)return'';
  return '<button type="button" class="sp-more" data-spmore="'+dir+'" data-spi="'+j+'">'+(dir==="prev"?'▲ ':'')+esc(L(dir==="prev"?"Vorherige Szene lesen":"Folgende Szene lesen"))+' · '+esc(y.sc)+(dir==="next"?' ▼':'')+'</button>';
}
async function spLoadMore(b){
  if(b.disabled)return;b.disabled=true;
  let list;try{list=await scriptData()}catch(err){console.error(err);b.disabled=false;return}
  const j=+b.dataset.spi,y=list[j],dir=b.dataset.spmore;
  const box=b.isConnected&&b.closest(".scnscroll"),pages=box&&box.querySelector(".sp-pages");if(!y||!pages)return;
  const t=document.createElement("div");t.innerHTML=spPage(y,dir==="prev"?"Vorherige Szene":"Folgende Szene",list);const art=t.firstChild;
  if(dir==="prev"){const h0=box.scrollHeight,top=box.scrollTop;pages.insertBefore(art,pages.firstChild);box.scrollTop=top+(box.scrollHeight-h0)-80}
  else pages.appendChild(art);
  t.innerHTML=spMore(dir,list,dir==="prev"?j-1:j+1);
  if(t.firstChild)b.replaceWith(t.firstChild);else b.remove();
}
let SCN_SEQ=0;
export async function openScene(sc){
  if(window.SCRIPTON===false||!vok("script"))return;
  const seq=++SCN_SEQ,s=sceneSheet();document.body.style.overflow="hidden";s.hidden=false;
  const shell=(b,nav)=>'<div class="scnbox"><div class="scnhd"><b>'+esc(L("Drehbuch"))+'</b>'+(nav||'')+'<button class="scnx" data-scnclose aria-label="'+esc(L("Schliessen"))+'">×</button>'+svButtons()+'</div>'+b+'</div>';
  s.className="scrn "+svClasses();
  s.innerHTML=shell('<p class="scnmsg">'+esc(L("Lade"))+' …</p>');
  try{
    const list=await scriptData();const x=findScene(list,sc);
    if(s.hidden||seq!==SCN_SEQ)return;
    if(x)store("lastsc",x.sc);
    if(!x){s.innerHTML=shell('<p class="scnmsg">'+esc(L("Diese Szene ist im Drehbuch nicht gefunden worden."))+'</p>');return}
    const i=list.indexOf(x),pv=list[i-1],nx=list[i+1];
    const nav='<span class="scnnav">'+'<button class="pvbtn scnp" '+(pv?'data-scene="'+esc(pv.sc)+'" aria-label="'+esc(L("Vorherige Szene"))+' '+esc(pv.sc)+'" title="'+esc(L("Vorherige Szene"))+' '+esc(pv.sc)+'"':'disabled aria-hidden="true"')+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14.5l6-6 6 6"/></svg></button>'+
      '<button class="pvbtn scnp" '+(nx?'data-scene="'+esc(nx.sc)+'" aria-label="'+esc(L("Folgende Szene"))+' '+esc(nx.sc)+'" title="'+esc(L("Folgende Szene"))+' '+esc(nx.sc)+'"':'disabled aria-hidden="true"')+'><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></svg></button></span>';
    s.innerHTML=shell('<div class="scnscroll">'+spMore("prev",list,i-1)+'<div class="sp-pages">'+spPage(x,"",list,sc)+'</div>'+spMore("next",list,i+1)+'</div>',nav);
    s.querySelector(".scnscroll").scrollTop=0;try{fitRows(s)}catch(_){}
  }catch(err){console.error(err);if(seq===SCN_SEQ&&!s.hidden)s.innerHTML=shell('<p class="scnmsg">'+esc(L("Drehbuch konnte nicht geladen werden."))+'</p>')}
}
const ACTIONS=[
  ["[data-thm]",()=>setTheme(getTheme()==="light"?"dark":"light")],
  ["[data-lang]",b=>{setLANG(b.dataset.lang);store("lang",LANG);applyStatic();render();if(!$("#search").hidden)renderSearch()}],
  ["[data-sckey]",b=>{setOpen(b,!S.openSc[b.dataset.sckey]);scallLabel()}],
  ["[data-scall]",()=>{const bs=[...document.querySelectorAll("[data-sckey]")];const open=!bs.every(x=>S.openSc[x.dataset.sckey]);bs.forEach(x=>setOpen(x,open));scallLabel()}],
  ["[data-uf]",b=>{S.uf=Object.assign({},S.uf,{[b.dataset.uf]:!S.uf[b.dataset.uf]});store("uf",JSON.stringify(S.uf));render()}],
  ["[data-vc]",b=>{const [gi,pi]=b.dataset.vc.split(":").map(Number);const g=S.crew[gi],p=g&&g.people&&g.people[pi];if(p)saveVCard(p,g)}],
  ["[data-copy]",b=>{const txt=b.dataset.copy;const ok=()=>{b.textContent=L("Kopiert");setTimeout(()=>b.textContent=L("Kopieren"),1500)};try{navigator.clipboard.writeText(txt).then(ok,()=>{b.textContent=txt})}catch(_){b.textContent=txt}}],
  ["[data-tab]",b=>{goTab(b.dataset.tab);render()}],
  ["[data-todispo]",b=>{S.dday=b.dataset.todispo;S.tab="dispo";window.scrollTo(0,0);render()}],
  ["[data-dday]",b=>{S.dday=b.dataset.dday;render()}],
  ["[data-day]",b=>{S.day=b.dataset.day;render()}],
  ["[data-cal]",b=>addToCalendar(b.dataset.cal)],
  ["[data-ppmail]",b=>ppMail(b.dataset.ppmail)],
  ["[data-ppc]",b=>ppContact(b.dataset.ppc)],
  ["[data-ppo]",b=>{S.ppo=!S.ppo;store("ppo",S.ppo?"1":"0");b.setAttribute("aria-pressed",String(S.ppo));document.querySelectorAll(".ppparts").forEach(d=>d.open=S.ppo)}],
  ["[data-rbtog]",b=>{let on=true;try{on=localStorage.getItem("rbadges")!=="0"}catch(_){}try{localStorage.setItem("rbadges",on?"0":"1")}catch(_){}render()}],
  ["[data-pu]",b=>{const k=b.dataset.pu;S.pu=Object.assign({},S.pu,{[k]:!S.pu[k]});store("pu",JSON.stringify(S.pu));
    /* only 2nd unit → the next 2nd unit day; 1st unit switched on → the next 1st unit day */
    if(onlyU()||(k==="1"&&S.pu["1"])){const nd=nextUnitDay();if(nd){S.day=nd.id;S.dday=nd.date}}render()}],
  ["[data-scene]",b=>openScene(b.dataset.scene)],
  ["[data-spmore]",b=>spLoadMore(b)],
  ["[data-sqm]",b=>{S.sqm=b.dataset.sqm;S.sqn=0;try{localStorage.setItem("sqm",S.sqm)}catch(_){}document.querySelectorAll("[data-sqm]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));runSearch("sq",false)}],
  ["[data-sqpick]",b=>{S.sq=b.dataset.sqpick;S.sqn=0;const i=document.getElementById("sq");if(i)i.value=S.sq;runSearch("sq",false)}],
  ["[data-sqmore]",()=>{S.sqn=(S.sqn||(S.sq?100:40))+60;runSearch("sq",false)}],
  ["[data-scretry]",()=>{setSCRIPTERR(false);render()}],
  ["[data-spt]",()=>{const nx=spTheme()==="light"?"dark":"light";setSPT(nx===getTheme()?null:nx);store("spt",SPT||"");svApply()}],
  ["[data-lv]",b=>{const k=b.dataset.lv;S.lv=Object.assign({},S.lv,{[k]:!S.lv[k]});store("lv",JSON.stringify(S.lv));document.querySelectorAll(".lvwrap").forEach(w=>w.className="lvwrap "+lvClasses());document.querySelectorAll("[data-lv]").forEach(x=>x.setAttribute("aria-pressed",String(S.lv[x.dataset.lv])))}],
  ["[data-sv]",b=>{const k=b.dataset.sv;S.sv=Object.assign({},S.sv,{[k]:!S.sv[k]});store("sv",JSON.stringify(S.sv));svApply()}],
  ["[data-pv]",b=>{const k=b.dataset.pv;S.pv=Object.assign({},S.pv,{[k]:!S.pv[k]});store("pv",JSON.stringify(S.pv));pvApply()}],
  ["[data-goto]",b=>{S.day=b.dataset.goto;S.tab="plan";S.pu={"1":true,"2":true,"3":true};window.scrollTo(0,0);render()}],
];
document.addEventListener("click",e=>{
  if(e.target.closest("#search"))return; /* search overlay has its own handler */
  if(e.target.closest(".mypage")&&myClick(e))return;
  for(const [sel,fn] of ACTIONS){const b=e.target.closest(sel);if(b){if(b.disabled)return;try{const r=fn(b);if(r&&typeof r.catch==="function")r.catch(err=>console.error(err))}catch(err){console.error(err)}return}}
});
/* admins: type a name in «Termine für» (suggestions appear while typing); «Ich» goes back to the own name */
/* the person chosen in «Termine für» (admins): only until the app is reloaded – after a reload it is me again */
window.MYPICK="";try{localStorage.removeItem("myname")}catch(_){}
function mcPick(v){window.MYPICK=v||"";try{MEMO.clear()}catch(_){}render()}
document.addEventListener("input",e=>{if(e.target.matches&&e.target.matches("input[data-mcme]")){const v=e.target.value.trim();const hit=MCNAMES.find(n=>n.toLowerCase()===v.toLowerCase());if(hit)mcPick(hit)}});
document.addEventListener("change",e=>{if(e.target.matches&&e.target.matches("input[data-mcme]")){const v=e.target.value.trim();if(!v){mcPick("");return}const f=fold(v),hits=MCNAMES.filter(n=>fold(n).includes(f));if(hits.length===1)mcPick(hits[0])}});
document.addEventListener("click",e=>{if(e.target.closest("[data-mcself]"))mcPick("")});
/* fields someone changed are marked, so a re-render keeps them */
document.addEventListener("input",e=>{if(e.target.closest&&e.target.closest("#view form"))e.target.dataset.dirty="1"},true);
document.addEventListener("change",e=>{if(e.target.closest&&e.target.closest("#view form"))e.target.dataset.dirty="1"},true);
document.addEventListener("input",e=>{if(e.target.id==="q"){S.q=e.target.value;render()}
  else if(e.target.id==="lq"||e.target.id==="sq"){if(e.target.id==="sq"){S.sq=e.target.value;S.sqn=0}else S.lq=e.target.value;clearTimeout(SRCHT);SRCHT=setTimeout(()=>runSearch(e.target.id,false),180)}});
let SRCHT=null;
/* refresh only the result list: the field keeps focus and the keyboard stays open while typing */
function runSearch(id,submit){
  clearTimeout(SRCHT);
  const box=document.getElementById(id==="sq"?"scres":"lqres");
  if(!box){render();return}
  try{
    if(id==="sq")box.innerHTML=scriptResults();
    else{const gs=groupLocs().filter(g=>{if(!ufOn())return true;if(g.s5)return g.parts.some(p=>S.uf[p.u]);return sceneTexts(g.items.flatMap(l=>(l.sets||[]).flatMap(x=>x.scenes||[]))).length>0});box.innerHTML=locResults(gs)}
  }catch(err){console.error(err);render();return}
  if(submit){const i=document.getElementById(id);if(i)i.blur();const r=box.getBoundingClientRect();if(r.top<0||r.top>innerHeight*0.6)window.scrollTo({top:window.scrollY+r.top-90,behavior:"smooth"})}
}
document.addEventListener("submit",e=>{const f=e.target.closest&&e.target.closest("[data-sform]");if(!f)return;e.preventDefault();const id=f.dataset.sform,i=document.getElementById(id);
  if(i){if(id==="sq"){S.sq=i.value;S.sqn=0}else S.lq=i.value}runSearch(id,true)});
let LASTDAY=todayISO();
document.addEventListener("toggle",e=>{if(e.target&&e.target.matches&&e.target.matches("[data-srcd]"))S.srcOpen=e.target.open},true);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&todayISO()!==LASTDAY){LASTDAY=todayISO();S.day=null;S.dday=null;render()}});

