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
    const { action, data } = req.body;

    if (action === 'createOrder') {
      return await handleCreateOrder(data, res);
    } else if (action === 'checkStatus') {
      return await handleCheckStatus(data, res);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Beem payment API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateOrder(data: any, res: NextApiResponse) {
  try {
    const {
      amount,
      currency,
      reference,
      customerEmail,
      customerName,
      customerPhone,
      description,
      metadata
    } = data;

    const apiKey = '6d829f20896bd90e';
    const secretKey = 'NTg0ZjY5Mzc3MGFkMjU5Y2M2ZjY2NjFlNGEzNGRiZjZlNDQ5ZTlkM2YzNmEyMzE0ZmI3YzFjM2ZhYmMxYjk0Yw==';
    const baseUrl = 'https://beem.africa/api';

    const checkoutData = {
      amount,
      currency: currency || 'TZS',
      reference,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      description: description || `Order ${reference}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/beem-webhook`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/cancel`,
      metadata
    };

    console.log('🔍 Beem API Request (Server):', {
      url: `${baseUrl}/v1/checkout/sessions`,
      method: 'POST',
      body: checkoutData
    });

    const response = await fetch(`${baseUrl}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Secret-Key': secretKey
      },
      body: JSON.stringify(checkoutData)
    });

    console.log('🔍 Beem API Response (Server):', {
      status: response.status,
      statusText: response.statusText
    });

    const result = await response.json();
    console.log('🔍 Beem API Result (Server):', result);

    if (response.ok && result.success) {
      // Log the transaction
      await supabase
        .from('payment_transactions')
        .insert({
          order_id: reference,
          provider: 'beem',
          amount: parseFloat(amount),
          currency: currency || 'TZS',
          status: 'PENDING',
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          reference,
          metadata,
          created_at: new Date().toISOString()
        });

      return res.status(200).json({
        success: true,
        orderId: reference,
        message: 'Checkout session created successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to create checkout session',
        data: result
      });
    }
  } catch (error) {
    console.error('❌ Beem API Error (Server):', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(503).json({
        success: false,
        message: 'Beem Africa API is currently unavailable. Please try again later.',
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCheckStatus(data: any, res: NextApiResponse) {
  try {
    const { orderId } = data;

    const apiKey = '6d829f20896bd90e';
    const secretKey = 'NTg0ZjY5Mzc3MGFkMjU5Y2M2ZjY2NjFlNGEzNGRiZjZlNDQ5ZTlkM2YzNmEyMzE0ZmI3YzFjM2ZhYmMxYjk0Yw==';
    const baseUrl = 'https://beem.africa/api';

    const response = await fetch(`${baseUrl}/v1/checkout/sessions/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Secret-Key': secretKey
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return res.status(200).json({
        success: true,
        result: result.data.status === 'completed' ? 'SUCCESS' : 'FAIL',
        orders: [{
          order_id: orderId,
          payment_status: mapBeemStatus(result.data.status),
          amount: result.data.amount,
          reference: result.data.reference,
          buyer_email: result.data.customer_email,
          buyer_name: result.data.customer_name,
          buyer_phone: result.data.customer_phone,
          created_at: result.data.created_at,
          updated_at: result.data.updated_at,
          metadata: result.data.metadata
        }],
        count: 1,
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to check payment status',
        data: result
      });
    }
  } catch (error) {
    console.error('❌ Beem Status Check Error (Server):', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking payment status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
