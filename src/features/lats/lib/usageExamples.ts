/**
 * Usage Examples for fetchAllProducts
 * This file demonstrates various ways to use the fetchAllProducts functionality
 */

import { fetchAllProducts, fetchAllProductsCount, fetchProductsByCategory } from './fetchAllProducts';
import { Product } from '../types/inventory';

// Example 1: Basic usage in a React component
export const basicUsageExample = `
import React, { useState, useEffect } from 'react';
import { fetchAllProducts } from '../lib/fetchAllProducts';

const MyComponent = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await fetchAllProducts();
      if (result.ok) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div>
      {loading ? 'Loading...' : \`Loaded \${products.length} products\`}
    </div>
  );
};
`;

// Example 2: Using with error handling and toast notifications
export const errorHandlingExample = `
import { toast } from 'react-hot-toast';
import { fetchAllProducts } from '../lib/fetchAllProducts';

const loadProductsWithToast = async () => {
  try {
    const result = await fetchAllProducts();
    
    if (result.ok && result.data) {
      toast.success(\`Successfully loaded \${result.data.length} products!\`);
      return result.data;
    } else {
      toast.error(result.message || 'Failed to load products');
      return [];
    }
  } catch (error) {
    toast.error('Network error occurred');
    console.error('Error:', error);
    return [];
  }
};
`;

// Example 3: Using in a service or utility function
export const serviceUsageExample = `
import { fetchAllProducts, fetchAllProductsCount } from '../lib/fetchAllProducts';

export class ProductService {
  private static productsCache: Product[] | null = null;
  private static lastFetchTime: number = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getAllProducts(forceRefresh = false): Promise<Product[]> {
    const now = Date.now();
    
    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && this.productsCache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.productsCache;
    }

    try {
      const result = await fetchAllProducts();
      
      if (result.ok && result.data) {
        this.productsCache = result.data;
        this.lastFetchTime = now;
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('ProductService error:', error);
      // Return cached data if available, even if stale
      return this.productsCache || [];
    }
  }

  static async getProductStats() {
    try {
      const result = await fetchAllProductsCount();
      return result.ok ? result.data : null;
    } catch (error) {
      console.error('Error getting product stats:', error);
      return null;
    }
  }

  static clearCache() {
    this.productsCache = null;
    this.lastFetchTime = 0;
  }
}
`;

// Example 4: Using with filters and search
export const filteringExample = `
import { fetchAllProducts, fetchProductsByCategory } from '../lib/fetchAllProducts';

export const useProductFilters = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const loadAllProducts = async () => {
    const result = await fetchAllProducts();
    if (result.ok) {
      setAllProducts(result.data);
      setFilteredProducts(result.data);
    }
  };

  const filterByCategory = async (categoryId: string) => {
    if (!categoryId) {
      setFilteredProducts(allProducts);
      return;
    }

    const result = await fetchProductsByCategory(categoryId);
    if (result.ok) {
      setFilteredProducts(result.data);
    }
  };

  const searchProducts = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredProducts(allProducts);
      return;
    }

    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredProducts(filtered);
  };

  return {
    allProducts,
    filteredProducts,
    loadAllProducts,
    filterByCategory,
    searchProducts,
    setSelectedCategory
  };
};
`;

// Example 5: Integration with existing inventory store
export const storeIntegrationExample = `
// In your existing useInventoryStore.ts, you can add:

import { fetchAllProducts } from '../lib/fetchAllProducts';

// Add this method to your store
loadAllProducts: async () => {
  set({ isLoading: true, error: null });
  try {
    const result = await fetchAllProducts();
    
    if (result.ok && result.data) {
      set({ 
        products: result.data,
        totalItems: result.data.length,
        error: null 
      });
      
      // Update cache
      get().updateCache('products', result.data);
      
      // Track analytics
      latsAnalytics.track('all_products_loaded', { 
        count: result.data.length 
      });
    } else {
      set({ error: result.message || 'Failed to load all products' });
    }
  } catch (error) {
    console.error('Error loading all products:', error);
    set({ error: 'Failed to load all products' });
  } finally {
    set({ isLoading: false });
  }
},

// Usage in component:
const { loadAllProducts } = useInventoryStore();

const handleLoadAllProducts = () => {
  loadAllProducts();
};
`;

