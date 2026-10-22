/* ---------- scenes of the shooting day «quittiert» in the Drehplan: open → running (tap) → done (tap); sceneack/{date-scene}, no names.
   Everybody sees the state live; tapping only with the permission «Szenen quittieren». «Jetzt» follows: the running scene, else the next open one after the last done ---------- */
window.SCACK=window.SCACK||{};let SCSUB=null;
const scHM=msHM;
/* running time: 7′, 1h05 */
const scDur=ms=>{const m=Math.max(0,Math.floor(ms/60000));return m<60?m+"′":Math.floor(m/60)+"h"+pad2(m%60)};
/* the counters of running scenes count on without drawing the page again */
setInterval(()=>document.querySelectorAll("[data-scrun]").forEach(el=>{el.textContent=scDur(Date.now()-(+el.dataset.scrun))}),20e3);
/* one id per scene and day for Drehplan and callsheet alike: «186 pt1A», «186pt1A», «Sc. 186 PT1A», «DJ 186pt1a» → 186pt1a; «21 CONT» = 21 */
function scAckId(date,sc){return String(date||"").replace(/-/g,"")+"-"+fold(String(sc||"")).replace(/[^a-z0-9]/g,"").replace(/^(dj|d|j|sc|sz|seq|scene|szene)(?=\d)/,"").replace(/(cont|continued|forts|fortsetzung)$/,"").slice(0,24)}
window.scAckId=scAckId;
/* lunch and wrap rows of the schedule / shooting order are quittiert too: their key «lunch» / «wrap», else "" */
window.scEvKey=t=>{t=String(t||"");return /\b(lunch|mittag|pranzo|d[ée]jeuner)\b/i.test(t)?"lunch":/\b(wrap|drehschluss)\b/i.test(t)?"wrap":""};
/* setup rows are quittiert like lunch and wrap: the first «setup», the further ones «setup2», «setup3» … */
const scIsSetup=t=>/^\s*set[\s-]?up\b/i.test(String(t||""));
/* the keys of all rows of a day (Drehplan items or callsheet rows): lunch, wrap, setup, setup2 … ; scenes "" */
window.scRowKeys=(rows,txt)=>{let n=0;return (rows||[]).map(r=>{if(!r||r.sc)return"";const t=txt(r);if(scIsSetup(t)){n++;return n>1?"setup"+n:"setup"}return scEvKey(t)})};
/* lunch, wrap and setups of the 2nd/3rd unit have their own entries («lunch_u2»): scBase gives the plain key */
window.scBase=k=>String(k||"").replace(/_u[23]$/,"");
/* the name of a quittiert entry: Lunch, Wrap, Setup 2, else «Szene 186» */
window.scLabel=k=>{k=scBase(k);const m=k.match(/^setup(\d*)$/);return k==="lunch"?"Lunch":k==="wrap"?"Wrap":m?("Setup"+(m[1]?" "+m[1]:"")):L("Szene")+" "+k};
/* state of a scene: 0 open, 1 running, 2 done */
window.scState=(date,sc)=>{if(window.SCACKON===false)return 0;const x=window.SCACK[scAckId(date,sc)];return x?(x.s===1?1:2):0};
/* any scene of that day quittiert (then «jetzt» follows the quittances instead of the clock) */
/* draw again but keep what is open (callsheet parts, scene details, locations) and the scroll position */
function scRender(){const v=document.getElementById("view");if(!v){render();return}
  const secs=[...v.querySelectorAll("details[id]")].filter(d=>d.open).map(d=>d.id),scs=[...v.querySelectorAll("li[data-sc]")].filter(li=>{const d=li.querySelector("details.csscd");return d&&d.open}).map(li=>li.dataset.sc),
    all=[...v.querySelectorAll("details[id]")].filter(d=>d.dataset.all).map(d=>[d.id,d.dataset.all]),y=scrollY;
  render();
  for(const id of secs){const d=document.getElementById(id);if(d)d.open=true}for(const [id,a] of all){const d=document.getElementById(id);if(d)d.dataset.all=a}
  for(const sc of scs){const li=v.querySelector('li[data-sc="'+CSS.escape(sc)+'"]');const d=li&&li.querySelector("details.csscd");if(d)d.open=true}
  scrollTo(0,y)}
