/* ---------- Callsheet as the production writes it (TBO_Dispo_…pdf): same order as the document ----------
   x.cs = the whole callsheet read in structure by tools/update_from_dropbox.py (CS_SCHEMA). At the top «Mein Tag»:
   my call, my rides and the information of my department. Phone numbers only with the right «Telefon sehen». */
const CSPH=/(\+\d[\d ()\/.-]{7,}\d)/g;
/* text with phone numbers: callable with the right, else left out */
function csTx(s){s=String(s==null?"":s);if(!s)return"";const ok=vok("phone");let out="",p=0;
  for(const m of s.matchAll(CSPH)){out+=esc(s.slice(p,m.index));out+=ok?'<a href="tel:'+esc(m[1].replace(/[^\d+]/g,""))+'">'+esc(m[1])+'</a>':'<span class="cshid" title="'+esc(L("Nur mit dem Recht «Telefon sehen»"))+'">☎︎</span>';p=m.index+m[0].length}
  return (out+esc(s.slice(p))).replace(/(https?:\/\/[^\s<]+)/g,u=>'<a href="'+esc(safeUrl(u.replace(/&amp;/g,"&")))+'" target="_blank" rel="noopener noreferrer">'+(/maps\.app\.goo\.gl|google\.[a-z.]+\/maps/.test(u)?'📍 '+esc(L("Karte")):esc(u))+'</a>')}
const csA=v=>Array.isArray(v)?v:(v==null||v===""?[]:[v]);
const csS=v=>Array.isArray(v)?v.join(", "):String(v==null?"":v);
/* a part of the callsheet: open or folded */
function csSec(title,body,open,cls){if(!body)return"";return '<details class="dsec cssec'+(cls?" "+cls:"")+'"'+(open?' open':'')+'><summary><h3 class="dh">'+esc(title)+'</h3></summary>'+body+'</details>'}
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
function csOrderRows(rows){if(!csA(rows).length)return"";return '<ol class="tl csorder">'+csA(rows).map(r=>{
    if(!r.sc)return '<li class="row ev"><div class="t">'+esc(r.t||"")+'</div><div class="what">'+csTx(r.text||r.syn||"")+'</div></li>';
    const meta=[r.dur?'<span class="m">'+esc(r.dur)+'</span>':'',r.pgs?'<span class="m">'+esc(r.pgs)+' pgs</span>':'',r.time?'<span class="m">'+esc(r.time)+'</span>':'',r.dir?'<span>'+esc(r.dir)+'</span>':''].filter(Boolean);
    return '<li class="row"><div class="t">'+esc(r.t||"")+'</div><div class="sc"><div class="l1"><span class="scn">'+esc(r.sc)+'</span><span class="ie '+ieClass(r.ie)+'">'+esc(r.ie||"")+'</span><span class="set">'+esc(r.set||"")+'</span></div>'+
      (meta.length?'<div class="meta">'+meta.join("")+'</div>':'')+(r.syn?'<div class="desc">'+csTx(r.syn)+'</div>':'')+
      (r.cast?'<div class="cscast">Cast: '+esc(csS(r.cast))+'</div>':'')+(r.extras?'<div class="cscast">'+csTx(csS(r.extras))+'</div>':'')+
      (r.notes?'<details class="csnote"><summary>'+esc(L("Details"))+'</summary><div>'+csTx(csS(r.notes))+'</div></details>':'')+
      '<button class="scbtn" data-scene="'+esc(String(r.sc).replace(/\s+/g,""))+'">Script</button></div></li>'}).join("")+'</ol>'}
