/**
 * Set Webhook URL via API
 * 
 * This script sets the webhook URL directly via API to avoid console issues
 */

const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function setWebhookViaAPI() {
  console.log('🔧 Setting Webhook URL via API...\n');
  
  try {
    // Set local webhook URL
    console.log('1️⃣ Setting local webhook URL...');
    const webhookUrl = 'http://localhost:8888/api/whatsapp-official-webhook';
    
    console.log(`📡 Webhook URL: ${webhookUrl}`);
    
    // Method 1: Try setSettings endpoint
    console.log('\n2️⃣ Method 1: Using setSettings endpoint...');
    try {
      const response1 = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/setSettings/${WHATSAPP_CREDENTIALS.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhookUrl: webhookUrl,
          incomingWebhook: 'yes',
          outgoingWebhook: 'yes',
          outgoingMessageWebhook: 'yes',
          outgoingAPIMessageWebhook: 'yes',
          stateWebhook: 'yes',
          deviceWebhook: 'no'
        })
      });
      
      const result1 = await response1.json();
      console.log('📤 Response:', result1);
      
      if (response1.ok && result1.saveSettings) {
        console.log('✅ Webhook URL set successfully via setSettings!');
      } else {
        console.log('❌ setSettings failed, trying alternative method...');
      }
    } catch (error) {
      console.log('❌ setSettings error:', error.message);
    }
    
    // Method 2: Try setWebhookSettings endpoint
    console.log('\n3️⃣ Method 2: Using setWebhookSettings endpoint...');
    try {
      const response2 = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/setWebhookSettings/${WHATSAPP_CREDENTIALS.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhookUrl: webhookUrl,
          webhookUrlTimeout: 60,
          outgoingWebhook: 'yes',
          outgoingMessageWebhook: 'yes',
          outgoingAPIMessageWebhook: 'yes',
          incomingWebhook: 'yes',
          deviceWebhook: 'no',
          statusInstanceChangedWebhook: 'yes',
          stateInstanceChangedWebhook: 'yes'
        })
      });
      
      const result2 = await response2.json();
      console.log('📤 Response:', result2);
      
      if (response2.ok) {
        console.log('✅ Webhook settings updated successfully!');
      } else {
        console.log(`❌ setWebhookSettings failed: ${response2.status}`);
      }
    } catch (error) {
      console.log('❌ setWebhookSettings error:', error.message);
    }
    
    // Check current settings
    console.log('\n4️⃣ Checking current settings...');
    try {
      const response3 = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getSettings/${WHATSAPP_CREDENTIALS.apiToken}`);
      
      if (response3.ok) {
        const settings = await response3.json();
        console.log('📋 Current webhook URL:', settings.webhookUrl);
        console.log('📋 Incoming webhook enabled:', settings.incomingWebhook);
        console.log('📋 Outgoing webhook enabled:', settings.outgoingWebhook);
        
        if (settings.webhookUrl === webhookUrl) {
          console.log('✅ Webhook URL is correctly configured!');
        } else {
          console.log('❌ Webhook URL is not configured correctly');
        }
      } else {
        console.log(`❌ Failed to get settings: ${response3.status}`);
      }
    } catch (error) {
      console.log('❌ Error getting settings:', error.message);
    }
    
    // Test the webhook
    console.log('\n5️⃣ Testing webhook endpoint...');
    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          test: true,
          message: 'Testing webhook accessibility'
        })
      });

      if (testResponse.ok) {
        console.log('✅ Webhook endpoint is accessible');
      } else {
        console.log(`❌ Webhook test failed: ${testResponse.status}`);
      }
    } catch (error) {
      console.log('❌ Webhook test error:', error.message);
    }
    
    console.log('\n=========================================');
    console.log('🎯 SUMMARY');
    console.log('=========================================');
    console.log('');
    console.log('📡 Webhook URL configured:');
    console.log(`   ${webhookUrl}`);
    console.log('');
    console.log('🧪 Next Steps:');
    console.log('1. Send "Hi" to your WhatsApp number');
    console.log('2. You should receive: "Mambo vipi weweeeeee"');
    console.log('3. If no auto-reply, check ngrok dashboard: http://localhost:4040');
    console.log('');
    console.log('📊 Monitor webhook activity:');
    console.log('   - ngrok dashboard: http://localhost:4040');
    console.log('   - Look for incoming webhook requests');
    console.log('   - Check server logs for processing');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setWebhookViaAPI().catch(console.error);
