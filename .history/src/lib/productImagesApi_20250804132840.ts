import { supabase } from './supabaseClient';

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
  const filePath = `${productId}/${Date.now()}_${file.name}`;
  
  // Upload original image
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);
  if (error) throw error;

  const publicUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;

  // Create thumbnail (we'll handle this in the frontend for now)
  const thumbnailPath = `${productId}/thumbnails/${Date.now()}_thumb_${file.name}`;
  
  // Insert metadata into product_images table
  const { data: row, error: rowError } = await supabase.from('product_images').insert({
    product_id: productId,
    image_url: publicUrl,
    thumbnail_url: publicUrl, // For now, use same URL, we'll optimize later
    file_name: file.name,
    file_size: file.size,
    is_primary: isPrimary,
    uploaded_by: userId,
  }).select().single();
  
  if (rowError) throw rowError;
  return row;
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