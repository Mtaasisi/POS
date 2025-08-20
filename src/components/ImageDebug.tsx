import React from 'react';
import { ProductImage } from '../lib/robustImageService';

interface ImageDebugProps {
  images: ProductImage[];
  productId: string;
  className?: string;
}

export const ImageDebug: React.FC<ImageDebugProps> = ({
  images,
  productId,
  className = ''
}) => {
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <h4 className="font-medium text-yellow-800 mb-2">🛠️ Image Debug Info</h4>
      <div className="text-sm space-y-2">
        <div>
          <strong>Product ID:</strong> {productId}
        </div>
        <div>
          <strong>Images Count:</strong> {images.length}
        </div>
        <div>
          <strong>Is Temporary:</strong> {productId.startsWith('temp-product-') ? 'Yes' : 'No'}
        </div>
        {images.length > 0 && (
          <div>
            <strong>Images:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              {images.map((image, index) => (
                <li key={image.id} className="text-xs">
                  {index + 1}. {image.fileName} (ID: {image.id})
                  {image.isPrimary && ' - PRIMARY'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
