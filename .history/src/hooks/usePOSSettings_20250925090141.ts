import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
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
  AdvancedSettings,
  SettingsTableKey
} from '../lib/posSettingsApi';

// Default settings for each type
const defaultGeneralSettings: GeneralSettings = {
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
  sound_volume: 0.5,
  enable_click_sounds: true,
  enable_cart_sounds: true,
  enable_payment_sounds: true,
  enable_delete_sounds: true,
  enable_animations: true,
  enable_caching: true,
  cache_duration: 300,
  enable_lazy_loading: true,
  max_search_results: 50,
  enable_tax: true,
  tax_rate: 16
};

const defaultDynamicPricingSettings: DynamicPricingSettings = {
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
};

const defaultReceiptSettings: ReceiptSettings = {
  receipt_template: 'standard',
  receipt_width: 80,
  receipt_font_size: 12,
  show_business_logo: true,
  show_business_name: true,
  show_business_address: true,
  show_business_phone: true,
  show_business_email: false,
  show_business_website: false,
  show_transaction_id: true,
  show_date_time: true,
  show_cashier_name: true,
  show_customer_name: true,
  show_customer_phone: false,
  show_product_names: true,
  show_product_skus: false,
  show_product_barcodes: false,
  show_quantities: true,
  show_unit_prices: true,
  show_discounts: true,
  show_subtotal: true,
  show_tax: true,
  show_discount_total: true,
  show_grand_total: true,
  show_payment_method: true,
  show_change_amount: true,
  auto_print_receipt: false,
  print_duplicate_receipt: false,
  enable_email_receipt: false,
  enable_sms_receipt: false,
  enable_receipt_numbering: true,
  receipt_number_prefix: 'RCP',
  receipt_number_start: 1,
  receipt_number_format: 'RCP-{YEAR}-{NUMBER}',
  show_footer_message: true,
  footer_message: 'Thank you for your business!',
  show_return_policy: false,
  return_policy_text: 'Returns accepted within 7 days with receipt'
};

const defaultBarcodeScannerSettings: BarcodeScannerSettings = {
  enable_barcode_scanner: true,
  enable_camera_scanner: true,
  enable_keyboard_input: true,
  enable_manual_entry: true,
  auto_add_to_cart: true,
  auto_focus_search: true,
  play_sound_on_scan: true,
  vibrate_on_scan: true,
  show_scan_feedback: true,
  show_invalid_barcode_alert: true,
  allow_unknown_products: false,
  prompt_for_unknown_products: true,
  retry_on_error: true,
  max_retry_attempts: 3,
  scanner_connection_type: 'usb',
  scanner_timeout: 5000,
  support_ean13: true,
  support_ean8: true,
  support_upc_a: true,
  support_upc_e: true,
  support_code128: true,
  support_code39: true,
  support_qr_code: false,
  support_data_matrix: false,
  enable_continuous_scanning: false,
  scan_delay: 100,
  enable_scan_history: true,
  max_scan_history: 100
};

const defaultDeliverySettings: DeliverySettings = {
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
  enable_driver_tracking: true,
  enable_scheduled_delivery: false,
  enable_partial_delivery: false,
  require_advance_payment: false,
  advance_payment_percent: 50
};

const defaultSearchFilterSettings: SearchFilterSettings = {
  // Search Settings
  enable_product_search: true,
  enable_customer_search: true,
  enable_sales_search: true,
  search_by_name: true,
  search_by_barcode: true,
  search_by_sku: true,
  search_by_category: true,
  
  search_by_supplier: true,
  search_by_description: false,
  search_by_tags: false,
  
  // Advanced Search
  enable_fuzzy_search: true,
  enable_autocomplete: true,
  min_search_length: 2,
  max_search_results: 50,
  search_timeout: 3000,
  search_debounce_time: 300,
  
  // Search History
  enable_search_history: true,
  max_search_history: 20,
  enable_recent_searches: true,
  enable_popular_searches: true,
  enable_search_suggestions: true
};

