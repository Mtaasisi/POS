#!/usr/bin/env node

// Test Hostinger API Connection
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables
config({ path: './backup.env' });

const HOSTINGER_API_TOKEN = process.env.HOSTINGER_API_TOKEN;
const HOSTINGER_API_URL = process.env.HOSTINGER_API_URL || 'https://api.hostinger.com/v1';

console.log('🔧 Testing Hostinger API Connection...');
console.log(`📋 API URL: ${HOSTINGER_API_URL}`);
console.log(`🔑 API Token: ${HOSTINGER_API_TOKEN ? 'Configured' : 'NOT CONFIGURED'}`);

async function testHostingerConnection() {
  if (!HOSTINGER_API_TOKEN) {
    console.log('❌ HOSTINGER_API_TOKEN not configured in backup.env');
    console.log('💡 Get your API token from Hostinger Control Panel > Advanced > API');
    return;
  }

  const endpoints = [
    'https://api.hostinger.com/v1',
    'https://api.hostinger.com',
    'https://api.hostinger.com/v2',
    'https://api.hostinger.com/api/v1',
    'https://api.hostinger.com/api'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing endpoint: ${endpoint}`);
      
      // Test 1: Basic connectivity
      console.log('📡 Testing basic connectivity...');
      const response = await fetch(`${endpoint}/domains`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`📊 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API connection successful!');
        console.log(`📋 Available domains: ${data.domains?.length || 0}`);
        return { success: true, endpoint, data };
      } else {
        const errorText = await response.text();
        console.log(`❌ API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Connection error: ${error.message}`);
      
      if (error.code === 'ENOTFOUND') {
        console.log('🌐 DNS resolution failed - check internet connection');
      } else if (error.message.includes('timeout')) {
        console.log('⏰ Request timed out - check network connection');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('🚫 Connection refused - endpoint might be incorrect');
      }
    }
  }

  console.log('\n❌ All endpoints failed');
  console.log('💡 Troubleshooting steps:');
  console.log('   1. Check your internet connection');
  console.log('   2. Verify the API token is correct');
  console.log('   3. Try using a different DNS server');
  console.log('   4. Check if api.hostinger.com is accessible');
  
  return { success: false };
}

async function testFileUpload() {
  if (!HOSTINGER_API_TOKEN) {
    console.log('❌ Cannot test file upload without API token');
    return;
  }

  console.log('\n📁 Testing file upload functionality...');
  
  // Create a test file
  const testFile = './test-upload.json';
  const testData = { test: 'data', timestamp: new Date().toISOString() };
  
  try {
    await fs.promises.writeFile(testFile, JSON.stringify(testData));
    console.log('✅ Test file created');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));
    formData.append('path', '/backups/supabase/test-upload.json');
    
    const response = await fetch('https://api.hostinger.com/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData,
      timeout: 30000
    });
    
    console.log(`📊 Upload response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ File upload successful!');
      console.log('📋 Upload result:', result);
    } else {
      const errorText = await response.text();
      console.log(`❌ Upload failed: ${response.status} - ${errorText}`);
    }
    
    // Clean up test file
    await fs.promises.unlink(testFile);
    
  } catch (error) {
    console.log(`❌ Upload test error: ${error.message}`);
  }
}

// Run tests
async function runTests() {
  const connectionResult = await testHostingerConnection();
  
  if (connectionResult?.success) {
    await testFileUpload();
  }
  
  console.log('\n🎯 Summary:');
  if (connectionResult?.success) {
    console.log('✅ Hostinger API is working');
    console.log('💡 Backup should work with proper configuration');
  } else {
    console.log('❌ Hostinger API connection failed');
    console.log('💡 Check your API token and internet connection');
  }
}

runTests().catch(console.error); 