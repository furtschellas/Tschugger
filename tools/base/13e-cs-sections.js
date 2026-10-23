/* ---------- Callsheet (5/6): the sections (locations, map, travel, calls) and renderCS ---------- */
/* ---------- Locations: one box per location (sets at the same address together, bases with their icons) ---------- */
/* code of a location: L1, «L1·L2» for sets at one address, the kinds of a base */
function csLocCode(l){return l.kinds?l.kinds.map(csKindCode).join("·"):l._codes?l._codes.join("·"):(l.no?"L"+String(l.no).trim():"")}
/* title (DN) and second line (LAD: address) of a location */
function csLocHead(c,l,date){let LAD=csLocAddr(c,l,date),DN=l.name||"";const w=t=>fold(String(t||"")).replace(/[^a-z0-9]/g,"");
  /* a side place: the title is its kind (Base, else the first kind, e.g. «WHM Extras»), the second line its name and address («Restaurant Hermitage, Pfynstrasse 160, 3952 Susten») */
  if(l.kinds){const isA=/\d{4}\s+\p{L}/u.test(DN),nm=isA?"":DN;const ad=LAD&&!(isA&&w(LAD)!==w(DN)&&!w(LAD).startsWith(w(DN)))?LAD:(isA?DN:LAD);
    LAD=[nm&&!w(ad).includes(w(nm))?nm:"",ad].filter(Boolean).join(", ");DN=l.kinds.includes("Base")?"BASE":csKindCode(l.kinds[0])}
  /* a set named by its address: no second line */
  else if(LAD&&w(DN).length>5&&w(LAD).startsWith(w(DN)))LAD="";
  return {DN,LAD}}
/* scenes of a location: buttons from the shooting order, else as listed in the callsheet */
function csLocScenes(c,l){const mem=l._m||[l];const uniq=[...new Set(csRows(c).filter(r=>r.sc&&mem.some(m=>csSceneLoc([m],r)===m)).map(r=>String(r.sc)))];
  return uniq.length?'<span class="csloc-s">'+uniq.map(x=>'<button type="button" class="cssc" data-cssc="'+esc(x)+'">'+esc(x)+'</button>').join("")+'</span>':(l.scenes?'<small class="csloc-s">'+esc(csS(l.scenes))+'</small>':'')}
/* the open part: hints (To set, WC), side places with distance, notes and lines – the address of the head only once */
function csLocBody(l,LAD,HN,near){
  const hints=HN.map(n=>'<div class="ds cshnl">'+(/^wc\b/i.test(n.trim())?'<b>WC</b>':CSI.walk)+'<span>'+csAdr(csL(n).replace(/^wc\s*:\s*/i,""),"")+'</span></div>').join("");
  /* lines that only repeat the address (also written differently) are left out, a place there shows «same address» */
  const an=t=>fold(String(t||"")).replace(/https?:\/\/\S+/g,"").replace(/[^a-z0-9]/g,""),km=String(LAD||"").match(/[^\d,]*?[a-zäöüéèà.]{3,}\s*\d+[a-z]?\b/i),K=km?an(km[0]):"";
  const same=t=>!!K&&K.length>5&&an(t).includes(K),only=t=>same(t)&&an(t).length<=an(LAD).length+4;
  const notes=csA(l.notes).filter(n=>!HN.includes(String(n))).filter(n=>!LAD||(!fold(LAD).includes(fold(csL(n)))&&!only(csL(n)))).map(n=>'<div class="ds">'+csAdr(csL(n),"")+'</div>').join("");
  const items=csA(l.items).filter(i=>String(i.text||"").trim()||i.map).filter(i=>!LAD||fold(String(i.text||"")).trim()!==fold(LAD).trim()).map(i=>'<div class="ds"><b>'+esc(csL(i.label||""))+'</b> '+(only(csL(i.text||""))?(i.map?'<a href="'+esc(safeUrl(i.map))+'" target="_blank" rel="noopener noreferrer">'+esc(L("gleiche Adresse"))+'</a>':esc(L("gleiche Adresse"))):csAdr(csL(i.text||""),i.map,csL(i.label||"")))+'</div>').join("");
  return hints+(l.kinds?'':csNearHTML(near))+notes+items}
