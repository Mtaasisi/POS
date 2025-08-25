/**
 * Fixed Webhook Server for WhatsApp Testing
 * 
 * This server properly handles webhook verification according to official specs
 */

import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8888;

// Your WhatsApp credentials
const WHATSAPP_CREDENTIALS = {
  accessToken: 'EAAi4VB6prOwBPACaXuiHkOZA5mZBh2PDuBYsQxxTnMzxI0Jxl5OmYShKZAlGijhZAIvuRuPX6jUNDqozcjLlysqgX2iTMIZCnORcbfKkYJC2ZBs7rYGKns7nOvgc6O8ZAsZA6ZASl4RXIhZCy4nW4s0sUCJaxZBaiVpa2SQgcLq0qZAPD3lN28NSJjQZB13qYo8bMM25OXkZAZCjT3QZCMlIU2aNO4CfSZBdEJ0Q7nP8DUyi4NjrLCCfn5MNZCnepGeozbkpaG',
  phoneNumberId: '100948499751706',
  verifyToken: 'LATS_VERIFY_2024',
  apiUrl: 'https://graph.facebook.com/v18.0'
};

// Allowed numbers (for testing/security)
const ALLOWED_NUMBERS = [
  '255746605561', // Your number
  '254700000000',
  '254712345678'
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Function to verify webhook
function verifyWebhook(mode, token, challenge) {
  console.log('🔍 DEBUG: Verifying webhook');
  console.log('   - mode:', mode);
  console.log('   - token:', token);
  console.log('   - expected token:', WHATSAPP_CREDENTIALS.verifyToken);
  console.log('   - challenge:', challenge);
  
  if (mode === 'subscribe' && token === WHATSAPP_CREDENTIALS.verifyToken) {
    console.log('✅ Webhook verified successfully');
    return challenge;
  }
  console.log('❌ Webhook verification failed');
  return null;
}

// Function to check if message should trigger auto-reply
function shouldAutoReply(messageText) {
  if (!messageText) return null;
  
  const lowerMessage = messageText.toLowerCase().trim();
  
  const triggers = ['hi', 'hello', 'hey', 'hallo', 'mambo'];
  
  for (const trigger of triggers) {
    if (lowerMessage.includes(trigger)) {
      return 'Mambo vipi mtaasisi! Karibu kwenye LATS. Tunawezaje kukusaidia leo?';
    }
  }
  
  return null;
}

// Function to send message via WhatsApp Official API
async function sendWhatsAppMessage(phoneNumber, messageText) {
  const { accessToken, phoneNumberId, apiUrl } = WHATSAPP_CREDENTIALS;
  
  try {
    console.log(`📤 Sending message to ${phoneNumber}: "${messageText}"`);
    
    const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: messageText
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Message sent successfully!`);
    console.log(`   Message ID: ${result.messages?.[0]?.id || 'Unknown'}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to send message:`, error.message);
    return null;
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Webhook Server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/api/whatsapp-official-webhook',
      health: '/health',
      test: '/test'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      accessToken: WHATSAPP_CREDENTIALS.accessToken ? 'SET' : 'NOT SET',
      phoneNumberId: WHATSAPP_CREDENTIALS.phoneNumberId ? 'SET' : 'NOT SET',
      verifyToken: WHATSAPP_CREDENTIALS.verifyToken ? 'SET' : 'NOT SET'
    }
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    webhookUrl: `${req.protocol}://${req.get('host')}/api/whatsapp-official-webhook`
  });
});

