
// A simple service worker for caching
self.addEventListener('install', (event) => {
  // Caching is disabled for now to ensure fresh content.
  // This can be enabled later with a proper caching strategy.
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      // If the network fails, you could try to serve from cache if available.
      // return caches.match(event.request);
    })
  );
});