/* one location: head (code, title, floorplans, map, open button), address, scenes; the rest when opened; pink frame where the shooting is now */
function csLocBox(c,l,date,NOW,NEAR){const mem=l._m||[l];const {DN,LAD}=csLocHead(c,l,date),code=csLocCode(l),isNow=mem.includes(NOW);const HN=csA(l.notes).map(String).filter(n=>CSHN_RE.test(n.trim()));
  const badge=code&&!l._m?csPlaceH(csBadgeIn(l,l._codes),csLocHref(l,c,date),l.kinds?l.no:code+' · Set','csloc-c '+(l.kinds?'csbase':'csmot')):'';
  const title=l._m?'<span class="dn csmset">'+l._m.map(m=>'<span><b class="csplace csmot">L'+esc(String(m.no||"").trim())+'</b> '+esc(m.name||"")+'</span>').join("")+'</span>':'<span class="dn">'+esc(DN)+'</span>';
  const icons='<span class="csloc-i">'+[...new Set(mem.map(m=>csLocFp(c,m,date,true)))].join("")+(LAD?'':csMap(l.map))+CSEXPSM+'</span>';
  const addr=LAD?'<a class="csaddr" href="'+esc(safeUrl(l.map||csMapQ(LAD)))+'" title="'+esc(LAD)+'" target="_blank" rel="noopener noreferrer" data-nobub="1">'+esc(LAD)+'</a>':'';
  const near=[].concat(...mem.map(m=>NEAR.get(m)||[])).filter((p,i,a)=>a.findIndex(y=>y.code===p.code&&y.u===p.u)===i).sort((a,b)=>a.d-b.d);
  return '<details class="dbox csloc'+(isNow?' csnowloc':'')+'"><summary><div class="csl1">'+badge+title+icons+'</div>'+addr+csLocScenes(c,l)+'</summary>'+csLocBody(l,LAD,HN,near)+'</details>'}
function csLocSec(c,x,me,SU,t){if(!vok("loc"))return"";   /* «Locations sehen» */const ls=csLocs(c),NOW=csNowLoc(c,x.date,ls),NEAR=csNear(c,ls,x.date);window.CSNOWK=NOW?NOW.no+'|'+NOW.name:'';
  const LG=csLocGroups(c,ls,x.date);
  return csSec("Locations",LG.length?LG.map(l=>csLocBox(c,l,x.date,NOW,NEAR)).join(""):"",true,"","loc","")}
