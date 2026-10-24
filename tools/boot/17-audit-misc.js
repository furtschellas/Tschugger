import {I18N,L,LANG,S,ariaTip,esc,localISO,msHM,todayISO} from "../base/10-core.js";
import {CSCUR} from "../base/13b-cs-now.js";
import {fold,onRender,onRendered,render} from "../base/15-script-tab.js";
import {fmtDT} from "./01-config.js";
import {FB,ME,MEMBER,MYROLE,SIMROLE,crewPerson,fb,isAdmin,isOwner,lc} from "./03-core-firebase.js";
import {chatFab} from "./08-chat-tour.js";
import {bcButton} from "./09-broadcast.js";
import {appKind} from "./10-menus-welcome-presence.js";
import {ACSUB} from "./11-account.js";
import {ADM} from "./12a-admin-core.js";
import {dmy} from "./14-today-changes-offline.js";
import {DCK,RTS,dckMay,dckRun,roleTestRun} from "./19-data-check.js";
import {SIMUSER} from "./22-simulate.js";
/* ---------- 11) Protokoll: who changed what in the administration (roles, users, menus, settings, messages) ---------- */
const AUDIT_COLS=["roles","userroles","admins","owners","invites","members","menus","config","broadcasts","starts","requests","sceneack","coverday"];
export function auditSum(col,data,op){
  if(op==="delete")return "";
  if(col==="broadcasts")return data&&data.c?L("Nachricht gesendet"):(data&&data.sent?L("versendet"):"");
  if(!data||typeof data!=="object")return "";
  if(col==="sceneack"){const t=msHM;return L("Szene")+" "+(data.sc||"")+" · "+(data.s===1?L("läuft")+" "+t(data.b):L("abgeschlossen")+" "+t(data.b)+"–"+t(data.e))}
  const keysOnly=col==="members"||col==="requests"; /* profile values (phone, address …) never into the log, only which fields changed */
  const out=[];for(const [k,v] of Object.entries(data)){if(["at","by","addedAt","joinedAt","lastSeen","c"].includes(k))continue;if(keysOnly){out.push(k.split(".")[0]);continue}if(v&&typeof v==="object"&&!Array.isArray(v)&&(v._methodName||v.constructor&&/FieldValue|Sentinel/.test(v.constructor.name)))continue;
    let s=Array.isArray(v)?v.join(", "):typeof v==="object"?JSON.stringify(v):String(v);if(s.length>60)s=s.slice(0,57)+"…";out.push(k+": "+s)}
  return out.join(" · ").slice(0,280);
}
export function auditWrap(fs){
  const F=Object.assign({},fs);
  const log=(op,ref,data)=>{try{const path=String(ref&&ref.path||"");const [col,id]=path.split("/");if(!AUDIT_COLS.includes(col)||!ME||!ME.email)return;
    if(col==="members"&&id===ME.uid)return; /* own profile, last seen */
    if(col==="requests"&&id===lc(ME.email))return;
    fs.addDoc(fs.collection(FB.db,"audit"),{by:lc(ME.email),at:fs.serverTimestamp(),op,col,id:String(id||"").slice(0,120),sum:auditSum(col,data,op)}).catch(()=>{})}catch(_){}};
  /* «Ansicht als …» (simulation): nothing is written – not only forms, also buttons, switches and selections */
  const sim=()=>{if(typeof SIMUSER!=="undefined"&&SIMUSER){throw Object.assign(new Error(L("Nur Ansicht – in der Simulation wird nichts gespeichert.")),{code:"simulation"})}};
  F.setDoc=async(ref,data,o)=>{sim();const r=await fs.setDoc(ref,data,o);log("set",ref,data);savedPop();return r};
  F.updateDoc=async(ref,data)=>{sim();const r=await fs.updateDoc(ref,data);log("update",ref,data);savedPop();return r};
  F.deleteDoc=async(ref)=>{sim();const r=await fs.deleteDoc(ref);log("delete",ref,null);savedPop();return r};
  F.writeBatch=db=>{sim();return fs.writeBatch(db)};
  F.addDoc=async(col,data)=>{sim();const r=await fs.addDoc(col,data);if(col&&col.path!=="audit"){log("add",{path:col.path+"/"+(r&&r.id||"")},data);savedPop()}return r};
  return F;
}
const AUD={list:null,busy:false,q:"",at:0};
async function auditLoad(){AUD.busy=true;try{const {F,db}=await fb();let q;
    try{q=await F.getDocs(F.query(F.collection(db,"audit"),F.orderBy("at","desc"),F.limit(300)))}catch(_){q=await F.getDocs(F.collection(db,"audit"))}
    AUD.list=q.docs.map(d=>Object.assign({id_:d.id},d.data())).map(x=>Object.assign(x,{ms:x.at&&x.at.toMillis?x.at.toMillis():(x.at&&x.at.seconds?x.at.seconds*1000:Date.parse(x.at)||0)})).sort((a,b)=>b.ms-a.ms).slice(0,300);AUD.err=""}
  catch(err){AUD.list=[];AUD.err=(err&&err.code)||String(err)}AUD.busy=false;AUD.at=Date.now();render()}
