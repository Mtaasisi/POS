#!/usr/bin/env node

/**
 * WhatsApp Business API Webhook Server
 * 
 * This server handles WhatsApp Business API webhook requests
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

// WhatsApp Business API webhook endpoint
app.get('/api/whatsapp-business-webhook', async (req, res) => {
  console.log('🔍 WhatsApp Business webhook GET request received:', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers
  });

  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  console.log('🔍 Webhook verification request:', {
    mode,
    token: token ? '***' + token.slice(-4) : 'not provided',
    challenge,
    hasToken: !!token,
    hasChallenge: !!challenge
  });

  if (mode && token && challenge) {
    try {
      // Get the stored webhook verify token from database
      const { data: settings, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'whatsapp_business_webhook_verify_token')
        .single();

      if (error) {
        console.error('❌ Error fetching webhook token:', error);
        return res.status(500).send('Internal Server Error');
      }

      const storedToken = settings?.value;

      console.log('🔍 Token comparison:', {
        provided: token ? '***' + token.slice(-4) : 'not provided',
        stored: storedToken ? '***' + storedToken.slice(-4) : 'not stored',
        match: token === storedToken
      });

      if (token === storedToken) {
        console.log('✅ WhatsApp Business webhook verified successfully');
        return res.status(200).send(challenge);
      } else {
        console.log('❌ WhatsApp Business webhook verification failed - invalid token');
        return res.status(403).send('Forbidden - Invalid verify token');
      }
    } catch (error) {
      console.error('❌ Error during webhook verification:', error);
      return res.status(500).send('Internal Server Error during verification');
    }
  } else {
    console.log('❌ Missing required parameters for webhook verification:', {
      hasMode: !!mode,
      hasToken: !!token,
      hasChallenge: !!challenge
    });
    return res.status(400).send('Bad Request - Missing required parameters');
  }
});

// Handle webhook POST requests (incoming messages and status updates)
app.post('/api/whatsapp-business-webhook', async (req, res) => {
  console.log('📨 WhatsApp Business webhook POST received:', JSON.stringify(req.body, null, 2));

  try {
    const body = req.body;
    
    // Process the webhook data
    await processWebhookData(body);
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing WhatsApp Business webhook:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Test endpoint
app.get('/api/whatsapp-webhook-test', (req, res) => {
  console.log('🧪 WhatsApp Webhook Test Endpoint Called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);

  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  console.log('Test verification parameters:', {
    mode,
    token: token ? '***' + token.slice(-4) : 'not provided',
    challenge,
    hasToken: !!token,
    hasChallenge: !!challenge
  });

  // Simple verification - accept any token for testing
  if (mode === 'subscribe' && token && challenge) {
    console.log('✅ Test verification successful');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Test verification failed - missing parameters');
    return res.status(400).send('Missing required parameters');
  }
});

app.post('/api/whatsapp-webhook-test', (req, res) => {
  console.log('📨 Test webhook POST received');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  return res.status(200).send('OK');
});

// Process webhook data
async function processWebhookData(data) {
  try {
    const entry = data.entry?.[0];
    if (!entry) return;

    const changes = entry.changes?.[0];
    if (!changes || changes.value?.messaging_product !== 'whatsapp') return;

    const messages = changes.value.messages;
    const statuses = changes.value.statuses;

    // Process incoming messages
    if (messages && Array.isArray(messages)) {
      for (const message of messages) {
        await processIncomingMessage(message);
      }
    }

    // Process status updates
    if (statuses && Array.isArray(statuses)) {
      for (const status of statuses) {
        await processStatusUpdate(status);
      }
    }
  } catch (error) {
    console.error('Error processing webhook data:', error);
  }
}

// Process incoming message
async function processIncomingMessage(message) {
  try {
    console.log('📨 Processing incoming WhatsApp Business message:', message);

    // Extract message data
    const messageData = {
      id: message.id,
      from: message.from,
      to: message.to,
      type: message.type,
      timestamp: message.timestamp,
      content: extractMessageContent(message),
      media_url: extractMediaUrl(message),
      media_name: extractMediaName(message),
      media_size: extractMediaSize(message),
      media_mime_type: extractMediaMimeType(message)
    };

    // Find or create chat
    const chatId = await findOrCreateChat(messageData.from);

    // Save message to database
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        message_id: messageData.id,
        chat_id: chatId,
        from_number: messageData.from,
        to_number: messageData.to,
        message_type: messageData.type,
        content: messageData.content,
        media_url: messageData.media_url,
        media_name: messageData.media_name,
        media_size: messageData.media_size,
        media_mime_type: messageData.media_mime_type,
        timestamp: new Date(parseInt(messageData.timestamp) * 1000).toISOString(),
        direction: 'inbound',
        status: 'received'
      });

    if (error) {
      console.error('Error saving message:', error);
    } else {
      console.log('✅ Message saved to database');
      await updateChatLastMessage(chatId, messageData.content, new Date(parseInt(messageData.timestamp) * 1000).toISOString());
    }
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

// Process status update
async function processStatusUpdate(status) {
  try {
    console.log('📊 Processing status update:', status);

    const { error } = await supabase
      .from('whatsapp_messages')
      .update({
        status: status.status,
        updated_at: new Date().toISOString()
      })
      .eq('message_id', status.id);

    if (error) {
      console.error('Error updating message status:', error);
    } else {
      console.log('✅ Status updated in database');
    }
  } catch (error) {
    console.error('Error processing status update:', error);
  }
}

// Helper functions
function extractMessageContent(message) {
  if (message.text) return message.text.body;
  if (message.image) return `[Image: ${message.image.id}]`;
  if (message.document) return `[Document: ${message.document.filename}]`;
  if (message.audio) return '[Audio]';
  if (message.video) return '[Video]';
  if (message.location) return `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
  if (message.contact) return `[Contact: ${message.contact.name.formatted_name}]`;
  if (message.sticker) return '[Sticker]';
  return '[Unknown message type]';
}

function extractMediaUrl(message) {
  if (message.image) return message.image.id;
  if (message.document) return message.document.id;
  if (message.audio) return message.audio.id;
  if (message.video) return message.video.id;
  if (message.sticker) return message.sticker.id;
  return null;
}

function extractMediaName(message) {
  if (message.document) return message.document.filename;
  return null;
}

function extractMediaSize(message) {
  // WhatsApp doesn't provide file size in webhook
  return null;
}

function extractMediaMimeType(message) {
  if (message.image) return message.image.mime_type;
  if (message.document) return message.document.mime_type;
  if (message.audio) return message.audio.mime_type;
  if (message.video) return message.video.mime_type;
  if (message.sticker) return message.sticker.mime_type;
  return null;
}

async function findOrCreateChat(phoneNumber) {
  try {
    // Try to find existing chat
    let { data: chat, error } = await supabase
      .from('whatsapp_chats')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding chat:', error);
      return null;
    }

    if (!chat) {
      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('whatsapp_chats')
        .insert({
          phone_number: phoneNumber,
          customer_name: `Customer ${phoneNumber.slice(-4)}`,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        return null;
      }

      chat = newChat;
    }

    return chat.id;
  } catch (error) {
    console.error('Error in findOrCreateChat:', error);
    return null;
  }
}

async function updateChatLastMessage(chatId, lastMessage, lastMessageTime) {
  try {
    const { error } = await supabase
      .from('whatsapp_chats')
      .update({
        last_message: lastMessage,
        last_message_time: lastMessageTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat last message:', error);
    }
  } catch (error) {
    console.error('Error in updateChatLastMessage:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Business API Webhook Server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/whatsapp-business-webhook`);
  console.log(`🧪 Test URL: http://localhost:${PORT}/api/whatsapp-webhook-test`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
