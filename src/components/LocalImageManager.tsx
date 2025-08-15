import React, { useState } from 'react';
import { LocalImageUpload } from './LocalImageUpload';
import { LocalImageGallery } from './LocalImageGallery';
import { LocalImageData } from '../lib/localImageStorage';

interface LocalImageManagerProps {
  productId: string;
  userId: string;
  className?: string;
  onUploadComplete?: (images: LocalImageData[]) => void;
  onUploadError?: (error: string) => void;
}

export const LocalImageManager: React.FC<LocalImageManagerProps> = ({
  productId,
  userId,
  className = '',
  onUploadComplete,
  onUploadError
}) => {
  const [images, setImages] = useState<LocalImageData[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');

  const handleUploadComplete = (uploadedImages: LocalImageData[]) => {
    setImages(prev => [...prev, ...uploadedImages]);
    setActiveTab('gallery');
    onUploadComplete?.(uploadedImages);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    onUploadError?.(error);
  };

  const handleImagesChange = (updatedImages: LocalImageData[]) => {
    setImages(updatedImages);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload Images
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gallery'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Image Gallery ({images.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'upload' && (
        <LocalImageUpload
          productId={productId}
          userId={userId}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      )}

      {activeTab === 'gallery' && (
        <LocalImageGallery
          productId={productId}
          onImagesChange={handleImagesChange}
        />
      )}
    </div>
  );
};
