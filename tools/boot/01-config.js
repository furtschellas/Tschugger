/* ---------- web boot (GitHub Pages): Firebase sign-in + encrypted data file ---------- */
/* shared date/time formats (in the language of the app): fmtDT «17.10. 20:12», fmtD «17.10.2026», fmtT «20:12» */
const _loc=()=>(typeof LOC!=="undefined"&&LOC[LANG])||"de-CH";
const fmtDT=x=>{try{const d=new Date(x);return isNaN(d)?"":d.toLocaleDateString(_loc(),{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString(_loc(),{hour:"2-digit",minute:"2-digit"})}catch(_){return ""}};
const fmtD=x=>{try{const d=new Date(x);return isNaN(d)?"":d.toLocaleDateString(_loc(),{day:"2-digit",month:"2-digit",year:"numeric"})}catch(_){return ""}};
const fmtT=x=>{try{const d=new Date(x);return isNaN(d)?"":d.toLocaleTimeString(_loc(),{hour:"2-digit",minute:"2-digit"})}catch(_){return ""}};
const FB_CONFIG={apiKey:"AIzaSyBrHUJumAArmHv92qhZEbUFXSWrwvZaKjQ",authDomain:"tschugger-83692.firebaseapp.com",projectId:"tschugger-83692",storageBucket:"tschugger-83692.firebasestorage.app",messagingSenderId:"786764568575",appId:"1:786764568575:web:552eeefa77c44f5d24b9ca"};
const FB_V="10.12.2",ROOT_OWNERS=["furtschellas@gmail.com"],ADMINS=ROOT_OWNERS.slice(),DATA_URL="data.enc.json",POLL_MS=5*60*1000;
