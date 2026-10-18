/* ---------- screenplay: tapping a scene description shows that scene from the script (original text, not translated) ---------- */
let SCRIPT=null,SCRIPTP=null;
function scriptData(){
  if(SCRIPT)return Promise.resolve(SCRIPT);
  if(!SCRIPTP)SCRIPTP=(async()=>{
    let list=null;
    if(typeof window.loadScriptData==="function")list=await window.loadScriptData();
    else if(DB){const q=await DB.collection("script").orderBy("order").get();list=rows(q)}
    list=Array.isArray(list)?list:[];if(list.length)SCRIPT=list; /* never cache an empty result */
    return list;
  })().finally(()=>{SCRIPTP=null});
  return SCRIPTP;
}
/* "186pt1A" → 186, "6 SL4" → 6SL, "184CA" → 184CA */
function findScene(list,sc){
  const by=new Map(list.map(x=>[String(x.sc).toLowerCase().replace(/\s+/g,""),x]));
  const n=String(sc||"").toLowerCase().replace(/\s+/g,"");
  const a=n.replace(/pt\d+[a-z]*$/,"");
  const tries=[n,a,a.replace(/^(\d+[a-z]+)\d+$/,"$1"),(n.match(/^\d+/)||[""])[0]];
  for(const t of tries)if(t&&by.has(t))return by.get(t);
  return null;
}
/* screenplay layout: the PDF text has hard line breaks, so paragraphs are rejoined;
   a block that starts with a character cue is dialogue (cue, (parentheticals), lines) */
const isCue=x=>/^[A-ZÄÖÜÉÈÀ0-9 .’'\-()\/&]+$/.test(x)&&x.length<44&&/[A-Z]{2}/.test(x)&&!/^(CUT|FADE|SMASH|MATCH)\b/.test(x);
const joinLines=a=>esc(a.join(" ").replace(/(\w)- ([a-zäöüéèà])/g,"$1$2").replace(/(\w)- ([A-ZÄÖÜ])/g,"$1-$2").replace(/\s+/g," "));
function scriptHTML(t){
  return String(t||"").split(/\n\s*\n/).map(block=>{
    const ls=block.split("\n").map(x=>x.trim()).filter(Boolean);if(!ls.length)return"";
    if(ls.length===1&&/^(CUT TO|FADE (IN|OUT)|SMASH CUT|MATCH CUT|DISSOLVE)/.test(ls[0]))return '<p class="sp-trn">'+esc(ls[0])+'</p>';
    if(/^(MUSIC|MUSIK|SONG|SFX|SOUND|TITLE|TITEL|INSERT|SUPER)\b.*:/i.test(ls[0]))return '<p class="sp-note">'+joinLines(ls)+'</p>';
    if(isCue(ls[0])&&ls.length>1){
      const out=['<div class="sp-cue">'+esc(ls[0])+'</div>'];let buf=[];
      const flush=()=>{if(buf.length){out.push('<p class="sp-dia">'+joinLines(buf)+'</p>');buf=[]}};
      let par=null;
      for(const x of ls.slice(1)){
        if(par!==null){par.push(x);if(/\)$/.test(x)){out.push('<div class="sp-par">'+joinLines(par)+'</div>');par=null}continue}
        if(/^\(/.test(x)){flush();if(/\)$/.test(x))out.push('<div class="sp-par">'+esc(x)+'</div>');else par=[x];continue}
        buf.push(x);
      }
      if(par)buf.push(...par);flush();
      return '<div class="sp-dlg">'+out.join("")+'</div>';
    }
    return '<p class="sp-act">'+joinLines(ls)+'</p>';
  }).join("");
}
function sceneSheet(){
  let s=document.getElementById("scn");
  if(!s){s=document.createElement("div");s.id="scn";s.className="scrn";s.setAttribute("role","dialog");s.setAttribute("aria-modal","true");document.body.appendChild(s);
    s.addEventListener("click",e=>{const n=e.target.closest("[data-scene]");if(n){e.stopPropagation();openScene(n.dataset.scene);return}if(e.target===s||e.target.closest("[data-scnclose]"))closeScene()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!e.defaultPrevented&&!s.hidden)closeScene()})}
  return s;
}
function closeScene(){const s=document.getElementById("scn");if(s){s.hidden=true;s.innerHTML=""}document.body.style.overflow=""}
/* schedule facts for the scene shown in the script viewer (day, time, unit, pages, duration, cast …) */
/* "09:00" + "3h30" -> "12:30" */
function endTime(t,dur){
  const a=/^(\d{1,2})[:.](\d{2})/.exec(t||""),ds=String(dur||"").trim(),mm=/^(\d+)\s*min$/i.exec(ds),b=/^(\d+)\s*h\s*(\d{1,2})?$/i.exec(ds)||(mm?[0,0,mm[1]]:null);
  if(!a||!b)return"";const m=(+a[1]*60+ +a[2]+(+b[1]||0)*60+(+b[2]||0))%1440;return pad2(Math.floor(m/60))+":"+pad2(m%60);
}
function schedIndex(){return memo("scsched",()=>{const m={};for(const d of S.days)for(const [u,its] of unitLists(d))for(const it of its){if(!it.sc)continue;const k=norm(it.sc);(m[k]=m[k]||[]).push({d,u,it})}return m})}
function sceneFacts(reqSc,x,list){
  const want=String(reqSc||"").toLowerCase().replace(/\s+/g,"");
  const ex=schedIndex()[want];if(ex&&ex.length)return factsHTML(ex); /* fast path: exact scene number */
  const hits=[];
  for(const d of S.days)for(const [u,its] of unitLists(d))for(const it of its){
    if(!it.sc)continue;const n=String(it.sc).toLowerCase().replace(/\s+/g,"");
    if(n===want||(x&&findScene(list,it.sc)===x))hits.push({d,u,it});
  }
  const exact=hits.filter(h=>String(h.it.sc).toLowerCase().replace(/\s+/g,"")===want);
  return factsHTML(exact.length?exact:hits);
}
/* floorplans (PDF) and blocking photos from the 3D folder, matched to sets, places and scene numbers */
const fpk=t=>fold(t).replace(/[^a-z0-9]/g,"");
function fpFor(set,loc){const st=fpk(set),lc=fpk(loc);return arr(S.meta&&S.meta.floorplans).filter(f=>{const r=f.rule||{},ws=arr(r.set).map(fpk),wl=arr(r.loc).map(fpk);
  return (ws.length||wl.length)&&ws.every(w=>st.includes(w))&&(!wl.length||wl.some(w=>lc.includes(w)))&&!arr(r.not).map(fpk).some(w=>st.includes(w)||lc.includes(w))})}
