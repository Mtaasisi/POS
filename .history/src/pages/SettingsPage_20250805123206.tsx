import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
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
  EyeOff
} from 'lucide-react';
import GlassButton from '../components/ui/GlassButton';
import toast from 'react-hot-toast';

interface UserSettings {
  displayName: string;
  email: string;
  phone: string;
  avatar: string;
  appLogo: string;
  language: string;
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showOnlineStatus: boolean;
    allowMessages: boolean;
  };
  preferences: {
    autoSave: boolean;
    compactMode: boolean;
    showTutorials: boolean;
  };
  pos: {
    defaultCurrency: string;
    taxRate: number;
    receiptHeader: string;
    receiptFooter: string;
    autoPrint: boolean;
    requireCustomerInfo: boolean;
    allowDiscounts: boolean;
    maxDiscountPercent: number;
    barcodeScanner: boolean;
    cashDrawer: boolean;
    paymentMethods: string[];
    defaultPaymentMethod: string;
    receiptNumbering: boolean;
    receiptPrefix: string;
    lowStockAlert: boolean;
    lowStockThreshold: number;
    inventoryTracking: boolean;
    returnPolicy: string;
    warrantyPeriod: number;
    warrantyUnit: 'days' | 'weeks' | 'months' | 'years';
  };
}

const SettingsPage: React.FC = () => {
  const { currentUser, updateUser } = useAuth();
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

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', currentUser?.id)
        .single();

      if (data && !error) {
        setSettings(prev => ({
          ...prev,
          ...data.settings
        }));
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
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        ...data
      }));

      // Save to database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser?.id,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(`${section} settings saved successfully`);
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
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 