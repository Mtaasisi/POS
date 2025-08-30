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
  // Legacy fields for backward compatibility
  qr_code?: string;
  green_api_instance_id?: string;
  green_api_token?: string;
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
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'poll' | 'interactive_buttons' | 'forward' | 'file_upload' | 'file_url';
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
  // Enhanced fields for new message types
  quoted_message_id?: string;
  forwarded_from?: string;
  poll_options?: any;
  location_data?: any;
  contact_data?: any;
  interactive_data?: any;
  file_data?: any;
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
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'poll' | 'interactive_buttons' | 'forward';
  metadata?: any;
  priority?: number;
  scheduledAt?: string;
  // Enhanced message options
  quotedMessageId?: string;
  linkPreview?: boolean;
  typingTime?: number;
  customPreview?: {
    title: string;
    description?: string;
    link?: string;
    urlFile?: string;
    jpegThumbnail?: string;
  };
}

// Poll message interface
export interface SendPollParams {
  instanceId: string;
  chatId: string;
  message: string;
  options: Array<{
    optionName: string;
  }>;
  multipleAnswers?: boolean;
}

// Location message interface  
export interface SendLocationParams {
  instanceId: string;
  chatId: string;
  latitude: number;
  longitude: number;
  nameLocation?: string;
  address?: string;
}

// Contact message interface
export interface SendContactParams {
  instanceId: string;
  chatId: string;
  contact: {
    phoneContact: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    company?: string;
    jobTitle?: string;
    email?: string;
    website?: string;
  };
}

// Interactive buttons interface
export interface SendInteractiveButtonsParams {
  instanceId: string;
  chatId: string;
  message: string;
  header?: string;
  footer?: string;
  buttons: Array<{
    type: 'copy' | 'call' | 'url' | 'reply';
    buttonId: string;
    buttonText: string;
    copyCode?: string;
    phoneNumber?: string;
    url?: string;
  }>;
}

// File upload interface
export interface SendFileParams {
  instanceId: string;
  chatId: string;
  file?: File | Blob;
  fileUrl?: string;
  fileName?: string;
  caption?: string;
}

// Forward message interface
export interface ForwardMessageParams {
  instanceId: string;
  chatId: string;
  chatIdFrom: string;
  messages: string[];
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
    ? 'http://localhost:8889/green-api-proxy' 
    : 'https://inauzwa.store/.netlify/functions/green-api-proxy';
  
  // Configuration to disable proxy in development
  private useDirectApiOnly = true; // Always use direct API calls
  
  // Track if we've already logged proxy unavailability to reduce console noise
  private proxyUnavailableLogged = false;

  // Format phone number for WhatsApp chatId
  private formatChatId(phoneOrChatId: string): string {
    if (!phoneOrChatId) {
      console.error('❌ No phone number or chatId provided');
      return '';
    }

    // If already has @c.us, return as is
    if (phoneOrChatId.includes('@c.us')) {
      console.log(`📱 ChatId already formatted: ${phoneOrChatId}`);
      return phoneOrChatId;
    }

    // Remove any non-digit characters except +
    let cleaned = phoneOrChatId.replace(/[^\d+]/g, '');
    
    // Remove + if present (WhatsApp ID doesn't use +)
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    const chatId = `${cleaned}@c.us`;
    console.log(`📱 Formatted chatId: "${phoneOrChatId}" → "${chatId}"`);
    return chatId;
  }

  // Process message directly without queue (for fallback scenarios)
  private async processDirectMessage(message: GreenApiMessage): Promise<void> {
    try {
      const instance = await this.getInstance(message.instance_id);
      if (!instance) {
        throw new Error('Instance not found for direct message processing');
      }

      console.log('🚀 Processing message directly (bypassing queue)...');
      
      // Check if proxy is available before trying to use it
      const isProxyAvailable = await this.checkProxyAvailability();
      
      if (isProxyAvailable) {
        await this.sendQueuedMessage(message);
      } else {
        console.log('🔗 Proxy not available, using direct API call...');
        const result = await this.sendDirectMessage(instance, message);
        console.log('✅ Direct API call successful:', result);
        
        const messageId = result?.idMessage || result?.messageId || result?.id;
        await this.updateMessageStatus(message.id, 'sent', undefined, messageId);
      }
    } catch (error: any) {
      console.error('❌ Error processing direct message:', error);
      throw error;
    }
  }

  // Check if proxy server is available
  private async checkProxyAvailability(): Promise<boolean> {
    // If configured to use direct API only, skip proxy
    if (this.useDirectApiOnly) {
      console.log('🔧 Using direct API only (development mode)');
      return false;
    }
    
    // If we're in development and the proxy URL is localhost, check if it's accessible
    if (this.proxyUrl.includes('localhost')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // Reduced timeout to 1 second
        
        // Try a simple HEAD request to check if the server is responding
        const response = await fetch(this.proxyUrl, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const isAvailable = response.status !== 404; // Any response other than 404 means server is up
        
        if (!isAvailable) {
          console.log('🔍 Local proxy server not responding (status: 404)');
        }
        
        return isAvailable;
      } catch (error) {
        // Only log once per session to reduce noise
        if (!this.proxyUnavailableLogged) {
          console.log('🔍 Local proxy server not available (connection refused) - using direct API calls');
          this.proxyUnavailableLogged = true;
        }
        return false;
      }
    }
    
    // For production, assume proxy is available (it's hosted on Netlify)
    return true;
  }

  // Direct API call fallback method
  private isNumberAllowedInQuotaRestriction(chatId: string): boolean {
    // Known allowed numbers from the quota restriction
    const allowedNumbers = [
      '254700000000@c.us',
      '254712345678@c.us', 
      '255746605561@c.us'
    ];
    
    return allowedNumbers.includes(chatId);
  }

