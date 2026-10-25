import {L,S,esc,mkDialog,saveBtn,xBtn} from "../base/10-core.js";
import {hm,myIdentity} from "../base/12-mycal.js";
import {render} from "../base/15-script-tab.js";
import {arr,showMsg} from "../base/20-data-start.js";
import {ME,can,fb,isAdmin,ownDec,ownEnc} from "./03-core-firebase.js";
import {getDataKey} from "./04-data.js";
/* =====================================================================
   DREHTAG VOR ORT ÄNDERN (Recht «Drehtag vor Ort ändern»: day.edit) – innerhalb eines Drehtags der 1st Unit:
   Szenen umordnen, Zeiten ändern, streichen, auf einen anderen Drehtag verschieben, Szenen dazunehmen (von einem anderen
   Tag oder ganz neu). Gespeichert als Änderung über dem Drehplan (dayedit/JJJJMMTT, Inhalt verschlüsselt): der Drehplan aus der
   Dropbox bleibt, wie er ist. Gilt nur, solange der Drehplan dieses Tags derselbe ist (Prüfsumme «sig») – kommt ein neuer, fällt
   die Änderung weg (die Berechtigten sehen einen Hinweis). Drehplan, Callsheet-Drehfolge, «Jetzt», Quittieren und die Automatik
   arbeiten mit dem geänderten Tag.
   Ein Eintrag: die Zeile des Drehplans + _de {x: gestrichen · to: verschoben auf (Datum) · from: verschoben von (Datum) · nt: Zeit geändert ·
   add: neu dazu}. ===================================================================== */
window.DAYEDIT=window.DAYEDIT||{};window.DESTALE={};
try{const c=JSON.parse(localStorage.getItem("dayedit:v1")||"null");if(c&&typeof c==="object")window.DAYEDIT=c}catch(_){}
const deId=d=>String(d||"").replace(/-/g,"");
const deDate=id=>id.slice(0,4)+"-"+id.slice(4,6)+"-"+id.slice(6,8);
/* for now only Owner and Admins (with the right «Drehtag vor Ort ändern», which Admins have unless switched off) */
export const deCan=()=>{try{return isAdmin()&&can("day.edit")&&!(window.simOn&&window.simOn())}catch(_){return false}};
window.deCan=deCan;
/* check sum of the 1st unit of a day in the Drehplan (scene / text and time of every row): a new Drehplan → another sum */
function deSig(items){const s=arr(items).map(x=>(x.sc?"s"+x.sc:"e"+String(x.n||""))+"@"+String(x.t||"")).join("|");let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)}
const deGone=x=>!!(x&&x._de&&(x._de.x||x._de.to));
window.deGone=deGone;
/* per unit: the rows of a unit of a day (1st: items, 2nd / 3rd: unit2 / unit3.items) and its entry in a change
   (1st: {sig, items} at the top, as before; 2nd / 3rd: u2 / u3 {sig, items}) */
const UNITS=["1","2","3"];
const uIts=(d,u)=>u==="1"?arr(d&&d.items):arr(d&&(d["unit"+u]||{}).items);
const uEnt=(e,u)=>!e?null:u==="1"?(Array.isArray(e.items)?{sig:e.sig,items:e.items}:null):(e["u"+u]&&Array.isArray(e["u"+u].items)?e["u"+u]:null);
const deStale=(date,u)=>!!(window.DESTALE[date]&&window.DESTALE[date][u]);
/* ---------- applied after the Coverday (29-coverday.js cdApplyAll): days and their callsheets ---------- */
window.deApply=days=>{window.DESTALE={};const E=window.DAYEDIT||{};if(!Object.keys(E).length)return days;
  return days.map(d=>{const e=d&&d.kind==="shoot"&&E[d.date];if(!e)return d;let nd=null;
    for(const u of UNITS){const ent=uEnt(e,u);if(!ent)continue;
      if(ent.sig!==deSig(uIts(d,u))){(window.DESTALE[d.date]=window.DESTALE[d.date]||{})[u]=true;continue}
      nd=nd||Object.assign({},d,{_de:{at:e.at||0}});if(u==="1")nd.items=ent.items;else nd["unit"+u]=Object.assign({},d["unit"+u]||{},{items:ent.items})}
    return nd||d})};
