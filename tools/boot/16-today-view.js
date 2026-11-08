import {castRow,dayItems,dayOf,ddmm,dispoOf,driveMin,esc,isoAdd,isoDM,isoId,L,LANG,localISO,lsGet,mapsDir,mkDialog,norm,pad2,S,saveBtn,todayISO,TX,unitKey,xBtn} from "../base/10-core.js";
import {UNAME,dayMs,hasU,zurichUTC} from "../base/11-schedule-prep.js";
import {WDL,evRecent,hm,myEvents,myIdentity,telLinks} from "../base/12-mycal.js";
import {addrForItem} from "../base/13-crew-views.js";
import {csKeys,csMe,csRows,csTile} from "../base/13a-callsheet.js";
import {csHM,csNowBits,csNowScene,csShootDay} from "../base/13b-cs-now.js";
import {csMine,csTilesHTML} from "../base/13d-cs-mine.js";
import {VIEWS,tabsOn,vok} from "../base/14-render.js";
import {fold,island,render} from "../base/15-script-tab.js";
import {goTo,store} from "../base/16-interaction.js";
import {arr,showMsg} from "../base/20-data-start.js";
import {fmtT} from "./01-config.js";
import {ME,can,fb,ownDec,ownEnc} from "./03-core-firebase.js";
import {getDataKey} from "./04-data.js";
import {savePrefsSoon} from "./06-prefs-docs.js";
import {OFF,chgList,chgSeen,chgSeenGone,dmy,offState,unitItems} from "./14-today-changes-offline.js";
import {wxTile} from "./15-weather.js";
import {scAckId} from "./27-scene-ack.js";
import {html,ISLANDS} from "../base/09-fw.js";
import {Raw} from "../base/10a-ui.js";
/* ---------- 1) «Heute»: everything for today (or the next working day) on one page ---------- */
/* «Today» on/off per person (profile, synced with the view settings) */
export function todayOn(){try{const v=localStorage.getItem("today")||"";return !(v==="0"||v.startsWith("0|"))}catch(_){return true}}
window.todayOn=todayOn;   /* the tab bar (base/14-render) asks through window: «Today» switched off in the profile */
/* which parts Today shows (profile → App): stored with the on/off value, «1|menu,off» = on, without lunch and offline */
const TODAY_PARTS=[["now","Jetzt gedreht",()=>!!(window.nowSee&&window.nowSee())],["my","Meine nächsten Termine",()=>vok("mycal")],["mine","Mein Drehtag",()=>true],["time","Zeiten",()=>true],["drive","Anfahrt",()=>vok("plan")],["wx","Wetter",()=>vok("plan")],
  ["loc","Erste Location",()=>vok("plan")],["menu","Mittagessen",()=>true],["scs","Szenen",()=>vok("plan")],["chg","Änderungen",()=>vok("plan")||vok("script")],["off","Offline am Set",()=>vok("blocking")||vok("plan")]];
/* the person's choice, stored with the on/off value: «menu» = switched off, «+wx» = switched on although the App-Verwaltung offers it «aus» */
function todayPrefs(){let v=lsGet("today","");const i=v.indexOf("|");return new Set(i<0?[]:v.slice(i+1).split(",").filter(Boolean))}
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
export function todayDay(){const t=todayISO(),now=Date.now();const ds=(S.days||[]).filter(d=>d.date);
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
  return island("today",{d,t,at:Date.now()})};
/* ---------- Today as components (framework): the cards in their order; «Jetzt», the callsheet tiles, «Mein Tag», the menu and the
   list of changes are still the shared HTML of the callsheet / changes ---------- */
/** a card of Today: title (with extras) and its content; nothing without content
 * @param {{cls:string,title:any,children?:any}} p */
function TCard({cls,title,children}){return html`<div class=${"tcard "+cls}><div class="tch">${title}</div>${children}</div>`}
/** a time tile («07:00 · Crew Call») @param {{v:string,k:string,cl?:string}} p */
function Tile({v,k,cl}){return html`<div class=${"ttile"+(cl?" "+cl:"")}><b>${v}</b><span>${k}</span></div>`}
/** the drive tile: tap → route in Google Maps (from the hotel or from here) @param {{r:any,min:number,km?:number,back?:boolean}} p */
function DriveTile({r,min,km,back}){return html`<button type="button" class="ttile tdrv" data-route=${JSON.stringify(r)} title=${L("Route in Google Maps")}><b>${driveMin(min)+"′"}${km?html`<small class="tkm"> · ${Math.round(km)} km</small>`:null}</b><span>${L(back?"Rückfahrt":"Anfahrt")} ›</span></button>`}
const firstLoc=d=>arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc));
function driveDest(d){const fi=firstLoc(d);let dest=d.drive.to||"";try{if(fi){const a=addrForItem(fi);if(a&&!/^tba$/i.test(a))dest=a}}catch(_){}return dest}
/** my next events (upcoming and up to 5 h back, as in «Meine Termine») @param {{ev:any[],t:string}} p */
function MyNext({ev,t}){return html`<${TCard} cls="tmy" title=${html`${L("Meine nächsten Termine")}<button type="button" class="tmyall" data-tomy>${L("Alle")} ›</button>`}>
  ${ev.length?html`<ul class="tmylist">${ev.map(x=>html`<li><span class="tmd">${x.date===t?L("heute"):dmy(x.date)} <b>${x.t||""}</b></span><span class="tmw"><b>${x.n||""}</b>${x.where?html` <small>· ${String(x.where).split(",")[0]}</small>`:null}${x.driver?html` <small>· ${L("Fahrer:in")}: <${Raw} html=${typeof telLinks==="function"?telLinks(x.driver):esc(x.driver)}/></small>`:null}</span></li>`)}</ul>`:html`<p class="ghint">${L("Keine anstehenden Termine.")}</p>`}</${TCard}>`}
