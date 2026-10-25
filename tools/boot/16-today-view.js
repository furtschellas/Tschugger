import {ddmm,driveMin,esc,isoAdd,L,LANG,localISO,mapsDir,pad2,S,todayISO,TX} from "../base/10-core.js";
import {UNAME,hasU,zurichUTC} from "../base/11-schedule-prep.js";
import {WDL,evRecent,hm,myEvents,myIdentity,telLinks} from "../base/12-mycal.js";
import {addrForItem} from "../base/13-crew-views.js";
import {csMe} from "../base/13a-callsheet.js";
import {csHM,csNowBits,csNowScene} from "../base/13b-cs-now.js";
import {csMine,csTilesHTML} from "../base/13d-cs-mine.js";
import {VIEWS,tabsOn,vok} from "../base/14-render.js";
import {fold,render} from "../base/15-script-tab.js";
import {store} from "../base/16-interaction.js";
import {arr} from "../base/20-data-start.js";
import {fmtT} from "./01-config.js";
import {ME} from "./03-core-firebase.js";
import {savePrefsSoon} from "./06-prefs-docs.js";
import {OFF,chgList,chgSeen,chgSeenGone,dmy,offState,unitItems} from "./14-today-changes-offline.js";
import {wxTile} from "./15-weather.js";
import {scAckId} from "./27-scene-ack.js";
/* ---------- 1) «Heute»: everything for today (or the next working day) on one page ---------- */
/* «Today» on/off per person (profile, synced with the view settings) */
export function todayOn(){try{const v=localStorage.getItem("today")||"";return !(v==="0"||v.startsWith("0|"))}catch(_){return true}}
window.todayOn=todayOn;   /* the tab bar (base/14-render) asks through window: «Today» switched off in the profile */
/* which parts Today shows (profile → App): stored with the on/off value, «1|menu,off» = on, without lunch and offline */
const TODAY_PARTS=[["now","Jetzt gedreht",()=>true],["my","Meine nächsten Termine",()=>vok("mycal")],["mine","Mein Drehtag",()=>true],["time","Zeiten",()=>true],["drive","Anfahrt",()=>vok("plan")],["wx","Wetter",()=>vok("plan")],
  ["loc","Erste Location",()=>vok("plan")],["menu","Mittagessen",()=>true],["scs","Szenen",()=>vok("plan")],["chg","Änderungen",()=>vok("plan")||vok("script")],["off","Offline am Set",()=>vok("blocking")||vok("plan")]];
/* the person's choice, stored with the on/off value: «menu» = switched off, «+wx» = switched on although the App-Verwaltung offers it «aus» */
function todayPrefs(){let v="";try{v=localStorage.getItem("today")||""}catch(_){}const i=v.indexOf("|");return new Set(i<0?[]:v.slice(i+1).split(",").filter(Boolean))}
export function todayHidden(){return new Set([...todayPrefs()].filter(k=>k[0]!=="+"))}
/* App-Verwaltung → Einstellungen → Today: per part «on» (default), «off» (offered, off until the person switches it on) or «no» (not offered) */
export const todayCfg=k=>{const c=window.TODAYCFG;const v=c&&typeof c==="object"?c[k]:"";return v==="off"||v==="no"?v:"on"};
window.TODAY_PART_LIST=()=>TODAY_PARTS.map(([k,t])=>[k,t]);   /* the App-Verwaltung (admin.js) lists them */
export const tShow=k=>{const c=todayCfg(k);if(c==="no")return false;const p=todayPrefs();return !p.has(k)&&(c!=="off"||p.has("+"+k))};
window.todayPartsHTML=function(){if(!todayOn())return "";const ps=TODAY_PARTS.filter(x=>x[2]()&&todayCfg(x[0])!=="no");
  return '<p class="ahint"><b>'+esc(L("Was zeigt «Today»?"))+'</b></p>'+ps.map(([k,t])=>'<label class="ck"><input type="checkbox" data-todaypart="'+k+'"'+(tShow(k)?' checked':'')+'> '+esc(L(t))+'</label>').join("")};
