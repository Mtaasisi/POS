// Service Worker for LATS POS System
// Provides offline functionality and caching

const CACHE_NAME = 'lats-pos-v1.0.0';
const STATIC_CACHE = 'lats-static-v1.0.0';
const DYNAMIC_CACHE = 'lats-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add other critical static files
];

// Install event - cache static files
self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {

        return cache.addAll(STATIC_FILES);
      })
      .then(() => {

        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {

              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {

        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // Handle page requests
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((networkResponse) => {
              // Cache successful responses
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return networkResponse;
            })
            .catch(() => {
              // Return offline page for navigation requests
              return caches.match('/offline.html');
            });
        })
    );
  } else if (request.destination === 'image' || request.destination === 'script' || request.destination === 'style') {
    // Handle static assets
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((networkResponse) => {
              // Cache successful responses
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return networkResponse;
            });
        })
    );
  } else if (url.pathname.startsWith('/api/')) {
    // Handle API requests
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful API responses for a short time
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return networkResponse;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request);
        })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      handleBackgroundSync()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {

  const options = {
    body: event.data ? event.data.text() : 'New notification from LATS POS',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('LATS POS System', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for background sync
async function handleBackgroundSync() {
  try {
    // Handle any pending offline actions

    // You can implement specific sync logic here
    // For example, sync offline sales, upload pending data, etc.
    
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});