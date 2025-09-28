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

interface MarketingElements {
  ctaButton: {
    text: string;
    color: string;
    position: 'top' | 'bottom' | 'center';
    enabled: boolean;
  };
  promotionalBadge: {
    text: string;
    color: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    enabled: boolean;
  };
  urgencyText: {
    text: string;
    enabled: boolean;
  };
  rating: {
    stars: number;
    enabled: boolean;
  };
  discount: {
    percentage: number;
    enabled: boolean;
  };
}

interface ProductAdTemplateProps {
  productData: ProductData;
  templateSettings?: TemplateSettings;
  marketingElements?: MarketingElements;
  className?: string;
}

const ProductAdTemplate: React.FC<ProductAdTemplateProps> = ({ 
  productData, 
  templateSettings,
  marketingElements,
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
      {/* Promotional Badge */}
      {marketingElements?.promotionalBadge.enabled && (
        <div className={`absolute z-20 ${
          marketingElements.promotionalBadge.position === 'top-left' ? 'top-4 left-4' :
          marketingElements.promotionalBadge.position === 'top-right' ? 'top-4 right-4' :
          marketingElements.promotionalBadge.position === 'bottom-left' ? 'bottom-4 left-4' :
          'bottom-4 right-4'
        }`}>
          <div 
            className="px-3 py-1 rounded-full text-white text-sm font-bold"
            style={{ backgroundColor: marketingElements.promotionalBadge.color }}
          >
            {marketingElements.promotionalBadge.text}
          </div>
        </div>
      )}

      {/* Discount Badge */}
      {marketingElements?.discount.enabled && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            {marketingElements.discount.percentage}% OFF
          </div>
        </div>
      )}

      {/* Urgency Text */}
      {marketingElements?.urgencyText.enabled && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse">
            {marketingElements.urgencyText.text}
          </div>
        </div>
      )}

      {/* Rating */}
      {marketingElements?.rating.enabled && (
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center bg-white bg-opacity-90 px-2 py-1 rounded-full">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${star <= marketingElements.rating.stars ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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


      {/* CTA Button */}
      {marketingElements?.ctaButton.enabled ? (
        <div className={`absolute z-20 ${
          marketingElements.ctaButton.position === 'top' ? 'top-20 left-1/2 transform -translate-x-1/2' :
          marketingElements.ctaButton.position === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
          'bottom-8 left-1/2 transform -translate-x-1/2'
        }`}>
          <button 
            className="px-6 py-3 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: marketingElements.ctaButton.color }}
          >
            {marketingElements.ctaButton.text}
          </button>
        </div>
      ) : (
        /* Default Bottom Right Corner - Call to Action Button */
        <div className="absolute bottom-8 right-8 z-10">
          <div className="w-16 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductAdTemplate;