/** the scenes of the day, one line each @param {{d:any,scs:any[],dp:any}} p */
function Scenes({d,scs,dp}){return html`<${TCard} cls="tscs" title=${html`${L("Szenen")} <small>${scs.length}</small>`}><ul class="tsclist">${scs.map(([u,it])=>{const cg=window.chgFor(d.date,u,it.sc);
    const set=String(it.set||"").replace(/^VALAIS\s*[–-]\s*/i,""),ds=String((LANG==="en"?it.d:(it["d_"+LANG]||it.d))||"").trim();
    return html`<li class=${cg?"chg":undefined} title=${cg||undefined}><span class="tt">${it.t||""}</span><span class="tsc">${it.sc}</span><span class="tset" title=${[set,ds].filter(Boolean).join(" – ")}>${u!=="1"?html`<span class="td-unit">${UNAME[u]}</span> `:null}${set}${ds?html`<span class="tds"> · ${ds}</span>`:null}</span></li>`})}</ul>
  <button type="button" class="pillbtn" data-goto=${d.id}>${L("Drehplan öffnen")}</button>${dp?html` <button type="button" class="pillbtn" data-todispo=${d.date}>Callsheet</button>`:null}</${TCard}>`}
/** the tiles of the next shooting day (from noon or lunch on) @param {{d:any,canPlan:boolean}} p */
function NextDay({d,canPlan}){
  try{const la=d.kind==="shoot"&&lunchAt(d),noon=zurichUTC(d.date,"12:00").getTime(),from=la?Math.min(la,noon):noon;if(!(canPlan&&d.kind==="shoot"&&Date.now()>=from))return null;
    const nd=(S.days||[]).find(x=>x.kind==="shoot"&&x.date>d.date);if(!nd)return null;
    const ndt=new Date(nd.date+"T12:00:00"),nt=[],nu2=nd.unit2&&typeof nd.unit2==="object"&&nd.unit2.hours?String(nd.unit2.hours):"";
    let nmu=null;try{const ndp=dispoOf(nd.date,1);if(ndp&&typeof window.csMyUnits==="function")nmu=window.csMyUnits(ndp.cs,csMe())}catch(_){}
    const sh1=!nu2||!nmu||nmu.includes("1"),sh2=!!nu2&&(!nmu||nmu.includes("2"));
    if(nd.hours&&sh1)nt.push([nd.hours,L("Drehzeit")+(nu2?" · 1st Unit":"")]);if(sh2)nt.push([nu2,L("Drehzeit")+" · 2nd Unit"]);if(nd.sr&&nd.ss)nt.push([nd.sr+"–"+nd.ss,L("Sonnenzeit")]);
    let ndrv=null;if(nd.drive&&nd.drive.min){const dest=driveDest(nd),gm=mapsDir,hotel=nd.drive.from||"Hotel";ndrv=html`<${DriveTile} r=${{h:gm(hotel,dest),c:gm("",dest),from:hotel,to:dest}} min=${nd.drive.min} km=${nd.drive.km}/>`}
    const nwx=tShow("wx")?wxTile(nd):"";
    if(!(nt.length||ndrv||nwx))return null;
    return html`<div class="thead tnext"><h3 class="pgt">${L("Nächster Drehtag")}</h3><span class="tdate">${(nd.short||nd.label||"")+" · "+WDL(ndt)+" "+ddmm(ndt)}</span></div><div class="ttiles">${nt.map(([v,k])=>html`<${Tile} v=${v} k=${k}/>`)}${ndrv}<${Raw} html=${nwx}/></div>`}catch(_){return null}}
