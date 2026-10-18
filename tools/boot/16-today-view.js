/* ---------- 1) «Heute»: everything for today (or the next working day) on one page ---------- */
/* «Today» on/off per person (profile, synced with the view settings) */
function todayOn(){try{const v=localStorage.getItem("today")||"";return !(v==="0"||v.startsWith("0|"))}catch(_){return true}}
/* which parts Today shows (profile → App): stored with the on/off value, «1|menu,off» = on, without lunch and offline */
const TODAY_PARTS=[["my","Meine nächsten Termine",()=>vok("mycal")],["time","Zeiten",()=>true],["drive","Anfahrt",()=>vok("plan")],["wx","Wetter",()=>vok("plan")],
  ["loc","Erste Location",()=>vok("plan")],["menu","Mittagessen",()=>true],["scs","Szenen",()=>vok("plan")],["chg","Änderungen",()=>vok("plan")||vok("script")],["off","Offline am Set",()=>vok("blocking")||vok("plan")]];
function todayHidden(){let v="";try{v=localStorage.getItem("today")||""}catch(_){}const i=v.indexOf("|");return new Set(i<0?[]:v.slice(i+1).split(",").filter(Boolean))}
const tShow=k=>!todayHidden().has(k);
window.todayPartsHTML=function(){if(!todayOn())return "";const hid=todayHidden(),ps=TODAY_PARTS.filter(x=>x[2]());
  return '<p class="ahint"><b>'+esc(L("Was zeigt «Today»?"))+'</b></p>'+ps.map(([k,t])=>'<label class="ck"><input type="checkbox" data-todaypart="'+k+'"'+(hid.has(k)?'':' checked')+'> '+esc(L(t))+'</label>').join("")};
document.addEventListener("change",e=>{const c=e.target.closest("[data-todayon]");if(!c)return;const hid=[...todayHidden()];store("today",(c.checked?"1":"0")+(hid.length?"|"+hid.join(","):""));if(!c.checked&&S.tab==="today")S.tab="plan";render()});
document.addEventListener("change",e=>{const c=e.target.closest("[data-todaypart]");if(!c)return;const hid=todayHidden();if(c.checked)hid.delete(c.dataset.todaypart);else hid.add(c.dataset.todaypart);
  store("today","1"+(hid.size?"|"+[...hid].join(","):""));if(typeof savePrefsSoon==="function")savePrefsSoon()});
/* a new script version (from the Dropbox update): shown for 3 days like the schedule changes, with the scenes from the changelog
   and the whole changelog to open */
/* the changes grouped by day: the date as a line of its own, the changes below it over the whole width */
function chgListHTML(cl){let last="";
  return '<ul class="chglist">'+cl.map(c=>{const dh=c.date!==last?'<li class="cdh"><span class="cd">'+esc(dmy(c.date))+'</span></li>':'';last=c.date;
    return dh+'<li class="chgi'+(c.unread?' unread':'')+'"><span class="cw">'+(c.sc?'<b>'+esc(L("Szene"))+' '+esc(c.sc)+'</b>'+(c.u&&c.u!=="1"?' <span class="td-unit">'+esc(UNAME[c.u])+'</span>':'')+' · ':'')+(c.script?scriptChgHTML(c):esc(c.txt))+'</span></li>'}).join("")+'</ul>'}
/* changelog text → one line per scene, with «added / deleted / changed / clarified» marked (lines broken by the PDF are joined again) */
const CLOGK={added:"add",deleted:"del",changed:"chg",clarified:"clr"},CLOGDE={added:"neu hinzugefügt",deleted:"gestrichen",changed:"geändert",clarified:"präzisiert"};
function clogHTML(t){const intro=[],items=[];let cur=null;
  for(let x of String(t||"").split("\n")){x=x.replace(/\s{2,}/g," ").trim();if(!x)continue;
    const m=x.match(/^Sc\s?(\d+[A-Z]{0,3})\b\s*(.*)$/);
    if(m){cur={sc:m[1],parts:[]};items.push(cur);x=m[2];if(!x)continue}
    const k=x.match(/^(?:(SL)\s+)?(added|deleted|changed|clarified)\s*:\s*(.*)$/i);
    if(cur&&k)cur.parts.push({sl:!!k[1],k:k[2].toLowerCase(),t:k[3]});
    else if(cur&&cur.parts.length)cur.parts[cur.parts.length-1].t+=" "+x;
    else if(cur)cur.parts.push({k:"",t:x});
    else intro.push(x)}
  return (intro.length?'<p class="clogi">'+intro.map(esc).join("<br>")+'</p>':'')+'<ul class="clog">'+items.map(i=>'<li><button type="button" class="lnk clsc" data-scene="'+esc(i.sc)+'">Sc'+esc(i.sc)+'</button><span class="clp">'+
    i.parts.map(p=>'<span class="clr">'+(p.k?'<span class="clk '+CLOGK[p.k]+'">'+(p.sl?'SL ':'')+esc(L(CLOGDE[p.k]))+'</span> ':'')+esc(p.t)+'</span>').join("")+'</span></li>').join("")+'</ul>'}
