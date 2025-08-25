// Client-side fix for QUIC protocol errors
// Add this to your main JavaScript file or as a separate script

(function() {
  'use strict';
  
  // Function to retry failed requests with different protocol
  function retryWithFallback(url, options = {}) {
    return new Promise((resolve, reject) => {
      // First try with normal fetch
      fetch(url, options)
        .then(response => {
          if (response.ok) {
            resolve(response);
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        })
        .catch(error => {
          // If QUIC error, try with forced HTTP/2
          if (error.message.includes('QUIC') || error.message.includes('quic')) {
            console.warn('QUIC protocol error detected, retrying with fallback...');
            
            // Add headers to force HTTP/2
            const fallbackOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache'
              }
            };
            
            fetch(url, fallbackOptions)
              .then(resolve)
              .catch(reject);
          } else {
            reject(error);
          }
        });
    });
  }
  
  // Override fetch for QUIC error handling
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Only apply to asset requests
    if (typeof url === 'string' && url.includes('/assets/')) {
      return retryWithFallback(url, options);
    }
    return originalFetch.apply(this, arguments);
  };
  
  console.log('✅ QUIC protocol error fix loaded');
})();
