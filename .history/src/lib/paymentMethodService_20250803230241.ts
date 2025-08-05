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
          transactions:finance_transactions (
            id,
            amount,
            type
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Calculate stats for each account
      const accountsWithStats = (data || []).map(account => ({
        ...account,
        transaction_count: account.transactions?.length || 0,
        total_transactions: account.transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
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
export { PaymentAccountService }; 