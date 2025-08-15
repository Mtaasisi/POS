import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Package, ChevronDown, ChevronUp, Tag, Hash, Plus, Minus, Search, AlertCircle, Image, X } from 'lucide-react';
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
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<ProductSearchVariant | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Get primary variant using utility function
  const primaryVariant = getPrimaryVariant(product);
  
  // Get stock status using utility function
  const stockStatus = getProductStockStatus(product);

  // Get stock status badge
  const getStockStatusBadge = () => {
    if (!primaryVariant) return null;
    
    switch (stockStatus) {
      case 'out-of-stock':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Out of Stock</span>;
      case 'low':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">Low Stock</span>;
      default:
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">In Stock</span>;
    }
  };

  // Get price display using utility function
  const getPriceDisplay = () => {
    return getProductDisplayPrice(product);
  };

  // Get total stock using utility function
  const getTotalStock = () => {
    return getProductTotalStock(product);
  };

  // Handle card click
  const handleCardClick = () => {
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

  // Get product thumbnail
  const getProductThumbnail = () => {
    // Check if product has images
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  const thumbnail = getProductThumbnail();

  // Compact variant with subtle colors
  if (variant === 'compact') {
    return (
      <>
        <div 
          className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-md active:scale-95 ${className} ${
            !primaryVariant || primaryVariant.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleCardClick}
          style={{ minHeight: '60px' }}
        >
          <div className="flex items-center gap-2">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {thumbnail ? (
                <div className="w-10 h-10 bg-blue-50 rounded-lg overflow-hidden border border-blue-100">
                  <img 
                    src={thumbnail} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center hidden">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-gray-900 truncate text-sm">{product.name}</h3>
                {getStockStatusBadge()}
              </div>
              <p className="text-xs text-gray-500 font-mono">{primaryVariant?.sku || 'N/A'}</p>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="font-semibold text-blue-900 text-sm">{getPriceDisplay()}</div>
              <div className="text-xs text-gray-500">Stock: {getTotalStock()}</div>
            </div>
          </div>
        </div>


      </>
    );
  }

  // Default detailed variant with subtle colors
  return (
    <>
      <div 
        className={`bg-white border border-gray-200 rounded-lg p-5 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-md active:scale-95 ${className} ${
          !primaryVariant || primaryVariant.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handleCardClick}
        style={{ minHeight: '80px' }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {thumbnail ? (
              <div className="w-14 h-14 bg-blue-50 rounded-lg overflow-hidden border border-blue-100">
                <img 
                  src={thumbnail} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center hidden">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900 text-base">{product.name}</h3>
              {getStockStatusBadge()}
            </div>
            <p className="text-xs text-gray-500 font-mono mb-2">{primaryVariant?.sku || 'N/A'}</p>
            
            {/* Category and Brand */}
            <div className="flex items-center gap-2 text-xs">
              {showCategory && product.categoryName && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  <span className="font-medium">{product.categoryName}</span>
                </span>
              )}
              {showBrand && product.brandName && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <span className="font-medium">{product.brandName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price and Stock */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-blue-900">{getPriceDisplay()}</div>
              {showStockInfo && (
                <div className="text-xs text-gray-600 mt-1">
                  Stock: <span className="font-semibold text-gray-800">{getTotalStock()}</span> units
                </div>
              )}
            </div>
            {hasMultipleVariants && (
              <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                Choose variant
              </div>
            )}
          </div>
        </div>

        {/* Action hint */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xs text-blue-600 font-medium">
              {hasMultipleVariants ? 'Tap to choose variant' : 'Tap to add to cart'}
            </div>
          </div>
        </div>

        {/* Stock Warning */}
        {primaryVariant && primaryVariant.quantity <= 5 && primaryVariant.quantity > 0 && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <div className="text-xs">
                <span className="font-medium text-amber-900">Low Stock:</span>
                <span className="text-amber-700 ml-1">Only {primaryVariant.quantity} units remaining</span>
              </div>
            </div>
          </div>
        )}
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
    </>
  );
};

export default VariantProductCard;
