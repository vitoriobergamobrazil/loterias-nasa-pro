// =========================================================================
// LOTERIAS NASA PRO — SERVICE WORKER v1.0
// Estratégia: Cache-First para assets estáticos, Network-First para dados
// =========================================================================

const CACHE_NAME = 'loterias-nasa-pro-v1';
const CACHE_STATIC = 'nasa-static-v1';

// Assets críticos para funcionamento offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'
];

// =========================================================================
// INSTALL: Pré-cacheia todos os assets críticos
// =========================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      // Tenta cachear assets críticos, ignora falhas individuais
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(() => console.warn('[SW] Falha ao cachear:', url))
        )
      );
    }).then(() => {
      self.skipWaiting(); // Ativa imediatamente sem esperar aba fechar
    })
  );
});

// =========================================================================
// ACTIVATE: Limpa caches antigos e toma controle imediato
// =========================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_STATIC && cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Controla todas as abas abertas imediatamente
    })
  );
});

// =========================================================================
// FETCH: Estratégia Cache-First para assets, Network-First para APIs externas
// =========================================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições de extensões de navegador
  if (!event.request.url.startsWith('http')) return;

  // Para APIs externas (Caixa, etc.) — Network-First com fallback
  const isApiRequest = url.hostname !== self.location.hostname &&
    !url.hostname.includes('cdn.tailwindcss.com') &&
    !url.hostname.includes('fonts.googleapis.com') &&
    !url.hostname.includes('github.io');

  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para assets locais e CDN — Cache-First com atualização em background
  event.respondWith(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Retorna cache imediatamente se disponível; atualiza em background
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// =========================================================================
// PUSH NOTIFICATIONS (Preparado para alertas de concurso)
// =========================================================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚀 Loterias NASA Pro';
  const options = {
    body: data.body || 'Novo resultado disponível!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'nasa-loterias-notification',
    requireInteraction: false,
    data: { url: data.url || './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

console.log('[SW] Loterias NASA Pro Service Worker v1.0 — Operacional!');
