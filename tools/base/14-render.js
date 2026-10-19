/* ---------- render ---------- */
const VIEWS={my:()=>renderMy(),plan:()=>renderPlan(),dispo:()=>renderDispo(),loc:()=>renderLoc(),crew:()=>renderCrew(),script:()=>renderScript(),info:()=>renderInfo()};
/* main topics the main admin has switched on (website: window.TABSON); the script tab also needs the script function */
const ALLTABS=["today","dispo","plan","loc","crew","script","info"];
function tabOrder(){const o=Array.isArray(window.TABORDER)?window.TABORDER.filter(x=>ALLTABS.includes(x)):[];return o.concat(ALLTABS.filter(x=>!o.includes(x)))}
/* role-based visibility (website): areas a role does not allow are hidden; in the artifact everything is visible */
const vok=k=>{try{return typeof window.viewOK!=="function"||window.viewOK(k)}catch(_){return true}};
const perm=p=>{try{return typeof window.canPerm!=="function"||window.canPerm(p)}catch(_){return false}};
function tabsOn(){
  const ord=tabOrder();let t=Array.isArray(window.TABSON)?ord.filter(x=>window.TABSON.includes(x)||(x==="today"&&!window.TABSON.includes("-today"))):ord;
  if(!VIEWS.today||(window.todayOn&&!window.todayOn()))t=t.filter(x=>x!=="today"); /* «Today» comes with the website and can be switched off in the profile */ /* «Today» comes with the website (sign-in); the plain artifact has no such page */
  const scrAt=t.indexOf("script");
  if(window.SCRIPTON===false||!vok("script"))t=t.filter(x=>x!=="script");
  for(const [tab,k] of [["crew","crew"],["plan","plan"],["dispo","dispo"]])if(!vok(k))t=t.filter(x=>x!==tab);
  /* catering page: for people with the catering permission it takes the place of the script (when they don't see the script) */
  try{if(window.caterTab&&window.caterTab()&&!t.includes("script")){const at=scrAt<0?t.length:Math.min(scrAt,t.length);t.splice(at,0,"cater")}}catch(_){}
  /* «Today» is always the first (left-most) area */
  if(t.includes("today"))t=["today"].concat(t.filter(x=>x!=="today"));
  return t.length?t:["info"];
}
