import {dayItems,dayTitle,esc,fmtDate,ieClass,L,maps,mapUrl,noonDate,S,safeUrl,telNum} from "./10-core.js";
import {nowCardHTML} from "../boot/16-today-view.js";
import {UNITBAR,nmk} from "./11-schedule-prep.js";
import {WDL} from "./12-mycal.js";
import {csA,csAdr,csDriverByPhone,csDurT,CSEXP,CSEXPSM,csHm,CSI,csL,csMap,csMe,csMk,CSPH,csRideCell,csRoute,csRouteH,csRows,csS,csSec,CsSec,csTable,csTvBtn,csTvCls,csTx,setCSTR} from "./13a-callsheet.js";
import {CSHN_RE,csNear,csNearHTML,csNowBits,csNowIdx,csNowLoc,csNowScene,csSceneLoc,csShootDay,setCSCUR} from "./13b-cs-now.js";
import {csBadgeIn,csCallPlace,csCodeHref,csGeoAdr,csLabIcons,csKindCode,csLocAddr,csLocFp,csLocGroups,csLocHref,csLocs,csMapQ,csOrderRows,csPlace,csPlaceA,csPlaceH,csRadioHTML,csSetGeo} from "./13c-cs-places.js";
import {csCastOpen,csCmFirst,csExOpen,csJumpBar,csMine,csMyDept,csShort,csSums,csTeamSec,csTilesHTML,csTransOpen} from "./13d-cs-mine.js";
import {csCastMode,csCols} from "./13f-cs-events.js";
import {vok} from "./14-render.js";
import {csRideUnit,csRidesFor,csU2HTML} from "./13g-cs-unit2.js";
import {fold} from "./15-script-tab.js";
import {RIDE_ICO} from "../boot/24-flow.js";
import {h,html,ISLANDS,toHTML} from "./09-fw.js";
import {Raw,Sections} from "./10a-ui.js";
/* ---------- Callsheet (5/6): the sections (locations, map, travel, calls) and renderCS ---------- */
/* ---------- Locations: one box per location (sets at the same address together, bases with their icons) ---------- */
/* code of a location: L1, «L1·L2» for sets at one address, the kinds of a base */
function csLocCode(l){return l.kinds?l.kinds.map(csKindCode).join("·"):l._codes?l._codes.join("·"):(l.no?"L"+String(l.no).trim():"")}
/* title (DN) and second line (LAD: address) of a location */
function csLocHead(c,l,date){let LAD=csLocAddr(c,l,date),DN=l.name||"";const w=t=>fold(String(t||"")).replace(/[^a-z0-9]/g,"");
  /* a side place: the title is its kind (Base, else the first kind, e.g. «WHM Extras»), the second line its name and address («Restaurant Waldrand, Föhrenweg 160, 3999 Testdorf») */
  if(l.kinds){const isA=/\d{4}\s+\p{L}/u.test(DN),nm=isA?"":DN;const ad=LAD&&!(isA&&w(LAD)!==w(DN)&&!w(LAD).startsWith(w(DN)))?LAD:(isA?DN:LAD);
    LAD=[nm&&!w(ad).includes(w(nm))?nm:"",ad].filter(Boolean).join(", ");DN=l.kinds.includes("Base")?"BASE":csKindCode(l.kinds[0])}
  /* a set named by its address: no second line */
  else if(LAD&&w(DN).length>5&&w(LAD).startsWith(w(DN)))LAD="";
  return {DN,LAD}}
/** scenes of a location: buttons from the shooting order, else as listed in the callsheet @param {{c:any,l:any}} p */
function CsLocScenes({c,l}){const mem=l._m||[l];const uniq=[...new Set(csRows(c).filter(r=>r.sc&&mem.some(m=>csSceneLoc([m],r)===m)).map(r=>String(r.sc)))];
  return uniq.length?html`<span class="csloc-s">${uniq.map(x=>html`<button type="button" class="cssc" data-cssc=${x}>${x}</button>`)}</span>`:(l.scenes?html`<small class="csloc-s">${csS(l.scenes)}</small>`:null)}
/* the open part: hints (To set, WC), side places with distance, notes and lines – the address of the head only once */
function csLocBody(c,l,LAD,HN,near){
  const hints=HN.map(n=>'<div class="ds cshnl">'+(/^wc\b/i.test(n.trim())?'<b>WC</b>':CSI.walk)+'<span>'+csAdr(csL(n).replace(/^wc\s*:\s*/i,""),"")+'</span></div>').join("");
  /* lines that only repeat the address (also written differently) are left out, a place there shows «same address» */
  const an=t=>fold(String(t||"")).replace(/https?:\/\/\S+/g,"").replace(/[^a-z0-9]/g,""),km=fold(String(LAD||"")).match(/[^\d,]*?[a-z.]{3,}\s*\d+[a-z]?\b/i),K=km?an(km[0]):"";   /* folded: «Rue de la Côte 5» too */
  const same=t=>!!K&&K.length>5&&an(t).includes(K),only=t=>same(t)&&an(t).length<=an(LAD).length+4;
  const notes=csA(l.notes).filter(n=>!HN.includes(String(n))).filter(n=>!LAD||(!fold(LAD).includes(fold(csL(n)))&&!only(csL(n)))).map(n=>'<div class="ds">'+csAdr(csL(n),"")+'</div>').join("");
  const items=csSamePlace(csA(l.items).filter(i=>String(i.text||"").trim()||i.map).filter(i=>!LAD||fold(String(i.text||"")).trim()!==fold(LAD).trim())).map(i=>{
    const lab=i._labs?i._labs.map(csL).join(" · "):csL(i.label||""),txt=i._txts?i._txts.map(csL).join("; "):csL(i.text||"");
    const body=only(txt)?(i.map?'<a href="'+esc(mapUrl(i.map))+'" target="_blank" rel="noopener noreferrer">'+esc(L("gleiche Adresse"))+'</a>':esc(L("gleiche Adresse"))):csAdr(txt,i.map,lab);
    const ic=csLabIcons(i._labs?i._labs.join(" "):i.label);return '<div class="ds">'+(ic?'<span class="csdsic">'+ic+'</span>':'')+'<b>'+esc(lab)+'</b> '+body+csItemAdr(c,i,LAD)+'</div>'}).join("");
  return hints+(l.kinds?'':csNearHTML(near))+notes+items}
