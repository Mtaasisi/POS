import React, { useState } from 'react';
import { SimpleImageUpload } from './SimpleImageUpload';
import { SimpleImageDisplay, SimpleImageGallery } from './SimpleImageDisplay';
import { ProductImage } from '../lib/robustImageService';
import { useAuth } from '../context/AuthContext';

// Example 1: Simple Product Card with Image
export const ProductCardExample: React.FC<{ productId: string; productName: string }> = ({
  productId,
  productName
}) => {
  const [images, setImages] = useState<ProductImage[]>([]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-start space-x-4">
        {/* Product Image */}
        <SimpleImageDisplay
          images={images}
          productName={productName}
          size="lg"
          className="flex-shrink-0"
        />
        
        {/* Product Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{productName}</h3>
          <p className="text-sm text-gray-600">Product description here...</p>
        </div>
      </div>
    </div>
  );
};

// Example 2: Product Form with Image Upload
export const ProductFormExample: React.FC<{ productId: string }> = ({ productId }) => {
  const { currentUser } = useAuth();
  const [images, setImages] = useState<ProductImage[]>([]);

  if (!currentUser) return <div>Please log in</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6">Add Product Images</h2>
      
      <SimpleImageUpload
        productId={productId}
        userId={currentUser.id}
        onImagesChange={setImages}
        maxFiles={5}
      />
      
      <div className="mt-4 text-sm text-gray-600">
        {images.length > 0 ? (
          <p>✅ {images.length} image(s) uploaded successfully</p>
        ) : (
          <p>📷 No images uploaded yet</p>
        )}
      </div>
    </div>
  );
};

// Example 3: Product Grid with Images
export const ProductGridExample: React.FC<{ products: Array<{ id: string; name: string; images: ProductImage[] }> }> = ({
  products
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Product Image */}
          <div className="aspect-square">
            <SimpleImageDisplay
              images={product.images}
              productName={product.name}
              size="xl"
              className="w-full h-full"
            />
          </div>
          
          {/* Product Info */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {product.images.length} image(s)
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Example 4: Product Detail with Image Gallery
export const ProductDetailExample: React.FC<{ productId: string; productName: string }> = ({
  productId,
  productName
}) => {
  const { currentUser } = useAuth();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);

  if (!currentUser) return <div>Please log in</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <SimpleImageDisplay
              images={selectedImage ? [selectedImage] : images}
              productName={productName}
              size="xl"
              className="w-full h-full"
            />
          </div>
          
          {/* Image Gallery */}
          {images.length > 1 && (
            <SimpleImageGallery
              images={images}
              productName={productName}
              maxDisplay={4}
              onImageClick={setSelectedImage}
            />
          )}
        </div>
        
        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">{productName}</h1>
          
          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product Images</h3>
            <SimpleImageUpload
              productId={productId}
              userId={currentUser.id}
              onImagesChange={setImages}
              maxFiles={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Example 5: Quick Upload Widget
export const QuickUploadWidget: React.FC<{ productId: string }> = ({ productId }) => {
  const { currentUser } = useAuth();
  const [images, setImages] = useState<ProductImage[]>([]);

  if (!currentUser) return null;

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-3">Quick Image Upload</h4>
      
      <SimpleImageUpload
        productId={productId}
        userId={currentUser.id}
        onImagesChange={setImages}
        maxFiles={3}
        className="text-sm"
      />
      
      {images.length > 0 && (
        <div className="mt-3 text-sm text-blue-700">
          <p>✅ {images.length} image(s) ready</p>
        </div>
      )}
    </div>
  );
};
