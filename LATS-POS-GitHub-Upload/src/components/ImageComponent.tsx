import React, { useState } from 'react';

interface ImageComponentProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
}

const ImageComponent: React.FC<ImageComponentProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/images/placeholder.png',
  width,
  height
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setHasError(false);
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
};

export default ImageComponent;
