// Fixed Repair Payment Service
// This addresses all the issues found in the repair payment system

import { supabase } from './supabaseClient';
import { financeAccountService } from './financeAccountService';

export interface CreateRepairPaymentData {
  customerId: string;
  deviceId?: string;
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  reference?: string;
  notes?: string;
  currency?: string; // Added currency field
}

export interface RepairPayment {
  id: string;
  customer_id: string;
  device_id?: string;
  amount: number;
  method: string;
  payment_type: string;
  status: string;
  currency: string;
  payment_account_id?: string;
  payment_method_id?: string;
  reference?: string;
  notes?: string;
  payment_date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  device_name?: string;
  payment_account_name?: string;
}

class RepairPaymentService {
  // Create a new repair payment with all required fields
  async createRepairPayment(data: CreateRepairPaymentData, userId: string): Promise<RepairPayment> {
    try {
      console.log('🔧 RepairPaymentService: Creating repair payment...', data);
      
      // Validate required fields
      if (!data.customerId) {
        throw new Error('Customer ID is required for repair payment');
      }
      
      if (!data.amount || data.amount <= 0) {
        throw new Error('Valid amount is required for repair payment');
      }
      
      if (!data.paymentMethod) {
        throw new Error('Payment method is required for repair payment');
      }
      
      if (!data.paymentAccountId) {
        throw new Error('Payment account ID is required for repair payment');
      }
      
      // Get payment account details
      const paymentAccount = await financeAccountService.getFinanceAccountById(data.paymentAccountId);
      if (!paymentAccount) {
        throw new Error('Payment account not found');
      }

      // Prepare payment data with all required fields
      const paymentData = {
        customer_id: data.customerId,
        device_id: data.deviceId || null,
        amount: data.amount,
        method: data.paymentMethod,
        payment_type: 'payment',
        status: 'completed',
        currency: data.currency || 'TZS',
        payment_account_id: data.paymentAccountId,
        payment_method_id: data.paymentAccountId, // Use account ID as method ID for now
        reference: data.reference || null,
        notes: data.notes || null,
        payment_date: new Date().toISOString(),
        created_by: userId,
        updated_at: new Date().toISOString()
      };

      console.log('🔧 RepairPaymentService: Inserting payment with data:', paymentData);

      // Create payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('customer_payments')
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        console.error('❌ Error creating repair payment:', paymentError);
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

      // Create finance transaction record (optional)
      try {
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
      } catch (transactionErr) {
        console.warn('⚠️ Finance transactions table may not exist, skipping transaction record');
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
        console.error('❌ Error fetching customer repair payments:', error);
        throw error;
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
      console.log('🔍 RepairPaymentService: Fetching repair payments for device:', deviceId);
      
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
        payment_account_name: payment.method
      })) || [];

      console.log('✅ RepairPaymentService: Fetched device repair payments:', payments.length);
      return payments;
    } catch (error) {
      console.error('❌ RepairPaymentService: Error fetching device repair payments:', error);
      return [];
    }
  }

  // Get all repair payments with pagination
  async getAllRepairPayments(limit: number = 50, offset: number = 0): Promise<RepairPayment[]> {
    try {
      console.log('🔍 RepairPaymentService: Fetching all repair payments...');
      
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          customers(name),
          devices(brand, model)
        `)
        .eq('payment_type', 'payment')
        .order('payment_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error fetching all repair payments:', error);
        throw error;
      }

      const payments = data?.map(payment => ({
        ...payment,
        customer_name: payment.customers?.name,
        device_name: payment.devices ? `${payment.devices.brand} ${payment.devices.model}` : undefined,
        payment_account_name: payment.method
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
    paymentsByMethod: Record<string, number>;
    paymentsByStatus: Record<string, number>;
  }> {
    try {
      console.log('🔍 RepairPaymentService: Fetching repair payment stats...');
      
      const { data, error } = await supabase
        .from('customer_payments')
        .select('amount, method, status')
        .eq('payment_type', 'payment');

      if (error) {
        console.error('❌ Error fetching repair payment stats:', error);
        throw error;
      }

      const totalPayments = data?.length || 0;
      const totalAmount = data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

      const paymentsByMethod = data?.reduce((acc, payment) => {
        acc[payment.method] = (acc[payment.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const paymentsByStatus = data?.reduce((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalPayments,
        totalAmount,
        averageAmount,
        paymentsByMethod,
        paymentsByStatus
      };
    } catch (error) {
      console.error('❌ RepairPaymentService: Error fetching repair payment stats:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        paymentsByMethod: {},
        paymentsByStatus: {}
      };
    }
  }
}

export const repairPaymentService = new RepairPaymentService();
