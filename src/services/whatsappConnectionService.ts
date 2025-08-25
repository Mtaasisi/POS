import { supabase } from '../lib/supabaseClient';
import { toast } from '../lib/toastUtils';
import { greenApiProxy } from '../lib/greenApiProxy';

// Comprehensive interfaces based on Green API documentation
export interface WhatsAppInstance {
  id: string;
  user_id: string;
  instance_id: string;
  api_token: string;
  instance_name?: string;
  description?: string;
  green_api_host: string;
  green_api_url?: string;
  state_instance: string;
  status: string;
  phone_number?: string;
  wid?: string;
  country_instance?: string;
  type_account?: string;
  is_active: boolean;
  last_connected_at?: string;
  last_activity_at?: string;
  profile_name?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConnectionSettings {
  id?: string;
  instance_id: string;
  user_id: string;
  
  // Webhook Configuration
  webhook_url?: string;
  webhook_url_token?: string;
  
  // Message Settings
  delay_send_messages_milliseconds: number;
  mark_incoming_messages_readed: 'yes' | 'no';
  mark_incoming_messages_readed_on_reply: 'yes' | 'no';
  
  // Webhook Notifications
  outgoing_webhook: 'yes' | 'no';
  outgoing_message_webhook: 'yes' | 'no';
  outgoing_api_message_webhook: 'yes' | 'no';
  incoming_webhook: 'yes' | 'no';
  device_webhook: 'yes' | 'no';
  state_webhook: 'yes' | 'no';
  poll_message_webhook: 'yes' | 'no';
  incoming_block_webhook: 'yes' | 'no';
  incoming_call_webhook: 'yes' | 'no';
  edited_message_webhook: 'yes' | 'no';
  deleted_message_webhook: 'yes' | 'no';
  
  // Status Settings
  keep_online_status: 'yes' | 'no';
  
  // Deprecated fields (for compatibility)
  shared_session: 'yes' | 'no';
  status_instance_webhook: 'yes' | 'no';
  enable_messages_history: 'yes' | 'no';
  
  // Auto-sync
  auto_sync_enabled: boolean;
  last_synced_at?: string;
}

export interface QRCodeData {
  id?: string;
  instance_id: string;
  user_id: string;
  qr_code_base64?: string;
  qr_code_url?: string;
  is_active: boolean;
  expires_at?: string;
  scan_attempts: number;
  max_scan_attempts: number;
  authorization_code?: string;
  is_scanned: boolean;
  scanned_at?: string;
}

export interface InstanceState {
  stateInstance: 'notAuthorized' | 'authorized' | 'blocked' | 'sleepMode' | 'starting' | 'yellowCard';
}

export interface GreenApiSettings {
  wid?: string;
  countryInstance?: string;
  typeAccount?: string;
  webhookUrl?: string;
  webhookUrlToken?: string;
  delaySendMessagesMilliseconds?: number;
  markIncomingMessagesReaded?: 'yes' | 'no';
  markIncomingMessagesReadedOnReply?: 'yes' | 'no';
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
  keepOnlineStatus?: 'yes' | 'no';
  sharedSession?: 'yes' | 'no';
  statusInstanceWebhook?: 'yes' | 'no';
  enableMessagesHistory?: 'yes' | 'no';
}

export interface AuthorizationCode {
  authorizationCode: string;
}

export interface WhatsAppAccountInfo {
  wid: string;
  name?: string;
  phone?: string;
  avatar?: string;
}

class WhatsAppConnectionService {
  private baseUrl = 'https://api.green-api.com';
  private proxyUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8888'
    : 'https://inauzwa.store';

  // =================== INSTANCE MANAGEMENT ===================

  async createInstance(
    instanceId: string,
    apiToken: string,
    instanceName?: string,
    description?: string,
    host?: string
  ): Promise<WhatsAppInstance> {
    try {
      console.log('🔧 Creating comprehensive WhatsApp instance...');

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      // First check if instance exists in Green API
      const stateResponse = await this.getInstanceState(instanceId, apiToken);
      
      const instanceData: Partial<WhatsAppInstance> = {
        user_id: currentUser.user.id,
        instance_id: instanceId,
        api_token: apiToken,
        instance_name: instanceName || `WhatsApp Instance ${instanceId}`,
        description: description || '',
        green_api_host: host || this.baseUrl,
        green_api_url: `${host || this.baseUrl}/waInstance${instanceId}`,
        state_instance: stateResponse.stateInstance,
        status: stateResponse.stateInstance === 'authorized' ? 'connected' : 'disconnected',
        is_active: true
      };

      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .insert(instanceData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Instance ID already exists');
        }
        throw error;
      }

      // Create default settings
      await this.createDefaultSettings(instanceId, currentUser.user.id);

      console.log('✅ Instance created successfully');
      toast.success('WhatsApp instance created successfully!');
      
      return data;
    } catch (error: any) {
      console.error('❌ Error creating instance:', error);
      toast.error(`Failed to create instance: ${error.message}`);
      throw error;
    }
  }

