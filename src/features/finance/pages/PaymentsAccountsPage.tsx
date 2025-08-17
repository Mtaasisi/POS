import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Wallet, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  DollarSign,
  Building,
  Smartphone,
  CreditCard,
  PiggyBank,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../lib/customerApi';
import { toast } from 'react-hot-toast';

interface Account {
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

interface AccountStats {
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  averageBalance: number;
  byType: Record<string, number>;
}

const PaymentsAccountsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<AccountStats>({
    totalAccounts: 0,
    activeAccounts: 0,
    totalBalance: 0,
    averageBalance: 0,
    byType: {}
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'bank' as Account['type'],
    balance: 0,
    account_number: '',
    bank_name: '',
    is_active: true
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        toast.error('Failed to load accounts');
      } else {
        setAccounts(data || []);
        calculateStats(data || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (accountsData: Account[]) => {
    const activeAccounts = accountsData.filter(acc => acc.is_active);
    const totalBalance = accountsData.reduce((sum, acc) => sum + acc.balance, 0);
    const byType: Record<string, number> = {};
    
    accountsData.forEach(acc => {
      byType[acc.type] = (byType[acc.type] || 0) + 1;
    });

    setStats({
      totalAccounts: accountsData.length,
      activeAccounts: activeAccounts.length,
      totalBalance,
      averageBalance: accountsData.length > 0 ? totalBalance / accountsData.length : 0,
      byType
    });
  };

  const handleAddAccount = async () => {
    if (!accountForm.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .insert([{
          name: accountForm.name.trim(),
          type: accountForm.type,
          balance: accountForm.balance,
          account_number: accountForm.account_number.trim() || null,
          bank_name: accountForm.bank_name.trim() || null,
          is_active: accountForm.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => [data, ...prev]);
      calculateStats([data, ...accounts]);
      setShowAddAccount(false);
      resetForm();
      toast.success('Account added successfully');
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add account');
    }
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !accountForm.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .update({
          name: accountForm.name.trim(),
          type: accountForm.type,
          balance: accountForm.balance,
          account_number: accountForm.account_number.trim() || null,
          bank_name: accountForm.bank_name.trim() || null,
          is_active: accountForm.is_active
        })
        .eq('id', editingAccount.id)
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? data : acc));
      calculateStats(accounts.map(acc => acc.id === editingAccount.id ? data : acc));
      setEditingAccount(null);
      resetForm();
      toast.success('Account updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      calculateStats(accounts.filter(acc => acc.id !== accountId));
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const resetForm = () => {
    setAccountForm({
      name: '',
      type: 'bank',
      balance: 0,
      account_number: '',
      bank_name: '',
      is_active: true
    });
  };

  const getAccountTypeIcon = (type: Account['type']) => {
    switch (type) {
      case 'bank':
        return <Building className="w-5 h-5 text-blue-600" />;
      case 'cash':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'mobile_money':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-indigo-600" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-yellow-600" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAccountTypeColor = (type: Account['type']): string => {
    switch (type) {
      case 'bank': return 'bg-blue-100 text-blue-700';
      case 'cash': return 'bg-green-100 text-green-700';
      case 'mobile_money': return 'bg-purple-100 text-purple-700';
      case 'credit_card': return 'bg-indigo-100 text-indigo-700';
      case 'savings': return 'bg-yellow-100 text-yellow-700';
      case 'investment': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (account.account_number && account.account_number.includes(searchQuery)) ||
                         (account.bank_name && account.bank_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || account.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && account.is_active) ||
                         (filterStatus === 'inactive' && !account.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments Accounts</h1>
              <p className="text-gray-600">Manage your financial accounts and payment methods</p>
            </div>
            <div className="flex gap-3">
              <GlassButton
                variant="outline"
                onClick={loadAccounts}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </GlassButton>
              <GlassButton
                onClick={() => setShowAddAccount(true)}
              >
                <Plus className="w-4 h-4" />
                Add Account
              </GlassButton>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAccounts}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBalance)}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageBalance)}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit_card">Credit Card</option>
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading accounts...</span>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <GlassCard>
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first account'
                  }
                </p>
                <GlassButton onClick={() => setShowAddAccount(true)}>
                  <Plus className="w-4 h-4" />
                  Add Account
                </GlassButton>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAccounts.map((account) => (
                <GlassCard key={account.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getAccountTypeIcon(account.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{account.name}</h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}>
                          {account.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">{formatCurrency(account.balance)}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        account.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {(account.account_number || account.bank_name) && (
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      {account.account_number && <p>Account: {account.account_number}</p>}
                      {account.bank_name && <p>Bank: {account.bank_name}</p>}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingAccount(account);
                        setAccountForm({
                          name: account.name,
                          type: account.type,
                          balance: account.balance,
                          account_number: account.account_number || '',
                          bank_name: account.bank_name || '',
                          is_active: account.is_active
                        });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Account Modal */}
        {(showAddAccount || editingAccount) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, type: e.target.value as Account['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bank">🏦 Bank</option>
                    <option value="cash">💰 Cash</option>
                    <option value="mobile_money">📱 Mobile Money</option>
                    <option value="credit_card">💳 Credit Card</option>
                    <option value="savings">🏦 Savings</option>
                    <option value="investment">📈 Investment</option>
                    <option value="other">📁 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number (Optional)</label>
                  <input
                    type="text"
                    value={accountForm.account_number}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name (Optional)</label>
                  <input
                    type="text"
                    value={accountForm.bank_name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bank name"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={accountForm.is_active}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Account is active
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <GlassButton
                  variant="outline"
                  onClick={() => {
                    setShowAddAccount(false);
                    setEditingAccount(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={editingAccount ? handleUpdateAccount : handleAddAccount}
                  className="flex-1"
                >
                  {editingAccount ? 'Update' : 'Add'} Account
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsAccountsPage; 