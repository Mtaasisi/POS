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
import { getSettings, updateSetting, updateSettings, getDefaultSettings } from '../lib/settingsApi';
import { exportCustomerData, exportDeviceData, exportPaymentData, exportAllData, downloadBlob, clearOfflineCache } from '../lib/dataExportApi';
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
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Settings content for {activeSection} will be implemented here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 