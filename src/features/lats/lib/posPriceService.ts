import { supabase } from '../../lib/supabaseClient';

export interface POSPriceData {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;

}

export interface POSPriceCache {
  [productId: string]: POSPriceData[];
  [variantId: string]: POSPriceData;
}

class POSPriceService {
  private static instance: POSPriceService;
  private priceCache: POSPriceCache = {};
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): POSPriceService {
    if (!POSPriceService.instance) {
      POSPriceService.instance = new POSPriceService();
    }
    return POSPriceService.instance;
  }

  // Fetch prices for multiple products efficiently
  async fetchPricesForProducts(productIds: string[]): Promise<POSPriceData[]> {
    try {
      console.log('💰 POSPriceService: Fetching prices for', productIds.length, 'products');
      
      // Check cache first
      const cachedPrices: POSPriceData[] = [];
      const uncachedProductIds: string[] = [];
      
      productIds.forEach(productId => {
        if (this.priceCache[productId] && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
          cachedPrices.push(...this.priceCache[productId]);
        } else {
          uncachedProductIds.push(productId);
        }
      });

      if (uncachedProductIds.length === 0) {
        console.log('💰 POSPriceService: All prices found in cache');
        return cachedPrices;
      }

      console.log('💰 POSPriceService: Need to fetch prices for', uncachedProductIds.length, 'uncached products');

      // Implement batching to avoid URL length issues
      const BATCH_SIZE = 5; // Reduced from 20 to 5 to avoid URL length issues
      const allNewPrices: POSPriceData[] = [];
      const totalBatches = Math.ceil(uncachedProductIds.length / BATCH_SIZE);
      
      for (let i = 0; i < uncachedProductIds.length; i += BATCH_SIZE) {
        const batch = uncachedProductIds.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        console.log(`💰 POSPriceService: Processing batch ${batchNumber}/${totalBatches} (${batch.length} products)`);
        
        // Retry logic for failed batch queries
        let retryCount = 0;
        const maxRetries = 3;
        let variants = null;
        let batchError = null;
        
        while (retryCount < maxRetries && !variants) {
          try {
            const { data, error } = await supabase
              .from('lats_product_variants')
              .select(`
                id,
                product_id,
                sku,
                name,
                selling_price,
                cost_price,
                quantity
              `)
              .in('product_id', batch)
              .order('name');

            if (error) {
              console.error(`❌ POSPriceService: Error fetching prices for batch ${batchNumber} (attempt ${retryCount + 1}):`, error);
              batchError = error;
              retryCount++;
              
              if (retryCount < maxRetries) {
                // Exponential backoff
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`⏳ POSPriceService: Retrying batch ${batchNumber} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            } else {
              variants = data;
              break;
            }
          } catch (exception) {
            console.error(`❌ POSPriceService: Exception processing batch ${batchNumber} (attempt ${retryCount + 1}):`, exception);
            batchError = exception;
            retryCount++;
            
            if (retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 1000;
              console.log(`⏳ POSPriceService: Retrying batch ${batchNumber} in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        if (variants) {
          // Transform the batch results
          const batchPrices: POSPriceData[] = variants.map((variant: any) => ({
            productId: variant.product_id,
            variantId: variant.id,
            sku: variant.sku || '',
            name: variant.name || '',
            sellingPrice: variant.selling_price || 0,
            costPrice: variant.cost_price || 0,
            quantity: variant.quantity || 0,

          }));

          console.log(`✅ POSPriceService: Batch ${batchNumber} returned ${batchPrices.length} variants`);
          allNewPrices.push(...batchPrices);
        } else {
          console.error(`❌ POSPriceService: Failed to fetch batch ${batchNumber} after ${maxRetries} attempts`);
          
          // Fallback: fetch variants individually for this batch
          console.log(`🔄 POSPriceService: Falling back to individual queries for batch ${batchNumber}...`);
          for (const productId of batch) {
            try {
              const { data: individualVariants, error: individualError } = await supabase
                .from('lats_product_variants')
                .select(`
                  id,
                  product_id,
                  sku,
                  name,
                  selling_price,
                  cost_price,
                  quantity
                `)
                .eq('product_id', productId)
                .order('name');
                
              if (!individualError && individualVariants) {
                const individualPrices: POSPriceData[] = individualVariants.map((variant: any) => ({
                  productId: variant.product_id,
                  variantId: variant.id,
                  sku: variant.sku || '',
                  name: variant.name || '',
                  sellingPrice: variant.selling_price || 0,
                  costPrice: variant.cost_price || 0,
                  quantity: variant.quantity || 0,

                }));
                allNewPrices.push(...individualPrices);
                console.log(`✅ POSPriceService: Individual query for product ${productId}: ${individualPrices.length} variants`);
              } else {
                console.error(`❌ POSPriceService: Individual query failed for product ${productId}:`, individualError);
              }
            } catch (individualException) {
              console.error(`❌ POSPriceService: Exception in individual query for product ${productId}:`, individualException);
            }
          }
        }
      }

      // Update cache with all new prices
      allNewPrices.forEach(price => {
        if (!this.priceCache[price.productId]) {
          this.priceCache[price.productId] = [];
        }
        this.priceCache[price.productId].push(price);
      });
      this.cacheTimestamp = Date.now();

      console.log('💰 POSPriceService: Fetched', allNewPrices.length, 'new prices in total');
      console.log('💰 POSPriceService: Returning', cachedPrices.length + allNewPrices.length, 'total prices');
      return [...cachedPrices, ...allNewPrices];
    } catch (error) {
      console.error('💥 POSPriceService: Exception fetching prices:', error);
      return [];
    }
  }

  // Fetch price for a single product
  async fetchPriceForProduct(productId: string): Promise<POSPriceData[]> {
    return this.fetchPricesForProducts([productId]);
  }

  // Fetch price by SKU
  async fetchPriceBySKU(sku: string): Promise<POSPriceData | null> {
    try {
      console.log('💰 POSPriceService: Fetching price for SKU:', sku);
      
      // Check cache first
      const cachedPrice = Object.values(this.priceCache)
        .flat()
        .find(price => price.sku === sku);
      
      if (cachedPrice && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
        console.log('💰 POSPriceService: Price found in cache for SKU:', sku);
        return cachedPrice;
      }

      // Fetch from database
      const { data: variants, error } = await supabase
        .from('lats_product_variants')
        .select(`
          id,
          product_id,
          sku,
          name,
          selling_price,
          cost_price,
          quantity
        `)
        .eq('sku', sku)
        .limit(1);

      if (error || !variants || variants.length === 0) {
        console.log('❌ POSPriceService: No price found for SKU:', sku);
        return null;
      }

      const variant = variants[0];
      const priceData: POSPriceData = {
        productId: variant.product_id,
        variantId: variant.id,
        sku: variant.sku || '',
        name: variant.name || '',
        sellingPrice: variant.selling_price || 0,
        costPrice: variant.cost_price || 0,
        quantity: variant.quantity || 0,

      };

      // Cache the result
      if (!this.priceCache[priceData.productId]) {
        this.priceCache[priceData.productId] = [];
      }
      this.priceCache[priceData.productId].push(priceData);
      this.cacheTimestamp = Date.now();

      console.log('💰 POSPriceService: Fetched price for SKU:', sku, priceData);
      return priceData;
    } catch (error) {
      console.error('💥 POSPriceService: Exception fetching price by SKU:', error);
      return null;
    }
  }



  // Clear cache
  clearCache(): void {
    this.priceCache = {};
    this.cacheTimestamp = 0;
    console.log('💰 POSPriceService: Cache cleared');
  }

  // Get cache statistics
  getCacheStats(): { size: number; timestamp: number; age: number } {
    const size = Object.keys(this.priceCache).length;
    const age = Date.now() - this.cacheTimestamp;
    return { size, timestamp: this.cacheTimestamp, age };
  }

  // Preload prices for a list of products (for better performance)
  async preloadPrices(productIds: string[]): Promise<void> {
    console.log('💰 POSPriceService: Preloading prices for', productIds.length, 'products');
    await this.fetchPricesForProducts(productIds);
  }
}

// Export singleton instance
export const posPriceService = POSPriceService.getInstance();
