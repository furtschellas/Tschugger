/* ---- chat assistant: asks Claude through the production's Cloudflare Worker (config/app.chatUrl); every person can switch it off in «Mein Konto» ---- */
window.CHATURL="";window.CHATEN=true;window.TOUREN=true;window.PUSHEN=true;try{window.PUSHEN=localStorage.getItem("apppushon")!=="0"}catch(_){}try{window.CHATURL=localStorage.getItem("appchat")||"";window.CHATEN=localStorage.getItem("appchaton")!=="0";window.TOUREN=localStorage.getItem("apptouron")!=="0"}catch(_){}
const chatOn=()=>{let v=null;try{v=localStorage.getItem("chat")}catch(_){}return v!=="0"};
const CHAT={open:false,busy:false,msgs:[]};try{CHAT.msgs=JSON.parse(sessionStorage.getItem("chatmsgs")||"[]")||[]}catch(_){}
const APPHELP=`So ist die App aufgebaut (unten die Bereiche, oben die Knöpfe):
- Schedule: Drehplan Tag für Tag mit Szenen, Motiven, Units (1st/2nd Unit); Knopf «Script» öffnet die Szene im Drehbuch, Kamera-Knopf zeigt Blocking-Fotos/Filme, Zahlen-Knöpfe öffnen Floorplans (PDF).
- Callsheet: Dispo des Tages (Crew Call, Drehbeginn, Wrap, Locations, Cast, Abteilungen).
- Locations: alle Motive mit Adresse, Karte und Szenen.
- Crew: Crewliste nach Abteilungen (Telefon/E-Mail nur mit Berechtigung), Catering-Übersicht, Geburtstage.
- Script: das Drehbuch mit Suche.
- Info: allgemeine Infos.
- Lupe oben: Suche über alles. Kalender-Symbol: «Meine Termine» (eigene Termine, mit «In den Kalender» und Push-Glocke). Personen-Symbol: «Mein Konto» (Profil, Push-Nachrichten, Darstellung hell/dunkel, Passwort, Abmelden, Tour neu starten). Zahnrad: App-Verwaltung (nur mit Berechtigung).
- Daten kommen automatisch aus der Dropbox der Produktion.`;
function chatCtx(){
  const out=[APPHELP];const J=x=>JSON.stringify(x,(k,v)=>v===""||v===null||(Array.isArray(v)&&!v.length)||/_(fr|it|en|hi)$/.test(k)?undefined:v);
  /* from yesterday on (past days only as a short list), translations left out – keeps the question fast and cheap */
  const y=new Date(Date.now()-864e5).toISOString().slice(0,10),cur=a=>arr(a).filter(d=>d&&String(d.date||"")>=y);
  try{if(vok("plan")){out.push("DREHPLAN (days, ab gestern): "+J(cur(S.days)));const past=S.days.filter(d=>d&&String(d.date||"")<y);if(past.length)out.push("FRÜHERE DREHTAGE (nur Datum/Titel): "+J(past.map(d=>({date:d.date,label:d.label||d.short,kind:d.kind}))))}}catch(_){}
  try{if(vok("dispo"))out.push("CALLSHEETS (dispos, ab gestern): "+J(cur(S.dispos)))}catch(_){}
  try{if(vok("prep"))out.push("PREP / WEEKLY SCHEDULE (ab gestern): "+J(cur(S.prepro)))}catch(_){}
  try{out.push("LOCATIONS: "+J(S.locs))}catch(_){}
  try{const ph=vok("phone"),em=vok("email");if(vok("crew"))out.push("CREWLISTE: "+J(S.crew.map(g=>Object.assign({},g,{people:arr(g.people).map(p=>{const q=Object.assign({},p);if(!ph){delete q.phone;delete q.tel;delete q.mobile}if(!em)delete q.email;return q})}))))}catch(_){}
  try{if(vok("mycal")&&typeof myIdentity==="function"){const me=myIdentity();if(me)out.push("MEINE TERMINE ("+me.name+"): "+J(myEvents(me).filter(e=>String(e.date||"")>=y).map(e=>({date:e.date,t:e.t,end:e.end,n:e.n,where:e.where,src:e.src}))))}}catch(_){}
  /* «Meine Termine» first after the help, so a cut at the limit takes the least important part */
  const mine=out.findIndex(x=>/^MEINE TERMINE/.test(x));if(mine>1)out.splice(1,0,out.splice(mine,1)[0]);
  return out.join("\n\n").slice(0,55000);
}
function chatFab(){
  let b=document.getElementById("chatFab");const g=document.getElementById("gate"),show=!!(ME&&window.CHATURL&&window.CHATEN&&chatOn()&&!ONBOARD&&!WELCOME_OPEN&&(!g||g.hidden));
  if(!b){b=document.createElement("button");b.id="chatFab";b.type="button";b.className="chatfab";
    b.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/></svg>';
    b.addEventListener("click",()=>{CHAT.open=!CHAT.open;chatPanel()});document.body.appendChild(b)}
  b.setAttribute("aria-label",L("Assistent"));b.title=L("Assistent");b.hidden=!show;if(!show&&CHAT.open){CHAT.open=false;chatPanel()}
}
const chatMd=t=>esc(t).replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/(^|\n)- /g,"$1• ").replace(/(https:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,"<br>");
function chatPanel(){
  let p=document.getElementById("chatBox");
  if(!CHAT.open){if(p)p.hidden=true;return}
  if(!p){p=document.createElement("div");p.id="chatBox";p.className="chatbox";p.setAttribute("role","dialog");p.setAttribute("aria-label",L("Assistent"));document.body.appendChild(p);
    p.addEventListener("submit",e=>{e.preventDefault();const i=p.querySelector("textarea");const q=String(i.value||"").trim();if(q&&!CHAT.busy){i.value="";chatAsk(q)}});
    p.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&e.target.matches("textarea")){e.preventDefault();p.querySelector("form").requestSubmit()}});
    p.addEventListener("click",e=>{if(e.target.closest("[data-chatx]")){CHAT.open=false;chatPanel()}else if(e.target.closest("[data-chatclr]")){CHAT.msgs=[];chatKeep();chatPanel()}else{const s=e.target.closest("[data-chatq]");if(s&&!CHAT.busy)chatAsk(s.dataset.chatq)}})}
  const sug=["Wann ist mein nächster Termin?","Wo drehen wir morgen?","Wer ist die Regie?","Wie funktioniert Meine Termine?"];
  p.innerHTML='<div class="chhd"><b>'+L("Assistent")+'</b><span class="chbeta">BETA</span>'+(CHAT.msgs.length?'<button type="button" class="lnk" data-chatclr>'+L("Neu")+'</button>':'')+'<button type="button" class="chx" data-chatx aria-label="'+esc(L("Schliessen"))+'">×</button></div>'+
    '<div class="chmsgs">'+(CHAT.msgs.length?'':'<p class="ghint">'+L("Frag mich etwas zum Drehplan, zu Locations, zur Crew oder zur App.")+'</p><div class="chsug">'+sug.map(q=>'<button type="button" data-chatq="'+esc(L(q))+'">'+esc(L(q))+'</button>').join("")+'</div>')+
    CHAT.msgs.map(m=>'<div class="chm '+(m.r==="u"?"me":m.r==="e"?"err":"bot")+'">'+(m.r==="u"?esc(m.t).replace(/\n/g,"<br>"):chatMd(m.t))+'</div>').join("")+(CHAT.busy?'<div class="chm bot busy"><span></span><span></span><span></span></div>':'')+'</div>'+
    '<form class="chin"><textarea rows="1" maxlength="2000" placeholder="'+esc(L("Frage eingeben …"))+'" aria-label="'+esc(L("Frage"))+'"></textarea><button type="submit" aria-label="'+esc(L("Senden"))+'"'+(CHAT.busy?' disabled':'')+'>➤</button></form>'+
    '<p class="chnote">'+L("Antworten ohne Gewähr – verbindlich sind die Unterlagen der Produktion.")+'</p>';
  p.hidden=false;const ms=p.querySelector(".chmsgs");ms.scrollTop=ms.scrollHeight;if(!CHAT.busy&&matchMedia("(pointer:fine)").matches)p.querySelector("textarea").focus();
}
function chatKeep(){try{sessionStorage.setItem("chatmsgs",JSON.stringify(CHAT.msgs.slice(-30)))}catch(_){}}
async function chatAsk(q){
  CHAT.msgs.push({r:"u",t:q});CHAT.busy=true;chatKeep();chatPanel();
  try{const {auth}=await fb();const tok=await auth.currentUser.getIdToken();
    const r=await withTimeout(fetch(window.CHATURL.replace(/\/+$/,"")+"/chat",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok},
      body:JSON.stringify({q,lang:LANG,today:new Date().toLocaleString("de-CH",{weekday:"long",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}),who:(MEMBER&&MEMBER.name||"")+" <"+ME.email+">",
        hist:CHAT.msgs.slice(0,-1).filter(m=>m.r!=="e").slice(-10),ctx:chatCtx()})}),60000,"chat");
    const j=await r.json().catch(()=>({}));
    CHAT.msgs.push(r.ok&&j.a?{r:"a",t:j.a}:{r:"e",t:L("Fehler:")+" "+(j.error||r.status)})}
  catch(err){CHAT.msgs.push({r:"e",t:L(navigator.onLine===false?"Keine Verbindung.":"Der Assistent ist gerade nicht erreichbar.")})}
  CHAT.busy=false;chatKeep();chatPanel();
}
function chatSec(){if(!window.CHATURL||!window.CHATEN)return "";
  return '<section class="psec"><h4>'+L("Assistent")+'</h4><label class="ck"><input type="checkbox" data-chaton'+(chatOn()?' checked':'')+'> '+L("Chat-Assistent anzeigen (Knopf unten rechts)")+'</label></section>'}
