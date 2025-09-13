import React, { useState, useEffect, useCallback } from 'react';
import { Save, Settings, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
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

interface UnifiedSettingsState {
  // User Settings
  userSettings: UserSettings;
  
  // POS Settings
  generalSettings: GeneralSettings;
  dynamicPricingSettings: DynamicPricingSettings;
  receiptSettings: ReceiptSettings;
  barcodeScannerSettings: BarcodeScannerSettings;
  deliverySettings: DeliverySettings;
  searchFilterSettings: SearchFilterSettings;
  userPermissionsSettings: UserPermissionsSettings;
  loyaltyCustomerSettings: LoyaltyCustomerSettings;
  analyticsReportingSettings: AnalyticsReportingSettings;
  notificationSettings: NotificationSettings;
  advancedSettings: AdvancedSettings;
}

interface UnifiedSettingsManagerProps {
  children: React.ReactNode;
  onSettingsChange?: (settings: Partial<UnifiedSettingsState>) => void;
}

const UnifiedSettingsManager: React.FC<UnifiedSettingsManagerProps> = ({ 
  children, 
  onSettingsChange 
}) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<UnifiedSettingsState>({
    // Initialize with default values
    userSettings: {
      displayName: '',
      email: '',
      phone: '',
      avatar: '',
      appLogo: '',
      language: 'en',
      timezone: 'Africa/Dar_es_Salaam',
      dateFormat: 'DD/MM/YYYY',
      theme: 'auto',
      notifications: {
        email: true,
        sms: false,
        push: true,
        inApp: true
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowMessages: true
      },
      preferences: {
        autoSave: true,
        compactMode: false,
        showTutorials: true
      },
      pos: {
        defaultCurrency: 'TZS',
        taxRate: 18,
        receiptHeader: 'Repair Shop\nManagement System',
        receiptFooter: 'Thank you for your business!\nVisit us again.',
        autoPrint: false,
        requireCustomerInfo: true,
        allowDiscounts: true,
        maxDiscountPercent: 20,
        barcodeScanner: true,
        cashDrawer: false,
        paymentMethods: ['cash', 'mpesa', 'card'],
        defaultPaymentMethod: 'cash',
        receiptNumbering: true,
        receiptPrefix: 'RS',
        lowStockAlert: true,
        lowStockThreshold: 5,
        inventoryTracking: true,
        returnPolicy: '7 days return policy',
        warrantyPeriod: 3,
        warrantyUnit: 'months'
      }
    },
    generalSettings: {
      theme: 'light',
      language: 'en',
      currency: 'TZS',
      timezone: 'Africa/Dar_es_Salaam',
      date_format: 'DD/MM/YYYY',
      time_format: '24',
      show_product_images: true,
      show_stock_levels: true,
      show_prices: true,
      show_barcodes: true,
      products_per_page: 20,
      auto_complete_search: true,
      confirm_delete: true,
      show_confirmations: true,
      enable_sound_effects: true,
      enable_animations: true,
      enable_caching: true,
      cache_duration: 300,
      enable_lazy_loading: true,
      max_search_results: 50
    },
    dynamicPricingSettings: {
      enable_dynamic_pricing: true,
      enable_loyalty_pricing: true,
      enable_bulk_pricing: true,
      enable_time_based_pricing: false,
      enable_customer_pricing: false,
      enable_special_events: false,
      loyalty_discount_percent: 5.00,
      loyalty_points_threshold: 1000,
      loyalty_max_discount: 20.00,
      bulk_discount_enabled: true,
      bulk_discount_threshold: 10,
      bulk_discount_percent: 10.00,
      time_based_discount_enabled: false,
      time_based_start_time: '18:00',
      time_based_end_time: '22:00',
      time_based_discount_percent: 15.00,
      customer_pricing_enabled: false,
      vip_customer_discount: 10.00,
      regular_customer_discount: 5.00,
      special_events_enabled: false,
      special_event_discount_percent: 20.00
    },
    receiptSettings: {
      receipt_template: 'standard'
    },
    barcodeScannerSettings: {
      enable_barcode_scanner: true,
      scanner_type: 'camera',
      scan_mode: 'continuous',
      enable_sound: true,
      enable_vibration: true,
      scan_timeout: 5000,
      enable_auto_focus: true,
      enable_flash: false,
      camera_resolution: '720p',
      enable_multiple_codes: false,
      max_scan_attempts: 3,
      enable_scan_history: true,
      history_limit: 100
    },
    deliverySettings: {
      enable_delivery: true,
      default_delivery_fee: 2000,
      free_delivery_threshold: 50000,
      max_delivery_distance: 20,
      enable_delivery_areas: true,
      delivery_areas: ['City Center', 'Suburbs', 'Outskirts'],
      area_delivery_fees: { 'City Center': 1500, 'Suburbs': 2500, 'Outskirts': 3500 },
      area_delivery_times: { 'City Center': 30, 'Suburbs': 60, 'Outskirts': 90 },
      enable_delivery_hours: true,
      delivery_start_time: '08:00',
      delivery_end_time: '20:00',
      enable_same_day_delivery: true,
      enable_next_day_delivery: true,
      delivery_time_slots: ['Morning', 'Afternoon', 'Evening'],
      notify_customer_on_delivery: true,
      notify_driver_on_assignment: true,
      enable_sms_notifications: true,
      enable_email_notifications: false,
      enable_driver_assignment: true,
      driver_commission: 15.00,
      require_signature: true,
      enable_driver_tracking: true
    },
    searchFilterSettings: {
      enable_advanced_search: true,
      search_fields: ['name', 'sku', 'barcode', 'description'],
      enable_fuzzy_search: true,
      fuzzy_threshold: 0.8,
      enable_autocomplete: true,
      autocomplete_limit: 10,
      enable_search_history: true,
      history_limit: 20,
      enable_saved_searches: true,
      saved_searches_limit: 10,
      enable_search_filters: true,
      default_filters: ['category', 'brand', 'price_range'],
      enable_sort_options: true,
      default_sort: 'name_asc',
      enable_bulk_operations: true,
      max_bulk_items: 100
    },
    userPermissionsSettings: {
      enable_role_based_access: true,
      default_role: 'user',
      enable_permission_groups: true,
      enable_audit_logging: true,
      audit_log_retention_days: 90,
      enable_session_management: true,
      session_timeout_minutes: 30,
      enable_two_factor_auth: false,
      enable_password_policy: true,
      min_password_length: 8,
      require_special_chars: true,
      require_numbers: true,
      require_uppercase: true,
      password_expiry_days: 90,
      enable_account_lockout: true,
      max_login_attempts: 5,
      lockout_duration_minutes: 15
    },
    loyaltyCustomerSettings: {
      enable_loyalty_program: true,
      loyalty_program_name: 'Customer Rewards',
      points_per_currency: 1,
      currency_per_point: 0.01,
      min_points_redemption: 100,
      max_points_redemption_percent: 50,
      enable_tiers: true,
      tiers: [
        { name: 'Bronze', min_spend: 0, discount: 5 },
        { name: 'Silver', min_spend: 50000, discount: 10 },
        { name: 'Gold', min_spend: 100000, discount: 15 },
        { name: 'Platinum', min_spend: 200000, discount: 20 }
      ],
      enable_birthday_rewards: true,
      birthday_points: 500,
      enable_referral_program: true,
      referral_points: 1000,
      enable_anniversary_rewards: true,
      anniversary_points: 250,
      enable_points_expiry: true,
      points_expiry_months: 12,
      enable_notifications: true,
      notification_channels: ['email', 'sms', 'push']
    },
    analyticsReportingSettings: {
      enable_analytics: true,
      enable_real_time_tracking: true,
      enable_custom_reports: true,
      enable_data_export: true,
      export_formats: ['csv', 'excel', 'pdf'],
      enable_scheduled_reports: true,
      report_schedule: 'weekly',
      enable_dashboard_widgets: true,
      default_dashboard_layout: 'grid',
      enable_charts: true,
      chart_types: ['line', 'bar', 'pie', 'doughnut'],
      enable_filters: true,
      enable_date_ranges: true,
      default_date_range: 'last_30_days',
      enable_comparisons: true,
      enable_forecasting: true,
      enable_anomaly_detection: true
    },
    notificationSettings: {
      enable_notifications: true,
      notification_channels: ['email', 'sms', 'push', 'in_app'],
      enable_email_notifications: true,
      email_frequency: 'immediate',
      enable_sms_notifications: false,
      sms_frequency: 'daily',
      enable_push_notifications: true,
      push_frequency: 'immediate',
      enable_in_app_notifications: true,
      in_app_frequency: 'immediate',
      enable_notification_sounds: true,
      enable_notification_vibration: true,
      enable_notification_badges: true,
      enable_notification_previews: true,
      enable_quiet_hours: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      enable_notification_history: true,
      history_retention_days: 30
    },
    advancedSettings: {
      enable_performance_mode: false,
      enable_caching: true,
      cache_size: 100,
      enable_lazy_loading: true,
      max_concurrent_requests: 10,
      enable_database_optimization: true,
      enable_auto_backup: true,
      backup_frequency: 'daily',
      enable_data_compression: true,
      enable_query_optimization: true,
      enable_two_factor_auth: false,
      enable_session_timeout: true,
      session_timeout_minutes: 30,
      enable_audit_logging: true,
      enable_encryption: true,
      enable_api_access: false,
      enable_webhooks: false,
      enable_third_party_integrations: false,
      enable_data_sync: false,
      sync_interval: 60,
      enable_debug_mode: false,
      enable_error_reporting: true,
      enable_performance_monitoring: true,
      enable_logging: true,
      log_level: 'info',
      enable_experimental_features: false,
      enable_beta_features: false,
      enable_custom_scripts: false,
      enable_plugin_system: false,
      enable_auto_updates: true
    }
  });

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
      <div className="space-y-6">
        {/* Settings Content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Unified Save Button */}
        <div className="sticky bottom-4 z-50">
          <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {hasChanges ? 'Unsaved Changes' : 'All Settings Saved'}
                  </p>
                  {lastSaved && (
                    <p className="text-xs text-gray-500">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <button
                    onClick={resetAllSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>
                )}
                
                <button
                  onClick={saveAllSettings}
                  disabled={isSaving || !hasChanges}
                  className="
                    flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                    bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
                    py-2 px-4 text-base
                    hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                    flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : hasChanges ? (
                    <>
                      <Save className="h-5 w-5" />
                      Save Settings
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      All Settings Saved
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedSettingsContext.Provider>
  );
};

// Context for accessing settings throughout the app
export const UnifiedSettingsContext = React.createContext<{
  settings: UnifiedSettingsState;
  updateSettings: (updates: Partial<UnifiedSettingsState>) => void;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  lastSaved: Date | null;
  saveAllSettings: () => Promise<void>;
  resetAllSettings: () => Promise<void>;
  loadAllSettings: () => Promise<void>;
} | null>(null);

export const useUnifiedSettings = () => {
  const context = React.useContext(UnifiedSettingsContext);
  if (!context) {
    throw new Error('useUnifiedSettings must be used within a UnifiedSettingsManager');
  }
  return context;
};

export default UnifiedSettingsManager;
