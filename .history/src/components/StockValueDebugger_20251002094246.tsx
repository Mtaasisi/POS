import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface DebugData {
  totalProducts: number;
  totalVariants: number;
  totalCalculatedValue: number;
  totalStoredValue: number;
  suspiciousProducts: Array<{
    product: string;
    variant: string;
    issue: string;
    value: number;
    type: string;
  }>;
  highValueProducts: Array<{
    name: string;
    sku: string;
    calculatedValue: number;
    storedValue: number;
    variants: number;
    totalQuantity: number;
  }>;
  duplicateSkus: string[];
}

const StockValueDebugger: React.FC = () => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
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

  const debugStockValues = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Debugging Stock Values - Checking for data issues...');

      // Get all products with their variants
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
            min_quantity
          )
        `)
        .eq('is_active', true);

      if (productsError) {
        throw new Error(`Error fetching products: ${productsError.message}`);
      }

      console.log(`📦 Found ${products?.length || 0} active products`);

      let totalCalculatedValue = 0;
      let totalStoredValue = 0;
      const suspiciousProducts: any[] = [];
      const highValueProducts: any[] = [];
      const allSkus: string[] = [];

      products?.forEach((product, index) => {
        const variants = product.lats_product_variants || [];
        let productCalculatedValue = 0;
        let productTotalQuantity = 0;

        console.log(`📦 Product ${index + 1}: ${product.name}`);
        console.log(`   SKU: ${product.sku}`);
        console.log(`   Stored total_value: ${formatCurrency(product.total_value || 0)}`);
        console.log(`   Stored total_quantity: ${product.total_quantity || 0}`);
        console.log(`   Variants: ${variants.length}`);

        variants.forEach((variant, vIndex) => {
          const costPrice = variant.cost_price || 0;
          const quantity = variant.quantity || 0;
          const variantValue = costPrice * quantity;
          
          productCalculatedValue += variantValue;
          productTotalQuantity += quantity;

          console.log(`     Variant ${vIndex + 1}: ${variant.name || 'Unnamed'}`);
          console.log(`       SKU: ${variant.sku}`);
          console.log(`       Cost Price: ${formatCurrency(costPrice)}`);
          console.log(`       Quantity: ${quantity}`);
          console.log(`       Value: ${formatCurrency(variantValue)}`);

          // Check for suspicious values
          if (costPrice > 1000000) { // Cost price over 1M TZS
            suspiciousProducts.push({
              product: product.name,
              variant: variant.name,
              issue: 'High cost price',
              value: costPrice,
              type: 'cost_price'
            });
          }

          if (quantity > 1000) { // Quantity over 1000
            suspiciousProducts.push({
              product: product.name,
              variant: variant.name,
              issue: 'High quantity',
              value: quantity,
              type: 'quantity'
            });
          }

          if (variantValue > 10000000) { // Variant value over 10M TZS
            suspiciousProducts.push({
              product: product.name,
              variant: variant.name,
              issue: 'High variant value',
              value: variantValue,
              type: 'variant_value'
            });
          }

          // Collect SKUs for duplicate check
          if (variant.sku) {
            allSkus.push(variant.sku);
          }
        });

        console.log(`   Calculated total value: ${formatCurrency(productCalculatedValue)}`);
        console.log(`   Calculated total quantity: ${productTotalQuantity}`);
        console.log(`   Difference: ${formatCurrency(productCalculatedValue - (product.total_value || 0))}`);

        totalCalculatedValue += productCalculatedValue;
        totalStoredValue += (product.total_value || 0);

        // Track high value products
        if (productCalculatedValue > 5000000) { // Over 5M TZS
          highValueProducts.push({
            name: product.name,
            sku: product.sku,
            calculatedValue: productCalculatedValue,
            storedValue: product.total_value || 0,
            variants: variants.length,
            totalQuantity: productTotalQuantity
          });
        }
      });

      // Check for duplicate SKUs
      const duplicateSkus = allSkus.filter((sku, index) => allSkus.indexOf(sku) !== index);

      const debugResult: DebugData = {
        totalProducts: products?.length || 0,
        totalVariants: allSkus.length,
        totalCalculatedValue,
        totalStoredValue,
        suspiciousProducts,
        highValueProducts: highValueProducts.sort((a, b) => b.calculatedValue - a.calculatedValue),
        duplicateSkus: [...new Set(duplicateSkus)]
      };

      setDebugData(debugResult);

    } catch (err) {
      console.error('❌ Error debugging stock values:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    debugStockValues();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Debugging stock values...</p>
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
            <h3 className="text-red-800 font-semibold">Error debugging stock values</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={debugStockValues}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!debugData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No debug data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Stock Value Debug Analysis</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(debugData.totalCalculatedValue)}</div>
            <div className="text-sm text-blue-800">Total Calculated Value</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(debugData.totalStoredValue)}</div>
            <div className="text-sm text-green-800">Total Stored Value</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{debugData.totalProducts}</div>
            <div className="text-sm text-purple-800">Total Products</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{debugData.totalVariants}</div>
            <div className="text-sm text-orange-800">Total Variants</div>
          </div>
        </div>

        {/* Difference Analysis */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Value Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Calculated Value</div>
              <div className="text-xl font-bold">{formatCurrency(debugData.totalCalculatedValue)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Stored Value</div>
              <div className="text-xl font-bold">{formatCurrency(debugData.totalStoredValue)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Difference</div>
              <div className={`text-xl font-bold ${debugData.totalCalculatedValue - debugData.totalStoredValue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(debugData.totalCalculatedValue - debugData.totalStoredValue)}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">Average per Product</div>
            <div className="text-lg font-semibold">{formatCurrency(debugData.totalCalculatedValue / debugData.totalProducts)}</div>
          </div>
        </div>

        {/* Suspicious Values */}
        {debugData.suspiciousProducts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Suspicious Values Found</h3>
            <div className="space-y-3">
              {debugData.suspiciousProducts.map((item, index) => (
                <div key={index} className="bg-white rounded p-3 border border-yellow-200">
                  <div className="font-medium">{item.product} - {item.variant}</div>
                  <div className="text-sm text-gray-600">Issue: {item.issue}</div>
                  <div className="text-sm text-gray-600">Value: {formatCurrency(item.value)}</div>
                  <div className="text-sm text-gray-600">Type: {item.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High Value Products */}
        {debugData.highValueProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-4">🏆 High Value Products (&gt;5M TZS)</h3>
            <div className="space-y-3">
              {debugData.highValueProducts.map((product, index) => (
                <div key={index} className="bg-white rounded p-3 border border-red-200">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                  <div className="text-sm text-gray-600">Calculated Value: {formatCurrency(product.calculatedValue)}</div>
                  <div className="text-sm text-gray-600">Stored Value: {formatCurrency(product.storedValue)}</div>
                  <div className="text-sm text-gray-600">Variants: {product.variants}</div>
                  <div className="text-sm text-gray-600">Total Quantity: {product.totalQuantity}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duplicate SKUs */}
        {debugData.duplicateSkus.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">⚠️ Duplicate SKUs Found</h3>
            <div className="space-y-2">
              {debugData.duplicateSkus.map((sku, index) => (
                <div key={index} className="bg-white rounded p-2 border border-orange-200">
                  <div className="font-medium">{sku}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Potential Issues */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">🔍 Potential Issues to Check</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <div>1. Currency units - Are prices in TZS or USD?</div>
            <div>2. Decimal places - Are prices stored with correct precision?</div>
            <div>3. Duplicate variants - Are there duplicate entries?</div>
            <div>4. Test data - Are there test products with inflated values?</div>
            <div>5. Unit conversion - Are quantities in correct units?</div>
            <div>6. Data entry errors - Are there typos in price values?</div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={debugStockValues}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh Debug Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockValueDebugger;
