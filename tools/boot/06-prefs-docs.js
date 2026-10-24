import {L,LANG,S,deG,esc,saveBtn,setSPT,setTheme} from "../base/10-core.js";
import {render} from "../base/15-script-tab.js";
import {onStore} from "../base/16-interaction.js";
import {showMsg} from "../base/20-data-start.js";
import {ME,can,fb,withTimeout} from "./03-core-firebase.js";
import {pushSyncSoon} from "./07-push.js";
import {ADM,SECS} from "./12a-admin-core.js";
/* ---- view settings per user: kept on this device and in Firestore (prefs/{uid}), restored on every device and after a restart ---- */
export const PREFKEYS=["theme","pv","sv","lv","spt","uf","pu","welcomeAck","push","chat","tour","today","offline","nv"];export let PREFT=null,PREFAPPLY=false,PREFOK=false;export const PREFX=["rc","scrv","csb","iconhint","scwa","scwan","scwtd","scwtb","scwte","scwtl","scwtm","scwtw"];
/* the notices of p.x (or the older single fields) */
export const prefX=p=>{let x={};try{x=JSON.parse(p&&p.x||"{}")||{}}catch(_){}for(const k of PREFX)if(typeof(p&&p[k])==="string"&&x[k]==null)x[k]=p[k];return x};
onStore(k=>{if(!PREFAPPLY&&PREFKEYS.includes(k)){try{localStorage.setItem("prefsLocalAt",String(Date.now()))}catch(_){}savePrefsSoon()}});
export function savePrefsSoon(){clearTimeout(PREFT);PREFT=setTimeout(savePrefs,1500)}
/* a change made just before closing or reloading is saved right away (before, the older copy online won on the next start) */
const prefsFlush=()=>{if(PREFT){clearTimeout(PREFT);PREFT=null;savePrefs()}};
addEventListener("pagehide",prefsFlush);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")prefsFlush()});
export async function savePrefs(){
  if(!ME||!ME.uid)return;const p={};
  /* at most 400 characters per setting – but JSON is never cut (broken JSON would reset the setting elsewhere): the push settings drop their
     oldest switched-off reminders, anything else too long stays on this device only */
  const fit=(k,v)=>{v=String(v);if(v.length<=400)return v;if(k==="push"){try{const c=JSON.parse(v),o=c&&c.off&&typeof c.off==="object"?c.off:null;
      if(o){const ks=Object.keys(o).sort((a,b)=>String(o[a]).localeCompare(String(o[b])));while(ks.length&&JSON.stringify(c).length>400)delete o[ks.shift()];const t=JSON.stringify(c);if(t.length<=400)return t}}catch(_){}}return null};
  try{for(const k of PREFKEYS){const v=localStorage.getItem(k);if(v!==null){const f=fit(k,v);if(f!==null)p[k]=f}}}catch(_){return}
  /* notices already seen (role change, callsheet beta …) share ONE field «x»: the rules allow 16 fields = 14 settings + lt + x (before, they were dropped when all settings were set) */
  try{const x={};for(const k of PREFX){const v=localStorage.getItem(k);if(v!==null)x[k]=v.slice(0,60)}if(Object.keys(x).length)p.x=JSON.stringify(x)}catch(_){}
  let lt=0;try{lt=+localStorage.getItem("prefsLocalAt")||0}catch(_){}PREFT=null;
  /* before the copy online was read, nothing is written (it would replace settings made on another device); a change is kept by prefsLocalAt and saved after loading */
  if(!PREFOK)return;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"prefs",ME.uid),Object.assign(p,{lt}))}catch(err){console.warn("prefs",err&&err.code||err)}
}
function applyPrefs(p){
  if(!p||typeof p!=="object")return;PREFAPPLY=true;
  try{
    for(const k of PREFKEYS)if(typeof p[k]==="string")try{localStorage.setItem(k,p[k])}catch(_){}
    {const x=prefX(p);for(const k of PREFX)if(typeof x[k]==="string")try{localStorage.setItem(k,x[k])}catch(_){}}
    const js=k=>{try{return JSON.parse(p[k])}catch(_){return null}};
    for(const [k,o] of [["pv",S.pv],["sv",S.sv],["lv",S.lv]]){const x=js(k);if(x&&typeof x==="object")for(const i in o)if(typeof x[i]==="boolean")o[i]=x[i]}
    for(const k of ["uf","pu"]){const x=js(k);if(x&&typeof x==="object")S[k]=Object.assign({},S[k],...["1","2","3"].filter(u=>typeof x[u]==="boolean").map(u=>({[u]:x[u]})))}
    if(typeof p.spt==="string")setSPT(p.spt==="light"||p.spt==="dark"?p.spt:null);
    if(p.theme==="light"||p.theme==="dark")setTheme(p.theme);
  }finally{PREFAPPLY=false}
  if(typeof p.push==="string")pushSyncSoon();
  render();
}
export async function loadPrefs(){
  if(!ME||!ME.uid)return;
  try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"prefs",ME.uid)),10000,"prefs");
    let lt=0;try{lt=+localStorage.getItem("prefsLocalAt")||0}catch(_){}
    /* settings changed on this device after the copy online was saved: this device wins and is saved */
    PREFOK=true;if(d.exists()&&!(lt&&(+d.data().lt||0)<lt))applyPrefs(d.data());else savePrefs()}catch(err){console.warn("prefs",err&&err.code||err);addEventListener("online",()=>{if(!PREFOK)loadPrefs()},{once:true})}
}
/* ---- documents: every text the app sends or shows (mails, welcome note, disclaimer); editable under App-Verwaltung → Einstellungen → Dokumente ---- */
const DOCDEF={
 maint:{t:"Wartungshinweis",use:"Erscheint bei jedem Öffnen der App als Hinweis mit «OK», solange er eingeschaltet ist. Titel und Text frei wählbar.",
  subject:"Wartungsarbeiten",
  body:"Gerade bauen wir das Coverday-Management in die App ein. Wegen der Drehplanänderung zwischen DT03 und DT04 kann es sein, dass DT03 und DT04 vorübergehend falsch angezeigt werden. Im Zweifel gilt das Callsheet aus der Dropbox. Danke für dein Verständnis!"},
 disclaimer:{t:"Disclaimer (BETA-Hinweis)",use:"Wird in der Willkommensnachricht und in den Mails als {disclaimer} eingesetzt.",
  body:"Hinweis: Die App ist eine BETA-Testversion. Alle angezeigten Daten sind ohne Gewähr. Die Produktion und das Entwicklungsteam übernehmen KEINE Garantie für die Richtigkeit, Vollständigkeit oder Aktualität der Daten. Verbindlich sind immer die offiziellen Unterlagen der Produktion (Drehplan, Callsheet, Dispo)."},
 welcome:{t:"Willkommensnachricht",use:"Erscheint beim ersten Login und muss bestätigt werden. Betreff = Titel, Absätze durch eine Leerzeile trennen.",
  subject:"Herzlich willkommen in der TSCHUGGER-App!",
  body:"Schön, dass du dabei bist. Hier findest du Drehplan, Callsheets, Crewliste, Locations und Drehbuch von TSCHUGGER Tigerblood an einem Ort.\n\n{disclaimer}\n\nAlle Inhalte sind vertraulich und nur für die Crew bestimmt – bitte nicht weitergeben.\n\nFehler entdeckt oder einen Wunsch? Melde dich bei Stefan Künzler."},
 csbeta:{t:"Neu: Interaktives Callsheet",use:"Erscheint einmalig beim Öffnen der App für alle, die das Callsheet sehen dürfen (Recht «Callsheet sehen»). Titel und Absätze wie bei der Willkommensnachricht; Zeilen mit • bleiben untereinander.",
  subject:"Neu: Interaktives Callsheet (BETA)",
  body:"Hallo {vorname}\n\nDu gehörst zu den Ersten, die das neue interaktive Callsheet sehen. Es zeigt nicht nur die Infos des Drehtags, sondern begleitet auch den Ablauf:\n• Fahrten in drei Schritten: Fahrer vor Ort → unterwegs → angekommen\n• Cast-Durchlauf von Pickup über Call, Kostüm und Maske bis On Set – live für alle sichtbar\n\nDas interaktive Callsheet ist noch in der Testphase (BETA) und kann Fehler enthalten. Im Zweifel gilt das Original-Callsheet (PDF). Fehler und Wünsche meldest du am besten über den Chat-Assistenten in der App oder direkt der Produktion."},
 testwelcome:{t:"Willkommen Test-User",use:"Erscheint einmalig beim Öffnen der App, sobald jemand eine Rolle mit «Test» im Namen hat (z. B. Test-User). Titel und Absätze wie bei der Willkommensnachricht; Zeilen mit • bleiben untereinander.",
  subject:"Willkommen als Test-User 🧪",
  body:"Hallo {vorname}\n\nDu bist jetzt Test-User der Tschugger-Crew-App. Damit siehst du neue Funktionen, die noch nicht für alle eingeführt sind. Sie sind mit BETA markiert.\n\nBitte beachte:\n• Einiges funktioniert eventuell noch nicht oder ändert sich kurzfristig.\n• Die angezeigten Daten können Fehler enthalten. Prüfe Zeiten, Orte und Szenen immer mit den Originaldokumenten (Callsheet, Drehplan, Dispo).\n• Massgebend sind immer die Originaldokumente.\n\nFehler oder Wünsche bitte an Stefan Künzler melden. So hilfst du uns, die App zu verbessern.\n\nDanke fürs Mittesten!"},
 invite:{t:"Einladungs-Mail",use:"Crewliste «Einladungs-Mail schicken» und App-Verwaltung «Einladungsmail».",
  subject:"Dein Zugang zur TSCHUGGER Crew-App",
  body:"Hallo {vorname}\n\ndu bist für die Crew-App von TSCHUGGER Tigerblood freigeschaltet. Dort findest du Drehplan, Callsheets, Crewliste, Locations und das Drehbuch.\n\nSo geht's:\n1. {app}\n2. «Konto erstellen» mit genau dieser E-Mail-Adresse: {email}\n3. Bestätigungs-Mail öffnen und auf den Link tippen – bitte auch im Spam-Ordner nachsehen.\n\n{disclaimer}\n\nBis bald am Set!"},
 invitewa:{t:"Einladung WhatsApp",use:"Crewliste und App-Verwaltung «Per WhatsApp einladen» (öffnet WhatsApp mit diesem Text). Kurz halten; *fett* geht in WhatsApp.",
  body:"Hallo {vorname} 👋\n\ndu bist für die Crew-App von TSCHUGGER Tigerblood freigeschaltet: Drehplan, Callsheets, Crewliste, Locations und Drehbuch.\n\n1. App öffnen: {app}\n2. «Konto erstellen» mit genau dieser E-Mail-Adresse: *{email}*\n3. Bestätigungs-Mail öffnen und auf den Link tippen (auch im Spam nachsehen).\n\nBis bald am Set!"},
 approved:{t:"Freischaltungs-Mail (Zugangsanfrage)",use:"Beim Freischalten einer Anfrage, wenn der automatische Anmelde-Link nicht verschickt werden kann.",
  subject:"Dein Zugang zur TSCHUGGER Crew-App ist freigeschaltet",
  body:"Hallo {vorname}\n\ndein Zugang zur Crew-App von TSCHUGGER Tigerblood ist freigeschaltet. Melde dich hier mit dieser E-Mail-Adresse ({email}) an:\n{app}\n\n{disclaimer}\n\nBis bald am Set!"},
 startpw:{t:"Startpasswort-Mail",use:"«Per Mail schicken» nach «Startpasswort erzeugen».",
  subject:"Dein Zugang zur TSCHUGGER Crew-App",
  body:"Hallo {vorname}\n\ndein Konto für die Crew-App von TSCHUGGER Tigerblood ist bereit:\n{app}\n\nE-Mail: {email}\nStartpasswort: {passwort}\n\nBeim ersten Anmelden legst du ein eigenes Passwort fest.\n\n{disclaimer}\n\nBis bald am Set!"}};