const AUDLBL={app:"App-Fehler",roles:"Rolle",userroles:"Rolle zugewiesen",admins:"Admin",owners:"Owner",invites:"Einladung",members:"Profil",menus:"Menü",config:"Einstellungen",broadcasts:"Push-Nachricht",starts:"Startpasswort",requests:"Zugangsanfrage",sceneack:"Szene"};
const AUDOP={error:"gemeldet",set:"gespeichert",update:"geändert",delete:"gelöscht",add:"erstellt"};
function auditSecInner(){
  if(!AUD.list&&!AUD.busy)auditLoad();
  if(!AUD.list)return '<div class="empty">'+L("Lade Protokoll …")+'</div>';
  const nameOf=e=>{const cp=typeof crewPerson==="function"?crewPerson(e):null;const m=(ADM.mem||[]).find(x=>x.email===e);return (cp&&cp.name)||(m&&[m.firstName,m.lastName].filter(Boolean).join(" "))||e};
  const memName=uid=>{const m=(ADM.mem||[]).find(x=>x.uid===uid);return m?nameOf(m.email):uid};
  const q=fold(AUD.q);
  const rows=AUD.list.map(x=>{const tgt=x.col==="members"?memName(x.id):x.col==="roles"?(((ADM.roles||[]).find(r=>r.id===x.id)||{}).name||x.id):x.col==="menus"?dmy(x.id):x.col==="config"?"":x.col==="broadcasts"?"":/@/.test(x.id)?nameOf(x.id):x.id;
    return Object.assign({},x,{who:nameOf(x.by),tgt,what:L(AUDLBL[x.col]||x.col)+" "+L(AUDOP[x.op]||x.op)})}).filter(x=>!q||fold([x.who,x.tgt,x.what,x.sum].join(" ")).includes(q));
  return '<div class="admins audit"><h3>'+L("Log")+' <small>'+AUD.list.length+'</small></h3><p class="ahint">'+L("Wer hat wann Rollen, Benutzende, Menüs, Einstellungen oder Push-Nachrichten geändert – die letzten 300 Einträge.")+'</p>'+
    startStatsHTML()+
    (AUD.err?'<p class="amsg">'+esc(L("Protokoll nicht lesbar – bitte die neuen Firestore-Regeln veröffentlichen."))+' ('+esc(AUD.err)+')</p>':'')+
    '<div class="audbar"><input type="search" data-audq placeholder="'+esc(L("Suchen: Person, Rolle, Menü …"))+'" value="'+esc(AUD.q)+'"><button type="button" class="cico" data-audre '+ariaTip(L("Neu laden"))+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></button></div>'+
    (rows.length?audDays(rows,x=>'<li><div class="audh"><b>'+esc(x.what)+'</b>'+(x.tgt?' <span class="audt">'+esc(x.tgt)+'</span>':'')+'<span class="audw">'+esc(x.ms?fmtDT(x.ms):"")+'</span></div><div class="audb">'+esc(x.who)+(x.sum?' · <span class="ghint">'+esc(x.sum)+'</span>':'')+'</div></li>'):'<p class="ghint">'+L("Noch keine Einträge.")+'</p>')+'</div>';
}
/* «Startzeit»: how long the app takes to start on the crew's devices (last 14 days, the median per kind of device) – from the devices' «last seen» */
function startStatsHTML(){try{const per={ios:[],android:[],desktop:[]},all=[],lim=Date.now()-14*864e5;
  for(const m of (typeof ADM!=="undefined"&&ADM.mem)||[])for(const v of Object.values(m.devs||{})){const [k,at,ms]=String(v).split("|");if(!ms||+at<lim||!(+ms>0&&+ms<120e3))continue;const d=String(k).split("-")[1]||"desktop";(per[d]||per.desktop).push(+ms);all.push(+ms)}
  if(!all.length)return "";const med=a=>{const b=a.slice().sort((x,y)=>x-y);return b[Math.floor(b.length/2)]},s=x=>(x/1000).toFixed(1).replace(".",",")+" s";
  return '<p class="ahint audstart"><b>'+esc(L("Startzeit"))+'</b> ('+all.length+' '+esc(L("Geräte"))+', '+esc(L("letzte 14 Tage"))+'): '+esc(L("Mittel"))+' '+s(med(all))+
    [["ios","iPhone/iPad"],["android","Android"],["desktop",L("Computer")]].filter(([k])=>per[k].length).map(([k,t])=>' · '+esc(t)+' '+s(med(per[k]))).join("")+' · '+esc(L("langsamstes"))+' '+s(Math.max(...all))+'</p>'}catch(_){return ""}}
/* the log by day: one closed sub-part per day (open while searching) */
function audDays(rows,li){const g=new Map();for(const x of rows){const k=x.ms?localISO(x.ms):"–";if(!g.has(k))g.set(k,[]);g.get(k).push(x)}
  return [...g].map(([k,l])=>'<details class="tstsu" data-su="aud:'+esc(k)+'"'+(AUD.q?' open':logSu("aud:"+k))+'><summary>'+esc(k==="–"?"–":dmy(k))+' · '+l.length+' '+esc(L(l.length===1?"Eintrag":"Einträge"))+'</summary><ul class="audlist">'+l.map(li).join("")+'</ul></details>').join("")}
document.addEventListener("input",e=>{const i=e.target.closest("[data-audq]");if(!i)return;AUD.q=i.value;clearTimeout(AUD.t);AUD.t=setTimeout(()=>{const v=document.querySelector("#view");const pos=i.selectionStart;render();const n=document.querySelector("[data-audq]");if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}},250)});
document.addEventListener("click",e=>{if(e.target.closest("[data-audre]")){AUD.list=null;render()}});
/* the change log to open (closed by default; stays open while you work on the page) */
export function auditSec(){const h=auditSecInner();if(!AUD.list)return h;const nw=AUD.list[0]&&AUD.list[0].ms;
  return '<details class="tstsec audd"'+(AUD.open||AUD.q?' open':'')+' data-lsec="aud"><summary class="lsum">'+logHead(esc(L("Log")),'<span class="tsth">'+AUD.list.length+' '+esc(L("Einträge"))+'</span>',nw?esc(logWhen(nw)):"")+'</summary>'+h+'</details>'}
/* time in the title line of every box (like «Automatische Tests») */
export const logWhen=fmtDT;   /* time in the title line of every box */
window.logWhen=logWhen;
/* sub-parts (data-su) are open only while you stay on the page: every new visit of Log/Tests starts with everything closed */
export const logSu=k=>TST.su[k]?' open':'';window.logSu=logSu;
function logReset(){TST.su={};TST.open=false;AUD.open=false;if(typeof RTS!=="undefined")RTS.open=false;if(typeof DCK!=="undefined")DCK.open=false;if(window.scLogReset)scLogReset()}
{let last="";onRender(()=>{if((typeof RTS!=="undefined"&&RTS.busy)||(typeof DCK!=="undefined"&&DCK.busy))return;   /* the tests switch pages for a moment: not a new visit */
  const now=S.tab==="admin"&&(ADM.sub==="log"||ADM.sub==="test")?ADM.sub:"";if(now&&now!==last){logReset();setTimeout(()=>logAutoRun(now),250)}last=now})}
