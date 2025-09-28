import { supabase } from './supabaseClient';

export interface FinancialSummary {
  // Revenue & Payments
  totalRevenue: number;
  totalOutstanding: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  averageTransaction: number;
  
  // Expenses
  totalExpenses: number;
  monthlyExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  
  // Profit & Balance
  netProfit: number;
  monthlyProfit: number;
  totalBalance: number;
  
  // Accounts
  totalAccounts: number;
  activeAccounts: number;
  
  // Growth & Trends
  revenueGrowth: number;
  expenseGrowth: number;
  profitGrowth: number;
}

export interface PaymentData {
  id: string;
  customer_id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer';
  device_id?: string | null;
  payment_date: string;
  payment_type: 'payment' | 'deposit' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  created_by?: string | null;
  created_at?: string | null;
  device_name?: string;
  customer_name?: string;
  // Enhanced fields for better data identification
  source?: 'device_payment' | 'pos_sale' | 'repair_payment';
  orderId?: string;
  orderStatus?: string;
  totalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingCost?: number;
  amountPaid?: number;
  balanceDue?: number;
  customerType?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryNotes?: string;
  repairType?: string;
  diagnosis?: string;
  deviceBrand?: string;
  deviceModel?: string;
}

export interface ExpenseData {
  id: string;
  title: string;
  account_id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: 'cash' | 'card' | 'transfer';
  status: 'pending' | 'approved' | 'rejected';
  receipt_url?: string;
  created_at: string;
  account_name?: string;
}

export interface AccountData {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'mobile_money' | 'credit_card' | 'savings' | 'investment' | 'other';
  balance: number;
  account_number?: string;
  bank_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransferData {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string;
  created_at: string;
  from_account_name?: string;
  to_account_name?: string;
}

export interface RevenueData {
  total: number;
  this_month: number;
  last_month: number;
  this_week: number;
  today: number;
  growth_percentage: number;
}

export interface FinancialTrends {
  monthly: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    payments: number;
  }>;
  daily: Array<{
    day: string;
    revenue: number;
    expenses: number;
    profit: number;
    payments: number;
  }>;
}

export interface FinancialAnalytics {
  summary: FinancialSummary;
  payments: PaymentData[];
  expenses: ExpenseData[];
  accounts: AccountData[];
  transfers: TransferData[];
  revenue: RevenueData;
  trends: FinancialTrends;
}

class FinancialService {
  // Fetch comprehensive financial data with ALL sources
  async getComprehensiveFinancialData(): Promise<FinancialAnalytics | null> {
    try {
      const [
        devicePayments,
        posSales,
        repairPayments,
        expenses,
        accounts,
        transfers,
        revenue,
        trends
      ] = await Promise.all([
        this.getDevicePayments(),
        this.getPOSSales(),
        this.getRepairPayments(),
        this.getExpenses(),
        this.getAccounts(),
        this.getTransfers(),
        this.getRevenueAnalytics(),
        this.getFinancialTrends()
      ]);

      // Combine all payment sources
      const allPayments = [
        ...(devicePayments || []),
        ...(posSales || []),
        ...(repairPayments || [])
      ];

      if (!allPayments) {
        console.error('Failed to fetch required financial data');
        return null;
      }

      const summary = this.calculateFinancialSummary(allPayments, expenses || [], accounts || [], revenue);

      return {
        summary,
        payments: allPayments,
        expenses: expenses || [],
        accounts: accounts || [],
        transfers: transfers || [],
        revenue,
        trends
      };
    } catch (error) {
      console.error('Error fetching comprehensive financial data:', error);
      return null;
    }
  }

