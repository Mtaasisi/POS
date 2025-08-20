import { supabase } from '../lib/supabaseClient';

// Enhanced rate limiting utility with better throttling and caching
class RateLimiter {
  private lastCall: number = 0;
  private minInterval: number = 60000; // Increased to 60 seconds between calls to prevent rate limiting
  private queue: Array<() => void> = [];
  private processing: boolean = false;
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 3;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private rateLimitBackoff: number = 0; // Track rate limit backoff

  async throttle<T>(fn: () => Promise<T>, cacheKey?: string, ttl: number = 1800000): Promise<T> { // Increased default TTL to 30 minutes
    // Check cache first if cacheKey provided
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log('📋 Using cached result for:', cacheKey);
        return cached.data;
      }
    }

    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          
          // Cache result if cacheKey provided
          if (cacheKey) {
            this.cache.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
              ttl: ttl
            });
          }
          
          // Reset rate limit backoff on success
          this.rateLimitBackoff = 0;
          
          // Clear rate limit info from localStorage on success
          try {
            localStorage.removeItem('whatsapp_rate_limit_backoff');
            localStorage.removeItem('whatsapp_last_error');
            localStorage.setItem('whatsapp_last_check', Date.now().toString());
          } catch (e) {
            console.warn('Could not clear rate limit info from localStorage:', e);
          }
          resolve(result);
        } catch (error) {
          // Handle rate limit errors specifically
          if (error instanceof Error && (error.message.includes('429') || error.message.includes('Rate limit'))) {
            this.rateLimitBackoff = Math.min(this.rateLimitBackoff * 2 + 300000, 1800000); // Exponential backoff up to 30 minutes
            console.warn(`🚫 Rate limit hit, backing off for ${this.rateLimitBackoff}ms`);
            
            // Store rate limit info in localStorage for monitoring
            try {
              localStorage.setItem('whatsapp_rate_limit_backoff', (Date.now() + this.rateLimitBackoff).toString());
              localStorage.setItem('whatsapp_last_error', error.message);
              const errorCount = parseInt(localStorage.getItem('whatsapp_error_count') || '0') + 1;
              localStorage.setItem('whatsapp_error_count', errorCount.toString());
              localStorage.setItem('whatsapp_last_check', Date.now().toString());
            } catch (e) {
              console.warn('Could not store rate limit info in localStorage:', e);
            }
          }
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCall;
      
      // Use rate limit backoff if active, otherwise use adaptive interval
      const currentInterval = this.rateLimitBackoff > 0 
        ? this.rateLimitBackoff
        : this.consecutiveErrors >= this.maxConsecutiveErrors 
          ? this.minInterval * Math.pow(2, this.consecutiveErrors - this.maxConsecutiveErrors + 1) // Exponential backoff
          : this.minInterval;
      
      if (timeSinceLastCall < currentInterval) {
        await new Promise(resolve => setTimeout(resolve, currentInterval - timeSinceLastCall));
      }
      
      const fn = this.queue.shift();
      if (fn) {
        this.lastCall = Date.now();
        try {
          await fn();
          // Reset consecutive errors on success
          this.consecutiveErrors = 0;
        } catch (error) {
          this.consecutiveErrors++;
          console.warn(`Rate limiter error (${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`, error);
        }
      }
    }
    
    this.processing = false;
  }

  // Clear cache for specific key or all
  clearCache(cacheKey?: string) {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }
}

  // Connection manager for better stability
  class ConnectionManager {
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private baseDelay: number = 1000;
    private isConnected: boolean = false;
    private connectionCallbacks: Array<(status: boolean) => void> = [];
    private reconnectionTimeout: NodeJS.Timeout | null = null;

  onConnectionChange(callback: (status: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  private notifyConnectionChange(status: boolean) {
    this.isConnected = status;
    this.connectionCallbacks.forEach(callback => callback(status));
  }

  async reconnectWithBackoff(): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ Max reconnection attempts reached');
      return false;
    }

    const delay = Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`🔄 Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    this.reconnectAttempts++;
    
    // Attempt reconnection logic here
    const success = await this.attemptReconnection();
    
    if (success) {
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);
    }
    
    return success;
  }

  resetReconnectionAttempts(): void {
    this.reconnectAttempts = 0;
    console.log('🔄 Reconnection attempts reset');
  }

  scheduleReconnection(delay?: number): void {
    // Clear any existing timeout
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
    }

    const reconnectDelay = delay || Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`⏰ Scheduling reconnection in ${reconnectDelay}ms`);

    this.reconnectionTimeout = setTimeout(async () => {
      console.log('🔄 Executing scheduled reconnection...');
      await this.reconnectWithBackoff();
    }, reconnectDelay);
  }

  cancelScheduledReconnection(): void {
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
      console.log('❌ Cancelled scheduled reconnection');
    }
  }

  private async attemptReconnection(): Promise<boolean> {
    try {
      // Test connection with a simple API call
      const settings = await this.getSettings();
      const { whatsapp_instance_id, whatsapp_green_api_key } = settings;
      
      if (!whatsapp_instance_id || !whatsapp_green_api_key) {
        return false;
      }

      const testUrl = `https://api.green-api.com/waInstance${whatsapp_instance_id}/getStateInstance/${whatsapp_green_api_key}`;
      const response = await fetch(testUrl, { method: 'GET' });
      
      if (response.ok) {
        console.log('✅ Reconnection successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
    }
    
    return false;
  }

  private async getSettings(): Promise<any> {
    // This would be implemented to get WhatsApp settings
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) throw error;
    
    const settings: any = {};
    data?.forEach(item => {
      settings[item.key] = item.value;
    });
    return settings;
  }
}

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  sender: string;
  recipient: string;
  content: string;
  type: 'text' | 'media' | 'template';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  mediaUrl?: string;
  templateId?: string;
  error?: string;
}