  private parseQuotaError(responseData: any): { message: string; allowedNumbers: string[]; upgradeUrl: string } {
    // Parse Green API quota error response
    const invokeStatus = responseData?.invokeStatus;
    const correspondentsStatus = responseData?.correspondentsStatus;
    
    let description = 'Monthly quota has been exceeded';
    let allowedNumbers: string[] = [];
    
    if (invokeStatus?.description) {
      description = invokeStatus.description;
      // Extract allowed numbers from description
      const numberMatch = description.match(/(\d{12}@c\.us)/g);
      if (numberMatch) {
        allowedNumbers = numberMatch;
      }
    } else if (correspondentsStatus?.description) {
      description = correspondentsStatus.description;
      const numberMatch = description.match(/(\d{12}@c\.us)/g);
      if (numberMatch) {
        allowedNumbers = numberMatch;
      }
    }
    
    return {
      message: description,
      allowedNumbers,
      upgradeUrl: 'https://console.green-api.com'
    };
  }

  private async sendDirectMessage(instance: GreenApiInstance, message: GreenApiMessage): Promise<any> {
    console.log('🔗 Attempting direct API call...');
    
    const apiBaseUrl = instance.green_api_host || this.baseUrl;
    const apiToken = instance.green_api_token || instance.api_token;
    
    if (!apiToken) {
      throw new Error('No API token available for direct call');
    }
    
    // Determine endpoint and payload based on message type
    let endpoint: string;
    let payload: any;
    
    if (message.message_type === 'poll') {
      // Use sendPoll endpoint for polls
      endpoint = `/waInstance${instance.instance_id}/sendPoll/${apiToken}`;
      
      // Extract poll data from metadata
      const pollData = message.metadata?.pollData || {};
      payload = {
        chatId: this.formatChatId(message.chat_id),
        message: message.content,
        options: pollData.options || [],
        multipleAnswers: pollData.multipleAnswers || false
      };
      
      console.log('📊 Sending poll via direct API...');
    } else if (message.message_type === 'interactive_buttons') {
      // Use sendInteractiveButtons endpoint for interactive buttons
      endpoint = `/waInstance${instance.instance_id}/sendInteractiveButtons/${apiToken}`;
      
      // Extract interactive data from metadata
      const interactiveData = message.metadata?.interactiveData || {};
      
      // Create buttons array with proper structure
      const buttons = (interactiveData.buttons || []).map((button: any, index: number) => ({
        type: button.type || 'reply',
        buttonId: button.buttonId || `button_${index + 1}`,
        buttonText: button.buttonText || '',
        ...(button.type === 'copy' && button.copyCode ? { copyCode: button.copyCode } : {}),
        ...(button.type === 'call' && button.phoneNumber ? { phoneNumber: button.phoneNumber } : {}),
        ...(button.type === 'url' && button.url ? { url: button.url } : {})
      }));
      
      payload = {
        chatId: this.formatChatId(message.chat_id),
        body: message.content,
        buttons: buttons
      };
      
      // Add optional header and footer if present
      if (interactiveData.header) {
        payload.header = interactiveData.header;
      }
      if (interactiveData.footer) {
        payload.footer = interactiveData.footer;
      }
      
      console.log('🔘 Sending interactive buttons via direct API...');
      console.log('🔘 Interactive data:', interactiveData);
      console.log('🔘 Buttons array:', buttons);
      console.log('🔘 Final payload:', payload);
    } else if (message.message_type === 'location') {
      // Use sendLocation endpoint for location messages
      endpoint = `/waInstance${instance.instance_id}/sendLocation/${apiToken}`;
      
      // Extract location data from metadata
      const locationData = message.metadata?.locationData || {};
      payload = {
        chatId: this.formatChatId(message.chat_id),
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        nameLocation: locationData.nameLocation,
        address: locationData.address
      };
      
      console.log('📍 Sending location via direct API...');
    } else if (message.message_type === 'contact') {
      // Use sendContact endpoint for contact messages
      endpoint = `/waInstance${instance.instance_id}/sendContact/${apiToken}`;
      
      // Extract contact data from metadata
      const contactData = message.metadata?.contactData || {};
      payload = {
        chatId: this.formatChatId(message.chat_id),
        contact: contactData.contact
      };
      
      console.log('👤 Sending contact via direct API...');
    } else {
      // Use sendMessage endpoint for other message types
      endpoint = `/waInstance${instance.instance_id}/sendMessage/${apiToken}`;
      payload = {
        chatId: this.formatChatId(message.chat_id),
        message: message.content,
        linkPreview: false
      };
    }
    
    const directUrl = `${apiBaseUrl}${endpoint}`;
    console.log('🔗 Direct API URL:', directUrl);
    console.log('📦 Direct API payload:', payload);
    
    const response = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('📡 Direct API response status:', response.status);
    console.log('📡 Direct API response:', responseText);
    console.log('🔍 Response ok status:', response.ok);
    console.log('🔍 Checking if response.status === 466:', response.status === 466);
    
    if (!response.ok) {
      console.error('❌ Response not OK, status:', response.status);
      
      if (response.status === 466) {
        // Handle quota exceeded error specifically
        console.error('🚫 Quota exceeded error detected in direct API call');
        let quotaErrorMessage = 'Monthly quota exceeded. Please upgrade your Green API plan at https://console.green-api.com';
        
        try {
          const responseData = JSON.parse(responseText);
          const quotaInfo = this.parseQuotaError(responseData);
          quotaErrorMessage = `Quota exceeded (466): ${quotaInfo.message}. Allowed numbers: ${quotaInfo.allowedNumbers.join(', ')}. Upgrade at: ${quotaInfo.upgradeUrl}`;
        } catch (parseError) {
          console.warn('Failed to parse quota error response, using default message');
        }
        
        const quotaError = new Error(quotaErrorMessage);
        console.error('🚫 Throwing quota error:', quotaError.message);
        throw quotaError;
      }
      
      const generalError = new Error(`Direct API call failed (${response.status}): ${responseText}`);
      console.error('🚫 Throwing general error:', generalError.message);
      throw generalError;
    }
    
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from direct API call');
    }
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from direct API: ${responseText}`);
    }
  }

  // Instance Management
  async createInstance(params: CreateInstanceParams): Promise<GreenApiInstance> {
    try {
      const supabase = ensureSupabase();

      console.log('🔧 Creating new WhatsApp instance...');
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('whatsapp_instances_comprehensive')
          .insert({
            instance_id: params.instanceId,
            api_token: params.apiToken,
            phone_number: params.phoneNumber,
            status: 'disconnected',
            green_api_host: params.host || this.baseUrl,
            state_instance: 'notAuthorized',
            is_active: true
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
          .from('whatsapp_instances_comprehensive')
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
        // First try to get from whatsapp_instances_comprehensive table
        let { data, error } = await supabase
          .from('whatsapp_instances_comprehensive')
          .select('*')
          .eq('instance_id', instanceId)
          .maybeSingle();

        if (error) {
          console.error('❌ Supabase error fetching instance from whatsapp_instances_comprehensive:', error);
          throw error;
        }
        
        // If not found in whatsapp_instances_comprehensive, try integrations table
        if (!data) {
          console.log(`⚠️ Instance not found in whatsapp_instances_comprehensive, checking integrations table...`);
          
          const { data: integrationData, error: integrationError } = await supabase
            .from('integrations')
            .select('*')
            .eq('type', 'whatsapp')
            .eq('provider', 'green-api')
            .eq('config->instance_id', instanceId)
            .maybeSingle();

          if (integrationError) {
            console.error('❌ Supabase error fetching from integrations:', integrationError);
            throw integrationError;
          }

          if (integrationData) {
            // Convert integration data to GreenApiInstance format
            data = {
              id: integrationData.id,
              instance_id: integrationData.config.instance_id,
              api_token: integrationData.config.api_key,
              green_api_token: integrationData.config.api_key,
              green_api_host: integrationData.config.api_url,
              phone_number: integrationData.config.instance_id,
              status: integrationData.config.status || 'disconnected',
              is_green_api: true,
              created_at: integrationData.created_at,
              updated_at: integrationData.updated_at
            };
            console.log(`✅ Found instance in integrations table: ${instanceId}`);
          } else {
            console.log(`⚠️ No WhatsApp instance found with ID: ${instanceId} in either table`);
          }
        } else {
          console.log(`✅ Successfully fetched WhatsApp instance: ${instanceId}`);
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

      // First try to update whatsapp_instances_comprehensive table
      let { error: updateError } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update({
          status,
          connection_error: error,
          last_connection_check: new Date().toISOString()
        })
        .eq('instance_id', instanceId);

      // If whatsapp_instances_comprehensive update fails, try integrations table
      if (updateError) {
        console.log(`🔄 Updating status in integrations table for instance: ${instanceId}`);
        
        const { data: existingIntegration } = await supabase
          .from('integrations')
          .select('*')
          .eq('type', 'whatsapp')
          .eq('provider', 'green-api')
          .eq('config->instance_id', instanceId)
          .single();

        if (existingIntegration) {
          const updatedConfig = {
            ...existingIntegration.config,
            status: status
          };

          const { error: integrationUpdateError } = await supabase
            .from('integrations')
            .update({
              config: updatedConfig,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingIntegration.id);

          if (integrationUpdateError) {
            console.error('Error updating integration status:', integrationUpdateError);
            throw integrationUpdateError;
          } else {
            console.log(`✅ Updated instance status in integrations table: ${instanceId} -> ${status}`);
          }
        }
      }
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
            const apiBaseUrl = instance.green_api_host || 'https://7105.api.greenapi.com';
            const res = await fetch(this.proxyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                path: `/waInstance${instanceId}/getStateInstance/${instance.api_token}`,
                method: 'GET',
                headers: {},
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
            const apiBaseUrl = instance.green_api_host || 'https://7105.api.greenapi.com';
            const res = await fetch('/api/green-api-proxy.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                path: `/waInstance${instanceId}/getStateInstance/${instance.api_token}`,
                method: 'GET',
                headers: {},
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

      // Temporary bypass of queue due to database issues
      // TODO: Remove this bypass once database issues are resolved
      const BYPASS_QUEUE = true; // Set to false once database is fixed
      
      if (BYPASS_QUEUE) {
        console.log('🚫 Bypassing message queue due to database issues, sending directly...');
        
        const directMessage = {
          id: globalThis.crypto?.randomUUID?.() || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: params.messageType || 'text',
          content: params.message,
          metadata: params.metadata || {},
          priority: params.priority || 0,
          status: 'pending' as const,
          retry_count: 0,
          max_retries: 3,
          scheduled_at: params.scheduledAt || new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as GreenApiMessage;
        
        // Send directly without touching the database
        try {
          await this.processDirectMessage(directMessage);
          console.log('✅ Direct message processing successful');
        } catch (directError: any) {
          console.error('❌ Direct message processing failed:', directError);
          
          // Re-throw the error to prevent success response
          if (directError.message?.includes('466') || directError.message?.includes('Quota exceeded')) {
            throw new Error(`Quota exceeded: You can only message approved numbers. Please upgrade your Green API plan at https://console.green-api.com`);
          }
          throw directError;
        }
        
        // Return success response only if no errors occurred
        return {
          ...directMessage,
          status: 'sent'
        };
      }

      // Add message to queue - with enhanced error handling for foreign key issues
      const supabase = ensureSupabase();
      
      try {
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

        if (queueError) {
          console.error('❌ Detailed Supabase Error:', {
            message: queueError.message,
            details: queueError.details,
            hint: queueError.hint,
            code: queueError.code,
            fullError: queueError
          });
          
          // Log the exact data we tried to insert
          console.error('📝 Insert data that failed:', {
            instance_id: params.instanceId,
            chat_id: params.chatId,
            message_type: params.messageType || 'text',
            content: params.message,
            metadata: params.metadata || {},
            priority: params.priority || 0,
            scheduled_at: params.scheduledAt || new Date().toISOString()
          });
          
          // Always bypass queue on any database error and send directly
          console.warn('⚠️ Database insert failed, proceeding without queue...');
          
          // Bypass queue and send directly - messaging still works!
          try {
            await this.processDirectMessage({
              id: globalThis.crypto?.randomUUID?.() || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              instance_id: params.instanceId,
              chat_id: params.chatId,
              message_type: params.messageType || 'text',
              content: params.message,
              metadata: params.metadata || {},
              priority: params.priority || 0,
              status: 'pending',
              retry_count: 0,
              max_retries: 3,
              scheduled_at: params.scheduledAt || new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as GreenApiMessage);
          } catch (directError: any) {
            console.error('❌ Direct message processing failed in fallback:', directError);
            
            // Re-throw the error to prevent success response
            if (directError.message?.includes('466') || directError.message?.includes('Quota exceeded')) {
              throw new Error(`Quota exceeded: You can only message approved numbers. Please upgrade your Green API plan at https://console.green-api.com`);
            }
            throw directError;
          }
          
          // Return a mock queue response since messaging worked
          return {
            id: globalThis.crypto?.randomUUID?.() || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            instance_id: params.instanceId,
            chat_id: params.chatId,
            message_type: params.messageType || 'text',
            content: params.message,
            metadata: params.metadata || {},
            priority: params.priority || 0,
            status: 'sent',
            retry_count: 0,
            max_retries: 3,
            scheduled_at: params.scheduledAt || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as GreenApiMessage;
        }
        
        // Send message immediately if not scheduled
        if (!params.scheduledAt) {
          await this.processMessageQueue();
        }

        return queueData;
      } catch (insertError: any) {
        console.error('❌ Error with message queue insert:', insertError);
        throw insertError;
      }
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
      // Check if the number is in the allowed list (for quota-restricted plans)
      const formattedChatId = this.formatChatId(message.chat_id);
      if (!this.isNumberAllowedInQuotaRestriction(formattedChatId)) {
        console.warn(`⚠️ Warning: Number ${formattedChatId} may not be allowed under current quota restrictions. Allowed numbers: 254700000000@c.us, 254712345678@c.us, 255746605561@c.us`);
      }
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
        
        // Check if proxy is available before attempting to use it
        const isProxyAvailable = await this.checkProxyAvailability();
        if (!isProxyAvailable) {
          throw new Error('Proxy server not available - will fall back to direct API');
        }
        
        // Determine endpoint and payload based on message type
        let endpointFormats: Array<{name: string, path: string, headers: any, body: any}>;
        
        if (message.message_type === 'poll') {
          // Use sendPoll endpoint for polls
          const pollData = message.metadata?.pollData || {};
          const pollBody = {
            chatId: this.formatChatId(message.chat_id),
            message: message.content,
            options: pollData.options || [],
            multipleAnswers: pollData.multipleAnswers || false
          };
          
          endpointFormats = [
            {
              name: 'Standard Green API Poll Format',
              path: `/waInstance${message.instance_id}/sendPoll/${instance.api_token}`,
              headers: {
                'Content-Type': 'application/json'
              },
              body: pollBody
            },
            {
              name: 'Alternative Poll Format with Auth Header',
              path: `/waInstance${message.instance_id}/sendPoll`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${instance.api_token}`
              },
              body: pollBody
            }
          ];
          
          console.log('📊 Sending poll via proxy...');
        } else if (message.message_type === 'interactive_buttons') {
          // Use sendInteractiveButtons endpoint for interactive buttons
          const interactiveData = message.metadata?.interactiveData || {};
          const buttonsBody = {
            chatId: this.formatChatId(message.chat_id),
            body: message.content,
            buttons: interactiveData.buttons || []
          };
          
          // Add optional header and footer if present
          if (interactiveData.header) {
            buttonsBody.header = interactiveData.header;
          }
          if (interactiveData.footer) {
            buttonsBody.footer = interactiveData.footer;
          }
          
          endpointFormats = [
            {
              name: 'Standard Green API Interactive Buttons Format',
              path: `/waInstance${message.instance_id}/sendInteractiveButtons/${instance.api_token}`,
              headers: {
                'Content-Type': 'application/json'
              },
              body: buttonsBody
            },
            {
              name: 'Alternative Interactive Buttons Format with Auth Header',
              path: `/waInstance${message.instance_id}/sendInteractiveButtons`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${instance.api_token}`
              },
              body: buttonsBody
            }
          ];
          
          console.log('🔘 Sending interactive buttons via proxy...');
        } else if (message.message_type === 'location') {
          // Use sendLocation endpoint for location messages
          const locationData = message.metadata?.locationData || {};
          const locationBody = {
            chatId: this.formatChatId(message.chat_id),
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            nameLocation: locationData.nameLocation,
            address: locationData.address
          };
          
          endpointFormats = [
            {
              name: 'Standard Green API Location Format',
              path: `/waInstance${message.instance_id}/sendLocation/${instance.api_token}`,
              headers: {
                'Content-Type': 'application/json'
              },
              body: locationBody
            },
            {
              name: 'Alternative Location Format with Auth Header',
              path: `/waInstance${message.instance_id}/sendLocation`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${instance.api_token}`
              },
              body: locationBody
            }
          ];
          
          console.log('📍 Sending location via proxy...');
        } else if (message.message_type === 'contact') {
          // Use sendContact endpoint for contact messages
          const contactData = message.metadata?.contactData || {};
          const contactBody = {
            chatId: this.formatChatId(message.chat_id),
            contact: contactData.contact
          };
          
          endpointFormats = [
            {
              name: 'Standard Green API Contact Format',
              path: `/waInstance${message.instance_id}/sendContact/${instance.api_token}`,
              headers: {
                'Content-Type': 'application/json'
              },
              body: contactBody
            },
            {
              name: 'Alternative Contact Format with Auth Header',
              path: `/waInstance${message.instance_id}/sendContact`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${instance.api_token}`
              },
              body: contactBody
            }
          ];
          
          console.log('👤 Sending contact via proxy...');
        } else {
          // Use sendMessage endpoint for other message types
          const messageBody = {
            chatId: this.formatChatId(message.chat_id),
            message: message.content,
            linkPreview: false
          };
          
          endpointFormats = [
            {
              name: 'Standard Green API Format',
              path: `/waInstance${message.instance_id}/sendMessage/${instance.api_token}`,
              headers: {
                'Content-Type': 'application/json'
              },
              body: messageBody
            },
            {
              name: 'Alternative Format with Auth Header',
              path: `/waInstance${message.instance_id}/sendMessage`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${instance.api_token}`
              },
              body: messageBody
            }
          ];
        }

        // Use standard Green API URL or instance-specific subdomain
        let apiBaseUrl = instance.green_api_host || 'https://api.green-api.com';
        
        // Handle instance-specific subdomains (e.g., https://7105.api.greenapi.com)
        if (apiBaseUrl.includes('7105.api.greenapi.com')) {
          // Extract instance ID from subdomain format and use standard format
          apiBaseUrl = 'https://api.green-api.com';
        }
        
        console.log(`🌐 Using API base URL: ${apiBaseUrl}`);

        let lastError: Error | null = null;

        for (const format of endpointFormats) {
          try {
            console.log(`🔄 Trying endpoint format: ${format.name}`);
            
            const res = await fetch(this.proxyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                path: format.path,
                method: 'POST',
                headers: format.headers,
                baseUrl: apiBaseUrl,
                body: format.body
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

            // Handle different proxy response structures
            const responseStatus = proxyResponse.status || res.status;
            const responseData = proxyResponse.data || proxyResponse;
            const isSuccess = proxyResponse.success === true || (responseStatus >= 200 && responseStatus < 300);

            console.log(`🔍 Response analysis:`, {
              success: proxyResponse.success,
              status: responseStatus,
              isSuccess,
              hasData: !!responseData
            });

            if (isSuccess && responseStatus >= 200 && responseStatus < 300) {
              console.log(`✅ ${format.name} successful:`, responseData);
              
              // Extract message ID from different possible response structures
              const messageId = responseData?.idMessage || 
                              responseData?.messageId || 
                              responseData?.id ||
                              responseData?.result?.idMessage;
              
              await this.updateMessageStatus(message.id, 'sent', undefined, messageId);
              return; // Success, exit the loop
            } else if (responseStatus === 403) {
              console.error(`❌ ${format.name} authentication failed (403):`, proxyResponse);
              
              // Check for specific error messages in the response
              const errorDetail = responseData?.error || responseData?.message || 'Invalid credentials';
              lastError = new Error(`Authentication failed (403): ${errorDetail}. Please check your instance authorization status and API token.`);
              continue; // Try next format
            } else if (responseStatus === 400) {
              console.error(`❌ ${format.name} bad request (400):`, proxyResponse);
              
              // Extract specific error information
              const errorDetail = responseData?.error || responseData?.message || JSON.stringify(responseData);
              lastError = new Error(`Bad request (400): ${errorDetail}. Check message format and phone number.`);
              continue; // Try next format
            } else if (responseStatus === 466) {
              console.error(`❌ ${format.name} quota exceeded (466):`, proxyResponse);
              console.error('🚫 Quota exceeded detected in proxy response');
              
              // Handle quota exceeded specifically
              const quotaInfo = this.parseQuotaError(responseData);
              lastError = new Error(`Quota exceeded (466): ${quotaInfo.message}. Allowed numbers: ${quotaInfo.allowedNumbers.join(', ')}. Upgrade at: ${quotaInfo.upgradeUrl}`);
              
              console.error('🚫 Setting quota error as lastError:', lastError.message);
              
              // Don't continue to other formats for quota errors as they won't work either
              break;
            } else {
              console.error(`❌ ${format.name} failed (${responseStatus}):`, proxyResponse);
              
              const errorDetail = responseData?.error || responseData?.message || 'Unknown error';
              lastError = new Error(`API Error (${responseStatus}): ${errorDetail}`);
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
          console.warn('⚠️ All proxy formats failed, attempting direct API call as fallback...');
          
          try {
            const directResult = await this.sendDirectMessage(instance, message);
            console.log('✅ Direct API call successful:', directResult);
            
            const messageId = directResult?.idMessage || directResult?.messageId || directResult?.id;
            await this.updateMessageStatus(message.id, 'sent', undefined, messageId);
            return; // Success via direct call
          } catch (directError: any) {
            console.error('❌ Direct API call also failed:', directError);
            console.error('🔍 Direct error details:', directError.message);
            
            // If either error was a quota error, prioritize that
            if (directError.message?.includes('466') || directError.message?.includes('Quota exceeded') ||
                lastError.message?.includes('466') || lastError.message?.includes('Quota exceeded')) {
              console.error('🚫 Quota error detected, throwing quota-specific error');
              throw new Error(`Quota exceeded: You can only message approved numbers (254700000000@c.us, 254712345678@c.us, 255746605561@c.us). Upgrade at https://console.green-api.com`);
            }
            
            console.error('❌ All authentication methods failed. Common causes:');
            console.error('   • Invalid instance ID or API token');
            console.error('   • Instance not authorized (QR code not scanned)');
            console.error('   • Instance expired or deactivated');
            console.error('   • Network connectivity issues');
            console.error(`   • Instance ID: ${message.instance_id}`);
            console.error(`   • API Base URL: ${apiBaseUrl}`);
            
            // Combine both proxy and direct errors for better debugging
            const combinedError = new Error(
              `Both proxy and direct API calls failed. Proxy error: ${lastError.message}. Direct error: ${directError.message}`
            );
            throw combinedError;
          }
        }

        // If we get here, all formats failed
        throw new Error('All endpoint formats failed - check instance credentials and status');
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
      const apiBaseUrl = instance.green_api_host || 'https://7105.api.greenapi.com';
      console.log(`🧪 Using API base URL: ${apiBaseUrl}`);

      // Test with a simple getStateInstance call
      const response = await fetch(`${this.proxyUrl}/.netlify/functions/green-api-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: `/waInstance${instanceId}/getStateInstance/${instance.api_token}`,
          method: 'GET',
          headers: {},
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
        .from('whatsapp_instances_comprehensive')
        .select('id', { count: 'exact', head: true });
      
      // Test specific instance query
      const { data: instanceData, error: instanceError } = await supabase
        .from('whatsapp_instances_comprehensive')
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
        const directResponse = await fetch('https://7105.api.greenapi.com/test', {
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
        green_api_host: 'https://7105.api.greenapi.com',
        is_green_api: true
      };
      
      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .insert({
          instance_id: testInstance.instance_id,
          api_token: testInstance.api_token,
          phone_number: testInstance.phone_number,
          status: testInstance.status,
          green_api_host: testInstance.green_api_host,
          state_instance: 'notAuthorized',
          is_active: true
        })
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

  // Enhanced Messaging Methods

  // Send Poll
  async sendPoll(params: SendPollParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      // Temporary bypass of queue due to database issues (same as regular messages)
      const BYPASS_QUEUE = true; // Set to false once database is fixed
      
      if (BYPASS_QUEUE) {
        console.log('🚫 Bypassing poll queue due to database issues, sending directly...');
        
        const directPollMessage = {
          id: globalThis.crypto?.randomUUID?.() || `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'poll' as const,
          content: params.message,
          metadata: { 
            pollData: {
              message: params.message,
              options: params.options,
              multipleAnswers: params.multipleAnswers || false
            }
          },
          priority: 0,
          status: 'pending' as const,
          retry_count: 0,
          max_retries: 3,
          scheduled_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as GreenApiMessage;
        
        // Send directly without touching the database
        try {
          await this.processDirectMessage(directPollMessage);
          console.log('✅ Direct poll processing successful');
        } catch (directError: any) {
          console.error('❌ Direct poll processing failed:', directError);
          
          // Re-throw the error to prevent success response
          if (directError.message?.includes('466') || directError.message?.includes('Quota exceeded')) {
            throw new Error(`Poll failed - Quota exceeded. You can only message approved numbers. Please upgrade your Green API plan at https://console.green-api.com`);
          }
          throw directError;
        }
        
        // Return success response only if no errors occurred
        return {
          ...directPollMessage,
          status: 'sent'
        };
      }

      // Add poll message to queue (for when BYPASS_QUEUE is false)
      const supabase = ensureSupabase();
      const pollData = {
        message: params.message,
        options: params.options,
        multipleAnswers: params.multipleAnswers || false
      };

      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'poll',
          content: params.message,
          metadata: { pollData },
          priority: 0,
          scheduled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Process queue to send immediately
      await this.processMessageQueue();

      return queueData;
    } catch (error: any) {
      console.error('Error sending poll:', error);
      
      // Handle specific error types
      if (error.message?.includes('466') || error.message?.includes('Quota exceeded')) {
        const quotaMatch = error.message.match(/Allowed numbers: ([^.]+)/);
        const allowedNumbers = quotaMatch ? quotaMatch[1] : '254700000000@c.us, 254712345678@c.us, 255746605561@c.us';
        throw new Error(`Poll failed - Quota exceeded. You can only send to: ${allowedNumbers}. Upgrade at https://console.green-api.com`);
      }
      
      throw new Error(`Failed to send poll: ${error.message}`);
    }
  }

  // Send Location
  async sendLocation(params: SendLocationParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      // Temporary bypass of queue due to database issues (same as regular messages)
      const BYPASS_QUEUE = true; // Set to false once database is fixed
      
      if (BYPASS_QUEUE) {
        console.log('🚫 Bypassing location queue due to database issues, sending directly...');
        
        const directLocationMessage = {
          id: globalThis.crypto?.randomUUID?.() || `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'location' as const,
          content: params.nameLocation || `Location: ${params.latitude}, ${params.longitude}`,
          metadata: { 
            locationData: {
              latitude: params.latitude,
              longitude: params.longitude,
              nameLocation: params.nameLocation,
              address: params.address
            }
          },
          priority: 0,
          status: 'pending' as const,
          retry_count: 0,
          max_retries: 3,
          scheduled_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as GreenApiMessage;
        
        // Send directly without touching the database
        try {
          await this.processDirectMessage(directLocationMessage);
          console.log('✅ Direct location processing successful');
        } catch (directError: any) {
          console.error('❌ Direct location processing failed:', directError);
          
          // Re-throw the error to prevent success response
          if (directError.message?.includes('466') || directError.message?.includes('Quota exceeded')) {
            throw new Error(`Location failed - Quota exceeded. You can only message approved numbers. Please upgrade your Green API plan at https://console.green-api.com`);
          }
          throw directError;
        }
        
        // Return success response only if no errors occurred
        return {
          ...directLocationMessage,
          status: 'sent'
        };
      }

      // Add location message to queue (for when BYPASS_QUEUE is false)
      const supabase = ensureSupabase();
      const locationData = {
        latitude: params.latitude,
        longitude: params.longitude,
        nameLocation: params.nameLocation,
        address: params.address
      };

      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'location',
          content: params.nameLocation || `Location: ${params.latitude}, ${params.longitude}`,
          metadata: { locationData },
          priority: 0,
          scheduled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Process queue to send immediately
      await this.processMessageQueue();

      return queueData;
    } catch (error: any) {
      console.error('Error sending location:', error);
      
      // Handle specific error types
      if (error.message?.includes('466') || error.message?.includes('Quota exceeded')) {
        const quotaMatch = error.message.match(/Allowed numbers: ([^.]+)/);
        const allowedNumbers = quotaMatch ? quotaMatch[1] : '254700000000@c.us, 254712345678@c.us, 255746605561@c.us';
        throw new Error(`Location failed - Quota exceeded. You can only send to: ${allowedNumbers}. Upgrade at https://console.green-api.com`);
      }
      
      throw new Error(`Failed to send location: ${error.message}`);
    }
  }

  // Send Contact
  async sendContact(params: SendContactParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      // Temporary bypass of queue due to database issues (same as regular messages)
      const BYPASS_QUEUE = true; // Set to false once database is fixed
      
      if (BYPASS_QUEUE) {
        console.log('🚫 Bypassing contact queue due to database issues, sending directly...');
        
        const directContactMessage = {
          id: globalThis.crypto?.randomUUID?.() || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'contact' as const,
          content: `${params.name} - ${params.phoneNumber}`,
          metadata: { 
            contactData: {
              name: params.name,
              phoneNumber: params.phoneNumber,
              organization: params.organization,
              email: params.email,
              address: params.address
            }
          },
          priority: 0,
          status: 'pending' as const,
          retry_count: 0,
          max_retries: 3,
          scheduled_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as GreenApiMessage;
        
        // Send directly without touching the database
        try {
          await this.processDirectMessage(directContactMessage);
          console.log('✅ Direct contact processing successful');
        } catch (directError: any) {
          console.error('❌ Direct contact processing failed:', directError);
          
          // Re-throw the error to prevent success response
          if (directError.message?.includes('466') || directError.message?.includes('Quota exceeded')) {
            throw new Error(`Contact failed - Quota exceeded. You can only message approved numbers. Please upgrade your Green API plan at https://console.green-api.com`);
          }
          throw directError;
        }
        
        // Return success response only if no errors occurred
        return {
          ...directContactMessage,
          status: 'sent'
        };
      }

      // Add contact message to queue (for when BYPASS_QUEUE is false)
      const supabase = ensureSupabase();
      const contactData = {
        name: params.name,
        phoneNumber: params.phoneNumber,
        organization: params.organization,
        email: params.email,
        address: params.address
      };

      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'contact',
          content: `${params.name} - ${params.phoneNumber}`,
          metadata: { contactData },
          priority: 0,
          scheduled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Process queue to send immediately
      await this.processMessageQueue();

      return queueData;
    } catch (error: any) {
      console.error('Error sending contact:', error);
      
      // Handle specific error types
      if (error.message?.includes('466') || error.message?.includes('Quota exceeded')) {
        const quotaMatch = error.message.match(/Allowed numbers: ([^.]+)/);
        const allowedNumbers = quotaMatch ? quotaMatch[1] : '254700000000@c.us, 254712345678@c.us, 255746605561@c.us';
        throw new Error(`Contact failed - Quota exceeded. You can only send to: ${allowedNumbers}. Upgrade at https://console.green-api.com`);
      }
      
      throw new Error(`Failed to send contact: ${error.message}`);
    }
  }

  // Send Interactive Buttons
  async sendInteractiveButtons(params: SendInteractiveButtonsParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      // Temporary bypass of queue due to database issues (same as regular messages)
      const BYPASS_QUEUE = true; // Set to false once database is fixed
      
      if (BYPASS_QUEUE) {
        console.log('🚫 Bypassing interactive buttons queue due to database issues, sending directly...');
        
        const directInteractiveMessage = {
          id: globalThis.crypto?.randomUUID?.() || `interactive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'interactive_buttons' as const,
          content: params.message,
          metadata: { 
            interactiveData: {
              message: params.message,
              footer: params.footer,
              buttons: params.buttons
            }
          },
          priority: 0,
          status: 'pending' as const,
          retry_count: 0,
          max_retries: 3,
          scheduled_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as GreenApiMessage;
        
        // Send directly without touching the database
        try {
          await this.processDirectMessage(directInteractiveMessage);
          console.log('✅ Direct interactive buttons processing successful');
        } catch (directError: any) {
          console.error('❌ Direct interactive buttons processing failed:', directError);
          
          // Re-throw the error to prevent success response
          if (directError.message?.includes('466') || directError.message?.includes('Quota exceeded')) {
            throw new Error(`Interactive buttons failed - Quota exceeded. You can only message approved numbers. Please upgrade your Green API plan at https://console.green-api.com`);
          }
          throw directError;
        }
        
        // Return success response only if no errors occurred
        return {
          ...directInteractiveMessage,
          status: 'sent'
        };
      }

      // Add interactive buttons message to queue (for when BYPASS_QUEUE is false)
      const supabase = ensureSupabase();
      const interactiveData = {
        message: params.message,
        header: params.header,
        footer: params.footer,
        buttons: params.buttons
      };

      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'interactive_buttons',
          content: params.message,
          metadata: { interactiveData },
          priority: 0,
          scheduled_at: new Date().toISOString(),
          interactive_data: interactiveData
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Process queue to send immediately
      await this.processMessageQueue();

      return queueData;
    } catch (error: any) {
      console.error('Error sending interactive buttons:', error);
      throw new Error(`Failed to send interactive buttons: ${error.message}`);
    }
  }

  // Send File by Upload
  async sendFileByUpload(params: SendFileParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      if (!params.file) {
        throw new Error('File is required for upload');
      }

      // First upload the file
      const uploadResult = await this.uploadFile(params.instanceId, params.file);
      
      // Add file message to queue
      const supabase = ensureSupabase();
      const fileData = {
        fileName: params.fileName || params.file.name,
        caption: params.caption,
        uploadedFileUrl: uploadResult.urlFile,
        uploadedFileId: uploadResult.idFile
      };

      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'file_upload',
          content: params.caption || `File: ${params.fileName || params.file.name}`,
          metadata: { fileData },
          priority: 0,
          scheduled_at: new Date().toISOString(),
          file_data: fileData
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Process queue to send immediately
      await this.processMessageQueue();

      return queueData;
    } catch (error: any) {
      console.error('Error sending file by upload:', error);
      throw new Error(`Failed to send file by upload: ${error.message}`);
    }
  }

  // Send File by URL
  async sendFileByUrl(params: SendFileParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      if (!params.fileUrl) {
        throw new Error('File URL is required');
      }

      // Add file URL message to queue
      const supabase = ensureSupabase();
      const fileData = {
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        caption: params.caption
      };

      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'file_url',
          content: params.caption || `File: ${params.fileName || 'Shared file'}`,
          metadata: { fileData },
          priority: 0,
          scheduled_at: new Date().toISOString(),
          file_data: fileData
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Process queue to send immediately
      await this.processMessageQueue();

      return queueData;
    } catch (error: any) {
      console.error('Error sending file by URL:', error);
      throw new Error(`Failed to send file by URL: ${error.message}`);
    }
  }

  // Upload File
  async uploadFile(instanceId: string, file: File | Blob): Promise<any> {
    try {
      const instance = await this.getInstance(instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await retryWithBackoff(async () => {
        const res = await fetch(`${this.proxyUrl}/.netlify/functions/green-api-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: `/waInstance${instanceId}/uploadFile/${instance.api_token}`,
            method: 'POST',
            baseUrl: instance.green_api_host || this.baseUrl,
            isFileUpload: true,
            formData: formData
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Upload failed: ${res.status} - ${errorText}`);
        }

        const result = await res.json();
        if (!result.success) {
          throw new Error(`Upload failed: ${result.data?.error || 'Unknown error'}`);
        }

        return result.data;
      }, 3, 1000);

      return response;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Forward Messages
  async forwardMessages(params: ForwardMessageParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      // Add forward message to queue
      const supabase = ensureSupabase();
      const forwardData = {
        chatIdFrom: params.chatIdFrom,
        messages: params.messages
      };

      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: 'forward',
          content: `Forwarded ${params.messages.length} message(s)`,
          metadata: { forwardData },
          priority: 0,
          scheduled_at: new Date().toISOString(),
          forwarded_from: params.chatIdFrom
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Process queue to send immediately
      await this.processMessageQueue();

      return queueData;
    } catch (error: any) {
      console.error('Error forwarding messages:', error);
      throw new Error(`Failed to forward messages: ${error.message}`);
    }
  }

  // Enhanced Send Message with additional features
  async sendEnhancedMessage(params: SendMessageParams): Promise<GreenApiMessage> {
    try {
      const instance = await this.getInstance(params.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      // Add enhanced message to queue
      const supabase = ensureSupabase();
      const enhancedMetadata = {
        ...params.metadata,
        quotedMessageId: params.quotedMessageId,
        linkPreview: params.linkPreview,
        typingTime: params.typingTime,
        customPreview: params.customPreview
      };

      const { data: queueData, error: queueError } = await supabase
        .from('green_api_message_queue')
        .insert({
          instance_id: params.instanceId,
          chat_id: params.chatId,
          message_type: params.messageType || 'text',
          content: params.message,
          metadata: enhancedMetadata,
          priority: params.priority || 0,
          scheduled_at: params.scheduledAt || new Date().toISOString(),
          quoted_message_id: params.quotedMessageId
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
      console.error('Error sending enhanced message:', error);
      throw new Error(`Failed to send enhanced message: ${error.message}`);
    }
  }

  // Diagnostic function for interactive buttons
  async diagnoseInteractiveButtonsIssues(instanceId: string, chatId: string): Promise<{
    canSendButtons: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let canSendButtons = true;

    try {
      // Check instance status
      const instance = await this.getInstance(instanceId);
      if (!instance || instance.status !== 'connected') {
        issues.push('WhatsApp instance is not connected');
        recommendations.push('Ensure WhatsApp instance is connected and authorized');
        canSendButtons = false;
      }

      // Check for recent customer activity (24-hour window)
      try {
        const supabase = ensureSupabase();
        const { data: recentMessages } = await supabase
          .from('whatsapp_messages')
          .select('created_at, direction')
          .eq('instance_id', instanceId)
          .eq('chat_id', chatId)
          .eq('direction', 'incoming')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!recentMessages || recentMessages.length === 0) {
          issues.push('No recent incoming messages from this customer');
          recommendations.push('Customer must send a message first to enable interactive buttons');
          canSendButtons = false;
        } else {
          const lastMessage = recentMessages[0];
          const hoursSinceLastMessage = (Date.now() - new Date(lastMessage.created_at).getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastMessage > 24) {
            issues.push(`Last customer message was ${Math.round(hoursSinceLastMessage)} hours ago (>24h limit)`);
            recommendations.push('Ask customer to send a new message to reset the 24-hour window');
            canSendButtons = false;
          }
        }
      } catch (error) {
        issues.push('Could not check message history');
        recommendations.push('Check database connection and message history');
      }

      // Check Green API button support status (simulated via getStateInstance for 403)
      try {
        const response = await fetch(`https://7105.api.greenapi.com/waInstance${instanceId}/getStateInstance/${instance?.api_token}`, {
          method: 'GET'
        });
        
        if (response.status === 403) {
          issues.push('Green API interactive buttons are currently disabled (403 error)');
          recommendations.push('Interactive buttons are temporarily unavailable on Green API - use text fallback');
          canSendButtons = false;
        }
      } catch (error) {
        issues.push('Could not verify Green API button support status');
        recommendations.push('Check Green API service status and connectivity');
      }

      return { canSendButtons, issues, recommendations };
    } catch (error: any) {
      return {
        canSendButtons: false,
        issues: [`Diagnostic error: ${error.message}`],
        recommendations: ['Check system connectivity and try again']
      };
    }
  }
}

export const greenApiService = new GreenApiService();
export default greenApiService;
