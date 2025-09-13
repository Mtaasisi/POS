import React, { useState, useCallback } from 'react';
import { getSafeImageUrl, handleImageError } from '../utils/imageUtils';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackText?: string;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackText,
  onError,
  onLoad
}) => {
  const [imageSrc, setImageSrc] = useState(() => getSafeImageUrl(src, fallbackText || alt));
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    handleImageError(event, fallbackText || alt);
    onError?.(new Error('Image failed to load'));
  }, [fallbackText, alt, onError]);

  const handleLoad = useCallback(() => {
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
      onLoad={handleLoad}
      style={{
        objectFit: 'cover',
        backgroundColor: '#f3f4f6'
      }}
    />
  );
};
