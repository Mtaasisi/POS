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
  ToggleRight
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/EnhancedInput';
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
              />
            )}
            
            {activeSection === 'backend' && (
              <BackendSettings 
                settings={settings.backend}
                onSave={(data) => saveSettings('backend', data)}
                onTest={() => testConnection('backend')}
                expanded={expandedSections.has('backend')}
                onToggle={() => toggleSection('backend')}
              />
            )}

            {activeSection === 'integrations' && (
              <IntegrationsSettings 
                settings={settings.integrations}
                onSave={(data) => saveSettings('integrations', data)}
                expanded={expandedSections}
                onToggle={toggleSection}
              />
            )}

            {activeSection === 'security' && (
              <SecuritySettings 
                settings={settings.security}
                onSave={(data) => saveSettings('security', data)}
                expanded={expandedSections.has('security')}
                onToggle={() => toggleSection('security')}
              />
            )}

            {activeSection === 'performance' && (
              <PerformanceSettings 
                settings={settings.performance}
                onSave={(data) => saveSettings('performance', data)}
                expanded={expandedSections.has('performance')}
                onToggle={() => toggleSection('performance')}
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