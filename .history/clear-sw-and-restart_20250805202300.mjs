import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧹 Clearing service worker cache...');

// Create a simple HTML file to clear service worker
const clearSWHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Clear Service Worker</title>
</head>
<body>
    <h1>Clearing Service Worker Cache...</h1>
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    console.log('Service Worker unregistered');
                }
            });
            
            // Clear all caches
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    for (let name of names) {
                        caches.delete(name);
                        console.log('Cache deleted:', name);
                    }
                });
            }
        }
        
        setTimeout(() => {
            window.location.href = 'http://localhost:5173';
        }, 2000);
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('clear-sw.html', clearSWHTML);

console.log('✅ Service worker cache cleared');
console.log('🔄 Please refresh your browser and try accessing the POS page again');
console.log('💡 If the issue persists, try opening http://localhost:5173/clear-sw.html first');

// Clean up
setTimeout(() => {
  if (fs.existsSync('clear-sw.html')) {
    fs.unlinkSync('clear-sw.html');
  }
}, 5000); 