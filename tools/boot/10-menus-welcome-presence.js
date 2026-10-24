/* ---- lunch menus: catering enters a menu per shooting day and unit (permission «Menüs eingeben»);
   the schedule shows it at «Lunch» of that day and unit ---- */
window.MENUS={};try{window.MENUS=JSON.parse(localStorage.getItem("menus")||"{}")||{}}catch(_){}
let MENUAT=0,MENUSUB=null,MENUFROM="";
/* realtime listener on the menus from yesterday on: Firebase sends only changes (no more reading all every few minutes) */
function menusApply(docs,from){const m={};docs.forEach(d=>{if(d.id>=from)m[d.id]=d.data()});
  if(JSON.stringify(m)!==JSON.stringify(window.MENUS)){window.MENUS=m;try{localStorage.setItem("menus",JSON.stringify(m))}catch(_){}render()}}
async function menusLoad(force){if(!ME)return;const from=localISO(Date.now()-864e5);
  if(MENUSUB&&MENUFROM===from)return;
  if(!force&&!MENUSUB&&Date.now()-MENUAT<600e3)return;MENUAT=Date.now();
  try{const {F,db}=await fb();
    if(typeof F.onSnapshot==="function"&&!(MENUSUB&&MENUFROM===from)){if(MENUSUB)try{MENUSUB()}catch(_){}MENUFROM=from;
      MENUSUB=F.onSnapshot(F.query(F.collection(db,"menus"),F.where(F.documentId(),">=",from)),q=>menusApply(q.docs,from),err=>{console.warn("menus",err&&err.code||err);MENUSUB=null});return}
    let q;try{q=await F.getDocs(F.query(F.collection(db,"menus"),F.where(F.documentId(),">=",from)))}catch(_){q=await F.getDocs(F.collection(db,"menus"))}
    menusApply(q.docs,from)}catch(err){console.warn("menus",err&&err.code||err)}}
/* two menu options per day and unit (u1a/u1b, u2a/u2b …; the older single field u1 counts as option 1) */
const menuOpts=(m,u)=>{if(m.tog)u="1";return [String(m["u"+u+"a"]||m["u"+u]||"").trim(),String(m["u"+u+"b"]||"").trim()].filter(Boolean)};
window.menuFor=(date,u)=>{const m=(window.MENUS||{})[date];if(!m)return "";
  const units=u==="all"?(m.tog?["1"]:["1","2","3"].filter(x=>menuOpts(m,x).length)):[u];if(!String(m.zw||"").trim()&&(!units.length||!menuOpts(m,units[0]).length&&u!=="all"))return "";
  const block=x=>{const o=menuOpts(m,x);return o.length?(u==="all"&&units.length>1?'<div class="mu">'+esc(UNAME&&UNAME[x]?UNAME[x]+" Unit":x)+'</div>':'')+o.map((t,i)=>'<div class="mtxt">'+(o.length>1?'<span class="mopt">'+esc(L("Menü"))+' '+(i+1)+'</span> ':'')+esc(t).replace(/\n/g,"<br>")+'</div>').join(""):""};
  const zw=String(m.zw||"").trim();const body=units.map(block).join("")+(zw?'<div class="mtxt mzw"><span class="mopt">'+esc(L("Zwischenverpflegung"))+'</span> '+esc(zw).replace(/\n/g,"<br>")+'</div>':"");if(!body)return "";
  return '<div class="menu"><span class="mico" aria-hidden="true">🍽</span><div><b>'+esc(L("Menü"))+'</b>'+(m.tog&&(u==="all"||u!=="1")?'<div class="mu">'+esc(L("Alle Units essen zusammen"))+'</div>':'')+body+'</div></div>'};
setInterval(()=>{if(document.visibilityState==="visible")menusLoad()},120e3);   /* reads at most every 10 min (Firebase quota) */
/* who eats on a shooting day: crew of the departments called in that day's callsheet (all active crew if there is
   no callsheet yet), plus the cast of the callsheet and the extras; split by diet */
