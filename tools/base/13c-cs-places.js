import {bdFor,esc,itemHTML,L,mapsQ,norm,S,safeUrl} from "./10-core.js";
import {addrForItem} from "./13-crew-views.js";
import {CSEXPSM,CSI,csA,csHm,csKeys,csLocRows,csMyRides,csS,csTx} from "./13a-callsheet.js";
import {CSCUR,CSHN_RE,csIsAdr,csNowIdx,csSceneLoc} from "./13b-cs-now.js";
import {vok} from "./14-render.js";
import {fold} from "./15-script-tab.js";
import {fpFor,schedIndex} from "./17-scene-reader.js";
import {arr} from "./20-data-start.js";
/* ---------- Callsheet (3/6): places – kinds and codes, location groups, addresses, the shooting order, csLocs ---------- */
/* code of a kind of place: «W / H / M Extras» → «W/H/M Extras», «Base» */
export const csKindCode=k=>String(k).replace(/^W\s*\/\s*H\s*\/\s*M/i,"WHM").replace(/\s*\/\s*/g,"/").trim();
/* the code of a place as a badge: an icon per kind of place (set, Base, W/H/M, Lunch, Dinner, Prod, DIT, Parking) and the short text */
const CSKICO={"Base":"base","W / H / M":"whm","Lunch":"lunch","Dinner":"dinner","Prod":"prod","DIT":"dit"};
function csKindIco(k){const q=(String(k).match(/ (Cast|Extras)$/)||[])[1],b=String(k).replace(/ (Cast|Extras)$/,"");if(b==="W / H / M"&&q)return q==="Cast"?CSI.whmc:CSI.whme;return CSI[CSKICO[b]]||(/park/i.test(b)?CSI.park:"")}
const csKindB=k=>{const q=(String(k).match(/ (Cast|Extras)$/)||[])[1],t=csKindCode(k).replace(/ (Cast|Extras)$/,q?" "+L(q):"");const ic=csKindIco(k);return '<b class="csk" title="'+esc(t)+'" aria-label="'+esc(t)+'">'+(ic||'<span>'+esc(t)+'</span>')+'</b>'};
export function csBadgeIn(l,codes){if(!l.kinds)return '<span>'+esc((codes||["L"+String(l.no||"").trim()]).join("·"))+'</span>'+(l._kx||[]).map(csKindB).join("");   /* a set with DIT / Prod at its place: their icon too */
  /* side place: the icons, with the group (Cast / Extras) and a kind without icon as text */
  return l.kinds.map(csKindB).join("")}
export function csPlaceH(inner,href,title,cls){const t=title?' title="'+esc(title)+'" aria-label="'+esc(title)+'"':'',k='csplace csbadge'+(cls?' '+cls:'');
  return href?'<a class="'+k+'" href="'+esc(safeUrl(href))+'" target="_blank" rel="noopener noreferrer"'+t+' data-nobub="1">'+inner+'</a>':'<span class="'+k+'"'+t+'>'+inner+'</span>'}
/* the locations of the day: every set has its code L1, L2 … (its scenes carry it); sets at the same place (same map link or address,
   a set without either at the only place there is) are shown as one location with their codes «L1·L2» */
