// WiFi Detection Service
// Provides real WiFi network detection capabilities

export interface WiFiNetwork {
  ssid: string;
  bssid?: string;
  signalStrength?: number;
  security?: string;
  frequency?: number;
  channel?: number;
  lastSeen: Date;
  isCurrent?: boolean;
  rssi?: number; // Received Signal Strength Indicator
  noise?: number;
  capabilities?: string[];
}

export interface WiFiScanResult {
  networks: WiFiNetwork[];
  currentNetwork?: WiFiNetwork;
  scanTime: Date;
  error?: string;
}

class WiFiDetectionService {
  private static instance: WiFiDetectionService;
  private isSupported: boolean = false;
  private currentNetwork: WiFiNetwork | null = null;

  private constructor() {
    this.checkSupport();
  }

  static getInstance(): WiFiDetectionService {
    if (!WiFiDetectionService.instance) {
      WiFiDetectionService.instance = new WiFiDetectionService();
    }
    return WiFiDetectionService.instance;
  }

  private checkSupport(): void {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Check for various WiFi APIs
      this.isSupported = !!(navigator as any).wifi || 
                        !!(navigator as any).connection ||
                        !!(navigator as any).networkInformation;
    }
  }

  // Get current WiFi connection using available APIs
  async getCurrentNetwork(): Promise<WiFiNetwork | null> {
    try {
      // Method 1: Try WiFi API (experimental)
      if ((navigator as any).wifi) {
        const wifi = (navigator as any).wifi;
        const network = await wifi.getCurrentNetwork();
        if (network) {
          return {
            ssid: network.ssid,
            bssid: network.bssid,
            signalStrength: network.signalStrength,
            security: network.security,
            lastSeen: new Date(),
            isCurrent: true
          };
        }
      }

      // Method 2: Try Network Information API
      if ((navigator as any).connection) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          return {
            ssid: 'Connected Network',
            signalStrength: connection.downlink ? Math.min(100, connection.downlink * 10) : undefined,
            security: 'Unknown',
            lastSeen: new Date(),
            isCurrent: true
          };
        }
      }

      // Method 3: Try Network Information (alternative)
      if ((navigator as any).networkInformation) {
        const networkInfo = (navigator as any).networkInformation;
        if (networkInfo) {
          return {
            ssid: 'Current Network',
            signalStrength: networkInfo.downlink ? Math.min(100, networkInfo.downlink * 10) : undefined,
            security: 'Unknown',
            lastSeen: new Date(),
            isCurrent: true
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting current network:', error);
      return null;
    }
  }

  // Scan for available networks
  async scanNetworks(): Promise<WiFiScanResult> {
    try {
      const networks: WiFiNetwork[] = [];
      let currentNetwork: WiFiNetwork | undefined;

      // Get current network
      const current = await this.getCurrentNetwork();
      if (current) {
        currentNetwork = current;
        networks.push(current);
      }

      // Try to get available networks (limited by browser security)
      if ((navigator as any).wifi) {
        try {
          const wifi = (navigator as any).wifi;
          const availableNetworks = await wifi.getNetworks();
          
          availableNetworks.forEach((network: any) => {
            if (network.ssid !== current?.ssid) {
              networks.push({
                ssid: network.ssid,
                bssid: network.bssid,
                signalStrength: network.signalStrength,
                security: network.security,
                frequency: network.frequency,
                channel: network.channel,
                lastSeen: new Date(),
                isCurrent: false
              });
            }
          });
        } catch (wifiError) {
          console.log('WiFi API scan not available:', wifiError);
        }
      }

      return {
        networks,
        currentNetwork,
        scanTime: new Date()
      };
    } catch (error) {
      console.error('Error scanning networks:', error);
      return {
        networks: [],
        scanTime: new Date(),
        error: error instanceof Error ? error.message : 'Scan failed'
      };
    }
  }

  // Start continuous scanning
  startContinuousScan(
    interval: number = 10000,
    onNetworksUpdate?: (result: WiFiScanResult) => void,
    onError?: (error: string) => void
  ): () => void {
    let isRunning = true;
    let scanInterval: NodeJS.Timeout | null = null;

    const performScan = async () => {
      if (!isRunning) return;

      try {
        const result = await this.scanNetworks();
        onNetworksUpdate?.(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Scan failed';
        onError?.(errorMessage);
      }
    };

    // Initial scan
    performScan();

    // Set up interval
    scanInterval = setInterval(performScan, interval);

    // Return cleanup function
    return () => {
      isRunning = false;
      if (scanInterval) {
        clearInterval(scanInterval);
      }
    };
  }

  // Get network capabilities
  async getNetworkCapabilities(ssid: string): Promise<string[]> {
    try {
      if ((navigator as any).wifi) {
        const wifi = (navigator as any).wifi;
        const network = await wifi.getNetwork(ssid);
        return network?.capabilities || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting network capabilities:', error);
      return [];
    }
  }

  // Connect to a network (if supported)
  async connectToNetwork(ssid: string, password?: string): Promise<boolean> {
    try {
      if ((navigator as any).wifi) {
        const wifi = (navigator as any).wifi;
        await wifi.connect(ssid, password);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error connecting to network:', error);
      return false;
    }
  }

  // Disconnect from current network
  async disconnect(): Promise<boolean> {
    try {
      if ((navigator as any).wifi) {
        const wifi = (navigator as any).wifi;
        await wifi.disconnect();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error disconnecting:', error);
      return false;
    }
  }

  // Check if WiFi scanning is supported
  isWiFiScanningSupported(): boolean {
    return this.isSupported;
  }

  // Get system information
  getSystemInfo(): {
    platform: string;
    userAgent: string;
    wifiSupported: boolean;
  } {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      wifiSupported: this.isSupported
    };
  }

  // Request permissions (if needed)
  async requestPermissions(): Promise<boolean> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'wifi' as any });
        return permission.state === 'granted';
      }
      return true; // Assume granted if permissions API not available
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Get mock networks for testing/demo
  getMockNetworks(): WiFiNetwork[] {
    return [
      {
        ssid: 'Office_WiFi_2.4G',
        signalStrength: 85,
        security: 'WPA2',
        frequency: 2.4,
        channel: 6,
        lastSeen: new Date(),
        isCurrent: false
      },
      {
        ssid: 'Office_WiFi_5G',
        signalStrength: 92,
        security: 'WPA2',
        frequency: 5.0,
        channel: 36,
        lastSeen: new Date(),
        isCurrent: false
      },
      {
        ssid: 'Guest_Network',
        signalStrength: 78,
        security: 'Open',
        frequency: 2.4,
        channel: 11,
        lastSeen: new Date(),
        isCurrent: false
      },
      {
        ssid: 'Staff_Network',
        signalStrength: 88,
        security: 'WPA3',
        frequency: 5.0,
        channel: 40,
        lastSeen: new Date(),
        isCurrent: false
      },
      {
        ssid: 'IoT_Network',
        signalStrength: 65,
        security: 'WPA2',
        frequency: 2.4,
        channel: 1,
        lastSeen: new Date(),
        isCurrent: false
      }
    ];
  }
}

// Export singleton instance
export const wifiDetectionService = WiFiDetectionService.getInstance();

// Export types
export type { WiFiScanResult };