/** Today @param {{d:any,t:string}} p */
function TodayPage({d,t}){
  const sd=typeof csShootDay==="function"?csShootDay():t,isToday=d.date<=t||d.date===sd,dt=new Date(d.date+"T12:00:00");
  const canPlan=vok("plan"),canDispo=vok("dispo"),dp=canDispo?(dispoOf(d.date)||null):null,out=[];
  let me=null;try{me=typeof myIdentity==="function"?myIdentity():null}catch(_){}
  if(todayCfg("now")!=="no"&&!todayPrefs().has("now"))out.push(html`<${Raw} html=${nowCardHTML(sd,"",undefined,true)}/>`);
  try{if(me&&vok("mycal")&&tShow("my"))out.push(html`<${MyNext} ev=${myEvents(me).filter(x=>typeof evRecent!=="function"||evRecent(x)).slice(0,4)} t=${t}/>`)}catch(_){}
  {const td=d.date!==t?(S.days||[]).find(x=>x.date===t&&x.kind!=="shoot"):null;
    if(td)out.push(html`<${TCard} cls="tinfo" title=${L("Heute")+" · "+L(td.label||"")}>${TX(td,"info")?html`<p class="tsub">${TX(td,"info")}</p>`:null}</${TCard}>`)}
  out.push(html`<div class="thead"><h2 class="pgt">${L(isToday?"Heute":d.kind==="shoot"?"Nächster Drehtag":"Nächster Tag")}</h2><span class="tdate">${(d.short||d.label||"")+" · "+WDL(dt)+" "+ddmm(dt)}</span></div>`);
  let myCall="";try{if(me&&dp){const myDep=fold(me.src||"").split(/[\s/]/)[0];const c=myDep?arr(dp.calls).find(z=>fold(z.dept||"").split(/[^a-z0-9]+/).includes(myDep)):null;if(c)myCall=hm(c.t)+" · "+c.dept}}catch(_){}
  const tiles=[],shT=tShow("time");
  if(shT&&myCall)tiles.push([myCall.split(" · ")[0],L("Mein Call")+" · "+myCall.split(" · ").slice(1).join(" · ")]);
  if(shT&&dp&&(dp.crewCall||dp.generalCall))tiles.push([dp.crewCall||dp.generalCall,"Crew Call","big"]);
  if(shT&&dp&&dp.shootCall)tiles.push([dp.shootCall,L("Drehbeginn")]);
  const u2h=d.unit2&&typeof d.unit2==="object"&&d.unit2.hours?String(d.unit2.hours):"";
  if(shT&&d.hours&&canPlan)tiles.push([d.hours,L("Drehzeit")+(u2h?" · 1st Unit":"")]);
  if(shT&&u2h&&canPlan)tiles.push([u2h,L("Drehzeit")+" · 2nd Unit"]);
  if(shT&&dp&&dp.wrap)tiles.push([dp.wrap,"Wrap"]);
  if(shT&&d.sr&&d.ss)tiles.push([d.sr+"–"+d.ss,L("Sonnenzeit")]);
  const wxt=canPlan&&tShow("wx")?wxTile(d):"";
  let drv=null;if(canPlan&&tShow("drive")&&d.drive&&d.drive.min){const dest=driveDest(d),hotel=d.drive.from||"Hotel",la=lunchAt(d),back=!!(la&&Date.now()>=la&&Date.now()<((dayTimes(d)||{}).en||0)+3600e3),gm=mapsDir;
    const r=back?{h:gm(dest,hotel),c:gm("",hotel),from:dest,to:hotel,back:1}:{h:gm(hotel,dest),c:gm("",dest),from:hotel,to:dest};drv=html`<${DriveTile} r=${r} min=${d.drive.min} km=${d.drive.km} back=${back}/>`}
  let mine=null;try{const dpm=dispoOf(d.date);if(tShow("mine")&&dpm&&dpm.cs&&typeof csMine==="function"){const mn=csMine(dpm.cs,csMe());const toCs=canDispo&&typeof tabsOn==="function"&&tabsOn().includes("dispo");
    if(mn.length)mine=html`<${TCard} cls="tmine" title=${html`${L("Mein")} ${dpm.label||d.label||L("Drehtag")} <span class="beta">BETA</span>${toCs?html`<button type="button" class="tmyall" data-tocs=${d.date}>${L("Alle")} ›</button>`:null}`}><${Raw} html=${mn.join("")}/></${TCard}>`}}catch(_){}
  const dcs=dispoOf(d.date,1);
  if(dcs&&shT&&typeof csTilesHTML==="function"){let me3=null;try{me3=csMe()}catch(_){}out.push(html`<div class="tcs"><${Raw} html=${unitTilesHTML(dcs,d,me3)}/></div>`)}
  else if(tiles.length||wxt||drv)out.push(html`<div class="ttiles">${tiles.map(([v,k,cl])=>html`<${Tile} v=${v} k=${k} cl=${cl}/>`)}${drv}<${Raw} html=${wxt}/></div>`);
  out.push(mine);
  if(!dp&&canDispo&&d.kind==="shoot")out.push(html`<p class="ghint">${L("Callsheet folgt")}</p>`);
  const first=canPlan&&tShow("loc")?firstLoc(d):null;
  if(first){let ad="";try{ad=addrForItem(first)}catch(_){ad=first.loc}const from=(d.drive&&d.drive.from)||"Hotel";
    out.push(html`<${TCard} cls="tloc" title=${L("Erste Location")}><div class="tbig">${first.set||first.loc}</div>${ad&&!/^tba$/i.test(ad)?html`<button type="button" class="lnk tlocad" data-route=${JSON.stringify({h:mapsDir(from,ad),c:mapsDir("",ad),from,to:ad})}>${ad}</button>`:null}</${TCard}>`)}
  if(tShow("menu"))try{const mn=window.menuFor?window.menuFor(d.date,"all"):"";if(mn)out.push(html`<${TCard} cls="tmenu" title=${L("Mittagessen")}><${Raw} html=${mn}/></${TCard}>`)}catch(_){}
  const scs=[];if(canPlan)for(const [u,its] of unitItems(d))if(u==="1"||hasU(d,u)){let prev="";its.forEach(it=>{if(!it.sc)return;const k=String(it.sc).replace(/\s+/g,"").toLowerCase();if(u!=="1"&&k===prev)return;prev=k;scs.push([u,it])})}
  if(scs.length&&tShow("scs"))out.push(html`<${Scenes} d=${d} scs=${scs} dp=${dp}/>`);
  out.push(html`<${NextDay} d=${d} canPlan=${canPlan}/>`);
  const cl=canPlan?chgList():[];{const sc=scriptChg();if(sc){cl.push(sc);cl.sort((a,b)=>(b.at||0)-(a.at||0))}}
  if((canPlan||cl.length)&&tShow("chg")){const nu=cl.filter(c=>c.unread).length;
    out.push(html`<${TCard} cls="tchg" title=${html`${L("Änderungen")}${nu?html` <span class="chgdot">${nu} ${L("neu")}</span>`:null}`}>${cl.length?html`<${Raw} html=${chgUnitsHTML(cl)}/><div class="tacts">${nu?html`<button type="button" class="pillbtn" data-chgseen>${L("Als gelesen markieren")}</button>`:null}</div>`:html`<p class="ghint">${L("Seit deinem letzten Besuch hat sich am Drehplan nichts geändert.")}</p>`}</${TCard}>`)}
  const st=offState(),on=navigator.onLine!==false;
  if((vok("blocking")||vok("plan"))&&tShow("off"))out.push(html`<${TCard} cls="toff" title=${html`${L("Offline am Set")}${on?null:html` <span class="chgdot">${L("offline")}</span>`}`}>
    ${st&&st.v===2?html`<p class="tsub">✓ ${L("Gespeichert")}: ${st.n} ${L("Seiten")} (${L("Blocking-PDFs und Floorplans, alle Drehtage")}) · ${L("Stand")} ${fmtT(st.at)}</p>`:null}
    <p class="ghint">${L("Drehplan, Callsheet, Kontakte, Drehbuch, Blocking-PDFs und Floorplans werden für alle Drehtage automatisch auf diesem Gerät gespeichert – Fotos nicht.")}</p>
    ${on?html`<button type="button" class="pillbtn" data-offprep disabled=${!!OFF.busy}>${L(OFF.busy?"Wird geladen …":"Jetzt für offline laden")}</button>`:null}</${TCard}>`);
  return html`<section class="today">${out}</section>`}
