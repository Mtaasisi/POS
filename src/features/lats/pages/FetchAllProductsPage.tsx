import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import FetchAllProductsDemo from '../components/FetchAllProductsDemo';
import { Product } from '../types/inventory';

const FetchAllProductsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleProductsFetched = (products: Product[]) => {
    console.log('🎉 Products fetched successfully:', products.length);
    
    // You can perform additional actions here, such as:
    // - Update a global state
    // - Send analytics data
    // - Navigate to another page
    // - Show additional information
    
    // Example: Log some statistics
    const stats = {
      totalProducts: products.length,
      productsWithCategories: products.filter(p => p.category).length,
      productsWithSuppliers: products.filter(p => p.supplier).length,
      totalStockValue: products.reduce((sum, p) => sum + (p.totalValue || 0), 0),
      averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length
    };
    
    console.log('📊 Product Statistics:', stats);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📦 Fetch All Products Demo
              </h1>
              <p className="text-gray-600 mt-1">
                Test and demonstrate the fetchAllProducts functionality
              </p>
            </div>
          </div>
        </div>

        {/* Demo Component */}
        <FetchAllProductsDemo onProductsFetched={handleProductsFetched} />

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📖 How to Use</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900">1. Import the function:</h3>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
{`import { fetchAllProducts } from '../lib/fetchAllProducts';`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">2. Use in your component:</h3>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
{`const handleFetchProducts = async () => {
  const result = await fetchAllProducts();
  
  if (result.ok && result.data) {
    console.log('Products:', result.data);
    setProducts(result.data);
  } else {
    console.error('Error:', result.message);
  }
};`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">3. Available functions:</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">fetchAllProducts()</code> - Fetch all products with complete data</li>
                <li><code className="bg-gray-100 px-1 rounded">fetchAllProductsCount()</code> - Get total and active product counts</li>
                <li><code className="bg-gray-100 px-1 rounded">fetchProductsByCategory(categoryId)</code> - Fetch products by category</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">✨ Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Complete product data with categories and suppliers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>All product variants included</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Authentication and error handling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>TypeScript support</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Performance optimized queries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Comprehensive data processing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Stock calculations and totals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Category and supplier filtering</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FetchAllProductsPage;