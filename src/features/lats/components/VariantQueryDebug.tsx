import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/GlassCard';
import { Button } from '../ui/GlassButton';

interface VariantQueryDebugProps {
  className?: string;
}

const VariantQueryDebug: React.FC<VariantQueryDebugProps> = ({ className = '' }) => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runVariantQueryTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // First, get some product IDs to test with
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select('id')
        .limit(25);
      
      if (productsError) {
        setTestResults(prev => [...prev, { type: 'error', message: `Failed to get products: ${productsError.message}` }]);
        return;
      }

      const productIds = products?.map(p => p.id) || [];
      setTestResults(prev => [...prev, { type: 'info', message: `Testing with ${productIds.length} product IDs` }]);

      // Test different batch sizes
      const batchSizes = [5, 10, 15, 20];
      
      for (const batchSize of batchSizes) {
        setTestResults(prev => [...prev, { type: 'info', message: `Testing batch size: ${batchSize}` }]);
        
        try {
          const batch = productIds.slice(0, batchSize);
          const startTime = Date.now();
          
          const { data: variants, error } = await supabase
            .from('lats_product_variants')
            .select('id, product_id, name, sku, cost_price, selling_price, quantity')
            .in('product_id', batch)
            .order('selling_price', { ascending: true });

          const endTime = Date.now();
          const duration = endTime - startTime;

          if (error) {
            setTestResults(prev => [...prev, { 
              type: 'error', 
              message: `Batch size ${batchSize} failed: ${error.message} (${duration}ms)` 
            }]);
          } else {
            setTestResults(prev => [...prev, { 
              type: 'success', 
              message: `Batch size ${batchSize} succeeded: ${variants?.length || 0} variants (${duration}ms)` 
            }]);
          }
        } catch (error: any) {
          setTestResults(prev => [...prev, { 
            type: 'error', 
            message: `Batch size ${batchSize} exception: ${error.message}` 
          }]);
        }
      }

      // Test individual queries as fallback
      setTestResults(prev => [...prev, { type: 'info', message: 'Testing individual queries...' }]);
      let individualSuccess = 0;
      let individualErrors = 0;
      
      for (const productId of productIds.slice(0, 10)) {
        try {
          const { data: variants, error } = await supabase
            .from('lats_product_variants')
            .select('id, product_id, name, sku, cost_price, selling_price, quantity')
            .eq('product_id', productId)
            .order('selling_price', { ascending: true });

          if (error) {
            individualErrors++;
          } else {
            individualSuccess++;
          }
        } catch (error) {
          individualErrors++;
        }
      }

      setTestResults(prev => [...prev, { 
        type: 'success', 
        message: `Individual queries: ${individualSuccess} success, ${individualErrors} errors` 
      }]);

    } catch (error: any) {
      setTestResults(prev => [...prev, { type: 'error', message: `Test failed: ${error.message}` }]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className={`max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Variant Query Debug
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runVariantQueryTest} 
              disabled={isRunning}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isRunning ? 'Running Tests...' : 'Run Variant Query Test'}
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
            {testResults.map((result, index) => (
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

          {testResults.length === 0 && !isRunning && (
            <div className="text-gray-500 text-sm">
              Click "Run Variant Query Test" to test different batch sizes and verify the fix.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VariantQueryDebug;
