import React, { useState } from 'react';
import { greenApiService } from '../services/greenApiService';
import { toast } from '../lib/toastUtils';

const GreenApiDiagnostic: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [instanceId, setInstanceId] = useState('');
  const [apiToken, setApiToken] = useState('');

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      console.log('🔍 Starting Green API diagnostics...');
      
      // Run connection diagnosis
      const connectionDiagnosis = await greenApiService.diagnoseConnectionIssues();
      
      // Run RLS diagnosis
      const rlsDiagnosis = await greenApiService.diagnoseRLSIssues();
      
      // Test instance connection if provided
      let instanceTest = null;
      if (instanceId && apiToken) {
        try {
          const isConnected = await greenApiService.checkInstanceConnection(instanceId);
          instanceTest = {
            success: isConnected,
            message: isConnected ? 'Instance is connected' : 'Instance is not connected'
          };
        } catch (error: any) {
          instanceTest = {
            success: false,
            error: error.message
          };
        }
      }
      
      const fullDiagnosis = {
        timestamp: new Date().toISOString(),
        connection: connectionDiagnosis,
        rls: rlsDiagnosis,
        instance: instanceTest
      };
      
      setDiagnosis(fullDiagnosis);
      console.log('✅ Diagnostics completed:', fullDiagnosis);
      
      // Show summary toast
      const workingMethods = [
        connectionDiagnosis.proxyTest.success && 'Proxy',
        connectionDiagnosis.phpProxyTest.success && 'PHP Proxy',
        connectionDiagnosis.netlifyTest.success && 'Netlify Function',
        connectionDiagnosis.directTest.success && 'Direct API'
      ].filter(Boolean);
      
      if (workingMethods.length > 0) {
        toast.success(`Diagnostics complete. Working methods: ${workingMethods.join(', ')}`);
      } else {
        toast.error('No connection methods are working. Check the detailed results below.');
      }
      
    } catch (error: any) {
      console.error('❌ Diagnostic error:', error);
      toast.error(`Diagnostic failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetDiagnostics = () => {
    setDiagnosis(null);
    setInstanceId('');
    setApiToken('');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Green API Connection Diagnostic</h2>
      
      <div className="mb-6">
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
        
        {diagnosis && (
          <button
            onClick={resetDiagnostics}
            className="ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        )}
      </div>

      {/* Instance Test Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-semibold mb-3">Test Specific Instance (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Instance ID</label>
            <input
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="Enter instance ID"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter API token"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {diagnosis && (
        <div className="space-y-6">
          {/* Connection Tests */}
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold mb-3">Connection Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-3 rounded ${diagnosis.connection.proxyTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-medium">Proxy Connection</h4>
                <p className="text-sm">{diagnosis.connection.proxyTest.success ? '✅ Working' : '❌ Failed'}</p>
                {diagnosis.connection.proxyTest.error && (
                  <p className="text-xs text-red-600 mt-1">{diagnosis.connection.proxyTest.error}</p>
                )}
              </div>
              
              <div className={`p-3 rounded ${diagnosis.connection.phpProxyTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-medium">PHP Proxy</h4>
                <p className="text-sm">{diagnosis.connection.phpProxyTest.success ? '✅ Working' : '❌ Failed'}</p>
                {diagnosis.connection.phpProxyTest.error && (
                  <p className="text-xs text-red-600 mt-1">{diagnosis.connection.phpProxyTest.error}</p>
                )}
              </div>
              
              <div className={`p-3 rounded ${diagnosis.connection.netlifyTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-medium">Netlify Function</h4>
                <p className="text-sm">{diagnosis.connection.netlifyTest.success ? '✅ Working' : '❌ Failed'}</p>
                {diagnosis.connection.netlifyTest.error && (
                  <p className="text-xs text-red-600 mt-1">{diagnosis.connection.netlifyTest.error}</p>
                )}
              </div>
              
              <div className={`p-3 rounded ${diagnosis.connection.directTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-medium">Direct Green API</h4>
                <p className="text-sm">{diagnosis.connection.directTest.success ? '✅ Working' : '❌ Failed'}</p>
                {diagnosis.connection.directTest.error && (
                  <p className="text-xs text-red-600 mt-1">{diagnosis.connection.directTest.error}</p>
                )}
              </div>
            </div>
          </div>

          {/* RLS Tests */}
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold mb-3">Database Access (RLS)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-3 rounded ${diagnosis.rls.countQuery.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-medium">Count Query</h4>
                <p className="text-sm">{diagnosis.rls.countQuery.success ? '✅ Working' : '❌ Failed'}</p>
                {diagnosis.rls.countQuery.error && (
                  <p className="text-xs text-red-600 mt-1">{diagnosis.rls.countQuery.error}</p>
                )}
              </div>
              
              <div className={`p-3 rounded ${diagnosis.rls.instanceQuery.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-medium">Instance Query</h4>
                <p className="text-sm">{diagnosis.rls.instanceQuery.success ? '✅ Working' : '❌ Failed'}</p>
                {diagnosis.rls.instanceQuery.error && (
                  <p className="text-xs text-red-600 mt-1">{diagnosis.rls.instanceQuery.error}</p>
                )}
              </div>
            </div>
          </div>

          {/* Instance Test */}
          {diagnosis.instance && (
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-semibold mb-3">Instance Connection Test</h3>
              <div className={`p-3 rounded ${diagnosis.instance.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="font-medium">Instance Status</h4>
                <p className="text-sm">{diagnosis.instance.success ? '✅ Connected' : '❌ Not Connected'}</p>
                {diagnosis.instance.error && (
                  <p className="text-xs text-red-600 mt-1">{diagnosis.instance.error}</p>
                )}
                {diagnosis.instance.message && (
                  <p className="text-xs text-gray-600 mt-1">{diagnosis.instance.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
            <ul className="space-y-2">
              {diagnosis.connection.recommendations.map((rec: string, index: number) => (
                <li key={index} className="text-sm flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {rec}
                </li>
              ))}
              {diagnosis.rls.recommendations.map((rec: string, index: number) => (
                <li key={`rls-${index}`} className="text-sm flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Raw Data */}
          <details className="p-4 bg-gray-50 rounded">
            <summary className="cursor-pointer font-medium">Raw Diagnostic Data</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(diagnosis, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default GreenApiDiagnostic;
