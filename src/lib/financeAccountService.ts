import { supabase } from './supabaseClient';

export interface FinanceAccount {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'mobile_money' | 'credit_card' | 'savings' | 'investment' | 'other';
  balance: number;
  account_number?: string;
  bank_name?: string;
  currency: string;
  is_active: boolean;
  is_payment_method: boolean;
  payment_icon?: string;
  payment_color?: string;
  payment_description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceAccountWithStats extends FinanceAccount {
  transaction_count?: number;
  total_transactions?: number;
}

class FinanceAccountService {
  // Get all active finance accounts that are payment methods
  async getPaymentMethods(): Promise<FinanceAccount[]> {
    try {
      console.log('🔍 FinanceAccountService: Fetching payment methods...');
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('is_payment_method', true)
        .order('name');

      if (error) {
        console.error('❌ Error fetching payment methods:', error);
        throw error;
      }
      
      console.log('📋 FinanceAccountService: Fetched payment methods:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching payment methods:', error);
      return [];
    }
  }

  // Get all active finance accounts
  async getActiveFinanceAccounts(): Promise<FinanceAccount[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching finance accounts:', error);
      return [];
    }
  }

  // Get finance accounts by type
  async getFinanceAccountsByType(type: FinanceAccount['type']): Promise<FinanceAccount[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching finance accounts by type:', error);
      return [];
    }
  }

  // Get finance account by ID
  async getFinanceAccountById(id: string): Promise<FinanceAccount | null> {
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
      console.error('Error fetching finance account by ID:', error);
      return null;
    }
  }

  // Get finance accounts with transaction stats
  async getFinanceAccountsWithStats(): Promise<FinanceAccountWithStats[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select(`
          *,
          payment_transactions(
            id
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Transform data to include stats
      const accountsWithStats = data?.map(account => ({
        ...account,
        transaction_count: account.payment_transactions?.length || 0,
        total_transactions: account.payment_transactions?.length || 0
      })) || [];

      return accountsWithStats;
    } catch (error) {
      console.error('Error fetching finance accounts with stats:', error);
      return [];
    }
  }

  // Get default payment method
  async getDefaultPaymentMethod(): Promise<FinanceAccount | null> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('is_payment_method', true)
        .eq('type', 'cash') // Default to cash
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching default payment method:', error);
      return null;
    }
  }

  // Get POS payment methods (cash, mobile money, cards)
  async getPOSPaymentMethods(): Promise<FinanceAccount[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('is_payment_method', true)
        .in('type', ['cash', 'mobile_money', 'credit_card'])
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching POS payment methods:', error);
      return [];
    }
  }

  // Get finance payment methods (bank, savings, investment)
  async getFinancePaymentMethods(): Promise<FinanceAccount[]> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('is_payment_method', true)
        .in('type', ['bank', 'savings', 'investment'])
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching finance payment methods:', error);
      return [];
    }
  }

  // Create new finance account
  async createFinanceAccount(financeAccount: Omit<FinanceAccount, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceAccount | null> {
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .insert([financeAccount])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating finance account:', error);
      return null;
    }
  }

  // Test function to update just one field
  async testUpdateField(id: string, field: string, value: any): Promise<FinanceAccount | null> {
    try {
      console.log(`🧪 Testing update of field '${field}' with value:`, value);
      
      const { data, error } = await supabase
        .from('finance_accounts')
        .update({ [field]: value })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error(`❌ Error updating field '${field}':`, error);
        return null;
      }
      
      console.log(`✅ Successfully updated field '${field}'`);
      return data;
    } catch (error) {
      console.error(`❌ Exception updating field '${field}':`, error);
      return null;
    }
  }

  // Update finance account
  async updateFinanceAccount(id: string, updates: Partial<FinanceAccount>): Promise<FinanceAccount | null> {
    try {
      console.log('🔧 Updating finance account:', { id, updates });
      
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔐 Authentication status:', { 
        user: user ? { id: user.id, email: user.email } : null,
        authError: authError?.message 
      });
      
      // Log the exact request being made
      console.log('🔍 Supabase request details:', {
        table: 'finance_accounts',
        operation: 'update',
        id: id,
        updates: JSON.stringify(updates, null, 2)
      });
      
      // Try the update with explicit headers
      // Try with explicit headers and error handling
      console.log('🔍 Attempting update with data:', JSON.stringify(updates, null, 2));
      
      const { data, error } = await supabase
        .from('finance_accounts')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Supabase error updating finance account:', error);
        console.error('📋 Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Log the exact request data that caused the error
        console.error('🔍 Request data that caused error:', updates);
        
        // Log the full error object for debugging
        console.error('🔍 Full error object:', JSON.stringify(error, null, 2));
        
        // Check for common issues
        if (error.message?.includes('column')) {
          console.error('🚨 Column-related error - check if all columns exist');
        }
        if (error.message?.includes('type')) {
          console.error('🚨 Data type error - check field types');
        }
        if (error.message?.includes('constraint')) {
          console.error('🚨 Constraint error - check field values');
        }
        if (error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('🚨 Permission/RLS error - check user permissions');
        }
        
        throw error;
      }
      
      console.log('✅ Successfully updated finance account:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating finance account:', error);
      
      // Try to get more detailed error information
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      // Try to parse as JSON if it's a response error
      try {
        const errorObj = JSON.parse(error.message);
        console.error('❌ Parsed error:', errorObj);
      } catch (e) {
        console.error('❌ Raw error message:', error.message);
      }
      
      return null;
    }
  }

  // Delete finance account
  async deleteFinanceAccount(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting finance account:', error);
      return false;
    }
  }

  // Get finance account stats
  async getFinanceAccountStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    active: number;
    totalBalance: number;
    paymentMethods: number;
  }> {
    try {
      const accounts = await this.getActiveFinanceAccounts();
      
      const stats = {
        total: accounts.length,
        byType: accounts.reduce((acc, account) => {
          acc[account.type] = (acc[account.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        active: accounts.filter(acc => acc.is_active).length,
        totalBalance: accounts.reduce((sum, account) => sum + Number(account.balance), 0),
        paymentMethods: accounts.filter(acc => acc.is_payment_method).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting finance account stats:', error);
      return {
        total: 0,
        byType: {},
        active: 0,
        totalBalance: 0,
        paymentMethods: 0
      };
    }
  }

  // Get icon for account type
  getIconForAccountType(type: FinanceAccount['type']): string {
    switch (type) {
      case 'bank':
        return 'building';
      case 'cash':
        return 'dollar-sign';
      case 'mobile_money':
        return 'smartphone';
      case 'credit_card':
        return 'credit-card';
      case 'savings':
        return 'piggy-bank';
      case 'investment':
        return 'trending-up';
      default:
        return 'credit-card';
    }
  }

  // Get color for account type
  getColorForAccountType(type: FinanceAccount['type']): string {
    switch (type) {
      case 'bank':
        return '#059669';
      case 'cash':
        return '#10B981';
      case 'mobile_money':
        return '#DC2626';
      case 'credit_card':
        return '#3B82F6';
      case 'savings':
        return '#F59E0B';
      case 'investment':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  }
}

export const financeAccountService = new FinanceAccountService(); 