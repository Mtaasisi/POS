#!/usr/bin/env node

/**
 * Start Development Server
 * 
 * This script helps you start the Netlify development server
 * to test the WhatsApp proxy locally.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Netlify Development Server...\n');

// Check if netlify-cli is installed
const checkNetlifyCLI = spawn('npx', ['netlify', '--version'], { stdio: 'pipe' });

checkNetlifyCLI.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Netlify CLI is available');
    startDevServer();
  } else {
    console.log('❌ Netlify CLI not found. Installing...');
    installNetlifyCLI();
  }
});

function installNetlifyCLI() {
  console.log('📦 Installing Netlify CLI...');
  
  const install = spawn('npm', ['install', '-g', 'netlify-cli'], { stdio: 'inherit' });
  
  install.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Netlify CLI installed successfully');
      startDevServer();
    } else {
      console.log('❌ Failed to install Netlify CLI');
      console.log('💡 You can install it manually with: npm install -g netlify-cli');
      console.log('💡 Or use the alternative development approach below');
      showAlternativeApproach();
    }
  });
}

function startDevServer() {
  console.log('🌐 Starting Netlify dev server on port 8888...');
  console.log('📱 This will enable the WhatsApp proxy for local development\n');
  
  const devServer = spawn('npx', ['netlify', 'dev', '--port', '8888'], { 
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  devServer.on('close', (code) => {
    console.log(`\n🛑 Netlify dev server stopped (code: ${code})`);
  });
  
  devServer.on('error', (error) => {
    console.error('❌ Error starting dev server:', error.message);
    showAlternativeApproach();
  });
}

function showAlternativeApproach() {
  console.log('\n💡 Alternative Development Approach:');
  console.log('1. The WhatsApp service will work in development mode without the proxy');
  console.log('2. It will show "Development mode - proxy not running" status');
  console.log('3. Messages will be saved to the database but not sent to WhatsApp');
  console.log('4. This allows you to test the UI and database functionality');
  console.log('\n📋 To test the full functionality:');
  console.log('1. Deploy to Netlify: netlify deploy --prod');
  console.log('2. Test the production version');
  console.log('\n🔧 To run the dev server manually:');
  console.log('npx netlify dev --port 8888');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Development server stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Development server stopped');
  process.exit(0);
});
