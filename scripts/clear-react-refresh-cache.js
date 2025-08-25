#!/usr/bin/env node

/**
 * Script to clear React refresh cache and localStorage data
 * Run this when experiencing React refresh errors
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing React refresh cache and localStorage data...');

// Clear localStorage data that might cause issues
const localStorageKeysToClear = [
  'pos_setup_complete',
  'postLoginRedirect',
  'scroll-pos-',
  'react-refresh-',
  'vite-'
];

console.log('📋 Clearing localStorage keys:', localStorageKeysToClear);

// Create a simple HTML file that can be opened to clear localStorage
const clearLocalStorageHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Clear LocalStorage</title>
</head>
<body>
    <h1>Clearing LocalStorage...</h1>
    <script>
        const keysToClear = ${JSON.stringify(localStorageKeysToClear)};
        
        console.log('🧹 Clearing localStorage...');
        
        // Clear specific keys
        keysToClear.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log('✅ Cleared:', key);
            }
        });
        
        // Clear all keys that start with certain prefixes
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (key.startsWith('scroll-pos-') || 
                key.startsWith('react-refresh-') || 
                key.startsWith('vite-') ||
                key.includes('pos_setup_complete')) {
                localStorage.removeItem(key);
                console.log('✅ Cleared:', key);
            }
        });
        
        // Clear sessionStorage
        sessionStorage.clear();
        console.log('✅ Cleared sessionStorage');
        
        document.body.innerHTML = '<h1>✅ LocalStorage cleared successfully!</h1><p>You can close this tab now.</p>';
    </script>
</body>
</html>
`;

// Write the HTML file
const htmlPath = path.join(__dirname, 'clear-localstorage.html');
fs.writeFileSync(htmlPath, clearLocalStorageHTML);

console.log('📄 Created clear-localstorage.html');
console.log('🌐 Open this file in your browser to clear localStorage:');
console.log(`   ${htmlPath}`);

// Also clear any Vite cache directories
const viteCacheDirs = [
  path.join(__dirname, '..', 'node_modules', '.vite'),
  path.join(__dirname, '..', '.vite'),
  path.join(__dirname, '..', 'dist', '.vite')
];

viteCacheDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Cleared Vite cache: ${dir}`);
    } catch (error) {
      console.log(`⚠️ Could not clear Vite cache: ${dir}`, error.message);
    }
  }
});

console.log('\n🎉 Cache clearing complete!');
console.log('\n📝 Next steps:');
console.log('1. Open clear-localstorage.html in your browser');
console.log('2. Restart your development server');
console.log('3. Clear your browser cache if needed');
