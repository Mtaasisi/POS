import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export interface WhatsAppInstance {
  id: string;
  user_id?: string;
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

export interface ConnectionSettings {
  id?: string;
  user_id?: string;
  instance_id: string;
  webhook_url?: string;
  webhook_url_token?: string;
  mark_incoming_messages_readed: string;
  mark_incoming_messages_readed_on_reply: string;
  delay_send_messages_milliseconds: number;
  incoming_webhook: string;
  outgoing_webhook: string;
  outgoing_message_webhook: string;
  outgoing_api_message_webhook: string;
  state_webhook: string;
  device_webhook: string;
  incoming_call_webhook: string;
  poll_message_webhook: string;
  edited_message_webhook: string;
  deleted_message_webhook: string;
  incoming_block_webhook: string;
  keep_online_status: string;
  created_at?: string;
  updated_at?: string;
}

export interface QRCode {
  id?: string;
  user_id?: string;
  instance_id: string;
  qr_code_base64: string;
  qr_code_url?: string;
  is_active: boolean;
  expires_at?: string;
  scan_attempts: number;
  max_scan_attempts: number;
  created_at?: string;
  updated_at?: string;
}

class WhatsAppConnectionService {
  private baseUrl = 'https://api.green-api.com';

  // Instance Management
  async createInstance(params: {
    instanceId: string;
    apiToken: string;
    instanceName?: string;
    description?: string;
    greenApiHost?: string;
  }): Promise<WhatsAppInstance | null> {
    try {
      console.log('🔧 Creating new WhatsApp instance...');
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Authentication required');
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .insert({
          user_id: user.id,
          instance_id: params.instanceId,
          api_token: params.apiToken,
          instance_name: params.instanceName || params.instanceId,
          description: params.description,
          green_api_host: params.greenApiHost || this.baseUrl,
          green_api_url: `${params.greenApiHost || this.baseUrl}/waInstance${params.instanceId}`,
          state_instance: 'notAuthorized',
          status: 'disconnected',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating instance:', error);
        
        if (error.code === '23505') {
          toast.error('An instance with this ID already exists');
        } else if (error.code === '42501') {
          toast.error('Insufficient permissions to create instance');
        } else {
          toast.error(`Failed to create instance: ${error.message}`);
        }
        throw error;
      }

      console.log('✅ Instance created successfully');
      toast.success('WhatsApp instance created successfully!');
      
      // Create default connection settings
      await this.createDefaultSettings(params.instanceId);
      
      return data;
    } catch (error: any) {
      console.error('❌ Error creating instance:', error);
      throw error;
    }
  }

  async getInstances(): Promise<WhatsAppInstance[]> {
    try {
      console.log('🔍 Fetching WhatsApp instances...');
      
      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching instances:', error);
        
        if (error.code === '42501') {
          toast.error('Insufficient permissions to view instances');
        } else if (error.code === '42P01') {
          toast.error('WhatsApp instances table not found. Please ensure the migration has been applied.');
        } else {
          toast.error(`Failed to fetch instances: ${error.message}`);
        }
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} instances`);
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching instances:', error);
      throw error;
    }
  }

  async getInstance(instanceId: string): Promise<WhatsAppInstance | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('*')
        .eq('instance_id', instanceId)
        .single();

      if (error) {
        console.error('❌ Error fetching instance:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error fetching instance:', error);
      return null;
    }
  }

  async updateInstance(instanceId: string, updates: Partial<WhatsAppInstance>): Promise<WhatsAppInstance | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update(updates)
        .eq('instance_id', instanceId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating instance:', error);
        toast.error(`Failed to update instance: ${error.message}`);
        throw error;
      }

      console.log('✅ Instance updated successfully');
      toast.success('Instance updated successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Error updating instance:', error);
      throw error;
    }
  }

  async deleteInstance(instanceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .delete()
        .eq('instance_id', instanceId);

      if (error) {
        console.error('❌ Error deleting instance:', error);
        toast.error(`Failed to delete instance: ${error.message}`);
        throw error;
      }

      console.log('✅ Instance deleted successfully');
      toast.success('Instance deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting instance:', error);
      throw error;
    }
  }

  // Connection Settings Management
  async createDefaultSettings(instanceId: string): Promise<ConnectionSettings> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const defaultSettings: Omit<ConnectionSettings, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        instance_id: instanceId,
        mark_incoming_messages_readed: 'no',
        mark_incoming_messages_readed_on_reply: 'no',
        delay_send_messages_milliseconds: 1000,
        incoming_webhook: 'yes',
        outgoing_webhook: 'yes',
        outgoing_message_webhook: 'yes',
        outgoing_api_message_webhook: 'yes',
        state_webhook: 'yes',
        device_webhook: 'yes',
        incoming_call_webhook: 'no',
        poll_message_webhook: 'no',
        edited_message_webhook: 'no',
        deleted_message_webhook: 'no',
        incoming_block_webhook: 'no',
        keep_online_status: 'no'
      };

      const { data, error } = await supabase
        .from('whatsapp_connection_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating default settings:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error creating default settings:', error);
      throw error;
    }
  }

  async getSettings(instanceId: string): Promise<ConnectionSettings | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connection_settings')
        .select('*')
        .eq('instance_id', instanceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default
          return await this.createDefaultSettings(instanceId);
        }
        console.error('❌ Error fetching settings:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error fetching settings:', error);
      return null;
    }
  }

  async updateSettings(instanceId: string, settings: Partial<ConnectionSettings>): Promise<ConnectionSettings | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connection_settings')
        .update(settings)
        .eq('instance_id', instanceId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating settings:', error);
        toast.error(`Failed to update settings: ${error.message}`);
        throw error;
      }

      console.log('✅ Settings updated successfully');
      toast.success('Settings updated successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  }

  // QR Code Management
  async getQRCode(instanceId: string): Promise<string | null> {
    try {
      console.log(`🔍 Getting QR code for instance: ${instanceId}`);
      
      const instance = await this.getInstance(instanceId);
      if (!instance) {
        toast.error('Instance not found');
        return null;
      }

      // Make API call to Green API to get QR code
      const response = await fetch(
        `${instance.green_api_host}/waInstance${instanceId}/qr/${instance.api_token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.qrCode) {
        // Store QR code in database
        await this.storeQRCode(instanceId, result.qrCode);
        return result.qrCode;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error getting QR code:', error);
      toast.error(`Failed to get QR code: ${error.message}`);
      return null;
    }
  }

  async storeQRCode(instanceId: string, qrCodeBase64: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Deactivate old QR codes for this instance
      await supabase
        .from('whatsapp_qr_codes')
        .update({ is_active: false })
        .eq('instance_id', instanceId);

      // Insert new QR code
      const { error } = await supabase
        .from('whatsapp_qr_codes')
        .insert({
          user_id: user.id,
          instance_id: instanceId,
          qr_code_base64: qrCodeBase64,
          is_active: true,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
          scan_attempts: 0,
          max_scan_attempts: 5
        });

      if (error) {
        console.error('❌ Error storing QR code:', error);
      }
    } catch (error: any) {
      console.error('❌ Error storing QR code:', error);
    }
  }

  // Instance State Management
  async getInstanceState(instanceId: string): Promise<string | null> {
    try {
      const instance = await this.getInstance(instanceId);
      if (!instance) {
        return null;
      }

      const response = await fetch(
        `${instance.green_api_host}/waInstance${instanceId}/getStateInstance/${instance.api_token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.stateInstance) {
        // Update instance state in database
        await this.updateInstance(instanceId, {
          state_instance: result.stateInstance,
          status: result.stateInstance === 'authorized' ? 'connected' : 'disconnected',
          last_activity_at: new Date().toISOString()
        });
        
        return result.stateInstance;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error getting instance state:', error);
      return null;
    }
  }

  async checkInstanceHealth(instanceId: string): Promise<boolean> {
    try {
      const state = await this.getInstanceState(instanceId);
      return state === 'authorized';
    } catch (error: any) {
      console.error('❌ Error checking instance health:', error);
      return false;
    }
  }

  // Utility Methods
  async refreshAllInstances(): Promise<void> {
    try {
      const instances = await this.getInstances();
      
      const healthCheckPromises = instances.map(async (instance) => {
        try {
          const isHealthy = await this.checkInstanceHealth(instance.instance_id);
          const newStatus = isHealthy ? 'connected' : 'disconnected';
          
          if (instance.status !== newStatus) {
            await this.updateInstance(instance.instance_id, {
              status: newStatus,
              last_activity_at: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error checking health for instance ${instance.instance_id}:`, error);
        }
      });

      await Promise.all(healthCheckPromises);
      console.log('✅ All instances refreshed');
    } catch (error: any) {
      console.error('❌ Error refreshing instances:', error);
    }
  }
}

export default new WhatsAppConnectionService();