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
  
  // Fallback to production configuration
  console.log('🌐 Using production Supabase configuration (fallback)');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  };
};

// Create a true singleton instance to prevent multiple clients
const config = getConfig();

// Log the configuration being used
console.log('🔧 Enhanced Supabase Configuration:', {
  url: config.url,
  key: config.key ? `${config.key.substring(0, 20)}...` : 'MISSING'
});

// Validate configuration
if (!config.url || !config.key) {
  throw new Error('❌ Invalid Supabase configuration: Missing URL or API key');
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create single instance with enhanced configuration to fix 400/406 errors
export const supabase = createClient<Database>(config.url, config.key, {
  auth: {
    // Disable automatic session refresh when no session exists
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session in URL (for magic links, etc.)
    detectSessionInUrl: false, // Disable to prevent unnecessary checks
    // Storage key for session - CHANGED to clear cache
    storageKey: 'lats-app-auth-token',
    // Storage interface (only use localStorage in browser)
    storage: isBrowser ? window.localStorage : undefined,
    // Add flow type to prevent auth errors
    flowType: 'pkce',
    // Disable debug mode to reduce console spam
    debug: false,
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
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  },
  // Basic DB config
  db: {
    schema: 'public',
  },
  // Enhanced fetch configuration for better network handling
  fetch: (url, options = {}) => {
    // Enhanced headers to fix 406 and 400 errors
    const enhancedHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': config.key,
      'Authorization': `Bearer ${config.key}`,
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'X-Client-Info': 'lats-app',
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
      // Enhanced headers to fix 406 errors
      headers: enhancedHeaders,
    });
  },
});

// Enhanced query interceptor to fix malformed queries and 406/400 errors
if (isBrowser) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    // Check if this is a Supabase request
    if (typeof input === 'string' && input.includes('supabase.co/rest/v1/')) {
      console.log('🔍 Intercepting Supabase request:', input);
      
      // Fix malformed queries with 'string-' prefix
      if (input.includes('id=eq.string-')) {
        const fixedUrl = input.replace(/id=eq\.string-/g, 'id=eq.');
        console.log('🔧 Fixed malformed query:', fixedUrl);
        return originalFetch(fixedUrl, init);
      }
      
      // Fix 406 and 400 errors by ensuring proper headers
      const enhancedInit = {
        ...init,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Client-Info': 'lats-app',
          ...init?.headers,
        },
      };
      
      console.log('🔧 Enhanced headers for request:', enhancedInit.headers);
      return originalFetch(input, enhancedInit);
    }
    return originalFetch(input, init);
  };
}

// Enhanced connection test function
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing enhanced Supabase connection...');
    
    // Test with a simple table first
    const { data, error } = await supabase.from('customers').select('id').limit(1);
    
    if (error) {
      console.error('❌ Enhanced connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Enhanced connection test successful');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Enhanced connection test error:', error);
    return { success: false, error };
  }
};

// Enhanced test for the failing queries
export const testFailingQueries = async () => {
  console.log('🔍 Testing failing queries with enhanced configuration...');
  
  const results = {
    authUsers: false,
    latsSales: false,
    errors: [] as string[]
  };
  
  try {
    // Test 1: auth_users query - Fixed to use name field instead of id
    console.log('🔍 Testing auth_users query...');
    const { data: authData, error: authError } = await supabase
      .from('auth_users')
      .select('id, name, email')
      .eq('name', 'care');
    
    if (authError) {
      console.error('❌ auth_users query failed:', authError);
      results.errors.push(`auth_users: ${authError.message}`);
    } else {
      console.log('✅ auth_users query successful:', authData);
      results.authUsers = true;
    }
    
    // Test 2: lats_sales query
    console.log('🔍 Testing lats_sales query...');
    const { data: salesData, error: salesError } = await supabase
      .from('lats_sales')
      .select('id, sale_number')
      .eq('id', '36487185-0673-4e03-83c2-26eba8d9fef7');
    
    if (salesError) {
      console.error('❌ lats_sales query failed:', salesError);
      results.errors.push(`lats_sales: ${salesError.message}`);
    } else {
      console.log('✅ lats_sales query successful:', salesData);
      results.latsSales = true;
    }
    
    return results;
  } catch (error) {
    console.error('❌ Test queries error:', error);
    results.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return results;
  }
};

// Enhanced retry mechanism
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
      
      // Check if this is a network error
      const isNetworkError = 
        error.message?.includes('QUIC_PROTOCOL_ERROR') ||
        error.message?.includes('net::ERR_QUIC_PROTOCOL_ERROR') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('AbortError') ||
        error.message?.includes('406') ||
        error.message?.includes('400') ||
        error.code === 'NETWORK_ERROR' ||
        error.name === 'NetworkError' ||
        error.name === 'AbortError';
      
      // Only retry network errors, not application errors
      if (!isNetworkError || attempt >= maxRetries) {
        throw error;
      }
      
      console.log(`🔄 Retrying request (attempt ${attempt + 1}/${maxRetries + 1})...`);
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Enhanced connection health check
export const checkConnectionHealth = async () => {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('customers')
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

// Enhanced connection status monitor
export const monitorConnection = (intervalMs: number = 30000) => {
  const interval = setInterval(async () => {
    const health = await checkConnectionHealth();
    if (!health.healthy) {
      console.warn('⚠️ Supabase connection unhealthy:', health);
    }
  }, intervalMs);
  
  return () => clearInterval(interval);
};

// Custom auth state manager to prevent excessive auth checks
let authStateInitialized = false;
let authStateCallbacks: Array<(event: string, session: any) => void> = [];

// Enhanced auth state change handler
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  authStateCallbacks.push(callback);
  
  // Only initialize auth state once
  if (!authStateInitialized) {
    authStateInitialized = true;
    
    supabase.auth.onAuthStateChange((event, session) => {
      // Only log significant events, not every INITIAL_SESSION
      if (event !== 'INITIAL_SESSION' || session) {
        console.log(`🔐 Auth state changed: ${event}`, session ? 'authenticated' : 'not authenticated');
      }
      
      // Call all registered callbacks
      authStateCallbacks.forEach(cb => cb(event, session));
    });
  }
  
  // Return unsubscribe function
  return () => {
    const index = authStateCallbacks.indexOf(callback);
    if (index > -1) {
      authStateCallbacks.splice(index, 1);
    }
  };
};

// Auto-run tests when this module is imported
if (isBrowser) {
  setTimeout(async () => {
    console.log('🚀 Running enhanced Supabase tests...');
    await testSupabaseConnection();
    await testFailingQueries();
  }, 2000);
}
