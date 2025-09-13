import { useState, useEffect, useCallback } from 'react';
import { AnalyticsService, InventoryAnalytics, SalesAnalytics, CustomerAnalytics } from '../lib/analyticsService';

interface AnalyticsData {
  inventory: InventoryAnalytics;
  sales: SalesAnalytics;
  customers: CustomerAnalytics;
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshSales: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await AnalyticsService.getAllAnalytics();
      setData(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    try {
      setError(null);
      const inventoryData = await AnalyticsService.getInventoryAnalytics();
      setData(prev => prev ? { ...prev, inventory: inventoryData } : null);
    } catch (err) {
      console.error('Error refreshing inventory analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh inventory analytics');
    }
  }, []);

  const refreshSales = useCallback(async () => {
    try {
      setError(null);
      const salesData = await AnalyticsService.getSalesAnalytics();
      setData(prev => prev ? { ...prev, sales: salesData } : null);
    } catch (err) {
      console.error('Error refreshing sales analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh sales analytics');
    }
  }, []);

  const refreshCustomers = useCallback(async () => {
    try {
      setError(null);
      const customersData = await AnalyticsService.getCustomerAnalytics();
      setData(prev => prev ? { ...prev, customers: customersData } : null);
    } catch (err) {
      console.error('Error refreshing customer analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh customer analytics');
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    refreshInventory,
    refreshSales,
    refreshCustomers
  };
};

// Individual hooks for specific analytics
export const useInventoryAnalytics = () => {
  const [data, setData] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const inventoryData = await AnalyticsService.getInventoryAnalytics();
      setData(inventoryData);
    } catch (err) {
      console.error('Error fetching inventory analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};

export const useSalesAnalytics = () => {
  const [data, setData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const salesData = await AnalyticsService.getSalesAnalytics();
      setData(salesData);
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sales analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};

export const useCustomerAnalytics = () => {
  const [data, setData] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const customersData = await AnalyticsService.getCustomerAnalytics();
      setData(customersData);
    } catch (err) {
      console.error('Error fetching customer analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customer analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};
