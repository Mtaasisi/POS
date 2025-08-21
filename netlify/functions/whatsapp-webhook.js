/**
 * WhatsApp Webhook Netlify Function
 * 
 * This function handles incoming WhatsApp messages and triggers auto-replies
 * Deploy this to Netlify Functions for automatic auto-reply processing
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

// Netlify function handler
export default async function handler(event, context) {
  console.log('📨 Webhook received:', new Date().toISOString());
  console.log('📋 Event method:', event.httpMethod);
  console.log('📋 Event body:', event.body);
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only POST requests are allowed'
      })
    };
  }

  try {
    // Validate request body
    if (!event.body) {
      console.log('❌ No request body received');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad request',
          message: 'Request body is required'
        })
      };
    }
    
    // Parse the webhook data from the request body
    let webhookData;
    try {
      webhookData = JSON.parse(event.body);
      console.log('📋 Parsed webhook data:', webhookData);
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }
    
    // Extract message data from webhook
    const { body, senderId, timestamp, type } = webhookData;
    
    console.log(`📱 Message from ${senderId}: "${body || 'No body'}"`);
    console.log(`⏰ Time: ${timestamp ? new Date(timestamp * 1000).toLocaleString() : 'No timestamp'}`);
    console.log(`📝 Type: ${type || 'Unknown'}`);
    
    // Only process text messages
    if (type !== 'textMessage' && type !== 'extendedTextMessage') {
      console.log('ℹ️  Skipping non-text message');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          processed: false, 
          reason: 'non-text-message' 
        })
      };
    }
    
    // Check if sender is in allowed numbers
    if (!ALLOWED_NUMBERS.includes(senderId)) {
      console.log(`⚠️  Sender ${senderId} not in allowed numbers`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          processed: false, 
          reason: 'not-allowed-number' 
        })
      };
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
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            processed: true,
            autoReply: true, 
            replyText: autoReply,
            messageId: result.idMessage,
            timestamp: new Date().toISOString()
          })
        };
      } else {
        console.log('❌ Failed to send auto-reply');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            processed: false, 
            reason: 'send-failed' 
          })
        };
      }
    } else {
      console.log('ℹ️  No auto-reply triggered for this message');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          processed: true, 
          autoReply: false 
        })
      };
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
