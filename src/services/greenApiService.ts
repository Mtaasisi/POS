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

export interface GreenApiInstance {
  id: string;
  instance_id: string;
  api_token: string;
  phone_number: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  qr_code?: string;
  created_at: string;
  updated_at: string;
  // Optional fields for Green API specific data
  green_api_instance_id?: string;
  green_api_token?: string;
  green_api_host?: string;
  webhook_url?: string;
  webhook_secret?: string;
  is_green_api?: boolean;
  last_connection_check?: string;
  connection_error?: string;
}

export interface GreenApiMessage {
  id: string;
  instance_id: string;
  chat_id: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'poll';
  content: string;
  metadata?: any;
  priority: number;
  status: 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'rate_limited';
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  green_api_message_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GreenApiMessageTemplate {
  id: string;
  name: string;
  category: string;
  template_text: string;
  variables: any[];
  is_active: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface GreenApiBulkCampaign {
  id: string;
  name: string;
  description?: string;
  instance_id: string;
  template_id?: string;
  target_audience: any[];
  message_content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SendMessageParams {
  instanceId: string;
  chatId: string;
  message: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'poll';
  metadata?: any;
  priority?: number;
  scheduledAt?: string;
}

export interface CreateInstanceParams {
  instanceId: string;
  apiToken: string;
  phoneNumber: string;
  host?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

class GreenApiService {
  private baseUrl = 'https://api.green-api.com';
  private proxyUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:8888' 
    : 'https://inauzwa.store';

  // Instance Management
  async createInstance(params: CreateInstanceParams): Promise<GreenApiInstance> {
    try {
      const supabase = ensureSupabase();

      console.log('🔧 Creating new WhatsApp instance...');
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .insert({
            instance_id: params.instanceId,
            api_token: params.apiToken,
            phone_number: params.phoneNumber,
            status: 'disconnected',
            // Store Green API specific data as optional fields
            green_api_instance_id: params.instanceId,
            green_api_token: params.apiToken,
            green_api_host: params.host || this.baseUrl,
            webhook_url: params.webhookUrl,
            webhook_secret: params.webhookSecret,
            is_green_api: true
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase error creating instance:', error);
          throw error;
        }
        
        console.log('✅ Successfully created WhatsApp instance');
        return data;
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error creating Green API instance:', error);
      
      // Show user-friendly error message
      if (error.message?.includes('duplicate key')) {
        toast.error('An instance with this ID already exists.');
      } else if (error.message?.includes('ERR_CONNECTION_CLOSED')) {
        toast.error('Network connection issue. Please check your internet connection and try again.');
      } else {
        toast.error(`Failed to create instance: ${error.message}`);
      }
      
      throw new Error(`Failed to create instance: ${error.message}`);
    }
  }

  async getInstances(): Promise<GreenApiInstance[]> {
    try {
      const supabase = ensureSupabase();
      console.log('🔍 Fetching WhatsApp instances...');
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Supabase error fetching instances:', error);
          throw error;
        }
        
        console.log(`✅ Successfully fetched ${data?.length || 0} WhatsApp instances`);
        
        // Log instance details for debugging
        if (data && data.length > 0) {
          console.log('📋 Available instances:');
          data.forEach((instance, index) => {
            console.log(`  ${index + 1}. ID: ${instance.instance_id}, Phone: ${instance.phone_number}, Status: ${instance.status}`);
          });
        } else {
          console.log('⚠️ No WhatsApp instances found in database');
        }
        
        return data || [];
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error fetching Green API instances:', error);
      
      // Show user-friendly error message
      if (error.message?.includes('406')) {
        console.error('❌ 406 Not Acceptable error - this may be due to RLS policy issues');
        toast.error('Database access issue. Please contact support.');
      } else if (error.message?.includes('ERR_CONNECTION_CLOSED')) {
        toast.error('Network connection issue. Please check your internet connection and try again.');
      } else if (error.message?.includes('Failed to fetch')) {
        toast.error('Unable to connect to the server. Please try again later.');
      } else {
        toast.error(`Failed to fetch WhatsApp instances: ${error.message}`);
      }
      
      throw new Error(`Failed to fetch instances: ${error.message}`);
    }
  }

  async getInstance(instanceId: string): Promise<GreenApiInstance | null> {
    try {
      const supabase = ensureSupabase();

      console.log(`🔍 Fetching WhatsApp instance: ${instanceId}`);

      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('instance_id', instanceId)
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors if no record found

        if (error) {
          console.error('❌ Supabase error fetching instance:', error);
          throw error;
        }
        
        if (data) {
          console.log(`✅ Successfully fetched WhatsApp instance: ${instanceId}`);
        } else {
          console.log(`⚠️ No WhatsApp instance found with ID: ${instanceId}`);
        }
        
        return data;
      }, 3, 1000);

      return result;
    } catch (error: any) {
      console.error('❌ Error fetching Green API instance:', error);
      
      // Show user-friendly error message
      if (error.message?.includes('406')) {
        console.error('❌ 406 Not Acceptable error - this may be due to RLS policy issues');
        toast.error('Database access issue. Please contact support.');
      } else if (error.message?.includes('ERR_CONNECTION_CLOSED')) {
        toast.error('Network connection issue. Please check your internet connection and try again.');
      } else {
        toast.error(`Failed to fetch WhatsApp instance: ${error.message}`);
      }
      
      return null;
    }
  }

  async updateInstanceStatus(instanceId: string, status: string, error?: string): Promise<void> {
    try {
      const supabase = ensureSupabase();

      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          status,
          connection_error: error,
          last_connection_check: new Date().toISOString()
        })
        .eq('instance_id', instanceId);

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Error updating instance status:', error);
    }
  }

