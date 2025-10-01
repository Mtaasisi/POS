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

  // Load images dynamically if productId is provided AND no static images are available
  useEffect(() => {
    const loadImages = async () => {
      // If we already have static images, don't try to load from database
      if (images && images.length > 0) {
        console.log('🔍 [ProductImageDisplay] Using provided static images:', images);
        return;
      }
      
      if (!productId) {
        console.log('🔍 [ProductImageDisplay] No productId provided and no static images');
        return;
      }
      
      try {
        setDynamicLoading(true);
        console.log('🔍 [ProductImageDisplay] Loading images from database for productId:', productId);
        const productImages = await RobustImageService.getProductImages(productId);
        console.log('🔍 [ProductImageDisplay] Loaded images from database:', productImages);
        setDynamicImages(productImages);
      } catch (error) {
        console.error('❌ [ProductImageDisplay] Failed to load product images:', error);
        setDynamicImages([]);
      } finally {
        setDynamicLoading(false);
      }
    };

    loadImages();
  }, [productId, images]);

  // Use dynamic images if available, otherwise fall back to provided images
  // Prefer thumbnail URLs for better performance
  const displayImages = (() => {
    if (dynamicImages.length > 0) {
      // Use dynamic images from database with thumbnails
      return dynamicImages.map(img => {
        // Only use thumbnail if it's different from main image and not empty
        if (img.thumbnailUrl && img.thumbnailUrl !== img.url && img.thumbnailUrl.trim() !== '') {
          return img.thumbnailUrl;
        }
        return img.url;
      });
    } else if (images && images.length > 0) {
      // Use provided static images (convert strings to proper format)
      return images.map(img => {
        // If img is a string URL, use it directly
        if (typeof img === 'string') {
          return img;
        }
        // If img is an object with url/thumbnailUrl, prefer thumbnail
        return img.thumbnailUrl || img.url || img;
      });
    }
    return [];
  })();
  
  const isLoadingState = dynamicLoading || isLoading;

  // Debug logging
  console.log('🔍 [ProductImageDisplay] Debug info:', {
    productId,
    productName,
    dynamicImages: dynamicImages.length,
    staticImages: images?.length || 0,
    displayImages: displayImages.length,
    isLoadingState,
    firstDisplayImage: displayImages[0],
    imagesType: typeof images?.[0],
    rawImages: images
  });

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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('🖼️ Image failed to load:', {
      productName,
      imageUrl: e.currentTarget.src,
      error: 'Image load failed'
    });
    setImageError(true);
    setIsLoading(false);
  };

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('🖼️ Thumbnail failed to load, falling back to main image:', {
      productName,
      thumbnailUrl: e.currentTarget.src,
      error: 'Thumbnail load failed'
    });
    // Don't set imageError for thumbnail failures, just log it
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

  // Check if the image is a PNG (which often has transparent background)
  const isPngImage = displayImages[0] && (displayImages[0].includes('.png') || displayImages[0].includes('image/png'));

  return (
    <div className={`${shouldUseFullSize ? '' : sizeClasses[size]} relative rounded-lg overflow-hidden ${className}`}>
      {isLoadingState && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className={`${shouldUseFullSize ? 'w-8 h-8' : iconSizes[size]} text-gray-400`} />
        </div>
      )}
      
      {/* White background for PNG images */}
      {isPngImage && (
        <div className="absolute inset-0 bg-white" />
      )}
      
      <img
        src={displayImages[0]}
        alt={productName}
        className={`w-full h-full object-cover ${isPngImage ? 'relative z-10' : ''}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: isLoadingState ? 'none' : 'block' }}
      />
    </div>
  );
};

export default ProductImageDisplay;
