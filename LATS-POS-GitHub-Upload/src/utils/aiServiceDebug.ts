// AI Service Debug Utility

import { aiServiceStatus } from './aiServiceStatus';

export class AIServiceDebugger {
  private static instance: AIServiceDebugger;
  private debugMode: boolean = false;

  private constructor() {
    // Enable debug mode in development
    this.debugMode = import.meta.env.DEV;
  }

  static getInstance(): AIServiceDebugger {
    if (!AIServiceDebugger.instance) {
      AIServiceDebugger.instance = new AIServiceDebugger();
    }
    return AIServiceDebugger.instance;
  }

  enableDebugMode() {
    this.debugMode = true;
    console.log('🔧 AI Service Debug Mode Enabled');
  }

  disableDebugMode() {
    this.debugMode = false;
    console.log('🔧 AI Service Debug Mode Disabled');
  }

  log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`🤖 [AI Debug] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any) {
    if (this.debugMode) {
      console.warn(`⚠️ [AI Debug] ${message}`, data || '');
    }
  }

  error(message: string, error?: any) {
    if (this.debugMode) {
      console.error(`❌ [AI Debug] ${message}`, error || '');
    }
  }

  getServiceStatus() {
    const status = aiServiceStatus.getStatus();
    this.log('Current AI Service Status:', status);
    return status;
  }

  getDetailedStatus() {
    const status = aiServiceStatus.getStatus();
    const now = Date.now();
    
    const details = {
      ...status,
      timeSinceLastError: status.lastErrorTime ? now - status.lastErrorTime : null,
      timeUntilRetry: status.retryAfter ? status.retryAfter - now : null,
      isReady: aiServiceStatus.isServiceAvailable(),
      statusMessage: aiServiceStatus.getStatusMessage()
    };

    this.log('Detailed AI Service Status:', details);
    return details;
  }

  // Test AI service availability
  async testServiceAvailability() {
    this.log('Testing AI service availability...');
    
    const status = this.getDetailedStatus();
    
    if (status.isReady) {
      this.log('✅ AI service is ready for requests');
      return true;
    } else {
      this.warn('❌ AI service is not ready', {
        reason: status.statusMessage,
        timeUntilRetry: status.timeUntilRetry ? `${Math.ceil(status.timeUntilRetry / 1000)}s` : 'Unknown'
      });
      return false;
    }
  }

  // Monitor service for a period
  startMonitoring(durationMs: number = 60000) {
    if (!this.debugMode) return;

    this.log(`Starting AI service monitoring for ${durationMs / 1000}s...`);
    
    const interval = setInterval(() => {
      this.getDetailedStatus();
    }, 5000);

    setTimeout(() => {
      clearInterval(interval);
      this.log('AI service monitoring stopped');
    }, durationMs);
  }
}

// Export singleton instance
export const aiServiceDebug = AIServiceDebugger.getInstance();

// Global debug function for console access
if (typeof window !== 'undefined') {
  (window as any).aiServiceDebug = aiServiceDebug;
  (window as any).aiServiceStatus = aiServiceStatus;
}
