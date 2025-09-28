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
  Bell, AlertTriangle, Zap, RefreshCw, MapPin
} from 'lucide-react';
import {
  NotificationWidget,
  EmployeeWidget,
  AppointmentWidget,
  InventoryWidget,
  FinancialWidget,
  AnalyticsWidget,
  SystemHealthWidget,
  ActivityFeedWidget,
  CustomerInsightsWidget,
  ServiceWidget
} from '../components/dashboard';
import { dashboardService, DashboardStats } from '../../../services/dashboardService';

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
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load comprehensive dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      await withErrorHandling(async () => {
        setIsLoading(true);
        
        if (currentUser?.id) {
          const stats = await dashboardService.getDashboardStats(currentUser.id);
          setDashboardStats(stats);
          setLastRefresh(new Date());
        }
        
        setIsLoading(false);
      }, 'Loading dashboard data');
    };

    loadDashboardData();
  }, [currentUser?.id, withErrorHandling]);

  // Auto refresh dashboard every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser?.id && !isLoading) {
        dashboardService.getDashboardStats(currentUser.id).then(stats => {
          setDashboardStats(stats);
          setLastRefresh(new Date());
        });
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentUser?.id, isLoading]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (currentUser?.id) {
      setIsLoading(true);
      try {
        const stats = await dashboardService.getDashboardStats(currentUser.id);
        setDashboardStats(stats);
        setLastRefresh(new Date());
      } catch (error) {
        handleError(error as Error, 'Refreshing dashboard');
      } finally {
        setIsLoading(false);
      }
    }
  };

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

  // Quick action cards - streamlined for comprehensive dashboard
  const quickActions = [
    {
      title: 'Devices',
      description: 'Manage devices',
      icon: Smartphone,
      color: 'from-indigo-500 to-indigo-600',
      path: '/devices'
    },
    {
      title: 'Add Device',
      description: 'New device',
      icon: Plus,
      color: 'from-blue-500 to-blue-600',
      path: '/devices/new'
    },
    {
      title: 'Customers',
      description: 'Customer data',
      icon: Users,
      color: 'from-green-500 to-green-600',
      path: '/customers'
    },
    {
      title: 'Inventory',
      description: 'Stock & parts',
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      path: '/lats/unified-inventory'
    },
    {
      title: 'Analytics',
      description: 'Business insights',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      path: '/lats/analytics'
    },
    {
      title: 'Appointments',
      description: 'Scheduling',
      icon: Calendar,
      color: 'from-pink-500 to-pink-600',
      path: '/appointments'
    },
    {
      title: 'Purchase Orders',
      description: 'Manage orders',
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      path: '/lats/purchase-orders'
    },
    {
      title: 'Payments',
      description: 'Payment management',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      path: '/finance/payments'
    },
    {
      title: 'Ad Generator',
      description: 'Create product ads',
      icon: FileText,
      color: 'from-rose-500 to-rose-600',
      path: '/ad-generator'
    }
  ];

  return (
    <PageErrorWrapper pageName="Dashboard" showDetails={true}>
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-none mx-auto space-y-6">
                  {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                {dashboardStats?.unreadNotifications > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    <Bell size={12} />
                    {dashboardStats.unreadNotifications}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600">
                  Welcome back, {currentUser?.name || currentUser?.email || 'User'}
                </p>
                <span className="text-xs text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </div>
          
                                  <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={() => handleNavigation('/notifications')}
                variant="secondary"
                icon={<Bell size={18} />}
                className={dashboardStats?.unreadNotifications > 0 ? 'text-red-600' : ''}
              >
                Notifications
                {dashboardStats?.unreadNotifications > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    {dashboardStats.unreadNotifications}
                  </span>
                )}
              </GlassButton>
              <GlassButton
                onClick={() => handleNavigation('/devices/new')}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                Add Device
              </GlassButton>
              <GlassButton
                onClick={handleRefresh}
                variant="secondary"
                icon={<RefreshCw size={18} />}
                disabled={isLoading}
              >
                Refresh
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
              <span className="ml-3 text-gray-600">Loading comprehensive dashboard...</span>
            </div>
          </GlassCard>
        )}

        {/* Enhanced Stats Grid */}
        {!isLoading && dashboardStats && (
          <>
            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
              <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Devices</p>
                    <p className="text-2xl font-bold text-blue-900">{dashboardStats.totalDevices}</p>
                    <p className="text-xs text-blue-600 mt-1">{dashboardStats.pendingRepairs} pending</p>
                  </div>
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
              </GlassCard>
              
              <GlassCard className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Customers</p>
                    <p className="text-2xl font-bold text-green-900">{dashboardStats.activeCustomers}</p>
                    <p className="text-xs text-green-600 mt-1">+{dashboardStats.customerGrowth}% growth</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </GlassCard>
              
              <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Staff Present</p>
                    <p className="text-2xl font-bold text-purple-900">{dashboardStats.presentToday}</p>
                    <p className="text-xs text-purple-600 mt-1">{dashboardStats.attendanceRate}% attendance</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </GlassCard>
              
              <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Appointments</p>
                    <p className="text-2xl font-bold text-orange-900">{dashboardStats.todayAppointments}</p>
                    <p className="text-xs text-orange-600 mt-1">{dashboardStats.upcomingAppointments} upcoming</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
              </GlassCard>
              
              <GlassCard className="bg-gradient-to-br from-red-50 to-red-100 p-4 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Stock Alerts</p>
                    <p className="text-2xl font-bold text-red-900">{dashboardStats.lowStockItems}</p>
                    <p className="text-xs text-red-600 mt-1">{dashboardStats.criticalStockAlerts} critical</p>
                  </div>
                  <Package className="w-8 h-8 text-red-600" />
                </div>
              </GlassCard>
              
              <GlassCard className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Today's Revenue</p>
                    <p className="text-2xl font-bold text-emerald-900">{formatMoney(dashboardStats.todayRevenue)}</p>
                    <p className="text-xs text-emerald-600 mt-1">+{dashboardStats.revenueGrowth}% growth</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
              </GlassCard>
            </div>

            {/* System Status Bar */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      dashboardStats.systemStatus === 'healthy' ? 'bg-green-500' :
                      dashboardStats.systemStatus === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      System {dashboardStats.systemStatus}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">•</span>
                  <span className="text-sm text-gray-600">
                    Backup: {dashboardStats.backupStatus}
                  </span>
                  <span className="text-sm text-gray-600">•</span>
                  <span className="text-sm text-gray-600">
                    DB: {dashboardStats.databasePerformance}
                  </span>
                </div>
                
                {(dashboardStats.urgentNotifications > 0 || 
                  dashboardStats.criticalStockAlerts > 0 || 
                  dashboardStats.systemStatus !== 'healthy') && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    <AlertTriangle size={14} />
                    Attention Required
                  </div>
                )}
              </div>
            </GlassCard>
          </>
        )}

        {/* Comprehensive Widgets Layout */}
        {!isLoading && dashboardStats && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column - Primary Widgets (8 columns) */}
            <div className="xl:col-span-8 space-y-6">
              {/* Top Row - Notifications and Financial */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NotificationWidget />
                <FinancialWidget />
              </div>
              
              {/* Service Performance Widget - Full Width */}
              <ServiceWidget />
              
              {/* Analytics Widget - Full Width */}
              <AnalyticsWidget />
            </div>

            {/* Right Column - Operational Widgets (4 columns) */}
            <div className="xl:col-span-4 space-y-6">
              {/* Employee Status Widget */}
              <EmployeeWidget />
              
              {/* Appointments Widget */}
              <AppointmentWidget />
              
              {/* Customer Insights Widget */}
              <CustomerInsightsWidget />
              
              {/* System Health Widget */}
              <SystemHealthWidget />
              
              {/* Inventory Alerts Widget */}
              <InventoryWidget />
              
              {/* Activity Feed Widget */}
              <ActivityFeedWidget />
            </div>
          </div>
        )}

        {/* Quick Actions - Compact Design */}
        {!isLoading && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600">Access frequently used features</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(action.path)}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-center group"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} w-fit mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{action.title}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        )}

        </div>
      </div>
    </PageErrorWrapper>
  );
};

export default DashboardPage;