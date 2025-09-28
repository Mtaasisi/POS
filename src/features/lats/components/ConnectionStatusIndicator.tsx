import React, { useState, useEffect } from 'react';
import { ConnectionMonitor } from '../services/connectionMonitor';

interface ConnectionStatusIndicatorProps {
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ 
  className = '' 
}) => {
  const [connectionHealth, setConnectionHealth] = useState(ConnectionMonitor.getConnectionHealth());

  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionHealth(ConnectionMonitor.getConnectionHealth());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (connectionHealth.isHealthy) return 'text-green-500';
    if (connectionHealth.retryCount > 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (connectionHealth.isHealthy) return '🟢';
    if (connectionHealth.retryCount > 0) return '🟡';
    return '🔴';
  };

  const getStatusText = () => {
    if (connectionHealth.isHealthy) return 'Connected';
    if (connectionHealth.retryCount > 0) return `Retrying (${connectionHealth.retryCount})`;
    return 'Disconnected';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{getStatusIcon()}</span>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {connectionHealth.retryCount > 0 && (
        <span className="text-xs text-gray-500">
          ({Math.floor(connectionHealth.timeSinceLastSuccess / 1000)}s ago)
        </span>
      )}
    </div>
  );
};
