#!/usr/bin/env node

/**
 * Quick Credential Test
 * Test new Green API credentials
 */

import fetch from 'node-fetch';

const instanceId = process.argv[2];
const apiToken = process.argv[3];

if (!instanceId || !apiToken) {
  console.log('❌ Usage: node scripts/quick-test-credentials.js <instanceId> <apiToken>');
  console.log('Example: node scripts/quick-test-credentials.js 1234567890 abc123def456');
  process.exit(1);
}

async function testCredentials() {
  console.log('🧪 Testing credentials...');
  console.log('Instance ID:', instanceId);
  console.log('API Token:', apiToken);
  
  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/getStateInstance?token=${apiToken}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Credentials are valid!');
      console.log('📊 Instance State:', data.stateInstance);
      console.log('🎉 You can now use these credentials in your app!');
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED! Credentials are invalid');
      console.log('📊 Status:', response.status);
      console.log('📊 Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testCredentials();