/* every tap on Log/Tests starts the permission and document tests again; the automatic tests on GitHub start when their
   box is opened; the progress is shown in the open/close button */
async function logAutoRun(sub){
  if(sub==="log"&&isAdmin()&&!SIMROLE&&typeof roleTestRun==="function")await roleTestRun(true);
  if(typeof dckMay==="function"&&dckMay()&&typeof dckRun==="function")await dckRun(true);
  if(sub==="log"&&isAdmin())await ghPoll()}   /* progress of a GitHub run that is going */
/* the automatic tests on GitHub never start by themselves (not on reload, «Log» or opening the box) – only with their start button */
/* progress of the GitHub run (public repository, no data): only runs started with the start button (workflow_dispatch) –
   the checks of a new app version (after every update) are not shown as «Tests laufen» */
const GH={run:null,jobs:[],t:null,at:0};
async function ghPoll(){clearTimeout(GH.t);try{
    const r=await fetch("https://api.github.com/repos/furtschellas/Tschugger/actions/workflows/pages.yml/runs?per_page=1&event=workflow_dispatch",{cache:"no-store"});if(!r.ok)return;
    const j=await r.json();GH.run=(j.workflow_runs||[])[0]||null;GH.jobs=[];
    if(GH.run&&GH.run.status!=="completed"){const q=await fetch(GH.run.jobs_url,{cache:"no-store"});if(q.ok)GH.jobs=(await q.json()).jobs||[]}
    GH.at=Date.now();const was=TST.running;TST.running=!!GH.run&&GH.run.status!=="completed";
    if(was&&!TST.running){TST.d=null;TST.run=false}
    if(S.tab==="admin"&&ADM.sub==="log")render();
    if(TST.running&&S.tab==="admin"&&ADM.sub==="log")GH.t=setTimeout(ghPoll,45000)}catch(_){}}
function ghProgress(){const r=GH.run;if(!r||r.status==="completed")return null;
  const st=GH.jobs.flatMap(j=>(j.steps||[]).map(x=>Object.assign({job:j.name},x))),tot=st.length||1,done=st.filter(x=>x.status==="completed").length,cur=st.find(x=>x.status==="in_progress");
  return {pct:r.status==="queued"?2:Math.max(4,Math.round(done/tot*100)),label:r.status==="queued"?L("wartet auf GitHub …"):(cur?cur.name:L("läuft …"))}}

/* title line of every box: title, then the last result (on the phone on a line of its own), the open/close button top right */
export const logHead=(t,st,tm,pg)=>'<span class="lsh"><b>'+t+'</b>'+(st?'<span class="lss">'+st+'</span>':'')+(tm?'<span class="lst">'+tm+'</span>':'')+'</span>'+tstAllBtn(pg);window.logHead=logHead;
/* a tap on «Log» (also when already there) shows every box closed again */
document.addEventListener("click",e=>{const b=e.target.closest('[data-asub="log"],[data-asub="test"]');if(b&&S.tab==="admin"&&ADM.sub===b.dataset.asub){logReset();setTimeout(()=>logAutoRun(b.dataset.asub),250)}},true);
document.addEventListener("toggle",e=>{if(e.target&&e.target.classList&&e.target.classList.contains("audd"))AUD.open=e.target.open},true);

