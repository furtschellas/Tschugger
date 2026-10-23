// Cast quittieren: the rules of tools/boot/31-costume.js played through with invented data (node tests/cast_rules.mjs → JSON lines {n, ok, got})
import fs from "fs";import vm from "vm";import path from "path";import {fileURLToPath} from "url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const helpers=`const pad2=n=>String(n).padStart(2,"0");function hm(t){const m=String(t||"").match(/(\\d{1,2}):(\\d{2})/);return m?pad2(+m[1])+":"+m[2]:""}
const fold=t=>String(t||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();const arr=x=>Array.isArray(x)?x:[];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));const L=x=>x;
function rideId(date,r){const s=[date,hm(r.t1),hm(r.t2),String(r.from||"").trim(),String(r.to||"").trim(),String(r.vehicle||"").trim()].join("|").toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "r"+(h>>>0).toString(36)}
window.rideState=id=>{const x=window.RIDEACK[id];return x?(x.s===1?1:2):0};let PERMS=[];const canPerm=p=>PERMS.includes(p);globalThis.setP=p=>{PERMS=p};`;
const C={console,document:{addEventListener(){},querySelectorAll:()=>[]},setInterval(){},requestAnimationFrame(){},Date};C.window=C;C.RIDEACK={};vm.createContext(C);
vm.runInContext(helpers+fs.readFileSync(path.join(ROOT,"tools/boot/31-costume.js"),"utf8")+";globalThis.T={p:cqPickup,c:cqCall,b:cqBase,o:cqOnset,rd:cqRowDone,cmId,rideId}",C);
const T=C.T,D="2031-03-02";
const cs={_date:D,calls:[{name:"Anna Probe"},{name:"Mara Test"}],crewTransport:[],
  transport:[{vehicle:"Van",passengers:"Max Muster",from:"Hotel",t1:"06:40",to:"Base",t2:"06:55"},{vehicle:"Van",passengers:"Max Muster",from:"Base",t1:"07:50",to:"Set",t2:"07:58"}]};
const R1={no:"1",actor:"Max Muster",pickup:"06:40",call:"07:00",wardrobe:"Anna 07:05 - 07:20 15’",makeup:"Mara 07:20 - 07:45 25’",base:"07:45",onset:"08:00"};
const R2={no:"2",actor:"Eva Probe",pickup:"07:10",call:"07:30",wardrobe:"Anna 07:35 - 07:50 15’",makeup:"",base:"08:10",onset:"08:30"};
const id=(r,k,t)=>T.cmId(D,k,r,t),pr=T.rideId(D,cs.transport[0]),sr=T.rideId(D,cs.transport[1]);
const st=h=>h&&h.h?(/cqf/.test(h.h)?"frame":"cq"+(h.h.match(/\bcq([012])\b/)||[])[1]+(/<button/.test(h.h)?"+tap":"")):"plain";
const row=r=>["p","c","b","o"].map(f=>st(T[f](cs,r))).join(" ")+(T.rd(cs,r)?" rowdone":"");
const out=[];const t=(n,perms,ack,r,want)=>{C.RIDEACK=Object.fromEntries(Object.entries(ack).map(([k,s])=>[k,{s,at:1}]));vm.runInContext("setP("+JSON.stringify(perms)+")",C);
  const got=row(r);out.push({n,ok:got===want,got,want})};
const W=["wardrobe.ack","makeup.ack"];
t("nichts quittiert: P/UP folgt der Fahrt, Call antippbar, Base und On set noch ohne Stand",W,{},R1,"cq0 cq0+tap plain plain");
t("Kostüm läuft → P/UP und Call abgeschlossen",W,{[id(R1,"w","07:05")]:1},R1,"cq2 cq2 plain plain");
t("Maske läuft → P/UP und Call abgeschlossen",W,{[id(R1,"m","07:20")]:1},R1,"cq2 cq2 plain plain");
t("Kostüm läuft → P/UP und Call abgeschlossen, auch gegen einen Hand-Haken",["cast.manual","wardrobe.ack"],{[id(R1,"w","07:05")]:1,[id(R1,"xp","06:40")]:1},R1,"cq2 cq2 cq0+tap cq0+tap");
t("Kostüm und Maske fertig → Base läuft, On set offen",W,{[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2},R1,"cq2 cq2 cq1+tap cq0+tap");
t("Base quittiert → alle vorherigen abgeschlossen, On set offen",W,{[id(R1,"b","07:45")]:2},R1,"cq2 cq2 cq2+tap cq0+tap rowdone");
t("On set läuft → alle vorherigen abgeschlossen",W,{[id(R1,"o","08:00")]:1},R1,"cq2 cq2 cq2 cq1+tap rowdone");
t("On set erledigt → alle abgeschlossen",W,{[id(R1,"o","08:00")]:2},R1,"cq2 cq2 cq2 cq2+tap rowdone");
t("Fahrt Base → Set angenommen → pinker Rahmen bei On set",W,{[sr]:1},R1,"cq0 cq0+tap plain frame")
t("mit Fahrt: Call angetippt → P/UP abgeschlossen",W,{[id(R1,"c","07:00")]:2},R1,"cq2 cq2+tap plain plain");
t("Fahrt Base → Set ausgeführt → On set läuft, alle vorherigen abgeschlossen",W,{[sr]:2},R1,"cq2 cq2 cq2 cq1+tap rowdone");
t("Fahrt Pickup ausgeführt → P/UP und Call abgeschlossen",W,{[pr]:2},R1,"cq2 cq2 plain plain");
t("ohne Fahrt: Call von Hand angetippt → P/UP abgeschlossen",W,{[id(R2,"c","07:30")]:2},R2,"cq2 cq2+tap plain plain");
t("ohne Fahrt: Call offen und antippbar",W,{},R2,"plain cq0+tap plain plain");
t("Cast manuell: Base von Hand erledigt → alle vorherigen abgeschlossen",["cast.manual"],{[id(R1,"xb","07:45")]:2},R1,"cq2 cq2 cq2+tap cq0+tap rowdone");
t("Cast manuell: Call von Hand erledigt (mit Fahrt) → P/UP abgeschlossen",["cast.manual"],{[id(R1,"xc","07:00")]:2},R1,"cq2 cq2+tap cq0+tap cq0+tap");
t("Cast manuell: jede Zeit antippbar",["cast.manual"],{},R1,"cq0+tap cq0+tap cq0+tap cq0+tap");
t("nur sehen (cast.see): Stand ohne Antippen",["cast.see"],{[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2},R1,"cq2 cq2 cq1 cq0");
t("ohne Recht: nur die Zeiten, kein Stand",[],{[id(R1,"b","07:45")]:2},R1,"plain plain plain plain rowdone");
{C.RIDEACK={};vm.runInContext('setP(["cast.manual"])',C);const h=f=>(T[f](cs,R1)||{}).h||"";const got=["p","c","b","o"].map(f=>/data-cq2/.test(h(f))?"1x":"3x").join(" ");
  out.push({n:"Cast manuell: P/UP und Call mit einem Tippen erledigt, Base und On set in Schritten",ok:got==="1x 1x 3x 3x",got,want:"1x 1x 3x 3x"})}
for(const x of out)console.log(JSON.stringify(x));
