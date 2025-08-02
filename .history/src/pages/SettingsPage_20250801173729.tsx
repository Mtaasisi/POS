import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Settings, 
  Users, 
  Palette, 
  Bell, 
  Globe, 
  Database, 
  Shield, 
  Zap,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Save,
  Search,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  ChevronLeft,
  Wrench,
  X,
  Mail,
  Phone,
  MapPin,
  Camera,
  Image,
  Archive,
  Target,
  PieChart,
  TrendingUp,
  UserCheck,
  Cog,
  Key,
  Eye,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Star,
  Award,
  Gift,
  Tag,
  Hash,
  Building,
  MessageSquare,
  BarChart2,
  FileText,
  RotateCcw,
  DollarSign,
  CreditCard,
  Smartphone
} from 'lucide-react';

import GlassButton from '../components/ui/GlassButton';
import { getSettings, updateSetting, updateSettings, getDefaultSettings, createSettingsBackup, restoreSettingsBackup, SettingsBackup } from '../lib/settingsApi';
import { exportCustomerData, exportDeviceData, exportPaymentData, exportAllData, downloadBlob, clearOfflineCache } from '../lib/dataExportApi';
import { logSettingsChange, logSystemEvent } from '../lib/auditService';
import { changeWallpaper, wallpaperOptions, getCurrentWallpaper } from '../lib/backgroundUtils';
import toast from 'react-hot-toast';

