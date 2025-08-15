import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  BarChart3, TrendingUp, PieChart, Activity, DollarSign, Users, 
  Calendar, Clock, Download, Filter, RefreshCw, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight, Target, Award, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  sales: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
    topProducts: Array<{
      name: string;
      sales: number;
      revenue: number;
    }>;
  };
  customers: {
    total: number;
    new: number;
    active: number;
    growth: number;
    topCustomers: Array<{
      name: string;
      purchases: number;
      totalSpent: number;
    }>;
  };
  services: {
    total: number;
    completed: number;
    pending: number;
    revenue: number;
    topServices: Array<{
      name: string;
      requests: number;
      revenue: number;
    }>;
  };
  employees: {
    total: number;
    active: number;
    performance: number;
    attendance: number;
    topPerformers: Array<{
      name: string;
      performance: number;
      attendance: number;
    }>;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    value: number;
    topCategories: Array<{
      name: string;
      items: number;
      value: number;
    }>;
  };
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

const AdvancedAnalyticsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('sales');
  const [showCharts, setShowCharts] = useState(true);
  const [exportFormat, setExportFormat] = useState('pdf');

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const mockData: AnalyticsData = {
          sales: {
            total: 12500000,
            today: 450000,
            thisWeek: 3200000,
            thisMonth: 12500000,
            growth: 12.5,
            topProducts: [
              { name: 'iPhone Screen Replacement', sales: 45, revenue: 3600000 },
              { name: 'Laptop Diagnostics', sales: 32, revenue: 480000 },
              { name: 'Windows Installation', sales: 28, revenue: 700000 },
              { name: 'Data Recovery', sales: 15, revenue: 1125000 },
              { name: 'Virus Removal', sales: 42, revenue: 840000 }
            ]
          },
          customers: {
            total: 1250,
            new: 45,
            active: 890,
            growth: 8.3,
            topCustomers: [
              { name: 'John Doe', purchases: 12, totalSpent: 850000 },
              { name: 'Sarah Smith', purchases: 8, totalSpent: 620000 },
              { name: 'Mike Johnson', purchases: 15, totalSpent: 1100000 },
              { name: 'Lisa Brown', purchases: 6, totalSpent: 480000 },
              { name: 'Alex Wilson', purchases: 10, totalSpent: 750000 }
            ]
          },
          services: {
            total: 156,
            completed: 142,
            pending: 14,
            revenue: 6800000,
            topServices: [
              { name: 'Device Repair', requests: 45, revenue: 3600000 },
              { name: 'Device Diagnostics', requests: 38, revenue: 570000 },
              { name: 'Software Installation', requests: 32, revenue: 800000 },
              { name: 'Data Recovery', requests: 18, revenue: 1350000 },
              { name: 'Virus Removal', requests: 23, revenue: 460000 }
            ]
          },
          employees: {
            total: 12,
            active: 10,
            performance: 4.2,
            attendance: 94.5,
            topPerformers: [
              { name: 'Sarah Manager', performance: 4.8, attendance: 98 },
              { name: 'John Doe', performance: 4.5, attendance: 95 },
              { name: 'Mike Technician', performance: 4.3, attendance: 92 },
              { name: 'Lisa Support', performance: 4.1, attendance: 89 },
              { name: 'Alex Tech', performance: 3.9, attendance: 87 }
            ]
          },
          inventory: {
            totalItems: 1250,
            lowStock: 45,
            outOfStock: 12,
            value: 8500000,
            topCategories: [
              { name: 'Screens & Displays', items: 180, value: 2800000 },
              { name: 'Batteries', items: 220, value: 1650000 },
              { name: 'Cables & Adapters', items: 350, value: 420000 },
              { name: 'Tools & Equipment', items: 120, value: 1800000 },
              { name: 'Software Licenses', items: 85, value: 850000 }
            ]
          }
        };

        setAnalyticsData(mockData);
      } catch (error) {
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-TZ').format(num);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive business insights and reporting</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => setShowCharts(!showCharts)}
            variant="secondary"
            icon={showCharts ? <EyeOff size={18} /> : <Eye size={18} />}
          >
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </GlassButton>
          <GlassButton
            onClick={() => toast.success('Export functionality coming soon!')}
            variant="secondary"
            icon={<Download size={18} />}
          >
            Export Report
          </GlassButton>
          <GlassButton
            onClick={() => window.location.reload()}
            variant="secondary"
            icon={<RefreshCw size={18} />}
          >
            Refresh Data
          </GlassButton>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <GlassSelect
              options={[
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
                { value: '1y', label: 'Last Year' },
                { value: 'all', label: 'All Time' }
              ]}
              value={timeRange}
              onChange={setTimeRange}
              placeholder="Select Time Range"
              className="w-full"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <GlassSelect
              options={[
                { value: 'pdf', label: 'PDF Report' },
                { value: 'excel', label: 'Excel Spreadsheet' },
                { value: 'csv', label: 'CSV Data' }
              ]}
              value={exportFormat}
              onChange={setExportFormat}
              placeholder="Select Format"
              className="w-full"
            />
          </div>
        </div>
      </GlassCard>

      {/* Main Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Overview */}
        <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Sales Overview</h3>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              analyticsData?.sales.growth && analyticsData.sales.growth > 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {analyticsData?.sales.growth && analyticsData.sales.growth > 0 ? (
                <ArrowUpRight size={16} />
              ) : (
                <ArrowDownRight size={16} />
              )}
              {analyticsData?.sales.growth}%
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Total Revenue</span>
              <span className="font-semibold text-blue-900">{formatCurrency(analyticsData?.sales.total || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Today's Sales</span>
              <span className="font-semibold text-blue-900">{formatCurrency(analyticsData?.sales.today || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">This Week</span>
              <span className="font-semibold text-blue-900">{formatCurrency(analyticsData?.sales.thisWeek || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">This Month</span>
              <span className="font-semibold text-blue-900">{formatCurrency(analyticsData?.sales.thisMonth || 0)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Customer Overview */}
        <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Customer Overview</h3>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              analyticsData?.customers.growth && analyticsData.customers.growth > 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {analyticsData?.customers.growth && analyticsData.customers.growth > 0 ? (
                <ArrowUpRight size={16} />
              ) : (
                <ArrowDownRight size={16} />
              )}
              {analyticsData?.customers.growth}%
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Total Customers</span>
              <span className="font-semibold text-green-900">{formatNumber(analyticsData?.customers.total || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">New Customers</span>
              <span className="font-semibold text-green-900">{formatNumber(analyticsData?.customers.new || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Active Customers</span>
              <span className="font-semibold text-green-900">{formatNumber(analyticsData?.customers.active || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Growth Rate</span>
              <span className="font-semibold text-green-900">{analyticsData?.customers.growth}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Services Overview */}
        <GlassCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-900">Services Overview</h3>
            </div>
            <div className="text-sm text-purple-600 font-medium">
              {analyticsData?.services.completed}/{analyticsData?.services.total}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Total Requests</span>
              <span className="font-semibold text-purple-900">{formatNumber(analyticsData?.services.total || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Completed</span>
              <span className="font-semibold text-purple-900">{formatNumber(analyticsData?.services.completed || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Pending</span>
              <span className="font-semibold text-purple-900">{formatNumber(analyticsData?.services.pending || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Revenue</span>
              <span className="font-semibold text-purple-900">{formatCurrency(analyticsData?.services.revenue || 0)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Employee Overview */}
        <GlassCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">Employee Overview</h3>
            </div>
            <div className="text-sm text-orange-600 font-medium">
              {analyticsData?.employees.active}/{analyticsData?.employees.total}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-700">Total Employees</span>
              <span className="font-semibold text-orange-900">{formatNumber(analyticsData?.employees.total || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-700">Active Employees</span>
              <span className="font-semibold text-orange-900">{formatNumber(analyticsData?.employees.active || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-700">Avg Performance</span>
              <span className="font-semibold text-orange-900">{analyticsData?.employees.performance}/5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-700">Avg Attendance</span>
              <span className="font-semibold text-orange-900">{analyticsData?.employees.attendance}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Inventory Overview */}
        <GlassCard className="p-6 bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Inventory Overview</h3>
            </div>
            <div className="text-sm text-red-600 font-medium">
              {analyticsData?.inventory.lowStock} Low
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-700">Total Items</span>
              <span className="font-semibold text-red-900">{formatNumber(analyticsData?.inventory.totalItems || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-700">Low Stock</span>
              <span className="font-semibold text-red-900">{formatNumber(analyticsData?.inventory.lowStock || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-700">Out of Stock</span>
              <span className="font-semibold text-red-900">{formatNumber(analyticsData?.inventory.outOfStock || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-700">Total Value</span>
              <span className="font-semibold text-red-900">{formatCurrency(analyticsData?.inventory.value || 0)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Performance Metrics */}
        <GlassCard className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-indigo-900">Performance Metrics</h3>
            </div>
            <div className="text-sm text-indigo-600 font-medium">
              KPI Dashboard
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-700">Sales Growth</span>
              <span className="font-semibold text-indigo-900">{analyticsData?.sales.growth}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-700">Customer Growth</span>
              <span className="font-semibold text-indigo-900">{analyticsData?.customers.growth}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-700">Service Completion</span>
              <span className="font-semibold text-indigo-900">
                {analyticsData?.services.total ? Math.round((analyticsData.services.completed / analyticsData.services.total) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-700">Employee Attendance</span>
              <span className="font-semibold text-indigo-900">{analyticsData?.employees.attendance}%</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Detailed Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {analyticsData?.sales.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                  <p className="text-sm text-gray-500">
                    {analyticsData.sales.total > 0 ? Math.round((product.revenue / analyticsData.sales.total) * 100) : 0}% of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Customers */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
            <Users className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {analyticsData?.customers.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.purchases} purchases</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-sm text-gray-500">Total spent</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Services */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Services</h3>
            <Activity className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {analyticsData?.services.topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.requests} requests</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(service.revenue)}</p>
                  <p className="text-sm text-gray-500">
                    {analyticsData.services.revenue > 0 ? Math.round((service.revenue / analyticsData.services.revenue) * 100) : 0}% of revenue
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Performers */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            <Award className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {analyticsData?.employees.topPerformers.map((employee, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-orange-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.performance}/5 performance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{employee.attendance}%</p>
                  <p className="text-sm text-gray-500">Attendance</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Inventory Categories */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Categories</h3>
            <ShoppingCart className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {analyticsData?.inventory.topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-red-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">{category.items} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(category.value)}</p>
                  <p className="text-sm text-gray-500">
                    {analyticsData.inventory.value > 0 ? Math.round((category.value / analyticsData.inventory.value) * 100) : 0}% of value
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Target className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <GlassButton
              onClick={() => navigate('/inventory')}
              variant="secondary"
              className="w-full justify-start"
              icon={<ShoppingCart size={18} />}
            >
              View Inventory
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/customers')}
              variant="secondary"
              className="w-full justify-start"
              icon={<Users size={18} />}
            >
              Manage Customers
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/services')}
              variant="secondary"
              className="w-full justify-start"
              icon={<Activity size={18} />}
            >
              Service Requests
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/employees')}
              variant="secondary"
              className="w-full justify-start"
              icon={<Award size={18} />}
            >
              Employee Management
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/appointments')}
              variant="secondary"
              className="w-full justify-start"
              icon={<Calendar size={18} />}
            >
              Appointment Calendar
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPage;
