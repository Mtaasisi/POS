import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { ImageUploadService } from './imageUpload';

// Use the main supabase client instead of creating a separate one
// This ensures consistent configuration and avoids conflicts

export interface LatsProduct {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  images?: string[];
  tags?: string[];
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  taxRate: number;
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
  maxQuantity?: number;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  requiresShipping?: boolean;
  taxRate?: number;
  variants: Array<{
    sku: string;
    name: string;
    barcode?: string;
    sellingPrice: number;
    costPrice: number;
    quantity: number;
    minQuantity: number;
    maxQuantity?: number;
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
    attributes?: Record<string, any>;
    isActive?: boolean;
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
      tags: productWithoutImages.tags || [],
      is_active: productWithoutImages.isActive ?? true,
      total_quantity: 0,
      total_value: 0
    };
    
    // Only add brand_id and supplier_id if they have valid values
    if (productWithoutImages.brandId) {
      productInsertData.brand_id = productWithoutImages.brandId;
    }
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
    const variants = productWithoutImages.variants.map(variant => ({
      product_id: product.id,
      sku: variant.sku,
      name: variant.name,
      attributes: variant.attributes || {},
      cost_price: variant.costPrice ?? 0,
      selling_price: (variant.sellingPrice ?? variant.price) ?? 0,
      quantity: (variant.quantity ?? variant.stockQuantity) ?? 0,
      min_quantity: (variant.minQuantity ?? variant.minStockLevel) ?? 0,
      max_quantity: (variant.maxQuantity ?? variant.maxStockLevel) ?? null,
      barcode: variant.barcode,
      weight: variant.weight,
      dimensions: variant.dimensions
    }));

    const { error: variantsError } = await supabase
      .from('lats_product_variants')
      .insert(variants);

    if (variantsError) {
      console.error('Variants creation error:', variantsError);
      console.error('Variants data being inserted:', variants);
      throw variantsError;
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
      barcode: productWithoutImages.barcode,
      categoryId: product.category_id,
      brandId: product.brand_id,
      supplierId: product.supplier_id,
      tags: product.tags,
      isActive: product.is_active,
      isFeatured: productWithoutImages.isFeatured ?? false,
      isDigital: productWithoutImages.isDigital ?? false,
      requiresShipping: productWithoutImages.requiresShipping ?? true,
      taxRate: productWithoutImages.taxRate ?? 0,
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
      lats_brands(name),
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
    barcode: product.barcode,
    categoryId: product.category_id,
    brandId: product.brand_id,
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
    updatedAt: product.updated_at,
    images
  };
}

// Get all products
export async function getProducts(): Promise<LatsProduct[]> {
  const { data, error } = await supabase
    .from('lats_products')
    .select(`
      *,
      lats_categories(name),
      lats_brands(name),
      lats_suppliers(name),
      lats_product_variants(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }

  return (data || []).map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,
    barcode: product.barcode,
    categoryId: product.category_id,
    brandId: product.brand_id,
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
    updatedAt: product.updated_at,
    variants: product.lats_product_variants?.map((variant: any) => ({
      id: variant.id,
      productId: variant.product_id,
      sku: variant.sku,
      name: variant.name,
      attributes: variant.attributes || {},
      costPrice: variant.cost_price,
      sellingPrice: variant.selling_price,
      quantity: variant.quantity,
      minQuantity: variant.min_quantity,
      maxQuantity: variant.max_quantity,
      barcode: variant.barcode,
      weight: variant.weight,
      dimensions: variant.dimensions,
      createdAt: variant.created_at,
      updatedAt: variant.updated_at
    })) || []
  }));
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
        brand_id: productWithoutImages.brandId,
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
          min_quantity: variant.minStockLevel,
          max_quantity: variant.maxStockLevel,
          barcode: variant.barcode,
          weight: variant.weight,
          dimensions: variant.dimensions
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
      barcode: product.barcode,
      categoryId: product.category_id,
      brandId: product.brand_id,
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
