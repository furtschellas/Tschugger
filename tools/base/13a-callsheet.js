/* ---------- Callsheet as the production writes it (TBO_Dispo_…pdf): same order as the document ----------
   x.cs = the whole callsheet read in structure by tools/update_from_dropbox.py (CS_SCHEMA). At the top «Mein Tag»:
   my call, my rides and the information of my department. Phone numbers only with the right «Telefon sehen». */
/* outline icons in the style of the app (no emoji) */
const csI=d=>'<svg class="csi" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const CSI={phone:csI('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  radio:csI('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8l8-4"/><circle cx="9" cy="14" r="2"/><path d="M14 13h3M14 16h3"/>'),
  warn:csI('<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'),
  doc:csI('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6"/>'),
  lock:csI('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  pin:csI('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'),
  film:csI('<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9h17M8 5l-2 4M13 5l-2 4M18 5l-2 4"/>'),
  cast:csI('<path d="M12 3.5l2.5 5.2 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z"/>'),
  car:csI('<path d="M5 16V12l2-5h10l2 5v4"/><path d="M4 16h16v2H4z"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/><path d="M5 12h14"/>'),
  calls:csI('<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 7a7 7 0 0 1 0 10"/>'),
  dept:csI('<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>'),
  search:csI('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
  table:csI('<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 10h17M3.5 14.5h17M9.5 5v14"/>'),
  walk:csI('<circle cx="13" cy="4.5" r="1.6"/><path d="M10 21l2.5-6.5L15 17v4M12.5 14.5l-1-5 3.5 1.5 2.5 2.5M11.5 9.5L8 11l-1 3"/>'),
  me:csI('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>'),
  set:csI('<path d="M4 10h16v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 10l-.4-2.3a1.5 1.5 0 0 1 1.2-1.7l12.8-2.3a1.5 1.5 0 0 1 1.7 1.2L19.6 7"/><path d="M8.5 5.3l2.2 3.4M13.5 4.4l2.2 3.4"/>'),
  base:csI('<path d="M3.5 11.5L12 4.5l8.5 7"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5V14h4v5.5"/>'),
  whm:csI('<path d="M10 6.5a2 2 0 1 1 2 2v1.6"/><path d="M12 10.1l-8 5.6a1 1 0 0 0 .6 1.8h14.8a1 1 0 0 0 .6-1.8z"/>'),
  lunch:csI('<path d="M7 3.5v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-6M9 3.5v17"/><path d="M17 20.5v-17c-2 1.2-3 3.6-3 7v2h3"/>'),
  dinner:csI('<path d="M3.5 13h17a8.5 8.5 0 0 1-17 0z"/><path d="M14.5 3.5a3.2 3.2 0 1 0 4 4 2.6 2.6 0 0 1-4-4z"/>'),
  prod:csI('<rect x="5" y="3.5" width="14" height="17" rx="1.2"/><path d="M8.5 7.5h2M13.5 7.5h2M8.5 11h2M13.5 11h2M10.5 20.5v-4.5h3v4.5"/>'),
  dit:csI('<rect x="3.5" y="4.5" width="17" height="11.5" rx="1.5"/><path d="M8.5 20h7M12 16v4M7 12.5l2.5-3 2 2 2.5-3.5 3 4.5"/>'),
  whmc:csI('<path d="M7 5.5a1.6 1.6 0 1 1 1.6 1.6v1.3"/><path d="M8.6 8.4L2.5 12.8a.8.8 0 0 0 .5 1.4h11.2a.8.8 0 0 0 .5-1.4z"/><path d="M18.2 13.5l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z"/>'),
  whme:csI('<path d="M7 5.5a1.6 1.6 0 1 1 1.6 1.6v1.3"/><path d="M8.6 8.4L2.5 12.8a.8.8 0 0 0 .5 1.4h11.2a.8.8 0 0 0 .5-1.4z"/><circle cx="16.5" cy="15" r="1.6"/><circle cx="20.5" cy="15.6" r="1.3"/><path d="M13.8 21c.3-2 1.4-3.1 2.7-3.1s2.4 1.1 2.7 3.1M19.3 18.4c.9-.3 2.1.1 2.6 2.4"/>'),
  fp:csI('<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M3.5 11h7M14 3.5v5h6.5M10.5 11v4M10.5 18.5v2M14 13v7.5"/>'),
  park:csI('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 16.5v-9h3a2.6 2.6 0 0 1 0 5.2h-3"/>'),
  cards:csI('<rect x="4" y="4.5" width="16" height="6" rx="1.5"/><rect x="4" y="13.5" width="16" height="6" rx="1.5"/>')};
window.CSI=CSI;
/* open/close symbol of the app (two chevrons in a round frame, as in Log/Tests) */
const CSEXP='<span class="csexp" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg></span>';
const CSPH=/(\+?\d[\d ()\/.-]{7,}\d)/g;
const csIsTel=x=>/^(\+|0)/.test(x)&&x.replace(/\D/g,"").length>=9;
/* text with phone numbers: callable with the right, else left out */
function csTx(s){s=String(s==null?"":s);if(!s)return"";const ok=vok("phone");let out="",p=0;
  for(const m of s.matchAll(CSPH)){if(!csIsTel(m[1]))continue;out+=esc(s.slice(p,m.index));out+=ok?'<a href="tel:'+esc(m[1].replace(/[^\d+]/g,""))+'">'+esc(m[1])+'</a>':'<span class="cshid" title="'+esc(L("Nur mit dem Recht «Telefon sehen»"))+'">'+CSI.lock+'</span>';p=m.index+m[0].length}
  return (out+esc(s.slice(p))).replace(/(https?:\/\/[^\s<]+)/g,u=>'<a href="'+esc(safeUrl(u.replace(/&amp;/g,"&")))+'" target="_blank" rel="noopener noreferrer">'+u+'</a>').replace(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">(https?:\/\/(?:maps\.app\.goo\.gl|[^"<]*google\.[a-z.]+\/maps)[^<]*)<\/a>/g,(m0,h)=>csMap(h.replace(/&amp;/g,"&")))}
/* an address or place with a map link: the text itself is the link (instead of the round map button) */
function csAdr(txt,map,fallback){const U=/(https?:\/\/[^\s<]+)/g;const s0=String(txt||"");const urls=s0.match(U)||[];const isMap=u=>/maps\.app\.goo\.gl|google\.[a-z.]+\/maps|goo\.gl\/maps/.test(u);
  const u=map||urls.find(isMap)||"";const t=s0.replace(U,m=>isMap(m)?"":m).replace(/\s{2,}/g," ").replace(/[\s,:;–-]+$/,"").trim();if(!u)return csTx(s0);
  return '<a class="csadl" href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer"><span>'+csTx(t||fallback||L("Karte"))+'</span></a>'}
/* map: a round button with a pin (like the other round buttons of the app) */
const csMap=u=>u?'<a class="csmap" href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(L("Karte"))+'" title="'+esc(L("Karte"))+'">'+CSI.pin+'</a>':'';
/* translated text (locations, production information) in the language of the app; the original when none */
let CSTR=null;const csL=t=>{const s2=String(t==null?"":t);return (CSTR&&CSTR[LANG]&&CSTR[LANG][s2])||s2};
const csA=v=>Array.isArray(v)?v:(v==null||v===""?[]:[v]);
const csRoute=(f,t1,to,t2)=>[[t1,f].filter(Boolean).join(" "),[t2,to].filter(Boolean).join(" ")].filter(Boolean).join(" → ");
const csS=v=>Array.isArray(v)?v.join(", "):String(v==null?"":v);
/* a part of the callsheet: open or folded */
/* rides on the desktop: as a table (default) or as tiles, remembered on this device per part */
function csTv(){try{return JSON.parse(localStorage.getItem("cstv:v1")||"{}")||{}}catch(_){return {}}}
const csTvCls=k=>csTv()[k]==="cards"?"":"cs-tblmode";
const csTvBtn=k=>{const tbl=csTv()[k]!=="cards";return '<button type="button" class="lnk cstview cstv" data-cstv="'+k+'" title="'+esc(L(tbl?"Als Kacheln":"Als Tabelle"))+'">'+(tbl?CSI.cards:CSI.table)+'<span>'+esc(L(tbl?"Als Kacheln":"Als Tabelle"))+'</span></button>'};
document.addEventListener("click",e=>{const b=e.target.closest("[data-cstv]");if(!b)return;e.preventDefault();const k=b.dataset.cstv,m=csTv();m[k]=m[k]==="cards"?"table":"cards";try{localStorage.setItem("cstv:v1",JSON.stringify(m))}catch(_){}
  const d=document.getElementById("cs-"+k);if(d){d.classList.toggle("cs-tblmode",m[k]!=="cards");b.outerHTML=csTvBtn(k)}});