/* lines at the same place (the same map link: «Tech & Crew Parking» and «2nd AD & DIT: Loge Thelma @ Tech Parking») become one line
   with both labels – only the same spot, never only a similar name */
function csSamePlace(items){const out=[],by=new Map();
  for(const i of items){const k=i.map||"";const e=k&&by.get(k);
    if(!e){const n=Object.assign({},i);out.push(n);if(k)by.set(k,n);continue}
    e._labs=(e._labs||[e.label||""]).concat([i.label||""]).filter((x,j,a)=>x&&a.indexOf(x)===j);
    e._txts=(e._txts||[e.text||""]).concat([i.text||""]).filter((x,j,a)=>String(x).trim()&&a.indexOf(x)===j)}
  return out}
/* the street address of a line with only a map link or a name («Tech Parking», «Loge Thelma @ Tech Parking 1.1»): from its position */
function csItemAdr(c,i,LAD){const a=csGeoAdr(c,i.map);if(!a||/\b\d{4}\b/.test(String(i.text||""))||(LAD&&fold(a)===fold(LAD)))return"";return '<small class="csgadr">'+esc(a)+'</small>'}
/** one location: head (code, title, floorplans, map, open button), address, scenes; the rest when opened; pink frame where the shooting is now
 * @param {{c:any,l:any,date:string,NOW:any,NEAR:any}} p */
function CsLocBox({c,l,date,NOW,NEAR}){const mem=l._m||[l];const {DN,LAD}=csLocHead(c,l,date),code=csLocCode(l),isNow=mem.includes(NOW);const HN=csA(l.notes).map(String).filter(n=>CSHN_RE.test(n.trim()));
  const badge=code&&!l._m?csPlaceH(csBadgeIn(l,l._codes),csLocHref(l,c,date),l.kinds?l.no:code+" · Set","csloc-c "+(l.kinds?"csbase":"csmot")):"";
  const title=l._m?html`<span class="dn csmset">${l._m.map(m=>html`<span><b class="csplace csmot">L${String(m.no||"").trim()}</b> ${m.name||""}</span>`)}</span>`:html`<span class="dn">${DN}</span>`;
  const bases=l._bases?html`<span class="csbases">${l._bases.map(b=>b.map?html`<a href=${mapUrl(b.map)} target="_blank" rel="noopener noreferrer" title=${"Base "+b.n}>${b.n}</a>`:html`<span>${b.n}</span>`)}</span>`:null;   /* several bases: their numbers, each its map */
  const icons=html`<span class="csloc-i"><${Raw} html=${[...new Set(mem.map(m=>csLocFp(c,m,date,true)))].join("")+(LAD||l._bases?"":csMap(l.map))+CSEXPSM}/></span>`;
  const near=[].concat(...mem.map(m=>NEAR.get(m)||[])).filter((p,i,a)=>a.findIndex(y=>y.code===p.code&&y.u===p.u)===i).sort((a,b)=>a.d-b.d);
  return html`<details class=${"dbox csloc"+(isNow?" csnowloc":"")}><summary><div class="csl1"><${Raw} html=${badge}/>${title}${bases}${icons}</div>${!l._bases&&LAD?html`<a class="csaddr" href=${mapUrl(l.map||csMapQ(LAD))} title=${LAD} target="_blank" rel="noopener noreferrer" data-nobub="1">${LAD}</a>`:null}<${CsLocScenes} c=${c} l=${l}/></summary><${Raw} html=${csLocBody(c,l,LAD,HN,near)}/></details>`}
/* the locations of the day: each one folds (name and map always visible), «Locations sehen» needed */
function csLocSec(c,x,me,SU,t){if(!vok("loc"))return"";const ls=csLocs(c),NOW=csNowLoc(c,x.date,ls),NEAR=csNear(c,ls,x.date);window.CSNOWK=NOW?NOW.no+"|"+NOW.name:"";
  const LG=csLocGroups(c,ls,x.date);if(!LG.length)return "";
  return toHTML(h(CsSec,{title:"Locations",body:html`${LG.map(l=>html`<${CsLocBox} c=${c} l=${l} date=${x.date} NOW=${NOW} NEAR=${NEAR}/>`)}`,open:true,cls:"",id:"loc",sumx:""}))}
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
/** the map of the day: the map box (Leaflet, drawn when opened) and the list of the places – each one centres the map; places without position open Google Maps
 * @param {{pts:any[],main:any[],miss:any[],BH:Map<string,string>,gm:any[]}} p */