ISLANDS.today=TodayPage;

/* the app opens on «Today» (unless a link asks for another page) */

document.addEventListener("click",e=>{if(!e.target.closest("[data-tscript]")||!vok("script"))return;goTo({tab:"script"})});
/* «Jetzt»: the scene being shot now (quittiert, else by the callsheet times) with its place and how long it runs – Today and the callsheet of today */
/* the card: one line «Jetzt · scene, place, set (since)» and – while someone is in Maske / Kostüm – one line with their cast numbers
   (on the phone only the numbers, on wider screens with the role); a tap opens it: description and cast of the scene, roles written out */
/* ---------- Prognosen im «Jetzt» (Recht «Prognosen im Jetzt erfassen»: now.forecast) ----------
   nowcast/{JJJJMMTT} {c: verschlüsselt [{k, t, n, bis}], at}: k = «start» Drehbeginn · «lunch» · «wrap» Drehschluss · eine Szene · «x» Anderes (Text n);
   t = erwartete Zeit, bis = optional: ab dann nicht mehr angezeigt. Eine Prognose erlischt, sobald ihr Schritt quittiert ist
   (Drehbeginn: eine Szene läuft · Lunch: begonnen · Szene: begonnen · Drehschluss: quittiert). Auf dem Gerät für einen schnellen Start gemerkt. */
window.NOWCAST=window.NOWCAST||{};
try{const c=JSON.parse(localStorage.getItem("nowcast:v1")||"null");if(c&&c.d&&Array.isArray(c.items))window.NOWCAST[c.d]=c.items}catch(_){}
const ncDay=()=>{try{return csShootDay()}catch(_){return todayISO()}};
const ncDocId=isoId;
let NCSUB=null,NCD="";
async function ncSub(){const d=ncDay();if(typeof ME==="undefined"||!ME)return;if(NCSUB&&NCD===d)return;try{if(typeof NCSUB==="function")NCSUB()}catch(_){}NCSUB="…";NCD=d;
  /* the whole (small) collection – one document per shooting day; only the day of «Jetzt» is used */
  try{const {F,db}=await fb();NCSUB=F.onSnapshot(F.collection(db,"nowcast"),async q=>{let items=[];try{const x=(q.docs||[]).find(y=>y.id===ncDocId(d));if(x&&x.data().c){const o=await ownDec(await getDataKey(),x.data().c);items=arr(o&&o.items)}}catch(err){console.warn("nowcast",err&&err.message||err);return}
      const was=JSON.stringify(window.NOWCAST[d]||[]);window.NOWCAST[d]=items;try{localStorage.setItem("nowcast:v1",JSON.stringify({d,items}))}catch(_){}
      if(was!==JSON.stringify(items)&&(S.tab==="today"||S.tab==="dispo"))render()},()=>{NCSUB=null})}catch(_){NCSUB=null}}
