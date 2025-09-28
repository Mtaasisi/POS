import { supabase } from './supabaseClient';

export interface PaymentTransaction {
  id: string;
  order_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  sale_id?: string;
  pos_session_id?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: 'cash' | 'card' | 'transfer' | 'mobile_money' | 'check' | 'installment' | 'delivery';
  icon?: string;
  color?: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodAccount {
  id: string;
  payment_method_id: string;
  account_id: string;
  is_default: boolean;
  auto_route: boolean;
  created_at: string;
}

export interface PaymentRoutingRule {
  id: string;
  rule_name: string;
  payment_method_id?: string;
  source_type: 'all' | 'pos_sale' | 'device_payment';
  min_amount: number;
  max_amount?: number;
  target_account_id: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentSummary {
  account_id: string;
  account_name: string;
  account_type: string;
  current_balance: number;
  total_transactions: number;
  total_payments: number;
  total_deposits: number;
  total_withdrawals: number;
  last_transaction_date?: string;
}

class EnhancedPaymentService {
  // Get all active payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  // Get payment method by code
  async getPaymentMethodByCode(code: string): Promise<PaymentMethod | null> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment method by code:', error);
      return null;
    }
  }

  // Get payment method accounts mapping
  async getPaymentMethodAccounts(): Promise<PaymentMethodAccount[]> {
    try {
      const { data, error } = await supabase
        .from('payment_method_accounts')
        .select('*')
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment method accounts:', error);
      return [];
    }
  }

