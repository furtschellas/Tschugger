/* ---------- blocking gallery: photos and video stills of a scene folder in a pop-up ---------- */
/* floorplans: the pages are stored as pictures with the app – they open in the gallery (also offline) */
document.addEventListener("click",e=>{const a=e.target.closest("[data-fpg]");if(!a||typeof window.blkImg!=="function")return;const f=arr(S.meta&&S.meta.floorplans).find(x=>(x.file||x.name)===a.dataset.fpg);if(!f||!arr(f.pg).length)return;
  e.preventDefault();e.stopPropagation();openGallery({name:"fp:"+f.name,title:"Floorplan · "+f.name,sc:[],url:f.url,media:arr(f.pg).map((p,i)=>({n:f.name+(f.pg.length>1?" · "+(i+1)+"/"+f.pg.length:""),t:"img",f:p,u:f.url}))})},true);
document.addEventListener("click",e=>{const a=e.target.closest("[data-blkg]");if(!a||typeof window.blkImg!=="function")return;const b=arr(S.meta&&S.meta.blocking).find(x=>x.name===a.dataset.blkg);if(!b||!bmed(b).length)return;e.preventDefault();e.stopPropagation();openGallery(b)},true);
document.addEventListener("click",e=>{const a=e.target.closest("[data-blkpdf]");if(!a||typeof window.blkImg!=="function")return;const b=arr(S.meta&&S.meta.blocking).find(x=>x.name===a.dataset.blkpdf);if(!b)return;e.preventDefault();e.stopPropagation();openGallery(b,0,a.dataset.pdfn)},true);
function openGallery(b,start,pdf){
  let d=mkDialog("blkgal",null,{replace:true});
  const all=pdf?bmed(b).filter(m=>m.g==="pdf"&&String(m.n).split(" · ")[0]===pdf):bmed(b),title=pdf?L("Auflösung")+" "+pdfLbl(pdf):(b.title||(L("Blocking")+" · "+L("Szene")+" "+arr(b.sc).join(" / ")));
  /* view options: size (small / large / list), filter (all / photos / videos), slideshow; size is remembered */
  let gv="m",gf="all",timer=null;try{gv=localStorage.getItem("galview")||"m"}catch(_){}
  let media=all;const setF=()=>{media=all.filter(m=>gf==="all"||(gf==="vid")===(m.t==="vid"))};
  /* groups: own blocking photos, scene photos from the shot breakdown, pages of the blocking PDFs, pictures of the set (3D / location) */
  const GLBL={"":"Blocking","s":"Auflösung","pdf":"Blocking-PDF","loc":"Motiv & 3D","recce":"Recce"};const multiG=new Set(all.map(m=>m.g||"")).size>1;
  const hasVid=all.some(m=>m.t==="vid"),hasImg=all.some(m=>m.t!=="vid");
  const seg=(attr,cur,opts)=>'<span class="galseg">'+opts.map(([k,t,ic])=>'<button type="button" '+attr+'="'+k+'" aria-pressed="'+(cur===k)+'" title="'+esc(L(t))+'">'+(ic||esc(L(t)))+'</button>').join("")+'</span>';
  const bar=()=>'<div class="galbar">'+seg("data-gv",gv,[["s","Klein",'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="5"/><rect x="10" y="3" width="5" height="5"/><rect x="17" y="3" width="4" height="5"/><rect x="3" y="10" width="5" height="5"/><rect x="10" y="10" width="5" height="5"/><rect x="17" y="10" width="4" height="5"/><rect x="3" y="17" width="5" height="4"/><rect x="10" y="17" width="5" height="4"/></svg>'],["m","Mittel",'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>'],["l","Gross",'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="1"/></svg>'],["list","Liste",'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="6" height="5"/><path d="M12 6h9M12 15h9"/><rect x="3" y="13" width="6" height="5"/></svg>']])+
    (hasVid&&hasImg?seg("data-gfl",gf,[["all","Alle"],["img","Fotos"],["vid","Videos"]]):'')+
    '<button type="button" class="pillbtn galshow" data-gshow>▶ '+esc(L("Diashow"))+'</button></div>';
  const grid=()=>'<div class="a2box galbox"><h3>'+esc(title)+' <small>'+media.length+'</small></h3>'+bar()+(!pdf&&(arr(b.pdfs).length||pdfDocs(b).size)?'<div class="fpls">'+pdfBtns(b).join("")+'</div>':'')+
    '<div class="galgrid g'+gv+'">'+media.map((m,i)=>(multiG&&(i===0||(media[i-1].g||"")!==(m.g||""))?'<div class="galgh">'+esc(L(GLBL[m.g||""]))+' <small>'+media.filter(x=>(x.g||"")===(m.g||"")).length+'</small></div>':'')+'<button type="button" class="galth'+(m.t==="vid"?' vid':'')+'" data-gi="'+i+'" aria-label="'+esc(m.n)+'"><img alt="" data-gf="'+esc(m.f)+'">'+(m.t==="vid"?'<span class="galplay" aria-hidden="true">▶</span>':'')+(gv==="list"?'<span class="galname">'+esc(m.n)+'</span>':'')+'</button>').join("")+'</div>'+
    '<div class="a2b"><a class="pillbtn" href="'+esc(safeUrl(b.url))+'" target="_blank" rel="noopener noreferrer">'+esc(L("Ordner in Dropbox öffnen"))+'</a></div></div>';
  const view=i=>{const m=media[i];return '<div class="a2box galbox galview"><h3>'+esc(title)+' <small>'+(i+1)+' / '+media.length+'</small></h3>'+
    '<div class="galstage"><button type="button" class="galnav prev" data-gnav="'+((i-1+media.length)%media.length)+'" aria-label="'+esc(L("Zurück"))+'">‹</button>'+(m.v?'<video controls playsinline preload="metadata" data-gvid="'+esc(m.v)+'" data-gpost="'+esc(m.f)+'"></video><span class="galload">'+esc(L("Film wird geladen …"))+'</span>':'<img alt="'+esc(m.n)+'" data-gf="'+esc(m.f)+'">')+'<button type="button" class="galnav next" data-gnav="'+((i+1)%media.length)+'" aria-label="'+esc(L("Nächstes Bild"))+'">›</button></div>'+
    '<p class="galcap">'+(m.g?'<span class="galcg">'+esc(L(GLBL[m.g]))+(m.l?' · '+esc(m.l):'')+'</span> ':'')+esc(m.n)+'</p><div class="a2b"><button type="button" class="pillbtn" data-gshow>'+(timer?'❚❚ '+esc(L("Diashow anhalten")):'▶ '+esc(L("Diashow")))+'</button>'+(m.t==="vid"?'<a class="pillbtn" href="'+esc(safeUrl(m.u))+'" target="_blank" rel="noopener noreferrer">'+esc(L(m.v?"Original in Dropbox":"Video in Dropbox abspielen"))+'</a>':'<a class="pillbtn" href="'+esc(safeUrl(m.u))+'" target="_blank" rel="noopener noreferrer">'+esc(L("Original in Dropbox"))+'</a>')+'<button type="button" class="lnk" data-gback>'+esc(L("Alle Bilder"))+'</button></div></div>'};
  const fill=()=>{d.querySelectorAll("img[data-gf]").forEach(img=>{window.blkImg(img.dataset.gf).then(u=>{img.src=u}).catch(()=>{img.closest("button,div").classList.add("galerr")})});
    d.querySelectorAll("video[data-gvid]").forEach(v=>{window.blkImg(v.dataset.gpost).then(u=>{if(!v.src)v.poster=u}).catch(()=>{});
      window.blkImg(v.dataset.gvid).then(u=>{v.src=u;const l=v.parentNode.querySelector(".galload");if(l)l.remove()}).catch(()=>{const l=v.parentNode.querySelector(".galload");if(l)l.textContent=L("Film konnte nicht geladen werden.")})})};
  const show=i=>{if(i===undefined&&timer){clearInterval(timer);timer=null}d.innerHTML=i===undefined?grid():view(i);d.dataset.i=i===undefined?"":String(i);fill()};
  const stopShow=()=>{if(timer){clearInterval(timer);timer=null}};
  new MutationObserver(()=>{if(!document.body.contains(d))stopShow()}).observe(document.body,{childList:true});
  d.addEventListener("click",e=>{if(e.target===d){stopShow();d.remove();return}
    const v=e.target.closest("[data-gv]");if(v){gv=v.dataset.gv;try{localStorage.setItem("galview",gv)}catch(_){}show();return}
    const fl=e.target.closest("[data-gfl]");if(fl){gf=fl.dataset.gfl;setF();show();return}
    if(e.target.closest("[data-gshow]")){if(timer){stopShow();show(+d.dataset.i||0);return}const st=d.dataset.i===""?0:+d.dataset.i;timer=setInterval(()=>{const pv=d.querySelector("video");if(pv&&!pv.paused&&!pv.ended)return;const i=((+d.dataset.i||0)+1)%media.length;d.innerHTML=view(i);d.dataset.i=String(i);fill()},3500);show(st);return}const t=e.target.closest("[data-gi]");if(t){show(+t.dataset.gi);return}const n=e.target.closest("[data-gnav]");if(n){show(+n.dataset.gnav);return}if(e.target.closest("[data-gback]"))show()});
  d.addEventListener("keydown",e=>{if(d.dataset.i==="")return;const i=+d.dataset.i;if(e.key==="ArrowRight")show((i+1)%media.length);if(e.key==="ArrowLeft")show((i-1+media.length)%media.length)});
  let tx=null;d.addEventListener("touchstart",e=>{tx=e.touches[0].clientX},{passive:true});d.addEventListener("touchend",e=>{if(tx===null||d.dataset.i==="")return;const dx=e.changedTouches[0].clientX-tx;tx=null;if(Math.abs(dx)<50)return;const i=+d.dataset.i;show(dx<0?(i+1)%media.length:(i-1+media.length)%media.length)});
  document.body.appendChild(d);show(start);d.tabIndex=-1;d.focus();
}
/* blocking of a script scene that is not (yet) in the schedule */
/* the scene in the shooting schedule (for the floorplan of its location) */
function scItem(sc){const k=String(sc||"").toLowerCase().replace(/\s+/g,"");if(!k)return null;for(const d of S.days||[])for(const it of arr(d.items).concat(arr((d.unit2||{}).items),arr((d.unit3||{}).items)))if(String(it.sc||"").toLowerCase().replace(/\s+/g,"")===k)return it;return null}
function blkRow(sc){const it=scItem(sc);const h=fpLinks(it?fpFor(it.set,(it.loc||"")+" "+(it.loc?addrForItem(it):"")):[],blkFor(sc));return h?'<div class="spblk">'+h+'</div>':''}
function spPage(x,ctx,list,reqSc){const f=sceneFacts(reqSc||x.sc,x,list);return '<div class="sp-scene">'+(f||blkRow(x.sc))+'<article lang="de" class="sp-page'+(ctx?' sp-ctx':'')+'">'+(ctx?'<p class="sp-ctxl">'+esc(L(ctx))+'</p>':'')+'<h3 class="sp-head"><span class="spn">'+esc(x.sc)+'</span><span class="sps">'+esc(spHead(x))+'</span><span class="spr">'+spTod(x)+'</span></h3>'+scriptHTML(x.text)+'</article></div>'}
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
async function openScene(sc){
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
  ["[data-lang]",b=>{LANG=b.dataset.lang;store("lang",LANG);applyStatic();render();if(!$("#search").hidden)renderSearch()}],
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
  ["[data-pu]",b=>{const k=b.dataset.pu;S.pu=Object.assign({},S.pu,{[k]:!S.pu[k]});store("pu",JSON.stringify(S.pu));render()}],
  ["[data-scene]",b=>openScene(b.dataset.scene)],
  ["[data-spmore]",b=>spLoadMore(b)],
  ["[data-sqm]",b=>{S.sqm=b.dataset.sqm;S.sqn=0;try{localStorage.setItem("sqm",S.sqm)}catch(_){}document.querySelectorAll("[data-sqm]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));runSearch("sq",false)}],
  ["[data-sqpick]",b=>{S.sq=b.dataset.sqpick;S.sqn=0;const i=document.getElementById("sq");if(i)i.value=S.sq;runSearch("sq",false)}],
  ["[data-sqmore]",()=>{S.sqn=(S.sqn||(S.sq?100:40))+60;runSearch("sq",false)}],
  ["[data-scretry]",()=>{SCRIPTERR=false;render()}],
  ["[data-spt]",()=>{const nx=spTheme()==="light"?"dark":"light";SPT=nx===getTheme()?null:nx;store("spt",SPT||"");svApply()}],
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
function mcPick(v){try{if(v)localStorage.setItem("myname",v);else localStorage.removeItem("myname")}catch(_){}render()}
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