{const HI={"Today":"आज","Planung":"Schedule","Callsheet":"कॉलशीट","Locations":"लोकेशन","Crew":"क्रू","Suchen":"खोजें","Szene, Ort, Person, Cast …":"सीन, जगह, व्यक्ति, Cast …","Daten werden geladen …":"डेटा लोड हो रहा है …","Regie":"निर्देशन","Kompars.":"एक्स्ट्रा","Ort: TBA":"लोकेशन: TBA","Motive":"सेट","Reise":"यात्रा","Frei":"छुट्टी","Reisetag":"यात्रा दिवस","Drehfrei":"छुट्टी का दिन","Callsheet folgt":"Callsheet जल्द आएगी","Dreh":"शूट","Länge":"अवधि","Sonne":"सूर्य","Kompars:innen":"एक्स्ट्रा","Crew suchen":"Crew खोजें","Niemand gefunden für":"कोई नहीं मिला:","Kopieren":"कॉपी करें","Kopiert":"कॉपी हो गया","Szenenbeschrieb":"सीन विवरण","Adresse":"पता","Diese Szene ist im Drehbuch nicht gefunden worden.":"यह सीन Script में नहीं मिला।","Drehbuch konnte nicht geladen werden.":"Script लोड नहीं हो सकी।","Kontakt ins Telefon übernehmen":"फ़ोन में संपर्क जोड़ें","Adressen im Dorf":"गाँव में पते","Keine Locations für diese Unit.":"इस यूनिट के लिए कोई Locations नहीं।","Keine 2nd Unit an diesem Tag.":"इस दिन कोई 2nd Unit नहीं।","Keine 3rd Unit an diesem Tag.":"इस दिन कोई 3rd Unit नहीं।","Bitte mindestens eine Unit wählen.":"कृपया कम से कम एक यूनिट चुनें।","Alle Szenen auf- oder zuklappen":"सभी सीन खोलें या बंद करें","Das Callsheet erscheint hier automatisch, sobald es im Dropbox-Ordner 06_Callsheets liegt, meist am Vorabend.":"Callsheet Dropbox फ़ोल्डर 06_Callsheets में आते ही यहाँ अपने आप दिखेगी, आमतौर पर एक शाम पहले।","Laut Planung: Drehzeit":"Schedule के अनुसार: शूटिंग","Planung ansehen":"Schedule देखें","Drehbeginn":"पहला शॉट","Wetter":"मौसम","Parken":"पार्किंग","Treffpunkt & Orte":"मिलने की जगह और लोकेशन","Base / Treffpunkt":"Base / मिलने की जगह","Drehort":"लोकेशन","Darsteller:in":"कलाकार","Maske":"मेकअप","Kostüm":"कॉस्ट्यूम","Notfall & Kontakte":"आपातकाल और संपर्क","Nächstes Spital":"नज़दीकी अस्पताल","Spital":"अस्पताल","ist noch leer. Die Daten kommen automatisch aus der Dropbox der Produktion.":"अभी खाली है। डेटा प्रोडक्शन की Dropbox से अपने आप आता है।","Lade":"लोड हो रहा है","geprüft":"जाँचा गया","Noch keine Daten eingespielt.":"अभी कोई डेटा नहीं।","Suche nach Szenennummer (z. B. 186), Drehtag (D5, Day 5, 26.10., Montag, heute, morgen), Motiv, Adresse, Rolle (z. B. Regina), Crew-Name, Funktion oder Telefonnummer.":"सीन नंबर (जैसे 186), शूटिंग दिवस (D5, Day 5, 26.10., सोमवार, आज, कल), सेट, पता, भूमिका (जैसे Regina), Crew नाम, काम या फ़ोन नंबर से खोजें।","Drehtage":"शूटिंग दिवस","Mehrere Adressen":"कई पते","Nichts gefunden für":"कुछ नहीं मिला:","Neueste Daten geladen.":"नवीनतम डेटा लोड हुआ।","Dropbox zuletzt geprüft":"Dropbox पिछली बार जाँची गई","Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen.":"डेटा लोड नहीं हो सका। कृपया इंटरनेट कनेक्शन जाँचें।","Pause":"रोकें","Dunkler Modus":"डार्क मोड","Heller Modus":"लाइट मोड","Vorherige Szene lesen":"पिछला सीन पढ़ें","Folgende Szene lesen":"अगला सीन पढ़ें","Vorherige Szene":"पिछला सीन","Folgende Szene":"अगला सीन","Quellen":"स्रोत","Dropbox der Produktion, nur gelesen.":"प्रोडक्शन की Dropbox, केवल पढ़ने के लिए।","Zuletzt geprüft":"पिछली जाँच","Karte der Drehorte":"शूटिंग लोकेशनों का नक्शा","Infobox":"Info बॉक्स","Drehbuch hell / dunkel":"Script लाइट / डार्क","Drehzeit":"शूटिंग समय","Tag":"दिन","Szene, Motiv, Rolle, Text …":"सीन, सेट, भूमिका, टेक्स्ट …","nicht geplant":"निर्धारित नहीं","Weitere Szenen anzeigen":"और सीन दिखाएँ","Location, Adresse, Szene …":"लोकेशन, पता, सीन …","Drehtag":"शूटिंग दिवस","Treffer im Drehplan (Motiv, Cast oder Beschreibung)":"Schedule में मिलान (सेट, Cast या विवरण)","Position":"पद","Die Wochenplanung für Vorbereitung und Proben folgt, sobald sie in der Dropbox der Produktion verfügbar ist.":"तैयारी और रिहर्सल की साप्ताहिक योजना प्रोडक्शन की Dropbox में उपलब्ध होते ही आएगी।","Parallel":"समानांतर","Transport":"परिवहन","Kontakte":"संपर्क","Quelle":"स्रोत","Verteiler":"वितरण सूची","In den Kalender":"कैलेंडर में जोड़ें","Keine Adressen gefunden.":"कोई पता नहीं मिला।","Nicht in Crewliste oder bei den Benutzer:innen":"Crew सूची या यूज़र्स में नहीं","Mail an alle":"सभी को मेल","Adressen kopieren":"पते कॉपी करें","In der Crewliste, aber ohne E-Mail":"Crew सूची में, पर ईमेल नहीं","Teilnehmende":"प्रतिभागी","Teilnehmende ein-/ausblenden":"प्रतिभागी दिखाएँ/छिपाएँ","Prep-Wochenplanung":"Prep साप्ताहिक Schedule","ab":"से","Meine Termine":"मेरे अपॉइंटमेंट","Termine für":"अपॉइंटमेंट:","Bitte oben deinen Namen wählen.":"कृपया ऊपर अपना नाम चुनें।","Keine kommenden Termine gefunden.":"कोई आगामी अपॉइंटमेंट नहीं मिला।","Alle in den Kalender":"सभी कैलेंडर में जोड़ें","Dein Name wurde in der Crewliste nicht gefunden.":"आपका नाम Crew सूची में नहीं मिला।","Diese Ansicht konnte nicht angezeigt werden.":"यह दृश्य नहीं दिखाया जा सका।","Film wird geladen …":"फ़िल्म लोड हो रही है …","Film konnte nicht geladen werden.":"फ़िल्म लोड नहीं हो सकी।","Klein":"छोटा","Mittel":"मध्यम","Liste":"सूची","Fotos":"फ़ोटो","Videos":"वीडियो","Video in Dropbox abspielen":"Dropbox में वीडियो चलाएँ","Original in Dropbox":"Dropbox में मूल","Alle Bilder":"सभी तस्वीरें","aus dem App-Profil":"ऐप प्रोफ़ाइल से","spricht im Drehbuch":"Script में बोलता/बोलती है","erwähnt im Drehbuch":"Script में उल्लेख","spricht im Drehbuch, fehlt im Drehplan":"Script में बोलता/बोलती है, Schedule में नहीं","nur erwähnt, nicht im Drehplan":"केवल उल्लेख, Schedule में नहीं","Motiv":"Location","Text":"टेक्स्ट","Rolle eingeben, z. B. Regina oder 8. Leer lassen für die Liste aller Rollen.":"भूमिका दर्ज करें, जैसे Regina या 8। सभी भूमिकाओं की सूची के लिए खाली छोड़ें।","Szenennummer eingeben, z. B. 186 oder 4A.":"सीन नंबर दर्ज करें, जैसे 186 या 4A।","Drehtag eingeben: D5, 26.10., Montag, heute oder morgen.":"दिन दर्ज करें: D5, 26.10., सोमवार, आज या कल।","Name, Funktion oder Telefonnummer eingeben.":"नाम, काम या फ़ोन नंबर दर्ज करें।","Motiv oder Adresse eingeben, z. B. Kapelle oder Ortsname.":"Location या पता दर्ज करें, जैसे चैपल या गाँव।","Wörter aus Szenenbeschrieb, Notizen oder Infos eingeben.":"सीन विवरण, नोट्स या Info के शब्द दर्ज करें।","Name der Schauspielerin oder des Schauspielers eingeben (aus den Callsheets).":"अभिनेता का नाम दर्ज करें (Callsheets से)।","Wörter aus dem Drehbuchtext eingeben.":"Script के टेक्स्ट से शब्द दर्ज करें।","Keine Rollen in der Besetzungsliste.":"Cast सूची में कोई भूमिका नहीं।","Geplante Szenen, in denen die Rolle laut Drehbuch spricht, aber nicht im Drehplan steht – oder im Drehplan steht, im Drehbuch aber nicht vorkommt.":"नियोजित सीन जिनमें भूमिका Script में बोलती है पर Schedule में नहीं है – या Schedule में है पर Script में नहीं आती।","im Drehbuch":"Script में","im Drehplan":"Schedule में","Drehplan und Drehbuch":"Schedule और Script","nur im Drehbuch":"केवल Script में","Ich":"मैं","Name tippen …":"नाम टाइप करें …","Zum Startbildschirm hinzufügen?":"होम स्क्रीन पर जोड़ें?","Dann öffnest du die Crew-App wie eine normale App, ohne Link.":"फिर आप Crew ऐप को सामान्य ऐप की तरह खोलेंगे, लिंक की ज़रूरत नहीं।","Ja, hinzufügen":"हाँ, जोड़ें","Später":"बाद में","Ist schon drauf":"पहले से है","So geht's auf dem iPhone:":"iPhone पर:","1. Unten auf Teilen tippen":"1. नीचे Share पर टैप करें","2. «Zum Home-Bildschirm» wählen":"2. “Add to Home Screen” चुनें","3. Oben rechts «Hinzufügen» tippen":"3. ऊपर दाईं ओर “Add” टैप करें","1. Browser-Menü ⋮ öffnen":"1. ब्राउज़र मेनू ⋮ खोलें","2. «Zum Startbildschirm hinzufügen» oder «App installieren» wählen":"2. “होम स्क्रीन पर जोड़ें” या “ऐप इंस्टॉल करें” चुनें","Danach die App vom Startbildschirm öffnen und dort einmal anmelden.":"फिर होम स्क्रीन से ऐप खोलें और वहाँ एक बार साइन इन करें।","Darstellung":"रूप-रंग","Dunkel":"डार्क","Hell":"लाइट","Nach oben":"ऊपर ले जाएँ","Nach unten":"नीचे ले जाएँ","Reihenfolge mit ▲ ▼ ändern.":"▲ ▼ से क्रम बदलें।","Schedule":"शेड्यूल","Script":"स्क्रिप्ट","Info":"जानकारी","Catering":"कैटरिंग","PREP":"तैयारी","1st / 2nd Unit":"1st / 2nd Unit","Production":"प्रोडक्शन","Accounting":"लेखा","Writers":"लेखक","Casting CH":"कास्टिंग CH","Directing / AD":"निर्देशन / AD","Locations / Unit management":"लोकेशन / यूनिट प्रबंधन","Camera":"कैमरा","Lighting / grip":"लाइटिंग / ग्रिप","Sound":"साउंड","Art department":"आर्ट विभाग","Costume":"कॉस्ट्यूम","Make-up":"मेकअप","Stunt / SFX / VFX":"स्टंट / SFX / VFX","Post-production":"पोस्ट-प्रोडक्शन","Rentals":"किराया","Emergency":"आपातकाल","Hotel":"होटल","Base":"बेस","Food":"भोजन","Shopping":"खरीदारी","Pharmacy":"फ़ार्मेसी","Laundry":"लॉन्ड्री","ATMs & gas stations":"ATM और पेट्रोल पंप","Getting around":"आवागमन","Weekly Schedule":"साप्ताहिक शेड्यूल","Blocking & Floorplans":"Blocking और Floorplans","mit":"के साथ","WC":"शौचालय","Weitere":"अन्य","ohne Rolle":"बिना रोल","Über die App":"ऐप के बारे में","Der Cloudflare Worker hat noch den alten Code und kennt diese Funktion nicht. Neuen Code einsetzen: Cloudflare → Workers & Pages → Worker → «Edit code» → Inhalt von tools/chat_worker.js einfügen → «Deploy». Oder einmalig die automatische Übertragung einrichten (siehe .github/workflows/worker.yml).":"Cloudflare Worker में अभी पुराना कोड है और वह यह फ़ंक्शन नहीं जानता। नया कोड डालें: Cloudflare → Workers & Pages → Worker → «Edit code» → tools/chat_worker.js की सामग्री चिपकाएँ → «Deploy»। या एक बार स्वचालित ट्रांसफ़र सेट करें (देखें .github/workflows/worker.yml)।","Zum Verlassen der App nochmals zurück drücken.":"ऐप से बाहर निकलने के लिए फिर से वापस दबाएँ।"};for(const k in HI){if(!I18N[k])I18N[k]={};I18N[k].hi=HI[k]}}
/* a text field keeps the focus in Safari when a button elsewhere is tapped; then the page would not re-render
   (render() protects forms someone is typing in) – so leave the field as soon as something outside its form is used */