function dayEaters(d){const c=caterData(),dp=(S.dispos||[]).find(x=>x&&x.date===d.date),fd=x=>fold(x).trim();
  let crew=c.act,src=dp?"dispo":"crew";
  if(dp&&arr(dp.calls).length){const deps=arr(dp.calls).map(z=>fd(z.dept)).filter(Boolean);const f=c.act.filter(m=>{const dd=fd(crewDeptOf(m));return dd&&deps.some(x=>x.includes(dd)||dd.includes(x))});if(f.length)crew=f}
  const cast=dp?arr(dp.cast).filter(x=>x&&(x.actor||x.role)).length:0,ex=parseInt(String((dp&&dp.extras)||d.extras||0).replace(/[^0-9]/g,""))||0;
  const cnt={};crew.forEach(m=>{const k=m.diet&&m.diet!=="none"?m.diet:"none";cnt[k]=(cnt[k]||0)+1});
  const intol={};crew.forEach(m=>m.intol.forEach(i=>{intol[i]=(intol[i]||0)+1}));
  return {total:crew.length+cast+ex,crew:crew.length,cnt,intol,cast,ex,src}}
function dayEatHTML(d){let e;try{e=dayEaters(d)}catch(_){return ""}if(!e.total)return "";
  const reg=(e.cnt.none||0)+e.cast+e.ex;
  const chips=[reg?'<span class="catchip reg"><b>'+reg+'</b> '+esc(L("Regulär"))+'</span>':'']
    .concat(DIETS.filter(x=>x[0]!=="none"&&e.cnt[x[0]]).map(x=>'<span class="catchip"><b>'+e.cnt[x[0]]+'</b> '+esc(L(x[1]))+'</span>'))
    .concat(INTOL.filter(x=>e.intol[x[0]]).map(x=>'<span class="catchip"><b>'+e.intol[x[0]]+'</b> '+esc(L(x[1]))+'</span>')).join("");
  const tip=e.crew+" Crew"+(e.cast?" · "+e.cast+" Cast":"")+(e.ex?" · "+e.ex+" Extras":"")+" · "+L(e.src==="dispo"?"laut Callsheet":"noch kein Callsheet – ganze Crew");
  return '<div class="meat" title="'+esc(tip)+'"><span class="mtot"><b>'+e.total+'</b> '+esc(L("Personen"))+'</span><div class="catchips">'+chips+'</div><span class="msrc">'+esc(tip)+'</span></div>'}
const MENUX=new Set();
document.addEventListener("click",e=>{const b=e.target.closest("[data-menux]");if(!b)return;
  /* keep what was typed in the form, then show the extra unit */
  const f=b.closest("form[data-menu]"),date=f.dataset.menu,cur={};f.querySelectorAll("input[name^=u]").forEach(x=>{if(x.value)cur[x.name]=x.value});
  if(Object.keys(cur).length)window.MENUS=Object.assign({},window.MENUS,{[date]:Object.assign({},(window.MENUS||{})[date],cur)});
  MENUX.add(b.dataset.menux);document.activeElement&&document.activeElement.blur&&document.activeElement.blur();render()});
