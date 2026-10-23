/* ---------- PDF viewer in the app (reports …): pages drawn with pdf.js (pdf.min.mjs / pdf.worker.min.mjs next to the app), zoom, share / save.
   The same on every device – Android Chrome can not show a PDF itself and used to download it or send the user to the Dropbox ---------- */
let PDFLIB=null;
async function pdfLib(){if(!PDFLIB){const m=await import(new URL("pdf.min.mjs",location.href).href);m.GlobalWorkerOptions.workerSrc=new URL("pdf.worker.min.mjs",location.href).href;PDFLIB=m}return PDFLIB}
const PDFV={doc:null,zoom:1,blob:null,name:"",obs:null,el:null};
function pdfClose(){const v=PDFV;try{v.obs&&v.obs.disconnect()}catch(_){}try{v.doc&&v.doc.destroy()}catch(_){}if(v.el)v.el.remove();Object.assign(v,{doc:null,blob:null,obs:null,el:null});document.documentElement.classList.remove("pdfvon")}
/* draw one page at the width of the screen × zoom (sharp on retina) */
async function pdfPage(cv){const v=PDFV;if(!v.doc||cv.dataset.z===String(v.zoom))return;cv.dataset.z=String(v.zoom);
  const p=await v.doc.getPage(+cv.dataset.p),w0=p.getViewport({scale:1}).width,box=v.el.querySelector(".pdfvb"),w=Math.max(200,(box.clientWidth-16)*v.zoom),
    vp=p.getViewport({scale:w/w0}),dpr=Math.min(3,window.devicePixelRatio||1);
  cv.width=Math.floor(vp.width*dpr);cv.height=Math.floor(vp.height*dpr);cv.style.width=Math.floor(vp.width)+"px";cv.style.height=Math.floor(vp.height)+"px";
  await p.render({canvasContext:cv.getContext("2d"),viewport:vp,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null}).promise}
function pdfRedraw(){const v=PDFV;if(!v.el)return;v.el.querySelector(".pdfvz").textContent=Math.round(v.zoom*100)+"%";
  v.el.querySelectorAll("canvas[data-p]").forEach(cv=>{const r=cv.getBoundingClientRect();if(r.bottom>-800&&r.top<innerHeight+800)pdfPage(cv).catch(()=>{})})}
/* url: a Blob, or the blob: address from blkImg (its file is kept in blkBlob) */
window.pdfView=async(url,title,fname)=>{pdfClose();const v=PDFV;v.name=fname||"dokument.pdf";v.zoom=1;
  const ico=(d,lab,attr)=>'<button type="button" class="pdfvbtn" '+attr+' aria-label="'+esc(lab)+'" title="'+esc(lab)+'"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg></button>';
  const el=document.createElement("div");el.id="pdfv";el.setAttribute("role","dialog");el.setAttribute("aria-label",title||"PDF");
  el.innerHTML='<div class="pdfvh"><b class="pdfvt">'+esc(title||"PDF")+'</b>'+ico('<path d="M5 12h14"/>',L("Verkleinern"),'data-pdfz="-"')+'<span class="pdfvz">100%</span>'+ico('<path d="M12 5v14M5 12h14"/>',L("Vergrössern"),'data-pdfz="+"')+
    ico('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',L("Teilen oder speichern"),'data-pdfsave')+ico('<path d="M6 6l12 12M18 6L6 18"/>',L("Schliessen"),'data-pdfx')+'</div>'+
    '<div class="pdfvb"><p class="pdfvl">'+esc(L("PDF wird geladen …"))+'</p></div>';
  document.body.appendChild(el);v.el=el;document.documentElement.classList.add("pdfvon");
  try{const lib=await pdfLib();const src=url instanceof Blob?url:(window.blkBlob&&window.blkBlob(url));if(!src)throw new Error("no file");const buf=await src.arrayBuffer();v.blob=new Blob([buf],{type:"application/pdf"});
    const doc=await lib.getDocument({data:new Uint8Array(buf),isEvalSupported:false}).promise;if(v.el!==el){doc.destroy();return}v.doc=doc;
    const box=el.querySelector(".pdfvb");box.innerHTML=Array.from({length:doc.numPages},(_,i)=>'<canvas data-p="'+(i+1)+'" aria-label="'+esc(L("Seite")+" "+(i+1))+'"></canvas>').join("");
    /* every page placeholder gets the size of page 1 first, then the pages near the screen are drawn */
    const p1=await doc.getPage(1),r=p1.getViewport({scale:1}),w=box.clientWidth-16;box.querySelectorAll("canvas").forEach(cv=>{cv.style.width=w+"px";cv.style.height=Math.round(w*r.height/r.width)+"px"});
    v.obs=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting)pdfPage(x.target).catch(()=>{})}),{root:box,rootMargin:"800px 0px"});box.querySelectorAll("canvas").forEach(cv=>v.obs.observe(cv))}
  catch(err){console.warn("pdf",err);const b=el.querySelector(".pdfvb");if(b)b.innerHTML='<p class="pdfvl">'+esc(L("PDF konnte nicht angezeigt werden."))+'</p>'}};
document.addEventListener("click",async e=>{const t=e.target.closest&&e.target.closest("#pdfv [data-pdfz],#pdfv [data-pdfx],#pdfv [data-pdfsave]");if(!t)return;e.preventDefault();e.stopPropagation();const v=PDFV;
  if(t.dataset.pdfx!=null){pdfClose();return}
  if(t.dataset.pdfz){v.zoom=Math.min(4,Math.max(.5,+(v.zoom*(t.dataset.pdfz==="+"?1.25:.8)).toFixed(2)));pdfRedraw();return}
  if(!v.blob)return;const f=new File([v.blob],v.name,{type:"application/pdf"});
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:v.name});return}}catch(err){if(err&&err.name==="AbortError")return}
  const u=URL.createObjectURL(v.blob),a=document.createElement("a");a.href=u;a.download=v.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),6e4)},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&PDFV.el&&!e.defaultPrevented){e.preventDefault();pdfClose()}});
/* the back button of the phone closes the viewer first */
window.addEventListener("popstate",()=>{if(PDFV.el)pdfClose()});
