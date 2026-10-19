/* ---------- Callsheet as the production writes it (TBO_Dispo_…pdf): same order as the document ----------
   x.cs = the whole callsheet read in structure by tools/update_from_dropbox.py (CS_SCHEMA). At the top «Mein Tag»:
   my call, my rides and the information of my department. Phone numbers only with the right «Telefon sehen». */
/* outline icons in the style of the app (no emoji) */
const csI=d=>'<svg class="csi" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const CSI={phone:csI('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  radio:csI('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8l8-4"/><circle cx="9" cy="14" r="2"/><path d="M14 13h3M14 16h3"/>'),
  warn:csI('<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'),
  doc:csI('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6"/>'),
  lock:csI('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  clock:csI('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  user:csI('<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  pin:csI('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'),
  film:csI('<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9h17M8 5l-2 4M13 5l-2 4M18 5l-2 4"/>'),
  cast:csI('<path d="M12 3.5l2.5 5.2 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z"/>'),
  car:csI('<path d="M5 16V12l2-5h10l2 5v4"/><path d="M4 16h16v2H4z"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/><path d="M5 12h14"/>'),
  calls:csI('<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 7a7 7 0 0 1 0 10"/>'),
  search:csI('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
  table:csI('<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 10h17M3.5 14.5h17M9.5 5v14"/>'),
  cards:csI('<rect x="4" y="4.5" width="16" height="6" rx="1.5"/><rect x="4" y="13.5" width="16" height="6" rx="1.5"/>')};
window.CSI=CSI;
const CSPH=/(\+\d[\d ()\/.-]{7,}\d)/g;
/* text with phone numbers: callable with the right, else left out */
function csTx(s){s=String(s==null?"":s);if(!s)return"";const ok=vok("phone");let out="",p=0;
  for(const m of s.matchAll(CSPH)){out+=esc(s.slice(p,m.index));out+=ok?'<a href="tel:'+esc(m[1].replace(/[^\d+]/g,""))+'">'+esc(m[1])+'</a>':'<span class="cshid" title="'+esc(L("Nur mit dem Recht «Telefon sehen»"))+'">'+CSI.lock+'</span>';p=m.index+m[0].length}
  return (out+esc(s.slice(p))).replace(/(https?:\/\/[^\s<]+)/g,u=>'<a href="'+esc(safeUrl(u.replace(/&amp;/g,"&")))+'" target="_blank" rel="noopener noreferrer">'+esc(u)+'</a>').replace(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">(https?:\/\/(?:maps\.app\.goo\.gl|[^"<]*google\.[a-z.]+\/maps)[^<]*)<\/a>/g,(m0,h)=>csMap(h.replace(/&amp;/g,"&")))}
/* map: a round button with a pin (like the other round buttons of the app) */
const CSPIN='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
const csMap=u=>u?'<a class="csmap" href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(L("Karte"))+'" title="'+esc(L("Karte"))+'">'+CSPIN+'</a>':'';
/* translated text (locations, production information) in the language of the app; the original when none */
let CSTR=null;const csL=t=>{const s2=String(t==null?"":t);return (CSTR&&CSTR[LANG]&&CSTR[LANG][s2])||s2};
const csA=v=>Array.isArray(v)?v:(v==null||v===""?[]:[v]);
const csRoute=(f,t1,to,t2)=>[[t1,f].filter(Boolean).join(" "),[t2,to].filter(Boolean).join(" ")].filter(Boolean).join(" → ");
const csS=v=>Array.isArray(v)?v.join(", "):String(v==null?"":v);
/* a part of the callsheet: open or folded */
/* open/close symbol of the app (two chevrons in a round frame, as in Log/Tests) */
const CSEXP='<span class="csexp" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg></span>';
function csSec(title,body,open,cls,id){if(!body)return"";return '<details class="dsec cssec'+(cls?" "+cls:"")+'"'+(id?' id="cs-'+id+'"':'')+(open?' open':'')+'><summary><h3 class="dh">'+esc(title)+'</h3>'+CSEXP+'</summary>'+body+'</details>'}
/* a table of the callsheet: on the computer a table, on the phone one card per row (title = first columns, the rest as «label value») */
function csTable(head,rows,tc){rows=rows.filter(r=>r.some(c=>String(c||"").trim()));if(!rows.length)return"";tc=tc||2;
  const tbl='<div class="tblw cs-tbl"><table class="dtbl"><thead><tr>'+head.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+csTx(c)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
  const cards='<div class="cs-cards">'+rows.map(r=>{const tt=r.slice(0,tc).map(c=>String(c||"").trim()).filter(Boolean);
    const kv=r.slice(tc).map((c,i)=>[head[i+tc]||"",String(c||"").trim()]).filter(([,v])=>v);
    /* from → to pairs read as one line */
    return '<div class="cs-card"><div class="cs-ct">'+tt.map((x,i)=>i?'<span>'+csTx(x)+'</span>':'<b>'+csTx(x)+'</b>').join(" ")+'</div>'+kv.map(([k,v])=>'<div class="cs-kv">'+(k?'<span class="k">'+esc(k)+'</span>':'')+'<span class="v">'+csTx(v)+'</span></div>').join("")+'</div>'}).join("")+'</div>';
  return tbl+cards}
