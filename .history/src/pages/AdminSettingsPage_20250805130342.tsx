import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getSettings, updateSettings, getDefaultSettings } from '../lib/settingsApi';
import { 
  Settings,
  Database,
  Server,
  Shield,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Palette,
  Users,
  Lock,
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  ChevronRight,
  ChevronDown,
  Database as DatabaseIcon,
  HardDrive,
  Network,
  Activity,
  Zap,
  Clock,
  Calendar,
  FileText,
  Code,
  Terminal,
  Cloud,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone as MobileIcon,
  Tablet,
  Laptop,
  Desktop,
  Server as ServerIcon,
  Database as DbIcon,
  HardDrive as StorageIcon,
  Network as NetworkIcon,
  Activity as ActivityIcon,
  Zap as PerformanceIcon,
  Clock as TimeIcon,
  Calendar as ScheduleIcon,
  FileText as LogIcon,
  Code as ApiIcon,
  Terminal as ConsoleIcon,
  Cloud as CloudIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon
} from 'lucide-react';
import GlassButton from '../components/ui/GlassButton';
import GlassCard from '../components/ui/GlassCard';
import toast from 'react-hot-toast';

interface AdminSettings {
  // Application Settings
  app: {
    name: string;
    description: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
    maintenanceMode: boolean;
    contactEmail: string;
    contactPhone: string;
    supportUrl: string;
  };
  
  // Database Settings
  database: {
    url: string;
    anonKey: string;
    serviceKey: string;
    connectionPool: number;
    maxConnections: number;
    timeout: number;
    sslMode: 'require' | 'prefer' | 'allow' | 'disable';
    backupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    backupRetention: number;
    autoVacuum: boolean;
    logQueries: boolean;
  };
  
  // Backend Settings
  backend: {
    apiUrl: string;
    apiVersion: string;
    rateLimit: number;
    timeout: number;
    corsOrigins: string[];
    jwtSecret: string;
    jwtExpiry: number;
    refreshTokenExpiry: number;
    sessionTimeout: number;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  
  // Integration Settings
  integrations: {
    sms: {
      provider: string;
      apiKey: string;
      apiSecret: string;
      senderId: string;
      enabled: boolean;
    };
    email: {
      provider: string;
      apiKey: string;
      fromEmail: string;
      fromName: string;
      enabled: boolean;
    };
    whatsapp: {
      provider: string;
      apiKey: string;
      instanceId: string;
      enabled: boolean;
    };
    payment: {
      provider: string;
      apiKey: string;
      secretKey: string;
      webhookUrl: string;
      enabled: boolean;
    };
    storage: {
      provider: string;
      bucketName: string;
      region: string;
      accessKey: string;
      secretKey: string;
      enabled: boolean;
    };
  };
  
  // Security Settings
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    sessionPolicy: {
      maxSessions: number;
      sessionTimeout: number;
      forceLogout: boolean;
    };
    encryption: {
      algorithm: string;
      keySize: number;
      saltRounds: number;
    };
    auditLogging: {
      enabled: boolean;
      retentionDays: number;
      logLevel: 'error' | 'warn' | 'info' | 'debug';
    };
  };
  
  // Performance Settings
  performance: {
    cacheEnabled: boolean;
    cacheDuration: number;
    compressionEnabled: boolean;
    gzipLevel: number;
    maxMemoryUsage: number;
    cpuLimit: number;
    connectionPooling: boolean;
    queryOptimization: boolean;
  };
  
  // Notification Settings
  notifications: {
    email: {
      enabled: boolean;
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPass: string;
      templates: {
        welcome: string;
        passwordReset: string;
        orderConfirmation: string;
      };
    };
    sms: {
      enabled: boolean;
      templates: {
        otp: string;
        orderStatus: string;
        reminder: string;
      };
    };
    push: {
      enabled: boolean;
      vapidPublicKey: string;
      vapidPrivateKey: string;
    };
    inApp: {
      enabled: boolean;
      soundEnabled: boolean;
      vibrationEnabled: boolean;
    };
  };
  
  // Regional Settings
  regional: {
    defaultLanguage: string;
    supportedLanguages: string[];
    defaultTimezone: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    currencySymbol: string;
    decimalPlaces: number;
  };
  
  // Feature Flags
  features: {
    posEnabled: boolean;
    inventoryEnabled: boolean;
    customerManagementEnabled: boolean;
    reportingEnabled: boolean;
    backupEnabled: boolean;
    analyticsEnabled: boolean;
    multiTenantEnabled: boolean;
    apiEnabled: boolean;
  };
}

