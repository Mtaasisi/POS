// Create Purchase Order Page - Uses POS-like UI pattern
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';

import {
  Search, Barcode, Plus, CheckCircle, XCircle, RefreshCw, 
  User, Phone, Command, Truck, Coins, ShoppingBag, Package
} from 'lucide-react';

import { useInventoryStore } from '../../lats/stores/useInventoryStore';
import { usePurchaseOrderStore } from '../stores/usePurchaseOrderStore';

// Import components from copied modules
import VariantProductCard from '../../lats/components/pos/VariantProductCard';
import SupplierSelectionModal from '../components/SupplierSelectionModal';
import CurrencySelector from '../components/CurrencySelector';
import AddSupplierModal from '../components/AddSupplierModal';
import PurchaseCartItem from '../components/PurchaseCartItem';
import ProductDetailModal from '../components/ProductDetailModal';

import { toast } from 'react-hot-toast';
import { 
  SUPPORTED_CURRENCIES, 
  PAYMENT_TERMS, 
  formatMoney,
  generatePONumber,
  validatePurchaseOrder
} from '../lib/utils';

// Performance optimization constants
const SEARCH_DEBOUNCE_MS = 300;

// Performance optimization hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CreatePurchaseOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Database state management
  const { 
    products: dbProducts,
    categories,
    suppliers,
    loadProducts,
    loadCategories,
    loadSuppliers
  } = useInventoryStore();

  // Purchase Order Store
  const {
    cartItems,
    selectedSupplier,
    selectedCurrency,
    expectedDelivery,
    paymentTerms,
    notes,
    isCreating,
    addToCart,
    updateCartItemQuantity,
    updateCartItemCostPrice,
    removeFromCart,
    clearCart,
    setSupplier,
    createPurchaseOrder,
    getCartTotal
  } = usePurchaseOrderStore();

  // Local search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Enhanced search and filtering state  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent'>('name');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Modal states
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<any>(null);

  // Use database products and transform them
  const products = useMemo(() => {
    return dbProducts.map(product => ({
      ...product,
      categoryName: categories?.find(c => c.id === product.categoryId)?.name || 'Unknown Category',
      images: product.images || [],
      variants: product.variants?.map(variant => ({
        ...variant,
        id: variant.id || `variant-${Date.now()}`,
        sellingPrice: variant.price || product.price || 0,
        quantity: variant.stockQuantity || 0
      })) || []
    }));
  }, [dbProducts, categories]);

  // Load data from database on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🛒 Purchase Order: Loading data from database...');
        await Promise.all([
          loadProducts({ page: 1, limit: 100 }),
          loadCategories(),
          loadSuppliers()
        ]);
        console.log('📊 Purchase Order: Data loaded successfully');
      } catch (error) {
        console.error('Error loading data for Purchase Order:', error);
      }
    };
    
    loadData();
  }, [loadProducts, loadCategories, loadSuppliers]);

  // Optimized filtered products
  const filteredProducts = useMemo(() => {
    if (showSearchResults && searchResults.length > 0) {
      return searchResults;
    }
    
    let filtered = products;
    
    // Basic search filter
    if (debouncedSearchQuery.trim() && !showSearchResults) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const category = categories?.find(c => c.id === product.categoryId)?.name || '';
        
        return (product.name?.toLowerCase() || '').includes(query) ||
               (mainVariant?.sku?.toLowerCase() || '').includes(query) ||
               (category.toLowerCase() || '').includes(query);
      });
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'price':
          aValue = a.variants?.[0]?.costPrice || a.price || 0;
          bValue = b.variants?.[0]?.costPrice || b.price || 0;
          break;
        case 'stock':
          aValue = a.variants?.[0]?.stockQuantity || 0;
          bValue = b.variants?.[0]?.stockQuantity || 0;
          break;
        case 'recent':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        default:
          return 0;
      }
      
      return aValue > bValue ? 1 : -1;
    });
    
    return filtered;
  }, [products, categories, debouncedSearchQuery, selectedCategory, sortBy, showSearchResults, searchResults]);

  // Handle supplier selection
  const handleSupplierSelect = useCallback((supplier: any) => {
    setSupplier(supplier);
    setShowSupplierSearch(false);
  }, [setSupplier]);

  // Handle supplier creation
  const handleSupplierCreated = useCallback((newSupplier: any) => {
    setSupplier(newSupplier);
    loadSuppliers();
  }, [setSupplier, loadSuppliers]);

  // Handle product detail view
  const handleViewProductDetails = useCallback((product: any) => {
    setSelectedProductForModal(product);
    setShowProductDetailModal(true);
  }, []);

  // Handle search input changes
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      setShowSearchResults(true);
      const filtered = products.filter(product => {
        const mainVariant = product.variants?.[0];
        const category = categories?.find(c => c.id === product.categoryId)?.name || '';
        
        return (product.name?.toLowerCase() || '').includes(value.toLowerCase()) ||
               (mainVariant?.sku?.toLowerCase() || '').includes(value.toLowerCase()) ||
               (category.toLowerCase() || '').includes(value.toLowerCase());
      });
      setSearchResults(filtered);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  }, [products, categories]);

  // Handle creating purchase order
  const handleCreatePurchaseOrder = useCallback(async () => {
    const validation = validatePurchaseOrder(selectedSupplier, cartItems, expectedDelivery, paymentTerms);
    
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    try {
      const orderNumber = generatePONumber();
      
      const purchaseOrderData = {
        orderNumber,
        supplierId: selectedSupplier!.id,
        currency: selectedCurrency.code,
        expectedDelivery,
        paymentTerms,
        notes,
        status: 'draft',
        items: cartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          costPrice: item.costPrice,
          notes: ''
        }))
      };

      const result = await createPurchaseOrder(purchaseOrderData);
      
      if (result.ok) {
        toast.success(`Purchase Order ${orderNumber} created successfully!`);
        navigate(`/purchase-orders/${result.data?.id || ''}`);
      } else {
        toast.error(result.message || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Error creating purchase order. Please try again.');
    }
  }, [selectedSupplier, cartItems, expectedDelivery, paymentTerms, notes, selectedCurrency, createPurchaseOrder, navigate]);

  // Calculate totals
  const { subtotal, tax, total } = getCartTotal();

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate('/purchase-orders')} />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Create Purchase Order</h1>
                  <p className="text-sm text-gray-600">Add products and select supplier</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {cartItems.length} items • {formatMoney(total, selectedCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 pb-20 max-w-full mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Product Search Section - Following POS UI Pattern */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <GlassCard className="p-6 h-full flex flex-col">
              {/* Fixed Search Section */}
              <div className="flex-shrink-0 mb-6 space-y-4">
                {/* Product Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-orange-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products to add to purchase order..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-full pl-14 pr-24 py-5 text-lg border-2 border-orange-200 rounded-xl bg-white text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/30 focus:border-orange-500 shadow-lg hover:shadow-xl transition-all duration-200"
                    style={{ minHeight: '60px' }}
                  />
                  
                  {/* Barcode indicator */}
                  {searchQuery.trim() && searchQuery.length >= 8 && /^[A-Za-z0-9]+$/.test(searchQuery) && (
                    <div className="absolute left-14 top-1/2 transform -translate-y-1/2">
                      <Barcode className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                  
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
                      title="Advanced filters"
                    >
                      <Command className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">All Categories</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort By */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="name">Name</option>
                          <option value="price">Price</option>
                          <option value="stock">Stock</option>
                          <option value="recent">Recent</option>
                        </select>
                      </div>

                      {/* Clear Filters */}
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            setSelectedCategory('');
                            setSortBy('name');
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                          className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Products Grid - Following POS Pattern */}
              <div className="flex-1 overflow-y-auto">
                {showSearchResults ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-700">
                        Search Results ({filteredProducts.length})
                      </h3>
                      <button
                        onClick={() => setShowSearchResults(false)}
                        className="text-sm text-orange-600 hover:text-orange-800"
                      >
                        Show All Products
                      </button>
                    </div>
                    
                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map((product) => (
                          <VariantProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                            onViewDetails={handleViewProductDetails}
                            primaryColor="orange"
                            actionText="Add to Order"
                            allowOutOfStockSelection={true}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-4">No products found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-700">Available Products</h3>
                      <span className="text-sm text-gray-500">{products.length} products</span>
                    </div>
                    {products.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.slice(0, 12).map((product) => (
                          <VariantProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                            onViewDetails={handleViewProductDetails}
                            primaryColor="orange"
                            actionText="Add to Order"
                            allowOutOfStockSelection={true}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
                        <p className="text-gray-600 mb-4">No products found in the database</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Purchase Cart Section - Following POS Pattern */}
          <div className="lg:w-[450px] flex-shrink-0">
            <GlassCard className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Purchase Cart</h2>
                  <p className="text-sm text-gray-600">{cartItems.length} items to purchase</p>
                </div>
              </div>

              {/* Supplier Selection */}
              <div className="mb-6">
                {selectedSupplier ? (
                  <div className="p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-xl border-2 border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {selectedSupplier.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{selectedSupplier.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {selectedSupplier.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSupplier(null)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSupplierSearch(true)}
                    className="w-full flex items-center justify-center gap-3 p-4 text-base border-2 border-orange-200 rounded-xl bg-white text-gray-900 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
                  >
                    <Search className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-600">Select Supplier</span>
                    <Plus className="w-4 h-4 text-orange-500" />
                  </button>
                )}
              </div>

              {/* Currency & Settings */}
              {selectedSupplier && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <CurrencySelector
                        selectedCurrency={selectedCurrency}
                        onCurrencyChange={(currency) => usePurchaseOrderStore.setState({ selectedCurrency: currency })}
                        currencies={SUPPORTED_CURRENCIES}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => usePurchaseOrderStore.setState({ paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      >
                        {PAYMENT_TERMS.map(term => (
                          <option key={term.id} value={term.id}>
                            {term.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cart is empty</h3>
                    <p className="text-gray-600 mb-4">Add products to create a purchase order</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {[...cartItems].reverse().map((item, index) => (
                      <PurchaseCartItem
                        key={item.id}
                        item={item}
                        index={index}
                        currency={selectedCurrency}
                        isLatest={index === 0}
                        onUpdateQuantity={updateCartItemQuantity}
                        onUpdateCostPrice={updateCartItemCostPrice}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase Order Summary */}
              {cartItems.length > 0 && (
                <>
                  {/* Expected Delivery Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => usePurchaseOrderStore.setState({ expectedDelivery: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl p-4 border border-gray-200 shadow-sm flex-shrink-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatMoney(subtotal, selectedCurrency)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tax (18%)</span>
                        <span className="font-semibold text-gray-900">{formatMoney(tax, selectedCurrency)}</span>
                      </div>
                      
                      <div className="border-t-2 border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Total Amount</span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatMoney(total, selectedCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-3 flex-shrink-0">
                    <GlassButton
                      onClick={handleCreatePurchaseOrder}
                      icon={isCreating ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                      className="w-full h-16 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-lg font-bold"
                      disabled={!selectedSupplier || cartItems.length === 0 || !expectedDelivery || isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Create Purchase Order'}
                    </GlassButton>
                    
                    <GlassButton
                      onClick={clearCart}
                      icon={<XCircle size={18} />}
                      className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                      disabled={cartItems.length === 0}
                    >
                      Clear Cart
                    </GlassButton>
                  </div>
                </>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSupplierSearch && (
        <SupplierSelectionModal
          isOpen={showSupplierSearch}
          onClose={() => setShowSupplierSearch(false)}
          onSupplierSelect={handleSupplierSelect}
          suppliers={suppliers}
        />
      )}

      {showAddSupplierModal && (
        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={() => setShowAddSupplierModal(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      )}

      {showProductDetailModal && selectedProductForModal && (
        <ProductDetailModal
          isOpen={showProductDetailModal}
          onClose={() => {
            setShowProductDetailModal(false);
            setSelectedProductForModal(null);
          }}
          product={selectedProductForModal}
          currency={selectedCurrency}
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          onAddToCart={addToCart}
          onSupplierChange={setSupplier}
        />
      )}
    </div>
  );
};

export default CreatePurchaseOrderPage;