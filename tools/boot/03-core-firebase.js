/* languages offered in the app; the main admin picks them (Firestore config/app.langs), cached for the sign-in screen */
let APPLANGS=["de","fr","it","en"];window.UNIT3=false;window.BDAYPUB=false;window.DOCS={};try{window.DOCS=JSON.parse(localStorage.getItem("appdocs")||"{}")||{}}catch(_){}window.GOOGLEON=true;try{window.GOOGLEON=localStorage.getItem("appgoogle")!=="0"}catch(_){}window.PUBV={phone:false,email:false,mycal:false};try{const x=JSON.parse(localStorage.getItem("apppubv")||"null");if(x&&typeof x==="object")Object.assign(window.PUBV,x)}catch(_){}window.SCRIPTON=true;window.TABSON=null;window.TABORDER=null;window.AUTOUPD=true;try{try{const o=JSON.parse(localStorage.getItem("apptaborder")||"null");if(Array.isArray(o))window.TABORDER=o}catch(_){}window.AUTOUPD=localStorage.getItem("appauto")!=="0";try{const t=JSON.parse(localStorage.getItem("apptabs")||"null");if(Array.isArray(t)&&t.length)window.TABSON=t}catch(_){}window.SCRIPTON=localStorage.getItem("appscript")!=="0";window.BDAYPUB=localStorage.getItem("appbdaypub")==="1";const u=localStorage.getItem("appunit2");if(u!==null)window.UNIT2=u==="1";window.UNIT3=localStorage.getItem("appunit3")==="1";const mu=localStorage.getItem("appmap");if(mu)window.MAPURL=mu}catch(_){}
try{window.SCACKON=localStorage.getItem("appscack")!=="0";window.RIDEACKON=localStorage.getItem("apprideack")!=="0"}catch(_){window.SCACKON=window.RIDEACKON=true}   /* quittieren on/off, until config/app is loaded */
try{const x=JSON.parse(localStorage.getItem("applangs")||"null");if(Array.isArray(x)&&x.length)APPLANGS=x.filter(l=>LANGS.some(z=>z[0]===l))}catch(_){}
function applyLangs(){
  if(!APPLANGS.length)APPLANGS=["de"];
  document.querySelectorAll(".lang button[data-lang],.lang button[data-glang]").forEach(b=>{b.style.display=APPLANGS.includes(b.dataset.lang||b.dataset.glang)?"":"none"});
  document.querySelectorAll(".lang").forEach(d=>{d.style.display=APPLANGS.length<2?"none":""});
  if(!APPLANGS.includes(LANG)){LANG=APPLANGS[0];store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
}
async function loadLangs(){
  try{const {F,db}=await fb();const d=await F.getDoc(F.doc(db,"config","app"));const l=d.exists()&&d.data().langs;
    if(Array.isArray(l)&&l.length){APPLANGS=l.filter(x=>LANGS.some(z=>z[0]===x));try{localStorage.setItem("applangs",JSON.stringify(APPLANGS))}catch(_){}}
    const u2=d.exists()?d.data().unit2!==false:true;if(window.UNIT2!==u2){window.UNIT2=u2;try{localStorage.setItem("appunit2",u2?"1":"0")}catch(_){}render()}
    {const c=d.exists()?d.data():{};const nv={phone:c.phonePublic===true,email:c.emailPublic===true,mycal:c.mycalPublic===true};if(JSON.stringify(nv)!==JSON.stringify(window.PUBV)){window.PUBV=nv;try{localStorage.setItem("apppubv",JSON.stringify(nv))}catch(_){}render()}}
    {const go=!(d.exists()&&d.data().googleLogin===false);if(window.GOOGLEON!==go){window.GOOGLEON=go;try{localStorage.setItem("appgoogle",go?"1":"0")}catch(_){}try{const g=document.getElementById("gate");if(g&&!g.hidden&&(AUTHMODE==="login"||AUTHMODE==="register")&&!g.querySelector("input:focus"))showGate(AUTHMODE)}catch(_){}}}
    {const c=d.exists()?d.data():{};window.A2AGAIN=c.a2again===true;try{localStorage.setItem("appa2again",window.A2AGAIN?"1":"0")}catch(_){}}
    {const c=d.exists()?d.data():{};const z=+c.chgClearAt||0;if(window.CHGCLR!==z){window.CHGCLR=z;try{localStorage.setItem("appchgclr",String(z))}catch(_){}render()}}   /* «Änderungen» in Today emptied for everybody */
    {const c=d.exists()?d.data():{};const pe=c.pushEnabled!==false;if(window.PUSHEN!==pe){window.PUSHEN=pe;try{localStorage.setItem("apppushon",pe?"1":"0")}catch(_){}render()}}
    {const c=d.exists()?d.data():{};const ce=c.chatEnabled!==false,te=c.tourEnabled!==false;if(window.CHATEN!==ce||window.TOUREN!==te){window.CHATEN=ce;window.TOUREN=te;try{localStorage.setItem("appchaton",ce?"1":"0");localStorage.setItem("apptouron",te?"1":"0")}catch(_){}}}
    {let cu=String((d.exists()&&d.data().chatUrl)||"");if(cu&&!/^https:\/\//i.test(cu))cu="";   /* only https – the sign-in token goes there */if(window.CHATURL!==cu){window.CHATURL=cu;try{localStorage.setItem("appchat",cu)}catch(_){}}}
    {const dc=(d.exists()&&d.data().docs)||{};window.DOCS=dc;try{localStorage.setItem("appdocs",JSON.stringify(dc))}catch(_){}}
    const bp=d.exists()&&d.data().bdayPublic===true;if(window.BDAYPUB!==bp){window.BDAYPUB=bp;try{localStorage.setItem("appbdaypub",bp?"1":"0")}catch(_){}render()}
    const to=d.exists()&&Array.isArray(d.data().tabOrder)?d.data().tabOrder:null;if(JSON.stringify(window.TABORDER)!==JSON.stringify(to)){window.TABORDER=to;try{to?localStorage.setItem("apptaborder",JSON.stringify(to)):localStorage.removeItem("apptaborder")}catch(_){}render()}
    const tb=d.exists()&&Array.isArray(d.data().tabs)&&d.data().tabs.length?d.data().tabs:null;if(JSON.stringify(window.TABSON)!==JSON.stringify(tb)){window.TABSON=tb;try{tb?localStorage.setItem("apptabs",JSON.stringify(tb)):localStorage.removeItem("apptabs")}catch(_){}render()}
    window.FAILALARM=d.exists()?d.data().failAlarm!==false:true;
    window.OWNEV=d.exists()?d.data().ownEvents!==false:true;
    window.CSMAPON=d.exists()?d.data().csMap!==false:true;
    {const mn=d.exists()?d.data().myNav!==false:true;if(window.MYNAV!==mn){window.MYNAV=mn;try{localStorage.setItem("appmynav",mn?"1":"0")}catch(_){}render()}}
    /* App-Verwaltung → Produktion: name of the project, production company and its address (exports, title of the app) */
    {const g=k=>d.exists()&&typeof d.data()[k]==="string"?d.data()[k]:"";window.PROJNAME=g("projName");window.PRODCO=g("prodCo");window.PRODADDR=g("prodAddr");try{localStorage.setItem("appproj",JSON.stringify([PROJNAME,PRODCO,PRODADDR]))}catch(_){}if(typeof projApply==="function")projApply()}
    /* times of the quittances: Drehplan / Callsheet, each on phones (pm, cm) and computers (pd, cd) */
    {const at=(d.exists()&&d.data().ackTimes)||{};window.ACKT={pm:at.pm!==false,pd:at.pd!==false,cm:at.cm!==false,cd:at.cd!==false};for(const k in ACKT)document.documentElement.classList.toggle("nosct"+k,!ACKT[k])}
    /* scenes and rides quittiert (App-Verwaltung → Einstellungen; on unless switched off) */
    {const sa=d.exists()?d.data().sceneAck!==false:true,ra=d.exists()?d.data().rideAck!==false:true;if(window.SCACKON!==sa||window.RIDEACKON!==ra){window.SCACKON=sa;window.RIDEACKON=ra;try{localStorage.setItem("appscack",sa?"1":"0");localStorage.setItem("apprideack",ra?"1":"0")}catch(_){}render()}}   /* map in the callsheet (App-Verwaltung → Einstellungen) */
    window.GCALON=d.exists()&&!!d.data().gcal;
    const au=d.exists()?d.data().autoUpdate!==false:true;if(window.AUTOUPD!==au){window.AUTOUPD=au;try{localStorage.setItem("appauto",au?"1":"0")}catch(_){}}
    const so=d.exists()?d.data().script!==false:true;if(window.SCRIPTON!==so){window.SCRIPTON=so;try{localStorage.setItem("appscript",so?"1":"0")}catch(_){}render()}
    const u3=d.exists()&&d.data().unit3===true;if(window.UNIT3!==u3){window.UNIT3=u3;try{localStorage.setItem("appunit3",u3?"1":"0")}catch(_){}render()}
    /* links (motive list, map, chat) are in config/private – only for the crew; the older fields in config/app still count */
    let pv={};try{const {auth}=await fb();if(auth.currentUser){const q=await F.getDoc(F.doc(db,"config","private"));if(q.exists())pv=q.data();window.PRIVOK=true}}catch(_){}
    const cf=k=>typeof pv[k]==="string"&&pv[k]?pv[k]:(d.exists()&&typeof d.data()[k]==="string"?d.data()[k]:"");
    window.LOCSHEET=cf("locSheet");
    /* Google map in the callsheet map: on/off, its colours, hidden layers (config/private) */
    {const g=pv.gmap&&typeof pv.gmap==="object"?pv.gmap:{};window.GMAPSET={on:g.on===true,color:g.color!==false,off:Array.isArray(g.off)?g.off.map(String):[]}}window.SCENESHEET=typeof pv.sceneSheet==="string"?pv.sceneSheet:"";window.SHEETSA=typeof pv.sheetSa==="string"?pv.sheetSa:"";window.SHEETST=pv.sceneSheetSt&&typeof pv.sceneSheetSt==="object"?pv.sceneSheetSt:null;
    {const cu=cf("chatUrl");if(cu&&/^https:\/\//i.test(cu)&&window.CHATURL!==cu){window.CHATURL=cu;try{localStorage.setItem("appchat",cu)}catch(_){}}}
    const mu=cf("mapUrl");if((window.MAPURL||"")!==mu){window.MAPURL=mu;try{localStorage.setItem("appmap",mu)}catch(_){}render()}
  }catch(err){console.warn("langs",err)}
  applyLangs();
}
const langSel=(name,v)=>'<select name="'+name+'" id="'+name+'">'+LANGS.filter(([k])=>APPLANGS.includes(k)).map(([k,t])=>'<option value="'+k+'"'+(k===v?' selected':'')+'>'+t+'</option>').join("")+'</select>';
const clean=v=>String(v||"").trim().slice(0,80);
const DIETS=[["none","Ich esse alles"],["vegetarian","Vegetarisch"],["vegan","Vegan"],["pescatarian","Pescetarisch"],["nopork","Kein Schweinefleisch"],["halal","Halal"],["kosher","Koscher"]];
const INTOL=[["dairy","Keine Milchprodukte / laktosefrei"],["gluten","Glutenfrei"],["nuts","Ohne Nüsse"],["peanuts","Ohne Erdnüsse"],["shellfish","Ohne Meeresfrüchte"],["eggs","Ohne Eier"]];
/* older profiles stored "nodairy" as diet */
const normDiet=m=>{const o=Object.assign({},m||{});o.intol=Array.isArray(o.intol)?o.intol.slice():[];if(o.diet==="nodairy"){o.diet="none";if(!o.intol.includes("dairy"))o.intol.push("dairy")}return o};
const intolBoxes=(pre,sel)=>'<div class="chk">'+INTOL.map(([k,t])=>'<label class="ck"><input type="checkbox" name="'+pre+'" value="'+k+'"'+((sel||[]).includes(k)?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>';
const readBoxes=(root,pre)=>[...root.querySelectorAll('input[name="'+pre+'"]:checked')].map(x=>x.value);
const dietSel=(name,v,req)=>'<select name="'+name+'" id="'+name+'"'+(req?' required':'')+'>'+(req&&!v?'<option value="" selected>– '+L("bitte wählen")+' –</option>':'')+DIETS.map(([k,t])=>'<option value="'+k+'"'+(k===(v||(req?"":"none"))?' selected':'')+'>'+L(t)+'</option>').join("")+'</select>';
const dietText=m0=>{if(!m0)return"";const m=normDiet(m0);const d=DIETS.find(x=>x[0]===m.diet);const a=String(m.allergies||"").trim();
  return [d&&d[0]!=="none"?L(d[1]):"",...m.intol.map(k=>{const t=INTOL.find(x=>x[0]===k);return t?L(t[1]):""}),a?L("Allergien")+": "+a:""].filter(Boolean).join(" · ")};
const PENDING_KEY="crewprofile:pending";
const splitName=n=>{const p=String(n||"").trim().split(/\s+/).filter(Boolean);return p.length?{firstName:p[0],lastName:p.slice(1).join(" ")}:{firstName:"",lastName:""}};
function crewPerson(email){const e=lc(email);if(!e)return null;for(const g of S.crew)for(const p of (g.people||[]))if(lc(p.email)===e)return p;return null}
let FB=null,ME=null,MEMBER=null,DATAKEY=null,LASTSTAMP=null;
/* stamp of the data this device has stored: if the file online has the same stamp, the 0.8 MB file is neither loaded nor decrypted again */
try{if(localStorage.getItem(CACHE_KEY))LASTSTAMP=localStorage.getItem("dstamp:v1")||null}catch(_){}
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
/* JSON encrypted with the crew key (AES-GCM, 12-byte IV + ciphertext, base64): own events, push devices, broadcasts, calendar feed */
async function ownDec(key,c){const raw=b64(c);return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},key,raw.slice(12))))}
async function ownEnc(o){const key=await getDataKey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(o))));
  const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);let bin="";for(let i=0;i<all.length;i+=8192)bin+=String.fromCharCode.apply(null,all.subarray(i,i+8192));return btoa(bin)}
