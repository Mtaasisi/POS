import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getProducts, 
  getLowStockItems, 
  getInventoryCategories,
  Product,
  ProductVariant,
  InventoryCategory
} from '../lib/inventoryApi';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import SearchBar from '../components/ui/SearchBar';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  BarChart3,
  Grid,
  List,
  Tag,
  Building,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch real data from database
      const [productsData, categoriesData, lowStockData] = await Promise.all([
        getProducts(),
        getInventoryCategories(),
        getLowStockItems()
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
      setLowStockItems(lowStockData);
      
      console.log('📦 Inventory data loaded:', {
        products: productsData.length,
        categories: categoriesData.length,
        lowStock: lowStockData.length
      });
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;

    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'low' && product.variants?.some(v => v.quantity_in_stock <= product.reorder_point)) ||
      (stockFilter === 'out' && product.variants?.every(v => v.quantity_in_stock === 0)) ||
      (stockFilter === 'in' && product.variants?.some(v => v.quantity_in_stock > 0));

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Calculate statistics
  const totalProducts = products.length;
  const totalVariants = products.reduce((sum, p) => sum + (p.variants?.length || 0), 0);
  const totalValue = products.reduce((sum, p) => 
    sum + (p.variants?.reduce((vSum, v) => vSum + (v.quantity_in_stock * v.cost_price), 0) || 0), 0
  );
  const lowStockCount = lowStockItems.length;

  const getStockStatus = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
      return { status: 'unknown', color: 'bg-gray-100 text-gray-800' };
    }

    const totalStock = product.variants.reduce((sum, v) => sum + v.quantity_in_stock, 0);
    const hasLowStock = product.variants.some(v => v.quantity_in_stock <= product.reorder_point);

    if (totalStock === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (hasLowStock) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const getTotalStock = (product: Product) => {
    return product.variants?.reduce((sum, v) => sum + v.quantity_in_stock, 0) || 0;
  };

  const getAveragePrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return 0;
    const totalPrice = product.variants.reduce((sum, v) => sum + v.selling_price, 0);
    return totalPrice / product.variants.length;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your products, variants, and stock levels</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => navigate('/inventory/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            <Plus size={18} />
            Add Product
          </GlassButton>
          <GlassButton
            onClick={() => navigate('/inventory/management')}
            className="flex items-center gap-2"
          >
            <Settings size={18} />
            Manage
          </GlassButton>
          <GlassButton
            onClick={() => navigate('/inventory/purchase-orders')}
            className="flex items-center gap-2"
          >
            <Building size={18} />
            Purchase Orders
          </GlassButton>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-900">{totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Variants</p>
              <p className="text-2xl font-bold text-green-900">{totalVariants}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <Tag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-900">
                {totalValue.toLocaleString('en-TZ', {
                  style: 'currency',
                  currency: 'TZS',
                  minimumFractionDigits: 0
                })}
              </p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-900">{lowStockCount}</p>
            </div>
            <div className="p-3 bg-red-50/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <GlassCard className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Low Stock Alert</h3>
              <p className="text-red-700">{lowStockItems.length} items need restocking</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.slice(0, 6).map((item, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                <div className="font-medium text-gray-900">{item.product_name}</div>
                <div className="text-sm text-gray-600">{item.variant_name}</div>
                <div className="text-sm text-red-600 font-medium">
                  Stock: {item.current_stock} / Min: {item.minimum_level}
                </div>
              </div>
            ))}
          </div>
          {lowStockItems.length > 6 && (
            <div className="mt-3 text-center">
              <GlassButton
                onClick={() => navigate('/inventory/low-stock')}
                variant="secondary"
                className="text-sm"
              >
                View All {lowStockItems.length} Items
              </GlassButton>
            </div>
          )}
        </GlassCard>
      )}

      {/* Filters and Search */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <SearchBar
                onSearch={setSearchQuery}
                placeholder="Search products, brands, models, SKUs..."
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Stock Levels</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              className="flex items-center gap-2"
            >
              <Grid size={16} />
              Grid
            </GlassButton>
            <GlassButton
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              className="flex items-center gap-2"
            >
              <List size={16} />
              List
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Products Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const stockStatus = getStockStatus(product);
            const totalStock = getTotalStock(product);
            const avgPrice = getAveragePrice(product);

            return (
              <GlassCard
                key={product.id}
                onClick={() => navigate(`/inventory/products/${product.id}`)}
                className="cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    <Package size={24} />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.status}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                {product.brand && (
                  <p className="text-sm text-gray-600 mb-2">{product.brand} {product.model}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Variants:</span>
                    <span className="font-medium">{product.variants?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Stock:</span>
                    <span className="font-medium">{totalStock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg Price:</span>
                    <span className="font-medium">
                      {avgPrice.toLocaleString('en-TZ', {
                        style: 'currency',
                        currency: 'TZS',
                        minimumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <GlassButton
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/inventory/products/${product.id}`);
                    }}
                    variant="secondary"
                    className="flex-1 text-sm"
                  >
                    <Eye size={14} />
                    View
                  </GlassButton>
                  <GlassButton
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/inventory/products/${product.id}/edit`);
                    }}
                    variant="secondary"
                    className="flex-1 text-sm"
                  >
                    <Edit size={14} />
                    Edit
                  </GlassButton>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Brand/Model</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Variants</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Total Stock</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Avg Price</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const stockStatus = getStockStatus(product);
                  const totalStock = getTotalStock(product);
                  const avgPrice = getAveragePrice(product);

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
                      onClick={() => navigate(`/inventory/products/${product.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                            <Package size={16} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            {product.product_code && (
                              <div className="text-xs text-gray-500">{product.product_code}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {product.brand} {product.model}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {product.category?.name || 'Uncategorized'}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {product.variants?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {totalStock}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {avgPrice.toLocaleString('en-TZ', {
                          style: 'currency',
                          currency: 'TZS',
                          minimumFractionDigits: 0
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inventory/products/${product.id}`);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="View Product"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inventory/products/${product.id}/edit`);
                            }}
                            className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                            title="Edit Product"
                          >
                            <Edit size={16} />
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
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <GlassCard className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first product to inventory'}
          </p>
          <GlassButton
            onClick={() => navigate('/inventory/new')}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Add Your First Product
          </GlassButton>
        </GlassCard>
      )}
    </div>
  );
};

export default InventoryPage;