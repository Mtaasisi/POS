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
  Eye, EyeOff, TestTube, Activity, TrendingUp, TrendingDown
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

const PaymentProviderManagement: React.FC = () => {
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

  // Fetch providers with better error handling
  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const serviceProviders = await paymentProviderService.getPaymentProvidersWithRealMetrics();

      const providers: PaymentProvider[] = serviceProviders.map(provider => ({
        id: provider.id,
        name: provider.name,
        type: provider.type as 'mobile_money' | 'card' | 'bank' | 'cash' | 'crypto',
        status: provider.status as 'active' | 'inactive' | 'testing',
        apiKey: provider.configuration?.apiKey || '',
        secretKey: provider.configuration?.secretKey || '',
        webhookUrl: provider.configuration?.webhookUrl || '',
        baseUrl: provider.configuration?.webhookUrl || '',
        supportedMethods: provider.configuration?.supportedMethods || [],
        fees: { 
          percentage: provider.configuration?.fees?.percentage || 0, 
          fixed: provider.configuration?.fees?.fixed || 0, 
          currency: provider.configuration?.currency || 'TZS' 
        },
        limits: { 
          minAmount: provider.configuration?.fees?.minimum || 0, 
          maxAmount: provider.configuration?.limits?.perTransaction || 1000000, 
          dailyLimit: provider.configuration?.limits?.daily || 10000000 
        },
        features: provider.configuration?.supportedMethods || [],
        lastTested: provider.performance?.lastUsed,
        testStatus: 'success' as const,
        performance: {
          successRate: provider.performance?.successRate || 0,
          averageResponseTime: provider.performance?.averageResponseTime || 0,
          totalTransactions: provider.performance?.totalTransactions || 0
        },
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      }));

      setProviders(providers);
      console.log('✅ Payment providers loaded from service:', providers.length);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      
      if (error?.message?.includes('ERR_CONNECTION_CLOSED') || 
          error?.message?.includes('Failed to fetch')) {
        console.warn('⚠️ Connection issue, keeping existing providers');
        toast.error('Connection issue. Using cached data.');
      } else {
        toast.error('Failed to load payment providers');
        setProviders([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh payment methods in global context when providers change
  const handleProviderChange = useCallback(async () => {
    await refreshPaymentMethods();
    await fetchProviders();
  }, [refreshPaymentMethods, fetchProviders]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value
      }
    }));
  };

  // Save provider
  const handleSave = async () => {
    try {
      if (editingProvider) {
        const { error } = await supabase
          .from('payment_providers')
          .update({
            name: formData.name,
            type: formData.type,
            status: formData.status,
            api_key: formData.apiKey,
            secret_key: formData.secretKey,
            webhook_url: formData.webhookUrl,
            base_url: formData.baseUrl,
            supported_methods: formData.supportedMethods,
            payment_icon: formData.paymentIcon,
            fee_percentage: formData.fees.percentage,
            fee_fixed: formData.fees.fixed,
            currency: formData.fees.currency,
            min_amount: formData.limits.minAmount,
            max_amount: formData.limits.maxAmount,
            daily_limit: formData.limits.dailyLimit,
            features: formData.features,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProvider.id);

        if (error) throw error;
        
        toast.success('Provider updated successfully');
      } else {
        const { data, error } = await supabase
          .from('payment_providers')
          .insert({
            name: formData.name,
            type: formData.type,
            status: formData.status,
            api_key: formData.apiKey,
            secret_key: formData.secretKey,
            webhook_url: formData.webhookUrl,
            base_url: formData.baseUrl,
            supported_methods: formData.supportedMethods,
            payment_icon: formData.paymentIcon,
            fee_percentage: formData.fees.percentage,
            fee_fixed: formData.fees.fixed,
            currency: formData.fees.currency,
            min_amount: formData.limits.minAmount,
            max_amount: formData.limits.maxAmount,
            daily_limit: formData.limits.dailyLimit,
            features: formData.features
          })
          .select()
          .single();

        if (error) throw error;
        
        toast.success('Provider added successfully');
      }
      
      await fetchProviders();
      
      setShowAddModal(false);
      setEditingProvider(null);
      setFormData({
        name: '',
        type: 'mobile_money',
        status: 'testing',
        supportedMethods: [],
        fees: { percentage: 0, fixed: 0, currency: 'TZS' },
        limits: { minAmount: 0, maxAmount: 1000000, dailyLimit: 10000000 },
        features: []
      });
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error('Failed to save provider');
    }
  };

  // Test provider
  const handleTestProvider = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      console.log('🔄 Testing payment provider...');
      
      // Test provider using the service
      const result = await paymentProviderService.testProvider(providerId);
      if (result) {
        setProviders(prev => prev.map(p => 
          p.id === providerId 
            ? { ...p, lastTested: new Date().toISOString(), testStatus: 'success' }
            : p
        ));
        toast.success('Provider test completed successfully');
      } else {
        setProviders(prev => prev.map(p => 
          p.id === providerId 
            ? { ...p, lastTested: new Date().toISOString(), testStatus: 'failed' }
            : p
        ));
        toast.error('Provider test failed');
      }
    } catch (error) {
      console.error('Error testing provider:', error);
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, lastTested: new Date().toISOString(), testStatus: 'failed' }
          : p
      ));
      toast.error('Provider test failed');
    } finally {
      setTestingProvider(null);
    }
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  // Delete provider
  const handleDeleteProvider = async (providerId: string, providerName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${providerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = await paymentProviderService.deletePaymentProvider(providerId);
      
      if (success) {
        toast.success(`Provider "${providerName}" deleted successfully`);
        await fetchProviders();
        await refreshPaymentMethods();
      } else {
        toast.error('Failed to delete provider');
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Failed to delete provider');
    }
  };

  // Get status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'testing':
        return 'text-orange-600 bg-orange-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get test status styling
  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get provider icon
  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'mobile_money':
        return <Smartphone className="w-5 h-5" />;
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'bank':
        return <Building className="w-5 h-5" />;
      case 'cash':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Providers</h3>
          <p className="text-gray-600 mt-1">
            Manage payment providers and their configurations
          </p>
        </div>

        <div className="flex gap-3">
          <GlassButton
            onClick={fetchProviders}
            icon={<RefreshCw size={18} />}
            variant="secondary"
            loading={isLoading}
            disabled={isLoading}
          >
            Refresh
          </GlassButton>
          <GlassButton
            onClick={() => setShowAddModal(true)}
            icon={<Plus size={18} />}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
          >
            Add Provider
          </GlassButton>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <GlassCard key={provider.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {getProviderIcon(provider.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{provider.type.replace('_', ' ')}</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(provider.status)}`}>
                {provider.status}
              </span>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Success Rate</p>
                <p className="font-semibold text-green-600">{provider.performance.successRate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Response Time</p>
                <p className="font-semibold text-blue-600">{provider.performance.averageResponseTime}s</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Transactions</p>
                <p className="font-semibold text-purple-600">{provider.performance.totalTransactions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Fees</p>
                <p className="font-semibold text-orange-600">{provider.fees.percentage}%</p>
              </div>
            </div>

            {/* Test Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getTestStatusColor(provider.testStatus || 'pending')}`}>
                  {provider.testStatus === 'success' && <CheckCircle className="w-3 h-3" />}
                  {provider.testStatus === 'failed' && <XCircle className="w-3 h-3" />}
                  {provider.testStatus === 'pending' && <AlertTriangle className="w-3 h-3" />}
                  {provider.testStatus || 'Not Tested'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {provider.lastTested ? new Date(provider.lastTested).toLocaleDateString() : 'Never'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <GlassButton
                onClick={() => handleTestProvider(provider.id)}
                variant="secondary"
                size="sm"
                loading={testingProvider === provider.id}
                icon={<TestTube size={14} />}
                className="flex-1"
              >
                Test
              </GlassButton>
              <GlassButton
                onClick={() => {
                  setEditingProvider(provider);
                  setFormData(provider);
                  setShowAddModal(true);
                }}
                variant="secondary"
                size="sm"
                icon={<Edit3 size={14} />}
              >
                Edit
              </GlassButton>
              <GlassButton
                onClick={() => toggleApiKeyVisibility(provider.id)}
                variant="secondary"
                size="sm"
                icon={showApiKeys.has(provider.id) ? <EyeOff size={14} /> : <Eye size={14} />}
              >
                {showApiKeys.has(provider.id) ? 'Hide' : 'Show'}
              </GlassButton>
              <GlassButton
                onClick={() => handleDeleteProvider(provider.id, provider.name)}
                variant="secondary"
                size="sm"
                icon={<Trash2 size={14} />}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </GlassButton>
            </div>

            {/* API Keys (when visible) */}
            {showApiKeys.has(provider.id) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">API Key</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {provider.apiKey || 'Not configured'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Webhook URL</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {provider.webhookUrl || 'Not configured'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Add/Edit Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
              </h3>
              <GlassButton
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProvider(null);
                  setFormData({
                    name: '',
                    type: 'mobile_money',
                    status: 'testing',
                    supportedMethods: [],
                    fees: { percentage: 0, fixed: 0, currency: 'TZS' },
                    limits: { minAmount: 0, maxAmount: 1000000, dailyLimit: 10000000 },
                    features: []
                  });
                }}
                variant="secondary"
                size="sm"
                icon={<X size={16} />}
              >
                Close
              </GlassButton>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label>
                  <GlassInput
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter provider name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <GlassSelect
                    options={[
                      { value: 'mobile_money', label: 'Mobile Money' },
                      { value: 'card', label: 'Card' },
                      { value: 'bank', label: 'Bank' },
                      { value: 'cash', label: 'Cash' },
                      { value: 'crypto', label: 'Cryptocurrency' }
                    ]}
                    value={formData.type || 'mobile_money'}
                    onChange={(value) => handleInputChange('type', value)}
                  />
                </div>
              </div>

              {/* Payment Logo */}
              <div>
                <PaymentLogoUploaderBase64
                  currentIcon={formData.paymentIcon}
                  onIconChange={(iconUrl) => handleInputChange('paymentIcon', iconUrl)}
                  paymentMethodName={formData.name || 'Payment Method'}
                />
              </div>

              {/* API Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <GlassInput
                    value={formData.apiKey || ''}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    placeholder="Enter API key"
                    type="password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                  <GlassInput
                    value={formData.secretKey || ''}
                    onChange={(e) => handleInputChange('secretKey', e.target.value)}
                    placeholder="Enter secret key"
                    type="password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                  <GlassInput
                    value={formData.baseUrl || ''}
                    onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                    placeholder="https://api.provider.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                  <GlassInput
                    value={formData.webhookUrl || ''}
                    onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                    placeholder="https://your-app.com/webhooks"
                  />
                </div>
              </div>

              {/* Fees Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fee Percentage</label>
                  <GlassInput
                    type="number"
                    step="0.01"
                    value={formData.fees?.percentage || 0}
                    onChange={(e) => handleNestedChange('fees', 'percentage', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Fee</label>
                  <GlassInput
                    type="number"
                    value={formData.fees?.fixed || 0}
                    onChange={(e) => handleNestedChange('fees', 'fixed', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <GlassSelect
                    options={[
                      { value: 'TZS', label: 'TZS' },
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' }
                    ]}
                    value={formData.fees?.currency || 'TZS'}
                    onChange={(value) => handleNestedChange('fees', 'currency', value)}
                  />
                </div>
              </div>

              {/* Limits Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                  <GlassInput
                    type="number"
                    value={formData.limits?.minAmount || 0}
                    onChange={(e) => handleNestedChange('limits', 'minAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                  <GlassInput
                    type="number"
                    value={formData.limits?.maxAmount || 0}
                    onChange={(e) => handleNestedChange('limits', 'maxAmount', parseFloat(e.target.value) || 0)}
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Limit</label>
                  <GlassInput
                    type="number"
                    value={formData.limits?.dailyLimit || 0}
                    onChange={(e) => handleNestedChange('limits', 'dailyLimit', parseFloat(e.target.value) || 0)}
                    placeholder="10000000"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <GlassSelect
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'testing', label: 'Testing' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                  value={formData.status || 'testing'}
                  onChange={(value) => handleInputChange('status', value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <GlassButton
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProvider(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handleSave}
                icon={<Save size={16} />}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                {editingProvider ? 'Update' : 'Add'} Provider
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default PaymentProviderManagement;
