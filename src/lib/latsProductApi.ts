import { supabase } from './supabaseClient';
import { validateAndCreateDefaultVariant } from '../features/lats/lib/variantUtils';
import { ImageUploadService } from './imageUpload';

// Use the main supabase client instead of creating a separate one
// This ensures consistent configuration and avoids conflicts

export interface LatsProduct {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;

  categoryId: string;
  supplierId?: string;
  images?: string[];
  totalQuantity: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  variants: LatsProductVariant[];
}

export interface LatsProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  attributes: Record<string, any>;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;

  categoryId: string;
  supplierId?: string;
  variants: Array<{
    sku: string;
    name: string;
  
    sellingPrice: number;
    costPrice: number;
    quantity: number;
    minQuantity: number;
    attributes?: Record<string, any>;
  }>;
  images?: Array<{
    image_url: string;
    thumbnail_url?: string;
    file_name: string;
    file_size: number;
    is_primary: boolean;
  }>;
  metadata?: Record<string, any>;
}

// Create a new product with images
export async function createProduct(
  productData: CreateProductData,
  userId: string
): Promise<LatsProduct> {
  try {
    // Extract images from the data
    const { images, ...productWithoutImages } = productData;
    
    // Create the product first
    const productInsertData: any = {
      name: productWithoutImages.name,
      description: productWithoutImages.description,
      category_id: productWithoutImages.categoryId,
      is_active: productWithoutImages.isActive ?? true,
      total_quantity: 0,
      total_value: 0
    };
    
    // Only add supplier_id if it has valid values
    if (productWithoutImages.supplierId) {
      productInsertData.supplier_id = productWithoutImages.supplierId;
    }
    
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .insert(productInsertData)
      .select()
      .single();

    if (productError) {
      console.error('Product creation error:', productError);
      console.error('Product data being inserted:', productInsertData);
      throw productError;
    }

    // Create variants (be resilient to both price/sellingPrice & stock field names)
    if (productWithoutImages.variants && productWithoutImages.variants.length > 0) {
      const variants = productWithoutImages.variants.map(variant => ({
        product_id: product.id,
        sku: variant.sku,
        name: variant.name,
        attributes: variant.attributes || {},
        cost_price: variant.costPrice ?? 0,
        selling_price: (variant.sellingPrice ?? variant.price) ?? 0,
        quantity: (variant.quantity ?? variant.stockQuantity) ?? 0,
        min_quantity: (variant.minQuantity ?? variant.minStockLevel) ?? 0
      }));

      const { error: variantsError } = await supabase
        .from('lats_product_variants')
        .insert(variants);

      if (variantsError) {
        console.error('Variants creation error:', variantsError);
        console.error('Variants data being inserted:', variants);
        throw variantsError;
      }
    } else {
      // No variants provided - create a default variant automatically
      console.log('🔄 No variants provided, creating default variant automatically');
      
      const defaultVariantResult = await validateAndCreateDefaultVariant(
        product.id,
        product.name,
        {
          costPrice: productWithoutImages.costPrice,
          sellingPrice: productWithoutImages.sellingPrice,
          quantity: productWithoutImages.quantity,
          minQuantity: productWithoutImages.minQuantity,
          sku: productWithoutImages.sku,
          attributes: productWithoutImages.attributes
        }
      );

      if (!defaultVariantResult.success) {
        console.error('❌ Failed to create default variant:', defaultVariantResult.error);
        throw new Error(`Failed to create default variant: ${defaultVariantResult.error}`);
      }
      
      console.log('✅ Default variant created successfully');
    }

    // Handle images if provided
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // If the image has a blob URL (from file upload), we need to convert it to a file and upload
        if (image.image_url.startsWith('blob:')) {
          // This would need to be handled by the EnhancedImageUpload component
          // For now, we'll skip these images as they should be uploaded separately
          console.log('Skipping blob URL image:', image.file_name);
          continue;
        }
        
        // Insert image record
        const { error: imageError } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            image_url: image.image_url,
            thumbnail_url: image.thumbnail_url,
            file_name: image.file_name,
            file_size: image.file_size,
            is_primary: image.is_primary,
            uploaded_by: userId
          });

        if (imageError) {
          console.error('Error inserting image:', imageError);
        }
      }
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: productWithoutImages.sku,

      categoryId: product.category_id,
      supplierId: product.supplier_id,
      isActive: product.is_active,
      totalQuantity: product.total_quantity,
      totalValue: product.total_value,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Get a product by ID with images
