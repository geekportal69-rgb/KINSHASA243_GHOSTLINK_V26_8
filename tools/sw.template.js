/* =========================================================
   GHOSTLINK V12.3 — sw.js (généré par tools/build-sw.py, ne pas modifier à la main)
   Service worker : met en cache TOUT le jeu à la première visite, puis sert
   chaque fichier depuis le cache (le jeu se lance et se joue sans connexion).
   Une nouvelle version du jeu = nouvelle clé de cache, l'ancienne est supprimée.
   ========================================================= */
const VERSION = 'ghostlink-v12-__VERSION__';
const FILES = __FILES__;

async function notify(msg) {
  const cs = await self.clients.matchAll({ includeUncontrolled: true });
  cs.forEach((c) => c.postMessage(msg));
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    let done = 0;
    const total = FILES.length;
    // par lots de 8 pour ne pas saturer les connexions mobiles
    for (let i = 0; i < total; i += 8) {
      await Promise.all(FILES.slice(i, i + 8).map(async (f) => {
        try {
          const hit = await cache.match(f);
          if (!hit) { const r = await fetch(f, { cache: 'reload' }); if (r.ok) await cache.put(f, r); }
        } catch (err) { /* fichier ignoré : il sera mis en cache à la première utilisation */ }
        done++;
      }));
      if (i % 40 === 0) notify({ type: 'progress', done, total });
    }
    notify({ type: 'progress', done: total, total });
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('ghostlink-v12-') && k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
    notify({ type: 'ready', version: VERSION });
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'check') notify({ type: 'ready', version: VERSION });
});

// cache d'abord, réseau ensuite (et mise en cache de tout fichier manquant)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok && r.type === 'basic') cache.put(req, r.clone());
      return r;
    } catch (err) {
      if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
