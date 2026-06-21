// BizReceipt Pro — Service Worker v4.0
// FULL offline-first: caches everything on install, serves from cache always

const CACHE = 'bizreceipt-v4';

// Cache ALL app files on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ]);
    }).then(() => self.skipWaiting())
  );
});

// Remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// CACHE FIRST — always serve from cache, update in background
self.addEventListener('fetch', e => {
  // Skip non-GET and cross-origin requests (like Google APIs)
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        // Always return cached version immediately (offline-first)
        const fetchPromise = fetch(e.request).then(response => {
          if (response && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(() => null);

        return cached || fetchPromise || caches.match('./index.html');
      })
    )
  );
});

// Listen for sync events (background sync when internet returns)
self.addEventListener('sync', e => {
  if (e.tag === 'drive-sync') {
    e.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_NOW' }));
      })
    );
  }
});
