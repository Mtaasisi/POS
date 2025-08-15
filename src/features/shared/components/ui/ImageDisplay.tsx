import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageDisplayProps {
  imageUrl: string;
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

  console.log('🖼️ ImageDisplay props:', { imageUrl, thumbnailUrl, alt });

  const handleImageError = () => {
    console.error('Failed to load image:', imageUrl);
    setImageError(true);
    setIsLoading(false);
  };

  const handleThumbnailError = () => {
    console.error('Failed to load thumbnail:', thumbnailUrl);
    setThumbnailError(true);
    // Don't set imageError here, just try the original image
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', displayUrl);
    setIsLoading(false);
  };

  // Determine which URL to display
  let displayUrl = imageUrl;
  let onErrorHandler = handleImageError;

  if (thumbnailUrl && !thumbnailError) {
    displayUrl = thumbnailUrl;
    onErrorHandler = handleThumbnailError;
  }

  // If both thumbnail and original image failed, show fallback
  if (imageError && fallbackIcon) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      onError={onErrorHandler}
      onLoad={handleImageLoad}
    />
  );
};

export default ImageDisplay; 