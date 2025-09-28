import { supabase } from './supabaseClient';

export interface SalesPayment {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  paymentMethod: string;
  paymentStatus: 'completed' | 'pending' | 'failed' | 'cancelled';
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  cashierName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  
  // Sale items details
  saleItems: {
    id: string;
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costPrice?: number;
    profit?: number;
  }[];
  
  // Payment breakdown
  paymentBreakdown: {
    method: string;
    amount: number;
    reference?: string;
    status: string;
  }[];
}

export interface SalesPaymentMetrics {
  totalSales: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  cancelledAmount: number;
  refundedAmount: number;
  averageSaleAmount: number;
  totalItems: number;
  successRate: number;
}

export interface SalesPaymentFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  customerId?: string;
  cashierId?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface SalesPaymentSummary {
  date: string;
  totalSales: number;
  totalAmount: number;
  completedSales: number;
  completedAmount: number;
  pendingSales: number;
  pendingAmount: number;
  averageSaleAmount: number;
}

class SalesPaymentTrackingService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private isFetching = false;
  private fetchPromise: Promise<SalesPayment[]> | null = null;

  // Clear cache
  private clearCache() {
    this.cache.clear();
  }

  // Get cached data or null if expired
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  // Set cached data
  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Fetch sales payments with comprehensive details
  async fetchSalesPayments(filter: SalesPaymentFilter = {}): Promise<SalesPayment[]> {
    try {
      const cacheKey = `sales_payments_${JSON.stringify(filter)}`;
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log('📦 SalesPaymentTrackingService: Returning cached sales payment data');
        return cachedData;
      }

      // Prevent multiple simultaneous fetches
      if (this.isFetching && this.fetchPromise) {
        console.log('⏳ SalesPaymentTrackingService: Fetch in progress, waiting...');
        return this.fetchPromise;
      }

      this.isFetching = true;
      this.fetchPromise = this._fetchSalesPaymentsInternal(filter);
      
      const result = await this.fetchPromise;
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching sales payments:', error);
      return [];
    } finally {
      this.isFetching = false;
      this.fetchPromise = null;
    }
  }

  // Internal method to fetch sales payments
  private async _fetchSalesPaymentsInternal(filter: SalesPaymentFilter): Promise<SalesPayment[]> {
    console.log('🔍 SalesPaymentTrackingService: Fetching sales payments...');
    
    try {
      // Build the query with proper joins
      let query = supabase
        .from('lats_sales')
        .select(`
          id,
          sale_number,
          customer_id,
          total_amount,
          subtotal,
          discount_amount,
          tax_amount,
          payment_method,
          status,
          created_by,
          created_at,
          updated_at,
          notes,
          customers(
            id,
            name,
            phone,
            email
          ),
          lats_sale_items(
            id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            total_price,
            cost_price,
            profit,
            lats_products(
              id,
              name,
              sku
            ),
            lats_product_variants(
              id,
              name,
              sku
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter.startDate && filter.endDate) {
        query = query
          .gte('created_at', filter.startDate)
          .lte('created_at', filter.endDate);
      }

      if (filter.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      if (filter.paymentMethod && filter.paymentMethod !== 'all') {
        query = query.eq('payment_method', filter.paymentMethod);
      }

      if (filter.customerId) {
        query = query.eq('customer_id', filter.customerId);
      }

      if (filter.cashierId) {
        query = query.eq('created_by', filter.cashierId);
      }

      if (filter.searchQuery) {
        query = query.or(`sale_number.ilike.%${filter.searchQuery}%,notes.ilike.%${filter.searchQuery}%`);
      }

      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data: sales, error } = await query;

      if (error) {
        console.error('❌ Error fetching sales:', error);
        throw error;
      }

      console.log(`✅ SalesPaymentTrackingService: Found ${sales?.length || 0} sales`);

      // Transform the data
      const transformedSales: SalesPayment[] = (sales || []).map((sale: any) => ({
        id: sale.id,
        saleNumber: sale.sale_number,
        customerId: sale.customer_id || '',
        customerName: sale.customers?.name || 'Walk-in Customer',
        customerPhone: sale.customers?.phone,
        customerEmail: sale.customers?.email,
        totalAmount: sale.total_amount || 0,
        subtotal: sale.subtotal || 0,
        discountAmount: sale.discount_amount || 0,
        taxAmount: sale.tax_amount || 0,
        paymentMethod: this.parsePaymentMethod(sale.payment_method),
        paymentStatus: this.mapPaymentStatus(sale.status),
        status: sale.status,
        createdBy: sale.created_by,
        createdAt: sale.created_at,
        updatedAt: sale.updated_at,
        notes: sale.notes,
        
        // Transform sale items
        saleItems: (sale.lats_sale_items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          variantId: item.variant_id,
          productName: item.lats_products?.name || 'Unknown Product',
          variantName: item.lats_product_variants?.name || 'Default',
          sku: item.lats_products?.sku || item.lats_product_variants?.sku || 'N/A',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          costPrice: item.cost_price,
          profit: item.profit
        })),
        
        // Parse payment breakdown
        paymentBreakdown: this.parsePaymentBreakdown(sale.payment_method, sale.total_amount)
      }));

      return transformedSales;
    } catch (error) {
      console.error('Error in _fetchSalesPaymentsInternal:', error);
      return [];
    }
  }

  // Calculate sales payment metrics
  async calculateSalesPaymentMetrics(filter: SalesPaymentFilter = {}): Promise<SalesPaymentMetrics> {
    try {
      const sales = await this.fetchSalesPayments(filter);
      
      const totalSales = sales.length;
      const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const completedAmount = sales.filter(s => s.status === 'completed').reduce((sum, sale) => sum + sale.totalAmount, 0);
      const pendingAmount = sales.filter(s => s.status === 'pending').reduce((sum, sale) => sum + sale.totalAmount, 0);
      const cancelledAmount = sales.filter(s => s.status === 'cancelled').reduce((sum, sale) => sum + sale.totalAmount, 0);
      const refundedAmount = sales.filter(s => s.status === 'refunded').reduce((sum, sale) => sum + sale.totalAmount, 0);
      const averageSaleAmount = totalSales > 0 ? totalAmount / totalSales : 0;
      const totalItems = sales.reduce((sum, sale) => sum + sale.saleItems.length, 0);
      const successRate = totalSales > 0 ? (sales.filter(s => s.status === 'completed').length / totalSales) * 100 : 0;

      return {
        totalSales,
        totalAmount,
        completedAmount,
        pendingAmount,
        cancelledAmount,
        refundedAmount,
        averageSaleAmount,
        totalItems,
        successRate
      };
    } catch (error) {
      console.error('Error calculating sales payment metrics:', error);
      return {
        totalSales: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        cancelledAmount: 0,
        refundedAmount: 0,
        averageSaleAmount: 0,
        totalItems: 0,
        successRate: 0
      };
    }
  }

  // Get sales payment summary by date
  async getSalesPaymentSummary(days: number = 7): Promise<SalesPaymentSummary[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sales = await this.fetchSalesPayments({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Group by date
      const dailyMap = new Map<string, {
        totalSales: number;
        totalAmount: number;
        completedSales: number;
        completedAmount: number;
        pendingSales: number;
        pendingAmount: number;
      }>();

      sales.forEach(sale => {
        const date = new Date(sale.createdAt).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || {
          totalSales: 0,
          totalAmount: 0,
          completedSales: 0,
          completedAmount: 0,
          pendingSales: 0,
          pendingAmount: 0
        };

        existing.totalSales += 1;
        existing.totalAmount += sale.totalAmount;

        if (sale.status === 'completed') {
          existing.completedSales += 1;
          existing.completedAmount += sale.totalAmount;
        } else if (sale.status === 'pending') {
          existing.pendingSales += 1;
          existing.pendingAmount += sale.totalAmount;
        }

        dailyMap.set(date, existing);
      });

      return Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          ...data,
          averageSaleAmount: data.totalSales > 0 ? data.totalAmount / data.totalSales : 0
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting sales payment summary:', error);
      return [];
    }
  }

  // Get sales by payment method
  async getSalesByPaymentMethod(filter: SalesPaymentFilter = {}): Promise<{ [method: string]: SalesPayment[] }> {
    try {
      const sales = await this.fetchSalesPayments(filter);
      
      const salesByMethod: { [method: string]: SalesPayment[] } = {};
      
      sales.forEach(sale => {
        const method = sale.paymentMethod;
        if (!salesByMethod[method]) {
          salesByMethod[method] = [];
        }
        salesByMethod[method].push(sale);
      });

      // Sort sales within each method by date (newest first)
      Object.keys(salesByMethod).forEach(method => {
        salesByMethod[method].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return salesByMethod;
    } catch (error) {
      console.error('Error getting sales by payment method:', error);
      return {};
    }
  }

  // Get sales by customer
  async getSalesByCustomer(filter: SalesPaymentFilter = {}): Promise<{ [customerId: string]: SalesPayment[] }> {
    try {
      const sales = await this.fetchSalesPayments(filter);
      
      const salesByCustomer: { [customerId: string]: SalesPayment[] } = {};
      
      sales.forEach(sale => {
        const customerId = sale.customerId || 'unknown';
        if (!salesByCustomer[customerId]) {
          salesByCustomer[customerId] = [];
        }
        salesByCustomer[customerId].push(sale);
      });

      // Sort sales within each customer by date (newest first)
      Object.keys(salesByCustomer).forEach(customerId => {
        salesByCustomer[customerId].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return salesByCustomer;
    } catch (error) {
      console.error('Error getting sales by customer:', error);
      return {};
    }
  }

  // Update sale status
  async updateSaleStatus(
    saleId: string,
    status: 'completed' | 'pending' | 'cancelled' | 'refunded',
    userId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lats_sales')
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', saleId);

      if (error) {
        console.error('Error updating sale status:', error);
        return false;
      }

      // Clear cache when data changes
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error updating sale status:', error);
      return false;
    }
  }

  // Helper methods
  private parsePaymentMethod(paymentMethod: any): string {
    if (!paymentMethod) return 'Cash';
    
    if (typeof paymentMethod === 'string') {
      try {
        const parsed = JSON.parse(paymentMethod);
        if (parsed.type === 'multiple' && parsed.details?.payments) {
          const methods = parsed.details.payments.map((p: any) => p.method || p.paymentMethod);
          return methods.join(', ');
        }
        return parsed.method || parsed.paymentMethod || paymentMethod;
      } catch {
        return paymentMethod;
      }
    }
    
    if (typeof paymentMethod === 'object') {
      if (paymentMethod.type === 'multiple' && paymentMethod.details?.payments) {
        const methods = paymentMethod.details.payments.map((p: any) => p.method || p.paymentMethod);
        return methods.join(', ');
      }
      return paymentMethod.method || paymentMethod.paymentMethod || 'Cash';
    }
    
    return 'Cash';
  }

  private parsePaymentBreakdown(paymentMethod: any, totalAmount: number): { method: string; amount: number; reference?: string; status: string }[] {
    if (!paymentMethod) {
      return [{ method: 'Cash', amount: totalAmount, status: 'completed' }];
    }

    if (typeof paymentMethod === 'string') {
      try {
        const parsed = JSON.parse(paymentMethod);
        if (parsed.type === 'multiple' && parsed.details?.payments) {
          return parsed.details.payments.map((p: any) => ({
            method: p.method || p.paymentMethod || 'Cash',
            amount: p.amount || 0,
            reference: p.reference,
            status: p.status || 'completed'
          }));
        }
        return [{ method: parsed.method || parsed.paymentMethod || 'Cash', amount: totalAmount, status: 'completed' }];
      } catch {
        return [{ method: paymentMethod, amount: totalAmount, status: 'completed' }];
      }
    }

    if (typeof paymentMethod === 'object') {
      if (paymentMethod.type === 'multiple' && paymentMethod.details?.payments) {
        return paymentMethod.details.payments.map((p: any) => ({
          method: p.method || p.paymentMethod || 'Cash',
          amount: p.amount || 0,
          reference: p.reference,
          status: p.status || 'completed'
        }));
      }
      return [{ method: paymentMethod.method || paymentMethod.paymentMethod || 'Cash', amount: totalAmount, status: 'completed' }];
    }

    return [{ method: 'Cash', amount: totalAmount, status: 'completed' }];
  }

  private mapPaymentStatus(status: string): 'completed' | 'pending' | 'failed' | 'cancelled' {
    switch (status) {
      case 'completed': return 'completed';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      case 'refunded': return 'failed';
      default: return 'pending';
    }
  }

  // Clear cache method (public)
  public clearSalesPaymentCache() {
    this.clearCache();
  }
}

export const salesPaymentTrackingService = new SalesPaymentTrackingService();
