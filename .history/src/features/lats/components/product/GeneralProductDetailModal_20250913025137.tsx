import React, { useState, useEffect } from 'react';
import { 
  X, Package, Tag, Hash, DollarSign, Edit, Star, MapPin, Calendar, 
  TrendingUp, TrendingDown, BarChart3, CheckCircle, Battery, Monitor, Camera, 
  FileText, Layers, Clock, User, Truck, QrCode, ShoppingCart, Scale, 
  Zap, Shield, Target, Percent, Calculator, Banknote, Receipt, 
  Copy, Download, Share2, Archive, History, Store, Building,
  HardDrive, Cpu, Palette, Ruler, Hand, Unplug, Fingerprint, Radio, XCircle,
  Info, Plus, Minus, Save, RotateCcw
} from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import { Product } from '../../types/inventory';
import { RobustImageService, ProductImage } from '../../../../lib/robustImageService';
import { format } from '../../lib/format';
import { formatSpecificationValue, parseSpecification, getSpecificationIcon } from '../../lib/specificationUtils';
import { exportProductData, generateProductReport } from '../../lib/productUtils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { 
  calculateTotalStock, 
  calculateTotalCostValue, 
  calculateTotalRetailValue, 
  calculatePotentialProfit,
  calculateProfitMargin, 
  getStockStatus 
} from '../../lib/productCalculations';
import EnhancedStockAdjustModal from '../inventory/EnhancedStockAdjustModal';

interface GeneralProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onEdit?: (product: Product) => void;
}

