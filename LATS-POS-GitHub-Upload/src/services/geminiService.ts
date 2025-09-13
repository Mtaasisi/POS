// Gemini AI Service for Clean App
// Alternative to OpenAI with generous free tier

import { aiServiceStatus } from '../utils/aiServiceStatus';
import { APP_CONFIG } from '../config/appConfig';

export interface GeminiResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface GeminiConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

class GeminiService {
  private apiKey: string | null = null;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';
  private config: GeminiConfig = {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 1000
  };

  // Enhanced rate limiting - More conservative to avoid 429 errors
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private readonly maxRequestsPerMinute: number = 1; // Reduced to 1 request per minute
  private readonly minRequestInterval: number = 60000; // Increased to 60 seconds

  // Service status tracking
  private serviceAvailable: boolean = true;
  private lastErrorTime: number = 0;
  private readonly errorCooldown: number = 300000; // Increased to 5 minutes
  private consecutiveErrors: number = 0;
  private readonly maxConsecutiveErrors: number = 2; // Reduced to 2

  // Request queue for better rate limiting
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    // Initialize with environment variable
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
    
    // Initialize status manager
    aiServiceStatus.updateStatus({
      isAvailable: true,
      requestCount: 0,
      maxRequestsPerMinute: this.maxRequestsPerMinute
    });
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private isServiceEnabled(): boolean {
    return APP_CONFIG.ai.enabled && APP_CONFIG.ai.gemini.enabled;
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // Check if service is in cooldown after errors
    if (!this.serviceAvailable && (now - this.lastErrorTime) < this.errorCooldown) {
      console.warn('⚠️ Gemini service in cooldown, cannot make request');
      return false;
    }
    
    // Check rate limiting
    if (this.requestCount >= this.maxRequestsPerMinute) {
      console.warn('⚠️ Rate limit reached, cannot make request');
      return false;
    }
    
    // Check minimum interval
    if ((now - this.lastRequestTime) < this.minRequestInterval) {
      console.warn('⚠️ Minimum interval not met, cannot make request');
      return false;
    }
    
    return true;
  }

  private updateRequestTracking() {
    this.requestCount++;
    this.lastRequestTime = Date.now();
    
    // Update status manager
    aiServiceStatus.incrementRequestCount();
    
    // Reset counter after 1 minute
    setTimeout(() => {
      this.requestCount = Math.max(0, this.requestCount - 1);
    }, 60000);
  }

  private markServiceUnavailable() {
    this.serviceAvailable = false;
    this.lastErrorTime = Date.now();
    this.consecutiveErrors++;
    
    // Exponential backoff based on consecutive errors
    const backoffTime = Math.min(this.errorCooldown * Math.pow(2, this.consecutiveErrors - 1), 900000); // Max 15 minutes
    
    console.warn(`⚠️ Gemini service marked unavailable. Backoff time: ${backoffTime / 1000}s (error #${this.consecutiveErrors})`);
    
    // Update status manager
    aiServiceStatus.markServiceUnavailable('Rate limit exceeded', backoffTime);
    
    // Re-enable service after backoff
    setTimeout(() => {
      this.serviceAvailable = true;
      console.log('✅ Gemini service re-enabled after backoff');
      aiServiceStatus.updateStatus({ isAvailable: true });
    }, backoffTime);
  }

  private resetErrorCount() {
    this.consecutiveErrors = 0;
  }

