import React, { useState } from 'react';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { PaymentMethod } from '../../../../lib/paymentMethodService';

interface PaymentMethodFormData {
  name: string;
  code: string;
  type: PaymentMethod['type'];
  icon: string;
  color: string;
  description: string;
  is_active: boolean;
}

const PaymentMethodManagement: React.FC = () => {
  const { 
    paymentMethodsWithAccounts, 
    loading, 
    error,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    linkPaymentMethodToAccount,
    unlinkPaymentMethodFromAccount,
    setDefaultAccountForPaymentMethod,
    getPaymentMethodStats
  } = usePaymentMethods();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [stats, setStats] = useState<{ total: number; active: number; byType: Record<string, number> }>({ total: 0, active: 0, byType: {} });
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    code: '',
    type: 'cash',
    icon: 'dollar-sign',
    color: '#3B82F6',
    description: '',
    is_active: true
  });

  const iconOptions = [
    { value: 'dollar-sign', label: '💰 Dollar Sign' },
    { value: 'credit-card', label: '💳 Credit Card' },
    { value: 'building', label: '🏦 Building' },
    { value: 'smartphone', label: '📱 Smartphone' },
    { value: 'file-text', label: '📄 File Text' },
    { value: 'calendar', label: '📅 Calendar' },
    { value: 'truck', label: '🚚 Truck' },
    { value: 'package', label: '📦 Package' },
    { value: 'globe', label: '🌐 Globe' },
    { value: 'zap', label: '⚡ Zap' }
  ];

  const typeOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'check', label: 'Check' },
    { value: 'installment', label: 'Installment' },
    { value: 'delivery', label: 'Delivery' }
  ];

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Yellow' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#84CC16', label: 'Lime' },
    { value: '#F97316', label: 'Orange' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#6B7280', label: 'Gray' }
  ];

  React.useEffect(() => {
    const loadStats = async () => {
      const paymentStats = await getPaymentMethodStats();
      setStats(paymentStats);
    };
    loadStats();
  }, [getPaymentMethodStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMethod) {
      await updatePaymentMethod(editingMethod.id, formData);
      setEditingMethod(null);
    } else {
      await createPaymentMethod(formData);
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      type: method.type,
      icon: method.icon,
      color: method.color,
      description: method.description,
      is_active: method.is_active
    });
    setShowAddModal(true);
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (window.confirm(`Are you sure you want to delete "${method.name}"?`)) {
      await deletePaymentMethod(method.id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'cash',
      icon: 'dollar-sign',
      color: '#3B82F6',
      description: '',
      is_active: true
    });
  };

  const getIconForMethod = (method: PaymentMethod) => {
    const iconMap: Record<string, string> = {
      'dollar-sign': '💰',
      'credit-card': '💳',
      'building': '🏦',
      'smartphone': '📱',
      'file-text': '📄',
      'calendar': '📅',
      'truck': '🚚',
      'package': '📦',
      'globe': '🌐',
      'zap': '⚡'
    };
    
    return iconMap[method.icon] || '💳';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
                          <p className="text-gray-600">Manage unified payment methods for Finance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Payment Method
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Methods</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active Methods</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byType).length}</div>
          <div className="text-sm text-gray-600">Types</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{paymentMethodsWithAccounts.length}</div>
          <div className="text-sm text-gray-600">With Accounts</div>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethodsWithAccounts.map((method) => (
          <div key={method.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getIconForMethod(method)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-500">{method.type}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(method)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(method)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {method.description && (
              <p className="text-sm text-gray-600 mb-3">{method.description}</p>
            )}
            
            <div className="flex items-center space-x-2 mb-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: method.color }}
              ></div>
              <span className="text-sm text-gray-600">Color: {method.color}</span>
            </div>

            <div className="text-sm text-gray-600">
              <div>Code: <span className="font-mono">{method.code}</span></div>
              <div>Status: <span className={method.is_active ? 'text-green-600' : 'text-red-600'}>
                {method.is_active ? 'Active' : 'Inactive'}
              </span></div>
            </div>

            {/* Linked Accounts */}
            {method.accounts && method.accounts.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Linked Accounts:</h4>
                <div className="space-y-1">
                  {method.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{account.account?.name}</span>
                      {account.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PaymentMethod['type'] }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active</label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingMethod ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMethod(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodManagement; 