  // Get default account for payment method
  async getDefaultAccountForPaymentMethod(paymentMethodId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('payment_method_accounts')
        .select('account_id')
        .eq('payment_method_id', paymentMethodId)
        .eq('is_default', true)
        .eq('auto_route', true)
        .single();

      if (error) throw error;
      return data?.account_id || null;
    } catch (error) {
      console.error('Error fetching default account for payment method:', error);
      return null;
    }
  }

  // Route payment to account automatically
  async routePaymentToAccount(
    paymentMethodId: string,
    amount: number,
    sourceType: 'pos_sale' | 'device_payment' | 'manual_entry' | 'whatsapp_payment' = 'pos_sale',
    orderId?: string,
    customerId?: string,
    description?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('route_payment_to_account', {
        p_payment_method_id: paymentMethodId,
        p_amount: amount,
        p_source_type: sourceType,
        p_order_id: orderId,
        p_customer_id: customerId,
        p_description: description
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error routing payment to account:', error);
      return null;
    }
  }

  // Create payment transaction manually
  async createPaymentTransaction(
    accountId: string,
    paymentMethodId: string,
    amount: number,
    transactionType: 'payment' | 'deposit' | 'withdrawal' | 'transfer' | 'refund',
    sourceType: 'pos_sale' | 'device_payment' | 'manual_entry' | 'whatsapp_payment',
    orderId?: string,
    customerId?: string,
    description?: string
  ): Promise<PaymentTransaction | null> {
    try {
      // Validate customer ID for payment transactions
      if ((transactionType === 'payment' || sourceType === 'pos_sale' || sourceType === 'device_payment') && !customerId) {
        console.error('Customer ID is required for payment transactions');
        return null;
      }

      const { data, error } = await supabase
        .from('payment_transactions')
        .insert([{
          account_id: accountId,
          payment_method_id: paymentMethodId,
          amount,
          transaction_type: transactionType,
          status: 'completed',
          description,
          customer_id: customerId,
          order_id: orderId,
          source_type: sourceType
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      return null;
    }
  }

  // Get payment transactions for account
  async getPaymentTransactionsForAccount(
    accountId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment transactions for account:', error);
      return [];
    }
  }

  // Get payment transactions for order
  async getPaymentTransactionsForOrder(orderId: string): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment transactions for order:', error);
      return [];
    }
  }

  // Get payment summary for all accounts
  async getPaymentSummary(): Promise<PaymentSummary[]> {
    try {
      // Check if payment_summary table exists by trying to query it
      const { data, error } = await supabase
        .from('payment_summary')
        .select('*')
        .order('account_name')
        .limit(1);

      if (error) {
        // If table doesn't exist, return empty array without logging error
        if (error.code === 'PGRST116' || 
            error.message.includes('relation "payment_summary" does not exist') ||
            error.message.includes('does not exist') ||
            error.status === 404) {
          // Silently return empty array for missing table
          return [];
        }
        console.warn('Error fetching payment summary:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      // Silently handle any errors to prevent console spam
      return [];
    }
  }

  // Get payment method summary
  async getPaymentMethodSummary(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_method_summary')
        .select('*')
        .order('payment_method_name');

      if (error) {
        console.warn('Payment method summary table not found, returning empty array:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.warn('Error fetching payment method summary, returning empty array:', error);
      return [];
    }
  }

  // Create payment routing rule
  async createPaymentRoutingRule(
    ruleName: string,
    targetAccountId: string,
    paymentMethodId?: string,
    sourceType: 'all' | 'pos_sale' | 'device_payment' | 'whatsapp_payment' = 'all',
    minAmount: number = 0,
    maxAmount?: number,
    priority: number = 1
  ): Promise<PaymentRoutingRule | null> {
    try {
      const { data, error } = await supabase
        .from('payment_routing_rules')
        .insert([{
          rule_name: ruleName,
          payment_method_id: paymentMethodId,
          source_type: sourceType,
          min_amount: minAmount,
          max_amount: maxAmount,
          target_account_id: targetAccountId,
          priority,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment routing rule:', error);
      return null;
    }
  }

  // Get payment routing rules
  async getPaymentRoutingRules(): Promise<PaymentRoutingRule[]> {
    try {
      const { data, error } = await supabase
        .from('payment_routing_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment routing rules:', error);
      return [];
    }
  }

  // Update payment routing rule
  async updatePaymentRoutingRule(
    ruleId: string,
    updates: Partial<PaymentRoutingRule>
  ): Promise<PaymentRoutingRule | null> {
    try {
      const { data, error } = await supabase
        .from('payment_routing_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment routing rule:', error);
      return null;
    }
  }

  // Delete payment routing rule
  async deletePaymentRoutingRule(ruleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_routing_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting payment routing rule:', error);
      return false;
    }
  }

  // Link payment method to account
  async linkPaymentMethodToAccount(
    paymentMethodId: string,
    accountId: string,
    isDefault: boolean = false,
    autoRoute: boolean = true
  ): Promise<PaymentMethodAccount | null> {
    try {
      const { data, error } = await supabase
        .from('payment_method_accounts')
        .insert([{
          payment_method_id: paymentMethodId,
          account_id: accountId,
          is_default: isDefault,
          auto_route: autoRoute
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error linking payment method to account:', error);
      return null;
    }
  }

  // Unlink payment method from account
  async unlinkPaymentMethodFromAccount(
    paymentMethodId: string,
    accountId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_method_accounts')
        .delete()
        .eq('payment_method_id', paymentMethodId)
        .eq('account_id', accountId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unlinking payment method from account:', error);
      return false;
    }
  }

  // Process POS payment
  async processPOSPayment(
    paymentMethodId: string,
    amount: number,
    orderId: string,
    customerId?: string,
    description?: string
  ): Promise<string | null> {
    return this.routePaymentToAccount(
      paymentMethodId,
      amount,
      'pos_sale',
      orderId,
      customerId,
      description || `POS payment for order ${orderId}`
    );
  }

  // Process device payment
  async processDevicePayment(
    paymentMethodId: string,
    amount: number,
    deviceId: string,
    customerId?: string,
    description?: string
  ): Promise<string | null> {
    return this.routePaymentToAccount(
      paymentMethodId,
      amount,
      'device_payment',
      undefined,
      customerId,
      description || `Device payment for device ${deviceId}`
    );
  }



  // Get account balance history
  async getAccountBalanceHistory(
    accountId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('account_balance_history')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching account balance history:', error);
      return [];
    }
  }
}

export const enhancedPaymentService = new EnhancedPaymentService();
