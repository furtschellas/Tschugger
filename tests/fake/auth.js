const W=window;W.__users=W.__users||{};let cbs=[];
const auth={currentUser:null,languageCode:"de"};
function mk(u){return {providerData:[{providerId:u.google?"google.com":"password"}],uid:u.uid,get email(){return u.email},get emailVerified(){return u.verified},reload:async()=>{},getIdToken:async()=>"t"}}
const fire=()=>setTimeout(()=>cbs.forEach(c=>c(auth.currentUser)),5);
const err=c=>{const e=new Error(c);e.code="auth/"+c;return e};
export const getAuth=()=>auth;
export const browserLocalPersistence={};export const setPersistence=async()=>{};
export function onAuthStateChanged(a,cb){cbs.push(cb);try{const s=JSON.parse(sessionStorage.getItem("fakeuser")||"null");if(s&&W.__users[s])auth.currentUser=mk(W.__users[s])}catch(_){}setTimeout(()=>cb(auth.currentUser),5)}
export async function signInWithEmailAndPassword(a,e,p){const u=W.__users[e.toLowerCase()];if(!u||u.pw!==p)throw err("invalid-credential");auth.currentUser=mk(u);sessionStorage.setItem("fakeuser",JSON.stringify(u.email));fire();return {user:auth.currentUser}}
export async function createUserWithEmailAndPassword(a,e,p){e=e.toLowerCase();if(W.__users[e])throw err("email-already-in-use");const u={uid:"u"+Object.keys(W.__users).length,email:e,pw:p,verified:false};W.__users[e]=u;if(a&&a._sec){a.currentUser=mk(u);return {user:a.currentUser}}auth.currentUser=mk(u);sessionStorage.setItem("fakeuser",JSON.stringify(e));fire();return {user:auth.currentUser}}
export async function sendEmailVerification(){W.__mails=(W.__mails||0)+1}
export async function sendPasswordResetEmail(){W.__resets=(W.__resets||0)+1}
export async function signOut(a){if(a&&a._sec){a.currentUser=null;return}auth.currentUser=null;sessionStorage.removeItem("fakeuser");fire()}
export const EmailAuthProvider={credential:(e,p)=>({e,p})};
export async function reauthenticateWithCredential(u,c){if(W.__users[u.email].pw!==c.p)throw err("invalid-credential")}
export async function updatePassword(u,p){W.__users[u.email].pw=p}
export async function verifyBeforeUpdateEmail(u,e){W.__pendingEmail=e}
export class GoogleAuthProvider{setCustomParameters(){}}
export async function getRedirectResult(){return null}
export async function signInWithRedirect(){}
export async function signInWithPopup(a,p){const e=(W.__googleEmail||"google.user@gmail.com");let u=W.__users[e];if(!u){u=W.__users[e]={uid:"g"+Object.keys(W.__users).length,email:e,pw:null,verified:true,google:true}}auth.currentUser=Object.assign(mk(u),{providerData:[{providerId:"google.com"}]});sessionStorage.setItem("fakeuser",JSON.stringify(e));fire();return {user:auth.currentUser}}

export const inMemoryPersistence={};
export function initializeAuth(app,o){return {currentUser:null,_sec:true,languageCode:"de"}}
