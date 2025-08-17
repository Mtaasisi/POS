import React from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import VariantProductCard from './VariantProductCard';
import { 
  Package, Grid, List, Star, CheckCircle, XCircle, 
  Download, Upload, Edit, Eye, Trash2, DollarSign, TrendingUp
} from 'lucide-react';

interface CatalogTabProps {
  products: any[];
  metrics: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  showFeaturedOnly: boolean;
  setShowFeaturedOnly: (show: boolean) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  selectedProducts: string[];
  setSelectedProducts: (products: string[]) => void;
  categories: any[];
  brands: any[];
  formatMoney: (amount: number) => string;
  handleBulkAction: (action: string) => Promise<void>;
  setShowDeleteConfirmation: (show: boolean) => void;
  toggleProductSelection: (productId: string) => void;
  toggleSelectAll: () => void;
  navigate: (path: string) => void;
  productModals: any;
  deleteProduct: (productId: string) => Promise<void>;
}

const CatalogTab: React.FC<CatalogTabProps> = ({
  products,
  metrics,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  selectedStatus,
  setSelectedStatus,
  showFeaturedOnly,
  setShowFeaturedOnly,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  selectedProducts,
  setSelectedProducts,
  categories,
  brands,
  formatMoney,
  handleBulkAction,
  setShowDeleteConfirmation,
  toggleProductSelection,
  toggleSelectAll,
  navigate,
  productModals,
  deleteProduct
}) => {
  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.totalItems}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">From database</span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Products</p>
              <p className="text-2xl font-bold text-green-900">{metrics.activeProducts}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Available for sale</span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Catalog Value</p>
              <p className="text-2xl font-bold text-purple-900">{formatMoney(metrics.totalValue)}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Total retail value</span>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Featured Products</p>
              <p className="text-2xl font-bold text-amber-900">{metrics.featuredProducts}</p>
            </div>
            <div className="p-3 bg-amber-50/20 rounded-full">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Highlighted items</span>
          </div>
        </GlassCard>
      </div>

      {/* Filters and Controls */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search products..."
              className="w-full"
              suggestions={[
                ...products.map(p => p.name),
                ...products.map(p => p.variants?.[0]?.sku || '').filter(Boolean),
                ...products.map(p => brands.find(b => b.id === p.brandId)?.name || '').filter(Boolean),
                ...products.map(p => categories.find(c => c.id === p.categoryId)?.name || '').filter(Boolean)
              ]}
              searchKey="product_catalog_search"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <GlassSelect
              options={[
                { value: 'all', label: 'All Brands' },
                ...brands.map(brand => ({
                  value: brand.name,
                  label: brand.name
                }))
              ]}
              value={selectedBrand}
              onChange={setSelectedBrand}
              placeholder="Select Brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="name">Name</option>
              <option value="price">Price (High to Low)</option>
              <option value="recent">Recently Updated</option>
              <option value="stock">Stock Level</option>
              <option value="sales">Sales Volume</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Featured Only</span>
            </label>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {viewMode === 'grid' ? <Grid size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <GlassCard className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="secondary"
                icon={<Download size={16} />}
                onClick={() => handleBulkAction('export')}
                className="text-sm"
              >
                Export
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<Star size={16} />}
                onClick={() => handleBulkAction('feature')}
                className="text-sm"
              >
                Feature
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<Trash2 size={16} />}
                onClick={() => setShowDeleteConfirmation(true)}
                className="text-sm text-red-600 hover:bg-red-50"
              >
                Delete All
              </GlassButton>
              <GlassButton
                variant="secondary"
                icon={<XCircle size={16} />}
                onClick={() => setSelectedProducts([])}
                className="text-sm text-red-600"
              >
                Clear
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Products Display */}
      {viewMode === 'list' ? (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50">
                  <th className="text-left py-4 px-4 font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">SKU</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Brand</th>
                  <th className="text-right py-4 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-right py-4 px-4 font-medium text-gray-700">Stock</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  const brand = product.brand;
                  const mainVariant = product.variants?.[0];
                  
                  return (
                    <tr key={product.id} className="border-b border-gray-200/30 hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={e => { e.stopPropagation(); toggleProductSelection(product.id); }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              {product.description ? `${product.description.substring(0, 50)}...` : 'No description'}
                            </p>
                            {product.isFeatured && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-600">{mainVariant?.sku || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{category?.name || 'Uncategorized'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{brand?.name || 'No Brand'}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-gray-900">{formatMoney(mainVariant?.sellingPrice || 0)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-gray-600">{product.totalQuantity || 0} units</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); productModals.openEditModal(product); }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/inventory/products/${product.id}`); }}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const category = categories.find(c => c.id === product.categoryId);
            const brand = product.brand;
            
            return (
              <VariantProductCard
                key={product.id}
                product={{
                  ...product,
                  categoryName: category?.name,
                  brandName: brand?.name
                }}
                onView={(product) => navigate(`/lats/products/${product.id}`)}
                onEdit={(product) => {
                  productModals.openEditModal(product.id);
                }}
                onDelete={(product) => {
                  if (confirm('Are you sure you want to delete this product?')) {
                    deleteProduct(product.id);
                  }
                }}
                showActions={true}
                variant="default"
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <GlassCard className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GlassButton
              onClick={productModals.openAddModal}
              icon={<Package size={18} />}
            >
              Add Your First Product
            </GlassButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default CatalogTab;