const GeneralProductDetailModal: React.FC<GeneralProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit
}) => {
  const { currentUser } = useAuth();
  const { adjustStock, getProduct } = useInventoryStore();
  const [currentProduct, setCurrentProduct] = useState(product);
  
  // Stock adjustment state
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  // Update current product when prop changes
  useEffect(() => {
    setCurrentProduct(product);
    
  }, [product]);

  // Listen for product data updates from other parts of the app
  useEffect(() => {
    const handleProductDataUpdate = (event: CustomEvent) => {
      const { updatedProducts } = event.detail;
      if (product && updatedProducts.includes(product.id)) {
        // Trigger a re-render by updating the current product
        setCurrentProduct({ ...product });
      }
    };

    window.addEventListener('productDataUpdated', handleProductDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('productDataUpdated', handleProductDataUpdate as EventListener);
    };
  }, [product]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Load product images
  useEffect(() => {
    const loadImages = async () => {
      if (!product?.id) return;
      
      try {
        const productImages = await RobustImageService.getProductImages(product.id);
        setImages(productImages);
      } catch (error) {
      }
    };

    if (isOpen && product) {
      loadImages();
    }
  }, [isOpen, product?.id]);

  // Calculate analytics
  const analytics = React.useMemo(() => {
    if (!product?.variants) return null;
    
    return {
      totalStock: calculateTotalStock(product.variants),
      totalCostValue: calculateTotalCostValue(product.variants),
      totalRetailValue: calculateTotalRetailValue(product.variants),
      potentialProfit: calculatePotentialProfit(product.variants),
      profitMargin: calculateProfitMargin(product.variants),
      stockStatus: getStockStatus(product.variants)
    };
  }, [product?.variants]);

  // Parse specifications
  const specifications = React.useMemo(() => {
    const primaryVariant = product?.variants?.[0];
    if (!primaryVariant?.attributes?.specification) return {};
    
    return parseSpecification(primaryVariant.attributes.specification);
  }, [product?.variants]);

  if (!isOpen || !product) return null;

  const primaryVariant = product.variants?.[0];
  const hasMultipleVariants = (product.variants?.length || 0) > 1;
  const daysInStock = product.createdAt ? Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const completeness = Math.round(((product.name ? 20 : 0) + 
    (product.description ? 15 : 0) + 
    (images.length > 0 ? 25 : 0) + 
    (Object.keys(specifications).length > 0 ? 20 : 0) + 
    (primaryVariant?.sellingPrice > 0 ? 20 : 0)));

  // Generate QR Code for product
  const handleGenerateQRCode = () => {
    try {
      const productUrl = `${window.location.origin}/lats/products/${product.id}`;
      const qrData = `Product: ${product.name}\nSKU: ${primaryVariant?.sku || 'N/A'}\nPrice: ${format.money(primaryVariant?.sellingPrice || 0)}\nDetails: ${productUrl}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      setQrCodeUrl(qrUrl);
      setShowQRModal(true);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  // Export product data
  const handleExportProduct = () => {
    try {
      const productData = {
        name: product.name,
        sku: primaryVariant?.sku || '',
        categoryId: product.categoryId,
        condition: primaryVariant?.condition || '',
        description: product.description || '',
        specification: primaryVariant?.attributes?.specification || '',
        price: primaryVariant?.sellingPrice || 0,
        costPrice: primaryVariant?.costPrice || 0,
        stockQuantity: primaryVariant?.quantity || 0,
        minStockLevel: primaryVariant?.minQuantity || 0,
        storageRoomId: '',
        shelfId: '',
        images: [],
        metadata: product.metadata || {},
        variants: []
      };

      const variants = product.variants || [];
      const exportedData = exportProductData(productData, variants);
      
      // Create and download file
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Product data exported successfully!');
    } catch (error) {
      toast.error('Failed to export product data');
    }
  };

  // Share product
  const handleShareProduct = async () => {
    try {
      const productUrl = `${window.location.origin}/lats/products/${product.id}`;
      const shareData = {
        title: `Product: ${product.name}`,
        text: `Check out this product: ${product.name} - ${format.money(primaryVariant?.sellingPrice || 0)}`,
        url: productUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Product shared successfully!');
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(productUrl);
        toast.success('Product link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share product');
    }
  };

  // Add to cart (navigate to POS)
  const handleAddToCart = () => {
    try {
      // Store product in localStorage for POS to pick up
      localStorage.setItem('pos_quick_add', JSON.stringify({
        productId: product.id,
        variantId: primaryVariant?.id,
        timestamp: Date.now()
      }));
      
      toast.success('Product added! Redirecting to POS...');
      setTimeout(() => {
        window.open('/lats/pos', '_blank');
      }, 1000);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // Stock adjustment functions
  const handleStockAdjustment = async () => {
    if (!selectedVariant || adjustmentQuantity === 0 || !adjustmentReason.trim()) {
      toast.error('Please select a variant, enter quantity, and provide a reason');
      return;
    }

    setIsAdjustingStock(true);
    try {
      const response = await adjustStock(
        product.id,
        selectedVariant.id,
        adjustmentQuantity,
        adjustmentReason
      );

      if (response.ok) {
        toast.success('Stock adjusted successfully');
        setShowStockAdjustment(false);
        setSelectedVariant(null);
        setAdjustmentQuantity(0);
        setAdjustmentReason('');
        
        // Refresh product data from database
        try {
          const updatedProductResponse = await getProduct(product.id);
          if (updatedProductResponse.ok && updatedProductResponse.data) {
            setCurrentProduct(updatedProductResponse.data);
          }
        } catch (error) {
        }
      } else {
        toast.error(response.message || 'Failed to adjust stock');
      }
    } catch (error) {
      toast.error('Failed to adjust stock');
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const openStockAdjustment = () => {
    setShowStockAdjustment(true);
  };

  const closeStockAdjustment = () => {
    setShowStockAdjustment(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
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
              <p className="text-sm text-gray-500">{primaryVariant?.sku || 'No SKU'}</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Financial Overview - Minimal Design */}
          {analytics && (
            <div className="mb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Value</div>
                  <div className="text-lg font-bold text-emerald-900">{format.money(analytics.totalRetailValue)}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Profit</div>
                  <div className="text-lg font-bold text-blue-900">{format.money(analytics.potentialProfit)}</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Margin</div>
                  <div className="text-lg font-bold text-orange-900">{analytics.profitMargin.toFixed(1)}%</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Investment</div>
                  <div className="text-lg font-bold text-purple-900">{format.money(analytics.totalCostValue)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Product Image & Basic Info */}
            <div className="space-y-6">
              {/* Product Image */}
              <div className="space-y-4">
                <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImageIndex]?.url || images[0]?.url}
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
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
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

              {/* Product Specifications - Simplified */}
              {Object.keys(specifications).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Specifications</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(specifications).slice(0, 6).map(([key, value]) => {
                      const formattedValue = formatSpecificationValue(key, value);
                      return (
                        <div key={key} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-semibold text-gray-900">{formattedValue}</span>
                        </div>
                      );
                    })}
                    {Object.keys(specifications).length > 6 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        +{Object.keys(specifications).length - 6} more specifications
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Description</h3>
                  <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                    {product.description}
                  </div>
                </div>
              )}


            </div>

            {/* Right Column - Essential Information & Actions */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Category</span>
                    <span className="text-sm font-semibold text-gray-900">{currentProduct.category?.name || 'Uncategorized'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-semibold ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Stock</span>
                    <span className="text-sm font-semibold text-gray-900">{currentProduct.totalQuantity || 0}</span>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pricing</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Selling Price</span>
                    <span className="text-sm font-semibold text-gray-900">{format.money(primaryVariant?.sellingPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Cost Price</span>
                    <span className="text-sm font-semibold text-gray-900">{format.money(primaryVariant?.costPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Profit/Unit</span>
                    <span className="text-sm font-semibold text-green-600">
                      {format.money((primaryVariant?.sellingPrice || 0) - (primaryVariant?.costPrice || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to POS
                  </button>
                  
                  <button
                    onClick={handleGenerateQRCode}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </button>

                  <button
                    onClick={handleExportProduct}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </button>
                </div>
              </div>






              {/* Product Variants - Simplified */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Variants</h3>
                  <div className="space-y-2">
                    {product.variants.slice(0, 3).map((variant, index) => (
                      <div key={variant.id || index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{variant.name || `Variant ${index + 1}`}</span>
                          <span className="text-xs text-gray-500">({variant.sku})</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600">Stock: {variant.quantity || 0}</span>
                          <span className="font-semibold text-gray-900">{format.money(variant.sellingPrice || 0)}</span>
                        </div>
                      </div>
                    ))}
                    {product.variants.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        +{product.variants.length - 3} more variants
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>











          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to POS
              </button>
              
              <button
                onClick={handleGenerateQRCode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </button>

              <button
                onClick={handleExportProduct}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Close
              </button>
              
              {onEdit && (
                <button
                  onClick={() => onEdit(product)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
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
                  <p>SKU: {primaryVariant?.sku}</p>
                  <p>Price: {format.money(primaryVariant?.sellingPrice || 0)}</p>
                </div>

                <div className="flex gap-2">
                  <GlassButton
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
                      link.click();
                      toast.success('QR Code downloaded!');
                    }}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </GlassButton>
                  
                  <GlassButton
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/lats/products/${product.id}`);
                      toast.success('Product link copied!');
                    }}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stock Adjustment Modal */}
        {showStockAdjustment && (
          <EnhancedStockAdjustModal
            product={currentProduct}
            isOpen={showStockAdjustment}
            onClose={closeStockAdjustment}
            onSubmit={async (data) => {
              const { variant, ...adjustmentData } = data;
              let quantity = adjustmentData.quantity;
              
              // Calculate the actual quantity change based on adjustment type
              if (adjustmentData.adjustmentType === 'out') {
                quantity = -quantity; // Negative for stock out
              } else if (adjustmentData.adjustmentType === 'set') {
                quantity = quantity - variant.quantity; // Difference for set
              }
              
              await handleStockAdjustment(currentProduct.id, variant.id, quantity, adjustmentData.reason);
            }}
            loading={isAdjustingStock}
          />
        )}
      </div>
    </div>
  );
};

export default GeneralProductDetailModal;