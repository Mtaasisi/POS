import { useGeneralSettingsContext } from '../context/GeneralSettingsContext';

/**
 * Hook for easy access to general settings in UI components
 * This provides a simplified interface for common UI operations
 */
export const useGeneralSettingsUI = () => {
  const context = useGeneralSettingsContext();

  return {
    // Formatting functions
    formatCurrency: context.formatCurrency,
    formatDate: context.formatDate,
    formatTime: context.formatTime,
    
    // Display settings
    showProductImages: context.showProductImages,
    showStockLevels: context.showStockLevels,
    showPrices: context.showPrices,
    showBarcodes: context.showBarcodes,
    
    // Behavior settings
    autoCompleteSearch: context.autoCompleteSearch,
    confirmDelete: context.confirmDelete,
    showConfirmations: context.showConfirmations,
    enableSoundEffects: context.enableSoundEffects,
    enableAnimations: context.enableAnimations,
    
    // Performance settings
    productsPerPage: context.productsPerPage,
    
    // Current settings
    settings: context.settings,
    loading: context.loading,
    error: context.error,
    
    // Utility functions
    getProductImageClass: () => context.showProductImages ? 'product-image' : 'hidden-by-setting',
    getStockLevelClass: () => context.showStockLevels ? 'stock-level' : 'hidden-by-setting',
    getPriceClass: () => context.showPrices ? 'price price-display' : 'hidden-by-setting',
    getBarcodeClass: () => context.showBarcodes ? 'barcode barcode-display' : 'hidden-by-setting',
    
    // Animation classes
    getAnimationClass: () => context.enableAnimations ? 'animate-enabled' : 'animate-disabled',
    
    // Sound effect classes
    getSoundClass: () => context.enableSoundEffects ? 'sound-enabled' : 'sound-disabled',
    
    // Theme helpers
    isDarkMode: () => {
      if (!context.settings) return false;
      if (context.settings.theme === 'dark') return true;
      if (context.settings.theme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
    },
    
    // Language helpers
    isSwahili: () => context.settings?.language === 'sw',
    isFrench: () => context.settings?.language === 'fr',
    isEnglish: () => context.settings?.language === 'en',
    
    // Currency helpers
    getCurrencySymbol: () => {
      const currency = context.settings?.currency || 'TZS';
      switch (currency) {
        case 'TZS': return 'TSh';
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        default: return currency;
      }
    },
    
    // Stock level helpers
    getStockLevelClass: (stock: number, lowThreshold: number = 5, mediumThreshold: number = 10) => {
      if (!context.showStockLevels) return 'hidden-by-setting';
      if (stock <= lowThreshold) return 'stock-level stock-level-low';
      if (stock <= mediumThreshold) return 'stock-level stock-level-medium';
      return 'stock-level stock-level-high';
    },
    
    // Confirmation helpers
    shouldShowConfirmation: (action: string) => {
      if (!context.showConfirmations) return false;
      if (action === 'delete' && context.confirmDelete) return true;
      return true; // Default to showing confirmations
    },
    
    // Search helpers
    getSearchConfig: () => ({
      autoComplete: context.autoCompleteSearch,
      maxResults: context.settings?.max_search_results || 50,
      debounceTime: 300
    }),
    
    // Cache helpers
    getCacheConfig: () => ({
      enabled: context.settings?.enable_caching || true,
      duration: context.settings?.cache_duration || 300,
      lazyLoading: context.settings?.enable_lazy_loading || true
    })
  };
};
