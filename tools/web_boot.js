/* ---------- web boot (GitHub Pages): Firebase sign-in + encrypted data file ---------- */
const FB_CONFIG={apiKey:"AIzaSyBrHUJumAArmHv92qhZEbUFXSWrwvZaKjQ",authDomain:"tschugger-83692.firebaseapp.com",projectId:"tschugger-83692",storageBucket:"tschugger-83692.firebasestorage.app",messagingSenderId:"786764568575",appId:"1:786764568575:web:552eeefa77c44f5d24b9ca"};
const FB_V="10.12.2",ADMINS=["furtschellas@gmail.com"],DATA_URL="data.enc.json",POLL_MS=3*60*1000;
Object.assign(I18N,{
 "Anmelden":{fr:"Se connecter",en:"Sign in"},
 "E-Mail":{fr:"E-mail",en:"Email"},
 "Passwort":{fr:"Mot de passe",en:"Password"},
 "Passwort wiederholen":{fr:"Répéter le mot de passe",en:"Repeat password"},
 "Neues Passwort":{fr:"Nouveau mot de passe",en:"New password"},
 "Aktuelles Passwort":{fr:"Mot de passe actuel",en:"Current password"},
 "Neue E-Mail-Adresse":{fr:"Nouvelle adresse e-mail",en:"New email address"},
 "Konto erstellen":{fr:"Créer un compte",en:"Create account"},
 "Erstes Mal hier? Konto erstellen":{fr:"Première fois ? Créer un compte",en:"First time here? Create an account"},
 "Schon ein Konto? Anmelden":{fr:"Déjà un compte ? Se connecter",en:"Already have an account? Sign in"},
 "Passwort vergessen?":{fr:"Mot de passe oublié ?",en:"Forgot password?"},
 "Link zum Zurücksetzen senden":{fr:"Envoyer le lien de réinitialisation",en:"Send reset link"},
 "Zurück":{fr:"Retour",en:"Back"},
 "Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die du der Produktion angegeben hast.":{fr:"Réservé à l’équipe de TSCHUGGER Tigerblood. Connecte-toi avec l’adresse e-mail que tu as donnée à la production.",en:"For the TSCHUGGER Tigerblood crew only. Sign in with the email address you gave the production."},
 "Mindestens 8 Zeichen.":{fr:"Au moins 8 caractères.",en:"At least 8 characters."},
 "Die Passwörter stimmen nicht überein.":{fr:"Les mots de passe ne correspondent pas.",en:"The passwords don’t match."},
 "E-Mail oder Passwort falsch.":{fr:"E-mail ou mot de passe incorrect.",en:"Wrong email or password."},
 "Für diese Adresse gibt es schon ein Konto. Bitte anmelden.":{fr:"Un compte existe déjà pour cette adresse. Connecte-toi.",en:"There is already an account for this address. Please sign in."},
 "Ungültige E-Mail-Adresse.":{fr:"Adresse e-mail invalide.",en:"Invalid email address."},
 "Zu viele Versuche. Bitte kurz warten.":{fr:"Trop de tentatives. Patiente un instant.",en:"Too many attempts. Please wait a moment."},
 "Bitte bestätige zuerst deine E-Mail-Adresse.":{fr:"Confirme d’abord ton adresse e-mail.",en:"Please confirm your email address first."},
 "Wir haben dir eine Mail mit einem Bestätigungslink geschickt. Tippe auf den Link und komm dann hierher zurück.":{fr:"Nous t’avons envoyé un e-mail avec un lien de confirmation. Touche le lien puis reviens ici.",en:"We sent you an email with a confirmation link. Tap the link, then come back here."},
 "Ich habe bestätigt":{fr:"J’ai confirmé",en:"I’ve confirmed"},
 "Mail nochmals senden":{fr:"Renvoyer l’e-mail",en:"Send the email again"},
 "Mail gesendet.":{fr:"E-mail envoyé.",en:"Email sent."},
 "Noch nicht bestätigt. Schau auch im Spam-Ordner nach.":{fr:"Pas encore confirmé. Regarde aussi dans les spams.",en:"Not confirmed yet. Also check your spam folder."},
 "Wenn es für diese Adresse ein Konto gibt, kommt gleich eine Mail zum Zurücksetzen.":{fr:"S’il existe un compte pour cette adresse, un e-mail de réinitialisation arrive.",en:"If there is an account for this address, a reset email is on its way."},
 "Kein Zugang":{fr:"Pas d’accès",en:"No access"},
 "Deine Adresse ist (noch) nicht für die Crew-App freigeschaltet. Bitte melde dich bei der Produktion.":{fr:"Ton adresse n’est pas (encore) autorisée pour l’app. Contacte la production.",en:"Your address is not (yet) enabled for the crew app. Please contact the production."},
 "Dein Zugang wurde gesperrt. Bitte melde dich bei der Produktion.":{fr:"Ton accès a été bloqué. Contacte la production.",en:"Your access has been blocked. Please contact the production."},
 "Abmelden":{fr:"Se déconnecter",en:"Sign out"},
 "Mein Konto":{fr:"Mon compte",en:"My account"},
 "Angemeldet als":{fr:"Connecté·e en tant que",en:"Signed in as"},
 "Passwort ändern":{fr:"Changer le mot de passe",en:"Change password"},
 "E-Mail-Adresse ändern":{fr:"Changer l’adresse e-mail",en:"Change email address"},
 "Speichern":{fr:"Enregistrer",en:"Save"},
 "Schliessen":{fr:"Fermer",en:"Close"},
 "Passwort geändert.":{fr:"Mot de passe modifié.",en:"Password changed."},
 "Aktuelles Passwort falsch.":{fr:"Mot de passe actuel incorrect.",en:"Current password is wrong."},
 "Bestätigungslink an die neue Adresse gesendet. Die Änderung gilt, sobald du ihn antippst.":{fr:"Lien de confirmation envoyé à la nouvelle adresse. Le changement s’applique dès que tu le touches.",en:"Confirmation link sent to the new address. The change applies once you tap it."},
 "Diese Adresse wird schon verwendet.":{fr:"Cette adresse est déjà utilisée.",en:"This address is already in use."},
 "Benutzer verwalten":{fr:"Gérer les utilisateurs",en:"Manage users"},
 "Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen.":{fr:"Connexion impossible. Vérifie la connexion internet.",en:"Sign-in unavailable. Please check your internet connection."},
 "Bitte warten …":{fr:"Un instant …",en:"Please wait …"}
});
let FB=null,ME=null,MEMBER=null,DATAKEY=null,LASTSTAMP=null;
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const lc=s=>String(s||"").trim().toLowerCase();
const isAdmin=()=>!!(ME&&ME.emailVerified&&ADMINS.includes(lc(ME.email)));
async function fb(){
  if(FB)return FB;
  const base="https://www.gstatic.com/firebasejs/"+FB_V+"/";
  const [app,auth,fs]=await Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]);
  const a=app.initializeApp(FB_CONFIG);
  FB={app:a,A:auth,F:fs,auth:auth.getAuth(a),db:fs.getFirestore(a)};
  FB.auth.languageCode=LANG;
  return FB;
}
/* ---- data: fetch encrypted file, decrypt with the key from Firestore ---- */
async function fetchEnc(){const r=await fetch(DATA_URL+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
async function getDataKey(){
  if(DATAKEY)return DATAKEY;
  const {F,db}=await fb();const s=await F.getDoc(F.doc(db,"secret","key"));
  if(!s.exists())throw new Error("no key");
  const kv=String(s.data().k||"").trim().replace(/^["'“”«]+|["'“”»]+$/g,"");
  DATAKEY=await crypto.subtle.importKey("raw",b64(kv),{name:"AES-GCM"},false,["decrypt"]);
  return DATAKEY;
}
function applyData(d){
  S.meta=d.meta||null;
  for(const [k,src] of [["days","days"],["crew","crew"],["locs","locations"],["places","places"],["dispos","dispos"]])S[k]=(CLEAN[k]||(x=>x))(arr(d[src]));
  MEMO.clear();saveCache();S.loaded=true;
}
async function load(force){
  if(!MEMBER&&!isAdmin())return false;
  const enc=await fetchEnc();
  if(!force&&enc.stamp&&enc.stamp===LASTSTAMP&&S.loaded)return true;
  const key=await getDataKey();
  const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(enc.iv)},key,b64(enc.ct));
  LASTSTAMP=enc.stamp||null;applyData(JSON.parse(new TextDecoder().decode(pt)));scheduleRender();return true;
}
function loadErr(err){
  const c=(err&&(err.code||err.name))||"",m=(err&&err.message)||String(err);
  let why;
  if(/permission/.test(c)||/permission/i.test(m))why="Kein Zugriff auf den Schlüssel (Firebase-Regeln prüfen)";
  else if(m==="no key")why="Schlüssel fehlt in Firebase (Sammlung secret, Dokument key, Feld k)";
  else if(c==="OperationError"||/decrypt|InvalidAccessError|DataError/i.test(c+m))why="Schlüssel passt nicht zu den Daten (Wert von secret/key prüfen)";
  else if(/^HTTP/.test(m))why="Datendatei nicht gefunden ("+m+")";
  else why=m;
  return L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen.")+" ["+why+"]";
}
/* ---- membership: invited addresses join once (members/{uid}); blocked = active:false ---- */
async function checkMember(){
  const {F,db}=await fb();const u=ME;
  const ref=F.doc(db,"members",u.uid);let s=await F.getDoc(ref);
  if(!s.exists()){
    let inv=null;try{inv=await F.getDoc(F.doc(db,"invites",lc(u.email)))}catch(_){}
    if(!inv||!inv.exists())return isAdmin()?"ok":"none";
    await F.setDoc(ref,{active:true,email:lc(u.email),name:inv.data().name||"",joinedAt:F.serverTimestamp()});
    s=await F.getDoc(ref);
  }
  const m=s.data();if(m.active!==true)return isAdmin()?"ok":"blocked";
  if(m.email!==lc(u.email))F.updateDoc(ref,{email:lc(u.email)}).catch(()=>{});
  MEMBER=m;return "ok";
}
function clearLocal(){try{localStorage.removeItem(CACHE_KEY)}catch(_){}S.days=[];S.crew=[];S.locs=[];S.places=[];S.dispos=[];S.meta=null;S.loaded=false;MEMO.clear();DATAKEY=null;MEMBER=null;LASTSTAMP=null}
/* ---- sign-in screen ---- */
let AUTHMODE="login";
const errText=e=>{const c=(e&&e.code)||"";
  if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c))return L("E-Mail oder Passwort falsch.");
  if(/email-already-in-use/.test(c))return L("Für diese Adresse gibt es schon ein Konto. Bitte anmelden.");
  if(/invalid-email/.test(c))return L("Ungültige E-Mail-Adresse.");
  if(/weak-password/.test(c))return L("Mindestens 8 Zeichen.");
  if(/too-many-requests/.test(c))return L("Zu viele Versuche. Bitte kurz warten.");
  if(/requires-recent-login/.test(c))return L("Aktuelles Passwort falsch.");
  if(/network/.test(c))return L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen.");
  return (e&&e.message)||String(e)};
