import { supabase } from '../lib/supabaseClient';

export interface WhatsAppBusinessConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  webhookVerifyToken: string;
  apiVersion: string;
}

export interface WhatsAppBusinessMessage {
  id: string;
  from: string;
  to: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'sticker' | 'template';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  document?: {
    id: string;
    filename: string;
    mime_type: string;
  };
  audio?: {
    id: string;
    mime_type: string;
  };
  video?: {
    id: string;
    mime_type: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contact?: {
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
    };
    phones: Array<{
      phone: string;
      type?: string;
    }>;
  };
  sticker?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  timestamp: string;
  context?: {
    from: string;
    id: string;
  };
}

export interface WhatsAppBusinessStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    origin: {
      type: string;
    };
  };
  pricing?: {
    pricing_model: string;
    category: string;
  };
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data?: {
      details: string;
    };
  }>;
}

export interface WhatsAppBusinessTemplate {
  name: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    example?: string;
  }>;
}

export interface WhatsAppBusinessMedia {
  id: string;
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
}

class WhatsAppBusinessRateLimiter {
  private lastCall: number = 0;
  private minInterval: number = 1000; // 1 second between calls
  private queue: Array<() => void> = [];
  private processing: boolean = false;
  private rateLimitReset: number = 0;
  private remainingCalls: number = 1000; // Default rate limit

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      
      // Check rate limits
      if (now < this.rateLimitReset) {
        const waitTime = this.rateLimitReset - now;
        console.log(`⏳ Rate limit active, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      if (this.remainingCalls <= 0) {
        console.log('🚫 Rate limit exceeded, waiting for reset');
        await new Promise(resolve => setTimeout(resolve, this.rateLimitReset - now));
      }
      
      const timeSinceLastCall = now - this.lastCall;
      if (timeSinceLastCall < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
      }
      
      const fn = this.queue.shift();
      if (fn) {
        this.lastCall = Date.now();
        await fn();
      }
    }
    
    this.processing = false;
  }

  updateRateLimits(headers: Headers) {
    const remaining = headers.get('x-app-usage');
    const resetTime = headers.get('x-app-usage-reset');
    
    if (remaining) {
      this.remainingCalls = parseInt(remaining);
    }
    
    if (resetTime) {
      this.rateLimitReset = parseInt(resetTime) * 1000;
    }
  }
}

export class WhatsAppBusinessApiService {
  private config: WhatsAppBusinessConfig | null = null;
  private rateLimiter = new WhatsAppBusinessRateLimiter();
  private messageCallbacks: ((message: WhatsAppBusinessMessage) => void)[] = [];
  private statusCallbacks: ((status: WhatsAppBusinessStatus) => void)[] = [];
  private webhookCallbacks: ((data: any) => void)[] = [];

  constructor() {
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'whatsapp_business_access_token',
          'whatsapp_business_phone_number_id',
          'whatsapp_business_account_id',
          'whatsapp_business_app_id',
          'whatsapp_business_app_secret',
          'whatsapp_business_webhook_verify_token',
          'whatsapp_business_api_version'
        ]);

      if (error) {
        console.error('Error loading WhatsApp Business config:', error);
        return;
      }

      const config: any = {};
      data?.forEach(item => {
        config[item.key] = item.value;
      });

      this.config = {
        accessToken: config.whatsapp_business_access_token || '',
        phoneNumberId: config.whatsapp_business_phone_number_id || '',
        businessAccountId: config.whatsapp_business_account_id || '',
        appId: config.whatsapp_business_app_id || '',
        appSecret: config.whatsapp_business_app_secret || '',
        webhookVerifyToken: config.whatsapp_business_webhook_verify_token || '',
        apiVersion: config.whatsapp_business_api_version || 'v18.0'
      };
    } catch (error) {
      console.error('Error loading WhatsApp Business config:', error);
    }
  }

  async reloadConfig(): Promise<void> {
    console.log('🔄 Reloading WhatsApp Business API configuration...');
    await this.loadConfig();
    console.log('✅ Configuration reloaded');
  }

  async updateConfig(config: Partial<WhatsAppBusinessConfig>): Promise<boolean> {
    try {
      const updates = [];
      
      if (config.accessToken) {
        updates.push({ key: 'whatsapp_business_access_token', value: config.accessToken });
      }
      if (config.phoneNumberId) {
        updates.push({ key: 'whatsapp_business_phone_number_id', value: config.phoneNumberId });
      }
      if (config.businessAccountId) {
        updates.push({ key: 'whatsapp_business_account_id', value: config.businessAccountId });
      }
      if (config.appId) {
        updates.push({ key: 'whatsapp_business_app_id', value: config.appId });
      }
      if (config.appSecret) {
        updates.push({ key: 'whatsapp_business_app_secret', value: config.appSecret });
      }
      if (config.webhookVerifyToken) {
        updates.push({ key: 'whatsapp_business_webhook_verify_token', value: config.webhookVerifyToken });
      }
      if (config.apiVersion) {
        updates.push({ key: 'whatsapp_business_api_version', value: config.apiVersion });
      }

      const { error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) {
        console.error('Error updating WhatsApp Business config:', error);
        return false;
      }

      // Reload configuration after update
      await this.reloadConfig();
      return true;
    } catch (error) {
      console.error('Error updating WhatsApp Business config:', error);
      return false;
    }
  }

  private getApiUrl(endpoint: string): string {
    if (!this.config) {
      throw new Error('WhatsApp Business API not configured');
    }
    
    // Ensure API version is properly formatted (should start with 'v')
    const apiVersion = this.config.apiVersion.startsWith('v') 
      ? this.config.apiVersion 
      : `v${this.config.apiVersion}`;
    
    return `https://graph.facebook.com/${apiVersion}/${endpoint}`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.config?.accessToken) {
      throw new Error('WhatsApp Business API access token not configured');
    }

    const url = this.getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Update rate limits
    this.rateLimiter.updateRateLimits(response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`WhatsApp Business API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; error?: string; data?: any }> {
    return this.rateLimiter.throttle(async () => {
      try {
        if (!this.config?.phoneNumberId) {
          return { success: false, error: 'Phone number ID not configured' };
        }

        if (!this.config?.accessToken) {
          return { success: false, error: 'Access token not configured' };
        }

        console.log('🔍 Testing WhatsApp Business API connection with:', {
          phoneNumberId: this.config.phoneNumberId,
          apiVersion: this.config.apiVersion,
          hasAccessToken: !!this.config.accessToken
        });

        const data = await this.makeRequest(`${this.config.phoneNumberId}`);
        
        console.log('✅ WhatsApp Business API test response:', data);
        
        if (data.verified_name) {
          return { 
            success: true, 
            data: {
              phoneNumber: data.display_phone_number,
              verifiedName: data.verified_name,
              qualityRating: data.quality_rating,
              codeVerificationStatus: data.code_verification_status
            }
          };
        } else {
          return { success: false, error: 'Phone number not verified' };
        }
      } catch (error) {
        console.error('❌ WhatsApp Business API connection test failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Connection test failed' 
        };
      }
    });
  }

  async sendMessage(
    to: string,
    content: string,
    type: 'text' | 'template' = 'text',
    templateName?: string,
    templateLanguage: string = 'en_US',
    templateParams?: string[]
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.rateLimiter.throttle(async () => {
      try {
        if (!this.config?.phoneNumberId) {
          return { success: false, error: 'Phone number ID not configured' };
        }

        // Format phone number (remove + and add country code if needed)
        const formattedPhone = this.formatPhoneNumber(to);
        
        let messageData: any;

        if (type === 'text') {
          messageData = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: content }
          };
        } else if (type === 'template') {
          if (!templateName) {
            return { success: false, error: 'Template name is required for template messages' };
          }

          messageData = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: templateLanguage
              },
              components: templateParams ? [{
                type: 'body',
                parameters: templateParams.map(param => ({
                  type: 'text',
                  text: param
                }))
              }] : undefined
            }
          };
        }

        const data = await this.makeRequest(`${this.config.phoneNumberId}/messages`, {
          method: 'POST',
          body: JSON.stringify(messageData)
        });

        if (data.messages?.[0]?.id) {
          return { 
            success: true, 
            messageId: data.messages[0].id 
          };
        } else {
          return { success: false, error: 'No message ID returned' };
        }
      } catch (error) {
        console.error('Error sending WhatsApp Business message:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to send message' 
        };
      }
    });
  }

  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'document' | 'audio' | 'video' | 'sticker',
    caption?: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return this.rateLimiter.throttle(async () => {
      try {
        if (!this.config?.phoneNumberId) {
          return { success: false, error: 'Phone number ID not configured' };
        }

        const formattedPhone = this.formatPhoneNumber(to);
        
        const messageData = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: mediaType,
          [mediaType]: {
            link: mediaUrl,
            ...(caption && { caption })
          }
        };

        const data = await this.makeRequest(`${this.config.phoneNumberId}/messages`, {
          method: 'POST',
          body: JSON.stringify(messageData)
        });

        if (data.messages?.[0]?.id) {
          return { 
            success: true, 
            messageId: data.messages[0].id 
          };
        } else {
          return { success: false, error: 'No message ID returned' };
        }
      } catch (error) {
        console.error('Error sending WhatsApp Business media message:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to send media message' 
        };
      }
    });
  }

  async uploadMedia(file: File): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    return this.rateLimiter.throttle(async () => {
      try {
        if (!this.config?.phoneNumberId) {
          return { success: false, error: 'Phone number ID not configured' };
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('messaging_product', 'whatsapp');

        const url = this.getApiUrl(`${this.config.phoneNumberId}/media`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Media upload failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (data.id) {
          return { success: true, mediaId: data.id };
        } else {
          return { success: false, error: 'No media ID returned' };
        }
      } catch (error) {
        console.error('Error uploading media to WhatsApp Business API:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to upload media' 
        };
      }
    });
  }

  async getTemplates(): Promise<{ success: boolean; templates?: WhatsAppBusinessTemplate[]; error?: string }> {
    return this.rateLimiter.throttle(async () => {
      try {
        if (!this.config?.businessAccountId) {
          return { success: false, error: 'Business account ID not configured' };
        }

        const data = await this.makeRequest(`${this.config.businessAccountId}/message_templates`);
        
        if (data.data) {
          return { 
            success: true, 
            templates: data.data.map((template: any) => ({
              name: template.name,
              language: template.language,
              status: template.status,
              category: template.category,
              components: template.components || []
            }))
          };
        } else {
          return { success: false, error: 'No templates found' };
        }
      } catch (error) {
        console.error('Error fetching WhatsApp Business templates:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch templates' 
        };
      }
    });
  }

  async getMessageStatus(messageId: string): Promise<{ success: boolean; status?: WhatsAppBusinessStatus; error?: string }> {
    return this.rateLimiter.throttle(async () => {
      try {
        const data = await this.makeRequest(messageId);
        
        return { 
          success: true, 
          status: {
            id: data.id,
            status: data.status,
            timestamp: data.timestamp,
            recipient_id: data.recipient_id,
            conversation: data.conversation,
            pricing: data.pricing,
            errors: data.errors
          }
        };
      } catch (error) {
        console.error('Error fetching message status:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to fetch message status' 
        };
      }
    });
  }

  // Webhook verification for WhatsApp Business API
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (!this.config?.webhookVerifyToken) {
      return null;
    }

    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }

    return null;
  }

  // Process incoming webhook data
  processWebhook(data: any): void {
    try {
      const entry = data.entry?.[0];
      if (!entry) return;

      const changes = entry.changes?.[0];
      if (!changes || changes.value?.messaging_product !== 'whatsapp') return;

      const messages = changes.value.messages;
      const statuses = changes.value.statuses;

      // Process messages
      if (messages) {
        messages.forEach((message: any) => {
          const formattedMessage: WhatsAppBusinessMessage = {
            id: message.id,
            from: message.from,
            to: message.to,
            type: message.type,
            text: message.text,
            image: message.image,
            document: message.document,
            audio: message.audio,
            video: message.video,
            location: message.location,
            contact: message.contact,
            sticker: message.sticker,
            template: message.template,
            timestamp: message.timestamp,
            context: message.context
          };

          this.messageCallbacks.forEach(callback => callback(formattedMessage));
        });
      }

      // Process status updates
      if (statuses) {
        statuses.forEach((status: any) => {
          const formattedStatus: WhatsAppBusinessStatus = {
            id: status.id,
            status: status.status,
            timestamp: status.timestamp,
            recipient_id: status.recipient_id,
            conversation: status.conversation,
            pricing: status.pricing,
            errors: status.errors
          };

          this.statusCallbacks.forEach(callback => callback(formattedStatus));
        });
      }

      // Notify webhook callbacks
      this.webhookCallbacks.forEach(callback => callback(data));
    } catch (error) {
      console.error('Error processing WhatsApp Business webhook:', error);
    }
  }

  // Event listeners
  onMessage(callback: (message: WhatsAppBusinessMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onStatusUpdate(callback: (status: WhatsAppBusinessStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  onWebhook(callback: (data: any) => void): void {
    this.webhookCallbacks.push(callback);
  }

  // Utility methods
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it doesn't start with a country code, assume it's a local number
    // You might want to customize this based on your region
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned; // Add US country code
    }
    
    return cleaned;
  }

  getConfig(): WhatsAppBusinessConfig | null {
    return this.config;
  }

  isConfigured(): boolean {
    return !!(this.config?.accessToken && this.config?.phoneNumberId);
  }
}

// Export singleton instance
export const whatsappBusinessApi = new WhatsAppBusinessApiService();
