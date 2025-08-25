import React, { useState } from 'react';
import { greenApiService } from '../services/greenApiService';
import { toast } from '../lib/toastUtils';

const GreenApiTestPage: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [instanceId, setInstanceId] = useState('');
  const [apiToken, setApiToken] = useState('');

  const testConnection = async () => {
    setIsTesting(true);
    try {
      console.log('🧪 Testing Green API connection...');
      
      const diagnosis = await greenApiService.diagnoseConnectionIssues();
      setResults(diagnosis);
      
      console.log('✅ Connection test completed:', diagnosis);
      
      // Show summary
      const workingMethods = [
        diagnosis.proxyTest.success && 'Netlify Proxy',
        diagnosis.phpProxyTest.success && 'PHP Proxy',
        diagnosis.netlifyTest.success && 'Netlify Function',
        diagnosis.directTest.success && 'Direct API'
      ].filter(Boolean);
      
      if (workingMethods.length > 0) {
        toast.success(`Connection test complete. Working: ${workingMethods.join(', ')}`);
      } else {
        toast.error('No connection methods are working. Check the results below.');
      }
      
    } catch (error: any) {
      console.error('❌ Test error:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testInstance = async () => {
    if (!instanceId || !apiToken) {
      toast.error('Please enter both Instance ID and API Token');
      return;
    }

    setIsTesting(true);
    try {
      console.log(`🧪 Testing instance: ${instanceId}`);
      
      const isConnected = await greenApiService.checkInstanceConnection(instanceId);
      
      setResults({
        instanceTest: {
          success: isConnected,
          message: isConnected ? 'Instance is connected and authorized' : 'Instance is not connected'
        }
      });
      
      if (isConnected) {
        toast.success('Instance is connected and working!');
      } else {
        toast.error('Instance is not connected. Check your credentials.');
      }
      
    } catch (error: any) {
      console.error('❌ Instance test error:', error);
      toast.error(`Instance test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Green API Connection Test</h1>
          <p className="text-gray-600">
            Quick test to check if your Green API connection is working properly.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Connection Methods</h2>
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test All Connection Methods'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Specific Instance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Instance ID</label>
              <input
                type="text"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder="Enter your instance ID"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Token</label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Enter your API token"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={testInstance}
            disabled={isTesting || !instanceId || !apiToken}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isTesting ? 'Testing Instance...' : 'Test Instance Connection'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            {results.instanceTest ? (
              <div className={`p-4 rounded ${results.instanceTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h3 className="font-medium">Instance Test</h3>
                <p className="text-sm">{results.instanceTest.success ? '✅ Success' : '❌ Failed'}</p>
                <p className="text-sm text-gray-600 mt-1">{results.instanceTest.message}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded ${results.proxyTest?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h3 className="font-medium">Netlify Proxy</h3>
                    <p className="text-sm">{results.proxyTest?.success ? '✅ Working' : '❌ Failed'}</p>
                    {results.proxyTest?.error && (
                      <p className="text-xs text-red-600 mt-1">{results.proxyTest.error}</p>
                    )}
                  </div>
                  
                  <div className={`p-4 rounded ${results.phpProxyTest?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h3 className="font-medium">PHP Proxy</h3>
                    <p className="text-sm">{results.phpProxyTest?.success ? '✅ Working' : '❌ Failed'}</p>
                    {results.phpProxyTest?.error && (
                      <p className="text-xs text-red-600 mt-1">{results.phpProxyTest.error}</p>
                    )}
                  </div>
                  
                  <div className={`p-4 rounded ${results.netlifyTest?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h3 className="font-medium">Netlify Function</h3>
                    <p className="text-sm">{results.netlifyTest?.success ? '✅ Working' : '❌ Failed'}</p>
                    {results.netlifyTest?.error && (
                      <p className="text-xs text-red-600 mt-1">{results.netlifyTest.error}</p>
                    )}
                  </div>
                  
                  <div className={`p-4 rounded ${results.directTest?.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h3 className="font-medium">Direct Green API</h3>
                    <p className="text-sm">{results.directTest?.success ? '✅ Working' : '❌ Failed'}</p>
                    {results.directTest?.error && (
                      <p className="text-xs text-red-600 mt-1">{results.directTest.error}</p>
                    )}
                  </div>
                </div>

                {results.recommendations && results.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded">
                    <h3 className="font-medium mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {results.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Quick Fixes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• If you see "Proxy request failed", try the diagnostic tool above</li>
            <li>• If all proxies fail but direct API works, there's a proxy configuration issue</li>
            <li>• If nothing works, check your internet connection and Green API service status</li>
            <li>• For production issues, ensure your Netlify site is properly deployed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GreenApiTestPage;
