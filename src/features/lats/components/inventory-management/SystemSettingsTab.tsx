import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  Settings, Save, RefreshCw, AlertTriangle, Package, 
  DollarSign, BarChart3, Bell, Shield, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemSettings {
  // Stock Management
  low_stock_threshold: number;
  critical_stock_threshold: number;
  auto_reorder_enabled: boolean;
  reorder_point_percentage: number;
  
  // Pricing
  default_markup_percentage: number;
  enable_dynamic_pricing: boolean;
  price_rounding_method: 'nearest' | 'up' | 'down';
  
  // Notifications
  low_stock_alerts: boolean;
  out_of_stock_alerts: boolean;
  price_change_alerts: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  
  // Inventory Tracking
  enable_barcode_tracking: boolean;
  enable_serial_number_tracking: boolean;
  enable_batch_tracking: boolean;
  auto_backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  
  // Security
  require_approval_for_stock_adjustments: boolean;
  require_approval_for_price_changes: boolean;
  enable_audit_logging: boolean;
  
  // Performance
  cache_inventory_data: boolean;
  auto_refresh_interval: number;
  enable_analytics: boolean;
}

const SystemSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    // Stock Management
    low_stock_threshold: 10,
    critical_stock_threshold: 5,
    auto_reorder_enabled: false,
    reorder_point_percentage: 20,
    
    // Pricing
    default_markup_percentage: 30,
    enable_dynamic_pricing: false,
    price_rounding_method: 'nearest',
    
    // Notifications
    low_stock_alerts: true,
    out_of_stock_alerts: true,
    price_change_alerts: false,
    email_notifications: true,
    sms_notifications: false,
    
    // Inventory Tracking
    enable_barcode_tracking: true,
    enable_serial_number_tracking: false,
    enable_batch_tracking: false,
    auto_backup_enabled: true,
    backup_frequency: 'daily',
    
    // Security
    require_approval_for_stock_adjustments: false,
    require_approval_for_price_changes: false,
    enable_audit_logging: true,
    
    // Performance
    cache_inventory_data: true,
    auto_refresh_interval: 300,
    enable_analytics: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings (mock data for now)
  useEffect(() => {
    setLoading(true);
    // TODO: Implement actual API call to load settings
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // TODO: Implement actual API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        low_stock_threshold: 10,
        critical_stock_threshold: 5,
        auto_reorder_enabled: false,
        reorder_point_percentage: 20,
        default_markup_percentage: 30,
        enable_dynamic_pricing: false,
        price_rounding_method: 'nearest',
        low_stock_alerts: true,
        out_of_stock_alerts: true,
        price_change_alerts: false,
        email_notifications: true,
        sms_notifications: false,
        enable_barcode_tracking: true,
        enable_serial_number_tracking: false,
        enable_batch_tracking: false,
        auto_backup_enabled: true,
        backup_frequency: 'daily',
        require_approval_for_stock_adjustments: false,
        require_approval_for_price_changes: false,
        enable_audit_logging: true,
        cache_inventory_data: true,
        auto_refresh_interval: 300,
        enable_analytics: true
      });
      setHasChanges(true);
      toast.success('Settings reset to defaults');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-600" />
            System Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Configure inventory system preferences and behavior
          </p>
        </div>
        <div className="flex gap-3">
          <GlassButton
            onClick={handleResetSettings}
            icon={<RefreshCw size={18} />}
            variant="secondary"
          >
            Reset to Defaults
          </GlassButton>
          <GlassButton
            onClick={handleSaveSettings}
            icon={<Save size={18} />}
            disabled={!hasChanges || saving}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </GlassButton>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Management */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Stock Management</h3>
              <p className="text-sm text-blue-600">Configure stock thresholds and reorder settings</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={settings.low_stock_threshold}
                onChange={(e) => handleSettingChange('low_stock_threshold', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Critical Stock Threshold
              </label>
              <input
                type="number"
                value={settings.critical_stock_threshold}
                onChange={(e) => handleSettingChange('critical_stock_threshold', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Urgent alert when stock falls below this level</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto_reorder_enabled"
                checked={settings.auto_reorder_enabled}
                onChange={(e) => handleSettingChange('auto_reorder_enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="auto_reorder_enabled" className="text-sm font-medium text-gray-700">
                Enable Auto Reorder
              </label>
            </div>
          </div>
        </GlassCard>

        {/* Pricing Settings */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Pricing</h3>
              <p className="text-sm text-green-600">Configure pricing and markup settings</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Markup Percentage
              </label>
              <input
                type="number"
                value={settings.default_markup_percentage}
                onChange={(e) => handleSettingChange('default_markup_percentage', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Default markup percentage for new products</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Rounding Method
              </label>
              <select
                value={settings.price_rounding_method}
                onChange={(e) => handleSettingChange('price_rounding_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="nearest">Nearest</option>
                <option value="up">Round Up</option>
                <option value="down">Round Down</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_dynamic_pricing"
                checked={settings.enable_dynamic_pricing}
                onChange={(e) => handleSettingChange('enable_dynamic_pricing', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="enable_dynamic_pricing" className="text-sm font-medium text-gray-700">
                Enable Dynamic Pricing
              </label>
            </div>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-purple-900">Notifications</h3>
              <p className="text-sm text-purple-600">Configure alert and notification settings</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="low_stock_alerts"
                checked={settings.low_stock_alerts}
                onChange={(e) => handleSettingChange('low_stock_alerts', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="low_stock_alerts" className="text-sm font-medium text-gray-700">
                Low Stock Alerts
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="out_of_stock_alerts"
                checked={settings.out_of_stock_alerts}
                onChange={(e) => handleSettingChange('out_of_stock_alerts', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="out_of_stock_alerts" className="text-sm font-medium text-gray-700">
                Out of Stock Alerts
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="price_change_alerts"
                checked={settings.price_change_alerts}
                onChange={(e) => handleSettingChange('price_change_alerts', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="price_change_alerts" className="text-sm font-medium text-gray-700">
                Price Change Alerts
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="email_notifications"
                checked={settings.email_notifications}
                onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="email_notifications" className="text-sm font-medium text-gray-700">
                Email Notifications
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sms_notifications"
                checked={settings.sms_notifications}
                onChange={(e) => handleSettingChange('sms_notifications', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="sms_notifications" className="text-sm font-medium text-gray-700">
                SMS Notifications
              </label>
            </div>
          </div>
        </GlassCard>

        {/* Security & Performance */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-900">Security & Performance</h3>
              <p className="text-sm text-red-600">Configure security and performance settings</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="require_approval_for_stock_adjustments"
                checked={settings.require_approval_for_stock_adjustments}
                onChange={(e) => handleSettingChange('require_approval_for_stock_adjustments', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="require_approval_for_stock_adjustments" className="text-sm font-medium text-gray-700">
                Require Approval for Stock Adjustments
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="require_approval_for_price_changes"
                checked={settings.require_approval_for_price_changes}
                onChange={(e) => handleSettingChange('require_approval_for_price_changes', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="require_approval_for_price_changes" className="text-sm font-medium text-gray-700">
                Require Approval for Price Changes
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_audit_logging"
                checked={settings.enable_audit_logging}
                onChange={(e) => handleSettingChange('enable_audit_logging', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="enable_audit_logging" className="text-sm font-medium text-gray-700">
                Enable Audit Logging
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cache_inventory_data"
                checked={settings.cache_inventory_data}
                onChange={(e) => handleSettingChange('cache_inventory_data', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="cache_inventory_data" className="text-sm font-medium text-gray-700">
                Cache Inventory Data
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_analytics"
                checked={settings.enable_analytics}
                onChange={(e) => handleSettingChange('enable_analytics', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="enable_analytics" className="text-sm font-medium text-gray-700">
                Enable Analytics
              </label>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <GlassButton
            onClick={handleSaveSettings}
            icon={<Save size={18} />}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </GlassButton>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsTab;
