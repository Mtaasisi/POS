import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { paymentService, PaymentAnalytics, PaymentInsights, PaymentProvider } from '../services/PaymentService';
import { PaymentTransaction, PaymentMetrics } from '../../../lib/paymentTrackingService';

export interface UsePaymentsReturn {
  // Data
  analytics: PaymentAnalytics | null;
  insights: PaymentInsights | null;
  providers: PaymentProvider[];
  transactions: PaymentTransaction[];
  metrics: PaymentMetrics | null;
  
  // Loading states
  isLoadingAnalytics: boolean;
  isLoadingInsights: boolean;
  isLoadingProviders: boolean;
  isLoadingTransactions: boolean;
  
  // Actions
  refreshAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
  refreshInsights: () => Promise<void>;
  refreshProviders: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  testProvider: (providerId: string) => Promise<{ success: boolean; message: string; responseTime: number }>;
  exportData: (format: 'csv' | 'excel' | 'pdf', filters?: any) => Promise<{ success: boolean; downloadUrl?: string; message: string }>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const usePayments = (): UsePaymentsReturn => {
  // State
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [insights, setInsights] = useState<PaymentInsights | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  
  // Loading states
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh analytics
  const refreshAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoadingAnalytics(true);
    setError(null);
    try {
      const data = await paymentService.getPaymentAnalytics(startDate, endDate);
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Refresh insights
  const refreshInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    setError(null);
    try {
      const data = await paymentService.getPaymentInsights();
      setInsights(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load insights';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingInsights(false);
    }
  }, []);

  // Refresh providers
  const refreshProviders = useCallback(async () => {
    setIsLoadingProviders(true);
    setError(null);
    try {
      const data = await paymentService.getPaymentProviders();
      setProviders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load providers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingProviders(false);
    }
  }, []);

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    setIsLoadingTransactions(true);
    setError(null);
    try {
      // This would use the existing paymentTrackingService
      const { paymentTrackingService } = await import('../../../lib/paymentTrackingService');
      const data = await paymentTrackingService.fetchPaymentTransactions();
      setTransactions(data);
      
      // Also get metrics
      const metricsData = await paymentTrackingService.calculatePaymentMetrics();
      setMetrics(metricsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  // Test provider
  const testProvider = useCallback(async (providerId: string) => {
    setError(null);
    try {
      const result = await paymentService.testPaymentProvider(providerId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test provider';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, message: errorMessage, responseTime: 0 };
    }
  }, []);

  // Export data
  const exportData = useCallback(async (format: 'csv' | 'excel' | 'pdf', filters?: any) => {
    setError(null);
    try {
      const result = await paymentService.exportPaymentData(format, filters);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        refreshAnalytics(),
        refreshInsights(),
        refreshProviders(),
        refreshTransactions()
      ]);
    };

    loadInitialData();
  }, [refreshAnalytics, refreshInsights, refreshProviders, refreshTransactions]);

  return {
    // Data
    analytics,
    insights,
    providers,
    transactions,
    metrics,
    
    // Loading states
    isLoadingAnalytics,
    isLoadingInsights,
    isLoadingProviders,
    isLoadingTransactions,
    
    // Actions
    refreshAnalytics,
    refreshInsights,
    refreshProviders,
    refreshTransactions,
    testProvider,
    exportData,
    
    // Error handling
    error,
    clearError
  };
};
