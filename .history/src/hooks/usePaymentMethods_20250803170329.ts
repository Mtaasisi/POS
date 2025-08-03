import { useState, useEffect, useCallback } from 'react';
import { paymentMethodService, PaymentMethod, PaymentMethodWithAccounts } from '../lib/paymentMethodService';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsWithAccounts, setPaymentMethodsWithAccounts] = useState<PaymentMethodWithAccounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await paymentMethodService.getActivePaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError('Failed to fetch payment methods');
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch payment methods with accounts
  const fetchPaymentMethodsWithAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await paymentMethodService.getPaymentMethodsWithAccounts();
      setPaymentMethodsWithAccounts(methods);
    } catch (err) {
      setError('Failed to fetch payment methods with accounts');
      console.error('Error fetching payment methods with accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get payment methods by type
  const getPaymentMethodsByType = useCallback(async (type: PaymentMethod['type']) => {
    try {
      return await paymentMethodService.getPaymentMethodsByType(type);
    } catch (err) {
      console.error('Error fetching payment methods by type:', err);
      return [];
    }
  }, []);

  // Get payment method by code
  const getPaymentMethodByCode = useCallback(async (code: string) => {
    try {
      return await paymentMethodService.getPaymentMethodByCode(code);
    } catch (err) {
      console.error('Error fetching payment method by code:', err);
      return null;
    }
  }, []);

  // Get payment method by ID
  const getPaymentMethodById = useCallback(async (id: string) => {
    try {
      return await paymentMethodService.getPaymentMethodById(id);
    } catch (err) {
      console.error('Error fetching payment method by ID:', err);
      return null;
    }
  }, []);

  // Get POS-specific payment methods
  const getPOSPaymentMethods = useCallback(async () => {
    try {
      return await paymentMethodService.getPOSPaymentMethods();
    } catch (err) {
      console.error('Error fetching POS payment methods:', err);
      return [];
    }
  }, []);

  // Get Finance-specific payment methods
  const getFinancePaymentMethods = useCallback(async () => {
    try {
      return await paymentMethodService.getFinancePaymentMethods();
    } catch (err) {
      console.error('Error fetching finance payment methods:', err);
      return [];
    }
  }, []);

  // Link payment method to account
  const linkPaymentMethodToAccount = useCallback(async (
    paymentMethodId: string, 
    accountId: string, 
    isDefault: boolean = false
  ) => {
    try {
      const success = await paymentMethodService.linkPaymentMethodToAccount(paymentMethodId, accountId, isDefault);
      if (success) {
        // Refresh the payment methods with accounts
        await fetchPaymentMethodsWithAccounts();
      }
      return success;
    } catch (err) {
      console.error('Error linking payment method to account:', err);
      return false;
    }
  }, [fetchPaymentMethodsWithAccounts]);

  // Unlink payment method from account
  const unlinkPaymentMethodFromAccount = useCallback(async (paymentMethodId: string, accountId: string) => {
    try {
      const success = await paymentMethodService.unlinkPaymentMethodFromAccount(paymentMethodId, accountId);
      if (success) {
        // Refresh the payment methods with accounts
        await fetchPaymentMethodsWithAccounts();
      }
      return success;
    } catch (err) {
      console.error('Error unlinking payment method from account:', err);
      return false;
    }
  }, [fetchPaymentMethodsWithAccounts]);

  // Set default account for payment method
  const setDefaultAccountForPaymentMethod = useCallback(async (paymentMethodId: string, accountId: string) => {
    try {
      const success = await paymentMethodService.setDefaultAccountForPaymentMethod(paymentMethodId, accountId);
      if (success) {
        // Refresh the payment methods with accounts
        await fetchPaymentMethodsWithAccounts();
      }
      return success;
    } catch (err) {
      console.error('Error setting default account for payment method:', err);
      return false;
    }
  }, [fetchPaymentMethodsWithAccounts]);

  // Create new payment method
  const createPaymentMethod = useCallback(async (paymentMethod: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newMethod = await paymentMethodService.createPaymentMethod(paymentMethod);
      if (newMethod) {
        // Refresh the payment methods
        await fetchPaymentMethods();
        await fetchPaymentMethodsWithAccounts();
      }
      return newMethod;
    } catch (err) {
      console.error('Error creating payment method:', err);
      return null;
    }
  }, [fetchPaymentMethods, fetchPaymentMethodsWithAccounts]);

  // Update payment method
  const updatePaymentMethod = useCallback(async (id: string, updates: Partial<PaymentMethod>) => {
    try {
      const updatedMethod = await paymentMethodService.updatePaymentMethod(id, updates);
      if (updatedMethod) {
        // Refresh the payment methods
        await fetchPaymentMethods();
        await fetchPaymentMethodsWithAccounts();
      }
      return updatedMethod;
    } catch (err) {
      console.error('Error updating payment method:', err);
      return null;
    }
  }, [fetchPaymentMethods, fetchPaymentMethodsWithAccounts]);

  // Delete payment method
  const deletePaymentMethod = useCallback(async (id: string) => {
    try {
      const success = await paymentMethodService.deletePaymentMethod(id);
      if (success) {
        // Refresh the payment methods
        await fetchPaymentMethods();
        await fetchPaymentMethodsWithAccounts();
      }
      return success;
    } catch (err) {
      console.error('Error deleting payment method:', err);
      return false;
    }
  }, [fetchPaymentMethods, fetchPaymentMethodsWithAccounts]);

  // Get payment method statistics
  const getPaymentMethodStats = useCallback(async () => {
    try {
      return await paymentMethodService.getPaymentMethodStats();
    } catch (err) {
      console.error('Error fetching payment method stats:', err);
      return { total: 0, active: 0, byType: {} };
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchPaymentMethods();
    fetchPaymentMethodsWithAccounts();
  }, [fetchPaymentMethods, fetchPaymentMethodsWithAccounts]);

  return {
    // State
    paymentMethods,
    paymentMethodsWithAccounts,
    loading,
    error,
    
    // Actions
    fetchPaymentMethods,
    fetchPaymentMethodsWithAccounts,
    getPaymentMethodsByType,
    getPaymentMethodByCode,
    getPaymentMethodById,
    getPOSPaymentMethods,
    getFinancePaymentMethods,
    linkPaymentMethodToAccount,
    unlinkPaymentMethodFromAccount,
    setDefaultAccountForPaymentMethod,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getPaymentMethodStats,
  };
}; 