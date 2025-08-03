import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Settings, 
  Database, 
  Shield, 
  Users, 
  Bell, 
  Globe, 
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Save,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  Wrench,
  X,
  Mail,
  Phone,
  MapPin,
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
  Smartphone,
  Server,
  HardDrive,
  Network,
  Activity,
  Zap,
  Palette
} from 'lucide-react';

import GlassButton from '../components/ui/GlassButton';
import { getSettings, updateSetting, updateSettings, getDefaultSettings, createSettingsBackup, restoreSettingsBackup, SettingsBackup } from '../lib/settingsApi';
import { 
  exportCustomerData, 
  exportDeviceData, 
  exportPaymentData, 
  exportAllData, 
  exportCustomerDataAsSQL,
  exportDeviceDataAsSQL,
  exportPaymentDataAsSQL,
  exportAllDataAsSQL,
  exportDatabaseSchema,
  downloadBlob, 
  clearOfflineCache 
} from '../lib/dataExportApi';
import { logSettingsChange, logSystemEvent } from '../lib/auditService';
import { changeWallpaper, wallpaperOptions, getCurrentWallpaper } from '../lib/backgroundUtils';
import { useTheme } from '../context/ThemeContext';
import { runHealthCheck, getSystemStatistics, SystemHealth } from '../lib/systemHealthService';
import { 
  getIntegrations, 
  saveIntegration, 
  deleteIntegration, 
  testIntegration,
  getAllIntegrationStatuses,
  initializeDefaultIntegrations,
  IntegrationConfig,
  IntegrationStatus
} from '../lib/integrationService';
import { 
  getDatabaseTables,
  optimizeDatabase,
  cleanOldLogs,
  getSystemHealth as getBackendSystemHealth,
  createBackup,
  getBackups,
  getPerformanceMetrics,
  rotateApiKeys,
  validateApiKey,
  DatabaseTable as BackendDatabaseTable,
  SystemHealth as BackendSystemHealth,
  BackupInfo
} from '../lib/backendManagementApi';
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

