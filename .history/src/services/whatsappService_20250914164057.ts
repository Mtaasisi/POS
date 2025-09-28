import { whatsappProxyApi } from '../lib/whatsappProxyApi';
import { toast } from 'react-hot-toast';

// Interface for instance status response
export interface InstanceStatus {
  authorized: boolean;
  state: string;
  error?: string;
}

// Interface for send message response
export interface SendMessageResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// WhatsApp Service class
class WhatsAppService {
  /**
   * Check WhatsApp instance status
   */
  async checkInstanceStatus(): Promise<InstanceStatus> {
    try {
      // For now, return a mock status since credentials are not available
      // In a real implementation, this would check actual WhatsApp instance status
      console.log('🔍 Checking WhatsApp instance status...');
      
      // Mock response - in production this would use actual credentials
      return {
        authorized: false,
        state: 'notAuthorized',
        error: 'WhatsApp credentials not configured'
      };
    } catch (error: any) {
      console.error('❌ Error checking WhatsApp status:', error);
      return {
        authorized: false,
        state: 'error',
        error: error.message || 'Failed to check WhatsApp status'
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsAppMessage(
    phoneNumber: string, 
    message: string, 
    customerId?: string
  ): Promise<SendMessageResult> {
    try {
      console.log(`📱 Sending WhatsApp message to ${phoneNumber}:`, message);
      
      // For now, return a mock response since credentials are not available
      // In a real implementation, this would send actual WhatsApp messages
      toast.error('WhatsApp service not configured. Please set up WhatsApp credentials.');
      
      return {
        success: false,
        error: 'WhatsApp service not configured. Please set up WhatsApp credentials.'
      };
    } catch (error: any) {
      console.error('❌ Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error.message || 'Failed to send WhatsApp message'
      };
    }
  }

  /**
   * Test WhatsApp connection (for future use when credentials are available)
   */
  async testConnection(instanceId: string): Promise<{ connected: boolean; state?: string; error?: string }> {
    try {
      const result = await whatsappProxyApi.testConnection(instanceId);
      return result;
    } catch (error: any) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Send message using proxy API (for future use when credentials are available)
   */
  async sendMessageViaProxy(instanceId: string, chatId: string, message: string): Promise<any> {
    try {
      const result = await whatsappProxyApi.sendTextMessage(instanceId, chatId, message);
      return result;
    } catch (error: any) {
      throw error;
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();

// Export the class for direct instantiation if needed
export default WhatsAppService;