const lc=s=>String(s||"").trim().toLowerCase();
/* main admin is fixed; further admins are listed by the main admin in Firestore admins/{email} */
let COADMIN=false;
/* SIMROLE: App-Verwaltung → Log → «Berechtigungen testen» looks at the app with the rights of another role for a moment */
let SIMROLE=null;
const isOwner=()=>!SIMROLE&&!!(ME&&ME.emailVerified&&ADMINS.includes(lc(ME.email)));
const isAdmin=()=>SIMROLE?!!SIMROLE.adm:(isOwner()||!!(COADMIN&&ME&&ME.emailVerified));
/* roles: the owner creates roles (roles/{id}: name + perms) and assigns them (userroles/{email}); admins have every permission except the app settings */
/* permissions, grouped by main topic (topic in capitals, short labels so they fit on one line on phones) */
/* name of the project (App-Verwaltung → Produktion), default TSCHUGGER Tigerblood; cached for the next start */
try{const v=JSON.parse(localStorage.getItem("appproj")||"null");if(Array.isArray(v))[window.PROJNAME,window.PRODCO,window.PRODADDR]=v}catch(_){}
try{window.MYNAV=localStorage.getItem("appmynav")!=="0"}catch(_){}
window.projName=()=>String(window.PROJNAME||"").trim()||"TSCHUGGER Tigerblood";
window.projFile=()=>projName().replace(/[^\w-]+/g,"-").replace(/^-+|-+$/g,"")||"Crew-App";
/* the name in the title of the browser tab and in the heading of the app */
window.projApply=()=>{try{const n=projName();document.title=n;const h=document.querySelector("header h1, .hd h1, h1.logo");if(h&&window.PROJNAME){const i=n.indexOf(" ");h.innerHTML=i>0?esc(n.slice(0,i))+" <span>"+esc(n.slice(i+1))+"</span>":esc(n)}}catch(_){}};
if(window.PROJNAME)projApply();
/* groups (themes) in this order – also in «Wer hat welchen Zugriff?» */
const PERMS=[["view.plan","Drehplan sehen","Drehplan"],["view.prep","Prep sehen","Drehplan"],["coverday.manage","Coverday verwalten","Drehplan"],["view.dispo","Callsheet sehen","Callsheet"],["view.loc","Locations sehen","Callsheet"],["view.csmap","Callsheet-Karte sehen","Callsheet"],["view.info","Infos sehen","Callsheet"],["view.ra","Gefährdungsbeurteilung sehen","Callsheet"],["view.setfp","Setfloorpläne sehen","Callsheet"],["rides.confirm","Fahrten quittieren","Quittierung"],["scenes.ack","Szenen quittieren","Quittierung"],["scenes.log","Szenen-Protokoll sehen","Reports"],["scenes.see","Quittierungen sehen","Quittierung"],["scenes.times","Quittierungszeiten sehen","Quittierung"],["view.script","Drehbuch sehen","Drehbuch"],["view.blocking","Blocking sehen","Drehbuch"],["view.crew","Crewliste sehen","Crewliste"],["view.phone","Telefon sehen","Crewliste"],["view.email","E-Mail sehen","Crewliste"],["contacts.extra","Externe Kontakte sehen","Crewliste"],["crew.food","Essen sehen","Crewliste"],["crew.bday","Geburtstage sehen","Crewliste"],["crew.vcf","VCF exportieren","Crewliste"],["view.mycal","Meine Termine sehen","Termine"],["mycal.all","Alle Termine sehen","Termine"],["push.send","Push-Nachrichten senden","Termine"],["rides.manage","Fahrten Manager","Termine"],["events.add","Eigene Termine erstellen","Termine"],["users.view","Benutzer sehen","Access"],["users.edit","Benutzer ändern","Access"],["users.invite","Benutzer einladen","Access"],["users.requests","Anfragen freischalten","Access"],["roles.view","Rollen sehen","Access"],["roles.assign","Rollen pflegen","Access"],["roles.edit","Rollen bearbeiten","Access"],["settings","Einstellungen ändern","App"],["audit.view","Protokoll sehen","App"],["data.check","Dokumente prüfen","App"]];
/* a permission of the list, or one of the report folders (rep.<folder>, known only once the data is loaded) */
const permKnown=p=>PERMS.some(x=>x[0]===p)||/^rep\.[a-z0-9-]+$/.test(String(p));window.permKnown=permKnown;
const VIEWPERMS=PERMS.filter(x=>x[0].startsWith("view.")).map(x=>x[0]);
const ADMIN_DEFAULT=PERMS.map(x=>x[0]).filter(p=>p!=="settings");
let MYPERMS=[],MYROLE="",ADMINPERMS=ADMIN_DEFAULT.slice();
const can=p=>isOwner()||(isAdmin()&&ADMINPERMS.includes(p))||MYPERMS.includes(p);
/* the gear (App-Verwaltung) only with the permission «Einstellungen ändern» */
/* lunch menus: only admins/owners and people with the catering role */
window.canMenu=()=>!!(ME&&(isAdmin()||/cater/i.test(MYROLE||"")));
/* roles: «Rollen bearbeiten» = create/change/delete roles (not the admin role), «Rollen pflegen» = give people a role (not admin/owner) */
window.canRoleEdit=()=>isAdmin()||can("roles.edit");window.canRoleAssign=()=>isAdmin()||can("roles.assign");
const canAdm=()=>isOwner()||["settings","audit.view","users.view","users.invite","users.requests","users.edit","roles.edit","roles.assign","roles.view","data.check","coverday.manage"].some(p=>can(p));   /* scene log and reports: own topic «Reports» (button in the head) */   /* gear = App-Verwaltung: anyone with one of its permissions */
/* what someone sees: without a role everything as before; with a role (or as admin) only the areas the role allows */
window.viewOK=k=>{if(!ME||isOwner())return true;if(!isAdmin()&&!MYROLE){if(["plan","script","blocking"].includes(k))return false;return k in window.PUBV?window.PUBV[k]===true:true}return can("view."+k)};
window.canPerm=can;
/* stability: never wait forever on the network (film sets often have weak reception) */
const withTimeout=(p,ms,what)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(Object.assign(new Error((what||"request")+" timeout"),{code:"unavailable"})),ms))]);
let FBP=null;
async function fb(){
  if(FB)return FB;
  /* the app parts are separate scripts: Firebase starts only when all of them are loaded (it uses functions from later parts) */
  if(!FBP)FBP=(document.readyState==="loading"?new Promise(r=>document.addEventListener("DOMContentLoaded",r,{once:true})):Promise.resolve()).then(fbInit).catch(err=>{FBP=null;throw err});
  return FBP;
}
async function fbInit(){
  const base="https://www.gstatic.com/firebasejs/"+FB_V+"/";
  const [app,auth,fs]=await withTimeout(Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]),20000,"firebase");
  /* signed out on this device: the local Firebase copy (names, lists) is removed before Firebase opens it again */
  try{if(localStorage.getItem("fsclear")){await new Promise(r=>{const q=indexedDB.deleteDatabase("firestore/[DEFAULT]/"+FB_CONFIG.projectId+"/main");q.onsuccess=q.onerror=q.onblocked=()=>r();setTimeout(r,1500)});localStorage.removeItem("fsclear")}}catch(_){}
  const a=app.initializeApp(FB_CONFIG);
  /* data cache on the device (per signed-in person): reopening the app reads only what changed instead of everything (Firebase quota);
     if the browser cannot keep it, Firebase falls back to memory by itself */
  let db=null;try{if(fs.initializeFirestore&&fs.persistentLocalCache)db=fs.initializeFirestore(a,{localCache:fs.persistentLocalCache(fs.persistentMultipleTabManager?{tabManager:fs.persistentMultipleTabManager()}:{})})}catch(_){db=null}
  if(!db)db=fs.getFirestore(a);
  FB={app:a,AP:app,A:auth,F:auditWrap(fs),auth:auth.getAuth(a),db};
  FB.auth.languageCode=LANG;
  return FB;
}
