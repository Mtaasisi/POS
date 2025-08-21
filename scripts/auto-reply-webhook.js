/**
 * Auto-Reply Webhook Handler
 * 
 * This script automatically replies to all incoming "Hi" messages with "Mambo vipi"
 * Can be integrated into your app's webhook endpoint
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

// Allowed numbers (due to quota limits)
const ALLOWED_NUMBERS = [
  '254700000000@c.us',
  '254712345678@c.us',
  '255746605561@c.us'
];

// Function to check if message contains "Hi"
function shouldAutoReply(messageText) {
  if (!messageText) return null;
  
  const lowerMessage = messageText.toLowerCase().trim();
  
  // Check for "hi" in any form
  if (lowerMessage.includes('hi')) {
    return 'Mambo vipi';
  }
  
  return null;
}

// Function to send auto-reply
async function sendAutoReply(chatId, replyText) {
  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    console.log(`📤 Sending auto-reply to ${chatId}: "${replyText}"`);
    
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
      throw new Error(`Failed to send auto-reply: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Auto-reply sent successfully!`);
    console.log(`   Message ID: ${result.idMessage}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to send auto-reply:`, error.message);
    return null;
  }
}

// Main webhook handler function
async function handleIncomingMessage(webhookData) {
  console.log('📨 Processing incoming message...');
  
  try {
    // Extract message data from webhook
    const { body, senderId, timestamp, type } = webhookData;
    
    console.log(`📱 Message from ${senderId}: "${body}"`);
    console.log(`⏰ Time: ${new Date(timestamp * 1000).toLocaleString()}`);
    console.log(`📝 Type: ${type}`);
    
    // Only process text messages
    if (type !== 'textMessage' && type !== 'extendedTextMessage') {
      console.log('ℹ️  Skipping non-text message');
      return { processed: false, reason: 'non-text-message' };
    }
    
    // Check if sender is in allowed numbers
    if (!ALLOWED_NUMBERS.includes(senderId)) {
      console.log(`⚠️  Sender ${senderId} not in allowed numbers`);
      return { processed: false, reason: 'not-allowed-number' };
    }
    
    // Check if message should trigger auto-reply
    const autoReply = shouldAutoReply(body);
    
    if (autoReply) {
      console.log(`🤖 Auto-reply triggered: "${autoReply}"`);
      
      // Send the auto-reply
      const result = await sendAutoReply(senderId, autoReply);
      
      if (result) {
        console.log('✅ Auto-reply sent successfully');
        return { 
          processed: true, 
          autoReply: true, 
          replyText: autoReply,
          messageId: result.idMessage 
        };
      } else {
        console.log('❌ Failed to send auto-reply');
        return { processed: false, reason: 'send-failed' };
      }
    } else {
      console.log('ℹ️  No auto-reply triggered for this message');
      return { processed: true, autoReply: false };
    }
    
  } catch (error) {
    console.error('❌ Error processing message:', error.message);
    return { processed: false, reason: 'error', error: error.message };
  }
}

// Test function to simulate incoming messages
async function testAutoReplySystem() {
  console.log('🧪 Testing Auto-Reply System for "Hi" messages...\n');
  
  const testMessages = [
    {
      body: 'Hi there!',
      senderId: '255746605561@c.us',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'textMessage'
    },
    {
      body: 'Hello',
      senderId: '254700000000@c.us',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'textMessage'
    },
    {
      body: 'Hi mtaasisi',
      senderId: '254712345678@c.us',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'textMessage'
    },
    {
      body: 'How are you?',
      senderId: '255746605561@c.us',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'textMessage'
    },
    {
      body: 'hi there',
      senderId: '254700000000@c.us',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'textMessage'
    }
  ];
  
  for (const testMessage of testMessages) {
    console.log('='.repeat(50));
    console.log(`📝 Testing: "${testMessage.body}" from ${testMessage.senderId}`);
    const result = await handleIncomingMessage(testMessage);
    console.log('Result:', result);
    console.log('');
  }
}

// Function to manually trigger auto-reply for testing
async function triggerAutoReplyNow() {
  console.log('📤 Triggering Auto-Reply Right Now...\n');
  
  const testMessage = {
    body: 'Hi there!',
    senderId: '255746605561@c.us',
    timestamp: Math.floor(Date.now() / 1000),
    type: 'textMessage'
  };
  
  console.log(`📝 Simulating message: "${testMessage.body}" from ${testMessage.senderId}`);
  const result = await handleIncomingMessage(testMessage);
  
  if (result && result.autoReply) {
    console.log('\n✅ Auto-reply triggered and sent!');
    console.log(`💬 Reply: "${result.replyText}"`);
    console.log(`📱 Check your WhatsApp (255746605561) for the reply!`);
  } else {
    console.log('\n❌ Auto-reply failed or not triggered');
  }
  
  return result;
}

// Export functions for use in your app
export { handleIncomingMessage, shouldAutoReply, sendAutoReply, triggerAutoReplyNow };

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🤖 Auto-Reply System for "Hi" messages');
  console.log('📋 Rule: Any message containing "Hi" → "Mambo vipi"\n');
  
  triggerAutoReplyNow().then(() => {
    console.log('\n✅ Auto-reply test completed!');
  }).catch(error => {
    console.error('❌ Test failed:', error);
  });
}
