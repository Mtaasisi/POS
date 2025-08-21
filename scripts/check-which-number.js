/**
 * Check Which Number to Monitor for Auto-Replies
 * 
 * This script helps identify which WhatsApp number you should check
 * for auto-reply messages
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function checkWhichNumber() {
  console.log('📱 Checking Which Number to Monitor for Auto-Replies...\n');

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    // Get device info to see which number is connected
    const deviceResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getDeviceInfo/${apiToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (deviceResponse.ok) {
      const deviceData = await deviceResponse.json();
      console.log('📱 Device Information:');
      console.log(`   Phone Number: ${deviceData.wid || 'Unknown'}`);
      console.log(`   Platform: ${deviceData.platform || 'Unknown'}`);
      console.log(`   Business Name: ${deviceData.businessName || 'Not set'}`);
      console.log('');
    } else {
      console.log('⚠️  Could not get device info, but that\'s okay');
    }

    // Get instance state
    const stateResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getStateInstance/${apiToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (stateResponse.ok) {
      const stateData = await stateResponse.json();
      console.log('📋 Instance State:');
      console.log(`   Status: ${stateData.stateInstance}`);
      console.log('');
    }

    console.log('📞 Allowed Numbers for Testing:');
    console.log('   These are the numbers you can send messages to:');
    console.log('   1. 254700000000@c.us');
    console.log('   2. 254712345678@c.us');
    console.log('   3. 255746605561@c.us');
    console.log('');
    
    console.log('🔍 To Check for Auto-Replies:');
    console.log('   1. Open WhatsApp on your phone');
    console.log('   2. Look for messages from your business number');
    console.log('   3. Check if you received: "Mambo vipi mtaasisi"');
    console.log('');
    
    console.log('💡 Troubleshooting Tips:');
    console.log('   - Make sure you\'re checking the right WhatsApp number');
    console.log('   - Check your business WhatsApp account, not personal');
    console.log('   - Look for recent messages with ID: BAE5AF02D145DF70');
    console.log('   - The auto-reply should appear in the same chat');
    console.log('');
    
    console.log('📱 Test Message Details:');
    console.log('   Message ID: BAE5AF02D145DF70');
    console.log('   Sent to: 254700000000@c.us');
    console.log('   Auto-reply: "Mambo vipi mtaasisi"');
    console.log('   Time: Just now');

  } catch (error) {
    console.error('❌ Error checking number:', error.message);
  }
}

// Run the function
checkWhichNumber().then(() => {
  console.log('✅ Number check completed!');
}).catch(error => {
  console.error('❌ Check failed:', error);
});
