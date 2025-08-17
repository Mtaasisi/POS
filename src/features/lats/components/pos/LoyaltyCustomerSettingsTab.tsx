// Loyalty & Customer Settings Tab Component
import React from 'react';
import { Gift, Users, MessageCircle, Calendar, Star, CreditCard, Bell, BarChart3 } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select } from './UniversalFormComponents';
import { useLoyaltyCustomerSettings } from '../../../../hooks/usePOSSettings';

const LoyaltyCustomerSettingsTab: React.FC = () => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useLoyaltyCustomerSettings();

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
      title="Loyalty & Customer Settings"
      description="Configure loyalty program and customer management features"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
      isDirty={false} // Add default value for now
    >
      {/* Loyalty Program */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Gift className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Loyalty Program</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Loyalty Program"
            checked={settings.enable_loyalty_program}
            onChange={(checked) => handleSettingChange('enable_loyalty_program', checked)}
          />
          <NumberInput
            label="Points per Currency"
            value={settings.points_per_currency}
            onChange={(value) => handleSettingChange('points_per_currency', value)}
            min={1}
            max={1000}
            step={1}
          />
          <NumberInput
            label="Points Redemption Rate"
            value={settings.points_redemption_rate}
            onChange={(value) => handleSettingChange('points_redemption_rate', value)}
            min={0.1}
            max={10}
            step={0.1}
          />
          <NumberInput
            label="Points Expiry (days)"
            value={settings.points_expiry_days}
            onChange={(value) => handleSettingChange('points_expiry_days', value)}
            min={30}
            max={3650}
            step={30}
          />
          <ToggleSwitch
            label="Auto Enroll Customers"
            checked={settings.auto_enroll_customers}
            onChange={(checked) => handleSettingChange('auto_enroll_customers', checked)}
          />
        </div>
      </div>

      {/* Customer Management */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Customer Management</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Customer Profiles"
            checked={settings.enable_customer_profiles}
            onChange={(checked) => handleSettingChange('enable_customer_profiles', checked)}
          />
          <ToggleSwitch
            label="Require Customer Info"
            checked={settings.require_customer_info}
            onChange={(checked) => handleSettingChange('require_customer_info', checked)}
          />
          <ToggleSwitch
            label="Allow Customer Tags"
            checked={settings.allow_customer_tags}
            onChange={(checked) => handleSettingChange('allow_customer_tags', checked)}
          />
          <ToggleSwitch
            label="Enable Customer Categories"
            checked={settings.enable_customer_categories}
            onChange={(checked) => handleSettingChange('enable_customer_categories', checked)}
          />
        </div>
      </div>

      {/* Rewards & Discounts */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Star className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Rewards & Discounts</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput
            label="Birthday Discount (%)"
            value={settings.birthday_discount}
            onChange={(value) => handleSettingChange('birthday_discount', value)}
            min={0}
            max={100}
            step={5}
          />
          <NumberInput
            label="Anniversary Discount (%)"
            value={settings.anniversary_discount}
            onChange={(value) => handleSettingChange('anniversary_discount', value)}
            min={0}
            max={100}
            step={5}
          />
          <NumberInput
            label="First Purchase Discount (%)"
            value={settings.first_purchase_discount}
            onChange={(value) => handleSettingChange('first_purchase_discount', value)}
            min={0}
            max={100}
            step={5}
          />
          <NumberInput
            label="Referral Bonus (points)"
            value={settings.referral_bonus}
            onChange={(value) => handleSettingChange('referral_bonus', value)}
            min={0}
            max={10000}
            step={50}
          />
        </div>
      </div>

      {/* Communication Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <MessageCircle className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Communication Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <ToggleSwitch
            label="Enable WhatsApp Notifications"
            checked={settings.enable_whatsapp_notifications}
            onChange={(checked) => handleSettingChange('enable_whatsapp_notifications', checked)}
          />
          <Select
            label="Notification Frequency"
            value={settings.notification_frequency}
            onChange={(value) => handleSettingChange('notification_frequency', value)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' }
            ]}
          />
        </div>
      </div>

      {/* Customer Analytics */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Customer Analytics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Track Customer Behavior"
            checked={settings.track_customer_behavior}
            onChange={(checked) => handleSettingChange('track_customer_behavior', checked)}
          />
          <ToggleSwitch
            label="Enable Customer Segmentation"
            checked={settings.enable_customer_segmentation}
            onChange={(checked) => handleSettingChange('enable_customer_segmentation', checked)}
          />
          <ToggleSwitch
            label="Keep Customer History"
            checked={settings.keep_customer_history}
            onChange={(checked) => handleSettingChange('keep_customer_history', checked)}
          />
          <ToggleSwitch
            label="Enable Customer Feedback"
            checked={settings.enable_customer_feedback}
            onChange={(checked) => handleSettingChange('enable_customer_feedback', checked)}
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
};

export default LoyaltyCustomerSettingsTab;
