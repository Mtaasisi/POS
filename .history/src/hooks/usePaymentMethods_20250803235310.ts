import { useState, useEffect, useCallback } from 'react';
import { financeAccountService, FinanceAccount } from '../lib/financeAccountService';
import { toast } from 'react-hot-toast';

// Finance accounts are now used directly as payment methods
export type PaymentMethod = FinanceAccount;

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all payment methods (finance accounts with is_payment_method = true)
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await financeAccountService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError('Failed to fetch payment methods');
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get payment methods by type
  const getPaymentMethodsByType = useCallback(async (type: FinanceAccount['type']) => {
    try {
      return await financeAccountService.getFinanceAccountsByType(type);
    } catch (err) {
      console.error('Error fetching payment methods by type:', err);
      return [];
    }
  }, []);

  // Get payment method by ID
  const getPaymentMethodById = useCallback(async (id: string) => {
    try {
      return await financeAccountService.getFinanceAccountById(id);
    } catch (err) {
      console.error('Error fetching payment method by ID:', err);
      return null;
    }
  }, []);

  // Get POS-specific payment methods (cash, mobile money, cards)
  const getPOSPaymentMethods = useCallback(async () => {
    try {
      return await financeAccountService.getPOSPaymentMethods();
    } catch (err) {
      console.error('Error fetching POS payment methods:', err);
      return [];
    }
  }, []);

  // Get Finance-specific payment methods (bank, savings, investment)
  const getFinancePaymentMethods = useCallback(async () => {
    try {
      return await financeAccountService.getFinancePaymentMethods();
    } catch (err) {
      console.error('Error fetching finance payment methods:', err);
      return [];
    }
  }, []);

  // Get default payment method
  const getDefaultPaymentMethod = useCallback(async () => {
    try {
      return await financeAccountService.getDefaultPaymentMethod();
    } catch (err) {
      console.error('Error fetching default payment method:', err);
      return null;
    }
  }, []);

  // Create new payment method (finance account)
  const createPaymentMethod = useCallback(async (paymentMethod: Omit<FinanceAccount, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newMethod = await financeAccountService.createFinanceAccount(paymentMethod);
      if (newMethod) {
        // Refresh the payment methods list
        await fetchPaymentMethods();
        toast.success('Payment method created successfully');
        return newMethod;
      } else {
        toast.error('Failed to create payment method');
        return null;
      }
    } catch (err) {
      console.error('Error creating payment method:', err);
      toast.error('Failed to create payment method');
      return null;
    }
  }, [fetchPaymentMethods]);

  // Update payment method
  const updatePaymentMethod = useCallback(async (id: string, updates: Partial<FinanceAccount>) => {
    try {
      const updatedMethod = await financeAccountService.updateFinanceAccount(id, updates);
      if (updatedMethod) {
        // Refresh the payment methods list
        await fetchPaymentMethods();
        toast.success('Payment method updated successfully');
        return updatedMethod;
      } else {
        toast.error('Failed to update payment method');
        return null;
      }
    } catch (err) {
      console.error('Error updating payment method:', err);
      toast.error('Failed to update payment method');
      return null;
    }
  }, [fetchPaymentMethods]);

  // Delete payment method
  const deletePaymentMethod = useCallback(async (id: string) => {
    try {
      const success = await financeAccountService.deleteFinanceAccount(id);
      if (success) {
        // Refresh the payment methods list
        await fetchPaymentMethods();
        toast.success('Payment method deleted successfully');
        return true;
      } else {
        toast.error('Failed to delete payment method');
        return false;
      }
    } catch (err) {
      console.error('Error deleting payment method:', err);
      toast.error('Failed to delete payment method');
      return false;
    }
  }, [fetchPaymentMethods]);

  // Get payment method stats
  const getPaymentMethodStats = useCallback(async () => {
    try {
      return await financeAccountService.getFinanceAccountStats();
    } catch (err) {
      console.error('Error fetching payment method stats:', err);
      return {
        total: 0,
        byType: {},
        active: 0,
        totalBalance: 0,
        paymentMethods: 0
      };
    }
  }, []);

  // Initialize payment methods on mount
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    getPaymentMethodsByType,
    getPaymentMethodById,
    getPOSPaymentMethods,
    getFinancePaymentMethods,
    getDefaultPaymentMethod,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getPaymentMethodStats
  };
}; 