window.scHas=date=>{if(window.SCACKON===false)return false;const p=String(date||"").replace(/-/g,"")+"-";return Object.keys(window.SCACK).some(k=>k.startsWith(p))};
const SC_ICO={1:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="13" height="10" rx="2"/><path d="M15.5 10.5l5.5-3v9l-5.5-3z"/><circle cx="6.5" cy="10.5" r="1"/></svg>',
  2:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  /* wrap done: two ticks (the shooting day is finished) */
  wrap:'<svg viewBox="0 0 24 24" width="20" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12.5l4.5 4.5L16.5 7.5"/><path d="M11 16l1 1L21.5 7.5"/></svg>',
  /* lunch running: knife and fork */
  lunch:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3.5v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-6M9 3.5v17"/><path d="M17 20.5v-17c-2 1.2-3 3.6-3 7v2h3"/></svg>'};
/* running: a film camera; done: a tick; wrap: two ticks; lunch running: knife and fork */
/* the round status button of a scene (visible for all, a button only with the permission) */
window.scAckBtn=(date,sc,u)=>{if(!date||!sc||window.SCACKON===false)return"";   /* switched off in App-Verwaltung → Einstellungen */
  u=String(u||"1");const st=scState(date,sc),can=typeof canPerm==="function"&&canPerm("scenes.ack");
  const tip=[L("Szene offen – antippen = Szene beginnt"),L("Szene läuft – antippen = abgeschlossen"),L("Szene abgeschlossen – antippen = ändern")][st];
  const lab=[L("Szene offen"),L("Szene läuft"),L("Szene abgeschlossen")][st];
  /* left of the icon: begin–end, while running begin and a counter how long it runs */
  const x=window.SCACK[scAckId(date,sc)]||{},b0=+x.b||+x.at||0,tm=st===2?scHM(b0)+(x.e?"–"+scHM(x.e):""):st===1?scHM(b0)+' · <span data-scrun="'+b0+'">'+scDur(Date.now()-b0)+'</span>':"";
  const lab0=tm?'<span class="scackt">'+tm+'</span>':'';
  const ico=st===1&&scBase(sc)==="lunch"?SC_ICO.lunch:st===2&&scBase(sc)==="wrap"?SC_ICO.wrap:(SC_ICO[st]||"");
  return '<span class="scackw">'+lab0+(can?'<button type="button" class="scack sk'+st+'" data-scack="'+esc(date)+'|'+esc(String(sc))+'|'+esc(u)+'" aria-label="'+esc(tip)+'" title="'+esc(tip)+'">'+ico+'</button>'
    :'<span class="scack sk'+st+'" role="img" aria-label="'+esc(lab)+'" title="'+esc(lab)+'">'+ico+'</span>')+'</span>'};
/* live for everybody: all quittances (also past shooting days keep their ticks in the Drehplan and callsheet) */
async function scAckSub(){if(SCSUB||typeof ME==="undefined"||!ME)return;try{const {F,db}=await fb();
  SCSUB=F.onSnapshot(F.collection(db,"sceneack"),q=>{const m={};(q.docs||[]).forEach(d=>{m[d.id]=d.data()});if(JSON.stringify(m)!==JSON.stringify(window.SCACK)){window.SCACK=m;scRender()}},()=>{SCSUB=null})}catch(_){SCSUB=null}}
setTimeout(scAckSub,3000);setInterval(()=>{if(!SCSUB)scAckSub()},60e3);
/* the scene running in a unit on that day (other than this one): its scene number, else "" */
function scRunning(date,u,except){for(const [id,x] of Object.entries(window.SCACK))if(x&&x.d===date&&x.s===1&&String(x.u||"1")===String(u||"1")&&id!==except)return x.sc||id.split("-").slice(1).join("-");return""}
const scMs=(date,t)=>{const m=String(t||"").match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;const d=new Date(date+"T00:00:00");d.setHours(+m[1],+m[2],0,0);return d.getTime()};
async function scWrite(date,sc,u,v){const {F,db}=await fb();const id=scAckId(date,sc),ref=F.doc(db,"sceneack",id);
  if(!v){await F.deleteDoc(ref);delete window.SCACK[id]}else{v=Object.assign({d:date,at:Date.now(),u:String(u||"1"),sc:String(sc).slice(0,24)},v);for(const k of ["b","e"])if(v[k]==null)delete v[k];await F.setDoc(ref,v);window.SCACK[id]=v}if(typeof SCLOG!=="undefined"&&SCLOG.list){const i=SCLOG.list.findIndex(x=>x.id===id);if(i>=0)SCLOG.list.splice(i,1);if(v)SCLOG.list.push(Object.assign({id},v))}scRender()}
/* tap: open → running (only when no other scene runs in this unit) → done; a done scene opens the popup to change state and times */
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("button[data-scack]");if(!b)return;e.preventDefault();e.stopPropagation();if(typeof canPerm!=="function"||!canPerm("scenes.ack"))return;
  const [date,sc,u]=b.dataset.scack.split("|");const id=scAckId(date,sc),st=scState(date,sc),x=window.SCACK[id]||{};
  if(st===2){scAckDialog(date,sc,u);return}
  if(st===0){const run=scRunning(date,u,id);if(run){showMsg(L("{s} läuft noch – zuerst abschliessen.").replace("{s}",scLabel(run)),4000);return}}
  b.disabled=true;
  if(st===0&&scBase(sc)==="wrap"){const now=Date.now();for(const [rid,rx] of Object.entries(window.SCACK))if(rx&&rx.d===date&&rx.s===1&&String(rx.u||"1")===String(u||"1")){const k=rx.sc||rid.split("-").slice(1).join("-");try{await scWrite(date,k,u,{s:2,b:rx.b||rx.at||now,e:now})}catch(_){}}}
  try{const v=st===0&&scBase(sc)==="wrap"?{s:2,b:Date.now(),e:Date.now()}:st===0?{s:1,b:Date.now()}:{s:2,b:x.b||x.at||Date.now(),e:Date.now()};const first=st===0&&!/^(lunch|wrap|setup\d*)$/.test(scBase(sc))&&!Object.entries(window.SCACK).some(([rid,rx])=>rx&&rx.d===date&&String(rx.u||"1")===String(u||"1")&&!/^(lunch|wrap|setup\d*)$/.test(scBase(rx.sc||rid.split("-").slice(1).join("-"))));
    await scWrite(date,sc,u,v);if(v.s===2)scShareAsk(date,sc,u,v);else if(first)scShareAsk(date,sc,u,Object.assign({start:1},v))}   /* WhatsApp when something is finished and at the start of shooting (first scene of the day) */
  catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:saveErr(err),4000)}},true);
