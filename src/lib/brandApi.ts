import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Temporary workaround: Create a clean Supabase client for brands
// This helps avoid any global configurations that might be adding conflicting parameters
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

// Debug function to help identify the source of conflicting parameters
const debugSupabaseRequest = (table: string, operation: string) => {
  console.log(`🔍 Debug: ${operation} on ${table}`);
  console.log('🔍 Debug: Current URL:', window.location.href);
  console.log('🔍 Debug: User Agent:', navigator.userAgent);
  
  // Check if there are any browser extensions that might interfere
  if (typeof window !== 'undefined') {
    // Log any global objects that might be modifying requests
    console.log('🔍 Debug: Checking for potential request modifiers...');
  }
};

export interface BrandCategory {
  value: string;
  label: string;
  icon: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;           // Database column name
  logo_url?: string;       // API interface name (alias)
  category?: string[];     // Array of categories
  categories?: string[];   // Backward compatibility
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandData {
  name: string;
  description?: string;
  logo_url?: string;
  category: string[];
  is_active?: boolean;
}

export interface UpdateBrandData {
  name?: string;
  description?: string;
  logo_url?: string;
  category?: string[];
  is_active?: boolean;
}

// Get all active brands
export const getActiveBrands = async (): Promise<Brand[]> => {
  try {
    console.log('🔍 getActiveBrands: Starting fetch...');
    debugSupabaseRequest('lats_brands', 'getActiveBrands');
    
    const { data, error } = await supabase
      .from('lats_brands')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching brands:', error);
      
      // Check if it's a 400 error with conflicting parameters
      if (error.code === '400' && error.message?.includes('columns')) {
        console.warn('⚠️ Detected conflicting parameters, retrying with clean client...');
        
        // Try with clean client first
        try {
          const cleanClient = createCleanSupabaseClient();
          const { data: cleanData, error: cleanError } = await cleanClient
            .from('lats_brands')
            .select('*')
            .order('name');
            
          if (!cleanError) {
            console.log('✅ getActiveBrands: Successfully fetched brands with clean client');
            return cleanData || [];
          }
        } catch (cleanClientError) {
          console.warn('⚠️ Clean client also failed, trying explicit select...');
        }
        
        // Fallback to explicit column selection
        const { data: retryData, error: retryError } = await supabase
          .from('lats_brands')
          .select('id, name, description, logo_url, website, contact_email, contact_phone, category, is_active, created_at, updated_at')
          .order('name');
          
        if (retryError) {
          console.error('❌ Retry also failed:', retryError);
          throw new Error('Failed to fetch brands after retry');
        }
        
        console.log('✅ getActiveBrands: Successfully fetched brands after retry');
        return retryData || [];
      }
      
      throw new Error('Failed to fetch brands');
    }

    console.log('✅ getActiveBrands: Successfully fetched brands');
    return data || [];
  } catch (error) {
    console.error('❌ Error in getActiveBrands:', error);
    throw error;
  }
};

// Get all brands (including inactive)
export const getAllBrands = async (): Promise<Brand[]> => {
  try {
    console.log('🔍 getAllBrands: Starting fetch...');
    
    const { data, error } = await supabase
      .from('lats_brands')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching all brands:', error);
      
      // Check if it's a 400 error with conflicting parameters
      if (error.code === '400' && error.message?.includes('columns')) {
        console.warn('⚠️ Detected conflicting parameters, retrying with clean client...');
        
        // Try with clean client first
        try {
          const cleanClient = createCleanSupabaseClient();
          const { data: cleanData, error: cleanError } = await cleanClient
            .from('lats_brands')
            .select('*')
            .order('name');
            
          if (!cleanError) {
            console.log('✅ getAllBrands: Successfully fetched brands with clean client');
            return cleanData || [];
          }
        } catch (cleanClientError) {
          console.warn('⚠️ Clean client also failed, trying explicit select...');
        }
        
        // Fallback to explicit column selection
        const { data: retryData, error: retryError } = await supabase
          .from('lats_brands')
          .select('id, name, description, logo_url, website, contact_email, contact_phone, category, is_active, created_at, updated_at')
          .order('name');
          
        if (retryError) {
          console.error('❌ Retry also failed:', retryError);
          throw new Error('Failed to fetch brands after retry');
        }
        
        console.log('✅ getAllBrands: Successfully fetched brands after retry');
        return retryData || [];
      }
      
      throw new Error('Failed to fetch brands');
    }

    console.log('✅ getAllBrands: Successfully fetched brands');
    return data || [];
  } catch (error) {
    console.error('❌ Error in getAllBrands:', error);
    throw error;
  }
};

