// ProductDetailModal component - Shows full product details for purchase orders with editing capabilities
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Package, Tag, Hash, ShoppingCart, 
  CheckCircle, Camera, QrCode, ArrowUpDown, 
  TrendingUp, TrendingDown, Calendar, Truck, 
  DollarSign, BarChart3, Clock, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { SimpleImageDisplay } from '../../../../components/SimpleImageDisplay';
import { formatMoney, Currency, SUPPORTED_CURRENCIES } from '../../lib/purchaseOrderUtils';
import { ProductSearchResult, ProductSearchVariant } from '../../types/pos';
import { 
  getPrimaryVariant, 
  getProductTotalStock,
  isMultiVariantProduct 
} from '../../lib/productUtils';
import { RealTimeStockService } from '../../lib/realTimeStock';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { getLatsProvider } from '../../lib/data/provider';
import { usePurchaseOrderHistory } from '../../hooks/usePurchaseOrderHistory';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductSearchResult;
  currency: Currency;
  onAddToCart: (product: ProductSearchResult, variant: ProductSearchVariant, quantity: number) => void;
  onProductUpdated?: (updatedProduct: ProductSearchResult) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  currency,
  onAddToCart,
  onProductUpdated
}) => {
  // DEBUG: Log product data received by purchase order modal
  useEffect(() => {
    if (isOpen && product) {
      console.log('🔍 [PurchaseOrderProductDetailModal] DEBUG - Product data received:', {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        supplier: product.supplier,
        variants: product.variants,
        specification: product.specification,
        attributes: product.attributes,
        images: product.images
      });
      
      // DEBUG: Check for missing information
      const missingInfo = [];
      if (!product.supplier) missingInfo.push('supplier');
      if (!product.category) missingInfo.push('category');
      if (!product.variants || product.variants.length === 0) missingInfo.push('variants');
      if (!product.images || product.images.length === 0) missingInfo.push('images');
      if (!product.specification) missingInfo.push('specification');
      
      if (missingInfo.length > 0) {
        console.warn('⚠️ [PurchaseOrderProductDetailModal] DEBUG - Missing information:', missingInfo);
      } else {
        console.log('✅ [PurchaseOrderProductDetailModal] DEBUG - All information present');
      }
    }
  }, [isOpen, product]);
  // Get inventory store for updating products
  const { updateProduct } = useInventoryStore();
  
  // Ensure we have a valid currency, fallback to TZS if none provided
  const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'TZS') || SUPPORTED_CURRENCIES[0];
  const safeCurrency = currency || defaultCurrency;
  
  const [selectedVariant, setSelectedVariant] = useState<ProductSearchVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customCostPrice, setCustomCostPrice] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(safeCurrency);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [minimumOrderQty, setMinimumOrderQty] = useState<number>(1);
  const [minimumStock, setMinimumStock] = useState<number>(0);
  
  // Real-time stock state
  const [realTimeStock, setRealTimeStock] = useState<Map<string, number>>(new Map());
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [lastStockUpdate, setLastStockUpdate] = useState<Date | null>(null);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const dataProvider = getLatsProvider();

  // Update selectedCurrency when currency prop changes
  useEffect(() => {
    if (currency) {
      setSelectedCurrency(currency);
    }
  }, [currency]);

  // Safety check to ensure selectedCurrency is always defined
  const safeSelectedCurrency = selectedCurrency || safeCurrency;

  // Initialize with primary variant
  useEffect(() => {
    if (product && !selectedVariant) {
      const primary = getPrimaryVariant(product);
      if (primary) {
        setSelectedVariant(primary);
        // Use product-level costPrice or price, fallback to 70% of selling price
        const defaultCostPrice = product.costPrice || (product.price || 0) * 0.7;
        setCustomCostPrice(defaultCostPrice.toString());
        // Initialize minimum stock from product data (ProductSearchResult doesn't have minimumStock)
        setMinimumStock(0); // Default to 0 since ProductSearchResult doesn't have this field
      }
    }
  }, [product, selectedVariant]);

  // Fetch real-time stock when modal opens (with caching to prevent unnecessary fetches)
  useEffect(() => {
    if (isOpen && product?.id) {
      // Check if we have recent stock data (within last 30 seconds)
      const now = new Date();
      const cacheAge = lastStockUpdate ? now.getTime() - lastStockUpdate.getTime() : Infinity;
      const CACHE_DURATION = 30 * 1000; // 30 seconds
      
      if (cacheAge < CACHE_DURATION && realTimeStock.has(product.id)) {
        console.log('📊 Using cached stock data (age:', Math.round(cacheAge / 1000), 'seconds)');
        return;
      }
      
      // Add a small delay to prevent multiple rapid requests
      const timer = setTimeout(() => {
        fetchRealTimeStock();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, product?.id]);

  // Helper function to format numbers with commas (no trailing .0 or .00)
  const formatNumberWithCommas = (num: number): string => {
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return formatted.replace(/\.00$/, '').replace(/\.0$/, '');
  };

  // Fetch real-time stock data
  const fetchRealTimeStock = async () => {
    if (!product?.id) return;
    
    try {
      setIsLoadingStock(true);
      console.log('📊 Fetching real-time stock for product:', product.id);
      
      const stockService = RealTimeStockService.getInstance();
      const stockLevels = await stockService.getStockLevels([product.id]);
      
      console.log('📊 Real-time stock levels received:', stockLevels);
      setRealTimeStock(stockLevels);
      setLastStockUpdate(new Date());
    } catch (error) {
      console.error('❌ Error fetching real-time stock:', error);
    } finally {
      setIsLoadingStock(false);
    }
  };

  const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
    const rates: { [key: string]: { [key: string]: number } } = {
      'USD': { 'KES': 150, 'EUR': 0.85, 'CNY': 7.2 },
      'KES': { 'USD': 0.0067, 'EUR': 0.0057, 'CNY': 0.048 },
      'EUR': { 'USD': 1.18, 'KES': 175, 'CNY': 8.5 },
      'CNY': { 'USD': 0.14, 'KES': 21, 'EUR': 0.12 }
    };
    return rates[fromCurrency]?.[toCurrency] || 1;
  };

  // Convert product images to new format - memoized to prevent unnecessary recalculations
  const productImages = useMemo(() => {
    if (!product?.images || product.images.length === 0) {
      return [];
    }
    
    return product.images.map((imageUrl, index) => ({
      id: `temp-${product.id}-${index}`,
      url: imageUrl,
      thumbnailUrl: imageUrl,
      fileName: `product-image-${index + 1}`,
      fileSize: 0,
      isPrimary: index === 0,
      uploadedAt: new Date().toISOString()
    }));
  }, [product?.images, product?.id]);

  if (!isOpen || !product || !safeSelectedCurrency || !currency) return null;
  
  const hasMultipleVariants = isMultiVariantProduct(product);
  const totalStock = getProductTotalStock(product);
  const costPrice = parseFloat(customCostPrice) || 0;
  
  // Get real-time stock for current product
  const getRealTimeStockForProduct = (): number => {
    if (!product?.id) return 0;
    return realTimeStock.get(product.id) || 0;
  };

  // Get real-time stock for selected variant
  const getRealTimeStockForVariant = (): number => {
    if (!selectedVariant?.id) return 0;
    
    // For now, we'll use the product-level stock since variant-level stock requires more complex mapping
    // In a full implementation, you'd want to fetch variant-specific stock
    return getRealTimeStockForProduct();
  };

  // Use real-time stock if available, otherwise fall back to cached stock
  const currentTotalStock = getRealTimeStockForProduct() || getProductTotalStock(product);
  const currentVariantStock = getRealTimeStockForVariant() || (selectedVariant?.quantity || 0);

  const totalPrice = costPrice * quantity;

  // Get stock status
  const getStockStatus = () => {
    if (currentTotalStock === 0) return { status: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    if (currentTotalStock <= minimumStock) return { status: 'Below Min Stock', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    if (currentTotalStock <= 5) return { status: 'Low Stock', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { status: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  };

  const stockStatus = getStockStatus();

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleVariantSelect = (variant: ProductSearchVariant) => {
    setSelectedVariant(variant);
    // Use product-level costPrice or price, fallback to 70% of selling price
    const defaultCostPrice = product.costPrice || (product.price || 0) * 0.7;
    setCustomCostPrice(defaultCostPrice.toString());
  };

  const calculateExchangedPrice = (price: number): number => {
    if (safeSelectedCurrency.code === currency.code) return price;
    return price * exchangeRate;
  };

  const handleAddToCart = async () => {
    console.log('🛒 handleAddToCart called with:', {
      selectedVariant,
      customCostPrice,
      costPrice,
      quantity,
      minimumOrderQty,
      product: product.name
    });

    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    if (costPrice <= 0) {
      console.log('❌ Cost price validation failed:', { costPrice, customCostPrice });
      toast.error('Please enter a cost price above 0 in the "Cost Price (per unit)" field');
      return;
    }

    if (quantity < minimumOrderQty) {
      toast.error(`Minimum order quantity is ${minimumOrderQty} units`);
      return;
    }

    try {
      setIsSavingPrice(true);
      
      // Save the updated cost price to the database before adding to cart
      const finalCostPrice = safeSelectedCurrency.code !== currency.code ? calculateExchangedPrice(costPrice) : costPrice;
      
      console.log('💾 Saving updated cost price:', finalCostPrice);
      
      // Update the variant cost price in the database
      const updateResult = await dataProvider.updateProductVariantCostPrice(selectedVariant.id, finalCostPrice);

      if (updateResult.ok) {
        console.log('✅ Product cost price saved successfully');
        toast.success('Cost price updated and saved!');
        
        // Notify parent component about the updated product
        if (onProductUpdated) {
          const updatedProduct = {
            ...product,
            costPrice: finalCostPrice,
            minimumStock: minimumStock
          };
          onProductUpdated(updatedProduct);
        }
      } else {
        console.warn('⚠️ Failed to save cost price');
        // Continue anyway, don't block the add to cart
      }

      // Create modified variant with custom cost price
      const modifiedVariant = {
        ...selectedVariant,
        costPrice: finalCostPrice
      };

      console.log('🛒 Calling onAddToCart with:', { product: product.name, variant: modifiedVariant, quantity });
      onAddToCart(product, modifiedVariant, quantity);
      toast.success(`Added ${quantity}x ${product.name} to purchase order`);
      onClose();
      
    } catch (error) {
      console.error('❌ Error saving cost price:', error);
      toast.error('Failed to save cost price, but product will still be added to cart');
      
      // Fallback: add to cart without saving
      const modifiedVariant = {
        ...selectedVariant,
        costPrice: safeSelectedCurrency.code !== currency.code ? calculateExchangedPrice(costPrice) : costPrice
      };
      
      onAddToCart(product, modifiedVariant, quantity);
      toast.success(`Added ${quantity}x ${product.name} to purchase order`);
      onClose();
    } finally {
      setIsSavingPrice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <GlassCard className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Product Details</h2>
                <p className="text-sm text-gray-600">Review and customize before adding to purchase order</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Product Information */}
              <div className="space-y-6">
                
                {/* Product Images */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Product Images</h3>
                  {productImages.length > 0 ? (
                    <SimpleImageDisplay
                      images={productImages}
                      productName={product.name}
                      size="xl"
                      className="w-[392px] h-[392px] rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center border-2 border-dashed border-orange-300">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-orange-400 mx-auto mb-2" />
                        <p className="text-orange-600 font-medium">No images available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Specifications */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Specifications</h3>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
                    {/* Combined specifications display */}
                    {(() => {
                      const allSpecs: Array<{key: string, value: string, type: 'general' | 'attribute' | 'variant', isJson: boolean}> = [];
                      
                      // Add general specifications
                      if (product.specification) {
                        try {
                          const specs = JSON.parse(product.specification);
                          Object.entries(specs).forEach(([key, value]) => {
                            allSpecs.push({
                              key: key.replace(/_/g, ' '),
                              value: String(value),
                              type: 'general',
                              isJson: false
                            });
                          });
                        } catch {
                          allSpecs.push({
                            key: 'Specification',
                            value: product.specification,
                            type: 'general',
                            isJson: false
                          });
                        }
                      }
                      
                      // Add product attributes
                      if (product.attributes && Object.keys(product.attributes).length > 0) {
                        Object.entries(product.attributes).forEach(([key, value]) => {
                          allSpecs.push({
                            key: key.replace(/_/g, ' '),
                            value: String(value),
                            type: 'attribute',
                            isJson: false
                          });
                        });
                      }
                      
                      // Add variant specifications
                      if (selectedVariant?.attributes && Object.keys(selectedVariant.attributes).length > 0) {
                        Object.entries(selectedVariant.attributes).forEach(([key, value]) => {
                          let displayValue = String(value);
                          let isJson = false;
                          
                          try {
                            const parsed = JSON.parse(String(value));
                            if (typeof parsed === 'object' && parsed !== null) {
                              isJson = true;
                              displayValue = Object.entries(parsed)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(', ');
                            }
                          } catch {
                            // Not JSON, use as is
                          }
                          
                          allSpecs.push({
                            key: key.replace(/_/g, ' '),
                            value: displayValue,
                            type: 'variant',
                            isJson
                          });
                        });
                      }
                      
                      if (allSpecs.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No specifications available</p>
                            <p className="text-sm text-gray-400 mt-1">Product details will appear here</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          {allSpecs.map((spec, index) => (
                            <div key={index} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 capitalize">
                                  {spec.key}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {spec.value}
                                </div>
                              </div>
                              {spec.isJson && (
                                <div className="flex-shrink-0 ml-3">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-600">Product Name:</span>
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Hash className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-600">SKU:</span>
                        <div className="font-medium text-gray-900 font-mono">{product.sku}</div>
                      </div>
                    </div>

                    {product.barcode && (
                      <div className="flex items-center gap-3">
                        <QrCode className="w-5 h-5 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-600">QrCode:</span>
                          <div className="font-medium text-gray-900 font-mono">{product.barcode}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-600">Category:</span>
                        <div className="font-medium text-gray-900">{product.categoryName || 'Uncategorized'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Purchase Order Setup */}
              <div className="space-y-6">
                {/* Variant Selection */}
                {hasMultipleVariants && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Select Variant</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {product.variants?.map((variant) => (
                        <div
                          key={variant.id}
                          onClick={() => handleVariantSelect(variant)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedVariant?.id === variant.id
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-200 hover:bg-orange-25'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{variant.name}</div>
                              <div className="text-sm text-gray-600">SKU: {variant.sku}</div>
                              <div className="text-sm text-gray-600">
                                Stock: {isLoadingStock ? 'Loading...' : (variant.quantity || 0)}
                                {isLoadingStock && <span className="ml-1 text-orange-500">🔄</span>}
                                {!isLoadingStock && realTimeStock.has(product.id) && (
                                  <span className="ml-1 text-green-500" title="Real-time data">✓</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">
                                {formatMoney(product.costPrice || (product.price || 0) * 0.7, currency).replace(/\.00$/, '').replace(/\.0$/, '')}
                              </div>
                              {selectedVariant?.id === variant.id && (
                                <CheckCircle className="w-5 h-5 text-orange-600 mt-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Minimum Stock */}
                <div className="flex items-center justify-between bg-amber-50 rounded-lg border border-amber-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm font-medium text-amber-800">Min Stock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minimumStock}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setMinimumStock(Math.max(0, value));
                      }}
                      min="0"
                      placeholder="0"
                      className="w-16 text-center text-sm font-medium text-gray-800 border border-amber-200 rounded px-2 py-1 focus:border-amber-400 focus:outline-none bg-white"
                    />
                    <span className="text-xs text-amber-700">units</span>
                    {minimumStock > 0 && (
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Quantity Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg border border-gray-200 transition-colors"
                    >
                      <span className="text-lg font-bold">-</span>
                    </button>
                    
                    <div className="flex-1">
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setQuantity(Math.max(1, value));
                        }}
                        min="1"
                        className="w-full text-center text-xl font-bold text-gray-800 border-2 border-gray-200 rounded-lg py-2 px-4 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors"
                    >
                      <span className="text-lg font-bold">+</span>
                    </button>
                  </div>
                  
                  {/* Stock availability indicator */}
                  <div className="bg-white rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stockStatus.bg.replace('bg-', 'bg-')}`}></div>
                        <div>
                          <div className={`text-sm font-medium ${stockStatus.color}`}>
                            {stockStatus.status}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isLoadingStock ? 'Loading...' : `${currentTotalStock} units available`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLoadingStock && <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
                        {!isLoadingStock && realTimeStock.has(product.id) && (
                          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    {minimumStock > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Min stock: {minimumStock} units</span>
                          {currentTotalStock <= minimumStock && (
                            <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              Below minimum
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Price with Exchange Rate */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Cost Price (per unit)</label>
                  <div className="flex items-center gap-2 p-2 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-300 focus-within:border-orange-500 transition-all duration-200">
                    {/* Currency Selector */}
                    <div className="flex-shrink-0 flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                      <select
                        value={safeSelectedCurrency.code}
                        onChange={(e) => {
                          const newCurrency = SUPPORTED_CURRENCIES.find(c => c.code === e.target.value);
                          if (newCurrency) {
                            setSelectedCurrency(newCurrency);
                            // Recalculate exchange rate
                            if (newCurrency.code !== currency.code) {
                              const rate = getExchangeRate(newCurrency.code, currency.code);
                              setExchangeRate(rate);
                            }
                          }
                        }}
                        className="bg-transparent border-none text-gray-700 font-medium text-sm focus:outline-none focus:ring-0 cursor-pointer hover:text-orange-600 transition-colors pr-6"
                      >
                        {SUPPORTED_CURRENCIES.map(currencyOption => (
                          <option key={currencyOption.code} value={currencyOption.code}>
                            {currencyOption.flag} {currencyOption.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300"></div>
                    
                    {/* Price Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={customCostPrice ? formatNumberWithCommas(parseFloat(customCostPrice)) : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value === '' || parseFloat(value) >= 0) {
                            setCustomCostPrice(value);
                          }
                        }}
                        onFocus={(e) => {
                          if (customCostPrice && parseFloat(customCostPrice) > 0) {
                            (e.target as HTMLInputElement).select();
                          }
                        }}
                        onClick={(e) => {
                          if (customCostPrice && parseFloat(customCostPrice) > 0) {
                            (e.target as HTMLInputElement).select();
                          }
                        }}
                        placeholder={product.costPrice ? product.costPrice.toString() : "0"}
                        className="w-full border-0 focus:outline-none focus:ring-0 text-xl font-bold text-gray-800 placeholder-gray-400 bg-transparent"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    {/* Exchange Rate Display */}
                    <div className="flex-shrink-0">
                      {safeSelectedCurrency.code !== currency.code && customCostPrice && parseFloat(customCostPrice) > 0 && (
                        <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                          ≈ {formatMoney(calculateExchangedPrice(parseFloat(customCostPrice)), currency).replace(/\.00$/, '').replace(/\.0$/, '')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Exchange Rate Calculation */}
                  {safeSelectedCurrency.code !== currency.code && customCostPrice && parseFloat(customCostPrice) > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">
                          Price in {safeSelectedCurrency.code}: {formatMoney(costPrice, safeSelectedCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                        </span>
                        <ArrowUpDown className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700">
                          Converted to {currency.code}: {formatMoney(calculateExchangedPrice(costPrice), currency).replace(/\.00$/, '').replace(/\.0$/, '')}
                        </span>
                      </div>
                    </div>
                  )}

                  {product.costPrice && (
                    <div className="text-sm text-gray-600">
                      Suggested cost: {formatMoney(product.costPrice, safeSelectedCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}
                    </div>
                  )}
                </div>

                {/* Order Summary - Card Design */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border border-gray-200 p-5">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
                  </div>
                  
                  {/* Content grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Product section */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Product</span>
                        <span className="font-medium text-gray-900 text-right">{product.name}</span>
                      </div>
                      
                      {selectedVariant && selectedVariant.name !== 'Default' && (
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                          <span className="text-sm text-gray-500">Variant</span>
                          <span className="font-medium text-gray-800 text-right">{selectedVariant.name}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Quantity and cost row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                        <span className="text-xs text-gray-500 block mb-1">Quantity</span>
                        <span className="text-xl font-bold text-gray-900">{quantity}</span>
                      </div>
                      
                      {customCostPrice && parseFloat(customCostPrice) > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                          <span className="text-xs text-gray-500 block mb-1">Unit Cost</span>
                          <span className="text-lg font-bold text-gray-900">{formatMoney(costPrice, safeSelectedCurrency).replace(/\.00$/, '').replace(/\.0$/, '')}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Exchange rate info */}
                    {safeSelectedCurrency.code !== currency.code && customCostPrice && parseFloat(customCostPrice) > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-800">Exchange Rate</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          1 {safeSelectedCurrency.code} = {exchangeRate.toFixed(4)} {currency.code}
                        </div>
                      </div>
                    )}
                    
                    {/* Total cost */}
                    {customCostPrice && costPrice > 0 && (
                      <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-4 border-2 border-orange-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-gray-700 block">Total Cost</span>
                            <span className="text-xs text-gray-500">({currency.code})</span>
                          </div>
                          <span className="text-2xl font-bold text-orange-600">
                            {formatMoney(safeSelectedCurrency.code !== currency.code ? calculateExchangedPrice(totalPrice) : totalPrice, currency).replace(/\.00$/, '').replace(/\.0$/, '')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 mt-6 px-6 pb-6">
            <GlassButton
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || costPrice <= 0 || isSavingPrice}
              className="w-full py-4 bg-orange-600 text-white hover:bg-orange-700 text-lg font-semibold"
              icon={isSavingPrice ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <ShoppingCart size={20} />
              )}
            >
              {isSavingPrice ? 'Saving Price...' : 'Add to Purchase Order'}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProductDetailModal;
