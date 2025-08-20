import React from 'react';
import { useUnifiedSettings } from './UnifiedSettingsContext';

// Example settings form component
const UnifiedSettingsExample: React.FC = () => {
  const { settings, updateSettings, isLoading } = useUnifiedSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Settings Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">User Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={settings.userSettings.displayName}
              onChange={(e) => updateSettings({
                userSettings: { ...settings.userSettings, displayName: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={settings.userSettings.language}
              onChange={(e) => updateSettings({
                userSettings: { ...settings.userSettings, language: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Pricing Settings Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Dynamic Pricing Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enable_dynamic_pricing"
              checked={settings.dynamicPricingSettings.enable_dynamic_pricing}
              onChange={(e) => updateSettings({
                dynamicPricingSettings: { 
                  ...settings.dynamicPricingSettings, 
                  enable_dynamic_pricing: e.target.checked 
                }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enable_dynamic_pricing" className="ml-2 text-sm text-gray-700">
              Enable Dynamic Pricing
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enable_loyalty_pricing"
              checked={settings.dynamicPricingSettings.enable_loyalty_pricing}
              onChange={(e) => updateSettings({
                dynamicPricingSettings: { 
                  ...settings.dynamicPricingSettings, 
                  enable_loyalty_pricing: e.target.checked 
                }
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enable_loyalty_pricing" className="ml-2 text-sm text-gray-700">
              Enable Loyalty Pricing
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loyalty Discount (%)
            </label>
            <input
              type="number"
              value={settings.dynamicPricingSettings.loyalty_discount_percent}
              onChange={(e) => updateSettings({
                dynamicPricingSettings: { 
                  ...settings.dynamicPricingSettings, 
                  loyalty_discount_percent: parseFloat(e.target.value) 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* General Settings Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select
              value={settings.generalSettings.theme}
              onChange={(e) => updateSettings({
                generalSettings: { ...settings.generalSettings, theme: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={settings.generalSettings.currency}
              onChange={(e) => updateSettings({
                generalSettings: { ...settings.generalSettings, currency: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TZS">TZS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Note: The save button is automatically included by the wrapper */}
    </div>
  );
};

export default UnifiedSettingsExample;