function chatSetSec(){
  return '<p class="ahint"><b>'+L("Push-Nachrichten")+'</b> – '+L("Ausgeschaltet verschwinden Erinnerungen, Glocken und der Briefumschlag für Nachrichten an alle.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="pn"'+(window.PUSHEN!==false?' checked':'')+'> '+L("Push-Nachrichten anbieten")+'</label></div>'+
    '<p class="ahint"><b>'+L("Einführungstour")+'</b> – '+L("Eingeschaltet wird die Tour allen einmalig angeboten und kann unter «Mein Konto» neu gestartet werden.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="to"'+(window.TOUREN!==false?' checked':'')+'> '+L("Einführungstour anbieten")+'</label></div>'+
    '<p class="ahint"><b>'+L("Assistent")+'</b> – '+L("Adresse des Cloudflare Workers für den Chat-Assistenten (und den zuverlässigen Zeitplan für Push und Dropbox). Leer = kein Assistent.")+' <a href="https://github.com/furtschellas/Tschugger/blob/main/tools/chat_worker.js" target="_blank" rel="noopener">'+L("Worker-Code und Anleitung")+'</a></p><input form="setform" class="amap" type="url" name="chat" inputmode="url" placeholder="https://tschugger.….workers.dev" value="'+esc(window.CHATURL||"")+'"><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="ca"'+(window.CHATEN!==false?' checked':'')+'> '+L("KI-Assistent anbieten")+'</label></div>'}
document.addEventListener("change",e=>{if(e.target.matches("[data-chaton]")){store("chat",e.target.checked?"1":"0");chatFab()}});
setInterval(()=>{try{chatFab()}catch(_){}},20000);
/* ---- introduction tour: offered once to everybody (new and existing users) after the welcome note; can be skipped;
   the result (done/skip + date) is kept in the profile (members.tour/tourAt); «Mein Konto» starts it again ---- */
/* the tour is put together per person: a step only appears when its element is there (= the role sees it) and, with «need», when the permission fits;
   the first step says which role the tour is for and what it covers */
function tourIntro(){
  const rn=isOwner()?L("Owner"):isAdmin()?L("Admin"):MYROLE?(((typeof OWN!=="undefined"&&OWN.roles)||[]).find(r=>r.id===MYROLE)||{}).name||(MYROLE.charAt(0).toUpperCase()+MYROLE.slice(1)):L("ohne Rolle");
  const TN={today:"Today",plan:"Schedule",dispo:"Callsheet",loc:"Locations",crew:"Crew",script:"Script",cater:"Catering",info:"Info"};
  const areas=(typeof tabsOn==="function"?tabsOn():[]).map(t=>TN[t]||t).join(", ");
  const extra=[can("push.send")&&L("Push-Nachrichten an alle senden"),window.ownEvAddBtn&&window.ownEvAddBtn()&&L("eigene Termine für andere anlegen"),vok("mycal")&&can("mycal.all")&&L("die Termine anderer sehen"),typeof canMenu==="function"&&canMenu()&&tabsOn().includes("cater")&&L("die Lunch-Menüs eintragen")].filter(Boolean);
  return (rn===L("ohne Rolle")?L("Diese Tour ist auf dich zugeschnitten."):L("Diese Tour ist auf dich zugeschnitten – Rolle: {r}.").replace("{r}",rn))+" "+L("Du siehst: {a}.").replace("{a}",areas)+(extra.length?" "+L("Zusätzlich darfst du: {x}.").replace("{x}",extra.join(", ")):"")}
const TOUR_STEPS=[
  {tab:"today",sel:"nav.tabs",t:"Deine Tour",x:()=>tourIntro()},
  {tab:"today",sel:'nav.tabs [data-tab="today"]',t:"Today",x:"Alles für heute – oder den nächsten Arbeitstag – auf einer Seite. Nach mehr als 2 Stunden Pause öffnet die App direkt hier."},
  {tab:"today",sel:"#view .tmy",t:"Meine nächsten Termine",x:"Deine nächsten Termine auf einen Blick; mit «Alle ›» siehst du alle."},
  {tab:"today",sel:"#view [data-route]",t:"Anfahrt",x:"Fahrzeit zum ersten Set. Antippen und wählen, ob die Route vom Hotel oder von deinem Standort aus geplant wird."},
  {tab:"today",sel:"#view [data-wx]",t:"Wetter",x:"Das Wetter am ersten Motiv – antippen für den detaillierten Wetterbericht."},
  {tab:"today",sel:"#view .tchg",t:"Änderungen",x:"Was sich seit deinem letzten Besuch geändert hat. Geänderte Zeilen sind auch im Drehplan markiert."},
  {tab:"today",sel:"#view .toff",t:"Offline am Set",x:"Lädt die PDF-Seiten und Floorplans aller Tage aufs Gerät – sie öffnen sich dann auch ohne Empfang."},
  {tab:"plan",sel:'nav.tabs [data-tab="plan"]',t:"Schedule",x:"Der Drehplan Tag für Tag: Szenen, Motive und Zeiten. Mit «Script» öffnest du eine Szene im Drehbuch, die Kamera zeigt Blocking-Fotos und -Filme."},
  {tab:"plan",day:"shoot",sel:"#view .stripwrap",t:"Tage wählen",x:"Wische durch die Tage: PREP, OFF, TRAVEL und die Drehtage D01, D02 … Heute ist hervorgehoben."},
  {tab:"plan",day:"shoot",sel:"#view .dayhead .pvb",t:"Anzeigeoptionen",x:"Blende im Drehplan ein oder aus, was du sehen willst: Info, Szenenbeschrieb, Cast, Adresse und Blocking. Deine Auswahl bleibt gespeichert."},
  {tab:"plan",day:"shoot",sel:"#view .dayhead .dpub",t:"1st / 2nd Unit",x:"Wähle, welche Units du siehst – zum Beispiel nur die 2nd Unit. Ist eine Unit an diesem Tag nicht im Einsatz, ist ihr Knopf blass."},
  {tab:"plan",day:"prep",sel:"#view .ppi .calbtn:not(.mailbtn)",t:"Termin in den Kalender",x:"Mit dem Kalender-Knopf übernimmst du einen Termin direkt in deinen Kalender (Handy oder Computer)."},
  {tab:"plan",day:"prep",sel:"#view .ppi .mailbtn",t:"E-Mail-Verteiler",x:"Der Brief-Knopf öffnet eine E-Mail an alle Teilnehmenden dieses Termins – praktisch für kurzfristige Infos."},
  {tab:"dispo",sel:'nav.tabs [data-tab="dispo"]',t:"Callsheet",x:"Die Dispo des Drehtags: Crew Call, Drehbeginn, Wrap, Locations und Cast."},
  {tab:"loc",sel:'nav.tabs [data-tab="loc"]',t:"Locations",x:"Alle Motive mit Adresse, Karte und den Szenen, die dort gedreht werden."},
  {tab:"loc",sel:"#view .mapbtn",t:"Karte",x:"«Map» öffnet die Karte mit allen Drehorten – praktisch für die Anfahrt."},
  {tab:"loc",sel:"#scall",t:"Szenen",x:"«Szenen» klappt bei allen Motiven die Szenen auf oder zu – so siehst du auf einen Blick, was wo gedreht wird."},
  {tab:"loc",sel:"#view .lch",t:"Ein Motiv",x:"Tippe auf ein Motiv: Adresse, Karte, Floorplans und die Szenen, die dort gedreht werden."},
  {tab:"crew",sel:'nav.tabs [data-tab="crew"]',t:"Crew",x:()=>L("Die Crewliste nach Abteilungen.")+(vok("phone")||vok("email")?" "+L("Mit Telefon und E-Mail – ein Tipp genügt zum Anrufen oder Schreiben."):"")},
  {tab:"crew",sel:"#view .admv",t:"Zusatzinfos",x:"Je nach Berechtigung: Essen, Geburtstage, Kontoinfos und alle Kontakte als VCF."},
  {tab:"script",sel:'nav.tabs [data-tab="script"]',t:"Script",x:"Das Drehbuch mit Suche."},
  {tab:"cater",sel:'nav.tabs [data-tab="cater"]',t:"Catering",x:"Alle Essenswünsche, Unverträglichkeiten und Allergien der Crew auf einen Blick."},
  {tab:"cater",sel:"#view .catmenus",t:"Lunch-Menüs",x:"Hier trägst du pro Drehtag und Unit die Menüs ein – sie erscheinen im Drehplan und im Callsheet beim Lunch.",need:()=>typeof canMenu==="function"&&canMenu()&&tabsOn().includes("cater")},
  {tab:"info",sel:'nav.tabs [data-tab="info"]',t:"Info",x:"Allgemeine Infos zur Produktion und zur App."},
  {tab:"plan",sel:"header .lang",demo:"lang",t:"Sprache",x:"Hier wechselst du die Sprache der App – so sieht sie zum Beispiel auf Englisch aus. Mit «Weiter» geht es in deiner Sprache weiter."},
  {tab:"plan",sel:"#thmb",demo:"theme",t:"Hell / Dunkel",x:"Mit der Sonne wechselst du zwischen dunkler und heller Darstellung – hell ist draussen bei Sonne gut lesbar. Mit «Weiter» kommt deine Einstellung zurück."},
  {tab:"plan",sel:"#searchBtn",t:"Suche",x:"Sucht über alles: Szenen, Rollen, Personen, Locations."},
  {tab:"my",sel:"#myCalBtn",t:"Meine Termine",x:"Alle deine kommenden Termine an einem Ort – mit «In den Kalender» und der Glocke für Push-Nachrichten."},
  {tab:"my",sel:"#view [data-mcself]",need:()=>can("mycal.all")||isAdmin(),t:"Termine anderer",x:"Tippe einen Namen ein, um die Termine einer anderen Person zu sehen. Das Haus bringt dich zu deinen eigenen zurück."},
  {tab:"my",sel:"#view [data-mcall]",t:"Kalender-Export",x:"«Alle in den Kalender» übernimmt alle deine Termine auf einmal; mit dem Kalender-Knopf bei jedem Termin einzeln."},
  {tab:"my",sel:"#view .pbell",t:"Push-Glocke",x:"Mit der Glocke schaltest du die Erinnerung für einzelne Termine aus oder ein."},
  {tab:"my",sel:"#view [data-oeadd]",need:()=>can("events.add"),t:"Termin hinzufügen",x:"Mit «+ Termin» legst du einen eigenen Termin an und wählst, wer ihn sieht: alle, Rollen, Abteilungen oder einzelne Personen. Er erscheint auch im Drehplan und in der Prep-Planung am jeweiligen Tag."},
  {tab:"my",sel:"#view [data-oegc]",t:"Google Kalender",x:"Wähle Termine aus dem Google Kalender aus und bestimme, wer sie sieht. Ändert sich ein Termin dort, wird er hier automatisch nachgeführt."},
  {tab:"plan",sel:"#bcBtn",need:()=>can("push.send"),t:"Push-Nachricht senden",x:"Mit dem Briefumschlag schickst du sofort eine Push-Nachricht an alle – oder nur an bestimmte Rollen und Abteilungen."},
  {tab:"acct",sel:"#acctBtn",t:"Mein Konto",x:"Profil, Push-Nachrichten, hell/dunkel, Passwort und Abmelden. Hier kannst du diese Tour jederzeit neu starten."},
  {tab:"acct",sel:"#view .acsub",t:"Bereiche",x:"Profil, Essen, Push und App. Unter «App» findest du Darstellung, Sprache, Offline, Today und das App-Icon."},
  {tab:"acct",acsub:"note",sel:"#view .pushsec",t:"Push-Nachrichten",x:"Wähle, ob du bei Änderungen am Drehplan, bei neuen Callsheets und bei Änderungen der Prep-Planung benachrichtigt wirst – und wann du an deine Termine erinnert wirst. Ein Tipp auf die Nachricht öffnet direkt den betroffenen Tag."},
  {tab:"acct",acsub:"pro",sel:'#view form[data-af="pf"]',t:"Profil",x:"Name, Telefon, E-Mail, Sprache und Geburtstag – so findet dich die Crew in der Crewliste."},
  {tab:"acct",acsub:"food",sel:"#view .only-food",t:"Essen",x:"Ernährung, Unverträglichkeiten und Allergien – das sieht das Catering."},
  {tab:"acct",acsub:"app",sel:"#view .acpage .psec",t:"App-Einstellungen",x:"Hell oder dunkel, Sprache, Offline-Daten, die Startseite Today, das App-Icon und diese Tour."},
    /* App-Verwaltung: only what the person may use, each part in one sentence */
  {tab:"admin",sel:"#admBtn",need:()=>canAdm(),t:"App-Verwaltung",x:"Das Zahnrad öffnet die Verwaltung. Du siehst nur die Teile, für die du Rechte hast."},
  {tab:"admin",asub:"users",sel:'#view .asub [data-asub="users"]',need:()=>can("users.view")||can("users.invite")||can("users.requests")||can("users.edit"),t:"User",x:"Benutzende einladen, Anfragen freischalten, Profile ändern und Rollen zuweisen."},
  {tab:"admin",asub:"roles",sel:'#view .asub [data-asub="roles"]',need:()=>canRoleEdit()||canRoleAssign()||can("roles.view"),t:"Access",x:"Rollen und ihre Rechte. Unter «Wer hat welchen Zugriff?» schaltest du mit dem Stift ein Recht direkt für eine Rolle ein oder aus."},
  {tab:"admin",asub:"docs",sel:'#view .asub [data-asub="docs"]',need:()=>can("settings"),t:"Docs",x:"Die Texte der Einladungs-Mails und der Willkommensnachricht."},
  {tab:"admin",asub:"set",sel:'#view .asub [data-asub="set"]',need:()=>can("settings"),t:"App",x:"Aktualisierung aus der Dropbox, Sprachen, Bereiche, eigene Termine und Google Kalender, Push, Tour und Assistent ein- oder ausschalten."},
  {tab:"admin",asub:"log",sel:'#view .asub [data-asub="log"]',need:()=>isAdmin()||can("audit.view"),t:"Log/Tests",x:"Automatische Tests, «Berechtigungen testen», «Dokumente prüfen» und wer was geändert hat."},
  {tab:"admin",asub:"test",sel:'#view .asub [data-asub="test"],#view .dcktab .dcksec',need:()=>!isAdmin()&&can("data.check"),t:"Dokumente prüfen",x:"Vergleicht Drehplan, Drehbuch, Locations, Prep und Callsheets und zeigt Unstimmigkeiten."},
  {tab:"plan",sel:"#chatFab",t:"Assistent",x:"Frag den Assistenten, z. B. «Wo drehen wir morgen?» – er kennt die Daten der App."}
];
const TOUR={i:-1,steps:[],el:null};
const tourEl=st=>{let e=document.querySelector(st.sel);for(let k=0;e&&k<(st.up||0);k++)e=e.parentElement;if(!e||e.hidden||e.closest("[hidden]"))return null;const r=e.getBoundingClientRect();return r.width&&r.height?e:null};
function tourDay(kind){const t=todayISO();if(kind==="shoot"){const sd=S.days.filter(x=>x.kind==="shoot");const d=sd.find(x=>x.date>=t)||sd[0];return d?d.id:null}
  if(kind==="prep"){const pp=(S.prepro||[]).filter(d=>arr(d.items).some(i=>i.crew||i.cast));const d=pp.find(x=>x.date>=t)||pp[0];return d?"prep:"+d.date:null}return null}
/* demonstrations (language, light/dark) are undone as soon as the step is left */
function tourDemo(st){
  const want=st&&st.demo,o=TOUR.orig||(TOUR.orig={});
  if(o.lang&&want!=="lang"){LANG=o.lang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;delete o.lang;render()}
  if(o.theme&&want!=="theme"){setTheme(o.theme);delete o.theme}
  if(want==="lang"&&!o.lang){const to=(APPLANGS||[]).find(l=>l!==LANG&&l==="en")||(APPLANGS||[]).find(l=>l!==LANG);if(to){o.lang=LANG;LANG=to;applyStatic();render()}}
  if(want==="theme"&&!o.theme){o.theme=getTheme();setTheme(o.theme==="dark"?"light":"dark")}
}
function tourShow(st){if(st.acsub&&typeof ACSUB!=="undefined"&&ACSUB!==st.acsub){ACSUB=st.acsub;if(S.tab===st.tab)render()}if(st.asub&&typeof ADM!=="undefined"&&ADM.sub!==st.asub){ADM.sub=st.asub;if(S.tab===st.tab)render()}if(st.day){const id=tourDay(st.day);if(id&&S.day!==id){S.day=id;if(S.tab===st.tab)render()}}if(S.tab!==st.tab){S.tab=st.tab;S.srcOpen=false;render()}else if(st.day)render();window.scrollTo(0,0);const e=tourEl(st);if(e){const r=e.getBoundingClientRect();if(r.bottom>innerHeight-70||r.top<0)e.scrollIntoView({block:"center"})}return e}
function tourDoneLocal(){try{return !!(localStorage.getItem("tourDone:"+(ME&&ME.uid))||localStorage.getItem("tour"))}catch(_){return false}}
/* the tour starts by itself only once per person: marked right when it is offered (this device, the synced view settings and the profile) */
/* app icon status for «Mein Konto»: checked whenever the page is opened (at most every 20 s) */
function a2stCheck(){if(typeof window.a2hsCheck!=="function")return;const now=Date.now();if(window.A2ST&&(window.A2ST.busy||now-window.A2ST.at<20000))return;
  window.A2ST=Object.assign({},window.A2ST,{busy:true,at:now});window.a2hsCheck().then(v=>{const ch=!window.A2ST||window.A2ST.v!==v;window.A2ST={v,at:Date.now(),busy:false};if(ch)render()}).catch(()=>{window.A2ST={v:"unknown",at:Date.now(),busy:false}})}
async function tourMark(how){
  store("nv",NEWS_VER);savePrefs(); /* new people get to know the new features in the tour */
  const at=new Date().toISOString(),v=how+"|"+at;try{localStorage.setItem("tourDone:"+(ME&&ME.uid),v)}catch(_){}store("tour",v);
  try{if(MEMBER&&ME){const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),{tour:how,tourAt:at});MEMBER.tour=how;MEMBER.tourAt=at}}catch(err){console.warn("tour",err&&err.code||err)}
}
/* «Neu in der Crew-App»: shown once to everybody who already used the app (did or skipped the tour) – new people see it in the tour */
const NEWS_VER="2026-10-17b";
/* «Neu in der Crew-App»: only the points that matter for this person (rights) */
const NEWS_ITEMS=[
 [()=>vok("mycal"),{de:"<b>Weitere Termine:</b> zusätzliche Termine (z. B. Fittings, Essen) stehen in «Meine Termine», im Drehplan und in der Prep-Planung.",fr:"<b>Autres rendez-vous :</b> des rendez-vous supplémentaires (essayages, repas…) figurent dans « Mes rendez-vous », le plan et le planning de préparation.",it:"<b>Altri appuntamenti:</b> appuntamenti aggiuntivi (prove costumi, cene…) sono in «I miei appuntamenti», nel piano e nella pianificazione prep.",en:"<b>More appointments:</b> extra appointments (fittings, dinners…) appear in “My appointments”, the schedule and the prep schedule."}],
 [()=>can("events.add"),{de:"<b>Termine erstellen:</b> mit «+ Termin» in «Meine Termine» und wählen, wer sie sieht – auch aus dem Google Kalender.",fr:"<b>Créer des rendez-vous :</b> avec « + Rendez-vous » dans « Mes rendez-vous », en choisissant qui les voit – aussi depuis Google Agenda.",it:"<b>Creare appuntamenti:</b> con «+ Appuntamento» in «I miei appuntamenti», scegliendo chi li vede – anche da Google Calendar.",en:"<b>Create appointments:</b> with “+ Appointment” in “My appointments”, choosing who sees them – also from Google Calendar."}],
 [()=>can("data.check")||isAdmin(),{de:"<b>Dokumente prüfen:</b> vergleicht Drehplan, Drehbuch, Locations, Prep und Callsheets und zeigt Unstimmigkeiten.",fr:"<b>Vérifier les documents :</b> compare plan, scénario, décors, prép. et feuilles de service et signale les incohérences.",it:"<b>Verificare i documenti:</b> confronta piano, sceneggiatura, location, prep e ordini del giorno e segnala le incongruenze.",en:"<b>Check documents:</b> compares schedule, script, locations, prep and callsheets and shows inconsistencies."}],
 [()=>isAdmin(),{de:"<b>Für Admins:</b> Rechte direkt in «Access» umschalten, «Berechtigungen testen» und Tests von Hand starten unter Log/Tests.",fr:"<b>Pour les admins :</b> changer les droits directement dans « Access », « Tester les autorisations » et lancer les tests sous Journal/tests.",it:"<b>Per gli admin:</b> cambiare i diritti direttamente in «Access», «Testare le autorizzazioni» e avviare i test in Registro/test.",en:"<b>For admins:</b> switch rights directly in “Access”, “Test permissions” and start the tests under Log/tests."}],
];
const NEWS_TXT={de:{t:"Neu in der Crew-App",f:"Die Tour zeigt dir alles, was du mit deinen Rechten nutzen kannst.",tour:"Tour ansehen",ok:"Los geht’s"},
 fr:{t:"Nouveau dans l’app",f:"La visite te montre tout ce que tu peux utiliser avec tes droits.",tour:"Voir la visite",ok:"C’est parti"},
 it:{t:"Novità nell’app",f:"Il tour ti mostra tutto ciò che puoi usare con i tuoi diritti.",tour:"Guarda il tour",ok:"Si parte"},
 en:{t:"New in the crew app",f:"The tour shows you everything you can use with your rights.",tour:"Take the tour",ok:"Let’s go"}};
