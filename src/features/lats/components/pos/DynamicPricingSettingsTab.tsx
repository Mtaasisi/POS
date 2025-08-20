// Dynamic Pricing Settings Tab Component
import React, { forwardRef, useImperativeHandle } from 'react';
import { TrendingUp, Percent, Clock, Users, Gift, Target } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select, TimeInput } from './UniversalFormComponents';
import { useDynamicPricingSettings } from '../../../../hooks/usePOSSettings';

export interface DynamicPricingSettingsTabRef {
  saveSettings: () => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
}

const DynamicPricingSettingsTab = forwardRef<DynamicPricingSettingsTabRef>((props, ref) => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useDynamicPricingSettings();

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
      title="Dynamic Pricing Settings"
      description="Configure automatic pricing rules and discount strategies"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
      isDirty={false} // Add default value for now
    >
      {/* General Pricing Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">General Pricing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Dynamic Pricing"
            checked={settings.enable_dynamic_pricing}
            onChange={(checked) => handleSettingChange('enable_dynamic_pricing', checked)}
          />
          <ToggleSwitch
            label="Enable Loyalty Pricing"
            checked={settings.enable_loyalty_pricing}
            onChange={(checked) => handleSettingChange('enable_loyalty_pricing', checked)}
          />
          <ToggleSwitch
            label="Enable Bulk Pricing"
            checked={settings.enable_bulk_pricing}
            onChange={(checked) => handleSettingChange('enable_bulk_pricing', checked)}
          />
          <ToggleSwitch
            label="Enable Time-based Pricing"
            checked={settings.enable_time_based_pricing}
            onChange={(checked) => handleSettingChange('enable_time_based_pricing', checked)}
          />
          <ToggleSwitch
            label="Enable Customer Pricing"
            checked={settings.enable_customer_pricing}
            onChange={(checked) => handleSettingChange('enable_customer_pricing', checked)}
          />
          <ToggleSwitch
            label="Enable Special Events"
            checked={settings.enable_special_events}
            onChange={(checked) => handleSettingChange('enable_special_events', checked)}
          />
        </div>
      </div>

      {/* Loyalty Pricing Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Gift className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Loyalty Pricing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput
            label="Loyalty Discount (%)"
            value={settings.loyalty_discount_percent}
            onChange={(value) => handleSettingChange('loyalty_discount_percent', value)}
            min={0}
            max={100}
            step={0.01}
          />
          <NumberInput
            label="Points Threshold"
            value={settings.loyalty_points_threshold}
            onChange={(value) => handleSettingChange('loyalty_points_threshold', value)}
            min={1}
            max={10000}
            step={100}
          />
          <NumberInput
            label="Max Discount (%)"
            value={settings.loyalty_max_discount}
            onChange={(value) => handleSettingChange('loyalty_max_discount', value)}
            min={0}
            max={100}
            step={0.01}
          />
        </div>
      </div>

      {/* Bulk Pricing Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Target className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Bulk Pricing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Bulk Discount"
            checked={settings.bulk_discount_enabled}
            onChange={(checked) => handleSettingChange('bulk_discount_enabled', checked)}
          />
          <NumberInput
            label="Bulk Threshold"
            value={settings.bulk_discount_threshold}
            onChange={(value) => handleSettingChange('bulk_discount_threshold', value)}
            min={1}
            max={1000}
            step={1}
          />
          <NumberInput
            label="Bulk Discount (%)"
            value={settings.bulk_discount_percent}
            onChange={(value) => handleSettingChange('bulk_discount_percent', value)}
            min={0}
            max={100}
            step={0.01}
          />
        </div>
      </div>

      {/* Time-based Pricing Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Time-based Pricing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Time-based Discount"
            checked={settings.time_based_discount_enabled}
            onChange={(checked) => handleSettingChange('time_based_discount_enabled', checked)}
          />
          <TimeInput
            label="Start Time"
            value={settings.time_based_start_time}
            onChange={(value) => handleSettingChange('time_based_start_time', value)}
          />
          <TimeInput
            label="End Time"
            value={settings.time_based_end_time}
            onChange={(value) => handleSettingChange('time_based_end_time', value)}
          />
          <NumberInput
            label="Time-based Discount (%)"
            value={settings.time_based_discount_percent}
            onChange={(value) => handleSettingChange('time_based_discount_percent', value)}
            min={0}
            max={100}
            step={0.01}
          />
        </div>
      </div>

      {/* Customer-based Pricing Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Customer-based Pricing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Customer Pricing"
            checked={settings.customer_pricing_enabled}
            onChange={(checked) => handleSettingChange('customer_pricing_enabled', checked)}
          />
          <NumberInput
            label="VIP Customer Discount (%)"
            value={settings.vip_customer_discount}
            onChange={(value) => handleSettingChange('vip_customer_discount', value)}
            min={0}
            max={100}
            step={0.01}
          />
          <NumberInput
            label="Regular Customer Discount (%)"
            value={settings.regular_customer_discount}
            onChange={(value) => handleSettingChange('regular_customer_discount', value)}
            min={0}
            max={100}
            step={0.01}
          />
        </div>
      </div>

      {/* Special Events Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Gift className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Special Events</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Special Events"
            checked={settings.special_events_enabled}
            onChange={(checked) => handleSettingChange('special_events_enabled', checked)}
          />
          <NumberInput
            label="Special Event Discount (%)"
            value={settings.special_event_discount_percent}
            onChange={(value) => handleSettingChange('special_event_discount_percent', value)}
            min={0}
            max={100}
            step={0.01}
          />
        </div>
      </div>
          </UniversalSettingsTab>
    );
  });
  
  export default DynamicPricingSettingsTab;