function menuSec(){
  const t=todayISO(),days=S.days.filter(d=>d.kind==="shoot"&&d.date>=t);const units=typeof unitsOn==="function"?unitsOn():["1"];
  if(!days.length)return '<p class="ghint">'+L("Keine kommenden Drehtage.")+'</p>';
  return '<p class="ghint">'+L("Zwei Menüs pro Drehtag und Unit – sie erscheinen im Drehplan und im Callsheet beim Lunch.")+'</p>'+days.map(d=>{const m=(window.MENUS||{})[d.date]||{};const dt=new Date(d.date+"T12:00:00");
    /* units: 1st always; 2nd/3rd when they shoot that day, when a menu was entered for them, or when catering adds them by hand («+ 3rd Unit») */
    const us=["1","2","3"].filter(u=>u==="1"||(typeof hasU==="function"&&hasU(d,u))||m["u"+u+"a"]||m["u"+u+"b"]||MENUX.has(d.date+"|"+u));const multi=us.length>1;
    const addU=["2","3"].filter(u=>!us.includes(u));
    return '<form class="menuf" data-menu="'+esc(d.date)+'"><div class="menuh"><div class="menuhd"><b>'+esc(d.short||d.label||"")+'</b> <span>'+esc(WDL(dt)+" "+ddmm(dt))+'</span></div>'+dayEatHTML(d)+'</div>'+
      (multi?'<label class="ck menutog"><input type="checkbox" name="tog"'+(m.tog?' checked':'')+'> '+L("Alle Units essen zusammen (ein gemeinsames Menü)")+'</label>':'')+
      us.filter(u=>u==="1"||!m.tog).map(u=>'<div class="menuu" data-mu="'+u+'"><div class="menuul">'+esc(UNAME&&UNAME[u]?UNAME[u]+" Unit":u+". Unit")+'</div>'+["a","b"].map((k,i)=>'<label>'+L("Menü")+' '+(i+1)+'<input name="u'+u+k+'" maxlength="300" placeholder="'+esc(L(i?"z. B. vegetarisch: Gemüsecurry":"z. B. Risotto mit Pilzen"))+'" value="'+esc(k==="a"?(m["u"+u+"a"]||m["u"+u]||""):(m["u"+u+"b"]||""))+'"></label>').join("")+'</div>').join("")+
      (addU.length&&!m.tog?'<div class="menuadd">'+addU.map(u=>'<button type="button" class="pillbtn" data-menux="'+esc(d.date)+'|'+u+'">+ '+esc(UNAME&&UNAME[u]?UNAME[u]+" Unit":u+". Unit")+'</button>').join("")+'</div>':'')+
      '<label class="menuzw"><span>'+L("Zwischenverpflegung")+' <span class="ghint">('+L("optional")+')</span></span><input name="zw" maxlength="300" placeholder="'+esc(L("z. B. Früchte, Sandwiches um 16:00"))+'" value="'+esc(m.zw||"")+'"></label>'+
      '<div class="arb">'+saveBtn()+'</div></form>'}).join("");
}
document.addEventListener("change",e=>{const t=e.target;if(!t.matches("form[data-menu] input[name=tog]"))return;const f=t.form;f.querySelectorAll('.menuu').forEach(x=>{if(x.dataset.mu!=="1")x.hidden=t.checked});{const a=f.querySelector('.menuadd');if(a)a.hidden=t.checked}
  if(!t.checked&&!f.querySelector('.menuu[data-mu="2"]')){const date=f.dataset.menu;window.MENUS=Object.assign({},window.MENUS,{[date]:Object.assign({},(window.MENUS||{})[date],{tog:false},Object.fromEntries([...f.querySelectorAll("input[name^=u]")].map(x=>[x.name,x.value])))});render()}});
document.addEventListener("submit",async e=>{const f=e.target.closest("form[data-menu]");if(!f)return;e.preventDefault();if(!canMenu())return;
  const date=f.dataset.menu,val={by:ME.email,tog:!!(f.tog&&f.tog.checked),zw:f.zw?String(f.zw.value||"").trim().slice(0,300):""};["1","2","3"].forEach(u=>["a","b"].forEach(k=>{if(f["u"+u+k])val["u"+u+k]=String(f["u"+u+k].value||"").trim().slice(0,300)}));const btn=f.querySelector("button[type=submit]");btn.disabled=true;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"menus",date),Object.assign({},val,{at:F.serverTimestamp()}));window.MENUS=Object.assign({},window.MENUS,{[date]:Object.assign({},(window.MENUS||{})[date],val)});try{localStorage.setItem("menus",JSON.stringify(window.MENUS))}catch(_){}
    document.activeElement&&document.activeElement.blur&&document.activeElement.blur();showMsg(L("Menü gespeichert."),2500);render()}
  catch(err){btn.disabled=false;showMsg(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err),8000)}});
