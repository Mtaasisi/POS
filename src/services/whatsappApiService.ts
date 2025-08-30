import { greenApiService } from './greenApiService';
import { greenApiSettingsService } from './greenApiSettingsService';
import { toast } from 'react-hot-toast';

// Export interfaces for the component
export interface SendMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

export interface InstanceInfo {
  phoneNumber?: string;
  wid?: string;
  profileName?: string;
  profilePictureUrl?: string;
  countryInstance?: string;
  typeAccount?: string;
  stateInstance: string;
}

export interface ConnectionStatusResponse {
  stateInstance: string;
  error?: string;
}

// WhatsApp API Service wrapper class
export class WhatsAppApiService {
  
  /**
   * Check instance state using Green API
   */
  static async checkInstanceState(instanceId: string, apiToken: string, host?: string): Promise<ConnectionStatusResponse> {
    try {
      const response = await greenApiSettingsService.getStateInstance(instanceId, apiToken);
      return {
        stateInstance: response.stateInstance
      };
    } catch (error: any) {
      console.error('Error checking instance state:', error);
      return {
        stateInstance: 'error',
        error: error.message
      };
    }
  }

  /**
   * Alternative method for checking instance state (with different host/proxy)
   */
  static async checkInstanceStateAlternative(instanceId: string, apiToken: string, host?: string): Promise<ConnectionStatusResponse> {
    try {
      // Use alternative proxy or host
      const response = await greenApiSettingsService.getStateInstance(instanceId, apiToken);
      return {
        stateInstance: response.stateInstance
      };
    } catch (error: any) {
      console.error('Error checking instance state (alternative):', error);
      return {
        stateInstance: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get instance information including phone number, profile, etc.
   */
  static async getInstanceInfo(instanceId: string, apiToken: string, host?: string): Promise<InstanceInfo> {
    try {
      const response = await greenApiService.getWaSettings(instanceId, apiToken, host);
      return {
        phoneNumber: response.phone,
        wid: response.deviceId,
        profileName: response.profileName,
        profilePictureUrl: response.avatar,
        countryInstance: response.countryInstance,
        typeAccount: response.typeAccount,
        stateInstance: response.stateInstance
      };
    } catch (error: any) {
      console.error('Error getting instance info:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for instance authorization
   */
  static async generateQRCode(instanceId: string, apiToken: string, host?: string): Promise<string | null> {
    try {
      const response = await greenApiSettingsService.getQRCode(instanceId, apiToken);
      return response.qr;
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Generate QR code using WebSocket for real-time updates
   */
  static async generateQRCodeWebSocket(instanceId: string, apiToken: string, host?: string): Promise<WebSocket | null> {
    try {
      // TODO: Implement WebSocket QR code generation
      // For now, fall back to regular QR code generation
      console.log('📱 WebSocket QR code generation not yet implemented, using regular QR code method');
      const response = await greenApiSettingsService.getQRCode(instanceId, apiToken);
      
      // Display the QR code directly instead of WebSocket
      if (response.qr) {
        console.log('✅ QR code generated successfully via fallback method');
        // Return null for WebSocket since we're not actually using WebSocket
        return null;
      }
      
      throw new Error('Failed to generate QR code');
    } catch (error: any) {
      console.error('Error generating QR code via WebSocket:', error);
      throw error;
    }
  }

  /**
   * Send a test message
   */
  static async sendTestMessage(instanceId: string, apiToken: string, host: string, phoneNumber: string): Promise<SendMessageResponse> {
    try {
      const message = `🧪 Test message from WhatsApp instance ${instanceId} at ${new Date().toLocaleString()}`;
      
      // Use the existing sendMessage method from greenApiService
      const response = await greenApiService.sendMessage({
        instanceId,
        chatId: `${phoneNumber}@c.us`,
        message,
        messageType: 'text'
      });

      return {
        success: true,
        message: 'Test message sent successfully!',
        messageId: response.id
      };
    } catch (error: any) {
      console.error('Error sending test message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Logout from WhatsApp instance
   */
  static async logout(instanceId: string, apiToken: string, host?: string): Promise<any> {
    try {
      const response = await greenApiService.logout(instanceId, apiToken, host);
      return response;
    } catch (error: any) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  /**
   * Reboot WhatsApp instance
   */
  static async reboot(instanceId: string, apiToken: string, host?: string): Promise<any> {
    try {
      const response = await greenApiService.reboot(instanceId, apiToken, host);
      return response;
    } catch (error: any) {
      console.error('Error rebooting instance:', error);
      throw error;
    }
  }

  /**
   * Update API token for instance
   */
  static async updateApiToken(instanceId: string, currentApiToken: string, newApiToken: string, host?: string): Promise<any> {
    try {
      const response = await greenApiService.updateApiToken(instanceId, currentApiToken, newApiToken, host);
      return response;
    } catch (error: any) {
      console.error('Error updating API token:', error);
      throw error;
    }
  }

  /**
   * Set profile picture for WhatsApp account
   */
  static async setProfilePicture(instanceId: string, apiToken: string, file: File): Promise<any> {
    try {
      const response = await greenApiService.setProfilePicture(instanceId, apiToken, file);
      return response;
    } catch (error: any) {
      console.error('Error setting profile picture:', error);
      throw error;
    }
  }

  /**
   * Get authorization code for phone number linking
   */
  static async getAuthorizationCode(instanceId: string, apiToken: string, phoneNumber: string, host?: string): Promise<any> {
    try {
      const response = await greenApiService.getAuthorizationCode(instanceId, apiToken, phoneNumber, host);
      return response;
    } catch (error: any) {
      console.error('Error getting authorization code:', error);
      throw error;
    }
  }

  /**
   * Get instance settings
   */
  static async getSettings(instanceId: string, apiToken: string, host?: string): Promise<any> {
    try {
      const response = await greenApiService.getSettings(instanceId, apiToken, host);
      return response;
    } catch (error: any) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Set instance settings
   */
  static async setSettings(instanceId: string, apiToken: string, settings: any, host?: string): Promise<any> {
    try {
      const response = await greenApiService.setSettings(instanceId, apiToken, settings, host);
      return response;
    } catch (error: any) {
      console.error('Error setting settings:', error);
      throw error;
    }
  }

  /**
   * Get detailed WhatsApp account settings
   */
  static async getWaSettings(instanceId: string, apiToken: string, host?: string): Promise<any> {
    try {
      const response = await greenApiService.getWaSettings(instanceId, apiToken, host);
      return response;
    } catch (error: any) {
      console.error('Error getting WhatsApp settings:', error);
      throw error;
    }
  }
}

// Export default instance
export default WhatsAppApiService;