document.addEventListener("change",e=>{const c=e.target.closest("[data-todayon]");if(!c)return;const hid=[...todayPrefs()];store("today",(c.checked?"1":"0")+(hid.length?"|"+hid.join(","):""));if(!c.checked&&S.tab==="today")S.tab="plan";render()});
document.addEventListener("change",e=>{const c=e.target.closest("[data-todaypart]");if(!c)return;const hid=todayPrefs(),k=c.dataset.todaypart;
  if(c.checked){hid.delete(k);if(todayCfg(k)==="off")hid.add("+"+k)}else{hid.add(k);hid.delete("+"+k)}
  store("today","1"+(hid.size?"|"+[...hid].join(","):""));if(typeof savePrefsSoon==="function")savePrefsSoon()});
/* a new script version (from the Dropbox update): shown for 3 days like the schedule changes, with the scenes from the changelog
   and the whole changelog to open */
/* the changes grouped by day: the date as a line of its own, the changes below it over the whole width */
function chgListHTML(cl){let last="";
  return '<ul class="chglist">'+cl.map(c=>{const dh=c.date!==last?'<li class="cdh"><span class="cd">'+esc(dmy(c.date))+'</span></li>':'';last=c.date;
    return dh+'<li class="chgi'+(c.unread?' unread':'')+'"><span class="cw">'+(c.sc?'<b>'+esc(L("Szene"))+' '+esc(c.sc)+'</b>'+(c.u&&c.u!=="1"?' <span class="td-unit">'+esc(UNAME[c.u])+'</span>':'')+' · ':'')+(c.script?scriptChgHTML(c):esc(c.txt))+'</span></li>'}).join("")+'</ul>'}
/* changes split by unit: 1st Unit (and script) open, 2nd/3rd Unit closed – each can be opened and closed (kept while the app is open) */
const CHGOPEN={"1":true};
function chgUnitsHTML(cl){const g={};cl.forEach(c=>{const u=c.script||!c.u?"1":String(c.u);(g[u]=g[u]||[]).push(c)});
  return Object.keys(g).sort().map(u=>{const l=g[u],nu=l.filter(c=>c.unread).length;
    return '<details class="chgu" data-chgu="'+u+'"'+(CHGOPEN[u]?' open':'')+'><summary><span class="chgun">'+esc((UNAME&&UNAME[u]?UNAME[u]:u)+" Unit")+'</span> <span class="chgn">'+l.length+'</span>'+(nu?' <span class="chgdot">'+nu+' '+esc(L("neu"))+'</span>':'')+'</summary>'+chgListHTML(l)+'</details>'}).join("")}
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.matches&&d.matches("details[data-chgu]"))CHGOPEN[d.dataset.chgu]=d.open},true);
/* changelog text → one line per scene, with «added / deleted / changed / clarified» marked (lines broken by the PDF are joined again) */
const CLOGK={added:"add",deleted:"del",changed:"chg",clarified:"clr"},CLOGDE={added:"neu hinzugefügt",deleted:"gestrichen",changed:"geändert",clarified:"präzisiert"};
export function clogHTML(t){const intro=[],items=[];let cur=null;
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
export function scriptChg(){const sx=S.meta&&S.meta.scriptChange,at=sx?Date.parse(sx.at):0;
  if(!sx||!at||!vok("script")||Date.now()-at>=3*864e5)return null;const seen=chgSeen();if(chgSeenGone(at,seen))return null;
  return {date:localISO(at),at,unread:at>seen,script:1,sx,txt:L("Neue Drehbuch-Version")+" "+(sx.v||"")+(sx.prev&&sx.prev!==sx.v?" ("+L("vorher")+" "+sx.prev+")":sx.prev===sx.v?" ("+L("überarbeitet")+")":"")}}
function scriptChgHTML(c){const sx=c.sx||{},sc=arr(sx.scenes);
  return '<button type="button" class="lnk tscr" data-tscript>'+esc(c.txt)+'</button>'+
    (sc.length?'<span class="tscrsc">'+esc(L(sc.length===1?"Szene":"Szenen"))+': '+sc.map(x=>'<button type="button" class="lnk" data-scene="'+esc(x)+'">'+esc(x)+'</button>').join(", ")+'</span>':'')+
    (sx.log?'<details class="tscrlog"><summary>'+esc(L("Ganzes Changelog"))+'</summary>'+clogHTML(sx.log)+'</details>':'')}
/* the shooting day shown in «Today»: today when shooting, else the next shooting day (a travel or free day today is shown above it) */
/* start / end of a shooting day as time stamps («08:00–20:00», also over midnight «17:00–03:00») */
function dayTimes(d){const m=String(d&&d.hours||"").match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);if(!m)return null;
  /* in Zurich time (not the time zone of the phone), over midnight on the next calendar day (also over the change of time) */
  const hh=(h,mi)=>pad2(+h)+":"+mi,st=zurichUTC(d.date,hh(m[1],m[2])).getTime();let en=zurichUTC(d.date,hh(m[3],m[4])).getTime();if(en<=st)en=zurichUTC(isoAdd(d.date,1),hh(m[3],m[4])).getTime();return {st,en}}
