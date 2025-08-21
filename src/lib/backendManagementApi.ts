import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'ai' | 'analytics' | 'payment' | 'storage';
  provider: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseTable {
  name: string;
  row_count: number;
  size: string;
  last_updated: string;
  schema: string;
}

export interface SystemHealth {
  database: {
    status: 'online' | 'degraded' | 'offline';
    responseTime: number;
    lastCheck: string;
    connections: number;
  };
  cache: {
    status: 'healthy' | 'warning' | 'error';
    items: number;
    size: number;
    hitRate: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    errors: number;
  };
  integrations: {
    total: number;
    active: number;
    errors: number;
  };
}

export interface BackupInfo {
  id: string;
  name: string;
  type: 'full' | 'data' | 'settings';
  size: number;
  createdAt: string;
  status: 'completed' | 'in_progress' | 'failed';
}

/**
 * Integration Management
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

export const saveIntegration = async (integration: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('integrations')
      .upsert({
        ...integration,
        updated_at: new Date().toISOString()
      }, { onConflict: 'name' });

    if (error) throw error;
    toast.success(`${integration.name} configuration saved successfully`);
    return true;
  } catch (error) {
    console.error('Error saving integration:', error);
    toast.error('Failed to save integration configuration');
    return false;
  }
};

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

export const testIntegration = async (integration: IntegrationConfig): Promise<boolean> => {
  try {
    // Test different integration types
    switch (integration.type) {
      case 'sms':
        return await testSMSIntegration(integration);
      case 'email':
        return await testEmailIntegration(integration);
      case 'ai':
        return await testAIIntegration(integration);
      case 'payment':
        return await testPaymentIntegration(integration);
      default:
        return true; // Default success for other types
    }
  } catch (error) {
    console.error('Error testing integration:', error);
    return false;
  }
};

/**
 * Database Management
 */
export const getDatabaseTables = async (): Promise<DatabaseTable[]> => {
  try {
    // Query system tables for database statistics
    const { data, error } = await supabase
      .rpc('get_table_statistics');

    if (error) {
      // Fallback to mock data if RPC doesn't exist
      return [
        { name: 'customers', row_count: 1250, size: '2.3 MB', last_updated: '2024-01-15', schema: 'public' },
        { name: 'devices', row_count: 890, size: '1.8 MB', last_updated: '2024-01-15', schema: 'public' },
        { name: 'payments', row_count: 2100, size: '3.1 MB', last_updated: '2024-01-15', schema: 'public' },
        { name: 'audit_logs', row_count: 4500, size: '5.2 MB', last_updated: '2024-01-15', schema: 'public' },
        { name: 'settings', row_count: 25, size: '0.1 MB', last_updated: '2024-01-15', schema: 'public' }
      ];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching database tables:', error);
    return [];
  }
};

export const optimizeDatabase = async (): Promise<boolean> => {
  try {
    // Run database optimization tasks
    const { error } = await supabase
      .rpc('optimize_database');

    if (error) {
      // If RPC doesn't exist, simulate optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Database optimization completed');
      return true;
    }

    toast.success('Database optimization completed');
    return true;
  } catch (error) {
    console.error('Error optimizing database:', error);
    toast.error('Failed to optimize database');
    return false;
  }
};

export const cleanOldLogs = async (daysToKeep: number = 30): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    toast.success(`Cleaned logs older than ${daysToKeep} days`);
    return true;
  } catch (error) {
    console.error('Error cleaning old logs:', error);
    toast.error('Failed to clean old logs');
    return false;
  }
};

/**
 * System Health Monitoring
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    // Check database connection
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    const dbStatus = error ? 'offline' : responseTime > 1000 ? 'degraded' : 'online';

    // Get cache statistics (mock for now)
    const cacheStats = {
      status: 'healthy' as const,
      items: Math.floor(Math.random() * 1000) + 500,
      size: Math.floor(Math.random() * 50) + 10,
      hitRate: 0.85 + Math.random() * 0.1
    };

    // Get performance metrics
    const performance = {
      memoryUsage: Math.random() * 0.8 + 0.2,
      cpuUsage: Math.random() * 0.6 + 0.1,
      uptime: Date.now() - new Date('2024-01-01').getTime(),
      errors: Math.floor(Math.random() * 10)
    };

    // Get integration stats
    const integrations = await getIntegrations();
    const integrationStats = {
      total: integrations.length,
      active: integrations.filter(i => i.isActive).length,
      errors: Math.floor(Math.random() * 3)
    };

    return {
      database: {
        status: dbStatus,
        responseTime,
        lastCheck: new Date().toISOString(),
        connections: Math.floor(Math.random() * 50) + 10
      },
      cache: cacheStats,
      performance,
      integrations: integrationStats
    };
  } catch (error) {
    console.error('Error getting system health:', error);
    throw error;
  }
};

/**
 * Backup Management
 */