/* the callsheet of a changed day: the scene rows in the new order and times, struck / moved away left out, new ones added */
window.deDispos=dispos=>{const E=window.DAYEDIT||{};if(!Object.keys(E).length)return dispos;
  return dispos.map(c=>{const e=c&&c.cs&&E[c.date];if(!e||deStale(c.date,"1")||!Array.isArray(e.items))return c;const o=c.cs.order||{},rows0=arr(o.rows);if(!rows0.length)return c;
    const norm=v=>String(v||"").toLowerCase().replace(/\s+/g,"");
    const scs=e.items.filter(x=>x.sc&&!deGone(x)).map(x=>{const r=rows0.find(y=>y.sc&&norm(y.sc)===norm(x.sc));
      return Object.assign({},r||{sc:x.sc,ie:x.ie||"",set:x.set||"",syn:x.d||"",cast:arr(x.cast).join(", ")},{t:x.t||(r&&r.t)||""},x._de?{_de:x._de}:{})});
    const rows=[];let i=0;for(const r of rows0){if(r.sc){if(i<scs.length)rows.push(scs[i++])}else{if(/wrap|drehschluss/i.test(String(r.text||"")))while(i<scs.length)rows.push(scs[i++]);rows.push(r)}}
    while(i<scs.length)rows.push(scs[i++]);
    return Object.assign({},c,{cs:Object.assign({},c.cs,{order:Object.assign({},o,{rows})})})})};
/* ---------- live: every change shows within a second on every device ---------- */
let DESUB=null;
async function deSub(){if(DESUB||typeof ME==="undefined"||!ME)return;DESUB="…";
  try{const {F,db}=await fb();DESUB=F.onSnapshot(F.collection(db,"dayedit"),async q=>{const m={};let key=null;
      for(const x of q.docs||[]){if(!/^\d{8}$/.test(x.id))continue;try{key=key||await getDataKey();const o=await ownDec(key,x.data().c);if(o&&UNITS.some(u=>uEnt(o,u)))m[deDate(x.id)]=o}catch(err){console.warn("dayedit",err&&err.message||err)}}
      const ch=JSON.stringify(m)!==JSON.stringify(window.DAYEDIT);window.DAYEDIT=m;try{localStorage.setItem("dayedit:v1",JSON.stringify(m))}catch(_){}
      if(ch&&typeof window.cdApplyAll==="function"){window.cdApplyAll();render()}},()=>{DESUB=null})}catch(_){DESUB=null}}
setTimeout(deSub,1200);setInterval(()=>{if(!DESUB)deSub()},20e3);
/* ---------- the pencil in the head of a shooting day (Drehplan) ---------- */
const DEPEN='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
window.deBtn=d=>{if(!d||d.kind!=="shoot"||!deCan())return "";const on=!!(window.DAYEDIT||{})[d.date];
  return '<button type="button" class="debtn'+(on?' on':'')+'" data-deedit="'+esc(d.date)+'" aria-label="'+esc(L("Drehtag vor Ort ändern"))+'" title="'+esc(L("Drehtag vor Ort ändern"))+'">'+DEPEN+'</button>'};
/* a note in the day: changed on set (for everybody) / no longer valid because of a new Drehplan (for the editors) */
window.deNote=d=>{if(!d)return "";if(window.DESTALE[d.date]&&deCan())return '<p class="denote destale">'+esc(L("Die Änderung vor Ort gilt nicht mehr: der Drehplan dieses Tags ist neu. Bitte neu anpassen."))+'</p>';
  const e=(window.DAYEDIT||{})[d.date];if(!e||window.DESTALE[d.date])return "";const t=e.at?new Date(e.at).toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"}):"";
  return '<p class="denote">'+esc(L("Vor Ort geändert"))+(t?" · "+esc(t):"")+(e.byName&&!/@/.test(e.byName)?" · "+esc(e.byName):"")+'</p>'};
