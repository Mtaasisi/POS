import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import PageHeader from '../components/ui/PageHeader';

import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import LATSQuickActions from '../components/ui/LATSQuickActions';
import AnalyticsCards from '../components/inventory/AnalyticsCards';
import { PageErrorBoundary } from '../../../features/shared/components/PageErrorBoundary';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import ErrorState from '../components/ui/ErrorState';
import { Plus, Package, Calculator, Crown, Users, Search, Filter, Download, Upload, AlertTriangle, XCircle, DollarSign } from 'lucide-react';
import { useInventoryStore } from '../stores/useInventoryStore';
import { format } from '../lib/format';
import { toast } from 'react-hot-toast';

// Import inventory forms

import StockAdjustModal from '../components/inventory/StockAdjustModal';

import CategoryFormModal from '../components/inventory/CategoryFormModal';
import SupplierForm from '../components/inventory/SupplierForm';
import VariantForm from '../components/inventory/VariantForm';
import AddProductModal from '../components/inventory/AddProductModal';
import EditProductModal from '../components/inventory/EditProductModal';
import { useProductModals } from '../hooks/useProductModals';

// Inventory data is now loaded from database

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    categories,
    brands,
    suppliers,
    stockMovements,
    loadProducts,
    loadCategories,
    loadBrands,
    loadSuppliers,
    loadStockMovements,
    createProduct,
    createCategory,
    createBrand,
    createSupplier,
    adjustStock
  } = useInventoryStore();

  // Product modals
  const productModals = useProductModals();

  // Error handling
  const { errorState, handleError, clearError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<string | null>(null);

  // Form modals
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);

  // Load data from database on component mount with error handling
  useEffect(() => {
    const loadData = async () => {
      await withErrorHandling(async () => {
        console.log('🔧 LATS Inventory: Loading data from database...');
        setIsLoading(true);
        
        try {
          await Promise.all([
            loadProducts({ page: 1, limit: 50 }),
            loadCategories(),
            loadBrands(),
            loadSuppliers(),
            loadStockMovements()
          ]);
          
          console.log('📊 LATS Inventory: Data loaded successfully');
          console.log('📦 Products:', products.length);
          console.log('📂 Categories:', categories.length);
          console.log('🏷️ Brands:', brands.length);
          console.log('🏢 Suppliers:', suppliers.length);
          console.log('📊 Stock Movements:', stockMovements.length);
          
        } catch (error) {
          console.error('❌ Error loading inventory data:', error);
          throw error;
        } finally {
          setIsLoading(false);
        }
      }, 'Loading inventory data');
    };
    
    loadData();
  }, [withErrorHandling, loadProducts, loadCategories, loadBrands, loadSuppliers, loadStockMovements]);

  // Check if database is empty
  useEffect(() => {
    if (products.length === 0 && categories.length === 0 && brands.length === 0 && suppliers.length === 0) {
      setShowEmptyState(true);
    } else {
      setShowEmptyState(false);
    }
  }, [products.length, categories.length, brands.length, suppliers.length]);

  // Analytics data is now handled by the AnalyticsCards component

  // Filter inventory based on search and filters
  const filteredInventory = useMemo(() => {
    return products.filter(product => {
      // Search filter
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.variants?.some(variant => 
          variant.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        product.brand?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        categories.find(c => c.id === product.categoryId)?.name === selectedCategory;

      // Status filter
      const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.quantity || 0), 0) || 0;
      let matchesStatus = true;
      if (selectedStatus === 'in-stock') {
        matchesStatus = totalStock > 10;
      } else if (selectedStatus === 'low-stock') {
        matchesStatus = totalStock > 0 && totalStock <= 10;
      } else if (selectedStatus === 'out-of-stock') {
        matchesStatus = totalStock <= 0;
      }

      // Low stock only filter
      const matchesLowStockOnly = !showLowStockOnly || 
        (totalStock > 0 && totalStock <= 10);

      return matchesSearch && matchesCategory && matchesStatus && matchesLowStockOnly;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, showLowStockOnly]);

  // Format money
  const formatMoney = (amount: number) => {
    return format.money(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async (productId: string, variantId: string, quantity: number, reason: string) => {
    try {
      await adjustStock(productId, variantId, quantity, reason);
      toast.success('Stock adjusted successfully');
    } catch (error) {
      toast.error('Failed to adjust stock');
      console.error('Stock adjustment error:', error);
    }
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    console.log('InventoryPage: Navigating to', path);
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Navigation failed');
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  // Handle status change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  // Show error state if there's an error
  if (errorState.hasError) {
    return (
      <ErrorState
        error={errorState.error}
        onRetry={errorState.retry}
        onClearError={clearError}
      />
    );
  }

  // Show empty state if no data
  console.log('InventoryPage Debug:', { showEmptyState, isLoading, productsCount: products?.length });
  
  // TEMPORARY: Force show main content for testing
  const forceShowMain = true;
  
  if (showEmptyState && !isLoading && !forceShowMain) {
    return (
      <PageErrorBoundary pageName="Inventory Management" showDetails={true}>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          <PageHeader
            title="Inventory Management"
            subtitle="Manage your product inventory and stock levels"
            actions={
              <div className="flex flex-wrap gap-3">
                              <GlassButton
                onClick={productModals.openAddModal}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Add Product
              </GlassButton>
                <GlassButton
                  onClick={() => handleNavigation('/demo-new-product')}
                  icon={<Plus size={18} />}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                >
                  Demo Add Product
                </GlassButton>
              </div>
            }
          />
          <LATSBreadcrumb />
          <GlassCard className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Data</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first product to the inventory.</p>
            <div className="flex gap-3 justify-center">
              <GlassButton
                onClick={productModals.openAddModal}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Add Your First Product
              </GlassButton>
              <GlassButton
                onClick={() => handleNavigation('/demo-new-product')}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                Demo Add Product
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary pageName="Inventory Management" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Inventory Management"
          subtitle="Manage your product inventory and stock levels"
          actions={
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={productModals.openAddModal}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Add Product
              </GlassButton>
              <GlassButton
                onClick={() => handleNavigation('/demo-new-product')}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                Demo Add Product
              </GlassButton>
              <GlassButton
                onClick={() => setShowCategoryForm(true)}
                variant="secondary"
                icon={<Package size={18} />}
              >
                Add Category
              </GlassButton>
              <GlassButton
                onClick={() => window.open('/brand-management', '_blank')}
                variant="secondary"
                icon={<Crown size={18} />}
              >
                Manage Brands
              </GlassButton>
            </div>
          }
        />

        {/* Breadcrumb */}
        <LATSBreadcrumb />

        {/* Analytics Cards */}
        <AnalyticsCards />

        {/* Filters and Search */}
        <GlassCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
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
                onChange={handleCategoryChange}
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
                onChange={handleStatusChange}
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
                {filteredInventory.map((product) => {
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
                        {product.brand?.name || 'N/A'}
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
                            onClick={() => handleNavigation(`/lats/products/${product.id}`)}
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

        {/* Form Modals */}

        {showStockAdjustModal && selectedProductForHistory && (
          <StockAdjustModal
            variant={products.find(p => p.id === selectedProductForHistory)?.variants?.[0]}
            isOpen={showStockAdjustModal}
            onClose={() => {
              setShowStockAdjustModal(false);
              setSelectedProductForHistory(null);
            }}
            onSubmit={async (data) => {
              const product = products.find(p => p.id === selectedProductForHistory);
              if (product && product.variants?.[0]) {
                const variant = product.variants[0];
                let quantity = data.quantity;
                
                // Calculate the actual quantity change based on adjustment type
                if (data.adjustmentType === 'out') {
                  quantity = -quantity; // Negative for stock out
                } else if (data.adjustmentType === 'set') {
                  quantity = quantity - variant.quantity; // Difference for set
                }
                
                await handleStockAdjustment(product.id, variant.id, quantity, data.reason);
              }
            }}
            loading={isLoading}
          />
        )}

        <CategoryFormModal
          isOpen={showCategoryForm}
          onClose={() => setShowCategoryForm(false)}
          onSubmit={async (categoryData) => {
            try {
              await createCategory(categoryData);
              toast.success('Category created successfully');
              setShowCategoryForm(false);
            } catch (error) {
              toast.error('Failed to create category');
              console.error('Category creation error:', error);
            }
          }}
          parentCategories={categories}
          loading={isLoading}
        />



        {showSupplierForm && (
          <SupplierForm
            isOpen={showSupplierForm}
            onClose={() => setShowSupplierForm(false)}
            onSubmit={async (supplierData) => {
              try {
                await createSupplier(supplierData);
                toast.success('Supplier created successfully');
                setShowSupplierForm(false);
              } catch (error) {
                toast.error('Failed to create supplier');
                console.error('Supplier creation error:', error);
              }
            }}
          />
        )}

        {showVariantForm && (
          <VariantForm
            isOpen={showVariantForm}
            onClose={() => setShowVariantForm(false)}
            onSubmit={async (variantData) => {
              try {
                // Handle variant creation
                toast.success('Variant created successfully');
                setShowVariantForm(false);
              } catch (error) {
                toast.error('Failed to create variant');
                console.error('Variant creation error:', error);
              }
            }}
          />
        )}

        {/* Product Modals */}
        <AddProductModal
          isOpen={productModals.showAddModal}
          onClose={productModals.closeAddModal}
          onProductCreated={(product) => {
            toast.success('Product created successfully!');
            // Refresh the products list
            loadProducts({ page: 1, limit: 50 });
          }}
        />

        <EditProductModal
          isOpen={productModals.showEditModal}
          onClose={productModals.closeEditModal}
          productId={productModals.editingProductId || ''}
          onProductUpdated={(product) => {
            toast.success('Product updated successfully!');
            // Refresh the products list
            loadProducts({ page: 1, limit: 50 });
          }}
        />
      </div>
    </PageErrorBoundary>
  );
};

export default InventoryPage;
