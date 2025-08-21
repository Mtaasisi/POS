/**
 * WhatsApp Webhook Vercel Function
 * 
 * This function handles incoming WhatsApp messages and triggers auto-replies
 * Deploy this to Vercel Functions for automatic auto-reply processing
 */

// WhatsApp credentials
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

// Vercel function handler
export default async function handler(req, res) {
  console.log('📨 Webhook received:', new Date().toISOString());
  console.log('📋 Request method:', req.method);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
    return;
  }

  try {
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    // Extract message data from webhook
    const { body, senderId, timestamp, type } = req.body;
    
    console.log(`📱 Message from ${senderId}: "${body || 'No body'}"`);
    console.log(`⏰ Time: ${timestamp ? new Date(timestamp * 1000).toLocaleString() : 'No timestamp'}`);
    console.log(`📝 Type: ${type || 'Unknown'}`);
    
    // Only process text messages
    if (type !== 'textMessage' && type !== 'extendedTextMessage') {
      console.log('ℹ️  Skipping non-text message');
      res.status(200).json({ 
        success: true, 
        processed: false, 
        reason: 'non-text-message' 
      });
      return;
    }
    
    // Check if sender is in allowed numbers
    if (!ALLOWED_NUMBERS.includes(senderId)) {
      console.log(`⚠️  Sender ${senderId} not in allowed numbers`);
      res.status(200).json({ 
        success: true, 
        processed: false, 
        reason: 'not-allowed-number' 
      });
      return;
    }
    
    // Check if message should trigger auto-reply
    const autoReply = shouldAutoReply(body);
    
    if (autoReply) {
      console.log(`🤖 Auto-reply triggered: "${autoReply}"`);
      
      // Send the auto-reply
      const result = await sendAutoReply(senderId, autoReply);
      
      if (result) {
        console.log('✅ Auto-reply sent successfully');
        res.status(200).json({ 
          success: true, 
          processed: true,
          autoReply: true, 
          replyText: autoReply,
          messageId: result.idMessage,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ Failed to send auto-reply');
        res.status(200).json({ 
          success: true, 
          processed: false, 
          reason: 'send-failed' 
        });
      }
    } else {
      console.log('ℹ️  No auto-reply triggered for this message');
      res.status(200).json({ 
        success: true, 
        processed: true, 
        autoReply: false 
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
