// Analytics & Reporting Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { BarChart3, TrendingUp, FileText, Download, RefreshCw, PieChart, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AnalyticsReportingSettings {
  // Report Generation
  enableAutoReports: boolean;
  reportFrequency: string;
  reportTypes: string[];
  includeCharts: boolean;
  includeTables: boolean;
  
  // Data Export
  enableDataExport: boolean;
  exportFormats: string[];
  exportSchedule: string;
  includeHistoricalData: boolean;
  dataRetentionDays: number;
  
  // Real-time Analytics
  enableRealTimeAnalytics: boolean;
  updateInterval: number;
  showLiveSales: boolean;
  showLiveInventory: boolean;
  showLiveCustomers: boolean;
  
  // Dashboard Settings
  enableCustomDashboard: boolean;
  defaultDashboard: string;
  dashboardWidgets: string[];
  refreshInterval: number;
  
  // Performance Metrics
  trackKPIs: boolean;
  kpiMetrics: string[];
  goalTracking: boolean;
  alertThresholds: boolean;
  
  // Advanced Analytics
  enablePredictiveAnalytics: boolean;
  enableTrendAnalysis: boolean;
  enableCustomerSegmentation: boolean;
  enableInventoryOptimization: boolean;
}

const AnalyticsReportingSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<AnalyticsReportingSettings>({
    defaultValues: {
      enableAutoReports: true,
      reportFrequency: 'daily',
      reportTypes: ['sales', 'inventory', 'customers'],
      includeCharts: true,
      includeTables: true,
      enableDataExport: true,
      exportFormats: ['pdf', 'excel', 'csv'],
      exportSchedule: 'weekly',
      includeHistoricalData: true,
      dataRetentionDays: 365,
      enableRealTimeAnalytics: true,
      updateInterval: 30,
      showLiveSales: true,
      showLiveInventory: true,
      showLiveCustomers: true,
      enableCustomDashboard: true,
      defaultDashboard: 'sales',
      dashboardWidgets: ['sales', 'inventory', 'customers', 'revenue'],
      refreshInterval: 60,
      trackKPIs: true,
      kpiMetrics: ['revenue', 'sales', 'customers', 'inventory'],
      goalTracking: true,
      alertThresholds: true,
      enablePredictiveAnalytics: false,
      enableTrendAnalysis: true,
      enableCustomerSegmentation: true,
      enableInventoryOptimization: false
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('lats-analytics-reporting-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading analytics reporting settings:', error);
      toast.error('Failed to load analytics reporting settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (data: AnalyticsReportingSettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-analytics-reporting-settings', JSON.stringify(data));
      toast.success('Analytics reporting settings saved successfully');
    } catch (error) {
      console.error('Error saving analytics reporting settings:', error);
      toast.error('Failed to save analytics reporting settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    reset({
      enableAutoReports: true,
      reportFrequency: 'daily',
      reportTypes: ['sales', 'inventory', 'customers'],
      includeCharts: true,
      includeTables: true,
      enableDataExport: true,
      exportFormats: ['pdf', 'excel', 'csv'],
      exportSchedule: 'weekly',
      includeHistoricalData: true,
      dataRetentionDays: 365,
      enableRealTimeAnalytics: true,
      updateInterval: 30,
      showLiveSales: true,
      showLiveInventory: true,
      showLiveCustomers: true,
      enableCustomDashboard: true,
      defaultDashboard: 'sales',
      dashboardWidgets: ['sales', 'inventory', 'customers', 'revenue'],
      refreshInterval: 60,
      trackKPIs: true,
      kpiMetrics: ['revenue', 'sales', 'customers', 'inventory'],
      goalTracking: true,
      alertThresholds: true,
      enablePredictiveAnalytics: false,
      enableTrendAnalysis: true,
      enableCustomerSegmentation: true,
      enableInventoryOptimization: false
    });
    toast.success('Analytics reporting settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading analytics reporting settings...</span>
      </div>
    );
  }

  return (
    <GlassCard title="Analytics & Reporting Settings">
      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Report Generation</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="enableAutoReports" className="block text-sm font-medium text-gray-700">
                  Enable Auto Reports
                </label>
                <input
                  type="checkbox"
                  id="enableAutoReports"
                  {...register('enableAutoReports')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="reportFrequency" className="block text-sm font-medium text-gray-700">
                  Report Frequency
                </label>
                <select
                  id="reportFrequency"
                  {...register('reportFrequency')}
                  className="mt-1 block w-full"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label htmlFor="reportTypes" className="block text-sm font-medium text-gray-700">
                  Report Types
                </label>
                <select
                  id="reportTypes"
                  {...register('reportTypes')}
                  multiple
                  className="mt-1 block w-full"
                >
                  <option value="sales">Sales</option>
                  <option value="inventory">Inventory</option>
                  <option value="customers">Customers</option>
                  <option value="revenue">Revenue</option>
                  <option value="profit">Profit</option>
                </select>
              </div>
              <div>
                <label htmlFor="includeCharts" className="block text-sm font-medium text-gray-700">
                  Include Charts
                </label>
                <input
                  type="checkbox"
                  id="includeCharts"
                  {...register('includeCharts')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="includeTables" className="block text-sm font-medium text-gray-700">
                  Include Tables
                </label>
                <input
                  type="checkbox"
                  id="includeTables"
                  {...register('includeTables')}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Data Export</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="enableDataExport" className="block text-sm font-medium text-gray-700">
                  Enable Data Export
                </label>
                <input
                  type="checkbox"
                  id="enableDataExport"
                  {...register('enableDataExport')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="exportFormats" className="block text-sm font-medium text-gray-700">
                  Export Formats
                </label>
                <select
                  id="exportFormats"
                  {...register('exportFormats')}
                  multiple
                  className="mt-1 block w-full"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <div>
                <label htmlFor="exportSchedule" className="block text-sm font-medium text-gray-700">
                  Export Schedule
                </label>
                <select
                  id="exportSchedule"
                  {...register('exportSchedule')}
                  className="mt-1 block w-full"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label htmlFor="includeHistoricalData" className="block text-sm font-medium text-gray-700">
                  Include Historical Data
                </label>
                <input
                  type="checkbox"
                  id="includeHistoricalData"
                  {...register('includeHistoricalData')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="dataRetentionDays" className="block text-sm font-medium text-gray-700">
                  Data Retention (Days)
                </label>
                <input
                  type="number"
                  id="dataRetentionDays"
                  {...register('dataRetentionDays')}
                  className="mt-1 block w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="enableRealTimeAnalytics" className="block text-sm font-medium text-gray-700">
                  Enable Real-time Analytics
                </label>
                <input
                  type="checkbox"
                  id="enableRealTimeAnalytics"
                  {...register('enableRealTimeAnalytics')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="updateInterval" className="block text-sm font-medium text-gray-700">
                  Update Interval (Seconds)
                </label>
                <input
                  type="number"
                  id="updateInterval"
                  {...register('updateInterval')}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label htmlFor="showLiveSales" className="block text-sm font-medium text-gray-700">
                  Show Live Sales
                </label>
                <input
                  type="checkbox"
                  id="showLiveSales"
                  {...register('showLiveSales')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="showLiveInventory" className="block text-sm font-medium text-gray-700">
                  Show Live Inventory
                </label>
                <input
                  type="checkbox"
                  id="showLiveInventory"
                  {...register('showLiveInventory')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="showLiveCustomers" className="block text-sm font-medium text-gray-700">
                  Show Live Customers
                </label>
                <input
                  type="checkbox"
                  id="showLiveCustomers"
                  {...register('showLiveCustomers')}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Dashboard Settings</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="enableCustomDashboard" className="block text-sm font-medium text-gray-700">
                  Enable Custom Dashboard
                </label>
                <input
                  type="checkbox"
                  id="enableCustomDashboard"
                  {...register('enableCustomDashboard')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="defaultDashboard" className="block text-sm font-medium text-gray-700">
                  Default Dashboard
                </label>
                <select
                  id="defaultDashboard"
                  {...register('defaultDashboard')}
                  className="mt-1 block w-full"
                >
                  <option value="sales">Sales Dashboard</option>
                  <option value="inventory">Inventory Dashboard</option>
                  <option value="customers">Customers Dashboard</option>
                  <option value="revenue">Revenue Dashboard</option>
                </select>
              </div>
              <div>
                <label htmlFor="dashboardWidgets" className="block text-sm font-medium text-gray-700">
                  Dashboard Widgets
                </label>
                <select
                  id="dashboardWidgets"
                  {...register('dashboardWidgets')}
                  multiple
                  className="mt-1 block w-full"
                >
                  <option value="sales">Sales Overview</option>
                  <option value="inventory">Inventory Status</option>
                  <option value="customers">Customer Trends</option>
                  <option value="revenue">Revenue Trends</option>
                  <option value="profit">Profit Margin</option>
                </select>
              </div>
              <div>
                <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700">
                  Dashboard Refresh Interval (Seconds)
                </label>
                <input
                  type="number"
                  id="refreshInterval"
                  {...register('refreshInterval')}
                  className="mt-1 block w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="trackKPIs" className="block text-sm font-medium text-gray-700">
                  Track Key Performance Indicators (KPIs)
                </label>
                <input
                  type="checkbox"
                  id="trackKPIs"
                  {...register('trackKPIs')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="kpiMetrics" className="block text-sm font-medium text-gray-700">
                  KPIs to Track
                </label>
                <select
                  id="kpiMetrics"
                  {...register('kpiMetrics')}
                  multiple
                  className="mt-1 block w-full"
                >
                  <option value="revenue">Revenue</option>
                  <option value="sales">Sales</option>
                  <option value="customers">Customers</option>
                  <option value="inventory">Inventory</option>
                  <option value="profit">Profit</option>
                </select>
              </div>
              <div>
                <label htmlFor="goalTracking" className="block text-sm font-medium text-gray-700">
                  Enable Goal Tracking
                </label>
                <input
                  type="checkbox"
                  id="goalTracking"
                  {...register('goalTracking')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="alertThresholds" className="block text-sm font-medium text-gray-700">
                  Enable Alert Thresholds
                </label>
                <input
                  type="checkbox"
                  id="alertThresholds"
                  {...register('alertThresholds')}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="enablePredictiveAnalytics" className="block text-sm font-medium text-gray-700">
                  Enable Predictive Analytics
                </label>
                <input
                  type="checkbox"
                  id="enablePredictiveAnalytics"
                  {...register('enablePredictiveAnalytics')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="enableTrendAnalysis" className="block text-sm font-medium text-gray-700">
                  Enable Trend Analysis
                </label>
                <input
                  type="checkbox"
                  id="enableTrendAnalysis"
                  {...register('enableTrendAnalysis')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="enableCustomerSegmentation" className="block text-sm font-medium text-gray-700">
                  Enable Customer Segmentation
                </label>
                <input
                  type="checkbox"
                  id="enableCustomerSegmentation"
                  {...register('enableCustomerSegmentation')}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="enableInventoryOptimization" className="block text-sm font-medium text-gray-700">
                  Enable Inventory Optimization
                </label>
                <input
                  type="checkbox"
                  id="enableInventoryOptimization"
                  {...register('enableInventoryOptimization')}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isSaving || isLoading}
          >
            Reset Defaults
          </GlassButton>
          <GlassButton
            type="submit"
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
};

export default AnalyticsReportingSettings;
