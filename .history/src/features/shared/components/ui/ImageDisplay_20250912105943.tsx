import React from 'react';
import { sanitizeImageUrl, isUrlTooLong, getFallbackImageUrl, emergencyUrlCleanup } from './placeholderUtils';
import { ImageUrlSanitizer } from '../../../lib/imageUrlSanitizer';

interface ImageDisplayProps {
  imageUrl?: string;
  thumbnailUrl?: string;
  alt?: string;
  className?: string;
  fallbackIcon?: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  thumbnailUrl,
  alt = 'Product image',
  className = '',
  fallbackIcon = true
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [thumbnailError, setThumbnailError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUrl, setCurrentUrl] = React.useState('');

  console.log('🖼️ ImageDisplay props:', { 
    imageUrlLength: imageUrl?.length || 0, 
    thumbnailUrlLength: thumbnailUrl?.length || 0, 
    alt 
  });

  // Sanitize and set the initial URL with emergency cleanup
  React.useEffect(() => {
    // Use the new ImageUrlSanitizer for comprehensive URL validation
    const sanitizedResult = ImageUrlSanitizer.sanitizeImageUrl(imageUrl || '', alt);
    
    if (sanitizedResult.isSanitized) {
      console.warn('🚨 ImageDisplay: URL sanitized to prevent 431 error:', {
        method: sanitizedResult.method,
        originalLength: sanitizedResult.originalLength,
        sanitizedLength: sanitizedResult.sanitizedLength
      });
    }
    
    setCurrentUrl(sanitizedResult.url);
    setImageError(false);
    setThumbnailError(false);
    setIsLoading(true);
  }, [imageUrl, alt]);

  const handleImageError = () => {
    console.error('Failed to load image:', currentUrl);
    setImageError(true);
    setIsLoading(false);
    
    // Try fallback if we haven't already
    if (!imageError) {
      const fallbackUrl = getFallbackImageUrl('product', alt);
      setCurrentUrl(fallbackUrl);
    }
  };

  const handleThumbnailError = () => {
    console.error('Failed to load thumbnail:', thumbnailUrl);
    setThumbnailError(true);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // If both image and thumbnail failed, show fallback
  if (imageError && thumbnailError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-gray-400 text-center p-4">
          {fallbackIcon && (
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          )}
          <p className="text-sm">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      
      <img
        src={currentUrl}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      
      {thumbnailUrl && !thumbnailError && (
        <img
          src={emergencyUrlCleanup(sanitizeImageUrl(thumbnailUrl))}
          alt={`${alt} thumbnail`}
          className="hidden"
          onError={handleThumbnailError}
        />
      )}
    </div>
  );
};

export default ImageDisplay; 