// Service Worker mínimo para ConQ - Generador APU
// Su única función obligatoria es existir y registrarse para que la PWA sea "instalable".
// Cache muy básico para que arranque aunque haya un corte breve de red.
//
// v2: el SW SOLO intercepta peticiones GET del mismo origen.
// Las llamadas a APIs externas (Gemini, Anthropic, Supabase) y los POST pasan
// directo por la red, sin pasar por aquí. Antes, cualquier fallo de esas
// llamadas terminaba en caches.match() → undefined → "Failed to fetch",
// ocultando el error real (p. ej. "payload demasiado grande").

const CACHE = 'conq-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // No tocar nada que no sea GET del mismo origen: el navegador lo maneja directo.
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // Estrategia network-first: siempre intenta la red; si falla, usa lo cacheado.
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        return cached || Response.error();
      })
  );
});
