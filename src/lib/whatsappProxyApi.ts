import { toast } from './toastUtils';

// Base URL for the proxy function
const PROXY_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8888/.netlify/functions/whatsapp-proxy'
  : '/.netlify/functions/whatsapp-proxy';

export interface WhatsAppProxyResponse<T = any> {
  success: boolean;
  action: string;
  instanceId: string;
  data: T;
  timestamp: string;
  error?: string;
  details?: string;
}

export interface WhatsAppProxyError {
  error: string;
  message?: string;
  details?: string;
  action?: string;
  instanceId?: string;
}

class WhatsAppProxyApi {
  private async makeRequest(action: string, params: any = {}): Promise<WhatsAppProxyResponse> {
    try {
      const response = await fetch(PROXY_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...params
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error: any) {
      console.error(`❌ WhatsApp Proxy Error (${action}):`, error);
      throw error;
    }
  }

  // Instance Management
  async getStateInstance(instanceId: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('getStateInstance', { instanceId });
  }

  async getSettings(instanceId: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('getSettings', { instanceId });
  }

  async getWebhookSettings(instanceId: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('getWebhookSettings', { instanceId });
  }

  async setWebhookSettings(instanceId: string, webhookUrl: string, webhookSecret?: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('setWebhookSettings', { 
      instanceId, 
      webhookUrl, 
      webhookSecret 
    });
  }

  // Messaging
  async sendMessage(instanceId: string, chatId: string, message: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('sendMessage', { 
      instanceId, 
      chatId, 
      message 
    });
  }

  async sendTextMessage(instanceId: string, chatId: string, text: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('sendTextMessage', { 
      instanceId, 
      chatId, 
      text 
    });
  }

  async sendFileByUrl(instanceId: string, chatId: string, fileUrl: string, fileName?: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('sendFileByUrl', { 
      instanceId, 
      chatId, 
      fileUrl, 
      fileName 
    });
  }

  // Chat Management
  async getChatHistory(instanceId: string, chatId: string, count?: number): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('getChatHistory', { 
      instanceId, 
      chatId, 
      count: count || 100 
    });
  }

  async getMessages(instanceId: string, chatId: string, count?: number): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('getMessages', { 
      instanceId, 
      chatId, 
      count: count || 100 
    });
  }

  async getChats(instanceId: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('getChats', { instanceId });
  }

  // Contact Management
  async getContacts(instanceId: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('getContacts', { instanceId });
  }

  async getContactInfo(instanceId: string, chatId: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('getContactInfo', { 
      instanceId, 
      chatId 
    });
  }

  // Message Management
  async deleteMessage(instanceId: string, chatId: string, messageId: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('deleteMessage', { 
      instanceId, 
      chatId, 
      messageId 
    });
  }

  async markMessageAsRead(instanceId: string, chatId: string, messageId: string): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('markMessageAsRead', { 
      instanceId, 
      chatId, 
      messageId 
    });
  }

  // Health Check
  async health(): Promise<WhatsAppProxyResponse> {
    return this.makeRequest('health');
  }

  // Utility method to test connection
  async testConnection(instanceId: string): Promise<{ connected: boolean; state?: string; error?: string }> {
    try {
      const response = await this.getStateInstance(instanceId);
      return {
        connected: true,
        state: response.data?.stateInstance
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Utility method to check multiple instances
  async checkAllInstances(instanceIds: string[]): Promise<Record<string, { connected: boolean; state?: string; error?: string }>> {
    const results: Record<string, { connected: boolean; state?: string; error?: string }> = {};
    
    await Promise.all(
      instanceIds.map(async (instanceId) => {
        results[instanceId] = await this.testConnection(instanceId);
      })
    );

    return results;
  }
}

// Export singleton instance
export const whatsappProxyApi = new WhatsAppProxyApi();

// Export helper functions for common operations
export const testWhatsAppConnection = async (instanceId: string) => {
  try {
    const result = await whatsappProxyApi.testConnection(instanceId);
    if (result.connected) {
      toast.success(`WhatsApp connected: ${result.state}`);
    } else {
      toast.error(`WhatsApp connection failed: ${result.error}`);
    }
    return result;
  } catch (error: any) {
    toast.error(`Connection test failed: ${error.message}`);
    return { connected: false, error: error.message };
  }
};

export const sendWhatsAppMessage = async (instanceId: string, chatId: string, message: string) => {
  try {
    const result = await whatsappProxyApi.sendTextMessage(instanceId, chatId, message);
    toast.success('Message sent successfully');
    return result;
  } catch (error: any) {
    toast.error(`Failed to send message: ${error.message}`);
    throw error;
  }
};
