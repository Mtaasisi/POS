// Search & Filter Settings Tab Component
import React, { forwardRef, useImperativeHandle } from 'react';
import { Search, Filter, Zap, Eye, Clock, Settings } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select } from './UniversalFormComponents';
import { useSearchFilterSettings } from '../../../../hooks/usePOSSettings';


export interface SearchFilterSettingsTabRef {
  saveSettings: () => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
}

const SearchFilterSettingsTab = forwardRef<SearchFilterSettingsTabRef>((props, ref) => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useSearchFilterSettings();

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
      title="Search & Filter Settings"
      description="Configure search behavior, filters, and performance options"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
      isDirty={false} // Add default value for now
    >
      {/* General Search Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">General Search</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Smart Search"
            checked={settings.enable_smart_search}
            onChange={(checked) => handleSettingChange('enable_smart_search', checked)}
          />
          <ToggleSwitch
            label="Enable Auto Complete"
            checked={settings.enable_auto_complete}
            onChange={(checked) => handleSettingChange('enable_auto_complete', checked)}
          />
          <NumberInput
            label="Search Debounce Time (ms)"
            value={settings.search_debounce_time}
            onChange={(value) => handleSettingChange('search_debounce_time', value)}
            min={100}
            max={1000}
            step={50}
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
      </div>

      {/* Search Behavior */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Eye className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Search Behavior</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Fuzzy Search"
            checked={settings.enable_fuzzy_search}
            onChange={(checked) => handleSettingChange('enable_fuzzy_search', checked)}
          />
          <ToggleSwitch
            label="Enable Exact Match"
            checked={settings.enable_exact_match}
            onChange={(checked) => handleSettingChange('enable_exact_match', checked)}
          />
          <ToggleSwitch
            label="Enable Partial Match"
            checked={settings.enable_partial_match}
            onChange={(checked) => handleSettingChange('enable_partial_match', checked)}
          />
          <ToggleSwitch
            label="Search in Description"
            checked={settings.search_in_description}
            onChange={(checked) => handleSettingChange('search_in_description', checked)}
          />
          <ToggleSwitch
            label="Search in Barcode"
            checked={settings.search_in_barcode}
            onChange={(checked) => handleSettingChange('search_in_barcode', checked)}
          />
        </div>
      </div>

      {/* Filter Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Advanced Filters"
            checked={settings.enable_advanced_filters}
            onChange={(checked) => handleSettingChange('enable_advanced_filters', checked)}
          />
          <ToggleSwitch
            label="Enable Category Filter"
            checked={settings.enable_category_filter}
            onChange={(checked) => handleSettingChange('enable_category_filter', checked)}
          />
          <ToggleSwitch
            label="Enable Brand Filter"
            checked={settings.enable_brand_filter}
            onChange={(checked) => handleSettingChange('enable_brand_filter', checked)}
          />
          <ToggleSwitch
            label="Enable Price Filter"
            checked={settings.enable_price_filter}
            onChange={(checked) => handleSettingChange('enable_price_filter', checked)}
          />
          <ToggleSwitch
            label="Enable Stock Filter"
            checked={settings.enable_stock_filter}
            onChange={(checked) => handleSettingChange('enable_stock_filter', checked)}
          />
        </div>
      </div>

      {/* Display Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Eye className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Display Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Search History"
            checked={settings.enable_search_history}
            onChange={(checked) => handleSettingChange('enable_search_history', checked)}
          />
          <NumberInput
            label="Max Search History"
            value={settings.max_search_history}
            onChange={(value) => handleSettingChange('max_search_history', value)}
            min={5}
            max={100}
            step={5}
          />
          <ToggleSwitch
            label="Enable Recent Searches"
            checked={settings.enable_recent_searches}
            onChange={(checked) => handleSettingChange('enable_recent_searches', checked)}
          />
          <ToggleSwitch
            label="Enable Popular Searches"
            checked={settings.enable_popular_searches}
            onChange={(checked) => handleSettingChange('enable_popular_searches', checked)}
          />
          <ToggleSwitch
            label="Show Search Suggestions"
            checked={settings.show_search_suggestions}
            onChange={(checked) => handleSettingChange('show_search_suggestions', checked)}
          />
        </div>
      </div>

      {/* Performance Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Zap className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Search Caching"
            checked={settings.enable_search_caching}
            onChange={(checked) => handleSettingChange('enable_search_caching', checked)}
          />
          <NumberInput
            label="Cache Expiry Time (seconds)"
            value={settings.cache_expiry_time}
            onChange={(value) => handleSettingChange('cache_expiry_time', value)}
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
            label="Search Timeout (ms)"
            value={settings.search_timeout}
            onChange={(value) => handleSettingChange('search_timeout', value)}
            min={1000}
            max={30000}
            step={500}
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
            label="Enable Voice Search"
            checked={settings.enable_voice_search}
            onChange={(checked) => handleSettingChange('enable_voice_search', checked)}
          />
          <ToggleSwitch
            label="Enable Barcode Search"
            checked={settings.enable_barcode_search}
            onChange={(checked) => handleSettingChange('enable_barcode_search', checked)}
          />
          <ToggleSwitch
            label="Enable Image Search"
            checked={settings.enable_image_search}
            onChange={(checked) => handleSettingChange('enable_image_search', checked)}
          />
          <ToggleSwitch
            label="Enable Synonyms"
            checked={settings.enable_synonyms}
            onChange={(checked) => handleSettingChange('enable_synonyms', checked)}
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
});

export default SearchFilterSettingsTab;