/* not kept between drawings: the addresses can come later with the app's location list */
export function csLocGroups(c,ls,date){const sets=ls.filter(l=>!l.kinds),key=l=>{let a="";try{a=csLocAddr(c,l,date)}catch(_){}return fold(String(l.map||a||"")).replace(/\s+/g," ").trim()};
  const keys=new Map(sets.map(l=>[l,key(l)])),K=[...new Set([...keys.values()].filter(Boolean))];
  const groups=[];for(const l of sets){let k=keys.get(l);if(!k){if(K.length!==1){groups.push([l]);continue}k=K[0]}let g=groups.find(x=>x.k===k);if(!g){g=[];g.k=k;groups.push(g)}g.push(l)}
  const uq=a=>[...new Set(a.filter(Boolean))];const out=[];
  for(const l of ls){if(l.kinds){out.push(l);continue}const g=groups.find(a=>a.includes(l));if(!g||g[0]!==l)continue;
    if(g.length===1){out.push(l);continue}
    out.push(Object.assign({},g[0],{_codes:g.map(x=>"L"+String(x.no||"").trim()),name:uq(g.map(x=>String(x.name||"").trim())).join(" / "),map:(g.find(x=>x.map)||{}).map||"",scenes:uq(g.map(x=>csS(x.scenes))).join(", "),
      notes:uq([].concat(...g.map(x=>csA(x.notes).map(String)))),items:[].concat(...g.map(x=>csA(x.items))),_m:g,_nos:[].concat(...g.map(x=>x._nos||[]))}))}
  return out}
/* position of a set: its map link, else the address the updater found (key «loc:n» = n-th set of the document) */
export function csSetGeo(c,l){const geo=c.geo||{};for(const m of (l._m||[l])){const g=geo[m.map||"loc:"+(m._ix||m.no)];if(Array.isArray(g))return [m.map||"loc:"+(m._ix||m.no),g]}return [l.map||"loc:"+(l._ix||l.no),null]}
export function csRadioHTML(t){t=String(t||"").trim();if(!t)return"";const b=t.replace(/^(radio\s*channels?|funk(kanäle)?)\s*:?\s*/i,"");const ch=[];const re=/(\d{1,2})\s*:\s*(.*?)(?=\s+\d{1,2}\s*:|$)/g;let m;while((m=re.exec(b)))ch.push([m[1],m[2].trim()]);
  return '<div class="csradio2"><span class="csrlab">'+esc(L("Funkkanäle"))+'</span>'+(ch.length>1?ch.map(([n,l])=>'<span class="csrch"><b>'+esc(n)+'</b>'+esc(l||"–")+'</span>').join(""):'<span>'+esc(t)+'</span>')+'</div>'}
export function csMapQ(q){q=String(q||"").trim();return q?mapsQ(q):""}
export function csLocHref(l,c,date){c=c||CSCUR.c;date=date||CSCUR.date;if(!l)return"";if(l.map)return l.map;let ad="";try{ad=c?csLocAddr(c,l,date):""}catch(_){}return csMapQ(ad)}
export function csCodeHref(code){const m=String(code||"").match(/^L(\w+)$/);if(!m||!CSCUR.c)return"";return csLocHref(csLocs(CSCUR.c).find(x=>!x.kinds&&String(x.no).trim()===m[1]))}
export function csPlaceA(code,href,title,cls){const t=title?' title="'+esc(title)+'"':' title="'+esc(code)+'"';
  /* a base (Base, WHM, Lunch, Prod, DIT …): its own icon and the gold colour; sets (L1 …) stay text */
  const ic=/^L\d/i.test(String(code))?"":csKindIco(String(code).replace(/^WHM\b/i,"W / H / M").replace(/^Prod\b.*/i,"Prod")),k='csplace'+(ic?' csbadge csbase':'')+(cls?' '+cls:''),in_=ic?ic+'<span class="vh">'+esc(code)+'</span>':esc(code);
  return href?'<a class="'+k+'" href="'+esc(safeUrl(href))+'" target="_blank" rel="noopener noreferrer"'+t+' data-nobub="1">'+in_+'</a>':'<span class="'+k+'"'+t+'>'+in_+'</span>'}
/* the address of a place is asked for many times per drawing (scene rows, short line, map, tiles …): worked out once per drawing */
export function csLocAddr(c,l,date){const M=typeof CSCUR!=="undefined"&&CSCUR.c===c&&CSCUR.addr;if(!M||!l||typeof l!=="object")return csLocAddr0(c,l,date);
  const k=String(date||"");let e=M.get(l);if(!e)M.set(l,e={});if(!(k in e))e[k]=csLocAddr0(c,l,date);return e[k]}
