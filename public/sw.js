// SISCOP - Service Worker PWA para Parque Nacional Sierra del Divisor (SERNANP)
const CACHE_NAME = 'siscop-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/images/fondo-sierra-divisor.jpg',
  '/images/escudo-peru.png',
  '/images/logo-sernanp-pnsd.png'
];

// Instalación: Pre-cachear el App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-cacheando App Shell y recursos estáticos...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de peticiones (Offline First para navegación y assets)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar peticiones que no sean GET o esquemas extraños (chrome-extension, etc.)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Peticiones de Navegación HTML (SPA Routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Si no hay internet, devolver el index.html cacheado para que Angular cargue en modo offline
        return caches.match('/index.html').then((cached) => {
          return cached || fetch(request);
        });
      })
    );
    return;
  }

  // 2. Peticiones de la API del Backend (/api/)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            exito: false,
            offline: true,
            mensaje: 'Estás navegando en MODO SIN CONEXIÓN (Offline). Los datos se sincronizarán al recuperar señal.',
            fecha: new Date().toISOString()
          }),
          {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Recursos Estáticos (JS, CSS, Imágenes, Fuentes): Cache First con Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // En background actualizamos el cache si hay conexión
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {/* Silencioso si está offline */});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Si no hay red y no está en caché, intentar devolver index.html si es documento
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