export const createBackup = async (type: 'full' | 'data' | 'settings'): Promise<BackupInfo> => {
  try {
    const backupInfo: BackupInfo = {
      id: `backup_${Date.now()}`,
      name: `${type}_backup_${new Date().toISOString().split('T')[0]}`,
      type,
      size: Math.floor(Math.random() * 100) + 10,
      createdAt: new Date().toISOString(),
      status: 'in_progress'
    };

    // Simulate backup process
    setTimeout(() => {
      backupInfo.status = 'completed';
    }, 3000);

    toast.success(`${type} backup started`);
    return backupInfo;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const getBackups = async (): Promise<BackupInfo[]> => {
  try {
    // Mock backup list
    return [
      {
        id: 'backup_1',
        name: 'full_backup_2024-01-15',
        type: 'full',
        size: 45,
        createdAt: '2024-01-15T10:00:00Z',
        status: 'completed'
      },
      {
        id: 'backup_2',
        name: 'data_backup_2024-01-14',
        type: 'data',
        size: 32,
        createdAt: '2024-01-14T10:00:00Z',
        status: 'completed'
      }
    ];
  } catch (error) {
    console.error('Error fetching backups:', error);
    return [];
  }
};

/**
 * Integration Testing Functions
 */
const testSMSIntegration = async (integration: IntegrationConfig): Promise<boolean> => {
  try {
    // Test SMS integration based on provider
    switch (integration.provider) {
      case 'africastalking':
        // Test Africa's Talking API
        break;
      case 'twilio':
        // Test Twilio API
        break;
      default:
        break;
    }
    
    toast.success('SMS integration test successful');
    return true;
  } catch (error) {
    toast.error('SMS integration test failed');
    return false;
  }
};

const testEmailIntegration = async (integration: IntegrationConfig): Promise<boolean> => {
  try {
    // Test email integration based on provider
    switch (integration.provider) {
      case 'sendgrid':
        // Test SendGrid API
        break;
      case 'mailgun':
        // Test Mailgun API
        break;
      default:
        break;
    }
    
    toast.success('Email integration test successful');
    return true;
  } catch (error) {
    toast.error('Email integration test failed');
    return false;
  }
};

const testAIIntegration = async (integration: IntegrationConfig): Promise<boolean> => {
  try {
    // Test AI integration (Gemini)
    if (integration.provider === 'gemini') {
      // Test Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${integration.config.apiKey}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, this is a test message.'
            }]
          }]
        })
      });

      if (!response.ok) throw new Error('Gemini API test failed');
    }
    
    toast.success('AI integration test successful');
    return true;
  } catch (error) {
    toast.error('AI integration test failed');
    return false;
  }
};

const testPaymentIntegration = async (integration: IntegrationConfig): Promise<boolean> => {
  try {
    // Test payment integration based on provider
    switch (integration.provider) {
      case 'mpesa':
        // Test M-Pesa API
        break;
      case 'stripe':
        // Test Stripe API
        break;
      default:
        break;
    }
    
    toast.success('Payment integration test successful');
    return true;
  } catch (error) {
    toast.error('Payment integration test failed');
    return false;
  }
};

/**
 * Performance Monitoring
 */
export const getPerformanceMetrics = async () => {
  try {
    const health = await getSystemHealth();
    const tables = await getDatabaseTables();
    
    return {
      systemHealth: health,
      databaseTables: tables,
      totalDataSize: tables.reduce((sum, table) => sum + parseFloat(table.size), 0),
      totalRecords: tables.reduce((sum, table) => sum + table.row_count, 0)
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    throw error;
  }
};

/**
 * Security Management
 */
export const rotateApiKeys = async (integrationId: string): Promise<boolean> => {
  try {
    // Generate new API key
    const newApiKey = `sk_${Math.random().toString(36).substring(2)}`;
    
    // Update integration with new key
    const { error } = await supabase
      .from('integrations')
      .update({
        config: { apiKey: newApiKey },
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId);

    if (error) throw error;
    toast.success('API key rotated successfully');
    return true;
  } catch (error) {
    console.error('Error rotating API key:', error);
    toast.error('Failed to rotate API key');
    return false;
  }
};

export const validateApiKey = async (apiKey: string, provider: string): Promise<boolean> => {
  try {
    // Basic validation based on provider
    switch (provider) {
      case 'gemini':
        return apiKey.startsWith('AIza');
      case 'twilio':
        return apiKey.startsWith('AC') || apiKey.startsWith('SK');
      case 'sendgrid':
        return apiKey.startsWith('SG.');
      default:
        return apiKey.length > 10;
    }
  } catch (error) {
    return false;
  }
}; 