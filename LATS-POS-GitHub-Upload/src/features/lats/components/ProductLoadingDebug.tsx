import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '../stores/useInventoryStore';

const ProductLoadingDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    products, 
    isLoading: storeLoading, 
    error,
    loadProducts,
    dataCache,
    cacheTimestamp,
    CACHE_DURATION
  } = useInventoryStore();

  const testProductLoading = async () => {
    setIsLoading(true);
    setDebugInfo({});
    
    try {
      console.log('🔧 Debug: Starting product loading test...');
      
      const startTime = performance.now();
      await loadProducts({ page: 1, limit: 10 });
      const endTime = performance.now();
      
      setDebugInfo({
        loadTime: endTime - startTime,
        productsCount: products.length,
        hasError: !!error,
        errorMessage: error,
        cacheStatus: dataCache.products ? 'Active' : 'Empty',
        cacheAge: cacheTimestamp ? Math.round((Date.now() - cacheTimestamp) / 1000) : 'N/A',
        cacheDuration: Math.round(CACHE_DURATION / 1000)
      });
      
      console.log('✅ Debug: Product loading test completed');
      
    } catch (error) {
      console.error('❌ Debug: Product loading test failed:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run test on component mount
    testProductLoading();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Product Loading Debug</h3>
      
      <div className="space-y-4">
        {/* Current State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">Store Loading</div>
            <div className="text-lg font-semibold">
              {storeLoading ? '🔄 Loading...' : '✅ Idle'}
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-600">Products Count</div>
            <div className="text-lg font-semibold">{products.length}</div>
          </div>
          
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm text-gray-600">Error Status</div>
            <div className="text-lg font-semibold">
              {error ? '❌ Error' : '✅ No Error'}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-sm text-gray-600">Cache Status</div>
            <div className="text-lg font-semibold">
              {dataCache.products ? '💾 Active' : '📭 Empty'}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {Object.keys(debugInfo).length > 0 && (
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium mb-2">Debug Information:</h4>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <h4 className="font-medium text-red-800 mb-2">Error:</h4>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={testProductLoading}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Product Loading'}
          </button>
          
          <button
            onClick={() => {
              console.log('📊 Current store state:', {
                products: products.length,
                isLoading: storeLoading,
                error,
                cache: dataCache.products ? 'Active' : 'Empty'
              });
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Log State
          </button>
        </div>

        {/* Sample Products */}
        {products.length > 0 && (
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-medium mb-2">Sample Products:</h4>
            <div className="space-y-2">
              {products.slice(0, 3).map((product, index) => (
                <div key={product.id} className="text-sm">
                  <strong>{index + 1}.</strong> {product.name} (ID: {product.id.substring(0, 8)}...)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductLoadingDebug;
