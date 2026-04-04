// ==========================================================================
// SERVICE WORKER – ADARRÓ 360 (GESTIÓ DE PWA I ESTRATÈGIA DE CACHE)
// ==========================================================================
// Aquest script actua com un proxy de xarxa. Permet que l'aplicació 
// funcioni sense connexió i que la càrrega sigui instantània en futures visites.

// 1. CONFIGURACIÓ GLOBAL
// Canviar la versió de CACHE_NAME obliga el navegador a instal·lar un nou SW, 
// invalidant els fitxers antics (Gestió de versions).
const CACHE_NAME = 'adarro-360-cache-v1.4'; // Harmonitzat amb el nom del projecte

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
  'assets/audio/historia_darro.mp3' 
];

// =====================================================
// FASE 1: INSTAL·LACIÓ (Install Event)
// =====================================================
self.addEventListener('install', event => {
  // skipWaiting() fa que el SW nou s'activi sense esperar que l'usuari tanqui la pestanya
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Creant App Shell: Guardant recursos crítics');
      return cache.addAll(urlsToCache);
    })
  );
});

// =====================================================
// FASE 2: ACTIVACIÓ (Activate Event)
// =====================================================
// Aquí fem neteja de memòria per no col·lapsar el dispositiu de l'usuari.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          // Si trobem una cache antiga (versió anterior), l'eliminem
          if (name.startsWith('adarro-') && name !== CACHE_NAME) {
            console.log('[SW] Netejant cache obsoleta:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  // Reclama el control de les pàgines immediatament
  self.clients.claim();
});

// =====================================================
// FASE 3: INTERCEPCIÓ DE PETICIONS (Fetch Event)
// =====================================================
// Implementem l'estratègia "Cache First, Network Fallback"
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Retornem el recurs si ja està a la cache (velocitat màxima)
      if (cachedResponse) return cachedResponse;

      // Si no està a la cache, anem a buscar-lo a internet
      return fetch(event.request).then(networkResponse => {

        // Verifiquem que la resposta sigui vàlida abans de guardar-la
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // IMPORTANT: Clonem la resposta. 
        // Les respostes de xarxa són "streams" i només es poden llegir una vegada.
        const responseToCache = networkResponse.clone();

        // --- GESTIÓ DE CACHE PROGRESSIVA ---
        // Guardem automàticament els recursos nous (com els models .glb) 
        // a mesura que l'usuari els descarrega per primer cop.
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      })
        .catch(error => {
          // --- FALLBACK OFFLINE ---
          // Si no hi ha xarxa ni cache, i l'usuari intenta carregar la pàgina principal:
          if (event.request.destination === 'document') {
            return caches.match('offline.html');
          }
        });
    })
  );
});