/* who am I on this callsheet: name and department (crew list / app profile) */
function csMe(){let me=null;try{me=myIdentity()}catch(_){}if(!me||!me.name)return null;
  const k=nmk(me.name),parts=k.split(" ").filter(w=>w.length>1),dep=fold(me.src||"").split(/[\s/]/)[0];
  const hit=t=>{const n=nmk(String(t||""));if(!n)return false;if(n.includes(k))return true;const f=parts[0],l=parts[parts.length-1];return parts.length>1&&n.includes(f)&&n.includes(l)};
  return {name:me.name,dep,hit}}
/* the row running now (shooting day = today): the last one that has started */
function csNowIdx(rows,date){if(date!==todayISO())return -1;const d=new Date(),now=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");let k=-1;
  csA(rows).forEach((r,i)=>{const t=hm(r.t);if(t&&t<=now)k=i});return k}
function csOrderRows(rows,date){if(!csA(rows).length)return"";const ni=date?csNowIdx(rows,date):-1;return '<ol class="tl csorder">'+csA(rows).map((r,i)=>{const nw=i===ni?' now':'',nb=i===ni?'<span class="csnow">'+esc(L("Jetzt"))+'</span>':'';
    if(!r.sc)return '<li class="row ev'+nw+'"><div class="t">'+esc(r.t||"")+nb+'</div><div class="what">'+csTx(r.text||r.syn||"")+'</div></li>';
    /* scenes look like in the schedule (same row, details, cast, buttons): the scheduled row of that day with the callsheet time */
    const sx=(()=>{try{const l=(schedIndex()[norm(r.sc)]||[]);const o=l.find(y=>y.d&&y.d.date===date)||l[0];return o?o.it:null}catch(_){return null}})();
    const fromCs={sc:String(r.sc),ie:r.ie||"",set:r.set||"",d:r.syn||"",pg:r.pgs||"",dur:r.dur||"",dir:r.dir||"",cast:String(r.cast||"").split(/[,\s]+/).filter(Boolean)};
    const it=Object.assign({},fromCs);if(sx)for(const kk in sx){const v=sx[kk];if(v!=null&&v!==""&&!(Array.isArray(v)&&!v.length))it[kk]=v}it.t=r.t||(sx&&sx.t)||"";
    const keep=window.__mctx;window.__mctx={date:date||"",u:"1"};let li="";try{li=itemHTML(it)}catch(_){li=""}window.__mctx=keep;
    const extra=(r.extras?'<div class="cscast">'+csTx(csS(r.extras))+'</div>':'')+(r.notes?'<details class="csnote"><summary>'+esc(L("Details Callsheet"))+'</summary><div>'+csTx(csS(r.notes))+'</div></details>':'');
    /* folded: the first line (scene, I/E, set, pages) is the summary, everything else opens with a tap */
    const i0=li.indexOf('<div class="sc">'),k=li.lastIndexOf('</div></li>');if(i0<0||k<0)return li;
    let body=li.slice(i0+16,k);const m=body.match(/<div class="l1">[\s\S]*?<\/div>/);const l1=m?m[0]:'<div class="l1"><span class="scn">'+esc(r.sc)+'</span></div>';if(m)body=body.replace(m[0],"");
    return '<li class="row csfold'+nw+'"><div class="t">'+esc(it.t||"")+nb+'</div><div class="sc"><details class="csscd"><summary>'+l1+(r.dur||it.dur?'<span class="csdur">'+esc(r.dur||it.dur)+'</span>':'')+'</summary>'+body+extra+'</details></div></li>'}).join("")+'</ol>'}
