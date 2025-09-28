/**
 * Image utilities for LATS module
 */

import { supabase } from '../../../lib/supabaseClient';
import { ImageUrlSanitizer } from '../../../lib/imageUrlSanitizer';

/**
 * Generate a simple SVG placeholder image as a data URL
 */
function generateSimplePlaceholder(text: string = 'Image', width: number = 300, height: number = 300): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#F3F4F6"/>
      <text x="${width / 2}" y="${height / 2}" font-family="Arial, sans-serif" font-size="16" fill="#6B6B6B" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get a reliable fallback image URL
 */
function getFallbackImageUrl(type: 'product' | 'thumbnail' | 'avatar' = 'product', text?: string): string {
  switch (type) {
    case 'thumbnail':
      return generateSimplePlaceholder('Thumbnail', 100, 100);
    case 'avatar':
      return generateSimplePlaceholder(text || 'U', 40, 40);
    case 'product':
    default:
      return generateSimplePlaceholder(text || 'Product Image', 300, 300);
  }
}

/**
 * Check if a URL is a data URL
 */
function isDataUrl(url: string): boolean {
  return url && typeof url === 'string' && url.startsWith('data:');
}

/**
 * Check if a URL is too long
 */
function isUrlTooLong(url: string, maxLength: number = 1500): boolean {
  return url && typeof url === 'string' && url.length > maxLength;
}

/**
 * Process image URLs to prevent header size issues
 * Uses ImageUrlSanitizer to prevent HTTP 431 errors
 */
export function processImageUrl(url: string, alt?: string): string {
  const sanitizedResult = ImageUrlSanitizer.sanitizeImageUrl(url, alt);
  
  if (sanitizedResult.isSanitized) {
    console.warn('🚨 processImageUrl: URL sanitized to prevent 431 error:', {
      method: sanitizedResult.method,
      originalLength: sanitizedResult.originalLength,
      sanitizedLength: sanitizedResult.sanitizedLength
    });
  }
  
  return sanitizedResult.url;
}

/**
 * Process product images to ensure they don't cause header size issues
 */
export function processProductImages(images: any[]): any[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.map(image => {
    if (image && typeof image === 'object') {
      // Process image_url if it exists
      if (image.image_url) {
        image.image_url = processImageUrl(image.image_url, image.file_name);
      }
      
      // Process thumbnail_url if it exists
      if (image.thumbnail_url) {
        image.thumbnail_url = processImageUrl(image.thumbnail_url, image.file_name);
      }

      // Process url if it exists (for UploadedImage format)
      if (image.url) {
        image.url = processImageUrl(image.url, image.fileName);
      }

      // Process thumbnailUrl if it exists (for UploadedImage format)
      if (image.thumbnailUrl) {
        image.thumbnailUrl = processImageUrl(image.thumbnailUrl, image.fileName);
      }
    }
    return image;
  });
}

/**
 * Clean up image data to prevent memory issues
 * Updated with stricter limits to prevent HTTP 431 errors
 */
export function cleanupImageData(imageData: any): any {
  if (!imageData || typeof imageData !== 'object') {
    return imageData;
  }

  // Remove extremely large data URLs (reduced threshold)
  if (imageData.image_url && isDataUrl(imageData.image_url) && imageData.image_url.length > 8000) {
    imageData.image_url = getFallbackImageUrl('product', imageData.file_name);
  }

  if (imageData.thumbnail_url && isDataUrl(imageData.thumbnail_url) && imageData.thumbnail_url.length > 8000) {
    imageData.thumbnail_url = getFallbackImageUrl('product', imageData.file_name);
  }

  // Handle UploadedImage format
  if (imageData.url && isDataUrl(imageData.url) && imageData.url.length > 8000) {
    imageData.url = getFallbackImageUrl('product', imageData.fileName);
  }

  if (imageData.thumbnailUrl && isDataUrl(imageData.thumbnailUrl) && imageData.thumbnailUrl.length > 8000) {
    imageData.thumbnailUrl = getFallbackImageUrl('product', imageData.fileName);
  }

  return imageData;
}

/**
 * Validate image URL before using it
 */
export function validateImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check if URL is too long
  if (isUrlTooLong(url, 1500)) {
    return false;
  }

  // Check if it's a data URL that's too large
  if (isDataUrl(url) && url.length > 8000) {
    return false;
  }

  return true;
}

/**
 * Emergency cleanup for extremely long URLs that might cause HTTP 431 errors
 */
export function emergencyUrlCleanup(url: string): string {
  if (!url || typeof url !== 'string') {
    return getFallbackImageUrl('product');
  }

  // If URL is extremely long, immediately return fallback
  if (url.length > 2000) {
    console.error('Emergency URL cleanup: URL extremely long, using fallback');
    return getFallbackImageUrl('product');
  }

  // If it's a data URL and extremely large, return fallback
  if (isDataUrl(url) && url.length > 10000) {
    console.error('Emergency URL cleanup: Data URL extremely large, using fallback');
    return getFallbackImageUrl('product');
  }

  return url;
}

/**
 * Replace all placeholder images with local SVG placeholders
 * This fixes network errors from external placeholder services
 */
export function replacePlaceholderImages(images: string[]): string[] {
  if (!Array.isArray(images)) return [];
  
  return images.map(imageUrl => {
    // Check if it's a placeholder service URL
    if (isUnreliableUrl(imageUrl)) {
      console.log('🔄 Replacing placeholder image:', imageUrl);
      return generateProductPlaceholder();
    }
    return imageUrl;
  });
}

/**
 * Check if a URL is from an unreliable service
 */
function isUnreliableUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  
  const unreliableDomains = [
    'via.placeholder.com',
    'placehold.it',
    'placehold.co',
    'dummyimage.com',
    'picsum.photos',
    'lorempixel.com',
    'loremflickr.com'
  ];
  
  return unreliableDomains.some(domain => url.toLowerCase().includes(domain));
}

/**
 * Generate a product placeholder image
 */
function generateProductPlaceholder(): string {
  const svg = `
    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F8FAFC"/>
      <text x="200" y="200" font-family="Arial, sans-serif" font-size="16" fill="#64748B" text-anchor="middle" dy=".3em">Product Image</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
