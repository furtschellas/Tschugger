/* ---------- scenes of the shooting day «quittiert» in the Drehplan: open → running (tap) → done (tap); sceneack/{date-scene}, no names.
   Everybody sees the state live; tapping only with the permission «Szenen quittieren». «Jetzt» follows: the running scene, else the next open one after the last done ---------- */
window.SCACK=window.SCACK||{};let SCSUB=null;
/* the times of the quittances (begin–end, running since) only with the permission «Quittierungszeiten sehen» */
window.scTimesOk=()=>typeof canPerm==="function"&&canPerm("scenes.times");
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
  /* the state symbol only with «Quittierungen sehen» (or the right to quittieren) */
  if(!can&&!(typeof canPerm==="function"&&canPerm("scenes.see")))return"";
  const tip=[L("Szene offen – antippen = Szene beginnt"),L("Szene läuft – antippen = abgeschlossen"),L("Szene abgeschlossen – antippen = ändern")][st];
  const lab=[L("Szene offen"),L("Szene läuft"),L("Szene abgeschlossen")][st];
  /* left of the icon: begin–end, while running begin and a counter how long it runs */
  const x=window.SCACK[scAckId(date,sc)]||{},b0=+x.b||+x.at||0,tm=st===2?scHM(b0)+(x.e?"–"+scHM(x.e):""):st===1?scHM(b0)+' · <span data-scrun="'+b0+'">'+scDur(Date.now()-b0)+'</span>':"";
  /* sctp = Drehplan, sctc = Callsheet: App-Verwaltung can hide the times there on phones and on computers (classes on <html>) */
  const lab0=tm&&scTimesOk()?'<span class="scackt '+(S.tab==="dispo"?"sctc":"sctp")+'">'+tm+'</span>':'';
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
async function scWrite(date,sc,u,v){const id=scAckId(date,sc),old=window.SCACK[id],undo=()=>{if(old)window.SCACK[id]=old;else delete window.SCACK[id];scRender()};
  /* through the data layer: offline the scene state shows at once and is sent later */
  if(!v){await dbWrite("delete","sceneack/"+id,null,{undo});delete window.SCACK[id]}else{v=Object.assign({d:date,at:Date.now(),u:String(u||"1"),sc:String(sc).slice(0,24)},v);for(const k of ["b","e"])if(v[k]==null)delete v[k];await dbWrite("set","sceneack/"+id,v,{undo});window.SCACK[id]=v}if(typeof SCLOG!=="undefined"&&SCLOG.list){const i=SCLOG.list.findIndex(x=>x.id===id);if(i>=0)SCLOG.list.splice(i,1);if(v)SCLOG.list.push(Object.assign({id},v))}scRender()}
/* tap: open → running (only when no other scene runs in this unit) → done; a done scene opens the popup to change state and times */
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("button[data-scack]");if(!b)return;e.preventDefault();e.stopPropagation();if(typeof canPerm!=="function"||!canPerm("scenes.ack"))return;
  const [date,sc,u]=b.dataset.scack.split("|");const id=scAckId(date,sc),st=scState(date,sc),x=window.SCACK[id]||{};
  if(st===2){scAckDialog(date,sc,u);return}
  if(st===0){const run=scRunning(date,u,id);if(run){showMsg(L("{s} läuft noch – zuerst abschliessen.").replace("{s}",scLabel(run)),4000);return}}
  /* WhatsApp per kind of quittance (Mein Konto → App): «direkt» opens WhatsApp right in this tap (a phone allows it only here, not after saving) */
  const wv=st===0&&scBase(sc)==="wrap"?{s:2,b:Date.now(),e:Date.now()}:st===0?{s:1,b:Date.now()}:{s:2,b:x.b||x.at||Date.now(),e:Date.now()};
  const wk=scWaKind(date,sc,u,wv),wm=scWaMode(wk);if(wm==="a")scWaOpen(scShareText(date,sc,u,wk==="d"?Object.assign({start:1},wv):wv));
  b.disabled=true;
  if(st===0&&scBase(sc)==="wrap"){const now=Date.now();for(const [rid,rx] of Object.entries(window.SCACK))if(rx&&rx.d===date&&rx.s===1&&String(rx.u||"1")===String(u||"1")){const k=rx.sc||rid.split("-").slice(1).join("-");try{await scWrite(date,k,u,{s:2,b:rx.b||rx.at||now,e:now})}catch(_){}}}
  try{const v=st===0&&scBase(sc)==="wrap"?{s:2,b:Date.now(),e:Date.now()}:st===0?{s:1,b:Date.now()}:{s:2,b:x.b||x.at||Date.now(),e:Date.now()};const first=st===0&&!/^(lunch|wrap|setup\d*)$/.test(scBase(sc))&&!Object.entries(window.SCACK).some(([rid,rx])=>rx&&rx.d===date&&String(rx.u||"1")===String(u||"1")&&!/^(lunch|wrap|setup\d*)$/.test(scBase(rx.sc||rid.split("-").slice(1).join("-"))));
    await scWrite(date,sc,u,v);scBar(date,sc,u,v,wm==="f"?(wk==="d"?Object.assign({start:1},v):v):null)}   /* after every quittance: change the time right away; WhatsApp «Fragen» as a button there */
  catch(err){b.disabled=false;showMsg(err&&err.code==="simulation"?err.message:saveErr(err),4000)}},true);
/* after a scene (lunch, wrap) was finished: offer a short info message by WhatsApp (the person chooses the chat there); «nicht mehr fragen» on this device */
function scShareText(date,sc,u,v){const un=u&&u!=="1"?" · "+((typeof UNAME!=="undefined"&&UNAME[u])||u)+" Unit":"",dd=" ("+date.split("-").reverse().slice(0,2).join(".")+"."+un+")";
  if(v.start)return L("Drehstart")+" "+scHM(v.b)+" – "+scLabel(sc)+dd;
  if(scBase(sc)==="wrap")return "Wrap "+scHM(v.e||v.b)+" – "+L("Drehtag abgeschlossen")+dd;
  if(scBase(sc)==="lunch")return v.s===1?"Lunch "+L("ab")+" "+scHM(v.b)+dd:L("Lunch vorbei, es geht weiter")+" "+scHM(v.e)+dd;
  return v.s===1?scLabel(sc)+" "+L("läuft seit")+" "+scHM(v.b)+dd:scLabel(sc)+" "+L("abgeschlossen")+" "+scHM(v.b)+"–"+scHM(v.e)+" ("+scDur((v.e||0)-(v.b||0))+")"+dd}
