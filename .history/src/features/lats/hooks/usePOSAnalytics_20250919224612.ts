import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDynamicDataStore } from '../lib/data/dynamicDataStore';

interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalTransactions: number;
  growthRate: number;
}

interface DailyStats {
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  topProducts: Array<{ name: string; sales: number }>;
  lowStockItems: Array<{ name: string; stock: number }>;
}

interface ProductPerformance {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  margin: number;
}

interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageCustomerValue: number;
  topCustomers: Array<{ name: string; totalSpent: number; visits: number }>;
}

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export const usePOSAnalytics = () => {
  const { sales } = useDynamicDataStore();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date(),
    label: 'Last 7 Days'
  });
  
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string>('');

  // Calculate sales metrics
  const getSalesMetrics = useMemo((): SalesMetrics => {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= selectedTimeRange.start && saleDate <= selectedTimeRange.end;
    });

    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate growth rate (simplified)
    const previousPeriodStart = new Date(selectedTimeRange.start.getTime() - (selectedTimeRange.end.getTime() - selectedTimeRange.start.getTime()));
    const previousPeriodSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= previousPeriodStart && saleDate < selectedTimeRange.start;
    });
    
    const previousRevenue = previousPeriodSales.reduce((sum, sale) => sum + sale.total, 0);
    const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      totalTransactions: totalSales,
      growthRate
    };
  }, [sales, selectedTimeRange]);

  // Calculate daily statistics
  const getDailyStats = useMemo((): DailyStats => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
      new Date(sale.date).toDateString() === today
    );
    
    const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = todaySales.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Mock top products (in real app, this would come from database)
    const topProducts = [
      { name: 'iPhone 14 Pro', sales: 45000 },
      { name: 'Samsung Galaxy S23', sales: 38000 },
      { name: 'MacBook Pro 14"', sales: 32000 },
      { name: 'AirPods Pro', sales: 28000 },
      { name: 'iPad Air', sales: 22000 }
    ];
    
    // Mock low stock items
    const lowStockItems = [
      { name: 'iPhone 14 Pro', stock: 3 },
      { name: 'Samsung Galaxy S23', stock: 5 },
      { name: 'MacBook Pro 14"', stock: 2 },
      { name: 'AirPods Pro', stock: 8 },
      { name: 'iPad Air', stock: 4 }
    ];

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      topProducts,
      lowStockItems
    };
  }, [sales]);

  // Get product performance
  const getProductPerformance = useCallback(async (timeRange?: TimeRange): Promise<ProductPerformance[]> => {
    try {
      setIsLoadingAnalytics(true);
      setAnalyticsError('');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock product performance data
      const performance: ProductPerformance[] = [
        {
          productId: '1',
          name: 'iPhone 14 Pro',
          unitsSold: 15,
          revenue: 2400000,
          profit: 480000,
          margin: 20
        },
        {
          productId: '2',
          name: 'Samsung Galaxy S23',
          unitsSold: 12,
          revenue: 1560000,
          profit: 312000,
          margin: 20
        },
        {
          productId: '3',
          name: 'MacBook Pro 14"',
          unitsSold: 8,
          revenue: 2400000,
          profit: 480000,
          margin: 20
        },
        {
          productId: '4',
          name: 'AirPods Pro',
          unitsSold: 25,
          revenue: 700000,
          profit: 140000,
          margin: 20
        },
        {
          productId: '5',
          name: 'iPad Air',
          unitsSold: 10,
          revenue: 800000,
          profit: 160000,
          margin: 20
        }
      ];

      return performance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load product performance';
      setAnalyticsError(errorMessage);
      return [];
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Get customer analytics
  const getCustomerAnalytics = useCallback(async (): Promise<CustomerAnalytics> => {
    try {
      setIsLoadingAnalytics(true);
      setAnalyticsError('');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock customer analytics data
      const analytics: CustomerAnalytics = {
        totalCustomers: 1250,
        newCustomers: 45,
        repeatCustomers: 180,
        averageCustomerValue: 85000,
        topCustomers: [
          { name: 'John Doe', totalSpent: 450000, visits: 12 },
          { name: 'Jane Smith', totalSpent: 380000, visits: 8 },
          { name: 'Mike Johnson', totalSpent: 320000, visits: 15 },
          { name: 'Sarah Wilson', totalSpent: 280000, visits: 6 },
          { name: 'David Brown', totalSpent: 220000, visits: 10 }
        ]
      };

      return analytics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load customer analytics';
      setAnalyticsError(errorMessage);
      return {
        totalCustomers: 0,
        newCustomers: 0,
        repeatCustomers: 0,
        averageCustomerValue: 0,
        topCustomers: []
      };
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Get sales trend data
  const getSalesTrend = useCallback(async (days: number = 30): Promise<Array<{ date: string; sales: number; revenue: number }>> => {
    try {
      setIsLoadingAnalytics(true);
      setAnalyticsError('');

      // Fetch real sales trend data
      const period = days <= 7 ? '7d' : days <= 30 ? '30d' : '90d';
      const salesData = await salesAnalyticsService.getSalesAnalytics(period);
      
      if (!salesData || !salesData.dailySales) {
        return [];
      }

      // Map the daily sales data to the expected format
      const trend = salesData.dailySales.map(day => ({
        date: day.date,
        sales: day.transactions,
        revenue: day.sales
      }));

      return trend;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sales trend';
      setAnalyticsError(errorMessage);
      return [];
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Export analytics data
  const exportAnalytics = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setIsLoadingAnalytics(true);
      setAnalyticsError('');

      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const metrics = getSalesMetrics;
      const dailyStats = getDailyStats;
      
      // Create export data
      const exportData = {
        timeRange: selectedTimeRange,
        metrics,
        dailyStats,
        exportDate: new Date().toISOString()
      };

      // Simulate file download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-analytics-${selectedTimeRange.label.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export analytics';
      setAnalyticsError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [getSalesMetrics, getDailyStats, selectedTimeRange]);

  // Predefined time ranges
  const timeRanges = useMemo(() => [
    { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(), label: 'Today' },
    { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date(), label: 'Last 7 Days' },
    { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date(), label: 'Last 30 Days' },
    { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date(), label: 'Last 90 Days' }
  ], []);

  return {
    // State
    selectedTimeRange,
    isLoadingAnalytics,
    analyticsError,
    
    // Data
    getSalesMetrics,
    getDailyStats,
    timeRanges,
    
    // Actions
    setSelectedTimeRange,
    getProductPerformance,
    getCustomerAnalytics,
    getSalesTrend,
    exportAnalytics
  };
};