  // Queue-based request handling
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
          // Wait between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, this.minRequestInterval));
        } catch (error) {
          console.error('Error processing queued request:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  async testConnection(): Promise<GeminiResponse> {
    // Check if AI service is enabled in configuration
    if (!this.isServiceEnabled()) {
      console.log('🤖 AI service disabled in configuration, skipping connection test');
      return {
        success: false,
        error: 'AI service disabled in configuration'
      };
    }

    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured'
      };
    }

    return this.queueRequest(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/${this.config.model}:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Hello, this is a test message.' }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10
            }
          })
        });

        if (response.ok) {
          this.serviceAvailable = true;
          this.resetErrorCount();
          return { success: true, data: 'Connection successful' };
        } else {
          this.markServiceUnavailable();
          return { success: false, error: `Connection failed: ${response.status}` };
        }
      } catch (error) {
        this.markServiceUnavailable();
        return { success: false, error: `Connection error: ${error}` };
      }
    });
  }

  async chat(messages: Array<{ role: 'user' | 'model'; content: string }>): Promise<GeminiResponse> {
    // Check if AI service is enabled in configuration
    if (!this.isServiceEnabled()) {
      console.log('🤖 AI service disabled in configuration, returning fallback response');
      return {
        success: false,
        error: 'AI service disabled in configuration'
      };
    }

    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured'
      };
    }

    if (!this.canMakeRequest()) {
      return {
        success: false,
        error: 'Service temporarily unavailable due to rate limiting or errors'
      };
    }

    return this.queueRequest(async () => {
      try {
        this.updateRequestTracking();

        const contents = messages.map(msg => ({
          parts: [{ text: msg.content }],
          role: msg.role === 'user' ? 'user' : 'model'
        }));

        const response = await fetch(`${this.baseUrl}/${this.config.model}:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxTokens
            }
          })
        });

        const data = await response.json();
        
        if (response.status === 429) {
          console.warn('🚫 Gemini API rate limit exceeded (429). Service will be unavailable for backoff period.');
          this.markServiceUnavailable();
          return {
            success: false,
            error: 'API rate limit exceeded. Please try again later.'
          };
        }
        
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          this.serviceAvailable = true;
          this.resetErrorCount(); // Reset error count on successful request
          console.log('✅ Gemini API request successful');
          return {
            success: true,
            data: data.candidates[0].content.parts[0].text
          };
        } else {
          console.warn('❌ Gemini API request failed:', data.error?.message || 'Unknown error');
          this.markServiceUnavailable();
          return {
            success: false,
            error: data.error?.message || 'AI request failed'
          };
        }
      } catch (error) {
        this.markServiceUnavailable();
        return {
          success: false,
          error: `Network error: ${error}`
        };
      }
    });
  }

  // Customer service AI with fallback
  async generateCustomerResponse(customerQuery: string, context?: string): Promise<GeminiResponse> {
    // Try AI first
    const aiResponse = await this.chat([
      {
        role: 'user',
        content: `You are a helpful customer service representative. Please respond to this customer query in a friendly and professional manner: "${customerQuery}"${context ? `\n\nContext: ${context}` : ''}`
      }
    ]);

    if (aiResponse.success) {
      return aiResponse;
    }

    // Fallback to predefined responses
    return {
      success: true,
      data: this.getFallbackCustomerResponse(customerQuery)
    };
  }

  // Inventory AI with fallback
  async generateInventoryResponse(query: string, productData?: any): Promise<GeminiResponse> {
    // Try AI first
    const aiResponse = await this.chat([
      {
        role: 'user',
        content: `You are an inventory management assistant. Please help with this inventory query: "${query}"${productData ? `\n\nProduct Data: ${JSON.stringify(productData)}` : ''}`
      }
    ]);

    if (aiResponse.success) {
      return aiResponse;
    }

    // Fallback to predefined responses
    return {
      success: true,
      data: this.getFallbackInventoryResponse(query)
    };
  }

  // Expense analysis AI with fallback
  async analyzeExpense(description: string, amount: number): Promise<GeminiResponse> {
    // Try AI first
    const aiResponse = await this.chat([
      {
        role: 'user',
        content: `Please analyze this business expense and provide insights: Description: "${description}", Amount: $${amount}`
      }
    ]);

    if (aiResponse.success) {
      return aiResponse;
    }

    // Fallback to predefined analysis
    return {
      success: true,
      data: this.getFallbackExpenseAnalysis(description, amount)
    };
  }

  // Fallback response generators
  private getFallbackCustomerResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return "Hello! Thank you for contacting us. How can I assist you today?";
    }
    
    if (lowerQuery.includes('help') || lowerQuery.includes('support')) {
      return "I'm here to help! Please let me know what specific assistance you need, and I'll do my best to support you.";
    }
    
    if (lowerQuery.includes('price') || lowerQuery.includes('cost')) {
      return "For pricing information, please contact our sales team or check our website. I can also help you find specific product details.";
    }
    
    if (lowerQuery.includes('order') || lowerQuery.includes('purchase')) {
      return "I'd be happy to help you with your order! Please provide more details about what you're looking to purchase.";
    }
    
    return "Thank you for your message. I'm here to help with any questions or concerns you may have. Please let me know how I can assist you further.";
  }

  private getFallbackInventoryResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('stock') || lowerQuery.includes('available')) {
      return "I can help you check stock availability. Please specify which product you're looking for, and I'll check our inventory.";
    }
    
    if (lowerQuery.includes('product') || lowerQuery.includes('item')) {
      return "I can help you find product information. Please provide the product name or category you're interested in.";
    }
    
    if (lowerQuery.includes('order') || lowerQuery.includes('purchase')) {
      return "I can help you with inventory-related orders. Please let me know what products you need and the quantity.";
    }
    
    return "I'm here to help with inventory management. Please let me know what specific information you need about our products or stock levels.";
  }

  private getFallbackExpenseAnalysis(description: string, amount: number): string {
    const analysis = `Expense Analysis:
    
Description: ${description}
Amount: $${amount}

Key Insights:
• This appears to be a business expense
• Amount: $${amount}
• Category: ${this.categorizeExpense(description)}

Recommendations:
• Keep detailed records for tax purposes
• Consider if this expense is necessary for business operations
• Review if there are more cost-effective alternatives

Please consult with your accountant for specific tax advice.`;

    return analysis;
  }

  private categorizeExpense(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('office') || lowerDesc.includes('supplies')) return 'Office Supplies';
    if (lowerDesc.includes('travel') || lowerDesc.includes('transport')) return 'Travel';
    if (lowerDesc.includes('meal') || lowerDesc.includes('food')) return 'Meals & Entertainment';
    if (lowerDesc.includes('equipment') || lowerDesc.includes('hardware')) return 'Equipment';
    if (lowerDesc.includes('software') || lowerDesc.includes('subscription')) return 'Software/Subscriptions';
    if (lowerDesc.includes('marketing') || lowerDesc.includes('advertising')) return 'Marketing';
    
    return 'General Business Expense';
  }

  // Get rate limit status
  getRateLimitStatus() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const requestsRemaining = Math.max(0, this.maxRequestsPerMinute - this.requestCount);
    const canMakeRequest = this.isServiceEnabled() && this.canMakeRequest();
    const serviceStatus = this.isServiceEnabled() ? (this.serviceAvailable ? 'available' : 'unavailable') : 'disabled';
    
    return {
      requestsRemaining,
      timeSinceLastRequest,
      canMakeRequest,
      serviceStatus,
      maxRequestsPerMinute: this.maxRequestsPerMinute,
      minRequestInterval: this.minRequestInterval,
      errorCooldown: this.errorCooldown,
      isEnabled: this.isServiceEnabled()
    };
  }

  // Check if service is available
  isServiceAvailable(): boolean {
    return this.isServiceEnabled() && this.serviceAvailable && this.canMakeRequest();
  }
}

const geminiService = new GeminiService();
export default geminiService; 