document.addEventListener("click",e=>{const ae=document.activeElement;if(ae&&/^(INPUT|TEXTAREA)$/.test(ae.tagName)&&ae.form&&!ae.form.contains(e.target)&&e.target.closest("button,[role=tab],a,summary,label"))try{ae.blur()}catch(_){}},true);
document.addEventListener("change",e=>{if(!e.target.matches||!e.target.matches("select"))return;const ae=document.activeElement;if(ae&&ae!==e.target&&/^(INPUT|TEXTAREA)$/.test(ae.tagName)&&ae.form&&!ae.form.contains(e.target))try{ae.blur()}catch(_){}},true);
/* main topics (bottom bar): English names in every language except Hindi */
function hiTabs(){document.querySelectorAll("nav.tabs button[data-tab] .lbl").forEach(l=>{if(!l.dataset.orig)l.dataset.orig=l.textContent.trim();const o=l.dataset.orig;if(!l.dataset.so&&l.dataset.s)l.dataset.so=l.dataset.s;const hi=LANG==="hi"&&I18N[o]&&I18N[o].hi;l.textContent=hi?I18N[o].hi:o;if(l.dataset.so)l.dataset.s=hi?I18N[o].hi:l.dataset.so})}
onRendered(()=>{try{hiTabs()}catch(_){}try{chatFab()}catch(_){}try{bcButton()}catch(_){}});
/* every button that shows only a symbol gets a tooltip with its function (from its label for screen readers); the observer also covers every render() */
function iconTitles(){document.querySelectorAll("button[aria-label]:not([title]),a[aria-label]:not([title])").forEach(b=>{b.title=b.getAttribute("aria-label")})}
document.addEventListener("DOMContentLoaded",()=>{try{iconTitles()}catch(_){}});new MutationObserver(()=>{try{iconTitles()}catch(_){}}).observe(document.documentElement,{childList:true,subtree:true});

