import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Brand } from '../lib/brandApi';
import { toast } from 'react-hot-toast';

// Temporary workaround: Create a clean Supabase client for brands
const createCleanSupabaseClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase environment variables, falling back to main client');
    return supabase;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseBrandsOptions {
  autoLoad?: boolean;
  refreshInterval?: number;
}

interface UseBrandsReturn {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  refreshBrands: () => Promise<void>;
  createBrand: (brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>) => Promise<Brand | null>;
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<Brand | null>;
  deleteBrand: (id: string) => Promise<boolean>;
}

export const useBrands = (options: UseBrandsOptions = {}): UseBrandsReturn => {
  const { autoLoad = true, refreshInterval } = options;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBrands = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 useBrands: Starting to load brands...');
      
      const { data, error: fetchError } = await supabase
        .from('lats_brands')
        .select('*')
        .order('name');

      if (fetchError) {
        console.error('❌ useBrands: Fetch error:', fetchError);
        
        // Check if it's a 400 error with conflicting parameters
        if (fetchError.code === '400' && fetchError.message?.includes('columns')) {
          console.warn('⚠️ useBrands: Detected conflicting parameters, retrying with clean client...');
          
          // Try with clean client first
          try {
            const cleanClient = createCleanSupabaseClient();
            const { data: cleanData, error: cleanError } = await cleanClient
              .from('lats_brands')
              .select('*')
              .order('name');
              
            if (!cleanError) {
              console.log('✅ useBrands: Successfully loaded brands with clean client');
              setBrands(cleanData || []);
              return;
            }
          } catch (cleanClientError) {
            console.warn('⚠️ useBrands: Clean client also failed, trying explicit select...');
          }
          
          // Fallback to explicit column selection
          const { data: retryData, error: retryError } = await supabase
            .from('lats_brands')
            .select('id, name, description, logo_url, website, contact_email, contact_phone, category, is_active, created_at, updated_at')
            .order('name');
            
          if (retryError) {
            console.error('❌ useBrands: Retry also failed:', retryError);
            throw retryError;
          }
          
          console.log('✅ useBrands: Successfully loaded brands after retry');
          setBrands(retryData || []);
          return;
        }
        
        throw fetchError;
      }

      console.log('✅ useBrands: Successfully loaded brands');
      setBrands(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load brands';
      setError(errorMessage);
      console.error('❌ useBrands: Error loading brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async (brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>): Promise<Brand | null> => {
    try {
      const { data, error: createError } = await supabase
        .from('lats_brands')
        .insert([brand])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setBrands(prev => [...prev, data]);
      toast.success('Brand created successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create brand';
      toast.error(errorMessage);
      console.error('Error creating brand:', err);
      return null;
    }
  };

  const updateBrand = async (id: string, updates: Partial<Brand>): Promise<Brand | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('lats_brands')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setBrands(prev => prev.map(brand => brand.id === id ? data : brand));
      toast.success('Brand updated successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update brand';
      toast.error(errorMessage);
      console.error('Error updating brand:', err);
      return null;
    }
  };

  const deleteBrand = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('lats_brands')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setBrands(prev => prev.filter(brand => brand.id !== id));
      toast.success('Brand deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete brand';
      toast.error(errorMessage);
      console.error('Error deleting brand:', err);
      return false;
    }
  };

  const refreshBrands = async () => {
    await loadBrands();
  };

  // Auto-load brands on mount
  useEffect(() => {
    if (autoLoad) {
      loadBrands();
    }
  }, [autoLoad]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(loadBrands, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return {
    brands,
    loading,
    error,
    refreshBrands,
    createBrand,
    updateBrand,
    deleteBrand
  };
};
