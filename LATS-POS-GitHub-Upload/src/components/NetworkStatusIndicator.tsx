import React from 'react';
import { checkNetworkStatus, getConnectionQuality } from '../lib/customerApi/core';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const [status, setStatus] = React.useState({
    online: navigator.onLine,
    quality: 'unknown',
    message: 'Checking connection...',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  React.useEffect(() => {
    const updateStatus = () => {
      const networkStatus = checkNetworkStatus();
      const quality = getConnectionQuality();
      
      setStatus({
        online: networkStatus.online,
        quality: quality.quality,
        message: quality.message,
        effectiveType: networkStatus.effectiveType,
        downlink: networkStatus.downlink,
        rtt: networkStatus.rtt
      });
    };

    // Initial check
    updateStatus();

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check
    const interval = setInterval(updateStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    if (!status.online) return 'text-red-500';
    switch (status.quality) {
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (!status.online) return '📡';
    switch (status.quality) {
      case 'good': return '📶';
      case 'fair': return '📶';
      case 'poor': return '📶';
      default: return '📡';
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <span className={getStatusColor()}>
        {getStatusIcon()}
      </span>
      
      {showDetails ? (
        <div className="flex flex-col">
          <span className={`font-medium ${getStatusColor()}`}>
            {status.online ? status.quality.toUpperCase() : 'OFFLINE'}
          </span>
          <span className="text-xs text-gray-500">
            {status.message}
          </span>
          {status.online && status.effectiveType !== 'unknown' && (
            <span className="text-xs text-gray-400">
              {status.effectiveType} • {status.downlink}Mbps • {status.rtt}ms
            </span>
          )}
        </div>
      ) : (
        <span className={`font-medium ${getStatusColor()}`}>
          {status.online ? status.quality.toUpperCase() : 'OFFLINE'}
        </span>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
