import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../features/lats/stores/useInventoryStore';
import { getLatsProvider } from '../features/lats/lib/data/provider';

interface PerformanceMetrics {
  loadTime: number;
  supplierCount: number;
  cacheHit: boolean;
  timestamp: number;
}

const SupplierPerformanceMonitor: React.FC = () => {
  const { suppliers, loadSuppliers } = useInventoryStore();
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const runPerformanceTest = async () => {
    setIsMonitoring(true);
    const startTime = performance.now();
    
    try {
      await loadSuppliers();
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      const newMetric: PerformanceMetrics = {
        loadTime,
        supplierCount: suppliers.length,
        cacheHit: false, // This would need to be tracked in the store
        timestamp: Date.now()
      };
      
      setMetrics(prev => [...prev.slice(-9), newMetric]); // Keep last 10 metrics
      
      console.log(`🏢 Supplier Performance Test: ${loadTime.toFixed(2)}ms for ${suppliers.length} suppliers`);
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  const testDirectProvider = async () => {
    const startTime = performance.now();
    try {
      const provider = getLatsProvider();
      const response = await provider.getSuppliers();
      const endTime = performance.now();
      
      console.log(`🏢 Direct Provider Test: ${(endTime - startTime).toFixed(2)}ms`);
      console.log('Response:', response);
    } catch (error) {
      console.error('Direct provider test failed:', error);
    }
  };

  const averageLoadTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length 
    : 0;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🏢 Supplier Performance Monitor</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={runPerformanceTest}
            disabled={isMonitoring}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isMonitoring ? 'Testing...' : 'Run Performance Test'}
          </button>
          
          <button
            onClick={testDirectProvider}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Direct Provider
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">Current Suppliers</div>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">Avg Load Time</div>
            <div className="text-2xl font-bold">{averageLoadTime.toFixed(0)}ms</div>
          </div>
        </div>

        {metrics.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recent Performance History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {metrics.slice().reverse().map((metric, index) => (
                <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{new Date(metric.timestamp).toLocaleTimeString()}</span>
                  <span className="font-mono">{metric.loadTime.toFixed(0)}ms</span>
                  <span>{metric.supplierCount} suppliers</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>• Load times above 1000ms indicate performance issues</p>
          <p>• Check network tab for database query times</p>
          <p>• Consider implementing pagination for large datasets</p>
        </div>
      </div>
    </div>
  );
};

export default SupplierPerformanceMonitor;
