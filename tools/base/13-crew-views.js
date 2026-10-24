import {L,S,TX,TXA,ariaTip,cap,castChips,ddmm,esc,fmtDate,ieClass,locHref,lvButtons,lvClasses,maps,memo,norm,pad2,partsHref,safeUrl,slug,telNum,todayISO} from "./10-core.js";
import {UNAME,UNITBAR,dayNav,hasSelU,icsEsc,nextUnitDay,onlyU,planDays,unitLists,unitsOn,zurichUTC} from "./11-schedule-prep.js";
import {hm,planFactsHTML,planPdfBtn} from "./12-mycal.js";
import {CSEXP,CSI} from "./13a-callsheet.js";
import {csNowScene} from "./13b-cs-now.js";
import {csOrderRows} from "./13c-cs-places.js";
import {renderCS} from "./13e-cs-sections.js";
import {vok} from "./14-render.js";
import {searchBox} from "./15-script-tab.js";
import {blkFor,fpFor,fpLinks} from "./17-scene-reader.js";
import {openGallery} from "./18-blocking.js";
import {arr,showMsg} from "./20-data-start.js";
/* day.month. without weekday (any language) */
const dmShort=iso=>{const [,m,d]=String(iso||'').split('-');return d&&m?d+'.'+m+'.':''};
/* vCard 3.0 for one crew member, so it can be added to the phone's contacts */
const vEsc=icsEsc;   /* vCard and iCal escape text the same way (11-schedule-prep.js) */
function vCardText(p,g){
  const parts=String(p.name||"").trim().split(/\s+/),first=parts[0]||"",last=parts.slice(1).join(" ");
  const L1=["BEGIN:VCARD","VERSION:3.0","N:"+vEsc(last)+";"+vEsc(first)+";;;","FN:"+vEsc(p.name||""),"ORG:"+vEsc("TSCHUGGER Tigerblood")+(g&&g.dept?";"+vEsc(g.dept):"")];
  if(p.role)L1.push("TITLE:"+vEsc(p.role));
  if(p.phone)L1.push("TEL;TYPE=CELL:"+telNum(p.phone));
  if(p.email)L1.push("EMAIL;TYPE=INTERNET:"+String(p.email).trim());
  L1.push("NOTE:"+vEsc("TSCHUGGER Tigerblood"+(p.role?" – "+p.role:"")),"END:VCARD");
  return L1.join("\r\n")+"\r\n";
}
/* one contact: Android opens the phone's "new contact" screen pre-filled (intent), iPhone shows the contact card; elsewhere a .vcf file */
export function saveVCard(p,g){
  if(/Android/i.test(navigator.userAgent)){
    const x=(k,v)=>v?"S."+k+"="+encodeURIComponent(String(v).trim())+";":"";
    location.href="intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/raw_contact;"+x("name",p.name)+x("phone",p.phone&&telNum(p.phone))+"i.phone_type=2;"+x("email",p.email)+x("job_title",p.role)+x("company","TSCHUGGER Tigerblood")+"end";
    /* if the contacts app did not open (browser blocks intents), fall back to the .vcf file */
    setTimeout(()=>{if(document.visibilityState==="visible"&&document.hasFocus())saveVcf(vCardText(p,g),String(p.name||"").replace(/[\\/:*?"<>|]/g,"").trim()||"Kontakt",true)},1500);
    return;
  }
  saveVcf(vCardText(p,g),String(p.name||"").replace(/[\\/:*?"<>|]/g,"").trim()||"Kontakt");
}
export function allVCards(){let out="",n=0;for(const g of S.crew)for(const p of (g.people||[]))if(p.name&&(p.phone||p.email)){out+=vCardText(p,g);n++}return {text:out,n}}
export function saveVcf(v,name,file){
  const fn=name+".vcf",dataUrl=()=>{location.href="data:text/vcard;charset=utf-8,"+encodeURIComponent(v)};
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  /* iPhone: newer iOS versions block opening «data:» addresses (nothing happened) – the service worker serves the
     contact as a real .vcf from this site instead; «data:» only when no service worker is running */
  if(ios&&!file){
    if(window.caches&&navigator.serviceWorker&&navigator.serviceWorker.controller){
      const url=new URL("vc/"+Date.now().toString(36)+Math.random().toString(36).slice(2,8)+".vcf",location.href).href;
      caches.open("crew-vc").then(async c=>{for(const k of await c.keys())await c.delete(k);
        await c.put(url,new Response(v,{headers:{"Content-Type":"text/vcard;charset=utf-8","Content-Disposition":"inline; filename*=UTF-8''"+encodeURIComponent(fn)}}));location.href=url}).catch(dataUrl);
    }else dataUrl();
    return}
  try{const u=URL.createObjectURL(new Blob([v],{type:"text/vcard;charset=utf-8"}));const a=document.createElement("a");a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
  catch(_){location.href="data:text/vcard;charset=utf-8,"+encodeURIComponent(v)}
}
export function renderCrew(){
  if(!S.crew.length)return emptyHTML("Crewliste");
  const q=S.q.trim().toLowerCase();
  let h='<input class="search" id="q" type="search" placeholder="'+L("Crew suchen")+'" value="'+esc(S.q)+'" aria-label="'+esc(L("Crew durchsuchen"))+'">';
  if(typeof window.crewHead==="function")h+=window.crewHead();
  let n=0;
  for(const g of S.crew){
    const ppl=(g.people||[]).filter(p=>!q||[p.name,p.role,TX(p,"role"),g.dept,TX(g,"dept")].join(" ").toLowerCase().includes(q));
    if(!ppl.length)continue;n+=ppl.length;
    const gi=S.crew.indexOf(g);
    h+='<section class="dept"><h3 class="dh">'+esc(TX(g,"dept"))+'</h3><div class="people">'+ppl.map(p=>{
      /* vCard only on the website: the Claude viewer cannot save .vcf files, so there the copy button stays */
      let ct='';const web=typeof window.crewHead==="function";const vc=!web?'':(p.phone||p.email)?'<button class="copy vcbtn" data-vc="'+gi+':'+g.people.indexOf(p)+'" '+ariaTip(L("Kontakt ins Telefon übernehmen"))+'><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M19 8v6M16 11h6"/></svg>vCard</button>':'';
      /* wide screens: vCard after the job title; phones: next to the phone number */
      const vcW=vc.replace('class="copy vcbtn"','class="copy vcbtn vc-wide"'),vcN=vc.replace('class="copy vcbtn"','class="copy vcbtn vc-narrow"');
      const showP=vok("phone"),showE=vok("email");const vcW0=vcW;
      /* phone / e-mail missing in the crew list: taken from the person's app profile (marked) */
      const fx=(!p.phone||!p.email)&&typeof window.crewFill==="function"?window.crewFill(p):null;const fromApp='<span class="fromapp" title="'+esc(L("aus dem App-Profil"))+'">App</span>';
      if(fx&&fx.phone&&!p.phone&&showP)ct+='<a href="tel:'+esc(fx.phone.replace(/\s/g,""))+'"><span>'+esc(fx.phone)+'</span></a>'+fromApp;
      if(fx&&fx.email&&!p.email&&showE)ct+='<a class="em" href="mailto:'+esc(fx.email)+'">'+esc(fx.email)+'</a>'+fromApp;
      if(p.phone&&showP)ct+='<a href="tel:'+esc(p.phone.replace(/\s/g,""))+'"><span>'+esc(p.phone)+'</span></a>'+(web?vcN:'<button class="copy" data-copy="'+esc(p.phone)+'">'+L("Kopieren")+'</button>');
      if(p.email&&showE)ct+='<span class="em">'+esc(p.email)+'</span>'+(p.phone&&showP||!showP?'':vcN);
      if(p.note)ct+='<span>'+esc(p.note)+'</span>';
      return '<div class="p"><div class="hd"><span class="nm">'+esc(p.name)+'</span><span class="role">'+esc(TX(p,"role"))+'</span>'+(showP?vcW0:'')+'</div>'+(ct?'<div class="ct">'+ct+'</div>':'')+(typeof window.crewExtra==="function"?window.crewExtra(p):"")+'</div>';
    }).join("")+'</div></section>';
  }
  if(!n)h+='<div class="empty">'+L('Niemand gefunden für')+' «'+esc(S.q)+'».</div>';
  return h;
}
const addrKey=l=>norm(String(l.address||"").replace(/[–-]/g,"").replace(/strasse/gi,"str").replace(/[.,]/g,""));
const isS5=sc=>/^5(pt\d+|)$/.test(norm(sc))||norm(sc)==="185";
function scene5Parts(){
  const out=[];
  for(const d of S.days){
    for(const [u,list] of unitLists(d))
      for(const it of list)if(it.sc&&isS5(it.sc))out.push({it,d,u});
  }
  return out;
}
const BUNDLES=()=>(LOCCFG().bundles||[]).map(b=>Object.assign({},b,{re:locRe(b)}));
const TITLES=()=>(LOCCFG().titles||[]).map(t=>Object.assign({},t,{re:locRe(t)}));
const bundleOf=l=>BUNDLES().find(b=>b.re.test([l.name,l.venue,l.address].join(" ")));
export function groupLocs(){return memo("groups",buildGroups)}
function buildGroups(){
  const g=[],idx={};
  const s5locs=[];let s5at=-1;
  for(const l of S.locs){
    const scs=(l.sets||[]).flatMap(s=>s.scenes||[]);
    if(scs.length&&scs.every(isS5)){if(!s5locs.length)s5at=g.length;s5locs.push(l);continue}
    const b=bundleOf(l);
    const k=b?"b:"+b.key:(addrKey(l)||slug(l.name));
    if(idx[k]===undefined){idx[k]=g.length;g.push({key:k,items:[]})}
    g[idx[k]].items.push(l);
  }
  for(const x of g){
    const f=x.items[0];
    x.address=f.address;x.venue=(x.items.find(l=>l.venue)||{}).venue;
    const b=x.key.startsWith("b:")?BUNDLES().find(y=>"b:"+y.key===x.key):null;
    x.mixed=new Set(x.items.map(addrKey)).size>1;
    const tt=TITLES().find(t=>t.re.test(String(f.address||"")));
    x.title=tt?tt.title:b&&x.items.length>1?b.title:(x.items.length===1?f.name:(x.venue||String(f.address||"").split(",")[0]));
  }
  const parts=scene5Parts();
  if(parts.length||s5locs.length){
    const SPLIT=(LOCCFG().split||[]).map(x=>Object.assign({},x,{re:locRe(x)})),S5=LOCCFG().s5||{};
    const extra=SPLIT.map(x=>({key:x.key,s5:true,items:[],title:x.title,parts:parts.filter(p=>x.re.test(fullAddr(p.it.loc)))})).filter(x=>x.parts.length);
    const main=parts.filter(p=>!SPLIT.some(x=>x.re.test(fullAddr(p.it.loc))));
    const grp={key:"szene-5",s5:true,parts:main,items:s5locs,title:S5.title||L("Szene 5"),address:S5.address||""};
    g.splice(s5at<0?g.length:s5at,0,grp,...extra);
  }
  return g;
}
/* places, addresses and location groups come from the encrypted data (meta.locCfg) – never in the public code */
const LOCCFG=()=>(S.meta&&S.meta.locCfg)||{};
const locRe=x=>{try{return new RegExp(x.re,"i")}catch(_){return /$^/}};
const LOCADDR=()=>LOCCFG().addr||{};
export const fullAddr=loc=>LOCADDR()[norm(loc)]||loc;
export function addrForItem(it){
  const a=LOCADDR()[norm(it.loc||"")];if(a)return a;
  return memo("ad|"+(it.sc||"")+"|"+(it.loc||""),()=>{
    const n=norm(it.sc||"");
    for(const l of S.locs)for(const st of (l.sets||[]))for(const w of (st.scenes||[]).map(norm))
      if(n===w||n.startsWith(w+"pt"))return [l.venue,l.address].filter(Boolean).join(", ");
    return it.loc||"";
  });
}
function s5Addresses(g){
  const m=new Map();
  for(const p of g.parts){const a=fullAddr(p.it.loc);if(!m.has(a))m.set(a,[]);m.get(a).push(p)}
  return [...m.entries()];
}
export function ufOn(){return !unitsOn().every(u=>S.uf[u])}
function rawUnits(sc){return sceneTexts(sc,null).map(x=>x.u)}
function unitBadges(us){
  return '<span class="ubs">'+["1","2","3"].filter(u=>us.includes(u)).map(u=>'<span class="ub'+(u==="1"?'':' u'+u)+'">'+UNAME[u]+' Unit</span>').join("")+'</span>';
}
function cardWrap(key,head,addrHTML,body){
  const op=!!S.openSc[key];
  return '<div class="lc scd'+(op?' open':'')+'"><button class="lch" data-sckey="'+esc(key)+'" aria-expanded="'+op+'">'+head+'</button>'+addrHTML+'<div class="scb"'+(op?'':' hidden')+'>'+body+'</div></div>';
}
function s5Card(g0){
  const g=Object.assign({},g0,{parts:ufOn()?g0.parts.filter(p=>S.uf[p.u]):g0.parts});
  const al=s5Addresses(g);
  const tc=x=>String(x).toLowerCase().replace(/(^|[\s–\-\/])(\p{L})/gu,(m,a,c)=>a+c.toUpperCase());
  const motName=ps=>[...new Set(ps.map(p=>tc(String(p.it.set||"").replace(/^VALAIS – /,""))))].join(" / ");
  const li=p=>'<li><b>'+esc(p.it.sc)+'</b><button class="pd" data-goto="'+esc(p.d.id)+'">'+esc(p.d.short||p.d.label)+' '+dmShort(p.d.date)+(p.u!=="1"?'<i>'+p.u+'U</i>':'')+'</button><span class="ie '+ieClass(p.it.ie)+'">'+esc(p.it.ie||"")+'</span><span class="pdesc">'+esc(TX(p.it,"d"))+' <button class="scbtn" data-scene="'+esc(p.it.sc)+'">Script</button></span></li>';
  const body='<div class="mot">'+al.map(([ad,ps])=>'<div><b>'+esc(motName(ps))+'</b><span class="addr" style="font-size:13px">'+esc(ad)+' · <a href="'+esc(partsHref(ps,ad))+'" target="_blank" rel="noopener noreferrer">Maps</a></span><ul class="plot">'+ps.map(li).join("")+'</ul></div>').join("")+'</div>';
  const days=[...new Map(g.parts.map(p=>[p.d.id,p.d])).values()].sort((x,y)=>x.date<y.date?-1:1).map(d=>d.short||d.label).join(" · ");
  const n=g.parts.length;
  const head='<h4>'+esc(g.title)+unitBadges(g0.parts.map(p=>p.u))+'</h4><span class="lcm">'+(al.length>1?al.length+' '+L('Motive')+' · ':'')+n+' '+(n===1?L('Szene'):L('Szenen'))+(days?' · '+esc(days):'')+'</span>';
  const one=al.length===1?al[0][0]:null;
  const top='<div class="adl"><div><span class="addr">'+esc(one||((LOCCFG().s5||{}).village||"")+(((LOCCFG().s5||{}).village)?' · ':'')+al.length+' '+L('Adressen im Dorf'))+'</span> <a href="'+esc(one?partsHref(al[0][1],one):maps((LOCCFG().s5||{}).village||""))+'" target="_blank" rel="noopener noreferrer">Maps</a></div></div>';
  return cardWrap("card:"+(g.key==="szene-5"?"s5":g.key),head,top,body);
}
/* every scene with a synopsis, first occurrence, in schedule order; «occ» = all its schedulings (unit filter: a scene of the
   1st unit picked up later by the 2nd unit also shows when only the 2nd unit is selected) */
const allScenes=()=>memo("allsc",()=>{
  const by=new Map(),out=[];
  for(const d of S.days)for(const [u,list] of unitLists(d))for(const it of list){
    if(!it.sc||!it.d)continue;const n=norm(it.sc);
    if(by.has(n)){by.get(n).occ.push({it,d,u});continue}const x={it,d,u,n,occ:[{it,d,u}]};by.set(n,x);out.push(x);
  }
  return out;
});
export function sceneTexts(scenes,uf){
  if(uf===undefined)uf=ufOn()?S.uf:null;
  const uk=uf?["1","2","3"].filter(u=>uf[u]).join(""):"*";
  return memo("st|"+uk+"|"+scenes.join(","),()=>{
    const want=scenes.map(norm);
    const out=allScenes().filter(x=>want.some(w=>x.n===w||x.n.startsWith(w+"pt")));
    if(!uf)return out;
    return out.map(x=>{const o=x.occ.find(y=>uf[y.u]);return o?Object.assign({},x,o):null}).filter(Boolean);
  });
}
function plotHTML(scenes){
  const t=sceneTexts(scenes);if(!t.length)return"";
  return '<ul class="plot">'+t.map(({it,d,u})=>'<li><b>'+esc(it.sc)+'</b><button class="pd" data-goto="'+esc(d.id)+'">'+esc(d.short||d.label)+' '+dmShort(d.date)+(u!=="1"?'<i>'+u+'U</i>':'')+'</button><span class="ie '+ieClass(it.ie)+'">'+esc(it.ie||"")+'</span><span class="pdesc">'+esc(TX(it,"d"))+'</span>'+fpLinks([],blkFor(it.sc),'<button class="scbtn" data-scene="'+esc(it.sc)+'">Script</button>')+'</li>').join("")+'</ul>';
}
function locCard(g0){
  if(g0.s5)return s5Card(g0);
  const g=ufOn()?Object.assign({},g0,{items:g0.items.filter(l=>sceneTexts((l.sets||[]).flatMap(x=>x.scenes||[])).length)}):g0;
  const addr=[g.venue,g.address].filter(Boolean);
  const multi=g.items.length>1;
  const sets=l=>(l.sets||[]).map(s=>esc(s.ie)+': '+esc((s.scenes||[]).join(", "))).join(" · ");
  const body=multi
    ?'<div class="mot">'+g.items.map(l=>{const ad=[l.venue,l.address].filter(Boolean).join(", ");return '<div><b>'+esc(l.name)+'</b>'+(g.mixed?'<span class="addr" style="font-size:13px">'+esc(ad)+'</span>':'')+(plotHTML((l.sets||[]).flatMap(x=>x.scenes||[]))||'<span class="scs">'+sets(l)+'</span>')+'</div>'}).join("")+'</div>'
    :(()=>{const pl=plotHTML((g.items[0].sets||[]).flatMap(x=>x.scenes||[]));return pl||'<div class="scs">'+sets(g.items[0])+'</div>'})();
  const allSc=g.items.flatMap(l=>(l.sets||[]).flatMap(x=>x.scenes||[]));
  const nSc=sceneTexts(allSc).length;
  const dlist=[...new Map(sceneTexts(allSc).map(x=>[x.d.id,x.d])).values()].sort((a,b)=>a.date<b.date?-1:1).map(d=>d.short||d.label).join(" · ");
  const head='<h4>'+esc(g.title)+unitBadges(rawUnits(g0.items.flatMap(l=>(l.sets||[]).flatMap(x=>x.scenes||[]))))+'</h4><span class="lcm">'+(multi?g.items.length+' '+L('Motive')+' · ':'')+nSc+' '+(nSc===1?L('Szene'):L('Szenen'))+(dlist?' · '+esc(dlist):'')+'</span>';
  const addrHTML=g.mixed
    ?'<div class="adl">'+g.items.map(l=>{const ad=[l.venue,l.address].filter(Boolean).join(", ");return '<div><span class="addr">'+esc(ad)+'</span> <a href="'+esc(locHref(l,ad))+'" target="_blank" rel="noopener noreferrer">Maps</a></div>'}).join("")+'</div>'
    :(addr.length?'<div class="adl"><div><span class="addr">'+esc(addr.join(", "))+'</span> <a href="'+esc(locHref(g.items.find(l=>/^https:/.test(l.map||""))||g.items[0],addr.join(", ")))+'" target="_blank" rel="noopener noreferrer">Maps</a></div></div>':g.items.some(l=>/^https:/.test(l.map||""))?'<div class="adl"><div><span class="addr">'+L('Ort: TBA')+'</span> <a href="'+esc(g.items.find(l=>/^https:/.test(l.map||"")).map)+'" target="_blank" rel="noopener noreferrer">Maps</a></div></div>':'<div class="adl"><div><span class="addr">'+L('Ort: TBA')+'</span></div></div>');
  const fps=[...new Map(g.items.flatMap(l=>fpFor(l.name,[l.venue,l.address].filter(Boolean).join(", "))).map(f=>[f.url,f])).values()];
  /* the location where the shooting is now: pink frame (as in the callsheet) */
  let now=false;try{const ns=typeof csNowScene==="function"&&csNowScene();now=!!ns&&allSc.some(x=>norm(x)===norm(ns.sc))}catch(_){}
  const card=cardWrap("card:"+g.key,head,addrHTML,body+fpLinks(fps,[]));return now?card.replace('<div class="lc scd','<div class="lc scd lcnow'):card;
}
export function renderLoc(){
  if(!S.locs.length)return emptyHTML("Motivliste");
  const gs=groupLocs().filter(g=>{if(!ufOn())return true;if(g.s5)return g.parts.some(p=>S.uf[p.u]);return sceneTexts(g.items.flatMap(l=>(l.sets||[]).flatMap(x=>x.scenes||[]))).length>0});
  return '<div class="lvwrap '+lvClasses()+'">'+lvButtons((/^https:\/\//.test(window.MAPURL||"")?'<a class="mapbtn" href="'+esc(window.MAPURL)+'" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/></svg>Map</a>':'')+'<button class="scall" id="scall" data-scall="1" aria-expanded="false" aria-label="'+L("Alle Szenen auf- oder zuklappen")+'">'+cap(L("Szenen"))+'</button>')+
    searchBox("lq",S.lq,L("Location, Adresse, Szene …"))+'<div id="lqres">'+locResults(gs)+'</div></div>';
}
export function locResults(gs){
  return (()=>{
      if(!gs.length)return '<div class="empty">'+(S.uf["1"]||S.uf["2"]||S.uf["3"]?L('Keine Locations für diese Unit.'):L('Bitte mindestens eine Unit wählen.'))+'</div>';
      const terms=String(S.lq||"").toLowerCase().split(/\s+/).filter(Boolean);
      const cards=gs.map(locCard).filter(h=>{if(!terms.length)return true;const t=h.replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").toLowerCase();return terms.every(x=>t.includes(x))});
      return cards.length?cards.join(""):'<div class="empty">'+esc(L("Nichts gefunden für"))+' «'+esc(S.lq)+'»</div>';
    })();
}
/* Sides (the script pages of a shooting day) and the original callsheet pages: as pictures in the app (gallery, also offline) */
/* the count behind the title of a part, like the other parts of the callsheet («3 Dokumente») */
const docCnt=n=>'<span class="cscount"><span><b>'+n+'</b> '+esc(L(n===1?"Dokument":"Dokumente"))+'</span></span>';
function sidesHTML(date){const dd=window.cdDocDate?cdDocDate(date):date,all=arr(S.meta&&S.meta.sides),mine=all.map((s,i)=>[s,i]).filter(([s])=>dd&&s.date===dd),gen=all.map((s,i)=>[s,i]).filter(([s])=>!s.date);
  if(!mine.length&&!gen.length)return "";const b=([s])=>'<a class="pillbtn" href="'+esc(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer">'+(window.CSI?CSI.doc:'')+' '+esc(s.name)+'</a>';   /* opens the PDF itself */
  /* folded, opened with a tap */
  return '<details class="dsec cssec" id="cs-sides"><summary><h3 class="dh">Sides</h3>'+docCnt(mine.length+gen.length)+(typeof CSEXP==="string"?CSEXP:"")+'</summary><p class="ghint">'+esc(L("Die Drehbuchseiten des Tages."))+'</p><div class="sidesb">'+mine.map(b).join("")+(gen.length?(mine.length?'<span class="sidesg">'+esc(L("Weitere"))+'</span>':'')+gen.map(b).join(""):'')+'</div></details>'}
document.addEventListener("click",e=>{const a=e.target.closest("[data-sides],[data-cspg]");if(!a||typeof window.blkImg!=="function")return;e.preventDefault();
  if(a.dataset.sides!==undefined){const s=arr(S.meta&&S.meta.sides)[+a.dataset.sides];if(!s)return;
    openGallery({name:"sides:"+s.name,title:"Sides · "+s.name,sc:[],url:s.url,media:arr(s.pg).map((p,i)=>({n:s.name+" · "+(i+1)+"/"+s.pg.length,t:"img",f:p,u:s.url}))});return}
  const x=S.dispos.find(d=>d.date===a.dataset.cspg);if(!x)return;
  openGallery({name:"cs:"+x.date,title:"Callsheet · "+(x.label||x.date),sc:[],url:x.link,media:arr(x.pg).map((p,i)=>({n:"Callsheet · "+(i+1)+"/"+x.pg.length,t:"img",f:p,u:x.link}))})});
/* risk assessments (Gefährdungsbeurteilung) of the day: only with the right «Gefährdungsbeurteilung sehen», below the Sides,
   folded when the callsheet opens */
/* documents of the day as buttons in a folded part of the callsheet: risk assessments (right «Gefährdungsbeurteilung sehen»)
   and set floorplans attached to the callsheet (right «Setfloorpläne sehen») */
function docSecHTML(date,perm,key,title,hint,icon){if(!vok(perm))return "";const dd=window.cdDocDate?cdDocDate(date):date,l=arr(S.meta&&S.meta[key]).filter(r=>dd&&r.date===dd);if(!l.length)return "";
  return '<details class="dsec cssec rasec" id="cs-'+esc(key)+'"><summary><h3 class="dh">'+esc(L(title))+'</h3>'+docCnt(l.length)+(typeof CSEXP==="string"?CSEXP:"")+'</summary><p class="ghint">'+esc(L(hint))+'</p><div class="sidesb">'+
    l.map(r=>'<a class="pillbtn" href="'+esc(safeUrl(r.url))+'" target="_blank" rel="noopener noreferrer">'+(window.CSI?CSI[icon]:'')+' '+esc(r.name)+'</a>').join("")+'</div></details>'}
const raHTML=date=>docSecHTML(date,"ra","ra","Gefährdungsbeurteilung","Gefährdungsbeurteilungen des Tages (Sicherheit am Set).","warn");
/* «Anhänge» of a callsheet: the original callsheet, the Motivpläne («Motif See», «Tag 1 Plan – Motif Kapelle») and the floorplans of the day –
   opened in the PDF viewer of the app (no Dropbox account needed, also offline); without the PDF in the app yet: the pages / the Dropbox link */
function attachHTML(x,date){const dd=window.cdDocDate?cdDocDate(date):date,fp=vok("setfp")?arr(S.meta&&S.meta.setfp).filter(r=>dd&&r.date===dd):[];
  const btn=(pdf,title,url,ico,lab)=>pdf&&typeof window.blkImg==="function"?'<button type="button" class="pillbtn" data-attpdf="'+esc(pdf)+'" data-atttitle="'+esc(title)+'">'+(window.CSI?CSI[ico]:'')+' '+esc(lab)+'</button>'
    :url?'<a class="pillbtn" href="'+esc(safeUrl(url))+'" target="_blank" rel="noopener noreferrer">'+(window.CSI?CSI[ico]:'')+' '+esc(lab)+'</a>':'';
  const grp=(t,items)=>items.length?'<div class="attg"><h4>'+esc(L(t))+'</h4><div class="sidesb">'+items.join("")+'</div></div>':'';
  let orig="";if(x){orig=x.pdf?btn(x.pdf,L("Callsheet")+" · "+(x.label||x.date),"","doc",L("Original-Callsheet")):arr(x.pg).length&&typeof window.blkImg==="function"?'<button type="button" class="pillbtn" data-cspg="'+esc(x.date)+'">'+(window.CSI?CSI.doc:'')+' '+esc(L("Original-Callsheet"))+'</button>':btn("","",x.link,"doc",L("Original-Callsheet"))}
  const mo=fp.filter(r=>r.k!=="fp").map(r=>btn(r.pdf,r.name,r.url,"pin",r.name)),fl=fp.filter(r=>r.k==="fp").map(r=>btn(r.pdf,r.name,r.url,"doc",r.name));
  const n=(orig?1:0)+mo.length+fl.length;if(!n)return "";
  return '<details class="dsec cssec attsec" id="cs-att"><summary><h3 class="dh">'+esc(L("Anhänge"))+'</h3>'+docCnt(n)+(typeof CSEXP==="string"?CSEXP:"")+'</summary>'+
    grp("Callsheet",orig?[orig]:[])+grp("Motivpläne",mo)+grp("Floorpläne",fl)+'</details>'}
window.attachCount=(x,date)=>{const dd=window.cdDocDate?cdDocDate(date):date;return (x&&(x.pdf||arr(x.pg).length||x.link)?1:0)+(vok("setfp")?arr(S.meta&&S.meta.setfp).filter(r=>dd&&r.date===dd).length:0)};
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-attpdf]");if(!b||typeof window.blkImg!=="function")return;e.preventDefault();
  const t=b.dataset.atttitle||"PDF";window.blkImg(b.dataset.attpdf).then(u=>window.pdfView(u,t,t.replace(/[\\/:*?"<>|]+/g," ").trim()+".pdf")).catch(()=>showMsg(L("PDF nicht verfügbar (offline?)."),4000))});
const setfpHTML=date=>attachHTML(null,date);
/* one hour after the wrap of a shooting day the callsheet of the next shooting day (if there is one); a wrap after midnight counts for the next morning */
function csDayAfterWrap(t,pick,by,now){const td=S.days.find(d=>d.date===t)||{},x0=by[t]||{},tm=(x0.cs&&x0.cs.times)||{};
  const w=hm(tm.wrap||x0.wrap||td.wrap||""),cc=hm(tm.crewCall||x0.crewCall||td.crewCall||"");const nx=pick.find(d=>d.date>t&&by[d.date]);
  if(!w||!nx||typeof zurichUTC!=="function")return null;const end=zurichUTC(t,w).getTime()+(cc&&w<cc?864e5:0);
  return now>end+3600e3?nx.date:null}
export function renderDispo(){
  if(!S.days.length)return emptyHTML("Callsheet");
  const t=todayISO(),PD=planDays();
  if(onlyU()){const cd=S.days.find(x=>x.date===S.dday);if(!cd||!hasSelU(cd)){const nd=nextUnitDay();if(nd)S.dday=nd.date}}
  const by={};S.dispos.forEach(x=>by[x.date]=x);
  const pick=PD.filter(d=>d.kind!=="off"&&d.kind!=="travel");
  if(!S.dday||!pick.some(d=>d.date===S.dday)){
    S.dday=((pick.find(d=>d.date>=t)||pick[pick.length-1]||{}).date)||null;
    /* one hour after the wrap of today: the callsheet of the next shooting day, when there is one */
    if(S.dday===t)S.dday=csDayAfterWrap(t,pick,by,Date.now())||t;
  }
  let h=dayNav(PD,d=>d.date===S.dday,"data-dday","date",d=>d.kind!=="shoot"?{cls:"",mark:""}:(by[d.date]?{cls:" has",mark:" ●"}:{cls:" nodispo",mark:""}));
  if(!PD.length)return h+'<div class="empty">'+L('Bitte mindestens eine Unit wählen.')+'</div>';
  const day=S.days.find(d=>d.date===S.dday)||{},x=by[S.dday];
  if(day.kind&&day.kind!=="shoot")return h+'<div class="dayhead"><div><div class="dtitle"><h2>'+esc(day.label||"")+'</h2></div><div class="date drow"><span>'+fmtDate(day.date)+'</span>'+UNITBAR+'</div></div></div><div class="offday"><b>'+(day.kind==="travel"?L("Reisetag"):L("Drehfrei"))+'</b>'+esc(TX(day,"info"))+'</div>';
  if(!x){
    /* no callsheet yet: the day from the schedule (facts and a short list of the scenes), with the note that the callsheet follows */
    /* every chosen unit of this day its own list (1st, 2nd, 3rd) – the 2nd unit was missing here */
    const scl=l=>arr(l).filter(i=>i&&i.sc).map(i=>({t:i.t||"",sc:i.sc,ie:i.ie||"",set:i.set||"",dur:i.dur||"",pgs:i.pg||""}));
    const ul=unitLists(day).filter(([u,l])=>S.pu[u]&&scl(l).length).map(([u,l])=>[u,scl(l)]),scn=ul.length?ul[0][1]:[];
    return h+'<div class="dayhead csnoday"><div><div class="dtitle"><h2>'+esc(day.label||"")+'</h2></div><div class="date drow"><span>'+(day.date?fmtDate(day.date):'')+'</span>'+UNITBAR+'</div></div>'+
      (typeof planFactsHTML==="function"?planFactsHTML(day,typeof planPdfBtn==="function"?planPdfBtn(day):""):"")+'</div>'+
      '<div class="csfollow">'+(window.CSI?CSI.doc:'')+'<div><b>'+L('Callsheet folgt')+'</b> <span>'+L('Das Callsheet erscheint hier automatisch, sobald es im Callsheet-Ordner der Dropbox liegt, meist am Vorabend.')+'</span></div></div>'+
      (typeof csOrderRows==="function"?ul.map(([u,l])=>'<section class="dsec csview csplan"><h3 class="dh">'+esc(L("Laut Drehplan"))+(ul.length>1||u!=="1"?' · '+esc(UNAME[u]+" Unit"):'')+' · '+l.length+' '+esc(L("Szenen"))+'</h3>'+csOrderRows(l,day.date)+'<button class="lnk" data-goto="'+esc(day.id||"")+'">'+L('Planung ansehen')+' ›</button></section>').join(""):'')+
      setfpHTML(day.date)+sidesHTML(day.date)+raHTML(day.date);
  }
  /* read in structure (as the document): the new view; older callsheets keep the view below */
  if(x.cs&&typeof x.cs==="object"&&typeof renderCS==="function"){/* Anhänge, Sides and risk assessments inside the callsheet: the same look as its other parts */
    const r=renderCS(x,day),ex=attachHTML(x,x.date)+sidesHTML(x.date)+raHTML(x.date);h+=r.endsWith("</div>")?r.slice(0,-6)+ex+"</div>":r+ex;
    return h}
  const tile=(k,v,big)=>v?'<div class="dt'+(big?' big':'')+'"><div class="k">'+k+'</div><div class="v">'+esc(v)+'</div></div>':'';
  h+='<div class="dsp-head"><div><h2>'+esc(x.label||day.label||"Callsheet")+'</h2><div class="date drow"><span>'+fmtDate(x.date)+(x.version?' · '+esc(x.version):'')+'</span>'+UNITBAR+'</div></div></div>';
  h+='<div class="dtiles">'+tile("Crew Call",x.crewCall||x.generalCall,true)+tile(L("Drehbeginn"),x.shootCall)+tile("Wrap",x.wrap)+tile(L("Sonne"),x.sr&&x.ss?x.sr+"–"+x.ss:"")+tile(L("Wetter"),x.weather)+'</div>';
  if(TXA(x,"notes").length)h+='<div class="notes">'+TXA(x,"notes").map(n=>'<div class="note warn">'+esc(n)+'</div>').join("")+'</div>';
  const place=(lbl,p)=>p&&(p.name||p.address)?'<div class="dbox"><div class="dk">'+lbl+'</div><div class="dn">'+esc(p.name||"")+'</div>'+(p.address?'<a href="'+maps([p.name,p.address].filter(Boolean).join(", "))+'" target="_blank" rel="noopener noreferrer">'+esc(p.address)+'</a>':'')+(p.parking?'<div class="ds">'+L('Parken')+': '+esc(p.parking)+'</div>':'')+(p.note?'<div class="ds">'+esc(p.note)+'</div>':'')+'</div>':'';
  h+='<section class="dsec"><h3 class="dh">'+L('Treffpunkt & Orte')+'</h3><div class="dgrid">'+place(L("Base / Treffpunkt"),x.base)+(x.locations||[]).map(l=>place(L("Drehort"),l)).join("")+'</div></section>';
  if((x.meals||[]).length||(x.calls||[]).length){
    const tl=[...(x.meals||[]).map(m=>({t:m.t,n:m.what+(m.where?' · '+m.where:''),k:"meal"})),...(x.calls||[]).map(c=>({t:c.t,n:c.dept+(c.note?' · '+c.note:''),k:"call"}))].sort((a,b)=>(hm(a.t)||String(a.t||"")).localeCompare(hm(b.t)||String(b.t||""))) /* 9:00 before 10:00 */;
    h+='<section class="dsec"><h3 class="dh">'+L('Zeiten')+'</h3><ol class="tl">'+tl.map(r=>{const mn=r.k==="meal"&&/\b(lunch|mittag|pranzo|déjeuner)\b/i.test(r.n)&&window.menuFor?window.menuFor(x.date,"all"):"";return '<li class="row ev'+(mn?' lunch':'')+'"><div class="t">'+esc(r.t||"")+'</div><div class="what'+(r.k==="meal"?' meal':'')+'">'+esc(r.n)+mn+'</div></li>'}).join("")+'</ol></section>';
  }
  if((x.scenes||[]).length){
    h+='<section class="dsec"><h3 class="dh">'+cap(L('Szenen'))+'</h3><ul class="plot">'+x.scenes.map(sc=>'<li><b>'+esc(sc.sc)+'</b><span class="ie '+ieClass(sc.ie)+'">'+esc(sc.ie||"")+'</span> <span class="ds">'+esc(sc.set||"")+(sc.pg?' · '+esc(sc.pg)+' pgs':'')+'</span><span class="pdesc">'+esc(TX(sc,"d"))+' <button class="scbtn" data-scene="'+esc(sc.sc)+'">Script</button></span>'+(sc.cast&&sc.cast.length?castChips(sc.cast):'')+'</li>').join("")+'</ul></section>';
  }
  if((x.cast||[]).length){
    h+='<section class="dsec"><h3 class="dh">Cast</h3><div class="tblw"><table class="dtbl"><thead><tr><th>#</th><th>'+L('Rolle')+'</th><th>'+L('Darsteller')+'</th><th>Pickup</th><th>'+L('Maske')+'</th><th>'+L('Kostüm')+'</th><th>Set</th></tr></thead><tbody>'+
      x.cast.map(c=>'<tr><td>'+esc(c.no||"")+'</td><td>'+esc(c.role||"")+'</td><td>'+esc(c.actor||"")+'</td><td>'+esc(c.pickup||"")+'</td><td>'+esc(c.makeup||"")+'</td><td>'+esc(c.costume||"")+'</td><td><b>'+esc(c.onset||"")+'</b></td></tr>').join("")+'</tbody></table></div></section>';
  }
  /* emergency: the hospital (a public number) for everyone; phone numbers of people only with «Telefon sehen» */
  if(x.hospital||(x.contacts||[]).length){
    h+='<section class="dsec"><h3 class="dh">'+L('Notfall & Kontakte')+'</h3><div class="people">'+
      (x.hospital?'<div class="p"><div class="hd"><span class="nm">'+esc(x.hospital.name||L("Spital"))+'</span><span class="role">'+L('Nächstes Spital')+'</span></div>'+(x.hospital.address?'<div class="ct"><a href="'+maps([x.hospital.name,x.hospital.address].filter(Boolean).join(", "))+'" target="_blank" rel="noopener noreferrer">'+esc(x.hospital.address)+'</a></div>':'')+(x.hospital.phone?'<div class="ct"><a class="hosp" href="tel:'+esc(String(x.hospital.phone).replace(/\s/g,""))+'"><span>'+esc(x.hospital.phone)+'</span></a></div>':'')+'</div>':'')+
      (x.contacts||[]).map(c=>'<div class="p"><div class="hd"><span class="nm">'+esc(c.name||"")+'</span><span class="role">'+esc(c.role||"")+'</span></div>'+(c.phone&&vok("phone")?'<div class="ct"><a href="tel:'+esc(String(c.phone).replace(/\s/g,""))+'"><span>'+esc(c.phone)+'</span></a></div>':'')+'</div>').join("")+'</div></section>';
  }
  /* everything else on the callsheet, section by section as in the original */
  for(const sec of arr(x.sections)){const rows=arr(sec&&sec.rows).map(r=>Array.isArray(r)?r:[r]).filter(r=>r.some(c=>String(c==null?"":c).trim()));if(!rows.length)continue;
    const w=Math.max(...rows.map(r=>r.length));
    h+='<section class="dsec"><h3 class="dh">'+esc(String(sec.title||""))+'</h3>'+(w>1?'<div class="tblw"><table class="dtbl"><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(String(c==null?"":c))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>'
      :'<div class="dlines">'+rows.map(r=>'<p>'+esc(String(r[0]))+'</p>').join("")+'</div>')+'</section>'}
  h+=attachHTML(x,x.date)+sidesHTML(x.date)+raHTML(x.date);
  return h;
}
export function renderInfo(){
  if(!S.places.length)return emptyHTML("Infos");
  let h='';
  for(const g of S.places){
    h+='<section class="dept"><h3 class="dh">'+esc(TX(g,"cat"))+'</h3><div class="people">'+(g.items||[]).map(p=>
      '<div class="p"><div class="nm">'+esc(p.name)+'</div>'+(p.address?'<div class="role"><a href="'+maps(p.name+", "+p.address)+'" target="_blank" rel="noopener noreferrer">'+esc(p.address)+'</a></div>':'')+(p.note?'<div class="role">'+esc(TX(p,"note"))+'</div>':'')+(p.phone?'<div class="ct"><span>'+esc(p.phone)+'</span></div>':'')+'</div>'
    ).join("")+'</div></section>';
  }
  return h;
}
export function emptyHTML(what){
  return '<div class="empty">'+(S.loaded?L(what)+' '+L('ist noch leer. Die Daten kommen automatisch aus der Dropbox der Produktion.'):L('Lade')+' '+L(what)+' …')+'</div>';
}
export function srcHTML(){
  const m=S.meta;if(!m||!m.sources)return"";
  const KIND={schedule:"Drehplan",crew:"Crewliste",locations:"Motivliste",info:"Infos",script:"Drehbuch",callsheet:"Callsheet",dispo:"Callsheet",prep:"Prep-Wochenplanung",fp:"Floorplans"};
  const when=iso=>{const t=new Date(iso);return isNaN(t)?"":ddmm(t)+" "+pad2(t.getHours())+":"+pad2(t.getMinutes())};
  const pm=m.prepro;const srcs=m.sources.slice();
  if(arr(m.floorplans).length&&!srcs.some(x=>x.kind==="fp"))srcs.push({kind:"fp",name:"3D/0_BlockingFloorplans/floorplans locations",stand:arr(m.floorplans).length+" PDF · "+arr(m.blocking).length+" Blocking"});
  if(pm&&pm.source&&!srcs.some(x=>x.kind==="prep"))srcs.push({kind:"prep",name:"3D/11_Planning Prep Rehearsals/"+pm.source,stand:pm.issued});
  const rows=srcs.map(x=>{
    const raw=String(x.name||""),gs=/google sheet/i.test(raw);
    const file=gs?raw.replace(/^Google Sheet\s*/i,"").replace(/[«»]/g,""):raw.split("/").pop().replace(/\.(pdf|docx?|xlsx?|fdx|txt)$/i,"");
    const folder=gs?"Google Sheet":(raw.includes("/")?raw.split("/").slice(0,-1).join(" › "):"Dropbox");
    return '<li><b>'+esc(L(KIND[x.kind]||cap(String(x.kind||""))))+'</b><span class="srcf">'+esc(file)+'</span><span class="srcm">'+esc(folder)+(x.modified?' · '+L("Stand")+' '+esc(when(x.modified)):(x.stand?' · '+L("Stand")+' '+esc(x.stand):''))+'</span></li>';
  });
  const mu=/^https:\/\//.test(window.MAPURL||"")?window.MAPURL:"";
  const mapRow='<li><b>'+esc(L("Karte"))+'</b><a class="srcf" href="'+esc(mu)+'" target="_blank" rel="noopener noreferrer">Google My Maps ↗</a><span class="srcm">'+esc(L("Karte der Drehorte"))+'</span></li>';
  const li=srcs.findIndex(x=>x.kind==="locations");if(mu)rows.splice(li<0?rows.length:li+1,0,mapRow);
  return '<details class="src"'+(S.srcOpen?' open':'')+' data-srcd><summary><h4>'+L("Quellen")+' ('+rows.length+')</h4></summary><ul>'+rows.join("")+'</ul><p>'+L("Dropbox der Produktion, nur gelesen.")+(m.checkedAt?' '+L("Zuletzt geprüft")+' '+esc(when(m.checkedAt))+'.':'')+'</p></details>';
}