/* what concerns me on this callsheet: call, cast times, rides, travel, my department */
/* a place named on the callsheet («Base», «Loc.2», «Parking loc. 1», «Holiday Inn») → name and map link from the Locations */
function csPlace(c,txt){const t=fold(String(txt||""));if(!t)return null;const ls=csA(c.locations);
  const m=t.match(/loc\.?\s*(\d+)/);const park=/park/.test(t);
  if(m){const l=ls.find(x=>String(x.no)===m[1]);if(l){if(park){const it=csA(l.items).find(i=>/park/i.test(i.label||""));if(it)return {name:String(txt),map:it.map||l.map||""}}return {name:'Set '+l.no+' · '+(l.name||""),map:l.map||""}}}
  if(/base|lunch|hermitage/.test(t))for(const l of ls)for(const i of csA(l.items))if(/base|w \/ h|lunch/i.test((i.label||"")+" "+(i.text||"")))return {name:String(txt)+(i.text&&!/^base$/i.test(String(txt).trim())?"":" · "+String(i.text||"").split(",")[0]),map:i.map||""};
  return {name:String(txt),map:""}}
/* where my call is: the end of my first ride (if it arrives around my call), else the set shooting at that time, else set 1 */
function csCallPlace(c,me,call){const ct=hm(call.t);const rides=csA(c.transport).filter(r=>me.hit(r.passengers)||me.hit(r.driver)).concat(csA(c.crewTransport).filter(r=>me.hit(r.people)));
  const r=rides.filter(r=>hm(r.t2)).sort((a,b)=>hm(a.t2).localeCompare(hm(b.t2)))[0];
  if(r){const p=csPlace(c,r.to);if(p){p.how=L("mit")+" "+[r.vehicle,r.from&&(L("ab")+" "+r.from),r.t1].filter(Boolean).join(" ");return p}}
  if(ct){let at=null;for(const o of csA((c.order||{}).rows)){const m=String(o.text||"").match(/@\s*(loc\.?\s*\d+)/i);if(m&&hm(o.t)&&hm(o.t)<=ct)at=m[1]}if(at)return csPlace(c,at)}
  const l=csA(c.locations)[0];return l?{name:'Set '+(l.no||"1")+' · '+(l.name||""),map:l.map||""}:null}
/* Base, Lunch and Dinner as locations of their own (in the document they are lines of a set: «W / H / M Cast + Lunch: Restaurant Hermitage …») */
function csLocs(c){const sets=[],extra=new Map();
  for(const l of csA(c.locations)){const items=[];for(const i of csA(l.items)){const lab=String(i.label||"");
      const kinds=[/\bbase\b/i.test(lab)&&"Base",/w\s*\/\s*h\s*\/\s*m/i.test(lab)&&"W / H / M",/lunch|mittag/i.test(lab)&&"Lunch",/dinner|diner|abendessen/i.test(lab)&&"Dinner"].filter(Boolean);
      if(!kinds.length||!String(i.text||"").trim()){items.push(i);continue}
      const key=fold(String(i.text).split(",")[0]);const e=extra.get(key)||{no:"",kinds:[],name:String(i.text).split(",")[0].trim(),map:i.map||"",notes:[],items:[]};
      for(const k of kinds)if(!e.kinds.includes(k))e.kinds.push(k);if(!e.map&&i.map)e.map=i.map;const rest=String(i.text).split(",").slice(1).join(",").trim();if(rest&&!e.notes.includes(rest))e.notes.push(rest);
      e.items.push({label:lab,text:""});extra.set(key,e)}
    sets.push(Object.assign({},l,{items}))}
  return sets.concat([...extra.values()].map(e=>Object.assign(e,{no:e.kinds.join(" · "),items:e.items.filter(x=>x.label).map(x=>({label:x.label,text:""}))})))}
