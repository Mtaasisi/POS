import React, { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { ImageGallery } from './ImageGallery';
import { ImageUploadService } from '../lib/imageUpload';

export const ImageUploadTest: React.FC = () => {
  const [productId] = useState('test-product-' + Date.now());
  const [userId] = useState('test-user-' + Date.now());
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);

  const handleUploadComplete = (images: any[]) => {
    console.log('✅ Upload completed:', images);
    setUploadedImages(prev => [...prev, ...images]);
  };

  const handleUploadError = (error: string) => {
    console.error('❌ Upload error:', error);
  };

  const handleImagesChange = (images: any[]) => {
    console.log('🔄 Images changed:', images);
    setUploadedImages(images);
  };

  const testService = async () => {
    try {
      console.log('🧪 Testing ImageUploadService...');
      
      // Test getting images
      const images = await ImageUploadService.getProductImages(productId);
      console.log('📸 Retrieved images:', images);
      
    } catch (error) {
      console.error('❌ Service test failed:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Image Upload System Test
        </h1>
        <p className="text-gray-600 mb-8">
          Testing the new perfect image upload system
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Test Information</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div>Product ID: <code className="bg-blue-100 px-2 py-1 rounded">{productId}</code></div>
            <div>User ID: <code className="bg-blue-100 px-2 py-1 rounded">{userId}</code></div>
          </div>
        </div>

        <button
          onClick={testService}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Test Service
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Component */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Image Upload
          </h2>
          <ImageUpload
            productId={productId}
            userId={userId}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFiles={5}
          />
        </div>

        {/* Gallery Component */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Image Gallery
          </h2>
          <ImageGallery
            productId={productId}
            onImagesChange={handleImagesChange}
          />
        </div>
      </div>

      {/* Uploaded Images Summary */}
      {uploadedImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upload Summary
          </h2>
          <div className="space-y-2">
            {uploadedImages.map((image, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={image.url} 
                  alt={image.fileName}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{image.fileName}</div>
                  <div className="text-sm text-gray-500">
                    {(image.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {image.isPrimary && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
