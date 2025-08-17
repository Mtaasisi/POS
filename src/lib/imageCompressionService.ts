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
   * Generate multiple compressed versions of an image
   */
  static async generateMultipleSizes(
    file: File,
    sizes: Array<{ width: number; height: number; quality?: number }>
  ): Promise<Array<CompressedImage & { sizeName: string }>> {
    const results: Array<CompressedImage & { sizeName: string }> = [];

    for (const size of sizes) {
      try {
        const compressed = await this.compressImage(file, {
          maxWidth: size.width,
          maxHeight: size.height,
          quality: size.quality || 0.8
        });

        results.push({
          ...compressed,
          sizeName: `${size.width}x${size.height}`
        });
      } catch (error) {
        console.error(`Failed to generate ${size.width}x${size.height} version:`, error);
      }
    }

    return results;
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
   * Get MIME type for image format
   */
  private static getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'png':
        return 'image/png';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Get file extension for image format
   */
  private static getFileExtension(format: string): string {
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return 'jpg';
      case 'webp':
        return 'webp';
      case 'png':
        return 'png';
      default:
        return 'jpg';
    }
  }

  /**
   * Check if WebP is supported in the browser
   */
  static isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }

  /**
   * Get optimal format based on browser support and file type
   */
  static getOptimalFormat(originalFormat: string): string {
    // If WebP is supported and original is not SVG, use WebP for better compression
    if (this.isWebPSupported() && originalFormat !== 'image/svg+xml') {
      return 'webp';
    }
    
    // Fallback to JPEG for photos, PNG for graphics
    if (originalFormat === 'image/png' || originalFormat === 'image/gif') {
      return 'png';
    }
    
    return 'jpeg';
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
