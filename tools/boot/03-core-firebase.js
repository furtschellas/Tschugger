import {L,LANG,S,applyStatic,esc,setLANG} from "../base/10-core.js";
import {render} from "../base/15-script-tab.js";
import {store} from "../base/16-interaction.js";
import {CACHE_KEY,showMsg} from "../base/20-data-start.js";
import {ADMINS,FB_CONFIG,FB_V} from "./01-config.js";
import {LANGS} from "./02-i18n.js";
import {getDataKey} from "./04-data.js";
import {AUTHMODE,showGate} from "./05-membership-signin.js";
import {START} from "./10-menus-welcome-presence.js";
import {auditWrap} from "./17-audit-misc.js";
/* languages offered in the app; the main admin picks them (Firestore config/app.langs), cached for the sign-in screen */
export let APPLANGS=["de","fr","it","en"];window.UNIT3=false;window.BDAYPUB=false;window.DOCS={};try{window.DOCS=JSON.parse(localStorage.getItem("appdocs")||"{}")||{}}catch(_){}window.GOOGLEON=true;try{window.GOOGLEON=localStorage.getItem("appgoogle")!=="0"}catch(_){}window.PUBV={phone:false,email:false,mycal:false};try{const x=JSON.parse(localStorage.getItem("apppubv")||"null");if(x&&typeof x==="object")Object.assign(window.PUBV,x)}catch(_){}window.SCRIPTON=true;window.TABSON=null;window.TABORDER=null;window.AUTOUPD=true;try{try{const o=JSON.parse(localStorage.getItem("apptaborder")||"null");if(Array.isArray(o))window.TABORDER=o}catch(_){}window.AUTOUPD=localStorage.getItem("appauto")!=="0";try{const t=JSON.parse(localStorage.getItem("apptabs")||"null");if(Array.isArray(t)&&t.length)window.TABSON=t}catch(_){}window.SCRIPTON=localStorage.getItem("appscript")!=="0";window.BDAYPUB=localStorage.getItem("appbdaypub")==="1";const u=localStorage.getItem("appunit2");if(u!==null)window.UNIT2=u==="1";window.UNIT3=localStorage.getItem("appunit3")==="1";const mu=localStorage.getItem("appmap");if(mu)window.MAPURL=mu}catch(_){}
try{window.SCACKON=localStorage.getItem("appscack")!=="0";window.RIDEACKON=localStorage.getItem("apprideack")!=="0"}catch(_){window.SCACKON=window.RIDEACKON=true}   /* quittieren on/off, until config/app is loaded */
window.TODAYCFG={};try{const x=JSON.parse(localStorage.getItem("apptodaycfg")||"null");if(x&&typeof x==="object")window.TODAYCFG=x}catch(_){}   /* Today parts offered, until config/app is loaded */
try{const x=JSON.parse(localStorage.getItem("applangs")||"null");if(Array.isArray(x)&&x.length)APPLANGS=x.filter(l=>LANGS.some(z=>z[0]===l))}catch(_){}
export function applyLangs(){
  if(!APPLANGS.length)APPLANGS=["de"];
  document.querySelectorAll(".lang button[data-lang],.lang button[data-glang]").forEach(b=>{b.style.display=APPLANGS.includes(b.dataset.lang||b.dataset.glang)?"":"none"});
  document.querySelectorAll(".lang").forEach(d=>{d.style.display=APPLANGS.length<2?"none":""});
  if(!APPLANGS.includes(LANG)){setLANG(APPLANGS[0]);store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
}
/* one setting of config/app: on window and on this device (for the next start, before config/app is read); drawn again when it changed.
   true/false is stored as "1"/"0", text as it is, lists and objects as JSON, null removes it */
function cfgPut(win,v,key,draw=true){if(JSON.stringify(window[win])===JSON.stringify(v))return false;window[win]=v;
  try{v==null?localStorage.removeItem(key):localStorage.setItem(key,typeof v==="boolean"?(v?"1":"0"):typeof v==="string"?v:JSON.stringify(v))}catch(_){}
  if(draw)render();return true}
/* the roles (without «admin»), by name – read once (Nachricht an alle, eigene Termine) */
let ROLESQ=null;
export function rolesReset(){ROLESQ=null}   /* sign-out: the next person reads the roles again */
export function rolesList(){if(!ROLESQ)ROLESQ=(async()=>{try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"roles"));
  return q.docs.filter(d=>d.id!=="admin").map(d=>({id:d.id,name:String(d.data().name||d.id)})).sort((a,b)=>a.name.localeCompare(b.name,LANG))}catch(_){ROLESQ=null;return []}})();return ROLESQ}
/* the Cloudflare Worker (App-Verwaltung → Hilfe → Assistent): its address + a path, and a POST signed with the sign-in token */
export const wkUrl=p=>String(window.CHATURL||"").replace(/\/+$/,"")+p;
export async function wkPost(path,body){const {auth}=await fb();const tok=await auth.currentUser.getIdToken();
  return fetch(wkUrl(path),{method:"POST",headers:Object.assign({Authorization:"Bearer "+tok},body!==undefined?{"Content-Type":"application/json"}:{}),body:body!==undefined?JSON.stringify(body):undefined})}
export async function loadLangs(){
  try{const {F,db}=await fb();const d=await F.getDoc(F.doc(db,"config","app"));window.APPOK=true;   /* read: only then may the settings form be saved (else defaults would overwrite them) */const l=d.exists()&&d.data().langs;
    if(Array.isArray(l)&&l.length){APPLANGS=l.filter(x=>LANGS.some(z=>z[0]===x));try{localStorage.setItem("applangs",JSON.stringify(APPLANGS))}catch(_){}}
    cfgPut("UNIT2",d.exists()?d.data().unit2!==false:true,"appunit2");
    {const c=d.exists()?d.data():{};cfgPut("PUBV",{phone:c.phonePublic===true,email:c.emailPublic===true,mycal:c.mycalPublic===true},"apppubv")}
    {const go=!(d.exists()&&d.data().googleLogin===false);if(window.GOOGLEON!==go){window.GOOGLEON=go;try{localStorage.setItem("appgoogle",go?"1":"0")}catch(_){}try{const g=document.getElementById("gate");if(g&&!g.hidden&&(AUTHMODE==="login"||AUTHMODE==="register")&&!g.querySelector("input:focus"))showGate(AUTHMODE)}catch(_){}}}
    cfgPut("A2AGAIN",d.exists()&&d.data().a2again===true,"appa2again",false);
    cfgPut("CHGCLR",d.exists()&&+d.data().chgClearAt||0,"appchgclr");   /* «Änderungen» in Today emptied for everybody */
    {const c=d.exists()?d.data():{};const bl=Array.isArray(c.blocks)&&c.blocks.length?c.blocks:null;if(JSON.stringify(bl)!==JSON.stringify(window.BLOCKS)){window.BLOCKS=bl;try{if(window.cdApplyAll)window.cdApplyAll()}catch(_){}try{bl?localStorage.setItem("appblocks",JSON.stringify(bl)):localStorage.removeItem("appblocks")}catch(_){}render()}}
    {const c=d.exists()?d.data():{};cfgPut("PERMNAMES",c.permNames&&typeof c.permNames==="object"?c.permNames:{},"apppermnames")}
    {const c=d.exists()?d.data():{};cfgPut("APPCHECKKEY",typeof c.appCheckKey==="string"?c.appCheckKey:"","appcheck",false)}   /* App Check: used from the next start */
    cfgPut("PUSHEN",!(d.exists()&&d.data().pushEnabled===false),"apppushon");
    {const c=d.exists()?d.data():{};cfgPut("CHATEN",c.chatEnabled!==false,"appchaton",false);cfgPut("TOUREN",c.tourEnabled!==false,"apptouron",false)}
    {let cu=String((d.exists()&&d.data().chatUrl)||"");if(cu&&!/^https:\/\//i.test(cu))cu="";   /* only https – the sign-in token goes there */if(window.CHATURL!==cu){window.CHATURL=cu;try{localStorage.setItem("appchat",cu)}catch(_){}}}
    {const dc=(d.exists()&&d.data().docs)||{};window.DOCS=dc;try{localStorage.setItem("appdocs",JSON.stringify(dc))}catch(_){}}
    cfgPut("BDAYPUB",d.exists()&&d.data().bdayPublic===true,"appbdaypub");
    cfgPut("TABORDER",d.exists()&&Array.isArray(d.data().tabOrder)?d.data().tabOrder:null,"apptaborder");
    cfgPut("TABSON",d.exists()&&Array.isArray(d.data().tabs)&&d.data().tabs.length?d.data().tabs:null,"apptabs");
    window.FAILALARM=d.exists()?d.data().failAlarm!==false:true;
    /* App-Verwaltung → Today: which parts the people are offered ({part: "off"|"no"}) */
    cfgPut("TODAYCFG",d.exists()&&d.data().todayParts&&typeof d.data().todayParts==="object"?d.data().todayParts:{},"apptodaycfg");
    window.OWNEV=d.exists()?d.data().ownEvents!==false:true;
    window.CSMAPON=d.exists()?d.data().csMap!==false:true;
    cfgPut("MYNAV",!(d.exists()&&d.data().myNav===false),"appmynav");
    /* App-Verwaltung → Produktion: name of the project, production company and its address (exports, title of the app) */
    {const g=k=>d.exists()&&typeof d.data()[k]==="string"?d.data()[k]:"";window.PROJNAME=g("projName");window.PRODCO=g("prodCo");window.PRODADDR=g("prodAddr");try{localStorage.setItem("appproj",JSON.stringify([PROJNAME,PRODCO,PRODADDR]))}catch(_){}if(typeof projApply==="function")projApply()}
    /* times of the quittances: Drehplan / Callsheet, each on phones (pm, cm) and computers (pd, cd) */
    {const at=(d.exists()&&d.data().ackTimes)||{};window.ACKT={pm:at.pm!==false,pd:at.pd!==false,cm:at.cm!==false,cd:at.cd!==false};for(const k in ACKT)document.documentElement.classList.toggle("nosct"+k,!ACKT[k])}
    /* scenes and rides quittiert (App-Verwaltung → Einstellungen; on unless switched off) */
    {const c=d.exists()?d.data():{};if(cfgPut("SCACKON",c.sceneAck!==false,"appscack",false)|cfgPut("RIDEACKON",c.rideAck!==false,"apprideack",false))render()}   /* map in the callsheet (App-Verwaltung → Einstellungen) */
    /* automatic quittances per step (App-Verwaltung → Einstellungen → Quittieren): {k: {on, min}} */
    /* the setup before the first scene («a») is on unless switched off, everything else off unless switched on */
    {const n=(a,ks,dflt)=>Object.fromEntries(ks.map(k=>{const x=(a&&a[k])||{};return [k,{on:(dflt||[]).includes(k)?x.on!==false:x.on===true,min:Math.max(0,Math.min(180,parseInt(x.min,10)||0))}]}));const c=d.exists()?d.data():{};
      cfgPut("CASTAUTO",n(c.castAuto,["c","m","w","b","o"]),"appcastauto",false);cfgPut("SCENEAUTO",n(c.sceneAuto,["a","s","l","w"],["a"]),"appsceneauto",false);
      /* the 2nd Unit its own settings – not set yet: as the 1st Unit (as before) */
      cfgPut("CASTAUTO2",n(c.castAuto2||c.castAuto,["c","m","w","b","o"]),"appcastauto2",false);cfgPut("SCENEAUTO2",n(c.sceneAuto2||c.sceneAuto,["a","s","l","w"],["a"]),"appsceneauto2",false);window.SCPAR=c.sceneParallel===true}
    window.GCALON=d.exists()&&!!d.data().gcal;
    window.AIDAYUSD=d.exists()&&+d.data().aiDayUsd>0?+d.data().aiDayUsd:10;
    cfgPut("AUTOUPD",!(d.exists()&&d.data().autoUpdate===false),"appauto",false);
    cfgPut("SCRIPTON",!(d.exists()&&d.data().script===false),"appscript");
    cfgPut("UNIT3",d.exists()&&d.data().unit3===true,"appunit3");
    /* links (motive list, map, chat) are in config/private – only for the crew; the older fields in config/app still count */
    let pv={};try{const {auth}=await fb();if(auth.currentUser){const q=await F.getDoc(F.doc(db,"config","private"));if(q.exists())pv=q.data();window.PRIVOK=true}}catch(_){}
    const cf=k=>typeof pv[k]==="string"&&pv[k]?pv[k]:(d.exists()&&typeof d.data()[k]==="string"?d.data()[k]:"");
    window.LOCSHEET=cf("locSheet");
    /* Google map in the callsheet map: on/off, its colours, hidden layers (config/private) */
    {const g=pv.gmap&&typeof pv.gmap==="object"?pv.gmap:{};window.GMAPSET={on:g.on===true,color:g.color!==false,off:Array.isArray(g.off)?g.off.map(String):[]}}window.SCENESHEET=typeof pv.sceneSheet==="string"?pv.sceneSheet:"";window.SHEETSA=typeof pv.sheetSa==="string"?pv.sheetSa:"";window.SHEETST=pv.sceneSheetSt&&typeof pv.sceneSheetSt==="object"?pv.sceneSheetSt:null;
    {const cu=cf("chatUrl");if(cu&&/^https:\/\//i.test(cu)&&window.CHATURL!==cu){window.CHATURL=cu;try{localStorage.setItem("appchat",cu)}catch(_){}}}
    if((window.MAPURL||"")!==cf("mapUrl"))cfgPut("MAPURL",cf("mapUrl"),"appmap");
  }catch(err){console.warn("langs",err)}
  applyLangs();
}
export const langSel=(name,v)=>'<select name="'+name+'" id="'+name+'">'+LANGS.filter(([k])=>APPLANGS.includes(k)).map(([k,t])=>'<option value="'+k+'"'+(k===v?' selected':'')+'>'+t+'</option>').join("")+'</select>';
export const clean=v=>String(v||"").trim().slice(0,80);
export const DIETS=[["none","Ich esse alles"],["vegetarian","Vegetarisch"],["vegan","Vegan"],["pescatarian","Pescetarisch"],["nopork","Kein Schweinefleisch"],["halal","Halal"],["kosher","Koscher"]];
export const INTOL=[["dairy","Keine Milchprodukte / laktosefrei"],["gluten","Glutenfrei"],["nuts","Ohne Nüsse"],["peanuts","Ohne Erdnüsse"],["shellfish","Ohne Meeresfrüchte"],["eggs","Ohne Eier"]];
/* older profiles stored "nodairy" as diet */
export const normDiet=m=>{const o=Object.assign({},m||{});o.intol=Array.isArray(o.intol)?o.intol.slice():[];if(o.diet==="nodairy"){o.diet="none";if(!o.intol.includes("dairy"))o.intol.push("dairy")}return o};
export const intolBoxes=(pre,sel)=>'<div class="chk">'+INTOL.map(([k,t])=>'<label class="ck"><input type="checkbox" name="'+pre+'" value="'+k+'"'+((sel||[]).includes(k)?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>';
export const readBoxes=(root,pre)=>[...root.querySelectorAll('input[name="'+pre+'"]:checked')].map(x=>x.value);
export const dietSel=(name,v,req)=>'<select name="'+name+'" id="'+name+'"'+(req?' required':'')+'>'+(req&&!v?'<option value="" selected>– '+L("bitte wählen")+' –</option>':'')+DIETS.map(([k,t])=>'<option value="'+k+'"'+(k===(v||(req?"":"none"))?' selected':'')+'>'+L(t)+'</option>').join("")+'</select>';
export const dietText=m0=>{if(!m0)return"";const m=normDiet(m0);const d=DIETS.find(x=>x[0]===m.diet);const a=String(m.allergies||"").trim();
  return [d&&d[0]!=="none"?L(d[1]):"",...m.intol.map(k=>{const t=INTOL.find(x=>x[0]===k);return t?L(t[1]):""}),a?L("Allergien")+": "+a:""].filter(Boolean).join(" · ")};
export const PENDING_KEY="crewprofile:pending";
export const splitName=n=>{const p=String(n||"").trim().split(/\s+/).filter(Boolean);return p.length?{firstName:p[0],lastName:p.slice(1).join(" ")}:{firstName:"",lastName:""}};
export function crewPerson(email){const e=lc(email);if(!e)return null;for(const g of S.crew)for(const p of (g.people||[]))if(lc(p.email)===e)return p;return null}
export let FB=null,ME=null,MEMBER=null,DATAKEY=null,LASTSTAMP=null;
/* stamp of the data this device has stored: if the file online has the same stamp, the 0.8 MB file is neither loaded nor decrypted again */
try{if(localStorage.getItem(CACHE_KEY))LASTSTAMP=localStorage.getItem("dstamp:v1")||null}catch(_){}
export const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
/* JSON encrypted with the crew key (AES-GCM, 12-byte IV + ciphertext, base64): own events, push devices, broadcasts, calendar feed */
export async function ownDec(key,c){const raw=b64(c);return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},key,raw.slice(12))))}
export async function ownEnc(o){const key=await getDataKey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(o))));
  const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);let bin="";for(let i=0;i<all.length;i+=8192)bin+=String.fromCharCode.apply(null,all.subarray(i,i+8192));return btoa(bin)}
