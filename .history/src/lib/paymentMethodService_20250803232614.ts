import { supabase } from './supabaseClient';

export interface PaymentAccount {
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

export interface PaymentAccountWithStats extends PaymentAccount {
  transaction_count?: number;
  total_transactions?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: 'cash' | 'card' | 'transfer' | 'mobile_money' | 'check' | 'installment' | 'delivery';
  icon: string;
  color: string;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodAccount {
  id: string;
  payment_method_id: string;
  account_id: string;
  is_default: boolean;
  created_at: string;
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

  // Get payment methods with their linked accounts
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
            created_at
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

  // Link a payment method to an account
  async linkPaymentMethodToAccount(paymentMethodId: string, accountId: string, isDefault: boolean = false): Promise<boolean> {
    try {
      // Check if the payment method is already linked to this account
      const { data: existingLink, error: checkError } = await supabase
        .from('payment_method_accounts')
        .select('id, is_default')
        .eq('payment_method_id', paymentMethodId)
        .eq('account_id', accountId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking existing link:', checkError);
        return false;
      }

      // If link already exists, just update the is_default status
      if (existingLink) {
        if (existingLink.is_default === isDefault) {
          return true; // Already in desired state
        }

        const { error: updateError } = await supabase
          .from('payment_method_accounts')
          .update({ is_default: isDefault })
          .eq('id', existingLink.id);

        if (updateError) {
          console.error('Error updating existing link:', updateError);
          return false;
        }
        return true;
      }

      // If setting as default, unset other defaults for this payment method
      if (isDefault) {
        await supabase
          .from('payment_method_accounts')
          .update({ is_default: false })
          .eq('payment_method_id', paymentMethodId);
      }

      // Create new link
      const { error } = await supabase
        .from('payment_method_accounts')
        .insert({
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

  // Unlink a payment method from an account
  async unlinkPaymentMethodFromAccount(paymentMethodId: string, accountId: string): Promise<boolean> {
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

  // Get payment methods by type
  async getPaymentMethodsByType(type: PaymentMethod['type']): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods by type:', error);
      return [];
    }
  }

  // Get POS-specific payment methods
  async getPOSPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .in('type', ['cash', 'card', 'mobile_money', 'transfer'])
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching POS payment methods:', error);
      return [];
    }
  }

  // Get Finance-specific payment methods
  async getFinancePaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching finance payment methods:', error);
      return [];
    }
  }

  // Get payment method statistics
  async getPaymentMethodStats(): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
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

  // Set default account for payment method
  async setDefaultAccountForPaymentMethod(paymentMethodId: string, accountId: string): Promise<boolean> {
    try {
      // First, unset all defaults for this payment method
      await supabase
        .from('payment_method_accounts')
        .update({ is_default: false })
        .eq('payment_method_id', paymentMethodId);

      // Then set the new default
      const { error } = await supabase
        .from('payment_method_accounts')
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

  // Get default account for a payment method
  async getDefaultAccountForPaymentMethod(paymentMethodId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('payment_method_accounts')
        .select('account_id')
        .eq('payment_method_id', paymentMethodId)
        .eq('is_default', true)
        .single();

      if (error) throw error;
      return data?.account_id || null;
    } catch (error) {
      console.error('Error fetching default account for payment method:', error);
      return null;
    }
  }

  // Create a new payment method
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

  // Update a payment method
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

  // Delete a payment method (soft delete)
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
}

class PaymentAccountService {
  // Get all active payment accounts
  async getActivePaymentAccounts(): Promise<PaymentAccount[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      return [];
    }
  }

  // Get payment accounts by type
  async getPaymentAccountsByType(type: PaymentAccount['type']): Promise<PaymentAccount[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('type', type)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment accounts by type:', error);
      return [];
    }
  }

  // Get payment account by ID
  async getPaymentAccountById(id: string): Promise<PaymentAccount | null> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment account by ID:', error);
      return null;
    }
  }

  // Get payment accounts with transaction statistics
  async getPaymentAccountsWithStats(): Promise<PaymentAccountWithStats[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select(`
          *,
          transactions:payment_transactions (
            id,
            amount,
            transaction_type
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Calculate stats for each account
      const accountsWithStats = (data || []).map(account => ({
        ...account,
        transaction_count: account.transactions?.length || 0,
        total_transactions: account.transactions?.reduce((sum: number, t: { amount: number }) => sum + Math.abs(t.amount), 0) || 0
      }));

      return accountsWithStats;
    } catch (error) {
      console.error('Error fetching payment accounts with stats:', error);
      return [];
    }
  }

  // Get default payment account
  async getDefaultPaymentAccount(): Promise<PaymentAccount | null> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'cash')
        .order('created_at')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching default payment account:', error);
      return null;
    }
  }

  // Get payment accounts suitable for POS
  async getPOSPaymentAccounts(): Promise<PaymentAccount[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .in('type', ['cash', 'bank', 'mobile_money', 'credit_card'])
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching POS payment accounts:', error);
      return [];
    }
  }

  // Get payment accounts suitable for Finance Management
  async getFinancePaymentAccounts(): Promise<PaymentAccount[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching finance payment accounts:', error);
      return [];
    }
  }

  // Create new payment account
  async createPaymentAccount(paymentAccount: Omit<PaymentAccount, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentAccount | null> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .insert(paymentAccount)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment account:', error);
      return null;
    }
  }

  // Update payment account
  async updatePaymentAccount(id: string, updates: Partial<PaymentAccount>): Promise<PaymentAccount | null> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment account:', error);
      return null;
    }
  }

  // Delete payment account (soft delete by setting is_active to false)
  async deletePaymentAccount(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('finance_accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting payment account:', error);
      return false;
    }
  }

  // Get payment account statistics
  async getPaymentAccountStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    active: number;
    totalBalance: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('type, is_active, balance');

      if (error) throw error;

      const total = data?.length || 0;
      const active = data?.filter(a => a.is_active).length || 0;
      const totalBalance = data?.reduce((sum, account) => sum + (account.balance || 0), 0) || 0;
      const byType = data?.reduce((acc, account) => {
        acc[account.type] = (acc[account.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return { total, active, byType, totalBalance };
    } catch (error) {
      console.error('Error fetching payment account stats:', error);
      return { total: 0, active: 0, byType: {}, totalBalance: 0 };
    }
  }

  // Get icon for account type
  getIconForAccountType(type: PaymentAccount['type']): string {
    const iconMap: Record<string, string> = {
      'bank': '🏦',
      'cash': '💰',
      'mobile_money': '📱',
      'credit_card': '💳',
      'savings': '🏦',
      'investment': '📈',
      'other': '💳'
    };
    
    return iconMap[type] || '💳';
  }

  // Get color for account type
  getColorForAccountType(type: PaymentAccount['type']): string {
    const colorMap: Record<string, string> = {
      'bank': '#059669',
      'cash': '#10B981',
      'mobile_money': '#DC2626',
      'credit_card': '#3B82F6',
      'savings': '#8B5CF6',
      'investment': '#F59E0B',
      'other': '#6B7280'
    };
    
    return colorMap[type] || '#3B82F6';
  }
}

export const paymentAccountService = new PaymentAccountService();
export const paymentMethodService = new PaymentMethodService();
export { PaymentAccountService, PaymentMethodService }; 