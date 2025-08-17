// Loyalty & Customer Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Heart, Users, Gift, Star, Save, RefreshCw, Crown, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LoyaltyCustomerSettings {
  // Loyalty Program Settings
  enableLoyaltyProgram: boolean;
  pointsPerCurrency: number;
  currencyPerPoint: number;
  minimumPointsRedemption: number;
  pointsExpiryDays: number;
  autoEnrollCustomers: boolean;
  
  // Customer Management
  enableCustomerProfiles: boolean;
  requireCustomerInfo: boolean;
  customerFields: string[];
  customerTags: string[];
  customerCategories: string[];
  
  // Rewards & Discounts
  enableRewards: boolean;
  birthdayRewards: boolean;
  anniversaryRewards: boolean;
  firstPurchaseReward: number;
  referralReward: number;
  
  // Communication Settings
  enableNotifications: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  notificationFrequency: string;
  
  // Customer Analytics
  trackCustomerBehavior: boolean;
  customerSegmentation: boolean;
  purchaseHistory: boolean;
  customerFeedback: boolean;
}

const LoyaltyCustomerSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<LoyaltyCustomerSettings>({
    defaultValues: {
      enableLoyaltyProgram: true,
      pointsPerCurrency: 1,
      currencyPerPoint: 0.01,
      minimumPointsRedemption: 100,
      pointsExpiryDays: 365,
      autoEnrollCustomers: true,
      enableCustomerProfiles: true,
      requireCustomerInfo: false,
      customerFields: ['name', 'phone', 'email'],
      customerTags: ['VIP', 'Regular', 'New'],
      customerCategories: ['Retail', 'Wholesale', 'Online'],
      enableRewards: true,
      birthdayRewards: true,
      anniversaryRewards: true,
      firstPurchaseReward: 50,
      referralReward: 100,
      enableNotifications: true,
      smsNotifications: true,
      emailNotifications: false,
      whatsappNotifications: true,
      notificationFrequency: 'weekly',
      trackCustomerBehavior: true,
      customerSegmentation: true,
      purchaseHistory: true,
      customerFeedback: true
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('lats-loyalty-customer-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading loyalty customer settings:', error);
      toast.error('Failed to load loyalty customer settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (data: LoyaltyCustomerSettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-loyalty-customer-settings', JSON.stringify(data));
      toast.success('Loyalty customer settings saved successfully');
    } catch (error) {
      console.error('Error saving loyalty customer settings:', error);
      toast.error('Failed to save loyalty customer settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    reset({
      enableLoyaltyProgram: true,
      pointsPerCurrency: 1,
      currencyPerPoint: 0.01,
      minimumPointsRedemption: 100,
      pointsExpiryDays: 365,
      autoEnrollCustomers: true,
      enableCustomerProfiles: true,
      requireCustomerInfo: false,
      customerFields: ['name', 'phone', 'email'],
      customerTags: ['VIP', 'Regular', 'New'],
      customerCategories: ['Retail', 'Wholesale', 'Online'],
      enableRewards: true,
      birthdayRewards: true,
      anniversaryRewards: true,
      firstPurchaseReward: 50,
      referralReward: 100,
      enableNotifications: true,
      smsNotifications: true,
      emailNotifications: false,
      whatsappNotifications: true,
      notificationFrequency: 'weekly',
      trackCustomerBehavior: true,
      customerSegmentation: true,
      purchaseHistory: true,
      customerFeedback: true
    });
    toast.success('Loyalty customer settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading loyalty customer settings...</span>
      </div>
    );
  }

  return (
    <GlassCard title="Loyalty & Customer Settings">
      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Loyalty Program</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('enableLoyaltyProgram')} />
              <label>Enable Loyalty Program</label>
            </div>
            <div className="mt-2">
              <label>Points per Currency:</label>
              <input type="number" {...register('pointsPerCurrency', { min: 0.01 })} />
            </div>
            <div className="mt-2">
              <label>Currency per Point:</label>
              <input type="number" {...register('currencyPerPoint', { min: 0.001 })} />
            </div>
            <div className="mt-2">
              <label>Minimum Points for Redemption:</label>
              <input type="number" {...register('minimumPointsRedemption', { min: 1 })} />
            </div>
            <div className="mt-2">
              <label>Points Expiry (Days):</label>
              <input type="number" {...register('pointsExpiryDays', { min: 1 })} />
            </div>
            <div className="mt-2">
              <label>Auto-enroll New Customers:</label>
              <input type="checkbox" {...register('autoEnrollCustomers')} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('enableCustomerProfiles')} />
              <label>Enable Customer Profiles</label>
            </div>
            <div className="mt-2">
              <label>Require Customer Info:</label>
              <input type="checkbox" {...register('requireCustomerInfo')} />
            </div>
            <div className="mt-2">
              <label>Customer Fields:</label>
              <select {...register('customerFields')} multiple className="w-full">
                <option value="name">Name</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="address">Address</option>
                <option value="birthdate">Birthdate</option>
                <option value="anniversary">Anniversary</option>
              </select>
            </div>
            <div className="mt-2">
              <label>Customer Tags:</label>
              <select {...register('customerTags')} multiple className="w-full">
                <option value="VIP">VIP</option>
                <option value="Regular">Regular</option>
                <option value="New">New</option>
                <option value="Loyal">Loyal</option>
                <option value="Veteran">Veteran</option>
              </select>
            </div>
            <div className="mt-2">
              <label>Customer Categories:</label>
              <select {...register('customerCategories')} multiple className="w-full">
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Online">Online</option>
                <option value="Corporate">Corporate</option>
                <option value="Government">Government</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Rewards & Discounts</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('enableRewards')} />
              <label>Enable Rewards</label>
            </div>
            <div className="mt-2">
              <label>Birthday Rewards:</label>
              <input type="checkbox" {...register('birthdayRewards')} />
            </div>
            <div className="mt-2">
              <label>Anniversary Rewards:</label>
              <input type="checkbox" {...register('anniversaryRewards')} />
            </div>
            <div className="mt-2">
              <label>First Purchase Reward:</label>
              <input type="number" {...register('firstPurchaseReward', { min: 0 })} />
            </div>
            <div className="mt-2">
              <label>Referral Reward:</label>
              <input type="number" {...register('referralReward', { min: 0 })} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Communication Settings</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('enableNotifications')} />
              <label>Enable Notifications</label>
            </div>
            <div className="mt-2">
              <label>SMS Notifications:</label>
              <input type="checkbox" {...register('smsNotifications')} />
            </div>
            <div className="mt-2">
              <label>Email Notifications:</label>
              <input type="checkbox" {...register('emailNotifications')} />
            </div>
            <div className="mt-2">
              <label>WhatsApp Notifications:</label>
              <input type="checkbox" {...register('whatsappNotifications')} />
            </div>
            <div className="mt-2">
              <label>Notification Frequency:</label>
              <select {...register('notificationFrequency')}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Customer Analytics</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('trackCustomerBehavior')} />
              <label>Track Customer Behavior</label>
            </div>
            <div className="mt-2">
              <label>Customer Segmentation:</label>
              <input type="checkbox" {...register('customerSegmentation')} />
            </div>
            <div className="mt-2">
              <label>Purchase History:</label>
              <input type="checkbox" {...register('purchaseHistory')} />
            </div>
            <div className="mt-2">
              <label>Customer Feedback:</label>
              <input type="checkbox" {...register('customerFeedback')} />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={!isDirty}
          >
            Reset
          </GlassButton>
          <GlassButton
            type="submit"
            variant="primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
};

export default LoyaltyCustomerSettings;
