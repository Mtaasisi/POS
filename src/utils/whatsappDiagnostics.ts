import { WhatsAppService } from '../services/whatsappService';

export interface WhatsAppDiagnosticResult {
  timestamp: string;
  connectionHealth: {
    healthy: boolean;
    status: string;
    error?: string;
  };
  settings: {
    configured: boolean;
    instanceId?: string;
    apiKey?: string;
  };
  recentErrors: Array<{
    timestamp: string;
    error: string;
    context: string;
  }>;
  recommendations: string[];
}

export class WhatsAppDiagnostics {
  private static instance: WhatsAppDiagnostics;
  private whatsappService: WhatsAppService;
  private errorLog: Array<{ timestamp: string; error: string; context: string }> = [];
  private maxErrorLogSize = 50;

  private constructor() {
    this.whatsappService = new WhatsAppService();
  }

  static getInstance(): WhatsAppDiagnostics {
    if (!WhatsAppDiagnostics.instance) {
      WhatsAppDiagnostics.instance = new WhatsAppDiagnostics();
    }
    return WhatsAppDiagnostics.instance;
  }

  // Log errors for diagnostic purposes
  logError(error: string, context: string = 'unknown') {
    const timestamp = new Date().toISOString();
    this.errorLog.unshift({ timestamp, error, context });
    
    // Keep only the most recent errors
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxErrorLogSize);
    }
    
    console.error(`📱 WhatsApp Error [${context}]:`, error);
  }

  // Run comprehensive diagnostics
  async runDiagnostics(): Promise<WhatsAppDiagnosticResult> {
    const timestamp = new Date().toISOString();
    const recommendations: string[] = [];

    try {
      // Check connection health
      const connectionHealth = await this.whatsappService.checkConnectionHealth();
      
      // Check settings
      const settings = await this.whatsappService.getSettings();
      const settingsInfo = {
        configured: !!(settings.whatsapp_instance_id && settings.whatsapp_green_api_key),
        instanceId: settings.whatsapp_instance_id,
        apiKey: settings.whatsapp_green_api_key ? '***configured***' : undefined
      };

      // Generate recommendations based on findings
      if (!settingsInfo.configured) {
        recommendations.push('Configure WhatsApp Green API credentials in settings');
      }

      if (!connectionHealth.healthy) {
        if (connectionHealth.status === 'not_authorized') {
          recommendations.push('Scan QR code to authorize WhatsApp connection');
        } else if (connectionHealth.status === 'blocked') {
          recommendations.push('WhatsApp account is blocked. Contact support or use a different number');
        } else if (connectionHealth.status === 'api_error') {
          recommendations.push('Check Green API credentials and network connection');
        }
      }

      // Check for recent 400 errors
      const recent400Errors = this.errorLog.filter(
        error => error.error.includes('400') && 
        new Date(error.timestamp).getTime() > Date.now() - (5 * 60 * 1000) // Last 5 minutes
      );

      if (recent400Errors.length > 0) {
        recommendations.push(`Found ${recent400Errors.length} recent 400 errors. Check phone number formats and API credentials`);
      }

      return {
        timestamp,
        connectionHealth,
        settings: settingsInfo,
        recentErrors: this.errorLog.slice(0, 10), // Last 10 errors
        recommendations
      };

    } catch (error) {
      this.logError(error instanceof Error ? error.message : 'Unknown error', 'diagnostics');
      
      return {
        timestamp,
        connectionHealth: { healthy: false, status: 'diagnostic_error', error: 'Failed to run diagnostics' },
        settings: { configured: false },
        recentErrors: this.errorLog.slice(0, 10),
        recommendations: ['Check console for detailed error information']
      };
    }
  }

  // Get a quick status summary
  async getQuickStatus(): Promise<{ healthy: boolean; status: string; error?: string }> {
    try {
      return await this.whatsappService.checkConnectionHealth();
    } catch (error) {
      this.logError(error instanceof Error ? error.message : 'Unknown error', 'quick_status');
      return { healthy: false, status: 'error', error: 'Failed to check status' };
    }
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
    console.log('📱 WhatsApp error log cleared');
  }

  // Get error statistics
  getErrorStats(): { total: number; recent: number; byContext: Record<string, number> } {
    const recent = this.errorLog.filter(
      error => new Date(error.timestamp).getTime() > Date.now() - (60 * 60 * 1000) // Last hour
    ).length;

    const byContext: Record<string, number> = {};
    this.errorLog.forEach(error => {
      byContext[error.context] = (byContext[error.context] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      recent,
      byContext
    };
  }

  // Monitor rate limiting issues
  async monitorRateLimiting(): Promise<{
    isRateLimited: boolean;
    recommendations: string[];
    lastError?: string;
    errorCount: number;
  }> {
    const recentRateLimitErrors = this.errorLog.filter(
      error => error.error.includes('429') || error.error.includes('Rate limit') &&
      new Date(error.timestamp).getTime() > Date.now() - (10 * 60 * 1000) // Last 10 minutes
    );

    const recommendations: string[] = [];
    let isRateLimited = false;

    if (recentRateLimitErrors.length > 0) {
      isRateLimited = true;
      recommendations.push(`Found ${recentRateLimitErrors.length} rate limit errors in the last 10 minutes`);
      recommendations.push('Consider increasing connection check intervals');
      recommendations.push('Check if multiple components are making simultaneous API calls');
    }

    // Check for frequent connection checks
    const frequentChecks = this.errorLog.filter(
      error => error.context === 'connection_check' &&
      new Date(error.timestamp).getTime() > Date.now() - (5 * 60 * 1000) // Last 5 minutes
    );

    if (frequentChecks.length > 5) {
      recommendations.push('Too many connection checks detected. Consider reducing frequency');
    }

    return {
      isRateLimited,
      recommendations,
      lastError: recentRateLimitErrors[0]?.error,
      errorCount: recentRateLimitErrors.length
    };
  }

  // Get system recommendations
  async getSystemRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Check rate limiting
    const rateLimitStatus = await this.monitorRateLimiting();
    recommendations.push(...rateLimitStatus.recommendations);

    // Check connection health
    const connectionHealth = await this.whatsappService.checkConnectionHealth();
    if (!connectionHealth.healthy) {
      recommendations.push(`Connection issue: ${connectionHealth.error}`);
    }

    // Check for 400 errors
    const recent400Errors = this.errorLog.filter(
      error => error.error.includes('400') && 
      new Date(error.timestamp).getTime() > Date.now() - (5 * 60 * 1000)
    );

    if (recent400Errors.length > 0) {
      recommendations.push(`Found ${recent400Errors.length} recent 400 errors. Check query parameters and data formats`);
    }

    return recommendations;
  }
}

// Export a convenience function
export const runWhatsAppDiagnostics = () => WhatsAppDiagnostics.getInstance().runDiagnostics();
export const getWhatsAppStatus = () => WhatsAppDiagnostics.getInstance().getQuickStatus();
export const logWhatsAppError = (error: string, context?: string) => 
  WhatsAppDiagnostics.getInstance().logError(error, context);
