#!/usr/bin/env node

/**
 * Test Hostinger API Connection
 * This script tests the Hostinger API connection using the provided token
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const HOSTINGER_API_TOKEN = 'TChfrbiytDvVyb6MVPOGAHBqavJZcm9eOhicAVF5400761d5';
const HOSTINGER_API_URL = 'https://api.hostinger.com/v1';

async function testHostingerAPI() {
  console.log('🔧 Testing Hostinger API connection...');
  console.log('📋 API Token:', HOSTINGER_API_TOKEN.substring(0, 10) + '...');
  console.log('🌐 API URL:', HOSTINGER_API_URL);
  
  try {
    // Test 1: Get user info
    console.log('\n📊 Test 1: Getting user information...');
    const userResponse = await fetch(`${HOSTINGER_API_URL}/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User info retrieved successfully');
      console.log('👤 User:', userData.name || 'N/A');
      console.log('📧 Email:', userData.email || 'N/A');
    } else {
      console.log('❌ Failed to get user info');
      console.log('Status:', userResponse.status);
      console.log('Response:', await userResponse.text());
    }
    
    // Test 2: Get domains
    console.log('\n🌐 Test 2: Getting domains...');
    const domainsResponse = await fetch(`${HOSTINGER_API_URL}/domains`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (domainsResponse.ok) {
      const domainsData = await domainsResponse.json();
      console.log('✅ Domains retrieved successfully');
      console.log('📋 Number of domains:', domainsData.domains?.length || 0);
      if (domainsData.domains && domainsData.domains.length > 0) {
        domainsData.domains.forEach((domain, index) => {
          console.log(`  ${index + 1}. ${domain.name} (${domain.status})`);
        });
      }
    } else {
      console.log('❌ Failed to get domains');
      console.log('Status:', domainsResponse.status);
      console.log('Response:', await domainsResponse.text());
    }
    
    // Test 3: Get hosting accounts
    console.log('\n🏠 Test 3: Getting hosting accounts...');
    const hostingResponse = await fetch(`${HOSTINGER_API_URL}/hosting`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HOSTINGER_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (hostingResponse.ok) {
      const hostingData = await hostingResponse.json();
      console.log('✅ Hosting accounts retrieved successfully');
      console.log('📋 Number of hosting accounts:', hostingData.hosting?.length || 0);
      if (hostingData.hosting && hostingData.hosting.length > 0) {
        hostingData.hosting.forEach((account, index) => {
          console.log(`  ${index + 1}. ${account.domain} (${account.status})`);
        });
      }
    } else {
      console.log('❌ Failed to get hosting accounts');
      console.log('Status:', hostingResponse.status);
      console.log('Response:', await hostingResponse.text());
    }
    
    console.log('\n🎉 Hostinger API test completed!');
    
  } catch (error) {
    console.error('❌ Error testing Hostinger API:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testHostingerAPI(); 