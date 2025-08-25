
// Completely disabled service worker for development
console.log('Service worker disabled for development');

// Don't register any event listeners in development
if (false) {
  self.addEventListener('install', () => {
    console.log('Service worker disabled for development');
    self.skipWaiting();
  });

  self.addEventListener('activate', () => {
    console.log('Service worker disabled for development');
    self.clients.claim();
  });

  // Explicitly ignore TypeScript file requests
  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ignore TypeScript file requests
    if (url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx')) {
      console.log('Ignoring TypeScript file request:', url.pathname);
      event.respondWith(new Response('TypeScript files should not be requested directly', { status: 404 }));
      return;
    }
    
    // Let all other requests pass through normally
    return;
  });
}

const CACHE_NAME = 'lats-chance-v1.0.0';
const STATIC_CACHE = 'lats-static-v1.0.0';
const DYNAMIC_CACHE = 'lats-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_CACHE = [
  '/api/dashboard',
  '/api/inventory',
  '/api/customers',
  '/api/appointments'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static file requests
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Only cache GET requests - POST requests cannot be cached
      if (request.method === 'GET') {
        try {
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(request, networkResponse.clone());
        } catch (cacheError) {
          console.log('Service Worker: Failed to cache response', cacheError);
        }
      }
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    // Only try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'Offline mode - data not available',
        message: 'Please check your internet connection'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Only cache successful responses that are not partial content
    if (networkResponse.ok && networkResponse.status !== 206) {
      // Check if response is cacheable
      const contentType = networkResponse.headers.get('content-type');
      const isCacheable = contentType && (
        contentType.includes('text/') ||
        contentType.includes('application/') ||
        contentType.includes('image/') ||
        contentType.includes('font/')
      );
      
      if (isCacheable) {
        try {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put(request, networkResponse.clone());
        } catch (cacheError) {
          console.log('Service Worker: Failed to cache response', cacheError);
        }
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Cache and network failed', error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Service Worker: Syncing offline data...');
    
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // Sync each offline action
      for (const data of offlineData) {
        try {
          await fetch(data.url, {
            method: data.method,
            headers: data.headers,
            body: data.body
          });
          
          // Remove synced data
          await removeOfflineData(data.id);
        } catch (error) {
          console.error('Service Worker: Error syncing data', error);
        }
      }
    }
    
    console.log('Service Worker: Offline data sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Get offline data (placeholder - implement with IndexedDB)
async function getOfflineData() {
  // This would typically use IndexedDB to store offline actions
  return [];
}

// Remove offline data (placeholder - implement with IndexedDB)
async function removeOfflineData(id) {
  // This would typically remove data from IndexedDB
  return Promise.resolve();
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from LATS CHANCE',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('LATS CHANCE', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
