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
  Mic
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  useEffect(() => {
    loadData();
  }, []);

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

  // Filter spare parts
  const filteredSpareParts = spareParts.filter(part => {
    const matchesSearch = searchQuery === '' || 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.part_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter;
    const matchesBrand = brandFilter === 'all' || part.brand === brandFilter;

    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'low' && part.stock_quantity <= part.min_stock_level) ||
      (stockFilter === 'out' && part.stock_quantity === 0) ||
      (stockFilter === 'in' && part.stock_quantity > 0);

    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

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
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (part.stock_quantity <= part.min_stock_level) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Spare Parts Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage repair parts inventory and track usage</p>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton
            onClick={() => navigate('/spare-parts/new')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Part
          </GlassButton>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Parts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_parts}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.total_value.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.low_stock_count}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.out_of_stock_count}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Filters and Search */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <SearchBar
              placeholder="Search parts by name, brand, or part number..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <GlassButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </GlassButton>
            
            <div className="flex items-center gap-2">
              <GlassButton
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </GlassButton>
              <GlassButton
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand
                </label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Status
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Stock</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

            {/* Spare Parts Grid/List View */}
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          {lowStockParts.length > 0 && (
            <GlassCard className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    {lowStockParts.length} parts need restocking
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Click to view low stock items
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
          
          {outOfStockParts.length > 0 && (
            <GlassCard className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {outOfStockParts.length} parts out of stock
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Urgent restocking required
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Parts Display */}
        {filteredSpareParts.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No spare parts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || categoryFilter !== 'all' || brandFilter !== 'all' || stockFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Get started by adding your first spare part'
              }
            </p>
            <GlassButton
              onClick={() => navigate('/spare-parts/new')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Part
            </GlassButton>
          </GlassCard>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredSpareParts.length} of {spareParts.length} parts
              </p>
              <div className="flex items-center gap-2">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                >
                  <RefreshCw className="w-4 h-4" />
                </GlassButton>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSpareParts.map((part) => (
                  <SparePartCard key={part.id} part={part} onRefresh={loadData} />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {filteredSpareParts.map((part) => (
                  <SparePartListItem key={part.id} part={part} onRefresh={loadData} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Spare Part Card Component
const SparePartCard: React.FC<{ part: SparePart; onRefresh: () => void }> = ({ part, onRefresh }) => {
  const navigate = useNavigate();
  const stockStatus = getStockStatus(part);
  
  return (
    <GlassCard className="p-6 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {getCategoryIcon(part.category)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {part.name}
            </h3>
            {part.brand && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{part.brand}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/spare-parts/${part.id}`)}
          >
            <Eye className="w-4 h-4" />
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/spare-parts/${part.id}/edit`)}
          >
            <Edit className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>

      <div className="space-y-3">
        {part.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {part.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
              {stockStatus.status}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {part.stock_quantity} in stock
            </span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 dark:text-white">
              ${part.price.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cost: ${part.cost.toFixed(2)}
            </p>
          </div>
        </div>

        {part.model_compatibility && part.model_compatibility.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {part.model_compatibility.slice(0, 3).map((model, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded"
              >
                {model}
              </span>
            ))}
            {part.model_compatibility.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded">
                +{part.model_compatibility.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => navigate(`/spare-parts/${part.id}/usage`)}
            className="flex-1"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Usage
          </GlassButton>
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => navigate(`/spare-parts/${part.id}/stock`)}
            className="flex-1"
          >
            <Package className="w-4 h-4 mr-1" />
            Stock
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
};

// Spare Part List Item Component
const SparePartListItem: React.FC<{ part: SparePart; onRefresh: () => void }> = ({ part, onRefresh }) => {
  const navigate = useNavigate();
  const stockStatus = getStockStatus(part);
  
  return (
    <GlassCard className="p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {getCategoryIcon(part.category)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {part.name}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                {stockStatus.status}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {part.brand && <span>Brand: {part.brand}</span>}
              {part.part_number && <span>Part #: {part.part_number}</span>}
              <span>Stock: {part.stock_quantity}</span>
              <span>Price: ${part.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/spare-parts/${part.id}`)}
          >
            <Eye className="w-4 h-4" />
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/spare-parts/${part.id}/edit`)}
          >
            <Edit className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
};

const getStockStatus = (part: SparePart) => {
  if (part.stock_quantity === 0) {
    return { status: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
  } else if (part.stock_quantity <= part.min_stock_level) {
    return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  } else {
    return { status: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
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

export default SparePartsPage; 