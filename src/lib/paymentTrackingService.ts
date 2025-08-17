import { supabase } from './supabaseClient';

export interface SoldItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  brand?: string;
  variant?: string;
  type: 'product' | 'service' | 'repair';
  description?: string;
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  customerName: string;
  amount: number;
  method: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  timestamp: string; // For display purposes
  cashier: string;
  fees: number;
  netAmount: number;
  orderId?: string;
  source: 'device_payment' | 'pos_sale' | 'repair_payment';
  customerId: string;
  deviceId?: string;
  deviceName?: string;
  paymentType: 'payment' | 'deposit' | 'refund';
  createdBy?: string;
  createdAt: string;
  
  // Additional fields for detailed view
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  cardLast4?: string;
  cardType?: string;
  mobileNumber?: string;
  bankName?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  
  // Sold items
  soldItems?: SoldItem[];
}

export interface PaymentMethodSummary {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface DailySummary {
  date: string;
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

export interface ReconciliationRecord {
  date: string;
  status: 'reconciled' | 'pending';
  expected: number;
  actual: number;
  variance: number;
}

export interface PaymentMetrics {
  totalPayments: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  failedAmount: number;
  totalFees: number;
  successRate: string;
}

class PaymentTrackingService {
  // Fetch sold items for a transaction
  async fetchSoldItems(transactionId: string, source: 'device_payment' | 'pos_sale' | 'repair_payment'): Promise<SoldItem[]> {
    try {
      if (source === 'pos_sale') {
        // Fetch POS sale items with simpler query to avoid join issues
        const { data: saleItems, error } = await supabase
          .from('lats_sale_items')
          .select('*')
          .eq('sale_id', transactionId);

        if (error) {
          console.error('Error fetching POS sale items:', error);
          return [];
        }

        // Transform the items with available data
        return saleItems?.map((item: any) => ({
          id: item.id,
          name: item.product_name || 'Unknown Product',
          sku: item.sku || 'N/A',
          quantity: item.quantity || 1,
          unitPrice: item.unit_price || 0,
          totalPrice: item.total_price || 0,
          category: item.category || 'General',
          brand: item.brand || 'Unknown',
          variant: item.variant_name || 'Default',
          type: 'product' as const,
          description: item.product_name || 'Product from sale',
          notes: item.notes || ''
        })) || [];
      } else if (source === 'device_payment') {
        // For device payments, we need to get the payment amount first
        const { data: payment, error: paymentError } = await supabase
          .from('customer_payments')
          .select('amount')
          .eq('id', transactionId)
          .single();

        if (paymentError) {
          console.error('Error fetching device payment amount:', paymentError);
          return [];
        }

        // Create a service item with the actual payment amount
        return [{
          id: `service-${transactionId}`,
          name: 'Device Repair Service',
          quantity: 1,
          unitPrice: payment?.amount || 0,
          totalPrice: payment?.amount || 0,
          type: 'service' as const,
          description: 'Device repair and maintenance service',
          notes: 'Repair service for device'
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching sold items:', error);
      return [];
    }
  }

  // Fetch all payment transactions from multiple sources
  async fetchPaymentTransactions(
    startDate?: string,
    endDate?: string,
    status?: string,
    method?: string
  ): Promise<PaymentTransaction[]> {
    try {
      console.log('🔍 PaymentTrackingService: Fetching payment transactions...');
      let allPayments: PaymentTransaction[] = [];

      // Fetch device payments (repair payments)
      const { data: devicePayments, error: devicePaymentsError } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model),
          customers(name),
          auth_users(name)
        `)
        .order('payment_date', { ascending: false });

      if (!devicePaymentsError && devicePayments) {
        console.log(`📊 PaymentTrackingService: Found ${devicePayments.length} device payments`);
        const transformedDevicePayments = devicePayments.map((payment: any) => ({
          id: payment.id,
          transactionId: `TXN-${payment.id.slice(0, 8).toUpperCase()}`,
          customerName: payment.customers?.name || 'Unknown Customer',
          amount: payment.amount || 0,
          method: this.mapPaymentMethod(payment.method),
          paymentMethod: this.mapPaymentMethod(payment.method),
          reference: `REF-${payment.id.slice(0, 8).toUpperCase()}`,
          status: payment.status || 'completed',
          date: payment.payment_date || payment.created_at,
          timestamp: payment.payment_date || payment.created_at,
          cashier: payment.auth_users?.name || 'System',
          fees: 0, // Device payments typically don't have fees
          netAmount: payment.amount || 0,
          orderId: payment.device_id,
          source: 'device_payment' as const,
          customerId: payment.customer_id,
          deviceId: payment.device_id,
          deviceName: payment.devices 
            ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
            : undefined,
          paymentType: payment.payment_type || 'payment',
          createdBy: payment.created_by,
          createdAt: payment.created_at
          // soldItems will be fetched on-demand when viewing transaction details
        }));
        allPayments.push(...transformedDevicePayments);
      }

      // Fetch POS sales (if accessible)
      try {
        console.log('🔍 PaymentTrackingService: Fetching POS sales...');
        const { data: posSales, error: posSalesError } = await supabase
          .from('lats_sales')
          .select(`
            *,
            customers(name)
          `)
          .order('created_at', { ascending: false });

        if (!posSalesError && posSales) {
          console.log(`📊 PaymentTrackingService: Found ${posSales.length} POS sales`);
          
          // Transform POS sales without fetching sold items initially
          const transformedPOSSales = posSales.map((sale: any) => ({
            id: sale.id,
            transactionId: sale.sale_number || `SALE-${sale.id.slice(0, 8).toUpperCase()}`,
            customerName: sale.customers?.name || 'Walk-in Customer',
            amount: sale.total_amount || 0,
            method: this.mapPaymentMethod(sale.payment_method),
            paymentMethod: this.mapPaymentMethod(sale.payment_method),
            reference: sale.sale_number || `REF-${sale.id.slice(0, 8).toUpperCase()}`,
            status: this.mapSaleStatus(sale.status),
            date: sale.created_at,
            timestamp: sale.created_at,
            cashier: 'System', // Auth user info not available in this query
            fees: 0, // POS sales typically don't have separate fees
            netAmount: sale.total_amount || 0,
            orderId: sale.id,
            source: 'pos_sale' as const,
            customerId: sale.customer_id || '',
            paymentType: 'payment' as const,
            createdBy: sale.created_by,
            createdAt: sale.created_at
            // soldItems will be fetched on-demand when viewing transaction details
          }));
          allPayments.push(...transformedPOSSales);
        } else if (posSalesError) {
          console.error('❌ PaymentTrackingService: Error fetching POS sales:', posSalesError);
        }
      } catch (posError) {
        console.warn('POS sales not accessible due to RLS policies:', posError);
      }

      // Apply filters
      let filteredPayments = allPayments;

      if (startDate && endDate) {
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return paymentDate >= start && paymentDate <= end;
        });
      }

      if (status && status !== 'all') {
        filteredPayments = filteredPayments.filter(payment => payment.status === status);
      }

      if (method && method !== 'all') {
        filteredPayments = filteredPayments.filter(payment => payment.method === method);
      }

      console.log(`✅ PaymentTrackingService: Returning ${filteredPayments.length} total payments (${filteredPayments.filter(p => p.source === 'pos_sale').length} POS sales, ${filteredPayments.filter(p => p.source === 'device_payment').length} device payments)`);
      return filteredPayments;
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      return [];
    }
  }

  // Calculate payment metrics
  async calculatePaymentMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<PaymentMetrics> {
    try {
      const payments = await this.fetchPaymentTransactions(startDate, endDate);
      
      const totalPayments = payments.length;
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const completedAmount = payments.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
      const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
      const failedAmount = payments.filter(p => p.status === 'failed').reduce((sum, payment) => sum + payment.amount, 0);
      const totalFees = payments.reduce((sum, payment) => sum + payment.fees, 0);

      return {
        totalPayments,
        totalAmount,
        completedAmount,
        pendingAmount,
        failedAmount,
        totalFees,
        successRate: totalAmount > 0 ? (() => {
          const formatted = ((completedAmount / totalAmount) * 100).toFixed(1);
          return formatted.replace(/\.0$/, '');
        })() : '0'
      };
    } catch (error) {
      console.error('Error calculating payment metrics:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        failedAmount: 0,
        totalFees: 0,
        successRate: '0'
      };
    }
  }

  // Get payment method summary
  async getPaymentMethodSummary(
    startDate?: string,
    endDate?: string
  ): Promise<PaymentMethodSummary[]> {
    try {
      const payments = await this.fetchPaymentTransactions(startDate, endDate);
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      const methodMap = new Map<string, { count: number; amount: number }>();
      
      payments.forEach(payment => {
        const method = payment.method;
        const existing = methodMap.get(method) || { count: 0, amount: 0 };
        methodMap.set(method, {
          count: existing.count + 1,
          amount: existing.amount + payment.amount
        });
      });

      return Array.from(methodMap.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0
      }));
    } catch (error) {
      console.error('Error getting payment method summary:', error);
      return [];
    }
  }

  // Get daily summary
  async getDailySummary(days: number = 7): Promise<DailySummary[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const payments = await this.fetchPaymentTransactions(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const dailyMap = new Map<string, { total: number; completed: number; pending: number; failed: number }>();
      
      payments.forEach(payment => {
        const date = new Date(payment.date).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || { total: 0, completed: 0, pending: 0, failed: 0 };
        
        existing.total += payment.amount;
        if (payment.status === 'completed') existing.completed += payment.amount;
        else if (payment.status === 'pending') existing.pending += payment.amount;
        else if (payment.status === 'failed') existing.failed += payment.amount;
        
        dailyMap.set(date, existing);
      });

      return Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting daily summary:', error);
      return [];
    }
  }

  // Get reconciliation records (simulated for now)
  async getReconciliationRecords(): Promise<ReconciliationRecord[]> {
    try {
      const payments = await this.fetchPaymentTransactions();
      const dailyMap = new Map<string, number>();
      
      payments.forEach(payment => {
        const date = new Date(payment.date).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || 0;
        dailyMap.set(date, existing + payment.amount);
      });

      return Array.from(dailyMap.entries())
        .slice(0, 5)
        .map(([date, actual]) => ({
          date,
          status: 'reconciled' as const,
          expected: actual,
          actual,
          variance: 0
        }));
    } catch (error) {
      console.error('Error getting reconciliation records:', error);
      return [];
    }
  }

  // Update payment status
  async updatePaymentStatus(
    paymentId: string,
    status: 'completed' | 'pending' | 'failed',
    source: 'device_payment' | 'pos_sale'
  ): Promise<boolean> {
    try {
      if (source === 'device_payment') {
        const { error } = await supabase
          .from('customer_payments')
          .update({ status })
          .eq('id', paymentId);
        
        if (error) throw error;
      } else if (source === 'pos_sale') {
        const { error } = await supabase
          .from('lats_sales')
          .update({ status: this.mapStatusToSaleStatus(status) })
          .eq('id', paymentId);
        
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }

  // Helper methods
  private mapPaymentMethod(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cash': 'Cash',
      'card': 'Card',
      'transfer': 'Bank Transfer',
      'mpesa': 'M-Pesa',
      'mobile_money': 'M-Pesa'
    };
    return methodMap[method?.toLowerCase()] || method || 'Cash';
  }

  private mapSaleStatus(status: string): 'completed' | 'pending' | 'failed' {
    if (status === 'completed') return 'completed';
    if (status === 'pending') return 'pending';
    if (status === 'cancelled' || status === 'refunded') return 'failed';
    return 'pending';
  }

  private mapStatusToSaleStatus(status: 'completed' | 'pending' | 'failed'): string {
    if (status === 'completed') return 'completed';
    if (status === 'pending') return 'pending';
    if (status === 'failed') return 'cancelled';
    return 'pending';
  }
}

export const paymentTrackingService = new PaymentTrackingService();
