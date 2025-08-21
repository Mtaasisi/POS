/**
 * Simple Webhook Server
 * Run this locally to test the auto-reply system
 */

import http from 'http';
import url from 'url';

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

// Function to process incoming webhook
async function processWebhook(webhookData) {
  console.log('📨 Processing incoming webhook...');
  console.log('📋 Webhook data:', JSON.stringify(webhookData, null, 2));
  
  try {
    // Extract message data
    const { body, senderId, timestamp, type } = webhookData;
    
    console.log(`📱 Message from ${senderId}: "${body || 'No body'}"`);
    console.log(`⏰ Time: ${timestamp ? new Date(timestamp * 1000).toLocaleString() : 'No timestamp'}`);
    console.log(`📝 Type: ${type || 'Unknown'}`);
    
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
    console.error('❌ Error processing webhook:', error.message);
    return { processed: false, reason: 'error', error: error.message };
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle POST requests
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    }));
    return;
  }

  try {
    console.log('📨 Webhook received:', new Date().toISOString());
    console.log('📋 Request method:', req.method);
    
    // Read request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        console.log('📋 Request body:', body);
        
        // Parse the webhook data
        const webhookData = JSON.parse(body);
        
        // Process the webhook
        const result = await processWebhook(webhookData);
        
        // Log the result
        console.log('✅ Webhook processed:', result);
        
        // Send response
        res.writeHead(200);
        res.end(JSON.stringify({ 
          success: true, 
          processed: result.processed,
          autoReply: result.autoReply || false,
          replyText: result.replyText || null,
          messageId: result.messageId || null,
          timestamp: new Date().toISOString()
        }));
        
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
        res.writeHead(400);
        res.end(JSON.stringify({ 
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        }));
      }
    });
    
  } catch (error) {
    console.error('❌ Server error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }));
  }
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log('🚀 Webhook server started!');
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌐 Webhook URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 To test with Green API:');
  console.log('1. Use ngrok to expose this server: ngrok http 3000');
  console.log('2. Set webhook URL in Green API to your ngrok URL');
  console.log('3. Send "Hi" from your phone to test auto-reply');
  console.log('');
  console.log('⏳ Waiting for webhooks...');
});
