import React, { useState, useEffect } from 'react';
import { 
  supabaseStatusMonitor, 
  SupabaseStatus, 
  startSupabaseMonitoring, 
  stopSupabaseMonitoring 
} from '../utils/supabaseStatus';

interface SupabaseStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const SupabaseStatusIndicator: React.FC<SupabaseStatusIndicatorProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const [status, setStatus] = useState<SupabaseStatus>(supabaseStatusMonitor.getStatus());
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Start monitoring
    startSupabaseMonitoring(30000); // Check every 30 seconds

    // Subscribe to status changes
    const unsubscribe = supabaseStatusMonitor.subscribe(setStatus);

    return () => {
      unsubscribe();
      stopSupabaseMonitoring();
    };
  }, []);

  const getStatusColor = () => {
    if (status.isConnected) return 'text-green-600';
    if (status.statusCode === 503) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (status.isConnected) return '🟢';
    if (status.statusCode === 503) return '🟠';
    return '🔴';
  };

  const handleRetry = async () => {
    await supabaseStatusMonitor.testConnection();
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        <span className={`text-xs ${getStatusColor()}`}>
          {status.isConnected ? 'DB' : 'DB Offline'}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <div>
            <h3 className="font-medium text-gray-900">Database Status</h3>
            <p className={`text-sm ${getStatusColor()}`}>
              {supabaseStatusMonitor.getStatusMessage()}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleRetry}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={toggleInfo}
            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            {showInfo ? 'Hide' : 'Info'}
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-medium">Last Check:</span>{' '}
              {status.lastCheck.toLocaleTimeString()}
            </div>
            
            {status.error && (
              <div>
                <span className="font-medium">Error:</span>{' '}
                <span className="text-red-600">{status.error}</span>
              </div>
            )}
            
            {status.statusCode && (
              <div>
                <span className="font-medium">Status Code:</span>{' '}
                <span className="text-orange-600">{status.statusCode}</span>
              </div>
            )}
            
            <div>
              <span className="font-medium">Retry Count:</span>{' '}
              {status.retryCount}
            </div>
          </div>

          {status.statusCode === 503 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-medium text-orange-800 mb-2">503 Service Unavailable</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Supabase service is temporarily down</li>
                <li>• Database maintenance may be in progress</li>
                <li>• Service quota may have been exceeded</li>
                <li>• Network connectivity issues</li>
              </ul>
              <p className="text-xs text-orange-600 mt-2">
                The app will automatically retry with exponential backoff.
              </p>
            </div>
          )}
        </div>
      )}

      {status.isConnected && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ✅ Database connection is healthy and responsive
        </div>
      )}
    </div>
  );
};

export default SupabaseStatusIndicator;
