// Barcode Scanner Settings Tab Component
import React from 'react';
import { Scan, Settings, Volume2, Smartphone, Wifi, Zap } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select } from './UniversalFormComponents';
import { useBarcodeScannerSettings } from '../../../../hooks/usePOSSettings';

const BarcodeScannerSettingsTab: React.FC = () => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useBarcodeScannerSettings();

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
      title="Barcode Scanner Settings"
      description="Configure barcode scanner behavior and supported formats"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
      isDirty={false} // Add default value for now
    >
      {/* General Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Scan className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Barcode Scanner"
            checked={settings.enable_barcode_scanner}
            onChange={(checked) => handleSettingChange('enable_barcode_scanner', checked)}
          />
          <ToggleSwitch
            label="Enable Camera Scanner"
            checked={settings.enable_camera_scanner}
            onChange={(checked) => handleSettingChange('enable_camera_scanner', checked)}
          />
          <ToggleSwitch
            label="Enable Keyboard Input"
            checked={settings.enable_keyboard_input}
            onChange={(checked) => handleSettingChange('enable_keyboard_input', checked)}
          />
          <ToggleSwitch
            label="Enable Manual Entry"
            checked={settings.enable_manual_entry}
            onChange={(checked) => handleSettingChange('enable_manual_entry', checked)}
          />
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Behavior Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Auto Add to Cart"
            checked={settings.auto_add_to_cart}
            onChange={(checked) => handleSettingChange('auto_add_to_cart', checked)}
          />
          <ToggleSwitch
            label="Auto Focus Search"
            checked={settings.auto_focus_search}
            onChange={(checked) => handleSettingChange('auto_focus_search', checked)}
          />
          <ToggleSwitch
            label="Play Sound on Scan"
            checked={settings.play_sound_on_scan}
            onChange={(checked) => handleSettingChange('play_sound_on_scan', checked)}
          />
          <ToggleSwitch
            label="Vibrate on Scan"
            checked={settings.vibrate_on_scan}
            onChange={(checked) => handleSettingChange('vibrate_on_scan', checked)}
          />
          <ToggleSwitch
            label="Show Scan Feedback"
            checked={settings.show_scan_feedback}
            onChange={(checked) => handleSettingChange('show_scan_feedback', checked)}
          />
        </div>
      </div>

      {/* Error Handling */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Volume2 className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Error Handling</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Show Invalid Barcode Alert"
            checked={settings.show_invalid_barcode_alert}
            onChange={(checked) => handleSettingChange('show_invalid_barcode_alert', checked)}
          />
          <ToggleSwitch
            label="Allow Unknown Products"
            checked={settings.allow_unknown_products}
            onChange={(checked) => handleSettingChange('allow_unknown_products', checked)}
          />
          <ToggleSwitch
            label="Prompt for Unknown Products"
            checked={settings.prompt_for_unknown_products}
            onChange={(checked) => handleSettingChange('prompt_for_unknown_products', checked)}
          />
          <ToggleSwitch
            label="Retry on Error"
            checked={settings.retry_on_error}
            onChange={(checked) => handleSettingChange('retry_on_error', checked)}
          />
          <NumberInput
            label="Max Retry Attempts"
            value={settings.max_retry_attempts}
            onChange={(value) => handleSettingChange('max_retry_attempts', value)}
            min={1}
            max={10}
            step={1}
          />
        </div>
      </div>

      {/* Device Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Smartphone className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Device Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Scanner Device Name"
            value={settings.scanner_device_name || ''}
            onChange={(value) => handleSettingChange('scanner_device_name', value)}
            placeholder="Default Scanner"
          />
          <Select
            label="Connection Type"
            value={settings.scanner_connection_type}
            onChange={(value) => handleSettingChange('scanner_connection_type', value)}
            options={[
              { value: 'usb', label: 'USB' },
              { value: 'bluetooth', label: 'Bluetooth' },
              { value: 'wifi', label: 'WiFi' }
            ]}
          />
          <NumberInput
            label="Scanner Timeout (ms)"
            value={settings.scanner_timeout}
            onChange={(value) => handleSettingChange('scanner_timeout', value)}
            min={1000}
            max={30000}
            step={500}
          />
        </div>
      </div>

      {/* Supported Codes */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Wifi className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Supported Codes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Support EAN-13"
            checked={settings.support_ean13}
            onChange={(checked) => handleSettingChange('support_ean13', checked)}
          />
          <ToggleSwitch
            label="Support EAN-8"
            checked={settings.support_ean8}
            onChange={(checked) => handleSettingChange('support_ean8', checked)}
          />
          <ToggleSwitch
            label="Support UPC-A"
            checked={settings.support_upc_a}
            onChange={(checked) => handleSettingChange('support_upc_a', checked)}
          />
          <ToggleSwitch
            label="Support UPC-E"
            checked={settings.support_upc_e}
            onChange={(checked) => handleSettingChange('support_upc_e', checked)}
          />
          <ToggleSwitch
            label="Support Code 128"
            checked={settings.support_code128}
            onChange={(checked) => handleSettingChange('support_code128', checked)}
          />
          <ToggleSwitch
            label="Support Code 39"
            checked={settings.support_code39}
            onChange={(checked) => handleSettingChange('support_code39', checked)}
          />
          <ToggleSwitch
            label="Support QR Code"
            checked={settings.support_qr_code}
            onChange={(checked) => handleSettingChange('support_qr_code', checked)}
          />
          <ToggleSwitch
            label="Support Data Matrix"
            checked={settings.support_data_matrix}
            onChange={(checked) => handleSettingChange('support_data_matrix', checked)}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Zap className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Continuous Scanning"
            checked={settings.enable_continuous_scanning}
            onChange={(checked) => handleSettingChange('enable_continuous_scanning', checked)}
          />
          <NumberInput
            label="Scan Delay (ms)"
            value={settings.scan_delay}
            onChange={(value) => handleSettingChange('scan_delay', value)}
            min={0}
            max={1000}
            step={50}
          />
          <ToggleSwitch
            label="Enable Scan History"
            checked={settings.enable_scan_history}
            onChange={(checked) => handleSettingChange('enable_scan_history', checked)}
          />
          <NumberInput
            label="Max Scan History"
            value={settings.max_scan_history}
            onChange={(value) => handleSettingChange('max_scan_history', value)}
            min={10}
            max={1000}
            step={10}
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
};

export default BarcodeScannerSettingsTab;
