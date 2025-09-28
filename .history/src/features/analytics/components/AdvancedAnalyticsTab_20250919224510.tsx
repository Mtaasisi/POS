import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Activity, TrendingUp, BarChart3, PieChart, Target, 
  ArrowUpRight, ArrowDownRight, Calendar, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salesAnalyticsService } from '../../lats/lib/salesAnalyticsService';
import { AnalyticsService } from '../../lats/lib/analyticsService';

interface AdvancedAnalyticsTabProps {
  isActive: boolean;
  timeRange: string;
}

interface AdvancedData {
  performanceMetrics: {
    conversionRate: number;
    customerRetention: number;
    averageOrderValue: number;
    inventoryTurnover: number;
  };
  trends: Array<{
    metric: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  predictions: Array<{
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
  }>;
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    impact: string;
  }>;
}

const AdvancedAnalyticsTab: React.FC<AdvancedAnalyticsTabProps> = ({ isActive, timeRange }) => {
  const [advancedData, setAdvancedData] = useState<AdvancedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      loadAdvancedData();
    }
  }, [isActive, timeRange]);

  const loadAdvancedData = async () => {
    try {
      setLoading(true);
      
      // Mock advanced analytics data
      const mockData: AdvancedData = {
        performanceMetrics: {
          conversionRate: 23.5,
          customerRetention: 78.2,
          averageOrderValue: 12500,
          inventoryTurnover: 4.2
        },
        trends: [
          { metric: 'Sales Growth', current: 12500000, previous: 11000000, change: 13.6, trend: 'up' },
          { metric: 'Customer Acquisition', current: 45, previous: 38, change: 18.4, trend: 'up' },
          { metric: 'Average Order Value', current: 12500, previous: 11800, change: 5.9, trend: 'up' },
          { metric: 'Customer Churn', current: 2.1, previous: 2.8, change: -25.0, trend: 'down' },
          { metric: 'Inventory Turnover', current: 4.2, previous: 3.8, change: 10.5, trend: 'up' },
          { metric: 'Payment Success Rate', current: 94.2, previous: 92.1, change: 2.3, trend: 'up' }
        ],
        predictions: [
          { metric: 'Next Month Revenue', currentValue: 12500000, predictedValue: 13800000, confidence: 85 },
          { metric: 'Customer Growth', currentValue: 1250, predictedValue: 1420, confidence: 78 },
          { metric: 'Average Order Value', currentValue: 12500, predictedValue: 13200, confidence: 82 },
          { metric: 'Inventory Needs', currentValue: 1247, predictedValue: 1350, confidence: 75 }
        ],
        insights: [
          {
            type: 'positive',
            title: 'Strong Customer Retention',
            description: 'Customer retention rate increased by 5.2% this month',
            impact: 'High'
          },
          {
            type: 'positive',
            title: 'Improved Conversion Rate',
            description: 'Sales conversion rate improved from 20.1% to 23.5%',
            impact: 'Medium'
          },
          {
            type: 'neutral',
            title: 'Inventory Optimization',
            description: 'Consider adjusting inventory levels for Electronics category',
            impact: 'Low'
          },
          {
            type: 'negative',
            title: 'Payment Processing Delays',
            description: 'Average payment processing time increased by 15%',
            impact: 'Medium'
          }
        ]
      };
      
      setAdvancedData(mockData);
    } catch (error) {
      console.error('Error loading advanced data:', error);
      toast.error('Failed to load advanced analytics');
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 text-gray-500">—</div>;
    }
  };

  const getInsightColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50';
      case 'negative':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-3 text-gray-600">Loading advanced analytics...</span>
      </div>
    );
  }

  if (!advancedData) return null;

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {advancedData.performanceMetrics.conversionRate}%
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+3.4%</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Target className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customer Retention</p>
              <p className="text-2xl font-bold text-gray-900">
                {advancedData.performanceMetrics.customerRetention}%
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+5.2%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(advancedData.performanceMetrics.averageOrderValue)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+5.9%</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Turnover</p>
              <p className="text-2xl font-bold text-gray-900">
                {advancedData.performanceMetrics.inventoryTurnover}x
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+10.5%</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Trends Analysis */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trends Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advancedData.trends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{trend.metric}</p>
                <p className="text-sm text-gray-600">
                  {trend.metric.includes('Rate') || trend.metric.includes('Churn') 
                    ? `${trend.current}%` 
                    : trend.metric.includes('Growth') || trend.metric.includes('Value')
                    ? formatMoney(trend.current)
                    : formatNumber(trend.current)
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center">
                  {getTrendIcon(trend.trend)}
                  <span className={`text-sm ml-1 ${
                    trend.trend === 'up' ? 'text-green-600' : 
                    trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Predictions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advancedData.predictions.map((prediction, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{prediction.metric}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {prediction.metric.includes('Revenue') || prediction.metric.includes('Value')
                      ? formatMoney(prediction.currentValue)
                      : formatNumber(prediction.currentValue)
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Predicted:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {prediction.metric.includes('Revenue') || prediction.metric.includes('Value')
                      ? formatMoney(prediction.predictedValue)
                      : formatNumber(prediction.predictedValue)
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className="text-sm font-medium text-green-600">{prediction.confidence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Insights */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
        <div className="space-y-3">
          {advancedData.insights.map((insight, index) => (
            <div key={index} className={`p-4 border-l-4 rounded-lg ${getInsightColor(insight.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  insight.impact === 'High' ? 'bg-red-100 text-red-800' :
                  insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {insight.impact} Impact
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default AdvancedAnalyticsTab;
