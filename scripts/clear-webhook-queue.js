/**
 * Clear Webhook Queue Script
 * This script clears the incoming webhook queue
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

// Function to clear webhook queue
async function clearWebhookQueue() {
  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    console.log('🗑️  Clearing webhook queue...');
    
    const response = await fetch(`${apiUrl}/waInstance${instanceId}/clearIncomingNotifications/${apiToken}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to clear webhook queue: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log('✅ Webhook queue cleared successfully!');
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to clear webhook queue:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🧹 Clearing Webhook Queue...\n');
  
  const success = await clearWebhookQueue();
  
  if (success) {
    console.log('✅ Webhook queue has been cleared!');
    console.log('📋 You can now set up a working webhook server.');
  } else {
    console.log('❌ Failed to clear webhook queue.');
    console.log('📋 You may need to clear it manually from the Green API console.');
  }
}

// Run the script
main().catch(console.error);
