/* ---------- search modes («Direktlinks»): Alle · Rolle · Szene · Drehtag · Person · Motiv · Text, in the global and the script search ---------- */
const SMODES=[["all","Alle"],["role","Rolle"],["sc","Szene"],["day","Drehtag"],["person","Person"],["loc","Motiv"],["text","Text"]];
const SMODE_OK=k=>SMODES.some(x=>x[0]===k);
/* auf dem Handy kürzer: Szene = SZ, Drehtag = Tag, Motiv = Loc */
const SMODE_SH={de:{sc:"SZ",day:"Tag",loc:"Loc"},en:{sc:"Sc",day:"Day",loc:"Loc"},fr:{sc:"Sc",day:"Jour",loc:"Loc"},it:{sc:"Sc",day:"Gior.",loc:"Loc"}};
try{S.gm=localStorage.getItem("gm")||"all";S.sqm=localStorage.getItem("sqm")||"all"}catch(_){S.gm=S.sqm="all"}
if(!SMODE_OK(S.gm))S.gm="all";if(!SMODE_OK(S.sqm))S.sqm="all";
const modeChips=(cur,attr)=>'<div class="smodes" role="group" aria-label="'+esc(L("Suchen nach"))+'">'+SMODES.map(([k,t])=>{const sh=(SMODE_SH[LANG]||SMODE_SH.en)[k];return '<button type="button" '+attr+'="'+k+'" aria-pressed="'+(cur===k)+'"'+(sh?' aria-label="'+esc(L(t))+'"':'')+'>'+(sh?'<span class="sm-l">'+esc(L(t))+'</span><span class="sm-s">'+esc(sh)+'</span>':esc(L(t)))+'</button>'}).join("")+'</div>';
const SHINT={all:"Suche nach Szenennummer (z. B. 186), Drehtag (D5, Day 5, 26.10., Montag, heute, morgen), Motiv, Adresse, Rolle (z. B. Regina), Crew-Name, Funktion oder Telefonnummer.",
  role:"Rolle eingeben, z. B. Regina oder 8. Leer lassen für die Liste aller Rollen.",sc:"Szenennummer eingeben, z. B. 186 oder 4A.",day:"Drehtag eingeben: D5, 26.10., Montag, heute oder morgen.",
  person:"Name, Funktion oder Telefonnummer eingeben.",loc:"Motiv oder Adresse eingeben, z. B. Kapelle oder Salgesch.",text:"Wörter aus Szenenbeschrieb, Notizen oder Infos eingeben."};
