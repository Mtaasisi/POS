import React, { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../features/lats/stores/useInventoryStore';

interface CacheClearButtonProps {
  variant?: 'icon' | 'button' | 'text';
  className?: string;
  showConfirmation?: boolean;
}

const CacheClearButton: React.FC<CacheClearButtonProps> = ({ 
  variant = 'icon', 
  className = '',
  showConfirmation = true 
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const inventoryStore = useInventoryStore();

  const clearAllCaches = async () => {
    if (showConfirmation) {
      const confirmed = window.confirm(
        '🧹 Clear all app caches?\n\nThis will reset all stored data and require fresh login. Continue?'
      );
      if (!confirmed) return;
    }

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
      
      toast.success('🧹 All caches cleared! App will reload fresh data.', {
        duration: 3000,
        position: 'top-center'
      });
      
      console.log('✅ Cache clearing completed successfully');
      
      // Reload the page to ensure fresh start
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      toast.error('Failed to clear some caches. Please try again.', {
        duration: 3000,
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
          await new Promise((resolve) => {
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

  const renderButton = () => {
    const baseClasses = 'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    switch (variant) {
      case 'icon':
        return (
          <button
            onClick={clearAllCaches}
            disabled={isClearing}
            className={`p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg ${baseClasses} ${className}`}
            title="Clear all caches"
          >
            {isClearing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        );
        
      case 'button':
        return (
          <button
            onClick={clearAllCaches}
            disabled={isClearing}
            className={`flex items-center space-x-2 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg ${baseClasses} ${className}`}
          >
            {isClearing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Clearing...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Clear Cache</span>
              </>
            )}
          </button>
        );
        
      case 'text':
        return (
          <button
            onClick={clearAllCaches}
            disabled={isClearing}
            className={`text-sm text-red-600 hover:text-red-700 hover:underline ${baseClasses} ${className}`}
          >
            {isClearing ? 'Clearing...' : 'Clear Cache'}
          </button>
        );
        
      default:
        return null;
    }
  };

  return renderButton();
};

export default CacheClearButton;
