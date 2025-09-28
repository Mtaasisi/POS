import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { SimpleBackButton as BackButton } from '../../shared/components/ui/SimpleBackButton';
import { toast } from '../../../lib/toastUtils';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Power, 
  PowerOff, 
  QrCode, 
  Key, 
  Globe, 
  Bell, 
  MessageCircle,
  Shield,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Copy,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Info,
  Zap,
  Smartphone,
  Phone,
  Mail,
  Users,
  FileText,
  MapPin,
  User,
  Calendar,
  BarChart3,
  Target,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Edit,
  Plus,
  Minus,
  ExternalLink,
  Download,
  Upload,
  Lock,
  Unlock,
  Monitor,
  HardDrive,
  Cloud,
  Server,
  Network,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryEmpty,
  LogOut
} from 'lucide-react';
import { greenApiSettingsService, GreenApiSettings, InstanceState } from '../../../services/greenApiSettingsService';
import { greenApiService } from '../../../services/greenApiService';
import Modal from '../../shared/components/ui/Modal';

// Import settings section components
import GeneralSettingsSection from '../components/settings/GeneralSettingsSection';
import WebhookSettingsSection from '../components/settings/WebhookSettingsSection';
import MessageSettingsSection from '../components/settings/MessageSettingsSection';
import NotificationSettingsSection from '../components/settings/NotificationSettingsSection';
import SecuritySettingsSection from '../components/settings/SecuritySettingsSection';
import StatusSettingsSection from '../components/settings/StatusSettingsSection';

