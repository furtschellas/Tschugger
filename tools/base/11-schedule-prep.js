/* days shown in the schedule strip: 1st = the main calendar (incl. days off / travel), 2nd = days with a 2nd unit */
/* units: "1" = main schedule (d.items), "2" = d.unit2, "3" = d.unit3 (same structure as unit2) */
const UNAME={"1":"1st","2":"2nd","3":"3rd"};
const hasU=(d,u)=>{const x=d["unit"+u];return !!(x&&x.items&&x.items.length)};
const unitLists=d=>[["1",d.items||[]],["2",(d.unit2&&d.unit2.items)||[]],["3",(d.unit3&&d.unit3.items)||[]]];
/* units offered: 2nd unless the main admin switched it off; 3rd when switched on (website) or, in the Claude app, when the schedule has one */
function unitsOn(){const u=["1"];if(window.UNIT2!==false)u.push("2");if(window.UNIT3===true||(window.UNIT3===undefined&&S.days.some(d=>hasU(d,"3"))))u.push("3");return u}
/* only the 2nd (or 3rd) unit chosen: still all shooting days and days off are listed – the unit's days have a pink frame */
const onlyU=()=>!S.pu["1"]&&(S.pu["2"]||S.pu["3"]);
function planDays(){const all=onlyU();return S.days.filter(d=>((S.pu["1"]||all)&&(d.kind!=="shoot"||(d.items||[]).some(i=>i.sc)))||(S.pu["2"]&&hasU(d,"2"))||(S.pu["3"]&&hasU(d,"3")))}
const hasSelU=d=>(S.pu["2"]&&hasU(d,"2"))||(S.pu["3"]&&hasU(d,"3"));
/* a day without the chosen unit is tapped: short note, the 1st unit is switched on again (before the normal day switch) */
document.addEventListener("click",e=>{if(!onlyU())return;const b=e.target.closest("[data-day],[data-dday]");if(!b||b.disabled)return;
  const d=S.days.find(x=>x.id===b.dataset.day||x.date===b.dataset.dday);if(!d||d.kind!=="shoot"||hasSelU(d))return;
  S.pu=Object.assign({},S.pu,{"1":true});store("pu",JSON.stringify(S.pu));
  toast(L("An diesem Tag findet keine 2nd Unit statt – die 1st Unit ist wieder eingeschaltet."))},true);
/* short note in the middle of the screen that disappears by itself */
function toast(t,ms){let o=document.getElementById("toast");if(o)o.remove();o=document.createElement("div");o.id="toast";o.className="toast";o.setAttribute("role","status");o.textContent=t;
  document.body.appendChild(o);requestAnimationFrame(()=>o.classList.add("in"));setTimeout(()=>{o.classList.remove("in");setTimeout(()=>o.remove(),300)},ms||2600)}
