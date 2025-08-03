import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'ai' | 'analytics' | 'payment' | 'storage' | 'whatsapp';
  provider: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationStatus {
  isConnected: boolean;
  lastCheck: string;
  error?: string;
  balance?: string;
  usage?: any;
}

/**
 * Get all integrations from database
 */
export const getIntegrations = async (): Promise<IntegrationConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return [];
  }
};

/**
 * Save integration to database
 */
export const saveIntegration = async (integration: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('integrations')
      .upsert({
        ...integration,
        updated_at: new Date().toISOString()
      }, { onConflict: 'name' });

    if (error) throw error;
    
    // Update SMS service configuration if it's the SMS integration
    if (integration.type === 'sms' && integration.provider === 'mobishastra') {
      await updateSMSServiceConfig(integration.config);
    }
    
    // Update WhatsApp service configuration if it's the WhatsApp integration
    if (integration.type === 'whatsapp' && integration.provider === 'green-api') {
      await updateWhatsAppServiceConfig(integration.config);
    }
    
    toast.success(`${integration.name} configuration saved successfully`);
    return true;
  } catch (error) {
    console.error('Error saving integration:', error);
    toast.error('Failed to save integration configuration');
    return false;
  }
};

/**
 * Update SMS service configuration dynamically
 */
const updateSMSServiceConfig = async (config: Record<string, any>) => {
  try {
    // Update the SMS service with new configuration
    const { username, password, sender_id, api_url } = config;
    
    // Import and update the SMS service
    const { smsService } = await import('../services/smsService');
    smsService.updateConfig({ username, password, sender_id, api_url });
    
    console.log('SMS service configuration updated successfully');
    
  } catch (error) {
    console.error('Error updating SMS service config:', error);
  }
};

/**
 * Update WhatsApp service configuration dynamically
 */
const updateWhatsAppServiceConfig = async (config: Record<string, any>) => {
  try {
    const { instance_id, api_key } = config;
    
    console.log('Updating WhatsApp service configuration:', {
      instance_id,
      api_key: api_key ? '***' : 'not set'
    });
    
    // In a real implementation, you might update a global config or service instance
    // For example: whatsappService.updateConfig({ instance_id, api_key });
    
  } catch (error) {
    console.error('Error updating WhatsApp service config:', error);
  }
};

/**
 * Delete integration from database
 */
export const deleteIntegration = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Integration deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting integration:', error);
    toast.error('Failed to delete integration');
    return false;
  }
};

/**
 * Test integration connection
 */
