import { useState, useEffect, useCallback } from 'react';
import financialService, { 
  FinancialAnalytics, 
  FinancialSummary, 
  PaymentData, 
  ExpenseData, 
  AccountData, 
  TransferData,
  RevenueData,
  FinancialTrends
} from '../lib/financialService';

interface UseFinancialDataReturn {
  // Data
  financialData: FinancialAnalytics | null;
  summary: FinancialSummary | null;
  payments: PaymentData[];
  expenses: ExpenseData[];
  accounts: AccountData[];
  transfers: TransferData[];
  revenue: RevenueData | null;
  trends: FinancialTrends | null;
  
  // Loading states
  loading: boolean;
  paymentsLoading: boolean;
  expensesLoading: boolean;
  accountsLoading: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  getDataForPeriod: (startDate: string, endDate: string) => Promise<FinancialAnalytics | null>;
  exportData: (format?: 'csv' | 'json') => Promise<string>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useFinancialData = (): UseFinancialDataReturn => {
  const [financialData, setFinancialData] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comprehensive financial data
  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await financialService.getComprehensiveFinancialData();
      setFinancialData(data);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await fetchFinancialData();
  }, [fetchFinancialData]);

  // Refresh payments only
  const refreshPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const payments = await financialService.getPayments();
      setFinancialData(prev => prev ? { ...prev, payments } : null);
    } catch (err) {
      console.error('Error refreshing payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh payments');
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  // Refresh expenses only
  const refreshExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const expenses = await financialService.getExpenses();
      setFinancialData(prev => prev ? { ...prev, expenses } : null);
    } catch (err) {
      console.error('Error refreshing expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh expenses');
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  // Refresh accounts only
  const refreshAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const accounts = await financialService.getAccounts();
      setFinancialData(prev => prev ? { ...prev, accounts } : null);
    } catch (err) {
      console.error('Error refreshing accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh accounts');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  // Get data for specific period
  const getDataForPeriod = useCallback(async (startDate: string, endDate: string) => {
    try {
      const data = await financialService.getFinancialDataForPeriod(startDate, endDate);
      return data;
    } catch (err) {
      console.error('Error fetching period data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch period data');
      return null;
    }
  }, []);

  // Export data
  const exportData = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      return await financialService.exportFinancialData(format);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err instanceof Error ? err.message : 'Failed to export data');
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return {
    // Data
    financialData,
    summary: financialData?.summary || null,
    payments: financialData?.payments || [],
    expenses: financialData?.expenses || [],
    accounts: financialData?.accounts || [],
    transfers: financialData?.transfers || [],
    revenue: financialData?.revenue || null,
    trends: financialData?.trends || null,
    
    // Loading states
    loading,
    paymentsLoading,
    expensesLoading,
    accountsLoading,
    
    // Actions
    refreshData,
    refreshPayments,
    refreshExpenses,
    refreshAccounts,
    getDataForPeriod,
    exportData,
    
    // Error handling
    error,
    clearError
  };
};

export default useFinancialData; 