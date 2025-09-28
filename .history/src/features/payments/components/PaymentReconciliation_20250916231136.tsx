import React, { useState, useEffect } from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  Activity, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Download, Calendar, Filter, Search, TrendingUp, TrendingDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { paymentReconciliationService } from '../../../lib/paymentReconciliationService';

interface ReconciliationResult {
  id: string;
  date: string;
  status: 'success' | 'failed' | 'partial';
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  discrepancies: number;
  totalAmount: number;
  matchedAmount: number;
  discrepancyAmount: number;
  details: string;
}

const PaymentReconciliation: React.FC = () => {
  const [reconciliationResults, setReconciliationResults] = useState<ReconciliationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Mock data for demonstration
  const mockReconciliationData: ReconciliationResult[] = [
    {
      id: '1',
      date: '2024-01-15',
      status: 'success',
      totalTransactions: 150,
      matchedTransactions: 150,
      unmatchedTransactions: 0,
      discrepancies: 0,
      totalAmount: 2500000,
      matchedAmount: 2500000,
      discrepancyAmount: 0,
      details: 'All transactions matched successfully'
    },
    {
      id: '2',
      date: '2024-01-14',
      status: 'partial',
      totalTransactions: 120,
      matchedTransactions: 118,
      unmatchedTransactions: 2,
      discrepancies: 2,
      totalAmount: 1800000,
      matchedAmount: 1795000,
      discrepancyAmount: 5000,
      details: '2 transactions require manual review'
    },
    {
      id: '3',
      date: '2024-01-13',
      status: 'failed',
      totalTransactions: 95,
      matchedTransactions: 90,
      unmatchedTransactions: 5,
      discrepancies: 5,
      totalAmount: 1200000,
      matchedAmount: 1150000,
      discrepancyAmount: 50000,
      details: 'Multiple discrepancies detected - manual intervention required'
    }
  ];

  // Fetch reconciliation data from database
  const fetchReconciliationData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching reconciliation results from database...');
      
      // Fetch reconciliation results from database
      const result = await paymentReconciliationService.getReconciliationResults();
      if (result) {
        setReconciliationResults(result);
        console.log('✅ Reconciliation results loaded:', result.length);
      } else {
        console.warn('Failed to fetch reconciliation results');
        // Keep existing results if fetch fails
      }

    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      toast.error('Failed to load reconciliation data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReconciliationData();
  }, [fetchReconciliationData]);

  const handleRunReconciliation = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call the actual service
      // await paymentReconciliationService.performDailyReconciliation(selectedDate);
      
      toast.success('Reconciliation completed successfully');
      
      // Add new result to the list
      const newResult: ReconciliationResult = {
        id: Date.now().toString(),
        date: selectedDate,
        status: 'success',
        totalTransactions: Math.floor(Math.random() * 200) + 50,
        matchedTransactions: Math.floor(Math.random() * 200) + 50,
        unmatchedTransactions: 0,
        discrepancies: 0,
        totalAmount: Math.floor(Math.random() * 5000000) + 1000000,
        matchedAmount: Math.floor(Math.random() * 5000000) + 1000000,
        discrepancyAmount: 0,
        details: 'All transactions matched successfully'
      };
      
      setReconciliationResults(prev => [newResult, ...prev]);
    } catch (error) {
      console.error('Reconciliation error:', error);
      toast.error('Reconciliation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'partial':
        return 'text-orange-600 bg-orange-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Reconciliation</h3>
          <p className="text-gray-600 mt-1">
            Reconcile payments and identify discrepancies
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <GlassButton
            onClick={handleRunReconciliation}
            icon={<Activity size={18} />}
            loading={isLoading}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
          >
            Run Reconciliation
          </GlassButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-600">
                {reconciliationResults.reduce((sum, result) => sum + result.totalTransactions, 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Matched Transactions</p>
              <p className="text-2xl font-bold text-green-600">
                {reconciliationResults.reduce((sum, result) => sum + result.matchedTransactions, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unmatched</p>
              <p className="text-2xl font-bold text-orange-600">
                {reconciliationResults.reduce((sum, result) => sum + result.unmatchedTransactions, 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discrepancies</p>
              <p className="text-2xl font-bold text-red-600">
                {reconciliationResults.reduce((sum, result) => sum + result.discrepancies, 0)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Reconciliation Results */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Reconciliation History</h4>
          <GlassButton
            icon={<Download size={16} />}
            variant="secondary"
            size="sm"
          >
            Export Report
          </GlassButton>
        </div>

        <div className="space-y-4">
          {reconciliationResults.map((result) => (
            <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(result.status)}`}>
                    {getStatusIcon(result.status)}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">
                      Reconciliation for {new Date(result.date).toLocaleDateString()}
                    </h5>
                    <p className="text-sm text-gray-600">{result.details}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                  <GlassButton
                    onClick={() => setShowDetails(showDetails === result.id ? null : result.id)}
                    variant="secondary"
                    size="sm"
                  >
                    {showDetails === result.id ? 'Hide' : 'Show'} Details
                  </GlassButton>
                </div>
              </div>

              {showDetails === result.id && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold text-blue-600">{formatMoney(result.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Matched Amount</p>
                    <p className="font-semibold text-green-600">{formatMoney(result.matchedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discrepancy Amount</p>
                    <p className="font-semibold text-red-600">{formatMoney(result.discrepancyAmount)}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.totalTransactions}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.matchedTransactions}</p>
                  <p className="text-xs text-gray-600">Matched</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{result.unmatchedTransactions}</p>
                  <p className="text-xs text-gray-600">Unmatched</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{result.discrepancies}</p>
                  <p className="text-xs text-gray-600">Discrepancies</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default PaymentReconciliation;
