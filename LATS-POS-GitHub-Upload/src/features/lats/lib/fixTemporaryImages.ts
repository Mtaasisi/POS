import { supabase } from '../../../lib/supabaseClient';

/**
 * Fix temporary images that aren't properly linked to products
 * This utility helps resolve the issue where images are uploaded to temp-product folders
 * but not properly linked in the database
 */
export class TemporaryImageFixer {
  
  /**
   * Find and fix all temporary images for a specific product
   */
  static async fixProductImages(productId: string): Promise<{ success: boolean; message: string; fixedCount: number }> {
    try {
      console.log('🔧 Fixing temporary images for product:', productId);
      
      // Step 1: Check if product exists
      const { data: product, error: productError } = await supabase
        .from('lats_products')
        .select('id, name')
        .eq('id', productId)
        .single();
      
      if (productError || !product) {
        return { success: false, message: 'Product not found', fixedCount: 0 };
      }
      
      console.log('✅ Found product:', product.name);
      
      // Step 2: List all files in the product-images bucket
      const { data: files, error: listError } = await supabase.storage
        .from('product-images')
        .list('', {
          limit: 1000,
          offset: 0
        });
      
      if (listError) {
        console.error('❌ Failed to list storage files:', listError);
        return { success: false, message: 'Failed to list storage files', fixedCount: 0 };
      }
      
      console.log('📁 Found', files.length, 'files in storage');
      
      // Step 3: Find files that might belong to this product
      const potentialFiles = files.filter(file => {
        // Look for files in temp-product folders that might match this product
        // or files with timestamps that could be related
        return file.name.includes('temp-product-') || 
               file.name.includes(productId) ||
               file.name.match(/^\d{13}_/); // Files starting with timestamp
      });
      
      console.log('🔍 Found', potentialFiles.length, 'potential files for this product');
      
      let fixedCount = 0;
      
      // Step 4: Process each potential file
      for (const file of potentialFiles) {
        try {
          // Get the public URL for this file
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(file.name);
          
          // Check if this image is already in the database
          const { data: existingImage } = await supabase
            .from('product_images')
            .select('id')
            .eq('image_url', urlData.publicUrl)
            .single();
          
          if (existingImage) {
            console.log('📝 Image already exists in database:', file.name);
            continue;
          }
          
          // Check if we have any images for this product
          const { data: productImages } = await supabase
            .from('product_images')
            .select('id, is_primary')
            .eq('product_id', productId);
          
          const isPrimary = !productImages || productImages.length === 0;
          
          // Insert the image record
          const { data: newImage, error: insertError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              image_url: urlData.publicUrl,
              thumbnail_url: urlData.publicUrl, // Use same URL for thumbnail for now
              file_name: file.name,
              file_size: file.metadata?.size || 0,
              is_primary: isPrimary,
              uploaded_by: null // We don't know who uploaded it
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ Failed to insert image record:', insertError);
            continue;
          }
          
          console.log('✅ Fixed image:', file.name, '->', newImage.id);
          fixedCount++;
          
        } catch (fileError) {
          console.error('❌ Error processing file:', file.name, fileError);
        }
      }
      
      const message = fixedCount > 0 
        ? `Successfully fixed ${fixedCount} images for product "${product.name}"`
        : `No images found to fix for product "${product.name}"`;
      
      return { success: true, message, fixedCount };
      
    } catch (error) {
      console.error('❌ Error fixing temporary images:', error);
      return { success: false, message: 'Failed to fix temporary images', fixedCount: 0 };
    }
  }
  
  /**
   * Fix all temporary images in the system
   */
  static async fixAllTemporaryImages(): Promise<{ success: boolean; message: string; results: any[] }> {
    try {
      console.log('🔧 Fixing all temporary images in the system...');
      
      // Get all products
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select('id, name');
      
      if (productsError) {
        return { success: false, message: 'Failed to get products', results: [] };
      }
      
      console.log('📦 Found', products.length, 'products to check');
      
      const results = [];
      
      // Process each product
      for (const product of products) {
        try {
          const result = await this.fixProductImages(product.id);
          results.push({
            productId: product.id,
            productName: product.name,
            ...result
          });
          
          // Add a small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('❌ Error processing product:', product.name, error);
          results.push({
            productId: product.id,
            productName: product.name,
            success: false,
            message: 'Error processing product',
            fixedCount: 0
          });
        }
      }
      
      const totalFixed = results.reduce((sum, r) => sum + r.fixedCount, 0);
      const successfulProducts = results.filter(r => r.success).length;
      
      const message = `Processed ${products.length} products. Fixed ${totalFixed} images across ${successfulProducts} products.`;
      
      return { success: true, message, results };
      
    } catch (error) {
      console.error('❌ Error fixing all temporary images:', error);
      return { success: false, message: 'Failed to fix all temporary images', results: [] };
    }
  }
  
  /**
   * Find orphaned temporary images (not linked to any product)
   */
  static async findOrphanedImages(): Promise<{ success: boolean; message: string; orphanedFiles: string[] }> {
    try {
      console.log('🔍 Finding orphaned temporary images...');
      
      // List all files in storage
      const { data: files, error: listError } = await supabase.storage
        .from('product-images')
        .list('', {
          limit: 1000,
          offset: 0
        });
      
      if (listError) {
        return { success: false, message: 'Failed to list storage files', orphanedFiles: [] };
      }
      
      // Get all image URLs from database
      const { data: dbImages, error: dbError } = await supabase
        .from('product_images')
        .select('image_url');
      
      if (dbError) {
        return { success: false, message: 'Failed to get database images', orphanedFiles: [] };
      }
      
      const dbUrls = new Set(dbImages.map(img => img.image_url));
      const orphanedFiles = [];
      
      // Check each file
      for (const file of files) {
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(file.name);
        
        if (!dbUrls.has(urlData.publicUrl)) {
          orphanedFiles.push(file.name);
        }
      }
      
      const message = `Found ${orphanedFiles.length} orphaned files out of ${files.length} total files`;
      
      return { success: true, message, orphanedFiles };
      
    } catch (error) {
      console.error('❌ Error finding orphaned images:', error);
      return { success: false, message: 'Failed to find orphaned images', orphanedFiles: [] };
    }
  }
}

// Export a simple function for easy use
export async function fixTemporaryImages(productId?: string) {
  if (productId) {
    return await TemporaryImageFixer.fixProductImages(productId);
  } else {
    return await TemporaryImageFixer.fixAllTemporaryImages();
  }
}
