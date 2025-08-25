const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function checkGreenAPILogs() {
  console.log('🔍 Checking Green API Logs and Errors...\n');
  
  try {
    // 1. Check instance state
    console.log('📱 1. Checking Instance State...');
    const stateResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getStateInstance/${WHATSAPP_CREDENTIALS.apiToken}`);
    const stateData = await stateResponse.json();
    console.log('   State:', stateData);
    
    // 2. Check webhook settings
    console.log('\n📡 2. Checking Webhook Settings...');
    const webhookResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getWebhookSettings/${WHATSAPP_CREDENTIALS.apiToken}`);
    const webhookData = await webhookResponse.json();
    console.log('   Webhook Settings:', webhookData);
    
    // 3. Check last 24 hours of notifications
    console.log('\n📋 3. Checking Last Notifications...');
    const notificationsResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getIncomingNotifications/${WHATSAPP_CREDENTIALS.apiToken}`);
    const notificationsData = await notificationsResponse.json();
    console.log('   Notifications:', notificationsData);
    
    // 4. Check instance settings
    console.log('\n⚙️ 4. Checking Instance Settings...');
    const settingsResponse = await fetch(`${WHATSAPP_CREDENTIALS.apiUrl}/waInstance${WHATSAPP_CREDENTIALS.instanceId}/getWaSettings/${WHATSAPP_CREDENTIALS.apiToken}`);
    const settingsData = await settingsResponse.json();
    console.log('   Settings:', settingsData);
    
    // 5. Check if WhatsApp is connected
    console.log('\n📱 5. Checking WhatsApp Connection...');
    if (stateData.stateInstance === 'authorized') {
      console.log('   ✅ WhatsApp is authorized and connected');
    } else {
      console.log('   ❌ WhatsApp is not connected. State:', stateData.stateInstance);
    }
    
    // 6. Check webhook URL
    console.log('\n🔗 6. Checking Webhook URL...');
    if (webhookData.webhookUrl) {
      console.log('   ✅ Webhook URL is set:', webhookData.webhookUrl);
      
      // Test if webhook URL is accessible
      try {
        const testResponse = await fetch(webhookData.webhookUrl, { method: 'GET' });
        console.log('   ✅ Webhook URL is accessible (Status:', testResponse.status, ')');
      } catch (error) {
        console.log('   ❌ Webhook URL is not accessible:', error.message);
      }
    } else {
      console.log('   ❌ No webhook URL is set!');
    }
    
  } catch (error) {
    console.error('❌ Error checking Green API logs:', error.message);
    
    if (error.message.includes('429')) {
      console.log('\n⚠️ RATE LIMIT ERROR: You\'ve hit the Green API rate limit');
      console.log('   Wait a few minutes and try again');
    }
  }
}

checkGreenAPILogs().catch(console.error);
