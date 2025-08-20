import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signature } = req.headers;
    const payload = req.body;

    // Verify webhook signature (implement according to Beem Africa docs)
    // const isValid = verifyWebhookSignature(payload, signature as string);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const {
      order_id,
      status,
      amount,
      currency,
      reference,
      customer_email,
      customer_name,
      customer_phone,
      metadata
    } = payload;

    // Log the webhook
    const { error: webhookError } = await supabase
      .from('payment_webhooks')
      .insert({
        provider: 'beem',
        event_type: 'payment.' + status,
        payload: payload,
        processed: false
      });

    if (webhookError) {
      console.error('Error logging webhook:', webhookError);
    }

    // Update payment transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .upsert({
        order_id,
        provider: 'beem',
        amount: parseFloat(amount),
        currency: currency || 'TZS',
        status: mapBeemStatus(status),
        customer_email,
        customer_name,
        customer_phone,
        reference,
        metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_id'
      });

    if (transactionError) {
      console.error('Error updating transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to update transaction' });
    }

    // If payment is successful, update order status
    if (status === 'completed') {
      const { error: orderError } = await supabase
        .from('pos_sales')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      if (orderError) {
        console.error('Error updating order:', orderError);
      }
    }

    // Mark webhook as processed
    await supabase
      .from('payment_webhooks')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('provider', 'beem')
      .eq('event_type', 'payment.' + status)
      .order('created_at', { ascending: false })
      .limit(1);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Beem webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function mapBeemStatus(beemStatus: string): string {
  switch (beemStatus) {
    case 'completed':
      return 'SUCCESS';
    case 'pending':
      return 'PENDING';
    case 'failed':
      return 'FAILED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'UNKNOWN';
  }
}
