/* ---------- Dokumente prüfen: vergleicht die Dokumente aus der Dropbox untereinander und mit der App ----------
   Drehplan ↔ Locations ↔ Drehbuch ↔ Cast-Liste, Prep Weekly ↔ Daily, Callsheets ↔ Drehplan, Namen ↔ Crewliste,
   dazu ein kurzer Selbsttest der App. Alles läuft im Browser mit den Daten, die die Person sehen darf – nichts geht weg.
   Sichtbar für Admins in App-Verwaltung → Log, für alle mit dem Recht «Dokumente prüfen» in Mein Konto → App. */
const DCK={res:null,busy:false,at:0,open:false};
try{const l=JSON.parse(localStorage.getItem("dck:last")||"null");if(l&&Array.isArray(l.res)){DCK.res=l.res;DCK.at=l.at||0}}catch(_){} /* the last check of this device is shown again */
/* screenplay text: action lines (and speaker cues) vs. what is said – a name inside dialogue does not put the person on set */
function dckSplit(t){const act=[],dlg=[];let inD=false;for(const raw of String(t||"").split("\n")){const l=raw.trim();
    if(!l){inD=false;continue}
    if(/^[A-ZÄÖÜ][A-ZÄÖÜ'\-]+(?: [A-ZÄÖÜ][A-ZÄÖÜ'\-]+)?\s*(\([^)]*\))?\s*$/.test(l)){act.push(l);inD=true;continue}
    if(/^\(.*\)$/.test(l)&&inD)continue;(inD?dlg:act).push(l)}
  return {a:fold(act.join(" ")),d:fold(dlg.join(" "))}}
