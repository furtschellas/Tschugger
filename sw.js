/* Service worker: app files load fresh from the network when online and from the cache when offline
   (film locations often have no reception). The crew data file is never cached here – the app keeps
   its own last copy – and nothing from Firebase sign-in or the database is cached. */
const CACHE="crew-app-v4";
const SHELL=["./","index.html","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const put=(r,res)=>{if(res&&(res.ok||res.type==="opaque")){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp)).catch(()=>{})}return res};
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  const same=u.origin===self.location.origin;
  const lib=u.hostname==="www.gstatic.com"&&u.pathname.startsWith("/firebasejs/");
  const font=u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com";
  if(same&&/data\.enc\.json$/.test(u.pathname))return;
  if(!same&&!lib&&!font)return;
  /* Firebase library and fonts have fixed versions: serve from cache, load only once */
  if(lib||font){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>put(r,res))));return}
  /* app files: network first (skipping the HTTP cache so updates show up), but on a slow connection
     fall back to the saved copy after 3.5 s – the network answer still refreshes the cache */
  const net=fetch(u.href,{cache:"no-cache",credentials:"same-origin"}).then(res=>put(r,res));
  const cached=()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==="navigate"?caches.match("index.html"):undefined));
  e.respondWith(new Promise(resolve=>{
    let done=false;const finish=x=>{if(!done&&x){done=true;resolve(x)}};
    const t=setTimeout(()=>cached().then(finish),3500);
    net.then(res=>{clearTimeout(t);finish(res)}).catch(()=>{clearTimeout(t);cached().then(m=>{if(m)finish(m);else if(!done){done=true;resolve(Response.error())}})});
  }));
  e.waitUntil(net.catch(()=>{}));
});
