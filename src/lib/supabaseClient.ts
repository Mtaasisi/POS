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
      // Enable real-time subscriptions
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
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
    if (isBrowser) {
      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('🌐 Network connection restored');
      });
      
      window.addEventListener('offline', () => {
        console.log('📴 Network connection lost');
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
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.warn('🌐 Network error detected, attempting to use offline data');
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
    
    console.log('✅ Supabase client instance created successfully');
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