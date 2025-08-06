// Service Worker for Clean App
const CACHE_NAME = 'clean-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg'
];

// Routes that should be handled by the app router (not cached)
const appRoutes = [
  '/settings',
  '/customers',
  '/devices',
  '/inventory',
  '/payments',
  '/reports',
  '/admin',
  '/pos',
  '/pos-sales',
  '/delivery-options'
];

// Check if we're in development mode
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('Some resources failed to cache:', error);
          // Continue even if some resources fail to cache
          return Promise.resolve();
        });
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  
  // Skip service worker for API calls and app routes
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('.') || 
      appRoutes.some(route => pathname.startsWith(route))) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch((error) => {
          console.warn('Fetch failed for:', event.request.url, error);
          
          // Return a fallback response for HTML requests
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          
          // Return a simple error response for other requests
          return new Response('Network error', { 
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 