/* ---------- WhatsApp per kind of quittance: Drehstart (first scene of the day), Szene Beginn, Szene Abschluss, Lunch Beginn, Lunch Ende, Drehschluss.
   Per person (Mein Konto → App, synced with the account): «n» aus, «f» fragen (after saving), «a» WhatsApp direkt öffnen; recipient: choose in WhatsApp or a fixed number */
const SCWA_KINDS=[["d","Drehstart","erste Szene des Tages","f"],["b","Szene Beginn","","n"],["e","Szene Abschluss","","f"],["l","Lunch Beginn","","n"],["m","Lunch Ende","","f"],["w","Drehschluss","Wrap","f"]];
function scWaModes(){let s="";try{s=localStorage.getItem("scwa")||"";if(!s&&localStorage.getItem("scwa:no")==="1")s="nnnnnn"}catch(_){}   /* «nicht mehr fragen» of before: all off */
  return Object.fromEntries(SCWA_KINDS.map(([k,,,d0],i)=>[k,/^[nfa]$/.test(s[i]||"")?s[i]:d0]))}
const scWaMode=k=>k?scWaModes()[k]:"n";
function scWaKind(date,sc,u,v){const bs=scBase(sc);if(bs==="wrap")return "w";if(bs==="lunch")return v.s===1?"l":"m";
  if(v.s===2)return "e";
  const first=!/^(setup\d*)$/.test(bs)&&!Object.entries(window.SCACK).some(([rid,rx])=>rx&&rx.d===date&&String(rx.u||"1")===String(u||"1")&&!/^(lunch|wrap|setup\d*)$/.test(scBase(rx.sc||rid.split("-").slice(1).join("-"))));
  return first&&scWaMode("d")!=="n"?"d":"b"}
const scWaNum=()=>{try{return String(localStorage.getItem("scwan")||"").replace(/[^\d]/g,"").replace(/^00/,"")}catch(_){return ""}};
const scWaUrl=txt=>{const n=scWaNum();return "https://wa.me/"+(n.length>=8?n:"")+"?text="+encodeURIComponent(txt)};
function scWaOpen(txt){try{window.open(scWaUrl(txt),"_blank","noopener")}catch(_){}}
function scWaSec(){if(typeof canPerm!=="function"||!canPerm("scenes.ack"))return "";const m=scWaModes(),n=(()=>{try{return localStorage.getItem("scwan")||""}catch(_){return ""}})();
  return '<section class="psec"><h4>'+esc(L("WhatsApp beim Quittieren"))+'</h4><p class="ghint">'+esc(L("Nach dem Quittieren einer Szene eine kurze Info per WhatsApp – pro Art einstellbar. «Fragen»: nach dem Speichern erscheint ein Knopf. «Direkt»: WhatsApp öffnet sich sofort mit dem fertigen Text; senden tippst du selbst."))+'</p>'+
    '<div class="scwag">'+SCWA_KINDS.map(([k,t,sub])=>'<div class="scwar"><span>'+esc(L(t))+(sub?' <small class="ghint">'+esc(L(sub))+'</small>':'')+'</span><select data-scwam="'+k+'" aria-label="'+esc(L(t))+'">'+[["n","Aus"],["f","Fragen"],["a","Direkt"]].map(([v,x])=>'<option value="'+v+'"'+(m[k]===v?' selected':'')+'>'+esc(L(x))+'</option>').join("")+'</select></div>').join("")+'</div>'+
    '<p class="ghint"><b>'+esc(L("Empfänger"))+'</b> – '+esc(L("Leer: du wählst in WhatsApp jedes Mal den Chat oder die Gruppe. Mit Nummer: WhatsApp öffnet direkt diesen Chat (nur Personen, keine Gruppen)."))+'</p>'+
    '<input class="scwan" data-scwan type="tel" inputmode="tel" maxlength="20" autocomplete="off" value="'+esc(n)+'" placeholder="'+esc(L("z. B. +41 79 123 45 67"))+'"></section>'}
window.scWaSec=scWaSec;
const scWaSave=()=>{try{localStorage.setItem("prefsLocalAt",String(Date.now()))}catch(_){}if(typeof savePrefsSoon==="function")savePrefsSoon()};
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-scwam]");if(s){const m=scWaModes();m[s.dataset.scwam]=s.value;store("scwa",SCWA_KINDS.map(([k])=>m[k]).join(""));try{localStorage.removeItem("scwa:no")}catch(_){}scWaSave();return}
  const n=e.target.closest&&e.target.closest("[data-scwan]");if(n){store("scwan",n.value.trim().slice(0,20));scWaSave()}});
/* bar at the bottom after every quittance (a few seconds): what was saved with its time, «Zeit ändern» (state, begin, end) and – with «Fragen» – WhatsApp */
let SCBART=null;
function scBar(date,sc,u,v,wa){let b=document.getElementById("scbar");if(b)b.remove();clearTimeout(SCBART);
  b=document.createElement("div");b.id="scbar";b.className="scbar";b.setAttribute("role","status");
  const what=v.s===2?(scBase(sc)==="wrap"?L("Drehschluss")+" "+scHM(v.e||v.b):scLabel(sc)+" "+L("abgeschlossen")+" "+scHM(v.e)):scLabel(sc)+" "+(scBase(sc)==="lunch"?L("ab"):L("läuft seit"))+" "+scHM(v.b);
  b.innerHTML='<span class="scbt">'+esc(what)+'</span><button type="button" class="pillbtn" data-scbared>'+esc(L("Zeit ändern"))+'</button>'+(wa?'<a class="pillbtn scwa" href="'+esc(scWaUrl(scShareText(date,sc,u,wa)))+'" target="_blank" rel="noopener noreferrer" data-scbarwa>WhatsApp</a>':'')+
    '<button type="button" class="scbx" data-scbarx '+ariaTip(L("Schliessen"))+'>×</button>';
  const close=()=>{clearTimeout(SCBART);b.remove()};
  b.addEventListener("click",e=>{if(e.target.closest("[data-scbared]")){close();scAckDialog(date,sc,u);return}if(e.target.closest("[data-scbarwa]")){setTimeout(close,50);return}if(e.target.closest("[data-scbarx]"))close()});
  document.body.appendChild(b);SCBART=setTimeout(close,wa?12000:8000)}
