import { useState, useCallback } from 'react';

// Types for POS state
interface POSFilters {
  searchQuery: string;
  selectedCategory: string;
  selectedBrand: string;
  priceRange: { min: string; max: string };
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  sortBy: 'name' | 'price' | 'stock' | 'recent' | 'sales';
  sortOrder: 'asc' | 'desc';
  showAdvancedFilters: boolean;
}

interface POSUI {
  showPaymentModal: boolean;
  showReceipt: boolean;
  showSearchResults: boolean;
  showCustomerSearch: boolean;
  showCustomerSearchModal: boolean;
  showAddExternalProductModal: boolean;
  showDeliverySection: boolean;
  showAddCustomerModal: boolean;
  showDiscountModal: boolean;
  showBarcodeScanner: boolean;
  showSettings: boolean;
  showSalesAnalytics: boolean;
  showZenoPayPayment: boolean;
  showPaymentTracking: boolean;
  showNotificationSettings: boolean;
  showInventoryAlerts: boolean;
  showStockAdjustment: boolean;
  showCustomerDetails: boolean;
  showLoyaltyPoints: boolean;
  showReceiptHistory: boolean;
}

interface POSData {
  currentPage: number;
  totalPages: number;
  dataLoaded: boolean;
  lastLoadTime: number;
  isProcessingPayment: boolean;
  isSearching: boolean;
  isScanning: boolean;
}

export const usePOSState = () => {
  // Filters state
  const [filters, setFilters] = useState<POSFilters>({
    searchQuery: '',
    selectedCategory: '',
    selectedBrand: '',
    priceRange: { min: '', max: '' },
    stockFilter: 'all',
    sortBy: 'sales',
    sortOrder: 'desc',
    showAdvancedFilters: false
  });

  // UI state
  const [ui, setUI] = useState<POSUI>({
    showPaymentModal: false,
    showReceipt: false,
    showSearchResults: false,
    showCustomerSearch: false,
    showCustomerSearchModal: false,
    showAddExternalProductModal: false,
    showDeliverySection: false,
    showAddCustomerModal: false,
    showDiscountModal: false,
    showBarcodeScanner: false,
    showSettings: false,
    showSalesAnalytics: false,
    showZenoPayPayment: false,
    showPaymentTracking: false,
    showNotificationSettings: false,
    showInventoryAlerts: false,
    showStockAdjustment: false,
    showCustomerDetails: false,
    showLoyaltyPoints: false,
    showReceiptHistory: false
  });

  // Data state
  const [data, setData] = useState<POSData>({
    currentPage: 1,
    totalPages: 1,
    dataLoaded: false,
    lastLoadTime: 0,
    isProcessingPayment: false,
    isSearching: false,
    isScanning: false
  });

  // Filter actions
  const updateFilter = useCallback((key: keyof POSFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedCategory: '',
      selectedBrand: '',
      priceRange: { min: '', max: '' },
      stockFilter: 'all',
      sortBy: 'sales',
      sortOrder: 'desc',
      showAdvancedFilters: false
    });
  }, []);

  // UI actions
  const toggleUI = useCallback((key: keyof POSUI) => {
    setUI(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setUIState = useCallback((key: keyof POSUI, value: boolean) => {
    setUI(prev => ({ ...prev, [key]: value }));
  }, []);

  // Data actions
  const updateData = useCallback((key: keyof POSData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    filters,
    ui,
    data,
    updateFilter,
    resetFilters,
    toggleUI,
    setUIState,
    updateData
  };
};