/* default texts in the other languages (German defaults are above) */
const DOCI18N={
 maint:{fr:{subject:"Travaux de maintenance",body:"Nous intégrons en ce moment la gestion des Coverdays dans l'app. En raison du changement du plan de tournage entre DT03 et DT04, DT03 et DT04 peuvent être affichés incorrectement pendant un moment. En cas de doute, la feuille de service dans Dropbox fait foi. Merci de ta compréhension !"},it:{subject:"Lavori di manutenzione",body:"Stiamo integrando la gestione dei Coverday nell'app. A causa della modifica del piano di lavorazione tra DT03 e DT04, DT03 e DT04 potrebbero essere visualizzati in modo errato per un po'. In caso di dubbio vale il foglio di convocazione in Dropbox. Grazie per la comprensione!"},en:{subject:"Maintenance",body:"We are currently building the Coverday management into the app. Because of the schedule change between DT03 and DT04, DT03 and DT04 may be shown incorrectly for a while. If in doubt, the callsheet in Dropbox applies. Thanks for your understanding!"}},
 disclaimer:{hi:{"body": "नोट: यह ऐप BETA परीक्षण संस्करण है। दिखाया गया सारा डेटा बिना गारंटी के है। प्रोडक्शन और डेवलपर्स डेटा के सही, पूर्ण या अद्यतन होने की कोई गारंटी नहीं देते। प्रोडक्शन के आधिकारिक दस्तावेज़ (शेड्यूल, Callsheet, Dispo) ही मान्य हैं।"},fr:{body:"Remarque : l'app est une version de test BETA. Toutes les données affichées sont sans garantie. La production et les développeurs n'assument AUCUNE garantie quant à l'exactitude, l'exhaustivité ou l'actualité des données. Seuls les documents officiels de la production (plan de tournage, callsheet, dispo) font foi."},
  it:{body:"Nota: l'app è una versione di prova BETA. Tutti i dati visualizzati sono senza garanzia. La produzione e gli sviluppatori NON si assumono alcuna garanzia sulla correttezza, completezza o attualità dei dati. Fanno fede sempre i documenti ufficiali della produzione (piano di lavorazione, callsheet, dispo)."},
  en:{body:"Note: the app is a BETA test version. All data shown is without guarantee. The production and the developers accept NO liability for the data being correct, complete or up to date. The official production documents (shooting schedule, callsheet, dispo) are always binding."}},
 welcome:{hi:{"subject": "TSCHUGGER ऐप में आपका स्वागत है!", "body": "आपके साथ होने की खुशी है। यहाँ TSCHUGGER Tigerblood का शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट एक ही जगह मिलेंगे।\n\n{disclaimer}\n\nसारी सामग्री गोपनीय है और केवल Crew के लिए है – कृपया आगे न भेजें।\n\nकोई गलती मिली या कोई सुझाव है? Stefan Künzler से संपर्क करें।"},fr:{subject:"Bienvenue dans l'app TSCHUGGER !",body:"Ravi·e de t'accueillir. Tu trouves ici le plan de tournage, les callsheets, la liste de l'équipe, les locations et le scénario de TSCHUGGER Tigerblood au même endroit.\n\n{disclaimer}\n\nTous les contenus sont confidentiels et réservés à l'équipe – merci de ne pas les diffuser.\n\nUne erreur ou une suggestion ? Contacte Stefan Künzler."},
  it:{subject:"Benvenuta/o nell'app TSCHUGGER!",body:"Che bello averti a bordo. Qui trovi piano di lavorazione, callsheet, lista crew, location e sceneggiatura di TSCHUGGER Tigerblood in un unico posto.\n\n{disclaimer}\n\nTutti i contenuti sono riservati e destinati solo alla crew – per favore non diffonderli.\n\nHai trovato un errore o hai un desiderio? Rivolgiti a Stefan Künzler."},
  en:{subject:"Welcome to the TSCHUGGER app!",body:"Great to have you on board. Here you'll find the shooting schedule, callsheets, crew list, locations and script of TSCHUGGER Tigerblood in one place.\n\n{disclaimer}\n\nAll content is confidential and for the crew only – please do not share it.\n\nFound a mistake or have a wish? Get in touch with Stefan Künzler."}},
 csbeta:{"fr": {"subject": "Nouveau : callsheet interactive (BETA)", "body": "Bonjour {vorname}\n\nTu fais partie des premières personnes à voir la nouvelle callsheet interactive. Elle ne montre pas seulement les infos du jour de tournage, elle accompagne aussi le déroulement :\n• Trajets en trois étapes : chauffeur sur place → en route → arrivé\n• Parcours du cast du pickup au call, costume et maquillage jusqu'au plateau – visible en direct pour tous\n\nLa callsheet interactive est encore en phase de test (BETA) et peut contenir des erreurs. En cas de doute, la callsheet originale (PDF) fait foi. Signale erreurs et souhaits via l'assistant chat de l'app ou directement à la production."}, "it": {"subject": "Novità: callsheet interattivo (BETA)", "body": "Ciao {vorname}\n\nSei tra i primi a vedere il nuovo callsheet interattivo. Non mostra solo le informazioni della giornata di riprese, ma accompagna anche lo svolgimento:\n• Viaggi in tre passi: autista sul posto → in viaggio → arrivato\n• Percorso del cast dal pickup a call, costumi e trucco fino al set – visibile a tutti in tempo reale\n\nIl callsheet interattivo è ancora in fase di test (BETA) e può contenere errori. In caso di dubbio vale il callsheet originale (PDF). Segnala errori e desideri tramite l'assistente chat dell'app o direttamente alla produzione."}, "en": {"subject": "New: interactive callsheet (BETA)", "body": "Hi {vorname}\n\nYou are one of the first to see the new interactive callsheet. It not only shows the information of the shooting day, it also follows the workflow:\n• Rides in three steps: driver on site → on the way → arrived\n• Cast flow from pickup through call, costume and make-up to on set – live for everyone\n\nThe interactive callsheet is still in a test phase (BETA) and may contain errors. When in doubt, the original callsheet (PDF) applies. Please report errors and wishes via the chat assistant in the app or directly to the production."}},
 testwelcome:{hi:{subject:"टेस्ट यूज़र के रूप में स्वागत है 🧪",body:"नमस्ते {vorname}\n\nअब आप Tschugger Crew ऐप के टेस्ट यूज़र हैं। इससे आपको नई सुविधाएँ दिखती हैं जो अभी सबके लिए शुरू नहीं हुई हैं। उन पर BETA लिखा है।\n\nकृपया ध्यान दें:\n• कुछ चीज़ें शायद अभी काम न करें या जल्दी बदल सकती हैं।\n• दिखाए गए डेटा में गलतियाँ हो सकती हैं। समय, जगहें और सीन हमेशा मूल दस्तावेज़ों (Callsheet, शेड्यूल, Dispo) से जाँचें।\n• मूल दस्तावेज़ ही हमेशा मान्य हैं।\n\nगलतियाँ या सुझाव कृपया Stefan Künzler से संपर्क करें। इससे आप ऐप को बेहतर बनाने में हमारी मदद करते हैं।\n\nसाथ में टेस्ट करने के लिए धन्यवाद!"},fr:{subject:"Bienvenue en tant que testeur·euse 🧪",body:"Bonjour {vorname}\n\nTu es maintenant testeur·euse de l'app de l'équipe Tschugger. Tu vois ainsi de nouvelles fonctions qui ne sont pas encore disponibles pour tout le monde. Elles sont marquées BETA.\n\nÀ noter :\n• Certaines choses peuvent ne pas encore fonctionner ou changer à court terme.\n• Les données affichées peuvent contenir des erreurs. Vérifie toujours les horaires, lieux et scènes avec les documents originaux (callsheet, plan de tournage, dispo).\n• Seuls les documents originaux font foi.\n\nUne erreur ou un souhait ? Signale-le à Stefan Künzler. Tu nous aides ainsi à améliorer l'app.\n\nMerci de tester avec nous !"},
  it:{subject:"Benvenuta/o come tester 🧪",body:"Ciao {vorname}\n\nOra sei tester dell'app della crew Tschugger. Vedi nuove funzioni non ancora disponibili per tutti. Sono contrassegnate con BETA.\n\nNota bene:\n• Alcune cose potrebbero non funzionare ancora o cambiare a breve.\n• I dati visualizzati possono contenere errori. Controlla sempre orari, luoghi e scene con i documenti originali (callsheet, piano di lavorazione, dispo).\n• Fanno fede sempre i documenti originali.\n\nUn errore o un desiderio? Segnalalo a Stefan Künzler. Così ci aiuti a migliorare l'app.\n\nGrazie per i tuoi test!"},
  en:{subject:"Welcome as a test user 🧪",body:"Hi {vorname}\n\nYou are now a test user of the Tschugger crew app. You will see new features that are not yet available to everyone. They are marked BETA.\n\nPlease note:\n• Some things may not work yet or may change at short notice.\n• The data shown may contain errors. Always check times, places and scenes against the original documents (callsheet, shooting schedule, dispo).\n• The original documents are always binding.\n\nFound a mistake or have a wish? Please tell Stefan Künzler. That helps us improve the app.\n\nThanks for testing!"}},
 invite:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच", "body": "नमस्ते {vorname}\n\nआपको TSCHUGGER Tigerblood Crew ऐप की पहुँच मिल गई है: शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट।\n\nकैसे करें:\n1. {app}\n2. ठीक इसी ईमेल पते से «खाता बनाएँ»: {email}\n3. पुष्टि वाला ईमेल खोलें और लिंक पर टैप करें – स्पैम फ़ोल्डर भी देखें।\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER",body:"Bonjour {vorname}\n\nTu as accès à l'app de l'équipe de TSCHUGGER Tigerblood : plan de tournage, callsheets, liste de l'équipe, locations et scénario.\n\nComment faire :\n1. {app}\n2. « Créer un compte » avec exactement cette adresse e-mail : {email}\n3. Ouvre l'e-mail de confirmation et tape sur le lien – regarde aussi dans les spams.\n\n{disclaimer}\n\nÀ bientôt sur le set !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER",body:"Ciao {vorname}\n\nhai accesso all'app della crew di TSCHUGGER Tigerblood: piano di lavorazione, callsheet, lista crew, location e sceneggiatura.\n\nCome fare:\n1. {app}\n2. «Crea account» con esattamente questo indirizzo e-mail: {email}\n3. Apri l'e-mail di conferma e tocca il link – controlla anche lo spam.\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app",body:"Hi {vorname}\n\nyou now have access to the TSCHUGGER Tigerblood crew app: shooting schedule, callsheets, crew list, locations and script.\n\nHow it works:\n1. {app}\n2. “Create account” with exactly this email address: {email}\n3. Open the confirmation email and tap the link – please also check your spam folder.\n\n{disclaimer}\n\nSee you on set!"}},
 invitewa:{hi:{body:"नमस्ते {vorname} 👋\n\nआपको TSCHUGGER Tigerblood Crew ऐप की पहुँच मिल गई है: शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट।\n\n1. ऐप खोलें: {app}\n2. ठीक इसी ईमेल पते से «खाता बनाएँ»: *{email}*\n3. पुष्टि वाला ईमेल खोलें और लिंक पर टैप करें (स्पैम भी देखें)।\n\nसेट पर मिलते हैं!"},fr:{body:"Bonjour {vorname} 👋\n\ntu as accès à l'app de l'équipe de TSCHUGGER Tigerblood : plan de tournage, callsheets, liste de l'équipe, locations et scénario.\n\n1. Ouvrir l'app : {app}\n2. « Créer un compte » avec exactement cette adresse : *{email}*\n3. Ouvre l'e-mail de confirmation et tape sur le lien (regarde aussi dans les spams).\n\nÀ bientôt sur le set !"},
  it:{body:"Ciao {vorname} 👋\n\nhai accesso all'app della crew di TSCHUGGER Tigerblood: piano di lavorazione, callsheet, lista crew, location e sceneggiatura.\n\n1. Apri l'app: {app}\n2. «Crea account» con esattamente questo indirizzo: *{email}*\n3. Apri l'e-mail di conferma e tocca il link (controlla anche lo spam).\n\nA presto sul set!"},
  en:{body:"Hi {vorname} 👋\n\nyou now have access to the TSCHUGGER Tigerblood crew app: shooting schedule, callsheets, crew list, locations and script.\n\n1. Open the app: {app}\n2. “Create account” with exactly this email address: *{email}*\n3. Open the confirmation email and tap the link (also check your spam folder).\n\nSee you on set!"}},
 approved:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच सक्रिय है", "body": "नमस्ते {vorname}\n\nTSCHUGGER Tigerblood Crew ऐप में आपकी पहुँच सक्रिय हो गई है। इस पते ({email}) से यहाँ साइन इन करें:\n{app}\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER est activé",body:"Bonjour {vorname}\n\nton accès à l'app de l'équipe de TSCHUGGER Tigerblood est activé. Connecte-toi ici avec cette adresse ({email}) :\n{app}\n\n{disclaimer}\n\nÀ bientôt sur le set !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER è attivo",body:"Ciao {vorname}\n\nil tuo accesso all'app della crew di TSCHUGGER Tigerblood è attivo. Accedi qui con questo indirizzo ({email}):\n{app}\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app is active",body:"Hi {vorname}\n\nyour access to the TSCHUGGER Tigerblood crew app is active. Sign in here with this address ({email}):\n{app}\n\n{disclaimer}\n\nSee you on set!"}},
 startpw:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच", "body": "नमस्ते {vorname}\n\nTSCHUGGER Tigerblood Crew ऐप के लिए आपका खाता तैयार है:\n{app}\n\nईमेल: {email}\nशुरुआती पासवर्ड: {passwort}\n\nपहली बार साइन इन करने पर आप अपना पासवर्ड चुनेंगे।\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER",body:"Bonjour {vorname}\n\nton compte pour l'app de l'équipe de TSCHUGGER Tigerblood est prêt :\n{app}\n\nE-mail : {email}\nMot de passe initial : {passwort}\n\nÀ la première connexion, tu choisis ton propre mot de passe.\n\n{disclaimer}\n\nÀ bientôt sur le set !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER",body:"Ciao {vorname}\n\nil tuo account per l'app della crew di TSCHUGGER Tigerblood è pronto:\n{app}\n\nE-mail: {email}\nPassword iniziale: {passwort}\n\nAl primo accesso scegli una password tua.\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app",body:"Hi {vorname}\n\nyour account for the TSCHUGGER Tigerblood crew app is ready:\n{app}\n\nEmail: {email}\nStart password: {passwort}\n\nWhen you sign in for the first time you choose your own password.\n\n{disclaimer}\n\nSee you on set!"}}};
const DOCLANGS=["de","fr","it","en","hi"];
/* text of a document in one language: own text (config/app.docs[k][lang]; German also from the older docs[k].subject/body) or the default */
export const docRaw=(k,lang)=>{lang=DOCLANGS.includes(lang)?lang:LANG;const c=(window.DOCS||{})[k]||{};const d=DOCDEF[k];
  const own=lang==="de"?(c.de&&(c.de.body||c.de.subject)?c.de:(c.body||c.subject?{subject:c.subject,body:c.body}:null)):(c[lang]&&(c[lang].body||c[lang].subject)?c[lang]:null);
  const def=lang==="de"?{subject:d.subject,body:d.body}:Object.assign({subject:d.subject,body:d.body},(DOCI18N[k]||{})[lang]||(DOCI18N[k]||{}).en||{});
  return {subject:own&&own.subject&&String(own.subject).trim()?own.subject:(def.subject||""),body:own&&own.body&&String(own.body).trim()?own.body:def.body,custom:!!own}};
export function docGet(k,v,lang){v=v||{};lang=lang||v.lang||LANG;const r=docRaw(k,lang);
  const map=Object.assign({app:location.origin+location.pathname,disclaimer:k==="disclaimer"?"":docRaw("disclaimer",lang).body,vorname:"",name:"",email:"",passwort:""},v);
  const fill=t=>String(t||"").replace(/\{(\w+)\}/g,(m,x)=>x in map?map[x]:m).replace(/\n{3,}/g,"\n\n").replace(/^(Hallo|Bonjour|Ciao|Hi) \n/,"$1\n");
  const g=t=>lang==="de"&&typeof deG==="function"?deG(t):t;
  return {subject:g(fill(r.subject)),body:g(fill(r.body))}}
export const mailto=(em,k,v)=>{const d=docGet(k,Object.assign({email:em},v));return "mailto:"+encodeURIComponent(em)+"?subject="+encodeURIComponent(d.subject)+"&body="+encodeURIComponent(d.body)};
export function docsSec(){
  const dl=DOCLANGS.includes(ADM.doclang)?ADM.doclang:(DOCLANGS.includes(LANG)?LANG:"de");
  return '<div class="admins docs"><h3>'+L("Dokumente")+'</h3><p class="ahint">'+L("Alle Texte, die die App verschickt oder anzeigt. Platzhalter: {vorname} {name} {email} {app} {passwort} {disclaimer}. Du bearbeitest jeweils nur die gewählte Sprache; ohne eigenen Text gilt die Standardfassung.")+'</p>'+
    '<div class="smodes doclangs" role="group">'+DOCLANGS.map(l=>'<button type="button" data-doclang="'+l+'" aria-pressed="'+(l===dl)+'">'+l.toUpperCase()+'</button>').join("")+'</div>'+
    Object.keys(DOCDEF).map(k=>{const d=DOCDEF[k],r=docRaw(k,dl);
      return '<details class="docd" data-sec="doc-'+k+'"'+(SECS["doc-"+k]?' open':'')+'><summary><b>'+esc(L(d.t))+'</b>'+(r.custom?' <span class="ust role">'+L("angepasst")+'</span>':'')+'</summary>'+
        '<form class="docf" data-doc="'+k+'" data-dl="'+dl+'"><p class="ahint">'+esc(L(d.use))+'</p>'+(k==="maint"?'<label class="ck docon"><input type="checkbox" data-mainton'+(maintOn()?' checked':'')+'> '+esc(L("Wartungshinweis eingeschaltet (für alle)"))+'</label>':'')+(d.subject!==undefined?'<label>'+L(k==="welcome"||k==="testwelcome"||k==="maint"?"Titel":"Betreff")+'<input name="ds" maxlength="200" value="'+esc(r.subject)+'"></label>':'')+
        '<label>'+L("Text")+'<textarea name="db" rows="'+(k==="disclaimer"?5:12)+'">'+esc(r.body)+'</textarea></label>'+
        '<p class="amsg" role="alert"></p><div class="arb">'+saveBtn()+(window.CHATURL?'<button type="button" class="pillbtn docai" data-docai>✨ '+esc(L("Text mit KI überarbeiten"))+'</button>':'')+(r.custom?'<button type="button" class="lnk" data-docreset="'+k+'" data-dl="'+dl+'">'+L("Standard wiederherstellen")+'</button>':'')+(k==="testwelcome"?'<button type="button" class="lnk" data-twagain>'+L("Allen Test-Usern nochmals zeigen")+'</button>':'')+(k!=="welcome"&&k!=="disclaimer"&&k!=="testwelcome"&&k!=="invitewa"&&k!=="maint"&&ME?'<a class="lnk" href="'+esc(mailto(ME.email,k,{vorname:"Test",name:"Test Person",passwort:"Abc123xyz",lang:dl}))+'">'+L("Test an mich")+'</a>':'')+'</div></form></details>'}).join("")+
    '<p class="ahint">'+L("Bestätigungs-Mail, Passwort-Zurücksetzen und Anmelde-Link verschickt Firebase. Deren Texte änderst du in der Firebase-Konsole unter Authentication → Templates.")+'</p></div>';
}
const docDef=(k,lang)=>lang==="de"?{subject:DOCDEF[k].subject||"",body:DOCDEF[k].body||""}:Object.assign({subject:DOCDEF[k].subject||"",body:DOCDEF[k].body||""},(DOCI18N[k]||{})[lang]||(DOCI18N[k]||{}).en||{});
/* store one language of one document; German also clears the older language-less fields */
async function docStore(k,lang,val){const {F,db}=await fb();const part={[lang]:val};if(lang==="de")Object.assign(part,{body:"",subject:""});
  await F.setDoc(F.doc(db,"config","app"),{docs:{[k]:part}},{merge:true});
  const cur=Object.assign({},(window.DOCS||{})[k]||{},part);window.DOCS=Object.assign({},window.DOCS,{[k]:cur});try{localStorage.setItem("appdocs",JSON.stringify(window.DOCS))}catch(_){}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-doclang]");if(!b)return;ADM.doclang=b.dataset.doclang;render()});
document.addEventListener("submit",async e=>{const f=e.target.closest("form.docf");if(!f)return;e.preventDefault();if(!can("settings"))return;
  const k=f.dataset.doc,lang=DOCLANGS.includes(f.dataset.dl)?f.dataset.dl:"de",msg=f.querySelector(".amsg"),btn=f.querySelector("button[type=submit]");btn.disabled=true;msg.className="amsg";msg.textContent="";
  const val={body:String(f.db.value||"").replace(/\r/g,""),subject:f.ds?String(f.ds.value||"").trim():""};const df=docDef(k,lang);
  if(val.body.trim()===df.body.trim()&&(!f.ds||val.subject===df.subject))val.body="",val.subject="";
  try{await docStore(k,lang,val);
    document.activeElement&&document.activeElement.blur&&document.activeElement.blur();showMsg(L("Gespeichert.")+" ("+lang.toUpperCase()+")",2500);render()}
  catch(err){btn.disabled=false;msg.textContent=(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err))}});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-docreset]");if(!b||!can("settings"))return;const k=b.dataset.docreset,lang=DOCLANGS.includes(b.dataset.dl)?b.dataset.dl:"de";
  try{await docStore(k,lang,{body:"",subject:""});render();showMsg(L("Standardtext wiederhergestellt.")+" ("+lang.toUpperCase()+")",2500)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}});
