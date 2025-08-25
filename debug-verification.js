/**
 * Debug Webhook Verification
 */

import fetch from 'node-fetch';

const webhookUrl = 'http://localhost:8888/api/whatsapp-official-webhook';
const verifyToken = 'LATS_VERIFY_2024';

async function testVerification() {
  console.log('🔍 Testing webhook verification...');
  
  try {
    const challenge = 'test_challenge_' + Date.now();
    const verifyUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challenge}`;
    
    console.log(`📡 URL: ${verifyUrl}`);
    
    const response = await fetch(verifyUrl);
    const body = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response: ${body}`);
    console.log(`📋 Expected: ${challenge}`);
    console.log(`📋 Match: ${body === challenge ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testVerification();
