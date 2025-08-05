import { supabase } from './supabaseClient';

export interface BrandCategory {
  value: string;
  label: string;
  icon: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  category?: string[]; // Simplified to just string array
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
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching brands:', error);
      throw new Error('Failed to fetch brands');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActiveBrands:', error);
    throw error;
  }
};

// Get all brands (including inactive)
export const getAllBrands = async (): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching all brands:', error);
      throw new Error('Failed to fetch brands');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllBrands:', error);
    throw error;
  }
};

// Create a new brand
export const createBrand = async (brandData: CreateBrandData): Promise<Brand> => {
  try {
    // Convert category array to JSONB for Supabase
    const dataToInsert = {
      ...brandData,
      category: brandData.category || [],
      categories: brandData.category || [] // For backward compatibility
    };

    const { data, error } = await supabase
      .from('brands')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating brand:', error);
      throw new Error('Failed to create brand');
    }

    return data;
  } catch (error) {
    console.error('Error in createBrand:', error);
    throw error;
  }
};

// Update an existing brand
export const updateBrand = async (id: string, brandData: UpdateBrandData): Promise<Brand> => {
  try {
    // Clean up the data to avoid type conflicts
    const dataToUpdate: any = { ...brandData };
    
    // Handle category field properly
    if (brandData.category) {
      dataToUpdate.category = brandData.category;
      // Remove categories field to avoid conflicts
      delete dataToUpdate.categories;
    }
    
    // Remove any undefined values
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    const { data, error } = await supabase
      .from('brands')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating brand:', error);
      throw new Error('Failed to update brand');
    }

    return data;
  } catch (error) {
    console.error('Error in updateBrand:', error);
    throw error;
  }
};

// Delete a brand (soft delete by setting is_active to false)
export const deleteBrand = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('brands')
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
      .from('brands')
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
      .from('brands')
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
      .from('brands')
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
      .from('brands')
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