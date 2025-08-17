// VariantProductCard component for ProductCatalogPage
import React, { useState } from 'react';
import { Package, Tag, ChevronDown, ChevronUp, Star, Eye, Edit, Trash2, TrendingUp, Zap, Shield } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import ProductImageDisplay from './ProductImageDisplay';
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

  // Get stock status badge with enhanced styling
  const getStockStatusBadge = () => {
    switch (stockStatus) {
      case 'out-of-stock':
        return (
          <span className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap bg-red-50 border border-red-200 text-red-700 focus:ring-red-500/50 px-3 py-1.5 text-xs min-h-6 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            Out of Stock
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap bg-orange-50 border border-orange-200 text-orange-700 focus:ring-orange-500/50 px-3 py-1.5 text-xs min-h-6 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            Low Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap bg-green-50 border border-green-200 text-green-700 focus:ring-green-500/50 px-3 py-1.5 text-xs min-h-6 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            In Stock
          </span>
        );
    }
  };

  // Get price range with enhanced formatting
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
      <div className={`transition-all duration-300 ease-in-out backdrop-blur-sm relative bg-white/80 border border-gray-200/60 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-gray-300/80 cursor-pointer group overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="relative">
                <ProductImageDisplay
                  images={product.images}
                  productName={product.name}
                  size="sm"
                  className="flex-shrink-0 rounded-xl overflow-hidden shadow-sm"
                />
                {product.tags?.includes('featured') && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                    <Star className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate text-sm">{product.name}</div>
                <div className="text-xs text-gray-500 font-mono mt-1">
                  {primaryVariant?.sku || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  {product.categoryName && (
                    <>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full">{product.categoryName}</span>
                      {product.brandName && <span>•</span>}
                    </>
                  )}
                  {product.brandName && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">{product.brandName}</span>
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
              <div className="font-bold text-gray-900 text-lg">{getPriceRange()}</div>
              <div className="text-xs text-gray-500 mt-1">
                Stock: {totalStock}
              </div>
              <div className="mt-2">
                {getStockStatusBadge()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`transition-all duration-300 ease-in-out backdrop-blur-sm relative bg-white/90 border border-gray-200/60 p-6 rounded-2xl shadow-sm hover:shadow-2xl hover:scale-[1.02] hover:border-gray-300/80 cursor-pointer group overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          {/* Product Image with Enhanced Styling */}
          <div className="relative mb-6">
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <ProductImageDisplay
                images={product.images}
                productName={product.name}
                size="lg"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Enhanced Status Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {!product.isActive && (
                <div className="px-3 py-1.5 bg-red-100/90 backdrop-blur-sm text-red-800 text-xs rounded-full font-medium shadow-sm border border-red-200/50">
                  Inactive
                </div>
              )}
              {product.tags?.includes('featured') && (
                <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-400/90 to-orange-500/90 backdrop-blur-sm text-white text-xs rounded-full font-medium shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Featured
                </div>
              )}
            </div>

            {/* Stock Status with Enhanced Positioning */}
            <div className="absolute top-3 right-3">
              {getStockStatusBadge()}
            </div>

            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-2">
                {onView && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(product);
                    }}
                    className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:text-blue-600 transition-all duration-200 rounded-full shadow-lg hover:shadow-xl hover:scale-110"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(product);
                    }}
                    className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:text-green-600 transition-all duration-200 rounded-full shadow-lg hover:shadow-xl hover:scale-110"
                    title="Edit Product"
                  >
                    <Edit size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Product Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-blue-900 transition-colors duration-200">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description ? `${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}` : 'No description available'}
              </p>
            </div>

            {/* Enhanced Price and Stock Section */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200/50">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{getPriceRange()}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Stock: {totalStock} units
                </div>
                {lowStockVariants > 0 && (
                  <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                    <Zap className="w-3 h-3" />
                    {lowStockVariants} variant(s) low on stock
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 font-mono">
                  SKU: {primaryVariant?.sku || 'N/A'}
                </div>
                {hasMultipleVariants && (
                  <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <Tag className="w-3 h-3" />
                    {product.variants.length} variants
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Category and Brand Tags */}
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
              {product.categoryName && (
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium shadow-sm">
                  {product.categoryName}
                </span>
              )}
              {product.brandName && (
                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-medium shadow-sm">
                  {product.brandName}
                </span>
              )}
            </div>

            {/* Enhanced Actions Section */}
            {showActions && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200/60">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium shadow-sm ${
                    product.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {activeVariants > 0 && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {activeVariants} active variants
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {onView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(product);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg"
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
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 rounded-lg"
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
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg"
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant with enhanced design
  return (
    <div className={`transition-all duration-300 ease-in-out backdrop-blur-sm relative bg-white/90 border border-gray-200/60 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-gray-300/80 cursor-pointer group overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        {/* Enhanced Product Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="relative">
              <ProductImageDisplay
                images={product.images}
                productName={product.name}
                size="md"
                className="flex-shrink-0 rounded-xl overflow-hidden shadow-md"
              />
              {product.tags?.includes('featured') && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                  <Star className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-900 transition-colors duration-200">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded-md">{primaryVariant?.sku || 'N/A'}</span>
                {product.categoryName && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {product.categoryName}
                    </span>
                  </>
                )}
                {product.brandName && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {product.brandName}
                    </span>
                  </>
                )}
              </div>
              {hasMultipleVariants && (
                <div className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                  <Tag className="w-3 h-3" />
                  {product.variants.length} variants available
                </div>
              )}
              <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                Click to view details
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStockStatusBadge()}
          </div>
        </div>

        {/* Enhanced Price and Stock Info */}
        <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200/50">
          <div>
            <div className="text-xl font-bold text-gray-900 mb-1">{getPriceRange()}</div>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Stock: {totalStock} units
            </div>
            {lowStockVariants > 0 && (
              <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                <Zap className="w-3 h-3" />
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
                className="mb-2 shadow-sm"
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

        {/* Enhanced Variants Section */}
        {hasMultipleVariants && showVariants && (
          <div className="border-t border-gray-200/60 pt-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Product Variants:
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {product.variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                const variantStockStatus = getStockStatus(variant.quantity, variant.minQuantity);
                
                return (
                  <div
                    key={variant.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVariantSelect(variant);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{variant.name}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{variant.sku}</span>
                          {variant.attributes && Object.entries(variant.attributes).map(([key, value]) => (
                            <span key={key} className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-gray-900">{format.money(variant.sellingPrice)}</div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                          variantStockStatus === 'out-of-stock' ? 'bg-red-100 text-red-700' :
                          variantStockStatus === 'low' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
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

        {/* Enhanced Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200/60">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium shadow-sm ${
                product.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
              {activeVariants > 0 && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {activeVariants} active variants
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(product);
                  }}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg"
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
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 rounded-lg"
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
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg"
                  title="Delete Product"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Selected Variant Info */}
        {selectedVariant && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="text-sm text-blue-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <strong>Selected:</strong> {selectedVariant.name} - {format.money(selectedVariant.sellingPrice)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariantProductCard;
