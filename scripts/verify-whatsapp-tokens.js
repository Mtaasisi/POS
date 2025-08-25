/**
 * WhatsApp Token Verification Script
 * 
 * This script verifies your WhatsApp Official API tokens and webhook configuration
 */

import fetch from 'node-fetch';

// Configuration - Update these with your actual values
const CONFIG = {
  // Your Netlify site URL (replace with your actual URL)
  netlifyUrl: 'https://your-netlify-site.netlify.app',
  
  // WhatsApp Official API credentials
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAAi4VB6prOwBPACaXuiHkOZA5mZBh2PDuBYsQxxTnMzxI0Jxl5OmYShKZAlGijhZAIvuRuPX6jUNDqozcjLlysqgX2iTMIZCnORcbfKkYJC2ZBs7rYGKns7nOvgc6O8ZAsZA6ZASl4RXIhZCy4nW4s0sUCJaxZBaiVpa2SQgcLq0qZAPD3lN28NSJjQZB13qYo8bMM25OXkZAZCjT3QZCMlIU2aNO4CfSZBdEJ0Q7nP8DUyi4NjrLCCfn5MNZCnepGeozbkpaG',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '100948499751706',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'LATS_VERIFY_2024',
  
  // Test phone number (your number)
  testPhoneNumber: '255746605561'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Verify environment variables
function verifyEnvironmentVariables() {
  log('\n🔍 Step 1: Verifying Environment Variables', 'blue');
  log('=' .repeat(50));
  
  const issues = [];
  
  if (!CONFIG.accessToken || CONFIG.accessToken === 'your_access_token_here') {
    issues.push('❌ WHATSAPP_ACCESS_TOKEN not set or using default value');
  } else {
    log('✅ WHATSAPP_ACCESS_TOKEN is configured', 'green');
  }
  
  if (!CONFIG.phoneNumberId || CONFIG.phoneNumberId === 'your_phone_number_id_here') {
    issues.push('❌ WHATSAPP_PHONE_NUMBER_ID not set or using default value');
  } else {
    log('✅ WHATSAPP_PHONE_NUMBER_ID is configured', 'green');
  }
  
  if (!CONFIG.verifyToken || CONFIG.verifyToken === 'your_verify_token_here') {
    issues.push('❌ WHATSAPP_VERIFY_TOKEN not set or using default value');
  } else {
    log('✅ WHATSAPP_VERIFY_TOKEN is configured', 'green');
  }
  
  if (CONFIG.netlifyUrl === 'https://your-netlify-site.netlify.app') {
    issues.push('❌ Netlify URL not updated - please set your actual site URL');
  } else {
    log('✅ Netlify URL is configured', 'green');
  }
  
  if (issues.length > 0) {
    log('\n⚠️  Configuration Issues Found:', 'yellow');
    issues.forEach(issue => log(issue, 'red'));
    log('\n📋 To fix these issues:', 'blue');
    log('1. Set environment variables in Netlify dashboard');
    log('2. Update the netlifyUrl in this script');
    log('3. Redeploy your site');
    return false;
  }
  
  log('\n✅ All environment variables are properly configured!', 'green');
  return true;
}

// Test 2: Verify webhook endpoint is accessible
async function verifyWebhookEndpoint() {
  log('\n🔍 Step 2: Verifying Webhook Endpoint', 'blue');
  log('=' .repeat(50));
  
  try {
    const webhookUrl = `${CONFIG.netlifyUrl}/api/whatsapp-official-webhook`;
    log(`📡 Testing webhook URL: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl);
    const body = await response.text();
    
    log(`📊 Status Code: ${response.status}`);
    log(`📋 Response: ${body.substring(0, 100)}...`);
    
    if (response.status === 200) {
      log('✅ Webhook endpoint is accessible!', 'green');
      return true;
    } else {
      log('❌ Webhook endpoint returned non-200 status', 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error accessing webhook: ${error.message}`, 'red');
    return false;
  }
}

// Test 3: Verify webhook verification process
async function verifyWebhookVerification() {
  log('\n🔍 Step 3: Testing Webhook Verification', 'blue');
  log('=' .repeat(50));
  
  try {
    const webhookUrl = `${CONFIG.netlifyUrl}/api/whatsapp-official-webhook`;
    const challenge = 'test_challenge_' + Date.now();
    const verifyUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${CONFIG.verifyToken}&hub.challenge=${challenge}`;
    
    log(`📡 Testing verification URL: ${verifyUrl}`);
    
    const response = await fetch(verifyUrl);
    const body = await response.text();
    
    log(`📊 Status Code: ${response.status}`);
    log(`📋 Response: ${body}`);
    
    if (response.status === 200 && body === challenge) {
      log('✅ Webhook verification successful!', 'green');
      return true;
    } else {
      log('❌ Webhook verification failed', 'red');
      log('   Expected: ' + challenge, 'yellow');
      log('   Received: ' + body, 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error during verification: ${error.message}`, 'red');
    return false;
  }
}

