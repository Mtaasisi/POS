import { supabase } from './supabaseClient';
import { mockApi, mockDataProvider } from './mockDataProvider';
import { setMockDataMode, showMockDataNotification } from './offlineSync';

// Cache for Supabase availability to prevent repeated checks
let supabaseAvailabilityCache: { available: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

// Helper function to check if Supabase is available with caching
const isSupabaseAvailable = async () => {
  const now = Date.now();
  
  // Return cached result if still valid
  if (supabaseAvailabilityCache && (now - supabaseAvailabilityCache.timestamp) < CACHE_DURATION) {
    return supabaseAvailabilityCache.available;
  }
  
  try {
    const { data, error } = await supabase.from('settings').select('key').limit(1);
    const available = !error;
    
    // Cache the result
    supabaseAvailabilityCache = {
      available,
      timestamp: now
    };
    
    if (!available) {
      console.warn('🔧 Supabase not available, using mock data');
      setMockDataMode(true);
    }
    
    return available;
  } catch (error) {
    console.warn('🔧 Supabase not available, using mock data');
    setMockDataMode(true);
    
    // Cache the failure
    supabaseAvailabilityCache = {
      available: false,
      timestamp: now
    };
    
    return false;
  }
};

// Helper function to get data with fallback to mock data
const getDataWithFallback = async <T>(
  supabaseFunction: () => Promise<{ data: T | null; error: any }>,
  mockFunction: () => Promise<T>
): Promise<T> => {
  try {
    const isAvailable = await isSupabaseAvailable();
    if (isAvailable) {
      setMockDataMode(false);
      const { data, error } = await supabaseFunction();
      if (error) throw error;
      return data as T;
    } else {
      setMockDataMode(true);
      // Only show notification once per session
      showMockDataNotification();
      return await mockFunction();
    }
  } catch (error) {
    console.warn('🔧 Using mock data due to error:', error);
    setMockDataMode(true);
    showMockDataNotification();
    return await mockFunction();
  }
};

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  payment_terms?: string;
  lead_time_days: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  category_id?: string;
  supplier_id?: string;
  product_code?: string;
  barcode?: string;
  minimum_stock_level: number;
  maximum_stock_level: number;
  reorder_point: number;
  is_active: boolean;
  tags?: string[];
  images?: string[];
  specifications?: Record<string, any>;
  warranty_period_months: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: InventoryCategory;
  supplier?: Supplier;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  variant_name: string;
  attributes: Record<string, any>;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  reserved_quantity: number;
  available_quantity: number;
  weight_kg?: number;
  dimensions_cm?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: Product;
}

export interface StockMovement {
  id: string;
  variant_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  cost_price?: number;
  performed_by?: string;
  performed_at: string;
  notes?: string;
  // Joined data
  variant?: ProductVariant;
  performed_by_user?: { name: string; email: string };
}

export interface CreateProductData {
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  category_id?: string;
  supplier_id?: string;
  product_code?: string;
  barcode?: string;
  minimum_stock_level?: number;
  maximum_stock_level?: number;
  reorder_point?: number;
  tags?: string[];
  specifications?: Record<string, any>;
  warranty_period_months?: number;
  variants: CreateVariantData[];
}

export interface CreateVariantData {
  variant_name: string;
  attributes: Record<string, any>;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  weight_kg?: number;
  dimensions_cm?: string;
}

// Categories API
export const getInventoryCategories = async (): Promise<InventoryCategory[]> => {
  return getDataWithFallback(
    () => supabase.from('inventory_categories').select('*').eq('is_active', true).order('name'),
    () => mockApi.getCategories()
  );
};

