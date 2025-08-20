import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';

interface RateLimitStatus {
  isRateLimited: boolean;
  lastError?: string;
  errorCount: number;
  lastCheck: string;
  recommendations: string[];
  timeUntilReset?: number;
}

const WhatsAppRateLimitMonitor: React.FC = () => {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkRateLimitStatus = async () => {
    setIsLoading(true);
    try {
      // Check localStorage for rate limit indicators
      const lastCheck = localStorage.getItem('whatsapp_last_check');
      const rateLimitBackoff = localStorage.getItem('whatsapp_rate_limit_backoff');
      const errorCount = parseInt(localStorage.getItem('whatsapp_error_count') || '0');
      
      const isRateLimited = rateLimitBackoff && Date.now() < parseInt(rateLimitBackoff);
      const timeUntilReset = isRateLimited ? parseInt(rateLimitBackoff) - Date.now() : 0;
      
      setStatus({
        isRateLimited,
        lastError: localStorage.getItem('whatsapp_last_error') || undefined,
        errorCount,
        lastCheck: lastCheck ? new Date(parseInt(lastCheck)).toLocaleString() : 'Never',
        timeUntilReset,
        recommendations: [
          'Wait 30 minutes before making new API calls',
          'Check Green API dashboard for rate limit status',
          'Consider upgrading your Green API plan',
          'Implement more aggressive caching',
          'Use webhooks instead of polling',
          'Reduce connection check frequency'
        ]
      });
    } catch (error) {
      console.error('Failed to check rate limit status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRateLimitState = () => {
    try {
      localStorage.removeItem('whatsapp_rate_limit_backoff');
      localStorage.removeItem('whatsapp_last_error');
      localStorage.removeItem('whatsapp_error_count');
      localStorage.removeItem('whatsapp_connection_health');
      sessionStorage.removeItem('whatsapp_connection_health');
      
      console.log('🧹 Cleared WhatsApp rate limit state');
      checkRateLimitStatus();
    } catch (error) {
      console.error('Failed to clear rate limit state:', error);
    }
  };

  useEffect(() => {
    checkRateLimitStatus();
    // Check status every 5 minutes
    const interval = setInterval(checkRateLimitStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return (
      <div className="bg-gray-100 p-3 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Rate Limit Monitor</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status.isRateLimited ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            <h3 className="text-sm font-medium text-gray-900">Rate Limit Monitor</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={checkRateLimitStatus}
              disabled={isLoading}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>

        <div className="mt-2">
          <p className="text-xs text-gray-600">
            Status: <span className={`font-medium ${status.isRateLimited ? 'text-red-600' : 'text-green-600'}`}>
              {status.isRateLimited ? 'Rate Limited' : 'Normal'}
            </span>
          </p>
          {status.isRateLimited && status.timeUntilReset && (
            <p className="text-xs text-red-600 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Reset in: {formatTime(status.timeUntilReset)}</span>
            </p>
          )}
          <p className="text-xs text-gray-500">
            Errors: {status.errorCount} | Last check: {status.lastCheck}
          </p>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {status.lastError && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Last Error:</p>
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{status.lastError}</p>
              </div>
            )}
            
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Recommendations:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {status.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={clearRateLimitState}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
              >
                Clear Rate Limit State
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppRateLimitMonitor;
