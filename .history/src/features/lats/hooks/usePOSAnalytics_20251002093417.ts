import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDynamicDataStore } from '../lib/data/dynamicDataStore';
import { salesAnalyticsService } from '../lib/salesAnalyticsService';

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
    
    // Calculate top products from real sales data
    const topProducts = todaySales.reduce((acc: { [key: string]: { name: string; sales: number } }, sale) => {
      if (sale.items) {
        sale.items.forEach((item: any) => {
          const productName = item.productName || item.name || 'Unknown Product';
          if (acc[productName]) {
            acc[productName].sales += item.total || item.totalPrice || 0;
          } else {
            acc[productName] = {
              name: productName,
              sales: item.total || item.totalPrice || 0
            };
          }
        });
      }
      return acc;
    }, {});

    const topProductsArray = Object.values(topProducts)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Get low stock items from inventory (placeholder - would need inventory integration)
    const lowStockItems = [];

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      topProducts: topProductsArray,
      lowStockItems
    };
  }, [sales]);

  // Get product performance
  const getProductPerformance = useCallback(async (timeRange?: TimeRange): Promise<ProductPerformance[]> => {
    try {
      setIsLoadingAnalytics(true);
      setAnalyticsError('');

      // Get real sales data from database
      const { data: salesData, error: salesError } = await supabase
        .from('lats_sales')
        .select(`
          id,
          total_amount,
          created_at,
          lats_sale_items (
            id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            total_price,
            lats_products (
              id,
              name,
              cost_price
            ),
            lats_product_variants (
              id,
              name,
              cost_price,
              selling_price
            )
          )
        `)
        .gte('created_at', timeRange === '30d' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() : 
             timeRange === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() :
             new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (salesError) throw salesError;

      // Process sales data to calculate product performance
      const productPerformanceMap = new Map<string, {
        productId: string;
        name: string;
        unitsSold: number;
        revenue: number;
        cost: number;
        profit: number;
        margin: number;
      }>();

      salesData?.forEach(sale => {
        sale.lats_sale_items?.forEach(item => {
          const product = item.lats_products || item.lats_product_variants;
          if (!product) return;

          const productId = product.id;
          const productName = product.name;
          const unitsSold = item.quantity || 0;
          const revenue = item.total_price || 0;
          const costPrice = product.cost_price || 0;
          const cost = costPrice * unitsSold;
          const profit = revenue - cost;
          const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

          if (productPerformanceMap.has(productId)) {
            const existing = productPerformanceMap.get(productId)!;
            existing.unitsSold += unitsSold;
            existing.revenue += revenue;
            existing.cost += cost;
            existing.profit += profit;
            existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
          } else {
            productPerformanceMap.set(productId, {
              productId,
              name: productName,
              unitsSold,
              revenue,
              cost,
              profit,
              margin
            });
          }
        });
      });

      // Convert to array and sort by revenue
      const performance: ProductPerformance[] = Array.from(productPerformanceMap.values())
        .map(item => ({
          productId: item.productId,
          name: item.name,
          unitsSold: item.unitsSold,
          revenue: item.revenue,
          profit: item.profit,
          margin: Math.round(item.margin * 100) / 100
        }))
        .sort((a, b) => b.revenue - a.revenue);

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
