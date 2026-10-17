/* ---------- 1) «Heute»: everything for today (or the next working day) on one page ---------- */
/* «Today» on/off per person (profile, synced with the view settings) */
function todayOn(){try{return localStorage.getItem("today")!=="0"}catch(_){return true}}
window.todayOn=todayOn;
document.addEventListener("change",e=>{const c=e.target.closest("[data-todayon]");if(!c)return;store("today",c.checked?"1":"0");if(!c.checked&&S.tab==="today")S.tab="plan";render()});
function todayDay(){const t=todayISO();const ds=(S.days||[]).filter(d=>d.date);return ds.find(d=>d.date===t)||ds.find(d=>d.date>t&&d.kind==="shoot")||ds.find(d=>d.date>t)||null}
VIEWS.today=function(){
  if(!S.loaded&&!(S.days||[]).length)return '<div class="empty">'+L("Daten werden geladen …")+'</div>';
  const d=todayDay(),t=todayISO();
  if(!d)return '<section class="today"><h2 class="pgt">'+L("Heute")+'</h2><p class="ghint">'+L("Keine kommenden Drehtage.")+'</p></section>';
  const isToday=d.date===t,dt=new Date(d.date+"T12:00:00");
  /* only what the person may see: schedule parts need «Drehplan sehen», callsheet parts «Callsheet sehen» */
  const canPlan=vok("plan"),canDispo=vok("dispo");
  const dp=canDispo?((S.dispos||[]).find(x=>x&&x.date===d.date)||null):null;
  const card=(cls,title,body)=>body?'<div class="tcard '+cls+'"><div class="tch">'+title+'</div>'+body+'</div>':'';
  const thead='<div class="thead"><h2 class="pgt">'+esc(L(isToday?"Heute":d.kind==="shoot"?"Nächster Drehtag":"Nächster Tag"))+'</h2><span class="tdate">'+esc((d.short||d.label||"")+" · "+WDL(dt)+" "+pad2x(dt.getDate())+"."+pad2x(dt.getMonth()+1)+".")+'</span></div>';
  let h='<section class="today">';
  let me=null;try{me=typeof myIdentity==="function"?myIdentity():null}catch(_){}
  /* my next events, right at the top (upcoming and up to 5 h back, as in «Meine Termine») */
  try{if(me&&vok("mycal")){const ev=myEvents(me).filter(x=>typeof evRecent!=="function"||evRecent(x)).slice(0,4);
    h+='<div class="tcard tmy"><div class="tch">'+esc(L("Meine nächsten Termine"))+'<button type="button" class="tmyall" data-tomy>'+esc(L("Alle"))+' ›</button></div>'+(ev.length?'<ul class="tmylist">'+ev.map(x=>'<li><span class="tmd">'+esc(x.date===t?L("heute"):dmy(x.date))+' <b>'+esc(x.t||"")+'</b></span><span class="tmw"><b>'+esc(x.n||"")+'</b>'+(x.where?' <small>· '+esc(String(x.where).split(",")[0])+'</small>':'')+(x.driver?' <small>· '+esc(L("Fahrer:in"))+': '+(typeof telLinks==="function"?telLinks(x.driver):esc(x.driver))+'</small>':'')+'</span></li>').join("")+'</ul>':'<p class="ghint">'+esc(L("Keine anstehenden Termine."))+'</p>')+'</div>'}}catch(_){}
  /* title of the (next) shooting day below my events */
  h+=thead;
  /* calls */
  let myCall="";try{if(me&&dp){const myDep=fold(me.src||"").split(/[\s/]/)[0];const c=myDep?arr(dp.calls).find(z=>fold(z.dept||"").includes(myDep)):null;if(c)myCall=hm(c.t)+" · "+c.dept}}catch(_){}
  const tiles=[];
  if(myCall)tiles.push(['<b>'+esc(myCall.split(" · ")[0])+'</b>',L("Mein Call")+" · "+esc(myCall.split(" · ").slice(1).join(" · "))]);
  if(dp&&(dp.crewCall||dp.generalCall))tiles.push(['<b>'+esc(dp.crewCall||dp.generalCall)+'</b>',"Crew Call"]);
  if(dp&&dp.shootCall)tiles.push(['<b>'+esc(dp.shootCall)+'</b>',L("Drehbeginn")]);
  if(!dp&&d.hours&&canPlan)tiles.push(['<b>'+esc(d.hours)+'</b>',L("Drehzeit")]);
  if(dp&&dp.wrap)tiles.push(['<b>'+esc(dp.wrap)+'</b>',"Wrap"]);
  if(d.sr&&d.ss)tiles.push(['<b>'+esc(d.sr+"–"+d.ss)+'</b>',L("Sonnenzeit")]);
  /* weather: live forecast for the place of the first scene (tap → detailed report); the callsheet text is in the report */
  const wxt=canPlan?wxTile(d):"";
  /* drive from the crew hotel (+3 min, over 20 min +15 %) and the weather come last */
  /* tap → route in Google Maps from the crew hotel to the first location */
  const drv=canPlan&&d.drive&&d.drive.min?(()=>{const fi=arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc));let dest=d.drive.to||"";try{if(fi){const a=addrForItem(fi);if(a&&!/^tba$/i.test(a))dest=a}}catch(_){}
    const url="https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+encodeURIComponent(d.drive.from||"Hotel")+"&destination="+encodeURIComponent(dest);
    const here="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination="+encodeURIComponent(dest); /* no origin = current location */
    return '<button type="button" class="ttile tdrv" data-route="'+esc(JSON.stringify({h:url,c:here,from:d.drive.from||"Hotel",to:dest}))+'" title="'+esc(L("Route in Google Maps"))+'"><b>'+esc(driveMin(d.drive.min)+"′")+(d.drive.km?'<small class="tkm"> · '+Math.round(d.drive.km)+' km</small>':'')+'</b><span>'+esc(L("Anfahrt"))+' ›</span></button>'})():'';
  h+=(tiles.length||wxt||drv)?'<div class="ttiles">'+tiles.map(([v,k])=>'<div class="ttile">'+v+'<span>'+k+'</span></div>').join("")+drv+wxt+'</div>':'';
  if(!dp&&canDispo&&d.kind==="shoot")h+='<p class="ghint">'+esc(L("Callsheet folgt"))+'</p>';
  /* first location + drive */
  const first=canPlan?arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc)):null;
  if(first){let ad="";try{ad=addrForItem(first)}catch(_){ad=first.loc}
    h+=card("tloc",esc(L("Erste Location")),'<div class="tbig">'+esc(first.set||first.loc)+'</div>'+(ad&&!/^tba$/i.test(ad)?'<a href="'+maps(ad)+'" target="_blank" rel="noopener noreferrer">'+esc(ad)+'</a>':''))}
  /* menu */
  try{const mn=window.menuFor?window.menuFor(d.date,"all"):"";if(mn)h+=card("tmenu",esc(L("Mittagessen")),mn)}catch(_){}
  /* scenes */
  const scs=[];if(canPlan)for(const [u,its] of unitItems(d))if(u==="1"||hasU(d,u))its.forEach(it=>{if(it.sc)scs.push([u,it])});
  if(scs.length)h+=card("tscs",esc(L("Szenen"))+' <small>'+scs.length+'</small>','<ul class="tsclist">'+scs.map(([u,it])=>{const cg=window.chgFor(d.date,u,it.sc);
    /* one line per scene: time, scene, set and – as far as there is room – the description (cut with «…») */
    const set=String(it.set||"").replace(/^VALAIS\s*[–-]\s*/i,""),ds=String((LANG==="en"?it.d:(it["d_"+LANG]||it.d))||"").trim();
    return '<li'+(cg?' class="chg" title="'+esc(cg)+'"':'')+'><span class="tt">'+esc(it.t||"")+'</span><span class="tsc">'+esc(it.sc)+'</span><span class="tset" title="'+esc([set,ds].filter(Boolean).join(" – "))+'">'+(u!=="1"?'<span class="td-unit">'+esc(UNAME[u])+'</span> ':'')+esc(set)+(ds?'<span class="tds"> · '+esc(ds)+'</span>':'')+'</span></li>'}).join("")+'</ul><button type="button" class="pillbtn" data-goto="'+esc(d.id)+'">'+esc(L("Drehplan öffnen"))+'</button>'+(dp?' <button type="button" class="pillbtn" data-todispo="'+esc(d.date)+'">Callsheet</button>':''));
  /* my events */
  /* changes */
  const cl=canPlan?chgList():[];
  if(canPlan)h+='<div class="tcard tchg"><div class="tch">'+esc(L("Änderungen"))+(cl.some(c=>c.unread)?' <span class="chgdot">'+cl.filter(c=>c.unread).length+' '+esc(L("neu"))+'</span>':'')+'</div>'+
    (cl.length?'<ul class="chglist">'+cl.map(c=>'<li'+(c.unread?' class="unread"':'')+'><span class="cd">'+esc(dmy(c.date))+'</span><span class="cw">'+(c.sc?'<b>'+esc(L("Szene"))+' '+esc(c.sc)+'</b>'+(c.u&&c.u!=="1"?' <span class="td-unit">'+esc(UNAME[c.u])+'</span>':'')+' · ':'')+esc(c.txt)+'</span></li>').join("")+'</ul>'+
      '<div class="tacts">'+(cl.some(c=>c.unread)?'<button type="button" class="pillbtn" data-chgseen>'+esc(L("Als gelesen markieren"))+'</button>':'')+(can("push.send")?'<button type="button" class="pillbtn" data-chgpush>'+esc(L("Als Push-Nachricht senden"))+'</button>':'')+'</div>'
      :'<p class="ghint">'+esc(L("Seit deinem letzten Besuch hat sich am Drehplan nichts geändert."))+'</p>')+'</div>';
  /* offline */
  const st=offState(),on=navigator.onLine!==false;
  if(vok("blocking")||vok("plan"))h+='<div class="tcard toff"><div class="tch">'+esc(L("Offline am Set"))+(on?'':' <span class="chgdot">'+esc(L("offline"))+'</span>')+'</div>'+
    (st&&st.v===2?'<p class="tsub">✓ '+esc(L("Gespeichert"))+': '+st.n+' '+esc(L("Seiten"))+' ('+esc(L("Blocking-PDFs und Floorplans, alle Drehtage"))+') · '+esc(L("Stand"))+' '+esc(new Date(st.at).toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"}))+'</p>':'')+
    '<p class="ghint">'+esc(L("Drehplan, Callsheet, Kontakte, Drehbuch, Blocking-PDFs und Floorplans werden für alle Drehtage automatisch auf diesem Gerät gespeichert – Fotos nicht."))+'</p>'+
    (on?'<button type="button" class="pillbtn" data-offprep'+(OFF.busy?' disabled':'')+'>'+esc(L(OFF.busy?"Wird geladen …":"Jetzt für offline laden"))+'</button>':'')+'</div>';
  return h+'</section>';
};

/* the app opens on «Today» (unless a link asks for another page) */
/* the app opens on «Today» when it was not used for at least 2 hours (on start and when it comes back to the front) */
const TODAY_AFTER=2*3600e3;
const lastActive=()=>{try{return +(localStorage.getItem("lastActive")||0)}catch(_){return 0}};
const markActive=()=>{try{localStorage.setItem("lastActive",String(Date.now()))}catch(_){}};
if(!location.hash&&!window.__todayStart&&todayOn()){window.__todayStart=true;const la=lastActive();if(!la||Date.now()-la>=TODAY_AFTER){S.tab="today";try{render()}catch(_){}}}
markActive();setInterval(()=>{if(document.visibilityState==="visible")markActive()},60e3);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){const la=lastActive();if(la&&Date.now()-la>=TODAY_AFTER&&todayOn()&&S.tab!=="today"){S.tab="today";scrollTo(0,0);render()}markActive()}else markActive()});
