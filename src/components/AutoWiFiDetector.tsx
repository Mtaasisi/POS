import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, Signal, Lock, Unlock, Settings, Play, Pause, Zap } from 'lucide-react';

interface WiFiNetwork {
  ssid: string;
  bssid?: string;
  signalStrength?: number;
  security?: string;
  frequency?: number;
  channel?: number;
  lastSeen: Date;
  isCurrent?: boolean;
}

interface AutoWiFiDetectorProps {
  autoScan?: boolean;
  scanInterval?: number; // in seconds
  maxNetworks?: number;
  onNetworkDetected?: (network: WiFiNetwork) => void;
  onCurrentNetworkChange?: (network: WiFiNetwork | null) => void;
}

const AutoWiFiDetector: React.FC<AutoWiFiDetectorProps> = ({
  autoScan = true,
  scanInterval = 10,
  maxNetworks = 20,
  onNetworkDetected,
  onCurrentNetworkChange
}) => {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState<WiFiNetwork | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoScanning, setIsAutoScanning] = useState(autoScan);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    networksFound: 0,
    lastScanTime: null as Date | null
  });
  
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Mock WiFi networks for demonstration
  const mockNetworks = [
    { ssid: 'Office_WiFi_2.4G', signalStrength: 85, security: 'WPA2', frequency: 2.4, channel: 6 },
    { ssid: 'Office_WiFi_5G', signalStrength: 92, security: 'WPA2', frequency: 5.0, channel: 36 },
    { ssid: 'Guest_Network', signalStrength: 78, security: 'Open', frequency: 2.4, channel: 11 },
    { ssid: 'Staff_Network', signalStrength: 88, security: 'WPA3', frequency: 5.0, channel: 40 },
    { ssid: 'IoT_Network', signalStrength: 65, security: 'WPA2', frequency: 2.4, channel: 1 },
    { ssid: 'Conference_Room', signalStrength: 95, security: 'WPA2', frequency: 5.0, channel: 44 },
    { ssid: 'Reception_WiFi', signalStrength: 82, security: 'WPA2', frequency: 2.4, channel: 9 },
    { ssid: 'Backup_Network', signalStrength: 45, security: 'WPA2', frequency: 2.4, channel: 3 }
  ];

  // Simulate WiFi scanning
  const performWiFiScan = async (): Promise<WiFiNetwork[]> => {
    setIsScanning(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Generate random subset of networks with varying signal strengths
      const availableNetworks = mockNetworks
        .filter(() => Math.random() > 0.3) // 70% chance of being detected
        .map(network => ({
          ...network,
          signalStrength: Math.max(30, network.signalStrength! + (Math.random() - 0.5) * 20),
          lastSeen: new Date(),
          isCurrent: Math.random() > 0.9 // 10% chance of being current network
        }));

      // Add some random networks
      const randomNetworks = [
        { ssid: `Neighbor_${Math.floor(Math.random() * 100)}`, signalStrength: 30 + Math.random() * 40, security: 'WPA2', frequency: 2.4, channel: Math.floor(Math.random() * 11) + 1, lastSeen: new Date() },
        { ssid: `Public_${Math.floor(Math.random() * 50)}`, signalStrength: 20 + Math.random() * 30, security: 'Open', frequency: 2.4, channel: Math.floor(Math.random() * 11) + 1, lastSeen: new Date() }
      ];

      return [...availableNetworks, ...randomNetworks];
    } catch (error) {
      console.error('WiFi scan error:', error);
      throw new Error('Failed to scan WiFi networks');
    } finally {
      setIsScanning(false);
    }
  };

  // Update networks list
  const updateNetworks = (newNetworks: WiFiNetwork[]) => {
    setNetworks(prevNetworks => {
      const updatedNetworks = [...prevNetworks];
      
      newNetworks.forEach(newNetwork => {
        const existingIndex = updatedNetworks.findIndex(n => n.ssid === newNetwork.ssid);
        
        if (existingIndex >= 0) {
          // Update existing network
          updatedNetworks[existingIndex] = {
            ...updatedNetworks[existingIndex],
            signalStrength: newNetwork.signalStrength,
            lastSeen: new Date(),
            isCurrent: newNetwork.isCurrent || updatedNetworks[existingIndex].isCurrent
          };
        } else {
          // Add new network
          updatedNetworks.push(newNetwork);
        }
      });

      // Sort by signal strength and limit to maxNetworks
      return updatedNetworks
        .sort((a, b) => (b.signalStrength || 0) - (a.signalStrength || 0))
        .slice(0, maxNetworks);
    });

    // Update current network
    const current = newNetworks.find(n => n.isCurrent);
    if (current && current.ssid !== currentNetwork?.ssid) {
      setCurrentNetwork(current);
      onCurrentNetworkChange?.(current);
    }
  };

  // Perform a single scan
  const scanNetworks = async () => {
    try {
      const newNetworks = await performWiFiScan();
      updateNetworks(newNetworks);
      
      setStats(prev => ({
        totalScans: prev.totalScans + 1,
        networksFound: newNetworks.length,
        lastScanTime: new Date()
      }));

      // Notify about new networks
      newNetworks.forEach(network => {
        onNetworkDetected?.(network);
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Scan failed');
    }
  };

  // Start auto-scanning
  const startAutoScan = () => {
    setIsAutoScanning(true);
    scanNetworks(); // Initial scan
    
    scanIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        scanNetworks();
      }
    }, scanInterval * 1000);
  };

  // Stop auto-scanning
  const stopAutoScan = () => {
    setIsAutoScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // Toggle auto-scanning
  const toggleAutoScan = () => {
    if (isAutoScanning) {
      stopAutoScan();
    } else {
      startAutoScan();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (autoScan) {
      startAutoScan();
    }

    return () => {
      isMountedRef.current = false;
      stopAutoScan();
    };
  }, [autoScan, scanInterval]);

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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Wifi className="w-6 h-6 text-blue-600" />
            {isAutoScanning && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Auto WiFi Detector</h2>
            <p className="text-sm text-gray-600">
              {isAutoScanning ? 'Auto-scanning active' : 'Manual mode'} • {networks.length} networks found
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={scanNetworks}
            disabled={isScanning}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </button>
          
          <button
            onClick={toggleAutoScan}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isAutoScanning 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isAutoScanning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoScanning ? 'Stop Auto' : 'Start Auto'}
          </button>
        </div>
      </div>

      {/* Current Network */}
      {currentNetwork && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Current Connection
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{currentNetwork.ssid}</p>
                  <p className="text-sm text-green-700">
                    {currentNetwork.frequency}GHz • Channel {currentNetwork.channel} • {currentNetwork.signalStrength}% signal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getSecurityIcon(currentNetwork.security)}
                <span className="text-sm text-green-700">{currentNetwork.security}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Networks List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Available Networks</h3>
          <div className="text-sm text-gray-600">
            Scan interval: {scanInterval}s • Last scan: {stats.lastScanTime ? formatTimeAgo(stats.lastScanTime) : 'Never'}
          </div>
        </div>
        
        {networks.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {networks.map((network, index) => (
              <div 
                key={`${network.ssid}-${index}`} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  network.isCurrent 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getSignalIcon(network.signalStrength)}
                  <div>
                    <p className={`font-medium ${network.isCurrent ? 'text-green-900' : 'text-gray-900'}`}>
                      {network.ssid}
                      {network.isCurrent && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Current</span>}
                    </p>
                    <p className="text-sm text-gray-600">
                      {network.frequency}GHz • Ch {network.channel} • {network.signalStrength}% • {formatTimeAgo(network.lastSeen)}
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No networks detected yet</p>
            <p className="text-sm text-gray-500 mt-2">Click "Scan Now" to start detecting networks</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Scan Statistics</h4>
        <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium">Total Scans</p>
            <p>{stats.totalScans}</p>
          </div>
          <div>
            <p className="font-medium">Networks Found</p>
            <p>{stats.networksFound}</p>
          </div>
          <div>
            <p className="font-medium">Last Scan</p>
            <p>{stats.lastScanTime ? formatTimeAgo(stats.lastScanTime) : 'Never'}</p>
          </div>
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

export default AutoWiFiDetector;