setTimeout(ncSub,1500);setInterval(()=>{if(!NCSUB||NCD!==ncDay())ncSub()},20e3);
/* sign-out (clearLocal): stop listening and forget the copy of this person */
window.ncStop=()=>{try{if(typeof NCSUB==="function")NCSUB()}catch(_){}NCSUB=null;NCD="";window.NOWCAST={}};
const ncCan=()=>{try{return can("now.forecast")&&!(window.simOn&&window.simOn())}catch(_){return false}};
/* the label of one forecast */
const ncLabel=it=>it.k==="start"?L("Drehbeginn"):it.k==="lunch"?"Lunch":it.k==="wrap"?L("Drehschluss"):it.k==="x"?String(it.n||L("Anderes")):L("Szene")+" "+it.k;
/* still shown: its step not quittiert yet and its «bis» not passed */
function ncActive(d){const now=Date.now(),st=k=>typeof scState==="function"?scState(d,k):0;
  return arr(window.NOWCAST[d]).filter(it=>{if(!it||!it.t)return false;
    if(it.bis){const day=dayOf(d),fh=(dayItems(day,"1").map(i=>String(i.t||"").slice(0,5)).find(z=>/^\d\d:\d\d$/.test(z)))||"",
        t0=it.t?dayMs(d,it.t,fh>="12:00"?dayMs(d,fh):0):0,b=dayMs(d,it.bis,t0);   /* a night shoot: «00:30» is after midnight (as the rows of the day); «bis 01:00» after a forecast at 23:00 is the next day */   /* «bis 01:00» after a forecast at 23:00 is the next day */if(b&&b<=now)return false}
    if(it.k==="x")return true;if(it.k==="wrap")return st("wrap")!==2;if(it.k==="lunch")return st("lunch")===0;
    if(it.k==="start"){const rows=arr((((dispoOf(d)||{}).cs||{}).order||{}).rows);return !rows.some(r=>r&&r.sc&&st(String(r.sc))>0)}
    return st(it.k)===0})}
/* the forecasts in one compact line above the cast: «Prognose Lunch 13:15 · Drehschluss 19:30» */
const ncLine=d=>{const l=ncActive(d);return l.length?'<div class="tnowfc"><span class="tnk">'+esc(L("Prognose"))+'</span> '+l.map(it=>'<span class="tnfc">'+esc(ncLabel(it))+' <b>'+esc(it.t)+'</b>'+(it.n&&it.k!=="x"?' <small>'+esc(it.n)+'</small>':'')+'</span>').join('<i class="tnsep">·</i>')+'</div>':""};
/* the text for WhatsApp: «Prognose 25.10.: Lunch ~13:15 · Drehschluss ~19:30» */
const ncText=d=>{const l=ncActive(d);return l.length?L("Prognose")+" "+isoDM(d)+".: "+l.map(it=>ncLabel(it)+" ~"+it.t+(it.n&&it.k!=="x"?" ("+it.n+")":"")).join(" · "):""};
window.ncText=ncText;
/* the dialog: one row per forecast – what, expected time, shown until (optional), note */
/* save the forecasts of a day (none: the document is deleted) */
async function ncStore(d,ok){const {F,db}=await fb(),ref=F.doc(db,"nowcast",ncDocId(d));
  if(ok.length)await F.setDoc(ref,{c:await ownEnc({items:ok}),at:F.serverTimestamp()});else await F.deleteDoc(ref);
  window.NOWCAST[d]=ok;try{localStorage.setItem("nowcast:v1",JSON.stringify({d,items:ok}))}catch(_){}}
