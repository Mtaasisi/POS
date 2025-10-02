import React, { useState, useEffect, memo } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import VariantProductCard from './VariantProductCard';
import { SimpleImageDisplay } from '../../../../components/SimpleImageDisplay';
import { ProductImage } from '../../../../lib/robustImageService';
import { LabelPrintingModal } from '../../../../components/LabelPrintingModal';
import GeneralProductDetailModal from '../product/GeneralProductDetailModal';
import { 
  Package, Grid, List, Star, CheckCircle, XCircle, 
  Download, Edit, Eye, Trash2, DollarSign, TrendingUp,
  AlertTriangle, Calculator, Printer
} from 'lucide-react';
import { validateProductsBatch } from '../../lib/productUtils';

interface EnhancedInventoryTabProps {
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
  showLowStockOnly: boolean;
  setShowLowStockOnly: (show: boolean) => void;
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
  getStatusColor: (status: string) => string;
  handleStockAdjustment: (productId: string, variantId: string, quantity: number, reason: string) => Promise<void>;
  handleBulkAction: (action: string) => Promise<void>;
  setShowStockAdjustModal: (show: boolean) => void;
  setSelectedProductForHistory: (productId: string | null) => void;
  setShowDeleteConfirmation: (show: boolean) => void;
  toggleProductSelection: (productId: string) => void;
  toggleSelectAll: () => void;
  navigate: (path: string) => void;
  productModals: any;
  deleteProduct: (productId: string) => Promise<void>;
  liveMetrics?: any;
  isLoadingLiveMetrics?: boolean;
  onRefreshLiveMetrics?: () => void;
}

// Helper function to convert old image format to new format
const convertToProductImages = (imageUrls: string[]): ProductImage[] => {
  if (!imageUrls || imageUrls.length === 0) return [];
  
  return imageUrls.map((imageUrl, index) => ({
    id: `temp-${index}`,
    url: imageUrl,
    thumbnailUrl: imageUrl,
    fileName: `product-image-${index + 1}`,
    fileSize: 0,
    isPrimary: index === 0,
    uploadedAt: new Date().toISOString()
  }));
};

