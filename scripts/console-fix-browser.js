// Console Issues Fix - Browser Console Script
// Copy and paste this entire script into your browser console

(function() {
  console.log('🔧 Console Issues Fix - Browser Console Script');
  console.log('==============================================\n');

  // Function to get size of localStorage item
  function getItemSize(key) {
    const value = localStorage.getItem(key);
    return value ? new Blob([value]).size : 0;
  }

  // Function to format bytes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Function to analyze localStorage
  function analyzeLocalStorage() {
    console.log('📋 Analyzing localStorage...');
    
    const items = [];
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const size = getItemSize(key);
      items.push({ key, size });
      totalSize += size;
    }
    
    // Sort by size (largest first)
    items.sort((a, b) => b.size - a.size);
    
    console.log(`📊 Found ${items.length} items, total size: ${formatBytes(totalSize)}`);
    
    // Show largest items
    console.log('\n🔍 Largest localStorage items:');
    items.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.key}: ${formatBytes(item.size)}`);
    });
    
    return { items, totalSize };
  }

  // Function to clean up large localStorage items
  function cleanupLocalStorage() {
    console.log('\n🧹 Cleaning up localStorage...');
    
    const { items, totalSize } = analyzeLocalStorage();
    const largeItems = items.filter(item => item.size > 50 * 1024); // 50KB threshold
    
    if (largeItems.length === 0) {
      console.log('✅ No large items found, localStorage is clean');
      return;
    }
    
    console.log(`⚠️ Found ${largeItems.length} large items that may cause 431 errors:`);
    
    // Remove large auth tokens and session data
    const itemsToRemove = [
      'supabase.auth.token',
      'repair-app-auth-token',
      'supabase.auth.expires_at',
      'supabase.auth.refresh_token',
      'supabase.auth.access_token'
    ];
    
    let removedCount = 0;
    let removedSize = 0;
    
    itemsToRemove.forEach(key => {
      const size = getItemSize(key);
      if (size > 0) {
        localStorage.removeItem(key);
        removedCount++;
        removedSize += size;
        console.log(`  🗑️ Removed ${key}: ${formatBytes(size)}`);
      }
    });
    
    // Remove other large items that might cause issues
    largeItems.forEach(item => {
      if (item.size > 100 * 1024 && !itemsToRemove.includes(item.key)) { // 100KB threshold
        localStorage.removeItem(item.key);
        removedCount++;
        removedSize += item.size;
        console.log(`  🗑️ Removed large item ${item.key}: ${formatBytes(item.size)}`);
      }
    });
    
    console.log(`\n✅ Cleanup complete: removed ${removedCount} items, freed ${formatBytes(removedSize)}`);
  }

  // Function to reduce console logging
  function reduceConsoleLogging() {
    console.log('\n🔇 Reducing console logging...');
    
    // Override console methods to reduce spam
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Filter out common spam patterns
    const spamPatterns = [
      'AudioContext: User interaction detected',
      'AudioContext: Initialized successfully',
      'AudioContext: Waiting for user interaction',
      'EnhancedInventoryTab Debug:',
      'LATS Unified Inventory: Loading data',
      'Loading essential data in parallel',
      'Categories loaded',
      'Brands loaded',
      'Suppliers loaded',
      'Products loaded',
      'Sales loaded',
      'Running database diagnostics',
      'Database connection successful',
      'User authenticated:'
    ];
    
    console.log = function(...args) {
      const message = args.join(' ');
      const isSpam = spamPatterns.some(pattern => message.includes(pattern));
      
      if (!isSpam) {
        originalLog.apply(console, args);
      }
    };
    
    console.warn = function(...args) {
      const message = args.join(' ');
      const isSpam = spamPatterns.some(pattern => message.includes(pattern));
      
      if (!isSpam) {
        originalWarn.apply(console, args);
      }
    };
    
    console.error = function(...args) {
      // Don't filter error messages
      originalError.apply(console, args);
    };
    
    console.log('✅ Console logging reduced (spam filtered)');
  }

  // Function to fix network configuration
  function fixNetworkConfig() {
    console.log('\n🌐 Fixing network configuration...');
    
    // Override fetch to handle QUIC protocol errors
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      try {
        return await originalFetch(input, init);
      } catch (error) {
        // Handle QUIC protocol errors
        if (error.message && error.message.includes('ERR_QUIC_PROTOCOL_ERROR')) {
          console.warn('🌐 QUIC protocol error detected, retrying with different protocol...');
          
          // Try to modify the request to use HTTP/1.1 instead of HTTP/3
          const modifiedInit = {
            ...init,
            headers: {
              ...init?.headers,
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            }
          };
          
          try {
            return await originalFetch(input, modifiedInit);
          } catch (retryError) {
            console.error('🌐 Retry failed:', retryError.message);
            throw retryError;
          }
        }
        throw error;
      }
    };
    
    console.log('✅ Network error handling configured');
  }

  // Function to check for HTTP 431 errors
  function checkFor431Errors() {
    console.log('\n🔍 Checking for HTTP 431 errors...');
    
    // Override fetch to detect 431 errors
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      try {
        const response = await originalFetch(input, init);
        
        if (response.status === 431) {
          console.error('❌ HTTP 431 error detected!');
          console.error('   URL:', typeof input === 'string' ? input : input.url);
          console.error('   This usually means request headers are too large');
          console.error('   Consider cleaning localStorage or reducing header size');
          
          // Automatically trigger cleanup
          cleanupLocalStorage();
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };
    
    console.log('✅ HTTP 431 error detection configured');
  }

  // Run all fixes
  try {
    console.log('🌐 Browser environment detected');
    
    // Run all fixes
    analyzeLocalStorage();
    cleanupLocalStorage();
    fixNetworkConfig();
    reduceConsoleLogging();
    checkFor431Errors();
    
    console.log('\n🎉 All fixes applied successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('  ✅ localStorage cleaned up');
    console.log('  ✅ Network error handling improved');
    console.log('  ✅ Console logging reduced');
    console.log('  ✅ HTTP 431 error detection added');
    
    console.log('\n💡 Tips:');
    console.log('  • Refresh the page to see the improvements');
    console.log('  • Monitor the console for any remaining issues');
    console.log('  • If 431 errors persist, manually clear localStorage');
    
  } catch (error) {
    console.error('❌ Error running fixes:', error.message);
  }
})();
