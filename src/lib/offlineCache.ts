import { openDB } from 'idb';

const DB_NAME = 'clean-app-cache';
const STORE_NAMES = ['customers', 'devices', 'returns'];
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export async function getCacheDB() {
  return openDB(DB_NAME, 4, {
    upgrade(db, oldVersion, newVersion) {
      // Always create all required object stores
      for (const store of STORE_NAMES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
      
      // Create cache metadata store if it doesn't exist
      if (!db.objectStoreNames.contains('cache_metadata')) {
        db.createObjectStore('cache_metadata', { keyPath: 'store' });
      }
    },
  });
}

export async function cacheSetAll(store: string, items: any[]) {
  try {
    const db = await getCacheDB();
    const tx = db.transaction([store, 'cache_metadata'], 'readwrite');
    
    // Clear existing data
    await tx.objectStore(store).clear();
    
    // Add items with timestamp
    const timestamp = Date.now();
    for (const item of items) {
      await tx.objectStore(store).put({
        ...item,
        _cachedAt: timestamp
      });
    }
    
    // Update cache metadata
    await tx.objectStore('cache_metadata').put({
      store,
      lastUpdated: timestamp,
      itemCount: items.length
    });
    
    await tx.done;
  } catch (error) {
    console.warn(`Failed to cache data for ${store}:`, error);
    // Don't throw - let the app continue without cache
  }
}

export async function cacheGetAll(store: string) {
  try {
    const db = await getCacheDB();
    const tx = db.transaction([store, 'cache_metadata'], 'readonly');
    
    // Check cache expiry
    const metadata = await tx.objectStore('cache_metadata').get(store);
    if (metadata && (Date.now() - metadata.lastUpdated) > CACHE_EXPIRY) {
      // Cache expired, return empty array
      return [];
    }
    
    const items = await tx.objectStore(store).getAll();
    return items.map(item => {
      const { _cachedAt, ...cleanItem } = item;
      return cleanItem;
    });
  } catch (error) {
    console.warn(`Failed to get cached data for ${store}:`, error);
    return [];
  }
}

export async function cacheIsValid(store: string): Promise<boolean> {
  try {
    const db = await getCacheDB();
    const tx = db.transaction('cache_metadata', 'readonly');
    const metadata = await tx.objectStore('cache_metadata').get(store);
    
    if (!metadata) return false;
    
    return (Date.now() - metadata.lastUpdated) <= CACHE_EXPIRY;
  } catch (error) {
    console.warn(`Failed to check cache validity for ${store}:`, error);
    return false;
  }
}

export async function cacheClear(store: string) {
  try {
    const db = await getCacheDB();
    const tx = db.transaction([store, 'cache_metadata'], 'readwrite');
    
    await tx.objectStore(store).clear();
    await tx.objectStore('cache_metadata').delete(store);
    
    await tx.done;
  } catch (error) {
    console.warn(`Failed to clear cache for ${store}:`, error);
  }
}

export async function cacheGetStats() {
  try {
    const db = await getCacheDB();
    const stats: Record<string, any> = {};
    
    for (const store of STORE_NAMES) {
      const tx = db.transaction('cache_metadata', 'readonly');
      const metadata = await tx.objectStore('cache_metadata').get(store);
      
      if (metadata) {
        stats[store] = {
          itemCount: metadata.itemCount,
          lastUpdated: new Date(metadata.lastUpdated),
          isValid: (Date.now() - metadata.lastUpdated) <= CACHE_EXPIRY
        };
      }
    }
    
    return stats;
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return {};
  }
}

export async function clearAllCache() {
  try {
    const db = await getCacheDB();
    const tx = db.transaction([...STORE_NAMES, 'cache_metadata'], 'readwrite');
    
    // Clear all stores
    for (const store of STORE_NAMES) {
      await tx.objectStore(store).clear();
    }
    
    // Clear metadata
    await tx.objectStore('cache_metadata').clear();
    
    await tx.done;

  } catch (error) {
    console.warn('Failed to clear all cache:', error);
  }
}

export async function resetCacheDatabase() {
  try {
    // Delete the database completely
    await deleteDB(DB_NAME);

  } catch (error) {
    console.warn('Failed to reset cache database:', error);
  }
}

// Helper function to delete database
async function deleteDB(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function initializeCache() {
  try {
    // Test if we can access the cache
    const db = await getCacheDB();
    const tx = db.transaction('cache_metadata', 'readonly');
    await tx.objectStore('cache_metadata').get('test');

  } catch (error) {
    console.warn('Cache initialization failed, resetting database:', error);
    try {
      await resetCacheDatabase();
      // Try to initialize again
      await getCacheDB();

    } catch (resetError) {
      console.error('Failed to reset cache database:', resetError);
    }
  }
}

// Global function for debugging (accessible from browser console)
if (typeof window !== 'undefined') {
  (window as any).resetCleanAppCache = async () => {
    try {
      await resetCacheDatabase();

    } catch (error) {
      console.error('Failed to reset cache:', error);
    }
  };
  
  (window as any).clearCleanAppCache = async () => {
    try {
      await clearAllCache();

    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };
} 