/**
 * Send Auto-Reply Right Now
 * 
 * This script sends an auto-reply message immediately to test the system
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function sendAutoReplyNow() {
  console.log('📤 Sending Auto-Reply Right Now...\n');

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  // Send to the user's actual number
  const chatId = '255746605561@c.us';
  const replyText = 'Mambo vipi mtaasisi';
  
  try {
    console.log(`📱 Sending to: ${chatId} (Your number!)`);
    console.log(`💬 Message: "${replyText}"`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log('');
    
    const response = await fetch(`${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: chatId,
        message: replyText
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Auto-reply sent successfully!');
    console.log(`📋 Message ID: ${result.idMessage}`);
    console.log('');
    console.log('📱 Check your WhatsApp now!');
    console.log('   Look for: "Mambo vipi mtaasisi"');
    console.log('   From: Your business WhatsApp number');
    console.log('   To: 255746605561@c.us (Your number!)');
    console.log('');
    console.log('💡 If you don\'t see it:');
    console.log('   1. Check your WhatsApp on 255746605561');
    console.log('   2. Look for messages from your business account');
    console.log('   3. Refresh WhatsApp if needed');
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to send auto-reply:', error.message);
    return null;
  }
}

// Run the function
sendAutoReplyNow().then((result) => {
  if (result) {
    console.log('\n🎉 Auto-reply sent! Check your WhatsApp (255746605561).');
  } else {
    console.log('\n❌ Failed to send auto-reply.');
  }
}).catch(error => {
  console.error('❌ Error:', error);
});
