/**
 * Image URL Sanitizer Service
 * 
 * This service prevents HTTP 431 "Request Header Fields Too Large" errors
 * by ensuring Base64 image data is never included in URLs.
 * 
 * The 431 error occurs when HTTP headers (including the URL) exceed server limits.
 * Base64 encoded images can easily exceed these limits when included in URLs.
 */

export interface SanitizedImageResult {
  url: string;
  isSanitized: boolean;
  originalLength: number;
  sanitizedLength: number;
  method: 'fallback' | 'compressed' | 'original' | 'placeholder';
}

export class ImageUrlSanitizer {
  // Maximum safe URL length to prevent 431 errors
  private static readonly MAX_SAFE_URL_LENGTH = 1500;
  
  // Maximum safe Base64 data URL length
  private static readonly MAX_SAFE_DATA_URL_LENGTH = 5000;
  
  // Maximum safe Base64 data in URL path
  private static readonly MAX_SAFE_BASE64_IN_PATH = 500;

  /**
   * Sanitize an image URL to prevent 431 errors
   */
  static sanitizeImageUrl(url: string, alt?: string): SanitizedImageResult {
    if (!url || typeof url !== 'string') {
      return this.createFallbackResult(0, 'fallback');
    }

    const originalLength = url.length;
    
    // Check if URL is too long for HTTP headers
    if (originalLength > this.MAX_SAFE_URL_LENGTH) {
      console.warn('🚨 Image URL too long, using fallback to prevent 431 error:', {
        originalLength,
        maxSafeLength: this.MAX_SAFE_URL_LENGTH,
        urlPreview: url.substring(0, 100) + '...'
      });
      return this.createFallbackResult(originalLength, 'fallback');
    }

    // Check if it's a data URL that might be too large
    if (url.startsWith('data:')) {
      if (originalLength > this.MAX_SAFE_DATA_URL_LENGTH) {
        console.warn('🚨 Data URL too large, using fallback to prevent performance issues:', {
          originalLength,
          maxSafeLength: this.MAX_SAFE_DATA_URL_LENGTH
        });
        return this.createFallbackResult(originalLength, 'fallback');
      }
      
      // Check if Base64 data is in URL path (which would cause 431 errors)
      if (this.hasBase64InPath(url)) {
        console.warn('🚨 Base64 data detected in URL path, using fallback to prevent 431 error');
        return this.createFallbackResult(originalLength, 'fallback');
      }
      
      return {
        url,
        isSanitized: false,
        originalLength,
        sanitizedLength: originalLength,
        method: 'original'
      };
    }

    // Check for other problematic patterns
    if (this.hasProblematicPatterns(url)) {
      console.warn('🚨 Problematic URL pattern detected, using fallback');
      return this.createFallbackResult(originalLength, 'fallback');
    }

    return {
      url,
      isSanitized: false,
      originalLength,
      sanitizedLength: originalLength,
      method: 'original'
    };
  }

  /**
   * Check if Base64 data is present in the URL path
   */
  private static hasBase64InPath(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      
      // Check if path contains Base64-like patterns
      const base64Pattern = /[A-Za-z0-9+/]{100,}={0,2}/;
      return base64Pattern.test(pathname);
    } catch {
      // If URL parsing fails, check for Base64 patterns in the string
      const base64Pattern = /[A-Za-z0-9+/]{100,}={0,2}/;
      return base64Pattern.test(url);
    }
  }

  /**
   * Check for other problematic URL patterns
   */
  private static hasProblematicPatterns(url: string): boolean {
    // Check for extremely long encoded strings
    const longEncodedPattern = /%[0-9A-Fa-f]{2,}/g;
    const matches = url.match(longEncodedPattern);
    
    if (matches) {
      const totalEncodedLength = matches.join('').length;
      if (totalEncodedLength > this.MAX_SAFE_BASE64_IN_PATH) {
        return true;
      }
    }

    // Check for data: URLs in path
    if (url.includes('data:image/') && url.includes(',')) {
      return true;
    }

    return false;
  }

  /**
   * Create a fallback result
   */
  private static createFallbackResult(originalLength: number, method: 'fallback' | 'placeholder'): SanitizedImageResult {
    const fallbackUrl = this.generatePlaceholderUrl();
    
    return {
      url: fallbackUrl,
      isSanitized: true,
      originalLength,
      sanitizedLength: fallbackUrl.length,
      method
    };
  }

  /**
   * Generate a placeholder image URL
   */
  private static generatePlaceholderUrl(): string {
    // Use a simple placeholder service that won't cause URL length issues
    const placeholderText = 'Image+Too+Large';
    const size = '300x300';
    const color = 'f3f4f6';
    const textColor = '6b7280';
    
    return `https://via.placeholder.com/${size}/${color}/${textColor}?text=${placeholderText}`;
  }

  /**
   * Validate if a URL is safe to use
   */
  static isUrlSafe(url: string): boolean {
    const result = this.sanitizeImageUrl(url);
    return !result.isSanitized;
  }

  /**
   * Get URL length statistics
   */
  static getUrlStats(url: string): {
    length: number;
    isTooLong: boolean;
    isDataUrl: boolean;
    hasBase64InPath: boolean;
    isSafe: boolean;
  } {
    const isDataUrl = url.startsWith('data:');
    const hasBase64InPath = this.hasBase64InPath(url);
    const isTooLong = url.length > this.MAX_SAFE_URL_LENGTH;
    const isSafe = !isTooLong && !hasBase64InPath;

    return {
      length: url.length,
      isTooLong,
      isDataUrl,
      hasBase64InPath,
      isSafe
    };
  }

  /**
   * Emergency URL cleanup for critical situations
   */
  static emergencyCleanup(url: string): string {
    if (!url || typeof url !== 'string') {
      return this.generatePlaceholderUrl();
    }

    // Immediate fallback for extremely long URLs
    if (url.length > 2000) {
      console.error('🚨 Emergency cleanup: URL extremely long, using fallback');
      return this.generatePlaceholderUrl();
    }

    // Check for Base64 in path and replace immediately
    if (this.hasBase64InPath(url)) {
      console.error('🚨 Emergency cleanup: Base64 in path detected, using fallback');
      return this.generatePlaceholderUrl();
    }

    return url;
  }
}

/**
 * Utility function for quick URL sanitization
 */
export function sanitizeImageUrl(url: string, alt?: string): string {
  return ImageUrlSanitizer.sanitizeImageUrl(url, alt).url;
}

/**
 * Utility function to check if URL is safe
 */
export function isImageUrlSafe(url: string): boolean {
  return ImageUrlSanitizer.isUrlSafe(url);
}

/**
 * Utility function for emergency cleanup
 */
export function emergencyImageUrlCleanup(url: string): string {
  return ImageUrlSanitizer.emergencyCleanup(url);
}
