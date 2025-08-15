// ProductCard component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../../tokens';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassBadge from '../../../features/shared/components/ui/GlassBadge';
import { t } from '../../../lib/i18n/t';
import { format } from '../../../lib/format';

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  isActive: boolean;
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
  tags?: string[];
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  taxRate: number;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onView?: (product: Product) => void;
  onAdjustStock?: (variant: ProductVariant) => void;
  onToggleActive?: (product: Product) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onView,
  onAdjustStock,
  onToggleActive,
  showActions = true,
  variant = 'default',
  className = ''
}) => {
  // Get primary variant (first active variant or first variant)
  const primaryVariant = product.variants.find(v => v.isActive) || product.variants[0];
  
  // Calculate product stats
  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const totalValue = product.variants.reduce((sum, v) => sum + (v.stockQuantity * v.price), 0);
  const activeVariants = product.variants.filter(v => v.isActive).length;
  const lowStockVariants = product.variants.filter(v => v.stockQuantity <= v.minStockLevel).length;

  // Get stock status
  const getStockStatus = (stock: number, minStock: number, maxStock: number) => {
    if (stock <= minStock) return 'low';
    if (stock >= maxStock) return 'high';
    return 'normal';
  };

  const stockStatus = primaryVariant ? getStockStatus(primaryVariant.stockQuantity, primaryVariant.minStockLevel, primaryVariant.maxStockLevel) : 'normal';

  // Get stock status badge
  const getStockStatusBadge = () => {
    switch (stockStatus) {
      case 'low':
        return <GlassBadge variant="error">Low Stock</GlassBadge>;
      case 'high':
        return <GlassBadge variant="warning">Overstocked</GlassBadge>;
      default:
        return <GlassBadge variant="success">In Stock</GlassBadge>;
    }
  };

  // Get price range
  const getPriceRange = () => {
    const prices = product.variants.map(v => v.price).filter(p => p > 0);
    if (prices.length === 0) return 'No price set';
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return format.money(minPrice);
    }
    return `${format.money(minPrice)} - ${format.money(maxPrice)}`;
  };

  // Handle actions
  const handleEdit = () => onEdit?.(product);
  const handleView = () => onView?.(product);
  const handleAdjustStock = () => primaryVariant && onAdjustStock?.(primaryVariant);
  const handleToggleActive = () => onToggleActive?.(product);

  // Render compact variant
  if (variant === 'compact') {
    return (
      <GlassCard className={`hover:shadow-lats-glass-shadow-lg transition-all duration-200 ${className}`}>
        <div className="flex items-center gap-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lats-radius-md"
                />
              ) : (
                <svg className="w-6 h-6 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-lats-text truncate">
                {product.name}
              </h3>
              {!product.isActive && (
                <GlassBadge variant="error" size="xs">Inactive</GlassBadge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-lats-text-secondary">
              <span className="font-mono">{product.sku}</span>
              {product.categoryName && (
                <>
                  <span>•</span>
                  <span>{product.categoryName}</span>
                </>
              )}
            </div>
          </div>

          {/* Stock & Price */}
          <div className="flex-shrink-0 text-right">
            <div className="text-sm font-medium text-lats-text">
              {primaryVariant ? format.money(primaryVariant.sellingPrice) : 'No price'}
            </div>
            <div className="text-xs text-lats-text-secondary">
              Stock: {totalStock}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex-shrink-0">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleView}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              />
            </div>
          )}
        </div>
      </GlassCard>
    );
  }

  // Render detailed variant
  if (variant === 'detailed') {
    return (
      <GlassCard className={`hover:shadow-lats-glass-shadow-lg transition-all duration-200 ${className}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-lats-text truncate">
                {product.name}
              </h3>
              {product.isFeatured && (
                <GlassBadge variant="warning" size="sm">Featured</GlassBadge>
              )}
              {!product.isActive && (
                <GlassBadge variant="error" size="sm">Inactive</GlassBadge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-lats-text-secondary mb-1">
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

          {/* Product Image */}
          <div className="flex-shrink-0 ml-4">
            <div className="w-20 h-20 bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border flex items-center justify-center overflow-hidden">
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
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-lats-text-secondary">Category:</span>
              <span className="text-sm text-lats-text">
                {product.categoryName || 'Uncategorized'}
              </span>
            </div>
            {product.brandName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-lats-text-secondary">Brand:</span>
                <span className="text-sm text-lats-text">{product.brandName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-lats-text-secondary">Price Range:</span>
              <span className="text-sm font-medium text-lats-text">{getPriceRange()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-lats-text-secondary">Total Stock:</span>
              <span className="text-sm font-medium text-lats-text">{totalStock}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-lats-text-secondary">Stock Value:</span>
              <span className="text-sm font-medium text-lats-text">{format.money(totalValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-lats-text-secondary">Variants:</span>
              <span className="text-sm text-lats-text">{activeVariants} active</span>
            </div>
          </div>
        </div>

        {/* Status & Tags */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getStockStatusBadge()}
            {lowStockVariants > 0 && (
              <GlassBadge variant="warning" size="sm">
                {lowStockVariants} low stock
              </GlassBadge>
            )}
          </div>
          {product.tags && product.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {product.tags.slice(0, 2).map((tag, index) => (
                <GlassBadge key={index} variant="ghost" size="xs">
                  {tag}
                </GlassBadge>
              ))}
              {product.tags.length > 2 && (
                <span className="text-xs text-lats-text-secondary">
                  +{product.tags.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-4 border-t border-lats-glass-border">
            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleView}
              className="flex-1"
            >
              View Details
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={handleEdit}
            >
              Edit
            </GlassButton>
            {primaryVariant && (
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleAdjustStock}
              >
                Adjust Stock
              </GlassButton>
            )}
          </div>
        )}
      </GlassCard>
    );
  }

  // Default variant
  return (
    <GlassCard className={`hover:shadow-lats-glass-shadow-lg transition-all duration-200 ${className}`}>
      {/* Product Image */}
      <div className="relative mb-4">
        <div className="aspect-square bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border flex items-center justify-center overflow-hidden">
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
            <svg className="w-12 h-12 text-lats-text-secondary hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-lats-text line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-lats-text-secondary">
          <span className="font-mono">{product.sku}</span>
          {product.categoryName && (
            <>
              <span>•</span>
              <span>{product.categoryName}</span>
            </>
          )}
        </div>

        {product.shortDescription && (
          <p className="text-sm text-lats-text-secondary line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Price */}
        <div className="text-lg font-bold text-lats-text">
          {getPriceRange()}
        </div>

        {/* Stock Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-lats-text-secondary">Stock:</span>
          <span className="font-medium text-lats-text">{totalStock} units</span>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag, index) => (
              <GlassBadge key={index} variant="ghost" size="xs">
                {tag}
              </GlassBadge>
            ))}
            {product.tags.length > 3 && (
              <span className="text-xs text-lats-text-secondary">
                +{product.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-lats-glass-border">
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleView}
            className="flex-1"
          >
            View
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleEdit}
          >
            Edit
          </GlassButton>
        </div>
      )}
    </GlassCard>
  );
};

// Export with display name for debugging
ProductCard.displayName = 'ProductCard';

export default ProductCard;
