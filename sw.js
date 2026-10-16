/* Service worker: app files load fresh from the network when online and from the cache when offline
   (film locations often have no reception). The crew data file is never cached here – the app keeps
   its own last copy – and nothing from Firebase sign-in or the database is cached. */
const CACHE="crew-app-v9";
const PAGES_MAX=4000;   /* PDF pages and floorplans kept for offline use: at most this many, the oldest go first */
const SHELL=["./","index.html","manifest.webmanifest","clap.svg","clap-180.png","clap-192.png","clap-512.png","clap-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
let TRIMT=null;
const trimSoon=()=>{clearTimeout(TRIMT);TRIMT=setTimeout(()=>caches.open(CACHE).then(async c=>{const ks=(await c.keys()).filter(q=>/\/blk\//.test(q.url));
  if(ks.length>PAGES_MAX)await Promise.all(ks.slice(0,ks.length-PAGES_MAX).map(q=>c.delete(q)))}).catch(()=>{}),5000)};
const put=(r,res)=>{if(res&&(res.ok||res.type==="opaque")){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp)).catch(()=>{})}return res};
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  const same=u.origin===self.location.origin;
  const lib=u.hostname==="www.gstatic.com"&&u.pathname.startsWith("/firebasejs/");
  const font=u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com";
  if(same&&/data\.enc\.json$/.test(u.pathname))return;
  /* small status files are asked for with «?t=…» every few minutes: never stored, otherwise the cache grows without end */
  if(same&&u.search&&/\/(stamp\.json|status\.json|version\.txt|script\.enc\.json)$/.test(u.pathname))return;
  /* pictures: here on GitHub Pages or (newer) from Cloudflare R2 through the worker – same rules for both */
  const blkPath=/\/blk\/[0-9a-f]{20}(p\d+|\.mp4)?\.bin$/.test(u.pathname);
  /* blocking photos are not kept for offline use (only PDF pages «…p<n>.bin» and floorplans are) */
  if(blkPath&&/\/blk\/[0-9a-f]{20}(\.mp4)?\.bin$/.test(u.pathname))return;
  /* PDF pages and floorplans never change (new file name for new content): cache first */
  if(blkPath){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{put(r,res);trimSoon();return res})));return}
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
/* push notifications (reminders for upcoming events); a tap opens the app at «Meine Termine» */
self.addEventListener("push",e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={body:e.data&&e.data.text()}}
  /* shown as a pop-up (heads-up) banner: high urgency is set by the sender; it stays until it is tapped or swiped away */
  const opt={body:d.body||"",tag:d.tag||undefined,renotify:!!d.tag,requireInteraction:true,silent:false,vibrate:[200,100,200],timestamp:Date.now(),icon:"clap-192.png",badge:"clap-192.png",data:{url:d.url||"./#my"}};
  e.waitUntil(Promise.all([self.registration.showNotification(d.title||"TSCHUGGER",opt),
    self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>cs.forEach(c=>c.postMessage({push:{title:d.title||"",body:d.body||"",url:d.url||""}})))]))});
self.addEventListener("notificationclick",e=>{e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||"./#my",self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{for(const c of cs){if(c.url.startsWith(self.registration.scope)&&"focus" in c){c.postMessage({open:url});return c.focus()}}return self.clients.openWindow(url)}))});