const defaultUserPermissionsSettings: UserPermissionsSettings = {
  enable_pos_access: true,
  enable_sales_access: true,
  enable_refunds_access: false,
  enable_void_access: false,
  enable_discount_access: true,
  enable_inventory_view: true,
  enable_inventory_edit: false,
  enable_stock_adjustments: false,
  enable_product_creation: false,
  enable_product_deletion: false,
  enable_customer_view: true,
  enable_customer_creation: true,
  enable_customer_edit: false,
  enable_customer_deletion: false,
  enable_customer_history: true,
  enable_payment_processing: true,
  enable_cash_management: false,
  enable_daily_reports: true,
  enable_financial_reports: false,
  enable_tax_management: false,
  enable_settings_access: false,
  enable_user_management: false,
  enable_backup_restore: false,
  enable_system_maintenance: false,
  enable_api_access: false,
  enable_audit_logs: false,
  enable_security_settings: false,
  enable_password_reset: false,
  enable_session_management: false,
  enable_data_export: false
};

const defaultLoyaltyCustomerSettings: LoyaltyCustomerSettings = {
  enable_loyalty_program: true,
  loyalty_program_name: 'Customer Rewards',
  points_per_currency: 1.00,
  points_redemption_rate: 0.01,
  minimum_points_redemption: 100,
  points_expiry_days: 365,
  enable_customer_registration: true,
  require_customer_info: false,
  enable_customer_categories: true,
  enable_customer_tags: true,
  enable_customer_notes: true,
  enable_automatic_rewards: true,
  enable_manual_rewards: true,
  enable_birthday_rewards: true,
  enable_anniversary_rewards: false,
  enable_referral_rewards: false,
  enable_email_communication: false,
  enable_sms_communication: true,
  enable_push_notifications: false,
  enable_marketing_emails: false,
  enable_customer_analytics: true,
  enable_purchase_history: true,
  enable_spending_patterns: true,
  enable_customer_segmentation: false,
  enable_customer_insights: true
};

const defaultAnalyticsReportingSettings: AnalyticsReportingSettings = {
  enable_analytics: true,
  enable_real_time_analytics: true,
  analytics_refresh_interval: 30,
  enable_data_export: true,
  enable_sales_analytics: true,
  enable_sales_trends: true,
  enable_product_performance: true,
  enable_customer_analytics: true,
  enable_revenue_tracking: true,
  enable_inventory_analytics: true,
  enable_stock_alerts: true,
  enable_low_stock_reports: true,
  enable_inventory_turnover: true,
  enable_supplier_analytics: true,
  enable_automated_reports: true,
  report_generation_time: '06:00',
  enable_email_reports: true,
  enable_pdf_reports: true,
  enable_excel_reports: true,
  enable_custom_dashboard: true,
  enable_kpi_widgets: true,
  enable_chart_animations: true,
  enable_data_drill_down: true,
  enable_comparative_analysis: true,
  enable_predictive_analytics: false,
  enable_data_retention: true,
  data_retention_days: 365,
  enable_data_backup: true,
  enable_api_export: false
};

const defaultNotificationSettings: NotificationSettings = {
  enable_notifications: true,
  enable_sound_notifications: true,
  enable_visual_notifications: true,
  enable_push_notifications: false,
  notification_timeout: 5000,
  enable_sales_notifications: true,
  notify_on_sale_completion: true,
  notify_on_refund: true,
  notify_on_void: true,
  notify_on_discount: false,
  enable_inventory_notifications: true,
  notify_on_low_stock: true,
  low_stock_threshold: 10,
  notify_on_out_of_stock: true,
  notify_on_stock_adjustment: false,
  enable_customer_notifications: true,
  notify_on_customer_registration: false,
  notify_on_loyalty_points: true,
  notify_on_customer_birthday: false,
  notify_on_customer_anniversary: false,
  enable_system_notifications: true,
  notify_on_system_errors: true,
  notify_on_backup_completion: false,
  notify_on_sync_completion: false,
  notify_on_maintenance: true,
  enable_email_notifications: false,
  enable_sms_notifications: true,
  enable_in_app_notifications: true,
  enable_desktop_notifications: false
};