/* ---- welcome note (BETA, no warranty): shown once to every user until confirmed; the confirmation is kept in the profile ---- */
const WELCOME_VER="1";
const WTXT={
 de:{t:"Herzlich willkommen in der TSCHUGGER-App!",p:["Schön, dass du dabei bist. Hier findest du Drehplan, Callsheets, Crewliste, Locations und Drehbuch von TSCHUGGER Tigerblood an einem Ort.","Bitte beachte: Die App ist eine BETA-Testversion. Alle angezeigten Daten sind ohne Gewähr. Die Produktion und das Entwicklungsteam übernehmen KEINE Garantie für die Richtigkeit, Vollständigkeit oder Aktualität der Daten. Verbindlich sind immer die offiziellen Unterlagen der Produktion (Drehplan, Callsheet, Dispo).","Alle Inhalte sind vertraulich und nur für die Crew bestimmt – bitte nicht weitergeben.","Fehler entdeckt oder einen Wunsch? Melde dich bei Stefan Künzler."],c:"Ich habe die Hinweise gelesen und verstanden.",b:"Bestätigen"},
 fr:{t:"Bienvenue dans l'app TSCHUGGER !",p:["Ravi·e de t'accueillir. Tu trouves ici le plan de tournage, les callsheets, la liste de l'équipe, les locations et le scénario de TSCHUGGER Tigerblood au même endroit.","Attention : l'app est une version de test BETA. Toutes les données affichées sont sans garantie. La production et les développeurs n'assument AUCUNE garantie quant à l'exactitude, l'exhaustivité ou l'actualité des données. Seuls les documents officiels de la production (plan de tournage, callsheet, dispo) font foi.","Tous les contenus sont confidentiels et réservés à l'équipe – merci de ne pas les diffuser.","Une erreur ou une suggestion ? Contacte Stefan Künzler."],c:"J'ai lu et compris ces indications.",b:"Confirmer"},
 it:{t:"Benvenuta/o nell'app TSCHUGGER!",p:["Che bello averti a bordo. Qui trovi piano di lavorazione, callsheet, lista crew, location e sceneggiatura di TSCHUGGER Tigerblood in un unico posto.","Nota bene: l'app è una versione di prova BETA. Tutti i dati visualizzati sono senza garanzia. La produzione e gli sviluppatori NON si assumono alcuna garanzia sulla correttezza, completezza o attualità dei dati. Fanno fede sempre i documenti ufficiali della produzione (piano di lavorazione, callsheet, dispo).","Tutti i contenuti sono riservati e destinati solo alla crew – per favore non diffonderli.","Hai trovato un errore o hai un desiderio? Rivolgiti a Stefan Künzler."],c:"Ho letto e compreso le indicazioni.",b:"Conferma"},
 hi:{"t": "TSCHUGGER ऐप में आपका स्वागत है!", "p": ["आपके साथ होने की खुशी है। यहाँ TSCHUGGER Tigerblood का शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट एक ही जगह मिलेंगे।", "कृपया ध्यान दें: यह ऐप BETA परीक्षण संस्करण है। दिखाया गया सारा डेटा बिना गारंटी के है। प्रोडक्शन और डेवलपर्स डेटा के सही, पूर्ण या अद्यतन होने की कोई गारंटी नहीं देते। प्रोडक्शन के आधिकारिक दस्तावेज़ (शेड्यूल, Callsheet, Dispo) ही मान्य हैं।", "सारी सामग्री गोपनीय है और केवल Crew के लिए है – कृपया आगे न भेजें।", "कोई गलती मिली या कोई सुझाव है? Stefan Künzler से संपर्क करें।"], "c": "मैंने ये निर्देश पढ़ और समझ लिए हैं।", "b": "पुष्टि करें"},
 en:{t:"Welcome to the TSCHUGGER app!",p:["Great to have you on board. Here you'll find the shooting schedule, callsheets, crew list, locations and script of TSCHUGGER Tigerblood in one place.","Please note: the app is a BETA test version. All data shown is without guarantee. The production and the developers accept NO liability for the data being correct, complete or up to date. The official production documents (shooting schedule, callsheet, dispo) are always binding.","All content is confidential and for the crew only – please do not share it.","Found a mistake or have a wish? Get in touch with Stefan Künzler."],c:"I have read and understood these notes.",b:"Confirm"}};
