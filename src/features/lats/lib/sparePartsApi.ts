// Spare Parts API Service
// Handles all CRUD operations for spare parts

import { supabase } from '../../../lib/supabaseClient';
import { 
  SparePart, 
  SparePartCreateData, 
  SparePartUpdateData, 
  SparePartUsage,
  SparePartUsageCreateData,
  SparePartFilters,
  SparePartSortOptions,
  SparePartResponse,
  SparePartsResponse,
  SparePartUsageResponse,
  SparePartUsagesResponse,
  SparePartStats
} from '../types/spareParts';

// Get all spare parts with filters and pagination
export const getSpareParts = async (
  filters: SparePartFilters = {},
  sort: SparePartSortOptions = { field: 'created_at', direction: 'desc' },
  page: number = 1,
  limit: number = 20
): Promise<SparePartsResponse> => {
  try {
    let query = supabase
      .from('lats_spare_parts')
      .select(`
        *,
        category:lats_categories(name),
        supplier:lats_suppliers(name, email, phone),
        created_by_user:auth_users(email, full_name),
        updated_by_user:auth_users(email, full_name)
      `);

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }
    if (filters.brand) {
      query = query.ilike('brand', `%${filters.brand}%`);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters.low_stock) {
      query = query.lte('quantity', supabase.raw('min_quantity'));
    }
    if (filters.out_of_stock) {
      query = query.eq('quantity', 0);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,part_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      message: 'Spare parts retrieved successfully',
      ok: true,
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    return {
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch spare parts',
      ok: false,
      total: 0,
      page,
      limit
    };
  }
};

// Get a single spare part by ID
export const getSparePart = async (id: string): Promise<SparePartResponse> => {
  try {
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .select(`
        *,
        category:lats_categories(name),
        supplier:lats_suppliers(name, email, phone),
        created_by_user:auth_users(email, full_name),
        updated_by_user:auth_users(email, full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return {
      data,
      message: 'Spare part retrieved successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error fetching spare part:', error);
    return {
      data: null as any,
      message: error instanceof Error ? error.message : 'Failed to fetch spare part',
      ok: false
    };
  }
};

// Create a new spare part
export const createSparePart = async (sparePartData: SparePartCreateData): Promise<SparePartResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .insert({
        ...sparePartData,
        created_by: user?.id,
        updated_by: user?.id
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data,
      message: 'Spare part created successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error creating spare part:', error);
    return {
      data: null as any,
      message: error instanceof Error ? error.message : 'Failed to create spare part',
      ok: false
    };
  }
};

// Update an existing spare part
export const updateSparePart = async (id: string, sparePartData: SparePartUpdateData): Promise<SparePartResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .update({
        ...sparePartData,
        updated_by: user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data,
      message: 'Spare part updated successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error updating spare part:', error);
    return {
      data: null as any,
      message: error instanceof Error ? error.message : 'Failed to update spare part',
      ok: false
    };
  }
};

// Delete a spare part
export const deleteSparePart = async (id: string): Promise<{ message: string; ok: boolean }> => {
  try {
    const { error } = await supabase
      .from('lats_spare_parts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      message: 'Spare part deleted successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error deleting spare part:', error);
    return {
      message: error instanceof Error ? error.message : 'Failed to delete spare part',
      ok: false
    };
  }
};

// Get spare part usage history
export const getSparePartUsage = async (
  sparePartId: string,
  page: number = 1,
  limit: number = 20
): Promise<SparePartUsagesResponse> => {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('lats_spare_part_usage')
      .select(`
        *,
        spare_part:lats_spare_parts(name, part_number),
        used_by_user:auth_users(email, full_name)
      `)
      .eq('spare_part_id', sparePartId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      message: 'Usage history retrieved successfully',
      ok: true,
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    console.error('Error fetching spare part usage:', error);
    return {
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch usage history',
      ok: false,
      total: 0,
      page,
      limit
    };
  }
};

// Record spare part usage
export const recordSparePartUsage = async (usageData: SparePartUsageCreateData): Promise<SparePartUsageResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Start a transaction
    const { data: usage, error: usageError } = await supabase
      .from('lats_spare_part_usage')
      .insert({
        ...usageData,
        used_by: user?.id
      })
      .select()
      .single();

    if (usageError) {
      throw usageError;
    }

    // Update spare part quantity
    const { error: updateError } = await supabase
      .from('lats_spare_parts')
      .update({
        quantity: supabase.raw(`quantity - ${usageData.quantity_used}`),
        updated_by: user?.id
      })
      .eq('id', usageData.spare_part_id);

    if (updateError) {
      throw updateError;
    }

    return {
      data: usage,
      message: 'Usage recorded successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error recording spare part usage:', error);
    return {
      data: null as any,
      message: error instanceof Error ? error.message : 'Failed to record usage',
      ok: false
    };
  }
};

// Get spare parts statistics
export const getSparePartStats = async (): Promise<SparePartStats> => {
  try {
    // Get total spare parts
    const { count: totalSpareParts } = await supabase
      .from('lats_spare_parts')
      .select('*', { count: 'exact', head: true });

    // Get total value
    const { data: valueData } = await supabase
      .from('lats_spare_parts')
      .select('cost_price, quantity');

    const totalValue = valueData?.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0) || 0;

    // Get low stock count
    const { count: lowStockCount } = await supabase
      .from('lats_spare_parts')
      .select('*', { count: 'exact', head: true })
      .lte('quantity', supabase.raw('min_quantity'))
      .gt('quantity', 0);

    // Get out of stock count
    const { count: outOfStockCount } = await supabase
      .from('lats_spare_parts')
      .select('*', { count: 'exact', head: true })
      .eq('quantity', 0);

    // Get unique categories count
    const { count: categoriesCount } = await supabase
      .from('lats_spare_parts')
      .select('category_id', { count: 'exact', head: true })
      .not('category_id', 'is', null);

    // Get unique suppliers count
    const { count: suppliersCount } = await supabase
      .from('lats_spare_parts')
      .select('supplier_id', { count: 'exact', head: true })
      .not('supplier_id', 'is', null);

    return {
      total_spare_parts: totalSpareParts || 0,
      total_value: totalValue,
      low_stock_count: lowStockCount || 0,
      out_of_stock_count: outOfStockCount || 0,
      categories_count: categoriesCount || 0,
      suppliers_count: suppliersCount || 0
    };
  } catch (error) {
    console.error('Error fetching spare part stats:', error);
    return {
      total_spare_parts: 0,
      total_value: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      categories_count: 0,
      suppliers_count: 0
    };
  }
};

// Search spare parts by part number or name
export const searchSpareParts = async (searchTerm: string): Promise<SparePart[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .select(`
        *,
        category:lats_categories(name),
        supplier:lats_suppliers(name)
      `)
      .or(`part_number.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(10);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error searching spare parts:', error);
    return [];
  }
};

// Bulk update spare part quantities
export const bulkUpdateQuantities = async (updates: Array<{ id: string; quantity: number }>): Promise<{ message: string; ok: boolean }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    for (const update of updates) {
      const { error } = await supabase
        .from('lats_spare_parts')
        .update({
          quantity: update.quantity,
          updated_by: user?.id
        })
        .eq('id', update.id);

      if (error) {
        throw error;
      }
    }

    return {
      message: 'Quantities updated successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error bulk updating quantities:', error);
    return {
      message: error instanceof Error ? error.message : 'Failed to update quantities',
      ok: false
    };
  }
};