function CsMap({pts,main,miss,BH,gm}){
  return html`<div class="csmapw"><button type="button" class="csmapbig" data-csmapbig aria-label=${L("Karte vergrössern")} title=${L("Karte vergrössern")}><${Raw} html=${CSEXP}/></button><div class="csmap0" data-csmap=${JSON.stringify(pts)} data-csgm=${gm.length?JSON.stringify(gm):undefined}></div>
    <div class="csmapl">${main.map(p=>html`<button type="button" class="csmapgo" data-csmapgo=${pts.indexOf(p)}>${BH.has(p.c)?html`<span class=${"csplace csbadge "+(/^L/.test(p.c)?"csmot":"csbase")}><${Raw} html=${BH.get(p.c)}/></span>`:html`<span class="csplace">${p.c}</span>`} ${p.n}${p.r?html` <small class="csmapr">${L("ungefähr")}</small>`:null}</button>`)}${miss.map(p=>html`<a class="csmapgo nopos" href=${mapUrl(p.u)} target="_blank" rel="noopener noreferrer"><span class="csplace">${p.c}</span> ${p.n} <small class="csmapr">${L("ohne Position – Google Maps")}</small></a>`)}</div></div>`}
function csMapSec(c,x,me,SU,t){if(window.CSMAPON===false||!vok("csmap"))return"";   /* switched off in the app settings */let out="";
  {const geo=c.geo||{},gs=c.geoSrc||{},pts=[],miss=[];const all=csRows(c),rows=all.filter(r=>r.sc);
   /* scene with start and end (= start of the next row of the shooting order) for the popup of a place */
   const span=r=>{const i=all.indexOf(r),a=csHm(r.t),nx=all.slice(i+1).find(y=>csHm(y.t));return [String(r.sc),a?a+(nx?"–"+csHm(nx.t):""):""]};
   const add=(u,code,name,sc,minor,link)=>{const g=geo[u];link=link||(/^https?:/.test(u||"")?u:"");if(!(Array.isArray(g)&&g.length>=2&&isFinite(g[0])&&isFinite(g[1])&&g[0]!==null&&g[1]!==null)){   /* only real coordinates (else the whole map failed) */if(!minor&&u&&!miss.some(x=>x.c===code))miss.push({c:code,n:name,s:sc||"",u:link,set:!minor});return}if(pts.some(x=>x.c===code&&x.p.join(",")===g.join(",")))return;
     pts.push({p:g,c:code,n:name,s:sc||"",u:link,m:minor?1:0,r:gs[u]==="rough"||gs[u]==="near"?(gs[u]==="near"?2:1):0})};
   const BH=new Map();for(const l of csLocs(c)){const code=l.kinds?l.kinds.map(csKindCode).join("·"):"L"+String(l.no||"").trim();BH.set(code,csBadgeIn(l));
     /* a set without its own map link: its position under «loc:n» (address found by the updater) – every L is on the map */
     const key=l.kinds?l.map:csSetGeo(c,l)[0];
     const lr=l.kinds?[]:rows.filter(r=>csSceneLoc([l],r)===l);const sc=l.kinds?"":[...new Set(lr.map(r=>String(r.sc)))].join(", ")||csS(l.scenes);add(key,code,l.name||"",sc,0,csLocHref(l,c,x.date));
     {const pt=pts.find(x=>x.c===code&&!x.m);if(pt&&lr.length)pt.st=lr.map(span)}   /* by its code (the link of a set without own map link is a search, never equal to the key) */
     for(const i of csA(l.items))if(i.map)add(i.map,code+" · "+(String(i.label||"").trim()||"P"),[i.label,i.text].filter(Boolean).join(" · "),"",1)}
   /* every L on the map: a set still without position (older data) roughly at the first place of the day, marked */
   {const at=(pts.find(p=>!p.m)||pts[0]||{}).p;if(at)for(const m of miss.filter(m=>m.set&&/^L/.test(m.c))){pts.push({p:at,c:m.c,n:m.n,s:m.s,u:m.u,m:0,r:2});miss.splice(miss.indexOf(m),1)}}
   /* bases with their icons on the map (sets keep their code L1 …) */
   for(const p of pts)if(!p.m&&!/^L/.test(p.c)&&BH.has(p.c))p.h=BH.get(p.c);
   /* places at the same point: the labels are stacked */
   pts.forEach((p,i)=>{p.k=pts.slice(0,i).filter(x=>x.p.join(",")===p.p.join(",")).length});
   const main=pts.filter(p=>!p.m);
   if(pts.length){const G=window.GMAPSET||{},gm=G.on?csGmFeat(pts,G):[];
     out+=toHTML(h(CsSec,{title:L("Karte"),body:html`<${CsMap} pts=${pts} main=${main} miss=${miss} BH=${BH} gm=${gm}/>`,open:false,cls:"",id:"karte",sumx:""}))}}
  return out}
