// PurchaseOrderPage component for LATS module - Interactive Purchase Order Creation
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';

import POTopBar from '../components/purchase-order/POTopBar';
import {
  Search, Barcode, Plus, CheckCircle, XCircle, 
  User, Phone, Command, Truck, Coins, ShoppingBag, AlertTriangle,
  FileText, X, RefreshCw, Package, Building
} from 'lucide-react';

import { useInventoryStore } from '../stores/useInventoryStore';
import { getLatsProvider } from '../lib/data/provider';
import { getExchangeRateInfo } from '../lib/exchangeRateUtils';

// Import purchase order specific components
import VariantProductCard from '../components/pos/VariantProductCard';
import SupplierSelectionModal from '../components/purchase-order/SupplierSelectionModal';
import PurchaseOrderDraftModal from '../components/purchase-order/PurchaseOrderDraftModal';
import CurrencySelector from '../components/purchase-order/CurrencySelector';
import AddSupplierModal from '../components/purchase-order/AddSupplierModal';
import AddProductModal from '../components/purchase-order/AddProductModal';
import PurchaseCartItem from '../components/purchase-order/PurchaseCartItem';
import ProductDetailModal from '../components/purchase-order/ProductDetailModal';
import PurchaseOrderSuccessModal from '../components/purchase-order/PurchaseOrderSuccessModal';
import OrderManagementModal from '../components/purchase-order/OrderManagementModal';

import { toast } from 'react-hot-toast';

