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
  SparePartStats,
  SparePartVariant
} from '../types/spareParts';

// Utility function to convert camelCase form data to snake_case database fields
const convertFormDataToDatabaseFormat = (formData: any): SparePartCreateData => {
  console.log('🔍 [DEBUG] ===== CONVERT FORM DATA START =====');
  console.log('🔍 [DEBUG] Input formData:', formData);
  console.log('🔍 [DEBUG] Input formData type:', typeof formData);
  console.log('🔍 [DEBUG] Input formData keys:', Object.keys(formData || {}));
  
  const convertedData: any = {
    name: formData.name,
    part_number: formData.partNumber,
    category_id: formData.categoryId,
    brand: formData.brand,
    supplier_id: formData.supplierId,
    condition: formData.condition || 'new', // Ensure condition is always valid
    description: formData.description,
    cost_price: formData.costPrice,
    selling_price: formData.sellingPrice,
    quantity: formData.quantity,
    min_quantity: formData.minQuantity,
    location: formData.location,
    compatible_devices: formData.compatibleDevices
  };

  // Handle optional fields that might be present
  if (formData.storageRoomId) {
    convertedData.storage_room_id = formData.storageRoomId;
  }
  
  if (formData.shelfId) {
    convertedData.store_shelf_id = formData.shelfId;
  }

  if (formData.images) {
    // Extract just the image URLs for the images array (for backward compatibility)
    const imageUrls = formData.images.map((img: any) => img.image_url || img.url).filter(Boolean);
    convertedData.images = imageUrls;
  }

  if (formData.partType) {
    convertedData.part_type = formData.partType;
  }
  
  if (formData.primaryDeviceType) {
    convertedData.primary_device_type = formData.primaryDeviceType;
  }
  
  if (formData.searchTags) {
    convertedData.search_tags = formData.searchTags;
  }
  
  console.log('🔍 [DEBUG] Converted data:', convertedData);
  console.log('🔍 [DEBUG] Converted data keys:', Object.keys(convertedData));
  console.log('🔍 [DEBUG] ===== CONVERT FORM DATA END =====');
  
  return convertedData;
};

// Save spare part images to product_images table with thumbnail support
const saveSparePartImagesToDatabase = async (sparePartId: string, images: any[], userId?: string): Promise<void> => {
  try {
    console.log('🔍 [DEBUG] Saving spare part images to database:', {
      sparePartId,
      imageCount: images.length,
      userId
    });

    // Prepare image data for database insertion
    const imageData = images.map((img, index) => ({
      spare_part_id: sparePartId, // Using spare_part_id column for spare parts
      image_url: img.image_url || img.url,
      thumbnail_url: img.thumbnail_url || img.thumbnailUrl || img.image_url || img.url, // Use thumbnail if available, fallback to main image
      file_name: img.file_name || img.fileName || `spare-part-image-${index + 1}`,
      file_size: img.file_size || img.fileSize || 0,
      mime_type: img.mime_type || img.mimeType || 'image/jpeg',
      is_primary: img.is_primary || img.isPrimary || index === 0, // First image is primary
      uploaded_by: userId
    }));

    console.log('🔍 [DEBUG] Prepared image data:', imageData);

    // Try inserting into spare_part_images table first
    const { data, error } = await supabase
      .from('spare_part_images')
      .insert(imageData)
      .select();

    if (error) {
      console.error('❌ [DEBUG] Error saving images to spare_part_images:', error);
      
      // If RLS error, try using product_images table instead
      if (error.code === '42501') {
        console.log('🔄 [DEBUG] RLS error detected, trying product_images table...');
        
        // Convert to product_images format
        const productImageData = images.map((img, index) => ({
          product_id: sparePartId, // Use product_id for product_images table
          image_url: img.image_url || img.url,
          thumbnail_url: img.thumbnail_url || img.thumbnailUrl || img.image_url || img.url,
          file_name: img.file_name || img.fileName || `spare-part-image-${index + 1}`,
          file_size: img.file_size || img.fileSize || 0,
          mime_type: img.mime_type || img.mimeType || 'image/jpeg',
          is_primary: img.is_primary || img.isPrimary || index === 0,
          uploaded_by: userId
        }));
        
        const { data: productData, error: productError } = await supabase
          .from('product_images')
          .insert(productImageData)
          .select();
          
        if (productError) {
          console.error('❌ [DEBUG] Error saving images to product_images:', productError);
          throw productError;
        }
        
        console.log('✅ [DEBUG] Images saved to product_images successfully:', productData);
        return;
      }
      
      throw error;
    }

    console.log('✅ [DEBUG] Images saved to spare_part_images successfully:', data);
  } catch (error) {
    console.error('❌ [DEBUG] Failed to save images to database:', error);
    throw error; // Re-throw to let the caller handle it
  }
};

