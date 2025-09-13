import { supabase } from './supabaseClient';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  size: number;
  format: string;
  compressionRatio: number; // Original size / compressed size
}

export class ImageCompressionService {
  private static readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.8,
    format: 'webp',
    maintainAspectRatio: true
  };

  // Recommended thumbnail specifications
  private static readonly THUMBNAIL_SPECS = {
    SMALL: { width: 150, height: 150, quality: 0.85, maxSizeKB: 50 },
    MEDIUM: { width: 200, height: 200, quality: 0.8, maxSizeKB: 80 },
    LARGE: { width: 300, height: 300, quality: 0.75, maxSizeKB: 120 }
  };

  /**
   * Compress an image file for thumbnail generation
   */
  static async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressedImage> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            opts.maxWidth!,
            opts.maxHeight!,
            opts.maintainAspectRatio!
          );

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw the resized image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          const mimeType = this.getMimeType(opts.format!);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressionRatio = file.size / blob.size;
                resolve({
                  blob,
                  width,
                  height,
                  size: blob.size,
                  format: opts.format!,
                  compressionRatio
                });
              } else {
                reject(new Error('Failed to create compressed image'));
              }
            },
            mimeType,
            opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate optimal product thumbnail according to recommended specifications
   * - Square ratio (1:1)
   * - 150x150 to 200x200 pixels
   * - Under 50KB file size
   * - WebP format (with JPEG fallback)
   */
  static async generateOptimalThumbnail(
    file: File,
    targetSize: 'SMALL' | 'MEDIUM' | 'LARGE' = 'SMALL'
  ): Promise<CompressedImage> {
    const specs = this.THUMBNAIL_SPECS[targetSize];
    
    // Try WebP first (best compression)
    try {
      const webpResult = await this.compressImage(file, {
        maxWidth: specs.width,
        maxHeight: specs.height,
        quality: specs.quality,
        format: 'webp',
        maintainAspectRatio: false // Force square ratio
      });

      // Check if file size is within limits
      if (webpResult.size <= specs.maxSizeKB * 1024) {
        console.log(`✅ Optimal ${targetSize} thumbnail generated (WebP):`, {
          size: `${(webpResult.size / 1024).toFixed(1)}KB`,
          dimensions: `${webpResult.width}x${webpResult.height}`,
          compressionRatio: webpResult.compressionRatio.toFixed(2)
        });
        return webpResult;
      }

      // If too large, reduce quality and try again
      const reducedQuality = Math.max(0.5, specs.quality - 0.1);
      const reducedResult = await this.compressImage(file, {
        maxWidth: specs.width,
        maxHeight: specs.height,
        quality: reducedQuality,
        format: 'webp',
        maintainAspectRatio: false
      });

      if (reducedResult.size <= specs.maxSizeKB * 1024) {
        console.log(`✅ Optimal ${targetSize} thumbnail generated (WebP, reduced quality):`, {
          size: `${(reducedResult.size / 1024).toFixed(1)}KB`,
          dimensions: `${reducedResult.width}x${reducedResult.height}`,
          compressionRatio: reducedResult.compressionRatio.toFixed(2)
        });
        return reducedResult;
      }

    } catch (webpError) {
      console.warn('⚠️ WebP generation failed, falling back to JPEG:', webpError);
    }

    // Fallback to JPEG if WebP fails or is too large
    try {
      const jpegResult = await this.compressImage(file, {
        maxWidth: specs.width,
        maxHeight: specs.height,
        quality: specs.quality,
        format: 'jpeg',
        maintainAspectRatio: false
      });

      // If still too large, reduce quality further
      if (jpegResult.size > specs.maxSizeKB * 1024) {
        const finalQuality = Math.max(0.4, specs.quality - 0.2);
        const finalResult = await this.compressImage(file, {
          maxWidth: specs.width,
          maxHeight: specs.height,
          quality: finalQuality,
          format: 'jpeg',
          maintainAspectRatio: false
        });

        console.log(`✅ Optimal ${targetSize} thumbnail generated (JPEG, reduced quality):`, {
          size: `${(finalResult.size / 1024).toFixed(1)}KB`,
          dimensions: `${finalResult.width}x${finalResult.height}`,
          compressionRatio: finalResult.compressionRatio.toFixed(2)
        });
        return finalResult;
      }

      console.log(`✅ Optimal ${targetSize} thumbnail generated (JPEG):`, {
        size: `${(jpegResult.size / 1024).toFixed(1)}KB`,
        dimensions: `${jpegResult.width}x${jpegResult.height}`,
        compressionRatio: jpegResult.compressionRatio.toFixed(2)
      });
      return jpegResult;

    } catch (jpegError) {
      console.error('❌ JPEG fallback also failed:', jpegError);
      throw new Error('Failed to generate optimal thumbnail in any format');
    }
  }

  /**
   * Generate multiple thumbnail sizes for different use cases
   */
  static async generateThumbnailSet(file: File): Promise<{
    small: CompressedImage;
    medium: CompressedImage;
    large: CompressedImage;
  }> {
    const [small, medium, large] = await Promise.all([
      this.generateOptimalThumbnail(file, 'SMALL'),
      this.generateOptimalThumbnail(file, 'MEDIUM'),
      this.generateOptimalThumbnail(file, 'LARGE')
    ]);

    return { small, medium, large };
  }

  /**
   * Upload compressed thumbnail to storage
   */
  static async uploadCompressedThumbnail(
    compressedImage: CompressedImage,
    productId: string,
    originalFileName: string,
    bucket: string = 'product-images'
  ): Promise<string | null> {
    try {
      // Generate thumbnail filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = this.getFileExtension(compressedImage.format);
      const thumbnailFileName = `thumb_${timestamp}_${randomId}.${extension}`;
      const thumbnailPath = `${productId}/thumbnails/${thumbnailFileName}`;

      console.log('📤 Uploading compressed thumbnail:', {
        originalFile: originalFileName,
        thumbnailFile: thumbnailFileName,
        originalSize: compressedImage.size,
        compressionRatio: compressedImage.compressionRatio.toFixed(2),
        format: compressedImage.format
      });

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(thumbnailPath, compressedImage.blob, {
          cacheControl: '31536000', // 1 year cache for thumbnails
          upsert: false,
          contentType: this.getMimeType(compressedImage.format)
        });

      if (error) {
        console.error('❌ Thumbnail upload failed:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(thumbnailPath);

      console.log('✅ Compressed thumbnail uploaded successfully:', {
        url: urlData.publicUrl,
        size: compressedImage.size,
        compressionRatio: compressedImage.compressionRatio.toFixed(2)
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Thumbnail upload error:', error);
      return null;
    }
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    let width = maxWidth;
    let height = maxHeight;

    if (aspectRatio > 1) {
      // Landscape image
      height = width / aspectRatio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      // Portrait image
      width = height * aspectRatio;
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Get optimal format for a given file type
   */
  static getOptimalFormat(fileType: string): 'webp' | 'jpeg' | 'png' {
    // Check if WebP is supported
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 1;
      canvas.height = 1;
      const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
      
      if (webpSupported) {
        return 'webp';
      }
    }
    
    // Fallback based on original format
    if (fileType.includes('png') || fileType.includes('transparent')) {
      return 'png';
    }
    
    return 'jpeg';
  }

  /**
   * Check if browser supports WebP format
   */
  static isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').startsWith('data:image/webp');
    }
    return false;
  }

  /**
   * Get file extension for a format
   */
  static getFileExtension(format: string): string {
    switch (format.toLowerCase()) {
      case 'webp': return 'webp';
      case 'jpeg':
      case 'jpg': return 'jpg';
      case 'png': return 'png';
      default: return 'jpg';
    }
  }

  /**
   * Get MIME type for a format
   */
  static getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'webp': return 'image/webp';
      case 'jpeg':
      case 'jpg': return 'image/jpeg';
      case 'png': return 'image/png';
      default: return 'image/jpeg';
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${size} ${sizes[i]}`;
  }

  /**
   * Get compression statistics
   */
  static getCompressionStats(originalSize: number, compressedSize: number) {
    const savings = originalSize - compressedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
    
    return {
      originalSize: this.formatFileSize(originalSize),
      compressedSize: this.formatFileSize(compressedSize),
      savings: this.formatFileSize(savings),
      savingsPercent,
      compressionRatio: (originalSize / compressedSize).toFixed(2)
    };
  }
}