// WhatsApp webhook endpoint - FIXED VERSION
app.all('/api/whatsapp-official-webhook', async (req, res) => {
  console.log('📨 WhatsApp Cloud API webhook received:', new Date().toISOString());
  console.log('🔍 DEBUG: Starting webhook handler');
  console.log('📋 Request method:', req.method);
  console.log('📋 Query parameters:', JSON.stringify(req.query, null, 2));
  console.log('📋 Headers:', req.headers);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔍 DEBUG: Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  try {
    // Handle webhook verification (GET request)
    if (req.method === 'GET') {
      console.log('🔍 DEBUG: Handling GET request (webhook verification)');
      
      // Extract query parameters - FIXED: Use req.query directly
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      console.log('🔍 DEBUG: Verification parameters:');
      console.log('   - mode:', mode);
      console.log('   - token:', token);
      console.log('   - challenge:', challenge);
      console.log('   - expected verify token:', WHATSAPP_CREDENTIALS.verifyToken);
      
      if (mode && token) {
        console.log('🔍 DEBUG: Attempting webhook verification');
        const verificationResponse = verifyWebhook(mode, token, challenge);
        
        console.log('🔍 DEBUG: Verification result:', verificationResponse);
        
        if (verificationResponse) {
          console.log('✅ DEBUG: Webhook verification successful, returning challenge');
          res.set('Content-Type', 'text/plain');
          res.send(verificationResponse);
          return;
        } else {
          console.log('❌ DEBUG: Webhook verification failed, returning 403');
          res.status(403).json({
            error: 'Forbidden',
            message: 'Webhook verification failed',
            debug: {
              receivedToken: token,
              expectedToken: WHATSAPP_CREDENTIALS.verifyToken,
              mode: mode,
              challenge: challenge
            }
          });
          return;
        }
      }
      
      console.log('🔍 DEBUG: No verification parameters, returning status');
      res.json({
        message: 'WhatsApp Official API Webhook is running',
        timestamp: new Date().toISOString(),
        debug: {
          environmentVariables: {
            accessToken: WHATSAPP_CREDENTIALS.accessToken ? 'SET' : 'NOT SET',
            phoneNumberId: WHATSAPP_CREDENTIALS.phoneNumberId ? 'SET' : 'NOT SET',
            verifyToken: WHATSAPP_CREDENTIALS.verifyToken ? 'SET' : 'NOT SET'
          }
        }
      });
      return;
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      console.log('🔍 DEBUG: Handling POST request (incoming message)');
      console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

      // Extract message data from WhatsApp Cloud API format (official spec)
      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages?.[0];
      
      console.log('🔍 DEBUG: Parsing WhatsApp Cloud API payload');
      console.log('   - object:', req.body.object);
      console.log('   - entry ID:', entry?.id);
      console.log('   - field:', changes?.field);
      console.log('   - messaging_product:', value?.messaging_product);
      console.log('   - phone_number_id:', value?.metadata?.phone_number_id);
      console.log('   - display_phone_number:', value?.metadata?.display_phone_number);
      
      if (!messages) {
        console.log('ℹ️  No message data found in webhook');
        res.json({
          success: true,
          processed: false,
          reason: 'no-message-data'
        });
        return;
      }

      const {
        from: senderPhone,
        timestamp,
        type: messageType,
        text
      } = messages;

      console.log(`📱 Message from ${senderPhone}: "${text?.body || 'No body'}"`);
      console.log(`⏰ Time: ${timestamp ? new Date(timestamp * 1000).toLocaleString() : 'No timestamp'}`);
      console.log(`📝 Type: ${messageType || 'Unknown'}`);
      
      // Only process text messages
      if (messageType !== 'text') {
        console.log('ℹ️  Skipping non-text message');
        res.json({
          success: true,
          processed: false,
          reason: 'non-text-message'
        });
        return;
      }
      
      // Check if sender is in allowed numbers (optional security)
      const cleanPhone = senderPhone.replace('@c.us', '');
      if (ALLOWED_NUMBERS.length > 0 && !ALLOWED_NUMBERS.includes(cleanPhone)) {
        console.log(`⚠️  Sender ${cleanPhone} not in allowed numbers`);
        res.json({
          success: true,
          processed: false,
          reason: 'not-allowed-number'
        });
        return;
      }
      
      // Check if message should trigger auto-reply
      const autoReply = shouldAutoReply(text?.body);
      
      if (autoReply) {
        console.log(`🤖 Auto-reply triggered: "${autoReply}"`);
        
        // Send the auto-reply
        const result = await sendWhatsAppMessage(cleanPhone, autoReply);
        
        if (result) {
          console.log('✅ Auto-reply sent successfully');
          res.json({
            success: true,
            processed: true,
            autoReply: true,
            replyText: autoReply,
            messageId: result.messages?.[0]?.id || 'Unknown',
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('❌ Failed to send auto-reply');
          res.json({
            success: true,
            processed: false,
            reason: 'send-failed'
          });
        }
      } else {
        console.log('ℹ️  No auto-reply triggered for this message');
        res.json({
          success: true,
          processed: true,
          autoReply: false,
          message: 'Message received but no auto-reply triggered'
        });
      }
      return;
    }
    
    // Handle unsupported methods
    console.log('🔍 DEBUG: Unsupported HTTP method:', req.method);
    res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST requests are allowed',
      debug: {
        receivedMethod: req.method,
        supportedMethods: ['GET', 'POST', 'OPTIONS']
      }
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('🔍 DEBUG: Full error details:', {
      message: error.message,
      stack: error.stack,
      request: {
        method: req.method,
        query: req.query,
        bodyLength: req.body ? JSON.stringify(req.body).length : 0
      }
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error.constructor.name,
        stack: error.stack
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Fixed WhatsApp Webhook Server started!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/api/whatsapp-official-webhook`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   - Health check: http://localhost:${PORT}/health`);
  console.log(`   - Test endpoint: http://localhost:${PORT}/test`);
  console.log(`   - Webhook: http://localhost:${PORT}/api/whatsapp-official-webhook`);
  console.log('');
  console.log('📱 Use this URL in Meta Developer Console for testing');
  console.log('=' .repeat(60));
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
