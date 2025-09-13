import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getLatsProvider } from '../features/lats/lib/data/provider';

const SupplierDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runDebugTests = async () => {
      const info: any = {};

      // Test 1: Environment Variables
      info.environment = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        VITE_LATS_DATA_MODE: import.meta.env.VITE_LATS_DATA_MODE || 'supabase',
      };

      // Test 2: Provider Configuration
      try {
        const provider = getLatsProvider();
        info.provider = {
          type: provider.constructor.name,
          hasGetSuppliers: typeof provider.getSuppliers === 'function',
        };
      } catch (error) {
        info.provider = { error: error.message };
      }

      // Test 3: Direct Supabase Access
      try {
        const { data, error } = await supabase
          .from('lats_suppliers')
          .select('*')
          .limit(5);

        info.directSupabase = {
          success: !error,
          error: error?.message,
          count: data?.length || 0,
        };
      } catch (error) {
        info.directSupabase = { error: error.message };
      }

      // Test 4: Provider Method Test
      try {
        const provider = getLatsProvider();
        const response = await provider.getSuppliers();
        
        info.providerTest = {
          success: response.ok,
          error: response.message,
          count: response.data?.length || 0,
        };
      } catch (error) {
        info.providerTest = { error: error.message };
      }

      // Test 5: Authentication Status
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        info.auth = {
          authenticated: !!user,
          user: user?.email,
          error: error?.message,
        };
      } catch (error) {
        info.auth = { error: error.message };
      }

      setDebugInfo(info);
      setIsLoading(false);
    };

    runDebugTests();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800">🔍 Debugging Suppliers...</h3>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">
        🔍 Supplier Debugger (Remove after fixing)
      </h3>
      
      <div className="space-y-3 text-sm">
        <div>
          <strong>Environment Variables:</strong>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(debugInfo.environment, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Provider Configuration:</strong>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(debugInfo.provider, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Direct Supabase Test:</strong>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(debugInfo.directSupabase, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Provider Method Test:</strong>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(debugInfo.providerTest, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Authentication Status:</strong>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(debugInfo.auth, null, 2)}
          </pre>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <strong>Quick Actions:</strong>
          <div className="mt-2 space-y-1">
            <button
              onClick={() => window.location.reload()}
              className="block w-full text-left px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs"
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => {
                console.log('Debug Info:', debugInfo);
                alert('Debug info logged to console');
              }}
              className="block w-full text-left px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs"
            >
              📋 Log to Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDebugger;
