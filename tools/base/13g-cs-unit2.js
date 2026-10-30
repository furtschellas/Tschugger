/* the 2nd Unit of a callsheet (cs.u2, read apart from the 1st Unit): its own part below the callsheet of the 1st Unit –
   times, contact on set, sets, shooting order, cast, extras, vehicles, calls «2nd IN», department infos (the prevision is kept in the data, shown neither for the 1st Unit) */
import {camFold,esc,fmtDate,L,mapUrl,norm,safeUrl,telNum} from "./10-core.js";
import {nameHit} from "./11-schedule-prep.js";
import {schedIndex} from "./17-scene-reader.js";
import {csA,csL,csSec,csTable,csTx} from "./13a-callsheet.js";
import {csLocs,csOrderRows} from "./13c-cs-places.js";
import {vok} from "./14-render.js";
import {csSetupFirst} from "./20-data-start.js";

const u2hm=v=>{const m=String(v||"").match(/(\d{1,2})[:.](\d{2})/);return m?String(+m[1]).padStart(2,"0")+":"+m[2]:""};
/* rides of a day with two units: which unit a ride belongs to – «1», «2», or "" (both / not sure: shown with both)
   1. its place: «… 2nd UNIT», «B UNIT» / «… 1st UNIT», «A UNIT» in from or to (or the mark «u» of the reading)
   2. else its people: someone only in one unit (cast of that unit, a call only «1st IN» or only «2nd IN») decides – people of both units: both */
const UPEOPLE=new WeakMap();
function csUnitPeople(c){if(UPEOPLE.has(c))return UPEOPLE.get(c);const m=new Map(),add=(n,u)=>{n=String(n||"").trim();if(n.length<3)return;if(!m.has(n))m.set(n,new Set());m.get(n).add(u)};
  for(const r of csA(c.cast))if(r&&r.u!=="2")add(r.actor,"1");   /* a row marked for the 2nd Unit is not the 1st (as the server) */
  for(const r of csA(c.u2&&c.u2.cast))add(r&&r.actor,"2");
  for(const r of csA(c.calls)){if(!r)continue;if(String(r.t||"").trim())add(r.name,"1");if(String(r.t2||"").trim())add(r.name,"2")}
  /* the infos by department: a person named in the column «1st UNIT» / «2nd UNIT» (also extra staff from the lists of the callsheet) */
  {const names=[...new Set(csA(c.calls).map(r=>r&&r.name).concat(...csA(c.lists).map(l=>String(Array.isArray(l&&l.names)?l.names.join(","):(l&&l.names)||"").split(/\s*[,;]\s*/))).map(n=>String(n||"").trim()).filter(n=>n.length>=5&&/\s/.test(n)))];
   for(const d of csA(c.depts)){if(!d)continue;const t1=String(d.text||""),t2=String(d.text2||"");if(!t1.trim()&&!t2.trim())continue;for(const n of names){const h=nameHit(n);if(t1&&h(t1))add(n,"1");if(t2&&h(t2))add(n,"2")}}}
  const out=[...m].filter(([,u])=>u.size===1).map(([n,u])=>({hit:nameHit(n),u:[...u][0]}));UPEOPLE.set(c,out);return out}
