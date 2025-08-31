import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, ExternalLink, AlertCircle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { dashboardService, FinancialSummary } from '../../../../services/dashboardService';

interface FinancialWidgetProps {
  className?: string;
}

export const FinancialWidget: React.FC<FinancialWidgetProps> = ({ className }) => {
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getFinancialSummary();
      setFinancialData(data);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) return `${formatCurrency(amount / 1000000)}M`;
    if (amount >= 1000) return `${formatCurrency(amount / 1000)}K`;
    return formatCurrency(amount);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp size={12} />;
    if (growth < 0) return <TrendingDown size={12} />;
    return null;
  };

  if (isLoading) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </GlassCard>
    );
  }

  if (!financialData) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="text-center py-4">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Unable to load financial data</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Financial Overview</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">
                {formatCompactCurrency(financialData.monthlyRevenue)} this month
              </p>
              {financialData.revenueGrowth !== 0 && (
                <div className={`flex items-center gap-1 ${getGrowthColor(financialData.revenueGrowth)}`}>
                  {getGrowthIcon(financialData.revenueGrowth)}
                  <span className="text-xs font-medium">
                    {Math.abs(financialData.revenueGrowth)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {financialData.outstandingAmount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            <AlertCircle size={12} />
            {formatCompactCurrency(financialData.outstandingAmount)}
          </div>
        )}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <p className="text-lg font-bold text-emerald-700">
            {formatCompactCurrency(financialData.todayRevenue)}
          </p>
          <p className="text-xs text-emerald-600">Today</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-700">
            {formatCompactCurrency(financialData.weeklyRevenue)}
          </p>
          <p className="text-xs text-green-600">This Week</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-700">
            {financialData.completedPayments}
          </p>
          <p className="text-xs text-blue-600">Payments</p>
        </div>
      </div>

      {/* Payment Methods Summary */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Methods</h4>
        {financialData.paymentMethods.length > 0 ? (
          financialData.paymentMethods.slice(0, 3).map((method, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {method.method}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCompactCurrency(method.amount)}
                </p>
                <p className="text-xs text-gray-600">
                  {method.count} transactions
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-gray-600">No payment data</p>
          </div>
        )}
      </div>

      {/* Outstanding Payments Alert */}
      {financialData.outstandingAmount > 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Outstanding Payments
              </p>
              <p className="text-xs text-orange-600">
                {formatCurrency(financialData.outstandingAmount)} from {financialData.pendingPayments} customers
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <GlassButton
          onClick={() => navigate('/finance')}
          variant="ghost"
          size="sm"
          className="flex-1"
          icon={<ExternalLink size={14} />}
        >
          Finance
        </GlassButton>
        <GlassButton
          onClick={() => navigate('/lats/payment-tracking')}
          variant="ghost"
          size="sm"
          icon={<CreditCard size={14} />}
        >
          Payments
        </GlassButton>
      </div>
    </GlassCard>
  );
};