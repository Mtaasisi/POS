// Dynamic Pricing Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Zap, Star, Gift, Clock, Settings, Save, RefreshCw, Calculator, Crown, Percent, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DynamicPricingSettings {
  // General Settings
  enableDynamicPricing: boolean;
  autoApplyPricing: boolean;
  showPricingBreakdown: boolean;
  
  // Loyalty Pricing
  enableLoyaltyPricing: boolean;
  loyaltyTiers: {
    bronze: { minSpend: number; discount: number };
    silver: { minSpend: number; discount: number };
    gold: { minSpend: number; discount: number };
    platinum: { minSpend: number; discount: number };
  };
  
  // Bulk Pricing
  enableBulkPricing: boolean;
  bulkDiscounts: Array<{
    minQuantity: number;
    discount: number;
  }>;
  
  // Time-based Pricing
  enableTimeBasedPricing: boolean;
  timeBasedRules: Array<{
    startTime: string;
    endTime: string;
    discount: number;
    days: string[];
  }>;
  
  // Special Events
  enableSpecialEvents: boolean;
  specialEvents: Array<{
    name: string;
    startDate: string;
    endDate: string;
    discount: number;
    active: boolean;
  }>;
}

const DynamicPricingSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<DynamicPricingSettings>({
    defaultValues: {
      enableDynamicPricing: true,
      autoApplyPricing: true,
      showPricingBreakdown: true,
      enableLoyaltyPricing: true,
      loyaltyTiers: {
        bronze: { minSpend: 0, discount: 5 },
        silver: { minSpend: 50000, discount: 10 },
        gold: { minSpend: 100000, discount: 15 },
        platinum: { minSpend: 200000, discount: 20 }
      },
      enableBulkPricing: true,
      bulkDiscounts: [
        { minQuantity: 5, discount: 5 },
        { minQuantity: 10, discount: 10 },
        { minQuantity: 20, discount: 15 }
      ],
      enableTimeBasedPricing: false,
      timeBasedRules: [
        {
          startTime: '18:00',
          endTime: '22:00',
          discount: 10,
          days: ['friday', 'saturday']
        }
      ],
      enableSpecialEvents: true,
      specialEvents: [
        {
          name: 'Black Friday',
          startDate: '2024-11-29',
          endDate: '2024-11-30',
          discount: 25,
          active: true
        }
      ]
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('lats-dynamic-pricing-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading dynamic pricing settings:', error);
      toast.error('Failed to load dynamic pricing settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (data: DynamicPricingSettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-dynamic-pricing-settings', JSON.stringify(data));
      toast.success('Dynamic pricing settings saved successfully');
    } catch (error) {
      console.error('Error saving dynamic pricing settings:', error);
      toast.error('Failed to save dynamic pricing settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    reset({
      enableDynamicPricing: true,
      autoApplyPricing: true,
      showPricingBreakdown: true,
      enableLoyaltyPricing: true,
      loyaltyTiers: {
        bronze: { minSpend: 0, discount: 5 },
        silver: { minSpend: 50000, discount: 10 },
        gold: { minSpend: 100000, discount: 15 },
        platinum: { minSpend: 200000, discount: 20 }
      },
      enableBulkPricing: true,
      bulkDiscounts: [
        { minQuantity: 5, discount: 5 },
        { minQuantity: 10, discount: 10 },
        { minQuantity: 20, discount: 15 }
      ],
      enableTimeBasedPricing: false,
      timeBasedRules: [
        {
          startTime: '18:00',
          endTime: '22:00',
          discount: 10,
          days: ['friday', 'saturday']
        }
      ],
      enableSpecialEvents: true,
      specialEvents: [
        {
          name: 'Black Friday',
          startDate: '2024-11-29',
          endDate: '2024-11-30',
          discount: 25,
          active: true
        }
      ]
    });
    toast.success('Dynamic pricing settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dynamic pricing settings...</span>
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
            <Settings className="w-5 h-5" />
            General Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Enable Dynamic Pricing</div>
                <div className="text-sm text-gray-600">Enable automatic pricing rules</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enableDynamicPricing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto-apply Pricing</div>
                <div className="text-sm text-gray-600">Automatically apply pricing rules</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoApplyPricing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Pricing Breakdown</div>
                <div className="text-sm text-gray-600">Show detailed pricing breakdown</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showPricingBreakdown')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Loyalty Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Loyalty Pricing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Enable Loyalty Pricing</div>
                <div className="text-sm text-gray-600">Enable customer loyalty discounts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enableLoyaltyPricing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>

            <div className="col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-bronze-50 rounded-lg border border-bronze-200">
                  <h4 className="font-semibold text-bronze-800 mb-2">Bronze</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">Min Spend (TZS)</label>
                      <input
                        type="number"
                        {...register('loyaltyTiers.bronze.minSpend')}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Discount (%)</label>
                      <input
                        type="number"
                        {...register('loyaltyTiers.bronze.discount')}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Silver</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">Min Spend (TZS)</label>
                      <input
                        type="number"
                        {...register('loyaltyTiers.silver.minSpend')}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Discount (%)</label>
                      <input
                        type="number"
                        {...register('loyaltyTiers.silver.discount')}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Gold</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">Min Spend (TZS)</label>
                      <input
                        type="number"
                        {...register('loyaltyTiers.gold.minSpend')}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Discount (%)</label>
                      <input
                        type="number"
                        {...register('loyaltyTiers.gold.discount')}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">Platinum</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">Min Spend (TZS)</label>
                      <input
                        type="number"
                        {...register('loyaltyTiers.platinum.minSpend')}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Discount (%)</label>
                      <input
                        type="number"
                        {...register('loyaltyTiers.platinum.discount')}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Bulk Pricing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Enable Bulk Pricing</div>
                <div className="text-sm text-gray-600">Enable quantity-based discounts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enableBulkPricing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>

            <div className="col-span-2">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Min Quantity</label>
                    <input
                      type="number"
                      placeholder="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Discount (%)</label>
                    <input
                      type="number"
                      placeholder="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <GlassButton variant="secondary" size="sm">
                      Add Rule
                    </GlassButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <GlassButton
              type="button"
              onClick={handleReset}
              variant="secondary"
            >
              Reset to Defaults
            </GlassButton>
          </div>
          <div className="flex items-center gap-3">
            <GlassButton
              type="submit"
              disabled={!isDirty || isSaving}
              loading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </GlassButton>
          </div>
        </div>
      </form>
    </GlassCard>
  );
};

export default DynamicPricingSettings;