export interface WhatsAppChat {
  id: string;
  customer_id?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  is_archived?: boolean;
  tags?: string[];
  assigned_to?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppWebhook {
  type: 'message' | 'status' | 'contact';
  data: any;
  timestamp: string;
}

export class WhatsAppService {
  private settingsCache: { value: any; fetchedAt: number } | null = null;
  private realtimeSubscription: any = null;
  private messageCallbacks: ((message: WhatsAppMessage) => void)[] = [];
  private statusCallbacks: ((status: any) => void)[] = [];
  private rateLimiter = new RateLimiter();
  private connectionManager = new ConnectionManager();
  
  // Reconnection tracking properties
  private reconnectionAttempts: number = 0;
  private maxReconnectionAttempts: number = 5;
  private lastReconnectionAttempt: number = 0;
  private reconnectionCooldown: number = 30000; // 30 seconds cooldown between attempts
  
  // Prevent multiple simultaneous initialization
  private isInitializing: boolean = false;
  private isReconnecting: boolean = false; // New property for reconnection tracking

  constructor() {
    // Set up connection monitoring
    this.connectionManager.onConnectionChange((status) => {
      console.log(`📡 WhatsApp connection status: ${status ? 'CONNECTED' : 'DISCONNECTED'}`);
      this.notifyStatusChange({ type: 'connection', status });
    });
  }

  private async getSettings(): Promise<any> {
    const now = Date.now();
    if (this.settingsCache && now - this.settingsCache.fetchedAt < 60000) {
      return this.settingsCache.value;
    }
    
    try {
      const { data, error } = await supabase.from('settings').select('key, value');
      const DEFAULTS = {
        whatsapp_green_api_key: '',
        whatsapp_instance_id: '',
        whatsapp_api_url: '',
        whatsapp_media_url: '',
        whatsapp_enable_bulk: true,
        whatsapp_enable_auto: true,
        whatsapp_log_retention_days: 365,
        whatsapp_notification_email: '',
        whatsapp_webhook_url: '',
        whatsapp_enable_realtime: true,
      };
      const settings: any = { ...DEFAULTS };
      if (!error && data) {
        data.forEach((row: any) => {
          if (row.key in settings) {
            settings[row.key] = row.value;
          }
        });
      }
      this.settingsCache = { value: settings, fetchedAt: now };
      return settings;
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
      return {
        whatsapp_green_api_key: '',
        whatsapp_instance_id: '',
        whatsapp_enable_bulk: true,
        whatsapp_enable_auto: true,
        whatsapp_enable_realtime: true,
      };
    }
  }