/* points, lines and areas of the shared Google map near the places of the day (5 km); a point at a place already on the map (60 m or same name) is left out */
function csGmFeat(pts,G){const gm=S.gmap;if(!gm||!Array.isArray(gm.f)||!pts.length)return[];
  const d=(a,b)=>{const k=Math.PI/180,x=(b[1]-a[1])*k*Math.cos((a[0]+b[0])/2*k),y=(b[0]-a[0])*k;return Math.sqrt(x*x+y*y)*6371000};
  const P=pts.map(p=>p.p),nm=v=>fold(String(v||"")).replace(/[^a-z0-9]/g,""),N=new Set(pts.map(p=>nm(p.n)).concat(pts.map(p=>nm(p.c))).filter(Boolean)),off=new Set((G.off||[]).map(String));
  const out=[];for(const f of gm.f){if(!f||!Array.isArray(f.x)||!f.x.length||off.has(String(f.l||"")))continue;const xy=f.x.filter(q=>Array.isArray(q)&&q.length===2&&isFinite(q[0])&&isFinite(q[1]));if(!xy.length)continue;
    if(!xy.some(q=>P.some(p=>d(p,q)<5000)))continue;
    if(f.g==="p"&&(P.some(p=>d(p,xy[0])<60)||(nm(f.n)&&N.has(nm(f.n)))))continue;
    if(f.g==="p"&&out.some(o=>o.g==="p"&&d(o.x[0],xy[0])<15&&nm(o.n)===nm(f.n)))continue;   /* the same point twice in the Google map */
    out.push({g:f.g==="l"||f.g==="a"?f.g:"p",n:String(f.n||""),d:String(f.d||""),l:String(f.l||""),c:G.color!==false&&/^#[0-9a-f]{6}$/i.test(f.c||"")?f.c:"",x:f.g==="p"?[xy[0]]:xy})}
  return out}
function csMapSec(c,x,me,SU,t){if(window.CSMAPON===false||!vok("csmap"))return"";   /* switched off in the app settings */let h="";
  {const geo=c.geo||{},gs=c.geoSrc||{},pts=[],miss=[];const all=csRows(c),rows=all.filter(r=>r.sc);
   /* scene with start and end (= start of the next row of the shooting order) for the popup of a place */
   const span=r=>{const i=all.indexOf(r),a=hm(r.t),nx=all.slice(i+1).find(y=>hm(y.t));return [String(r.sc),a?a+(nx?"–"+hm(nx.t):""):""]};
   const add=(u,code,name,sc,minor,link)=>{const g=geo[u];link=link||(/^https?:/.test(u||"")?u:"");if(!(Array.isArray(g)&&g.length>=2&&isFinite(g[0])&&isFinite(g[1])&&g[0]!==null&&g[1]!==null)){   /* only real coordinates (else the whole map failed) */if(!minor&&u&&!miss.some(x=>x.c===code))miss.push({c:code,n:name,s:sc||"",u:link,set:!minor});return}if(pts.some(x=>x.c===code&&x.p.join(",")===g.join(",")))return;
     pts.push({p:g,c:code,n:name,s:sc||"",u:link,m:minor?1:0,r:gs[u]==="rough"||gs[u]==="near"?(gs[u]==="near"?2:1):0})};
   const BH=new Map();for(const l of csLocs(c)){const code=l.kinds?l.kinds.map(csKindCode).join("·"):"L"+String(l.no||"").trim();BH.set(code,csBadgeIn(l));
     /* a set without its own map link: its position under «loc:n» (address found by the updater) – every L is on the map */
     const key=l.kinds?l.map:csSetGeo(c,l)[0];
     const lr=l.kinds?[]:rows.filter(r=>csSceneLoc([l],r)===l);const sc=l.kinds?"":[...new Set(lr.map(r=>String(r.sc)))].join(", ")||csS(l.scenes);add(key,code,l.name||"",sc,0,csLocHref(l,c,x.date));
     {const pt=pts.find(x=>x.u===key&&x.c===code);if(pt&&lr.length)pt.st=lr.map(span)}
     for(const i of csA(l.items))if(i.map)add(i.map,code+" · "+(String(i.label||"").trim()||"P"),[i.label,i.text].filter(Boolean).join(" · "),"",1)}
   /* every L on the map: a set still without position (older data) roughly at the first place of the day, marked */
   {const at=(pts.find(p=>!p.m)||pts[0]||{}).p;if(at)for(const m of miss.filter(m=>m.set&&/^L/.test(m.c))){pts.push({p:at,c:m.c,n:m.n,s:m.s,u:m.u,m:0,r:2});miss.splice(miss.indexOf(m),1)}}
   /* bases with their icons on the map (sets keep their code L1 …) */
   for(const p of pts)if(!p.m&&!/^L/.test(p.c)&&BH.has(p.c))p.h=BH.get(p.c);
   /* places at the same point: the labels are stacked */
   pts.forEach((p,i)=>{p.k=pts.slice(0,i).filter(x=>x.p.join(",")===p.p.join(",")).length});
   const main=pts.filter(p=>!p.m);
   if(pts.length)h+=csSec(L("Karte"),'<div class="csmapw"><button type="button" class="csmapbig" data-csmapbig aria-label="'+esc(L("Karte vergrössern"))+'" title="'+esc(L("Karte vergrössern"))+'">'+CSEXP+'</button><div class="csmap0" data-csmap="'+esc(JSON.stringify(pts))+'"'+(()=>{const G=window.GMAPSET||{};if(!G.on)return"";const f=csGmFeat(pts,G);return f.length?' data-csgm="'+esc(JSON.stringify(f))+'"':""})()+'></div>'+
     '<div class="csmapl">'+main.map(p=>'<button type="button" class="csmapgo" data-csmapgo="'+pts.indexOf(p)+'">'+(BH.has(p.c)?'<span class="csplace csbadge '+(/^L/.test(p.c)?'csmot':'csbase')+'">'+BH.get(p.c)+'</span>':'<span class="csplace">'+esc(p.c)+'</span>')+' '+esc(p.n)+(p.r?' <small class="csmapr">'+esc(L("ungefähr"))+'</small>':'')+'</button>').join("")+
     miss.map(p=>'<a class="csmapgo nopos" href="'+esc(safeUrl(p.u))+'" target="_blank" rel="noopener noreferrer"><span class="csplace">'+esc(p.c)+'</span> '+esc(p.n)+' <small class="csmapr">'+esc(L("ohne Position – Google Maps"))+'</small></a>').join("")+'</div></div>',
     false,"","karte","")}
  return h}
function csTravelSec(c,x,me,SU,t){let h="";
  {const U=/(https?:\/\/[^\s<]+)/g;const clean=v=>String(v||"").replace(U,"").replace(/\s{2,}/g," ").trim();
   const badge=(txt,url)=>{let pl=null;try{pl=csPlace(c,clean(txt))}catch(_){}const code=pl?csShort(pl):"";const u=url||(pl&&pl.map)||"";if(!u)return code?csPlaceA(code,csCodeHref(code),pl&&pl.name):'';
     return '<a class="csplace" href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer" title="'+esc(pl&&pl.name||clean(txt)||L("Karte"))+'">'+esc(code||L("Karte"))+'</a>'};
   /* travel of another day (a second TRAVEL CAST part of the document): after the others, with its date */
   const other=r=>r.date&&x.date&&r.date!==x.date;const dlab=r=>{try{const d=new Date(r.date+"T12:00:00");return (typeof WDL==="function"?WDL(d)+" ":"")+r.date.slice(8,10)+"."+r.date.slice(5,7)+"."}catch(_){return r.date}};
   const rows=csA(c.travel).slice().sort((a,b)=>(other(a)?1:0)-(other(b)?1:0)).map(r=>{const urls=[r.from,r.to,r.note].join(" ").match(U)||[];
     return '<div class="cstrv'+(other(r)?' trvother':'')+'">'+(other(r)?'<span class="trvd">'+esc(dlab(r))+'</span>':'')+'<b>'+esc(r.name||"")+'</b>'+(r.how?'<small>'+esc(r.how)+'</small>':'')+'<span class="r">'+esc(csRoute(clean(r.from),r.t1,clean(r.to),r.t2))+'</span>'+badge(r.to,urls[0])+(clean(r.note)?'<small class="n">'+csTx(clean(r.note))+'</small>':'')+'</div>'}).join("");
   h+=csSec(L("Anreise Cast"),rows,false,"","travel",SU.travel)}
  return h}
function csCallsSec(c,x,me,SU,t){let h="";
  {const g=new Map();for(const r of csA(c.calls)){const k=r.dept||"";if(!g.has(k))g.set(k,[]);g.get(k).push(r)}
   h+=csSec("Calls on Set",[...g].map(([dp,l])=>'<div class="cscall"><div class="cscall-d">'+esc(dp)+'</div>'+l.map(r=>{const who={hit:t=>{const a=nmk(String(t||"")),b=nmk(String(r.name||""));return !!b&&a.includes(b)}};let pl=null;try{pl=csCallPlace(c,who,r)}catch(_){}
     const sc=pl?csShort(pl):"";const tag=sc?csPlaceA(sc,pl.map||csCodeHref(sc),pl.name):'';
     const tm=String(r.t||"").match(/^(\d{1,2}:\d{2})\s*(.*)$/);
     return '<div class="cscall-r'+(me&&me.hit(r.name)?' mine':'')+'"><span class="t">'+esc(tm?tm[1]:(r.t||""))+(tm&&tm[2]?'<i>'+esc(tm[2])+'</i>':'')+'</span><span class="cp">'+tag+'</span><span class="ccw"><b>'+esc(r.name||"")+'</b> <small>'+esc(r.role||"")+'</small></span></div>'}).join("")+'</div>').join(""),false,"","calls",SU.calls)}
  return h}
function renderCS(x,day){const c=x.cs||{},t=c.times||{},me=csMe();let h="";CSTR=c.tr||null;CSCUR={c,date:x.date||"",me};
  let JB="";
  /* jump bar (sticky) and search over the whole callsheet */
   JB=csJumpBar(c,x,me,null,t);
  /* head: as the top of the callsheet */
  /* with «my day»: its red box carries the title (Mein Drehtag 1 · date), no head line on top */
  const mineN=me?csMine(c,me).length:0;const dtitle=(mineN?esc(L("Mein"))+' ':'')+esc(x.label||day.label||"Callsheet");
  if(!mineN)h+='<div class="dsp-head"><div><h2>'+dtitle+'</h2><div class="date drow"><span>'+fmtDate(x.date)+'</span>'+UNITBAR+'</div></div></div>';
  else if(UNITBAR)h+='<div class="date drow dsp-units"><span></span>'+UNITBAR+'</div>';
  if(typeof myPickBar==='function')h+=myPickBar();
  h+=csTilesHTML(x,day,c,me);
  /* contact on set: the name itself is the call link (only with the phone right) */
  if(c.contact&&(c.contact.name||c.contact.phone)){const ct=c.contact,tel=String(ct.phone||"").replace(/[^\d+]/g,""),nm=ct.name?esc(ct.name):csTx(ct.phone);
    /* one line, the size fitted to the width (csFitContact) */
    h+='<div class="cscontact"><span class="csct-in"><b>'+esc(L("Kontakt am Set"))+':</b> '+(tel&&vok("phone")?'<a class="csct" href="tel:'+esc(tel)+'" title="'+esc(L("Anrufen"))+'">'+CSI.phone+nm+'</a>':nm)+(ct.role?' <small>· '+esc(ct.role)+'</small>':'')+'</span></div>'}
  /* radio channels below the contact: one chip per channel («1 AD / AL», «2 Chat» …) */
  h+=csRadioHTML(c.radio);
  /* my day */
  /* my day: on the shooting day first the scene being shot now (with its place) */
  const NS=csNowScene(x);window.CSNOWSC=NS?(NS.ev||String(NS.sc)):"";
  const nowRow=NS?(()=>{const b=csNowBits(NS,c,x.date);return '<div class="csme-r csme-now"><span class="k">'+esc(L("Jetzt"))+'</span><span class="v">'+(b.ev||'<b>'+b.sc+'</b>'+b.place+' <small>'+b.set+'</small>')+'</span></div>'})():'';
  if(me){const mine=csMine(c,me);if(mine.length)h+='<section class="dsec csme" id="cs-mein" aria-label="'+esc(L("Mein Tag")+" · "+me.name)+'"><h2 class="csme-h">'+dtitle+' <span>'+fmtDate(x.date)+'</span></h2>'+nowRow+mine.join("")+'</section>'}
  h+='<!--CASTPOS-->';   /* Maske / Kostüm: the cast right below «Mein Drehtag» */
  /* key people of the day */
  /* folded parts: sums and short facts in one line */
   const SU=csSums(c,x);
   h+=csTeamSec(c,x,me,SU,t);
  /* locations */
  /* locations: each one folds (name and map always visible), a button opens or closes all */
   h+=csLocSec(c,x,me,SU,t);
  /* map of the day: every location on its own (code, scenes, name), parking and other points of the sets small */
   h+=csMapSec(c,x,me,SU,t);
  /* production information */
  if(vok("info"))h+=csSec(L("Produktionsinfos"),csA(c.info).map(p=>'<p>'+csTx(csL(p))+'</p>').join(""),true,"csinfo");
  /* shooting order */
  const o=c.order||{};
  {const sc=csA(o.rows).filter(r=>r.sc).map(r=>String(r.sc)),ch=(k,v)=>v?'<span class="csoc"><i>'+esc(k)+'</i>'+esc(v)+'</span>':'';
   /* folded: Call · Probe · RTS · scenes · Lunch · Wrap in one short line */
   const sumx='<span class="csosum">'+ch("Call",t.crewCall||x.crewCall)+ch(L("Probe"),t.rehearsal)+ch("RTS",t.rts||x.shootCall)+(sc.length?ch(sc.length+" "+L("Szenen"),sc.length>1?sc[0]+"–"+sc[sc.length-1]:sc[0]):"")+ch("Lunch",t.lunch)+ch("Wrap",t.wrap||x.wrap)+'</span>'+
     (sc.length?'<span class="csoscn">'+(()=>{const LS=csLocs(c),OR=csA(o.rows),NR=OR[csNowIdx(OR,x.date)]||null;return OR.filter(r=>r.sc).map(r=>{const lo=csSceneLoc(LS,r);
       /* one line per scene: time · scene · I/E · set code · set · duration; the scene of now framed */
       return '<span class="cso1'+(r===NR?' now':'')+'"><i>'+esc(hm(r.t)||"")+'</i><b>'+esc(String(r.sc))+'</b>'+(r.ie?'<span class="ie '+(typeof ieClass==="function"?ieClass(r.ie):"")+'">'+esc(r.ie)+'</span>':'')+(lo?csPlaceA('L'+String(lo.no).trim(),csLocHref(lo),lo.name||""):'')+'<span class="st">'+esc(r.set||"")+'</span>'+(r.dur?'<span class="du">'+esc(r.dur)+'</span>':'')+'</span>'}).join("")})()+'</span>':'');
   h+=csSec(L("Drehfolge")+(o.pages?' · '+o.pages+' pgs':''),(o.title?'<p class="ghint">'+esc(o.title)+'</p>':'')+csOrderRows(o.rows,x.date,csLocs(c),true),false,"","order",sumx)}
  /* cast, extras, vehicles */
  const CC=csCols();
  if(c&&x&&x.date)c._date=x.date;   /* the day for the cast ticks */
  {const castH=csSec("Cast",(csA(c.cast).length?'<span class="cscols">'+[["role",L("Rolle")],["actor",L("Darsteller")]].map(([k,t])=>'<button type="button" class="cscol" data-cscol="'+k+'" aria-pressed="'+!CC.has(k)+'">'+esc(t)+'</button>').join("")+'</span>':'')+(csA(c.cast).length?'<button type="button" class="lnk cstview" data-cstview>'+(csCastMode()?CSI.cards:CSI.table)+'<span>'+esc(L(csCastMode()?"Als Kacheln":"Als Tabelle"))+'</span></button>':'')+csTable(["#",L("Rolle"),L("Darsteller"),"P/UP","Call",L("Kostüm"),L("Maske"),"Base","On set"],csA(c.cast).map(r=>{const all=window.cqAll&&window.cqAll(c,r),pk=v=>all&&v?{h:'<span class="cqall" title="'+esc(L("Alle Schritte abgeschlossen"))+'">'+esc(v)+'</span>'}:v;   /* On set: number, role and name pink */
    return [pk(r.no),pk(r.role),pk(r.actor),window.cqPickup?window.cqPickup(c,r)||r.pickup:r.pickup,window.cqCall?window.cqCall(c,r)||r.call:r.call,csMk(r.wardrobe,c,"w",r)||csDurT(r.wardrobe),csMk(r.makeup,c,"m",r)||csDurT(r.makeup),window.cqBase?window.cqBase(c,r)||r.base:r.base,window.cqOnset?window.cqOnset(c,r)||r.onset:r.onset]}),3,true),csCastOpen(c,me),(csCastMode()?"cs-astbl":"")+(CC.has("role")?" hide-role":"")+(CC.has("actor")?" hide-actor":""),"cast",SU.cast);if(csCmFirst(c,me)&&h.includes('<!--CASTPOS-->'))h=h.replace('<!--CASTPOS-->',castH);else h+=castH}
  h=h.replace('<!--CASTPOS-->','');
  /* travel of the cast: one line per person (name · how · from → to · note), the place as short code (L1, Base …) with the map */
   h+=csTravelSec(c,x,me,SU,t);
  /* extras: Call (how many are there), Kostüm, Maske, On set to tick like the cast (24-flow); On set = the group grey, count and role pink */
  {const xq=(f,c_,r,v)=>(window.xqField&&window.xqField(f,c_,r))||v;
   h+=csSec(L("Komparsen"),csTable(["#",L("Rolle"),"Call",L("Kostüm"),L("Maske"),"On set"],csA(c.extras).map(r=>{const all=window.xqAll&&window.xqAll(c,r),pk=v=>all&&v?{h:'<span class="cqall" title="'+esc(L("Alle Schritte abgeschlossen"))+'">'+esc(v)+'</span>'}:v;
     return [pk(r.count),pk(r.part),xq("c",c,r,r.call),xq("w",c,r,r.wardrobe),xq("m",c,r,r.makeup),xq("o",c,r,r.onset)]}),2,true),false,"","extras",SU.extras)}
  h+=csSec(L("Fahrzeuge"),csTable([L("Fahrzeug"),"Via","Call","RTS"],csA(c.vehicles).map(r=>[r.name,r.via,r.call,r.rts])),false,"","",SU.veh);
  /* transport and travel */
  /* Fahrten Manager: all rides of the day as done in one go */
  const allDone=csA(c.transport).length&&window.RIDEACKON!==false&&typeof canPerm==="function"&&canPerm("rides.alldone")?'<button type="button" class="pillbtn csrideall" data-rideall="'+esc(x.date||"")+'">'+(window.RIDE_ICO&&RIDE_ICO[2]||"")+' '+esc(L("Alle Fahrten als erledigt"))+'</button>':'';
  h+=csSec(L("Transport mit Fahrer"),allDone+csTvBtn("trans")+(c.drivers?'<div class="csdrvl">'+String(c.drivers).replace(/o\.\s*p\.\s*D\.?\s*=\s*on personal decision/i,"").split(/\s*[|\n;]\s*/).filter(x=>x.trim()).map(x=>{const m=x.match(CSPH);let nm=m?x.replace(m[0],"").trim():x.trim();
      /* a number without a name (forgotten on the callsheet): the name from other callsheets or the crew list with that number */
      if(!nm&&m)nm=csDriverByPhone(m[0]);
     return '<div class="csdrv-r"><span>'+esc(nm)+'</span>'+(m?csTx(m[0]):'')+'</div>'}).join("")+'</div>':'')+csTable([L("Fahrt"),L("Fahrzeug"),L("Fahrer"),L("Mitfahrende")],csA(c.transport).map(r=>[csRideCell(x.date,r),r.vehicle,r.driver,r.passengers]),1),csTransOpen(c,me),csTvCls("trans"),"trans",SU.trans);
  /* information by department */
  h+=csSec(L("Transport Crew"),csTvBtn("ctrans")+csTable([L("Fahrzeug"),L("Fahrt"),L("Personen")],csA(c.crewTransport).map(r=>[r.vehicle,csRoute(r.from,r.t1,r.to,r.t2),r.people])   /* crew transport: no confirmation */,1),csTransOpen(c,me),csTvCls("ctrans"),"ctrans",SU.ctrans);
  h+=csSec([L("Infos nach Abteilung"),L("Infos nach Dept.")],csA(c.depts).filter(r=>String(r.text||"").trim()).map(r=>'<div class="csdep'+(csMyDept(c,me,r.dept)?' mine':'')+'"><div class="csdep-h">'+esc(r.dept||"")+'</div><div class="csdep-t">'+csTx(r.text)+'</div></div>').join(""),false,"","dept",SU.dept);
  /* the preview (PREVISION) is shown only on the next day (csPrevHTML) */
  /* calls on set */
  /* calls on set: by department, one short line per person (time · name · job) */
   h+=csCallsSec(c,x,me,SU,t);
  /* totals, notes, radio */
  const nb=[c.total?'<p><b>'+esc(c.total)+'</b></p>':'',...csA(c.notes).map(n=>'<p>'+csTx(n)+'</p>'),''].join("");
  /* notes and the weather option of the document in one part */
  const WX=csA(x.sections).concat(csA(c.sections)).filter(sec=>/weather|wetter|météo|meteo/i.test(String(sec&&sec.title||"")));
  const wxb=WX.map(sec=>'<h4 class="cswx">'+esc(String(sec.title||""))+'</h4>'+csA(sec.rows).map(r=>Array.isArray(r)?r:[r]).filter(r=>r.some(cc=>String(cc==null?"":cc).trim())).map(r=>'<p>'+r.map(cc=>csTx(cc)).join(" · ")+'</p>').join("")).join("");
  h+=csSec(WX.length?L("Notizen & Wetter"):L("Notizen"),nb+wxb,false,"","",SU.notes);
  /* emergency (hospital) when the callsheet has it */
  if(x.hospital&&(x.hospital.name||x.hospital.phone))h+='<section class="dsec"><h3 class="dh">'+L('Notfall')+'</h3><div class="people"><div class="p"><div class="hd"><span class="nm">'+esc(x.hospital.name||L("Spital"))+'</span><span class="role">'+L('Nächstes Spital')+'</span></div>'+(x.hospital.address?'<div class="ct"><a href="'+maps([x.hospital.name,x.hospital.address].filter(Boolean).join(", "))+'" target="_blank" rel="noopener noreferrer">'+esc(x.hospital.address)+'</a></div>':'')+(x.hospital.phone?'<div class="ct"><a class="hosp" href="tel:'+esc(String(x.hospital.phone).replace(/\s/g,""))+'"><span>'+esc(x.hospital.phone)+'</span></a></div>':'')+'</div></div></section>';
  /* anything else of the document */
  for(const sec of csA(x.sections).concat(csA(c.sections)).filter(s0=>!WX.includes(s0))){const rows=csA(sec&&sec.rows).map(r=>Array.isArray(r)?r:[r]).filter(r=>r.some(cc=>String(cc==null?"":cc).trim()));if(!rows.length)continue;
    h+=csSec(String(sec.title||""),rows.map(r=>'<p>'+r.map(cc=>csTx(cc)).join(" · ")+'</p>').join(""),false)}
  /* on the shooting day: once per visit straight to the running row */
  if(x.date===todayISO()){window.__csScr=window.__csScr||{};if(!window.__csScr[x.date]){window.__csScr[x.date]=1;setTimeout(()=>{const n=document.querySelector(".csview .csorder li.now");if(n)n.scrollIntoView({block:"center",behavior:"smooth"})},400)}}
  return JB+'<div class="csview">'+h+'</div>'}