/* short code of a place for the call list: S1, S2, Base, P1 … */
function csShort(p){const n=String(p&&p.name||"");let m=n.match(/^Set\s*(\w+)/i);if(m)return "S"+m[1];if(/base|lunch|hermitage/i.test(n))return "Base";m=n.match(/park\w*\s*loc\.?\s*(\d+)/i);if(m)return "P"+m[1];m=n.match(/loc\.?\s*(\d+)/i);if(m)return "S"+m[1];return n.split(/[ ,·]/)[0].slice(0,8)}
/* is this department mine? words of my call's department and of my profile (Assistant Directors ~ AD/Regie, Camera ~ Kamera …) */
const CSDSYN=[["assistant","ad","regie","directors","direction"],["camera","kamera","cam"],["sound","ton"],["light","licht","electric","gaffer"],["grip","grips","buhne"],["costume","kostum","wardrobe"],["makeup","maske","make","hair"],["production","produktion","prod"],["location","locations"],["art","ausstattung","props","requisite"],["catering","kuche"],["transport","fahrer","driver"],["script","continuity"]];
function csDWords(t){const w=fold(String(t||"")).split(/[^a-z0-9]+/).filter(x=>x.length>1&&!["and","und","the","de","of"].includes(x));const out=new Set(w);for(const g of CSDSYN)if(w.some(x=>g.includes(x)))g.forEach(x=>out.add(x));return out}
function csMyDept(c,me,dept){if(!me)return false;const call=csA(c.calls).find(r=>me.hit(r.name));const mine=new Set([...csDWords(call&&call.dept),...csDWords(me.dep)]);
  const w=csDWords(dept);for(const x of w)if(x.length>2&&mine.has(x)||x==="ad"&&mine.has("ad"))return true;return false}
