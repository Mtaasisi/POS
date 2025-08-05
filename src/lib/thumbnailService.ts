import { supabase } from './supabaseClient';

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

export interface ThumbnailResult {
  originalUrl: string;
  thumbnailUrl: string;
  thumbnailPath: string;
  width: number;
  height: number;
  fileSize: number;
}

// Default thumbnail options
const DEFAULT_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  width: 300,
  height: 300,
  quality: 80,
  format: 'webp'
};

// Create a thumbnail from an image file
export async function createThumbnail(
  file: File,
  options: Partial<ThumbnailOptions> = {}
): Promise<ThumbnailResult> {
  const opts = { ...DEFAULT_THUMBNAIL_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate aspect ratio to maintain proportions
      const aspectRatio = img.width / img.height;
      let newWidth = opts.width;
      let newHeight = opts.height;
      
      if (aspectRatio > 1) {
        // Landscape image
        newHeight = opts.width / aspectRatio;
      } else {
        // Portrait image
        newWidth = opts.height * aspectRatio;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw the resized image
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve({
              originalUrl: URL.createObjectURL(file),
              thumbnailUrl,
              thumbnailPath: '', // Will be set when uploaded
              width: newWidth,
              height: newHeight,
              fileSize: blob.size
            });
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        `image/${opts.format}`,
        opts.quality / 100
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Upload both original and thumbnail images
export async function uploadProductImageWithThumbnail(
  productId: string,
  file: File,
  userId: string,
  isPrimary: boolean = false,
  thumbnailOptions?: Partial<ThumbnailOptions>
): Promise<{
  originalImage: any;
  thumbnailImage: any;
}> {
  try {
    // Create thumbnail
    const thumbnailResult = await createThumbnail(file, thumbnailOptions);
    
    // Upload original image
    const originalPath = `${productId}/originals/${Date.now()}_${file.name}`;
    const { data: originalData, error: originalError } = await supabase.storage
      .from('product-images')
      .upload(originalPath, file);
    
    if (originalError) throw originalError;
    
    // Convert thumbnail blob to file
    const thumbnailBlob = await fetch(thumbnailResult.thumbnailUrl).then(r => r.blob());
    const thumbnailFile = new File([thumbnailBlob], `thumb_${file.name}`, {
      type: `image/${thumbnailOptions?.format || 'webp'}`
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
    
    // Insert into database
    const { data: imageRecord, error: dbError } = await supabase.from('product_images').insert({
      product_id: productId,
      image_url: originalUrl,
      thumbnail_url: thumbnailUrl,
      file_name: file.name,
      file_size: file.size,
      is_primary: isPrimary,
      uploaded_by: userId,
    }).select().single();
    
    if (dbError) throw dbError;
    
    // Clean up object URLs
    URL.revokeObjectURL(thumbnailResult.originalUrl);
    URL.revokeObjectURL(thumbnailResult.thumbnailUrl);
    
    return {
      originalImage: imageRecord,
      thumbnailImage: {
        ...imageRecord,
        image_url: thumbnailUrl
      }
    };
  } catch (error) {
    console.error('Error uploading image with thumbnail:', error);
    throw error;
  }
}

// Generate multiple thumbnail sizes
export async function generateMultipleThumbnails(
  file: File,
  sizes: Array<{ width: number; height: number; suffix: string }> = [
    { width: 150, height: 150, suffix: 'small' },
    { width: 300, height: 300, suffix: 'medium' },
    { width: 600, height: 600, suffix: 'large' }
  ]
): Promise<Record<string, ThumbnailResult>> {
  const results: Record<string, ThumbnailResult> = {};
  
  for (const size of sizes) {
    const thumbnail = await createThumbnail(file, {
      width: size.width,
      height: size.height,
      quality: 85,
      format: 'webp'
    });
    
    results[size.suffix] = thumbnail;
  }
  
  return results;
}

// Optimize image for web display
export async function optimizeImageForWeb(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw the optimized image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/webp'
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        },
        'image/webp',
        quality / 100
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Get responsive image URLs for different screen sizes
export function getResponsiveImageUrls(
  originalUrl: string,
  thumbnailUrl: string,
  sizes: string[] = ['150px', '300px', '600px', '1200px']
): string {
  return sizes.map(size => `${thumbnailUrl} ${size}`).join(', ');
}

// Validate image file
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Please upload an image smaller than 5MB.' };
  }
  
  return { isValid: true };
}

// Preload image for better performance
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to preload image'));
    img.src = url;
  });
}

// Get image dimensions
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to get image dimensions'));
    img.src = URL.createObjectURL(file);
  });
} 