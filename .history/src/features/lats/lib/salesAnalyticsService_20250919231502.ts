import { supabase } from '../../../lib/supabaseClient';

export interface SalesAnalyticsData {
  dailySales: Array<{
    date: string;
    sales: number;
    transactions: number;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
    quantity: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  customerSegments: Array<{
    segment: string;
    sales: number;
    customers: number;
    percentage: number;
  }>;
  metrics: {
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
    growthRate: number;
  };
}

export interface SalesStats {
  total_sales: number;
  total_revenue: number;
  today_sales: number;
  today_revenue: number;
  this_month_sales: number;
  this_month_revenue: number;
  average_sale: number;
}

class SalesAnalyticsService {
  async getSalesAnalytics(period: string = '7d'): Promise<SalesAnalyticsData | null> {
    try {
      console.log('📊 Fetching sales analytics for period:', period);
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Fetch sales data (simplified query without complex joins)
      const { data: sales, error: salesError } = await supabase
        .from('lats_sales')
        .select(`
          *,
          lats_sale_items(
            *,
            lats_products(name, description),
            lats_product_variants(name, sku, attributes)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        return null;
      }

      if (!sales || sales.length === 0) {
        console.log('No sales data found for the selected period');
        return this.getEmptyData();
      }

      console.log(`✅ Found ${sales.length} sales records`);

      // Process daily sales
      const dailySales = this.processDailySales(sales, startDate, endDate);
      
      // Process top products
      const topProducts = this.processTopProducts(sales);
      
      // Process payment methods
      const paymentMethods = this.processPaymentMethods(sales);
      
      // Process customer segments
      const customerSegments = this.processCustomerSegments(sales);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(sales, dailySales);

      return {
        dailySales,
        topProducts,
        paymentMethods,
        customerSegments,
        metrics
      };

    } catch (error) {
      console.error('Error in getSalesAnalytics:', error);
      return null;
    }
  }

  private processDailySales(sales: any[], startDate: Date, endDate: Date) {
    const dailyMap = new Map<string, { sales: number; transactions: number }>();
    
    // Initialize all days in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateKey, { sales: 0, transactions: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate sales by date
    sales.forEach(sale => {
      const dateKey = new Date(sale.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { sales: 0, transactions: 0 };
      existing.sales += sale.total_amount || 0;
      existing.transactions += 1;
      dailyMap.set(dateKey, existing);
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      transactions: data.transactions
    }));
  }

  private processTopProducts(sales: any[]) {
    const productMap = new Map<string, { sales: number; quantity: number }>();
    
    sales.forEach(sale => {
      sale.lats_sale_items?.forEach((item: any) => {
        // Try to get product name from multiple sources
        let productName = 'Unknown Product';
        
        // Try to get from the sale item data
        if (item.product_name) {
          productName = item.product_name;
        } else if (item.sku) {
          productName = `Product (${item.sku})`;
        } else if (item.product_id) {
          productName = `Product ${item.product_id.slice(0, 8)}`;
        } else if (item.variant_id) {
          productName = `Variant ${item.variant_id.slice(0, 8)}`;
        }
        
        const existing = productMap.get(productName) || { sales: 0, quantity: 0 };
        existing.sales += item.total_price || 0;
        existing.quantity += item.quantity || 0;
        productMap.set(productName, existing);
      });
    });

    const totalSales = Array.from(productMap.values()).reduce((sum, product) => sum + product.sales, 0);
    
    const processedProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        sales: data.sales,
        quantity: data.quantity,
        percentage: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    
    // If no products found, return empty array
    if (processedProducts.length === 0) {
      return [];
    }
    
    return processedProducts;
  }

  private processPaymentMethods(sales: any[]) {
    const methodMap = new Map<string, number>();
    
    sales.forEach(sale => {
      const method = sale.payment_method || 'Unknown';
      const existing = methodMap.get(method) || 0;
      methodMap.set(method, existing + (sale.total_amount || 0));
    });

    const totalAmount = Array.from(methodMap.values()).reduce((sum, amount) => sum + amount, 0);
    
    const processedMethods = Array.from(methodMap.entries())
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // If no payment methods found, return empty array
    if (processedMethods.length === 0) {
      return [];
    }
    
    return processedMethods;
  }

  private processCustomerSegments(sales: any[]) {
    const customerMap = new Map<string, { sales: number; transactions: number }>();
    
    sales.forEach(sale => {
      const customerId = sale.customer_id || 'walk-in';
      const existing = customerMap.get(customerId) || { sales: 0, transactions: 0 };
      existing.sales += sale.total_amount || 0;
      existing.transactions += 1;
      customerMap.set(customerId, existing);
    });

    const totalSales = Array.from(customerMap.values()).reduce((sum, customer) => sum + customer.sales, 0);
    
    // Segment customers based on spending
    const segments = {
      'VIP Customers': { sales: 0, customers: 0 },
      'Regular Customers': { sales: 0, customers: 0 },
      'Walk-in Customers': { sales: 0, customers: 0 }
    };

    customerMap.forEach((data, customerId) => {
      if (customerId === 'walk-in') {
        segments['Walk-in Customers'].sales += data.sales;
        segments['Walk-in Customers'].customers += 1;
      } else if (data.sales > 100000) { // VIP threshold
        segments['VIP Customers'].sales += data.sales;
        segments['VIP Customers'].customers += 1;
      } else {
        segments['Regular Customers'].sales += data.sales;
        segments['Regular Customers'].customers += 1;
      }
    });

    const processedSegments = Object.entries(segments)
      .map(([segment, data]) => ({
        segment,
        sales: data.sales,
        customers: data.customers,
        percentage: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0
      }))
      .filter(segment => segment.sales > 0);
    
    // If no customer segments found, return empty array
    if (processedSegments.length === 0) {
      return [];
    }
    
    return processedSegments;
  }

  private calculateMetrics(sales: any[], dailySales: any[]) {
    const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalTransactions = sales.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Calculate growth rate (comparing first and last day)
    let growthRate = 0;
    if (dailySales.length >= 2) {
      const firstDay = dailySales[0].sales;
      const lastDay = dailySales[dailySales.length - 1].sales;
      if (firstDay > 0) {
        growthRate = ((lastDay - firstDay) / firstDay) * 100;
      }
    }

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      growthRate
    };
  }

  private getEmptyData(): SalesAnalyticsData {
    return {
      dailySales: [],
      topProducts: [],
      paymentMethods: [],
      customerSegments: [],
      metrics: {
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        growthRate: 0
      }
    };
  }

  async getSalesStats(): Promise<SalesStats | null> {
    try {
      const { data: sales, error } = await supabase
        .from('lats_sales')
        .select('total_amount, created_at')
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching sales stats:', error);
        return null;
      }

      if (!sales || sales.length === 0) {
        return {
          total_sales: 0,
          total_revenue: 0,
          today_sales: 0,
          today_revenue: 0,
          this_month_sales: 0,
          this_month_revenue: 0,
          average_sale: 0
        };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let totalRevenue = 0;
      let todayRevenue = 0;
      let monthRevenue = 0;

      sales.forEach(sale => {
        const amount = sale.total_amount || 0;
        const saleDate = new Date(sale.created_at);
        
        totalRevenue += amount;
        
        if (saleDate >= today) {
          todayRevenue += amount;
        }
        
        if (saleDate >= startOfMonth) {
          monthRevenue += amount;
        }
      });

      return {
        total_sales: sales.length,
        total_revenue: totalRevenue,
        today_sales: sales.filter(s => new Date(s.created_at) >= today).length,
        today_revenue: todayRevenue,
        this_month_sales: sales.filter(s => new Date(s.created_at) >= startOfMonth).length,
        this_month_revenue: monthRevenue,
        average_sale: sales.length > 0 ? totalRevenue / sales.length : 0
      };

    } catch (error) {
      console.error('Error in getSalesStats:', error);
      return null;
    }
  }
}

export const salesAnalyticsService = new SalesAnalyticsService();
