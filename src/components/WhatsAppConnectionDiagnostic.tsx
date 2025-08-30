import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  MessageCircle,
  Wifi,
  WifiOff,
  Database,
  Info
} from 'lucide-react';
import { greenApiService } from '../services/greenApiService';
import { toast } from '../lib/toastUtils';

interface WhatsAppConnectionDiagnosticProps {
  instances: any[];
  isDark: boolean;
}

const WhatsAppConnectionDiagnostic: React.FC<WhatsAppConnectionDiagnosticProps> = ({
  instances,
  isDark
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsChecking(true);
    setDiagnosticResults(null);

    try {
      const results = {
        timestamp: new Date().toISOString(),
        instances: [],
        overallStatus: 'unknown',
        recommendations: []
      };

      if (!instances || instances.length === 0) {
        results.overallStatus = 'no_instances';
        results.recommendations.push('No WhatsApp instances found. Please set up a WhatsApp instance first.');
        setDiagnosticResults(results);
        return;
      }

      for (const instance of instances) {
        const instanceResult = {
          id: instance.instance_id,
          status: instance.status,
          apiToken: instance.api_token ? 'Present' : 'Missing',
          connectionTest: 'pending',
          error: null
        };

        try {
          // Test connection
          const isConnected = await greenApiService.checkInstanceConnection(instance.instance_id);
          instanceResult.connectionTest = isConnected ? 'success' : 'failed';
          
          if (!isConnected) {
            instanceResult.error = 'Instance not authorized';
            results.recommendations.push(`Instance ${instance.instance_id}: Check if WhatsApp is connected and authorized`);
          }
        } catch (error: any) {
          instanceResult.connectionTest = 'error';
          instanceResult.error = error.message;
          results.recommendations.push(`Instance ${instance.instance_id}: ${error.message}`);
        }

        results.instances.push(instanceResult);
      }

      // Determine overall status
      const connectedInstances = results.instances.filter(i => i.connectionTest === 'success');
      if (connectedInstances.length > 0) {
        results.overallStatus = 'healthy';
      } else if (results.instances.some(i => i.connectionTest === 'failed')) {
        results.overallStatus = 'disconnected';
      } else {
        results.overallStatus = 'error';
      }

      setDiagnosticResults(results);
      toast.success('Diagnostics completed');
    } catch (error: any) {
      console.error('❌ Diagnostic error:', error);
      toast.error('Diagnostics failed');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">WhatsApp Connection Diagnostics</h2>
        <p className="text-gray-600">Check the status of your WhatsApp instances and identify connection issues</p>
      </div>

      {/* Run Diagnostics Button */}
      <div className="text-center">
        <button
          onClick={runDiagnostics}
          disabled={isChecking}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
          {isChecking ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Results */}
      {diagnosticResults && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border ${
            diagnosticResults.overallStatus === 'healthy' ? 'bg-green-50 border-green-200' :
            diagnosticResults.overallStatus === 'disconnected' ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {diagnosticResults.overallStatus === 'healthy' ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : diagnosticResults.overallStatus === 'disconnected' ? (
                <AlertTriangle className="text-yellow-500" size={20} />
              ) : (
                <XCircle className="text-red-500" size={20} />
              )}
              <div>
                <h3 className="font-semibold text-gray-800">
                  {diagnosticResults.overallStatus === 'healthy' && 'All instances connected'}
                  {diagnosticResults.overallStatus === 'disconnected' && 'Some instances disconnected'}
                  {diagnosticResults.overallStatus === 'error' && 'Connection errors detected'}
                  {diagnosticResults.overallStatus === 'no_instances' && 'No instances found'}
                </h3>
                <p className="text-sm text-gray-600">
                  {diagnosticResults.instances.length} instance(s) checked
                </p>
              </div>
            </div>
          </div>

          {/* Instance Details */}
          {diagnosticResults.instances.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Instance Details</h3>
              {diagnosticResults.instances.map((instance: any) => (
                <div key={instance.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">Instance {instance.id}</h4>
                      <p className="text-sm text-gray-500">Status: {instance.status}</p>
                      <p className="text-sm text-gray-500">API Token: {instance.apiToken}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {instance.connectionTest === 'success' ? (
                        <CheckCircle className="text-green-500" size={16} />
                      ) : instance.connectionTest === 'failed' ? (
                        <XCircle className="text-red-500" size={16} />
                      ) : (
                        <AlertTriangle className="text-yellow-500" size={16} />
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        instance.connectionTest === 'success' ? 'bg-green-100 text-green-800' :
                        instance.connectionTest === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {instance.connectionTest === 'success' ? 'Connected' :
                         instance.connectionTest === 'failed' ? 'Disconnected' : 'Error'}
                      </span>
                    </div>
                  </div>
                  {instance.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {instance.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {diagnosticResults.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Info size={16} />
                Recommendations
              </h3>
              <ul className="space-y-1">
                {diagnosticResults.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.location.href = '/lats/whatsapp-hub'}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Settings size={14} />
                Manage Instances
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnectionDiagnostic;
