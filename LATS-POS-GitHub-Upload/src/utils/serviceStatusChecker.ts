/**
 * Service Status Checker
 * Utility to diagnose and fix service connection issues
 */

// WhatsApp credentials have been removed
const getWhatsAppCredentials = () => ({ instanceId: '', apiToken: '' });
const getWhatsAppApiUrl = () => '';
import { APP_CONFIG } from '../config/appConfig';

export interface ServiceStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: string;
  error?: string;
  details?: any;
}

export interface SystemStatus {
  whatsapp: ServiceStatus;
  ai: ServiceStatus;
  database: ServiceStatus;
  api: ServiceStatus;
}

class ServiceStatusChecker {
  private static instance: ServiceStatusChecker;
  private statusCache: Map<string, ServiceStatus> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  static getInstance(): ServiceStatusChecker {
    if (!ServiceStatusChecker.instance) {
      ServiceStatusChecker.instance = new ServiceStatusChecker();
    }
    return ServiceStatusChecker.instance;
  }

  /**
   * Check WhatsApp service status
   */
  async checkWhatsAppStatus(): Promise<ServiceStatus> {
    const cacheKey = 'whatsapp';
    const cached = this.getCachedStatus(cacheKey);
    if (cached) return cached;

    const status: ServiceStatus = {
      service: 'WhatsApp',
      status: 'unknown',
      lastCheck: new Date().toISOString()
    };

    try {
      const credentials = getWhatsAppCredentials();
      
      if (!credentials.instanceId || !credentials.apiToken) {
        status.status = 'unhealthy';
        status.error = 'Missing credentials';
        return this.cacheStatus(cacheKey, status);
      }

      const apiUrl = getWhatsAppApiUrl('getStateInstance');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        status.status = 'healthy';
        status.details = {
          state: data.stateInstance,
          instanceId: credentials.instanceId
        };
      } else {
        status.status = 'unhealthy';
        status.error = `API Error: ${response.status} ${response.statusText}`;
      }
    } catch (error) {
      status.status = 'unhealthy';
      status.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return this.cacheStatus(cacheKey, status);
  }

  /**
   * Check AI service status
   */
  async checkAIStatus(): Promise<ServiceStatus> {
    const cacheKey = 'ai';
    const cached = this.getCachedStatus(cacheKey);
    if (cached) return cached;

    const status: ServiceStatus = {
      service: 'AI',
      status: 'unknown',
      lastCheck: new Date().toISOString()
    };

    try {
      if (!APP_CONFIG.ai.enabled) {
        status.status = 'unhealthy';
        status.error = 'AI service is disabled in configuration';
        return this.cacheStatus(cacheKey, status);
      }

      // Check if Gemini API key is available
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        status.status = 'unhealthy';
        status.error = 'Missing Gemini API key';
        return this.cacheStatus(cacheKey, status);
      }

      // Test AI connection
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test' }] }]
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        status.status = 'healthy';
        status.details = { model: 'gemini-pro' };
      } else {
        status.status = 'unhealthy';
        status.error = `AI API Error: ${response.status}`;
      }
    } catch (error) {
      status.status = 'unhealthy';
      status.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return this.cacheStatus(cacheKey, status);
  }

  /**
   * Check database status
   */
  async checkDatabaseStatus(): Promise<ServiceStatus> {
    const cacheKey = 'database';
    const cached = this.getCachedStatus(cacheKey);
    if (cached) return cached;

    const status: ServiceStatus = {
      service: 'Database',
      status: 'unknown',
      lastCheck: new Date().toISOString()
    };

    try {
      // Import supabase dynamically to avoid circular dependencies
      const { supabase } = await import('../lib/supabaseClient');
      
      const { data, error } = await supabase
        .from('settings')
        .select('key')
        .limit(1);

      if (error) {
        status.status = 'unhealthy';
        status.error = error.message;
      } else {
        status.status = 'healthy';
        status.details = { tables: 'accessible' };
      }
    } catch (error) {
      status.status = 'unhealthy';
      status.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return this.cacheStatus(cacheKey, status);
  }

  /**
   * Check API settings status
   */
  async checkAPIStatus(): Promise<ServiceStatus> {
    const cacheKey = 'api';
    const cached = this.getCachedStatus(cacheKey);
    if (cached) return cached;

    const status: ServiceStatus = {
      service: 'API',
      status: 'unknown',
      lastCheck: new Date().toISOString()
    };

    try {
      // Import supabase dynamically
      const { supabase } = await import('../lib/supabaseClient');
      
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .or('key.eq.sms_provider_api_key,key.eq.sms_api_url');

      if (error) {
        status.status = 'unhealthy';
        status.error = error.message;
      } else {
        status.status = 'healthy';
        status.details = { settings: data?.length || 0 };
      }
    } catch (error) {
      status.status = 'unhealthy';
      status.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return this.cacheStatus(cacheKey, status);
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const [whatsapp, ai, database, api] = await Promise.allSettled([
      this.checkWhatsAppStatus(),
      this.checkAIStatus(),
      this.checkDatabaseStatus(),
      this.checkAPIStatus()
    ]);

    return {
      whatsapp: whatsapp.status === 'fulfilled' ? whatsapp.value : this.createErrorStatus('WhatsApp', whatsapp.reason),
      ai: ai.status === 'fulfilled' ? ai.value : this.createErrorStatus('AI', ai.reason),
      database: database.status === 'fulfilled' ? database.value : this.createErrorStatus('Database', database.reason),
      api: api.status === 'fulfilled' ? api.value : this.createErrorStatus('API', api.reason)
    };
  }

  private getCachedStatus(key: string): ServiceStatus | null {
    const cached = this.statusCache.get(key);
    if (cached && Date.now() - new Date(cached.lastCheck).getTime() < this.cacheTimeout) {
      return cached;
    }
    return null;
  }

  private cacheStatus(key: string, status: ServiceStatus): ServiceStatus {
    this.statusCache.set(key, status);
    return status;
  }

  private createErrorStatus(service: string, error: any): ServiceStatus {
    return {
      service,
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export const serviceStatusChecker = ServiceStatusChecker.getInstance();