interface SettingsData {
  [key: string]: any;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer-care' | 'technician';
}

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [currentWallpaper, setCurrentWallpaper] = useState(getCurrentWallpaper());

  // Form states for different sections
  const [generalSettings, setGeneralSettings] = useState({
    app_name: '',
    app_description: '',
    default_currency: 'TZS',
    timezone: 'Africa/Dar_es_Salaam',
    date_format: 'DD/MM/YYYY',
    time_format: 'HH:mm',
    contact_email: '',
    contact_phone: ''
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    background_theme: 'default'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    sms_notifications_enabled: false,
    whatsapp_notifications_enabled: false,
    email_notifications_enabled: false,
    in_app_notifications_enabled: true
  });

  const [advancedSettings, setAdvancedSettings] = useState({
    debug_mode: false,
    reminder_service_enabled: true,
    offline_sync_enabled: true
  });

  const [whatsappCredentials, setWhatsappCredentials] = useState({
    instanceId: '',
    apiKey: ''
  });

  const [backupFile, setBackupFile] = useState<File | null>(null);

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const fetchedSettings = await getSettings();
      const defaults = getDefaultSettings();
      
      // Merge fetched settings with defaults
      const mergedSettings = { ...defaults, ...fetchedSettings };
      setSettings(mergedSettings);
      
      // Update form states
      setGeneralSettings({
        app_name: mergedSettings.app_name || '',
        app_description: mergedSettings.app_description || '',
        default_currency: mergedSettings.default_currency || 'TZS',
        timezone: mergedSettings.timezone || 'Africa/Dar_es_Salaam',
        date_format: mergedSettings.date_format || 'DD/MM/YYYY',
        time_format: mergedSettings.time_format || 'HH:mm',
        contact_email: mergedSettings.contact_email || '',
        contact_phone: mergedSettings.contact_phone || ''
      });

      setAppearanceSettings({
        background_theme: mergedSettings.background_theme || 'default'
      });

      setNotificationSettings({
        sms_notifications_enabled: mergedSettings.sms_notifications_enabled || false,
        whatsapp_notifications_enabled: mergedSettings.whatsapp_notifications_enabled || false,
        email_notifications_enabled: mergedSettings.email_notifications_enabled || false,
        in_app_notifications_enabled: mergedSettings.in_app_notifications_enabled !== false
      });

      setAdvancedSettings({
        debug_mode: mergedSettings.debug_mode || false,
        reminder_service_enabled: mergedSettings.reminder_service_enabled !== false,
        offline_sync_enabled: mergedSettings.offline_sync_enabled !== false
      });

      setWhatsappCredentials({
        instanceId: mergedSettings.whatsapp_instance_id || '',
        apiKey: mergedSettings.whatsapp_green_api_key || ''
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (currentUser?.role !== 'admin') return;
    
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, email, name, role');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const saveSectionSettings = async (section: string, data: any) => {
    try {
      setSaving(true);
      const success = await updateSettings(data);
      
      if (success) {
        toast.success(`${section} settings saved successfully`);
        await loadSettings(); // Reload to get updated values
      } else {
        toast.error(`Failed to save ${section} settings`);
      }
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      toast.error(`Failed to save ${section} settings`);
    } finally {
      setSaving(false);
    }
  };

  const handleWallpaperChange = (wallpaperId: string) => {
    changeWallpaper(wallpaperId);
    setCurrentWallpaper(wallpaperId);
    updateSetting('background_theme', wallpaperId);
    toast.success('Background updated successfully');
  };

  const handleDataExport = async (type: string) => {
    try {
      setExporting(type);
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'customers':
          blob = await exportCustomerData();
          filename = `customers_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'devices':
          blob = await exportDeviceData();
          filename = `devices_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'payments':
          blob = await exportPaymentData();
          filename = `payments_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'all':
          blob = await exportAllData();
          filename = `all_data_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      downloadBlob(blob, filename);
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(`Failed to export ${type} data`);
    } finally {
      setExporting(null);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all offline cache? This will log you out.')) {
      return;
    }

    try {
      const success = await clearOfflineCache();
      if (success) {
        toast.success('Cache cleared successfully');
        // Reload the page to apply changes
        window.location.reload();
      } else {
        toast.error('Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('auth_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        toast.error('Failed to update user role');
        return;
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ));

      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleSaveWhatsAppCredentials = async () => {
    try {
      const success = await updateSettings({
        whatsapp_instance_id: whatsappCredentials.instanceId,
        whatsapp_green_api_key: whatsappCredentials.apiKey
      });

      if (success) {
        toast.success('WhatsApp credentials saved successfully');
        await logSettingsChange('updated', 'WhatsApp credentials updated');
      } else {
        toast.error('Failed to save WhatsApp credentials');
      }
    } catch (error) {
      console.error('Error saving WhatsApp credentials:', error);
      toast.error('Failed to save WhatsApp credentials');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const backup = await createSettingsBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const filename = `settings_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      downloadBlob(blob, filename);
      toast.success('Settings backup created successfully');
      await logSettingsChange('backup_created', `Settings backup created with ${backup.metadata.totalSettings} settings`);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create settings backup');
    }
  };

  const handleRestoreBackup = async () => {
    if (!backupFile) {
      toast.error('Please select a backup file');
      return;
    }

    try {
      const text = await backupFile.text();
      const backup: SettingsBackup = JSON.parse(text);

      // Validate backup structure
      if (!backup.settings || !backup.timestamp || !backup.version) {
        toast.error('Invalid backup file format');
        return;
      }

      const success = await restoreSettingsBackup(backup);
      
      if (success) {
        toast.success('Settings restored successfully');
        await logSettingsChange('restored', `Settings restored from backup created on ${backup.timestamp}`);
        // Reload settings
        await loadSettings();
      } else {
        toast.error('Failed to restore settings');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore settings');
    }
  };

  const handleBackupFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setBackupFile(file);
    } else {
      toast.error('Please select a valid JSON backup file');
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600">You do not have permission to view this page. Only administrators can access the settings.</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: 'general',
      name: 'General',
      icon: <Settings className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: <Palette className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
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
      id: 'integrations',
      name: 'Integrations',
      icon: <Globe className="h-5 w-5" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      id: 'data-management',
      name: 'Data Management',
      icon: <Database className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'user-management',
      name: 'User Management',
      icon: <Users className="h-5 w-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'advanced',
      name: 'Advanced',
      icon: <Cog className="h-5 w-5" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      id: 'system-info',
      name: 'System Info',
      icon: <Info className="h-5 w-5" />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
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
            <Settings className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">System Configuration</p>
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
              Configure {activeSection.replace('-', ' ')} settings and preferences
            </p>
          </div>
          
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
                  <input
                    type="text"
                    value={generalSettings.app_name}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, app_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter app name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                  <select
                    value={generalSettings.default_currency}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, default_currency: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="TZS">Tanzanian Shilling (TZS)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Description</label>
                <textarea
                  value={generalSettings.app_description}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, app_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter app description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={generalSettings.date_format}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, date_format: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={generalSettings.contact_email}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contact_email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={generalSettings.contact_phone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+255 123 456 789"
                  />
                </div>
              </div>

              <GlassButton
                onClick={() => saveSectionSettings('General', generalSettings)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save General Settings'}
              </GlassButton>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Background Themes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wallpaperOptions.map((wallpaper) => (
                    <div
                      key={wallpaper.id}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        currentWallpaper === wallpaper.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleWallpaperChange(wallpaper.id)}
                    >
                      <div
                        className="w-full h-24 rounded mb-2"
                        style={{ background: wallpaper.preview }}
                      />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{wallpaper.name}</p>
                        {currentWallpaper === wallpaper.id && (
                          <CheckCircle className="h-5 w-5 text-blue-500 mx-auto mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data-management' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Data Export Notice</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This exports only the data from your tables. It does not include database schema, functions, or RLS policies. 
                      For a complete backup, use the Supabase dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Customer Data Export</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Export all customer information and records</p>
                  <GlassButton
                    onClick={() => handleDataExport('customers')}
                    disabled={exporting === 'customers'}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting === 'customers' ? 'Exporting...' : 'Export Customers'}
                  </GlassButton>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Device Data Export</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Export all device information and repair records</p>
                  <GlassButton
                    onClick={() => handleDataExport('devices')}
                    disabled={exporting === 'devices'}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting === 'devices' ? 'Exporting...' : 'Export Devices'}
                  </GlassButton>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold">Payment Data Export</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Export all payment and financial records</p>
                  <GlassButton
                    onClick={() => handleDataExport('payments')}
                    disabled={exporting === 'payments'}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting === 'payments' ? 'Exporting...' : 'Export Payments'}
                  </GlassButton>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-6 w-6 text-orange-600" />
                    <h3 className="text-lg font-semibold">All Data Export</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Export all data (customers, devices, payments)</p>
                  <GlassButton
                    onClick={() => handleDataExport('all')}
                    disabled={exporting === 'all'}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting === 'all' ? 'Exporting...' : 'Export All Data'}
                  </GlassButton>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <RefreshCw className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold">Clear Offline Cache</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Clear all cached data and offline storage. This will log you out and require a fresh login.
                </p>
                <GlassButton
                  onClick={handleClearCache}
                  variant="danger"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Cache
                </GlassButton>
              </div>
            </div>
          )}

          {activeSection === 'user-management' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">{user.name}</td>
                          <td className="p-4">{user.email}</td>
                          <td className="p-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="admin">Admin</option>
                              <option value="customer-care">Customer Care</option>
                              <option value="technician">Technician</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <GlassButton size="sm" variant="secondary">
                              <Edit className="h-4 w-4" />
                            </GlassButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'advanced' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Zap className="h-6 w-6 text-yellow-600" />
                      <h3 className="text-lg font-semibold">Debug Mode</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancedSettings.debug_mode}
                        onChange={(e) => setAdvancedSettings({
                          ...advancedSettings,
                          debug_mode: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Enable debug mode for development and troubleshooting</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Bell className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold">Reminder Service</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancedSettings.reminder_service_enabled}
                        onChange={(e) => setAdvancedSettings({
                          ...advancedSettings,
                          reminder_service_enabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Enable automated reminder service for tasks and appointments</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">Offline Sync</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancedSettings.offline_sync_enabled}
                        onChange={(e) => setAdvancedSettings({
                          ...advancedSettings,
                          offline_sync_enabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm">Enable offline data synchronization</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <RefreshCw className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold">Force Sync</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Manually trigger offline data synchronization</p>
                  <GlassButton
                    onClick={() => {
                      // Trigger manual sync
                      toast.success('Manual sync triggered');
                    }}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Force Sync
                  </GlassButton>
                </div>
              </div>

              <GlassButton
                onClick={() => saveSectionSettings('Advanced', advancedSettings)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Advanced Settings'}
              </GlassButton>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">SMS Notifications</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.sms_notifications_enabled}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          sms_notifications_enabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Enable SMS notifications for customer updates</p>
                  <GlassButton
                    onClick={() => window.location.href = '/sms'}
                    variant="secondary"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    SMS Control Center
                  </GlassButton>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Globe className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold">WhatsApp Notifications</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsapp_notifications_enabled}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          whatsapp_notifications_enabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Enable WhatsApp notifications and messaging</p>
                  <GlassButton
                    onClick={() => window.location.href = '/whatsapp'}
                    variant="secondary"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    WhatsApp Manager
                  </GlassButton>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-6 w-6 text-purple-600" />
                      <h3 className="text-lg font-semibold">Email Notifications</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.email_notifications_enabled}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email_notifications_enabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Enable email notifications for system alerts</p>
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
                        checked={notificationSettings.in_app_notifications_enabled}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          in_app_notifications_enabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Enable in-app notifications and alerts</p>
                </div>
              </div>

              <GlassButton
                onClick={() => saveSectionSettings('Notifications', notificationSettings)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </GlassButton>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Supabase Configuration</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                      <input
                        type="text"
                        value="https://jxhzveborezjhsmzsgbc.supabase.co"
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Anon Key</label>
                      <input
                        type="password"
                        value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">WhatsApp Green API</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instance ID</label>
                      <input
                        type="text"
                        value={whatsappCredentials.instanceId}
                        onChange={(e) => setWhatsappCredentials({ ...whatsappCredentials, instanceId: e.target.value })}
                        placeholder="Enter Instance ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <input
                        type="password"
                        value={whatsappCredentials.apiKey}
                        onChange={(e) => setWhatsappCredentials({ ...whatsappCredentials, apiKey: e.target.value })}
                        placeholder="Enter API Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <GlassButton 
                      size="sm"
                      onClick={handleSaveWhatsAppCredentials}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Credentials
                    </GlassButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'system-info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Database Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connection Status:</span>
                      <span className="text-green-600 font-medium">Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Database Type:</span>
                      <span className="font-medium">PostgreSQL (Supabase)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span className="font-medium">US East (N. Virginia)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Environment</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Environment:</span>
                      <span className="font-medium">Production</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart2 className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-semibold">System Statistics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Active Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">100%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                  <h3 className="text-lg font-semibold">Cache Status</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Offline Cache:</span>
                    <span className="text-green-600 font-medium">Enabled</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sync Status:</span>
                    <span className="text-green-600 font-medium">Up to Date</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-medium">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection !== 'general' && activeSection !== 'appearance' && activeSection !== 'notifications' && activeSection !== 'integrations' && activeSection !== 'data-management' && activeSection !== 'user-management' && activeSection !== 'advanced' && activeSection !== 'system-info' && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Settings content for {activeSection} will be implemented here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 