import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Signal, Lock, Unlock } from 'lucide-react';

interface WiFiNetwork {
  ssid: string;
  bssid?: string;
  signalStrength?: number;
  security?: string;
  frequency?: number;
  channel?: number;
}

const WiFiScanner: React.FC = () => {
  const [currentWiFi, setCurrentWiFi] = useState<WiFiNetwork | null>(null);
  const [availableNetworks, setAvailableNetworks] = useState<WiFiNetwork[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  // Check if WiFi scanning is supported
  const isWiFiSupported = () => {
    return 'wifi' in navigator || 'connection' in navigator;
  };

  // Get current WiFi connection info
  const getCurrentWiFi = async () => {
    try {
      setError(null);
      
      // Method 1: Try using Network Information API
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          setCurrentWiFi({
            ssid: 'Connected Network',
            signalStrength: connection.downlink ? connection.downlink * 1000 : undefined,
            security: 'Unknown'
          });
        }
      }

      // Method 2: Try using WiFi API (experimental)
      if ('wifi' in navigator) {
        try {
          const wifi = (navigator as any).wifi;
          const networks = await wifi.getCurrentNetwork();
          if (networks) {
            setCurrentWiFi({
              ssid: networks.ssid,
              bssid: networks.bssid,
              signalStrength: networks.signalStrength,
              security: networks.security
            });
          }
        } catch (wifiError) {
          console.log('WiFi API not available:', wifiError);
        }
      }

      // Method 3: Use Network Information
      if ('networkInformation' in navigator) {
        const networkInfo = (navigator as any).networkInformation;
        if (networkInfo) {
          setCurrentWiFi({
            ssid: 'Current Network',
            signalStrength: networkInfo.downlink,
            security: 'Unknown'
          });
        }
      }

    } catch (error) {
      console.error('Error getting current WiFi:', error);
      setError('Could not get current WiFi information');
    }
  };

  // Scan for available networks
  const scanForNetworks = async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      // Note: Due to browser security restrictions, we can't actually scan for networks
      // This is a demonstration of what the API would look like
      
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data for demonstration
      const mockNetworks: WiFiNetwork[] = [
        { ssid: 'Office_WiFi_2.4G', signalStrength: 85, security: 'WPA2', frequency: 2.4 },
        { ssid: 'Office_WiFi_5G', signalStrength: 92, security: 'WPA2', frequency: 5.0 },
        { ssid: 'Guest_Network', signalStrength: 78, security: 'Open', frequency: 2.4 },
        { ssid: 'Staff_Network', signalStrength: 88, security: 'WPA3', frequency: 5.0 },
        { ssid: 'IoT_Network', signalStrength: 65, security: 'WPA2', frequency: 2.4 }
      ];
      
      setAvailableNetworks(mockNetworks);
      
    } catch (error) {
      console.error('Error scanning networks:', error);
      setError('Could not scan for networks');
    } finally {
      setIsScanning(false);
    }
  };

  // Check permissions
  const checkPermissions = async () => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'wifi' as any });
        setPermissionStatus(permission.state);
      } else {
        setPermissionStatus('not-supported');
      }
    } catch (error) {
      setPermissionStatus('error');
    }
  };

  useEffect(() => {
    getCurrentWiFi();
    checkPermissions();
  }, []);

  const getSignalIcon = (strength?: number) => {
    if (!strength) return <Signal className="w-4 h-4 text-gray-400" />;
    
    if (strength >= 80) return <Signal className="w-4 h-4 text-green-500" />;
    if (strength >= 60) return <Signal className="w-4 h-4 text-yellow-500" />;
    return <Signal className="w-4 h-4 text-red-500" />;
  };

  const getSecurityIcon = (security?: string) => {
    if (security === 'Open') return <Unlock className="w-4 h-4 text-red-500" />;
    return <Lock className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-blue-600" />
          WiFi Scanner
        </h2>
        <button
          onClick={scanForNetworks}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning...' : 'Scan Networks'}
        </button>
      </div>

      {/* Current WiFi Connection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Current Connection</h3>
        {currentWiFi ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{currentWiFi.ssid}</p>
                  {currentWiFi.signalStrength && (
                    <p className="text-sm text-green-700">
                      Signal: {currentWiFi.signalStrength}%
                    </p>
                  )}
                </div>
              </div>
              {getSecurityIcon(currentWiFi.security)}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-gray-400" />
              <p className="text-gray-600">No WiFi connection detected</p>
            </div>
          </div>
        )}
      </div>

      {/* Available Networks */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Available Networks</h3>
        {availableNetworks.length > 0 ? (
          <div className="space-y-2">
            {availableNetworks.map((network, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {getSignalIcon(network.signalStrength)}
                  <div>
                    <p className="font-medium text-gray-900">{network.ssid}</p>
                    <p className="text-sm text-gray-600">
                      {network.frequency}GHz • {network.signalStrength}% signal
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getSecurityIcon(network.security)}
                  <span className="text-sm text-gray-600">{network.security}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">No networks found. Click "Scan Networks" to search.</p>
          </div>
        )}
      </div>

      {/* Status Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Browser WiFi Support</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>WiFi API Support: {isWiFiSupported() ? '✅ Available' : '❌ Not Available'}</p>
          <p>Permission Status: {permissionStatus}</p>
          <p>Note: Due to browser security restrictions, actual WiFi scanning may be limited.</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default WiFiScanner;