const EnhancedInventoryTab: React.FC<EnhancedInventoryTabProps> = ({
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
  showLowStockOnly,
  setShowLowStockOnly,
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
  getStatusColor,
  handleStockAdjustment,
  handleBulkAction,
  setShowStockAdjustModal,
  setSelectedProductForHistory,
  setShowDeleteConfirmation,
  toggleProductSelection,
  toggleSelectAll,
  navigate,
  productModals,
  deleteProduct,
  liveMetrics,
  isLoadingLiveMetrics,
  onRefreshLiveMetrics
}) => {
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<any>(null);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<any>(null);

  // Improved debug logging for development only - only log once per session
  const [hasLoggedNoProducts, setHasLoggedNoProducts] = useState(false);
  useEffect(() => {
    if (import.meta.env.MODE === 'development' && products?.length === 0 && !hasLoggedNoProducts) {
      console.log('ℹ️ [EnhancedInventoryTab] No products available - this may be normal during initial load or if user is not authenticated');
      console.log('🔍 [EnhancedInventoryTab] Products prop:', products);
      console.log('🔍 [EnhancedInventoryTab] Products type:', typeof products);
      console.log('🔍 [EnhancedInventoryTab] Products length:', products?.length);
      setHasLoggedNoProducts(true);
    } else if (products?.length > 0 && hasLoggedNoProducts) {
      console.log('✅ [EnhancedInventoryTab] Products loaded successfully:', products.length);
      setHasLoggedNoProducts(false); // Reset for future loads
    }
  }, [products, hasLoggedNoProducts]);

  // Log missing product information only when there are significant issues - with session tracking
  const [hasLoggedMissingInfo, setHasLoggedMissingInfo] = useState(false);
  useEffect(() => {
    if (products && products.length > 0 && import.meta.env.MODE === 'development') {
      const validationResult = validateProductsBatch(products);
      
      // Only log if there are significant issues (average completeness < 70%)
      if (validationResult.averageCompleteness < 70 && !hasLoggedMissingInfo) {
        console.log('⚠️ [EnhancedInventoryTab] Product data quality issues detected:', {
          totalProducts: validationResult.totalProducts,
          validProducts: validationResult.validProducts,
          invalidProducts: validationResult.invalidProducts,
          averageCompleteness: validationResult.averageCompleteness,
          commonMissingFields: validationResult.commonMissingFields,
          recommendations: validationResult.recommendations
        });
        
        setHasLoggedMissingInfo(true);
      }
    }
  }, [products, hasLoggedMissingInfo]);
  

  // Card variant state for grid view
  const [cardVariant, setCardVariant] = React.useState<'default' | 'detailed'>('detailed');

  // Unified filter component function
  const renderFilterSelect = (
    options: any[],
    value: string,
    onChange: (value: string) => void,
    placeholder: string,
    count: number
  ) => (
    <div className="min-w-[120px]">
      <GlassSelect
        options={[
          { value: 'all', label: `All ${placeholder}s` },
          ...(options || []).map(item => ({
            value: item.name,
            label: item.name
          }))
        ]}
        value={value}
        onChange={onChange}
        placeholder={`${placeholder} (${count})`}
      />
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Comprehensive Statistics Dashboard */}
      <div className="grid grid-cols-5 gap-4 overflow-x-auto">
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
            <span className="text-sm text-gray-600">
              {metrics.activeProducts} active, {metrics.totalItems - metrics.activeProducts} inactive
            </span>
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Stock Status</p>
              <p className="text-2xl font-bold text-orange-900">{metrics.totalItems - metrics.lowStockItems - metrics.outOfStockItems}</p>
            </div>
            <div className="p-3 bg-orange-50/20 rounded-full">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {metrics.lowStockItems} low, {metrics.outOfStockItems} out
            </span>
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Reorder Alerts</p>
              <p className="text-2xl font-bold text-red-900">{metrics.reorderAlerts}</p>
            </div>
            <div className="p-3 bg-red-50/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Need attention</span>
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Value</p>
              <p className="text-2xl font-bold text-green-900">{formatMoney(metrics.totalValue)}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Cost value</span>
          </div>
        </GlassCard>
        
        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Retail Value</p>
              <p className="text-2xl font-bold text-purple-900">{formatMoney(metrics.retailValue || 0)}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Selling value</span>
          </div>
        </GlassCard>
      </div>

      {/* Minimal Search & Filters */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-white/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search products, SKU, brand..."
              className="w-full"
              suggestions={[
                ...products.map(p => p.name),
                ...products.map(p => p.variants?.[0]?.sku || '').filter(Boolean),

                ...products.map(p => categories.find(c => c.id === p.categoryId)?.name || '').filter(Boolean)
              ]}
              searchKey="enhanced_inventory_search"
            />
          </div>
          
          {/* Category */}
          {renderFilterSelect(
            categories,
            selectedCategory,
            setSelectedCategory,
            'Category',
            categories?.length || 0
          )}



          {/* Status */}
          <div className="min-w-[100px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <div className="min-w-[100px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="price">Price (High to Low)</option>
              <option value="stock">Stock Level</option>
              <option value="created">Recently Added</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>

          {/* View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-2 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
          </button>

          {/* Card Variant Toggle (only show in grid view) */}
          {viewMode === 'grid' && (
            <button
              onClick={() => setCardVariant(cardVariant === 'detailed' ? 'default' : 'detailed')}
              className="px-2 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              title={`Switch to ${cardVariant === 'detailed' ? 'compact' : 'detailed'} cards`}
            >
              {cardVariant === 'detailed' ? <Package size={16} /> : <Grid size={16} />}
            </button>
          )}

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600">Low Stock</span>
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600">Featured</span>
            </label>
          </div>
        </div>
      </div>

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
                icon={<Printer size={16} />}
                onClick={() => {
                  // Open label printing modal for first selected product
                  const firstProduct = products.find(p => selectedProducts.includes(p.id));
                  if (firstProduct) {
                    setSelectedProductForLabel({
                      id: firstProduct.id,
                      name: firstProduct.name,
                      sku: firstProduct.variants?.[0]?.sku || firstProduct.id,
                      barcode: firstProduct.variants?.[0]?.sku || firstProduct.id,
                      price: firstProduct.variants?.[0]?.sellingPrice || 0,
                      size: firstProduct.variants?.[0]?.attributes?.size || '',
                      color: firstProduct.variants?.[0]?.attributes?.color || '',
                      brand: firstProduct.brand?.name || '',
                      category: categories.find(c => c.id === firstProduct.categoryId)?.name || ''
                    });
                    setShowLabelModal(true);
                  }
                }}
                className="text-sm"
              >
                Print Labels
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
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">SKU</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Supplier</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-700">Shelf</th>
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
                  const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
                  const stockStatus = totalStock <= 0 ? 'out-of-stock' : totalStock <= 10 ? 'low-stock' : 'in-stock';
                  
                  return (
                    <tr 
                      key={product.id} 
                      className="border-b border-gray-200/30 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={e => { e.stopPropagation(); toggleProductSelection(product.id); }}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <SimpleImageDisplay
                            images={convertToProductImages(product.images)}
                            productName={product.name}
                            size="lg"
                            className="flex-shrink-0"
                          />
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
                        <span className="text-sm text-gray-600">{product.supplier?.name || 'No Supplier'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          N/A
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-gray-900">{formatMoney(mainVariant?.sellingPrice || 0)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div>
                          <span className="text-sm text-gray-600">{totalStock} units</span>
                          {product.variants?.[0]?.minQuantity && totalStock <= product.variants[0].minQuantity && (
                            <div className="text-xs text-red-600">Reorder needed</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stockStatus)}`}>
                          {stockStatus.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/lats/products/${product.id}/edit`); }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit Product"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedProductForDetail(product);
                              setShowProductDetailModal(true);
                            }}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedProductForHistory(product.id);
                              setShowStockAdjustModal(true);
                            }}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
                            title="Adjust Stock"
                          >
                            <Calculator className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedProductForLabel({
                                id: product.id,
                                name: product.name,
                                sku: product.variants?.[0]?.sku || product.id,
                                barcode: product.variants?.[0]?.sku || product.id,
                                price: product.variants?.[0]?.sellingPrice || 0,
                                size: product.variants?.[0]?.attributes?.size || '',
                                color: product.variants?.[0]?.attributes?.color || '',
                                brand: product.brand?.name || '',
                                category: categories.find(c => c.id === product.categoryId)?.name || ''
                              });
                              setShowLabelModal(true);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                            title="Print Label"
                          >
                            <Printer className="w-5 h-5" />
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
        <div className={`grid gap-3 ${
          cardVariant === 'detailed' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
            : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'
        }`}>
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
                onView={(product) => {
                  setSelectedProductForDetail(product);
                  setShowProductDetailModal(true);
                }}
                onEdit={(product) => {
                  navigate(`/lats/products/${product.id}/edit`);
                }}
                onDelete={(product) => {
                  if (confirm('Are you sure you want to delete this product?')) {
                    deleteProduct(product.id);
                  }
                }}
                showActions={true}
                variant={cardVariant}
                // Selection props
                isSelected={selectedProducts.includes(product.id)}
                onSelect={toggleProductSelection}
                showCheckbox={true}
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
              onClick={() => navigate('/lats/add-product')}
              icon={<Package size={18} />}
            >
              Add Your First Product
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Label Printing Modal */}
      {selectedProductForLabel && (
        <LabelPrintingModal
          isOpen={showLabelModal}
          onClose={() => {
            setShowLabelModal(false);
            setSelectedProductForLabel(null);
          }}
          product={selectedProductForLabel}
          formatMoney={formatMoney}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <GeneralProductDetailModal
          isOpen={showProductDetailModal}
          onClose={() => {
            setShowProductDetailModal(false);
            setSelectedProductForDetail(null);
          }}
          product={selectedProductForDetail}
          onEdit={(product) => {
            setShowProductDetailModal(false);
            setSelectedProductForDetail(null);
            navigate(`/lats/products/${product.id}/edit`);
          }}
        />
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedEnhancedInventoryTab = memo(EnhancedInventoryTab, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-renders when data hasn't actually changed
  const propsToCompare = [
    'products', 'searchQuery', 'metrics', 'categories', 'selectedProducts',
    'selectedCategory', 'selectedBrand', 'selectedStatus', 'showLowStockOnly',
    'showFeaturedOnly', 'viewMode', 'sortBy', 'brands'
  ];
  
  for (const prop of propsToCompare) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false; // Allow re-render
    }
  }
  
  return true; // Prevent re-render
});

export default MemoizedEnhancedInventoryTab;
