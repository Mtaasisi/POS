#!/usr/bin/env node

/**
 * Debug script to help identify WhatsApp frontend issues
 * This will help track down what's causing the 400 error
 */

console.log('🔍 WhatsApp Frontend Debug Script');
console.log('=====================================\n');

// Function to intercept fetch calls and log them
function interceptFetch() {
  const originalFetch = global.fetch || window.fetch;
  
  global.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    // Check if this is a WhatsApp proxy request
    if (typeof url === 'string' && url.includes('whatsapp-proxy')) {
      console.log('📱 WhatsApp Proxy Request Detected:');
      console.log('  URL:', url);
      console.log('  Method:', options.method || 'GET');
      console.log('  Headers:', options.headers);
      
      if (options.body) {
        try {
          const body = JSON.parse(options.body);
          console.log('  Body:', JSON.stringify(body, null, 2));
          
          // Check for common issues
          if (!body.action) {
            console.log('  ❌ ISSUE: Missing action field');
          } else if (body.action === '') {
            console.log('  ❌ ISSUE: Empty action field');
          } else {
            console.log('  ✅ Action field present:', body.action);
          }
        } catch (e) {
          console.log('  ❌ ISSUE: Invalid JSON in body');
          console.log('  Raw body:', options.body);
        }
      } else {
        console.log('  ❌ ISSUE: No request body');
      }
      console.log('');
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Fetch interception enabled');
}

// Function to test common scenarios
async function testCommonScenarios() {
  console.log('🧪 Testing Common Scenarios:\n');
  
  const baseUrl = 'https://inauzwa.store';
  
  // Test 1: Valid request
  console.log('1. Testing valid request...');
  try {
    const response = await fetch(`${baseUrl}/api/whatsapp-proxy-forgiving.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health' })
    });
    console.log('   Status:', response.status);
    const data = await response.json();
    console.log('   Response:', data.status === 'healthy' ? '✅ Success' : '❌ Failed');
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  // Test 2: Missing action
  console.log('\n2. Testing missing action...');
  try {
    const response = await fetch(`${baseUrl}/api/whatsapp-proxy-forgiving.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log('   Status:', response.status);
    const data = await response.json();
    console.log('   Response:', data.error === 'missing_action' ? '✅ Expected error' : '❌ Unexpected response');
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  // Test 3: Empty action
  console.log('\n3. Testing empty action...');
  try {
    const response = await fetch(`${baseUrl}/api/whatsapp-proxy-forgiving.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: '' })
    });
    console.log('   Status:', response.status);
    const data = await response.json();
    console.log('   Response:', data.error === 'missing_action' ? '✅ Expected error' : '❌ Unexpected response');
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  // Test 4: Invalid action
  console.log('\n4. Testing invalid action...');
  try {
    const response = await fetch(`${baseUrl}/api/whatsapp-proxy-forgiving.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid_action' })
    });
    console.log('   Status:', response.status);
    const data = await response.json();
    console.log('   Response:', data.error === 'invalid_action' ? '✅ Expected error' : '❌ Unexpected response');
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

// Function to provide debugging tips
function provideDebuggingTips() {
  console.log('\n💡 Debugging Tips:');
  console.log('==================');
  console.log('1. Open browser developer tools (F12)');
  console.log('2. Go to Network tab');
  console.log('3. Look for failed requests to whatsapp-proxy.php');
  console.log('4. Check the request payload for missing action field');
  console.log('5. Look for any JavaScript errors in Console tab');
  console.log('6. Check if the request is being made with proper JSON body');
  console.log('');
  console.log('🔧 Common Issues:');
  console.log('- Missing action field in request body');
  console.log('- Empty action field');
  console.log('- Invalid action name');
  console.log('- Malformed JSON in request body');
  console.log('- CORS issues (check if request is cross-origin)');
  console.log('');
  console.log('📋 Valid Actions:');
  console.log('- health, getStateInstance, getSettings, sendMessage');
  console.log('- getChats, getChatHistory, getQRCode');
  console.log('- getWebhookSettings, setWebhookSettings');
  console.log('- setSettings, rebootInstance, logoutInstance');
}

// Main execution
async function main() {
  console.log('Starting WhatsApp frontend debug...\n');
  
  // Enable fetch interception
  interceptFetch();
  
  // Test common scenarios
  await testCommonScenarios();
  
  // Provide debugging tips
  provideDebuggingTips();
  
  console.log('✅ Debug script completed');
  console.log('\nNext steps:');
  console.log('1. Check browser console for intercepted requests');
  console.log('2. Look for any requests without proper action field');
  console.log('3. Update frontend code to include valid actions');
  console.log('4. Test the application again');
}

// Run the debug script
main().catch(console.error);
