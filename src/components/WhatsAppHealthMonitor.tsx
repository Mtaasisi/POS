import React, { useState, useEffect } from 'react';
import { whatsappService } from '../services/whatsappService';
import { WhatsAppDiagnostics } from '../utils/whatsappDiagnostics';

interface HealthStatus {
  isHealthy: boolean;
  status: string;
  error?: string;
  recommendations: string[];
  lastCheck: string;
}

const WhatsAppHealthMonitor: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const diagnostics = new WhatsAppDiagnostics();
      const connectionHealth = await whatsappService.performHealthCheck();
      const recommendations = await diagnostics.getSystemRecommendations();

      setHealthStatus({
        isHealthy: connectionHealth.healthy,
        status: connectionHealth.status,
        error: connectionHealth.error,
        recommendations,
        lastCheck: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        isHealthy: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        recommendations: ['Check network connection', 'Verify WhatsApp credentials'],
        lastCheck: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Check health every 120 minutes (2 hours) to reduce API calls and prevent rate limiting
    const interval = setInterval(checkHealth, 120 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!healthStatus) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">WhatsApp Health</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${healthStatus.isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h3 className="text-sm font-medium text-gray-900">WhatsApp Health</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={checkHealth}
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
            Status: <span className="font-medium">{healthStatus.status}</span>
          </p>
          <p className="text-xs text-gray-500">
            Last check: {new Date(healthStatus.lastCheck).toLocaleTimeString()}
          </p>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {healthStatus.error && (
              <div className="mb-2">
                <p className="text-xs text-red-600 font-medium">Error:</p>
                <p className="text-xs text-red-500">{healthStatus.error}</p>
              </div>
            )}

            {healthStatus.recommendations.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Recommendations:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {healthStatus.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppHealthMonitor;
