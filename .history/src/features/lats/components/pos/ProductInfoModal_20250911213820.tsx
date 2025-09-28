import React from 'react';
import { X, Package, Tag, Hash, MapPin, Calendar, AlertCircle, CheckCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { ProductSearchResult, ProductSearchVariant } from '../../types/pos';
import { getSpecificationIcon, getSpecificationTooltip, getShelfDisplay, getShelfIcon, formatSpecificationValue } from '../../lib/specificationUtils';
import { getProductTotalStock, getProductStockStatus } from '../../lib/productUtils';
import { SimpleImageDisplay } from '../../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../../lib/robustImageService';

interface ProductInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductSearchResult;
  onAddToCart?: (product: ProductSearchResult, variant: ProductSearchVariant, quantity: number) => void;
}

const ProductInfoModal: React.FC<ProductInfoModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart
}) => {
  if (!isOpen || !product) return null;

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
  const totalStock = getProductTotalStock(product);
  const stockStatus = getProductStockStatus(product);

  // Get stock status badge
  const getStockStatusBadge = () => {
    switch (stockStatus) {
      case 'out-of-stock':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Out of Stock
          </span>
        );
      case 'low-stock':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Low Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            In Stock
          </span>
        );
    }
  };

  // Get price range display
  const getPriceRangeDisplay = () => {
    if (!product.variants || product.variants.length === 0) {
      return 'No variants available';
    }

    const prices = product.variants
      .map(v => v.sellingPrice)
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return 'No price set';
    }

    if (prices.length === 1) {
      return `TSh ${prices[0].toLocaleString()}`;
    }

    return `TSh ${prices[0].toLocaleString()} - TSh ${prices[prices.length - 1].toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Product Information</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Product Header */}
            <div className="flex gap-6">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200">
                  <SimpleImageDisplay
                    images={productImages}
                    productName={product.name}
                    size="lg"
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">SKU: {product.variants?.[0]?.sku || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Category: {product.categoryName || 'Uncategorized'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span className="text-lg font-semibold text-green-600">{getPriceRangeDisplay()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStockStatusBadge()}
                    <span className="text-sm text-gray-600">Total Stock: {totalStock}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants Section */}
            {product.variants && product.variants.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Variants ({product.variants.length})
                </h4>
                <div className="grid gap-4">
                  {product.variants.map((variant, index) => {
                    // Handle nested specification structure
                    let specifications = variant.attributes;
                    if (variant.attributes?.specification && typeof variant.attributes.specification === 'string') {
                      try {
                        specifications = JSON.parse(variant.attributes.specification);
                      } catch (error) {
                        console.error('Failed to parse specification JSON:', error);
                        specifications = {};
                      }
                    }

                    return (
                      <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">{variant.name}</h5>
                            <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              TSh {variant.sellingPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Stock: {variant.quantity}
                            </div>
                          </div>
                        </div>

                        {/* Variant Specifications */}
                        {specifications && Object.keys(specifications).length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(specifications).map(([key, value]) => {
                              const IconComponent = getSpecificationIcon(key);
                              const tooltip = getSpecificationTooltip(key);
                              const formattedValue = formatSpecificationValue(key, value);
                              
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
                                  className={`p-2 rounded-lg border ${getSpecColor(key)}`}
                                  title={tooltip}
                                >
                                  <div className="flex items-center gap-2">
                                    {IconComponent && <IconComponent className="w-3 h-3 flex-shrink-0" />}
                                    <span className="text-xs font-medium capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>
                                    <span className="text-xs font-semibold">
                                      {formattedValue}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Add to Cart Button for this variant */}
                        {onAddToCart && variant.quantity > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => {
                                onAddToCart(product, variant, 1);
                                onClose();
                              }}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                              Add to Cart - TSh {variant.sellingPrice.toLocaleString()}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shelf Information */}
            {(product.shelfName || product.shelfCode || product.storeLocationName) && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const ShelfIcon = getShelfIcon({
                        isRefrigerated: product.isRefrigerated,
                        requiresLadder: product.requiresLadder
                      });
                      return <ShelfIcon className="w-5 h-5 text-gray-500" />;
                    })()}
                    <span className="text-gray-700">
                      {getShelfDisplay({
                        shelfName: product.shelfName,
                        shelfCode: product.shelfCode,
                        storeLocationName: product.storeLocationName,
                        storeLocationCity: product.storeLocationCity,
                        storageRoomName: product.storageRoomName,
                        storageRoomCode: product.storageRoomCode,
                        isRefrigerated: product.isRefrigerated,
                        requiresLadder: product.requiresLadder
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Product ID</div>
                  <div className="font-mono text-sm">{product.id}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Variants</div>
                  <div className="font-semibold">{product.variants?.length || 0}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Stock</div>
                  <div className="font-semibold">{totalStock} units</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Stock Status</div>
                  <div>{getStockStatusBadge()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfoModal;