  // Initialize real-time subscriptions
  async initializeRealtime() {
    // Prevent multiple simultaneous initialization calls
    if (this.isInitializing) {
      console.log('🔄 WhatsApp real-time initialization already in progress, skipping...');
      return;
    }
    
    this.isInitializing = true;
    
    try {
      const settings = await this.getSettings();
      if (!settings.whatsapp_enable_realtime) {
        console.log('WhatsApp real-time disabled in settings');
        this.isInitializing = false;
        return;
      }

      // Clean up any existing subscription first
      if (this.realtimeSubscription) {
        console.log('🔄 Cleaning up existing real-time subscription...');
        supabase.removeChannel(this.realtimeSubscription);
        this.realtimeSubscription = null;
      }

      console.log('📡 Initializing WhatsApp real-time subscription...');

      // Subscribe to new messages with improved error handling
      this.realtimeSubscription = supabase
        .channel('whatsapp_messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
          (payload) => {
            console.log('📨 New WhatsApp message received:', payload);
            const message = payload.new as WhatsAppMessage;
            this.messageCallbacks.forEach(callback => callback(message));
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
          (payload) => {
            console.log('📊 WhatsApp message status update:', payload);
            const status = payload.new;
            this.statusCallbacks.forEach(callback => callback(status));
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'whatsapp_chats' },
          (payload) => {
            console.log('💬 WhatsApp chat update:', payload);
          }
        )
        .subscribe((status) => {
          console.log('📡 WhatsApp real-time subscription status:', status);
          
          // Handle different subscription statuses
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ WhatsApp real-time subscription established successfully');
              this.notifyStatusChange({ type: 'subscription', status: 'connected' });
              // Reset reconnection attempts on successful connection
              this.reconnectionAttempts = 0;
              break;
            case 'CLOSED':
              console.log('🔴 WhatsApp real-time subscription closed');
              this.notifyStatusChange({ type: 'subscription', status: 'disconnected' });
              // Only attempt reconnection if we haven't exceeded the limit
              if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                setTimeout(() => this.attemptReconnection(), 5000);
              } else {
                console.log('🚫 Max reconnection attempts reached, stopping auto-reconnect');
                this.notifyStatusChange({ type: 'subscription', status: 'max_attempts_reached' });
              }
              break;
            case 'CHANNEL_ERROR':
              console.log('❌ WhatsApp real-time subscription error');
              this.notifyStatusChange({ type: 'subscription', status: 'error' });
              // Only attempt reconnection if we haven't exceeded the limit
              if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                setTimeout(() => this.attemptReconnection(), 10000);
              } else {
                console.log('🚫 Max reconnection attempts reached, stopping auto-reconnect');
                this.notifyStatusChange({ type: 'subscription', status: 'max_attempts_reached' });
              }
              break;
            case 'TIMED_OUT':
              console.log('⏰ WhatsApp real-time subscription timed out');
              this.notifyStatusChange({ type: 'subscription', status: 'timeout' });
              // Only attempt reconnection if we haven't exceeded the limit
              if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                setTimeout(() => this.attemptReconnection(), 3000);
              } else {
                console.log('🚫 Max reconnection attempts reached, stopping auto-reconnect');
                this.notifyStatusChange({ type: 'subscription', status: 'max_attempts_reached' });
              }
              break;
            default:
              console.log('📡 WhatsApp real-time subscription status:', status);
              break;
          }
        });

