// AI Hosting Dashboard Component
// Displays intelligent hosting analytics and recommendations
// Provides automated optimization suggestions

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Shield, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Settings,
  Zap,
  Server,
  Globe,
  Wifi,
  HardDrive,
  Cpu,
  Memory
} from 'lucide-react';
import { aiHostingService } from '../services/aiHostingService';

interface HostingMetrics {
  responseTime: number;
  uptime: number;
  errorRate: number;
  bandwidth: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface HostingRecommendation {
  type: 'performance' | 'security' | 'cost' | 'scalability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  estimatedImpact: string;
  estimatedCost?: number;
}

interface HostingHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  issues: string[];
  recommendations: HostingRecommendation[];
}

const AIHostingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<HostingMetrics | null>(null);
  const [health, setHealth] = useState<HostingHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load hosting data
  const loadHostingData = async () => {
    setLoading(true);
    try {
      const [metricsData, healthData] = await Promise.all([
        aiHostingService.analyzeHostingPerformance(),
        aiHostingService.getHostingHealth()
      ]);
      
      setMetrics(metricsData);
      setHealth(healthData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load hosting data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-optimize hosting
  const handleAutoOptimize = async () => {
    setLoading(true);
    try {
      const success = await aiHostingService.autoOptimize();
      if (success) {
        // Reload data after optimization
        await loadHostingData();
      }
    } catch (error) {
      console.error('Auto-optimization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadHostingData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadHostingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Zap className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'cost':
        return <DollarSign className="w-4 h-4" />;
      case 'scalability':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🤖 AI Hosting Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Intelligent hosting analytics and automated optimization
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadHostingData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleAutoOptimize}
                disabled={loading || !health?.recommendations.some(r => r.priority === 'critical')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto-Optimize
              </button>
            </div>
          </div>
          
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 mt-2">Analyzing hosting performance...</p>
          </div>
        )}

        {!loading && health && (
          <>
            {/* Health Status */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Health Score</p>
                    <p className="text-2xl font-bold text-gray-900">{health.score}/100</p>
                  </div>
                  {getStatusIcon(health.status)}
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        health.score >= 90 ? 'bg-green-500' : 
                        health.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${health.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Server className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{health.status}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Issues</p>
                    <p className="text-lg font-semibold text-gray-900">{health.issues.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Settings className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recommendations</p>
                    <p className="text-lg font-semibold text-gray-900">{health.recommendations.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Globe className="w-6 h-6 text-blue-600" />
                    <h3 className="ml-2 text-lg font-semibold text-gray-900">Response Time</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {metrics.responseTime}ms
                  </p>
                  <p className={`text-sm mt-1 ${
                    metrics.responseTime < 1000 ? 'text-green-600' : 
                    metrics.responseTime < 2000 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.responseTime < 1000 ? 'Excellent' : 
                     metrics.responseTime < 2000 ? 'Good' : 'Needs improvement'}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Wifi className="w-6 h-6 text-green-600" />
                    <h3 className="ml-2 text-lg font-semibold text-gray-900">Uptime</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {metrics.uptime.toFixed(2)}%
                  </p>
                  <p className={`text-sm mt-1 ${
                    metrics.uptime >= 99.9 ? 'text-green-600' : 
                    metrics.uptime >= 99 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.uptime >= 99.9 ? 'Excellent' : 
                     metrics.uptime >= 99 ? 'Good' : 'Needs improvement'}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <h3 className="ml-2 text-lg font-semibold text-gray-900">Error Rate</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {metrics.errorRate.toFixed(2)}%
                  </p>
                  <p className={`text-sm mt-1 ${
                    metrics.errorRate < 0.1 ? 'text-green-600' : 
                    metrics.errorRate < 1 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.errorRate < 0.1 ? 'Excellent' : 
                     metrics.errorRate < 1 ? 'Good' : 'Needs improvement'}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <HardDrive className="w-6 h-6 text-purple-600" />
                    <h3 className="ml-2 text-lg font-semibold text-gray-900">Bandwidth</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {(metrics.bandwidth / 1024).toFixed(1)} MB
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Daily usage</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Cpu className="w-6 h-6 text-orange-600" />
                    <h3 className="ml-2 text-lg font-semibold text-gray-900">CPU Usage</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {metrics.cpuUsage}%
                  </p>
                  <p className={`text-sm mt-1 ${
                    metrics.cpuUsage < 60 ? 'text-green-600' : 
                    metrics.cpuUsage < 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.cpuUsage < 60 ? 'Normal' : 
                     metrics.cpuUsage < 80 ? 'High' : 'Critical'}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Memory className="w-6 h-6 text-indigo-600" />
                    <h3 className="ml-2 text-lg font-semibold text-gray-900">Memory Usage</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {metrics.memoryUsage.toFixed(1)}%
                  </p>
                  <p className={`text-sm mt-1 ${
                    metrics.memoryUsage < 60 ? 'text-green-600' : 
                    metrics.memoryUsage < 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.memoryUsage < 60 ? 'Normal' : 
                     metrics.memoryUsage < 80 ? 'High' : 'Critical'}
                  </p>
                </div>
              </div>
            )}

            {/* Issues */}
            {health.issues.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                  Current Issues
                </h3>
                <div className="space-y-2">
                  {health.issues.map((issue, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
                      <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {health.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 text-blue-600 mr-2" />
                  AI Recommendations
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {health.recommendations.map((rec, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          {getTypeIcon(rec.type)}
                          <h4 className="ml-2 font-semibold">{rec.title}</h4>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm mt-2">{rec.description}</p>
                      <p className="text-sm font-medium mt-2">Action: {rec.action}</p>
                      <p className="text-sm mt-1">Impact: {rec.estimatedImpact}</p>
                      {rec.estimatedCost && (
                        <p className="text-sm mt-1">
                          Cost: ${rec.estimatedCost > 0 ? '+' : ''}{rec.estimatedCost}/month
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIHostingDashboard;
