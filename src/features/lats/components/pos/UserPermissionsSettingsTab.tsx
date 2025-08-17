// User Permissions Settings Tab Component
import React from 'react';
import { Shield, Users, CreditCard, Package, Settings, BarChart3, FileText } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select } from './UniversalFormComponents';
import { useUserPermissionsSettings } from '../../../../hooks/usePOSSettings';

const UserPermissionsSettingsTab: React.FC = () => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useUserPermissionsSettings();

  const handleSave = async () => {
    const success = await saveSettings(settings);
    if (success) {
      // Settings saved successfully
    }
  };

  const handleReset = async () => {
    const success = await resetSettings();
    if (success) {
      // Settings reset successfully
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <UniversalSettingsTab
      title="User Permissions Settings"
      description="Configure user access levels and security permissions"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
      isDirty={false} // Add default value for now
    >
      {/* General POS Access */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">General POS Access</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable POS Access"
            checked={settings.enable_pos_access}
            onChange={(checked) => handleSettingChange('enable_pos_access', checked)}
          />
          <ToggleSwitch
            label="Require Login"
            checked={settings.require_login}
            onChange={(checked) => handleSettingChange('require_login', checked)}
          />
          <NumberInput
            label="Session Timeout (minutes)"
            value={settings.session_timeout}
            onChange={(value) => handleSettingChange('session_timeout', value)}
            min={5}
            max={480}
            step={5}
          />
          <NumberInput
            label="Max Login Attempts"
            value={settings.max_login_attempts}
            onChange={(value) => handleSettingChange('max_login_attempts', value)}
            min={3}
            max={10}
            step={1}
          />
        </div>
      </div>

      {/* Inventory Management */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Package className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Allow Inventory View"
            checked={settings.allow_inventory_view}
            onChange={(checked) => handleSettingChange('allow_inventory_view', checked)}
          />
          <ToggleSwitch
            label="Allow Inventory Edit"
            checked={settings.allow_inventory_edit}
            onChange={(checked) => handleSettingChange('allow_inventory_edit', checked)}
          />
          <ToggleSwitch
            label="Allow Stock Adjustment"
            checked={settings.allow_stock_adjustment}
            onChange={(checked) => handleSettingChange('allow_stock_adjustment', checked)}
          />
          <ToggleSwitch
            label="Allow Product Creation"
            checked={settings.allow_product_creation}
            onChange={(checked) => handleSettingChange('allow_product_creation', checked)}
          />
          <ToggleSwitch
            label="Allow Price Changes"
            checked={settings.allow_price_changes}
            onChange={(checked) => handleSettingChange('allow_price_changes', checked)}
          />
        </div>
      </div>

      {/* Customer Management */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Customer Management</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Allow Customer View"
            checked={settings.allow_customer_view}
            onChange={(checked) => handleSettingChange('allow_customer_view', checked)}
          />
          <ToggleSwitch
            label="Allow Customer Edit"
            checked={settings.allow_customer_edit}
            onChange={(checked) => handleSettingChange('allow_customer_edit', checked)}
          />
          <ToggleSwitch
            label="Allow Customer Creation"
            checked={settings.allow_customer_creation}
            onChange={(checked) => handleSettingChange('allow_customer_creation', checked)}
          />
          <ToggleSwitch
            label="Allow Customer Deletion"
            checked={settings.allow_customer_deletion}
            onChange={(checked) => handleSettingChange('allow_customer_deletion', checked)}
          />
          <ToggleSwitch
            label="Allow Customer Data Export"
            checked={settings.allow_customer_data_export}
            onChange={(checked) => handleSettingChange('allow_customer_data_export', checked)}
          />
        </div>
      </div>

      {/* Financial Operations */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CreditCard className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Financial Operations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Allow Sales View"
            checked={settings.allow_sales_view}
            onChange={(checked) => handleSettingChange('allow_sales_view', checked)}
          />
          <ToggleSwitch
            label="Allow Sales Creation"
            checked={settings.allow_sales_creation}
            onChange={(checked) => handleSettingChange('allow_sales_creation', checked)}
          />
          <ToggleSwitch
            label="Allow Sales Void"
            checked={settings.allow_sales_void}
            onChange={(checked) => handleSettingChange('allow_sales_void', checked)}
          />
          <ToggleSwitch
            label="Allow Refunds"
            checked={settings.allow_refunds}
            onChange={(checked) => handleSettingChange('allow_refunds', checked)}
          />
          <ToggleSwitch
            label="Allow Discounts"
            checked={settings.allow_discounts}
            onChange={(checked) => handleSettingChange('allow_discounts', checked)}
          />
          <NumberInput
            label="Maximum Discount (%)"
            value={settings.max_discount_percent}
            onChange={(value) => handleSettingChange('max_discount_percent', value)}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </div>

      {/* System Administration */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">System Administration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Allow User Management"
            checked={settings.allow_user_management}
            onChange={(checked) => handleSettingChange('allow_user_management', checked)}
          />
          <ToggleSwitch
            label="Allow Settings Access"
            checked={settings.allow_settings_access}
            onChange={(checked) => handleSettingChange('allow_settings_access', checked)}
          />
          <ToggleSwitch
            label="Allow System Backup"
            checked={settings.allow_system_backup}
            onChange={(checked) => handleSettingChange('allow_system_backup', checked)}
          />
          <ToggleSwitch
            label="Allow Data Export"
            checked={settings.allow_data_export}
            onChange={(checked) => handleSettingChange('allow_data_export', checked)}
          />
          <ToggleSwitch
            label="Allow Reports Access"
            checked={settings.allow_reports_access}
            onChange={(checked) => handleSettingChange('allow_reports_access', checked)}
          />
        </div>
      </div>

      {/* Security Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Require Password Change"
            checked={settings.require_password_change}
            onChange={(checked) => handleSettingChange('require_password_change', checked)}
          />
          <NumberInput
            label="Password Expiry (days)"
            value={settings.password_expiry_days}
            onChange={(value) => handleSettingChange('password_expiry_days', value)}
            min={30}
            max={365}
            step={30}
          />
          <ToggleSwitch
            label="Require Two-Factor Authentication"
            checked={settings.require_two_factor}
            onChange={(checked) => handleSettingChange('require_two_factor', checked)}
          />
          <ToggleSwitch
            label="Allow Remote Access"
            checked={settings.allow_remote_access}
            onChange={(checked) => handleSettingChange('allow_remote_access', checked)}
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
};

export default UserPermissionsSettingsTab;
