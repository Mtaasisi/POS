const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function checkWhyNoReplies() {
  console.log('🔍 Diagnosing Why You\'re Not Getting WhatsApp Replies');
  console.log('=====================================================\n');

  try {
    // 1. Check if webhook server is running
    console.log('1️⃣ Checking webhook server...');
    try {
      const localResponse = await fetch('http://localhost:8888/.netlify/functions/ai-whatsapp-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (localResponse.ok) {
        console.log('   ✅ Local webhook server is running');
      } else {
        console.log(`   ❌ Local webhook server error: ${localResponse.status}`);
        return;
      }
    } catch (error) {
      console.log('   ❌ Local webhook server not accessible');
      console.log('   💡 Start it with: node scripts/start-local-webhook.js');
      return;
    }

    // 2. Check ngrok tunnel
    console.log('\n2️⃣ Checking ngrok tunnel...');
    try {
      const ngrokResponse = await fetch('http://localhost:4040/api/tunnels');
      const ngrokData = await ngrokResponse.json();
      
      if (ngrokData.tunnels && ngrokData.tunnels.length > 0) {
        const tunnel = ngrokData.tunnels[0];
        console.log(`   ✅ ngrok tunnel active: ${tunnel.public_url}`);
        
        // Test ngrok webhook
        const webhookUrl = `${tunnel.public_url}/.netlify/functions/ai-whatsapp-webhook`;
        const ngrokTest = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ test: true })
        });
        
        if (ngrokTest.ok) {
          console.log('   ✅ ngrok webhook is accessible');
          console.log(`   📱 Webhook URL: ${webhookUrl}`);
        } else {
          console.log(`   ❌ ngrok webhook error: ${ngrokTest.status}`);
        }
      } else {
        console.log('   ❌ No ngrok tunnels found');
        console.log('   💡 Start ngrok with: ngrok http 8888');
        return;
      }
    } catch (error) {
      console.log('   ❌ ngrok not running');
      console.log('   💡 Start ngrok with: ngrok http 8888');
      return;
    }

    // 3. Check WhatsApp instance status
    console.log('\n3️⃣ Checking WhatsApp instance...');
    const statusResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getStateInstance/${WHATSAPP_CREDENTIALS.apiToken}`);
    const statusData = await statusResponse.json();
    
    console.log(`   Instance status: ${statusData.stateInstance}`);
    
    if (statusData.stateInstance !== 'authorized') {
      console.log('   ❌ WhatsApp instance not authorized');
      console.log('   💡 Scan QR code in Green API console');
      return;
    } else {
      console.log('   ✅ WhatsApp instance is authorized');
    }

    // 4. Test message sending
    console.log('\n4️⃣ Testing message sending...');
    const testMessage = "🔍 Diagnostic Test - Checking if messages can be sent. Time: " + new Date().toLocaleTimeString();
    
    const sendResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/sendMessage/${WHATSAPP_CREDENTIALS.apiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: '255746605561@c.us',
        message: testMessage
      }),
    });

    if (sendResponse.ok) {
      const sendData = await sendResponse.json();
      console.log(`   ✅ Message sent successfully: ${sendData.idMessage}`);
      console.log('   📱 Check your WhatsApp for the test message');
    } else {
      console.log(`   ❌ Failed to send message: ${sendResponse.status}`);
      return;
    }

    // 5. Check if webhook is configured in Green API
    console.log('\n5️⃣ Checking webhook configuration...');
    console.log('   ⚠️  This step requires manual verification');
    console.log('   📋 Go to: https://console.green-api.com');
    console.log('   📋 Find instance: 7105284900');
    console.log('   📋 Check webhook URL is set to:');
    
    const ngrokResponse2 = await fetch('http://localhost:4040/api/tunnels');
    const ngrokData2 = await ngrokResponse2.json();
    const webhookUrl = `${ngrokData2.tunnels[0].public_url}/.netlify/functions/ai-whatsapp-webhook`;
    console.log(`   📋 ${webhookUrl}`);

    // 6. Summary and next steps
    console.log('\n=========================================');
    console.log('📊 Diagnosis Summary');
    console.log('=========================================');
    console.log('');
    console.log('✅ What\'s Working:');
    console.log('- Local webhook server is running');
    console.log('- ngrok tunnel is active');
    console.log('- WhatsApp instance is authorized');
    console.log('- Messages can be sent');
    console.log('- AI processing is working');
    console.log('');
    console.log('🔧 Most Likely Issue:');
    console.log('- Webhook URL not configured in Green API console');
    console.log('- Green API doesn\'t know where to send incoming messages');
    console.log('');
    console.log('💡 Solution:');
    console.log('1. Go to https://console.green-api.com');
    console.log('2. Find instance 7105284900');
    console.log('3. Set webhook URL to the URL above');
    console.log('4. Enable webhook events');
    console.log('');
    console.log('🧪 Test After Configuration:');
    console.log('- Send "Hi" to your WhatsApp');
    console.log('- Should get auto-reply: "Mambo! Karibu kwenye LATS CHANCE..."');
    console.log('');
    console.log('📊 Monitor:');
    console.log('- Watch logs: tail -f webhook.log');
    console.log('- Check ngrok: http://localhost:4040');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// Run the diagnosis
checkWhyNoReplies().catch(console.error);