      // Add error handling for the subscription
      if (this.realtimeSubscription) {
        this.realtimeSubscription.on('error', (error: any) => {
          console.error('❌ WhatsApp real-time subscription error:', error);
          this.notifyStatusChange({ type: 'subscription', status: 'error', error });
        });
      }

    } catch (error) {
      console.error('Failed to initialize WhatsApp real-time:', error);
      this.notifyStatusChange({ type: 'subscription', status: 'error', error });
    } finally {
      this.isInitializing = false;
    }
  }

  // Attempt to reconnect the real-time subscription
  private async attemptReconnection() {
    try {
      // Check if we're already attempting reconnection
      if (this.isReconnecting) {
        console.log('⏳ Reconnection already in progress, skipping...');
        return;
      }

      this.isReconnecting = true;
      this.reconnectionAttempts++;

      console.log(`🔄 Attempting to reconnect WhatsApp real-time subscription (attempt ${this.reconnectionAttempts}/${this.maxReconnectionAttempts})...`);

      // Clean up existing subscription
      if (this.realtimeSubscription) {
        console.log('🔄 Cleaning up existing real-time subscription...');
        supabase.removeChannel(this.realtimeSubscription);
        this.realtimeSubscription = null;
      }

      // Wait a bit before attempting to reconnect
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Initialize new subscription
      await this.initializeRealtime();

    } catch (error) {
      console.error('❌ Reconnection attempt failed:', error);
      this.notifyStatusChange({ type: 'subscription', status: 'reconnection_failed', error });
    } finally {
      this.isReconnecting = false;
      
      // Add cooldown period to prevent rapid reconnection attempts
      if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
        const cooldownTime = Math.min(5000 * this.reconnectionAttempts, 30000); // Max 30 seconds
        console.log(`⏳ Reconnection cooldown active (${cooldownTime / 1000}s remaining)`);
        
        setTimeout(() => {
          // Only attempt reconnection if we're still disconnected
          if (!this.realtimeSubscription || this.realtimeSubscription.state === 'CLOSED') {
            this.attemptReconnection();
          }
        }, cooldownTime);
      }
    }
  }

  // Subscribe to new messages
  onMessage(callback: (message: WhatsAppMessage) => void) {
    this.messageCallbacks.push(callback);
  }

  // Subscribe to status updates
  onStatusUpdate(callback: (status: any) => void) {
    this.statusCallbacks.push(callback);
  }

  // Notify all status callbacks and dispatch custom events
  private notifyStatusChange(status: any) {
    this.statusCallbacks.forEach(callback => callback(status));
    
    // Dispatch custom events for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('whatsapp-status-change', { detail: status }));
    }
  }

  // Unsubscribe from real-time updates
  unsubscribe() {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
    this.messageCallbacks = [];
    this.statusCallbacks = [];
    
    // Reset reconnection tracking
    this.reconnectionAttempts = 0;
    this.lastReconnectionAttempt = 0;
    this.isInitializing = false;
  }

  // Reset reconnection attempts (useful for manual reconnection)
  resetReconnectionAttempts() {
    this.reconnectionAttempts = 0;
    this.lastReconnectionAttempt = 0;
    this.isInitializing = false;
    console.log('🔄 Reconnection attempts reset');
  }

  // Check if currently initializing
  isCurrentlyInitializing(): boolean {
    return this.isInitializing;
  }

  // Get current connection status
  getConnectionStatus(): { isInitializing: boolean; reconnectionAttempts: number; maxAttempts: number; lastAttempt: number } {
    return {
      isInitializing: this.isInitializing,
      reconnectionAttempts: this.reconnectionAttempts,
      maxAttempts: this.maxReconnectionAttempts,
      lastAttempt: this.lastReconnectionAttempt
    };
  }

  // Connect to Green API (store credentials securely)
  async connect(instanceId: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Test the connection first
      const testResult = await this.testConnection(instanceId, apiKey);
      if (!testResult.success) {
        return testResult;
      }

      // Save to settings table (admin only)
      const { error } = await supabase.from('settings').upsert([
        { key: 'whatsapp_instance_id', value: instanceId },
        { key: 'whatsapp_green_api_key', value: apiKey }
      ], { onConflict: 'key' });
      
      if (error) return { success: false, error: error.message };
      
      this.settingsCache = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Test Green API connection with rate limiting and caching
  async testConnection(instanceId: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    const cacheKey = `connection_test_${instanceId}`;
    return this.rateLimiter.throttle(async () => {
      try {
        const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/getStateInstance/${apiKey}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 429) {
          console.warn('⚠️ WhatsApp API rate limit exceeded');
          // Clear cache to force fresh check after rate limit
          this.rateLimiter.clearCache(cacheKey);
          return { success: false, error: 'Rate limit exceeded. Please wait before trying again.' };
        }
        
        if (!response.ok) {
          console.error(`❌ WhatsApp API error: ${response.status} ${response.statusText}`);
          return { success: false, error: `Connection failed: ${response.status} ${response.statusText}` };
        }
        
        const data = await response.json();
        if (data.stateInstance === 'authorized') {
          return { success: true };
        } else {
          return { success: false, error: `WhatsApp not authorized. Current state: ${data.stateInstance}` };
        }
      } catch (error) {
        console.error('❌ WhatsApp connection test failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' };
      }
    }, cacheKey, 60000); // Cache for 1 minute
  }

  // Validate phone number format for Green API
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid international format (10-15 digits)
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      return false;
    }
    
    // Check if it starts with a valid country code (1-3 digits)
    const countryCodePattern = /^[1-9]\d{0,2}/;
    if (!countryCodePattern.test(cleanNumber)) {
      return false;
    }
    
    return true;
  }

  // Send WhatsApp message via Green API with rate limiting and improved error handling
  async sendMessage(chatId: string, content: string, type: 'text' | 'media' | 'template' = 'text', mediaUrl?: string,
 templateId?: string): Promise<{ success: boolean; error?: string; messageId?: string }> {

    return this.rateLimiter.throttle(async () => {
      try {
        const settings = await this.getSettings();
        const { whatsapp_instance_id, whatsapp_green_api_key, whatsapp_api_url, whatsapp_media_url } = settings;
        
        if (!whatsapp_instance_id || !whatsapp_green_api_key) {
          return { success: false, error: 'Green API credentials not set. Please configure WhatsApp settings first.' };
        }
        
        // Validate phone number format
        if (!this.isValidPhoneNumber(chatId)) {
          return { success: false, error: 'Invalid phone number format. Please use international format (e.g., 254700000000)' };
        }
        
        // Use custom API URLs if configured, otherwise use default
        const apiBaseUrl = whatsapp_api_url || 'https://api.green-api.com';
        const mediaBaseUrl = whatsapp_media_url || 'https://media.green-api.com';
        
        let url: string;
        let body: any;
        
        // Ensure chatId is in the correct format for Green API
        const formattedChatId = chatId.includes('@c.us') ? chatId : `${chatId}@c.us`;
        
        switch (type) {
          case 'text':
            url = `${apiBaseUrl}/waInstance${whatsapp_instance_id}/sendMessage/${whatsapp_green_api_key}`;
            body = { chatId: formattedChatId, message: content };
            break;
            
          case 'media':
            if (!mediaUrl) {
              return { success: false, error: 'Media URL is required for media messages' };
            }
            url = `${mediaBaseUrl}/waInstance${whatsapp_instance_id}/sendFileByUrl/${whatsapp_green_api_key}`;
            body = { 
              chatId: formattedChatId, 
              urlFile: mediaUrl, 
              fileName: mediaUrl.split('/').pop() || 'media',
              caption: content 
            };
            break;
            
          case 'template':
            if (!templateId) {
              return { success: false, error: 'Template ID is required for template messages' };
            }
            url = `${apiBaseUrl}/waInstance${whatsapp_instance_id}/sendTemplate/${whatsapp_green_api_key}`;
            body = { chatId: formattedChatId, templateId, templateParams: [content] };
            break;
            
          default:
            return { success: false, error: 'Invalid message type' };
        }

        // Send with improved retry logic
        const result = await this.sendWithRetry(url, body);
        
        if (result.success && result.data?.idMessage) {
          // Log the message to database
          await this.logMessage({
            id: result.data.idMessage,
            chatId: formattedChatId,
            sender: 'system',
            recipient: formattedChatId,
            content,
            type,
            status: 'sent',
            timestamp: new Date().toISOString(),
            mediaUrl,
            templateId
          });
          
          return { success: true, messageId: result.data.idMessage };
        }
        
        // Handle specific error cases
        if (result.error?.includes('400')) {
          console.error('📱 WhatsApp API 400 Error:', result.error);
          // Try to reconnect if it's a connection issue
          await this.connectionManager.reconnectWithBackoff();
          return { success: false, error: 'Message delivery failed. Please check phone number format and try again.' };
        }
        
        return result;
      } catch (error) {
        console.error('❌ Error sending WhatsApp message:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
  }

  // Send with retry logic
  private async sendWithRetry(url: string, body: any, maxRetries: number = 3): Promise<{ success: boolean; error?: string; data?: any }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          if (attempt === maxRetries) {
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        if (attempt === maxRetries) {
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  }

  // Upload media file
  async uploadMedia(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const settings = await this.getSettings();
      const { whatsapp_instance_id, whatsapp_green_api_key, whatsapp_media_url } = settings;
      
      if (!whatsapp_instance_id || !whatsapp_green_api_key) {
        return { success: false, error: 'Green API credentials not set' };
      }

      const mediaBaseUrl = whatsapp_media_url || 'https://media.green-api.com';
      const url = `${mediaBaseUrl}/waInstance${whatsapp_instance_id}/uploadFile/${whatsapp_green_api_key}`;
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Upload failed: ${errorText}` };
      }
      
      const data = await response.json();
      return { success: true, url: data.urlFile };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // Fetch chat history (from your DB or Green API)
  async getChatHistory(chatId: string): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      return data as WhatsAppMessage[];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  // Fetch all chats (from your DB)
  async getChats(): Promise<WhatsAppChat[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as WhatsAppChat[];
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }

  // Bulk messaging with progress tracking
  async sendBulk(chatIds: string[], content: string, onProgress?: (progress: { sent: number; total: number; failed: number }) => void): Promise<{ success: boolean; results: Array<{ chatId: string; success: boolean; error?: string }> }> {
    try {
      const settings = await this.getSettings();
      if (!settings.whatsapp_enable_bulk) {
        return { success: false, results: chatIds.map(chatId => ({ chatId, success: false, error: 'Bulk messaging disabled' })) };
      }

      const results: Array<{ chatId: string; success: boolean; error?: string }> = [];
      let sent = 0;
      let failed = 0;

      for (const chatId of chatIds) {
        try {
          const result = await this.sendMessage(chatId, content);
          results.push({ chatId, ...result });
          
          if (result.success) {
            sent++;
          } else {
            failed++;
          }
          
          // Report progress
          if (onProgress) {
            onProgress({ sent, total: chatIds.length, failed });
          }
          
          // Rate limiting - wait between messages
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.push({ chatId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          failed++;
        }
      }

      return { success: results.every(r => r.success), results };
    } catch (error) {
      console.error('Error in bulk messaging:', error);
      return { 
        success: false, 
        results: chatIds.map(chatId => ({ 
          chatId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })) 
      };
    }
  }

  // Analytics with real data aggregation
  async getAnalytics(days: number = 30): Promise<{ total: number; sent: number; failed: number; delivered: number; read: number; responseRate: number; avgResponseTime: number }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('status, direction, sent_at')
        .gte('sent_at', startDate.toISOString());

      if (error) throw error;

      const messages = data || [];
      const total = messages.length;
      const sent = messages.filter(m => m.status === 'sent').length;
      const failed = messages.filter(m => m.status === 'failed').length;
      const delivered = messages.filter(m => m.status === 'delivered').length;
      const read = messages.filter(m => m.status === 'read').length;
      
      // Calculate response rate (inbound messages that got responses)
      const inboundMessages = messages.filter(m => m.direction === 'inbound');
      const responseRate = inboundMessages.length > 0 ? 
        (messages.filter(m => m.direction === 'outbound').length / inboundMessages.length) * 100 : 0;

      // Calculate average response time (simplified)
      const avgResponseTime = this.calculateAverageResponseTime(messages);

      return {
        total,
        sent,
        failed,
        delivered,
        read,
        responseRate: Math.round(responseRate),
        avgResponseTime
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { total: 0, sent: 0, failed: 0, delivered: 0, read: 0, responseRate: 0, avgResponseTime: 0 };
    }
  }

  // Calculate average response time
  private calculateAverageResponseTime(messages: any[]): number {
    const responseTimes: number[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].direction === 'inbound') {
        // Find next outbound message
        for (let j = i + 1; j < messages.length; j++) {
          if (messages[j].direction === 'outbound') {
            const inboundTime = new Date(messages[i].sent_at).getTime();
            const outboundTime = new Date(messages[j].sent_at).getTime();
            const responseTime = (outboundTime - inboundTime) / (1000 * 60); // in minutes
            responseTimes.push(responseTime);
            break;
          }
        }
      }
    }
    
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  // Log WhatsApp message (to your DB)
  async logMessage(msg: WhatsAppMessage): Promise<void> {
    try {
      // First, ensure we have a valid chat_id
      let chatId = msg.chatId;
      
      // If no chat_id provided or if it's a phone number format, try to find or create one
      if (!chatId || chatId.includes('@c.us')) {
        console.warn('No valid chat_id provided for WhatsApp message, attempting to find existing chat...');
        
        // Extract phone number from chatId if it's in WhatsApp format
        const phoneNumber = chatId?.replace('@c.us', '') || msg.sender || msg.recipient;
        
        // Try to find existing chat by phone number
        const { data: existingChat, error: findError } = await supabase
          .from('whatsapp_chats')
          .select('id')
          .eq('phone_number', phoneNumber)
          .limit(1)
          .single();
          
        if (findError || !existingChat) {
          console.log('Creating new chat for phone number:', phoneNumber);
          
          // Create new chat
          const { data: newChat, error: createError } = await supabase
            .from('whatsapp_chats')
            .insert({
              phone_number: phoneNumber,
              customer_name: phoneNumber, // Default name, can be updated later
              status: 'active'
            })
            .select('id')
            .single();
            
          if (createError || !newChat) {
            console.error('Could not create new chat for message:', msg);
            return;
          }
          
          chatId = newChat.id;
        } else {
          chatId = existingChat.id;
        }
      }
      
      // Validate that the chat exists before inserting
      const { data: chatExists, error: validateError } = await supabase
        .from('whatsapp_chats')
        .select('id')
        .eq('id', chatId)
        .single();
        
      if (validateError || !chatExists) {
        console.error('Invalid chat_id provided for WhatsApp message:', chatId);
        return;
      }
      
      // Now insert the message with valid chat_id
      const { error: insertError } = await supabase.from('whatsapp_messages').insert({
        chat_id: chatId,
        content: msg.content,
        message_type: msg.type,
        direction: 'outbound',
        status: msg.status,
        media_url: msg.mediaUrl,
        sent_at: msg.timestamp
      });
      
      if (insertError) {
        console.error('Error inserting WhatsApp message:', insertError);
      }
    } catch (error) {
      console.error('Error logging message:', error);
    }
  }

  // Update message status
  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed', errorMessage?: string): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'read') {
        updateData.read_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.error_message = errorMessage;
      }
      
      await supabase
        .from('whatsapp_messages')
        .update(updateData)
        .eq('id', messageId);
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // Clean old logs
  async cleanOldLogs() {
    try {
      const settings = await this.getSettings();
      const days = settings.whatsapp_log_retention_days || 365;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('whatsapp_messages')
        .delete()
        .lt('sent_at', cutoff);
    } catch (error) {
      console.error('Error cleaning old logs:', error);
    }
  }

  // Create a new WhatsApp chat for a customer
  async createChat(customerId: string): Promise<{ success: boolean; chat?: any; error?: string }> {
    try {
      // Validate customerId
      if (!customerId) {
        return { success: false, error: 'Customer ID is required' };
      }

      // Check if customer exists first
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, whatsapp, profile_image, created_at')
        .eq('id', customerId)
        .single();
      
      if (customerError) {
        return { success: false, error: `Customer not found: ${customerError.message}` };
      }

      // Check if chat already exists
      const { data: existing, error: findError } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();
        
      if (findError) return { success: false, error: findError.message };
      if (existing) return { success: true, chat: existing };
      
      // Create new chat
      const chatData = {
        customer_id: customerId,
        phone_number: customer.whatsapp || customer.phone || customerId,
        customer_name: customer.name,
        unread_count: 0,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('whatsapp_chats')
        .insert(chatData)
        .select()
        .single();
        
      if (error) return { success: false, error: error.message };
      return { success: true, chat: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get chat by customer ID
  async getChatByCustomerId(customerId: string): Promise<{ success: boolean; chat?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();
        
      if (error) return { success: false, error: error.message };
      return { success: true, chat: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Archive chat
  async archiveChat(chatId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('whatsapp_chats')
        .update({ status: 'archived' })
        .eq('id', chatId);
        
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('chat_id', chatId)
        .eq('direction', 'inbound')
        .eq('status', 'delivered');
        
      if (error) return { success: false, error: error.message };
      
      // Update chat unread count
      await supabase
        .from('whatsapp_chats')
        .update({ unread_count: 0 })
        .eq('id', chatId);
        
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Check WhatsApp connection health
  async checkConnectionHealth(): Promise<{ healthy: boolean; status: string; error?: string }> {
    const cacheKey = 'connection_health';
    return this.rateLimiter.throttle(async () => {
      try {
        const settings = await this.getSettings();
        const { whatsapp_instance_id, whatsapp_green_api_key } = settings;
        
        if (!whatsapp_instance_id || !whatsapp_green_api_key) {
          return { healthy: false, status: 'not_configured', error: 'WhatsApp credentials not configured' };
        }

        const url = `https://api.green-api.com/waInstance${whatsapp_instance_id}/getStateInstance/${whatsapp_green_api_key}`;
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.status === 429) {
          console.warn('⚠️ WhatsApp API rate limit exceeded in health check');
          this.rateLimiter.clearCache(cacheKey);
          return { 
            healthy: false, 
            status: 'rate_limited', 
            error: 'API rate limit exceeded. Please wait 30 minutes before checking again.' 
          };
        }
        
        if (!response.ok) {
          return { 
            healthy: false, 
            status: 'api_error', 
            error: `API returned ${response.status}: ${await response.text()}` 
          };
        }
        
        const data = await response.json();
        
        if (data.stateInstance === 'authorized') {
          return { healthy: true, status: 'authorized' };
        } else if (data.stateInstance === 'notAuthorized') {
          return { healthy: false, status: 'not_authorized', error: 'WhatsApp not authorized. Please scan QR code.' };
        } else if (data.stateInstance === 'blocked') {
          return { healthy: false, status: 'blocked', error: 'WhatsApp account is blocked.' };
        } else {
          return { healthy: false, status: 'unknown', error: `Unknown state: ${data.stateInstance}` };
        }
      } catch (error) {
        return { 
          healthy: false, 
          status: 'connection_error', 
          error: error instanceof Error ? error.message : 'Unknown connection error' 
        };
      }
    }, cacheKey, 3600000); // Cache for 60 minutes to reduce API calls
  }

  // Improved real-time subscription management with better error handling
  async startRealtimeSubscription(): Promise<{ success: boolean; error?: string }> {
    try {
      // Cancel any existing scheduled reconnections
      this.connectionManager.cancelScheduledReconnection();

      if (this.realtimeSubscription) {
        console.log('📡 Realtime subscription already active');
        return { success: true };
      }

      // Check connection health first (but don't fail if unhealthy)
      const health = await this.checkConnectionHealth();
      if (!health.healthy) {
        console.warn('⚠️ WhatsApp connection not healthy, but proceeding with subscription:', health.error);
      } else {
        console.log('✅ WhatsApp connection healthy, proceeding with subscription');
      }

      console.log('📡 Starting WhatsApp realtime subscription...');
      
      // Set up realtime subscription with better error handling and retry logic
      this.realtimeSubscription = supabase
        .channel('whatsapp-messages')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'whatsapp_messages' },
          (payload) => {
            console.log('📨 WhatsApp message update:', payload);
            this.messageCallbacks.forEach(callback => callback(payload.new as WhatsAppMessage));
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'whatsapp_chats' },
          (payload) => {
            console.log('💬 WhatsApp chat update:', payload);
          }
        )
        .subscribe((status) => {
          console.log('📡 WhatsApp real-time subscription status:', status);
          this.notifyStatusChange({ type: 'subscription', status });
          
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.log('🔄 Connection closed or error, attempting to reconnect...');
            // Use exponential backoff for reconnection attempts
            this.scheduleReconnection();
          } else if (status === 'SUBSCRIBED') {
            console.log('✅ Connection established successfully');
            // Reset reconnection attempts on successful connection
            this.connectionManager.resetReconnectionAttempts();
          } else if (status === 'TIMED_OUT') {
            console.log('⏰ Connection timed out, retrying...');
            this.scheduleReconnection();
          }
        });

      return { success: true };
    } catch (error) {
      console.error('❌ Error starting realtime subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Stop realtime subscription
  stopRealtimeSubscription(): void {
    if (this.realtimeSubscription) {
      console.log('🛑 Stopping WhatsApp realtime subscription...');
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
    // Cancel any scheduled reconnections
    this.connectionManager.cancelScheduledReconnection();
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnection(): void {
    this.connectionManager.scheduleReconnection();
  }

  // Connection state management to prevent multiple simultaneous calls
  private connectionCheckInProgress: boolean = false;
  private connectionCheckPromise: Promise<any> | null = null;
  private lastConnectionCheck: number = 0;

  // Centralized connection check to prevent multiple simultaneous calls
  async performConnectionCheck(): Promise<{ success: boolean; error?: string }> {
    if (this.connectionCheckInProgress && this.connectionCheckPromise) {
      console.log('⏳ Connection check already in progress, waiting...');
      return this.connectionCheckPromise;
    }

    // Add debounce to prevent rapid successive calls
    const now = Date.now();
    const lastCheck = this.lastConnectionCheck || 0;
    const minInterval = 5000; // 5 seconds minimum between checks
    
    if (now - lastCheck < minInterval) {
      console.log('⏳ Debouncing connection check...');
      await new Promise(resolve => setTimeout(resolve, minInterval - (now - lastCheck)));
    }

    this.lastConnectionCheck = now;
    this.connectionCheckInProgress = true;
    this.connectionCheckPromise = this.testConnection(
      (await this.getSettings()).whatsapp_instance_id,
      (await this.getSettings()).whatsapp_green_api_key
    );

    try {
      const result = await this.connectionCheckPromise;
      return result;
    } finally {
      this.connectionCheckInProgress = false;
      this.connectionCheckPromise = null;
    }
  }

  // Centralized health check to prevent multiple simultaneous calls
  async performHealthCheck(): Promise<{ healthy: boolean; status: string; error?: string }> {
    if (this.connectionCheckInProgress && this.connectionCheckPromise) {
      console.log('⏳ Health check already in progress, waiting...');
      // Wait for the current check to complete
      await this.connectionCheckPromise;
    }

    return this.checkConnectionHealth();
  }

  // Assign users to chats
  async assignUsersToChats(userIds: string[], chatIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👥 Assigning users to chats:', { userIds, chatIds });
      
      // This is a placeholder implementation
      // In a real implementation, you would update the database to assign users to chats
      // For now, we'll just return success
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error assigning users to chats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to assign users to chats' 
      };
    }
  }

  // Optimized method to fetch customers without creating long URLs
  async fetchCustomersOptimized(excludeIds: string[] = [], limit: number = 1000): Promise<any[]> {
    try {
      console.log(`🔄 Fetching customers optimized (excluding ${excludeIds.length} IDs)`);
      
      // If we have too many IDs to exclude, use a different approach
      if (excludeIds.length > 500) {
        console.log('📊 Too many IDs to exclude, using timestamp-based approach');
        return this.fetchCustomersByTimestamp(limit);
      }
      
      // If we have a reasonable number of IDs to exclude, use batching
      if (excludeIds.length > 0) {
        return this.fetchCustomersWithBatching(excludeIds, limit);
      }
      
      // If no exclusions needed, fetch directly
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, phone, whatsapp, profile_image, created_at')
        .not('whatsapp', 'is', null)
        .not('whatsapp', 'eq', '')
        .limit(limit)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return customers || [];
      
    } catch (error) {
      console.error('Error in fetchCustomersOptimized:', error);
      return [];
    }
  }

  // Fetch customers using timestamp-based filtering to avoid long URLs
  private async fetchCustomersByTimestamp(limit: number = 1000): Promise<any[]> {
    try {
      // Get the most recent timestamp from existing chats to use as a cutoff
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24); // Last 24 hours as default
      
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, phone, whatsapp, profile_image, created_at')
        .not('whatsapp', 'is', null)
        .not('whatsapp', 'eq', '')
        .gte('created_at', cutoffTime.toISOString())
        .limit(limit)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return customers || [];
      
    } catch (error) {
      console.error('Error in fetchCustomersByTimestamp:', error);
      return [];
    }
  }

  // Fetch customers using batching to avoid long URLs
  private async fetchCustomersWithBatching(excludeIds: string[], limit: number = 1000): Promise<any[]> {
    try {
      const batchSize = 100;
      const allCustomers: any[] = [];
      const excludeIdSet = new Set(excludeIds);
      
      // Process in batches
      for (let offset = 0; offset < limit; offset += batchSize) {
        const { data: batchCustomers, error } = await supabase
          .from('customers')
          .select('id, name, phone, whatsapp, profile_image, created_at')
          .not('whatsapp', 'is', null)
          .not('whatsapp', 'eq', '')
          .range(offset, offset + batchSize - 1)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.warn('Error fetching batch:', error);
          break;
        }
        
        if (!batchCustomers || batchCustomers.length === 0) {
          break;
        }
        
        // Filter out excluded IDs
        const filteredBatch = batchCustomers.filter(customer => !excludeIdSet.has(customer.id));
        allCustomers.push(...filteredBatch);
        
        // If we have enough customers, stop
        if (allCustomers.length >= limit) {
          break;
        }
        
        // Add a small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      return allCustomers.slice(0, limit);
      
    } catch (error) {
      console.error('Error in fetchCustomersWithBatching:', error);
      return [];
    }
  }
}

export const whatsappService = new WhatsAppService(); 