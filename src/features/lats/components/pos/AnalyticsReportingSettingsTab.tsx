// Analytics & Reporting Settings Tab Component
import React from 'react';
import { BarChart3, TrendingUp, FileText, PieChart, Settings, Calendar, Download, Share2 } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select, TimeInput } from './UniversalFormComponents';
import { useAnalyticsReportingSettings } from '../../../../hooks/usePOSSettings';

const AnalyticsReportingSettingsTab: React.FC = () => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useAnalyticsReportingSettings();

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
      title="Analytics & Reporting Settings"
      description="Configure analytics tracking, reporting, and data visualization"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {/* General Analytics */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">General Analytics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Analytics"
            checked={settings.enable_analytics}
            onChange={(checked) => handleSettingChange('enable_analytics', checked)}
          />
          <ToggleSwitch
            label="Enable Real-time Analytics"
            checked={settings.enable_real_time_analytics}
            onChange={(checked) => handleSettingChange('enable_real_time_analytics', checked)}
          />
          <NumberInput
            label="Analytics Refresh Interval (seconds)"
            value={settings.analytics_refresh_interval}
            onChange={(value) => handleSettingChange('analytics_refresh_interval', value)}
            min={10}
            max={300}
            step={10}
          />
          <ToggleSwitch
            label="Enable Data Export"
            checked={settings.enable_data_export}
            onChange={(checked) => handleSettingChange('enable_data_export', checked)}
          />
        </div>
      </div>

      {/* Sales Analytics */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Sales Analytics"
            checked={settings.enable_sales_analytics}
            onChange={(checked) => handleSettingChange('enable_sales_analytics', checked)}
          />
          <ToggleSwitch
            label="Enable Sales Trends"
            checked={settings.enable_sales_trends}
            onChange={(checked) => handleSettingChange('enable_sales_trends', checked)}
          />
          <ToggleSwitch
            label="Enable Product Performance"
            checked={settings.enable_product_performance}
            onChange={(checked) => handleSettingChange('enable_product_performance', checked)}
          />
          <ToggleSwitch
            label="Enable Customer Analytics"
            checked={settings.enable_customer_analytics}
            onChange={(checked) => handleSettingChange('enable_customer_analytics', checked)}
          />
          <ToggleSwitch
            label="Enable Revenue Tracking"
            checked={settings.enable_revenue_tracking}
            onChange={(checked) => handleSettingChange('enable_revenue_tracking', checked)}
          />
        </div>
      </div>

      {/* Inventory Analytics */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <PieChart className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Inventory Analytics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Inventory Analytics"
            checked={settings.enable_inventory_analytics}
            onChange={(checked) => handleSettingChange('enable_inventory_analytics', checked)}
          />
          <ToggleSwitch
            label="Enable Stock Alerts"
            checked={settings.enable_stock_alerts}
            onChange={(checked) => handleSettingChange('enable_stock_alerts', checked)}
          />
          <ToggleSwitch
            label="Enable Low Stock Reports"
            checked={settings.enable_low_stock_reports}
            onChange={(checked) => handleSettingChange('enable_low_stock_reports', checked)}
          />
          <ToggleSwitch
            label="Enable Inventory Turnover"
            checked={settings.enable_inventory_turnover}
            onChange={(checked) => handleSettingChange('enable_inventory_turnover', checked)}
          />
          <ToggleSwitch
            label="Enable Supplier Analytics"
            checked={settings.enable_supplier_analytics}
            onChange={(checked) => handleSettingChange('enable_supplier_analytics', checked)}
          />
        </div>
      </div>

      {/* Reporting Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FileText className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Reporting Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Automated Reports"
            checked={settings.enable_automated_reports}
            onChange={(checked) => handleSettingChange('enable_automated_reports', checked)}
          />
          <TimeInput
            label="Report Generation Time"
            value={settings.report_generation_time}
            onChange={(value) => handleSettingChange('report_generation_time', value)}
          />
          <ToggleSwitch
            label="Enable Email Reports"
            checked={settings.enable_email_reports}
            onChange={(checked) => handleSettingChange('enable_email_reports', checked)}
          />
          <ToggleSwitch
            label="Enable PDF Reports"
            checked={settings.enable_pdf_reports}
            onChange={(checked) => handleSettingChange('enable_pdf_reports', checked)}
          />
          <ToggleSwitch
            label="Enable Excel Reports"
            checked={settings.enable_excel_reports}
            onChange={(checked) => handleSettingChange('enable_excel_reports', checked)}
          />
        </div>
      </div>

      {/* Dashboard Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Dashboard Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Custom Dashboard"
            checked={settings.enable_custom_dashboard}
            onChange={(checked) => handleSettingChange('enable_custom_dashboard', checked)}
          />
          <ToggleSwitch
            label="Enable KPI Widgets"
            checked={settings.enable_kpi_widgets}
            onChange={(checked) => handleSettingChange('enable_kpi_widgets', checked)}
          />
          <ToggleSwitch
            label="Enable Chart Animations"
            checked={settings.enable_chart_animations}
            onChange={(checked) => handleSettingChange('enable_chart_animations', checked)}
          />
          <ToggleSwitch
            label="Enable Data Drill Down"
            checked={settings.enable_data_drill_down}
            onChange={(checked) => handleSettingChange('enable_data_drill_down', checked)}
          />
          <ToggleSwitch
            label="Enable Comparative Analysis"
            checked={settings.enable_comparative_analysis}
            onChange={(checked) => handleSettingChange('enable_comparative_analysis', checked)}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Predictive Analytics"
            checked={settings.enable_predictive_analytics}
            onChange={(checked) => handleSettingChange('enable_predictive_analytics', checked)}
          />
          <ToggleSwitch
            label="Enable Data Retention"
            checked={settings.enable_data_retention}
            onChange={(checked) => handleSettingChange('enable_data_retention', checked)}
          />
          <NumberInput
            label="Data Retention Days"
            value={settings.data_retention_days}
            onChange={(value) => handleSettingChange('data_retention_days', value)}
            min={30}
            max={3650}
            step={30}
          />
          <ToggleSwitch
            label="Enable Data Backup"
            checked={settings.enable_data_backup}
            onChange={(checked) => handleSettingChange('enable_data_backup', checked)}
          />
          <ToggleSwitch
            label="Enable API Export"
            checked={settings.enable_api_export}
            onChange={(checked) => handleSettingChange('enable_api_export', checked)}
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
};

export default AnalyticsReportingSettingsTab;
