import { useState, useCallback } from 'react';
import { repairPaymentService, RepairPayment, CreateRepairPaymentData } from '../lib/repairPaymentService';
import { useAuth } from '../context/AuthContext';

export const useRepairPayments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new repair payment
  const createRepairPayment = useCallback(async (data: CreateRepairPaymentData): Promise<RepairPayment | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const payment = await repairPaymentService.createRepairPayment(data, user.id);
      return payment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create repair payment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get repair payments for a customer
  const getCustomerRepairPayments = useCallback(async (customerId: string): Promise<RepairPayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const payments = await repairPaymentService.getCustomerRepairPayments(customerId);
      return payments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer repair payments';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get repair payments for a device
  const getDeviceRepairPayments = useCallback(async (deviceId: string): Promise<RepairPayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const payments = await repairPaymentService.getDeviceRepairPayments(deviceId);
      return payments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch device repair payments';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all repair payments
  const getAllRepairPayments = useCallback(async (limit = 100): Promise<RepairPayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const payments = await repairPaymentService.getAllRepairPayments(limit);
      return payments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch repair payments';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get repair payment statistics
  const getRepairPaymentStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const stats = await repairPaymentService.getRepairPaymentStats();
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch repair payment statistics';
      setError(errorMessage);
      return {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        paymentsByStatus: {},
        paymentsByMethod: {}
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createRepairPayment,
    getCustomerRepairPayments,
    getDeviceRepairPayments,
    getAllRepairPayments,
    getRepairPaymentStats,
    clearError
  };
};
