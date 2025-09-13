import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  POSSettingsService,
  GeneralSettings,
  DynamicPricingSettings,
  ReceiptSettings,
  BarcodeScannerSettings,
  DeliverySettings,
  SearchFilterSettings,
  UserPermissionsSettings,
  LoyaltyCustomerSettings,
  AnalyticsReportingSettings,
  NotificationSettings,
  AdvancedSettings
} from '../../../lib/posSettingsApi';
import { loadUserSettings, saveUserSettings, UserSettings } from '../../../lib/userSettingsApi';
import { 
  UnifiedSettingsContext, 
  UnifiedSettingsState, 
  getDefaultSettings 
} from './UnifiedSettingsContext';

interface UnifiedSettingsProviderProps {
  children: React.ReactNode;
  onSettingsChange?: (settings: Partial<UnifiedSettingsState>) => void;
}

const UnifiedSettingsProvider: React.FC<UnifiedSettingsProviderProps> = ({ 
  children, 
  onSettingsChange 
}) => {
  const [settings, setSettings] = useState<UnifiedSettingsState>(getDefaultSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load all settings on component mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load user settings
      const userSettings = await loadUserSettings();
      if (userSettings) {
        setSettings(prev => ({ ...prev, userSettings }));
      }

      // Load POS settings
      const [
        generalSettings,
        dynamicPricingSettings,
        receiptSettings,
        barcodeScannerSettings,
        deliverySettings,
        searchFilterSettings,
        userPermissionsSettings,
        loyaltyCustomerSettings,
        analyticsReportingSettings,
        notificationSettings,
        advancedSettings
      ] = await Promise.all([
        POSSettingsService.loadGeneralSettings(),
        POSSettingsService.loadDynamicPricingSettings(),
        POSSettingsService.loadReceiptSettings(),
        POSSettingsService.loadBarcodeScannerSettings(),
        POSSettingsService.loadDeliverySettings(),
        POSSettingsService.loadSearchFilterSettings(),
        POSSettingsService.loadUserPermissionsSettings(),
        POSSettingsService.loadLoyaltyCustomerSettings(),
        POSSettingsService.loadAnalyticsReportingSettings(),
        POSSettingsService.loadNotificationSettings(),
        POSSettingsService.loadAdvancedSettings()
      ]);

      setSettings(prev => ({
        ...prev,
        generalSettings: generalSettings || prev.generalSettings,
        dynamicPricingSettings: dynamicPricingSettings || prev.dynamicPricingSettings,
        receiptSettings: receiptSettings || prev.receiptSettings,
        barcodeScannerSettings: barcodeScannerSettings || prev.barcodeScannerSettings,
        deliverySettings: deliverySettings || prev.deliverySettings,
        searchFilterSettings: searchFilterSettings || prev.searchFilterSettings,
        userPermissionsSettings: userPermissionsSettings || prev.userPermissionsSettings,
        loyaltyCustomerSettings: loyaltyCustomerSettings || prev.loyaltyCustomerSettings,
        analyticsReportingSettings: analyticsReportingSettings || prev.analyticsReportingSettings,
        notificationSettings: notificationSettings || prev.notificationSettings,
        advancedSettings: advancedSettings || prev.advancedSettings
      }));

    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback((updates: Partial<UnifiedSettingsState>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
    onSettingsChange?.(updates);
  }, [onSettingsChange]);

  const saveAllSettings = async () => {
    try {
      setIsSaving(true);
      
      // Save user settings
      await saveUserSettings(settings.userSettings);

      // Save POS settings
      await Promise.all([
        POSSettingsService.saveGeneralSettings(settings.generalSettings),
        POSSettingsService.saveDynamicPricingSettings(settings.dynamicPricingSettings),
        POSSettingsService.saveReceiptSettings(settings.receiptSettings),
        POSSettingsService.saveBarcodeScannerSettings(settings.barcodeScannerSettings),
        POSSettingsService.saveDeliverySettings(settings.deliverySettings),
        POSSettingsService.saveSearchFilterSettings(settings.searchFilterSettings),
        POSSettingsService.saveUserPermissionsSettings(settings.userPermissionsSettings),
        POSSettingsService.saveLoyaltyCustomerSettings(settings.loyaltyCustomerSettings),
        POSSettingsService.saveAnalyticsReportingSettings(settings.analyticsReportingSettings),
        POSSettingsService.saveNotificationSettings(settings.notificationSettings),
        POSSettingsService.saveAdvancedSettings(settings.advancedSettings)
      ]);

      setHasChanges(false);
      setLastSaved(new Date());
      toast.success('All settings saved successfully!');
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save some settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAllSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      await loadAllSettings();
      setHasChanges(false);
      toast.success('Settings reset to default values');
    }
  };

  const contextValue = {
    settings,
    updateSettings,
    isLoading,
    isSaving,
    hasChanges,
    lastSaved,
    saveAllSettings,
    resetAllSettings,
    loadAllSettings
  };

  return (
    <UnifiedSettingsContext.Provider value={contextValue}>
      {children}
    </UnifiedSettingsContext.Provider>
  );
};

export default UnifiedSettingsProvider;