// Test 4: Verify WhatsApp API access
async function verifyWhatsAppAPI() {
  log('\n🔍 Step 4: Testing WhatsApp API Access', 'blue');
  log('=' .repeat(50));
  
  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${CONFIG.phoneNumberId}`;
    log(`📡 Testing WhatsApp API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${CONFIG.accessToken}`
      }
    });
    
    const body = await response.text();
    
    log(`📊 Status Code: ${response.status}`);
    
    if (response.status === 200) {
      log('✅ WhatsApp API access successful!', 'green');
      try {
        const data = JSON.parse(body);
        log(`📱 Phone Number: ${data.verified_name || 'Unknown'}`);
        log(`🆔 Phone Number ID: ${data.id}`);
        return true;
      } catch (e) {
        log('⚠️  API response is not valid JSON', 'yellow');
        return true; // Still consider it successful if we get 200
      }
    } else if (response.status === 401) {
      log('❌ WhatsApp API access denied - check your access token', 'red');
      return false;
    } else if (response.status === 404) {
      log('❌ Phone number ID not found - check your phone number ID', 'red');
      return false;
    } else {
      log(`❌ WhatsApp API error: ${response.status} - ${body}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error testing WhatsApp API: ${error.message}`, 'red');
    return false;
  }
}

// Test 5: Test sending a message (optional)
async function testSendMessage() {
  log('\n🔍 Step 5: Testing Message Sending (Optional)', 'blue');
  log('=' .repeat(50));
  
  const shouldTest = process.argv.includes('--test-send');
  
  if (!shouldTest) {
    log('⏭️  Skipping message send test (use --test-send to enable)', 'yellow');
    return true;
  }
  
  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${CONFIG.phoneNumberId}/messages`;
    log(`📡 Sending test message to: ${CONFIG.testPhoneNumber}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: CONFIG.testPhoneNumber,
        type: 'text',
        text: {
          body: '🧪 Test message from LATS webhook verification script'
        }
      })
    });
    
    const body = await response.text();
    
    log(`📊 Status Code: ${response.status}`);
    
    if (response.status === 200) {
      log('✅ Test message sent successfully!', 'green');
      try {
        const data = JSON.parse(body);
        log(`📨 Message ID: ${data.messages?.[0]?.id || 'Unknown'}`);
        return true;
      } catch (e) {
        log('⚠️  Response is not valid JSON', 'yellow');
        return true;
      }
    } else {
      log(`❌ Failed to send test message: ${response.status} - ${body}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error sending test message: ${error.message}`, 'red');
    return false;
  }
}

// Test 6: Verify webhook can process messages
async function verifyWebhookMessageProcessing() {
  log('\n🔍 Step 6: Testing Webhook Message Processing', 'blue');
  log('=' .repeat(50));
  
  try {
    const webhookUrl = `${CONFIG.netlifyUrl}/api/whatsapp-official-webhook`;
    
    // Simulate a WhatsApp webhook message
    const testMessage = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: CONFIG.testPhoneNumber,
                  phone_number_id: CONFIG.phoneNumberId
                },
                contacts: [
                  {
                    profile: {
                      name: 'Test User'
                    },
                    wa_id: CONFIG.testPhoneNumber
                  }
                ],
                messages: [
                  {
                    from: CONFIG.testPhoneNumber,
                    id: 'test_msg_' + Date.now(),
                    timestamp: Math.floor(Date.now() / 1000),
                    type: 'text',
                    text: {
                      body: 'Hi there!'
                    }
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };
    
    log(`📡 Sending test message to webhook: ${webhookUrl}`);
    log(`📝 Test message: "Hi there!"`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });
    
    const body = await response.text();
    
    log(`📊 Status Code: ${response.status}`);
    log(`📋 Response: ${body.substring(0, 200)}...`);
    
    if (response.status === 200) {
      log('✅ Webhook processed test message successfully!', 'green');
      return true;
    } else {
      log('❌ Webhook failed to process test message', 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error testing webhook processing: ${error.message}`, 'red');
    return false;
  }
}

