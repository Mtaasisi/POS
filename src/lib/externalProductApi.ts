import { supabase } from './supabaseClient';

export interface ExternalProduct {
  id: string;
  name: string;
  sku: string;
  category?: string;
  brand?: string;
  barcode?: string;
  supplier_name: string;
  supplier_phone?: string;
  purchase_date: string;
  purchase_price: number;
  purchase_quantity: number;
  selling_price: number;
  warranty_info?: string;
  product_condition: 'new' | 'used' | 'refurbished';
  notes?: string;
  status: 'available' | 'sold' | 'returned';
  created_at: string;
  updated_at: string;
}

export interface CreateExternalProductData {
  name: string;
  sku: string;
  category?: string;
  brand?: string;
  barcode?: string;
  supplier_name: string;
  supplier_phone?: string;
  purchase_date: string;
  purchase_price: number;
  purchase_quantity: number;
  selling_price: number;
  warranty_info?: string;
  product_condition: 'new' | 'used' | 'refurbished';
  notes?: string;
}

export interface UpdateExternalProductData {
  name?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  supplier_name?: string;
  supplier_phone?: string;
  purchase_date?: string;
  purchase_price?: number;
  purchase_quantity?: number;
  selling_price?: number;
  warranty_info?: string;
  product_condition?: 'new' | 'used' | 'refurbished';
  notes?: string;
  status?: 'available' | 'sold' | 'returned';
}

// Get all external products
export const getExternalProducts = async (): Promise<ExternalProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching external products:', error);
    throw error;
  }
};

// Get available external products (not sold)
export const getAvailableExternalProducts = async (): Promise<ExternalProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching available external products:', error);
    throw error;
  }
};

// Get external product by ID
export const getExternalProductById = async (id: string): Promise<ExternalProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching external product:', error);
    throw error;
  }
};

// Get external product by SKU
export const getExternalProductBySku = async (sku: string): Promise<ExternalProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching external product by SKU:', error);
    throw error;
  }
};

// Create new external product
export const createExternalProduct = async (productData: CreateExternalProductData): Promise<ExternalProduct> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating external product:', error);
    throw error;
  }
};

// Update external product
export const updateExternalProduct = async (id: string, productData: UpdateExternalProductData): Promise<ExternalProduct> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating external product:', error);
    throw error;
  }
};

// Delete external product
export const deleteExternalProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lats_external_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting external product:', error);
    throw error;
  }
};

// Mark external product as sold
export const markExternalProductAsSold = async (id: string): Promise<ExternalProduct> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .update({ status: 'sold' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking external product as sold:', error);
    throw error;
  }
};

// Mark external product as returned
export const markExternalProductAsReturned = async (id: string): Promise<ExternalProduct> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .update({ status: 'returned' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking external product as returned:', error);
    throw error;
  }
};

// Search external products
export const searchExternalProducts = async (query: string): Promise<ExternalProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,supplier_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching external products:', error);
    throw error;
  }
};

// Get external products by supplier
export const getExternalProductsBySupplier = async (supplierName: string): Promise<ExternalProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_external_products')
      .select('*')
      .eq('supplier_name', supplierName)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching external products by supplier:', error);
    throw error;
  }
};
