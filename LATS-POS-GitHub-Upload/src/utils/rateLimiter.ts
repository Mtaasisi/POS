// Enhanced Rate Limiter for Green API
export class RateLimiter {
  private lastRequestTime = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private minInterval = 5000; // 5 seconds minimum between requests
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  constructor(minInterval: number = 5000) {
    this.minInterval = minInterval;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      await this.throttle();
      return await requestFn();
    } catch (error: any) {
      if (error?.status === 429 && retries > 0) {
        console.warn(`📱 Rate limited by Green-API. Retrying in ${this.retryDelay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.executeWithRetry(requestFn, retries - 1);
      }
      throw error;
    }
  }

  async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.executeWithRetry(requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
      }
    }

    this.isProcessing = false;
  }

  // Reset the rate limiter (useful for testing or after errors)
  reset(): void {
    this.lastRequestTime = 0;
    this.requestQueue = [];
    this.isProcessing = false;
  }

  // Get current queue status
  getStatus() {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      timeSinceLastRequest: Date.now() - this.lastRequestTime,
    };
  }
}

// WhatsApp rate limiter has been removed
// export const whatsappRateLimiter = new RateLimiter(5000);

// Utility function to check if we should retry a request
export const shouldRetryRequest = (error: any): boolean => {
  const retryableStatuses = [429, 500, 502, 503, 504];
  return retryableStatuses.includes(error?.status);
};

// Utility function to calculate retry delay with exponential backoff
export const calculateRetryDelay = (attempt: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
};