function newsDue(){let v="";try{v=localStorage.getItem("nv")||""}catch(_){}return v!==NEWS_VER&&!document.getElementById("news")}
function showNews(){
  const T=Object.assign({},NEWS_TXT[LANG]||NEWS_TXT.en,{p:NEWS_ITEMS.filter(([ok])=>{try{return ok()}catch(_){return false}}).map(([,tx])=>tx[LANG]||tx.en)}),d=document.createElement("div");d.id="news";d.className="a2hs";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  d.innerHTML='<div class="a2box wlbox"><h3>'+esc(T.t)+'</h3>'+T.p.map(x=>'<p>'+x+'</p>').join("")+'<p class="ghint">'+T.f+'</p><div class="a2b"><button type="button" data-nwtour>'+esc(T.tour)+'</button><button type="button" class="pri" data-nwok>'+esc(T.ok)+'</button></div></div>';
  const done=()=>{store("nv",NEWS_VER);savePrefs();d.remove()};
  d.addEventListener("click",e=>{if(e.target.closest("[data-nwok]")){done();setTimeout(maybePushHint,600)}else if(e.target.closest("[data-nwtour]")){done();tourStart(false)}});
  document.body.appendChild(d);
  /* closed in any way (also ✕): seen */
  const ob=new MutationObserver(()=>{if(!d.isConnected||d.hidden){ob.disconnect();store("nv",NEWS_VER);savePrefs()}});ob.observe(document.body,{childList:true});ob.observe(d,{attributes:true,attributeFilter:["hidden"]});
}
async function maybeTour(){
  if(!ME||ONBOARD||WELCOME_OPEN||TOUR.el||TOUR.pending)return;
  if(typeof a2hsDue==="function"&&a2hsDue()&&!TOUR.a2asked&&typeof a2hsAuto==="function"&&a2hsAuto()){TOUR.a2asked=true} /* install dialog comes by itself with the next tap */
  if(typeof a2hsDue==="function"&&a2hsDue()&&!TOUR.a2asked){TOUR.a2asked=true;showA2hs();const s=document.getElementById("a2hs");if(s){const ob=new MutationObserver(()=>{if(s.hidden||!s.isConnected){ob.disconnect();setTimeout(maybeTour,400)}});ob.observe(s,{attributes:true,attributeFilter:["hidden"]})}return}
  if(pushHintDue()){TOUR.afterHint=true;maybePushHint();return}
  if(!window.TOUREN||(MEMBER&&MEMBER.tour)||tourDoneLocal()){if(newsDue()){showNews();return}setTimeout(maybePushHint,800);return}
  TOUR.pending=true;setTimeout(()=>{TOUR.pending=false;if(!TOUR.el&&!tourDoneLocal()&&!(MEMBER&&MEMBER.tour)){tourMark("shown");tourStart(true)}},700);
}
function tourStart(ask){
  if(TOUR.el)TOUR.el.remove();if(CHAT.open){CHAT.open=false;chatPanel()}
  TOUR.prev={tab:S.tab,day:S.day};
  /* show a shooting day so the display options and unit buttons can be explained */
  {const t=todayISO(),cur=S.days.find(x=>x.id===S.day);if(S.tab!=="plan"||!cur||cur.kind!=="shoot"){const sd=S.days.filter(x=>x.kind==="shoot");const d=sd.find(x=>x.date>=t)||sd[0];S.tab="plan";if(d)S.day=d.id;render()}}
  {const keep=S.tab,navOn=t=>{const b=document.querySelector('nav.tabs [data-tab="'+t+'"]');return !!(b&&!b.hidden)};
    TOUR.steps=TOUR_STEPS.filter(st=>{try{if(st.need&&!st.need())return false;return !!tourShow(st)||(st.sel.startsWith("#view")&&navOn(st.tab))}catch(_){return false}});S.tab=keep;render()}
  window.scrollTo(0,0);TOUR.i=ask?-1:0;
  const o=document.createElement("div");o.id="tour";o.className="tour";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.innerHTML='<div class="tspot"></div><div class="tour-card" role="document"></div>';
  o.addEventListener("click",e=>{const b=e.target.closest("[data-tour]");if(!b)return;const a=b.dataset.tour;
    if(a==="next")tourGo(TOUR.i+1);else if(a==="back")tourGo(TOUR.i-1);else if(a==="skip")tourSkipInfo();else if(a==="skipok")tourEnd("skip",true);else if(a==="done")tourEnd("done")});
  document.body.appendChild(o);TOUR.el=o;tourGo(TOUR.i);
  addEventListener("resize",tourPlace);
}
function tourGo(i){
  const o=TOUR.el;if(!o)return;TOUR.i=i;const n=TOUR.steps.length,c=o.querySelector(".tour-card"),sp=o.querySelector(".tspot");
  if(i<0||i>=n)tourDemo(null);
  if(i<0){sp.hidden=true;c.className="tour-card center";
    c.innerHTML='<h3>'+L("Kurze Tour durch die App?")+'</h3><p>'+L("In einer Minute zeigen wir dir die wichtigsten Funktionen. Du kannst die Tour später jederzeit unter «Mein Konto» starten.")+'</p><div class="tbtns"><button type="button" class="lnk" data-tour="skip">'+L("Überspringen")+'</button><button type="button" class="pri" data-tour="next">'+L("Tour starten")+'</button></div>';return}
  if(i>=n){sp.hidden=true;c.className="tour-card center";
    c.innerHTML='<h3>'+L("Fertig!")+'</h3><p>'+L("Viel Spass mit der App. Die Tour findest du jederzeit wieder unter «Mein Konto».")+'</p><div class="tbtns"><button type="button" class="pri" data-tour="done">'+L("Los geht's")+'</button></div>';return}
  const s=TOUR.steps[i];tourDemo(s);if(!tourShow(s)){const dir=i>=(TOUR.last==null?-1:TOUR.last)?1:-1;TOUR.steps.splice(i,1);return tourGo(dir>0?i:i-1)}TOUR.last=i;sp.hidden=false;c.className="tour-card";
  c.innerHTML='<div class="tprog">'+(i+1)+' / '+n+'</div><h3>'+esc(L(s.t))+'</h3><p>'+esc(typeof s.x==="function"?s.x():L(s.x))+'</p><div class="tbtns"><button type="button" class="lnk" data-tour="skip">'+L("Überspringen")+'</button><span></span>'+(i>0?'<button type="button" class="sec" data-tour="back">'+L("Zurück")+'</button>':'')+'<button type="button" class="pri" data-tour="next">'+L(i===n-1?"Fertig":"Weiter")+'</button></div>';
  tourPlace();try{c.querySelector(".pri").focus({preventScroll:true})}catch(_){}
}
function tourPlace(){
  const o=TOUR.el;if(!o||TOUR.i<0||TOUR.i>=TOUR.steps.length)return;const e=tourEl(TOUR.steps[TOUR.i]);if(!e)return;
  const r=e.getBoundingClientRect(),pad=6,sp=o.querySelector(".tspot"),c=o.querySelector(".tour-card");
  Object.assign(sp.style,{left:(r.left-pad)+"px",top:(r.top-pad)+"px",width:(r.width+2*pad)+"px",height:(r.height+2*pad)+"px"});
  const vh=innerHeight,vw=innerWidth,cw=Math.min(340,vw-24);c.style.width=cw+"px";
  const ch=c.offsetHeight||170,below=r.bottom+14+ch<vh-8,above=r.top-14-ch>8;
  c.style.top=(below?r.bottom+14:above?r.top-14-ch:Math.max(8,vh-ch-90))+"px";
  c.style.left=Math.min(vw-cw-12,Math.max(12,r.left+r.width/2-cw/2))+"px";
}
/* skipped: point at «Mein Konto», where the tour can be started again any time */
function tourSkipInfo(){
  const o=TOUR.el;if(!o){tourEnd("skip");return}tourDemo(null);tourMark("skip");
  if(TOUR.prev){if(TOUR.prev.day)S.day=TOUR.prev.day;S.tab=["acct","admin"].includes(TOUR.prev.tab)?TOUR.prev.tab:"plan";render();window.scrollTo(0,0)}
  const e=document.getElementById("acctBtn"),sp=o.querySelector(".tspot"),c=o.querySelector(".tour-card");
  c.className="tour-card";c.innerHTML='<h3>'+L("Tour übersprungen")+'</h3><p>'+L("Kein Problem – du kannst die Tour jederzeit neu starten: oben auf «Mein Konto» tippen und dort «Tour starten» wählen.")+'</p><div class="tbtns"><span></span><button type="button" class="pri" data-tour="skipok">'+L("OK")+'</button></div>';
  if(e&&!e.hidden){const r=e.getBoundingClientRect(),pad=6;sp.hidden=false;Object.assign(sp.style,{left:(r.left-pad)+"px",top:(r.top-pad)+"px",width:(r.width+2*pad)+"px",height:(r.height+2*pad)+"px"});
    const cw=Math.min(340,innerWidth-24);c.style.width=cw+"px";c.style.top=(r.bottom+14)+"px";c.style.left=Math.min(innerWidth-cw-12,Math.max(12,r.left+r.width/2-cw/2))+"px"}
  else{sp.hidden=true;c.className="tour-card center"}
  try{c.querySelector(".pri").focus({preventScroll:true})}catch(_){}
}
async function tourEnd(how,marked){
  tourDemo(null);if(TOUR.el){TOUR.el.remove();TOUR.el=null}removeEventListener("resize",tourPlace);
  if(TOUR.prev){if(TOUR.prev.day)S.day=TOUR.prev.day;S.tab=["acct","admin"].includes(TOUR.prev.tab)?TOUR.prev.tab:"plan";render();window.scrollTo(0,0)}TOUR.prev=null;setTimeout(maybePushHint,800);
  if(!marked)tourMark(how);
}