// Get spare part images from spare_part_images table
export const getSparePartImages = async (sparePartId: string): Promise<any[]> => {
  try {
    console.log('🔍 [DEBUG] Getting spare part images from database:', sparePartId);

    // First try spare_part_images table
    const { data: sparePartImages, error: sparePartError } = await supabase
      .from('spare_part_images')
      .select('*')
      .eq('spare_part_id', sparePartId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (!sparePartError && sparePartImages && sparePartImages.length > 0) {
      console.log('✅ [DEBUG] Retrieved spare part images from spare_part_images:', sparePartImages);
      return sparePartImages;
    }

    // If no images in spare_part_images, try product_images table
    console.log('🔍 [DEBUG] No images in spare_part_images, trying product_images...');
    const { data: productImages, error: productError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', sparePartId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (!productError && productImages && productImages.length > 0) {
      console.log('✅ [DEBUG] Retrieved spare part images from product_images:', productImages);
      return productImages;
    }

    // If no images in either table, check the main spare part record's images field
    console.log('🔍 [DEBUG] No images in image tables, checking main spare part record...');
    const { data: sparePartRecord, error: recordError } = await supabase
      .from('lats_spare_parts')
      .select('images')
      .eq('id', sparePartId)
      .single();

    if (recordError) {
      console.error('❌ [DEBUG] Error getting spare part record:', recordError);
      return [];
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

      console.log('✅ [DEBUG] Retrieved spare part images from main record:', convertedImages);
      return convertedImages;
    }

    console.log('ℹ️ [DEBUG] No images found in any location');
    return [];
  } catch (error) {
    console.error('❌ [DEBUG] Failed to get spare part images:', error);
    return [];
  }
};

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
        variants:lats_spare_part_variants(*)
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
        variants:lats_spare_part_variants(*)
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
export const createSparePart = async (sparePartData: any): Promise<SparePartResponse> => {
  try {
    console.log('🔍 [DEBUG] ===== CREATE SPARE PART API START =====');
    console.log('🔍 [DEBUG] Input sparePartData:', sparePartData);
    console.log('🔍 [DEBUG] Input sparePartData type:', typeof sparePartData);
    console.log('🔍 [DEBUG] Input sparePartData keys:', Object.keys(sparePartData || {}));
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔍 [DEBUG] Current user:', user?.id);
    
    // Check if variants are being used
    const useVariants = sparePartData.useVariants || false;
    const variants = sparePartData.variants || [];
    
    console.log('🔍 [DEBUG] Use variants:', useVariants);
    console.log('🔍 [DEBUG] Variants count:', variants.length);
    
    // Convert form data from camelCase to snake_case
    const databaseData = convertFormDataToDatabaseFormat(sparePartData);
    console.log('🔍 [DEBUG] Converted databaseData:', databaseData);
    console.log('🔍 [DEBUG] DatabaseData keys:', Object.keys(databaseData || {}));
    
    // Check if part number already exists
    if (databaseData.part_number) {
      console.log('🔍 [DEBUG] Checking for duplicate part number:', databaseData.part_number);
      const { data: existingPart, error: checkError } = await supabase
        .from('lats_spare_parts')
        .select('id, name, part_number')
        .eq('part_number', databaseData.part_number)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ [DEBUG] Error checking for duplicate part number:', checkError);
        throw checkError;
      }
      
      if (existingPart) {
        console.log('❌ [DEBUG] Duplicate part number found:', existingPart);
        return {
          data: existingPart,
          message: `DUPLICATE_PART_NUMBER: A spare part with part number "${databaseData.part_number}" already exists (ID: ${existingPart.id}, Name: "${existingPart.name}"). Please use a different part number or update the existing part instead.`,
          ok: false,
          errorType: 'DUPLICATE_PART_NUMBER',
          existingPart: existingPart
        };
      }
      
      console.log('✅ [DEBUG] Part number is unique, proceeding with creation');
    }
    
    // Calculate total quantity and value if using variants
    let totalQuantity = 0;
    let totalValue = 0;
    
    if (useVariants && variants.length > 0) {
      totalQuantity = variants.reduce((sum: number, variant: SparePartVariant) => sum + (variant.quantity || 0), 0);
      totalValue = variants.reduce((sum: number, variant: SparePartVariant) => sum + ((variant.quantity || 0) * (variant.selling_price || 0)), 0);
    } else {
      totalQuantity = databaseData.quantity || 0;
      totalValue = (databaseData.quantity || 0) * (databaseData.selling_price || 0);
    }
    
    const insertData = {
      ...databaseData,
      // When using variants, set main product quantities to 0
      quantity: useVariants ? 0 : databaseData.quantity,
      cost_price: useVariants ? 0 : databaseData.cost_price,
      selling_price: useVariants ? 0 : databaseData.selling_price,
      min_quantity: useVariants ? 0 : databaseData.min_quantity,
      // Add metadata about variants
      metadata: {
        useVariants: useVariants,
        variantCount: useVariants ? variants.length : 0,
        totalQuantity: totalQuantity,
        totalValue: totalValue
      },
      created_by: user?.id,
      updated_by: user?.id
    };
    console.log('🔍 [DEBUG] Final insert data:', insertData);
    console.log('🔍 [DEBUG] Insert data keys:', Object.keys(insertData));
    
    console.log('🔍 [DEBUG] Executing Supabase insert...');
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .insert(insertData)
      .select()
      .single();

    console.log('🔍 [DEBUG] Supabase response data:', data);
    console.log('🔍 [DEBUG] Supabase response error:', error);

    if (error) {
      console.error('❌ [DEBUG] Supabase error:', error);
      
      // Handle specific database errors with clear messages
      if (error.code === '23505') { // Unique constraint violation
        const constraint = error.constraint || 'unknown constraint';
        let fieldName = 'field';
        if (constraint.includes('part_number')) {
          fieldName = 'part number';
        } else if (constraint.includes('name')) {
          fieldName = 'name';
        }
        
        return {
          data: null as any,
          message: `DUPLICATE_ERROR: A spare part with this ${fieldName} already exists. Please use a different ${fieldName}.`,
          ok: false,
          errorType: 'DUPLICATE_CONSTRAINT',
          constraint: constraint
        };
      } else if (error.code === '23503') { // Foreign key violation
        return {
          data: null as any,
          message: `FOREIGN_KEY_ERROR: The selected category or supplier does not exist. Please select valid options.`,
          ok: false,
          errorType: 'FOREIGN_KEY_VIOLATION'
        };
      } else if (error.code === '23514') { // Check constraint violation
        return {
          data: null as any,
          message: `VALIDATION_ERROR: Invalid data provided. Please check that condition is set to 'new', 'used', or 'refurbished'.`,
          ok: false,
          errorType: 'CHECK_CONSTRAINT_VIOLATION'
        };
      }
      
      // Generic database error
      return {
        data: null as any,
        message: `DATABASE_ERROR: ${error.message || 'Unknown database error occurred'}`,
        ok: false,
        errorType: 'DATABASE_ERROR',
        originalError: error
      };
    }

    console.log('✅ [DEBUG] Spare part created successfully:', data);
    
    // Save images to product_images table with thumbnail support
    if (sparePartData.images && sparePartData.images.length > 0) {
      console.log('🔍 [DEBUG] Saving images to product_images table...');
      await saveSparePartImagesToDatabase(data.id, sparePartData.images, user?.id);
    }
    
    // Create variants if they exist
    if (useVariants && variants.length > 0 && data) {
      console.log('🔍 [DEBUG] Creating variants for spare part:', data.id);
      
      const variantData = variants.map((variant: SparePartVariant) => ({
        spare_part_id: data.id,
        name: variant.name,
        sku: variant.sku,
        cost_price: variant.cost_price,
        selling_price: variant.selling_price,
        quantity: variant.quantity,
        min_quantity: variant.min_quantity,
        variant_attributes: variant.attributes || {},
        image_url: variant.image_url || null,
        created_by: user?.id,
        updated_by: user?.id
      }));
      
      console.log('🔍 [DEBUG] Variant data to insert:', variantData);
      
      const { data: createdVariants, error: variantError } = await supabase
        .from('lats_spare_part_variants')
        .insert(variantData)
        .select();
      
      if (variantError) {
        console.error('❌ [DEBUG] Error creating variants:', variantError);
        // Don't throw error here, just log it - the main spare part was created successfully
      } else {
        console.log('✅ [DEBUG] Variants created successfully:', createdVariants);
      }
    }
    
    console.log('🔍 [DEBUG] ===== CREATE SPARE PART API END =====');
    
    return {
      data,
      message: 'Spare part created successfully',
      ok: true
    };
  } catch (error: any) {
    console.error('❌ [DEBUG] ===== CREATE SPARE PART API ERROR =====');
    console.error('❌ [DEBUG] Error creating spare part:', error);
    console.error('❌ [DEBUG] Error message:', error?.message);
    console.error('❌ [DEBUG] Error details:', error?.details);
    console.error('❌ [DEBUG] Error hint:', error?.hint);
    console.error('❌ [DEBUG] Error code:', error?.code);
    
    if (error?.response) {
      console.error('❌ [DEBUG] Error response:', error.response);
    }
    
    // Handle specific database errors
    let errorMessage = 'Failed to create spare part';
    
    if (error?.code === '23505') {
      if (error?.message?.includes('part_number')) {
        errorMessage = 'A spare part with this part number already exists. Please use a different part number.';
      } else if (error?.message?.includes('name')) {
        errorMessage = 'A spare part with this name already exists. Please use a different name.';
      } else {
        errorMessage = 'A spare part with this information already exists. Please check for duplicates.';
      }
    } else if (error?.code === '23503') {
      errorMessage = 'Invalid reference. Please check that the category, supplier, or other referenced data exists.';
    } else if (error?.code === '23514') {
      errorMessage = 'Invalid data provided. Please check all required fields and constraints.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      data: null as any,
      message: errorMessage,
      ok: false
    };
  }
};

