import { supabase } from '../../../lib/supabaseClient';

export interface RepairPart {
  id: string;
  device_id: string;
  spare_part_id: string;
  quantity_needed: number;
  quantity_used: number;
  cost_per_unit: number;
  total_cost: number;
  status: 'needed' | 'ordered' | 'received' | 'used';
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  spare_part?: {
    id: string;
    name: string;
    part_number: string;
    quantity: number;
    selling_price: number;
    cost_price: number;
    category_id: string;
    brand?: string;
    description?: string;
    condition?: 'new' | 'used' | 'refurbished';
    location?: string;
    min_quantity: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category?: {
      name: string;
    };
    supplier?: {
      name: string;
      email?: string;
      phone?: string;
    };
    variants?: Array<{
      id: string;
      name: string;
      sku?: string;
      quantity: number;
      selling_price: number;
      cost_price: number;
      variant_attributes?: Record<string, any>;
      image_url?: string;
    }>;
  };
}

export interface CreateRepairPartData {
  device_id: string;
  spare_part_id: string;
  quantity_needed: number;
  cost_per_unit: number;
  notes?: string;
}

export interface UpdateRepairPartData {
  quantity_needed?: number;
  quantity_used?: number;
  cost_per_unit?: number;
  status?: 'needed' | 'ordered' | 'received' | 'used';
  notes?: string;
}

export interface RepairPartsResponse {
  data: RepairPart[] | null;
  message: string;
  ok: boolean;
  total?: number;
  page?: number;
  limit?: number;
}

export interface RepairPartResponse {
  data: RepairPart | null;
  message: string;
  ok: boolean;
}

// Get repair parts for a specific device
export const getRepairParts = async (deviceId: string): Promise<RepairPartsResponse> => {
  try {
    console.log('🔍 [DEBUG] Fetching repair parts for device:', deviceId);
    
    const { data, error } = await supabase
      .from('repair_parts')
      .select(`
        *,
        lats_spare_parts(
          id,
          name,
          part_number,
          quantity,
          selling_price,
          cost_price,
          category_id,
          brand,
          description,
          condition,
          location,
          min_quantity,
          is_active,
          created_at,
          updated_at,
          category:lats_categories(name),
          supplier:lats_suppliers(name, email, phone),
          variants:lats_spare_part_variants(
            id,
            name,
            sku,
            quantity,
            selling_price,
            cost_price,
            variant_attributes,
            image_url
          )
        )
      `)
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });

    console.log('🔍 [DEBUG] Supabase query result:', { data, error });

    if (error) {
      // Check if the error is due to missing table
      if (error.message.includes('relation "public.repair_parts" does not exist')) {
        console.warn('repair_parts table does not exist. Please run the migration to create it.');
        return {
          data: [],
          message: 'Repair parts table not found. Please contact administrator to set up the database.',
          ok: true,
          total: 0
        };
      }
      throw error;
    }

    const result = {
      data: data || [],
      message: 'Repair parts retrieved successfully',
      ok: true,
      total: data?.length || 0
    };
    
    console.log('🔍 [DEBUG] Final API response:', result);
    
    // If spare_part data is missing, try to fetch it separately
    if (data && data.length > 0) {
      const needsSparePartData = data.some(part => !part.spare_part);
      if (needsSparePartData) {
        console.log('🔍 [DEBUG] Some parts missing spare_part data, fetching separately...');
        
        for (const part of data) {
          if (!part.spare_part && part.spare_part_id) {
            try {
              const { data: sparePartData, error: sparePartError } = await supabase
                .from('lats_spare_parts')
                .select(`
                  id,
                  name,
                  part_number,
                  quantity,
                  selling_price,
                  cost_price,
                  category_id,
                  brand,
                  description,
                  condition,
                  location,
                  min_quantity,
                  is_active,
                  created_at,
                  updated_at,
                  category:lats_categories(name),
                  supplier:lats_suppliers(name, email, phone)
                `)
                .eq('id', part.spare_part_id)
                .single();
              
              if (!sparePartError && sparePartData) {
                part.spare_part = sparePartData;
                console.log('🔍 [DEBUG] Fetched spare part data for:', sparePartData.name);
              } else {
                console.warn('🔍 [DEBUG] Failed to fetch spare part data for ID:', part.spare_part_id, sparePartError);
              }
            } catch (fetchError) {
              console.error('🔍 [DEBUG] Error fetching individual spare part:', fetchError);
            }
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching repair parts:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to fetch repair parts',
      ok: false,
      total: 0
    };
  }
};

// Create multiple repair parts
export const createRepairParts = async (dataArray: CreateRepairPartData[]): Promise<RepairPartsResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const repairPartsData = dataArray.map(data => ({
      ...data,
      created_by: user?.id,
      updated_by: user?.id
    }));

    const { data: repairParts, error } = await supabase
      .from('repair_parts')
      .insert(repairPartsData)
      .select(`
        *,
        lats_spare_parts(
          id,
          name,
          part_number,
          quantity,
          selling_price,
          cost_price,
          category_id,
          brand,
          description,
          condition,
          location,
          min_quantity,
          is_active,
          created_at,
          updated_at,
          category:lats_categories(name),
          supplier:lats_suppliers(name, email, phone),
          variants:lats_spare_part_variants(
            id,
            name,
            sku,
            quantity,
            selling_price,
            cost_price,
            variant_attributes,
            image_url
          )
        )
      `);

    if (error) {
      throw error;
    }

    return {
      data: repairParts || [],
      message: `${repairParts?.length || 0} repair parts created successfully`,
      ok: true,
      total: repairParts?.length || 0
    };
  } catch (error) {
    console.error('Error creating repair parts:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to create repair parts',
      ok: false,
      total: 0
    };
  }
};

