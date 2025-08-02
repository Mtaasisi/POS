import { supabase } from './supabaseClient';

export type BrandCategory = 'phone' | 'laptop' | 'tablet' | 'desktop' | 'printer' | 'smartwatch' | 'headphones' | 'speaker' | 'camera' | 'gaming' | 'accessories' | 'monitor' | 'keyboard' | 'mouse' | 'webcam' | 'microphone' | 'router' | 'modem' | 'scanner' | 'projector' | 'server' | 'network' | 'storage' | 'other';

export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  category?: BrandCategory[]; // Now JSONB array
  categories?: BrandCategory[]; // For backward compatibility
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandData {
  name: string;
  logo_url?: string;
  description?: string;
  category?: BrandCategory;
  categories?: BrandCategory[]; // For after migration
}

export interface UpdateBrandData {
  name?: string;
  logo_url?: string;
  description?: string;
  category?: BrandCategory;
  categories?: BrandCategory[]; // For after migration
  is_active?: boolean;
}

// Popularity ranking for brands
const BRAND_POPULARITY: Record<string, number> = {
  'Apple': 100,
  'Samsung': 95,
  'Google': 90,
  'Microsoft': 85,
  'Lenovo': 80,
  'HP': 75,
  'Dell': 70,
  'Huawei': 65,
  'Xiaomi': 60,
  'OnePlus': 55,
  'Sony': 50,
  'LG': 45,
  'Motorola': 40,
  'Nokia': 35,
  'Tecno': 30,
  'Infinix': 25,
  'Itel': 20,
  'HTC': 15,
  'Asus': 10,
  'Acer': 5,
  'Canon': 3,
  'Epson': 2,
  'Brother': 1,
};

// Sort brands by popularity (most popular first)
export const sortBrandsByPopularity = (brands: Brand[]): Brand[] => {
  return brands.sort((a, b) => {
    const popularityA = BRAND_POPULARITY[a.name] || 0;
    const popularityB = BRAND_POPULARITY[b.name] || 0;
    return popularityB - popularityA; // Descending order (most popular first)
  });
};

// Get all brands
export const getBrands = async (): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, logo_url, description, category, is_active, created_by, created_at, updated_at')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
};

// Get active brands only
export const getActiveBrands = async (): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, logo_url, description, category, is_active, created_by, created_at, updated_at')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    // Sort by popularity (most popular first)
    const popularBrands = data || [];
    return sortBrandsByPopularity(popularBrands);
  } catch (error) {
    console.error('Error fetching active brands:', error);
    throw error;
  }
};

// Get brands by category
export const getBrandsByCategory = async (category: string): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, logo_url, description, category, is_active, created_by, created_at, updated_at')
      .contains('category', [category])
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching brands by category:', error);
    throw error;
  }
};

// Create a new brand
export const createBrand = async (brandData: CreateBrandData): Promise<Brand> => {
  try {
    // Convert categories array to JSONB array
    const categoryArray = brandData.categories && brandData.categories.length > 0 
      ? brandData.categories 
      : brandData.category 
        ? [brandData.category] 
        : ['other'];
    
    const insertData = {
      name: brandData.name,
      logo_url: brandData.logo_url,
      description: brandData.description,
      category: categoryArray // This will be stored as JSONB array
    };
    
    const { data, error } = await supabase
      .from('brands')
      .insert([insertData])
      .select('id, name, logo_url, description, category, is_active, created_by, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating brand:', error);
    throw error;
  }
};

// Update a brand
export const updateBrand = async (id: string, brandData: UpdateBrandData): Promise<Brand> => {
  try {
    // Convert categories array to JSONB array
    const categoryArray = brandData.categories && brandData.categories.length > 0 
      ? brandData.categories 
      : brandData.category 
        ? [brandData.category] 
        : ['other'];
    
    const updateData = {
      name: brandData.name,
      logo_url: brandData.logo_url,
      description: brandData.description,
      category: categoryArray // This will be stored as JSONB array
    };
    
    const { data, error } = await supabase
      .from('brands')
      .update(updateData)
      .eq('id', id)
      .select('id, name, logo_url, description, category, is_active, created_by, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating brand:', error);
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

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting brand:', error);
    throw error;
  }
};

// Hard delete a brand (use with caution)
export const hardDeleteBrand = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error hard deleting brand:', error);
    throw error;
  }
};

// Restore a deleted brand (set is_active to true)
export const restoreBrand = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('brands')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error restoring brand:', error);
    throw error;
  }
};

// Search brands by name
export const searchBrands = async (query: string): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, logo_url, description, category, is_active, created_by, created_at, updated_at')
      .ilike('name', `%${query}%`)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    // Sort search results by popularity
    const searchResults = data || [];
    return sortBrandsByPopularity(searchResults);
  } catch (error) {
    console.error('Error searching brands:', error);
    throw error;
  }
};

// Get brand by ID
export const getBrandById = async (id: string): Promise<Brand | null> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, logo_url, description, category, is_active, created_by, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching brand by ID:', error);
    throw error;
  }
};

// Get brand by name
export const getBrandByName = async (name: string): Promise<Brand> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, logo_url, description, category, is_active, created_by, created_at, updated_at')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching brand by name:', error);
    throw error;
  }
}; 