// Create a new brand
export const createBrand = async (brandData: CreateBrandData): Promise<Brand> => {
  try {
    console.log('🔍 createBrand: Starting with data:', brandData);
    
    // Clean up the data to avoid type conflicts
    const dataToInsert: any = { ...brandData };
    
    // Handle category field properly
    if (brandData.category) {
      dataToInsert.category = brandData.category;
      // Also set categories for backward compatibility
      dataToInsert.categories = brandData.category;
      // Remove categories field to avoid conflicts
      delete dataToInsert.categories;
    }
    
    // Handle logo_url field properly
    if (brandData.logo_url) {
      dataToInsert.logo = brandData.logo_url;
      dataToInsert.logo_url = brandData.logo_url;
    }
    
    // Ensure is_active has a default value
    if (dataToInsert.is_active === undefined) {
      dataToInsert.is_active = true;
    }
    
    // Remove any undefined values
    Object.keys(dataToInsert).forEach(key => {
      if (dataToInsert[key] === undefined) {
        delete dataToInsert[key];
      }
    });

    console.log('🔍 createBrand: Data to insert:', dataToInsert);

    const { data, error } = await supabase
      .from('lats_brands')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating brand:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to create brand: ${error.message}`);
    }

    console.log('✅ createBrand: Successfully created brand:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in createBrand:', error);
    throw error;
  }
};

// Update an existing brand
export const updateBrand = async (id: string, brandData: UpdateBrandData): Promise<Brand> => {
  try {
    console.log('🔍 updateBrand: Starting with ID:', id, 'and data:', brandData);
    
    // Clean up the data to avoid type conflicts
    const dataToUpdate: any = { ...brandData };
    
    // Handle category field properly
    if (brandData.category) {
      dataToUpdate.category = brandData.category;
      // Also set categories for backward compatibility
      dataToUpdate.categories = brandData.category;
      // Remove categories field to avoid conflicts
      delete dataToUpdate.categories;
    }
    
    // Handle logo_url field properly
    if (brandData.logo_url) {
      dataToUpdate.logo = brandData.logo_url;
      dataToUpdate.logo_url = brandData.logo_url;
    }
    
    // Remove any undefined values
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    console.log('🔍 updateBrand: Data to update:', dataToUpdate);

    const { data, error } = await supabase
      .from('lats_brands')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating brand:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to update brand: ${error.message}`);
    }

    console.log('✅ updateBrand: Successfully updated brand:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in updateBrand:', error);
    throw error;
  }
};

// Delete a brand (soft delete by setting is_active to false)
export const deleteBrand = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lats_brands')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting brand:', error);
      throw new Error('Failed to delete brand');
    }
  } catch (error) {
    console.error('Error in deleteBrand:', error);
    throw error;
  }
};

// Hard delete a brand (permanently remove from database)
export const hardDeleteBrand = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lats_brands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error hard deleting brand:', error);
      throw new Error('Failed to delete brand');
    }
  } catch (error) {
    console.error('Error in hardDeleteBrand:', error);
    throw error;
  }
};

// Restore a deleted brand
export const restoreBrand = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lats_brands')
      .update({ is_active: true })
      .eq('id', id);

    if (error) {
      console.error('Error restoring brand:', error);
      throw new Error('Failed to restore brand');
    }
  } catch (error) {
    console.error('Error in restoreBrand:', error);
    throw error;
  }
};

// Get brand by ID
export const getBrandById = async (id: string): Promise<Brand | null> => {
  try {
    const { data, error } = await supabase
      .from('lats_brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching brand by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getBrandById:', error);
    return null;
  }
};

// Search brands by name
export const searchBrands = async (query: string): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_brands')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name');

    if (error) {
      console.error('Error searching brands:', error);
      throw new Error('Failed to search brands');
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchBrands:', error);
    throw error;
  }
};

// Get brands by category
export const getBrandsByCategory = async (category: string): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_brands')
      .select('*')
      .contains('category', [category])
      .order('name');

    if (error) {
      console.error('Error fetching brands by category:', error);
      throw new Error('Failed to fetch brands by category');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBrandsByCategory:', error);
    throw error;
  }
}; 