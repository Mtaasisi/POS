import { supabase } from '../supabaseClient';

export interface CustomerRevenue {
  id: string;
  customer_id: string;
  revenue_type: 'device_repair' | 'pos_sale' | 'service_fee' | 'consultation';
  amount: number;
  transaction_date: string;
  order_id?: string;
  device_id?: string;
  description?: string;
  created_at: string;
  // Joined fields
  customer_name?: string;
  device_name?: string;
}

export interface CustomerRevenueSummary {
  totalRevenue: number;
  deviceRevenue: number;
  posRevenue: number;
  serviceRevenue: number;
  consultationRevenue: number;
  transactionCount: number;
  averageTransaction: number;
  lastTransactionDate?: string;
}

// Fetch customer revenue data
export async function fetchCustomerRevenue(customerId: string): Promise<CustomerRevenue[]> {
  try {
    console.log(`💰 Fetching revenue for customer: ${customerId}`);
    
    // Check if user is authenticated first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('User not authenticated, skipping customer revenue fetch');
      return [];
    }
    
    const { data, error } = await supabase
      .from('customer_payments')
      .select(`
        *,
        customers!inner(name),
        devices(device_name)
      `)
      .eq('customer_id', customerId)
      .order('payment_date', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching customer revenue:', error);
      throw error;
    }
    
    const revenue = data?.map(item => ({
      id: item.id,
      customer_id: item.customer_id,
      revenue_type: (item.payment_type === 'device_payment' ? 'device_repair' : 
                    item.payment_type === 'pos_payment' ? 'pos_sale' : 
                    item.payment_type === 'service_payment' ? 'service_fee' : 
                    'consultation') as 'device_repair' | 'pos_sale' | 'service_fee' | 'consultation',
      amount: item.amount,
      transaction_date: item.payment_date,
      order_id: item.device_id,
      device_id: item.device_id,
      description: `${item.payment_type} payment`,
      created_at: item.created_at,
      customer_name: item.customers?.name,
      device_name: item.devices?.device_name
    })) || [];
    
    console.log(`✅ Fetched ${revenue.length} revenue records for customer`);
    return revenue;
  } catch (error) {
    console.error('❌ Error fetching customer revenue:', error);
    throw error;
  }
}

// Get customer revenue summary
export async function getCustomerRevenueSummary(customerId: string): Promise<CustomerRevenueSummary> {
  try {
    console.log(`💰 Calculating revenue summary for customer: ${customerId}`);
    
    const { data, error } = await supabase
      .from('customer_payments')
      .select('payment_type, amount, payment_date')
      .eq('customer_id', customerId);
    
    if (error) {
      console.error('❌ Error fetching customer revenue summary:', error);
      throw error;
    }
    
    const revenue = data || [];
    const totalRevenue = revenue.reduce((sum, item) => sum + Number(item.amount), 0);
    const deviceRevenue = revenue
      .filter(item => item.payment_type === 'device_payment')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const posRevenue = revenue
      .filter(item => item.payment_type === 'pos_payment')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const serviceRevenue = revenue
      .filter(item => item.payment_type === 'service_payment')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const consultationRevenue = revenue
      .filter(item => item.payment_type === 'consultation_payment')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    
    const transactionCount = revenue.length;
    const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    const lastTransactionDate = revenue.length > 0 
      ? revenue.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0].payment_date
      : undefined;
    
    const summary: CustomerRevenueSummary = {
      totalRevenue,
      deviceRevenue,
      posRevenue,
      serviceRevenue,
      consultationRevenue,
      transactionCount,
      averageTransaction,
      lastTransactionDate
    };
    
    console.log('✅ Customer revenue summary calculated');
    return summary;
  } catch (error) {
    console.error('❌ Error calculating customer revenue summary:', error);
    throw error;
  }
}

