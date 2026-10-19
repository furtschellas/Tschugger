/* ---------- Callsheet as the production writes it (TBO_Dispo_…pdf): same order as the document ----------
   x.cs = the whole callsheet read in structure by tools/update_from_dropbox.py (CS_SCHEMA). At the top «Mein Tag»:
   my call, my rides and the information of my department. Phone numbers only with the right «Telefon sehen». */
const CSPH=/(\+\d[\d ()\/.-]{7,}\d)/g;
/* text with phone numbers: callable with the right, else left out */
function csTx(s){s=String(s==null?"":s);if(!s)return"";const ok=vok("phone");let out="",p=0;
  for(const m of s.matchAll(CSPH)){out+=esc(s.slice(p,m.index));out+=ok?'<a href="tel:'+esc(m[1].replace(/[^\d+]/g,""))+'">'+esc(m[1])+'</a>':'<span class="cshid" title="'+esc(L("Nur mit dem Recht «Telefon sehen»"))+'">☎︎</span>';p=m.index+m[0].length}
  return (out+esc(s.slice(p))).replace(/(https?:\/\/[^\s<]+)/g,u=>'<a href="'+esc(safeUrl(u.replace(/&amp;/g,"&")))+'" target="_blank" rel="noopener noreferrer">'+esc(u)+'</a>').replace(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">(https?:\/\/(?:maps\.app\.goo\.gl|[^"<]*google\.[a-z.]+\/maps)[^<]*)<\/a>/g,(m0,h)=>csMap(h.replace(/&amp;/g,"&")))}
