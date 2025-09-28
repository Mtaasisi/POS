import { useState, useEffect, useCallback } from 'react';
import { 
  devicePriceHistoryService, 
  DevicePriceHistoryEntry, 
  PriceHistoryFilters, 
  PriceHistoryStats 
} from '../services/devicePriceHistoryService';

interface UseDevicePriceHistoryOptions {
  deviceId: string;
  autoLoad?: boolean;
  initialFilters?: PriceHistoryFilters;
}

interface UseDevicePriceHistoryReturn {
  priceHistory: DevicePriceHistoryEntry[];
  stats: PriceHistoryStats | null;
  isLoading: boolean;
  error: string | null;
  filters: PriceHistoryFilters;
  setFilters: (filters: PriceHistoryFilters) => void;
  loadPriceHistory: () => Promise<void>;
  loadStats: () => Promise<void>;
  logPriceChange: (
    oldPrice: number,
    newPrice: number,
    reason: string,
    changeType?: DevicePriceHistoryEntry['change_type'],
    metadata?: any
  ) => Promise<void>;
  exportHistory: () => Promise<string>;
  refresh: () => Promise<void>;
}

export const useDevicePriceHistory = ({
  deviceId,
  autoLoad = true,
  initialFilters = {}
}: UseDevicePriceHistoryOptions): UseDevicePriceHistoryReturn => {
  const [priceHistory, setPriceHistory] = useState<DevicePriceHistoryEntry[]>([]);
  const [stats, setStats] = useState<PriceHistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PriceHistoryFilters>(initialFilters);

  const loadPriceHistory = useCallback(async () => {
    if (!deviceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await devicePriceHistoryService.getDevicePriceHistory(deviceId, filters);
      setPriceHistory(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load price history';
      setError(errorMessage);
      console.error('Error loading price history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, filters]);

  const loadStats = useCallback(async () => {
    if (!deviceId) return;
    
    try {
      const data = await devicePriceHistoryService.getDevicePriceHistoryStats(deviceId);
      setStats(data);
    } catch (err) {
      console.error('Error loading price history stats:', err);
    }
  }, [deviceId]);

  const logPriceChange = useCallback(async (
    oldPrice: number,
    newPrice: number,
    reason: string,
    changeType: DevicePriceHistoryEntry['change_type'] = 'manual',
    metadata: any = {}
  ) => {
    if (!deviceId) return;
    
    try {
      await devicePriceHistoryService.logPriceChange(
        deviceId,
        oldPrice,
        newPrice,
        reason,
        changeType,
        metadata
      );
      
      // Refresh the data after logging
      await Promise.all([loadPriceHistory(), loadStats()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log price change';
      setError(errorMessage);
      throw err;
    }
  }, [deviceId, loadPriceHistory, loadStats]);

  const exportHistory = useCallback(async (): Promise<string> => {
    if (!deviceId) throw new Error('Device ID is required');
    
    try {
      return await devicePriceHistoryService.exportPriceHistory(deviceId, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export price history';
      setError(errorMessage);
      throw err;
    }
  }, [deviceId, filters]);

  const refresh = useCallback(async () => {
    await Promise.all([loadPriceHistory(), loadStats()]);
  }, [loadPriceHistory, loadStats]);

  // Auto-load when deviceId or filters change
  useEffect(() => {
    if (autoLoad && deviceId) {
      loadPriceHistory();
      loadStats();
    }
  }, [autoLoad, deviceId, loadPriceHistory, loadStats]);

  // Reload when filters change
  useEffect(() => {
    if (deviceId) {
      loadPriceHistory();
    }
  }, [filters, loadPriceHistory]);

  return {
    priceHistory,
    stats,
    isLoading,
    error,
    filters,
    setFilters,
    loadPriceHistory,
    loadStats,
    logPriceChange,
    exportHistory,
    refresh
  };
};
