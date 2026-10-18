/* ---------- weather for the first scene of the day (Open-Meteo, no key needed) ---------- */
/* line icons in the page style (pink outlines) instead of emojis */
const ICS=(paths,sz,cls)=>'<svg class="lic '+(cls||"")+'" viewBox="0 0 24 24" width="'+(sz||20)+'" height="'+(sz||20)+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
const P_SUN='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
const P_CLOUD='<path d="M7 18h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 18z"/>';
const P_PART='<path d="M8 4.5V3M3.5 8H2M4.8 4.8l-1-1M12.2 4.8l1-1"/><path d="M5.3 10.5A3.5 3.5 0 1 1 11.6 7"/><path d="M9 20h8.5a3.5 3.5 0 0 0 .5-7 5 5 0 0 0-9.6 1.3A2.9 2.9 0 0 0 9 20z"/>';
const P_RAIN='<path d="M7 15h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>';
const P_DRIZ='<path d="M7 15h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 15z"/><path d="M9 18v1M13 18v1M9 21v.5M13 21v.5"/>';
const P_SNOW='<path d="M7 15h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 15z"/><path d="M8 18.5h.01M12 18.5h.01M16 18.5h.01M10 21h.01M14 21h.01"/>';
const P_FOG='<path d="M7 13h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 13z"/><path d="M4 17h16M6 20.5h12"/>';
const P_STORM='<path d="M7 15h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 15z"/><path d="M12.5 15l-2 3.5h3l-2 3.5"/>';
const P_DROP='<path d="M12 3.5s-6 6.6-6 10.5a6 6 0 0 0 12 0c0-3.9-6-10.5-6-10.5z"/>';
window.ICDROP=(sz)=>ICS(P_DROP,sz||14,"ldrop");
const WXI=(c,sz)=>ICS(c===0?P_SUN:c<=2?P_PART:c===3?P_CLOUD:c<=48?P_FOG:c<=57?P_DRIZ:c<=67?P_RAIN:c<=77?P_SNOW:c<=82?P_RAIN:c<=86?P_SNOW:P_STORM,sz||20,"lwx");
const WXT=c=>L(c===0?"sonnig":c<=2?"leicht bewölkt":c===3?"bedeckt":c<=48?"Nebel":c<=57?"Niesel":c<=67?"Regen":c<=77?"Schnee":c<=82?"Regenschauer":c<=86?"Schneeschauer":"Gewitter");
const WX={};
function wxPlace(d){
  const its=arr(d.items).filter(i=>i.sc&&i.loc&&!/^tba/i.test(i.loc));const it=its[0]||arr(d.items).find(i=>i.loc&&!/^tba/i.test(i.loc));if(!it)return null;
  let ad="";try{ad=addrForItem(it)}catch(_){ad=it.loc}
  const geo=(S.meta&&S.meta.geo)||{};let ll=null;
  for(const k in geo){if(geo[k]&&(ad.includes(k)||k.includes(ad)||(ad.split(",").slice(-1)[0].trim()&&k.includes(ad.split(",").slice(-1)[0].trim())))){ll=geo[k];break}}
  const town=(ad.match(/\b\d{4}\s+([^,]+)/)||[])[1]||String(it.loc).split(/\s+/)[0];
  return {ll,town:town.trim(),name:(it.set||"").replace(/^VALAIS\s*–\s*/i,"")||it.loc,loc:it.loc,addr:ad,sc:it.sc,t:it.t||""};
}
try{const lim=localISO(Date.now()-2*864e5);for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith("wx:")&&k.slice(3,13)<lim)localStorage.removeItem(k)}}catch(_){}
async function wxLoad(d){
  const p=wxPlace(d);if(!p)return null;const key=d.date+"|"+p.town;
  {const t0=localISO(Date.now()-864e5),t1=localISO(Date.now()+15*864e5);if(d.date<t0||d.date>t1)return null}
  if(WX[key]&&(WX[key].busy||Date.now()-WX[key].at<3600e3))return WX[key];
  let cached=null;try{cached=JSON.parse(localStorage.getItem("wx:"+key)||"null")}catch(_){}
  WX[key]=Object.assign({busy:true,at:Date.now(),p},cached||{});
  try{
    let ll=p.ll;
    if(!ll){const g=await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&language=de&country=CH&name="+encodeURIComponent(p.town)).then(r=>r.json());const x=g&&g.results&&g.results[0];if(x)ll=[x.latitude,x.longitude]}
    if(!ll)throw new Error("no place");
    const u="https://api.open-meteo.com/v1/forecast?latitude="+ll[0]+"&longitude="+ll[1]+"&timezone=Europe%2FZurich&start_date="+d.date+"&end_date="+d.date+
      "&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover"+
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset,uv_index_max";
    const j=await fetch(u).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()});
    WX[key]={at:Date.now(),p,ll,j,busy:false};try{localStorage.setItem("wx:"+key,JSON.stringify({at:Date.now(),ll,j}))}catch(_){}
  }catch(err){WX[key]=Object.assign({},WX[key],{busy:false,err:String(err&&err.message||err)})}
  if(S.tab==="today"||S.tab==="plan")render();if(document.getElementById("wxpop")&&window.WXPOPD===d.date)wxPopup(d.date);
  return WX[key];
}
function wxGet(d){const p=wxPlace(d);if(!p)return null;const w=WX[d.date+"|"+p.town];if(!w||(!w.busy&&Date.now()-w.at>3600e3))wxLoad(d);
  if(!w||!w.j){let c=null;try{c=JSON.parse(localStorage.getItem("wx:"+d.date+"|"+p.town)||"null")}catch(_){}return c&&c.j?Object.assign({p},c):{p,busy:true}}return w}