let WELCOME_OPEN=false;
async function welcomeDone(){
  if(MEMBER&&MEMBER.welcomeAck&&MEMBER.welcomeVer===WELCOME_VER)return true;
  let loc="";try{loc=localStorage.getItem("welcomeAck")||""}catch(_){}
  if(loc&&loc.split("|")[1]===WELCOME_VER)return true;
  try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"prefs",ME.uid)),8000,"prefs");const w=d.exists()&&d.data().welcomeAck;if(w&&String(w).split("|")[1]===WELCOME_VER){try{localStorage.setItem("welcomeAck",w)}catch(_){}return true}}catch(_){}
  return false;
}
async function maybeWelcome(){
  if(!ME||WELCOME_OPEN||ONBOARD)return;
  /* locked BEFORE the check: two sign-in paths at the same moment showed the note twice */
  WELCOME_OPEN=true;if(await welcomeDone()){WELCOME_OPEN=false;maybeTestWelcome();return}
  if(document.getElementById("welcome")){return}let T=WTXT[LANG]||(LANG==="hi"?WTXT.en:WTXT.de);
  if(LANG==="de"||docRaw("welcome").custom||docRaw("disclaimer").custom){const w=docGet("welcome",{});const dis=docRaw("disclaimer").body.trim();
    T=Object.assign({},WTXT[LANG]||(LANG==="hi"?WTXT.en:WTXT.de),{t:w.subject,p:w.body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)});T.warnIdx=T.p.findIndex(x=>x===dis)}
  const d=mkDialog("welcome");
  d.innerHTML='<div class="a2box wlbox"><span class="wlbeta">BETA</span><h3>'+esc(T.t)+'</h3>'+T.p.map((x,i)=>'<p'+(i===(T.warnIdx!==undefined?T.warnIdx:1)?' class="wlwarn"':'')+'>'+esc(x)+'</p>').join("")+
    '<label class="wlchk"><input type="checkbox" data-wlok> '+esc(T.c)+'</label><div class="a2b"><button type="button" class="pri" data-wlgo disabled>'+esc(T.b)+'</button></div><p class="amsg" role="alert"></p></div>';
  d.addEventListener("change",e=>{if(e.target.matches("[data-wlok]"))d.querySelector("[data-wlgo]").disabled=!e.target.checked});
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-wlgo]");if(!b||b.disabled)return;b.disabled=true;
    const at=new Date().toISOString();store("welcomeAck",at+"|"+WELCOME_VER);savePrefs();
    try{if(MEMBER){const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),{welcomeAck:at,welcomeVer:WELCOME_VER});MEMBER.welcomeAck=at;MEMBER.welcomeVer=WELCOME_VER}}catch(err){console.warn("welcome",err&&err.code||err)}
    d.remove();WELCOME_OPEN=false;maybeTestWelcome()});
  document.body.appendChild(d);
}
/* ---- test users (role with «Test» in its name): a one-time note that they see features not yet introduced; text under Einstellungen → Dokumente ---- */
const twVer=()=>String(parseInt(((window.DOCS||{}).testwelcome||{}).ver,10)||1);
const isTester=()=>!!(ME&&!SIMROLE&&!(typeof SIMUSER!=="undefined"&&SIMUSER)&&!isAdmin()&&/test/i.test((window.MYROLENAME||"")+" "+(MYROLE||"")));
async function twDone(){const v=twVer();
  if(MEMBER&&MEMBER.testAck&&String(MEMBER.testVer||"1")===v)return true;
  let loc="";try{loc=localStorage.getItem("testAck")||""}catch(_){}
  if(loc&&loc.split("|")[1]===v)return true;
  try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"prefs",ME.uid)),8000,"prefs");const w=d.exists()&&d.data().testAck;if(w&&String(w).split("|")[1]===v){try{localStorage.setItem("testAck",w)}catch(_){}return true}}catch(_){}
  return false}
