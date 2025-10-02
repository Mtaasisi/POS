// Cache Management for LATS Inventory
export class LatsCacheManager {
  private static instance: LatsCacheManager;
  
  public static getInstance(): LatsCacheManager {
    if (!LatsCacheManager.instance) {
      LatsCacheManager.instance = new LatsCacheManager();
    }
    return LatsCacheManager.instance;
  }

  // Clear all inventory-related caches
  clearInventoryCache(): void {
    try {
      // Clear localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('inventory') || 
          key.includes('products') || 
          key.includes('variants') ||
          key.includes('categories') ||
          key.includes('suppliers')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.includes('inventory') || 
          key.includes('products') || 
          key.includes('variants') ||
          key.includes('categories') ||
          key.includes('suppliers')
        )) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

      console.log('✅ [LatsCacheManager] Cleared inventory cache');
    } catch (error) {
      console.error('❌ [LatsCacheManager] Error clearing cache:', error);
    }
  }

  // Force refresh inventory data
  async forceRefreshInventory(): Promise<void> {
    this.clearInventoryCache();
    
    // Trigger a page reload to force fresh data
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  // Clear specific product cache
  clearProductCache(productId?: string): void {
    try {
      if (productId) {
        // Clear specific product cache
        const productKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes(`product_${productId}`)) {
            productKeys.push(key);
          }
        }
        productKeys.forEach(key => localStorage.removeItem(key));
        console.log(`✅ [LatsCacheManager] Cleared cache for product ${productId}`);
      } else {
        // Clear all product cache
        this.clearInventoryCache();
      }
    } catch (error) {
      console.error('❌ [LatsCacheManager] Error clearing product cache:', error);
    }
  }

  // Check cache health
  checkCacheHealth(): { totalItems: number; inventoryItems: number; lastCleared: string } {
    const totalItems = localStorage.length + sessionStorage.length;
    let inventoryItems = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('inventory') || 
        key.includes('products') || 
        key.includes('variants')
      )) {
        inventoryItems++;
      }
    }

    return {
      totalItems,
      inventoryItems,
      lastCleared: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const latsCacheManager = LatsCacheManager.getInstance();
