import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAllCustomers, fetchAllCustomersSimple, clearRequestCache, checkNetworkStatus, getConnectionQuality } from '../lib/customerApi/core';
import { Customer } from '../lib/customerApi/types';
import { retryWithBackoff, isNetworkError } from '../utils/networkErrorHandler';

// Cache for customer data to prevent unnecessary refetches
const customerDataCache = new Map<string, {
  data: Customer[];
  timestamp: number;
  promise?: Promise<Customer[]>;
}>();

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

interface UseCustomersOptions {
  autoFetch?: boolean;
  simple?: boolean;
  cacheKey?: string;
}

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  networkStatus: {
    online: boolean;
    quality: string;
    message: string;
  };
}

export function useCustomers(options: UseCustomersOptions = {}): UseCustomersReturn {
  const { autoFetch = true, simple = false, cacheKey = 'default' } = options;
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    quality: 'unknown',
    message: 'Checking connection...'
  });
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Network status monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      const quality = getConnectionQuality();
      setNetworkStatus({
        online: navigator.onLine,
        quality: quality.quality,
        message: quality.message
      });
    };

    // Initial check
    updateNetworkStatus();

    // Listen for online/offline events
    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic network quality check
    const interval = setInterval(updateNetworkStatus, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchCustomers = async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    const cacheKeyWithType = `${cacheKey}_${simple ? 'simple' : 'full'}`;
    
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = customerDataCache.get(cacheKeyWithType);
      if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
        setCustomers(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
      
      // Check if there's already a request in progress
      if (cached?.promise) {
        console.log('🔄 Waiting for existing customer fetch request');
        setLoading(true);
        try {
          const data = await cached.promise;
          if (isMountedRef.current) {
            setCustomers(data);
            setLoading(false);
            setError(null);
          }
        } catch (err) {
          if (isMountedRef.current) {
            setError(err instanceof Error ? err.message : 'Failed to fetch customers');
            setLoading(false);
          }
        }
        return;
      }
    }

    // Create new request with enhanced retry logic for network errors
    const attemptFetch = async (): Promise<Customer[]> => {
      return retryWithBackoff(async () => { // Start with 2 seconds
      let fetchTimeout: NodeJS.Timeout | undefined;
      
      try {
        setLoading(true);
        setError(null);
        
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();
        
        // Add timeout for the entire fetch operation
        fetchTimeout = setTimeout(() => {
          if (abortControllerRef.current) {
            console.log('⏰ Customer fetch timeout - aborting request');
            abortControllerRef.current.abort();
          }
        }, 60000); // 60 second timeout for entire operation
        
        
        const fetchPromise = simple ? fetchAllCustomersSimple() : fetchAllCustomers();
        
        // Store the promise in cache to prevent duplicate requests
        customerDataCache.set(cacheKeyWithType, {
          data: [],
          timestamp: Date.now(),
          promise: fetchPromise
        });
        
        const data = await fetchPromise;
        
        // Clear timeout since we got data
        if (fetchTimeout) {
          clearTimeout(fetchTimeout);
        }
        
        // Update cache with actual data
        customerDataCache.set(cacheKeyWithType, {
          data,
          timestamp: Date.now()
        });
        
        if (isMountedRef.current) {
          setCustomers(data);
          setLoading(false);
          setError(null);
        }
        
        return data;
        
      } catch (err) {
        // Clear timeout since we got an error
        if (fetchTimeout) {
          clearTimeout(fetchTimeout);
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
        
        // Check if it's a 503 error and we should retry
        if ((errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
          console.log(`🔄 503 error detected, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
          
          if (isMountedRef.current) {
            setError(`Database temporarily unavailable. Retrying in ${Math.round(delay / 1000)} seconds...`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the fetch
          return attemptFetch(retryCount + 1);
        }
        
        // If we've exhausted retries or it's not a 503 error, handle the error
        if (isMountedRef.current) {
          console.error('❌ Error fetching customers:', errorMessage);
          
          // Enhanced error logging for network issues
          if (errorMessage.includes('QUIC_PROTOCOL_ERROR') || errorMessage.includes('net::ERR_QUIC_PROTOCOL_ERROR')) {
            console.error('🌐 QUIC Protocol Error detected. This may be due to:');
            console.error('   - Network instability or poor connection quality');
            console.error('   - Firewall or proxy interference');
            console.error('   - Browser network stack issues');
            console.error('   - Supabase server connectivity problems');
            console.error('   - DNS resolution issues');
          }
          
          // Check for timeout errors
          if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout')) {
            console.error('⏰ Request timeout detected. This may be due to:');
            console.error('   - Slow network connection');
            console.error('   - Large dataset being fetched');
            console.error('   - Server overload');
            console.error('   - Network congestion');
          }

          // Handle 503 Service Unavailable errors specifically
          if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
            console.error('🔧 503 Service Unavailable detected. This indicates:');
            console.error('   - Supabase service is temporarily down');
            console.error('   - Database maintenance in progress');
            console.error('   - Service quota exceeded');
            console.error('   - Network connectivity issues');
            
            // Set a more user-friendly error message
            setError('Database service is temporarily unavailable. Please try again in a few minutes.');
          } else {
            setError(errorMessage);
          }
          
          setLoading(false);
        }
        
        // Remove failed request from cache
        customerDataCache.delete(cacheKeyWithType);
        throw err;
             } finally {
         if (fetchTimeout) {
           clearTimeout(fetchTimeout);
         }
         abortControllerRef.current = null;
       }
    };

    // Start the fetch with retry logic
    try {
      await attemptFetch();
    } catch (err) {
      // Error is already handled in attemptFetch
    }
  };

  const refetch = async () => {
    await fetchCustomers(true);
  };

  const clearCache = () => {
    customerDataCache.clear();
    clearRequestCache();
    console.log('🧹 Customer cache cleared');
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchCustomers();
    }
  }, [autoFetch, simple, cacheKey]);

  return {
    customers,
    loading,
    error,
    refetch,
    clearCache,
    networkStatus
  };
}

// Export cache management functions
export function clearCustomerCache() {
  customerDataCache.clear();
  clearRequestCache();
  console.log('🧹 All customer caches cleared');
}

export function getCustomerCacheStats() {
  return {
    size: customerDataCache.size,
    entries: Array.from(customerDataCache.entries()).map(([key, value]) => ({
      key,
      hasData: value.data.length > 0,
      hasPromise: !!value.promise,
      age: Date.now() - value.timestamp
    }))
  };
}

// Debug function to help diagnose network issues
export function debugCustomerFetch() {
  const networkStatus = checkNetworkStatus();
  const connectionQuality = getConnectionQuality();
  const cacheStats = getCustomerCacheStats();
  
  console.log('🔍 Customer Fetch Debug Info:', {
    networkStatus,
    connectionQuality,
    cacheStats,
    navigatorOnline: navigator.onLine,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
  
  return {
    networkStatus,
    connectionQuality,
    cacheStats
  };
}