export const lc=s=>String(s||"").trim().toLowerCase();
/* main admin is fixed; further admins are listed by the main admin in Firestore admins/{email} */
export let COADMIN=false;
/* SIMROLE: App-Verwaltung → Log → «Berechtigungen testen» looks at the app with the rights of another role for a moment */
export let SIMROLE=null;
/* confirmed like in the rules: e-mail confirmed OR account made by the owner with a start password (starts/{email}) – before, such an account
   got admin rights from the rules but no admin view in the app */
export const meOk=()=>{if(!ME)return false;if(ME.emailVerified)return true;try{return !!START}catch(_){return false}};
export const isOwner=()=>!SIMROLE&&!!(meOk()&&ADMINS.includes(lc(ME.email)));
export const isAdmin=()=>SIMROLE?!!SIMROLE.adm:(isOwner()||!!(COADMIN&&meOk()));
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
export const PERMS=[["view.plan","Drehplan sehen","Drehplan"],["view.prep","Prep sehen","Drehplan"],["coverday.manage","Coverday verwalten","Drehplan"],["view.dispo","Callsheet sehen","Callsheet"],["view.loc","Locations sehen","Callsheet"],["view.csmap","Callsheet-Karte sehen","Callsheet"],["view.info","Infos sehen","Callsheet"],["menus.edit","Lunch-Menüs eingeben","Callsheet"],["view.ra","Gefährdungsbeurteilung sehen","Callsheet"],["view.setfp","Setfloorpläne sehen","Callsheet"],["rides.confirm","Fahrten quittieren","Quittierung"],["rides.alldone","Alle Fahrten als erledigt","Quittierung"],["scenes.ack","Szenen quittieren","Quittierung"],["wardrobe.ack","Kostüm quittieren","Quittierung"],["makeup.ack","Maske quittieren","Quittierung"],["extras.ack","Komparsen quittieren","Quittierung"],["cast.manual","Cast manuell quittieren (alle Zeiten)","Quittierung"],["cast.late","Verspätung des Casts (Push-Nachricht)","Quittierung"],["ack.settings","Quittieren einstellen (Automatik, Anzeige, Zeiten)","Quittierung"],["now.forecast","Prognosen im Jetzt erfassen","Quittierung"],["ack.cast.auto","Cast automatisch quittieren einstellen","Quittierung"],["ack.scene.auto","Szenen automatisch quittieren einstellen (und parallel)","Quittierung"],["day.edit","Drehtag vor Ort ändern (umordnen, streichen, verschieben, Szenen dazu)","Drehplan"],["scenes.log","Szenen","Reports"],["scenes.see","Quittierungen sehen","Quittierung"],["scenes.times","Quittierungszeiten sehen","Quittierung"],["view.script","Drehbuch sehen","Drehbuch"],["view.blocking","Blocking sehen","Drehbuch"],["view.crew","Crewliste sehen","Crewliste"],["view.phone","Telefon sehen","Crewliste"],["view.email","E-Mail sehen","Crewliste"],["contacts.extra","Externe Kontakte sehen","Crewliste"],["crew.food","Essen sehen","Crewliste"],["crew.bday","Geburtstage sehen","Crewliste"],["crew.vcf","VCF exportieren","Crewliste"],["view.mycal","Meine Termine sehen","Termine"],["mycal.all","Alle Termine sehen","Termine"],["push.send","Push-Nachrichten senden","Termine"],["rides.manage","Fahrten Manager","Termine"],["events.add","Eigene Termine erstellen","Termine"],["users.view","Benutzer sehen","Access"],["users.edit","Benutzer ändern","Access"],["users.invite","Benutzer einladen","Access"],["users.requests","Anfragen freischalten","Access"],["roles.view","Rollen sehen","Access"],["roles.assign","Rollen pflegen","Access"],["roles.edit","Rollen bearbeiten","Access"],["settings","Einstellungen ändern","App"],["audit.view","Protokoll sehen","App"],["data.check","Dokumente prüfen","App"]];
/* the name of an option can be changed in App-Verwaltung → Access → «Wer hat welchen Zugriff?» (config/app permNames, same in every language) */
window.PERMNAMES=(()=>{try{return JSON.parse(localStorage.getItem("apppermnames")||"{}")||{}}catch(_){return {}}})();
/* shooting blocks (App-Verwaltung → Drehblöcke): from the last start until config/app is read again */
window.BLOCKS=(()=>{try{const v=JSON.parse(localStorage.getItem("appblocks")||"null");return Array.isArray(v)?v:null}catch(_){return null}})();
export const permLbl=(k,t)=>{const n=window.PERMNAMES&&window.PERMNAMES[k];return n?String(n):L(t)};
/* a permission of the list, or one of the report folders (rep.<folder>, known only once the data is loaded) */
export const permKnown=p=>PERMS.some(x=>x[0]===p)||/^rep\.[a-z0-9-]+$/.test(String(p));window.permKnown=permKnown;
export const VIEWPERMS=PERMS.filter(x=>x[0].startsWith("view.")).map(x=>x[0]);
export const ADMIN_DEFAULT=PERMS.map(x=>x[0]).filter(p=>p!=="settings");
export let MYPERMS=[],MYROLE="",ADMINPERMS=ADMIN_DEFAULT.slice();
export const can=p=>isOwner()||(isAdmin()&&ADMINPERMS.includes(p))||MYPERMS.includes(p);
/* the gear (App-Verwaltung) only with the permission «Einstellungen ändern» */
/* lunch menus: admins/owners and the right «Lunch-Menüs eingeben» (menus.edit) – before: every role with «cater» in its id */
window.canMenu=()=>!!(ME&&can("menus.edit"));   /* like the rules: admins only while «menus.edit» is in the admin rights */
/* roles: «Rollen bearbeiten» = create/change/delete roles (not the admin role), «Rollen pflegen» = give people a role (not admin/owner) */
window.canRoleEdit=()=>isAdmin()||can("roles.edit");window.canRoleAssign=()=>isAdmin()||can("roles.assign");
export const canAdm=()=>isOwner()||["settings","audit.view","users.view","users.invite","users.requests","users.edit","roles.edit","roles.assign","roles.view","data.check","coverday.manage","ack.settings","ack.cast.auto","ack.scene.auto"].some(p=>can(p));   /* scene log and reports: own topic «Reports» (button in the head) */   /* gear = App-Verwaltung: anyone with one of its permissions */
/* what someone sees: without a role everything as before; with a role (or as admin) only the areas the role allows */
window.viewOK=k=>{if(!ME||isOwner())return true;if(!isAdmin()&&!MYROLE){if(["plan","script","blocking"].includes(k))return false;return k in window.PUBV?window.PUBV[k]===true:true}return can("view."+k)};
window.canPerm=can;
/* stability: never wait forever on the network (film sets often have weak reception) */
export const withTimeout=(p,ms,what)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(Object.assign(new Error((what||"request")+" timeout"),{code:"unavailable"})),ms))]);
export let FBP=null;
export async function fb(){
  if(FB)return FB;
  /* the app parts are separate scripts: Firebase starts only when all of them are loaded (it uses functions from later parts) */
  if(!FBP)FBP=(document.readyState==="loading"?new Promise(r=>document.addEventListener("DOMContentLoaded",r,{once:true})):Promise.resolve()).then(fbInit).catch(err=>{FBP=null;throw err});
  return FBP;
}
/* ---------- data layer: writes of ticks, scenes, takings … all the same way. Offline Firebase keeps a write and sends it later – an await
   would hang until then (button stuck, screen not updated). dbWrite answers after at most 6 s: "ok" (saved) or "queued" (kept on this device,
   sent when online); a later refusal runs undo() and says so. A refusal within the 6 s throws as before. ---------- */
