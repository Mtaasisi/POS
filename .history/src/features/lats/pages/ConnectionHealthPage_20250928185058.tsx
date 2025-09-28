import React, { useState, useEffect } from 'react';
import { ConnectionMonitor } from '../services/connectionMonitor';
import { ErrorReporter } from '../services/errorReporter';
import { ConnectionStatusIndicator } from '../components/ConnectionStatusIndicator';

export const ConnectionHealthPage: React.FC = () => {
  const [connectionHealth, setConnectionHealth] = useState(ConnectionMonitor.getConnectionHealth());
  const [errorSummary, setErrorSummary] = useState(ErrorReporter.getErrorSummary());
  const [recentErrors, setRecentErrors] = useState(ErrorReporter.getRecentErrors());

  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionHealth(ConnectionMonitor.getConnectionHealth());
      setErrorSummary(ErrorReporter.getErrorSummary());
      setRecentErrors(ErrorReporter.getRecentErrors());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getHealthIcon = (isHealthy: boolean) => {
    return isHealthy ? '✅' : '❌';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Connection Health Dashboard</h1>
      
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
        <div className="flex items-center justify-between">
          <ConnectionStatusIndicator />
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Last successful: {new Date(connectionHealth.lastSuccessfulConnection).toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-600">
              Retry count: {connectionHealth.retryCount}
            </p>
          </div>
        </div>
      </div>

      {/* Error Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Error Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{errorSummary.totalErrors}</p>
            <p className="text-sm text-gray-600">Total Errors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{errorSummary.unresolvedErrors}</p>
            <p className="text-sm text-gray-600">Unresolved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{errorSummary.recentErrors}</p>
            <p className="text-sm text-gray-600">Recent (5min)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{errorSummary.errorRate.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Errors/min</p>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <span className={`text-lg font-semibold ${getHealthColor(errorSummary.isHealthy)}`}>
            {getHealthIcon(errorSummary.isHealthy)} 
            {errorSummary.isHealthy ? 'System Healthy' : 'System Issues Detected'}
          </span>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Errors</h2>
          <button 
            onClick={() => {
              ErrorReporter.clearLogs();
              setRecentErrors([]);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear Logs
          </button>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentErrors.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent errors</p>
          ) : (
            recentErrors.map((error, index) => (
              <div key={index} className="border rounded p-3 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{error.operation}</p>
                    <p className="text-gray-600">{error.error}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{error.timestamp}</p>
                    <p>Retry: {error.retryCount}</p>
                    <p className={error.resolved ? 'text-green-600' : 'text-red-600'}>
                      {error.resolved ? 'Resolved' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
