import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { 
  Settings, Plus, Edit3, Trash2, Save, X, 
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  CreditCard, Smartphone, Building, DollarSign,
  TrendingUp, TrendingDown, Eye, EyeOff
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

  // Get account type icon
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash': return <DollarSign size={20} />;
      case 'bank': return <Building size={20} />;
      case 'mobile_money': return <Smartphone size={20} />;
      case 'credit_card': return <CreditCard size={20} />;
      default: return <Settings size={20} />;
    }
  };

  // Get account type color
  const getAccountColor = (type: string) => {
    switch (type) {
      case 'cash': return 'text-green-600 bg-green-100';
      case 'bank': return 'text-blue-600 bg-blue-100';
      case 'mobile_money': return 'text-purple-600 bg-purple-100';
      case 'credit_card': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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
      {/* Header - Matching PurchaseOrderDetailPage style */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Payment Accounts</h2>
          <p className="text-sm text-gray-600">Manage your payment accounts and view balances</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </div>

      {/* Accounts Grid - Matching PurchaseOrderDetailPage style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getAccountColor(account.type)}`}>
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{account.type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(account)}
                  className="flex items-center justify-center p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="flex items-center justify-center p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatMoney(account.balance)}
              </div>
              <div className="text-sm text-gray-500">Current Balance</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600">
                  <TrendingUp size={14} />
                  <span className="text-sm font-medium">{formatMoney(account.totalReceived)}</span>
                </div>
                <div className="text-xs text-gray-500">Received</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600">
                  <TrendingDown size={14} />
                  <span className="text-sm font-medium">{formatMoney(account.totalSpent)}</span>
                </div>
                <div className="text-xs text-gray-500">Spent</div>
              </div>
            </div>

            {/* Recent Transactions */}
            {account.recentTransactions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  {account.recentTransactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between text-xs">
                      <div className="flex-1">
                        <div className="text-gray-600 truncate">{transaction.description}</div>
                        <div className="text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`font-medium ${
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

            {/* Status */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {account.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {account.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <GlassButton
                onClick={() => setShowAddModal(false)}
                icon={<X size={16} />}
                variant="secondary"
                className="p-2"
              />
            </div>

            <div className="space-y-4">
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

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Save size={16} />
                {editingAccount ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAccountManagement;
