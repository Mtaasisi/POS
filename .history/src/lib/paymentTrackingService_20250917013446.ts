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
  currency: string; // Added currency field
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
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60000; // 60 seconds cache (increased from 30s)
  private isFetching = false;
  private fetchPromise: Promise<PaymentTransaction[]> | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private fetchLock = new Map<string, Promise<PaymentTransaction[]>>(); // Per-cache-key locks
  private connectionStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
  private lastConnectionCheck = 0;
  private readonly CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds (increased from 10s)
  private globalFetchLock = false; // Global lock to prevent multiple simultaneous fetches
  private readonly GLOBAL_FETCH_TIMEOUT = 30000; // 30 seconds timeout for global fetch
  private debounceTimers = new Map<string, NodeJS.Timeout>(); // Debounce timers for each cache key
  private readonly DEBOUNCE_DELAY = 1000; // 1 second debounce (increased from 500ms)

  // Clear cache
  private clearCache() {
    this.cache.clear();
    this.fetchLock.clear();
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  // Check connection status
  private async checkConnection(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastConnectionCheck < this.CONNECTION_CHECK_INTERVAL) {
      return this.connectionStatus === 'connected';
    }

    try {
      this.lastConnectionCheck = now;
      const { error } = await supabase
        .from('customer_payments')
        .select('id')
        .limit(1);
      
      if (error) {
        this.connectionStatus = 'disconnected';
        console.warn('⚠️ Connection check failed:', error.message);
        return false;
      }
      
      this.connectionStatus = 'connected';
      return true;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.warn('⚠️ Connection check failed:', error);
      return false;
    }
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

  // Retry mechanism for database operations with connection error handling
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = error?.message?.includes('ERR_CONNECTION_CLOSED') || 
                               error?.message?.includes('Failed to fetch') ||
                               error?.code === 'PGRST301' ||
                               error?.code === 'PGRST116';
      
      console.error(`❌ ${operationName} failed (attempt ${this.MAX_RETRIES - retries + 1}/${this.MAX_RETRIES}):`, error);
      
      if (retries > 1 && isConnectionError) {
        const delay = this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1); // Exponential backoff
        console.log(`🔄 Retrying ${operationName} in ${delay}ms due to connection error...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryOperation(operation, operationName, retries - 1);
      } else if (retries > 1) {
        console.log(`🔄 Retrying ${operationName} in ${this.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.retryOperation(operation, operationName, retries - 1);
      }
      
      // If it's a connection error and we've exhausted retries, return empty data instead of throwing
      if (isConnectionError) {
        console.warn(`⚠️ ${operationName} failed after ${this.MAX_RETRIES} attempts due to connection issues. Returning empty data.`);
        return [] as T;
      }
      
      throw error;
    }
  }

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

  // Debounced fetch method to reduce duplicate requests
  async fetchPaymentTransactionsDebounced(
    startDate?: string,
    endDate?: string,
    status?: string,
    method?: string
  ): Promise<PaymentTransaction[]> {
    const cacheKey = `payments_${startDate || 'all'}_${endDate || 'all'}_${status || 'all'}_${method || 'all'}`;
    
    return new Promise((resolve) => {
      // Clear existing timer for this cache key
      if (this.debounceTimers.has(cacheKey)) {
        clearTimeout(this.debounceTimers.get(cacheKey)!);
      }
      
      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await this.fetchPaymentTransactions(startDate, endDate, status, method);
          resolve(result);
        } catch (error) {
          console.error('Error in debounced fetch:', error);
          resolve([]);
        } finally {
          this.debounceTimers.delete(cacheKey);
        }
      }, this.DEBOUNCE_DELAY);
      
      this.debounceTimers.set(cacheKey, timer);
    });
  }

  // Fetch all payment transactions from multiple sources
  // Debounced fetch method to prevent rapid successive calls
  async debouncedFetchPaymentTransactions(
    startDate?: string,
    endDate?: string,
    status?: string,
    method?: string
  ): Promise<PaymentTransaction[]> {
    const cacheKey = `payments_${startDate || 'all'}_${endDate || 'all'}_${status || 'all'}_${method || 'all'}`;
    
    // Clear existing debounce timer for this cache key
    if (this.debounceTimers.has(cacheKey)) {
      clearTimeout(this.debounceTimers.get(cacheKey)!);
    }
    
    // Return a promise that resolves after debounce delay
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(cacheKey);
        try {
          const result = await this.fetchPaymentTransactions(startDate, endDate, status, method);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.DEBOUNCE_DELAY);
      
      this.debounceTimers.set(cacheKey, timer);
    });
  }

  // Main fetch method with caching and locking
  async fetchPaymentTransactions(
    startDate?: string,
    endDate?: string,
    status?: string,
    method?: string
  ): Promise<PaymentTransaction[]> {
    try {
      // Create cache key based on parameters
      const cacheKey = `payments_${startDate || 'all'}_${endDate || 'all'}_${status || 'all'}_${method || 'all'}`;
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log('📦 PaymentTrackingService: Returning cached payment data');
        return cachedData;
      }

      // Global lock to prevent multiple simultaneous fetches
      if (this.globalFetchLock) {
        console.log('⏳ PaymentTrackingService: Global fetch in progress, waiting...');
        // Wait for global fetch to complete with timeout
        let waitTime = 0;
        const maxWaitTime = 10000; // 10 seconds max wait
        while (this.globalFetchLock && waitTime < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 200));
          waitTime += 200;
        }
        const freshCachedData = this.getCachedData(cacheKey);
        if (freshCachedData) {
          return freshCachedData;
        }
        // If still locked after timeout, proceed but warn
        if (this.globalFetchLock) {
          console.warn('⚠️ PaymentTrackingService: Global fetch timeout reached, proceeding anyway');
        }
      }

      // Check connection before proceeding
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        console.warn('⚠️ PaymentTrackingService: No connection available, returning cached data or empty array');
        // Return cached data even if expired, or empty array
        const expiredCachedData = this.cache.get(cacheKey)?.data;
        return expiredCachedData || [];
      }

      // Check if there's already a fetch in progress for this cache key
      if (this.fetchLock.has(cacheKey)) {
        console.log('⏳ PaymentTrackingService: Already fetching, waiting for existing request...');
        return this.fetchLock.get(cacheKey)!;
      }

      // Set global lock with timeout
      this.globalFetchLock = true;
      const globalLockTimeout = setTimeout(() => {
        if (this.globalFetchLock) {
          console.warn('⚠️ PaymentTrackingService: Global fetch lock timeout reached, force releasing lock');
          this.globalFetchLock = false;
        }
      }, this.GLOBAL_FETCH_TIMEOUT);

      // Create new fetch promise and store it in the lock map
      const fetchPromise = this.retryOperation(
        () => this._fetchPaymentTransactionsInternal(startDate, endDate, status, method),
        'fetchPaymentTransactions'
      );
      
      this.fetchLock.set(cacheKey, fetchPromise);
      
      try {
        const result = await fetchPromise;
        this.setCachedData(cacheKey, result);
        return result;
      } finally {
        // Clean up the locks and timeout
        clearTimeout(globalLockTimeout);
        this.fetchLock.delete(cacheKey);
        this.globalFetchLock = false;
      }
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      // Return cached data if available, even if expired
      const cacheKey = `payments_${startDate || 'all'}_${endDate || 'all'}_${status || 'all'}_${method || 'all'}`;
      const expiredCachedData = this.cache.get(cacheKey)?.data;
      this.globalFetchLock = false; // Ensure lock is released on error
      return expiredCachedData || [];
    }
  }

  // Internal method to actually fetch the data
  private async _fetchPaymentTransactionsInternal(
    startDate?: string,
    endDate?: string,
    status?: string,
    method?: string
  ): Promise<PaymentTransaction[]> {
    console.log('🔍 PaymentTrackingService: Fetching payment transactions...');
    const allPayments: PaymentTransaction[] = [];

    try {
      // Fetch device payments (repair payments) with safe query
      const { data: devicePayments, error: devicePaymentsError } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model),
          customers(name)
        `)
        .order('payment_date', { ascending: false })
        .limit(1000); // Add reasonable limit to prevent performance issues

      if (!devicePaymentsError && devicePayments) {
        console.log(`📊 PaymentTrackingService: Found ${devicePayments.length} device payments`);
        const transformedDevicePayments = devicePayments.map((payment: any) => ({
          id: payment.id,
          transactionId: `TXN-${payment.id.slice(0, 8).toUpperCase()}`,
          customerName: payment.customers?.name || 'Unknown Customer',
          customerPhone: payment.customer_phone,
          customerEmail: payment.customer_email,
          customerAddress: payment.customer_address,
          amount: payment.amount || 0,
          method: this.mapPaymentMethod(payment.method),
          paymentMethod: this.mapPaymentMethod(payment.method),
          reference: payment.reference || `REF-${payment.id.slice(0, 8).toUpperCase()}`,
          status: payment.status || 'completed',
          date: payment.payment_date || payment.created_at,
          timestamp: payment.payment_date || payment.created_at,
          cashier: payment.cashier_name || 'System',
          fees: payment.fees || 0,
          netAmount: (payment.amount || 0) - (payment.fees || 0),
          orderId: payment.device_id,
          source: 'device_payment' as const,
          customerId: payment.customer_id,
          deviceId: payment.device_id,
          deviceName: payment.devices 
            ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
            : undefined,
          paymentType: payment.payment_type || 'payment',
          createdBy: payment.created_by,
          createdAt: payment.created_at,
          failureReason: payment.failure_reason,
          metadata: payment.metadata || {}
          // soldItems will be fetched on-demand when viewing transaction details
        }));
        allPayments.push(...transformedDevicePayments);
      } else if (devicePaymentsError) {
        console.error('❌ PaymentTrackingService: Error fetching device payments:', devicePaymentsError);
      }

      // Fetch POS sales (if accessible) with safe query
      try {
        console.log('🔍 PaymentTrackingService: Fetching POS sales...');
        const { data: posSales, error: posSalesError } = await supabase
          .from('lats_sales')
          .select(`
            *,
            customers(name)
          `)
          .order('created_at', { ascending: false })
          .limit(1000); // Add reasonable limit

        if (!posSalesError && posSales) {
          console.log(`📊 PaymentTrackingService: Found ${posSales.length} POS sales`);
          
          // Transform POS sales with safe data mapping
          const transformedPOSSales = posSales.map((sale: any) => ({
            id: sale.id,
            transactionId: sale.sale_number || `SALE-${sale.id.slice(0, 8).toUpperCase()}`,
            customerName: sale.customers?.name || 'Walk-in Customer',
            customerPhone: sale.customer_phone,
            customerEmail: sale.customer_email,
            customerAddress: sale.customer_address,
            amount: sale.total_amount || 0,
            method: sale.payment_method?.type === 'multiple' ? 'Multiple' : this.mapPaymentMethod(sale.payment_method),
            paymentMethod: sale.payment_method?.type === 'multiple' ? 'Multiple' : this.mapPaymentMethod(sale.payment_method),
            reference: sale.sale_number || `REF-${sale.id.slice(0, 8).toUpperCase()}`,
            status: this.mapSaleStatus(sale.status),
            date: sale.created_at,
            timestamp: sale.created_at,
            cashier: sale.cashier_name || 'System',
            fees: sale.processing_fees || 0,
            netAmount: (sale.total_amount || 0) - (sale.processing_fees || 0),
            orderId: sale.id,
            source: 'pos_sale' as const,
            customerId: sale.customer_id || '',
            paymentType: 'payment' as const,
            createdBy: sale.created_by,
            createdAt: sale.created_at,
            failureReason: sale.failure_reason,
            metadata: {
              ...sale.metadata,
              paymentMethod: sale.payment_method // Include the full payment method structure
            }
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

      // Only apply date filters if both startDate and endDate are provided
      if (startDate && endDate) {
        filteredPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return paymentDate >= start && paymentDate <= end;
        });
      }

      // Only apply status filter if status is provided and not 'all'
      if (status && status !== 'all' && status !== undefined) {
        filteredPayments = filteredPayments.filter(payment => payment.status === status);
      }

      // Only apply method filter if method is provided and not 'all'
      if (method && method !== 'all' && method !== undefined) {
        filteredPayments = filteredPayments.filter(payment => payment.method === method);
      }

      console.log(`✅ PaymentTrackingService: Returning ${filteredPayments.length} total payments (${filteredPayments.filter(p => p.source === 'pos_sale').length} POS sales, ${filteredPayments.filter(p => p.source === 'device_payment').length} device payments)`);
      console.log(`🔍 PaymentTrackingService: Filters applied - startDate: ${startDate}, endDate: ${endDate}, status: ${status}, method: ${method}`);
      console.log(`🔍 PaymentTrackingService: All payments before filtering: ${allPayments.length}, after filtering: ${filteredPayments.length}`);
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

  // Get all payments grouped by payment method
  async getPaymentsByMethod(
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<{ [method: string]: PaymentTransaction[] }> {
    try {
      console.log('🔍 PaymentTrackingService: Fetching payments grouped by method...');
      const payments = await this.fetchPaymentTransactions(startDate, endDate, status);
      
      // Group payments by method
      const paymentsByMethod: { [method: string]: PaymentTransaction[] } = {};
      
      payments.forEach(payment => {
        const method = payment.method;
        if (!paymentsByMethod[method]) {
          paymentsByMethod[method] = [];
        }
        paymentsByMethod[method].push(payment);
      });

      // Sort payments within each method by date (newest first)
      Object.keys(paymentsByMethod).forEach(method => {
        paymentsByMethod[method].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });

      console.log(`✅ PaymentTrackingService: Grouped ${payments.length} payments into ${Object.keys(paymentsByMethod).length} methods`);
      return paymentsByMethod;
    } catch (error) {
      console.error('Error getting payments by method:', error);
      return {};
    }
  }

  // Get detailed payment method statistics
  async getPaymentMethodStatistics(
    startDate?: string,
    endDate?: string
  ): Promise<{ [method: string]: { 
    totalAmount: number; 
    totalCount: number; 
    completedAmount: number; 
    completedCount: number;
    pendingAmount: number; 
    pendingCount: number;
    failedAmount: number; 
    failedCount: number;
    averageAmount: number;
    successRate: number;
  } }> {
    try {
      console.log('🔍 PaymentTrackingService: Calculating payment method statistics...');
      const payments = await this.fetchPaymentTransactions(startDate, endDate);
      
      const methodStats: { [method: string]: { 
        totalAmount: number; 
        totalCount: number; 
        completedAmount: number; 
        completedCount: number;
        pendingAmount: number; 
        pendingCount: number;
        failedAmount: number; 
        failedCount: number;
        averageAmount: number;
        successRate: number;
      } } = {};
      
      payments.forEach(payment => {
        const method = payment.method;
        
        if (!methodStats[method]) {
          methodStats[method] = {
            totalAmount: 0,
            totalCount: 0,
            completedAmount: 0,
            completedCount: 0,
            pendingAmount: 0,
            pendingCount: 0,
            failedAmount: 0,
            failedCount: 0,
            averageAmount: 0,
            successRate: 0
          };
        }
        
        const stats = methodStats[method];
        stats.totalAmount += payment.amount;
        stats.totalCount += 1;
        
        if (payment.status === 'completed') {
          stats.completedAmount += payment.amount;
          stats.completedCount += 1;
        } else if (payment.status === 'pending') {
          stats.pendingAmount += payment.amount;
          stats.pendingCount += 1;
        } else if (payment.status === 'failed') {
          stats.failedAmount += payment.amount;
          stats.failedCount += 1;
        }
      });

      // Calculate derived statistics
      Object.keys(methodStats).forEach(method => {
        const stats = methodStats[method];
        stats.averageAmount = stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0;
        stats.successRate = stats.totalCount > 0 ? (stats.completedCount / stats.totalCount) * 100 : 0;
      });

      console.log(`✅ PaymentTrackingService: Calculated statistics for ${Object.keys(methodStats).length} payment methods`);
      return methodStats;
    } catch (error) {
      console.error('Error calculating payment method statistics:', error);
      return {};
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

  // Update payment status with audit logging
  async updatePaymentStatus(
    paymentId: string,
    status: 'completed' | 'pending' | 'failed',
    source: 'device_payment' | 'pos_sale',
    userId?: string
  ): Promise<boolean> {
    try {
      const previousStatus = await this.getPaymentStatus(paymentId, source);
      
      if (source === 'device_payment') {
        const { error } = await supabase
          .from('customer_payments')
          .update({ 
            status,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', paymentId);
        
        if (error) throw error;
      } else if (source === 'pos_sale') {
        const { error } = await supabase
          .from('lats_sales')
          .update({ 
            status: this.mapStatusToSaleStatus(status),
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', paymentId);
        
        if (error) throw error;
      }

      // Log the status change
      await this.logPaymentOperation(
        'status_update',
        paymentId,
        {
          previous_status: previousStatus,
          new_status: status,
          source,
          timestamp: new Date().toISOString()
        },
        userId
      );

      // Clear cache when data changes
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }

  // Get current payment status
  private async getPaymentStatus(paymentId: string, source: 'device_payment' | 'pos_sale'): Promise<string> {
    try {
      if (source === 'device_payment') {
        const { data, error } = await supabase
          .from('customer_payments')
          .select('status')
          .eq('id', paymentId)
          .single();
        
        if (error) throw error;
        return data?.status || 'unknown';
      } else if (source === 'pos_sale') {
        const { data, error } = await supabase
          .from('lats_sales')
          .select('status')
          .eq('id', paymentId)
          .single();
        
        if (error) throw error;
        return data?.status || 'unknown';
      }
      return 'unknown';
    } catch (error) {
      console.error('Error getting payment status:', error);
      return 'unknown';
    }
  }

  // Method to clear cache (can be called externally)
  public clearPaymentCache() {
    this.clearCache();
  }

  // Log payment operations for audit trail
  private async logPaymentOperation(
    operation: string,
    paymentId: string,
    details: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('payment_audit_log')
        .insert({
          operation,
          payment_id: paymentId,
          details,
          user_id: userId,
          timestamp: new Date().toISOString(),
          ip_address: null, // Could be added if available
          user_agent: null  // Could be added if available
        });
    } catch (error) {
      console.error('Failed to log payment operation:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Get payment audit trail
  async getPaymentAuditTrail(paymentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_audit_log')
        .select('*')
        .eq('payment_id', paymentId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment audit trail:', error);
      return [];
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
