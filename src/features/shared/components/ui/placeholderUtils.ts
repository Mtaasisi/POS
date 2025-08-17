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
 */
export function isUnreliableUrl(url: string): boolean {
  const unreliableDomains = [
    'via.placeholder.com',
    'placehold.it',
    'placehold.co',
    'dummyimage.com'
  ];
  
  return unreliableDomains.some(domain => url.includes(domain));
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
