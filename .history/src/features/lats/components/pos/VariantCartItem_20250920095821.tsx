import React, { useState } from 'react';
import { Trash2, Package, Tag, Minus, Plus, Edit } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { format } from '../../lib/format';
import { CartItem } from '../../types/pos';
import { SimpleImageDisplay } from '../../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../../lib/robustImageService';
import { getSpecificationIcon, getSpecificationTooltip, formatSpecificationValue } from '../../lib/specificationUtils';

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

// Helper function to convert old image format to new format
const convertToProductImages = (imageUrls: string[]): ProductImage[] => {
  if (!imageUrls || imageUrls.length === 0) return [];
  
  return imageUrls.map((imageUrl, index) => ({
    id: `temp-${index}`,
    url: imageUrl,
    thumbnailUrl: imageUrl,
    fileName: `product-image-${index + 1}`,
    fileSize: 0,
    isPrimary: index === 0,
    uploadedAt: new Date().toISOString()
  }));
};

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
      <div className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
        <div className="flex items-center justify-between">
          {/* Left Section - Product Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Product Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {thumbnail ? (
                <SimpleImageDisplay
                  images={convertToProductImages([thumbnail])}
                  productName={item.productName}
                  size="sm"
                  className="w-full h-full rounded-lg"
                />
              ) : (
                <Package className="w-5 h-5 text-blue-600" />
              )}
            </div>
            
            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate text-sm">
                {item.productName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                <span className="font-mono">{item.sku}</span>
                {item.variantName !== 'Default' && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">{item.variantName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Section - Price, Quantity, Actions */}
          <div className="flex items-center gap-4">
            {/* Price Info */}
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{format.money(item.unitPrice)}</div>
              <div className="text-xs text-gray-500">Available: {availableStock} units</div>
            </div>
            
            {/* Total Price */}
            <div className="text-right">
              <div className="font-bold text-lg text-gray-900">{format.money(subtotal)}</div>
            </div>
            
            {/* Quantity Controls */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Quantity:</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-12 text-center font-medium text-sm px-2 py-1 bg-gray-50 rounded-md">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={item.quantity >= availableStock}
                  className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* Remove Button */}
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stock Warning */}
        {stockStatus === 'insufficient' && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              <strong>Warning:</strong> Requested quantity ({item.quantity}) exceeds available stock ({availableStock})
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Product Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Product Thumbnail */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {thumbnail ? (
              <SimpleImageDisplay
                images={convertToProductImages([thumbnail])}
                productName={item.productName}
                size="sm"
                className="w-full h-full rounded-xl"
              />
            ) : (
              <Package className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{item.productName}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <span className="font-mono">{item.sku}</span>
              {item.variantName !== 'Default' && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 font-medium">{item.variantName}</span>
                </>
              )}
            </div>
            {/* Show specifications if available */}
            {item.attributes && Object.keys(item.attributes).length > 0 && (
              <div className="mt-3">
                <div className="space-y-1.5">
                  {Object.entries(item.attributes).slice(0, 6).map(([key, value]) => {
                    const IconComponent = getSpecificationIcon(key);
                    const tooltip = getSpecificationTooltip(key);
                    const formattedValue = formatSpecificationValue(key, value);
                    
                    // Enhanced color scheme with better contrast
                    const getSpecColor = (specKey: string) => {
                      const spec = specKey.toLowerCase();
                      if (spec.includes('ram')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      if (spec.includes('storage') || spec.includes('memory')) return 'bg-blue-50 text-blue-800 border-blue-200';
                      if (spec.includes('processor') || spec.includes('cpu')) return 'bg-purple-50 text-purple-800 border-purple-200';
                      if (spec.includes('screen') || spec.includes('display')) return 'bg-orange-50 text-orange-800 border-orange-200';
                      if (spec.includes('battery')) return 'bg-teal-50 text-teal-800 border-teal-200';
                      if (spec.includes('camera')) return 'bg-pink-50 text-pink-800 border-pink-200';
                      if (spec.includes('color')) return 'bg-red-50 text-red-800 border-red-200';
                      if (spec.includes('weight') || spec.includes('size')) return 'bg-gray-50 text-gray-800 border-gray-200';
                      if (spec.includes('charger') || spec.includes('port')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
                      return 'bg-slate-50 text-slate-800 border-slate-200';
                    };
                    
                    return (
                      <div 
                        key={key} 
                        className={`p-2 rounded-md border ${getSpecColor(key)} hover:shadow-sm transition-all duration-200 cursor-help`}
                        title={tooltip}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {IconComponent && <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />}
                            <div>
                              <div className="text-xs font-medium capitalize text-gray-700">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-semibold">
                            {formattedValue}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {Object.keys(item.attributes).length > 6 && (
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium">
                      +{Object.keys(item.attributes).length - 6} more
                    </span>
                  </div>
                )}
              </div>
            )}
            
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
                      </div>
                      
                      {/* Enhanced Specifications Display in Cart */}
                      {Object.entries(variant.attributes).length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(variant.attributes).map(([key, value]) => {
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
                                <span key={key} className={`px-2 py-1 rounded text-xs font-medium ${getSpecColor(key)}`}>
                                  {key.replace(/_/g, ' ')}: {value}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
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

