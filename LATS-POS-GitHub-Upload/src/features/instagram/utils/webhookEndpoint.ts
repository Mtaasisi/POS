// Instagram Webhook Endpoint Utility
// Example implementation for handling Instagram webhooks

import { InstagramWebhook } from '../types/instagram';
import { processInstagramWebhook } from '../hooks/useInstagramDM';

export interface WebhookEndpointConfig {
  verifyToken: string;
  enableLogging?: boolean;
  cors?: {
    origin: string[];
    methods: string[];
  };
}

/**
 * Webhook verification function for GET requests
 * Call this in your webhook GET endpoint
 */
export function verifyWebhook(
  mode: string,
  token: string,
  challenge: string,
  verifyToken: string
): { status: number; body: string } {
  console.log('🔍 Webhook verification:', { mode, token: token?.substring(0, 10) + '...', challenge });
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verified successfully');
    return { status: 200, body: challenge };
  } else {
    console.error('❌ Webhook verification failed');
    return { status: 403, body: 'Forbidden' };
  }
}

/**
 * Process webhook payload for POST requests
 * Call this in your webhook POST endpoint
 */
export async function handleWebhook(
  body: any,
  config: WebhookEndpointConfig
): Promise<{ status: number; body: string }> {
  try {
    if (config.enableLogging) {
      console.log('📱 Instagram webhook received:', JSON.stringify(body, null, 2));
    }

    // Validate webhook structure
    if (!body || body.object !== 'instagram') {
      console.error('❌ Invalid webhook object type:', body?.object);
      return { status: 400, body: 'Invalid webhook object' };
    }

    // Process the webhook
    await processInstagramWebhook(body as InstagramWebhook);
    
    if (config.enableLogging) {
      console.log('✅ Webhook processed successfully');
    }
    
    return { status: 200, body: 'OK' };
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return { status: 500, body: 'Internal server error' };
  }
}

/**
 * Express.js middleware example
 */
export function createExpressWebhookHandler(config: WebhookEndpointConfig) {
  return {
    // GET endpoint for webhook verification
    verify: (req: any, res: any) => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      const result = verifyWebhook(mode, token, challenge, config.verifyToken);
      res.status(result.status).send(result.body);
    },
    
    // POST endpoint for webhook events
    handle: async (req: any, res: any) => {
      // Verify request signature (recommended for production)
      // const signature = req.headers['x-hub-signature-256'];
      // if (!verifySignature(req.body, signature)) {
      //   return res.status(403).send('Forbidden');
      // }
      
      const result = await handleWebhook(req.body, config);
      res.status(result.status).send(result.body);
    }
  };
}

/**
 * Next.js API route example
 */
export function createNextJSWebhookHandler(config: WebhookEndpointConfig) {
  return async (req: any, res: any) => {
    if (req.method === 'GET') {
      // Webhook verification
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      const result = verifyWebhook(mode, token, challenge, config.verifyToken);
      res.status(result.status).send(result.body);
    } else if (req.method === 'POST') {
      // Handle webhook event
      const result = await handleWebhook(req.body, config);
      res.status(result.status).send(result.body);
    } else {
      res.status(405).send('Method not allowed');
    }
  };
}

/**
 * Webhook signature verification utility
 * Use this to verify webhooks are from Instagram/Facebook
 */
export function verifySignature(payload: string, signature: string, appSecret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

/**
 * Example webhook server setup
 */
export const exampleWebhookSetup = `
// Express.js example
const express = require('express');
const app = express();

app.use(express.json());

const webhookHandler = createExpressWebhookHandler({
  verifyToken: 'your_verify_token_here',
  enableLogging: true
});

app.get('/webhook/instagram', webhookHandler.verify);
app.post('/webhook/instagram', webhookHandler.handle);

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});

// Next.js example (pages/api/webhook/instagram.ts)
import { createNextJSWebhookHandler } from '@/features/instagram/utils/webhookEndpoint';

const handler = createNextJSWebhookHandler({
  verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN!,
  enableLogging: process.env.NODE_ENV === 'development'
});

export default handler;
`;

// Export configuration helper
export function getWebhookConfig(): WebhookEndpointConfig {
  return {
    verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || 'default_verify_token',
    enableLogging: process.env.NODE_ENV === 'development',
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  };
}
