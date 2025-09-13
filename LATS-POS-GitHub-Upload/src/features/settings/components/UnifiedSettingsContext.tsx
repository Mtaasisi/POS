import React, { createContext, useContext, useState, useCallback } from 'react';
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

// Unified settings state interface
export interface UnifiedSettingsState {
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

// Context interface
interface UnifiedSettingsContextType {
  settings: UnifiedSettingsState;
  updateSettings: (updates: Partial<UnifiedSettingsState>) => void;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  lastSaved: Date | null;
  saveAllSettings: () => Promise<void>;
  resetAllSettings: () => Promise<void>;
  loadAllSettings: () => Promise<void>;
}

// Create context
export const UnifiedSettingsContext = createContext<UnifiedSettingsContextType | null>(null);

// Hook to use the context
export const useUnifiedSettings = () => {
  const context = useContext(UnifiedSettingsContext);
  if (!context) {
    throw new Error('useUnifiedSettings must be used within a UnifiedSettingsProvider');
  }
  return context;
};

// Default settings values
export const getDefaultSettings = (): UnifiedSettingsState => ({
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