function ncDialog(){const d=ncDay(),dp=dispoOf(d),rows=csRows(dp&&dp.cs),keys=csKeys(rows);
  const opts=[["start",L("Drehbeginn")],["lunch","Lunch"],["wrap",L("Drehschluss")]].concat(rows.map((r,i)=>r.sc?[String(r.sc),L("Szene")+" "+r.sc]:null).filter(Boolean)).concat([["x",L("Anderes")]]);
  void keys;let items=arr(window.NOWCAST[d]).map(x=>Object.assign({},x));if(!items.length)items=[{k:"lunch",t:""}];
  const row=(it,i)=>'<div class="ncrow" data-nci="'+i+'"><select data-ncf="k" aria-label="'+esc(L("Was"))+'">'+opts.map(([v,t])=>'<option value="'+esc(v)+'"'+(it.k===v?' selected':'')+'>'+esc(t)+'</option>').join("")+'</select>'+
    '<label>'+esc(L("ca."))+' <input type="time" data-ncf="t" value="'+esc(it.t||"")+'"></label><label>'+esc(L("anzeigen bis"))+' <input type="time" data-ncf="bis" value="'+esc(it.bis||"")+'"></label>'+
    '<input type="text" data-ncf="n" maxlength="80" placeholder="'+esc(L("Notiz (bei «Anderes»: Text)"))+'" value="'+esc(it.n||"")+'"><label class="ck ncsh"><input type="checkbox" data-ncf="sh"'+(it.sh===false?'':' checked')+'> '+esc(L("in WhatsApp"))+'</label><button type="button" class="lnk ncdelb" data-ncdel="'+i+'">'+esc(L("Löschen"))+'</button></div>';
  /* WhatsApp: chosen right here – on unless switched off for «Prognose» in Mein Konto → App */
  let WA=(typeof window.scWaMode==="function"?window.scWaMode("p"):"f")!=="n";
  const dl=mkDialog("ncdlg",null,{replace:true});
  const draw=()=>{dl.innerHTML='<div class="a2box ncbox">'+xBtn("data-ncx")+'<h3>'+esc(L("Prognose"))+' · '+esc(isoDM(d)+".")+'</h3><p class="ghint">'+esc(L("Erscheint im «Jetzt» bei allen und erlischt von selbst, sobald der Schritt quittiert ist (oder ab «anzeigen bis»)."))+'</p>'+
    '<form data-ncform novalidate>'+items.map(row).join("")+'<div class="ncacts"><button type="button" class="pillbtn" data-ncadd>+ '+esc(L("Prognose"))+'</button>'+(arr(window.NOWCAST[d]).length?'<button type="button" class="pillbtn" data-ncall>'+esc(L("Alle löschen"))+'</button>':'')+'</div><label class="ck ncwa"><input type="checkbox" data-ncwa'+(WA?' checked':'')+'> '+esc(L("Nach dem Speichern per WhatsApp teilen (die angehakten Prognosen)"))+'</label><div class="arb">'+saveBtn()+'</div></form></div>'};
  const read=()=>{const w=dl.querySelector("[data-ncwa]");if(w)WA=w.checked;items=[...dl.querySelectorAll(".ncrow")].map(r=>{const g=f=>String((r.querySelector('[data-ncf="'+f+'"]')||{}).value||"").trim(),sh=r.querySelector('[data-ncf="sh"]');return {k:g("k"),t:g("t"),bis:g("bis"),n:g("n").slice(0,80),sh:!sh||sh.checked}})};
  draw();document.body.appendChild(dl);
  dl.addEventListener("click",e=>{if(e.target===dl||e.target.closest("[data-ncx]")){dl.remove();return}
    if(e.target.closest("[data-ncadd]")){read();items.push({k:"wrap",t:""});draw();return}
    /* «Löschen» of one forecast: away at once for everybody (the window stays open for further changes) */
    const x=e.target.closest("[data-ncdel]");if(x){read();items.splice(+x.dataset.ncdel,1);const keep=items.filter(it=>it.k&&/^\d\d:\d\d$/.test(it.t)&&(it.k!=="x"||it.n)).map(it=>{const o={k:it.k,t:it.t};if(it.bis)o.bis=it.bis;if(it.n)o.n=it.n;return o});
      ncStore(d,keep).then(()=>{showMsg(L("Prognose gelöscht."),2000);render()}).catch(err=>showMsg(/permission/.test(err&&err.code||"")?L("Keine Berechtigung."):L("Fehler:")+" "+(err.message||err),5000));draw();return}
    /* all forecasts of the day away at once (saved right away) */
    if(e.target.closest("[data-ncall]")){NCALL=true;items=[];const f=dl.querySelector("form");if(f)f.dispatchEvent(new Event("submit",{cancelable:true,bubbles:true}))}});
  let NCALL=false;
  dl.addEventListener("submit",async e=>{e.preventDefault();if(NCALL)items=[];else read();const valid=items.filter(it=>it.k&&/^\d\d:\d\d$/.test(it.t)&&(it.k!=="x"||it.n)),ok=valid.map(it=>{const o={k:it.k,t:it.t};if(it.bis)o.bis=it.bis;if(it.n)o.n=it.n;return o});
    /* WhatsApp first, still in the tap (a phone opens it only there): the forecasts ticked «in WhatsApp» */
    const sh=valid.filter(it=>it.sh!==false);
    if(WA&&!NCALL&&sh.length&&typeof window.scWaOpen==="function")try{window.scWaOpen(L("Prognose")+" "+isoDM(d)+".: "+sh.map(it=>ncLabel(it)+" ~"+it.t+(it.n&&it.k!=="x"?" ("+it.n+")":"")).join(" · "),"p")}catch(_){}
    try{await ncStore(d,ok);dl.remove();render();
      showMsg(L(ok.length?"Prognose gespeichert.":"Prognosen gelöscht."),2500)}
    catch(err){showMsg(/permission/.test(err&&err.code||"")?L("Keine Berechtigung."):L("Fehler:")+" "+(err.message||err),5000)}});}
/* the icon, and for the people with the right also the forecast line itself: open the forecasts to change or delete them */
document.addEventListener("click",e=>{if(!e.target.closest||!(e.target.closest("[data-ncedit]")||(e.target.closest(".tnow .tnowfc")&&ncCan())))return;e.preventDefault();e.stopPropagation();if(ncCan())ncDialog()},true);
const NCICO='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/></svg>';
window.TNOWOPEN=window.TNOWOPEN||false;
/* late: more than 5 minutes behind the callsheet – «+12′» right after the cast number */
const tnChip=(no,role,lk,on,late)=>'<span'+(lk?' class="tnl'+lk+(on?' tnon':'')+'"':'')+'><i>'+esc(no)+'</i>'+(late?'<b class="tnlate" title="'+esc(L("Verspätung"))+'">+'+late+'′</b>':'')+(role?'<em>'+esc(role)+'</em>':'')+'</span>';
/* the tiles of a shooting day (times, sun, weather, drive) – the 2nd Unit with the same tiles as the 1st; only the unit I am in
   (both, each with its head, when I am in both or it is not clear). Today, side box */
