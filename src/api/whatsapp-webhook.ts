import { NextApiRequest, NextApiResponse } from 'next';
import { WhatsAppWebhookHandler } from '../services/whatsappWebhookHandler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Validate webhook data
    if (!webhookData || !webhookData.typeWebhook) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Process the webhook
    await WhatsAppWebhookHandler.processWebhook(webhookData);

    // Return success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
