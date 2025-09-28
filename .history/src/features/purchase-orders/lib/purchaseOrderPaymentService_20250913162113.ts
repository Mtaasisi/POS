import { supabase } from '../../../lib/supabaseClient';
import { FinanceAccount } from '../../../lib/financeAccountService';

export interface PurchaseOrderPayment {
  id: string;
  purchaseOrderId: string;
  paymentAccountId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentMethodId: string;
  reference?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderPaymentData {
  purchaseOrderId: string;
  paymentAccountId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  paymentMethodId: string;
  reference?: string;
  notes?: string;
  createdBy: string;
}

class PurchaseOrderPaymentService {
  // Create a new purchase order payment
  async createPurchaseOrderPayment(data: CreatePurchaseOrderPaymentData): Promise<PurchaseOrderPayment> {
    try {
      console.log('💰 PurchaseOrderPaymentService: Creating purchase order payment...', data);
      
      // Validate payment account
      const { data: paymentAccount, error: accountError } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('id', data.paymentAccountId)
        .single();

      if (accountError || !paymentAccount) {
        throw new Error('Payment account not found');
      }

      // Check if account has sufficient balance
      if (paymentAccount.balance < data.amount) {
        throw new Error(`Insufficient balance. Available: ${paymentAccount.currency} ${paymentAccount.balance.toLocaleString()}`);
      }

      // Create payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('purchase_order_payments')
        .insert({
          purchase_order_id: data.purchaseOrderId,
          payment_account_id: data.paymentAccountId,
          amount: data.amount,
          currency: data.currency || 'TZS',
          payment_method: data.paymentMethod,
          payment_method_id: data.paymentMethodId,
          reference: data.reference,
          notes: data.notes,
          status: 'completed',
          payment_date: new Date().toISOString(),
          created_by: data.createdBy
        })
        .select()
        .single();

      if (paymentError) {
        console.error('❌ Error creating purchase order payment:', paymentError);
        throw new Error('Failed to create purchase order payment record');
      }

      // Update finance account balance (deduct amount)
      const { error: balanceError } = await supabase
        .from('finance_accounts')
        .update({ 
          balance: paymentAccount.balance - data.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.paymentAccountId);

      if (balanceError) {
        console.error('⚠️ Error updating account balance:', balanceError);
        // Don't throw error as payment was already recorded
      }

      // Note: Finance transaction tracking can be added later if needed
      // For now, the payment record and account balance update provide sufficient tracking

      console.log('✅ Purchase order payment created successfully:', paymentRecord);
      return paymentRecord;
    } catch (error) {
      console.error('❌ PurchaseOrderPaymentService: Error creating payment:', error);
      throw error;
    }
  }

  // Create multiple purchase order payments
  async createMultiplePurchaseOrderPayments(payments: CreatePurchaseOrderPaymentData[]): Promise<PurchaseOrderPayment[]> {
    try {
      console.log('💰 PurchaseOrderPaymentService: Creating multiple purchase order payments...', payments);
      
      const results: PurchaseOrderPayment[] = [];
      
      // Process payments sequentially to maintain data integrity
      for (const paymentData of payments) {
        const result = await this.createPurchaseOrderPayment(paymentData);
        results.push(result);
      }
      
      console.log('✅ Multiple purchase order payments created successfully:', results);
      return results;
    } catch (error) {
      console.error('❌ PurchaseOrderPaymentService: Error creating multiple payments:', error);
      throw error;
    }
  }

  // Get payments for a purchase order
  async getPurchaseOrderPayments(purchaseOrderId: string): Promise<PurchaseOrderPayment[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_payments')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching purchase order payments:', error);
        throw new Error('Failed to fetch purchase order payments');
      }

      return data || [];
    } catch (error) {
      console.error('❌ PurchaseOrderPaymentService: Error fetching payments:', error);
      throw error;
    }
  }

  // Get payment summary for a purchase order
  async getPurchaseOrderPaymentSummary(purchaseOrderId: string): Promise<{
    totalPaid: number;
    remainingAmount: number;
    paymentCount: number;
    lastPaymentDate?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_payments')
        .select('amount, payment_date')
        .eq('purchase_order_id', purchaseOrderId)
        .eq('status', 'completed');

      if (error) {
        console.error('❌ Error fetching payment summary:', error);
        throw new Error('Failed to fetch payment summary');
      }

      const totalPaid = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const paymentCount = data?.length || 0;
      const lastPaymentDate = data?.[0]?.payment_date;

      // Get purchase order total amount
      const { data: purchaseOrder, error: poError } = await supabase
        .from('lats_purchase_orders')
        .select('total_amount')
        .eq('id', purchaseOrderId)
        .single();

      if (poError) {
        console.error('❌ Error fetching purchase order total:', poError);
        throw new Error('Failed to fetch purchase order total');
      }

      const remainingAmount = (purchaseOrder?.total_amount || 0) - totalPaid;

      return {
        totalPaid,
        remainingAmount,
        paymentCount,
        lastPaymentDate
      };
    } catch (error) {
      console.error('❌ PurchaseOrderPaymentService: Error fetching payment summary:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(
    paymentId: string, 
    status: 'pending' | 'completed' | 'failed' | 'cancelled',
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('purchase_order_payments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) {
        console.error('❌ Error updating payment status:', error);
        throw new Error('Failed to update payment status');
      }

      return true;
    } catch (error) {
      console.error('❌ PurchaseOrderPaymentService: Error updating payment status:', error);
      throw error;
    }
  }

  // Delete a payment (with balance reversal)
  async deletePurchaseOrderPayment(paymentId: string, userId: string): Promise<boolean> {
    try {
      // Get payment details first
      const { data: payment, error: fetchError } = await supabase
        .from('purchase_order_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError || !payment) {
        throw new Error('Payment not found');
      }

      // Reverse the account balance
      const { error: balanceError } = await supabase
        .from('finance_accounts')
        .update({ 
          balance: supabase.raw(`balance + ${payment.amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.payment_account_id);

      if (balanceError) {
        console.error('⚠️ Error reversing account balance:', balanceError);
        // Continue with deletion even if balance reversal fails
      }

      // Delete the payment record
      const { error: deleteError } = await supabase
        .from('purchase_order_payments')
        .delete()
        .eq('id', paymentId);

      if (deleteError) {
        console.error('❌ Error deleting payment:', deleteError);
        throw new Error('Failed to delete payment');
      }

      return true;
    } catch (error) {
      console.error('❌ PurchaseOrderPaymentService: Error deleting payment:', error);
      throw error;
    }
  }
}

export const purchaseOrderPaymentService = new PurchaseOrderPaymentService();
