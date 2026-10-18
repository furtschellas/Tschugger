const W=window;W.__db=W.__db||{};
const ck=()=>{if(W.__rules)W.__rules()};
export const getFirestore=()=>({});
export const doc=(db,...p)=>({path:p.join("/"),id:p[p.length-1]});
export const collection=(db,...p)=>({path:p.join("/")});
export const serverTimestamp=()=>new Date().toISOString();
export async function getDoc(r){if(!navigator.onLine)throw Object.assign(new Error("Failed to get document because the client is offline."),{code:"unavailable"});if(W.__deny&&W.__deny(r.path,"read"))throw Object.assign(new Error("permission-denied"),{code:"permission-denied"});const d=W.__db[r.path];return {exists:()=>!!d,data:()=>d,id:r.id}}
export async function setDoc(r,d){_fire();if(W.__deny&&W.__deny(r.path,"write",d))throw Object.assign(new Error("permission-denied"),{code:"permission-denied"});W.__db[r.path]=Object.assign({},d)}
export async function updateDoc(r,d){_fire();if(W.__deny&&W.__deny(r.path,"write",d))throw Object.assign(new Error("permission-denied"),{code:"permission-denied"});W.__db[r.path]=Object.assign({},W.__db[r.path],d)}
export async function deleteDoc(r){_fire();delete W.__db[r.path]}
export async function getDocs(c){const r=await _list(c);if(!c.q)return r;const w=c.q.filter(x=>x&&x.where&&x.where[0]==="__id__");return {docs:r.docs.filter(d=>w.every(([,op,v])=>op===">="?d.id>=v:op==="<="?d.id<=v:op==="=="?d.id===v:true))}}
async function _list(c){if(W.__deny&&W.__deny(c.path,"list"))throw Object.assign(new Error("permission-denied"),{code:"permission-denied"});return {docs:Object.keys(W.__db).filter(k=>k.startsWith(c.path+"/")&&k.split("/").length===2).map(k=>({id:k.split("/")[1],data:()=>W.__db[k]}))}}
export function writeBatch(){const ops=[];return {set:(r,d)=>ops.push([r,d]),commit:async()=>{for(const [r,d] of ops)W.__db[r.path]=d}}}
export async function addDoc(c,d){_fire();const W=window;const id="b"+Math.random().toString(36).slice(2,10);W.__db[c.path+"/"+id]=Object.assign({},d);return {id}}

/* queries: filters on the document id (enough for the app's «menus from yesterday on»), orderBy/limit ignored */
export const documentId=()=>"__id__";
export const where=(f,op,v)=>({where:[f,op,v]});
export const orderBy=()=>({});
export const limit=()=>({});
export const query=(c,...q)=>Object.assign({},c,{q});

/* realtime listener like Firestore: first the current documents, then again after every write */
export function onSnapshot(c,cb,err){const s={run:()=>getDocs(c).then(cb,e=>err&&err(e))};(W.__subs=W.__subs||[]).push(s);s.run();return ()=>{W.__subs=W.__subs.filter(x=>x!==s)}}
const _fire=()=>setTimeout(()=>(W.__subs||[]).forEach(s=>s.run()),0);
