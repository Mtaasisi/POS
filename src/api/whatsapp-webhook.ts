import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { whatsappService, WhatsAppWebhook } from '../services/whatsappService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData: WhatsAppWebhook = req.body;
    
    console.log('Received WhatsApp webhook:', {
      type: webhookData.type,
      timestamp: webhookData.timestamp,
      idMessage: webhookData.idMessage
    });

    // Initialize WhatsApp service if not already done
    // This will now handle concurrent initialization properly
    await whatsappService.initialize();

    // Process the webhook
    await whatsappService.processWebhook(webhookData);

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    
    // Log the error to database
    try {
      await supabase
        .from('error_logs')
        .insert({
          service: 'whatsapp_webhook',
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          payload: req.body,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export for use in other parts of the application
export { handler as whatsappWebhookHandler };
