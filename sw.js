// ==========================================================================
// SERVICE WORKER – ADARRÓ 360 (GESTIÓ DE PWA I ESTRATÈGIA DE CACHE)
// ==========================================================================
// Aquest script actua com un proxy de xarxa. Permet que l'aplicació 
// funcioni sense connexió i que la càrrega sigui instantània en futures visites.

// 1. CONFIGURACIÓ GLOBAL
// Canviar la versió de CACHE_NAME obliga el navegador a instal·lar un nou SW, 
// invalidant els fitxers antics (Gestió de versions).
const CACHE_NAME = 'adarro-360-cache-v1.5'; // Incrementat a 1.5 per forçar l'actualització de la vil·la

// Llista de precàrrega (Recursos crítics per a l'App Shell)
const urlsToCache = [
  'index.html',
  'manifest.json',
  'offline.html',
  'css/style.css',
  'js/app.js',
  'js/visor3d.js',
  'js/three.module.js',
  'js/GLTFLoader.js',
  'js/DRACOLoader.js', 
  'js/OrbitControls.js',
  'assets/audio/historia_darro.mp3',
  // Models 3D per a funcionament offline
  'assets/models/anfora.glb',
  'assets/models/villa_darro.glb'
];

// =====================================================
// FASE 1: INSTAL·LACIÓ (Install Event)
// =====================================================
self.addEventListener('install', event => {
  // skipWaiting() fa que el SW nou s'activi sense esperar que l'usuari tanqui la pestanya
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Creant App Shell: Guardant recursos crítics i models 3D');
      return cache.addAll(urlsToCache);
    })
  );
});

// =====================================================
// FASE 2: ACTIVACIÓ (Activate Event)
// =====================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          // Si trobem una cache antiga, l'eliminem
          if (name.startsWith('adarro-') && name !== CACHE_NAME) {
            console.log('[SW] Netejant cache obsoleta:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// =====================================================
// FASE 3: INTERCEPCIÓ DE PETICIONS (Fetch Event)
// =====================================================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();

        // GESTIÓ DE CACHE PROGRESSIVA (Per a models que no estiguin a la llista inicial)
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      })
      .catch(error => {
        if (event.request.destination === 'document') {
          return caches.match('offline.html');
        }
      });
    })
  );
});