function csSec(title,body,open,cls,id,sumx){if(!body)return"";return '<details class="dsec cssec'+(cls?" "+cls:"")+'"'+(id?' id="cs-'+id+'"':'')+(open?' open':'')+'><summary><h3 class="dh">'+esc(title)+'</h3>'+(sumx||'')+CSEXP+'</summary>'+body+'</details>'}
/* a table of the callsheet: on the computer a table, on the phone one card per row (title = first columns, the rest as «label value») */
/* «07:40 - 07:55 15'» → «07:40 · 15′» (start and duration, no end time) */
function csDurT(v){return String(v==null?"":v).replace(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})(?:\s*(\d+)\s*['’′]?)?/g,(m0,a,h2,m2,d)=>{let mn=d;if(!mn){const p=a.split(/[:.]/);let x=(+h2*60+ +m2)-(+p[0]*60+ +p[1]);if(x<0)x+=1440;mn=String(x)}return a+" · "+mn+"′"})}
/* wardrobe / make-up: only start time and duration, behind it the initials of who does it («Marina 07:55 - 08:10 15’» → «07:55 · 15′ MA»), no comments */
function csMk(v,c){const out=[];for(const seg of String(v==null?"":v).split(/\s*;\s*/)){
    const m=seg.match(/^\s*(?:([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.' -]*?)\s+)?(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})(?:\s*(\d+)\s*['’′]?)?/);if(!m)continue;
    let ini="";if(m[1]){const fn=fold(m[1].trim().split(/\s+/)[0]);const full=csA(c&&c.calls).map(r=>String(r.name||"")).find(n=>fold(n).split(/\s+/)[0]===fn)||m[1];
      const w=String(full).trim().split(/\s+/).filter(x=>/^\p{L}/u.test(x));ini=w.length?(w.length>1?w[0][0]+w[w.length-1][0]:w[0].slice(0,2)).toUpperCase():""}
    const tx=csDurT(m[2]+" - "+m[3]+":"+m[4]+(m[5]?" "+m[5]+"’":"")),pr=tx.split(" · ");
    /* the same time twice (two make-up artists at once): once, with both initials */
    const o=out.find(x=>x.t===pr[0]&&x.d===(pr[1]||""));if(o){if(ini&&!o.i.includes(ini))o.i.push(ini)}else out.push({t:pr[0],d:pr[1]||"",i:ini?[ini]:[]})}
  if(!out.length)return"";
  /* time, duration and initials (duration and initials in pink) */
  return {h:out.map(x=>'<span class="mkt">'+esc(x.t)+'</span>'+(x.d?' <span class="mkd">'+esc(x.d)+'</span>':'')+(x.i.length?' <span class="mki">'+esc(x.i.join("+"))+'</span>':'')).join(" / ")}}
/* a cell: text (phone numbers, links) or ready HTML {h} */
const csCell=c=>c&&typeof c==="object"&&"h" in c?c.h:csTx(c);
const csCellTx=c=>c&&typeof c==="object"&&"h" in c?c.h.replace(/<[^>]+>/g,""):String(c||"");
/* a ride with its state (quittiert): driving car = running, two checks = done */
/* name to a driver's phone number: other callsheets' driver lines, else the crew list */
function csDriverByPhone(ph){const k=String(ph||"").replace(/\D/g,"").slice(-9);if(k.length<9)return"";
  for(const d of arr(S.dispos)){const t=String(d&&d.cs&&d.cs.drivers||"");for(const x of t.split(/\s*[|\n;]\s*/)){const m=x.match(CSPH);if(m&&m[0].replace(/\D/g,"").slice(-9)===k){const n=x.replace(m[0],"").replace(/o\.\s*p\.\s*D.*$/i,"").trim();if(n)return n}}}
  for(const g of arr(S.crew))for(const p of arr(g.people))if(String(p.phone||"").replace(/\D/g,"").slice(-9)===k)return p.name||"";return ""}
function csRideCell(date,r){const t=csRoute(r.from,r.t1,r.to,r.t2);let st=0,id="";try{id=typeof rideId==="function"?rideId(date,r):"";st=id&&window.rideState?rideState(id):0}catch(_){}
  const I=window.RIDE_ICO||{},mgr0=typeof canPerm==="function"&&canPerm("rides.manage");
  /* clickable only for the Fahrten Manager (popup) and for the driver of this ride (accept / done) */
  let drv=false;try{const me=CSCUR.me!==undefined?CSCUR.me:(typeof csMe==="function"?csMe():null);drv=!!(me&&r.driver&&me.hit(r.driver))}catch(_){}
  const can=id&&(mgr0||drv);
  const cls='ridest rs'+st+(st===2&&window.rideAt&&Date.now()-rideAt(id)>20*60e3?' rsold':'');
  const tip=st===0?L("Fahrt noch nicht angenommen"):st===1?L("Fahrt läuft"):L("Fahrt ausgeführt");
  const ico=st===1?I.car||"":st===2?I[1]||"":"";
  /* AL, AD and production change the state right here: open → running → done → open */
  const mgr=mgr0;
  const el=can?'<button type="button" class="'+cls+' rideack-cs'+(mgr?' rmgr':'')+'" data-rideack="'+esc(id)+'" data-rided="'+esc(date)+'"'+(drv?' data-rdrv="1"':'')+' title="'+esc(tip+" – "+L(mgr?"Fahrt ändern":"antippen zum Ändern"))+'" aria-label="'+esc(tip+" – "+L(mgr?"Fahrt ändern":"antippen zum Ändern"))+'">'+ico+(mgr?'<span class="rmgri" aria-hidden="true"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1L19 8l-3-3L5 16z"/></svg></span>':'')+'</button>'
    :'<span class="'+cls+'" title="'+esc(tip)+'">'+ico+'</span>';
  /* changed in the app (Fahrten Manager): marked, the original as tooltip */
  const o=r._orig,chg=o?' <span class="rchg" title="'+esc(L("Original")+": "+[csRoute(o.from,o.t1,o.to,o.t2),o.vehicle,o.driver,o.passengers||o.people].filter(Boolean).join(" · "))+'">'+esc(L("geändert"))+'</span>':'';
  return {h:el+' '+esc(t)+chg}}
function csTable(head,rows,tc){rows=rows.map(r=>r.map(c=>c&&typeof c==="object"?c:csDurT(c)));rows=rows.filter(r=>r.some(c=>csCellTx(c).trim()));if(!rows.length)return"";tc=tc||2;
  const tbl='<div class="tblw cs-tbl"><table class="dtbl"><thead><tr>'+head.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+csCell(c)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
  const cards='<div class="cs-cards">'+rows.map(r=>{const tt=r.slice(0,tc).map(c=>c&&typeof c==="object"&&c.h?c:csCellTx(c).trim());
    const kv=r.slice(tc).map((c,i)=>[head[i+tc]||"",c]).filter(([,v])=>csCellTx(v).trim());
    /* from → to pairs read as one line */
    return '<div class="cs-card"><div class="cs-ct">'+tt.map((x,i)=>{const v=x&&typeof x==="object"?x.h:csTx(x);return !x?'':i?'<span class="c'+i+'">'+v+'</span>':'<b>'+v+'</b>'}).join(" ")+'</div>'+kv.map(([k,v])=>'<div class="cs-kv">'+(k?'<span class="k">'+esc(k)+'</span>':'')+'<span class="v">'+csCell(v)+'</span></div>').join("")+'</div>'}).join("")+'</div>';
  return tbl+cards}
/* who am I on this callsheet: name and department (crew list / app profile) */
function csMe(){let me=null;try{me=myIdentity()}catch(_){}if(!me||!me.name)return null;
  const k=nmk(me.name),parts=k.split(" ").filter(w=>w.length>1),dep=fold(me.src||"").split(/[\s/]/)[0];
  const hit=t=>{const n=nmk(String(t||""));if(!n)return false;if(n.includes(k))return true;const f=parts[0],l=parts[parts.length-1];return parts.length>1&&n.includes(f)&&n.includes(l)};
  return {name:me.name,dep,hit}}
/* the row running now (shooting day = today): the last one that has started */
function csNowIdx(rows,date){if(date!==todayISO())return -1;const d=new Date(),now=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");let k=-1;
  csA(rows).forEach((r,i)=>{const t=hm(r.t);if(t&&t<=now)k=i});return k}
/* which set a scene is shot on: by the scenes listed at the location, else by the set name */
function csSceneLoc(locs,r){const n=x=>fold(String(x||"")).replace(/[^a-z0-9]/g,"");const sc=n(r.sc);const ls=csA(locs).filter(l=>!l.kinds&&l.no);
  /* «186 PT1B/C/PT2» → 186pt1b, 186pt1c, 186pt2 */
  const list=l=>{const out=[];for(const part of n(csS(l.scenes)).split(/[,;+&]/)){let prev="";for(const t of part.split("/")){if(!t)continue;let v=t;
      if(prev&&/^[a-z]$/.test(t))v=prev.slice(0,-1)+t;else if(prev&&/^(pt|sl)\d/.test(t))v=(prev.match(/^\d+/)||[""])[0]+t;else if(prev&&/^\d+[a-z]?$/.test(t)&&/pt\d/.test(prev)&&t.length<=2)v=prev.replace(/\d+[a-z]?$/,"")+t;
      out.push(v);prev=v}}return out};
  /* else by the set name: the whole name in either direction, else its first word (at least 4 letters) */
  const st=n(r.set),w=s=>(fold(String(s||"")).match(/[a-z0-9]{4,}/)||[""])[0];
  const names=l=>(l._m||[l]).map(m=>m.name).filter(Boolean);
  return (sc&&ls.find(l=>list(l).includes(sc)))||(st&&ls.find(l=>names(l).some(nm=>st.includes(n(nm))||n(nm).includes(st))))||(st&&ls.find(l=>names(l).some(nm=>w(nm)&&w(nm)===w(r.set))))||null}
/* address of a location: from the app's location list (by its scenes), else a note with a postcode («Pfynstrasse 160, 3952 Susten») */
/* codes L1, L2, Base …: always a link to the place (its map link, else its address in Google Maps); c/date of the callsheet being drawn */
let CSCUR={c:null,date:""};
/* hints of a place («To set …», «WC …»): small icons in the head, the text when tapped */
const CSHN_RE=/^(to set|zum set|nach set|wc\b)/i;
function csHnBtns(ns){return ns.map((n,k)=>{const wc=/^wc\b/i.test(n.trim());const lab=wc?L("WC"):L("Weg zum Set");
  return '<button type="button" class="cshn'+(wc?' cshn-wc':'')+'" data-cshn="'+k+'" aria-expanded="false" title="'+esc(csL(n))+'" aria-label="'+esc(lab)+'">'+(wc?'<b>WC</b>':CSI.walk)+'</button>'}).join("")}
function csHnTexts(ns){return ns.map((n,k)=>'<span class="cshn-t" data-cshnt="'+k+'" hidden>'+csAdr(csL(n),"")+'</span>').join("")}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-cshn]");if(!b)return;e.preventDefault();e.stopPropagation();
  const sm=b.closest("summary");const t=sm&&sm.querySelector('[data-cshnt="'+b.dataset.cshn+'"]');if(!t)return;const open=t.hidden;t.hidden=!open;b.setAttribute("aria-expanded",open?"true":"false")},true);
/* the place where the shooting is now (callsheet of today, from the start of the first scene until wrap) */
function csNowLoc(c,date,ls,now){now=now||new Date();const p=n=>String(n).padStart(2,"0");if(date!==now.getFullYear()+"-"+p(now.getMonth()+1)+"-"+p(now.getDate()))return null;
  const m=t=>{const x=String(t||"").match(/(\d{1,2})[:.](\d{2})/);return x?+x[1]*60+ +x[2]:null};const cur=now.getHours()*60+now.getMinutes();let hit=null,started=false;
  for(const r of csA((c.order||{}).rows)){const t=m(r.t);if(t==null||t>cur)break;if(r.sc){started=true;hit=csSceneLoc(ls,r)||hit}else if(/wrap|drehschluss/i.test(String(r.text||"")))return null}
  return started?hit:null}
/* side places (Base, W/H/M, Lunch, Parking, DIT …) with the set they are nearest to and the distance (positions of the updater in c.geo) */
function csNear(c,ls,date){const geo=c.geo||{},out=new Map(),sets=[];let si=0;
  for(const l of ls)if(!l.kinds){const g=csSetGeo(c,l)[1];if(g)sets.push([l,g])}
  if(!sets.length)return out;const km=(a,b)=>{const R=6371,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,h=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
  const add=(code,name,u,g,H)=>{if(!Array.isArray(g))return;let best=null;for(const [l,sg] of sets){const d=km(sg,g);if(!best||d<best[1])best=[l,d]}
    if(!best||best[1]>15)return;if(!out.has(best[0]))out.set(best[0],[]);const L0=out.get(best[0]);if(!L0.some(x=>x.code===code&&x.u===u))L0.push({code,name,u,d:best[1],h:H})};
  for(const l of ls){if(l.kinds){const code=l.kinds.map(csKindCode).join("·");add(code,l.name||"",l.map||csLocHref(l,c,date),geo[l.map],csBadgeIn(l))}
    /* items of a set are already in its own part; those of a side place (e.g. its parking) count */
    if(l.kinds)for(const i of csA(l.items))if(i.map)add(String(i.label||"").trim()||"P",[i.label,i.text].filter(Boolean).join(" · "),i.map,geo[i.map])}
  for(const a of out.values())a.sort((x,y)=>x.d-y.d);return out}
const csDist=d=>d<0.05?L("vor Ort"):d<1?Math.round(d*1000/10)*10+" m":(Math.round(d*10)/10).toFixed(1).replace(/\.0$/,"")+" km";
function csNearHTML(a){return a&&a.length?'<div class="csnear">'+a.map(p=>'<a class="csnearc" href="'+esc(safeUrl(p.u||""))+'" target="_blank" rel="noopener noreferrer" title="'+esc(csL(p.name))+'">'+(p.h?'<span class="csplace csbadge csbase">'+p.h+'</span>':'<span class="csplace">'+(/park/i.test(p.code)?CSI.park:'')+esc(csL(p.code))+'</span>')+'<small>'+esc(csDist(p.d))+'</small></a>').join("")+'</div>':''}
/* code of a kind of place: «W / H / M Extras» → «W/H/M Extras», «Base» */
const csKindCode=k=>String(k).replace(/^W\s*\/\s*H\s*\/\s*M/i,"WHM").replace(/\s*\/\s*/g,"/").trim();
/* the code of a place as a badge: an icon per kind of place (set, Base, W/H/M, Lunch, Dinner, Prod, DIT, Parking) and the short text */
const CSKICO={"Base":"base","W / H / M":"whm","Lunch":"lunch","Dinner":"dinner","Prod":"prod","DIT":"dit"};
function csKindIco(k){const q=(String(k).match(/ (Cast|Extras)$/)||[])[1],b=String(k).replace(/ (Cast|Extras)$/,"");if(b==="W / H / M"&&q)return q==="Cast"?CSI.whmc:CSI.whme;return CSI[CSKICO[b]]||(/park/i.test(b)?CSI.park:"")}
function csBadgeIn(l,codes){if(!l.kinds)return '<span>'+esc((codes||["L"+String(l.no||"").trim()]).join("·"))+'</span>';
  /* side place: the icons, with the group (Cast / Extras) and a kind without icon as text */
  return l.kinds.map(k=>{const q=(String(k).match(/ (Cast|Extras)$/)||[])[1],t=csKindCode(k).replace(/ (Cast|Extras)$/,q?" "+L(q):"");const ic=csKindIco(k);return '<b class="csk" title="'+esc(t)+'" aria-label="'+esc(t)+'">'+(ic||'<span>'+esc(t)+'</span>')+'</b>'}).join("")}
function csPlaceH(inner,href,title,cls){const t=title?' title="'+esc(title)+'" aria-label="'+esc(title)+'"':'',k='csplace csbadge'+(cls?' '+cls:'');
  return href?'<a class="'+k+'" href="'+esc(safeUrl(href))+'" target="_blank" rel="noopener noreferrer"'+t+' data-nobub="1">'+inner+'</a>':'<span class="'+k+'"'+t+'>'+inner+'</span>'}
/* the locations of the day: every set has its code L1, L2 … (its scenes carry it); sets at the same place (same map link or address,
   a set without either at the only place there is) are shown as one location with their codes «L1·L2» */
function csLocGroups(c,ls,date){const sets=ls.filter(l=>!l.kinds),key=l=>{let a="";try{a=csLocAddr(c,l,date)}catch(_){}return fold(String(l.map||a||"")).replace(/\s+/g," ").trim()};
  const keys=new Map(sets.map(l=>[l,key(l)])),K=[...new Set([...keys.values()].filter(Boolean))];
  const groups=[];for(const l of sets){let k=keys.get(l);if(!k){if(K.length!==1){groups.push([l]);continue}k=K[0]}let g=groups.find(x=>x.k===k);if(!g){g=[];g.k=k;groups.push(g)}g.push(l)}
  const uq=a=>[...new Set(a.filter(Boolean))];const out=[];
  for(const l of ls){if(l.kinds){out.push(l);continue}const g=groups.find(a=>a.includes(l));if(!g||g[0]!==l)continue;
    if(g.length===1){out.push(l);continue}
    out.push(Object.assign({},g[0],{_codes:g.map(x=>"L"+String(x.no||"").trim()),name:uq(g.map(x=>String(x.name||"").trim())).join(" / "),map:(g.find(x=>x.map)||{}).map||"",scenes:uq(g.map(x=>csS(x.scenes))).join(", "),
      notes:uq([].concat(...g.map(x=>csA(x.notes).map(String)))),items:[].concat(...g.map(x=>csA(x.items))),_m:g,_nos:[].concat(...g.map(x=>x._nos||[]))}))}
  return out}
/* position of a set: its map link, else the address the updater found (key «loc:n» = n-th set of the document) */
function csSetGeo(c,l){const geo=c.geo||{};for(const m of (l._m||[l])){const g=geo[m.map||"loc:"+(m._ix||m.no)];if(Array.isArray(g))return [m.map||"loc:"+(m._ix||m.no),g]}return [l.map||"loc:"+(l._ix||l.no),null]}
function csRadioHTML(t){t=String(t||"").trim();if(!t)return"";const b=t.replace(/^(radio\s*channels?|funk(kanäle)?)\s*:?\s*/i,"");const ch=[];const re=/(\d{1,2})\s*:\s*(.*?)(?=\s+\d{1,2}\s*:|$)/g;let m;while((m=re.exec(b)))ch.push([m[1],m[2].trim()]);
  return '<div class="csradio2"><span class="csrlab">'+esc(L("Funkkanäle"))+'</span>'+(ch.length>1?ch.map(([n,l])=>'<span class="csrch"><b>'+esc(n)+'</b>'+esc(l||"–")+'</span>').join(""):'<span>'+esc(t)+'</span>')+'</div>'}
function csMapQ(q){q=String(q||"").trim();return q?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q):""}
function csLocHref(l,c,date){c=c||CSCUR.c;date=date||CSCUR.date;if(!l)return"";if(l.map)return l.map;let ad="";try{ad=c?csLocAddr(c,l,date):""}catch(_){}return csMapQ(ad)}
function csCodeHref(code){const m=String(code||"").match(/^L(\w+)$/);if(!m||!CSCUR.c)return"";return csLocHref(csLocs(CSCUR.c).find(x=>!x.kinds&&String(x.no).trim()===m[1]))}
function csPlaceA(code,href,title,cls){const t=title?' title="'+esc(title)+'"':' title="'+esc(code)+'"';
  /* a base (Base, WHM, Lunch, Prod, DIT …): its own icon and the gold colour; sets (L1 …) stay text */
  const ic=/^L\d/i.test(String(code))?"":csKindIco(String(code).replace(/^WHM\b/i,"W / H / M").replace(/^Prod\b.*/i,"Prod")),k='csplace'+(ic?' csbadge csbase':'')+(cls?' '+cls:''),in_=ic?ic+'<span class="vh">'+esc(code)+'</span>':esc(code);
  return href?'<a class="'+k+'" href="'+esc(safeUrl(href))+'" target="_blank" rel="noopener noreferrer"'+t+' data-nobub="1">'+in_+'</a>':'<span class="'+k+'"'+t+'>'+in_+'</span>'}
