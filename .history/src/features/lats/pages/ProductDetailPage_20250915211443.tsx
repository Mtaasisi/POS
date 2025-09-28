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

        {/* Analytics Overview - Prominent Position */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-green-600" />
            Analytics Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Total Stock</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{analytics.totalStock}</p>
              <p className="text-sm text-blue-600">units</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">Cost Value</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{format.money(analytics.totalCostValue)}</p>
              <p className="text-sm text-green-600">total cost</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Retail Value</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{format.money(analytics.totalRetailValue)}</p>
              <p className="text-sm text-purple-600">potential sales</p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Profit Margin</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{analytics.profitMargin.toFixed(1)}%</p>
              <p className="text-sm text-orange-600">potential profit</p>
            </div>
          </div>
          
          {/* Stock Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  analytics.stockStatus === 'low' ? 'bg-orange-500' :
                  analytics.stockStatus === 'out-of-stock' ? 'bg-red-500' :
                  analytics.stockStatus === 'high' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">Stock Status</span>
              </div>
              <GlassBadge 
                variant={
                  analytics.stockStatus === 'low' ? 'warning' :
                  analytics.stockStatus === 'out-of-stock' ? 'error' :
                  analytics.stockStatus === 'high' ? 'success' : 'info'
                }
                size="sm"
              >
                {getStockStatusText(analytics.stockStatus)}
              </GlassBadge>
            </div>
          </div>
        </GlassCard>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  Basic Information
                </h3>
                <GlassButton
                  onClick={handleProductSpecificationsClick}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  size="sm"
                >
                  <FileText size={14} />
                  Specifications
                </GlassButton>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Product Name</label>
                  <p className="text-gray-900 font-medium text-base">{product.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">SKU</label>
                  <p className="text-gray-900 font-medium text-base">{product.sku || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <GlassBadge 
                    variant="success"
                    className="mt-1"
                    size="sm"
                  >
                    Active
                  </GlassBadge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Shelf Location</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-900 font-medium text-base">
                      {product.shelfName || product.shelfCode || product.storeLocationName || product.storageRoomName || 'Not assigned'}
                    </span>
                  </div>
                </div>
                {product.internalNotes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                    <p className="text-gray-900 text-base">{product.internalNotes}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Enhanced Variants Section */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Layers size={16} className="text-purple-600" />
                  Product Variants ({product.variants?.length || 0})
                </h3>
                <div className="flex items-center gap-2">
                  <GlassButton
                    onClick={() => setShowStockAdjustment(true)}
                    className="bg-green-600 text-white hover:bg-green-700"
                    size="md"
                  >
                    <RefreshCw size={14} />
                    Adjust Stock
                  </GlassButton>
                  <GlassButton
                    onClick={() => setShowBulkActions(true)}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                    size="md"
                  >
                    <Settings size={14} />
                    Bulk Actions
                  </GlassButton>
                </div>
              </div>
              
              {/* Enhanced Variants Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Image</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Variant</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700 hidden sm:table-cell">SKU</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Price</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700 hidden md:table-cell">Cost</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Stock</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants?.map((variant, index) => (
                      <tr key={variant.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <VariantImageDisplay
                            variant={variant}
                            productImages={images.map((img, idx) => ({
                              id: img.id || `product-${idx}`,
                              url: img.url,
                              fileName: `product-image-${idx + 1}`,
                              fileSize: 0,
                              isPrimary: img.isPrimary,
                              uploadedAt: new Date().toISOString()
                            }))}
                            size="sm"
                            editable={true}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{variant.name}</p>
                            <p className="text-xs text-gray-500 sm:hidden">{variant.sku}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 hidden sm:table-cell">
                          <span className="font-mono text-xs">{variant.sku}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-medium text-green-600 text-sm">{format.money(variant.price || 0)}</span>
                        </td>
                        <td className="py-3 px-2 hidden md:table-cell">
                          <span className="font-medium text-gray-600 text-sm">{format.money(variant.costPrice || 0)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm">{variant.stockQuantity || 0}</span>
                            <span className="text-xs text-gray-500 hidden sm:inline">units</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <GlassBadge 
                            variant={
                              (variant.stockQuantity || 0) === 0 ? 'error' :
                              (variant.stockQuantity || 0) <= (variant.minStockLevel || 0) ? 'warning' : 'success'
                            }
                            size="sm"
                          >
                            {(variant.stockQuantity || 0) === 0 ? 'Out' :
                             (variant.stockQuantity || 0) <= (variant.minStockLevel || 0) ? 'Low' : 'In Stock'}
                          </GlassBadge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <GlassButton
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedVariant(variant)}
                              className="p-1"
                            >
                              <Edit size={12} />
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowStockAdjustment(true)}
                              className="p-1"
                            >
                              <RefreshCw size={12} />
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVariantSpecificationsClick(index)}
                              className="p-1"
                            >
                              <FileText size={12} />
                            </GlassButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Product Images */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera size={18} className="text-pink-600" />
                Product Images ({images.length})
              </h3>
              {images.length > 0 ? (
                <div className="space-y-3">
                  {images.map((image, index) => (
                    <div key={image.id || index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageModal(image)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                      </div>
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2">
                          <GlassBadge variant="success" size="sm">Primary</GlassBadge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No images uploaded</p>
                </div>
              )}
            </GlassCard>

            {/* Product Details */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-gray-600" />
                Product Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="text-sm text-gray-900">{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Updated:</span>
                  <span className="text-sm text-gray-900">{new Date(product.updatedAt).toLocaleDateString()}</span>
                </div>
                {product.condition && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Condition:</span>
                    <GlassBadge variant="info" size="sm">{product.condition}</GlassBadge>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Price:</span>
                  <span className="text-sm font-medium text-gray-900">{format.money(product.price)}</span>
                </div>
              </div>
            </GlassCard>

            {/* Product IDs */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag size={18} className="text-indigo-600" />
                Product IDs
              </h3>
              <div className="space-y-3">
                {product.categoryId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Category ID</label>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-900 font-mono">{product.categoryId}</span>
                    </div>
                  </div>
                )}

                {product.supplierId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Supplier ID</label>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-gray-900 font-mono">{product.supplierId}</span>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

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
