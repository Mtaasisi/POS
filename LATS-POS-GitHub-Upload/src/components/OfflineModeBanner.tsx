import React from 'react';
import { supabaseStatusMonitor } from '../utils/supabaseStatus';

interface OfflineModeBannerProps {
  className?: string;
}

export const OfflineModeBanner: React.FC<OfflineModeBannerProps> = ({ 
  className = '' 
}) => {
  const status = supabaseStatusMonitor.getStatus();
  
  // Only show if we should be in offline mode
  if (!supabaseStatusMonitor.shouldShowOfflineMode()) {
    return null;
  }

  const handleRetry = async () => {
    await supabaseStatusMonitor.testConnection();
  };

  return (
    <div className={`bg-orange-50 border-l-4 border-orange-400 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-orange-400 text-lg">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            Database Connection Unavailable
          </h3>
          <div className="mt-2 text-sm text-orange-700">
            <p>
              The database service is currently unavailable. Some features may not work properly.
            </p>
            {status.statusCode === 503 && (
              <div className="mt-2">
                <p className="font-medium">This is likely due to:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Supabase service maintenance</li>
                  <li>Database overload or high traffic</li>
                  <li>Service quota exceeded</li>
                  <li>Network connectivity issues</li>
                </ul>
              </div>
            )}
            <div className="mt-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-3 py-1 border border-orange-300 text-xs font-medium rounded text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineModeBanner;
