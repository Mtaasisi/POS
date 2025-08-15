import { supabase } from '../lib/supabaseClient';

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  sender: string;
  recipient: string;
  content: string;
  type: 'text' | 'media' | 'template';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  mediaUrl?: string;
  templateId?: string;
  error?: string;
}

export interface WhatsAppChat {
  id: string;
  customer_id?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  is_archived?: boolean;
  tags?: string[];
  assigned_to?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppWebhook {
  type: 'message' | 'status' | 'contact';
  data: any;
  timestamp: string;
}

export class WhatsAppService {
  private settingsCache: { value: any; fetchedAt: number } | null = null;
  private realtimeSubscription: any = null;
  private messageCallbacks: ((message: WhatsAppMessage) => void)[] = [];
  private statusCallbacks: ((status: any) => void)[] = [];

  private async getSettings(): Promise<any> {
    const now = Date.now();
    if (this.settingsCache && now - this.settingsCache.fetchedAt < 60000) {
      return this.settingsCache.value;
    }
    
    try {
      const { data, error } = await supabase.from('settings').select('key, value');
      const DEFAULTS = {
        whatsapp_green_api_key: '',
        whatsapp_instance_id: '',
        whatsapp_api_url: '',
        whatsapp_media_url: '',
        whatsapp_enable_bulk: true,
        whatsapp_enable_auto: true,
        whatsapp_log_retention_days: 365,
        whatsapp_notification_email: '',
        whatsapp_webhook_url: '',
        whatsapp_enable_realtime: true,
      };
      const settings: any = { ...DEFAULTS };
      if (!error && data) {
        data.forEach((row: any) => {
          if (row.key in settings) {
            settings[row.key] = row.value;
          }
        });
      }
      this.settingsCache = { value: settings, fetchedAt: now };
      return settings;
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
      return {
        whatsapp_green_api_key: '',
        whatsapp_instance_id: '',
        whatsapp_enable_bulk: true,
        whatsapp_enable_auto: true,
        whatsapp_enable_realtime: true,
      };
    }
  }

