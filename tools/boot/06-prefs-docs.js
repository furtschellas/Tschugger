/* ---- view settings per user: kept on this device and in Firestore (prefs/{uid}), restored on every device and after a restart ---- */
const PREFKEYS=["theme","pv","sv","lv","spt","uf","pu","welcomeAck","push","chat","tour","today","offline","nv"];let PREFT=null,PREFAPPLY=false;
{const _store=store;store=function(k,v){_store(k,v);if(!PREFAPPLY&&PREFKEYS.includes(k)){try{localStorage.setItem("prefsLocalAt",String(Date.now()))}catch(_){}savePrefsSoon()}}}
function savePrefsSoon(){clearTimeout(PREFT);PREFT=setTimeout(savePrefs,1500)}
/* a change made just before closing or reloading is saved right away (before, the older copy online won on the next start) */
const prefsFlush=()=>{if(PREFT){clearTimeout(PREFT);PREFT=null;savePrefs()}};
addEventListener("pagehide",prefsFlush);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")prefsFlush()});
async function savePrefs(){
  if(!ME||!ME.uid)return;const p={};
  try{for(const k of PREFKEYS){const v=localStorage.getItem(k);if(v!==null)p[k]=String(v).slice(0,400)}}catch(_){return}
  try{for(const k of ["rc","scrv"]){const v=localStorage.getItem(k);if(v!==null&&Object.keys(p).length<14)p[k]=v.slice(0,60)}}catch(_){}   /* role-change notice seen (room permitting: the rules allow 16 fields) */
  let lt=0;try{lt=+localStorage.getItem("prefsLocalAt")||0}catch(_){}PREFT=null;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"prefs",ME.uid),Object.assign(p,{at:F.serverTimestamp(),lt}))}catch(err){console.warn("prefs",err&&err.code||err)}
}
function applyPrefs(p){
  if(!p||typeof p!=="object")return;PREFAPPLY=true;
  try{
    for(const k of PREFKEYS)if(typeof p[k]==="string")try{localStorage.setItem(k,p[k])}catch(_){}
    for(const k of ["rc","scrv"])if(typeof p[k]==="string")try{localStorage.setItem(k,p[k])}catch(_){}
    const js=k=>{try{return JSON.parse(p[k])}catch(_){return null}};
    for(const [k,o] of [["pv",S.pv],["sv",S.sv],["lv",S.lv]]){const x=js(k);if(x&&typeof x==="object")for(const i in o)if(typeof x[i]==="boolean")o[i]=x[i]}
    for(const k of ["uf","pu"]){const x=js(k);if(x&&typeof x==="object")S[k]=Object.assign({},S[k],...["1","2","3"].filter(u=>typeof x[u]==="boolean").map(u=>({[u]:x[u]})))}
    if(typeof p.spt==="string")SPT=p.spt==="light"||p.spt==="dark"?p.spt:null;
    if(p.theme==="light"||p.theme==="dark")setTheme(p.theme);
  }finally{PREFAPPLY=false}
  if(typeof p.push==="string")pushSyncSoon();
  render();
}
async function loadPrefs(){
  if(!ME||!ME.uid)return;
  try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"prefs",ME.uid)),10000,"prefs");
    let lt=0;try{lt=+localStorage.getItem("prefsLocalAt")||0}catch(_){}
    /* settings changed on this device after the copy online was saved: this device wins and is saved */
    if(d.exists()&&!(lt&&(+d.data().lt||0)<lt))applyPrefs(d.data());else savePrefs()}catch(err){console.warn("prefs",err&&err.code||err)}
}
/* ---- documents: every text the app sends or shows (mails, welcome note, disclaimer); editable under App-Verwaltung → Einstellungen → Dokumente ---- */
const DOCDEF={
 disclaimer:{t:"Disclaimer (BETA-Hinweis)",use:"Wird in der Willkommensnachricht und in den Mails als {disclaimer} eingesetzt.",
  body:"Hinweis: Die App ist eine BETA-Testversion. Alle angezeigten Daten sind ohne Gewähr. Die Produktion und das Entwicklungsteam übernehmen KEINE Garantie für die Richtigkeit, Vollständigkeit oder Aktualität der Daten. Verbindlich sind immer die offiziellen Unterlagen der Produktion (Drehplan, Callsheet, Dispo)."},
 welcome:{t:"Willkommensnachricht",use:"Erscheint beim ersten Login und muss bestätigt werden. Betreff = Titel, Absätze durch eine Leerzeile trennen.",
  subject:"Herzlich willkommen in der TSCHUGGER-App!",
  body:"Schön, dass du dabei bist. Hier findest du Drehplan, Callsheets, Crewliste, Locations und Drehbuch von TSCHUGGER Tigerblood an einem Ort.\n\n{disclaimer}\n\nAlle Inhalte sind vertraulich und nur für die Crew bestimmt – bitte nicht weitergeben.\n\nFehler entdeckt oder einen Wunsch? Melde dich bei Stefan Künzler."},
 invite:{t:"Einladungs-Mail",use:"Crewliste «Einladungs-Mail schicken» und App-Verwaltung «Einladungsmail».",
  subject:"Dein Zugang zur TSCHUGGER Crew-App",
  body:"Hallo {vorname}\n\ndu bist für die Crew-App von TSCHUGGER Tigerblood freigeschaltet. Dort findest du Drehplan, Callsheets, Crewliste, Locations und das Drehbuch.\n\nSo geht's:\n1. {app}\n2. «Konto erstellen» mit genau dieser E-Mail-Adresse: {email}\n3. Bestätigungs-Mail öffnen und auf den Link tippen – bitte auch im Spam-Ordner nachsehen.\n\n{disclaimer}\n\nBis bald am Set!"},
 approved:{t:"Freischaltungs-Mail (Zugangsanfrage)",use:"Beim Freischalten einer Anfrage, wenn der automatische Anmelde-Link nicht verschickt werden kann.",
  subject:"Dein Zugang zur TSCHUGGER Crew-App ist freigeschaltet",
  body:"Hallo {vorname}\n\ndein Zugang zur Crew-App von TSCHUGGER Tigerblood ist freigeschaltet. Melde dich hier mit dieser E-Mail-Adresse ({email}) an:\n{app}\n\n{disclaimer}\n\nBis bald am Set!"},
 startpw:{t:"Startpasswort-Mail",use:"«Per Mail schicken» nach «Startpasswort erzeugen».",
  subject:"Dein Zugang zur TSCHUGGER Crew-App",
  body:"Hallo {vorname}\n\ndein Konto für die Crew-App von TSCHUGGER Tigerblood ist bereit:\n{app}\n\nE-Mail: {email}\nStartpasswort: {passwort}\n\nBeim ersten Anmelden legst du ein eigenes Passwort fest.\n\n{disclaimer}\n\nBis bald am Set!"}};

