import { supabase } from '../lib/supabaseClient';
import { whatsappService } from './whatsappService';

export interface WhatsAppWebhookData {
  typeWebhook: string;
  instanceData: {
    idInstance: number;
    wid: string;
    typeInstance: string;
  };
  timestamp: number;
  data: any;
}

export class WhatsAppWebhookHandler {
  // Process incoming webhook from Green API
  static async processWebhook(webhookData: WhatsAppWebhookData) {
    try {
      const { typeWebhook, data } = webhookData;

      switch (typeWebhook) {
        case 'incomingMessageReceived':
          await this.handleIncomingMessage(data);
          break;
        case 'outgoingMessageReceived':
          await this.handleOutgoingMessage(data);
          break;
        case 'outgoingAPIMessageReceived':
          await this.handleOutgoingAPIMessage(data);
          break;
        case 'outgoingMessageStatus':
          await this.handleMessageStatus(data);
          break;
        case 'stateInstanceChanged':
          await this.handleStateChange(data);
          break;
        case 'statusInstanceChanged':
          await this.handleStatusChange(data);
          break;
        default:
          console.log('Unknown webhook type:', typeWebhook);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  // Handle incoming message from customer
  private static async handleIncomingMessage(data: any) {
    try {
      const { idMessage, senderData, messageData, timestamp } = data;
      
      // Find or create chat for this sender
      const chatId = await this.findOrCreateChat(senderData);
      
      if (!chatId) {
        console.error('Could not find or create chat for sender:', senderData);
        return;
      }

      // Extract message content based on type
      let content = '';
      let messageType = 'text';
      let mediaUrl = '';

      if (messageData.typeMessage === 'textMessage') {
        content = messageData.textMessageData?.textMessage || '';
        messageType = 'text';
      } else if (messageData.typeMessage === 'imageMessage') {
        content = messageData.imageMessageData?.caption || 'Image';
        messageType = 'image';
        mediaUrl = messageData.imageMessageData?.downloadUrl || '';
      } else if (messageData.typeMessage === 'documentMessage') {
        content = messageData.documentMessageData?.caption || 'Document';
        messageType = 'document';
        mediaUrl = messageData.documentMessageData?.downloadUrl || '';
      } else if (messageData.typeMessage === 'videoMessage') {
        content = messageData.videoMessageData?.caption || 'Video';
        messageType = 'video';
        mediaUrl = messageData.videoMessageData?.downloadUrl || '';
      } else if (messageData.typeMessage === 'audioMessage') {
        content = 'Audio message';
        messageType = 'audio';
        mediaUrl = messageData.audioMessageData?.downloadUrl || '';
      } else {
        content = 'Unsupported message type';
        messageType = 'text';
      }

      // Insert message into database
      const { error } = await supabase.from('whatsapp_messages').insert({
        chat_id: chatId,
        content,
        message_type: messageType,
        direction: 'inbound',
        status: 'delivered',
        media_url: mediaUrl,
        sent_at: new Date(timestamp * 1000).toISOString()
      });

      if (error) {
        console.error('Error inserting incoming message:', error);
        return;
      }

      // Update chat with last message
      await supabase
        .from('whatsapp_chats')
        .update({
          last_message: content,
          last_message_time: new Date(timestamp * 1000).toISOString(),
          unread_count: supabase.sql`unread_count + 1`
        })
        .eq('id', chatId);

      console.log('Incoming message processed:', idMessage);
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  // Handle outgoing message confirmation
  private static async handleOutgoingMessage(data: any) {
    try {
      const { idMessage, status } = data;
      
      // Update message status in database
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'sent' })
        .eq('id', idMessage);

      console.log('Outgoing message confirmed:', idMessage);
    } catch (error) {
      console.error('Error handling outgoing message:', error);
    }
  }

  // Handle API message confirmation
  private static async handleOutgoingAPIMessage(data: any) {
    try {
      const { idMessage, status } = data;
      
      // Update message status in database
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'sent' })
        .eq('id', idMessage);

      console.log('API message confirmed:', idMessage);
    } catch (error) {
      console.error('Error handling API message:', error);
    }
  }

  // Handle message status updates
  private static async handleMessageStatus(data: any) {
    try {
      const { idMessage, status } = data;
      
      let dbStatus = 'sent';
      let updateData: any = { status };

      switch (status) {
        case 'delivered':
          dbStatus = 'delivered';
          updateData.delivered_at = new Date().toISOString();
          break;
        case 'read':
          dbStatus = 'read';
          updateData.read_at = new Date().toISOString();
          break;
        case 'failed':
          dbStatus = 'failed';
          updateData.error_message = 'Message delivery failed';
          break;
      }

      // Update message status in database
      await supabase
        .from('whatsapp_messages')
        .update(updateData)
        .eq('id', idMessage);

      console.log('Message status updated:', idMessage, status);
    } catch (error) {
      console.error('Error handling message status:', error);
    }
  }

  // Handle instance state changes
  private static async handleStateChange(data: any) {
    try {
      const { stateInstance } = data;
      console.log('WhatsApp instance state changed:', stateInstance);
      
      // You can add logic here to update your application state
      // For example, update a settings table with the current state
    } catch (error) {
      console.error('Error handling state change:', error);
    }
  }

  // Handle instance status changes
  private static async handleStatusChange(data: any) {
    try {
      const { statusInstance } = data;
      console.log('WhatsApp instance status changed:', statusInstance);
      
      // You can add logic here to update your application state
    } catch (error) {
      console.error('Error handling status change:', error);
    }
  }

  // Find or create chat for a sender
  private static async findOrCreateChat(senderData: any): Promise<string | null> {
    try {
      const phoneNumber = senderData.sender?.replace('@c.us', '') || senderData.chatId?.replace('@c.us', '');
      
      if (!phoneNumber) {
        console.error('No valid phone number in sender data:', senderData);
        return null;
      }

      // Try to find existing chat
      const { data: existingChat, error: findError } = await supabase
        .from('whatsapp_chats')
        .select('id')
        .eq('phone_number', phoneNumber)
        .limit(1)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding chat:', findError);
        return null;
      }

      if (existingChat) {
        return existingChat.id;
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('whatsapp_chats')
        .insert({
          phone_number: phoneNumber,
          customer_name: phoneNumber, // Default name
          status: 'active',
          unread_count: 0
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        return null;
      }

      return newChat.id;
    } catch (error) {
      console.error('Error in findOrCreateChat:', error);
      return null;
    }
  }
}
