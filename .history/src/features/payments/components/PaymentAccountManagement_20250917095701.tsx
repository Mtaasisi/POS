import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import AccountThumbnail from './AccountThumbnail';
import { 
  Settings, Plus, Edit3, Trash2, Save, X, 
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  TrendingUp, TrendingDown, Eye, EyeOff, Wallet,
  BarChart3, DollarSign, CreditCard, Building, Smartphone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { usePaymentMethodsContext } from '../../../context/PaymentMethodsContext';
import { financeAccountService, FinanceAccount } from '../../../lib/financeAccountService';

interface AccountWithTransactions extends FinanceAccount {
  recentTransactions: Array<{
    id: string;
    transaction_type: string;
    amount: number;
    description: string;
    created_at: string;
    balance_after: number;
  }>;
  totalReceived: number;
  totalSpent: number;
}

const PaymentAccountManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { refreshPaymentMethods } = usePaymentMethodsContext();
  const [accounts, setAccounts] = useState<AccountWithTransactions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState<Partial<FinanceAccount>>({
    name: '',
    type: 'cash',
    balance: 0,
    currency: 'TZS',
    is_active: true,
    is_payment_method: true,
    requires_reference: false,
    requires_account_number: false
  });

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter accounts by currency
  const filteredAccounts = React.useMemo(() => {
    if (currencyFilter === 'all') return accounts;
    return accounts.filter(account => account.currency === currencyFilter);
  }, [accounts, currencyFilter]);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const totalAccounts = filteredAccounts.length;
    const activeAccounts = filteredAccounts.filter(account => account.is_active).length;
    const totalBalance = filteredAccounts.reduce((sum, account) => sum + account.balance, 0);
    const totalReceived = filteredAccounts.reduce((sum, account) => sum + account.totalReceived, 0);
    const totalSpent = filteredAccounts.reduce((sum, account) => sum + account.totalSpent, 0);
    
    // Group by account type
    const accountTypes = filteredAccounts.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAccounts,
      activeAccounts,
      totalBalance,
      totalReceived,
      totalSpent,
      accountTypes
    };
  }, [filteredAccounts]);


  // Fetch accounts with transaction data
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get payment method accounts
      const paymentAccounts = await financeAccountService.getPaymentMethods();
      
      // Get transaction data for each account
      const accountsWithTransactions: AccountWithTransactions[] = await Promise.all(
        paymentAccounts.map(async (account) => {
          // Get recent transactions
          const { data: transactions } = await supabase
            .from('account_transactions')
            .select('*')
            .eq('account_id', account.id)
            .order('created_at', { ascending: false })
            .limit(5);

          // Calculate totals
          const { data: allTransactions } = await supabase
            .from('account_transactions')
            .select('transaction_type, amount')
            .eq('account_id', account.id);

          const totalReceived = allTransactions
            ?.filter(t => t.transaction_type === 'payment_received')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const totalSpent = allTransactions
            ?.filter(t => t.transaction_type === 'payment_made' || t.transaction_type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          return {
            ...account,
            recentTransactions: transactions || [],
            totalReceived,
            totalSpent
          };
        })
      );

      setAccounts(accountsWithTransactions);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load payment accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh payment methods in global context when accounts change
  const handleAccountChange = useCallback(async () => {
    await refreshPaymentMethods();
    await fetchAccounts();
  }, [refreshPaymentMethods, fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save account
  const handleSave = async () => {
    try {
      if (editingAccount) {
        // Update existing account
        const { error } = await supabase
          .from('finance_accounts')
          .update({
            name: formData.name,
            type: formData.type,
            balance: formData.balance,
            currency: formData.currency,
            is_active: formData.is_active,
            is_payment_method: formData.is_payment_method,
            requires_reference: formData.requires_reference,
            requires_account_number: formData.requires_account_number,
            account_number: formData.account_number,
            bank_name: formData.bank_name,
            notes: formData.notes
          })
          .eq('id', editingAccount.id);

        if (error) throw error;
        toast.success('Account updated successfully');
      } else {
        // Create new account
        const { error } = await supabase
          .from('finance_accounts')
          .insert({
            name: formData.name,
            type: formData.type,
            balance: formData.balance || 0,
            currency: formData.currency || 'TZS',
            is_active: formData.is_active,
            is_payment_method: formData.is_payment_method,
            requires_reference: formData.requires_reference,
            requires_account_number: formData.requires_account_number,
            account_number: formData.account_number,
            bank_name: formData.bank_name,
            notes: formData.notes
          });

        if (error) throw error;
        toast.success('Account created successfully');
      }

      setShowAddModal(false);
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'cash',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        requires_reference: false,
        requires_account_number: false
      });
      await handleAccountChange();
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast.error(error.message || 'Failed to save account');
    }
  };

  // Delete account
  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      toast.success('Account deleted successfully');
      await handleAccountChange();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
    }
  };

  // Edit account
  const handleEdit = (account: FinanceAccount) => {
    setEditingAccount(account);
    setFormData(account);
    setShowAddModal(true);
  };

  // Add new account
  const handleAdd = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'cash',
      balance: 0,
      currency: 'TZS',
      is_active: true,
      is_payment_method: true,
      requires_reference: false,
      requires_account_number: false
    });
    setShowAddModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading payment accounts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Accounts</h2>
          <p className="text-gray-600">Manage your payment accounts and view balances</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Accounts</p>
              <p className="text-2xl font-bold text-blue-900">{summaryStats.totalAccounts}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Balance</p>
              <p className="text-2xl font-bold text-green-900">{formatMoney(summaryStats.totalBalance)}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Active Accounts</p>
              <p className="text-2xl font-bold text-purple-900">{summaryStats.activeAccounts}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Net Flow</p>
              <p className="text-2xl font-bold text-orange-900">{formatMoney(summaryStats.totalReceived - summaryStats.totalSpent)}</p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <GlassCard key={account.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <AccountThumbnail type={account.type} size="md" />
                <div>
                  <h3 className="font-semibold text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-500 capitalize flex items-center gap-1">
                    {account.type === 'cash' && <DollarSign className="w-3 h-3" />}
                    {account.type === 'bank' && <Building className="w-3 h-3" />}
                    {account.type === 'mobile_money' && <Smartphone className="w-3 h-3" />}
                    {account.type === 'credit_card' && <CreditCard className="w-3 h-3" />}
                    {account.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(account)}
                  className="flex items-center justify-center p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  title="Edit account"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="flex items-center justify-center p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  title="Delete account"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {formatMoney(account.balance)}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span>Current Balance</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {account.currency || 'TZS'}
                </span>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-1 text-green-600 mb-1">
                  <TrendingUp size={14} />
                  <span className="text-xs font-medium">Received</span>
                </div>
                <div className="text-sm font-semibold text-green-700">{formatMoney(account.totalReceived)}</div>
                <div className="text-xs text-green-600">{account.currency || 'TZS'}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-1 text-red-600 mb-1">
                  <TrendingDown size={14} />
                  <span className="text-xs font-medium">Spent</span>
                </div>
                <div className="text-sm font-semibold text-red-700">{formatMoney(account.totalSpent)}</div>
                <div className="text-xs text-red-600">{account.currency || 'TZS'}</div>
              </div>
            </div>

            {/* Recent Transactions */}
            {account.recentTransactions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {account.recentTransactions.slice(0, 2).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 truncate">{transaction.description}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`text-xs font-medium ${
                        transaction.transaction_type === 'payment_received' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'payment_received' ? '+' : '-'}
                        {formatMoney(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status</span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {account.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {account.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                {account.is_payment_method && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    <CreditCard size={10} />
                    Payment Method
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingAccount ? 'Edit Account' : 'Add New Account'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {editingAccount ? 'Update account details' : 'Create a new payment account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Account Preview */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <AccountThumbnail type={formData.type || 'cash'} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">
                      {formData.name || 'Account Name'}
                    </div>
                    <div className="text-xs text-blue-600 capitalize">
                      {(formData.type || 'cash').replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <GlassInput
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Cash Drawer, CRDB Bank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <GlassSelect
                  value={formData.type || 'cash'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="savings">Savings</option>
                  <option value="other">Other</option>
                </GlassSelect>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                <GlassInput
                  type="number"
                  value={formData.balance || 0}
                  onChange={(e) => handleInputChange('balance', Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              {formData.type === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <GlassInput
                      value={formData.bank_name || ''}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      placeholder="e.g., CRDB Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <GlassInput
                      value={formData.account_number || ''}
                      onChange={(e) => handleInputChange('account_number', e.target.value)}
                      placeholder="Account number"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <GlassInput
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active || false}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_payment_method || false}
                    onChange={(e) => handleInputChange('is_payment_method', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Payment Method</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {editingAccount ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAccountManagement;
