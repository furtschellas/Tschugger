/* Service worker: app files load fresh from the network when online and from the cache when offline
   (film locations often have no reception). The crew data file is never cached here – the app keeps
   its own last copy – and nothing from Firebase sign-in or the database is cached. */
const CACHE="crew-app-v2";
const SHELL=["./","index.html","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  const same=u.origin===self.location.origin;
  const lib=u.hostname==="www.gstatic.com"&&u.pathname.startsWith("/firebasejs/");
  const font=u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com";
  if(same&&/data\.enc\.json$/.test(u.pathname))return;
  if(!same&&!lib&&!font)return;
  e.respondWith(fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque")){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r,{ignoreSearch:same}).then(m=>m||(r.mode==="navigate"?caches.match("index.html"):Response.error()))));
});
