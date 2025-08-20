import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface KeyboardShortcutsConfig {
  enableCacheClear?: boolean;
  enableNavigation?: boolean;
  enableSearch?: boolean;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig = {}) => {
  const navigate = useNavigate();
  
  const {
    enableCacheClear = true,
    enableNavigation = true,
    enableSearch = true
  } = config;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Cache Clear Shortcut: Ctrl+Shift+C (or Cmd+Shift+C on Mac)
      if (enableCacheClear && (event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        const confirmed = window.confirm(
          '🧹 Clear all app caches?\n\nThis will reset all stored data and require fresh login. Continue?'
        );
        if (confirmed) {
          clearAllCaches();
        }
      }

      // Navigation Shortcuts
      if (enableNavigation) {
        // Go to Dashboard: Ctrl+1
        if ((event.ctrlKey || event.metaKey) && event.key === '1') {
          event.preventDefault();
          navigate('/dashboard');
          toast.success('🏠 Navigated to Dashboard');
        }

        // Go to POS: Ctrl+2
        if ((event.ctrlKey || event.metaKey) && event.key === '2') {
          event.preventDefault();
          navigate('/pos');
          toast.success('🛒 Navigated to POS');
        }

        // Go to Inventory: Ctrl+3
        if ((event.ctrlKey || event.metaKey) && event.key === '3') {
          event.preventDefault();
          navigate('/inventory');
          toast.success('📦 Navigated to Inventory');
        }

        // Go to Customers: Ctrl+4
        if ((event.ctrlKey || event.metaKey) && event.key === '4') {
          event.preventDefault();
          navigate('/customers');
          toast.success('👥 Navigated to Customers');
        }

        // Go to Devices: Ctrl+5
        if ((event.ctrlKey || event.metaKey) && event.key === '5') {
          event.preventDefault();
          navigate('/devices');
          toast.success('📱 Navigated to Devices');
        }

        // Go to Settings: Ctrl+,
        if ((event.ctrlKey || event.metaKey) && event.key === ',') {
          event.preventDefault();
          navigate('/settings');
          toast.success('⚙️ Navigated to Settings');
        }
      }

      // Search Shortcut: Ctrl+K
      if (enableSearch && (event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Focus on search input or open search modal
        const searchInput = document.querySelector('input[placeholder*="search" i], input[placeholder*="Search" i]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          toast.success('🔍 Search focused');
        }
      }

      // Help Shortcut: F1
      if (event.key === 'F1') {
        event.preventDefault();
        showKeyboardShortcuts();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, enableCacheClear, enableNavigation, enableSearch]);

  const clearAllCaches = async () => {
    try {
      console.log('🧹 Starting cache clearing via keyboard shortcut...');
      
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

  const showKeyboardShortcuts = () => {
    const shortcuts = [
      { key: 'Ctrl+Shift+C', description: 'Clear all caches' },
      { key: 'Ctrl+1', description: 'Go to Dashboard' },
      { key: 'Ctrl+2', description: 'Go to POS' },
      { key: 'Ctrl+3', description: 'Go to Inventory' },
      { key: 'Ctrl+4', description: 'Go to Customers' },
      { key: 'Ctrl+5', description: 'Go to Devices' },
      { key: 'Ctrl+,', description: 'Go to Settings' },
      { key: 'Ctrl+K', description: 'Focus search' },
      { key: 'F1', description: 'Show this help' }
    ];

    const message = shortcuts.map(s => `${s.key}: ${s.description}`).join('\n');
    
    toast.success(
      `⌨️ Keyboard Shortcuts:\n\n${message}`,
      {
        duration: 8000,
        position: 'top-center',
        style: {
          maxWidth: '400px',
          whiteSpace: 'pre-line'
        }
      }
    );
  };
};
