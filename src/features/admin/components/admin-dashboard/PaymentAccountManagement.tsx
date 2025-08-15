import React, { useState, useEffect } from 'react';
import { enhancedPaymentService } from '../../../../lib/enhancedPaymentService';
import { financeAccountService } from '../../../../lib/financeAccountService';

const PaymentAccountManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mappings' | 'summary'>('mappings');
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [paymentMethodAccounts, setPaymentMethodAccounts] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [methods, accounts, mappings, summary] = await Promise.all([
        enhancedPaymentService.getPaymentMethods(),
        financeAccountService.getActiveFinanceAccounts(),
        enhancedPaymentService.getPaymentMethodAccounts(),
        enhancedPaymentService.getPaymentSummary()
      ]);

      setPaymentMethods(methods);
      setFinanceAccounts(accounts);
      setPaymentMethodAccounts(mappings);
      setPaymentSummary(summary);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodName = (id: string) => {
    return paymentMethods.find((m: any) => m.id === id)?.name || 'Unknown';
  };

  const getAccountName = (id: string) => {
    return financeAccounts.find((a: any) => a.id === id)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Payment Account Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage payment methods and account mappings
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('mappings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mappings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Account Mappings
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {paymentMethodAccounts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payment Summary
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {paymentSummary.length}
            </span>
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'mappings' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Payment Method to Account Mappings</h3>
            <div className="space-y-4">
              {paymentMethodAccounts.map((mapping: any) => (
                <div key={mapping.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">💳</div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getPaymentMethodName(mapping.payment_method_id)}
                      </div>
                      <div className="text-sm text-gray-500">
                        → {getAccountName(mapping.account_id)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {mapping.is_default && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                    {mapping.auto_route && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Auto Route
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentSummary.map((summary: any) => (
                <div key={summary.account_id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">💰</div>
                    <div>
                      <div className="font-medium text-gray-900">{summary.account_name}</div>
                      <div className="text-sm text-gray-500 capitalize">{summary.account_type}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="font-medium">TZS {summary.current_balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Payments:</span>
                      <span className="text-green-600">TZS {summary.total_payments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Transactions:</span>
                      <span className="text-blue-600">{summary.total_transactions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentAccountManagement;

