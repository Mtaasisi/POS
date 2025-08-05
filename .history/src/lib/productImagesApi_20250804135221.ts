import { supabase } from './supabaseClient';
import { createThumbnail, optimizeImageForWeb } from './thumbnailService';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
  is_primary: boolean;
  uploaded_by: string;
  created_at: string;
}

// Upload a product image to Supabase Storage and create a product_images record
export async function uploadProductImage(
  productId: string, 
  file: File, 
  userId: string, 
  isPrimary: boolean = false
): Promise<ProductImage> {
  try {
    // Optimize the image for web
    const optimizedFile = await optimizeImageForWeb(file);
    
    // Create thumbnail
    const thumbnailResult = await createThumbnail(optimizedFile, {
      width: 300,
      height: 300,
      quality: 85,
      format: 'webp'
    });
    
    // Upload original optimized image
    const originalPath = `${productId}/originals/${Date.now()}_${file.name}`;
    const { data: originalData, error: originalError } = await supabase.storage
      .from('product-images')
      .upload(originalPath, optimizedFile);
    
    if (originalError) throw originalError;
    
    // Convert thumbnail blob to file
    const thumbnailBlob = await fetch(thumbnailResult.thumbnailUrl).then(r => r.blob());
    const thumbnailFile = new File([thumbnailBlob], `thumb_${file.name}`, {
      type: 'image/webp'
    });
    
    // Upload thumbnail
    const thumbnailPath = `${productId}/thumbnails/${Date.now()}_thumb_${file.name}`;
    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
      .from('product-images')
      .upload(thumbnailPath, thumbnailFile);
    
    if (thumbnailError) throw thumbnailError;
    
    // Get public URLs
    const originalUrl = supabase.storage.from('product-images').getPublicUrl(originalPath).data.publicUrl;
    const thumbnailUrl = supabase.storage.from('product-images').getPublicUrl(thumbnailPath).data.publicUrl;
    
    // Insert metadata into product_images table
    const { data: row, error: rowError } = await supabase.from('product_images').insert({
      product_id: productId,
      image_url: originalUrl,
      thumbnail_url: thumbnailUrl,
      file_name: file.name,
      file_size: optimizedFile.size,
      is_primary: isPrimary,
      uploaded_by: userId,
    }).select().single();
    
    if (rowError) throw rowError;
    
    // Clean up object URLs
    URL.revokeObjectURL(thumbnailResult.originalUrl);
    URL.revokeObjectURL(thumbnailResult.thumbnailUrl);
    
    return row;
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }
}

// List images for a product
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Set primary image for a product
export async function setPrimaryImage(productId: string, imageId: string): Promise<void> {
  // First, unset all primary images for this product
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId);

  // Then set the selected image as primary
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);
  
  if (error) throw error;
}

// Delete a product image
export async function deleteProductImage(imageId: string, imageUrl: string): Promise<void> {
  // Extract file path from URL
  const urlParts = imageUrl.split('/');
  const filePath = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');
  
  // Delete from storage
  await supabase.storage.from('product-images').remove([filePath]);
  
  // Delete from database
  await supabase.from('product_images').delete().eq('id', imageId);
}

// Get primary image for a product
export async function getPrimaryImage(productId: string): Promise<ProductImage | null> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .eq('is_primary', true)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data;
} 