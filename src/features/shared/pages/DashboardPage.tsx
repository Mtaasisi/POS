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
  ShoppingCart, AlertTriangle, CheckCircle, Truck, MessageCircle,
  UserCheck, TrendingDown, Eye, Zap, Building, CreditCard, Bell,
  Wifi, Instagram, Globe, Store, Briefcase, FileText, Crown,
  MapPin, Layers, Grid3X3, Search, Send
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
    // Device Management
    totalDevices: 0,
    activeCustomers: 0,
    pendingRepairs: 0,
    completedToday: 0,
    
    // Sales & Revenue
    todayRevenue: 0,
    monthlyRevenue: 0,
    todaySales: 0,
    monthlyGrowth: 0,
    
    // Inventory
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inventoryValue: 0,
    
    // Purchase Orders
    pendingOrders: 0,
    deliveriesDue: 0,
    ordersThisMonth: 0,
    
    // Financial
    accountBalance: 0,
    pendingPayments: 0,
    monthlyExpenses: 0,
    profitMargin: 0,
    
    // Communication
    whatsappMessages: 0,
    instagramMessages: 0,
    unreadMessages: 0,
    
    // Employees
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    attendanceRate: 0,
    
    // General Alerts
    criticalAlerts: 0,
    systemHealth: 'excellent'
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
          // Device Management
          totalDevices: 156,
          activeCustomers: 289,
          pendingRepairs: 12,
          completedToday: 8,
          
          // Sales & Revenue
          todayRevenue: 125000,
          monthlyRevenue: 3250000,
          todaySales: 23,
          monthlyGrowth: 15.8,
          
          // Inventory
          totalProducts: 1243,
          lowStockItems: 15,
          outOfStockItems: 3,
          inventoryValue: 5800000,
          
          // Purchase Orders
          pendingOrders: 7,
          deliveriesDue: 4,
          ordersThisMonth: 28,
          
          // Financial
          accountBalance: 2100000,
          pendingPayments: 8,
          monthlyExpenses: 850000,
          profitMargin: 28.5,
          
          // Communication
          whatsappMessages: 156,
          instagramMessages: 89,
          unreadMessages: 12,
          
          // Employees
          totalEmployees: 18,
          presentToday: 16,
          onLeave: 2,
          attendanceRate: 88.9,
          
          // General Alerts
          criticalAlerts: 3,
          systemHealth: 'good'
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

  // Quick action cards - Essential business functions
  const quickActions = [
    {
      title: 'POS System',
      description: 'Start new sale or transaction',
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      path: '/pos',
      category: 'sales'
    },
    {
      title: 'Inventory',
      description: 'Manage products and stock',
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      path: '/lats/unified-inventory',
      category: 'inventory'
    },
    {
      title: 'Customers',
      description: 'Manage customer database',
      icon: Users,
      color: 'from-green-500 to-green-600',
      path: '/customers',
      category: 'customers'
    },
    {
      title: 'WhatsApp Hub',
      description: 'WhatsApp messaging center',
      icon: MessageCircle,
      color: 'from-emerald-500 to-emerald-600',
      path: '/lats/whatsapp-hub',
      category: 'communication'
    },
    {
      title: 'Purchase Orders',
      description: 'Manage supplier orders',
      icon: Truck,
      color: 'from-orange-500 to-orange-600',
      path: '/lats/purchase-orders',
      category: 'procurement'
    },
    {
      title: 'Analytics',
      description: 'Business insights & reports',
      icon: BarChart3,
      color: 'from-pink-500 to-pink-600',
      path: '/analytics',
      category: 'analytics'
    },
    {
      title: 'Employees',
      description: 'Staff management & attendance',
      icon: UserCheck,
      color: 'from-indigo-500 to-indigo-600',
      path: '/employees',
      category: 'hr'
    },
    {
      title: 'Finance',
      description: 'Payment & financial tracking',
      icon: CreditCard,
      color: 'from-teal-500 to-teal-600',
      path: '/finance',
      category: 'finance'
    },
    {
      title: 'LATS System',
      description: 'Complete business management',
      icon: Building,
      color: 'from-violet-500 to-violet-600',
      path: '/lats',
      category: 'core'
    },
    {
      title: 'Devices',
      description: 'Device repair management',
      icon: Smartphone,
      color: 'from-cyan-500 to-cyan-600',
      path: '/devices',
      category: 'repair'
    },
    {
      title: 'Settings',
      description: 'System configuration',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      path: '/settings',
      category: 'config'
    },
    {
      title: 'Search',
      description: 'Global search across system',
      icon: Search,
      color: 'from-yellow-500 to-yellow-600',
      path: '/search',
      category: 'tools'
    }
  ];

  // Recent activities - Comprehensive business activities
  const recentActivities = [
    {
      id: '1',
      title: 'POS Sale Completed',
      description: 'iPhone charger sold - Payment via M-Pesa',
      time: '2 minutes ago',
      amount: 15000,
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    {
      id: '2',
      title: 'WhatsApp Message Received',
      description: 'Customer inquiry about laptop repair',
      time: '5 minutes ago',
      icon: MessageCircle,
      color: 'text-green-600'
    },
    {
      id: '3',
      title: 'Low Stock Alert',
      description: 'iPhone 15 screen protectors - Only 3 left',
      time: '8 minutes ago',
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      id: '4',
      title: 'Purchase Order Received',
      description: 'Supplier delivery - 50 items processed',
      time: '15 minutes ago',
      icon: Truck,
      color: 'text-orange-600'
    },
    {
      id: '5',
      title: 'Employee Check-in',
      description: 'Sarah Johnson - Morning shift started',
      time: '1 hour ago',
      icon: UserCheck,
      color: 'text-indigo-600'
    },
    {
      id: '6',
      title: 'Device Repair Completed',
      description: 'Samsung Galaxy S22 - Screen replacement',
      time: '2 hours ago',
      amount: 75000,
      icon: Smartphone,
      color: 'text-cyan-600'
    },
    {
      id: '7',
      title: 'New Customer Registered',
      description: 'Michael Brown - Added to customer database',
      time: '3 hours ago',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      id: '8',
      title: 'Payment Processed',
      description: 'Credit card payment for laptop service',
      time: '4 hours ago',
      amount: 120000,
      icon: CreditCard,
      color: 'text-teal-600'
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
              onClick={() => handleNavigation('/pos')}
              icon={<ShoppingCart size={18} />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            >
              New Sale
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/lats/unified-inventory')}
              icon={<Package size={18} />}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            >
              Inventory
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/lats/whatsapp-hub')}
              icon={<MessageCircle size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              WhatsApp
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/analytics')}
              icon={<BarChart3 size={18} />}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white"
            >
              Analytics
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/lats')}
              variant="secondary"
              icon={<Building size={18} />}
            >
              LATS System
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

        {/* Critical Alerts Bar */}
        {!isLoading && dashboardStats.criticalAlerts > 0 && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Critical Alerts</p>
                  <p className="text-sm opacity-90">{dashboardStats.criticalAlerts} items need immediate attention</p>
                </div>
              </div>
              <GlassButton 
                variant="secondary" 
                size="sm"
                onClick={() => handleNavigation('/settings')}
                className="bg-white/20 text-white border-white/30"
              >
                View Details
              </GlassButton>
            </div>
          </div>
        )}

        {/* Comprehensive Stats Grid */}
        {!isLoading && (
          <>
            {/* Sales & Revenue Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Sales & Revenue</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Today's Revenue</p>
                      <p className="text-2xl font-bold text-blue-900">{formatMoney(dashboardStats.todayRevenue)}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">+{dashboardStats.monthlyGrowth}% from last month</span>
                      </div>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-emerald-900">{formatMoney(dashboardStats.monthlyRevenue)}</p>
                      <p className="text-xs text-emerald-700 mt-1">Profit margin: {dashboardStats.profitMargin}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Today's Sales</p>
                      <p className="text-2xl font-bold text-purple-900">{dashboardStats.todaySales}</p>
                      <p className="text-xs text-purple-700 mt-1">Transactions completed</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-purple-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-teal-50 to-teal-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-teal-600">Account Balance</p>
                      <p className="text-2xl font-bold text-teal-900">{formatMoney(dashboardStats.accountBalance)}</p>
                      <p className="text-xs text-teal-700 mt-1">{dashboardStats.pendingPayments} pending payments</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-teal-600" />
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Inventory & Operations Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Inventory & Operations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="bg-gradient-to-br from-indigo-50 to-indigo-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">Total Products</p>
                      <p className="text-2xl font-bold text-indigo-900">{dashboardStats.totalProducts}</p>
                      <p className="text-xs text-indigo-700 mt-1">Value: {formatMoney(dashboardStats.inventoryValue)}</p>
                    </div>
                    <Package className="w-8 h-8 text-indigo-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Low Stock Items</p>
                      <p className="text-2xl font-bold text-yellow-900">{dashboardStats.lowStockItems}</p>
                      <p className="text-xs text-yellow-700 mt-1">{dashboardStats.outOfStockItems} out of stock</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Purchase Orders</p>
                      <p className="text-2xl font-bold text-orange-900">{dashboardStats.pendingOrders}</p>
                      <p className="text-xs text-orange-700 mt-1">{dashboardStats.deliveriesDue} deliveries due</p>
                    </div>
                    <Truck className="w-8 h-8 text-orange-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-cyan-50 to-cyan-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-cyan-600">Device Repairs</p>
                      <p className="text-2xl font-bold text-cyan-900">{dashboardStats.pendingRepairs}</p>
                      <p className="text-xs text-cyan-700 mt-1">{dashboardStats.completedToday} completed today</p>
                    </div>
                    <Smartphone className="w-8 h-8 text-cyan-600" />
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Customers & Communication Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Customers & Communication</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Active Customers</p>
                      <p className="text-2xl font-bold text-green-900">{dashboardStats.activeCustomers}</p>
                      <p className="text-xs text-green-700 mt-1">Customer database</p>
                    </div>
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">WhatsApp Messages</p>
                      <p className="text-2xl font-bold text-emerald-900">{dashboardStats.whatsappMessages}</p>
                      <p className="text-xs text-emerald-700 mt-1">{dashboardStats.unreadMessages} unread</p>
                    </div>
                    <MessageCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-pink-50 to-pink-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-600">Instagram DMs</p>
                      <p className="text-2xl font-bold text-pink-900">{dashboardStats.instagramMessages}</p>
                      <p className="text-xs text-pink-700 mt-1">Social engagement</p>
                    </div>
                    <Instagram className="w-8 h-8 text-pink-600" />
                  </div>
                </GlassCard>
                
                <GlassCard className="bg-gradient-to-br from-violet-50 to-violet-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-violet-600">Employees</p>
                      <p className="text-2xl font-bold text-violet-900">{dashboardStats.presentToday}/{dashboardStats.totalEmployees}</p>
                      <p className="text-xs text-violet-700 mt-1">{dashboardStats.attendanceRate}% attendance</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-violet-600" />
                  </div>
                </GlassCard>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions - Core Business Functions */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600">Essential business functions</p>
              </div>
            </div>
            <GlassButton
              onClick={() => handleNavigation('/lats')}
              variant="ghost"
              size="sm"
            >
              View All Features
              <ArrowRight size={14} />
            </GlassButton>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quickActions.filter((_, index) => index < 8).map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(action.path)}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-left group"
                >
                  <div className={`p-2 rounded-full bg-gradient-to-br ${action.color} w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                  <p className="text-xs text-gray-600 mb-2">{action.description}</p>
                  <div className="flex items-center text-blue-600 text-xs font-medium">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Secondary Actions */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {quickActions.filter((_, index) => index >= 8).map((action, index) => {
                const Icon = action.icon;
                return (
                  <GlassButton
                    key={index}
                    onClick={() => handleNavigation(action.path)}
                    variant="ghost"
                    size="sm"
                    icon={<Icon size={16} />}
                  >
                    {action.title}
                  </GlassButton>
                );
              })}
            </div>
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
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivities.slice(0, 6).map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`p-2 rounded-full bg-gray-100`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                  {activity.amount && (
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">{formatMoney(activity.amount)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Business Overview & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status & Health */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">System Status</h3>
                  <p className="text-sm text-gray-600">Overall system health</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  dashboardStats.systemHealth === 'excellent' ? 'bg-green-500' :
                  dashboardStats.systemHealth === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  dashboardStats.systemHealth === 'excellent' ? 'text-green-600' :
                  dashboardStats.systemHealth === 'good' ? 'text-yellow-600' : 'text-red-600'
                }`}>{dashboardStats.systemHealth}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Database Connection</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Active</span>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">WhatsApp API</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Connected</span>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Payment Gateway</span>
                </div>
                <span className="text-xs text-blue-600 font-medium">Operational</span>
              </div>
            </div>
          </GlassCard>

          {/* Key Performance Indicators */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Key Performance Indicators</h3>
                <p className="text-sm text-gray-600">Business performance at a glance</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Monthly Growth</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: `${Math.min(dashboardStats.monthlyGrowth * 5, 100)}%`}}></div>
                  </div>
                  <span className="text-sm font-medium text-green-600">+{dashboardStats.monthlyGrowth}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Inventory Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.max(100 - (dashboardStats.lowStockItems / dashboardStats.totalProducts * 100), 0)}%`}}></div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">Good</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Staff Attendance</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: `${dashboardStats.attendanceRate}%`}}></div>
                  </div>
                  <span className="text-sm font-medium text-purple-600">{dashboardStats.attendanceRate}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Customer Satisfaction</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">4.6/5</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <GlassButton
                onClick={() => handleNavigation('/analytics')}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <BarChart3 size={16} />
                View Detailed Analytics
              </GlassButton>
            </div>
          </GlassCard>

          {/* Notifications & Pending Tasks */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notifications & Tasks</h3>
                <p className="text-sm text-gray-600">Important items requiring attention</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {dashboardStats.lowStockItems > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">Low Stock Alert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-yellow-800">{dashboardStats.lowStockItems} items</span>
                    <GlassButton 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleNavigation('/lats/unified-inventory')}
                      className="text-yellow-700"
                    >
                      View
                    </GlassButton>
                  </div>
                </div>
              )}
              
              {dashboardStats.deliveriesDue > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-700">Deliveries Due</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-orange-800">{dashboardStats.deliveriesDue} orders</span>
                    <GlassButton 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleNavigation('/lats/purchase-orders')}
                      className="text-orange-700"
                    >
                      View
                    </GlassButton>
                  </div>
                </div>
              )}
              
              {dashboardStats.unreadMessages > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Unread Messages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-800">{dashboardStats.unreadMessages} messages</span>
                    <GlassButton 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleNavigation('/lats/whatsapp-hub')}
                      className="text-green-700"
                    >
                      View
                    </GlassButton>
                  </div>
                </div>
              )}
              
              {dashboardStats.pendingPayments > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Pending Payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-800">{dashboardStats.pendingPayments} payments</span>
                    <GlassButton 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleNavigation('/finance')}
                      className="text-blue-700"
                    >
                      View
                    </GlassButton>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageErrorWrapper>
  );
};

export default DashboardPage;