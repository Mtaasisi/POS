import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSQuickActions from '../components/ui/LATSQuickActions';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';

import { PageErrorBoundary } from '../../../features/shared/components/PageErrorBoundary';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import ErrorState from '../components/ui/ErrorState';
import {
  ShoppingCart, Package, Users, BarChart3, TrendingUp, FileText, Crown, CreditCard,
  DollarSign, Activity, Target, Award, Calendar, Clock, ArrowRight, Plus, Settings,
  MessageSquare, Zap, Globe, Truck
} from 'lucide-react';

const LATSDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sales' | 'inventory' | 'customers' | 'analytics' | 'reports'>('all');
  
  // Error handling
  const { errorState, handleError, clearError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });

  // Loading state for dashboard data
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      todaySales: 0,
      todayOrders: 0,
      totalProducts: 0,
      activeCustomers: 0,
      lowStockItems: 0,
      pendingPayments: 0,
      monthlyRevenue: 0,
      monthlyGrowth: 0
    },
    recentActivities: [],
    quickStats: []
  });

  // Load dashboard data with error handling
  useEffect(() => {
    const loadDashboardData = async () => {
      await withErrorHandling(async () => {
        setIsLoading(true);
        
        try {
          // Fetch real data from database
          const [
            todaySalesResult,
            todayOrdersResult,
            productsResult,
            customersResult,
            lowStockResult,
            monthlyRevenueResult
          ] = await Promise.all([
            // Today's sales
            supabase
              .from('lats_sales')
              .select('total_amount')
              .gte('created_at', new Date().toISOString().split('T')[0])
              .eq('status', 'completed'),
            
            // Today's orders
            supabase
              .from('lats_sales')
              .select('id')
              .gte('created_at', new Date().toISOString().split('T')[0]),
            
            // Total products
            supabase
              .from('lats_products')
              .select('id, is_active')
              .eq('is_active', true),
            
            // Active customers
            supabase
              .from('customers')
              .select('id')
              .eq('is_active', true),
            
            // Low stock items
            supabase
              .from('lats_product_variants')
              .select('id, quantity, min_quantity')
              .lte('quantity', 10),
            
            // Monthly revenue
            supabase
              .from('lats_sales')
              .select('total_amount')
              .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
              .eq('status', 'completed')
          ]);

          // Calculate metrics
          const todaySales = todaySalesResult.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
          const todayOrders = todayOrdersResult.data?.length || 0;
          const totalProducts = productsResult.data?.length || 0;
          const activeCustomers = customersResult.data?.length || 0;
          const lowStockItems = lowStockResult.data?.length || 0;
          const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
          
          // Calculate growth (simplified - compare with previous month)
          const previousMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
          const { data: previousMonthRevenue } = await supabase
            .from('lats_sales')
            .select('total_amount')
            .gte('created_at', previousMonth.toISOString())
            .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
            .eq('status', 'completed');
          
          const previousRevenue = previousMonthRevenue?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
          const monthlyGrowth = previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 0;

          setDashboardData({
            metrics: {
              todaySales,
              todayOrders,
              totalProducts,
              activeCustomers,
              lowStockItems,
              pendingPayments: 0, // This would need a separate query for pending payments
              monthlyRevenue,
              monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
            },
            recentActivities: [], // This would need a separate query for recent activities
            quickStats: []
          });
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          // Set default values on error
          setDashboardData({
            metrics: {
              todaySales: 0,
              todayOrders: 0,
              totalProducts: 0,
              activeCustomers: 0,
              lowStockItems: 0,
              pendingPayments: 0,
              monthlyRevenue: 0,
              monthlyGrowth: 0
            },
            recentActivities: [],
            quickStats: []
          });
        }
        
        setIsLoading(false);
      }, 'Loading dashboard data');
    };

    loadDashboardData();
  }, [withErrorHandling]);

  // Handle navigation errors
  const handleNavigation = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      handleError(error as Error, 'Navigation');
    }
  };

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

  const formatNumber = (num: number) => {
    try {
      return new Intl.NumberFormat('en-KE').format(num);
    } catch (error) {
      handleError(error as Error, 'Number formatting');
      return num.toString();
    }
  };

  // Show error state if there's an error
  if (errorState.hasError) {
    return (
      <ErrorState
        title="Dashboard Error"
        message={errorState.errorMessage || undefined}
        error={errorState.error || undefined}
        action={{
          label: 'Try Again',
          onClick: () => {
            clearError();
            window.location.reload();
          }
        }}
        secondaryAction={{
          label: 'Go Back',
          onClick: () => navigate(-1)
        }}
        showDetails={true}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LATS System Dashboard</h1>
            <p className="text-gray-600 mt-1">Loading dashboard data...</p>
          </div>
        </div>
        <GlassCard className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <PageErrorBoundary pageName="LATS Dashboard" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">LATS System Dashboard</h1>
              <p className="text-gray-600 mt-1">Complete business management system</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <GlassButton
              onClick={() => handleNavigation('/pos')}
              icon={<ShoppingCart size={18} />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            >
              Start New Sale
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/lats/purchase-order/create')}
              icon={<Truck size={18} />}
              className="bg-gradient-to-r from-orange-500 to-amber-600 text-white"
            >
              Create Purchase Order
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/lats/add-product')}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Add Product
            </GlassButton>
            <GlassButton
              onClick={() => handleNavigation('/lats/analytics')}
              icon={<BarChart3 size={18} />}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            >
              View Analytics
            </GlassButton>
          </div>
        </div>

        {/* Breadcrumb - HIDDEN */}
        {/* <LATSBreadcrumb /> */}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardData.quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <GlassCard key={index} className="bg-gradient-to-br from-white/80 to-white/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-500">from yesterday</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Main Navigation */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">LATS System Navigation</h3>
              <p className="text-sm text-gray-600">Access all LATS modules and features</p>
            </div>
          </div>
          
          {/* <LATSNavigation variant="horizontal" className="mb-6" /> */}
          
          <LATSQuickActions />
        </GlassCard>

        {/* Recent Activities */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Recent Activities</h3>
              <p className="text-sm text-gray-600">Latest system activities and updates</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {dashboardData.recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${activity.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    <Icon className="w-5 h-5" />
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
              );
            })}
          </div>
        </GlassCard>




      </div>
    </PageErrorBoundary>
  );
};

export default LATSDashboardPage;