function wxTile(d){
  const w=wxGet(d);if(!w)return "";const dl=w.j&&w.j.daily;
  if(!dl||!dl.time||!dl.time.length)return '<button type="button" class="ttile twx" data-wx="'+esc(d.date)+'"><b>'+(w.err?"–":"…")+'</b><span>'+esc(L("Wetter"))+' · '+esc(w.p.town)+'</span></button>';
  const c=dl.weather_code[0];
  return '<button type="button" class="ttile twx" data-wx="'+esc(d.date)+'" aria-label="'+esc(L("Wetterbericht"))+'"><b><span class="wxi">'+WXI(c)+'</span> '+Math.round(dl.temperature_2m_min[0])+'–'+Math.round(dl.temperature_2m_max[0])+'°</b><span>'+esc(w.p.town)+(dl.precipitation_probability_max[0]!=null?' · '+ICDROP(12)+dl.precipitation_probability_max[0]+'%':'')+'</span></button>';
}
/* compact weather chip for the schedule's day facts */
window.wxFact=function(d){const w=wxGet(d);if(!w)return "";const dl=w.j&&w.j.daily;if(!dl||!dl.time||!dl.time.length)return "";
  return '<button type="button" class="fact factw" data-wx="'+esc(d.date)+'" title="'+esc(L("Wetterbericht")+" · "+w.p.town)+'">'+WXI(dl.weather_code[0],14)+'<span class="v">'+Math.round(dl.temperature_2m_min[0])+'–'+Math.round(dl.temperature_2m_max[0])+'°'+(dl.precipitation_probability_max[0]!=null?'\u2009'+ICDROP(10)+dl.precipitation_probability_max[0]+'%':'')+'</span></button>'};
function wxPopup(date){window.WXPOPD=date;
  const d=(S.days||[]).find(x=>x.date===date);if(!d)return;const w=wxGet(d);if(!w)return;
  let o=document.getElementById("wxpop");if(!o){o=mkDialog("wxpop");document.body.appendChild(o);
    o.addEventListener("click",e=>{if(e.target===o||e.target.closest("[data-wxx]"))o.remove()})}
  const dt=new Date(date+"T12:00:00"),dp=(S.dispos||[]).find(x=>x&&x.date===date);
  let body='<p class="ghint">'+esc(L("Wird geladen …"))+'</p>';
  const j=w.j;if(j&&j.hourly&&j.daily){const h=j.hourly,dl=j.daily;
    const rows=h.time.map((t,i)=>({h:t.slice(11,16),i})).filter(x=>{const hh=+x.h.slice(0,2);return hh>=5&&hh<=23});
    body='<div class="wxsum"><div class="wxbig">'+WXI(dl.weather_code[0],48)+'</div><div><b>'+esc(WXT(dl.weather_code[0]))+'</b><br>'+Math.round(dl.temperature_2m_min[0])+'° / '+Math.round(dl.temperature_2m_max[0])+'° · '+ICDROP(14)+' '+(dl.precipitation_probability_max[0]??"–")+'% · '+(dl.precipitation_sum[0]??0)+' mm<br>'+esc(L("Wind"))+' '+Math.round(dl.wind_speed_10m_max[0])+' km/h, '+esc(L("Böen"))+' '+Math.round(dl.wind_gusts_10m_max[0])+' km/h'+(dl.uv_index_max&&dl.uv_index_max[0]!=null?' · UV '+Math.round(dl.uv_index_max[0]):'')+'<br>'+esc(L("Sonne"))+' '+String(dl.sunrise[0]).slice(11,16)+'–'+String(dl.sunset[0]).slice(11,16)+'</div></div>'+
      (dp&&dp.weather?'<p class="ghint">'+esc(L("Laut Callsheet"))+': '+esc(dp.weather)+'</p>':'')+
      '<div class="wxtbl"><div class="wxr wxh"><span>'+esc(L("Zeit"))+'</span><span></span><span>°C</span><span>'+ICDROP(13)+'</span><span>mm</span><span>'+esc(L("Wind"))+'</span></div>'+
      rows.map(({h:hh,i})=>'<div class="wxr'+(w.p.t&&hh.slice(0,2)===String(w.p.t).slice(0,2)?' wxnow':'')+'"><span>'+hh+'</span><span>'+WXI(h.weather_code[i])+'</span><span>'+Math.round(h.temperature_2m[i])+'°</span><span>'+(h.precipitation_probability[i]??"–")+'%</span><span>'+(h.precipitation[i]||0)+'</span><span>'+Math.round(h.wind_speed_10m[i])+(h.wind_gusts_10m[i]>40?' <small>('+Math.round(h.wind_gusts_10m[i])+')</small>':'')+'</span></div>').join("")+'</div>'+
      '<p class="ghint wxsrc">'+esc(L("Vorhersage"))+': Open-Meteo · '+esc(L("Stand"))+' '+fmtT(w.at)+'</p>'}
  else if(w.err)body='<p class="ghint">'+esc(L("Wetter nicht verfügbar"))+' ('+esc(w.err)+')</p>';
  o.innerHTML='<div class="a2box wxbox">'+xBtn("data-wxx")+'<h3>'+esc(L("Wetter"))+' · '+esc(WDL(dt)+" "+ddmm(dt))+'</h3>'+
    '<p class="wxplace">'+ICS('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',15,"lpin")+' <b>'+esc(w.p.town)+'</b> · '+esc(w.p.name)+(w.p.sc?' · '+esc(L("Szene"))+' '+esc(w.p.sc)+(w.p.t?' '+esc(w.p.t):''):'')+'</p>'+body+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-wx]");if(b)wxPopup(b.dataset.wx)});
