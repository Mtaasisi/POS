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

// Wait a moment for Netlify to start
setTimeout(() => {
  console.log('\n🌐 Starting Vite dev server...');
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  viteProcess.on('close', (code) => {
    console.log(`\n🛑 Vite dev server stopped (code: ${code})`);
  });

  viteProcess.on('error', (error) => {
    console.error('❌ Error starting Vite dev server:', error.message);
  });
}, 3000);

netlifyProcess.on('close', (code) => {
  console.log(`\n🛑 Netlify dev server stopped (code: ${code})`);
});

netlifyProcess.on('error', (error) => {
  console.error('❌ Error starting Netlify dev server:', error.message);
  console.log('\n💡 Alternative: Start manually with:');
  console.log('   npx netlify dev --port 8889');
});

console.log('\n✅ Development environment starting!');
console.log('📱 Main app: http://localhost:5173 (or next available port)');
console.log('📡 Netlify functions: http://localhost:8889');
console.log('🔧 WhatsApp proxy: http://localhost:8889/.netlify/functions/whatsapp-proxy');
console.log('\nPress Ctrl+C to stop both servers');