function csLocAddr(c,l,date){let ad="";
  /* 1. the app's location list: a set there with one of the scenes of this location, or with the same name */
  try{const scs=csA((c.order||{}).rows).filter(r=>r.sc&&csSceneLoc([l],r)===l).map(r=>norm(r.sc));const nm=fold(String(l.name||"")).replace(/\(.*?\)/g,"").trim();
    const hit=(S.locs||[]).find(x=>(x.sets||[]).some(st=>(st.scenes||[]).map(norm).some(w=>scs.some(n=>n===w||n.startsWith(w+"pt")))))||
      (nm.length>3?(S.locs||[]).find(x=>(x.sets||[]).some(st=>fold(String(st.name||st.set||"")).includes(nm))||fold(String(x.name||x.venue||"")).includes(nm)):null);
    if(hit)ad=[hit.venue,hit.address].filter(Boolean).join(", ")}catch(_){}
  if(!ad)try{for(const r of csA((c.order||{}).rows).filter(r=>r.sc&&csSceneLoc([l],r)===l)){const it=((schedIndex()[norm(r.sc)]||[]).find(y=>y.d&&y.d.date===date)||{}).it;if(it){ad=addrForItem(it)||"";if(ad)break}}}catch(_){}
  if(!ad||/^tba$/i.test(ad)){const n=csA(l.notes).map(String).concat(csA(l.items).map(i=>String(i.text||""))).find(t=>/\b\d{4}\b/.test(t)&&/[A-Za-zÀ-ÿ]{3,}/.test(t));ad=n?n.replace(/https?:\/\/\S+/g,"").split(/\.\s|\n|\s*;\s*|\s\/\/\s/).find(p=>/\b\d{4}\b/.test(p))||"":"";ad=ad.trim()}
  return /^tba$/i.test(ad)?"":ad}
/* floorplans of a location (3D folder, matched like in the schedule: set and place of its scenes) – only with the right for blocking */
function csLocFp(c,l,date,icon){if(l.kinds||typeof fpFor!=="function"||!vok("blocking"))return"";const out=new Map();
  try{for(const r of csA((c.order||{}).rows).filter(r=>r.sc&&csSceneLoc([l],r)===l)){const it=((schedIndex()[norm(r.sc)]||[]).find(y=>y.d&&y.d.date===date)||{}).it;if(it)for(const f of fpFor(it.set,it.loc))out.set(f.file||f.name,f)}
    if(!out.size)for(const f of fpFor(l.name||"",""))out.set(f.file||f.name,f)}catch(_){}
  if(!out.size)return"";
  /* in the head of the location: one round icon per floorplan (the name in the tooltip) */
  if(icon)return [...out.values()].map(f=>'<a class="cshn csfpi" href="'+esc(safeUrl(f.url))+'"'+(csA(f.pg).length?' data-fpg="'+esc(f.file||f.name)+'"':'')+' target="_blank" rel="noopener noreferrer" title="'+esc("Floorplan · "+f.name)+'" aria-label="'+esc("Floorplan · "+f.name)+'">'+CSI.fp+'</a>').join("");
  return '<div class="csfp">'+[...out.values()].map(f=>'<a class="pillbtn" href="'+esc(safeUrl(f.url))+'"'+(csA(f.pg).length?' data-fpg="'+esc(f.file||f.name)+'"':'')+' target="_blank" rel="noopener noreferrer">'+CSI.doc+' Floorplan · '+esc(f.name)+'</a>').join("")+'</div>'}
function csOrderRows(rows,date,locs,one){const ONE=(()=>{const s0=csA(locs).filter(l=>!l.kinds&&l.no);return s0.length===1?s0[0]:null})();if(!csA(rows).length)return"";const ni=date?csNowIdx(rows,date):-1;return '<ol class="tl csorder">'+csA(rows).map((r,i)=>{const nw=i===ni?' now':'',nb=i===ni?'<span class="csnow">'+esc(L("Jetzt"))+'</span>':'';
    if(!r.sc)return '<li class="row ev'+nw+'"><div class="t">'+esc(r.t||"")+nb+'</div><div class="what">'+csTx(r.text||r.syn||"")+'</div></li>';
    /* scenes look like in the schedule (same row, details, cast, buttons): the scheduled row of that day with the callsheet time */
    const sx=(()=>{try{const l=(schedIndex()[norm(r.sc)]||[]);const o=l.find(y=>y.d&&y.d.date===date)||l[0];return o?o.it:null}catch(_){return null}})();
    const fromCs={sc:String(r.sc),ie:r.ie||"",set:r.set||"",d:r.syn||"",pg:r.pgs||"",dur:r.dur||"",dir:r.dir||"",cast:String(r.cast||"").split(/[,\s]+/).filter(Boolean)};
    const it=Object.assign({},fromCs);if(sx)for(const kk in sx){const v=sx[kk];if(v!=null&&v!==""&&!(Array.isArray(v)&&!v.length))it[kk]=v}it.t=r.t||(sx&&sx.t)||"";
    const bd0=date&&typeof bdFor==="function"?bdFor(date,r.sc):null;   /* the details of the scene from the breakdown are already shown: the callsheet notes only without them */
    if(r.notes&&!(bd0&&(arr(bd0.c).length||(bd0.h&&bd0.h.FX))))it.csnH=csTx(csS(r.notes));const keep=window.__mctx;window.__mctx={date:date||"",u:"1",cs:true};let li="";try{li=itemHTML(it)}catch(_){li=""}window.__mctx=keep;
    const extra=(r.extras&&!(bd0&&bd0.h&&bd0.h.XX)?'<div class="cscast">'+csTx(csS(r.extras))+'</div>':'');
    /* folded: the first line (scene, I/E, set, pages) is the summary, everything else opens with a tap */
    const i0=li.indexOf('<div class="sc">'),k=li.lastIndexOf('</div></li>');if(i0<0||k<0)return li;
    let body=li.slice(i0+16,k);const m=body.match(/<div class="l1">[\s\S]*?<\/div>/);const l1=m?m[0]:'<div class="l1"><span class="scn">'+esc(r.sc)+'</span></div>';if(m)body=body.replace(m[0],"");
    const lo=csSceneLoc(locs,r)||(one&&ONE)||null;const pb=lo?csPlaceA('L'+String(lo.no).trim(),csLocHref(lo),lo.name||""):'';
    const du=pb+(r.dur||it.dur?'<span class="csdur">'+esc(r.dur||it.dur)+'</span>':'');const l1d=du&&/<span class="set">/.test(l1)?l1.replace('<span class="set">',du+'<span class="set">'):l1+du;
    return '<li class="row csfold'+nw+'" data-sc="'+esc(String(r.sc))+'"><div class="t">'+esc(it.t||"")+nb+'</div><div class="sc"><details class="csscd"><summary>'+l1d+CSEXP.replace('class="csexp"','class="csexp sm"')+'</summary>'+body+extra+'</details></div></li>'}).join("")+'</ol>'}
/* what concerns me on this callsheet: call, cast times, rides, travel, my department */
/* a place named on the callsheet («Base», «Loc.2», «Parking loc. 1», «Holiday Inn») → name and map link from the Locations */
function csPlace(c,txt){const t=fold(String(txt||""));if(!t)return null;const ls=csLocs(c).filter(l=>!l.kinds);
  const m=t.match(/loc\.?\s*(\d+)/);const park=/park/.test(t);
  if(m){const l=ls.find(x=>(x._nos||[String(x.no).trim()]).includes(m[1]));if(l){if(park){const it=csA(l.items).find(i=>/park/i.test(i.label||""));if(it)return {name:String(txt),map:it.map||l.map||""}}return {name:'Set '+l.no+' · '+(l.name||""),map:l.map||""}}}
  if(/base|lunch|hermitage/.test(t))for(const l of csA(c.locations))for(const i of csA(l.items))if(/base|w \/ h|lunch/i.test((i.label||"")+" "+(i.text||"")))return {name:String(txt)+(!i.text||!/^base$/i.test(String(txt).trim())?"":" · "+String(i.text).split(",")[0]),map:i.map||""};
  return {name:String(txt),map:""}}
/* where my call is: the end of my first ride (if it arrives around my call), else the set shooting at that time, else set 1 */
function csCallPlace(c,me,call){const ct=hm(call.t);
  /* I drive: my call is where my first ride starts (pickup place), not where it goes */
  {const dr=csA(c.transport).concat(csA(c.crewTransport)).filter(r=>me.hit(r.driver)&&hm(r.t1)).sort((a,b)=>hm(a.t1).localeCompare(hm(b.t1)));
   const r=dr.find(r=>!ct||hm(r.t1)>=ct)||dr[0];
   if(r&&r.from){const p=Object.assign({},csPlace(c,r.from));if(!p.map)p.map=csMapQ(r.from);
     return Object.assign({},p,{how:L("Fahrer")+" "+[r.vehicle,r.t1&&(L("ab")+" "+hm(r.t1)),r.to&&("→ "+r.to)].filter(Boolean).join(" ")})}}const rides=csA(c.transport).filter(r=>me.hit(r.passengers)||me.hit(r.driver)).concat(csA(c.crewTransport).filter(r=>me.hit(r.people)));
  const r=rides.filter(r=>hm(r.t2)).sort((a,b)=>hm(a.t2).localeCompare(hm(b.t2)))[0];
  if(r){const p=csPlace(c,r.to);if(p){p.how=L("mit")+" "+[r.vehicle,r.from&&(L("ab")+" "+r.from),r.t1].filter(Boolean).join(" ");return p}}
  /* no ride: the place is not on the callsheet – nothing is guessed */
  return null}