let TW_OPEN=false;
async function maybeTestWelcome(){
  if(!isTester()||TW_OPEN||WELCOME_OPEN||ONBOARD){maybeCsBeta();return}
  TW_OPEN=true;
  if(await twDone()){TW_OPEN=false;maybeCsBeta();return}
  const v=twVer(),w=docGet("testwelcome",{vorname:(MEMBER&&(MEMBER.firstName||String(MEMBER.name||"").split(" ")[0]))||""});
  const d=mkDialog("twelcome");
  d.innerHTML='<div class="a2box wlbox"><span class="wlbeta">BETA</span><h3>'+esc(w.subject)+'</h3>'+w.body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(x=>'<p>'+esc(x).replace(/\n/g,"<br>")+'</p>').join("")+
    '<div class="a2b"><button type="button" class="pri" data-twok>'+esc(L("Verstanden"))+'</button></div></div>';
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-twok]");if(!b)return;b.disabled=true;
    const at=new Date().toISOString();store("testAck",at+"|"+v);savePrefs();
    try{if(MEMBER){const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),{testAck:at,testVer:v});MEMBER.testAck=at;MEMBER.testVer=v}}catch(err){console.warn("testwelcome",err&&err.code||err)}
    d.remove();TW_OPEN=false;maybeCsBeta()});
  document.body.appendChild(d);
}
/* ---- «Neu: Interaktives Callsheet» (BETA): once for everybody who may see the callsheet; text under Einstellungen → Dokumente ---- */
let CSB_OPEN=false;
async function csbDone(){let loc="";try{loc=localStorage.getItem("csb")||""}catch(_){}if(loc)return true;
  try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"prefs",ME.uid)),8000,"prefs");const w=d.exists()&&prefX(d.data()).csb;if(w){try{localStorage.setItem("csb",w)}catch(_){}return true}}catch(_){}
  return false}
async function maybeCsBeta(){
  const may=ME&&!SIMROLE&&!(typeof SIMUSER!=="undefined"&&SIMUSER)&&typeof vok==="function"&&vok("dispo");
  if(!may||CSB_OPEN||TW_OPEN||WELCOME_OPEN||ONBOARD){maybeTour();return}
  CSB_OPEN=true;if(await csbDone()){CSB_OPEN=false;maybeTour();return}
  const w=docGet("csbeta",{vorname:(MEMBER&&(MEMBER.firstName||String(MEMBER.name||"").split(" ")[0]))||""});
  const d=mkDialog("csbeta");
  d.innerHTML='<div class="a2box wlbox"><span class="wlbeta">BETA</span><h3>'+esc(w.subject)+'</h3>'+w.body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(x=>'<p>'+esc(x).replace(/\n/g,"<br>")+'</p>').join("")+
    '<div class="a2b"><button type="button" class="pri" data-csbok>'+esc(L("Verstanden"))+'</button></div></div>';
  d.addEventListener("click",e=>{const b=e.target.closest("[data-csbok]");if(!b)return;b.disabled=true;
    store("csb",new Date().toISOString().slice(0,16));savePrefs();d.remove();CSB_OPEN=false;maybeTour()});
  document.body.appendChild(d);
}
/* ---- presence: signed-in members leave a «last seen» mark every 2 minutes while the app is open (shown to admins) ---- */
let SEENT=null,SEENAT=0;
/* «app-ios», «web-android» …: installed app or browser, and the kind of device (shown to admins in the user list) */
const appKind=()=>{const ua=navigator.userAgent||"",inst=typeof isStandalone==="function"&&isStandalone();
  const dev=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?"ios":/Android/i.test(ua)?"android":"desktop";return (inst?"app-":"web-")+dev};
