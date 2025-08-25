#!/usr/bin/env node

/**
 * Verify Production Upload
 */

const BASE_URL = 'https://inauzwa.store';

async function verifyUpload() {
  console.log('🔍 Verifying Production Upload...\n');
  
  const criticalFiles = [
    { name: 'Main HTML', url: '/', expectedStatus: 200 },
    { name: 'Main JS Bundle', url: '/assets/index-CZO1v-pa.js', expectedStatus: 200 },
    { name: 'Main CSS Bundle', url: '/assets/index-D9X3EtCY.css', expectedStatus: 200 },
    { name: 'WhatsApp Proxy', url: '/api/whatsapp-proxy-forgiving.php', method: 'POST', body: { action: 'health' }, expectedStatus: 200 }
  ];
  
  let allGood = true;
  
  for (const file of criticalFiles) {
    console.log(`Checking: ${file.name}`);
    try {
      const options = {
        method: file.method || 'GET',
        headers: file.headers || {}
      };
      
      if (file.body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(file.body);
      }
      
      const response = await fetch(`${BASE_URL}${file.url}`, options);
      
      if (response.status === file.expectedStatus) {
        console.log(`  ✅ Success: ${response.status}`);
        
        if (file.url.includes('.js') || file.url.includes('.css')) {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            const size = (contentLength / 1024 / 1024).toFixed(2);
            console.log(`  📦 Size: ${size} MB`);
          }
        }
      } else {
        console.log(`  ❌ Failed: Expected ${file.expectedStatus}, got ${response.status}`);
        allGood = false;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      allGood = false;
    }
    console.log('');
  }
  
  if (allGood) {
    console.log('🎉 All files uploaded successfully!');
    console.log('✅ Your application should now work correctly.');
  } else {
    console.log('⚠️  Some files are missing or not accessible.');
    console.log('📋 Please check the upload instructions and try again.');
  }
}

verifyUpload().catch(console.error);
