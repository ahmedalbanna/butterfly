/**
 * Service Worker for Offline Support
 * Handles caching and offline fallbacks
 */

const CACHE_NAME = 'butterfly-offline-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
];

/**
 * Install event - cache assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('[ServiceWorker] Failed to cache some assets:', error);
      });
    })
  );

  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

/**
 * Fetch event - network first, fallback to cache
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - network first with timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetchWithTimeout(request, 5000)
        .then((response) => {
          // Cache successful API responses
          if (response.ok && response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Fall back to cached API response
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // Return offline indicator
            if (request.headers.get('accept')?.includes('application/json')) {
              return new Response(
                JSON.stringify({
                  error: 'Offline - cached response not available',
                  offline: true,
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }

            return new Response('Offline - no cached data available', {
              status: 503,
            });
          });
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Try to serve offline.html for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html').catch(() => {
              return fetch('/offline.html').catch(() => {
                return new Response('Offline - no cached data available', {
                  status: 503,
                });
              });
            });
          }

          // For non-navigation requests, return 404
          return new Response('Not Found', {
            status: 404,
          });
        });
    })
  );
});

/**
 * Helper: Fetch with timeout
 */
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), timeout)
    ),
  ]);
}

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      self.clients
        .matchAll()
        .then((clients) => {
          // Send message to all clients to sync queue
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_OFFLINE_QUEUE',
            });
          });
        })
        .catch((error) => {
          console.error('[ServiceWorker] Sync error:', error);
        })
    );
  }
});
