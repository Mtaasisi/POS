import React, { useState, useEffect } from 'react';
import { Clock, Zap, TrendingUp, Database } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface PerformanceMetrics {
  loadTime: number;
  searchTime: number;
  cacheHitRate: number;
  totalSuppliers: number;
  lastLoadTime: number;
}

const SupplierPerformanceMonitor: React.FC = () => {
  const { suppliers, lastDataLoadTime } = useInventoryStore();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    searchTime: 0,
    cacheHitRate: 0,
    totalSuppliers: 0,
    lastLoadTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update metrics when suppliers change
    setMetrics(prev => ({
      ...prev,
      totalSuppliers: suppliers.length,
      lastLoadTime: lastDataLoadTime
    }));
  }, [suppliers.length, lastDataLoadTime]);

  // Performance status
  const getPerformanceStatus = () => {
    if (metrics.loadTime < 500) return { status: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (metrics.loadTime < 1000) return { status: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'Slow', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const performanceStatus = getPerformanceStatus();

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Show Performance Monitor"
      >
        <Zap className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          Performance Monitor
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        {/* Performance Status */}
        <div className={`p-2 rounded-lg ${performanceStatus.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <span className={`text-sm font-semibold ${performanceStatus.color}`}>
              {performanceStatus.status}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">Load Time</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {metrics.loadTime}ms
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">Search Time</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {metrics.searchTime}ms
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Database className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">Suppliers</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {metrics.totalSuppliers}
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">Cache Hit</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {metrics.cacheHitRate}%
            </div>
          </div>
        </div>

        {/* Last Load Time */}
        {metrics.lastLoadTime > 0 && (
          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date(metrics.lastLoadTime).toLocaleTimeString()}
          </div>
        )}

        {/* Performance Tips */}
        <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
          <div className="font-medium mb-1">💡 Performance Tips:</div>
          <ul className="space-y-1">
            <li>• Use search to find suppliers quickly</li>
            <li>• Cache is refreshed every 2 minutes</li>
            <li>• Results are limited to 20 for speed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SupplierPerformanceMonitor;
