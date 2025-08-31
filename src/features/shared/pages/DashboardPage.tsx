import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { PageErrorWrapper } from '../components/PageErrorWrapper';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import {
  Smartphone, Users, Package, BarChart3, Settings, Plus, ArrowRight,
  TrendingUp, DollarSign, Activity, Target, Award, Calendar, Clock,
  CreditCard
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Error handling
  const { handleError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalDevices: 0,
    activeCustomers: 0,
    pendingRepairs: 0,
    completedToday: 0,
    revenue: 0
  });

  // Load dashboard data with error handling
  useEffect(() => {
    const loadDashboardData = async () => {
      await withErrorHandling(async () => {
        setIsLoading(true);
        
        // Simulate loading dashboard data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, you would fetch data from your API here
        setDashboardStats({
          totalDevices: 156,
          activeCustomers: 89,
          pendingRepairs: 12,
          completedToday: 8,
          revenue: 125000
        });
        
        setIsLoading(false);
      }, 'Loading dashboard data');
    };

    loadDashboardData();
  }, [withErrorHandling]);

  // Handle navigation with error handling
  const handleNavigation = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      handleError(error as Error, 'Navigation');
    }
  };

  // Format currency with error handling
  const formatMoney = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS'
      }).format(amount);
    } catch (error) {
      handleError(error as Error, 'Currency formatting');
      return `TZS ${amount}`;
    }
  };

  // Quick action cards
  const quickActions = [
    {
      title: 'View All Devices',
      description: 'Manage all devices for repair',
      icon: Smartphone,
      color: 'from-indigo-500 to-indigo-600',
      path: '/devices'
    },
    {
      title: 'Add New Device',
      description: 'Register a new device for repair',
      icon: Smartphone,
      color: 'from-blue-500 to-blue-600',
      path: '/devices/new'
    },
    {
      title: 'Manage Customers',
      description: 'View and manage customer database',
      icon: Users,
      color: 'from-green-500 to-green-600',
      path: '/customers'
    },
    {
      title: 'Inventory',
      description: 'Manage parts and supplies',
      icon: Package,
      color: 'from-purple-500 to-purple-600',
              path: '/lats/unified-inventory'
    },
    {
      title: 'Analytics',
      description: 'View business analytics',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      path: '/lats/analytics'
    },
    {
      title: 'Payment Management',
      description: 'Manage all payments in one place',
      icon: CreditCard,
      color: 'from-emerald-500 to-emerald-600',
      path: '/points-management'
    }
  ];

  // Recent activities
  const recentActivities = [
    {
      id: '1',
      title: 'Device repair completed',
      description: 'iPhone 14 Pro - Screen replacement',
      time: '2 minutes ago',
      amount: 45000
    },
    {
      id: '2',
      title: 'New customer registered',
      description: 'John Doe - Samsung Galaxy S23',
      time: '15 minutes ago'
    },
    {
      id: '3',
      title: 'Payment received',
      description: 'Cash payment for MacBook repair',
      time: '1 hour ago',
      amount: 89000
    }
  ];

  return (
    <PageErrorWrapper pageName="Dashboard" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {currentUser?.name || currentUser?.email || 'User'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <GlassButton
              onClick={() => handleNavigation('/devices')}
              icon={<Smartphone size={18} />}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
            >
              View Devices
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/devices/new')}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            >
              Add Device
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/settings')}
              variant="secondary"
              icon={<Settings size={18} />}
            >
              Settings
            </GlassButton>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <GlassCard className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading dashboard...</span>
            </div>
          </GlassCard>
        )}

        {/* Stats Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Devices</p>
                  <p className="text-2xl font-bold text-blue-900">{dashboardStats.totalDevices}</p>
                </div>
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Customers</p>
                  <p className="text-2xl font-bold text-green-900">{dashboardStats.activeCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Pending Repairs</p>
                  <p className="text-2xl font-bold text-orange-900">{dashboardStats.pendingRepairs}</p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Completed Today</p>
                  <p className="text-2xl font-bold text-purple-900">{dashboardStats.completedToday}</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-emerald-900">{formatMoney(dashboardStats.revenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
            </GlassCard>
          </div>
        )}

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Access frequently used features</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(action.path)}
                  className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left group"
                >
                  <div className={`p-3 rounded-full bg-gradient-to-br ${action.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Recent Activities */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Recent Activities</h3>
                <p className="text-sm text-gray-600">Latest system activities</p>
              </div>
            </div>
            <GlassButton
              onClick={() => handleNavigation('/reports')}
              variant="ghost"
              size="sm"
            >
              View All
              <ArrowRight size={14} />
            </GlassButton>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
                {activity.amount && (
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatMoney(activity.amount)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* System Status */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Status</h3>
                <p className="text-sm text-gray-600">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageErrorWrapper>
  );
};

export default DashboardPage;