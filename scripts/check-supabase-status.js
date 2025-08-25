#!/usr/bin/env node

import https from 'https';
import { execSync } from 'child_process';

console.log('🔍 Supabase Project Status Checker');
console.log('=====================================\n');

// Current configuration
const currentUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const currentKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

console.log('📋 Current Configuration:');
console.log(`   URL: ${currentUrl}`);
console.log(`   Key: ${currentKey.substring(0, 20)}...`);
console.log('');

// Test 1: DNS Resolution
console.log('🌐 Testing DNS Resolution...');
try {
  const dnsResult = execSync(`nslookup ${currentUrl.replace('https://', '')}`, { encoding: 'utf8' });
  console.log('✅ DNS Resolution: SUCCESS');
  console.log(`   Result: ${dnsResult.split('\n')[1]}`);
} catch (error) {
  console.log('❌ DNS Resolution: FAILED');
  console.log(`   Error: ${error.message}`);
}
console.log('');

// Test 2: HTTP Connection
console.log('🔗 Testing HTTP Connection...');
const testHttpConnection = (url) => {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✅ HTTP Connection: SUCCESS (Status: ${res.statusCode})`);
      resolve({ success: true, status: res.statusCode });
    });
    
    req.on('error', (error) => {
      console.log(`❌ HTTP Connection: FAILED`);
      console.log(`   Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ HTTP Connection: TIMEOUT');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
};

// Test 3: Supabase API Test
const testSupabaseAPI = async (url, key) => {
  return new Promise((resolve) => {
    const options = {
      hostname: url.replace('https://', ''),
      port: 443,
      path: '/rest/v1/devices?select=count&limit=1',
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Supabase API: SUCCESS');
          console.log(`   Status: ${res.statusCode}`);
        } else {
          console.log(`⚠️  Supabase API: PARTIAL (Status: ${res.statusCode})`);
          console.log(`   Response: ${data.substring(0, 200)}...`);
        }
        resolve({ success: res.statusCode === 200, status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log('❌ Supabase API: FAILED');
      console.log(`   Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log('❌ Supabase API: TIMEOUT');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
};

// Run tests
(async () => {
  console.log('🚀 Running tests...\n');
  
  // Test HTTP connection
  await testHttpConnection(currentUrl);
  console.log('');
  
  // Test Supabase API
  await testSupabaseAPI(currentUrl, currentKey);
  console.log('');
  
  console.log('📊 Summary:');
  console.log('============');
  console.log('If DNS resolution failed: Your Supabase project may have been deleted or suspended.');
  console.log('If HTTP connection failed: There may be network issues or the project is down.');
  console.log('If API test failed: Your API key may be invalid or the project is suspended.');
  console.log('');
  console.log('🔧 Next Steps:');
  console.log('1. Visit https://supabase.com/dashboard to check your project status');
  console.log('2. If the project is gone, create a new one');
  console.log('3. Update your .env file with new credentials');
  console.log('4. Run database migrations on the new project');
})();
