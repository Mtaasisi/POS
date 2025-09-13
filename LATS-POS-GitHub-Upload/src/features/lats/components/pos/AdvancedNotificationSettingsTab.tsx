// Advanced Notification Settings Tab Component
import React, { forwardRef, useImperativeHandle } from 'react';
import { Bell, Volume2, Mail, MessageSquare, Smartphone, Monitor, Settings } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select, TimeInput } from './UniversalFormComponents';
import { useNotificationSettings } from '../../../../hooks/usePOSSettings';


export interface AdvancedNotificationSettingsTabRef {
  saveSettings: () => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
}

const AdvancedNotificationSettingsTab = forwardRef<AdvancedNotificationSettingsTabRef>((props, ref) => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useNotificationSettings();

  const handleSave = async () => {
    const success = await saveSettings(settings);
    if (success) {
      // Settings saved successfully
    }
    return success;
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
  // Expose save and reset functions through ref
  useImperativeHandle(ref, () => ({
    saveSettings: handleSave,
    resetSettings: handleReset
  }));

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
      title="Advanced Notification Settings"
      description="Configure comprehensive notification preferences and channels"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {/* General Notification Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Bell className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">General Notification Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Notifications"
            checked={settings.enable_notifications}
            onChange={(checked) => handleSettingChange('enable_notifications', checked)}
          />
          <ToggleSwitch
            label="Enable Sound"
            checked={settings.enable_sound}
            onChange={(checked) => handleSettingChange('enable_sound', checked)}
          />
          <ToggleSwitch
            label="Enable Vibration"
            checked={settings.enable_vibration}
            onChange={(checked) => handleSettingChange('enable_vibration', checked)}
          />
          <ToggleSwitch
            label="Enable Popups"
            checked={settings.enable_popups}
            onChange={(checked) => handleSettingChange('enable_popups', checked)}
          />
        </div>
      </div>

      {/* Sales Notifications */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <MessageSquare className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Sales Notifications</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Notify on Sale"
            checked={settings.notify_on_sale}
            onChange={(checked) => handleSettingChange('notify_on_sale', checked)}
          />
          <ToggleSwitch
            label="Notify on Refund"
            checked={settings.notify_on_refund}
            onChange={(checked) => handleSettingChange('notify_on_refund', checked)}
          />
          <ToggleSwitch
            label="Notify on Void"
            checked={settings.notify_on_void}
            onChange={(checked) => handleSettingChange('notify_on_void', checked)}
          />
          <ToggleSwitch
            label="Notify on Discount"
            checked={settings.notify_on_discount}
            onChange={(checked) => handleSettingChange('notify_on_discount', checked)}
          />
        </div>
      </div>

      {/* Inventory Notifications */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Monitor className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Inventory Notifications</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Notify Low Stock"
            checked={settings.notify_low_stock}
            onChange={(checked) => handleSettingChange('notify_low_stock', checked)}
          />
          <ToggleSwitch
            label="Notify Out of Stock"
            checked={settings.notify_out_of_stock}
            onChange={(checked) => handleSettingChange('notify_out_of_stock', checked)}
          />
          <ToggleSwitch
            label="Notify Stock Update"
            checked={settings.notify_stock_update}
            onChange={(checked) => handleSettingChange('notify_stock_update', checked)}
          />
          <NumberInput
            label="Low Stock Threshold"
            value={settings.low_stock_threshold}
            onChange={(value) => handleSettingChange('low_stock_threshold', value)}
            min={1}
            max={100}
            step={1}
          />
        </div>
      </div>

      {/* Customer Notifications */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Smartphone className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Customer Notifications</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Notify New Customer"
            checked={settings.notify_new_customer}
            onChange={(checked) => handleSettingChange('notify_new_customer', checked)}
          />
          <ToggleSwitch
            label="Notify Customer Birthday"
            checked={settings.notify_customer_birthday}
            onChange={(checked) => handleSettingChange('notify_customer_birthday', checked)}
          />
          <ToggleSwitch
            label="Notify Customer Anniversary"
            checked={settings.notify_customer_anniversary}
            onChange={(checked) => handleSettingChange('notify_customer_anniversary', checked)}
          />
          <ToggleSwitch
            label="Notify Customer Feedback"
            checked={settings.notify_customer_feedback}
            onChange={(checked) => handleSettingChange('notify_customer_feedback', checked)}
          />
        </div>
      </div>

      {/* System Notifications */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Volume2 className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">System Notifications</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Notify Errors"
            checked={settings.notify_errors}
            onChange={(checked) => handleSettingChange('notify_errors', checked)}
          />
          <ToggleSwitch
            label="Notify Maintenance"
            checked={settings.notify_maintenance}
            onChange={(checked) => handleSettingChange('notify_maintenance', checked)}
          />
          <ToggleSwitch
            label="Notify Updates"
            checked={settings.notify_updates}
            onChange={(checked) => handleSettingChange('notify_updates', checked)}
          />
          <ToggleSwitch
            label="Notify Backup"
            checked={settings.notify_backup}
            onChange={(checked) => handleSettingChange('notify_backup', checked)}
          />
        </div>
      </div>

      {/* Communication Channels */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Mail className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Communication Channels</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable SMS"
            checked={settings.enable_sms}
            onChange={(checked) => handleSettingChange('enable_sms', checked)}
          />
          <ToggleSwitch
            label="Enable Email"
            checked={settings.enable_email}
            onChange={(checked) => handleSettingChange('enable_email', checked)}
          />
          <ToggleSwitch
            label="Enable WhatsApp"
            checked={settings.enable_whatsapp}
            onChange={(checked) => handleSettingChange('enable_whatsapp', checked)}
          />
          <ToggleSwitch
            label="Enable Push Notifications"
            checked={settings.enable_push_notifications}
            onChange={(checked) => handleSettingChange('enable_push_notifications', checked)}
          />
          <ToggleSwitch
            label="Enable In-App Notifications"
            checked={settings.enable_in_app_notifications}
            onChange={(checked) => handleSettingChange('enable_in_app_notifications', checked)}
          />
        </div>
      </div>

      {/* Notification Schedule */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Schedule</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Quiet Hours"
            checked={settings.enable_quiet_hours}
            onChange={(checked) => handleSettingChange('enable_quiet_hours', checked)}
          />
          <TimeInput
            label="Quiet Hours Start"
            value={settings.quiet_hours_start}
            onChange={(value) => handleSettingChange('quiet_hours_start', value)}
          />
          <TimeInput
            label="Quiet Hours End"
            value={settings.quiet_hours_end}
            onChange={(value) => handleSettingChange('quiet_hours_end', value)}
          />
          <TextInput
            label="Timezone"
            value={settings.timezone}
            onChange={(value) => handleSettingChange('timezone', value)}
            placeholder="Africa/Dar_es_Salaam"
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput
            label="Notification Retention (days)"
            value={settings.notification_retention}
            onChange={(value) => handleSettingChange('notification_retention', value)}
            min={1}
            max={365}
            step={1}
          />
          <ToggleSwitch
            label="Enable Grouping"
            checked={settings.enable_grouping}
            onChange={(checked) => handleSettingChange('enable_grouping', checked)}
          />
          <ToggleSwitch
            label="Enable Priority"
            checked={settings.enable_priority}
            onChange={(checked) => handleSettingChange('enable_priority', checked)}
          />
          <ToggleSwitch
            label="Custom Tones"
            checked={settings.custom_tones}
            onChange={(checked) => handleSettingChange('custom_tones', checked)}
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
});

export default AdvancedNotificationSettingsTab;