  // Fetch device payments (repair payments)
  async getDevicePayments(): Promise<PaymentData[]> {
    try {
      // Check if user is authenticated first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn('User not authenticated, skipping device payments fetch');
        return [];
      }
      
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model),
          customers!inner(name)
        `)
        .order('payment_date', { ascending: false });

      if (error) {
        console.log('Device payments table not found or error:', error);
        return [];
      }

      return data?.map((payment: any) => ({
        id: payment.id,
        customer_id: payment.customer_id,
        amount: payment.amount,
        method: payment.method,
        device_id: payment.device_id,
        payment_date: payment.payment_date,
        payment_type: payment.payment_type,
        status: payment.status,
        created_by: payment.created_by,
        created_at: payment.created_at,
        device_name: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined,
        customer_name: payment.customers?.name || undefined,
        source: 'device_payment',
        repairType: payment.repair_type,
        diagnosis: payment.diagnosis,
        deviceBrand: payment.devices?.brand,
        deviceModel: payment.devices?.model
      })) || [];
    } catch (error) {
      console.error('Error fetching device payments:', error);
      return [];
    }
  }

  // Fetch POS sales data with enhanced details
  async getPOSSales(): Promise<PaymentData[]> {
    try {
      // Use simplified query to avoid 400 errors
      const { data, error } = await supabase
        .from('lats_sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Financial sales query failed:', error);
        return [];
      }

      console.log(`✅ Loaded ${data?.length || 0} financial sales`);
      
      // Transform POS sales to match PaymentData format
      return data?.map((sale: any) => ({
        id: sale.id,
        customer_id: sale.customer_id,
        amount: sale.total_amount,
        method: sale.payment_method,
        device_id: null, // POS sales don't have device_id
        payment_date: sale.created_at,
        payment_type: 'payment',
        status: sale.status === 'completed' ? 'completed' : 
                sale.status === 'pending' ? 'pending' : 'failed',
        created_by: sale.created_by,
        created_at: sale.created_at,
        device_name: undefined, // POS sales don't have device names
        customer_name: sale.customers?.name || undefined,
        source: 'pos_sale',
        // Enhanced POS-specific fields
        orderId: sale.id,
        orderStatus: sale.status,
        totalAmount: sale.total_amount,
        discountAmount: 0, // Not available in new schema
        taxAmount: 0, // Not available in new schema
        shippingCost: 0, // Not available in new schema
        amountPaid: sale.total_amount, // Assuming full payment for completed sales
        balanceDue: 0, // Not available in new schema
        customerType: 'retail', // Default value
        deliveryMethod: 'pickup', // Default value
        deliveryAddress: '', // Not available in new schema
        deliveryCity: '', // Not available in new schema
        deliveryNotes: '' // Not available in new schema
      })) || [];
    } catch (error) {
      console.error('Error fetching POS sales:', error);
      return [];
    }
  }

  // Fetch repair payments (separate from device payments for clarity)
  async getRepairPayments(): Promise<PaymentData[]> {
    try {
      // This is essentially the same as device payments but with different source identification
      const devicePayments = await this.getDevicePayments();
      
      // Mark them as repair payments for better categorization
      return devicePayments.map(payment => ({
        ...payment,
        source: 'repair_payment'
      }));
    } catch (error) {
      console.error('Error fetching repair payments:', error);
      return [];
    }
  }

  // Enhanced getPayments method that combines all payment sources
  async getPayments(): Promise<PaymentData[]> {
    try {
      const [devicePayments, posSales] = await Promise.all([
        this.getDevicePayments(),
        this.getPOSSales()
      ]);

      // Combine and sort all payments by date
      const allPayments = [...devicePayments, ...posSales];
      allPayments.sort((a, b) => {
        const dateA = new Date(a.payment_date || a.created_at);
        const dateB = new Date(b.payment_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      return allPayments;
    } catch (error) {
      console.error('Error fetching all payments:', error);
      return [];
    }
  }

  // Get financial data breakdown by source
  async getFinancialDataBySource(): Promise<{
    devicePayments: PaymentData[];
    posSales: PaymentData[];
    repairPayments: PaymentData[];
    totalRevenue: number;
    devicePaymentsRevenue: number;
    posSalesRevenue: number;
    repairPaymentsRevenue: number;
  }> {
    try {
      const [devicePayments, posSales, repairPayments] = await Promise.all([
        this.getDevicePayments(),
        this.getPOSSales(),
        this.getRepairPayments()
      ]);

      const devicePaymentsRevenue = devicePayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const posSalesRevenue = posSales
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const repairPaymentsRevenue = repairPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const totalRevenue = devicePaymentsRevenue + posSalesRevenue + repairPaymentsRevenue;

      return {
        devicePayments,
        posSales,
        repairPayments,
        totalRevenue,
        devicePaymentsRevenue,
        posSalesRevenue,
        repairPaymentsRevenue
      };
    } catch (error) {
      console.error('Error fetching financial data by source:', error);
      return {
        devicePayments: [],
        posSales: [],
        repairPayments: [],
        totalRevenue: 0,
        devicePaymentsRevenue: 0,
        posSalesRevenue: 0,
        repairPaymentsRevenue: 0
      };
    }
  }

  // Fetch all expenses
  async getExpenses(): Promise<ExpenseData[]> {
    try {
      const { data, error } = await supabase
        .from('finance_expenses')
        .select(`
          *,
          finance_accounts(name)
        `)
        .order('expense_date', { ascending: false });

      if (error) {
        // Table doesn't exist, return empty array
        console.log('Finance expenses table not found, returning empty array');
        return [];
      }

      // If no data, return empty array
      if (!data || data.length === 0) {
        return [];
      }

      return data?.map((expense: any) => ({
        ...expense,
        account_name: expense.finance_accounts?.name || undefined
      })) || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  // Fetch all accounts
  async getAccounts(): Promise<AccountData[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Table doesn't exist, return empty array
        console.log('Finance accounts table not found, returning empty array');
        return [];
      }

      // If no data, return empty array
      if (!data || data.length === 0) {
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  // Fetch all transfers
  async getTransfers(): Promise<TransferData[]> {
    try {
      const { data, error } = await supabase
        .from('finance_transfers')
        .select(`
          *,
          from_account:finance_accounts!finance_transfers_from_account_id_fkey(name),
          to_account:finance_accounts!finance_transfers_to_account_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Table doesn't exist, return empty array
        console.log('Finance transfers table not found, returning empty array');
        return [];
      }

      return data?.map((transfer: any) => ({
        ...transfer,
        from_account_name: transfer.from_account?.name || undefined,
        to_account_name: transfer.to_account?.name || undefined
      })) || [];
    } catch (error) {
      console.error('Error fetching transfers:', error);
      return [];
    }
  }

  // Get revenue analytics from payments only (since device revenue columns don't exist)
  async getRevenueAnalytics(): Promise<RevenueData> {
    try {
      // Get revenue from customer payments only
      const { data: payments, error } = await supabase
        .from('customer_payments')
        .select('amount, payment_date, status')
        .eq('status', 'completed');
      
      if (error) throw error;

      if (!payments || payments.length === 0) {
        return {
          total: 0,
          this_month: 0,
          last_month: 0,
          this_week: 0,
          today: 0,
          growth_percentage: 0
        };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let total = 0;
      let this_month = 0;
      let last_month = 0;
      let this_week = 0;
      let today = 0;

      payments.forEach(payment => {
        const amount = payment.amount || 0;
        total += amount;

        if (payment.payment_date) {
          const paymentDate = new Date(payment.payment_date);
          
          if (paymentDate >= startOfMonth) {
            this_month += amount;
          }
          
          if (paymentDate >= startOfLastMonth && paymentDate <= endOfLastMonth) {
            last_month += amount;
          }
          
          if (paymentDate >= startOfWeek) {
            this_week += amount;
          }
          
          if (paymentDate >= startOfDay) {
            today += amount;
          }
        }
      });

      const growth_percentage = last_month > 0 ? 
        ((this_month - last_month) / last_month) * 100 : 0;

      return {
        total,
        this_month,
        last_month,
        this_week,
        today,
        growth_percentage
      };
    } catch (error) {
      console.error('Error calculating revenue analytics:', error);
      return {
        total: 0,
        this_month: 0,
        last_month: 0,
        this_week: 0,
        today: 0,
        growth_percentage: 0
      };
    }
  }

  // Get financial trends
  async getFinancialTrends(): Promise<FinancialTrends> {
    try {
      const [payments, expenses] = await Promise.all([
        this.getPayments(),
        this.getExpenses()
      ]);

      // Calculate monthly trends
      const monthlyData = new Map();
      const dailyData = new Map();

      // Process payments
      payments.forEach(payment => {
        if (payment.status === 'completed') {
          const date = new Date(payment.payment_date);
          const monthKey = date.toISOString().slice(0, 7);
          const dayKey = date.toISOString().slice(0, 10);

          // Monthly
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { revenue: 0, expenses: 0, profit: 0, payments: 0 });
          }
          const monthData = monthlyData.get(monthKey);
          monthData.revenue += payment.amount || 0;
          monthData.payments += 1;
          monthData.profit = monthData.revenue - monthData.expenses;

          // Daily
          if (!dailyData.has(dayKey)) {
            dailyData.set(dayKey, { revenue: 0, expenses: 0, profit: 0, payments: 0 });
          }
          const dayData = dailyData.get(dayKey);
          dayData.revenue += payment.amount || 0;
          dayData.payments += 1;
          dayData.profit = dayData.revenue - dayData.expenses;
        }
      });

      // Process expenses
      expenses.forEach(expense => {
        if (expense.status === 'approved') {
          const date = new Date(expense.expense_date);
          const monthKey = date.toISOString().slice(0, 7);
          const dayKey = date.toISOString().slice(0, 10);

          // Monthly
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { revenue: 0, expenses: 0, profit: 0, payments: 0 });
          }
          const monthData = monthlyData.get(monthKey);
          monthData.expenses += expense.amount;
          monthData.profit = monthData.revenue - monthData.expenses;

          // Daily
          if (!dailyData.has(dayKey)) {
            dailyData.set(dayKey, { revenue: 0, expenses: 0, profit: 0, payments: 0 });
          }
          const dayData = dailyData.get(dayKey);
          dayData.expenses += expense.amount;
          dayData.profit = dayData.revenue - dayData.expenses;
        }
      });

      const monthly = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          ...data
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const daily = Array.from(dailyData.entries())
        .map(([day, data]) => ({
          day,
          ...data
        }))
        .sort((a, b) => a.day.localeCompare(b.day));

      return { monthly, daily };
    } catch (error) {
      console.error('Error calculating financial trends:', error);
      return { monthly: [], daily: [] };
    }
  }

  // Calculate financial summary
  private calculateFinancialSummary(
    payments: PaymentData[],
    expenses: ExpenseData[],
    accounts: AccountData[],
    revenue: RevenueData
  ): FinancialSummary {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isInCurrentMonth = (date: string) => {
      const itemDate = new Date(date);
      return itemDate >= startOfMonth;
    };

    // Calculate totals
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalOutstanding = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const monthlyRevenue = payments
      .filter(p => p.status === 'completed' && isInCurrentMonth(p.payment_date))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalExpenses = expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyExpenses = expenses
      .filter(e => e.status === 'approved' && isInCurrentMonth(e.expense_date))
      .reduce((sum, e) => sum + e.amount, 0);

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const approvedExpenses = expenses.filter(e => e.status === 'approved').length;
    const pendingExpenses = expenses.filter(e => e.status === 'pending').length;

    const averageTransaction = completedPayments > 0 ? totalRevenue / completedPayments : 0;

    const netProfit = totalRevenue - totalExpenses;
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    // Calculate growth percentages
    const revenueGrowth = revenue.growth_percentage;
    const expenseGrowth = 0; // Would need historical data to calculate
    const profitGrowth = revenueGrowth - expenseGrowth;

    return {
      totalRevenue,
      totalOutstanding,
      totalAccounts: accounts.length,
      monthlyRevenue,
      pendingPayments,
      completedPayments,
      totalBalance,
      averageTransaction,
      totalExpenses,
      monthlyExpenses,
      pendingExpenses,
      approvedExpenses,
      netProfit,
      monthlyProfit,
      activeAccounts: accounts.filter(acc => acc.is_active).length,
      revenueGrowth,
      expenseGrowth,
      profitGrowth
    };
  }

  // Get financial data for specific period
  async getFinancialDataForPeriod(startDate: string, endDate: string): Promise<FinancialAnalytics | null> {
    try {
      const { data: payments, error: paymentsError } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model),
          customers!inner(name)
        `)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .order('payment_date', { ascending: false });

      const { data: expenses, error: expensesError } = await supabase
        .from('finance_expenses')
        .select(`
          *,
          finance_accounts(name)
        `)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

      if (paymentsError) {
        throw new Error('Failed to fetch period payments');
      }

      const transformedPayments = payments?.map((payment: any) => ({
        ...payment,
        device_name: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined,
        customer_name: payment.customers?.name || undefined
      })) || [];

      const transformedExpenses = expenses?.map((expense: any) => ({
        ...expense,
        account_name: expense.finance_accounts?.name || undefined
      })) || [];

      // Get accounts and revenue for summary calculation
      const [accounts, revenue] = await Promise.all([
        this.getAccounts(),
        this.getRevenueAnalytics()
      ]);

      const summary = this.calculateFinancialSummary(
        transformedPayments,
        transformedExpenses,
        accounts,
        revenue
      );

      return {
        summary,
        payments: transformedPayments,
        expenses: transformedExpenses,
        accounts,
        transfers: [],
        revenue,
        trends: { monthly: [], daily: [] }
      };
    } catch (error) {
      console.error('Error fetching financial data for period:', error);
      return null;
    }
  }

  // Export financial data to CSV
  async exportFinancialData(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const data = await this.getComprehensiveFinancialData();
      if (!data) throw new Error('Failed to fetch financial data');

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      }

      // CSV format
      const csvRows = [];
      
      // Summary row
      csvRows.push(['Financial Summary']);
      csvRows.push(['Total Revenue', data.summary.totalRevenue]);
      csvRows.push(['Total Expenses', data.summary.totalExpenses]);
      csvRows.push(['Net Profit', data.summary.netProfit]);
      csvRows.push(['Total Balance', data.summary.totalBalance]);
      csvRows.push([]);

      // Payments
      csvRows.push(['Payments']);
      csvRows.push(['Date', 'Customer', 'Amount', 'Method', 'Status', 'Device']);
      data.payments.forEach(payment => {
        csvRows.push([
          payment.payment_date,
          payment.customer_name || 'N/A',
          payment.amount,
          payment.method,
          payment.status,
          payment.device_name || 'N/A'
        ]);
      });
      csvRows.push([]);

      // Expenses
      csvRows.push(['Expenses']);
      csvRows.push(['Date', 'Title', 'Category', 'Amount', 'Status', 'Account']);
      data.expenses.forEach(expense => {
        csvRows.push([
          expense.expense_date,
          expense.title,
          expense.category,
          expense.amount,
          expense.status,
          expense.account_name || 'N/A'
        ]);
      });

      return csvRows.map(row => row.join(',')).join('\n');
    } catch (error) {
      console.error('Error exporting financial data:', error);
      throw error;
    }
  }
}

export const financialService = new FinancialService();
export default financialService; 