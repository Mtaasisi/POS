import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Settings,
  Save,
  Clock,
  Moon,
  Sun,
  Globe,
  Shield,
  Volume2,
  VolumeX,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { NotificationSettings } from '../types';

const NotificationSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    id: '',
    userId: currentUser?.id || '',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
    
    // Category preferences
    deviceNotifications: true,
    customerNotifications: true,
    paymentNotifications: true,
    inventoryNotifications: true,
    systemNotifications: true,
    appointmentNotifications: true,
    diagnosticNotifications: true,
    loyaltyNotifications: true,
    communicationNotifications: true,
    backupNotifications: true,
    securityNotifications: true,
    goalNotifications: true,
    
    // Priority preferences
    lowPriorityNotifications: true,
    normalPriorityNotifications: true,
    highPriorityNotifications: true,
    urgentPriorityNotifications: true,
    
    // Time preferences
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Frequency preferences
    digestEnabled: false,
    digestFrequency: 'daily',
    digestTime: '09:00',
    
    updatedAt: new Date().toISOString()
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentUser]);

  // Save settings to database
  const saveSettings = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const settingsToSave = {
        ...settings,
        user_id: currentUser.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notification_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSettingCard = (
    title: string, 
    description: string, 
    icon: React.ReactNode, 
    children: React.ReactNode
  ) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  const getToggleSetting = (
    key: keyof NotificationSettings,
    label: string,
    description?: string
  ) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      <button
        onClick={() => toggleSetting(key)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${settings[key] ? 'bg-blue-600' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${settings[key] ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
            <p className="text-gray-600 mt-1">
              Customize how and when you receive notifications
            </p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Delivery Methods */}
        {getSettingCard(
          'Delivery Methods',
          'Choose how you want to receive notifications',
          <Bell size={20} />,
          <div className="space-y-2">
            {getToggleSetting(
              'emailNotifications',
              'Email Notifications',
              'Receive notifications via email'
            )}
            {getToggleSetting(
              'pushNotifications',
              'Push Notifications',
              'Receive browser push notifications'
            )}
            {getToggleSetting(
              'smsNotifications',
              'SMS Notifications',
              'Receive notifications via SMS (additional charges may apply)'
            )}
            {getToggleSetting(
              'whatsappNotifications',
              'WhatsApp Notifications',
              'Receive notifications via WhatsApp'
            )}
          </div>
        )}

        {/* Category Preferences */}
        {getSettingCard(
          'Category Preferences',
          'Choose which types of notifications you want to receive',
          <Settings size={20} />,
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {getToggleSetting('deviceNotifications', 'Device Updates')}
              {getToggleSetting('customerNotifications', 'Customer Activity')}
              {getToggleSetting('paymentNotifications', 'Payment Updates')}
              {getToggleSetting('inventoryNotifications', 'Inventory Alerts')}
              {getToggleSetting('systemNotifications', 'System Messages')}
              {getToggleSetting('appointmentNotifications', 'Appointment Reminders')}
            </div>
            <div className="space-y-2">
              {getToggleSetting('diagnosticNotifications', 'Diagnostic Results')}
              {getToggleSetting('loyaltyNotifications', 'Loyalty Updates')}
              {getToggleSetting('communicationNotifications', 'Communication Alerts')}
              {getToggleSetting('backupNotifications', 'Backup Status')}
              {getToggleSetting('securityNotifications', 'Security Alerts')}
              {getToggleSetting('goalNotifications', 'Goal Progress')}
            </div>
          </div>
        )}

        {/* Priority Preferences */}
        {getSettingCard(
          'Priority Preferences',
          'Choose which priority levels you want to receive',
          <Shield size={20} />,
          <div className="space-y-2">
            {getToggleSetting('urgentPriorityNotifications', 'Urgent', 'Critical alerts that require immediate attention')}
            {getToggleSetting('highPriorityNotifications', 'High', 'Important updates and alerts')}
            {getToggleSetting('normalPriorityNotifications', 'Normal', 'Regular updates and information')}
            {getToggleSetting('lowPriorityNotifications', 'Low', 'Non-critical updates and reminders')}
          </div>
        )}

        {/* Quiet Hours */}
        {getSettingCard(
          'Quiet Hours',
          'Set times when you don\'t want to receive notifications',
          <Moon size={20} />,
          <div className="space-y-4">
            {getToggleSetting(
              'quietHoursEnabled',
              'Enable Quiet Hours',
              'Pause notifications during specified hours'
            )}
            
            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Digest Settings */}
        {getSettingCard(
          'Digest Settings',
          'Receive a summary of notifications instead of individual alerts',
          <Clock size={20} />,
          <div className="space-y-4">
            {getToggleSetting(
              'digestEnabled',
              'Enable Digest',
              'Receive a summary of notifications at specified intervals'
            )}
            
            {settings.digestEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={settings.digestFrequency}
                    onChange={(e) => updateSetting('digestFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={settings.digestTime}
                    onChange={(e) => updateSetting('digestTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timezone */}
        {getSettingCard(
          'Timezone',
          'Set your local timezone for accurate timing',
          <Globe size={20} />,
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Intl.supportedValuesOf('timeZone').map(timezone => (
                <option key={timezone} value={timezone}>
                  {timezone} ({new Date().toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'short' })})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
