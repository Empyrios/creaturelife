const CACHE='creaturelife-shell-v1';
const FILES=['./','./index.html','./styles.css','./app.mjs','./core.mjs','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;event.respondWith(caches.match(request).then(found=>found||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy)).catch(()=>{});}return response;})));});
