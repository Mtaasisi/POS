import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';

// Types for specification system
export interface SpecificationCategory {
  id: string;
  category_id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Specification {
  id: string;
  category_id: string;
  spec_key: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  icon: string;
  options: string[];
  unit?: string;
  placeholder?: string;
  description?: string;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductSpecification {
  id: string;
  product_id: string;
  specification_id: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  category_id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface CreateSpecificationData {
  category_id: string;
  spec_key: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  icon: string;
  options?: string[];
  unit?: string;
  placeholder?: string;
  description?: string;
  is_required?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateSpecificationData {
  name?: string;
  type?: 'text' | 'number' | 'boolean' | 'select';
  icon?: string;
  options?: string[];
  unit?: string;
  placeholder?: string;
  description?: string;
  is_required?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

class SpecificationService {
  // Category Management
  async getCategories(): Promise<SpecificationCategory[]> {
    try {
      const { data, error } = await supabase
        .from('lats_specification_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<SpecificationCategory | null> {
    try {
      const { data, error } = await supabase
        .from('lats_specification_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      return null;
    }
  }

  async getCategoryByCategoryId(categoryId: string): Promise<SpecificationCategory | null> {
    try {
      const { data, error } = await supabase
        .from('lats_specification_categories')
        .select('*')
        .eq('category_id', categoryId)
        .single();

      if (error) {
        console.error('Error fetching category by category_id:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCategoryByCategoryId:', error);
      return null;
    }
  }

  async createCategory(categoryData: CreateCategoryData): Promise<SpecificationCategory> {
    try {
      const { data, error } = await supabase
        .from('lats_specification_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        throw new Error(`Failed to create category: ${error.message}`);
      }

      toast.success('Category created successfully!');
      return data;
    } catch (error) {
      console.error('Error in createCategory:', error);
      toast.error('Failed to create category');
      throw error;
    }
  }

  async updateCategory(id: string, updateData: UpdateCategoryData): Promise<SpecificationCategory> {
    try {
      const { data, error } = await supabase
        .from('lats_specification_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        throw new Error(`Failed to update category: ${error.message}`);
      }

      toast.success('Category updated successfully!');
      return data;
    } catch (error) {
      console.error('Error in updateCategory:', error);
      toast.error('Failed to update category');
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lats_specification_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        throw new Error(`Failed to delete category: ${error.message}`);
      }

      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      toast.error('Failed to delete category');
      throw error;
    }
  }

  // Specification Management
  async getSpecificationsByCategory(categoryId: string): Promise<Specification[]> {
    try {
      const { data, error } = await supabase
        .from('lats_specifications')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching specifications:', error);
        throw new Error(`Failed to fetch specifications: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSpecificationsByCategory:', error);
      throw error;
    }
  }

  async getSpecificationById(id: string): Promise<Specification | null> {
    try {
      const { data, error } = await supabase
        .from('lats_specifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching specification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSpecificationById:', error);
      return null;
    }
  }

  async createSpecification(specData: CreateSpecificationData): Promise<Specification> {
    try {
      const { data, error } = await supabase
        .from('lats_specifications')
        .insert([specData])
        .select()
        .single();

      if (error) {
        console.error('Error creating specification:', error);
        throw new Error(`Failed to create specification: ${error.message}`);
      }

      toast.success('Specification created successfully!');
      return data;
    } catch (error) {
      console.error('Error in createSpecification:', error);
      toast.error('Failed to create specification');
      throw error;
    }
  }

  async updateSpecification(id: string, updateData: UpdateSpecificationData): Promise<Specification> {
    try {
      const { data, error } = await supabase
        .from('lats_specifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating specification:', error);
        throw new Error(`Failed to update specification: ${error.message}`);
      }

      toast.success('Specification updated successfully!');
      return data;
    } catch (error) {
      console.error('Error in updateSpecification:', error);
      toast.error('Failed to update specification');
      throw error;
    }
  }

  async deleteSpecification(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lats_specifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting specification:', error);
        throw new Error(`Failed to delete specification: ${error.message}`);
      }

      toast.success('Specification deleted successfully!');
    } catch (error) {
      console.error('Error in deleteSpecification:', error);
      toast.error('Failed to delete specification');
      throw error;
    }
  }

  // Product Specification Management
  async getProductSpecifications(productId: string): Promise<ProductSpecification[]> {
    try {
      const { data, error } = await supabase
        .from('lats_product_specifications')
        .select('*')
        .eq('product_id', productId);

      if (error) {
        console.error('Error fetching product specifications:', error);
        throw new Error(`Failed to fetch product specifications: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getProductSpecifications:', error);
      throw error;
    }
  }

  async setProductSpecification(productId: string, specificationId: string, value: string): Promise<ProductSpecification> {
    try {
      const { data, error } = await supabase
        .from('lats_product_specifications')
        .upsert([{
          product_id: productId,
          specification_id: specificationId,
          value: value
        }])
        .select()
        .single();

      if (error) {
        console.error('Error setting product specification:', error);
        throw new Error(`Failed to set product specification: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in setProductSpecification:', error);
      throw error;
    }
  }

  async deleteProductSpecification(productId: string, specificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lats_product_specifications')
        .delete()
        .eq('product_id', productId)
        .eq('specification_id', specificationId);

      if (error) {
        console.error('Error deleting product specification:', error);
        throw new Error(`Failed to delete product specification: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteProductSpecification:', error);
      throw error;
    }
  }

  // Utility functions
  async getSpecificationsByType(categoryId: string): Promise<Record<string, Specification[]>> {
    try {
      const specifications = await this.getSpecificationsByCategory(categoryId);
      const grouped: Record<string, Specification[]> = {
        text: [],
        number: [],
        select: [],
        boolean: []
      };

      specifications.forEach(spec => {
        if (grouped[spec.type]) {
          grouped[spec.type].push(spec);
        }
      });

      return grouped;
    } catch (error) {
      console.error('Error in getSpecificationsByType:', error);
      throw error;
    }
  }

  async getCategoryWithSpecifications(categoryId: string): Promise<{
    category: SpecificationCategory | null;
    specifications: Specification[];
  }> {
    try {
      const [category, specifications] = await Promise.all([
        this.getCategoryByCategoryId(categoryId),
        this.getSpecificationsByCategory(categoryId)
      ]);

      return { category, specifications };
    } catch (error) {
      console.error('Error in getCategoryWithSpecifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const specificationService = new SpecificationService();
export default specificationService;