interface DatabaseTable {
  name: string;
  row_count: number;
  size: string;
  last_updated: string;
}

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [currentWallpaper, setCurrentWallpaper] = useState(getCurrentWallpaper());
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const { theme, setTheme } = useTheme();

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

  const [notificationSettings, setNotificationSettings] = useState({
    sms_notifications_enabled: false,
    whatsapp_notifications_enabled: false,
    email_notifications_enabled: false,
    in_app_notifications_enabled: true
  });

  const [whatsappCredentials, setWhatsappCredentials] = useState({
    instanceId: '',
    apiKey: ''
  });
  const [smsBalance, setSmsBalance] = useState<string>('3449');
  const [smsStatus, setSmsStatus] = useState<'active' | 'inactive' | 'checking'>('active');
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  const [advancedSettings, setAdvancedSettings] = useState({
    debug_mode: false,
    reminder_service_enabled: true,
    offline_sync_enabled: true,
    auto_backup_enabled: true,
    performance_monitoring: true,
    error_logging: true
  });

  useEffect(() => {
    loadSettings();
    loadUsers();
    loadDatabaseInfo();
    checkSMSBalance(); // Check SMS balance on load
    loadIntegrations(); // Load integrations
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

      setNotificationSettings({
        sms_notifications_enabled: mergedSettings.sms_notifications_enabled || false,
        whatsapp_notifications_enabled: mergedSettings.whatsapp_notifications_enabled || false,
        email_notifications_enabled: mergedSettings.email_notifications_enabled || false,
        in_app_notifications_enabled: mergedSettings.in_app_notifications_enabled !== false
      });

      setAdvancedSettings({
        debug_mode: mergedSettings.debug_mode || false,
        reminder_service_enabled: mergedSettings.reminder_service_enabled !== false,
        offline_sync_enabled: mergedSettings.offline_sync_enabled !== false,
        auto_backup_enabled: mergedSettings.auto_backup_enabled !== false,
        performance_monitoring: mergedSettings.performance_monitoring !== false,
        error_logging: mergedSettings.error_logging !== false
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

  const loadDatabaseInfo = async () => {
    try {
      const tables = await getDatabaseTables();
      setDatabaseTables(tables);
    } catch (error) {
      console.error('Error loading database info:', error);
    }
  };

  const handleDatabaseOptimization = async () => {
    try {
      const success = await optimizeDatabase();
      if (success) {
        toast.success('Database optimization completed');
      }
    } catch (error) {
      console.error('Error optimizing database:', error);
      toast.error('Failed to optimize database');
    }
  };

  const handleCleanOldLogs = async () => {
    try {
      const success = await cleanOldLogs(30);
      if (success) {
        toast.success('Old logs cleaned successfully');
      }
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      toast.error('Failed to clean old logs');
    }
  };

  const saveSectionSettings = async (section: string, data: any) => {
    try {
      setSaving(true);
      const success = await updateSettings(data);
      
      if (success) {
        toast.success(`${section} settings saved successfully`);
        try {
          await logSettingsChange('updated', `${section} settings updated`);
        } catch (error) {
          console.warn('Failed to log settings change:', error);
        }
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

  const handleDataExport = async (type: string, format: 'json' | 'sql' = 'json') => {
    try {
      setExporting(type);
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'customers':
          blob = format === 'sql' ? await exportCustomerDataAsSQL() : await exportCustomerData();
          filename = `customers_export_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'devices':
          blob = format === 'sql' ? await exportDeviceDataAsSQL() : await exportDeviceData();
          filename = `devices_export_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'payments':
          blob = format === 'sql' ? await exportPaymentDataAsSQL() : await exportPaymentData();
          filename = `payments_export_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'all':
          blob = format === 'sql' ? await exportAllDataAsSQL() : await exportAllData();
          filename = `all_data_export_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      downloadBlob(blob, filename);
      toast.success(`${type} data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(`Failed to export ${type} data`);
    } finally {
      setExporting(null);
    }
  };

  const handleSchemaExport = async () => {
    try {
      setExporting('schema');
      const blob = await exportDatabaseSchema();
      const filename = `database_schema_${new Date().toISOString().split('T')[0]}.sql`;
      
      downloadBlob(blob, filename);
      toast.success('Database schema exported successfully');
    } catch (error) {
      console.error('Error exporting schema:', error);
      toast.error('Failed to export database schema');
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
        try {
          await logSettingsChange('updated', 'WhatsApp credentials updated');
        } catch (error) {
          console.warn('Failed to log settings change:', error);
        }
      } else {
        toast.error('Failed to save WhatsApp credentials');
      }
    } catch (error) {
      console.error('Error saving WhatsApp credentials:', error);
      toast.error('Failed to save WhatsApp credentials');
    }
  };

  const checkSMSBalance = async () => {
    try {
      setSmsStatus('checking');
      const params = new URLSearchParams({
        user: 'Inauzwa',
        pwd: '@Masika10',
      });
      
      const response = await fetch(`https://mshastra.com/balance.aspx?${params.toString()}`);
      const responseText = await response.text();
      
      if (response.ok) {
        const balanceMatch = responseText.match(/=\s*(\d+)/);
        if (balanceMatch) {
          setSmsBalance(balanceMatch[1]);
          setSmsStatus('active');
        } else {
          setSmsStatus('inactive');
        }
      } else {
        setSmsStatus('inactive');
      }
    } catch (error) {
      console.error('Error checking SMS balance:', error);
      setSmsStatus('inactive');
    }
  };

  const loadIntegrations = async () => {
    try {
      setLoadingIntegrations(true);
      const fetchedIntegrations = await getIntegrations();
      setIntegrations(fetchedIntegrations);
      
      // Get statuses for all integrations
      const statuses = await getAllIntegrationStatuses();
      setIntegrationStatuses(statuses);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleInitializeIntegrations = async () => {
    try {
      await initializeDefaultIntegrations();
      await loadIntegrations();
      toast.success('Default integrations initialized');
    } catch (error) {
      console.error('Error initializing integrations:', error);
      toast.error('Failed to initialize integrations');
    }
  };

  const handleTestIntegration = async (integration: IntegrationConfig) => {
    try {
      const status = await testIntegration(integration);
      setIntegrationStatuses(prev => ({
        ...prev,
        [integration.name]: status
      }));
      
      if (status.isConnected) {
        toast.success(`${integration.name} is connected`);
      } else {
        toast.error(`${integration.name} connection failed: ${status.error}`);
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      toast.error('Failed to test integration');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const backup = await createSettingsBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const filename = `settings_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      downloadBlob(blob, filename);
      toast.success('Settings backup created successfully');
      try {
        await logSettingsChange('backup_created', `Settings backup created with ${backup.metadata.totalSettings} settings`);
      } catch (error) {
        console.warn('Failed to log backup creation:', error);
      }
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
        try {
          await logSettingsChange('restored', `Settings restored from backup created on ${backup.timestamp}`);
        } catch (error) {
          console.warn('Failed to log settings restoration:', error);
        }
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

  const runSystemHealthCheck = async () => {
    try {
      setHealthLoading(true);
      const health = await runHealthCheck();
      const stats = await getSystemStatistics();
      
      setSystemHealth(health);
      setSystemStats(stats);
      
      toast.success('System health check completed');
      try {
        await logSystemEvent('health_check', 'System health check performed');
      } catch (error) {
        console.warn('Failed to log system event:', error);
      }
    } catch (error) {
      console.error('Error running health check:', error);
      toast.error('Failed to run system health check');
    } finally {
      setHealthLoading(false);
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
      id: 'dashboard',
      name: 'Dashboard',
      icon: <Server className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'general',
      name: 'General',
      icon: <Settings className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
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
          
          {activeSection === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold">Database Overview</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">Your Supabase database statistics</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Table</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Rows</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Size</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {databaseTables.map(table => (
                        <tr key={table.name} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">{table.name}</td>
                          <td className="p-4">{table.row_count}</td>
                          <td className="p-4">{table.size}</td>
                          <td className="p-4">{new Date(table.last_updated).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold">System Status</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">Current health and performance metrics</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Memory Usage:</span>
                    <span className="font-medium">{Math.round(systemHealth?.performance.memoryUsage * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{Math.round(systemHealth?.performance.uptime / 60)} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Errors:</span>
                    <span className="font-medium">{systemHealth?.errors.count}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                          theme === 'light' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setTheme('light')}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                          <span className="font-medium">Light Theme</span>
                        </div>
                        <p className="text-sm text-gray-600">Clean and bright interface with light backgrounds</p>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          theme === 'dark' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setTheme('dark')}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                          <span className="font-medium">Dark Theme</span>
                        </div>
                        <p className="text-sm text-gray-600">Dark interface with subtle card visibility</p>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          theme === 'dark-cards' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setTheme('dark-cards')}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-4 h-4 bg-indigo-600 rounded-full"></div>
                          <span className="font-medium">Dark with Visible Cards</span>
                        </div>
                        <p className="text-sm text-gray-600">Dark theme with enhanced card visibility and contrast</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Theme Preview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border">
                        <div className="bg-white p-3 rounded border mb-2">
                          <div className="h-2 bg-gray-200 rounded mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <p className="text-xs text-gray-600">Light cards on light background</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg border">
                        <div className="bg-gray-700 p-3 rounded border mb-2">
                          <div className="h-2 bg-gray-500 rounded mb-1"></div>
                          <div className="h-2 bg-gray-500 rounded w-3/4"></div>
                        </div>
                        <p className="text-xs text-gray-400">Dark cards on dark background</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg border">
                        <div className="bg-gray-600 p-3 rounded border mb-2">
                          <div className="h-2 bg-gray-300 rounded mb-1"></div>
                          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                        </div>
                        <p className="text-xs text-gray-400">Visible cards on dark background</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold">Gemini AI Integration</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <input
                        type="password"
                        placeholder="Enter Gemini API Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gemini-pro-vision">Gemini Pro Vision</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Enable AI Features</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <GlassButton 
                      size="sm"
                      variant="secondary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Gemini Settings
                    </GlassButton>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">SMS Provider (Mobishastra)</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                      <select 
                        value="mobishastra"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled
                      >
                        <option value="mobishastra">Mobishastra</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value="Inauzwa"
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value="@Masika10"
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
                      <input
                        type="text"
                        value="INAUZWA"
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                      <input
                        type="text"
                        value="https://mshastra.com/sendurl.aspx"
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
                      />
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-md border ${
                      smsStatus === 'active' ? 'bg-green-50 border-green-200' :
                      smsStatus === 'checking' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {smsStatus === 'active' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {smsStatus === 'checking' && <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />}
                        {smsStatus === 'inactive' && <XCircle className="h-4 w-4 text-red-600" />}
                        <span className={`text-sm ${
                          smsStatus === 'active' ? 'text-green-700' :
                          smsStatus === 'checking' ? 'text-yellow-700' :
                          'text-red-700'
                        }`}>
                          {smsStatus === 'active' ? 'SMS Service Active' :
                           smsStatus === 'checking' ? 'Checking SMS Status...' :
                           'SMS Service Inactive'}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        smsStatus === 'active' ? 'text-green-600 bg-green-100' :
                        smsStatus === 'checking' ? 'text-yellow-600 bg-yellow-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {smsStatus === 'checking' ? 'Checking...' : `${smsBalance} credits`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <GlassButton 
                        size="sm"
                        variant="secondary"
                        onClick={checkSMSBalance}
                        disabled={smsStatus === 'checking'}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${smsStatus === 'checking' ? 'animate-spin' : ''}`} />
                        Refresh Balance
                      </GlassButton>
                      <GlassButton 
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open('https://mshastra.com', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Mobishastra
                      </GlassButton>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="h-6 w-6 text-red-600" />
                    <h3 className="text-lg font-semibold">Email Service</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500">
                        <option value="">Select Email Provider</option>
                        <option value="sendgrid">SendGrid</option>
                        <option value="mailgun">Mailgun</option>
                        <option value="aws-ses">AWS SES</option>
                        <option value="smtp">Custom SMTP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <input
                        type="password"
                        placeholder="Enter Email API Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                      <input
                        type="email"
                        placeholder="noreply@yourcompany.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <GlassButton 
                      size="sm"
                      variant="secondary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Email Settings
                    </GlassButton>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart2 className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-lg font-semibold">Analytics Integration</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="">Select Analytics Provider</option>
                        <option value="google-analytics">Google Analytics</option>
                        <option value="mixpanel">Mixpanel</option>
                        <option value="amplitude">Amplitude</option>
                        <option value="posthog">PostHog</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tracking ID</label>
                      <input
                        type="text"
                        placeholder="Enter Tracking ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Enable Analytics</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <GlassButton 
                      size="sm"
                      variant="secondary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Analytics Settings
                    </GlassButton>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Payment Gateway</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        <option value="">Select Payment Provider</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="flutterwave">Flutterwave</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                      <input
                        type="text"
                        placeholder="Enter Public Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                      <input
                        type="password"
                        placeholder="Enter Secret Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <GlassButton 
                      size="sm"
                      variant="secondary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Payment Settings
                    </GlassButton>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <HardDrive className="h-6 w-6 text-orange-600" />
                    <h3 className="text-lg font-semibold">File Storage</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                        <option value="">Select Storage Provider</option>
                        <option value="supabase-storage">Supabase Storage</option>
                        <option value="aws-s3">AWS S3</option>
                        <option value="google-cloud">Google Cloud Storage</option>
                        <option value="cloudinary">Cloudinary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
                      <input
                        type="text"
                        placeholder="Enter Bucket Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access Key</label>
                      <input
                        type="password"
                        placeholder="Enter Access Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <GlassButton 
                      size="sm"
                      variant="secondary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Storage Settings
                    </GlassButton>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Integration Tips</h3>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Keep your API keys secure and never share them publicly</li>
                      <li>• Test integrations in development before enabling in production</li>
                      <li>• Monitor usage limits and costs for paid services</li>
                      <li>• Regularly rotate API keys for security</li>
                    </ul>
                  </div>
                </div>
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

          {activeSection === 'system-info' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System Health Monitoring</h3>
                <GlassButton
                  onClick={runSystemHealthCheck}
                  disabled={healthLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
                  {healthLoading ? 'Checking...' : 'Run Health Check'}
                </GlassButton>
              </div>

              {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center gap-3 mb-4">
                      <Database className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">Database Health</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          systemHealth.database.status === 'online' ? 'text-green-600' :
                          systemHealth.database.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {systemHealth.database.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Response Time:</span>
                        <span className="font-medium">{systemHealth.database.responseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Check:</span>
                        <span className="font-medium">{new Date(systemHealth.database.lastCheck).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center gap-3 mb-4">
                      <RefreshCw className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold">Cache Health</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          systemHealth.cache.status === 'healthy' ? 'text-green-600' :
                          systemHealth.cache.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {systemHealth.cache.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-medium">{systemHealth.cache.items}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">{systemHealth.cache.size} KB</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {systemStats && (
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart2 className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold">System Statistics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{systemStats.customers}</div>
                      <div className="text-sm text-gray-600">Customers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{systemStats.devices}</div>
                      <div className="text-sm text-gray-600">Devices</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{systemStats.payments}</div>
                      <div className="text-sm text-gray-600">Payments</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{systemStats.users}</div>
                      <div className="text-sm text-gray-600">Users</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Last updated: {new Date(systemStats.lastUpdated).toLocaleString()}
                  </div>
                </div>
              )}

              {systemHealth && (
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-6 w-6 text-yellow-600" />
                    <h3 className="text-lg font-semibold">Performance Metrics</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Memory Usage:</span>
                      <span className="font-medium">{systemHealth?.performance?.memoryUsage ? Math.round(systemHealth.performance.memoryUsage * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Uptime:</span>
                      <span className="font-medium">{systemHealth?.performance?.uptime ? Math.round(systemHealth.performance.uptime / 60) : 0} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Errors:</span>
                      <span className="font-medium">{systemHealth?.errors?.count || 0}</span>
                    </div>
                  </div>
                </div>
              )}
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
                    <Database className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Data Export</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Export your data in JSON or SQL format</p>
                  <div className="space-y-3">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const [type, format] = e.target.value.split('|');
                          handleDataExport(type, format as 'json' | 'sql');
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select data type and format...</option>
                      <optgroup label="JSON Exports">
                        <option value="customers|json">Customers Data (JSON)</option>
                        <option value="devices|json">Devices Data (JSON)</option>
                        <option value="payments|json">Payments Data (JSON)</option>
                        <option value="all|json">All Data (JSON)</option>
                      </optgroup>
                      <optgroup label="SQL Exports">
                        <option value="customers|sql">Customers Data (SQL)</option>
                        <option value="devices|sql">Devices Data (SQL)</option>
                        <option value="payments|sql">Payments Data (SQL)</option>
                        <option value="all|sql">All Data (SQL)</option>
                      </optgroup>
                    </select>
                    {exporting && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        Exporting {exporting} data...
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Database Schema</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Export the complete database structure and table definitions</p>
                  <GlassButton
                    onClick={handleSchemaExport}
                    disabled={exporting === 'schema'}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting === 'schema' ? 'Exporting Schema...' : 'Export Database Schema'}
                  </GlassButton>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Archive className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Settings Backup</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Backup and restore your system settings</p>
                  <div className="space-y-3">
                    <GlassButton
                      onClick={handleCreateBackup}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Create Backup
                    </GlassButton>
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleBackupFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {backupFile && (
                        <p className="text-sm text-green-600 mt-1">
                          Selected: {backupFile.name}
                        </p>
                      )}
                    </div>
                    <GlassButton
                      onClick={handleRestoreBackup}
                      disabled={!backupFile}
                      variant="secondary"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Restore Settings
                    </GlassButton>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <RefreshCw className="h-6 w-6 text-red-600" />
                    <h3 className="text-lg font-semibold">Cache Management</h3>
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

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Server className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold">Database Maintenance</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Perform database maintenance tasks</p>
                  <div className="space-y-3">
                                         <GlassButton
                       onClick={handleDatabaseOptimization}
                       variant="secondary"
                       className="w-full flex items-center justify-center gap-2"
                     >
                       <Wrench className="h-4 w-4" />
                       Optimize Database
                     </GlassButton>
                     <GlassButton
                       onClick={handleCleanOldLogs}
                       variant="secondary"
                       className="w-full flex items-center justify-center gap-2"
                     >
                       <Trash2 className="h-4 w-4" />
                       Clean Old Logs
                     </GlassButton>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="h-6 w-6 text-orange-600" />
                    <h3 className="text-lg font-semibold">Performance Monitor</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Monitor system performance and health</p>
                  <GlassButton
                    onClick={runSystemHealthCheck}
                    disabled={healthLoading}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
                    {healthLoading ? 'Checking...' : 'Run Health Check'}
                  </GlassButton>
                </div>
              </div>
            </div>
          )}

          {activeSection !== 'dashboard' && activeSection !== 'general' && activeSection !== 'notifications' && activeSection !== 'integrations' && activeSection !== 'data-management' && activeSection !== 'user-management' && activeSection !== 'advanced' && activeSection !== 'system-info' && (
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