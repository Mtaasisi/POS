import React, { useState, useEffect } from 'react';
import { 
  X, Package, Tag, Hash, DollarSign, Edit, Star, MapPin, Calendar, 
  TrendingUp, TrendingDown, BarChart3, CheckCircle, Battery, Monitor, Camera, 
  FileText, Layers, Clock, User, Truck, QrCode, ShoppingCart, Scale, 
  Zap, Shield, Target, Percent, Calculator, Banknote, Receipt, 
  Copy, Download, Share2, Archive, History, Store, Building,
  HardDrive, Cpu, Palette, Ruler, Hand, Unplug, Fingerprint, Radio, XCircle,
  Info, Plus, Minus, Save, RotateCcw, ArrowLeft, AlertTriangle as AlertIcon,
  RefreshCw, Trash2
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
import { useNavigate, useParams } from 'react-router-dom';
import { getLatsProvider } from '../lib/data/provider';
import { SimpleBackButton as BackButton } from '../../../features/shared/components/ui/SimpleBackButton';
import LoadingSkeleton from '../../../features/shared/components/ui/LoadingSkeleton';

const ProductDetailPage: React.FC = () => {
  const { id, productId } = useParams<{ id?: string; productId?: string }>();
  const actualId = id || productId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { adjustStock, getProduct } = useInventoryStore();
  
  // Main state
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Stock adjustment state
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Load product data
  const loadProductData = async () => {
    if (!actualId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const provider = getLatsProvider();
      const { ok, data, message } = await provider.getProduct(actualId);
      
      if (ok && data) {
        const productData = data as Product;
        setProduct(productData);
        
        // Load images
        const productImages = await RobustImageService.getProductImages(actualId);
        setImages(productImages);
      } else {
        setError(message || 'Failed to load product data');
        toast.error(`Failed to load product: ${message}`);
      }
    } catch (error) {
      setError('Failed to load product data');
      toast.error('Failed to load product data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh product data
  const refreshProductData = async () => {
    setIsRefreshing(true);
    await loadProductData();
    setIsRefreshing(false);
    toast.success('Product data refreshed');
  };

  // Load data on mount
  useEffect(() => {
    loadProductData();
  }, [actualId]);

  // Listen for product data updates from other parts of the app
  useEffect(() => {
    const handleProductDataUpdate = (event: CustomEvent) => {
      const { updatedProducts } = event.detail;
      if (actualId && updatedProducts.includes(actualId)) {
        refreshProductData();
      }
    };

    window.addEventListener('productDataUpdated', handleProductDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('productDataUpdated', handleProductDataUpdate as EventListener);
    };
  }, [actualId]);

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

  // Generate QR Code for product
  const handleGenerateQRCode = () => {
    try {
      const productUrl = `${window.location.origin}/lats/products/${product?.id}`;
      const qrData = `Product: ${product?.name}\nSKU: ${product?.variants?.[0]?.sku || 'N/A'}\nPrice: ${format.money(product?.variants?.[0]?.sellingPrice || 0)}\nDetails: ${productUrl}`;
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
        name: product?.name || '',
        sku: product?.variants?.[0]?.sku || '',
        categoryId: product?.categoryId || '',
        condition: product?.variants?.[0]?.condition || '',
        description: product?.description || '',
        specification: product?.variants?.[0]?.attributes?.specification || '',
        price: product?.variants?.[0]?.sellingPrice || 0,
        costPrice: product?.variants?.[0]?.costPrice || 0,
        stockQuantity: product?.variants?.[0]?.quantity || 0,
        minStockLevel: product?.variants?.[0]?.minQuantity || 0,
        storageRoomId: '',
        shelfId: '',
        images: [],
        metadata: product?.metadata || {},
        variants: []
      };

      const variants = product?.variants || [];
      const exportedData = exportProductData(productData, variants);
      
      // Create and download file
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${product?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_export_${new Date().toISOString().split('T')[0]}.json`;
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
      const productUrl = `${window.location.origin}/lats/products/${product?.id}`;
      const shareData = {
        title: `Product: ${product?.name}`,
        text: `Check out this product: ${product?.name} - ${format.money(product?.variants?.[0]?.sellingPrice || 0)}`,
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
        productId: product?.id,
        variantId: product?.variants?.[0]?.id,
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
  const handleStockAdjustment = async (productId: string, variantId: string, quantity: number, reason: string) => {
    setIsAdjustingStock(true);
    try {
      const response = await adjustStock(productId, variantId, quantity, reason);

      if (response.ok) {
        toast.success('Stock adjusted successfully');
        setShowStockAdjustment(false);
        setSelectedVariant(null);
        setAdjustmentQuantity(0);
        setAdjustmentReason('');
        
        // Refresh product data from database
        try {
          const updatedProductResponse = await getProduct(productId);
          if (updatedProductResponse.ok && updatedProductResponse.data) {
            setProduct(updatedProductResponse.data);
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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <GlassCard className="p-6">
            <div className="text-center">
              <AlertIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Not Found</h3>
              <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
              <div className="flex justify-center gap-2">
                <GlassButton
                  onClick={() => navigate('/lats/unified-inventory')}
                  className="bg-blue-600 text-white"
                >
                  <ArrowLeft size={16} />
                  Back to Inventory
                </GlassButton>
                <GlassButton
                  onClick={refreshProductData}
                  className="bg-gray-600 text-white"
                >
                  <RefreshCw size={16} />
                  Retry
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const primaryVariant = product.variants?.[0];
  const hasMultipleVariants = (product.variants?.length || 0) > 1;
  const daysInStock = product.createdAt ? Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const completeness = Math.round(((product.name ? 20 : 0) + 
    (product.description ? 15 : 0) + 
    (images.length > 0 ? 25 : 0) + 
    (Object.keys(specifications).length > 0 ? 20 : 0) + 
    (primaryVariant?.sellingPrice > 0 ? 20 : 0)));

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => navigate('/lats/unified-inventory')} />
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-500">{primaryVariant?.sku || 'No SKU'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={refreshProductData}
              disabled={isRefreshing}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              size="sm"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </GlassButton>
            <GlassButton
              onClick={openStockAdjustment}
              className="bg-green-600 text-white hover:bg-green-700"
              size="sm"
            >
              <Package size={14} />
              Adjust Stock
            </GlassButton>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white rounded-t-xl">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'variants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Variants
              </div>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Details & Location
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white rounded-b-xl">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
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
                        <p className="text-sm font-medium text-gray-900">{product.category?.name || 'Uncategorized'}</p>
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
                        <p className="text-sm font-medium text-gray-900">{product.totalQuantity || 0}</p>
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
                          {format.money((primaryVariant?.sellingPrice || 0) * (product.totalQuantity || 0))}
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
                          {product.variants && product.variants.length > 0 
                            ? Math.min(...product.variants.map(v => v.minQuantity || 0))
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

        {/* Modals */}
        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <Modal
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            title="Delete Product"
          >
            <div className="text-center">
              <AlertIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{product.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <GlassButton
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={handleDeleteProduct}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 size={16} />
                  Delete Product
                </GlassButton>
              </div>
            </div>
          </Modal>
        )}

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <Modal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            title="Product Image"
          >
            <div className="text-center">
              <img
                src={selectedImage.url}
                alt="Product"
                className="w-full max-h-96 object-contain rounded-lg mb-4"
              />
              <div className="text-sm text-gray-600">
                <p><strong>File:</strong> {selectedImage.fileName}</p>
                <p><strong>Size:</strong> {selectedImage.fileSize ? `${(selectedImage.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}</p>
                {selectedImage.isPrimary && (
                  <GlassBadge variant="success" className="mt-2">Primary Image</GlassBadge>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Stock Adjustment Modal */}
        {showStockAdjustment && (
          <Modal
            isOpen={showStockAdjustment}
            onClose={() => setShowStockAdjustment(false)}
            title="Adjust Stock"
          >
            <div className="space-y-4">
              <div className="text-center">
                <Package className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Adjustment</h3>
                <p className="text-gray-600 mb-6">
                  Adjust stock levels for product variants
                </p>
              </div>
              
              <div className="space-y-4">
                {product.variants?.map((variant, index) => (
                  <div key={variant.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{variant.name}</h4>
                      <span className="text-sm text-gray-500">Current: {variant.stockQuantity || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GlassButton
                        size="sm"
                        variant="ghost"
                        className="p-2"
                      >
                        <Minus size={16} />
                      </GlassButton>
                      <input
                        type="number"
                        className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                        defaultValue={variant.stockQuantity || 0}
                      />
                      <GlassButton
                        size="sm"
                        variant="ghost"
                        className="p-2"
                      >
                        <Plus size={16} />
                      </GlassButton>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <GlassButton
                  onClick={() => setShowStockAdjustment(false)}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={() => {
                    // TODO: Implement stock adjustment
                    setShowStockAdjustment(false);
                    toast.success('Stock adjusted successfully');
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Changes
                </GlassButton>
              </div>
            </div>
          </Modal>
        )}

        {/* Bulk Actions Modal */}
        {showBulkActions && (
          <Modal
            isOpen={showBulkActions}
            onClose={() => setShowBulkActions(false)}
            title="Bulk Actions"
          >
            <div className="space-y-4">
              <div className="text-center">
                <Settings className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Operations</h3>
                <p className="text-gray-600 mb-6">
                  Perform actions on multiple variants at once
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassButton
                  onClick={() => {
                    // TODO: Implement bulk price update
                    setShowBulkActions(false);
                    toast.success('Bulk price update initiated');
                  }}
                  className="bg-green-600 text-white hover:bg-green-700 h-20 flex flex-col items-center justify-center"
                >
                  <DollarSign size={24} />
                  <span className="text-sm">Update Prices</span>
                </GlassButton>
                
                <GlassButton
                  onClick={() => {
                    // TODO: Implement bulk stock adjustment
                    setShowBulkActions(false);
                    toast.success('Bulk stock adjustment initiated');
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700 h-20 flex flex-col items-center justify-center"
                >
                  <Package size={24} />
                  <span className="text-sm">Adjust Stock</span>
                </GlassButton>
                
                <GlassButton
                  onClick={() => {
                    // TODO: Implement bulk export
                    setShowBulkActions(false);
                    toast.success('Export initiated');
                  }}
                  className="bg-purple-600 text-white hover:bg-purple-700 h-20 flex flex-col items-center justify-center"
                >
                  <Download size={24} />
                  <span className="text-sm">Export Data</span>
                </GlassButton>
                
                <GlassButton
                  onClick={() => {
                    // TODO: Implement bulk delete
                    setShowBulkActions(false);
                    toast.success('Bulk delete initiated');
                  }}
                  className="bg-red-600 text-white hover:bg-red-700 h-20 flex flex-col items-center justify-center"
                >
                  <Trash2 size={24} />
                  <span className="text-sm">Delete Variants</span>
                </GlassButton>
              </div>
              
              <div className="flex justify-end pt-4">
                <GlassButton
                  onClick={() => setShowBulkActions(false)}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Close
                </GlassButton>
              </div>
            </div>
          </Modal>
        )}


        {/* Product Specifications Modal */}
        {showProductSpecificationsModal && (
          <Modal
            isOpen={showProductSpecificationsModal}
            onClose={() => setShowProductSpecificationsModal(false)}
            title="Product Specifications"
          >
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Specifications
                </h2>
                <p className="text-gray-600">
                  Add and manage product specifications
                </p>
              </div>

              <div className="flex justify-end">
                <GlassButton
                  onClick={() => setShowProductSpecificationsModal(false)}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  <X size={16} />
                  Close
                </GlassButton>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <GlassButton
                    onClick={() => setShowProductCustomInput(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add Specifications
                  </GlassButton>
                </div>

                {showProductCustomInput && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specification Name
                      </label>
                      <input
                        type="text"
                        value={productCustomAttributeInput}
                        onChange={(e) => setProductCustomAttributeInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Color, Size, Material"
                      />
                    </div>
                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => {
                                                     if (productCustomAttributeInput.trim()) {
                             const newAttributes = { 
                               ...product.attributes, 
                               [productCustomAttributeInput.trim()]: '' 
                             };
                             setProduct({ ...product, attributes: newAttributes });
                            setProductCustomAttributeInput('');
                            setShowProductCustomInput(false);
                          }
                        }}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        <Check size={16} />
                        Add
                      </GlassButton>
                      <GlassButton
                        onClick={() => {
                          setProductCustomAttributeInput('');
                          setShowProductCustomInput(false);
                        }}
                        className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                      >
                        <X size={16} />
                        Cancel
                      </GlassButton>
                    </div>
                  </div>
                )}

                {/* Specifications List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Current Specifications
                  </h3>
                  
                                     {product.attributes && Object.keys(product.attributes).length > 0 ? (
                     <div className="space-y-3">
                       {Object.entries(product.attributes).map(([key, value]) => (
                         <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <div className="flex-1">
                             <div className="font-medium text-gray-900">{key}</div>
                             <input
                               type="text"
                               value={value as string}
                               onChange={(e) => {
                                 const newAttributes = { ...product.attributes, [key]: e.target.value };
                                 setProduct({ ...product, attributes: newAttributes });
                               }}
                               className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                             />
                           </div>
                           <GlassButton
                             onClick={() => {
                               const newAttributes = { ...product.attributes };
                               delete newAttributes[key];
                               setProduct({ ...product, attributes: newAttributes });
                             }}
                             className="bg-red-600 text-white hover:bg-red-700 ml-2"
                           >
                             <X size={14} />
                           </GlassButton>
                         </div>
                       ))}
                     </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Specifications Added</h3>
                      <p className="text-gray-600">
                        Click the buttons above to add specifications for this product.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <GlassButton
                    onClick={() => setShowProductSpecificationsModal(false)}
                    className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    onClick={() => {
                      setShowProductSpecificationsModal(false);
                      toast.success('Product specifications saved successfully!');
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save Specifications
                  </GlassButton>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Variant Specifications Modal */}
        {showVariantSpecificationsModal && currentVariantIndex !== null && (
          <Modal
            isOpen={showVariantSpecificationsModal}
            onClose={() => setShowVariantSpecificationsModal(false)}
            title="Variant Specifications"
          >
            <div className="space-y-6">
              <div className="text-center">
                <Layers className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Variant Specifications
                </h2>
                <p className="text-gray-600">
                  {product.variants[currentVariantIndex]?.name || `Variant ${currentVariantIndex + 1}`}
                </p>
              </div>

              <div className="flex justify-end">
                <GlassButton
                  onClick={() => setShowVariantSpecificationsModal(false)}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  <X size={16} />
                  Close
                </GlassButton>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <GlassButton
                    onClick={() => setShowCustomInput(currentVariantIndex)}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Plus size={16} />
                    Add Specifications
                  </GlassButton>
                </div>

                {showCustomInput === currentVariantIndex && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specification Name
                      </label>
                      <input
                        type="text"
                        value={customAttributeInput}
                        onChange={(e) => setCustomAttributeInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Color, Size, Material"
                      />
                    </div>
                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => {
                          if (customAttributeInput.trim()) {
                            const newAttributes = { 
                              ...product.variants[currentVariantIndex].attributes, 
                              [customAttributeInput.trim()]: '' 
                            };
                            const newVariants = [...product.variants];
                            newVariants[currentVariantIndex] = {
                              ...newVariants[currentVariantIndex],
                              attributes: newAttributes
                            };
                            setProduct({ ...product, variants: newVariants });
                            setCustomAttributeInput('');
                            setShowCustomInput(null);
                          }
                        }}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        <Check size={16} />
                        Add
                      </GlassButton>
                      <GlassButton
                        onClick={() => {
                          setCustomAttributeInput('');
                          setShowCustomInput(null);
                        }}
                        className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                      >
                        <X size={16} />
                        Cancel
                      </GlassButton>
                    </div>
                  </div>
                )}

                {/* Specifications List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Current Specifications
                  </h3>
                  
                  {product.variants[currentVariantIndex]?.attributes && Object.keys(product.variants[currentVariantIndex].attributes).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(product.variants[currentVariantIndex].attributes).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{key}</div>
                            <input
                              type="text"
                              value={value as string}
                              onChange={(e) => {
                                const newAttributes = { ...product.variants[currentVariantIndex].attributes, [key]: e.target.value };
                                const newVariants = [...product.variants];
                                newVariants[currentVariantIndex] = {
                                  ...newVariants[currentVariantIndex],
                                  attributes: newAttributes
                                };
                                setProduct({ ...product, variants: newVariants });
                              }}
                              className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <GlassButton
                            onClick={() => {
                              const newAttributes = { ...product.variants[currentVariantIndex].attributes };
                              delete newAttributes[key];
                              const newVariants = [...product.variants];
                              newVariants[currentVariantIndex] = {
                                ...newVariants[currentVariantIndex],
                                attributes: newAttributes
                              };
                              setProduct({ ...product, variants: newVariants });
                            }}
                            className="bg-red-600 text-white hover:bg-red-700 ml-2"
                          >
                            <X size={14} />
                          </GlassButton>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Specifications Added</h3>
                      <p className="text-gray-600">
                        Click the buttons above to add specifications for this variant.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <GlassButton
                    onClick={() => setShowVariantSpecificationsModal(false)}
                    className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    onClick={() => {
                      setShowVariantSpecificationsModal(false);
                      toast.success('Variant specifications saved successfully!');
                    }}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Save Specifications
                  </GlassButton>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
