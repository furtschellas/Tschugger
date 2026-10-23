// Cast quittieren: the rules of tools/boot/31-costume.js (with the ride steps of 24-rides.js) played through with invented data
// node tests/cast_rules.mjs → JSON lines {n, ok, got, want}
import fs from "fs";import vm from "vm";import path from "path";import {fileURLToPath} from "url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const helpers=`const pad2=n=>String(n).padStart(2,"0");function hm(t){const m=String(t||"").match(/(\\d{1,2}):(\\d{2})/);return m?pad2(+m[1])+":"+m[2]:""}
const fold=t=>String(t||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();const arr=x=>Array.isArray(x)?x:[];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));const L=x=>x;const S={tab:""};const ME=null;const csAfter=()=>{};const todayISO=()=>"2031-03-02";
function rideId(date,r){const s=[date,hm(r.t1),hm(r.t2),String(r.from||"").trim(),String(r.to||"").trim(),String(r.vehicle||"").trim()].join("|").toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "r"+(h>>>0).toString(36)}
let PERMS=[];const canPerm=p=>PERMS.includes(p);globalThis.setP=p=>{PERMS=p};`;
const C={console,document:{addEventListener(){},querySelectorAll:()=>[]},setInterval(){},setTimeout(){},requestAnimationFrame(){},Date};C.window=C;C.RIDEACK={};vm.createContext(C);
vm.runInContext(helpers+fs.readFileSync(path.join(ROOT,"tools/boot/24-rides.js"),"utf8")+"\n"+fs.readFileSync(path.join(ROOT,"tools/boot/31-costume.js"),"utf8")+";globalThis.T={p:cqPickup,c:cqCall,b:cqBase,o:cqOnset,rd:cqRowDone,all:cqAll,cmId,rideId,rideStep}",C);
const T=C.T,D="2031-03-02";
const cs={_date:D,calls:[{name:"Anna Probe"},{name:"Mara Test"}],crewTransport:[],
  transport:[{vehicle:"Van",passengers:"Max Muster",from:"Hotel",t1:"06:40",to:"Base",t2:"06:55"},{vehicle:"Van",passengers:"Max Muster",from:"Base",t1:"07:50",to:"Set",t2:"07:58"}]};
const R1={no:"1",actor:"Max Muster",pickup:"06:40",call:"07:00",wardrobe:"Anna 07:05 - 07:20 15’",makeup:"Mara 07:20 - 07:45 25’",base:"07:45",onset:"08:00"};
const R2={no:"2",actor:"Eva Probe",pickup:"07:10",call:"07:30",wardrobe:"Anna 07:35 - 07:50 15’",makeup:"",base:"08:10",onset:"08:30"};
const id=(r,k,t)=>T.cmId(D,k,r,t),pr=T.rideId(D,cs.transport[0]),sr=T.rideId(D,cs.transport[1]);
/* ride steps as stored: 1 on site, 2 on the way (+ v-document), 3 done */
const ride=(rid,n)=>n===3?{[rid]:2}:n===2?{[rid]:1,["v"+rid]:1}:n===1?{[rid]:1}:{};
const st=h=>h&&h.h?(/cqf/.test(h.h)?"frame":"cq"+(h.h.match(/\bcq([012])\b/)||[])[1]+(/<button/.test(h.h)?"+tap":"")+(/cqcar/.test(h.h)?"+car":"")):"plain";
const row=r=>["p","c","b","o"].map(f=>st(T[f](cs,r))).join(" ")+(T.rd(cs,r)?" rowdone":"")+(T.all(cs,r)?" pink":"");
const out=[];const set=(perms,ack)=>{C.RIDEACK=Object.fromEntries(Object.entries(ack).map(([k,s])=>[k,{s,at:1}]));vm.runInContext("setP("+JSON.stringify(perms)+")",C)};
const t=(n,perms,ack,r,want)=>{set(perms,ack);const got=row(r);out.push({n,ok:got===want,got,want})};
/* what a tap writes: own state and the ride step in parallel */
const tap=(n,perms,ack,r,f,want)=>{set(perms,ack);const h=(T[f](cs,r)||{}).h||"";const g=k=>(h.match(new RegExp('data-'+k+'="([^"]*)"'))||[])[1];
  const got=["nx="+g("cqnx"),"ride="+(g("cqlk")===pr?"pickup":g("cqlk")===sr?"base-set":"-"),"step="+(g("cqls")??"-")].join(" ");out.push({n,ok:got===want,got,want})};
const W=["wardrobe.ack","makeup.ack"],D2=["rides.confirm"];
t("nichts quittiert: P/UP offen, Call antippbar, Base und On set noch ohne Stand",W,{},R1,"cq0 cq0+tap plain plain");
t("Fahrer vor Ort (Fahrt Schritt 1) → P/UP pinke Box",W,ride(pr,1),R1,"cq1 cq0+tap plain plain");
t("Fahrzeug unterwegs (Schritt 2) → P/UP pinke Box mit Auto",W,ride(pr,2),R1,"cq1+car cq0+tap plain plain");
t("Fahrt abgeschlossen (Schritt 3) → P/UP abgeschlossen, Call aktiv",W,ride(pr,3),R1,"cq2 cq1+tap plain plain");
tap("Fahrer: P/UP antippen = Fahrer vor Ort (Fahrt Schritt 1)",D2,{},R1,"p","nx=1 ride=pickup step=1");
tap("Fahrer: P/UP nochmals = Fahrzeug fährt (Fahrt Schritt 2)",D2,ride(pr,1),R1,"p","nx=2 ride=pickup step=2");
tap("Call antippen = angekommen (aktiv), Fahrt abgeschlossen",W,ride(pr,2),R1,"c","nx=1 ride=pickup step=3");
t("Call angetippt → Call aktiv, P/UP abgeschlossen, Auto weg",W,Object.assign(ride(pr,2),{[id(R1,"c","07:00")]:1}),R1,"cq2 cq1+tap plain plain");
t("Call aktiv, dann Kostüm angenommen → Call abgeschlossen",W,{[id(R1,"c","07:00")]:1,[id(R1,"w","07:05")]:1},R1,"cq2 cq2 plain plain");
t("Kostüm läuft → P/UP und Call abgeschlossen",W,{[id(R1,"w","07:05")]:1},R1,"cq2 cq2 plain plain");
t("Maske läuft → P/UP und Call abgeschlossen",W,{[id(R1,"m","07:20")]:1},R1,"cq2 cq2 plain plain");
t("Kostüm und Maske fertig → Base läuft, On set offen",W,{[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2},R1,"cq2 cq2 cq1+tap cq0+tap");
tap("Base antippen = erledigt, Fahrt Base → Set unterwegs",W,{[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2},R1,"b","nx=2 ride=base-set step=2");
t("Base quittiert → alle vorherigen abgeschlossen, Auto hinter Base, On set offen",W,Object.assign({[id(R1,"b","07:45")]:2},ride(sr,2)),R1,"cq2 cq2 cq2+tap+car cq0+tap rowdone");
tap("On set antippen = erledigt, Fahrt Base → Set abgeschlossen",W,Object.assign({[id(R1,"b","07:45")]:2},ride(sr,2)),R1,"o","nx=2 ride=base-set step=3");
t("On set erledigt → alles abgeschlossen, Auto weg, Cast-Nummer pink",W,Object.assign({[id(R1,"b","07:45")]:2,[id(R1,"o","08:00")]:2},ride(sr,3)),R1,"cq2 cq2 cq2 cq2+tap rowdone pink");
t("Fahrt Base → Set in «Fahrten» abgeschlossen → On set erledigt",W,ride(sr,3),R1,"cq2 cq2 cq2 cq2+tap rowdone pink");
t("Fahrt Base → Set angenommen, Kostüm/Maske offen → pinker Rahmen bei On set",W,ride(sr,1),R1,"cq0 cq0+tap plain frame");
t("ohne Fahrt: P/UP offen, Call antippbar",W,{},R2,"cq0 cq0+tap plain plain");
t("ohne Fahrt: Call angetippt → P/UP abgeschlossen",W,{[id(R2,"c","07:30")]:1},R2,"cq2 cq1+tap plain plain");
t("Cast manuell: jede Zeit antippbar",["cast.manual"],{},R1,"cq0+tap cq0+tap cq0+tap cq0+tap");
t("ohne Recht zum Quittieren: Stand sichtbar, nichts antippbar",[],{[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2},R1,"cq2 cq2 cq1 cq0");
t("ohne Recht: Base quittiert sichtbar",[],{[id(R1,"b","07:45")]:2},R1,"cq2 cq2 cq2+car cq0 rowdone");
{const dt=(ack,cnt)=>{set(W,ack);const h=(T.p(cs,R1)||{}).h||"";return (h.match(/class="mkd( cqcd)?"[^>]*>([^<]*)</)||[])[0]?((/cqcd/.test(h)?"countdown ":"plan ")+(h.match(/>(\d+)′</)||[])[1]):"none"};
  const now=Date.now();const a=(n,got,want)=>out.push({n,ok:got===want,got,want});
  set(W,{});C.RIDEACK={[pr]:{s:1,at:now-7*60000}};a("Fahrer vor Ort seit 7 Min. → Wartezeit zählt hoch",(()=>{const h=(T.p(cs,R1)||{}).h||"";return /data-cqup/.test(h)?"up "+(h.match(/>(\d+)′</)||[])[1]:"none"})(),"up 7");
  C.RIDEACK={[id(R1,"w","07:05")]:{s:2,at:now-9*60000},[id(R1,"m","07:20")]:{s:2,at:now-4*60000}};a("Base aktiv seit 4 Min. → Wartezeit zählt hoch",(()=>{const h=(T.b(cs,R1)||{}).h||"";return /data-cqup/.test(h)?"up "+(h.match(/>(\d+)′</)||[])[1]:"none"})(),"up 4");
  set(W,{});C.RIDEACK={[pr]:{s:1,at:now},["v"+pr]:{s:1,at:now-5*60000}};a("Fahrzeug unterwegs seit 5 Min. → Countdown 10",(()=>{const h=(T.p(cs,R1)||{}).h||"";return /cqcd/.test(h)?"countdown "+(h.match(/>(\d+)′</)||[])[1]:"none"})(),"countdown 10");
  a("Fahrt abgeschlossen → kein Countdown",dt(ride(pr,3)),"none")}
for(const x of out)console.log(JSON.stringify(x));
