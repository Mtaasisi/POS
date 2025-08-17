// Advanced Notification Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Bell, MessageSquare, Mail, Smartphone, RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdvancedNotificationSettings {
  // General Notification Settings
  enableNotifications: boolean;
  notificationSound: boolean;
  notificationVibration: boolean;
  notificationPopup: boolean;
  
  // Sales Notifications
  salesNotifications: boolean;
  notifyOnSale: boolean;
  notifyOnRefund: boolean;
  notifyOnVoid: boolean;
  notifyOnDiscount: boolean;
  
  // Inventory Notifications
  inventoryNotifications: boolean;
  lowStockAlert: boolean;
  outOfStockAlert: boolean;
  stockThreshold: number;
  notifyOnStockUpdate: boolean;
  
  // Customer Notifications
  customerNotifications: boolean;
  newCustomerAlert: boolean;
  customerBirthdayAlert: boolean;
  customerAnniversaryAlert: boolean;
  customerFeedbackAlert: boolean;
  
  // System Notifications
  systemNotifications: boolean;
  errorNotifications: boolean;
  maintenanceNotifications: boolean;
  updateNotifications: boolean;
  backupNotifications: boolean;
  
  // Communication Channels
  smsNotifications: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  
  // Notification Schedule
  notificationSchedule: string;
  quietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  
  // Advanced Settings
  notificationRetention: number;
  notificationGrouping: boolean;
  notificationPriority: string;
  customNotificationTones: boolean;
}

const AdvancedNotificationSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<AdvancedNotificationSettings>({
    defaultValues: {
      enableNotifications: true,
      notificationSound: true,
      notificationVibration: true,
      notificationPopup: true,
      salesNotifications: true,
      notifyOnSale: true,
      notifyOnRefund: true,
      notifyOnVoid: true,
      notifyOnDiscount: false,
      inventoryNotifications: true,
      lowStockAlert: true,
      outOfStockAlert: true,
      stockThreshold: 10,
      notifyOnStockUpdate: false,
      customerNotifications: true,
      newCustomerAlert: true,
      customerBirthdayAlert: true,
      customerAnniversaryAlert: true,
      customerFeedbackAlert: true,
      systemNotifications: true,
      errorNotifications: true,
      maintenanceNotifications: true,
      updateNotifications: true,
      backupNotifications: true,
      smsNotifications: true,
      emailNotifications: false,
      whatsappNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      notificationSchedule: 'always',
      quietHours: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'Africa/Nairobi',
      notificationRetention: 30,
      notificationGrouping: true,
      notificationPriority: 'medium',
      customNotificationTones: false
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('lats-advanced-notification-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading advanced notification settings:', error);
      toast.error('Failed to load advanced notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (data: AdvancedNotificationSettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-advanced-notification-settings', JSON.stringify(data));
      toast.success('Advanced notification settings saved successfully');
    } catch (error) {
      console.error('Error saving advanced notification settings:', error);
      toast.error('Failed to save advanced notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    reset({
      enableNotifications: true,
      notificationSound: true,
      notificationVibration: true,
      notificationPopup: true,
      salesNotifications: true,
      notifyOnSale: true,
      notifyOnRefund: true,
      notifyOnVoid: true,
      notifyOnDiscount: false,
      inventoryNotifications: true,
      lowStockAlert: true,
      outOfStockAlert: true,
      stockThreshold: 10,
      notifyOnStockUpdate: false,
      customerNotifications: true,
      newCustomerAlert: true,
      customerBirthdayAlert: true,
      customerAnniversaryAlert: true,
      customerFeedbackAlert: true,
      systemNotifications: true,
      errorNotifications: true,
      maintenanceNotifications: true,
      updateNotifications: true,
      backupNotifications: true,
      smsNotifications: true,
      emailNotifications: false,
      whatsappNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      notificationSchedule: 'always',
      quietHours: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'Africa/Nairobi',
      notificationRetention: 30,
      notificationGrouping: true,
      notificationPriority: 'medium',
      customNotificationTones: false
    });
    toast.success('Advanced notification settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading advanced notification settings...</span>
      </div>
    );
  }

  return (
    <GlassCard title="Advanced Notification Settings">
      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">General Settings</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('enableNotifications')} />
              <label>Enable Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notificationSound')} />
              <label>Enable Sound</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notificationVibration')} />
              <label>Enable Vibration</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notificationPopup')} />
              <label>Enable Popup Notifications</label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Sales Notifications</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('salesNotifications')} />
              <label>Enable Sales Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notifyOnSale')} />
              <label>Notify on Sale</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notifyOnRefund')} />
              <label>Notify on Refund</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notifyOnVoid')} />
              <label>Notify on Void</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notifyOnDiscount')} />
              <label>Notify on Discount</label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Inventory Notifications</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('inventoryNotifications')} />
              <label>Enable Inventory Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('lowStockAlert')} />
              <label>Low Stock Alert</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('outOfStockAlert')} />
              <label>Out of Stock Alert</label>
            </div>
            <div className="flex items-center space-x-2">
              <label>Stock Threshold: </label>
              <input type="number" {...register('stockThreshold')} />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notifyOnStockUpdate')} />
              <label>Notify on Stock Update</label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Customer Notifications</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('customerNotifications')} />
              <label>Enable Customer Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('newCustomerAlert')} />
              <label>New Customer Alert</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('customerBirthdayAlert')} />
              <label>Customer Birthday Alert</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('customerAnniversaryAlert')} />
              <label>Customer Anniversary Alert</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('customerFeedbackAlert')} />
              <label>Customer Feedback Alert</label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">System Notifications</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('systemNotifications')} />
              <label>Enable System Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('errorNotifications')} />
              <label>Error Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('maintenanceNotifications')} />
              <label>Maintenance Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('updateNotifications')} />
              <label>Update Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('backupNotifications')} />
              <label>Backup Notifications</label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Communication Channels</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('smsNotifications')} />
              <label>SMS Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('emailNotifications')} />
              <label>Email Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('whatsappNotifications')} />
              <label>WhatsApp Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('pushNotifications')} />
              <label>Push Notifications</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('inAppNotifications')} />
              <label>In-App Notifications</label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Notification Schedule</h3>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('quietHours')} />
              <label>Enable Quiet Hours</label>
            </div>
            <div className="flex items-center space-x-2">
              <label>Quiet Hours Start: </label>
              <input type="time" {...register('quietHoursStart')} />
            </div>
            <div className="flex items-center space-x-2">
              <label>Quiet Hours End: </label>
              <input type="time" {...register('quietHoursEnd')} />
            </div>
            <div className="flex items-center space-x-2">
              <label>Timezone: </label>
              <input type="text" {...register('timezone')} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Advanced Settings</h3>
            <div className="flex items-center space-x-2">
              <label>Notification Retention (days): </label>
              <input type="number" {...register('notificationRetention')} />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('notificationGrouping')} />
              <label>Enable Notification Grouping</label>
            </div>
            <div className="flex items-center space-x-2">
              <label>Notification Priority: </label>
              <select {...register('notificationPriority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('customNotificationTones')} />
              <label>Enable Custom Notification Tones</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset Defaults
          </GlassButton>
          <GlassButton type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
};

export default AdvancedNotificationSettings;
