import { supabase } from './supabaseClient';

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: 'cash' | 'card' | 'transfer' | 'mobile_money' | 'check' | 'installment' | 'delivery';
  icon: string;
  color: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodAccount {
  id: string;
  payment_method_id: string;
  account_id: string;
  is_default: boolean;
  created_at: string;
  payment_method?: PaymentMethod;
  account?: {
    id: string;
    name: string;
    type: string;
    balance: number;
  };
}

export interface PaymentMethodWithAccounts extends PaymentMethod {
  accounts?: PaymentMethodAccount[];
}

class PaymentMethodService {
  // Get all active payment methods
  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
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

  // Get payment methods by type
  async getPaymentMethodsByType(type: PaymentMethod['type']): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .eq('type', type)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods by type:', error);
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

  // Get payment method by ID
  async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment method by ID:', error);
      return null;
    }
  }

  // Get payment methods with their associated accounts
  async getPaymentMethodsWithAccounts(): Promise<PaymentMethodWithAccounts[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select(`
          *,
          payment_method_accounts (
            id,
            account_id,
            is_default,
            created_at,
            account:finance_accounts (
              id,
              name,
              type,
              balance
            )
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods with accounts:', error);
      return [];
    }
  }

  // Get accounts for a specific payment method
  async getAccountsForPaymentMethod(paymentMethodId: string): Promise<PaymentMethodAccount[]> {
    try {
      const { data, error } = await supabase
        .from('payment_method_accounts')
        .select(`
          *,
          payment_method:payment_methods (*),
          account:finance_accounts (
            id,
            name,
            type,
            balance
          )
        `)
        .eq('payment_method_id', paymentMethodId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts for payment method:', error);
      return [];
    }
  }

  // Get default account for a payment method
  async getDefaultAccountForPaymentMethod(paymentMethodId: string): Promise<PaymentMethodAccount | null> {
    try {
      const { data, error } = await supabase
        .from('payment_method_accounts')
        .select(`
          *,
          payment_method:payment_methods (*),
          account:finance_accounts (
            id,
            name,
            type,
            balance
          )
        `)
        .eq('payment_method_id', paymentMethodId)
        .eq('is_default', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching default account for payment method:', error);
      return null;
    }
  }

  // Link payment method to account
  async linkPaymentMethodToAccount(
    paymentMethodId: string, 
    accountId: string, 
    isDefault: boolean = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_methods_accounts')
        .upsert({
          payment_method_id: paymentMethodId,
          account_id: accountId,
          is_default: isDefault
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error linking payment method to account:', error);
      return false;
    }
  }

  // Unlink payment method from account
  async unlinkPaymentMethodFromAccount(paymentMethodId: string, accountId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_methods_accounts')
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

  // Set default account for payment method
  async setDefaultAccountForPaymentMethod(paymentMethodId: string, accountId: string): Promise<boolean> {
    try {
      // First, remove default from all accounts for this payment method
      await supabase
        .from('payment_methods_accounts')
        .update({ is_default: false })
        .eq('payment_method_id', paymentMethodId);

      // Then set the new default
      const { error } = await supabase
        .from('payment_methods_accounts')
        .update({ is_default: true })
        .eq('payment_method_id', paymentMethodId)
        .eq('account_id', accountId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting default account for payment method:', error);
      return false;
    }
  }

  // Get payment methods suitable for POS
  async getPOSPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .in('type', ['cash', 'card', 'transfer', 'mobile_money', 'delivery'])
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching POS payment methods:', error);
      return [];
    }
  }

  // Get payment methods suitable for Finance Management
  async getFinancePaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .in('type', ['cash', 'card', 'transfer', 'mobile_money', 'check'])
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching finance payment methods:', error);
      return [];
    }
  }

  // Create new payment method
  async createPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentMethod | null> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert(paymentMethod)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment method:', error);
      return null;
    }
  }

  // Update payment method
  async updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod | null> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      return null;
    }
  }

  // Delete payment method (soft delete by setting is_active to false)
  async deletePaymentMethod(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return false;
    }
  }

  // Get payment method statistics
  async getPaymentMethodStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    active: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('type, is_active');

      if (error) throw error;

      const total = data?.length || 0;
      const active = data?.filter(m => m.is_active).length || 0;
      const byType = data?.reduce((acc, method) => {
        acc[method.type] = (acc[method.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return { total, active, byType };
    } catch (error) {
      console.error('Error fetching payment method stats:', error);
      return { total: 0, active: 0, byType: {} };
    }
  }
}

export const paymentMethodService = new PaymentMethodService(); 