/* the next day of the chosen units from today on (only 2nd → next 2nd unit day, else next shooting day of the 1st unit) */
function nextUnitDay(){const t=todayISO(),ok=d=>d.kind==="shoot"&&(onlyU()?hasSelU(d):(d.items||[]).some(i=>i.sc));const l=S.days.filter(ok);return (l.find(d=>d.date>=t)||l[l.length-1]||null)}
function townOf(ad){const p=String(ad).split(",").map(x=>x.trim()).filter(Boolean);const last=p[p.length-1]||"";return last.replace(/^\d{4}\s*/,"").replace(/\s*\(.*\)$/,"")}
function dayPlaces(d){
  const out=[];
  for(const it of unitLists(d).flatMap(x=>x[1])){if(!it.sc||!it.loc)continue;const ad=addrForItem(it);if(/^tba$/i.test(ad))continue;const t=townOf(ad);if(t&&!out.includes(t))out.push(t)}
  return out;
}
/* shared day navigation (Schedule + Callsheet): unit filter fixed on the left, days scroll beside it; OFF days are shown but inactive */
let UNITBAR="";
function dayNav(PD,isSel,attr,key,extra,pre){
  const t=todayISO();
  const sel=PD.find(isSel)||{};
  const ub=u=>{if(u==="1")return '<button data-pu="1" aria-pressed="'+!!S.pu["1"]+'" aria-label="1st Unit">1st</button>';const has=hasU(sel,u);return '<button data-pu="'+u+'" class="u'+u+(has?'':' none')+'" aria-pressed="'+!!S.pu[u]+'" aria-label="'+UNAME[u]+' Unit"'+(has?'':' title="'+esc(L("Keine "+UNAME[u]+" Unit an diesem Tag."))+'"')+'>'+UNAME[u]+'</button>'};
  const uo=unitsOn();
  /* the unit buttons stay at the top with the days (they do not scroll away) */
  const ubar=uo.length>1?'<div class="pub dpub" role="group" aria-label="'+L("Unit filtern")+'">'+uo.map(ub).join("")+'</div>':'';UNITBAR="";
  /* desktop: buttons to scroll the days to the left and right */
  const nav=dir=>'<button type="button" class="stripnav" data-stripnav="'+dir+'" aria-label="'+esc(L(dir<0?"Frühere Tage":"Spätere Tage"))+'" title="'+esc(L(dir<0?"Frühere Tage":"Spätere Tage"))+'"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(dir<0?'M15 5l-7 7 7 7':'M9 5l7 7-7 7')+'"/></svg></button>';
  let h='<div class="stripwrap">'+ubar+nav(-1)+'<div class="strip in" role="tablist" aria-label="'+esc(L("Tage"))+'">'+(pre||"");
  for(const d of PD){
    const dt=new Date(d.date+"T12:00:00");
    const lb=d.kind==="shoot"?(d.short||d.label):(d.kind==="travel"?"TRAVEL":"OFF");
    const lbh=d.kind==="travel"?'<span class="lbl">TRAVEL</span><span class="lbs">TRA</span>':esc(padD(lb));   /* phone: short label */
    const ex=extra?extra(d):{cls:"",mark:""};
    h+='<button data-dt="'+esc(d.date)+'" class="chip'+(onlyU()&&d.kind==="shoot"?(hasSelU(d)?" u2day":" nou"):"")+(d.kind!=="shoot"?" off":"")+(d.kind==="off"?" free":"")+(d.kind==="travel"?" trav":"")+(d.date===t?" isnow":"")+ex.cls+'" role="tab" '+attr+'="'+esc(d[key])+'" aria-selected="'+isSel(d)+'"'+(d.kind==="off"||d.kind==="travel"?' disabled aria-disabled="true"':'')+'>'+
       '<div class="lb">'+lbh+'<span class="wds">/'+WD[dt.getDay()].toUpperCase()+'</span><span class="wdl">'+esc(WDL(dt))+'</span>'+ex.mark+'</div><div class="dd">'+pad2(dt.getDate())+'.'+pad2(dt.getMonth()+1)+'</div></button>';
  }
  return h+'</div>'+nav(1)+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-stripnav]");if(!b)return;const st=b.parentElement&&b.parentElement.querySelector(".strip");if(!st)return;
  st.scrollBy({left:(+b.dataset.stripnav)*Math.max(120,st.clientWidth*.8),behavior:"smooth"})});
/* PREP: preparation / rehearsal week before the first shooting day (data "prepro": one entry per date; meta.prepro: source, contacts) */
function ppWhere(w,m){if(!w)return'';const sm=m?safeUrl(m):"";const q=(sm&&sm!=="#"?sm:"")||(/\d{4}\s+\S/.test(w)?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(w.replace(/^On location:\s*/i,"")):"");return '<div class="ppl">'+(q?'<a href="'+esc(q)+'" target="_blank" rel="noopener">'+esc(w)+'</a>':esc(w))+'</div>'}
function ppItem(i,date,grp,k){return '<div class="ppi'+(i.hl?' hl':'')+'">'+(date&&(i.crew||i.cast)&&vok("email")?'<button type="button" class="calbtn mailbtn" data-ppmail="'+esc(date)+'|'+grp+'|'+k+'" '+ariaTip(L("E-Mail-Verteiler"))+'><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></button>':'')+(date?'<button type="button" class="calbtn" data-cal="'+esc(date)+'|'+grp+'|'+k+'" '+ariaTip(L("In den Kalender"))+'><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg></button>':'')+'<div class="ppt">'+esc(i.t||"")+(i.end?'<br>'+esc(i.end):'')+'</div><div class="ppb"><div class="ppn">'+esc(TX(i,"n")||"")+'</div>'+
  ppParts(i)+(i.who?'<div class="ppw">'+esc(i.who)+'</div>':'')+ppWhere(i.where,i.map)+fpLinks(fpFor(i.n,i.where),[])+(TX(i,"note")?'<div class="ppx">'+esc(TX(i,"note"))+'</div>':'')+'</div></div>'}
