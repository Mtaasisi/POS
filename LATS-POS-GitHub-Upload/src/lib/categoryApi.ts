import { supabase } from './supabaseClient';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
  metadata?: Record<string, any>;
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

// Get active categories only
export const getActiveCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active categories:', error);
    throw error;
  }
};

// Get active categories excluding spare parts
export const getActiveCategoriesExcludingSpare = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    
    const allCategories = data || [];
    
    // More precise spare part category identification
    const sparePartKeywords = [
      'spare', 'parts', 'repair', 'replacement', 'component'
    ];
    
    // Specific spare part patterns (these suggest parts, not full products)
    const sparePartPatterns = [
      'screen replacement', 'battery replacement', 'charging port', 'logic board',
      'motherboard', 'circuit board', 'flex cable', 'ribbon cable', 'charging cable',
      'home button', 'power button', 'volume button', 'camera module', 'speaker module',
      'microphone module', 'antenna module', 'vibration motor', 'charging dock',
      'connector port', 'headphone jack', 'sim tray', 'battery connector'
    ];
    
    const filteredCategories = allCategories.filter(category => {
      const categoryName = category.name.toLowerCase();
      const categoryDesc = (category.description || '').toLowerCase();
      
      // Check for explicit spare part keywords
      const hasSparePartKeyword = sparePartKeywords.some(keyword =>
        categoryName.includes(keyword) || categoryDesc.includes(keyword)
      );
      
      // Check for specific spare part patterns
      const hasSparePartPattern = sparePartPatterns.some(pattern =>
        categoryName.includes(pattern) || categoryDesc.includes(pattern)
      );
      
      // Check if explicitly named as spare part or component
      const isExplicitSparePart = categoryName.includes('spare') ||
                                 categoryName.includes(' part') ||
                                 categoryName.includes('parts') ||
                                 (categoryName.includes('component') && !categoryName.includes('software'));
      
      // Return categories that are NOT spare parts
      return !(hasSparePartKeyword || hasSparePartPattern || isExplicitSparePart);
    });
    
    console.log('📂 Categories: Total categories:', allCategories.length);
    console.log('📂 Categories: Filtered (excluding spare parts):', filteredCategories.length);
    console.log('📂 Categories: All category names:', allCategories.map(c => c.name));
    console.log('📂 Categories: Filtered category names:', filteredCategories.map(c => c.name));
    
    return filteredCategories;
  } catch (error) {
    console.error('Error fetching active categories excluding spare parts:', error);
    throw error;
  }
};

// Get root categories (no parent)
export const getRootCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching root categories:', error);
    throw error;
  }
};

// Get subcategories of a parent category
export const getSubcategories = async (parentId: string): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }
};

// Get category hierarchy (tree structure)
export const getCategoryHierarchy = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    
    // Build hierarchy
    const categories = data || [];
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build the tree structure
    categories.forEach(category => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(categoryMap.get(category.id)!);
        }
      } else {
        rootCategories.push(categoryMap.get(category.id)!);
      }
    });

    return rootCategories;
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);
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