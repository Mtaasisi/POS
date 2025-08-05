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

  const handleImageError = () => {
    console.error('Failed to load image:', imageUrl);
    setImageError(true);
  };

  const handleThumbnailError = () => {
    console.error('Failed to load thumbnail:', thumbnailUrl);
    setThumbnailError(true);
  };

  // If thumbnail failed and we have a fallback, use original image
  const displayUrl = thumbnailUrl && !thumbnailError ? thumbnailUrl : imageUrl;

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
      onError={thumbnailUrl ? handleThumbnailError : handleImageError}
      onLoad={() => {
        console.log('Image loaded successfully:', displayUrl);
      }}
    />
  );
};

export default ImageDisplay; 