/* participants: collapsible; people with phone or e-mail open a contact card */
function ppNames(t){return String(t||"").split(",").map(x=>x.trim()).filter(Boolean)}
function ppChip(n,people){
  const g=groupPeople(n.replace(/\btbc\b/ig,"").trim(),people);if(g)return '<span class="ppc grp">'+esc(n)+'</span>';
  const p=findPerson(n.replace(/\btbc\b/ig,"").trim(),people.filter(x=>x.email||x.phone))||null;
  return p&&(vok("phone")||vok("email"))?'<button type="button" class="ppc link" data-ppc="'+esc(p.name)+'|'+esc(p.email||"")+'|'+esc(p.phone||"")+'|'+esc(p.role||"")+'|'+esc(p.src||"")+'">'+esc(n)+'</button>':'<span class="ppc">'+esc(n)+'</span>';
}
function ppParts(i){
  const cr=ppNames(i.crew),ca=ppNames(i.cast);if(!cr.length&&!ca.length)return"";
  const people=PPPEOPLE||(PPPEOPLE=mailPeople());
  const n=cr.length+ca.length;
  return '<details class="ppparts"'+(S.ppo?' open':'')+'><summary>'+esc(L("Teilnehmende"))+' ('+n+')</summary>'+
    (cr.length?'<div class="pprow"><b>Crew</b>'+cr.map(x=>ppChip(x,people)).join("")+'</div>':'')+
    (ca.length?'<div class="pprow"><b>Cast</b>'+ca.map(x=>ppChip(x,people)).join("")+'</div>':'')+'</details>';
}
let PPPEOPLE=null;
function ppContact(v){
  let [name,email,phone,role,dept]=v.split("|");
  let b=mkDialog("ppcbox",null,{replace:true});
  if(!vok("phone"))phone="";if(!vok("email"))email="";const tel=telNum(phone);
  b.innerHTML='<div class="a2box mbox"><h3>'+esc(name)+'</h3>'+(role||(dept&&dept!=="user")?'<p class="ghint">'+esc([role,dept!=="user"?dept:""].filter(Boolean).join(" · "))+'</p>':'')+
    '<div class="ppcl">'+(phone?'<a class="gbtn" href="tel:'+esc(tel)+'">'+(window.CSI?CSI.phone:'')+' '+esc(phone)+'</a><a class="gbtn sec" href="sms:'+esc(tel)+'">💬 SMS</a>':'')+(email?'<a class="gbtn sec" href="mailto:'+esc(email)+'">✉ '+esc(email)+'</a>':'')+'</div>'+
    '<div class="a2b">'+dlgBtn("lnk",'data-ppcx',"Schliessen")+'</div></div>';
  b.addEventListener("click",e=>{if(e.target===b||e.target.closest("[data-ppcx]"))b.remove()});
  document.body.appendChild(b);
}
function ppItems(list,date,grp){return '<div class="pplist">'+list.map((it,k)=>ppItem(it,date,grp,k)).join("")+'</div>'}
/* calendar entry for one PREP appointment: an .ics file the phone opens straight in its calendar app */
function zurichUTC(date,hm){
  const [y,mo,d]=date.split("-").map(Number),[h,mi]=hm.split(":").map(Number);
  let ts=Date.UTC(y,mo-1,d,h,mi)-2*3600e3;
  const want=Date.UTC(y,mo-1,d,h,mi);
  for(let n=0;n<2;n++){const p=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(ts));
    const g=t=>+(p.find(x=>x.type===t)||{}).value;ts+=want-Date.UTC(g("year"),g("month")-1,g("day"),g("hour"),g("minute"))}   /* whole date compared: also right on the 1st of a month */
  return new Date(ts);
}
function icsDate(dt){return dt.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"")}
function icsEsc(t){return String(t||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/([,;])/g,"\\$1")}
/* fold long lines at 75 bytes (UTF-8) without splitting a character */
function icsFold(l){const enc=new TextEncoder(),out=[];let cur="",n=0;for(const ch of l){const b=enc.encode(ch).length;if(n+b>(out.length?74:75)){out.push(cur);cur="";n=0}cur+=ch;n+=b}out.push(cur);return out.join("\r\n ")}
function makeICS(date,i){
  const tm=/^\d{1,2}:\d{2}$/.test(i.t||""),te=/^\d{1,2}:\d{2}$/.test(i.end||"");
  const L2=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Tschugger Crew//PREP//DE","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
    "UID:prep-"+date+"-"+String(i.n||"").replace(/\W+/g,"").slice(0,30)+"-"+(i.t||"").replace(/\W/g,"")+"@tschugger-crew","DTSTAMP:"+icsDate(new Date())];
  if(tm){const st=zurichUTC(date,i.t);let en=te?zurichUTC(date,i.end):new Date(st.getTime()+3600e3);if(en<=st)en=new Date(en.getTime()+864e5); /* night shoot: end after midnight */L2.push("DTSTART:"+icsDate(st),"DTEND:"+icsDate(en))}
  else{const d0=date.replace(/-/g,""),nx=new Date(date+"T12:00:00Z");nx.setUTCDate(nx.getUTCDate()+1);L2.push("DTSTART;VALUE=DATE:"+d0,"DTEND;VALUE=DATE:"+nx.toISOString().slice(0,10).replace(/-/g,""))}
  const desc=[i.t&&!tm?i.t:"",i.desc||"",i.crew?"Crew: "+i.crew:"",i.cast?"Cast: "+i.cast:"",i.map||"","TSCHUGGER Tigerblood – Prep"].filter(Boolean).join("\n");
  L2.push("SUMMARY:"+icsEsc((tm?"":"("+(i.t||"TBA")+") ")+(i.n||"Prep")),i.where?"LOCATION:"+icsEsc(i.where):"","DESCRIPTION:"+icsEsc(desc),i.map?"URL:"+i.map:"");
  if(tm)L2.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+icsEsc(i.n||"Prep"),"TRIGGER:-PT30M","END:VALARM");
  L2.push("END:VEVENT","END:VCALENDAR");
  return L2.filter(Boolean).map(icsFold).join("\r\n")+"\r\n";
}
/* e-mail distribution list for one PREP appointment: names → addresses from the crew list and the app users */
const nmk=t=>fold(t).replace(/[^a-z]+/g," ").trim();
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;const m=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=m[0];m[0]=i;for(let j=1;j<=b.length;j++){const t=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return m[b.length]}
function mailPeople(){
  const out=[],seen=new Set(),add=(name,email,role,src,phone)=>{email=String(email||"").trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){if(name)out.push({name,email:"",phone:phone||"",role:role||"",src,k:nmk(name)});return}const k=nmk(name)+"|"+email;if(seen.has(k))return;seen.add(k);out.push({name,email,phone:phone||"",role:role||"",src,k:nmk(name)})};
  for(const g of S.crew)for(const p of arr(g.people))add(p.name,p.email,p.role,g.dept,p.phone);
  try{if(typeof ADM!=="undefined"&&ADM&&perm("contacts.extra")){for(const m of arr(ADM.mem))add(m.name||[m.firstName,m.lastName].filter(Boolean).join(" "),m.contactEmail||m.email,"","user",m.phone);for(const i of arr(ADM.inv))add(i.name,i.id,i.role,"user")}}catch(_){}
  return out;
}
function findPerson(name,people){
  const k=nmk(name);if(!k)return null;
  let hit=people.find(p=>p.k===k);if(hit)return hit;
  const [f,...r]=k.split(" "),l=r.join(" ");
  const ok=p=>{const [pf,...pr]=p.k.split(" ");const pl=pr.join(" ");return (pf===f&&lev(pl,l)<=1)||(pl===l&&(lev(pf,f)<=2||pf.startsWith(f)||f.startsWith(pf)))};
  const cand=people.filter(p=>p.k); /* entries without a name never match (else every first name went to them) */
  return cand.find(p=>p.email&&ok(p))||cand.find(ok)||null;
}
function groupPeople(term,people){
  const t=nmk(term);
  /* whole words only: names like «Anton», «Allegra» or «Lichtsteiner» are people, not departments */
  if(/^(everyone|all crew|crew cast|crew and cast|alle)( |$)/.test(t)||/all crew who/.test(t))return {all:true,list:people.filter(p=>p.src!=="user")};
  const W=w=>new RegExp("(^| )("+w+")( |$)");
  const dm=[[W("art dep|art department|art dept|ausstattung|szenenbild"),/ausstattung|art/],[W("licht|light|lighting|grip|grips"),/licht|grip/],[W("kamera|camera"),/kamera/],[W("kostum|kostume|kostumbild|costume|costumes|wardrobe"),/kost/],[W("maske|make up|makeup|hmu|hair make up"),/mask/],[W("ton|sound"),/^ton/]];
  for(const [re,dep] of dm)if(re.test(t)){const g=S.crew.filter(x=>dep.test(fold(x.dept)));if(g.length)return {all:false,list:people.filter(p=>g.some(x=>fold(x.dept)===fold(p.src)))}}
  return null;
}
function ppMail(key){if(!vok("email"))return;
  const [date,grp,k]=key.split("|");const d=S.prepro.find(x=>x.date===date);if(!d)return;
  const i=(grp==="p"?arr(d.parallel):d.items)[+k];if(!i)return;
  const people=mailPeople(),found=[],missing=[],groups=[],have=new Set();
  const names=[i.crew,i.cast].filter(Boolean).join(",").split(",").map(x=>x.replace(/\btbc\b/ig,"").trim()).filter(Boolean);
  const noMail=[];
  for(const n of names){const g=groupPeople(n,people);if(g){groups.push(n);for(const p of g.list)if(p.email&&!have.has(p.email)){have.add(p.email);found.push(p)}continue}
    const p=findPerson(n,people.filter(x=>x.email))||findPerson(n,people);
    if(p&&p.email){if(!have.has(p.email)){have.add(p.email);found.push(Object.assign({},p,{asked:n}))}}else if(p)noMail.push(p.name);else missing.push(n)}
  const dt=new Date(date+"T12:00:00"),when=WDL(dt)+" "+ddmm(dt)+(i.t&&/\d/.test(i.t)?" "+i.t+(i.end?"–"+i.end:""):"");
  const subj="TSCHUGGER Tigerblood – "+(i.n||"Prep")+" – "+when;
  const body=(i.n||"")+"\n"+when+(i.where?"\n"+i.where:"")+(i.map?"\n"+i.map:"");
  const to=found.map(p=>p.email).join(",");
  let b=mkDialog("mailbox",null,{replace:true});
  b.innerHTML='<div class="a2box mbox"><h3>'+esc(L("E-Mail-Verteiler"))+'</h3><p class="mbt"><b>'+esc(i.n||"")+'</b><br>'+esc(when)+'</p>'+
    (groups.length?'<p class="mbg">'+esc(L("Gruppen"))+': '+groups.map(esc).join(", ")+'</p>':'')+
    '<div class="mbl">'+(found.length?found.map(p=>'<div class="mbr"><span>'+esc(p.name)+(p.role?' <small>'+esc(p.role)+'</small>':'')+'</span><a href="mailto:'+esc(p.email)+'">'+esc(p.email)+'</a></div>').join(""):'<p class="ghint">'+esc(L("Keine Adressen gefunden."))+'</p>')+'</div>'+
    (noMail.length?'<div class="mbmiss nm"><b>'+esc(L("In der Crewliste, aber ohne E-Mail"))+' ('+noMail.length+')</b><ul>'+noMail.map(n=>'<li>'+esc(n)+'</li>').join("")+'</ul></div>':'')+
    (missing.length?'<div class="mbmiss"><b>'+esc(L("Nicht in Crewliste oder bei den Benutzer:innen"))+' ('+missing.length+')</b><ul>'+missing.map(n=>'<li>'+esc(n)+'</li>').join("")+'</ul></div>':'')+
    '<div class="a2b">'+(found.length?'<a class="gbtn" href="mailto:'+to.split(",").map(encodeURIComponent).join(",")+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body)+'">'+esc(L("Mail an alle"))+' ('+found.length+')</a><button type="button" data-mb="copy">'+esc(L("Adressen kopieren"))+'</button>':'')+dlgBtn("lnk",'data-mb="close"',"Schliessen")+'</div></div>';
  b.addEventListener("click",async e=>{const x=e.target.closest("[data-mb]");if(e.target===b||(x&&x.dataset.mb==="close")){b.remove();return}
    if(x&&x.dataset.mb==="copy"){try{await navigator.clipboard.writeText(found.map(p=>p.email).join(", "));x.textContent=L("Kopiert")}catch(_){prompt("",found.map(p=>p.email).join(", "))}}});
  document.body.appendChild(b);
}
