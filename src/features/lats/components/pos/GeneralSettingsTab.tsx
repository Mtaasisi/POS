// General Settings Tab Component
import React, { forwardRef, useImperativeHandle } from 'react';
import { Settings, Monitor, Eye, Zap, Database, Calculator } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { SettingsSection } from './UniversalFormComponents';
import { ToggleSwitch, NumberInput, TextInput, Select } from './UniversalFormComponents';
import { useGeneralSettings } from '../../../../hooks/usePOSSettings';

export interface GeneralSettingsTabRef {
  saveSettings: () => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
}

const GeneralSettingsTab = forwardRef<GeneralSettingsTabRef>((props, ref) => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useGeneralSettings();

  const handleSave = async () => {
    console.log(`🔧 GeneralSettingsTab.handleSave called`);
    console.log(`📊 Current settings:`, settings);
    
    const success = await saveSettings(settings);
    console.log(`✅ Save result:`, success);
    
    if (success) {
      console.log(`🎉 General settings saved successfully`);
      // Force refresh the context after saving
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { type: 'general' } }));
    } else {
      console.error(`❌ General settings save failed`);
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
      title="General Settings"
      description="Configure basic interface and behavior settings for your POS system"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
      isDirty={false} // Add default value for now
    >
      {/* Interface Settings */}
      <SettingsSection
        title="Interface Settings"
        description="Customize the look and feel of your POS interface"
        icon={<Monitor className="w-5 h-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Theme"
            value={settings.theme}
            onChange={(value) => handleSettingChange('theme', value)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'auto', label: 'Auto' }
            ]}
          />
          
          <Select
            label="Language"
            value={settings.language}
            onChange={(value) => handleSettingChange('language', value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'sw', label: 'Swahili' },
              { value: 'fr', label: 'French' }
            ]}
          />
          
          <TextInput
            label="Currency"
            value={settings.currency}
            onChange={(value) => handleSettingChange('currency', value)}
            placeholder="TZS"
          />
          
          <TextInput
            label="Timezone"
            value={settings.timezone}
            onChange={(value) => handleSettingChange('timezone', value)}
            placeholder="Africa/Dar_es_Salaam"
          />
          
          <TextInput
            label="Date Format"
            value={settings.date_format}
            onChange={(value) => handleSettingChange('date_format', value)}
            placeholder="DD/MM/YYYY"
          />
          
          <Select
            label="Time Format"
            value={settings.time_format}
            onChange={(value) => handleSettingChange('time_format', value)}
            options={[
              { value: '12', label: '12-hour' },
              { value: '24', label: '24-hour' }
            ]}
          />
        </div>
      </SettingsSection>

      {/* Display Settings */}
      <SettingsSection
        title="Display Settings"
        description="Control what information is shown in the POS interface"
        icon={<Eye className="w-5 h-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Show Product Images"
            checked={settings.show_product_images}
            onChange={(checked) => handleSettingChange('show_product_images', checked)}
          />
          
          <ToggleSwitch
            label="Show Stock Levels"
            checked={settings.show_stock_levels}
            onChange={(checked) => handleSettingChange('show_stock_levels', checked)}
          />
          
          <ToggleSwitch
            label="Show Prices"
            checked={settings.show_prices}
            onChange={(checked) => handleSettingChange('show_prices', checked)}
          />
          
          <ToggleSwitch
            label="Show Barcodes"
            checked={settings.show_barcodes}
            onChange={(checked) => handleSettingChange('show_barcodes', checked)}
          />
          
          <NumberInput
            label="Products Per Page"
            value={settings.products_per_page}
            onChange={(value) => handleSettingChange('products_per_page', value)}
            min={10}
            max={100}
            step={5}
          />
        </div>
      </SettingsSection>

      {/* Behavior Settings */}
      <SettingsSection
        title="Behavior Settings"
        description="Configure how the POS system behaves during operation"
        icon={<Settings className="w-5 h-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Auto Complete Search"
            checked={settings.auto_complete_search}
            onChange={(checked) => handleSettingChange('auto_complete_search', checked)}
          />
          
          <ToggleSwitch
            label="Confirm Delete"
            checked={settings.confirm_delete}
            onChange={(checked) => handleSettingChange('confirm_delete', checked)}
          />
          
          <ToggleSwitch
            label="Show Confirmations"
            checked={settings.show_confirmations}
            onChange={(checked) => handleSettingChange('show_confirmations', checked)}
          />
          
          <ToggleSwitch
            label="Enable Sound Effects"
            checked={settings.enable_sound_effects}
            onChange={(checked) => handleSettingChange('enable_sound_effects', checked)}
          />
          
          <ToggleSwitch
            label="Enable Animations"
            checked={settings.enable_animations}
            onChange={(checked) => handleSettingChange('enable_animations', checked)}
          />
        </div>
      </SettingsSection>

      {/* Performance Settings */}
      <SettingsSection
        title="Performance Settings"
        description="Optimize system performance and caching"
        icon={<Zap className="w-5 h-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Caching"
            checked={settings.enable_caching}
            onChange={(checked) => handleSettingChange('enable_caching', checked)}
          />
          
          <NumberInput
            label="Cache Duration (seconds)"
            value={settings.cache_duration}
            onChange={(value) => handleSettingChange('cache_duration', value)}
            min={60}
            max={3600}
            step={30}
          />
          
          <ToggleSwitch
            label="Enable Lazy Loading"
            checked={settings.enable_lazy_loading}
            onChange={(checked) => handleSettingChange('enable_lazy_loading', checked)}
          />
          
          <NumberInput
            label="Max Search Results"
            value={settings.max_search_results}
            onChange={(value) => handleSettingChange('max_search_results', value)}
            min={10}
            max={200}
            step={10}
          />
        </div>
      </SettingsSection>

      {/* Tax Settings */}
      <SettingsSection
        title="Tax Settings"
        description="Configure tax calculation for sales"
        icon={<Calculator className="w-5 h-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Tax"
            checked={settings.enable_tax}
            onChange={(checked) => handleSettingChange('enable_tax', checked)}
          />
          
          {settings.enable_tax && (
            <NumberInput
              label="Tax Rate (%)"
              value={settings.tax_rate}
              onChange={(value) => handleSettingChange('tax_rate', value)}
              min={0}
              max={50}
              step={0.1}
            />
          )}
        </div>
      </SettingsSection>
          </UniversalSettingsTab>
    );
  });
  
  export default GeneralSettingsTab;
