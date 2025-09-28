import React from 'react';
import { Package } from 'lucide-react';

interface ProductData {
  name: string;
  price: string;
  specifications: string;
  image: string | null;
  brand: string;
}

interface TemplateSettings {
  layout: 'portrait' | 'landscape' | 'square';
  theme: 'light' | 'dark' | 'minimal' | 'bold';
  priceSize: number;
  specSize: number;
  textColor: string;
  backgroundColor: string;
  pricePosition: { x: number; y: number };
  specPosition: { x: number; y: number };
  imageSettings: {
    brightness: number;
    contrast: number;
    saturation: number;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
  };
}

interface ProductAdTemplateProps {
  productData: ProductData;
  templateSettings?: TemplateSettings;
  className?: string;
}

const ProductAdTemplate: React.FC<ProductAdTemplateProps> = ({ 
  productData, 
  templateSettings,
  className = '' 
}) => {
  const { name, price, specifications, image, brand } = productData;
  
  // Default settings if not provided
  const settings = templateSettings || {
    layout: 'portrait' as const,
    theme: 'light' as const,
    priceSize: 36,
    specSize: 18,
    textColor: '#000000',
    backgroundColor: '#ffffff',
    pricePosition: { x: 50, y: 20 },
    specPosition: { x: 50, y: 35 },
    imageSettings: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      position: { x: 0, y: 0 },
      scale: 100,
      rotation: 0
    }
  };

  return (
    <>

      {/* Central Content */}
      <div className="absolute top-12 left-8 right-8 z-10">
        {/* Price */}
        <div className="text-center">
          <h1 
            className="font-bold leading-tight font-inter"
            style={{ 
              fontSize: `${settings.priceSize}px`,
              color: settings.textColor
            }}
          >
            {price}
          </h1>
        </div>

        {/* Specifications */}
        <div className="text-center">
          <p 
            className="font-normal leading-relaxed font-inter"
            style={{ 
              fontSize: `${settings.specSize}px`,
              color: settings.textColor
            }}
          >
            {specifications}
          </p>
        </div>
      </div>

      {/* Product Image */}
      <div className="absolute bottom-8 left-0 right-0 h-2/3 flex items-center justify-center">
        {image ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={image}
              alt={name}
              className="max-w-full max-h-full object-contain bg-transparent"
              style={{ 
                backgroundColor: 'transparent',
                mixBlendMode: 'normal',
                filter: `brightness(${settings.imageSettings.brightness}%) contrast(${settings.imageSettings.contrast}%) saturate(${settings.imageSettings.saturation}%)`,
                transform: `scale(${settings.imageSettings.scale / 100}) rotate(${settings.imageSettings.rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-inter">No image uploaded</p>
            </div>
          </div>
        )}
      </div>


      {/* Bottom Right Corner - Call to Action Button */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="w-16 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
        </div>
      </div>
    </>
  );
};

export default ProductAdTemplate;
