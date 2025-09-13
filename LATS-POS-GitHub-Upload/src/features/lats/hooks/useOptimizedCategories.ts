import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types/inventory';
import { categoryService } from '../lib/categoryService';

interface UseOptimizedCategoriesOptions {
  activeOnly?: boolean;
  searchQuery?: string;
  autoFetch?: boolean;
  forceRefresh?: boolean;
}

interface UseOptimizedCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  search: (query: string) => Promise<void>;
  getCategoryById: (id: string) => Category | null;
  getCategoryStats: () => Promise<{
    total: number;
    active: number;
    inactive: number;
    withDescription: number;
    uniqueColors: number;
  }>;
}

export const useOptimizedCategories = (options: UseOptimizedCategoriesOptions = {}): UseOptimizedCategoriesReturn => {
  const { 
    activeOnly = false, 
    searchQuery = '', 
    autoFetch = true,
    forceRefresh = false 
  } = options;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedCategories: Category[];
      
      if (searchQuery) {
        fetchedCategories = await categoryService.searchCategories(searchQuery, refresh);
      } else if (activeOnly) {
        fetchedCategories = await categoryService.getActiveCategories(refresh);
      } else {
        fetchedCategories = await categoryService.getCategories(refresh);
      }
      
      setCategories(fetchedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOnly, searchQuery]);

  const refetch = useCallback(async () => {
    await fetchCategories(true);
  }, [fetchCategories]);

  const search = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await categoryService.searchCategories(query);
      setCategories(searchResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search categories';
      setError(errorMessage);
      console.error('Error searching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoryById = useCallback((id: string): Category | null => {
    return categories.find(cat => cat.id === id) || null;
  }, [categories]);

  const getCategoryStats = useCallback(async () => {
    return await categoryService.getCategoryStats();
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCategories(forceRefresh);
    }
  }, [autoFetch, forceRefresh, fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch,
    search,
    getCategoryById,
    getCategoryStats
  };
};

// Hook for a single category
export const useOptimizedCategory = (categoryId: string | null) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setCategory(null);
      return;
    }

    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedCategory = await categoryService.getCategoryById(categoryId);
        setCategory(fetchedCategory);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category';
        setError(errorMessage);
        console.error('Error fetching category:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  return {
    category,
    loading,
    error
  };
};

// Hook for category statistics
export const useCategoryStats = () => {
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    withDescription: number;
    uniqueColors: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categoryStats = await categoryService.getCategoryStats();
      setStats(categoryStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category stats';
      setError(errorMessage);
      console.error('Error fetching category stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};
