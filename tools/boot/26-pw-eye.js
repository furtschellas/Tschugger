/* ---------- every password field: an eye on the right shows or hides the password ---------- */
const PWEYE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="pweoff" d="M4 4l16 16"/></svg>';
function pwEyes(root){(root||document).querySelectorAll('input[type="password"]:not([data-pweye])').forEach(i=>{i.dataset.pweye="1";
  const w=document.createElement("span");w.className="pwwrap";i.parentNode.insertBefore(w,i);w.appendChild(i);
  const b=document.createElement("button");b.type="button";b.className="pweye";b.setAttribute("aria-label",L("Passwort anzeigen"));b.title=L("Passwort anzeigen");b.innerHTML=PWEYE;w.appendChild(b)})}
/* on phones the field keeps its focus when the eye is tapped (no closing keyboard, no lost input) */
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest(".pweye"))e.preventDefault()},true);
document.addEventListener("click",e=>{const b=e.target.closest(".pweye");if(!b)return;e.preventDefault();const i=b.parentNode.querySelector("input");if(!i)return;
  const show=i.type==="password";i.type=show?"text":"password";b.classList.toggle("on",show);const t=L(show?"Passwort verbergen":"Passwort anzeigen");b.title=t;b.setAttribute("aria-label",t);i.focus();try{const n=i.value.length;i.setSelectionRange(n,n)}catch(_){}});
pwEyes();new MutationObserver(()=>pwEyes()).observe(document.body||document.documentElement,{childList:true,subtree:true});
