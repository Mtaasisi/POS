import React, { useState, useEffect } from 'react';
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
import { RealTimeStockService } from '../../lib/realTimeStock';
import VariantSelectionPage from '../../pages/VariantSelectionPage';
import { SimpleImageDisplay } from '../../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../../lib/robustImageService';
import { ImagePopupModal } from '../../../../components/ImagePopupModal';
import ProductInfoModal from './ProductInfoModal';
import { useGeneralSettingsUI } from '../../../../hooks/useGeneralSettingsUI';
import { getSpecificationIcon, getSpecificationTooltip, getShelfDisplay, getShelfIcon, formatSpecificationValue } from '../../lib/specificationUtils';

interface VariantProductCardProps {
  product: ProductSearchResult;
  onAddToCart: (product: ProductSearchResult, variant: ProductSearchVariant, quantity: number) => void;
  onViewDetails?: (product: ProductSearchResult) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showStockInfo?: boolean;
  showCategory?: boolean;

  className?: string;
  primaryColor?: 'blue' | 'orange' | 'green' | 'purple';
  actionText?: string;
  allowOutOfStockSelection?: boolean; // For purchase orders where we want to allow selecting out-of-stock products
}

const VariantProductCard: React.FC<VariantProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  variant = 'default',
  showStockInfo = true,
  showCategory = true,
  
  className = '',
  primaryColor = 'blue',
  actionText = 'Add to Cart',
  allowOutOfStockSelection = false
}) => {
  // Add error state for React refresh issues
  const [hasError, setHasError] = useState(false);

  // Real-time stock state
  const [realTimeStock, setRealTimeStock] = useState<Map<string, number>>(new Map());
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [lastStockUpdate, setLastStockUpdate] = useState<Date | null>(null);

  // Get general settings
  const generalSettings = useGeneralSettingsUI();
  const {
    showProductImages,
    showStockLevels,
    showPrices,
    showBarcodes
  } = generalSettings;

  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<ProductSearchVariant | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [isProductInfoOpen, setIsProductInfoOpen] = useState(false);
  const [showAllSpecifications, setShowAllSpecifications] = useState(false);

  // Reset error state on mount/remount (helps with React refresh)
  useEffect(() => {
    setHasError(false);
  }, []);

  // Fetch real-time stock when component mounts (with debouncing)
  useEffect(() => {
    if (product?.id) {
      // Add a small delay to prevent multiple rapid requests
      const timer = setTimeout(() => {
        fetchRealTimeStock();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [product?.id]);

  // Theme configuration based on primaryColor
  const getThemeConfig = () => {
    switch (primaryColor) {
      case 'orange':
        return {
          hoverBorder: 'hover:border-orange-300',
          textColor: 'text-orange-600',
          iconColor: 'text-orange-600',
          priceColor: 'text-orange-900',
          errorColor: 'text-orange-600'
        };
      case 'green':
        return {
          hoverBorder: 'hover:border-green-300',
          textColor: 'text-green-600',
          iconColor: 'text-green-600',
          priceColor: 'text-green-900',
          errorColor: 'text-green-600'
        };
      case 'purple':
        return {
          hoverBorder: 'hover:border-purple-300',
          textColor: 'text-purple-600',
          iconColor: 'text-purple-600',
          priceColor: 'text-purple-900',
          errorColor: 'text-purple-600'
        };
      default: // blue
        return {
          hoverBorder: 'hover:border-blue-300',
          textColor: 'text-blue-600',
          iconColor: 'text-blue-600',
          priceColor: 'text-blue-900',
          errorColor: 'text-blue-600'
        };
    }
  };

  const theme = getThemeConfig();

  // Defensive check for product
  if (!product) {
    console.error('VariantProductCard: Product is null or undefined');
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">Product data is missing</p>
      </div>
    );
  }

  // Get primary variant using utility function with error handling
  let primaryVariant;
  let stockStatus;
  try {
    primaryVariant = getPrimaryVariant(product);
    stockStatus = getProductStockStatus(product);
  } catch (error) {
    console.error('Error getting product data:', error);
    setHasError(true);
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">Error loading product data</p>
        <button 
          onClick={() => setHasError(false)}
          className="mt-2 text-blue-600 text-xs hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }
  
  // Get stock status using utility function
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

  // Fetch real-time stock data
  const fetchRealTimeStock = async () => {
    if (!product?.id) return;
    
    try {
      setIsLoadingStock(true);
      const stockService = RealTimeStockService.getInstance();
      const stockLevels = await stockService.getStockLevels([product.id]);
      setRealTimeStock(stockLevels);
      setLastStockUpdate(new Date());
    } catch (error) {
      console.error('❌ Error fetching real-time stock:', error);
    } finally {
      setIsLoadingStock(false);
    }
  };

  // Get real-time stock for current product
  const getRealTimeStockForProduct = (): number => {
    if (!product?.id) return 0;
    return realTimeStock.get(product.id) || 0;
  };

  // Get total stock using real-time data if available, otherwise fall back to cached data
  const getTotalStock = () => {
    const realTimeStockValue = getRealTimeStockForProduct();
    if (realTimeStockValue > 0 || realTimeStock.has(product.id)) {
      return realTimeStockValue;
    }
    return getProductTotalStock(product);
  };

  // Handle card click
  const handleCardClick = () => {
    // Don't allow interaction for products with no variants
    if (!product.variants || product.variants.length === 0) {
      console.warn('⚠️ Cannot add product to cart: No variants available', product);
      return;
    }
    
    // If onViewDetails is provided (like in purchase orders), use that instead
    if (onViewDetails) {
      onViewDetails(product);
      return;
    }
    
    // For purchase orders, allow out-of-stock products; for POS, block them
    if (!primaryVariant || (!allowOutOfStockSelection && primaryVariant.quantity <= 0)) {
      if (!allowOutOfStockSelection) {
        return; // Don't do anything if out of stock in POS mode
      }
    }
    
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
    if (!product.images || product.images.length === 0) {
      return [];
    }
    
    const convertedImages = product.images.map((imageUrl, index) => ({
      id: `temp-${product.id}-${index}`,
      url: imageUrl,
      thumbnailUrl: imageUrl,
      fileName: `product-image-${index + 1}`,
      fileSize: 0,
      isPrimary: index === 0,
      uploadedAt: new Date().toISOString()
    }));
    
    return convertedImages;
  };

  const productImages = convertToProductImages();

  // Compact variant with subtle colors
  if (variant === 'compact') {
    const hasNoVariants = !product.variants || product.variants.length === 0;
    const isDisabled = hasNoVariants || !primaryVariant || (!allowOutOfStockSelection && primaryVariant.quantity <= 0);
    
    return (
      <>
        <div 
          className={`bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200 ${className} ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${theme.hoverBorder} hover:shadow-md active:scale-95`
          } ${hasNoVariants ? 'border-gray-300 bg-gray-50' : ''}`}
          onClick={handleCardClick}
          style={{ minHeight: '60px' }}
          title={hasNoVariants ? 'This product has no variants and cannot be added to cart. Please add variants in the inventory management.' : `Click to ${actionText.toLowerCase()}`}
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
                  setIsProductInfoOpen(true);
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
              
              {/* Compact Specifications Display - Hidden */}
            </div>

            {/* Price */}
            <div className="text-right">
              {showPrices && (
                <div className={`font-semibold text-sm ${hasNoVariants ? 'text-gray-500' : theme.priceColor}`}>{getPriceDisplay()}</div>
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
  const isDisabled = hasNoVariants || !primaryVariant || (!allowOutOfStockSelection && primaryVariant.quantity <= 0);
  
  return (
    <>
      <div 
        className={`relative bg-white border-2 rounded-xl transition-all duration-300 ${className} ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${theme.hoverBorder} hover:shadow-md active:scale-95`
        } ${hasNoVariants ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}
        onClick={handleCardClick}
        title={hasNoVariants ? 'This product has no variants and cannot be added to cart. Please add variants in the inventory management.' : `Click to ${actionText.toLowerCase()}`}
      >
        
        
        {/* Stock Count Badge - Card Corner */}
        {showStockLevels && showStockInfo && getTotalStock() > 0 && (
          <div className={`absolute top-2 right-2 p-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-20 w-10 h-10 ${
            getTotalStock() <= 5 ? 'bg-gradient-to-r from-red-500 to-red-600' :
            getTotalStock() <= 10 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
            'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}>
            <span className="text-sm font-bold text-white">
              {isLoadingStock ? '...' : (getTotalStock() >= 1000 ? `${(getTotalStock() / 1000).toFixed(1)}K` : getTotalStock())}
            </span>
            {isLoadingStock && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}
        {/* Product Card Header */}
        <div className="p-6 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Product Icon */}
              {showProductImages && (
                <div className={`relative w-20 h-20 rounded-xl flex items-center justify-center text-lg font-bold ${theme.iconColor}`}>
                  <SimpleImageDisplay
                    images={productImages}
                    productName={product.name}
                    size="lg"
                    className="w-full h-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProductInfoOpen(true);
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

          {/* Primary Variant Specifications - Hidden */}


          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {/* Shelf Information */}
                {(product.shelfName || product.shelfCode || product.storeLocationName) && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                      📦 {product.shelfName || product.shelfCode || product.storeLocationName || 'Shelf Info'}
                    </span>
                  </div>
                )}
                

              </div>
              <div className="flex items-center gap-2">
                {showCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                    {product.categoryName || 'Uncategorized'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Indicator */}
          {!isDisabled && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className={`text-center text-sm font-medium ${theme.textColor} opacity-70 hover:opacity-100 transition-opacity`}>
                Click to {actionText}
              </div>
            </div>
          )}

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

      {/* Product Info Modal */}
      <ProductInfoModal
        isOpen={isProductInfoOpen}
        onClose={() => setIsProductInfoOpen(false)}
        product={product}
        onAddToCart={onAddToCart}
      />
    </>
  );
};

export default VariantProductCard;
