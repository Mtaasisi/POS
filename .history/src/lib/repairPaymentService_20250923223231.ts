import { supabase } from './supabaseClient';
import { financeAccountService } from './financeAccountService';

export interface RepairPayment {
  id: string;
  customer_id: string;
  device_id?: string;
  amount: number;
  method: string;
  payment_type: 'payment' | 'deposit' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  payment_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  device_name?: string;
}

export interface CreateRepairPaymentData {
  customerId: string;
  deviceId?: string;
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  reference?: string;
  notes?: string;
}

class RepairPaymentService {
  // Create a new repair payment
  async createRepairPayment(data: CreateRepairPaymentData, userId: string): Promise<RepairPayment> {
    try {
      console.log('🔧 RepairPaymentService: Creating repair payment...', data);
      
      // 1. CRITICAL: Ensure user is authenticated before proceeding
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Authentication error:', authError);
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      console.log('✅ User authenticated:', user.email);
      
      // 2. Validate customer ID
      if (!data.customerId) {
        throw new Error('Customer ID is required for repair payment');
      }
      
      // 3. Get payment account details
      const paymentAccount = await financeAccountService.getFinanceAccountById(data.paymentAccountId);
      if (!paymentAccount) {
        throw new Error('Payment account not found');
      }

      // 4. Create payment record with ALL required fields
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('customer_payments')
        .insert({
          customer_id: data.customerId,
          device_id: data.deviceId || null,
          amount: data.amount,
          method: data.paymentMethod,
          payment_type: 'payment',
          status: 'completed',
          currency: 'TZS', // Add required currency field
          payment_account_id: data.paymentAccountId, // Add required payment_account_id
          payment_method_id: data.paymentAccountId, // Use account ID as method ID
          reference: data.reference || null, // Add reference field
          notes: data.notes || null, // Add notes field
          payment_date: new Date().toISOString(),
          created_by: user.id // Use authenticated user's ID
        })
        .select()
        .single();

      if (paymentError) {
        console.error('❌ Error creating repair payment:', paymentError);
        
        // Handle specific error types
        if (paymentError.message.includes('row-level security policy')) {
          throw new Error('Authentication failed. Please log in and try again.');
        }
        
        throw new Error(`Failed to create repair payment record: ${paymentError.message}`);
      }

      // Update finance account balance
      const { error: balanceError } = await supabase
        .from('finance_accounts')
        .update({ 
          balance: paymentAccount.balance + data.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.paymentAccountId);

      if (balanceError) {
        console.error('⚠️ Error updating account balance:', balanceError);
        // Don't throw error as payment was already recorded
      }

      // Create finance transaction record
      const { error: transactionError } = await supabase
        .from('finance_transactions')
        .insert({
          account_id: data.paymentAccountId,
          type: 'income',
          amount: data.amount,
          description: `Repair payment${data.deviceId ? ' (device repair)' : ''}`,
          reference: data.reference?.trim() || null,
          category: 'repair_services',
          created_by: userId,
          payment_id: paymentRecord.id
        });

      if (transactionError) {
        console.error('⚠️ Error creating transaction record:', transactionError);
        // Don't throw error as payment was already recorded
      }

      console.log('✅ RepairPaymentService: Repair payment created successfully');
      return paymentRecord;
    } catch (error) {
      console.error('❌ RepairPaymentService: Error creating repair payment:', error);
      throw error;
    }
  }

  // Get repair payments for a customer
  async getCustomerRepairPayments(customerId: string): Promise<RepairPayment[]> {
    try {
      console.log('🔍 RepairPaymentService: Fetching repair payments for customer:', customerId);
      
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          customers(name),
          devices(brand, model)
        `)
        .eq('customer_id', customerId)
        .eq('payment_type', 'payment')
        .order('payment_date', { ascending: false });

      if (error) {
        console.log('⚠️ RepairPaymentService: customer_payments table not found or error:', error);
        return []; // Return empty array instead of throwing error
      }

      const payments = data?.map(payment => ({
        ...payment,
        customer_name: payment.customers?.name,
        device_name: payment.devices ? `${payment.devices.brand} ${payment.devices.model}` : undefined,
        payment_account_name: payment.method // Use method as account name since finance_accounts join is not available
      })) || [];

      console.log('✅ RepairPaymentService: Fetched repair payments:', payments.length);
      return payments;
    } catch (error) {
      console.error('❌ RepairPaymentService: Error fetching customer repair payments:', error);
      return [];
    }
  }

  // Get repair payments for a device
  async getDeviceRepairPayments(deviceId: string): Promise<RepairPayment[]> {
    try {
      // Fetching repair payments for device
      
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          customers(name),
          devices(brand, model)
        `)
        .eq('device_id', deviceId)
        .eq('payment_type', 'payment')
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching device repair payments:', error);
        throw error;
      }

      const payments = data?.map(payment => ({
        ...payment,
        customer_name: payment.customers?.name,
        device_name: payment.devices ? `${payment.devices.brand} ${payment.devices.model}` : undefined,
        payment_account_name: payment.method // Use method as account name since finance_accounts join is not available
      })) || [];

        // Successfully fetched repair payments
      return payments;
    } catch (error) {
      console.error('❌ RepairPaymentService: Error fetching device repair payments:', error);
      return [];
    }
  }

  // Get all repair payments
  async getAllRepairPayments(limit = 100): Promise<RepairPayment[]> {
    try {
      console.log('🔍 RepairPaymentService: Fetching all repair payments...');
      
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          customers(name),
          devices(brand, model),
          finance_accounts(name)
        `)
        .eq('payment_type', 'payment')
        .order('payment_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching all repair payments:', error);
        throw error;
      }

      const payments = data?.map(payment => ({
        ...payment,
        customer_name: payment.customers?.name,
        device_name: payment.devices ? `${payment.devices.brand} ${payment.devices.model}` : undefined,
        payment_account_name: payment.method // Use method as account name since finance_accounts join is not available
      })) || [];

      console.log('✅ RepairPaymentService: Fetched all repair payments:', payments.length);
      return payments;
    } catch (error) {
      console.error('❌ RepairPaymentService: Error fetching all repair payments:', error);
      return [];
    }
  }

  // Get repair payment statistics
  async getRepairPaymentStats(): Promise<{
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
    paymentsByStatus: Record<string, number>;
    paymentsByMethod: Record<string, number>;
  }> {
    try {
      console.log('📊 RepairPaymentService: Fetching repair payment statistics...');
      
      const { data, error } = await supabase
        .from('customer_payments')
        .select('amount, status, method')
        .eq('payment_type', 'payment');

      if (error) {
        console.error('❌ Error fetching repair payment stats:', error);
        throw error;
      }

      const payments = data || [];
      const totalPayments = payments.length;
      const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

      const paymentsByStatus = payments.reduce((acc, payment) => {
        const status = payment.payment_status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const paymentsByMethod = payments.reduce((acc, payment) => {
        const method = payment.method || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('✅ RepairPaymentService: Calculated payment statistics');
      return {
        totalPayments,
        totalAmount,
        averageAmount,
        paymentsByStatus,
        paymentsByMethod
      };
    } catch (error) {
      console.error('❌ RepairPaymentService: Error calculating payment statistics:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        paymentsByStatus: {},
        paymentsByMethod: {}
      };
    }
  }
}

export const repairPaymentService = new RepairPaymentService();
