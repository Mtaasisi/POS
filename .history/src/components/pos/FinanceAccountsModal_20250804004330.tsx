import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { financeAccountService, FinanceAccount } from '../../lib/financeAccountService';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Building, 
  DollarSign, 
  Smartphone, 
  CreditCard, 
  PiggyBank, 
  TrendingUp,
  X,
  Star,
  Wallet,
  RefreshCw
} from 'lucide-react';

interface FinanceAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSelect?: (account: FinanceAccount) => void;
}

const FinanceAccountsModal: React.FC<FinanceAccountsModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccountSelect 
}) => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Account form state
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'bank' as FinanceAccount['type'],
    balance: 0,
    account_number: '',
    bank_name: '',
    currency: 'KES',
    is_active: true,
    is_payment_method: true,
    payment_icon: '',
    payment_color: '#3B82F6',
    payment_description: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const accounts = await financeAccountService.getActiveFinanceAccounts();
      setAccounts(accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      // Only send the fields that should be created
      const createData = {
        name: accountForm.name,
        type: accountForm.type,
        balance: Number(accountForm.balance) || 0, // Ensure it's a number
        account_number: accountForm.account_number || null,
        bank_name: accountForm.bank_name || null,
        currency: accountForm.currency,
        is_active: Boolean(accountForm.is_active), // Ensure it's a boolean
        is_payment_method: Boolean(accountForm.is_payment_method), // Ensure it's a boolean
        payment_icon: accountForm.payment_icon || financeAccountService.getIconForAccountType(accountForm.type),
        payment_color: accountForm.payment_color || financeAccountService.getColorForAccountType(accountForm.type),
        payment_description: accountForm.payment_description || `${accountForm.type} account`,
        notes: accountForm.notes || null
      };

      console.log('🔧 Sending create data:', createData);

      const newAccount = await financeAccountService.createFinanceAccount(createData);

      if (newAccount) {
        setAccounts(prev => [newAccount, ...prev]);
        setShowAddAccount(false);
        resetForm();
        toast.success('Account added successfully');
      } else {
        toast.error('Failed to add account');
      }
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
      // Only send the essential fields first to test
      const updateData = {
        name: accountForm.name,
        type: accountForm.type,
        balance: Number(accountForm.balance) || 0,
        payment_icon: accountForm.payment_icon || financeAccountService.getIconForAccountType(accountForm.type),
        payment_color: accountForm.payment_color || financeAccountService.getColorForAccountType(accountForm.type),
        payment_description: accountForm.payment_description || `${accountForm.type} account`
      };

      console.log('🔧 Sending update data:', updateData);

      // Test updating just the name field first
      console.log('🧪 Testing single field update...');
      const testResult = await financeAccountService.testUpdateField(editingAccount.id, 'name', updateData.name);
      
      let updatedAccount = null;
      if (testResult) {
        console.log('✅ Single field update worked, proceeding with full update');
        updatedAccount = await financeAccountService.updateFinanceAccount(editingAccount.id, updateData);
      } else {
        console.log('❌ Single field update failed, skipping full update');
        toast.error('Failed to update account - database connection issue');
        return;
      }

      if (updatedAccount) {
        setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? updatedAccount : acc));
        setEditingAccount(null);
        resetForm();
        toast.success('Account updated successfully');
      } else {
        toast.error('Failed to update account');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const success = await financeAccountService.deleteFinanceAccount(accountId);
      if (success) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        toast.success('Account deleted successfully');
      } else {
        toast.error('Failed to delete account');
      }
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
      currency: 'KES',
      is_active: true,
      is_payment_method: true,
      payment_icon: '',
      payment_color: '#3B82F6',
      payment_description: '',
      notes: ''
    });
  };

  const getAccountTypeIcon = (type: FinanceAccount['type'], customIcon?: string) => {
    const iconSize = "w-6 h-6";
    const baseClasses = "rounded-full p-2";
    
    // If custom icon is provided, use it
    if (customIcon && customIcon.trim()) {
      // Handle local files (no http/https)
      if (!customIcon.startsWith('http') && !customIcon.startsWith('data:')) {
        const localIconPath = `/icons/payment-methods/${customIcon}`;
        return (
          <div className={`${baseClasses} bg-gray-100`}>
            <img 
              src={localIconPath} 
              alt="Custom icon" 
              className={`${iconSize} object-cover rounded-full`}
              onError={(e) => {
                console.warn(`Failed to load local icon: ${localIconPath}`);
                e.currentTarget.style.display = 'none';
                // Show a simple fallback text instead of trying to append React element
                const fallbackText = document.createElement('span');
                fallbackText.className = `${iconSize} text-gray-500`;
                fallbackText.textContent = '💰';
                e.currentTarget.parentElement?.appendChild(fallbackText);
              }}
            />
          </div>
        );
      }
      
      // Handle external URLs (must start with http/https)
      if (customIcon.startsWith('http://') || customIcon.startsWith('https://')) {
        return (
          <div className={`${baseClasses} bg-gray-100`}>
            <img 
              src={customIcon} 
              alt="Custom icon" 
              className={`${iconSize} object-cover rounded-full`}
              onError={(e) => {
                console.warn(`Failed to load external icon: ${customIcon}`);
                e.currentTarget.style.display = 'none';
                // Show a simple fallback text instead of trying to append React element
                const fallbackText = document.createElement('span');
                fallbackText.className = `${iconSize} text-gray-500`;
                fallbackText.textContent = '💰';
                e.currentTarget.parentElement?.appendChild(fallbackText);
              }}
            />
          </div>
        );
      }
      
      // Invalid URL format - fallback to default
      console.warn(`Invalid payment icon format: ${customIcon}`);
    }
    
    // Return default icon based on type
    return getDefaultIcon(type);
  };

  const getDefaultIcon = (type: FinanceAccount['type']) => {
    const iconSize = "w-6 h-6";
    const baseClasses = "rounded-full p-2";
    
    switch (type) {
      case 'bank':
        return (
          <div className={`${baseClasses} bg-blue-100 text-blue-600`}>
            <Building className={iconSize} />
          </div>
        );
      case 'cash':
        return (
          <div className={`${baseClasses} bg-green-100 text-green-600`}>
            <DollarSign className={iconSize} />
          </div>
        );
      case 'mobile_money':
        return (
          <div className={`${baseClasses} bg-purple-100 text-purple-600`}>
            <Smartphone className={iconSize} />
          </div>
        );
      case 'credit_card':
        return (
          <div className={`${baseClasses} bg-indigo-100 text-indigo-600`}>
            <CreditCard className={iconSize} />
          </div>
        );
      case 'savings':
        return (
          <div className={`${baseClasses} bg-yellow-100 text-yellow-600`}>
            <PiggyBank className={iconSize} />
          </div>
        );
      case 'investment':
        return (
          <div className={`${baseClasses} bg-emerald-100 text-emerald-600`}>
            <TrendingUp className={iconSize} />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100 text-gray-600`}>
            <Wallet className={iconSize} />
          </div>
        );
    }
  };

  const getAccountTypeColor = (type: FinanceAccount['type']): string => {
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
        return '#6B7280';
    }
  };

  const getAccountTypeGradient = (type: FinanceAccount['type']): string => {
    switch (type) {
      case 'bank':
        return 'from-blue-500 to-blue-600';
      case 'cash':
        return 'from-green-500 to-green-600';
      case 'mobile_money':
        return 'from-purple-500 to-purple-600';
      case 'credit_card':
        return 'from-indigo-500 to-indigo-600';
      case 'savings':
        return 'from-yellow-500 to-yellow-600';
      case 'investment':
        return 'from-emerald-500 to-emerald-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleAccountSelect = (account: FinanceAccount) => {
    if (onAccountSelect) {
      onAccountSelect(account);
    }
    onClose();
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.account_number?.includes(searchQuery);
    const matchesType = filterType === 'all' || account.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && account.is_active) ||
                         (filterStatus === 'inactive' && !account.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finance Accounts & Payment Methods">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
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
          
          <GlassButton
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </GlassButton>
        </div>

        {/* Accounts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading accounts...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <GlassCard key={account.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getAccountTypeIcon(account.type, account.payment_icon)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-500">{account.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {account.is_payment_method && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        Payment Method
                      </span>
                    )}
                    {account.is_active ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(account.balance)}</span>
                  </div>
                  
                  {account.bank_name && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bank:</span>
                      <span className="text-sm text-gray-900">{account.bank_name}</span>
                    </div>
                  )}
                  
                  {account.account_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account:</span>
                      <span className="text-sm text-gray-900">{account.account_number}</span>
                    </div>
                  )}
                  
                  {account.payment_description && (
                    <div className="text-xs text-gray-500 mt-2">
                      {account.payment_description}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleAccountSelect(account)}
                    className="flex-1"
                  >
                    Select
                  </GlassButton>
                  
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAccount(account);
                      setAccountForm({
                        name: account.name,
                        type: account.type,
                        balance: account.balance,
                        account_number: account.account_number || '',
                        bank_name: account.bank_name || '',
                        currency: account.currency,
                        is_active: account.is_active,
                        is_payment_method: account.is_payment_method,
                        payment_icon: account.payment_icon || '',
                        payment_color: account.payment_color || '#3B82F6',
                        payment_description: account.payment_description || '',
                        notes: account.notes || ''
                      });
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </GlassButton>
                  
                  <GlassButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Add/Edit Account Modal */}
        {(showAddAccount || editingAccount) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingAccount ? 'Edit Account' : 'Add New Account'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddAccount(false);
                    setEditingAccount(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm(prev => ({ 
                      ...prev, 
                      type: e.target.value as FinanceAccount['type'] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="savings">Savings</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Balance
                  </label>
                  <input
                    type="number"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={accountForm.bank_name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bank name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={accountForm.account_number}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={accountForm.payment_description}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, payment_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter payment description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Icon URL (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={accountForm.payment_icon}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, payment_icon: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/icon.png"
                    />
                    {accountForm.payment_icon && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                        <img 
                          src={accountForm.payment_icon} 
                          alt="Custom icon" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            toast.error('Invalid image URL');
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a filename from /icons/payment-methods/ or a full URL. Leave empty to use default icon.
                    <br />
                    <span className="text-blue-600">Local Examples:</span> visa.svg, mpesa.svg, cash.svg
                    <br />
                    <span className="text-blue-600">URL Examples:</span> https://cdn.example.com/visa.png
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={accountForm.is_active}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={accountForm.is_payment_method}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, is_payment_method: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Payment Method</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-2 pt-4">
                  <GlassButton
                    onClick={editingAccount ? handleUpdateAccount : handleAddAccount}
                    className="flex-1"
                  >
                    {editingAccount ? 'Update Account' : 'Add Account'}
                  </GlassButton>
                  
                  <GlassButton
                    variant="outline"
                    onClick={() => {
                      setShowAddAccount(false);
                      setEditingAccount(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FinanceAccountsModal; 