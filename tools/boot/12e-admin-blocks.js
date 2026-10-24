import {blockList,blockNow,esc,L,LANG,mName,todayISO,TZ0} from "../base/10-core.js";
import {render} from "../base/15-script-tab.js";
import {showMsg} from "../base/20-data-start.js";
import {ADMINS} from "./01-config.js";
import {ME,MEMBER,can,fb,setMEMBER} from "./03-core-firebase.js";
import {ADM,SECS,ensureAdm} from "./12a-admin-core.js";
/* ---------- App-Verwaltung → App → Drehblöcke ----------
   The shoot in several blocks (e.g. Block 1 Schweiz, Block 2 Indien). Per block: name, country, time zone (set by hand),
   dates, the words of its own schedule in the Dropbox («Indien, India» → «Tschugger Sched 261018 INDIA.pdf») and which
   main topics are shown while it runs: on, off, or from a date on (released step by step).
   Saved in config/app «blocks» (read by everybody, written with «Einstellungen» – no new rule needed). */
const BLK={edit:null,del:-1,msg:"",q:{}};
const BLK_TOPICS=[["today","Today"],["dispo","Callsheet"],["plan","Schedule"],["loc","Locations"],["crew","Crew"],["script","Script"],["info","Info"]];
const blkCur=()=>BLK.edit||JSON.parse(JSON.stringify(blockList()));
const blkTzOk=tz=>{try{new Intl.DateTimeFormat("en",{timeZone:tz});return !!tz}catch(_){return false}};
const blkClock=tz=>{try{return new Date().toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit",timeZone:tz})}catch(_){return ""}};
function blkZones(){let z=[];try{z=Intl.supportedValuesOf("timeZone")}catch(_){}
  return z.length?z:["Europe/Zurich","Europe/Berlin","Europe/London","Asia/Kolkata","Asia/Dubai","Asia/Bangkok","America/New_York","America/Los_Angeles","Africa/Johannesburg","Australia/Sydney"]}
/* the usual time zones of a shoot first (with the time difference now), then all others of the world */
const BLK_TZ=[["Europe/Zurich","Schweiz"],["Asia/Kolkata","Indien"],["Europe/Berlin","Deutschland"],["Europe/Paris","Frankreich"],["Europe/Rome","Italien"],["Europe/Vienna","Österreich"],["Europe/London","Grossbritannien"],["Europe/Lisbon","Portugal"],["Europe/Athens","Griechenland"],["Europe/Istanbul","Türkei"],["Asia/Dubai","Vereinigte Arabische Emirate"],["Asia/Kathmandu","Nepal"],["Asia/Bangkok","Thailand"],["Asia/Tokyo","Japan"],["Africa/Casablanca","Marokko"],["Africa/Johannesburg","Südafrika"],["America/New_York","USA Ostküste"],["America/Los_Angeles","USA Westküste"],["America/Mexico_City","Mexiko"],["America/Sao_Paulo","Brasilien"],["Australia/Sydney","Australien"]];
function blkOff(tz){try{const p=new Intl.DateTimeFormat("en",{timeZone:tz,timeZoneName:"shortOffset"}).formatToParts(new Date()).find(x=>x.type==="timeZoneName");return p?p.value.replace("GMT","UTC"):""}catch(_){return ""}}
function blkTzSelect(cur,i){const top=BLK_TZ.filter(([z])=>blkTzOk(z)),known=new Set(top.map(x=>x[0]));
  const rest=blkZones().filter(z=>!known.has(z)),opt=(z,t)=>'<option value="'+esc(z)+'"'+(z===cur?' selected':'')+'>'+esc(t)+'</option>';
  return '<select data-blkf="'+i+'|tz">'+(cur&&!known.has(cur)&&!rest.includes(cur)?opt(cur,cur):'')+
    '<optgroup label="'+esc(L("Häufig"))+'">'+top.map(([z,c])=>opt(z,L(c)+" – "+z+(blkOff(z)?" ("+blkOff(z)+")":""))).join("")+'</optgroup>'+
    '<optgroup label="'+esc(L("Alle Zeitzonen"))+'">'+rest.map(z=>opt(z,z)).join("")+'</optgroup></select>'}
function blocksSec(){
  const bl=blkCur(),now=blockNow();
  const topic=(b,i,k,t)=>{const m=(b.topics||{})[k]||"on",mode=/^\d{4}-\d\d-\d\d$/.test(m)?"date":m==="off"?"off":"on";
    return '<div class="blktop"><span class="blktn">'+esc(L(t))+'</span><select data-blkf="'+i+'|tm:'+k+'" aria-label="'+esc(L(t))+'">'+
      [["on","An"],["off","Aus"],["date","Ab Datum"]].map(([v,n])=>'<option value="'+v+'"'+(v===mode?' selected':'')+'>'+esc(L(n))+'</option>').join("")+'</select>'+
      (mode==="date"?'<input type="date" data-blkf="'+i+'|td:'+k+'" value="'+esc(m)+'" aria-label="'+esc(L("Ab Datum"))+'">':'')+'</div>'};
  const card=(b,i)=>{const tzok=blkTzOk(b.tz),run=now&&now.id===b.id;
    return '<details class="blkcard" data-sec="blk-'+esc(b.id)+'"'+(SECS["blk-"+b.id]===true?' open':'')+'><summary><b>'+esc(b.name||L("Block")+" "+(i+1))+'</b>'+(b.country?' · '+esc(b.country):'')+(run?' <span class="ust role">'+esc(L("läuft"))+'</span>':'')+'</summary>'+
      '<div class="blkgrid">'+
      '<label class="arl">'+esc(L("Name"))+'<input data-blkf="'+i+'|name" maxlength="40" value="'+esc(b.name||"")+'" placeholder="'+esc(L("z. B. Block 2"))+'"></label>'+
      '<label class="arl">'+esc(L("Land"))+'<input data-blkf="'+i+'|country" maxlength="40" value="'+esc(b.country||"")+'" placeholder="'+esc(L("z. B. Indien"))+'"></label>'+
      '<label class="arl">'+esc(L("Zeitzone"))+blkTzSelect(b.tz,i)+
        '<small class="ghint">'+(b.tz&&!tzok?esc(L("Unbekannte Zeitzone")):tzok?esc(L("Jetzt dort"))+' '+esc(blkClock(b.tz)):'')+'</small></label>'+
      '<label class="arl">'+esc(L("Von"))+'<input type="date" data-blkf="'+i+'|from" value="'+esc(b.from||"")+'"></label>'+
      '<label class="arl">'+esc(L("Bis"))+'<input type="date" data-blkf="'+i+'|to" value="'+esc(b.to||"")+'"></label>'+
      '<label class="arl">'+esc(L("Drehplan in der Dropbox"))+'<input data-blkf="'+i+'|kw" maxlength="80" spellcheck="false" value="'+esc(b.kw||"")+'" placeholder="'+esc(L("z. B. Indien, India"))+'">'+
        '<small class="ghint">'+esc(L("Wörter im Dateinamen des eigenen Drehplans. Leer = Hauptdrehplan."))+'</small></label></div>'+
      '<p class="ahint"><b>'+esc(L("Hauptthemen"))+'</b> – '+esc(L("Was die Crew sieht, solange dieser Block läuft. «Ab Datum»: erst ab diesem Tag (Schritt für Schritt freigeben). Mit «Einstellungen» siehst du immer alles."))+'</p>'+
      '<div class="blktops">'+BLK_TOPICS.map(([k,t])=>topic(b,i,k,t)).join("")+'</div>'+
      blkPeople(b)+
      '<div class="arb"><button type="button" class="abtn'+(BLK.del===i?' danger':'')+'" data-blkdel="'+i+'">'+esc(L(BLK.del===i?"Wirklich löschen?":"Block löschen"))+'</button></div></details>'};
  return '<p class="ahint">'+esc(L("Der Dreh in Blöcken (z. B. Schweiz, dann Indien). Die App rechnet «heute» und «jetzt» in der Zeitzone des laufenden Blocks. Ein Block mit eigenem Drehplan bekommt dessen Tage bei der nächsten Aktualisierung."))+'</p>'+
    (bl.length?bl.map(card).join(""):'<p class="ghint">'+esc(L("Noch keine Drehblöcke – alles läuft in Schweizer Zeit."))+'</p>')+
    '<div class="arb"><button type="button" class="abtn" data-blkadd>'+esc(L("Neuer Block"))+'</button>'+(BLK.edit?'<button type="button" class="abtn" data-blkundo>'+esc(L("Verwerfen"))+'</button><button type="button" class="abtn prim" data-blksave>'+esc(L("Speichern"))+'</button>':'')+'</div>'+
    (BLK.msg?'<p class="ghint" role="status">'+esc(BLK.msg)+'</p>':'')}
window.blocksSec=blocksSec;
/* who sees this block: tick people right here (sets their blocks by hand; «Automatisch» again in the person's profile edit) */
const blkName=m=>mName(m)||m.email||"";
function blkPeople(b){if(!can("users.edit"))return "";if(!ADM.loaded){ensureAdm();return '<p class="ghint">'+esc(L("Lade …"))+'</p>'}
  if(BLK.edit&&!blockList().some(x=>x.id===b.id))return '<p class="ghint">'+esc(L("Personen zuteilen: zuerst den Block speichern."))+'</p>';
  const all=(ADM.mem||[]).filter(m=>m&&m.uid&&m.active!==false),q=String(BLK.q[b.id]||"").toLowerCase();
  const sees=m=>!Array.isArray(m.blk)||m.blk.includes(b.id),boss=m=>ADMINS.includes(m.email)||(ADM.adm||[]).includes(m.email);
  const list=all.filter(m=>!q||blkName(m).toLowerCase().includes(q)).sort((x,y)=>blkName(x).localeCompare(blkName(y),LANG));
  return '<details class="blkppl" data-sec="blkp-'+esc(b.id)+'"'+(SECS["blkp-"+b.id]===true?' open':'')+'><summary>'+esc(L("Personen"))+' ('+all.filter(sees).length+'/'+all.length+')</summary>'+
    '<input type="search" class="blkq" data-blkq="'+esc(b.id)+'" value="'+esc(BLK.q[b.id]||"")+'" placeholder="'+esc(L("Suchen"))+'" aria-label="'+esc(L("Suchen"))+'">'+
    '<div class="chk blkpl">'+list.map(m=>'<label class="ck"><input type="checkbox" data-blkp="'+esc(b.id)+'|'+esc(m.uid)+'"'+(sees(m)||boss(m)?' checked':'')+(boss(m)?' disabled':'')+'> '+esc(blkName(m))+
      (boss(m)?' <small class="ghint">'+esc(L("sieht alles"))+'</small>':!Array.isArray(m.blk)?' <small class="ghint">'+esc(L("automatisch"))+'</small>':'')+'</label>').join("")+'</div>'+
    '<p class="ghint">'+esc(L("Häkchen entfernen: die Person sieht diesen Block nicht mehr (Drehtage und Callsheets). Zurück auf «Automatisch» beim Bearbeiten der Person."))+'</p></details>'}
document.addEventListener("input",e=>{const q=e.target.closest&&e.target.closest("[data-blkq]");if(!q)return;BLK.q[q.dataset.blkq]=q.value;render()});
document.addEventListener("change",async e=>{const c=e.target.closest&&e.target.closest("[data-blkp]");if(!c||!can("users.edit"))return;
  const [bid,uid]=c.dataset.blkp.split("|"),m=(ADM.mem||[]).find(x=>x.uid===uid);if(!m)return;
  const ids=blockList().map(x=>x.id),cur=Array.isArray(m.blk)?m.blk.filter(x=>ids.includes(x)):ids.slice();
  const nb=c.checked?[...new Set(cur.concat(bid))]:cur.filter(x=>x!==bid),old=m.blk;c.disabled=true;
  try{const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",uid),{blk:nb});m.blk=nb;if(ME&&ME.uid===uid&&typeof setMEMBER==="function")setMEMBER(Object.assign({},MEMBER,{blk:nb}))}
  catch(err){m.blk=old;showMsg(L("Nicht gespeichert")+": "+(err&&err.code||err),4000)}
  render()});
function blkProblem(bl){
  for(const b of bl){const n=b.name||b.id;
    if(!b.tz||!blkTzOk(b.tz))return L("Zeitzone prüfen")+": "+n;
    if(b.from&&b.to&&b.from>b.to)return L("«Von» liegt nach «Bis»")+": "+n}
  const r=bl.filter(b=>b.from&&b.to).sort((a,b)=>a.from<b.from?-1:1);
  for(let i=1;i<r.length;i++)if(r[i].from<=r[i-1].to)return L("Die Daten zweier Blöcke überschneiden sich")+": "+r[i-1].name+" / "+r[i].name;
  return ""}
document.addEventListener("input",e=>{const el=e.target.closest&&e.target.closest("[data-blkf]");if(!el)return;
  const [i,f]=el.dataset.blkf.split("|");if(!BLK.edit)BLK.edit=blkCur();const b=BLK.edit[+i];if(!b)return;
  if(f.startsWith("tm:")||f.startsWith("td:")){const k=f.slice(3);b.topics=Object.assign({},b.topics);
    if(f.startsWith("tm:"))b.topics[k]=el.value==="date"?todayISO():el.value;else if(/^\d{4}-\d\d-\d\d$/.test(el.value))b.topics[k]=el.value;
    BLK.msg="";render();return}
  b[f]=el.value.trim();BLK.msg="";
  if(f==="tz"||!document.querySelector("[data-blksave]"))render()});   /* time zone: clock and check below the field; first change: the save button appears */
document.addEventListener("click",e=>{if(!e.target||!e.target.closest)return;
  if(e.target.closest("[data-blkadd]")){const bl=BLK.edit=blkCur();let n=bl.length+1;while(bl.some(b=>b.id==="b"+n))n++;const nid="b"+Date.now().toString(36);   /* never the id of a deleted block again (people's hand-set blocks still name it) */
    bl.push(bl.length?{id:nid,name:L("Block")+" "+n,country:"",tz:TZ0,from:"",to:"",kw:"",topics:{}}:{id:nid,name:L("Block")+" 1",country:"Schweiz",tz:TZ0,from:"",to:"",kw:"",topics:{}});
    BLK.msg="";SECS["blk-"+nid]=true;render();return}
  if(e.target.closest("[data-blkundo]")){BLK.edit=null;BLK.del=-1;BLK.msg="";render();return}
  const d=e.target.closest("[data-blkdel]");
  if(d){const i=+d.dataset.blkdel;if(BLK.del!==i){BLK.del=i;render();return}
    BLK.edit=blkCur();BLK.edit.splice(i,1);BLK.del=-1;BLK.msg=L("Gelöscht – mit «Speichern» übernehmen.");render();return}
  if(e.target.closest("[data-blksave]"))blkSave()});
async function blkSave(){
  const bl=blkCur().map(b=>({id:b.id,name:String(b.name||"").slice(0,40),country:String(b.country||"").slice(0,40),tz:String(b.tz||TZ0),from:b.from||"",to:b.to||"",kw:String(b.kw||"").slice(0,80),
    topics:Object.fromEntries(Object.entries(b.topics||{}).filter(([k,v])=>BLK_TOPICS.some(t=>t[0]===k)&&(v==="off"||/^\d{4}-\d\d-\d\d$/.test(v))))}));
  const pr=blkProblem(bl);if(pr){BLK.msg=pr;render();return}
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"config","app"),{blocks:bl},{merge:true});
    window.BLOCKS=bl.length?bl:null;try{bl.length?localStorage.setItem("appblocks",JSON.stringify(bl)):localStorage.removeItem("appblocks")}catch(_){}
    BLK.edit=null;BLK.del=-1;BLK.msg=L("Gespeichert.")+(bl.some(b=>b.kw)?" "+L("Die Drehpläne der Blöcke kommen mit der nächsten Aktualisierung."):"")}
  catch(err){BLK.msg=L("Nicht gespeichert")+": "+(err&&err.code||err)}
  render()}