// Update an existing spare part
export const updateSparePart = async (id: string, sparePartData: any): Promise<SparePartResponse> => {
  try {
    console.log('🔍 [DEBUG] ===== UPDATE SPARE PART API START =====');
    console.log('🔍 [DEBUG] Update ID:', id);
    console.log('🔍 [DEBUG] Input sparePartData:', sparePartData);
    console.log('🔍 [DEBUG] Input sparePartData type:', typeof sparePartData);
    console.log('🔍 [DEBUG] Input sparePartData keys:', Object.keys(sparePartData || {}));
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔍 [DEBUG] Current user:', user?.id);
    
    // Convert form data from camelCase to snake_case
    const databaseData = convertFormDataToDatabaseFormat(sparePartData);
    console.log('🔍 [DEBUG] Converted databaseData:', databaseData);
    console.log('🔍 [DEBUG] DatabaseData keys:', Object.keys(databaseData || {}));
    
    const updateData = {
      ...databaseData,
      updated_by: user?.id
    };
    console.log('🔍 [DEBUG] Final update data:', updateData);
    console.log('🔍 [DEBUG] Update data keys:', Object.keys(updateData));
    
    console.log('🔍 [DEBUG] Executing Supabase update...');
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('🔍 [DEBUG] Supabase response data:', data);
    console.log('🔍 [DEBUG] Supabase response error:', error);

    if (error) {
      console.error('❌ [DEBUG] Supabase error:', error);
      throw error;
    }

    console.log('✅ [DEBUG] Spare part updated successfully:', data);
    console.log('🔍 [DEBUG] ===== UPDATE SPARE PART API END =====');
    
    return {
      data,
      message: 'Spare part updated successfully',
      ok: true
    };
  } catch (error: any) {
    console.error('❌ [DEBUG] ===== UPDATE SPARE PART API ERROR =====');
    console.error('❌ [DEBUG] Error updating spare part:', error);
    console.error('❌ [DEBUG] Error message:', error?.message);
    console.error('❌ [DEBUG] Error details:', error?.details);
    console.error('❌ [DEBUG] Error hint:', error?.hint);
    console.error('❌ [DEBUG] Error code:', error?.code);
    
    if (error?.response) {
      console.error('❌ [DEBUG] Error response:', error.response);
    }
    
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
        spare_part:lats_spare_parts(name, part_number)
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
      .select('id', { count: 'exact', head: true });

    // Get total value
    const { data: valueData } = await supabase
      .from('lats_spare_parts')
      .select('cost_price, quantity');

    const totalValue = valueData?.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0) || 0;

    // Get low stock count
    const { count: lowStockCount } = await supabase
      .from('lats_spare_parts')
      .select('id', { count: 'exact', head: true })
      .lte('quantity', supabase.raw('min_quantity'))
      .gt('quantity', 0);

    // Get out of stock count
    const { count: outOfStockCount } = await supabase
      .from('lats_spare_parts')
      .select('id', { count: 'exact', head: true })
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

// Find existing spare part by part number
export const findSparePartByPartNumber = async (partNumber: string): Promise<{ data: SparePart | null; message: string; ok: boolean }> => {
  try {
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .select(`
        *,
        category:lats_categories(name),
        supplier:lats_suppliers(name, email, phone)
      `)
      .eq('part_number', partNumber)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return {
        data: null,
        message: 'No spare part found with this part number',
        ok: false
      };
    }
    
    return {
      data,
      message: 'Spare part found successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error finding spare part by part number:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to find spare part',
      ok: false
    };
  }
};

