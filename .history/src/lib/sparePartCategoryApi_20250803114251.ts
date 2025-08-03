import { supabase } from './supabaseClient';

export interface SparePartCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSparePartCategoryData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export interface UpdateSparePartCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

// Get all spare part categories
export const getSparePartCategories = async (): Promise<SparePartCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('spare_part_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching spare part categories:', error);
    throw error;
  }
};

// Get active spare part categories only
export const getActiveSparePartCategories = async (): Promise<SparePartCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('spare_part_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active spare part categories:', error);
    throw error;
  }
};

// Create a new spare part category
export const createSparePartCategory = async (categoryData: CreateSparePartCategoryData): Promise<SparePartCategory> => {
  try {
    const { data, error } = await supabase
      .from('spare_part_categories')
      .insert([{
        ...categoryData,
        is_active: categoryData.is_active ?? true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating spare part category:', error);
    throw error;
  }
};

// Update a spare part category
export const updateSparePartCategory = async (id: string, categoryData: UpdateSparePartCategoryData): Promise<SparePartCategory> => {
  try {
    const { data, error } = await supabase
      .from('spare_part_categories')
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
    console.error('Error updating spare part category:', error);
    throw error;
  }
};

// Delete a spare part category (soft delete by setting is_active to false)
export const deleteSparePartCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('spare_part_categories')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting spare part category:', error);
    throw error;
  }
};

// Restore a deleted spare part category
export const restoreSparePartCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('spare_part_categories')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error restoring spare part category:', error);
    throw error;
  }
};

// Get spare part category by ID
export const getSparePartCategoryById = async (id: string): Promise<SparePartCategory | null> => {
  try {
    const { data, error } = await supabase
      .from('spare_part_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching spare part category by ID:', error);
    throw error;
  }
};

// Get spare part category by name
export const getSparePartCategoryByName = async (name: string): Promise<SparePartCategory | null> => {
  try {
    const { data, error } = await supabase
      .from('spare_part_categories')
      .select('*')
      .eq('name', name)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching spare part category by name:', error);
    throw error;
  }
};

// Search spare part categories
export const searchSparePartCategories = async (query: string): Promise<SparePartCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('spare_part_categories')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching spare part categories:', error);
    throw error;
  }
};

// Get spare part categories with usage count
export const getSparePartCategoriesWithUsageCount = async (): Promise<(SparePartCategory & { usage_count: number })[]> => {
  try {
    const { data, error } = await supabase
      .from('spare_part_categories')
      .select(`
        *,
        spare_parts:spare_parts(count)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    return (data || []).map(category => ({
      ...category,
      usage_count: category.spare_parts?.[0]?.count || 0
    }));
  } catch (error) {
    console.error('Error fetching spare part categories with usage count:', error);
    throw error;
  }
}; 