/* test-user welcome: «show again» raises the version, every test user sees it once more */
document.addEventListener("click",async e=>{if(!e.target.closest("[data-twagain]")||!can("settings"))return;e.preventDefault();
  const v=(parseInt(((window.DOCS||{}).testwelcome||{}).ver,10)||1)+1;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"config","app"),{docs:{testwelcome:{ver:v}}},{merge:true});
    window.DOCS=Object.assign({},window.DOCS,{testwelcome:Object.assign({},(window.DOCS||{}).testwelcome,{ver:v})});try{localStorage.setItem("appdocs",JSON.stringify(window.DOCS))}catch(_){}
    showMsg(L("Wird allen Test-Usern beim nächsten Öffnen nochmals gezeigt."),3500)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}});
/* invitation by WhatsApp: opens WhatsApp with the text «Einladung WhatsApp» (to the number of the person when the crew list has it) */
export function waNum(t){let d=String(t||"").replace(/[^\d+]/g,"");if(d.startsWith("+"))return d.slice(1);if(d.startsWith("00"))return d.slice(2);if(/^0\d{9}$/.test(d))return "41"+d.slice(1);return d}
function waInvite(em,name,phone){const d=docGet("invitewa",{email:em,vorname:String(name||"").split(/\s+/)[0],name:name||""});const n=waNum(phone);
  return "https://wa.me/"+(n.length>=8?n:"")+"?text="+encodeURIComponent(d.body)}
