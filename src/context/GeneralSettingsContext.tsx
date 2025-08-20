import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGeneralSettings } from '../hooks/usePOSSettings';
import { GeneralSettings } from '../lib/posSettingsApi';

interface GeneralSettingsContextType {
  settings: GeneralSettings | null;
  loading: boolean;
  error: string | null;
  applyTheme: (theme: 'light' | 'dark' | 'auto') => void;
  applyLanguage: (language: 'en' | 'sw' | 'fr') => void;
  applyCurrency: (currency: string) => void;
  applyTimezone: (timezone: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  showProductImages: boolean;
  showStockLevels: boolean;
  showPrices: boolean;
  showBarcodes: boolean;
  productsPerPage: number;
  autoCompleteSearch: boolean;
  confirmDelete: boolean;
  showConfirmations: boolean;
  enableSoundEffects: boolean;
  enableAnimations: boolean;
  refreshSettings: () => Promise<void>;
}

const GeneralSettingsContext = createContext<GeneralSettingsContextType | undefined>(undefined);

export const useGeneralSettingsContext = () => {
  const context = useContext(GeneralSettingsContext);
  if (!context) {
    throw new Error('useGeneralSettingsContext must be used within a GeneralSettingsProvider');
  }
  return context;
};

export const GeneralSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    settings,
    loading,
    error,
    saveSettings,
    updateSettings,
    loadSettings,
    refreshSettings
  } = useGeneralSettings();

  const [currentSettings, setCurrentSettings] = useState<GeneralSettings | null>(null);

  // Apply settings when they change
  useEffect(() => {
    if (settings) {
      setCurrentSettings(settings);
      applySettingsToUI(settings);
    }
  }, [settings]);

  // Listen for settings update events
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'general') {
        loadSettings();
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, [loadSettings]);

  // Apply all settings to the UI
  const applySettingsToUI = (settings: GeneralSettings) => {
    // Apply theme
    applyTheme(settings.theme);
    
    // Apply language
    applyLanguage(settings.language);
    
    // Apply currency
    applyCurrency(settings.currency);
    
    // Apply timezone
    applyTimezone(settings.timezone);
    
    // Apply display settings
    applyDisplaySettings(settings);
    
    // Apply behavior settings
    applyBehaviorSettings(settings);
    
    // Apply performance settings
    applyPerformanceSettings(settings);
  };

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    // Store theme preference
    localStorage.setItem('theme', theme);
  };

  // Apply language
  const applyLanguage = (language: 'en' | 'sw' | 'fr') => {
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  };

  // Apply currency
  const applyCurrency = (currency: string) => {
    localStorage.setItem('currency', currency);
  };

  // Apply timezone
  const applyTimezone = (timezone: string) => {
    localStorage.setItem('timezone', timezone);
  };

  // Apply display settings
  const applyDisplaySettings = (settings: GeneralSettings) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties for display settings
    root.style.setProperty('--show-product-images', settings.show_product_images ? 'block' : 'none');
    root.style.setProperty('--show-stock-levels', settings.show_stock_levels ? 'block' : 'none');
    root.style.setProperty('--show-prices', settings.show_prices ? 'block' : 'none');
    root.style.setProperty('--show-barcodes', settings.show_barcodes ? 'block' : 'none');
  };

  // Apply behavior settings
  const applyBehaviorSettings = (settings: GeneralSettings) => {
    // Store behavior settings in localStorage for components to access
    localStorage.setItem('autoCompleteSearch', settings.auto_complete_search.toString());
    localStorage.setItem('confirmDelete', settings.confirm_delete.toString());
    localStorage.setItem('showConfirmations', settings.show_confirmations.toString());
    localStorage.setItem('enableSoundEffects', settings.enable_sound_effects.toString());
    localStorage.setItem('enableAnimations', settings.enable_animations.toString());
  };

  // Apply performance settings
  const applyPerformanceSettings = (settings: GeneralSettings) => {
    localStorage.setItem('enableCaching', settings.enable_caching.toString());
    localStorage.setItem('cacheDuration', settings.cache_duration.toString());
    localStorage.setItem('enableLazyLoading', settings.enable_lazy_loading.toString());
    localStorage.setItem('maxSearchResults', settings.max_search_results.toString());
  };

  // Format currency based on settings
  const formatCurrency = (amount: number): string => {
    const currency = currentSettings?.currency || 'TZS';
    const locale = currentSettings?.language === 'sw' ? 'sw-TZ' : 'en-TZ';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date based on settings
  const formatDate = (date: Date): string => {
    const format = currentSettings?.date_format || 'DD/MM/YYYY';
    const locale = currentSettings?.language === 'sw' ? 'sw-TZ' : 'en-TZ';
    
    // Convert format string to Intl.DateTimeFormat options
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  // Format time based on settings
  const formatTime = (date: Date): string => {
    const format = currentSettings?.time_format || '24';
    const locale = currentSettings?.language === 'sw' ? 'sw-TZ' : 'en-TZ';
    
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12'
    };
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  };



  const contextValue: GeneralSettingsContextType = {
    settings: currentSettings,
    loading,
    error,
    applyTheme,
    applyLanguage,
    applyCurrency,
    applyTimezone,
    formatCurrency,
    formatDate,
    formatTime,
    showProductImages: currentSettings?.show_product_images ?? true,
    showStockLevels: currentSettings?.show_stock_levels ?? true,
    showPrices: currentSettings?.show_prices ?? true,
    showBarcodes: currentSettings?.show_barcodes ?? true,
    productsPerPage: currentSettings?.products_per_page ?? 20,
    autoCompleteSearch: currentSettings?.auto_complete_search ?? true,
    confirmDelete: currentSettings?.confirm_delete ?? true,
    showConfirmations: currentSettings?.show_confirmations ?? true,
    enableSoundEffects: currentSettings?.enable_sound_effects ?? true,
    enableAnimations: currentSettings?.enable_animations ?? true,
    refreshSettings
  };

  return (
    <GeneralSettingsContext.Provider value={contextValue}>
      {children}
    </GeneralSettingsContext.Provider>
  );
};
