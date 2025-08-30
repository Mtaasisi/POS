/**
 * Diagnostic Script for Current WhatsApp Instance Issues
 * 
 * This script checks the actual instance being used (7105306911) from the logs
 * and diagnoses the 400/403 authentication errors
 */

const CURRENT_INSTANCE = {
  instanceId: '7105306911', // From your error logs
  // We need to find the correct API token for this instance
  apiUrl: 'https://api.green-api.com'
};

async function diagnoseCurrentInstance() {
  console.log('🔍 Diagnosing Current WhatsApp Instance Issues');
  console.log('==============================================\n');
  console.log(`📱 Instance ID: ${CURRENT_INSTANCE.instanceId}`);
  console.log(`🌐 API URL: ${CURRENT_INSTANCE.apiUrl}\n`);

  // First, we need to find the API token from your database
  console.log('1️⃣ Step 1: Need to find API token from database');
  console.log('   - Check your Supabase whatsapp_instances_comprehensive table');
  console.log('   - Look for instance_id: 7105306911');
  console.log('   - Get the api_token value\n');

  console.log('2️⃣ Step 2: Common 400/403 Error Causes:');
  console.log('   ❌ Invalid or expired API token');
  console.log('   ❌ Instance not authorized (QR code not scanned)');
  console.log('   ❌ Instance suspended or blocked');
  console.log('   ❌ Wrong API endpoint format');
  console.log('   ❌ Instance deactivated by Green API\n');

  console.log('3️⃣ Step 3: Check Instance Authorization');
  console.log('   Run this after getting the API token:');
  console.log(`   curl "${CURRENT_INSTANCE.apiUrl}/waInstance${CURRENT_INSTANCE.instanceId}/getStateInstance/YOUR_API_TOKEN"\n`);

  console.log('4️⃣ Step 4: Webhook Configuration');
  console.log('   - Your webhook URL should be: https://inauzwa.store/api/whatsapp-webhook.php');
  console.log('   - Check if webhooks are properly configured for this instance\n');

  console.log('5️⃣ Step 5: Message Receiving Issues');
  console.log('   - Check if your phone number is in allowed numbers list');
  console.log('   - Verify webhook is receiving incoming messages');
  console.log('   - Check webhook logs at: https://inauzwa.store/api/webhook_log.txt\n');

  return {
    instanceId: CURRENT_INSTANCE.instanceId,
    apiUrl: CURRENT_INSTANCE.apiUrl,
    needsApiToken: true
  };
}

async function checkInstanceWithToken(apiToken) {
  if (!apiToken) {
    console.log('❌ No API token provided. Please get it from your database first.');
    return;
  }

  console.log('\n🔍 Checking Instance Status with API Token...\n');

  try {
    // Check instance state
    const stateUrl = `${CURRENT_INSTANCE.apiUrl}/waInstance${CURRENT_INSTANCE.instanceId}/getStateInstance/${apiToken}`;
    console.log(`📡 Checking: ${stateUrl}`);
    
    const response = await fetch(stateUrl);
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Instance Status:', data);
      
      if (data.stateInstance === 'authorized') {
        console.log('✅ Instance is authorized - problem might be elsewhere');
        await checkWebhookConfig(apiToken);
      } else {
        console.log('❌ Instance needs authorization!');
        console.log('🔧 Solution: Generate and scan QR code');
        await getQRCode(apiToken);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      
      if (response.status === 403) {
        console.log('🔧 403 Error: Invalid API token or instance ID');
      } else if (response.status === 400) {
        console.log('🔧 400 Error: Bad request - check instance format');
      }
    }
  } catch (error) {
    console.error('❌ Error checking instance:', error.message);
  }
}

async function getQRCode(apiToken) {
  console.log('\n📱 Getting QR Code for Authorization...\n');
  
  try {
    const qrUrl = `${CURRENT_INSTANCE.apiUrl}/waInstance${CURRENT_INSTANCE.instanceId}/qr/${apiToken}`;
    const response = await fetch(qrUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.qr) {
        console.log('✅ QR Code generated successfully!');
        console.log('📱 Scan this QR code with WhatsApp:');
        console.log(data.qr);
        console.log('\n⏳ After scanning, wait 30 seconds and check status again.');
      } else {
        console.log('❌ No QR code in response:', data);
      }
    } else {
      console.log('❌ Failed to get QR code:', response.status);
    }
  } catch (error) {
    console.error('❌ Error getting QR code:', error.message);
  }
}

async function checkWebhookConfig(apiToken) {
  console.log('\n🔗 Checking Webhook Configuration...\n');
  
  try {
    const webhookUrl = `${CURRENT_INSTANCE.apiUrl}/waInstance${CURRENT_INSTANCE.instanceId}/getSettings/${apiToken}`;
    const response = await fetch(webhookUrl);
    
    if (response.ok) {
      const settings = await response.json();
      console.log('📋 Current Webhook Settings:', settings);
      
      const expectedWebhook = 'https://inauzwa.store/api/whatsapp-webhook.php';
      if (settings.webhookUrl === expectedWebhook) {
        console.log('✅ Webhook URL is correct');
      } else {
        console.log('❌ Webhook URL is incorrect or missing');
        console.log(`   Expected: ${expectedWebhook}`);
        console.log(`   Current: ${settings.webhookUrl || 'Not set'}`);
      }
    } else {
      console.log('❌ Failed to get webhook settings:', response.status);
    }
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
  }
}

// Run diagnosis automatically when script is executed
console.log('🔍 Found conflicting API tokens in your system:');
console.log('Token 1 (config.php): b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294');
console.log('Token 2 (update script): 48cbc4699b2f441498a968945b34c297d5392883105846ec9e');
console.log('\nTesting both tokens...\n');

const tokens = [
  { name: 'Config Token', value: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294' },
  { name: 'Script Token', value: '48cbc4699b2f441498a968945b34c297d5392883105846ec9e' }
];

async function testBothTokens() {
  for (const token of tokens) {
    console.log(`\n🧪 Testing ${token.name}...`);
    await checkInstanceWithToken(token.value);
  }
}

diagnoseCurrentInstance()
  .then(() => testBothTokens())
  .catch(console.error);