// Types
interface WhatsAppInstance {
  id: string;
  instance_id: string;
  api_token: string;
  phone_number: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  is_green_api: boolean;
  created_at: string;
  green_api_settings?: GreenApiSettings;
}

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const WhatsAppSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { instanceId } = useParams<{ instanceId: string }>();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  // State
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [settings, setSettings] = useState<GreenApiSettings>({});
  const [instanceState, setInstanceState] = useState<InstanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showAuthCodeModal, setShowAuthCodeModal] = useState(false);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newApiToken, setNewApiToken] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reboot' | 'logout' | null>(null);

  // Settings sections
  const settingsSections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General Settings',
      description: 'Basic instance configuration and status',
      icon: <Settings size={20} />,
      color: 'blue'
    },
    {
      id: 'webhooks',
      title: 'Webhook Configuration',
      description: 'Configure webhook URLs and notifications',
      icon: <Globe size={20} />,
      color: 'green'
    },
    {
      id: 'messages',
      title: 'Message Settings',
      description: 'Message delivery and handling preferences',
      icon: <MessageCircle size={20} />,
      color: 'purple'
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Configure webhook notifications for different events',
      icon: <Bell size={20} />,
      color: 'orange'
    },
    {
      id: 'security',
      title: 'Security & Authentication',
      description: 'API tokens, QR codes, and authentication settings',
      icon: <Shield size={20} />,
      color: 'red'
    },
    {
      id: 'status',
      title: 'Status & Monitoring',
      description: 'Instance status, health checks, and monitoring',
      icon: <Activity size={20} />,
      color: 'gray'
    }
  ];

  // Load instance and settings
  useEffect(() => {
    if (instanceId) {
      loadInstanceAndSettings();
    }
  }, [instanceId]);

  const loadInstanceAndSettings = async () => {
    try {
      setLoading(true);
      
      // Get instance data
      const instanceData = await greenApiService.getInstance(instanceId);
      if (!instanceData) {
        console.error('❌ Instance not found:', instanceId);
        toast.error('Instance not found');
        navigate('/lats/whatsapp-connection-manager');
        return;
      }
      setInstance(instanceData);

      // Load settings from database first
      console.log('🔍 Loading settings for instance:', instanceData.instance_id);
      let currentSettings = await greenApiSettingsService.loadSettingsFromDatabase(instanceData.instance_id);
      
      if (currentSettings) {
        console.log('✅ Settings loaded from database:', currentSettings);
        setSettings(currentSettings);
      } else {
        console.log('📝 No settings found in database, trying Green API...');
        
        // Try to load from Green API with fallback
        try {
          currentSettings = await greenApiSettingsService.getSettings(
            instanceData.instance_id,
            instanceData.api_token
          );
          console.log('✅ Settings loaded from Green API:', currentSettings);
          setSettings(currentSettings);
          
          // Save to database for future use
          console.log('💾 Saving settings to database...');
          await greenApiSettingsService.saveSettingsToDatabase(instanceData.instance_id, currentSettings);
          console.log('✅ Settings saved to database');
        } catch (error: any) {
          console.warn('⚠️ Could not load settings from Green API, using defaults');
          
          // Check if it's a connection error
          if (error.message?.includes('ERR_CONNECTION_REFUSED') || 
              error.message?.includes('Failed to fetch') ||
              error.message?.includes('Proxy request failed')) {
            toast('Green API proxy is not available. Using default settings.');
          }
          
          currentSettings = greenApiSettingsService.getDefaultSettings();
          setSettings(currentSettings);
          
          // Save defaults to database
          console.log('💾 Saving default settings to database...');
          try {
            await greenApiSettingsService.saveSettingsToDatabase(instanceData.instance_id, currentSettings);
            console.log('✅ Default settings saved to database');
          } catch (dbError: any) {
            console.error('❌ Failed to save default settings to database:', dbError);
            toast('Settings saved locally but not to database.');
          }
        }
      }

      // Load instance state with fallback
      try {
        const state = await greenApiSettingsService.getStateInstance(
          instanceData.instance_id,
          instanceData.api_token
        );
        setInstanceState(state);
      } catch (error: any) {
        console.warn('⚠️ Could not load instance state');
        
        // Check for specific error types
        if (error.message?.includes('ERR_CONNECTION_REFUSED') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('Proxy request failed')) {
          setInstanceState({ stateInstance: 'notAuthorized' });
          toast.warning('Could not check instance state. Please verify your connection.');
        } else if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
          setInstanceState({ stateInstance: 'notAuthorized' });
          toast.warning('CORS issue detected. Please start the development proxy server with: npm run dev:proxy');
        } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          setInstanceState({ stateInstance: 'notAuthorized' });
          toast.error('403 Forbidden Error - Please check your Green API credentials', {
            duration: 5000,
            action: {
              text: 'Fix Now',
              onClick: () => {
                // Show detailed error guidance
                const errorDetails = `
🔧 403 Forbidden Error - Green API Credentials Issue

Possible causes:
1. Invalid API token
2. Instance ID does not exist
3. Instance not authorized
4. Wrong Green API account

To fix this:
1. Go to https://console.green-api.com/
2. Verify instance ${instanceData.instance_id} exists
3. Check that the API token is correct
4. Ensure the instance is authorized
5. If needed, create a new instance

Current instance details:
- ID: ${instanceData.instance_id}
- Phone: ${instanceData.phone_number}
- API Token: ${instanceData.api_token ? 'Set' : 'Missing'}
                `;
                console.error(errorDetails);
                alert(errorDetails);
              }
            }
          });
        } else {
          setInstanceState({ stateInstance: 'notAuthorized' });
          toast.warning('Could not check instance state. Please verify your connection.');
        }
      }

    } catch (error: any) {
      console.error('❌ Error loading instance:', error);
      toast.error(`Failed to load instance: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!instance) return;

    try {
      setSaving(true);
      
      // Validate settings
      const validation = greenApiSettingsService.validateSettings(settings);
      if (!validation.isValid) {
        toast.error(`Settings validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Save to Green API
      await greenApiSettingsService.setSettings(
        instance.instance_id,
        instance.api_token,
        settings
      );

      // Save to database
      await greenApiSettingsService.saveSettingsToDatabase(instance.instance_id, settings);

      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadInstanceAndSettings();
      toast.success('Settings refreshed successfully');
    } catch (error: any) {
      console.error('Error refreshing settings:', error);
      toast.error(`Failed to refresh settings: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReboot = async () => {
    if (!instance) return;

    try {
      await greenApiSettingsService.rebootInstance(instance.instance_id, instance.api_token);
      setShowConfirmModal(false);
      setConfirmAction(null);
      
      // Refresh after reboot
      setTimeout(() => {
        loadInstanceAndSettings();
      }, 5000);
    } catch (error: any) {
      console.error('Error rebooting instance:', error);
      toast.error(`Failed to reboot instance: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    if (!instance) return;

    try {
      await greenApiSettingsService.logoutInstance(instance.instance_id, instance.api_token);
      setShowConfirmModal(false);
      setConfirmAction(null);
      
      // Navigate back to hub
      navigate('/lats/whatsapp-connection-manager');
    } catch (error: any) {
      console.error('Error logging out instance:', error);
      toast.error(`Failed to logout instance: ${error.message}`);
    }
  };

  const handleGetQRCode = async () => {
    if (!instance) return;

    try {
      const response = await greenApiSettingsService.getQRCode(instance.instance_id, instance.api_token);
      setQrCode(response.qr);
      setShowQRModal(true);
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      toast.error(`Failed to get QR code: ${error.message}`);
    }
  };

  const handleGetAuthCode = async () => {
    if (!instance) return;

    try {
      const response = await greenApiSettingsService.getAuthorizationCode(instance.instance_id, instance.api_token);
      setAuthCode(response.authorizationCode);
      setShowAuthCodeModal(true);
    } catch (error: any) {
      console.error('Error getting authorization code:', error);
      toast.error(`Failed to get authorization code: ${error.message}`);
    }
  };

  const handleUpdateToken = async () => {
    if (!instance || !newApiToken.trim()) return;

    try {
      await greenApiSettingsService.updateApiToken(instance.instance_id, instance.api_token, newApiToken);
      setShowTokenModal(false);
      setNewApiToken('');
      
      // Update local instance data
      setInstance(prev => prev ? { ...prev, api_token: newApiToken } : null);
      
      toast.success('API token updated successfully');
    } catch (error: any) {
      console.error('Error updating API token:', error);
      toast.error(`Failed to update API token: ${error.message}`);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authorized':
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'notAuthorized':
      case 'disconnected':
        return 'text-yellow-600 bg-yellow-100';
      case 'blocked':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authorized':
      case 'connected':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'notAuthorized':
      case 'disconnected':
        return <XCircle size={16} className="text-yellow-600" />;
      case 'blocked':
      case 'error':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <Activity size={16} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto h-8 w-8 text-gray-400 mb-4" />
            <p className="text-gray-600">Loading WhatsApp settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Instance Not Found</h2>
          <p className="text-gray-600 mb-4">The WhatsApp instance you're looking for doesn't exist.</p>
          <GlassButton onClick={() => navigate('/lats/whatsapp-connection-manager')}>
            Back to WhatsApp Hub
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/lats/whatsapp-connection-manager" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure settings for instance: {instance.phone_number}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <GlassButton
            onClick={handleRefresh}
            icon={<RefreshCw size={18} />}
            variant="secondary"
            loading={refreshing}
            disabled={saving}
          >
            Refresh
          </GlassButton>
          <GlassButton
            onClick={handleSaveSettings}
            icon={<Save size={18} />}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            loading={saving}
            disabled={refreshing}
          >
            Save Changes
          </GlassButton>
        </div>
      </div>

      {/* Instance Status Card */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Instance Status</h2>
          <div className="flex items-center gap-2">
            {getStatusIcon(instanceState?.stateInstance || instance.status)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(instanceState?.stateInstance || instance.status)}`}>
              {instanceState?.stateInstance || instance.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium">{instance.phone_number}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Instance ID</p>
              <p className="font-medium">{instance.instance_id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">
                {new Date(instance.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
          <GlassButton
            onClick={handleGetQRCode}
            icon={<QrCode size={16} />}
            variant="secondary"
            size="sm"
          >
            Get QR Code
          </GlassButton>
          
          <GlassButton
            onClick={handleGetAuthCode}
            icon={<Key size={16} />}
            variant="secondary"
            size="sm"
          >
            Get Auth Code
          </GlassButton>
          
          <GlassButton
            onClick={() => setShowTokenModal(true)}
            icon={<Edit size={16} />}
            variant="secondary"
            size="sm"
          >
            Update Token
          </GlassButton>
          
          <GlassButton
            onClick={() => {
              setConfirmAction('reboot');
              setShowConfirmModal(true);
            }}
            icon={<RotateCcw size={16} />}
            variant="secondary"
            size="sm"
          >
            Reboot Instance
          </GlassButton>
          
          <GlassButton
            onClick={() => {
              setConfirmAction('logout');
              setShowConfirmModal(true);
            }}
            icon={<LogOut size={16} />}
            variant="secondary"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            Logout Instance
          </GlassButton>
        </div>
      </GlassCard>

      {/* Settings Tabs */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex overflow-x-auto">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleTabChange(section.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === section.id
                    ? `border-${section.color}-500 text-${section.color}-600 bg-${section.color}-50`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <GlassCard className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {settingsSections.find(s => s.id === activeTab)?.title}
            </h3>
            <p className="text-sm text-gray-600">
              {settingsSections.find(s => s.id === activeTab)?.description}
            </p>
          </div>

          <div className="pt-4">
            {activeTab === 'general' && (
              <GeneralSettingsSection 
                settings={settings} 
                setSettings={setSettings} 
              />
            )}
            
            {activeTab === 'webhooks' && (
              <WebhookSettingsSection 
                settings={settings} 
                setSettings={setSettings} 
              />
            )}
            
            {activeTab === 'messages' && (
              <MessageSettingsSection 
                settings={settings} 
                setSettings={setSettings} 
              />
            )}
            
            {activeTab === 'notifications' && (
              <NotificationSettingsSection 
                settings={settings} 
                setSettings={setSettings} 
              />
            )}
            
            {activeTab === 'security' && (
              <SecuritySettingsSection 
                settings={settings} 
                setSettings={setSettings} 
              />
            )}
            
            {activeTab === 'status' && (
              <StatusSettingsSection 
                settings={settings} 
                setSettings={setSettings} 
              />
            )}
          </div>
        </GlassCard>
      </div>

      {/* Modals */}
      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="QR Code"
        size="md"
      >
        <div className="text-center">
          {qrCode ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="QR Code" 
                  className="border border-gray-200 rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600">
                Scan this QR code with your WhatsApp mobile app to connect this instance.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
      </Modal>

      {/* Authorization Code Modal */}
      <Modal
        isOpen={showAuthCodeModal}
        onClose={() => setShowAuthCodeModal(false)}
        title="Authorization Code"
        size="md"
      >
        <div className="text-center">
          {authCode ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Authorization Code:</p>
                <p className="font-mono text-lg font-bold text-gray-900 break-all">
                  {authCode}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Use this code to authorize your WhatsApp instance.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
      </Modal>

      {/* Update Token Modal */}
      <Modal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        title="Update API Token"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New API Token
            </label>
            <input
              type="password"
              value={newApiToken}
              onChange={(e) => setNewApiToken(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              placeholder="Enter new API token"
            />
          </div>
          <div className="flex justify-end gap-3">
            <GlassButton
              onClick={() => setShowTokenModal(false)}
              variant="secondary"
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleUpdateToken}
              disabled={!newApiToken.trim()}
            >
              Update Token
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        title={confirmAction === 'reboot' ? 'Reboot Instance' : 'Logout Instance'}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <p className="text-gray-700">
              {confirmAction === 'reboot' 
                ? 'Are you sure you want to reboot this WhatsApp instance? This will temporarily disconnect the instance.'
                : 'Are you sure you want to logout this WhatsApp instance? This will permanently disconnect the instance and you will need to re-authenticate.'
              }
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <GlassButton
              onClick={() => {
                setShowConfirmModal(false);
                setConfirmAction(null);
              }}
              variant="secondary"
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={confirmAction === 'reboot' ? handleReboot : handleLogout}
              className={confirmAction === 'logout' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {confirmAction === 'reboot' ? 'Reboot' : 'Logout'}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WhatsAppSettingsPage;
