/*
 * Caché del juego (service worker). La build completa MANIFEST con { ruta: huella } de cada
 * archivo publicado. Cada archivo se guarda con su huella: en la segunda visita sale del disco al
 * instante, y al publicar una versión nueva solo se descarga lo que cambió.
 * index.html y este archivo nunca se cachean: así siempre se detecta la versión nueva.
 */
const MANIFEST = __MANIFEST__;
const CACHE = 'pg-fighters-assets';
const SCOPE = new URL(self.registration.scope).pathname;

const relative = (url) => decodeURIComponent(url.pathname.slice(SCOPE.length));
const keyFor = (url, hash) => `${url.origin}${url.pathname}?v=${hash}`;

self.addEventListener('install', () => self.skipWaiting());

// Al activarse una versión nueva, se borran los archivos que cambiaron o ya no existen.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const request of await cache.keys()) {
        const url = new URL(request.url);
        if (MANIFEST[relative(url)] !== url.searchParams.get('v')) await cache.delete(request);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const hash = MANIFEST[relative(url)];
  if (!hash) return; // index.html, sw.js y todo lo que no está en el manifiesto: red normal
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const key = keyFor(url, hash);
      const hit = await cache.match(key);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.status === 200) cache.put(key, response.clone()).catch(() => undefined);
      return response;
    })(),
  );
});
