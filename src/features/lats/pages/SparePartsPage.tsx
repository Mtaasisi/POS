import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import LATSQuickActions from '../components/ui/LATSQuickActions';
import { 
  Package, Search, Plus, Grid, List, Filter, SortAsc, Download, Upload,
  AlertCircle, Edit, Eye, Trash2, Star, Tag, DollarSign, TrendingUp, 
  Activity, BarChart3, Settings, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Users, Crown, Calendar, RotateCcw, RefreshCw as RefreshCwIcon,
  Wrench, Tool, AlertTriangle, Minus, Plus as PlusIcon, History, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import spare parts forms
import SparePartForm from '../components/inventory/SparePartForm';
import SparePartUsageModal from '../components/inventory/SparePartUsageModal';

// Import database functionality
import { useInventoryStore } from '../stores/useInventoryStore';
import { format } from '../lib/format';
import { SparePart, SparePartUsage } from '../types/inventory';

const SparePartsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Database state management
  const { 
    spareParts, 
    sparePartUsage,
    categories,
    isLoading,
    error,
    loadSpareParts,
    loadSparePartUsage,
    loadCategories,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    useSparePart
  } = useInventoryStore();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'cost' | 'selling'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedSpareParts, setSelectedSpareParts] = useState<string[]>([]);

  // Form state
  const [showSparePartForm, setShowSparePartForm] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<SparePart | null>(null);
  const [selectedSparePartForUsage, setSelectedSparePartForUsage] = useState<SparePart | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadSpareParts();
    loadSparePartUsage();
    loadCategories();
  }, [loadSpareParts, loadSparePartUsage, loadCategories]);

  // Filter and sort spare parts
  const filteredSpareParts = React.useMemo(() => {
    const filtered = spareParts.filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || part.categoryId === selectedCategory;
      
      let matchesStock = true;
      switch (stockFilter) {
        case 'in-stock':
          matchesStock = part.quantity > part.minQuantity;
          break;
        case 'low-stock':
          matchesStock = part.quantity <= part.minQuantity && part.quantity > 0;
          break;
        case 'out-of-stock':
          matchesStock = part.quantity === 0;
          break;
      }
      
      return matchesSearch && matchesCategory && matchesStock;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'cost':
          aValue = a.costPrice;
          bValue = b.costPrice;
          break;
        case 'selling':
          aValue = a.sellingPrice;
          bValue = b.sellingPrice;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [spareParts, searchTerm, selectedCategory, stockFilter, sortBy, sortOrder]);

  // Handle spare part creation/editing
  const handleSaveSparePart = async (data: any) => {
    try {
      if (editingSparePart) {
        const response = await updateSparePart(editingSparePart.id, data);
        if (response.ok) {
          toast.success('Spare part updated successfully');
          setShowSparePartForm(false);
          setEditingSparePart(null);
        } else {
          toast.error(response.message || 'Failed to update spare part');
        }
      } else {
        const response = await createSparePart(data);
        if (response.ok) {
          toast.success('Spare part created successfully');
          setShowSparePartForm(false);
        } else {
          toast.error(response.message || 'Failed to create spare part');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  // Handle spare part deletion
  const handleDeleteSparePart = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this spare part?')) {
      try {
        const response = await deleteSparePart(id);
        if (response.ok) {
          toast.success('Spare part deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete spare part');
        }
      } catch (error) {
        toast.error('An error occurred');
      }
    }
  };

  // Handle spare part usage
  const handleUseSparePart = async (quantity: number, reason: string, notes?: string) => {
    if (!selectedSparePartForUsage) return;
    
    try {
      const response = await useSparePart(selectedSparePartForUsage.id, quantity, reason);
      if (response.ok) {
        toast.success('Spare part usage recorded successfully');
        setShowUsageModal(false);
        setSelectedSparePartForUsage(null);
      } else {
        toast.error(response.message || 'Failed to record spare part usage');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  // Get stock status
  const getStockStatus = (part: SparePart) => {
    if (part.quantity === 0) return { status: 'out-of-stock', color: 'text-red-500', bg: 'bg-red-100' };
    if (part.quantity <= part.minQuantity) return { status: 'low-stock', color: 'text-yellow-500', bg: 'bg-yellow-100' };
    return { status: 'in-stock', color: 'text-green-500', bg: 'bg-green-100' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      <div className="max-w-7xl mx-auto p-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Wrench className="text-blue-600" />
              Spare Parts Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage spare parts inventory, track usage, and monitor stock levels
            </p>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={() => {
                setEditingSparePart(null);
                setShowSparePartForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Spare Part
            </GlassButton>
          </div>
        </div>



        {/* Filters and Search */}
        <GlassCard className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <SearchBar
                onSearch={setSearchTerm}
                placeholder="Search spare parts..."
                className="w-full"
                suggestions={spareParts.map(sp => sp.name)}
                searchKey="spare_parts_search"
              />
            </div>

            {/* Category Filter */}
            <GlassSelect
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(category => ({
                  value: category.id,
                  label: category.name
                }))
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Select Category"
              className="min-w-[150px]"
            />

            {/* Stock Filter */}
            <GlassSelect
              options={[
                { value: 'all', label: 'All Stock' },
                { value: 'in-stock', label: 'In Stock' },
                { value: 'low-stock', label: 'Low Stock' },
                { value: 'out-of-stock', label: 'Out of Stock' }
              ]}
              value={stockFilter}
              onChange={setStockFilter}
              placeholder="Select Stock Status"
              className="min-w-[150px]"
            />

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="quantity">Quantity</option>
                <option value="cost">Cost Price</option>
                <option value="selling">Selling Price</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <SortAsc className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* View Mode */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Spare Parts Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSpareParts.map((part) => {
              const stockStatus = getStockStatus(part);
              return (
                <GlassCard key={part.id} className="hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{part.name}</h3>
                        <p className="text-sm text-gray-500">{part.partNumber}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status.replace('-', ' ')}
                      </div>
                    </div>

                    {/* Description */}
                    {part.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{part.description}</p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium">{getCategoryName(part.categoryId)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quantity:</span>
                        <span className={`font-medium ${part.quantity <= part.minQuantity ? 'text-red-600' : 'text-green-600'}`}>
                          {part.quantity} / {part.minQuantity} min
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Cost:</span>
                        <span className="font-medium">{format.currency(part.costPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Selling:</span>
                        <span className="font-medium">{format.currency(part.sellingPrice)}</span>
                      </div>
                      {part.location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Location:</span>
                          <span className="font-medium">{part.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <GlassButton
                        size="sm"
                        onClick={() => {
                          setSelectedSparePartForUsage(part);
                          setShowUsageModal(true);
                        }}
                        className="flex-1"
                      >
                        <Minus className="w-3 h-3" />
                        Use
                      </GlassButton>
                      <GlassButton
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSparePart(part);
                          setShowSparePartForm(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </GlassButton>
                      <GlassButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSparePart(part.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </GlassButton>
                    </div>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Part Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cost</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Selling</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpareParts.map((part) => {
                    const stockStatus = getStockStatus(part);
                    return (
                      <tr key={part.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{part.name}</div>
                            {part.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{part.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{part.partNumber}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{getCategoryName(part.categoryId)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${part.quantity <= part.minQuantity ? 'text-red-600' : 'text-green-600'}`}>
                            {part.quantity}
                          </span>
                          <div className="text-xs text-gray-500">min: {part.minQuantity}</div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{format.currency(part.costPrice)}</td>
                        <td className="py-3 px-4 text-sm font-medium">{format.currency(part.sellingPrice)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{part.location || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                            {stockStatus.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <GlassButton
                              size="sm"
                              onClick={() => {
                                setSelectedSparePartForUsage(part);
                                setShowUsageModal(true);
                              }}
                            >
                              <Minus className="w-3 h-3" />
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSparePart(part);
                                setShowSparePartForm(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </GlassButton>
                            <GlassButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSparePart(part.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
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
        )}

        {/* Empty State */}
        {filteredSpareParts.length === 0 && (
          <GlassCard className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spare parts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || stockFilter !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Get started by adding your first spare part'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && stockFilter === 'all' && (
              <GlassButton
                onClick={() => {
                  setEditingSparePart(null);
                  setShowSparePartForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Spare Part
              </GlassButton>
            )}
          </GlassCard>
        )}
      </div>

      {/* Spare Part Form Modal */}
      {showSparePartForm && (
        <SparePartForm
          sparePart={editingSparePart}
          onSave={handleSaveSparePart}
          onCancel={() => {
            setShowSparePartForm(false);
            setEditingSparePart(null);
          }}
        />
      )}

      {/* Usage Modal */}
      {showUsageModal && selectedSparePartForUsage && (
        <SparePartUsageModal
          sparePart={selectedSparePartForUsage}
          onUse={handleUseSparePart}
          onCancel={() => {
            setShowUsageModal(false);
            setSelectedSparePartForUsage(null);
          }}
        />
      )}
    </div>
  );
};

export default SparePartsPage;