/** a person's travel: (other day) · name · how · from → to · place badge · note @param {{c:any,x:any,r:any}} p */
const TRVU=/(https?:\/\/[^\s<]+)/g,trvClean=v=>String(v||"").replace(TRVU,"").replace(/\s{2,}/g," ").trim();
function CsTrv({c,x,r}){const other=r.date&&x.date&&r.date!==x.date,urls=[r.from,r.to,r.note].join(" ").match(TRVU)||[];
  const dlab=()=>{try{const d=noonDate(r.date);return (typeof WDL==="function"?WDL(d)+" ":"")+r.date.slice(8,10)+"."+r.date.slice(5,7)+"."}catch(_){return r.date}};
  const badge=()=>{let pl=null;try{pl=csPlace(c,trvClean(r.to))}catch(_){}const code=pl?csShort(pl):"";const u=urls[0]||(pl&&pl.map)||"";
    if(!u)return code?html`<${Raw} html=${csPlaceA(code,csCodeHref(code),pl&&pl.name)}/>`:null;
    return html`<a class="csplace" href=${mapUrl(u)} target="_blank" rel="noopener noreferrer" title=${pl&&pl.name||trvClean(r.to)||L("Karte")}>${code||L("Karte")}</a>`};
  return html`<div class=${"cstrv"+(other?" trvother":"")}>${other?html`<span class="trvd">${dlab()}</span>`:null}<b>${r.name||""}</b>${r.how?html`<small>${r.how}</small>`:null}<span class="r">${csRoute(trvClean(r.from),r.t1,trvClean(r.to),r.t2)}</span>${badge()}${trvClean(r.note)?html`<small class="n"><${Raw} html=${csTx(trvClean(r.note))}/></small>`:null}</div>`}
/* travel of the cast; another day's travel (a second TRAVEL CAST part of the document) after the others, with its date */
function csTravelSec(c,x,me,SU,t){const other=r=>r.date&&x.date&&r.date!==x.date;const l=csA(c.travel).slice().sort((a,b)=>(other(a)?1:0)-(other(b)?1:0));if(!l.length)return "";
  return toHTML(h(CsSec,{title:L("Anreise Cast"),body:html`${l.map(r=>html`<${CsTrv} c=${c} x=${x} r=${r}/>`)}`,open:false,cls:"",id:"travel",sumx:SU.travel}))}
/* the cast of a callsheet (1st Unit, or the 2nd Unit with its own context cqU2): the ticks of each step */
/** the switches above the cast: columns role / actor, table or cards @param {{CC:Set<string>}} p */
function CsCastTools({CC}){const tbl=csCastMode();
  return html`<span class="cscols">${[["role",L("Rolle")],["actor",L("Darsteller")]].map(([k,t])=>html`<button type="button" class="cscol" data-cscol=${k} aria-pressed=${String(!CC.has(k))}>${t}</button>`)}</span><button type="button" class="lnk cstview" data-cstview><${Raw} html=${tbl?CSI.cards:CSI.table}/><span>${L(tbl?"Als Kacheln":"Als Tabelle")}</span></button>`}
/* the cast with the ticks of each step (24-flow); On set: number, role and name pink */
export function csCastSec(c,me,title,id,su){const CC=csCols(),cast=csA(c.cast);
  const done=v=>({h:'<span class="cqall" title="'+esc(L("Alle Schritte abgeschlossen"))+'">'+esc(v)+'</span>'});
  const tbl=csTable(["#",L("Rolle"),L("Darsteller"),"P/UP","Call",L("Kostüm"),L("Maske"),"Base","On set"],cast.map(r=>{const all=window.cqAll&&window.cqAll(c,r),pk=v=>all&&v?done(v):v;
    return [pk(r.no),pk(r.role),pk(r.actor),window.cqPickup?window.cqPickup(c,r)||r.pickup:r.pickup,window.cqCall?window.cqCall(c,r)||r.call:r.call,csMk(r.wardrobe,c,"w",r)||csDurT(r.wardrobe),csMk(r.makeup,c,"m",r)||csDurT(r.makeup),window.cqBase?window.cqBase(c,r)||r.base:r.base,window.cqOnset?window.cqOnset(c,r)||r.onset:r.onset]}),3,true);
  if(!cast.length&&!tbl)return "";
  return toHTML(h(CsSec,{title,body:html`${cast.length?html`<${CsCastTools} CC=${CC}/>`:null}<${Raw} html=${tbl}/>`,open:csCastOpen(c,me),cls:(csCastMode()?"cs-astbl":"")+(CC.has("role")?" hide-role":"")+(CC.has("actor")?" hide-actor":""),id,sumx:su}))}
/* the extras with their ticks (Call, Kostüm, Maske, On set), 1st or 2nd Unit */
export function csExtrasSec(c,title,id,su){const xq=(f,c_,r,v)=>(window.xqField&&window.xqField(f,c_,r))||v;
   return csSec(title,csTable(["#",L("Rolle"),"Call",L("Kostüm"),L("Maske"),"On set"],csA(c.extras).map(r=>{const all=window.xqAll&&window.xqAll(c,r),pk=v=>all&&v?{h:'<span class="cqall" title="'+esc(L("Alle Schritte abgeschlossen"))+'">'+esc(v)+'</span>'}:v;
     return [pk(r.count),pk(r.part),xq("c",c,r,r.call),xq("w",c,r,r.wardrobe),xq("m",c,r,r.makeup),xq("o",c,r,r.onset)]}),2,true),csExOpen(),"",id,su)}