function csLocAddr0(c,l,date){let ad="";
  /* 1. the app's location list: a set there with one of the scenes of this location, or with the same name */
  try{const scs=csLocRows(c,l).map(r=>norm(r.sc));const nm=fold(String(l.name||"")).replace(/\(.*?\)/g,"").trim();
    const hit=(S.locs||[]).find(x=>(x.sets||[]).some(st=>(st.scenes||[]).map(norm).some(w=>scs.some(n=>n===w||n.startsWith(w+"pt")))))||
      (nm.length>3?(S.locs||[]).find(x=>(x.sets||[]).some(st=>fold(String(st.name||st.set||"")).includes(nm))||fold(String(x.name||x.venue||"")).includes(nm)):null);
    if(hit)ad=[hit.venue,hit.address].filter(Boolean).join(", ")}catch(_){}
  if(!ad)try{for(const r of csLocRows(c,l)){const it=((schedIndex()[norm(r.sc)]||[]).find(y=>y.d&&y.d.date===date)||{}).it;if(it){ad=addrForItem(it)||"";if(ad)break}}}catch(_){}
  if(!ad||/^tba$/i.test(ad)){const n=csA(l.notes).map(String).concat(csA(l.items).map(i=>String(i.text||""))).find(t=>/\b\d{4}\b/.test(t)&&/[A-Za-zÀ-ÿ]{3,}/.test(t));ad=n?n.replace(/https?:\/\/\S+/g,"").split(/\.\s|\n|\s*;\s*|\s\/\/\s/).find(p=>/\b\d{4}\b/.test(p))||"":"";ad=ad.trim()}
  return /^tba$/i.test(ad)?"":ad}
/* floorplans of a location (3D folder, matched like in the schedule: set and place of its scenes) – only with the right for blocking */
export function csLocFp(c,l,date,icon){if(l.kinds||typeof fpFor!=="function"||!vok("blocking"))return"";const out=new Map();
  try{for(const r of csLocRows(c,l)){const it=((schedIndex()[norm(r.sc)]||[]).find(y=>y.d&&y.d.date===date)||{}).it;if(it)for(const f of fpFor(it.set,it.loc))out.set(f.file||f.name,f)}
    if(!out.size)for(const f of fpFor(l.name||"",""))out.set(f.file||f.name,f)}catch(_){}
  if(!out.size)return"";
  /* in the head of the location: one round icon per floorplan (the name in the tooltip) */
  if(icon)return [...out.values()].map(f=>'<a class="cshn csfpi" href="'+esc(safeUrl(f.url))+'"'+(csA(f.pg).length?' data-fpg="'+esc(f.file||f.name)+'"':'')+' target="_blank" rel="noopener noreferrer" title="'+esc("Floorplan · "+f.name)+'" aria-label="'+esc("Floorplan · "+f.name)+'">'+CSI.fp+'</a>').join("");
  return '<div class="csfp">'+[...out.values()].map(f=>'<a class="pillbtn" href="'+esc(safeUrl(f.url))+'"'+(csA(f.pg).length?' data-fpg="'+esc(f.file||f.name)+'"':'')+' target="_blank" rel="noopener noreferrer">'+CSI.doc+' Floorplan · '+esc(f.name)+'</a>').join("")+'</div>'}
