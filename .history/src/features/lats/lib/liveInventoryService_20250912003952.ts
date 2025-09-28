import { supabase } from '../../../lib/supabaseClient';

export interface LiveInventoryMetrics {
  totalValue: number;
  retailValue: number;
  totalStock: number;
  totalProducts: number;
  activeProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  reorderAlerts: number;
  lastUpdated: string;
}

export interface LiveInventoryValue {
  costValue: number;
  retailValue: number;
  potentialProfit: number;
  profitMargin: number;
}

/**
 * Live Inventory Service - Fetches real-time inventory data from database
 */
export class LiveInventoryService {
  private static cache: { data: LiveInventoryMetrics | null; timestamp: number } = {
    data: null,
    timestamp: 0
  };
  private static readonly CACHE_DURATION = 30000; // 30 seconds cache

  /**
   * Clear the cache to force fresh data on next request
   */
  static clearCache(): void {
    this.cache.data = null;
    this.cache.timestamp = 0;
    console.log('🗑️ [LiveInventoryService] Cache cleared');
  }

  /**
   * Get live inventory metrics by fetching real data from database
   */
  static async getLiveInventoryMetrics(): Promise<LiveInventoryMetrics> {
    // Check cache first
    const now = Date.now();
    if (this.cache.data && (now - this.cache.timestamp) < this.CACHE_DURATION) {
      // Only log in development mode to reduce console noise
      if (import.meta.env.MODE === 'development') {
        console.log('📋 [LiveInventoryService] Using cached metrics');
      }
      return this.cache.data;
    }
    try {
      // Only log in development mode to reduce console noise
      if (import.meta.env.MODE === 'development') {
        console.log('🔍 [LiveInventoryService] Fetching live inventory metrics...');
      }
      
      // Fetch all products with their variants for real-time calculation
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select(`
          id,
          name,
          is_active,
          total_quantity,
          total_value,
          lats_product_variants(
            id,
            quantity,
            cost_price,
            selling_price,
            min_quantity
          )
        `);

      if (productsError) {
        console.error('❌ [LiveInventoryService] Error fetching products:', productsError);
        throw productsError;
      }

      // Only log in development mode to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.log(`📦 [LiveInventoryService] Fetched ${products?.length || 0} products for live calculation`);
      }

      // Calculate live metrics
      let totalValue = 0;
      let retailValue = 0;
      let totalStock = 0;
      let totalProducts = products?.length || 0;
      let activeProducts = 0;
      let lowStockItems = 0;
      let outOfStockItems = 0;
      let reorderAlerts = 0;

      products?.forEach((product) => {
        const variants = product.lats_product_variants || [];
        const isActive = product.is_active;
        
        if (isActive) {
          activeProducts++;
        }

        // Calculate total stock for this product
        const productStock = variants.reduce((sum: number, variant: any) => {
          return sum + (variant.quantity || 0);
        }, 0);

        totalStock += productStock;

        // Calculate total value for this product (using cost price)
        const productValue = variants.reduce((sum: number, variant: any) => {
          const costPrice = variant.cost_price || 0;
          const quantity = variant.quantity || 0;
          const variantValue = costPrice * quantity;
          
          // Debug logging for each variant (only in development mode)
          if (process.env.NODE_ENV === 'development' && variantValue > 0) {
            console.log(`💰 [LiveInventoryService] ${product.name} - ${variant.name || 'Default'}: ${quantity} × ${costPrice} = ${variantValue}`);
          }
          
          return sum + variantValue;
        }, 0);

        // Debug logging for product total if multiple variants (only in development mode)
        if (process.env.NODE_ENV === 'development' && variants.length > 1) {
          console.log(`📊 [LiveInventoryService] ${product.name} - Total from ${variants.length} variants: ${productValue}`);
        }

        totalValue += productValue;

        // Calculate retail value for this product
        const productRetailValue = variants.reduce((sum: number, variant: any) => {
          const sellingPrice = variant.selling_price || 0;
          const quantity = variant.quantity || 0;
          const variantRetailValue = sellingPrice * quantity;
          
          // Debug logging for each variant retail value (only in development mode)
          if (process.env.NODE_ENV === 'development' && variantRetailValue > 0) {
            console.log(`💰 [LiveInventoryService] ${product.name} - ${variant.name || 'Default'} (Retail): ${quantity} × ${sellingPrice} = ${variantRetailValue}`);
          }
          
          return sum + variantRetailValue;
        }, 0);

        retailValue += productRetailValue;

        // Check stock status
        if (productStock <= 0) {
          outOfStockItems++;
        } else if (productStock <= 10) {
          lowStockItems++;
        }

        // Check reorder alerts
        const mainVariant = variants[0];
        if (mainVariant?.min_quantity && productStock <= mainVariant.min_quantity) {
          reorderAlerts++;
        }
      });

      const metrics: LiveInventoryMetrics = {
        totalValue,
        retailValue,
        totalStock,
        totalProducts,
        activeProducts,
        lowStockItems,
        outOfStockItems,
        reorderAlerts,
        lastUpdated: new Date().toISOString()
      };

      // Only log in development mode to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [LiveInventoryService] Live metrics calculated:', {
          totalValue: metrics.totalValue,
          retailValue: metrics.retailValue,
          totalStock: metrics.totalStock,
          totalProducts: metrics.totalProducts,
          activeProducts: metrics.activeProducts,
          lowStockItems: metrics.lowStockItems,
          outOfStockItems: metrics.outOfStockItems,
          reorderAlerts: metrics.reorderAlerts
        });
      }

      // Cache the results
      this.cache.data = metrics;
      this.cache.timestamp = now;

      return metrics;

    } catch (error) {
      console.error('❌ [LiveInventoryService] Error calculating live metrics:', error);
      throw error;
    }
  }

  /**
   * Get live inventory value breakdown (cost, retail, profit)
   */
  static async getLiveInventoryValue(): Promise<LiveInventoryValue> {
    try {
      console.log('🔍 [LiveInventoryService] Fetching live inventory value breakdown...');
      
      // Fetch all variants with pricing data
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select(`
          id,
          quantity,
          cost_price,
          selling_price,
          lats_products!inner(
            id,
            is_active
          )
        `)
        .eq('lats_products.is_active', true); // Only active products

      if (variantsError) {
        console.error('❌ [LiveInventoryService] Error fetching variants:', variantsError);
        throw variantsError;
      }

      console.log(`📦 [LiveInventoryService] Fetched ${variants?.length || 0} variants for value calculation`);

      let costValue = 0;
      let retailValue = 0;

      variants?.forEach((variant: any) => {
        const quantity = variant.quantity || 0;
        const costPrice = variant.cost_price || 0;
        const sellingPrice = variant.selling_price || 0;

        costValue += costPrice * quantity;
        retailValue += sellingPrice * quantity;
      });

      const potentialProfit = retailValue - costValue;
      const profitMargin = costValue > 0 ? (potentialProfit / costValue) * 100 : 0;

      const value: LiveInventoryValue = {
        costValue,
        retailValue,
        potentialProfit,
        profitMargin
      };

      console.log('✅ [LiveInventoryService] Live value calculated:', {
        costValue: value.costValue,
        retailValue: value.retailValue,
        potentialProfit: value.potentialProfit,
        profitMargin: value.profitMargin
      });

      return value;

    } catch (error) {
      console.error('❌ [LiveInventoryService] Error calculating live value:', error);
      throw error;
    }
  }

  /**
   * Get live inventory metrics for a specific category
   */
  static async getLiveCategoryMetrics(categoryId: string): Promise<LiveInventoryMetrics> {
    try {
      console.log(`🔍 [LiveInventoryService] Fetching live metrics for category: ${categoryId}`);
      
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select(`
          id,
          name,
          is_active,
          category_id,
          lats_product_variants(
            id,
            quantity,
            cost_price,
            selling_price,
            min_quantity
          )
        `)
        .eq('category_id', categoryId);

      if (productsError) {
        console.error('❌ [LiveInventoryService] Error fetching category products:', productsError);
        throw productsError;
      }

      // Calculate metrics for this category only
      let totalValue = 0;
      let totalStock = 0;
      let totalProducts = products?.length || 0;
      let activeProducts = 0;
      let lowStockItems = 0;
      let outOfStockItems = 0;
      let reorderAlerts = 0;

      products?.forEach((product) => {
        const variants = product.lats_product_variants || [];
        const isActive = product.is_active;
        
        if (isActive) {
          activeProducts++;
        }

        const productStock = variants.reduce((sum: number, variant: any) => {
          return sum + (variant.quantity || 0);
        }, 0);

        totalStock += productStock;

        const productValue = variants.reduce((sum: number, variant: any) => {
          const costPrice = variant.cost_price || 0;
          const quantity = variant.quantity || 0;
          return sum + (costPrice * quantity);
        }, 0);

        totalValue += productValue;

        if (productStock <= 0) {
          outOfStockItems++;
        } else if (productStock <= 10) {
          lowStockItems++;
        }

        const mainVariant = variants[0];
        if (mainVariant?.min_quantity && productStock <= mainVariant.min_quantity) {
          reorderAlerts++;
        }
      });

      return {
        totalValue,
        totalStock,
        totalProducts,
        activeProducts,
        lowStockItems,
        outOfStockItems,
        reorderAlerts,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [LiveInventoryService] Error calculating category metrics:', error);
      throw error;
    }
  }

  /**
   * Get live inventory metrics for a specific supplier
   */
  static async getLiveSupplierMetrics(supplierId: string): Promise<LiveInventoryMetrics> {
    try {
      console.log(`🔍 [LiveInventoryService] Fetching live metrics for supplier: ${supplierId}`);
      
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select(`
          id,
          name,
          is_active,
          supplier_id,
          lats_product_variants(
            id,
            quantity,
            cost_price,
            selling_price,
            min_quantity
          )
        `)
        .eq('supplier_id', supplierId);

      if (productsError) {
        console.error('❌ [LiveInventoryService] Error fetching supplier products:', productsError);
        throw productsError;
      }

      // Calculate metrics for this supplier only
      let totalValue = 0;
      let totalStock = 0;
      let totalProducts = products?.length || 0;
      let activeProducts = 0;
      let lowStockItems = 0;
      let outOfStockItems = 0;
      let reorderAlerts = 0;

      products?.forEach((product) => {
        const variants = product.lats_product_variants || [];
        const isActive = product.is_active;
        
        if (isActive) {
          activeProducts++;
        }

        const productStock = variants.reduce((sum: number, variant: any) => {
          return sum + (variant.quantity || 0);
        }, 0);

        totalStock += productStock;

        const productValue = variants.reduce((sum: number, variant: any) => {
          const costPrice = variant.cost_price || 0;
          const quantity = variant.quantity || 0;
          return sum + (costPrice * quantity);
        }, 0);

        totalValue += productValue;

        if (productStock <= 0) {
          outOfStockItems++;
        } else if (productStock <= 10) {
          lowStockItems++;
        }

        const mainVariant = variants[0];
        if (mainVariant?.min_quantity && productStock <= mainVariant.min_quantity) {
          reorderAlerts++;
        }
      });

      return {
        totalValue,
        totalStock,
        totalProducts,
        activeProducts,
        lowStockItems,
        outOfStockItems,
        reorderAlerts,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [LiveInventoryService] Error calculating supplier metrics:', error);
      throw error;
    }
  }
}