/* after a scene (lunch, wrap) was finished: offer a short info message by WhatsApp (the person chooses the chat there); «nicht mehr fragen» on this device */
function scShareText(date,sc,u,v){const un=u&&u!=="1"?" · "+((window.UNAME&&UNAME[u])||u)+" Unit":"",dd=" ("+date.split("-").reverse().slice(0,2).join(".")+"."+un+")";
  if(v.start)return L("Drehstart")+" "+scHM(v.b)+" – "+scLabel(sc)+dd;
  if(scBase(sc)==="wrap")return "Wrap "+scHM(v.e||v.b)+" – "+L("Drehtag abgeschlossen")+dd;
  if(scBase(sc)==="lunch")return v.s===1?"Lunch "+L("ab")+" "+scHM(v.b)+dd:L("Lunch vorbei, es geht weiter")+" "+scHM(v.e)+dd;
  return v.s===1?scLabel(sc)+" "+L("läuft seit")+" "+scHM(v.b)+dd:scLabel(sc)+" "+L("abgeschlossen")+" "+scHM(v.b)+"–"+scHM(v.e)+" ("+scDur((v.e||0)-(v.b||0))+")"+dd}
function scShareAsk(date,sc,u,v,force){try{if(!force&&localStorage.getItem("scwa:no")==="1")return}catch(_){}
  const txt=scShareText(date,sc,u,v),d=mkDialog("scwadlg",null,{replace:true});
  d.innerHTML='<div class="a2box scbox"><h3>'+esc(L("Info per WhatsApp senden?"))+'</h3><p class="scwat">'+esc(txt)+'</p>'+
    '<div class="arb"><a class="scwa" href="https://wa.me/?text='+encodeURIComponent(txt)+'" target="_blank" rel="noopener noreferrer" data-scwago>WhatsApp</a><button type="button" class="lnk" data-scwax>'+esc(L("Nein"))+'</button></div>'+
    '<label class="ck scwano"><input type="checkbox" data-scwano> '+esc(L("Nicht mehr fragen (dieses Gerät)"))+'</label></div>';
  d.addEventListener("change",e=>{if(e.target.closest("[data-scwano]")){try{e.target.checked?localStorage.setItem("scwa:no","1"):localStorage.removeItem("scwa:no")}catch(_){}}});
  d.addEventListener("click",e=>{if(e.target===d||e.target.closest("[data-scwax]")||e.target.closest("[data-scwago]"))setTimeout(()=>d.remove(),50)});
  document.body.appendChild(d)}