const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState('app');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [settings, setSettings] = useState<AdminSettings>({
    app: {
      name: 'Repair Management System',
      description: 'Comprehensive device repair and customer management system',
      version: '1.0.0',
      environment: 'production',
      debugMode: false,
      maintenanceMode: false,
      contactEmail: '',
      contactPhone: '',
      supportUrl: ''
    },
    database: {
      url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw',
      serviceKey: '',
      connectionPool: 10,
      maxConnections: 100,
      timeout: 30000,
      sslMode: 'require',
      backupEnabled: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      autoVacuum: true,
      logQueries: false
    },
    backend: {
      apiUrl: 'https://api.repairshop.com',
      apiVersion: 'v1',
      rateLimit: 1000,
      timeout: 30000,
      corsOrigins: ['https://repairshop.com', 'https://admin.repairshop.com'],
      jwtSecret: '',
      jwtExpiry: 3600,
      refreshTokenExpiry: 604800,
      sessionTimeout: 1800,
      maxFileSize: 10485760,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
    },
    integrations: {
      sms: {
        provider: 'mobishastra',
        apiKey: 'Inauzwa',
        apiSecret: '@Masika10',
        senderId: 'INAUZWA',
        enabled: true
      },
      email: {
        provider: 'smtp',
        apiKey: '',
        fromEmail: 'noreply@repairshop.com',
        fromName: 'Repair Shop',
        enabled: false
      },
      whatsapp: {
        provider: 'green-api',
        apiKey: '',
        instanceId: '',
        enabled: false
      },
      payment: {
        provider: 'mpesa',
        apiKey: '',
        secretKey: '',
        webhookUrl: '',
        enabled: false
      },
      storage: {
        provider: 'supabase',
        bucketName: 'repair-shop',
        region: 'us-east-1',
        accessKey: '',
        secretKey: '',
        enabled: true
      }
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true
      },
      sessionPolicy: {
        maxSessions: 5,
        sessionTimeout: 1800,
        forceLogout: false
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keySize: 256,
        saltRounds: 12
      },
      auditLogging: {
        enabled: true,
        retentionDays: 90,
        logLevel: 'info'
      }
    },
    performance: {
      cacheEnabled: true,
      cacheDuration: 300,
      compressionEnabled: true,
      gzipLevel: 6,
      maxMemoryUsage: 512,
      cpuLimit: 80,
      connectionPooling: true,
      queryOptimization: true
    },
    notifications: {
      email: {
        enabled: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        templates: {
          welcome: 'Welcome to our repair shop!',
          passwordReset: 'Your password reset link',
          orderConfirmation: 'Your order has been confirmed'
        }
      },
      sms: {
        enabled: true,
        templates: {
          otp: 'Your OTP is: {code}',
          orderStatus: 'Your order status: {status}',
          reminder: 'Reminder: {message}'
        }
      },
      push: {
        enabled: false,
        vapidPublicKey: '',
        vapidPrivateKey: ''
      },
      inApp: {
        enabled: true,
        soundEnabled: true,
        vibrationEnabled: true
      }
    },
    regional: {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'sw'],
      defaultTimezone: 'Africa/Dar_es_Salaam',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      currency: 'TZS',
      currencySymbol: 'TSh',
      decimalPlaces: 2
    },
    features: {
      posEnabled: true,
      inventoryEnabled: true,
      customerManagementEnabled: true,
      reportingEnabled: true,
      backupEnabled: true,
      analyticsEnabled: true,
      multiTenantEnabled: false,
      apiEnabled: true
    }
  });

  useEffect(() => {
    loadAdminSettings();
  }, []);

  const loadAdminSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = await getSettings();
      
      if (Object.keys(savedSettings).length > 0) {
        setSettings(prev => ({
          ...prev,
          ...savedSettings
        }));
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
      toast.error('Failed to load settings');
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
        [section]: { ...prev[section as keyof AdminSettings], ...data }
      }));

      // Save to database
      const success = await updateSettings({
        [section]: data
      });

      if (success) {
        toast.success(`${section} settings saved successfully`);
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const sections = [
    {
      id: 'app',
      name: 'Application',
      icon: <Settings className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'database',
      name: 'Database',
      icon: <Database className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'backend',
      name: 'Backend',
      icon: <Server className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: <Globe className="h-5 w-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'security',
      name: 'Security',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      id: 'regional',
      name: 'Regional',
      icon: <Globe className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'features',
      name: 'Features',
      icon: <Users className="h-5 w-5" />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin settings...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Admin Settings</h1>
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
              {sections.find(s => s.id === activeSection)?.name} Settings
            </h2>
            <p className="text-gray-600">
              Configure {activeSection} settings and preferences
            </p>
          </div>
          
          {/* Content will be added in next chunks */}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage; 