// Grave Marker – עבודה בלי קליטה
const V='gm-v3';
const SHELL=['/','/index.html','/manifest.webmanifest','/hebcal.js','/icons/icon-192.png','/icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js',
  'https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/lite.umd.js'];

self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('gm-')&&k!==V&&k!=='gm-tiles'&&k!=='gm-data').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});

const cacheFirst=async(req,name)=>{const c=await caches.open(name);const hit=await c.match(req);if(hit)return hit;
  const r=await fetch(req);if(r.ok||r.type==='opaque')c.put(req,r.clone());return r};
const netFirst=async(req,name)=>{const c=await caches.open(name);
  try{const r=await fetch(req);if(r.ok)c.put(req,r.clone());return r}catch(err){const hit=await c.match(req,{ignoreVary:true});if(hit)return hit;throw err}};

self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(u.hostname==='he.wikisource.org')return e.respondWith(netFirst(req,'gm-data'));             // נוסח תהלים
  if(u.hostname==='server.arcgisonline.com')return e.respondWith(cacheFirst(req,'gm-tiles'));        // תמונות לוויין
  if(u.pathname.startsWith('/overlays/')||u.pathname.startsWith('/icons/'))return e.respondWith(cacheFirst(req,'gm-tiles'));
  if(u.hostname.endsWith('.supabase.co')){                                                       // נתונים
    if(u.pathname.includes('/storage/'))return e.respondWith(cacheFirst(req,'gm-tiles'));
    return e.respondWith(netFirst(req,'gm-data'));
  }
  if(u.hostname.includes('cdnjs')||u.hostname.includes('jsdelivr')||u.hostname.includes('fonts.g'))return e.respondWith(cacheFirst(req,V));
  if(u.origin===location.origin)return e.respondWith(netFirst(req,V));                            // האתר עצמו
});
