import React, { useState } from 'react';
import { Image as ImageIcon, Package } from 'lucide-react';
import { ProductImage } from '../lib/robustImageService';
import { ImageUrlSanitizer } from '../lib/imageUrlSanitizer';

interface SimpleImageDisplayProps {
  images: ProductImage[];
  productName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
  onClick?: () => void;
  showPrimaryBadge?: boolean;
}

export const SimpleImageDisplay: React.FC<SimpleImageDisplayProps> = ({
  images,
  productName = 'Product',
  size = 'md',
  className = '',
  showFallback = true,
  onClick,
  showPrimaryBadge = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure images is always an array
  const safeImages = Array.isArray(images) ? images : [];

  // Normalize image data to handle different formats
  const normalizeImageData = (imageData: any): { url: string | null; thumbnailUrl: string | null } => {
    // If it's already a string (URL), return it
    if (typeof imageData === 'string') {
      return { url: imageData, thumbnailUrl: null };
    }
    
    // If it's null or undefined, return null
    if (!imageData || typeof imageData !== 'object') {
      return { url: null, thumbnailUrl: null };
    }
    
    // Handle different object structures
    const url = imageData.url || imageData.image_url || imageData.src || null;
    const thumbnailUrl = imageData.thumbnailUrl || imageData.thumbnail_url || imageData.thumb_url || null;
    
    return { url, thumbnailUrl };
  };

  // Get primary image or first image and normalize it
  const primaryImageData = safeImages.length > 0 ? (safeImages.find(img => img.isPrimary) || safeImages[0]) : null;
  const { url: primaryImageUrl, thumbnailUrl: primaryThumbnailUrl } = normalizeImageData(primaryImageData);
  
  // Sanitize the image URL to prevent 431 errors, but preserve thumbnail URLs
  const sanitizedResult = primaryImageUrl ? ImageUrlSanitizer.sanitizeImageUrl(primaryImageUrl, productName) : null;
  const sanitizedImageUrl = sanitizedResult?.url || null;
  
  // For thumbnails, use a more lenient sanitization
  const sanitizedThumbnailResult = primaryThumbnailUrl ? 
    ImageUrlSanitizer.sanitizeImageUrl(primaryThumbnailUrl, productName) : null;
  const sanitizedThumbnailUrl = sanitizedThumbnailResult?.url || primaryThumbnailUrl || null;
  
  // Log when fallback is used for debugging
  if (sanitizedResult?.method === 'fallback' && primaryImageUrl) {
    console.warn('🖼️ Image URL sanitized to fallback:', {
      productName,
      originalUrl: primaryImageUrl.substring(0, 100) + '...',
      reason: 'URL too large or invalid'
    });
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Determine which URL to use - prefer thumbnail if available and different
  const displayUrl = (() => {
    // Use thumbnail if it exists, is different from main image, and is not empty
    if (sanitizedThumbnailUrl && sanitizedThumbnailUrl !== sanitizedImageUrl && sanitizedThumbnailUrl.trim() !== '') {
      return sanitizedThumbnailUrl;
    }
    // Fall back to main image
    return sanitizedImageUrl;
  })();

  // If no images, no display URL, or image failed to load, show fallback
  if (!primaryImageData || !displayUrl || imageError) {
    if (!showFallback) return null;
    
    return (
      <div 
        className={`${sizeClasses[size]} bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <Package className={`${iconSizes[size]} text-gray-400`} />
      </div>
    );
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('🖼️ Image failed to load:', {
      productName,
      imageUrl: e.currentTarget.src,
      error: 'Image load failed'
    });
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div 
      className={`${sizeClasses[size]} relative rounded-lg overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className={`${iconSizes[size]} text-gray-400`} />
        </div>
      )}

      {/* Image */}
      <img
        src={displayUrl}
        alt={productName}
        className="w-full h-full object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: isLoading ? 'none' : 'block' }}
      />

    </div>
  );
};

// Gallery version for multiple images
interface SimpleImageGalleryProps {
  images: ProductImage[];
  productName?: string;
  maxDisplay?: number;
  className?: string;
  onImageClick?: (image: ProductImage) => void;
}

export const SimpleImageGallery: React.FC<SimpleImageGalleryProps> = ({
  images,
  productName = 'Product',
  maxDisplay = 4,
  className = '',
  onImageClick
}) => {
  // Ensure images is always an array
  const safeImages = Array.isArray(images) ? images : [];
  
  if (!safeImages.length) {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        <SimpleImageDisplay images={[]} productName={productName} size="md" />
        <SimpleImageDisplay images={[]} productName={productName} size="md" />
      </div>
    );
  }

  const displayImages = safeImages.slice(0, maxDisplay);
  const remainingCount = safeImages.length - maxDisplay;

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {displayImages.map((image, index) => (
        <div key={image.id} className="relative">
          <SimpleImageDisplay
            images={[image]}
            productName={productName}
            size="md"
            onClick={() => onImageClick?.(image)}
          />
          
          {/* Show remaining count on last image */}
          {index === maxDisplay - 1 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <span className="text-white text-sm font-medium">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