export function unitTilesHTML(dcs,d,me){const has2=!!((dcs.cs||{}).u2||dayItems(d,"2").length);
  /* the units chosen with the unit buttons (as the callsheet): 1st, 2nd or both */
  const units=has2?["1","2"].filter(u=>S.pu[u]!==false&&(u!=="2"||S.pu["2"])):["1"],U=units.length?units:["1"];
  const tl=U.map(u=>{let h="";try{h=csUnitTiles(dcs,d,u,me).replace(' id="cs-zeiten"','')}catch(err){console.warn("tiles",u,err)}return h?{u,h}:null}).filter(Boolean);
  if(tl.length<2)return tl[0]?tl[0].h:"";
  /* both units: the 2nd Unit can be folded – closed for everybody who is not in the 2nd Unit (open for the 2nd Unit and when it is not known);
     a fold or unfold by hand stays for that day */
  let mine=null;try{mine=typeof window.csMyUnits==="function"&&me?window.csMyUnits(dcs.cs,me):null}catch(_){}
  const key=String(dcs.date||d&&d.date||""),open=key in TU2OPEN?TU2OPEN[key]:!(mine&&!mine.includes("2"));
  return tl.map(t=>t.u!=="2"?'<div class="tuh tu1">1st Unit</div>'+t.h:
    '<details class="tu2d" data-tu2d="'+esc(key)+'"'+(open?' open':'')+'><summary><span class="tuh tu2">2nd Unit</span></summary>'+t.h+'</details>').join("")}
const TU2OPEN={};
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.matches&&d.matches("details[data-tu2d]"))TU2OPEN[d.dataset.tu2d]=d.open},true);
/* «Jetzt» of one unit – the same for the 1st and the 2nd Unit (Today, callsheet, side box): the step running now (scene with place and set,
   since when, scenes in parallel and the next one; or Setup / Lunch), Maske / Kostüm now, opened the description and the cast.
   null: this unit is not shooting now (before its start, after its wrap, at night). The 2nd Unit: its own callsheet part (csU2Dispo) */
function nowUnit(t,u){const x1=dispoOf(t);if(!x1||!x1.cs)return null;
  let x=x1;if(u==="2"){const day=dayOf(t);x=typeof window.csU2Dispo==="function"?window.csU2Dispo(x1,day):null;if(!x)return null}
  const c0=x.cs||{},ns=csNowScene(x);if(!ns||/^wrap(_u\d)?$/.test(String(ns.ev||"")))return null;
  const K=sc=>unitKey(sc,u);
  const key=ns.ev||K(ns.sc),ak=typeof scAckId==="function"&&window.SCACK?window.SCACK[scAckId(t,key)]:null,b0=ak&&ak.s===1&&typeof scTimesOk==="function"&&scTimesOk()?(+ak.b||+ak.at):0;
  const nb=csNowBits(ns,c0,t);
  /* scenes in parallel in this unit: the further ones running now («+ 23 L3 SEEUFER») and the next one still open («→ 24») */
  let par="";try{if(!ns.ev&&typeof scAckId==="function"){const me=scAckId(t,K(ns.sc)),rows=arr((c0.order||{}).rows).filter(r=>r&&r.sc);
    for(const [id,y] of Object.entries(window.SCACK||{})){if(!y||y.d!==t||y.s!==1||id===me||String(y.u||"1")!==u)continue;const k=String(y.sc||id.split("-").slice(1).join("-")).replace(/_u\d$/,"");if(/^(lunch|wrap|setup\d*)$/.test(k))continue;
      const r=rows.find(z=>scAckId(t,K(z.sc))===id)||{sc:k};const bb=csNowBits(r,c0,t);par+=' <span class="tnpar">+ <b class="tnsc">'+bb.sc+'</b>'+bb.place+' <span class="tnset">'+bb.set+'</span></span>'}
    if(par){const st=z=>typeof scState==="function"?scState(t,String(K(z.sc))):0;let last=-1;rows.forEach((z,i)=>{if(st(z)>0)last=i});const nx=rows.slice(last+1).find(z=>st(z)===0);
      if(nx)par+=' <span class="tnnext">→ <b class="tnsc">'+esc(String(nx.sc))+'</b></span>'}}}catch(_){}
  const since=b0?' <small>· '+esc(L("seit"))+' '+esc(csHM(new Date(b0)))+' (<span data-scrun="'+b0+'">'+Math.max(0,Math.floor((Date.now()-b0)/60000))+'′</span>)</small>':'';
  const cc=Object.assign({},c0,{_date:t}),no=r=>String(r.no||"").trim()||"?",role=r=>String(r.role||"").trim();
  /* Maske / Kostüm now: the same pink chips as the cast in the shooting order */
  let cm="";try{if(typeof cqWmNow==="function"&&arr(c0.cast).length){const w=cqWmNow(cc);
    cm=[["m","Maske"],["w","Kostüm"]].filter(([k])=>w[k].length).map(([k,l])=>'<span class="tnk">'+esc(L(l))+'</span><span class="tnc">'+w[k].map(r=>tnChip(no(r),role(r),2,false,typeof cqLate==="function"?cqLate(cc,r):0)).join("")+'</span>').join("")}}catch(_){}
  /* opened: description and cast of the scene (where each actor is, roles written out) */
  let det="";if(!ns.ev){const nos=String(ns.cast||"").split(/[,;\s]+/).map(v=>v.trim()).filter(Boolean),names=(S.meta&&S.meta.cast)||{};
    const ch=nos.map(n=>{const r=castRow(c0,n);let lk=0;try{lk=r&&typeof cqLook==="function"?cqLook(cc,r):0}catch(_){}return tnChip(n,r?role(r):names[n]||"",lk,lk===3&&r&&typeof cqAll==="function"&&cqAll(cc,r),r&&typeof cqLate==="function"?cqLate(cc,r):0)}).join("");
    det=(ns.syn?'<div class="tnsyn">'+esc(ns.syn)+'</div>':'')+(ch?'<div class="tnc">'+ch+'</div>':'')}
  return {line:(nb.ev||'<b class="tnsc">'+nb.sc+'</b>'+nb.place+' <span class="tnset">'+nb.set+'</span>')+since+par,cm,det}}
