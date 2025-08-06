import fs from 'fs';
import path from 'path';

console.log('🔧 Temporarily disabling service worker for development...');

const swPath = path.join(process.cwd(), 'public', 'sw.js');
const swBackupPath = path.join(process.cwd(), 'public', 'sw.js.backup');

try {
  // Check if service worker exists
  if (fs.existsSync(swPath)) {
    // Create backup
    fs.copyFileSync(swPath, swBackupPath);
    console.log('✅ Created backup of service worker');
    
    // Create a minimal service worker that does nothing
    const minimalSW = `
// Disabled service worker for development
self.addEventListener('install', () => {
  console.log('Service worker disabled for development');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service worker disabled for development');
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Do nothing - let all requests pass through
  return;
});
`;
    
    fs.writeFileSync(swPath, minimalSW);
    console.log('✅ Service worker disabled for development');
    console.log('💡 To restore: node restore-sw.mjs');
  } else {
    console.log('ℹ️ No service worker found to disable');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Create restore script
const restoreScript = `
import fs from 'fs';
import path from 'path';

console.log('🔧 Restoring original service worker...');

const swPath = path.join(process.cwd(), 'public', 'sw.js');
const swBackupPath = path.join(process.cwd(), 'public', 'sw.js.backup');

try {
  if (fs.existsSync(swBackupPath)) {
    fs.copyFileSync(swBackupPath, swPath);
    fs.unlinkSync(swBackupPath);
    console.log('✅ Service worker restored');
  } else {
    console.log('ℹ️ No backup found to restore');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
`;

fs.writeFileSync('restore-sw.mjs', restoreScript);
console.log('✅ Created restore script: restore-sw.mjs'); 