window.scBar=scBar;
function scShareAsk(date,sc,u,v,force){
  const txt=scShareText(date,sc,u,v),d=mkDialog("scwadlg",null,{replace:true});
  d.innerHTML='<div class="a2box scbox"><h3>'+esc(L("Info per WhatsApp senden?"))+'</h3><p class="scwat">'+esc(txt)+'</p>'+
    '<div class="arb"><a class="scwa" href="'+esc(scWaUrl(txt))+'" target="_blank" rel="noopener noreferrer" data-scwago>WhatsApp</a><button type="button" class="lnk" data-scwax>'+esc(L("Nein"))+'</button></div>'+
    '<p class="ghint scwano">'+esc(L("Einstellen pro Art: Mein Konto → App → WhatsApp beim Quittieren."))+'</p></div>';
  d.addEventListener("click",e=>{if(e.target===d||e.target.closest("[data-scwax]")||e.target.closest("[data-scwago]"))setTimeout(()=>d.remove(),50)});
  document.body.appendChild(d)}
/* popup of a quittiert scene: state, begin and end time; «offen» takes the quittance away */
function scAckDialog(date,sc,u){const id=scAckId(date,sc),x=window.SCACK[id]||{},st=scState(date,sc);
  const d=mkDialog("scackdlg",null,{replace:true});let cur=st;
  d.innerHTML='<div class="a2box scbox"><h3>'+esc(scLabel(sc))+'</h3><p class="ghint">'+esc(date.split("-").reverse().join("."))+(u&&u!=="1"?' · '+esc((typeof UNAME!=="undefined"&&UNAME[u])||u)+' Unit':'')+'</p>'+
    '<div class="redst scst" role="group" aria-label="'+esc(L("Status"))+'">'+(scBase(sc)==="wrap"?[[0,"offen"],[2,"Drehschluss"]]:[[0,"offen"],[1,scBase(sc)==="lunch"?"Lunch läuft":"läuft"],[2,"abgeschlossen"]]).map(([v,t])=>'<button type="button" class="scstb" data-scst="'+v+'" aria-pressed="'+(st===v)+'"><span class="scack sk'+v+'">'+((v===1&&scBase(sc)==="lunch"?SC_ICO.lunch:v===2&&scBase(sc)==="wrap"?SC_ICO.wrap:SC_ICO[v])||"")+'</span><span class="scstl">'+esc(L(t))+'</span></button>').join("")+'</div>'+
    '<form data-scform novalidate><div class="redrow"><label>'+esc(L("Beginn"))+'<input type="time" name="b" value="'+esc(scHM(x.b||x.at))+'"></label><label>'+esc(L("Ende"))+'<input type="time" name="e" value="'+esc(scHM(x.e))+'"></label></div>'+
    '<p class="amsg" role="alert"></p><div class="arb">'+saveBtn()+saveBtn("data-scwasub",L("Speichern")+" + WhatsApp",'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z"/><path d="M9 10.5c.3 1.6 1.9 3.3 3.6 3.8"/></svg>',"scwab")+'<button type="button" class="lnk" data-scx>'+esc(L("Abbrechen"))+'</button></div>'+(st?'<button type="button" class="lnk scdel" data-scdel>'+esc(L("Quittierung löschen"))+'</button>':'')+'</form></div>';
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
  const row=(name,st,plan,b,e,run,ed,pdm)=>'<li class="scl'+(st===0?' sclo':'')+'"><div class="audh"><b>'+name+'</b>'+(ED&&ed?'<button type="button" class="scled" data-scled="'+esc(ed.join("|"))+'" title="'+esc(L("Ändern"))+'" aria-label="'+esc(L("Ändern"))+'">'+PEN+'</button>':'')+(plan||pdm?' <span class="audt">'+esc(L("Plan"))+' '+esc(plan||'–')+(pdm?' · '+esc(dur(pdm*60000)):'')+'</span>':'')+'<span class="audw">'+(st===2?'✓':'')+'</span></div>'+
    '<div class="audb sclt"><span>'+esc(L("Beginn"))+' <b>'+(b?esc(scHM(b)):'–')+'</b></span><span>'+esc(L("Ende"))+' <b>'+(e?esc(scHM(e)):'–')+'</b></span><span>'+esc(L("Dauer"))+' <b>'+(b&&e?esc(dur(e-b)):b&&run?'<span data-scrun="'+b+'">'+esc(dur(Date.now()-b))+'</span>':'–')+'</b></span></div></li>';
  /* one unit of one day: fixed rows setup (planned begin until the first scene), Drehstart (until the wrap), lunch, wrap – plus the further setups and the scenes, by time */
  const unitRows=(d,u,l,day,cs)=>{const its=arr(u==="2"?(day.unit2||{}).items:u==="3"?(day.unit3||{}).items:day.items);
    const tx=i=>String(i.n||""),ks=scRowKeys(its,tx);
    /* the plan of an entry in the Drehplan: its time and its planned duration (the duration of the row, else until the next row) */
    const pIx=k=>{const b=scBase(k);let i=ks.indexOf(b);if(i<0)i=its.findIndex(x=>x.sc&&scAckId(d,x.sc)===scAckId(d,b));return i};
    const pDur=i=>{if(i<0)return 0;const it=its[i],m=String(it.dur||"").trim().match(/^(\d+)\s*[h:]\s*(\d{1,2})|^(\d+)\s*['′m]/);if(m)return m[3]?+m[3]:(+m[1])*60+(+m[2]);
      const t0=ms(hm(it.t));if(!t0)return 0;for(let j=i+1;j<its.length;j++){const t1=ms(hm(its[j].t));if(t1>t0)return Math.round((t1-t0)/60000)}return 0};
    const pl=k=>{const i=pIx(k);return i>=0?hm(its[i].t)||"":""},pd=k=>pDur(pIx(k));
    const setup=its.find(i=>!i.sc&&/^\s*set[\s-]?up\b/i.test(tx(i))),firstSc=its.find(i=>i.sc);
    const uk=k=>u==="1"?k:k+"_u"+u,get=k=>l.find(x=>scBase(key(x))===k),scs=l.filter(x=>!["lunch","wrap","setup"].includes(scBase(key(x))));
    const real=scs.filter(x=>!isEv(key(x))),start=real.length?Math.min(...real.map(p0).filter(Boolean)):0,lu=get("lunch"),wr=get("wrap");
    const ms=hhmm=>{const v=String(hhmm||"").match(/^(\d{1,2}):(\d{2})$/);if(!v)return 0;const x=new Date(d+"T00:00:00");x.setHours(+v[1],+v[2],0,0);return x.getTime()};
    const plSetup=setup?hm(setup.t)||"":"",plStart=(u==="1"?hm(cs.shootCall||""):"")||(firstSc?hm(firstSc.t)||"":"");
    const wrE=wr?(+wr.e||p0(wr)):0,su=get("setup"),fs=real.slice().sort((a,b)=>p0(a)-p0(b))[0],ent=[],add=(x,name,st,plan,b,e,run,ed,pdm)=>ent.push([x,row(name,st,plan,b,e,run,ed,pdm),{name,st,plan,pdm:pdm||0,b,e,k:ed&&name!==esc(L("Drehstart"))?ed[1]:"",drehstart:name===esc(L("Drehstart"))}]);
    /* setup: its own quittance, else planned begin until the first scene */
    if(su)add(p0(su),"Setup",su.s===1?1:2,plSetup,p0(su),su.s===1?0:+su.e||0,su.s===1&&d===t,[d,uk("setup"),u],pd("setup"));else add(ms(plSetup)||1,"Setup",start?2:0,plSetup,ms(plSetup),start,false,[d,uk("setup"),u],pd("setup"));
    /* Drehstart = begin of the first scene: the pencil opens that scene */
    add(start||ms(plStart)||2,esc(L("Drehstart")),start?(wrE?2:1):0,plStart,start,wrE,!!start&&!wrE&&d===t,fs?[d,key(fs),u]:null,ms(pl("wrap"))&&ms(plStart)?Math.max(0,Math.round((ms(pl("wrap"))-ms(plStart))/60000)):0);
    add(lu?p0(lu):ms(pl("lunch"))||8e15,"Lunch",lu?(lu.s===1?1:2):0,pl("lunch"),lu?p0(lu):0,lu&&lu.s!==1?+lu.e||0:0,!!lu&&lu.s===1,[d,uk("lunch"),u],pd("lunch"));
    for(const x of scs){const k=key(x);add(p0(x),esc(scLabel(k)),x.s===1?1:2,pl(k),p0(x),x.s===1?0:+x.e||0,x.s===1&&d===t,[d,k,u],pd(k))}
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
      return '<details class="tstsu"><summary>'+(dn>=0?'<b>DT '+(dn+1)+'</b> · ':'')+esc(String(d).split("-").reverse().join("."))+' · <b class="sclun">'+esc(((typeof UNAME!=="undefined"&&UNAME[u])||u)+' Unit')+'</b> · '+p.n+' '+esc(L("Szenen"))+(p.start&&p.wrE?' · '+esc(L("Drehzeit"))+' '+esc(dur(p.wrE-p.start)):'')+'</summary>'+p.html+
        '<div class="arb tstbtns sclbtns scld1">'+scIco('data-sclx="pdf|'+d+'|'+u+'"',SCX_PDF,"PDF")+scIco('data-sclx="csv|'+d+'|'+u+'"',SCX_CSV,L("Tabelle")+" (Excel)")+scShBtn()+'</div></details>'}).join("")}).join("");
  return '<details class="tstsec scld" data-lsec="sclog"'+(SCLOG.open?' open':'')+'><summary class="lsum">'+(typeof logHead==="function"?logHead(esc(L("Szenen-Protokoll")),'<span class="tsth">'+SCLOG.list.filter(x=>!isEv(key(x))).length+' '+esc(L("Szenen"))+'</span>',(()=>{const m=Math.max(0,...SCLOG.list.map(x=>+x.at||0))||SCLOG.at||Date.now();const z=new Date(m);return esc(pad2(z.getDate())+"."+pad2(z.getMonth()+1)+". "+scHM(m))})()):esc(L("Szenen-Protokoll")))+'</summary>'+
    '<div class="admins"><p class="ahint">'+esc(L("Beginn, Ende und Dauer jeder quittierten Szene (Drehplan und Callsheet), dazu Setup, Drehstart, Lunch und Wrap."))+'</p>'+
    (html||'<p class="ghint">'+esc(L("Noch keine Einträge."))+'</p>')+
    '<div class="arb tstbtns sclbtns">'+scIco("data-sclre",typeof TST_RUN!=="undefined"?TST_RUN:"↻",L("Neu laden"))+'</div>'+(html?[...new Set(EXP.map(r=>String(r.u)))].sort().map(u=>'<div class="sclbtns sclall"><span class="scll"><b>'+esc(((typeof UNAME!=="undefined"&&UNAME[u])||u)+' Unit')+'</b> · '+esc(L("alle Tage"))+'</span>'+scIco('data-sclx="pdf||'+u+'"',SCX_PDF,"PDF · "+L("alle Tage"))+scIco('data-sclx="csv||'+u+'"',SCX_CSV,L("Tabelle")+" (Excel) · "+L("alle Tage"))+scShBtn()+'</div>').join("")+(new Set(EXP.map(r=>String(r.u))).size>1?'<div class="sclbtns sclall"><span class="scll"><b>'+esc(L("Alle Units"))+'</b> · '+esc(L("alle Tage"))+'</span>'+scIco('data-sclx="pdf||"',SCX_PDF,"PDF · "+L("Alle Units"))+scIco('data-sclx="csv||"',SCX_CSV,L("Tabelle")+" (Excel) · "+L("Alle Units"))+scShBtn()+'</div>':''):'')+'</div></details>'};   /* the export always per unit */
