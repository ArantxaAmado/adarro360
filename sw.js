// =====================================================
// SERVICE WORKER – DARRÓ DIGITAL (PWA)
// =====================================================
// Aquest fitxer implementa el Service Worker de l’aplicació.
// El Service Worker actua com a intermediari entre la xarxa
// i l’aplicació, permetent cache offline, millor rendiment
// i comportament similar a una aplicació nativa.


// =====================================================
// CONFIGURACIÓ DE LA CACHE
// =====================================================

// Nom i versió de la memòria cau.
// Incrementar la versió força la reinstal·lació del Service Worker
// i permet controlar actualitzacions de recursos.
const CACHE_NAME = 'darro-digital-cache-v1.3';

// Llista d’arxius essencials perquè l’aplicació funcioni offline.
// Aquests recursos es cachegen durant la fase d’instal·lació.
const urlsToCache = [

  // -------------------- HTML I MANIFEST --------------------
  // Fitxers base necessaris per arrencar l’aplicació
  'index.html',
  'manifest.json',
  'offline.html',

  // -------------------- FULLS D’ESTIL --------------------
  // CSS principal de l’aplicació
  'css/style.css',

  // -------------------- JAVASCRIPT --------------------
  // Lògica principal i visor 3D
  'js/app.js',
  'js/visor3d.js',

  // -------------------- LLIBRERIES 3D (LOCALS) --------------------
  // Dependències carregades localment per evitar dependència de CDN
  'js/three.module.js',
  'js/GLTFLoader.js',
  'js/OrbitControls.js',

  // -------------------- ICONES I IMATGES ESSENCIALS --------------------
  // Recursos visuals mínims per a la navegació
  'assets/icon/anfora.png',
  'assets/icon/pilar.png',
  'assets/icon/lamina.png',
  'assets/icon/icon_app.png',

  // -------------------- ÀUDIO --------------------
  // Afegeixo l'àudio perquè es descarregui només instal·lar l'app
  'assets/audio/historia_darro.mp3',

  // Els models 3D pesen més i es cachegen progressivament
  // durant la navegació (no aquí).
];


// =====================================================
// FASE D’INSTAL·LACIÓ
// =====================================================
// Aquesta fase s’executa una sola vegada quan el Service Worker
// s’instal·la per primer cop o quan canvia CACHE_NAME.

self.addEventListener('install', event => {

  // Força que el nou Service Worker passi directament a estat actiu
  // (evita esperar que es tanquin pestanyes antigues)
  self.skipWaiting();

  // event.waitUntil assegura que la instal·lació no finalitza
  // fins que totes les promeses s’han resolt
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cachejant arxius essencials');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] Error durant la instal·lació:', error);
      })
  );
});


// =====================================================
// FASE D’ACTIVACIÓ
// =====================================================
// Aquesta fase permet netejar versions antigues de la cache
// i és clau per a la gestió de versions.

self.addEventListener('activate', event => {

  event.waitUntil(
    caches.keys().then(cacheNames => {

      // S’eliminen totes les caches antigues que
      // comparteixen prefix però no coincideixen amb la versió actual
      return Promise.all(
        cacheNames
          .filter(
            name =>
              name.startsWith('darro-digital-cache-') &&
              name !== CACHE_NAME
          )
          .map(name => {
            console.log('[SW] Eliminant cache antiga:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Permet que el Service Worker controli immediatament
  // totes les pestanyes obertes de l’aplicació
  self.clients.claim();
});


// =====================================================
// INTERCEPCIÓ DE PETICIONS (FETCH)
// =====================================================
// Implementa una estratègia:
// "Cache First, Network Fallback"
// Optimitza rendiment i permet funcionament offline.

self.addEventListener('fetch', event => {

  // Només s’intercepten peticions GET
  // (POST, PUT, etc. no s’han de cachejar)
  if (event.request.method !== 'GET') return;

  event.respondWith(

    // Primer intent: buscar el recurs a la cache
    caches.match(event.request).then(cachedResponse => {

      // Si el recurs existeix a la cache, es retorna directament
      if (cachedResponse) return cachedResponse;

      // Si no hi és, es demana a la xarxa
      return fetch(event.request)
        .then(networkResponse => {

          // Validació de la resposta de xarxa
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          // Es clona la resposta perquè un stream
          // només es pot consumir una vegada
          const responseToCache = networkResponse.clone();

          // -------------------- CACHE PROGRESSIU --------------------
          // Si el recurs és un model 3D (.glb),
          // es guarda a la cache només després d’haver-se descarregat
          if (event.request.url.endsWith('.glb')) {
            caches.open(CACHE_NAME).then(cache => {
              console.log('[SW] Cachejant model 3D:', event.request.url);
              cache.put(event.request, responseToCache);
            });
          } else {
            // La resta de recursos també es cachegen progressivament
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }

          // Es retorna la resposta de xarxa a l’aplicació
          return networkResponse;
        })

        // -------------------- FALLBACK OFFLINE --------------------
        .catch(error => {
          console.warn('[SW] Xarxa no disponible:', error);

          // Si la petició era una pàgina HTML,
          // es retorna una pàgina offline personalitzada
          if (event.request.destination === 'document') {
            return caches.match('offline.html');
          }
        });
    })
  );
});