/* map: a round button with a pin (like the other round buttons of the app) */
const CSPIN='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
const csMap=u=>u?'<a class="csmap" href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(L("Karte"))+'" title="'+esc(L("Karte"))+'">'+CSPIN+'</a>':'';
/* translated text (locations, production information) in the language of the app; the original when none */
let CSTR=null;const csL=t=>{const s2=String(t==null?"":t);return (CSTR&&CSTR[LANG]&&CSTR[LANG][s2])||s2};
const csA=v=>Array.isArray(v)?v:(v==null||v===""?[]:[v]);
const csS=v=>Array.isArray(v)?v.join(", "):String(v==null?"":v);
/* a part of the callsheet: open or folded */
function csSec(title,body,open,cls,id){if(!body)return"";return '<details class="dsec cssec'+(cls?" "+cls:"")+'"'+(id?' id="cs-'+id+'"':'')+(open?' open':'')+'><summary><h3 class="dh">'+esc(title)+'</h3></summary>'+body+'</details>'}
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
function csMine(c,me){const mine=[];if(!c||!me)return mine;
  const call=csA(c.calls).find(r=>me.hit(r.name));if(call){const pl=csCallPlace(c,me,call);
    mine.push('<div class="csme-r"><span class="k">'+esc(L("Mein Call"))+'</span><b>'+esc(call.t||"")+'</b> <small>'+esc([call.role,call.dept].filter(Boolean).join(" · "))+'</small></div>'+
      (pl?'<div class="csme-r"><span class="k">'+esc(L("Call-Ort"))+'</span><b>'+esc(pl.name)+'</b>'+(pl.map?' '+csMap(pl.map):'')+(pl.how?' <small>'+esc(pl.how)+'</small>':'')+'</div>':''))}
  const cast=csA(c.cast).find(r=>me.hit(r.actor));if(cast)mine.push('<div class="csme-r"><span class="k">Cast</span>'+esc([cast.role,cast.pickup&&"P/UP "+cast.pickup,cast.call&&"Call "+cast.call,cast.onset&&"Set "+cast.onset].filter(Boolean).join(" · "))+'</div>');
  for(const r of csA(c.transport).filter(r=>me.hit(r.passengers)||me.hit(r.driver)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+' <small>'+esc([r.vehicle,r.driver].filter(Boolean).join(" · "))+'</small></div>');
  for(const r of csA(c.crewTransport).filter(r=>me.hit(r.people)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+' <small>'+esc(r.vehicle||"")+'</small></div>');
  for(const r of csA(c.travel).filter(r=>me.hit(r.name)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Anreise"))+'</span>'+esc([r.how,r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+'</div>');
  if(me.dep)for(const r of csA(c.depts).filter(r=>fold(r.dept||"").includes(me.dep)&&String(r.text||"").trim()))mine.push('<div class="csme-r"><span class="k">'+esc(r.dept)+'</span>'+csTx(r.text)+'</div>');
  return mine}
function renderCS(x,day){const c=x.cs||{},t=c.times||{},me=csMe();let h="";CSTR=c.tr||null;
  /* head: as the top of the callsheet */
  const tile=(k,v,big)=>v?'<div class="dt'+(big?' big':'')+'"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>':'';
  h+='<div class="dsp-head"><div><h2>'+esc(x.label||day.label||"Callsheet")+(c.day?' <small class="csday">Shoot Day # '+esc(c.day)+'</small>':'')+'</h2><div class="date drow"><span>'+fmtDate(x.date)+(c.script?' · Script '+esc(c.script):'')+(c.schedule?' · '+esc(c.schedule):'')+'</span>'+UNITBAR+'</div></div></div>';
  h+='<div class="dtiles cstiles" id="cs-zeiten">'+tile("Crew Call",t.crewCall||x.crewCall,true)+tile("Rehearsal",t.rehearsal)+tile("RTS",t.rts||x.shootCall)+tile("Lunch",t.lunch)+tile("Wrap",t.wrap||x.wrap)+
    (typeof wxTile==="function"&&day&&day.date&&wxTile(day)?'<div class="dt cswx">'+wxTile(day)+'</div>':tile(L("Wetter"),[c.weather,c.temp].filter(Boolean).join(" · ")).replace('class="dt"','class="dt wide"'))+tile(L("Sonne"),c.sunrise&&c.sunset?c.sunrise+"–"+c.sunset:(x.sr&&x.ss?x.sr+"–"+x.ss:""))+'</div>';
  if(c.contact&&(c.contact.name||c.contact.phone))h+='<div class="cscontact"><b>'+esc(L("Kontakt am Set"))+':</b> '+esc([c.contact.name,c.contact.role].filter(Boolean).join(" · "))+
    (c.contact.phone&&vok("phone")?' <a class="csbig" href="tel:'+esc(String(c.contact.phone).replace(/[^\d+]/g,""))+'">📞 '+esc(L("Anrufen"))+'</a>':'')+'</div>';
  /* jump bar (sticky) and search over the whole callsheet */
  {const has=k=>({mein:!!me&&csMine(c,me).length,loc:csA(c.locations).length,order:csA((c.order||{}).rows).length,cast:csA(c.cast).length,trans:csA(c.transport).length||csA(c.crewTransport).length,calls:csA(c.calls).length})[k];
   const J=[["zeiten",L("Zeiten")],["mein",L("Mein Tag")],["loc","Locations"],["order",L("Drehfolge")],["cast","Cast"],["trans","Transport"],["calls","Calls"]].filter(([k])=>k==="zeiten"||has(k));
   h+='<div class="csjump"><div class="csjb">'+J.map(([k,l])=>'<button type="button" data-csj="'+k+'">'+esc(l)+'</button>').join("")+'</div><input id="csq" type="search" autocomplete="off" placeholder="'+esc(L("Suchen: Name, Szene, Fahrzeug …"))+'"></div>'}
  /* my day */
  if(me){const mine=csMine(c,me);if(mine.length)h+='<section class="dsec csme" id="cs-mein"><h3 class="dh">'+esc(L("Mein Tag"))+' <small>'+esc(me.name)+'</small></h3>'+mine.join("")+'</section>'}
  /* key people of the day */
  h+=csSec(L("Team des Tages"),csA(c.key).length||c.office?'<div class="cskey">'+(c.office?'<div><span class="k">'+esc(L("Produktionsbüro"))+'</span>'+csTx(c.office)+'</div>':'')+csA(c.key).map(k=>'<div><span class="k">'+esc(k.role||"")+'</span>'+esc(k.name||"")+' '+csTx(k.phone||"")+'</div>').join("")+'</div>'+
    csA(c.lists).map(l=>'<p class="cslist"><b>'+esc(l.title||"")+'</b> '+esc(csS(l.names))+'</p>').join(""):"",false);
  /* locations */
  /* locations: each one folds (name and map always visible), a button opens or closes all */
  {const ls=csA(c.locations);
   h+=csSec("Locations",ls.length?(ls.length>1?'<button type="button" class="lnk csall" data-csall>'+esc(L("Alle auf-/zuklappen"))+'</button>':'')+ls.map(l=>'<details class="dbox csloc"><summary><span class="dk">Set '+esc(l.no||"")+(l.scenes?' · '+esc(csS(l.scenes)):'')+'</span><span class="dn">'+esc(l.name||"")+'</span>'+
     csMap(l.map)+'</summary>'+
     csA(l.notes).map(n=>'<div class="ds">'+csTx(csL(n))+'</div>').join("")+csA(l.items).map(i=>'<div class="ds"><b>'+esc(csL(i.label||""))+'</b> '+csTx(csL(i.text||""))+(i.map?' '+csMap(i.map):'')+'</div>').join("")+'</details>').join(""):"",true,"","loc")}
  /* production information */
  h+=csSec(L("Produktionsinfos"),csA(c.info).map(p=>'<p>'+csTx(csL(p))+'</p>').join(""),true,"csinfo");
  /* shooting order */
  const o=c.order||{};
  h+=csSec(L("Drehfolge")+(o.pages?' · '+o.pages+' pgs':''),(o.title?'<p class="ghint">'+esc(o.title)+'</p>':'')+csOrderRows(o.rows,x.date),true,"","order");
  /* cast, extras, vehicles */
  h+=csSec("Cast",csTable(["#",L("Rolle"),L("Darsteller"),"P/UP","Call",L("Kostüm"),L("Maske"),"Base","On set"],csA(c.cast).map(r=>[r.no,r.role,r.actor,r.pickup,r.call,r.wardrobe,r.makeup,r.base,r.onset]),3),false,"","cast");
  h+=csSec(L("Komparsen"),csTable(["#",L("Rolle"),"Call",L("Kostüm"),L("Maske"),"On set"],csA(c.extras).map(r=>[r.count,r.part,r.call,r.wardrobe,r.makeup,r.onset])),false);
  h+=csSec(L("Fahrzeuge"),csTable([L("Fahrzeug"),"Via","Call","RTS"],csA(c.vehicles).map(r=>[r.name,r.via,r.call,r.rts])),false);
  /* transport and travel */
  h+=csSec(L("Transport mit Fahrer"),(c.drivers?'<p class="ghint">'+csTx(c.drivers)+'</p>':'')+csTable([L("Fahrzeug"),L("Fahrer"),L("Mitfahrende"),L("Von"),L("Nach")],csA(c.transport).map(r=>[r.vehicle,r.driver,r.passengers,[r.t1,r.from].filter(Boolean).join(" "),[r.t2,r.to].filter(Boolean).join(" ")])),false,"","trans");
  h+=csSec(L("Anreise Cast"),csTable([L("Name"),"",L("Von"),L("Nach"),L("Notiz")],csA(c.travel).map(r=>[r.name,r.how,[r.t1,r.from].filter(Boolean).join(" "),[r.t2,r.to].filter(Boolean).join(" "),r.note])),false);
  /* information by department */
  h+=csSec(L("Infos nach Abteilung"),csA(c.depts).filter(r=>String(r.text||"").trim()).map(r=>'<div class="csdep'+(me&&me.dep&&fold(r.dept||"").includes(me.dep)?' mine':'')+'"><b>'+esc(r.dept||"")+'</b> '+csTx(r.text)+'</div>').join(""),false);
  h+=csSec(L("Transport Crew"),csTable([L("Fahrzeug"),L("Personen"),L("Von"),L("Nach")],csA(c.crewTransport).map(r=>[r.vehicle,r.people,[r.t1,r.from].filter(Boolean).join(" "),[r.t2,r.to].filter(Boolean).join(" ")])),false);
  /* preview of the next day */
  const pv=c.prevision||{};
  h+=csSec(L("Vorschau")+(pv.title?' · '+pv.title.replace(/^PREVISION\s*-?\s*/i,""):''),csOrderRows(pv.rows),false);
  /* calls on set */
  /* calls on set: by department, one short line per person (time · name · job) */
  {const g=new Map();for(const r of csA(c.calls)){const k=r.dept||"";if(!g.has(k))g.set(k,[]);g.get(k).push(r)}
   h+=csSec("Calls on Set",[...g].map(([dp,l])=>'<div class="cscall"><div class="cscall-d">'+esc(dp)+'</div>'+l.map(r=>'<div class="cscall-r'+(me&&me.hit(r.name)?' mine':'')+'"><span class="t">'+esc(r.t||"")+'</span><b>'+esc(r.name||"")+'</b><small>'+esc(r.role||"")+'</small></div>').join("")+'</div>').join(""),false,"","calls")}
  /* totals, notes, radio */
  const nb=[c.total?'<p><b>'+esc(c.total)+'</b></p>':'',...csA(c.notes).map(n=>'<p>'+csTx(n)+'</p>'),c.radio?'<p>📻 '+esc(c.radio)+'</p>':''].join("");
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
function csPrevHTML(date){const p=csPrevFor(date);if(!p)return"";
  return '<section class="dsec csprev"><h3 class="dh">'+esc(L("Vorschau"))+' <small>'+esc(L("aus dem Callsheet vom"))+' '+esc(fmtDate(p.from.date))+'</small></h3>'+(p.pv.title?'<p class="ghint">'+esc(p.pv.title)+'</p>':'')+csOrderRows(p.pv.rows)+'</section>'}

/* open or close all locations */
document.addEventListener("click",e=>{const b=e.target.closest("[data-csall]");if(!b)return;const ds=[...b.closest("details,section").querySelectorAll("details.csloc")];const open=!ds.every(d=>d.open);ds.forEach(d=>d.open=open)});
