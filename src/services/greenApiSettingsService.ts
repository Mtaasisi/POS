import { supabase } from '../lib/supabaseClient';
import { toast } from '../lib/toastUtils';
import { greenApiProxy } from '../lib/greenApiProxy';

// Green API Settings Interface based on documentation
export interface GreenApiSettings {
  // Instance settings
  wid?: string;
  countryInstance?: string;
  typeAccount?: string;
  
  // Webhook settings
  webhookUrl?: string;
  webhookUrlToken?: string;
  
  // Message settings
  delaySendMessagesMilliseconds?: number;
  markIncomingMessagesReaded?: 'yes' | 'no';
  markIncomingMessagesReadedOnReply?: 'yes' | 'no';
  
  // Webhook notifications
  outgoingWebhook?: 'yes' | 'no';
  outgoingMessageWebhook?: 'yes' | 'no';
  outgoingAPIMessageWebhook?: 'yes' | 'no';
  incomingWebhook?: 'yes' | 'no';
  deviceWebhook?: 'yes' | 'no';
  stateWebhook?: 'yes' | 'no';
  pollMessageWebhook?: 'yes' | 'no';
  incomingBlockWebhook?: 'yes' | 'no';
  incomingCallWebhook?: 'yes' | 'no';
  editedMessageWebhook?: 'yes' | 'no';
  deletedMessageWebhook?: 'yes' | 'no';
  
  // Status settings
  keepOnlineStatus?: 'yes' | 'no';
  
  // Deprecated fields (for compatibility)
  sharedSession?: 'yes' | 'no';
  statusInstanceWebhook?: 'yes' | 'no';
  enableMessagesHistory?: 'yes' | 'no';
}

export interface InstanceState {
  stateInstance: 'authorized' | 'notAuthorized' | 'blocked' | 'sleepMode' | 'starting';
}

export interface QRCodeResponse {
  qr: string;
}

export interface AuthorizationCodeResponse {
  authorizationCode: string;
}

class GreenApiSettingsService {

  // Get instance settings
  async getSettings(instanceId: string, apiToken: string): Promise<GreenApiSettings> {
    try {
      console.log(`🔧 Getting settings for instance: ${instanceId}`);
      
      const result = await greenApiProxy.getSettings(instanceId, apiToken);
      console.log('✅ Settings retrieved successfully:', result.data);
      return result.data;
    } catch (error: any) {
      console.error('❌ Error getting Green API settings:', error);
      toast.error(`Failed to get settings: ${error.message}`);
      throw error;
    }
  }

  // Set instance settings
  async setSettings(instanceId: string, apiToken: string, settings: Partial<GreenApiSettings>): Promise<void> {
    try {
      console.log(`🔧 Setting settings for instance: ${instanceId}`, settings);
      
      await greenApiProxy.setSettings(instanceId, apiToken, settings);
      console.log('✅ Settings updated successfully');
      toast.success('Settings updated successfully');
    } catch (error: any) {
      console.error('❌ Error setting Green API settings:', error);
      toast.error(`Failed to update settings: ${error.message}`);
      throw error;
    }
  }

  // Get instance state
  async getStateInstance(instanceId: string, apiToken: string): Promise<InstanceState> {
    try {
      console.log(`🔧 Getting state for instance: ${instanceId}`);
      
      const result = await greenApiProxy.getStateInstance(instanceId, apiToken);
      console.log('✅ State retrieved successfully:', result.data);
      return result.data;
    } catch (error: any) {
      console.error('❌ Error getting instance state:', error);
      toast.error(`Failed to get instance state: ${error.message}`);
      throw error;
    }
  }

  // Reboot instance
  async rebootInstance(instanceId: string, apiToken: string): Promise<void> {
    try {
      console.log(`🔧 Rebooting instance: ${instanceId}`);
      
      await greenApiProxy.rebootInstance(instanceId, apiToken);
      console.log('✅ Instance rebooted successfully');
      toast.success('Instance rebooted successfully');
    } catch (error: any) {
      console.error('❌ Error rebooting instance:', error);
      toast.error(`Failed to reboot instance: ${error.message}`);
      throw error;
    }
  }

  // Logout instance
  async logoutInstance(instanceId: string, apiToken: string): Promise<void> {
    try {
      console.log(`🔧 Logging out instance: ${instanceId}`);
      
      await greenApiProxy.logoutInstance(instanceId, apiToken);
      console.log('✅ Instance logged out successfully');
      toast.success('Instance logged out successfully');
    } catch (error: any) {
      console.error('❌ Error logging out instance:', error);
      toast.error(`Failed to logout instance: ${error.message}`);
      throw error;
    }
  }

  // Get QR code
  async getQRCode(instanceId: string, apiToken: string): Promise<QRCodeResponse> {
    try {
      console.log(`🔧 Getting QR code for instance: ${instanceId}`);
      
      const result = await greenApiProxy.getQRCode(instanceId, apiToken);
      console.log('✅ QR code retrieved successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ Error getting QR code:', error);
      toast.error(`Failed to get QR code: ${error.message}`);
      throw error;
    }
  }

  // Get authorization code
  async getAuthorizationCode(instanceId: string, apiToken: string): Promise<AuthorizationCodeResponse> {
    try {
      console.log(`🔧 Getting authorization code for instance: ${instanceId}`);
      
      const result = await greenApiProxy.getAuthCode(instanceId, apiToken);
      console.log('✅ Authorization code retrieved successfully');
      return result.data;
    } catch (error: any) {
      console.error('❌ Error getting authorization code:', error);
      toast.error(`Failed to get authorization code: ${error.message}`);
      throw error;
    }
  }