/* Base, Lunch and Dinner as locations of their own (in the document they are lines of a set: «W / H / M Cast + Lunch: Restaurant Hermitage …») */
/* computed once per callsheet (the calls list asks for every person) */
const CSLOCMEMO=new WeakMap();function csLocs(c){if(!c||typeof c!=="object")return[];if(!CSLOCMEMO.has(c))CSLOCMEMO.set(c,csLocs0(c));return CSLOCMEMO.get(c)}
function csLocs0(c){const sets=[],extra=[];
  /* Base, W / H / M, Lunch, Dinner and the production office (DIT/Prod): from the label, the words before «:» or «(Base)» in the text */
  const KIND=[[/\bbase\b/i,"Base"],[/w\s*\/\s*h\s*\/\s*m/i,"W / H / M"],[/lunch|mittag/i,"Lunch"],[/dinner|diner|abendessen/i,"Dinner"],[/\bprod\b|production office|produktionsb/i,"Prod"],[/\bdit\b/i,"DIT"]];   /* DIT at another place than the others: a location of its own */
  const ORDER=KIND.map(k=>k[1]);
  /* one place = one location, also when several kinds are there (same map link or same name) */
  const place=(name,map)=>extra.find(e=>(map&&e.map===map)||(name&&fold(e.name)===fold(name)));
  /* two W / H / M on one day (one for the cast, one for the extras): the group after «W / H / M» stays in the code («W/H/M Cast», «W/H/M Extras») */
  const whoOf=t=>{const m=String(t||"").match(/w\s*\/\s*h\s*\/\s*m\s*([^:]*)/i);const g=m?m[1]:"";return /extra|komp|statist|figur/i.test(g)?"Extras":/cast|darsteller|schausp/i.test(g)?"Cast":""};
  for(const l0 of csA(c.locations)){const items=[];let last=null;let l=l0;
    /* «OPEN SPACE W / H / M Extras: Schulhausplatz 4 …» read as the name of a set: the W / H / M part is a place of its own */
    {const m=String(l.name||"").match(/^(.*?)\s+(w\s*\/\s*h\s*\/\s*m\b.*)$/i);if(m&&m[1].trim()){const part=m[2],adr=(part.split(":").slice(1).join(":")||"").trim();
      const twin=adr&&csA(l.items).find(i=>i.map&&i.map===l.map&&fold(String(i.text||"")).includes(fold(adr.split(/[,-]/)[0].trim())));
      l=Object.assign({},l,{name:m[1].trim()});const it={label:part.split(":")[0].trim(),text:adr||part,map:twin?l.map:""};if(twin)l.map="";l.items=[it].concat(csA(l.items))}}
    for(const i of csA(l.items)){const lab=String(i.label||""),txt=String(i.text||"").trim();
      /* lines that belong to the place before them: «To set 1: 4’ with car …», «WC: on base …» */
      if(last&&/^(to set|zum set|nach set|wc\b)/i.test((lab+" "+txt).trim())&&!i.map){const n=[lab,txt].filter(Boolean).join(": ").replace(/:\s*:/,":");if(!last.notes.includes(n))last.notes.push(n);continue}
      const cm=txt.match(/^([^:,]{1,40}):\s*(.+)$/),head=cm?cm[1]:"",body=cm?cm[2]:txt,par=(body.match(/\(([^)]{1,30})\)/)||[])[1]||"";
      const kinds=KIND.filter(([re,k])=>re.test(lab)||re.test(head)||re.test(par)||(k==="Base"&&re.test(body.split(",")[0]))).map(([,k])=>k);   /* «Base Church, Kirchplatz 5» is the Base too */
      if(!kinds.length||(!txt&&!i.map)){items.push(i);last=null;continue}
      const clean=body.replace(/\s*\([^)]{1,30}\)\s*/g," ").trim(),name=clean.split(",")[0].trim(),rest=clean.split(",").slice(1).join(",").trim();
      let e=place(name,i.map);
      if(!e){e={no:"",kinds:[],name:name||"",map:i.map||"",notes:[],items:[]};extra.push(e)}
      const who=whoOf(lab+" "+head)||whoOf(txt);
      for(const k0 of kinds){const k=k0==="W / H / M"&&who?k0+" "+who:k0;if(!e.kinds.includes(k))e.kinds.push(k)}
      const isAdr=t=>/\d{4}\s+\p{L}/u.test(String(t||""))||/^\p{L}[\p{L}.\s-]*\s\d+[a-z]?(\s|$|-)/u.test(String(t||""));
      if(name&&(!e.name||(isAdr(e.name)&&!isAdr(name)))){if(e.name&&e.name!==name&&!e.notes.includes(e.name))e.notes.unshift(e.name);e.name=name}
      {const at=lab.match(/@\s*(.+)$/);if(at&&isAdr(e.name)&&!isAdr(at[1])){if(!e.notes.includes(e.name))e.notes.unshift(e.name);e.name=at[1].trim()}}if(!e.map&&i.map)e.map=i.map;/* «Pfynstrasse 160, 3952 Susten; To set 1: …; WC: …» – each part its own line (address, hints with their icons, the rest with its kind) */
      for(const part of String(rest||"").split(/\s*;\s*/).map(x=>x.trim()).filter(Boolean)){const r2=isAdr(part)||/^(to set|zum set|nach set|wc\b)/i.test(part)?part:kinds.map(k0=>{const k=k0==="W / H / M"&&who?k0+" "+who:k0;return csKindCode(k)}).join(" / ")+": "+part;if(!e.notes.includes(r2))e.notes.push(r2)}last=e}
    /* the map link of the set is the one of a side place listed with it (e.g. «WHM Extras … https://…» after the set name): not the place of the set */
    const own=!!l.map&&extra.some(e=>e.map===l.map&&e.kinds.some(k=>k!=="DIT"&&k!=="Prod"));
    sets.push(Object.assign({},l,{items},own?{map:""}:{}))}
  /* «LOCATION: Bahnhofstrasse 40 - 3970 Salgesch» read as a set of its own: it is the address of the sets without own address or map link */
  {const isA=t=>/\d{4}\s+\p{L}/u.test(String(t||""))&&!/\bset\b/i.test(String(t||""));const adr=sets.filter(l=>isA(l.name)&&!csS(l.scenes).trim());
   if(adr.length===1&&sets.length>1){const a=adr[0];sets.splice(sets.indexOf(a),1);for(const l of sets)if(!l.map&&!csA(l.notes).some(n=>isA(n))){l.notes=[a.name].concat(csA(l.notes));if(a.map)l.map=a.map}
     for(const i of csA(a.items))if(!sets.some(l=>csA(l.items).some(j=>j.map&&j.map===i.map)))sets[0].items=csA(sets[0].items).concat([i])}}
  /* a set without a number on the callsheet («ER SET», read wrongly) gets its position: 1, 2, 3 … (as «Loc. 3» elsewhere in the document) */
  sets.forEach((l,i)=>{if(!/^\d+[a-z]?$/i.test(String(l.no||"").trim()))l.no=String(i+1);l._ix=i+1;l._nos=[String(l.no).trim()]});
  /* DIT / production office at the place of a set: a line of that set, not a location of its own (only somewhere else it is one) */
  for(const e of extra.slice())if(e.kinds.every(k=>k==="DIT"||k==="Prod")){const st=sets.find(l=>(e.map&&l.map===e.map)||(e.name&&fold(String(l.name||""))===fold(e.name)));
    if(st){st.items=(st.items||[]).concat([{label:e.kinds.join(" / "),text:[e.name].concat(e.notes).filter(Boolean).join(", "),map:e.map||""}]);extra.splice(extra.indexOf(e),1)}}
  return sets.concat(extra.map(e=>{e.kinds.sort((a,b)=>ORDER.indexOf(a.replace(/ (Cast|Extras)$/,""))-ORDER.indexOf(b.replace(/ (Cast|Extras)$/,"")));if(!e.name)e.name=e.kinds.join(" · ");return Object.assign(e,{no:e.kinds.join(" · ")})}))}
/* short code of a place for the call list: L1, L2, Base, P1 … */
function csShort(p){const n=String(p&&p.name||"");let m=n.match(/^Set\s*(\w+)/i);if(m)return "L"+m[1];if(/base|lunch|hermitage/i.test(n))return "Base";m=n.match(/park\w*\s*loc\.?\s*(\d+)/i);if(m)return "P"+m[1];m=n.match(/loc\.?\s*(\d+)/i);if(m)return "L"+m[1];return n.split(/[ ,·]/)[0].slice(0,8)}
/* is this department mine? words of my call's department and of my profile (Assistant Directors ~ AD/Regie, Camera ~ Kamera …) */
const CSDSYN=[["ad","regie","directors","direction"],["camera","kamera","cam"],["sound","ton"],["light","licht","electric","gaffer"],["grip","grips","buhne"],["costume","kostum","wardrobe"],["makeup","maske","make","hair"],["production","produktion","prod"],["location","locations"],["art","ausstattung","props","requisite"],["catering","kuche"],["transport","fahrer","driver"],["script","continuity"]];
function csDWords(t){const w=fold(String(t||"")).split(/[^a-z0-9]+/).filter(x=>x.length>1&&!["and","und","the","de","of"].includes(x));const out=new Set(w);for(const g of CSDSYN)if(w.some(x=>g.includes(x)))g.forEach(x=>out.add(x));return out}
function csMyDept(c,me,dept){if(!me)return false;const call=csA(c.calls).find(r=>me.hit(r.name));const mine=new Set([...csDWords(call&&call.dept),...csDWords(me.dep)]);
  const w=csDWords(dept);for(const x of w)if(x.length>2&&mine.has(x)||x==="ad"&&mine.has("ad"))return true;return false}
const CSMINEMEMO=new WeakMap();function csMine(c,me){if(!c||!me)return[];let m=CSMINEMEMO.get(c);if(!m)CSMINEMEMO.set(c,m=new Map());const k=me.name+"|"+me.dep+"|"+(typeof LANG!=="undefined"?LANG:"")+"|"+vok("phone")+"|"+(window.REDVER||0);if(!m.has(k))m.set(k,csMine0(c,me));return m.get(k).slice()}
/* the destination of a ride as a map link (the place of the callsheet, else a map search) */
function csToLink(c,to){const t0=String(to||"").trim();if(!t0)return"";const um=t0.match(/https?:\/\/\S+/);const t=t0.replace(/https?:\/\/\S+/g,"").trim()||L("Karte");
  if(um&&t===L("Karte"))return '<a class="csadl" href="'+esc(safeUrl(um[0]))+'" target="_blank" rel="noopener noreferrer"><span>'+esc(t)+'</span></a>';let pl=null;try{pl=csPlace(c,t)}catch(_){}
  const u=(pl&&pl.map)||csMapQ(t);return '<a class="csadl" href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer"><span>'+esc(t)+'</span></a>'}
function csMine0(c,me){const mine=[];
  const call=csA(c.calls).find(r=>me.hit(r.name));if(call){const pl=csCallPlace(c,me,call);
    mine.push('<div class="csme-r"><span class="k">'+esc(L("Mein Call"))+'</span><b>'+esc(call.t||"")+'</b> <small>'+esc([call.role,call.dept].filter(Boolean).join(" · "))+'</small></div>'+
      (pl?'<div class="csme-r"><span class="k">'+esc(L("Call-Ort"))+'</span>'+(pl.map?'<a class="cscallpl" href="'+esc(safeUrl(pl.map))+'" target="_blank" rel="noopener noreferrer"><b>'+esc(pl.name)+'</b></a>':'<b>'+esc(pl.name)+'</b>')+(pl.how?' <small>'+esc(pl.how)+'</small>':'')+'</div>':''))}
  const cast=csA(c.cast).find(r=>me.hit(r.actor));if(cast)mine.push('<div class="csme-r"><span class="k">Cast</span>'+esc([cast.role,cast.pickup&&"P/UP "+cast.pickup,cast.call&&"Call "+cast.call,cast.onset&&"Set "+cast.onset].filter(Boolean).map(csDurT).join(" · "))+'</div>');
  /* pickup: the first ride of the day (time and place first) */
  {const rides=csA(c.transport).filter(r=>me.hit(r.passengers)||me.hit(r.driver)).concat(csA(c.crewTransport).filter(r=>me.hit(r.people))).filter(r=>hm(r.t1)).sort((a,b)=>hm(a.t1).localeCompare(hm(b.t1)));
   var pu=rides[0];if(pu&&!(cast&&cast.pickup))mine.splice(1,0,'<div class="csme-r"><span class="k">Pickup</span><b>'+esc(hm(pu.t1))+'</b> '+esc(pu.from||"")+(pu.to?' → '+csToLink(c,pu.to)+(pu.t2?" "+esc(pu.t2):""):'')+' <small>'+esc([pu.vehicle,pu.driver].filter(Boolean).join(" · "))+'</small></div>');else pu=null}
  /* the other rides (the pickup ride is already shown above) */
  for(const r of csA(c.transport).filter(r=>(me.hit(r.passengers)||me.hit(r.driver))&&r!==pu))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+csToLink(c,r.to)+(r.t2?" "+esc(r.t2):"")+' <small>'+esc([r.vehicle,r.driver].filter(Boolean).join(" · "))+'</small></div>');
  for(const r of csA(c.crewTransport).filter(r=>me.hit(r.people)&&r!==pu))mine.push('<div class="csme-r"><span class="k">'+esc(L("Fahrt"))+'</span>'+esc([r.from,r.t1].filter(Boolean).join(" "))+' → '+csToLink(c,r.to)+(r.t2?" "+esc(r.t2):"")+' <small>'+esc(r.vehicle||"")+'</small></div>');
  for(const r of csA(c.travel).filter(r=>me.hit(r.name)&&(!r.date||!c._date||r.date===c._date)))mine.push('<div class="csme-r"><span class="k">'+esc(L("Anreise"))+'</span>'+esc([r.how,r.from,r.t1].filter(Boolean).join(" "))+' → '+csToLink(c,r.to)+(r.t2?" "+esc(r.t2):"")+'</div>');
  {let first=true;for(const r of csA(c.depts).filter(r=>csMyDept(c,me,r.dept)&&String(r.text||"").trim())){const lab=first?esc(L("Abteilung")):"";first=false;mine.push('<div class="csme-r"><span class="k">'+lab+'</span><b>'+esc(r.dept||"")+'</b> '+csTx(r.text)+'</div>');}}
  /* value in its own span (label | value side by side on the phone) */
  return mine.map(x=>x.replace(/<div class="csme-r"><span class="k">(.*?)<\/span>(.*?)<\/div>/g,'<div class="csme-r"><span class="k">$1</span><span class="v">$2</span></div>'))}
