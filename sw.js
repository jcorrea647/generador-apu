// Service Worker mínimo para ConQ - Generador APU
// Su única función obligatoria es existir y registrarse para que la PWA sea "instalable".
// Cache muy básico para que arranque aunque haya un corte breve de red.

const CACHE = 'conq-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estrategia network-first: siempre intenta la red; si falla, usa lo cacheado.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guarda en caché solo peticiones GET exitosas del mismo origen
        if (event.request.method === 'GET' && response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