export const createInventoryCategory = async (categoryData: Omit<InventoryCategory, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryCategory> => {
  try {
    const isAvailable = await isSupabaseAvailable();
    if (isAvailable) {
      const { data, error } = await supabase
        .from('inventory_categories')
        .insert([categoryData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Mock creation for development
      const newCategory: InventoryCategory = {
        id: Date.now().toString(),
        ...categoryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('🔧 Created mock category:', newCategory);
      return newCategory;
    }
  } catch (error) {
    console.error('Error creating inventory category:', error);
    throw error;
  }
};

export const updateInventoryCategory = async (id: string, updates: Partial<InventoryCategory>): Promise<InventoryCategory> => {
  try {
    // For now, return mock data since inventory_categories table doesn't exist
    console.log('Updating inventory category not available yet');
    throw new Error('Inventory categories table not available yet');
    
    /* Uncomment when inventory_categories table is created:
    const { data, error } = await supabase
      .from('inventory_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
    */
  } catch (error) {
    console.error('Error updating inventory category:', error);
    throw error;
  }
};

export const deleteInventoryCategory = async (id: string): Promise<void> => {
  try {
    // For now, return mock data since inventory_categories table doesn't exist
    console.log('Deleting inventory category not available yet');
    throw new Error('Inventory categories table not available yet');
    
    /* Uncomment when inventory_categories table is created:
    const { error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    */
  } catch (error) {
    console.error('Error deleting inventory category:', error);
    throw error;
  }
};

// Suppliers API
export const getSuppliers = async (): Promise<Supplier[]> => {
  return getDataWithFallback(
    () => supabase.from('suppliers').select('*').eq('is_active', true).order('name'),
    () => mockApi.getSuppliers()
  );
};

export const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> => {
  try {
    const isAvailable = await isSupabaseAvailable();
    if (isAvailable) {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Mock creation for development
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        ...supplierData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('🔧 Created mock supplier:', newSupplier);
      return newSupplier;
    }
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

export const updateSupplier = async (id: string, updates: Partial<Supplier>): Promise<Supplier> => {
  try {
    // For now, return mock data since suppliers table doesn't exist
    console.log('Updating supplier not available yet');
    throw new Error('Suppliers table not available yet');
    
    /* Uncomment when suppliers table is created:
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
    */
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    // For now, return mock data since suppliers table doesn't exist
    console.log('Deleting supplier not available yet');
    throw new Error('Suppliers table not available yet');
    
    /* Uncomment when suppliers table is created:
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    */
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};

// Products API
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const createProduct = async (productData: CreateProductData): Promise<Product> => {
  try {
    const isAvailable = await isSupabaseAvailable();
    if (isAvailable) {
      // Create the main product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description,
          brand: productData.brand,
          model: productData.model,
          category_id: productData.category_id,
          supplier_id: productData.supplier_id,
          product_code: productData.product_code,
          barcode: productData.barcode,
          minimum_stock_level: productData.minimum_stock_level || 0,
          maximum_stock_level: productData.maximum_stock_level || 0,
          reorder_point: productData.reorder_point || 0,
          is_active: true,
          tags: productData.tags,
          specifications: productData.specifications,
          warranty_period_months: productData.warranty_period_months || 0,
        }])
        .select()
        .single();

      if (productError) throw productError;

      // Create variants
      const variants = await Promise.all(
        productData.variants.map(async (variantData) => {
          const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .insert([{
              product_id: product.id,
              sku: `${product.id}-${variantData.variant_name.toLowerCase().replace(/\s+/g, '-')}`,
              variant_name: variantData.variant_name,
              attributes: variantData.attributes,
              cost_price: variantData.cost_price,
              selling_price: variantData.selling_price,
              quantity_in_stock: variantData.quantity_in_stock,
              reserved_quantity: 0,
              available_quantity: variantData.quantity_in_stock,
              weight_kg: variantData.weight_kg,
              dimensions_cm: variantData.dimensions_cm,
              is_active: true,
            }])
            .select()
            .single();

          if (variantError) throw variantError;
          return variant;
        })
      );

      return { ...product, variants };
    } else {
      // Mock creation for development
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productData.name,
        description: productData.description,
        brand: productData.brand,
        model: productData.model,
        category_id: productData.category_id,
        supplier_id: productData.supplier_id,
        product_code: productData.product_code,
        barcode: productData.barcode,
        minimum_stock_level: productData.minimum_stock_level || 0,
        maximum_stock_level: productData.maximum_stock_level || 0,
        reorder_point: productData.reorder_point || 0,
        is_active: true,
        tags: productData.tags,
        specifications: productData.specifications,
        warranty_period_months: productData.warranty_period_months || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variants: productData.variants.map((variant, index) => ({
          id: `${Date.now()}-${index}`,
          product_id: Date.now().toString(),
          sku: `${Date.now()}-${variant.variant_name.toLowerCase().replace(/\s+/g, '-')}`,
          variant_name: variant.variant_name,
          attributes: variant.attributes,
          cost_price: variant.cost_price,
          selling_price: variant.selling_price,
          quantity_in_stock: variant.quantity_in_stock,
          reserved_quantity: 0,
          available_quantity: variant.quantity_in_stock,
          weight_kg: variant.weight_kg,
          dimensions_cm: variant.dimensions_cm,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      };
      console.log('🔧 Created mock product:', newProduct);
      return newProduct;
    }
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Variants API
export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('variant_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching product variants:', error);
    throw error;
  }
};

export const createProductVariant = async (variantData: Omit<ProductVariant, 'id' | 'available_quantity' | 'created_at' | 'updated_at'>): Promise<ProductVariant> => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .insert([variantData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating product variant:', error);
    throw error;
  }
};

export const updateProductVariant = async (id: string, updates: Partial<ProductVariant>): Promise<ProductVariant> => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product variant:', error);
    throw error;
  }
};

// Stock Management API
export const updateStock = async (
  variantId: string,
  movementType: 'in' | 'out' | 'adjustment',
  quantity: number,
  reason?: string,
  referenceType?: string,
  referenceId?: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.rpc('update_stock_level', {
      p_variant_id: variantId,
      p_movement_type: movementType,
      p_quantity: quantity,
      p_reference_type: referenceType,
      p_reference_id: referenceId,
      p_reason: reason,
      p_performed_by: user?.id
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

export const getStockMovements = async (variantId?: string): Promise<StockMovement[]> => {
  try {
    // For now, return empty array since stock_movements table doesn't exist
    console.log('Stock movements not available yet');
    return [];
    
    /* Uncomment when stock_movements table is created:
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        variant:product_variants(*),
        performed_by_user:auth_users(name, email)
      `)
      .order('performed_at', { ascending: false });

    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
    */
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return [];
  }
};

export const getLowStockItems = async (): Promise<any[]> => {
  try {
    // For now, return empty array since the stored procedure doesn't exist
    console.log('Low stock items not available yet');
    return [];
    
    /* Uncomment when get_low_stock_items stored procedure is created:
    const { data, error } = await supabase.rpc('get_low_stock_items');

    if (error) throw error;
    return data || [];
    */
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    return [];
  }
};

// Search API
export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    // For now, return empty array to prevent 500 errors
    // This will be implemented when the database tables are created
    console.log('Searching products for:', query);
    return [];
    
    /* Uncomment when database tables are ready:
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:inventory_categories(*),
        supplier:suppliers(*),
        variants:product_variants(*)
      `)
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%,product_code.ilike.%${query}%`)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
    */
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

export const searchProductVariants = async (query: string): Promise<ProductVariant[]> => {
  try {
    // For now, return empty array to prevent 500 errors
    // This will be implemented when the database tables are created
    console.log('Searching product variants for:', query);
    return [];
    
    /* Uncomment when database tables are ready:
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products(*)
      `)
      .or(`sku.ilike.%${query}%,variant_name.ilike.%${query}%`)
      .eq('is_active', true)
      .order('variant_name');

    if (error) throw error;
    return data || [];
    */
  } catch (error) {
    console.error('Error searching product variants:', error);
    return [];
  }
};

// Spare Parts Types
export interface SparePart {
  id: string;
  name: string;
  description: string | null;
  category: 'screen' | 'battery' | 'camera' | 'speaker' | 'microphone' | 'charging_port' | 'motherboard' | 'other';
  brand: string | null;
  model_compatibility: string[] | null;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  supplier: string | null;
  part_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SparePartUsage {
  id: string;
  spare_part_id: string;
  device_id: string | null;
  quantity_used: number;
  used_by: string;
  used_at: string;
  notes: string | null;
  spare_part?: SparePart;
  device?: {
    id: string;
    brand: string;
    model: string;
    customer_id: string;
  };
}

export interface SparePartStats {
  total_parts: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  category_breakdown: {
    category: string;
    count: number;
    value: number;
  }[];
  recent_usage: {
    part_name: string;
    quantity: number;
    used_at: string;
  }[];
}

// Spare Parts API Functions
export const getSpareParts = async (): Promise<SparePart[]> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getSparePart = async (id: string): Promise<SparePart | null> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createSparePart = async (sparePart: Omit<SparePart, 'id' | 'created_at' | 'updated_at'>): Promise<SparePart> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .insert(sparePart)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSparePart = async (id: string, updates: Partial<SparePart>): Promise<SparePart> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSparePart = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('spare_parts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getSparePartsByCategory = async (category: string): Promise<SparePart[]> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getSparePartsByBrand = async (brand: string): Promise<SparePart[]> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('brand', brand)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getCompatibleParts = async (model: string): Promise<SparePart[]> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .contains('model_compatibility', [model])
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getLowStockSpareParts = async (): Promise<SparePart[]> => {
  // First get all parts, then filter in JavaScript
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('is_active', true)
    .order('stock_quantity');

  if (error) throw error;
  
  // Filter for low stock items
  const lowStockItems = data?.filter(part => part.stock_quantity <= part.min_stock_level) || [];
  return lowStockItems;
};

export const getOutOfStockSpareParts = async (): Promise<SparePart[]> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('stock_quantity', 0)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

// Usage Tracking
export const recordSparePartUsage = async (usage: Omit<SparePartUsage, 'id' | 'used_at'>): Promise<SparePartUsage> => {
  const { data, error } = await supabase
    .from('spare_parts_usage')
    .insert(usage)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSparePartUsage = async (partId?: string): Promise<SparePartUsage[]> => {
  let query = supabase
    .from('spare_parts_usage')
    .select(`
      *,
      spare_part:spare_parts(*),
      device:devices(id, brand, model, customer_id)
    `)
    .order('used_at', { ascending: false });

  if (partId) {
    query = query.eq('spare_part_id', partId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getSparePartStats = async (): Promise<SparePartStats> => {
  const { data: parts, error: partsError } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('is_active', true);

  if (partsError) throw partsError;

  const { data: usage, error: usageError } = await supabase
    .from('spare_parts_usage')
    .select('*, spare_part:spare_parts(name)')
    .order('used_at', { ascending: false })
    .limit(10);

  if (usageError) throw usageError;

  const total_parts = parts?.length || 0;
  const total_value = parts?.reduce((sum, part) => sum + (part.stock_quantity * part.cost), 0) || 0;
  const low_stock_count = parts?.filter(part => part.stock_quantity <= part.min_stock_level).length || 0;
  const out_of_stock_count = parts?.filter(part => part.stock_quantity === 0).length || 0;

  // Category breakdown
  const categoryBreakdown = parts?.reduce((acc, part) => {
    const existing = acc.find(cat => cat.category === part.category);
    if (existing) {
      existing.count++;
      existing.value += part.stock_quantity * part.cost;
    } else {
      acc.push({
        category: part.category,
        count: 1,
        value: part.stock_quantity * part.cost
      });
    }
    return acc;
  }, [] as { category: string; count: number; value: number }[]) || [];

  const recent_usage = usage?.map(u => ({
    part_name: u.spare_part?.name || 'Unknown',
    quantity: u.quantity_used,
    used_at: u.used_at
  })) || [];

  return {
    total_parts,
    total_value,
    low_stock_count,
    out_of_stock_count,
    category_breakdown: categoryBreakdown,
    recent_usage
  };
};

// Stock Management
export const updateSparePartStock = async (id: string, quantity: number, operation: 'add' | 'subtract'): Promise<SparePart> => {
  const { data: currentPart, error: fetchError } = await supabase
    .from('spare_parts')
    .select('stock_quantity')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const newQuantity = operation === 'add' 
    ? currentPart.stock_quantity + quantity
    : Math.max(0, currentPart.stock_quantity - quantity);

  const { data, error } = await supabase
    .from('spare_parts')
    .update({ stock_quantity: newQuantity })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Search and Filter
export const searchSpareParts = async (query: string): Promise<SparePart[]> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%,part_number.ilike.%${query}%`)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getSparePartCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('category')
    .eq('is_active', true);

  if (error) throw error;
  
  const categories = Array.from(new Set(data?.map(part => part.category) || []));
  return categories.sort();
};

export const getSparePartBrands = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('brand')
    .not('brand', 'is', null)
    .eq('is_active', true);

  if (error) throw error;
  
  const brands = Array.from(new Set(data?.map(part => part.brand).filter(Boolean) || []));
  return brands.sort();
};