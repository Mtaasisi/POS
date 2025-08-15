import React, { useState, useEffect } from 'react';
import { BarChart3, Image, Clock, HardDrive, TrendingUp, AlertTriangle } from 'lucide-react';
import { ThumbnailPerformanceMonitor } from '../../../../lib/thumbnailService';

interface ThumbnailAnalyticsProps {
  productId?: string;
  className?: string;
}

interface AnalyticsData {
  totalImages: number;
  totalThumbnails: number;
  averageProcessingTime: number;
  totalStorageUsed: number;
  compressionRatio: number;
  errorRate: number;
  recentActivity: Array<{
    timestamp: string;
    operation: string;
    duration: number;
    success: boolean;
  }>;
}

const ThumbnailAnalytics: React.FC<ThumbnailAnalyticsProps> = ({
  productId,
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalImages: 0,
    totalThumbnails: 0,
    averageProcessingTime: 0,
    totalStorageUsed: 0,
    compressionRatio: 0,
    errorRate: 0,
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [productId]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Get performance metrics
      const monitor = ThumbnailPerformanceMonitor.getInstance();
      const avgProcessingTime = monitor.getAverageTime('optimize');
      
      // Mock data - in real implementation, fetch from API
      const mockData: AnalyticsData = {
        totalImages: 24,
        totalThumbnails: 24,
        averageProcessingTime: avgProcessingTime,
        totalStorageUsed: 15.2, // MB
        compressionRatio: 68.5, // %
        errorRate: 2.1, // %
        recentActivity: [
          {
            timestamp: new Date().toISOString(),
            operation: 'thumbnail_creation',
            duration: 245,
            success: true
          },
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            operation: 'image_optimization',
            duration: 189,
            success: true
          },
          {
            timestamp: new Date(Date.now() - 120000).toISOString(),
            operation: 'upload',
            duration: 1200,
            success: false
          }
        ]
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error('Error loading thumbnail analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Thumbnail Analytics</h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Images</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{analytics.totalImages}</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Avg Processing</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {formatDuration(analytics.averageProcessingTime)}
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Storage Used</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{analytics.totalStorageUsed}MB</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Compression</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{analytics.compressionRatio}%</div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Error Rate */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Error Rate</span>
          </div>
          <div className="text-2xl font-bold text-red-900">{analytics.errorRate}%</div>
          <div className="text-xs text-red-700 mt-1">
            {analytics.errorRate < 5 ? 'Good' : analytics.errorRate < 10 ? 'Warning' : 'Critical'}
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            {(100 - analytics.errorRate).toFixed(1)}%
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            {(100 - analytics.errorRate) > 95 ? 'Excellent' : (100 - analytics.errorRate) > 90 ? 'Good' : 'Needs Attention'}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
        <div className="space-y-2">
          {analytics.recentActivity.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  activity.success ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-600">{activity.operation.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span>{formatDuration(activity.duration)}</span>
                <span className="text-xs">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          {analytics.averageProcessingTime > 500 && (
            <li>• Consider reducing image quality for faster processing</li>
          )}
          {analytics.compressionRatio < 50 && (
            <li>• Images could be compressed further for better storage efficiency</li>
          )}
          {analytics.errorRate > 5 && (
            <li>• Review error logs to identify common failure patterns</li>
          )}
          {analytics.totalStorageUsed > 100 && (
            <li>• Consider implementing automatic cleanup of old thumbnails</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ThumbnailAnalytics;
