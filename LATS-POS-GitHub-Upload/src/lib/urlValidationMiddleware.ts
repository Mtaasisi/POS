/**
 * URL Validation Middleware
 * 
 * This middleware prevents HTTP 431 "Request Header Fields Too Large" errors
 * by validating URLs before they are processed by the application.
 * 
 * The 431 error occurs when HTTP headers (including the URL) exceed server limits.
 * This middleware intercepts requests and redirects or sanitizes problematic URLs.
 */

import { ImageUrlSanitizer } from './imageUrlSanitizer';

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  reason?: string;
  originalLength: number;
  sanitizedLength?: number;
}

export class UrlValidationMiddleware {
  // Maximum safe URL length to prevent 431 errors
  private static readonly MAX_SAFE_URL_LENGTH = 1500;
  
  // Maximum safe path length
  private static readonly MAX_SAFE_PATH_LENGTH = 1000;
  
  // Patterns that indicate problematic URLs
  private static readonly PROBLEMATIC_PATTERNS = [
    /data:image\/[^;]+;base64,/,  // Base64 data URLs
    /%[0-9A-Fa-f]{2,}/g,          // URL encoded data
    /[A-Za-z0-9+/]{100,}={0,2}/,  // Base64-like strings
  ];

  /**
   * Validate a URL and return sanitization result
   */
  static validateUrl(url: string): UrlValidationResult {
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        reason: 'Invalid URL format',
        originalLength: 0
      };
    }

    const originalLength = url.length;

    // Check if URL is too long
    if (originalLength > this.MAX_SAFE_URL_LENGTH) {
      return {
        isValid: false,
        reason: 'URL too long for HTTP headers',
        originalLength,
        sanitizedUrl: this.generateSafeUrl(),
        sanitizedLength: this.generateSafeUrl().length
      };
    }

    // Check for problematic patterns
    for (const pattern of this.PROBLEMATIC_PATTERNS) {
      if (pattern.test(url)) {
        return {
          isValid: false,
          reason: 'URL contains problematic patterns (Base64 data)',
          originalLength,
          sanitizedUrl: this.generateSafeUrl(),
          sanitizedLength: this.generateSafeUrl().length
        };
      }
    }

    // Check path length specifically
    try {
      const urlObj = new URL(url, window.location.origin);
      if (urlObj.pathname.length > this.MAX_SAFE_PATH_LENGTH) {
        return {
          isValid: false,
          reason: 'URL path too long',
          originalLength,
          sanitizedUrl: this.generateSafeUrl(),
          sanitizedLength: this.generateSafeUrl().length
        };
      }
    } catch (error) {
      return {
        isValid: false,
        reason: 'Invalid URL format',
        originalLength
      };
    }

    return {
      isValid: true,
      originalLength
    };
  }

  /**
   * Validate and sanitize a URL for image display
   */
  static validateImageUrl(url: string): UrlValidationResult {
    const sanitizedResult = ImageUrlSanitizer.sanitizeImageUrl(url);
    
    return {
      isValid: !sanitizedResult.isSanitized,
      sanitizedUrl: sanitizedResult.url,
      originalLength: sanitizedResult.originalLength,
      sanitizedLength: sanitizedResult.sanitizedLength,
      reason: sanitizedResult.isSanitized ? 'Image URL sanitized to prevent 431 error' : undefined
    };
  }

  /**
   * Check if a URL is safe for navigation
   */
  static isUrlSafeForNavigation(url: string): boolean {
    const result = this.validateUrl(url);
    return result.isValid;
  }

  /**
   * Check if a URL is safe for image display
   */
  static isUrlSafeForImages(url: string): boolean {
    const result = this.validateImageUrl(url);
    return result.isValid;
  }

  /**
   * Generate a safe fallback URL
   */
  private static generateSafeUrl(): string {
    // Return a safe fallback URL that won't cause 431 errors
    return '/lats/unified-inventory';
  }

  /**
   * Log URL validation issues for debugging
   */
  static logUrlValidationIssue(url: string, result: UrlValidationResult): void {
    if (!result.isValid) {
      console.warn('🚨 URL Validation Issue:', {
        reason: result.reason,
        originalLength: result.originalLength,
        sanitizedLength: result.sanitizedLength,
        urlPreview: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
        sanitizedUrl: result.sanitizedUrl
      });
    }
  }

  /**
   * Emergency URL cleanup for critical situations
   */
  static emergencyUrlCleanup(url: string): string {
    const result = this.validateUrl(url);
    
    if (!result.isValid && result.sanitizedUrl) {
      console.error('🚨 Emergency URL cleanup applied:', {
        originalLength: result.originalLength,
        reason: result.reason
      });
      return result.sanitizedUrl;
    }
    
    return url;
  }

  /**
   * Get URL statistics for debugging
   */
  static getUrlStats(url: string): {
    length: number;
    pathLength: number;
    hasProblematicPatterns: boolean;
    isTooLong: boolean;
    isSafe: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    let pathLength = 0;
    let hasProblematicPatterns = false;

    try {
      const urlObj = new URL(url, window.location.origin);
      pathLength = urlObj.pathname.length;
    } catch {
      issues.push('Invalid URL format');
    }

    if (url.length > this.MAX_SAFE_URL_LENGTH) {
      issues.push('URL too long');
    }

    if (pathLength > this.MAX_SAFE_PATH_LENGTH) {
      issues.push('Path too long');
    }

    for (const pattern of this.PROBLEMATIC_PATTERNS) {
      if (pattern.test(url)) {
        hasProblematicPatterns = true;
        issues.push('Contains problematic patterns');
        break;
      }
    }

    return {
      length: url.length,
      pathLength,
      hasProblematicPatterns,
      isTooLong: url.length > this.MAX_SAFE_URL_LENGTH,
      isSafe: issues.length === 0,
      issues
    };
  }
}

/**
 * React hook for URL validation
 */
export function useUrlValidation() {
  const validateUrl = (url: string) => UrlValidationMiddleware.validateUrl(url);
  const validateImageUrl = (url: string) => UrlValidationMiddleware.validateImageUrl(url);
  const isUrlSafeForNavigation = (url: string) => UrlValidationMiddleware.isUrlSafeForNavigation(url);
  const isUrlSafeForImages = (url: string) => UrlValidationMiddleware.isUrlSafeForImages(url);
  const getUrlStats = (url: string) => UrlValidationMiddleware.getUrlStats(url);

  return {
    validateUrl,
    validateImageUrl,
    isUrlSafeForNavigation,
    isUrlSafeForImages,
    getUrlStats
  };
}

/**
 * Utility function for quick URL validation
 */
export function validateUrl(url: string): UrlValidationResult {
  return UrlValidationMiddleware.validateUrl(url);
}

/**
 * Utility function for quick image URL validation
 */
export function validateImageUrl(url: string): UrlValidationResult {
  return UrlValidationMiddleware.validateImageUrl(url);
}

/**
 * Utility function for emergency URL cleanup
 */
export function emergencyUrlCleanup(url: string): string {
  return UrlValidationMiddleware.emergencyUrlCleanup(url);
}
