// Global type declarations for the app

declare global {
  interface Window {
    __AUTH_DATA_LOADED_FLAG__?: boolean;
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

export {};
