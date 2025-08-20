import React, { useState, useRef } from 'react';
import { Upload, Star, X, Check, AlertTriangle } from 'lucide-react';
import { RobustImageService, ProductImage } from '../lib/robustImageService';
import { toast } from 'react-hot-toast';

interface SimpleImageUploadProps {
  productId: string;
  userId: string;
  onImagesChange?: (images: ProductImage[]) => void;
  maxFiles?: number;
  className?: string;
}

export const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  productId,
  userId,
  onImagesChange,
  maxFiles = 5,
  className = ''
}) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [whiteBackground, setWhiteBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local storage for temporary products
  const [tempImages, setTempImages] = useState<Map<string, ProductImage[]>>(new Map());

  // Load existing images on mount
  React.useEffect(() => {
    // Only load images if we have a real product ID
    if (!productId.startsWith('temp-product-') && !productId.startsWith('test-product-')) {
      loadImages();
    }
  }, [productId]);

  const loadImages = async () => {
    try {
      // For temporary products, load from local storage
      if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
        const tempProductImages = tempImages.get(productId) || [];
        setImages(tempProductImages);
        onImagesChange?.(tempProductImages);
        return;
      }

      const productImages = await RobustImageService.getProductImages(productId);
      setImages(productImages);
      onImagesChange?.(productImages);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || uploading) return;

    const fileArray = Array.from(files);
    if (images.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const isPrimary = images.length === 0 && i === 0; // First image becomes primary if no images exist

        const result = await RobustImageService.uploadImage(file, productId, userId, isPrimary);
        
        if (result.success && result.image) {
          
          // Handle temporary products differently
          if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
            const currentTempImages = tempImages.get(productId) || [];
            const newTempImages = [...currentTempImages, result.image!];
            setTempImages(prev => new Map(prev).set(productId, newTempImages));
            setImages(newTempImages);
            onImagesChange?.(newTempImages);
          } else {
            setImages(prev => [...prev, result.image!]);
            onImagesChange?.([...images, result.image!]);
          }
          
          toast.success(`Uploaded ${file.name}`);
        } else {
          console.error('❌ Upload failed:', result.error);
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Upload process failed:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this image?')) return;

    setDeleting(imageId);
    try {
              const result = await RobustImageService.deleteImage(imageId);
      if (result.success) {
        // Handle temporary products differently
        if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
          const newTempImages = (tempImages.get(productId) || []).filter(img => img.id !== imageId);
          setTempImages(prev => new Map(prev).set(productId, newTempImages));
          setImages(newTempImages);
          onImagesChange?.(newTempImages);
        } else {
          setImages(prev => prev.filter(img => img.id !== imageId));
          onImagesChange?.(images.filter(img => img.id !== imageId));
        }
        toast.success('Image deleted');
      } else {
        toast.error(result.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
              const result = await RobustImageService.setPrimaryImage(imageId, productId);
      if (result.success) {
        // Handle temporary products differently
        if (productId.startsWith('temp-product-') || productId.startsWith('test-product-')) {
          const newTempImages = (tempImages.get(productId) || []).map(img => ({
            ...img,
            isPrimary: img.id === imageId
          }));
          setTempImages(prev => new Map(prev).set(productId, newTempImages));
          setImages(newTempImages);
          onImagesChange?.(newTempImages);
        } else {
          await loadImages(); // Reload to get updated state
        }
        toast.success('Primary image updated');
      } else {
        toast.error(result.error || 'Failed to set primary image');
      }
    } catch (error) {
      toast.error('Failed to set primary image');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {images.length < maxFiles && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors hover:border-blue-400 cursor-pointer bg-white/50 backdrop-blur-sm"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload images"
          >
            {uploading ? (
              <div className="mx-auto h-12 w-12 text-blue-500 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : images.length === 0 ? (
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <Upload className="h-12 w-12" />
              </div>
            ) : (
              <div className="mx-auto h-12 w-12 text-green-500 mb-4">
                <Check className="h-12 w-12" />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {uploading ? 'Uploading...' : images.length === 0 ? 'Upload Product Images' : 'Add More Images'}
              </p>
              <p className="text-sm text-gray-600">
                {uploading 
                  ? 'Please wait while your images are being processed...'
                  : `Click to select images or drag and drop. Maximum ${maxFiles} images allowed.`
                }
              </p>
              {images.length > 0 && (
                <p className="text-xs text-gray-500">
                  {images.length} of {maxFiles} images uploaded
                </p>
              )}
            </div>
            
            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    {/* Image */}
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                      <img
                        src={image.url}
                        alt={image.fileName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSAxMDBDODMuMjg0MyAxMDAgOTAgOTMuMjg0MyA5MCA4NUM5MCA3Ni43MTU3IDgzLjI4NDMgNzAgNzUgNzBDNjYuNzE1NyA3MCA2MCA3Ni43MTU3IDYwIDg1QzYwIDkzLjI4NDMgNjYuNzE1NyAxMDAgNzUgMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTAwIDEzMEMxMDAgMTMwIDg1IDEwMCA3NSAxMDBDNjUgMTAwIDUwIDEzMCA1MCAxMzBIMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {/* Primary Button */}
                        {!image.isPrimary && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrimary(image.id);
                            }}
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                            title="Set as primary"
                            aria-label="Set as primary image"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(image.id);
                          }}
                          disabled={deleting === image.id}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                          title="Delete image"
                          aria-label="Delete image"
                        >
                          {deleting === image.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3" />
                        <span className="text-xs font-medium">Primary</span>
                      </div>
                    )}

                    {/* Upload Success Badge */}
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                      <Check className="w-4 h-4" />
                    </div>

                    {/* File Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
                      <p className="truncate text-xs font-medium">{image.fileName}</p>
                      <p className="text-gray-300 text-xs">
                        {(image.fileSize / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={uploading}
              aria-label="Select image files"
            />
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="text-center text-sm text-gray-600 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Uploading images...</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Please wait, this may take a moment</p>
        </div>
      )}

      {/* Max Files Reached */}
      {images.length >= maxFiles && (
        <div className="text-center text-sm text-gray-600 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium">Maximum images reached</span>
          </div>
          <p className="text-xs text-gray-500">
            You have uploaded the maximum number of images ({maxFiles}). Remove some images to add more.
          </p>
        </div>
      )}
    </div>
  );
};