// Create or update spare part (upsert functionality)
export const createOrUpdateSparePart = async (sparePartData: any): Promise<SparePartResponse> => {
  try {
    console.log('🔍 [DEBUG] ===== CREATE OR UPDATE SPARE PART API START =====');
    console.log('🔍 [DEBUG] Input sparePartData:', sparePartData);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Convert form data from camelCase to snake_case
    const databaseData = convertFormDataToDatabaseFormat(sparePartData);
    
    // Check if part number already exists
    if (databaseData.part_number) {
      const existingPartResult = await findSparePartByPartNumber(databaseData.part_number);
      
      if (existingPartResult.ok && existingPartResult.data) {
        console.log('🔍 [DEBUG] Found existing part, updating instead of creating:', existingPartResult.data.id);
        
        // Update existing part
        const updateResult = await updateSparePartWithVariants(existingPartResult.data.id, sparePartData);
        
        if (updateResult.ok) {
          return {
            ...updateResult,
            message: `UPDATED_EXISTING: Spare part "${databaseData.part_number}" was updated successfully. A spare part with this part number already existed (ID: ${existingPartResult.data.id}, Previous Name: "${existingPartResult.data.name}").`,
            operationType: 'UPDATE_EXISTING',
            previousData: existingPartResult.data
          };
        } else {
          return {
            ...updateResult,
            message: `UPDATE_FAILED: Failed to update existing spare part "${databaseData.part_number}" (ID: ${existingPartResult.data.id}). ${updateResult.message}`,
            operationType: 'UPDATE_FAILED',
            existingPart: existingPartResult.data
          };
        }
      }
    }
    
    // If no existing part found, create new one
    console.log('🔍 [DEBUG] No existing part found, creating new one');
    const createResult = await createSparePart(sparePartData);
    
    if (createResult.ok) {
      return {
        ...createResult,
        message: `CREATED_NEW: Spare part "${databaseData.part_number}" was created successfully as a new record.`,
        operationType: 'CREATE_NEW'
      };
    } else {
      return {
        ...createResult,
        message: `CREATE_FAILED: Failed to create new spare part "${databaseData.part_number}". ${createResult.message}`,
        operationType: 'CREATE_FAILED'
      };
    }
    
  } catch (error: any) {
    console.error('❌ [DEBUG] Error in create or update spare part:', error);
    return {
      data: null as any,
      message: error instanceof Error ? error.message : 'Failed to create or update spare part',
      ok: false
    };
  }
};

// Check if a part number already exists
export const checkPartNumberExists = async (partNumber: string, excludeId?: string): Promise<{ exists: boolean; message: string }> => {
  try {
    let query = supabase
      .from('lats_spare_parts')
      .select('id, name, part_number')
      .eq('part_number', partNumber);
    
    // Exclude current part if updating
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) {
      throw error;
    }
    
    if (data) {
      return { 
        exists: true, 
        message: `Part number "${partNumber}" is already used by "${data.name}"` 
      };
    }
    
    return { exists: false, message: 'Part number is available' };
  } catch (error) {
    console.error('Error checking part number:', error);
    return { 
      exists: false, 
      message: 'Unable to verify part number availability' 
    };
  }
};

// Enhanced search spare parts with variants support
export const searchSpareParts = async (searchTerm: string): Promise<SparePart[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .select(`
        *,
        category:lats_categories(name),
        supplier:lats_suppliers(name),
        variants:lats_spare_part_variants(*)
      `)
      .or(`part_number.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
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

// Search spare parts with variants by name, SKU, or attributes
export const searchSparePartsWithVariants = async (searchTerm: string): Promise<SparePart[]> => {
  try {
    console.log('🔍 [DEBUG] Searching spare parts with variants:', searchTerm);
    
    // First, search main spare parts
    const { data: mainResults, error: mainError } = await supabase
      .from('lats_spare_parts')
      .select(`
        *,
        category:lats_categories(name),
        supplier:lats_suppliers(name),
        variants:lats_spare_part_variants(*)
      `)
      .or(`part_number.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_active', true);

    if (mainError) {
      console.error('Error searching main spare parts:', mainError);
    }

    // Then search variants specifically
    const { data: variantResults, error: variantError } = await supabase
      .from('lats_spare_part_variants')
      .select(`
        *,
        spare_part:lats_spare_parts(
          *,
          category:lats_categories(name),
          supplier:lats_suppliers(name)
        )
      `)
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .eq('spare_part.is_active', true);

    if (variantError) {
      console.error('Error searching variants:', variantError);
    }

    // Combine and deduplicate results
    const allResults = new Map<string, SparePart>();
    
    // Add main results
    (mainResults || []).forEach(part => {
      allResults.set(part.id, part);
    });
    
    // Add variant results (convert variant results to spare part format)
    (variantResults || []).forEach(variant => {
      if (variant.spare_part) {
        const sparePart = variant.spare_part;
        // If we already have this spare part, add the variant to its variants array
        if (allResults.has(sparePart.id)) {
          const existingPart = allResults.get(sparePart.id)!;
          if (!existingPart.variants) {
            existingPart.variants = [];
          }
          // Check if variant already exists
          const variantExists = existingPart.variants.some(v => v.id === variant.id);
          if (!variantExists) {
            existingPart.variants.push(variant);
          }
        } else {
          // Add new spare part with this variant
          sparePart.variants = [variant];
          allResults.set(sparePart.id, sparePart);
        }
      }
    });

    const finalResults = Array.from(allResults.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20); // Limit to 20 results

    console.log('🔍 [DEBUG] Search results count:', finalResults.length);
    return finalResults;
  } catch (error) {
    console.error('Error searching spare parts with variants:', error);
    return [];
  }
};

