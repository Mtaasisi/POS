import React, { useState, useEffect, useCallback } from 'react';
import { useInventoryStore } from '../stores/useInventoryStore';
import { getLatsProvider } from '../lib/data/provider';

interface PerformanceMetrics {
  loadTime: number;
  dataSize: number;
  cacheHitRate: number;
  errorRate: number;
}

const PerformanceOptimizer: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    dataSize: 0,
    cacheHitRate: 0,
    errorRate: 0
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const { 
    products, 
    isLoading, 
    loadProducts,
    dataCache,
    cacheTimestamp,
    CACHE_DURATION
  } = useInventoryStore();

  // Monitor performance metrics
  const measurePerformance = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      await loadProducts({ limit: 20 }); // Load small batch for testing
      const endTime = performance.now();
      
      setMetrics(prev => ({
        ...prev,
        loadTime: endTime - startTime,
        dataSize: products.length,
        cacheHitRate: dataCache.products ? 100 : 0,
        errorRate: 0
      }));
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        errorRate: 100
      }));
    }
  }, [loadProducts, products.length, dataCache.products]);

  // Generate performance recommendations
  const generateRecommendations = useCallback(() => {
    const newRecommendations: string[] = [];
    
    if (metrics.loadTime > 2000) {
      newRecommendations.push('⚠️ Load time is slow (>2s). Consider implementing server-side pagination.');
    }
    
    if (metrics.dataSize > 100) {
      newRecommendations.push('📊 Large dataset detected. Enable pagination to improve performance.');
    }
    
    if (metrics.cacheHitRate < 50) {
      newRecommendations.push('💾 Low cache hit rate. Consider increasing cache duration.');
    }
    
    if (metrics.errorRate > 0) {
      newRecommendations.push('❌ Errors detected. Check network connection and database status.');
    }
    
    setRecommendations(newRecommendations);
  }, [metrics]);

  // Optimize database queries
  const optimizeQueries = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      console.log('🔧 Running database optimizations...');
      
      // Test different batch sizes
      const batchSizes = [10, 20, 50, 100];
      const results = [];
      
      for (const size of batchSizes) {
        const startTime = performance.now();
        await loadProducts({ limit: size });
        const endTime = performance.now();
        
        results.push({
          batchSize: size,
          loadTime: endTime - startTime
        });
      }
      
      // Find optimal batch size
      const optimalBatch = results.reduce((min, current) => 
        current.loadTime < min.loadTime ? current : min
      );
      
      console.log('✅ Optimal batch size:', optimalBatch.batchSize, 'items');
      console.log('⏱️ Load time:', optimalBatch.loadTime.toFixed(2), 'ms');
      
      setRecommendations(prev => [
        ...prev,
        `🎯 Recommended batch size: ${optimalBatch.batchSize} items`
      ]);
      
    } catch (error) {
      console.error('❌ Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [loadProducts]);

  // Clear cache
  const clearCache = useCallback(() => {
    console.log('🧹 Clearing cache...');
    // This would need to be implemented in the store
    setMetrics(prev => ({ ...prev, cacheHitRate: 0 }));
  }, []);

  useEffect(() => {
    measurePerformance();
  }, [measurePerformance]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Monitor</h3>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm text-gray-600">Load Time</div>
          <div className="text-lg font-semibold">
            {metrics.loadTime > 0 ? `${metrics.loadTime.toFixed(0)}ms` : 'N/A'}
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded">
          <div className="text-sm text-gray-600">Data Size</div>
          <div className="text-lg font-semibold">{metrics.dataSize}</div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded">
          <div className="text-sm text-gray-600">Cache Hit Rate</div>
          <div className="text-lg font-semibold">{metrics.cacheHitRate}%</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded">
          <div className="text-sm text-gray-600">Error Rate</div>
          <div className="text-lg font-semibold">{metrics.errorRate}%</div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Recommendations:</h4>
          <ul className="space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-gray-700">{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={measurePerformance}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Measure Performance'}
        </button>
        
        <button
          onClick={optimizeQueries}
          disabled={isOptimizing}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize Queries'}
        </button>
        
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Clear Cache
        </button>
      </div>

      {/* Cache Status */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">
          Cache Status: {dataCache.products ? 'Active' : 'Empty'}
        </div>
        <div className="text-sm text-gray-600">
          Cache Age: {cacheTimestamp ? `${Math.round((Date.now() - cacheTimestamp) / 1000)}s` : 'N/A'}
        </div>
        <div className="text-sm text-gray-600">
          Cache Duration: {Math.round(CACHE_DURATION / 1000)}s
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizer;
