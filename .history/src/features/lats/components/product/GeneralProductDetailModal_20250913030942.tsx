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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Supplier</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                      <span className="text-sm text-orange-700 font-medium">Name</span>
                      <span className="text-sm font-bold text-orange-900">{currentProduct.supplier.name}</span>
                    </div>
                    {currentProduct.supplier.contactPerson && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                        <span className="text-sm text-yellow-700 font-medium">Contact</span>
                        <span className="text-sm font-bold text-yellow-900">{currentProduct.supplier.contactPerson}</span>
                      </div>
                    )}
                    {currentProduct.supplier.phone && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                        <span className="text-sm text-red-700 font-medium">Phone</span>
                        <span className="text-sm font-bold text-red-900">{currentProduct.supplier.phone}</span>
                      </div>
                    )}
                    {currentProduct.supplier.email && (
                      <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                        <span className="text-sm text-blue-700 font-medium">Email</span>
                        <span className="text-sm font-bold text-blue-900">{currentProduct.supplier.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Status - Enhanced */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Status & Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl">
                    <span className="text-sm text-indigo-700 font-medium">Condition</span>
                    <span className="text-sm font-bold text-indigo-900 capitalize">{(product as any).condition || 'New'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl">
                    <span className="text-sm text-cyan-700 font-medium">Min Stock Level</span>
                    <span className="text-sm font-bold text-cyan-900">
                      {currentProduct.variants && currentProduct.variants.length > 0 
                        ? Math.min(...currentProduct.variants.map(v => v.minQuantity || 0))
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl">
                    <span className="text-sm text-orange-700 font-medium">Low Stock Variants</span>
                    <span className="text-sm font-bold text-orange-900">
                      {product.variants ? product.variants.filter(v => (v.quantity || 0) <= (v.minQuantity || 0)).length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                    <span className="text-sm text-red-700 font-medium">Out of Stock</span>
                    <span className="text-sm font-bold text-red-900">
                      {product.variants ? product.variants.filter(v => (v.quantity || 0) <= 0).length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl">
                    <span className="text-sm text-violet-700 font-medium">Primary Variant</span>
                    <span className="text-sm font-bold text-violet-900">
                      {product.variants?.find(v => v.isPrimary)?.name || product.variants?.[0]?.name || 'None'}
                    </span>
                  </div>
                  {(product as any).tags && (product as any).tags.length > 0 && (
                    <div className="py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">Tags</div>
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

          {/* Additional Information Sections - Minimal Design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Shipping & Physical Information */}
            {(product.weight || product.length || product.width || product.height || product.shippingClass || product.requiresSpecialHandling) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Physical & Shipping</h3>
                <div className="space-y-2">
                  {product.weight && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Weight</span>
                      <span className="text-sm font-semibold text-gray-900">{product.weight} kg</span>
                    </div>
                  )}
                  {product.length && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Length</span>
                      <span className="text-sm font-semibold text-gray-900">{product.length} cm</span>
                    </div>
                  )}
                  {product.width && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Width</span>
                      <span className="text-sm font-semibold text-gray-900">{product.width} cm</span>
                    </div>
                  )}
                  {product.height && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Height</span>
                      <span className="text-sm font-semibold text-gray-900">{product.height} cm</span>
                    </div>
                  )}
                  {product.shippingClass && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Shipping Class</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">{product.shippingClass}</span>
                    </div>
                  )}
                  {product.requiresSpecialHandling && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Special Handling</span>
                      <span className="text-sm font-semibold text-orange-600">Required</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Purchase Order Information */}
            {(product.lastOrderDate || product.pendingQuantity || product.orderStatus) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Purchase Orders</h3>
                <div className="space-y-2">
                  {product.lastOrderDate && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Last Order Date</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(product.lastOrderDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {product.lastOrderQuantity && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Last Order Qty</span>
                      <span className="text-sm font-semibold text-gray-900">{product.lastOrderQuantity}</span>
                    </div>
                  )}
                  {product.pendingQuantity && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Pending Qty</span>
                      <span className="text-sm font-semibold text-orange-600">{product.pendingQuantity}</span>
                    </div>
                  )}
                  {product.orderStatus && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Order Status</span>
                      <span className={`text-sm font-semibold ${
                        product.orderStatus === 'received' ? 'text-green-600' :
                        product.orderStatus === 'shipped' ? 'text-blue-600' :
                        product.orderStatus === 'cancelled' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {product.orderStatus.charAt(0).toUpperCase() + product.orderStatus.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Status */}
            {(product.shippingStatus || product.trackingNumber || product.expectedDelivery) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Shipping Status</h3>
                <div className="space-y-2">
                  {product.shippingStatus && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-sm font-semibold ${
                        product.shippingStatus === 'delivered' ? 'text-green-600' :
                        product.shippingStatus === 'in_transit' ? 'text-blue-600' :
                        product.shippingStatus === 'exception' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {product.shippingStatus.replace('_', ' ').charAt(0).toUpperCase() + product.shippingStatus.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  )}
                  {product.trackingNumber && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Tracking</span>
                      <span className="text-sm font-semibold text-gray-900 font-mono">{product.trackingNumber}</span>
                    </div>
                  )}
                  {product.expectedDelivery && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Expected Delivery</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(product.expectedDelivery).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {product.shippingAgent && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Agent</span>
                      <span className="text-sm font-semibold text-gray-900">{product.shippingAgent}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Multi-Currency Pricing */}
            {(product.usdPrice || product.eurPrice) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Multi-Currency</h3>
                <div className="space-y-2">
                  {product.usdPrice && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">USD Price</span>
                      <span className="text-sm font-semibold text-gray-900">${product.usdPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {product.eurPrice && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">EUR Price</span>
                      <span className="text-sm font-semibold text-gray-900">€{product.eurPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {product.exchangeRate && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Exchange Rate</span>
                      <span className="text-sm font-semibold text-gray-900">{product.exchangeRate.toFixed(4)}</span>
                    </div>
                  )}
                  {product.baseCurrency && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Base Currency</span>
                      <span className="text-sm font-semibold text-gray-900">{product.baseCurrency.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Metadata */}
            {((product as any).isDigital || (product as any).requiresShipping !== undefined || (product as any).isFeatured || (product as any).weight) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Metadata</h3>
                <div className="space-y-2">
                  {(product as any).isDigital && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Type</span>
                      <span className="text-sm font-semibold text-blue-600">Digital Product</span>
                    </div>
                  )}
                  {(product as any).requiresShipping !== undefined && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Shipping</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(product as any).requiresShipping ? 'Required' : 'Not Required'}
                      </span>
                    </div>
                  )}
                  {(product as any).isFeatured && (
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Featured</span>
                      <span className="text-sm font-semibold text-yellow-600">Yes</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Intelligence */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Analytics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Data Completeness</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{completeness}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Days in Inventory</span>
                  <span className="text-sm font-semibold text-gray-900">{daysInStock} days</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Specifications</span>
                  <span className="text-sm font-semibold text-gray-900">{Object.keys(specifications).length} fields</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Avg Stock per Variant</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {product.variants && product.variants.length > 0 
                      ? Math.round(product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0) / product.variants.length)
                      : 0
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Price Range</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {product.variants && product.variants.length > 0 
                      ? (() => {
                          const prices = product.variants.map(v => v.sellingPrice || 0);
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max ? format.money(min) : `${format.money(min)} - ${format.money(max)}`;
                        })()
                      : format.money(0)
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>











          {/* Additional Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Product Performance */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Stock Turnover</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {daysInStock > 0 ? (currentProduct.totalQuantity / daysInStock).toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Inventory Value</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {format.money((primaryVariant?.costPrice || 0) * (currentProduct.totalQuantity || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Retail Value</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {format.money((primaryVariant?.sellingPrice || 0) * (currentProduct.totalQuantity || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Profit Potential</span>
                  <span className="text-sm font-semibold text-green-600">
                    {format.money(((primaryVariant?.sellingPrice || 0) - (primaryVariant?.costPrice || 0)) * (currentProduct.totalQuantity || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Metrics */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Avg Cost Price</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {product.variants && product.variants.length > 0 
                      ? format.money(product.variants.reduce((sum, v) => sum + (v.costPrice || 0), 0) / product.variants.length)
                      : format.money(0)
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Avg Selling Price</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {product.variants && product.variants.length > 0 
                      ? format.money(product.variants.reduce((sum, v) => sum + (v.sellingPrice || 0), 0) / product.variants.length)
                      : format.money(0)
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Avg Markup</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {product.variants && product.variants.length > 0 
                      ? (() => {
                          const markups = product.variants
                            .filter(v => v.costPrice > 0)
                            .map(v => ((v.sellingPrice - v.costPrice) / v.costPrice) * 100);
                          return markups.length > 0 ? `${(markups.reduce((sum, m) => sum + m, 0) / markups.length).toFixed(1)}%` : 'N/A';
                        })()
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total SKUs</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {product.variants ? product.variants.filter(v => v.sku).length : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Health */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Health</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Stock Health</span>
                  <span className={`text-sm font-semibold ${
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
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Data Quality</span>
                  <span className={`text-sm font-semibold ${
                    completeness >= 80 ? 'text-green-600' : completeness >= 60 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {completeness >= 80 ? 'Excellent' : completeness >= 60 ? 'Good' : 'Needs Work'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Pricing Health</span>
                  <span className={`text-sm font-semibold ${
                    primaryVariant?.costPrice > 0 && primaryVariant?.sellingPrice > primaryVariant?.costPrice
                      ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {primaryVariant?.costPrice > 0 && primaryVariant?.sellingPrice > primaryVariant?.costPrice
                      ? 'Profitable' : 'Check Pricing'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Image Coverage</span>
                  <span className={`text-sm font-semibold ${
                    images.length > 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {images.length > 0 ? `${images.length} Image${images.length !== 1 ? 's' : ''}` : 'No Images'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Variant Table */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Complete Variant Information ({product.variants.length} variants)</h3>
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
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