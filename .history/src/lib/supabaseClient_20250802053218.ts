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
  // Use online Supabase configuration
  console.log('🔧 Using online Supabase configuration');
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
      // Global headers
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