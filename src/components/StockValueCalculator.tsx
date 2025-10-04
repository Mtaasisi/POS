import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface StockValueData {
  totalProducts: number;
  totalVariants: number;
  totalQuantity: number;
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  profitMargin: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  wellStockedProducts: number;
  topProducts: Array<{
    name: string;
    sku: string;
    quantity: number;
    costValue: number;
    retailValue: number;
    potentialProfit: number;
  }>;
}

const StockValueCalculator: React.FC = () => {
  const [data, setData] = useState<StockValueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-TZ').format(num);
  };

  const calculateStockValue = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Calculating total stock value from your LATS database...');

      // Get all active products with their variants
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select(`
          id,
          name,
          sku,
          is_active,
          total_quantity,
          total_value,
          lats_product_variants (
            id,
            name,
            sku,
            cost_price,
            selling_price,
            quantity,
            is_active
          )
        `)
        .eq('is_active', true);

      if (productsError) {
        throw new Error(`Error fetching products: ${productsError.message}`);
      }

      console.log(`📦 Found ${products?.length || 0} active products`);

      let totalProducts = 0;
      let totalVariants = 0;
      let totalQuantity = 0;
      let totalCostValue = 0;
      let totalRetailValue = 0;
      let outOfStockProducts = 0;
      let lowStockProducts = 0;
      let wellStockedProducts = 0;

      const topProducts: Array<{
        name: string;
        sku: string;
        quantity: number;
        costValue: number;
        retailValue: number;
        potentialProfit: number;
      }> = [];

      products?.forEach(product => {
        if (!product.is_active) return;

      totalProducts++;
      const variants = product.lats_product_variants || [];
      totalVariants += variants.length;

        let productQuantity = 0;
        let productCostValue = 0;
        let productRetailValue = 0;

        variants.forEach(variant => {
          const quantity = variant.quantity || 0;
          const costPrice = variant.cost_price || 0;
          const sellingPrice = variant.selling_price || 0;

          productQuantity += quantity;
          productCostValue += costPrice * quantity;
          productRetailValue += sellingPrice * quantity;
        });

        totalQuantity += productQuantity;
        totalCostValue += productCostValue;
        totalRetailValue += productRetailValue;

        // Stock status analysis
        if (productQuantity === 0) {
          outOfStockProducts++;
        } else if (productQuantity <= 5) {
          lowStockProducts++;
        } else {
          wellStockedProducts++;
        }

        // Top products
        if (productCostValue > 0) {
          topProducts.push({
            name: product.name,
            sku: product.sku,
            quantity: productQuantity,
            costValue: productCostValue,
            retailValue: productRetailValue,
            potentialProfit: productRetailValue - productCostValue
          });
        }
      });

      // Sort top products by cost value
      topProducts.sort((a, b) => b.costValue - a.costValue);

      const profitMargin = totalRetailValue > 0 ? ((totalRetailValue - totalCostValue) / totalRetailValue * 100) : 0;

      setData({
        totalProducts,
        totalVariants,
        totalQuantity,
        totalCostValue,
        totalRetailValue,
        potentialProfit: totalRetailValue - totalCostValue,
        profitMargin,
        outOfStockProducts,
        lowStockProducts,
        wellStockedProducts,
        topProducts: topProducts.slice(0, 10)
      });

    } catch (err) {
      console.error('❌ Error calculating stock value:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateStockValue();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating your stock value...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">❌</div>
          <div>
            <h3 className="text-red-800 font-semibold">Error calculating stock value</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={calculateStockValue}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 Stock Value Analysis</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalCostValue)}</div>
            <div className="text-sm text-blue-800">Total Cost Value</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRetailValue)}</div>
            <div className="text-sm text-green-800">Total Retail Value</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.potentialProfit)}</div>
            <div className="text-sm text-purple-800">Potential Profit</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{data.profitMargin.toFixed(1)}%</div>
            <div className="text-sm text-orange-800">Profit Margin</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📦 Inventory Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products:</span>
                <span className="font-semibold">{formatNumber(data.totalProducts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Variants:</span>
                <span className="font-semibold">{formatNumber(data.totalVariants)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Quantity:</span>
                <span className="font-semibold">{formatNumber(data.totalQuantity)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Stock Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-red-600">❌ Out of Stock:</span>
                <span className="font-semibold text-red-600">{data.outOfStockProducts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">⚠️ Low Stock (≤5):</span>
                <span className="font-semibold text-yellow-600">{data.lowStockProducts}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-green-600">✅ Well Stocked (&gt;5):</span>
                <span className="font-semibold text-green-600">{data.wellStockedProducts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top 10 Most Valuable Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retail Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(product.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.costValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.retailValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {formatCurrency(product.potentialProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={calculateStockValue}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockValueCalculator;
