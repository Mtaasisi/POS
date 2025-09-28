import React, { useState } from 'react';
import { Camera, Info } from 'lucide-react';
import { SimpleImageUpload } from '../../../../components/SimpleImageUpload';
import { FloatingPasteButton } from '../../../../components/FloatingPasteButton';
import { useClipboardImage } from '../../../../hooks/useClipboardImage';
import { RobustImageService } from '../../../../lib/robustImageService';
import { toast } from 'react-hot-toast';

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
  productId?: string;
}

const ProductImagesSection: React.FC<ProductImagesSectionProps> = ({
  images,
  setImages,
  currentUser,
  productId
}) => {
  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const hasImages = Boolean(images && Array.isArray(images) && images.length > 0);

  // Generate a temporary product ID if none is provided
  const tempProductId = productId || `temp-product-${Date.now()}`;

  return (
    <div className="border-b border-gray-200 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Camera size={18} className="text-purple-600" />
          Product Images
          {hasImages && (
            <span className="text-xs font-normal text-gray-500">({images?.length || 0})</span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Format Info Button */}
          <button
            type="button"
            onClick={() => setShowFormatInfo(!showFormatInfo)}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            title="Image format information"
          >
            <Info size={16} />
            Formats
          </button>
        </div>
      </div>

      {/* SimpleImageUpload Component - Handles everything */}
      <SimpleImageUpload
        productId={tempProductId}
        userId={currentUser?.id}
        existingImages={images?.map((img) => {
          if (typeof img === 'string') {
            return {
              id: `string-${crypto.randomUUID()}`,
              url: img,
              image_url: img,
              fileName: 'Image',
              fileSize: 0,
              isPrimary: false,
              uploadedAt: new Date().toISOString()
            };
          }
          return {
            id: img.id || `img-${crypto.randomUUID()}`,
            url: img.url || img.image_url || '',
            image_url: img.image_url || img.url || '',
            thumbnail_url: img.thumbnail_url,
            fileName: img.fileName || img.file_name || 'Image',
            fileSize: img.fileSize || img.file_size || 0,
            isPrimary: img.isPrimary || img.is_primary || false,
            uploadedAt: img.uploadedAt || img.created_at || new Date().toISOString(),
            mimeType: img.mimeType
          };
        }) || []}
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
        }}
        maxFiles={10}
        className="w-full"
      />
      
      {/* Format Information */}
      {showFormatInfo && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Info size={16} />
            Image Format Guide
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">WebP</span>
              <span className="text-xs text-blue-700">Best for product images - smaller files, better quality</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-green-800 bg-green-100 px-2 py-1 rounded">PNG</span>
              <span className="text-xs text-green-700">Best for logos/graphics with transparency</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-orange-800 bg-orange-100 px-2 py-1 rounded">JPEG</span>
              <span className="text-xs text-orange-700">Good for photographs, widely supported</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            <p>💡 <strong>Recommended:</strong> Use WebP format for the best balance of quality and file size</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImagesSection;