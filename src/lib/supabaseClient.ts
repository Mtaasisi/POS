import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Type definition for window config
declare global {
  interface Window {
    CLEAN_APP_CONFIG?: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    };
    ENV?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
    };
  }
}

// Get configuration from environment variables or config file
const getConfig = () => {
  // Try to get configuration from environment variables first
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    console.log('🔧 Using environment variables for Supabase configuration');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration (for backward compatibility)
  console.log('🔧 Using fallback Supabase configuration');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

// Create a singleton instance to prevent multiple clients
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    console.log('🔧 Creating Supabase client instance...');
    
    // Clear any cached auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('repair-app-auth-token');
      localStorage.removeItem('supabase.auth.token');
      console.log('🧹 Cleared cached auth data');
    }
    
    const config = getConfig();
    
    // Validate configuration
    if (!config.url || !config.key) {
      throw new Error('❌ Invalid Supabase configuration: Missing URL or API key');
    }
    
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';
    
    supabaseInstance = createClient<Database>(config.url, config.key, {
      auth: {
        // Enable automatic session refresh
        autoRefreshToken: true,
        // Persist session in localStorage
        persistSession: true,
        // Detect session in URL (for magic links, etc.)
        detectSessionInUrl: true,
        // Storage key for session
        storageKey: 'repair-app-auth-token',
        // Storage interface (only use localStorage in browser)
        storage: isBrowser ? window.localStorage : undefined,
      },
      // Enable real-time subscriptions with improved configuration
      realtime: {
        params: {
          eventsPerSecond: 10, // Increased for better responsiveness
        },
        // Improved real-time configuration for better stability
        heartbeatIntervalMs: 15000, // More frequent heartbeats
        reconnectAfterMs: (tries) => Math.min(tries * 1000, 15000), // Faster reconnection
        timeoutMs: 20000, // Connection timeout
        retryAttempts: 5, // Number of retry attempts
      },
      // Global headers - don't set Content-Type globally to avoid conflicts with file uploads
      global: {
        headers: {
          'X-Client-Info': 'repair-app',
        },
      },
      // Add better error handling for network issues
      db: {
        schema: 'public',
      },
    });
    
    // Add global error handler for network issues
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', () => {
        // Reduced logging to prevent console spam
      });
      
      window.addEventListener('offline', () => {
        // Reduced logging to prevent console spam
      });
      
      // Override fetch to handle network errors gracefully
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        try {
          // Add CORS headers for Supabase requests
          if (typeof input === 'string' && input.includes('supabase.co')) {
            const modifiedInit = {
              ...init,
              headers: {
                ...init?.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
              },
            };
            return await originalFetch(input, modifiedInit);
          }
          return await originalFetch(input, init);
        } catch (error) {
          // Handle QUIC protocol errors specifically
          if (error instanceof TypeError && error.message.includes('ERR_QUIC_PROTOCOL_ERROR')) {
            // Reduced logging to prevent console spam
            // Return a mock response to prevent infinite retries
            if (typeof input === 'string' && input.includes('/rest/v1/')) {
              return new Response(JSON.stringify({ 
                error: 'Network protocol error',
                message: 'Please check your internet connection'
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
          
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            // Reduced logging to prevent console spam
            // Return a mock response for auth endpoints to prevent infinite retries
            if (typeof input === 'string' && input.includes('/auth/')) {
              return new Response(JSON.stringify({ 
                error: 'Network unavailable',
                message: 'Please check your internet connection'
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
          throw error;
        }
      };
    }
    
    // Reduced logging to prevent console spam
  }
  
  return supabaseInstance;
})();

// Add a connection test function
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('devices').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Supabase connection test successful');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Supabase connection test failed with exception:', error);
    return { success: false, error };
  }
};

// Add a retry mechanism for network issues
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
      
      // Check if it's a network error
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                           error.message?.includes('NetworkError') ||
                           error.message?.includes('ERR_CONNECTION_CLOSED');
      
      if (isNetworkError && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🌐 Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a network error or we've exhausted retries, throw the error
      throw error;
    }
  }
  
  throw lastError;
}; 