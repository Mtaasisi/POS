import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/GlassCard';
import { Button } from '../ui/GlassButton';

interface DatabaseTableDiagnosticProps {
  className?: string;
}

const DatabaseTableDiagnostic: React.FC<DatabaseTableDiagnosticProps> = ({ className = '' }) => {
  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults([]);
    
    try {
      // Test 1: Check if table exists
      setDiagnosticResults(prev => [...prev, { type: 'info', message: '🔍 Testing table existence...' }]);
      
      try {
        const { data: tableExists, error: tableError } = await supabase
          .from('lats_product_variants')
          .select('count')
          .limit(1);
        
        if (tableError) {
          setDiagnosticResults(prev => [...prev, { 
            type: 'error', 
            message: `❌ Table access failed: ${tableError.message} (Code: ${tableError.code})` 
          }]);
        } else {
          setDiagnosticResults(prev => [...prev, { 
            type: 'success', 
            message: '✅ Table exists and is accessible' 
          }]);
        }
      } catch (error: any) {
        setDiagnosticResults(prev => [...prev, { 
          type: 'error', 
          message: `❌ Table existence check failed: ${error.message}` 
        }]);
      }

      // Test 2: Check table structure
      setDiagnosticResults(prev => [...prev, { type: 'info', message: '🔍 Checking table structure...' }]);
      
      try {
        const { data: structure, error: structureError } = await supabase
          .rpc('get_table_columns', { table_name: 'lats_product_variants' });
        
        if (structureError) {
          setDiagnosticResults(prev => [...prev, { 
            type: 'error', 
            message: `❌ Structure check failed: ${structureError.message}` 
          }]);
        } else {
          setDiagnosticResults(prev => [...prev, { 
            type: 'success', 
            message: `✅ Table structure: ${JSON.stringify(structure)}` 
          }]);
        }
      } catch (error: any) {
        setDiagnosticResults(prev => [...prev, { 
          type: 'error', 
          message: `❌ Structure check exception: ${error.message}` 
        }]);
      }

      // Test 3: Check if there are any products
      setDiagnosticResults(prev => [...prev, { type: 'info', message: '🔍 Checking for products...' }]);
      
      try {
        const { data: products, error: productsError } = await supabase
          .from('lats_products')
          .select('id, name')
          .limit(5);
        
        if (productsError) {
          setDiagnosticResults(prev => [...prev, { 
            type: 'error', 
            message: `❌ Products query failed: ${productsError.message}` 
          }]);
        } else {
          setDiagnosticResults(prev => [...prev, { 
            type: 'success', 
            message: `✅ Found ${products?.length || 0} products` 
          }]);
          
          if (products && products.length > 0) {
            setDiagnosticResults(prev => [...prev, { 
              type: 'info', 
              message: `📋 Sample product IDs: ${products.map(p => p.id).join(', ')}` 
            }]);
          }
        }
      } catch (error: any) {
        setDiagnosticResults(prev => [...prev, { 
          type: 'error', 
          message: `❌ Products check exception: ${error.message}` 
        }]);
      }

      // Test 4: Try a simple variant query without any filters
      setDiagnosticResults(prev => [...prev, { type: 'info', message: '🔍 Testing basic variant query...' }]);
      
      try {
        const { data: variants, error: variantsError } = await supabase
          .from('lats_product_variants')
          .select('id, product_id, name, sku')
          .limit(1);
        
        if (variantsError) {
          setDiagnosticResults(prev => [...prev, { 
            type: 'error', 
            message: `❌ Basic variant query failed: ${variantsError.message} (Code: ${variantsError.code})` 
          }]);
        } else {
          setDiagnosticResults(prev => [...prev, { 
            type: 'success', 
            message: `✅ Basic variant query succeeded: ${variants?.length || 0} variants found` 
          }]);
        }
      } catch (error: any) {
        setDiagnosticResults(prev => [...prev, { 
          type: 'error', 
          message: `❌ Basic variant query exception: ${error.message}` 
        }]);
      }

      // Test 5: Check RLS policies
      setDiagnosticResults(prev => [...prev, { type: 'info', message: '🔍 Checking RLS policies...' }]);
      
      try {
        const { data: policies, error: policiesError } = await supabase
          .rpc('get_table_policies', { table_name: 'lats_product_variants' });
        
        if (policiesError) {
          setDiagnosticResults(prev => [...prev, { 
            type: 'error', 
            message: `❌ RLS check failed: ${policiesError.message}` 
          }]);
        } else {
          setDiagnosticResults(prev => [...prev, { 
            type: 'success', 
            message: `✅ RLS policies: ${JSON.stringify(policies)}` 
          }]);
        }
      } catch (error: any) {
        setDiagnosticResults(prev => [...prev, { 
          type: 'error', 
          message: `❌ RLS check exception: ${error.message}` 
        }]);
      }

      // Test 6: Check authentication status
      setDiagnosticResults(prev => [...prev, { type: 'info', message: '🔍 Checking authentication...' }]);
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setDiagnosticResults(prev => [...prev, { 
            type: 'error', 
            message: `❌ Authentication check failed: ${authError.message}` 
          }]);
        } else {
          setDiagnosticResults(prev => [...prev, { 
            type: 'success', 
            message: `✅ Authentication: ${user ? `Logged in as ${user.email}` : 'Not authenticated'}` 
          }]);
        }
      } catch (error: any) {
        setDiagnosticResults(prev => [...prev, { 
          type: 'error', 
          message: `❌ Authentication check exception: ${error.message}` 
        }]);
      }

    } catch (error: any) {
      setDiagnosticResults(prev => [...prev, { type: 'error', message: `❌ Diagnostic failed: ${error.message}` }]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setDiagnosticResults([]);
  };

  return (
    <Card className={`max-w-4xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Database Table Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isRunning ? 'Running Diagnostic...' : 'Run Database Diagnostic'}
            </Button>
            <Button 
              onClick={clearResults} 
              disabled={isRunning}
              variant="outline"
            >
              Clear Results
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {diagnosticResults.map((result, index) => (
              <div 
                key={index}
                className={`p-2 rounded text-sm ${
                  result.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  result.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {result.message}
              </div>
            ))}
          </div>

          {diagnosticResults.length === 0 && !isRunning && (
            <div className="text-gray-500 text-sm">
              Click "Run Database Diagnostic" to check table structure, RLS policies, and authentication status.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTableDiagnostic;
