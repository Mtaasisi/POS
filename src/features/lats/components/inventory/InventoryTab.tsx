import React from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import { Package, AlertTriangle, XCircle, DollarSign, Calculator } from 'lucide-react';

interface InventoryTabProps {
  products: any[];
  metrics: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  showLowStockOnly: boolean;
  setShowLowStockOnly: (show: boolean) => void;
  categories: any[];
  brands: any[];
  formatMoney: (amount: number) => string;
  getStatusColor: (status: string) => string;
  handleStockAdjustment: (productId: string, variantId: string, quantity: number, reason: string) => Promise<void>;
  setShowStockAdjustModal: (show: boolean) => void;
  setSelectedProductForHistory: (productId: string | null) => void;
  navigate: (path: string) => void;
  productModals: any;
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  metrics,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  showLowStockOnly,
  setShowLowStockOnly,
  categories,
  brands,
  formatMoney,
  getStatusColor,
  handleStockAdjustment,
  setShowStockAdjustModal,
  setSelectedProductForHistory,
  navigate,
  productModals
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-900">{metrics.lowStockItems}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-900">{metrics.outOfStockItems}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Reorder Alerts</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.reorderAlerts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-purple-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Value</p>
              <p className="text-2xl font-bold text-green-900">{formatMoney(metrics.totalValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </GlassCard>
      </div>

      {/* Filters and Search */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search products, SKU, or brand..."
              className="w-full"
              suggestions={[
                ...products.map(p => p.name),
                ...products.map(p => p.variants?.[0]?.sku || '').filter(Boolean),
                ...products.map(p => p.brand?.name || '').filter(Boolean),
                ...products.map(p => p.category?.name || '').filter(Boolean)
              ]}
              searchKey="inventory_search"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <GlassSelect
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(category => ({
                  value: category.name,
                  label: category.name
                }))
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Select Category"
              className="min-w-[150px]"
            />

            <GlassSelect
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'in-stock', label: 'In Stock' },
                { value: 'low-stock', label: 'Low Stock' },
                { value: 'out-of-stock', label: 'Out of Stock' }
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Select Status"
              className="min-w-[150px]"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Low Stock Only</span>
            </label>
          </div>
        </div>
      </GlassCard>

      {/* Inventory Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">SKU</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Brand</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
                const mainVariant = product.variants?.[0];
                const status = totalStock <= 0 ? 'out-of-stock' : totalStock <= 10 ? 'low-stock' : 'in-stock';
                
                return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{mainVariant?.sku || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {categories.find(c => c.id === product.categoryId)?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {brands.find(b => b.id === product.brandId)?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{totalStock}</span>
                        {product.variants?.[0]?.minQuantity && totalStock <= product.variants[0].minQuantity && (
                          <div className="text-xs text-red-600">Reorder needed</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatMoney(mainVariant?.sellingPrice || 0)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <GlassButton
                          onClick={() => navigate(`/lats/products/${product.id}`)}
                          variant="ghost"
                          size="sm"
                        >
                          View
                        </GlassButton>
                        <GlassButton
                          onClick={() => {
                            setSelectedProductForHistory(product.id);
                            setShowStockAdjustModal(true);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          Adjust Stock
                        </GlassButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default InventoryTab;