/* «Jetzt»: one block per unit shooting now, each built the same way; with both units each with its label. unit «1» / «2»: only that unit */
export function nowCardHTML(t,cls,unit,onlyShooting){try{if(typeof csNowScene!=="function"||!(window.nowSee&&window.nowSee()))return "";   /* only with «Jetzt» sehen (admins always) */
    /* the quittances not read yet (first seconds after opening): no «Jetzt» – it would show the first scene of a day that is long done */
    if(window.SCACKON!==false&&!window.SCACKLOADED&&!window.SCACKCACHE&&ME)return "";
    const day=dayOf(t),hasU2=!!dayItems(day,"2").length||!!((dispoOf(t)||{}).cs||{}).u2;
    const units=unit==="2"?["2"]:hasU2?["1","2"]:["1"];
    const B=units.map(u=>{let r=null;try{r=nowUnit(t,u)}catch(err){console.warn("now",u,err)}return r?Object.assign(r,{u}):null}).filter(Boolean);
    const fc=ncLine(t),ed=unit!=="2"&&ncCan()?'<button type="button" class="tnced" data-ncedit '+'aria-label="'+esc(L("Prognose erfassen"))+'" title="'+esc(L("Prognose erfassen"))+'">'+NCICO+'</button>':'';
    /* no unit shooting now (before the setup, after the wrap): only the forecasts – with the right to enter them also the card with its icon on a shooting day */
    if(!B.length){if(onlyShooting)return "";   /* Today: only while a unit shoots */const sd=!!(day&&day.kind==="shoot");if(!fc&&!(ed&&sd))return "";
      return '<div class="tcard tnow'+(cls?" "+cls:"")+'"><div class="tch">'+esc(L("Jetzt"))+'</div><div class="tnowm">'+(fc||'<div class="tnowfc"><span class="tnk">'+esc(L("Prognose erfassen"))+'</span></div>')+'</div>'+ed+'</div>'}
    const lab=units.length>1;
    const body=B.map(b=>'<div class="tnowun '+(b.u==="2"?"tu2":"tu1")+'"><div class="tnowb">'+(lab?'<span class="tnk tnu '+(b.u==="2"?"tu2":"tu1")+'">'+(b.u==="2"?"2nd":"1st")+' Unit</span> ':'')+b.line+'</div>'+(b.cm?'<div class="tnowcm">'+b.cm+'</div>':'')+(b.det?'<div class="tnowx">'+b.det+'</div>':'')+'</div>').join("");
    const open=!!window.TNOWOPEN,more=B.some(b=>b.cm||b.det);
    return '<div class="tcard tnow'+(cls?" "+cls:"")+(open&&more?" tnowo":"")+'"'+(more?' data-tnow tabindex="0" aria-expanded="'+(open?"true":"false")+'"':'')+'><div class="tch">'+esc(L("Jetzt"))+'</div><div class="tnowm">'+body+fc+'</div>'+ed+'</div>'}catch(_){return ""}}
/* tap (or Enter) on «Jetzt»: open / close – links in it (location) work as before; the choice stays while the page is redrawn */
function tnowToggle(c){window.TNOWOPEN=!c.classList.contains("tnowo");document.querySelectorAll("[data-tnow]").forEach(x=>{x.classList.toggle("tnowo",window.TNOWOPEN);x.setAttribute("aria-expanded",String(window.TNOWOPEN))})}
document.addEventListener("click",e=>{const c=e.target.closest&&e.target.closest("[data-tnow]");if(!c||e.target.closest("a,button"))return;tnowToggle(c)});
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const c=e.target&&e.target.matches&&e.target.matches("[data-tnow]")?e.target:null;if(!c)return;e.preventDefault();tnowToggle(c)});