// Search variants by attributes (specifications)
export const searchVariantsByAttributes = async (searchTerm: string): Promise<SparePartVariant[]> => {
  try {
    console.log('🔍 [DEBUG] Searching variants by attributes:', searchTerm);
    
    const { data, error } = await supabase
      .from('lats_spare_part_variants')
      .select(`
        *,
        spare_part:lats_spare_parts(
          *,
          category:lats_categories(name),
          supplier:lats_suppliers(name)
        )
      `)
      .eq('spare_part.is_active', true);

    if (error) {
      throw error;
    }

    // Filter variants by attributes that match the search term
    const matchingVariants = (data || []).filter(variant => {
      if (!variant.variant_attributes) return false;
      
      const attributes = variant.variant_attributes;
      const searchLower = searchTerm.toLowerCase();
      
      // Check if any attribute key or value contains the search term
      return Object.entries(attributes).some(([key, value]) => 
        key.toLowerCase().includes(searchLower) || 
        String(value).toLowerCase().includes(searchLower)
      );
    });

    console.log('🔍 [DEBUG] Found variants with matching attributes:', matchingVariants.length);
    return matchingVariants;
  } catch (error) {
    console.error('Error searching variants by attributes:', error);
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

// ===== SPARE PART VARIANTS API FUNCTIONS =====

// Get variants for a spare part
export const getSparePartVariants = async (sparePartId: string): Promise<SparePartVariant[]> => {
  try {
    const { data, error } = await supabase
      .from('lats_spare_part_variants')
      .select('*')
      .eq('spare_part_id', sparePartId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching spare part variants:', error);
    return [];
  }
};

// Create a spare part variant
export const createSparePartVariant = async (variantData: SparePartVariant): Promise<{ data: SparePartVariant | null; message: string; ok: boolean }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const insertData = {
      ...variantData,
      created_by: user?.id,
      updated_by: user?.id
    };

    const { data, error } = await supabase
      .from('lats_spare_part_variants')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data,
      message: 'Variant created successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error creating spare part variant:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to create variant',
      ok: false
    };
  }
};

// Update a spare part variant
export const updateSparePartVariant = async (id: string, variantData: Partial<SparePartVariant>): Promise<{ data: SparePartVariant | null; message: string; ok: boolean }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updateData = {
      ...variantData,
      updated_by: user?.id
    };

    const { data, error } = await supabase
      .from('lats_spare_part_variants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data,
      message: 'Variant updated successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error updating spare part variant:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to update variant',
      ok: false
    };
  }
};

// Delete a spare part variant
export const deleteSparePartVariant = async (id: string): Promise<{ message: string; ok: boolean }> => {
  try {
    const { error } = await supabase
      .from('lats_spare_part_variants')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      message: 'Variant deleted successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error deleting spare part variant:', error);
    return {
      message: error instanceof Error ? error.message : 'Failed to delete variant',
      ok: false
    };
  }
};

// Bulk create spare part variants
export const bulkCreateSparePartVariants = async (variants: SparePartVariant[]): Promise<{ data: SparePartVariant[] | null; message: string; ok: boolean }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const insertData = variants.map(variant => ({
      ...variant,
      created_by: user?.id,
      updated_by: user?.id
    }));

    const { data, error } = await supabase
      .from('lats_spare_part_variants')
      .insert(insertData)
      .select();

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      message: 'Variants created successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error bulk creating spare part variants:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to create variants',
      ok: false
    };
  }
};

