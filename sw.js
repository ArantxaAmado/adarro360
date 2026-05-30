// ==========================================================================
// SERVICE WORKER – ADARRÓ 360
// ==========================================================================

const CACHE_NAME = 'adarro-360-cache-v4.1';
const BASE = '/adarro360/';

const urlsToCache = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',

  // IDIOMES (100% OFFLINE)
  BASE + 'i18n/ca.json',
  BASE + 'i18n/es.json',
  BASE + 'i18n/en.json',

  // CSS + JS
  BASE + 'css/style.css',
  BASE + 'js/app.js',
  BASE + 'js/ui-flow.js',
  BASE + 'js/visor3d.js',
  BASE + 'js/i18n.js',

  // AR
  BASE + 'js/ar-detect.js',
  BASE + 'js/ar-android.js',
  BASE + 'js/ar-ios.js',

  // ICONS
  BASE + 'assets/icon/icon-512.png',
  BASE + 'assets/icon/icon-192.png',

  // AUDIO
  BASE + 'assets/audio/historia_darro.mp3',

  // MODELS
  BASE + 'assets/models/anfora.glb',
  BASE + 'assets/models/villa_darro.glb',
  BASE + 'assets/models/villa_darro.usdz',

  // IMATGES
  BASE + 'assets/img/context_hero.jpg',
  BASE + 'assets/img/amphora.png',
  BASE + 'assets/img/coins.png',
  BASE + 'assets/img/jaciment.jpg'
];

// ==========================================================================
// INSTALL (Instal·lació inicial i cacheig de l'App Shell)
// ==========================================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cachejant App Shell…');
      return cache.addAll(urlsToCache);
    })
  );
});

// ==========================================================================
// ACTIVATE (Neteja automàtica de memòries cau antigues de versions passades)
// ==========================================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key.startsWith('adarro-'))
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// ==========================================================================
// FETCH (ESTRATÈGIA BLINDADA: STALE-WHILE-REVALIDATE PER A CDNs I OFFLINE)
// ==========================================================================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Filtre flexible: comprovo si la petició prové del nostre GitHub local o de les CDNs de Three.js / Draco
  const isLocal = url.pathname.startsWith(BASE) || url.pathname === BASE.replace(/\/$/, "");
  const isCDN = url.hostname.includes('skypack.dev') || url.hostname.includes('gstatic.com');

  if (!isLocal && !isCDN) return; // Passo de llarg si és una extensió del navegador o analítiques externes

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {

      // Preparo la petició de xarxa en segon pla per revalidar/actualitzar fitxers
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const contentType = networkResponse.headers.get("Content-Type") || "";
          const pathname = url.pathname.toLowerCase();

          // Evito el "cache poisoning" (no cachegem cap variant d'HTML dinàmic o errors encoberts del 404 de GitHub)
          const isHTML = contentType.includes("text/html") || 
                         pathname.endsWith(".html") || 
                         pathname === BASE || 
                         pathname === BASE + "index.html";

          if (!isHTML) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }

          return networkResponse;
        })
        .catch((err) => {
          console.log('[SW] Xarxa caiguda o recurs no disponible offline:', url.pathname);

          // Si el que ha fallat és la navegació d'una pantalla o el document base, forcem l'App Shell original
          if (event.request.destination === 'document' || event.request.mode === 'navigate') {
            return caches.match(BASE + 'index.html');
          }
          
          // Si és un recurs binari aliè que no teníem guardat, deixa que la petició falli naturalment
        });

      // Retornem l'arxiu de la cau a l'acte (velocitat instantània) i si no hi és, esperem la resposta del servidor
      return cachedResponse || fetchPromise;
    })
  );
});