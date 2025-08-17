// Real-time stock synchronization service for LATS module
import { supabase } from '../../../lib/supabaseClient';
import { latsEventBus } from './data/eventBus';

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

  static getInstance(): RealTimeStockService {
    if (!RealTimeStockService.instance) {
      RealTimeStockService.instance = new RealTimeStockService();
    }
    return RealTimeStockService.instance;
  }

  // Initialize real-time stock monitoring
  async initialize(): Promise<void> {
    if (this.isConnected) return;

    try {
      console.log('🔗 Initializing real-time stock monitoring...');

      // Subscribe to stock movements
      const stockSubscription = supabase
        .channel('stock-movements')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'lats_stock_movements' 
          },
          (payload) => this.handleStockMovement(payload.new)
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'lats_product_variants'
          },
          (payload) => this.handleVariantUpdate(payload.old, payload.new)
        )
        .subscribe((status) => {
          console.log('📡 Stock subscription status:', status);
          this.isConnected = status === 'SUBSCRIBED';
          
          // If subscription fails, try to reconnect after a delay
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.log('🔄 Stock subscription failed, will retry in 5 seconds...');
            setTimeout(() => {
              if (!this.isConnected) {
                this.initialize();
              }
            }, 5000);
          }
        });

      this.subscriptions.set('stock-movements', stockSubscription);

      // Subscribe to product updates
      const productSubscription = supabase
        .channel('product-updates')
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'lats_products'
          },
          (payload) => this.handleProductUpdate(payload.old, payload.new)
        )
        .subscribe((status) => {
          console.log('📡 Product subscription status:', status);
          
          // If subscription fails, try to reconnect after a delay
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.log('🔄 Product subscription failed, will retry in 5 seconds...');
            setTimeout(() => {
              if (!this.isConnected) {
                this.initialize();
              }
            }, 5000);
          }
        });

      this.subscriptions.set('product-updates', productSubscription);

      console.log('✅ Real-time stock monitoring initialized');
    } catch (error) {
      console.error('❌ Error initializing real-time stock monitoring:', error);
      
      // Retry initialization after a delay
      setTimeout(() => {
        if (!this.isConnected) {
          this.initialize();
        }
      }, 5000);
    }
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
      const { data, error } = await supabase
        .from('lats_product_variants')
        .select('product_id, quantity')
        .in('product_id', productIds);

      if (error) throw error;

      const stockMap = new Map<string, number>();
      (data || []).forEach(variant => {
        const currentStock = stockMap.get(variant.product_id) || 0;
        stockMap.set(variant.product_id, currentStock + (variant.quantity || 0));
      });

      return stockMap;
    } catch (error) {
      console.error('❌ Error getting stock levels:', error);
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
  disconnect(): void {
    console.log('🔌 Disconnecting real-time stock monitoring...');
    
    this.subscriptions.forEach((subscription, key) => {
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else {
          supabase.removeChannel(subscription);
        }
        console.log(`✅ Disconnected subscription: ${key}`);
      } catch (error) {
        console.error(`❌ Error disconnecting subscription ${key}:`, error);
      }
    });

    this.subscriptions.clear();
    this.stockListeners.clear();
    this.alertListeners.clear();
    this.isConnected = false;
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const realTimeStockService = RealTimeStockService.getInstance();
