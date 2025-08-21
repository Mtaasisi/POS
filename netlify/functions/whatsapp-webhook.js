// Simple WhatsApp webhook function
export default async function handler(event, context) {
  console.log('📨 Webhook received:', new Date().toISOString());
  
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

  try {
    // Log the incoming data
    console.log('📋 Event method:', event.httpMethod);
    console.log('📋 Event body:', event.body);
    
    // Parse the webhook data
    let webhookData = {};
    if (event.body) {
      try {
        webhookData = JSON.parse(event.body);
        console.log('📋 Parsed webhook data:', webhookData);
      } catch (error) {
        console.log('❌ JSON parse error:', error.message);
      }
    }
    
    // Extract message data
    const { body, senderId, type } = webhookData;
    
    console.log(`📱 Message from ${senderId}: "${body || 'No body'}"`);
    console.log(`📝 Type: ${type || 'Unknown'}`);
    
    // Simple auto-reply logic
    if (type === 'textMessage' && body && body.toLowerCase().includes('hi')) {
      console.log('🤖 Auto-reply triggered for "Hi" message');
      
      // For now, just log that we would send a reply
      console.log('📤 Would send auto-reply: "Mambo vipi"');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          processed: true,
          autoReply: true,
          replyText: 'Mambo vipi',
          message: 'Auto-reply would be sent',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        processed: true,
        autoReply: false,
        message: 'Message received but no auto-reply triggered',
        timestamp: new Date().toISOString()
      })
    };
    
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
}