  async getAllInstances(): Promise<WhatsAppInstance[]> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('*')
        .eq('user_id', currentUser.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('❌ Error loading instances:', error);
      throw error;
    }
  }

  async getInstance(instanceId: string): Promise<WhatsAppInstance | null> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No data found
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error getting instance:', error);
      throw error;
    }
  }

  async updateInstance(instanceId: string, updates: Partial<WhatsAppInstance>): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update(updates)
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.user.id);

      if (error) throw error;

      console.log('✅ Instance updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating instance:', error);
      throw error;
    }
  }

  async deleteInstance(instanceId: string): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update({ is_active: false })
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.user.id);

      if (error) throw error;

      toast.success('Instance deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting instance:', error);
      toast.error(`Failed to delete instance: ${error.message}`);
      throw error;
    }
  }

  // =================== GREEN API ENDPOINTS ===================

  // GetSettings - https://green-api.com/en/docs/api/account/GetSettings/
  async getSettings(instanceId: string, apiToken: string): Promise<GreenApiSettings> {
    try {
      console.log(`🔍 Getting settings for instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/getSettings/${apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get settings: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Settings retrieved:', data);
      
      // Save to database
      await this.saveSettingsToDatabase(instanceId, data);
      
      return data;
    } catch (error: any) {
      console.error('❌ Error getting settings:', error);
      throw error;
    }
  }

  // SetSettings - https://green-api.com/en/docs/api/account/SetSettings/
  async setSettings(instanceId: string, apiToken: string, settings: Partial<GreenApiSettings>): Promise<void> {
    try {
      console.log(`🔧 Setting settings for instance: ${instanceId}`, settings);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/setSettings/${apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to set settings: ${response.status} - ${errorText}`);
      }

      console.log('✅ Settings updated successfully');
      
      // Update database
      await this.saveSettingsToDatabase(instanceId, settings);
      
      toast.success('Settings updated successfully!');
    } catch (error: any) {
      console.error('❌ Error setting settings:', error);
      toast.error(`Failed to update settings: ${error.message}`);
      throw error;
    }
  }

  // GetStateInstance - https://green-api.com/en/docs/api/account/GetStateInstance/
  async getInstanceState(instanceId: string, apiToken: string): Promise<InstanceState> {
    try {
      console.log(`🔍 Getting state for instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/getStateInstance/${apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get state: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Instance state:', data);
      
      // Update instance status in database
      await this.updateInstanceState(instanceId, data.stateInstance);
      
      return data;
    } catch (error: any) {
      console.error('❌ Error getting instance state:', error);
      throw error;
    }
  }

  // Reboot - https://green-api.com/en/docs/api/account/Reboot/
  async rebootInstance(instanceId: string, apiToken: string): Promise<void> {
    try {
      console.log(`🔄 Rebooting instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/reboot/${apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reboot: ${response.status} - ${errorText}`);
      }

      console.log('✅ Instance rebooted successfully');
      toast.success('Instance rebooted successfully!');
      
      // Update status to starting
      await this.updateInstanceState(instanceId, 'starting');
    } catch (error: any) {
      console.error('❌ Error rebooting instance:', error);
      toast.error(`Failed to reboot instance: ${error.message}`);
      throw error;
    }
  }

  // Logout - https://green-api.com/en/docs/api/account/Logout/
  async logoutInstance(instanceId: string, apiToken: string): Promise<void> {
    try {
      console.log(`🚪 Logging out instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/logout/${apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to logout: ${response.status} - ${errorText}`);
      }

      console.log('✅ Instance logged out successfully');
      toast.success('Instance logged out successfully!');
      
      // Update status to notAuthorized
      await this.updateInstanceState(instanceId, 'notAuthorized');
    } catch (error: any) {
      console.error('❌ Error logging out instance:', error);
      toast.error(`Failed to logout instance: ${error.message}`);
      throw error;
    }
  }

  // QR - https://green-api.com/en/docs/api/account/QR/
  async getQRCode(instanceId: string, apiToken: string): Promise<QRCodeData> {
    try {
      console.log(`📱 Getting QR code for instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/qr/${apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get QR code: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ QR code retrieved');
      
      // Save QR code to database
      const qrData = await this.saveQRCode(instanceId, data.qrCode);
      
      return qrData;
    } catch (error: any) {
      console.error('❌ Error getting QR code:', error);
      throw error;
    }
  }

  // ScanQRCode - https://green-api.com/en/docs/api/account/Scanqrcode/
  async scanQRCode(instanceId: string, apiToken: string, qrCode: string): Promise<void> {
    try {
      console.log(`📸 Scanning QR code for instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/scanqrcode/${apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to scan QR code: ${response.status} - ${errorText}`);
      }

      console.log('✅ QR code scanned successfully');
      toast.success('QR code scanned successfully!');
      
      // Update QR code status
      await this.updateQRCodeStatus(instanceId, true);
    } catch (error: any) {
      console.error('❌ Error scanning QR code:', error);
      toast.error(`Failed to scan QR code: ${error.message}`);
      throw error;
    }
  }

  // GetAuthorizationCode - https://green-api.com/en/docs/api/account/GetAuthorizationCode/
  async getAuthorizationCode(instanceId: string, apiToken: string, phoneNumber: string): Promise<AuthorizationCode> {
    try {
      console.log(`🔑 Getting authorization code for instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/getAuthorizationCode/${apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get authorization code: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Authorization code retrieved');
      
      // Save authorization code
      await this.saveAuthorizationCode(instanceId, data.authorizationCode);
      
      return data;
    } catch (error: any) {
      console.error('❌ Error getting authorization code:', error);
      throw error;
    }
  }

  // SetProfilePicture - https://green-api.com/en/docs/api/account/SetProfilePicture/
  async setProfilePicture(instanceId: string, apiToken: string, file: File): Promise<void> {
    try {
      console.log(`🖼️ Setting profile picture for instance: ${instanceId}`);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/setProfilePicture/${apiToken}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to set profile picture: ${response.status} - ${errorText}`);
      }

      console.log('✅ Profile picture updated successfully');
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('❌ Error setting profile picture:', error);
      toast.error(`Failed to update profile picture: ${error.message}`);
      throw error;
    }
  }

  // UpdateApiToken - https://green-api.com/en/docs/api/account/UpdateApiToken/
  async updateApiToken(instanceId: string, oldToken: string): Promise<string> {
    try {
      console.log(`🔑 Updating API token for instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/updateApiToken/${oldToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update API token: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API token updated successfully');
      
      // Update token in database
      await this.updateInstance(instanceId, { api_token: data.apiTokenInstance });
      
      toast.success('API token updated successfully!');
      return data.apiTokenInstance;
    } catch (error: any) {
      console.error('❌ Error updating API token:', error);
      toast.error(`Failed to update API token: ${error.message}`);
      throw error;
    }
  }

  // GetWaSettings - https://green-api.com/en/docs/api/account/GetWaSettings/
  async getWhatsAppAccountInfo(instanceId: string, apiToken: string): Promise<WhatsAppAccountInfo> {
    try {
      console.log(`ℹ️ Getting WhatsApp account info for instance: ${instanceId}`);
      
      const response = await fetch(`${this.proxyUrl}/proxy/waInstance${instanceId}/getWaSettings/${apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get WhatsApp account info: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ WhatsApp account info retrieved:', data);
      
      // Update instance with account info
      await this.updateInstance(instanceId, {
        wid: data.wid,
        profile_name: data.name,
        phone_number: data.phone
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ Error getting WhatsApp account info:', error);
      throw error;
    }
  }

  // =================== DATABASE OPERATIONS ===================

  private async createDefaultSettings(instanceId: string, userId: string): Promise<void> {
    try {
      const defaultSettings: Omit<WhatsAppConnectionSettings, 'id'> = {
        instance_id: instanceId,
        user_id: userId,
        delay_send_messages_milliseconds: 1000,
        mark_incoming_messages_readed: 'no',
        mark_incoming_messages_readed_on_reply: 'no',
        outgoing_webhook: 'yes',
        outgoing_message_webhook: 'yes',
        outgoing_api_message_webhook: 'yes',
        incoming_webhook: 'yes',
        device_webhook: 'no',
        state_webhook: 'yes',
        poll_message_webhook: 'no',
        incoming_block_webhook: 'no',
        incoming_call_webhook: 'no',
        edited_message_webhook: 'no',
        deleted_message_webhook: 'no',
        keep_online_status: 'no',
        shared_session: 'no',
        status_instance_webhook: 'no',
        enable_messages_history: 'no',
        auto_sync_enabled: true
      };

      const { error } = await supabase
        .from('whatsapp_connection_settings')
        .insert(defaultSettings);

      if (error) throw error;

      console.log('✅ Default settings created');
    } catch (error: any) {
      console.error('❌ Error creating default settings:', error);
    }
  }

  private async saveSettingsToDatabase(instanceId: string, settings: Partial<GreenApiSettings>): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const dbSettings: Partial<WhatsAppConnectionSettings> = {
        webhook_url: settings.webhookUrl,
        webhook_url_token: settings.webhookUrlToken,
        delay_send_messages_milliseconds: settings.delaySendMessagesMilliseconds,
        mark_incoming_messages_readed: settings.markIncomingMessagesReaded,
        mark_incoming_messages_readed_on_reply: settings.markIncomingMessagesReadedOnReply,
        outgoing_webhook: settings.outgoingWebhook,
        outgoing_message_webhook: settings.outgoingMessageWebhook,
        outgoing_api_message_webhook: settings.outgoingAPIMessageWebhook,
        incoming_webhook: settings.incomingWebhook,
        device_webhook: settings.deviceWebhook,
        state_webhook: settings.stateWebhook,
        poll_message_webhook: settings.pollMessageWebhook,
        incoming_block_webhook: settings.incomingBlockWebhook,
        incoming_call_webhook: settings.incomingCallWebhook,
        edited_message_webhook: settings.editedMessageWebhook,
        deleted_message_webhook: settings.deletedMessageWebhook,
        keep_online_status: settings.keepOnlineStatus,
        shared_session: settings.sharedSession,
        status_instance_webhook: settings.statusInstanceWebhook,
        enable_messages_history: settings.enableMessagesHistory,
        last_synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('whatsapp_connection_settings')
        .upsert(
          { instance_id: instanceId, user_id: currentUser.user.id, ...dbSettings },
          { onConflict: 'instance_id,user_id' }
        );

      if (error) throw error;

      console.log('✅ Settings saved to database');
    } catch (error: any) {
      console.error('❌ Error saving settings to database:', error);
    }
  }

  private async updateInstanceState(instanceId: string, state: string): Promise<void> {
    try {
      const status = state === 'authorized' ? 'connected' : 'disconnected';
      
      await this.updateInstance(instanceId, {
        state_instance: state,
        status: status,
        last_activity_at: new Date().toISOString(),
        ...(status === 'connected' ? { last_connected_at: new Date().toISOString() } : {})
      });
    } catch (error: any) {
      console.error('❌ Error updating instance state:', error);
    }
  }

  private async saveQRCode(instanceId: string, qrCodeBase64: string): Promise<QRCodeData> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      // Expire old QR codes
      await supabase
        .from('whatsapp_qr_codes')
        .update({ is_active: false })
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.user.id);

      const qrData = {
        instance_id: instanceId,
        user_id: currentUser.user.id,
        qr_code_base64: qrCodeBase64,
        is_active: true,
        expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute
        scan_attempts: 0,
        max_scan_attempts: 3,
        is_scanned: false
      };

      const { data, error } = await supabase
        .from('whatsapp_qr_codes')
        .insert(qrData)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('❌ Error saving QR code:', error);
      throw error;
    }
  }

  private async updateQRCodeStatus(instanceId: string, isScanned: boolean): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const updates: any = { is_scanned: isScanned };
      if (isScanned) {
        updates.scanned_at = new Date().toISOString();
      }

      await supabase
        .from('whatsapp_qr_codes')
        .update(updates)
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.user.id)
        .eq('is_active', true);
    } catch (error: any) {
      console.error('❌ Error updating QR code status:', error);
    }
  }

  private async saveAuthorizationCode(instanceId: string, authCode: string): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      await supabase
        .from('whatsapp_qr_codes')
        .update({ authorization_code: authCode })
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.user.id)
        .eq('is_active', true);
    } catch (error: any) {
      console.error('❌ Error saving authorization code:', error);
    }
  }

  // =================== UTILITY METHODS ===================

  async getAllSettings(instanceId: string): Promise<WhatsAppConnectionSettings | null> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('whatsapp_connection_settings')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No settings found
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error getting settings:', error);
      throw error;
    }
  }

  async syncAllInstances(): Promise<void> {
    try {
      const instances = await this.getAllInstances();
      
      for (const instance of instances) {
        try {
          // Get current state from Green API
          const state = await this.getInstanceState(instance.instance_id, instance.api_token);
          
          // Get current settings from Green API
          await this.getSettings(instance.instance_id, instance.api_token);
          
          // Get account info if authorized
          if (state.stateInstance === 'authorized') {
            await this.getWhatsAppAccountInfo(instance.instance_id, instance.api_token);
          }
          
          console.log(`✅ Synced instance: ${instance.instance_id}`);
        } catch (error: any) {
          console.error(`❌ Failed to sync instance ${instance.instance_id}:`, error);
        }
      }
      
      toast.success('All instances synced successfully!');
    } catch (error: any) {
      console.error('❌ Error syncing instances:', error);
      toast.error('Failed to sync some instances');
    }
  }
}

export const whatsappConnectionService = new WhatsAppConnectionService();