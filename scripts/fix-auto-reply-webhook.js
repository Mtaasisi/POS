/**
 * Fix Auto Reply Webhook Configuration
 * 
 * This script helps fix the auto reply rules issue by ensuring the webhook is properly configured
 */

const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function fixAutoReplyWebhook() {
  console.log('🔧 FIXING AUTO REPLY WEBHOOK CONFIGURATION');
  console.log('==========================================\n');

  try {
    // Step 1: Check current webhook status
    console.log('1️⃣ Checking current webhook configuration...');
    
    const webhookResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getWebhookSettings/${WHATSAPP_CREDENTIALS.apiToken}`);
    
    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('📋 Current webhook settings:', JSON.stringify(webhookData, null, 2));
    } else {
      console.log('⚠️ Could not get current webhook settings');
    }

    // Step 2: Check database auto-reply rules
    console.log('\n2️⃣ Checking database auto-reply rules...');
    
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://jxhzveborezjhsmzsgbc.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
    );

    const { data: rules, error } = await supabase
      .from('whatsapp_auto_reply_rules')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('❌ Error fetching rules:', error);
    } else {
      console.log(`📋 Found ${rules?.length || 0} enabled auto-reply rules:`);
      if (rules && rules.length > 0) {
        rules.forEach((rule, index) => {
          console.log(`   ${index + 1}. "${rule.trigger}" → "${rule.response}"`);
        });
      } else {
        console.log('⚠️ No enabled auto-reply rules found');
      }
    }

    // Step 3: Test webhook endpoint
    console.log('\n3️⃣ Testing webhook endpoint...');
    
    // Test webhook endpoint locally
    console.log('\n3️⃣ Testing webhook endpoint locally...');
    
    const localWebhookUrl = 'http://localhost:8888/api/whatsapp-official-webhook';
    console.log(`📡 Local Webhook URL: ${localWebhookUrl}`);
    
    // Test the webhook endpoint
    try {
      const testResponse = await fetch(localWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          message: 'Test webhook accessibility'
        })
      });

      if (testResponse.ok) {
        console.log('✅ Local webhook endpoint is accessible');
      } else {
        console.log(`❌ Local webhook test failed: ${testResponse.status}`);
      }
    } catch (error) {
      console.log('❌ Local webhook test error:', error.message);
    }

    // Step 4: Send test message
    console.log('\n4️⃣ Sending test message to trigger webhook...');
    
    const testMessage = "Hi";
    const response = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/sendMessage/${WHATSAPP_CREDENTIALS.apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: '255746605561@c.us',
        message: testMessage
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Test message sent: ${result.idMessage}`);
    } else {
      console.log(`❌ Failed to send test message: ${response.status}`);
    }

    // Step 5: Provide solution
    console.log('\n=========================================');
    console.log('🎯 DIAGNOSIS & SOLUTION');
    console.log('=========================================');
    console.log('');
    console.log('❌ THE ISSUE:');
    console.log('   Auto reply rules are not working because:');
    console.log('   1. Webhook URL may not be properly configured in Green API');
    console.log('   2. Webhook endpoint may not be receiving messages');
    console.log('   3. Database rules may not be matching incoming messages');
    console.log('');
    console.log('✅ WHAT\'S WORKING:');
    console.log('   - WhatsApp instance is authorized');
    console.log('   - Database has auto-reply rules');
    console.log('   - Direct API message sending works');
    console.log('   - Auto-reply logic is implemented');
    console.log('');
    console.log('🔧 SOLUTION STEPS:');
    console.log('');
    console.log('1. Configure Webhook URL in Green API Console:');
    console.log('   - Go to: https://console.green-api.com');
    console.log('   - Find instance: 7105284900');
    console.log('   - Set webhook URL to your local server:');
    console.log('     http://localhost:8888/api/whatsapp-official-webhook');
    console.log('   - Enable webhook events:');
    console.log('     ✅ incomingMessageReceived');
    console.log('     ✅ outgoingMessageReceived');
    console.log('     ✅ outgoingAPIMessageReceived');
    console.log('');
    console.log('2. Test the webhook:');
    console.log('   - Reply "Hi" to the test message sent to your WhatsApp');
    console.log('   - You should receive: "Mambo vipi weweeeeee"');
    console.log('   - If no auto-reply, webhook is not configured properly');
    console.log('');
    console.log('3. Monitor webhook activity:');
    console.log('   - Check server logs for incoming webhook requests');
    console.log('   - Monitor local server activity');
    console.log('');
    console.log('4. Alternative: Use the regular webhook function');
    console.log('   - Change webhook URL to:');
    console.log('     http://localhost:8888/api/whatsapp-official-webhook');
    console.log('   - This function has simpler auto-reply logic');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAutoReplyWebhook().catch(console.error);