async function markSeen(){
  if(!ME||!MEMBER||document.visibilityState!=="visible"||Date.now()-SEENAT<100e3)return;SEENAT=Date.now();
  /* every device of the person once in «devs» (kind|last use) – the user list shows how many devices are in use; devices unused for 30 days drop out */
  let id="";try{id=localStorage.getItem("devid")||"";if(!id){id=Math.random().toString(36).slice(2,10);localStorage.setItem("devid",id)}}catch(_){}
  /* at most 10 devices are kept (this one + the 9 used last; unused for 30 days drop out): the rules refuse more than 12, and the whole mark –
     «last seen» too – used to fail from the 13th browser on (private mode, cleared data …). MEMBER.devs follows every write */
  let F,db;try{({F,db}=await fb())}catch(_){return}
  const base={lastSeen:F.serverTimestamp(),app:appKind()},up=Object.assign({},base),dv=Object.assign({},(MEMBER&&MEMBER.devs)||{}),tm=k=>+String(dv[k]).split("|")[1]||0;
  /* the device's last start time (ms) after kind and last use: Log shows how fast the app starts on the crew's devices */
  if(id){dv[id]=appKind()+"|"+Date.now()+(window.__STARTMS?"|"+window.__STARTMS:(String(dv[id]||"").split("|")[2]?"|"+String(dv[id]).split("|")[2]:""));up["devs."+id]=dv[id];
    Object.keys(dv).filter(k=>k!==id).sort((a,b)=>tm(b)-tm(a)).forEach((k,i)=>{if(i>=9||Date.now()-tm(k)>30*864e5){up["devs."+k]=F.deleteField();delete dv[k]}})}
  try{await F.updateDoc(F.doc(db,"members",ME.uid),up);if(MEMBER&&id)MEMBER.devs=dv}
  catch(err){console.warn("seen",err&&err.code||err);if(id&&/permission/.test(err&&err.code||""))try{await F.updateDoc(F.doc(db,"members",ME.uid),base)}catch(_){}}
}
setInterval(()=>{if(S.tab==="admin"&&ADM.sub==="users"&&document.visibilityState==="visible"&&ADM.loaded&&!ADM.loading&&Date.now()-(ADM.at||0)>=900e3){   /* the user list is read again at most every 15 minutes (Firebase quota) */ADM.at=Date.now();ADM.loading=true;admLoad().catch(()=>{}).finally(()=>{ADM.loading=false})}},60e3);
function startSeen(){clearInterval(SEENT);SEENAT=0;markSeen();SEENT=setInterval(markSeen,120e3)}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")markSeen()});
const seenMs=m=>{const j=m&&m.lastSeen;return j?(j.seconds?j.seconds*1000:(j.toMillis?j.toMillis():Date.parse(j)||0)):0};
const isOnline=m=>Date.now()-seenMs(m)<4*60e3;
function seenText(m){const t=seenMs(m);if(!t)return m&&m.active===true?L("noch nie online"):"";const d=Date.now()-t;if(d<4*60e3)return L("gerade aktiv");
  const mi=Math.round(d/60e3);if(mi<60)return L("zuletzt online")+" "+L("vor {n} Min.").replace("{n}",mi);
  const dt=new Date(t),hm=dt.toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"}),day=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),dd=Math.round((day(new Date())-day(dt))/864e5);
  return L("zuletzt online")+" "+(dd===0?L("heute")+" "+hm:dd===1?L("gestern")+" "+hm:dt.toLocaleDateString("de-CH")+" "+hm)}
