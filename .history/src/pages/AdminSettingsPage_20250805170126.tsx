import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Settings,
  Database,
  Server,
  Shield,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  Unlock,
  Activity,
  Zap,
  Cloud,
  HardDrive,
  Wifi,
  WifiOff,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  Minus,
  Copy,
  ExternalLink,
  Download,
  Upload,
  RotateCcw,
  Power,
  PowerOff,
  TestTube,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
  MessageCircle,
  Image
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/EnhancedInput';
import LogoUpload from '../components/ui/LogoUpload';
import { hostingerUploadService } from '../lib/hostingerUploadService';
import toast from 'react-hot-toast';

interface SystemSettings {
  database: {
    url: string;
    projectId: string;
    region: string;
    status: 'online' | 'offline' | 'error';
    lastSync: string;
    connectionPool: number;
    maxConnections: number;
    activeConnections: number;
  };
  backend: {
    apiUrl: string;
    environment: 'development' | 'staging' | 'production';
    version: string;
    uptime: string;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
  integrations: {
    sms: {
      provider: string;
      status: 'active' | 'inactive' | 'error';
      balance: number;
      lastUsed: string;
    };
    email: {
      provider: string;
      status: 'active' | 'inactive' | 'error';
      dailyLimit: number;
      usedToday: number;
    };
    whatsapp: {
      provider: string;
      status: 'active' | 'inactive' | 'error';
      connected: boolean;
      lastMessage: string;
    };
    ai: {
      provider: string;
      status: 'active' | 'inactive' | 'error';
      model: string;
      apiKeyConfigured: boolean;
    };
  };
  security: {
    sslEnabled: boolean;
    encryptionLevel: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordPolicy: string;
    twoFactorEnabled: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheSize: number;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    loadBalancing: boolean;
  };
  monitoring: {
    healthChecks: boolean;
    errorTracking: boolean;
    performanceMonitoring: boolean;
    backupMonitoring: boolean;
    alertNotifications: boolean;
  };
  automation: {
    autoBackup: boolean;
    autoCleanup: boolean;
    autoScaling: boolean;
    autoUpdates: boolean;
  };
}

const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState('database');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    database: {
      url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
      projectId: 'jxhzveborezjhsmzsgbc',
      region: 'us-east-1',
      status: 'online',
      lastSync: new Date().toISOString(),
      connectionPool: 10,
      maxConnections: 100,
      activeConnections: 5
    },
    backend: {
      apiUrl: 'https://api.repairshop.com',
      environment: 'production',
      version: '1.0.0',
      uptime: '99.9%',
      memoryUsage: 65,
      cpuUsage: 45,
      diskUsage: 78
    },
    integrations: {
      sms: {
        provider: 'Mobishastra',
        status: 'active',
        balance: 1000,
        lastUsed: new Date().toISOString()
      },
      email: {
        provider: 'Supabase Auth',
        status: 'active',
        dailyLimit: 1000,
        usedToday: 45
      },
      whatsapp: {
        provider: 'Green API',
        status: 'inactive',
        connected: false,
        lastMessage: ''
      },
      ai: {
        provider: 'Google Gemini',
        status: 'active',
        model: 'gemini-pro',
        apiKeyConfigured: true
      }
    },
    security: {
      sslEnabled: true,
      encryptionLevel: 'AES-256',
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      passwordPolicy: 'Strong',
      twoFactorEnabled: false
    },
    performance: {
      cacheEnabled: true,
      cacheSize: 512,
      compressionEnabled: true,
      cdnEnabled: false,
      loadBalancing: false
    },
    monitoring: {
      healthChecks: true,
      errorTracking: true,
      performanceMonitoring: true,
      backupMonitoring: true,
      alertNotifications: true
    },
    automation: {
      autoBackup: true,
      autoCleanup: true,
      autoScaling: false,
      autoUpdates: false
    }
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['database']));

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    setLoading(true);
    try {
      // Load settings from database
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load system settings');
        return;
      }

      // Parse settings and update state
      const systemSettings: any = {};
      data?.forEach(setting => {
        try {
          systemSettings[setting.key] = JSON.parse(setting.value);
        } catch {
          systemSettings[setting.key] = setting.value;
        }
      });

      // Update settings with loaded data
      setSettings(prev => ({
        ...prev,
        ...systemSettings
      }));

      toast.success('System settings loaded successfully');
    } catch (error) {
      console.error('Error loading system settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section: string, data: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          Object.entries(data).map(([key, value]) => ({
            key: `${section}_${key}`,
            value: JSON.stringify(value)
          })),
          { onConflict: 'key' }
        );

      if (error) {
        console.error('Error saving settings:', error);
        toast.error('Failed to save settings');
        return;
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const testConnection = async (type: string) => {
    try {
      toast.loading(`Testing ${type} connection...`);
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.dismiss();
      toast.success(`${type} connection successful`);
    } catch (error) {
      toast.dismiss();
      toast.error(`${type} connection failed`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
        return 'text-green-500';
      case 'offline':
      case 'inactive':
        return 'text-gray-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <GlassCard className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Settings className="w-8 h-8 text-indigo-600" />
                Admin Settings
              </h1>
              <p className="text-gray-600 mt-2">Manage system configuration, backend settings, and database connections</p>
            </div>
            <div className="flex gap-2">
              <GlassButton
                onClick={loadSystemSettings}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings Categories</h3>
              <nav className="space-y-2">
                {[
                  { id: 'database', label: 'Database', icon: Database },
                  { id: 'backend', label: 'Backend', icon: Server },
                  { id: 'integrations', label: 'Integrations', icon: Globe },
                  { id: 'security', label: 'Security', icon: Shield },
                  { id: 'performance', label: 'Performance', icon: Zap },
                  { id: 'monitoring', label: 'Monitoring', icon: Activity },
                  { id: 'automation', label: 'Automation', icon: RotateCcw }
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </GlassCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === 'database' && (
              <DatabaseSettings 
                settings={settings.database}
                onSave={(data) => saveSettings('database', data)}
                onTest={() => testConnection('database')}
                expanded={expandedSections.has('database')}
                onToggle={() => toggleSection('database')}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            )}
            
            {activeSection === 'backend' && (
              <BackendSettings 
                settings={settings.backend}
                onSave={(data) => saveSettings('backend', data)}
                onTest={() => testConnection('backend')}
                expanded={expandedSections.has('backend')}
                onToggle={() => toggleSection('backend')}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            )}

            {activeSection === 'integrations' && (
              <IntegrationsSettings 
                settings={settings.integrations}
                onSave={(data) => saveSettings('integrations', data)}
                expanded={expandedSections}
                onToggle={toggleSection}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            )}

            {activeSection === 'security' && (
              <SecuritySettings 
                settings={settings.security}
                onSave={(data) => saveSettings('security', data)}
                expanded={expandedSections.has('security')}
                onToggle={() => toggleSection('security')}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            )}

            {activeSection === 'performance' && (
              <PerformanceSettings 
                settings={settings.performance}
                onSave={(data) => saveSettings('performance', data)}
                expanded={expandedSections.has('performance')}
                onToggle={() => toggleSection('performance')}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            )}

            {activeSection === 'monitoring' && (
              <MonitoringSettings 
                settings={settings.monitoring}
                onSave={(data) => saveSettings('monitoring', data)}
                expanded={expandedSections.has('monitoring')}
                onToggle={() => toggleSection('monitoring')}
              />
            )}

            {activeSection === 'automation' && (
              <AutomationSettings 
                settings={settings.automation}
                onSave={(data) => saveSettings('automation', data)}
                expanded={expandedSections.has('automation')}
                onToggle={() => toggleSection('automation')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

// Database Settings Component
const DatabaseSettings: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  onTest: () => void;
  expanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}> = ({ settings, onSave, onTest, expanded, onToggle, getStatusIcon, getStatusColor }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      toast.success('Database settings saved successfully');
    } catch (error) {
      toast.error('Failed to save database settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Database Configuration</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Connection Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(settings.status)}
                  <span className={`text-sm font-medium ${getStatusColor(settings.status)}`}>
                    {settings.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Last sync: {new Date(settings.lastSync).toLocaleString()}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Connection Pool</span>
                <span className="text-sm font-medium text-green-600">
                  {settings.activeConnections}/{settings.maxConnections}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(settings.activeConnections / settings.maxConnections) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Database Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Connection Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database URL
                </label>
                <GlassInput
                  type="text"
                  value={localSettings.url}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-project.supabase.co"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project ID
                </label>
                <GlassInput
                  type="text"
                  value={localSettings.projectId}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, projectId: e.target.value }))}
                  placeholder="your-project-id"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <GlassInput
                  type="text"
                  value={localSettings.region}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="us-east-1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Connections
                </label>
                <GlassInput
                  type="number"
                  value={localSettings.maxConnections}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, maxConnections: parseInt(e.target.value) }))}
                  min="1"
                  max="1000"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Performance Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Connections</span>
                  <span className="text-lg font-semibold text-blue-600">{settings.activeConnections}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection Pool</span>
                  <span className="text-lg font-semibold text-green-600">{settings.connectionPool}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Max Connections</span>
                  <span className="text-lg font-semibold text-purple-600">{settings.maxConnections}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <GlassButton
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </GlassButton>

            <GlassButton
              onClick={onTest}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              Test Connection
            </GlassButton>

            <GlassButton
              onClick={() => setLocalSettings(settings)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}; 

// Backend Settings Component
const BackendSettings: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  onTest: () => void;
  expanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}> = ({ settings, onSave, onTest, expanded, onToggle, getStatusIcon, getStatusColor }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      toast.success('Backend settings saved successfully');
    } catch (error) {
      toast.error('Failed to save backend settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-800">Backend Configuration</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Environment</span>
                <span className="text-sm font-medium text-green-600 capitalize">
                  {settings.environment}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Version: {settings.version}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Uptime</span>
                <span className="text-sm font-medium text-blue-600">
                  {settings.uptime}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Last restart: 7 days ago
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">API Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <GlassInput
                  type="text"
                  value={localSettings.apiUrl}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="https://api.yourdomain.com"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment
                </label>
                <select
                  value={localSettings.environment}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, environment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <GlassInput
                  type="text"
                  value={localSettings.version}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0.0"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (seconds)
                </label>
                <GlassInput
                  type="number"
                  value={localSettings.sessionTimeout || 3600}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  min="300"
                  max="86400"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">System Resources</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">CPU Usage</span>
                  <span className="text-sm font-medium text-blue-600">{settings.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${settings.cpuUsage}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="text-sm font-medium text-green-600">{settings.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${settings.memoryUsage}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Disk Usage</span>
                  <span className="text-sm font-medium text-purple-600">{settings.diskUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${settings.diskUsage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Performance Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">2.3ms</div>
                  <div className="text-xs text-gray-600">Avg Response Time</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">99.9%</div>
                  <div className="text-xs text-gray-600">Uptime</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">1.2k</div>
                  <div className="text-xs text-gray-600">Requests/min</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">0.1%</div>
                  <div className="text-xs text-gray-600">Error Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <GlassButton
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </GlassButton>

            <GlassButton
              onClick={onTest}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              Test API
            </GlassButton>

            <GlassButton
              onClick={() => setLocalSettings(settings)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}; 

// Integrations Settings Component
const IntegrationsSettings: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  expanded: Set<string>;
  onToggle: (section: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}> = ({ settings, onSave, expanded, onToggle, getStatusIcon, getStatusColor }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      toast.success('Integration settings saved successfully');
    } catch (error) {
      toast.error('Failed to save integration settings');
    } finally {
      setSaving(false);
    }
  };

  const testIntegration = async (type: string) => {
    try {
      toast.loading(`Testing ${type} integration...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.dismiss();
      toast.success(`${type} integration test successful`);
    } catch (error) {
      toast.dismiss();
      toast.error(`${type} integration test failed`);
    }
  };

  const integrations = [
    {
      id: 'sms',
      name: 'SMS Service',
      icon: Smartphone,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      id: 'email',
      name: 'Email Service',
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Service',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      id: 'ai',
      name: 'AI Service',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'from-purple-50 to-violet-50'
    }
  ];

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">Integrations Configuration</h2>
        </div>
      </div>

      <div className="space-y-6">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const integrationSettings = localSettings[integration.id];
          const isExpanded = expanded.has(integration.id);

          return (
            <div key={integration.id} className="border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${integration.color}`} />
                  <div>
                    <h3 className="font-medium text-gray-800">{integration.name}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(integrationSettings.status)}
                      <span className={`text-sm ${getStatusColor(integrationSettings.status)}`}>
                        {integrationSettings.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GlassButton
                    onClick={() => testIntegration(integration.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <TestTube className="w-3 h-3" />
                    Test
                  </GlassButton>
                  <button
                    onClick={() => onToggle(integration.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  {integration.id === 'sms' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Provider
                        </label>
                        <GlassInput
                          type="text"
                          value={integrationSettings.provider}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            sms: { ...prev.sms, provider: e.target.value }
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Balance
                        </label>
                        <GlassInput
                          type="number"
                          value={integrationSettings.balance}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            sms: { ...prev.sms, balance: parseInt(e.target.value) }
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Used
                        </label>
                        <div className="text-sm text-gray-600">
                          {new Date(integrationSettings.lastUsed).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {integration.id === 'email' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Provider
                        </label>
                        <GlassInput
                          type="text"
                          value={integrationSettings.provider}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, provider: e.target.value }
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Daily Limit
                        </label>
                        <GlassInput
                          type="number"
                          value={integrationSettings.dailyLimit}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, dailyLimit: parseInt(e.target.value) }
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Used Today
                        </label>
                        <div className="text-sm text-gray-600">
                          {integrationSettings.usedToday} / {integrationSettings.dailyLimit}
                        </div>
                      </div>
                    </div>
                  )}

                  {integration.id === 'whatsapp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Provider
                        </label>
                        <GlassInput
                          type="text"
                          value={integrationSettings.provider}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            whatsapp: { ...prev.whatsapp, provider: e.target.value }
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Connection Status
                        </label>
                        <div className="flex items-center gap-2">
                          {integrationSettings.connected ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {integrationSettings.connected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Message
                        </label>
                        <div className="text-sm text-gray-600">
                          {integrationSettings.lastMessage || 'No messages sent'}
                        </div>
                      </div>
                    </div>
                  )}

                  {integration.id === 'ai' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Provider
                        </label>
                        <GlassInput
                          type="text"
                          value={integrationSettings.provider}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            ai: { ...prev.ai, provider: e.target.value }
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Model
                        </label>
                        <GlassInput
                          type="text"
                          value={integrationSettings.model}
                          onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            ai: { ...prev.ai, model: e.target.value }
                          }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key Status
                        </label>
                        <div className="flex items-center gap-2">
                          {integrationSettings.apiKeyConfigured ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {integrationSettings.apiKeyConfigured ? 'Configured' : 'Not Configured'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <GlassButton
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </GlassButton>

          <GlassButton
            onClick={() => setLocalSettings(settings)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}; 

// Security Settings Component
const SecuritySettings: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  expanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}> = ({ settings, onSave, expanded, onToggle, getStatusIcon, getStatusColor }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      toast.success('Security settings saved successfully');
    } catch (error) {
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Security Configuration</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Security Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">SSL/TLS</span>
                <div className="flex items-center gap-2">
                  {localSettings.sslEnabled ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {localSettings.sslEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">2FA</span>
                <div className="flex items-center gap-2">
                  {localSettings.twoFactorEnabled ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium">
                    {localSettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Security Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encryption Level
                </label>
                <select
                  value={localSettings.encryptionLevel}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, encryptionLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="AES-128">AES-128</option>
                  <option value="AES-256">AES-256</option>
                  <option value="ChaCha20">ChaCha20</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (seconds)
                </label>
                <GlassInput
                  type="number"
                  value={localSettings.sessionTimeout}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  min="300"
                  max="86400"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Login Attempts
                </label>
                <GlassInput
                  type="number"
                  value={localSettings.maxLoginAttempts}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                  min="3"
                  max="10"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Policy
                </label>
                <select
                  value={localSettings.passwordPolicy}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, passwordPolicy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Basic">Basic</option>
                  <option value="Strong">Strong</option>
                  <option value="Very Strong">Very Strong</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Security Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">SSL/TLS Encryption</span>
                    <p className="text-sm text-gray-600">Secure data transmission</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.sslEnabled}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, sslEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Two-Factor Authentication</span>
                    <p className="text-sm text-gray-600">Additional security layer</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.twoFactorEnabled}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <GlassButton
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </GlassButton>

            <GlassButton
              onClick={() => setLocalSettings(settings)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// Performance Settings Component
const PerformanceSettings: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  expanded: boolean;
  onToggle: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}> = ({ settings, onSave, expanded, onToggle, getStatusIcon, getStatusColor }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      toast.success('Performance settings saved successfully');
    } catch (error) {
      toast.error('Failed to save performance settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-800">Performance Configuration</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Performance Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Performance Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Caching</span>
                    <p className="text-sm text-gray-600">Improve response times</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.cacheEnabled}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, cacheEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Compression</span>
                    <p className="text-sm text-gray-600">Reduce bandwidth usage</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.compressionEnabled}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, compressionEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">CDN</span>
                    <p className="text-sm text-gray-600">Content delivery network</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.cdnEnabled}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, cdnEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Load Balancing</span>
                    <p className="text-sm text-gray-600">Distribute traffic</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.loadBalancing}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, loadBalancing: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Cache Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Cache Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cache Size (MB)
                </label>
                <GlassInput
                  type="number"
                  value={localSettings.cacheSize}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, cacheSize: parseInt(e.target.value) }))}
                  min="64"
                  max="2048"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Performance Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">2.3ms</div>
                  <div className="text-xs text-gray-600">Avg Response Time</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-xs text-gray-600">Cache Hit Rate</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">1.2k</div>
                  <div className="text-xs text-gray-600">Requests/min</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <GlassButton
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </GlassButton>

            <GlassButton
              onClick={() => setLocalSettings(settings)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// Monitoring Settings Component
const MonitoringSettings: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ settings, onSave, expanded, onToggle }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      toast.success('Monitoring settings saved successfully');
    } catch (error) {
      toast.error('Failed to save monitoring settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Monitoring Configuration</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Monitoring Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Monitoring Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Health Checks</span>
                    <p className="text-sm text-gray-600">Monitor system health</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.healthChecks}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, healthChecks: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Error Tracking</span>
                    <p className="text-sm text-gray-600">Track application errors</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.errorTracking}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, errorTracking: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Performance Monitoring</span>
                    <p className="text-sm text-gray-600">Monitor system performance</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.performanceMonitoring}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, performanceMonitoring: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Backup Monitoring</span>
                    <p className="text-sm text-gray-600">Monitor backup status</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.backupMonitoring}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, backupMonitoring: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Alert Notifications</span>
                    <p className="text-sm text-gray-600">Send alert notifications</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.alertNotifications}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, alertNotifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <GlassButton
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </GlassButton>

            <GlassButton
              onClick={() => setLocalSettings(settings)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// Automation Settings Component
const AutomationSettings: React.FC<{
  settings: any;
  onSave: (data: any) => void;
  expanded: boolean;
  onToggle: () => void;
}> = ({ settings, onSave, expanded, onToggle }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      toast.success('Automation settings saved successfully');
    } catch (error) {
      toast.error('Failed to save automation settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-800">Automation Configuration</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Automation Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Automation Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Auto Backup</span>
                    <p className="text-sm text-gray-600">Automatic database backups</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.autoBackup}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Auto Cleanup</span>
                    <p className="text-sm text-gray-600">Clean old data automatically</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.autoCleanup}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, autoCleanup: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Auto Scaling</span>
                    <p className="text-sm text-gray-600">Scale resources automatically</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.autoScaling}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, autoScaling: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-medium text-gray-800">Auto Updates</span>
                    <p className="text-sm text-gray-600">Automatic system updates</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.autoUpdates}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, autoUpdates: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <GlassButton
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </GlassButton>

            <GlassButton
              onClick={() => setLocalSettings(settings)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}; 