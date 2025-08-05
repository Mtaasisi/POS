import React from 'react';
import useFinancialData from '../hooks/useFinancialData';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  User,
  Calendar,
  Phone,
  Mail,
  Package,
  RefreshCw
} from 'lucide-react';

const CustomerFinancialSummary: React.FC = () => {
  const {
    payments,
    loading,
    error,
    refreshData
  } = useFinancialData();

  const formatCurrency = (amount: number) => {
    return 'Tsh ' + Number(amount).toLocaleString('en-TZ', { maximumFractionDigits: 0 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group payments by customer
  const customerPayments = payments.reduce((acc, payment) => {
    const customerId = payment.customer_id;
    const customerName = payment.customer_name || 'Unknown Customer';
    
    if (!acc[customerId]) {
      acc[customerId] = {
        id: customerId,
        name: customerName,
        totalSpent: 0,
        paymentCount: 0,
        payments: []
      };
    }
    
    acc[customerId].totalSpent += payment.amount || 0;
    acc[customerId].paymentCount += 1;
    acc[customerId].payments.push(payment);
    
    return acc;
  }, {} as Record<string, any>);

  const customerList = Object.values(customerPayments).sort((a, b) => b.totalSpent - a.totalSpent);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <GlassButton onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customer Financial Summary
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Customer payment data and financial insights
          </p>
        </div>
        <GlassButton onClick={refreshData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </GlassButton>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {customerList.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(customerList.reduce((sum, customer) => sum + customer.totalSpent, 0))}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Payments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {payments.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Customer List */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customer Payment History
          </h3>
        </div>

        {customerList.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No customer payment data found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customerList.map((customer) => (
              <div key={customer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {customer.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.paymentCount} payment{customer.paymentCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total Spent
                    </p>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-2">
                  {customer.payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(payment.payment_date)}
                          </span>
                        </div>
                        {payment.device_name && (
                          <div className="flex items-center gap-2">
                            <Package className="w-3 h-3 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {payment.device_name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {payment.method}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Recent Payments */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Payments
          </h3>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No payment records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {payment.customer_name || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(payment.payment_date)}
                    </p>
                  </div>
                  {payment.device_name && (
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {payment.device_name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {payment.method} • {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default CustomerFinancialSummary; 