/* transport with driver and crew transport (1st Unit, or the 2nd Unit: «sfx» for the ids, «un» after the title) */
/** the drivers of the day (name and number; a number without a name: the name from other callsheets / the crew list) @param {{d:string}} p */
function CsDrivers({d}){return html`<div class="csdrvl">${String(d).replace(/o\.\s*p\.\s*D\.?\s*=\s*on personal decision/i,"").split(/\s*[|\n;]\s*/).filter(x=>x.trim()).map(x=>{const m=x.match(CSPH);let nm=m?x.replace(m[0],"").trim():x.trim();if(!nm&&m)nm=csDriverByPhone(m[0]);
  return html`<div class="csdrv-r"><span>${nm}</span>${m?html`<${Raw} html=${csTx(m[0])}/>`:null}</div>`})}</div>`}
/** «all rides done» (right «rides.alldone») @param {{c:any,x:any}} p */
function CsRideAll({c,x}){return html`<button type="button" class="pillbtn csrideall" data-rideall=${x.date||""} data-rideu=${c.u2||c._u?(c._u==="2"?"2":"1"):undefined}><${Raw} html=${window.RIDE_ICO&&RIDE_ICO[2]||""}/> ${L("Alle Fahrten als erledigt")}</button>`}
/* transport with driver and crew transport (1st Unit, or the 2nd Unit) */
export function csTransHTML(c,x,me,SU,sfx,un){let h0="";
  if(csA(c.transport).length||!sfx){const all=csA(c.transport).length&&window.RIDEACKON!==false&&typeof canPerm==="function"&&canPerm("rides.alldone");
    const tbl=csTable([L("Fahrt"),L("Fahrzeug"),L("Fahrer"),L("Mitfahrende")],csA(c.transport).map(r=>[csRideCell(x.date,r),r.vehicle,r.driver,r.passengers]),1);
    const body=html`${all?html`<${CsRideAll} c=${c} x=${x}/>`:null}<${Raw} html=${csTvBtn("trans")}/>${c.drivers?html`<${CsDrivers} d=${c.drivers}/>`:null}<${Raw} html=${tbl}/>`;
    if(all||csTvBtn("trans")||c.drivers||tbl)h0+=toHTML(h(CsSec,{title:L("Transport mit Fahrer")+(un||""),body,open:csTransOpen(c,me),cls:csTvCls("trans"),id:"trans"+(sfx||""),sumx:SU.trans}))}
  if(csA(c.crewTransport).length||!sfx)h0+=csSec(L("Transport Crew")+(un||""),csTvBtn("ctrans")+csTable([L("Fahrzeug"),L("Fahrt"),L("Personen")],csA(c.crewTransport).map(r=>[r.vehicle,{h:csRouteH(x.date,r)},r.people])   /* crew transport: no confirmation */,1),csTransOpen(c,me),csTvCls("ctrans"),"ctrans"+(sfx||""),SU.ctrans);
  return h0}
/* the shooting order: folded one short line (Call · RTS · scenes · Lunch · Wrap and a line per scene), open the rows (1st Unit, or the 2nd Unit) */
/** a short fact of the folded shooting order («Call 07:00») @param {{k:string,v:string}} p */
function CsOc({k,v}){return v?html`<span class="csoc"><i>${k}</i>${v}</span>`:null}
/** one scene of the folded shooting order: time · scene · I/E · set code · set · duration; the scene of now framed @param {{r:any,lo:any,now:boolean}} p */
function CsO1({r,lo,now}){return html`<span class=${"cso1"+(now?" now":"")}><i>${csHm(r.t)||""}</i><b>${String(r.sc)}</b>${r.ie?html`<span class=${"ie "+(typeof ieClass==="function"?ieClass(r.ie):"")}>${r.ie}</span>`:null}${lo?html`<${Raw} html=${csPlaceA("L"+String(lo.no).trim(),csLocHref(lo),lo.name||"")}/>`:null}<span class="st">${r.set||""}</span>${r.dur?html`<span class="du">${r.dur}</span>`:null}</span>`}
export function csOrderSec(c,x,t,sfx,un){const o=c.order||{},OR=csA(o.rows),sc=OR.filter(r=>r.sc).map(r=>String(r.sc));
  let lines=null;if(sc.length){const LS=csLocs(c),NR=OR[csNowIdx(OR,x.date,c._u||"1")]||null;lines=html`<span class="csoscn">${OR.filter(r=>r.sc).map(r=>html`<${CsO1} r=${r} lo=${csSceneLoc(LS,r)} now=${r===NR}/>`)}</span>`}
  const sumx=html`<span class="csosum"><${CsOc} k="Call" v=${t.crewCall||x.crewCall}/><${CsOc} k=${L("Probe")} v=${t.rehearsal}/><${CsOc} k="RTS" v=${t.rts||x.shootCall}/>${sc.length?html`<${CsOc} k=${sc.length+" "+L("Szenen")} v=${sc.length>1?sc[0]+"–"+sc[sc.length-1]:sc[0]}/>`:null}<${CsOc} k="Lunch" v=${t.lunch}/><${CsOc} k="Wrap" v=${t.wrap||x.wrap}/></span>${lines}`;
  const body=(o.title?'<p class="ghint">'+esc(o.title)+'</p>':'')+csOrderRows(o.rows,x.date,csLocs(c),true,c._u||"1");
  if(!body)return "";
  return toHTML(h(CsSec,{title:L("Drehfolge")+(un||"")+(o.pages?" · "+o.pages+" pgs":""),body,open:false,cls:"",id:"order"+(sfx||""),sumx}))}