// Example 6: Batch operations with all products
export const batchOperationsExample = `
import { fetchAllProducts } from '../lib/fetchAllProducts';

export const performBatchOperations = async () => {
  try {
    const result = await fetchAllProducts();
    
    if (!result.ok || !result.data) {
      throw new Error('Failed to fetch products');
    }

    const products = result.data;
    
    // Example: Update all product prices by 5%
    const updatedProducts = products.map(product => ({
      ...product,
      price: Math.round(product.price * 1.05),
      variants: product.variants?.map(variant => ({
        ...variant,
        sellingPrice: Math.round(variant.sellingPrice * 1.05)
      }))
    }));

    // Example: Find low stock products
    const lowStockProducts = products.filter(product => 
      product.totalQuantity <= 10
    );

    // Example: Calculate total inventory value
    const totalValue = products.reduce((sum, product) => 
      sum + (product.totalValue || 0), 0
    );

    // Example: Group by category
    const productsByCategory = products.reduce((acc, product) => {
      const categoryName = product.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {});

    return {
      totalProducts: products.length,
      lowStockProducts: lowStockProducts.length,
      totalValue,
      productsByCategory,
      updatedProducts
    };
  } catch (error) {
    console.error('Batch operations error:', error);
    throw error;
  }
};
`;

// Example 7: Export functionality
export const exportExample = `
import { fetchAllProducts } from '../lib/fetchAllProducts';

export const exportProductsToCSV = async () => {
  try {
    const result = await fetchAllProducts();
    
    if (!result.ok || !result.data) {
      throw new Error('Failed to fetch products');
    }

    const products = result.data;
    
    // Create CSV content
    const csvHeaders = [
      'Name', 'SKU', 'Category', 'Supplier', 'Price', 'Cost Price', 
      'Stock', 'Status', 'Created Date'
    ].join(',');
    
    const csvRows = products.map(product => [
      \`"\${product.name}"\`,
      \`"\${product.sku}"\`,
      \`"\${product.category?.name || 'N/A'}"\`,
      \`"\${product.supplier?.name || 'N/A'}"\`,
      product.price,
      product.costPrice,
      product.totalQuantity,
      product.isActive ? 'Active' : 'Inactive',
      new Date(product.createdAt).toLocaleDateString()
    ].join(','));
    
    const csvContent = [csvHeaders, ...csvRows].join('\\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`products-export-\${new Date().toISOString().split('T')[0]}.csv\`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, count: products.length };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};
`;

// Example 8: Real-time updates integration
export const realTimeExample = `
import { fetchAllProducts } from '../lib/fetchAllProducts';
import { latsEventBus } from './data/eventBus';

export const setupProductUpdates = () => {
  // Listen for product-related events
  const unsubscribeProductCreated = latsEventBus.subscribe(
    'lats:product.created',
    async (event) => {
      console.log('New product created, refreshing all products...');
      const result = await fetchAllProducts();
      if (result.ok) {
        // Update your state/store with new products
        console.log('Products refreshed:', result.data.length);
      }
    }
  );

  const unsubscribeProductUpdated = latsEventBus.subscribe(
    'lats:product.updated',
    async (event) => {
      console.log('Product updated, refreshing all products...');
      const result = await fetchAllProducts();
      if (result.ok) {
        // Update your state/store with updated products
        console.log('Products refreshed:', result.data.length);
      }
    }
  );

  // Cleanup function
  return () => {
    unsubscribeProductCreated();
    unsubscribeProductUpdated();
  };
};
`;

// Export all examples for reference
export const allExamples = {
  basicUsage: basicUsageExample,
  errorHandling: errorHandlingExample,
  serviceUsage: serviceUsageExample,
  filtering: filteringExample,
  storeIntegration: storeIntegrationExample,
  batchOperations: batchOperationsExample,
  export: exportExample,
  realTime: realTimeExample
};