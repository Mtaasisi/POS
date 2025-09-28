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
      console.log('🔧 RepairPaymentService: Creating repair payment...');
      console.log('📊 Input data:', JSON.stringify(data, null, 2));
      console.log('👤 Passed userId:', userId);
      
      // 1. CRITICAL: Ensure user is authenticated before proceeding
      console.log('🔐 Step 1: Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('🔍 Auth check result:', {
        hasUser: !!user,
        userEmail: user?.email,
        userId: user?.id,
        authError: authError?.message || 'None'
      });
      
      if (authError || !user) {
        console.error('❌ Authentication failed!');
        console.error('🔍 Auth error details:', {
          code: authError?.code,
          message: authError?.message,
          details: authError?.details,
          hint: authError?.hint
        });
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      console.log('✅ User authenticated successfully:', {
        email: user.email,
        id: user.id,
        role: user.role
      });
      
      // 2. Validate input data
      console.log('🔍 Step 2: Validating input data...');
      if (!data.customerId) {
        console.error('❌ Validation failed: Customer ID is required');
        throw new Error('Customer ID is required for repair payment');
      }
      
      if (!data.amount || data.amount <= 0) {
        console.error('❌ Validation failed: Invalid amount');
        throw new Error('Valid amount is required for repair payment');
      }
      
      if (!data.paymentMethod) {
        console.error('❌ Validation failed: Payment method is required');
        throw new Error('Payment method is required for repair payment');
      }
      
      if (!data.paymentAccountId) {
        console.error('❌ Validation failed: Payment account ID is required');
        throw new Error('Payment account ID is required for repair payment');
      }
      
      console.log('✅ Input validation passed');
      
      // 3. Get payment account details
      console.log('🔍 Step 3: Fetching payment account details...');
      console.log('📋 Payment account ID:', data.paymentAccountId);
      
      const paymentAccount = await financeAccountService.getFinanceAccountById(data.paymentAccountId);
      if (!paymentAccount) {
        console.error('❌ Payment account not found for ID:', data.paymentAccountId);
        throw new Error('Payment account not found');
      }
      
      console.log('✅ Payment account found:', {
        id: paymentAccount.id,
        name: paymentAccount.name,
        balance: paymentAccount.balance,
        currency: paymentAccount.currency
      });

      // 4. Prepare payment data
      console.log('🔍 Step 4: Preparing payment data...');
      const paymentData = {
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
      };
      
      console.log('📤 Payment data to insert:', JSON.stringify(paymentData, null, 2));
      console.log('📋 Data types:', {
        customer_id: typeof paymentData.customer_id,
        device_id: typeof paymentData.device_id,
        amount: typeof paymentData.amount,
        method: typeof paymentData.method,
        payment_type: typeof paymentData.payment_type,
        status: typeof paymentData.status,
        currency: typeof paymentData.currency,
        payment_account_id: typeof paymentData.payment_account_id,
        payment_method_id: typeof paymentData.payment_method_id,
        reference: typeof paymentData.reference,
        notes: typeof paymentData.notes,
        payment_date: typeof paymentData.payment_date,
        created_by: typeof paymentData.created_by
      });

      // 5. Create payment record with ALL required fields
      console.log('🔍 Step 5: Inserting payment record...');
      console.log('📡 Making Supabase request to customer_payments table...');
      
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('customer_payments')
        .insert([paymentData])
        .select()
        .single();

      console.log('📡 Supabase response received');
      
      if (paymentError) {
        console.error('❌ Payment insert failed!');
        console.error('🔍 Error details:', {
          code: paymentError.code,
          message: paymentError.message,
          details: paymentError.details,
          hint: paymentError.hint,
          status: paymentError.status,
          statusText: paymentError.statusText
        });
        
        // Handle specific error types
        if (paymentError.message.includes('row-level security policy')) {
          console.error('🚫 RLS Policy violation - user not authorized');
          throw new Error('Authentication failed. Please log in and try again.');
        }
        
        if (paymentError.message.includes('violates check constraint')) {
          console.error('🚫 Check constraint violation - field values invalid');
          console.error('💡 Check if method, status, or payment_type values are allowed');
        }
        
        if (paymentError.message.includes('violates foreign key constraint')) {
          console.error('🚫 Foreign key violation - referenced IDs don\'t exist');
          console.error('💡 Check if customer_id or payment_account_id exist in related tables');
        }
        
        if (paymentError.message.includes('violates not-null constraint')) {
          console.error('🚫 Not-null constraint violation - required field missing');
          console.error('💡 Check if all required fields are provided');
        }
        
        throw new Error(`Failed to create repair payment record: ${paymentError.message}`);
      }
      
      console.log('✅ Payment record created successfully!');
      console.log('📊 Created payment:', JSON.stringify(paymentRecord, null, 2));

      // 6. Update finance account balance
      console.log('🔍 Step 6: Updating finance account balance...');
      console.log('📋 Account balance update:', {
        accountId: data.paymentAccountId,
        currentBalance: paymentAccount.balance,
        paymentAmount: data.amount,
        newBalance: paymentAccount.balance + data.amount
      });
      
      const { error: balanceError } = await supabase
        .from('finance_accounts')
        .update({ 
          balance: paymentAccount.balance + data.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.paymentAccountId);

      if (balanceError) {
        console.error('⚠️ Error updating account balance:', {
          code: balanceError.code,
          message: balanceError.message,
          details: balanceError.details
        });
        // Don't throw error as payment was already recorded
      } else {
        console.log('✅ Finance account balance updated successfully');
      }

      // 7. Create finance transaction record
      console.log('🔍 Step 7: Creating finance transaction record...');
      const transactionData = {
        account_id: data.paymentAccountId,
        type: 'income',
        amount: data.amount,
        description: `Repair payment${data.deviceId ? ' (device repair)' : ''}`,
        reference: data.reference?.trim() || null,
        category: 'repair_services',
        created_by: user.id, // Use authenticated user's ID
        payment_id: paymentRecord.id
      };
      
      console.log('📤 Transaction data to insert:', JSON.stringify(transactionData, null, 2));
      
      const { error: transactionError } = await supabase
        .from('finance_transactions')
        .insert(transactionData);

      if (transactionError) {
        console.error('⚠️ Error creating transaction record:', {
          code: transactionError.code,
          message: transactionError.message,
          details: transactionError.details
        });
        // Don't throw error as payment was already recorded
      } else {
        console.log('✅ Finance transaction record created successfully');
      }

      console.log('🎉 RepairPaymentService: Payment process completed successfully!');
      console.log('📊 Final result:', {
        paymentId: paymentRecord.id,
        amount: paymentRecord.amount,
        customerId: paymentRecord.customer_id,
        deviceId: paymentRecord.device_id,
        method: paymentRecord.method,
        status: paymentRecord.status
      });
      
      return paymentRecord;
    } catch (error) {
      console.error('❌ RepairPaymentService: Critical error in payment process');
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      console.error('📊 Input data that caused error:', JSON.stringify(data, null, 2));
      console.error('👤 User ID passed to function:', userId);
      
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
