#!/usr/bin/env node

/**
 * Quick Fix for CORS Issues
 * This script provides immediate solutions for the CORS problems
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Quick Fix for CORS Issues');
console.log('============================\n');

console.log('📋 Current Issues:');
console.log('1. CORS policy blocking requests from localhost:5173');
console.log('2. Green API proxy not accessible');
console.log('3. Direct Green API calls blocked by CORS\n');

console.log('🚀 Solutions:\n');

console.log('Option 1: Start Development Proxy (Recommended)');
console.log('Run this command in a new terminal:');
console.log('npm run dev:proxy\n');

console.log('Option 2: Start Both Dev Server and Proxy');
console.log('Run this command in a new terminal:');
console.log('npm run dev:with-proxy\n');

console.log('Option 3: Manual Fix');
console.log('1. Open a new terminal');
console.log('2. Navigate to your project directory');
console.log('3. Run: node scripts/dev-proxy.js');
console.log('4. Keep that terminal open');
console.log('5. In another terminal, run: npm run dev\n');

console.log('🔍 Testing the fix:');
console.log('1. Start the proxy server');
console.log('2. Open your app in the browser');
console.log('3. Navigate to WhatsApp settings');
console.log('4. Check browser console for CORS errors\n');

console.log('📝 If you still see CORS errors:');
console.log('1. Make sure the proxy server is running on port 8888');
console.log('2. Check that your app is running on localhost:5173');
console.log('3. Verify the proxy server shows "🚀 Local Green API proxy running"');
console.log('4. Try refreshing the browser page\n');

console.log('🛠️ Alternative: Use Browser Extension');
console.log('Install a CORS browser extension like "CORS Unblock" for Chrome');
console.log('This will bypass CORS restrictions during development\n');

// Check if proxy server is already running
async function checkProxyServer() {
  try {
    const response = await fetch('http://localhost:8888/health');
    if (response.ok) {
      console.log('✅ Proxy server is already running!');
      return true;
    }
  } catch (error) {
    console.log('❌ Proxy server is not running');
    return false;
  }
}

// Offer to start the proxy server
console.log('🤖 Would you like me to start the proxy server now? (y/n)');

// Note: This is a simplified version. In a real implementation, you'd want to handle user input
console.log('💡 Tip: Run "npm run dev:proxy" in a new terminal to start the proxy server automatically');

console.log('\n📚 For more information, see: docs/GREEN_API_FIXES.md');