const dckAction=t=>dckSplit(t).a,dckDialog=t=>dckSplit(t).d;
const dckMay=()=>!!ME&&(isAdmin()||can("data.check"));
const dnz=t=>fold(String(t||"")).replace(/[^a-z0-9]+/g," ").trim();
const dsc=x=>String(x||"").toUpperCase().replace(/\s+/g,"").replace(/^SC/,"");
/* scene parts («186PT1A», «25SL2») belong to their scene: 186, 25 */
const dbase=s=>{const m=String(s).match(/^(\d+[A-Z]?)(?:PT|SL|PART|TEIL)\d*[A-Z]?$/);return m?m[1]:s};const dnum=s=>(String(s).match(/^\d+/)||[""])[0];
const dhas=(set,s)=>set.has(s)||set.has(dbase(s))||set.has(dnum(s));
const dday=d=>{try{const dt=new Date(d+"T12:00:00");return WDL(dt)+" "+pad2(dt.getDate())+"."+pad2(dt.getMonth()+1)+"."}catch(_){return d}};
async function dckRun(auto){
  if(DCK.busy)return;DCK.busy=true;render();
  const out=[],w=(lvl,area,text)=>out.push({lvl,area,text});   /* lvl: warn = Unstimmigkeit, info = Hinweis, ok = in Ordnung */
  const t=todayISO(),days=(S.days||[]).filter(d=>d&&d.date);
  const items=[];for(const d of days){for(const it of (d.items||[]))if(it.sc)items.push([d,it,"1"]);for(const u of ["2","3"]){const x=d["unit"+u];if(x&&Array.isArray(x.items))for(const it of x.items)if(it.sc)items.push([d,it,u])}}
  const scs=it=>String(it.sc).split(/[,/+&]| und /).map(dsc).filter(Boolean);
  try{
    /* 1) Drehplan ↔ Locations */
    if(vok("plan")&&(S.locs||[]).length){
      const locSc=new Set(),locNames=(S.locs||[]).map(l=>dnz([l.name,l.title,l.venue,l.address].filter(Boolean).join(" ")));const words=t=>dnz(t).split(" ").filter(x=>x.length>=4&&!/^(route|chemin|rue|avenue|rte|chem|place)$/.test(x));
      for(const l of S.locs)for(const st of (l.sets||[]))for(const s of (st.scenes||[]))locSc.add(dsc(s));
      const miss=new Map(),noLoc=new Map();
      for(const [d,it] of items){for(const s of scs(it))if(!dhas(locSc,s))miss.set(s,(miss.get(s)||[]).concat(d.short||d.label||d.date));
        const ln=dnz(it.loc),lw=words(it.loc);if(ln&&!/^(tba|tbd|tbc)$/.test(ln)&&!locNames.some(n=>n&&(n.includes(ln)||lw.some(x=>n.includes(x)))))noLoc.set(it.loc,(noLoc.get(it.loc)||[]).concat(d.short||d.label))}
      if(miss.size)w("warn",L("Drehplan ↔ Locations"),L("Szenen im Drehplan, die in keiner Location stehen:")+" "+[...miss].slice(0,25).map(([s,ds])=>s+" ("+[...new Set(ds)].join(", ")+")").join(" · "));
      else w("ok",L("Drehplan ↔ Locations"),L("Alle Szenen des Drehplans stehen in der Motivliste."));
      if(noLoc.size)w("info",L("Drehplan ↔ Locations"),L("Motive im Drehplan ohne passenden Eintrag in der Motivliste:")+" "+[...noLoc.keys()].slice(0,15).join(" · "));
      const planSc=new Set(items.flatMap(([,it])=>scs(it)).flatMap(s=>[s,dbase(s),dnum(s)]));const notPlanned=[...locSc].filter(s=>s&&!dhas(planSc,s));
      if(notPlanned.length)w("info",L("Drehplan ↔ Locations"),L("Szenen in der Motivliste, die (noch) nicht im Drehplan stehen:")+" "+notPlanned.slice(0,30).join(", "));
    }
    /* 2) Drehplan ↔ Drehbuch */
    if(vok("plan")&&vok("script")&&typeof scriptData==="function"){
      let sl=[];try{sl=await scriptData()}catch(_){}
      if(sl.length){const ss=new Set(sl.map(x=>dsc(x.sc)));const miss=[...new Set(items.flatMap(([,it])=>scs(it)))].filter(s=>!dhas(ss,s));
        if(miss.length)w("warn",L("Drehplan ↔ Drehbuch"),L("Szenen im Drehplan, die im Drehbuch fehlen:")+" "+miss.slice(0,30).join(", "));
        else w("ok",L("Drehplan ↔ Drehbuch"),L("Alle Szenen des Drehplans stehen im Drehbuch."))}
      /* scene by scene: inside/outside, time of day and the cast against the scene in the script */
      if(sl.length){const byS=new Map(sl.map(x=>[dsc(x.sc),x]));const cast=(S.meta&&S.meta.cast)||{};
        const ieP=v=>{const t=String(v||"").toUpperCase();return /^(I\/E|E\/I)/.test(t)?"IE":/^I/.test(t)?"INT":/^E/.test(t)?"EXT":""};
        const ieS=h=>{const t=String(h||"").toUpperCase().trim();return /^(I\/E|E\/I|INT\.?\s*\/\s*EXT)/.test(t)?"IE":/^INT/.test(t)?"INT":/^EXT/.test(t)?"EXT":""};
        const todP=v=>{const t=String(v||"").split("/").pop().toUpperCase();return /^N/.test(t)?"N":/^(EV|DUSK|A)/.test(t)?"E":/^(D|M|MO|AM|PM|DAWN)/.test(t)?"D":""};
        const todS=h=>{const t=String(h||"").toUpperCase().split(/\s[-–]\s/).pop();return /(NIGHT|NACHT)/.test(t)?"N":/(EVENING|ABEND|DUSK|DÄMMERUNG)/.test(t)?"E":/(DAY|TAG|MORNING|MORGEN|AFTERNOON|NACHMITTAG|MITTAG|DAWN)/.test(t)?"D":""};
        const TODN={D:L("Tag"),N:L("Nacht"),E:L("Abend")};
        const ieBad=[],todBad=[],castMiss=[],castNear=[],castDlg=[],speakMiss=[];const seen=new Set();
        for(const [d,it] of items)for(const s of scs(it)){const part=dbase(s)!==s;const x=byS.get(s)||byS.get(dbase(s));if(!x||seen.has(s)||part)continue;seen.add(s);const tag=s+" ("+(d.short||d.label)+")"; /* scene parts (PT/SL) may be shot inside and outside: not compared */
          const a=ieP(it.ie),b=ieS(x.head);if(a&&b&&a!==b&&!(a==="IE"||b==="IE"))ieBad.push(tag+": "+L("Drehplan")+" "+a+", "+L("Drehbuch")+" "+b);
          const ta=todP(it.ie),tb=todS(x.head);if(ta&&tb&&ta!==tb)todBad.push(tag+": "+L("Drehplan")+" "+TODN[ta]+", "+L("Drehbuch")+" "+TODN[tb]);
          const txt=dckAction(x.text)+" "+fold(x.head||""),dlg=dckDialog(x.text);
          /* cast not named in the scene: look at the scene before and after in the script – often the person is there without dialogue (a note, never an error) */
          const xi=sl.indexOf(x),near=[sl[xi-1],sl[xi+1]].filter(Boolean).map(y=>dckAction(y.text)+" "+fold(y.head||"")).join(" ");
          for(const c of arr(it.cast)){const n=String(cast[c]||"").trim();const first=fold(n.split(/\s+/).pop()||"");const nm=fold(n);const has=t=>t.includes(nm)||(first.length>2&&t.includes(first));
            if(n&&!has(txt))(has(near)?castNear:has(dlg)?castDlg:castMiss).push(tag+": "+n)}
          const castN=arr(it.cast).map(c=>fold(String(cast[c]||""))).filter(Boolean);
          const spk=new Set([...String(x.text||"").matchAll(/^\s*([A-ZÄÖÜ][A-ZÄÖÜ'\-]+(?: [A-ZÄÖÜ][A-ZÄÖÜ'\-]+)?)\s*(\([^)]*\))?\s*$/gm)].filter(m=>!/(O\.?\s?S\.?|V\.?\s?O\.?|O\.?\s?C\.?|\bOFF\b|TEL|PHONE|STIMME|VOICE|RADIO|FUNK)/i.test(m[2]||"")).map(m=>m[1].trim()).filter(n=>n.length>2&&!/^(INT|EXT|CUT|SCHNITT|ENDE|FADE|OFF|ZWISCHENSCHNITT|RÜCKBLENDE|FLASHBACK|MONTAGE|SPÄTER|CONTINUOUS)$/.test(n)));
          const allCast=Object.values(cast).map(c=>fold(String(c)));
          for(const n of spk){const f=fold(n);if(!/^[a-zäöüéè' -]+$/.test(f))continue;const known=allCast.find(c=>c===f||c.split(" ").pop()===f);if(known&&!castN.some(c=>c===known))speakMiss.push(tag+": "+n.charAt(0)+n.slice(1).toLowerCase())}}
        if(ieBad.length)w("warn",L("Drehplan ↔ Drehbuch"),L("Innen/Aussen stimmt nicht überein:")+" "+ieBad.slice(0,12).join(" · "));
        if(todBad.length)w("warn",L("Drehplan ↔ Drehbuch"),L("Tageszeit stimmt nicht überein:")+" "+todBad.slice(0,12).join(" · "));
        if(castMiss.length)w("info",L("Drehplan ↔ Drehbuch"),L("Cast laut Drehplan, im Drehbuch der Szene nicht gefunden:")+" "+castMiss.slice(0,15).join(" · "));
        if(castDlg.length)w("info",L("Drehplan ↔ Drehbuch"),L("Cast laut Drehplan, im Drehbuch nur im Dialog erwähnt – muss nicht anwesend sein:")+" "+castDlg.slice(0,15).join(" · "));
        if(castNear.length)w("info",L("Drehplan ↔ Drehbuch"),L("Cast laut Drehplan, in der Szene ohne Text, aber in der Szene davor oder danach – vermutlich dabei ohne Dialog:")+" "+castNear.slice(0,15).join(" · "));
        if(speakMiss.length)w("info",L("Drehplan ↔ Drehbuch"),L("Sprechen im Drehbuch (laut Cast-Liste), fehlen im Cast des Drehplans:")+" "+speakMiss.slice(0,15).join(" · "));
        if(!ieBad.length&&!todBad.length)w("ok",L("Drehplan ↔ Drehbuch"),L("Innen/Aussen und Tageszeit stimmen bei allen {n} Szenen überein.").replace("{n}",seen.size))}
      else w("info",L("Drehplan ↔ Drehbuch"),L("Drehbuch nicht geladen – Vergleich übersprungen."))
    }
    /* 3) cast numbers ↔ cast list */
    if(vok("plan")){const cast=(S.meta&&S.meta.cast)||{};const miss=new Set();for(const [,it] of items)for(const c of arr(it.cast))if(!(String(c) in cast))miss.add(String(c));
      if(miss.size)w("warn",L("Drehplan ↔ Cast-Liste"),L("Cast-Nummern im Drehplan ohne Namen in der Cast-Liste:")+" "+[...miss].join(", "));
      else if(Object.keys(cast).length)w("ok",L("Drehplan ↔ Cast-Liste"),L("Alle Cast-Nummern haben einen Namen."))}
    /* 4) the same scene on several days */
    if(vok("plan")){const by=new Map();for(const [d,it,u] of items)for(const s of scs(it)){const k=s;by.set(k,(by.get(k)||new Set()).add((d.short||d.label||d.date)+(u!=="1"?" "+u+"U":"")))}
      const dup=[...by].filter(([,v])=>v.size>1);if(dup.length)w("info",L("Drehplan"),L("Szenen an mehreren Tagen (geteilt oder doppelt?):")+" "+dup.slice(0,20).map(([s,v])=>s+" ("+[...v].join(", ")+")").join(" · "))}
    /* 5) Prep: Daily ↔ Weekly – what the newer document changes */
    if(vok("prep")){const pf=(S.meta&&S.meta.prepFiles)||{};const docs=Object.entries(pf).map(([n,c])=>({n,days:(c&&c.days)||[]}));
      const clean=x=>dnz(String(x||"").replace(/\b(tbc|tba|tbd)\b/ig,"")),key=i=>(hm(i.t)||"")+" "+clean(i.n);let any=false;
      const same=(i,j)=>(hm(i.t)||"")===(hm(j.t)||"")&&(clean(i.n)===clean(j.n)||clean(i.n).includes(clean(j.n))||clean(j.n).includes(clean(i.n)));
      for(let a=0;a<docs.length;a++)for(let b=a+1;b<docs.length;b++){const A=docs[a],B=docs[b];
        for(const da of A.days){if(!da.date||da.date<t)continue;const db=B.days.find(x=>x.date===da.date);if(!db)continue;
          const onlyA=arr(da.items).filter(i=>!arr(db.items).some(j=>same(i,j))).map(i=>(i.t?i.t+" ":"")+i.n),onlyB=arr(db.items).filter(i=>!arr(da.items).some(j=>same(i,j))).map(i=>(i.t?i.t+" ":"")+i.n);
          if(onlyA.length||onlyB.length){any=true;w("info",L("Prep: Dokumente im Vergleich"),dday(da.date)+": «"+A.n.replace(/\.pdf$/i,"")+"» "+L("und")+" «"+B.n.replace(/\.pdf$/i,"")+"» "+L("unterscheiden sich")+" – "+(onlyA.length?L("nur im ersten")+": "+onlyA.slice(0,4).join(", "):"")+(onlyA.length&&onlyB.length?" · ":"")+(onlyB.length?L("nur im zweiten")+": "+onlyB.slice(0,4).join(", "):"")+". "+L("In der App gilt das neuere Dokument."))}}}
      if(!any&&docs.length>1)w("ok",L("Prep: Dokumente im Vergleich"),L("Weekly und Daily Schedule stimmen für die kommenden Tage überein."));
      const note=S.meta&&S.meta.prepro&&TX(S.meta.prepro,"note");if(note)w("info",L("Prep"),note);
      /* names in the prep plan that are not on the crew list */
      if(vok("crew")){const people=mailPeople();const unk=new Set();
        for(const d of (S.prepro||[])){if(d.date<t)continue;for(const i of arr(d.items).concat(arr(d.parallel)))for(const n of ppNames(i.crew)){const c=n.replace(/\([^)]*\)/g,"").replace(/\b(tbc|tba|tbd)\b/ig,"").trim();if(c&&c.length>4&&!/\d/.test(c)&&!/^(all|alle|crew|team|tbc|tba|tbd|cast|hods?|dept)/i.test(c)&&!findPerson(c,people)&&!(typeof groupPeople==="function"&&groupPeople(c,people)))unk.add(c)}}
        if(unk.size)w("warn",L("Prep ↔ Crewliste"),L("Namen in der Prep-Planung, die nicht in der Crewliste stehen:")+" "+[...unk].slice(0,25).join(", "))}
    }
    /* 6) Callsheets ↔ Drehplan */
    if(vok("dispo")&&vok("plan")){const dp=(S.dispos||[]).filter(x=>x&&x.date>=t);
      if(!dp.length)w("info",L("Callsheets ↔ Drehplan"),L("Noch keine kommenden Callsheets."));
      for(const x of dp){const d=days.find(y=>y.date===x.date);
        if(!d||d.kind!=="shoot"){w("warn",L("Callsheets ↔ Drehplan"),dday(x.date)+": "+L("Callsheet für einen Tag ohne Dreh im Drehplan."));continue}
        const ps=new Set(items.filter(([dd])=>dd===d).flatMap(([,it])=>scs(it)));
        const cs=new Set(arr(x.scenes).map(s=>typeof s==="object"?s.sc:s).flatMap(s=>String(s||"").split(/[,/+&]/)).map(dsc).filter(Boolean));
        if(cs.size){const a=[...cs].filter(s=>!ps.has(s)),b=[...ps].filter(s=>!cs.has(s));
          if(a.length||b.length)w("warn",L("Callsheets ↔ Drehplan"),dday(x.date)+": "+(a.length?L("nur im Callsheet")+": "+a.join(", "):"")+(a.length&&b.length?" · ":"")+(b.length?L("nur im Drehplan")+": "+b.join(", "):""))}
        const cc=hm(x.crewCall||x.generalCall),pc=hm(String(d.hours||"").split(/[–-]/)[0]);
        if(cc&&pc&&cc>pc)w("warn",L("Callsheets ↔ Drehplan"),dday(x.date)+": "+L("Crew Call {a} ist nach Drehbeginn {b} laut Drehplan.").replace("{a}",cc).replace("{b}",pc))}
      const next=days.filter(d=>d.kind==="shoot"&&d.date>=t).slice(0,2).filter(d=>!(S.dispos||[]).some(x=>x.date===d.date));
      if(next.length)w("info",L("Callsheets ↔ Drehplan"),L("Noch kein Callsheet für:")+" "+next.map(d=>(d.short||d.label)+" "+dday(d.date)).join(", "))}
    /* 7) how fresh the data is */
    {const m=S.meta||{},at=Date.parse((typeof lastCheck==="function"?lastCheck(m):m.updatedAt)||"");if(at&&Date.now()-at>6*3600e3)w("warn",L("Aktualität"),L("Die Daten wurden seit über 6 Stunden nicht mehr aus der Dropbox geprüft."));
      else if(at)w("ok",L("Aktualität"),L("Zuletzt mit der Dropbox abgeglichen:")+" "+new Date(at).toLocaleString(LOC[LANG]||"de-CH",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}))}
    /* 8) self test of the app on this device */
    {const bad=[],keep=S.tab;for(const tb of tabsOn()){S.tab=tb;try{render();if(/konnte nicht angezeigt/.test(document.getElementById("view").innerText))bad.push(tb)}catch(_){bad.push(tb)}}S.tab=keep;
      let key=false;try{key=!!(await getDataKey())}catch(_){}
      const sw=!!(navigator.serviceWorker&&navigator.serviceWorker.controller);
      w(bad.length||!key?"warn":"ok",L("Selbsttest der App"),(key?"✓ "+L("Schlüssel"):"✗ "+L("Schlüssel"))+" · "+(bad.length?"✗ "+L("Seiten mit Fehler")+": "+bad.join(", "):"✓ "+tabsOn().length+" "+L("Seiten"))+" · "+(sw?"✓ ":"– ")+L("Offline-Speicher")+" · "+(navigator.onLine?"✓ ":"– ")+L("Verbindung"))}
  }catch(err){w("warn",L("Prüfung"),L("Fehler:")+" "+(err&&err.message||err))}
  DCK.res=out;DCK.at=Date.now();DCK.busy=false;if(!auto)DCK.open=true;try{localStorage.setItem("dck:last",JSON.stringify({res:out,at:DCK.at}))}catch(_){}render();
}
window.dataCheckSec=function(flat){if(!dckMay())return "";
  const r=DCK.res||[],nw=r.filter(x=>x.lvl==="warn").length,ni=r.filter(x=>x.lvl==="info").length;
  const ic={warn:"⚠",info:"ℹ",ok:"✓"},ord={warn:0,info:1,ok:2};
  const sum=DCK.res?'<span class="tsth">'+(nw?'⚠ '+nw+' '+esc(L(nw===1?"Unstimmigkeit":"Unstimmigkeiten")):'✓ '+esc(L("keine Unstimmigkeiten")))+(ni?', '+ni+' '+esc(L(ni===1?"Hinweis":"Hinweise")):'')+'</span>':'<span class="tsth">'+esc(L("noch nicht geprüft"))+'</span>',tm=DCK.res&&DCK.at?esc(logWhen(DCK.at)):"";
  /* by area like the test parts: ✓/⚠ name · count, closed until opened */
  const areas=new Map();for(const x of r){if(!areas.has(x.area))areas.set(x.area,[]);areas.get(x.area).push(x)}
  const parts=[...areas].map(([a,l])=>{l=l.slice().sort((x,y)=>ord[x.lvl]-ord[y.lvl]);const w=l.filter(x=>x.lvl==="warn").length,n=l.filter(x=>x.lvl==="info").length;
    return '<details class="tstsu'+(w?' bad':'')+'" data-su="dck:'+esc(a)+'"'+logSu("dck:"+a)+'><summary>'+(w?'⚠ ':'✓ ')+esc(a)+' · '+(w?w+' '+esc(L(w===1?"Unstimmigkeit":"Unstimmigkeiten")):n?n+' '+esc(L(n===1?"Hinweis":"Hinweise")):esc(L("in Ordnung")))+'</summary>'+
      '<ul class="dckl">'+l.map(x=>'<li class="'+x.lvl+'"><span class="dcki">'+ic[x.lvl]+'</span><span>'+esc(x.text)+'</span></li>').join("")+'</ul></details>'}).sort((a,b)=>(b.includes('tstsu bad')?1:0)-(a.includes('tstsu bad')?1:0)).join("");
  const body='<p class="ghint">'+esc(L("Vergleicht die Dokumente aus der Dropbox untereinander (Drehplan, Locations, Drehbuch, Cast-Liste, Prep Weekly/Daily, Callsheets, Crewliste) und prüft die App auf diesem Gerät. Es werden nur Bereiche verglichen, die du sehen darfst."))+'</p>'+parts+
    '<div class="arb tstbtns"><button type="button" class="pillbtn" data-dckrun'+(DCK.busy?' disabled':'')+'>'+TST_RUN+esc(L(DCK.busy?"Prüfe …":"Jetzt prüfen"))+'</button></div>';
  /* own tab «Test»: the box without the outer collapse (the tab is the topic) */
  if(flat)return '<div class="dcksec dckflat'+(nw?' bad':'')+'"><p class="dcksum lsum">'+logHead(esc(L("Dokumente prüfen")),sum,tm).replace(/<button[\s\S]*<\/button>$/,"")+'</p>'+body+'</div>';
  return '<details class="tstsec dcksec'+(nw?' bad':'')+'"'+(DCK.open?' open':'')+' data-lsec="dck"><summary class="lsum">'+logHead(esc(L("Dokumente prüfen")),sum,tm,DCK.busy?{pct:null}:null)+'</summary>'+body+'</details>'};
