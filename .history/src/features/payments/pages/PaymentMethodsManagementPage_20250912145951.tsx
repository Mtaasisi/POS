import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../../../hooks/usePaymentAccounts';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, 
  DollarSign, CreditCard, Smartphone, Building,
  Settings, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FinanceAccount } from '../../../lib/financeAccountService';

interface PaymentMethodFormData {
  name: string;
  type: FinanceAccount['type'];
  account_number?: string;
  bank_name?: string;
  currency: string;
  payment_icon?: string;
  payment_color?: string;
  payment_description?: string;
  requires_reference: boolean;
  requires_account_number: boolean;
  notes?: string;
}

const PaymentMethodsManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { 
    paymentMethods, 
    loading: methodsLoading, 
    createPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod,
    fetchPaymentMethods 
  } = usePaymentMethods();
  const { paymentAccounts, loading: accountsLoading } = usePaymentAccounts();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<FinanceAccount | null>(null);
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    type: 'cash',
    currency: 'TZS',
    requires_reference: false,
    requires_account_number: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal state changes
  useEffect(() => {
    if (!showCreateForm && !editingMethod) {
      setFormData({
        name: '',
        type: 'cash',
        currency: 'TZS',
        requires_reference: false,
        requires_account_number: false
      });
    }
  }, [showCreateForm, editingMethod]);

  // Populate form when editing
  useEffect(() => {
    if (editingMethod) {
      setFormData({
        name: editingMethod.name,
        type: editingMethod.type,
        account_number: editingMethod.account_number || '',
        bank_name: editingMethod.bank_name || '',
        currency: editingMethod.currency,
        payment_icon: editingMethod.payment_icon || '',
        payment_color: editingMethod.payment_color || '',
        payment_description: editingMethod.payment_description || '',
        requires_reference: editingMethod.requires_reference,
        requires_account_number: editingMethod.requires_account_number,
        notes: editingMethod.notes || ''
      });
    }
  }, [editingMethod]);

  // Get payment method icon
  const getPaymentMethodIcon = (method: FinanceAccount) => {
    if (method.payment_icon) {
      return <span className="text-lg" role="img" aria-label={method.name}>{method.payment_icon}</span>;
    }
    
    const iconMap: Record<string, React.ReactNode> = {
      'cash': <DollarSign className="w-4 h-4" />,
      'credit_card': <CreditCard className="w-4 h-4" />,
      'mobile_money': <Smartphone className="w-4 h-4" />,
      'bank': <Building className="w-4 h-4" />,
      'savings': <Building className="w-4 h-4" />,
      'investment': <Building className="w-4 h-4" />,
      'other': <CreditCard className="w-4 h-4" />
    };
    return iconMap[method.type] || <DollarSign className="w-4 h-4" />;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Payment method name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const methodData = {
        ...formData,
        balance: 0,
        is_active: true,
        is_payment_method: true,
        account_number: formData.account_number || null,
        bank_name: formData.bank_name || null,
        payment_icon: formData.payment_icon || null,
        payment_color: formData.payment_color || null,
        payment_description: formData.payment_description || null,
        notes: formData.notes || null
      };

      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, methodData);
        toast.success('Payment method updated successfully');
        setEditingMethod(null);
      } else {
        await createPaymentMethod(methodData);
        toast.success('Payment method created successfully');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('Failed to save payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (method: FinanceAccount) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"?`)) return;

    try {
      await deletePaymentMethod(method.id);
      toast.success('Payment method deleted successfully');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (method: FinanceAccount) => {
    try {
      await updatePaymentMethod(method.id, { is_active: !method.is_active });
      toast.success(`Payment method ${method.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
    }
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate(-1)} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
                <p className="text-gray-600">Manage your payment methods and accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GlassButton
                onClick={() => fetchPaymentMethods()}
                variant="outline"
                icon={<RefreshCw className="w-4 h-4" />}
                disabled={methodsLoading}
              >
                Refresh
              </GlassButton>
              <GlassButton
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
              >
                Add Payment Method
              </GlassButton>
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {methodsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <GlassCard key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </GlassCard>
              ))
            ) : paymentMethods.length === 0 ? (
              <div className="col-span-full">
                <GlassCard className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Payment Methods</h3>
                  <p className="text-gray-500 mb-6">Get started by adding your first payment method</p>
                  <GlassButton
                    onClick={() => setShowCreateForm(true)}
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add Payment Method
                  </GlassButton>
                </GlassCard>
              </div>
            ) : (
              paymentMethods.map((method) => (
                <GlassCard key={method.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getPaymentMethodIcon(method)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{method.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(method)}
                        className={`p-1 rounded ${
                          method.is_active 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={method.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {method.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingMethod(method)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(method)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Balance:</span>
                      <span className="font-medium">{formatMoney(method.balance)}</span>
                    </div>
                    {method.account_number && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Account:</span>
                        <span className="font-medium">{method.account_number}</span>
                      </div>
                    )}
                    {method.bank_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Bank:</span>
                        <span className="font-medium">{method.bank_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Reference Required:</span>
                      <span className="font-medium">
                        {method.requires_reference ? (
                          <CheckCircle className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {method.payment_description && (
                    <p className="text-sm text-gray-600 mb-4">{method.payment_description}</p>
                  )}

                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    method.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {method.is_active ? 'Active' : 'Inactive'}
                  </div>
                </GlassCard>
              ))
            )}
          </div>

          {/* Create/Edit Form Modal */}
          {(showCreateForm || editingMethod) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <GlassCard className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingMethod(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassInput
                      label="Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., M-Pesa, Cash, Bank Account"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as FinanceAccount['type'] })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="bank">Bank Account</option>
                        <option value="savings">Savings Account</option>
                        <option value="investment">Investment Account</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <GlassInput
                      label="Currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      placeholder="TZS"
                    />

                    <GlassInput
                      label="Account Number"
                      value={formData.account_number || ''}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="Account number (optional)"
                    />

                    <GlassInput
                      label="Bank Name"
                      value={formData.bank_name || ''}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="Bank name (optional)"
                    />

                    <GlassInput
                      label="Payment Icon"
                      value={formData.payment_icon || ''}
                      onChange={(e) => setFormData({ ...formData, payment_icon: e.target.value })}
                      placeholder="💳 (emoji or icon)"
                    />

                    <GlassInput
                      label="Payment Color"
                      value={formData.payment_color || ''}
                      onChange={(e) => setFormData({ ...formData, payment_color: e.target.value })}
                      placeholder="#3B82F6 (hex color)"
                    />
                  </div>

                  <GlassInput
                    label="Description"
                    value={formData.payment_description || ''}
                    onChange={(e) => setFormData({ ...formData, payment_description: e.target.value })}
                    placeholder="Payment method description"
                    multiline
                    rows={2}
                  />

                  <GlassInput
                    label="Notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    multiline
                    rows={2}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={formData.requires_reference}
                        onChange={(e) => setFormData({ ...formData, requires_reference: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Requires Reference Number</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={formData.requires_account_number}
                        onChange={(e) => setFormData({ ...formData, requires_account_number: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Requires Account Number</span>
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <GlassButton
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingMethod(null);
                      }}
                      variant="ghost"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      loading={isSubmitting}
                    >
                      {editingMethod ? 'Update' : 'Create'} Payment Method
                    </GlassButton>
                  </div>
                </form>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default PaymentMethodsManagementPage;
