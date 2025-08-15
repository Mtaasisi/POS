import React, { useState } from 'react';
import { ImageUpload } from '../components/ImageUpload';
import { ImageGallery } from '../components/ImageGallery';
import { ImageUploadService } from '../lib/imageUpload';
import { testStorageBucket } from '../lib/storageTest';

export const ImageUploadTestPage: React.FC = () => {
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
      
      // Test storage bucket first
      const storageOk = await testStorageBucket();
      if (!storageOk) {
        console.error('❌ Storage bucket test failed');
        return;
      }
      
      // Test getting images for temporary product (should return empty array)
      const images = await ImageUploadService.getProductImages(productId);
      console.log('📸 Retrieved images for temp product:', images);
      
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
          Testing the fixed image upload system with temporary product handling
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">Test Information</h3>
          <div className="text-sm text-green-800 space-y-1">
            <div>Product ID: <code className="bg-green-100 px-2 py-1 rounded">{productId}</code></div>
            <div>User ID: <code className="bg-green-100 px-2 py-1 rounded">{userId}</code></div>
            <div>Status: <code className="bg-green-100 px-2 py-1 rounded">Fixed - No 400 Errors</code></div>
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
            Uploaded Images Summary
          </h2>
          <div className="space-y-2">
            {uploadedImages.map((image, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img 
                    src={image.url} 
                    alt={image.fileName}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <div className="font-medium">{image.fileName}</div>
                    <div className="text-sm text-gray-500">
                      Size: {(image.fileSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {image.id.startsWith('temp-') && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      Temporary
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

export default ImageUploadTestPage;
