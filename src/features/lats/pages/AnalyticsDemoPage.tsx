import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import AnalyticsCards from '../components/inventory/AnalyticsCards';
import { 
  BarChart3, TrendingUp, PieChart, Activity, DollarSign, Users, 
  Calendar, Clock, Download, Filter, RefreshCw, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight, Target, Award, ShoppingCart,
  Database, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AnalyticsDemoPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleExportData = () => {
    toast.success('Analytics data exported successfully');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Real-time inventory and business insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlassButton
              onClick={handleExportData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </GlassButton>
            <GlassButton
              onClick={handleSettings}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </GlassButton>
          </div>
        </div>

        {/* Main Analytics Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Key Metrics</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          
          <AnalyticsCards />
        </div>

        {/* Additional Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Analytics */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Today's Sales</span>
                <span className="font-semibold text-green-600">$2,450.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold">$12,800.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">$48,200.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Growth Rate</span>
                <span className="font-semibold text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" />
                  +12.5%
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Customer Analytics */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Customers</span>
                <span className="font-semibold">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New This Month</span>
                <span className="font-semibold text-blue-600">+89</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Customers</span>
                <span className="font-semibold">892</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Order Value</span>
                <span className="font-semibold">$156.80</span>
              </div>
            </div>
          </GlassCard>

          {/* Performance Metrics */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-purple-600">3.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Session Duration</span>
                <span className="font-semibold">4m 32s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bounce Rate</span>
                <span className="font-semibold text-red-600">28.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer Satisfaction</span>
                <span className="font-semibold text-green-600">4.8/5.0</span>
              </div>
            </div>
          </GlassCard>

          {/* System Health */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database Status</span>
                <span className="font-semibold text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API Response Time</span>
                <span className="font-semibold">142ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Uptime</span>
                <span className="font-semibold text-green-600">99.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Backup</span>
                <span className="font-semibold">2 hours ago</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassButton
              onClick={() => navigate('/lats/inventory')}
              className="flex items-center gap-2 justify-center"
            >
              <ShoppingCart className="w-4 h-4" />
              Manage Inventory
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/lats/pos')}
              variant="outline"
              className="flex items-center gap-2 justify-center"
            >
              <DollarSign className="w-4 h-4" />
              Point of Sale
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/customers')}
              variant="outline"
              className="flex items-center gap-2 justify-center"
            >
              <Users className="w-4 h-4" />
              Customer Management
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/reports')}
              variant="outline"
              className="flex items-center gap-2 justify-center"
            >
              <BarChart3 className="w-4 h-4" />
              Generate Reports
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDemoPage;
