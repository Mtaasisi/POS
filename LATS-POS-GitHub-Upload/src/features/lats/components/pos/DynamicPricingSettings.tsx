// Dynamic Pricing Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Zap, Star, Gift, Clock, Settings, Save, RefreshCw, Calculator, Crown, Percent, Package, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDynamicPricingSettings } from '../../../../hooks/usePOSSettings';
import { DynamicPricingSettings as DBDynamicPricingSettings } from '../../../../lib/posSettingsApi';

const DynamicPricingSettings: React.FC = () => {
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

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<DBDynamicPricingSettings>({
    defaultValues: settings
  });

  const watchedValues = watch();

  // Update form when settings change
  useEffect(() => {
    if (settings && !isLoading) {
      reset(settings);
    }
  }, [settings, isLoading, reset]);

  const handleSaveSettings = async (data: DBDynamicPricingSettings) => {
    const success = await saveSettings(data);
    if (success) {
      toast.success('Dynamic pricing settings saved successfully');
    }
  };

  const handleReset = async () => {
    const success = await resetSettings();
    if (success) {
      toast.success('Dynamic pricing settings reset to defaults');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dynamic pricing settings...</span>
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
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-50 rounded-lg">
          <Zap className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Dynamic Pricing Settings</h2>
          <p className="text-sm text-gray-600">Configure automatic pricing rules and discounts</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            General Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('enable_dynamic_pricing')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Dynamic Pricing</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('enable_loyalty_pricing')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Loyalty Pricing</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('enable_bulk_pricing')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Bulk Pricing</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('enable_time_based_pricing')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Time-based Pricing</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('enable_customer_pricing')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Customer Pricing</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('enable_special_events')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Special Events</span>
            </label>
          </div>
        </div>

        {/* Loyalty Pricing Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            Loyalty Pricing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loyalty Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('loyalty_discount_percent', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points Threshold
              </label>
              <input
                type="number"
                min="0"
                {...register('loyalty_points_threshold', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('loyalty_max_discount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Pricing Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Bulk Pricing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bulk Discount Enabled
              </label>
              <input
                type="checkbox"
                {...register('bulk_discount_enabled')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bulk Threshold
              </label>
              <input
                type="number"
                min="0"
                {...register('bulk_discount_threshold', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bulk Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('bulk_discount_percent', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Time-based Pricing Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Time-based Pricing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time-based Enabled
              </label>
              <input
                type="checkbox"
                {...register('time_based_discount_enabled')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                {...register('time_based_start_time')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                {...register('time_based_end_time')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('time_based_discount_percent', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Customer Pricing Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Customer Pricing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Pricing Enabled
              </label>
              <input
                type="checkbox"
                {...register('customer_pricing_enabled')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIP Customer Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('vip_customer_discount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Regular Customer Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('regular_customer_discount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Special Events Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-red-600" />
            Special Events
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Events Enabled
              </label>
              <input
                type="checkbox"
                {...register('special_events_enabled')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Event Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('special_event_discount_percent', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Save button removed, will use unified save button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <GlassButton
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </GlassButton>
          </div>
          
          {isDirty && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              <span>You have unsaved changes - use unified save button</span>
            </div>
          )}
        </div>
      </form>
    </GlassCard>
  );
};

export default DynamicPricingSettings;
