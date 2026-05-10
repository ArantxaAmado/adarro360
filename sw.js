// ==========================================================================
// SERVICE WORKER – ADARRÓ 360
// ==========================================================================

const CACHE_NAME = 'adarro-360-cache-v3.0';

// RUTES CORRECTES PER GITHUB PAGES
const BASE = '/adarro360/';

const urlsToCache = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',

  // CSS + JS
  BASE + 'css/style.css',
  BASE + 'js/app.js',
  BASE + 'js/ui-flow.js',
  BASE + 'js/visor3d.js',

  // ICONS NOUS (PWA)
  BASE + 'assets/icon/icon-512.png',
  BASE + 'assets/icon/icon-192.png',

  // ASSETS
  BASE + 'assets/audio/historia_darro.mp3',
  BASE + 'assets/models/anfora.glb',
  BASE + 'assets/models/villa_darro.glb',

  // IMATGES
  BASE + 'assets/img/context_hero.jpeg',
  BASE + 'assets/img/amphora.png',
  BASE + 'assets/img/coins.png',
  BASE + 'assets/img/jaciment.jpg'
];

// ==========================================================================
// INSTALL
// ==========================================================================
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cachejant App Shell…');
      return cache.addAll(urlsToCache);
    })
  );
});

// ==========================================================================
// ACTIVATE
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

  // Navigation preload (millora velocitat)
  if (self.registration.navigationPreload) {
    self.registration.navigationPreload.enable();
  }

  self.clients.claim();
});

// ==========================================================================
// FETCH
// ==========================================================================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) return response;

          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));

          return response;
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match(BASE + 'index.html');
          }
        });
    })
  );
});
