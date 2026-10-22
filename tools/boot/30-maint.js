/* ---- maintenance note: shown at every start of the app (once per opening, after the welcome note), closed with «OK».
   Fixed text for the time of the Coverday integration – to be removed again in the code ---- */
const MAINT={
 de:{t:"Wartungsarbeiten",p:"Gerade bauen wir das Coverday-Management in die App ein. Wegen der Drehplanänderung zwischen DT03 und DT04 kann es sein, dass DT03 und DT04 vorübergehend falsch angezeigt werden. Im Zweifel gilt das Callsheet aus der Dropbox. Danke für dein Verständnis!"},
 fr:{t:"Travaux de maintenance",p:"Nous intégrons en ce moment la gestion des Coverdays dans l'app. En raison du changement du plan de tournage entre DT03 et DT04, DT03 et DT04 peuvent être affichés incorrectement pendant un moment. En cas de doute, la feuille de service dans Dropbox fait foi. Merci de ta compréhension !"},
 it:{t:"Lavori di manutenzione",p:"Stiamo integrando la gestione dei Coverday nell'app. A causa della modifica del piano di lavorazione tra DT03 e DT04, DT03 e DT04 potrebbero essere visualizzati in modo errato per un po'. In caso di dubbio vale il foglio di convocazione in Dropbox. Grazie per la comprensione!"},
 en:{t:"Maintenance",p:"We are currently building the Coverday management into the app. Because of the schedule change between DT03 and DT04, DT03 and DT04 may be shown incorrectly for a while. If in doubt, the callsheet in Dropbox applies. Thanks for your understanding!"}};
let MAINT_DONE=false;
function maybeMaint(){if(MAINT_DONE||!ME||navigator.webdriver||(typeof WELCOME_OPEN!=="undefined"&&WELCOME_OPEN)||(typeof ONBOARD!=="undefined"&&ONBOARD)||document.querySelector(".a2hs,.tour-card"))return;
  MAINT_DONE=true;const T=MAINT[LANG]||MAINT.en,d=mkDialog("maint");
  d.innerHTML='<div class="a2box wlbox" role="alertdialog" aria-labelledby="mtt"><h3 id="mtt">'+esc(T.t)+'</h3><p class="wlwarn">'+esc(T.p)+'</p><div class="a2b"><button type="button" class="pri" data-mtok>OK</button></div></div>';
  d.addEventListener("click",e=>{if(e.target.closest("[data-mtok]"))d.remove()});document.body.appendChild(d)}
setInterval(()=>{try{maybeMaint()}catch(_){}},1500);
