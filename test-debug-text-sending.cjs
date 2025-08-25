#!/usr/bin/env node

/**
 * Test Debug Text Sending
 * This script tests the enhanced debug logging for text message sending
 */

const BASE_URL = 'https://inauzwa.store';

console.log('🧪 Testing Debug Text Sending');
console.log('==============================\n');

async function testDebugTextSending() {
  const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔍 [${testId}] Starting debug text sending test...\n`);
  
  // Test 1: Health check
  console.log('1️⃣ Testing proxy health check...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/whatsapp-proxy-forgiving.php`, {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health check passed');
      console.log('   📊 Response:', {
        status: healthData.status,
        function: healthData.function,
        request_id: healthData.request_id
      });
    } else {
      console.log(`   ❌ Health check failed: ${healthResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`);
  }
  
  // Test 2: Send test message
  console.log('\n2️⃣ Testing message sending with debug logging...');
  try {
    const testMessage = {
      action: 'sendMessage',
      data: {
        chatId: '255746605561@c.us',
        message: `🧪 Debug test message from ${testId} - ${new Date().toISOString()}`
      }
    };
    
    console.log('   📤 Sending test message...');
    console.log('   📋 Request:', {
      action: testMessage.action,
      chatId: testMessage.data.chatId,
      messageLength: testMessage.data.message.length,
      messagePreview: testMessage.data.message.substring(0, 50) + '...'
    });
    
    const sendResponse = await fetch(`${BASE_URL}/api/whatsapp-proxy-forgiving.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Test-Script/1.0'
      },
      body: JSON.stringify(testMessage)
    });
    
    const sendData = await sendResponse.json();
    
    console.log('   📊 Response received:', {
      status: sendResponse.status,
      hasRequestId: !!sendData.request_id,
      requestId: sendData.request_id,
      success: sendResponse.ok
    });
    
    if (sendResponse.ok) {
      console.log('   ✅ Message sent successfully!');
      console.log('   📝 Response details:', {
        idMessage: sendData.idMessage,
        status: sendData.status
      });
    } else {
      console.log('   ❌ Message send failed');
      console.log('   📝 Error details:', {
        error: sendData.error,
        message: sendData.message,
        request_id: sendData.request_id
      });
    }
  } catch (error) {
    console.log(`   ❌ Message send error: ${error.message}`);
  }
  
  // Test 3: Test invalid request
  console.log('\n3️⃣ Testing invalid request handling...');
  try {
    const invalidMessage = {
      action: 'sendMessage',
      data: {
        // Missing chatId and message
      }
    };
    
    console.log('   📤 Sending invalid request (missing data)...');
    
    const invalidResponse = await fetch(`${BASE_URL}/api/whatsapp-proxy-forgiving.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Test-Script/1.0'
      },
      body: JSON.stringify(invalidMessage)
    });
    
    const invalidData = await invalidResponse.json();
    
    console.log('   📊 Invalid request response:', {
      status: invalidResponse.status,
      hasRequestId: !!invalidData.request_id,
      requestId: invalidData.request_id,
      error: invalidData.error,
      message: invalidData.message
    });
    
    if (invalidResponse.status === 400) {
      console.log('   ✅ Invalid request properly handled');
    } else {
      console.log('   ⚠️ Unexpected response for invalid request');
    }
  } catch (error) {
    console.log(`   ❌ Invalid request test error: ${error.message}`);
  }
  
  // Test 4: Test empty request
  console.log('\n4️⃣ Testing empty request handling...');
  try {
    console.log('   📤 Sending empty request...');
    
    const emptyResponse = await fetch(`${BASE_URL}/api/whatsapp-proxy-forgiving.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Test-Script/1.0'
      },
      body: ''
    });
    
    const emptyData = await emptyResponse.json();
    
    console.log('   📊 Empty request response:', {
      status: emptyResponse.status,
      hasRequestId: !!emptyData.request_id,
      requestId: emptyData.request_id,
      error: emptyData.error,
      message: emptyData.message
    });
    
    if (emptyResponse.status === 400) {
      console.log('   ✅ Empty request properly handled');
    } else {
      console.log('   ⚠️ Unexpected response for empty request');
    }
  } catch (error) {
    console.log(`   ❌ Empty request test error: ${error.message}`);
  }
  
  // Test 5: Test invalid JSON
  console.log('\n5️⃣ Testing invalid JSON handling...');
  try {
    console.log('   📤 Sending invalid JSON...');
    
    const invalidJsonResponse = await fetch(`${BASE_URL}/api/whatsapp-proxy-forgiving.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Test-Script/1.0'
      },
      body: '{"invalid": json, "missing": quotes}'
    });
    
    const invalidJsonData = await invalidJsonResponse.json();
    
    console.log('   📊 Invalid JSON response:', {
      status: invalidJsonResponse.status,
      hasRequestId: !!invalidJsonData.request_id,
      requestId: invalidJsonData.request_id,
      error: invalidJsonData.error,
      message: invalidJsonData.message
    });
    
    if (invalidJsonResponse.status === 400) {
      console.log('   ✅ Invalid JSON properly handled');
    } else {
      console.log('   ⚠️ Unexpected response for invalid JSON');
    }
  } catch (error) {
    console.log(`   ❌ Invalid JSON test error: ${error.message}`);
  }
  
  console.log('\n🎯 Debug Text Sending Test Summary');
  console.log('==================================');
  console.log('✅ All tests completed');
  console.log('📋 Check server logs for detailed debug information');
  console.log('🔍 Look for request IDs in logs to trace specific requests');
  console.log('📊 Monitor browser console for frontend debug logs');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Check server error logs for detailed debug information');
  console.log('2. Monitor browser console when sending messages from the UI');
  console.log('3. Look for request IDs to correlate frontend and backend logs');
  console.log('4. Test actual message sending in the WhatsApp Hub');
}

// Run the test
testDebugTextSending().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