/* blocking pictures: each picture is stored once in meta.bm, the scenes refer to it by number (mi) */
function bmed(b){if(!b)return[];const bm=arr(S.meta&&S.meta.bm);const all=Array.isArray(b.media)?b.media:arr(b.mi).map(i=>bm[i]).filter(Boolean);
  /* recce photos only when the scene has no other pictures – never mixed */
  const other=all.filter(m=>m.g!=="recce");return other.length?other:all}
function blkFor(sc){const n=String(sc||"").toLowerCase().replace(/\s+/g,"");return n?arr(S.meta&&S.meta.blocking).filter(b=>arr(b.sc).some(x=>{x=String(x).toLowerCase();return x===n||(n.startsWith(x+"pt")&&!/pt/.test(x))||(n.startsWith(x+"sl")&&!/sl/.test(x))})).map(b=>{if(!/pt/.test(n))return b;const k=f=>String(f.l).toLowerCase().replace(/\s+/g,""),p=arr(b.pdfs).filter(f=>!/pt/.test(k(f))||n.startsWith(k(f))||k(f).startsWith(n));return p.length?Object.assign({},b,{pdfs:p}):b}).filter((b,_,all)=>{/* recce only when no other pictures exist for the scene */const rec=x=>{const m=bmed(x);return m.length&&m.every(y=>y.g==="recce")};return !rec(b)||!all.some(o=>o!==b&&bmed(o).length&&!rec(o))}):[]}
function fpLinks(fps,blk,lead){const l=(lead?[lead]:[]).concat(arr(fps).map(f=>'<a class="fpl" href="'+esc(safeUrl(f.url))+'"'+(arr(f.pg).length?' data-fpg="'+esc(f.file||f.name)+'"':'')+' target="_blank" rel="noopener noreferrer">'+(f.kind==="img"?"🖼 ":"📐 ")+esc(f.name)+'</a>').concat((vok("blocking")?arr(blk):[]).flatMap(b=>['<a class="fpl blk'+(bmed(b).length?' hasm':'')+'" href="'+esc(safeUrl(b.url))+'"'+(bmed(b).length?' data-blkg="'+esc(b.name)+'"':'')+' target="_blank" rel="noopener noreferrer" title="Blocking" aria-label="Blocking"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg></a>'].concat(pdfBtns(b)))));return l.length?'<div class="fpls">'+l.join("")+'</div>':""}
/* the PDFs of a scene (Auflösung): one button each, opening the PDF pages directly in the app (encrypted copies, also offline);
   a PDF whose pages are not in the app yet opens in Dropbox as before */
const pdfLbl=n=>String(n).replace(/\.pdf$/i,"").replace(/^scene[\s_]*/i,"").replace(/(^|[^0-9A-Za-z])0+(?=\d)/g,"$1");
function pdfDocs(b){const docs=new Map();for(const m of bmed(b))if(m.g==="pdf"){const k=String(m.n).split(" · ")[0];if(!docs.has(k))docs.set(k,0);docs.set(k,docs.get(k)+1)}return docs}
function pdfBtns(b){const docs=typeof window.blkImg==="function"?pdfDocs(b):[],out=[],done=new Set();   /* in-app pages only where the viewer exists, else the Dropbox links */
  for(const [k,n] of docs){done.add(pdfLbl(k));out.push('<button type="button" class="fpl scp" data-blkpdf="'+esc(b.name)+'" data-pdfn="'+esc(k)+'" title="'+esc(k+" · "+n+" "+L(n===1?"Seite":"Seiten"))+'">'+esc(pdfLbl(k))+'</button>')}
  for(const f of arr(b.pdfs))if(!done.has(f.l))out.push('<a class="fpl scp" href="'+esc(safeUrl(f.u))+'" target="_blank" rel="noopener noreferrer">'+esc(f.l)+'</a>');
  return out}
