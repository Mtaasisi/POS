import React, { useRef, useState, useEffect } from 'react';
import { Camera, ImageIcon, Trash2, Upload } from 'lucide-react';
import { SimpleImageUpload } from '../../../../components/SimpleImageUpload';

interface ProductImage {
  id?: string;
  image_url?: string;
  url?: string;
  thumbnail_url?: string;
  file_name?: string;
  fileName?: string;
  file_size?: number;
  fileSize?: number;
  is_primary?: boolean;
  isPrimary?: boolean;
  uploaded_by?: string;
  created_at?: string;
  uploadedAt?: string;
  mimeType?: string;
}

// Type for images array that can contain both objects and strings
type ProductImageOrString = ProductImage | string;

interface ProductImagesSectionProps {
  images?: ProductImageOrString[];
  setImages: (images: ProductImageOrString[]) => void;
  currentUser: any;
  productId?: string; // Add productId prop
}

const ProductImagesSection: React.FC<ProductImagesSectionProps> = ({
  images,
  setImages,
  currentUser,
  productId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasUploadedImages, setHasUploadedImages] = useState(() => 
    Boolean(images && Array.isArray(images) && images.length > 0)
  );

  // Update hasUploadedImages when images prop changes
  useEffect(() => {
    setHasUploadedImages(Boolean(images && Array.isArray(images) && images.length > 0));
  }, [images]);

  const handleImageUpload = (uploadedImages: any[]) => {
    const newImages = uploadedImages.map((img, index) => ({
      ...img,
      id: img.id || `temp-${Date.now()}-${index}`,
      isPrimary: (!images || !Array.isArray(images) || images.length === 0) && index === 0, // First image is primary if no images exist
      uploaded_by: currentUser?.id,
      uploadedAt: new Date().toISOString()
    }));
    
    const currentImages = Array.isArray(images) ? images : [];
    setImages([...currentImages, ...newImages]);
    setHasUploadedImages(true);
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleUploadAreaClick();
    }
  };

  const removeImage = (index: number) => {
    const currentImages = Array.isArray(images) ? images : [];
    const updated = currentImages.filter((_, i) => i !== index);
    
    // If we removed the primary image, make the first remaining image primary
    if (updated.length > 0 && !updated.some(img => {
      // Handle both object and string cases
      if (typeof img === 'string') return false;
      return img.isPrimary || img.is_primary;
    })) {
      // Ensure the first image is an object before setting properties
      if (typeof updated[0] === 'object' && updated[0] !== null) {
        updated[0].isPrimary = true;
        updated[0].is_primary = true;
      }
    }
    
    // If no images left, reset the upload state
    if (updated.length === 0) {
      setHasUploadedImages(false);
    }
    setImages(updated);
  };

  const setPrimaryImage = (index: number) => {
    const currentImages = Array.isArray(images) ? images : [];
    const updated = currentImages.map((img, i) => {
      // Handle both object and string cases
      if (typeof img === 'string') {
        // Convert string to object format
        return {
          id: `temp-${Date.now()}-${i}`,
          url: img,
          fileName: `Image ${i + 1}`,
          fileSize: 0,
          isPrimary: i === index,
          is_primary: i === index,
          uploadedAt: new Date().toISOString()
        };
      }
      
      // If it's already an object, just update the primary status
      return {
        ...img,
        isPrimary: i === index,
        is_primary: i === index
      };
    });
    setImages(updated);
  };

  const getImageUrl = (image: ProductImageOrString) => {
    // Handle string case
    if (typeof image === 'string') return image;
    
    return image.image_url || image.url || '';
  };

  const isPrimary = (image: ProductImageOrString) => {
    // Handle string case
    if (typeof image === 'string') return false;
    
    return image.isPrimary || image.is_primary || false;
  };

  // Generate a temporary product ID if none is provided
  const tempProductId = productId || `temp-product-${Date.now()}`;

  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Camera size={20} className="text-purple-600" />
        Product Images
      </h3>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="space-y-4 w-full">
          {/* Use SimpleImageUpload component for proper file handling */}
          <SimpleImageUpload
            productId={tempProductId}
            userId={currentUser?.id}
            onImagesChange={(uploadedImages) => {
              // Convert the uploaded images to the format expected by the form
              const convertedImages = uploadedImages.map((img, index) => ({
                id: img.id,
                url: img.url,
                image_url: img.url,
                thumbnail_url: img.thumbnailUrl,
                fileName: img.fileName,
                file_name: img.fileName,
                fileSize: img.fileSize,
                file_size: img.fileSize,
                isPrimary: img.isPrimary,
                is_primary: img.isPrimary,
                uploaded_by: currentUser?.id,
                uploadedAt: img.uploadedAt,
                created_at: img.uploadedAt,
                mimeType: img.mimeType
              }));
              setImages(convertedImages);
              setHasUploadedImages(convertedImages.length > 0);
            }}
            maxFiles={10}
            className="w-full"
          />

          {/* Empty State - Show when no images exist */}
          {(!images || !Array.isArray(images) || images.length === 0) && (
            <div className="text-center py-4 text-gray-500">
              <Upload size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium mb-1">No images uploaded yet</p>
              <p className="text-xs">
                Add product images to help customers see what they're buying
              </p>
            </div>
          )}
        </div>

        <div className="mt-2 text-center">
          <p className="text-sm text-gray-500">Upload up to 10 images. First image will be the primary image.</p>
          <p className="text-xs text-gray-400 mt-1">Supported: JPG, PNG, WebP (Max: 5MB each)</p>
        </div>
      </div>
    </div>
  );
};

export default ProductImagesSection;
