// CartSummary component for LATS module
import React from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  stockQuantity: number;
  isStockSufficient: boolean;
}

interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discountAmount: number;
  discountPercentage: number;
  total: number;
  onClearCart?: () => void;
  onApplyDiscount?: (percentage: number) => void;
  onRemoveDiscount?: () => void;
  onProceedToPayment?: () => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  subtotal,
  taxAmount,
  taxRate,
  discountAmount,
  discountPercentage,
  total,
  onClearCart,
  onApplyDiscount,
  onRemoveDiscount,
  onProceedToPayment,
  showActions = true,
  variant = 'default',
  className = ''
}) => {
  // Calculate summary stats
  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const insufficientStockItems = items.filter(item => !item.isStockSufficient).length;
  const hasDiscount = discountAmount > 0;

  // Get cart status
  const getCartStatus = () => {
    if (itemCount === 0) return 'empty';
    if (insufficientStockItems > 0) return 'insufficient-stock';
    if (total <= 0) return 'invalid';
    return 'ready';
  };

  const cartStatus = getCartStatus();

  // Get status badge
  const getStatusBadge = () => {
    switch (cartStatus) {
      case 'empty':
        return <GlassBadge variant="ghost">Empty Cart</GlassBadge>;
      case 'insufficient-stock':
        return <GlassBadge variant="error">{insufficientStockItems} items low stock</GlassBadge>;
      case 'invalid':
        return <GlassBadge variant="error">Invalid Total</GlassBadge>;
      case 'ready':
        return <GlassBadge variant="success">Ready for Payment</GlassBadge>;
      default:
        return null;
    }
  };

  // Handle clear cart
  const handleClearCart = () => {
    if (itemCount > 0) {
      if (confirm('Are you sure you want to clear the cart?')) {
        onClearCart?.();
      }
    }
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    if (cartStatus === 'ready') {
      onProceedToPayment?.();
    }
  };

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <GlassCard className={className}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-lats-text-secondary">
            {itemCount} items • {totalQuantity} units
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-lats-text">
              {format.money(total)}
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </GlassCard>
    );
  }

  // Render compact variant
  if (variant === 'compact') {
    return (
      <GlassCard className={className}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-lats-text">Cart Summary</h3>
            {getStatusBadge()}
          </div>

          {/* Items Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-lats-text-secondary">Items:</span>
            <span className="text-lats-text">{itemCount} ({totalQuantity} units)</span>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">Subtotal:</span>
              <span className="text-lats-text">{format.money(subtotal)}</span>
            </div>
            {hasDiscount && (
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">Discount ({discountPercentage}%):</span>
                <span className="text-lats-success">-{format.money(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">Tax ({taxRate}%):</span>
              <span className="text-lats-text">{format.money(taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold border-t border-lats-glass-border pt-2">
              <span className="text-lats-text">Total:</span>
              <span className="text-lats-text">{format.money(total)}</span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2 pt-3 border-t border-lats-glass-border">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={handleClearCart}
                disabled={itemCount === 0}
                className="flex-1"
              >
                Clear Cart
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                onClick={handleProceedToPayment}
                disabled={cartStatus !== 'ready'}
                className="flex-1"
              >
                Proceed to Payment
              </GlassButton>
            </div>
          )}
        </div>
      </GlassCard>
    );
  }

  // Default variant
  return (
    <GlassCard className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-lats-text">Cart Summary</h3>
          <p className="text-sm text-lats-text-secondary mt-1">
            {itemCount} items • {totalQuantity} units
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Cart Items Preview */}
      {itemCount > 0 && (
        <div className="mb-4 p-3 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
          <h4 className="text-sm font-medium text-lats-text mb-2">Items in Cart</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-lats-text">{item.productName}</div>
                  <div className="text-lats-text-secondary">
                    {item.sku} • Qty: {item.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lats-text">{format.money(item.subtotal)}</div>
                  {!item.isStockSufficient && (
                    <div className="text-lats-error text-xs">Low stock</div>
                  )}
                </div>
              </div>
            ))}
            {items.length > 5 && (
              <div className="text-xs text-lats-text-secondary text-center pt-1">
                +{items.length - 5} more items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Totals Breakdown */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-lats-text-secondary">Subtotal:</span>
          <span className="text-lats-text">{format.money(subtotal)}</span>
        </div>

        {/* Discount */}
        {hasDiscount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-lats-text-secondary">Discount ({discountPercentage}%):</span>
            <div className="flex items-center gap-2">
              <span className="text-lats-success">-{format.money(discountAmount)}</span>
              {onRemoveDiscount && (
                <GlassButton
                  variant="ghost"
                  size="xs"
                  onClick={onRemoveDiscount}
                  icon={
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                  className="w-5 h-5 p-0"
                />
              )}
            </div>
          </div>
        )}

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-lats-text-secondary">Tax ({taxRate}%):</span>
          <span className="text-lats-text">{format.money(taxAmount)}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between text-lg font-bold border-t border-lats-glass-border pt-3">
          <span className="text-lats-text">Total:</span>
          <span className="text-lats-text">{format.money(total)}</span>
        </div>
      </div>

      {/* Quick Discount Options */}
      {onApplyDiscount && !hasDiscount && (
        <div className="mb-4 p-3 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
          <h4 className="text-sm font-medium text-lats-text mb-2">Quick Discount</h4>
          <div className="flex items-center gap-2">
            {[5, 10, 15, 20].map((percentage) => (
              <GlassButton
                key={percentage}
                variant="ghost"
                size="sm"
                onClick={() => onApplyDiscount(percentage)}
                className="flex-1"
              >
                {percentage}%
              </GlassButton>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {insufficientStockItems > 0 && (
        <div className="mb-4 p-3 bg-lats-error/10 border border-lats-error/20 rounded-lats-radius-md">
          <div className="flex items-center gap-2 text-sm text-lats-error">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {insufficientStockItems} item{insufficientStockItems > 1 ? 's' : ''} have insufficient stock
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="space-y-3 pt-4 border-t border-lats-glass-border">
          <div className="flex items-center gap-2">
            <GlassButton
              variant="secondary"
              size="md"
              onClick={handleClearCart}
              disabled={itemCount === 0}
              className="flex-1"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Clear Cart
            </GlassButton>
            <GlassButton
              variant="primary"
              size="md"
              onClick={handleProceedToPayment}
              disabled={cartStatus !== 'ready'}
              className="flex-1"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              }
            >
              Proceed to Payment
            </GlassButton>
          </div>

          {/* Payment Methods Preview */}
          <div className="text-xs text-lats-text-secondary text-center">
            Accepts: Cash, Card, Mobile Money, Bank Transfer
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// Export with display name for debugging
CartSummary.displayName = 'CartSummary';

export default CartSummary;