/* default texts in the other languages (German defaults are above) */
const DOCI18N={
 disclaimer:{hi:{"body": "नोट: यह ऐप BETA परीक्षण संस्करण है। दिखाया गया सारा डेटा बिना गारंटी के है। प्रोडक्शन और डेवलपर्स डेटा के सही, पूर्ण या अद्यतन होने की कोई गारंटी नहीं देते। प्रोडक्शन के आधिकारिक दस्तावेज़ (शेड्यूल, Callsheet, Dispo) ही मान्य हैं।"},fr:{body:"Remarque : l'app est une version de test BETA. Toutes les données affichées sont sans garantie. La production et les développeurs n'assument AUCUNE garantie quant à l'exactitude, l'exhaustivité ou l'actualité des données. Seuls les documents officiels de la production (plan de tournage, callsheet, dispo) font foi."},
  it:{body:"Nota: l'app è una versione di prova BETA. Tutti i dati visualizzati sono senza garanzia. La produzione e gli sviluppatori NON si assumono alcuna garanzia sulla correttezza, completezza o attualità dei dati. Fanno fede sempre i documenti ufficiali della produzione (piano di lavorazione, callsheet, dispo)."},
  en:{body:"Note: the app is a BETA test version. All data shown is without guarantee. The production and the developers accept NO liability for the data being correct, complete or up to date. The official production documents (schedule, call sheet, dispo) are always binding."}},
 welcome:{hi:{"subject": "TSCHUGGER ऐप में आपका स्वागत है!", "body": "आपके साथ होने की खुशी है। यहाँ TSCHUGGER Tigerblood का शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट एक ही जगह मिलेंगे।\n\n{disclaimer}\n\nसारी सामग्री गोपनीय है और केवल Crew के लिए है – कृपया आगे न भेजें।\n\nकोई गलती मिली या कोई सुझाव है? Stefan Künzler से संपर्क करें।"},fr:{subject:"Bienvenue dans l'app TSCHUGGER !",body:"Ravi·e de t'accueillir. Tu trouves ici le plan de tournage, les callsheets, la liste de l'équipe, les décors et le scénario de TSCHUGGER Tigerblood au même endroit.\n\n{disclaimer}\n\nTous les contenus sont confidentiels et réservés à l'équipe – merci de ne pas les diffuser.\n\nUne erreur ou une suggestion ? Contacte Stefan Künzler."},
  it:{subject:"Benvenuta/o nell'app TSCHUGGER!",body:"Che bello averti a bordo. Qui trovi piano di lavorazione, callsheet, lista crew, location e sceneggiatura di TSCHUGGER Tigerblood in un unico posto.\n\n{disclaimer}\n\nTutti i contenuti sono riservati e destinati solo alla crew – per favore non diffonderli.\n\nHai trovato un errore o hai un desiderio? Rivolgiti a Stefan Künzler."},
  en:{subject:"Welcome to the TSCHUGGER app!",body:"Great to have you on board. Here you'll find the shooting schedule, call sheets, crew list, locations and script of TSCHUGGER Tigerblood in one place.\n\n{disclaimer}\n\nAll content is confidential and for the crew only – please do not share it.\n\nFound a mistake or have a wish? Get in touch with Stefan Künzler."}},
 invite:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच", "body": "नमस्ते {vorname}\n\nआपको TSCHUGGER Tigerblood Crew ऐप की पहुँच मिल गई है: शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट।\n\nकैसे करें:\n1. {app}\n2. ठीक इसी ई-मेल पते से «खाता बनाएँ»: {email}\n3. पुष्टि वाला ई-मेल खोलें और लिंक पर टैप करें – स्पैम फ़ोल्डर भी देखें।\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER",body:"Bonjour {vorname}\n\nTu as accès à l'app de l'équipe de TSCHUGGER Tigerblood : plan de tournage, callsheets, liste de l'équipe, décors et scénario.\n\nComment faire :\n1. {app}\n2. « Créer un compte » avec exactement cette adresse e-mail : {email}\n3. Ouvre l'e-mail de confirmation et tape sur le lien – regarde aussi dans les spams.\n\n{disclaimer}\n\nÀ bientôt sur le plateau !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER",body:"Ciao {vorname}\n\nhai accesso all'app della crew di TSCHUGGER Tigerblood: piano di lavorazione, callsheet, lista crew, location e sceneggiatura.\n\nCome fare:\n1. {app}\n2. «Crea account» con esattamente questo indirizzo e-mail: {email}\n3. Apri l'e-mail di conferma e tocca il link – controlla anche lo spam.\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app",body:"Hi {vorname}\n\nyou now have access to the TSCHUGGER Tigerblood crew app: schedule, call sheets, crew list, locations and script.\n\nHow it works:\n1. {app}\n2. “Create account” with exactly this email address: {email}\n3. Open the confirmation email and tap the link – please also check your spam folder.\n\n{disclaimer}\n\nSee you on set!"}},
 approved:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच सक्रिय है", "body": "नमस्ते {vorname}\n\nTSCHUGGER Tigerblood Crew ऐप में आपकी पहुँच सक्रिय हो गई है। इस पते ({email}) से यहाँ साइन इन करें:\n{app}\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER est activé",body:"Bonjour {vorname}\n\nton accès à l'app de l'équipe de TSCHUGGER Tigerblood est activé. Connecte-toi ici avec cette adresse ({email}) :\n{app}\n\n{disclaimer}\n\nÀ bientôt sur le plateau !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER è attivo",body:"Ciao {vorname}\n\nil tuo accesso all'app della crew di TSCHUGGER Tigerblood è attivo. Accedi qui con questo indirizzo ({email}):\n{app}\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app is active",body:"Hi {vorname}\n\nyour access to the TSCHUGGER Tigerblood crew app is active. Sign in here with this address ({email}):\n{app}\n\n{disclaimer}\n\nSee you on set!"}},
 startpw:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच", "body": "नमस्ते {vorname}\n\nTSCHUGGER Tigerblood Crew ऐप के लिए आपका खाता तैयार है:\n{app}\n\nई-मेल: {email}\nशुरुआती पासवर्ड: {passwort}\n\nपहली बार साइन इन करने पर आप अपना पासवर्ड चुनेंगे।\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER",body:"Bonjour {vorname}\n\nton compte pour l'app de l'équipe de TSCHUGGER Tigerblood est prêt :\n{app}\n\nE-mail : {email}\nMot de passe initial : {passwort}\n\nÀ la première connexion, tu choisis ton propre mot de passe.\n\n{disclaimer}\n\nÀ bientôt sur le plateau !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER",body:"Ciao {vorname}\n\nil tuo account per l'app della crew di TSCHUGGER Tigerblood è pronto:\n{app}\n\nE-mail: {email}\nPassword iniziale: {passwort}\n\nAl primo accesso scegli una password tua.\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app",body:"Hi {vorname}\n\nyour account for the TSCHUGGER Tigerblood crew app is ready:\n{app}\n\nEmail: {email}\nStart password: {passwort}\n\nWhen you sign in for the first time you choose your own password.\n\n{disclaimer}\n\nSee you on set!"}}};
const DOCLANGS=["de","fr","it","en","hi"];
/* text of a document in one language: own text (config/app.docs[k][lang]; German also from the older docs[k].subject/body) or the default */
const docRaw=(k,lang)=>{lang=DOCLANGS.includes(lang)?lang:LANG;const c=(window.DOCS||{})[k]||{};const d=DOCDEF[k];
  const own=lang==="de"?(c.de&&(c.de.body||c.de.subject)?c.de:(c.body||c.subject?{subject:c.subject,body:c.body}:null)):(c[lang]&&(c[lang].body||c[lang].subject)?c[lang]:null);
  const def=lang==="de"?{subject:d.subject,body:d.body}:Object.assign({subject:d.subject,body:d.body},(DOCI18N[k]||{})[lang]||(DOCI18N[k]||{}).en||{});
  return {subject:own&&own.subject&&String(own.subject).trim()?own.subject:(def.subject||""),body:own&&own.body&&String(own.body).trim()?own.body:def.body,custom:!!own}};
function docGet(k,v,lang){v=v||{};lang=lang||v.lang||LANG;const r=docRaw(k,lang);
  const map=Object.assign({app:location.origin+location.pathname,disclaimer:k==="disclaimer"?"":docRaw("disclaimer",lang).body,vorname:"",name:"",email:"",passwort:""},v);
  const fill=t=>String(t||"").replace(/\{(\w+)\}/g,(m,x)=>x in map?map[x]:m).replace(/\n{3,}/g,"\n\n").replace(/^(Hallo|Bonjour|Ciao|Hi) \n/,"$1\n");
  const g=t=>lang==="de"&&typeof deG==="function"?deG(t):t;
  return {subject:g(fill(r.subject)),body:g(fill(r.body))}}
const mailto=(em,k,v)=>{const d=docGet(k,Object.assign({email:em},v));return "mailto:"+encodeURIComponent(em)+"?subject="+encodeURIComponent(d.subject)+"&body="+encodeURIComponent(d.body)};
function docsSec(){
  const dl=DOCLANGS.includes(ADM.doclang)?ADM.doclang:(DOCLANGS.includes(LANG)?LANG:"de");
  return '<div class="admins docs"><h3>'+L("Dokumente")+'</h3><p class="ahint">'+L("Alle Texte, die die App verschickt oder anzeigt. Platzhalter: {vorname} {name} {email} {app} {passwort} {disclaimer}. Du bearbeitest jeweils nur die gewählte Sprache; ohne eigenen Text gilt die Standardfassung.")+'</p>'+
    '<div class="smodes doclangs" role="group">'+DOCLANGS.map(l=>'<button type="button" data-doclang="'+l+'" aria-pressed="'+(l===dl)+'">'+l.toUpperCase()+'</button>').join("")+'</div>'+
    Object.keys(DOCDEF).map(k=>{const d=DOCDEF[k],r=docRaw(k,dl);
      return '<details class="docd" data-sec="doc-'+k+'"'+(SECS["doc-"+k]?' open':'')+'><summary><b>'+esc(L(d.t))+'</b>'+(r.custom?' <span class="ust role">'+L("angepasst")+'</span>':'')+'</summary>'+
        '<form class="docf" data-doc="'+k+'" data-dl="'+dl+'"><p class="ahint">'+esc(L(d.use))+'</p>'+(d.subject!==undefined?'<label>'+L(k==="welcome"?"Titel":"Betreff")+'<input name="ds" maxlength="200" value="'+esc(r.subject)+'"></label>':'')+
        '<label>'+L("Text")+'<textarea name="db" rows="'+(k==="disclaimer"?5:12)+'">'+esc(r.body)+'</textarea></label>'+
        '<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Speichern")+'</button>'+(r.custom?'<button type="button" class="lnk" data-docreset="'+k+'" data-dl="'+dl+'">'+L("Standard wiederherstellen")+'</button>':'')+(k!=="welcome"&&k!=="disclaimer"&&ME?'<a class="lnk" href="'+esc(mailto(ME.email,k,{vorname:"Test",name:"Test Person",passwort:"Abc123xyz",lang:dl}))+'">'+L("Test an mich")+'</a>':'')+'</div></form></details>'}).join("")+
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
