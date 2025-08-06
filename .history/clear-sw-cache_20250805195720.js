// Script to clear Service Worker cache
console.log('🔧 Clearing Service Worker cache...');

// This script should be run in the browser console
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('✅ Service Worker unregistered');
    }
  });
  
  // Clear all caches
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
      console.log('✅ Cache deleted:', name);
    }
  });
}

console.log('🎯 Please refresh the page after running this script'); 