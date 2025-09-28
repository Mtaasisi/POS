// POCreationPage - Main Purchase Order Creation Interface
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../../features/shared/components/ui/BackButton';

import LATSBreadcrumb from '../../components/ui/LATSBreadcrumb';
import POTopBar from '../../components/purchase-order/POTopBar';
import {
  Search, Barcode, Plus, CheckCircle, XCircle, RefreshCw, 
  User, Phone, Command, Truck, Coins, ShoppingBag, Package,
  Calendar, FileText, AlertCircle
} from 'lucide-react';

import { useInventoryStore } from '../../stores/useInventoryStore';
import VariantProductCard from '../../components/pos/VariantProductCard';
import SupplierSelectionModal from '../../components/purchase-order/SupplierSelectionModal';
import PurchaseOrderDraftModal from '../../components/purchase-order/PurchaseOrderDraftModal';
import CurrencySelector from '../../components/purchase-order/CurrencySelector';
import { getExchangeRateInfo } from '../../lib/exchangeRateUtils';
import AddSupplierModal from '../../components/purchase-order/AddSupplierModal';
import PurchaseCartItem from '../../components/purchase-order/PurchaseCartItem';
import ProductDetailModal from '../../components/purchase-order/ProductDetailModal';
import PurchaseOrderSuccessModal from '../../components/purchase-order/PurchaseOrderSuccessModal';

import { toast } from 'react-hot-toast';
import { 
  SUPPORTED_CURRENCIES, 
  PAYMENT_TERMS, 
  PurchaseOrderStatus,
  formatMoney,
  generatePONumber,
  validatePurchaseOrder
} from '../../lib/purchaseOrderUtils';
import { purchaseOrderDraftService, PurchaseOrderDraft } from '../../../purchase-orders/lib/draftService';

// Performance constants
const SEARCH_DEBOUNCE_MS = 300;

interface PurchaseCartItem {
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

const POCreationPage: React.FC = () => {
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

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent' | 'supplier'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Transform database products
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

  // Purchase order state
  const [purchaseCartItems, setPurchaseCartItems] = useState<PurchaseCartItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(SUPPORTED_CURRENCIES[0]);
  const [exchangeRates, setExchangeRates] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS[1].id);
  const [purchaseOrderNotes, setPurchaseOrderNotes] = useState('');
  const [purchaseOrderStatus, setPurchaseOrderStatus] = useState<PurchaseOrderStatus>('draft');

  // Shipping info state
  const [shippingInfo, setShippingInfo] = useState({
    shippingMethod: 'standard' as 'air' | 'sea' | 'standard',
    expectedDelivery: '',
    shippingAddress: getShippingDefaults().defaultAddress,
    shippingCity: getShippingDefaults().defaultCity,
    shippingCountry: getShippingDefaults().defaultCountry,
    shippingPhone: '',
    shippingContact: '',
    shippingNotes: '',
    trackingNumber: '',
    estimatedCost: 0,
    carrier: 'DHL',
    requireSignature: false,
    enableInsurance: false,
    insuranceValue: 0
  });
  const [isShippingConfigured, setIsShippingConfigured] = useState(false);