/* one-time note about push notifications (existing and new users), with a short setup right in the note */
/* asked once per device (when push is on but this device has not allowed it yet) */
const hintDone=()=>{try{return !!localStorage.getItem("pushask:"+(ME&&ME.uid))}catch(_){return false}},hintMark=()=>{try{localStorage.setItem("pushask:"+(ME&&ME.uid),"1")}catch(_){}};
function pushHintDue(){if(!ME||window.PUSHEN===false||hintDone())return false;const c=pushCfg();if(!c.on&&c.hint)return false;if(pushOK())return Notification.permission==="default";return isIOS()&&!pushStandalone()}
function maybePushHint(){
  if(!ME||ONBOARD||WELCOME_OPEN||TOUR.el||document.getElementById("pushhint")||window.PUSHEN===false||hintDone())return;const c=pushCfg();if(!c.on&&c.hint)return;
  const ios=!pushOK()&&isIOS()&&!pushStandalone();if(!pushOK()&&!ios)return;
  if(pushOK()&&Notification.permission!=="default"){hintMark();return}
  const d=document.createElement("div");d.id="pushhint";d.className="a2hs";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  const types=PUSH_TYPES.filter(x=>vok(x[2])),nws=PUSH_NEWS.filter(x=>vok(x[2]));
  d.innerHTML='<div class="a2box phbox"><span class="wlbeta">'+L("Neu")+'</span><h3>'+L("Push-Nachrichten")+'</h3><p>'+L("Die App erinnert dich auf Wunsch vor deinen Terminen und meldet neue Drehpläne, Callsheets und Drehbuch-Versionen – auch wenn sie geschlossen ist.")+'</p>'+
    (ios?'<p class="ghint">'+L("Auf dem iPhone/iPad: zuerst die App über «Teilen → Zum Home-Bildschirm» hinzufügen und von dort öffnen – dann kannst du Push-Nachrichten einschalten.")+'</p><div class="a2b"><button type="button" class="pri" data-ph="ok">'+L("OK")+'</button></div>':
    '<label class="phl">'+L("Erinnern")+'<select data-phlead>'+PUSH_LEADS.map(([v,t])=>'<option value="'+v+'"'+(v===c.lead?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>'+
    '<p class="ahint"><b>'+L("Für welche Termine?")+'</b></p>'+types.map(([k,t])=>'<label class="ck"><input type="checkbox" data-phtype="'+k+'"'+(c.types[k]?' checked':'')+'> '+L(t)+'</label>').join("")+
    (nws.length?'<p class="ahint"><b>'+L("Bei Änderungen benachrichtigen")+'</b></p>'+nws.map(([k,t])=>'<label class="ck"><input type="checkbox" data-phnews="'+k+'" checked> '+L(t)+'</label>').join(""):'')+
    '<p class="ghint">'+L("Einzelne Termine schaltest du mit der Glocke in «Meine Termine» aus; alles Weitere unter «Mein Konto».")+'</p>'+
    '<div class="a2b"><button type="button" class="lnk" data-ph="no">'+L("Nicht jetzt")+'</button><button type="button" class="pri" data-ph="on">'+L("Einschalten")+'</button></div>')+'</div>';
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-ph]");if(!b){if(e.target.closest("button")&&!e.target.closest("select")){const c=pushCfg();c.hint=1;pushSave(c);d.remove()}return}const c=pushCfg();c.hint=1;
    if(b.dataset.ph==="on"){c.lead=+(d.querySelector("[data-phlead]")||{value:c.lead}).value||c.lead;d.querySelectorAll("[data-phtype]").forEach(x=>c.types[x.dataset.phtype]=x.checked);d.querySelectorAll("[data-phnews]").forEach(x=>c.news[x.dataset.phnews]=x.checked);c.on=true;pushSave(c);const cont=TOUR.afterHint;TOUR.afterHint=false;d.remove();await pushEnable();if(cont)setTimeout(maybeTour,600);if(Notification.permission==="granted")showMsg(L("Push-Nachrichten sind eingeschaltet."),3500)}
    else{pushSave(c);d.remove();if(b.dataset.ph==="no")showMsg(L("Du kannst Push-Nachrichten jederzeit unter «Mein Konto» einschalten."),4000)}});
  hintMark();const obs=new MutationObserver(()=>{if(!d.isConnected){obs.disconnect();if(TOUR.afterHint){TOUR.afterHint=false;setTimeout(maybeTour,400)}}});obs.observe(document.body,{childList:true});
  document.body.appendChild(d);
}
const tourInfo=m=>!m?"":m.tour==="done"?L("Tour gemacht"):m.tour==="skip"?L("Tour übersprungen"):m.tour==="shown"?L("Tour angefangen"):L("Tour offen");
