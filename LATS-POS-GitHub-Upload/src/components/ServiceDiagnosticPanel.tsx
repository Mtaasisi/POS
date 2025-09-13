import React, { useState, useEffect } from 'react';
import { serviceStatusChecker, SystemStatus, ServiceStatus } from '../utils/serviceStatusChecker';

interface ServiceDiagnosticPanelProps {
  onClose?: () => void;
}

const ServiceDiagnosticPanel: React.FC<ServiceDiagnosticPanelProps> = ({ onClose }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      setLoading(true);
      const status = await serviceStatusChecker.getSystemStatus();
      setSystemStatus(status);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to check system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'unhealthy': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '❌';
      default: return '⚠️';
    }
  };

  const renderServiceCard = (service: ServiceStatus) => (
    <div key={service.service} className="bg-white rounded-lg border p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{service.service}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
          {getStatusIcon(service.status)} {service.status}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        Last checked: {new Date(service.lastCheck).toLocaleTimeString()}
      </div>
      
      {service.error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          <strong>Error:</strong> {service.error}
        </div>
      )}
      
      {service.details && (
        <div className="text-sm text-gray-600 mt-2">
          <strong>Details:</strong> {JSON.stringify(service.details, null, 2)}
        </div>
      )}
    </div>
  );

  const getFixSuggestions = () => {
    const suggestions: string[] = [];
    
    if (systemStatus) {
      if (systemStatus.        suggestions.push('• Ensure API tokens are valid and not expired');
      }
      
      if (systemStatus.ai.status === 'unhealthy') {
        suggestions.push('• Add VITE_GEMINI_API_KEY to environment variables');
        suggestions.push('• Check if AI service is enabled in configuration');
        suggestions.push('• Verify Gemini API quota and rate limits');
      }
      
      if (systemStatus.database.status === 'unhealthy') {
        suggestions.push('• Check Supabase connection settings');
        suggestions.push('• Verify database credentials and permissions');
        suggestions.push('• Ensure database tables exist and are accessible');
      }
      
      if (systemStatus.api.status === 'unhealthy') {
        suggestions.push('• Check API settings in database');
        suggestions.push('• Verify SMS provider configuration');
        suggestions.push('• Ensure API endpoints are accessible');
      }
    }
    
    return suggestions;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Service Diagnostic Panel</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={checkSystemStatus}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Refresh'}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className="p-6">
          {loading && !systemStatus ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Checking system status...</p>
            </div>
          ) : systemStatus ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderServiceCard(systemStatus.whatsapp)}
                {renderServiceCard(systemStatus.ai)}
                {renderServiceCard(systemStatus.database)}
                {renderServiceCard(systemStatus.api)}
              </div>

              {getFixSuggestions().length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">🔧 Suggested Fixes:</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {getFixSuggestions().map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📋 Quick Actions:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    onClick={() => window.open('/api/whatsapp-proxy-forgiving.php?action=getStateInstance', '_blank')}
                    className="text-left p-2 bg-white rounded border hover:bg-gray-50 text-sm"
                  >
                    Test };

export default ServiceDiagnosticPanel;