function scriptChg(){const sx=S.meta&&S.meta.scriptChange,at=sx?Date.parse(sx.at):0;
  if(!sx||!at||!vok("script")||Date.now()-at>=3*864e5)return null;const seen=+(localStorage.getItem("chgseen:v1")||0);if(chgSeenGone(at,seen))return null;
  return {date:localISO(at),at,unread:at>seen,script:1,sx,txt:L("Neue Drehbuch-Version")+" "+(sx.v||"")+(sx.prev&&sx.prev!==sx.v?" ("+L("vorher")+" "+sx.prev+")":sx.prev===sx.v?" ("+L("überarbeitet")+")":"")}}
function scriptChgHTML(c){const sx=c.sx||{},sc=arr(sx.scenes);
  return '<button type="button" class="lnk tscr" data-tscript>'+esc(c.txt)+'</button>'+
    (sc.length?'<span class="tscrsc">'+esc(L(sc.length===1?"Szene":"Szenen"))+': '+sc.map(x=>'<button type="button" class="lnk" data-scene="'+esc(x)+'">'+esc(x)+'</button>').join(", ")+'</span>':'')+
    (sx.log?'<details class="tscrlog"><summary>'+esc(L("Ganzes Changelog"))+'</summary>'+clogHTML(sx.log)+'</details>':'')}
