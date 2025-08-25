import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAllCustomers, fetchAllCustomersSimple, clearRequestCache, checkNetworkStatus, getConnectionQuality } from '../lib/customerApi/core';
import { Customer } from '../lib/customerApi/types';

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
    
    // Log network status before attempting fetch
    const currentNetworkStatus = checkNetworkStatus();
    const connectionQuality = getConnectionQuality();
    console.log('🌐 Network status:', {
      online: currentNetworkStatus.online,
      quality: connectionQuality.quality,
      message: connectionQuality.message,
      effectiveType: currentNetworkStatus.effectiveType,
      downlink: currentNetworkStatus.downlink,
      rtt: currentNetworkStatus.rtt
    });
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = customerDataCache.get(cacheKeyWithType);
      if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
        console.log('📦 Using cached customer data');
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

    // Create new request
    setLoading(true);
    setError(null);
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      console.log(`🔍 Fetching customers (${simple ? 'simple' : 'full'})...`);
      
      const fetchPromise = simple ? fetchAllCustomersSimple() : fetchAllCustomers();
      
      // Store the promise in cache to prevent duplicate requests
      customerDataCache.set(cacheKeyWithType, {
        data: [],
        timestamp: Date.now(),
        promise: fetchPromise
      });
      
      const data = await fetchPromise;
      
      // Update cache with actual data
      customerDataCache.set(cacheKeyWithType, {
        data,
        timestamp: Date.now()
      });
      
      if (isMountedRef.current) {
        setCustomers(data);
        setLoading(false);
        setError(null);
        console.log(`✅ Successfully loaded ${data.length} customers`);
      }
      
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
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
        
        setError(errorMessage);
        setLoading(false);
      }
      
      // Remove failed request from cache
      customerDataCache.delete(cacheKeyWithType);
    } finally {
      abortControllerRef.current = null;
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
