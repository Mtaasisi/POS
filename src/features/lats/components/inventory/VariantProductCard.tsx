// VariantProductCard component for ProductCatalogPage
import React, { useState } from 'react';
import { Package, Tag, ChevronDown, ChevronUp, Star, Eye, Edit, Trash2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { format } from '../../lib/format';

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  isActive?: boolean;
  attributes?: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  images?: string[];
  tags?: string[];
  isActive: boolean;
  variants: ProductVariant[];
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface VariantProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onToggleActive?: (product: Product) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const VariantProductCard: React.FC<VariantProductCardProps> = ({
  product,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  showActions = true,
  variant = 'default',
  className = ''
}) => {
  const [showVariants, setShowVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Get primary variant (first active variant or first variant)
  const primaryVariant = product.variants.find(v => v.isActive) || product.variants[0];
  
  // Calculate product stats
  const totalStock = product.variants.reduce((sum, v) => sum + v.quantity, 0);
  const totalValue = product.variants.reduce((sum, v) => sum + (v.quantity * v.sellingPrice), 0);
  const activeVariants = product.variants.filter(v => v.isActive).length;
  const lowStockVariants = product.variants.filter(v => v.quantity <= v.minQuantity).length;

  // Get stock status
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return 'out-of-stock';
    if (stock <= minStock) return 'low';
    return 'normal';
  };

  const stockStatus = primaryVariant ? getStockStatus(primaryVariant.quantity, primaryVariant.minQuantity) : 'normal';

  // Get stock status badge
  const getStockStatusBadge = () => {
    switch (stockStatus) {
      case 'out-of-stock':
        return <GlassBadge variant="error" size="sm">Out of Stock</GlassBadge>;
      case 'low':
        return <GlassBadge variant="warning" size="sm">Low Stock</GlassBadge>;
      default:
        return <GlassBadge variant="success" size="sm">In Stock</GlassBadge>;
    }
  };

  // Get price range
  const getPriceRange = () => {
    const prices = product.variants.map(v => v.sellingPrice).filter(p => p > 0);
    if (prices.length === 0) return 'No price set';
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return format.money(minPrice);
    }
    return `${format.money(minPrice)} - ${format.money(maxPrice)}`;
  };

  // Handle variant selection
  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowVariants(false);
  };

  // Check if product has multiple variants
  const hasMultipleVariants = product.variants.length > 1;

  if (variant === 'compact') {
    return (
      <GlassCard 
        className={`p-3 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group ${className}`}
        onClick={() => onView && onView(product)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{product.name}</div>
              <div className="text-sm text-gray-600 truncate">
                {primaryVariant?.sku || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                {product.categoryName && (
                  <>
                    <span>{product.categoryName}</span>
                    {product.brandName && <span>•</span>}
                  </>
                )}
                {product.brandName && (
                  <span>{product.brandName}</span>
                )}
              </div>
              {hasMultipleVariants && (
                <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Tag className="w-3 h-3" />
                  {product.variants.length} variants
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-gray-900">{getPriceRange()}</div>
            <div className="text-xs text-gray-500">
              Stock: {totalStock}
            </div>
            {getStockStatusBadge()}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard 
      className={`p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group ${className}`}
      onClick={() => onView && onView(product)}
    >
      {/* Product Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <span className="font-mono">{primaryVariant?.sku || 'N/A'}</span>
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
            {hasMultipleVariants && (
              <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                <Tag className="w-3 h-3" />
                {product.variants.length} variants available
              </div>
            )}
            <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
              Click to view details
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {product.tags?.includes('featured') && (
            <GlassBadge variant="warning" size="sm">
              <Star className="w-3 h-3" />
              Featured
            </GlassBadge>
          )}
          {getStockStatusBadge()}
        </div>
      </div>

      {/* Price and Stock Info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-lg font-bold text-gray-900">{getPriceRange()}</div>
          <div className="text-sm text-gray-600">
            Total Stock: {totalStock} units
          </div>
          {lowStockVariants > 0 && (
            <div className="text-xs text-orange-600">
              {lowStockVariants} variant(s) low on stock
            </div>
          )}
        </div>
        <div className="text-right">
          {hasMultipleVariants && (
            <GlassButton
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setShowVariants(!showVariants);
              }}
              className="mb-2"
            >
              {showVariants ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Variants
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Variants
                </>
              )}
            </GlassButton>
          )}
        </div>
      </div>

      {/* Variants Section */}
      {hasMultipleVariants && showVariants && (
        <div className="border-t border-gray-200 pt-3 mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Product Variants:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {product.variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const variantStockStatus = getStockStatus(variant.quantity, variant.minQuantity);
              
              return (
                <div
                  key={variant.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVariantSelect(variant);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{variant.name}</div>
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="font-mono">{variant.sku}</span>
                        {variant.attributes && Object.entries(variant.attributes).map(([key, value]) => (
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

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              product.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
            {activeVariants > 0 && (
              <span className="text-xs text-blue-600">
                {activeVariants} active variants
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(product);
                }}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="View Details"
              >
                <Eye size={16} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                title="Edit Product"
              >
                <Edit size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product);
                }}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                title="Delete Product"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedVariant.name} - {format.money(selectedVariant.sellingPrice)}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default VariantProductCard;
