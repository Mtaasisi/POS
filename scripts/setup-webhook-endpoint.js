/**
 * Setup Webhook Endpoint for Auto-Reply
 * 
 * This script helps set up webhook endpoints for automatic auto-reply processing
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function setupWebhookEndpoint() {
  console.log('🔗 Setting up Webhook Endpoint for Auto-Reply...\n');

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    // Get current webhook settings
    console.log('📋 Current Webhook Settings:');
    console.log(`   Instance ID: ${instanceId}`);
    console.log(`   API URL: ${apiUrl}`);
    console.log('');
    
    console.log('🌐 Webhook Configuration:');
    console.log('   1. You need a public webhook URL');
    console.log('   2. The webhook should receive POST requests');
    console.log('   3. It should process incoming message data');
    console.log('   4. It should trigger auto-replies automatically');
    console.log('');
    
    console.log('📝 Webhook URL Format:');
    console.log('   https://your-domain.com/api/whatsapp-webhook');
    console.log('   or');
    console.log('   https://your-app.vercel.app/api/whatsapp-webhook');
    console.log('');
    
    console.log('🔧 Webhook Events to Enable:');
    console.log('   ✅ incomingMessageReceived');
    console.log('   ✅ outgoingMessageReceived');
    console.log('   ✅ outgoingAPIMessageReceived');
    console.log('   ✅ outgoingMessageStatus');
    console.log('   ✅ stateInstanceChanged');
    console.log('   ✅ statusInstanceChanged');
    console.log('   ✅ deviceInfo');
    console.log('   ✅ incomingCall');
    console.log('');
    
    console.log('💡 Next Steps:');
    console.log('   1. Deploy your webhook endpoint');
    console.log('   2. Configure it in Green API console');
    console.log('   3. Test with incoming messages');
    console.log('   4. Monitor auto-reply performance');
    console.log('');
    
    console.log('📱 Auto-Reply Rules:');
    console.log('   Trigger: Any message containing "Hi"');
    console.log('   Reply: "Mambo vipi"');
    console.log('   Numbers: All allowed numbers in your plan');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
  }
}

// Function to create webhook endpoint code
function generateWebhookCode() {
  console.log('📝 Webhook Endpoint Code (for your app):\n');
  
  const webhookCode = `
// WhatsApp Webhook Endpoint
// Add this to your app's API routes

import { handleIncomingMessage } from './auto-reply-system.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Process the incoming message
    const result = await handleIncomingMessage(webhookData);
    
    // Log the result
    console.log('Webhook processed:', result);
    
    // Return success
    res.status(200).json({ 
      success: true, 
      processed: result.processed,
      autoReply: result.autoReply || false
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
`;

  console.log(webhookCode);
}

// Function to test webhook locally
async function testWebhookLocally() {
  console.log('🧪 Testing Webhook Locally...\n');
  
  const testWebhookData = {
    body: 'Hi there!',
    senderId: '255746605561@c.us',
    timestamp: Math.floor(Date.now() / 1000),
    type: 'textMessage'
  };
  
  console.log('📨 Test Webhook Data:');
  console.log(JSON.stringify(testWebhookData, null, 2));
  console.log('');
  
  console.log('💡 To test locally:');
  console.log('   1. Start your local server');
  console.log('   2. Send POST request to your webhook endpoint');
  console.log('   3. Use the test data above');
  console.log('   4. Check if auto-reply is sent');
}

// Run the setup
setupWebhookEndpoint().then(() => {
  console.log('='.repeat(50));
  generateWebhookCode();
  console.log('='.repeat(50));
  testWebhookLocally();
  console.log('\n✅ Webhook setup guide completed!');
}).catch(error => {
  console.error('❌ Setup failed:', error);
});