export async function dbWrite(op,path,data,o){o=o||{};const {F,db}=await fb();const ref=F.doc(db,...String(path).split("/"));
  const p=op==="delete"?F.deleteDoc(ref):op==="update"?F.updateDoc(ref,data):F.setDoc(ref,data,o.merge?{merge:true}:{});
  let late=false;const r=await Promise.race([p.then(()=>"ok"),new Promise(ok=>setTimeout(()=>ok("queued"),o.wait||6000))]);
  if(r==="queued"){late=true;p.then(()=>{if(o.done)o.done()}).catch(err=>{try{if(o.undo)o.undo()}catch(_){}showMsg(err&&err.code==="simulation"?err.message:L("Nicht gespeichert:")+" "+(err&&(err.code||err.message)||err),6000)});
    if(navigator.onLine===false||late)showMsg(L("Gespeichert auf diesem Gerät – wird gesendet, sobald eine Verbindung da ist."),3500)}
  return r}
window.dbWrite=dbWrite;
async function fbInit(){
  const base="https://www.gstatic.com/firebasejs/"+FB_V+"/";
  const [app,auth,fs]=await withTimeout(Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]),20000,"firebase");
  /* signed out on this device: the local Firebase copy (names, lists) is removed before Firebase opens it again */
  try{if(localStorage.getItem("fsclear")){await new Promise(r=>{const q=indexedDB.deleteDatabase("firestore/[DEFAULT]/"+FB_CONFIG.projectId+"/main");q.onsuccess=q.onerror=q.onblocked=()=>r();setTimeout(r,1500)});localStorage.removeItem("fsclear")}}catch(_){}
  const a=app.initializeApp(FB_CONFIG);
  /* App Check (App-Verwaltung → Einstellungen): Firebase can then accept only requests of this app – before any other Firebase use */
  try{const ak=localStorage.getItem("appcheck")||"";window.APPCHECKKEY=window.APPCHECKKEY||ak;if(/^[\w-]{20,80}$/.test(ak)){const ac=await withTimeout(import(base+"firebase-app-check.js"),8000,"appcheck");ac.initializeAppCheck(a,{provider:new ac.ReCaptchaV3Provider(ak),isTokenAutoRefreshEnabled:true})}}catch(err){console.warn("appcheck",err&&err.message||err)}
  /* data cache on the device (per signed-in person): reopening the app reads only what changed instead of everything (Firebase quota);
     if the browser cannot keep it, Firebase falls back to memory by itself */
  let db=null;try{if(fs.initializeFirestore&&fs.persistentLocalCache)db=fs.initializeFirestore(a,{localCache:fs.persistentLocalCache(fs.persistentMultipleTabManager?{tabManager:fs.persistentMultipleTabManager()}:{})})}catch(_){db=null}
  if(!db)db=fs.getFirestore(a);
  FB={app:a,AP:app,A:auth,F:auditWrap(fs),auth:auth.getAuth(a),db};
  FB.auth.languageCode=LANG;
  return FB;
}
export function setLASTSTAMP(v){return LASTSTAMP=v}   /* other parts change LASTSTAMP only through this */
export function setDATAKEY(v){return DATAKEY=v}   /* other parts change DATAKEY only through this */
export function setCOADMIN(v){return COADMIN=v}   /* other parts change COADMIN only through this */
export function setMEMBER(v){const b0=JSON.stringify(MEMBER&&MEMBER.blk||null);MEMBER=v;if(JSON.stringify(v&&v.blk||null)!==b0)try{if(window.cdApplyAll)window.cdApplyAll()}catch(_){}return v}   /* other blocks for this person: days again */   /* other parts change MEMBER only through this */
export function setMYPERMS(v){return MYPERMS=v}   /* other parts change MYPERMS only through this */
export function setMYROLE(v){return MYROLE=v}   /* other parts change MYROLE only through this */
export function setADMINPERMS(v){return ADMINPERMS=v}   /* other parts change ADMINPERMS only through this */
export function setME(v){return ME=v}   /* other parts change ME only through this */
export function setSIMROLE(v){return SIMROLE=v}   /* other parts change SIMROLE only through this */
