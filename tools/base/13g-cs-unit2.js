/* the 2nd Unit of a callsheet (cs.u2, read apart from the 1st Unit): its own part below the callsheet of the 1st Unit –
   times, contact on set, sets, shooting order, cast, extras, vehicles, calls «2nd IN», department infos (the prevision is kept in the data, shown neither for the 1st Unit) */
import {L,camFold,esc,fmtDate,norm,safeUrl} from "./10-core.js";
import {nameHit} from "./11-schedule-prep.js";
import {schedIndex} from "./17-scene-reader.js";
import {csA,csL,csSec,csTable,csTx} from "./13a-callsheet.js";
import {csLocs,csOrderRows} from "./13c-cs-places.js";
import {vok} from "./14-render.js";

const u2tile=(k,v,big)=>v?'<div class="dt'+(big?' big':'')+'"><div class="k">'+esc(k)+'</div><div class="v">'+esc(String(v))+'</div></div>':'';
/* a set of the 2nd Unit: code, name, scenes, map; its lines (parking, base …) below */
function u2Loc(l){if(!l||typeof l!=="object")return"";
  const a=(href,txt)=>href?'<a href="'+esc(safeUrl(href))+'" target="_blank" rel="noopener noreferrer">'+txt+'</a>':txt;
  return '<div class="csu2-l"><div class="csu2-lh">'+a(l.map,'<b>'+esc([l.no,l.name].filter(Boolean).join(" · "))+'</b>')+(l.scenes?' <small>'+esc(String(l.scenes))+'</small>':'')+'</div>'+
    csA(l.items).filter(i=>i&&(i.label||i.text)).map(i=>'<div class="csu2-li">'+(i.label?'<span>'+esc(csL(String(i.label)))+'</span> ':'')+(i.text?a(i.map,csTx(csL(String(i.text)))):i.map?a(i.map,esc(L("Karte"))):'')+'</div>').join("")+
    csA(l.notes).map(n=>'<div class="csu2-li"><small>'+csTx(csL(String(n)))+'</small></div>').join("")+'</div>'}
/* rides of a day with two units: which unit a ride belongs to – «1», «2», or "" (both / not sure: shown with both)
   1. its place: «… 2nd UNIT», «B UNIT» / «… 1st UNIT», «A UNIT» in from or to (or the mark «u» of the reading)
   2. else its people: someone only in one unit (cast of that unit, a call only «1st IN» or only «2nd IN») decides – people of both units: both */
const UPEOPLE=new WeakMap();
function csUnitPeople(c){if(UPEOPLE.has(c))return UPEOPLE.get(c);const m=new Map(),add=(n,u)=>{n=String(n||"").trim();if(n.length<3)return;if(!m.has(n))m.set(n,new Set());m.get(n).add(u)};
  for(const r of csA(c.cast))add(r&&r.actor,"1");
  for(const r of csA(c.u2&&c.u2.cast))add(r&&r.actor,"2");
  for(const r of csA(c.calls)){if(!r)continue;if(String(r.t||"").trim())add(r.name,"1");if(String(r.t2||"").trim())add(r.name,"2")}
  const out=[...m].filter(([,u])=>u.size===1).map(([n,u])=>({hit:nameHit(n),u:[...u][0]}));UPEOPLE.set(c,out);return out}
export function csRideUnit(c,r){if(!r)return "";if(r.u==="1"||r.u==="2")return r.u;
  const tx=[r.from,r.to].map(v=>String(v||"")).join(" ");
  const p2=/\b(2nd|2n?d|b)[\s-]*unit\b|\bunit[\s-]*(2|b)\b/i.test(tx),p1=/\b(1st|1n?d|a)[\s-]*unit\b|\bunit[\s-]*(1|a)\b/i.test(tx);
  if(p1&&p2)return "";   /* from the 2nd Unit to the 1st (a truck moving over): both */
  if(p2)return "2";if(p1)return "1";
  const who=String(r.passengers||r.people||"");if(!who.trim())return "";let a=0,b=0;
  for(const p of csUnitPeople(c))if(p.hit(who)){if(p.u==="1")a++;else b++}
  return b&&!a?"2":a&&!b?"1":""}
/* the rides of unit u (and those of both) */
export function csRidesFor(c,u){const ok=r=>{const x=csRideUnit(c,r);return !x||x===u};return {transport:csA(c.transport).filter(ok),crewTransport:csA(c.crewTransport).filter(ok)}}
window.csRidesFor=csRidesFor;window.csRideUnit=csRideUnit;
/* the shooting order of the 2nd Unit from its Google Sheet (day.unit2, more exact than the callsheet): rows like those of the callsheet */
/* a scene of the sheet completed with the Drehplan (synopsis, cast, pages, I/E, set …, as in the 2nd Unit of the Drehplan): the sheet's own values win –
   first the same scene on this day with a synopsis (another unit), else its first scheduling with one */
