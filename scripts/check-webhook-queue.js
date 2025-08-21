/**
 * Check Webhook Queue Script
 * This script checks what's in the incoming webhook queue
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

// Function to get webhook queue
async function getWebhookQueue() {
  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    console.log('📋 Checking webhook queue...');
    
    const response = await fetch(`${apiUrl}/waInstance${instanceId}/getIncomingNotifications/${apiToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get webhook queue: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Webhook queue retrieved successfully!');
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to get webhook queue:`, error.message);
    return null;
  }
}

// Function to delete webhook notification
async function deleteWebhookNotification(receiptId) {
  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    console.log(`🗑️  Deleting webhook notification: ${receiptId}`);
    
    const response = await fetch(`${apiUrl}/waInstance${instanceId}/deleteNotification/${apiToken}/${receiptId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete notification: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log(`✅ Webhook notification deleted: ${receiptId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to delete notification:`, error.message);
    return false;
  }
}

// Function to process webhook data
async function processWebhookData(webhookData) {
  console.log('📨 Processing webhook data...');
  console.log('📋 Webhook data:', JSON.stringify(webhookData, null, 2));
  
  // Extract message data
  const { body, senderId, timestamp, type } = webhookData;
  
  console.log(`📱 Message from ${senderId}: "${body || 'No body'}"`);
  console.log(`⏰ Time: ${timestamp ? new Date(timestamp * 1000).toLocaleString() : 'No timestamp'}`);
  console.log(`📝 Type: ${type || 'Unknown'}`);
  
  // Check if it's a text message with "Hi"
  if (type === 'textMessage' && body && body.toLowerCase().includes('hi')) {
    console.log('🤖 Auto-reply should be triggered for this message!');
    console.log('📤 This is what the webhook should have done automatically');
    
    // Send auto-reply manually
    const autoReply = 'Mambo vipi';
    console.log(`📤 Sending auto-reply: "${autoReply}"`);
    
    const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
    
    try {
      const response = await fetch(`${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: senderId,
          message: autoReply
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send auto-reply: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Auto-reply sent successfully!`);
      console.log(`   Message ID: ${result.idMessage}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to send auto-reply:`, error.message);
      return false;
    }
  } else {
    console.log('ℹ️  No auto-reply needed for this message');
    return true;
  }
}

// Main function to check and process webhook queue
async function checkWebhookQueue() {
  console.log('🔍 Checking Webhook Queue...\n');
  
  // Get webhook queue
  const queueData = await getWebhookQueue();
  
  if (!queueData) {
    console.log('❌ Failed to get webhook queue');
    return;
  }
  
  console.log('📊 Queue Status:');
  console.log(`   Total notifications: ${queueData.length || 0}`);
  
  if (!queueData || queueData.length === 0) {
    console.log('✅ No webhooks in queue');
    return;
  }
  
  console.log('\n📋 Processing webhooks...\n');
  
  // Process each webhook
  for (let i = 0; i < queueData.length; i++) {
    const notification = queueData[i];
    console.log(`📨 Processing webhook ${i + 1}/${queueData.length}:`);
    console.log(`   Receipt ID: ${notification.receiptId}`);
    console.log(`   Body: ${JSON.stringify(notification.body, null, 2)}`);
    
    // Process the webhook data
    const success = await processWebhookData(notification.body);
    
    if (success) {
      // Delete the notification after processing
      await deleteWebhookNotification(notification.receiptId);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('✅ Webhook queue processing completed!');
}

// Run the check
checkWebhookQueue().catch(console.error);
