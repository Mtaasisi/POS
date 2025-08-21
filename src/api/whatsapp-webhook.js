/**
 * WhatsApp Webhook Endpoint
 * 
 * This endpoint handles incoming WhatsApp messages and triggers auto-replies
 * Add this to your app's API routes (e.g., pages/api/whatsapp-webhook.js for Next.js)
 */

// Import the auto-reply system
import { handleIncomingMessage } from '../../scripts/auto-reply-system.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    console.log('📨 Webhook received:', new Date().toISOString());
    
    // Get the webhook data from the request body
    const webhookData = req.body;
    
    // Log the incoming data for debugging
    console.log('📋 Webhook data:', {
      type: webhookData.type,
      senderId: webhookData.senderId,
      body: webhookData.body?.substring(0, 50) + '...',
      timestamp: webhookData.timestamp
    });
    
    // Process the incoming message using our auto-reply system
    const result = await handleIncomingMessage(webhookData);
    
    // Log the processing result
    console.log('✅ Webhook processed:', {
      processed: result.processed,
      autoReply: result.autoReply,
      replyText: result.replyText,
      messageId: result.messageId
    });
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      processed: result.processed,
      autoReply: result.autoReply || false,
      replyText: result.replyText || null,
      messageId: result.messageId || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Return error response
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Optional: Add CORS headers if needed
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