function renderCS(x,day){const c=x.cs||{},t=c.times||{},me=csMe();let h="";
  /* head: as the top of the callsheet */
  const tile=(k,v,big)=>v?'<div class="dt'+(big?' big':'')+'"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>':'';
  h+='<div class="dsp-head"><div><h2>'+esc(x.label||day.label||"Callsheet")+(c.day?' <small class="csday">Shoot Day # '+esc(c.day)+'</small>':'')+'</h2><div class="date drow"><span>'+fmtDate(x.date)+(c.script?' · Script '+esc(c.script):'')+(c.schedule?' · '+esc(c.schedule):'')+'</span>'+UNITBAR+'</div></div></div>';
  h+='<div class="dtiles">'+tile("Crew Call",t.crewCall||x.crewCall,true)+tile("Rehearsal",t.rehearsal)+tile("RTS",t.rts||x.shootCall)+tile("Lunch",t.lunch)+tile("Wrap",t.wrap||x.wrap)+
    tile(L("Wetter"),[c.weather,c.temp].filter(Boolean).join(" · ")).replace('class="dt"','class="dt wide"')+tile(L("Sonne"),c.sunrise&&c.sunset?c.sunrise+"–"+c.sunset:(x.sr&&x.ss?x.sr+"–"+x.ss:""))+'</div>';
  if(c.contact&&(c.contact.name||c.contact.phone))h+='<div class="cscontact"><b>'+esc(L("Kontakt am Set"))+':</b> '+esc([c.contact.name,c.contact.role].filter(Boolean).join(" · "))+' '+csTx(c.contact.phone||"")+'</div>';
  /* my day */
  if(me){const mine=[];
    const call=csA(c.calls).find(r=>me.hit(r.name));if(call)mine.push('<div class="csme-r"><span class="k">'+esc(L("Mein Call"))+'</span><b>'+esc(call.t||"")+'</b> <small>'+esc([call.role,call.dept].filter(Boolean).join(" · "))+'</small></div>');
    const cast=csA(c.cast).find(r=>me.hit(r.actor));if(cast)mine.push('<div class="csme-r"><span class="k">Cast</span>'+esc([cast.role,cast.pickup&&"P/UP "+cast.pickup,cast.call&&"Call "+cast.call,cast.onset&&"Set "+cast.onset].filter(Boolean).join(" · "))+'</div>');
    for(const r of csA(c.transport).filter(r=>me.hit(r.passengers)||me.hit(r.driver)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+' <small>'+esc([r.vehicle,r.driver].filter(Boolean).join(" · "))+'</small></div>');
    for(const r of csA(c.crewTransport).filter(r=>me.hit(r.people)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+' <small>'+esc(r.vehicle||"")+'</small></div>');
    for(const r of csA(c.travel).filter(r=>me.hit(r.name)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Anreise"))+'</span>'+esc([r.how,r.from,r.t1].filter(Boolean).join(" "))+' → '+esc([r.to,r.t2].filter(Boolean).join(" "))+'</div>');
    if(me.dep)for(const r of csA(c.depts).filter(r=>fold(r.dept||"").includes(me.dep)&&String(r.text||"").trim()))mine.push('<div class="csme-r"><span class="k">'+esc(r.dept)+'</span>'+csTx(r.text)+'</div>');
    if(mine.length)h+='<section class="dsec csme"><h3 class="dh">'+esc(L("Mein Tag"))+' <small>'+esc(me.name)+'</small></h3>'+mine.join("")+'</section>'}
  /* key people of the day */
  h+=csSec(L("Team des Tages"),csA(c.key).length||c.office?'<div class="cskey">'+(c.office?'<div><span class="k">'+esc(L("Produktionsbüro"))+'</span>'+csTx(c.office)+'</div>':'')+csA(c.key).map(k=>'<div><span class="k">'+esc(k.role||"")+'</span>'+esc(k.name||"")+' '+csTx(k.phone||"")+'</div>').join("")+'</div>'+
    csA(c.lists).map(l=>'<p class="cslist"><b>'+esc(l.title||"")+'</b> '+esc(csS(l.names))+'</p>').join(""):"",false);
  /* locations */
  h+=csSec(L("Locations"),csA(c.locations).map(l=>'<div class="dbox csloc"><div class="dk">Set '+esc(l.no||"")+(l.scenes?' · '+esc(csS(l.scenes)):'')+'</div><div class="dn">'+esc(l.name||"")+(l.map?' <a class="pillbtn" href="'+esc(safeUrl(l.map))+'" target="_blank" rel="noopener noreferrer">📍 '+esc(L("Karte"))+'</a>':'')+'</div>'+
    csA(l.notes).map(n=>'<div class="ds">'+csTx(n)+'</div>').join("")+csA(l.items).map(i=>'<div class="ds"><b>'+esc(i.label||"")+'</b> '+csTx(i.text||"")+(i.map?' <a href="'+esc(safeUrl(i.map))+'" target="_blank" rel="noopener noreferrer">📍 '+esc(L("Karte"))+'</a>':'')+'</div>').join("")+'</div>').join(""),true);
  /* production information */
  h+=csSec(L("Produktionsinfos"),csA(c.info).map(p=>'<p>'+csTx(p)+'</p>').join(""),true,"csinfo");
  /* shooting order */
  const o=c.order||{};
  h+=csSec(L("Drehfolge")+(o.pages?' · '+o.pages+' pgs':''),(o.title?'<p class="ghint">'+esc(o.title)+'</p>':'')+csOrderRows(o.rows),true);
  /* cast, extras, vehicles */
  h+=csSec("Cast",csTable(["#",L("Rolle"),L("Darsteller"),"P/UP","Call",L("Kostüm"),L("Maske"),"Base","On set"],csA(c.cast).map(r=>[r.no,r.role,r.actor,r.pickup,r.call,r.wardrobe,r.makeup,r.base,r.onset]),3),false);
  h+=csSec(L("Komparsen"),csTable(["#",L("Rolle"),"Call",L("Kostüm"),L("Maske"),"On set"],csA(c.extras).map(r=>[r.count,r.part,r.call,r.wardrobe,r.makeup,r.onset])),false);
  h+=csSec(L("Fahrzeuge"),csTable([L("Fahrzeug"),"Via","Call","RTS"],csA(c.vehicles).map(r=>[r.name,r.via,r.call,r.rts])),false);
  /* transport and travel */
  h+=csSec(L("Transport mit Fahrer"),(c.drivers?'<p class="ghint">'+csTx(c.drivers)+'</p>':'')+csTable([L("Fahrzeug"),L("Fahrer"),L("Mitfahrende"),L("Von"),L("Nach")],csA(c.transport).map(r=>[r.vehicle,r.driver,r.passengers,[r.t1,r.from].filter(Boolean).join(" "),[r.t2,r.to].filter(Boolean).join(" ")])),false);
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
   h+=csSec("Calls on Set",[...g].map(([dp,l])=>'<div class="cscall"><div class="cscall-d">'+esc(dp)+'</div>'+l.map(r=>'<div class="cscall-r'+(me&&me.hit(r.name)?' mine':'')+'"><span class="t">'+esc(r.t||"")+'</span><b>'+esc(r.name||"")+'</b><small>'+esc(r.role||"")+'</small></div>').join("")+'</div>').join(""),false)}
  /* totals, notes, radio */
  const nb=[c.total?'<p><b>'+esc(c.total)+'</b></p>':'',...csA(c.notes).map(n=>'<p>'+csTx(n)+'</p>'),c.radio?'<p>📻 '+esc(c.radio)+'</p>':''].join("");
  h+=csSec(L("Notizen & Funk"),nb,false);
  /* emergency (hospital) when the callsheet has it */
  if(x.hospital&&(x.hospital.name||x.hospital.phone))h+='<section class="dsec"><h3 class="dh">'+L('Notfall')+'</h3><div class="people"><div class="p"><div class="hd"><span class="nm">'+esc(x.hospital.name||L("Spital"))+'</span><span class="role">'+L('Nächstes Spital')+'</span></div>'+(x.hospital.address?'<div class="ct"><a href="'+maps([x.hospital.name,x.hospital.address].filter(Boolean).join(", "))+'" target="_blank" rel="noopener noreferrer">'+esc(x.hospital.address)+'</a></div>':'')+(x.hospital.phone?'<div class="ct"><a class="hosp" href="tel:'+esc(String(x.hospital.phone).replace(/\s/g,""))+'"><span>'+esc(x.hospital.phone)+'</span></a></div>':'')+'</div></div></section>';
  /* anything else of the document */
  for(const sec of csA(x.sections).concat(csA(c.sections))){const rows=csA(sec&&sec.rows).map(r=>Array.isArray(r)?r:[r]).filter(r=>r.some(cc=>String(cc==null?"":cc).trim()));if(!rows.length)continue;
    h+=csSec(String(sec.title||""),rows.map(r=>'<p>'+r.map(cc=>csTx(cc)).join(" · ")+'</p>').join(""),false)}
  return h}

/* preview (PREVISION) of a day from the callsheet of the shooting day before – shown on that day while its own callsheet is missing */
function csPrevFor(date){const sh=S.days.filter(d=>d.kind==="shoot").map(d=>d.date).sort();const i=sh.indexOf(date);if(i<1)return null;
  const prev=S.dispos.find(x=>x&&x.date===sh[i-1]&&x.cs&&x.cs.prevision&&csA(x.cs.prevision.rows).length);return prev?{from:prev,pv:prev.cs.prevision}:null}
function csPrevHTML(date){const p=csPrevFor(date);if(!p)return"";
  return '<section class="dsec csprev"><h3 class="dh">'+esc(L("Vorschau"))+' <small>'+esc(L("aus dem Callsheet vom"))+' '+esc(fmtDate(p.from.date))+'</small></h3>'+(p.pv.title?'<p class="ghint">'+esc(p.pv.title)+'</p>':'')+csOrderRows(p.pv.rows)+'</section>'}
