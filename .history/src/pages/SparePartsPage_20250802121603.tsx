import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getSpareParts, 
  getSparePartStats,
  getLowStockSpareParts,
  getOutOfStockSpareParts,
  getSparePartCategories,
  getSparePartBrands,
  SparePart,
  SparePartStats
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
  Settings,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Shield,
  Battery,
  Smartphone,
  Speaker,
  Camera,
  Wifi,
  Cpu,
  MoreHorizontal,
  Mic,
  MessageCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SparePartUsageModal from '../components/SparePartUsageModal';
import { supabase } from '../lib/supabaseClient';

const SparePartsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [stats, setStats] = useState<SparePartStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [lowStockParts, setLowStockParts] = useState<SparePart[]>([]);
  const [outOfStockParts, setOutOfStockParts] = useState<SparePart[]>([]);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        partsData, 
        statsData, 
        categoriesData, 
        brandsData,
        lowStockData,
        outOfStockData
      ] = await Promise.all([
        getSpareParts(),
        getSparePartStats(),
        getSparePartCategories(),
        getSparePartBrands(),
        getLowStockSpareParts(),
        getOutOfStockSpareParts()
      ]);
      
      setSpareParts(partsData);
      setStats(statsData);
      setCategories(categoriesData);
      setBrands(brandsData);
      setLowStockParts(lowStockData);
      setOutOfStockParts(outOfStockData);
    } catch (error) {
      console.error('Error loading spare parts data:', error);
      toast.error('Failed to load spare parts data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'screen': return <Smartphone className="w-5 h-5" />;
      case 'battery': return <Battery className="w-5 h-5" />;
      case 'camera': return <Camera className="w-5 h-5" />;
      case 'speaker': return <Speaker className="w-5 h-5" />;
      case 'microphone': return <Mic className="w-5 h-5" />;
      case 'charging_port': return <Zap className="w-5 h-5" />;
      case 'motherboard': return <Cpu className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStockStatus = (part: SparePart) => {
    if (part.stock_quantity === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (part.stock_quantity <= part.min_stock_level) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  // Filter spare parts
  const filteredSpareParts = spareParts.filter(part => {
    const matchesSearch = searchQuery === '' || 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.part_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter;
    const matchesBrand = brandFilter === 'all' || part.brand === brandFilter;

    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'low' && part.stock_quantity <= part.min_stock_level) ||
      (stockFilter === 'out' && part.stock_quantity === 0) ||
      (stockFilter === 'in' && part.stock_quantity > part.min_stock_level);

    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading spare parts...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Spare Parts Management</h1>
          <p className="text-gray-600 mt-1">Manage your repair parts inventory and track usage</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => navigate('/spare-parts/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            <Plus size={18} />
            Add Spare Part
          </GlassButton>
          <GlassButton
            onClick={() => navigate('/spare-parts/import')}
            className="flex items-center gap-2"
          >
            <Upload size={18} />
            Import
          </GlassButton>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Parts</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.total_parts || 0}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Value</p>
              <p className="text-2xl font-bold text-green-900">
                {(stats?.total_value || 0).toLocaleString('en-TZ', {
                  style: 'currency',
                  currency: 'TZS',
                  minimumFractionDigits: 0
                })}
              </p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Categories</p>
              <p className="text-2xl font-bold text-purple-900">{stats?.total_categories || 0}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-900">{lowStockParts.length}</p>
            </div>
            <div className="p-3 bg-red-50/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <GlassCard className="bg-gradient-to-br from-red-50 via-red-100 to-orange-50 border-l-4 border-l-red-500 shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900 mb-1">Low Stock Alert</h3>
                <p className="text-red-700 font-medium">{lowStockParts.length} parts need immediate attention</p>
                <p className="text-sm text-red-600 mt-1">Consider reordering these items to maintain optimal stock levels</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-red-100 rounded-full">
                <span className="text-red-800 font-semibold text-sm">URGENT</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {lowStockParts.slice(0, 6).map((part, index) => (
              <div key={part.id} className="group relative bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-red-200 hover:border-red-300 transition-all duration-300 hover:shadow-md hover:scale-105">
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                </div>
                
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    {getCategoryIcon(part.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate group-hover:text-red-700 transition-colors">
                      {part.name}
                    </h4>
                    <p className="text-sm text-gray-600">{part.brand}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Current Stock</span>
                    <span className="text-sm font-bold text-red-600">{part.stock_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Min Required</span>
                    <span className="text-sm font-medium text-gray-700">{part.min_stock_level}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Stock Level</span>
                      <span>{Math.round((part.stock_quantity / part.min_stock_level) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((part.stock_quantity / part.min_stock_level) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 font-medium">Needs Reorder</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {lowStockParts.length > 6 && (
            <div className="flex items-center justify-between pt-4 border-t border-red-200">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Showing 6 of {lowStockParts.length} low stock items</span>
              </div>
              <GlassButton
                onClick={() => setStockFilter('low')}
                variant="primary"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              >
                View All {lowStockParts.length} Items
              </GlassButton>
            </div>
          )}
        </GlassCard>
      )}

      {/* Out of Stock Alert */}
      {outOfStockParts.length > 0 && (
        <GlassCard className="bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Out of Stock Alert</h3>
              <p className="text-orange-700">{outOfStockParts.length} parts are completely out of stock</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {outOfStockParts.slice(0, 6).map((part, index) => (
              <div key={part.id} className="bg-white p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(part.category)}
                  <div className="font-medium text-gray-900">{part.name}</div>
                </div>
                <div className="text-sm text-gray-600">{part.brand}</div>
                <div className="text-sm text-orange-600 font-medium">
                  Stock: {part.stock_quantity} / Min: {part.min_stock_level}
                </div>
              </div>
            ))}
          </div>
          {outOfStockParts.length > 6 && (
            <div className="mt-3 text-center">
              <GlassButton
                onClick={() => setStockFilter('out')}
                variant="secondary"
                className="text-sm"
              >
                View All {outOfStockParts.length} Items
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
                placeholder="Search parts, brands, part numbers..."
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
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>
                  {brand}
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

      {/* Spare Parts Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSpareParts.map(part => {
            const stockStatus = getStockStatus(part);

            return (
              <GlassCard
                key={part.id}
                onClick={() => navigate(`/spare-parts/${part.id}`)}
                className="cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    {getCategoryIcon(part.category)}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.status}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{part.name}</h3>
                {part.brand && (
                  <p className="text-sm text-gray-600 mb-2">{part.brand}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium">{part.stock_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">
                      {part.price.toLocaleString('en-TZ', {
                        style: 'currency',
                        currency: 'TZS',
                        minimumFractionDigits: 0
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{part.category}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <GlassButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPart(part);
                      setShowUsageModal(true);
                    }}
                    variant="secondary"
                    className="flex-1 text-sm"
                  >
                    <Package size={14} />
                    Use
                  </GlassButton>
                  <GlassButton
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/spare-parts/${part.id}/edit`);
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
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Part</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Brand</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Stock</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpareParts.map(part => {
                  const stockStatus = getStockStatus(part);

                  return (
                    <tr
                      key={part.id}
                      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
                      onClick={() => navigate(`/spare-parts/${part.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                            {getCategoryIcon(part.category)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{part.name}</div>
                            {part.part_number && (
                              <div className="text-xs text-gray-500">{part.part_number}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {part.brand || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 capitalize">
                        {part.category}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {part.stock_quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {part.price.toLocaleString('en-TZ', {
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
                              setSelectedPart(part);
                              setShowUsageModal(true);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Use Part"
                          >
                            <Package size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/spare-parts/${part.id}`);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="View Part"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/spare-parts/${part.id}/edit`);
                            }}
                            className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                            title="Edit Part"
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
      {filteredSpareParts.length === 0 && (
        <GlassCard className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No spare parts found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || categoryFilter !== 'all' || brandFilter !== 'all' || stockFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first spare part to inventory'}
          </p>
          <GlassButton
            onClick={() => navigate('/spare-parts/new')}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Add Your First Spare Part
          </GlassButton>
        </GlassCard>
      )}

      {/* Usage Modal */}
      {selectedPart && (
        <SparePartUsageModal
          isOpen={showUsageModal}
          onClose={() => {
            setShowUsageModal(false);
            setSelectedPart(null);
          }}
          sparePart={selectedPart}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};

export default SparePartsPage; 