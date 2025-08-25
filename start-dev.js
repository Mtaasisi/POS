#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting LATS CHANCE Development Environment...');
console.log('===============================================\n');

// Function to cleanup on exit
const cleanup = () => {
  console.log('\n🛑 Shutting down development environment...');
  process.exit(0);
};

// Set up signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start Netlify functions on port 8889
console.log('📡 Starting Netlify functions on port 8889...');
const netlifyProcess = spawn('npx', ['netlify', 'dev', '--port', '8889'], {
  stdio: 'inherit',
  cwd: __dirname
});

netlifyProcess.on('close', (code) => {
  console.log(`\n🛑 Netlify dev server stopped (code: ${code})`);
});

netlifyProcess.on('error', (error) => {
  console.error('❌ Error starting Netlify dev server:', error.message);
  console.log('\n💡 Alternative: Start manually with:');
  console.log('   npx netlify dev --port 8889');
});

console.log('\n✅ Development environment started!');
console.log('📱 Main app: http://localhost:5173');
console.log('📡 Netlify functions: http://localhost:8889');
console.log('🔧 WhatsApp proxy: http://localhost:8889/.netlify/functions/whatsapp-proxy');
console.log('\nPress Ctrl+C to stop the server');
