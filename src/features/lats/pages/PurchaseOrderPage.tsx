// PurchaseOrderPage component for LATS module - Interactive Purchase Order Creation
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';

import POTopBar from '../components/purchase-order/POTopBar';
import {
  Search, Barcode, Plus, CheckCircle, XCircle, RefreshCw, 
  User, Phone, Command, Truck, Coins, ShoppingBag
} from 'lucide-react';

import { useInventoryStore } from '../stores/useInventoryStore';

// Import purchase order specific components
import VariantProductCard from '../components/pos/VariantProductCard';
import SupplierSelectionModal from '../components/purchase-order/SupplierSelectionModal';
import PurchaseOrderDraftModal from '../components/purchase-order/PurchaseOrderDraftModal';
import CurrencySelector from '../components/purchase-order/CurrencySelector';
import AddSupplierModal from '../components/purchase-order/AddSupplierModal';
import PurchaseCartItem from '../components/purchase-order/PurchaseCartItem';
import ProductDetailModal from '../components/purchase-order/ProductDetailModal';

import { toast } from 'react-hot-toast';
import { 
  SUPPORTED_CURRENCIES, 
  PAYMENT_TERMS, 
  PurchaseOrderStatus,
  formatMoney,
  generatePONumber,
  validatePurchaseOrder
} from '../lib/purchaseOrderUtils';

// Performance optimization constants
const SEARCH_DEBOUNCE_MS = 300;

interface PurchaseCartItemType {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  sku: string;
  costPrice: number;
  quantity: number;
  totalPrice: number;
  currentStock?: number;
  category?: string;
  images?: string[];
}

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
}

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

const PurchaseOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Database state management
  const { 
    products: dbProducts,
    categories,
    suppliers,
    loadProducts,
    loadCategories,
    loadSuppliers,
    createPurchaseOrder
  } = useInventoryStore();

  // Debounced search for better performance
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
  
  // Ref for search input to enable keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Enhanced search and filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent' | 'supplier'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Use database products and transform them
  const products = useMemo(() => {
    return dbProducts.map(product => ({
      ...product,
      categoryName: categories?.find(c => c.id === product.categoryId)?.name || 'Unknown Category',
      images: product.images || [],
      tags: [],
      variants: product.variants?.map(variant => ({
        ...variant,
        id: variant.id || `variant-${Date.now()}`,
        sellingPrice: variant.price || product.price || 0,
        quantity: variant.stockQuantity || 0
      })) || []
    }));
  }, [dbProducts, categories]);

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
    
    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const price = mainVariant?.costPrice || 0;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }
    
    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const stock = mainVariant?.stockQuantity || 0;
        
        switch (stockFilter) {
          case 'in-stock':
            return stock > 10;
          case 'low-stock':
            return stock > 0 && stock <= 10;
          case 'out-of-stock':
            return stock === 0;
          default:
            return true;
        }
      });
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
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [products, categories, debouncedSearchQuery, selectedCategory, priceRange, stockFilter, sortBy, sortOrder, showSearchResults, searchResults]);

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

  // Local state for purchase order
  const [purchaseCartItems, setPurchaseCartItems] = useState<PurchaseCartItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(SUPPORTED_CURRENCIES[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS[1].id);
  const [purchaseOrderNotes, setPurchaseOrderNotes] = useState('');
  const [purchaseOrderStatus, setPurchaseOrderStatus] = useState<PurchaseOrderStatus>('draft');

  // Modal states
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<any>(null);
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  
  // Cart item expansion state (similar to POS page)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Computed values for purchase order
  const subtotal = purchaseCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.18;
  const tax = subtotal * taxRate;
  const discount = 0;
  const totalAmount = subtotal + tax - discount;

  // Handle adding product to purchase cart
  const handleAddToPurchaseCart = useCallback((product: any, variant?: any, quantity: number = 1) => {
    const selectedVariant = variant || product.variants?.[0];
    if (!selectedVariant) {
      alert('Product has no variants available');
      return;
    }

    const costPrice = selectedVariant.costPrice || product.price * 0.7;
    const sku = selectedVariant.sku || 'N/A';
    const currentStock = selectedVariant.stockQuantity || 0;
    
    setPurchaseCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.productId === product.id && item.variantId === selectedVariant.id
      );
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === existingItem.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * costPrice
              }
            : item
        );
      } else {
        const newItem: PurchaseCartItem = {
          id: `${product.id}-${selectedVariant.id}-${Date.now()}`,
          productId: product.id,
          variantId: selectedVariant.id,
          name: product.name,
          variantName: selectedVariant.name,
          sku: sku,
          costPrice: costPrice,
          quantity: quantity,
          totalPrice: costPrice * quantity,
          currentStock: currentStock,
          category: product.categoryName,
  
          images: product.images || []
        };
        return [...prevItems, newItem];
      }
    });
    
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  // Handle updating cart item quantity
  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setPurchaseCartItems(prev => prev.filter(item => item.id !== itemId));
      return;
    }
    
    setPurchaseCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.costPrice
          };
        }
        return item;
      })
    );
  }, []);

  // Handle removing item from cart
  const handleRemoveFromCart = useCallback((itemId: string) => {
    setPurchaseCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Handle updating item cost price
  const handleUpdateCostPrice = useCallback((itemId: string, newCostPrice: number) => {
    setPurchaseCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            costPrice: newCostPrice,
            totalPrice: item.quantity * newCostPrice
          };
        }
        return item;
      })
    );
  }, []);

  // Handle clear cart
  const handleClearCart = useCallback(() => {
    if (purchaseCartItems.length > 0 && confirm('Are you sure you want to clear the purchase cart?')) {
      setPurchaseCartItems([]);
    }
  }, [purchaseCartItems.length]);

  // Handle supplier selection
  const handleSupplierSelect = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    if (supplier.currency) {
      const supplierCurrency = SUPPORTED_CURRENCIES.find(c => c.code === supplier.currency);
      if (supplierCurrency) {
        setSelectedCurrency(supplierCurrency);
      }
    }
    if (supplier.paymentTerms) {
      setPaymentTerms(supplier.paymentTerms);
    }
    setShowSupplierSearch(false);
  }, []);

  // Handle supplier creation
  const handleSupplierCreated = useCallback((newSupplier: any) => {
    // Auto-select the newly created supplier
    setSelectedSupplier(newSupplier);
    if (newSupplier.currency) {
      const supplierCurrency = SUPPORTED_CURRENCIES.find(c => c.code === newSupplier.currency);
      if (supplierCurrency) {
        setSelectedCurrency(supplierCurrency);
      }
    }
    if (newSupplier.paymentTerms) {
      setPaymentTerms(newSupplier.paymentTerms);
    }
    // Reload suppliers list to include the new one
    loadSuppliers();
  }, [loadSuppliers]);

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

  // Handle search input key press
  const handleSearchInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
    }
  }, [searchQuery]);

  // Handle global keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      handleClearCart();
    }
  }, [handleClearCart]);

  // Add global keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  // Handle creating purchase order
  const handleCreatePurchaseOrder = useCallback(async () => {
    const validation = validatePurchaseOrder(selectedSupplier, purchaseCartItems, expectedDelivery, paymentTerms);
    
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    setIsCreatingPO(true);
    
    try {
      const orderNumber = generatePONumber();
      
      const purchaseOrderData = {
        orderNumber,
        supplierId: selectedSupplier!.id,
        currency: selectedCurrency.code,
        expectedDelivery,
        paymentTerms,
        notes: purchaseOrderNotes,
        status: purchaseOrderStatus,
        items: purchaseCartItems.map(item => ({
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
        
        setPurchaseCartItems([]);
        setSelectedSupplier(null);
        setExpectedDelivery('');
        setPurchaseOrderNotes('');
        setPurchaseOrderStatus('draft');
        
        navigate(`/lats/purchase-orders/${result.data?.id || ''}`);
      } else {
        toast.error(result.message || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Error creating purchase order. Please try again.');
    } finally {
      setIsCreatingPO(false);
    }
  }, [selectedSupplier, purchaseCartItems, expectedDelivery, paymentTerms, purchaseOrderNotes, purchaseOrderStatus, selectedCurrency, createPurchaseOrder, navigate]);

  // Format money helper
  const formatMoneyDisplay = (amount: number) => formatMoney(amount, selectedCurrency);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Purchase Order Top Bar */}
      <POTopBar
        cartItemsCount={purchaseCartItems.length}
        totalAmount={totalAmount}
        currency={selectedCurrency}
        productsCount={products.length}
        suppliersCount={suppliers.length}
        onCreatePurchaseOrder={handleCreatePurchaseOrder}
        onClearCart={handleClearCart}
        onAddSupplier={() => setShowAddSupplierModal(true)}
        onAddProduct={() => navigate('/lats/add-product')}
        onViewPurchaseOrders={() => navigate('/lats/purchase-orders')}
        isCreatingPO={isCreatingPO}
        hasSelectedSupplier={!!selectedSupplier}
      />

      <div className="p-4 sm:p-6 pb-20 max-w-full mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Product Search Section */}
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
                    placeholder="Search products to add to purchase order... (Ctrl+F focus)"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchInputKeyPress}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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



                      {/* Stock Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                        <select
                          value={stockFilter}
                          onChange={(e) => setStockFilter(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="all">All Items</option>
                          <option value="in-stock">In Stock</option>
                          <option value="low-stock">Low Stock</option>
                          <option value="out-of-stock">Out of Stock</option>
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
                    </div>

                    {/* Clear Filters Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setPriceRange({ min: '', max: '' });
                          setStockFilter('all');
                          setSortBy('name');
                          setSortOrder('asc');
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Products Section */}
              <div className="flex-1 overflow-y-auto">
                {/* Search Results */}
                {showSearchResults && (
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
                            onAddToCart={handleAddToPurchaseCart}
                            onViewDetails={handleViewProductDetails}
                            primaryColor="orange"
                            actionText="View Details"
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
                )}

                {/* All Products Grid */}
                {!showSearchResults && (
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
                            onAddToCart={handleAddToPurchaseCart}
                            onViewDetails={handleViewProductDetails}
                            primaryColor="orange"
                            actionText="View Details"
                            allowOutOfStockSelection={true}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-2">📦</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
                        <p className="text-gray-600 mb-4">No products found in the database</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Purchase Cart Section */}
          <div className="lg:w-[450px] flex-shrink-0">
            <GlassCard className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Purchase Cart</h2>
                  <p className="text-sm text-gray-600">{purchaseCartItems.length} items to purchase</p>
                </div>
              </div>

              {/* Supplier Selection Section */}
              <div className="mb-6">
                {selectedSupplier ? (
                  <div className="p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-xl border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {selectedSupplier.name.charAt(0)}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-gradient-to-r from-green-400 to-emerald-500">
                            <Truck className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{selectedSupplier.name}</div>
                          {selectedSupplier.contactPerson && (
                            <div className="text-sm text-gray-600">{selectedSupplier.contactPerson}</div>
                          )}
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {selectedSupplier.phone || 'No phone'}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200">
                              {selectedSupplier.country || 'Unknown Location'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                              <Coins className="w-3 h-3" />
                              {selectedSupplier.currency || selectedCurrency.code}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // TODO: Show supplier details modal
                          }}
                          className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200"
                          title="View supplier details"
                        >
                          <User className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedSupplier(null)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowSupplierSearch(true)}
                      className="w-full flex items-center justify-center gap-3 p-4 text-base border-2 border-orange-200 rounded-xl bg-white text-gray-900 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
                    >
                      <Search className="w-5 h-5 text-orange-500" />
                      <span className="text-gray-600">Select Supplier</span>
                      <Plus className="w-4 h-4 text-orange-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Currency & Settings Section */}
              {selectedSupplier && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <CurrencySelector
                        selectedCurrency={selectedCurrency}
                        onCurrencyChange={setSelectedCurrency}
                        currencies={SUPPORTED_CURRENCIES}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
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
                {purchaseCartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cart is empty</h3>
                    <p className="text-gray-600 mb-4">Add products to create a purchase order</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {[...purchaseCartItems].reverse().map((item, index) => (
                      <PurchaseCartItem
                        key={item.id}
                        item={item}
                        index={index}
                        currency={selectedCurrency}
                        isLatest={index === 0}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUpdateCostPrice={handleUpdateCostPrice}
                        onRemove={handleRemoveFromCart}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase Order Summary */}
              {purchaseCartItems.length > 0 && (
                <>
                  {/* Expected Delivery Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Purchase Order Summary */}
                  <div className="mt-6 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl p-4 border border-gray-200 shadow-sm flex-shrink-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatMoneyDisplay(subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tax (18%)</span>
                        <span className="font-semibold text-gray-900">{formatMoneyDisplay(tax)}</span>
                      </div>
                      
                      <div className="border-t-2 border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Total Amount</span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatMoneyDisplay(totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-3 flex-shrink-0">
                    {/* Create PO Button */}
                    <GlassButton
                      onClick={handleCreatePurchaseOrder}
                      icon={isCreatingPO ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                      className="w-full h-16 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-lg font-bold"
                      disabled={!selectedSupplier || purchaseCartItems.length === 0 || !expectedDelivery || isCreatingPO}
                    >
                      {isCreatingPO ? 'Creating...' : 'Create PO'}
                    </GlassButton>
                  </div>
                </>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Supplier Search Modal */}
      {showSupplierSearch && (
        <SupplierSelectionModal
          isOpen={showSupplierSearch}
          onClose={() => setShowSupplierSearch(false)}
          onSupplierSelect={handleSupplierSelect}
          suppliers={suppliers}
        />
      )}

      {/* Draft Management Modal */}
      {showDraftModal && (
        <PurchaseOrderDraftModal
          isOpen={showDraftModal}
          onClose={() => setShowDraftModal(false)}
          cartItems={purchaseCartItems}
          supplier={selectedSupplier}
          currency={selectedCurrency}
          expectedDelivery={expectedDelivery}
          paymentTerms={paymentTerms}
          notes={purchaseOrderNotes}
        />
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={() => setShowAddSupplierModal(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      )}

      {/* Product Detail Modal */}
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
          onAddToCart={handleAddToPurchaseCart}
          onSupplierChange={(supplier) => {
            if (supplier) {
              setSelectedSupplier(supplier);
            }
          }}
        />
      )}
    </div>
  );
};

export default PurchaseOrderPage;