document.addEventListener("click",e=>{const b=e.target.closest("[data-cwa]");if(!b||!can("users.invite"))return;   /* the same right that shows the button */e.preventDefault();e.stopPropagation();
  window.open(waInvite(b.dataset.cwa,b.dataset.nm||"",b.dataset.ph||""),"_blank","noopener")},true);

/* maintenance note on/off (config/app → docs.maint.on, for everybody; default on) */
export const maintOn=()=>((window.DOCS||{}).maint||{}).on!==false;window.maintOn=maintOn;
document.addEventListener("change",async e=>{const c=e.target.closest&&e.target.closest("[data-mainton]");if(!c||!can("settings"))return;const on=c.checked;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"config","app"),{docs:{maint:{on}}},{merge:true});
    window.DOCS=Object.assign({},window.DOCS,{maint:Object.assign({},(window.DOCS||{}).maint,{on})});try{localStorage.setItem("appdocs",JSON.stringify(window.DOCS))}catch(_){}
    showMsg(L(on?"Wartungshinweis eingeschaltet.":"Wartungshinweis ausgeschaltet."),2500)}catch(err){c.checked=!on;showMsg(L("Fehler:")+" "+(err.message||err),6000)}});
/* «Text mit KI überarbeiten»: the assistant (Cloudflare Worker → Claude) improves title and text of the open document in its language;
   the result only goes into the fields – it counts once it is saved */
const DOCLN={de:"Deutsch (Schweiz, ohne ß, ohne Gender-Doppelpunkt)",fr:"français",it:"italiano",en:"English",hi:"Hindi"};
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-docai]");if(!b||!can("settings")||!window.CHATURL)return;e.preventDefault();
  const f=b.closest("form.docf"),msg=f.querySelector(".amsg"),lang=f.dataset.dl||"de",ti=f.ds?String(f.ds.value||""):"",tx=String(f.db.value||"");if(!tx.trim())return;
  b.disabled=true;const old=b.innerHTML;b.innerHTML="✨ "+esc(L("KI überarbeitet …"));msg.className="amsg";msg.textContent="";
  const q="Überarbeite diesen Text der Crew-App, damit er klar, freundlich und gut lesbar ist. Sprache: "+(DOCLN[lang]||lang)+". Inhalt und Fakten genau gleich lassen; "+
    "Platzhalter in geschweiften Klammern wie {vorname} unverändert lassen; Namen, Drehtage (z. B. DT03) und Szenen nicht ändern; Absätze mit Leerzeile trennen. "+
    "Antworte NUR mit JSON: {\"titel\":\"…\",\"text\":\"…\"}"+(f.ds?"":" (titel leer lassen)")+".\n\nTITEL: "+ti+"\n\nTEXT:\n"+tx;
  try{const {auth}=await fb();const tok=await auth.currentUser.getIdToken();
    const r=await withTimeout(fetch(window.CHATURL.replace(/\/+$/,"")+"/chat",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok},body:JSON.stringify({q,lang,today:"",who:ME.email,hist:[],ctx:""})}),60000,"docai");
    const j=await r.json().catch(()=>({}));if(!r.ok||!j.a)throw new Error(j.error||r.status);
    const m=String(j.a).match(/\{[\s\S]*\}/);const o=m?JSON.parse(m[0]):null;if(!o||!o.text)throw new Error(L("Keine brauchbare Antwort."));
    if(f.ds&&o.titel)f.ds.value=String(o.titel).trim();f.db.value=String(o.text).replace(/ß/g,"ss").trim();
    msg.textContent=L("Vorschlag eingesetzt – prüfen und speichern.")}
  catch(err){msg.className="amsg err";msg.textContent=L("Fehler:")+" "+(err.message||err)}
  b.disabled=false;b.innerHTML=old});
export function setPREFOK(v){return PREFOK=v}   /* other parts change PREFOK only through this */
export function setPREFT(v){return PREFT=v}   /* other parts change PREFT only through this */
