import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, Users, Target, ExternalLink } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { dashboardService } from '../../../../services/dashboardService';

interface AnalyticsWidgetProps {
  className?: string;
}

interface AnalyticsMetrics {
  revenueGrowth: number;
  customerGrowth: number;
  avgOrderValue: number;
  totalOrders: number;
  topPerformingServices: string[];
}

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ className }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    revenueGrowth: 0,
    customerGrowth: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    topPerformingServices: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const stats = await dashboardService.getDashboardStats('current-user');
      
      setMetrics({
        revenueGrowth: stats.revenueGrowth,
        customerGrowth: stats.customerGrowth,
        avgOrderValue: stats.averageOrderValue,
        totalOrders: stats.completedToday,
        topPerformingServices: stats.popularServices
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600 bg-green-100';
    if (growth < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp size={12} />;
    if (growth < 0) return <TrendingDown size={12} />;
    return <Target size={12} />;
  };

  if (isLoading) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Business Analytics</h3>
            <p className="text-sm text-gray-600">Key performance indicators</p>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg border ${getGrowthColor(metrics.revenueGrowth).replace('text-', 'border-').replace('bg-', 'bg-opacity-20 bg-')}`}>
          <div className="flex items-center gap-2 mb-1">
            {getGrowthIcon(metrics.revenueGrowth)}
            <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
          </div>
          <div className={`flex items-center gap-1 ${getGrowthColor(metrics.revenueGrowth)}`}>
            <span className="text-lg font-bold">
              {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth}%
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-lg border ${getGrowthColor(metrics.customerGrowth).replace('text-', 'border-').replace('bg-', 'bg-opacity-20 bg-')}`}>
          <div className="flex items-center gap-2 mb-1">
            <Users size={12} />
            <span className="text-sm font-medium text-gray-700">Customer Growth</span>
          </div>
          <div className={`flex items-center gap-1 ${getGrowthColor(metrics.customerGrowth)}`}>
            <span className="text-lg font-bold">
              {metrics.customerGrowth > 0 ? '+' : ''}{metrics.customerGrowth}%
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Avg Order Value</span>
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(metrics.avgOrderValue)}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Orders Today</span>
          <span className="text-sm font-bold text-gray-900">
            {metrics.totalOrders}
          </span>
        </div>
      </div>

      {/* Top Services */}
      {metrics.topPerformingServices.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Services</h4>
          <div className="space-y-1">
            {metrics.topPerformingServices.slice(0, 3).map((service, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <span className="text-sm text-gray-700 truncate">{service}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <GlassButton
          onClick={() => navigate('/lats/analytics')}
          variant="ghost"
          size="sm"
          className="flex-1"
          icon={<ExternalLink size={14} />}
        >
          View Analytics
        </GlassButton>
        <GlassButton
          onClick={() => navigate('/lats/sales-reports')}
          variant="ghost"
          size="sm"
          icon={<BarChart3 size={14} />}
        >
          Reports
        </GlassButton>
      </div>
    </GlassCard>
  );
};