/* popup of a quittiert scene: state, begin and end time; «offen» takes the quittance away */
function scAckDialog(date,sc,u){const id=scAckId(date,sc),x=window.SCACK[id]||{},st=scState(date,sc);
  const d=mkDialog("scackdlg",null,{replace:true});let cur=st;
  d.innerHTML='<div class="a2box scbox"><h3>'+esc(scLabel(sc))+'</h3><p class="ghint">'+esc(date.split("-").reverse().join("."))+(u&&u!=="1"?' · '+esc((window.UNAME&&UNAME[u])||u)+' Unit':'')+'</p>'+
    '<div class="redst scst" role="group" aria-label="'+esc(L("Status"))+'">'+(scBase(sc)==="wrap"?[[0,"offen"],[2,"Drehschluss"]]:[[0,"offen"],[1,scBase(sc)==="lunch"?"Lunch läuft":"läuft"],[2,"abgeschlossen"]]).map(([v,t])=>'<button type="button" class="scstb" data-scst="'+v+'" aria-pressed="'+(st===v)+'"><span class="scack sk'+v+'">'+((v===1&&scBase(sc)==="lunch"?SC_ICO.lunch:v===2&&scBase(sc)==="wrap"?SC_ICO.wrap:SC_ICO[v])||"")+'</span><span class="scstl">'+esc(L(t))+'</span></button>').join("")+'</div>'+
    '<form data-scform novalidate><div class="redrow"><label>'+esc(L("Beginn"))+'<input type="time" name="b" value="'+esc(scHM(x.b||x.at))+'"></label><label>'+esc(L("Ende"))+'<input type="time" name="e" value="'+esc(scHM(x.e))+'"></label></div>'+
    '<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+esc(L("Speichern"))+'</button><button type="submit" class="scwab" data-scwasub>'+esc(L("Speichern"))+' + WhatsApp</button><button type="button" class="lnk" data-scx>'+esc(L("Abbrechen"))+'</button></div>'+(st?'<button type="button" class="lnk scdel" data-scdel>'+esc(L("Quittierung löschen"))+'</button>':'')+'</form></div>';
  const msg=d.querySelector(".amsg"),f=d.querySelector("form");
  d.addEventListener("click",ev=>{const t=ev.target.closest("[data-scst]");if(t){cur=+t.dataset.scst;d.querySelectorAll("[data-scst]").forEach(z=>z.setAttribute("aria-pressed",String(+z.dataset.scst===cur)));f.e.disabled=cur!==2;f.b.disabled=cur===0;return}
    if(ev.target.closest("[data-scdel]")){const bt=ev.target.closest("[data-scdel]");bt.disabled=true;scWrite(date,sc,u,null).then(()=>{d.remove();if(typeof savedPop==="function")savedPop(true)}).catch(err=>{bt.disabled=false;msg.textContent=saveErr(err)});return}
    if(ev.target===d||ev.target.closest("[data-scx]"))d.remove()});
  f.e.disabled=cur!==2;f.b.disabled=cur===0;
  f.addEventListener("submit",async ev=>{ev.preventDefault();if(ev.submitter&&ev.submitter.dataset.scwasub)f.dataset.wa="1";else delete f.dataset.wa;const bm=scMs(date,f.b.value),em=scMs(date,f.e.value);
    if(cur===1){const run=scRunning(date,u,id);if(run){msg.textContent=L("{s} läuft noch – zuerst abschliessen.").replace("{s}",scLabel(run));return}}
    if(cur===2&&bm&&em&&em<bm){msg.textContent=L("Das Ende liegt vor dem Beginn.");return}
    f.querySelectorAll("button[type=submit]").forEach(b=>b.disabled=true);
    try{const nv=cur===0?null:{s:cur,b:bm||x.b||Date.now(),e:cur===2?(em||x.e||Date.now()):null};await scWrite(date,sc,u,nv);d.remove();if(nv&&f.dataset.wa)scShareAsk(date,sc,u,nv,true);else if(typeof savedPop==="function")savedPop(true)}
    catch(err){f.querySelectorAll("button[type=submit]").forEach(b=>b.disabled=false);msg.textContent=saveErr(err)}});
  document.body.appendChild(d)}
