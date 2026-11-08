import {html,ISLANDS} from "./09-fw.js";
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

/* ---------- pages ---------- */
/** the Info page: the places of the production list by category
 * @param {{places:InfoGroup[],loaded:boolean}} p */
function InfoPage({places,loaded}){
  if(!places||!places.length)return html`<${Empty} what="Infos" loaded=${loaded}/>`;
  return html`${places.map(g=>html`<${Section} title=${TX(g,"cat")}>
    ${(g.items||[]).map(p=>html`<${Entry} name=${p.name} address=${p.address} href=${p.address?maps(p.name+", "+p.address):""} note=${p.note?TX(p,"note"):""} phone=${p.phone}/>`)}
  </${Section}>`)}`}
ISLANDS.info=InfoPage;
