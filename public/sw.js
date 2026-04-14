// ================================================================
// DJ Bounce Assistant — Service Worker
// Provides offline capability via cache-first strategy
// ================================================================

const CACHE_NAME = 'djbounce-v1';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Install: precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Skip audio file requests (too large to cache)
  if (/\.(mp3|wav|flac|ogg|aac|m4a)$/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    // Network-first for navigation
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then(r => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, cloned));
        }
        return response;
      }).catch(() => cached || new Response('', { status: 404 }));
    })
  );
});
