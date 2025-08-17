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

  // Get price display - show only the cheapest price
  const getPriceDisplay = () => {
    if (!product.variants || product.variants.length === 0) {
      return 'No price set';
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

  // Default detailed variant with cart-style UI
  return (
    <>
      <div 
        className={`relative bg-white border-2 border-gray-200 rounded-xl transition-all duration-300 hover:border-gray-300 hover:shadow-md active:scale-95 ${className} ${
          !primaryVariant || primaryVariant.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handleCardClick}
      >
        
        {/* Stock Count Badge - Card Corner */}
        {showStockInfo && getTotalStock() > 0 && (
          <div className={`absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-10 ${
            getTotalStock() >= 1000 ? 'w-12 h-8 px-3' : getTotalStock() >= 100 ? 'w-10 h-8 px-3' : 'w-8 h-8'
          }`}>
            <span className="text-base font-bold text-white">
              {getTotalStock() >= 1000 ? `${(getTotalStock() / 1000).toFixed(1)}K` : getTotalStock()}
            </span>
          </div>
        )}
        {/* Product Card Header */}
        <div className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Product Icon */}
              <div className="relative w-20 h-20 rounded-xl flex items-center justify-center text-lg font-bold bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                {thumbnail ? (
                  <img 
                    src={thumbnail} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <Package className="w-8 h-8" />
                )}
                
                {/* Variant Count Badge */}
                {product.variants && product.variants.length > 1 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {product.variants.length}
                    </span>
                  </div>
                )}
              </div>

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
          {primaryVariant && primaryVariant.quantity <= 5 && primaryVariant.quantity > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <div className="text-sm">
                  <span className="font-medium text-amber-900">Low Stock:</span>
                  <span className="text-amber-700 ml-1">Only {primaryVariant.quantity} units remaining</span>
                </div>
              </div>
            </div>
          )}
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
    </>
  );
};

export default VariantProductCard;