  // Update API token
  async updateApiToken(instanceId: string, apiToken: string, newApiToken: string): Promise<void> {
    try {
      console.log(`🔧 Updating API token for instance: ${instanceId}`);
      
      await greenApiProxy.updateApiToken(instanceId, apiToken, newApiToken);
      console.log('✅ API token updated successfully');
      toast.success('API token updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating API token:', error);
      toast.error(`Failed to update API token: ${error.message}`);
      throw error;
    }
  }

  // Get WhatsApp account information
  async getWaSettings(instanceId: string, apiToken: string): Promise<any> {
    try {
      console.log(`🔧 Getting WhatsApp settings for instance: ${instanceId}`);
      
      const result = await greenApiProxy.getWaSettings(instanceId, apiToken);
      console.log('✅ WhatsApp settings retrieved successfully:', result.data);
      return result.data;
    } catch (error: any) {
      console.error('❌ Error getting WhatsApp settings:', error);
      toast.error(`Failed to get WhatsApp settings: ${error.message}`);
      throw error;
    }
  }

  // Save settings to database
  async saveSettingsToDatabase(instanceId: string, settings: GreenApiSettings): Promise<void> {
    try {
      console.log(`💾 Saving settings to database for instance: ${instanceId}`, settings);
      
      // Convert settings object to key-value pairs
      const settingsEntries = Object.entries(settings).map(([key, value]) => ({
        setting_key: `${instanceId}_${key}`,
        setting_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        description: `Setting for instance ${instanceId}: ${key}`,
        is_encrypted: false
      }));

      console.log('📝 Converting settings to key-value pairs:', settingsEntries);

      // Use upsert instead of delete + insert to avoid conflicts
      const { data, error } = await supabase
        .from('green_api_settings')
        .upsert(settingsEntries, {
          onConflict: 'setting_key',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('❌ Database error:', error);
        
        // If it's a conflict error, try to update existing records
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.log('🔄 Conflict detected, updating existing settings...');
          await this.updateExistingSettings(instanceId, settings);
        } else {
          throw error;
        }
      } else {
        console.log('✅ Settings saved to database successfully:', data);
      }
    } catch (error: any) {
      console.error('❌ Error saving settings to database:', error);
      throw error;
    }
  }

  // Update existing settings to handle conflicts
  private async updateExistingSettings(instanceId: string, settings: GreenApiSettings): Promise<void> {
    try {
      for (const [key, value] of Object.entries(settings)) {
        const settingKey = `${instanceId}_${key}`;
        const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        
        const { error } = await supabase
          .from('green_api_settings')
          .update({
            setting_value: settingValue,
            description: `Setting for instance ${instanceId}: ${key}`,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', settingKey);

        if (error) {
          console.error(`❌ Error updating setting ${settingKey}:`, error);
        }
      }
      
      console.log('✅ Existing settings updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating existing settings:', error);
      throw error;
    }
  }

  // Load settings from database
  async loadSettingsFromDatabase(instanceId: string): Promise<GreenApiSettings | null> {
    try {
      console.log(`🔍 Loading settings from database for instance: ${instanceId}`);
      
      const { data, error } = await supabase
        .from('green_api_settings')
        .select('setting_key, setting_value')
        .like('setting_key', `${instanceId}_%`);

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      console.log('📄 Database response:', data);
      
      if (data && data.length > 0) {
        // Convert key-value pairs back to settings object
        const settings: GreenApiSettings = {};
        
        data.forEach(row => {
          const key = row.setting_key.replace(`${instanceId}_`, '');
          let value: any = row.setting_value;
          
          // Try to parse JSON values
          try {
            value = JSON.parse(row.setting_value);
          } catch {
            // Keep as string if not valid JSON
          }
          
          // Convert string values to appropriate types
          if (typeof value === 'string') {
            if (value === 'true' || value === 'false') {
              value = value === 'true';
            } else if (!isNaN(Number(value)) && value !== '') {
              value = Number(value);
            }
          }
          
          settings[key as keyof GreenApiSettings] = value;
        });
        
        console.log('✅ Settings found in database:', settings);
        return settings;
      } else {
        console.log('📝 No settings found in database');
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error loading settings from database:', error);
      return null;
    }
  }

  // Get default settings
  getDefaultSettings(): GreenApiSettings {
    return {
      webhookUrl: '',
      webhookUrlToken: '',
      delaySendMessagesMilliseconds: 5000,
      markIncomingMessagesReaded: 'no',
      markIncomingMessagesReadedOnReply: 'no',
      outgoingWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      incomingWebhook: 'yes',
      deviceWebhook: 'no',
      stateWebhook: 'no',
      keepOnlineStatus: 'no',
      pollMessageWebhook: 'no',
      incomingBlockWebhook: 'yes',
      incomingCallWebhook: 'yes',
      editedMessageWebhook: 'no',
      deletedMessageWebhook: 'no'
    };
  }

  // Validate settings
  validateSettings(settings: Partial<GreenApiSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate delay
    if (settings.delaySendMessagesMilliseconds !== undefined) {
      if (settings.delaySendMessagesMilliseconds < 0) {
        errors.push('Message delay must be 0 or greater');
      }
    }

    // Validate webhook URL if provided
    if (settings.webhookUrl && !settings.webhookUrl.startsWith('http')) {
      errors.push('Webhook URL must be a valid HTTP/HTTPS URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const greenApiSettingsService = new GreenApiSettingsService();
export default greenApiSettingsService;
