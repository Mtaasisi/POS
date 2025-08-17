#!/usr/bin/env node

/**
 * 504 Error Diagnostic Script
 * This script helps diagnose the source of 504 Gateway Timeout errors
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 504 Error Diagnostic Tool');
console.log('============================\n');

// Test 1: Check if server is responding
console.log('1. Testing server response...');
const testServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET',
      timeout: 10000 // 10 second timeout
    }, (res) => {
      console.log(`   ✅ Server responded with status: ${res.statusCode}`);
      console.log(`   📊 Response headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve(res);
    });

    req.on('error', (err) => {
      console.log(`   ❌ Server error: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('   ⏰ Request timed out');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Test 2: Check if port is in use
console.log('\n2. Checking port availability...');
const checkPort = () => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(5173, () => {
      console.log('   ✅ Port 5173 is available');
      server.close();
      resolve(true);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('   ❌ Port 5173 is already in use');
        console.log('   💡 Try: lsof -ti:5173 | xargs kill -9');
      } else {
        console.log(`   ❌ Port error: ${err.message}`);
      }
      resolve(false);
    });
  });
};

// Test 3: Check file system access
console.log('\n3. Checking file system access...');
const checkFiles = () => {
  const files = [
    'index.html',
    'src/main.tsx',
    'src/App.tsx',
    'vite.config.ts',
    'package.json'
  ];

  files.forEach(file => {
    try {
      fs.accessSync(file, fs.constants.R_OK);
      console.log(`   ✅ ${file} is accessible`);
    } catch (err) {
      console.log(`   ❌ ${file} is not accessible: ${err.message}`);
    }
  });
};

// Test 4: Check Node.js version
console.log('\n4. Checking Node.js version...');
console.log(`   📦 Node.js version: ${process.version}`);

// Test 5: Check npm packages
console.log('\n5. Checking npm packages...');
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`   📦 Project name: ${packageJson.name}`);
  console.log(`   📦 Vite version: ${packageJson.devDependencies?.vite || 'Not found'}`);
  console.log(`   📦 React version: ${packageJson.dependencies?.react || 'Not found'}`);
} catch (err) {
  console.log(`   ❌ Could not read package.json: ${err.message}`);
}

// Run all tests
async function runDiagnostics() {
  try {
    await testServer();
  } catch (err) {
    console.log(`   ❌ Server test failed: ${err.message}`);
  }

  await checkPort();
  checkFiles();

  console.log('\n📋 Summary:');
  console.log('===========');
  console.log('If you\'re still getting 504 errors:');
  console.log('1. Clear your browser cache (Cmd+Shift+Delete on Mac)');
  console.log('2. Try accessing the app in an incognito window');
  console.log('3. Check the browser\'s Network tab for specific failed requests');
  console.log('4. Restart the development server: npm run dev');
  console.log('5. Check if any antivirus or firewall is blocking the connection');
  console.log('\n🔧 The server should now have improved timeout handling and CORS support.');
}

runDiagnostics().catch(console.error);
