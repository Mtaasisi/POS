// ProductDetailModal component - Shows full product details for purchase orders with editing capabilities
import React, { useState, useEffect } from 'react';
import { 
  X, Package, Tag, Hash, DollarSign, Plus, Minus, ShoppingCart, 
  AlertTriangle, Star, Truck, Building, Info, 
  CheckCircle, Camera, Barcode, TrendingUp, Users, ArrowUpDown,
  Clock, Phone, Mail, MapPin, CreditCard, Calculator, Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassBadge from '../../shared/components/ui/GlassBadge';
import { SimpleImageDisplay } from '../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../lib/robustImageService';
import { formatMoney, Currency, SUPPORTED_CURRENCIES, PAYMENT_TERMS } from '../lib/utils';
import { ProductSearchResult, ProductSearchVariant } from '../../types/pos';
import { 
  getPrimaryVariant, 
  getProductTotalStock,
  isMultiVariantProduct 
} from '../../lib/productUtils';
import { RealTimeStockService } from '../../lib/realTimeStock';

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  currency?: string;
  isActive: boolean;
  preferredCostPrice?: number;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductSearchResult;
  currency: Currency;
  suppliers: Supplier[];
  selectedSupplier?: Supplier | null;
  onAddToCart: (product: ProductSearchResult, variant: ProductSearchVariant, quantity: number) => void;
  onSupplierChange?: (supplier: Supplier | null) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  currency,
  suppliers,
  selectedSupplier,
  onAddToCart,
  onSupplierChange
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductSearchVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customCostPrice, setCustomCostPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [selectedSupplierLocal, setSelectedSupplierLocal] = useState<Supplier | null>(selectedSupplier || null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [minimumOrderQty, setMinimumOrderQty] = useState<number>(1);
  
  // Real-time stock state
  const [realTimeStock, setRealTimeStock] = useState<Map<string, number>>(new Map());
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [lastStockUpdate, setLastStockUpdate] = useState<Date | null>(null);

  // Initialize with primary variant and supplier data
  useEffect(() => {
    if (product && !selectedVariant) {
      const primary = getPrimaryVariant(product);
      if (primary) {
        setSelectedVariant(primary);
        setCustomCostPrice((primary.costPrice || product.price * 0.7).toString());
      }
    }
    
    // Set supplier-specific data
    if (selectedSupplierLocal) {
      if (selectedSupplierLocal.currency) {
        const supplierCurrency = SUPPORTED_CURRENCIES.find(c => c.code === selectedSupplierLocal.currency);
        if (supplierCurrency) {
          setSelectedCurrency(supplierCurrency);
          // Calculate exchange rate (simplified - in real app, fetch from API)
          if (supplierCurrency.code !== currency.code) {
            const rate = getExchangeRate(supplierCurrency.code, currency.code);
            setExchangeRate(rate);
          }
        }
      }
    }
  }, [product, selectedVariant, selectedSupplierLocal, currency]);

  // Fetch real-time stock when modal opens (with debouncing)
  useEffect(() => {
    if (isOpen && product?.id) {
      // Add a small delay to prevent multiple rapid requests
      const timer = setTimeout(() => {
        fetchRealTimeStock();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, product?.id]);

  // Simplified exchange rate calculation (in real app, use live rates)
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

  if (!isOpen || !product) return null;

  // Convert product images to new format
  const convertToProductImages = (): ProductImage[] => {
    if (!product.images || product.images.length === 0) {
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
  };

  const productImages = convertToProductImages();
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
    if (currentTotalStock <= 5) return { status: 'Low Stock', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { status: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  };

  const stockStatus = getStockStatus();

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleVariantSelect = (variant: ProductSearchVariant) => {
    setSelectedVariant(variant);
    setCustomCostPrice((variant.costPrice || product.price * 0.7).toString());
  };

  const handleSupplierSelect = (supplier: Supplier | null) => {
    setSelectedSupplierLocal(supplier);
    if (onSupplierChange) {
      onSupplierChange(supplier);
    }
    
    if (supplier) {
      // Update cost price if supplier has preferred pricing
      if (supplier.preferredCostPrice) {
        setCustomCostPrice(supplier.preferredCostPrice.toString());
      }
      
      // Update currency if supplier has preferred currency
      if (supplier.currency) {
        const supplierCurrency = SUPPORTED_CURRENCIES.find(c => c.code === supplier.currency);
        if (supplierCurrency) {
          setSelectedCurrency(supplierCurrency);
        }
      }
    }
  };

  const calculateExchangedPrice = (price: number): number => {
    if (selectedCurrency.code === currency.code) return price;
    return price * exchangeRate;
  };



  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    if (costPrice <= 0) {
      toast.error('Please enter a valid cost price');
      return;
    }

    if (!selectedSupplierLocal) {
      toast.error('Please select a supplier for this product');
      return;
    }

    if (quantity < minimumOrderQty) {
      toast.error(`Minimum order quantity is ${minimumOrderQty} units`);
      return;
    }

    // Create modified variant with custom cost price and supplier info
    const modifiedVariant = {
      ...selectedVariant,
      costPrice: selectedCurrency.code !== currency.code ? calculateExchangedPrice(costPrice) : costPrice,
      supplierInfo: {
        supplierId: selectedSupplierLocal.id,
        supplierName: selectedSupplierLocal.name,
        originalCostPrice: costPrice,
        originalCurrency: selectedCurrency.code,
        exchangeRate: exchangeRate,

        paymentTerms: selectedSupplierLocal.paymentTerms,
        notes: notes
      }
    };

    onAddToCart(product, modifiedVariant, quantity);
    toast.success(`Added ${quantity}x ${product.name} from ${selectedSupplierLocal.name} to purchase order`);
    onClose();
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
                      className="w-full h-64 rounded-xl"
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
                        <Barcode className="w-5 h-5 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-600">Barcode:</span>
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

                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-500" />
                      
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Stock Information</h3>
                  <div className={`p-4 rounded-lg ${stockStatus.bg} ${stockStatus.border} border-2`}>
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className={`w-5 h-5 ${stockStatus.color}`} />
                      <div>
                        <div className={`font-medium ${stockStatus.color}`}>{stockStatus.status}</div>
                                                    <div className="text-sm text-gray-600">
                              Current total stock: {isLoadingStock ? 'Loading...' : `${currentTotalStock} units`}
                              {isLoadingStock && <span className="ml-1 text-orange-500">🔄</span>}
                              {!isLoadingStock && realTimeStock.has(product.id) && (
                                <span className="ml-1 text-green-500" title="Real-time data">✓</span>
                              )}
                            </div>
                            {lastStockUpdate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Last updated: {lastStockUpdate.toLocaleTimeString()}
                              </div>
                            )}
                      </div>
                    </div>
                    
                    {totalStock === 0 && (
                      <div className="mt-2 p-3 bg-red-100 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">
                            This product is out of stock and needs to be restocked
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Purchase Order Setup */}
              <div className="space-y-6">

                {/* Supplier Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Supplier Selection</h3>
                  <div className="space-y-3">
                    {selectedSupplierLocal ? (
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {selectedSupplierLocal.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{selectedSupplierLocal.name}</div>
                              <div className="text-sm text-gray-600">{selectedSupplierLocal.company_name}</div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                {selectedSupplierLocal.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {selectedSupplierLocal.phone}
                                  </div>
                                )}

                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSupplierSelect(null)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <select
                          value={selectedSupplierLocal?.id || ''}
                          onChange={(e) => {
                            const supplier = suppliers.find(s => s.id === e.target.value) || null;
                            handleSupplierSelect(supplier);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select supplier for this product</option>
                          {suppliers.filter(s => s.isActive).map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name} ({supplier.country || 'Unknown'}) - {supplier.currency || 'KES'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Currency & Exchange Rate */}
                {selectedSupplierLocal && selectedCurrency.code !== currency.code && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Currency Exchange</h3>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-800">Exchange Rate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="w-4 h-4 text-blue-600" />
                          <Calculator className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>From ({selectedCurrency.code}):</span>
                          <span className="font-mono">1.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>To ({currency.code}):</span>
                          <span className="font-mono">{exchangeRate.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                
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
                                {formatMoney(variant.costPrice || product.price * 0.7, currency)}
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

                {/* Purchase Order Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Purchase Order Setup</h3>
                  
                  {/* Quantity Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Order Quantity</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center border-2 border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-4 h-4 text-orange-600" />
                        </button>
                        <span className="w-16 text-center font-bold text-xl text-gray-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          className="w-10 h-10 flex items-center justify-center border-2 border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-orange-600" />
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cost Price with Exchange Rate */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Cost Price (per unit)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customCostPrice}
                        onChange={(e) => setCustomCostPrice(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm">{selectedCurrency.symbol}</span>
                      </div>
                    </div>
                    
                    {/* Exchange Rate Calculation */}
                    {selectedCurrency.code !== currency.code && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700">
                            Price in {selectedCurrency.code}: {formatMoney(costPrice, selectedCurrency)}
                          </span>
                          <ArrowUpDown className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-700">
                            Converted to {currency.code}: {formatMoney(calculateExchangedPrice(costPrice), currency)}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedVariant?.costPrice && (
                      <div className="text-sm text-gray-600">
                        Suggested cost: {formatMoney(selectedVariant.costPrice, selectedCurrency)}
                      </div>
                    )}
                  </div>

                  {/* Minimum Order Quantity */}
                  {selectedSupplierLocal && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Order Requirements</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Minimum Order</label>
                          <input
                            type="number"
                            value={minimumOrderQty}
                            onChange={(e) => setMinimumOrderQty(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Payment Terms</label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700">
                            {selectedSupplierLocal.paymentTerms || 'Net 30'}
                          </div>
                        </div>
                      </div>
                      
                      {quantity < minimumOrderQty && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-amber-700">
                              Minimum order quantity is {minimumOrderQty} units
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any notes about this order item..."
                    />
                  </div>
                </div>

                {/* Enhanced Order Summary */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Complete Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                    {selectedVariant && selectedVariant.name !== 'Default' && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Variant:</span>
                        <span className="font-medium text-gray-900">{selectedVariant.name}</span>
                      </div>
                    )}
                    {selectedSupplierLocal && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium text-gray-900">{selectedSupplierLocal.name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Order Quantity:</span>
                      <span className="font-medium text-gray-900">{quantity} units</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Unit Cost ({selectedCurrency.code}):</span>
                      <span className="font-medium text-gray-900">{formatMoney(costPrice, selectedCurrency)}</span>
                    </div>
                    
                    {/* Exchange Rate Info */}
                    {selectedCurrency.code !== currency.code && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700">Exchange Rate:</span>
                          <span className="font-mono text-blue-700">1 {selectedCurrency.code} = {exchangeRate.toFixed(4)} {currency.code}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-blue-700">Converted Unit Cost:</span>
                          <span className="font-medium text-blue-700">{formatMoney(calculateExchangedPrice(costPrice), currency)}</span>
                        </div>
                      </div>
                    )}



                    {/* Payment Terms */}
                    {selectedSupplierLocal && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Payment Terms:</span>
                        <span className="font-medium text-gray-900">{selectedSupplierLocal.paymentTerms || 'Net 30'}</span>
                      </div>
                    )}

                    <div className="border-t border-orange-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">Total Cost ({currency.code}):</span>
                        <span className="text-xl font-bold text-orange-600">
                          {formatMoney(selectedCurrency.code !== currency.code ? calculateExchangedPrice(totalPrice) : totalPrice, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Stock Warning */}
                {selectedVariant && (
                  <div className={`p-4 rounded-lg ${stockStatus.bg} ${stockStatus.border} border-2`}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-5 h-5 ${stockStatus.color}`} />
                      <div>
                        <div className={`font-medium ${stockStatus.color}`}>
                          Current Stock: {isLoadingStock ? 'Loading...' : `${currentVariantStock} units`}
                          {isLoadingStock && <span className="ml-1 text-orange-500">🔄</span>}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isLoadingStock 
                            ? 'Fetching latest stock data...'
                            : currentVariantStock === 0 
                            ? 'This variant is completely out of stock'
                            : currentVariantStock <= 5
                            ? 'Low stock - consider ordering more'
                            : 'Stock levels are adequate'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
              <GlassButton
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </GlassButton>
              
              <GlassButton
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedVariant || costPrice <= 0}
                className="bg-orange-600 text-white hover:bg-orange-700"
                icon={<ShoppingCart size={18} />}
              >
                Add to Purchase Order
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProductDetailModal;
