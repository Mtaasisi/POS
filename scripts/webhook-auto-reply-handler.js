/**
 * WhatsApp Webhook Auto-Reply Handler
 * 
 * This script handles incoming WhatsApp webhooks and sends auto-replies
 * Can be integrated into your app's webhook endpoint
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

// Auto-reply rules
const AUTO_REPLY_RULES = [
  {
    trigger: ['hi', 'hello', 'hey', 'hallo'],
    reply: 'Mambo vipi mtaasisi',
    caseSensitive: false
  },
  {
    trigger: ['how are you', 'how r u', 'how are u'],
    reply: 'Niko poa sana, wewe vipi?',
    caseSensitive: false
  },
  {
    trigger: ['good morning', 'goodmorning', 'morning'],
    reply: 'Good morning! Mambo vipi mtaasisi?',
    caseSensitive: false
  },
  {
    trigger: ['good afternoon', 'goodafternoon', 'afternoon'],
    reply: 'Good afternoon! Mambo vipi mtaasisi?',
    caseSensitive: false
  },
  {
    trigger: ['good evening', 'goodevening', 'evening'],
    reply: 'Good evening! Mambo vipi mtaasisi?',
    caseSensitive: false
  }
];

// Allowed numbers (due to quota limits)
const ALLOWED_NUMBERS = [
  '254700000000@c.us',
  '254712345678@c.us',
  '255746605561@c.us'
];

// Function to check if a message should trigger auto-reply
function shouldAutoReply(messageText) {
  if (!messageText) return null;
  
  const lowerMessage = messageText.toLowerCase().trim();
  
  for (const rule of AUTO_REPLY_RULES) {
    for (const trigger of rule.trigger) {
      const triggerText = rule.caseSensitive ? trigger : trigger.toLowerCase();
      if (lowerMessage.includes(triggerText)) {
        return rule.reply;
      }
    }
  }
  
  return null;
}

// Function to send auto-reply
async function sendAutoReply(chatId, replyText) {
  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
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
      throw new Error(`Failed to send auto-reply: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Auto-reply sent to ${chatId}: "${replyText}"`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to send auto-reply to ${chatId}:`, error.message);
    return null;
  }
}

// Main webhook handler function
async function handleWebhook(webhookData) {
  console.log('📨 Processing webhook data...');
  
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
    console.error('❌ Error processing webhook:', error.message);
    return { processed: false, reason: 'error', error: error.message };
  }
}

// Test function to simulate webhook processing
async function testWebhookHandler() {
  console.log('🧪 Testing Webhook Handler...\n');
  
  const testMessages = [
    {
      body: 'Hi there!',
      senderId: '254700000000@c.us',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'textMessage'
    },
    {
      body: 'Hello mtaasisi',
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
      body: 'Random message',
      senderId: '254700000000@c.us',
      timestamp: Math.floor(Date.now() / 1000),
      type: 'textMessage'
    }
  ];
  
  for (const testMessage of testMessages) {
    console.log('='.repeat(40));
    const result = await handleWebhook(testMessage);
    console.log('Result:', result);
    console.log('');
  }
}

// Export functions for use in your app
export { handleWebhook, shouldAutoReply, sendAutoReply };

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testWebhookHandler().then(() => {
    console.log('✅ Webhook handler test completed!');
  }).catch(error => {
    console.error('❌ Test failed:', error);
  });
}