/* round buttons with a symbol (like the other Log menus); the name as tooltip */
const SCX_PDF='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 16.5v-4h1.6a1.3 1.3 0 0 1 0 2.6H9.5"/><path d="M14 12.5v4"/></svg>';
const SCX_CSV='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 10h17M3.5 14.5h17M9.5 5v14M15 5v14"/></svg>';
/* Google Sheets: a sheet with a green-ish grid and an arrow out */
const SCX_SHEET='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M8.6 3.5h6.8l6.1 10.6-3.4 5.9H5.9l-3.4-5.9z"/><path d="M8.6 3.5l6.1 10.6h6.8M15.4 3.5L9.3 14.1 5.9 20M2.5 14.1h12.2"/></svg>';
/* next to every download: open the Google Sheet (when one is set in the App-Verwaltung) */
const scShBtn=()=>/^https:\/\/docs\.google\.com\/spreadsheets\//.test(window.SCENESHEET||"")?scIco("data-sclsh",SCX_SHEET,L("Szenen-Protokoll in Google Sheets öffnen")):"";
const scIco=(attr,ic,t)=>typeof tstIco==="function"?tstIco(attr,ic,t):'<button type="button" class="pillbtn" '+attr+'>'+esc(t)+'</button>';
/* export of the scene log: as a table (CSV for Excel, Numbers, Google Sheets) or as PDF (print view → «Als PDF sichern»); oldest day first */
/* one table per day – and per unit when the export holds all units */
const scDK=uu=>r=>r.dt+" · "+r.date+(uu?"":" · "+r.unit);
/* Drehstart and Wrap: no duration in the exports (they are points in time) */
const scNoDur=r=>!!r.drehstart||scBase(r.k||"")==="wrap";
function scExpRows(d,u){const un=s=>{const x=document.createElement("textarea");x.innerHTML=String(s||"");return x.value};
  return (SCLOG.exp||[]).filter(r=>(!d||r.d===d)&&(!u||String(r.u)===u)).sort((a,b)=>a.d.localeCompare(b.d)).map(r=>Object.assign({dt:r.dt,date:r.d.split("-").reverse().join("."),unit:((typeof UNAME!=="undefined"&&UNAME[r.u])||r.u)+" Unit",name:un(r.name),
    st:r.st,inv:!!r.drehstart||/^(lunch|wrap)$/.test(scBase(r.k||"")),state:r.st===2?"✓":"",plan:r.plan||"",pmin:r.pdm&&!scNoDur(r)?String(r.pdm):"",b:r.b?scHM(r.b):"",e:r.e?scHM(r.e):"",min:r.b&&r.e&&!scNoDur(r)?String(Math.round((r.e-r.b)/60000)):"",diff:r.b&&r.e&&r.pdm&&!scNoDur(r)?String(Math.round((r.e-r.b)/60000)-r.pdm):""},scInfo(r)))}
