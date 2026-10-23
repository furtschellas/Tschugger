// Ablauf (Fahrten und Cast): the rules of tools/boot/24-flow.js played through with invented data
// node tests/cast_rules.mjs → JSON lines {n, ok, got, want}
import fs from "fs";import vm from "vm";import path from "path";import {fileURLToPath} from "url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const helpers=`const pad2=n=>String(n).padStart(2,"0");function hm(t){const m=String(t||"").match(/(\\d{1,2}):(\\d{2})/);return m?pad2(+m[1])+":"+m[2]:""}
const fold=t=>String(t||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();const arr=x=>Array.isArray(x)?x:[];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));const L=x=>x;const S={tab:""};const ME=null;const csAfter=()=>{};const todayISO=()=>"2031-03-02";
function rideId(date,r){const s=[date,hm(r.t1),hm(r.t2),String(r.from||"").trim(),String(r.to||"").trim(),String(r.vehicle||"").trim()].join("|").toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return "r"+(h>>>0).toString(36)}
let PERMS=[];const canPerm=p=>PERMS.includes(p);globalThis.setP=p=>{PERMS=p};`;
const H=[];const C={console,document:{addEventListener(t,f){if(t==="click")H.push(f)},querySelectorAll:()=>[]},scrollTo(){},scrollY:0,render(){},showMsg(){},MEMO:{clear(){}},setInterval(){},setTimeout(){},requestAnimationFrame(){},Date};C.window=C;C.RIDEACK={};vm.createContext(C);
vm.runInContext(helpers+fs.readFileSync(path.join(ROOT,"tools/boot/24-flow.js"),"utf8")+";globalThis.T={look:cqLook,stage:cqStage,cmb:cmBtn,p:cqPickup,c:cqCall,b:cqBase,o:cqOnset,rd:cqRowDone,all:cqAll,cmId,rideId,rideStep,xf:xqField,xa:xqAll}",C);
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
t("Call aktiv, dann Kostüm angenommen → Call abgeschlossen",W,{[id(R1,"c","07:00")]:1,[id(R1,"w","07:05")]:1},R1,"cq2 cq2 cq0+tap plain");
t("Kostüm läuft → P/UP und Call abgeschlossen",W,{[id(R1,"w","07:05")]:1},R1,"cq2 cq2 cq0+tap plain");
t("Maske läuft → P/UP und Call abgeschlossen",W,{[id(R1,"m","07:20")]:1},R1,"cq2 cq2 cq0+tap plain");
t("Kostüm erledigt, Maske noch offen → Call wieder aktiv (Cast wartet)",W,{[id(R1,"w","07:05")]:2},R1,"cq2 cq1 cq0+tap plain");
t("Kostüm und Maske fertig → Base läuft, On set offen",W,{[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2},R1,"cq2 cq2 cq1+tap cq0+tap");
tap("Base antippen = erledigt, Fahrt Base → Set unterwegs",W,{[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2},R1,"b","nx=2 ride=base-set step=2");
t("Base quittiert → alle vorherigen abgeschlossen, Auto hinter Base, On set offen",W,Object.assign({[id(R1,"b","07:45")]:2},ride(sr,2)),R1,"cq2 cq2 cq2+tap+car cq0+tap rowdone");
tap("On set antippen = erledigt, Fahrt Base → Set abgeschlossen",W,Object.assign({[id(R1,"b","07:45")]:2},ride(sr,2)),R1,"o","nx=2 ride=base-set step=3");
t("On set erledigt → alles abgeschlossen, Auto weg, Cast-Nummer pink",W,Object.assign({[id(R1,"b","07:45")]:2,[id(R1,"o","08:00")]:2},ride(sr,3)),R1,"cq2 cq2 cq2 cq2+tap rowdone pink");
t("Fahrt Base → Set in «Fahrten» abgeschlossen → On set erledigt",W,ride(sr,3),R1,"cq2 cq2 cq2 cq2+tap rowdone pink");
t("Fahrt Base → Set angenommen, Kostüm/Maske offen → pinker Rahmen bei On set",W,ride(sr,1),R1,"cq0 cq0+tap plain frame");
t("ohne Fahrt: P/UP offen, Call antippbar",W,{},R2,"cq0 cq0+tap plain plain");
t("ohne Fahrt: Call angetippt → P/UP abgeschlossen",W,{[id(R2,"c","07:30")]:1},R2,"cq2 cq1+tap plain plain");
t("alter Hand-Haken bei Call blockiert nichts mehr (Call zurücksetzbar)",W,{[id(R1,"xc","07:00")]:2},R1,"cq0 cq0+tap plain plain");
t("Cast manuell: jede Zeit antippbar",["cast.manual"],{},R1,"cq0+tap cq0+tap cq0+tap cq0+tap");
t("ohne Recht zum Quittieren: Stand sichtbar, nichts antippbar",[],{[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2},R1,"cq2 cq2 cq1 cq0");
t("ohne Recht: Base quittiert sichtbar",[],{[id(R1,"b","07:45")]:2},R1,"cq2 cq2 cq2+car cq0 rowdone");
{const dt=(ack,cnt)=>{set(W,ack);const h=(T.p(cs,R1)||{}).h||"";return (h.match(/class="mkd( cqcd)?"[^>]*>([^<]*)</)||[])[0]?((/cqcd/.test(h)?"countdown ":"plan ")+(h.match(/>(\d+)′</)||[])[1]):"none"};
  const now=Date.now();const a=(n,got,want)=>out.push({n,ok:got===want,got,want});
  set(W,{});C.RIDEACK={[pr]:{s:1,at:now-7*60000}};a("Fahrer vor Ort seit 7 Min. → Wartezeit zählt hoch",(()=>{const h=(T.p(cs,R1)||{}).h||"";return /data-cqup/.test(h)?"up "+(h.match(/>(\d+)′</)||[])[1]:"none"})(),"up 7");
  C.RIDEACK={[id(R1,"w","07:05")]:{s:2,at:now-9*60000},[id(R1,"m","07:20")]:{s:2,at:now-4*60000}};a("Base aktiv seit 4 Min. → Wartezeit zählt hoch",(()=>{const h=(T.b(cs,R1)||{}).h||"";return /data-cqup/.test(h)?"up "+(h.match(/>(\d+)′</)||[])[1]:"none"})(),"up 4");
  set(W,{});C.RIDEACK={[pr]:{s:1,at:now},["v"+pr]:{s:1,at:now-5*60000}};a("Fahrzeug unterwegs seit 5 Min. → Countdown 10",(()=>{const h=(T.p(cs,R1)||{}).h||"";return /cqcd/.test(h)?"countdown "+(h.match(/>(\d+)′</)||[])[1]:"none"})(),"countdown 10");
  a("Fahrt abgeschlossen → kein Countdown",dt(ride(pr,3)),"none")}
/* a tap: Kostüm starts while Maske still runs → Maske is done */
await (async()=>{const W2=[];C.fb=async()=>({db:0,F:{doc:(db,c,i)=>i,setDoc:async(i,v)=>{W2.push(i+"="+v.s)},deleteDoc:async i=>{W2.push(i+"=0")}}});
  set(W,{[id(R1,"m","07:20")]:1});const wid=id(R1,"w","07:05"),mid=id(R1,"m","07:20");
  const btn={dataset:{cqk:"w",cqid:wid,cqd:D},disabled:false,closest:q=>q.includes("[data-cqk]")?btn:q==="tr,.cs-card"?{querySelectorAll:()=>[{dataset:{cqwm:mid}}]}:null};
  for(const f of H)await f({target:{closest:q=>q.includes("[data-cqk]")?btn:null},preventDefault(){},stopPropagation(){}});await new Promise(r=>setTimeout(r,20));
  const got=W2.sort().join(" "),want=[mid+"=2",wid+"=1"].sort().join(" ");out.push({n:"Kostüm angetippt, Maske läuft noch → Maske abgeschlossen",ok:got===want,got,want})})();
/* Meine Termine: Kostüm / Maske in three steps; starting one finishes the other one still running */
await (async()=>{const W2=[];C.fb=async()=>({db:0,F:{doc:(db,c,i)=>i,setDoc:async(i,v)=>{W2.push(i+"="+v.s)},deleteDoc:async i=>{W2.push(i+"=0")}}});
  const wid=id(R1,"w","07:05"),mid=id(R1,"m","07:20");set(W,{[mid]:1});
  const cls=x=>(x.match(/class="([^"]*)"/)||[])[1];out.push({n:"Meine Termine: Maske läuft = pink",ok:cls(T.cmb(mid,D,"x","m",[wid,mid]))==="cmk cmrun",got:cls(T.cmb(mid,D,"x","m",[wid,mid])),want:"cmk cmrun"});
  const h=T.cmb(wid,D,"x","w",[wid,mid]);const ds={};for(const x of h.matchAll(/data-([a-z]+)="([^"]*)"/g))ds[x[1]]=x[2];
  const btn={dataset:ds,disabled:false,closest:()=>null};for(const f of H)await f({target:{closest:q=>q.includes("[data-cmack]")?btn:null},preventDefault(){},stopPropagation(){}});await new Promise(r=>setTimeout(r,20));
  const got=W2.sort().join(" "),want=[mid+"=2",wid+"=1"].sort().join(" ");out.push({n:"Meine Termine: Kostüm starten schliesst die laufende Maske ab",ok:got===want,got,want})})();
{const at=Date.UTC(2031,2,2,8,7);C.RIDEACK={[id(R1,"o","08:00")]:{s:2,at}};vm.runInContext('setP(["wardrobe.ack"])',C);const h=(T.o(cs,R1)||{}).h||"";const got=(h.match(/>(\d\d:\d\d)</)||[])[1];
  out.push({n:"On set erledigt zeigt die Zeit der Quittierung",ok:got==="09:07",got,want:"09:07"})}
{const g=ack=>{set(W,ack);return T.stage(cs,R1)};const got=[g({}),g({[id(R1,"c","07:00")]:1}),g({[id(R1,"w","07:05")]:2,[id(R1,"m","07:20")]:2}),g({[id(R1,"o","08:00")]:2})].join(",");
  out.push({n:"Cast-Nummern im Kopf: nicht gerufen 0, gerufen 1, wartet an der Base 2, On set 3",ok:got==="0,1,2,3",got,want:"0,1,2,3"})}
t("Maske läuft → Base antippbar (Cast wartet)",W,{[id(R1,"m","07:20")]:1},R1,"cq2 cq2 cq0+tap plain");
await (async()=>{const W2=[];C.fb=async()=>({db:0,F:{doc:(db,c,i)=>i,setDoc:async(i,v)=>{W2.push(i+"="+v.s)},deleteDoc:async i=>{W2.push(i+"=0")}}});
  const wid=id(R1,"w","07:05"),mid=id(R1,"m","07:20");set(W,{[mid]:1});const h=(T.b(cs,R1)||{}).h||"";const ds={};for(const x of h.matchAll(/data-([a-z]+)="([^"]*)"/g))ds[x[1]]=x[2];
  const btn={dataset:ds,disabled:false,closest:()=>null};for(const f of H)await f({target:{closest:q=>q.includes("[data-cqk]")?btn:null},preventDefault(){},stopPropagation(){}});await new Promise(r=>setTimeout(r,20));
  const got=W2.sort().join(" "),want=[mid+"=2",wid+"=2"].sort().join(" ");out.push({n:"Base angetippt während Maske läuft → Kostüm und Maske abgeschlossen",ok:got===want,got,want});
  t("danach: Base aktiv (wartet auf Abholung)",W,{[wid]:2,[mid]:2},R1,"cq2 cq2 cq1+tap cq0+tap")})();
await (async()=>{const W2=[];C.fb=async()=>({db:0,F:{doc:(db,c,i)=>i,setDoc:async(i,v)=>{W2.push(i+"="+v.s)},deleteDoc:async i=>{W2.push(i+"=0")}}});
  const oid=id(R1,"o","08:00");set(W,{[oid]:2});C.RIDEACK[oid].at=Date.UTC(2031,2,2,8,7);const h=(T.o(cs,R1)||{}).h||"";const ds={};for(const x of h.matchAll(/data-([a-z]+)="([^"]*)"/g))ds[x[1]]=x[2];
  const btn={dataset:ds,disabled:false,closest:()=>null};for(const f of H)await f({target:{closest:q=>q.includes("[data-cqk]")?btn:null},preventDefault(){},stopPropagation(){}});await new Promise(r=>setTimeout(r,20));
  const got=W2.join(" ");out.push({n:"On set erledigt (Quittierzeit angezeigt) lässt sich zurücksetzen",ok:got.includes(oid+"=0"),got,want:oid+"=0 …"})})();
{const R3=Object.assign({},R1,{no:"7",onset:"on set"});t("On set ohne Zeit («on set») ist antippbar",W,{[id(R3,"w","07:05")]:2,[id(R3,"m","07:20")]:2},R3,"cq2 cq2 cq1+tap cq0+tap");
  t("On set ohne Zeit erledigt",W,{[id(R3,"o","set")]:2},R3,"cq2 cq2 cq2 cq2+tap rowdone pink")}
{const g=ack=>{set(W,ack);return T.look(cs,R1)};const got=[g({}),g(ride(pr,1)),g({[id(R1,"c","07:00")]:1}),g({[id(R1,"m","07:20")]:1}),g({[id(R1,"b","07:45")]:2}),g({[id(R1,"o","08:00")]:2})].join(",");
  out.push({n:"Cast in Drehfolge/Drehplan: nichts 0, P/UP 1, Call 2, Maske 2, Base 3, On set 3",ok:got==="0,1,2,2,3,3",got,want:"0,1,2,2,3,3"})}
{const R5={no:"5",actor:"TJ Bhanu",pickup:"10:30",call:"10:55",wardrobe:"13.50 - 14:10 20’",makeup:"11:00 - 12:00 60’",base:"14.10",onset:"14:15"};
  t("Zeiten mit Punkt (13.50, 14.10): Kostüm und Maske fertig → Base aktiv",W,{[id(R5,"w","13.50")]:2,[id(R5,"m","11:00")]:2},R5,"cq2 cq2 cq1+tap cq0+tap")}
/* extras (Komparsen): per group – Call with how many are there, Kostüm / Maske, On set */
{const X={count:"5",part:"Passanten",call:"08:00",wardrobe:"08:10",makeup:"08:20",onset:"09:00"},X1={count:"-",part:"Velofahrer",call:"08:30",wardrobe:"",makeup:"",onset:"09:30"};
  const xid=(r,f,t)=>T.cmId(D,"x"+f,{no:"x|"+r.part+"|"+r.count},t);
  const xs=(perms,ack)=>{C.RIDEACK=ack;vm.runInContext("setP("+JSON.stringify(perms)+")",C)};
  const xr=r=>["c","w","m","o"].map(f=>{const h=(T.xf(f,cs,r)||{}).h||"";return h?"cq"+((h.match(/\bcq([012])\b/)||[])[1]||"?")+(/<button/.test(h)?"+tap":"")+((h.match(/(\d+\/\d+)/)||[])[1]?" "+h.match(/(\d+\/\d+)/)[1]:""):"-"}).join(" ")+(T.xa(cs,r)?" grau":"");
  const xt=(n,perms,ack,r,want)=>{xs(perms,ack);const got=xr(r);out.push({n:"Komparsen: "+n,ok:got===want,got,want})};
  const XA=["extras.ack"],ALL=["extras.ack","wardrobe.ack","makeup.ack"];
  xt("nichts quittiert, ohne Recht: nur Kostüm/Maske antippbar",W,{},X,"cq0 cq0+tap cq0+tap cq0");
  xt("mit «Komparsen quittieren»: Call und On set antippbar",XA,{},X,"cq0+tap cq0 cq0 cq0+tap");
  xt("3 von 5 da: Call pink mit 3/5",ALL,{[xid(X,"c","08:00")]:{s:1,n:3,at:1}},X,"cq1+tap 3/5 cq0+tap cq0+tap cq0+tap");
  xt("alle da: Call erledigt",ALL,{[xid(X,"c","08:00")]:{s:2,at:1}},X,"cq2+tap cq0+tap cq0+tap cq0+tap");
  xt("On set: ganze Gruppe grau",ALL,{[xid(X,"c","08:00")]:{s:2,at:1},[xid(X,"o","09:00")]:{s:2,at:Date.UTC(2031,2,2,8,4)}},X,"cq2+tap cq0+tap cq0+tap cq2+tap grau");
  xs(XA,{});const h=(T.xf("c",cs,X1)||{}).h||"",h5=(T.xf("c",cs,X)||{}).h||"",ho=(T.xf("o",cs,X)||{}).h||"";
  out.push({n:"Komparsen: ohne Anzahl ist Call ein einfacher Haken, mit Anzahl die Auswahl bis 5",ok:/data-xqn="0"/.test(h)&&/data-xqn="5"/.test(h5),got:(h.match(/data-xqn="\d+"/)||[""])[0]+" "+(h5.match(/data-xqn="\d+"/)||[""])[0],want:'data-xqn="0" data-xqn="5"'});
  out.push({n:"Komparsen: On set antippen = erledigt (eigene ID, nicht die vom Cast)",ok:/data-cqk="xo"/.test(ho)&&/data-cqnx="2"/.test(ho)&&ho.includes(xid(X,"o","09:00")),got:(ho.match(/data-cq[a-z]+="[^"]*"/g)||[]).join(" "),want:'data-cqk="xo" … data-cqnx="2"'});
  xs(ALL,{[xid(X,"o","09:00")]:{s:2,at:Date.UTC(2031,2,2,8,4)}});const hc=(T.xf("o",cs,X)||{}).h||"";
  out.push({n:"Komparsen: On set zeigt die Zeit der Quittierung",ok:/>09:04</.test(hc),got:(hc.match(/>([^<]*)</)||[])[1],want:"09:04"})}
for(const x of out)console.log(JSON.stringify(x));
