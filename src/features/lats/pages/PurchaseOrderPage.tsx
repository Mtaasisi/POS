// PurchaseOrderPage component for LATS module - Interactive Purchase Order Creation
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';

import POTopBar from '../components/purchase-order/POTopBar';
import {
  Search, Barcode, Plus, CheckCircle, XCircle, RefreshCw, 
  User, Phone, Command, Truck, Coins, ShoppingBag, AlertTriangle
} from 'lucide-react';

import { useInventoryStore } from '../stores/useInventoryStore';
import { getLatsProvider } from '../lib/data/provider';
import { getShippingDefaults } from '../config/shippingDefaults';
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
import ShippingConfigurationModal from '../components/shipping/ShippingConfigurationModal';

import { toast } from 'react-hot-toast';
import { 
  SUPPORTED_CURRENCIES, 
  PurchaseOrderStatus,
  formatMoney,
  generatePONumber,
  validatePurchaseOrder,
  Currency
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

  // Test function to debug purchase order fetching
  const testPurchaseOrderFetch = useCallback(async () => {
    console.log('🧪 DEBUG: Testing purchase order fetch...');
    try {
      const provider = getLatsProvider();
      const response = await provider.getPurchaseOrders();
      console.log('🧪 DEBUG: Purchase orders response:', response);
      
      if (response.ok && response.data) {
      }
    } catch (error) {
      console.error('🧪 DEBUG: Error testing purchase order fetch:', error);
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
        })),
        shippingInfo: shippingInfo.expectedDelivery ? {
          expectedDelivery: shippingInfo.expectedDelivery,
          shippingMethod: shippingInfo.shippingMethod,
          shippingAddress: shippingInfo.shippingAddress,
          shippingCity: shippingInfo.shippingCity,
          shippingCountry: shippingInfo.shippingCountry,
          shippingPhone: shippingInfo.shippingPhone,
          shippingContact: shippingInfo.shippingContact,
          shippingNotes: shippingInfo.shippingNotes,
          trackingNumber: shippingInfo.trackingNumber,
          estimatedCost: shippingInfo.estimatedCost,
          carrier: shippingInfo.carrier,
          requireSignature: shippingInfo.requireSignature,
          enableInsurance: shippingInfo.enableInsurance,
          insuranceValue: shippingInfo.insuranceValue
        } : undefined
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
        onAddProduct={() => setShowAddProductModal(true)}
        onViewPurchaseOrders={() => setShowOrderManagementModal(true)}
        isCreatingPO={isCreatingPO}
        hasSelectedSupplier={!!selectedSupplier}
        onTestPOFetch={testPurchaseOrderFetch}
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

                {/* Loading and Error States */}
                {isLoading && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-blue-800 font-medium">Loading products...</span>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">Error: {error}</span>
                    </div>
                  </div>
                )}
                
                {/* Products Status */}
                {!isLoading && !error && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">
                        {products.length > 0 ? `${products.length} products loaded` : 'No products found'}
                      </span>
                    </div>
                  </div>
                )}

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
                            showCategory={true}
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
                      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                          <VariantProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToPurchaseCart}
                            onViewDetails={handleViewProductDetails}
                            primaryColor="orange"
                            actionText="View Details"
                            allowOutOfStockSelection={true}
                            showCategory={true}
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
                            <span 
                              className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200"
                              title={`Currency set by supplier: ${selectedSupplier.currency || selectedCurrency.code}`}
                            >
                              <Coins className="w-3 h-3" />
                              {selectedSupplier.currency || selectedCurrency.code}
                              {selectedSupplier.currency && (
                                <span className="text-green-600" title="Auto-set by supplier">✓</span>
                              )}
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
                        exchangeRates={exchangeRates}
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
                  {/* Shipping Information Toggle - Optional */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Information <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <button
                      onClick={() => setShowShippingModal(true)}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-left"
                    >
                      {shippingInfo.expectedDelivery ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Truck className="w-5 h-5 text-orange-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                Delivery: {new Date(shippingInfo.expectedDelivery).toLocaleDateString()}
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
                          <span className="font-medium">Click to configure shipping (optional)</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Currency & Exchange Rate */}
                  {selectedSupplier && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency & Exchange Rate</label>
                      
                      {/* Inline Design */}
                      <div className="flex items-center gap-2 p-2 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-300 focus-within:border-orange-500 transition-all duration-200">
                        {/* Currency Icon & Code - Display Only */}
                        <div className="flex-shrink-0 flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                          <span className="text-lg">{selectedCurrency.flag}</span>
                          <span className="text-sm font-semibold text-gray-800">{selectedCurrency.code}</span>
                        </div>
                        
                        {/* Divider */}
                        <div className="w-px h-6 bg-gray-300"></div>
                        
                        {/* Exchange Rate Input */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={exchangeRates}
                            onChange={(e) => setExchangeRates(e.target.value)}
                            placeholder="Rate (e.g., 1 USD = 150 TZS)"
                            className="w-full border-0 focus:outline-none focus:ring-0 text-base font-bold text-gray-800 placeholder-gray-400 bg-transparent"
                          />
                        </div>
                        
                        {/* TZS Badge */}
                        {exchangeRates && selectedCurrency.code !== 'TZS' && (
                          <div className="flex-shrink-0">
                            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium">
                              ≈ {parseExchangeRate(exchangeRates)?.toFixed(2) || 'N/A'} TZS
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Purchase Order Summary */}
                  <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl p-4 border border-gray-200 shadow-sm flex-shrink-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Subtotal</span>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{formatMoneyDisplay(subtotal)}</div>
                        </div>
                      </div>
                      
                      {selectedCurrency.code !== 'TZS' && exchangeRates && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Total in TZS</span>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{formatMoneyDisplay(subtotalTZS, { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' })}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="border-t-2 border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Total Amount</span>
                          <div className="text-right">
                            <div className="text-xl font-bold text-orange-600">
                              {formatMoneyDisplay(totalAmount)}
                            </div>
                          </div>
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

      {/* Shipping Configuration Modal */}
      {showShippingModal && (
        <ShippingConfigurationModal
          isOpen={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          onSave={handleSaveShippingInfo}
          initialData={shippingInfo}
          exchangeRate={exchangeRateInfo?.rate || 1.0}
          baseCurrency="TZS"
          purchaseOrderCurrency={selectedCurrency.code}
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
          exchangeRates={exchangeRates}
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          onProductAdded={handleProductCreated}
          currency={selectedCurrency}
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
          onAddToCart={handleAddToPurchaseCart}
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

      {/* Order Management Modal */}
      <OrderManagementModal
        isOpen={showOrderManagementModal}
        onClose={() => setShowOrderManagementModal(false)}
      />
    </div>
  );
};

export default PurchaseOrderPage;