/* results of the automatic tests (GitHub, before every release of new code): App-Verwaltung → Log, collapsible */
const TST={d:null,busy:false,run:false,msg:"",open:false,closed:false,su:{}}; /* parts stay closed until opened (only for this visit) */
export const TST_RUN='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 10.5A7.6 7.6 0 0 0 6 7.2L4.5 8.8"/><path d="M4.5 4.5v4.3h4.3"/><path d="M4.5 13.5A7.6 7.6 0 0 0 18 16.8l1.5-1.6"/><path d="M19.5 19.5v-4.3h-4.3"/></svg>';   /* restart: two arrows in a circle, centred */
const TST_ALL='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>';
async function testsLoad(){if(TST.busy)return;TST.busy=true;try{const r=await fetch("./tests.json?t="+Date.now(),{cache:"no-store"});TST.d=r.ok?await r.json():{none:true}}catch(_){TST.d={none:true}}TST.busy=false;render()}
/* buttons in Log/Tests: only the symbol (the text is the tooltip and for screen readers) */
const TST_LOAD='<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>';
export const tstIco=(attr,ic,t,dis,pg)=>{const p=pg&&pg.pct!=null?Math.max(0,Math.min(100,pg.pct)):null;
  return '<button type="button" class="lbtn tsticon'+(pg?' prog'+(p==null?' ind':''):'')+'" '+attr+(dis?' disabled':'')+(pg&&p!=null?' style="--p:'+p+'"':'')+' '+ariaTip(L(t))+'>'+ic+'</button>'};window.tstIco=tstIco;
/* open/close button at the right end of every box in Log/Tests */
/* while a test runs, the button shows the progress as a ring around it (pct = percent, null = running, unknown how far) */
function tstAllBtn(pg){const p=pg&&pg.pct!=null?Math.max(0,Math.min(100,pg.pct)):null;
  return '<button type="button" class="lbtn tstall'+(pg?' prog'+(p==null?' ind':''):'')+'"'+(pg&&p!=null?' style="--p:'+p+'"':'')+' data-tstall aria-label="'+esc(L("Alles auf- oder zuklappen"))+(pg?' · '+esc(L("läuft"))+(p!=null?' '+p+' %':''):'')+'" title="'+esc(L("Alles auf- oder zuklappen"))+'">'+TST_ALL+'</button>'}
/* the checks of one test part, tidied up: by theme (group from the test run, else the word before «:»), and the same
   check for several permission levels (crew, catering …) as ONE line with a mark per level */
const TST_ROLE=/^(owner|admin|crew|catering|power|norole): (.+)$/,TST_RN={owner:"Owner",admin:"Admin",crew:"Crew",catering:"Catering",power:"Power",norole:"ohne Rolle"};
const TST_THEMES=[["Sicherheit",/sicherheit|xss|firestore|regel|schlüssel|verschlüssel|gefährlich|e-mail-adressen der crew|klartext/i],["Quittierung",/quittier|szenen-protokoll|google-sheet|sheet|export/i],
  ["Reports",/report/i],["Coverday",/coverday/i],["Callsheet",/callsheet|drehfolge|locations?\b|karte|base|parking|dit/i],["Drehplan",/drehplan|schedule|szene|prep|drehtag|unit/i],
  ["Crewliste",/crew|kontakt|telefon|geburtstag|vcf|essen|catering/i],["Termine",/termin|push|kalender|fahrt|erinner/i],["Access",/rolle|recht|access|benutzer|einlad|anmeld|login|passwort|owner|admin|zugang/i],
  ["App",/einstellung|sprache|tour|übersetz|offline|today|navigation|app|handy|desktop|ansicht|seite|klassen/i]];
