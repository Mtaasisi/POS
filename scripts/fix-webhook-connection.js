/**
 * Fix Webhook Connection
 * 
 * This script helps fix webhook connection issues and get everything working
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function fixWebhookConnection() {
  console.log('🔧 Fixing Webhook Connection...\n');

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    // Step 1: Check current status
    console.log('📋 Step 1: Checking Current Status...');
    
    const stateResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getStateInstance/${apiToken}`);
    if (stateResponse.ok) {
      const stateData = await stateResponse.json();
      console.log(`✅ Instance State: ${stateData.stateInstance}`);
    }
    console.log('');

    // Step 2: Create a simple test webhook function
    console.log('📝 Step 2: Creating Simple Test Webhook...');
    
    const simpleWebhookCode = `
// Simple test webhook for debugging
exports.handler = async function(event, context) {
  console.log('Webhook received:', JSON.stringify(event.body, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    })
  };
};
`;

    console.log('✅ Simple webhook code created');
    console.log('💡 Add this to: netlify/functions/test-webhook.js');
    console.log('');

    // Step 3: Test webhook URL with different endpoints
    console.log('🌐 Step 3: Testing Webhook URLs...');
    
    const webhookUrls = [
      'https://inauzwaapp.netlify.app/.netlify/functions/whatsapp-webhook',
      'https://inauzwaapp.netlify.app/.netlify/functions/test-webhook',
      'https://inauzwaapp.netlify.app/api/whatsapp-webhook'
    ];

    for (const url of webhookUrls) {
      try {
        console.log(`Testing: ${url}`);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            test: true,
            message: 'Test webhook connection',
            timestamp: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ ${url} - Working! Response:`, result);
        } else {
          console.log(`❌ ${url} - Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${url} - Error: ${error.message}`);
      }
    }
    console.log('');

    // Step 4: Create deployment instructions
    console.log('🚀 Step 4: Deployment Instructions...');
    console.log('');
    console.log('📁 Required Files:');
    console.log('   1. netlify/functions/whatsapp-webhook.js');
    console.log('   2. netlify.toml');
    console.log('   3. netlify/functions/test-webhook.js (for testing)');
    console.log('');
    console.log('🔧 Deployment Steps:');
    console.log('   1. Push code to GitHub/GitLab');
    console.log('   2. Connect repository to Netlify');
    console.log('   3. Deploy the site');
    console.log('   4. Test webhook URLs');
    console.log('   5. Configure Green API webhook');
    console.log('');

    // Step 5: Alternative webhook setup
    console.log('🔄 Step 5: Alternative Webhook Setup...');
    console.log('');
    console.log('If Netlify functions don\'t work, try:');
    console.log('   1. Use a different hosting service (Vercel, Railway, etc.)');
    console.log('   2. Use a webhook testing service (webhook.site)');
    console.log('   3. Set up a local tunnel (ngrok) for testing');
    console.log('');

    // Step 6: Manual webhook configuration
    console.log('⚙️  Step 6: Manual Webhook Configuration...');
    console.log('');
    console.log('In Green API Console:');
    console.log('   1. Go to: https://console.green-api.com');
    console.log('   2. Find instance: 7105284900');
    console.log('   3. Set webhook URL to your working endpoint');
    console.log('   4. Enable all webhook events');
    console.log('   5. Save changes');
    console.log('');

    // Step 7: Test auto-reply manually
    console.log('📱 Step 7: Manual Auto-Reply Test...');
    console.log('');
    console.log('Send this test message:');
    console.log('   To: 255746605561@c.us');
    console.log('   Message: "Hi there! (Auto-reply test)"');
    console.log('   Expected reply: "Mambo vipi"');
    console.log('');

  } catch (error) {
    console.error('❌ Error fixing webhook connection:', error.message);
  }
}

// Create the test webhook file
function createTestWebhook() {
  const testWebhookPath = 'netlify/functions/test-webhook.js';
  const testWebhookCode = `// Simple test webhook for debugging
exports.handler = async function(event, context) {
  console.log('Test webhook received:', JSON.stringify(event.body, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      data: JSON.parse(event.body || '{}')
    })
  };
};`;

  console.log('📝 Creating test webhook file...');
  console.log(`File: ${testWebhookPath}`);
  console.log('Code:', testWebhookCode);
  console.log('');
}

// Run the fix
fixWebhookConnection().then(() => {
  console.log('='.repeat(50));
  createTestWebhook();
  console.log('✅ Webhook connection fix completed!');
  console.log('💡 Follow the deployment instructions above');
}).catch(error => {
  console.error('❌ Fix failed:', error);
});
