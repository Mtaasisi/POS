#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔧 Browser DNS Resolution Fix');
console.log('==============================\n');

console.log('📋 The issue: Your browser cannot resolve the Supabase domain');
console.log('   Terminal can access it, but browser cannot');
console.log('   This is a common DNS caching issue\n');

console.log('🔧 Solutions to try:\n');

console.log('1️⃣  Clear Browser DNS Cache:');
console.log('   Chrome/Edge:');
console.log('   - Open chrome://net-internals/#dns');
console.log('   - Click "Clear host cache"');
console.log('   - Also try chrome://net-internals/#sockets');
console.log('   - Click "Flush socket pools"\n');

console.log('2️⃣  Clear System DNS Cache:');
console.log('   macOS:');
console.log('   - Open Terminal and run: sudo dscacheutil -flushcache');
console.log('   - Also run: sudo killall -HUP mDNSResponder\n');

console.log('3️⃣  Try Different Browser:');
console.log('   - Test with Safari, Firefox, or another browser');
console.log('   - This will help isolate if it\'s browser-specific\n');

console.log('4️⃣  Check Network Settings:');
console.log('   - Go to System Preferences > Network');
console.log('   - Check if you\'re using a VPN or proxy');
console.log('   - Try switching DNS servers (8.8.8.8, 1.1.1.1)\n');

console.log('5️⃣  Restart Development Server:');
console.log('   - Stop your dev server (Ctrl+C)');
console.log('   - Clear any cached files: rm -rf node_modules/.vite');
console.log('   - Restart: npm run dev\n');

console.log('6️⃣  Test Direct API Call:');
console.log('   - Open browser console and try:');
console.log('   fetch("https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/devices?select=count&limit=1", {');
console.log('     headers: {');
console.log('       "apikey": "your_anon_key",');
console.log('       "Authorization": "Bearer your_anon_key"');
console.log('     }');
console.log('   })');

console.log('\n🚀 Quick Fix Commands:');
console.log('=====================');
console.log('Run these commands in terminal:');
console.log('');
console.log('sudo dscacheutil -flushcache');
console.log('sudo killall -HUP mDNSResponder');
console.log('npm run dev');