// Create a new repair part
export const createRepairPart = async (data: CreateRepairPartData): Promise<RepairPartResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: repairPart, error } = await supabase
      .from('repair_parts')
      .insert({
        ...data,
        created_by: user?.id,
        updated_by: user?.id
      })
      .select(`
        *,
        lats_spare_parts(
          id,
          name,
          part_number,
          quantity,
          selling_price,
          cost_price,
          category_id,
          brand,
          description,
          condition,
          location,
          min_quantity,
          is_active,
          created_at,
          updated_at,
          category:lats_categories(name),
          supplier:lats_suppliers(name, email, phone),
          variants:lats_spare_part_variants(
            id,
            name,
            sku,
            quantity,
            selling_price,
            cost_price,
            variant_attributes,
            image_url
          )
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return {
      data: repairPart,
      message: 'Repair part created successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error creating repair part:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to create repair part',
      ok: false
    };
  }
};

// Update a repair part
export const updateRepairPart = async (
  id: string, 
  data: UpdateRepairPartData
): Promise<RepairPartResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: repairPart, error } = await supabase
      .from('repair_parts')
      .update({
        ...data,
        updated_by: user?.id
      })
      .eq('id', id)
      .select(`
        *,
        lats_spare_parts(
          id,
          name,
          part_number,
          quantity,
          selling_price,
          cost_price,
          category_id,
          brand,
          description,
          condition,
          location,
          min_quantity,
          is_active,
          created_at,
          updated_at,
          category:lats_categories(name),
          supplier:lats_suppliers(name, email, phone),
          variants:lats_spare_part_variants(
            id,
            name,
            sku,
            quantity,
            selling_price,
            cost_price,
            variant_attributes,
            image_url
          )
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return {
      data: repairPart,
      message: 'Repair part updated successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error updating repair part:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to update repair part',
      ok: false
    };
  }
};

// Delete a repair part
export const deleteRepairPart = async (id: string): Promise<RepairPartResponse> => {
  try {
    const { error } = await supabase
      .from('repair_parts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      data: null,
      message: 'Repair part deleted successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error deleting repair part:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to delete repair part',
      ok: false
    };
  }
};

