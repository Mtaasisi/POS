import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassButton from './GlassButton';
import ImageDisplay from './ImageDisplay';
import { 
  createThumbnail, 
  validateImageFile, 
  optimizeImageForWeb,
  getImageDimensions 
} from '../../lib/thumbnailService';

interface ProductImage {
  id?: string;
  image_url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
  is_primary: boolean;
  uploaded_by?: string;
  created_at?: string;
}

interface EnhancedImageUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  productId?: string;
  userId?: string;
  showOptimization?: boolean;
}

const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  className = '',
  disabled = false,
  productId,
  userId,
  showOptimization = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File): Promise<ProductImage> => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    
    // Optimize image if enabled
    let processedFile = file;
    if (showOptimization) {
      processedFile = await optimizeImageForWeb(file);
    }

    // Create thumbnail
    const thumbnailResult = await createThumbnail(processedFile, {
      width: 300,
      height: 300,
      quality: 85,
      format: 'webp'
    });

    // Create product image object
    const productImage: ProductImage = {
      image_url: thumbnailResult.originalUrl,
      thumbnail_url: thumbnailResult.thumbnailUrl,
      file_name: file.name,
      file_size: file.size,
      is_primary: images.length === 0, // First image is primary
    };

    return productImage;
  }, [images.length, showOptimization]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || disabled || uploading) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      toast.error('No valid image files selected');
      return;
    }

    if (images.length + validFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newImages: ProductImage[] = [];
    const progressUpdates: Record<string, number> = {};

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileId = `${file.name}-${Date.now()}`;
        
        // Update progress
        progressUpdates[fileId] = (i / validFiles.length) * 100;
        setUploadProgress(progressUpdates);

        try {
          const processedImage = await processImage(file);
          newImages.push(processedImage);
          
          // Update progress
          progressUpdates[fileId] = ((i + 1) / validFiles.length) * 100;
          setUploadProgress(progressUpdates);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}`);
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`Successfully processed ${newImages.length} image(s)`);
      }
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [images, maxImages, disabled, uploading, processImage, onImagesChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    
    // If removing primary image, make first remaining image primary
    if (index === 0 && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return; // Already primary
    
    const newImages = [...images];
    newImages.forEach((img, i) => {
      img.is_primary = i === index;
    });
    
    // Move primary image to first position
    const primaryImage = newImages.splice(index, 1)[0];
    newImages.unshift(primaryImage);
    
    onImagesChange(newImages);
    toast.success('Primary image updated');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Processing images...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Object.values(uploadProgress).length > 0 
                      ? Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.values(uploadProgress).length 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop images here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                Supports: JPG, PNG, WebP, GIF (Max {maxImages} images, 5MB each)
              </p>
              {showOptimization && (
                <p className="text-xs text-blue-500 mt-1">
                  Images will be automatically optimized
                </p>
              )}
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <ImageDisplay
                  imageUrl={image.image_url}
                  thumbnailUrl={image.thumbnail_url}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-center">
                  <span>{image.file_name}</span>
                  <span>{formatFileSize(image.file_size)}</span>
                </div>
              </div>
              
              {/* Action overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={() => setPrimaryImage(index)}
                      className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                      title="Set as primary"
                    >
                      <Star size={14} className="text-yellow-500" />
                    </button>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="p-1 bg-white rounded-full shadow-sm hover:bg-red-50"
                    title="Remove image"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
                
                {/* Primary indicator */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2">
                    <div className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex items-center gap-1">
                      <Star size={12} />
                      Primary
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image count and status */}
      {images.length > 0 && (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            {images.length} of {maxImages} images uploaded
          </p>
          {showOptimization && (
            <div className="flex items-center justify-center gap-2 text-xs text-green-600">
              <CheckCircle size={12} />
              <span>Images optimized for web</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedImageUpload; 