// Real-time stock synchronization service for LATS module
import { supabase } from '../../../lib/supabaseClient';
import { latsEventBus } from './data/eventBus';
import { getConfig } from '../../../config/appConfig';

export interface StockUpdate {
  productId: string;
  variantId: string;
  oldQuantity: number;
  newQuantity: number;
  change: number;
  reason: string;
  timestamp: Date;
}

export interface StockAlert {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  currentStock: number;
  threshold: number;
  type: 'low' | 'out' | 'critical';
}

export class RealTimeStockService {
  private static instance: RealTimeStockService;
  private subscriptions: Map<string, any> = new Map();
  private stockListeners: Map<string, (update: StockUpdate) => void> = new Map();
  private alertListeners: Map<string, (alert: StockAlert) => void> = new Map();
  private isConnected = false;
  private isInitializing = false;
  private isDisconnecting = false; // Prevent multiple simultaneous disconnects
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries: number;
  private retryCount = 0;
  private isEnabled: boolean;
  private circuitBreakerOpen = false; // Circuit breaker to prevent infinite loops
  private circuitBreakerTimeout: NodeJS.Timeout | null = null;
  private lastConnectionAttempt = 0;
  private connectionCooldown: number;
  private connectionTimeout: number;
  private channelId: string = '';
  private lastHeartbeat: number = Date.now();
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private _unsubscribing = false; // Prevent recursive unsubscribe calls

  constructor() {
    const config = getConfig();
    this.maxRetries = config.realtime.connection.maxRetries;
    this.isEnabled = config.realtime.enabled;
    this.connectionCooldown = config.realtime.connection.cooldownPeriod;
    this.connectionTimeout = config.realtime.connection.connectionTimeout;
  }

  static getInstance(): RealTimeStockService {
    if (!RealTimeStockService.instance) {
      RealTimeStockService.instance = new RealTimeStockService();
    }
    return RealTimeStockService.instance;
  }

  // Initialize real-time stock monitoring
  async initialize(): Promise<void> {
    // Check circuit breaker first
    if (this.circuitBreakerOpen) {
      console.log('🚫 Circuit breaker is open - real-time monitoring temporarily disabled');
      return;
    }

    // Check if real-time monitoring is enabled
    if (!this.isEnabled) {
      console.log('🚫 Real-time stock monitoring is disabled');
      return;
    }

    // Prevent multiple simultaneous initializations or initialization during disconnect
    if (this.isInitializing || this.isDisconnecting) {
      return;
    }

    // If already connected, don't reinitialize
    if (this.isConnected) {
      return;
    }

    // Check connection cooldown to prevent rapid reconnection attempts
    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.connectionCooldown) {
      return;
    }

    // If we have existing subscriptions, clean them up first
    if (this.subscriptions.size > 0) {
      this.disconnect();
      // Wait a bit for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isInitializing = true;
    this.lastConnectionAttempt = now;

    try {
      // Clear any existing retry timeout
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }

      // Test database connection first with timeout
      const connectionTest = Promise.race([
        supabase
          .from('lats_stock_movements')
          .select('count')
          .limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), this.connectionTimeout)
        )
      ]);

      try {
        const { data: testData, error: testError } = await connectionTest as any;
        if (testError) {
          console.warn('⚠️ Database connection test failed:', testError);
          // Continue anyway as the table might be empty
        }
      } catch (timeoutError) {
        console.warn('⚠️ Database connection test timed out, continuing anyway');
      }

      // Generate unique channel ID to prevent conflicts
      this.channelId = `lats-stock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a single channel for all subscriptions to avoid conflicts
      const mainChannel = supabase.channel(this.channelId)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'lats_stock_movements' 
          },
          (payload) => {
            try {
              this.handleStockMovement(payload.new);
            } catch (error) {
              console.error('❌ Error in stock movement handler:', error);
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'lats_product_variants'
          },
          (payload) => {
            try {
              this.handleVariantUpdate(payload.old, payload.new);
            } catch (error) {
              console.error('❌ Error in variant update handler:', error);
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'lats_products'
          },
          (payload) => {
            try {
              this.handleProductUpdate(payload.old, payload.new);
            } catch (error) {
              console.error('❌ Error in product update handler:', error);
            }
          }
        )
        .subscribe((status) => {
          this.lastHeartbeat = Date.now();
          
          // Prevent handling status changes during disconnect
          if (this.isDisconnecting) {
            return;
          }
          
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.isInitializing = false;
            this.retryCount = 0; // Reset retry count on successful connection
            this.startConnectionMonitoring();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isConnected = false;
            this.isInitializing = false;
            this.stopConnectionMonitoring();
            
            // Only retry if we haven't exceeded max retries and not disconnecting
            if (this.retryCount < this.maxRetries && !this.isDisconnecting) {
              // Add delay before retry to prevent rapid reconnection attempts
              setTimeout(() => {
                if (!this.isConnected && !this.isInitializing && !this.isDisconnecting) {
                  this.handleConnectionFailure();
                }
              }, 2000); // Increased delay to reduce spam
            }
          } else if (status === 'TIMED_OUT') {
            this.isConnected = false;
            this.isInitializing = false;
            this.stopConnectionMonitoring();
            if (this.retryCount < this.maxRetries && !this.isDisconnecting) {
              setTimeout(() => {
                if (!this.isConnected && !this.isInitializing && !this.isDisconnecting) {
                  this.handleConnectionFailure();
                }
              }, 2000);
            }
          }
        });

      this.subscriptions.set('main', mainChannel);
    } catch (error) {
      console.error('❌ Error initializing real-time stock monitoring:', error);
      this.isInitializing = false;
      this.stopConnectionMonitoring();
      if (this.retryCount < this.maxRetries) {
        this.handleConnectionFailure();
      }
    }
  }

  // Start monitoring connection health
  private startConnectionMonitoring(): void {
    this.stopConnectionMonitoring(); // Clear any existing interval
    
    this.connectionCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.lastHeartbeat;
      
      // If no heartbeat for 2 minutes, consider connection dead
      if (timeSinceLastHeartbeat > 120000 && this.isConnected) {
        this.isConnected = false;
        this.reconnect();
      }
      
      // Also check if we have active subscriptions
      if (this.isConnected && this.subscriptions.size === 0) {
        this.isConnected = false;
        this.reconnect();
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop connection monitoring
  private stopConnectionMonitoring(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  // Reconnect method
  private async reconnect(): Promise<void> {
    if (this.isDisconnecting || !this.isEnabled) {
      return;
    }
    
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.initialize();
  }

  // Handle connection failures with exponential backoff
  private handleConnectionFailure(): void {
    // Don't retry if we're disconnecting or disabled
    if (this.isDisconnecting || !this.isEnabled) {
      return;
    }

    this.retryCount++;
    
    // Calculate delay with exponential backoff, but cap it
    const config = getConfig();
    const baseDelay = config.realtime.connection.retryDelay;
    const maxDelay = config.realtime.connection.maxRetryDelay;
    const delay = Math.min(baseDelay * Math.pow(2, this.retryCount - 1), maxDelay);

    if (this.retryCount >= this.maxRetries) {
      console.warn(`🚫 Max retries (${this.maxRetries}) reached, opening circuit breaker`);
      this.openCircuitBreaker();
      return;
    }

    console.log(`🔄 Retry attempt ${this.retryCount}/${this.maxRetries} in ${delay}ms`);
    
    this.retryTimeout = setTimeout(() => {
      if (!this.isConnected && !this.isInitializing && !this.isDisconnecting) {
        this.initialize();
      }
    }, delay);
  }

  // Open circuit breaker to prevent infinite retry loops
  private openCircuitBreaker(): void {
    this.circuitBreakerOpen = true;
    const config = getConfig();
    
    this.circuitBreakerTimeout = setTimeout(() => {
      this.circuitBreakerOpen = false;
      this.retryCount = 0;
      console.log('🔄 Circuit breaker closed, retrying connection');
      this.initialize();
    }, config.realtime.connection.circuitBreakerTimeout);
  }

  // Handle stock movement events
  private async handleStockMovement(movement: any): Promise<void> {
    try {
      const stockUpdate: StockUpdate = {
        productId: movement.product_id,
        variantId: movement.variant_id,
        oldQuantity: movement.previous_quantity,
        newQuantity: movement.new_quantity,
        change: movement.quantity,
        reason: movement.reason,
        timestamp: new Date(movement.created_at)
      };

      console.log('📊 Stock movement detected:', stockUpdate);

      // Notify listeners
      this.notifyStockListeners(stockUpdate);

      // Check for stock alerts
      await this.checkStockAlerts(stockUpdate.productId, stockUpdate.variantId);

      // Emit event for other components
      latsEventBus.emit('lats:stock.updated', stockUpdate);
    } catch (error) {
      console.error('❌ Error handling stock movement:', error);
    }
  }

  // Handle variant updates
  private async handleVariantUpdate(oldVariant: any, newVariant: any): Promise<void> {
    if (oldVariant.quantity !== newVariant.quantity) {
      const stockUpdate: StockUpdate = {
        productId: newVariant.product_id,
        variantId: newVariant.id,
        oldQuantity: oldVariant.quantity,
        newQuantity: newVariant.quantity,
        change: newVariant.quantity - oldVariant.quantity,
        reason: 'Direct update',
        timestamp: new Date()
      };

      console.log('📊 Variant stock update:', stockUpdate);
      this.notifyStockListeners(stockUpdate);
      await this.checkStockAlerts(stockUpdate.productId, stockUpdate.variantId);
    }
  }

  // Handle product updates
  private async handleProductUpdate(oldProduct: any, newProduct: any): Promise<void> {
    if (oldProduct.is_active !== newProduct.is_active) {
      console.log('📊 Product status changed:', {
        productId: newProduct.id,
        name: newProduct.name,
        oldActive: oldProduct.is_active,
        newActive: newProduct.is_active
      });

      latsEventBus.emit('lats:product.status_changed', {
        productId: newProduct.id,
        name: newProduct.name,
        isActive: newProduct.is_active
      });
    }
  }

  // Check for stock alerts
  private async checkStockAlerts(productId: string, variantId: string): Promise<void> {
    try {
      const { data: variant, error } = await supabase
        .from('lats_product_variants')
        .select(`
          *,
          products(name)
        `)
        .eq('id', variantId)
        .single();

      if (error || !variant) return;

      const currentStock = variant.quantity || 0;
      const minQuantity = variant.min_quantity || 10;
      const criticalThreshold = 5;

      let alertType: 'low' | 'out' | 'critical' | null = null;
      let threshold = 0;

      if (currentStock === 0) {
        alertType = 'out';
        threshold = 0;
      } else if (currentStock <= criticalThreshold) {
        alertType = 'critical';
        threshold = criticalThreshold;
      } else if (currentStock <= minQuantity) {
        alertType = 'low';
        threshold = minQuantity;
      }

      if (alertType) {
        const alert: StockAlert = {
          productId,
          productName: variant.products?.name || 'Unknown Product',
          variantId,
          variantName: variant.name,
          currentStock,
          threshold,
          type: alertType
        };

        console.log('⚠️ Stock alert:', alert);
        this.notifyAlertListeners(alert);
        latsEventBus.emit('lats:stock.alert', alert);
      }
    } catch (error) {
      console.error('❌ Error checking stock alerts:', error);
    }
  }

  // Subscribe to stock updates for a specific product
  subscribeToProductStock(productId: string, callback: (update: StockUpdate) => void): () => void {
    const key = `product-${productId}`;
    this.stockListeners.set(key, callback);

    return () => {
      this.stockListeners.delete(key);
    };
  }

  // Subscribe to stock alerts
  subscribeToStockAlerts(callback: (alert: StockAlert) => void): () => void {
    const key = `alert-${Date.now()}`;
    this.alertListeners.set(key, callback);

    return () => {
      this.alertListeners.delete(key);
    };
  }

  // Notify stock listeners
  private notifyStockListeners(update: StockUpdate): void {
    // Notify specific product listeners
    const productKey = `product-${update.productId}`;
    const productListener = this.stockListeners.get(productKey);
    if (productListener) {
      productListener(update);
    }

    // Notify global listeners
    const globalKey = 'global-stock';
    const globalListener = this.stockListeners.get(globalKey);
    if (globalListener) {
      globalListener(update);
    }
  }

  // Notify alert listeners
  private notifyAlertListeners(alert: StockAlert): void {
    this.alertListeners.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('❌ Error in alert listener:', error);
      }
    });
  }

  // Get current stock levels for multiple products
  async getStockLevels(productIds: string[]): Promise<Map<string, number>> {
    try {
      console.log('📊 RealTimeStock: Getting stock levels for', productIds.length, 'products');
      
      // Implement batching to avoid URL length issues
      const BATCH_SIZE = 20; // Process 20 products at a time
      const stockMap = new Map<string, number>();
      const totalBatches = Math.ceil(productIds.length / BATCH_SIZE);
      
      for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
        const batch = productIds.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        console.log(`📊 RealTimeStock: Processing batch ${batchNumber}/${totalBatches} (${batch.length} products)`);
        
        try {
          const { data, error } = await supabase
            .from('lats_product_variants')
            .select('product_id, quantity')
            .in('product_id', batch);

          if (error) {
            console.error(`❌ RealTimeStock: Error getting stock levels for batch ${batchNumber}:`, error);
            console.error(`❌ Batch product IDs:`, batch);
            continue; // Skip this batch and continue with others
          }

          // Process the batch results
          const batchResults = (data || []);
          console.log(`✅ RealTimeStock: Batch ${batchNumber} returned ${batchResults.length} variants`);
          
          batchResults.forEach(variant => {
            const currentStock = stockMap.get(variant.product_id) || 0;
            stockMap.set(variant.product_id, currentStock + (variant.quantity || 0));
          });
        } catch (batchError) {
          console.error(`❌ RealTimeStock: Exception processing stock levels batch ${batchNumber}:`, batchError);
          console.error(`❌ Batch product IDs:`, batch);
          continue; // Skip this batch and continue with others
        }
      }

      console.log('📊 RealTimeStock: Processed stock levels for', stockMap.size, 'products');
      return stockMap;
    } catch (error) {
      console.error('❌ RealTimeStock: Error getting stock levels:', error);
      return new Map();
    }
  }

  // Get low stock products
  async getLowStockProducts(threshold: number = 10): Promise<StockAlert[]> {
    try {
      const { data, error } = await supabase
        .from('lats_product_variants')
        .select(`
          *,
          products(name, is_active)
        `)
        .lte('quantity', threshold)
        .eq('products.is_active', true);

      if (error) throw error;

      return (data || []).map(variant => ({
        productId: variant.product_id,
        productName: variant.products?.name || 'Unknown Product',
        variantId: variant.id,
        variantName: variant.name,
        currentStock: variant.quantity || 0,
        threshold,
        type: variant.quantity === 0 ? 'out' : 
              variant.quantity <= 5 ? 'critical' : 'low'
      }));
    } catch (error) {
      console.error('❌ Error getting low stock products:', error);
      return [];
    }
  }

  // Disconnect all subscriptions
  async disconnect(): Promise<void> {
    if (this.isDisconnecting) {
      return;
    }

    this.isDisconnecting = true;
    this.isConnected = false;
    this.isInitializing = false;

    // Clear any pending retry
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    // Stop connection monitoring
    this.stopConnectionMonitoring();

    // Unsubscribe from all channels
    for (const [key, channel] of this.subscriptions.entries()) {
      this.safeUnsubscribe(channel);
    }

    this.subscriptions.clear();
    this.isDisconnecting = false;
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Disable real-time monitoring (for troubleshooting)
  disable(): void {
    console.log('🚫 Disabling real-time stock monitoring...');
    this.disconnect();
    this.isEnabled = false;
    this.maxRetries = 0; // Prevent any further retries
    console.log('✅ Real-time stock monitoring disabled');
  }

  // Re-enable real-time monitoring
  enable(): void {
    console.log('🔄 Re-enabling real-time stock monitoring...');
    this.isEnabled = true;
    this.maxRetries = 5;
    this.retryCount = 0;
    this.initialize();
  }

  // Get detailed connection status
  getConnectionDetails(): {
    isConnected: boolean;
    isInitializing: boolean;
    isEnabled: boolean;
    retryCount: number;
    maxRetries: number;
    subscriptionCount: number;
    lastHeartbeat: string;
    channelId: string;
  } {
    return {
      isConnected: this.isConnected,
      isInitializing: this.isInitializing,
      isEnabled: this.isEnabled,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      subscriptionCount: this.subscriptions.size,
      lastHeartbeat: new Date(this.lastHeartbeat).toLocaleTimeString(),
      channelId: this.channelId
    };
  }

  // Test real-time connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Starting real-time connection test...');
      
      // Test basic database connection first
      const { data, error } = await supabase
        .from('lats_stock_movements')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        return { success: false, error: `Database connection failed: ${error.message}` };
      }

      console.log('✅ Database connection test passed');

      // Test if we can create a test subscription with unique channel ID
      const testChannelId = `test-connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const testChannel = supabase.channel(testChannelId);
      let subscriptionSuccess = false;
      let subscriptionError = '';
      let subscriptionCompleted = false;

      console.log('🧪 Creating test subscription with channel ID:', testChannelId);

      const testSubscription = testChannel
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'lats_stock_movements' 
          },
          () => {} // Empty handler for test
        )
        .subscribe((status) => {
          console.log('🧪 Test subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            subscriptionSuccess = true;
            subscriptionCompleted = true;
            console.log('✅ Test subscription successful');
            // Use safe unsubscribe method
            this.safeUnsubscribe(testChannel);
          } else if (status === 'CLOSED') {
            // CLOSED status is normal for test connections - they close after testing
            subscriptionSuccess = true;
            subscriptionCompleted = true;
            console.log('✅ Test subscription completed (closed normally)');
            // Use safe unsubscribe method
            this.safeUnsubscribe(testChannel);
          } else if (status === 'CHANNEL_ERROR') {
            subscriptionError = `Subscription failed with status: ${status}`;
            subscriptionCompleted = true;
            console.error('❌ Test subscription failed:', status);
            // Use safe unsubscribe method
            this.safeUnsubscribe(testChannel);
          } else if (status === 'TIMED_OUT') {
            subscriptionError = 'Subscription test timed out';
            subscriptionCompleted = true;
            console.error('⏰ Test subscription timed out');
            // Use safe unsubscribe method
            this.safeUnsubscribe(testChannel);
          }
        });

      // Wait for subscription result with shorter timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds with 100ms intervals
      
      while (!subscriptionCompleted && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!subscriptionCompleted) {
        subscriptionError = 'Subscription test timed out';
        console.error('⏰ Test subscription timed out after 5 seconds');
        this.safeUnsubscribe(testChannel);
      }

      const result = {
        success: subscriptionSuccess,
        error: subscriptionError || undefined
      };

      console.log('🧪 Connection test result:', result);
      return result;
    } catch (error) {
      console.error('❌ Connection test failed with exception:', error);
      return { 
        success: false, 
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Check Supabase connection health
  async checkSupabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Test basic connectivity
      const { data, error } = await supabase
        .from('lats_stock_movements')
        .select('count')
        .limit(1);

      if (error) {
        return { healthy: false, error: `Database error: ${error.message}` };
      }

      // Test authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        return { healthy: false, error: `Authentication error: ${authError.message}` };
      }

      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Safe unsubscribe method to prevent infinite loops
  private safeUnsubscribe(channel: any): void {
    if (this._unsubscribing || !channel) {
      return;
    }
    
    this._unsubscribing = true;
    
    try {
      if (typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    } catch (error) {
      console.warn('⚠️ Error during unsubscribe:', error);
    } finally {
      this._unsubscribing = false;
    }
  }
}

export const realTimeStockService = RealTimeStockService.getInstance();
