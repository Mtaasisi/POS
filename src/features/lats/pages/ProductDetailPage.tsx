import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '../../../lib/toastUtils';
import { SimpleBackButton as BackButton } from '../../../features/shared/components/ui/SimpleBackButton';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Layers, 
  Hash, 
  FileText, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp, 
  AlertTriangle as AlertIcon, 
  MessageCircle, 
  Users, 
  Star, 
  UserPlus, 
  Brain, 
  Zap, 
  Lightbulb, 
  Search, 
  Sparkles, 
  RefreshCw, 
  Store,
  Calendar,
  MapPin,
  Barcode,
  Camera,
  Image as ImageIcon,
  Download,
  Share2,
  Settings,
  BarChart3,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Plus,
  Minus,
  Upload,
  X,
  Bug,
  Palette,
  HardDrive,
  Cpu,
  Monitor,
  Battery,
  Ruler,
  Building,
  Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import Modal from '../../../features/shared/components/ui/Modal';
import { useAuth } from '../../../context/AuthContext';
import { getLatsProvider } from '../lib/data/provider';
import { Product, ProductVariant } from '../types/inventory';
import { format } from '../lib/format';
import { RobustImageService, ProductImage } from '../../../lib/robustImageService';
import { getActiveBrands, Brand } from '../../../lib/brandApi';
import { getActiveCategories, Category } from '../../../lib/categoryApi';
import { getActiveSuppliers, Supplier } from '../../../lib/supplierApi';
import { StoreLocation } from '../../settings/types/storeLocation';
import { storeLocationApi } from '../../settings/utils/storeLocationApi';
import { 
  calculateTotalStock, 
  calculateTotalCostValue, 
  calculateTotalRetailValue, 
  calculatePotentialProfit, 
  calculateProfitMargin, 
  getStockStatus 
} from '../lib/productCalculations';
import { processProductImages, cleanupImageData } from '../lib/imageUtils';
import GlassBadge from '../../../features/shared/components/ui/GlassBadge';
import LoadingSkeleton, { TextSkeleton } from '../../../features/shared/components/ui/LoadingSkeleton';
import { SimpleImageDisplay } from '../../../components/SimpleImageDisplay';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Main state
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // UI state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Form state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalStock: 0,
    totalCostValue: 0,
    totalRetailValue: 0,
    potentialProfit: 0,
    profitMargin: 0,
    stockStatus: 'normal'
  });

  // Additional state for expanded features
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);

  // New state for missing features
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  
  // Specifications management state
  const [showProductSpecificationsModal, setShowProductSpecificationsModal] = useState(false);
  const [showVariantSpecificationsModal, setShowVariantSpecificationsModal] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null);
  const [showProductCustomInput, setShowProductCustomInput] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState<number | null>(null);
  const [productCustomAttributeInput, setProductCustomAttributeInput] = useState('');
  const [customAttributeInput, setCustomAttributeInput] = useState('');
  
  // Form validation state
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>({});
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameExists, setNameExists] = useState(false);

  // Load product data
  const loadProductData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading product data for ID:', id);
      
      const provider = getLatsProvider();
      const { ok, data, message } = await provider.getProduct(id);
      
      if (ok && data) {
        const productData = data as Product;
        setProduct(productData);
        
        // Load images
        const productImages = await RobustImageService.getProductImages(id);
        setImages(productImages);
        
        // Calculate analytics
        const totalStock = calculateTotalStock(productData.variants);
        const totalCostValue = calculateTotalCostValue(productData.variants);
        const totalRetailValue = calculateTotalRetailValue(productData.variants);
        const potentialProfit = calculatePotentialProfit(productData.variants);
        const profitMargin = calculateProfitMargin(productData.variants);
        const stockStatus = getStockStatus(productData.variants);
        
        setAnalytics({
          totalStock,
          totalCostValue,
          totalRetailValue,
          potentialProfit,
          profitMargin,
          stockStatus
        });
        
        console.log('✅ Product data loaded successfully:', productData);
      } else {
        console.error('❌ Failed to load product data:', message);
        setError(message || 'Failed to load product data');
        toast.error(`Failed to load product: ${message}`);
      }
    } catch (error) {
      console.error('❌ Exception loading product data:', error);
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
    loadFormData();
  }, [id]);

  // Load form data for editing
  const loadFormData = async () => {
    try {
      const [categoriesData, locationsData, brandsData, suppliersData] = await Promise.all([
        getActiveCategories(),
        storeLocationApi.getAll(),
        getActiveBrands(),
        getActiveSuppliers()
      ]);

      setCategories(categoriesData || []);
      setStoreLocations(locationsData || []);
      setBrands(brandsData || []);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Failed to load form data');
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!product || !currentUser) return;
    
    try {
      const provider = getLatsProvider();
      const { ok, message } = await provider.deleteProduct(product.id);
      
      if (ok) {
        toast.success('Product deleted successfully');
        navigate('/lats/unified-inventory');
      } else {
        toast.error(`Failed to delete product: ${message}`);
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  // Handle image modal
  const openImageModal = (image: ProductImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  // Get stock status color
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'out-of-stock': return 'text-red-600 bg-red-100';
      case 'high': return 'text-green-600 bg-green-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  // Get stock status text
  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'low': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      case 'high': return 'In Stock';
      default: return 'Normal Stock';
    }
  };

  // Helper functions for new features
  const checkProductName = async (name: string) => {
    if (!name.trim() || !product) {
      setNameExists(false);
      return;
    }

    setIsCheckingName(true);
    try {
      const { data, error } = await supabase!
        .from('lats_products')
        .select('id')
        .ilike('name', `%${name.trim()}%`)
        .neq('id', product.id)
        .limit(1);

      if (error) throw error;
      
      setNameExists(data && data.length > 0);
    } catch (error) {
      console.error('Error checking product name:', error);
    } finally {
      setIsCheckingName(false);
    }
  };

  const getBrandIdFromName = (brandName: string): string | null => {
    if (!brandName || !brands.length) return null;
    const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    return brand?.id || null;
  };

  const handleProductSpecificationsClick = () => {
    setShowProductSpecificationsModal(true);
  };

  const handleVariantSpecificationsClick = (index: number) => {
    setCurrentVariantIndex(index);
    setShowVariantSpecificationsModal(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
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

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate('/lats/unified-inventory')} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-gray-600">Product Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 text-white hover:bg-blue-700"
                size="sm"
              >
                <Edit size={14} />
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </GlassButton>
              <GlassButton
                onClick={() => setShowStockAdjustment(true)}
                className="bg-green-600 text-white hover:bg-green-700"
                size="sm"
              >
                <Package size={14} />
                Adjust Stock
              </GlassButton>
              <GlassButton
                onClick={() => setShowBulkActions(true)}
                className="bg-purple-600 text-white hover:bg-purple-700"
                size="sm"
              >
                <Settings size={14} />
                Bulk Actions
              </GlassButton>
              <GlassButton
                onClick={() => setShowDeleteConfirmation(true)}
                className="bg-red-600 text-white hover:bg-red-700"
                size="sm"
              >
                <Trash2 size={14} />
                Delete
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Basic Information */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={16} className="text-blue-600" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Product Name</label>
                  <p className="text-gray-900 font-medium text-sm">{product.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
                  <p className="text-gray-900 font-medium text-sm">{product.sku || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Barcode</label>
                  <p className="text-gray-900 font-medium text-sm">{product.barcode || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <GlassBadge 
                    variant="success"
                    className="mt-1"
                    size="sm"
                  >
                    Active
                  </GlassBadge>
                </div>
                {product.internalNotes && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                    <p className="text-gray-900 text-sm">{product.internalNotes}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Analytics Dashboard */}
            <GlassCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 size={16} className="text-green-600" />
                Analytics Overview
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={14} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Total Stock</span>
                  </div>
                  <p className="text-xl font-bold text-blue-900">{analytics.totalStock}</p>
                  <p className="text-xs text-blue-600">units</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">Cost Value</span>
                  </div>
                  <p className="text-xl font-bold text-green-900">{format.money(analytics.totalCostValue)}</p>
                  <p className="text-xs text-green-600">total cost</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">Retail Value</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900">{format.money(analytics.totalRetailValue)}</p>
                  <p className="text-xs text-purple-600">potential sales</p>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-orange-600" />
                    <span className="text-xs font-medium text-orange-700">Profit Margin</span>
                  </div>
                  <p className="text-xl font-bold text-orange-900">{analytics.profitMargin.toFixed(1)}%</p>
                  <p className="text-xs text-orange-600">potential profit</p>
                </div>
              </div>
              
              {/* Stock Status */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
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

            {/* Enhanced Variants Section */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Layers size={16} className="text-purple-600" />
                  Product Variants ({product.variants?.length || 0})
                </h3>
                <div className="flex items-center gap-2">
                  <GlassButton
                    onClick={() => setShowStockAdjustment(true)}
                    className="bg-green-600 text-white hover:bg-green-700"
                    size="sm"
                  >
                    <RefreshCw size={14} />
                    Adjust Stock
                  </GlassButton>
                  <GlassButton
                    onClick={() => setShowBulkActions(true)}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                    size="sm"
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
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Variant</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">SKU</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Price</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Cost</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Stock</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants?.map((variant, index) => (
                      <tr key={variant.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{variant.name}</p>
                            {variant.barcode && (
                              <p className="text-xs text-gray-500">{variant.barcode}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-mono text-xs">{variant.sku}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-medium text-green-600 text-sm">{format.money(variant.price || 0)}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-medium text-gray-600 text-sm">{format.money(variant.costPrice || 0)}</span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm">{variant.stockQuantity || 0}</span>
                            <span className="text-xs text-gray-500">units</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <GlassBadge 
                            variant={
                              (variant.stockQuantity || 0) === 0 ? 'error' :
                              (variant.stockQuantity || 0) <= (variant.minStockLevel || 0) ? 'warning' : 'success'
                            }
                            size="sm"
                          >
                            {(variant.stockQuantity || 0) === 0 ? 'Out of Stock' :
                             (variant.stockQuantity || 0) <= (variant.minStockLevel || 0) ? 'Low Stock' : 'In Stock'}
                          </GlassBadge>
                        </td>
                        <td className="py-2 px-3">
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
          <div className="xl:col-span-1 space-y-4">
            {/* Product Images */}
            <GlassCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Camera size={16} className="text-pink-600" />
                Product Images ({images.length})
              </h3>
              {images.length > 0 ? (
                <div className="space-y-2">
                  {images.map((image, index) => (
                    <div key={image.id || index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageModal(image)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                      </div>
                      {image.isPrimary && (
                        <div className="absolute top-1 left-1">
                          <GlassBadge variant="success" size="sm">Primary</GlassBadge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <ImageIcon size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No images uploaded</p>
                </div>
              )}
            </GlassCard>

            {/* Product IDs Info */}
            <GlassCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={16} className="text-indigo-600" />
                Product IDs
              </h3>
              <div className="space-y-3">
                {product.categoryId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Category ID</label>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-gray-900 font-medium text-sm">{product.categoryId}</span>
                    </div>
                  </div>
                )}
                {product.brandId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Brand ID</label>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-900 font-medium text-sm">{product.brandId}</span>
                    </div>
                  </div>
                )}
                {product.supplierId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Supplier ID</label>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-gray-900 font-medium text-sm">{product.supplierId}</span>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Metadata */}
            <GlassCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info size={16} className="text-gray-600" />
                Additional Information
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-900">{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated:</span>
                  <span className="text-gray-900">{new Date(product.updatedAt).toLocaleDateString()}</span>
                </div>
                {product.condition && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Condition:</span>
                    <GlassBadge variant="info" size="sm">{product.condition}</GlassBadge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock Quantity:</span>
                  <span className="text-gray-900">{product.stockQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price:</span>
                  <span className="text-gray-900">{format.money(product.price)}</span>
                </div>
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

        {/* Debug Modal */}
        {showDebug && (
          <Modal
            isOpen={showDebug}
            onClose={() => setShowDebug(false)}
            title="Debug Information"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Product Data</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(product, null, 2)}

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
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Images Data</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(images, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Analytics Data</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(analytics, null, 2)}
                </pre>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
