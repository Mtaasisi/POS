const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

const ALLOWED_NUMBERS = [
  '255746605561@c.us',
  '254700000000@c.us',
  '254712345678@c.us'
];

async function diagnoseWhatsAppIssue() {
  console.log('🔍 Diagnosing WhatsApp AI Integration Issue');
  console.log('==========================================\n');

  try {
    // 1. Check instance status
    console.log('1️⃣ Checking WhatsApp Instance Status...');
    const statusResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getStateInstance/${WHATSAPP_CREDENTIALS.apiToken}`);
    const statusData = await statusResponse.json();
    
    console.log(`   Status: ${statusData.stateInstance}`);
    
    if (statusData.stateInstance !== 'authorized') {
      console.log('   ❌ Instance not authorized! Please scan QR code first.');
      return;
    } else {
      console.log('   ✅ Instance is authorized');
    }

    // 2. Check webhook settings
    console.log('\n2️⃣ Checking Webhook Configuration...');
    try {
      const webhookResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getWebhookSettings/${WHATSAPP_CREDENTIALS.apiToken}`);
      
      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log('   Current webhook settings:', webhookData);
        
        if (!webhookData.webhookUrl || webhookData.webhookUrl === '') {
          console.log('   ❌ No webhook URL configured!');
          console.log('   💡 This is why messages aren\'t being processed');
        } else {
          console.log(`   ✅ Webhook URL: ${webhookData.webhookUrl}`);
        }
      } else {
        console.log(`   ❌ Can't get webhook settings: ${webhookResponse.status}`);
        console.log('   💡 This API endpoint might not be available');
      }
    } catch (error) {
      console.log(`   ❌ Webhook check failed: ${error.message}`);
    }

    // 3. Test sending a message to verify API works
    console.log('\n3️⃣ Testing Message Sending...');
    const testMessage = "🔍 Diagnostic Test - WhatsApp API is working. Time: " + new Date().toLocaleTimeString();
    
    const sendResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/sendMessage/${WHATSAPP_CREDENTIALS.apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: ALLOWED_NUMBERS[0],
        message: testMessage
      }),
    });

    if (sendResponse.ok) {
      const sendData = await sendResponse.json();
      console.log(`   ✅ Message sent successfully: ${sendData.idMessage}`);
      console.log('   📱 Check your WhatsApp for the test message');
    } else {
      const errorData = await sendResponse.text();
      console.log(`   ❌ Failed to send message: ${sendResponse.status}`);
      console.log(`   Error details: ${errorData}`);
    }

    // 4. Check if ngrok is running
    console.log('\n4️⃣ Checking ngrok Status...');
    try {
      const ngrokResponse = await fetch('http://localhost:4040/api/tunnels');
      const ngrokData = await ngrokResponse.json();
      
      if (ngrokData.tunnels && ngrokData.tunnels.length > 0) {
        const tunnel = ngrokData.tunnels[0];
        console.log(`   ✅ ngrok is running: ${tunnel.public_url}`);
        console.log(`   📡 Webhook URL would be: ${tunnel.public_url}/.netlify/functions/ai-whatsapp-webhook`);
      } else {
        console.log('   ❌ No ngrok tunnels found');
        console.log('   💡 Start ngrok with: ngrok http 8888');
      }
    } catch (error) {
      console.log('   ❌ ngrok not running');
      console.log('   💡 Start ngrok to enable webhook testing');
    }

    // 5. Summary and next steps
    console.log('\n=========================================');
    console.log('📊 Diagnosis Summary');
    console.log('=========================================');
    
    console.log('\n🔧 To Fix the Issue:');
    console.log('1. Start ngrok: ngrok http 8888');
    console.log('2. Start local server: node scripts/start-local-webhook.js');
    console.log('3. Configure webhook: node scripts/setup-ngrok-webhook.js');
    console.log('4. Or use quick start: ./scripts/quick-start-ngrok.sh');
    
    console.log('\n💡 Why Messages Aren\'t Being Replied To:');
    console.log('- No webhook URL is configured in Green API');
    console.log('- Green API doesn\'t know where to send incoming messages');
    console.log('- You need to set up a webhook endpoint for auto-replies');
    
    console.log('\n📱 Manual Testing:');
    console.log('- The API can send messages (as shown above)');
    console.log('- But incoming messages aren\'t being processed');
    console.log('- Set up webhook to enable AI auto-replies');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// Run the diagnosis
diagnoseWhatsAppIssue().catch(console.error);
