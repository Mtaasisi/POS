#!/usr/bin/env node

/**
 * LATS CHANCE API Server
 * 
 * This server handles API requests for the LATS CHANCE application
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);













// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Beem Payment API Routes
app.post('/api/beem-payment', async (req, res) => {
  console.log('🔍 Beem payment API request received:', req.body);
  
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
});

// Beem Webhook endpoint
app.post('/api/beem-webhook', async (req, res) => {
  console.log('🔍 Beem webhook received:', req.body);
  
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
});

// Helper functions for Beem payment API
async function handleCreateOrder(data, res) {
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

    console.log('🔍 Creating order with data:', {
      amount,
      currency,
      reference,
      customerEmail,
      customerName,
      customerPhone
    });

    // For testing purposes, return a mock response
    // In production, this would call the actual Beem API
    const mockResponse = {
      success: true,
      data: {
        checkout_url: `https://beem.africa/checkout/mock-${reference}`,
        session_id: `session_${reference}_${Date.now()}`,
        status: 'pending'
      }
    };

    console.log('🔍 Mock Beem API Response:', mockResponse);

    // Log the transaction
    try {
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
      console.log('✅ Transaction logged successfully');
    } catch (dbError) {
      console.error('❌ Error logging transaction:', dbError);
      // Continue with the response even if DB logging fails
    }

    return res.status(200).json({
      success: true,
      orderId: reference,
      message: 'Checkout session created successfully (MOCK)',
      data: mockResponse.data
    });
  } catch (error) {
    console.error('❌ Beem API Error (Server):', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCheckStatus(data, res) {
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

function mapBeemStatus(beemStatus) {
  switch (beemStatus) {
    case 'completed':
      return 'SUCCESS';
    case 'failed':
      return 'FAIL';
    case 'cancelled':
      return 'CANCELLED';
    case 'pending':
      return 'PENDING';
    default:
      return 'UNKNOWN';
  }
}

// Green API Proxy Routes
app.all('/api/green-api-proxy.php/*', async (req, res) => {
  try {
    console.log('🔍 Green API proxy request:', req.method, req.path);
    
    // Extract instance ID from path
    const pathMatch = req.path.match(/\/waInstance(\d+)\/(.+)/);
    if (!pathMatch) {
      return res.status(400).json({
        error: 'Invalid endpoint',
        message: 'Could not extract instance ID from path'
      });
    }
    
    const [, instanceId, endpoint] = pathMatch;
    console.log(`📱 Instance ID: ${instanceId}, Endpoint: ${endpoint}`);
    
    // Get instance credentials from database
    const { data: instances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('instance_id, api_token, green_api_host')
      .eq('instance_id', instanceId)
      .limit(1);
    
    if (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({
        error: 'Database error',
        message: dbError.message
      });
    }
    
    if (!instances || instances.length === 0) {
      console.error(`❌ Instance not found: ${instanceId}`);
      return res.status(404).json({
        error: 'Instance not found',
        message: `Instance ID ${instanceId} not found in database`
      });
    }
    
    const instance = instances[0];
    const apiToken = instance.api_token;
    const apiUrl = instance.green_api_host || 'https://api.green-api.com';
    
    console.log(`🔑 Using API URL: ${apiUrl}`);
    
    // Build target URL
    const targetUrl = `${apiUrl}/waInstance${instanceId}/${endpoint}`;
    console.log(`🎯 Target URL: ${targetUrl}`);
    
    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };
    
    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
      timeout: 30000
    };
    
    // Add body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      requestOptions.body = JSON.stringify(req.body);
    }
    
    console.log(`📤 Forwarding request to Green API...`);
    
    // Make request to Green API
    const response = await fetch(targetUrl, requestOptions);
    const responseText = await response.text();
    
    console.log(`📥 Green API response: ${response.status} ${response.statusText}`);
    
    // Set response headers
    res.set('Content-Type', 'application/json');
    
    // Forward the response
    res.status(response.status).send(responseText);
    
  } catch (error) {
    console.error('❌ Green API proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LATS CHANCE API Server running on port ${PORT}`);
  console.log(`💳 Beem Payment API: http://localhost:${PORT}/api/beem-payment`);
  console.log(`🔗 Beem Webhook: http://localhost:${PORT}/api/beem-webhook`);
  console.log(`📱 Green API Proxy: http://localhost:${PORT}/api/green-api-proxy.php/*`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
