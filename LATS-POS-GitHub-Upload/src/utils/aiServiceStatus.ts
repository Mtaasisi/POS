// AI Service Status Management Utility

export interface AIServiceStatus {
  isAvailable: boolean;
  lastError?: string;
  lastErrorTime?: number;
  retryAfter?: number;
  requestCount: number;
  maxRequestsPerMinute: number;
}

export class AIServiceStatusManager {
  private static instance: AIServiceStatusManager;
  private status: AIServiceStatus = {
    isAvailable: true,
    requestCount: 0,
    maxRequestsPerMinute: 1
  };

  private constructor() {}

  static getInstance(): AIServiceStatusManager {
    if (!AIServiceStatusManager.instance) {
      AIServiceStatusManager.instance = new AIServiceStatusManager();
    }
    return AIServiceStatusManager.instance;
  }

  updateStatus(update: Partial<AIServiceStatus>) {
    this.status = { ...this.status, ...update };
  }

  getStatus(): AIServiceStatus {
    return { ...this.status };
  }

  isServiceAvailable(): boolean {
    if (!this.status.isAvailable) {
      if (this.status.retryAfter && Date.now() < this.status.retryAfter) {
        return false;
      }
      // Auto-recover if retry time has passed
      this.status.isAvailable = true;
      this.status.lastError = undefined;
      this.status.retryAfter = undefined;
    }
    return this.status.isAvailable;
  }

  getStatusMessage(): string {
    if (!this.status.isAvailable) {
      if (this.status.retryAfter) {
        const remainingTime = Math.ceil((this.status.retryAfter - Date.now()) / 1000);
        return `AI service temporarily unavailable. Retry in ${remainingTime} seconds.`;
      }
      return 'AI service temporarily unavailable. Please try again later.';
    }

    if (this.status.requestCount >= this.status.maxRequestsPerMinute) {
      return 'AI service rate limit reached. Please wait before making another request.';
    }

    return 'AI service is available.';
  }

  getStatusColor(): 'green' | 'yellow' | 'red' {
    if (!this.status.isAvailable) return 'red';
    if (this.status.requestCount >= this.status.maxRequestsPerMinute) return 'yellow';
    return 'green';
  }

  incrementRequestCount() {
    this.status.requestCount++;
    // Reset counter after 1 minute
    setTimeout(() => {
      this.status.requestCount = Math.max(0, this.status.requestCount - 1);
    }, 60000);
  }

  markServiceUnavailable(error: string, retryAfterMs: number = 300000) {
    this.status.isAvailable = false;
    this.status.lastError = error;
    this.status.lastErrorTime = Date.now();
    this.status.retryAfter = Date.now() + retryAfterMs;
  }
}

// Export singleton instance
export const aiServiceStatus = AIServiceStatusManager.getInstance();

// Helper function to get user-friendly status message
export function getAIServiceStatusMessage(): string {
  return aiServiceStatus.getStatusMessage();
}

// Helper function to check if AI service is ready for requests
export function isAIServiceReady(): boolean {
  return aiServiceStatus.isServiceAvailable();
}

// Helper function to log current status (useful for debugging)
export function logAIServiceStatus(): void {
  const status = aiServiceStatus.getStatus();
  const message = aiServiceStatus.getStatusMessage();
  
  console.log('🤖 AI Service Status:', {
    isAvailable: status.isAvailable,
    requestCount: status.requestCount,
    maxRequestsPerMinute: status.maxRequestsPerMinute,
    lastError: status.lastError,
    retryAfter: status.retryAfter ? new Date(status.retryAfter).toLocaleTimeString() : null,
    message: message
  });
}
