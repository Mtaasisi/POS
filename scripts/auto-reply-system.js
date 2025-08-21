/**
 * Complete Auto-Reply System
 * 
 * This script provides a complete auto-reply system for WhatsApp
 * Automatically replies "Mambo vipi" to all incoming "Hi" messages
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

// Auto-reply configuration
const AUTO_REPLY_CONFIG = {
  enabled: true,
  rules: [
    {
      trigger: ['hi', 'hello', 'hey', 'hallo'],
      reply: 'Mambo vipi',
      caseSensitive: false
    }
  ]
};

// Function to check if message should trigger auto-reply
function shouldAutoReply(messageText) {
  if (!messageText || !AUTO_REPLY_CONFIG.enabled) return null;
  
  const lowerMessage = messageText.toLowerCase().trim();
  
  for (const rule of AUTO_REPLY_CONFIG.rules) {
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

// Main function to handle incoming messages
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
          messageId: result.idMessage,
          timestamp: new Date().toISOString()
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

// Function to enable/disable auto-reply
function setAutoReplyEnabled(enabled) {
  AUTO_REPLY_CONFIG.enabled = enabled;
  console.log(`🤖 Auto-reply ${enabled ? 'enabled' : 'disabled'}`);
}

// Function to add new auto-reply rules
function addAutoReplyRule(trigger, reply, caseSensitive = false) {
  AUTO_REPLY_CONFIG.rules.push({
    trigger: Array.isArray(trigger) ? trigger : [trigger],
    reply: reply,
    caseSensitive: caseSensitive
  });
  console.log(`📝 Added auto-reply rule: "${trigger}" → "${reply}"`);
}

// Function to get current auto-reply status
function getAutoReplyStatus() {
  return {
    enabled: AUTO_REPLY_CONFIG.enabled,
    rules: AUTO_REPLY_CONFIG.rules,
    allowedNumbers: ALLOWED_NUMBERS
  };
}

// Test function
async function testAutoReplySystem() {
  console.log('🧪 Testing Auto-Reply System...\n');
  
  const testMessages = [
    'Hi there!',
    'Hello',
    'Hey mtaasisi',
    'How are you?',
    'hi there',
    'HELLO'
  ];
  
  for (const message of testMessages) {
    const reply = shouldAutoReply(message);
    if (reply) {
      console.log(`✅ "${message}" → "${reply}"`);
    } else {
      console.log(`❌ "${message}" → No auto-reply`);
    }
  }
  
  console.log('\n📋 Current Auto-Reply Rules:');
  AUTO_REPLY_CONFIG.rules.forEach((rule, index) => {
    console.log(`   ${index + 1}. Trigger: "${rule.trigger.join('", "')}"`);
    console.log(`      Reply: "${rule.reply}"`);
  });
}

// Export functions for use in your app
export { 
  handleIncomingMessage, 
  shouldAutoReply, 
  sendAutoReply, 
  setAutoReplyEnabled,
  addAutoReplyRule,
  getAutoReplyStatus,
  testAutoReplySystem
};

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🤖 Complete Auto-Reply System');
  console.log('📋 Rule: Any message containing "Hi" → "Mambo vipi"\n');
  
  testAutoReplySystem().then(() => {
    console.log('\n✅ Auto-reply system test completed!');
  }).catch(error => {
    console.error('❌ Test failed:', error);
  });
}
