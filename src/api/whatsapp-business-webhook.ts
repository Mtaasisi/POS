import { NextApiRequest, NextApiResponse } from 'next';
import { whatsappBusinessApi } from '../services/whatsappBusinessApi';
import { supabase } from '../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 WhatsApp Business webhook request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  // Handle webhook verification
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    console.log('🔍 Webhook verification request:', {
      mode,
      token,
      challenge,
      hasToken: !!token,
      hasChallenge: !!challenge
    });

    if (mode && token && challenge) {
      try {
        const verificationResponse = whatsappBusinessApi.verifyWebhook(
          mode as string,
          token as string,
          challenge as string
        );

        console.log('🔍 Verification result:', {
          success: !!verificationResponse,
          response: verificationResponse
        });

        if (verificationResponse) {
          console.log('✅ WhatsApp Business webhook verified successfully');
          return res.status(200).send(verificationResponse);
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
  }

  // Handle webhook events
  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('📨 WhatsApp Business webhook received:', JSON.stringify(body, null, 2));

      // Process the webhook data
      whatsappBusinessApi.processWebhook(body);

      // Store messages and status updates in database
      await processWebhookData(body);

      return res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Error processing WhatsApp Business webhook:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  return res.status(405).send('Method Not Allowed');
}

async function processWebhookData(data: any) {
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

async function processIncomingMessage(message: any) {
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
    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        id: messageData.id,
        chat_id: chatId,
        content: messageData.content,
        message_type: messageData.type,
        direction: 'inbound',
        status: 'delivered',
        media_url: messageData.media_url,
        media_name: messageData.media_name,
        media_size: messageData.media_size,
        media_mime_type: messageData.media_mime_type,
        sent_at: new Date(parseInt(messageData.timestamp) * 1000).toISOString()
      });

    if (messageError) {
      console.error('Error saving WhatsApp message:', messageError);
    } else {
      console.log('✅ WhatsApp message saved to database');
    }

    // Update chat's last message
    await updateChatLastMessage(chatId, messageData.content);

  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

async function processStatusUpdate(status: any) {
  try {
    console.log('📊 Processing WhatsApp Business status update:', status);

    // Update message status in database
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({
        status: status.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', status.id);

    if (error) {
      console.error('Error updating message status:', error);
    } else {
      console.log('✅ Message status updated in database');
    }

  } catch (error) {
    console.error('Error processing status update:', error);
  }
}

async function findOrCreateChat(phoneNumber: string): Promise<string> {
  try {
    // First, try to find existing chat
    const { data: existingChat, error: findError } = await supabase
      .from('whatsapp_chats')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingChat) {
      return existingChat.id;
    }

    // If no chat exists, create a new one
    const { data: newChat, error: createError } = await supabase
      .from('whatsapp_chats')
      .insert({
        phone_number: phoneNumber,
        customer_name: `WhatsApp User (${phoneNumber})`,
        last_message: 'Chat started',
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating new chat:', createError);
      throw createError;
    }

    console.log('✅ New WhatsApp chat created:', newChat.id);
    return newChat.id;

  } catch (error) {
    console.error('Error finding or creating chat:', error);
    throw error;
  }
}

async function updateChatLastMessage(chatId: string, lastMessage: string) {
  try {
    const { error } = await supabase
      .from('whatsapp_chats')
      .update({
        last_message: lastMessage,
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat last message:', error);
    }
  } catch (error) {
    console.error('Error updating chat last message:', error);
  }
}

function extractMessageContent(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text?.body || '';
    case 'image':
      return message.image?.caption || 'Image message';
    case 'document':
      return message.document?.caption || `Document: ${message.document?.filename || 'Unknown file'}`;
    case 'audio':
      return 'Audio message';
    case 'video':
      return message.video?.caption || 'Video message';
    case 'location':
      return `Location: ${message.location?.name || 'Unknown location'}`;
    case 'contact':
      return `Contact: ${message.contact?.name?.formatted_name || 'Unknown contact'}`;
    case 'sticker':
      return 'Sticker message';
    case 'template':
      return `Template: ${message.template?.name || 'Unknown template'}`;
    default:
      return 'Unknown message type';
  }
}

function extractMediaUrl(message: any): string | null {
  switch (message.type) {
    case 'image':
      return message.image?.id ? `https://graph.facebook.com/v18.0/${message.image.id}` : null;
    case 'document':
      return message.document?.id ? `https://graph.facebook.com/v18.0/${message.document.id}` : null;
    case 'audio':
      return message.audio?.id ? `https://graph.facebook.com/v18.0/${message.audio.id}` : null;
    case 'video':
      return message.video?.id ? `https://graph.facebook.com/v18.0/${message.video.id}` : null;
    case 'sticker':
      return message.sticker?.id ? `https://graph.facebook.com/v18.0/${message.sticker.id}` : null;
    default:
      return null;
  }
}

function extractMediaName(message: any): string | null {
  switch (message.type) {
    case 'document':
      return message.document?.filename || null;
    default:
      return null;
  }
}

function extractMediaSize(message: any): number | null {
  switch (message.type) {
    case 'image':
      return message.image?.file_size || null;
    case 'document':
      return message.document?.file_size || null;
    case 'audio':
      return message.audio?.file_size || null;
    case 'video':
      return message.video?.file_size || null;
    case 'sticker':
      return message.sticker?.file_size || null;
    default:
      return null;
  }
}

function extractMediaMimeType(message: any): string | null {
  switch (message.type) {
    case 'image':
      return message.image?.mime_type || null;
    case 'document':
      return message.document?.mime_type || null;
    case 'audio':
      return message.audio?.mime_type || null;
    case 'video':
      return message.video?.mime_type || null;
    case 'sticker':
      return message.sticker?.mime_type || null;
    default:
      return null;
  }
}
