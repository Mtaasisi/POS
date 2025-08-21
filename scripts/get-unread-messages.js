/**
 * Get Unread WhatsApp Messages
 * 
 * This script fetches only unread messages from your WhatsApp Green API instance
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function getUnreadMessages() {
  console.log('📱 Fetching Unread WhatsApp Messages...\n');

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    // Get all chats first
    const chatsResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getChats/${apiToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!chatsResponse.ok) {
      throw new Error(`Failed to fetch chats: ${chatsResponse.status} ${chatsResponse.statusText}`);
    }

    const chatsData = await chatsResponse.json();
    console.log('✅ Successfully fetched chats');
    
    if (!chatsData || !Array.isArray(chatsData)) {
      console.log('📋 No chats found or invalid response format');
      return;
    }

    // Filter chats with unread messages
    const chatsWithUnread = chatsData.filter(chat => chat.unreadCount > 0);
    
    console.log(`📊 Found ${chatsData.length} total chats`);
    console.log(`📋 Found ${chatsWithUnread.length} chats with unread messages:\n`);

    if (chatsWithUnread.length === 0) {
      console.log('🎉 No unread messages found! All caught up.');
      return;
    }

    // Get unread messages for each chat
    for (let i = 0; i < chatsWithUnread.length; i++) {
      const chat = chatsWithUnread[i];
      const chatNumber = i + 1;
      
      console.log(`🔸 Chat ${chatNumber}: ${chat.id}`);
      console.log(`   Name: ${chat.name || 'Unknown'}`);
      console.log(`   Unread Count: ${chat.unreadCount}`);
      console.log(`   Type: ${chat.type || 'Unknown'}`);
      
      if (chat.lastMessage) {
        console.log(`   Last Message: ${chat.lastMessage.text || 'No text'}`);
        console.log(`   Last Message Time: ${new Date(chat.lastMessage.timestamp * 1000).toLocaleString()}`);
      }
      
      // Get detailed unread messages for this chat
      try {
        const unreadMessages = await getUnreadMessagesForChat(chat.id);
        if (unreadMessages.length > 0) {
          console.log(`   📬 Unread Messages:`);
          unreadMessages.forEach((msg, index) => {
            const msgTime = new Date(msg.timestamp * 1000).toLocaleString();
            console.log(`      ${index + 1}. [${msgTime}] ${msg.senderId}: ${msg.textMessage || msg.extendedTextMessage?.text || 'Media message'}`);
          });
        }
      } catch (error) {
        console.log(`   ⚠️  Could not fetch unread messages: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Summary
    const totalUnread = chatsWithUnread.reduce((sum, chat) => sum + chat.unreadCount, 0);
    console.log('📋 Unread Messages Summary:');
    console.log(`   Total Chats with Unread: ${chatsWithUnread.length}`);
    console.log(`   Total Unread Messages: ${totalUnread}`);

  } catch (error) {
    console.error('❌ Error fetching unread messages:', error.message);
    
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

async function getUnreadMessagesForChat(chatId) {
  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    // Get recent messages for this chat
    const historyResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getChatHistory/${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: chatId,
        count: 20 // Get last 20 messages to check for unread
      })
    });

    if (!historyResponse.ok) {
      throw new Error(`Failed to fetch chat history: ${historyResponse.status}`);
    }

    const messages = await historyResponse.json();
    
    if (!messages || !Array.isArray(messages)) {
      return [];
    }

    // Filter for unread messages (messages not from self and recent)
    const unreadMessages = messages.filter(msg => {
      // Check if message is from someone else (not self)
      const isFromOther = msg.senderId !== `${WHATSAPP_CREDENTIALS.instanceId}@c.us`;
      
      // Check if message is recent (within last 24 hours)
      const messageTime = new Date(msg.timestamp * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const isRecent = messageTime > oneDayAgo;
      
      return isFromOther && isRecent;
    });

    return unreadMessages;
    
  } catch (error) {
    console.error(`Error fetching unread messages for ${chatId}:`, error.message);
    return [];
  }
}

// Run the function
getUnreadMessages().then(() => {
  console.log('✅ Unread messages fetching completed');
}).catch(error => {
  console.error('❌ Script failed:', error);
});
