/**
 * Test Webhook Connection
 * 
 * This script tests if your webhook is properly connected and working
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function testWebhookConnection() {
  console.log('🔗 Testing Webhook Connection...\n');

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    // Test 1: Check instance state
    console.log('📱 Test 1: Checking Instance State...');
    const stateResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getStateInstance/${apiToken}`);
    
    if (stateResponse.ok) {
      const stateData = await stateResponse.json();
      console.log(`✅ Instance State: ${stateData.stateInstance}`);
    } else {
      console.log('❌ Could not get instance state');
    }
    console.log('');

    // Test 2: Check webhook settings
    console.log('🌐 Test 2: Checking Webhook Settings...');
    const webhookResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getWebhookSettings/${apiToken}`);
    
    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('✅ Webhook Settings:');
      console.log(`   URL: ${webhookData.webhookUrl || 'Not set'}`);
      console.log(`   Authorization: ${webhookData.webhookAuthorization || 'Not set'}`);
      console.log(`   Incoming Messages: ${webhookData.incomingMessageReceived ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Outgoing Messages: ${webhookData.outgoingMessageReceived ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   API Messages: ${webhookData.outgoingAPIMessageReceived ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Message Status: ${webhookData.outgoingMessageStatus ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   State Changes: ${webhookData.stateInstanceChanged ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Status Changes: ${webhookData.statusInstanceChanged ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Device Info: ${webhookData.deviceInfo ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Incoming Calls: ${webhookData.incomingCall ? '✅ Enabled' : '❌ Disabled'}`);
    } else {
      console.log('❌ Could not get webhook settings');
    }
    console.log('');

    // Test 3: Send a test message to trigger webhook
    console.log('📤 Test 3: Sending Test Message to Trigger Webhook...');
    const testMessage = {
      chatId: '255746605561@c.us',
      message: 'Hi there! (Webhook Test)'
    };
    
    const sendResponse = await fetch(`${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    if (sendResponse.ok) {
      const sendResult = await sendResponse.json();
      console.log('✅ Test message sent successfully!');
      console.log(`   Message ID: ${sendResult.idMessage}`);
      console.log('   This should trigger a webhook to your Netlify function');
    } else {
      console.log('❌ Could not send test message');
    }
    console.log('');

    // Test 4: Check if webhook URL is accessible
    console.log('🌐 Test 4: Testing Webhook URL Accessibility...');
    const webhookUrl = 'https://inauzwaapp.netlify.app/.netlify/functions/whatsapp-webhook';
    
    try {
      const webhookTestResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: 'Test webhook message',
          senderId: '255746605561@c.us',
          timestamp: Math.floor(Date.now() / 1000),
          type: 'textMessage'
        })
      });
      
      if (webhookTestResponse.ok) {
        const webhookTestResult = await webhookTestResponse.json();
        console.log('✅ Webhook URL is accessible!');
        console.log('   Response:', webhookTestResult);
      } else {
        console.log(`❌ Webhook URL returned status: ${webhookTestResponse.status}`);
      }
    } catch (error) {
      console.log('❌ Webhook URL is not accessible:', error.message);
    }
    console.log('');

    // Summary
    console.log('📋 Webhook Connection Summary:');
    console.log('   • Instance should be authorized');
    console.log('   • Webhook URL should be set correctly');
    console.log('   • All webhook events should be enabled');
    console.log('   • Netlify function should be accessible');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Check Netlify function logs for webhook activity');
    console.log('   2. Send "Hi" to your WhatsApp to test auto-reply');
    console.log('   3. Monitor the webhook responses');

  } catch (error) {
    console.error('❌ Error testing webhook connection:', error.message);
  }
}

// Run the test
testWebhookConnection().then(() => {
  console.log('✅ Webhook connection test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
