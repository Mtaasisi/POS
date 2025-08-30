#!/usr/bin/env node

/**
 * Troubleshoot Green API Instance
 * Help diagnose why credentials are returning 403
 */

import fetch from 'node-fetch';

const instanceId = process.argv[2];
const apiToken = process.argv[3];

if (!instanceId || !apiToken) {
  console.log('❌ Usage: node scripts/troubleshoot-instance.js <instanceId> <apiToken>');
  console.log('Example: node scripts/troubleshoot-instance.js 7105284900 b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294');
  process.exit(1);
}

async function troubleshootInstance() {
  console.log('🔍 Troubleshooting Green API Instance');
  console.log('=====================================\n');
  
  console.log('📊 Instance Details:');
  console.log('Instance ID:', instanceId);
  console.log('API Token:', apiToken);
  console.log('API URL: https://7105.api.greenapi.com\n');

  const tests = [
    {
      name: 'Get State Instance',
      url: `https://7105.api.greenapi.com/waInstance${instanceId}/getStateInstance?token=${apiToken}`,
      method: 'GET'
    },
    {
      name: 'Get QR Code',
      url: `https://7105.api.greenapi.com/waInstance${instanceId}/qr?token=${apiToken}`,
      method: 'GET'
    },
    {
      name: 'Get Settings',
      url: `https://7105.api.greenapi.com/waInstance${instanceId}/getSettings?token=${apiToken}`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ FAILED');
        console.log('Error:', errorText);
        
        if (response.status === 403) {
          console.log('💡 Possible causes:');
          console.log('   • Instance not activated');
          console.log('   • Wrong credentials');
          console.log('   • Instance deleted/disabled');
          console.log('   • Need to generate QR code first');
        }
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
    
    console.log('');
  }

  console.log('📋 Troubleshooting Steps:');
  console.log('1. Go to https://console.green-api.com/');
  console.log('2. Check if instance is active/online');
  console.log('3. Try generating a QR code');
  console.log('4. Check if WhatsApp is authorized');
  console.log('5. Verify credentials are correct');
  console.log('6. Try creating a new instance if needed');
}

troubleshootInstance();