/* more about a scene for the export: I/E, set, pages, cast and the description from the Drehplan of that day (and unit) */
function scInfo(r){const k=scBase(r.k||""),E={ie:"",set:"",pg:"",cast:"",desc:""};
  /* setup and Drehstart: the I/E of the scene that follows (setup: the next scene after its row, Drehstart: the first scene of the day) */
  if(/^setup\d*$/.test(k)||r.drehstart){const day=(S.days||[]).find(y=>y.date===r.d)||{},its=arr(r.u==="2"?(day.unit2||{}).items:r.u==="3"?(day.unit3||{}).items:day.items);
    let i=0;if(!r.drehstart){i=scRowKeys(its,x=>String(x.n||"")).indexOf(k);if(i<0)i=0}const nx=its.slice(i).find(x=>x.sc);return Object.assign(E,{ie:nx&&nx.ie||""})}
  if(!k||/^(lunch|wrap)$/.test(k)||typeof schedIndex!=="function")return E;
  let o=null;try{const l=schedIndex()[norm(k)]||[];o=l.find(y=>y.d&&y.d.date===r.d&&String(y.u||"1")===String(r.u||"1"))||l.find(y=>y.d&&y.d.date===r.d)||null}catch(_){}
  const it=(o&&o.it)||{},cm=(S.meta&&S.meta.cast)||{};
  return {ie:it.ie||"",set:it.set||"",pg:it.pg||"",cast:arr(it.cast).map(i=>cm[i]?i+" "+cm[i]:i).join(", "),desc:typeof TX==="function"?TX(it,"d")||"":(it.d||"")}}
/* Excel file (.xlsx) with a filter on every column and the first line fixed: a small zip (stored, no compression) written here – no library needed.
   Texts stay texts («1 1/8» is no date), durations are numbers */
