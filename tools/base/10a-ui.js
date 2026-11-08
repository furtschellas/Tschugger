import {h,html,ISLANDS,useLayoutEffect,useRef} from "./09-fw.js";
import {formsKeep,formsRestore,viewMorph} from "./15-script-tab.js";
import {L,maps,TX} from "./10-core.js";
/* ---------- building blocks of the pages as components (framework, 09-fw.js) ----------
   the same markup and classes as the string parts of the app, so both look the same while the pages move one by one */

/** @typedef {{name?:string,address?:string,note?:string,phone?:string}} InfoItem */
/** @typedef {{cat?:string,items?:InfoItem[]}} InfoGroup */

/** an empty or loading page ("Infos ist noch leer …" / "Lade Infos …")
 * @param {{what:string,loaded:boolean}} p */
export function Empty({what,loaded}){
  return html`<div class="empty">${loaded?L(what)+" "+L("ist noch leer. Die Daten kommen automatisch aus der Dropbox der Produktion."):L("Lade")+" "+L(what)+" …"}</div>`}

/** a section with a heading (department, category …)
 * @param {{title:string,children?:any}} p */
export function Section({title,children}){
  return html`<section class="dept"><h3 class="dh">${title}</h3><div class="people">${children}</div></section>`}

/** one entry of a list: name, lines below, a phone number
 * @param {{name?:string,href?:string,address?:string,note?:string,phone?:string}} p */
export function Entry({name,href,address,note,phone}){
  return html`<div class="p"><div class="nm">${name||""}</div>
    ${address?html`<div class="role"><a href=${href} target="_blank" rel="noopener noreferrer">${address}</a></div>`:null}
    ${note?html`<div class="role">${note}</div>`:null}
    ${phone?html`<div class="ct"><span>${phone}</span></div>`:null}</div>`}

/** HTML made by the string parts of the app (shared with pages that have not moved yet), inside a component – without a wrapper:
 * each top element of the HTML becomes an element of the component with its own inside as HTML (so CSS like «.ttiles>*» still fits)
 * @param {{html?:string,tag?:string,cls?:string}} p */
const RAWC=new Map();   /* parsed once per HTML; the elements are made new on every drawing (a vnode must never be in two places) */
export function Raw({html:src,tag,cls}){if(!src)return null;
  if(tag||cls)return h(tag||"div",{class:cls||undefined,dangerouslySetInnerHTML:{__html:src}});
  let spec=RAWC.get(src);
  if(!spec){const t=document.createElement("template");t.innerHTML=src;
    spec=[...t.content.childNodes].map(n0=>{if(n0.nodeType===3)return n0.nodeValue;if(n0.nodeType!==1)return null;
      const n=/** @type {Element} */(n0),a={};for(const at of n.attributes)a[at.name]=at.value===""?true:at.value;return [n.tagName.toLowerCase(),a,n.innerHTML]});
    if(RAWC.size>400)RAWC.clear();RAWC.set(src,spec)}
  return spec.map((x,i)=>Array.isArray(x)?h(x[0],Object.assign({key:i},x[1],{dangerouslySetInnerHTML:{__html:x[2]}})):x)}

/** HTML of the string parts with forms or open sections in it (crew list: user data of a person …): morphed like the page, so typing,
 * ticks and open parts stay; not touched while someone is typing in it
 * @param {{html?:string,cls?:string}} p */
export function RawLive({html:h,cls}){const r=useRef(null);
  useLayoutEffect(()=>{const el=r.current;if(!el||el.__h===h)return;
    if(el.__h===undefined){el.innerHTML=h||"";el.__h=h;return}
    const ae=document.activeElement;if(ae&&el.contains(ae)&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;
    const k=formsKeep(el);viewMorph(el,h||"");formsRestore(el,k);el.__h=h});
  return html`<div class=${"raw"+(cls?" "+cls:"")} ref=${r}></div>`}

/** a card that opens with a tap on its head (Locations, Szenen …); «open» comes from S.openSc, the tap handler is data-sckey (18-blocking.js)
 * @param {{k:string,open:boolean,now?:boolean,head:any,addr?:any,children?:any}} p */
export function Card({k,open,now,head,addr,children}){
  return html`<div class=${"lc scd"+(open?" open":"")+(now?" lcnow":"")}><button class="lch" data-sckey=${k} aria-expanded=${String(!!open)}>${head}</button>${addr}<div class="scb" hidden=${!open}>${children}</div></div>`}

/** a «Maps» line: the address and the link
 * @param {{addr:string,href:string}} p */
export function MapLine({addr,href}){return html`<div><span class="addr">${addr}</span> <a href=${href} target="_blank" rel="noopener noreferrer">Maps</a></div>`}

/* ---------- pages ---------- */
/** the Info page: the places of the production list by category
 * @param {{places:InfoGroup[],loaded:boolean}} p */
function InfoPage({places,loaded}){
  if(!places||!places.length)return html`<${Empty} what="Infos" loaded=${loaded}/>`;
  return html`${places.map(g=>html`<${Section} title=${TX(g,"cat")}>
    ${(g.items||[]).map(p=>html`<${Entry} name=${p.name} address=${p.address} href=${p.address?maps(p.name+", "+p.address):""} note=${p.note?TX(p,"note"):""} phone=${p.phone}/>`)}
  </${Section}>`)}`}
ISLANDS.info=InfoPage;
