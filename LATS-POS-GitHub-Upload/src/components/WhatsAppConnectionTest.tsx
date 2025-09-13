import React, { useState, useEffect } from 'react';
import { greenApiService } from '../services/greenApiService';
import { testSupabaseConnection } from '../lib/supabaseClient';

interface ConnectionTestResult {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

const WhatsAppConnectionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ConnectionTestResult[]>([]);
  const [instances, setInstances] = useState<any[]>([]);

  const addResult = (type: 'success' | 'error' | 'info', message: string) => {
    setResults(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    addResult('info', '🔍 Testing Supabase connection...');
    
    try {
      const result = await testSupabaseConnection();
      if (result.success) {
        addResult('success', '✅ Supabase connection successful');
      } else {
        addResult('error', `❌ Supabase connection failed: ${result.error?.message}`);
      }
    } catch (error: any) {
      addResult('error', `❌ Supabase connection error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testWhatsAppInstances = async () => {
    setIsLoading(true);
    addResult('info', '🔍 Testing WhatsApp instances fetch...');
    
    try {
      const instances = await greenApiService.getInstances();
      setInstances(instances);
      addResult('success', `✅ Successfully fetched ${instances.length} WhatsApp instances`);
      
      if (instances.length === 0) {
        addResult('info', 'ℹ️ No WhatsApp instances found. You may need to create one.');
      }
    } catch (error: any) {
      addResult('error', `❌ Failed to fetch WhatsApp instances: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    await testSupabaseConnection();
    await testWhatsAppInstances();
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runAllTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          WhatsApp Connection Diagnostics
        </h2>
        
        <div className="mb-6">
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg mr-4"
          >
            {isLoading ? '🔄 Testing...' : '🔄 Run All Tests'}
          </button>
          
          <button
            onClick={testSupabaseConnection}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg mr-4"
          >
            Test Supabase
          </button>
          
          <button
            onClick={testWhatsAppInstances}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
          >
            Test WhatsApp Instances
          </button>
        </div>

        {/* Test Results */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Test Results</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  result.type === 'success' ? 'bg-green-100 text-green-800' :
                  result.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span>{result.message}</span>
                  <span className="text-xs opacity-75">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Instances */}
        {instances.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              WhatsApp Instances ({instances.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {instances.map((instance) => (
                <div
                  key={instance.id}
                  className="bg-gray-50 p-4 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      {instance.phone_number}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        instance.status === 'connected' ? 'bg-green-100 text-green-800' :
                        instance.status === 'disconnected' ? 'bg-gray-100 text-gray-800' :
                        instance.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {instance.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>ID: {instance.instance_id}</div>
                    <div>Created: {new Date(instance.created_at).toLocaleDateString()}</div>
                    {instance.connection_error && (
                      <div className="text-red-600 mt-1">
                        Error: {instance.connection_error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Troubleshooting Tips */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Check your internet connection if you see "ERR_CONNECTION_CLOSED"</li>
            <li>• Verify your Supabase credentials are correct</li>
            <li>• Ensure the whatsapp_instances table exists and has proper RLS policies</li>
            <li>• Check browser console for additional error details</li>
            <li>• Try refreshing the page if connection issues persist</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConnectionTest;
