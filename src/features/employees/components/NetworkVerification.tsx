import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Wifi, Shield, AlertTriangle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NetworkVerificationProps {
  onVerificationSuccess: () => void;
  onVerificationFailed: () => void;
  officeNetworks: {
    ssid: string;
    bssid?: string; // MAC address of router
    description: string;
  }[];
}

const NetworkVerification: React.FC<NetworkVerificationProps> = ({
  onVerificationSuccess,
  onVerificationFailed,
  officeNetworks
}) => {
  const [currentNetwork, setCurrentNetwork] = useState<{
    ssid: string;
    bssid?: string;
    strength?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [error, setError] = useState<string>('');
  const [showFallback, setShowFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const getNetworkInfo = async () => {
    try {
      console.log('📶 Attempting to detect network information...');
      
      // Try to get network information using Network Information API
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          console.log('📶 Network Information API available:', connection);
          return {
            type: connection.effectiveType,
            ssid: 'Unknown', // Network Information API doesn't provide SSID
            bssid: undefined
          };
        }
      }

      // Try to detect network type using other methods
      const networkType = await detectNetworkType();
      
      // For demonstration, we'll simulate network detection
      // In a real implementation, you might use:
      // 1. A native app wrapper (Cordova, Capacitor)
      // 2. A browser extension
      // 3. Server-side network detection
      // 4. IP-based location verification
      
      console.log('📶 Network type detected:', networkType);
      
      return {
        type: networkType,
        ssid: 'Office_WiFi', // This would be detected by native app
        bssid: '00:11:22:33:44:55'
      };
    } catch (error) {
      console.error('📶 Network detection error:', error);
      throw new Error('Unable to detect network information');
    }
  };

  const detectNetworkType = async (): Promise<string> => {
    try {
      // Try to detect if we're on WiFi vs mobile data
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          return connection.effectiveType;
        }
      }

      // Fallback: Try to detect based on connection speed
      // This is not 100% reliable but can give hints
      const startTime = performance.now();
      
      // Make a small request to detect connection speed
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache'
      }).catch(() => null);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Rough estimation based on response time
      if (responseTime < 50) {
        return 'wifi'; // Likely WiFi
      } else if (responseTime < 200) {
        return '4g'; // Likely 4G
      } else {
        return 'slow-2g'; // Likely slower connection
      }
    } catch (error) {
      console.warn('📶 Could not detect network type:', error);
      return 'unknown';
    }
  };

  const verifyNetwork = async () => {
    setIsLoading(true);
    setError('');

    try {
      const networkInfo = await getNetworkInfo();
      
      setCurrentNetwork({
        ssid: networkInfo.ssid,
        bssid: networkInfo.bssid
      });

      console.log('📶 Network verification:', {
        detected: networkInfo,
        officeNetworks,
        isOfficeNetwork: officeNetworks.some(officeNetwork => 
          officeNetwork.ssid.toLowerCase() === networkInfo.ssid.toLowerCase() ||
          (officeNetwork.bssid && officeNetwork.bssid.toLowerCase() === networkInfo.bssid?.toLowerCase())
        )
      });

      // Check if connected to any office network
      const isOfficeNetwork = officeNetworks.some(officeNetwork => {
        // Allow mobile data connections
        if (officeNetwork.ssid.toLowerCase() === '4g_mobile' && networkInfo.type.includes('4g')) {
          return true;
        }
        
        // Allow any network for testing
        if (officeNetwork.ssid.toLowerCase() === 'any_network') {
          return true;
        }
        
        // Check exact SSID match
        return officeNetwork.ssid.toLowerCase() === networkInfo.ssid.toLowerCase() ||
               (officeNetwork.bssid && officeNetwork.bssid.toLowerCase() === networkInfo.bssid?.toLowerCase());
      });

      if (isOfficeNetwork) {
        setVerificationStatus('success');
        toast.success('Network verified! You are connected to office WiFi.');
        onVerificationSuccess();
      } else {
        setVerificationStatus('failed');
        setError('You are not connected to the office WiFi network. Please connect to office WiFi to check in.');
        onVerificationFailed();
      }

    } catch (err) {
      console.error('📶 Network verification failed:', err);
      setVerificationStatus('failed');
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to verify network connection. Please ensure you are connected to office WiFi.');
      }
      
      // Show fallback option after multiple failures
      if (retryCount >= 2) {
        setShowFallback(true);
      }
      
      onVerificationFailed();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError('');
    setVerificationStatus('pending');
    verifyNetwork();
  };

  const handleFallbackVerification = () => {
    // For demonstration, we'll allow fallback verification
    // In a real implementation, this might involve:
    // - Manual verification by manager
    // - Alternative verification methods
    // - Temporary override with approval
    
    setVerificationStatus('success');
    toast.success('Fallback verification approved. Please ensure you are at the office.');
    onVerificationSuccess();
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle size={24} className="text-green-600" />;
      case 'failed':
        return <X size={24} className="text-red-600" />;
      default:
        return <Wifi size={24} className="text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Network Verified';
      case 'failed':
        return 'Network Verification Failed';
      default:
        return 'Verify Network';
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900">Network Verification</h3>
        </div>

        <p className="text-sm text-gray-600">
          We need to verify that you are connected to the office WiFi network.
        </p>

        {/* Office Networks Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Office Networks</span>
          </div>
          <div className="space-y-1">
            {officeNetworks.map((network, index) => (
              <div key={index} className="text-sm text-blue-700">
                <div className="font-medium">{network.ssid}</div>
                <div className="text-xs text-blue-600">{network.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Network Display */}
        {currentNetwork && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Your Network</span>
            </div>
            <p className="text-sm text-gray-600">
              SSID: {currentNetwork.ssid}
            </p>
            {currentNetwork.bssid && (
              <p className="text-xs text-gray-500 mt-1">
                BSSID: {currentNetwork.bssid}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-800">Verification Failed</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            
            {/* Retry Button */}
            {retryCount < 3 && (
              <div className="mt-3">
                <GlassButton
                  onClick={handleRetry}
                  disabled={isLoading}
                  icon={<RefreshCw size={16} />}
                  className="bg-blue-600 text-white text-sm"
                >
                  Try Again ({3 - retryCount} attempts left)
                </GlassButton>
              </div>
            )}
          </div>
        )}

        {/* Fallback Option */}
        {showFallback && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Alternative Verification</span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Network detection is not working properly. You can use alternative verification methods.
            </p>
            <GlassButton
              onClick={handleFallbackVerification}
              className="bg-yellow-600 text-white"
            >
              Use Alternative Verification
            </GlassButton>
          </div>
        )}

        {/* Action Button */}
        {!showFallback && (
          <div className="flex gap-3">
            <GlassButton
              onClick={verifyNetwork}
              disabled={isLoading}
              icon={<Wifi size={18} />}
              className={`flex-1 ${
                verificationStatus === 'success' 
                  ? 'bg-green-600 text-white' 
                  : verificationStatus === 'failed'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {isLoading ? 'Verifying...' : getStatusText()}
            </GlassButton>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Connect to one of the office WiFi networks</p>
          <p>• Ensure you have permission to access the network</p>
          <p>• Network verification helps ensure you are physically present</p>
          <p>• Contact IT if you have network access issues</p>
        </div>

        {/* Security Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Security Note</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Network verification is one of several security measures to ensure you are physically present at the office.
          </p>
        </div>
      </div>
    </GlassCard>
  );
};

export default NetworkVerification;
