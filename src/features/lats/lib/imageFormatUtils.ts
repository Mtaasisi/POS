// Image Format Utilities for LATS Inventory System

export interface ImageFormatInfo {
  format: string;
  mimeType: string;
  extension: string;
  description: string;
  benefits: string[];
  maxSize: number;
  supported: boolean;
}

/**
 * Get information about supported image formats
 */
export const getSupportedImageFormats = (): ImageFormatInfo[] => [
  {
    format: 'WebP',
    mimeType: 'image/webp',
    extension: '.webp',
    description: 'Modern image format with excellent compression',
    benefits: [
      'Better compression than JPEG and PNG',
      'Supports both lossy and lossless compression',
      'Transparency support like PNG',
      'Smaller file sizes for faster loading',
      'Excellent quality-to-size ratio'
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    supported: true
  },
  {
    format: 'JPEG',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    description: 'Standard image format for photographs',
    benefits: [
      'Widely supported across all devices',
      'Good compression for photographs',
      'Small file sizes',
      'Fast loading times'
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    supported: true
  },
  {
    format: 'PNG',
    mimeType: 'image/png',
    extension: '.png',
    description: 'Lossless format with transparency support',
    benefits: [
      'Lossless compression',
      'Transparency support',
      'Good for graphics and logos',
      'High quality preservation'
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    supported: true
  }
];

/**
 * Get the recommended format for different use cases
 */
export const getRecommendedFormat = (useCase: 'product' | 'logo' | 'photo' | 'graphic'): string => {
  switch (useCase) {
    case 'product':
      return 'WebP'; // Best compression and quality for product images
    case 'logo':
      return 'PNG'; // Transparency support for logos
    case 'photo':
      return 'WebP'; // Better compression than JPEG
    case 'graphic':
      return 'PNG'; // Lossless for graphics
    default:
      return 'WebP';
  }
};

/**
 * Check if a file is a WebP image
 */
export const isWebPImage = (file: File): boolean => {
  return file.type === 'image/webp';
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Supported: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}` 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${formatFileSize(maxSize)}` 
    };
  }
  
  return { valid: true };
};

/**
 * Get format-specific tips
 */
export const getFormatTips = (): string[] => [
  '💡 WebP format provides the best compression and quality',
  '📱 WebP images load faster on mobile devices',
  '🎨 PNG is best for images with transparency',
  '📸 JPEG is good for photographs but WebP is better',
  '⚡ Smaller file sizes mean faster page loading',
  '🌐 WebP is supported by all modern browsers'
];

/**
 * Convert file to WebP format (if supported by browser)
 */
export const convertToWebP = async (file: File): Promise<File | null> => {
  // Check if WebP conversion is supported
  if (!window.createImageBitmap) {
    console.warn('WebP conversion not supported in this browser');
    return null;
  }
  
  try {
    // Create a canvas to convert the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.warn('Canvas 2D context not available');
      return null;
    }
    
    // Create image bitmap from file
    const bitmap = await createImageBitmap(file);
    
    // Set canvas dimensions
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    
    // Draw image to canvas
    ctx.drawImage(bitmap, 0, 0);
    
    // Convert to WebP blob
    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert to WebP'));
        }
      }, 'image/webp', 0.8); // 80% quality
    });
    
    // Create new file with WebP extension
    const fileName = file.name.replace(/\.[^/.]+$/, '.webp');
    return new File([webpBlob], fileName, { type: 'image/webp' });
    
  } catch (error) {
    console.error('Error converting to WebP:', error);
    return null;
  }
};
