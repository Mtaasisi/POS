import React, { useState, useEffect } from 'react';
import { Package, Image as ImageIcon } from 'lucide-react';
import { RobustImageService, ProductImage } from '../../../../lib/robustImageService';

interface ProductImageDisplayProps {
  images?: string[];
  productName: string;
  productId?: string; // Add productId for dynamic loading
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const ProductImageDisplay: React.FC<ProductImageDisplayProps> = ({
  images = [],
  productName,
  productId,
  size = 'md',
  className = '',
  showFallback = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicImages, setDynamicImages] = useState<ProductImage[]>([]);
  const [dynamicLoading, setDynamicLoading] = useState(false);

  // Load images dynamically if productId is provided
  useEffect(() => {
    const loadImages = async () => {
      if (!productId) {
        console.log('🔍 [ProductImageDisplay] No productId provided, using static images:', images);
        return;
      }
      
      try {
        setDynamicLoading(true);
        console.log('🔍 [ProductImageDisplay] Loading images for productId:', productId);
        const productImages = await RobustImageService.getProductImages(productId);
        console.log('🔍 [ProductImageDisplay] Loaded images:', productImages);
        setDynamicImages(productImages);
      } catch (error) {
        console.error('❌ [ProductImageDisplay] Failed to load product images:', error);
        setDynamicImages([]);
      } finally {
        setDynamicLoading(false);
      }
    };

    loadImages();
  }, [productId]);

  // Use dynamic images if available, otherwise fall back to provided images
  // Prefer thumbnail URLs for better performance
  const displayImages = dynamicImages.length > 0 
    ? dynamicImages.map(img => img.thumbnailUrl || img.url) 
    : images;
  const isLoadingState = dynamicLoading || isLoading;

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
  if (!displayImages.length || imageError) {
    if (!showFallback) return null;
    
    return (
      <div className={`${shouldUseFullSize ? '' : sizeClasses[size]} bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <Package className={`${shouldUseFullSize ? 'w-8 h-8' : iconSizes[size]} text-gray-400`} />
      </div>
    );
  }

  return (
    <div className={`${shouldUseFullSize ? '' : sizeClasses[size]} relative rounded-lg overflow-hidden ${className}`}>
      {isLoadingState && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className={`${shouldUseFullSize ? 'w-8 h-8' : iconSizes[size]} text-gray-400`} />
        </div>
      )}
      <img
        src={displayImages[0]}
        alt={productName}
        className="w-full h-full object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: isLoadingState ? 'none' : 'block' }}
      />
    </div>
  );
};

export default ProductImageDisplay;
