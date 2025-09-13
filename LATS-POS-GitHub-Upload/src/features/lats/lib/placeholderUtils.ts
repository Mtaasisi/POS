/**
 * Utility functions for generating reliable placeholder images
 * Uses data URLs instead of external services to avoid network issues
 */

export interface PlaceholderOptions {
  width?: number;
  height?: number;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

/**
 * Generate a simple SVG placeholder image as a data URL
 */
export function generatePlaceholderImage(options: PlaceholderOptions = {}): string {
  const {
    width = 300,
    height = 300,
    text = 'No Image',
    backgroundColor = '#F3F4F6',
    textColor = '#6B6B6B',
    fontSize = 16
  } = options;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      <text x="${width / 2}" y="${height / 2}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generate a product placeholder image
 */
export function generateProductPlaceholder(productName?: string): string {
  return generatePlaceholderImage({
    width: 300,
    height: 300,
    text: productName ? `No Image\n${productName}` : 'Product Image',
    backgroundColor: '#F8FAFC',
    textColor: '#64748B',
    fontSize: 14
  });
}

/**
 * Generate a small thumbnail placeholder
 */
export function generateThumbnailPlaceholder(): string {
  return generatePlaceholderImage({
    width: 100,
    height: 100,
    text: 'Thumbnail',
    backgroundColor: '#F1F5F9',
    textColor: '#94A3B8',
    fontSize: 12
  });
}

/**
 * Generate a user avatar placeholder
 */
export function generateAvatarPlaceholder(initials?: string): string {
  return generatePlaceholderImage({
    width: 40,
    height: 40,
    text: initials || 'U',
    backgroundColor: '#E2E8F0',
    textColor: '#475569',
    fontSize: 14
  });
}

/**
 * Check if a URL is a data URL
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
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
      return generateThumbnailPlaceholder();
    case 'avatar':
      return generateAvatarPlaceholder(text);
    case 'product':
    default:
      return generateProductPlaceholder(text);
  }
}
