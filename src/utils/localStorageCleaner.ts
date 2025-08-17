// Utility to identify and clean up large localStorage items that might cause HTTP 431 errors

export interface LocalStorageItem {
  key: string;
  size: number;
  value: string;
  isLarge: boolean;
}

export class LocalStorageCleaner {
  private static readonly LARGE_ITEM_THRESHOLD = 50 * 1024; // 50KB threshold
  private static readonly MAX_ITEM_SIZE = 100 * 1024; // 100KB max size

  /**
   * Scan localStorage for large items
   */
  static scanLargeItems(): LocalStorageItem[] {
    const items: LocalStorageItem[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        const size = new Blob([value]).size;
        const isLarge = size > this.LARGE_ITEM_THRESHOLD;
        
        items.push({
          key,
          size,
          value: value.substring(0, 200) + (value.length > 200 ? '...' : ''), // Truncate for display
          isLarge
        });
      }
    } catch (error) {
      console.error('Error scanning localStorage:', error);
    }
    
    return items.sort((a, b) => b.size - a.size);
  }

  /**
   * Clean up large localStorage items
   */
  static cleanupLargeItems(): { removed: string[]; errors: string[] } {
    const removed: string[] = [];
    const errors: string[] = [];
    
    try {
      const largeItems = this.scanLargeItems().filter(item => item.isLarge);
      
      for (const item of largeItems) {
        try {
          localStorage.removeItem(item.key);
          removed.push(item.key);
          console.log(`🧹 Removed large localStorage item: ${item.key} (${item.size} bytes)`);
        } catch (error) {
          errors.push(`Failed to remove ${item.key}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Error during cleanup: ${error}`);
    }
    
    return { removed, errors };
  }

  /**
   * Get localStorage usage statistics
   */
  static getUsageStats(): {
    totalItems: number;
    totalSize: number;
    largeItems: number;
    largestItem: LocalStorageItem | null;
  } {
    const items = this.scanLargeItems();
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    const largeItems = items.filter(item => item.isLarge).length;
    const largestItem = items[0] || null;
    
    return {
      totalItems: items.length,
      totalSize,
      largeItems,
      largestItem
    };
  }

  /**
   * Check if localStorage might be causing header size issues
   */
  static checkForHeaderSizeIssues(): {
    hasIssues: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getUsageStats();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for very large items
    if (stats.largestItem && stats.largestItem.size > this.MAX_ITEM_SIZE) {
      issues.push(`Very large item found: ${stats.largestItem.key} (${stats.largestItem.size} bytes)`);
      recommendations.push(`Remove or compress the data in ${stats.largestItem.key}`);
    }
    
    // Check for too many large items
    if (stats.largeItems > 5) {
      issues.push(`Too many large items: ${stats.largeItems} items over ${this.LARGE_ITEM_THRESHOLD} bytes`);
      recommendations.push('Consider cleaning up large localStorage items');
    }
    
    // Check total size
    if (stats.totalSize > 1024 * 1024) { // 1MB
      issues.push(`Total localStorage size is very large: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
      recommendations.push('Consider implementing data compression or cleanup');
    }
    
    return {
      hasIssues: issues.length > 0,
      issues,
      recommendations
    };
  }

  /**
   * Safe localStorage setter that prevents large items
   */
  static safeSetItem(key: string, value: string): { success: boolean; error?: string } {
    try {
      const size = new Blob([value]).size;
      
      if (size > this.MAX_ITEM_SIZE) {
        return {
          success: false,
          error: `Item too large: ${size} bytes (max: ${this.MAX_ITEM_SIZE} bytes)`
        };
      }
      
      localStorage.setItem(key, value);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set item: ${error}`
      };
    }
  }

  /**
   * Compress large objects before storing
   */
  static compressAndStore(key: string, data: any): { success: boolean; error?: string } {
    try {
      const jsonString = JSON.stringify(data);
      const size = new Blob([jsonString]).size;
      
      if (size <= this.MAX_ITEM_SIZE) {
        // Small enough to store as-is
        return this.safeSetItem(key, jsonString);
      }
      
      // For large objects, store only essential data
      if (typeof data === 'object' && data !== null) {
        const compressed = this.compressObject(data);
        const compressedString = JSON.stringify(compressed);
        const compressedSize = new Blob([compressedString]).size;
        
        if (compressedSize <= this.MAX_ITEM_SIZE) {
          return this.safeSetItem(key, compressedString);
        } else {
          return {
            success: false,
            error: `Even compressed data is too large: ${compressedSize} bytes`
          };
        }
      }
      
      return {
        success: false,
        error: `Data too large and cannot be compressed: ${size} bytes`
      };
    } catch (error) {
      return {
        success: false,
        error: `Compression failed: ${error}`
      };
    }
  }

  /**
   * Compress object by removing non-essential fields
   */
  private static compressObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.compressObject(item)).slice(0, 100); // Limit arrays to 100 items
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const compressed: any = {};
      
      // Keep only essential fields
      const essentialFields = ['id', 'name', 'title', 'type', 'status', 'created_at', 'updated_at'];
      
      for (const field of essentialFields) {
        if (obj[field] !== undefined) {
          compressed[field] = obj[field];
        }
      }
      
      return compressed;
    }
    
    return obj;
  }
}

// Auto-cleanup on page load to prevent 431 errors
if (typeof window !== 'undefined') {
  // Run cleanup check on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const issues = LocalStorageCleaner.checkForHeaderSizeIssues();
      if (issues.hasIssues) {
        console.warn('🚨 Potential localStorage header size issues detected:', issues.issues);
        console.log('💡 Recommendations:', issues.recommendations);
        
        // Auto-cleanup if there are critical issues
        if (issues.issues.some(issue => issue.includes('Very large item'))) {
          console.log('🧹 Performing automatic cleanup of very large items...');
          const result = LocalStorageCleaner.cleanupLargeItems();
          if (result.removed.length > 0) {
            console.log('✅ Cleaned up items:', result.removed);
          }
          if (result.errors.length > 0) {
            console.error('❌ Cleanup errors:', result.errors);
          }
        }
      }
    }, 1000); // Delay to ensure page is fully loaded
  });
}
