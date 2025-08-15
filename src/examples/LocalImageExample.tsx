import React from 'react';
import { LocalImageManager } from '../components/LocalImageManager';

export const LocalImageExample: React.FC = () => {
  // Example product ID and user ID
  const productId = 'example-product-123';
  const userId = 'example-user-456';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Local Image Storage Example
        </h1>
        <p className="text-gray-600">
          This example shows how to use the local image storage system for product images.
          Images are stored directly on your hosting server instead of using external storage.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Product Images
        </h2>
        
        <LocalImageManager
          productId={productId}
          userId={userId}
        />
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Implementation Notes
        </h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Images are stored in: <code>/public_html/uploads/products/{productId}/</code></li>
          <li>• Database tracks file paths in the <code>local_path</code> column</li>
          <li>• Server upload handler processes files and creates database records</li>
          <li>• Supports multiple image formats: JPG, PNG, GIF, WebP</li>
          <li>• Maximum file size: 10MB per image</li>
        </ul>
      </div>
    </div>
  );
};
