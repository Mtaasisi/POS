// ProductResultCard component for LATS module
import React, { useState } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';
import { ImagePopupModal } from '../../../../components/ImagePopupModal';
import { useGeneralSettingsUI } from '../../../../hooks/useGeneralSettingsUI';

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  barcode?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  weight?: number;
  attributes: Record<string, any>;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  brandId?: string;
  brandName?: string;
  brandLogo?: string;
  images?: string[];

      isActive: boolean;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

interface ProductResultCardProps {
  product: Product;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onViewDetails?: (product: Product) => void;
  variant?: 'default' | 'compact' | 'minimal';
  showStockInfo?: boolean;
  showCategory?: boolean;
  showBrand?: boolean;
  className?: string;
}

const ProductResultCard: React.FC<ProductResultCardProps> = ({
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
    showBarcodes,
    getProductImageClass,
    getPriceClass,
    getBarcodeClass,
    getStockLevelClass
  } = useGeneralSettingsUI();



  // Image popup modal state
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);

  // Get primary variant (first active variant or first variant)
  const primaryVariant = product.variants.find(v => v.isActive) || product.variants[0];
  
  // Get stock status
  const getStockStatus = (stock: number, minStock: number, maxStock: number) => {
    if (stock <= minStock) return 'low';
    if (stock >= maxStock) return 'high';
    return 'normal';
  };

  const stockStatus = primaryVariant ? getStockStatus(primaryVariant.stockQuantity, primaryVariant.minStockLevel, 100) : 'normal';

  // Get stock status badge
  const getStockStatusBadge = () => {
    if (!primaryVariant) return null;
    
    switch (stockStatus) {
      case 'low':
        return <GlassBadge variant="error" size="sm">Low Stock</GlassBadge>;
      case 'high':
        return <GlassBadge variant="warning" size="sm">Overstocked</GlassBadge>;
      default:
        return <GlassBadge variant="success" size="sm">In Stock</GlassBadge>;
    }
  };

  // Get price display
  const getPriceDisplay = () => {
    if (!primaryVariant) return 'No price set';
    
    const prices = product.variants.map(v => v.sellingPrice).filter(p => p > 0);
    if (prices.length === 0) return 'No price set';
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return format.money(minPrice);
    }
    return `${format.money(minPrice)} - ${format.money(maxPrice)}`;
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (primaryVariant) {
      onAddToCart(product, primaryVariant, 1);
    }
  };

  // Handle view details
  const handleViewDetails = () => {
    onViewDetails?.(product);
  };

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <GlassCard className={`hover:shadow-lats-glass-shadow-lg transition-all duration-200 cursor-pointer ${className}`} onClick={handleAddToCart}>
        <div className="flex items-center gap-3">
          {/* Product Image */}
          {showProductImages && (
            <div className="flex-shrink-0">
              <div 
                className="w-12 h-12 bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.images && product.images.length > 0) {
                    setIsImagePopupOpen(true);
                  }
                }}
              >
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-6 h-6 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-lats-text truncate">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-lats-text-secondary">
              <span className="font-mono">{product.sku}</span>
              {showCategory && product.categoryName && (
                <>
                  <span>•</span>
                  <span>{product.categoryName}</span>
                </>
              )}
            </div>
          </div>

          {/* Price & Stock */}
          <div className="flex-shrink-0 text-right">
            {showPrices && (
              <div className="text-sm font-bold text-lats-text">
                {getPriceDisplay()}
              </div>
            )}
            {showStockLevels && showStockInfo && primaryVariant && (
              <div className="text-xs text-lats-text-secondary">
                Stock: {primaryVariant.stockQuantity}
              </div>
            )}
          </div>
        </div>

        {/* Image Popup Modal */}
        {product.images && product.images.length > 0 && (
          <ImagePopupModal
            images={product.images}
            productName={product.name}
            isOpen={isImagePopupOpen}
            onClose={() => setIsImagePopupOpen(false)}
          />
        )}
      </GlassCard>
    );
  }

  // Render compact variant
  if (variant === 'compact') {
    return (
      <GlassCard className={`hover:shadow-lats-glass-shadow-lg transition-all duration-200 ${className}`}>
        <div className="flex items-center gap-3">
          {/* Product Image */}
          {showProductImages && (
            <div className="flex-shrink-0">
              <div 
                className="w-16 h-16 bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.images && product.images.length > 0) {
                    setIsImagePopupOpen(true);
                  }
                }}
              >
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-lats-text truncate">
                {product.name}
              </h3>
              {getStockStatusBadge()}
            </div>
            <div className="flex items-center gap-2 text-xs text-lats-text-secondary mb-2">
              <span className="font-mono">{product.sku}</span>
              {showBarcodes && product.barcode && (
                <>
                  <span>•</span>
                  <span className="font-mono">{product.barcode}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-lats-text-secondary">
              {showCategory && product.categoryName && (
                <span>{product.categoryName}</span>
              )}
              {showBrand && product.brandName && (
                <>
                  {showCategory && <span>•</span>}
                  <span>{product.brandName}</span>
                </>
              )}
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex-shrink-0 text-right">
            {showPrices && (
              <div className="text-lg font-bold text-lats-text mb-2">
                {getPriceDisplay()}
              </div>
            )}
            {showStockLevels && showStockInfo && primaryVariant && (
              <div className="text-xs text-lats-text-secondary mb-2">
                Stock: {primaryVariant.stockQuantity}
              </div>
            )}
            <div className="flex items-center gap-1">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                disabled={!primaryVariant || primaryVariant.stockQuantity <= 0}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
                className="w-8 h-8 p-0"
              />
              {onViewDetails && (
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={handleViewDetails}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                  className="w-8 h-8 p-0"
                />
              )}
            </div>
          </div>
        </div>

        {/* Image Popup Modal */}
        {product.images && product.images.length > 0 && (
          <ImagePopupModal
            images={product.images}
            productName={product.name}
            isOpen={isImagePopupOpen}
            onClose={() => setIsImagePopupOpen(false)}
          />
        )}
      </GlassCard>
    );
  }

  // Default variant
  return (
    <GlassCard className={`hover:shadow-lats-glass-shadow-lg transition-all duration-200 ${className}`}>
      {/* Product Image */}
      <div className="relative mb-4">
        <div 
          className="aspect-square bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => product.images && product.images.length > 0 && setIsImagePopupOpen(true)}
        >
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <svg className="w-16 h-16 text-lats-text-secondary hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        
        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!product.isActive && (
            <GlassBadge variant="error" size="sm">Inactive</GlassBadge>
          )}
          {product.isFeatured && (
            <GlassBadge variant="warning" size="sm">Featured</GlassBadge>
          )}
        </div>

        {/* Stock Status */}
        <div className="absolute top-2 right-2">
          {getStockStatusBadge()}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-lats-text line-clamp-2 mb-1">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-lats-text-secondary mb-2">
            <span className="font-mono">{product.sku}</span>
            {product.barcode && (
              <>
                <span>•</span>
                <span className="font-mono">{product.barcode}</span>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-sm text-lats-text-secondary line-clamp-2">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Category & Brand */}
        <div className="flex items-center gap-2 text-sm text-lats-text-secondary">
          {showCategory && product.categoryName && (
            <span>{product.categoryName}</span>
          )}
          {showBrand && product.brandName && (
            <>
              {showCategory && <span>•</span>}
              <span>{product.brandName}</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="text-xl font-bold text-lats-text">
          {getPriceDisplay()}
        </div>

        {/* Stock Info */}
        {showStockInfo && primaryVariant && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-lats-text-secondary">Available Stock:</span>
            <span className={`font-medium ${primaryVariant.quantity <= primaryVariant.minQuantity ? 'text-lats-error' : 'text-lats-text'}`}>
              {primaryVariant.quantity} units
            </span>
          </div>
        )}


      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-lats-glass-border">
        <GlassButton
          variant="primary"
          size="sm"
          onClick={handleAddToCart}
          disabled={!primaryVariant || primaryVariant.quantity <= 0}
          className="flex-1"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Add to Cart
        </GlassButton>
        
        {onViewDetails && (
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleViewDetails}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          >
            Details
          </GlassButton>
        )}
      </div>

      {/* Image Popup Modal */}
      {product.images && product.images.length > 0 && (
        <ImagePopupModal
          images={product.images}
          productName={product.name}
          isOpen={isImagePopupOpen}
          onClose={() => setIsImagePopupOpen(false)}
        />
      )}
    </GlassCard>
  );
};

// Export with display name for debugging
ProductResultCard.displayName = 'ProductResultCard';

export default ProductResultCard;
