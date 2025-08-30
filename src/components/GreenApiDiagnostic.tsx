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
  Code,
  Activity,
  Info
} from 'lucide-react';
import { greenApiService } from '../services/greenApiService';
import { toast } from '../lib/toastUtils';

interface GreenApiDiagnosticProps {
  instances: any[];
  isDark: boolean;
}

const GreenApiDiagnostic: React.FC<GreenApiDiagnosticProps> = ({
  instances,
  isDark
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsChecking(true);
    setLastError(null);
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
          greenApiHost: instance.green_api_host || 'https://api.green-api.com',
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
      setLastError(error.message);
      toast.error('Diagnostics failed');
    } finally {
      setIsChecking(false);
    }
  };

  const testMessageSending = async () => {
    if (!instances || instances.length === 0) {
      toast.error('No WhatsApp instances available');
      return;
    }

    const activeInstance = instances.find(instance => instance.status === 'connected');
    if (!activeInstance) {
      toast.error('No connected WhatsApp instance found');
      return;
    }

    try {
      const testMessage = {
        instanceId: activeInstance.instance_id,
        chatId: '+255769601663', // Test number from logs
        message: '🔧 Test message from diagnostic tool - ' + new Date().toLocaleTimeString(),
        messageType: 'text' as const
      };

      console.log('🧪 Sending test message:', testMessage);
      await greenApiService.sendMessage(testMessage);
      toast.success('Test message sent successfully!');
    } catch (error: any) {
      console.error('❌ Test message failed:', error);
      setLastError(`Test message failed: ${error.message}`);
      toast.error(`Test message failed: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
        return 'text-green-500';
      case 'failed':
      case 'error':
        return 'text-red-500';
      case 'disconnected':
        return 'text-orange-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-xl border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            GreenAPI Diagnostics
          </h2>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isChecking}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            isChecking 
              ? 'bg-gray-400 cursor-not-allowed' 
              : isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isChecking ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
          <span>{isChecking ? 'Running...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {lastError && (
        <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-300">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">Error:</span>
            <span className="text-red-600">{lastError}</span>
          </div>
        </div>
      )}

      {diagnosticResults && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnosticResults.overallStatus)}
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Overall Status
                  </h3>
                  <p className={`text-sm ${getStatusColor(diagnosticResults.overallStatus)}`}>
                    {diagnosticResults.overallStatus === 'healthy' && 'All systems operational'}
                    {diagnosticResults.overallStatus === 'disconnected' && 'WhatsApp instances disconnected'}
                    {diagnosticResults.overallStatus === 'error' && 'Connection errors detected'}
                    {diagnosticResults.overallStatus === 'no_instances' && 'No instances configured'}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {new Date(diagnosticResults.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Instance Details */}
          {diagnosticResults.instances.length > 0 && (
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Instance Details
              </h3>
              <div className="space-y-3">
                {diagnosticResults.instances.map((instance: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    isDark ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(instance.connectionTest)}
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Instance {instance.id}
                          </p>
                          <div className="flex items-center space-x-4 text-xs">
                            <span className={`${instance.apiToken === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                              API Token: {instance.apiToken}
                            </span>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              Status: {instance.status}
                            </span>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              Host: {instance.greenApiHost}
                            </span>
                          </div>
                        </div>
                      </div>
                      {instance.error && (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          {instance.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {diagnosticResults.recommendations.length > 0 && (
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                <Info className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Recommendations
                </h3>
              </div>
              <ul className="space-y-2">
                {diagnosticResults.recommendations.map((rec: string, index: number) => (
                  <li key={index} className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Test Actions */}
          <div className="flex space-x-3">
            <button
              onClick={testMessageSending}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Test Message</span>
            </button>
          </div>
        </div>
      )}

      {!diagnosticResults && !isChecking && (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Click "Run Diagnostics" to check your GreenAPI configuration</p>
        </div>
      )}
    </div>
  );
};

export default GreenApiDiagnostic;