// Use a spare part (record usage and update inventory)
export const useRepairPart = async (repairPartId: string): Promise<RepairPartResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the repair part details
    const { data: repairPart, error: fetchError } = await supabase
      .from('repair_parts')
      .select(`
        *,
        lats_spare_parts(
          id,
          name,
          part_number,
          quantity,
          selling_price,
          cost_price,
          category_id,
          brand,
          description,
          condition,
          location,
          min_quantity,
          is_active,
          created_at,
          updated_at,
          category:lats_categories(name),
          supplier:lats_suppliers(name, email, phone),
          variants:lats_spare_part_variants(
            id,
            name,
            sku,
            quantity,
            selling_price,
            cost_price,
            variant_attributes,
            image_url
          )
        )
      `)
      .eq('id', repairPartId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!repairPart) {
      throw new Error('Repair part not found');
    }

    // Check if there's enough stock
    if (repairPart.spare_part.quantity < repairPart.quantity_needed) {
      throw new Error('Insufficient stock');
    }

    // Start a transaction-like operation
    // 1. Update the repair part status to 'used'
    const { data: updatedRepairPart, error: updateError } = await supabase
      .from('repair_parts')
      .update({
        status: 'used',
        quantity_used: repairPart.quantity_needed,
        updated_by: user?.id
      })
      .eq('id', repairPartId)
      .select(`
        *,
        lats_spare_parts(
          id,
          name,
          part_number,
          quantity,
          selling_price,
          cost_price,
          category_id,
          brand,
          description,
          condition,
          location,
          min_quantity,
          is_active,
          created_at,
          updated_at,
          category:lats_categories(name),
          supplier:lats_suppliers(name, email, phone),
          variants:lats_spare_part_variants(
            id,
            name,
            sku,
            quantity,
            selling_price,
            cost_price,
            variant_attributes,
            image_url
          )
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // 2. Record the usage in spare_part_usage table
    const { error: usageError } = await supabase
      .from('lats_spare_part_usage')
      .insert({
        spare_part_id: repairPart.spare_part_id,
        quantity: repairPart.quantity_needed,
        device_id: repairPart.device_id,
        reason: `Repair usage - Device: ${repairPart.device_id}`,
        notes: repairPart.notes || `Repair part usage for device repair`,
        used_by: user?.id
      });

    if (usageError) {
      throw usageError;
    }

    // 3. Update the spare part quantity
    const { error: stockError } = await supabase
      .from('lats_spare_parts')
      .update({
        quantity: repairPart.spare_part.quantity - repairPart.quantity_needed,
        updated_at: new Date().toISOString()
      })
      .eq('id', repairPart.spare_part_id);

    if (stockError) {
      throw stockError;
    }

    return {
      data: updatedRepairPart,
      message: 'Spare part used successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error using repair part:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to use repair part',
      ok: false
    };
  }
};

// Get spare part images for a repair part
export const getRepairPartImages = async (sparePartId: string): Promise<{ data: any[]; message: string; ok: boolean }> => {
  try {
    // First try spare_part_images table
    const { data: sparePartImages, error: sparePartError } = await supabase
      .from('spare_part_images')
      .select('*')
      .eq('spare_part_id', sparePartId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (!sparePartError && sparePartImages && sparePartImages.length > 0) {
      return {
        data: sparePartImages,
        message: 'Spare part images retrieved successfully',
        ok: true
      };
    }

    // If no images in spare_part_images, try product_images table
    const { data: productImages, error: productError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', sparePartId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (!productError && productImages && productImages.length > 0) {
      return {
        data: productImages,
        message: 'Spare part images retrieved successfully',
        ok: true
      };
    }

    // If no images in either table, check the main spare part record's images field
    const { data: sparePartRecord, error: recordError } = await supabase
      .from('lats_spare_parts')
      .select('images')
      .eq('id', sparePartId)
      .single();

    if (recordError) {
      return {
        data: [],
        message: 'No images found',
        ok: true
      };
    }

    if (sparePartRecord?.images && Array.isArray(sparePartRecord.images) && sparePartRecord.images.length > 0) {
      // Convert URL strings to image objects
      const convertedImages = sparePartRecord.images.map((url: string, index: number) => ({
        id: `main-record-${index}`,
        spare_part_id: sparePartId,
        image_url: url,
        thumbnail_url: url,
        file_name: `image-${index + 1}.jpg`,
        file_size: 0,
        mime_type: 'image/jpeg',
        is_primary: index === 0,
        uploaded_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      return {
        data: convertedImages,
        message: 'Spare part images retrieved successfully',
        ok: true
      };
    }

    return {
      data: [],
      message: 'No images found',
      ok: true
    };
  } catch (error) {
    console.error('Error fetching spare part images:', error);
    return {
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch images',
      ok: false
    };
  }
};

// Get requested spare parts names (parts with status 'needed' or 'ordered')
export const getRequestedSparePartsNames = async (deviceId?: string): Promise<{
  data: Array<{
    id: string;
    name: string;
    part_number: string;
    quantity_needed: number;
    status: string;
    device_id?: string;
    device_info?: {
      brand: string;
      model: string;
      serialNumber: string;
    };
  }>;
  message: string;
  ok: boolean;
}> => {
  try {
    let query = supabase
      .from('repair_parts')
      .select(`
        id,
        device_id,
        quantity_needed,
        status,
        lats_spare_parts(
          id,
          name,
          part_number
        ),
        devices(
          brand,
          model,
          serial_number
        )
      `)
      .in('status', ['needed', 'ordered']);

    // Filter by device if provided
    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const requestedParts = (data || []).map(part => ({
      id: part.id,
      name: part.lats_spare_parts?.name || 'Unknown Part',
      part_number: part.lats_spare_parts?.part_number || 'N/A',
      quantity_needed: part.quantity_needed,
      status: part.status,
      device_id: part.device_id,
      device_info: part.devices ? {
        brand: part.devices.brand,
        model: part.devices.model,
        serialNumber: part.devices.serial_number
      } : undefined
    }));

    return {
      data: requestedParts,
      message: `Found ${requestedParts.length} requested spare parts`,
      ok: true
    };
  } catch (error) {
    console.error('Error fetching requested spare parts names:', error);
    return {
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch requested spare parts',
      ok: false
    };
  }
};

// Get spare parts by specific status
export const getSparePartsByStatus = async (
  status: 'needed' | 'ordered' | 'received' | 'used',
  deviceId?: string
): Promise<{
  data: Array<{
    id: string;
    name: string;
    part_number: string;
    quantity_needed: number;
    quantity_used: number;
    status: string;
    total_cost: number;
    device_id?: string;
    device_info?: {
      brand: string;
      model: string;
      serialNumber: string;
    };
    spare_part_info?: {
      brand?: string;
      category?: string;
      location?: string;
      stock_quantity: number;
    };
  }>;
  message: string;
  ok: boolean;
}> => {
  try {
    let query = supabase
      .from('repair_parts')
      .select(`
        id,
        device_id,
        quantity_needed,
        quantity_used,
        total_cost,
        status,
        lats_spare_parts(
          id,
          name,
          part_number,
          brand,
          location,
          quantity,
          category:lats_categories(name)
        ),
        devices(
          brand,
          model,
          serial_number
        )
      `)
      .eq('status', status);

    // Filter by device if provided
    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const partsByStatus = (data || []).map(part => ({
      id: part.id,
      name: part.lats_spare_parts?.name || 'Unknown Part',
      part_number: part.lats_spare_parts?.part_number || 'N/A',
      quantity_needed: part.quantity_needed,
      quantity_used: part.quantity_used,
      status: part.status,
      total_cost: part.total_cost,
      device_id: part.device_id,
      device_info: part.devices ? {
        brand: part.devices.brand,
        model: part.devices.model,
        serialNumber: part.devices.serial_number
      } : undefined,
      spare_part_info: part.lats_spare_parts ? {
        brand: part.lats_spare_parts.brand,
        category: part.lats_spare_parts.category?.name,
        location: part.lats_spare_parts.location,
        stock_quantity: part.lats_spare_parts.quantity
      } : undefined
    }));

    return {
      data: partsByStatus,
      message: `Found ${partsByStatus.length} spare parts with status '${status}'`,
      ok: true
    };
  } catch (error) {
    console.error(`Error fetching spare parts by status '${status}':`, error);
    return {
      data: [],
      message: error instanceof Error ? error.message : `Failed to fetch spare parts with status '${status}'`,
      ok: false
    };
  }
};

// Get repair parts statistics for a device
export const getRepairPartsStats = async (deviceId: string) => {
  try {
    const { data, error } = await supabase
      .from('repair_parts')
      .select('status, quantity_needed, cost_per_unit, total_cost')
      .eq('device_id', deviceId);

    if (error) {
      throw error;
    }

    const stats = {
      totalParts: data.length,
      totalCost: data.reduce((sum, part) => sum + part.total_cost, 0),
      partsNeeded: data.filter(part => part.status === 'needed').length,
      partsOrdered: data.filter(part => part.status === 'ordered').length,
      partsReceived: data.filter(part => part.status === 'received').length,
      partsUsed: data.filter(part => part.status === 'used').length,
      progressPercentage: data.length > 0 
        ? Math.round((data.filter(part => part.status === 'used').length / data.length) * 100)
        : 0
    };

    return {
      data: stats,
      message: 'Repair parts statistics retrieved successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error fetching repair parts statistics:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to fetch repair parts statistics',
      ok: false
    };
  }
};