// Get variants with advanced filtering and search
export const getVariantsWithFilters = async (filters: {
  sparePartId?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  attributes?: Record<string, any>;
  limit?: number;
  offset?: number;
}): Promise<{ data: SparePartVariant[]; total: number; message: string; ok: boolean }> => {
  try {
    console.log('🔍 [DEBUG] Getting variants with filters:', filters);
    
    let query = supabase
      .from('lats_spare_part_variants')
      .select(`
        *,
        spare_part:lats_spare_parts(
          *,
          category:lats_categories(name),
          supplier:lats_suppliers(name)
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.sparePartId) {
      query = query.eq('spare_part_id', filters.sparePartId);
    }

    if (filters.searchTerm) {
      query = query.or(`name.ilike.%${filters.searchTerm}%,sku.ilike.%${filters.searchTerm}%`);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('selling_price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('selling_price', filters.maxPrice);
    }

    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        query = query.gt('quantity', 0);
      } else {
        query = query.eq('quantity', 0);
      }
    }

    // Apply pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by created date
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    let filteredData = data || [];

    // Filter by attributes if provided
    if (filters.attributes && Object.keys(filters.attributes).length > 0) {
      filteredData = filteredData.filter(variant => {
        if (!variant.variant_attributes) return false;
        
        return Object.entries(filters.attributes!).every(([key, value]) => {
          const variantValue = variant.variant_attributes[key];
          if (typeof value === 'string') {
            return String(variantValue).toLowerCase().includes(value.toLowerCase());
          }
          return variantValue === value;
        });
      });
    }

    console.log('🔍 [DEBUG] Found variants:', filteredData.length);
    
    return {
      data: filteredData,
      total: count || 0,
      message: 'Variants retrieved successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error getting variants with filters:', error);
    return {
      data: [],
      total: 0,
      message: error instanceof Error ? error.message : 'Failed to get variants',
      ok: false
    };
  }
};

// Get variant statistics
export const getVariantStats = async (sparePartId?: string): Promise<{
  totalVariants: number;
  totalValue: number;
  inStockVariants: number;
  outOfStockVariants: number;
  lowStockVariants: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
}> => {
  try {
    let query = supabase
      .from('lats_spare_part_variants')
      .select('selling_price, quantity, min_quantity');

    if (sparePartId) {
      query = query.eq('spare_part_id', sparePartId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const variants = data || [];
    const totalVariants = variants.length;
    
    if (totalVariants === 0) {
      return {
        totalVariants: 0,
        totalValue: 0,
        inStockVariants: 0,
        outOfStockVariants: 0,
        lowStockVariants: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 }
      };
    }

    const totalValue = variants.reduce((sum, v) => sum + (v.selling_price * v.quantity), 0);
    const inStockVariants = variants.filter(v => v.quantity > 0).length;
    const outOfStockVariants = variants.filter(v => v.quantity === 0).length;
    const lowStockVariants = variants.filter(v => v.quantity > 0 && v.quantity <= v.min_quantity).length;
    
    const prices = variants.map(v => v.selling_price).filter(p => p > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices)
    } : { min: 0, max: 0 };

    return {
      totalVariants,
      totalValue,
      inStockVariants,
      outOfStockVariants,
      lowStockVariants,
      averagePrice,
      priceRange
    };
  } catch (error) {
    console.error('Error getting variant stats:', error);
    return {
      totalVariants: 0,
      totalValue: 0,
      inStockVariants: 0,
      outOfStockVariants: 0,
      lowStockVariants: 0,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 }
    };
  }
};

// Search variants by multiple criteria (comprehensive search)
export const searchVariantsComprehensive = async (searchTerm: string): Promise<{
  data: SparePartVariant[];
  message: string;
  ok: boolean;
}> => {
  try {
    console.log('🔍 [DEBUG] Comprehensive variant search:', searchTerm);
    
    // Search by variant name and SKU
    const { data: nameSkuResults, error: nameSkuError } = await supabase
      .from('lats_spare_part_variants')
      .select(`
        *,
        spare_part:lats_spare_parts(
          *,
          category:lats_categories(name),
          supplier:lats_suppliers(name)
        )
      `)
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);

    if (nameSkuError) {
      console.error('Error searching by name/SKU:', nameSkuError);
    }

    // Search by attributes
    const attributeResults = await searchVariantsByAttributes(searchTerm);

    // Search by parent spare part name
    const { data: parentResults, error: parentError } = await supabase
      .from('lats_spare_part_variants')
      .select(`
        *,
        spare_part:lats_spare_parts(
          *,
          category:lats_categories(name),
          supplier:lats_suppliers(name)
        )
      `)
      .ilike('spare_part.name', `%${searchTerm}%`);

    if (parentError) {
      console.error('Error searching by parent name:', parentError);
    }

    // Combine and deduplicate results
    const allResults = new Map<string, SparePartVariant>();
    
    // Add name/SKU results
    (nameSkuResults || []).forEach(variant => {
      allResults.set(variant.id, variant);
    });
    
    // Add attribute results
    attributeResults.forEach(variant => {
      allResults.set(variant.id, variant);
    });
    
    // Add parent results
    (parentResults || []).forEach(variant => {
      allResults.set(variant.id, variant);
    });

    const finalResults = Array.from(allResults.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 50); // Limit to 50 results

    console.log('🔍 [DEBUG] Comprehensive search results:', finalResults.length);
    
    return {
      data: finalResults,
      message: 'Variants found successfully',
      ok: true
    };
  } catch (error) {
    console.error('Error in comprehensive variant search:', error);
    return {
      data: [],
      message: error instanceof Error ? error.message : 'Failed to search variants',
      ok: false
    };
  }
};

// Update spare part with variants
export const updateSparePartWithVariants = async (id: string, sparePartData: any): Promise<SparePartResponse> => {
  try {
    console.log('🔍 [DEBUG] ===== UPDATE SPARE PART WITH VARIANTS API START =====');
    console.log('🔍 [DEBUG] Update ID:', id);
    console.log('🔍 [DEBUG] Input sparePartData:', sparePartData);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if variants are being used
    const useVariants = sparePartData.useVariants || false;
    const variants = sparePartData.variants || [];
    
    console.log('🔍 [DEBUG] Use variants:', useVariants);
    console.log('🔍 [DEBUG] Variants count:', variants.length);
    
    // Convert form data from camelCase to snake_case
    const databaseData = convertFormDataToDatabaseFormat(sparePartData);
    
    // Calculate total quantity and value if using variants
    let totalQuantity = 0;
    let totalValue = 0;
    
    if (useVariants && variants.length > 0) {
      totalQuantity = variants.reduce((sum: number, variant: SparePartVariant) => sum + (variant.quantity || 0), 0);
      totalValue = variants.reduce((sum: number, variant: SparePartVariant) => sum + ((variant.quantity || 0) * (variant.selling_price || 0)), 0);
    } else {
      totalQuantity = databaseData.quantity || 0;
      totalValue = (databaseData.quantity || 0) * (databaseData.selling_price || 0);
    }
    
    const updateData = {
      ...databaseData,
      // When using variants, set main product quantities to 0
      quantity: useVariants ? 0 : databaseData.quantity,
      cost_price: useVariants ? 0 : databaseData.cost_price,
      selling_price: useVariants ? 0 : databaseData.selling_price,
      min_quantity: useVariants ? 0 : databaseData.min_quantity,
      // Add metadata about variants
      metadata: {
        useVariants: useVariants,
        variantCount: useVariants ? variants.length : 0,
        totalQuantity: totalQuantity,
        totalValue: totalValue
      },
      updated_by: user?.id
    };
    
    // Validate foreign key references before updating
    console.log('🔍 [DEBUG] Validating foreign key references...');
    
    if (updateData.category_id) {
      const { data: categoryExists } = await supabase
        .from('lats_categories')
        .select('id')
        .eq('id', updateData.category_id)
        .single();
      
      if (!categoryExists) {
        console.error('❌ [DEBUG] Category ID does not exist:', updateData.category_id);
        throw new Error(`Category with ID ${updateData.category_id} does not exist`);
      } else {
        console.log('✅ [DEBUG] Category ID is valid:', updateData.category_id);
      }
    }
    
    if (updateData.supplier_id) {
      const { data: supplierExists } = await supabase
        .from('lats_suppliers')
        .select('id')
        .eq('id', updateData.supplier_id)
        .single();
      
      if (!supplierExists) {
        console.error('❌ [DEBUG] Supplier ID does not exist:', updateData.supplier_id);
        throw new Error(`Supplier with ID ${updateData.supplier_id} does not exist`);
      } else {
        console.log('✅ [DEBUG] Supplier ID is valid:', updateData.supplier_id);
      }
    }

    console.log('🔍 [DEBUG] Executing Supabase update...');
    console.log('🔍 [DEBUG] Update data being sent:', updateData);
    console.log('🔍 [DEBUG] Update ID:', id);
    
    const { data, error } = await supabase
      .from('lats_spare_parts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('🔍 [DEBUG] Supabase update response:', { data, error });

    if (error) {
      console.error('❌ [DEBUG] Supabase update error:', error);
      throw error;
    }

    console.log('✅ [DEBUG] Spare part updated successfully:', data);
    
    // Verify the update by fetching the record again
    console.log('🔍 [DEBUG] Verifying update by fetching record again...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('lats_spare_parts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (verifyError) {
      console.error('❌ [DEBUG] Error verifying update:', verifyError);
    } else {
      console.log('✅ [DEBUG] Verified update data:', verifyData);
    }
    
    // Update images in spare_part_images table
    if (sparePartData.images && sparePartData.images.length > 0) {
      console.log('🔍 [DEBUG] Updating images in spare_part_images table...');
      
      try {
        // First, try to save new images
        await saveSparePartImagesToDatabase(id, sparePartData.images, user?.id);
        
        // Only delete existing images if the insert was successful
        console.log('✅ [DEBUG] Images saved successfully, cleaning up old images...');
        const { error: deleteError } = await supabase
          .from('spare_part_images')
          .delete()
          .eq('spare_part_id', id)
          .neq('image_url', sparePartData.images[0]?.image_url || sparePartData.images[0]?.url);
        
        if (deleteError) {
          console.error('❌ [DEBUG] Error deleting old images:', deleteError);
        }
      } catch (imageError) {
        console.error('❌ [DEBUG] Failed to update images, keeping existing ones:', imageError);
        // Don't delete existing images if the insert failed
      }
    }
    
    // Handle variants update
    if (useVariants && variants.length > 0) {
      console.log('🔍 [DEBUG] Updating variants for spare part:', id);
      
      // First, delete existing variants
      const { error: deleteError } = await supabase
        .from('lats_spare_part_variants')
        .delete()
        .eq('spare_part_id', id);
      
      if (deleteError) {
        console.error('❌ [DEBUG] Error deleting existing variants:', deleteError);
      }
      
      // Then create new variants
      const variantData = variants.map((variant: SparePartVariant) => ({
        spare_part_id: id,
        name: variant.name,
        sku: variant.sku,
        cost_price: variant.cost_price,
        selling_price: variant.selling_price,
        quantity: variant.quantity,
        min_quantity: variant.min_quantity,
        variant_attributes: variant.attributes || {},
        image_url: variant.image_url || null,
        created_by: user?.id,
        updated_by: user?.id
      }));
      
      const { data: createdVariants, error: variantError } = await supabase
        .from('lats_spare_part_variants')
        .insert(variantData)
        .select();
      
      if (variantError) {
        console.error('❌ [DEBUG] Error creating variants:', variantError);
      } else {
        console.log('✅ [DEBUG] Variants updated successfully:', createdVariants);
      }
    } else {
      // If not using variants, delete any existing variants
      const { error: deleteError } = await supabase
        .from('lats_spare_part_variants')
        .delete()
        .eq('spare_part_id', id);
      
      if (deleteError) {
        console.error('❌ [DEBUG] Error deleting variants:', deleteError);
      }
    }
    
    console.log('🔍 [DEBUG] ===== UPDATE SPARE PART WITH VARIANTS API END =====');
    
    return {
      data,
      message: 'Spare part updated successfully',
      ok: true
    };
  } catch (error: any) {
    console.error('❌ [DEBUG] ===== UPDATE SPARE PART WITH VARIANTS API ERROR =====');
    console.error('❌ [DEBUG] Error updating spare part:', error);
    
    return {
      data: null as any,
      message: error instanceof Error ? error.message : 'Failed to update spare part',
      ok: false
    };
  }
};

// ===== REPAIR PARTS API FUNCTIONS =====
// These functions handle repair parts (parts needed for specific device repairs)

export interface RepairPart {
  id: string;
  device_id: string;
  spare_part_id: string;
  quantity_needed: number;
  quantity_used: number;
  cost_per_unit: number;
  total_cost: number;
  status: 'needed' | 'ordered' | 'accepted' | 'received' | 'used';
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
    const { data, error } = await supabase
      .from('repair_parts')
      .select(`
        *,
        spare_part:lats_spare_parts(
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

    return {
      data: data || [],
      message: 'Repair parts retrieved successfully',
      ok: true,
      total: data?.length || 0
    };
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
    
    // First, check stock availability for all parts
    for (const data of dataArray) {
      const { data: sparePart, error: fetchError } = await supabase
        .from('lats_spare_parts')
        .select('quantity, name')
        .eq('id', data.spare_part_id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch spare part: ${fetchError.message}`);
      }

      if (!sparePart) {
        throw new Error(`Spare part not found: ${data.spare_part_id}`);
      }

      if (sparePart.quantity < data.quantity_needed) {
        throw new Error(`Insufficient stock for ${sparePart.name}. Available: ${sparePart.quantity}, Needed: ${data.quantity_needed}`);
      }
    }

    const repairPartsData = dataArray.map(data => ({
      ...data,
      created_by: user?.id,
      updated_by: user?.id
    }));

    // Create repair parts
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

    // Now deduct stock for each part used
    for (const data of dataArray) {
      // Get current quantity and update
      const { data: currentPart, error: fetchCurrentError } = await supabase
        .from('lats_spare_parts')
        .select('quantity')
        .eq('id', data.spare_part_id)
        .single();

      if (fetchCurrentError) {
        console.error('Error fetching current quantity:', fetchCurrentError);
        continue;
      }

      const { error: stockError } = await supabase
        .from('lats_spare_parts')
        .update({
          quantity: currentPart.quantity - data.quantity_needed,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.spare_part_id);

      if (stockError) {
        console.error('Error updating stock for spare part:', data.spare_part_id, stockError);
        // Continue with other parts even if one fails
      }

      // Record the usage in spare_part_usage table
      const { error: usageError } = await supabase
        .from('lats_spare_part_usage')
        .insert({
          spare_part_id: data.spare_part_id,
          quantity: data.quantity_needed,
          device_id: data.device_id,
          reason: `Repair attachment - Device: ${data.device_id}`,
          notes: data.notes || `Spare part attached to device repair`,
          used_by: user?.id
        });

      if (usageError) {
        console.error('Error recording usage for spare part:', data.spare_part_id, usageError);
        // Continue with other parts even if one fails
      }
    }

    return {
      data: repairParts || [],
      message: `${repairParts?.length || 0} repair parts created and stock deducted successfully`,
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

// Accept spare parts (for customer care role)
export const acceptSpareParts = async (repairPartIds: string[]): Promise<{
  data: RepairPart[] | null;
  message: string;
  ok: boolean;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update all parts to 'accepted' status
    const { data, error } = await supabase
      .from('repair_parts')
      .update({
        status: 'accepted',
        updated_by: user.id
      })
      .in('id', repairPartIds)
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
      data: data || [],
      message: `${data?.length || 0} spare parts accepted successfully`,
      ok: true
    };
  } catch (error) {
    console.error('Error accepting spare parts:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to accept spare parts',
      ok: false
    };
  }
};

// Reject spare parts (for customer care role)
export const rejectSpareParts = async (repairPartIds: string[], reason?: string): Promise<{
  data: RepairPart[] | null;
  message: string;
  ok: boolean;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update all parts to 'needed' status with rejection reason in notes
    const updateData: any = {
      status: 'needed',
      updated_by: user.id
    };

    if (reason) {
      updateData.notes = `Rejected by customer care: ${reason}`;
    }

    const { data, error } = await supabase
      .from('repair_parts')
      .update(updateData)
      .in('id', repairPartIds)
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
      data: data || [],
      message: `${data?.length || 0} spare parts rejected successfully`,
      ok: true
    };
  } catch (error) {
    console.error('Error rejecting spare parts:', error);
    return {
      data: null,
      message: error instanceof Error ? error.message : 'Failed to reject spare parts',
      ok: false
    };
  }
};

// Check if all spare parts for a device are ready (accepted or received)
export const areAllSparePartsReady = async (deviceId: string): Promise<{
  ready: boolean;
  totalParts: number;
  readyParts: number;
  message: string;
}> => {
  try {
    const response = await getRepairParts(deviceId);
    
    if (!response.ok || !response.data) {
      return {
        ready: false,
        totalParts: 0,
        readyParts: 0,
        message: 'Failed to fetch repair parts'
      };
    }

    const parts = response.data;
    const totalParts = parts.length;
    const readyParts = parts.filter(part => 
      part.status === 'accepted' || part.status === 'received' || part.status === 'used'
    ).length;

    const ready = totalParts > 0 && readyParts === totalParts;

    return {
      ready,
      totalParts,
      readyParts,
      message: ready 
        ? `All ${totalParts} parts are ready` 
        : `${readyParts}/${totalParts} parts are ready`
    };
  } catch (error) {
    console.error('Error checking spare parts readiness:', error);
    return {
      ready: false,
      totalParts: 0,
      readyParts: 0,
      message: 'Error checking parts status'
    };
  }
};
