#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://inauzwa.store';
const NEW_JS_FILE = 'index-DAJ8qQGD.js';
const OLD_JS_FILE = 'index-BtngQ0mj.js';

console.log('🔍 Verifying New Build Deployment...\n');

// Check if new file exists locally
const localNewFile = path.join(__dirname, 'dist', 'assets', NEW_JS_FILE);
const localOldFile = path.join(__dirname, 'dist', 'assets', OLD_JS_FILE);

console.log('📁 Local Files:');
console.log(`   New build: ${NEW_JS_FILE} - ${fs.existsSync(localNewFile) ? '✅ Exists' : '❌ Missing'}`);
console.log(`   Old build: ${OLD_JS_FILE} - ${fs.existsSync(localOldFile) ? '✅ Exists' : '❌ Missing'}`);

if (fs.existsSync(localNewFile)) {
  const stats = fs.statSync(localNewFile);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);
}

// Function to check remote file
function checkRemoteFile(filename) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}/assets/${filename}`;
    https.get(url, (res) => {
      resolve({
        filename,
        status: res.statusCode,
        exists: res.statusCode === 200,
        size: res.headers['content-length'] ? parseInt(res.headers['content-length']) : 0
      });
    }).on('error', () => {
      resolve({
        filename,
        status: 0,
        exists: false,
        size: 0
      });
    });
  });
}

// Check remote files
async function checkDeployment() {
  console.log('🌐 Remote Files:');
  
  const newFile = await checkRemoteFile(NEW_JS_FILE);
  const oldFile = await checkRemoteFile(OLD_JS_FILE);
  
  console.log(`   New build: ${NEW_JS_FILE} - ${newFile.exists ? '✅ Deployed' : '❌ Not deployed'} (${newFile.status})`);
  if (newFile.exists) {
    console.log(`   Size: ${(newFile.size / 1024 / 1024).toFixed(2)} MB`);
  }
  
  console.log(`   Old build: ${OLD_JS_FILE} - ${oldFile.exists ? '⚠️  Still exists' : '✅ Removed'} (${oldFile.status})`);
  
  console.log('\n📊 Deployment Status:');
  
  if (newFile.exists && !oldFile.exists) {
    console.log('   ✅ Perfect! New build deployed, old build removed');
  } else if (newFile.exists && oldFile.exists) {
    console.log('   ⚠️  New build deployed, but old build still exists (may cause caching issues)');
  } else if (!newFile.exists && oldFile.exists) {
    console.log('   ❌ New build not deployed, old build still exists');
  } else {
    console.log('   ❌ Neither build is accessible');
  }
  
  console.log('\n🎯 Next Steps:');
  if (newFile.exists) {
    console.log('   1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('   2. Test the application in incognito/private mode');
    console.log('   3. Check browser console for any remaining errors');
  } else {
    console.log('   1. Upload the dist/ folder contents to your web server');
    console.log('   2. Ensure index-DAJ8qQGD.js is uploaded to /assets/');
    console.log('   3. Run this verification script again');
  }
}

checkDeployment().catch(console.error);