export function csOrderRows(rows,date,locs,one,u){u=u||"1";rows=csA(rows);const ONE=(()=>{const s0=csA(locs).filter(l=>!l.kinds&&l.no);return s0.length===1?s0[0]:null})();if(!rows.length)return"";const ni=date?csNowIdx(rows,date):-1,RK=date?csKeys(rows):[];return '<ol class="tl csorder">'+rows.map((r,i)=>{const nw=i===ni?' now':'',nb=i===ni?'<span class="csnow">'+esc(L("Jetzt"))+'</span>':'';
    if(!r.sc){const ek=RK[i]?RK[i]+(u!=="1"?"_u"+u:""):"",eb=ek&&typeof scAckBtn==="function"?scAckBtn(date,ek,u):"";   /* 2nd Unit: its own lunch, wrap and setups («lunch_u2») */
      return '<li class="row ev'+nw+(eb?' evack':'')+'"><div class="t">'+esc(r.t||"")+nb+'</div><div class="what">'+csTx(r.text||r.syn||"")+eb+'</div></li>'}
    /* scenes look like in the schedule (same row, details, cast, buttons): the scheduled row of that day with the callsheet time */
    const sx=(()=>{try{const l=(schedIndex()[norm(r.sc)]||[]);const o=l.find(y=>y.d&&y.d.date===date)||l[0];return o?o.it:null}catch(_){return null}})();
    const fromCs={sc:String(r.sc),ie:r.ie||"",set:r.set||"",d:r.syn||"",pg:r.pgs||"",dur:r.dur||"",dir:r.dir||"",cast:String(r.cast||"").split(/[,\s]+/).filter(Boolean)};
    const it=Object.assign({},fromCs);if(sx)for(const kk in sx){const v=sx[kk];if(v!=null&&v!==""&&!(Array.isArray(v)&&!v.length))it[kk]=v}it.t=r.t||(sx&&sx.t)||"";
    const bd0=date&&typeof bdFor==="function"?bdFor(date,r.sc):null;   /* the details of the scene from the breakdown are already shown: the callsheet notes only without them */
    /* the notes of the callsheet are part of «Details» (below) */const keep=window.__mctx;window.__mctx={date:date||"",u,cs:true};let li="";try{li=itemHTML(it)}catch(_){li=""}window.__mctx=keep;
    /* extras of the callsheet (when the breakdown has none): with the cast, shown and hidden with it */
    const extra=(r.extras&&!(bd0&&bd0.h&&bd0.h.XX)?'<div class="bdx"><u>XX:</u> '+csTx(csS(r.extras))+'</div>':'');
    /* folded: the first line (scene, I/E, set, pages) is the summary, everything else opens with a tap */
    const i0=li.indexOf('<div class="sc">'),k=li.lastIndexOf('</div></li>');if(i0<0||k<0)return li;
    /* three steps (tap on the scene): 1 = first line and the facts (pages, duration, director, extras) · 2 = + description, cast, extras, address, buttons · 3 = + everything of the breakdown (crew, set dec, props, costume, notes …) */
    let body=li.slice(i0+16,k);
    const md=body.match(/<details class="scdet" open><summary>[\s\S]*?<\/summary>([\s\S]*)<\/details>/);let det=md?md[1]:"";if(md)body=body.replace(md[0],"");
    if(!(bd0&&(arr(bd0.c).length||(bd0.h&&bd0.h.FX)))&&csS(r.notes).trim())det+='<p class="bdt"><span class="bdi"><u>'+esc(L("Notizen"))+':</u> '+csTx(csS(r.notes))+'</span></p>';   /* no breakdown: the notes of the callsheet */
    if(det)body+='<details class="scdet cs3"><summary>'+esc(L("Details"))+'</summary>'+det+'</details>';
    if(extra)body=/<div class="cast">/.test(body)?body.replace(/(<div class="cast">[\s\S]*?<\/div>)/,m0=>m0+extra):body.replace(/(<div class="l1">[\s\S]*?<\/div>)/,m0=>m0+extra);
    const mm=body.match(/<div class="meta">[\s\S]*?<\/div>/),meta=mm?mm[0]:"";if(mm)body=body.replace(mm[0],"");
    const m=body.match(/<div class="l1">[\s\S]*?<\/div>/);const l1=m?m[0]:'<div class="l1"><span class="scn">'+esc(r.sc)+'</span></div>';if(m)body=body.replace(m[0],"");
    const lo=csSceneLoc(locs,r)||(one&&ONE)||null;const pb=lo?csPlaceA('L'+String(lo.no).trim(),csLocHref(lo),lo.name||""):'';
    const du=pb;   /* the duration only in the details (not in the top line) */const l1d=du&&/<span class="set">/.test(l1)?l1.replace('<span class="set">',du+'<span class="set">'):l1+du;
    const dn=typeof scState==="function"&&date&&scState(date,r.sc)===2?' scdone':'';
    return '<li class="row csfold'+nw+dn+'" data-sc="'+esc(String(r.sc))+'"><div class="t">'+esc(it.t||"")+nb+'</div><div class="sc"><details class="csscd"><summary>'+(meta?l1d.replace(/<\/div>$/,meta+'</div>'):l1d)+CSEXPSM+'</summary>'+body+'</details></div></li>'}).join("")+'</ol>'}
