import React, { useState } from 'react';
import { LocalImageManager } from '../components/LocalImageManager';

export const LocalStorageTestPage: React.FC = () => {
  const [productId] = useState('test-product-' + Date.now());
  const [userId] = useState('test-user-' + Date.now());

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🖼️ Local Image Storage Test
        </h1>
        <p className="text-gray-600 mb-4">
          Testing the local image storage system. Images will be stored on your hosting server.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Test Information</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div>Product ID: <code className="bg-blue-100 px-2 py-1 rounded">{productId}</code></div>
            <div>User ID: <code className="bg-blue-100 px-2 py-1 rounded">{userId}</code></div>
            <div>Storage: <code className="bg-blue-100 px-2 py-1 rounded">Local Server</code></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Image Upload & Management
        </h2>
        
        <LocalImageManager
          productId={productId}
          userId={userId}
          onUploadComplete={(images) => {
            console.log('✅ Upload completed:', images);
          }}
          onUploadError={(error) => {
            console.error('❌ Upload error:', error);
          }}
        />
      </div>

      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">✅ System Ready</h3>
        <p className="text-green-800 text-sm">
          The local image storage system is now active. Images will be stored locally on your hosting server 
          instead of using external storage services.
        </p>
        <p className="text-green-800 text-sm mt-2">
          <strong>Support:</strong> Call 0712378850 for assistance with server setup.
        </p>
      </div>
    </div>
  );
};
