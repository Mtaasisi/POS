import { useState, useEffect } from 'react';
import { Category, getCategories, getActiveCategories, searchCategories } from '../lib/categoryApi';

interface UseCategoriesOptions {
  activeOnly?: boolean;
  searchQuery?: string;
  autoFetch?: boolean;
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  search: (query: string) => Promise<void>;
}

export const useCategories = (options: UseCategoriesOptions = {}): UseCategoriesReturn => {
  const { activeOnly = true, searchQuery = '', autoFetch = true } = options;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedCategories: Category[];
      
      if (searchQuery) {
        fetchedCategories = await searchCategories(searchQuery);
      } else if (activeOnly) {
        fetchedCategories = await getActiveCategories();
      } else {
        fetchedCategories = await getCategories();
      }
      
      setCategories(fetchedCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchCategories();
  };

  const search = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await searchCategories(query);
      setCategories(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search categories');
      console.error('Error searching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [activeOnly, searchQuery, autoFetch]);

  return {
    categories,
    loading,
    error,
    refetch,
    search
  };
};

// Hook for a single category
export const useCategory = (categoryId: string | null) => {
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
        
        const { getCategoryById } = await import('../lib/categoryApi');
        const fetchedCategory = await getCategoryById(categoryId);
        setCategory(fetchedCategory);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category');
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