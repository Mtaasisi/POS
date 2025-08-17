/**
 * Simple placeholder utilities for shared components
 */

/**
 * Generate a simple SVG placeholder image as a data URL
 */
export function generateSimplePlaceholder(text: string = 'Image', width: number = 300, height: number = 300): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#F3F4F6"/>
      <text x="${width / 2}" y="${height / 2}" font-family="Arial, sans-serif" font-size="16" fill="#6B6B6B" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Check if a URL is likely to fail (external placeholder services, etc.)
 * Updated with stricter limits to prevent HTTP 431 errors
 */
export function isUnreliableUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  
  // Check for extremely long URLs that might cause header size issues (reduced threshold)
  if (url.length > 1500) {
    console.warn('URL too long, likely to cause header size issues:', url.length);
    return true;
  }
  
  const unreliableDomains = [
    'via.placeholder.com',
    'placehold.it',
    'placehold.co',
    'dummyimage.com',
    'picsum.photos',
    'lorempixel.com',
    'loremflickr.com'
  ];
  
  // Check for data URLs (these are reliable but check size)
  if (url.startsWith('data:')) {
    // If data URL is too large, consider it unreliable
    if (url.length > 8000) {
      console.warn('Data URL too large, considering unreliable:', url.length);
      return true;
    }
    return false;
  }
  
  // Check for blob URLs (these are reliable)
  if (url.startsWith('blob:')) return false;
  
  // Check for local URLs (these are reliable)
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return false;
  
  // Check for unreliable domains
  return unreliableDomains.some(domain => url.toLowerCase().includes(domain));
}

/**
 * Get a reliable fallback image URL
 */
export function getFallbackImageUrl(type: 'product' | 'thumbnail' | 'avatar' = 'product', text?: string): string {
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
 * Validate and sanitize image URL
 * Updated with stricter validation to prevent HTTP 431 errors
 */
export function sanitizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return getFallbackImageUrl('product');
  }
  
  // Emergency check for extremely long URLs
  if (url.length > 2000) {
    console.error('Emergency sanitization: URL extremely long, using fallback');
    return getFallbackImageUrl('product');
  }
  
  // If it's already a data URL or blob URL, check size and return
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    if (url.length > 8000) {
      console.warn('Data/blob URL too large, using fallback');
      return getFallbackImageUrl('product');
    }
    return url;
  }
  
  // If it's an unreliable URL, replace with fallback
  if (isUnreliableUrl(url)) {
    console.warn('Unreliable image URL detected, using fallback:', url);
    return getFallbackImageUrl('product');
  }
  
  // Try to ensure the URL is properly formatted
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.toString();
  } catch (error) {
    console.warn('Invalid image URL, using fallback:', url);
    return getFallbackImageUrl('product');
  }
}

/**
 * Check if a URL is a data URL with base64 content
 */
export function isDataUrl(url: string): boolean {
  return url && typeof url === 'string' && url.startsWith('data:');
}

/**
 * Check if a URL is too long for HTTP headers
 * Updated with stricter default limit to prevent HTTP 431 errors
 */
export function isUrlTooLong(url: string, maxLength: number = 1500): boolean {
  return url && typeof url === 'string' && url.length > maxLength;
}

/**
 * Emergency URL cleanup for critical cases
 */
export function emergencyUrlCleanup(url: string): string {
  if (!url || typeof url !== 'string') {
    return getFallbackImageUrl('product');
  }

  // If URL is extremely long, immediately return fallback
  if (url.length > 2000) {
    console.error('Emergency cleanup: URL extremely long, using fallback');
    return getFallbackImageUrl('product');
  }

  // If it's a data URL and extremely large, return fallback
  if (isDataUrl(url) && url.length > 10000) {
    console.error('Emergency cleanup: Data URL extremely large, using fallback');
    return getFallbackImageUrl('product');
  }

  return url;
}
