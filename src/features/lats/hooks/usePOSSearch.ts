import { useState, useCallback, useMemo, useEffect } from 'react';
import { useInventoryStore } from '../stores/useInventoryStore';

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const usePOSSearch = () => {
  const { products: dbProducts, categories, getSoldQuantity } = useInventoryStore();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent' | 'sales'>('sales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Debounced search for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Transform products with additional data
  const products = useMemo(() => {
    return dbProducts.map(product => ({
      ...product,
      categoryName: categories.find(c => c.id === product.categoryId)?.name || 'Unknown Category',
      brandName: product.brand?.name || undefined,
      images: product.images || []
    }));
  }, [dbProducts, categories, brands]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Basic search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const category = categories.find(c => c.id === product.categoryId)?.name || '';
        const brand = product.brand?.name || '';
        
        return (product.name?.toLowerCase() || '').includes(query) ||
               (mainVariant?.sku?.toLowerCase() || '').includes(query) ||
               (brand.toLowerCase() || '').includes(query) ||
               (category.toLowerCase() || '').includes(query);
      });
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }
    

    
    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const price = mainVariant?.sellingPrice || 0;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }
    
    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const mainVariant = product.variants?.[0];
        const stock = mainVariant?.quantity || 0;
        
        switch (stockFilter) {
          case 'in-stock':
            return stock > 10;
          case 'low-stock':
            return stock > 0 && stock <= 10;
          case 'out-of-stock':
            return stock === 0;
          default:
            return true;
        }
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'price':
          aValue = a.variants?.[0]?.sellingPrice || 0;
          bValue = b.variants?.[0]?.sellingPrice || 0;
          break;
        case 'stock':
          aValue = a.variants?.[0]?.quantity || 0;
          bValue = b.variants?.[0]?.quantity || 0;
          break;
        case 'recent':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        case 'sales':
          // Calculate total sold quantity for all variants of each product
          const aSoldQuantity = a.variants?.reduce((sum, variant) => {
            return sum + getSoldQuantity(a.id, variant.id);
          }, 0) || 0;
          const bSoldQuantity = b.variants?.reduce((sum, variant) => {
            return sum + getSoldQuantity(b.id, variant.id);
          }, 0) || 0;
          aValue = aSoldQuantity;
          bValue = bSoldQuantity;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [products, categories, brands, debouncedSearchQuery, selectedCategory, selectedBrand, priceRange, stockFilter, sortBy, sortOrder, getSoldQuantity]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / itemsPerPage);
  }, [filteredProducts.length, itemsPerPage]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange({ min: '', max: '' });
    setStockFilter('all');
    setSortBy('sales');
    setSortOrder('desc');
    setCurrentPage(1);
  }, []);

  // Toggle advanced filters
  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters(prev => !prev);
  }, []);

  return {
    // State
    searchQuery,
    selectedCategory,
    selectedBrand,
    priceRange,
    stockFilter,
    sortBy,
    sortOrder,
    showAdvancedFilters,
    currentPage,
    totalPages,
    itemsPerPage,
    
    // Data
    products,
    filteredProducts,
    paginatedProducts,
    
    // Actions
    setSearchQuery,
    setSelectedCategory,
    setSelectedBrand,
    setPriceRange,
    setStockFilter,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    resetFilters,
    toggleAdvancedFilters
  };
};