const u2Full=(i,date)=>{let l=[];try{l=csA(schedIndex()[norm(i.sc)])}catch(_){}const ok=y=>y&&y.it&&y.it!==i&&y.it.d;
  const b=(l.find(y=>ok(y)&&y.d&&y.d.date===date)||l.find(ok)||{}).it;if(!b)return i;const o={};for(const k of ["d","cast","pg","ie","set","loc","d_fr","d_it","d_en","d_hi"])if(b[k]!=null)o[k]=b[k];   /* only the facts of the scene – not its time, duration or camera setups */
  for(const k in i){const v=i[k];if(v!=null&&v!==""&&!(Array.isArray(v)&&!v.length))o[k]=v}return o};
const u2Rows=day=>camFold(csA(day&&day.unit2&&day.unit2.items).filter(i=>i&&typeof i==="object")).map(i=>i.sc?u2Full(i,day.date):i).map(i=>i.sc?{t:i.t||"",sc:i.sc,ie:i.ie||"",set:i.set||"",syn:i.d||"",pgs:i.pg||"",dur:i.dur||"",dir:i.dir||"",cast:Array.isArray(i.cast)?i.cast.join(", "):(i.cast||""),notes:i.notes||"",camx:csA(i.camx)}:{t:i.t||"",text:i.n||i.text||""}).filter(r=>r.sc||r.text);
export function csU2HTML(x,c,day,me,F){F=F||{};const u0=c&&c.u2,sh=u2Rows(day);if((!u0||typeof u0!=="object")&&!sh.length)return"";
  const u=u0&&typeof u0==="object"?u0:{},t=u.times||{},o=u.order||{},LS=csLocs({locations:csA(u.locations)});let h="";
  h+='<div class="csu2-head" id="cs-u2"><h2>2nd Unit</h2><span>'+(x.date?fmtDate(x.date):'')+(u.ad?' · 1st AD '+esc(String(u.ad)):'')+'</span></div>';
  const c2=typeof window.cqU2==="function"&&c&&c.u2?window.cqU2(c):null;
  /* the tiles as in the 1st Unit (times of the 2nd Unit, sun, weather) */
  if(c2&&F.tiles)h+=F.tiles({date:x.date,sr:x.sr,ss:x.ss},day,c2,me).replace('id="cs-zeiten"','id="cs-u2zeiten"');
  else if(u.crewCall||t.rts||t.lunch||t.wrap)h+='<div class="dtiles cstiles">'+u2tile("Crew Call",u.crewCall,true)+u2tile("RTS",t.rts)+u2tile("Lunch",t.lunch)+u2tile("Wrap",t.wrap)+'</div>';
  const ct=u.contact;if(ct&&(ct.name||ct.phone)){const tel=String(ct.phone||"").replace(/[^\d+]/g,"");
    h+='<div class="cscontact"><span class="csct-in"><b>'+esc(L("Kontakt am Set"))+':</b> '+(tel&&vok("phone")?'<a class="csct" href="tel:'+esc(tel)+'">'+esc(ct.name||ct.phone)+'</a>':esc(ct.name||""))+(ct.role?' <small>· '+esc(ct.role)+'</small>':'')+'</span></div>'}
  /* the locations as in the 1st Unit (sets with their places, maps, «Jetzt hier») */
  if(c2&&F.loc&&csA(u.locations).length)h+=F.loc(c2,x,me,{},{}).replace('id="cs-loc"','id="cs-u2loc"').replace('<h3 class="dh">Locations</h3>','<h3 class="dh">Locations · 2nd Unit</h3>');
  else if(vok("loc")&&csA(u.locations).length)h+=csSec("Locations · 2nd Unit",csA(u.locations).map(u2Loc).join(""),false,"","u2loc");
  /* the order: from the 2nd-Unit sheet; without it the one of the callsheet */
  if(c2&&F.order)h+=F.order(c2,sh.length?{title:"",pages:o.pages||"",rows:sh}:o);
  else h+=csSec(L("Drehfolge")+" · 2nd Unit"+(!sh.length&&o.pages?' · '+o.pages+' pgs':''),(sh.length?'<p class="ghint">'+esc(L("Aus dem 2nd-Unit-Sheet"))+'</p>'+csOrderRows(sh,x.date,LS,true,"2"):(o.title?'<p class="ghint">'+esc(o.title)+'</p>':'')+csOrderRows(o.rows,x.date,LS,true,"2")),true,"","u2order");
  /* cast and extras with their ticks, as in the 1st Unit: in the context of the 2nd Unit (own ids, cqU2 in 24-flow) */
  if(c2&&F.cast)h+=F.cast(c2,me,"Cast · 2nd Unit","u2cast","");
  else h+=csSec("Cast · 2nd Unit",csTable(["#",L("Rolle"),L("Darsteller"),"P/UP","Call",L("Kostüm"),L("Maske"),"Base","On set"],csA(u.cast).map(r=>[r.no,r.role,r.actor,r.pickup,r.call,r.wardrobe,r.makeup,r.base,r.onset]),3,true),false,"","u2cast");
  if(c2&&F.extras)h+=F.extras(c2,L("Komparsen")+" · 2nd Unit","u2extras","");
  else h+=csSec(L("Komparsen")+" · 2nd Unit",csTable(["#",L("Rolle"),"Call",L("Kostüm"),L("Maske"),"On set"],csA(u.extras).map(r=>[r.count,r.part,r.call,r.wardrobe,r.makeup,r.onset]),2,true),false,"","u2extras");
  h+=csSec(L("Fahrzeuge")+" · 2nd Unit",csTable([L("Fahrzeug"),"Via","Call","RTS"],csA(u.vehicles).map(r=>[r.name,r.via,r.call,r.rts])),false,"","u2veh");
  /* its rides (transport with driver, crew transport) as in the 1st Unit */
  if(c2&&F.trans)h+=F.trans(c2,x,me,{});
  /* calls on set: the column «2nd IN» */
  {const g=new Map();for(const r of csA(c.calls).filter(r=>r&&String(r.t2||"").trim())){const k=r.dept||"";if(!g.has(k))g.set(k,[]);g.get(k).push(r)}
   h+=csSec("Calls on Set · 2nd Unit",[...g].map(([dp,l])=>'<div class="cscall"><div class="cscall-d">'+esc(dp)+'</div>'+l.map(r=>'<div class="cscall-r"><span class="t">'+esc(String(r.t2))+'</span><span class="cp"></span><span class="ccw"><b>'+esc(r.name||"")+'</b> <small>'+esc(r.role||"")+'</small></span></div>').join("")+'</div>').join(""),false,"","u2calls")}
  h+=csSec(L("Infos nach Abteilung")+" · 2nd Unit",csA(c.depts).filter(r=>String(r.text2||"").trim()).map(r=>'<div class="csdep"><div class="csdep-h">'+esc(r.dept||"")+'</div><div class="csdep-t">'+csTx(r.text2)+'</div></div>').join(""),false,"","u2dept");
  return '<section class="csu2">'+h+'</section>'}
