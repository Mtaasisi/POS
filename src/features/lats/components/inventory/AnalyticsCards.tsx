import React from 'react';
import { useInventoryAnalytics } from '../../hooks/useAnalytics';
import GlassCard from '../../../shared/components/ui/GlassCard';
import { Tag, Package, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AnalyticsCardsProps {
  className?: string;
  showRefreshButton?: boolean;
}

const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ 
  className = '',
  showRefreshButton = true 
}) => {
  const { data, loading, error, refresh } = useInventoryAnalytics();

  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('Analytics refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh analytics');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} className="p-4 border border-gray-200">
            <div className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg w-8 h-8"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${className}`}>
        <div className="col-span-3">
          <GlassCard className="p-4 border border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              {showRefreshButton && (
                <button
                  onClick={handleRefresh}
                  className="ml-auto p-2 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const analytics = data || {
    totalVariants: 0,
    totalStock: 0,
    totalValue: 0,
    totalProducts: 0,
    activeProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    categoriesCount: 0,
    brandsCount: 0,
    suppliersCount: 0
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${className}`}>
      {/* Total Variants Card */}
      <GlassCard className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Tag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-blue-900">
              {formatNumber(analytics.totalVariants)}
            </div>
            <div className="text-sm text-blue-600">Total Variants</div>
          </div>
          {showRefreshButton && (
            <button
              onClick={handleRefresh}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Refresh analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </GlassCard>

      {/* Total Stock Card */}
      <GlassCard className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-green-900">
              {formatNumber(analytics.totalStock)}
            </div>
            <div className="text-sm text-green-600">Total Stock</div>
          </div>
          {showRefreshButton && (
            <button
              onClick={handleRefresh}
              className="p-1 text-green-600 hover:text-green-800 transition-colors"
              title="Refresh analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </GlassCard>

      {/* Total Value Card */}
      <GlassCard className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-purple-900">
              {formatMoney(analytics.totalValue)}
            </div>
            <div className="text-sm text-purple-600">Total Value</div>
          </div>
          {showRefreshButton && (
            <button
              onClick={handleRefresh}
              className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
              title="Refresh analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </GlassCard>

      {/* Additional Analytics Cards */}
      <div className="col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {/* Total Products */}
        <GlassCard className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Package className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {formatNumber(analytics.totalProducts)}
              </div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
          </div>
        </GlassCard>

        {/* Active Products */}
        <GlassCard className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-900">
                {formatNumber(analytics.activeProducts)}
              </div>
              <div className="text-sm text-emerald-600">Active Products</div>
            </div>
          </div>
        </GlassCard>

        {/* Low Stock Items */}
        <GlassCard className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-900">
                {formatNumber(analytics.lowStockItems)}
              </div>
              <div className="text-sm text-amber-600">Low Stock Items</div>
            </div>
          </div>
        </GlassCard>

        {/* Out of Stock Items */}
        <GlassCard className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-red-900">
                {formatNumber(analytics.outOfStockItems)}
              </div>
              <div className="text-sm text-red-600">Out of Stock</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AnalyticsCards;
