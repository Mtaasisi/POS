
// Disabled service worker for development
self.addEventListener('install', () => {
  console.log('Service worker disabled for development');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service worker disabled for development');
  self.clients.claim();
});

// Remove the no-op fetch handler to avoid overhead warning
// self.addEventListener('fetch', (event) => {
//   // Do nothing - let all requests pass through
//   return;
// });