/* only the 2nd Unit chosen (unit buttons): the callsheet of the 2nd Unit on its own, drawn by the same view as the 1st Unit (renderCS) –
   its times, contact, sets, cast and extras (cqU2), its shooting order (sheet, else callsheet), the calls «2nd IN» and the department infos
   of the 2nd Unit; transport, travel, production infos and notes as on the callsheet. null: no 2nd Unit that day */
export function csU2Dispo(x,day){const c=x&&x.cs;if(!c||typeof c!=="object")return null;c._date=x.date;
  const sh=u2Rows(day),c2=typeof window.cqU2==="function"&&c.u2?window.cqU2(c):null;if(!c2&&!sh.length)return null;
  const u=c.u2&&typeof c.u2==="object"?c.u2:{};
  const base=c2||Object.assign({},c,{cast:[],extras:[],vehicles:[],locations:[],times:{},contact:null,order:{},_u:"2"});
  const cs=Object.assign({},base,csRidesFor(c,"2"),{_orig:c,_rides:{transport:c.transport,crewTransport:c.crewTransport},u2:null,_u:"2",_date:x.date,prevision:u.prevision||{},
    order:sh.length?{title:"",pages:(u.order||{}).pages||"",rows:sh}:(u.order||{}),
    calls:csA(c.calls).filter(r=>r&&String(r.t2||"").trim()).map(r=>Object.assign({},r,{t:r.t2,t2:""})),
    depts:csA(c.depts).filter(r=>r&&String(r.text2||"").trim()).map(r=>Object.assign({},r,{text:r.text2,text2:""}))});
  const t=cs.times||{};
  return Object.assign({},x,{cs,crewCall:t.crewCall||"",shootCall:t.rts||"",wrap:t.wrap||"",label:(x.label||(day&&day.label)||"Callsheet")+" · 2nd Unit"})}
window.csU2Dispo=csU2Dispo;
window.u2RowsOf=u2Rows;
