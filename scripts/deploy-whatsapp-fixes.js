#!/usr/bin/env node

/**
 * Deployment script for WhatsApp fixes
 * Uploads the updated files to fix the direct API call issues
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying WhatsApp Fixes');
console.log('==========================\n');

// Files that need to be uploaded
const filesToUpload = [
  {
    source: 'hostinger-deploy/api/whatsapp-proxy.php',
    destination: 'api/whatsapp-proxy.php',
    description: 'Updated WhatsApp proxy with new endpoints'
  },
  {
    source: 'dist/',
    destination: 'public_html/',
    description: 'New build files with proxy fixes'
  }
];

console.log('📋 Files to upload:');
filesToUpload.forEach(file => {
  console.log(`  ✅ ${file.source} → ${file.destination} (${file.description})`);
});

console.log('\n📝 Deployment Instructions:');
console.log('==========================');
console.log('');
console.log('1. 📁 Upload the updated PHP proxy file:');
console.log('   - Copy: hostinger-deploy/api/whatsapp-proxy.php');
console.log('   - To: your-server/api/whatsapp-proxy.php');
console.log('');
console.log('2. 📦 Upload the new build files:');
console.log('   - Copy: dist/* (all files)');
console.log('   - To: your-server/public_html/');
console.log('');
console.log('3. 🔄 Clear browser cache and reload the page');
console.log('');
console.log('4. 🧪 Test the fixes:');
console.log('   - Check browser console for errors');
console.log('   - Test WhatsApp functionality');
console.log('   - Verify auto-reply and AI features work');
console.log('');
console.log('⚠️  Important Notes:');
console.log('==================');
console.log('• The old build files contain direct API calls that cause 429/466 errors');
console.log('• The new build files use the proxy instead of direct calls');
console.log('• Make sure to upload ALL files from the dist/ directory');
console.log('• Clear browser cache to ensure new files are loaded');
console.log('');
console.log('🔧 If issues persist:');
console.log('===================');
console.log('• Check that the PHP proxy file is accessible at /api/whatsapp-proxy.php');
console.log('• Verify the proxy returns 200 for health checks');
console.log('• Check server logs for any PHP errors');
console.log('• Ensure CORS headers are properly set');

// Check if files exist
console.log('\n🔍 File Check:');
filesToUpload.forEach(file => {
  if (fs.existsSync(file.source)) {
    console.log(`  ✅ ${file.source} exists`);
  } else {
    console.log(`  ❌ ${file.source} missing`);
  }
});

console.log('\n🎯 Ready for deployment!');
