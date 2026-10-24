// Ablauf mit zwei Geräten: two app instances (tools/boot/24-flow.js) on ONE shared, invented Firestore with live updates (onSnapshot).
// A driver phone and a make-up phone tap in parallel; every step both must show the same state.  node tests/flow_multi.mjs → JSON lines {n, ok, got, want}
import fs from "fs";import vm from "vm";import path from "path";import {fileURLToPath} from "url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const SRC=fs.readFileSync(path.join(ROOT,"tools/boot/24-flow.js"),"utf8");
const D="2031-03-02";
/* the shared database: documents of «rideack», listeners get the whole collection after every write (like Firestore) */
const DB={docs:{},subs:new Set(),log:[]};
const fire=()=>{for(const f of DB.subs){const docs=Object.entries(DB.docs).filter(([,v])=>v.d>=f.from).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}));f.cb({docs})}};
const F={doc:(db,c,id)=>id,collection:()=>"rideack",where:(k,op,v)=>({from:v}),query:(c,w)=>w,
  setDoc:async(id,v)=>{DB.docs[id]=JSON.parse(JSON.stringify(v));DB.log.push(id+"="+v.s);await null;fire()},
  deleteDoc:async id=>{delete DB.docs[id];DB.log.push(id+"=0");await null;fire()},
  onSnapshot:(q,cb)=>{const f={from:q.from,cb};DB.subs.add(f);setTimeout(()=>fire(),0);return ()=>DB.subs.delete(f)},
  getDocs:async q=>({forEach:fn=>Object.entries(DB.docs).forEach(([id,v])=>fn({id,data:()=>v}))})};
const cs={_date:D,calls:[{name:"Anna Probe"},{name:"Mara Test"}],crewTransport:[],
  transport:[{vehicle:"Van",passengers:"Max Muster, Eva Probe",from:"Hotel",t1:"06:40",to:"Base",t2:"06:55"},{vehicle:"Van",passengers:"Max Muster",from:"Base",t1:"07:50",to:"Set",t2:"07:58"}]};
const R1={no:"1",actor:"Max Muster",pickup:"06:40",call:"07:00",wardrobe:"Anna 07:05 - 07:20 15’",makeup:"Mara 07:20 - 07:45 25’",base:"07:45",onset:"08:00"};
const R2={no:"2",actor:"Eva Probe",pickup:"06:40",call:"07:00",wardrobe:"Anna 07:25 - 07:40 15’",makeup:"",base:"07:45",onset:"08:00"};
function device(perms){
  const helpers=`const pad2=n=>String(n).padStart(2,"0");function hm(t){const m=String(t||"").match(/(\\d{1,2}):(\\d{2})/);return m?pad2(+m[1])+":"+m[2]:""}
const fold=t=>String(t||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();const arr=x=>Array.isArray(x)?x:[];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));const L=x=>x;
const S={tab:"dispo",dispos:[{date:"${D}",cs:{}}]};const ME={uid:"u"};const csAfter=()=>{};const todayISO=()=>"${D}";
function rideId(date,r){const s=[date,hm(r.t1),hm(r.t2),String(r.from||"").trim(),String(r.to||"").trim(),String(r.vehicle||"").trim()].join("|").toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "r"+(h>>>0).toString(36)}
const PERMS=${JSON.stringify(perms)};const canPerm=p=>PERMS.includes(p);const fb=async()=>({F:globalThis.__F,db:0});
const dbWrite=async(op,path,data)=>{const {F,db}=await fb();const ref=F.doc(db,...path.split("/"));if(op==="delete")await F.deleteDoc(ref);else await F.setDoc(ref,data);return "ok"};`;
  const H=[];const C={console,Date,setTimeout,setInterval(){},requestAnimationFrame(){},scrollTo(){},scrollY:0,render(){},showMsg(){},MEMO:{clear(){}},__F:F,
    document:{addEventListener(t,f){if(t==="click")H.push(f)},querySelectorAll:()=>[]}};C.window=C;C.RIDEACK={};vm.createContext(C);
  vm.runInContext(helpers+SRC+";globalThis.T={p:cqPickup,c:cqCall,b:cqBase,o:cqOnset,w:(c,r)=>{const p=cmParse(r.wardrobe,c)[0];return p?{h:cqLink('w',cmId(c._date,'w',r,p.t),c._date,p.t)}:null},load:rideAckLoad,step:rideStep,cmId,rideId}",C);
  /* tap the time of one field of a cast row like a finger would */
  C.tap=async(f,r)=>{const h=(C.T[f](cs,r)||{}).h||"";const m=h.match(/<button[^>]*>/);if(!m)return false;const ds={};for(const x of m[0].matchAll(/data-([a-z]+)="([^"]*)"/g))ds[x[1]]=x[2];
    const btn={dataset:ds,disabled:false,closest:()=>null,isConnected:false};for(const fn of H)await fn({target:{closest:q=>q.split(",").some(s=>/data-(cqk|cmack)/.test(s))?btn:null},preventDefault(){},stopPropagation(){}});
    await new Promise(r=>setTimeout(r,15));return true};
  C.row=r=>["p","c","b","o"].map(f=>{const h=(C.T[f](cs,r)||{}).h;return h?"cq"+((h.match(/\bcq([012])\b/)||[])[1]||"?")+(/cqcar/.test(h)?"+car":""):"-"}).join(" ");
  return C}
