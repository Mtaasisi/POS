/**
 * Data processor for LATS module
 * Handles data cleanup and validation to prevent issues like HTTP 431 errors
 */

import { processProductImages, cleanupImageData, emergencyUrlCleanup } from './imageUtils';
import { Product, Category, Supplier } from '../types/inventory';

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
 * Replace all placeholder images with local SVG placeholders
 */
function replacePlaceholderImages(images: string[]): string[] {
  if (!Array.isArray(images)) return [];
  
  return images.map(imageUrl => {
    // Check if it's a placeholder service URL
    if (isUnreliableUrl(imageUrl)) {
      console.log('🔄 Replacing placeholder image:', imageUrl);
      return generateSimplePlaceholder('Product Image', 400, 400);
    }
    return imageUrl;
  });
}

/**
 * Process and clean up product data to prevent issues
 */
export function processProductData(products: Product[]): Product[] {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map(product => {
    const processedProduct = { ...product };

    // Clean up image data and replace placeholder images
    if (processedProduct.images && Array.isArray(processedProduct.images)) {
      processedProduct.images = replacePlaceholderImages(processProductImages(processedProduct.images));
    }

    // Clean up individual image fields
    if (processedProduct.image_url) {
      processedProduct.image_url = emergencyUrlCleanup(processedProduct.image_url);
    }

    if (processedProduct.thumbnail_url) {
      processedProduct.thumbnail_url = emergencyUrlCleanup(processedProduct.thumbnail_url);
    }

    // Clean up any other image-related fields
    if (processedProduct.primary_image) {
      processedProduct.primary_image = cleanupImageData(processedProduct.primary_image);
    }

    return processedProduct;
  });
}

/**
 * Process and clean up category data
 */
export function processCategoryData(categories: Category[]): Category[] {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories.map(category => {
    const processedCategory = { ...category };

    // Clean up image data if present
    if (processedCategory.image_url) {
      processedCategory.image_url = emergencyUrlCleanup(processedCategory.image_url);
    }

    return processedCategory;
  });
}

/**
 * Process and clean up brand data
 */
export function processBrandData(brands: Brand[]): Brand[] {
  if (!Array.isArray(brands)) {
    return [];
  }

  return brands.map(brand => {
    const processedBrand = { ...brand };

    // Clean up logo data if present
    if (processedBrand.logo_url) {
      processedBrand.logo_url = emergencyUrlCleanup(processedBrand.logo_url);
    }

    return processedBrand;
  });
}

/**
 * Process and clean up supplier data
 */
export function processSupplierData(suppliers: Supplier[]): Supplier[] {
  if (!Array.isArray(suppliers)) {
    return [];
  }

  return suppliers.map(supplier => {
    const processedSupplier = { ...supplier };

    // Clean up any image data if present
    if (processedSupplier.logo_url) {
      processedSupplier.logo_url = emergencyUrlCleanup(processedSupplier.logo_url);
    }

    return processedSupplier;
  });
}

/**
 * Comprehensive data cleanup for all LATS data
 */
export function processLatsData(data: {
  products?: Product[];
  categories?: Category[];
  brands?: Brand[];
  suppliers?: Supplier[];
  [key: string]: any;
}): {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
} {
  return {
    products: processProductData(data.products || []),
    categories: processCategoryData(data.categories || []),
    brands: processBrandData(data.brands || []),
    suppliers: processSupplierData(data.suppliers || [])
  };
}

/**
 * Validate data integrity and log any issues
 */
export function validateDataIntegrity(data: any, dataType: string): boolean {
  if (!data) {
    console.warn(`⚠️ ${dataType}: No data provided`);
    return false;
  }

  if (!Array.isArray(data)) {
    console.warn(`⚠️ ${dataType}: Data is not an array`);
    return false;
  }

  // Check for extremely long URLs that might cause issues
  let hasLongUrls = false;
  data.forEach((item, index) => {
    if (item && typeof item === 'object') {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 2000) {
          console.warn(`⚠️ ${dataType}[${index}].${key}: Extremely long URL detected (${value.length} chars)`);
          hasLongUrls = true;
        }
      });
    }
  });

  if (hasLongUrls) {
    console.warn(`⚠️ ${dataType}: Contains extremely long URLs that may cause HTTP 431 errors`);
  }

  return true;
}

/**
 * Emergency data cleanup for critical issues
 */
export function emergencyDataCleanup(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => emergencyDataCleanup(item));
  }

  if (typeof data === 'object') {
    const cleaned = { ...data };
    Object.entries(cleaned).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 2000) {
        console.error(`Emergency cleanup: Removing extremely long ${key} (${value.length} chars)`);
        cleaned[key] = '';
      } else if (typeof value === 'object') {
        cleaned[key] = emergencyDataCleanup(value);
      }
    });
    return cleaned;
  }

  return data;
}
