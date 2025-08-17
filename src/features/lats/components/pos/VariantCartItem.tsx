import React, { useState } from 'react';
import { Trash2, Package, Tag, Minus, Plus, Edit } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { format } from '../../lib/format';
import { CartItem } from '../../types/pos';
import ProductImageDisplay from '../inventory/ProductImageDisplay';

interface VariantCartItemProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onVariantChange?: (variantId: string) => void;
  availableVariants?: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    attributes: Record<string, string>;
  }>;
  showStockInfo?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

const VariantCartItem: React.FC<VariantCartItemProps> = ({
  item,
  onQuantityChange,
  onRemove,
  onVariantChange,
  availableVariants = [],
  showStockInfo = true,
  variant = 'default',
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity);
  const [showVariantSelector, setShowVariantSelector] = useState(false);

  // Calculate totals
  const subtotal = item.unitPrice * item.quantity;
  const availableStock = item.availableQuantity;

  // Get stock status
  const getStockStatus = () => {
    if (item.quantity > availableStock) return 'insufficient';
    if (availableStock <= 5) return 'low';
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
    const value = parseInt(e.target.value) || 0;
    setEditQuantity(value);
  };

  // Handle quantity input submit
  const handleQuantitySubmit = () => {
    handleQuantityChange(editQuantity);
    setIsEditing(false);
  };

  // Handle quantity input cancel
  const handleQuantityCancel = () => {
    setEditQuantity(item.quantity);
    setIsEditing(false);
  };

  // Handle variant selection
  const handleVariantSelect = (variantId: string) => {
    if (onVariantChange) {
      onVariantChange(variantId);
    }
    setShowVariantSelector(false);
  };

  // Check if item has variant attributes
  const hasVariantAttributes = availableVariants.length > 1;

  // Get product thumbnail
  const getProductThumbnail = () => {
    return item.image || null;
  };

  const thumbnail = getProductThumbnail();

  if (variant === 'compact') {
    return (
      <GlassCard className={`p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Product Thumbnail */}
            <ProductImageDisplay
              images={thumbnail ? [thumbnail] : []}
              productName={item.productName}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">
                {item.productName}
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <span className="font-mono">{item.sku}</span>
                {item.variantName !== 'Default' && (
                  <span className="text-blue-600">{item.variantName}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm font-medium">{format.money(item.unitPrice)}</div>
              <div className="text-xs text-gray-500">x {item.quantity}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm">{format.money(subtotal)}</div>
              {stockStatus === 'insufficient' && getStockStatusBadge()}
            </div>
            <GlassButton
              size="sm"
              variant="danger"
              onClick={onRemove}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-4 ${className}`}>
      {/* Product Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Product Thumbnail */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {thumbnail ? (
              <ImageDisplay 
                imageUrl={thumbnail} 
                alt={item.productName}
                className="w-full h-full object-cover"
                fallbackIcon={true}
              />
            ) : (
              <Package className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{item.productName}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <span className="font-mono">{item.sku}</span>
              {item.variantName !== 'Default' && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">{item.variantName}</span>
                </>
              )}
            </div>
            {hasVariantAttributes && (
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Tag className="w-3 h-3" />
                <span>Click to change variant</span>
              </div>
            )}
          </div>
        </div>
        {stockStatus === 'insufficient' && getStockStatusBadge()}
      </div>

      {/* Price and Stock Info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-lg font-bold text-gray-900">{format.money(item.unitPrice)}</div>
          {showStockInfo && (
            <div className="text-sm text-gray-600">
              Available: {availableStock} units
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{format.money(subtotal)}</div>
          {hasVariantAttributes && onVariantChange && (
            <GlassButton
              size="sm"
              variant="secondary"
              onClick={() => setShowVariantSelector(!showVariantSelector)}
              className="mt-1"
            >
              <Edit className="w-3 h-3" />
              Change Variant
            </GlassButton>
          )}
        </div>
      </div>

      {/* Variant Selector */}
      {showVariantSelector && hasVariantAttributes && onVariantChange && (
        <div className="border-t border-gray-200 pt-3 mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Select Variant:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableVariants.map((variant) => {
              const isSelected = variant.id === item.variantId;
              const variantStockStatus = variant.quantity <= 0 ? 'out-of-stock' : 
                                       variant.quantity <= 5 ? 'low' : 'normal';
              
              return (
                <div
                  key={variant.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleVariantSelect(variant.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{variant.name}</div>
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="font-mono">{variant.sku}</span>
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <span key={key} className="text-blue-600">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{format.money(variant.sellingPrice)}</div>
                      <div className={`text-xs ${
                        variantStockStatus === 'out-of-stock' ? 'text-red-600' :
                        variantStockStatus === 'low' ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        Stock: {variant.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Quantity:</label>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max={availableStock}
                value={editQuantity}
                onChange={handleQuantityInput}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <GlassButton
                size="sm"
                onClick={handleQuantitySubmit}
                disabled={editQuantity <= 0 || editQuantity > availableStock}
              >
                ✓
              </GlassButton>
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={handleQuantityCancel}
              >
                ✕
              </GlassButton>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </GlassButton>
              <span 
                className="w-12 text-center font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                onClick={() => setIsEditing(true)}
              >
                {item.quantity}
              </span>
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={item.quantity >= availableStock}
              >
                <Plus className="w-3 h-3" />
              </GlassButton>
            </div>
          )}
        </div>
        
        <GlassButton
          size="sm"
          variant="danger"
          onClick={onRemove}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </GlassButton>
      </div>

      {/* Stock Warning */}
      {stockStatus === 'insufficient' && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            <strong>Warning:</strong> Requested quantity ({item.quantity}) exceeds available stock ({availableStock})
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default VariantCartItem;
