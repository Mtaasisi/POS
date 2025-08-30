import React, { useState } from 'react';
import { Package, Image as ImageIcon } from 'lucide-react';

interface ProductImageDisplayProps {
  images?: string[];
  productName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const ProductImageDisplay: React.FC<ProductImageDisplayProps> = ({
  images = [],
  productName,
  size = 'md',
  className = '',
  showFallback = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Size classes
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  // If className includes w-full or h-full, use those instead of size classes
  const shouldUseFullSize = className.includes('w-full') || className.includes('h-full');

  // Icon sizes
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // If no images or image failed to load, show fallback
  if (!images.length || imageError) {
    if (!showFallback) return null;
    
    return (
      <div className={`${shouldUseFullSize ? '' : sizeClasses[size]} bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center ${className}`}>
        <Package className={`${shouldUseFullSize ? 'w-8 h-8' : iconSizes[size]} text-blue-600`} />
      </div>
    );
  }

  return (
    <div className={`${shouldUseFullSize ? '' : sizeClasses[size]} relative rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className={`${shouldUseFullSize ? 'w-8 h-8' : iconSizes[size]} text-gray-400`} />
        </div>
      )}
      <img
        src={images[0]}
        alt={productName}
        className="w-full h-full object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default ProductImageDisplay;
