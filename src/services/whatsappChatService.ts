import { supabase } from '../lib/supabaseClient';
import { toast } from '../lib/toastUtils';
import { retryWithBackoff } from '../lib/supabaseClient';

// Utility function to ensure Supabase client is available
const ensureSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
};

export interface ChatMessage {
  id: string;
  instance_id: string;
  chat_id: string;
  sender_id: string;
  sender_name?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'poll';
  content: string;
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: any;
  timestamp: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatConversation {
  chat_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  direction: 'incoming' | 'outgoing';
  status: string;
}

export interface QuickReplyTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: any[];
  language: 'en' | 'sw' | 'both';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserChatSettings {
  id: string;
  user_id: string;
  auto_refresh_interval: number;
  default_message_type: string;
  enable_notifications: boolean;
  enable_sound_alerts: boolean;
  max_retries: number;
  message_delay: number;
  created_at: string;
  updated_at: string;
}

class WhatsAppChatService {
  // Chat History Methods
  async getChatHistory(instanceId: string, chatId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const supabase = ensureSupabase();
      console.log(`🔍 Loading chat history for ${chatId} (${limit} messages)`);
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('instance_id', instanceId)
          .eq('chat_id', chatId)
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('❌ Error loading chat history:', error);
          throw error;
        }
        