// Shipping defaults function
const getShippingDefaults = () => ({
  defaultAddress: 'Dar es Salaam, Tanzania',
  defaultCity: 'Dar es Salaam',
  defaultCountry: 'Tanzania'
});
import { 
  SUPPORTED_CURRENCIES, 
  PurchaseOrderStatus,
  formatMoney,
  generatePONumber,
  validatePurchaseOrder,
  Currency
} from '../lib/purchaseOrderUtils';
import { purchaseOrderDraftService, PurchaseOrderDraft } from '../lib/draftService';

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
  exchangeRates?: string;
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
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent' | 'supplier'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Use database products and transform them
  const products = useMemo(() => {
    // Return empty array if no products or categories are loaded yet
    if (dbProducts.length === 0 || categories.length === 0) {
      return [];
    }
    
    
    const transformedProducts = dbProducts.map(product => {
      // Try multiple possible category field names - handle both camelCase and snake_case
      const categoryId = product.categoryId || (product as any).category_id || (product as any).category?.id;
      
      // Find category by ID, with fallback to name matching if ID doesn't work
      let categoryName = 'Unknown Category';
      let foundCategory = null;
      
      if (categoryId && categories.length > 0) {
        foundCategory = categories.find(c => c.id === categoryId);
        if (foundCategory) {
          categoryName = foundCategory.name;
        }
      }
      
      // If no category found by ID, try to find by name (for backward compatibility)
      if (!foundCategory && product.name && categories.length > 0) {
        // Try to match category by product name patterns
        const productNameLower = product.name.toLowerCase();
        foundCategory = categories.find(c => {
          const categoryNameLower = c.name.toLowerCase();
          return productNameLower.includes(categoryNameLower) || 
                 categoryNameLower.includes(productNameLower);
        });
        if (foundCategory) {
          categoryName = foundCategory.name;
        }
      }
      
      
              // Convert ProductImage[] to string[] for ProductSearchResult compatibility
        const imageUrls = Array.isArray(product.images) 
          ? product.images.map(img => typeof img === 'string' ? img : (img as any).url || (img as any).image_url || '')
          : [];
        
        return {
          ...product,
          categoryName,
          categoryId: foundCategory?.id || categoryId, // Ensure consistent categoryId
          images: imageUrls.filter(Boolean), // Convert to string[] and filter out empty strings
          tags: [],
          variants: product.variants?.map(variant => ({
            ...variant,
            id: variant.id || `variant-${Date.now()}`,
            sellingPrice: variant.price || product.price || 0,
            quantity: variant.stockQuantity || 0
          })) || []
        };
    });
    
    return transformedProducts;
  }, [dbProducts, categories]);

  // Add loading and error state display
  const { isLoading, error } = useInventoryStore();

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
        await Promise.all([
          loadProducts({ page: 1, limit: 100 }),
          loadCategories(),
          loadSuppliers()
        ]);
      } catch (error) {
        console.error('Error loading data for Purchase Order:', error);
      }
    };
    
    loadData();
  }, [loadProducts, loadCategories, loadSuppliers]);

  // Local state for purchase order
  const [activeTab, setActiveTab] = useState<'products' | 'supplier' | 'review'>('products');
  const [purchaseCartItems, setPurchaseCartItems] = useState<PurchaseCartItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    // Default to TZS (Tanzanian Shilling) as the base currency
    return SUPPORTED_CURRENCIES.find(c => c.code === 'TZS') || SUPPORTED_CURRENCIES[0];
  });

  // Update currency when supplier is selected
  useEffect(() => {
    if (selectedSupplier?.currency) {
      const supplierCurrency = SUPPORTED_CURRENCIES.find(c => c.code === selectedSupplier.currency);
      if (supplierCurrency) {
        console.log('💰 DEBUG: Updating currency to supplier currency:', selectedSupplier.currency);
        setSelectedCurrency(supplierCurrency);
      }
    }
  }, [selectedSupplier]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [exchangeRates, setExchangeRates] = useState('');
  const [purchaseOrderNotes, setPurchaseOrderNotes] = useState('');
  const [purchaseOrderStatus, setPurchaseOrderStatus] = useState<PurchaseOrderStatus>('draft');

  // Calculate exchange rate info for use in components
  const exchangeRateInfo = getExchangeRateInfo(exchangeRates, selectedCurrency.code, 'TZS');
  const [paymentTerms, setPaymentTerms] = useState('Net 30'); // Default payment terms

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

  // Modal states
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<any>(null);
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [createdPurchaseOrder, setCreatedPurchaseOrder] = useState<any>(null);
  const [showOrderManagementModal, setShowOrderManagementModal] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  
  // Cart item expansion state (similar to POS page)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Exchange rate calculation functions
  const parseExchangeRate = (exchangeRateText: string): number | null => {
    if (!exchangeRateText.trim()) return null;
    
    // Try to parse common exchange rate formats
    const patterns = [
      /1\s*([A-Z]{3})\s*=\s*([\d,]+\.?\d*)\s*([A-Z]{3})/i,  // "1 USD = 150 TZS"
      /([\d,]+\.?\d*)\s*([A-Z]{3})\s*=\s*1\s*([A-Z]{3})/i,  // "150 TZS = 1 USD"
      /([\d,]+\.?\d*)/i  // Just the number
    ];
    
    for (const pattern of patterns) {
      const match = exchangeRateText.match(pattern);
      if (match) {
        if (match.length === 4) {
          // Format: "1 USD = 150 TZS" or "150 TZS = 1 USD"
          const fromCurrency = match[1] || match[3];
          const toCurrency = match[3] || match[1];
          const rate = parseFloat(match[2].replace(/,/g, ''));
          
          if (fromCurrency === selectedCurrency.code && toCurrency === 'TZS') {
            return rate; // Direct rate to TZS
          } else if (fromCurrency === 'TZS' && toCurrency === selectedCurrency.code) {
            return 1 / rate; // Inverse rate from TZS
          }
        } else if (match.length === 2) {
          // Just the number - assume it's the rate to TZS
          return parseFloat(match[1].replace(/,/g, ''));
        }
      }
    }
    
    return null;
  };

  const convertToTZS = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'TZS') return amount;
    
    const exchangeRate = parseExchangeRate(exchangeRates);
    if (exchangeRate) {
      return amount * exchangeRate;
    }
    
    return amount; // Return original amount if no exchange rate
  };

  // Computed values for purchase order
  const subtotal = purchaseCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const subtotalTZS = convertToTZS(subtotal, selectedCurrency.code);
  const discount = 0;
  const totalAmount = subtotal - discount;
  const totalAmountTZS = convertToTZS(totalAmount, selectedCurrency.code);

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
        console.log('🔍 DEBUG: Creating new cart item with product:', {
          productId: product.id,
          productName: product.name,
          productCategoryName: product.categoryName,
          productKeys: Object.keys(product)
        });
        
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
        
        console.log('🔍 DEBUG: Created cart item:', newItem);
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

  // Shipping info handler
  const handleSaveShippingInfo = useCallback((newShippingInfo: any) => {
    setShippingInfo(newShippingInfo);
    setExpectedDelivery(newShippingInfo.expectedDelivery);
    
    // Update shipping method display
    if (newShippingInfo.shippingMethod) {
      const methodDisplay: Record<string, string> = {
        'air': 'By Air',
        'sea': 'By Sea',
        'standard': 'Standard'
      };
      
      // Update the shipping method in the display
      setShippingInfo(prev => ({
        ...prev,
        shippingMethod: newShippingInfo.shippingMethod
      }));
    }
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
      setPaymentTerms(draft.paymentTerms || 'net_30');
      setPurchaseOrderNotes(draft.notes || '');
      setExchangeRates(draft.exchangeRates || '');
      
      toast.success(`Loaded draft: ${draft.name}`);
    } catch (error) {
      console.error('Failed to load draft:', error);
      toast.error('Failed to load draft. Please try again.');
    }
  }, []);


  // Handle supplier selection
  const handleSupplierSelect = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    
    // Auto-select currency from supplier
    if (supplier.currency) {
      const supplierCurrency = SUPPORTED_CURRENCIES.find(c => c.code === supplier.currency);
      if (supplierCurrency) {
        setSelectedCurrency(supplierCurrency);
        toast.success(`Currency automatically set to ${supplier.currency} (${supplierCurrency.name})`);
      }
    } else {
      // Fallback to default currency if supplier doesn't specify one
      const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'TZS') || SUPPORTED_CURRENCIES[0];
      setSelectedCurrency(defaultCurrency);
      toast(`No supplier currency specified, using default: ${defaultCurrency.code}`);
    }
    
    // Set exchange rates if available
    if (supplier.exchangeRates) {
      setExchangeRates(supplier.exchangeRates);
      toast.success('Exchange rates loaded from supplier');
    }
    
    setShowSupplierSearch(false);
  }, []);

  // Handle supplier creation
  const handleSupplierCreated = useCallback((newSupplier: any) => {
    // Auto-select the newly created supplier
    setSelectedSupplier(newSupplier);
    
    // Auto-select currency from supplier
    if (newSupplier.currency) {
      const supplierCurrency = SUPPORTED_CURRENCIES.find(c => c.code === newSupplier.currency);
      if (supplierCurrency) {
        setSelectedCurrency(supplierCurrency);
        toast.success(`Currency automatically set to ${newSupplier.currency} (${supplierCurrency.name})`);
      }
    } else {
      // Fallback to default currency if supplier doesn't specify one
      const defaultCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'TZS') || SUPPORTED_CURRENCIES[0];
      setSelectedCurrency(defaultCurrency);
      toast(`No supplier currency specified, using default: ${defaultCurrency.code}`);
    }
    
    // Set exchange rates if available
    if (newSupplier.exchangeRates) {
      setExchangeRates(newSupplier.exchangeRates);
      toast.success('Exchange rates loaded from supplier');
    }
    
    // Reload suppliers list to include the new one
    loadSuppliers();
  }, [loadSuppliers]);

  // Handle product creation
  const handleProductCreated = useCallback((newProduct: any) => {
    console.log('✅ Product created:', newProduct);
    // Refresh products list
    loadProducts();
    setShowAddProductModal(false);
    toast.success('Product added successfully!');
  }, [loadProducts]);

  // Handle currency change
  const handleCurrencyChange = useCallback((currency: Currency) => {
    setSelectedCurrency(currency);
    setShowCurrencySelector(false);
    toast.success(`Currency changed to ${currency.code}`);
  }, []);

  // Handle save draft
  const handleSaveDraft = useCallback(() => {
    try {
      purchaseOrderDraftService.saveDraft(
        purchaseCartItems,
        selectedSupplier,
        selectedCurrency,
        expectedDelivery,
        paymentTerms,
        purchaseOrderNotes,
        exchangeRates
      );
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft. Please try again.');
    }
  }, [purchaseCartItems, selectedSupplier, selectedCurrency, expectedDelivery, paymentTerms, purchaseOrderNotes, exchangeRates]);

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
      const validation = validatePurchaseOrder(selectedSupplier, purchaseCartItems, '', paymentTerms);
    
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    setIsCreatingPO(true);
    
    try {
      const orderNumber = generatePONumber();
      
      const purchaseOrderData = {
        supplierId: selectedSupplier!.id,
        expectedDelivery: shippingInfo.expectedDelivery || '', // Use shipping info or empty string
        notes: purchaseOrderNotes,
        status: purchaseOrderStatus,
        currency: selectedCurrency.code, // Add currency
        paymentTerms: paymentTerms, // Add payment terms
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
          minimumOrderQty: item.minimumOrderQty, // Add minimum order quantity
          notes: item.notes || '' // Add notes
        }))
      };

      console.log('🔍 DEBUG: Sending purchase order data:', purchaseOrderData);
      
      // Debug: Log exchange rate information
      console.log('💱 DEBUG: Exchange Rate Information:', {
        exchangeRateInfo,
        fromCurrency: selectedCurrency.code,
        toCurrency: 'TZS',
        exchangeRate: exchangeRateInfo?.rate || 1.0,
        source: exchangeRateInfo?.source || 'manual',
        date: exchangeRateInfo?.date || new Date().toISOString()
      });
      
      // Calculate order totals for debug
      const orderTotals = purchaseCartItems.reduce((totals, item) => {
        const itemTotal = item.quantity * item.costPrice;
        totals.subtotal += itemTotal;
        totals.itemsCount += item.quantity;
        return totals;
      }, { subtotal: 0, itemsCount: 0 });

      // Debug: Log detailed pricing and quantity information
      console.log('💰 DEBUG: Detailed Pricing & Quantity Analysis:');
      purchaseCartItems.forEach((item, index) => {
        console.log(`📦 Item ${index + 1}:`, {
          productId: item.productId,
          productName: item.name,
          variantId: item.variantId,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalPrice: item.quantity * item.costPrice,
          minimumOrderQty: item.minimumOrderQty,
          currency: selectedCurrency.code,
          category: item.category
        });
      });
      
      console.log('📊 DEBUG: Order Totals:', {
        itemsCount: orderTotals.itemsCount,
        subtotal: orderTotals.subtotal,
        currency: selectedCurrency.code,
        supplierCurrency: selectedSupplier?.currency,
        paymentTerms: paymentTerms
      });

      console.log('🔍 DEBUG: Purchase order data breakdown:', {
        supplierId: purchaseOrderData.supplierId,
        expectedDelivery: purchaseOrderData.expectedDelivery,
        notes: purchaseOrderData.notes,
        status: purchaseOrderData.status,
        itemsCount: purchaseOrderData.items.length,
        items: purchaseOrderData.items,
        hasShippingInfo: !!purchaseOrderData.shippingInfo,
        shippingInfo: purchaseOrderData.shippingInfo
      });

      console.log('📋 DEBUG: Order Details Summary:', {
        orderNumber: orderNumber,
        supplier: selectedSupplier ? {
          id: selectedSupplier.id,
          name: selectedSupplier.name,
          email: selectedSupplier.email,
          phone: selectedSupplier.phone
        } : null,
        items: purchaseCartItems.map(item => ({
          id: item.id,
          name: item.name,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalPrice: item.quantity * item.costPrice,
          category: item.category
        })),
        totals: {
          itemsCount: orderTotals.itemsCount,
          subtotal: orderTotals.subtotal,
          currency: selectedCurrency.code
        },
        delivery: {
          expectedDelivery: shippingInfo.expectedDelivery,
          hasShippingInfo: !!purchaseOrderData.shippingInfo
        },
        payment: {
          terms: paymentTerms,
          status: purchaseOrderStatus
        }
      });
      
      const result = await createPurchaseOrder(purchaseOrderData);
      
      console.log('🔍 DEBUG: Create purchase order result:', result);
      
      if (result.ok) {
        console.log('✅ DEBUG: Purchase order created successfully!');
        console.log('✅ DEBUG: Created purchase order data:', result.data);
        
        // Log complete order details
        console.log('📄 DEBUG: Complete Order Details:', {
          orderInfo: {
            id: result.data.id,
            orderNumber: result.data.orderNumber,
            status: result.data.status,
            createdAt: result.data.createdAt,
            createdBy: result.data.createdBy
          },
          supplier: {
            id: result.data.supplierId,
            name: selectedSupplier?.name,
            email: selectedSupplier?.email,
            phone: selectedSupplier?.phone
          },
          items: result.data.items || [],
          totals: {
            totalAmount: result.data.totalAmount,
            currency: selectedCurrency.code
          },
          delivery: {
            expectedDelivery: result.data.expectedDelivery,
            estimatedDelivery: result.data.estimatedDelivery
          },
          shipping: {
            trackingNumber: result.data.trackingNumber,
            shippingStatus: result.data.shippingStatus,
            shippingNotes: result.data.shippingNotes,
            shippingInfo: result.data.shippingInfo
          },
          notes: result.data.notes
        });
        
        toast.success(`Purchase Order ${orderNumber} created successfully!`);
        
        // Store the created purchase order and show success modal
        setCreatedPurchaseOrder(result.data);
        setShowSuccessModal(true);
        
        // Clear form data
        setPurchaseCartItems([]);
        setSelectedSupplier(null);
        setShippingInfo(prev => ({ ...prev, expectedDelivery: '' }));
        setPurchaseOrderNotes('');
        setPurchaseOrderStatus('draft');
      } else {
        console.error('❌ DEBUG: Purchase order creation failed:', result);
        console.error('❌ DEBUG: Error message:', result.message);
        toast.error(result.message || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('❌ DEBUG: Exception during purchase order creation:', error);
      console.error('❌ DEBUG: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error('Error creating purchase order. Please try again.');
    } finally {
      setIsCreatingPO(false);
    }
  }, [selectedSupplier, purchaseCartItems, shippingInfo.expectedDelivery, exchangeRates, purchaseOrderNotes, purchaseOrderStatus, selectedCurrency, createPurchaseOrder, navigate]);

  // Format money helper
  const formatMoneyDisplay = (amount: number, currency?: Currency) => formatMoney(amount, currency || selectedCurrency);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => navigate('/lats/purchase-orders')}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-600">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Purchase Order</h2>
              <p className="text-sm text-gray-500">
                {purchaseCartItems.length} items • {formatMoney(totalAmount, selectedCurrency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlassButton
              onClick={handleCreatePurchaseOrder}
              disabled={!selectedSupplier || purchaseCartItems.length === 0 || isCreatingPO}
              className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              icon={isCreatingPO ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            >
              {isCreatingPO ? 'Creating...' : 'Create Order'}
            </GlassButton>
            <button 
              onClick={() => navigate('/lats/purchase-orders')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'products'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </div>
            </button>
            <button
              onClick={() => setActiveTab('supplier')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'supplier'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Supplier
              </div>
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'review'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Review
              </div>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Simple Search */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                {!isLoading && !error && products.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>{products.length} products available</span>
                  </div>
                )}
              </div>

              {/* Products Grid */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Products</h3>
                  <span className="text-xs text-gray-500">{filteredProducts.length} items</span>
                </div>
                
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredProducts.map((product) => (
                      <VariantProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToPurchaseCart}
                        onViewDetails={handleViewProductDetails}
                        primaryColor="orange"
                        actionText="Add"
                        allowOutOfStockSelection={true}
                        showCategory={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No products found</h3>
                    <p className="text-xs text-gray-500">Try adjusting your search</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'supplier' && (
            <div className="space-y-6">
              {/* Supplier Selection */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Select Supplier</h3>
                
                {selectedSupplier ? (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {selectedSupplier.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{selectedSupplier.name}</div>
                          <div className="text-xs text-gray-600">{selectedSupplier.contactPerson}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedSupplier.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedSupplier(null)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSupplierSearch(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700">Select Supplier</div>
                    <div className="text-xs text-gray-500">Choose a supplier for this order</div>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Order Summary</h3>
                
                {purchaseCartItems.length > 0 ? (
                  <div className="space-y-3">
                    {purchaseCartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatMoney(item.totalPrice, selectedCurrency)}
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t border-gray-200 pt-3 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatMoney(totalAmount, selectedCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">No items in cart</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>

    {/* Modals */}
    {showSupplierSearch && (
      <SupplierSelectionModal
        isOpen={showSupplierSearch}
        onClose={() => setShowSupplierSearch(false)}
        onSelectSupplier={handleSupplierSelect}
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

    {showAddProductModal && (
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductCreated={handleProductCreated}
      />
    )}

    {showProductDetailModal && selectedProduct && (
      <ProductDetailModal
        isOpen={showProductDetailModal}
        onClose={() => setShowProductDetailModal(false)}
        product={selectedProduct}
        onAddToCart={handleAddToPurchaseCart}
      />
    )}

    {showPurchaseOrderSuccessModal && createdPurchaseOrder && (
      <PurchaseOrderSuccessModal
        isOpen={showPurchaseOrderSuccessModal}
        onClose={() => setShowPurchaseOrderSuccessModal(false)}
        purchaseOrder={createdPurchaseOrder}
        onViewOrder={() => {
          setShowPurchaseOrderSuccessModal(false);
          navigate(`/lats/purchase-orders/${createdPurchaseOrder.id}`);
        }}
        onCreateAnother={() => {
          setShowPurchaseOrderSuccessModal(false);
          handleClearCart();
          setSelectedSupplier(null);
        }}
      />
    )}

    {showOrderManagementModal && (
      <OrderManagementModal
        isOpen={showOrderManagementModal}
        onClose={() => setShowOrderManagementModal(false)}
      />
    )}

    {showPurchaseOrderDraftModal && (
      <PurchaseOrderDraftModal
        isOpen={showPurchaseOrderDraftModal}
        onClose={() => setShowPurchaseOrderDraftModal(false)}
        onLoadDraft={handleLoadDraft}
        currentCartItems={purchaseCartItems}
        currentSupplier={selectedSupplier}
        onSaveDraft={handleSaveDraft}
      />
    )}

    {showCurrencySelector && (
      <CurrencySelector
        isOpen={showCurrencySelector}
        onClose={() => setShowCurrencySelector(false)}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={handleCurrencyChange}
        supportedCurrencies={SUPPORTED_CURRENCIES}
      />
    )}
  </div>
  );
};

export default PurchaseOrderPage;
