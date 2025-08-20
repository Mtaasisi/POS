import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { loadUserSettings, saveUserSettings, createDefaultUserSettings, UserSettings } from '../../../lib/userSettingsApi';
import { 
  User,
  Bell,
  Eye,
  Lock,
  Palette,
  Smartphone,
  Mail,
  Shield,
  Globe,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Save,
  Edit,
  Camera,
  Key,
  Trash2,
  Download,
  Upload,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  EyeOff,
  Image,
  Database,
  Cloud,
  HardDrive,
  Truck,
  MessageCircle
} from 'lucide-react';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import LogoUpload from '../../../features/shared/components/ui/LogoUpload';
import { hostingerUploadService } from '../../../lib/hostingerUploadService';
import { whatsappBusinessApi } from '../../../services/whatsappBusinessApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// UserSettings interface is now imported from userSettingsApi

const SettingsPage: React.FC = () => {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    displayName: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    avatar: '',
    appLogo: '',
    language: 'en',
    timezone: 'Africa/Dar_es_Salaam',
    dateFormat: 'DD/MM/YYYY',
    theme: 'auto',
    notifications: {
      email: true,
      sms: false,
      push: true,
      inApp: true
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowMessages: true
    },
    preferences: {
      autoSave: true,
      compactMode: false,
      showTutorials: true
    },
    pos: {
      defaultCurrency: 'TZS',
      taxRate: 18,
      receiptHeader: 'Repair Shop\nManagement System',
      receiptFooter: 'Thank you for your business!\nVisit us again.',
      autoPrint: false,
      requireCustomerInfo: true,
      allowDiscounts: true,
      maxDiscountPercent: 20,
      barcodeScanner: true,
      cashDrawer: false,
      paymentMethods: ['cash', 'mpesa', 'card'],
      defaultPaymentMethod: 'cash',
      receiptNumbering: true,
      receiptPrefix: 'RS',
      lowStockAlert: true,
      lowStockThreshold: 5,
      inventoryTracking: true,
      returnPolicy: '7 days return policy',
      warrantyPeriod: 3,
      warrantyUnit: 'months'
    },
    delivery: {
      enable_delivery: false,
      default_delivery_fee: 2000,
      free_delivery_threshold: 50000,
      max_delivery_distance: 20,
      enable_delivery_areas: false,
      delivery_areas: ['City Center', 'Suburbs', 'Outskirts'],
      area_delivery_fees: { 'City Center': 1500, 'Suburbs': 2500, 'Outskirts': 3500 },
      area_delivery_times: { 'City Center': 2, 'Suburbs': 3, 'Outskirts': 4 },
      enable_delivery_hours: false,
      delivery_start_time: '08:00',
      delivery_end_time: '18:00',
      enable_same_day_delivery: false,
      enable_next_day_delivery: true,
      delivery_time_slots: ['Morning', 'Afternoon', 'Evening'],
      notify_customer_on_delivery: true,
      notify_driver_on_assignment: true,
      enable_sms_notifications: true,
      enable_email_notifications: false,
      enable_driver_assignment: false,
      driver_commission: 10,
      require_signature: true,
      enable_driver_tracking: false,
      enable_scheduled_delivery: false,
      enable_partial_delivery: false,
      require_advance_payment: false,
      advance_payment_percent: 50
    }
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // WhatsApp Business API settings state
  const [whatsappSettings, setWhatsappSettings] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    appId: '',
    appSecret: '',
    webhookVerifyToken: '',
    apiVersion: 'v18.0',
    enabled: false
  });
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [showWhatsappSecrets, setShowWhatsappSecrets] = useState(false);
  const [whatsappTestResult, setWhatsappTestResult] = useState<{ success: boolean; error?: string; data?: any } | null>(null);

  useEffect(() => {
    loadUserSettingsData();
    loadWhatsappSettings();
  }, [currentUser?.id]);

  const loadUserSettingsData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.id) {
        console.log('No current user, skipping settings load');
        return;
      }

      const userSettings = await loadUserSettings(currentUser.id);
      
      if (userSettings) {
        setSettings(prev => ({
          ...prev,
          ...userSettings
        }));
      } else {
        // Create default settings if none exist
        console.log('No user settings found, creating defaults...');
        const success = await createDefaultUserSettings(currentUser.id);
        if (success) {
          const defaultSettings = await loadUserSettings(currentUser.id);
          if (defaultSettings) {
            setSettings(prev => ({
              ...prev,
              ...defaultSettings
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section: string, data: any) => {
    try {
      setSaving(true);
      
      if (!currentUser?.id) {
        toast.error('No user logged in');
        return;
      }
      
      // Update local state
      const updatedSettings = {
        ...settings,
        ...data
      };
      setSettings(updatedSettings);

      // Save to database using the new API
      const success = await saveUserSettings(currentUser.id, updatedSettings, section);
      
      if (!success) {
        // If save failed, revert local state
        setSettings(prev => ({
          ...prev
        }));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload avatar logic here
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast.error('Failed to update password');
        return;
      }

      toast.success('Password updated successfully');
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // WhatsApp Business API functions
  const loadWhatsappSettings = async () => {
    try {
      setWhatsappLoading(true);
      const config = whatsappBusinessApi.getConfig();
      
      if (config) {
        setWhatsappSettings({
          accessToken: config.accessToken,
          phoneNumberId: config.phoneNumberId,
          businessAccountId: config.businessAccountId,
          appId: config.appId,
          appSecret: config.appSecret,
          webhookVerifyToken: config.webhookVerifyToken,
          apiVersion: config.apiVersion,
          enabled: whatsappBusinessApi.isConfigured()
        });
      }
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const saveWhatsappSettings = async () => {
    try {
      setWhatsappSaving(true);
      
      const success = await whatsappBusinessApi.updateConfig({
        accessToken: whatsappSettings.accessToken,
        phoneNumberId: whatsappSettings.phoneNumberId,
        businessAccountId: whatsappSettings.businessAccountId,
        appId: whatsappSettings.appId,
        appSecret: whatsappSettings.appSecret,
        webhookVerifyToken: whatsappSettings.webhookVerifyToken,
        apiVersion: whatsappSettings.apiVersion
      });

      if (success) {
        toast.success('WhatsApp Business API settings saved successfully');
        setWhatsappSettings(prev => ({ ...prev, enabled: true }));
      } else {
        toast.error('Failed to save WhatsApp Business API settings');
      }
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('Failed to save WhatsApp Business API settings');
    } finally {
      setWhatsappSaving(false);
    }
  };

  const testWhatsappConnection = async () => {
    try {
      setWhatsappLoading(true);
      setWhatsappTestResult(null);
      
      const result = await whatsappBusinessApi.testConnection();
      setWhatsappTestResult(result);
      
      if (result.success) {
        toast.success('WhatsApp Business API connection successful');
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      setWhatsappTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
      toast.error('Failed to test WhatsApp Business API connection');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const generateWebhookToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    setWhatsappSettings(prev => ({ ...prev, webhookVerifyToken: token }));
  };

  const sections = [
    {
      id: 'profile',
      name: 'Profile',
      icon: <User className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'branding',
      name: 'Branding',
      icon: <Image className="h-5 w-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'privacy',
      name: 'Privacy',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'security',
      name: 'Security',
      icon: <Lock className="h-5 w-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: <Palette className="h-5 w-5" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      id: 'preferences',
      name: 'Preferences',
      icon: <Settings className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'backup',
      name: 'Backup & Data',
      icon: <Database className="h-5 w-5" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      id: 'delivery',
      name: 'Delivery',
      icon: <Truck className="h-5 w-5" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Personal Preferences</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeSection === section.id
                      ? `${section.bgColor} ${section.color} ${section.borderColor} border-l-4`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.name}</span>
                  {activeSection === section.id && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {sections.find(s => s.id === activeSection)?.name}
            </h2>
            <p className="text-gray-600">
              Manage your personal {activeSection} settings and preferences
            </p>
          </div>
          
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Profile Information
                </h3>
                
                <div className="space-y-4">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                        {settings.displayName.charAt(0).toUpperCase()}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg cursor-pointer">
                        <Camera className="h-4 w-4 text-gray-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Profile Picture</p>
                      <p className="text-xs text-gray-500">Click to upload a new photo</p>
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={settings.displayName}
                        onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your display name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-600" />
                  Regional Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New York</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              <GlassButton
                onClick={() => saveSettings('Profile', settings)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Profile Settings'}
              </GlassButton>
            </div>
          )}

          {activeSection === 'branding' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Image className="h-5 w-5 text-indigo-600" />
                  App Branding
                </h3>
                
                <div className="space-y-6">
                  <LogoUpload
                    currentLogo={settings.appLogo}
                    onLogoChange={(logoUrl) => setSettings({ ...settings, appLogo: logoUrl })}
                    title="App Logo"
                    description="Upload your app logo. This will be displayed in the header and receipts. Recommended size: 200x200px"
                    maxSize={2}
                  />
                  
                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold mb-3">Current Logo Preview</h4>
                    {settings.appLogo ? (
                      <div className="flex items-center space-x-4">
                        <img
                          src={settings.appLogo}
                          alt="App Logo"
                          className="w-16 h-16 object-contain rounded-lg border"
                        />
                        <div>
                          <p className="text-sm text-gray-600">Logo is active and will be used throughout the app</p>
                          <p className="text-xs text-gray-500">Uploaded to {hostingerUploadService.isDevelopment() ? 'local storage' : 'Hostinger'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No logo uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <GlassButton
                  onClick={() => saveSettings('branding', { appLogo: settings.appLogo })}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Branding Settings'}
                </GlassButton>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">Email Notifications</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Receive email notifications for important updates</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold">SMS Notifications</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.sms}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, sms: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Receive SMS notifications for urgent alerts</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Bell className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold">Push Notifications</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.push}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, push: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Receive push notifications on your device</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Bell className="h-6 w-6 text-orange-600" />
                      <h3 className="text-lg font-semibold">In-App Notifications</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.inApp}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, inApp: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Show notifications within the app</p>
                </div>
              </div>

              <GlassButton
                onClick={() => saveSettings('Notifications', settings)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </GlassButton>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Eye className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">Profile Visibility</h3>
                    </div>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, profileVisibility: e.target.value as 'public' | 'private' }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <p className="text-gray-600 text-sm">Control who can see your profile information</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Bell className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold">Online Status</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showOnlineStatus}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, showOnlineStatus: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Show when you're online to other users</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold">Allow Messages</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.allowMessages}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, allowMessages: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Allow other users to send you messages</p>
                </div>
              </div>

              <GlassButton
                onClick={() => saveSettings('Privacy', settings)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </GlassButton>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={passwordData.showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordData({ ...passwordData, showCurrentPassword: !passwordData.showCurrentPassword })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {passwordData.showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={passwordData.showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordData({ ...passwordData, showNewPassword: !passwordData.showNewPassword })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {passwordData.showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={passwordData.showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordData({ ...passwordData, showConfirmPassword: !passwordData.showConfirmPassword })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {passwordData.showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <GlassButton
                      onClick={handlePasswordChange}
                      disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="flex items-center gap-2"
                    >
                      <Key className="h-4 w-4" />
                      {passwordLoading ? 'Updating Password...' : 'Update Password'}
                    </GlassButton>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Security Tips</h3>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Use a strong password with at least 8 characters</li>
                      <li>• Include a mix of letters, numbers, and symbols</li>
                      <li>• Never share your password with anyone</li>
                      <li>• Consider using a password manager</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-pink-600" />
                  Theme Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Application Theme</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          settings.theme === 'light' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSettings({ ...settings, theme: 'light' })}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Sun className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">Light Theme</span>
                        </div>
                        <p className="text-sm text-gray-600">Clean and bright interface</p>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          settings.theme === 'dark' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSettings({ ...settings, theme: 'dark' })}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Moon className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Dark Theme</span>
                        </div>
                        <p className="text-sm text-gray-600">Easy on the eyes</p>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          settings.theme === 'auto' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSettings({ ...settings, theme: 'auto' })}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Monitor className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Auto Theme</span>
                        </div>
                        <p className="text-sm text-gray-600">Follows system preference</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <GlassButton
                onClick={() => saveSettings('Appearance', settings)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Appearance Settings'}
              </GlassButton>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Save className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">Auto Save</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.autoSave}
                        onChange={(e) => setSettings({
                          ...settings,
                          preferences: { ...settings.preferences, autoSave: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Automatically save your work as you type</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Settings className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold">Compact Mode</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.compactMode}
                        onChange={(e) => setSettings({
                          ...settings,
                          preferences: { ...settings.preferences, compactMode: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Use a more compact interface layout</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Bell className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold">Show Tutorials</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.showTutorials}
                        onChange={(e) => setSettings({
                          ...settings,
                          preferences: { ...settings.preferences, showTutorials: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Show helpful tutorials and tips</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Download className="h-6 w-6 text-orange-600" />
                    <h3 className="text-lg font-semibold">Export Data</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Download your personal data</p>
                  <GlassButton variant="secondary" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export My Data
                  </GlassButton>
                </div>
              </div>

              <GlassButton
                onClick={() => saveSettings('Preferences', settings)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </GlassButton>
            </div>
          )}

          {activeSection === 'backup' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Database className="h-6 w-6 text-teal-600" />
                  Backup Management
                </h3>
                <p className="text-gray-600 mb-6">
                  Manage your data backups, create restore points, and configure automatic backup schedules.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <Cloud className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Data Backup</h4>
                        <p className="text-sm text-gray-600">Create and manage data backups</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Create manual backups, configure automatic scheduling, and manage backup files.
                    </p>
                    <GlassButton
                      onClick={() => navigate('/backup-management')}
                      className="w-full"
                    >
                      Manage Backups
                    </GlassButton>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <HardDrive className="h-8 w-8 text-green-600" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">SQL Database</h4>
                        <p className="text-sm text-gray-600">Database backup and restore</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Create SQL database dumps, test connections, and download backup files.
                    </p>
                    <GlassButton
                      onClick={() => navigate('/backup-management')}
                      variant="secondary"
                      className="w-full"
                    >
                      SQL Backup
                    </GlassButton>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Backup Recommendations</h4>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• Enable automatic backups for regular data protection</li>
                        <li>• Store backups in multiple locations (local + cloud)</li>
                        <li>• Test your backup restoration process regularly</li>
                        <li>• Keep at least 30 days of backup history</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'delivery' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Truck className="h-6 w-6 text-amber-600" />
                  Delivery Settings
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure delivery options, areas, fees, and driver management for your business.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* General Delivery Settings */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      General Settings
                    </h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.delivery?.enable_delivery || false}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, enable_delivery: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable Delivery Service</span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Delivery Fee (TZS)
                        </label>
                        <input
                          type="number"
                          value={settings.delivery?.default_delivery_fee || 2000}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, default_delivery_fee: Number(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Free Delivery Threshold (TZS)
                        </label>
                        <input
                          type="number"
                          value={settings.delivery?.free_delivery_threshold || 50000}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, free_delivery_threshold: Number(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="1000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Delivery Distance (km)
                        </label>
                        <input
                          type="number"
                          value={settings.delivery?.max_delivery_distance || 20}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, max_delivery_distance: Number(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Areas */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Delivery Areas
                    </h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.delivery?.enable_delivery_areas || false}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, enable_delivery_areas: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable Area-based Pricing</span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Areas (comma separated)
                        </label>
                        <input
                          type="text"
                          value={settings.delivery?.delivery_areas?.join(', ') || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            delivery: { 
                              ...prev.delivery, 
                              delivery_areas: e.target.value.split(',').map(area => area.trim()).filter(area => area)
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="City Center, Suburbs, Outskirts"
                        />
                      </div>

                      {/* Area-based Fees */}
                      {settings.delivery?.enable_delivery_areas && settings.delivery?.delivery_areas?.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Area-based Delivery Fees
                          </label>
                          {settings.delivery.delivery_areas.map((area, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 min-w-[80px]">{area}:</span>
                              <input
                                type="number"
                                value={settings.delivery?.area_delivery_fees?.[area] || 0}
                                onChange={(e) => setSettings(prev => ({
                                  ...prev,
                                  delivery: {
                                    ...prev.delivery,
                                    area_delivery_fees: {
                                      ...prev.delivery?.area_delivery_fees,
                                      [area]: Number(e.target.value)
                                    }
                                  }
                                }))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="100"
                                placeholder="Fee"
                              />
                              <span className="text-sm text-gray-500">TZS</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Settings */}
                <div className="mt-8 space-y-4">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Time Settings
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.enable_delivery_hours || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, enable_delivery_hours: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable Delivery Hours</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.enable_same_day_delivery || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, enable_same_day_delivery: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Same Day Delivery</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.enable_next_day_delivery || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, enable_next_day_delivery: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Next Day Delivery</span>
                    </label>
                  </div>

                  {settings.delivery?.enable_delivery_hours && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Start Time
                        </label>
                        <input
                          type="time"
                          value={settings.delivery?.delivery_start_time || '08:00'}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, delivery_start_time: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery End Time
                        </label>
                        <input
                          type="time"
                          value={settings.delivery?.delivery_end_time || '18:00'}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, delivery_end_time: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notification Settings */}
                <div className="mt-8 space-y-4">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Notification Settings
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.notify_customer_on_delivery || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, notify_customer_on_delivery: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Notify Customer on Delivery</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.notify_driver_on_assignment || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, notify_driver_on_assignment: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Notify Driver on Assignment</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.enable_sms_notifications || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, enable_sms_notifications: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.enable_email_notifications || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, enable_email_notifications: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                    </label>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="mt-8 space-y-4">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Advanced Settings
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.require_signature || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, require_signature: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Require Signature</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.enable_driver_tracking || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, enable_driver_tracking: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Driver Tracking</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.enable_scheduled_delivery || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, enable_scheduled_delivery: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Scheduled Delivery</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.delivery?.require_advance_payment || false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, require_advance_payment: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Require Advance Payment</span>
                    </label>
                  </div>

                  {settings.delivery?.require_advance_payment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Advance Payment Percentage
                      </label>
                      <input
                        type="number"
                        value={settings.delivery?.advance_payment_percent || 50}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          delivery: { ...prev.delivery, advance_payment_percent: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="100"
                        step="5"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Driver Commission (%)
                    </label>
                    <input
                      type="number"
                      value={settings.delivery?.driver_commission || 10}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        delivery: { ...prev.delivery, driver_commission: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="50"
                      step="1"
                    />
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Delivery Tips</h4>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• Set realistic delivery fees based on your area and costs</li>
                        <li>• Enable area-based pricing for better profitability</li>
                        <li>• Configure delivery hours to manage customer expectations</li>
                        <li>• Use notifications to keep customers informed</li>
                        <li>• Consider driver tracking for better service quality</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <GlassButton
                  onClick={() => saveSettings('Delivery', settings)}
                  disabled={saving}
                  className="flex items-center gap-2 mt-6"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Delivery Settings'}
                </GlassButton>
              </div>
            </div>
          )}

          {activeSection === 'whatsapp' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                  WhatsApp Business API Settings
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure WhatsApp Business API for sending and receiving messages. This uses Meta's official WhatsApp Business API.
                </p>

                {/* Setup Instructions */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Setup Instructions</h4>
                      <ol className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>1. Create a Meta Developer account at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a></li>
                        <li>2. Create a WhatsApp Business App in the Meta Developer Console</li>
                        <li>3. Add a phone number to your WhatsApp Business App</li>
                        <li>4. Get your Access Token, Phone Number ID, and Business Account ID</li>
                        <li>5. Configure your webhook URL and verify token</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* API Configuration */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      API Configuration
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Access Token *
                      </label>
                      <div className="relative">
                        <input
                          type={showWhatsappSecrets ? 'text' : 'password'}
                          value={whatsappSettings.accessToken}
                          onChange={(e) => setWhatsappSettings(prev => ({ ...prev, accessToken: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="EAA..."
                        />
                        <button
                          onClick={() => setShowWhatsappSecrets(!showWhatsappSecrets)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                        >
                          {showWhatsappSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Your Meta App's access token</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number ID *
                      </label>
                      <input
                        type="text"
                        value={whatsappSettings.phoneNumberId}
                        onChange={(e) => setWhatsappSettings(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="123456789"
                      />
                      <p className="text-xs text-gray-500 mt-1">The ID of your WhatsApp Business phone number</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Account ID *
                      </label>
                      <input
                        type="text"
                        value={whatsappSettings.businessAccountId}
                        onChange={(e) => setWhatsappSettings(prev => ({ ...prev, businessAccountId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="123456789"
                      />
                      <p className="text-xs text-gray-500 mt-1">Your Meta Business Account ID</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Version
                      </label>
                      <select
                        value={whatsappSettings.apiVersion}
                        onChange={(e) => setWhatsappSettings(prev => ({ ...prev, apiVersion: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="v18.0">v18.0 (Latest)</option>
                        <option value="v17.0">v17.0</option>
                        <option value="v16.0">v16.0</option>
                        <option value="v15.0">v15.0</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Meta Graph API version to use</p>
                    </div>
                  </div>

                  {/* Webhook Configuration */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Webhook Configuration
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook Verify Token *
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={whatsappSettings.webhookVerifyToken}
                          onChange={(e) => setWhatsappSettings(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="your-verify-token"
                        />
                        <button
                          onClick={generateWebhookToken}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                        >
                          Generate
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Token for webhook verification</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook URL
                      </label>
                      <input
                        type="text"
                        value={`${window.location.origin}/api/whatsapp-business-webhook`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Use this URL in your Meta App webhook settings</p>
                    </div>

                    {/* Connection Test */}
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Test Connection</h4>
                      <button
                        onClick={testWhatsappConnection}
                        disabled={whatsappLoading || !whatsappSettings.accessToken || !whatsappSettings.phoneNumberId}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {whatsappLoading ? 'Testing...' : 'Test Connection'}
                      </button>

                      {whatsappTestResult && (
                        <div className={`mt-3 p-3 rounded-md ${
                          whatsappTestResult.success 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {whatsappTestResult.success ? (
                              <CheckCircle className="text-green-600" size={20} />
                            ) : (
                              <XCircle className="text-red-600" size={20} />
                            )}
                            <span className={`font-medium ${
                              whatsappTestResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {whatsappTestResult.success ? 'Connection Successful' : 'Connection Failed'}
                            </span>
                          </div>
                          {whatsappTestResult.error && (
                            <p className="text-sm text-red-700 mt-1">{whatsappTestResult.error}</p>
                          )}
                          {whatsappTestResult.success && whatsappTestResult.data && (
                            <div className="text-sm text-green-700 mt-2">
                              <p><strong>Phone Number:</strong> {whatsappTestResult.data.phoneNumber}</p>
                              <p><strong>Verified Name:</strong> {whatsappTestResult.data.verifiedName}</p>
                              <p><strong>Quality Rating:</strong> {whatsappTestResult.data.qualityRating}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Help Links */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Helpful Links</h4>
                  <div className="space-y-2">
                    <a
                      href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp Business API Documentation</span>
                    </a>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <MessageCircle size={14} />
                      <span>Meta Developer Console</span>
                    </a>
                    <a
                      href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <MessageCircle size={14} />
                      <span>Webhook Setup Guide</span>
                    </a>
                  </div>
                </div>

                <GlassButton
                  onClick={saveWhatsappSettings}
                  disabled={whatsappSaving}
                  className="flex items-center gap-2 mt-6"
                >
                  <Save className="h-4 w-4" />
                  {whatsappSaving ? 'Saving...' : 'Save WhatsApp Settings'}
                </GlassButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 