/* lunch of the day (row «Lunch …»), else the middle of the shooting day – from then on the tile shows the drive back */
function lunchAt(d){const dt=dayTimes(d);const it=arr(d.items).concat(arr((d.unit2||{}).items)).find(i=>!i.sc&&/\b(lunch|mittag)/i.test(String(i.n||""))&&/^\d{1,2}:\d{2}/.test(String(i.t||"")));
  if(it){const [h,mi]=String(it.t).split(":"),t=pad2(+h)+":"+mi.slice(0,2);let x=zurichUTC(d.date,t).getTime();if(dt&&x<dt.st)x=zurichUTC(isoAdd(d.date,1),t).getTime();return x}return dt?dt.st+(dt.en-dt.st)/2:null}
/* the shooting day shown in «Today»: the running one until 1 h after wrap (also over midnight), else the next shooting day;
   on a free or travel day always the next shooting day (with a short note about today above it) */
function todayDay(){const t=todayISO(),now=Date.now();const ds=(S.days||[]).filter(d=>d.date);
  const run=ds.find(d=>d.kind==="shoot"&&d.date<=t&&(()=>{const x=dayTimes(d);return x&&now<x.en+3600e3&&(d.date===t||now<x.en+3600e3&&x.en>zurichUTC(t,"00:00").getTime())})());
  if(run)return run;
  const td=ds.find(d=>d.date===t);
  return ds.find(d=>d.kind==="shoot"&&(d.date>t||(d.date===t&&!(dayTimes(d)&&now>=dayTimes(d).en+3600e3))))||td||ds.find(d=>d.date>t)||null}