function tstTheme(n){for(const [t,re] of TST_THEMES)if(re.test(n))return t;return L("Weitere")}
function tstGroupsHTML(suite,cs){
  const rows=[],byTxt=new Map();
  for(const c of cs){const m=c.n.match(TST_ROLE);
    if(m){let r=byTxt.get(m[2]);if(!r){r={n:m[2],ok:true,roles:[],e:"",g:c.g||""};byTxt.set(m[2],r);rows.push(r)}r.roles.push([m[1],c.ok]);if(!c.ok){r.ok=false;if(c.e&&!r.e)r.e=c.e}}
    else rows.push({n:c.n,ok:c.ok,e:c.e||"",g:c.g||"",w:!!c.w})}
  /* themes like the permissions (Drehplan, Callsheet, Quittierung …): one box per theme, failing ones first and open */
  for(const r of rows){r.k=r.g||tstTheme(r.n)}
  const groups=new Map();for(const r of rows){const k=r.k||L("Weitere");if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
  const li=r=>'<li class="'+(r.w?'twarn':r.ok?'ok':'no')+'">'+(r.w?'⚠':r.ok?'✓':'✗')+' '+esc(r.g||!r.k?r.n:r.n.slice(r.k.length+2))+
    (r.roles?' <span class="tstroles">'+r.roles.map(([k,o])=>'<span class="'+(o?'ok':'no')+'">'+esc(L(TST_RN[k]||k))+' '+(o?'✓':'✗')+'</span>').join("")+'</span>':'')+(r.e?'<br><small>'+esc(r.e)+'</small>':'')+'</li>';
  if(groups.size<2)return '<ul class="tstl">'+rows.sort((a,b)=>a.ok-b.ok).map(li).join("")+'</ul>';
  const ord=k=>{const i=TST_THEMES.findIndex(x=>x[0]===k);return i<0?99:i};
  return [...groups].sort((a,b)=>a[1].every(r=>r.ok)-b[1].every(r=>r.ok)||ord(a[0])-ord(b[0])).map(([k,l])=>{const bad=l.filter(r=>!r.ok).length,key="tg:"+suite+":"+k;
    return '<details class="tstsu tstgrp'+(bad?' bad':'')+'" data-su="'+esc(key)+'"'+(bad?' open':logSu(key))+'><summary>'+(bad?'✗ ':'✓ ')+esc(L(k))+' · '+(bad?(l.length-bad)+'/'+l.length:l.length)+'</summary><ul class="tstl">'+l.sort((a,b)=>a.ok-b.ok).map(li).join("")+'</ul></details>'}).join("")}
export function testsSec(){
  if(!TST.d){testsLoad();return '<details class="tstsec"><summary class="lsum">'+logHead(esc(L("Automatische Tests")),esc(L("Lade …")))+'</summary></details>'}
  const d=TST.d;if(d.none)return '<details class="tstsec"><summary class="lsum">'+logHead(esc(L("Automatische Tests")),esc(L("noch keine Resultate")))+'</summary></details>';
  const when=fmtDT(d.at||0);
  const suites=Array.isArray(d.suites)&&d.suites.length?d.suites:[{name:"",ok:d.ok,n:d.n,fail:d.fail,checks:d.checks||[]}];
  const head=d.crash?'✗ '+L("Tests abgebrochen"):d.ok?'✓ '+L("{n} von {n} bestanden").split("{n}").join(d.n):'✗ '+L("{f} von {n} fehlgeschlagen").replace("{f}",d.fail).replace("{n}",d.n);
  return '<details class="tstsec'+(d.ok?'':' bad')+'"'+(TST.open?' open':'')+' data-lsec="tst"><summary class="lsum">'+logHead(esc(L("Automatische Tests")),(()=>{const g=ghProgress();return g?'<span class="tsth">'+esc(L("Tests laufen"))+' · '+esc(g.label)+' · '+g.pct+' %</span>':'<span class="tsth">'+esc(head)+'</span>'})(),esc(when)+(d.sha&&typeof isAdmin==="function"&&isAdmin()?' · <a href="https://github.com/furtschellas/Tschugger/commit/'+esc(d.sha)+'" target="_blank" rel="noopener noreferrer">'+esc(d.sha)+'</a>':''),ghProgress())+'</summary>'+
    '<p class="ghint">'+esc(L("Vor jeder Veröffentlichung von neuem Code prüft GitHub die Hintergrund-Abläufe, die App mit sechs Rollen auf Handy und Desktop, die Funktionen und die Firestore-Regeln. Schlägt ein Test fehl, wird nicht veröffentlicht."))+'</p>'+
    suites.map(su=>{const cs=(su.checks||[]).slice().sort((a,b)=>a.ok-b.ok);
      return (su.name?'<details class="tstsu'+(su.ok?'':' bad')+'" data-su="'+esc(su.name)+'"'+(TST.su[su.name]?' open':'')+'><summary>'+(su.ok?'✓ ':'✗ ')+esc(L(su.name))+' · '+(su.crash?esc(L("abgebrochen")):su.ok?su.n:(su.n-su.fail)+'/'+su.n)+'</summary>':'')+
        tstGroupsHTML(su.name,cs)+(su.name?'</details>':'')}).join("")+
    '<div class="arb tstbtns">'+(window.CHATURL&&isAdmin()?tstIco("data-tstrun",TST_RUN,TST.run||ghProgress()?"Tests laufen …":"Tests jetzt starten",TST.run,(()=>{const g=ghProgress();return g?{pct:g.pct}:TST.run?{pct:null}:null})()):'')+tstIco("data-tstre",TST_LOAD,"Resultate neu laden")+'</div>'+(TST.msg?'<p class="ghint">'+esc(TST.msg)+'</p>':'')+'</details>';
}
document.addEventListener("click",e=>{if(e.target.closest("[data-tstre]")){TST.d=null;render()}});

/* open/close everything in the test box; start the tests by hand (through the worker: GitHub «Website veröffentlichen» with all tests) */
document.addEventListener("click",e=>{const a=e.target.closest("[data-tstall]");if(!a)return;e.preventDefault();e.stopPropagation();const box=a.closest(".tstsec,.dckflat");if(!box)return;
  if(box.tagName!=="DETAILS"){const ds=[...box.querySelectorAll("details")],op=!ds.every(d=>d.open);ds.forEach(d=>{d.open=op;if(d.dataset.su)TST.su[d.dataset.su]=op});return}   /* own tab «Test»: the areas themselves */
  /* 1st press: open the box (parts closed) · 2nd: open all its parts · 3rd: close everything */
  const parts=[...box.querySelectorAll("details")];let open;
  if(!box.open){open=true;box.open=true}
  else if(parts.length&&parts.some(d=>!d.open)){open=true;parts.forEach(d=>{d.open=true;if(d.dataset.su)TST.su[d.dataset.su]=true})}
  else{open=false;box.open=false;parts.forEach(d=>{d.open=false;if(d.dataset.su)TST.su[d.dataset.su]=false})}
  const k=box.dataset.lsec;if(k==="tst")TST.open=open;else if(k==="aud")AUD.open=open;else if(k==="rt"&&typeof RTS!=="undefined")RTS.open=open;else if(k==="dck"&&typeof DCK!=="undefined")DCK.open=open},true);
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.lsec==="tst")TST.open=d.open},true);
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.su)TST.su[d.dataset.su]=d.open},true);
document.addEventListener("click",e=>{if(e.target.closest("[data-tstrun]"))tstStart(false)});
async function tstStart(auto){if(!isAdmin()||TST.run||!window.CHATURL)return;TST.run=true;TST.msg="";render();
  try{const {auth}=await fb();const tok=await auth.currentUser.getIdToken();const r=await fetch(window.CHATURL.replace(/\/+$/,"")+"/tests",{method:"POST",headers:{Authorization:"Bearer "+tok}});const j=await r.json().catch(()=>({}));
    TST.msg=r.ok?L("Tests gestartet – das Ergebnis erscheint hier in etwa 10–15 Minuten."):r.status===404?L("Der Cloudflare Worker hat noch den alten Code und kennt diese Funktion nicht. Neuen Code einsetzen: Cloudflare → Workers & Pages → Worker → «Edit code» → Inhalt von tools/chat_worker.js einfügen → «Deploy». Oder einmalig die automatische Übertragung einrichten (siehe .github/workflows/worker.yml)."):(j.error||("HTTP "+r.status));
    if(r.ok){const t0=Date.now(),before=TST.d&&TST.d.at;const poll=async()=>{if(Date.now()-t0>25*60e3){TST.run=false;render();return}TST.d=null;await testsLoad();if(TST.d&&TST.d.at&&TST.d.at!==before){TST.run=false;TST.msg="";render();return}setTimeout(poll,60e3)};setTimeout(poll,90e3)}else TST.run=false}
  catch(err){TST.run=false;TST.msg=L("Fehler:")+" "+(err.message||err)}if(auto&&TST.msg&&!/gestartet/.test(TST.msg))TST.msg="";setTimeout(ghPoll,4000);render()}


