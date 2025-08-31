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
  Zap, PieChart, Star, ThumbsUp, MessageCircle, Bell, Sparkles
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

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good morning';
    if (hour < 17) return '☀️ Good afternoon';
    return '🌙 Good evening';
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/5 to-purple-500/5 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-400/5 to-orange-500/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-gradient-to-br from-green-400/5 to-emerald-500/5 rounded-full blur-xl"></div>
        </div>
        {/* Enhanced Header */}
        <div className="relative">
          <GlassCard className="bg-gradient-to-br from-blue-50/90 to-indigo-100/90 border-white/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1 text-lg">
                    {getGreeting()}, <span className="font-semibold text-blue-600">
                      {currentUser?.name || currentUser?.email || 'User'}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">All systems operational</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <GlassButton
                  onClick={() => handleNavigation('/devices')}
                  icon={<Smartphone size={18} />}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  size="lg"
                >
                  View Devices
                </GlassButton>
                <GlassButton
                  onClick={() => handleNavigation('/devices/new')}
                  icon={<Plus size={18} />}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  size="lg"
                >
                  Add Device
                </GlassButton>
                <GlassButton
                  onClick={() => handleNavigation('/settings')}
                  variant="ghost"
                  icon={<Settings size={18} />}
                  className="hover:bg-white/50 border border-white/30"
                >
                  Settings
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Enhanced Loading state */}
        {isLoading && (
          <GlassCard className="p-12 bg-gradient-to-br from-blue-50/90 to-indigo-100/90 border-white/40">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-300 opacity-30"></div>
              </div>
              <div className="text-center">
                <span className="text-xl font-semibold text-gray-700">Loading dashboard...</span>
                <p className="text-gray-500 mt-2">Preparing your workspace</p>
              </div>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Enhanced Stats Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <GlassCard className="bg-gradient-to-br from-blue-500/10 to-indigo-600/20 border-blue-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500 group cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Total Devices</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                    {dashboardStats.totalDevices}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">+12% this month</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <Smartphone className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-green-600/20 border-emerald-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500 group cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/30 to-green-500/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-emerald-500" />
                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Active Customers</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors">
                    {dashboardStats.activeCustomers}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">+5 new today</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
                  <Users className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-amber-500/10 to-orange-600/20 border-amber-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500 group cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Pending Repairs</p>
                  </div>
                  <p className="text-3xl font-bold text-amber-900 group-hover:text-amber-700 transition-colors">
                    {dashboardStats.pendingRepairs}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">2 urgent priority</p>
                </div>
                <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors">
                  <Package className="w-8 h-8 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-purple-500/10 to-violet-600/20 border-purple-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500 group cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/30 to-violet-500/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-4 h-4 text-purple-500" />
                    <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Completed Today</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 group-hover:text-purple-700 transition-colors">
                    {dashboardStats.completedToday}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">Goal: 10/day</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <Award className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="bg-gradient-to-br from-rose-500/10 to-pink-600/20 border-rose-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500 group cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-400/30 to-pink-500/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-rose-500" />
                    <p className="text-sm font-semibold text-rose-600 uppercase tracking-wider">Today's Revenue</p>
                  </div>
                  <p className="text-3xl font-bold text-rose-900 group-hover:text-rose-700 transition-colors">
                    {formatMoney(dashboardStats.revenue)}
                  </p>
                  <p className="text-xs text-rose-500 mt-1">+18% vs yesterday</p>
                </div>
                <div className="p-3 bg-rose-500/20 rounded-xl group-hover:bg-rose-500/30 transition-colors">
                  <DollarSign className="w-8 h-8 text-rose-600 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Enhanced Quick Actions */}
        <GlassCard className="p-8 bg-gradient-to-br from-slate-50/90 to-gray-100/90 border-white/40 overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full -ml-20 -mt-20"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-pink-400/10 to-orange-500/10 rounded-full -mr-16 -mb-16"></div>
          
          <div className="relative flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Quick Actions
              </h3>
              <p className="text-gray-600">Access frequently used features instantly</p>
            </div>
          </div>
          
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  onClick={() => handleNavigation(action.path)}
                  className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-500 hover:z-10"
                >
                  <GlassCard className="p-6 bg-white/80 hover:bg-white/90 border-white/50 hover:shadow-2xl h-full">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <span>Get Started</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Enhanced Recent Activities */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <GlassCard className="p-8 bg-gradient-to-br from-white/90 to-blue-50/90 border-white/40 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/15 to-purple-500/15 rounded-full -mr-12 -mt-12"></div>
              
              <div className="relative flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Recent Activities
                    </h3>
                    <p className="text-gray-600">Latest system activities and updates</p>
                  </div>
                </div>
                <GlassButton
                  onClick={() => handleNavigation('/reports')}
                  variant="ghost"
                  icon={<ArrowRight size={16} />}
                  className="hover:bg-blue-50/50 border border-blue-200/50 text-blue-600 hover:text-blue-700"
                >
                  View All
                </GlassButton>
              </div>
              
              <div className="relative space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id} className="group">
                    <div className="flex items-center gap-4 p-5 bg-white/60 hover:bg-white/80 rounded-xl border border-white/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <div className={`p-3 rounded-xl shadow-md ${
                        activity.amount 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                          : index % 2 === 0 
                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                            : 'bg-gradient-to-br from-purple-400 to-violet-500'
                      } group-hover:scale-110 transition-transform duration-300`}>
                        {activity.amount ? (
                          <DollarSign className="w-5 h-5 text-white" />
                        ) : index % 2 === 0 ? (
                          <Smartphone className="w-5 h-5 text-white" />
                        ) : (
                          <Users className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                          {activity.title}
                        </p>
                        <p className="text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500 font-medium">{activity.time}</p>
                        </div>
                      </div>
                      {activity.amount && (
                        <div className="text-right">
                          <p className="font-bold text-2xl text-green-600">{formatMoney(activity.amount)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-500 font-medium">Payment</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Performance Metrics Sidebar */}
          <div className="space-y-6">
            <GlassCard className="p-6 bg-gradient-to-br from-purple-50/90 to-pink-100/90 border-white/40 overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full -mr-8 -mt-8"></div>
              
              <div className="relative flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Performance</h4>
                  <p className="text-xs text-gray-600">This month</p>
                </div>
              </div>
              
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Repair Success Rate</span>
                  <span className="font-bold text-green-600">96%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="font-bold text-blue-600">4.8/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Repair Time</span>
                  <span className="font-bold text-purple-600">2.3 days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-400 to-violet-500 h-2 rounded-full" style={{ width: '77%' }}></div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 bg-gradient-to-br from-orange-50/90 to-yellow-100/90 border-white/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Today's Goals</h4>
                  <p className="text-xs text-gray-600">Track progress</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Repairs Complete</span>
                  <span className="font-bold text-orange-600">8/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-400 to-yellow-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-600">Revenue Target</span>
                  <span className="font-bold text-yellow-600">125K/150K</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Enhanced System Status & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-8 bg-gradient-to-br from-emerald-50/90 to-green-100/90 border-white/40 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/15 to-green-500/15 rounded-full -mr-12 -mt-12"></div>
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    System Status
                  </h3>
                  <p className="text-gray-600">All systems operational</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-gray-700">Server Status</span>
                  </div>
                  <span className="text-green-600 font-bold">Online</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-gray-700">Database</span>
                  </div>
                  <span className="text-blue-600 font-bold">Connected</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-gray-700">Storage</span>
                  </div>
                  <span className="text-purple-600 font-bold">78% Used</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 bg-gradient-to-br from-indigo-50/90 to-blue-100/90 border-white/40 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-400/15 to-blue-500/15 rounded-full -mr-12 -mt-12"></div>
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Quick Insights
                  </h3>
                  <p className="text-gray-600">Key business metrics</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-gray-700">Top Device Type</span>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">iPhone Repairs</p>
                  <p className="text-xs text-gray-500">64% of all repairs</p>
                </div>
                
                <div className="p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-700">Busiest Day</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">Friday</p>
                  <p className="text-xs text-gray-500">18 avg repairs</p>
                </div>
                
                <div className="p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-700">Notifications</span>
                  </div>
                  <p className="text-lg font-bold text-orange-600">3 New</p>
                  <p className="text-xs text-gray-500">Require attention</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Floating Quick Stats Badge */}
        <div className="fixed bottom-6 right-6 z-50">
          <GlassCard className="p-4 bg-gradient-to-br from-white/95 to-blue-50/95 border-white/50 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Today</p>
                <p className="text-xs text-gray-600">{dashboardStats.completedToday} repairs • {formatMoney(dashboardStats.revenue)}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageErrorWrapper>
  );
};

export default DashboardPage;