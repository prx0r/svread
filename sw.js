/* offline-first: cache shell + vendored work data. MIT (skeleton: gita-quotes).
   Bump C on every site update — the fetch handler is cache-first, so return
   visitors only see new content when the cache version changes. */
const C = 'svread-1794285697';
const SHELL = ['./index.html','./styles.css','./app.js','./scholar-voice.js','./scholar-workspace-ui.js','./pushing.html','./pushing.css','./pushing-core.js','./pushing-ui.js','./manifest.webmanifest','./data/bhairavastava.json','./data/library.json'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>{}));
});
self.addEventListener('activate', e=>{ e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
); });
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  // Account and API responses must never enter a cache shared by users.
  if(e.request.method!=='GET' || url.origin!==self.location.origin || url.pathname.startsWith('/api/')){
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit || fetch(e.request).then(r=>{
    const cp = r.clone();
    if(r.ok && !/no-store/i.test(r.headers.get('Cache-Control')||'')) caches.open(C).then(c=>c.put(e.request, cp)).catch(()=>{});
    return r;
  }).catch(async()=>{
    if(e.request.mode==='navigate')return await caches.match('./index.html') || Response.error();
    return Response.error();
  })));
});