window.scAckDialog=scAckDialog;
/* Einstellungen → Log: the scene log (begin, end and duration of every quittiert scene, by day) */
const SCLOG={list:null,busy:false,open:false};
/* every new visit of «Log» shows it closed again (like the other boxes) */
window.scLogReset=()=>{SCLOG.open=false};
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.lsec==="sclog")SCLOG.open=d.open},true);
async function scLogLoad(){SCLOG.busy=true;try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"sceneack"));SCLOG.list=(q.docs||[]).map(d=>Object.assign({id:d.id},d.data()))}catch(_){SCLOG.list=[]}SCLOG.at=Date.now();SCLOG.busy=false;render()}
/* who sees it: admins and the permission «Szenen-Protokoll sehen» */
window.canSceneLog=()=>typeof isAdmin==="function"&&(isAdmin()||(typeof can==="function"&&can("scenes.log")));
window.sceneLogSec=()=>{if(!canSceneLog())return"";if(!SCLOG.list){if(!SCLOG.busy)scLogLoad();return""}
  const dur=ms=>{const m=Math.max(0,Math.round(ms/60000));return m<60?m+"′":Math.floor(m/60)+"h"+pad2(m%60)};
  const p0=x=>+x.b||+x.at||0,key=x=>x.sc||x.id.split("-").slice(1).join("-"),isEv=k=>{k=scBase(k);return k==="lunch"||k==="wrap"||/^setup\d*$/.test(k)};
  /* the days: every day with quittances and today when it is a shooting day; the newest first */
  const t=todayISO(),days=new Set(SCLOG.list.map(x=>x.d).filter(Boolean));if((S.days||[]).some(d=>d.date===t&&d.kind==="shoot"))days.add(t);
  /* one entry: name, state, planned time; begin, end and duration always (– when not known; running: the counter) */
  /* with «Szenen quittieren»: a pencil per entry opens the same popup as in the Drehplan (state, begin, end, delete) */
  const ED=typeof canPerm==="function"&&canPerm("scenes.ack")&&window.SCACKON!==false,PEN='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
  const row=(name,st,plan,b,e,run,ed)=>'<li class="scl'+(st===0?' sclo':'')+'"><div class="audh"><b>'+name+'</b>'+(ED&&ed?'<button type="button" class="scled" data-scled="'+esc(ed.join("|"))+'" title="'+esc(L("Ändern"))+'" aria-label="'+esc(L("Ändern"))+'">'+PEN+'</button>':'')+(plan?' <span class="audt">'+esc(L("Plan"))+' '+esc(plan)+'</span>':'')+'<span class="audw">'+esc(st===1?L("läuft"):st===2?L("abgeschlossen"):L("offen"))+'</span></div>'+
    '<div class="audb sclt"><span>'+esc(L("Beginn"))+' <b>'+(b?esc(scHM(b)):'–')+'</b></span><span>'+esc(L("Ende"))+' <b>'+(e?esc(scHM(e)):'–')+'</b></span><span>'+esc(L("Dauer"))+' <b>'+(b&&e?esc(dur(e-b)):b&&run?'<span data-scrun="'+b+'">'+esc(dur(Date.now()-b))+'</span>':'–')+'</b></span></div></li>';
  /* one unit of one day: fixed rows setup (planned begin until the first scene), Drehstart (until the wrap), lunch, wrap – plus the further setups and the scenes, by time */
  const unitRows=(d,u,l,day,cs)=>{const its=arr(u==="2"?(day.unit2||{}).items:u==="3"?(day.unit3||{}).items:day.items);
    const tx=i=>String(i.n||""),ks=scRowKeys(its,tx),pl=k=>{const i=ks.indexOf(k);return i>=0?hm(its[i].t)||"":""};
    const setup=its.find(i=>!i.sc&&/^\s*set[\s-]?up\b/i.test(tx(i))),firstSc=its.find(i=>i.sc);
    const uk=k=>u==="1"?k:k+"_u"+u,get=k=>l.find(x=>scBase(key(x))===k),scs=l.filter(x=>!["lunch","wrap","setup"].includes(scBase(key(x))));
    const real=scs.filter(x=>!isEv(key(x))),start=real.length?Math.min(...real.map(p0).filter(Boolean)):0,lu=get("lunch"),wr=get("wrap");
    const ms=hhmm=>{const v=String(hhmm||"").match(/^(\d{1,2}):(\d{2})$/);if(!v)return 0;const x=new Date(d+"T00:00:00");x.setHours(+v[1],+v[2],0,0);return x.getTime()};
    const plSetup=setup?hm(setup.t)||"":"",plStart=(u==="1"?hm(cs.shootCall||""):"")||(firstSc?hm(firstSc.t)||"":"");
    const wrE=wr?(+wr.e||p0(wr)):0,su=get("setup"),fs=real.slice().sort((a,b)=>p0(a)-p0(b))[0],ent=[],add=(x,name,st,plan,b,e,run,ed)=>ent.push([x,row(name,st,plan,b,e,run,ed),{name,st,plan,b,e,k:ed&&name!==esc(L("Drehstart"))?ed[1]:""}]);
    /* setup: its own quittance, else planned begin until the first scene */
    if(su)add(p0(su),"Setup",su.s===1?1:2,plSetup,p0(su),su.s===1?0:+su.e||0,su.s===1&&d===t,[d,uk("setup"),u]);else add(ms(plSetup)||1,"Setup",start?2:0,plSetup,ms(plSetup),start,false,[d,uk("setup"),u]);
    /* Drehstart = begin of the first scene: the pencil opens that scene */
    add(start||ms(plStart)||2,esc(L("Drehstart")),start?(wrE?2:1):0,plStart,start,wrE,!!start&&!wrE&&d===t,fs?[d,key(fs),u]:null);
    add(lu?p0(lu):ms(pl("lunch"))||8e15,"Lunch",lu?(lu.s===1?1:2):0,pl("lunch"),lu?p0(lu):0,lu&&lu.s!==1?+lu.e||0:0,!!lu&&lu.s===1,[d,uk("lunch"),u]);
    for(const x of scs){const k=key(x);add(p0(x),esc(scLabel(k)),x.s===1?1:2,isEv(k)?pl(scBase(k)):"",p0(x),x.s===1?0:+x.e||0,x.s===1&&d===t,[d,k,u])}
    add(wrE||ms(pl("wrap"))||9e15,"Wrap",wr?2:0,pl("wrap"),wrE?start:0,wrE,false,[d,uk("wrap"),u]);
    ent.sort((a,b)=>a[0]-b[0]);return {html:'<ul class="audlist">'+ent.map(e=>e[1]).join("")+'</ul>',n:real.length,start,wrE,rows:ent.map(e=>e[2])}};
  /* shooting day number (DT 1 …): the shooting days with scenes in order */
  const SHD=(S.days||[]).filter(y=>y.kind==="shoot"&&arr(y.items).some(i=>i.sc)).map(y=>y.date).sort();
  /* several units on a day: one part per unit (1st Unit, 2nd Unit …) */
  const EXP=[];SCLOG.exp=EXP;
  /* one daily log per unit: the 1st unit always, the 2nd/3rd unit when they shoot that day or have quittances */
  const html=[...days].sort().reverse().map(d=>{const l=SCLOG.list.filter(x=>x.d===d),day=(S.days||[]).find(y=>y.date===d)||{},cs=((S.dispos||[]).find(y=>y&&y.date===d)||{});
    const hasU=u=>arr((u==="2"?day.unit2:day.unit3)||{}).length||arr(((u==="2"?day.unit2:day.unit3)||{}).items).some(i=>i.sc);
    const us=[...new Set(["1"].concat(l.map(x=>String(x.u||"1")),["2","3"].filter(hasU)))].sort(),dn=SHD.indexOf(d);
    return us.map(u=>{const p=unitRows(d,u,l.filter(x=>String(x.u||"1")===u),day,cs);for(const r of p.rows)EXP.push(Object.assign({dt:dn>=0?"DT "+(dn+1):"",d,u},r));
      return '<details class="tstsu"><summary>'+(dn>=0?'<b>DT '+(dn+1)+'</b> · ':'')+esc(String(d).split("-").reverse().join("."))+' · <b class="sclun">'+esc(((window.UNAME&&UNAME[u])||u)+' Unit')+'</b> · '+p.n+' '+esc(L("Szenen"))+(p.start&&p.wrE?' · '+esc(L("Drehzeit"))+' '+esc(dur(p.wrE-p.start)):'')+'</summary>'+p.html+
        '<div class="sclbtns scld1"><button type="button" class="pillbtn" data-sclx="pdf|'+d+'|'+u+'">PDF</button><button type="button" class="pillbtn" data-sclx="csv|'+d+'|'+u+'">'+esc(L("Tabelle"))+' (Excel)</button></div></details>'}).join("")}).join("");
  return '<details class="tstsec scld" data-lsec="sclog"'+(SCLOG.open?' open':'')+'><summary class="lsum">'+(typeof logHead==="function"?logHead(esc(L("Szenen-Protokoll")),'<span class="tsth">'+SCLOG.list.filter(x=>!isEv(key(x))).length+' '+esc(L("Szenen"))+'</span>',(()=>{const m=Math.max(0,...SCLOG.list.map(x=>+x.at||0))||SCLOG.at||Date.now();const z=new Date(m);return esc(pad2(z.getDate())+"."+pad2(z.getMonth()+1)+". "+scHM(m))})()):esc(L("Szenen-Protokoll")))+'</summary>'+
    '<div class="admins"><p class="ahint">'+esc(L("Beginn, Ende und Dauer jeder quittierten Szene (Drehplan und Callsheet), dazu Setup, Drehstart, Lunch und Wrap."))+'</p>'+
    (html||'<p class="ghint">'+esc(L("Noch keine Einträge."))+'</p>')+
    '<div class="sclbtns"><button type="button" class="pillbtn" data-sclre>'+esc(L("Neu laden"))+'</button>'+'</div>'+(html?[...new Set(EXP.map(r=>String(r.u)))].sort().map(u=>'<div class="sclbtns sclall"><b>'+esc(((window.UNAME&&UNAME[u])||u)+' Unit')+'</b> · '+esc(L("alle Tage"))+'<button type="button" class="pillbtn" data-sclx="pdf||'+u+'">PDF</button><button type="button" class="pillbtn" data-sclx="csv||'+u+'">'+esc(L("Tabelle"))+' (Excel)</button></div>').join(""):'')+'</div></details>'};   /* the export always per unit */
