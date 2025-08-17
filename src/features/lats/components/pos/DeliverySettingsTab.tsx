// Delivery Settings Tab Component
import React from 'react';
import { Truck, MapPin, Clock, Bell, Users, Settings } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select, TimeInput } from './UniversalFormComponents';
import { useDeliverySettings } from '../../../../hooks/usePOSSettings';

const DeliverySettingsTab: React.FC = () => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useDeliverySettings();

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
      title="Delivery Settings"
      description="Configure delivery options, areas, and driver management"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
      isDirty={false} // Add default value for now
    >
      {/* General Delivery Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Truck className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">General Delivery</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Delivery"
            checked={settings.enable_delivery}
            onChange={(checked) => handleSettingChange('enable_delivery', checked)}
          />
          <NumberInput
            label="Default Delivery Fee"
            value={settings.default_delivery_fee}
            onChange={(value) => handleSettingChange('default_delivery_fee', value)}
            min={0}
            max={50000}
            step={100}
          />
          <NumberInput
            label="Free Delivery Threshold"
            value={settings.free_delivery_threshold}
            onChange={(value) => handleSettingChange('free_delivery_threshold', value)}
            min={0}
            max={1000000}
            step={1000}
          />
          <NumberInput
            label="Max Delivery Distance (km)"
            value={settings.max_delivery_distance}
            onChange={(value) => handleSettingChange('max_delivery_distance', value)}
            min={1}
            max={100}
            step={1}
          />
        </div>
      </div>

      {/* Delivery Areas */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <MapPin className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Delivery Areas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Delivery Areas"
            checked={settings.enable_delivery_areas}
            onChange={(checked) => handleSettingChange('enable_delivery_areas', checked)}
          />
          <TextInput
            label="Delivery Areas (comma separated)"
            value={settings.delivery_areas.join(', ')}
            onChange={(value) => handleSettingChange('delivery_areas', value.split(', ').filter(area => area.trim()))}
            placeholder="City Center, Suburbs, Outskirts"
          />
        </div>
      </div>

      {/* Time Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Time Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Delivery Hours"
            checked={settings.enable_delivery_hours}
            onChange={(checked) => handleSettingChange('enable_delivery_hours', checked)}
          />
          <TimeInput
            label="Delivery Start Time"
            value={settings.delivery_start_time}
            onChange={(value) => handleSettingChange('delivery_start_time', value)}
          />
          <TimeInput
            label="Delivery End Time"
            value={settings.delivery_end_time}
            onChange={(value) => handleSettingChange('delivery_end_time', value)}
          />
          <ToggleSwitch
            label="Enable Same Day Delivery"
            checked={settings.enable_same_day_delivery}
            onChange={(checked) => handleSettingChange('enable_same_day_delivery', checked)}
          />
          <ToggleSwitch
            label="Enable Next Day Delivery"
            checked={settings.enable_next_day_delivery}
            onChange={(checked) => handleSettingChange('enable_next_day_delivery', checked)}
          />
          <TextInput
            label="Delivery Time Slots (comma separated)"
            value={settings.delivery_time_slots.join(', ')}
            onChange={(value) => handleSettingChange('delivery_time_slots', value.split(', ').filter(slot => slot.trim()))}
            placeholder="Morning, Afternoon, Evening"
          />
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Bell className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Notify Customer on Delivery"
            checked={settings.notify_customer_on_delivery}
            onChange={(checked) => handleSettingChange('notify_customer_on_delivery', checked)}
          />
          <ToggleSwitch
            label="Notify Driver on Assignment"
            checked={settings.notify_driver_on_assignment}
            onChange={(checked) => handleSettingChange('notify_driver_on_assignment', checked)}
          />
          <ToggleSwitch
            label="Enable SMS Notifications"
            checked={settings.enable_sms_notifications}
            onChange={(checked) => handleSettingChange('enable_sms_notifications', checked)}
          />
          <ToggleSwitch
            label="Enable Email Notifications"
            checked={settings.enable_email_notifications}
            onChange={(checked) => handleSettingChange('enable_email_notifications', checked)}
          />
        </div>
      </div>

      {/* Driver Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Driver Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Driver Assignment"
            checked={settings.enable_driver_assignment}
            onChange={(checked) => handleSettingChange('enable_driver_assignment', checked)}
          />
          <NumberInput
            label="Driver Commission (%)"
            value={settings.driver_commission}
            onChange={(value) => handleSettingChange('driver_commission', value)}
            min={0}
            max={50}
            step={0.01}
          />
          <ToggleSwitch
            label="Require Signature"
            checked={settings.require_signature}
            onChange={(checked) => handleSettingChange('require_signature', checked)}
          />
          <ToggleSwitch
            label="Enable Driver Tracking"
            checked={settings.enable_driver_tracking}
            onChange={(checked) => handleSettingChange('enable_driver_tracking', checked)}
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
          <ToggleSwitch
            label="Enable Scheduled Delivery"
            checked={settings.enable_scheduled_delivery}
            onChange={(checked) => handleSettingChange('enable_scheduled_delivery', checked)}
          />
          <ToggleSwitch
            label="Enable Partial Delivery"
            checked={settings.enable_partial_delivery}
            onChange={(checked) => handleSettingChange('enable_partial_delivery', checked)}
          />
          <ToggleSwitch
            label="Require Advance Payment"
            checked={settings.require_advance_payment}
            onChange={(checked) => handleSettingChange('require_advance_payment', checked)}
          />
          <NumberInput
            label="Advance Payment Percent (%)"
            value={settings.advance_payment_percent}
            onChange={(value) => handleSettingChange('advance_payment_percent', value)}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
};

export default DeliverySettingsTab;
