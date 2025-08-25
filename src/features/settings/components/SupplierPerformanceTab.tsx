import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  TrendingUp, Activity, Zap, Users, Building, 
  Star, DollarSign, Package, ShoppingCart, Clock,
  CheckCircle, XCircle, AlertTriangle, Award, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupplierPerformanceTabProps {
  isActive: boolean;
  suppliers: any[];
}

interface SupplierPerformance {
  overview: {
    totalSuppliers: number;
    highPerformers: number;
    averagePerformers: number;
    lowPerformers: number;
    averageRating: number;
  };
  topPerformers: Array<{
    id: string;
    name: string;
    rating: number;
    orders: number;
    revenue: number;
    onTimeDelivery: number;
    qualityScore: number;
    responseTime: number;
  }>;
  performanceMetrics: Array<{
    metric: string;
    value: number;
    target: number;
    status: 'excellent' | 'good' | 'average' | 'poor';
    trend: number;
  }>;
  recentActivity: Array<{
    id: string;
    supplier: string;
    action: string;
    timestamp: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

const SupplierPerformanceTab: React.FC<SupplierPerformanceTabProps> = ({ isActive, suppliers }) => {
  const [performance, setPerformance] = useState<SupplierPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (isActive) {
      loadSupplierPerformance();
    }
  }, [isActive, timeRange, suppliers]);

  const loadSupplierPerformance = async () => {
    setLoading(true);
    try {
      // Mock supplier performance data
      const mockPerformance: SupplierPerformance = {
        overview: {
          totalSuppliers: 24,
          highPerformers: 8,
          averagePerformers: 12,
          lowPerformers: 4,
          averageRating: 4.2
        },
        topPerformers: [
          {
            id: '1',
            name: 'Tech Solutions Ltd',
            rating: 4.8,
            orders: 156,
            revenue: 2500000,
            onTimeDelivery: 98,
            qualityScore: 95,
            responseTime: 2.5
          },
          {
            id: '2',
            name: 'Global Electronics',
            rating: 4.7,
            orders: 142,
            revenue: 2200000,
            onTimeDelivery: 96,
            qualityScore: 92,
            responseTime: 3.2
          },
          {
            id: '3',
            name: 'Dubai Trading Co',
            rating: 4.6,
            orders: 128,
            revenue: 1800000,
            onTimeDelivery: 94,
            qualityScore: 90,
            responseTime: 4.1
          },
          {
            id: '4',
            name: 'Kenya Mobile Solutions',
            rating: 4.5,
            orders: 115,
            revenue: 1600000,
            onTimeDelivery: 92,
            qualityScore: 88,
            responseTime: 3.8
          },
          {
            id: '5',
            name: 'China Electronics Hub',
            rating: 4.4,
            orders: 98,
            revenue: 1400000,
            onTimeDelivery: 90,
            qualityScore: 85,
            responseTime: 4.5
          }
        ],
        performanceMetrics: [
          {
            metric: 'On-Time Delivery',
            value: 94.5,
            target: 95.0,
            status: 'good',
            trend: 2.3
          },
          {
            metric: 'Quality Score',
            value: 91.2,
            target: 90.0,
            status: 'excellent',
            trend: 1.8
          },
          {
            metric: 'Response Time (hours)',
            value: 3.8,
            target: 4.0,
            status: 'good',
            trend: -0.5
          },
          {
            metric: 'Customer Satisfaction',
            value: 4.2,
            target: 4.5,
            status: 'average',
            trend: 0.3
          },
          {
            metric: 'Order Accuracy',
            value: 97.8,
            target: 98.0,
            status: 'good',
            trend: 0.8
          },
          {
            metric: 'Cost Efficiency',
            value: 88.5,
            target: 90.0,
            status: 'average',
            trend: -1.2
          }
        ],
        recentActivity: [
          {
            id: '1',
            supplier: 'Tech Solutions Ltd',
            action: 'Delivered order 50% faster than expected',
            timestamp: '2 hours ago',
            impact: 'positive'
          },
          {
            id: '2',
            supplier: 'Global Electronics',
            action: 'Improved quality score by 5%',
            timestamp: '4 hours ago',
            impact: 'positive'
          },
          {
            id: '3',
            supplier: 'Dubai Trading Co',
            action: 'Delayed shipment by 2 days',
            timestamp: '6 hours ago',
            impact: 'negative'
          },
          {
            id: '4',
            supplier: 'Kenya Mobile Solutions',
            action: 'Reduced response time by 30%',
            timestamp: '8 hours ago',
            impact: 'positive'
          },
          {
            id: '5',
            supplier: 'China Electronics Hub',
            action: 'Quality issue reported',
            timestamp: '12 hours ago',
            impact: 'negative'
          }
        ]
      };
      
      setPerformance(mockPerformance);
    } catch (error) {
      console.error('Error loading supplier performance:', error);
      toast.error('Failed to load supplier performance data');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'average':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'neutral':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Loading supplier performance...</span>
      </div>
    );
  }

  if (!performance) return null;

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{performance.overview.totalSuppliers}</div>
          <div className="text-sm text-gray-600">Total Suppliers</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{performance.overview.highPerformers}</div>
          <div className="text-sm text-gray-600">High Performers</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{performance.overview.averagePerformers}</div>
          <div className="text-sm text-gray-600">Average Performers</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{performance.overview.lowPerformers}</div>
          <div className="text-sm text-gray-600">Low Performers</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{performance.overview.averageRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </GlassCard>
      </div>

      {/* Top Performers */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Suppliers</h3>
        <div className="space-y-4">
          {performance.topPerformers.map((supplier, index) => (
            <div key={supplier.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                    <span className="text-purple-600 font-semibold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="ml-1 text-sm font-medium">{supplier.rating}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Orders:</span>
                        <p className="font-medium">{supplier.orders}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <p className="font-medium">{formatMoney(supplier.revenue)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">On-Time Delivery:</span>
                        <p className="font-medium">{supplier.onTimeDelivery}%</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Quality Score:</span>
                        <p className="font-medium">{supplier.qualityScore}%</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Response Time</div>
                  <div className="font-semibold text-gray-900">{supplier.responseTime}h</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Performance Metrics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {performance.performanceMetrics.map((metric, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{metric.metric}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current:</span>
                  <span className="font-medium">{metric.value}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Target:</span>
                  <span className="font-medium">{metric.target}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trend:</span>
                  <span className={`font-medium ${metric.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.trend > 0 ? '+' : ''}{metric.trend}
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metric.status === 'excellent' ? 'bg-green-500' :
                      metric.status === 'good' ? 'bg-blue-500' :
                      metric.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent Activity */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {performance.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {getImpactIcon(activity.impact)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.supplier}</p>
                <p className="text-sm text-gray-600">{activity.action}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Performance Insights */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <Award className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Strong Performance</h4>
              <p className="text-sm text-green-700">
                8 suppliers are performing above target with excellent quality scores and on-time delivery rates.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Areas for Improvement</h4>
              <p className="text-sm text-yellow-700">
                4 suppliers need attention in response time and cost efficiency metrics.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Positive Trends</h4>
              <p className="text-sm text-blue-700">
                Overall supplier performance has improved by 12% this quarter compared to last quarter.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SupplierPerformanceTab;