document.addEventListener("click",e=>{if(e.target.closest("[data-dckrun]")&&dckMay())dckRun()});
/* Mein Konto → App: for people with «Dokumente prüfen» who are not admins (admins find it under App-Verwaltung → Log) */
/* without admin rights: own tab «Test» in the App-Verwaltung (12-admin) */

/* ---------- Berechtigungen testen (App-Verwaltung → Log/Tests, Owner und Admins): die App einen Moment mit den Rechten jeder Rolle ansehen ----------
   Pro Rolle: welche Bereiche sie sieht, welche Zusatzrechte sie hat, ob jede Seite ohne Fehler erscheint, ob Telefon/E-Mail
   nur mit Recht sichtbar sind und ob die Kopf-Symbole stimmen. Danach ist alles wieder wie vorher. Nichts wird gespeichert. */
const RTS={res:null,busy:false,at:0,open:false};
const RTN={today:"Today",plan:"Schedule",dispo:"Callsheet",loc:"Locations",crew:"Crew",script:"Script",cater:"Catering",info:"Info"};
try{const l=JSON.parse(localStorage.getItem("rt:last")||"null");if(l&&Array.isArray(l.res)){RTS.res=l.res;RTS.at=l.at||0}}catch(_){} /* the last test of this device is shown again */
async function roleTestRun(auto){
  if(RTS.busy||!isAdmin())return;RTS.busy=true;render();
  const keep={p:MYPERMS.slice(),r:MYROLE,tab:S.tab,sub:ADM.sub,ac:typeof ACSUB!=="undefined"?ACSUB:null,ap:ADMINPERMS};
  const roles=[{id:"admin",name:L("Admin"),adm:true,perms:(ADM.adminPerms||ADMIN_DEFAULT).slice()}].concat((ADM.roles||[]).map(r=>({id:r.id,name:r.name||r.id,perms:arr(r.perms)}))).concat([{id:"",name:L("Keine Rolle"),perms:[]}]);
  const out=[];
  try{let k=0;for(const ro of roles){RTS.prog=Math.round(k++/roles.length*100);
    SIMROLE={adm:!!ro.adm};MYPERMS=ro.adm?[]:ro.perms.filter(p=>PERMS.some(x=>x[0]===p));MYROLE=ro.adm?"":ro.id;if(ro.adm)ADMINPERMS=ro.perms;
    const issues=[],tabs=tabsOn();
    for(const t of tabs){S.tab=t;try{render();const v=document.getElementById("view");
        if(/konnte nicht angezeigt/.test(v.innerText))issues.push(L("Seite mit Fehler")+": "+(RTN[t]||t));
        if(!vok("phone")&&v.querySelector('a[href^="tel:"]')&&t==="crew")issues.push(L("Telefonnummern sichtbar ohne Recht"));
        if(!vok("email")&&v.querySelector('a[href^="mailto:"]')&&t==="crew")issues.push(L("E-Mail-Adressen sichtbar ohne Recht"))}catch(err){issues.push((RTN[t]||t)+": "+(err&&err.message||err))}}
    try{acctButton(true);if(typeof bcButton==="function")bcButton()}catch(_){}
    const vis=id=>{const b=document.getElementById(id);return !!b&&getComputedStyle(b).display!=="none"};
    if(vis("myCalBtn")!==!!vok("mycal"))issues.push(L("Kalender-Symbol stimmt nicht mit dem Recht überein"));
    if(vis("bcBtn")!==!!(can("push.send")&&window.PUSHEN!==false))issues.push(L("Couvert-Symbol stimmt nicht mit dem Recht überein"));
    if(vis("admBtn")!==!!canAdm())issues.push(L("Zahnrad stimmt nicht mit dem Recht überein"));
    if(!ro.adm&&ro.id&&(tabs.includes("plan")!==can("view.plan")))issues.push(L("Drehplan sichtbar, obwohl das Recht fehlt (oder umgekehrt)"));
    const extra=[can("push.send")&&L("Push senden"),can("events.add")&&L("Termine erstellen"),vok("mycal")&&L("Meine Termine"),can("mycal.all")&&L("Termine anderer"),can("crew.food")&&L("Essen"),can("crew.bday")&&L("Geburtstage"),
      vok("phone")&&L("Telefon"),vok("email")&&L("E-Mail"),canAdm()&&L("App-Verwaltung"),can("data.check")&&L("Dokumente prüfen")].filter(Boolean);
    out.push({name:ro.name,tabs:tabs.map(t=>RTN[t]||t),extra,issues});
    /* back to the real rights for a moment and show the progress (the role's pages were drawn without being shown) */
    SIMROLE=null;MYPERMS=keep.p;MYROLE=keep.r;ADMINPERMS=keep.ap;S.tab=keep.tab;ADM.sub=keep.sub;RTS.prog=Math.round(k/roles.length*100);try{acctButton(true);if(typeof bcButton==="function")bcButton()}catch(_){}render();
    await new Promise(r=>setTimeout(r,180))}}
  catch(err){out.push({name:L("Fehler"),tabs:[],extra:[],issues:[String(err&&err.message||err)]})}
  finally{SIMROLE=null;MYPERMS=keep.p;MYROLE=keep.r;try{const ad=await (async()=>ADM.adminPerms)();ADMINPERMS=isOwner()?ADMIN_DEFAULT.slice():(ad||ADMINPERMS)}catch(_){}
    S.tab=keep.tab;ADM.sub=keep.sub;try{acctButton(true);if(typeof bcButton==="function")bcButton()}catch(_){}}
  RTS.res=out;RTS.at=Date.now();RTS.busy=false;RTS.prog=null;if(!auto)RTS.open=true;try{localStorage.setItem("rt:last",JSON.stringify({res:out,at:RTS.at}))}catch(_){}render()}