let START=null;
async function afterSignIn(u){
  setME(u);if(!window.PRIVOK)setTimeout(()=>{try{loadLangs().then(()=>{if(S.tab==="admin")render()})}catch(_){}},1500); /* links (motive list, map, chat) can only be read once signed in */
  /* account created by the owner with a start password: counts as confirmed, but a new password must be set first */
  START=null;if(!u.emailVerified||window.__checkStart){try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"starts",lc(u.email))),10000,"start");if(d.exists())START=d.data()}catch(_){}}
  if(START&&START.mustChange){showGate("newpw");return}
  if(!u.emailVerified&&!START){showGate("verify");autoVerify(u);return}
  let st;try{st=await checkMember()}catch(err){console.error(err);
    if(isOffline(err)&&S.days.length){hideGate();acctButton(true);render();showMsg(L("Offline – du siehst den zuletzt geladenen Stand."),6000);return}
    showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true);return}
  if(st!=="ok"){clearLocal();render();showGate(st==="blocked"?"blocked":st==="revoked"?"login":"denied");return}
  hideGate();acctButton(true);PUBB.loaded=false;PUBB.list=[];loadPrefs();startSeen();pushSyncSoon();menusLoad(true);
  const prof=MEMBER||{};
  let hasLocal=false;try{hasLocal=!!localStorage.getItem("lang")}catch(_){}
  if(prof.lang&&prof.lang!==LANG&&(window.__justSignedIn||!hasLocal)&&WDS[prof.lang]){setLANG(prof.lang);store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
  /* only the small stamp is read when the data on this device is still current (the full file only when it changed) */
  try{await load(false);if(window.loadContacts)window.loadContacts()}catch(err){window.__LOADFAIL=true;console.error(err);showMsg(isOffline(err)&&S.days.length?L("Offline – du siehst den zuletzt geladenen Stand."):loadErr(err),isOffline(err)?6000:15000)}
  await fillNamesFromCrew();
  /* first start, and whenever gender, phone or e-mail is missing: the profile form must be filled in */
  let partialAt=0;try{partialAt=+localStorage.getItem("profPartial:"+ME.uid)||0}catch(_){}
  const needExtra=(!MEMBER||!MEMBER.gender||!String(MEMBER.phone||"").trim()||!String(MEMBER.contactEmail||"").trim())&&Date.now()-partialAt>12*3600e3;
  if(MEMBER&&(!MEMBER.diet||needExtra))setTimeout(()=>showAcct(true),400);else setTimeout(maybeWelcome,600);
  if(window.__justSignedIn)window.__justSignedIn=false;
}
/* names come from the crew list (matched by e-mail) when the profile has none yet */
const crewNames=()=>{const p=ME&&crewPerson(window.simEmail());if(!p||!p.name)return null;const sp=splitName(p.name);return sp.firstName?{firstName:clean(sp.firstName),lastName:clean(sp.lastName||"")}:null};
async function fillNamesFromCrew(){
  if(!MEMBER||!ME)return;
  const cn=crewNames();if(!cn||(MEMBER.firstName===cn.firstName&&(MEMBER.lastName||"")===cn.lastName))return;
  const upd={firstName:cn.firstName,lastName:cn.lastName,name:[cn.firstName,cn.lastName].filter(Boolean).join(" ")};
  try{const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),upd);Object.assign(MEMBER,upd)}catch(err){console.error(err)}
}
function setSTART(v){return START=v}   /* other parts change START only through this */
function setMENUSUB(v){return MENUSUB=v}   /* other parts change MENUSUB only through this */
function setWELCOME_OPEN(v){return WELCOME_OPEN=v}   /* other parts change WELCOME_OPEN only through this */
