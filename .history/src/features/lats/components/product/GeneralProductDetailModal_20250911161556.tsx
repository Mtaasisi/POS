import React, { useState, useEffect } from 'react';
import { 
  X, Package, Tag, Hash, DollarSign, Edit, Star, MapPin, Calendar, 
  TrendingUp, TrendingDown, BarChart3, CheckCircle, Battery, Monitor, Camera, 
  FileText, Layers, Clock, User, Truck, QrCode, ShoppingCart, Scale, 
  Zap, Shield, Target, Percent, Calculator, Banknote, Receipt, 
  Copy, Download, Share2, Archive, History, Store, Building,
  HardDrive, Cpu, Palette, Ruler, Hand, Unplug, Fingerprint, Radio, XCircle,
  AlertTriangle, Info, Plus, Minus, Save, RotateCcw
} from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassCard from '../ui/GlassCard';
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
  const { adjustStock } = useInventoryStore();
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
    
    // DEBUG: Log product data received by modal
    console.log('🔍 [GeneralProductDetailModal] DEBUG - Product data received:', {
      id: product?.id,
      name: product?.name,
      sku: product?.sku,
      category: product?.category,
      supplier: product?.supplier,
      totalQuantity: product?.totalQuantity,
      variants: product?.variants,
      images: product?.images,
      price: product?.price,
      costPrice: product?.costPrice
    });
    
    // DEBUG: Check for missing information in modal
    if (product) {
      const missingInfo = [];
      if (!product.supplier) missingInfo.push('supplier');
      if (!product.category) missingInfo.push('category');
      if (!product.variants || product.variants.length === 0) missingInfo.push('variants');
      if (!product.images || product.images.length === 0) missingInfo.push('images');
      if (product.totalQuantity === 0) missingInfo.push('stock quantity');
      
      if (missingInfo.length > 0) {
        console.warn('⚠️ [GeneralProductDetailModal] DEBUG - Missing information:', missingInfo);
      } else {
        console.log('✅ [GeneralProductDetailModal] DEBUG - All information present');
      }
    }
  }, [product]);

  // Listen for product data updates from other parts of the app
  useEffect(() => {
    const handleProductDataUpdate = (event: CustomEvent) => {
      const { updatedProducts } = event.detail;
      if (product && updatedProducts.includes(product.id)) {
        console.log('🔄 Product data updated in modal, refreshing...');
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
        console.error('Error loading product images:', error);
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
        
        // Refresh product data by reloading from the store
        // The adjustStock function already calls loadProducts() in the store
        // We need to trigger a re-render with updated data
        setTimeout(() => {
          // Force a re-render by updating the current product state
          setCurrentProduct(prev => ({ ...prev }));
        }, 500);
      } else {
        toast.error(response.message || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const openStockAdjustment = (variant: any) => {
    setSelectedVariant(variant);
    setAdjustmentQuantity(0);
    setAdjustmentReason('');
    setShowStockAdjustment(true);
  };

  const closeStockAdjustment = () => {
    setShowStockAdjustment(false);
    setSelectedVariant(null);
    setAdjustmentQuantity(0);
    setAdjustmentReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative backdrop-blur-xl rounded-xl border shadow-lg transition-all duration-300 hover:shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto"
        style={{ 
          backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.95))', 
          borderColor: 'var(--card-border, rgba(255, 255, 255, 0.3))', 
          boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1))' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Product Details</h2>
              <p className="text-sm text-gray-600">Complete product information and specifications</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Images & Basic Info */}
            <div className="space-y-6">
              {/* Product Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-gray-600" />
                  Product Images
                </h3>
                <div className="w-[392px] h-[392px] relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImageIndex]?.url || images[0]?.url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-16 h-16" />
                    </div>
                  )}
                  {images.length > 0 && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                      {selectedImageIndex + 1}/{images.length}
                    </div>
                  )}
                </div>
                
                {/* Image Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === selectedImageIndex 
                            ? 'border-blue-500 shadow-md' 
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

              {/* Product Specifications */}
              {Object.keys(specifications).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-gray-600" />
                    Technical Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {Object.entries(specifications).map(([key, value]) => {
                      // Get color based on specification type (matching POS styling)
                      const getSpecColor = (specKey: string) => {
                        const spec = specKey.toLowerCase();
                        if (spec.includes('ram')) return 'bg-green-100 text-green-700 border-green-200';
                        if (spec.includes('storage') || spec.includes('memory')) return 'bg-blue-100 text-blue-700 border-blue-200';
                        if (spec.includes('processor') || spec.includes('cpu')) return 'bg-purple-100 text-purple-700 border-purple-200';
                        if (spec.includes('screen') || spec.includes('display')) return 'bg-orange-100 text-orange-700 border-orange-200';
                        if (spec.includes('battery')) return 'bg-teal-100 text-teal-700 border-teal-200';
                        if (spec.includes('camera')) return 'bg-pink-100 text-pink-700 border-pink-200';
                        if (spec.includes('color')) return 'bg-red-100 text-red-700 border-red-200';
                        if (spec.includes('size') || spec.includes('weight')) return 'bg-gray-100 text-gray-700 border-gray-200';
                        if (spec.includes('touch') || spec.includes('detachable') || spec.includes('fingerprint')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                      };

                      // Get appropriate icon for each specification
                      const getSpecIcon = (specKey: string) => {
                        const spec = specKey.toLowerCase();
                        if (spec.includes('ram') || spec.includes('memory')) return <Zap className="w-4 h-4" />;
                        if (spec.includes('storage')) return <HardDrive className="w-4 h-4" />;
                        if (spec.includes('processor') || spec.includes('cpu')) return <Cpu className="w-4 h-4" />;
                        if (spec.includes('screen') || spec.includes('display')) return <Monitor className="w-4 h-4" />;
                        if (spec.includes('battery')) return <Battery className="w-4 h-4" />;
                        if (spec.includes('camera')) return <Camera className="w-4 h-4" />;
                        if (spec.includes('color')) return <Palette className="w-4 h-4" />;
                        if (spec.includes('size') || spec.includes('weight')) return <Ruler className="w-4 h-4" />;
                        if (spec.includes('touch')) return <Hand className="w-4 h-4" />;
                        if (spec.includes('detachable')) return <Unplug className="w-4 h-4" />;
                        if (spec.includes('fingerprint')) return <Fingerprint className="w-4 h-4" />;
                        if (spec.includes('wireless') || spec.includes('wifi')) return <Radio className="w-4 h-4" />;
                        if (spec.includes('bluetooth')) return <Radio className="w-4 h-4" />;
                        return <Tag className="w-4 h-4" />;
                      };
                      
                      const formattedValue = formatSpecificationValue(key, value);
                      const isYesValue = formattedValue === 'Yes';
                      const isNoValue = formattedValue === 'No';
                      
                      return (
                        <div key={key} className={`px-3 py-3 rounded-lg border font-medium ${getSpecColor(key)} hover:shadow-sm transition-all duration-200`}>
                          <div className="flex items-center gap-2 mb-1">
                            {getSpecIcon(key)}
                            <div className="font-semibold capitalize text-sm">{key.replace(/_/g, ' ')}</div>
                          </div>
                          <div className="flex items-center gap-2 pl-6">
                            {isYesValue && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {isNoValue && (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">{formattedValue}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.description && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">Description:</span>
                      <div className="font-medium text-gray-900 text-sm leading-relaxed">{product.description}</div>
                    </div>
                  </div>
                </div>
              )}


            </div>

            {/* Middle Column - Specifications */}
            <div className="space-y-6">
              {/* Product Codes */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-gray-600" />
                  Product Codes
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">ID:</span>
                      <span className="font-mono text-xs text-gray-700">{product.id}</span>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(product.id)}
                      className="p-1 hover:bg-gray-200 rounded opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                  
                  {primaryVariant?.barcode && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-600">Barcode:</span>
                          <div className="font-mono text-sm text-gray-900">{primaryVariant.barcode}</div>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(primaryVariant.barcode || '')}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-600" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">Product Name:</span>
                      <div className="font-medium text-gray-900">{product.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">SKU:</span>
                      <div className="font-medium text-gray-900 font-mono">{primaryVariant?.sku || 'No SKU'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">Category:</span>
                      <div className="font-medium text-gray-900">{currentProduct.category?.name || 'Uncategorized'}</div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Storage & Location Information */}
              <GlassCard variant="elevated" padding="lg" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-lats-primary/20 rounded-lats-radius-md flex items-center justify-center">
                    <Package className="w-4 h-4 text-lats-primary" />
                  </div>
                  <h4 className="text-lg font-semibold text-lats-text">Storage & Location</h4>
                </div>
                
                <div className="space-y-3">
                  {(product as any).storageRoomName && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Storage Room</span>
                        <span className="font-medium text-lats-text">{(product as any).storageRoomName}</span>
                      </div>
                    </GlassCard>
                  )}
                  
                  {(product as any).shelfName && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Shelf</span>
                        <span className="font-medium text-lats-text">{(product as any).shelfName}</span>
                      </div>
                    </GlassCard>
                  )}

                  {(product as any).storeLocationName && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Store Location</span>
                        <span className="font-medium text-lats-text">{(product as any).storeLocationName}</span>
                      </div>
                    </GlassCard>
                  )}

                  {(product as any).isRefrigerated && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Storage Type</span>
                        <span className="font-medium text-lats-text">Refrigerated Storage</span>
                      </div>
                    </GlassCard>
                  )}

                  {(product as any).requiresLadder && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Access</span>
                        <span className="font-medium text-lats-text">Requires Ladder</span>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </GlassCard>

              {/* Supplier Information */}
              <GlassCard variant="elevated" padding="lg" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-lats-success/20 rounded-lats-radius-md flex items-center justify-center">
                    <User className="w-4 h-4 text-lats-success" />
                  </div>
                  <h4 className="text-lg font-semibold text-lats-text">Supplier Information</h4>
                </div>
                
                {currentProduct.supplier ? (
                  <div className="space-y-3">
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Supplier</span>
                        <span className="font-medium text-lats-text">{currentProduct.supplier.name}</span>
                      </div>
                    </GlassCard>
                    
                    {currentProduct.supplier.contactPerson && (
                      <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-lats-text-secondary">Contact Person</span>
                          <span className="font-medium text-lats-text">{currentProduct.supplier.contactPerson}</span>
                        </div>
                      </GlassCard>
                    )}

                    {currentProduct.supplier.email && (
                      <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-lats-text-secondary">Email</span>
                          <span className="font-medium text-lats-text">{currentProduct.supplier.email}</span>
                        </div>
                      </GlassCard>
                    )}

                    {currentProduct.supplier.phone && (
                      <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-lats-text-secondary">Phone</span>
                          <span className="font-medium text-lats-text">{currentProduct.supplier.phone}</span>
                        </div>
                      </GlassCard>
                    )}

                    {currentProduct.supplier.address && (
                      <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-lats-text-secondary">Address</span>
                          <span className="font-medium text-lats-text">{currentProduct.supplier.address}</span>
                        </div>
                      </GlassCard>
                    )}

                    {currentProduct.supplier.website && (
                      <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-lats-text-secondary">Website</span>
                          <a 
                            href={currentProduct.supplier.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-lats-primary hover:text-lats-primary-dark"
                          >
                            {currentProduct.supplier.website}
                          </a>
                        </div>
                      </GlassCard>
                    )}
                  </div>
                ) : (
                  <GlassCard variant="subtle" padding="md" className="text-center">
                    <div className="text-lats-text-secondary italic">No supplier information available</div>
                  </GlassCard>
                )}
              </GlassCard>

              {/* Product Condition & Status */}
              <GlassCard variant="elevated" padding="lg" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-lats-warning/20 rounded-lats-radius-md flex items-center justify-center">
                    <Shield className="w-4 h-4 text-lats-warning" />
                  </div>
                  <h4 className="text-lg font-semibold text-lats-text">Product Status</h4>
                </div>
                
                <div className="space-y-3">
                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Condition</span>
                      <span className="font-medium text-lats-text capitalize">{(product as any).condition || 'New'}</span>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Stock Quantity</span>
                      <span className="font-medium text-lats-text">{currentProduct.totalQuantity || 0}</span>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Min Stock Level</span>
                      <span className="font-medium text-lats-text">
                        {currentProduct.variants && currentProduct.variants.length > 0 
                          ? Math.min(...currentProduct.variants.map(v => v.minQuantity || 0))
                          : 0
                        }
                      </span>
                    </div>
                  </GlassCard>

                  {(product as any).tags && (product as any).tags.length > 0 && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="space-y-2">
                        <span className="text-sm text-lats-text-secondary">Tags</span>
                        <div className="flex flex-wrap gap-1">
                          {(product as any).tags.map((tag: string, index: number) => (
                            <GlassBadge key={index} variant="info" size="sm">{tag}</GlassBadge>
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {(product as any).internalNotes && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="space-y-2">
                        <span className="text-sm text-lats-text-secondary">Internal Notes</span>
                        <div className="text-sm text-lats-text">{(product as any).internalNotes}</div>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </GlassCard>

              {/* Pricing & Cost Details */}
              <GlassCard variant="elevated" padding="lg" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-lats-success/20 rounded-lats-radius-md flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-lats-success" />
                  </div>
                  <h4 className="text-lg font-semibold text-lats-text">Pricing Details</h4>
                </div>
                
                <div className="space-y-3">
                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Selling Price</span>
                      <span className="font-medium text-lats-text">{format.money((product as any).price || 0)}</span>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Cost Price</span>
                      <span className="font-medium text-lats-text">{format.money((product as any).costPrice || 0)}</span>
                    </div>
                  </GlassCard>

                  {(product as any).taxRate && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Tax Rate</span>
                        <span className="font-medium text-lats-text">{((product as any).taxRate * 100).toFixed(1)}%</span>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </GlassCard>

              {/* Product Metadata */}
              <GlassCard variant="elevated" padding="lg" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-lats-info/20 rounded-lats-radius-md flex items-center justify-center">
                    <Info className="w-4 h-4 text-lats-info" />
                  </div>
                  <h4 className="text-lg font-semibold text-lats-text">Product Metadata</h4>
                </div>
                
                <div className="space-y-3">
                  {(product as any).isDigital && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Type</span>
                        <span className="font-medium text-lats-text">Digital Product</span>
                      </div>
                    </GlassCard>
                  )}

                  {(product as any).requiresShipping !== undefined && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Shipping</span>
                        <span className="font-medium text-lats-text">
                          {(product as any).requiresShipping ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                    </GlassCard>
                  )}

                  {(product as any).isFeatured && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Status</span>
                        <span className="font-medium text-lats-text">Featured Product</span>
                      </div>
                    </GlassCard>
                  )}

                  {(product as any).weight && (
                    <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Weight</span>
                        <span className="font-medium text-lats-text">{(product as any).weight} kg</span>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </GlassCard>

              {/* Debut Information */}
              {((product as any).debutDate || (product as any).debutNotes || (product as any).debutFeatures) && (
                <GlassCard variant="elevated" padding="lg" className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-lats-primary/20 rounded-lats-radius-md flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-lats-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-lats-text">Debut Information</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {(product as any).debutDate && (
                      <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-lats-text-secondary">Debut Date</span>
                          <span className="font-medium text-lats-text">
                            {new Date((product as any).debutDate).toLocaleDateString()}
                          </span>
                        </div>
                      </GlassCard>
                    )}

                    {(product as any).debutNotes && (
                      <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                        <div className="space-y-2">
                          <span className="text-sm text-lats-text-secondary">Debut Notes</span>
                          <div className="text-sm text-lats-text">{(product as any).debutNotes}</div>
                        </div>
                      </GlassCard>
                    )}

                    {(product as any).debutFeatures && (product as any).debutFeatures.length > 0 && (
                      <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                        <div className="space-y-2">
                          <span className="text-sm text-lats-text-secondary">Debut Features</span>
                          <div className="flex flex-wrap gap-1">
                            {(product as any).debutFeatures.map((feature: string, index: number) => (
                              <GlassBadge key={index} variant="info" size="sm">{feature}</GlassBadge>
                            ))}
                          </div>
                        </div>
                      </GlassCard>
                    )}
                  </div>
                </GlassCard>
              )}

              {/* Product Variants Information */}
              {product.variants && product.variants.length > 0 && (
                <GlassCard variant="elevated" padding="lg" className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-lats-primary/20 rounded-lats-radius-md flex items-center justify-center">
                      <Layers className="w-4 h-4 text-lats-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-lats-text">Product Variants</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {product.variants.map((variant, index) => (
                      <GlassCard key={variant.id || index} variant="subtle" padding="md" className="hover:bg-lats-surface-hover">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-lats-text">
                              {variant.name || `Variant ${index + 1}`}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-lats-text-secondary">SKU: {variant.sku}</span>
                              {currentUser?.role === 'admin' && (
                                <button
                                  onClick={() => openStockAdjustment(variant)}
                                  className="p-1 hover:bg-lats-surface-hover rounded-lats-radius-sm transition-colors"
                                  title="Adjust Stock"
                                >
                                  <RotateCcw className="w-3 h-3 text-lats-primary" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-lats-text-secondary">Price:</span>
                              <span className="font-medium text-lats-text">{format.money(variant.price || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-lats-text-secondary">Stock:</span>
                              <span className="font-medium text-lats-text">{variant.stockQuantity || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-lats-text-secondary">Cost:</span>
                              <span className="font-medium text-lats-text">{format.money(variant.costPrice || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-lats-text-secondary">Min Level:</span>
                              <span className="font-medium text-lats-text">{variant.minStockLevel || 0}</span>
                            </div>
                          </div>

                          {variant.barcode && (
                            <div className="flex items-center gap-2 text-sm pt-2 border-t border-lats-glass-border">
                              <span className="text-lats-text-secondary">Barcode:</span>
                              <span className="font-mono text-lats-text">{variant.barcode}</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(variant.barcode || '')}
                                className="p-1 hover:bg-lats-surface-hover rounded-lats-radius-sm transition-colors"
                              >
                                <Copy className="w-3 h-3 text-lats-text-secondary" />
                              </button>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Stock Adjustment Section - Admin Only */}
              {currentUser?.role === 'admin' && (
                <GlassCard variant="elevated" padding="lg" className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-lats-warning/20 rounded-lats-radius-md flex items-center justify-center">
                      <RotateCcw className="w-4 h-4 text-lats-warning" />
                    </div>
                    <h4 className="text-lg font-semibold text-lats-text">Stock Management</h4>
                  </div>
                  
                  <div className="text-sm text-lats-text-secondary">
                    Click the adjust button next to any variant to modify stock levels.
                  </div>
                </GlassCard>
              )}

              {/* Business Intelligence */}
              <GlassCard variant="elevated" padding="lg" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-lats-info/20 rounded-lats-radius-md flex items-center justify-center">
                    <Shield className="w-4 h-4 text-lats-info" />
                  </div>
                  <h4 className="text-lg font-semibold text-lats-text">Business Intelligence</h4>
                </div>
                
                <div className="space-y-3">
                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Product Status</span>
                      <GlassBadge variant={product.isActive ? 'success' : 'error'} size="sm">
                        {product.isActive ? 'Active' : 'Inactive'}
                      </GlassBadge>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Stock Status</span>
                      <GlassBadge 
                        variant={
                          (product as any).stockQuantity <= (product as any).minStockLevel ? 'error' : 
                          (product as any).stockQuantity <= ((product as any).minStockLevel * 2) ? 'warning' : 'success'
                        } 
                        size="sm"
                      >
                        {(product as any).stockQuantity <= (product as any).minStockLevel ? 'Low Stock' : 
                         (product as any).stockQuantity <= ((product as any).minStockLevel * 2) ? 'Medium Stock' : 'In Stock'}
                      </GlassBadge>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lats-text-secondary">Data Completeness</span>
                        <span className="text-sm font-medium text-lats-text">{completeness}%</span>
                      </div>
                      <div className="w-full bg-lats-surface/50 rounded-full h-2">
                        <div 
                          className="bg-lats-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Days in Inventory</span>
                      <span className="font-medium text-lats-text">{daysInStock} days</span>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Created</span>
                      <span className="font-medium text-lats-text">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </GlassCard>

                  <GlassCard variant="subtle" padding="sm" className="hover:bg-lats-surface-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lats-text-secondary">Last Updated</span>
                      <span className="font-medium text-lats-text">
                        {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </GlassCard>
                </div>
              </GlassCard>
            </div>

            {/* Right Column - Financial Analytics */}
            <div className="space-y-6">
              {analytics && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 rounded-3xl"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-sm font-bold text-white">$</span>
                        </div>
                        <h4 className="text-base font-bold text-gray-800">Financial Overview</h4>
                      </div>
                      <div className="w-12 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Total Value</span>
                          <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                        </div>
                        <div className="text-xl font-bold">{format.money(analytics.totalRetailValue)}</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Profit</span>
                          <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                        </div>
                        <div className="text-xl font-bold">{format.money(analytics.potentialProfit)}</div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Margin</span>
                          <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                        </div>
                        <div className="text-xl font-bold">{analytics.profitMargin.toFixed(1)}%</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Investment</span>
                          <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                        </div>
                        <div className="text-xl font-bold">{format.money(analytics.totalCostValue)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* Debug Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                  Debug Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500">Product ID:</span>
                      <div className="text-gray-800">{product?.id || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Modal Open:</span>
                      <div className="text-gray-800">{isOpen ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Variants Count:</span>
                      <div className="text-gray-800">{product?.variants?.length || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Images Count:</span>
                      <div className="text-gray-800">{images.length}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Selected Image:</span>
                      <div className="text-gray-800">{selectedImageIndex + 1}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Has Supplier:</span>
                      <div className="text-gray-800">{product?.supplier ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Has Category:</span>
                      <div className="text-gray-800">{product?.category ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Quantity:</span>
                      <div className="text-gray-800">{product?.totalQuantity || 0}</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2">
                    <span className="text-gray-500">Primary Variant:</span>
                    <div className="text-gray-800">
                      {primaryVariant ? (
                        <div className="space-y-1">
                          <div>SKU: {primaryVariant.sku || 'N/A'}</div>
                          <div>Price: {format.money(primaryVariant.sellingPrice || 0)}</div>
                          <div>Cost: {format.money(primaryVariant.costPrice || 0)}</div>
                          <div>Stock: {primaryVariant.quantity || 0}</div>
                          <div>Barcode: {primaryVariant.barcode || 'N/A'}</div>
                        </div>
                      ) : (
                        'No primary variant'
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <span className="text-gray-500">Analytics:</span>
                    <div className="text-gray-800">
                      {analytics ? (
                        <div className="space-y-1">
                          <div>Total Stock: {analytics.totalStock}</div>
                          <div>Total Value: {format.money(analytics.totalRetailValue)}</div>
                          <div>Total Cost: {format.money(analytics.totalCostValue)}</div>
                          <div>Profit: {format.money(analytics.potentialProfit)}</div>
                          <div>Margin: {analytics.profitMargin.toFixed(1)}%</div>
                          <div>Status: {analytics.stockStatus}</div>
                        </div>
                      ) : (
                        'No analytics data'
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <span className="text-gray-500">Specifications:</span>
                    <div className="text-gray-800">
                      {Object.keys(specifications).length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(specifications).slice(0, 3).map(([key, value]) => (
                            <div key={key}>{key}: {formatSpecificationValue(key, value)}</div>
                          ))}
                          {Object.keys(specifications).length > 3 && (
                            <div>... and {Object.keys(specifications).length - 3} more</div>
                          )}
                        </div>
                      ) : (
                        'No specifications'
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <span className="text-gray-500">Completeness:</span>
                    <div className="text-gray-800">{completeness}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <span className="text-gray-500">Timestamps:</span>
                    <div className="text-gray-800 space-y-1">
                      <div>Created: {product?.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}</div>
                      <div>Updated: {product?.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'N/A'}</div>
                      <div>Days in Stock: {daysInStock}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
            </div>
          </div>

          {/* Full Width Bottom Section - Variant Table */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-600" />
                Complete Variant Information ({product.variants.length} variants)
              </h3>
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-4 font-medium text-gray-700">Variant Name</th>
                      <th className="text-left p-4 font-medium text-gray-700">SKU</th>
                      <th className="text-left p-4 font-medium text-gray-700">Stock</th>
                      <th className="text-left p-4 font-medium text-gray-700">Min Level</th>
                      <th className="text-left p-4 font-medium text-gray-700">Cost Price</th>
                      <th className="text-left p-4 font-medium text-gray-700">Selling Price</th>
                      <th className="text-left p-4 font-medium text-gray-700">Markup</th>
                      <th className="text-left p-4 font-medium text-gray-700">Profit/Unit</th>
                      <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => {
                      const markup = variant.costPrice > 0 ? ((variant.sellingPrice - variant.costPrice) / variant.costPrice * 100) : 0;
                      const profitPerUnit = variant.sellingPrice - variant.costPrice;
                      return (
                        <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {variant.isPrimary && <Star className="w-4 h-4 text-yellow-500" />}
                              <span className="font-medium">{variant.name}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs">{variant.sku}</td>
                          <td className="p-4">
                            <span className={`font-medium ${
                              variant.quantity <= 0 ? 'text-red-600' : 
                              variant.quantity <= variant.minQuantity ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {variant.quantity}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600">{variant.minQuantity}</td>
                          <td className="p-4 font-medium">{format.money(variant.costPrice)}</td>
                          <td className="p-4 font-medium">{format.money(variant.sellingPrice)}</td>
                          <td className="p-4">
                            <span className={`font-medium ${markup > 50 ? 'text-green-600' : markup > 20 ? 'text-orange-600' : 'text-red-600'}`}>
                              {markup.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-4 font-medium">
                            <span className={profitPerUnit > 0 ? 'text-green-600' : 'text-red-600'}>
                              {format.money(profitPerUnit)}
                            </span>
                          </td>
                          <td className="p-4">
                            <GlassBadge 
                              variant={variant.quantity > variant.minQuantity ? 'success' : variant.quantity > 0 ? 'warning' : 'error'}
                              size="sm"
                            >
                              {variant.quantity > variant.minQuantity ? 'Good' : variant.quantity > 0 ? 'Low' : 'Empty'}
                            </GlassBadge>
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
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            <div className="flex items-center gap-3">
              <GlassButton
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600/90 hover:to-emerald-600/90 text-white border-white/20"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to POS
              </GlassButton>
              
              <GlassButton
                onClick={handleGenerateQRCode}
                className="bg-gradient-to-r from-purple-500/80 to-violet-500/80 hover:from-purple-600/90 hover:to-violet-600/90 text-white border-white/20"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </GlassButton>

              <GlassButton
                onClick={handleExportProduct}
                className="bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-600/90 hover:to-cyan-600/90 text-white border-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </GlassButton>

              <GlassButton
                onClick={handleShareProduct}
                className="bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-600/90 hover:to-red-600/90 text-white border-white/20"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </GlassButton>
            </div>
            
            <div className="flex items-center gap-3">
              <GlassButton
                onClick={onClose}
                className="bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Close
              </GlassButton>
              
              {onEdit && (
                <GlassButton
                  onClick={() => onEdit(product)}
                  className="bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </GlassButton>
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

        {/* Stock Adjustment Modal */}
        {showStockAdjustment && selectedVariant && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={closeStockAdjustment}
            />
            <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Adjust Stock Level</h3>
                <button 
                  onClick={closeStockAdjustment}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Variant Details:</div>
                  <div className="font-medium text-gray-900">{selectedVariant.name || 'Variant'}</div>
                  <div className="text-sm text-gray-600">SKU: {selectedVariant.sku}</div>
                  <div className="text-sm text-gray-600">Current Stock: {selectedVariant.stockQuantity || 0}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAdjustmentQuantity(Math.max(adjustmentQuantity - 1, -999))}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      placeholder="0"
                    />
                    <button
                      onClick={() => setAdjustmentQuantity(adjustmentQuantity + 1)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Positive numbers add stock, negative numbers remove stock
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Adjustment
                  </label>
                  <select
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a reason</option>
                    <option value="Stock count correction">Stock count correction</option>
                    <option value="Damaged goods">Damaged goods</option>
                    <option value="Theft/Loss">Theft/Loss</option>
                    <option value="Return to supplier">Return to supplier</option>
                    <option value="Found stock">Found stock</option>
                    <option value="Manual adjustment">Manual adjustment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {adjustmentQuantity !== 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>New Stock Level:</strong> {(selectedVariant.stockQuantity || 0) + adjustmentQuantity}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <GlassButton
                    onClick={closeStockAdjustment}
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    onClick={handleStockAdjustment}
                    disabled={adjustmentQuantity === 0 || !adjustmentReason.trim() || isAdjustingStock}
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdjustingStock ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Adjusting...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Adjust Stock
                      </>
                    )}
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralProductDetailModal;