// LexUz Service Worker — оффлайн режим учун
const CACHE = 'lexuz-v1';
const CORE = [
  './',
  './lexuz-supabase.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, {cache:'reload'}))).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first stratiegya — API учун, лекин cache fallback
self.addEventListener('fetch', e => {
  const u = e.request.url;
  // Supabase ва AI API сўровларини cache қилмаймиз
  if (u.includes('supabase.co') || u.includes('anthropic.com') || u.includes('generativelanguage')) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(res => {
      // Янги жавобни cache'га қўйиш
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