function csMine(c,me){const mine=[];if(!c||!me)return mine;
  const call=csA(c.calls).find(r=>me.hit(r.name));if(call){const pl=csCallPlace(c,me,call);
    mine.push('<div class="csme-r"><span class="k">'+esc(L("Mein Call"))+'</span><b>'+esc(call.t||"")+'</b> <small>'+esc([call.role,call.dept].filter(Boolean).join(" · "))+'</small></div>'+
      (pl?'<div class="csme-r"><span class="k">'+esc(L("Call-Ort"))+'</span><b>'+esc(pl.name)+'</b>'+(pl.map?' '+csMap(pl.map):'')+(pl.how?' <small>'+esc(pl.how)+'</small>':'')+'</div>':''))}
  const cast=csA(c.cast).find(r=>me.hit(r.actor));if(cast)mine.push('<div class="csme-r"><span class="k">Cast</span>'+esc([cast.role,cast.pickup&&"P/UP "+cast.pickup,cast.call&&"Call "+cast.call,cast.onset&&"Set "+cast.onset].filter(Boolean).join(" · "))+'</div>');
  /* pickup: the first ride of the day (time and place first) */
  {const rides=csA(c.transport).filter(r=>me.hit(r.passengers)||me.hit(r.driver)).concat(csA(c.crewTransport).filter(r=>me.hit(r.people))).filter(r=>hm(r.t1)).sort((a,b)=>hm(a.t1).localeCompare(hm(b.t1)));
   var pu=rides[0];if(pu&&!(cast&&cast.pickup))mine.splice(1,0,'<div class="csme-r"><span class="k">Pickup</span><b>'+esc(hm(pu.t1))+'</b> '+esc(pu.from||"")+(pu.to?' → '+esc([pu.to,pu.t2].filter(Boolean).join(" ")):'')+' <small>'+esc([pu.vehicle,pu.driver].filter(Boolean).join(" · "))+'</small></div>');else pu=null}
  /* the other rides (the pickup ride is already shown above) */
  for(const r of csA(c.transport).filter(r=>(me.hit(r.passengers)||me.hit(r.driver))&&r!==pu))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+' <small>'+esc([r.vehicle,r.driver].filter(Boolean).join(" · "))+'</small></div>');
  for(const r of csA(c.crewTransport).filter(r=>me.hit(r.people)&&r!==pu))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+' <small>'+esc(r.vehicle||"")+'</small></div>');
  for(const r of csA(c.travel).filter(r=>me.hit(r.name)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Anreise"))+'</span>'+esc([r.how,r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+'</div>');
  for(const r of csA(c.depts).filter(r=>csMyDept(c,me,r.dept)&&String(r.text||"").trim()))mine.push('<div class="csme-r"><span class="k">'+esc(r.dept)+'</span>'+csTx(r.text)+'</div>');
  /* value in its own span (label | value side by side on the phone) */
  return mine.map(x=>x.replace(/<div class="csme-r"><span class="k">(.*?)<\/span>(.*?)<\/div>/g,'<div class="csme-r"><span class="k">$1</span><span class="v">$2</span></div>'))}
function renderCS(x,day){const c=x.cs||{},t=c.times||{},me=csMe();let h="";CSTR=c.tr||null;
  /* head: as the top of the callsheet */
  const tile=(k,v,big)=>v?'<div class="dt'+(big?' big':'')+'"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>':'';
  h+='<div class="dsp-head"><div><h2>'+esc(x.label||day.label||"Callsheet")+(c.day?' <small class="csday">Shoot Day # '+esc(c.day)+'</small>':'')+'</h2><div class="date drow"><span>'+fmtDate(x.date)+(c.script?' · Script '+esc(c.script):'')+(c.schedule?' · '+esc(c.schedule):'')+'</span>'+UNITBAR+'</div></div></div>';
  h+='<div class="dtiles cstiles" id="cs-zeiten">'+tile("Crew Call",t.crewCall||x.crewCall,true)+tile("Rehearsal",t.rehearsal)+tile("RTS",t.rts||x.shootCall)+tile("Lunch",t.lunch)+tile("Wrap",t.wrap||x.wrap)+
    (typeof wxTile==="function"&&day&&day.date&&wxTile(day)?'<div class="dt cswx">'+wxTile(day)+'</div>':tile(L("Wetter"),[c.weather,c.temp].filter(Boolean).join(" · ")).replace('class="dt"','class="dt wide"'))+tile(L("Sonne"),c.sunrise&&c.sunset?c.sunrise+"–"+c.sunset:(x.sr&&x.ss?x.sr+"–"+x.ss:""))+'</div>';
  /* contact on set: the name itself is the call link (only with the phone right) */
  if(c.contact&&(c.contact.name||c.contact.phone)){const ct=c.contact,tel=String(ct.phone||"").replace(/[^\d+]/g,""),nm=esc(ct.name||ct.phone||"");
    h+='<div class="cscontact"><b>'+esc(L("Kontakt am Set"))+':</b> '+(tel&&vok("phone")?'<a class="csct" href="tel:'+esc(tel)+'" title="'+esc(L("Anrufen"))+'">'+CSI.phone+nm+'</a>':nm)+(ct.role?' <small>· '+esc(ct.role)+'</small>':'')+'</div>'}
  /* jump bar (sticky) and search over the whole callsheet */
  {const has=k=>({mein:!!me&&csMine(c,me).length,loc:csA(c.locations).length,order:csA((c.order||{}).rows).length,cast:csA(c.cast).length,trans:csA(c.transport).length||csA(c.crewTransport).length,calls:csA(c.calls).length})[k];
   const J=[["zeiten",L("Zeiten"),"clock"],["mein",L("Mein Tag"),"user"],["loc","Locations","pin",L("Orte")],["order",L("Drehfolge"),"film",L("Szenen")],["cast","Cast","cast"],["trans","Transport","car",L("Fahrten")],["calls","Calls","calls"]].filter(([k])=>k==="zeiten"||has(k));
   /* icons with a tiny label; the search opens from the magnifier (keeps the bar one line high) */
   h+='<div class="csjump"><div class="csjb">'+J.map(([k,l,i,sh])=>'<button type="button" data-csj="'+k+'" aria-label="'+esc(l)+'" title="'+esc(l)+'">'+CSI[i]+'<span>'+esc(sh||l)+'</span></button>').join("")+
     '<button type="button" class="csqb" data-csqb aria-label="'+esc(L("Suchen"))+'" title="'+esc(L("Suchen"))+'">'+CSI.search+'<span>'+esc(L("Suchen"))+'</span></button></div><input id="csq" type="search" autocomplete="off" hidden placeholder="'+esc(L("Suchen: Name, Szene, Fahrzeug …"))+'"></div>'}
  /* my day */
  if(me){const mine=csMine(c,me);if(mine.length)h+='<section class="dsec csme" id="cs-mein"><h3 class="dh">'+esc(L("Mein Tag"))+' <small>'+esc(me.name)+'</small></h3>'+mine.join("")+'</section>'}
  /* key people of the day */
  h+=csSec(L("Team des Tages"),csA(c.key).length||c.office?'<div class="cskey">'+(c.office?'<div><span class="k">'+esc(L("Produktionsbüro"))+'</span>'+csTx(c.office)+'</div>':'')+csA(c.key).map(k=>'<div><span class="k">'+esc(k.role||"")+'</span>'+esc(k.name||"")+' '+csTx(k.phone||"")+'</div>').join("")+'</div>'+
    csA(c.lists).map(l=>'<p class="cslist"><b>'+esc(l.title||"")+'</b> '+esc(csS(l.names))+'</p>').join(""):"",false);
  /* locations */
  /* locations: each one folds (name and map always visible), a button opens or closes all */
  {const ls=csLocs(c);
   h+=csSec("Locations",ls.length?(ls.length>1?'<button type="button" class="lnk csall" data-csall>'+CSEXP+'<span>'+esc(L("Alle auf-/zuklappen"))+'</span></button>':'')+ls.map(l=>'<details class="dbox csloc"><summary><span class="dk">'+(l.kinds?esc(l.no):'Set '+esc(l.no||""))+(l.scenes?' · '+esc(csS(l.scenes)):'')+'</span><span class="dn">'+esc(l.name||"")+'</span>'+
     csMap(l.map)+'</summary>'+
     csA(l.notes).map(n=>'<div class="ds">'+csTx(csL(n))+'</div>').join("")+csA(l.items).map(i=>'<div class="ds"><b>'+esc(csL(i.label||""))+'</b> '+csTx(csL(i.text||""))+(i.map?' '+csMap(i.map):'')+'</div>').join("")+'</details>').join(""):"",true,"","loc")}
  /* production information */
  h+=csSec(L("Produktionsinfos"),csA(c.info).map(p=>'<p>'+csTx(csL(p))+'</p>').join(""),true,"csinfo");
  /* shooting order */
  const o=c.order||{};
  h+=csSec(L("Drehfolge")+(o.pages?' · '+o.pages+' pgs':''),(o.title?'<p class="ghint">'+esc(o.title)+'</p>':'')+csOrderRows(o.rows,x.date),true,"","order");
  /* cast, extras, vehicles */
  h+=csSec("Cast",(csA(c.cast).length?'<button type="button" class="lnk cstview" data-cstview>'+(csCastMode()?CSI.cards:CSI.table)+'<span>'+esc(L(csCastMode()?"Als Karten":"Als Tabelle"))+'</span></button>':'')+csTable(["#",L("Rolle"),L("Darsteller"),"P/UP","Call",L("Kostüm"),L("Maske"),"Base","On set"],csA(c.cast).map(r=>[r.no,r.role,r.actor,r.pickup,r.call,r.wardrobe,r.makeup,r.base,r.onset]),3),false,csCastMode()?"cs-astbl":"","cast");
  h+=csSec(L("Komparsen"),csTable(["#",L("Rolle"),"Call",L("Kostüm"),L("Maske"),"On set"],csA(c.extras).map(r=>[r.count,r.part,r.call,r.wardrobe,r.makeup,r.onset])),false);
  h+=csSec(L("Fahrzeuge"),csTable([L("Fahrzeug"),"Via","Call","RTS"],csA(c.vehicles).map(r=>[r.name,r.via,r.call,r.rts])),false);
  /* transport and travel */
  h+=csSec(L("Transport mit Fahrer"),(c.drivers?'<div class="csdrv">'+String(c.drivers).split(/\s*[|\n;]\s*/).filter(x=>x.trim()).map(x=>{const m=x.match(CSPH);const nm=m?x.replace(m[0],"").trim():x.trim();
     return '<div class="csdrv-r"><span>'+esc(nm)+'</span>'+(m?csTx(m[0]):'')+'</div>'}).join("")+'</div>':'')+csTable([L("Fahrt"),L("Fahrzeug"),L("Fahrer"),L("Mitfahrende")],csA(c.transport).map(r=>[csRoute(r.from,r.t1,r.to,r.t2),r.vehicle,r.driver,r.passengers]),1),false,"","trans");
  h+=csSec(L("Anreise Cast"),csTable([L("Name"),"",L("Fahrt"),L("Notiz")],csA(c.travel).map(r=>[r.name,r.how,csRoute(r.from,r.t1,r.to,r.t2),r.note])),false);
  /* information by department */
  h+=csSec(L("Infos nach Abteilung"),csA(c.depts).filter(r=>String(r.text||"").trim()).map(r=>'<div class="csdep'+(me&&me.dep&&fold(r.dept||"").includes(me.dep)?' mine':'')+'"><div class="csdep-h">'+esc(r.dept||"")+'</div><div class="csdep-t">'+csTx(r.text)+'</div></div>').join(""),false);
  h+=csSec(L("Transport Crew"),csTable([L("Fahrzeug"),L("Fahrt"),L("Personen")],csA(c.crewTransport).map(r=>[r.vehicle,csRoute(r.from,r.t1,r.to,r.t2),r.people]),1),false);
  /* the preview (PREVISION) is shown only on the next day (csPrevHTML) */
  /* calls on set */
  /* calls on set: by department, one short line per person (time · name · job) */
  {const g=new Map();for(const r of csA(c.calls)){const k=r.dept||"";if(!g.has(k))g.set(k,[]);g.get(k).push(r)}
   h+=csSec("Calls on Set",[...g].map(([dp,l])=>'<div class="cscall"><div class="cscall-d">'+esc(dp)+'</div>'+l.map(r=>{const who={hit:t=>{const a=nmk(String(t||"")),b=nmk(String(r.name||""));return !!b&&a.includes(b)}};let pl=null;try{pl=csCallPlace(c,who,r)}catch(_){}
     const sc=pl?csShort(pl):"";const tag=sc?(pl.map?'<a class="csplace" href="'+esc(safeUrl(pl.map))+'" target="_blank" rel="noopener noreferrer" title="'+esc(pl.name)+'">'+esc(sc)+'</a>':'<span class="csplace" title="'+esc(pl.name)+'">'+esc(sc)+'</span>'):'';
     const tm=String(r.t||"").match(/^(\d{1,2}:\d{2})\s*(.*)$/);
     return '<div class="cscall-r'+(me&&me.hit(r.name)?' mine':'')+'"><span class="t">'+esc(tm?tm[1]:(r.t||""))+(tm&&tm[2]?'<i>'+esc(tm[2])+'</i>':'')+'</span><span class="cp">'+tag+'</span><span class="cw"><b>'+esc(r.name||"")+'</b> <small>'+esc(r.role||"")+'</small></span></div>'}).join("")+'</div>').join(""),false,"","calls")}
  /* totals, notes, radio */
  const nb=[c.total?'<p><b>'+esc(c.total)+'</b></p>':'',...csA(c.notes).map(n=>'<p>'+csTx(n)+'</p>'),c.radio?'<p class="csradio">'+CSI.radio+' '+esc(c.radio)+'</p>':''].join("");
  h+=csSec(L("Notizen & Funk"),nb,false);
  /* emergency (hospital) when the callsheet has it */
  if(x.hospital&&(x.hospital.name||x.hospital.phone))h+='<section class="dsec"><h3 class="dh">'+L('Notfall')+'</h3><div class="people"><div class="p"><div class="hd"><span class="nm">'+esc(x.hospital.name||L("Spital"))+'</span><span class="role">'+L('Nächstes Spital')+'</span></div>'+(x.hospital.address?'<div class="ct"><a href="'+maps([x.hospital.name,x.hospital.address].filter(Boolean).join(", "))+'" target="_blank" rel="noopener noreferrer">'+esc(x.hospital.address)+'</a></div>':'')+(x.hospital.phone?'<div class="ct"><a class="hosp" href="tel:'+esc(String(x.hospital.phone).replace(/\s/g,""))+'"><span>'+esc(x.hospital.phone)+'</span></a></div>':'')+'</div></div></section>';
  /* anything else of the document */
  for(const sec of csA(x.sections).concat(csA(c.sections))){const rows=csA(sec&&sec.rows).map(r=>Array.isArray(r)?r:[r]).filter(r=>r.some(cc=>String(cc==null?"":cc).trim()));if(!rows.length)continue;
    h+=csSec(String(sec.title||""),rows.map(r=>'<p>'+r.map(cc=>csTx(cc)).join(" · ")+'</p>').join(""),false)}
  /* on the shooting day: once per visit straight to the running row */
  if(x.date===todayISO()){window.__csScr=window.__csScr||{};if(!window.__csScr[x.date]){window.__csScr[x.date]=1;setTimeout(()=>{const n=document.querySelector(".csview .csorder li.now");if(n)n.scrollIntoView({block:"center",behavior:"smooth"})},400)}}
  return '<div class="csview">'+h+'</div>'}
/* jump bar: open the part and go there */
document.addEventListener("click",e=>{const b=e.target.closest("[data-csj]");if(!b)return;const el=document.getElementById("cs-"+b.dataset.csj);if(!el)return;if(el.tagName==="DETAILS")el.open=true;el.scrollIntoView({block:"start",behavior:"smooth"})});
/* search in the callsheet: only matching rows, cards and lines; parts with a hit open */
document.addEventListener("input",e=>{if(!e.target||e.target.id!=="csq")return;const q=fold(e.target.value.trim());const v=e.target.closest(".csview");if(!v)return;
  const items=v.querySelectorAll(".csorder>li,.cs-card,.cs-tbl tbody tr,.cscall-r,.csdep,.csloc,.cskey>div,.cslist,.csinfo p");
  items.forEach(it=>{it.hidden=!!q&&!fold(it.textContent).includes(q)});
  v.querySelectorAll("details.cssec").forEach(d=>{if(!q){d.hidden=false;return}const hit=[...d.querySelectorAll(".csorder>li,.cs-card,.cs-tbl tbody tr,.cscall-r,.csdep,.csloc,.cskey>div,.cslist,.csinfo p")].some(it=>!it.hidden)||fold(d.querySelector("summary").textContent).includes(q);d.hidden=!hit;if(hit)d.open=true});
  v.querySelectorAll(".cscall").forEach(g=>{g.hidden=!!q&&![...g.querySelectorAll(".cscall-r")].some(r=>!r.hidden)})});

/* preview (PREVISION) of a day from the callsheet of the shooting day before – shown on that day while its own callsheet is missing */
function csPrevFor(date){const sh=S.days.filter(d=>d.kind==="shoot").map(d=>d.date).sort();const i=sh.indexOf(date);if(i<1)return null;
  const prev=S.dispos.find(x=>x&&x.date===sh[i-1]&&x.cs&&x.cs.prevision&&csA(x.cs.prevision.rows).length);return prev?{from:prev,pv:prev.cs.prevision}:null}
function csPrevHTML(date){const p=csPrevFor(date);if(!p)return"";const ti=String(p.pv.title||"");
  /* «PREVISION - D2 Wednesday, 21st 2026 Extras: 12 Pages: 3 5/8 / Time Scree 03:30» → small tiles */
  const g=re=>{const m=ti.match(re);return m?m[1].trim():""};const ex=g(/Extras:\s*([\d]+)/i),pg=g(/Pages:\s*(\d+(?:\s+\d+\/\d+)?)/i),scr=g(/Time\s*Scree?n?\s*([\d:]+)/i);
  const rows=csA(p.pv.rows),first=rows.find(r=>hm(r.t)),scenes=rows.filter(r=>r.sc).length;
  const tile=(k,v)=>v?'<div class="dt"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>':'';
  return '<section class="dsec csprev"><h3 class="dh">'+esc(L("Vorschau"))+'</h3><p class="ghint">'+esc(L("aus dem Callsheet vom"))+' '+esc(fmtDate(p.from.date))+' · '+esc(L("Das eigene Callsheet folgt."))+'</p>'+
    '<div class="dtiles cstiles">'+tile(L("Beginn"),first?hm(first.t):"")+tile(cap(L("Szenen")),scenes?String(scenes):"")+tile("Pages",pg)+tile("Screen",scr)+tile(L("Komparsen"),ex)+'</div>'+csOrderRows(rows,date)+'</section>'}

/* open or close all locations */
/* search field opens from the magnifier */
document.addEventListener("click",e=>{const b=e.target.closest("[data-csqb]");if(!b)return;const q=document.getElementById("csq");if(!q)return;q.hidden=!q.hidden;b.setAttribute("aria-pressed",String(!q.hidden));if(!q.hidden)q.focus();else if(q.value){q.value="";q.dispatchEvent(new Event("input",{bubbles:true}))}});
/* cast: cards or table (remembered on this device) */
function csCastMode(){try{return localStorage.getItem("cscast:v1")==="t"}catch(_){return false}}
function csApplyCast(){const d=document.getElementById("cs-cast");if(!d)return;const t=csCastMode();d.classList.toggle("cs-astbl",t);const b=d.querySelector("[data-cstview]");
  if(b)b.innerHTML=(t?CSI.cards:CSI.table)+'<span>'+esc(L(t?"Als Karten":"Als Tabelle"))+'</span>'}
document.addEventListener("click",e=>{if(!e.target.closest("[data-cstview]"))return;try{localStorage.setItem("cscast:v1",csCastMode()?"c":"t")}catch(_){}csApplyCast()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-csall]");if(!b)return;const ds=[...b.closest("details,section").querySelectorAll("details.csloc")];const open=!ds.every(d=>d.open);ds.forEach(d=>d.open=open)});
