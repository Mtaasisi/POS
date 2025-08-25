/**
 * Production Debug Script for WhatsApp Auto-Reply
 * 
 * This script helps identify exactly what's preventing auto-replies from working
 */

async function debugProduction() {
  console.log('🔍 ===== PRODUCTION DEBUG SESSION =====\n');
  
  try {
    // Test 1: Check if debug webhook is working
    console.log('📋 Test 1: Testing debug webhook...');
    
    const testPayload = {
      typeWebhook: 'incomingMessageReceived',
      body: {
        idMessage: 'debug_test_' + Date.now(),
        messageData: {
          textMessageData: {
            textMessage: 'Hi'
          }
        },
        senderData: {
          chatId: '254700000000@c.us'
        }
      }
    };

    const response = await fetch('https://inauzwa.store/api/whatsapp-webhook-debug.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Debug webhook response:', JSON.stringify(data, null, 2));
      
      if (data.autoReply) {
        console.log('🎉 Auto-reply is working!');
        console.log(`   Triggered by: "Hi"`);
        console.log(`   Response: "${data.autoReply}"`);
      } else {
        console.log('⚠️  Auto-reply not triggered');
        console.log(`   Debug info: ${data.debug || 'No debug info'}`);
      }
    } else {
      console.error(`❌ Debug webhook failed: ${response.status}`);
      const errorText = await response.text();
      console.error(`   Error: ${errorText}`);
    }

    // Test 2: Check debug logs
    console.log('\n📋 Test 2: Checking debug logs...');
    
    try {
      const debugLogResponse = await fetch('https://inauzwa.store/api/debug_log.txt');
      if (debugLogResponse.ok) {
        const debugLog = await debugLogResponse.text();
        console.log('✅ Debug log found');
        console.log('📄 Last 20 debug entries:');
        
        const lines = debugLog.split('\n').filter(line => line.trim());
        const lastLines = lines.slice(-20);
        lastLines.forEach(line => {
          if (line.includes('[DEBUG]')) {
            console.log(`   ${line}`);
          }
        });
      } else {
        console.log('❌ Debug log not found (404)');
      }
    } catch (error) {
      console.log('❌ Could not fetch debug log:', error.message);
    }

    // Test 3: Check auto-reply logs
    console.log('\n📋 Test 3: Checking auto-reply logs...');
    
    try {
      const autoReplyLogResponse = await fetch('https://inauzwa.store/api/auto_reply_log.txt');
      if (autoReplyLogResponse.ok) {
        const autoReplyLog = await autoReplyLogResponse.text();
        console.log('✅ Auto-reply log found');
        console.log('📄 Last 10 auto-reply entries:');
        
        const lines = autoReplyLog.split('\n').filter(line => line.trim());
        const lastLines = lines.slice(-10);
        lastLines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            console.log(`   ${entry.timestamp} - ${entry.sender}: "${entry.message}" → "${entry.autoReply || 'none'}"`);
          } catch (e) {
            console.log(`   ${line}`);
          }
        });
      } else {
        console.log('❌ Auto-reply log not found (404)');
      }
    } catch (error) {
      console.log('❌ Could not fetch auto-reply log:', error.message);
    }

    // Test 4: Check webhook logs
    console.log('\n📋 Test 4: Checking webhook logs...');
    
    try {
      const webhookLogResponse = await fetch('https://inauzwa.store/api/webhook_log.txt');
      if (webhookLogResponse.ok) {
        const webhookLog = await webhookLogResponse.text();
        console.log('✅ Webhook log found');
        console.log('📄 Last 5 webhook entries:');
        
        const lines = webhookLog.split('\n').filter(line => line.trim());
        const lastLines = lines.slice(-5);
        lastLines.forEach(line => {
          console.log(`   ${line.substring(0, 100)}...`);
        });
      } else {
        console.log('❌ Webhook log not found (404)');
      }
    } catch (error) {
      console.log('❌ Could not fetch webhook log:', error.message);
    }

    // Test 5: Check WhatsApp instance state
    console.log('\n📋 Test 5: Checking WhatsApp instance state...');
    
    try {
      const stateResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getStateInstance' })
      });

      if (stateResponse.ok) {
        const stateData = await stateResponse.json();
        console.log('✅ WhatsApp instance state:', JSON.stringify(stateData, null, 2));
        
        if (stateData.stateInstance === 'authorized') {
          console.log('✅ WhatsApp instance is authorized');
        } else {
          console.log('❌ WhatsApp instance is not authorized:', stateData.stateInstance);
        }
      } else {
        console.error(`❌ Failed to get instance state: ${stateResponse.status}`);
      }
    } catch (error) {
      console.log('❌ Could not check instance state:', error.message);
    }

    // Test 6: Check webhook settings
    console.log('\n📋 Test 6: Checking webhook settings...');
    
    try {
      const webhookSettingsResponse = await fetch('https://inauzwa.store/api/whatsapp-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getWebhookSettings' })
      });

      if (webhookSettingsResponse.ok) {
        const webhookSettings = await webhookSettingsResponse.json();
        console.log('✅ Webhook settings:', JSON.stringify(webhookSettings, null, 2));
        
        if (webhookSettings.webhookUrl === 'https://inauzwa.store/api/whatsapp-webhook.php') {
          console.log('✅ Webhook URL is correctly configured');
        } else {
          console.log('❌ Webhook URL is not correctly configured:', webhookSettings.webhookUrl);
        }
      } else {
        console.error(`❌ Failed to get webhook settings: ${webhookSettingsResponse.status}`);
      }
    } catch (error) {
      console.log('❌ Could not check webhook settings:', error.message);
    }

    // Summary and recommendations
    console.log('\n📋 Debug Summary:');
    console.log('🔍 The debug webhook will create detailed logs at:');
    console.log('   - /api/debug_log.txt (comprehensive debug info)');
    console.log('   - /api/auto_reply_log.txt (auto-reply activity)');
    console.log('   - /api/webhook_log.txt (all webhook activity)');
    
    console.log('\n💡 Next Steps:');
    console.log('1. Upload the debug webhook: whatsapp-webhook-debug.php → whatsapp-webhook.php');
    console.log('2. Send a real message to your WhatsApp number');
    console.log('3. Check the debug logs to see exactly what\'s happening');
    console.log('4. Look for any error messages in the debug logs');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugProduction().then(() => {
  console.log('\n🔍 ===== DEBUG COMPLETE =====');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