/* what concerns me on this callsheet: call, cast times, rides, travel, my department */
/* a place named on the callsheet («Base», «Loc.2», «Parking loc. 1», «Holiday Inn») → name and map link from the Locations */
/* parking places of the callsheet in the language of the app: «Tech parking» → «Tech Parkplatz», «Crew parking» → «Crew Parkplatz» */
export const plDe=t=>String(t||"").replace(/\btech\s*parking\b/gi,L("Tech Parkplatz")).replace(/\bcrew\s*parking\b/gi,L("Crew Parkplatz"));window.plDe=plDe;
/* the distinctive words of the Base's name on this callsheet («Restaurant Waldrand» → «waldrand»): a call place «Waldrand» is the Base */
const csBaseWords=c=>{try{return csLocs(c).filter(l=>l.kinds&&l.kinds.includes("Base")).flatMap(l=>fold(String(l.name||"")).split(/[^a-z0-9]+/)).filter(w=>w.length>=5&&!/^(restaurant|hotel|base|lunch|parking|church|kirche|halle|room|cast|extras)$/.test(w))}catch(_){return []}};
export function csPlace(c,txt){const t=fold(String(txt||""));if(!t)return null;const ls=csLocs(c).filter(l=>!l.kinds);
  const m=t.match(/loc\.?\s*(\d+)/);const park=/park/.test(t);
  if(m){const l=ls.find(x=>(x._nos||[String(x.no).trim()]).includes(m[1]));if(l){if(park){const it=csA(l.items).find(i=>/park/i.test(i.label||""));if(it)return {name:String(txt),map:it.map||l.map||""}}return {name:'Set '+l.no+' · '+(l.name||""),map:l.map||""}}}
  if(/base|lunch/.test(t)||csBaseWords(c).some(w=>t.includes(w)))for(const l of csA(c.locations))for(const i of csA(l.items))if(/base|w \/ h|lunch/i.test((i.label||"")+" "+(i.text||"")))return {name:String(txt)+(!i.text||!/^base$/i.test(String(txt).trim())?"":" · "+String(i.text).split(",")[0]),map:i.map||""};
  /* a place that is a line of a set on the callsheet («Tech Parking», «Crew Parking», «Private Cars Crew» …): its map link and address */
  {const f=v=>fold(String(v||"")).replace(/[^a-z0-9]/g,""),tt=f(txt);if(tt.length>3)for(const l of csA(c.locations))for(const i of csA(l.items)){const lb=f(i.label);
    if(lb.length>3&&(lb===tt||tt.includes(lb)||lb.includes(tt))){const ad=(String(i.text||"").match(/[^,;]*\d{4}\s+\p{L}[^,;]*/u)||[])[0]||"";
      return {name:String(txt),map:i.map||"",addr:ad?String(i.text||"").split(/;/)[0].trim():"",disp:String(txt)}}}
    /* else the location list (Motive): venue or set name – its map link and address */
    if(tt.length>3)for(const l of arr(S.locs)){const ns=[l.venue,l.name].concat(arr(l.sets).map(x=>x&&x.name)).map(f).filter(x=>x.length>3);
      if(ns.some(n=>n===tt||tt.includes(n)||n.includes(tt)))return {name:String(txt),map:/^https:\/\//.test(String(l.map||""))?l.map:"",addr:String(l.address||""),disp:String(txt)}}}
  return {name:String(txt),map:""}}
/* where my call is: the end of my first ride (if it arrives around my call), else the set shooting at that time, else set 1 */
export function csCallPlace(c,me,call){const ct=csHm(call.t);
  /* I drive: my call is where my first ride starts (pickup place), not where it goes */
  {const dr=csA((c._rides||c).transport).concat(csA((c._rides||c).crewTransport)).filter(r=>me.hit(r.driver)&&csHm(r.t1)).sort((a,b)=>csHm(a.t1).localeCompare(csHm(b.t1)));
   const r=dr.find(r=>!ct||csHm(r.t1)>=ct)||dr[0];
   if(r&&r.from){const p=Object.assign({},csPlace(c,r.from));if(!p.map)p.map=csMapQ(r.from);
     return Object.assign({},p,{how:L("Fahrer")+" "+[r.vehicle,r.t1&&(L("ab")+" "+csHm(r.t1)),r.to&&("→ "+r.to)].filter(Boolean).join(" ")})}}const rides=csMyRides(c,me);
  const r=rides.filter(r=>csHm(r.t2)).sort((a,b)=>csHm(a.t2).localeCompare(csHm(b.t2)))[0];
  if(r){const p=csPlace(c,r.to);if(p){p.how=L("mit")+" "+[r.vehicle,r.from&&(L("ab")+" "+r.from),r.t1].filter(Boolean).join(" ");return p}}
  /* no ride: the place is not on the callsheet – nothing is guessed */
  return null}
/* Base, Lunch and Dinner as locations of their own (in the document they are lines of a set: «W / H / M Cast + Lunch: Restaurant Waldrand …») */
/* computed once per callsheet (the calls list asks for every person) */
const CSLOCMEMO=new WeakMap();export function csLocs(c){if(!c||typeof c!=="object")return[];if(!CSLOCMEMO.has(c))CSLOCMEMO.set(c,csLocs0(c));return CSLOCMEMO.get(c)}
function csLocs0(c){const sets=[],extra=[];
  /* Base, W / H / M, Lunch, Dinner and the production office (DIT/Prod): from the label, the words before «:» or «(Base)» in the text */
  const KIND=[[/\bbase\b/i,"Base"],[/w\s*\/\s*h\s*\/\s*m/i,"W / H / M"],[/lunch|mittag/i,"Lunch"],[/dinner|diner|abendessen/i,"Dinner"],[/\bprod\b|production office|produktionsb/i,"Prod"],[/\bdit\b/i,"DIT"]];   /* DIT at another place than the others: a location of its own */
  const ORDER=KIND.map(k=>k[1]);
  /* one place = one location, also when several kinds are there (same map link or same name) */
  const place=(name,map)=>extra.find(e=>(map&&e.map===map)||(name&&fold(e.name)===fold(name)));
  /* two W / H / M on one day (one for the cast, one for the extras): the group after «W / H / M» stays in the code («W/H/M Cast», «W/H/M Extras») */
  const whoOf=t=>{const m=String(t||"").match(/w\s*\/\s*h\s*\/\s*m\s*([^:]*)/i);const g=m?m[1]:"";return /extra|komp|statist|figur/i.test(g)?"Extras":/cast|darsteller|schausp/i.test(g)?"Cast":""};
  /* rooms of the base («Greenroom Cast@base: Loge …», «Prod + DIT: Room at base», «WC: … 2x@base»): lines of the one Base, not places of their own */
  const ROOM=/(@\s*base|\b(at|on|in|im|auf der|in der)\s+(the\s+)?base)\b/i,rooms=[];
  const isAdr0=csIsAdr;
  for(const l0 of csA(c.locations)){const items=[];let last=null;let l=l0;
    /* «OPEN SPACE W / H / M Extras: Turnhallenweg 4 …» read as the name of a set: the W / H / M part is a place of its own */
    {const m=String(l.name||"").match(/^(.*?)\s+(w\s*\/\s*h\s*\/\s*m\b.*)$/i);if(m&&m[1].trim()){const part=m[2],adr=(part.split(":").slice(1).join(":")||"").trim();
      const twin=adr&&csA(l.items).find(i=>i.map&&i.map===l.map&&fold(String(i.text||"")).includes(fold(adr.split(/[,-]/)[0].trim())));
      l=Object.assign({},l,{name:m[1].trim()});const it={label:part.split(":")[0].trim(),text:adr||part,map:twin?l.map:""};if(twin)l.map="";l.items=[it].concat(csA(l.items))}}
    for(const i of csA(l.items)){const lab=String(i.label||""),txt=String(i.text||"").trim();
      if(!i.map&&ROOM.test(lab+" "+txt)&&!isAdr0(txt)){rooms.push({l:lab.replace(/\s*@\s*base\b/i,"").replace(/\s*\+\s*/g," + ").trim(),t:txt,set:items});continue}
      /* lines that belong to the place before them: «To set 1: 4’ with car …», «WC: on base …» */
      if(last&&CSHN_RE.test((lab+" "+txt).trim())&&!i.map){const n=[lab,txt].filter(Boolean).join(": ").replace(/:\s*:/,":");if(!last.notes.includes(n))last.notes.push(n);continue}
      const cm=txt.match(/^([^:,]{1,40}):\s*(.+)$/),head=cm?cm[1]:"",body=cm?cm[2]:txt,par=(body.match(/\(([^)]{1,30})\)/)||[])[1]||"";
      const kinds=KIND.filter(([re,k])=>re.test(lab)||re.test(head)||re.test(par)||(k==="Base"&&re.test(body.split(",")[0]))).map(([,k])=>k);   /* «Base Church, Dorfplatz 5» is the Base too */
      if(!kinds.length||(!txt&&!i.map)){items.push(i);last=null;continue}
      let clean=body.replace(/\s*\([^)]{1,30}\)\s*/g," ").trim(),name=clean.split(",")[0].trim(),rest=clean.split(",").slice(1).join(",").trim(),uses="";
      /* «BASE LAKE» as label and the uses first in the text (W / H / M, Lunch …): the base is called by its label, the uses are a line of it */
      if(/\bbase\b/i.test(lab)&&lab.trim().split(/\s+/).length>1&&!head&&/w\s*\/\s*h\s*\/\s*m|lunch|mittag|cast|extras/i.test(name)&&!isAdr0(name)){uses=name;name=lab.trim();
        for(const [re,k] of KIND)if(k!=="Base"&&re.test(uses)&&!kinds.includes(k))kinds.push(k)}
      let e=place(name,i.map);
      if(!e){e={no:"",kinds:[],name:name||"",map:i.map||"",notes:[],items:[]};extra.push(e)}
      const who=uses&&/cast/i.test(uses)&&/extra/i.test(uses)?"":(whoOf(lab+" "+head)||whoOf(txt));
      for(const k0 of kinds){const k=k0==="W / H / M"&&who?k0+" "+who:k0;if(!e.kinds.includes(k))e.kinds.push(k)}
      const isAdr=csIsAdr;
      if(name&&(!e.name||(isAdr(e.name)&&!isAdr(name)))){if(e.name&&e.name!==name&&!e.notes.includes(e.name))e.notes.unshift(e.name);e.name=name}
      {const at=lab.match(/@\s*(.+)$/);if(at&&isAdr(e.name)&&!isAdr(at[1])){if(!e.notes.includes(e.name))e.notes.unshift(e.name);e.name=at[1].trim()}}if(!e.map&&i.map)e.map=i.map;/* «Föhrenweg 160, 3999 Testdorf; To set 1: …; WC: …» – each part its own line (address, hints with their icons, the rest with its kind) */
      if(uses&&!e.notes.includes(uses))e.notes.unshift(uses);
      for(const part of String(rest||"").split(/\s*;\s*/).map(x=>x.trim()).filter(Boolean)){const r2=isAdr(part)||CSHN_RE.test(part)?part:kinds.map(k0=>{const k=k0==="W / H / M"&&who?k0+" "+who:k0;return csKindCode(k)}).join(" / ")+": "+part;if(!e.notes.includes(r2))e.notes.push(r2)}last=e}
    /* the map link of the set is the one of a side place listed with it (e.g. «WHM Extras … https://…» after the set name): not the place of the set */
    const own=!!l.map&&extra.some(e=>e.map===l.map&&e.kinds.some(k=>k!=="DIT"&&k!=="Prod"));
    sets.push(Object.assign({},l,{items},own?{map:""}:{}))}
  /* the rooms go to the Base (the one with a map first); without a Base they stay lines of their set */
  {const b=extra.find(e=>e.kinds.includes("Base")&&e.map)||extra.find(e=>e.kinds.includes("Base"));
   for(const r of rooms){const n=[r.l,r.t].filter(Boolean).join(": ");if(b){if(!b.notes.includes(n))b.notes.push(n)}else r.set.push({label:r.l,text:r.t})}}
  /* «LOCATION: Bahnweg 40 - 3998 Musterdorf» read as a set of its own: it is the address of the sets without own address or map link */
  {const isA=t=>/\d{4}\s+\p{L}/u.test(String(t||""))&&!/\bset\b/i.test(String(t||""));const adr=sets.filter(l=>isA(l.name)&&!csS(l.scenes).trim());
   if(adr.length===1&&sets.length>1){const a=adr[0];sets.splice(sets.indexOf(a),1);for(const l of sets)if(!l.map&&!csA(l.notes).some(n=>isA(n))){l.notes=[a.name].concat(csA(l.notes));if(a.map)l.map=a.map}
     for(const i of csA(a.items))if(!sets.some(l=>csA(l.items).some(j=>j.map&&j.map===i.map)))sets[0].items=csA(sets[0].items).concat([i])}}
  /* a set without a number on the callsheet («ER SET», read wrongly) gets its position: 1, 2, 3 … (as «Loc. 3» elsewhere in the document) */
  sets.forEach((l,i)=>{if(!/^\d+[a-z]?$/i.test(String(l.no||"").trim()))l.no=String(i+1);l._ix=i+1;l._nos=[String(l.no).trim()]});
  /* DIT / production office at the place of a set: a line of that set, not a location of its own (only somewhere else it is one) */
  for(const e of extra.slice())if(e.kinds.every(k=>k==="DIT"||k==="Prod")){const st=sets.find(l=>(e.map&&l.map===e.map)||(e.name&&fold(String(l.name||""))===fold(e.name)));
    if(st){st._kx=[...new Set((st._kx||[]).concat(e.kinds))];st.items=(st.items||[]).concat([{label:e.kinds.join(" / "),text:[e.name].concat(e.notes).filter(Boolean).join(", "),map:e.map||""}]);extra.splice(extra.indexOf(e),1)}}
  return sets.concat(extra.map(e=>{e.kinds.sort((a,b)=>ORDER.indexOf(a.replace(/ (Cast|Extras)$/,""))-ORDER.indexOf(b.replace(/ (Cast|Extras)$/,"")));if(!e.name)e.name=e.kinds.join(" · ");return Object.assign(e,{no:e.kinds.join(" · ")})}))}