/* export of the scene log: as a table (CSV for Excel, Numbers, Google Sheets) or as PDF (print view → «Als PDF sichern»); oldest day first */
function scExpRows(d,u){const un=s=>{const x=document.createElement("textarea");x.innerHTML=String(s||"");return x.value};
  return (SCLOG.exp||[]).filter(r=>(!d||r.d===d)&&(!u||String(r.u)===u)).sort((a,b)=>a.d.localeCompare(b.d)).map(r=>Object.assign({dt:r.dt,date:r.d.split("-").reverse().join("."),unit:((window.UNAME&&UNAME[r.u])||r.u)+" Unit",name:un(r.name),
    st:r.st,state:r.st===1?L("läuft"):r.st===2?L("abgeschlossen"):L("offen"),plan:r.plan||"",b:r.b?scHM(r.b):"",e:r.e?scHM(r.e):"",min:r.b&&r.e?String(Math.round((r.e-r.b)/60000)):""},scInfo(r)))}
/* more about a scene for the export: I/E, set, pages, cast and the description from the Drehplan of that day (and unit) */
function scInfo(r){const k=scBase(r.k||"");if(!k||/^(lunch|wrap|setup\d*)$/.test(k)||typeof schedIndex!=="function")return {ie:"",set:"",pg:"",cast:"",desc:""};
  let o=null;try{const l=schedIndex()[norm(k)]||[];o=l.find(y=>y.d&&y.d.date===r.d&&String(y.u||"1")===String(r.u||"1"))||l.find(y=>y.d&&y.d.date===r.d)||null}catch(_){}
  const it=(o&&o.it)||{},cm=(S.meta&&S.meta.cast)||{};
  return {ie:it.ie||"",set:it.set||"",pg:it.pg||"",cast:arr(it.cast).map(i=>cm[i]?i+" "+cm[i]:i).join(", "),desc:typeof TX==="function"?TX(it,"d")||"":(it.d||"")}}
const SCX_HEAD=()=>[L("Drehtag"),L("Datum"),"Unit",L("Eintrag"),L("Status"),L("Plan"),L("Beginn"),L("Ende"),L("Dauer")+" (min)","I/E","Set",L("Seiten"),"Cast",L("Beschreibung")];
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-sclx]");if(!b)return;e.preventDefault();const [k,dd,uu]=b.dataset.sclx.split("|"),rows=scExpRows(dd,uu),stamp=(dd||todayISO())+(uu?"_Unit"+uu:"");
  const cells=r=>[r.dt,r.date,r.unit,r.name,r.state,r.plan,r.b,r.e,r.min,r.ie,r.set,r.pg,r.cast,r.desc];
  if(k==="csv"){const q=v=>{v=String(v==null?"":v);return /[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
    const txt="﻿"+[SCX_HEAD()].concat(rows.map(cells)).map(r=>r.map(q).join(";")).join("\r\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"text/csv;charset=utf-8"}));a.download="Szenen-Protokoll_"+stamp+".csv";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);return}
  const UN=uu?((window.UNAME&&UNAME[uu])||uu)+" Unit":"",HD=SCX_HEAD().filter((_,i)=>i>2),days=[...new Set(rows.map(r=>r.dt+" · "+r.date))];
  const doc='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(L("Szenen-Protokoll"))+' '+esc(UN)+' '+esc(stamp)+'</title><style>body{font:11px/1.35 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#111}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:16px 0 6px;break-after:avoid}h2~h2{break-before:page}table{border-collapse:collapse;width:100%;break-inside:auto}th,td{border-bottom:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f2f2f2}td.n{font-variant-numeric:tabular-nums;white-space:nowrap}tr.o td{color:#888}td.scxd{font-size:10.5px;color:#333;min-width:40mm}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>'+esc(L("Szenen-Protokoll"))+(UN?' · '+esc(UN):'')+'</h1>'+
    days.map(k=>'<h2>'+esc(k.replace(/^ · /,""))+'</h2><table><thead><tr>'+HD.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+
      rows.filter(r=>r.dt+" · "+r.date===k).map(r=>'<tr'+(r.st?'':' class="o"')+'>'+cells(r).slice(3).map((v,i)=>'<td'+(i>=2&&i<=5?' class="n"':i===11?' class="scxd"':'')+'>'+esc(v)+'</td>').join("")+'</tr>').join("")+'</tbody></table>').join("")+'</body></html>';
  /* the print view in a new window (a page of its own from a blob), its print dialog offers «Als PDF sichern» */
  const url=URL.createObjectURL(new Blob([doc],{type:"text/html;charset=utf-8"})),w=window.open(url,"_blank");
  if(w){const go=()=>{try{w.focus();w.print()}catch(_){}};try{w.addEventListener("load",()=>setTimeout(go,200))}catch(_){setTimeout(go,800)}setTimeout(()=>URL.revokeObjectURL(url),120000);return}
  /* pop-ups blocked: print from a hidden frame */
  const f=document.createElement("iframe");f.style.cssText="position:fixed;width:0;height:0;border:0;right:0;bottom:0";f.addEventListener("load",()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(_){}setTimeout(()=>{f.remove();URL.revokeObjectURL(url)},60000)});f.src=url;document.body.appendChild(f)});
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-sclre]")){SCLOG.list=null;render()}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-scled]");if(!b)return;e.preventDefault();e.stopPropagation();const [d,k,u]=b.dataset.scled.split("|");scAckDialog(d,k,u||"1")},true);