const escRe=t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
/* query normalising shared by both searches: today/tomorrow, D5/Day 5/#5, dates as d.m. */
function normQ(q){
  let qq=nrm(q).replace(/[,;]/g," ").trim();
  const iso=d=>d.getDate()+"."+(d.getMonth()+1)+".";
  const now=new Date(),tmr=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  qq=qq.replace(/\b(heute|today|aujourd'?hui|oggi)\b/g,iso(now)).replace(/\b(morgen|tomorrow|demain|domani)\b/g,iso(tmr));
  qq=qq.replace(/\b(drehtag|day|tag|dt|jour|giorno|j)\s*#?\s*(\d{1,2})\b/g,"d$2").replace(/#(\d{1,2})\b/g,"d$1");
  qq=qq.replace(/\b(\d{1,2})[./](\d{1,2})\.?(?:\d{2,4})?\b/g,(m,a,b)=>(+a)+"."+(+b)+".");
  return qq;
}
const WDALL=[["sonntag","sunday","dimanche","domenica"],["montag","monday","lundi","lunedi"],["dienstag","tuesday","mardi","martedi"],["mittwoch","wednesday","mercredi","mercoledi"],["donnerstag","thursday","jeudi","giovedi"],["freitag","friday","vendredi","venerdi"],["samstag","saturday","samedi","sabato"]];
function dayKeys(d){const x=new Date(d.date+"T12:00:00");return nrm([d.short,d.label,x.getDate()+"."+(x.getMonth()+1)+".",ddmm(x),WDALL[x.getDay()].join(" "),WD[x.getDay()]].join(" "))}
/* roles (characters of the cast list) with the names they go by in the script */
const GENW=new Set(["mafioso","teenager","aunt","tante","dr","neighbour","nachbar","fisherman","fischer","karate","the","der","die"]);
function roleList(){return memo("roles",()=>{const c=(S.meta&&S.meta.cast)||{};
  return Object.keys(c).sort((a,b)=>(parseInt(a,10)||0)-(parseInt(b,10)||0)).map(id=>{const name=String(c[id]||"");const al=new Set();
    for(const part of fold(name).split("/").map(x=>x.trim()).filter(Boolean)){al.add(part.replace(/\./g,""));const w=part.replace(/\./g,"").split(/\s+/).filter(Boolean);if(w.length>1){const last=w[w.length-1];if(last.length>=3&&!GENW.has(last))al.add(last)}}
    return {id:String(id),name,al:[...al].filter(x=>x.length>=2)}})})}
function rolesFor(terms){return roleList().filter(r=>terms.every(t=>r.id===t||fold(r.name).includes(t)||r.al.some(a=>a.includes(t))))}
function planRoles(sc){const s=new Set();for(const h of (schedIndex()[norm(sc)]||[]))for(const c of arr(h.it.cast))s.add(String(c));return s}
/* who appears in each script scene: sp = the role speaks (dialogue heading in capitals), mt = the role is only mentioned in the text */
const SPK=/^[ \t]*([A-ZÄÖÜÉÈÀ][A-ZÄÖÜÉÈÀ0-9 .'’\-\/]{1,40}?)(?:\s*\([^)]*\))?[ \t]*$/gm;
function scriptRoles(){return memo("scroles:"+(SCRIPT?SCRIPT.length:0),()=>{const R=roleList().map(r=>({id:r.id,al:r.al,re:r.al.map(a=>new RegExp("(^|[^a-z0-9])"+escRe(a)+"($|[^a-z0-9])"))}));const out={};
  for(const x of (SCRIPT||[])){const k=norm(x.sc),o=out[k]||{sp:new Set(),mt:new Set()};const txt=String(x.text||"");
    const spk=[...txt.matchAll(SPK)].map(m=>fold(m[1]).replace(/\./g,"").trim()).filter(n=>n&&!/^(continued|cont|int|ext|i\/e|cut to|fade)/.test(n));
    const t=fold((x.head||"")+"\n"+txt);
    for(const r of R){if(spk.some(n=>r.al.some(a=>n===a||(" "+n+" ").includes(" "+a+" "))))o.sp.add(r.id);else if(r.re.some(re=>re.test(t)))o.mt.add(r.id)}
    out[k]=o}return out})}
const inScript=(o,id)=>!!o&&(o.sp.has(id)||o.mt.has(id));
/* actors (callsheets) → role ids */
function actorRoles(terms){const ids=new Set();const R=roleList();
  for(const dp of S.dispos)for(const c of arr(dp&&dp.cast)){const a=fold(c.actor||"");if(!a||!terms.every(t=>a.includes(t)))continue;
    const no=String(c.no||"").replace(/\D/g,"");if(no&&R.some(r=>r.id===no))ids.add(no);else{const hit=R.find(r=>fold(r.name)===fold(c.role||""));if(hit)ids.add(hit.id)}}
  return [...ids]}
/* role overview: scenes per role in the schedule and in the script, and where they disagree */
function roleOverview(withScript,attr){
  const sched=schedIndex(),sr=withScript&&SCRIPT?scriptRoles():null,R=roleList();if(!R.length)return '<p class="shint">'+esc(L("Keine Rollen in der Besetzungsliste."))+'</p>';
  const plan={};for(const k in sched)for(const h of sched[k])for(const c of arr(h.it.cast)){(plan[c]=plan[c]||new Set()).add(k)}
  return '<div class="rolegrid">'+R.map(r=>{const P=plan[r.id]||new Set();let B=0,diff=0;
    if(sr){for(const k in sr){const o=sr[k],inB=inScript(o,r.id),inP=P.has(k);if(inB)B++;if(sched[k]&&((o.sp.has(r.id)&&!inP)||(inP&&!inB)))diff++}}
    return '<button type="button" class="rolerow" '+attr+'="'+esc(r.name)+'"><span class="rn"><i>'+esc(r.id)+'</i>'+esc(r.name)+'</span><span class="rc">'+esc(L("Drehplan"))+' '+P.size+(sr?' · '+esc(L("Drehbuch"))+' '+B:'')+(diff?' · <b class="rdiff">⚠ '+diff+'</b>':'')+'</span></button>'}).join("")+'</div>'+(sr?'<p class="shint">⚠ = '+esc(L("Geplante Szenen, in denen die Rolle laut Drehbuch spricht, aber nicht im Drehplan steht – oder im Drehplan steht, im Drehbuch aber nicht vorkommt."))+'</p>':'');
}
function roleBadges(sc,ids){const P=planRoles(sc),o=SCRIPT?(scriptRoles()[norm(sc)]||{sp:new Set(),mt:new Set()}):null,planned=(schedIndex()[norm(sc)]||[]).length>0,R=roleList();
  return '<span class="rbadges">'+ids.map(id=>{const r=R.find(x=>x.id===id);if(!r)return"";const inP=P.has(id),sp=o?o.sp.has(id):null,mt=o?o.mt.has(id):null;
    const st=!planned?(sp?L("spricht im Drehbuch"):mt?L("erwähnt im Drehbuch"):""):o===null?(inP?L("im Drehplan"):""):inP&&(sp||mt)?"✓ "+L("Drehplan und Drehbuch"):inP?"⚠ "+L("nur im Drehplan"):sp?"⚠ "+L("spricht im Drehbuch, fehlt im Drehplan"):mt?L("nur erwähnt, nicht im Drehplan"):"";
    return st?'<span class="rbadge'+(/⚠/.test(st)?' warn':'')+'"><b>'+esc(r.name)+'</b> '+esc(st)+'</span>':""}).join("")+'</span>'}
/* ---------- global search ---------- */
const nrm=x=>String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function hl(text,terms){let h=esc(text);for(const t of terms){if(!t)continue;const re=new RegExp("("+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","ig");h=h.replace(re,"<mark>$1</mark>")}return h}
function searchAll(q,mode){
  mode=mode||"all";const M=k=>mode==="all"||mode===k;
  const qq=normQ(q);
  const terms=qq.split(/\s+/).filter(Boolean);if(!terms.length)return null;
  const isNum=t=>/^\d+[a-z]*$/.test(t)&&!/^\d+(st|nd|rd|th)$/.test(t);
  const digits=x=>String(x||"").replace(/\D/g,"");
  const phoneVars=ph=>{const d=digits(ph);if(!d)return "";const loc=d.startsWith("41")?"0"+d.slice(2):d;return d+" "+loc};
  const dshort=d=>{const x=new Date(d.date+"T12:00:00");return x.getDate()+"."+(x.getMonth()+1)+". "+ddmm(x)+" "+WD[x.getDay()]};
  const cast=(S.meta&&S.meta.cast)||{};
  /* text terms: substring anywhere; numeric terms: only scene numbers, day codes, dates, phone numbers */
  const qd=terms.every(t=>/^\+?\d+$/.test(t))?terms.join("").replace(/\D/g,""):"";
  const match=(text,nums,phone)=>{const T=nrm(text),N=nrm(nums);if(phone&&qd.length>=3&&N.replace(/\s+/g," ").split(" ").some(w=>w.includes(qd)))return true;return terms.every(t=>isNum(t)?N.split(/\s+/).some(w=>w.startsWith(t)):(T.includes(t)||N.includes(t)))};
  const R={day:[],sc:[],loc:[],crew:[],dispo:[],info:[]};
  const WDL=[["sonntag","sunday","dimanche","domenica"],["montag","monday","lundi","lunedi"],["dienstag","tuesday","mardi","martedi"],["mittwoch","wednesday","mercredi","mercoledi"],["donnerstag","thursday","jeudi","giovedi"],["freitag","friday","vendredi","venerdi"],["samstag","saturday","samedi","sabato"]];
  /* only areas the person may see (Drehplan, Locations, Crew, Callsheet) */
  const okPlan=vok("plan"),okLoc=true,okCrew=vok("crew"),okDispo=vok("dispo"),okPh=vok("phone"),okEm=vok("email");
  for(const d of (okPlan?S.days:[])){if(!M("day")&&mode!=="text")break;
    const x=new Date(d.date+"T12:00:00");
    const sc1=(d.items||[]).filter(i=>i.sc).length,sc2=((d.unit2&&d.unit2.items)||[]).filter(i=>i.sc).length,sc3=((d.unit3&&d.unit3.items)||[]).filter(i=>i.sc).length;
    const kindw=d.kind==="shoot"?"drehtag shooting day tournage riprese":d.kind==="off"?"drehfrei frei day off off-day libre libero":"reise reisetag travel voyage viaggio";
    const text=[d.label,d.short,kindw,WDL[x.getDay()].join(" "),WD[x.getDay()],dshort(d),(d.notes||[]).join(" "),TXA(d,"notes").join(" "),d.info,TX(d,"info"),dayPlaces(d).join(" "),sc2?"2nd unit":"",sc3?"3rd unit":"",sc1?"1st unit":""].join(" ");
    if(mode==="text"?terms.every(t=>nrm([(d.notes||[]).join(" "),TXA(d,"notes").join(" "),d.info,TX(d,"info")].join(" ")).includes(t)):match(text,nrm(d.short||"")+" "+dshort(d)))R.day.push({k:"day",d,sc1,sc2});
  }
  for(const d of (okPlan?S.days:[]))for(const [u,list] of unitLists(d))for(const it of list){
    if(!it.sc)continue;if(!unitsOn().includes(u))continue;const ad=addrForItem(it);
    const sc=nrm(it.sc).replace(/\s+/g,"");
    const text=[it.set,it.d,it.d_de,it.d_fr,ad,it.loc,(it.cast||[]).map(c=>cast[c]||"").join(" "),d.label,d.short,UNAME[u]+" unit","szene scene"].join(" ");
    const nums=[sc,nrm(it.sc),(it.cast||[]).join(" "),nrm(d.short||""),dshort(d)].join(" ");
    if(mode==="day"||mode==="person")continue;
    if(mode==="all"&&!match(text,nums))continue;
    if(mode==="sc"&&!terms.every(t=>sc.startsWith(t.replace(/\s+/g,""))))continue;
    if(mode==="role"){const ids=rolesFor(terms).map(r=>r.id);if(!ids.length||!arr(it.cast).some(c=>ids.includes(String(c))))continue}
    if(mode==="loc"&&!terms.every(t=>nrm([it.set,it.loc,ad].join(" ")).includes(t)))continue;
    if(mode==="text"&&!terms.every(t=>nrm([it.d,it.d_de,it.d_fr,it.d_it].join(" ")).includes(t)))continue;
    let score=0;for(const t of terms){if(sc===t)score+=100;else if(sc.startsWith(t))score+=40}
    R.sc.push({k:"sc",d,u,it,ad,score});
  }
  R.sc.sort((x,y)=>y.score-x.score||(x.d.date<y.d.date?-1:x.d.date>y.d.date?1:String(x.it.t).localeCompare(String(y.it.t))));
  for(const g of (M("loc")&&okLoc?groupLocs():[])){
    const text=g.s5?[g.title,...g.parts.map(p=>fullAddr(p.it.loc)+" "+p.it.set)].join(" "):[g.title,g.venue,g.address,...g.items.map(l=>[l.name,l.venue,l.address].join(" "))].join(" ");
    const nums=g.s5?g.parts.map(p=>nrm(p.it.sc).replace(/\s+/g,"")).join(" "):g.items.flatMap(l=>(l.sets||[]).flatMap(x=>x.scenes||[])).map(x=>nrm(x).replace(/\s+/g,"")).join(" ");
    if(match(text,nums+" "+nrm(text).replace(/[^0-9a-z ]/g," ")))R.loc.push({k:"loc",g});
  }
  if(M("person")&&okCrew)for(const dep of S.crew)for(const pp of (dep.people||[]))if(match([pp.name,pp.role,pp.role_fr,pp.role_en,dep.dept,dep.dept_fr,dep.dept_en,okEm?pp.email:"",pp.note].join(" "),okPh?phoneVars(pp.phone):"",true))R.crew.push({k:"crew",p:pp,dep});
  if(mode==="all"&&okDispo)for(const x of S.dispos){const vals=JSON.stringify(x).replace(/"[a-zA-Z]+":/g," ");if(match(vals,nrm(x.label||"")+" "+dshort(x)))R.dispo.push({k:"dispo",x})}
  if(mode==="all"||mode==="text")for(const c of S.places)for(const it of (c.items||[]))if(match([it.name,it.address,it.note,TX(it,"note"),c.cat,TX(c,"cat")].join(" "),phoneVars(it.phone),true))R.info.push({k:"info",it,c});
  return {R,terms};
}
let SR=[],LASTQ="";
function renderSearch(){
  const q=$("#gq").value,res=searchAll(q,S.gm),box=$("#gres");SR=[];
  const gm=$("#gmodes");if(gm){gm.innerHTML=modeChips(S.gm,"data-gm");try{fitRows(gm)}catch(_){}}
  if(!res){box.innerHTML=(S.gm==="role"?roleOverview(false,"data-gpick"):'')+'<p class="shint">'+L(SHINT[S.gm]||SHINT.all)+'</p>';return}
  const {R,terms}=res;let h="",n=0;
  const add=(o,t1,t2)=>{SR.push(o);h+='<button class="sr" data-sr="'+(SR.length-1)+'"><span class="t1">'+t1+'</span>'+(t2?'<span class="t2">'+t2+'</span>':'')+'</button>';n++};
  const sec=(title,arr,fn)=>{if(!arr.length)return;h+='<h3 class="dh">'+title+' · '+arr.length+'</h3>';arr.slice(0,40).forEach(fn)};
  sec(L("Drehtage"),R.day,r=>add(r,'<b>'+esc(r.d.label)+'</b> · '+esc(fmtDate(r.d.date)),esc([r.d.hours,dayPlaces(r.d).join(", "),r.d.kind==="shoot"?(r.sc1+r.sc2)+" "+L("Szenen")+(r.sc2?" · 2nd Unit":""):(r.d.kind==="off"?L("Drehfrei"):(TX(r.d,"info")||L("Reisetag")))].filter(Boolean).join(" · "))));
  const rIds=S.gm==="role"?rolesFor(terms).map(r=>r.id):[];const castNm=(S.meta&&S.meta.cast)||{};
  sec(cap(L("Szenen")),R.sc,r=>add(r,'<b>'+hl(r.it.sc,terms)+'</b> · '+hl(r.it.set||"",terms),esc((r.d.short||r.d.label)+' '+fmtDate(r.d.date).slice(0,-5)+' · '+(r.it.t||"")+(r.u==="2"?' · 2nd Unit':''))+(S.gm==="role"?'<br>'+arr(r.it.cast).filter(c=>rIds.includes(String(c))).map(c=>'<mark>'+esc(castNm[c]||c)+'</mark>').join(", "):'')+'<br>'+hl(TX(r.it,"d"),terms)+'<br>'+hl(r.ad||"",terms)));
  sec("Locations",R.loc,r=>add(r,hl(r.g.title,terms),hl(r.g.s5?L("Salgesch, mehrere Adressen"):[r.g.venue,r.g.address].filter(Boolean).join(", "),terms)));
  sec("Crew",R.crew,r=>add(r,hl(r.p.name,terms),hl([TX(r.p,"role"),TX(r.dep,"dept"),vok("phone")?r.p.phone:""].filter(Boolean).join(" · "),terms)));  /* phone only with the right to see it */
  sec("Callsheet",R.dispo,r=>add(r,esc((r.x.label||"Callsheet")+' · '+fmtDate(r.x.date)),'Callsheet'));
  sec("Info",R.info,r=>add(r,hl(r.it.name,terms),hl([TX(r.c,"cat"),r.it.address].filter(Boolean).join(" · "),terms)));
  box.innerHTML=n?h:'<p class="shint">'+L('Nichts gefunden für')+' «'+esc(q)+'».</p>';
}
function openSearch(){$("#search").hidden=false;document.body.style.overflow="hidden";const i=$("#gq");i.focus();i.select();renderSearch()}
function closeSearch(){$("#search").hidden=true;document.body.style.overflow=""}
$("#searchBtn").addEventListener("click",openSearch);
$("#myCalBtn").addEventListener("click",()=>openMyCal());
/* every pop-up: × at the top right, Esc closes the topmost one (the first-start profile form stays until it is filled in) */
const onboarding=()=>{try{return typeof ONBOARD!=="undefined"&&ONBOARD}catch(_){return false}};
function closeDialog(d){if(!d||d.id==="welcome")return;if(d.id==="acct"){if(onboarding())return;d.hidden=true;return}if(d.id==="a2hs"){d.hidden=true;return}d.remove()}
function addX(d){const box=d.querySelector(".a2box");if(!box||d.id==="welcome"||box.querySelector(":scope>.xclose")||(d.id==="acct"&&onboarding()))return;
  const b=document.createElement("button");b.type="button";b.className="xclose";b.setAttribute("aria-label",L("Schliessen"));b.title=L("Schliessen");b.textContent="×";b.addEventListener("click",()=>closeDialog(d));box.prepend(b)}
new MutationObserver(()=>{for(const d of document.querySelectorAll(".a2hs:not([hidden])"))addX(d)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;const ds=[...document.querySelectorAll(".a2hs:not([hidden])")];if(ds.length){e.preventDefault();closeDialog(ds[ds.length-1])}});
$("#sclose").addEventListener("click",closeSearch);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#search").hidden)closeSearch()});
let gqT=null;$("#gq").addEventListener("input",()=>{clearTimeout(gqT);gqT=setTimeout(renderSearch,120)});
$("#gq").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(gqT);renderSearch();const f=document.querySelector("#gres [data-sr]");if(f)f.click()}});
$("#gmodes").addEventListener("click",e=>{const b=e.target.closest("[data-gm]");if(!b)return;S.gm=b.dataset.gm;try{localStorage.setItem("gm",S.gm)}catch(_){}renderSearch();$("#gq").focus()});
$("#gres").addEventListener("click",e=>{const pk=e.target.closest("[data-gpick]");if(pk){$("#gq").value=pk.dataset.gpick;renderSearch();return}
  const b=e.target.closest("[data-sr]");if(!b)return;const r=SR[+b.dataset.sr];if(!r)return;LASTQ=$("#gq").value;closeSearch();
  let scrollSel=null;
  if(r.k==="day"){S.tab="plan";S.day=r.d.id;const qv=nrm(LASTQ);S.pu=(/\b(3rd|3u|third|dritte|3\.)\b|3rd ?unit|unit ?3/.test(qv)&&hasU(r.d,"3"))?{"1":false,"2":false,"3":true}:(/\b(2nd|2u|second|zweite|2\.)\b|2nd ?unit|unit ?2/.test(qv)&&hasU(r.d,"2"))?{"1":false,"2":true,"3":false}:{"1":true,"2":false,"3":false}}
  else if(r.k==="sc"){S.tab="plan";S.day=r.d.id;S.pu={"1":r.u==="1","2":r.u==="2","3":r.u==="3"}}
  else if(r.k==="loc"){S.tab="loc";S.uf={"1":true,"2":true,"3":true};const key="card:"+(r.g.key==="szene-5"?"s5":r.g.key);S.openSc[key]=true;scrollSel='[data-sckey="'+(window.CSS&&CSS.escape?CSS.escape(key):key.replace(/["\\]/g,"\\$&"))+'"]'}
  else if(r.k==="crew"){S.tab="crew";S.q=r.p.name}
  else if(r.k==="dispo"){S.tab="dispo";S.dday=r.x.date}
  else if(r.k==="info"){S.tab="info"}
  window.scrollTo(0,0);render();
  if(r.k==="sc"){const want=norm(r.it.sc);const el=[...document.querySelectorAll(".sc .scn")].find(x=>norm(x.textContent)===want);if(el){el.closest(".sc").scrollIntoView({block:"center"});el.closest(".sc").classList.add("hit");setTimeout(()=>el.closest(".sc").classList.remove("hit"),1800)}}
  if(scrollSel){const el=document.querySelector(scrollSel);if(el)el.scrollIntoView({block:"start"})}
});