export function csRideUnit(c,r){if(!r)return "";if(r.u==="1"||r.u==="2")return r.u;
  const tx=[r.from,r.to].map(v=>String(v||"")).join(" ");
  const p2=/\b(2nd|2n?d|b)[\s-]*unit\b|\bunit[\s-]*(2|b)\b/i.test(tx),p1=/\b(1st|1n?d|a)[\s-]*unit\b|\bunit[\s-]*(1|a)\b/i.test(tx);
  if(p1&&p2)return "";   /* from the 2nd Unit to the 1st (a truck moving over): both */
  if(p2)return "2";if(p1)return "1";
  const who=String(r.passengers||r.people||"");if(!who.trim())return "";
  /* 2. the pickup of a cast row: the ride of that actor at its P/UP time belongs to the unit of that row (also for people in both units) */
  {const t1=u2hm(r.t1),us=new Set();if(t1){for(const [l,u] of [[csA(c.cast).filter(x=>x&&x.u!=="2"),"1"],[csA(c.u2&&c.u2.cast),"2"]])for(const x of l)if(x&&x.actor&&u2hm(x.pickup)===t1&&nameHit(String(x.actor))(who))us.add(u)}
   if(us.size===1)return [...us][0]}
  /* 3. long before the crew call of the later unit (90 min) and the other unit has started: the earlier unit (morning rides of the 2nd Unit) */
  {const c1=u2hm((c.times||{}).crewCall),c2=u2hm(c.u2&&(c.u2.crewCall||(c.u2.times||{}).crewCall)),t1=u2hm(r.t1),m=v=>+v.slice(0,2)*60+ +v.slice(3);
   if(c1&&c2&&t1&&c1!==c2){const [e,l,eu]=m(c2)<m(c1)?[c2,c1,"2"]:[c1,c2,"1"];if(m(t1)>=m(e)-120&&m(t1)<m(l)-90)return eu}}
  let a=0,b=0;
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
const u2Rows0=day=>camFold(csA(day&&day.unit2&&day.unit2.items).filter(i=>i&&typeof i==="object")).map(i=>i.sc?u2Full(i,day.date):i).map(i=>i.sc?{t:i.t||"",sc:i.sc,ie:i.ie||"",set:i.set||"",syn:i.d||"",pgs:i.pg||"",dur:i.dur||"",dir:i.dir||"",cast:Array.isArray(i.cast)?i.cast.join(", "):(i.cast||""),notes:i.notes||"",camx:csA(i.camx)}:{t:i.t||"",text:i.n||i.text||""}).filter(r=>r.sc||r.text);
/* the calls («2nd IN») and department infos («2nd UNIT») of the 2nd Unit, as rows of their own (the same parts draw them as in the 1st Unit) */
const csU2Calls=c=>csA(c&&c.calls).filter(r=>r&&String(r.t2||"").trim()).map(r=>Object.assign({},r,{t:r.t2,t2:""}));
const csU2Depts=c=>csA(c&&c.depts).filter(r=>r&&String(r.text2||"").trim()).map(r=>Object.assign({},r,{text:r.text2,text2:""}));
/* the rows of the 2nd-Unit sheet, with the setup as a step of its own (crew call of the 2nd Unit → first scene, as in the 1st Unit) */
const u2Rows=(day,c)=>{const u=c&&c.u2&&typeof c.u2==="object"?c.u2:{};return csSetupFirst(u2Rows0(day),u.crewCall||(u.times||{}).crewCall,day&&day.date)};
/* the 2nd Unit below the 1st on the callsheet: its own callsheet (csU2Dispo – times, places, order, cast, rides, calls «2nd IN», infos «2nd UNIT»)
   drawn with the same parts F as the 1st Unit, in the same order – one way only (before: a second, simpler drawing for missing parts) */
export function csU2HTML(x,c,day,me,F){F=F||{};const x2=csU2Dispo(x,day);if(!x2)return"";const c2=x2.cs,u=(c&&c.u2&&typeof c.u2==="object")?c.u2:{};
  const part=(k,...a)=>{if(typeof F[k]!=="function")return"";try{return F[k](...a)||""}catch(err){console.warn("2nd Unit "+k,err);return ""}};   /* one part failing never hides the others */
  let h='<div class="csu2-head" id="cs-u2"><h2>2nd Unit</h2><span>'+(x.date?fmtDate(x.date):'')+(u.ad?' · 1st AD '+esc(String(u.ad)):'')+'</span></div>';
  h+=part("tiles").replace('id="cs-zeiten"','id="cs-u2zeiten"');
  const ct=c2.contact;if(ct&&(ct.name||ct.phone)){const tel=telNum(ct.phone);
    h+='<div class="cscontact"><span class="csct-in"><b>'+esc(L("Kontakt am Set"))+':</b> '+(tel&&vok("phone")?'<a class="csct" href="tel:'+esc(tel)+'">'+esc(ct.name||ct.phone)+'</a>':esc(ct.name||""))+(ct.role?' <small>· '+esc(ct.role)+'</small>':'')+'</span></div>'}
  if(csA(c2.locations).length)h+=part("loc",c2,x,me,{},{}).replace('id="cs-loc"','id="cs-u2loc"').replace('<h3 class="dh">Locations</h3>','<h3 class="dh">Locations · 2nd Unit</h3>');
  h+=part("order",c2,c2.order||{});
  h+=part("cast",c2,me,"Cast · 2nd Unit","u2cast","");
  h+=part("extras",c2,L("Komparsen")+" · 2nd Unit","u2extras","");
  h+=part("veh",c2);
  h+=part("trans",c2,x,me,{});
  h+=part("dept",c2);
  h+=part("calls",c2);
  return '<section class="csu2">'+h+'</section>'}
/* only the 2nd Unit chosen (unit buttons): the callsheet of the 2nd Unit on its own, drawn by the same view as the 1st Unit (renderCS) –
   its times, contact, sets, cast and extras (cqU2), its shooting order (sheet, else callsheet), the calls «2nd IN» and the department infos
   of the 2nd Unit; transport, travel, production infos and notes as on the callsheet. null: no 2nd Unit that day */
export function csU2Dispo(x,day){const c=x&&x.cs;if(!c||typeof c!=="object")return null;c._date=x.date;
  const sh=u2Rows(day,c),c2=typeof window.cqU2==="function"&&c.u2?window.cqU2(c):null;if(!c2&&!sh.length)return null;
  const u=c.u2&&typeof c.u2==="object"?c.u2:{};
  const base=c2||Object.assign({},c,{cast:[],extras:[],vehicles:[],locations:[],times:{},contact:null,order:{},_u:"2"});
  const cs=Object.assign({},base,csRidesFor(c,"2"),{_orig:c,_rides:{transport:c.transport,crewTransport:c.crewTransport},u2:null,_u:"2",_date:x.date,prevision:u.prevision||{},
    order:sh.length?{title:"",pages:(u.order||{}).pages||"",rows:sh}:(u.order||{}),
    calls:csU2Calls(c),depts:csU2Depts(c)});
  const t=cs.times||{};
  return Object.assign({},x,{cs,crewCall:t.crewCall||"",shootCall:t.rts||"",wrap:t.wrap||"",label:(x.label||(day&&day.label)||"Callsheet")+" · 2nd Unit"})}
window.csU2Dispo=csU2Dispo;
window.u2RowsOf=u2Rows;