  async checkInstanceConnection(instanceId: string): Promise<boolean> {
    try {
      const instance = await this.getInstance(instanceId);
      if (!instance) return false;

      console.log(`🔍 Checking connection for instance: ${instanceId}`);

      // Try multiple connection methods with fallbacks
      const connectionMethods = [
        {
          name: 'Netlify Function Proxy',
          handler: async () => {
            const apiBaseUrl = instance.green_api_host || 'https://api.green-api.com';
            const res = await fetch(`${this.proxyUrl}/.netlify/functions/green-api-proxy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                path: `/waInstance${instanceId}/getStateInstance`,
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${instance.api_token}`
                },
                baseUrl: apiBaseUrl
              })
            });
            return res;
          }
        },
        {
          name: 'Direct Green API',
          handler: async () => {
            const apiBaseUrl = instance.green_api_host || this.baseUrl;
            const res = await fetch(`${apiBaseUrl}/waInstance${instanceId}/getStateInstance/${instance.api_token}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            return res;
          }
        },
        {
          name: 'Local Development Proxy',
          handler: async () => {
            const apiBaseUrl = instance.green_api_host || 'https://api.green-api.com';
            const res = await fetch('/api/green-api-proxy.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                path: `/waInstance${instanceId}/getStateInstance`,
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${instance.api_token}`
                },
                baseUrl: apiBaseUrl
              })
            });
            return res;
          }
        }
      ];

      let lastError: Error | null = null;

      for (const method of connectionMethods) {
        try {
          console.log(`🔄 Trying ${method.name}...`);
          
          const response = await retryWithBackoff(async () => {
            const res = await method.handler();
            
            if (!res.ok) {
              const errorText = await res.text();
              console.error(`❌ ${method.name} error (${res.status}):`, errorText);
              
              // Provide specific guidance for different error codes
              if (res.status === 403) {
                throw new Error(`403 Forbidden - Green API credentials issue. Please check your API token and instance ID. Instance: ${instanceId}`);
              } else if (res.status === 404) {
                throw new Error(`404 Not Found - Instance ${instanceId} does not exist in your Green API account`);
              } else if (res.status === 401) {
                throw new Error(`401 Unauthorized - Invalid API token for instance ${instanceId}`);
              } else {
                throw new Error(`${method.name} failed: ${res.status} - ${errorText}`);
              }
            }

            return res;
          }, 2, 1000);

          if (response.ok) {
            let data;
            if (method.name === 'Alternative Proxy') {
              const result = await response.json();
              data = result.data;
            } else {
              data = await response.json();
            }
            
            const isConnected = data.stateInstance === 'authorized';
            console.log(`✅ ${method.name} successful - Connection status for ${instanceId}: ${data.stateInstance}`);
            await this.updateInstanceStatus(instanceId, isConnected ? 'connected' : 'disconnected');
            return isConnected;
          }
        } catch (error: any) {
          console.error(`❌ ${method.name} failed:`, error.message);
          lastError = error;
          continue; // Try next method
        }
      }

      // All methods failed
      console.error('❌ All connection methods failed');
      await this.updateInstanceStatus(instanceId, 'error', lastError?.message || 'All connection methods failed');
      return false;
    } catch (error: any) {
      console.error('❌ Error checking instance connection:', error);
      await this.updateInstanceStatus(instanceId, 'error', error.message);
      return false;
    }
  }

  async getQRCode(instanceId: string): Promise<string | null> {
    try {
      const instance = await this.getInstance(instanceId);
      if (!instance) return null;

      const response = await fetch(`${this.proxyUrl}/waInstance${instanceId}/qr`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${instance.api_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.qr || null;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      return null;
    }
  }

  // Message Sending
  async sendMessage(params: SendMessageParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      // Add message to queue
      const supabase = ensureSupabase();
      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: params.messageType || 'text',
          content: params.message,
          metadata: params.metadata || {},
          priority: params.priority || 0,
          scheduled_at: params.scheduledAt || new Date().toISOString()
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Send message immediately if not scheduled
      if (!params.scheduledAt) {
        await this.processMessageQueue();
      }

      return queueData;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  private isProcessingQueue = false;

  async processMessageQueue(): Promise<void> {
    // Prevent concurrent queue processing
    if (this.isProcessingQueue) {
      console.log('⚠️ Queue processing already in progress, skipping...');
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      const supabase = ensureSupabase();
      // Get pending messages
      const { data: pendingMessages, error } = await supabase
        .from('green_api_message_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      console.log(`📋 Processing ${pendingMessages?.length || 0} pending messages...`);

      for (const message of pendingMessages || []) {
        await this.sendQueuedMessage(message);
        // Add a small delay between messages to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      console.error('Error processing message queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendQueuedMessage(message: GreenApiMessage): Promise<void> {
    try {
      // Check if message is already in a terminal state
      if (message.status === 'sending' || message.status === 'sent' || message.status === 'failed') {
        console.log(`⚠️ Message ${message.id} is already in state '${message.status}', skipping...`);
        return;
      }

      const instance = await this.getInstance(message.instance_id);
      if (!instance) {
        await this.updateMessageStatus(message.id, 'failed', 'Instance not found');
        return;
      }

      // Check if instance is connected
      if (instance.status !== 'connected') {
        await this.updateMessageStatus(message.id, 'failed', `Instance is not connected. Status: ${instance.status}`);
        return;
      }

      // Update status to sending
      await this.updateMessageStatus(message.id, 'sending');

      console.log(`📤 Sending message via proxy: ${this.proxyUrl}/.netlify/functions/green-api-proxy`);

      // Send via Green API proxy with retry mechanism
      const response = await retryWithBackoff(async () => {
        console.log(`🔄 Attempting to send message ${message.id} via proxy...`);
        
        console.log(`🔑 Using API token: ${instance.api_token ? 'Present' : 'Missing'}`);
        console.log(`📱 Instance ID: ${message.instance_id}`);
        console.log(`💬 Chat ID: ${message.chat_id}`);
        
        // Try different endpoint formats
        const endpointFormats = [
          {
            name: 'With Authorization Header',
            path: `/waInstance${message.instance_id}/sendMessage`,
            headers: {
              'Authorization': `Bearer ${instance.api_token}`
            }
          },
          {
            name: 'With API Token in URL',
            path: `/waInstance${message.instance_id}/sendMessage/${instance.api_token}`,
            headers: {}
          }
        ];

        // Use the instance's custom API URL if available
        const apiBaseUrl = instance.green_api_host || 'https://api.green-api.com';
        console.log(`🌐 Using API base URL: ${apiBaseUrl}`);

        let lastError: Error | null = null;

        for (const format of endpointFormats) {
          try {
            console.log(`🔄 Trying endpoint format: ${format.name}`);
            
            const res = await fetch(`${this.proxyUrl}/.netlify/functions/green-api-proxy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                path: format.path,
                method: 'POST',
                headers: format.headers,
                baseUrl: apiBaseUrl,
                body: {
                  chatId: message.chat_id.includes('@c.us') ? message.chat_id : `${message.chat_id}@c.us`,
                  message: message.content
                }
              })
            });

            console.log(`📡 Proxy response status for ${format.name}: ${res.status}`);
            
            if (!res.ok) {
              const errorText = await res.text();
              console.error(`❌ ${format.name} error (${res.status}):`, errorText);
              throw new Error(`Proxy error: ${res.status} - ${errorText}`);
            }

            const proxyResponse = await res.json();
            console.log(`📡 Proxy response for ${format.name}:`, proxyResponse);

            if (proxyResponse.success && proxyResponse.status === 200) {
              console.log(`✅ ${format.name} successful:`, proxyResponse.data);
              await this.updateMessageStatus(message.id, 'sent', undefined, proxyResponse.data?.idMessage);
              return; // Success, exit the loop
            } else {
              console.error(`❌ ${format.name} failed:`, proxyResponse);
              lastError = new Error(`API Error: ${proxyResponse.status} - ${JSON.stringify(proxyResponse.data)}`);
              continue; // Try next format
            }
          } catch (error: any) {
            console.error(`❌ ${format.name} error:`, error.message);
            lastError = error;
            continue; // Try next format
          }
        }

        // All formats failed
        if (lastError) {
          throw lastError;
        }

        // If we get here, all formats failed
        throw new Error('All endpoint formats failed');
      }, 3, 1000);
    } catch (error: any) {
      console.error('❌ Error sending queued message:', error);
      await this.updateMessageStatus(message.id, 'failed', error.message);
    }
  }

  private async updateMessageStatus(messageId: string, status: string, error?: string, greenApiMessageId?: string): Promise<void> {
    try {
      const supabase = ensureSupabase();
      const updateData: any = {
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : undefined
      };

      if (error) {
        updateData.error_message = error;
      }

      if (greenApiMessageId) {
        updateData.green_api_message_id = greenApiMessageId;
      }

      const { error: updateError } = await supabase
        .from('green_api_message_queue')
        .update(updateData)
        .eq('id', messageId);

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Error updating message status:', error);
    }
  }

  // Test Green API connection
  async testConnection(instanceId: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const instance = await this.getInstance(instanceId);
      if (!instance) {
        return { success: false, error: 'Instance not found' };
      }

      console.log(`🧪 Testing connection for instance: ${instanceId}`);

      // Use the instance's custom API URL if available
      const apiBaseUrl = instance.green_api_host || 'https://api.green-api.com';
      console.log(`🧪 Using API base URL: ${apiBaseUrl}`);

      // Test with a simple getStateInstance call
      const response = await fetch(`${this.proxyUrl}/.netlify/functions/green-api-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: `/waInstance${instanceId}/getStateInstance`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${instance.api_token}`
          },
          baseUrl: apiBaseUrl
        })
      });

      const proxyResponse = await response.json();
      console.log('🧪 Test connection response:', proxyResponse);

      if (proxyResponse.success && proxyResponse.status === 200) {
        return { success: true, data: proxyResponse.data };
      } else {
        return { success: false, error: `API Error: ${proxyResponse.status} - ${JSON.stringify(proxyResponse.data)}` };
      }
    } catch (error: any) {
      console.error('🧪 Test connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Message Templates
  async getMessageTemplates(): Promise<GreenApiMessageTemplate[]> {
    try {
      const supabase = ensureSupabase();
      const { data, error } = await supabase
        .from('green_api_message_templates')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching message templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
  }

  async createMessageTemplate(template: Omit<GreenApiMessageTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<GreenApiMessageTemplate> {
    try {
      const supabase = ensureSupabase();
      const { data, error } = await supabase
        .from('green_api_message_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating message template:', error);
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  async renderTemplate(template: GreenApiMessageTemplate, variables: Record<string, any>): Promise<string> {
    let renderedText = template.template_text;

    for (const variable of template.variables) {
      const value = variables[variable.name];
      if (value !== undefined) {
        renderedText = renderedText.replace(new RegExp(`{{${variable.name}}}`, 'g'), String(value));
      }
    }

    return renderedText;
  }

  // Bulk Messaging
  async createBulkCampaign(campaign: Omit<GreenApiBulkCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<GreenApiBulkCampaign> {
    try {
      const supabase = ensureSupabase();
      const { data, error } = await supabase
        .from('green_api_bulk_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating bulk campaign:', error);
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  async getBulkCampaigns(): Promise<GreenApiBulkCampaign[]> {
    try {
      const supabase = ensureSupabase();
      const { data, error } = await supabase
        .from('green_api_bulk_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching bulk campaigns:', error);
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }
  }

  async startBulkCampaign(campaignId: string): Promise<void> {
    try {
      const campaign = await this.getBulkCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update campaign status
      const supabase = ensureSupabase();
      await supabase
        .from('green_api_bulk_campaigns')
        .update({
          status: 'sending',
          started_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      // Process campaign in background
      this.processBulkCampaign(campaign);
    } catch (error: any) {
      console.error('Error starting bulk campaign:', error);
      throw new Error(`Failed to start campaign: ${error.message}`);
    }
  }

  private async processBulkCampaign(campaign: GreenApiBulkCampaign): Promise<void> {
    try {
      const recipients = campaign.target_audience;
      let sentCount = 0;
      const deliveredCount = 0;
      let failedCount = 0;

      for (const recipient of recipients) {
        try {
          // Send message to recipient
          await this.sendMessage({
            instanceId: campaign.instance_id,
            chatId: recipient.phone,
            message: campaign.message_content,
            metadata: { campaign_id: campaign.id, recipient }
          });

          sentCount++;

          // Add to campaign results
          const supabase = ensureSupabase();
          await supabase
            .from('green_api_bulk_campaign_results')
            .insert({
              campaign_id: campaign.id,
              recipient_phone: recipient.phone,
              recipient_name: recipient.name,
              status: 'sent',
              sent_at: new Date().toISOString()
            });

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error: any) {
          failedCount++;
          console.error(`Error sending to ${recipient.phone}:`, error);

          // Add failed result
          const supabase = ensureSupabase();
          await supabase
            .from('green_api_bulk_campaign_results')
            .insert({
              campaign_id: campaign.id,
              recipient_phone: recipient.phone,
              recipient_name: recipient.name,
              status: 'failed',
              error_message: error.message
            });
        }
      }

      // Update campaign completion
      const supabase = ensureSupabase();
      await supabase
        .from('green_api_bulk_campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          sent_count: sentCount,
          delivered_count: deliveredCount,
          failed_count: failedCount
        })
        .eq('id', campaign.id);

    } catch (error: any) {
      console.error('Error processing bulk campaign:', error);
      
      // Update campaign status to failed
      const supabase = ensureSupabase();
      await supabase
        .from('green_api_bulk_campaigns')
        .update({
          status: 'failed'
        })
        .eq('id', campaign.id);
    }
  }

  private async getBulkCampaign(campaignId: string): Promise<GreenApiBulkCampaign | null> {
    try {
      const supabase = ensureSupabase();
      const { data, error } = await supabase
        .from('green_api_bulk_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching bulk campaign:', error);
      return null;
    }
  }

  // Webhook Handling
  async handleWebhook(instanceId: string, eventType: string, eventData: any): Promise<void> {
    try {
      const supabase = ensureSupabase();
      // Store webhook event
      await supabase
        .from('green_api_webhook_events')
        .insert({
          instance_id: instanceId,
          event_type: eventType,
          event_data: eventData
        });

      // Process based on event type
      switch (eventType) {
        case 'incomingMessageReceived':
          await this.handleIncomingMessage(instanceId, eventData);
          break;
        case 'outgoingMessageReceived':
          await this.handleOutgoingMessageReceived(instanceId, eventData);
          break;
        case 'outgoingAPIMessageReceived':
          await this.handleOutgoingAPIMessageReceived(instanceId, eventData);
          break;
        case 'outgoingMessageStatus':
          await this.handleOutgoingMessageStatus(instanceId, eventData);
          break;
        case 'stateInstanceChanged':
          await this.handleStateInstanceChanged(instanceId, eventData);
          break;
      }
    } catch (error: any) {
      console.error('Error handling webhook:', error);
    }
  }

  private async handleIncomingMessage(instanceId: string, eventData: any): Promise<void> {
    try {
      const supabase = ensureSupabase();
      // Store incoming message
      await supabase
        .from('whatsapp_messages')
        .insert({
          instance_id: instanceId,
          chat_id: eventData.body.senderData.chatId,
          type: 'text',
          content: eventData.body.messageData.textMessageData?.textMessage || '',
          direction: 'incoming',
          status: 'received',
          metadata: eventData
        });
    } catch (error: any) {
      console.error('Error handling incoming message:', error);
    }
  }

  private async handleOutgoingMessageReceived(instanceId: string, eventData: any): Promise<void> {
    try {
      const supabase = ensureSupabase();
      // Update message status to sent
      if (eventData.body.idMessage) {
        await supabase
          .from('green_api_message_queue')
          .update({
            status: 'sent',
            green_api_message_id: eventData.body.idMessage,
            sent_at: new Date().toISOString()
          })
          .eq('green_api_message_id', eventData.body.idMessage);
      }
    } catch (error: any) {
      console.error('Error handling outgoing message received:', error);
    }
  }

  private async handleOutgoingAPIMessageReceived(instanceId: string, eventData: any): Promise<void> {
    // Similar to handleOutgoingMessageReceived
    await this.handleOutgoingMessageReceived(instanceId, eventData);
  }

  private async handleOutgoingMessageStatus(instanceId: string, eventData: any): Promise<void> {
    try {
      const status = eventData.body.status;
      let queueStatus = 'sent';

      switch (status) {
        case 'delivered':
          queueStatus = 'delivered';
          break;
        case 'read':
          queueStatus = 'read';
          break;
        case 'failed':
          queueStatus = 'failed';
          break;
      }

      // Update message status
      if (eventData.body.idMessage) {
        const supabase = ensureSupabase();
        const updateData: any = {
          status: queueStatus
        };

        if (status === 'delivered') {
          updateData.delivered_at = new Date().toISOString();
        } else if (status === 'read') {
          updateData.read_at = new Date().toISOString();
        }

        await supabase
          .from('green_api_message_queue')
          .update(updateData)
          .eq('green_api_message_id', eventData.body.idMessage);
      }
    } catch (error: any) {
      console.error('Error handling outgoing message status:', error);
    }
  }

  private async handleStateInstanceChanged(instanceId: string, eventData: any): Promise<void> {
    try {
      const state = eventData.body.stateInstance;
      let status = 'disconnected';

      switch (state) {
        case 'authorized':
          status = 'connected';
          break;
        case 'notAuthorized':
          status = 'disconnected';
          break;
        case 'blocked':
          status = 'error';
          break;
      }

      await this.updateInstanceStatus(instanceId, status);
    } catch (error: any) {
      console.error('Error handling state instance changed:', error);
    }
  }

  // Utility Methods
  async diagnoseRLSIssues(): Promise<any> {
    try {
      const supabase = ensureSupabase();
      console.log('🔍 Diagnosing RLS issues...');
      
      // Test basic table access
      const { data: countData, error: countError } = await supabase
        .from('whatsapp_instances')
        .select('id', { count: 'exact', head: true });
      
      // Test specific instance query
      const { data: instanceData, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .limit(1);
      
      const diagnosis: {
        timestamp: string;
        countQuery: { success: boolean; error?: string; count: number };
        instanceQuery: { success: boolean; error?: string; hasData: boolean };
        recommendations: string[];
      } = {
        timestamp: new Date().toISOString(),
        countQuery: {
          success: !countError,
          error: countError?.message,
          count: countData?.length || 0
        },
        instanceQuery: {
          success: !instanceError,
          error: instanceError?.message,
          hasData: Boolean(instanceData && instanceData.length > 0)
        },
        recommendations: []
      };
      
      if (countError) {
        diagnosis.recommendations.push('Run the RLS fix script in Supabase SQL Editor');
      }
      
      if (instanceError) {
        diagnosis.recommendations.push('Check table structure and RLS policies');
      }
      
      console.log('✅ RLS diagnosis completed:', diagnosis);
      return diagnosis;
    } catch (error: any) {
      console.error('❌ Error diagnosing RLS issues:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        recommendations: ['Run the RLS fix script in Supabase SQL Editor']
      };
    }
  }

  async diagnoseConnectionIssues(): Promise<any> {
    try {
      console.log('🔍 Diagnosing connection issues...');
      
      const diagnosis: {
        timestamp: string;
        proxyTest: { success: boolean; error?: string; response?: any };
        directTest: { success: boolean; error?: string; response?: any };
        phpProxyTest: { success: boolean; error?: string; response?: any };
        netlifyTest: { success: boolean; error?: string; response?: any };
        recommendations: string[];
      } = {
        timestamp: new Date().toISOString(),
        proxyTest: { success: false },
        directTest: { success: false },
        phpProxyTest: { success: false },
        netlifyTest: { success: false },
        recommendations: []
      };

      // Test proxy connection
      try {
        console.log('🔄 Testing proxy connection...');
        const proxyResponse = await fetch('https://inauzwa.store/api/green-api-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '/test',
            method: 'GET'
          })
        });
        
        diagnosis.proxyTest.success = proxyResponse.ok;
        if (!proxyResponse.ok) {
          diagnosis.proxyTest.error = `HTTP ${proxyResponse.status}: ${proxyResponse.statusText}`;
        } else {
          diagnosis.proxyTest.response = await proxyResponse.json();
        }
      } catch (error: any) {
        diagnosis.proxyTest.error = error.message;
      }

      // Test PHP proxy connection
      try {
        console.log('🔄 Testing PHP proxy connection...');
        const phpProxyResponse = await fetch('/api/green-api-proxy.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '/test',
            method: 'GET'
          })
        });
        
        diagnosis.phpProxyTest.success = phpProxyResponse.ok;
        if (!phpProxyResponse.ok) {
          diagnosis.phpProxyTest.error = `HTTP ${phpProxyResponse.status}: ${phpProxyResponse.statusText}`;
        } else {
          diagnosis.phpProxyTest.response = await phpProxyResponse.json();
        }
      } catch (error: any) {
        diagnosis.phpProxyTest.error = error.message;
      }

      // Test Netlify function
      try {
        console.log('🔄 Testing Netlify function...');
        const netlifyResponse = await fetch('/.netlify/functions/green-api-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '/test',
            method: 'GET'
          })
        });
        
        diagnosis.netlifyTest.success = netlifyResponse.ok;
        if (!netlifyResponse.ok) {
          diagnosis.netlifyTest.error = `HTTP ${netlifyResponse.status}: ${netlifyResponse.statusText}`;
        } else {
          diagnosis.netlifyTest.response = await netlifyResponse.json();
        }
      } catch (error: any) {
        diagnosis.netlifyTest.error = error.message;
      }

      // Test direct Green API connection
      try {
        console.log('🔄 Testing direct Green API connection...');
        const directResponse = await fetch('https://api.green-api.com/test', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        diagnosis.directTest.success = directResponse.ok;
        if (!directResponse.ok) {
          diagnosis.directTest.error = `HTTP ${directResponse.status}: ${directResponse.statusText}`;
        } else {
          diagnosis.directTest.response = await directResponse.json();
        }
      } catch (error: any) {
        diagnosis.directTest.error = error.message;
      }

      // Generate recommendations
      if (!diagnosis.proxyTest.success) {
        diagnosis.recommendations.push('Green API proxy is not available. Check Netlify function deployment.');
      }
      
      if (!diagnosis.phpProxyTest.success) {
        diagnosis.recommendations.push('PHP proxy is not available. Check if the PHP file exists and is accessible.');
      }
      
      if (!diagnosis.netlifyTest.success) {
        diagnosis.recommendations.push('Netlify function is not available. Check Netlify deployment and function configuration.');
      }
      
      if (!diagnosis.directTest.success) {
        diagnosis.recommendations.push('Direct Green API connection failed. Check internet connection.');
      }
      
      if (diagnosis.proxyTest.success && !diagnosis.directTest.success) {
        diagnosis.recommendations.push('Proxy works but direct connection fails. This is expected.');
      }
      
      if (!diagnosis.proxyTest.success && diagnosis.directTest.success) {
        diagnosis.recommendations.push('Direct connection works but proxy fails. Use direct connection as fallback.');
      }

      // Check if any method works
      const anyMethodWorks = diagnosis.proxyTest.success || diagnosis.phpProxyTest.success || 
                            diagnosis.netlifyTest.success || diagnosis.directTest.success;
      
      if (!anyMethodWorks) {
        diagnosis.recommendations.push('No connection methods are working. Check network connectivity and server status.');
      }

      console.log('✅ Connection diagnosis completed:', diagnosis);
      return diagnosis;
    } catch (error: any) {
      console.error('❌ Error diagnosing connection issues:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        recommendations: ['Check network connection and proxy deployment']
      };
    }
  }

  async createTestInstance(): Promise<GreenApiInstance | null> {
    try {
      const supabase = ensureSupabase();
      console.log('🔧 Creating test WhatsApp instance...');
      
      const testInstance = {
        instance_id: 'aa8e52c6-b7b3-4eac-b9ab-a4ada6044664',
        api_token: 'test-api-token-12345',
        phone_number: '+255123456789',
        status: 'disconnected' as const,
        green_api_instance_id: 'aa8e52c6-b7b3-4eac-b9ab-a4ada6044664',
        green_api_token: 'test-api-token-12345',
        green_api_host: 'https://api.green-api.com',
        is_green_api: true
      };
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert(testInstance)
        .select()
        .single();
      
      if (error) {
        if (error.message?.includes('duplicate key')) {
          console.log('⚠️ Test instance already exists');
          return await this.getInstance(testInstance.instance_id);
        }
        throw error;
      }
      
      console.log('✅ Test WhatsApp instance created successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Error creating test instance:', error);
      toast.error(`Failed to create test instance: ${error.message}`);
      return null;
    }
  }

  async getMessageHistory(instanceId: string, chatId?: string, limit: number = 50): Promise<any[]> {
    try {
      const supabase = ensureSupabase();
      let query = supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (chatId) {
        query = query.eq('chat_id', chatId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching message history:', error);
      throw new Error(`Failed to fetch message history: ${error.message}`);
    }
  }

  async getMessageQueueStatus(instanceId?: string): Promise<any> {
    try {
      const supabase = ensureSupabase();
      let query = supabase
        .from('green_api_message_queue')
        .select('status');

      if (instanceId) {
        query = query.eq('instance_id', instanceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Group by status manually
      const statusCounts = (data || []).reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
    } catch (error: any) {
      console.error('Error fetching message queue status:', error);
      throw new Error(`Failed to fetch queue status: ${error.message}`);
    }
  }
}

export const greenApiService = new GreenApiService();
export default greenApiService;