// Add revenue record
export async function addCustomerRevenue(revenueData: {
  customer_id: string;
  revenue_type: 'device_repair' | 'pos_sale' | 'service_fee' | 'consultation';
  amount: number;
  order_id?: string;
  device_id?: string;
  description?: string;
}): Promise<CustomerRevenue> {
  try {
    console.log('💰 Adding customer revenue record...');
    
    const { data, error } = await supabase
      .from('customer_revenue')
      .insert([{
        ...revenueData,
        transaction_date: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error adding customer revenue:', error);
      throw error;
    }
    
    console.log('✅ Customer revenue record added successfully');
    return data;
  } catch (error) {
    console.error('❌ Error adding customer revenue:', error);
    throw error;
  }
}

// Get all customers revenue summary
export async function getAllCustomersRevenueSummary(): Promise<{
  totalRevenue: number;
  deviceRevenue: number;
  posRevenue: number;
  serviceRevenue: number;
  consultationRevenue: number;
  customerCount: number;
  averageRevenuePerCustomer: number;
}> {
  try {
    console.log('💰 Calculating all customers revenue summary...');
    
    const { data, error } = await supabase
      .from('customer_revenue')
      .select('revenue_type, amount, customer_id');
    
    if (error) {
      console.error('❌ Error fetching all customers revenue:', error);
      throw error;
    }
    
    const revenue = data || [];
    const totalRevenue = revenue.reduce((sum, item) => sum + Number(item.amount), 0);
    const deviceRevenue = revenue
      .filter(item => item.revenue_type === 'device_repair')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const posRevenue = revenue
      .filter(item => item.revenue_type === 'pos_sale')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const serviceRevenue = revenue
      .filter(item => item.revenue_type === 'service_fee')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const consultationRevenue = revenue
      .filter(item => item.revenue_type === 'consultation')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Get unique customer count
    const uniqueCustomers = new Set(revenue.map(item => item.customer_id));
    const customerCount = uniqueCustomers.size;
    const averageRevenuePerCustomer = customerCount > 0 ? totalRevenue / customerCount : 0;
    
    const summary = {
      totalRevenue,
      deviceRevenue,
      posRevenue,
      serviceRevenue,
      consultationRevenue,
      customerCount,
      averageRevenuePerCustomer
    };
    
    console.log('✅ All customers revenue summary calculated');
    return summary;
  } catch (error) {
    console.error('❌ Error calculating all customers revenue summary:', error);
    throw error;
  }
}

// Get revenue by date range
export async function getRevenueByDateRange(startDate: string, endDate: string): Promise<CustomerRevenue[]> {
  try {
    console.log(`💰 Fetching revenue from ${startDate} to ${endDate}`);
    
    const { data, error } = await supabase
      .from('customer_revenue')
      .select(`
        *,
        customers!inner(name),
        devices(device_name)
      `)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching revenue by date range:', error);
      throw error;
    }
    
    const revenue = data?.map(item => ({
      ...item,
      customer_name: item.customers?.name,
      device_name: item.devices?.device_name
    })) || [];
    
    console.log(`✅ Fetched ${revenue.length} revenue records for date range`);
    return revenue;
  } catch (error) {
    console.error('❌ Error fetching revenue by date range:', error);
    throw error;
  }
}

// Get top customers by revenue
export async function getTopCustomersByRevenue(limit: number = 10): Promise<Array<{
  customer_id: string;
  customer_name: string;
  total_revenue: number;
  transaction_count: number;
}>> {
  try {
    console.log(`💰 Fetching top ${limit} customers by revenue`);
    
    const { data, error } = await supabase
      .from('customer_revenue')
      .select(`
        customer_id,
        amount,
        customers!inner(name)
      `);
    
    if (error) {
      console.error('❌ Error fetching top customers by revenue:', error);
      throw error;
    }
    
    // Group by customer and calculate totals
    const customerTotals = new Map<string, { name: string; total: number; count: number }>();
    
    data?.forEach(item => {
      const customerId = item.customer_id;
      const customerName = item.customers?.name || 'Unknown';
      const amount = Number(item.amount);
      
      if (customerTotals.has(customerId)) {
        const existing = customerTotals.get(customerId)!;
        existing.total += amount;
        existing.count += 1;
      } else {
        customerTotals.set(customerId, { name: customerName, total: amount, count: 1 });
      }
    });
    
    // Sort by total revenue and take top customers
    const topCustomers = Array.from(customerTotals.entries())
      .map(([customer_id, data]) => ({
        customer_id,
        customer_name: data.name,
        total_revenue: data.total,
        transaction_count: data.count
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
    
    console.log(`✅ Fetched top ${topCustomers.length} customers by revenue`);
    return topCustomers;
  } catch (error) {
    console.error('❌ Error fetching top customers by revenue:', error);
    throw error;
  }
}
