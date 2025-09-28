import React, { useState, useRef } from 'react';
import { Upload, Star, X, Check, AlertTriangle, Plus, Clipboard } from 'lucide-react';
import { RobustImageService, ProductImage } from '../lib/robustImageService';
import { useClipboardImage } from '../hooks/useClipboardImage';
import { toast } from 'react-hot-toast';

interface SimpleImageUploadProps {
  productId?: string;
  userId?: string;
  onImagesChange?: (images: ProductImage[]) => void;
  maxFiles?: number;
  className?: string;
  existingImages?: ProductImage[]; // Add prop for existing images
}

export const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  productId,
  userId,
  onImagesChange,
  maxFiles = 5,
  className = '',
  existingImages = [] // Default to empty array
}) => {
  const [images, setImages] = useState<ProductImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [whiteBackground, setWhiteBackground] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  
  // Global clipboard detection
  const { hasClipboardImage, pasteFromClipboard, isCheckingClipboard } = useClipboardImage();
  
  // Local storage for temporary products
  const [tempImages, setTempImages] = useState<Map<string, ProductImage[]>>(new Map());

  // Update images when existingImages prop changes
  React.useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      setImages(existingImages);
    }
  }, [existingImages]);

  // Load existing images on mount (only if no existing images provided)
  React.useEffect(() => {
    // Only load images if we have a real product ID and no existing images
    if (productId && typeof productId === 'string' && !productId.startsWith('temp-product-') && !productId.startsWith('test-product-') && !productId.startsWith('temp-sparepart-') && existingImages.length === 0) {
      loadImages();
    }
  }, [productId, existingImages.length]);

  // Handle paste events when focused (for Ctrl+V)
  React.useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      if (!isFocused || uploading || !productId || !userId) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        event.preventDefault();
        await handleFiles(imageFiles);
      }
    };

    if (isFocused) {
      document.addEventListener('paste', handlePaste);
    }

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isFocused, uploading, productId, userId, images.length, maxFiles]);

  // Handle paste button click using global clipboard detection
  const handlePasteClick = async () => {
    if (!productId || !userId || uploading) return;

    try {
      const imageFiles = await pasteFromClipboard();
      
      if (imageFiles.length > 0) {
        await handleFiles(imageFiles);
      } else {
        toast.error('No images found in clipboard');
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      toast.error('Failed to paste image from clipboard');
    }
  };

  const loadImages = async () => {
    try {
      if (!productId) return;
      
      // For temporary products, load from local storage
      if (productId && typeof productId === 'string' && (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || productId.startsWith('temp-sparepart-'))) {
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

  const handleFiles = async (files: File[]) => {
    if (uploading || !productId || !userId) return;

    if (images.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isPrimary = images.length === 0 && i === 0; // First image becomes primary if no images exist

        const result = await RobustImageService.uploadImage(file, productId, userId, isPrimary);
        
        if (result.success && result.image) {
          
          // Handle temporary products differently
          if (productId && typeof productId === 'string' && (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || productId.startsWith('temp-sparepart-'))) {
            const currentTempImages = tempImages.get(productId) || [];
            const newTempImages = [...currentTempImages, result.image!];
            setTempImages(prev => new Map(prev).set(productId, newTempImages));
            setImages(newTempImages);
            onImagesChange?.(newTempImages);
          } else {
            setImages(prev => [...prev, result.image!]);
            onImagesChange?.([...images, result.image!]);
          }
          
          const source = file.name || 'pasted image';
          toast.success(`Uploaded ${source}`);
        } else {
          console.error('❌ Upload failed:', result.error);
          const source = file.name || 'pasted image';
          toast.error(`Failed to upload ${source}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Upload process failed:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    await handleFiles(Array.from(files));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this image?') || !productId) return;

    setDeleting(imageId);
    try {
      const result = await RobustImageService.deleteImage(imageId);
      if (result.success) {
        // Handle temporary products differently
        if (productId && typeof productId === 'string' && (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || productId.startsWith('temp-sparepart-'))) {
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
    if (!productId) return;
    
    try {
      const result = await RobustImageService.setPrimaryImage(imageId, productId);
      if (result.success) {
        // Handle temporary products differently
        if (productId.startsWith('temp-product-') || productId.startsWith('test-product-') || productId.startsWith('temp-sparepart-')) {
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
            ref={uploadAreaRef}
            className={`border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer backdrop-blur-sm relative ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 shadow-lg' 
                : isFocused
                ? 'border-blue-400 bg-blue-50/50 shadow-md'
                : 'border-gray-300 hover:border-blue-400 bg-white/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              // Only blur if focus is not moving to a child element
              if (!uploadAreaRef.current?.contains(e.relatedTarget as Node)) {
                setIsFocused(false);
                setHasClipboardImage(false);
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label="Upload images"
          >
            {/* Upload Area Content */}
            {images.length === 0 ? (
              // Empty state - show upload icon and text
              <div className="text-center">
                {uploading ? (
                  <div className="mx-auto h-12 w-12 text-blue-500 mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <Upload className="h-12 w-12" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    {uploading 
                      ? 'Uploading...' 
                      : isDragOver 
                        ? 'Drop Images Here'
                        : 'Upload Product Images'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {uploading 
                      ? 'Please wait while your images are being processed...'
                      : isDragOver
                        ? 'Release to upload your images'
                        : isFocused 
                          ? `Click to select images, drag and drop, or paste from clipboard (Ctrl+V). Maximum ${maxFiles} images allowed.`
                          : `Click here to select images or drag and drop. Click to enable paste from clipboard. Maximum ${maxFiles} images allowed.`
                    }
                  </p>
                </div>
              </div>
            ) : (
              // Images exist - show image grid with plus box
              <div className="space-y-4">
                {/* Image Grid with Plus Box */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Existing Images */}
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      {/* Image */}
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                        <img
                          src={image.url}
                          alt={image.fileName}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Upload Progress Overlay */}
                        {uploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-center text-white">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <p className="text-xs">Uploading...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {/* Set Primary Button */}
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

                      {/* Primary Badge */}
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                          <Star className="w-3 h-3" />
                          <span className="text-xs font-medium">Primary</span>
                        </div>
                      )}

                      {/* Upload Success Badge */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white rounded-full p-1 shadow-lg">
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
                  
                  {/* Plus Box for Adding More */}
                  <div 
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50 flex items-center justify-center cursor-pointer transition-all group"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <div className="text-center">
                      <div className="mx-auto h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-2">
                        <Plus className="h-8 w-8" />
                      </div>
                      <p className="text-xs text-gray-600 group-hover:text-blue-600 font-medium">
                        Add More
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paste Button - shown when focused and clipboard has image */}
            {isFocused && hasClipboardImage && !uploading && (
              <div className="absolute top-3 right-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteClick();
                  }}
                  onFocus={() => setIsFocused(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-lg transition-all duration-200 transform hover:scale-105"
                  title="Paste image from clipboard"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Paste</span>
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={uploading}
              aria-label="Select image files (JPG, PNG, WebP)"
            />
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && images.length === 0 && (
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
