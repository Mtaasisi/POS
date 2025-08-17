import React, { useState, useEffect } from 'react';
import { LocalImageStorageService, LocalImageData } from '../lib/localImageStorage';

interface LocalImageGalleryProps {
  productId: string;
  onImagesChange?: (images: LocalImageData[]) => void;
  className?: string;
}

export const LocalImageGallery: React.FC<LocalImageGalleryProps> = ({
  productId,
  onImagesChange,
  className = ''
}) => {
  const [images, setImages] = useState<LocalImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load images
  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const productImages = await LocalImageStorageService.getProductImages(productId);
      setImages(productImages);
      onImagesChange?.(productImages);
    } catch (err) {
      setError('Failed to load images');
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete image
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      setDeleting(imageId);
      const result = await LocalImageStorageService.deleteImage(imageId);
      
      if (result.success) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        onImagesChange?.(images.filter(img => img.id !== imageId));
      } else {
        setError(result.error || 'Failed to delete image');
      }
    } catch (err) {
      setError('Failed to delete image');
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  // Set primary image
  const handleSetPrimary = async (imageId: string) => {
    try {
      const result = await LocalImageStorageService.setPrimaryImage(imageId);
      
      if (result.success) {
        // Update local state
        setImages(prev => prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        })));
      } else {
        setError(result.error || 'Failed to set primary image');
      }
    } catch (err) {
      setError('Failed to set primary image');
      console.error('Set primary error:', err);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-gray-500">Loading images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600">{error}</div>
        <button
          onClick={loadImages}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        <div className="text-lg font-medium mb-2">No images uploaded</div>
        <div className="text-sm">Upload images to see them here</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image.url}
                alt={image.fileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjZCNkIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD4KPC9zdmc+Cg==';
                }}
              />
              
              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Primary
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                {!image.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                    title="Set as primary"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  disabled={deleting === image.id}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                  title="Delete image"
                >
                  {deleting === image.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Info */}
      <div className="text-sm text-gray-600">
        {images.length} image{images.length !== 1 ? 's' : ''} uploaded
      </div>
    </div>
  );
};
