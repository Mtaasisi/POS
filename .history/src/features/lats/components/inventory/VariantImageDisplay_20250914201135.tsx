import React, { useState, useEffect } from 'react';
import { Image, ImageIcon, Eye, Upload, X } from 'lucide-react';
import { ProductImage, ProductVariant } from '../../types/inventory';
import { VariantImage, UnifiedImageService } from '../../../../lib/unifiedImageService';
import GlassButton from '../../../shared/components/ui/GlassButton';
import Modal from '../../../shared/components/ui/Modal';

interface VariantImageDisplayProps {
  variant: ProductVariant;
  productImages: ProductImage[];
  onImageUpload?: (variantId: string, images: ProductImage[]) => void;
  onImageRemove?: (variantId: string, imageId: string) => void;
  editable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const VariantImageDisplay: React.FC<VariantImageDisplayProps> = ({
  variant,
  productImages,
  onImageUpload,
  onImageRemove,
  editable = false,
  size = 'md'
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [variantImages, setVariantImages] = useState<VariantImage[]>([]);
  const [loading, setLoading] = useState(false);

  // Load variant images from database
  useEffect(() => {
    if (variant.id) {
      loadVariantImages();
    }
  }, [variant.id]);

  const loadVariantImages = async () => {
    if (!variant.id) return;
    
    setLoading(true);
    try {
      const images = await UnifiedImageService.getVariantImages(variant.id);
      setVariantImages(images);
    } catch (error) {
      console.error('Failed to load variant images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get display images with proper fallback logic
  const getDisplayImages = (): ProductImage[] => {
    // 1. If variant has specific images, use those
    if (variantImages.length > 0) {
      return variantImages.map(img => ({
        id: img.id,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        fileName: img.fileName,
        fileSize: img.fileSize,
        isPrimary: img.isPrimary,
        uploadedAt: img.uploadedAt
      }));
    }
    
    // 2. If variant has images in the variant.images property (legacy), use those
    if (variant.images && variant.images.length > 0) {
      return variant.images;
    }
    
    // 3. Fallback to product images
    return productImages;
  };

  const displayImages = getDisplayImages();
  const primaryImage = displayImages.find(img => img.isPrimary) || displayImages[0];

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-16 h-16';
      case 'lg':
        return 'w-32 h-32';
      default:
        return 'w-24 h-24';
    }
  };

  const handleImageClick = (image: ProductImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !variant.id) return;

    setLoading(true);
    try {
      // Upload each file
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const result = await UnifiedImageService.uploadVariantImage(
          file,
          variant.id!,
          'current-user-id', // TODO: Get actual user ID
          index === 0 // First image is primary
        );
        
        if (!result.success) {
          console.error('Failed to upload image:', result.error);
          return null;
        }
        
        return result.image;
      });

      const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean);
      
      if (uploadedImages.length > 0) {
        // Reload variant images
        await loadVariantImages();
        
        // Notify parent component if callback provided
        if (onImageUpload) {
          const productImages = uploadedImages.map(img => ({
            id: img!.id,
            url: img!.url,
            thumbnailUrl: img!.thumbnailUrl,
            fileName: img!.fileName,
            fileSize: img!.fileSize,
            isPrimary: img!.isPrimary,
            uploadedAt: img!.uploadedAt
          }));
          onImageUpload(variant.id, productImages);
        }
      }
    } catch (error) {
      console.error('Failed to upload variant images:', error);
    } finally {
      setLoading(false);
      setShowUploadModal(false);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!variant.id) return;

    setLoading(true);
    try {
      const result = await UnifiedImageService.deleteVariantImage(imageId);
      
      if (result.success) {
        // Reload variant images
        await loadVariantImages();
        
        // Notify parent component if callback provided
        if (onImageRemove) {
          onImageRemove(variant.id, imageId);
        }
      } else {
        console.error('Failed to delete image:', result.error);
      }
    } catch (error) {
      console.error('Failed to remove variant image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Primary Image */}
        <div className={`${getSizeClasses()} relative group`}>
          {primaryImage ? (
            <div className="relative w-full h-full">
              <img
                src={primaryImage.url}
                alt={variant.name}
                className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(primaryImage)}
              />
              {editable && (
                <button
                  onClick={() => handleRemoveImage(primaryImage.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className={`${getSizeClasses()} bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center`}>
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Additional Images Count */}
        {displayImages.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">+{displayImages.length - 1}</span>
            <button
              onClick={() => setShowImageModal(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Button */}
        {editable && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
              title="Upload variant images"
            >
              <Upload className="w-4 h-4" />
            </button>
            {variant.images && variant.images.length === 0 && (
              <span className="text-xs text-gray-400">Uses main image</span>
            )}
          </div>
        )}
      </div>

      {/* Image Gallery Modal */}
      {showImageModal && (
        <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} size="lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {variant.name} Images
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayImages.map((image, index) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt={`${variant.name} - Image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(image)}
                  />
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                  {editable && variant.images && variant.images.length > 0 && (
                    <button
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {displayImages.length === 0 && (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No images available</p>
                <p className="text-sm text-gray-500 mt-1">
                  {variant.images && variant.images.length === 0 
                    ? 'This variant uses the main product image'
                    : 'Upload images to display here'
                  }
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Image Upload Modal */}
      {showUploadModal && (
        <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} size="md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Upload Images for {variant.name}
            </h3>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload variant-specific images</p>
                <p className="text-sm text-gray-500 mb-4">
                  These images will be used instead of the main product images
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="variant-image-upload"
                />
                <label
                  htmlFor="variant-image-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Images
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Image Guidelines:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Supported formats: JPG, PNG, GIF</li>
                  <li>• Maximum file size: 5MB per image</li>
                  <li>• Recommended size: 800x800px or larger</li>
                  <li>• First image will be set as primary</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </GlassButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Image View Modal */}
      {selectedImage && (
        <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} size="lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {variant.name} - {selectedImage.fileName}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center">
              <img
                src={selectedImage.url}
                alt={variant.name}
                className="max-w-full max-h-96 object-contain mx-auto rounded-lg"
              />
              <div className="mt-4 text-sm text-gray-600">
                <p>File: {selectedImage.fileName}</p>
                <p>Size: {(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                {selectedImage.isPrimary && (
                  <p className="text-blue-600 font-medium">Primary Image</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default VariantImageDisplay;
