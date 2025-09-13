import React, { useState } from 'react';
import { Trash2, RefreshCw, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../features/lats/stores/useInventoryStore';

interface CacheManagerProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const CacheManager: React.FC<CacheManagerProps> = ({ isVisible = false, onClose }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);
  
  const inventoryStore = useInventoryStore();

  const clearAllCaches = async () => {
    setIsClearing(true);
    
    try {
      console.log('🧹 Starting cache clearing process...');
      
      // Clear inventory store cache
      inventoryStore.clearCache();
      console.log('✅ Inventory cache cleared');
      
      // Clear localStorage
      const keysToRemove = [
        'repair-app-auth-token',
        'supabase.auth.token',
        'offline-cache',
        'pending-actions',
        'user-goals',
        'app-settings',
        'pos-settings',
        'customer-cache',
        'device-cache',
        'product-cache'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed localStorage key: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Could not remove localStorage key: ${key}`, error);
        }
      });
      
      // Clear sessionStorage
      const sessionKeysToRemove = [
        'scroll-pos-',
        'form-data',
        'temp-data'
      ];
      
      sessionKeysToRemove.forEach(key => {
        try {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Removed sessionStorage key: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Could not remove sessionStorage key: ${key}`, error);
        }
      });
      
      // Clear IndexedDB databases
      await clearIndexedDB();
      
      // Reset data loaded flag in AuthContext
      if (window.__AUTH_DATA_LOADED_FLAG__) {
        window.__AUTH_DATA_LOADED_FLAG__ = false;
        console.log('🔄 Reset auth data loaded flag');
      }
      
      // Force reload of critical data
      await reloadCriticalData();
      
      setLastCleared(new Date());
      
      toast.success('🧹 All caches cleared successfully! App will reload fresh data.', {
        duration: 4000,
        position: 'top-center'
      });
      
      console.log('✅ Cache clearing completed successfully');
      
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      toast.error('Failed to clear some caches. Please try again.', {
        duration: 4000,
        position: 'top-center'
      });
    } finally {
      setIsClearing(false);
    }
  };

  const clearIndexedDB = async () => {
    try {
      const databases = [
        'offline-cache',
        'pending-actions', 
        'user-goals',
        'app-cache',
        'product-cache',
        'customer-cache'
      ];
      
      for (const dbName of databases) {
        try {
          const request = indexedDB.deleteDatabase(dbName);
          await new Promise((resolve, reject) => {
            request.onsuccess = () => {
              console.log(`🗑️ Deleted IndexedDB: ${dbName}`);
              resolve(true);
            };
            request.onerror = () => {
              console.warn(`⚠️ Could not delete IndexedDB: ${dbName}`);
              resolve(false);
            };
          });
        } catch (error) {
          console.warn(`⚠️ Error deleting IndexedDB ${dbName}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error clearing IndexedDB:', error);
    }
  };

  const reloadCriticalData = async () => {
    try {
      console.log('🔄 Reloading critical data...');
      
      // Reload inventory data
      await inventoryStore.loadProducts({ page: 1, limit: 50 });
      await inventoryStore.loadCategories();
      await inventoryStore.loadSuppliers();
      
      console.log('✅ Critical data reloaded');
    } catch (error) {
      console.error('❌ Error reloading critical data:', error);
    }
  };

  const getCacheInfo = () => {
    const cacheInfo = {
      localStorage: 0,
      sessionStorage: 0,
      inventoryCache: inventoryStore.dataCache ? Object.keys(inventoryStore.dataCache).length : 0
    };
    
    try {
      cacheInfo.localStorage = localStorage.length;
      cacheInfo.sessionStorage = sessionStorage.length;
    } catch (error) {
      console.warn('⚠️ Could not read storage info:', error);
    }
    
    return cacheInfo;
  };

  const cacheInfo = getCacheInfo();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Cache Manager</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Cache Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Current Cache Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Local Storage:</span>
                <span className="font-mono">{cacheInfo.localStorage} items</span>
              </div>
              <div className="flex justify-between">
                <span>Session Storage:</span>
                <span className="font-mono">{cacheInfo.sessionStorage} items</span>
              </div>
              <div className="flex justify-between">
                <span>Inventory Cache:</span>
                <span className="font-mono">{cacheInfo.inventoryCache} types</span>
              </div>
            </div>
          </div>

          {/* Last Cleared */}
          {lastCleared && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Last cleared: {lastCleared.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Warning:</p>
                <p>Clearing cache will reset all app data and require fresh login. This may take a moment.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={clearAllCaches}
              disabled={isClearing}
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Caches</span>
                </>
              )}
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                disabled={isClearing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheManager;
