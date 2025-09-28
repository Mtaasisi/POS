import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get configuration from environment variables or config file
const getConfig = () => {
  // Try to get configuration from environment variables first
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {

    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to local development configuration
  console.log('🏠 Using local Supabase configuration (fallback)');
  return {
    url: 'http://127.0.0.1:54321',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  };
};

// Create a true singleton instance to prevent multiple clients
const config = getConfig();

// Log the configuration being used
console.log('🔧 Supabase Configuration:', {
  url: config.url,
  key: config.key ? `${config.key.substring(0, 20)}...` : 'MISSING'
});

// Validate configuration
if (!config.url || !config.key) {
  throw new Error('❌ Invalid Supabase configuration: Missing URL or API key');
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create single instance immediately
export const supabase = createClient<Database>(config.url, config.key, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session in URL (for magic links, etc.)
    detectSessionInUrl: true,
    // Storage key for session - CHANGED to clear cache
    storageKey: 'lats-app-auth-token',
    // Storage interface (only use localStorage in browser)
    storage: isBrowser ? window.localStorage : undefined,
    // Add flow type to prevent auth errors
    flowType: 'pkce',
  },
  // Enable real-time subscriptions with basic configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Enhanced global headers for better network handling
  global: {
    headers: {
      'X-Client-Info': 'lats-app',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': config.key,
      'Authorization': `Bearer ${config.key}`,
    },
  },
  // Basic DB config
  db: {
    schema: 'public',
  },
  // Add fetch configuration for better network handling
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
      // Enhanced headers to fix 406 errors
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
  },
});

// Add query interceptor to fix malformed queries and 406 errors
if (isBrowser) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    // Check if this is a Supabase request
    if (typeof input === 'string' && input.includes('supabase.co/rest/v1/')) {
      // Fix malformed queries with 'string-' prefix
      if (input.includes('id=eq.string-')) {
        const fixedUrl = input.replace(/id=eq\.string-/g, 'id=eq.');
        return originalFetch(fixedUrl, init);
      }
      
      // Fix 406 errors by ensuring proper headers
      const enhancedInit = {
        ...init,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          ...init?.headers,
        },
      };
      
      return originalFetch(input, enhancedInit);
    }
    return originalFetch(input, init);
  };
}

// Add a connection test function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('lats_storage_rooms').select('id').limit(1);
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

// Add a specific test for the failing sale query
export const testFailingSaleQuery = async () => {
  const failingSaleId = '36487185-0673-4e03-83c2-26eba8d9fef7';
  
  try {
    console.log('🔍 Testing failing sale query with ID:', failingSaleId);
    
    // Test 1: Simple select query
    const { data: simpleData, error: simpleError } = await supabase
      .from('lats_sales')
      .select('id, sale_number')
      .eq('id', failingSaleId)
      .single();
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
      return { success: false, error: simpleError, test: 'simple' };
    }
    
    console.log('✅ Simple query successful:', simpleData);
    
    // Test 2: Complex query with joins
    const { data: complexData, error: complexError } = await supabase
      .from('lats_sales')
      .select(`
        id,
        sale_number,
        customer_id,
        total_amount,
        payment_method,
        status,
        created_at,
        lats_sale_items(
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', failingSaleId)
      .single();
    
    if (complexError) {
      console.error('❌ Complex query failed:', complexError);
      return { success: false, error: complexError, test: 'complex' };
    }
    
    console.log('✅ Complex query successful:', complexData);
    return { success: true, data: complexData };
    
  } catch (error) {
    console.error('❌ Test query error:', error);
    return { success: false, error };
  }
};

// Add a retry mechanism for network issues with enhanced QUIC error handling
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a QUIC protocol error or other network error
      const isNetworkError = 
        error.message?.includes('QUIC_PROTOCOL_ERROR') ||
        error.message?.includes('net::ERR_QUIC_PROTOCOL_ERROR') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('AbortError') ||
        error.code === 'NETWORK_ERROR' ||
        error.name === 'NetworkError' ||
        error.name === 'AbortError';
      
      // Only retry network errors, not application errors
      if (!isNetworkError || attempt >= maxRetries) {
        throw error;
      }
      
      // Log the retry attempt with specific QUIC error details
      if (error.message?.includes('QUIC_PROTOCOL_ERROR')) {


      } else {

      }
      
      // Exponential backoff with jitter to prevent thundering herd
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Add a connection health check function
export const checkConnectionHealth = async () => {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('lats_storage_rooms')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        healthy: false,
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      healthy: true,
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Add a connection status monitor
export const monitorConnection = (intervalMs: number = 30000) => {
  const interval = setInterval(async () => {
    const health = await checkConnectionHealth();
    if (!health.healthy) {

    }
  }, intervalMs);
  
  return () => clearInterval(interval);
}; 