window.roleTestSec=function(){if(!isAdmin()||SIMROLE)return "";const r=RTS.res||[],bad=r.filter(x=>x.issues.length).length;
  const sum=RTS.res?'<span class="tsth">'+(bad?'⚠ '+bad+' '+esc(L(bad===1?"Berechtigungsstufe mit Problemen":"Berechtigungsstufen mit Problemen")):'✓ '+r.length+' '+esc(L("Berechtigungsstufen in Ordnung")))+'</span>':'<span class="tsth">'+esc(L("noch nicht geprüft"))+'</span>',tm=RTS.res&&RTS.at?esc(logWhen(RTS.at)):"";
  return '<details class="tstsec rtsec'+(bad?' bad':'')+'"'+(RTS.open?' open':'')+' data-lsec="rt"><summary class="lsum">'+logHead(esc(L("Berechtigungen testen")),sum,tm,RTS.busy?{pct:RTS.prog||null}:null)+'</summary>'+
    '<p class="ghint">'+esc(L("Zeigt die App einen Moment mit den Rechten jeder Rolle: welche Bereiche sie sieht, welche Zusatzrechte sie hat, ob alle Seiten ohne Fehler erscheinen und ob Telefon, E-Mail und Kopf-Symbole nur mit Recht sichtbar sind. Es wird nichts geändert."))+'</p>'+
    r.slice().sort((a,b)=>b.issues.length-a.issues.length).map(x=>'<details class="tstsu'+(x.issues.length?' bad':'')+'" data-su="rt:'+esc(x.name)+'"'+logSu("rt:"+x.name)+'><summary>'+(x.issues.length?'⚠ ':'✓ ')+esc(x.name)+' · '+(x.issues.length?x.issues.length+' '+esc(L(x.issues.length===1?"Problem":"Probleme")):esc(L("in Ordnung")))+'</summary>'+
      '<ul class="tstl"><li class="ok">'+esc(L("Sieht"))+': '+esc(x.tabs.join(", ")||"–")+'</li>'+(x.extra.length?'<li class="ok">'+esc(L("Darf"))+': '+esc(x.extra.join(", "))+'</li>':'')+x.issues.map(t=>'<li class="no">✗ '+esc(t)+'</li>').join("")+'</ul></details>').join("")+
    '<div class="arb tstbtns"><button type="button" class="pillbtn" data-rtrun'+(RTS.busy?' disabled':'')+'>'+TST_RUN+esc(L(RTS.busy?"Prüfe …":"Jetzt prüfen"))+'</button></div></details>'};
document.addEventListener("click",e=>{if(e.target.closest("[data-rtrun]")&&isAdmin()&&!SIMROLE)roleTestRun()});
document.addEventListener("toggle",e=>{if(e.target&&e.target.classList&&e.target.classList.contains("rtsec"))RTS.open=e.target.open},true);
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.lsec==="dck")DCK.open=d.open},true);
