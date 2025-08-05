import { useState, useEffect } from 'react';
import { paymentAccountService, PaymentAccount } from '../lib/paymentMethodService';

export const usePaymentAccounts = () => {
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentAccounts();
  }, []);

  const loadPaymentAccounts = async () => {
    setLoading(true);
    try {
      const accounts = await paymentAccountService.getActivePaymentAccounts();
      setPaymentAccounts(accounts);
    } catch (error) {
      console.error('Error loading payment accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPOSPaymentAccounts = async (): Promise<PaymentAccount[]> => {
    try {
      return await paymentAccountService.getPOSPaymentAccounts();
    } catch (error) {
      console.error('Error loading POS payment accounts:', error);
      return [];
    }
  };

  const getFinancePaymentAccounts = async (): Promise<PaymentAccount[]> => {
    try {
      return await paymentAccountService.getFinancePaymentAccounts();
    } catch (error) {
      console.error('Error loading finance payment accounts:', error);
      return [];
    }
  };

  const getPaymentAccountById = async (id: string): Promise<PaymentAccount | null> => {
    try {
      return await paymentAccountService.getPaymentAccountById(id);
    } catch (error) {
      console.error('Error loading payment account by ID:', error);
      return null;
    }
  };

  const getPaymentAccountsByType = async (type: PaymentAccount['type']): Promise<PaymentAccount[]> => {
    try {
      return await paymentAccountService.getPaymentAccountsByType(type);
    } catch (error) {
      console.error('Error loading payment accounts by type:', error);
      return [];
    }
  };

  const createPaymentAccount = async (account: Omit<PaymentAccount, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentAccount | null> => {
    try {
      const newAccount = await paymentAccountService.createPaymentAccount(account);
      if (newAccount) {
        setPaymentAccounts(prev => [...prev, newAccount]);
      }
      return newAccount;
    } catch (error) {
      console.error('Error creating payment account:', error);
      return null;
    }
  };

  const updatePaymentAccount = async (id: string, updates: Partial<PaymentAccount>): Promise<PaymentAccount | null> => {
    try {
      const updatedAccount = await paymentAccountService.updatePaymentAccount(id, updates);
      if (updatedAccount) {
        setPaymentAccounts(prev => prev.map(account => 
          account.id === id ? updatedAccount : account
        ));
      }
      return updatedAccount;
    } catch (error) {
      console.error('Error updating payment account:', error);
      return null;
    }
  };

  const deletePaymentAccount = async (id: string): Promise<boolean> => {
    try {
      const success = await paymentAccountService.deletePaymentAccount(id);
      if (success) {
        setPaymentAccounts(prev => prev.filter(account => account.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting payment account:', error);
      return false;
    }
  };

  const refreshPaymentAccounts = () => {
    loadPaymentAccounts();
  };

  return {
    paymentAccounts,
    loading,
    getPOSPaymentAccounts,
    getFinancePaymentAccounts,
    getPaymentAccountById,
    getPaymentAccountsByType,
    createPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount,
    refreshPaymentAccounts
  };
}; 