function todayDay(){const t=todayISO();const ds=(S.days||[]).filter(d=>d.date);return ds.find(d=>d.date===t)||ds.find(d=>d.date>t&&d.kind==="shoot")||ds.find(d=>d.date>t)||null}
VIEWS.today=function(){
  if(!S.loaded&&!(S.days||[]).length)return '<div class="empty">'+L("Daten werden geladen …")+'</div>';
  const d=todayDay(),t=todayISO();
  if(!d){const sc=tShow("chg")?scriptChg():null;
    return '<section class="today"><h2 class="pgt">'+L("Heute")+'</h2><p class="ghint">'+L("Keine kommenden Drehtage.")+'</p>'+
      (sc?'<div class="tcard tchg"><div class="tch">'+esc(L("Änderungen"))+(sc.unread?' <span class="chgdot">1 '+esc(L("neu"))+'</span>':'')+'</div>'+chgListHTML([sc])+''+
        (sc.unread?'<div class="tacts"><button type="button" class="pillbtn" data-chgseen>'+esc(L("Als gelesen markieren"))+'</button></div>':'')+'</div>':'')+'</section>'}
  const isToday=d.date===t,dt=new Date(d.date+"T12:00:00");
  /* only what the person may see: schedule parts need «Drehplan sehen», callsheet parts «Callsheet sehen» */
  const canPlan=vok("plan"),canDispo=vok("dispo");
  const dp=canDispo?((S.dispos||[]).find(x=>x&&x.date===d.date)||null):null;
  const card=(cls,title,body)=>body?'<div class="tcard '+cls+'"><div class="tch">'+title+'</div>'+body+'</div>':'';
  const thead='<div class="thead"><h2 class="pgt">'+esc(L(isToday?"Heute":d.kind==="shoot"?"Nächster Drehtag":"Nächster Tag"))+'</h2><span class="tdate">'+esc((d.short||d.label||"")+" · "+WDL(dt)+" "+ddmm(dt))+'</span></div>';
  let h='<section class="today">';
  let me=null;try{me=typeof myIdentity==="function"?myIdentity():null}catch(_){}
  /* my next events, right at the top (upcoming and up to 5 h back, as in «Meine Termine») */
  try{if(me&&vok("mycal")&&tShow("my")){const ev=myEvents(me).filter(x=>typeof evRecent!=="function"||evRecent(x)).slice(0,4);
    h+='<div class="tcard tmy"><div class="tch">'+esc(L("Meine nächsten Termine"))+'<button type="button" class="tmyall" data-tomy>'+esc(L("Alle"))+' ›</button></div>'+(ev.length?'<ul class="tmylist">'+ev.map(x=>'<li><span class="tmd">'+esc(x.date===t?L("heute"):dmy(x.date))+' <b>'+esc(x.t||"")+'</b></span><span class="tmw"><b>'+esc(x.n||"")+'</b>'+(x.where?' <small>· '+esc(String(x.where).split(",")[0])+'</small>':'')+(x.driver?' <small>· '+esc(L("Fahrer:in"))+': '+(typeof telLinks==="function"?telLinks(x.driver):esc(x.driver))+'</small>':'')+'</span></li>').join("")+'</ul>':'<p class="ghint">'+esc(L("Keine anstehenden Termine."))+'</p>')+'</div>'}}catch(_){}
  /* title of the (next) shooting day below my events */
  h+=thead;
  /* calls */
  let myCall="";try{if(me&&dp){const myDep=fold(me.src||"").split(/[\s/]/)[0];const c=myDep?arr(dp.calls).find(z=>fold(z.dept||"").includes(myDep)):null;if(c)myCall=hm(c.t)+" · "+c.dept}}catch(_){}
  const tiles=[],shT=tShow("time");
  if(shT&&myCall)tiles.push(['<b>'+esc(myCall.split(" · ")[0])+'</b>',L("Mein Call")+" · "+esc(myCall.split(" · ").slice(1).join(" · "))]);
  if(shT&&dp&&(dp.crewCall||dp.generalCall))tiles.push(['<b>'+esc(dp.crewCall||dp.generalCall)+'</b>',"Crew Call"]);
  if(shT&&dp&&dp.shootCall)tiles.push(['<b>'+esc(dp.shootCall)+'</b>',L("Drehbeginn")]);
  if(shT&&!dp&&d.hours&&canPlan)tiles.push(['<b>'+esc(d.hours)+'</b>',L("Drehzeit")]);
  if(shT&&dp&&dp.wrap)tiles.push(['<b>'+esc(dp.wrap)+'</b>',"Wrap"]);
  if(shT&&d.sr&&d.ss)tiles.push(['<b>'+esc(d.sr+"–"+d.ss)+'</b>',L("Sonnenzeit")]);
  /* weather: live forecast for the place of the first scene (tap → detailed report); the callsheet text is in the report */
  const wxt=canPlan&&tShow("wx")?wxTile(d):"";
  /* drive from the crew hotel (+3 min, over 20 min +15 %) and the weather come last */
  /* tap → route in Google Maps from the crew hotel to the first location */
  const drv=canPlan&&tShow("drive")&&d.drive&&d.drive.min?(()=>{const fi=arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc));let dest=d.drive.to||"";try{if(fi){const a=addrForItem(fi);if(a&&!/^tba$/i.test(a))dest=a}}catch(_){}
    const url="https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+encodeURIComponent(d.drive.from||"Hotel")+"&destination="+encodeURIComponent(dest);
    const here="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination="+encodeURIComponent(dest); /* no origin = current location */
    return '<button type="button" class="ttile tdrv" data-route="'+esc(JSON.stringify({h:url,c:here,from:d.drive.from||"Hotel",to:dest}))+'" title="'+esc(L("Route in Google Maps"))+'"><b>'+esc(driveMin(d.drive.min)+"′")+(d.drive.km?'<small class="tkm"> · '+Math.round(d.drive.km)+' km</small>':'')+'</b><span>'+esc(L("Anfahrt"))+' ›</span></button>'})():'';
  h+=(tiles.length||wxt||drv)?'<div class="ttiles">'+tiles.map(([v,k])=>'<div class="ttile">'+v+'<span>'+k+'</span></div>').join("")+drv+wxt+'</div>':'';
  if(!dp&&canDispo&&d.kind==="shoot")h+='<p class="ghint">'+esc(L("Callsheet folgt"))+'</p>';
  /* first location + drive */
  const first=canPlan&&tShow("loc")?arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc)):null;
  if(first){let ad="";try{ad=addrForItem(first)}catch(_){ad=first.loc}
    h+=card("tloc",esc(L("Erste Location")),'<div class="tbig">'+esc(first.set||first.loc)+'</div>'+(ad&&!/^tba$/i.test(ad)?'<button type="button" class="lnk tlocad" data-route="'+esc(JSON.stringify({h:"https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+encodeURIComponent((d.drive&&d.drive.from)||"Hotel")+"&destination="+encodeURIComponent(ad),c:"https://www.google.com/maps/dir/?api=1&travelmode=driving&destination="+encodeURIComponent(ad),from:(d.drive&&d.drive.from)||"Hotel",to:ad}))+'">'+esc(ad)+'</button>':''))}   /* tap: choose «Vom Hotel» / «Vom aktuellen Standort» */
  /* menu */
  if(tShow("menu"))try{const mn=window.menuFor?window.menuFor(d.date,"all"):"";if(mn)h+=card("tmenu",esc(L("Mittagessen")),mn)}catch(_){}
  /* scenes */
  const scs=[];if(canPlan)for(const [u,its] of unitItems(d))if(u==="1"||hasU(d,u))its.forEach(it=>{if(it.sc)scs.push([u,it])});
  if(scs.length&&tShow("scs"))h+=card("tscs",esc(L("Szenen"))+' <small>'+scs.length+'</small>','<ul class="tsclist">'+scs.map(([u,it])=>{const cg=window.chgFor(d.date,u,it.sc);
    /* one line per scene: time, scene, set and – as far as there is room – the description (cut with «…») */
    const set=String(it.set||"").replace(/^VALAIS\s*[–-]\s*/i,""),ds=String((LANG==="en"?it.d:(it["d_"+LANG]||it.d))||"").trim();
    return '<li'+(cg?' class="chg" title="'+esc(cg)+'"':'')+'><span class="tt">'+esc(it.t||"")+'</span><span class="tsc">'+esc(it.sc)+'</span><span class="tset" title="'+esc([set,ds].filter(Boolean).join(" – "))+'">'+(u!=="1"?'<span class="td-unit">'+esc(UNAME[u])+'</span> ':'')+esc(set)+(ds?'<span class="tds"> · '+esc(ds)+'</span>':'')+'</span></li>'}).join("")+'</ul><button type="button" class="pillbtn" data-goto="'+esc(d.id)+'">'+esc(L("Drehplan öffnen"))+'</button>'+(dp?' <button type="button" class="pillbtn" data-todispo="'+esc(d.date)+'">Callsheet</button>':''));
  /* my events */
  /* changes */
  const cl=canPlan?chgList():[];
  {const sc=scriptChg();if(sc){cl.push(sc);cl.sort((a,b)=>(b.at||0)-(a.at||0))}}
  if((canPlan||cl.length)&&tShow("chg"))h+='<div class="tcard tchg"><div class="tch">'+esc(L("Änderungen"))+(cl.some(c=>c.unread)?' <span class="chgdot">'+cl.filter(c=>c.unread).length+' '+esc(L("neu"))+'</span>':'')+'</div>'+
    (cl.length?chgListHTML(cl)+
      '<div class="tacts">'+(cl.some(c=>c.unread)?'<button type="button" class="pillbtn" data-chgseen>'+esc(L("Als gelesen markieren"))+'</button>':'')+(can("push.send")&&cl.some(c=>!c.script)?'<button type="button" class="pillbtn" data-chgpush>'+esc(L("Als Push-Nachricht senden"))+'</button>':'')+'</div>'
      :'<p class="ghint">'+esc(L("Seit deinem letzten Besuch hat sich am Drehplan nichts geändert."))+'</p>')+'</div>';
  /* offline */
  const st=offState(),on=navigator.onLine!==false;
  if((vok("blocking")||vok("plan"))&&tShow("off"))h+='<div class="tcard toff"><div class="tch">'+esc(L("Offline am Set"))+(on?'':' <span class="chgdot">'+esc(L("offline"))+'</span>')+'</div>'+
    (st&&st.v===2?'<p class="tsub">✓ '+esc(L("Gespeichert"))+': '+st.n+' '+esc(L("Seiten"))+' ('+esc(L("Blocking-PDFs und Floorplans, alle Drehtage"))+') · '+esc(L("Stand"))+' '+esc(fmtT(st.at))+'</p>':'')+
    '<p class="ghint">'+esc(L("Drehplan, Callsheet, Kontakte, Drehbuch, Blocking-PDFs und Floorplans werden für alle Drehtage automatisch auf diesem Gerät gespeichert – Fotos nicht."))+'</p>'+
    (on?'<button type="button" class="pillbtn" data-offprep'+(OFF.busy?' disabled':'')+'>'+esc(L(OFF.busy?"Wird geladen …":"Jetzt für offline laden"))+'</button>':'')+'</div>';
  return h+'</section>';
};

/* the app opens on «Today» (unless a link asks for another page) */

document.addEventListener("click",e=>{if(!e.target.closest("[data-tscript]")||!vok("script"))return;S.tab="script";try{store("tab","script")}catch(_){}window.scrollTo(0,0);render()});
