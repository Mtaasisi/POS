import React, { useState, useEffect } from 'react';
import { fetchAllProducts, fetchAllProductsCount, fetchProductsByCategory } from '../lib/fetchAllProducts';
import { Product } from '../types/inventory';
import { toast } from 'react-hot-toast';

interface FetchAllProductsDemoProps {
  onProductsFetched?: (products: Product[]) => void;
}

const FetchAllProductsDemo: React.FC<FetchAllProductsDemoProps> = ({ onProductsFetched }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalCount: number;
    activeCount: number;
  } | null>(null);

  const handleFetchAllProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching all products...');
      const result = await fetchAllProducts();
      
      if (result.ok && result.data) {
        setProducts(result.data);
        toast.success(`Successfully fetched ${result.data.length} products!`);
        
        // Call the callback if provided
        if (onProductsFetched) {
          onProductsFetched(result.data);
        }
        
        console.log('✅ Products fetched:', result.data.length);
      } else {
        setError(result.message || 'Failed to fetch products');
        toast.error(result.message || 'Failed to fetch products');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      console.error('💥 Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCounts = async () => {
    try {
      const result = await fetchAllProductsCount();
      
      if (result.ok && result.data) {
        setStats(result.data);
        toast.success('Product counts updated!');
      } else {
        toast.error(result.message || 'Failed to get product counts');
      }
    } catch (err) {
      toast.error('Error getting product counts');
      console.error('💥 Error getting counts:', err);
    }
  };

  const handleFetchByCategory = async (categoryId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchProductsByCategory(categoryId);
      
      if (result.ok && result.data) {
        setProducts(result.data);
        toast.success(`Fetched ${result.data.length} products for category`);
      } else {
        setError(result.message || 'Failed to fetch category products');
        toast.error(result.message || 'Failed to fetch category products');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch counts on component mount
  useEffect(() => {
    handleFetchCounts();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📦 Fetch All Products Demo
        </h2>
        <p className="text-gray-600">
          This component demonstrates how to fetch all products from the database using the new fetchAllProducts function.
        </p>
      </div>

      {/* Stats Display */}
      {stats && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Database Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCount}</div>
              <div className="text-sm text-blue-700">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeCount}</div>
              <div className="text-sm text-green-700">Active Products</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleFetchAllProducts}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Fetching...
              </>
            ) : (
              <>
                📦 Fetch All Products
              </>
            )}
          </button>
          
          <button
            onClick={handleFetchCounts}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            🔄 Refresh Counts
          </button>
        </div>

        {/* Category Filter */}
        {products.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filter by category:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleFetchByCategory(e.target.value);
                }
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {Array.from(new Set(products.map(p => p.categoryId).filter(Boolean))).map(categoryId => {
                const product = products.find(p => p.categoryId === categoryId);
                return (
                  <option key={categoryId} value={categoryId}>
                    {product?.category?.name || `Category ${categoryId}`}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-800 font-medium">Error:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Products Display */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📋 Products ({products.length})
            </h3>
            <div className="text-sm text-gray-600">
              Total Value: {products.reduce((sum, p) => sum + (p.totalValue || 0), 0).toLocaleString()} TZS
            </div>
          </div>

          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {products.slice(0, 10).map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-blue-600">
                        📁 {product.category?.name || 'No Category'}
                      </span>
                      <span className="text-green-600">
                        🏢 {product.supplier?.name || 'No Supplier'}
                      </span>
                      <span className="text-purple-600">
                        💰 {product.price.toLocaleString()} TZS
                      </span>
                      <span className="text-orange-600">
                        📦 {product.totalQuantity} units
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{product.variants?.length || 0} variants</div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length > 10 && (
            <div className="text-center text-sm text-gray-500">
              Showing first 10 products. Total: {products.length}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📦</div>
          <p>No products loaded yet. Click "Fetch All Products" to load products from the database.</p>
        </div>
      )}
    </div>
  );
};

export default FetchAllProductsDemo;