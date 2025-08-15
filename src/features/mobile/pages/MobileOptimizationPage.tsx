import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Smartphone, Wifi, WifiOff, Download, Upload, Battery, BatteryCharging,
  SmartphoneIcon, Tablet, Monitor, Globe, Shield, Zap,
  Settings, RefreshCw, CheckCircle, AlertTriangle, XCircle, Plus,
  Home, Search, User, Bell, Menu, ArrowLeft, ArrowRight, MousePointer, Hand
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MobileFeature {
  id: string;
  name: string;
  description: string;
  status: 'enabled' | 'disabled' | 'pending';
  icon: React.ReactNode;
  category: 'pwa' | 'ui' | 'performance' | 'offline';
  priority: 'high' | 'medium' | 'low';
}

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  screenSize: string;
  userAgent: string;
  touchSupport: boolean;
  pwaSupport: boolean;
  offlineSupport: boolean;
}

const MobileOptimizationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | false>(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'testing' | 'settings'>('overview');

  const mobileFeatures: MobileFeature[] = [
    {
      id: '1',
      name: 'Progressive Web App (PWA)',
      description: 'Install app on home screen with offline capabilities',
      status: 'enabled',
      icon: <Download size={20} />,
      category: 'pwa',
      priority: 'high'
    },
    {
      id: '2',
      name: 'Touch-Friendly Interface',
      description: 'Optimized touch targets and gestures',
      status: 'enabled',
      icon: <Hand size={20} />,
      category: 'ui',
      priority: 'high'
    },
    {
      id: '3',
      name: 'Offline Mode',
      description: 'Core functionality works without internet',
      status: 'enabled',
      icon: <WifiOff size={20} />,
      category: 'offline',
      priority: 'high'
    },
    {
      id: '4',
      name: 'Responsive Design',
      description: 'Adapts to all screen sizes seamlessly',
      status: 'enabled',
      icon: <Smartphone size={20} />,
      category: 'ui',
      priority: 'high'
    },
    {
      id: '5',
      name: 'Fast Loading',
      description: 'Optimized for slow mobile connections',
      status: 'enabled',
      icon: <Zap size={20} />,
      category: 'performance',
      priority: 'medium'
    },
    {
      id: '6',
      name: 'Push Notifications',
      description: 'Real-time updates and alerts',
      status: 'pending',
      icon: <Bell size={20} />,
      category: 'pwa',
      priority: 'medium'
    },
    {
      id: '7',
      name: 'Gesture Navigation',
      description: 'Swipe gestures for common actions',
      status: 'enabled',
      icon: <MousePointer size={20} />,
      category: 'ui',
      priority: 'medium'
    },
    {
      id: '8',
      name: 'Background Sync',
      description: 'Sync data when connection restored',
      status: 'pending',
      icon: <RefreshCw size={20} />,
      category: 'offline',
      priority: 'low'
    }
  ];

  // Detect device information
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      
      let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (screenWidth <= 768) {
        type = 'mobile';
      } else if (screenWidth <= 1024) {
        type = 'tablet';
      }

      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const pwaSupport = 'serviceWorker' in navigator && 'PushManager' in window;
      const offlineSupport = 'caches' in window;

      setDeviceInfo({
        type,
        screenSize: `${screenWidth}x${screenHeight}`,
        userAgent,
        touchSupport,
        pwaSupport,
        offlineSupport
      });
    };

    detectDevice();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor battery status
  useEffect(() => {
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(battery.level * 100);
          setIsCharging(battery.charging);

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(battery.level * 100);
          });

          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    getBatteryInfo();
  }, []);

  // PWA installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = () => {
    setShowInstallPrompt(false);
    toast.success('PWA installation initiated!');
    // In a real app, this would trigger the install prompt
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enabled':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pending':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'disabled':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Settings size={16} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pwa':
        return <Download size={16} />;
      case 'ui':
        return <Smartphone size={16} />;
      case 'performance':
        return <Zap size={16} />;
      case 'offline':
        return <WifiOff size={16} />;
      default:
        return <Settings size={16} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mobile Optimization</h1>
            <p className="text-gray-600 mt-1">Enhanced mobile experience and PWA features</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {showInstallPrompt && (
            <GlassButton
              onClick={handleInstallPWA}
              icon={<Download size={18} />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            >
              Install App
            </GlassButton>
          )}
          <GlassButton
            onClick={() => navigate('/dashboard')}
            variant="secondary"
            icon={<Home size={18} />}
          >
            Dashboard
          </GlassButton>
        </div>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              deviceInfo?.type === 'mobile' ? 'bg-blue-100 text-blue-600' :
              deviceInfo?.type === 'tablet' ? 'bg-purple-100 text-purple-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {deviceInfo?.type === 'mobile' ? <Smartphone size={20} /> :
               deviceInfo?.type === 'tablet' ? <Tablet size={20} /> :
               <Monitor size={20} />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">{deviceInfo?.type || 'Unknown'}</p>
              <p className="text-xs text-gray-500">{deviceInfo?.screenSize || 'Unknown'}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs text-gray-500">
                {isOnline ? 'Connected' : 'No internet'}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              batteryLevel && batteryLevel < 20 ? 'bg-red-100 text-red-600' :
              batteryLevel && batteryLevel < 50 ? 'bg-yellow-100 text-yellow-600' :
              'bg-green-100 text-green-600'
            }`}>
              {isCharging ? <BatteryCharging size={20} /> : <Battery size={20} />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {batteryLevel ? `${Math.round(batteryLevel)}%` : 'Unknown'}
              </p>
              <p className="text-xs text-gray-500">
                {isCharging ? 'Charging' : 'Battery'}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              pwaInstalled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <Download size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {pwaInstalled ? 'Installed' : 'Not Installed'}
              </p>
              <p className="text-xs text-gray-500">PWA Status</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Navigation Tabs */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: <Smartphone size={16} /> },
            { id: 'features', label: 'Features', icon: <Settings size={16} /> },
            { id: 'testing', label: 'Testing', icon: <CheckCircle size={16} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Experience Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Device Capabilities</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Touch Support:</span>
                        <span className={`text-sm font-medium ${
                          deviceInfo?.touchSupport ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {deviceInfo?.touchSupport ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">PWA Support:</span>
                        <span className={`text-sm font-medium ${
                          deviceInfo?.pwaSupport ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {deviceInfo?.pwaSupport ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Offline Support:</span>
                        <span className={`text-sm font-medium ${
                          deviceInfo?.offlineSupport ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {deviceInfo?.offlineSupport ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Connection:</span>
                        <span className={`text-sm font-medium ${
                          isOnline ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Battery:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {batteryLevel ? `${Math.round(batteryLevel)}%` : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Screen Size:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {deviceInfo?.screenSize || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mobileFeatures.map(feature => (
                    <div key={feature.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {feature.icon}
                          <h4 className="font-medium text-gray-900">{feature.name}</h4>
                        </div>
                        {getStatusIcon(feature.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feature.priority)}`}>
                          {feature.priority}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{feature.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Testing Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Touch Testing</h4>
                    <div className="space-y-2">
                      <GlassButton
                        onClick={() => toast.success('Touch test completed!')}
                        className="w-full"
                        icon={<Hand size={16} />}
                      >
                        Test Touch Response
                      </GlassButton>
                      <GlassButton
                        onClick={() => toast.success('Gesture test completed!')}
                        variant="secondary"
                        className="w-full"
                        icon={<MousePointer size={16} />}
                      >
                        Test Gestures
                      </GlassButton>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Performance Testing</h4>
                    <div className="space-y-2">
                      <GlassButton
                        onClick={() => toast.success('Loading speed test completed!')}
                        className="w-full"
                        icon={<Zap size={16} />}
                      >
                        Test Loading Speed
                      </GlassButton>
                      <GlassButton
                        onClick={() => toast.success('Offline functionality test completed!')}
                        variant="secondary"
                        className="w-full"
                        icon={<WifiOff size={16} />}
                      >
                        Test Offline Mode
                      </GlassButton>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Enable Push Notifications</h4>
                      <p className="text-sm text-gray-600">Receive real-time updates and alerts</p>
                    </div>
                    <GlassButton
                      onClick={() => toast.success('Push notifications enabled!')}
                      size="sm"
                    >
                      Enable
                    </GlassButton>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-Sync Data</h4>
                      <p className="text-sm text-gray-600">Automatically sync when online</p>
                    </div>
                    <GlassButton
                      onClick={() => toast.success('Auto-sync enabled!')}
                      size="sm"
                    >
                      Enable
                    </GlassButton>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Low Data Mode</h4>
                      <p className="text-sm text-gray-600">Reduce data usage for slow connections</p>
                    </div>
                    <GlassButton
                      onClick={() => toast.success('Low data mode enabled!')}
                      size="sm"
                    >
                      Enable
                    </GlassButton>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default MobileOptimizationPage;
