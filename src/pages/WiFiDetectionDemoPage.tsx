import React, { useState, useEffect } from 'react';
import { Wifi, Settings, Activity, Zap, Shield, Signal } from 'lucide-react';
import AutoWiFiDetector from '../components/AutoWiFiDetector';
import WiFiScanner from '../components/WiFiScanner';
import { wifiDetectionService } from '../lib/wifiDetectionService';

const WiFiDetectionDemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual' | 'settings'>('auto');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [permissions, setPermissions] = useState<string>('unknown');

  useEffect(() => {
    // Get system information
    const info = wifiDetectionService.getSystemInfo();
    setSystemInfo(info);

    // Check permissions
    wifiDetectionService.requestPermissions().then(granted => {
      setPermissions(granted ? 'granted' : 'denied');
    });
  }, []);

  const tabs = [
    { id: 'auto', label: 'Auto Detection', icon: Activity },
    { id: 'manual', label: 'Manual Scanner', icon: Wifi },
    { id: 'settings', label: 'System Info', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Wifi className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">WiFi Detection System</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Automatic WiFi network detection and monitoring system with real-time scanning capabilities
          </p>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${wifiDetectionService.isWiFiScanningSupported() ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900">WiFi API</p>
                <p className="text-xs text-gray-500">
                  {wifiDetectionService.isWiFiScanningSupported() ? 'Supported' : 'Not Supported'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${permissions === 'granted' ? 'bg-green-500' : permissions === 'denied' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Permissions</p>
                <p className="text-xs text-gray-500 capitalize">{permissions}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Platform</p>
                <p className="text-xs text-gray-500">{systemInfo?.platform || 'Unknown'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Browser</p>
                <p className="text-xs text-gray-500">
                  {systemInfo?.userAgent ? systemInfo.userAgent.split(' ').pop()?.split('/')[0] : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'auto' && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Automatic WiFi Detection</h2>
                <p className="text-gray-600">
                  Continuously monitors and detects available WiFi networks with real-time updates.
                </p>
              </div>
              <AutoWiFiDetector
                autoScan={true}
                scanInterval={15}
                maxNetworks={25}
                onNetworkDetected={(network) => {
                  console.log('New network detected:', network.ssid);
                }}
                onCurrentNetworkChange={(network) => {
                  console.log('Current network changed:', network?.ssid);
                }}
              />
            </div>
          )}

          {activeTab === 'manual' && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Manual WiFi Scanner</h2>
                <p className="text-gray-600">
                  Manual scanning with detailed network information and connection capabilities.
                </p>
              </div>
              <WiFiScanner />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Platform Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform:</span>
                        <span className="font-medium">{systemInfo?.platform || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User Agent:</span>
                        <span className="font-medium text-xs max-w-xs truncate">{systemInfo?.userAgent || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">WiFi Support:</span>
                        <span className={`font-medium ${systemInfo?.wifiSupported ? 'text-green-600' : 'text-red-600'}`}>
                          {systemInfo?.wifiSupported ? 'Supported' : 'Not Supported'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Capabilities</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${wifiDetectionService.isWiFiScanningSupported() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>WiFi Network Scanning</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${permissions === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span>Permission Access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Network Information API</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Connection Status</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Features & Capabilities
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Auto Detection</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      Continuously monitors for new WiFi networks with configurable scan intervals
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Signal className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-green-900">Signal Analysis</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Analyzes signal strength, security protocols, and network capabilities
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Security Info</h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      Displays security protocols, encryption types, and connection status
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Browser Limitations</h4>
                <p className="text-sm text-yellow-800">
                  Due to browser security restrictions, actual WiFi scanning capabilities may be limited. 
                  The system uses available APIs and provides mock data for demonstration purposes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WiFiDetectionDemoPage;