window.pdfBtns=pdfBtns;
function itemFp(it,lead){return fpLinks(fpFor(it.set,(it.loc||"")+" "+(it.loc?addrForItem(it):"")),blkFor(it.sc),lead)}
function factsHTML(hits){
  const show=hits.slice().sort((a,b)=>a.d.date<b.d.date?-1:a.d.date>b.d.date?1:String(a.it.t).localeCompare(String(b.it.t)));
  if(!show.length)return"";
  return '<div class="spf">'+show.map(({d,u,it})=>{
    const dt=new Date(d.date+"T12:00:00");
    const kv=[[L("Szene"),it.sc],["I/E",it.ie],[L("Seiten"),it.pg],[L("Drehzeit"),it.dur],[L("Regie"),it.dir],["FX",it.fx],[L("Kompars:innen"),it.xx]].filter(k=>k[1]);
    return '<div class="spf1"><div class="spfd"><span class="spfdd"><b>'+esc(d.short||d.label)+'</b> · '+esc(WD[dt.getDay()]+" "+pad2(dt.getDate())+"."+pad2(dt.getMonth()+1)+".")+'</span>'+(it.t?'<span class="spft">'+esc(it.t)+(endTime(it.t,it.dur)?'–'+endTime(it.t,it.dur):'')+'</span>':'')+(u!=="1"?'<span class="spfu">'+UNAME[u]+' Unit</span>':'')+'</div>'+
      (it.set?'<div class="spfs">'+esc(it.set)+'</div>':'')+
      '<div class="spfk">'+kv.map(k=>'<span><i>'+esc(cap(String(k[0])))+'</i>'+esc(k[1])+'</span>').join("")+'</div>'+
      (it.d?'<div class="spfx">'+esc(TX(it,"d"))+'</div>':'')+
      (it.cast&&it.cast.length?'<div class="spfc">'+castChips(it.cast)+'</div>':'')+
      (it.loc?(()=>{const ad=addrForItem(it);return '<div class="spfa">'+(/^tba$/i.test(ad)?esc(L('Ort: TBA')):'<a href="'+maps(ad)+'" target="_blank" rel="noopener noreferrer">'+esc(ad)+'</a>')+'</div>'})():'')+itemFp(it)+'</div>';
  }).join("")+'</div>';
}
const TOD_RE=/[-–]\s*(DAY|NIGHT|EVENING|MORNING|DAWN|DUSK|CONTINUOUS|LATER|SAME|NOON|MIDDAY|AFTERNOON|SUNSET|SUNRISE|TAG|NACHT|ABEND|MORGEN)\b/i;
/* slugline as in the script; if it has no time of day, add it from the schedule (D/N/Ev/Mo) */
function spHead(x){
  const h=String(x.head||"").trim();if(!h||TOD_RE.test(h))return h;
  const want=norm(x.sc);let ie="";
  for(const d of S.days){for(const [,its] of unitLists(d)){const it=its.find(i=>i.sc&&norm(i.sc)===want&&i.ie);if(it){ie=it.ie;break}}if(ie)break}
  const t=(ie.split("/")[1]||"");const tod=/^N/i.test(t)?"NIGHT":/^Ev/i.test(t)?"EVENING":/^Mo/i.test(t)?"MORNING":/^D/i.test(t)?"DAY":"";
  return tod?h+" - "+tod:h;
}
/* day/night marker for the slugline: schedule I/E first, else the time word in the heading */
function spTod(x){
  const want=norm(x.sc);let t="";
  for(const d of S.days){for(const [,its] of unitLists(d)){const it=its.find(i=>i.sc&&norm(i.sc)===want&&i.ie);if(it){t=it.ie.split("/")[1]||"";break}}if(t)break}
  const h=String(x.head||"").toUpperCase();
  const k=/^N/i.test(t)?"n":/^Ev/i.test(t)?"ev":/^Mo/i.test(t)?"mo":/^D/i.test(t)?"d":
    /\b(NIGHT|NACHT)\b/.test(h)?"n":/\b(EVENING|DUSK|ABEND|SUNSET)\b/.test(h)?"ev":/\b(MORNING|DAWN|MORGEN|SUNRISE)\b/.test(h)?"mo":/\b(DAY|TAG|NOON|MIDDAY|AFTERNOON)\b/.test(h)?"d":"";
  if(!k)return"";
  const lbl={d:"Tag",mo:"Tag",ev:"Abend",n:"Nacht"}[k];
  return '<span class="sptod sptod-'+k+'">'+esc(L(lbl))+'</span>';
}
