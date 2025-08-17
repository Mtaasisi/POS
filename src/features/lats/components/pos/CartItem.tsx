// CartItem component for LATS module
import React, { useState } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import GlassInput from '../ui/GlassInput';
import ProductImageDisplay from '../inventory/ProductImageDisplay';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';

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
  sku: string;
  barcode?: string;
  categoryName?: string;
  brandName?: string;
  images?: string[];
  isActive: boolean;
  variants: ProductVariant[];
}

interface CartItemProps {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onVariantChange?: (variant: ProductVariant) => void;
  showVariantSelector?: boolean;
  showStockInfo?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

const CartItem: React.FC<CartItemProps> = ({
  product,
  variant,
  quantity,
  onQuantityChange,
  onRemove,
  onVariantChange,
  showVariantSelector = false,
  showStockInfo = true,
  variant: displayVariant = 'default',
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(quantity);

  // Calculate totals
  const subtotal = variant.sellingPrice * quantity;
  const availableStock = variant.quantity;

  // Get stock status
  const getStockStatus = () => {
    if (quantity > availableStock) return 'insufficient';
    if (availableStock <= variant.minQuantity) return 'low';
    if (availableStock >= variant.maxQuantity) return 'high';
    return 'normal';
  };

  const stockStatus = getStockStatus();

  // Get stock status badge
  const getStockStatusBadge = () => {
    switch (stockStatus) {
      case 'insufficient':
        return <GlassBadge variant="error" size="sm">Insufficient Stock</GlassBadge>;
      case 'low':
        return <GlassBadge variant="warning" size="sm">Low Stock</GlassBadge>;
      case 'high':
        return <GlassBadge variant="info" size="sm">Overstocked</GlassBadge>;
      default:
        return <GlassBadge variant="success" size="sm">In Stock</GlassBadge>;
    }
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove();
    } else {
      onQuantityChange(newQuantity);
    }
  };

  // Handle quantity input
  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setEditQuantity(value);
  };

  // Handle quantity input submit
  const handleQuantitySubmit = () => {
    handleQuantityChange(editQuantity);
    setIsEditing(false);
  };

  // Handle quantity input cancel
  const handleQuantityCancel = () => {
    setEditQuantity(quantity);
    setIsEditing(false);
  };