const W=["wardrobe.ack","makeup.ack"],DRV=["rides.confirm"];
const A=device(DRV),B=device(W);await A.T.load(true);await B.T.load(true);await new Promise(r=>setTimeout(r,20));
const out=[];const same=(n,want)=>{const a=A.row(R1)+" | "+A.row(R2),b=B.row(R1)+" | "+B.row(R2);out.push({n:"Zwei Geräte: "+n,ok:a===b&&(!want||a===want),got:a===b?a:"A: "+a+" / B: "+b,want:want||"gleich"})};
same("Start – beide sehen dasselbe","cq0 cq0 - - | cq0 cq0 - -");
await A.tap("p",R1);same("Fahrer tippt P/UP (vor Ort) – Maske-Handy sieht es sofort, auch bei der zweiten Person derselben Fahrt","cq1 cq0 - - | cq1 cq0 - -");
await A.tap("p",R1);same("Fahrer tippt nochmals (unterwegs) – Auto bei beiden","cq1+car cq0 - - | cq1+car cq0 - -");
await B.tap("c",R1);same("Maske-Handy tippt Call – Fahrt für alle abgeschlossen, Call aktiv bei beiden Mitfahrenden","cq2 cq1 - - | cq2 cq1 - -");
/* both phones tap at the same moment: Kostüm of Max (B) and the duplicate of nothing on A – the last write wins on one document only */
await Promise.all([B.tap("w",R1),B.tap("w",R2)]);same("zwei Taps gleichzeitig – Kostüm von beiden läuft, keiner geht verloren");
const ok2=/cq2 cq2/.test(A.row(R1))&&/cq2 cq2/.test(A.row(R2));out.push({n:"Zwei Geräte: Kostüm läuft → P/UP und Call bei beiden abgeschlossen",ok:ok2,got:A.row(R1)+" | "+A.row(R2),want:"cq2 cq2 … | cq2 cq2 …"});
/* a device that loaded before a tap of the other one still ends on the same state */
const C2=device(W);C2.RIDEACK={};await C2.T.load(true);await new Promise(r=>setTimeout(r,20));
out.push({n:"Zwei Geräte: ein drittes Gerät, das später startet, sieht denselben Stand",ok:C2.row(R1)===A.row(R1)&&C2.row(R2)===A.row(R2),got:C2.row(R1)+" | "+C2.row(R2),want:A.row(R1)+" | "+A.row(R2)});
/* more taps on both phones: still the same picture */
await A.tap("p",R1);await B.tap("c",R1);same("weitere Taps auf beiden Handys – beide zeigen weiter dasselbe");
for(const x of out)console.log(JSON.stringify(x));
process.exit(0);
