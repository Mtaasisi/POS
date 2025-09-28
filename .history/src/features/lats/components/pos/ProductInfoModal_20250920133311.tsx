import React, { useState } from 'react';
import { 
  X, Package, Tag, MapPin, AlertCircle, CheckCircle, 
  ShoppingCart, QrCode, Copy, Download,
  Info, Layers, Star, Building, Target
} from 'lucide-react';
import { ProductSearchResult, ProductSearchVariant } from '../../types/pos';
import { getSpecificationIcon, formatSpecificationValue } from '../../lib/specificationUtils';
import { getProductTotalStock, getProductStockStatus } from '../../lib/productUtils';
import { ProductImage } from '../../../../lib/robustImageService';
import { format } from '../../lib/format';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductSearchVariant | null>(null);
  const [showAllVariants, setShowAllVariants] = useState(false);
  const { currentUser } = useAuth();
  
  const isAdmin = currentUser?.role === 'admin';

  // Initialize selected variant
  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product?.variants]);

  // Reset showAllVariants when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowAllVariants(false);
    }
  }, [isOpen]);

  // Early return after all hooks
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
  const primaryVariant = product.variants?.[0];
  const hasMultipleVariants = (product.variants?.length || 0) > 1;
  
  // Get current variant (selected or primary)
  const currentVariant = selectedVariant || primaryVariant;

  // Get stock status badge
  const getStockStatusBadge = () => {
    switch (stockStatus) {
      case 'out-of-stock':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Out of Stock
          </span>
        );
      case 'low-stock':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Low Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
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
      return format.money(prices[0]);
    }

    return `${format.money(prices[0])} - ${format.money(prices[prices.length - 1])}`;
  };

  // Generate QR Code for product
  const handleGenerateQRCode = () => {
    try {
      const productUrl = `${window.location.origin}/lats/products/${product.id}/edit`;
      const qrData = `Product: ${product.name}\nSKU: ${currentVariant?.sku || 'N/A'}\nPrice: ${format.money(currentVariant?.sellingPrice || 0)}\nDetails: ${productUrl}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      setQrCodeUrl(qrUrl);
      setShowQRModal(true);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  // Copy product info
  const handleCopyInfo = () => {
    const productInfo = `Product: ${product.name}\nSKU: ${currentVariant?.sku || 'N/A'}\nPrice: ${format.money(currentVariant?.sellingPrice || 0)}\nStock: ${currentVariant?.quantity || 0}`;
    navigator.clipboard.writeText(productInfo);
    toast.success('Product info copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Full Page */}
      <div 
        className="relative bg-white w-full h-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-500">{currentVariant?.sku || 'No SKU'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Financial Overview - Minimal Design */}
          <div className="mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Selected Price</div>
                <div className="text-lg font-bold text-emerald-900">
                  {format.money(currentVariant?.sellingPrice || 0)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Price Range</div>
                <div className="text-lg font-bold text-blue-900">{getPriceRangeDisplay()}</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Stock Status</div>
                <div className="text-lg font-bold text-orange-900">{totalStock} units</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Variants</div>
                <div className="text-lg font-bold text-purple-900">{product.variants?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Column - Product Image & Basic Info */}
            <div className="space-y-6">
              {/* Product Image */}
              <div className="space-y-4">
                <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                  {productImages.length > 0 ? (
                    <img
                      src={productImages[selectedImageIndex]?.url || productImages[0]?.url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-20 h-20" />
                    </div>
                  )}
                </div>
                
                {/* Image Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {productImages.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                          index === selectedImageIndex 
                            ? 'border-blue-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Basic Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
                    <p className="text-sm font-medium text-gray-900">{product.categoryName || product.category?.name || 'Uncategorized'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                    <div>{getStockStatusBadge()}</div>
                  </div>
                </div>
              </div>

              {/* Product Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Specifications</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {product.specifications.slice(0, 6).map((spec, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {getSpecificationIcon(spec.name)}
                          <span className="text-sm font-medium text-gray-900">{spec.name}</span>
                        </div>
                        <span className="text-sm text-gray-600 font-mono">
                          {formatSpecificationValue(spec.value, spec.name)}
                        </span>
                      </div>
                    ))}
                    {product.specifications.length > 6 && (
                      <div className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded-lg">
                        +{product.specifications.length - 6} more specifications
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shelf Information */}
              {(product.shelfCode || product.shelfName || product.storeLocationName || product.storageRoomName) && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Location</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {product.shelfCode && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Shelf Code</span>
                        <p className="text-sm font-medium text-gray-900">{product.shelfCode}</p>
                      </div>
                    )}
                    {product.shelfName && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Shelf Name</span>
                        <p className="text-sm font-medium text-gray-900">{product.shelfName}</p>
                      </div>
                    )}
                    {product.storeLocationName && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Store Location</span>
                        <p className="text-sm font-medium text-gray-900">{product.storeLocationName}</p>
                      </div>
                    )}
                    {product.storageRoomName && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Storage Room</span>
                        <p className="text-sm font-medium text-gray-900">{product.storageRoomName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Variants & Actions */}
            <div className="space-y-6">
              {/* Product Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Product Variants</h3>
                  </div>
                  <div className="space-y-2">
                    {(showAllVariants ? product.variants : product.variants.slice(0, 3)).map((variant, index) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      return (
                        <div 
                          key={variant.id || index} 
                          className={`flex justify-between items-center py-4 px-4 rounded-lg cursor-pointer transition-all min-h-[60px] ${
                            isSelected 
                              ? 'bg-blue-50 border-2 border-blue-200' 
                              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                          }`}
                          onClick={() => setSelectedVariant(variant)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              isSelected ? 'bg-blue-500' : 'bg-purple-500'
                            }`}></div>
                            <span className={`text-base font-medium ${
                              isSelected ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {variant.name || `Variant ${index + 1}`}
                            </span>
                            {isSelected && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-base">
                            <span className={`${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                              Stock: {variant.quantity || 0}
                            </span>
                            <span className={`font-semibold text-lg ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {format.money(variant.sellingPrice || 0)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {product.variants.length > 3 && (
                      <button
                        onClick={() => setShowAllVariants(!showAllVariants)}
                        className="w-full text-sm text-blue-600 hover:text-blue-800 text-center py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium min-h-[48px]"
                      >
                        {showAllVariants 
                          ? `Show Less (${product.variants.length - 3} hidden)` 
                          : `Show More (+${product.variants.length - 3} variants)`
                        }
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Supplier Information */}
              {product.supplier && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Building className="w-5 h-5 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Supplier Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                      <p className="text-sm font-medium text-gray-900">{product.supplier.name}</p>
                    </div>
                    {product.supplier.contactPerson && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Contact</span>
                        <p className="text-sm font-medium text-gray-900">{product.supplier.contactPerson}</p>
                      </div>
                    )}
                    {product.supplier.phone && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                        <p className="text-sm font-medium text-gray-900">{product.supplier.phone}</p>
                      </div>
                    )}
                    {product.supplier.email && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Email</span>
                        <p className="text-sm font-medium text-gray-900">{product.supplier.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Variant Details */}
              {currentVariant && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Selected Variant</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                      <p className="text-sm font-medium text-gray-900">{currentVariant.name || 'Default'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">SKU</span>
                      <p className="text-sm font-medium text-gray-900 font-mono">{currentVariant.sku}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Price</span>
                      <p className="text-lg font-bold text-green-600">{format.money(currentVariant.sellingPrice || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Stock</span>
                      <p className={`text-sm font-medium ${
                        (currentVariant.quantity || 0) > 10 ? 'text-green-600' : 
                        (currentVariant.quantity || 0) > 0 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {currentVariant.quantity || 0} units
                      </p>
                    </div>
                    {currentVariant.costPrice && currentVariant.costPrice > 0 && isAdmin && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Cost Price</span>
                        <p className="text-sm font-medium text-gray-900">{format.money(currentVariant.costPrice)}</p>
                      </div>
                    )}
                    {currentVariant.costPrice && currentVariant.costPrice > 0 && isAdmin && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Profit</span>
                        <p className="text-sm font-medium text-blue-600">
                          {format.money((currentVariant.sellingPrice || 0) - currentVariant.costPrice)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleGenerateQRCode}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </button>
                  <button
                    onClick={handleCopyInfo}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {onAddToCart && currentVariant && currentVariant.quantity > 0 && (
              <button
                onClick={() => {
                  onAddToCart(product, currentVariant, 1);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold text-lg min-h-[56px]"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart - {format.money(currentVariant.sellingPrice || 0)}
              </button>
            )}
            {currentVariant && currentVariant.quantity <= 0 && (
              <div className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-500 rounded-lg font-semibold text-lg min-h-[56px]">
                <AlertCircle className="w-5 h-5" />
                Out of Stock
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium min-h-[56px]"
            >
              Close
            </button>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowQRModal(false)}
            />
            <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Product QR Code</h3>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                  <img 
                    src={qrCodeUrl} 
                    alt="Product QR Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{product.name}</p>
                  <p>SKU: {currentVariant?.sku}</p>
                  <p>Price: {format.money(currentVariant?.sellingPrice || 0)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
                      link.click();
                      toast.success('QR Code downloaded!');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/lats/products/${product.id}/edit`);
                      toast.success('Product link copied!');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfoModal;
