import { useState, useEffect, useMemo, useCallback } from 'react';
import { useInventoryStore } from '../stores/useInventoryStore';

interface UseFastSupplierSearchOptions {
  debounceMs?: number;
  maxResults?: number;
  searchFields?: ('name' | 'contact_person' | 'email' | 'phone')[];
}

interface SearchResult {
  supplier: any;
  score: number;
  matchedField: string;
}

export const useFastSupplierSearch = (options: UseFastSupplierSearchOptions = {}) => {
  const {
    debounceMs = 300,
    maxResults = 50,
    searchFields = ['name', 'contact_person', 'email', 'phone']
  } = options;

  const { suppliers, loadSuppliers } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load suppliers if not already loaded - with debouncing
  useEffect(() => {
    if (suppliers.length === 0) {
      // Add a small delay to prevent multiple rapid calls
      const timer = setTimeout(() => {
        loadSuppliers();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [suppliers.length, loadSuppliers]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Fast search algorithm with scoring
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return suppliers.slice(0, maxResults).map(supplier => ({
        supplier,
        score: 1,
        matchedField: 'name'
      }));
    }

    const query = debouncedQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const supplier of suppliers) {
      let bestScore = 0;
      let matchedField = '';

      // Search in specified fields
      for (const field of searchFields) {
        const value = supplier[field];
        if (!value) continue;

        const fieldValue = String(value).toLowerCase();
        
        // Exact match gets highest score
        if (fieldValue === query) {
          bestScore = 100;
          matchedField = field;
          break;
        }
        
        // Starts with query gets high score
        if (fieldValue.startsWith(query)) {
          const score = 80 + (fieldValue.length - query.length) * 0.5;
          if (score > bestScore) {
            bestScore = score;
            matchedField = field;
          }
        }
        
        // Contains query gets medium score
        if (fieldValue.includes(query)) {
          const score = 50 + (fieldValue.length - query.length) * 0.3;
          if (score > bestScore) {
            bestScore = score;
            matchedField = field;
          }
        }
        
        // Partial word match gets lower score
        const words = fieldValue.split(/\s+/);
        for (const word of words) {
          if (word.startsWith(query)) {
            const score = 30 + (word.length - query.length) * 0.2;
            if (score > bestScore) {
              bestScore = score;
              matchedField = field;
            }
          }
        }
      }

      if (bestScore > 0) {
        results.push({
          supplier,
          score: bestScore,
          matchedField
        });
      }
    }

    // Sort by score (highest first) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }, [suppliers, debouncedQuery, searchFields, maxResults]);

  // Memoized search function for external use
  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Get supplier by ID
  const getSupplierById = useCallback((id: string) => {
    return suppliers.find(s => s.id === id);
  }, [suppliers]);

  // Check if search is active
  const isSearchActive = debouncedQuery.trim().length > 0;

  return {
    searchQuery,
    debouncedQuery,
    searchResults: searchResults.map(r => r.supplier),
    searchResultsWithScore: searchResults,
    isSearching,
    isSearchActive,
    search,
    clearSearch,
    getSupplierById,
    totalSuppliers: suppliers.length,
    hasResults: searchResults.length > 0
  };
};
