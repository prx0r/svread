/* offline-first: cache shell + vendored work data. MIT (skeleton: gita-quotes).
   Bump C on every site update — the fetch handler is cache-first, so return
   visitors only see new content when the cache version changes. */
const C = 'svread-1793696730';
const SHELL = ['./index.html','./styles.css','./app.js','./manifest.webmanifest','./data/bhairavastava.json','./data/library.json'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>{}));
});
self.addEventListener('activate', e=>{ e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
); });
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(hit=>hit || fetch(e.request).then(r=>{
    const cp = r.clone();
    if(e.request.method==='GET' && r.ok) caches.open(C).then(c=>c.put(e.request, cp)).catch(()=>{});
    return r;
  }).catch(()=>caches.match('./index.html'))));
});
