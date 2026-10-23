/* ---------- Callsheet (4/6): my day – departments, what is open for me, «Mein Drehtag», tiles, jump bar, sums ---------- */
/* short code of a place for the call list: L1, L2, Base, P1 … */
function csShort(p){const n=String(p&&p.name||"");let m=n.match(/^Set\s*(\w+)/i);if(m)return "L"+m[1];if(/base|lunch|waldrand/i.test(n))return "Base";m=n.match(/park\w*\s*loc\.?\s*(\d+)/i);if(m)return "P"+m[1];m=n.match(/loc\.?\s*(\d+)/i);if(m)return "L"+m[1];return n.split(/[ ,·]/)[0].slice(0,8)}
/* is this department mine? words of my call's department and of my profile (Assistant Directors ~ AD/Regie, Camera ~ Kamera …) */
const CSDSYN=[["ad","regie","directors","direction"],["camera","kamera","cam"],["sound","ton"],["light","licht","electric","gaffer"],["grip","grips","buhne"],["costume","kostum","wardrobe"],["makeup","maske","make","hair"],["production","produktion","prod"],["location","locations"],["art","ausstattung","props","requisite"],["catering","kuche"],["transport","fahrer","driver"],["script","continuity"]];
function csDWords(t){const w=fold(String(t||"")).split(/[^a-z0-9]+/).filter(x=>x.length>1&&!["and","und","the","de","of"].includes(x));const out=new Set(w);for(const g of CSDSYN)if(w.some(x=>g.includes(x)))g.forEach(x=>out.add(x));return out}
/* Maske and Kostüm see the cast right after «Mein Drehtag» */
function csCmFirst(c,me){try{if(!me)return false;const w=csMyWords(c,me);return ["makeup","maske","costume","kostum","wardrobe"].some(x=>w.has(x))}catch(_){return false}}
/* the cast part is always open for AL/AD (Aufnahmeleitung, Regieassistenz), the role Crew 1AD, drivers, Maske and Kostüm */
/* the rides open by default for the role «Fahrer» and for whoever drives on this day */
/* role «Komparsen» / «Extras»: the extras of the callsheet always open (like the rides for drivers) */
function csExOpen(){try{return !!(window.roleIsExtras&&window.roleIsExtras())}catch(_){return false}}
function csTransOpen(c,me){try{if(typeof MYROLE!=="undefined"&&/fahrer|driver/i.test(MYROLE||""))return true;return csIDrive(c,me)}catch(_){return false}}
function csCastOpen(c,me){try{if(typeof MYROLE!=="undefined"&&/1ad/i.test(MYROLE||""))return true;if(!me)return false;
  if(csIDrive(c,me))return true;
  const w=csMyWords(c,me,true);
  return ["ad","regie","location","locations","aufnahmeleitung","al","transport","fahrer","driver","runner","makeup","maske","costume","kostum","wardrobe"].some(x=>w.has(x))}catch(_){return false}}
function csMyDept(c,me,dept){if(!me)return false;const mine=csMyWords(c,me);
  const w=csDWords(dept);for(const x of w)if(x.length>2&&mine.has(x)||x==="ad"&&mine.has("ad"))return true;return false}
const CSMINEMEMO=new WeakMap();function csMine(c,me){if(!c||!me)return[];let m=CSMINEMEMO.get(c);if(!m)CSMINEMEMO.set(c,m=new Map());const k=me.name+"|"+me.dep+"|"+(typeof LANG!=="undefined"?LANG:"")+"|"+vok("phone")+"|"+(window.REDVER||0);if(!m.has(k)){m.clear();m.set(k,csMine0(c,me))}return m.get(k).slice()}   /* only the latest (else every ride change added one) */
/* the destination of a ride as a map link (the place of the callsheet, else a map search) */
function csToLink(c,to){const t0=String(to||"").trim();if(!t0)return"";const um=t0.match(/https?:\/\/\S+/);const t=t0.replace(/https?:\/\/\S+/g,"").trim()||L("Karte");
  if(um&&t===L("Karte"))return '<a class="csadl" href="'+esc(safeUrl(um[0]))+'" target="_blank" rel="noopener noreferrer"><span>'+esc(t)+'</span></a>';let pl=null;try{pl=csPlace(c,t)}catch(_){}
  const u=(pl&&pl.map)||csMapQ((pl&&pl.addr)||t);return '<a class="csadl" href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer"><span>'+esc(plDe(t))+'</span></a>'}
