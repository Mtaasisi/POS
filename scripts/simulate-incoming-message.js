/**
 * Simulate Incoming Message Script
 * This simulates what happens when you send "Hi" from your phone
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

// Function to check if message should trigger auto-reply
function shouldAutoReply(messageText) {
  if (!messageText) return null;
  
  const lowerMessage = messageText.toLowerCase().trim();
  
  // Check for "hi" in the message
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
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

// Simulate incoming message from your phone
async function simulateIncomingMessage() {
  console.log('🧪 Simulating Incoming "Hi" Message...\n');
  
  const senderId = '255746605561@c.us'; // Your phone number
  const messageText = 'Hi'; // The message you send from your phone
  
  console.log(`📱 Simulating message from ${senderId}: "${messageText}"`);
  console.log('📋 This is what should happen when you send "Hi" from your phone\n');
  
  // Check if sender is in allowed numbers
  if (!ALLOWED_NUMBERS.includes(senderId)) {
    console.log(`⚠️  Sender ${senderId} not in allowed numbers`);
    console.log('❌ Auto-reply would NOT be sent');
    return;
  }
  
  // Check if message should trigger auto-reply
  const autoReply = shouldAutoReply(messageText);
  
  if (autoReply) {
    console.log(`🤖 Auto-reply triggered: "${autoReply}"`);
    console.log('📤 Sending auto-reply...');
    
    // Send the auto-reply
    const result = await sendAutoReply(senderId, autoReply);
    
    if (result) {
      console.log('✅ Auto-reply sent successfully!');
      console.log(`   Message ID: ${result.idMessage}`);
      console.log('\n📱 Check your WhatsApp - you should receive "Mambo vipi"');
    } else {
      console.log('❌ Failed to send auto-reply');
    }
  } else {
    console.log('ℹ️  No auto-reply triggered for this message');
  }
}

// Run the simulation
simulateIncomingMessage().catch(console.error);
