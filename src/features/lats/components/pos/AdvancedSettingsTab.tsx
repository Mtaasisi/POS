// Advanced Settings Tab Component
import React from 'react';
import { Settings, Database, Shield, Zap, Globe, Cpu } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select, TimeInput } from './UniversalFormComponents';
import { useAdvancedSettings } from '../../../../hooks/usePOSSettings';

const AdvancedSettingsTab: React.FC = () => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useAdvancedSettings();

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
      title="Advanced Settings"
      description="Configure system performance, security, and advanced features"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {/* System Performance */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Zap className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Performance Mode"
            checked={settings.enable_performance_mode}
            onChange={(checked) => handleSettingChange('enable_performance_mode', checked)}
          />
          <ToggleSwitch
            label="Enable Caching"
            checked={settings.enable_caching}
            onChange={(checked) => handleSettingChange('enable_caching', checked)}
          />
          <NumberInput
            label="Cache Size (MB)"
            value={settings.cache_size}
            onChange={(value) => handleSettingChange('cache_size', value)}
            min={10}
            max={1000}
            step={10}
          />
          <ToggleSwitch
            label="Enable Lazy Loading"
            checked={settings.enable_lazy_loading}
            onChange={(checked) => handleSettingChange('enable_lazy_loading', checked)}
          />
          <NumberInput
            label="Max Concurrent Requests"
            value={settings.max_concurrent_requests}
            onChange={(value) => handleSettingChange('max_concurrent_requests', value)}
            min={1}
            max={50}
            step={1}
          />
        </div>
      </div>

      {/* Database Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Database className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Database Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Database Optimization"
            checked={settings.enable_database_optimization}
            onChange={(checked) => handleSettingChange('enable_database_optimization', checked)}
          />
          <ToggleSwitch
            label="Enable Auto Backup"
            checked={settings.enable_auto_backup}
            onChange={(checked) => handleSettingChange('enable_auto_backup', checked)}
          />
          <Select
            label="Backup Frequency"
            value={settings.backup_frequency}
            onChange={(value) => handleSettingChange('backup_frequency', value)}
            options={[
              { value: 'hourly', label: 'Hourly' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' }
            ]}
          />
          <ToggleSwitch
            label="Enable Data Compression"
            checked={settings.enable_data_compression}
            onChange={(checked) => handleSettingChange('enable_data_compression', checked)}
          />
          <ToggleSwitch
            label="Enable Query Optimization"
            checked={settings.enable_query_optimization}
            onChange={(checked) => handleSettingChange('enable_query_optimization', checked)}
          />
        </div>
      </div>

      {/* Security Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Two-Factor Auth"
            checked={settings.enable_two_factor_auth}
            onChange={(checked) => handleSettingChange('enable_two_factor_auth', checked)}
          />
          <ToggleSwitch
            label="Enable Session Timeout"
            checked={settings.enable_session_timeout}
            onChange={(checked) => handleSettingChange('enable_session_timeout', checked)}
          />
          <NumberInput
            label="Session Timeout (minutes)"
            value={settings.session_timeout_minutes}
            onChange={(value) => handleSettingChange('session_timeout_minutes', value)}
            min={5}
            max={480}
            step={5}
          />
          <ToggleSwitch
            label="Enable Audit Logging"
            checked={settings.enable_audit_logging}
            onChange={(checked) => handleSettingChange('enable_audit_logging', checked)}
          />
          <ToggleSwitch
            label="Enable Encryption"
            checked={settings.enable_encryption}
            onChange={(checked) => handleSettingChange('enable_encryption', checked)}
          />
        </div>
      </div>

      {/* API & Integration */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Globe className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">API & Integration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable API Access"
            checked={settings.enable_api_access}
            onChange={(checked) => handleSettingChange('enable_api_access', checked)}
          />
          <ToggleSwitch
            label="Enable Webhooks"
            checked={settings.enable_webhooks}
            onChange={(checked) => handleSettingChange('enable_webhooks', checked)}
          />
          <ToggleSwitch
            label="Enable Third-Party Integrations"
            checked={settings.enable_third_party_integrations}
            onChange={(checked) => handleSettingChange('enable_third_party_integrations', checked)}
          />
          <ToggleSwitch
            label="Enable Data Sync"
            checked={settings.enable_data_sync}
            onChange={(checked) => handleSettingChange('enable_data_sync', checked)}
          />
          <NumberInput
            label="Sync Interval (minutes)"
            value={settings.sync_interval}
            onChange={(value) => handleSettingChange('sync_interval', value)}
            min={5}
            max={1440}
            step={5}
          />
        </div>
      </div>

      {/* Developer Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Cpu className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Developer Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Debug Mode"
            checked={settings.enable_debug_mode}
            onChange={(checked) => handleSettingChange('enable_debug_mode', checked)}
          />
          <ToggleSwitch
            label="Enable Error Reporting"
            checked={settings.enable_error_reporting}
            onChange={(checked) => handleSettingChange('enable_error_reporting', checked)}
          />
          <ToggleSwitch
            label="Enable Performance Monitoring"
            checked={settings.enable_performance_monitoring}
            onChange={(checked) => handleSettingChange('enable_performance_monitoring', checked)}
          />
          <ToggleSwitch
            label="Enable Logging"
            checked={settings.enable_logging}
            onChange={(checked) => handleSettingChange('enable_logging', checked)}
          />
          <Select
            label="Log Level"
            value={settings.log_level}
            onChange={(value) => handleSettingChange('log_level', value)}
            options={[
              { value: 'error', label: 'Error Only' },
              { value: 'warn', label: 'Warning & Error' },
              { value: 'info', label: 'Info, Warning & Error' },
              { value: 'debug', label: 'Debug (All)' }
            ]}
          />
        </div>
      </div>

      {/* Advanced Features */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Experimental Features"
            checked={settings.enable_experimental_features}
            onChange={(checked) => handleSettingChange('enable_experimental_features', checked)}
          />
          <ToggleSwitch
            label="Enable Beta Features"
            checked={settings.enable_beta_features}
            onChange={(checked) => handleSettingChange('enable_beta_features', checked)}
          />
          <ToggleSwitch
            label="Enable Custom Scripts"
            checked={settings.enable_custom_scripts}
            onChange={(checked) => handleSettingChange('enable_custom_scripts', checked)}
          />
          <ToggleSwitch
            label="Enable Plugin System"
            checked={settings.enable_plugin_system}
            onChange={(checked) => handleSettingChange('enable_plugin_system', checked)}
          />
          <ToggleSwitch
            label="Enable Auto Updates"
            checked={settings.enable_auto_updates}
            onChange={(checked) => handleSettingChange('enable_auto_updates', checked)}
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
};

export default AdvancedSettingsTab;
