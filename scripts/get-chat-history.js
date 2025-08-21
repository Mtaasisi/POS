/**
 * Get Detailed Chat History
 * 
 * This script fetches detailed chat history for a specific WhatsApp chat
 * Usage: node scripts/get-chat-history.js <chat_id>
 * Example: node scripts/get-chat-history.js 254700000000@c.us
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function getChatHistory(chatId) {
  if (!chatId) {
    console.log('❌ Please provide a chat ID');
    console.log('Usage: node scripts/get-chat-history.js <chat_id>');
    console.log('Example: node scripts/get-chat-history.js 254700000000@c.us');
    return;
  }

  console.log(`📱 Fetching Chat History for: ${chatId}\n`);

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    // Get chat history
    const historyResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getChatHistory/${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: chatId,
        count: 50 // Get last 50 messages
      })
    });

    if (!historyResponse.ok) {
      throw new Error(`Failed to fetch chat history: ${historyResponse.status} ${historyResponse.statusText}`);
    }

    const historyData = await historyResponse.json();
    console.log('✅ Successfully fetched chat history');
    
    if (!historyData || !Array.isArray(historyData)) {
      console.log('📋 No messages found or invalid response format');
      return;
    }

    console.log(`📊 Found ${historyData.length} messages in chat history\n`);

    // Display messages in chronological order (oldest first)
    const sortedMessages = historyData.sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sortedMessages.length; i++) {
      const message = sortedMessages[i];
      const messageNumber = i + 1;
      const messageTime = new Date(message.timestamp * 1000).toLocaleString();
      
      console.log(`🔸 Message ${messageNumber}:`);
      console.log(`   Time: ${messageTime}`);
      console.log(`   Type: ${message.type || 'Unknown'}`);
      console.log(`   From: ${message.senderId || 'Unknown'}`);
      
      if (message.textMessage) {
        console.log(`   Text: ${message.textMessage}`);
      } else if (message.extendedTextMessage) {
        console.log(`   Text: ${message.extendedTextMessage.text}`);
      } else if (message.imageMessage) {
        console.log(`   Image: ${message.imageMessage.caption || 'No caption'}`);
      } else if (message.videoMessage) {
        console.log(`   Video: ${message.videoMessage.caption || 'No caption'}`);
      } else if (message.audioMessage) {
        console.log(`   Audio: Voice message`);
      } else if (message.documentMessage) {
        console.log(`   Document: ${message.documentMessage.fileName || 'Unknown file'}`);
      } else {
        console.log(`   Content: ${JSON.stringify(message).substring(0, 100)}...`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Summary
    console.log('📋 Chat Summary:');
    console.log(`   Total Messages: ${historyData.length}`);
    console.log(`   Chat ID: ${chatId}`);
    console.log(`   Time Range: ${sortedMessages.length > 0 ? 
      `${new Date(sortedMessages[0].timestamp * 1000).toLocaleString()} to ${new Date(sortedMessages[sortedMessages.length - 1].timestamp * 1000).toLocaleString()}` : 
      'No messages'}`);

  } catch (error) {
    console.error('❌ Error fetching chat history:', error.message);
    
    if (error.message.includes('466')) {
      console.log('\n⚠️  Quota exceeded. You can only access chats with allowed numbers:');
      console.log('   - 254700000000@c.us');
      console.log('   - 254712345678@c.us');
      console.log('   - 255746605561@c.us');
      console.log('\n💡 Upgrade your Green API plan to access all chats:');
      console.log('   https://console.green-api.com');
    }
  }
}

// Get chat ID from command line arguments
const chatId = process.argv[2];

// Run the function
getChatHistory(chatId).then(() => {
  console.log('✅ Chat history fetching completed');
}).catch(error => {
  console.error('❌ Script failed:', error);
});