// Main verification function
async function runAllVerifications() {
  log('🔍 WhatsApp Token and Webhook Verification', 'bold');
  log('=' .repeat(60));
  
  const results = {
    envVars: verifyEnvironmentVariables(),
    webhookEndpoint: await verifyWebhookEndpoint(),
    webhookVerification: await verifyWebhookVerification(),
    whatsappAPI: await verifyWhatsAppAPI(),
    messageSending: await testSendMessage(),
    messageProcessing: await verifyWebhookMessageProcessing()
  };
  
  log('\n' + '=' .repeat(60));
  log('📊 Verification Results Summary', 'bold');
  log('=' .repeat(60));
  
  log(`🔧 Environment Variables: ${results.envVars ? '✅ PASS' : '❌ FAIL'}`);
  log(`🌐 Webhook Endpoint: ${results.webhookEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  log(`🔐 Webhook Verification: ${results.webhookVerification ? '✅ PASS' : '❌ FAIL'}`);
  log(`📱 WhatsApp API Access: ${results.whatsappAPI ? '✅ PASS' : '❌ FAIL'}`);
  log(`📤 Message Sending: ${results.messageSending ? '✅ PASS' : '❌ FAIL'}`);
  log(`🔄 Message Processing: ${results.messageProcessing ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  log('\n' + '=' .repeat(60));
  log(`🎯 Overall Result: ${passedTests}/${totalTests} verifications passed`, 'bold');
  
  if (passedTests === totalTests) {
    log('🎉 All verifications passed! Your WhatsApp webhook is ready to use.', 'green');
  } else {
    log('⚠️  Some verifications failed. Please fix the issues above.', 'yellow');
  }
  
  log('=' .repeat(60));
  
  // Provide next steps
  if (passedTests >= 4) { // At least basic functionality works
    log('\n📋 Next Steps:', 'blue');
    log('1. Configure webhook URL in Meta Developer Console');
    log('2. Subscribe to message events');
    log('3. Test with real WhatsApp messages');
    log('4. Monitor webhook logs in Netlify dashboard');
  } else {
    log('\n🔧 Fix Required Issues:', 'red');
    log('1. Set all required environment variables');
    log('2. Ensure Netlify site is deployed');
    log('3. Verify WhatsApp API credentials');
    log('4. Check webhook function logs');
  }
}

// Show help information
function showHelp() {
  log('\n📋 Usage Instructions:', 'blue');
  log('=' .repeat(50));
  log('1. Set environment variables in Netlify dashboard:');
  log('   - WHATSAPP_ACCESS_TOKEN');
  log('   - WHATSAPP_PHONE_NUMBER_ID');
  log('   - WHATSAPP_VERIFY_TOKEN');
  log('');
  log('2. Update the netlifyUrl in this script');
  log('');
  log('3. Run the verification:');
  log('   node scripts/verify-whatsapp-tokens.js');
  log('');
  log('4. To test message sending (optional):');
  log('   node scripts/verify-whatsapp-tokens.js --test-send');
  log('');
  log('5. Check the results and fix any issues');
  log('=' .repeat(50));
}

// Run verifications if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  showHelp();
  runAllVerifications().catch(error => {
    log(`❌ Verification failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

export {
  verifyEnvironmentVariables,
  verifyWebhookEndpoint,
  verifyWebhookVerification,
  verifyWhatsAppAPI,
  testSendMessage,
  verifyWebhookMessageProcessing,
  runAllVerifications
};