/** one call on set: time (with note), place code, name and job; mine marked @param {{c:any,r:any,me:any}} p */
function CsCall({c,r,me}){const who={hit:t=>{const a=nmk(String(t||"")),b=nmk(String(r.name||""));return !!b&&(" "+a).includes(" "+b)}};   /* at the start of a word: «Anna Muster» is not in «Johanna Muster» */
  let pl=null;try{pl=csCallPlace(c,who,r)}catch(_){}const sc=pl?csShort(pl):"",tm=String(r.t||"").match(/^(\d{1,2}:\d{2})\s*(.*)$/);
  return html`<div class=${"cscall-r"+(me&&me.hit(r.name)?" mine":"")}><span class="t">${tm?tm[1]:(r.t||"")}${tm&&tm[2]?html`<i>${tm[2]}</i>`:null}</span><span class="cp"><${Raw} html=${sc?csPlaceA(sc,pl.map||csCodeHref(sc),pl.name):""}/></span><span class="ccw"><b>${r.name||""}</b> <small>${r.role||""}</small></span></div>`}
/* calls on set: by department, one short line per person (time · place · name · job); only «2nd IN» rows go to the part of the 2nd Unit */
function csCallsSec(c,x,me,SU,t,sfx,un){const g=new Map();for(const r of csA(c.calls).filter(r=>!(c.u2&&!String(r.t||"").trim()&&String(r.t2||"").trim()))){const k=r.dept||"";if(!g.has(k))g.set(k,[]);g.get(k).push(r)}
  if(!g.size)return "";
  const body=html`${[...g].map(([dp,l])=>html`<div class="cscall"><div class="cscall-d">${dp}</div>${l.map(r=>html`<${CsCall} c=${c} r=${r} me=${me}/>`)}</div>`)}`;
  return toHTML(h(CsSec,{title:"Calls on Set"+(un||""),body,open:false,cls:"",id:"calls"+(sfx||""),sumx:(SU||{}).calls}))}
/* information by department (mine marked) – the same for both units */
function csDeptSec(c,me,SU,sfx,un){const l=csA(c.depts).filter(r=>String(r.text||"").trim());if(!l.length)return "";
  const body=html`${l.map(r=>html`<div class=${"csdep"+(csMyDept(c,me,r.dept)?" mine":"")}><div class="csdep-h">${r.dept||""}</div><div class="csdep-t"><${Raw} html=${csTx(r.text)}/></div></div>`)}`;
  return toHTML(h(CsSec,{title:[L("Infos nach Abteilung")+(un||""),L("Infos nach Dept.")+(un||"")],body,open:false,cls:"",id:"dept"+(sfx||""),sumx:(SU||{}).dept}))}
function csVehSec(c,SU,sfx,un){return csSec(L("Fahrzeuge")+(un||""),csTable([L("Fahrzeug"),"Via","Call","RTS"],csA(c.vehicles).map(r=>[r.name,r.via,r.call,r.rts])),false,"",sfx?"veh"+sfx:"",(SU||{}).veh)}
/* the 1st Unit of a callsheet with a 2nd Unit: its rides only (all of them in _rides) – one copy per callsheet while its rides stay (the drawing caches need the same object) */
const CS1=new WeakMap();
function cs1Of(c0){const h=CS1.get(c0);if(h&&h.tr===c0.transport&&h.ct===c0.crewTransport)return h.c;
  const c=Object.assign({},c0,csRidesFor(c0,"1"),{_orig:c0,_rides:{transport:c0.transport,crewTransport:c0.crewTransport}});CS1.set(c0,{tr:c0.transport,ct:c0.crewTransport,c});return c}
/* the tiles of one unit exactly as its callsheet shows them (Today, side box, callsheet with both units): the 1st Unit with its own rides,
   the 2nd Unit as its own callsheet (csU2Dispo: its times, places and rides) */
export function csUnitTiles(x,day,u,me){const c0=x&&x.cs;if(!c0)return "";if(x.date)c0._date=x.date;
  if(u==="2"){const x2=typeof window.csU2Dispo==="function"?window.csU2Dispo(x,day):null;return x2?csTilesHTML(x2,day,x2.cs,me):""}
  return csTilesHTML(x,day,(c0.u2||dayItems(day,"2").length)&&typeof csRidesFor==="function"?cs1Of(c0):c0,me)}
window.csUnitTiles=csUnitTiles;
/** the head of the callsheet (without «Mein Tag»: title, date, unit buttons) @param {{mineN:number,dtitle:string,date:string}} p */
function CsHead({mineN,dtitle,date}){return !mineN?html`<div class="dsp-head"><div><h2><${Raw} html=${dtitle}/></h2><div class="date drow"><span>${fmtDate(date)}</span><${Raw} html=${UNITBAR}/></div></div></div>`:UNITBAR?html`<div class="date drow dsp-units"><span></span><${Raw} html=${UNITBAR}/></div>`:null}
/** contact on set: the name itself is the call link (only with the phone right); one line, fitted to the width (csFitContact) @param {{ct:any}} p */
function CsContact({ct}){const tel=telNum(ct.phone),call=tel&&vok("phone"),nm=ct.name?ct.name:(call?ct.phone:html`<${Raw} html=${csTx(ct.phone)}/>`);   /* only the number: plain inside the call link (a link in a link broke the line) */
  return html`<div class="cscontact"><span class="csct-in"><b>${L("Kontakt am Set")}:</b> ${call?html`<a class="csct" href=${"tel:"+tel} title=${L("Anrufen")}><${Raw} html=${CSI.phone}/>${nm}</a>`:nm}${ct.role?html` <small>· ${ct.role}</small>`:null}</span></div>`}
