/**
 * Get Last 10 WhatsApp Chats
 * 
 * This script fetches the last 10 chats from your WhatsApp Green API instance
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

async function getLast10Chats() {
  console.log('📱 Fetching Last 10 WhatsApp Chats...\n');

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

    // Get the last 10 chats
    const last10Chats = chatsData.slice(-10);
    
    console.log(`📊 Found ${chatsData.length} total chats`);
    console.log(`📋 Showing last ${last10Chats.length} chats:\n`);

    // Display each chat with details
    for (let i = 0; i < last10Chats.length; i++) {
      const chat = last10Chats[i];
      const chatNumber = i + 1;
      
      console.log(`🔸 Chat ${chatNumber}:`);
      console.log(`   ID: ${chat.id}`);
      console.log(`   Name: ${chat.name || 'Unknown'}`);
      console.log(`   Type: ${chat.type || 'Unknown'}`);
      
      if (chat.lastMessage) {
        console.log(`   Last Message: ${chat.lastMessage.text || 'No text'}`);
        console.log(`   Last Message Time: ${new Date(chat.lastMessage.timestamp * 1000).toLocaleString()}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Option to get detailed chat history for a specific chat
    if (last10Chats.length > 0) {
      console.log('💡 To get detailed chat history for a specific chat, run:');
      console.log(`   node scripts/get-chat-history.js <chat_id>`);
      console.log('   Example: node scripts/get-chat-history.js 254700000000@c.us');
    }

  } catch (error) {
    console.error('❌ Error fetching chats:', error.message);
    
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

// Run the function
getLast10Chats().then(() => {
  console.log('✅ Chat fetching completed');
}).catch(error => {
  console.error('❌ Script failed:', error);
});
