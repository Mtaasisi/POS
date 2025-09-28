import React, { useState, useEffect, useMemo } from 'react';
import { Device, DeviceStatus } from '../../../../types';
import { 
  BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle, 
  AlertTriangle, Users, Smartphone, Calendar, Activity,
  Target, Zap, Shield, Star, Award, Timer, PieChart
} from 'lucide-react';

interface CustomerCareAnalyticsDashboardProps {
  devices: Device[];
  loading: boolean;
}

const CustomerCareAnalyticsDashboard: React.FC<CustomerCareAnalyticsDashboardProps> = ({
  devices,
  loading
}) => {
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('1d');

  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date();
    const daysAgo = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Filter devices by time range
    const recentDevices = devices.filter(device => 
      new Date(device.createdAt) >= startDate
    );

    // Status distribution
    const statusCounts = recentDevices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {} as Record<DeviceStatus, number>);

    // Daily device creation trend
    const dailyTrend = Array.from({ length: daysAgo }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = recentDevices.filter(device => 
        device.createdAt.startsWith(dateStr)
      ).length;
      return { date: dateStr, count };
    }).reverse();

    // Completion rate
    const completedDevices = recentDevices.filter(device => 
      device.status === 'done' || device.status === 'failed'
    ).length;
    const completionRate = recentDevices.length > 0 ? 
      (completedDevices / recentDevices.length) * 100 : 0;

    // Average processing time
    const completedWithTime = recentDevices.filter(device => 
      device.status === 'done' && device.createdAt && device.updatedAt
    );
    const avgProcessingTime = completedWithTime.length > 0 ? 
      completedWithTime.reduce((total, device) => {
        const start = new Date(device.createdAt).getTime();
        const end = new Date(device.updatedAt).getTime();
        return total + (end - start) / (1000 * 60 * 60 * 24); // days
      }, 0) / completedWithTime.length : 0;

    // Priority devices (overdue, repair-complete, returned-to-customer-care)
    const priorityDevices = recentDevices.filter(device => 
      ['repair-complete', 'returned-to-customer-care', 'failed'].includes(device.status)
    ).length;

    // Customer satisfaction (based on completion rate and no failed devices)
    const failedDevices = recentDevices.filter(device => device.status === 'failed').length;
    const satisfactionRate = recentDevices.length > 0 ? 
      ((completedDevices - failedDevices) / recentDevices.length) * 100 : 0;

    return {
      totalDevices: recentDevices.length,
      statusCounts,
      dailyTrend,
      completionRate,
      avgProcessingTime,
      priorityDevices,
      satisfactionRate,
      failedDevices
    };
  }, [devices, timeRange]);

  // Simple Bar Chart Component
  const SimpleBarChart = ({ data, title, color = 'blue' }: { 
    data: { date: string; count: number }[], 
    title: string, 
    color?: string 
  }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          {title}
        </h3>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16 text-right">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                <div 
                  className={`bg-${color}-500 h-4 rounded-full transition-all duration-500`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
                <span className="absolute right-2 top-0 text-xs text-gray-600 leading-4">
                  {item.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Status Distribution Pie Chart
  const StatusPieChart = () => {
    const statusColors = {
      'pending': 'bg-yellow-500',
      'in-progress': 'bg-blue-500',
      'repair-complete': 'bg-green-500',
      'returned-to-customer-care': 'bg-teal-500',
      'done': 'bg-gray-500',
      'failed': 'bg-red-500'
    };

    const total = Object.values(analytics.statusCounts).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-600" />
          Status Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(analytics.statusCounts).map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${statusColors[status as DeviceStatus] || 'bg-gray-500'}`} />
                <span className="text-sm text-gray-700 capitalize flex-1">
                  {status.replace('-', ' ')}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // KPI Cards
  const KPICard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    suffix = ''
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<any>;
    color?: string;
    suffix?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {value}{suffix}
        </p>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Performance insights and device statistics</p>
        </div>
        <div className="flex gap-2">
          {(['1d', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '1d' ? 'Today' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Devices"
          value={analytics.totalDevices}
          icon={Smartphone}
          color="blue"
        />
        <KPICard
          title="Completion Rate"
          value={`${analytics.completionRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Avg Processing Time"
          value={analytics.avgProcessingTime.toFixed(1)}
          suffix=" days"
          icon={Timer}
          color="purple"
        />
        <KPICard
          title="Priority Devices"
          value={analytics.priorityDevices}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart 
          data={analytics.dailyTrend} 
          title="Daily Device Creation Trend"
          color="blue"
        />
        <StatusPieChart />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Performance Score
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {analytics.satisfactionRate.toFixed(0)}
            </div>
            <p className="text-sm text-gray-600">Customer Satisfaction</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analytics.satisfactionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Efficiency Rating
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {analytics.avgProcessingTime < 3 ? 'A+' : analytics.avgProcessingTime < 5 ? 'A' : analytics.avgProcessingTime < 7 ? 'B' : 'C'}
            </div>
            <p className="text-sm text-gray-600">Processing Speed</p>
            <div className="mt-4 text-xs text-gray-500">
              {analytics.avgProcessingTime < 3 ? 'Excellent' : 
               analytics.avgProcessingTime < 5 ? 'Good' : 
               analytics.avgProcessingTime < 7 ? 'Average' : 'Needs Improvement'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Quality Score
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {analytics.failedDevices === 0 ? '100' : 
               Math.max(0, 100 - (analytics.failedDevices / analytics.totalDevices) * 100).toFixed(0)}
            </div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <div className="mt-4 text-xs text-gray-500">
              {analytics.failedDevices} failed out of {analytics.totalDevices} total
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Users className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">View Customers</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <Smartphone className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">Add Device</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Export Report</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
            <Calendar className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerCareAnalyticsDashboard;
