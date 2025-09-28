/**
 * Utility functions for handling product variants
 * Automatically creates default variants for products without variants
 */

import { supabase } from '../../../lib/supabaseClient';

export interface DefaultVariantData {
  product_id: string;
  sku: string;
  name: string;
  cost_price: number;
  price: number;
  quantity: number;
  min_quantity: number;
  attributes?: Record<string, any>;
  barcode?: string;
  weight?: number;
  dimensions?: Record<string, any>;
}

/**
 * Creates a default variant for a product
 */
export function createDefaultVariantData(
  productId: string,
  productName: string,
  baseData?: {
    costPrice?: number;
    sellingPrice?: number;
    quantity?: number;
    minQuantity?: number;
    sku?: string;
    attributes?: Record<string, any>;
  }
): DefaultVariantData {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const productNameSlug = productName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .slice(0, 10);

  // Generate a unique SKU for the variant
  // Use the provided SKU if available, otherwise generate a unique one
  const variantSku = baseData?.sku || `${productNameSlug}-VAR-${timestamp}-${randomSuffix}`;

  return {
    product_id: productId,
    sku: variantSku,
    name: 'Default',
    cost_price: baseData?.costPrice || 0,
    selling_price: baseData?.sellingPrice || 0,
    quantity: baseData?.quantity || 0,
    min_quantity: baseData?.minQuantity || 0,
    attributes: baseData?.attributes || {},
    barcode: null,
    weight: null,
    dimensions: null
  };
}

/**
 * Ensures a product has at least one variant by creating a default one if needed
 */
export async function ensureProductHasVariants(
  productId: string,
  productName: string,
  baseData?: {
    costPrice?: number;
    sellingPrice?: number;
    quantity?: number;
    minQuantity?: number;
    sku?: string;
    attributes?: Record<string, any>;
  }
): Promise<{ success: boolean; variantId?: string; error?: string }> {
  try {
    // Check if product already has variants
    const { data: existingVariants, error: checkError } = await supabase
      .from('lats_product_variants')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing variants:', checkError);
      return { success: false, error: checkError.message };
    }

    // If product already has variants, no need to create default
    if (existingVariants && existingVariants.length > 0) {
      return { success: true, variantId: existingVariants[0].id };
    }

    // Create default variant
    const defaultVariantData = createDefaultVariantData(productId, productName, baseData);
    
    const { data: newVariant, error: insertError } = await supabase
      .from('lats_product_variants')
      .insert([defaultVariantData])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating default variant:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`✅ Created default variant for product: ${productName} (ID: ${newVariant.id})`);
    return { success: true, variantId: newVariant.id };

  } catch (error) {
    console.error('Unexpected error in ensureProductHasVariants:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Batch process to ensure all products have variants
 */
export async function ensureAllProductsHaveVariants(): Promise<{
  success: boolean;
  processed: number;
  created: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let created = 0;

  try {
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name')
      .eq('is_active', true);

    if (productsError) {
      return { success: false, processed: 0, created: 0, errors: [productsError.message] };
    }

    // Get all product IDs that have variants
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('product_id');

    if (variantsError) {
      return { success: false, processed: 0, created: 0, errors: [variantsError.message] };
    }

    const productIdsWithVariants = new Set(variants.map(v => v.product_id));
    const productsWithoutVariants = products.filter(p => !productIdsWithVariants.has(p.id));

    console.log(`📊 Found ${productsWithoutVariants.length} products without variants`);

    // Process each product without variants
    for (const product of productsWithoutVariants) {
      processed++;
      
      const result = await ensureProductHasVariants(product.id, product.name);
      
      if (result.success) {
        created++;
      } else {
        errors.push(`Product "${product.name}": ${result.error}`);
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: errors.length === 0,
      processed,
      created,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, processed, created, errors: [errorMessage] };
  }
}

/**
 * Validates that a product has variants and creates default if needed
 * This is the main function to call after product creation
 */
export async function validateAndCreateDefaultVariant(
  productId: string,
  productName: string,
  productData?: {
    costPrice?: number;
    sellingPrice?: number;
    quantity?: number;
    minQuantity?: number;
    sku?: string;
    attributes?: Record<string, any>;
  }
): Promise<{ success: boolean; variantId?: string; error?: string }> {
  console.log(`🔍 Validating variants for product: ${productName} (ID: ${productId})`);
  
  const result = await ensureProductHasVariants(productId, productName, productData);
  
  if (result.success) {
    console.log(`✅ Product "${productName}" has variants`);
  } else {
    console.error(`❌ Failed to ensure variants for product "${productName}":`, result.error);
  }
  
  return result;
}
