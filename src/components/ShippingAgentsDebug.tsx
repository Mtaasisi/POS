import React, { useState, useEffect } from 'react';
import { supabaseProvider } from '../features/lats/lib/data/provider.supabase';

const ShippingAgentsDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testShippingAgents = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      console.log('🔍 Starting shipping agents debug test...');
      
      // Test the provider method
      const response = await supabaseProvider.getShippingAgents();
      
      const debugData = {
        timestamp: new Date().toISOString(),
        response: response,
        success: response.ok,
        dataLength: response.data?.length || 0,
        message: response.message || 'No message'
      };

      setDebugInfo(debugData);
      console.log('📊 Debug result:', debugData);

    } catch (error) {
      const errorData = {
        timestamp: new Date().toISOString(),
        error: error,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setDebugInfo(errorData);
      console.error('❌ Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testShippingAgents();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🚢 Shipping Agents Debug</h3>
      
      <button 
        onClick={testShippingAgents}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Shipping Agents'}
      </button>

      {debugInfo && (
        <div className="mt-4 p-4 bg-white border rounded">
          <h4 className="font-semibold mb-2">Debug Results:</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
            <div><strong>Success:</strong> {debugInfo.success ? '✅' : '❌'}</div>
            <div><strong>Data Length:</strong> {debugInfo.dataLength}</div>
            <div><strong>Message:</strong> {debugInfo.message}</div>
            {debugInfo.response && (
              <div>
                <strong>Full Response:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.response, null, 2)}
                </pre>
              </div>
            )}
            {debugInfo.error && (
              <div>
                <strong>Error:</strong>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingAgentsDebug;
