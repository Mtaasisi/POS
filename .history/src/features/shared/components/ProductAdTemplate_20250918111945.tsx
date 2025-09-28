import React from 'react';
import { Package } from 'lucide-react';

interface ProductData {
  name: string;
  price: string;
  specifications: string;
  image: string | null;
  brand: string;
}

interface ProductAdTemplateProps {
  productData: ProductData;
  className?: string;
}

const ProductAdTemplate: React.FC<ProductAdTemplateProps> = ({ 
  productData, 
  className = '' 
}) => {
  const { name, price, specifications, image, brand } = productData;

  return (
    <>
      {/* Top Left Corner - Red Banner */}
      <div className="absolute top-0 left-0 z-10">
        <div className="bg-red-600 text-white px-4 py-2 text-sm font-semibold">
          U MTAASISI
        </div>
        <div className="bg-red-600 text-white px-2 py-8 text-sm font-semibold transform -rotate-90 origin-left">
          WE LOVE
        </div>
      </div>

      {/* Central Content */}
      <div className="absolute top-20 left-8 right-8 z-10">
        {/* Price */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-black leading-tight">
            {price}
          </h1>
        </div>

        {/* Specifications */}
        <div className="text-center">
          <p className="text-lg text-black font-medium leading-relaxed">
            {specifications}
          </p>
        </div>
      </div>

      {/* Product Image */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-center justify-center">
        {image ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={image}
              alt={name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No image uploaded</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Left Corner - Quality Features */}
      <div className="absolute bottom-8 left-8 z-10">
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-1 h-4 bg-red-600 mr-2"></div>
            <span className="text-red-600 font-semibold text-sm">Quality</span>
          </div>
          <div className="flex items-center">
            <div className="w-1 h-4 bg-red-600 mr-2"></div>
            <span className="text-red-600 font-semibold text-sm">Loyalty</span>
          </div>
          <div className="flex items-center">
            <div className="w-1 h-4 bg-red-600 mr-2"></div>
            <span className="text-red-600 font-semibold text-sm">Trust.</span>
          </div>
        </div>
      </div>

      {/* Bottom Right Corner - Call to Action Button */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="w-16 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
        </div>
      </div>

      {/* Bottom Left Corner - Abstract Design */}
      <div className="absolute bottom-2 left-2 w-6 h-16 z-10">
        <div className="w-full h-full bg-black">
          <div className="w-1 h-full bg-red-600 absolute left-0 top-0"></div>
          <div className="w-1 h-1/3 bg-red-600 absolute left-0 top-1/3"></div>
          <div className="w-1 h-1/3 bg-red-600 absolute left-0 top-2/3"></div>
        </div>
      </div>
    </>
  );
};

export default ProductAdTemplate;