function csMine0(c,me){const mine=[];
  /* I drive: the passengers of the ride folded below it (tap opens) */
  const pax=r=>{if(!me.hit(r.driver))return"";const p=String(r.passengers||"").trim();if(!p)return"";const n=p.split(/\s*(?:,|;|\bund\b|\/|\+)\s*/).filter(x=>x.trim()).length;
    return '<details class="csmepax"><summary>'+esc(L("Mitfahrende"))+' · '+n+'</summary><span class="csmepl">'+esc(p)+'</span></details>'};
  const call=csMyCall(c,me);if(call){const pl=csCallPlace(c,me,call);
    mine.push('<div class="csme-r"><span class="k">'+esc(L("Mein Call"))+'</span><b>'+esc(call.t||"")+'</b> <small>'+esc([call.role,call.dept].filter(Boolean).join(" · "))+'</small></div>'+
      (pl?'<div class="csme-r"><span class="k">'+esc(L("Call-Ort"))+'</span>'+(pl.map?'<a class="cscallpl" href="'+esc(safeUrl(pl.map))+'" target="_blank" rel="noopener noreferrer"><b>'+esc(plDe(pl.name))+'</b></a>':'<b>'+esc(plDe(pl.name))+'</b>')+(pl.how?' <small>'+esc(pl.how)+'</small>':'')+'</div>':''))}
  const cast=csA(c.cast).find(r=>me.hit(r.actor));if(cast)mine.push('<div class="csme-r"><span class="k">Cast</span>'+esc([cast.role,cast.pickup&&"P/UP "+cast.pickup,cast.call&&"Call "+cast.call,cast.onset&&"Set "+cast.onset].filter(Boolean).map(csDurT).join(" · "))+'</div>');
  /* pickup: the first ride of the day – shown first, before «Mein Call» */
  {const rides=csMyRides(c,me).filter(r=>hm(r.t1)).sort((a,b)=>hm(a.t1).localeCompare(hm(b.t1)));
   var pu=rides[0];if(pu&&!(cast&&cast.pickup))mine.splice(0,0,'<div class="csme-r"><span class="k">Pickup</span><b>'+esc(hm(pu.t1))+'</b> '+esc(pu.from||"")+(pu.to?' → '+csToLink(c,pu.to)+(pu.t2?" "+esc(pu.t2):""):'')+' <small>'+esc([pu.vehicle,pu.driver].filter(Boolean).join(" · "))+'</small>'+pax(pu)+'</div>');else pu=null}
  /* the other rides (the pickup ride is already shown above) */
  for(const r of csA(c.transport).filter(r=>(me.hit(r.passengers)||me.hit(r.driver))&&r!==pu))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+csToLink(c,r.to)+(r.t2?" "+esc(r.t2):"")+' <small>'+esc([r.vehicle,r.driver].filter(Boolean).join(" · "))+'</small>'+pax(r)+'</div>');
  for(const r of csA(c.crewTransport).filter(r=>me.hit(r.people)&&r!==pu))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+csToLink(c,r.to)+(r.t2?" "+esc(r.t2):"")+' <small>'+esc(r.vehicle||"")+'</small></div>');
  for(const r of csA(c.travel).filter(r=>me.hit(r.name)&&(!r.date||!c._date||r.date===c._date)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Anreise"))+'</span>'+esc([r.how,r.from,r.t1].filter(Boolean).join(" "))+' → '+csToLink(c,r.to)+(r.t2?" "+esc(r.t2):"")+'</div>');
  {let first=true;for(const r of csA(c.depts).filter(r=>csMyDept(c,me,r.dept)&&String(r.text||"").trim())){const lab=first?esc(L("Abteilung")):"";first=false;mine.push('<div class="csme-r"><span class="k">'+lab+'</span><b>'+esc(r.dept||"")+'</b> '+csTx(r.text)+'</div>');}}
  /* value in its own span (label | value side by side on the phone) */
  return mine.map(x=>x.replace(/<div class="csme-r"><span class="k">(.*?)<\/span>(.*?)<\/div>/g,'<div class="csme-r"><span class="k">$1</span><span class="v">$2</span></div>'))}
/* the time tiles of a callsheet day (Crew Call … Wrap, sun, weather, drive to my call place) – callsheet and Today */
function csTilesHTML(x,day,c,me){const t=c.times||{};
  const tile=csTile;
  return '<div class="dtiles cstiles" id="cs-zeiten">'+tile("Crew Call",t.crewCall||x.crewCall,true)+tile("Rehearsal",t.rehearsal)+tile("RTS",t.rts||x.shootCall)+tile("Lunch",t.lunch)+tile("Wrap",t.wrap||x.wrap)+
    (()=>{const a=c.sunrise||x.sr,b=c.sunset||x.ss;return a&&b?'<div class="dt cssunt"><div class="k">'+esc(L("Sonne"))+'</div><div class="v">'+esc(a)+'<span class="sd">–</span><br>'+esc(b)+'</div></div>':''})()+(typeof wxTile==="function"&&day&&day.date&&wxTile(day)?'<div class="dt cswx">'+wxTile(day)+'</div>':tile(L("Wetter"),[c.weather,c.temp].filter(Boolean).join(" · ")).replace('class="dt"','class="dt wide"'))
    /* drive to my call place: route from the hotel or from where I am */
    +(()=>{if(!me)return"";const call=csMyCall(c,me);let pl=null;try{pl=call?csCallPlace(c,me,call):null}catch(_){}/* no sure call place (no call or no ride): the way to the Base of the day, else to location 1 – marked as such */
      if(!pl){const ls=csLocs(c),b=ls.find(l=>l.kinds&&l.kinds.includes("Base"))||ls.find(l=>!l.kinds);if(!b)return"";let ad="";try{ad=csLocAddr(c,b,x.date)}catch(_){}
        pl={name:ad||b.name||"",map:b.map||"",fbk:b.kinds?"Base":"L"+String(b.no||"").trim(),fbn:String(b.name||"")}}
      /* my call place is a side place given by its kind («W / H / M Cast / E», «Base»): the place of the day with that kind – its name, address and map */
      else if(!pl.map&&!/^Set\s/i.test(String(pl.name||""))){try{const f=v=>fold(String(v||"")).replace(/[^a-z0-9]/g,""),pn=f(pl.name),ls=csLocs(c);
        const hit=pn&&(ls.find(l=>l.kinds&&(f(l.name)===pn||f(l.no)===pn))||ls.find(l=>l.kinds&&l.kinds.some(k=>{const kk=f(String(k).replace(/ (Cast|Extras)$/,""));return kk.length>2&&pn.includes(kk)})));
        if(hit){let ad="";try{ad=csLocAddr(c,hit,x.date)}catch(_){}const kj=f(hit.kinds.join(""));const nm=f(hit.name)&&f(hit.name)!==kj&&!hit.kinds.some(k=>f(k)===f(hit.name))?String(hit.name):"";
          pl=Object.assign({},pl,{name:ad||nm||pl.name,map:hit.map||"",disp:nm||(ad?ad.split(",")[0]:"")})}}catch(_){}}
      const to=(pl.addr||String(pl.name||"").replace(/^[^:]*:\s*/,"").replace(/^Set\s*\w+\s*·\s*/,"")).trim();if(!to&&!pl.map)return"";
      /* only a name without address but a map link (e.g. «Tech Parking»): the map link, not a Google search for the name */
      if(pl.map&&!pl.addr&&!/\d{4}\s+\p{L}/u.test(to)&&pl.disp)return '<a class="dt csdrv" href="'+esc(safeUrl(pl.map))+'" target="_blank" rel="noopener noreferrer"><div class="k">'+esc(L("Anfahrt"))+'</div><div class="v">'+esc(plDe(pl.disp).slice(0,18))+' ›</div></a>';if(!to)return '<a class="dt csdrv" href="'+esc(safeUrl(pl.map))+'" target="_blank" rel="noopener noreferrer"><div class="k">'+esc(L("Anfahrt"))+(pl.fbk?' '+esc(pl.fbk):'')+'</div><div class="v">'+esc(L("Karte"))+' ›</div></a>';
      const from=(day&&day.drive&&day.drive.from)||"Hotel",enc=encodeURIComponent,url="https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+enc(from)+"&destination="+enc(to),here="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination="+enc(to);
      return '<button type="button" class="dt csdrv" data-route="'+esc(JSON.stringify({h:url,c:here,from,to}))+'" title="'+esc(L("Route in Google Maps"))+'"><div class="k">'+esc(L("Anfahrt"))+(pl.fbk?' '+esc(pl.fbk):'')+'</div><div class="v">'+esc((()=>{if(pl.fbk)return pl.fbn.slice(0,18)||L("Route");if(pl.disp)return plDe(pl.disp).slice(0,18);const nm=String(pl.name||"");return /^Set\s/i.test(nm)?csShort(pl):(nm.replace(/^[^·]*·\s*/,"").replace(/^[^:]*:\s*/,"").trim().slice(0,18)||L("Route"))})())+' ›</div></button>'})()+'</div>';}
/* parts of the callsheet (each one a folded section; c = callsheet, x = day of the dispo, me = me, SU = sums of the folded parts, t = times) */
function csJumpBar(c,x,me,SU,t){let JB="";
  {const has=k=>({loc:csA(c.locations).length,order:csRows(c).length,cast:csA(c.cast).length,trans:csA(c.transport).length||csA(c.crewTransport).length||csA(c.travel).length,dept:csA(c.depts).some(r=>String(r.text||"").trim()),calls:csA(c.calls).length})[k];
   const J=[["loc","Locations","pin",L("Orte")],["order",L("Drehfolge"),"film",L("Szenen")],["cast","Cast","cast"],["trans","Transport","car",L("Fahrten")],["dept",L("Infos nach Abteilung"),"dept",L("Infos")],["calls","Calls","calls"]].filter(([k])=>has(k));
   /* icons with a tiny label; the search opens from the magnifier (keeps the bar one line high) */
   JB='<div class="csjump"><div class="csjb">'+J.map(([k,l,i,sh])=>'<button type="button" data-csj="'+k+'" aria-label="'+esc(l)+'" title="'+esc(l)+'">'+CSI[i]+'<span>'+esc(sh||l)+'</span></button>').join("")+
     '<button type="button" class="csqb" data-csqb aria-label="'+esc(L("Suchen"))+'" title="'+esc(L("Suchen"))+'">'+CSI.search+'<span>'+esc(L("Suchen"))+'</span></button>'+
     /* only what concerns me (my name, my scenes as cast, my department) */
     (me?'<button type="button" class="csmineb" data-csmine aria-pressed="'+(CSMINE?"true":"false")+'" aria-label="'+esc(L("Nur meins"))+'" title="'+esc(L("Nur meins"))+'">'+CSI.me+'<span>'+esc(L("Nur meins"))+'</span></button>':'')+
     /* the original callsheet: its pages in the app, else the PDF in the Dropbox */
     (arr(x.pg).length&&typeof window.blkImg==="function"?'<button type="button" data-cspg="'+esc(x.date)+'" aria-label="'+esc(L("Original-Callsheet ansehen"))+'" title="'+esc(L("Original-Callsheet ansehen"))+'">'+CSI.doc+'<span>PDF</span></button>':
      x.link?'<button type="button" data-cspdf="'+esc(safeUrl(x.link))+'" aria-label="'+esc(L("In Dropbox öffnen"))+'" title="'+esc(L("In Dropbox öffnen"))+'">'+CSI.doc+'<span>PDF</span></button>':'')+'</div><input id="csq" type="search" autocomplete="off"'+(window.CSQV?' value="'+esc(CSQV)+'"':' hidden')+' placeholder="'+esc(L("Suchen: Name, Szene, Fahrzeug …"))+'"></div>'}
  return JB}
function csSums(c,x){  const SU={};{const sm=a=>{a=a.filter(x=>x&&x[1]!==""&&x[1]!=null&&x[1]!==0);return a.length?'<span class="cscount">'+a.map(([k,v,d])=>'<span'+(d?' class="csdrop"':'')+'><b>'+esc(String(v))+'</b> '+(Array.isArray(k)?'<i class="lg">'+esc(k[0])+'</i><i class="sh">'+esc(k[1])+'</i>':esc(k))+'</span>').join("")+'</span>':''};
    const uniq=l=>new Set(l.map(x=>fold(String(x||"")).trim()).filter(Boolean)).size;
    
    {/* the numbers in the head of «Cast»: pink = On set, pink box = waiting at the Base for the pickup, grey = not called yet */
     /* the day of the ticks on the callsheet itself (a copy per row defeated the cache of the rows: every row was worked out again on every drawing) */
     if(!c._date&&x&&x.date)c._date=x.date;
     const stg={};if(window.cqStage)for(const r of csA(c.cast)){const n=String(r.no||"").trim();if(n)stg[n]=window.cqStage(c,r)}
     const nos=csA(c.cast).map(r=>String(r.no||"").trim()).filter(Boolean).sort((a,b)=>(parseInt(a,10)||0)-(parseInt(b,10)||0)||a.localeCompare(b));
     SU.cast=nos.length?'<span class="cscount csnos">'+nos.map(n=>'<span class="csno'+(stg[n]===3?' cqnon':stg[n]===0?' cqnwait':' cqnbase')+'">'+esc(n)+'</span>').join("")+'</span>':''}
    SU.travel=sm([[L("Personen"),csA(c.travel).filter(r=>!r.date||!c._date||r.date===c._date).length]]);
    /* extras: how many are On set already – people (count of the groups ticked On set) and groups, e.g. «On set 3/13 · Gruppen 1/4» */
    {const ex=csA(c.extras),dt=(x&&x.date)||c._date,on=r=>{try{return !!(dt&&window.xqAll&&window.xqAll(Object.assign({},c,{_date:dt}),r))}catch(_){return false}};
     const tot=ex.reduce((a,r)=>a+(parseInt(r.count,10)||0),0),pOn=ex.filter(on).reduce((a,r)=>a+(parseInt(r.count,10)||0),0),gOn=ex.filter(on).length;
     SU.extras=sm([[L("On set"),tot?pOn+"/"+tot:""],[[L("Gruppen"),"Gr."],ex.length?gOn+"/"+ex.length:""]])}   /* short on the phone: the head has little room */
    SU.veh=sm([[L("Fahrzeuge"),csA(c.vehicles).length]]);
    SU.trans=sm([[L("Fahrten"),csA(c.transport).length],[L("Fahrzeuge"),uniq(csA(c.transport).map(r=>r.vehicle)),"drop"],[L("Fahrer"),uniq(csA(c.transport).map(r=>r.driver)),"drop"]]);
    SU.ctrans=sm([[L("Fahrten"),csA(c.crewTransport).length],[L("Fahrzeuge"),uniq(csA(c.crewTransport).map(r=>r.vehicle)),"drop"]]);
    SU.dept=sm([[[L("Abteilungen"),"Dept."],csA(c.depts).filter(r=>String(r.text||"").trim()).length]]);
    SU.calls=sm([[[L("Personen"),L("Pers.")],uniq(csA(c.calls).map(r=>r.name))]]);
    SU.notes=sm([[L("Notizen"),csA(c.notes).length]])}
  return SU}
function csCountLine(c,x,me,SU,t){  let csCnt="";{const nCast=csA(c.cast).length,nCrew=new Set(csA(c.calls).map(r=>nmk(String(r.name||""))).filter(Boolean)).size,nEx=csA(c.extras).reduce((a,r)=>a+(parseInt(r.count,10)||0),0);
   /* the callsheet's own totals line («TOTAL: 62 || CREW: 46 CAST: 11 EXTRAS: 0 ZUSATZ: 5») wins over counting rows */
   const tl=String(c.total||"")+" "+csA(c.notes).join(" ");const g=re=>{const m=tl.match(re);return m?+m[1]:null};
   const T={tot:g(/TOTAL:?\s*(\d+)/i),crew:g(/CREW:?\s*(\d+)/i),cast:g(/CAST:?\s*(\d+)/i),ex:g(/EXTRAS:?\s*(\d+)/i),zu:g(/ZUSATZ:?\s*(\d+)/i)};
   /* the cast as listed; when the totals line says something else, its number as a hint (the document contradicts itself) */
   const castV=T.cast!=null&&nCast&&T.cast!==nCast?nCast+'<small class="cshint" title="'+esc(L("laut Totalzeile des Callsheets"))+'"> ('+esc(L("laut Callsheet"))+' '+T.cast+')</small>':(T.cast!=null?T.cast:nCast);
   const parts=T.tot!=null?[["Cast",castV],["Crew",T.crew],[L("Komparsen"),T.ex],[L("Zusatz"),T.zu],["Total",T.tot]]:[["Cast",nCast],["Crew",nCrew],[L("Komparsen"),nEx],["Total",nCast+nCrew+nEx]];
   const pp=parts.filter(x=>x[1]);csCnt=pp.length?'<div class="cscount">'+pp.map(([k,v])=>'<span'+(k===L("Komparsen")||k===L("Zusatz")?' class="csdrop"':'')+'><b>'+(typeof v==="string"&&/</.test(v)?v:esc(String(v)))+'</b> '+esc(k)+'</span>').join("")+'</div>':''}
  return csCnt}
function csTeamSec(c,x,me,SU,t){const csCnt=csCountLine(c,x,me,SU,t);let h="";
  h+=csSec(L("Team des Tages"),csA(c.key).length||c.office||csCnt?'<div class="cskey">'+(c.office?'<div><span class="k">'+esc(L("Produktionsbüro"))+'</span>'+csTx(c.office)+'</div>':'')+csA(c.key).map(k=>{const tel=String(k.phone||"").replace(/[^\d+]/g,"");
      /* the name is the call link (with the phone right) */
      return '<div><span class="k">'+esc(k.role||"")+'</span>'+(tel.length>6&&vok("phone")?'<a class="csct" href="tel:'+esc(tel)+'" title="'+esc(k.phone)+'">'+CSI.phone+esc(k.name||k.phone)+'</a>':'<span>'+esc(k.name||"")+(tel&&!vok("phone")?' '+csTx(k.phone):'')+'</span>')+'</div>'}).join("")+'</div>'+
    csA(c.lists).map(l=>'<p class="cslist"><b>'+esc(l.title||"")+'</b> '+esc(csS(l.names))+'</p>').join(""):"",false,"","team",csCnt);
  return h}