/* the time tiles of a callsheet day (Crew Call … Wrap, sun, weather, drive to my call place) – callsheet and Today */
function csTilesHTML(x,day,c,me){const t=c.times||{};
  const tile=(k,v,big)=>v?'<div class="dt'+(big?' big':'')+'"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>':'';
  return '<div class="dtiles cstiles" id="cs-zeiten">'+tile("Crew Call",t.crewCall||x.crewCall,true)+tile("Rehearsal",t.rehearsal)+tile("RTS",t.rts||x.shootCall)+tile("Lunch",t.lunch)+tile("Wrap",t.wrap||x.wrap)+
    (()=>{const a=c.sunrise||x.sr,b=c.sunset||x.ss;return a&&b?'<div class="dt cssunt"><div class="k">'+esc(L("Sonne"))+'</div><div class="v">'+esc(a)+'<span class="sd">–</span><br>'+esc(b)+'</div></div>':''})()+(typeof wxTile==="function"&&day&&day.date&&wxTile(day)?'<div class="dt cswx">'+wxTile(day)+'</div>':tile(L("Wetter"),[c.weather,c.temp].filter(Boolean).join(" · ")).replace('class="dt"','class="dt wide"'))
    /* drive to my call place: route from the hotel or from where I am */
    +(()=>{if(!me)return"";const call=csA(c.calls).find(r=>me.hit(r.name));let pl=null;try{pl=call?csCallPlace(c,me,call):null}catch(_){}/* no sure call place (no call or no ride): the way to the Base of the day, else to location 1 – marked as such */
      if(!pl){const ls=csLocs(c),b=ls.find(l=>l.kinds&&l.kinds.includes("Base"))||ls.find(l=>!l.kinds);if(!b)return"";let ad="";try{ad=csLocAddr(c,b,x.date)}catch(_){}
        pl={name:ad||b.name||"",map:b.map||"",fbk:b.kinds?"Base":"L"+String(b.no||"").trim(),fbn:String(b.name||"")}}
      const to=(String(pl.name||"").replace(/^[^:]*:\s*/,"").replace(/^Set\s*\w+\s*·\s*/,"")).trim();if(!to&&!pl.map)return"";if(!to)return '<a class="dt csdrv" href="'+esc(safeUrl(pl.map))+'" target="_blank" rel="noopener noreferrer"><div class="k">'+esc(L("Anfahrt"))+(pl.fbk?' '+esc(pl.fbk):'')+'</div><div class="v">'+esc(L("Karte"))+' ›</div></a>';
      const from=(day&&day.drive&&day.drive.from)||"Hotel",enc=encodeURIComponent,url="https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+enc(from)+"&destination="+enc(to),here="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination="+enc(to);
      return '<button type="button" class="dt csdrv" data-route="'+esc(JSON.stringify({h:url,c:here,from,to}))+'" title="'+esc(L("Route in Google Maps"))+'"><div class="k">'+esc(L("Anfahrt"))+(pl.fbk?' '+esc(pl.fbk):'')+'</div><div class="v">'+esc((()=>{if(pl.fbk)return pl.fbn.slice(0,18)||L("Route");const nm=String(pl.name||"");return /^Set\s/i.test(nm)?csShort(pl):(nm.replace(/^[^·]*·\s*/,"").replace(/^[^:]*:\s*/,"").trim().slice(0,18)||L("Route"))})())+' ›</div></button>'})()+'</div>';}
/* parts of the callsheet (each one a folded section; c = callsheet, x = day of the dispo, me = me, SU = sums of the folded parts, t = times) */
function csJumpBar(c,x,me,SU,t){let JB="";
  {const has=k=>({loc:csA(c.locations).length,order:csA((c.order||{}).rows).length,cast:csA(c.cast).length,trans:csA(c.transport).length||csA(c.crewTransport).length||csA(c.travel).length,dept:csA(c.depts).some(r=>String(r.text||"").trim()),calls:csA(c.calls).length})[k];
   const J=[["loc","Locations","pin",L("Orte")],["order",L("Drehfolge"),"film",L("Szenen")],["cast","Cast","cast"],["trans","Transport","car",L("Fahrten")],["dept",L("Infos nach Abteilung"),"dept",L("Infos")],["calls","Calls","calls"]].filter(([k])=>has(k));
   /* icons with a tiny label; the search opens from the magnifier (keeps the bar one line high) */
   JB='<div class="csjump"><div class="csjb">'+J.map(([k,l,i,sh])=>'<button type="button" data-csj="'+k+'" aria-label="'+esc(l)+'" title="'+esc(l)+'">'+CSI[i]+'<span>'+esc(sh||l)+'</span></button>').join("")+
     '<button type="button" class="csqb" data-csqb aria-label="'+esc(L("Suchen"))+'" title="'+esc(L("Suchen"))+'">'+CSI.search+'<span>'+esc(L("Suchen"))+'</span></button>'+
     /* only what concerns me (my name, my scenes as cast, my department) */
     (me?'<button type="button" class="csmineb" data-csmine aria-pressed="'+(CSMINE?"true":"false")+'" aria-label="'+esc(L("Nur meins"))+'" title="'+esc(L("Nur meins"))+'">'+CSI.me+'<span>'+esc(L("Nur meins"))+'</span></button>':'')+
     /* the original callsheet: its pages in the app, else the PDF in the Dropbox */
     (arr(x.pg).length&&typeof window.blkImg==="function"?'<button type="button" data-cspg="'+esc(x.date)+'" aria-label="'+esc(L("Original-Callsheet ansehen"))+'" title="'+esc(L("Original-Callsheet ansehen"))+'">'+CSI.doc+'<span>PDF</span></button>':
      x.link?'<button type="button" data-cspdf="'+esc(safeUrl(x.link))+'" aria-label="'+esc(L("In Dropbox öffnen"))+'" title="'+esc(L("In Dropbox öffnen"))+'">'+CSI.doc+'<span>PDF</span></button>':'')+'</div><input id="csq" type="search" autocomplete="off" hidden placeholder="'+esc(L("Suchen: Name, Szene, Fahrzeug …"))+'"></div>'}
  return JB}
function csSums(c){  const SU={};{const sm=a=>{a=a.filter(x=>x&&x[1]!==""&&x[1]!=null&&x[1]!==0);return a.length?'<span class="cscount">'+a.map(([k,v])=>'<span><b>'+esc(String(v))+'</b> '+esc(k)+'</span>').join("")+'</span>':''};
    const uniq=l=>new Set(l.map(x=>fold(String(x||"")).trim()).filter(Boolean)).size;
    const ls=csLocs(c);SU.loc=sm([["Sets",ls.filter(l=>!l.kinds).length],[L("weitere Orte"),ls.filter(l=>l.kinds).length]]);
    {const nos=csA(c.cast).map(r=>String(r.no||"").trim()).filter(Boolean).sort((a,b)=>(parseInt(a,10)||0)-(parseInt(b,10)||0)||a.localeCompare(b));
     SU.cast=nos.length?'<span class="cscount csnos">'+nos.map(n=>'<span class="csno">'+esc(n)+'</span>').join("")+'</span>':''}
    SU.travel=sm([[L("Personen"),csA(c.travel).filter(r=>!r.date||!c._date||r.date===c._date).length]]);
    SU.extras=sm([[L("Komparsen"),csA(c.extras).reduce((a,r)=>a+(parseInt(r.count,10)||0),0)],[L("Gruppen"),csA(c.extras).length]]);
    SU.veh=sm([[L("Fahrzeuge"),csA(c.vehicles).length]]);
    SU.trans=sm([[L("Fahrten"),csA(c.transport).length],[L("Fahrzeuge"),uniq(csA(c.transport).map(r=>r.vehicle))],[L("Fahrer"),uniq(csA(c.transport).map(r=>r.driver))]]);
    SU.ctrans=sm([[L("Fahrten"),csA(c.crewTransport).length],[L("Fahrzeuge"),uniq(csA(c.crewTransport).map(r=>r.vehicle))]]);
    SU.dept=sm([[L("Abteilungen"),csA(c.depts).filter(r=>String(r.text||"").trim()).length]]);
    SU.calls=sm([[L("Personen"),uniq(csA(c.calls).map(r=>r.name))],[L("Abteilungen"),uniq(csA(c.calls).map(r=>r.dept))]]);
    SU.notes=sm([[L("Notizen"),csA(c.notes).length]])}
  return SU}
function csCountLine(c,x,me,SU,t){  let csCnt="";{const nCast=csA(c.cast).length,nCrew=new Set(csA(c.calls).map(r=>nmk(String(r.name||""))).filter(Boolean)).size,nEx=csA(c.extras).reduce((a,r)=>a+(parseInt(r.count,10)||0),0);
   /* the callsheet's own totals line («TOTAL: 62 || CREW: 46 CAST: 11 EXTRAS: 0 ZUSATZ: 5») wins over counting rows */
   const tl=String(c.total||"")+" "+csA(c.notes).join(" ");const g=re=>{const m=tl.match(re);return m?+m[1]:null};
   const T={tot:g(/TOTAL:?\s*(\d+)/i),crew:g(/CREW:?\s*(\d+)/i),cast:g(/CAST:?\s*(\d+)/i),ex:g(/EXTRAS:?\s*(\d+)/i),zu:g(/ZUSATZ:?\s*(\d+)/i)};
   /* the cast as listed; when the totals line says something else, its number as a hint (the document contradicts itself) */
   const castV=T.cast!=null&&nCast&&T.cast!==nCast?nCast+'<small class="cshint" title="'+esc(L("laut Totalzeile des Callsheets"))+'"> ('+esc(L("laut Callsheet"))+' '+T.cast+')</small>':(T.cast!=null?T.cast:nCast);
   const parts=T.tot!=null?[["Cast",castV],["Crew",T.crew],[L("Komparsen"),T.ex],[L("Zusatz"),T.zu],["Total",T.tot]]:[["Cast",nCast],["Crew",nCrew],[L("Komparsen"),nEx],["Total",nCast+nCrew+nEx]];
   const pp=parts.filter(x=>x[1]);csCnt=pp.length?'<div class="cscount">'+pp.map(([k,v])=>'<span><b>'+(typeof v==="string"&&/</.test(v)?v:esc(String(v)))+'</b> '+esc(k)+'</span>').join("")+'</div>':''}
  return csCnt}
function csTeamSec(c,x,me,SU,t){const csCnt=csCountLine(c,x,me,SU,t);let h="";
  h+=csSec(L("Team des Tages"),csA(c.key).length||c.office||csCnt?'<div class="cskey">'+(c.office?'<div><span class="k">'+esc(L("Produktionsbüro"))+'</span>'+csTx(c.office)+'</div>':'')+csA(c.key).map(k=>{const tel=String(k.phone||"").replace(/[^\d+]/g,"");
      /* the name is the call link (with the phone right) */
      return '<div><span class="k">'+esc(k.role||"")+'</span>'+(tel.length>6&&vok("phone")?'<a class="csct" href="tel:'+esc(tel)+'" title="'+esc(k.phone)+'">'+CSI.phone+esc(k.name||k.phone)+'</a>':'<span>'+esc(k.name||"")+(tel&&!vok("phone")?' '+csTx(k.phone):'')+'</span>')+'</div>'}).join("")+'</div>'+
    csA(c.lists).map(l=>'<p class="cslist"><b>'+esc(l.title||"")+'</b> '+esc(csS(l.names))+'</p>').join(""):"",false,"","team",csCnt);
  return h}