  // Initialize real-time subscriptions
  async initializeRealtime() {
    try {
      const settings = await this.getSettings();
      if (!settings.whatsapp_enable_realtime) {
        console.log('WhatsApp real-time disabled in settings');
        return;
      }

      // Subscribe to new messages
      this.realtimeSubscription = supabase
        .channel('whatsapp_messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
          (payload) => {
            const message = payload.new as WhatsAppMessage;
            this.messageCallbacks.forEach(callback => callback(message));
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
          (payload) => {
            const status = payload.new;
            this.statusCallbacks.forEach(callback => callback(status));
          }
        )
        .subscribe((status) => {
          console.log('WhatsApp real-time subscription status:', status);
        });
    } catch (error) {
      console.error('Failed to initialize WhatsApp real-time:', error);
    }
  }

  // Subscribe to new messages
  onMessage(callback: (message: WhatsAppMessage) => void) {
    this.messageCallbacks.push(callback);
  }

  // Subscribe to status updates
  onStatusUpdate(callback: (status: any) => void) {
    this.statusCallbacks.push(callback);
  }

  // Unsubscribe from real-time updates
  unsubscribe() {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
    this.messageCallbacks = [];
    this.statusCallbacks = [];
  }

  // Connect to Green API (store credentials securely)
  async connect(instanceId: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Test the connection first
      const testResult = await this.testConnection(instanceId, apiKey);
      if (!testResult.success) {
        return testResult;
      }

      // Save to settings table (admin only)
      const { error } = await supabase.from('settings').upsert([
        { key: 'whatsapp_instance_id', value: instanceId },
        { key: 'whatsapp_green_api_key', value: apiKey }
      ], { onConflict: 'key' });
      
      if (error) return { success: false, error: error.message };
      
      this.settingsCache = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Test Green API connection
  async testConnection(instanceId: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/getStateInstance/${apiKey}`);
      if (!response.ok) {
        return { success: false, error: `Connection failed: ${response.status}` };
      }
      const data = await response.json();
      if (data.stateInstance === 'authorized') {
        return { success: true };
      } else {
        return { success: false, error: `WhatsApp not authorized. Current state: ${data.stateInstance}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' };
    }
  }

  // Send WhatsApp message via Green API with retry logic
  async sendMessage(chatId: string, content: string, type: 'text' | 'media' | 'template' = 'text', mediaUrl?: string, templateId?: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      const settings = await this.getSettings();
      const { whatsapp_instance_id, whatsapp_green_api_key, whatsapp_api_url, whatsapp_media_url } = settings;
      
      if (!whatsapp_instance_id || !whatsapp_green_api_key) {
        return { success: false, error: 'Green API credentials not set. Please configure WhatsApp settings first.' };
      }
      
      // Use custom API URLs if configured, otherwise use default
      const apiBaseUrl = whatsapp_api_url || 'https://api.green-api.com';
      const mediaBaseUrl = whatsapp_media_url || 'https://media.green-api.com';
      
      let url: string;
      let body: any;
      
      // Ensure chatId is in the correct format for Green API
      const formattedChatId = chatId.includes('@c.us') ? chatId : `${chatId}@c.us`;
      
      switch (type) {
        case 'text':
          url = `${apiBaseUrl}/waInstance${whatsapp_instance_id}/sendMessage/${whatsapp_green_api_key}`;
          body = { chatId: formattedChatId, message: content };
          break;
          
        case 'media':
          if (!mediaUrl) {
            return { success: false, error: 'Media URL is required for media messages' };
          }
          url = `${mediaBaseUrl}/waInstance${whatsapp_instance_id}/sendFileByUrl/${whatsapp_green_api_key}`;
          body = { 
            chatId: formattedChatId, 
            urlFile: mediaUrl, 
            fileName: mediaUrl.split('/').pop() || 'media',
            caption: content 
          };
          break;
          
        case 'template':
          if (!templateId) {
            return { success: false, error: 'Template ID is required for template messages' };
          }
          url = `${apiBaseUrl}/waInstance${whatsapp_instance_id}/sendTemplate/${whatsapp_green_api_key}`;
          body = { chatId: formattedChatId, templateId, templateParams: [content] };
          break;
          
        default:
          return { success: false, error: 'Invalid message type' };
      }

      // Send with retry logic
      const result = await this.sendWithRetry(url, body);
      
      if (result.success && result.data?.idMessage) {
        // Log the message to database
        await this.logMessage({
          id: result.data.idMessage,
          chatId: formattedChatId,
          sender: 'system',
          recipient: formattedChatId,
          content,
          type,
          status: 'sent',
          timestamp: new Date().toISOString(),
          mediaUrl,
          templateId
        });
        
        return { success: true, messageId: result.data.idMessage };
      }
      
      return result;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Send with retry logic
  private async sendWithRetry(url: string, body: any, maxRetries: number = 3): Promise<{ success: boolean; error?: string; data?: any }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          if (attempt === maxRetries) {
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        if (attempt === maxRetries) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  }

  // Upload media file
  async uploadMedia(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const settings = await this.getSettings();
      const { whatsapp_instance_id, whatsapp_green_api_key, whatsapp_media_url } = settings;
      
      if (!whatsapp_instance_id || !whatsapp_green_api_key) {
        return { success: false, error: 'Green API credentials not set' };
      }

      const mediaBaseUrl = whatsapp_media_url || 'https://media.green-api.com';
      const url = `${mediaBaseUrl}/waInstance${whatsapp_instance_id}/uploadFile/${whatsapp_green_api_key}`;
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Upload failed: ${errorText}` };
      }
      
      const data = await response.json();
      return { success: true, url: data.urlFile };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // Fetch chat history (from your DB or Green API)
  async getChatHistory(chatId: string): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      return data as WhatsAppMessage[];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  // Fetch all chats (from your DB)
  async getChats(): Promise<WhatsAppChat[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as WhatsAppChat[];
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }

  // Bulk messaging with progress tracking
  async sendBulk(chatIds: string[], content: string, onProgress?: (progress: { sent: number; total: number; failed: number }) => void): Promise<{ success: boolean; results: Array<{ chatId: string; success: boolean; error?: string }> }> {
    try {
      const settings = await this.getSettings();
      if (!settings.whatsapp_enable_bulk) {
        return { success: false, results: chatIds.map(chatId => ({ chatId, success: false, error: 'Bulk messaging disabled' })) };
      }

      const results: Array<{ chatId: string; success: boolean; error?: string }> = [];
      let sent = 0;
      let failed = 0;

      for (const chatId of chatIds) {
        try {
          const result = await this.sendMessage(chatId, content);
          results.push({ chatId, ...result });
          
          if (result.success) {
            sent++;
          } else {
            failed++;
          }
          
          // Report progress
          if (onProgress) {
            onProgress({ sent, total: chatIds.length, failed });
          }
          
          // Rate limiting - wait between messages
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.push({ chatId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          failed++;
        }
      }

      return { success: results.every(r => r.success), results };
    } catch (error) {
      console.error('Error in bulk messaging:', error);
      return { 
        success: false, 
        results: chatIds.map(chatId => ({ 
          chatId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })) 
      };
    }
  }

  // Analytics with real data aggregation
  async getAnalytics(days: number = 30): Promise<{ total: number; sent: number; failed: number; delivered: number; read: number; responseRate: number; avgResponseTime: number }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('status, direction, sent_at')
        .gte('sent_at', startDate.toISOString());

      if (error) throw error;

      const messages = data || [];
      const total = messages.length;
      const sent = messages.filter(m => m.status === 'sent').length;
      const failed = messages.filter(m => m.status === 'failed').length;
      const delivered = messages.filter(m => m.status === 'delivered').length;
      const read = messages.filter(m => m.status === 'read').length;
      
      // Calculate response rate (inbound messages that got responses)
      const inboundMessages = messages.filter(m => m.direction === 'inbound');
      const responseRate = inboundMessages.length > 0 ? 
        (messages.filter(m => m.direction === 'outbound').length / inboundMessages.length) * 100 : 0;

      // Calculate average response time (simplified)
      const avgResponseTime = this.calculateAverageResponseTime(messages);

      return {
        total,
        sent,
        failed,
        delivered,
        read,
        responseRate: Math.round(responseRate),
        avgResponseTime
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { total: 0, sent: 0, failed: 0, delivered: 0, read: 0, responseRate: 0, avgResponseTime: 0 };
    }
  }

  // Calculate average response time
  private calculateAverageResponseTime(messages: any[]): number {
    const responseTimes: number[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].direction === 'inbound') {
        // Find next outbound message
        for (let j = i + 1; j < messages.length; j++) {
          if (messages[j].direction === 'outbound') {
            const inboundTime = new Date(messages[i].sent_at).getTime();
            const outboundTime = new Date(messages[j].sent_at).getTime();
            const responseTime = (outboundTime - inboundTime) / (1000 * 60); // in minutes
            responseTimes.push(responseTime);
            break;
          }
        }
      }
    }
    
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  // Log WhatsApp message (to your DB)
  async logMessage(msg: WhatsAppMessage): Promise<void> {
    try {
      // First, ensure we have a valid chat_id
      let chatId = msg.chatId;
      
      // If no chat_id provided or if it's a phone number format, try to find or create one
      if (!chatId || chatId.includes('@c.us')) {
        console.warn('No valid chat_id provided for WhatsApp message, attempting to find existing chat...');
        
        // Extract phone number from chatId if it's in WhatsApp format
        const phoneNumber = chatId?.replace('@c.us', '') || msg.sender || msg.recipient;
        
        // Try to find existing chat by phone number
        const { data: existingChat, error: findError } = await supabase
          .from('whatsapp_chats')
          .select('id')
          .eq('phone_number', phoneNumber)
          .limit(1)
          .single();
          
        if (findError || !existingChat) {
          console.log('Creating new chat for phone number:', phoneNumber);
          
          // Create new chat
          const { data: newChat, error: createError } = await supabase
            .from('whatsapp_chats')
            .insert({
              phone_number: phoneNumber,
              customer_name: phoneNumber, // Default name, can be updated later
              status: 'active'
            })
            .select('id')
            .single();
            
          if (createError || !newChat) {
            console.error('Could not create new chat for message:', msg);
            return;
          }
          
          chatId = newChat.id;
        } else {
          chatId = existingChat.id;
        }
      }
      
      // Validate that the chat exists before inserting
      const { data: chatExists, error: validateError } = await supabase
        .from('whatsapp_chats')
        .select('id')
        .eq('id', chatId)
        .single();
        
      if (validateError || !chatExists) {
        console.error('Invalid chat_id provided for WhatsApp message:', chatId);
        return;
      }
      
      // Now insert the message with valid chat_id
      const { error: insertError } = await supabase.from('whatsapp_messages').insert({
        chat_id: chatId,
        content: msg.content,
        message_type: msg.type,
        direction: 'outbound',
        status: msg.status,
        media_url: msg.mediaUrl,
        sent_at: msg.timestamp
      });
      
      if (insertError) {
        console.error('Error inserting WhatsApp message:', insertError);
      }
    } catch (error) {
      console.error('Error logging message:', error);
    }
  }

  // Update message status
  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed', errorMessage?: string): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'read') {
        updateData.read_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.error_message = errorMessage;
      }
      
      await supabase
        .from('whatsapp_messages')
        .update(updateData)
        .eq('id', messageId);
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // Clean old logs
  async cleanOldLogs() {
    try {
      const settings = await this.getSettings();
      const days = settings.whatsapp_log_retention_days || 365;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('whatsapp_messages')
        .delete()
        .lt('sent_at', cutoff);
    } catch (error) {
      console.error('Error cleaning old logs:', error);
    }
  }

  // Create a new WhatsApp chat for a customer
  async createChat(customerId: string): Promise<{ success: boolean; chat?: any; error?: string }> {
    try {
      // Validate customerId
      if (!customerId) {
        return { success: false, error: 'Customer ID is required' };
      }

      // Check if customer exists first
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, whatsapp')
        .eq('id', customerId)
        .single();
      
      if (customerError) {
        return { success: false, error: `Customer not found: ${customerError.message}` };
      }

      // Check if chat already exists
      const { data: existing, error: findError } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();
        
      if (findError) return { success: false, error: findError.message };
      if (existing) return { success: true, chat: existing };
      
      // Create new chat
      const chatData = {
        customer_id: customerId,
        phone_number: customer.whatsapp || customer.phone || customerId,
        customer_name: customer.name,
        unread_count: 0,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('whatsapp_chats')
        .insert(chatData)
        .select()
        .single();
        
      if (error) return { success: false, error: error.message };
      return { success: true, chat: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get chat by customer ID
  async getChatByCustomerId(customerId: string): Promise<{ success: boolean; chat?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();
        
      if (error) return { success: false, error: error.message };
      return { success: true, chat: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Archive chat
  async archiveChat(chatId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('whatsapp_chats')
        .update({ status: 'archived' })
        .eq('id', chatId);
        
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('chat_id', chatId)
        .eq('direction', 'inbound')
        .eq('status', 'delivered');
        
      if (error) return { success: false, error: error.message };
      
      // Update chat unread count
      await supabase
        .from('whatsapp_chats')
        .update({ unread_count: 0 })
        .eq('id', chatId);
        
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const whatsappService = new WhatsAppService(); 