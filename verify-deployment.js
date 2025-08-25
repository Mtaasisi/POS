#!/usr/bin/env node

/**
 * Verify New Build Deployment
 */

const BASE_URL = 'https://inauzwa.store';

async function verifyDeployment() {
  console.log('🔍 Verifying New Build Deployment...\n');
  
  const filesToCheck = [
    { path: '/', name: 'Main HTML', expectedStatus: 200 },
    { path: '/assets/index-BtngQ0mj.js', name: 'Main JS Bundle', expectedStatus: 200 },
    { path: '/assets/index-D9X3EtCY.css', name: 'Main CSS Bundle', expectedStatus: 200 },
    { path: '/api/whatsapp-proxy-forgiving.php', name: 'WhatsApp Proxy', expectedStatus: 200 },
    { path: '/.htaccess', name: 'HTAccess File', expectedStatus: 200 }
  ];
  
  let allPassed = true;
  
  for (const file of filesToCheck) {
    try {
      const response = await fetch(`${BASE_URL}${file.path}`, {
        method: file.path === '/api/whatsapp-proxy-forgiving.php' ? 'POST' : 'GET',
        headers: file.path === '/api/whatsapp-proxy-forgiving.php' ? { 'Content-Type': 'application/json' } : {},
        body: file.path === '/api/whatsapp-proxy-forgiving.php' ? JSON.stringify({ action: 'health' }) : undefined
      });
      
      if (response.status === file.expectedStatus) {
        console.log(`   ✅ ${file.name}: ${response.status}`);
        if (file.path === '/assets/index-BtngQ0mj.js') {
          const size = response.headers.get('content-length');
          console.log(`      📦 Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
        }
      } else {
        console.log(`   ❌ ${file.name}: ${response.status} (expected ${file.expectedStatus})`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${file.name}: Error - ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n🎯 Deployment Verification Summary');
  console.log('==================================');
  if (allPassed) {
    console.log('✅ All files deployed successfully!');
    console.log('🚀 Your application with debug logging is now live!');
    console.log('\n📝 Next Steps:');
    console.log('1. Test message sending in WhatsApp Hub');
    console.log('2. Monitor browser console for debug logs');
    console.log('3. Check server logs for backend debug information');
  } else {
    console.log('❌ Some files failed verification');
    console.log('🔧 Please check your upload and try again');
  }
}

verifyDeployment().catch(console.error);
