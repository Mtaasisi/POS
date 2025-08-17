import { supabase } from './supabaseClient';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
}

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get active categories only (since there's no is_active column, return all categories)
export const getActiveCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active categories:', error);
    throw error;
  }
};

// Create a new category
export const createCategory = async (categoryData: CreateCategoryData): Promise<Category> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update a category
export const updateCategory = async (id: string, categoryData: UpdateCategoryData): Promise<Category> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .update({
        ...categoryData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete a category (hard delete since there's no is_active column)
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lats_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Restore a deleted category (not applicable since we're doing hard delete)
export const restoreCategory = async (id: string): Promise<void> => {
  throw new Error('Restore functionality not available - categories are permanently deleted');
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    throw error;
  }
};

// Get category by name
export const getCategoryByName = async (name: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .eq('name', name)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching category by name:', error);
    throw error;
  }
};

// Search categories
export const searchCategories = async (query: string): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching categories:', error);
    throw error;
  }
};

// Get categories with device count
export const getCategoriesWithDeviceCount = async (): Promise<(Category & { device_count: number })[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select(`
        *,
        devices:lats_products(count)
      `)
      .order('name');

    if (error) throw error;
    
    return (data || []).map(category => ({
      ...category,
      device_count: category.devices?.[0]?.count || 0
    }));
  } catch (error) {
    console.error('Error fetching categories with device count:', error);
    throw error;
  }
}; 