import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Package, ChevronDown, ChevronUp, Tag, Hash, Plus, Minus, Search, AlertCircle, Image } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { format } from '../../lib/format';
import { ProductSearchResult, ProductSearchVariant } from '../../types/pos';
import { 
  isSingleVariantProduct, 
  isMultiVariantProduct, 
  getPrimaryVariant, 
  getProductDisplayPrice, 
  getProductTotalStock,
  getProductStockStatus,
  getBestVariant 
} from '../../lib/productUtils';
import VariantSelectionPage from '../../pages/VariantSelectionPage';
import { SimpleImageDisplay } from '../../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../../lib/robustImageService';
import { ImagePopupModal } from '../../../../components/ImagePopupModal';
import { useGeneralSettingsUI } from '../../../../hooks/useGeneralSettingsUI';

interface VariantProductCardProps {
  product: ProductSearchResult;
  onAddToCart: (product: ProductSearchResult, variant: ProductSearchVariant, quantity: number) => void;
  onViewDetails?: (product: ProductSearchResult) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showStockInfo?: boolean;
  showCategory?: boolean;
  showBrand?: boolean;
  className?: string;
}

const VariantProductCard: React.FC<VariantProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  variant = 'default',
  showStockInfo = true,
  showCategory = true,
  showBrand = true,
  className = ''
}) => {
  // Get general settings
  const {
    showProductImages,
    showStockLevels,
    showPrices,
    showBarcodes
  } = useGeneralSettingsUI();

  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<ProductSearchVariant | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);

  // Get primary variant using utility function
  const primaryVariant = getPrimaryVariant(product);
  
  // Get stock status using utility function
  const stockStatus = getProductStockStatus(product);

  // Get stock status badge
  const getStockStatusBadge = () => {
    // Handle products with no variants
    if (!product.variants || product.variants.length === 0) {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">No Variants</span>;
    }
    
    if (!primaryVariant) return null;
    
    switch (stockStatus) {
      case 'out-of-stock':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Out of Stock</span>;
      case 'low-stock':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">Low Stock</span>;
      default:
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">In Stock</span>;
    }
  };

  // Get price display - show only the cheapest price
  const getPriceDisplay = () => {
    if (!product.variants || product.variants.length === 0) {
      return 'No variants';
    }

    // Get all valid prices
    const prices = product.variants
      .map(v => v.sellingPrice)
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return 'No price set';
    }

    // Return only the cheapest price
    return `$${prices[0].toFixed(2)}`;
  };

  // Get total stock using utility function
  const getTotalStock = () => {
    return getProductTotalStock(product);
  };

  // Handle card click
  const handleCardClick = () => {
    // Don't allow interaction for products with no variants
    if (!product.variants || product.variants.length === 0) {
      console.warn('⚠️ Cannot add product to cart: No variants available', product);
      return;
    }
    
    if (!primaryVariant || primaryVariant.quantity <= 0) return; // Don't do anything if out of stock
    
    if (isMultiVariantProduct(product)) {
      // If product has multiple variants, open the variant selection modal
      setShowVariantModal(true);
    } else {
      // If single variant, directly add to cart
      onAddToCart(product, primaryVariant, 1);
    }
  };

  // Handle variant selection
  const handleVariantSelect = (variant: ProductSearchVariant) => {
    setSelectedVariant(variant);
    onAddToCart(product, variant, 1); // Add selected variant to cart
    setShowVariantModal(false); // Close modal after selection
  };

  // Check if product has multiple variants using utility function
  const hasMultipleVariants = isMultiVariantProduct(product);

  // Convert product images to new format
  const convertToProductImages = (): ProductImage[] => {
    if (!product.images || product.images.length === 0) return [];
    
    return product.images.map((imageUrl, index) => ({
      id: `temp-${product.id}-${index}`,
      url: imageUrl,
      thumbnailUrl: imageUrl,
      fileName: `product-image-${index + 1}`,
      fileSize: 0,
      isPrimary: index === 0,
      uploadedAt: new Date().toISOString()
    }));
  };

  const productImages = convertToProductImages();

  // Compact variant with subtle colors
  if (variant === 'compact') {
    const hasNoVariants = !product.variants || product.variants.length === 0;
    const isDisabled = hasNoVariants || !primaryVariant || primaryVariant.quantity <= 0;
    
    return (
      <>
        <div 
          className={`bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200 ${className} ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300 hover:shadow-md active:scale-95'
          } ${hasNoVariants ? 'border-gray-300 bg-gray-50' : ''}`}
          onClick={handleCardClick}
          style={{ minHeight: '60px' }}
          title={hasNoVariants ? 'This product has no variants and cannot be added to cart. Please add variants in the inventory management.' : ''}
        >
          

          <div className="flex items-center gap-2">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <SimpleImageDisplay
                images={productImages}
                productName={product.name}
                size="sm"
                className="w-10 h-10 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  if (productImages.length > 0) {
                    setIsImagePopupOpen(true);
                  }
                }}
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-medium truncate text-sm ${hasNoVariants ? 'text-gray-500' : 'text-gray-900'}`}>{product.name}</h3>
                {getStockStatusBadge()}
              </div>
              <p className="text-xs text-gray-500 font-mono">{primaryVariant?.sku || 'N/A'}</p>
              
              {/* Compact Specifications Display */}
              {primaryVariant && primaryVariant.attributes && Object.keys(primaryVariant.attributes).length > 0 && (
                <div className="mt-1">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(primaryVariant.attributes).slice(0, 2).map(([key, value]) => {
                      // Get color based on specification type
                      const getSpecColor = (specKey: string) => {
                        const spec = specKey.toLowerCase();
                        if (spec.includes('ram')) return 'bg-green-100 text-green-700';
                        if (spec.includes('storage') || spec.includes('memory')) return 'bg-blue-100 text-blue-700';
                        if (spec.includes('processor') || spec.includes('cpu')) return 'bg-purple-100 text-purple-700';
                        if (spec.includes('screen') || spec.includes('display')) return 'bg-orange-100 text-orange-700';
                        if (spec.includes('battery')) return 'bg-teal-100 text-teal-700';
                        if (spec.includes('camera')) return 'bg-pink-100 text-pink-700';
                        if (spec.includes('color')) return 'bg-red-100 text-red-700';
                        if (spec.includes('size')) return 'bg-gray-100 text-gray-700';
                        return 'bg-indigo-100 text-indigo-700';
                      };
                      
                      return (
                        <span key={key} className={`px-1 py-0.5 rounded text-xs font-medium ${getSpecColor(key)}`}>
                          {key.replace(/_/g, ' ')}: {value}
                        </span>
                      );
                    })}
                    {Object.keys(primaryVariant.attributes).length > 2 && (
                      <span className="px-1 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                        +{Object.keys(primaryVariant.attributes).length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="text-right">
              {showPrices && (
                <div className={`font-semibold text-sm ${hasNoVariants ? 'text-gray-500' : 'text-blue-900'}`}>{getPriceDisplay()}</div>
              )}
              {showStockLevels && (
                <div className="text-xs text-gray-500">Stock: {getTotalStock()}</div>
              )}
            </div>
          </div>
        </div>

      </>
    );
  }

  // Default detailed variant with cart-style UI
  const hasNoVariants = !product.variants || product.variants.length === 0;
  const isDisabled = hasNoVariants || !primaryVariant || primaryVariant.quantity <= 0;
  
  return (
    <>
      <div 
        className={`relative bg-white border-2 rounded-xl transition-all duration-300 ${className} ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300 hover:shadow-md active:scale-95'
        } ${hasNoVariants ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}
        onClick={handleCardClick}
        title={hasNoVariants ? 'This product has no variants and cannot be added to cart. Please add variants in the inventory management.' : ''}
      >
        
        
        {/* Stock Count Badge - Card Corner */}
        {showStockLevels && showStockInfo && getTotalStock() > 0 && (
          <div className={`absolute top-2 right-2 p-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-20 w-10 h-10 ${
            getTotalStock() <= 5 ? 'bg-gradient-to-r from-red-500 to-red-600' :
            getTotalStock() <= 10 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
            'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}>
            <span className="text-sm font-bold text-white">
              {getTotalStock() >= 1000 ? `${(getTotalStock() / 1000).toFixed(1)}K` : getTotalStock()}
            </span>
          </div>
        )}
        {/* Product Card Header */}
        <div className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Product Icon */}
              {showProductImages && (
                <div className="relative w-20 h-20 rounded-xl flex items-center justify-center text-lg font-bold text-blue-600">
                  <SimpleImageDisplay
                    images={productImages}
                    productName={product.name}
                    size="lg"
                    className="w-full h-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (productImages.length > 0) {
                        setIsImagePopupOpen(true);
                      }
                    }}
                  />
                
                {/* Variant Count Badge */}
                {product.variants && product.variants.length > 1 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {product.variants.length}
                    </span>
                  </div>
                )}
                </div>
              )}

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate text-xl leading-tight">
                  {product.name}
                </div>
                <div className="text-2xl text-gray-700 mt-1 font-bold">
                  TSh {getPriceDisplay().replace('$', '').replace('.00', '').replace('.0', '')}
                </div>
              </div>
            </div>


          </div>

          {/* Primary Variant Specifications */}
          {primaryVariant && primaryVariant.attributes && Object.keys(primaryVariant.attributes).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Specifications:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(primaryVariant.attributes).slice(0, 4).map(([key, value]) => {
                  // Get color based on specification type
                  const getSpecColor = (specKey: string) => {
                    const spec = specKey.toLowerCase();
                    if (spec.includes('ram')) return 'bg-green-100 text-green-700 border-green-200';
                    if (spec.includes('storage') || spec.includes('memory')) return 'bg-blue-100 text-blue-700 border-blue-200';
                    if (spec.includes('processor') || spec.includes('cpu')) return 'bg-purple-100 text-purple-700 border-purple-200';
                    if (spec.includes('screen') || spec.includes('display')) return 'bg-orange-100 text-orange-700 border-orange-200';
                    if (spec.includes('battery')) return 'bg-teal-100 text-teal-700 border-teal-200';
                    if (spec.includes('camera')) return 'bg-pink-100 text-pink-700 border-pink-200';
                    if (spec.includes('color')) return 'bg-red-100 text-red-700 border-red-200';
                    if (spec.includes('size')) return 'bg-gray-100 text-gray-700 border-gray-200';
                    return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                  };
                  
                  return (
                    <span key={key} className={`px-2 py-1 rounded-md border text-xs font-medium ${getSpecColor(key)}`}>
                      {key.replace(/_/g, ' ')}: {value}
                    </span>
                  );
                })}
                {Object.keys(primaryVariant.attributes).length > 4 && (
                  <span className="px-2 py-1 rounded-md border border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium">
                    +{Object.keys(primaryVariant.attributes).length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {showStockInfo && (
                  <span className="text-gray-600">Stock: {getTotalStock()} units</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showCategory && product.categoryName && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                    {product.categoryName}
                  </span>
                )}
                {showBrand && product.brandName && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">
                    {product.brandName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stock Warning */}
          {/* {primaryVariant && primaryVariant.quantity <= 5 && primaryVariant.quantity > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <div className="text-sm">
                  <span className="font-medium text-amber-900">Low Stock:</span>
                  <span className="text-amber-700 ml-1">Only {primaryVariant.quantity} units remaining</span>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* Variant Selection Modal - Rendered at root level */}
      {showVariantModal && createPortal(
        <VariantSelectionPage
          isOpen={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          product={product}
          onSelectVariant={handleVariantSelect}
        />,
        document.body
      )}

      {/* Image Popup Modal */}
      {productImages.length > 0 && (
        <ImagePopupModal
          images={productImages}
          productName={product.name}
          isOpen={isImagePopupOpen}
          onClose={() => setIsImagePopupOpen(false)}
        />
      )}
    </>
  );
};

export default VariantProductCard;
