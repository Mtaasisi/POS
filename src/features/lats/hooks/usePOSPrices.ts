import { useState, useEffect, useCallback } from 'react';
import { posPriceService, POSPriceData } from '../lib/posPriceService';

export interface UsePOSPricesReturn {
  // Price data
  prices: POSPriceData[];
  priceMap: { [productId: string]: POSPriceData[] };
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  fetchPrices: (productIds: string[]) => Promise<void>;
  fetchPriceBySKU: (sku: string) => Promise<POSPriceData | null>;
  fetchPriceByBarcode: (barcode: string) => Promise<POSPriceData | null>;
  preloadPrices: (productIds: string[]) => Promise<void>;
  clearCache: () => void;
  
  // Utilities
  getPriceForProduct: (productId: string) => POSPriceData[];
  getPriceBySKU: (sku: string) => POSPriceData | null;
  getPriceByBarcode: (barcode: string) => POSPriceData | null;
  getLowestPrice: (productId: string) => number;
  getHighestPrice: (productId: string) => number;
  getPriceRange: (productId: string) => { min: number; max: number };
  
  // Cache info
  cacheStats: { size: number; timestamp: number; age: number };
}

export const usePOSPrices = (): UsePOSPricesReturn => {
  const [prices, setPrices] = useState<POSPriceData[]>([]);
  const [priceMap, setPriceMap] = useState<{ [productId: string]: POSPriceData[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update price map when prices change
  useEffect(() => {
    const newPriceMap: { [productId: string]: POSPriceData[] } = {};
    prices.forEach(price => {
      if (!newPriceMap[price.productId]) {
        newPriceMap[price.productId] = [];
      }
      newPriceMap[price.productId].push(price);
    });
    setPriceMap(newPriceMap);
  }, [prices]);

  // Fetch prices for multiple products
  const fetchPrices = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return;
    
    setIsFetching(true);
    setError(null);
    
    try {
      const fetchedPrices = await posPriceService.fetchPricesForProducts(productIds);
      setPrices(prev => {
        // Merge with existing prices, avoiding duplicates
        const existingMap = new Map(prev.map(p => `${p.productId}-${p.variantId}`));
        const newPrices = fetchedPrices.filter(p => !existingMap.has(`${p.productId}-${p.variantId}`));
        return [...prev, ...newPrices];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Fetch price by SKU
  const fetchPriceBySKU = useCallback(async (sku: string): Promise<POSPriceData | null> => {
    setIsFetching(true);
    setError(null);
    
    try {
      const priceData = await posPriceService.fetchPriceBySKU(sku);
      if (priceData) {
        setPrices(prev => {
          const existingIndex = prev.findIndex(p => p.variantId === priceData.variantId);
          if (existingIndex >= 0) {
            // Update existing price
            const updated = [...prev];
            updated[existingIndex] = priceData;
            return updated;
          } else {
            // Add new price
            return [...prev, priceData];
          }
        });
      }
      return priceData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price by SKU');
      return null;
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Fetch price by barcode
  const fetchPriceByBarcode = useCallback(async (barcode: string): Promise<POSPriceData | null> => {
    setIsFetching(true);
    setError(null);
    
    try {
      const priceData = await posPriceService.fetchPriceByBarcode(barcode);
      if (priceData) {
        setPrices(prev => {
          const existingIndex = prev.findIndex(p => p.variantId === priceData.variantId);
          if (existingIndex >= 0) {
            // Update existing price
            const updated = [...prev];
            updated[existingIndex] = priceData;
            return updated;
          } else {
            // Add new price
            return [...prev, priceData];
          }
        });
      }
      return priceData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price by barcode');
      return null;
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Preload prices
  const preloadPrices = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await posPriceService.preloadPrices(productIds);
      // Refresh prices from cache
      const fetchedPrices = await posPriceService.fetchPricesForProducts(productIds);
      setPrices(prev => {
        // Merge with existing prices, avoiding duplicates
        const existingMap = new Map(prev.map(p => `${p.productId}-${p.variantId}`));
        const newPrices = fetchedPrices.filter(p => !existingMap.has(`${p.productId}-${p.variantId}`));
        return [...prev, ...newPrices];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preload prices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    posPriceService.clearCache();
    setPrices([]);
    setPriceMap({});
    setError(null);
  }, []);

  // Utility functions
  const getPriceForProduct = useCallback((productId: string): POSPriceData[] => {
    return priceMap[productId] || [];
  }, [priceMap]);

  const getPriceBySKU = useCallback((sku: string): POSPriceData | null => {
    return prices.find(p => p.sku === sku) || null;
  }, [prices]);

  const getPriceByBarcode = useCallback((barcode: string): POSPriceData | null => {
    return prices.find(p => p.barcode === barcode) || null;
  }, [prices]);

  const getLowestPrice = useCallback((productId: string): number => {
    const productPrices = priceMap[productId] || [];
    if (productPrices.length === 0) return 0;
    return Math.min(...productPrices.map(p => p.sellingPrice));
  }, [priceMap]);

  const getHighestPrice = useCallback((productId: string): number => {
    const productPrices = priceMap[productId] || [];
    if (productPrices.length === 0) return 0;
    return Math.max(...productPrices.map(p => p.sellingPrice));
  }, [priceMap]);

  const getPriceRange = useCallback((productId: string): { min: number; max: number } => {
    const productPrices = priceMap[productId] || [];
    if (productPrices.length === 0) return { min: 0, max: 0 };
    
    const prices = productPrices.map(p => p.sellingPrice);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [priceMap]);

  // Get cache stats
  const cacheStats = posPriceService.getCacheStats();

  return {
    // Price data
    prices,
    priceMap,
    
    // Loading states
    isLoading,
    isFetching,
    
    // Error handling
    error,
    
    // Actions
    fetchPrices,
    fetchPriceBySKU,
    fetchPriceByBarcode,
    preloadPrices,
    clearCache,
    
    // Utilities
    getPriceForProduct,
    getPriceBySKU,
    getPriceByBarcode,
    getLowestPrice,
    getHighestPrice,
    getPriceRange,
    
    // Cache info
    cacheStats
  };
};