const defaultAdvancedSettings: AdvancedSettings = {
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
};

// Hook for managing POS settings
export function usePOSSettings<T>(
  settingsType: SettingsTableKey,
  defaultSettings: T
) {
  const [settings, setSettings] = useState<T>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Safely get auth context
  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth?.isAuthenticated || false;
  } catch (err) {
    console.warn('useAuth not available, using default authentication state');
    isAuthenticated = false;
  }

  // Load settings from database
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Map settings type to the correct method name
      const methodMap: Record<SettingsTableKey, keyof typeof POSSettingsService> = {
        general: 'loadGeneralSettings',
        pricing: 'loadDynamicPricingSettings',
        receipt: 'loadReceiptSettings',
        scanner: 'loadBarcodeScannerSettings',
        delivery: 'loadDeliverySettings',
        search: 'loadSearchFilterSettings',
        permissions: 'loadUserPermissionsSettings',
        loyalty: 'loadLoyaltyCustomerSettings',
        analytics: 'loadAnalyticsReportingSettings',
        notifications: 'loadNotificationSettings',
        advanced: 'loadAdvancedSettings'
      };
      
      const methodName = methodMap[settingsType];
      
      // Add retry mechanism for authentication issues
      let retryCount = 0;
      const maxRetries = 3;
      let loadedSettings = null;
      
      while (retryCount < maxRetries) {
        try {
          loadedSettings = await POSSettingsService[methodName]();
          break; // Success, exit retry loop
        } catch (err: any) {
          retryCount++;
          console.log(`⚠️ Attempt ${retryCount} failed for ${settingsType} settings:`, err.message);
          
          // If it's an authentication error and we haven't exhausted retries, wait and try again
          if ((err.message?.includes('not authenticated') || err.message?.includes('Auth session missing')) && retryCount < maxRetries) {
            console.log(`⏳ Waiting 1 second before retry ${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          // For other errors or max retries reached, throw the error
          throw err;
        }
      }
      
      if (loadedSettings) {
        // Only log occasionally to reduce spam
        if (Math.random() < 0.1) { // 10% chance to log
          console.log(`✅ Loaded ${settingsType} settings:`, loadedSettings);
        }
        setSettings(loadedSettings as T);
      } else {
        // Use default settings if none found
        console.log(`⚠️ No ${settingsType} settings found, using defaults:`, defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error(`Error loading ${settingsType} settings:`, err);
      setError(`Failed to load ${settingsType} settings`);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, [settingsType, defaultSettings]);

  // Save settings to database
  const saveSettings = useCallback(async (newSettings: T) => {
    console.log(`🔧 usePOSSettings.saveSettings called for ${settingsType}`);
    console.log(`📊 New settings to save:`, newSettings);
    
    try {
      setSaving(true);
      setError(null);
      
      // Map settings type to the correct method name
      const methodMap: Record<SettingsTableKey, keyof typeof POSSettingsService> = {
        general: 'saveGeneralSettings',
        pricing: 'saveDynamicPricingSettings',
        receipt: 'saveReceiptSettings',
        scanner: 'saveBarcodeScannerSettings',
        delivery: 'saveDeliverySettings',
        search: 'saveSearchFilterSettings',
        permissions: 'saveUserPermissionsSettings',
        loyalty: 'saveLoyaltyCustomerSettings',
        analytics: 'saveAnalyticsReportingSettings',
        notifications: 'saveNotificationSettings',
        advanced: 'saveAdvancedSettings'
      };
      
      const methodName = methodMap[settingsType];
      console.log(`🔧 Calling POSSettingsService.${methodName}...`);
      
      const savedSettings = await POSSettingsService[methodName](newSettings);
      
      console.log(`✅ Save result:`, savedSettings);
      
      if (savedSettings) {
        // Update local state with the saved data from database
        setSettings(savedSettings as T);
        console.log(`🎉 Settings saved successfully for ${settingsType}`);
        toast.success(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings saved successfully`);
        
        // Refresh data from database to ensure consistency
        console.log(`🔄 Refreshing settings from database...`);
        await loadSettings();
        
        return true;
      } else {
        console.error(`❌ Save returned null/undefined for ${settingsType}`);
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      console.error(`💥 Error saving ${settingsType} settings:`, err);
      console.error(`🔍 Error details:`, {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(`Failed to save ${settingsType} settings`);
      toast.error(`Failed to save ${settingsType} settings`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [settingsType, loadSettings]);

  // Update specific settings
  const updateSettings = useCallback(async (updates: Partial<T>) => {
    try {
      setSaving(true);
      setError(null);
      
      // Map settings type to the correct method name
      const methodMap: Record<SettingsTableKey, keyof typeof POSSettingsService> = {
        general: 'updateGeneralSettings',
        pricing: 'updateDynamicPricingSettings',
        receipt: 'updateReceiptSettings',
        scanner: 'updateBarcodeScannerSettings',
        delivery: 'updateDeliverySettings',
        search: 'updateSearchFilterSettings',
        permissions: 'updateUserPermissionsSettings',
        loyalty: 'updateLoyaltyCustomerSettings',
        analytics: 'updateAnalyticsReportingSettings',
        notifications: 'updateNotificationSettings',
        advanced: 'updateAdvancedSettings'
      };
      
      const methodName = methodMap[settingsType];
      const updatedSettings = await POSSettingsService[methodName](updates);
      
      if (updatedSettings) {
        setSettings(updatedSettings as T);
        toast.success(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings updated successfully`);
        
        // Refresh data from database to ensure consistency
        console.log(`🔄 Refreshing settings from database after update...`);
        await loadSettings();
        
        return true;
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err) {
      console.error(`Error updating ${settingsType} settings:`, err);
      setError(`Failed to update ${settingsType} settings`);
      toast.error(`Failed to update ${settingsType} settings`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [settingsType, loadSettings]);

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Reset to default settings locally
      setSettings(defaultSettings);
      toast.success(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings reset to defaults`);
      return true;
    } catch (err) {
      console.error(`Error resetting ${settingsType} settings:`, err);
      setError(`Failed to reset ${settingsType} settings`);
      toast.error(`Failed to reset ${settingsType} settings`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [settingsType, defaultSettings]);

  // Load settings only after authentication is established
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    } else {
      // When not authenticated, ensure defaults are shown and loading is false
      setSettings(defaultSettings);
      setLoading(false);
    }
  }, [isAuthenticated, loadSettings, defaultSettings]);

  return {
    settings,
    setSettings,
    loading,
    saving,
    error,
    loadSettings,
    saveSettings,
    updateSettings,
    resetSettings,
    refreshSettings: loadSettings
  };
}

// Specific hooks for each settings type
export const useGeneralSettings = () => usePOSSettings('general', defaultGeneralSettings);
export const useDynamicPricingSettings = () => usePOSSettings('pricing', defaultDynamicPricingSettings);
export const useReceiptSettings = () => usePOSSettings('receipt', defaultReceiptSettings);
export const useBarcodeScannerSettings = () => usePOSSettings('scanner', defaultBarcodeScannerSettings);
export const useDeliverySettings = () => usePOSSettings('delivery', defaultDeliverySettings);
export const useSearchFilterSettings = () => usePOSSettings('search', defaultSearchFilterSettings);
export const useUserPermissionsSettings = () => usePOSSettings('permissions', defaultUserPermissionsSettings);
export const useLoyaltyCustomerSettings = () => usePOSSettings('loyalty', defaultLoyaltyCustomerSettings);
export const useAnalyticsReportingSettings = () => usePOSSettings('analytics', defaultAnalyticsReportingSettings);
export const useNotificationSettings = () => usePOSSettings('notifications', defaultNotificationSettings);
export const useAdvancedSettings = () => usePOSSettings('advanced', defaultAdvancedSettings);
