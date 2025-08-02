import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class FinancialDataFetcher {
  async getComprehensiveFinancialData() {
    try {
      console.log('🔄 Fetching comprehensive financial data...');
      
      const [
        payments,
        expenses,
        accounts,
        transfers,
        revenue,
        trends
      ] = await Promise.all([
        this.getPayments(),
        this.getExpenses(),
        this.getAccounts(),
        this.getTransfers(),
        this.getRevenueAnalytics(),
        this.getFinancialTrends()
      ]);

      const summary = this.calculateFinancialSummary(payments, expenses, accounts, revenue);

      return {
        summary,
        payments,
        expenses,
        accounts,
        transfers: transfers || [],
        revenue,
        trends
      };
    } catch (error) {
      console.error('❌ Error fetching comprehensive financial data:', error);
      return null;
    }
  }

  async getPayments() {
    try {
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model),
          customers(name)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      const transformedPayments = data?.map((payment) => ({
        ...payment,
        device_name: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined,
        customer_name: payment.customers?.name || undefined
      })) || [];

      console.log(`✅ Fetched ${transformedPayments.length} payments`);
      return transformedPayments;
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      return [];
    }
  }

  async getExpenses() {
    try {
      const { data, error } = await supabase
        .from('finance_expenses')
        .select(`
          *,
          finance_accounts(name)
        `)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      const transformedExpenses = data?.map((expense) => ({
        ...expense,
        account_name: expense.finance_accounts?.name || undefined
      })) || [];

      console.log(`✅ Fetched ${transformedExpenses.length} expenses`);
      return transformedExpenses;
    } catch (error) {
      console.error('❌ Error fetching expenses:', error);
      return [];
    }
  }

  async getAccounts() {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Fetched ${data?.length || 0} accounts`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching accounts:', error);
      return [];
    }
  }

  async getTransfers() {
    try {
      const { data, error } = await supabase
        .from('finance_transfers')
        .select(`
          *,
          from_account:finance_accounts!finance_transfers_from_account_id_fkey(name),
          to_account:finance_accounts!finance_transfers_to_account_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedTransfers = data?.map((transfer) => ({
        ...transfer,
        from_account_name: transfer.from_account?.name || undefined,
        to_account_name: transfer.to_account?.name || undefined
      })) || [];

      console.log(`✅ Fetched ${transformedTransfers.length} transfers`);
      return transformedTransfers;
    } catch (error) {
      console.error('❌ Error fetching transfers:', error);
      return [];
    }
  }

  async getRevenueAnalytics() {
    try {
      const { data: devices, error } = await supabase
        .from('devices')
        .select('repair_cost, device_cost, created_at');
      
      if (error) throw error;

      if (!devices || devices.length === 0) {
        console.log('⚠️ No devices found for revenue calculation');
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

      devices.forEach(device => {
        const revenue = (device.repair_cost || 0) + (device.device_cost || 0);
        total += revenue;

        if (device.created_at) {
          const createdDate = new Date(device.created_at);
          
          if (createdDate >= startOfMonth) {
            this_month += revenue;
          }
          
          if (createdDate >= startOfLastMonth && createdDate <= endOfLastMonth) {
            last_month += revenue;
          }
          
          if (createdDate >= startOfWeek) {
            this_week += revenue;
          }
          
          if (createdDate >= startOfDay) {
            today += revenue;
          }
        }
      });

      const growth_percentage = last_month > 0 ? 
        ((this_month - last_month) / last_month) * 100 : 0;

      const revenue = {
        total,
        this_month,
        last_month,
        this_week,
        today,
        growth_percentage
      };

      console.log(`✅ Revenue analytics calculated: $${total.toFixed(2)} total`);
      return revenue;
    } catch (error) {
      console.error('❌ Error calculating revenue analytics:', error);
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

  async getFinancialTrends() {
    try {
      const [payments, expenses] = await Promise.all([
        this.getPayments(),
        this.getExpenses()
      ]);

      const monthlyData = new Map();
      const dailyData = new Map();

      // Process payments
      payments.forEach(payment => {
        if (payment.status === 'completed') {
          const date = new Date(payment.payment_date);
          const monthKey = date.toISOString().slice(0, 7);
          const dayKey = date.toISOString().slice(0, 10);

          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { revenue: 0, expenses: 0, profit: 0, payments: 0 });
          }
          const monthData = monthlyData.get(monthKey);
          monthData.revenue += payment.amount || 0;
          monthData.payments += 1;
          monthData.profit = monthData.revenue - monthData.expenses;

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

          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { revenue: 0, expenses: 0, profit: 0, payments: 0 });
          }
          const monthData = monthlyData.get(monthKey);
          monthData.expenses += expense.amount;
          monthData.profit = monthData.revenue - monthData.expenses;

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

      console.log(`✅ Financial trends calculated: ${monthly.length} months, ${daily.length} days`);
      return { monthly, daily };
    } catch (error) {
      console.error('❌ Error calculating financial trends:', error);
      return { monthly: [], daily: [] };
    }
  }

  calculateFinancialSummary(payments, expenses, accounts, revenue) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isInCurrentMonth = (date) => {
      const itemDate = new Date(date);
      return itemDate >= startOfMonth;
    };

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

    const revenueGrowth = revenue.growth_percentage;
    const expenseGrowth = 0;
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

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  printSummary(summary) {
    console.log('\n📊 FINANCIAL SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Revenue: ${this.formatCurrency(summary.totalRevenue)}`);
    console.log(`Total Expenses: ${this.formatCurrency(summary.totalExpenses)}`);
    console.log(`Net Profit: ${this.formatCurrency(summary.netProfit)}`);
    console.log(`Total Balance: ${this.formatCurrency(summary.totalBalance)}`);
    console.log(`Monthly Revenue: ${this.formatCurrency(summary.monthlyRevenue)}`);
    console.log(`Monthly Profit: ${this.formatCurrency(summary.monthlyProfit)}`);
    console.log(`Outstanding Payments: ${this.formatCurrency(summary.totalOutstanding)}`);
    console.log(`Completed Payments: ${summary.completedPayments}`);
    console.log(`Pending Payments: ${summary.pendingPayments}`);
    console.log(`Total Accounts: ${summary.totalAccounts}`);
    console.log(`Active Accounts: ${summary.activeAccounts}`);
    console.log(`Average Transaction: ${this.formatCurrency(summary.averageTransaction)}`);
    console.log(`Revenue Growth: ${summary.revenueGrowth.toFixed(1)}%`);
    console.log(`Profit Growth: ${summary.profitGrowth.toFixed(1)}%`);
    console.log('='.repeat(50));
  }
}

async function main() {
  console.log('🚀 Starting Financial Data Test...\n');
  
  const fetcher = new FinancialDataFetcher();
  
  try {
    const data = await fetcher.getComprehensiveFinancialData();
    
    if (data) {
      fetcher.printSummary(data.summary);
      
      console.log('\n📈 REVENUE ANALYTICS');
      console.log(`Total: ${fetcher.formatCurrency(data.revenue.total)}`);
      console.log(`This Month: ${fetcher.formatCurrency(data.revenue.this_month)}`);
      console.log(`This Week: ${fetcher.formatCurrency(data.revenue.this_week)}`);
      console.log(`Today: ${fetcher.formatCurrency(data.revenue.today)}`);
      console.log(`Growth: ${data.revenue.growth_percentage.toFixed(1)}%`);
      
      console.log('\n📋 DATA COUNTS');
      console.log(`Payments: ${data.payments.length}`);
      console.log(`Expenses: ${data.expenses.length}`);
      console.log(`Accounts: ${data.accounts.length}`);
      console.log(`Transfers: ${data.transfers.length}`);
      
      if (data.trends.monthly.length > 0) {
        console.log('\n📅 RECENT MONTHLY TRENDS');
        data.trends.monthly.slice(-3).forEach(month => {
          console.log(`${month.month}: Revenue ${fetcher.formatCurrency(month.revenue)}, Profit ${fetcher.formatCurrency(month.profit)}`);
        });
      }
      
      console.log('\n✅ Financial data test completed successfully!');
    } else {
      console.log('❌ Failed to fetch financial data');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

main(); 