/** «Mein Tag»: its red box carries the title; on the shooting day first the scene being shot now @param {{mine:string[],me:any,dtitle:string,date:string,nb:any}} p */
function CsMineSec({mine,me,dtitle,date,nb}){
  return html`<section class="dsec csme" id="cs-mein" aria-label=${L("Mein Tag")+" · "+me.name}><h2 class="csme-h"><${Raw} html=${dtitle}/> <span>${fmtDate(date)}</span></h2>${nb?html`<div class="csme-r csme-now"><span class="k">${L("Jetzt")}</span><span class="v"><${Raw} html=${nb.ev||"<b>"+nb.sc+"</b>"+nb.place+" <small>"+nb.set+"</small>"}/></span></div>`:null}<${Raw} html=${mine.join("")}/></section>`}
export function renderCS(x,day){const c0=x.cs||{};if(x.date)c0._date=x.date;
  /* a day with a 2nd Unit: the 1st Unit shows only its rides (and those of both); the 2nd Unit gets its own in csU2Dispo */
  const c=c0._u!=="2"&&typeof csRidesFor==="function"&&(c0.u2||dayItems(day,"2").length)?cs1Of(c0):c0,t=c.times||{},me=csMe();let out="";if(x.date)c._date=x.date;   /* the day first: «Mein Tag» (travel of this day only) and the cast ticks need it */setCSTR(c.tr||null);setCSCUR({c,date:x.date||"",me,addr:new Map()});
  let JB="";
  /* jump bar (sticky) and search over the whole callsheet */
   JB=csJumpBar(c,x,me,null,t);
  /* head: as the top of the callsheet */
  /* with «my day»: its red box carries the title (Mein Drehtag 1 · date), no head line on top */
  const mineN=me?csMine(c,me).length:0;const dtitle=(mineN?esc(L("Mein"))+' ':'')+esc((day&&day.kind==="shoot"&&!/2nd Unit/.test(String(x.label||""))?dayTitle(day):"")||x.label||(day&&day.label)||"Callsheet");   /* «Drehtag 2» – the same wording as the Drehplan */
  out+=toHTML(h(CsHead,{mineN,dtitle,date:x.date}));
  /* both units shown: the 1st Unit gets the same head as the 2nd Unit below (the two parts look alike) */
  if(c._u!=="2"&&S.pu["2"]&&(c0.u2||dayItems(day,"2").length))out+=toHTML(html`<div class="csu2-head csu1-head" id="cs-u1"><h2>1st Unit</h2><span>${x.date?fmtDate(x.date):""}</span></div>`);
  if(x.date===csShootDay())out+=nowCardHTML(x.date,"csnowc",c._u);   /* the callsheet of today: «Jetzt» above the tiles, as in Today */
  out+=csTilesHTML(x,day,c,me);
  /* contact on set: the name itself is the call link (only with the phone right) */
  if(c.contact&&(c.contact.name||c.contact.phone))out+=toHTML(h(CsContact,{ct:c.contact}));
  /* radio channels below the contact: one chip per channel («1 AD / AL», «2 Chat» …) */
  out+=csRadioHTML(c.radio);
  /* my day */
  /* my day: on the shooting day first the scene being shot now (with its place) */
  const NS=csNowScene(x);window.CSNOWSC=NS?(NS.ev||String(NS.sc)):"";
  if(me){const mine=csMine(c,me);if(mine.length)out+=toHTML(h(CsMineSec,{mine,me,dtitle,date:x.date,nb:NS&&window.nowSee&&window.nowSee()?csNowBits(NS,c,x.date):null}))}
  out+='<!--CASTPOS-->';   /* Maske / Kostüm: the cast right below «Mein Drehtag» */
  /* key people of the day */
  /* folded parts: sums and short facts in one line */
   const SU=csSums(c,x);
   out+=csTeamSec(c,x,me,SU,t);
  /* locations */
  /* locations: each one folds (name and map always visible), a button opens or closes all */
   out+=csLocSec(c,x,me,SU,t);
  /* map of the day: every location on its own (code, scenes, name), parking and other points of the sets small */
   out+=csMapSec(c,x,me,SU,t);
  /* production information */
  if(vok("info"))out+=csSec(L("Produktionsinfos"),csA(c.info).map(p=>'<p>'+csTx(csL(p))+'</p>').join(""),true,"csinfo");
  /* shooting order */
  out+=csOrderSec(c,x,t);
  /* cast, extras, vehicles */
  const CC=csCols();
  if(c&&x&&x.date)c._date=x.date;   /* the day for the cast ticks */
  {const castH=csCastSec(c,me,"Cast","cast",SU.cast);if(csCmFirst(c,me)&&out.includes('<!--CASTPOS-->'))out=out.replace('<!--CASTPOS-->',castH);else out+=castH}
  out=out.replace('<!--CASTPOS-->','');
  /* travel of the cast: one line per person (name · how · from → to · note), the place as short code (L1, Base …) with the map */
   out+=csTravelSec(c,x,me,SU,t);
  /* extras: Call (how many are there), Kostüm, Maske, On set to tick like the cast (24-flow); On set = the group grey, count and role pink */
  out+=csExtrasSec(c,L("Komparsen"),"extras",SU.extras);
  out+=csVehSec(c,SU);
  /* transport and travel */
  /* Fahrten Manager: all rides of the day as done in one go */
  out+=csTransHTML(c,x,me,SU);
  /* information by department */
  out+=csDeptSec(c,me,SU);
  /* calls on set */
  /* calls on set: by department, one short line per person (time · name · job) */
   out+=csCallsSec(c,x,me,SU,t);
  /* totals, notes, radio */
  const nb=[c.total?'<p><b>'+esc(c.total)+'</b></p>':'',...csA(c.notes).map(n=>'<p>'+csTx(n)+'</p>'),''].join("");
  /* notes and the weather option of the document in one part */
  const WX=csA(x.sections).concat(csA(c.sections)).filter(sec=>/weather|wetter|météo|meteo/i.test(String(sec&&sec.title||"")));
  const wxb=WX.map(sec=>'<h4 class="cswx">'+esc(String(sec.title||""))+'</h4>'+csA(sec.rows).map(r=>Array.isArray(r)?r:[r]).filter(r=>r.some(cc=>String(cc==null?"":cc).trim())).map(r=>'<p>'+r.map(cc=>csTx(cc)).join(" · ")+'</p>').join("")).join("");
  out+=csSec(WX.length?L("Notizen & Wetter"):L("Notizen"),nb+wxb,false,"","",SU.notes);
  /* emergency (hospital) when the callsheet has it */
  if(x.hospital&&(x.hospital.name||x.hospital.phone))out+='<section class="dsec"><h3 class="dh">'+L('Notfall')+'</h3><div class="people"><div class="p"><div class="hd"><span class="nm">'+esc(x.hospital.name||L("Spital"))+'</span><span class="role">'+L('Nächstes Spital')+'</span></div>'+(x.hospital.address?'<div class="ct"><a href="'+maps([x.hospital.name,x.hospital.address].filter(Boolean).join(", "))+'" target="_blank" rel="noopener noreferrer">'+esc(x.hospital.address)+'</a></div>':'')+(x.hospital.phone?'<div class="ct"><a class="hosp" href="tel:'+esc(String(x.hospital.phone).replace(/\s/g,""))+'"><span>'+esc(x.hospital.phone)+'</span></a></div>':'')+'</div></div></section>';
  /* anything else of the document */
  for(const sec of csA(x.sections).concat(csA(c.sections)).filter(s0=>!WX.includes(s0))){const rows=csA(sec&&sec.rows).map(r=>Array.isArray(r)?r:[r]).filter(r=>r.some(cc=>String(cc==null?"":cc).trim()));if(!rows.length)continue;
    out+=csSec(String(sec.title||""),rows.map(r=>'<p>'+r.map(cc=>csTx(cc)).join(" · ")+'</p>').join(""),false)}
  /* the 2nd Unit (read apart): its own part below the 1st Unit */
  if(c._u!=="2"&&S.pu["2"])try{out+=csU2HTML(x,c0,day,me,{order:(c2,o2)=>csOrderSec(Object.assign({},c2,{order:o2}),{date:x.date},c2.times||{},"u2"," · 2nd Unit"),trans:(c2,x2,me2,SU2)=>{const only=r=>csRideUnit(c0,r)==="2",tr=csA(c0.transport).filter(only),ct=csA(c0.crewTransport).filter(only);   /* both units shown: below only the rides of the 2nd Unit alone (the shared ones are above) */
    return tr.length||ct.length?csTransHTML(Object.assign({},c2,{transport:tr,crewTransport:ct}),x2,me2,SU2,"u2"," · 2nd Unit"):""},cast:csCastSec,extras:csExtrasSec,tiles:()=>csUnitTiles(x,day,"2",me),veh:c2=>csVehSec(c2,{},"u2"," · 2nd Unit"),dept:c2=>csDeptSec(c2,me,{},"u2"," · 2nd Unit"),calls:c2=>csCallsSec(c2,x,me,{},c2.times||{},"u2"," · 2nd Unit"),loc:(c2,x2,me2,SU2,t2)=>{const k=window.CSNOWK;try{return csLocSec(c2,x2,me2,SU2,t2)}finally{window.CSNOWK=k}}})}catch(err){console.warn("2nd Unit",err);out+='<section class="csu2"><div class="csu2-head"><h2>2nd Unit</h2></div><p class="ghint">'+esc(L("Zurzeit nicht lesbar"))+'</p></section>'}   /* an error is shown, never the 2nd Unit silently missing */
  /* on the shooting day: once per visit straight to the running row */
  if(x.date===csShootDay()){window.__csScr=window.__csScr||{};if(!window.__csScr[x.date]){window.__csScr[x.date]=1;setTimeout(()=>{const n=document.querySelector(".csview .csorder li.now");if(n)n.scrollIntoView({block:"center",behavior:"smooth"})},400)}}
  return JB+'<div class="csview">'+out+'</div>'}
/* the callsheet as components (framework): each part of the day (head, tiles, Mein Tag, team, locations, map, order, cast …) its own,
   drawn again only when it changed (13-crew-views.js: renderDispo puts the parts into the island) */
ISLANDS.cs=Sections;