function csLocSec(c,x,me,SU,t){let h="";
  {const ls=csLocs(c),SEENAD=new Map(),NOW=csNowLoc(c,x.date,ls);const NEAR=csNear(c,ls,x.date);window.CSNOWK=NOW?NOW.no+'|'+NOW.name:'';
   const LG=csLocGroups(c,ls,x.date),mem=l=>l._m||[l];
   h+=csSec("Locations",LG.length?LG.map(l=>{let LAD=csLocAddr(c,l,x.date);let DN=l.name||"";
     /* a side place named by its address only: the kinds as its name, the address in the second line */
     {const w=t=>fold(String(t||"")).replace(/[^a-z0-9]/g,"");
      /* a side place: the title is its kind (Base, else the first kind, e.g. «WHM Extras»), the second line its name and address («Restaurant Hermitage, Pfynstrasse 160, 3952 Susten») */
      if(l.kinds){const isA=/\d{4}\s+\p{L}/u.test(DN),nm=isA?"":DN;const ad=LAD&&!(isA&&w(LAD)!==w(DN)&&!w(LAD).startsWith(w(DN)))?LAD:(isA?DN:LAD);
        LAD=[nm&&!w(ad).includes(w(nm))?nm:"",ad].filter(Boolean).join(", ");DN=l.kinds.includes("Base")?"Base":csKindCode(l.kinds[0])}
      else if(LAD&&w(DN).length>5&&w(LAD).startsWith(w(DN)))LAD=""}const code=l.kinds?l.kinds.map(csKindCode).join("·"):l._codes?l._codes.join("·"):(l.no?"L"+String(l.no).trim():"");const isNow=mem(l).includes(NOW);const HN=csA(l.notes).map(String).filter(n=>CSHN_RE.test(n.trim()));return '<details class="dbox csloc'+(isNow?' csnowloc':'')+'"><summary><div class="csl1">'+(code&&!l._m?csPlaceH(csBadgeIn(l,l._codes),csLocHref(l,c,x.date),l.kinds?l.no:code+' · Set','csloc-c '+(l.kinds?'csbase':'csmot')):'')+(l._m?'<span class="dn csmset">'+l._m.map(m=>'<span><b class="csplace csmot">L'+esc(String(m.no||"").trim())+'</b> '+esc(m.name||"")+'</span>').join("")+'</span>':'<span class="dn">'+esc(DN)+'</span>')+'<span class="csloc-i">'+[...new Set(mem(l).map(m=>csLocFp(c,m,x.date,true)))].join("")+csHnBtns(HN)+(LAD?'':csMap(l.map))+CSEXP.replace('class="csexp"','class="csexp sm"')+'</span></div>'+(LAD&&SEENAD.has(fold(LAD))?'<span class="csaddr cssame">'+esc(L("Adresse wie"))+' '+esc(SEENAD.get(fold(LAD)))+'</span>':'')+(LAD&&!SEENAD.has(fold(LAD))&&SEENAD.set(fold(LAD),code||l.name)?'<a class="csaddr" href="'+esc(safeUrl(l.map||csMapQ(LAD)))+'" title="'+esc(LAD)+'" target="_blank" rel="noopener noreferrer" data-nobub="1">'+esc(LAD)+'</a>':'')+(()=>{const mine=csA((c.order||{}).rows).filter(r=>r.sc&&mem(l).some(m=>csSceneLoc([m],r)===m)).map(r=>String(r.sc));const uniq=[...new Set(mine)];
       return uniq.length?'<span class="csloc-s">'+uniq.map(x=>'<button type="button" class="cssc" data-cssc="'+esc(x)+'">'+esc(x)+'</button>').join("")+'</span>':(l.scenes?'<small class="csloc-s">'+esc(csS(l.scenes))+'</small>':'')})()+csHnTexts(HN)+'</summary>'+
     (l.kinds?'':csNearHTML([].concat(...mem(l).map(m=>NEAR.get(m)||[])).filter((p,i,a)=>a.findIndex(y=>y.code===p.code&&y.u===p.u)===i).sort((a,b)=>a.d-b.d)))+(()=>{/* the address of the head only once: lines that only repeat it (also written differently) are left out, a place there shows «same address» */
       const an=t=>fold(String(t||"")).replace(/https?:\/\/\S+/g,"").replace(/[^a-z0-9]/g,""),km=String(LAD||"").match(/[^\d,]*?[a-zäöüéèà.]{3,}\s*\d+[a-z]?\b/i),K=km?an(km[0]):"";
       const same=t=>!!K&&K.length>5&&an(t).includes(K),only=t=>same(t)&&an(t).length<=an(LAD).length+4;
       return csA(l.notes).filter(n=>!HN.includes(String(n))).filter(n=>!LAD||(!fold(LAD).includes(fold(csL(n)))&&!only(csL(n)))).map(n=>'<div class="ds">'+csAdr(csL(n),"")+'</div>').join("")+
         csA(l.items).filter(i=>String(i.text||"").trim()||i.map).filter(i=>!LAD||fold(String(i.text||"")).trim()!==fold(LAD).trim()).map(i=>'<div class="ds"><b>'+esc(csL(i.label||""))+'</b> '+(only(csL(i.text||""))?(i.map?'<a href="'+esc(safeUrl(i.map))+'" target="_blank" rel="noopener noreferrer">'+esc(L("gleiche Adresse"))+'</a>':esc(L("gleiche Adresse"))):csAdr(csL(i.text||""),i.map,csL(i.label||"")))+'</div>').join("")})()+'</details>'}).join(""):"",true,"","loc","")}
  return h}
function csMapSec(c,x,me,SU,t){if(window.CSMAPON===false)return"";   /* switched off in the app settings */let h="";
  {const geo=c.geo||{},gs=c.geoSrc||{},pts=[],miss=[];const all=csA((c.order||{}).rows),rows=all.filter(r=>r.sc);
   /* scene with start and end (= start of the next row of the shooting order) for the popup of a place */
   const span=r=>{const i=all.indexOf(r),a=hm(r.t),nx=all.slice(i+1).find(y=>hm(y.t));return [String(r.sc),a?a+(nx?"–"+hm(nx.t):""):""]};
   const add=(u,code,name,sc,minor,link)=>{const g=geo[u];link=link||(/^https?:/.test(u||"")?u:"");if(!g||!Array.isArray(g)){if(!minor&&u&&!miss.some(x=>x.c===code))miss.push({c:code,n:name,s:sc||"",u:link,set:!minor});return}if(pts.some(x=>x.c===code&&x.p.join(",")===g.join(",")))return;
     pts.push({p:g,c:code,n:name,s:sc||"",u:link,m:minor?1:0,r:gs[u]==="rough"||gs[u]==="near"?(gs[u]==="near"?2:1):0})};
   let si=0;const BH=new Map();for(const l of csLocs(c)){const code=l.kinds?l.kinds.map(csKindCode).join("·"):"L"+String(l.no||"").trim();BH.set(code,csBadgeIn(l));
     /* a set without its own map link: its position under «loc:n» (address found by the updater) – every L is on the map */
     const key=l.kinds?l.map:csSetGeo(c,l)[0];
     const lr=l.kinds?[]:rows.filter(r=>csSceneLoc([l],r)===l);const sc=l.kinds?"":[...new Set(lr.map(r=>String(r.sc)))].join(", ")||csS(l.scenes);add(key,code,l.name||"",sc,0,csLocHref(l,c,x.date));
     {const pt=pts.find(x=>x.u===key&&x.c===code);if(pt&&lr.length)pt.st=lr.map(span)}
     for(const i of csA(l.items))if(i.map)add(i.map,code+" · "+(String(i.label||"").trim()||"P"),[i.label,i.text].filter(Boolean).join(" · "),"",1)}
   /* every L on the map: a set still without position (older data) roughly at the first place of the day, marked */
   {const at=(pts.find(p=>!p.m)||pts[0]||{}).p;if(at)for(const m of miss.filter(m=>m.set&&/^L/.test(m.c))){pts.push({p:at,c:m.c,n:m.n,s:m.s,u:m.u,m:0,r:2});miss.splice(miss.indexOf(m),1)}}
   /* bases with their icons on the map (sets keep their code L1 …) */
   for(const p of pts)if(!p.m&&!/^L/.test(p.c)&&BH.has(p.c))p.h=BH.get(p.c);
   /* places at the same point: the labels are stacked */
   pts.forEach((p,i)=>{p.k=pts.slice(0,i).filter(x=>x.p.join(",")===p.p.join(",")).length});
   const main=pts.filter(p=>!p.m);
   if(pts.length)h+=csSec(L("Karte"),'<div class="csmapw"><button type="button" class="csmapbig" data-csmapbig aria-label="'+esc(L("Karte vergrössern"))+'" title="'+esc(L("Karte vergrössern"))+'">'+CSEXP+'</button><div class="csmap0" data-csmap="'+esc(JSON.stringify(pts))+'"></div>'+
     '<div class="csmapl">'+main.map(p=>'<button type="button" class="csmapgo" data-csmapgo="'+pts.indexOf(p)+'">'+(BH.has(p.c)?'<span class="csplace csbadge '+(/^L/.test(p.c)?'csmot':'csbase')+'">'+BH.get(p.c)+'</span>':'<span class="csplace">'+esc(p.c)+'</span>')+' '+esc(p.n)+(p.r?' <small class="csmapr">'+esc(L("ungefähr"))+'</small>':'')+'</button>').join("")+
     miss.map(p=>'<a class="csmapgo nopos" href="'+esc(safeUrl(p.u))+'" target="_blank" rel="noopener noreferrer"><span class="csplace">'+esc(p.c)+'</span> '+esc(p.n)+' <small class="csmapr">'+esc(L("ohne Position – Google Maps"))+'</small></a>').join("")+'</div></div>',
     false,"","karte",'<span class="cscount"><span><b>'+main.length+'</b> '+esc(L("Orte"))+'</span></span>')}
  return h}
function csTravelSec(c,x,me,SU,t){let h="";
  {const U=/(https?:\/\/[^\s<]+)/g;const clean=v=>String(v||"").replace(U,"").replace(/\s{2,}/g," ").trim();
   const badge=(txt,url)=>{let pl=null;try{pl=csPlace(c,clean(txt))}catch(_){}const code=pl?csShort(pl):"";const u=url||(pl&&pl.map)||"";if(!u)return code?csPlaceA(code,csCodeHref(code),pl&&pl.name):'';
     return '<a class="csplace" href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer" title="'+esc(pl&&pl.name||clean(txt)||L("Karte"))+'">'+esc(code||L("Karte"))+'</a>'};
   /* travel of another day (a second TRAVEL CAST part of the document): after the others, with its date */
   const other=r=>r.date&&x.date&&r.date!==x.date;const dlab=r=>{try{const d=new Date(r.date+"T12:00:00");return (typeof WDL==="function"?WDL(d)+" ":"")+r.date.slice(8,10)+"."+r.date.slice(5,7)+"."}catch(_){return r.date}};
   const rows=csA(c.travel).slice().sort((a,b)=>(other(a)?1:0)-(other(b)?1:0)).map(r=>{const urls=[r.from,r.to,r.note].join(" ").match(U)||[];
     return '<div class="cstrv'+(other(r)?' trvother':'')+'">'+(other(r)?'<span class="trvd">'+esc(dlab(r))+'</span>':'')+'<b>'+esc(r.name||"")+'</b>'+(r.how?'<small>'+esc(r.how)+'</small>':'')+'<span class="r">'+esc(csRoute(clean(r.from),r.t1,clean(r.to),r.t2))+'</span>'+badge(r.to,urls[0])+(clean(r.note)?'<small class="n">'+csTx(clean(r.note))+'</small>':'')+'</div>'}).join("");
   h+=csSec(L("Anreise Cast"),rows,false,"","travel",SU.travel)}
  return h}
function csCallsSec(c,x,me,SU,t){let h="";
  {const g=new Map();for(const r of csA(c.calls)){const k=r.dept||"";if(!g.has(k))g.set(k,[]);g.get(k).push(r)}
   h+=csSec("Calls on Set",[...g].map(([dp,l])=>'<div class="cscall"><div class="cscall-d">'+esc(dp)+'</div>'+l.map(r=>{const who={hit:t=>{const a=nmk(String(t||"")),b=nmk(String(r.name||""));return !!b&&a.includes(b)}};let pl=null;try{pl=csCallPlace(c,who,r)}catch(_){}
     const sc=pl?csShort(pl):"";const tag=sc?csPlaceA(sc,pl.map||csCodeHref(sc),pl.name):'';
     const tm=String(r.t||"").match(/^(\d{1,2}:\d{2})\s*(.*)$/);
     return '<div class="cscall-r'+(me&&me.hit(r.name)?' mine':'')+'"><span class="t">'+esc(tm?tm[1]:(r.t||""))+(tm&&tm[2]?'<i>'+esc(tm[2])+'</i>':'')+'</span><span class="cp">'+tag+'</span><span class="ccw"><b>'+esc(r.name||"")+'</b> <small>'+esc(r.role||"")+'</small></span></div>'}).join("")+'</div>').join(""),false,"","calls",SU.calls)}
  return h}