export const testIntegration = async (integration: IntegrationConfig): Promise<IntegrationStatus> => {
  try {
    switch (integration.type) {
      case 'sms':
        return await testSMSIntegration(integration);
      case 'whatsapp':
        return await testWhatsAppIntegration(integration);
      case 'ai':
        return await testAIIntegration(integration);
      case 'storage':
        return await testStorageIntegration(integration);
      default:
        return {
          isConnected: false,
          lastCheck: new Date().toISOString(),
          error: 'Unsupported integration type'
        };
    }
  } catch (error) {
    console.error('Error testing integration:', error);
    return {
      isConnected: false,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test SMS integration (Mobishastra)
 */
const testSMSIntegration = async (integration: IntegrationConfig): Promise<IntegrationStatus> => {
  try {
    const { username, password } = integration.config;
    
    const params = new URLSearchParams({
      user: username,
      pwd: password,
    });
    
    const response = await fetch(`https://mshastra.com/balance.aspx?${params.toString()}`);
    const responseText = await response.text();
    
    if (response.ok) {
      const balanceMatch = responseText.match(/=\s*(\d+)/);
      if (balanceMatch) {
        return {
          isConnected: true,
          lastCheck: new Date().toISOString(),
          balance: balanceMatch[1]
        };
      }
    }
    
    return {
      isConnected: false,
      lastCheck: new Date().toISOString(),
      error: responseText
    };
  } catch (error) {
    return {
      isConnected: false,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};

/**
 * Test WhatsApp integration (Green API)
 */
const testWhatsAppIntegration = async (integration: IntegrationConfig): Promise<IntegrationStatus> => {
  try {
    const { instance_id, api_key } = integration.config;
    
    if (!instance_id || !api_key) {
      return {
        isConnected: false,
        lastCheck: new Date().toISOString(),
        error: 'Missing credentials'
      };
    }
    
    // Test Green API connection
    const response = await fetch(`https://api.green-api.com/waInstance${instance_id}/getStateInstance/${api_key}`);
    const data = await response.json();
    
    if (data.stateInstance === 'authorized') {
      return {
        isConnected: true,
        lastCheck: new Date().toISOString()
      };
    } else {
      return {
        isConnected: false,
        lastCheck: new Date().toISOString(),
        error: `WhatsApp not authorized: ${data.stateInstance}`
      };
    }
  } catch (error) {
    return {
      isConnected: false,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};

/**
 * Test AI integration (Gemini)
 */
const testAIIntegration = async (integration: IntegrationConfig): Promise<IntegrationStatus> => {
  try {
    const { api_key } = integration.config;
    
    if (!api_key) {
      return {
        isConnected: false,
        lastCheck: new Date().toISOString(),
        error: 'Missing API key'
      };
    }
    
    // Test Gemini API with a simple request
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, this is a test message.'
          }]
        }]
      })
    });
    
    if (response.ok) {
      return {
        isConnected: true,
        lastCheck: new Date().toISOString()
      };
    } else {
      const errorData = await response.json();
      return {
        isConnected: false,
        lastCheck: new Date().toISOString(),
        error: errorData.error?.message || 'API request failed'
      };
    }
  } catch (error) {
    return {
      isConnected: false,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};

/**
 * Test storage integration (Supabase)
 */
const testStorageIntegration = async (integration: IntegrationConfig): Promise<IntegrationStatus> => {
  try {
    const { url, anon_key } = integration.config;
    
    // Test Supabase connection
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anon_key,
        'Authorization': `Bearer ${anon_key}`
      }
    });
    
    if (response.ok) {
      return {
        isConnected: true,
        lastCheck: new Date().toISOString()
      };
    } else {
      return {
        isConnected: false,
        lastCheck: new Date().toISOString(),
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      isConnected: false,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};

/**
 * Initialize default integrations
 */
export const initializeDefaultIntegrations = async (): Promise<void> => {
  try {
    const defaultIntegrations: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Mobishastra SMS',
        type: 'sms',
        provider: 'mobishastra',
        config: {
          username: 'Inauzwa',
          password: '@Masika10',
          sender_id: 'INAUZWA',
          api_url: 'https://mshastra.com/sendurl.aspx',
          balance_url: 'https://mshastra.com/balance.aspx'
        },
        isActive: true
      },
      {
        name: 'WhatsApp Green API',
        type: 'whatsapp',
        provider: 'green-api',
        config: {
          instance_id: '',
          api_key: ''
        },
        isActive: false
      },
      {
        name: 'Gemini AI',
        type: 'ai',
        provider: 'google',
        config: {
          api_key: '',
          model: 'gemini-pro'
        },
        isActive: false
      },
      {
        name: 'Supabase Database',
        type: 'storage',
        provider: 'supabase',
        config: {
          url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
          anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
        },
        isActive: true
      }
    ];

    for (const integration of defaultIntegrations) {
      await saveIntegration(integration);
    }
    
    console.log('Default integrations initialized');
  } catch (error) {
    console.error('Error initializing default integrations:', error);
  }
};

/**
 * Get integration status for all active integrations
 */
export const getAllIntegrationStatuses = async (): Promise<Record<string, IntegrationStatus>> => {
  try {
    const integrations = await getIntegrations();
    const statuses: Record<string, IntegrationStatus> = {};
    
    for (const integration of integrations) {
      if (integration.isActive) {
        statuses[integration.name] = await testIntegration(integration);
      }
    }
    
    return statuses;
  } catch (error) {
    console.error('Error getting integration statuses:', error);
    return {};
  }
}; 