/* the mark of one row in the Drehplan */
window.deMark=it=>{const e=it&&it._de;if(!e)return "";const dd=x=>{const d=arr(S.days).find(y=>y.date===x);return d?(d.short||d.label||x):x};
  return '<span class="demk">'+esc(e.x?L("heute gestrichen"):e.to?L("verschoben auf")+" "+dd(e.to):e.from?L("verschoben von")+" "+dd(e.from):e.add?L("neu dazu"):e.nt?L("Zeit vor Ort geändert"):"")+'</span>'};
/* ---------- the dialog ---------- */
const deHm=hm;   /* «7:05» → «07:05» – the same helper as everywhere (12-mycal hm) */
const deMins=v=>{const m=String(v||"").trim().match(/^(\d+)\s*[h:]\s*(\d{1,2})|^(\d+)\s*['′m]?/);return m?(m[3]!=null?+m[3]:+m[1]*60+ +m[2]):0};
const deAddMin=(t,n)=>{const m=deHm(t).match(/(\d\d):(\d\d)/);if(!m)return t;const x=(+m[1]*60+ +m[2]+n+1440)%1440;return ("0"+Math.floor(x/60)).slice(-2)+":"+("0"+x%60).slice(-2)};
/* the original rows of a day (Drehplan after the Coverday, before any change on set) */
const deOrig=date=>{const d0=typeof window.cdDaysT==="function"&&S.days0?window.cdDaysT(S.days0).find(x=>x.date===date):arr(S.days0||S.days).find(x=>x.date===date);return d0||null};
function deLoad(date,u){u=u||"1";const ent=uEnt((window.DAYEDIT||{})[date],u);
  if(ent&&!deStale(date,u))return ent.items.map(x=>Object.assign({},x,x._de?{_de:Object.assign({},x._de)}:{}));
  return uIts(deOrig(date),u).map(x=>Object.assign({},x))}
/* a scene taken in: before the wrap, at the end of the scene before it (its time + duration) */
function deInsert(items,it){let w=items.findIndex(x=>!x.sc&&/\b(wrap|drehschluss)\b/i.test(String(x.n||"")));if(w<0)w=items.length;
  const prev=[...items.slice(0,w)].reverse().find(x=>!deGone(x)&&deHm(x.t));it.t=prev?deAddMin(prev.t,deMins(prev.dur)||(prev.sc?30:0)):(it.t||"");items.splice(w,0,it)}
function deDialog(date,u){u=u||"1";const others=arr(S.days).filter(x=>x.kind==="shoot"&&x.date!==date&&(u==="1"||uIts(x,u).length)),lbl=x=>(x.short||x.label||x.date);
  /* the units of this day that have rows (1st always) – one at a time */
  const d0=deOrig(date),units=UNITS.filter(x=>x==="1"||uIts(d0,x).length||uEnt((window.DAYEDIT||{})[date],x)),UN={"1":"1st","2":"2nd","3":"3rd"};
  let items=deLoad(date,u);const keep=JSON.stringify(items);const moves={};   /* date → items moved there */
  const dl=mkDialog("dedlg",null,{replace:true});
  const row=(it,i)=>{const e=it._de||{},gone=deGone(it);
    return '<div class="derow'+(gone?' degone':'')+'" data-dei="'+i+'"><div class="dert"><input type="time" data-det="'+i+'" value="'+esc(deHm(it.t))+'" aria-label="'+esc(L("Zeit"))+'"'+(gone?' disabled':'')+'></div>'+
      '<div class="dewhat"><b>'+esc(it.sc?L("Szene")+" "+it.sc:String(it.n||""))+'</b>'+(it.sc?' <small>'+esc([it.ie,it.set].filter(Boolean).join(" · "))+'</small>':'')+(it.dur?' <small>'+esc(it.dur)+'</small>':'')+(it._de?' '+window.deMark(it):'')+'</div>'+
      '<div class="debtns"><button type="button" class="lnk" data-deup="'+i+'" aria-label="'+esc(L("nach oben"))+'" title="'+esc(L("nach oben"))+'"'+(i?'':' disabled')+'>▲</button><button type="button" class="lnk" data-dedn="'+i+'" aria-label="'+esc(L("nach unten"))+'" title="'+esc(L("nach unten"))+'"'+(i<items.length-1?'':' disabled')+'>▼</button>'+
      (it.sc?'<button type="button" class="lnk" data-dex="'+i+'">'+esc(e.x||e.to?L("zurück"):L("streichen"))+'</button>'+(e.x||e.to||e.from||e.add?'':'<select data-demv="'+i+'" aria-label="'+esc(L("verschieben auf"))+'"><option value="">'+esc(L("verschieben auf …"))+'</option>'+others.map(x=>'<option value="'+esc(x.date)+'">'+esc(lbl(x))+'</option>').join("")+'</select>'):'')+'</div></div>'};
  /* scenes to take in: from another shooting day (moved here) or a new one */
  const pool=()=>others.flatMap(x=>uIts(x,u).filter(y=>y.sc&&!deGone(y)).map(y=>({d:x.date,sc:y.sc,lab:lbl(x)+" · "+L("Szene")+" "+y.sc+(y.set?" · "+y.set:"")})));
  const draw=()=>{dl.innerHTML='<div class="a2box debox">'+xBtn("data-dex2")+'<h3>'+esc(L("Drehtag vor Ort ändern"))+' · '+esc(lbl(arr(S.days).find(x=>x.date===date)||{date}))+(units.length>1?' · '+UN[u]+' Unit':'')+'</h3>'+
    (units.length>1?'<div class="deunits" role="group" aria-label="Unit">'+units.map(x=>'<button type="button" class="pillbtn'+(x===u?' on':'')+'" data-deunit="'+x+'" aria-pressed="'+(x===u)+'">'+UN[x]+' Unit</button>').join("")+'</div>':'')+
    '<p class="ghint">'+esc(L("Umordnen, Zeiten ändern, streichen, verschieben oder Szenen dazunehmen. Gilt für alle sofort – der Drehplan aus der Dropbox bleibt unverändert."))+'</p>'+
    '<div class="delist">'+items.map(row).join("")+'</div>'+
    '<div class="deadd"><select data-depool><option value="">'+esc(L("Szene von einem anderen Tag dazunehmen …"))+'</option>'+pool().map((p,i)=>'<option value="'+i+'">'+esc(p.lab)+'</option>').join("")+'</select>'+
    '<div class="denew"><input data-dens maxlength="12" placeholder="'+esc(L("Neue Szene: Nr."))+'"><input data-deset maxlength="60" placeholder="'+esc(L("Set"))+'"><button type="button" class="pillbtn" data-denew>+ '+esc(L("Szene"))+'</button></div></div>'+
    '<div class="arb"><button type="button" class="pillbtn" data-derecalc>'+esc(L("Zeiten neu berechnen"))+'</button>'+(uEnt((window.DAYEDIT||{})[date],u)?'<button type="button" class="pillbtn" data-deoff>'+esc(L("Alles aufheben"))+'</button>':'')+saveBtn('data-desave type="button"')+'</div></div>'};
  const readT=()=>dl.querySelectorAll("[data-det]").forEach(x=>{const i=+x.dataset.det,it=items[i];if(it&&deHm(x.value)&&deHm(x.value)!==deHm(it.t)){it.t=deHm(x.value);it._de=Object.assign({},it._de,{nt:1})}});
  draw();document.body.appendChild(dl);
  dl.addEventListener("click",async e=>{const b=e.target.closest("button");if(e.target===dl||(b&&b.dataset.dex2!=null)){dl.remove();return}if(!b)return;readT();
    /* another unit: unsaved changes of this one are asked for first */
    if(b.dataset.deunit!=null){if(b.dataset.deunit===u)return;if((JSON.stringify(items)!==keep||Object.keys(moves).length)&&!window.confirm(L("Änderungen dieser Unit verwerfen?")))return;dl.remove();deDialog(date,b.dataset.deunit);return}
    /* up / down: the rows change places, the times stay with the places (the scene takes over the slot) */
    const sw=(i,j)=>{if(j<0||j>=items.length)return;const ti=items[i].t,tj=items[j].t;[items[i],items[j]]=[items[j],items[i]];
      if(deHm(ti)&&deHm(tj)){items[i].t=ti;items[j].t=tj;for(const k of [i,j])if(items[k].sc)items[k]._de=Object.assign({},items[k]._de,{nt:1})}draw()};
    if(b.dataset.deup!=null){sw(+b.dataset.deup,+b.dataset.deup-1);return}
    if(b.dataset.dedn!=null){sw(+b.dataset.dedn,+b.dataset.dedn+1);return}
    if(b.dataset.dex!=null){const it=items[+b.dataset.dex],x=it._de||{};
      if(x.to){delete moves[x.to];const m=moves;void m;delete x.to}else if(x.x)delete x.x;else x.x=1;it._de=Object.keys(x).length?x:undefined;if(!it._de)delete it._de;draw();return}
    if(b.dataset.derecalc!=null){/* from the first time on: every row after the one before plus its duration (struck rows left out) */
      let cur="";for(const it of items){if(deGone(it))continue;if(!cur){cur=deHm(it.t);if(cur)cur=deAddMin(cur,deMins(it.dur)||0);continue}
        if(deHm(it.t)!==cur){it.t=cur;it._de=Object.assign({},it._de,{nt:1})}cur=deAddMin(cur,deMins(it.dur)||(it.sc?30:0))}draw();return}
    if(b.dataset.denew!=null){const sc=String((dl.querySelector("[data-dens]")||{}).value||"").trim(),set=String((dl.querySelector("[data-deset]")||{}).value||"").trim();if(!sc)return;
      deInsert(items,{sc,set,_de:{add:1}});draw();return}
    if(b.dataset.deoff!=null){try{await deStore(date,u,null);window.cdApplyAll();render();dl.remove();showMsg(L("Änderung vor Ort aufgehoben."),3000)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),5000)}return}
    if(b.dataset.desave!=null){if(JSON.stringify(items)===keep&&!Object.keys(moves).length){dl.remove();return}
      b.disabled=true;try{await deSave(date,u,items,moves);dl.remove();showMsg(L("Drehtag geändert – für alle sichtbar."),3500);deAsk(date,deSummary(date,items,u))}catch(err){b.disabled=false;showMsg(/permission/.test(err&&err.code||"")?L("Keine Berechtigung."):L("Fehler:")+" "+(err.message||err),5000)}}});
  dl.addEventListener("change",e=>{const s=e.target;readT();
    if(s.dataset.demv!=null&&s.value){const it=items[+s.dataset.demv];it._de=Object.assign({},it._de,{to:s.value});(moves[s.value]=moves[s.value]||[]).push(Object.assign({},it,{_de:{from:date}}));draw();return}
    if(s.dataset.depool!=null&&s.value!==""){const p=pool()[+s.value];if(!p)return;const src=arr(S.days).find(x=>x.date===p.d),it=uIts(src,u).find(y=>y.sc===p.sc);if(!it)return;
      deInsert(items,Object.assign({},it,{_de:{from:p.d}}));(moves["-"+p.d]=moves["-"+p.d]||[]).push(p.sc);draw()}})}
/* store the rows of one unit of a day (null: that unit back to the Drehplan) – the other units of the day stay as they are; nothing left: deleted */
async function deStore(d,u,list){const {F,db}=await fb();let me={};try{me=myIdentity()||{}}catch(_){}const nm=String(me.name||"");
  const cur=Object.assign({},(window.DAYEDIT||{})[d]||{}),sig=deSig(uIts(deOrig(d),u));
  if(u==="1"){if(list){cur.sig=sig;cur.items=list}else{delete cur.sig;delete cur.items}}else{if(list)cur["u"+u]={sig,items:list};else delete cur["u"+u]}
  const ref=F.doc(db,"dayedit",deId(d));
  if(!UNITS.some(x=>uEnt(cur,x))){await F.deleteDoc(ref);delete window.DAYEDIT[d];return}
  cur.at=Date.now();cur.byName=/@/.test(nm)?"":nm.slice(0,60);
  await F.setDoc(ref,{c:await ownEnc(cur),at:F.serverTimestamp()});window.DAYEDIT[d]=cur}
/* save: this unit of this day, plus the days a scene went to (added before their wrap) or came from (marked «verschoben auf») – same unit */
async function deSave(date,u,items,moves){
  await deStore(date,u,items);
  for(const [k,v] of Object.entries(moves)){
    if(k[0]==="-"){const src=k.slice(1),list=deLoad(src,u);for(const sc of v){const it=list.find(y=>y.sc===sc&&!deGone(y));if(it)it._de=Object.assign({},it._de,{to:date})}await deStore(src,u,list)}
    else{const list=deLoad(k,u);for(const it of v)if(!list.some(y=>y.sc===it.sc&&!deGone(y)))deInsert(list,it);await deStore(k,u,list)}}
  if(typeof window.cdApplyAll==="function")window.cdApplyAll();render()}
/* what changed, in one line: «D02 vor Ort geändert: Sz. 23 gestrichen · Sz. 24 → D03 · Sz. 90 neu · Reihenfolge/Zeiten» */
function deSummary(date,items,u){u=u||"1";const d0=deOrig(date),o=uIts(d0,u),lbl=x=>{const d=arr(S.days).find(y=>y.date===x);return d?(d.short||d.label||x):x},sz=L("Sz.");const p=[];
  for(const it of items){const e=it._de||{};if(!it.sc)continue;if(e.x)p.push(sz+" "+it.sc+" "+L("gestrichen"));else if(e.to)p.push(sz+" "+it.sc+" → "+lbl(e.to));else if(e.from)p.push(sz+" "+it.sc+" "+L("von")+" "+lbl(e.from));else if(e.add)p.push(sz+" "+it.sc+" "+L("neu"))}
  const ord=x=>x.filter(y=>y.sc&&!deGone(y)&&!(y._de&&(y._de.from||y._de.add))).map(y=>y.sc+"@"+deHm(y.t)).join("|");
  if(ord(items)!==ord(o.filter(y=>items.some(z=>z.sc===y.sc&&!deGone(z)))))p.push(L("Reihenfolge/Zeiten angepasst"));
  return lbl(date)+(u!=="1"?" "+({"2":"2nd","3":"3rd"}[u])+" Unit":"")+" "+L("vor Ort geändert")+(p.length?": "+p.join(" · "):"")}
/* after saving: push «Drehplan geändert» to everybody (with the right «Push senden») and / or share in the chat (WhatsApp) – asked each time */
function deAsk(date,txt){const canP=can("push.send")&&window.PUSHEN!==false,wm=typeof window.scWaMode==="function"?window.scWaMode("t"):"f";
  if(!canP&&wm==="n")return;const d=mkDialog("deask",null,{replace:true});
  d.innerHTML='<div class="a2box"><h3>'+esc(L("Drehtag geändert"))+'</h3><p>'+esc(txt)+'</p>'+
    (canP?'<label class="ck"><input type="checkbox" data-deaskp checked> '+esc(L("Push-Nachricht an alle senden"))+'</label>':'')+
    (wm!=="n"?'<label class="ck"><input type="checkbox" data-deaskw'+(wm==="a"?' checked':'')+'> '+esc(L("In den Chat (WhatsApp) teilen"))+'</label>':'')+
    '<div class="a2b"><button type="button" class="pri" data-deaskok>'+esc(L("Senden"))+'</button><button type="button" data-deaskno>'+esc(L("Nichts senden"))+'</button></div></div>';
  d.addEventListener("click",async e=>{if(e.target===d||e.target.closest("[data-deaskno]")){d.remove();return}if(!e.target.closest("[data-deaskok]"))return;
    const p=d.querySelector("[data-deaskp]"),w=d.querySelector("[data-deaskw]");d.remove();
    if(w&&w.checked&&typeof window.scWaOpen==="function")window.scWaOpen(txt,"t");   /* first: a phone opens WhatsApp only right in the tap */
    if(p&&p.checked)try{const enc=await ownEnc({title:L("Drehplan geändert"),body:txt,roles:null,depts:null,by:ME.email,at:Date.now(),kind:"dayedit",url:"./#go=plan:"+date});
      const {F,db}=await fb();const ref=await F.addDoc(F.collection(db,"broadcasts"),{c:enc,at:F.serverTimestamp()});if(typeof bcDeliver==="function")showMsg(await bcDeliver(ref.id),4000)}catch(err){showMsg(L("Push nicht gesendet:")+" "+(err.message||err),5000)}});
  document.body.appendChild(d)}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-deedit]");if(!b)return;e.preventDefault();e.stopPropagation();if(deCan())deDialog(b.dataset.deedit)},true);