VIEWS.today=function(){
  if(!S.loaded&&!(S.days||[]).length)return '<div class="empty">'+L("Daten werden geladen …")+'</div>';
  const d=todayDay(),t=todayISO();
  if(!d){const sc=tShow("chg")?scriptChg():null;
    return '<section class="today"><h2 class="pgt">'+L("Heute")+'</h2><p class="ghint">'+L("Keine kommenden Drehtage.")+'</p>'+
      (sc?'<div class="tcard tchg"><div class="tch">'+esc(L("Änderungen"))+(sc.unread?' <span class="chgdot">1 '+esc(L("neu"))+'</span>':'')+'</div>'+chgListHTML([sc])+''+
        (sc.unread?'<div class="tacts"><button type="button" class="pillbtn" data-chgseen>'+esc(L("Als gelesen markieren"))+'</button></div>':'')+'</div>':'')+'</section>'}
  /* after midnight of a night shoot the shooting day is still «today» (until its wrap) – also for «Jetzt» */
  const sd=typeof csShootDay==="function"?csShootDay():t,isToday=d.date===t||d.date===sd,dt=new Date(d.date+"T12:00:00");
  /* only what the person may see: schedule parts need «Drehplan sehen», callsheet parts «Callsheet sehen» */
  const canPlan=vok("plan"),canDispo=vok("dispo");
  const dp=canDispo?((S.dispos||[]).find(x=>x&&x.date===d.date)||null):null;
  const card=(cls,title,body)=>body?'<div class="tcard '+cls+'"><div class="tch">'+title+'</div>'+body+'</div>':'';
  const thead='<div class="thead"><h2 class="pgt">'+esc(L(isToday?"Heute":d.kind==="shoot"?"Nächster Drehtag":"Nächster Tag"))+'</h2><span class="tdate">'+esc((d.short||d.label||"")+" · "+WDL(dt)+" "+ddmm(dt))+'</span></div>';
  let h='<section class="today">';
  let me=null;try{me=typeof myIdentity==="function"?myIdentity():null}catch(_){}
  /* for everybody, first of all and only while shooting: the scene being shot now (quittiert in the Drehplan, else by the callsheet times), with its place and how long it runs */
  if(isToday&&tShow("now"))h+=nowCardHTML(d.date);
  /* my next events, right at the top (upcoming and up to 5 h back, as in «Meine Termine») */
  try{if(me&&vok("mycal")&&tShow("my")){const ev=myEvents(me).filter(x=>typeof evRecent!=="function"||evRecent(x)).slice(0,4);
    h+='<div class="tcard tmy"><div class="tch">'+esc(L("Meine nächsten Termine"))+'<button type="button" class="tmyall" data-tomy>'+esc(L("Alle"))+' ›</button></div>'+(ev.length?'<ul class="tmylist">'+ev.map(x=>'<li><span class="tmd">'+esc(x.date===t?L("heute"):dmy(x.date))+' <b>'+esc(x.t||"")+'</b></span><span class="tmw"><b>'+esc(x.n||"")+'</b>'+(x.where?' <small>· '+esc(String(x.where).split(",")[0])+'</small>':'')+(x.driver?' <small>· '+esc(L("Fahrer:in"))+': '+(typeof telLinks==="function"?telLinks(x.driver):esc(x.driver))+'</small>':'')+'</span></li>').join("")+'</ul>':'<p class="ghint">'+esc(L("Keine anstehenden Termine."))+'</p>')+'</div>'}}catch(_){}
  /* today a travel or free day: short note above the next shooting day */
  {const td=d.date!==t?(S.days||[]).find(x=>x.date===t&&x.kind!=="shoot"):null;
    if(td)h+='<div class="tcard tinfo"><div class="tch">'+esc(L("Heute"))+' · '+esc(L(td.label||""))+'</div>'+(TX(td,"info")?'<p class="tsub">'+esc(TX(td,"info"))+'</p>':'')+'</div>'}
  /* title of the (next) shooting day below my events */
  h+=thead;
  /* calls */
  let myCall="";try{if(me&&dp){const myDep=fold(me.src||"").split(/[\s/]/)[0];const c=myDep?arr(dp.calls).find(z=>fold(z.dept||"").split(/[^a-z0-9]+/).includes(myDep)):null;if(c)myCall=hm(c.t)+" · "+c.dept}}catch(_){}
  const tiles=[],shT=tShow("time");
  if(shT&&myCall)tiles.push(['<b>'+esc(myCall.split(" · ")[0])+'</b>',L("Mein Call")+" · "+esc(myCall.split(" · ").slice(1).join(" · "))]);
  if(shT&&dp&&(dp.crewCall||dp.generalCall))tiles.push(['<b>'+esc(dp.crewCall||dp.generalCall)+'</b>',"Crew Call","big"]);
  if(shT&&dp&&dp.shootCall)tiles.push(['<b>'+esc(dp.shootCall)+'</b>',L("Drehbeginn")]);
  /* shooting time always (also with a callsheet); with a 2nd unit that day its time as a tile of its own */
  const u2h=d.unit2&&typeof d.unit2==="object"&&d.unit2.hours?String(d.unit2.hours):"";
  if(shT&&d.hours&&canPlan)tiles.push(['<b>'+esc(d.hours)+'</b>',L("Drehzeit")+(u2h?" · 1st Unit":"")]);
  if(shT&&u2h&&canPlan)tiles.push(['<b>'+esc(u2h)+'</b>',L("Drehzeit")+" · 2nd Unit"]);
  if(shT&&dp&&dp.wrap)tiles.push(['<b>'+esc(dp.wrap)+'</b>',"Wrap"]);
  if(shT&&d.sr&&d.ss)tiles.push(['<b>'+esc(d.sr+"–"+d.ss)+'</b>',L("Sonnenzeit")]);
  /* weather: live forecast for the place of the first scene (tap → detailed report); the callsheet text is in the report */
  const wxt=canPlan&&tShow("wx")?wxTile(d):"";
  /* drive from the crew hotel (+3 min, over 20 min +15 %) and the weather come last */
  /* tap → route in Google Maps from the crew hotel to the first location */
  const drv=canPlan&&tShow("drive")&&d.drive&&d.drive.min?(()=>{const fi=arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc));let dest=d.drive.to||"";try{if(fi){const a=addrForItem(fi);if(a&&!/^tba$/i.test(a))dest=a}}catch(_){}
    /* from lunch on (on the shooting day itself): the drive back to the hotel */
    const hotel=d.drive.from||"Hotel",la=lunchAt(d),back=la&&Date.now()>=la&&Date.now()<((dayTimes(d)||{}).en||0)+3600e3;
    const gm=mapsDir;
    const r=back?{h:gm(dest,hotel),c:gm("",hotel),from:dest,to:hotel,back:1}:{h:gm(hotel,dest),c:gm("",dest),from:hotel,to:dest};   /* no origin = current location */
    return '<button type="button" class="ttile tdrv" data-route="'+esc(JSON.stringify(r))+'" title="'+esc(L("Route in Google Maps"))+'"><b>'+esc(driveMin(d.drive.min)+"′")+(d.drive.km?'<small class="tkm"> · '+Math.round(d.drive.km)+' km</small>':'')+'</b><span>'+esc(L(back?"Rückfahrt":"Anfahrt"))+' ›</span></button>'})():'';
  /* my day from the callsheet (call, ride, my department) right below the tiles */
  /* «my day» from the callsheet: always (my own call, rides and department), also without the callsheet page; the link to it only with access */
  let mineCard="";try{const dpm=(S.dispos||[]).find(x=>x&&x.date===d.date);if(tShow("mine")&&dpm&&dpm.cs&&typeof csMine==="function"){const me2=csMe();const mn=csMine(dpm.cs,me2);const toCs=canDispo&&typeof tabsOn==="function"&&tabsOn().includes("dispo");
    if(mn.length)mineCard='<div class="tcard tmine"><div class="tch">'+esc(L("Mein"))+' '+esc(dpm.label||d.label||L("Drehtag"))+' <span class="beta">BETA</span>'+(toCs?'<button type="button" class="tmyall" data-tocs="'+esc(d.date)+'">'+esc(L("Alle"))+' ›</button>':'')+'</div>'+mn.join("")+'</div>'}}catch(_){}
  /* a day with a callsheet: the same tiles as in the callsheet (Crew Call … Wrap, sun, weather, drive) */
  const dcs=(S.dispos||[]).find(x=>x&&x.date===d.date&&x.cs);
  if(dcs&&shT&&typeof csTilesHTML==="function"){let me3=null;try{me3=csMe()}catch(_){}h+='<div class="tcs">'+csTilesHTML(dcs,d,dcs.cs,me3).replace(' id="cs-zeiten"','')+'</div>'}
  else h+=(tiles.length||wxt||drv)?'<div class="ttiles">'+tiles.map(([v,k,cl])=>'<div class="ttile'+(cl?' '+cl:'')+'">'+v+'<span>'+k+'</span></div>').join("")+drv+wxt+'</div>':'';h+=mineCard;
  /* from noon (or lunch, if earlier) on: the tiles of the next shooting day (times, drive, weather) – shown below the scenes */
  let nextH="";
  try{const la=d.kind==="shoot"&&lunchAt(d),noon=zurichUTC(d.date,"12:00").getTime(),from=la?Math.min(la,noon):noon;if(canPlan&&d.kind==="shoot"&&Date.now()>=from){const nd=(S.days||[]).find(x=>x.kind==="shoot"&&x.date>d.date);
    if(nd){const ndt=new Date(nd.date+"T12:00:00"),nt=[];
      const nu2=nd.unit2&&typeof nd.unit2==="object"&&nd.unit2.hours?String(nd.unit2.hours):"";
      if(nd.hours)nt.push(['<b>'+esc(nd.hours)+'</b>',L("Drehzeit")+(nu2?" · 1st Unit":"")]);if(nu2)nt.push(['<b>'+esc(nu2)+'</b>',L("Drehzeit")+" · 2nd Unit"]);if(nd.sr&&nd.ss)nt.push(['<b>'+esc(nd.sr+"–"+nd.ss)+'</b>',L("Sonnenzeit")]);
      let ndrv="";if(nd.drive&&nd.drive.min){const fi=arr(nd.items).find(i=>i.loc&&!/^tba/i.test(i.loc));let dest=nd.drive.to||"";try{if(fi){const a=addrForItem(fi);if(a&&!/^tba$/i.test(a))dest=a}}catch(_){}
        const gm=mapsDir,hotel=nd.drive.from||"Hotel";
        ndrv='<button type="button" class="ttile tdrv" data-route="'+esc(JSON.stringify({h:gm(hotel,dest),c:gm("",dest),from:hotel,to:dest}))+'" title="'+esc(L("Route in Google Maps"))+'"><b>'+esc(driveMin(nd.drive.min)+"′")+(nd.drive.km?'<small class="tkm"> · '+Math.round(nd.drive.km)+' km</small>':'')+'</b><span>'+esc(L("Anfahrt"))+' ›</span></button>'}
      const nwx=tShow("wx")?wxTile(nd):"";
      if(nt.length||ndrv||nwx)nextH+='<div class="thead tnext"><h3 class="pgt">'+esc(L("Nächster Drehtag"))+'</h3><span class="tdate">'+esc((nd.short||nd.label||"")+" · "+WDL(ndt)+" "+ddmm(ndt))+'</span></div><div class="ttiles">'+nt.map(([v,k])=>'<div class="ttile">'+v+'<span>'+k+'</span></div>').join("")+ndrv+nwx+'</div>'}}}catch(_){}
  if(!dp&&canDispo&&d.kind==="shoot")h+='<p class="ghint">'+esc(L("Callsheet folgt"))+'</p>';
  /* first location + drive */
  const first=canPlan&&tShow("loc")?arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc)):null;
  if(first){let ad="";try{ad=addrForItem(first)}catch(_){ad=first.loc}
    h+=card("tloc",esc(L("Erste Location")),'<div class="tbig">'+esc(first.set||first.loc)+'</div>'+(ad&&!/^tba$/i.test(ad)?'<button type="button" class="lnk tlocad" data-route="'+esc(JSON.stringify({h:mapsDir((d.drive&&d.drive.from)||"Hotel",ad),c:mapsDir("",ad),from:(d.drive&&d.drive.from)||"Hotel",to:ad}))+'">'+esc(ad)+'</button>':''))}   /* tap: choose «Vom Hotel» / «Vom aktuellen Standort» */
  /* menu */
  if(tShow("menu"))try{const mn=window.menuFor?window.menuFor(d.date,"all"):"";if(mn)h+=card("tmenu",esc(L("Mittagessen")),mn)}catch(_){}
  /* scenes */
  /* scenes of the day; in the 2nd/3rd unit a scene that follows itself (same number, several set-ups) is listed once */
  const scs=[];if(canPlan)for(const [u,its] of unitItems(d))if(u==="1"||hasU(d,u)){let prev="";its.forEach(it=>{if(!it.sc){return}const k=String(it.sc).replace(/\s+/g,"").toLowerCase();if(u!=="1"&&k===prev)return;prev=k;scs.push([u,it])})}
  if(scs.length&&tShow("scs"))h+=card("tscs",esc(L("Szenen"))+' <small>'+scs.length+'</small>','<ul class="tsclist">'+scs.map(([u,it])=>{const cg=window.chgFor(d.date,u,it.sc);
    /* one line per scene: time, scene, set and – as far as there is room – the description (cut with «…») */
    const set=String(it.set||"").replace(/^VALAIS\s*[–-]\s*/i,""),ds=String((LANG==="en"?it.d:(it["d_"+LANG]||it.d))||"").trim();
    return '<li'+(cg?' class="chg" title="'+esc(cg)+'"':'')+'><span class="tt">'+esc(it.t||"")+'</span><span class="tsc">'+esc(it.sc)+'</span><span class="tset" title="'+esc([set,ds].filter(Boolean).join(" – "))+'">'+(u!=="1"?'<span class="td-unit">'+esc(UNAME[u])+'</span> ':'')+esc(set)+(ds?'<span class="tds"> · '+esc(ds)+'</span>':'')+'</span></li>'}).join("")+'</ul><button type="button" class="pillbtn" data-goto="'+esc(d.id)+'">'+esc(L("Drehplan öffnen"))+'</button>'+(dp?' <button type="button" class="pillbtn" data-todispo="'+esc(d.date)+'">Callsheet</button>':''));
  h+=nextH;
  /* my events */
  /* changes */
  const cl=canPlan?chgList():[];
  {const sc=scriptChg();if(sc){cl.push(sc);cl.sort((a,b)=>(b.at||0)-(a.at||0))}}
  if((canPlan||cl.length)&&tShow("chg"))h+='<div class="tcard tchg"><div class="tch">'+esc(L("Änderungen"))+(cl.some(c=>c.unread)?' <span class="chgdot">'+cl.filter(c=>c.unread).length+' '+esc(L("neu"))+'</span>':'')+'</div>'+
    (cl.length?chgUnitsHTML(cl)+
      '<div class="tacts">'+(cl.some(c=>c.unread)?'<button type="button" class="pillbtn" data-chgseen>'+esc(L("Als gelesen markieren"))+'</button>':'')+'</div>'
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
/* «Jetzt»: the scene being shot now (quittiert, else by the callsheet times) with its place and how long it runs – Today and the callsheet of today */
/* the card: one line «Jetzt · scene, place, set (since)» and – while someone is in Maske / Kostüm – one line with their cast numbers
   (on the phone only the numbers, on wider screens with the role); a tap opens it: description and cast of the scene, roles written out */
window.TNOWOPEN=window.TNOWOPEN||false;
const tnChip=(no,role,lk)=>'<span'+(lk?' class="cqlk'+lk+'"':'')+'><i>'+esc(no)+'</i>'+(role?'<em>'+esc(role)+'</em>':'')+'</span>';
export function nowCardHTML(t,cls){try{if(typeof csNowScene!=="function")return "";
    /* the quittances not read yet (first seconds after opening): no «Jetzt» – it would show the first scene of a day that is long done */
    if(window.SCACKON!==false&&!window.SCACKLOADED&&ME)return "";const ns=csNowScene();if(!ns||ns.ev==="wrap")return "";const x0=(S.dispos||[]).find(y=>y&&y.date===t);const c0=x0&&x0.cs||{};
    const key=ns.ev||ns.sc,ak=typeof scAckId==="function"&&window.SCACK?window.SCACK[scAckId(t,key)]:null,b0=ak&&ak.s===1&&typeof scTimesOk==="function"&&scTimesOk()?(+ak.b||+ak.at):0;
    const nb=csNowBits(ns,c0,t);
    const since=b0?' <small>· '+esc(L("seit"))+' '+esc(csHM(new Date(b0)))+' (<span data-scrun="'+b0+'">'+Math.max(0,Math.floor((Date.now()-b0)/60000))+'′</span>)</small>':'';
    const cc=Object.assign({},c0,{_date:t}),rows=arr(c0.cast),no=r=>String(r.no||"").trim()||"?",role=r=>String(r.role||"").trim();
    /* Maske / Kostüm now: the same pink chips as the cast in the shooting order (pink with white frame = Call, Kostüm, Maske) */
    let cm="";try{if(typeof cqWmNow==="function"&&rows.length){const w=cqWmNow(cc);
      cm=[["m","Maske"],["w","Kostüm"]].filter(([k])=>w[k].length).map(([k,l])=>'<span class="tnk">'+esc(L(l))+'</span><span class="cast tnc">'+w[k].map(r=>tnChip(no(r),role(r),2)).join("")+'</span>').join("")}}catch(_){}
    /* opened: description and cast of the scene (where each actor is, roles written out) */
    let det="";if(!ns.ev){const nos=String(ns.cast||"").split(/[,;\s]+/).map(x=>x.trim()).filter(Boolean),names=(S.meta&&S.meta.cast)||{};
      const ch=nos.map(n=>{const r=rows.find(x=>no(x)===n);let lk=0;try{lk=r&&typeof cqLook==="function"?cqLook(cc,r):0}catch(_){}return tnChip(n,r?role(r):names[n]||"",lk)}).join("");
      det=(ns.syn?'<div class="tnsyn">'+esc(ns.syn)+'</div>':'')+(ch?'<div class="cast tnc">'+ch+'</div>':'')}
    const open=!!window.TNOWOPEN,more=!!(cm||det);
    return '<div class="tcard tnow'+(cls?" "+cls:"")+(open&&more?" tnowo":"")+'"'+(more?' data-tnow tabindex="0" aria-expanded="'+(open?"true":"false")+'"':'')+'><div class="tch">'+esc(L("Jetzt"))+'</div><div class="tnowm"><div class="tnowb">'+(nb.ev||'<b class="tnsc">'+nb.sc+'</b>'+nb.place+' <span class="tnset">'+nb.set+'</span>')+since+'</div>'+
      (cm?'<div class="tnowcm">'+cm+'</div>':'')+(det?'<div class="tnowx">'+det+'</div>':'')+'</div></div>'}catch(_){return ""}}
/* tap (or Enter) on «Jetzt»: open / close – links in it (location) work as before; the choice stays while the page is redrawn */
function tnowToggle(c){window.TNOWOPEN=!c.classList.contains("tnowo");document.querySelectorAll("[data-tnow]").forEach(x=>{x.classList.toggle("tnowo",window.TNOWOPEN);x.setAttribute("aria-expanded",String(window.TNOWOPEN))})}
document.addEventListener("click",e=>{const c=e.target.closest&&e.target.closest("[data-tnow]");if(!c||e.target.closest("a,button"))return;tnowToggle(c)});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const c=e.target&&e.target.matches&&e.target.matches("[data-tnow]")?e.target:null;if(!c)return;e.preventDefault();tnowToggle(c)});