function renderCS(x,day){const c=x.cs||{},t=c.times||{},me=csMe();let h="";CSTR=c.tr||null;CSCUR={c,date:x.date||"",me};
  let JB="";
  /* jump bar (sticky) and search over the whole callsheet */
   JB=csJumpBar(c,x,me,null,t);
  /* head: as the top of the callsheet */
  const tile=(k,v,big)=>v?'<div class="dt'+(big?' big':'')+'"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>':'';
  /* with «my day»: its red box carries the title (Mein Drehtag 1 · date), no head line on top */
  const mineN=me?csMine(c,me).length:0;const dtitle=(mineN?esc(L("Mein"))+' ':'')+esc(x.label||day.label||"Callsheet");
  if(!mineN)h+='<div class="dsp-head"><div><h2>'+dtitle+'</h2><div class="date drow"><span>'+fmtDate(x.date)+'</span>'+UNITBAR+'</div></div></div>';
  else if(UNITBAR)h+='<div class="date drow dsp-units"><span></span>'+UNITBAR+'</div>';
  h+=csTilesHTML(x,day,c,me);
  /* contact on set: the name itself is the call link (only with the phone right) */
  if(c.contact&&(c.contact.name||c.contact.phone)){const ct=c.contact,tel=String(ct.phone||"").replace(/[^\d+]/g,""),nm=ct.name?esc(ct.name):csTx(ct.phone);
    /* one line, the size fitted to the width (csFitContact) */
    h+='<div class="cscontact"><span class="csct-in"><b>'+esc(L("Kontakt am Set"))+':</b> '+(tel&&vok("phone")?'<a class="csct" href="tel:'+esc(tel)+'" title="'+esc(L("Anrufen"))+'">'+CSI.phone+nm+'</a>':nm)+(ct.role?' <small>· '+esc(ct.role)+'</small>':'')+'</span></div>'}
  /* radio channels below the contact: one chip per channel («1 AD / AL», «2 Chat» …) */
  h+=csRadioHTML(c.radio);
  /* my day */
  if(me){const mine=csMine(c,me);if(mine.length)h+='<section class="dsec csme" id="cs-mein" aria-label="'+esc(L("Mein Tag")+" · "+me.name)+'"><h2 class="csme-h">'+dtitle+' <span>'+fmtDate(x.date)+'</span></h2>'+mine.join("")+'</section>'}
  /* key people of the day */
  /* folded parts: sums and short facts in one line */
   const SU=csSums(c);
   h+=csTeamSec(c,x,me,SU,t);
  /* locations */
  /* locations: each one folds (name and map always visible), a button opens or closes all */
   h+=csLocSec(c,x,me,SU,t);
  /* map of the day: every location on its own (code, scenes, name), parking and other points of the sets small */
   h+=csMapSec(c,x,me,SU,t);
  /* production information */
  h+=csSec(L("Produktionsinfos"),csA(c.info).map(p=>'<p>'+csTx(csL(p))+'</p>').join(""),true,"csinfo");
  /* shooting order */
  const o=c.order||{};
  {const sc=csA(o.rows).filter(r=>r.sc).map(r=>String(r.sc)),ch=(k,v)=>v?'<span class="csoc"><i>'+esc(k)+'</i>'+esc(v)+'</span>':'';
   /* folded: Call · Probe · RTS · scenes · Lunch · Wrap in one short line */
   const sumx='<span class="csosum">'+ch("Call",t.crewCall||x.crewCall)+ch(L("Probe"),t.rehearsal)+ch("RTS",t.rts||x.shootCall)+(sc.length?ch(sc.length+" "+L("Szenen"),sc.length>1?sc[0]+"–"+sc[sc.length-1]:sc[0]):"")+ch("Lunch",t.lunch)+ch("Wrap",t.wrap||x.wrap)+'</span>'+
     (sc.length?'<span class="csoscn">'+(()=>{const LS=csLocs(c);return csA(o.rows).filter(r=>r.sc).map(r=>{const lo=csSceneLoc(LS,r);
       /* one line per scene: time · scene · I/E · set code · set · duration */
       return '<span class="cso1"><i>'+esc(hm(r.t)||"")+'</i><b>'+esc(String(r.sc))+'</b>'+(r.ie?'<span class="ie '+(typeof ieClass==="function"?ieClass(r.ie):"")+'">'+esc(r.ie)+'</span>':'')+(lo?csPlaceA('L'+String(lo.no).trim(),csLocHref(lo),lo.name||""):'')+'<span class="st">'+esc(r.set||"")+'</span>'+(r.dur?'<span class="du">'+esc(r.dur)+'</span>':'')+'</span>'}).join("")})()+'</span>':'');
   h+=csSec(L("Drehfolge")+(o.pages?' · '+o.pages+' pgs':''),(o.title?'<p class="ghint">'+esc(o.title)+'</p>':'')+csOrderRows(o.rows,x.date,csLocs(c),true),false,"","order",sumx)}
  /* cast, extras, vehicles */
  const CC=csCols();
  h+=csSec("Cast",(csA(c.cast).length?'<span class="cscols">'+[["role",L("Rolle")],["actor",L("Darsteller")]].map(([k,t])=>'<button type="button" class="cscol" data-cscol="'+k+'" aria-pressed="'+!CC.has(k)+'">'+esc(t)+'</button>').join("")+'</span>':'')+(csA(c.cast).length?'<button type="button" class="lnk cstview" data-cstview>'+(csCastMode()?CSI.cards:CSI.table)+'<span>'+esc(L(csCastMode()?"Als Kacheln":"Als Tabelle"))+'</span></button>':'')+csTable(["#",L("Rolle"),L("Darsteller"),"P/UP","Call",L("Kostüm"),L("Maske"),"Base","On set"],csA(c.cast).map(r=>[r.no,r.role,r.actor,r.pickup,r.call,csMk(r.wardrobe,c)||csDurT(r.wardrobe),csMk(r.makeup,c),r.base,r.onset]),3),false,(csCastMode()?"cs-astbl":"")+(CC.has("role")?" hide-role":"")+(CC.has("actor")?" hide-actor":""),"cast",SU.cast);
  /* travel of the cast: one line per person (name · how · from → to · note), the place as short code (L1, Base …) with the map */
   h+=csTravelSec(c,x,me,SU,t);
  h+=csSec(L("Komparsen"),csTable(["#",L("Rolle"),"Call",L("Kostüm"),L("Maske"),"On set"],csA(c.extras).map(r=>[r.count,r.part,r.call,r.wardrobe,r.makeup,r.onset])),false,"","",SU.extras);
  h+=csSec(L("Fahrzeuge"),csTable([L("Fahrzeug"),"Via","Call","RTS"],csA(c.vehicles).map(r=>[r.name,r.via,r.call,r.rts])),false,"","",SU.veh);
  /* transport and travel */
  h+=csSec(L("Transport mit Fahrer"),csTvBtn("trans")+(c.drivers?'<div class="csdrvl">'+String(c.drivers).replace(/o\.\s*p\.\s*D\.?\s*=\s*on personal decision/i,"").split(/\s*[|\n;]\s*/).filter(x=>x.trim()).map(x=>{const m=x.match(CSPH);let nm=m?x.replace(m[0],"").trim():x.trim();
      /* a number without a name (forgotten on the callsheet): the name from other callsheets or the crew list with that number */
      if(!nm&&m)nm=csDriverByPhone(m[0]);
     return '<div class="csdrv-r"><span>'+esc(nm)+'</span>'+(m?csTx(m[0]):'')+'</div>'}).join("")+'</div>':'')+csTable([L("Fahrt"),L("Fahrzeug"),L("Fahrer"),L("Mitfahrende")],csA(c.transport).map(r=>[csRideCell(x.date,r),r.vehicle,r.driver,r.passengers]),1),false,csTvCls("trans"),"trans",SU.trans);
  /* information by department */
  h+=csSec(L("Transport Crew"),csTvBtn("ctrans")+csTable([L("Fahrzeug"),L("Fahrt"),L("Personen")],csA(c.crewTransport).map(r=>[r.vehicle,csRoute(r.from,r.t1,r.to,r.t2),r.people])   /* crew transport: no confirmation */,1),false,csTvCls("ctrans"),"ctrans",SU.ctrans);
  h+=csSec(L("Infos nach Abteilung"),csA(c.depts).filter(r=>String(r.text||"").trim()).map(r=>'<div class="csdep'+(csMyDept(c,me,r.dept)?' mine':'')+'"><div class="csdep-h">'+esc(r.dept||"")+'</div><div class="csdep-t">'+csTx(r.text)+'</div></div>').join(""),false,"","dept",SU.dept);
  /* the preview (PREVISION) is shown only on the next day (csPrevHTML) */
  /* calls on set */
  /* calls on set: by department, one short line per person (time · name · job) */
   h+=csCallsSec(c,x,me,SU,t);
  /* totals, notes, radio */
  const nb=[c.total?'<p><b>'+esc(c.total)+'</b></p>':'',...csA(c.notes).map(n=>'<p>'+csTx(n)+'</p>'),''].join("");
  h+=csSec(L("Notizen"),nb,false,"","",SU.notes);
  /* emergency (hospital) when the callsheet has it */
  if(x.hospital&&(x.hospital.name||x.hospital.phone))h+='<section class="dsec"><h3 class="dh">'+L('Notfall')+'</h3><div class="people"><div class="p"><div class="hd"><span class="nm">'+esc(x.hospital.name||L("Spital"))+'</span><span class="role">'+L('Nächstes Spital')+'</span></div>'+(x.hospital.address?'<div class="ct"><a href="'+maps([x.hospital.name,x.hospital.address].filter(Boolean).join(", "))+'" target="_blank" rel="noopener noreferrer">'+esc(x.hospital.address)+'</a></div>':'')+(x.hospital.phone?'<div class="ct"><a class="hosp" href="tel:'+esc(String(x.hospital.phone).replace(/\s/g,""))+'"><span>'+esc(x.hospital.phone)+'</span></a></div>':'')+'</div></div></section>';
  /* anything else of the document */
  for(const sec of csA(x.sections).concat(csA(c.sections))){const rows=csA(sec&&sec.rows).map(r=>Array.isArray(r)?r:[r]).filter(r=>r.some(cc=>String(cc==null?"":cc).trim()));if(!rows.length)continue;
    h+=csSec(String(sec.title||""),rows.map(r=>'<p>'+r.map(cc=>csTx(cc)).join(" · ")+'</p>').join(""),false)}
  /* on the shooting day: once per visit straight to the running row */
  if(x.date===todayISO()){window.__csScr=window.__csScr||{};if(!window.__csScr[x.date]){window.__csScr[x.date]=1;setTimeout(()=>{const n=document.querySelector(".csview .csorder li.now");if(n)n.scrollIntoView({block:"center",behavior:"smooth"})},400)}}
  return JB+'<div class="csview">'+h+'</div>'}
/* jump bar: open the part and go there */
document.addEventListener("click",e=>{const b=e.target.closest("[data-csj]");if(!b)return;const all=({trans:["trans","ctrans"]}[b.dataset.csj]||[b.dataset.csj]).map(k=>document.getElementById("cs-"+k)).filter(Boolean);const el=all[0]||document.getElementById("cs-travel");if(!el)return;/* only the chosen part open: the other open parts close (the production information stays) */
  document.querySelectorAll("#view details.cssec[open]").forEach(d=>{if(!all.includes(d)&&!d.classList.contains("csinfo"))d.open=false});
  all.forEach(d=>{if(d.tagName==="DETAILS")d.open=true});if(el.tagName==="DETAILS")el.open=true;el.scrollIntoView({block:"start",behavior:"smooth"})});
/* search in the callsheet and «Nur meins»: only matching rows, cards and lines; parts with a search hit open */
let CSMINE=false;try{CSMINE=localStorage.getItem("csmine:v1")==="1"}catch(_){}
const CSITEMS=".csorder>li,.cs-card,.cs-tbl tbody tr,.cscall-r,.csdep,.csloc,.cskey>div,.cslist,.csinfo p,.cstrv,.csdrv-r";
function csMineTest(){const me=CSCUR.me,c=CSCUR.c;if(!me||!c)return null;
  /* my scenes as cast: my number in the cast column of the shooting order */
  const no=(csA(c.cast).find(r=>me.hit(r.actor))||{}).no,sc=new Set();
  if(no)for(const r of csA((c.order||{}).rows))if(r.sc&&String(r.cast||"").split(/[^0-9a-z]+/i).includes(String(no).trim()))sc.add(String(r.sc));
  return it=>it.classList.contains("mine")||(it.matches(".csorder>li")?sc.has(it.dataset.sc||""):me.hit(it.textContent))}
