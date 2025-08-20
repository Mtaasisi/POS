import { NextApiRequest, NextApiResponse } from 'next';
import { chromeExtensionService } from '../services/chromeExtensionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Chrome extension webhook received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Validate webhook data
    if (!webhookData || !webhookData.type) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Process the webhook through Chrome extension service
    await chromeExtensionService.processIncomingMessage({
      type: webhookData.type,
      data: webhookData.data || webhookData,
      timestamp: webhookData.timestamp || Date.now(),
      chatId: webhookData.chatId,
      customerId: webhookData.customerId
    });

    // Return success
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Chrome extension webhook processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