  // Handle key events for quantity input
  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuantitySubmit();
    } else if (e.key === 'Escape') {
      handleQuantityCancel();
    }
  };

  // Render minimal variant
  if (displayVariant === 'minimal') {
    return (
      <GlassCard className={`hover:shadow-lats-glass-shadow-sm transition-all duration-200 ${className}`}>
        <div className="flex items-center gap-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <ProductImageDisplay
              images={product.images}
              productName={product.name}
              size="sm"
              className="flex-shrink-0"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-lats-text truncate">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-lats-text-secondary">
              <span className="font-mono">{variant.sku}</span>
              <span>•</span>
              <span>{format.money(variant.sellingPrice)}</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-1">
            <GlassButton
              variant="ghost"
              size="xs"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              icon={
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              }
              className="w-6 h-6 p-0"
            />
            <span className="text-sm font-medium text-lats-text min-w-[2rem] text-center">
              {quantity}
            </span>
            <GlassButton
              variant="ghost"
              size="xs"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= availableStock}
              icon={
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
              className="w-6 h-6 p-0"
            />
          </div>

          {/* Total */}
          <div className="flex-shrink-0 text-right">
            <div className="text-sm font-bold text-lats-text">
              {format.money(subtotal)}
            </div>
          </div>

          {/* Remove Button */}
          <GlassButton
            variant="ghost"
            size="xs"
            onClick={onRemove}
            icon={
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            className="w-6 h-6 p-0 text-lats-error hover:text-lats-error"
          />
        </div>
      </GlassCard>
    );
  }

  // Render compact variant
  if (displayVariant === 'compact') {
    return (
      <GlassCard className={`hover:shadow-lats-glass-shadow-sm transition-all duration-200 ${className}`}>
        <div className="flex items-center gap-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <ProductImageDisplay
              images={product.images}
              productName={product.name}
              size="md"
              className="flex-shrink-0"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-lats-text truncate">
                {product.name}
              </h3>
              {stockStatus === 'insufficient' && getStockStatusBadge()}
            </div>
            <div className="flex items-center gap-2 text-xs text-lats-text-secondary">
              <span className="font-mono">{variant.sku}</span>
              {product.categoryName && (
                <>
                  <span>•</span>
                  <span>{product.categoryName}</span>
                </>
              )}
            </div>
            {showStockInfo && (
              <div className="text-xs text-lats-text-secondary mt-1">
                Stock: {availableStock} • Price: {format.money(variant.sellingPrice)}
              </div>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                }
                className="w-8 h-8 p-0"
              />
              {isEditing ? (
                <GlassInput
                  value={editQuantity}
                  onChange={handleQuantityInput}
                  onKeyDown={handleQuantityKeyDown}
                  onBlur={handleQuantitySubmit}
                  type="number"
                  min={0}
                  max={availableStock}
                  className="w-16 text-center"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-16 h-8 flex items-center justify-center text-sm font-medium text-lats-text bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border hover:bg-lats-surface/70 transition-colors"
                >
                  {quantity}
                </button>
              )}
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= availableStock}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
                className="w-8 h-8 p-0"
              />
            </div>
          </div>

          {/* Total & Remove */}
          <div className="flex-shrink-0 text-right">
            <div className="text-sm font-bold text-lats-text mb-1">
              {format.money(subtotal)}
            </div>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={onRemove}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
              className="w-8 h-8 p-0 text-lats-error hover:text-lats-error"
            />
          </div>
        </div>
      </GlassCard>
    );
  }

  // Default variant
  return (
    <GlassCard className={`hover:shadow-lats-glass-shadow-sm transition-all duration-200 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <ProductImageDisplay
            images={product.images}
            productName={product.name}
            size="lg"
            className="flex-shrink-0"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-lats-text truncate">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-lats-text-secondary mt-1">
                <span className="font-mono">{variant.sku}</span>
                {product.categoryName && (
                  <>
                    <span>•</span>
                    <span>{product.categoryName}</span>
                  </>
                )}
                {product.brandName && (
                  <>
                    <span>•</span>
                    <span>{product.brandName}</span>
                  </>
                )}
              </div>
            </div>
            {getStockStatusBadge()}
          </div>

          {/* Price & Stock Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-lats-text-secondary">Unit Price:</span>
                <span className="font-medium text-lats-text">{format.money(variant.sellingPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-lats-text-secondary">Quantity:</span>
                <span className="font-medium text-lats-text">{quantity}</span>
              </div>
            </div>
            {showStockInfo && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-lats-text-secondary">Available Stock:</span>
                  <span className={`font-medium ${stockStatus === 'insufficient' ? 'text-lats-error' : 'text-lats-text'}`}>
                    {availableStock}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-lats-text-secondary">Subtotal:</span>
                  <span className="font-bold text-lats-text">{format.money(subtotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-lats-text-secondary">Quantity:</span>
              <div className="flex items-center gap-1">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  }
                  className="w-8 h-8 p-0"
                />
                {isEditing ? (
                  <GlassInput
                    value={editQuantity}
                    onChange={handleQuantityInput}
                    onKeyDown={handleQuantityKeyDown}
                    onBlur={handleQuantitySubmit}
                    type="number"
                    min={0}
                    max={availableStock}
                    className="w-20 text-center"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-20 h-8 flex items-center justify-center text-sm font-medium text-lats-text bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border hover:bg-lats-surface/70 transition-colors"
                  >
                    {quantity}
                  </button>
                )}
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= availableStock}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                  className="w-8 h-8 p-0"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {showVariantSelector && onVariantChange && product.variants.length > 1 && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {/* TODO: Show variant selector */}}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  }
                >
                  Variants
                </GlassButton>
              )}
              <GlassButton
                variant="error"
                size="sm"
                onClick={onRemove}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              >
                Remove
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// Export with display name for debugging
CartItem.displayName = 'CartItem';

export default CartItem;