const SCZ_CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function scZip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  const u16=v=>[v&255,(v>>>8)&255],u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  for(const [name,txt] of files){const d=enc.encode(txt),n=enc.encode(name);let c=0xFFFFFFFF;for(const b of d)c=SCZ_CRC[(c^b)&255]^(c>>>8);c=(c^0xFFFFFFFF)>>>0;
    const h=[...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0)];
    parts.push(new Uint8Array(h),n,d);cen.push([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)],n);off+=h.length+n.length+d.length}
  let cl=0;const cp=[];for(let i=0;i<cen.length;i+=2){const a=new Uint8Array(cen[i]);cp.push(a,cen[i+1]);cl+=a.length+cen[i+1].length}
  const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cl),...u32(off),...u16(0)]);
  return new Blob([...parts,...cp,end],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
function scXlsx(head,data,name,title,stand){const x=v=>String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,"");
  const col=i=>{let s="";i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
  const NUM=new Set([9,12,13]);   /* Plan-Dauer, Dauer, Diff. */
  const TIME=new Set([8,10,11]),CEN=4;   /* Plan, Start, Ende: real times (hh:mm); column E (S) centred */
  /* styles: 0 normal, 1 bold, 2 time, 3 centred – +4 the same with a thick line below (between the shooting days); no other lines */
  const cell=(v,r,c,h,thick)=>{const ref=col(c)+r,tk=thick?4:0;if(v===""||v==null)return thick?'<c r="'+ref+'" s="'+tk+'"/>':"";
    if(!h&&TIME.has(c)){const m=String(v).match(/^(\d{1,2}):(\d{2})$/);if(m)return '<c r="'+ref+'" s="'+(2+tk)+'"><v>'+((+m[1]*60+ +m[2])/1440)+'</v></c>'}
    if(!h&&NUM.has(c)&&/^-?\d+$/.test(String(v)))return '<c r="'+ref+'"'+(tk?' s="'+tk+'"':'')+'><v>'+v+'</v></c>';
    const st=(h||c===0?1:c===CEN?3:0)+tk;return '<c r="'+ref+'" t="inlineStr"'+(st?' s="'+st+'"':'')+'><is><t xml:space="preserve">'+x(v)+'</t></is></c>'};
  const R0=title?1:0,rows=[head].concat(data),FC=head.indexOf("Set")>=0?head.indexOf("Set"):head.length-1,last=col(FC)+(rows.length+R0),
    W=head.map((_,i)=>i===0?24:Math.min(70,Math.max(5,...rows.map(r=>String(r[i]==null?"":r[i]).length))+3));   /* column A fixed; the others as wide as their longest entry (+ room for the filter arrow) */
  /* thick line between the shooting days: below the last row of a day (date in column C changes) */
  const wrap=ri=>ri>0&&ri<rows.length-1&&String(rows[ri][2]||"")!==String(rows[ri+1][2]||"");
  const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="1"><pane ySplit="'+(1+R0)+'" topLeftCell="A'+(2+R0)+'" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+
    head.map((_,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(W[i]||12)+'" customWidth="1"/>').join("")+'</cols><sheetData>'+(title?'<row r="1">'+cell(title,1,0,true)+(stand?cell(stand,1,head.length-1,true):'')+'</row>':'')+
    rows.map((r,ri)=>'<row r="'+(ri+1+R0)+'">'+(wrap(ri)?head.map((_,ci)=>cell(r[ci],ri+1+R0,ci,false,true)):r.map((v,ci)=>cell(v,ri+1+R0,ci,ri===0))).join("")+'</row>').join("")+'</sheetData><autoFilter ref="A'+(1+R0)+':'+last+'"/>'+(title?'<mergeCells count="1"><mergeCell ref="A1:'+col(FC)+'1"/></mergeCells>':'')+'</worksheet>';
  const files=[["[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ["_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ["xl/workbook.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+x(L("Szenen-Protokoll").slice(0,31))+'" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">\''+x(L("Szenen-Protokoll").slice(0,31))+'\'!$A$'+(1+R0)+':$'+col(FC)+'$'+(rows.length+R0)+'</definedName></definedNames></workbook>'],
    ["xl/_rels/workbook.xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ["xl/styles.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="2"><border/><border><left/><right/><top/><bottom style="thick"><color rgb="FF000000"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="8"><xf/><xf fontId="1" applyFont="1"/><xf numFmtId="164" applyNumberFormat="1"/><xf applyAlignment="1"><alignment horizontal="center"/></xf><xf borderId="1" applyBorder="1"/><xf fontId="1" borderId="1" applyFont="1" applyBorder="1"/><xf numFmtId="164" borderId="1" applyNumberFormat="1" applyBorder="1"/><xf borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf></cellXfs></styleSheet>'],
    ["xl/worksheets/sheet1.xml",sheet]];
  const a=document.createElement("a");a.href=URL.createObjectURL(scZip(files));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
const SCX_HEAD=()=>[L("Aktion"),"DT",L("Datum"),"Unit","S","I/E",L("Seiten"),"Set",L("Plan"),"PD",L("Start"),L("Ende"),L("Dauer"),L("Diff."),L("Beschreibung")];   /* no cast in the scene log */
document.addEventListener("click",e=>{const g=e.target.closest&&e.target.closest("[data-sclsh]");if(g){e.preventDefault();const u=window.SCENESHEET||"";if(/^https:\/\/docs\.google\.com\/spreadsheets\//.test(u))window.open(u,"_blank","noopener");return}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-sclx]");if(!b)return;e.preventDefault();const [k,dd,uu]=b.dataset.sclx.split("|"),rows=scExpRows(dd,uu),z0=new Date(),UN0=uu?((typeof UNAME!=="undefined"&&UNAME[uu])||uu)+" Unit":[...new Set(rows.map(r=>r.unit))].join(" + "),
    /* file name like the title (project · scene log · unit, the day when it is one day) with the time of the export, American date */
    stamp=[UN0.replace(/\s*\+\s*/g,"+").replace(/\s+/g,"-"),dd?dd.split("-").slice(1).concat(dd.split("-")[0]).join("-"):"",pad2(z0.getMonth()+1)+"-"+pad2(z0.getDate())+"-"+z0.getFullYear()+"_"+pad2(z0.getHours())+"-"+pad2(z0.getMinutes())].filter(Boolean).join("_"),
    TITLE=projName()+" · "+L("Szenen-Protokoll")+(UN0?" · "+UN0:"")+(dd?" · "+dd.split("-").reverse().join("."):"");
  const cells=r=>[r.name,r.dt,r.date,r.unit,r.state,r.ie,r.pg,r.set,r.plan,r.pmin,r.b,r.e,r.min,r.diff,r.desc];
  if(k==="csv"){const data=rows.map(cells);scXlsx(SCX_HEAD(),data,projFile()+"_Szenen-Protokoll_"+stamp+".xlsx",TITLE,L("Stand")+" "+pad2(z0.getDate())+"."+pad2(z0.getMonth()+1)+"."+z0.getFullYear()+" "+pad2(z0.getHours())+":"+pad2(z0.getMinutes()));return}
  const UN=uu?((typeof UNAME!=="undefined"&&UNAME[uu])||uu)+" Unit":[...new Set(rows.map(r=>r.unit))].join(" + "),HD=[L("Eintrag"),L("Status"),"I/E · "+L("Seiten"),"Set · "+L("Beschreibung")],HD2=[L("Zeit"),L("Dauer")+" (min)",L("Beginn"),L("Ende"),L("Dauer")+" (min)",L("Diff.")+" (min)"],days=[...new Set(rows.map(scDK(uu)))];
  /* the same columns on every day: fixed widths (entry, state, I/E, set, pages, plan, planned duration, begin, end, duration); the description in a second line below */
  const COLS='<colgroup>'+[14,6,8,29,7,8,7,7,7,7].map(w=>'<col style="width:'+w+'%">').join("")+'</colgroup>';
  const doc='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(projName())+' · '+esc(L("Szenen-Protokoll"))+' '+esc(UN)+' '+esc(stamp)+'</title><style>body{font:11px/1.35 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#111}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:0 0 6px;break-after:avoid}.day{break-inside:avoid;page-break-inside:avoid;margin:0 0 14px}table{table-layout:fixed}table{border-collapse:collapse;width:100%;break-inside:auto}th,td{border-bottom:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f2f2f2;vertical-align:bottom}th.scg{text-align:left;border-left:1px solid #ccc}td.n{font-variant-numeric:tabular-nums;white-space:nowrap}tbody.o td{color:#888}tbody.e{break-inside:avoid}tr.scl1 td{border-bottom:0;padding-bottom:1px}tr.scl2 td{padding-top:0}td.scred{color:#c81e1e;font-weight:700}td.scxd{font-size:10.5px;color:#333;min-width:40mm}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>'+esc(projName())+' · '+esc(L("Szenen-Protokoll"))+(UN?' · '+esc(UN):'')+'</h1>'+
    days.map(k=>'<div class="day"><h2>'+esc(k.replace(/^ · /,""))+'</h2><table>'+COLS+'<thead><tr>'+HD.map(h=>'<th rowspan="2">'+esc(h)+'</th>').join("")+'<th colspan="2" class="scg">'+esc(L("Plan"))+'</th><th colspan="4" class="scg">'+esc(L("Dreh"))+'</th></tr><tr>'+HD2.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead>'+
      rows.filter(r=>scDK(uu)(r)===k).map(r=>{const c=[r.name,r.state,r.ie,r.set,r.plan,r.pmin,r.b,r.e,r.min,(+r.diff>0?"+":"")+r.diff],sc=!!(r.desc||r.pg);return '<tbody class="e'+(r.st?'':' o')+'"><tr'+(sc?' class="scl1"':'')+'>'+c.map((v,i)=>'<td'+(i>=4?' class="n'+(i===9&&+r.diff>0?' scred':'')+'"':'')+'>'+esc(v)+'</td>').join("")+'</tr>'+(sc?'<tr class="scl2"><td></td><td></td><td class="n">'+esc(r.pg||"")+'</td><td colspan="7" class="scxd">'+esc(r.desc||"")+'</td></tr>':'')+'</tbody>'}).join("")+'</table></div>').join("")+'</body></html>';
  /* a real PDF (jsPDF, loaded only when needed) that opens directly in the PDF reader; without it the print view below */
  let pw=null;try{pw=window.open("","_blank")}catch(_){}   /* the window is opened during the tap (else the browser blocks it) and gets the PDF when it is ready */
  scPdf(rows,days,UN,stamp,pw,uu).catch(err=>{console.error(err);try{if(pw)pw.close()}catch(_){}scPrint(doc)});return});
/* load a script of the app once (same origin, allowed by the page) */
const scLoad=src=>new Promise((ok,no)=>{if(document.querySelector('script[data-src="'+src+'"]'))return ok();const x=document.createElement("script");x.src=src;x.dataset.src=src;x.onload=()=>ok();x.onerror=()=>no(new Error(src));document.head.appendChild(x)});
async function scPdf(rows,days,UN,stamp,pw,uu){
  if(!(window.jspdf&&window.jspdf.jsPDF)){await scLoad("jspdf.js");await scLoad("jspdf.autotable.js")}
  const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  /* the built-in font knows only Latin letters: Hindi labels in English, signs that it lacks replaced */
  const T=k=>LANG==="hi"?(((I18N[k]||{}).en)||k):L(k),C=v=>String(v==null?"":v).replace(/[′’]/g,"'").replace(/[^\x20-\x7E\xA0-\xFF–—…€]/g,"");
  doc.setFontSize(15);doc.text(C(projName()+" · "+T("Szenen-Protokoll")+(UN?" · "+UN:"")),12,14);
  /* right of the title: the production company in capitals (and its address below, small) – App-Verwaltung → Produktion */
  {const co=String(window.PRODCO||"").trim(),ad=String(window.PRODADDR||"").trim();if(co){doc.setFontSize(11);doc.setFont(undefined,"bold");doc.text(C(co.toUpperCase()),285,12,{align:"right"});doc.setFont(undefined,"normal")}
   if(ad){doc.setFontSize(7.5);doc.setTextColor(90);doc.text(C(ad.replace(/\s*\n\s*/g,", ")),285,co?16:12,{align:"right"});doc.setTextColor(0)}}
  /* two header rows: «Plan» over time and duration, «Dreh» over begin, end and duration */
  const g=t=>({content:C(t),colSpan:t===T("Plan")?2:4,styles:{halign:"center"}}),r2=t=>({content:C(t),rowSpan:2,styles:{valign:"bottom"}});
  /* column lines always through; thicker after «Set / Beschreibung» and after «Plan» */
  const TH=.8,lw=(i,t,b)=>({top:t,bottom:b,left:i===4||i===6?TH:.2,right:i===3||i===5?TH:.2});
  const hc=(t,i,x)=>Object.assign({content:t,styles:Object.assign({lineWidth:lw(i,.2,.2)},x&&x.styles)},x&&x.o);
  const head=[[hc(C(T("Aktion")),0,{o:{rowSpan:2},styles:{valign:"top"}}),hc("S",1,{o:{rowSpan:2},styles:{valign:"top",halign:"center"}}),hc("I/E\n"+C(T("Seiten")),2,{o:{rowSpan:2},styles:{valign:"top"}}),hc("Set\n"+C(T("Beschreibung")),3,{o:{rowSpan:2},styles:{valign:"top"}}),
    Object.assign(hc(C(T("Plan")),4,{o:{colSpan:2},styles:{halign:"left"}}),{}),hc(C(T("Dreh")),6,{o:{colSpan:4},styles:{halign:"left"}})],
    [T("Zeit"),T("Dauer"),T("Start"),T("Ende"),T("Dauer"),T("Diff.")].map((t,j)=>hc(C(t),j+4,{styles:{halign:"left"}}))];
  head[0][4].styles.lineWidth.right=TH;
  const W=[38,9,22,127,13,13,13,13,13,13];
  /* the description in one line: shortened with … when it is too long */
  const fit1=t=>{if(!t)return t;doc.setFontSize(8);const w=W[3]-3;if(doc.getTextWidth(t)<=w)return t;let a=t;while(a.length>1&&doc.getTextWidth(a+"…")>w)a=a.slice(0,-1);return a.replace(/\s+\S*$/,"").replace(/[\s,.;:–-]+$/,"")+"…"};   /* all time columns the same width */let y=20;
  for(const k of days){const rs=rows.filter(r=>scDK(uu)(r)===k),body=[];
    /* Drehstart, Lunch and Wrap inverted (white on black); no line between the two lines of one entry, only between entries */
    for(const r of rs){const sc=!!(r.desc||r.pg),o=r.inv?{fillColor:25,textColor:r.st?255:175,lineColor:90}:r.st?{}:{textColor:140};
      /* difference: more time than planned in red */
      const df=r.diff===""?"":(+r.diff>0?"+":"")+r.diff,red=+r.diff>0?{textColor:r.inv?[255,110,110]:[200,30,30],fontStyle:"bold"}:{};
      body.push([r.name,r.st===2?"":"",r.ie,r.set,r.plan,r.pmin,r.b,r.e,r.min,df].map((v,i)=>({content:C(v),styles:Object.assign({fontStyle:i===0?"bold":"normal",fontSize:i===0?9.5:8.5,lineWidth:lw(i,.2,sc?0:.2)},sc?{cellPadding:{top:1,bottom:0,left:1.4,right:1.4}}:{},o,i===9?red:{}),_done:i===1&&r.st===2})));
      if(sc)body.push(["","",C(r.pg),fit1(C(r.desc)),"","","","","",""].map((v,i)=>({content:v,styles:Object.assign({lineWidth:lw(i,0,.2),cellPadding:{top:0,bottom:1,left:1.4,right:1.4}},o,i===3?Object.assign({fontSize:8},r.inv?{}:{textColor:r.st?70:140}):{})})))}
    /* a day that does not fit on the rest of the page starts on a new one */
    /* several days: every day on a page of its own */if(y>30){doc.addPage();y=14}
    doc.setFontSize(11);doc.text(C(k.replace(/^ · /,"")),12,y+5);
    doc.autoTable({startY:y+8,head,body,margin:{left:12,right:12,bottom:14},theme:"grid",tableWidth:"wrap",columnStyles:Object.fromEntries(W.map((w,i)=>[i,{cellWidth:w}])),
      styles:{fontSize:8.5,cellPadding:{top:1,bottom:1,left:1.4,right:1.4},lineColor:150,lineWidth:.2,overflow:"linebreak"},headStyles:{fillColor:[242,242,242],textColor:20,fontStyle:"bold",fontSize:8,cellPadding:{top:.6,bottom:.6,left:1.4,right:1.4},minCellHeight:0},rowPageBreak:"avoid",
      didDrawCell:h=>{if(h.section==="body"&&h.cell.raw&&h.cell.raw._done){const c=h.cell,x=c.x+c.width/2-2,yy=c.y+c.height/2;doc.setDrawColor(40,150,90);doc.setLineWidth(.6);doc.line(x,yy,x+1.4,yy+1.4);doc.line(x+1.4,yy+1.4,x+4,yy-1.6)}}});
    y=doc.lastAutoTable.finalY+6}
  /* footer on every page: who exported it (left), page x of y (middle), date and time of the export (right) */
  {const n=doc.getNumberOfPages(),z=new Date(),who=(()=>{/* the signed-in user who makes the export (not the person chosen in «Meine Termine») */try{if(typeof MEMBER!=="undefined"&&MEMBER){const n=[MEMBER.firstName,MEMBER.lastName].filter(Boolean).join(" ")||MEMBER.name;if(n)return n}}catch(_){}try{if(typeof ME!=="undefined"&&ME)return ME.displayName||ME.email||""}catch(_){}return ""})(),when=pad2(z.getDate())+"."+pad2(z.getMonth()+1)+"."+z.getFullYear()+" "+pad2(z.getHours())+":"+pad2(z.getMinutes());
   for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(90);doc.text(C(who),12,203);doc.text(i+"/"+n,148.5,203,{align:"center"});doc.text(C(when),285,203,{align:"right"})}doc.setTextColor(0)}
  const blob=doc.output("blob"),url=URL.createObjectURL(blob),name=projFile()+"_Szenen-Protokoll_"+stamp+".pdf";
  /* open in the PDF reader of the device; where a new window is not possible, as a download */
  if(pw&&!pw.closed)pw.location.href=url;else{const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove()}
  setTimeout(()=>URL.revokeObjectURL(url),300000)}
/* the print view in a new window (a page of its own from a blob), its print dialog offers «Als PDF sichern» */
function scPrint(doc){
  const url=URL.createObjectURL(new Blob([doc],{type:"text/html;charset=utf-8"})),w=window.open(url,"_blank");
  if(w){const go=()=>{try{w.focus();w.print()}catch(_){}};try{w.addEventListener("load",()=>setTimeout(go,200))}catch(_){setTimeout(go,800)}setTimeout(()=>URL.revokeObjectURL(url),120000);return}
  /* pop-ups blocked: print from a hidden frame */
  const f=document.createElement("iframe");f.style.cssText="position:fixed;width:0;height:0;border:0;right:0;bottom:0";f.addEventListener("load",()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(_){}setTimeout(()=>{f.remove();URL.revokeObjectURL(url)},60000)});f.src=url;document.body.appendChild(f)}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-sclre]")){SCLOG.list=null;render()}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-scled]");if(!b)return;e.preventDefault();e.stopPropagation();const [d,k,u]=b.dataset.scled.split("|");scAckDialog(d,k,u||"1")},true);
function setSCSUB(v){return SCSUB=v}   /* other parts change SCSUB only through this */