export async function getProduct(productId: string): Promise<LatsProduct & { images: any[] }> {
  const { data: product, error: productError } = await supabase
    .from('lats_products')
    .select(`
      *,
      lats_categories(name),
      lats_suppliers(name)
    `)
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  // Get product images
  const images = await ImageUploadService.getProductImages(productId);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,

    categoryId: product.category_id,
    supplierId: product.supplier_id,
    isActive: product.is_active,
    totalQuantity: product.total_quantity,
    totalValue: product.total_value,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    images
  };
}

// Get all products
export async function getProducts(): Promise<LatsProduct[]> {
  try {
    // First, get all products without variants to avoid large join queries
    const { data: products, error } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(name),
        lats_suppliers(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }

    if (!products || products.length === 0) {
      return [];
    }

    // Get product IDs for variant fetching
    const productIds = products.map(product => product.id);
    
    // Fetch variants in batches to avoid URL length issues
    const BATCH_SIZE = 5; // Reduced from 20 to 5 to avoid URL length issues
    const allVariants: any[] = [];
    
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batch = productIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(productIds.length / BATCH_SIZE);
      
      console.log(`📦 Fetching variants batch ${batchNumber}/${totalBatches} (${batch.length} products)`);
      
      // Retry logic for failed batch queries
      let retryCount = 0;
      const maxRetries = 3;
      let batchVariants = null;
      let batchError = null;
      
      while (retryCount < maxRetries && !batchVariants) {
        try {
          const { data, error } = await supabase
            .from('lats_product_variants')
            .select('id, product_id, name, sku, cost_price, selling_price, quantity, min_quantity, attributes, created_at, updated_at')
            .in('product_id', batch)
            .order('name');

          if (error) {
            console.error(`❌ Error fetching variants batch ${batchNumber} (attempt ${retryCount + 1}):`, error);
            batchError = error;
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Exponential backoff
              const delay = Math.pow(2, retryCount) * 1000;
              console.log(`⏳ Retrying batch ${batchNumber} in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            batchVariants = data;
            break;
          }
        } catch (exception) {
          console.error(`❌ Exception processing variants batch ${batchNumber} (attempt ${retryCount + 1}):`, exception);
          batchError = exception;
          retryCount++;
          
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`⏳ Retrying batch ${batchNumber} in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (batchVariants) {
        allVariants.push(...batchVariants);
        console.log(`✅ Batch ${batchNumber} returned ${batchVariants.length} variants`);
      } else {
        console.error(`❌ Failed to fetch batch ${batchNumber} after ${maxRetries} attempts`);
        
        // Fallback: fetch variants individually for this batch
        console.log(`🔄 Falling back to individual queries for batch ${batchNumber}...`);
        for (const productId of batch) {
          try {
            const { data: individualVariants, error: individualError } = await supabase
              .from('lats_product_variants')
              .select('id, product_id, name, sku, cost_price, selling_price, quantity, min_quantity, attributes, created_at, updated_at')
              .eq('product_id', productId)
              .order('name');
              
            if (!individualError && individualVariants) {
              allVariants.push(...individualVariants);
              console.log(`✅ Individual query for product ${productId}: ${individualVariants.length} variants`);
            } else {
              console.error(`❌ Individual query failed for product ${productId}:`, individualError);
            }
          } catch (individualException) {
            console.error(`❌ Exception in individual query for product ${productId}:`, individualException);
          }
        }
      }
    }

    // Group variants by product ID
    const variantsByProductId = new Map<string, any[]>();
    allVariants.forEach(variant => {
      if (!variantsByProductId.has(variant.product_id)) {
        variantsByProductId.set(variant.product_id, []);
      }
      variantsByProductId.get(variant.product_id)!.push(variant);
    });

    // Map products with their variants
    return (products || []).map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
  
      categoryId: product.category_id,
      supplierId: product.supplier_id,
      isActive: product.is_active,
      totalQuantity: product.total_quantity,
      totalValue: product.total_value,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      variants: (variantsByProductId.get(product.id) || []).map((variant: any) => ({
        id: variant.id,
        productId: variant.product_id,
        sku: variant.sku,
        name: variant.name,
        attributes: variant.attributes || {},
        costPrice: variant.cost_price,
        sellingPrice: variant.selling_price,
        quantity: variant.quantity,
        minQuantity: variant.min_quantity,
  
        weight: null, // Column was removed in migration
        dimensions: null, // Column was removed in migration
        createdAt: variant.created_at,
        updatedAt: variant.updated_at
      }))
    }));
  } catch (error) {
    console.error('💥 Exception in getProducts:', error);
    throw error;
  }
}

