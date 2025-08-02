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
  customerId?: string;
  participants: string[];
  lastMessage: WhatsAppMessage;
  unreadCount: number;
  tags?: string[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export class WhatsAppService {
  private settingsCache: { value: any; fetchedAt: number } | null = null;

  private async getSettings(): Promise<any> {
    const now = Date.now();
    if (this.settingsCache && now - this.settingsCache.fetchedAt < 60000) {
      return this.settingsCache.value;
    }
    const { data, error } = await supabase.from('settings').select('key, value');
    const DEFAULTS = {
      whatsapp_green_api_key: '',
      whatsapp_instance_id: '',
      whatsapp_enable_bulk: true,
      whatsapp_enable_auto: true,
      whatsapp_log_retention_days: 365,
      whatsapp_notification_email: '',
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
  }

  // Connect to Green API (store credentials securely)
  async connect(instanceId: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    // Save to settings table (admin only)
    const { error } = await supabase.from('settings').upsert([
      { key: 'whatsapp_instance_id', value: instanceId },
      { key: 'whatsapp_green_api_key', value: apiKey }
    ], { onConflict: 'key' });
    if (error) return { success: false, error: error.message };
    this.settingsCache = null;
    return { success: true };
  }

  // Send WhatsApp message via Green API
  async sendMessage(chatId: string, content: string, type: 'text' | 'media' | 'template' = 'text', mediaUrl?: string, templateId?: string): Promise<{ success: boolean; error?: string }> {
    const settings = await this.getSettings();
    const { whatsapp_instance_id, whatsapp_green_api_key } = settings;
    if (!whatsapp_instance_id || !whatsapp_green_api_key) return { success: false, error: 'Green API credentials not set' };
    // Green API endpoint
    let url = `https://api.green-api.com/waInstance${whatsapp_instance_id}/sendMessage/${whatsapp_green_api_key}`;
    let body: any = { chatId, message: content };
    if (type === 'media' && mediaUrl) {
      url = `https://api.green-api.com/waInstance${whatsapp_instance_id}/sendFileByUrl/${whatsapp_green_api_key}`;
      body = { chatId, urlFile: mediaUrl, fileName: 'media', caption: content };
    }
    if (type === 'template' && templateId) {
      // Green API template sending (customize as needed)
      url = `https://api.green-api.com/waInstance${whatsapp_instance_id}/sendTemplate/${whatsapp_green_api_key}`;
      body = { chatId, templateId, templateParams: [content] };
    }
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Fetch chat history (from your DB or Green API)
  async getChatHistory(chatId: string): Promise<WhatsAppMessage[]> {
    // Example: fetch from your DB (customize as needed)
    const { data, error } = await supabase.from('whatsapp_messages').select('*').eq('chatId', chatId).order('timestamp', { ascending: true });
    if (error) return [];
    return data as WhatsAppMessage[];
  }

  // Fetch all chats (from your DB)
  async getChats(): Promise<WhatsAppChat[]> {
    const { data, error } = await supabase.from('whatsapp_chats').select('*').order('updatedAt', { ascending: false });
    if (error) return [];
    return data as WhatsAppChat[];
  }

  // Bulk messaging
  async sendBulk(chatIds: string[], content: string): Promise<{ success: boolean; results: Array<{ chatId: string; success: boolean; error?: string }> }> {
    const settings = await this.getSettings();
    if (!settings.whatsapp_enable_bulk) return { success: false, results: chatIds.map(chatId => ({ chatId, success: false, error: 'Bulk messaging disabled' })) };
    const results = await Promise.all(chatIds.map(async chatId => {
      const res = await this.sendMessage(chatId, content);
      return { chatId, ...res };
    }));
    return { success: results.every(r => r.success), results };
  }

  // Analytics (basic example)
  async getAnalytics(): Promise<{ total: number; sent: number; failed: number; delivered: number; read: number }> {
    const { data, error } = await supabase.from('whatsapp_messages').select('status');
    if (error || !data) return { total: 0, sent: 0, failed: 0, delivered: 0, read: 0 };
    return {
      total: data.length,
      sent: data.filter((m: any) => m.status === 'sent').length,
      failed: data.filter((m: any) => m.status === 'failed').length,
      delivered: data.filter((m: any) => m.status === 'delivered').length,
      read: data.filter((m: any) => m.status === 'read').length,
    };
  }

  // Log WhatsApp message (to your DB)
  async logMessage(msg: WhatsAppMessage): Promise<void> {
    await supabase.from('whatsapp_messages').insert(msg);
  }

  // Clean old logs
  async cleanOldLogs() {
    const settings = await this.getSettings();
    const days = settings.whatsapp_log_retention_days || 365;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('whatsapp_messages').delete().lt('timestamp', cutoff);
  }

  // Create a new WhatsApp chat for a customer
  async createChat(customerId: string): Promise<{ success: boolean; chat?: any; error?: string }> {
    // Check if chat already exists
    const { data: existing, error: findError } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();
    if (findError) return { success: false, error: findError.message };
    if (existing) return { success: true, chat: existing };
    // Create new chat
    const { data, error } = await supabase
      .from('whatsapp_chats')
      .insert({ customer_id: customerId, participants: [], unread_count: 0 })
      .select()
      .maybeSingle();
    if (error) return { success: false, error: error.message };
    return { success: true, chat: data };
  }
}

export const whatsappService = new WhatsAppService(); 