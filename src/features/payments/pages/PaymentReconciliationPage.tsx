import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  CheckCircle, XCircle, AlertTriangle, RefreshCw, 
  Download, Upload, FileText, Calculator, TrendingUp,
  Clock, DollarSign, BarChart3, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

interface ReconciliationRecord {
  id: string;
  date: string;
  status: 'reconciled' | 'pending' | 'discrepancy';
  expected: number;
  actual: number;
  variance: number;
  method: string;
  account: string;
  notes?: string;
  reconciledBy?: string;
  reconciledAt?: string;
}

interface ReconciliationSummary {
  totalReconciled: number;
  totalPending: number;
  totalDiscrepancies: number;
  totalVariance: number;
  reconciliationRate: number;
}

const PaymentReconciliationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationRecord[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    totalReconciled: 0,
    totalPending: 0,
    totalDiscrepancies: 0,
    totalVariance: 0,
    reconciliationRate: 0
  });
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null);

  // Fetch reconciliation data
  const fetchReconciliationData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch payment transactions for the selected date
      const { data: payments, error: paymentsError } = await supabase
        .from('customer_payments')
        .select('*')
        .gte('payment_date', `${selectedDate}T00:00:00`)
        .lte('payment_date', `${selectedDate}T23:59:59`)
        .eq('status', 'completed');

      if (paymentsError) throw paymentsError;

      // Fetch POS sales for the selected date
      const { data: sales, error: salesError } = await supabase
        .from('lats_sales')
        .select('*')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`);

      if (salesError) throw salesError;

      // Group by payment method and calculate expected vs actual
      const methodGroups = new Map<string, { expected: number; actual: number; count: number }>();
      
      // Process payments
      payments?.forEach(payment => {
        const method = payment.method || 'unknown';
        const existing = methodGroups.get(method) || { expected: 0, actual: 0, count: 0 };
        existing.actual += payment.amount;
        existing.count += 1;
        methodGroups.set(method, existing);
      });

      // Process sales (expected amounts)
      sales?.forEach(sale => {
        const method = sale.payment_method || 'unknown';
        const existing = methodGroups.get(method) || { expected: 0, actual: 0, count: 0 };
        existing.expected += sale.total_amount;
        methodGroups.set(method, existing);
      });

      // Create reconciliation records
      const records: ReconciliationRecord[] = Array.from(methodGroups.entries()).map(([method, data]) => {
        const variance = data.actual - data.expected;
        const status: 'reconciled' | 'pending' | 'discrepancy' = 
          Math.abs(variance) < 0.01 ? 'reconciled' : 
          Math.abs(variance) > 100 ? 'discrepancy' : 'pending';

        return {
          id: `${selectedDate}-${method}`,
          date: selectedDate,
          status,
          expected: data.expected,
          actual: data.actual,
          variance,
          method,
          account: `${method}_account`,
          notes: status === 'discrepancy' ? 'Significant variance detected' : undefined
        };
      });

      setReconciliationData(records);

      // Calculate summary
      const totalReconciled = records.filter(r => r.status === 'reconciled').length;
      const totalPending = records.filter(r => r.status === 'pending').length;
      const totalDiscrepancies = records.filter(r => r.status === 'discrepancy').length;
      const totalVariance = records.reduce((sum, r) => sum + r.variance, 0);
      const reconciliationRate = records.length > 0 ? (totalReconciled / records.length) * 100 : 0;

      setSummary({
        totalReconciled,
        totalPending,
        totalDiscrepancies,
        totalVariance,
        reconciliationRate
      });

    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      toast.error('Failed to load reconciliation data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReconciliationData();
  }, [fetchReconciliationData]);

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle manual reconciliation
  const handleReconcile = async (record: ReconciliationRecord) => {
    try {
      // Update the record as reconciled
      const updatedRecord = {
        ...record,
        status: 'reconciled' as const,
        reconciledBy: currentUser?.id,
        reconciledAt: new Date().toISOString(),
        notes: 'Manually reconciled'
      };

      // Update local state
      setReconciliationData(prev => 
        prev.map(r => r.id === record.id ? updatedRecord : r)
      );

      toast.success('Record reconciled successfully');
      setShowReconcileModal(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error reconciling record:', error);
      toast.error('Failed to reconcile record');
    }
  };

  // Get status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reconciled':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      case 'discrepancy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reconciled':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'discrepancy':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <PageErrorBoundary pageName="Payment Reconciliation" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/finance/payments" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Reconciliation</h1>
              <p className="text-gray-600 mt-1">
                Reconcile payment transactions and identify discrepancies
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <GlassButton
              onClick={fetchReconciliationData}
              icon={<RefreshCw size={18} />}
              variant="secondary"
              loading={isLoading}
              disabled={isLoading}
            >
              Refresh
            </GlassButton>
            <GlassButton
              onClick={() => toast('Export functionality coming soon')}
              icon={<Download size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Export
            </GlassButton>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reconciled</p>
                <p className="text-xl font-bold text-green-600">{summary.totalReconciled}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-xl font-bold text-orange-600">{summary.totalPending}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Discrepancies</p>
                <p className="text-xl font-bold text-red-600">{summary.totalDiscrepancies}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Variance</p>
                <p className={`text-xl font-bold ${summary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(summary.totalVariance)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calculator className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reconciliation Rate</p>
                <p className="text-xl font-bold text-blue-600">{summary.reconciliationRate.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Reconciliation Table */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Reconciliation Records for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <div className="flex gap-2">
              <GlassButton
                onClick={() => toast('Auto-reconcile functionality coming soon')}
                variant="secondary"
                icon={<Settings size={16} />}
              >
                Auto Reconcile
              </GlassButton>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Payment Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Expected</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actual</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Variance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reconciliationData.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 capitalize">
                        {record.method.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{formatMoney(record.expected)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{formatMoney(record.actual)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-medium ${record.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.variance >= 0 ? '+' : ''}{formatMoney(record.variance)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {record.status !== 'reconciled' && (
                          <GlassButton
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowReconcileModal(true);
                            }}
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Reconcile
                          </GlassButton>
                        )}
                        <GlassButton
                          onClick={() => toast('Investigate functionality coming soon')}
                          variant="secondary"
                          size="sm"
                        >
                          Investigate
                        </GlassButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reconciliationData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-lg font-medium mb-2">No reconciliation data found</div>
              <div className="text-sm">Select a different date or check your payment data</div>
            </div>
          )}
        </GlassCard>

        {/* Reconcile Modal */}
        {showReconcileModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Reconciliation</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Method:</p>
                  <p className="font-medium capitalize">{selectedRecord.method.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Variance:</p>
                  <p className={`font-medium ${selectedRecord.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedRecord.variance >= 0 ? '+' : ''}{formatMoney(selectedRecord.variance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Notes:</p>
                  <p className="text-sm text-gray-500">{selectedRecord.notes || 'No notes available'}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <GlassButton
                  onClick={() => {
                    setShowReconcileModal(false);
                    setSelectedRecord(null);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={() => handleReconcile(selectedRecord)}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  Confirm Reconcile
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </PageErrorBoundary>
  );
};

export default PaymentReconciliationPage;
