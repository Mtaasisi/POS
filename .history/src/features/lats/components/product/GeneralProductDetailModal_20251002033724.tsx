import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Package, Hash, DollarSign, Edit, Star, MapPin, Calendar, 
  TrendingUp, TrendingDown, BarChart3, CheckCircle,
  FileText, Layers, Truck, QrCode, ShoppingCart,
  Target, Calculator, Banknote, Receipt, 
  Copy, Download, Building,
  Info, CheckCircle2
} from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Product } from '../../types/inventory';
import { RobustImageService, ProductImage } from '../../../../lib/robustImageService';
import { format } from '../../lib/format';
import { formatSpecificationValue, parseSpecification } from '../../lib/specificationUtils';
import { exportProductData } from '../../lib/productUtils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { usePurchaseOrderHistory } from '../../hooks/usePurchaseOrderHistory';
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

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Purchase order history tracking
  const { history: purchaseOrderHistory, stats: poStats, isLoading: isLoadingPOHistory } = usePurchaseOrderHistory(product?.id);
  const [showPOHistory, setShowPOHistory] = useState(false);

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
      const productUrl = `${window.location.origin}/lats/products/${product.id}/edit`;
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
      const productUrl = `${window.location.origin}/lats/products/${product.id}/edit`;
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

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col my-2 sm:my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">{product.name}</h2>
              <p className="text-xs text-gray-500">{primaryVariant?.sku || 'No SKU'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Info</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'variants'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Variants</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Details & Location</span>
                <span className="sm:hidden">Details</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="p-3 sm:p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Financial Overview - Minimal Design */}
              {analytics && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-3">
                      <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Value</div>
                      <div className="text-base font-bold text-emerald-900">{format.money(analytics.totalRetailValue)}</div>
                      </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
                      <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Profit</div>
                      <div className="text-base font-bold text-blue-900">{format.money(analytics.potentialProfit)}</div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3">
                      <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Margin</div>
                      <div className="text-base font-bold text-orange-900">{analytics.profitMargin.toFixed(1)}%</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3">
                      <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Investment</div>
                      <div className="text-base font-bold text-purple-900">{format.money(analytics.totalCostValue)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Product Image & Basic Info */}
            <div className="space-y-4 sm:space-y-6">
              {/* Product Image */}
              <div className="space-y-3">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                  {images.length > 0 ? (
                    <>
                      {/* Check if the image is a PNG and add white background */}
                      {(() => {
                        const imageUrl = images[selectedImageIndex]?.thumbnailUrl || images[selectedImageIndex]?.url || images[0]?.thumbnailUrl || images[0]?.url;
                        const isPngImage = imageUrl && (imageUrl.includes('.png') || imageUrl.includes('image/png'));
                        return isPngImage ? <div className="absolute inset-0 bg-white" /> : null;
                      })()}
                      <img
                        src={images[selectedImageIndex]?.thumbnailUrl || images[selectedImageIndex]?.url || images[0]?.thumbnailUrl || images[0]?.url}
                        alt={product.name}
                        className="w-full h-full object-cover relative z-10"
                      />
                    </>
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
                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all relative ${
                          index === selectedImageIndex 
                            ? 'border-blue-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Check if the thumbnail is a PNG and add white background */}
                        {(() => {
                          const imageUrl = image.thumbnailUrl || image.url;
                          const isPngImage = imageUrl && (imageUrl.includes('.png') || imageUrl.includes('image/png'));
                          return isPngImage ? <div className="absolute inset-0 bg-white" /> : null;
                        })()}
                        <img
                          src={image.thumbnailUrl || image.url}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover relative z-10"
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
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Basic Information</h3>
                  </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
                    <p className="text-sm font-medium text-gray-900">{currentProduct.category?.name || 'Uncategorized'}</p>
                </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                    <p className={`text-sm font-medium ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </p>
                    </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Product ID</span>
                    <p className="text-sm font-medium text-gray-900 font-mono">{product.id}</p>
                    </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Total Variants</span>
                    <p className="text-sm font-medium text-gray-900">{product.variants?.length || 0}</p>
                    </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Total Stock</span>
                    <p className="text-sm font-medium text-gray-900">{currentProduct.totalQuantity || 0}</p>
                      </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Images</span>
                    <p className="text-sm font-medium text-gray-900">{images.length} photo{images.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                  </div>
                  







              {/* Pricing Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Pricing Summary</h3>
                  </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Primary Price</span>
                    <p className="text-lg font-bold text-green-600">{format.money(primaryVariant?.sellingPrice || 0)}</p>
                </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Cost Price</span>
                    <p className="text-lg font-bold text-red-600">{format.money(primaryVariant?.costPrice || 0)}</p>
                    </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Profit/Unit</span>
                    <p className="text-lg font-bold text-blue-600">
                      {format.money((primaryVariant?.sellingPrice || 0) - (primaryVariant?.costPrice || 0))}
                    </p>
                    </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Markup</span>
                    <p className="text-lg font-bold text-purple-600">
                      {primaryVariant?.costPrice > 0 
                        ? `${(((primaryVariant.sellingPrice - primaryVariant.costPrice) / primaryVariant.costPrice) * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </p>
                </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Total Value</span>
                    <p className="text-xl font-bold text-orange-600">
                      {format.money((primaryVariant?.sellingPrice || 0) * (currentProduct.totalQuantity || 0))}
                    </p>
                    </div>
                  </div>
                  </div>

              {/* Product Variants - Simplified */}
              {product.variants && product.variants.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Product Variants</h3>
                    </div>
                  <div className="space-y-2">
                    {product.variants.slice(0, 3).map((variant, index) => (
                      <div key={variant.id || index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
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
                      <div className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded-lg">
                        +{product.variants.length - 3} more variants
                      </div>
                    )}
                  </div>
                    </div>
              )}

              {/* Supplier Information - Minimal */}
              {currentProduct.supplier && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Building className="w-5 h-5 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Supplier Information</h3>
                      </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                      <p className="text-sm font-medium text-gray-900">{currentProduct.supplier.name}</p>
                    </div>
                    {currentProduct.supplier.contactPerson && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Contact</span>
                        <p className="text-sm font-medium text-gray-900">{currentProduct.supplier.contactPerson}</p>
                        </div>
                    )}
                    {currentProduct.supplier.phone && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                        <p className="text-sm font-medium text-gray-900">{currentProduct.supplier.phone}</p>
                        </div>
                    )}
                    {currentProduct.supplier.email && (
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Email</span>
                        <p className="text-sm font-medium text-gray-900">{currentProduct.supplier.email}</p>
                        </div>
                    )}
                        </div>
                  </div>
              )}

              {/* Product Status - Enhanced */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Status & Details</h3>
                  </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Condition</span>
                    <p className="text-sm font-medium text-gray-900 capitalize">{(product as any).condition || 'New'}</p>
                </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Min Stock Level</span>
                    <p className="text-sm font-medium text-gray-900">
                        {currentProduct.variants && currentProduct.variants.length > 0 
                          ? Math.min(...currentProduct.variants.map(v => v.minQuantity || 0))
                          : 0
                        }
                    </p>
                    </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Low Stock Variants</span>
                    <p className="text-sm font-medium text-orange-600">
                      {product.variants ? product.variants.filter(v => (v.quantity || 0) <= (v.minQuantity || 0)).length : 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Out of Stock</span>
                    <p className="text-sm font-medium text-red-600">
                      {product.variants ? product.variants.filter(v => (v.quantity || 0) <= 0).length : 0}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Primary Variant</span>
                    <p className="text-sm font-medium text-gray-900">
                      {product.variants?.find(v => v.isPrimary)?.name || product.variants?.[0]?.name || 'None'}
                    </p>
                  </div>
                  {(product as any).tags && (product as any).tags.length > 0 && (
                    <div className="col-span-2 space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Tags</span>
                        <div className="flex flex-wrap gap-1">
                          {(product as any).tags.map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {tag}
                          </span>
                          ))}
                        </div>
                      </div>
                  )}
                      </div>
                </div>

                  </div>
                </div>
            </>
          )}

           {/* Analytics Tab */}
           {activeTab === 'analytics' && (
             <div className="space-y-6">
               {/* Sales Performance */}
               <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                 <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                   <TrendingUp className="w-5 h-5 text-green-600" />
                   <h3 className="text-sm font-semibold text-gray-800">Sales Performance</h3>
                    </div>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="text-center p-3 bg-green-50 rounded-lg">
                     <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Stock Turnover</div>
                     <div className="text-lg font-bold text-green-900">
                       {daysInStock > 0 ? (currentProduct.totalQuantity / daysInStock).toFixed(2) : 'N/A'}
                    </div>
                   </div>
                   <div className="text-center p-3 bg-blue-50 rounded-lg">
                     <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Inventory Value</div>
                     <div className="text-lg font-bold text-blue-900">
                       {format.money((primaryVariant?.costPrice || 0) * (currentProduct.totalQuantity || 0))}
                     </div>
                   </div>
                   <div className="text-center p-3 bg-purple-50 rounded-lg">
                     <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Retail Value</div>
                     <div className="text-lg font-bold text-purple-900">
                       {format.money((primaryVariant?.sellingPrice || 0) * (currentProduct.totalQuantity || 0))}
                     </div>
                   </div>
                   <div className="text-center p-3 bg-orange-50 rounded-lg">
                     <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Profit Potential</div>
                     <div className="text-lg font-bold text-orange-900">
                       {format.money(((primaryVariant?.sellingPrice || 0) - (primaryVariant?.costPrice || 0)) * (currentProduct.totalQuantity || 0))}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Market Analysis */}
               <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                 <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                   <BarChart3 className="w-5 h-5 text-blue-600" />
                   <h3 className="text-sm font-semibold text-gray-800">Market Analysis</h3>
                      </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Price Range</span>
                     <p className="text-sm font-medium text-gray-900">
                       {product.variants && product.variants.length > 0 
                         ? (() => {
                             const prices = product.variants.map(v => v.sellingPrice || 0);
                             const min = Math.min(...prices);
                             const max = Math.max(...prices);
                             return min === max ? format.money(min) : `${format.money(min)} - ${format.money(max)}`;
                           })()
                         : format.money(0)
                       }
                     </p>
                </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Average Markup</span>
                     <p className="text-sm font-medium text-gray-900">
                       {product.variants && product.variants.length > 0 
                         ? (() => {
                             const markups = product.variants
                               .filter(v => v.costPrice > 0)
                               .map(v => ((v.sellingPrice - v.costPrice) / v.costPrice) * 100);
                             return markups.length > 0 ? `${(markups.reduce((sum, m) => sum + m, 0) / markups.length).toFixed(1)}%` : 'N/A';
                           })()
                         : 'N/A'
                       }
                     </p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Total Variants</span>
                     <p className="text-sm font-medium text-gray-900">{product.variants?.length || 0}</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Active Variants</span>
                     <p className="text-sm font-medium text-gray-900">
                       {product.variants?.filter(v => (v.quantity || 0) > 0).length || 0}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Data Quality & Analytics */}
               <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                 <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                   <BarChart3 className="w-5 h-5 text-purple-600" />
                   <h3 className="text-sm font-semibold text-gray-800">Data Quality & Analytics</h3>
                  </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Data Completeness</span>
                     <div className="flex items-center gap-2">
                       <div className="w-16 bg-gray-200 rounded-full h-2">
                         <div 
                           className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                           style={{ width: `${completeness}%` }}
                         />
                       </div>
                       <span className="text-sm font-medium text-gray-900">{completeness}%</span>
                     </div>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Days in Inventory</span>
                     <p className="text-sm font-medium text-gray-900">{daysInStock} days</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Created</span>
                     <p className="text-sm font-medium text-gray-900">
                       {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'}
                     </p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</span>
                     <p className="text-sm font-medium text-gray-900">
                       {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Never'}
                     </p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Specifications</span>
                     <p className="text-sm font-medium text-gray-900">{Object.keys(specifications).length} fields</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Stock per Variant</span>
                     <p className="text-sm font-medium text-gray-900">
                       {product.variants && product.variants.length > 0 
                         ? Math.round(product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0) / product.variants.length)
                         : 0
                       }
                     </p>
                   </div>
                 </div>
                </div>
                
               {/* Supplier Performance */}
               {currentProduct.supplier && (
                 <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                   <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                     <Building className="w-5 h-5 text-orange-600" />
                     <h3 className="text-sm font-semibold text-gray-800">Supplier Performance</h3>
                      </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Supplier Rating</span>
                       <p className="text-sm font-medium text-gray-900">
                         {(currentProduct.supplier as any).rating ? `${(currentProduct.supplier as any).rating}/5` : 'Not Rated'}
                       </p>
                     </div>
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Lead Time</span>
                       <p className="text-sm font-medium text-gray-900">
                         {(currentProduct.supplier as any).leadTime ? `${(currentProduct.supplier as any).leadTime} days` : 'Not Set'}
                       </p>
                     </div>
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Total Orders</span>
                       <p className="text-sm font-medium text-gray-900">
                         {(currentProduct.supplier as any).totalOrders || 0}
                       </p>
                     </div>
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">On-Time Delivery</span>
                       <p className="text-sm font-medium text-gray-900">
                         {(currentProduct.supplier as any).onTimeDeliveryRate ? `${(currentProduct.supplier as any).onTimeDeliveryRate}%` : 'Not Tracked'}
                       </p>
                     </div>
                   </div>
                 </div>
               )}

               {/* Financial Health */}
               <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                 <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                   <DollarSign className="w-5 h-5 text-green-600" />
                   <h3 className="text-sm font-semibold text-gray-800">Financial Health</h3>
                      </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Cost Efficiency</span>
                     <p className={`text-sm font-medium ${
                       primaryVariant?.costPrice > 0 && primaryVariant?.sellingPrice > primaryVariant?.costPrice
                         ? 'text-green-600' : 'text-red-600'
                     }`}>
                       {primaryVariant?.costPrice > 0 && primaryVariant?.sellingPrice > primaryVariant?.costPrice
                         ? 'Profitable' : 'Check Pricing'
                       }
                     </p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Stock Health</span>
                     <p className={`text-sm font-medium ${
                       product.variants && product.variants.length > 0
                         ? (() => {
                             const lowStock = product.variants.filter(v => (v.quantity || 0) <= (v.minQuantity || 0)).length;
                             const total = product.variants.length;
                             const health = ((total - lowStock) / total) * 100;
                             return health >= 80 ? 'text-green-600' : health >= 50 ? 'text-orange-600' : 'text-red-600';
                           })()
                         : 'text-gray-600'
                     }`}>
                       {product.variants && product.variants.length > 0
                         ? (() => {
                             const lowStock = product.variants.filter(v => (v.quantity || 0) <= (v.minQuantity || 0)).length;
                             const total = product.variants.length;
                             const health = ((total - lowStock) / total) * 100;
                             return `${health.toFixed(0)}%`;
                           })()
                         : 'N/A'
                       }
                     </p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Data Quality</span>
                     <p className={`text-sm font-medium ${
                       completeness >= 80 ? 'text-green-600' : completeness >= 60 ? 'text-orange-600' : 'text-red-600'
                     }`}>
                       {completeness >= 80 ? 'Excellent' : completeness >= 60 ? 'Good' : 'Needs Work'}
                     </p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Image Coverage</span>
                     <p className={`text-sm font-medium ${
                       images.length > 0 ? 'text-green-600' : 'text-orange-600'
                     }`}>
                       {images.length > 0 ? `${images.length} Image${images.length !== 1 ? 's' : ''}` : 'No Images'}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Recommendations */}
               <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                 <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                   <Target className="w-5 h-5 text-purple-600" />
                   <h3 className="text-sm font-semibold text-gray-800">Recommendations</h3>
                      </div>
                 <div className="space-y-2">
                   {(() => {
                     const recommendations = [];
                     
                     // Stock recommendations
                     if (product.variants && product.variants.length > 0) {
                       const lowStockVariants = product.variants.filter(v => (v.quantity || 0) <= (v.minQuantity || 0));
                       if (lowStockVariants.length > 0) {
                         recommendations.push({
                           type: 'warning',
                           message: `${lowStockVariants.length} variant(s) are low on stock and need reordering`
                         });
                       }
                     }
                     
                     // Pricing recommendations
                     if (primaryVariant?.costPrice > 0 && primaryVariant?.sellingPrice <= primaryVariant?.costPrice) {
                       recommendations.push({
                         type: 'error',
                         message: 'Selling price is at or below cost price - review pricing strategy'
                       });
                     }
                     
                     // Data quality recommendations
                     if (completeness < 60) {
                       recommendations.push({
                         type: 'info',
                         message: 'Product data is incomplete - consider adding missing information'
                       });
                     }
                     
                     // Image recommendations
                     if (images.length === 0) {
                       recommendations.push({
                         type: 'info',
                         message: 'No product images available - consider adding product photos'
                       });
                     }
                     
                     if (recommendations.length === 0) {
                       recommendations.push({
                         type: 'success',
                         message: 'Product is in good condition with no immediate actions needed'
                       });
                     }
                     
                     return recommendations.map((rec, index) => (
                       <div key={index} className={`p-3 rounded-lg ${
                         rec.type === 'error' ? 'bg-red-50 border border-red-200' :
                         rec.type === 'warning' ? 'bg-orange-50 border border-orange-200' :
                         rec.type === 'info' ? 'bg-blue-50 border border-blue-200' :
                         'bg-green-50 border border-green-200'
                       }`}>
                         <p className={`text-sm font-medium ${
                           rec.type === 'error' ? 'text-red-800' :
                           rec.type === 'warning' ? 'text-orange-800' :
                           rec.type === 'info' ? 'text-blue-800' :
                           'text-green-800'
                         }`}>
                           {rec.message}
                         </p>
                      </div>
                     ));
                   })()}
                </div>
               </div>

              {/* Additional Product Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Performance */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Performance</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Stock Turnover</span>
                      <p className="text-lg font-bold text-gray-900">
                        {daysInStock > 0 ? (currentProduct.totalQuantity / daysInStock).toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Inventory Value</span>
                      <p className="text-lg font-bold text-blue-600">
                        {format.money((primaryVariant?.costPrice || 0) * (currentProduct.totalQuantity || 0))}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Retail Value</span>
                      <p className="text-lg font-bold text-purple-600">
                        {format.money((primaryVariant?.sellingPrice || 0) * (currentProduct.totalQuantity || 0))}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Profit Potential</span>
                      <p className="text-xl font-bold text-green-600">
                        {format.money(((primaryVariant?.sellingPrice || 0) - (primaryVariant?.costPrice || 0)) * (currentProduct.totalQuantity || 0))}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Product Metrics */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Metrics</h3>
                  </div>
                <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Cost Price</span>
                      <p className="text-lg font-bold text-red-600">
                        {product.variants && product.variants.length > 0 
                          ? format.money(product.variants.reduce((sum, v) => sum + (v.costPrice || 0), 0) / product.variants.length)
                          : format.money(0)
                        }
                      </p>
                          </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Selling Price</span>
                      <p className="text-lg font-bold text-green-600">
                        {product.variants && product.variants.length > 0 
                          ? format.money(product.variants.reduce((sum, v) => sum + (v.sellingPrice || 0), 0) / product.variants.length)
                          : format.money(0)
                        }
                      </p>
                          </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Markup</span>
                      <p className="text-lg font-bold text-blue-600">
                        {product.variants && product.variants.length > 0 
                          ? (() => {
                              const markups = product.variants
                                .filter(v => v.costPrice > 0)
                                .map(v => ((v.sellingPrice - v.costPrice) / v.costPrice) * 100);
                              return markups.length > 0 ? `${(markups.reduce((sum, m) => sum + m, 0) / markups.length).toFixed(1)}%` : 'N/A';
                            })()
                          : 'N/A'
                        }
                      </p>
                          </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Total SKUs</span>
                      <p className="text-lg font-bold text-gray-900">
                        {product.variants ? product.variants.filter(v => v.sku).length : 0}
                      </p>
                          </div>
                          </div>
                    </div>

                {/* Product Health */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Target className="w-5 h-5 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Health</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Stock Health</span>
                      <p className={`text-lg font-bold ${
                        product.variants && product.variants.length > 0
                          ? (() => {
                              const lowStock = product.variants.filter(v => (v.quantity || 0) <= (v.minQuantity || 0)).length;
                              const total = product.variants.length;
                              const health = ((total - lowStock) / total) * 100;
                              return health >= 80 ? 'text-green-600' : health >= 50 ? 'text-orange-600' : 'text-red-600';
                            })()
                          : 'text-gray-600'
                      }`}>
                        {product.variants && product.variants.length > 0
                          ? (() => {
                              const lowStock = product.variants.filter(v => (v.quantity || 0) <= (v.minQuantity || 0)).length;
                              const total = product.variants.length;
                              const health = ((total - lowStock) / total) * 100;
                              return `${health.toFixed(0)}%`;
                            })()
                          : 'N/A'
                        }
                      </p>
                      </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Data Quality</span>
                      <p className={`text-lg font-bold ${
                        completeness >= 80 ? 'text-green-600' : completeness >= 60 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {completeness >= 80 ? 'Excellent' : completeness >= 60 ? 'Good' : 'Needs Work'}
                      </p>
                      </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Pricing Health</span>
                      <p className={`text-lg font-bold ${
                        primaryVariant?.costPrice > 0 && primaryVariant?.sellingPrice > primaryVariant?.costPrice
                          ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {primaryVariant?.costPrice > 0 && primaryVariant?.sellingPrice > primaryVariant?.costPrice
                          ? 'Profitable' : 'Check Pricing'
                        }
                      </p>
                            </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Image Coverage</span>
                      <p className={`text-lg font-bold ${
                        images.length > 0 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {images.length > 0 ? `${images.length} Image${images.length !== 1 ? 's' : ''}` : 'No Images'}
                      </p>
                            </div>
                      </div>
                    </div>
                </div>
            </div>
          )}

           {/* Details Tab */}
           {activeTab === 'details' && (
             <div className="space-y-6">
               {/* Product Identification */}
               <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                 <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                   <Hash className="w-5 h-5 text-purple-600" />
                   <h3 className="text-sm font-semibold text-gray-800">Product Identification</h3>
                          </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Product SKU</span>
                     <p className="text-sm font-medium text-gray-900 font-mono">{primaryVariant?.sku || 'N/A'}</p>
                   </div>
                   {(product as any).barcode && (
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Barcode</span>
                       <p className="text-sm font-medium text-gray-900 font-mono">{(product as any).barcode}</p>
                     </div>
                   )}
                   <div className="space-y-1">
                     <span className="text-xs text-gray-500 uppercase tracking-wide">Product ID</span>
                     <p className="text-sm font-medium text-gray-900 font-mono">{product.id}</p>
                   </div>
                   {(product as any).specification && (
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Specification Code</span>
                       <p className="text-sm font-medium text-gray-900">{(product as any).specification}</p>
                    </div>
                  )}
                 </div>
                 <div className="flex gap-3 pt-3">
                   <button
                     onClick={handleGenerateQRCode}
                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                   >
                     <QrCode className="w-4 h-4" />
                     Generate QR Code
                   </button>
                   <button
                     onClick={() => {
                       if ((product as any).barcode) {
                         navigator.clipboard.writeText((product as any).barcode);
                         toast.success('Barcode copied to clipboard!');
                       }
                     }}
                     className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                   >
                     <Copy className="w-4 h-4" />
                     Copy Barcode
                   </button>
                      </div>
               </div>

               {/* Storage & Location Information */}
               <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                 <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                   <MapPin className="w-5 h-5 text-blue-600" />
                   <h3 className="text-sm font-semibold text-gray-800">Storage & Location</h3>
                      </div>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                   {(product as any).storageRoomName && (
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Storage Room</span>
                       <p className="text-sm font-medium text-gray-900">{(product as any).storageRoomName}</p>
                     </div>
                   )}
                   {(product as any).shelfName && (
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Shelf Name</span>
                       <p className="text-sm font-medium text-gray-900">{(product as any).shelfName}</p>
                            </div>
                   )}
                   {(product as any).storeLocationName && (
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Store Location</span>
                       <p className="text-sm font-medium text-gray-900">{(product as any).storeLocationName}</p>
                            </div>
                   )}
                   {(product as any).isRefrigerated !== undefined && (
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Storage Type</span>
                       <p className="text-sm font-medium text-gray-900">
                         {(product as any).isRefrigerated ? 'Refrigerated' : 'Room Temperature'}
                       </p>
                      </div>
                   )}
                   {(product as any).requiresLadder !== undefined && (
                     <div className="space-y-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wide">Access Requirements</span>
                       <p className="text-sm font-medium text-gray-900">
                         {(product as any).requiresLadder ? 'Requires Ladder' : 'Ground Level'}
                       </p>
                    </div>
                  )}
                </div>
               </div>

               {/* Additional Information Sections - Minimal Design */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipping & Physical Information */}
            {(product.weight || product.length || product.width || product.height || product.shippingClass || product.requiresSpecialHandling) && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Physical & Shipping</h3>
                    </div>
                <div className="grid grid-cols-2 gap-3">
                  {product.weight && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Weight</span>
                      <p className="text-sm font-medium text-gray-900">{product.weight} kg</p>
                  </div>
                  )}
                  {product.length && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Length</span>
                      <p className="text-sm font-medium text-gray-900">{product.length} cm</p>
                        </div>
                  )}
                  {product.width && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Width</span>
                      <p className="text-sm font-medium text-gray-900">{product.width} cm</p>
                        </div>
                  )}
                  {product.height && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Height</span>
                      <p className="text-sm font-medium text-gray-900">{product.height} cm</p>
                        </div>
                  )}
                  {product.shippingClass && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Shipping Class</span>
                      <p className="text-sm font-medium text-gray-900 capitalize">{product.shippingClass}</p>
                        </div>
                    )}
                  {product.requiresSpecialHandling && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Special Handling</span>
                      <p className="text-sm font-medium text-orange-600">Required</p>
                  </div>
                  )}
                </div>
              </div>
              )}

              {/* Purchase Order Information - Enhanced with History */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Purchase Order History</h3>
                  </div>
                  {purchaseOrderHistory.length > 0 && (
                    <button
                      onClick={() => setShowPOHistory(!showPOHistory)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showPOHistory ? 'Hide Details' : 'Show Details'}
                    </button>
                  )}
                </div>
                
                {isLoadingPOHistory ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                  </div>
                ) : !poStats || purchaseOrderHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No purchase history</p>
                    <p className="text-xs text-gray-400 mt-1">No orders found for this product</p>
                  </div>
                ) : (
                  <>
                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Total Orders */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-1 mb-1">
                          <BarChart3 className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">Total Orders</span>
                        </div>
                        <div className="text-xl font-bold text-blue-900">{poStats.totalOrders}</div>
                      </div>

                      {/* Total Ordered */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-1 mb-1">
                          <ShoppingCart className="w-3 h-3 text-purple-600" />
                          <span className="text-xs font-medium text-purple-700">Ordered</span>
                        </div>
                        <div className="text-xl font-bold text-purple-900">{poStats.totalQuantityOrdered}</div>
                        <div className="text-xs text-purple-600">
                          Received: {poStats.totalQuantityReceived}
                        </div>
                      </div>

                      {/* Average Cost */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Avg Cost</span>
                        </div>
                        <div className="text-base font-bold text-green-900">
                          {format.money(poStats.averageCostPrice)}
                        </div>
                      </div>

                      {/* Last Order */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          <span className="text-xs font-medium text-amber-700">Last Order</span>
                        </div>
                        <div className="text-xs font-bold text-amber-900">
                          {poStats.lastOrderDate ? new Date(poStats.lastOrderDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Price Trend */}
                    {poStats.lowestCostPrice && poStats.highestCostPrice && (
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Price Range</span>
                          {poStats.lastCostPrice && (
                            <div className="flex items-center gap-1">
                              {poStats.lastCostPrice < poStats.averageCostPrice ? (
                                <>
                                  <TrendingDown className="w-3 h-3 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">Below avg</span>
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="w-3 h-3 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">Above avg</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="text-xs text-gray-500">Lowest</div>
                            <div className="font-bold text-green-700">
                              {format.money(poStats.lowestCostPrice)}
                            </div>
                          </div>
                          <div className="flex-1 mx-3">
                            <div className="h-2 bg-gradient-to-r from-green-300 via-yellow-300 to-red-300 rounded-full"></div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Highest</div>
                            <div className="font-bold text-red-700">
                              {format.money(poStats.highestCostPrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Orders List (Collapsible) */}
                    {showPOHistory && purchaseOrderHistory.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto border-t border-gray-100 pt-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">
                          Recent Orders ({purchaseOrderHistory.length})
                        </div>
                        {purchaseOrderHistory.map((order) => (
                          <div
                            key={order.id}
                            className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs font-medium text-blue-600">
                                #{order.orderNumber}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                order.poStatus === 'completed' || order.poStatus === 'received' 
                                  ? 'bg-green-100 text-green-700'
                                  : order.poStatus === 'cancelled' 
                                  ? 'bg-red-100 text-red-700'
                                  : order.poStatus === 'shipped' || order.poStatus === 'partial_received'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {order.poStatus.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Supplier:</span>
                                <div className="font-medium text-gray-800 truncate">{order.supplierName}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <div className="font-medium text-gray-800">
                                  {new Date(order.orderDate).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Ordered:</span>
                                <div className="font-medium text-gray-800">{order.quantity} units</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Received:</span>
                                <div className="font-medium text-gray-800">
                                  {order.receivedQuantity} units
                                  {order.receivedQuantity === order.quantity && (
                                    <CheckCircle2 className="w-3 h-3 text-green-600 inline ml-1" />
                                  )}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500">Cost:</span>
                                <div className="font-bold text-gray-900">
                                  {format.money(order.costPrice)} per unit
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Shipping Status */}
              {(product.shippingStatus || product.trackingNumber || product.expectedDelivery) && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Shipping Status</h3>
                    </div>
                <div className="grid grid-cols-2 gap-3">
                    {product.shippingStatus && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                      <p className={`text-sm font-medium ${
                        product.shippingStatus === 'delivered' ? 'text-green-600' :
                        product.shippingStatus === 'in_transit' ? 'text-blue-600' :
                        product.shippingStatus === 'exception' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                            {product.shippingStatus.replace('_', ' ').charAt(0).toUpperCase() + product.shippingStatus.replace('_', ' ').slice(1)}
                      </p>
                        </div>
                    )}
                    {product.trackingNumber && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Tracking</span>
                      <p className="text-sm font-medium text-gray-900 font-mono">{product.trackingNumber}</p>
                        </div>
                    )}
                    {product.expectedDelivery && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Expected Delivery</span>
                      <p className="text-sm font-medium text-gray-900">
                            {new Date(product.expectedDelivery).toLocaleDateString()}
                      </p>
                        </div>
                    )}
                    {product.shippingAgent && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Agent</span>
                      <p className="text-sm font-medium text-gray-900">{product.shippingAgent}</p>
                        </div>
                    )}
                        </div>
                  </div>
            )}

            {/* Multi-Currency Pricing */}
            {(product.usdPrice || product.eurPrice) && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Banknote className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Multi-Currency</h3>
                    </div>
                <div className="grid grid-cols-2 gap-3">
                  {product.usdPrice && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">USD Price</span>
                      <p className="text-sm font-medium text-gray-900">${product.usdPrice.toFixed(2)}</p>
                  </div>
                  )}
                  {product.eurPrice && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">EUR Price</span>
                      <p className="text-sm font-medium text-gray-900">€{product.eurPrice.toFixed(2)}</p>
                        </div>
                  )}
                  {product.exchangeRate && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Exchange Rate</span>
                      <p className="text-sm font-medium text-gray-900">{product.exchangeRate.toFixed(4)}</p>
                          </div>
                    )}
                  {product.baseCurrency && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Base Currency</span>
                      <p className="text-sm font-medium text-gray-900">{product.baseCurrency.toUpperCase()}</p>
                  </div>
                  )}
                    </div>
                  </div>
            )}

            {/* Product Metadata */}
            {((product as any).isDigital || (product as any).requiresShipping !== undefined || (product as any).isFeatured || (product as any).weight) && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Product Metadata</h3>
                            </div>
                <div className="grid grid-cols-2 gap-3">
                  {(product as any).isDigital && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Type</span>
                      <p className="text-sm font-medium text-blue-600">Digital Product</p>
                            </div>
                  )}
                  {(product as any).requiresShipping !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Shipping</span>
                      <p className="text-sm font-medium text-gray-900">
                        {(product as any).requiresShipping ? 'Required' : 'Not Required'}
                      </p>
                            </div>
                          )}
                  {(product as any).isFeatured && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Featured</span>
                      <p className="text-sm font-medium text-yellow-600">Yes</p>
                        </div>
                  )}
                    </div>
                  </div>
              )}

              {/* Business Intelligence */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-800">Analytics</h3>
                  </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Data Completeness</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    <span className="text-sm font-medium text-gray-900">{completeness}%</span>
                    </div>
                    </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Days in Inventory</span>
                  <p className="text-sm font-medium text-gray-900">{daysInStock} days</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Created</span>
                  <p className="text-sm font-medium text-gray-900">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                    </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</span>
                  <p className="text-sm font-medium text-gray-900">
                        {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Never'}
                  </p>
                    </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Specifications</span>
                  <p className="text-sm font-medium text-gray-900">{Object.keys(specifications).length} fields</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Stock per Variant</span>
                  <p className="text-sm font-medium text-gray-900">
                    {product.variants && product.variants.length > 0 
                      ? Math.round(product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0) / product.variants.length)
                      : 0
                    }
                  </p>
            </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Price Range</span>
                  <p className="text-sm font-medium text-gray-900">
                    {product.variants && product.variants.length > 0 
                      ? (() => {
                          const prices = product.variants.map(v => v.sellingPrice || 0);
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max ? format.money(min) : `${format.money(min)} - ${format.money(max)}`;
                        })()
                      : format.money(0)
                    }
                  </p>
                    </div>
                      </div>
                      </div>
                    </div>











                </div>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div className="space-y-6">
              {/* Complete Variant Table */}
          {product.variants && product.variants.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Complete Variant Information ({product.variants.length} variants)</h3>
                  </div>
                  <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 font-medium text-gray-700">Variant Name</th>
                      <th className="text-left p-3 font-medium text-gray-700 hidden sm:table-cell">SKU</th>
                      <th className="text-left p-3 font-medium text-gray-700">Stock</th>
                      <th className="text-left p-3 font-medium text-gray-700 hidden md:table-cell">Min Level</th>
                      <th className="text-left p-3 font-medium text-gray-700 hidden lg:table-cell">Cost Price</th>
                      <th className="text-left p-3 font-medium text-gray-700">Selling Price</th>
                      <th className="text-left p-3 font-medium text-gray-700 hidden lg:table-cell">Markup</th>
                      <th className="text-left p-3 font-medium text-gray-700 hidden lg:table-cell">Profit/Unit</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => {
                      const markup = variant.costPrice > 0 ? ((variant.sellingPrice - variant.costPrice) / variant.costPrice * 100) : 0;
                      const profitPerUnit = variant.sellingPrice - variant.costPrice;
                      return (
                        <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {variant.isPrimary && <Star className="w-4 h-4 text-yellow-500" />}
                              <div>
                                <span className="font-medium text-sm">{variant.name}</span>
                                <p className="text-xs text-gray-500 sm:hidden">{variant.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs hidden sm:table-cell">{variant.sku}</td>
                          <td className="p-3">
                            <span className={`font-medium text-sm ${
                              variant.quantity <= 0 ? 'text-red-600' : 
                              variant.quantity <= variant.minQuantity ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {variant.quantity}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600 text-sm hidden md:table-cell">{variant.minQuantity}</td>
                          <td className="p-3 font-medium text-sm hidden lg:table-cell">{format.money(variant.costPrice)}</td>
                          <td className="p-3 font-medium text-sm">{format.money(variant.sellingPrice)}</td>
                          <td className="p-3 hidden lg:table-cell">
                            <span className={`font-medium text-sm ${markup > 50 ? 'text-green-600' : markup > 20 ? 'text-orange-600' : 'text-red-600'}`}>
                              {markup.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 font-medium text-sm hidden lg:table-cell">
                            <span className={profitPerUnit > 0 ? 'text-green-600' : 'text-red-600'}>
                              {format.money(profitPerUnit)}
                            </span>
                          </td>
                          <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  variant.quantity > variant.minQuantity ? 'bg-green-100 text-green-700' : 
                                  variant.quantity > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                }`}>
                              {variant.quantity > variant.minQuantity ? 'Good' : variant.quantity > 0 ? 'Low' : 'Empty'}
                                </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
                </div>
              )}
            </div>
          )}


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
        </div>

        {/* QR Code Modal */}
        {showQRModal && createPortal(
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100000 }}>
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
                      navigator.clipboard.writeText(`${window.location.origin}/lats/products/${product.id}/edit`);
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
          </div>,
          document.body
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
    </div>,
    document.body
  );
};

export default GeneralProductDetailModal;