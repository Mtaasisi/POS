import React, { useState, useEffect } from 'react';
import { getProductImages } from '../../lib/productImagesApi';
import ImageDisplay from './ImageDisplay';
import { toast } from 'react-hot-toast';

interface ThumbnailTestProps {
  productId: string;
}

const ThumbnailTest: React.FC<ThumbnailTestProps> = ({ productId }) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const productImages = await getProductImages(productId);
      console.log('Product images:', productImages);
      setImages(productImages);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading images...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Thumbnail Test</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={image.id} className="border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Image {index + 1}</h4>
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
              <ImageDisplay
                imageUrl={image.image_url}
                thumbnailUrl={image.thumbnail_url}
                alt={`Test image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs space-y-1">
              <div><strong>File:</strong> {image.file_name}</div>
              <div><strong>Size:</strong> {image.file_size} bytes</div>
              <div><strong>Primary:</strong> {image.is_primary ? 'Yes' : 'No'}</div>
              <div><strong>Original URL:</strong> {image.image_url}</div>
              <div><strong>Thumbnail URL:</strong> {image.thumbnail_url || 'None'}</div>
            </div>
          </div>
        ))}
      </div>
      {images.length === 0 && (
        <div className="text-center text-gray-500">
          No images found for this product
        </div>
      )}
    </div>
  );
};

export default ThumbnailTest; 