        console.log(`✅ Loaded ${data?.length || 0} messages for chat ${chatId}`);
        return data || [];
      }, 3, 1000);

      // Reverse to show oldest first
      return result.reverse();
    } catch (error: any) {
      console.error('❌ Error fetching chat history:', error);
      toast.error(`Failed to load chat history: ${error.message}`);
      return [];
    }
  }

  async getRecentConversations(instanceId: string, limit: number = 20): Promise<ChatConversation[]> {
    try {
      const supabase = ensureSupabase();
      console.log(`🔍 Loading recent conversations for instance ${instanceId}`);
      
      const result = await retryWithBackoff(async () => {
        // Get latest message for each chat_id
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select(`
            chat_id,
            sender_id,
            sender_name,
            content,
            direction,
            status,
            timestamp,
            type
          `)
          .eq('instance_id', instanceId)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error('❌ Error loading conversations:', error);
          throw error;
        }
        
        // Group by chat_id and get latest message for each
        const conversationsMap = new Map<string, any>();
        
        for (const message of data || []) {
          if (!conversationsMap.has(message.chat_id)) {
            conversationsMap.set(message.chat_id, {
              chat_id: message.chat_id,
              customer_phone: message.chat_id.replace('@c.us', ''),
              customer_name: message.sender_name || message.chat_id.replace('@c.us', ''),
              last_message: message.type === 'text' ? message.content : `[${message.type.toUpperCase()}]`,
              last_message_time: message.timestamp,
              direction: message.direction,
              status: message.status,
              unread_count: 0 // Will be calculated separately if needed
            });
          }
        }
        
        const conversations = Array.from(conversationsMap.values())
          .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())
          .slice(0, limit);
        
        console.log(`✅ Loaded ${conversations.length} recent conversations`);
        return conversations;
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error fetching recent conversations:', error);
      toast.error(`Failed to load conversations: ${error.message}`);
      return [];
    }
  }

  async saveMessage(message: Omit<ChatMessage, 'created_at' | 'updated_at'>): Promise<ChatMessage | null> {
    try {
      const supabase = ensureSupabase();
      console.log(`💾 Saving message to database:`, message);
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .insert({
            id: message.id,
            instance_id: message.instance_id,
            chat_id: message.chat_id,
            sender_id: message.sender_id,
            sender_name: message.sender_name,
            type: message.type,
            content: message.content,
            direction: message.direction,
            status: message.status,
            metadata: message.metadata,
            timestamp: message.timestamp
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error saving message:', error);
          throw error;
        }
        
        console.log('✅ Message saved successfully:', data.id);
        return data;
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error saving message:', error);
      toast.error(`Failed to save message: ${error.message}`);
      return null;
    }
  }

  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed'): Promise<boolean> {
    try {
      const supabase = ensureSupabase();
      console.log(`🔄 Updating message ${messageId} status to ${status}`);
      
      await retryWithBackoff(async () => {
        const { error } = await supabase
          .from('whatsapp_messages')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', messageId);

        if (error) {
          console.error('❌ Error updating message status:', error);
          throw error;
        }
        
        console.log(`✅ Message ${messageId} status updated to ${status}`);
      }, 3, 1000);

      return true;
    } catch (error: any) {
      console.error('❌ Error updating message status:', error);
      return false;
    }
  }

  // Quick Reply Template Methods
  async getQuickReplyTemplates(): Promise<QuickReplyTemplate[]> {
    try {
      const supabase = ensureSupabase();
      console.log('🔍 Loading quick reply templates');
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_message_templates')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          console.error('❌ Error loading quick reply templates:', error);
          throw error;
        }
        
        console.log(`✅ Loaded ${data?.length || 0} quick reply templates`);
        return data || [];
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error fetching quick reply templates:', error);
      // Return default templates if database fails
      return this.getDefaultQuickReplies();
    }
  }

  async saveQuickReplyTemplate(template: Omit<QuickReplyTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<QuickReplyTemplate | null> {
    try {
      const supabase = ensureSupabase();
      console.log('💾 Saving quick reply template:', template);
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_message_templates')
          .insert(template)
          .select()
          .single();

        if (error) {
          console.error('❌ Error saving quick reply template:', error);
          throw error;
        }
        
        console.log('✅ Quick reply template saved successfully');
        return data;
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error saving quick reply template:', error);
      toast.error(`Failed to save template: ${error.message}`);
      return null;
    }
  }

  async deleteQuickReplyTemplate(templateId: string): Promise<boolean> {
    try {
      const supabase = ensureSupabase();
      console.log(`🗑️ Deleting quick reply template: ${templateId}`);
      
      await retryWithBackoff(async () => {
        const { error } = await supabase
          .from('whatsapp_message_templates')
          .delete()
          .eq('id', templateId);

        if (error) {
          console.error('❌ Error deleting quick reply template:', error);
          throw error;
        }
        
        console.log('✅ Quick reply template deleted successfully');
      }, 3, 1000);

      return true;
    } catch (error: any) {
      console.error('❌ Error deleting quick reply template:', error);
      toast.error(`Failed to delete template: ${error.message}`);
      return false;
    }
  }

  // User Settings Methods
  async getUserChatSettings(userId: string): Promise<UserChatSettings | null> {
    try {
      const supabase = ensureSupabase();
      console.log(`🔍 Loading chat settings for user ${userId}`);
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_hub_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error loading user chat settings:', error);
          throw error;
        }
        
        if (data) {
          console.log('✅ Loaded user chat settings');
        } else {
          console.log('⚠️ No user settings found, will create defaults');
        }
        
        return data;
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error fetching user chat settings:', error);
      return null;
    }
  }

  async saveUserChatSettings(settings: Partial<UserChatSettings> & { user_id: string }): Promise<UserChatSettings | null> {
    try {
      const supabase = ensureSupabase();
      console.log('💾 Saving user chat settings:', settings);
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_hub_settings')
          .upsert(settings, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) {
          console.error('❌ Error saving user chat settings:', error);
          throw error;
        }
        
        console.log('✅ User chat settings saved successfully');
        return data;
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error saving user chat settings:', error);
      toast.error(`Failed to save settings: ${error.message}`);
      return null;
    }
  }

  // Real-time Subscriptions
  subscribeToMessages(instanceId: string, chatId: string, callback: (message: ChatMessage) => void) {
    try {
      const supabase = ensureSupabase();
      console.log(`📡 Setting up real-time subscription for chat ${chatId}`);
      
      const subscription = supabase
        .channel(`messages:${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `instance_id=eq.${instanceId} AND chat_id=eq.${chatId}`
          },
          (payload) => {
            console.log('📨 New message received:', payload.new);
            callback(payload.new as ChatMessage);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `instance_id=eq.${instanceId} AND chat_id=eq.${chatId}`
          },
          (payload) => {
            console.log('🔄 Message updated:', payload.new);
            callback(payload.new as ChatMessage);
          }
        )
        .subscribe();

      return subscription;
    } catch (error: any) {
      console.error('❌ Error setting up message subscription:', error);
      return null;
    }
  }

  subscribeToConversations(instanceId: string, callback: (conversation: any) => void) {
    try {
      const supabase = ensureSupabase();
      console.log(`📡 Setting up conversation subscription for instance ${instanceId}`);
      
      const subscription = supabase
        .channel(`conversations:${instanceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `instance_id=eq.${instanceId}`
          },
          (payload) => {
            console.log('📨 Conversation update:', payload);
            callback(payload);
          }
        )
        .subscribe();

      return subscription;
    } catch (error: any) {
      console.error('❌ Error setting up conversation subscription:', error);
      return null;
    }
  }

  // Search Methods
  async searchMessages(instanceId: string, query: string, chatId?: string): Promise<ChatMessage[]> {
    try {
      const supabase = ensureSupabase();
      console.log(`🔍 Searching messages for: "${query}"`);
      
      let queryBuilder = supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('instance_id', instanceId)
        .ilike('content', `%${query}%`)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (chatId) {
        queryBuilder = queryBuilder.eq('chat_id', chatId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('❌ Error searching messages:', error);
        throw error;
      }
      
      console.log(`✅ Found ${data?.length || 0} matching messages`);
      return data || [];
    } catch (error: any) {
      console.error('❌ Error searching messages:', error);
      toast.error(`Search failed: ${error.message}`);
      return [];
    }
  }

  // Helper Methods
  private getDefaultQuickReplies(): QuickReplyTemplate[] {
    const defaultTemplates = [
      {
        id: 'default-1',
        name: 'Welcome Message',
        category: 'Greetings',
        template: 'Hello! How can I help you today?',
        variables: [],
        language: 'en' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-2',
        name: 'Thank You',
        category: 'Frequently Used',
        template: 'Thank you for contacting us!',
        variables: [],
        language: 'en' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-3',
        name: 'Order Confirmation',
        category: 'Sales & Orders',
        template: 'Your order has been confirmed.',
        variables: [],
        language: 'en' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return defaultTemplates;
  }

  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    cleaned = cleaned.replace(/\+{2,}/g, '+');
    return cleaned;
  }

  getChatIdFromPhone(phone: string): string {
    const cleanPhone = this.formatPhoneNumber(phone).replace('+', '');
    return `${cleanPhone}@c.us`;
  }
}

export const whatsappChatService = new WhatsAppChatService();
export default whatsappChatService;