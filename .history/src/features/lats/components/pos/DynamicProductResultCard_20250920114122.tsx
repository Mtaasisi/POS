import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';
import { ImagePopupModal } from '../../../../components/ImagePopupModal';
import { useGeneralSettingsUI } from '../../../../hooks/useGeneralSettingsUI';
import DynamicProductText from './DynamicProductText';
import { Loader2 } from 'lucide-react';

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
  isActive?: boolean;
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
  images?: string[];
  isActive: boolean;
  isFeatured?: boolean;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

interface DynamicProductResultCardProps {
  product: Product;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onViewDetails?: (product: Product) => void;
  variant?: 'default' | 'compact' | 'minimal';
  showStockInfo?: boolean;
  showCategory?: boolean;
  className?: string;
  priority?: boolean;
  isVisible?: boolean;
}

const DynamicProductResultCard: React.FC<DynamicProductResultCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  variant = 'default',
  showStockInfo = true,
  showCategory = true,
  className = '',
  priority = false,
  isVisible = true
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

  const [isLoaded, setIsLoaded] = useState(priority);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Image popup modal state
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isLoaded]);

  // Progressive loading
  useEffect(() => {
    if (!isLoaded) return;

    const imageTimer = setTimeout(() => {
      setIsImageLoaded(true);
    }, 100);

    const contentTimer = setTimeout(() => {
      setIsContentLoaded(true);
    }, 200);

    return () => {
      clearTimeout(imageTimer);
      clearTimeout(contentTimer);
    };
  }, [isLoaded]);

  // Get primary variant (first active variant or first variant)
  const primaryVariant = product.variants.find(v => v.isActive) || product.variants[0];
  
  // Get stock status
  const getStockStatus = useCallback((stock: number, minStock: number, maxStock: number) => {
    if (stock <= minStock) return 'low';
    if (stock >= maxStock) return 'high';
    return 'normal';
  }, []);

  const stockStatus = primaryVariant ? getStockStatus(primaryVariant.stockQuantity, primaryVariant.minStockLevel, 100) : 'normal';

  // Get stock status badge
  const getStockStatusBadge = useCallback(() => {
    if (!primaryVariant) return null;
    
    switch (stockStatus) {
      case 'low':
        return <GlassBadge variant="error" size="sm">Low Stock</GlassBadge>;
      case 'high':
        return <GlassBadge variant="warning" size="sm">Overstocked</GlassBadge>;
      default:
        return <GlassBadge variant="success" size="sm">In Stock</GlassBadge>;
    }
  }, [primaryVariant, stockStatus]);

  // Get price display
  const getPriceDisplay = useCallback(() => {
    if (!primaryVariant) return 'No price set';
    
    const prices = product.variants.map(v => v.price).filter(p => p > 0);
    if (prices.length === 0) return 'No price set';
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return format.money(minPrice);
    }
    return `${format.money(minPrice)} - ${format.money(maxPrice)}`;
  }, [product.variants, primaryVariant]);

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (primaryVariant) {
      onAddToCart(product, primaryVariant, 1);
    }
  }, [product, primaryVariant, onAddToCart]);

  // Handle view details
  const handleViewDetails = useCallback(() => {
    onViewDetails?.(product);
  }, [product, onViewDetails]);

  // Skeleton loader
  const SkeletonLoader = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // Show skeleton while loading
  if (!isLoaded) {
    return (
      <div ref={cardRef}>
        <SkeletonLoader />
      </div>
    );
  }

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <GlassCard 
        ref={cardRef}
        className={`hover:shadow-lats-glass-shadow-lg transition-all duration-300 cursor-pointer ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`} 
        onClick={handleAddToCart}
      >
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
                {isImageLoaded && product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Loader2 size={16} className="text-lats-text-secondary animate-spin" />
                )}
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <DynamicProductText priority={priority} delay={50}>
              <h3 className="text-sm font-medium text-lats-text truncate">
                {product.name}
              </h3>
            </DynamicProductText>
            <DynamicProductText priority={priority} delay={100}>
              <div className="flex items-center gap-2 text-xs text-lats-text-secondary">
                <span className="font-mono">{product.sku}</span>
                {showCategory && product.categoryName && (
                  <>
                    <span>•</span>
                    <span>{product.categoryName}</span>
                  </>
                )}
              </div>
            </DynamicProductText>
          </div>

          {/* Price & Stock */}
          <div className="flex-shrink-0 text-right">
            {showPrices && (
              <DynamicProductText priority={priority} delay={150}>
                <div className="text-sm font-bold text-lats-text">
                  {getPriceDisplay()}
                </div>
              </DynamicProductText>
            )}
            {showStockLevels && showStockInfo && primaryVariant && (
              <DynamicProductText priority={priority} delay={200}>
                <div className="text-xs text-lats-text-secondary">
                  Stock: {primaryVariant.stockQuantity}
                </div>
              </DynamicProductText>
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
      <GlassCard 
        ref={cardRef}
        className={`hover:shadow-lats-glass-shadow-lg transition-all duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      >
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
                {isImageLoaded && product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Loader2 size={20} className="text-lats-text-secondary animate-spin" />
                )}
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DynamicProductText priority={priority} delay={50}>
                <h3 className="text-sm font-medium text-lats-text truncate">
                  {product.name}
                </h3>
              </DynamicProductText>
              {isContentLoaded && getStockStatusBadge()}
            </div>
            <DynamicProductText priority={priority} delay={100}>
              <div className="flex items-center gap-2 text-xs text-lats-text-secondary mb-2">
                <span className="font-mono">{product.sku}</span>
                {showBarcodes && product.barcode && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{product.barcode}</span>
                  </>
                )}
              </div>
            </DynamicProductText>
            <DynamicProductText priority={priority} delay={150}>
              <div className="flex items-center gap-2 text-xs text-lats-text-secondary">
                {showCategory && product.categoryName && (
                  <span>{product.categoryName}</span>
                )}
              </div>
            </DynamicProductText>
          </div>

          {/* Price & Actions */}
          <div className="flex-shrink-0 text-right">
            {showPrices && (
              <DynamicProductText priority={priority} delay={200}>
                <div className="text-lg font-bold text-lats-text mb-2">
                  {getPriceDisplay()}
                </div>
              </DynamicProductText>
            )}
            {showStockLevels && showStockInfo && primaryVariant && (
              <DynamicProductText priority={priority} delay={250}>
                <div className="text-xs text-lats-text-secondary mb-2">
                  Stock: {primaryVariant.stockQuantity}
                </div>
              </DynamicProductText>
            )}
            {isContentLoaded && (
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

  // Default variant - full card
  return (
    <GlassCard 
      ref={cardRef}
      className={`hover:shadow-lats-glass-shadow-lg transition-all duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {/* Product Image */}
      <div className="relative mb-4">
        <div 
          className="aspect-square bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => product.images && product.images.length > 0 && setIsImagePopupOpen(true)}
        >
          {isImageLoaded && product.images && product.images.length > 0 ? (
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
            <Loader2 size={32} className="text-lats-text-secondary animate-spin" />
          )}
        </div>
        
        {/* Status Badges */}
        {isContentLoaded && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!product.isActive && (
              <GlassBadge variant="error" size="sm">Inactive</GlassBadge>
            )}
            {product.isFeatured && (
              <GlassBadge variant="warning" size="sm">Featured</GlassBadge>
            )}
          </div>
        )}

        {/* Stock Status */}
        {isContentLoaded && (
          <div className="absolute top-2 right-2">
            {getStockStatusBadge()}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <DynamicProductText priority={priority} delay={50}>
            <h3 className="text-lg font-semibold text-lats-text line-clamp-2 mb-1">
              {product.name}
            </h3>
          </DynamicProductText>
          
          <DynamicProductText priority={priority} delay={100}>
            <div className="flex items-center gap-2 text-sm text-lats-text-secondary mb-2">
              <span className="font-mono">{product.sku}</span>
              {product.barcode && (
                <>
                  <span>•</span>
                  <span className="font-mono">{product.barcode}</span>
                </>
              )}
            </div>
          </DynamicProductText>

          {product.shortDescription && (
            <DynamicProductText priority={priority} delay={150}>
              <p className="text-sm text-lats-text-secondary line-clamp-2">
                {product.shortDescription}
              </p>
            </DynamicProductText>
          )}
        </div>

        {/* Category */}
        <DynamicProductText priority={priority} delay={200}>
          <div className="flex items-center gap-2 text-sm text-lats-text-secondary">
            {showCategory && product.categoryName && (
              <span>{product.categoryName}</span>
            )}
          </div>
        </DynamicProductText>

        {/* Price */}
        <DynamicProductText priority={priority} delay={250}>
          <div className="text-xl font-bold text-lats-text whitespace-nowrap overflow-hidden" title={getPriceDisplay()}>
            {getPriceDisplay()}
          </div>
        </DynamicProductText>

        {/* Stock Info */}
        {showStockInfo && primaryVariant && (
          <DynamicProductText priority={priority} delay={300}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-lats-text-secondary">Available Stock:</span>
              <span className={`font-medium ${primaryVariant.stockQuantity <= primaryVariant.minStockLevel ? 'text-lats-error' : 'text-lats-text'}`}>
                {primaryVariant.stockQuantity} units
              </span>
            </div>
          </DynamicProductText>
        )}
      </div>

      {/* Actions */}
      {isContentLoaded && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-lats-glass-border">
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={!primaryVariant || primaryVariant.stockQuantity <= 0}
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
      )}

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
DynamicProductResultCard.displayName = 'DynamicProductResultCard';

export default DynamicProductResultCard;
