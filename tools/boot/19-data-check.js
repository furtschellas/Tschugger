/* ---------- Dokumente prüfen: vergleicht die Dokumente aus der Dropbox untereinander und mit der App ----------
   Drehplan ↔ Locations ↔ Drehbuch ↔ Cast-Liste, Prep Weekly ↔ Daily, Callsheets ↔ Drehplan, Namen ↔ Crewliste,
   dazu ein kurzer Selbsttest der App. Alles läuft im Browser mit den Daten, die die Person sehen darf – nichts geht weg.
   Sichtbar für Admins in App-Verwaltung → Log, für alle mit dem Recht «Dokumente prüfen» in Mein Konto → App. */
const DCK={res:null,busy:false,at:0};
const dckMay=()=>!!ME&&(isAdmin()||can("data.check"));
const dnz=t=>fold(String(t||"")).replace(/[^a-z0-9]+/g," ").trim();
const dsc=x=>String(x||"").toUpperCase().replace(/\s+/g,"").replace(/^SC/,"");
/* scene parts («186PT1A», «25SL2») belong to their scene: 186, 25 */
const dbase=s=>{const m=String(s).match(/^(\d+[A-Z]?)(?:PT|SL|PART|TEIL)\d*[A-Z]?$/);return m?m[1]:s};const dnum=s=>(String(s).match(/^\d+/)||[""])[0];
const dhas=(set,s)=>set.has(s)||set.has(dbase(s))||set.has(dnum(s));
const dday=d=>{try{const dt=new Date(d+"T12:00:00");return WDL(dt)+" "+pad2(dt.getDate())+"."+pad2(dt.getMonth()+1)+"."}catch(_){return d}};
async function dckRun(){
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
  DCK.res=out;DCK.at=Date.now();DCK.busy=false;render();
}
window.dataCheckSec=function(){if(!dckMay())return "";
  const r=DCK.res||[],nw=r.filter(x=>x.lvl==="warn").length,ni=r.filter(x=>x.lvl==="info").length;
  const ic={warn:"⚠",info:"ℹ",ok:"✓"};
  return '<details class="tstsec dcksec'+(nw?' bad':'')+'"'+(DCK.res?' open':'')+'><summary><b>'+esc(L("Dokumente prüfen"))+'</b>'+(DCK.res?' · <span class="tsth">'+(nw?nw+' '+esc(L(nw===1?"Unstimmigkeit":"Unstimmigkeiten")):esc(L("keine Unstimmigkeiten")))+(ni?', '+ni+' '+esc(L(ni===1?"Hinweis":"Hinweise")):'')+'</span>':'')+'</summary>'+
    '<p class="ghint">'+esc(L("Vergleicht die Dokumente aus der Dropbox untereinander (Drehplan, Locations, Drehbuch, Cast-Liste, Prep Weekly/Daily, Callsheets, Crewliste) und prüft die App auf diesem Gerät. Es werden nur Bereiche verglichen, die du sehen darfst."))+'</p>'+
    '<div class="arb"><button type="button" class="pillbtn" data-dckrun'+(DCK.busy?' disabled':'')+'>'+esc(L(DCK.busy?"Prüfe …":DCK.res?"Nochmals prüfen":"Jetzt prüfen"))+'</button></div>'+
    (DCK.res?'<ul class="dckl">'+r.slice().sort((a,b)=>({warn:0,info:1,ok:2})[a.lvl]-({warn:0,info:1,ok:2})[b.lvl]).map(x=>'<li class="'+x.lvl+'"><span class="dcki">'+ic[x.lvl]+'</span><span><b>'+esc(x.area)+'</b><br>'+esc(x.text)+'</span></li>').join("")+'</ul>':'')+'</details>'};
document.addEventListener("click",e=>{if(e.target.closest("[data-dckrun]")&&dckMay())dckRun()});
/* Mein Konto → App: for people with «Dokumente prüfen» who are not admins (admins find it under App-Verwaltung → Log) */
{const _aia=acctInnerAll;acctInnerAll=function(){const h=_aia();return (!isAdmin()&&dckMay())?h+'<section class="psec dckacct"><h4>'+esc(L("Dokumente prüfen"))+'</h4>'+window.dataCheckSec()+'</section>':h}}