/* ---------- errors on a device are reported to the owners (in Log, «App-Fehler»): only the message, file and line –
   never data (addresses and numbers removed); at most 5 per visit, the same message once a day per device ---------- */
/* where the error happened (no data): page and sub-page, the day shown, the role, the device, online/offline, simulation – «tab=dispo · 2026-10-24 · Rolle crew · app-ios · offline» */
window.__errCtx=()=>{try{const sub=S.tab==="admin"&&typeof ADM!=="undefined"?ADM.sub:S.tab==="acct"&&typeof ACSUB!=="undefined"?ACSUB:"";
  const day=S.tab==="dispo"&&typeof CSCUR!=="undefined"?CSCUR.date:S.tab==="plan"?S.day:"",role=typeof isOwner==="function"&&isOwner()?"owner":typeof isAdmin==="function"&&isAdmin()?"admin":(typeof MYROLE!=="undefined"&&MYROLE)||"-";
  return [S.tab+(sub?"/"+sub:""),day,"Rolle "+String(role).slice(0,20),typeof appKind==="function"?appKind():"",navigator.onLine===false?"offline":"",typeof SIMUSER!=="undefined"&&SIMUSER?"Simulation":""].filter(Boolean).join(" · ").slice(0,90)}catch(_){return ""}};
const ERRSENT=new Set();let ERRN=0;
async function errReport(){try{if(window.__ERRS&&__ERRS.length>50)__ERRS.splice(0,__ERRS.length-50);if(!ME||!window.__ERRS||!__ERRS.length||ERRN>=5)return;if(!(MEMBER||isAdmin()))return;
    const today=todayISO();let seen={};try{seen=JSON.parse(localStorage.getItem("errsent:v1")||"{}")}catch(_){}if(seen.d!==today)seen={d:today,m:[]};
    const list=__ERRS.splice(0);const {F,db}=await fb();
    for(const e of list){const m=String(e.m||"").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,"…").replace(/\+?\d[\d ]{6,}/g,"…").slice(0,200);const k=m+"|"+e.f;
      if(!m||ERRSENT.has(k)||seen.m.includes(k)||ERRN>=5)continue;ERRSENT.add(k);seen.m.push(k);ERRN++;
      await F.addDoc(F.collection(db,"audit"),{by:lc(ME.email),at:F.serverTimestamp(),op:"error",col:"app",id:String(window.APPVER||"").slice(0,40),sum:(m.slice(0,180)+(e.f?" ("+e.f+(e.l?":"+e.l:"")+")":"")+(e.c?" – "+e.c:"")).slice(0,290)})}
    try{localStorage.setItem("errsent:v1",JSON.stringify({d:today,m:seen.m.slice(-30)}))}catch(_){}}catch(_){}}
setInterval(errReport,30000);setTimeout(errReport,8000);
/* ---------- the worker in Cloudflare: admins see in Log/Tests when it runs an older version than this app expects ---------- */
const WK={v:null,at:0};
async function workerCheck(){if(!window.CHATURL||!isAdmin()||Date.now()-WK.at<10*60e3)return;WK.at=Date.now();
  try{const r=await fetch(window.CHATURL.replace(/\/+$/,"")+"/",{cache:"no-store"});const j=r.ok?await r.json():null;WK.v=j&&j.v||"?";if(S.tab==="admin")render()}catch(_){WK.v="?"}}
window.workerWarnHTML=function(){workerCheck();const want=window.WORKERVER||"";if(!want||!WK.v||WK.v===want)return "";
  return '<div class="wkwarn" role="status"><b>'+esc(L("Cloudflare Worker veraltet"))+'</b><br>'+esc(L("Er läuft mit Version {a}, die App erwartet {b}. Bitte den Code aus tools/chat_worker.js in Cloudflare einsetzen.").replace("{a}",WK.v==="?"?L("unbekannt"):WK.v).replace("{b}",want))+'</div>'};

/* «Gespeichert»: a short popup after every save the person started (a «Speichern» button or a form) – not for writes in the background */
let SAVEAT=0,SAVEPOPAT=0;
const SAVE_RE=/speichern|sichern|save|enregistr|salva|सहेज/i;
document.addEventListener("submit",()=>{SAVEAT=Date.now()},true);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button,[role=button]");if(b&&(b.type==="submit"||SAVE_RE.test(b.textContent||"")||SAVE_RE.test(b.getAttribute("aria-label")||"")))SAVEAT=Date.now()},true);
export function savedPop(force){if(!force&&Date.now()-SAVEAT>12000)return;if(Date.now()-SAVEPOPAT<1500)return;SAVEPOPAT=Date.now();SAVEAT=0;
  let p=document.getElementById("savepop");if(!p){p=document.createElement("div");p.id="savepop";p.setAttribute("role","status");p.setAttribute("aria-live","polite");document.body.appendChild(p)}
  p.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>'+esc(L("Gespeichert"))+'</span>';
  p.classList.remove("on");void p.offsetWidth;p.classList.add("on");clearTimeout(p.__t);p.__t=setTimeout(()=>p.classList.remove("on"),1800)}
window.savedPop=savedPop;
/* the existing short messages «… gespeichert.» also show the popup */
{const sm=window.showMsg;if(typeof sm==="function"){window.showMsg=function(t,ms){try{if(/gespeichert|enregistr|salvat|saved|सहेज/i.test(String(t||"")))savedPop(true)}catch(_){}return sm.apply(this,arguments)}}}
