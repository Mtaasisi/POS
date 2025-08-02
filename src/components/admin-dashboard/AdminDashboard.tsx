import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/EnhancedInput';
import { useQuickActions } from '../../hooks/useQuickActions';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Smartphone, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Plus,
  Package,
  Search,
  Bell,
  Settings,
  Home,
  UserPlus,
  ShoppingCart,
  FileText,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Zap,
  Target,
  Award,
  AlertCircle,
  Info,
  CheckSquare,
  MessageCircle,
  Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deviceServices } from '../../lib/deviceServices';
import { analyticsService } from '../../lib/analyticsService';
import { smsService } from '../../services/smsService';
import SMSAnalyticsTrends from './SMSAnalyticsTrends';
import CustomerTagWidget from './CustomerTagWidget';

interface AnalyticsData {
  devices: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    pending: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    returning: number;
    active: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  performance: {
    avgRepairTime: number;
    successRate: number;
    customerSatisfaction: number;
    technicianEfficiency: number;
  };
  trends: {
    monthly: Array<{ month: string; devices: number; revenue: number }>;
    daily: Array<{ date: string; devices: number; revenue: number }>;
    deviceTypes: Array<{ type: string; count: number; percentage: number }>;
    statusDistribution: Array<{ status: string; count: number; percentage: number }>;
  };
  topTechnicians: Array<{
    id: string;
    name: string;
    completedDevices: number;
    avgTime: number;
    satisfaction: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalDevices: number;
    totalSpent: number;
    lastVisit: string;
  }>;
  returns?: {
    pending: number;
    escalated: number;
    completedToday: number;
    avgResolutionTime: string;
  };
}

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  time: string;
  read: boolean;
}

