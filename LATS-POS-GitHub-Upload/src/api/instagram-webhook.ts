// Instagram Webhook API Endpoint Example
// This file shows how to implement the webhook endpoint in your backend

import { 
  verifyWebhook, 
  handleWebhook, 
  WebhookEndpointConfig 
} from '../features/instagram/utils/webhookEndpoint';

// Configuration
const config: WebhookEndpointConfig = {
  verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || 'your_verify_token_here',
  enableLogging: process.env.NODE_ENV === 'development',
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
};

/**
 * Express.js implementation example
 */
export const expressWebhookHandler = {
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
    try {
      // Optional: Verify webhook signature for security
      // const signature = req.headers['x-hub-signature-256'];
      // const appSecret = process.env.FACEBOOK_APP_SECRET;
      // if (!verifySignature(JSON.stringify(req.body), signature, appSecret)) {
      //   return res.status(403).send('Forbidden');
      // }
      
      const result = await handleWebhook(req.body, config);
      res.status(result.status).send(result.body);
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal Server Error');
    }
  }
};

/**
 * Usage with Express.js:
 * 
 * const express = require('express');
 * const { expressWebhookHandler } = require('./api/instagram-webhook');
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * app.get('/webhook/instagram', expressWebhookHandler.verify);
 * app.post('/webhook/instagram', expressWebhookHandler.handle);
 * 
 * app.listen(3000);
 */

/**
 * Next.js API route implementation
 * Save this as: pages/api/webhook/instagram.ts (or app/api/webhook/instagram/route.ts for App Router)
 */
export const nextJSHandler = async (req: any, res: any) => {
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
    res.status(405).send('Method Not Allowed');
  }
};

/**
 * Fastify implementation example
 */
export const fastifyWebhookHandler = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        'hub.mode': { type: 'string' },
        'hub.verify_token': { type: 'string' },
        'hub.challenge': { type: 'string' }
      }
    },
    body: {
      type: 'object'
    }
  },
  
  handler: async (request: any, reply: any) => {
    if (request.method === 'GET') {
      const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query;
      const result = verifyWebhook(mode, token, challenge, config.verifyToken);
      reply.status(result.status).send(result.body);
    } else {
      const result = await handleWebhook(request.body, config);
      reply.status(result.status).send(result.body);
    }
  }
};

export default {
  expressWebhookHandler,
  nextJSHandler,
  fastifyWebhookHandler,
  config
};
