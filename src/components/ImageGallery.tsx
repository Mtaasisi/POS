import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ImageUploadService, UploadedImage } from '../lib/imageUpload';

interface ImageGalleryProps {
  productId: string;
  onImagesChange?: (images: UploadedImage[]) => void;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  productId,
  onImagesChange,
  className = ''
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load images
  useEffect(() => {
    console.log('🔄 ImageGallery: Loading images for productId:', productId);
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      console.log('🔄 ImageGallery: Starting to load images for productId:', productId);
      setLoading(true);
      setError(null);
      const productImages = await ImageUploadService.getProductImages(productId);
      console.log('📥 ImageGallery: Loaded images:', productImages);
      setImages(productImages);
      onImagesChange?.(productImages);
    } catch (err) {
      console.error('❌ ImageGallery: Failed to load images:', err);
      setError('Failed to load images');
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
      
      // Check if this is a temporary product
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
        console.log('📝 Deleting image for temporary product:', productId, 'imageId:', imageId);
        
        // Import the EnhancedImageUploadService to handle temporary products
        const { EnhancedImageUploadService } = await import('../lib/enhancedImageUpload');
        const result = await EnhancedImageUploadService.deleteImage(imageId, 'product-images', productId);
        
        if (result.success) {
          // Remove from local state
          setImages(prev => prev.filter(img => img.id !== imageId));
          onImagesChange?.(images.filter(img => img.id !== imageId));
        } else {
          setError(result.error || 'Failed to delete image');
        }
      } else {
        // Handle real products
        const result = await ImageUploadService.deleteImage(imageId);
        
        if (result.success) {
          setImages(prev => prev.filter(img => img.id !== imageId));
          onImagesChange?.(images.filter(img => img.id !== imageId));
        } else {
          setError(result.error || 'Failed to delete image');
        }
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
      // Check if this is a temporary product
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
        console.log('📝 Setting primary image for temporary product:', productId, 'imageId:', imageId);
        
        // Import the EnhancedImageUploadService to handle temporary products
        const { EnhancedImageUploadService } = await import('../lib/enhancedImageUpload');
        const result = await EnhancedImageUploadService.setPrimaryImage(imageId, productId);
        
        if (result.success) {
          // Reload images to get updated state
          await loadImages();
        } else {
          setError(result.error || 'Failed to set primary image');
        }
      } else {
        // Handle real products (database update)
        const { data, error } = await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', imageId)
          .select();

        if (error) {
          setError('Failed to set primary image');
          return;
        }

        // Reload images to get updated state
        await loadImages();
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
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-red-700">❌ {error}</div>
        <button
          onClick={loadImages}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return null; // Hide the component when there are no images
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Product Images ({images.length})
        </h3>
        <button
          onClick={loadImages}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group">
            {/* Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={image.url}
                alt={image.fileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNjAgODkuNTQ0NyA2OC4wMDAxIDgxIDc4IDgxQzg3Ljk5OTkgODEgOTYgODkuNTQ0NyA5NiAxMDBDOTYgMTEwLjQ1NSA4Ny45OTk5IDExOSA3OCAxMTlDNjguMDAwMSAxMTkgNjAgMTEwLjQ1NSA2MCAxMDBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNDAgMTAwQzE0MCA4OS41NDQ3IDE0OC4wMDAxIDgxIDE1OCA4MUMxNjcuOTk5OSA4MSAxNzYgODkuNTQ0NyAxNzYgMTAwQzE3NiAxMTAuNDU1IDE2Ny45OTk5IDExOSAxNTggMTE5QzE0OC4wMDAxIDExOSAxNDAgMTEwLjQ1NSAxNDAgMTAwWiIgZmlsbD0iIzlCOUJBQCIvPgo8L3N2Zz4K';
                }}
              />
            </div>

            {/* Primary Badge */}
            {image.isPrimary && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Primary
              </div>
            )}

            {/* Loading Overlay */}
            {deleting === image.id && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white">Deleting...</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-1">
                {!image.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600"
                    title="Set as primary"
                  >
                    ⭐
                  </button>
                )}
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  disabled={deleting === image.id}
                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                  title="Delete image"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Image Info */}
            <div className="mt-2 text-xs text-gray-600">
              <div className="font-medium truncate">{image.fileName}</div>
                              <div>{(() => {
                  const formatted = (image.fileSize / 1024 / 1024).toFixed(2);
                  return formatted.replace(/\.00$/, '').replace(/\.0$/, '');
                })()} MB</div>
              <div className="text-gray-400">
                {new Date(image.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