function csFilter(v){v=v||document.querySelector("#view .csview");if(!v)return;const jb=v.previousElementSibling,inp=(jb&&jb.querySelector("#csq"))||document.getElementById("csq");
  const q=fold(String(inp&&inp.value||"").trim()),mt=CSMINE?csMineTest():null;v.classList.toggle("csmineon",!!mt);
  /* special characters and spellings do not matter (as in the app search) */
  const sq=x=>fold(x).replace(/ß/g,"ss").replace(/ae/g,"a").replace(/oe/g,"o").replace(/ue/g,"u").replace(/[^a-z0-9]/g,""),qs=sq(q),hit=t=>fold(t).includes(q)||(qs.length>1&&sq(t).includes(qs));
  /* locations and production information stay with «Nur meins» */
  v.querySelectorAll(CSITEMS).forEach(it=>{it.hidden=(!!q&&!hit(it.textContent))||(!!mt&&!it.matches(".csloc,.csinfo p")&&!mt(it))});
  v.querySelectorAll("details.cssec").forEach(d=>{const its=[...d.querySelectorAll(CSITEMS)];if(!q&&!mt){d.hidden=false;return}
    const vis=its.some(it=>!it.hidden);if(q){const ok=vis||hit(d.querySelector("summary").textContent);d.hidden=!ok;if(ok)d.open=true}else d.hidden=its.length>0&&!vis});
  v.querySelectorAll(".cscall").forEach(g=>{g.hidden=(!!q||!!mt)&&![...g.querySelectorAll(".cscall-r")].some(r=>!r.hidden)})}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="csq"){const jb=e.target.closest(".csjump"),nx=jb&&jb.nextElementSibling;csFilter(nx&&nx.classList.contains("csview")?nx:null)}});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-csmine],[data-cspdf]");if(!b)return;
  if(b.dataset.cspdf!=null){window.open(b.dataset.cspdf,"_blank","noopener");return}
  CSMINE=!CSMINE;try{localStorage.setItem("csmine:v1",CSMINE?"1":"0")}catch(_){}
  document.querySelectorAll("#view [data-csmine]").forEach(x=>x.setAttribute("aria-pressed",CSMINE?"true":"false"));document.querySelectorAll("#view .csview").forEach(v=>csFilter(v))});
/* after each drawing of the page: the filter again (the choice stays) */
{const v=document.getElementById("view");if(v)new MutationObserver(()=>{if(CSMINE)document.querySelectorAll("#view .csview").forEach(x=>csFilter(x))}).observe(v,{childList:true})}

/* preview (PREVISION) of a day from the callsheet of the shooting day before – shown on that day while its own callsheet is missing */
function csPrevFor(date){const sh=S.days.filter(d=>d.kind==="shoot").map(d=>d.date).sort();const i=sh.indexOf(date);if(i<1)return null;
  const prev=S.dispos.find(x=>x&&x.date===sh[i-1]&&x.cs&&x.cs.prevision&&csA(x.cs.prevision.rows).length);return prev?{from:prev,pv:prev.cs.prevision}:null}
function csPrevHTML(date){const p=csPrevFor(date);if(!p)return"";const ti=String(p.pv.title||"");
  /* «PREVISION - D2 Wednesday, 21st 2026 Extras: 12 Pages: 3 5/8 / Time Scree 03:30» → small tiles */
  const g=re=>{const m=ti.match(re);return m?m[1].trim():""};const ex=g(/Extras:\s*([\d]+)/i),pg=g(/Pages:\s*(\d+(?:\s+\d+\/\d+)?)/i),scr=g(/Time\s*Scree?n?\s*([\d:]+)/i);
  const rows=csA(p.pv.rows),first=rows.find(r=>hm(r.t)),scenes=rows.filter(r=>r.sc).length;
  const tile=(k,v)=>v?'<div class="dt"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>':'';
  return '<section class="dsec csprev"><h3 class="dh">'+esc(L("Vorschau"))+'</h3><p class="ghint">'+esc(L("aus dem Callsheet vom"))+' '+esc(fmtDate(p.from.date))+' · '+esc(L("Das eigene Callsheet folgt."))+'</p>'+
    '<div class="dtiles cstiles">'+tile(L("Beginn"),first?hm(first.t):"")+tile(cap(L("Szenen")),scenes?String(scenes):"")+tile("Pages",pg)+tile("Screen",scr)+tile(L("Komparsen"),ex)+'</div>'+csOrderRows(rows,date)+'</section>'}

/* open or close all locations */
/* search field opens from the magnifier */
document.addEventListener("click",e=>{const b=e.target.closest("[data-csqb]");if(!b)return;const q=document.getElementById("csq");if(!q)return;q.hidden=!q.hidden;b.setAttribute("aria-pressed",String(!q.hidden));if(!q.hidden)q.focus();else if(q.value){q.value="";q.dispatchEvent(new Event("input",{bubbles:true}))}});
/* cast: cards or table (remembered on this device) */
/* cast: always tiles when opened; «Als Tabelle» only until it is closed again */
let CSCASTT=false;function csCastMode(){return CSCASTT}
function csApplyCast(){const d=document.getElementById("cs-cast");if(!d)return;const t=csCastMode();d.classList.toggle("cs-astbl",t);const b=d.querySelector("[data-cstview]");
  if(b)b.innerHTML=(t?CSI.cards:CSI.table)+'<span>'+esc(L(t?"Als Kacheln":"Als Tabelle"))+'</span>'}
document.addEventListener("click",e=>{if(!e.target.closest("[data-cstview]"))return;CSCASTT=!CSCASTT;csApplyCast()});
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.id==="cs-cast"&&d.open&&CSCASTT){CSCASTT=false;csApplyCast()}},true);
document.addEventListener("click",e=>{const sm=e.target.closest("#cs-order>summary");if(!sm||e.target.closest("a,button"))return;const d=sm.parentElement;e.preventDefault();
  const st=!d.open?0:(d.dataset.all==="1"?2:1);const sc=d.querySelectorAll("details.csscd");
  if(st===0){d.open=true;d.dataset.all="0";sc.forEach(x=>x.open=false)}else if(st===1){d.dataset.all="1";sc.forEach(x=>x.open=true)}else{d.dataset.all="0";sc.forEach(x=>x.open=false);d.open=false}});
document.addEventListener("click",e=>{const sm=e.target.closest("#cs-loc>summary");if(!sm||e.target.closest("a"))return;e.preventDefault();const d=sm.parentElement;d.open=true;
  const ls=[...d.querySelectorAll("details.csloc")],all=ls.length&&ls.every(x=>x.open);ls.forEach(x=>x.open=!all);d.dataset.all=all?"0":"1"});
document.addEventListener("click",e=>{const b=e.target.closest("[data-cssc]");if(!b)return;e.preventDefault();e.stopPropagation();const sc=b.dataset.cssc;
  const od=document.getElementById("cs-order");if(!od)return;od.open=true;const li=[...od.querySelectorAll("li[data-sc]")].find(l=>l.dataset.sc===sc);if(!li)return;
  const d=li.querySelector("details.csscd");if(d)d.open=true;li.scrollIntoView({block:"center",behavior:"smooth"});li.classList.add("csflash");setTimeout(()=>li.classList.remove("csflash"),1600)},true);

/* the interactive map (Leaflet, loaded only when the map is opened; tiles from OpenStreetMap) */
let CSLF=null;function csLeaflet(){if(window.L&&window.L.map)return Promise.resolve(window.L);if(CSLF)return CSLF;
  CSLF=new Promise((ok,no)=>{const c=document.createElement("link");c.rel="stylesheet";c.href="leaflet.css";document.head.appendChild(c);
    const s=document.createElement("script");s.src="leaflet.js";s.onload=()=>ok(window.L);s.onerror=()=>{CSLF=null;no(new Error("leaflet"))};document.head.appendChild(s)});return CSLF}
function csMapInit(box){if(!box||box.__map)return;let pts=[];try{pts=JSON.parse(box.dataset.csmap||"[]")}catch(_){}if(!pts.length)return;
  csLeaflet().then(LF=>{if(box.__map||!box.isConnected)return;const m=LF.map(box,{scrollWheelZoom:false,tap:true});box.__map=m;
    /* map or satellite (switch bottom left) */
    const osm=LF.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(m);
    const sat=LF.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"Esri, Maxar, Earthstar Geographics"});
    LF.control.layers({[L("Karte")]:osm,[L("Satellit")]:sat},null,{position:"bottomleft"}).addTo(m);
    const b=[];box.__mk=[];for(const p of pts){const lab=p.h||esc(p.c);   /* only the code on the map, the scenes with their times in the popup */
      const mk=LF.marker(p.p,{icon:LF.divIcon({className:"csmk"+(p.h?" csmkb":"")+(p.m?" min":"")+(p.r?" rough":""),html:'<span style="--k:'+(p.k||0)+'">'+lab+"</span>",iconSize:null}),zIndexOffset:p.m?0:1000}).addTo(m);
      mk.bindPopup("<b>"+esc(p.c)+"</b> "+esc(p.n)+(p.st&&p.st.length?'<div class="csmpst">'+p.st.map(x=>'<div><span class="csmpsc">'+esc(x[0])+'</span> '+esc(x[1])+'</div>').join("")+'</div>':(p.s?"<br>"+esc(L("Szenen"))+": "+esc(p.s):""))+(p.r?"<br><i>"+esc(L(p.r===2?"Position ungefähr beim Set":"Position ungefähr"))+"</i>":"")+(p.u?'<br><a href="'+esc(safeUrl(p.u))+'" target="_blank" rel="noopener noreferrer">Google Maps</a>':""));box.__mk.push(mk);b.push(p.p)}
    box.__b=b;csMapFit(box)}).catch(()=>{box.innerHTML='<p class="ghint">'+esc(L("Karte nicht verfügbar (offline?)."))+'</p>'})}
/* all places of the day at one glance (also the small parking points); again after opening or enlarging (the size changed) */
function csMapFit(box){const m=box&&box.__map,b=box&&box.__b;if(!m||!b||!b.length)return;m.invalidateSize();
  if(b.length>1)m.fitBounds(b,{paddingTopLeft:[40,60],paddingBottomRight:[40,30],maxZoom:16});else m.setView(b[0],15)}
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.id==="cs-karte"&&d.open){const box=d.querySelector("[data-csmap]");if(box&&box.__map)setTimeout(()=>csMapFit(box),60);else csMapInit(box)}},true);
/* a location in the list below the map: show it on its own */
document.addEventListener("click",e=>{const b=e.target.closest("[data-csmapgo]");if(!b)return;const box=b.closest(".csmapw").querySelector("[data-csmap]");if(!box)return;
  const go=()=>{const m=box.__map,mk=box.__mk&&box.__mk[+b.dataset.csmapgo];if(!m||!mk)return;m.setView(mk.getLatLng(),17);mk.openPopup()};
  if(box.__map)go();else{csMapInit(box);setTimeout(go,900)}});
/* enlarge / shrink the map */
document.addEventListener("click",e=>{const b=e.target.closest("[data-csmapbig]");if(!b)return;e.preventDefault();const w=b.closest(".csmapw");w.classList.toggle("big");document.body.classList.toggle("csmapopen",w.classList.contains("big"));
  const box=w.querySelector("[data-csmap]");setTimeout(()=>csMapFit(box),80)});

/* cast: role and actor columns on/off (remembered on this device; both shown at first) */
function csCols(){try{return new Set(String(localStorage.getItem("cscols:v1")||"").split(",").filter(Boolean))}catch(_){return new Set()}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-cscol]");if(!b)return;e.preventDefault();const k=b.dataset.cscol,h=csCols();if(h.has(k))h.delete(k);else h.add(k);
  try{localStorage.setItem("cscols:v1",[...h].join(","))}catch(_){}const d=document.getElementById("cs-cast");if(d){d.classList.toggle("hide-"+k,h.has(k))}b.setAttribute("aria-pressed",String(!h.has(k)))});

/* cast of today: a pink frame around the time that is running now (P/UP, call, costume, make-up, base, on set) – in the table and in the cards */
function csCastNow(){const sec=document.getElementById("cs-cast");if(!sec)return;sec.querySelectorAll(".csnowt").forEach(e=>e.classList.remove("csnowt"));
  if(!CSCUR||!CSCUR.date||typeof todayISO!=="function"||CSCUR.date!==todayISO())return;const tm=(CSCUR.c&&CSCUR.c.times)||{},w=hm(tm.wrap||"");
  const d=new Date(),now=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");if(w&&now>w)return;
  const span=el=>{const t=String(el.textContent||"").replace(/(\d{1,2})[.:](\d{2})/g,"$1:$2"),ms=t.match(/(?<!\d)\d{1,2}:\d{2}(?!\d)/g);if(!ms)return null;const a=hm(ms[0]),b=/[-–]/.test(t)&&ms.length>1?hm(ms[ms.length-1]):"";return {a,b}};
  const mark=cells=>{let best=null;for(const el of cells){const s=span(el);if(!s||!s.a||s.a>now)continue;if(s.b&&s.a<=now&&now<s.b){best=el;break}if(!best||s.a>=span(best).a)best=el}if(best)best.classList.add("csnowt")};
  sec.querySelectorAll(".cs-tbl tbody tr").forEach(tr=>mark([...tr.children].slice(3)));
  sec.querySelectorAll(".cs-card").forEach(cd=>mark([...cd.querySelectorAll(".cs-kv")]))}
{const v=document.getElementById("view");if(v)new MutationObserver(()=>requestAnimationFrame(csCastNow)).observe(v,{childList:true})}
setInterval(()=>{if(typeof S!=="undefined"&&S.tab==="dispo")csCastNow()},60e3);
