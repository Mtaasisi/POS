import React from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import { 
  Package, BarChart3, TrendingUp, TrendingDown, DollarSign, 
  AlertTriangle, CheckCircle, XCircle, Star, Users, Crown
} from 'lucide-react';

interface AnalyticsTabProps {
  products: any[];
  metrics: any;
  categories: any[];
  brands: any[];
  formatMoney: (amount: number) => string;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  products,
  metrics,
  categories,
  brands,
  formatMoney
}) => {
  // Calculate additional analytics
  const analytics = React.useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const inactiveProducts = totalProducts - activeProducts;
    const featuredProducts = products.filter(p => p.isFeatured).length;
    
    // Stock analytics
    const lowStockProducts = products.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      return totalStock > 0 && totalStock <= 10;
    }).length;
    
    const outOfStockProducts = products.filter(p => {
      const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) || 0;
      return totalStock <= 0;
    }).length;
    
    const wellStockedProducts = totalProducts - lowStockProducts - outOfStockProducts;
    
    // Value analytics
    const totalValue = products.reduce((sum, product) => {
      const mainVariant = product.variants?.[0];
      const totalStock = product.variants?.reduce((stockSum, variant) => stockSum + (variant.quantity || 0), 0) || 0;
      return sum + ((mainVariant?.costPrice || 0) * totalStock);
    }, 0);
    
    const retailValue = products.reduce((sum, product) => {
      const mainVariant = product.variants?.[0];
      const totalStock = product.variants?.reduce((stockSum, variant) => stockSum + (variant.quantity || 0), 0) || 0;
      return sum + ((mainVariant?.sellingPrice || 0) * totalStock);
    }, 0);
    
    const potentialProfit = retailValue - totalValue;
    const profitMargin = retailValue > 0 ? (potentialProfit / retailValue) * 100 : 0;
    
    // Category analytics
    const categoryStats = categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const categoryValue = categoryProducts.reduce((sum, product) => {
        const mainVariant = product.variants?.[0];
        const totalStock = product.variants?.reduce((stockSum, variant) => stockSum + (variant.quantity || 0), 0) || 0;
        return sum + ((mainVariant?.sellingPrice || 0) * totalStock);
      }, 0);
      
      return {
        name: category.name,
        count: categoryProducts.length,
        value: categoryValue,
        percentage: totalProducts > 0 ? (categoryProducts.length / totalProducts) * 100 : 0
      };
    }).sort((a, b) => b.count - a.count);
    
    // Brand analytics
    const brandStats = brands.map(brand => {
      const brandProducts = products.filter(p => p.brandId === brand.id);
      const brandValue = brandProducts.reduce((sum, product) => {
        const mainVariant = product.variants?.[0];
        const totalStock = product.variants?.reduce((stockSum, variant) => stockSum + (variant.quantity || 0), 0) || 0;
        return sum + ((mainVariant?.sellingPrice || 0) * totalStock);
      }, 0);
      
      return {
        name: brand.name,
        count: brandProducts.length,
        value: brandValue,
        percentage: totalProducts > 0 ? (brandProducts.length / totalProducts) * 100 : 0
      };
    }).sort((a, b) => b.count - a.count);
    
    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      lowStockProducts,
      outOfStockProducts,
      wellStockedProducts,
      totalValue,
      retailValue,
      potentialProfit,
      profitMargin,
      categoryStats,
      brandStats
    };
  }, [products, categories, brands]);

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analytics.activeProducts} active, {analytics.inactiveProducts} inactive
            </span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Stock Status</p>
              <p className="text-2xl font-bold text-green-900">{analytics.wellStockedProducts}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analytics.lowStockProducts} low, {analytics.outOfStockProducts} out
            </span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Retail Value</p>
              <p className="text-2xl font-bold text-purple-900">{formatMoney(analytics.retailValue)}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analytics.profitMargin.toFixed(1)}% profit margin
            </span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Featured Products</p>
              <p className="text-2xl font-bold text-amber-900">{analytics.featuredProducts}</p>
            </div>
            <div className="p-3 bg-amber-50/20 rounded-full">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {analytics.totalProducts > 0 ? ((analytics.featuredProducts / analytics.totalProducts) * 100).toFixed(1) : 0}% of total
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Financial Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Cost Value:</span>
              <span className="font-semibold">{formatMoney(analytics.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Retail Value:</span>
              <span className="font-semibold">{formatMoney(analytics.retailValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Potential Profit:</span>
              <span className={`font-semibold ${analytics.potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(analytics.potentialProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Profit Margin:</span>
              <span className={`font-semibold ${analytics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Distribution</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Well Stocked:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600">{analytics.wellStockedProducts}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.wellStockedProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Low Stock:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-yellow-600">{analytics.lowStockProducts}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.lowStockProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Out of Stock:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-600">{analytics.outOfStockProducts}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProducts > 0 ? (analytics.outOfStockProducts / analytics.totalProducts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Category Analytics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
        <div className="space-y-3">
          {analytics.categoryStats.slice(0, 5).map((category, index) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                  <div className="text-sm text-gray-500">{category.count} products</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatMoney(category.value)}</div>
                <div className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Brand Analytics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Distribution</h3>
        <div className="space-y-3">
          {analytics.brandStats.slice(0, 5).map((brand, index) => (
            <div key={brand.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <span className="font-medium text-gray-900">{brand.name}</span>
                  <div className="text-sm text-gray-500">{brand.count} products</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatMoney(brand.value)}</div>
                <div className="text-sm text-gray-500">{brand.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900">Top Insights</h3>
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• {analytics.categoryStats[0]?.name || 'No category'} is your largest category</li>
            <li>• {analytics.brandStats[0]?.name || 'No brand'} has the highest value</li>
            <li>• {analytics.profitMargin.toFixed(1)}% average profit margin</li>
            <li>• {analytics.featuredProducts} products are featured</li>
          </ul>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-orange-900">Stock Alerts</h3>
          </div>
          <ul className="space-y-2 text-sm text-orange-800">
            <li>• {analytics.lowStockProducts} products need restocking</li>
            <li>• {analytics.outOfStockProducts} products are out of stock</li>
            <li>• {analytics.reorderAlerts} reorder alerts active</li>
            <li>• Monitor stock levels regularly</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};

export default AnalyticsTab;
