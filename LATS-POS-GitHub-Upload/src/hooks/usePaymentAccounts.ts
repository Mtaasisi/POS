import { useState, useEffect } from 'react';
import { financeAccountService, FinanceAccount } from '../lib/financeAccountService';

export const usePaymentAccounts = () => {
  const [paymentAccounts, setPaymentAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentAccounts();
  }, []);

  const loadPaymentAccounts = async () => {
    setLoading(true);
    try {
      const accounts = await financeAccountService.getPaymentMethods();
      setPaymentAccounts(accounts);
    } catch (error) {
      console.error('Error loading payment accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPOSPaymentAccounts = async (): Promise<FinanceAccount[]> => {
    try {
      return await financeAccountService.getPOSPaymentMethods();
    } catch (error) {
      console.error('Error loading POS payment accounts:', error);
      return [];
    }
  };

  const getFinancePaymentAccounts = async (): Promise<FinanceAccount[]> => {
    try {
      return await financeAccountService.getFinancePaymentMethods();
    } catch (error) {
      console.error('Error loading finance payment accounts:', error);
      return [];
    }
  };

  const getPaymentAccountById = async (id: string): Promise<FinanceAccount | null> => {
    try {
      return await financeAccountService.getFinanceAccountById(id);
    } catch (error) {
      console.error('Error loading payment account by ID:', error);
      return null;
    }
  };

  const getPaymentAccountsByType = async (type: FinanceAccount['type']): Promise<FinanceAccount[]> => {
    try {
      return await financeAccountService.getFinanceAccountsByType(type);
    } catch (error) {
      console.error('Error loading payment accounts by type:', error);
      return [];
    }
  };

  const createPaymentAccount = async (account: Omit<FinanceAccount, 'id' | 'created_at' | 'updated_at'>): Promise<FinanceAccount | null> => {
    try {
      const newAccount = await financeAccountService.createFinanceAccount(account);
      if (newAccount) {
        setPaymentAccounts(prev => [...prev, newAccount]);
      }
      return newAccount;
    } catch (error) {
      console.error('Error creating payment account:', error);
      return null;
    }
  };

  const updatePaymentAccount = async (id: string, updates: Partial<FinanceAccount>): Promise<FinanceAccount | null> => {
    try {
      const updatedAccount = await financeAccountService.updateFinanceAccount(id, updates);
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
      const success = await financeAccountService.deleteFinanceAccount(id);
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