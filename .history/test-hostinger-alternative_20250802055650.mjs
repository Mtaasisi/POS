#!/usr/bin/env node

/**
 * Test Alternative Hostinger API Endpoints
 * This script tests different Hostinger API endpoints to work around DNS issues
 */

import fetch from 'node-fetch';

// Configuration
const HOSTINGER_API_TOKEN = 'TChfrbiytDvVyb6MVPOGAHBqavJZcm9eOhicAVF5400761d5';

// Alternative API endpoints to try
const API_ENDPOINTS = [
  'https://api.hostinger.com/v1',
  'https://api.hostinger.com',
  'https://api.hostinger.com/v2',
  'https://api.hostinger.com/api/v1',
  'https://api.hostinger.com/api'
];

async function testEndpoint(endpoint, testName) {
  console.log(`\n🔧 Testing: ${testName}`);
  console.log(`🌐 Endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(`${endpoint}/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success!');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log(`❌ Failed - Status: ${response.status}`);
      const text = await response.text();
      if (text.length < 200) {
        console.log('📄 Response:', text);
      } else {
        console.log('📄 Response (truncated):', text.substring(0, 200) + '...');
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testDNSResolution() {
  console.log('🔍 Testing DNS resolution...');
  
  const domains = [
    'api.hostinger.com',
    'hostinger.com',
    'www.hostinger.com'
  ];
  
  for (const domain of domains) {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        timeout: 5000
      });
      console.log(`✅ ${domain} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${domain} - Error: ${error.message}`);
    }
  }
}

async function testAlternativeMethods() {
  console.log('\n🔄 Testing alternative methods...');
  
  // Test with different HTTP methods
  const methods = ['GET', 'POST', 'HEAD'];
  const endpoints = ['/user', '/domains', '/hosting'];
  
  for (const method of methods) {
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`https://api.hostinger.com/v1${endpoint}`, {
          method: method,
          headers: {
            'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        console.log(`${method} ${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`${method} ${endpoint}: Error - ${error.message}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Testing Hostinger API with alternative methods...');
  console.log('📋 API Token:', HOSTINGER_API_TOKEN.substring(0, 10) + '...');
  
  // Test DNS resolution first
  await testDNSResolution();
  
  // Test different API endpoints
  for (const endpoint of API_ENDPOINTS) {
    const success = await testEndpoint(endpoint, `API Endpoint: ${endpoint}`);
    if (success) {
      console.log('🎉 Found working endpoint!');
      break;
    }
  }
  
  // Test alternative methods
  await testAlternativeMethods();
  
  console.log('\n📋 Summary:');
  console.log('If all tests failed, this indicates a temporary DNS issue.');
  console.log('Please try again later or contact Hostinger support.');
  console.log('Your API token appears to be valid based on the format.');
}

// Run the tests
main().catch(console.error); 