  // Modal states
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<any>(null);
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPurchaseOrder, setCreatedPurchaseOrder] = useState<any>(null);
  const [showShippingModal, setShowShippingModal] = useState(false);
  
  // Cart item expansion state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Debug: Monitor cart state changes
  useEffect(() => {
    console.log('🛒 Cart state changed:', {
      itemCount: purchaseCartItems.length,
      items: purchaseCartItems,
      timestamp: new Date().toISOString()
    });
  }, [purchaseCartItems]);

  // Filtered products logic
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

  // Load data on mount
  // Error state for data loading
  const [dataLoadingError, setDataLoadingError] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      setDataLoadingError(null);
      
      try {
        console.log('🛒 PO Creation: Loading data...');
        
        const results = await Promise.allSettled([
          loadProducts({ page: 1, limit: 100 }),
          loadCategories(),
          loadSuppliers()
        ]);

        // Check for any failed operations
        const failedOperations: string[] = [];
        
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const operationNames = ['products', 'categories', 'suppliers'];
            failedOperations.push(operationNames[index]);
            console.error(`Failed to load ${operationNames[index]}:`, result.reason);
          }
        });

        if (failedOperations.length > 0) {
          const errorMessage = `Failed to load: ${failedOperations.join(', ')}. Please refresh the page or contact support.`;
          setDataLoadingError(errorMessage);
          toast.error(errorMessage);
        } else {
          console.log('📊 PO Creation: Data loaded successfully');
          setDataLoadingError(null);
        }
      } catch (error) {
        console.error('Error loading data for PO Creation:', error);
        const errorMessage = 'Failed to load required data. Please check your internet connection and try again.';
        setDataLoadingError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsDataLoading(false);
      }
    };
    
    loadData();
  }, [loadProducts, loadCategories, loadSuppliers]);

  // Computed values
  const subtotal = purchaseCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0.18;
  const tax = subtotal * taxRate;
  const discount = 0;
  const totalAmount = subtotal + tax - discount;

  // Cart management handlers
  const handleAddToPurchaseCart = useCallback((product: any, variant?: any, quantity: number = 1) => {
    try {
      console.log('🛒 handleAddToPurchaseCart called with:', { product, variant, quantity });
      
      // Validate input parameters
      if (!product) {
        toast.error('Invalid product selected');
        return;
      }

      if (quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }

      if (quantity > 1000) {
        toast.error('Quantity cannot exceed 1000 items');
        return;
      }
      
      const selectedVariant = variant || product.variants?.[0];
      if (!selectedVariant) {
        toast.error('Product has no variants available');
        return;
      }

      const costPrice = selectedVariant.costPrice || product.price * 0.7;
      const sku = selectedVariant.sku || 'N/A';
      const currentStock = selectedVariant.stockQuantity || 0;
      
      // Validate cost price
      if (!costPrice || costPrice <= 0) {
        toast.error('Invalid product price. Please contact support.');
        return;
      }
      
      console.log('🛒 Creating cart item with:', { costPrice, sku, currentStock });
    
    setPurchaseCartItems(prevItems => {
      console.log('🛒 Previous cart items:', prevItems);
      
      const existingItem = prevItems.find(item => 
        item.productId === product.id && item.variantId === selectedVariant.id
      );
      
      if (existingItem) {
        console.log('🛒 Updating existing item:', existingItem);
        const updatedItems = prevItems.map(item =>
          item.id === existingItem.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * costPrice
              }
            : item
        );
        console.log('🛒 Updated cart items:', updatedItems);
        return updatedItems;
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
        console.log('🛒 Adding new item to cart:', newItem);
        const newItems = [...prevItems, newItem];
        console.log('🛒 New cart items array:', newItems);
        return newItems;
      }
    });
    
    setSearchQuery('');
    setShowSearchResults(false);
    toast.success(`Added ${product.name} to cart`);
    
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        setPurchaseCartItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Item removed from cart');
        return;
      }

      if (newQuantity > 1000) {
        toast.error('Quantity cannot exceed 1000 items');
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
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity. Please try again.');
    }
  }, []);

  const handleRemoveFromCart = useCallback((itemId: string) => {
    try {
      setPurchaseCartItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item from cart:', error);
      toast.error('Failed to remove item. Please try again.');
    }
  }, []);

  const handleUpdateCostPrice = useCallback((itemId: string, newCostPrice: number) => {
    try {
      if (newCostPrice <= 0) {
        toast.error('Cost price must be greater than 0');
        return;
      }

      if (newCostPrice > 1000000) {
        toast.error('Cost price cannot exceed 1,000,000');
        return;
      }
      
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
      toast.success('Cost price updated');
    } catch (error) {
      console.error('Error updating cost price:', error);
      toast.error('Failed to update cost price. Please try again.');
    }
  }, []);

  // Auto-save functionality
  const autoSaveDraft = useCallback(() => {
    if (purchaseCartItems.length > 0) {
      try {
        purchaseOrderDraftService.autoSave(
          purchaseCartItems,
          selectedSupplier,
          selectedCurrency,
          expectedDelivery,
          paymentTerms,
          purchaseOrderNotes,
          exchangeRates
        );
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [purchaseCartItems, selectedSupplier, selectedCurrency, expectedDelivery, paymentTerms, purchaseOrderNotes, exchangeRates]);

  // Auto-save when cart changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoSaveDraft();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [autoSaveDraft]);

  // Draft loading functionality
  const handleLoadDraft = useCallback((draft: PurchaseOrderDraft) => {
    try {
      setPurchaseCartItems(draft.cartItems || []);
      setSelectedSupplier(draft.supplier);
      setSelectedCurrency(draft.currency || SUPPORTED_CURRENCIES[0]);
      setExpectedDelivery(draft.expectedDelivery || '');
      setPaymentTerms(draft.paymentTerms || PAYMENT_TERMS[1].id);
      setPurchaseOrderNotes(draft.notes || '');
      setExchangeRates(draft.exchangeRates || '');
      
      toast.success(`Loaded draft: ${draft.name}`);
    } catch (error) {
      console.error('Failed to load draft:', error);
      toast.error('Failed to load draft. Please try again.');
    }
  }, []);

  const handleClearCart = useCallback(() => {
    try {
      if (purchaseCartItems.length > 0 && confirm('Clear purchase cart?')) {
        setPurchaseCartItems([]);
        toast.success('Cart cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart. Please try again.');
    }
  }, [purchaseCartItems.length]);

  // Shipping info handler with error handling
  const handleSaveShippingInfo = useCallback((newShippingInfo: any) => {
    try {
      if (!newShippingInfo) {
        toast.error('Invalid shipping information provided');
        return;
      }

      setShippingInfo(newShippingInfo);
      setExpectedDelivery(newShippingInfo.expectedDelivery);
      setIsShippingConfigured(true); // Mark as configured when user saves
      toast.success('Shipping information saved successfully');
    } catch (error) {
      console.error('Error saving shipping info:', error);
      toast.error('Failed to save shipping information. Please try again.');
    }
  }, []);

  // Supplier management handlers
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

  const handleSupplierCreated = useCallback((newSupplier: any) => {
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
    loadSuppliers();
  }, [loadSuppliers]);

  // Search handlers
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

  const handleSearchInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
    }
  }, [searchQuery]);

  // Product detail handler
  const handleViewProductDetails = useCallback((product: any) => {
    setSelectedProductForModal(product);
    setShowProductDetailModal(true);
  }, []);

  // Global keyboard shortcuts
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

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  // Create purchase order handler with comprehensive error handling
  const handleCreatePurchaseOrder = useCallback(async () => {
    try {
      // Validate required fields - shipping is optional
      const validation = validatePurchaseOrder(selectedSupplier, purchaseCartItems, '', paymentTerms);
      
      if (!validation.isValid) {
        toast.error(validation.errors.join('\n'));
        return;
      }

      // Additional validation checks
      if (!selectedSupplier) {
        toast.error('Please select a supplier before creating the purchase order');
        return;
      }

      if (purchaseCartItems.length === 0) {
        toast.error('Please add at least one item to the purchase order');
        return;
      }

      if (!paymentTerms) {
        toast.error('Please select payment terms');
        return;
      }

      setIsCreatingPO(true);
      
      const orderNumber = generatePONumber();
      
      // Get exchange rate information
      const exchangeRateInfo = getExchangeRateInfo(exchangeRates, selectedCurrency.code, 'TZS');
      
      // Shipping functionality removed - no longer needed
      
      const purchaseOrderData = {
        orderNumber,
        supplierId: selectedSupplier.id,
        currency: selectedCurrency.code,
        expectedDelivery: shippingInfo.expectedDelivery,
        paymentTerms,
        notes: purchaseOrderNotes,
        status: purchaseOrderStatus,
        // Exchange rate tracking
        exchangeRate: exchangeRateInfo?.rate || 1.0,
        baseCurrency: 'TZS',
        exchangeRateSource: exchangeRateInfo?.source || 'manual',
        exchangeRateDate: exchangeRateInfo?.date || new Date().toISOString(),
        items: purchaseCartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          costPrice: item.costPrice,
          notes: ''
        }))
      };

      console.log('Creating purchase order with data:', purchaseOrderData);

      const result = await createPurchaseOrder(purchaseOrderData);
      
      if (result.ok && result.data) {
        toast.success(`Purchase Order ${orderNumber} created successfully!`);
        
        // Store the created purchase order and show success modal
        setCreatedPurchaseOrder(result.data);
        setShowSuccessModal(true);
        
        // Clear form data
        setPurchaseCartItems([]);
        setSelectedSupplier(null);
        setExpectedDelivery('');
        setPurchaseOrderNotes('');
        setPurchaseOrderStatus('draft');
        setIsShippingConfigured(false);
        
        // Reset shipping info to defaults
        setShippingInfo({
          shippingMethod: 'standard' as 'air' | 'sea' | 'standard',
          expectedDelivery: '',
          shippingAddress: getShippingDefaults().defaultAddress,
          shippingCity: getShippingDefaults().defaultCity,
          shippingCountry: getShippingDefaults().defaultCountry,
          shippingPhone: '',
          shippingContact: '',
          shippingNotes: '',
          trackingNumber: '',
          estimatedCost: 0,
          carrier: 'DHL',
          requireSignature: false,
          enableInsurance: false,
          insuranceValue: 0
        });
      } else {
        // Handle specific error cases
        const errorMessage = result.message || 'Failed to create purchase order';
        
        if (errorMessage.includes('supplier')) {
          toast.error('Invalid supplier selected. Please choose a different supplier.');
        } else if (errorMessage.includes('items')) {
          toast.error('Invalid items in cart. Please refresh and try again.');
        } else if (errorMessage.includes('database') || errorMessage.includes('connection')) {
          toast.error('Database connection error. Please check your internet connection and try again.');
        } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
          toast.error('You do not have permission to create purchase orders. Please contact your administrator.');
        } else {
          toast.error(`Failed to create purchase order: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      
      // Handle different types of errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          toast.error('Request timed out. Please try again.');
        } else if (error.message.includes('abort')) {
          toast.error('Request was cancelled. Please try again.');
        } else {
          toast.error(`Unexpected error: ${error.message}`);
        }
      } else {
        toast.error('An unexpected error occurred. Please try again or contact support if the problem persists.');
      }
    } finally {
      setIsCreatingPO(false);
    }
  }, [selectedSupplier, purchaseCartItems, expectedDelivery, paymentTerms, purchaseOrderNotes, purchaseOrderStatus, selectedCurrency, createPurchaseOrder, navigate, shippingInfo]);

  // Format money helper
  const formatMoneyDisplay = (amount: number) => formatMoney(amount, selectedCurrency);

  if (!currentUser) {
    return null;
  }

  // Show loading state while data is being loaded
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Purchase Order Data</h2>
          <p className="text-gray-600">Please wait while we load products, suppliers, and categories...</p>
        </div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (dataLoadingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{dataLoadingError}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => navigate('/lats')}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Navigation */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <LATSBreadcrumb 
            items={[
              { label: 'LATS', href: '/lats' },
              { label: 'Purchase Orders', href: '/lats/purchase-orders' },
              { label: 'Create New', href: '/lats/purchase-orders/create' }
            ]} 
          />
        </div>
      </div>

      {/* Top Bar */}
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
          {/* Product Search Section - POS Style */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <GlassCard className="p-6 h-full flex flex-col">
              {/* Fixed Search Section */}
              <div className="flex-shrink-0 mb-6 space-y-4">
                {/* Product Search Bar - Exact POS Style */}
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

                      {/* Sort Order */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
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
                        {filteredProducts.slice(0, 12).map((product) => (
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
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
                        <p className="text-gray-600 mb-4">No products found in the database</p>
                        <GlassButton
                          onClick={() => navigate('/lats/add-product')}
                          icon={<Plus size={20} />}
                          className="bg-orange-500 text-white"
                        >
                          Add First Product
                        </GlassButton>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Purchase Cart Section - POS Style */}
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
                          onClick={() => navigate('/lats/purchase-orders/suppliers')}
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
                    {selectedCurrency.code !== 'TZS' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exchange Rate (1 {selectedCurrency.code} = ? TZS)
                        </label>
                        <input
                          type="text"
                          value={exchangeRates}
                          onChange={(e) => setExchangeRates(e.target.value)}
                          placeholder={`e.g., 1 ${selectedCurrency.code} = 700 TZS`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                      </div>
                    )}
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
                                {/* Shipping Information Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Information 
                  <span className="text-gray-500 text-sm font-normal ml-2">(Optional - can be added later)</span>
                </label>
                <button
                  onClick={() => setShowShippingModal(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-left"
                >
                  {isShippingConfigured ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Truck className="w-5 h-5 text-orange-500" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {shippingInfo.expectedDelivery ? 
                              `Delivery: ${new Date(shippingInfo.expectedDelivery).toLocaleDateString()}` :
                              'Shipping Configured'
                            }
                          </div>
                          <div className="text-sm text-gray-600">
                            {shippingInfo.carrier} • {
                              shippingInfo.shippingMethod === 'air' ? 'By Air' :
                              shippingInfo.shippingMethod === 'sea' ? 'By Sea' :
                              'Standard'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-orange-500 text-sm font-medium">Edit</div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3 text-gray-500">
                      <Truck className="w-5 h-5" />
                      <div className="text-center">
                        <div className="font-medium">Click to configure shipping</div>
                        <div className="text-sm text-gray-400 mt-1">Optional - you can create the PO without this</div>
                      </div>
                    </div>
                  )}
                </button>
              </div>

                  {/* Order Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
                    <textarea
                      value={purchaseOrderNotes}
                      onChange={(e) => setPurchaseOrderNotes(e.target.value)}
                      placeholder="Add any special instructions..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
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
                      disabled={!selectedSupplier || purchaseCartItems.length === 0 || isCreatingPO}
                    >
                      {isCreatingPO ? 'Creating...' : 'Create PO'}
                    </GlassButton>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <GlassButton
                        onClick={() => navigate('/lats/purchase-orders')}
                        icon={<FileText size={18} />}
                        className="bg-gray-500 text-white"
                      >
                        View All POs
                      </GlassButton>
                      <GlassButton
                        onClick={() => setShowDraftModal(true)}
                        icon={<Package size={18} />}
                        className="bg-blue-500 text-white"
                        disabled={purchaseCartItems.length === 0}
                      >
                        Save Draft
                      </GlassButton>
                    </div>
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

      {showDraftModal && (
        <PurchaseOrderDraftModal
          isOpen={showDraftModal}
          onClose={() => setShowDraftModal(false)}
          cartItems={purchaseCartItems}
          supplier={selectedSupplier}
          currency={selectedCurrency}
          expectedDelivery={shippingInfo.expectedDelivery}
          paymentTerms={paymentTerms}
          notes={purchaseOrderNotes}
          onLoadDraft={handleLoadDraft}
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
          onAddToCart={handleAddToPurchaseCart}
        />
      )}

      {/* Shipping Configuration Modal */}
      {showShippingModal && (
        <ShippingConfigurationModal
          isOpen={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          onSave={handleSaveShippingInfo}
          initialData={shippingInfo}
          exchangeRate={getExchangeRateInfo(exchangeRates, selectedCurrency.code, 'TZS')?.rate || 1.0}
          baseCurrency="TZS"
          purchaseOrderCurrency={selectedCurrency.code}
        />
      )}

      {/* Purchase Order Success Modal */}
      {showSuccessModal && createdPurchaseOrder && (
        <PurchaseOrderSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          purchaseOrder={createdPurchaseOrder}
          onViewOrder={() => {
            setShowSuccessModal(false);
            navigate(`/lats/purchase-orders/${createdPurchaseOrder.id}`);
          }}
          onEditOrder={() => {
            setShowSuccessModal(false);
            navigate(`/lats/purchase-orders/${createdPurchaseOrder.id}/edit`);
          }}
          onPrintOrder={() => {
            // TODO: Implement print functionality
            console.log('Print purchase order:', createdPurchaseOrder.id);
          }}
          onSendToSupplier={() => {
            // TODO: Implement send to supplier functionality
            console.log('Send to supplier:', createdPurchaseOrder.id);
          }}
          onDownloadPDF={() => {
            // TODO: Implement PDF download functionality
            console.log('Download PDF:', createdPurchaseOrder.id);
          }}
          onCopyOrderNumber={() => {
            navigator.clipboard.writeText(createdPurchaseOrder.orderNumber);
            toast.success('Order number copied to clipboard!');
          }}
          onShareOrder={() => {
            // TODO: Implement share functionality
            console.log('Share order:', createdPurchaseOrder.id);
          }}
          onGoToOrders={() => {
            setShowSuccessModal(false);
            navigate('/lats/purchase-orders');
          }}
          onCreateAnother={() => {
            setShowSuccessModal(false);
            // Form is already cleared, user can create another PO
          }}
        />
      )}
    </div>
  );
};

export default POCreationPage;

