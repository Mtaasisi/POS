import React, { useState, useEffect } from 'react';
import { WhatsAppDiagnostics, WhatsAppDiagnosticResult } from '../utils/whatsappDiagnostics';

interface WhatsAppDiagnosticWidgetProps {
  className?: string;
  showDetails?: boolean;
}

export const WhatsAppDiagnosticWidget: React.FC<WhatsAppDiagnosticWidgetProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [diagnostics, setDiagnostics] = useState<WhatsAppDiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await WhatsAppDiagnostics.getInstance().runDiagnostics();
      setDiagnostics(result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(runDiagnostics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!diagnostics) {
    return (
      <div className={`bg-gray-100 p-4 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading WhatsApp diagnostics...</span>
        </div>
      </div>
    );
  }

  const getStatusColor = (healthy: boolean) => {
    return healthy ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (healthy: boolean) => {
    return healthy ? '✅' : '❌';
  };

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">WhatsApp Status</h3>
        <div className="flex items-center space-x-2">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">{getStatusIcon(diagnostics.connectionHealth.healthy)}</span>
          <span className={`font-medium ${getStatusColor(diagnostics.connectionHealth.healthy)}`}>
            {diagnostics.connectionHealth.status}
          </span>
        </div>
        {diagnostics.connectionHealth.error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {diagnostics.connectionHealth.error}
          </p>
        )}
      </div>

      {/* Settings Status */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Instance ID:</span>
            <span className={diagnostics.settings.instanceId ? 'text-green-600' : 'text-red-600'}>
              {diagnostics.settings.instanceId || 'Not configured'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>API Key:</span>
            <span className={diagnostics.settings.apiKey ? 'text-green-600' : 'text-red-600'}>
              {diagnostics.settings.apiKey || 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Summary */}
      {diagnostics.recentErrors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Recent Errors ({diagnostics.recentErrors.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {diagnostics.recentErrors.slice(0, 3).map((error, index) => (
              <div key={index} className="text-xs bg-red-50 p-2 rounded">
                <div className="font-medium text-red-700">{error.context}</div>
                <div className="text-red-600 truncate">{error.error}</div>
                <div className="text-gray-500">{new Date(error.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {diagnostics.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {diagnostics.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                💡 {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed View Toggle */}
      {showDetails && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Show Detailed Information
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
};

export default WhatsAppDiagnosticWidget;
