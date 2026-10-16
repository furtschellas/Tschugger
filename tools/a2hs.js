/* ---------- home screen: offer to add the app after signing in (only when opened in the browser) ---------- */
Object.assign(I18N,{
 "Verknüpfung auf dem Desktop erstellen?":{fr:"Créer un raccourci sur le bureau ?",it:"Creare un collegamento sul desktop?",en:"Create a desktop shortcut?",hi:"डेस्कटॉप पर शॉर्टकट बनाएँ?"},
 "So geht's am Computer:":{fr:"Sur l'ordinateur :",it:"Sul computer:",en:"On a computer:",hi:"कंप्यूटर पर:"},
 "Chrome / Edge: in der Adresszeile auf das Installieren-Symbol ⊕ klicken oder im Menü «App installieren» wählen":{fr:"Chrome / Edge : clique sur l'icône d'installation ⊕ dans la barre d'adresse ou choisis « Installer l'app » dans le menu",it:"Chrome / Edge: clicca sull'icona di installazione ⊕ nella barra degli indirizzi o scegli «Installa app» nel menu",en:"Chrome / Edge: click the install icon ⊕ in the address bar or choose “Install app” in the menu",hi:"Chrome / Edge: पता बार में इंस्टॉल आइकन ⊕ पर क्लिक करें या मेनू में «ऐप इंस्टॉल करें» चुनें"},
 "Safari (Mac): Menü «Ablage» → «Zum Dock hinzufügen»":{fr:"Safari (Mac) : menu « Fichier » → « Ajouter au Dock »",it:"Safari (Mac): menu «File» → «Aggiungi al Dock»",en:"Safari (Mac): menu “File” → “Add to Dock”",hi:"Safari (Mac): मेनू «File» → «Add to Dock»"},
 "Firefox: die Seite als Lesezeichen oder per Drag & Drop der Adresse auf den Schreibtisch ziehen":{fr:"Firefox : mets la page en favori ou glisse l'adresse sur le bureau",it:"Firefox: aggiungi la pagina ai preferiti o trascina l'indirizzo sul desktop",en:"Firefox: bookmark the page or drag the address onto the desktop",hi:"Firefox: पेज को बुकमार्क करें या पता डेस्कटॉप पर खींचें"},
 "Auf dem iPhone braucht es das auch für Push-Nachrichten.":{fr:"Sur iPhone, c'est aussi nécessaire pour les notifications.",it:"Su iPhone serve anche per le notifiche.",en:"On iPhone this is also needed for notifications.",hi:"iPhone पर पुश सूचनाओं के लिए भी यह ज़रूरी है।"},
 "Zum Startbildschirm hinzufügen?":{it:"Aggiungere alla schermata Home?",fr:"Ajouter à l’écran d’accueil ?",en:"Add to home screen?"},
 "Dann öffnest du die Crew-App wie eine normale App, ohne Link.":{it:"Così apri l’app della crew come una normale app, senza link.",fr:"Tu ouvriras l’app de l’équipe comme une app normale, sans lien.",en:"Then you open the crew app like a normal app, no link needed."},
 "Ja, hinzufügen":{it:"Sì, aggiungi",fr:"Oui, ajouter",en:"Yes, add it"},
 "Später":{it:"Più tardi",fr:"Plus tard",en:"Later"},
 "Ist schon drauf":{it:"C’è già",fr:"C’est déjà fait",en:"Already there"},
 "So geht's auf dem iPhone:":{it:"Su iPhone:",fr:"Sur iPhone :",en:"On iPhone:"},
 "1. Unten auf Teilen tippen":{it:"1. Tocca Condividi in basso",fr:"1. Touche Partager en bas",en:"1. Tap Share at the bottom"},
 "2. «Zum Home-Bildschirm» wählen":{it:"2. Scegli «Aggiungi alla schermata Home»",fr:"2. Choisis « Sur l’écran d’accueil »",en:"2. Choose “Add to Home Screen”"},
 "3. Oben rechts «Hinzufügen» tippen":{it:"3. Tocca «Aggiungi» in alto a destra",fr:"3. Touche « Ajouter » en haut à droite",en:"3. Tap “Add” top right"},
 "So geht's:":{it:"Come fare:",fr:"Comment faire :",en:"How to:"},
 "1. Browser-Menü ⋮ öffnen":{it:"1. Apri il menu ⋮ del browser",fr:"1. Ouvre le menu ⋮ du navigateur",en:"1. Open the browser menu ⋮"},
 "2. «Zum Startbildschirm hinzufügen» oder «App installieren» wählen":{it:"2. Scegli «Aggiungi a schermata Home» o «Installa app»",fr:"2. Choisis « Ajouter à l’écran d’accueil » ou « Installer l’app »",en:"2. Choose “Add to Home screen” or “Install app”"},
 "Fertig":{it:"Fatto",fr:"OK",en:"Done"},
 "Danach die App vom Startbildschirm öffnen und dort einmal anmelden.":{it:"Poi apri l’app dalla schermata Home e accedi una volta.",fr:"Ouvre ensuite l’app depuis l’écran d’accueil et connecte-toi une fois.",en:"Then open the app from the home screen and sign in there once."}
});
const A2HS_KEY="a2hs:v1";let DEFERRED=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();DEFERRED=e});
window.addEventListener("appinstalled",()=>{try{localStorage.setItem(A2HS_KEY,"done")}catch(_){}hideA2hs()});
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
const isStandalone=()=>(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isMobile=()=>isIOS()||/android/i.test(navigator.userAgent);
function a2hsState(){try{return localStorage.getItem(A2HS_KEY)||""}catch(_){return ""}}
function a2hsSet(v){try{localStorage.setItem(A2HS_KEY,v)}catch(_){}}
function hideA2hs(){const s=document.getElementById("a2hs");if(s)s.hidden=true}
/* ask after sign-in; after "Später" ask again at the earliest in 3 days; never after "Ist schon drauf" / installed */
/* shortcut on the home screen (phone/tablet) or desktop: asked once while setting up (see the setup chain in web_boot), again from «Mein Konto» */
function a2hsDue(){return !isStandalone()&&!a2hsState()}
function maybeOfferA2hs(afterLogin){
  if(isStandalone())return;if(afterLogin!=="setup")return; /* only from the setup chain */
  const st=a2hsState();if(st==="done")return;
  if(!afterLogin&&st&&Date.now()-(+st||0)<3*864e5)return;
  showA2hs();
}
function showA2hs(steps){
  let s=document.getElementById("a2hs");
  if(!s){s=document.createElement("div");s.id="a2hs";s.className="a2hs";s.setAttribute("role","dialog");s.setAttribute("aria-modal","true");document.body.appendChild(s);
    s.addEventListener("click",async e=>{
      const b=e.target.closest("[data-a2]");if(!b){if(e.target===s){a2hsSet(String(Date.now()));hideA2hs()}return}
      const a=b.dataset.a2;
      if(a==="yes"){
        if(DEFERRED){const p=DEFERRED;DEFERRED=null;p.prompt();try{const r=await p.userChoice;a2hsSet(r&&r.outcome==="accepted"?"done":String(Date.now()))}catch(_){}hideA2hs()}
        else showA2hs(true);
      }else if(a==="later"){a2hsSet(String(Date.now()));hideA2hs()}
      else if(a==="done"){a2hsSet("done");hideA2hs()}
      else if(a==="ok"){a2hsSet(String(Date.now()));hideA2hs()}
    });
  }
  const share='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>';
  const body=steps
    ?(isIOS()
      ?'<p class="a2t">'+L("So geht's auf dem iPhone:")+'</p><ol class="a2steps"><li>'+L("1. Unten auf Teilen tippen").replace(/^1\. /,"")+' '+share+'</li><li>'+L("2. «Zum Home-Bildschirm» wählen").replace(/^2\. /,"")+'</li><li>'+L("3. Oben rechts «Hinzufügen» tippen").replace(/^3\. /,"")+'</li></ol><p>'+L("Danach die App vom Startbildschirm öffnen und dort einmal anmelden.")+'</p><div class="a2b"><button class="pri" data-a2="ok">'+L("Fertig")+'</button></div>'
      :isMobile()?'<p class="a2t">'+L("So geht's:")+'</p><ol class="a2steps"><li>'+L("1. Browser-Menü ⋮ öffnen").replace(/^1\. /,"")+'</li><li>'+L("2. «Zum Startbildschirm hinzufügen» oder «App installieren» wählen").replace(/^2\. /,"")+'</li></ol><div class="a2b"><button class="pri" data-a2="ok">'+L("Fertig")+'</button></div>'
      :'<p class="a2t">'+L("So geht's am Computer:")+'</p><ol class="a2steps"><li>'+L("Chrome / Edge: in der Adresszeile auf das Installieren-Symbol ⊕ klicken oder im Menü «App installieren» wählen")+'</li><li>'+L("Safari (Mac): Menü «Ablage» → «Zum Dock hinzufügen»")+'</li><li>'+L("Firefox: die Seite als Lesezeichen oder per Drag & Drop der Adresse auf den Schreibtisch ziehen")+'</li></ol><div class="a2b"><button class="pri" data-a2="ok">'+L("Fertig")+'</button></div>')
    :'<p>'+L("Dann öffnest du die Crew-App wie eine normale App, ohne Link.")+(isIOS()?' '+L("Auf dem iPhone braucht es das auch für Push-Nachrichten."):'')+'</p><div class="a2b"><button class="pri" data-a2="yes">'+L("Ja, hinzufügen")+'</button><button data-a2="later">'+L("Später")+'</button><button class="lnk" data-a2="done">'+L("Ist schon drauf")+'</button></div>';
  s.innerHTML='<div class="a2box"><img src="icon-192.png" alt="" width="56" height="56"><h3>'+L(isMobile()?"Zum Startbildschirm hinzufügen?":"Verknüpfung auf dem Desktop erstellen?")+'</h3>'+body+'</div>';
  s.hidden=false;
}
