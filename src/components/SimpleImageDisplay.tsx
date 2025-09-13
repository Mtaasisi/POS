import React, { useState } from 'react';
import { Image as ImageIcon, Package } from 'lucide-react';
import { ProductImage } from '../lib/robustImageService';

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

  // Get primary image or first image
  const primaryImage = safeImages.length > 0 ? (safeImages.find(img => img.isPrimary) || safeImages[0]) : null;

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

  // If no images or image failed to load, show fallback
  if (!primaryImage || imageError) {
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

  const handleImageError = () => {
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
        src={primaryImage.url}
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