function gateEl(){
  let g=document.getElementById("gate");
  if(!g){g=document.createElement("div");g.id="gate";g.className="gate";document.body.appendChild(g);
    g.addEventListener("submit",onGateSubmit);
    g.addEventListener("click",onGateClick);}
  return g;
}
function showGate(mode,msg,isErr){
  AUTHMODE=mode||AUTHMODE;const g=gateEl();
  const em=ME?esc(ME.email):(g.querySelector("#gem")?esc(g.querySelector("#gem").value):"");
  const head='<h2>Tschugger <span>Tigerblood</span></h2>';
  const langs='<div class="lang glang"><button type="button" data-glang="de">DE</button><button type="button" data-glang="fr">FR</button><button type="button" data-glang="en">EN</button></div>';
  const note=msg?'<p class="'+(isErr?'gerr':'gok')+'" role="alert">'+esc(msg)+'</p>':'<p class="gerr" role="alert"></p>';
  let f="";
  if(AUTHMODE==="login")f='<form class="gbox" data-f="login">'+head+'<p class="ghint">'+L("Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die du der Produktion angegeben hast.")+'</p><label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><label for="gpw">'+L("Passwort")+'</label><input id="gpw" type="password" autocomplete="current-password" required><button type="submit">'+L("Anmelden")+'</button>'+note+'<button type="button" class="glink" data-gmode="reset">'+L("Passwort vergessen?")+'</button><button type="button" class="glink" data-gmode="register">'+L("Erstes Mal hier? Konto erstellen")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="register")f='<form class="gbox" data-f="register">'+head+'<p class="ghint">'+L("Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die du der Produktion angegeben hast.")+'</p><label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><label for="gpw">'+L("Passwort")+'</label><input id="gpw" type="password" autocomplete="new-password" minlength="8" required><label for="gpw2">'+L("Passwort wiederholen")+'</label><input id="gpw2" type="password" autocomplete="new-password" minlength="8" required><p class="ghint">'+L("Mindestens 8 Zeichen.")+'</p><button type="submit">'+L("Konto erstellen")+'</button>'+note+'<button type="button" class="glink" data-gmode="login">'+L("Schon ein Konto? Anmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="reset")f='<form class="gbox" data-f="reset">'+head+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><button type="submit">'+L("Link zum Zurücksetzen senden")+'</button>'+note+'<button type="button" class="glink" data-gmode="login">'+L("Zurück")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="verify")f='<form class="gbox" data-f="verify">'+head+'<p class="gtitle">'+L("Bitte bestätige zuerst deine E-Mail-Adresse.")+'</p><p class="ghint">'+L("Wir haben dir eine Mail mit einem Bestätigungslink geschickt. Tippe auf den Link und komm dann hierher zurück.")+'</p><p class="ghint"><b>'+em+'</b></p><button type="submit">'+L("Ich habe bestätigt")+'</button>'+note+'<button type="button" class="glink" data-gact="resend">'+L("Mail nochmals senden")+'</button><button type="button" class="glink" data-gact="signout">'+L("Abmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="denied"||AUTHMODE==="blocked")f='<div class="gbox">'+head+'<p class="gtitle">'+L("Kein Zugang")+'</p><p class="ghint">'+(AUTHMODE==="blocked"?L("Dein Zugang wurde gesperrt. Bitte melde dich bei der Produktion."):L("Deine Adresse ist (noch) nicht für die Crew-App freigeschaltet. Bitte melde dich bei der Produktion."))+'</p><p class="ghint"><b>'+em+'</b></p><button type="button" class="gbtn" data-gact="retry">'+L("Aktualisieren")+'</button><button type="button" class="glink" data-gact="signout">'+L("Abmelden")+'</button>'+langs+'</div>';
  else if(AUTHMODE==="wait")f='<div class="gbox">'+head+'<p class="ghint">'+L("Bitte warten …")+'</p></div>';
  g.innerHTML=f;g.querySelectorAll("[data-glang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.glang===LANG));
  g.hidden=false;document.body.style.overflow="hidden";
  const first=g.querySelector("input:not([value]),input[value='']")||g.querySelector("#gpw");if(first&&AUTHMODE!=="wait")setTimeout(()=>first.focus(),50);
}
function hideGate(){const g=document.getElementById("gate");if(g){g.hidden=true;g.innerHTML=""}document.body.style.overflow=""}
function gateMsg(t,isErr){const p=document.querySelector("#gate .gerr,#gate .gok");if(p){p.className=isErr?"gerr":"gok";p.textContent=t}}
async function onGateSubmit(e){
  e.preventDefault();const f=e.target;const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;gateMsg("",true);
  try{
    const {A,auth}=await fb();const em=f.querySelector("#gem")?f.querySelector("#gem").value.trim():"";const pw=f.querySelector("#gpw")?f.querySelector("#gpw").value:"";
    if(f.dataset.f==="login"){window.__justSignedIn=true;await A.signInWithEmailAndPassword(auth,em,pw)}
    else if(f.dataset.f==="register"){
      if(pw.length<8)throw {code:"weak-password"};
      if(pw!==f.querySelector("#gpw2").value){gateMsg(L("Die Passwörter stimmen nicht überein."),true);if(btn)btn.disabled=false;return}
      window.__justSignedIn=true;const c=await A.createUserWithEmailAndPassword(auth,em,pw);
      try{await A.sendEmailVerification(c.user,{url:location.origin+location.pathname})}catch(_){}
    }
    else if(f.dataset.f==="reset"){try{await A.sendPasswordResetEmail(auth,em,{url:location.origin+location.pathname})}catch(err){if(!/user-not-found/.test(err.code||""))throw err}gateMsg(L("Wenn es für diese Adresse ein Konto gibt, kommt gleich eine Mail zum Zurücksetzen."),false)}
    else if(f.dataset.f==="verify"){await ME.reload();if(auth.currentUser.emailVerified){await ME.getIdToken(true);await afterSignIn(auth.currentUser)}else gateMsg(L("Noch nicht bestätigt. Schau auch im Spam-Ordner nach."),true)}
  }catch(err){console.error(err);gateMsg(errText(err),true)}
  if(btn)btn.disabled=false;
}
async function onGateClick(e){
  const lb=e.target.closest("[data-glang]");if(lb){LANG=lb.dataset.glang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;showGate(AUTHMODE);render();return}
  const m=e.target.closest("[data-gmode]");if(m){showGate(m.dataset.gmode);return}
  const a=e.target.closest("[data-gact]");if(!a)return;
  const {A,auth}=await fb();
  if(a.dataset.gact==="signout"){await A.signOut(auth)}
  else if(a.dataset.gact==="resend"){try{await A.sendEmailVerification(auth.currentUser,{url:location.origin+location.pathname});gateMsg(L("Mail gesendet."),false)}catch(err){gateMsg(errText(err),true)}}
  else if(a.dataset.gact==="retry"){if(auth.currentUser)afterSignIn(auth.currentUser)}
}
async function afterSignIn(u){
  ME=u;
  if(!u.emailVerified){showGate("verify");return}
  let st;try{st=await checkMember()}catch(err){console.error(err);showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true);return}
  if(st!=="ok"){clearLocal();render();showGate(st==="blocked"?"blocked":"denied");return}
  hideGate();acctButton(true);
  try{await load(true)}catch(err){console.error(err);showMsg(loadErr(err),15000)}
  if(window.__justSignedIn){window.__justSignedIn=false;maybeOfferA2hs(true)}else maybeOfferA2hs(false);
}
/* ---- account sheet: own password, own email, sign out; admin entry ---- */
function acctButton(on){
  let b=document.getElementById("acctBtn");
  if(!b){b=document.createElement("button");b.id="acctBtn";b.className="refresh";b.type="button";
    b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>';
    const r=$("#refresh");r.parentNode.insertBefore(b,r);b.addEventListener("click",showAcct)}
  b.setAttribute("aria-label",L("Mein Konto"));b.title=L("Mein Konto");b.hidden=!on;
}
function showAcct(){
  let s=document.getElementById("acct");
  if(!s){s=document.createElement("div");s.id="acct";s.className="a2hs";s.setAttribute("role","dialog");s.setAttribute("aria-modal","true");document.body.appendChild(s);
    s.addEventListener("click",onAcctClick);s.addEventListener("submit",onAcctSubmit)}
  s.innerHTML='<div class="a2box acbox"><h3>'+L("Mein Konto")+'</h3><p>'+L("Angemeldet als")+' <b>'+esc(ME.email)+'</b></p>'+
    (isAdmin()?'<div class="a2b"><button class="pri" data-ac="admin">'+L("Benutzer verwalten")+'</button></div>':'')+
    '<details><summary>'+L("Passwort ändern")+'</summary><form data-af="pw"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neues Passwort")+'<input type="password" name="pw" autocomplete="new-password" minlength="8" required></label><label>'+L("Passwort wiederholen")+'<input type="password" name="pw2" autocomplete="new-password" minlength="8" required></label><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p></form></details>'+
    '<details><summary>'+L("E-Mail-Adresse ändern")+'</summary><form data-af="em"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neue E-Mail-Adresse")+'<input type="email" name="em" autocomplete="email" required></label><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p></form></details>'+
    '<div class="a2b"><button data-ac="signout">'+L("Abmelden")+'</button><button class="lnk" data-ac="close">'+L("Schliessen")+'</button></div></div>';
  s.hidden=false;
}
async function onAcctClick(e){
  const s=document.getElementById("acct");if(e.target===s){s.hidden=true;return}
  const b=e.target.closest("[data-ac]");if(!b)return;
  if(b.dataset.ac==="close")s.hidden=true;
  else if(b.dataset.ac==="admin"){s.hidden=true;S.tab="admin";window.scrollTo(0,0);render()}
  else if(b.dataset.ac==="signout"){s.hidden=true;const {A,auth}=await fb();await A.signOut(auth)}
}
async function onAcctSubmit(e){
  e.preventDefault();const f=e.target,msg=f.querySelector(".amsg"),btn=f.querySelector("button");btn.disabled=true;msg.className="amsg";msg.textContent="";
  try{
    const {A,auth}=await fb();const u=auth.currentUser;
    await A.reauthenticateWithCredential(u,A.EmailAuthProvider.credential(u.email,f.cur.value)).catch(err=>{throw /invalid-credential|wrong-password/.test(err.code||"")?{code:"x",message:L("Aktuelles Passwort falsch.")}:err});
    if(f.dataset.af==="pw"){
      if(f.pw.value.length<8)throw {code:"weak-password"};
      if(f.pw.value!==f.pw2.value)throw {code:"x",message:L("Die Passwörter stimmen nicht überein.")};
      await A.updatePassword(u,f.pw.value);msg.classList.add("ok");msg.textContent=L("Passwort geändert.");f.reset();
    }else{
      await A.verifyBeforeUpdateEmail(u,f.em.value.trim(),{url:location.origin+location.pathname});msg.classList.add("ok");msg.textContent=L("Bestätigungslink an die neue Adresse gesendet. Die Änderung gilt, sobald du ihn antippst.");f.reset();
    }
  }catch(err){console.error(err);msg.textContent=err&&err.code==="x"?err.message:(/email-already-in-use/.test(err.code||"")?L("Diese Adresse wird schon verwendet."):errText(err))}
  btn.disabled=false;
}
/* ---- admin: invitations and members (German only; visible to admins) ---- */
const ADM={inv:[],mem:[],q:"",loaded:false,busy:false};
async function admLoad(){
  const {F,db}=await fb();
  const [i,m]=await Promise.all([F.getDocs(F.collection(db,"invites")),F.getDocs(F.collection(db,"members"))]);
  ADM.inv=i.docs.map(d=>Object.assign({id:d.id},d.data()));ADM.mem=m.docs.map(d=>Object.assign({uid:d.id},d.data()));ADM.loaded=true;render();
}
function crewEmails(){const out=[],seen=new Set();for(const g of S.crew)for(const p of (g.people||[])){const e=lc(p.email);if(!e||!/@/.test(e)||seen.has(e))continue;seen.add(e);out.push({email:e,name:p.name||"",role:p.role||""})}return out}
VIEWS.admin=function(){
  if(!isAdmin())return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(!ADM.loaded){admLoad().catch(err=>{console.error(err);showMsg("Benutzerliste konnte nicht geladen werden: "+(err.message||err),6000)});return '<div class="empty">Lade Benutzer …</div>'}
  const memBy={};ADM.mem.forEach(m=>memBy[m.email]=m);
  const invBy={};ADM.inv.forEach(i=>invBy[i.id]=i);
  const rows=[];const seen=new Set();
  for(const i of ADM.inv){const m=memBy[i.id];rows.push({email:i.id,name:i.name||(m&&m.name)||"",inv:true,m});seen.add(i.id)}
  for(const m of ADM.mem)if(!seen.has(m.email))rows.push({email:m.email,name:m.name||"",inv:false,m});
  rows.sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email,"de"));
  const q=lc(ADM.q);const vis=rows.filter(r=>!q||(r.email+" "+r.name).toLowerCase().includes(q));
  const newCrew=crewEmails().filter(c=>!invBy[c.email]&&!memBy[c.email]);
  const st=r=>r.m?(r.m.active===true?'<span class="ust ok">aktiv</span>':'<span class="ust off">gesperrt</span>'):'<span class="ust wait">eingeladen</span>';
  const site=location.origin+location.pathname;
  const mail=r=>"mailto:"+encodeURIComponent(r.email)+"?subject="+encodeURIComponent("TSCHUGGER Tigerblood – Crew-App")+"&body="+encodeURIComponent("Hallo"+(r.name?" "+r.name.split(" ")[0]:"")+"\n\nDu bist für die Crew-App von TSCHUGGER Tigerblood freigeschaltet:\n"+site+"\n\nBeim ersten Mal auf «Erstes Mal hier? Konto erstellen» tippen, mit dieser Adresse ("+r.email+") ein eigenes Passwort wählen und die Bestätigungsmail antippen.\n\nBis bald im Wallis!");
  let h='<section class="adm"><h2 class="dh">Benutzer verwalten</h2><p class="ahint">Nur eingeladene Adressen können ein Konto erstellen. Gesperrte Personen kommen sofort nicht mehr in die App. Passwort und E-Mail-Adresse verwaltet jede Person selbst.</p>'+
    '<form class="aform" data-adm="add"><input name="em" type="email" placeholder="E-Mail-Adresse" required><input name="nm" type="text" placeholder="Name (optional)"><button type="submit">Einladen</button></form>'+
    (newCrew.length?'<button class="abtn" data-adm="crew">Alle '+newCrew.length+' Adressen aus der Crewliste einladen</button>':'')+
    '<div class="astats">'+rows.length+' Benutzer · '+rows.filter(r=>r.m&&r.m.active===true).length+' aktiv · '+rows.filter(r=>!r.m).length+' noch nicht registriert</div>'+
    '<input class="search" id="aq" type="search" placeholder="Benutzer suchen" value="'+esc(ADM.q)+'">'+
    '<div class="people">'+vis.map(r=>'<div class="p"><div class="hd"><span class="nm">'+esc(r.name||r.email)+'</span>'+st(r)+'</div><div class="ct"><span class="em">'+esc(r.email)+'</span></div><div class="aacts">'+
      (!r.m?'<a href="'+mail(r)+'">Einladungsmail</a>':'')+
      (r.m?(r.m.active===true?'<button data-adm="block" data-uid="'+esc(r.m.uid)+'">Sperren</button>':'<button data-adm="unblock" data-uid="'+esc(r.m.uid)+'">Entsperren</button>'):'')+
      (r.inv?'<button data-adm="uninvite" data-em="'+esc(r.email)+'">Einladung löschen</button>':'')+
      '</div></div>').join("")+'</div></section>';
  return h;
};
document.addEventListener("input",e=>{if(e.target.id==="aq"){ADM.q=e.target.value;const p=e.target.selectionStart;render();const i=$("#aq");if(i){i.focus();i.setSelectionRange(p,p)}}});
document.addEventListener("submit",async e=>{
  const f=e.target.closest('[data-adm="add"]');if(!f)return;e.preventDefault();
  const em=lc(f.em.value),nm=f.nm.value.trim();if(!/@/.test(em))return;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"invites",em),{name:nm,addedAt:F.serverTimestamp()});showMsg(em+" eingeladen.",3000);await admLoad()}catch(err){showMsg("Fehler: "+(err.message||err),6000)}
});
document.addEventListener("click",async e=>{
  const b=e.target.closest("button[data-adm]");if(!b||ADM.busy)return;ADM.busy=true;
  try{
    const {F,db}=await fb();const a=b.dataset.adm;
    if(a==="crew"){const list=crewEmails().filter(c=>!ADM.inv.some(i=>i.id===c.email)&&!ADM.mem.some(m=>m.email===c.email));
      if(confirmSafe(list.length+" Adressen aus der Crewliste einladen?")){
        for(let i=0;i<list.length;i+=400){const batch=F.writeBatch(db);list.slice(i,i+400).forEach(c=>batch.set(F.doc(db,"invites",c.email),{name:c.name,role:c.role,addedAt:F.serverTimestamp()}));await batch.commit()}
        showMsg(list.length+" Adressen eingeladen.",4000)}}
    else if(a==="block"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:false});showMsg("Gesperrt.",3000)}
    else if(a==="unblock"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:true});showMsg("Entsperrt.",3000)}
    else if(a==="uninvite"){await F.deleteDoc(F.doc(db,"invites",b.dataset.em));showMsg("Einladung gelöscht.",3000)}
    await admLoad();
  }catch(err){console.error(err);showMsg("Fehler: "+(err.message||err),6000)}
  ADM.busy=false;
});
function confirmSafe(t){try{return window.confirm(t)}catch(_){return true}}

/* ---------- start ---------- */
applyStatic();
loadCache();
render();
(async()=>{
  const b=$("#refresh");b.hidden=false;
  b.addEventListener("click",async()=>{
    if(b.classList.contains("spin"))return;b.classList.add("spin");
    try{if(await load(true)){const c=lastCheck(S.meta);showMsg(L("Neueste Daten geladen.")+(c?" "+L("Dropbox zuletzt geprüft")+" "+fmtStamp(c)+".":""),5000)}}
    catch(err){console.error(err);showMsg(L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen."),5000)}
    setTimeout(()=>b.classList.remove("spin"),400);
  });
  if(!S.loaded&&!S.days.length)showGate("wait");
  try{
    const {A,auth}=await fb();
    await A.setPersistence(auth,A.browserLocalPersistence).catch(()=>{});
    A.onAuthStateChanged(auth,u=>{
      if(!u){ME=null;acctButton(false);clearLocal();if(S.tab==="admin")S.tab="plan";render();showGate("login");return}
      afterSignIn(u);
    });
  }catch(err){console.error(err);if(!S.days.length)showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true)}
  setInterval(()=>{if(document.visibilityState==="visible")load(false).catch(()=>{})},POLL_MS);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")load(false).catch(()=>{})});
})();