interface RecentActivity {
  id: string;
  type: 'device_added' | 'repair_completed' | 'customer_added' | 'payment_received';
  message: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

const AdvancedAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Default data to show immediately without loading
  const defaultData: AnalyticsData = {
    devices: {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
      pending: 0,
    },
    customers: {
      total: 0,
      newThisMonth: 0,
      returning: 0,
      active: 0,
    },
    revenue: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0
    },
    performance: {
      avgRepairTime: 0,
      successRate: 0,
      customerSatisfaction: 0,
      technicianEfficiency: 0
    },
    trends: {
      monthly: [],
      daily: [],
      deviceTypes: [],
      statusDistribution: []
    },
    topTechnicians: [],
    topCustomers: []
  };
  
  // ALL useState hooks must be declared at the top, before any conditional returns
  const [data, setData] = useState<AnalyticsData | null>(defaultData);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [dataCache, setDataCache] = useState<Map<string, { data: AnalyticsData; timestamp: number }>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [readyForPickupDevices, setReadyForPickupDevices] = useState<any[]>([]);
  const [smsLoading, setSmsLoading] = useState(true);
  const [smsStats, setSmsStats] = useState<{ sent: number; failed: number; delivered: number; pending: number; total: number; totalCost: number } | null>(null);
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [smsLogsLoading, setSmsLogsLoading] = useState(true);
  const [checkingStatusId, setCheckingStatusId] = useState<string | null>(null);
  const [smsSending, setSmsSending] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Cache duration: 24 hours for offline use
  const CACHE_DURATION = 24 * 60 * 60 * 1000;
  // Refresh interval: 30 minutes
  const REFRESH_INTERVAL = 30 * 60 * 1000;
  // Offline cache duration: 7 days
  const OFFLINE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

  // Memoized cache key
  const cacheKey = useMemo(() => `analytics_${timeRange}`, [timeRange]);

  // Check if cached data is still valid
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  // Get cached data if available and valid (with offline support)
  const getCachedData = useCallback(async () => {
    // First check in-memory cache
    const cached = dataCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    
    // Then check localStorage for offline data
    try {
      const offlineData = localStorage.getItem(`offline_analytics_${cacheKey}`);
      if (offlineData) {
        const parsed = JSON.parse(offlineData);
        if (Date.now() - parsed.timestamp < OFFLINE_CACHE_DURATION) {
          console.log('[Analytics] Using offline cached data');
          return parsed.data;
        }
      }
    } catch (error) {
      console.error('[Analytics] Error reading offline cache:', error);
    }
    
    return null;
  }, [dataCache, cacheKey, isCacheValid]);

  // Set cached data (with offline storage)
  const setCachedData = useCallback((data: AnalyticsData) => {
    const timestamp = Date.now();
    
    // Save to in-memory cache
    setDataCache(prev => new Map(prev).set(cacheKey, {
      data,
      timestamp
    }));
    
    // Save to localStorage for offline use
    try {
      localStorage.setItem(`offline_analytics_${cacheKey}`, JSON.stringify({
        data,
        timestamp
      }));
      console.log('[Analytics] Data saved to offline cache');
    } catch (error) {
      console.error('[Analytics] Error saving to offline cache:', error);
    }
  }, [cacheKey]);

  // Use customizable quick actions
  const { 
    quickActions, 
    getGridClasses, 
    getActionButtonClasses, 
    getIconSize, 
    getTextSize, 
    shouldShowDescription,
    isEnabled: quickActionsEnabled 
  } = useQuickActions();

  // Role-based access control
  const isAdmin = currentUser?.role === 'admin';
  const isCustomerCare = currentUser?.role === 'customer-care';
  const isTechnician = currentUser?.role === 'technician';

  // Check if user has permission to view admin dashboard
  const canViewAdminDashboard = isAdmin || isCustomerCare || isTechnician;

  // Privacy check - Technicians should not see customer information
  const canViewCustomerInfo = isAdmin || isCustomerCare;

  // If user doesn't have permission, show access denied
  if (!canViewAdminDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to view the admin dashboard.</p>
          <GlassButton onClick={() => navigate('/dashboard')} variant="primary">
            Go to Dashboard
          </GlassButton>
        </div>
      </div>
    );
  }

  // Debug logging for quick actions (only log once on mount)
  useEffect(() => {
    // Only log in development mode and only once
    if (process.env.NODE_ENV === 'development') {
      console.log('[AdminDashboard] Quick actions loaded:', {
        enabled: quickActionsEnabled,
        count: quickActions.length,
        actions: quickActions.map(a => ({ id: a.id, name: a.name, enabled: a.isEnabled }))
      });
    }
  }, [quickActionsEnabled, quickActions]);

  // Enhanced error handling for data loading
  const handleDataError = useCallback((error: any) => {
    console.error('[AdminDashboard] Data loading error:', error);
    setDataError(error.message || 'Failed to load dashboard data');
    setLoading(false);
    setIsRefreshing(false);
  }, []);

  const navigateTo = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  // Optimized load notifications - only load once and update based on data
  const loadNotifications = useCallback(async () => {
    try {
      // Generate sample notifications based on data
      const newNotifications: Notification[] = [];
      
      if (data?.devices.overdue && data.devices.overdue > 0) {
        newNotifications.push({
          id: '1',
          type: 'warning',
          message: `${data.devices.overdue} devices are overdue`,
          time: '2 min ago',
          read: false
        });
      }
      
      if (data?.customers.newThisMonth && data.customers.newThisMonth > 0) {
        newNotifications.push({
          id: '2',
          type: 'info',
          message: `${data.customers.newThisMonth} new customers this month`,
          time: '5 min ago',
          read: false
        });
      }
      
      if (data?.revenue.growth && data.revenue.growth > 10) {
        newNotifications.push({
          id: '3',
          type: 'success',
          message: `Revenue growth: +${data.revenue.growth.toFixed(1)}%`,
          time: '10 min ago',
          read: false
        });
      }
      
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [data]);

  // Optimized load recent activities - only load once
  const loadRecentActivities = useCallback(async () => {
    try {
      // Get real recent activities from the admin dashboard service
      const allDevices = await deviceServices.getAllDevices();
      
      // Generate real activities from device data
      const activities: RecentActivity[] = [];
      
      // Get recent devices (last 10)
      const recentDevices = allDevices
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      recentDevices.forEach((device: any) => {
        const customerName = device.customers?.name || 'Unknown Customer';
        const deviceInfo = `${device.brand} ${device.model}`;
        
        // Determine activity type based on device status
        let type: 'device_added' | 'repair_completed' | 'customer_added' | 'payment_received' = 'device_added';
        let icon = <Smartphone size={16} />;
        let color = 'text-blue-500';
        
        if (device.status === 'done') {
          type = 'repair_completed';
          icon = <CheckSquare size={16} />;
          color = 'text-green-500';
        } else if (device.status === 'in-repair') {
          type = 'device_added';
          icon = <Smartphone size={16} />;
          color = 'text-orange-500';
        }
        
        activities.push({
          id: `device_${device.id}`,
          type: type,
          message: `${deviceInfo} ${type === 'repair_completed' ? 'completed' : 'added'} by ${customerName}`,
          time: getTimeAgo(device.created_at),
          icon: icon,
          color: color
        });
      });
      
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    }
  }, []);

  // Helper function to get time ago
  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Optimized analytics data loading with caching
  const loadAnalyticsData = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = await getCachedData();
      if (cachedData) {
        setData(cachedData);
        setDataLoaded(true);
        setLoading(false);
        return;
      }
    }

    // Don't show loading if we have cached data or if data has been loaded before
    if (!dataLoaded && !getCachedData()) {
      setLoading(true);
    }
    
    setIsRefreshing(true);
    setDataError(null); // Clear any previous errors
    
    try {
      // Use optimized analytics service
      const analytics = await analyticsService.getComprehensiveAnalytics();
      
      if (!analytics) {
        // Fallback to old method if optimized service fails
        console.log('[AdvancedAnalytics] Using fallback analytics method');
        const deviceStats = await deviceServices.getDeviceStatistics();
        
        // Basic fallback data
        const processedData = processAnalyticsData({
          deviceStats,
          customersCount: 0,
          newCustomers: [],
          totalRevenue: 0,
          thisMonthRevenue: 0,
          lastMonthRevenue: 0,
          devicesData: [],
          trendsSalesData: [],
          salesTableExists: false
        });
        
        setData(processedData);
        setCachedData(processedData);
        return;
      }

      // Transform analytics data to match existing interface with safe property access
      const processedData: AnalyticsData = {
        devices: {
          total: analytics.device_stats?.total || 0,
          completed: analytics.device_stats?.completed || 0,
          inProgress: analytics.device_stats?.in_repair || 0,
          overdue: analytics.device_stats?.overdue || 0,
          pending: analytics.device_stats?.pending || 0,
        },
        customers: {
          total: analytics.customer_stats?.total || 0,
          newThisMonth: analytics.customer_stats?.new_this_month || 0,
          returning: analytics.customer_stats?.returning || 0,
          active: analytics.customer_stats?.active || 0,
        },
        revenue: {
          total: analytics.revenue_stats?.total || 0,
          thisMonth: analytics.revenue_stats?.this_month || 0,
          lastMonth: analytics.revenue_stats?.last_month || 0,
          growth: analytics.revenue_stats?.growth_percentage || 0
        },
        performance: {
          avgRepairTime: analytics.technician_stats?.performance_summary?.avg_repair_time || 0,
          successRate: analytics.device_stats?.total > 0 ? (analytics.device_stats.completed / analytics.device_stats.total) * 100 : 0,
          customerSatisfaction: analytics.device_stats?.total > 0 ? (analytics.device_stats.completed / analytics.device_stats.total) * 100 : 0,
          technicianEfficiency: analytics.technician_stats?.performance_summary?.avg_repair_time > 0 ? Math.max(0, 100 - (analytics.technician_stats.performance_summary.avg_repair_time * 10)) : 0
        },
        trends: {
          monthly: analytics.trends?.monthly?.map(item => ({
            month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            devices: item.devices,
            revenue: item.revenue
          })) || [],
          daily: analytics.trends?.daily?.map(item => ({
            date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            devices: item.devices,
            revenue: item.revenue
          })) || [],
          deviceTypes: analytics.trends?.device_types || [],
          statusDistribution: analytics.trends?.status_distribution || []
        },
        topTechnicians: analytics.technician_stats?.top_technicians?.map(tech => ({
          id: tech.id,
          name: tech.name,
          completedDevices: tech.completed_devices,
          avgTime: tech.avg_repair_time,
          satisfaction: tech.completed_devices > 0 ? Math.min(5, 3 + (tech.completed_devices / 10)) : 3 // Real satisfaction based on performance
        })) || [],
        topCustomers: [] // Will be populated separately if needed
      };

      // Get top customers separately if needed (only for short time ranges)
      if (timeRange === '7d' || timeRange === '30d') {
        const topCustomers = await analyticsService.getTopCustomers(5);
        processedData.topCustomers = topCustomers.map(customer => ({
          id: customer.id,
          name: customer.name || customer.email || `Customer ${customer.id}`,
          totalDevices: customer.total_devices,
          totalSpent: customer.total_spent,
          lastVisit: customer.last_visit
        }));
      }

      setData(processedData);
      setCachedData(processedData);
      setDataLoaded(true);
      setLastUpdate(new Date());
      
      // Update notifications based on new data
      setTimeout(() => loadNotifications(), 100);
      
    } catch (error) {
      console.error('[AdvancedAnalytics] Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, getCachedData, setCachedData, dataLoaded, loadNotifications]); // Add missing dependencies

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    loadAnalyticsData(true); // Force refresh
    toast.success('Analytics data refreshed');
  }, [loadAnalyticsData]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    toast('Auto-refresh is disabled');
  }, []);

  // Pre-download all analytics data for offline use
  const preDownloadForOffline = useCallback(async () => {
    try {
      setLoading(true);
      toast('Downloading analytics data for offline use...');
      
      // Download data for all time ranges
      const timeRanges: Array<'7d' | '30d' | '90d' | '1y'> = ['7d', '30d', '90d', '1y'];
      
      for (const range of timeRanges) {
        const rangeCacheKey = `analytics_${range}`;
        
        // Fetch data for this time range
        const analytics = await analyticsService.getComprehensiveAnalytics();
        
        if (analytics) {
          const processedData: AnalyticsData = {
            devices: {
              total: analytics.device_stats?.total || 0,
              completed: analytics.device_stats?.completed || 0,
              inProgress: analytics.device_stats?.in_repair || 0,
              overdue: analytics.device_stats?.overdue || 0,
              pending: analytics.device_stats?.pending || 0,
            },
            customers: {
              total: analytics.customer_stats?.total || 0,
              newThisMonth: analytics.customer_stats?.new_this_month || 0,
              returning: analytics.customer_stats?.returning || 0,
              active: analytics.customer_stats?.active || 0,
            },
            revenue: {
              total: analytics.revenue_stats?.total || 0,
              thisMonth: analytics.revenue_stats?.this_month || 0,
              lastMonth: analytics.revenue_stats?.last_month || 0,
              growth: analytics.revenue_stats?.growth_percentage || 0
            },
            performance: {
              avgRepairTime: analytics.technician_stats?.performance_summary?.avg_repair_time || 0,
              successRate: analytics.device_stats?.total > 0 ? (analytics.device_stats.completed / analytics.device_stats.total) * 100 : 0,
              customerSatisfaction: analytics.device_stats?.total > 0 ? (analytics.device_stats.completed / analytics.device_stats.total) * 100 : 0,
              technicianEfficiency: analytics.technician_stats?.performance_summary?.avg_repair_time > 0 ? Math.max(0, 100 - (analytics.technician_stats.performance_summary.avg_repair_time * 10)) : 0
            },
            trends: {
              monthly: analytics.trends?.monthly?.map(item => ({
                month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                devices: item.devices,
                revenue: item.revenue
              })) || [],
              daily: analytics.trends?.daily?.map(item => ({
                date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                devices: item.devices,
                revenue: item.revenue
              })) || [],
              deviceTypes: analytics.trends?.device_types || [],
              statusDistribution: analytics.trends?.status_distribution || []
            },
            topTechnicians: analytics.technician_stats?.top_technicians?.map(tech => ({
              id: tech.id,
              name: tech.name,
              completedDevices: tech.completed_devices,
              avgTime: tech.avg_repair_time,
              satisfaction: tech.completed_devices > 0 ? Math.min(5, 3 + (tech.completed_devices / 10)) : 3 // Real satisfaction based on performance
            })) || [],
            topCustomers: []
          };
          
          // Save to offline cache
          localStorage.setItem(`offline_analytics_${rangeCacheKey}`, JSON.stringify({
            data: processedData,
            timestamp: Date.now()
          }));
        }
      }
      
      toast.success('Analytics data downloaded for offline use!');
      setLoading(false);
    } catch (error) {
      console.error('[Analytics] Error pre-downloading data:', error);
      toast.error('Failed to download offline data');
      setLoading(false);
    }
  }, []);

  const processAnalyticsData = (agg: any): AnalyticsData => {
    // Use pre-aggregated stats and fallback to empty arrays if needed
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const deviceStats = agg.deviceStats || {};
    const customersCount = agg.customersCount || 0;
    const newCustomers = agg.newCustomers || [];
    const totalRevenue = agg.totalRevenue || 0;
    const thisMonthRevenue = agg.thisMonthRevenue || 0;
    const lastMonthRevenue = agg.lastMonthRevenue || 0;
    const devices = agg.devicesData || [];
    const sales = agg.trendsSalesData || [];
    const salesTableExists = agg.salesTableExists;

    // Trends and top lists only for small time ranges
    const monthlyTrends = devices.length > 0 ? generateMonthlyTrends(devices, sales) : [];
    const dailyTrends = devices.length > 0 ? generateDailyTrends(devices, sales, timeRange) : [];
    const deviceTypes = devices.length > 0 ? generateDeviceTypeDistribution(devices) : [];
    const statusDistribution = devices.length > 0 ? generateStatusDistribution(devices) : [];
    const topTechnicians = devices.length > 0 ? generateTopTechnicians(devices) : [];
    const topCustomers = devices.length > 0 ? generateTopCustomers(newCustomers, devices) : [];

    // Calculate revenue growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    return {
      devices: {
        total: deviceStats.totalDevices || 0,
        completed: deviceStats.completed || 0,
        inProgress: deviceStats.inRepair || 0,
        overdue: deviceStats.overdue || 0,
        pending: deviceStats.pending || 0,
      },
      customers: {
        total: customersCount,
        newThisMonth: newCustomers.length,
        returning: 0, // Not available in optimized query
        active: 0 // Not available in optimized query
      },
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth: revenueGrowth
      },
      performance: {
        avgRepairTime: 0, // Not available in optimized query
        successRate: deviceStats.totalDevices > 0 ? (deviceStats.completed / deviceStats.totalDevices) * 100 : 0,
        customerSatisfaction: deviceStats.totalDevices > 0 ? (deviceStats.completed / deviceStats.totalDevices) * 100 : 0,
        technicianEfficiency: 0 // Not available in optimized query
      },
      trends: {
        monthly: monthlyTrends,
        daily: dailyTrends,
        deviceTypes,
        statusDistribution
      },
      topTechnicians,
      topCustomers
    };
  };

  const generateMonthlyTrends = (devices: any[], sales: any[]): Array<{ month: string; devices: number; revenue: number }> => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthDevices = devices.filter(d => {
        const deviceDate = new Date(d.created_at);
        return deviceDate.getMonth() === date.getMonth() && deviceDate.getFullYear() === date.getFullYear();
      }).length;

      const monthRevenue = sales.length > 0
        ? sales.filter(s => {
            const saleDate = new Date(s.created_at);
            return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
          }).reduce((sum, sale) => sum + (sale.total || 0), 0)
        : devices.filter(d => {
            const deviceDate = new Date(d.created_at);
            return deviceDate.getMonth() === date.getMonth() && deviceDate.getFullYear() === date.getFullYear();
          }).reduce((sum, device) => sum + (device.repair_cost || 0), 0);

      months.push({ month: monthStr, devices: monthDevices, revenue: monthRevenue });
    }
    return months;
  };

  const generateDailyTrends = (devices: any[], sales: any[], range: string): Array<{ date: string; devices: number; revenue: number }> => {
    const days = [];
    const daysToShow = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayDevices = devices.filter(d => {
        const deviceDate = new Date(d.created_at);
        return deviceDate.toDateString() === date.toDateString();
      }).length;

      const dayRevenue = sales.length > 0
        ? sales.filter(s => {
            const saleDate = new Date(s.created_at);
            return saleDate.toDateString() === date.toDateString();
          }).reduce((sum, sale) => sum + (sale.total || 0), 0)
        : devices.filter(d => {
            const deviceDate = new Date(d.created_at);
            return deviceDate.toDateString() === date.toDateString();
          }).reduce((sum, device) => sum + (device.repair_cost || 0), 0);

      days.push({ date: dateStr, devices: dayDevices, revenue: dayRevenue });
    }
    return days;
  };

  const generateDeviceTypeDistribution = (devices: any[]): Array<{ type: string; count: number; percentage: number }> => {
    const typeCount = devices.reduce((acc, device) => {
      const type = device.device_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = devices.length;
    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      count: Number(count),
      percentage: (Number(count) / total) * 100
    }));
  };

  const generateStatusDistribution = (devices: any[]): Array<{ status: string; count: number; percentage: number }> => {
    const statusCount = devices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = devices.length;
    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      count: Number(count),
      percentage: (Number(count) / total) * 100
    }));
  };

  const generateTopTechnicians = (devices: any[]): Array<{ id: string; name: string; completedDevices: number; avgTime: number; satisfaction: number }> => {
    // This would typically come from a technicians table
    // For now, we'll generate sample data based on device assignments
    const technicianStats = devices.reduce((acc, device) => {
      const techId = typeof device.technician_id === 'string' ? device.technician_id : 'unknown';
      if (!acc[techId]) {
        acc[techId] = {
          id: techId,
          name: `Technician ${techId}`,
          completedDevices: 0,
          totalTime: 0,
          deviceCount: 0
        };
      }
      
      if (device.status === 'completed') {
        acc[techId].completedDevices++;
      }
      
      if (device.completed_at && device.created_at && typeof device.completed_at === 'string' && typeof device.created_at === 'string') {
        const timeDiff = new Date(device.completed_at).getTime() - new Date(device.created_at).getTime();
        acc[techId].totalTime += timeDiff / (1000 * 60 * 60 * 24); // Convert to days
      }
      
      acc[techId].deviceCount++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(technicianStats)
      .map((tech: any) => ({
        id: tech.id,
        name: tech.name,
        completedDevices: tech.completedDevices,
        avgTime: tech.completedDevices > 0 ? tech.totalTime / tech.completedDevices : 0,
        satisfaction: tech.completedDevices > 0 ? Math.min(5, 3 + (tech.completedDevices / 10)) : 3 // Real satisfaction based on performance
      }))
      .sort((a, b) => b.completedDevices - a.completedDevices)
      .slice(0, 3);
  };

  const generateTopCustomers = (customers: any[], devices: any[]): Array<{ id: string; name: string; totalDevices: number; totalSpent: number; lastVisit: string }> => {
    return customers
      .map(customer => {
        const customerDevices = Array.isArray(devices) ? devices.filter(d => d.customer_id === customer.id) : [];
        const totalSpent = customerDevices.reduce((sum, device) => sum + (device.repair_cost || 0), 0);
        return {
          id: customer.id,
          name: customer.name || customer.email || `Customer ${customer.id}`,
          totalDevices: typeof customer.total_devices === 'number' ? customer.total_devices : customerDevices.length,
          totalSpent,
          lastVisit: customer.last_visit || customer.created_at
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  };

  const exportAnalytics = () => {
    if (!data) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Devices', data.devices.total],
      ['Completed Devices', data.devices.completed],
      ['In Progress', data.devices.inProgress],
      ['Overdue', data.devices.overdue],
      ['Total Customers', data.customers.total],
      ['New This Month', data.customers.newThisMonth],
      ['Total Revenue', data.revenue.total],
      ['This Month Revenue', data.revenue.thisMonth],
      ['Revenue Growth', `${data.revenue.growth.toFixed(2)}%`],
      ['Average Repair Time', `${data.performance.avgRepairTime.toFixed(1)} days`],
      ['Success Rate', `${data.performance.successRate.toFixed(1)}%`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully!');
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Load analytics data and recent activities on mount
  useEffect(() => {
    loadAnalyticsData();
    loadRecentActivities();
  }, []); // Remove dependencies to prevent infinite loops

  // Update notifications when data changes (separate effect to avoid infinite loop)
  useEffect(() => {
    if (data) {
      loadNotifications();
    }
  }, [data]); // Remove loadNotifications dependency to prevent infinite loops

  useEffect(() => {
    const fetchReadyForPickup = async () => {
      try {
        const allDevices = await deviceServices.getAllDevices();
        setReadyForPickupDevices(allDevices.filter((d: any) => d.status === 'ready-for-pickup'));
      } catch (err) {
        setReadyForPickupDevices([]);
      }
    };
    fetchReadyForPickup();
  }, []);

  const loadSmsAnalytics = useCallback(async () => {
    setSmsLoading(true);
    try {
      const stats = await smsService.getSMSStats();
      setSmsStats(stats);
      const balance = await smsService.checkBalance();
      setSmsBalance(balance.success ? parseFloat(balance.balance || '0') : 0);
    } catch (e) {
      console.error('Error loading SMS analytics:', e);
      toast.error('Failed to load SMS analytics.');
    } finally {
      setSmsLoading(false);
    }
  }, []);

  const loadSmsLogs = useCallback(async () => {
    setSmsLogsLoading(true);
    try {
      const logs = await smsService.getSMSLogs();
      setSmsLogs(logs);
    } catch (e) {
      toast.error('Failed to load SMS logs.');
    } finally {
      setSmsLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSmsAnalytics();
    loadSmsLogs();
  }, []); // Remove dependencies to prevent infinite loops

  const handleSendTestSMS = async () => {
    setSmsSending(true);
    try {
      const result = await smsService.sendSMS(smsPhone, smsMessage);
      if (result.success) {
        toast.success('Test SMS sent successfully!');
        setShowSmsModal(false);
        setSmsPhone('');
        setSmsMessage('');
      } else {
        toast.error('Failed to send SMS: ' + (result.error || 'Unknown error'));
      }
    } catch (e: any) {
      toast.error('Failed to send SMS: ' + (e.message || 'Unknown error'));
    } finally {
      setSmsSending(false);
    }
  };

  const handleCheckStatus = async (log: any) => {
    setCheckingStatusId(log.id);
    try {
      const result = await smsService.checkDeliveryStatus(log.external_id || log.id);
      if (result.success && result.status) {
        toast.success(`Status: ${result.status}`);
        // Optionally update the log in UI
        setSmsLogs((prev) => prev.map(l => l.id === log.id ? { ...l, status: result.status } : l));
      } else {
        toast.error('Failed to check status: ' + (result.error || 'Unknown error'));
      }
    } catch (e: any) {
      toast.error('Failed to check status: ' + (e.message || 'Unknown error'));
    } finally {
      setCheckingStatusId(null);
    }
  };

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Back online - refreshing data...');
      // Refresh data when coming back online
      setTimeout(() => {
        loadAnalyticsData(true);
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 Going offline - using cached data');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's a data error
  if (dataError) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
            <p className="text-red-600 mb-4">{dataError}</p>
            <button
              onClick={() => {
                setDataError(null);
                loadAnalyticsData(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-red-600">No analytics data loaded. Click Refresh to load.</p>
            <GlassButton onClick={handleManualRefresh} className="mt-4">
              <RefreshCw size={16} />
              Refresh
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }



  // Add quick action buttons for returns


  return (
    <div className="min-h-screen">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center font-medium">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle size={16} />
            <span>You're offline. Some features may be limited. Data will sync when connection is restored.</span>
          </div>
        </div>
      )}
      
      {/* Content Container */}
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Redesigned Minimal Header Card */}
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6">
              {/* Simplified Header Row */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                {/* Clean Title Section */}
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-2">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {isAdmin ? 'Welcome back! Here\'s your comprehensive overview' : 
                     isCustomerCare ? 'Welcome back! Here\'s your customer care overview' : 
                     'Welcome back! Here\'s your technician overview (customer data hidden for privacy)'}
                  </p>
                </div>

                {/* Minimal Status Indicators */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Search Bar - Full Width */}
              <div className="mb-4">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search analytics, devices, customers, or reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-300 text-gray-800 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Reorganized Action Buttons by Usage Priority */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Primary Actions - Most Used */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                  </button>

                  <button
                    onClick={toggleAutoRefresh}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all duration-300 font-medium ${
                      autoRefreshEnabled 
                        ? 'bg-green-500 text-white shadow-md hover:shadow-lg' 
                        : 'bg-white/60 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/70 hover:shadow-md'
                    }`}
                  >
                    <Clock size={16} />
                    <span>{autoRefreshEnabled ? 'Auto On' : 'Auto Off'}</span>
                  </button>
                </div>

                {/* Secondary Actions - Frequently Used */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg shadow-sm hover:bg-white/70 hover:shadow-md transition-all duration-300 text-gray-700 font-medium"
                  >
                    <Filter size={16} />
                    <span>Filters</span>
                  </button>

                  {/* Notifications - Important but not primary */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg shadow-sm hover:bg-white/70 transition-all duration-300 hover:shadow-md"
                    >
                      <Bell size={16} className="text-gray-600" />
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>
                    
                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 z-50">
                        <div className="p-3 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              No notifications
                            </div>
                          ) : (
                            notifications.map(notification => (
                              <div
                                key={notification.id}
                                className={`p-3 border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors ${
                                  !notification.read ? 'bg-blue-50/50' : ''
                                }`}
                                onClick={() => markNotificationAsRead(notification.id)}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`mt-0.5 p-1 rounded-full ${
                                    notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                    notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                    notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {notification.type === 'warning' ? <AlertCircle size={12} /> :
                                     notification.type === 'error' ? <AlertTriangle size={12} /> :
                                     notification.type === 'success' ? <CheckCircle size={12} /> :
                                     <Info size={12} />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-900">{notification.message}</p>
                                    <p className="text-xs text-gray-500">{notification.time}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions - Advanced Features */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportAnalytics}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg shadow-sm hover:bg-orange-600 hover:shadow-md transition-all duration-300 font-medium"
                    >
                      <Download size={16} />
                      <span>Export Data</span>
                    </button>
                    <button
                      onClick={preDownloadForOffline}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-sm hover:bg-purple-600 hover:shadow-md transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={16} />
                      <span>{loading ? 'Downloading...' : 'Offline Mode'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Notice for Technicians */}
          {isTechnician && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Privacy Notice</h3>
                    <p className="text-sm text-blue-700">
                      Customer information has been hidden to protect privacy. You can still view device status and repair progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Quick Actions */}
          {quickActionsEnabled && quickActions.length > 0 && (
            <div className="mb-8">
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Target size={20} className="text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                  <div className="text-sm text-gray-500">Access frequently used features</div>
                </div>
                <div className={`grid gap-4 ${getGridClasses()}`}>
                  {quickActions
                    .filter(action => {
                      // Filter actions based on user role
                      if (isAdmin) return true; // Admin sees all actions
                      if (isCustomerCare) {
                        // Customer care sees most actions except admin-specific ones
                        return !action.name.toLowerCase().includes('admin') && 
                               !action.name.toLowerCase().includes('system');
                      }
                      if (isTechnician) {
                        // Technicians see only device and repair related actions (no customer info for privacy)
                        return action.name.toLowerCase().includes('device') || 
                               action.name.toLowerCase().includes('repair') ||
                               action.name.toLowerCase().includes('assessment');
                      }
                      return false;
                    })
                    .map((action, index) => {
                      const IconComponent = action.iconComponent;
                      return (
                        <button
                          key={action.id}
                          onClick={action.action}
                          className={`${getActionButtonClasses(action)} rounded-xl hover:shadow-xl transition-all duration-300 group transform hover:scale-105 hover:-translate-y-1`}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="group-hover:scale-110 transition-transform duration-300">
                              <IconComponent size={getIconSize()} />
                            </div>
                            <div className="text-center">
                              <p className={`font-medium ${getTextSize()}`}>{action.name}</p>
                              {shouldShowDescription(action) && (
                                <p className="text-xs opacity-90 mt-1">{action.description}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Filters */}
          {showFilters && (
            <div className="mb-8">
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as any)}
                      className="w-full p-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    >
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="1y">Last Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full p-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="received">Received</option>
                      <option value="in-repair">In Repair</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Card - Admin and Customer Care only */}
            {(isAdmin || isCustomerCare) && (
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${data?.revenue.total.toLocaleString() || ''}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {data?.revenue.growth !== undefined && data?.revenue.growth >= 0 ? (
                        <TrendingUp size={16} className="text-green-500" />
                      ) : (
                        <TrendingDown size={16} className="text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${data?.revenue.growth !== undefined && data?.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data?.revenue.growth !== undefined ? (data?.revenue.growth >= 0 ? '+' : '') + data?.revenue.growth.toFixed(1) : ''}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Smartphone size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Devices</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.devices.total || ''}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {data?.devices.completed} completed
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Metrics - Hidden for technicians for privacy */}
            {canViewCustomerInfo && (
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{data?.customers.total || ''}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {data?.customers.newThisMonth} new this month
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <Clock size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Repair Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.performance.avgRepairTime.toFixed(1) || ''}d
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {data?.performance.successRate.toFixed(1) || ''}% success rate
                  </p>
                </div>
              </div>
            </div>
            <CustomerTagWidget />
            
            {/* Device Repair Status Overview */}
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Repair Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.devices.inProgress || 0} Active
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {data?.devices.completed || 0} completed today
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bars */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium">{data?.devices.inProgress || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${data?.devices.total ? ((data.devices.inProgress || 0) / data.devices.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{data?.devices.completed || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${data?.devices.total ? ((data.devices.completed || 0) / data.devices.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Overdue</span>
                  <span className="font-medium">{data?.devices.overdue || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${data?.devices.total ? ((data.devices.overdue || 0) / data.devices.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Recent Activity - Filtered for privacy */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Activity size={20} className="text-gray-400" />
              </div>
              <div className="space-y-3">
                {recentActivities
                  .filter(activity => {
                    // Filter out customer-related activities for technicians
                    if (isTechnician) {
                      return !activity.type.includes('customer') && !activity.message.toLowerCase().includes('customer');
                    }
                    return true; // Admin and Customer Care see all activities
                  })
                  .map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </GlassCard>

            {/* Device Status Distribution */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
                <PieChart size={20} className="text-gray-400" />
              </div>
              <div className="space-y-3">
                {data?.trends.statusDistribution.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'completed' ? 'bg-green-500' :
                        status.status === 'in-repair' ? 'bg-blue-500' :
                        status.status === 'received' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm font-medium capitalize">{status.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{status.count}</p>
                      <p className="text-xs text-gray-500">{status.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Performance Metrics */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                <Award size={20} className="text-gray-400" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Success Rate</span>
                    <span>{data?.performance.successRate.toFixed(1) || ''}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${data?.performance.successRate || 0}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Customer Satisfaction</span>
                    <span>{data?.performance.customerSatisfaction || ''}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${data?.performance.customerSatisfaction || 0}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Technician Efficiency</span>
                    <span>{data?.performance.technicianEfficiency || ''}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${data?.performance.technicianEfficiency || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Technicians */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Technicians</h3>
                <Users size={20} className="text-gray-400" />
              </div>
              <div className="space-y-3">
                {data?.topTechnicians && data.topTechnicians.length > 0 ? (
                  data.topTechnicians.map((tech, index) => (
                    <div key={tech.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tech.name || 'Unknown Technician'}</p>
                          <p className="text-sm text-gray-500">{tech.completedDevices || 0} devices</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{(tech.avgTime || 0).toFixed(1)}d avg</p>
                        <p className="text-xs text-gray-500">⭐ {(tech.satisfaction || 0).toFixed(1)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No top technicians data available</p>
                    <p className="text-gray-400 text-xs mt-1">Check if technicians exist and have completed repairs</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Top Customers - Admin and Customer Care only (Privacy: No technician access) */}
            {canViewCustomerInfo && (
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
                  <Users size={20} className="text-gray-400" />
                </div>
                <div className="space-y-3">
                  {data?.topCustomers && data.topCustomers.length > 0 ? (
                    data.topCustomers.map((customer, index) => (
                      <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name || 'Unknown Customer'}</p>
                            <p className="text-sm text-gray-500">{customer.totalDevices || 0} devices</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">${((customer.totalSpent || 0) as number).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">No top customers data available</p>
                      <p className="text-gray-400 text-xs mt-1">Check if top_customers_view exists in database</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Charts Section - Placeholder for now */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue & Device Trends</h3>
              <BarChart3 size={20} className="text-gray-400" />
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Interactive charts coming soon</p>
                <p className="text-sm text-gray-400">Revenue trends and device processing analytics</p>
              </div>
            </div>
          </GlassCard>

          {/* SMS Analytics Section - Admin only */}
          {isAdmin && (
            <GlassCard className="mb-6">
              <h2 className="flex items-center gap-2 mb-4"><MessageCircle size={20} /> SMS Analytics</h2>
              {smsLoading ? (
                <div className="p-4"><span>Loading SMS stats...</span></div>
              ) : smsStats ? (
                <div className="flex flex-wrap gap-6 p-4">
                  <div className="min-w-[120px]"><Send size={18} /> Sent: <b>{smsStats.sent}</b></div>
                  <div className="min-w-[120px]"><AlertTriangle size={18} className="text-yellow-500" /> Failed: <b>{smsStats.failed}</b></div>
                  <div className="min-w-[120px]"><CheckCircle size={18} className="text-green-500" /> Delivered: <b>{smsStats.delivered}</b></div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle size={32} className="mx-auto mb-2" />
                  <p>No SMS data available</p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Recent Activity Section */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Activity size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${activity.color}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;