// Update a product
export async function updateProduct(
  productId: string,
  productData: Partial<CreateProductData>,
  userId: string
): Promise<LatsProduct> {
  try {
    const { images, variants, ...productWithoutImages } = productData;
    
    // Update the product
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .update({
        name: productWithoutImages.name,
        description: productWithoutImages.description,
        category_id: productWithoutImages.categoryId,
        supplier_id: productWithoutImages.supplierId,
        tags: productWithoutImages.tags,
        is_active: productWithoutImages.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (productError) throw productError;

    // Handle variants if provided
    if (variants) {
      // Get existing variants
      const { data: existingVariants, error: fetchError } = await supabase
        .from('lats_product_variants')
        .select('id, sku')
        .eq('product_id', productId);

      if (fetchError) throw fetchError;

      // Process each variant
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const variantData = {
          product_id: productId,
          sku: variant.sku,
          name: variant.name,
          attributes: variant.attributes || {},
          cost_price: variant.costPrice,
          selling_price: variant.sellingPrice,
          quantity: variant.stockQuantity,
          min_quantity: variant.minStockLevel
        };

        // Check if this variant already exists (by SKU)
        const existingVariant = existingVariants?.find(v => v.sku === variant.sku);

        if (existingVariant) {
          // Update existing variant
          const { error: updateError } = await supabase
            .from('lats_product_variants')
            .update(variantData)
            .eq('id', existingVariant.id);

          if (updateError) throw updateError;
        } else {
          // Create new variant
          const { error: insertError } = await supabase
            .from('lats_product_variants')
            .insert(variantData);

          if (insertError) throw insertError;
        }
      }

      // Delete variants that are no longer needed (but keep at least one)
      if (existingVariants && existingVariants.length > variants.length) {
        const variantsToKeep = variants.map(v => v.sku);
        const variantsToDelete = existingVariants
          .filter(v => !variantsToKeep.includes(v.sku))
          .slice(0, existingVariants.length - 1); // Keep at least one variant

        for (const variantToDelete of variantsToDelete) {
          const { error: deleteError } = await supabase
            .from('lats_product_variants')
            .delete()
            .eq('id', variantToDelete.id);

          if (deleteError) throw deleteError;
        }
      }
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
  
      categoryId: product.category_id,
      supplierId: product.supplier_id,
      tags: product.tags,
      isActive: product.is_active,
      isFeatured: product.is_featured,
      isDigital: product.is_digital,
      requiresShipping: product.requires_shipping,
      taxRate: product.tax_rate,
      totalQuantity: product.total_quantity,
      totalValue: product.total_value,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };
  } catch (error) {
    console.error('Error updating product:', error);
    console.error('Product ID:', productId);
    console.error('Product data:', productData);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('lats_products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
}
